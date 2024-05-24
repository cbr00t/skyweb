(function() {
	window.SkyMESApp = class extends window.Prog {
		constructor(e) {
			super(e);

			const extLogin = this.extensions.login;
			const loginOpts = extLogin.options;
			loginOpts.isLoginRequired = false;
			
			$.extend(this, {
				parts: {},
				params: {},
				ozelParam: {},
				tazeleHandlers: {},
				signalHandlers: {},
				sonSyncTS: null,
				tazeleTimerProcAbortFlag: false,
				durumKod2Aciklama: {
					'': 'BOŞTA',
					'?': 'BELİRSİZ',
					'BK': 'BEKLEMEDE',
					'DV': 'DEVAM EDİYOR',
					'DR': 'MAKİNE DURDU',
					'AT': 'İŞ ATANDI',
					'PI': 'PERSONEL İSTENDİ',
					'PR': 'PERSONEL GİRİŞİ',
					'MI': 'MİKTAR İSTENDİ',
					'MK': 'MİKTAR GİRİŞİ',
					'BI': 'BİTTİ İSTENDİ',
					'KP': 'İŞ KAPANDI',
					'BT': 'İŞ BİTTİ'
				},
				statuHaricSet: asSet(['', 'BK', 'KP', 'BT'])
			});
		}
		
		static get rootAppName() { return 'skyMESApp' }
		static get appName() { return this.rootAppName }
		static get hatIzlememi() { return false }
		static get makineDurummu() { return false }
		static get wsURLBasePostfix() { return `` }
		/*static get wsPortRepeatCount() { return 0 }*/
		get appRootName() { return this.class.rootAppName }
		get defaultRootLayoutName() { return this.appName }
		get appText() { return 'VIO MES' }

		get otoSyncTimerSure() {
			let result = this._otoSyncTimerSure;
			if (result == null) {
				const {ozelParam, param} = this;
				result = qs.otoSyncTimerSure == null ? (ozelParam || {}).otoSyncTimerSure : qs.otoSyncTimerSure;
				if (result == null)
					result = (param || {}).otoSyncTimerSure;
				this._otoSyncTimerSure = result = result == null ? 1000 : asFloat(result);
			}
			return result;
		}
		/*get aktifBilgiTimerYokmu() {
			let result = this._aktifBilgiTimerYokmu;
			if (result == null) {
				const {ozelParam, param} = this;
				result = this.timerYokmu || qs.aktifBilgiTimerYok || qs.noAktifBilgiTimer || (ozelParam || {}).aktifBilgiTimerYok;
				if (result == null)
					result = (param || {}).aktifBilgiTimerYokmu;
				this._aktifBilgiTimerYokmu = result = asBool(result);
			}
			return result;
		}
		get otoSyncTimerSure() {
			let result = this._otoSyncTimerSure;
			if (result == null) {
				const {ozelParam, param} = this;
				result = qs.otoSyncTimerSure == null ? (ozelParam || {}).otoSyncTimerSure : qs.otoSyncTimerSure;
				if (result == null)
					result = (param || {}).otoSyncTimerSure;
				this._otoSyncTimerSure = result = result == null ? null : asFloat(result);
			}
			return result;
		}*/

		buildAjaxArgs(e) {
			e = e || {};
			return $.extend(super.buildAjaxArgs(e) || {}, {
				appUniqueId: this.appUniqueId || '', appName: this.class.appName,
				sonSyncTS: dateTimeToString(asDate(this.sonSyncTS)),
				ip: qs.ip || ''
			});
		}

		updateWSUrlBase(e) {
			return super.updateWSUrlBase({
				path: `ws/skyMES${this.class.wsURLBasePostfix}/`
			})
		}

		async ilkIslemler(e) {
			apiAuthKey = '';
			if (!wsPort)
				wsDefaultPort = sky.config.port = 8200;
			
			try { Utils.disableHistoryBack() }
			catch (ex) { }

			/*try {
				if (sky.globalCache)
					sky.globalCache.yukle(e);
			}
			catch (ex) { console.error(ex) }*/
			
			try {
				this.loadScriptsResultsPromise = new $.Deferred(d => {
					setTimeout(async e => {
						try { d.resolve(await this.loadInitialScripts(e)) }
						catch (ex) { d.reject(ex) }
					}, 100), e
				})
			}
			catch (ex) { console.error(ex) }

			if (!this.noFullScreenFlag) {
				try { requestFullScreen() }
				catch (ex) { }
			}

			await super.ilkIslemler(e);
		}

		async run(e) {
			await super.run(e);

			const {indicatorPart} = this;
			setTimeout(() => {
				if (indicatorPart && indicatorPart.lastStates.ajax == null)
					indicatorPart.ajaxCallback({ state: false });
			}, 100);

			(async () => {
				try { await this.paramYukle(e) }
				catch (ex) { defFailBlock(ex) }
				
				try { await this.tazele() }
				finally {
					setTimeout(() => this.tazeleTimerProc(), 500);
				}
			})();
			
			// await this.extensions.login.loginIslemi(e);
		}

		async afterRun(e) {
			await super.afterRun(e);

			await this.ortakReset();
			setTimeout(() => this.sonIslemler(e), 100);
		}

		async sonIslemler(e) {
			this.indicatorPart.ajaxCallback({ state: false });
			this.destroyWindows();
			// await this.ortakReset();
			
			const {indicatorPart} = this;
			if (!this.noFullScreenFlag) {
				try { requestFullScreen() }
				catch (ex) { }
			}
			if (this.programcimi) {
				setTimeout(
					() => displayMessage(`! ** <b>PROGRAMCI</b> ** modu aktif !`, `Bilgi`),
					3000);
			}

			const {loadScriptsResultsPromise} = this;
			if (loadScriptsResultsPromise) {
				(async () => {
					const result = await loadScriptsResultsPromise;
					const {initCallbacks} = this;
					if (!$.isEmptyObject(initCallbacks)) {
						for (let i in initCallbacks) {
							const _result = await initCallbacks[i];
							if (_result && $.isFunction(_result.run))
								await _result.run(e);
						}
					}
				})();
			}
			
			// setTimeout(() => ((window.savedProcs || {}).hideProgress || hideProgress)(), 1000);
		}

		async preInitLayout(e) {
			e = e || {};
			await super.preInitLayout(e);
			
			const layout = e.layout || this.layout;
			// $('body').css('overflow-y', 'auto');
			$(document).on('contextmenu', evt =>
				evt.preventDefault());

			const templatesOrtak = this.templatesOrtak = layout.find(`template#templatesOrtak`);
			const islemTuslari = this.islemTuslari = layout.find(`.header.islemTuslari`);
			this.background = layout.find(`#background`);
			const disForm = this.disForm = layout.find(`#disForm`);
			
			layout.find(`button`).jqxButton({ theme: theme });
			layout.find(`input[type=text], input[type=textbox]`)
				.on('focus', evt =>
					evt.target.select());
			
			const btnToggleFullScreen = this.btnToggleFullScreen = islemTuslari.find(`#btnToggleFullScreen`);
			btnToggleFullScreen.jqxButton({ theme: theme });
			btnToggleFullScreen.on('click', evt =>
				this.toggleFullScreen(e));

			const btnCacheReset = this.btnCacheReset = islemTuslari.find(`#btnCacheReset`);
			btnCacheReset
				.jqxButton({ theme: theme })
				.jqxTooltip({ theme: theme, trigger: `hover`, content: `Önbelleği temizle` })
				.on('click', evt => this.onbellekSilIstendi(e));

			const btnTazele = this.btnTazele = islemTuslari.find(`#btnTazele`);
			btnTazele.jqxButton({ theme: theme });
			btnTazele.on('click', evt =>
				this.tazele(e));
			
			const btnLogout = this.btnLogout = islemTuslari.find(`#btnLogout`);
			btnLogout
				.jqxButton({ theme: theme })
				.jqxTooltip({ theme: theme, trigger: `hover`, content: `Oturum kapat` })
				.on('click', evt => this.logoutIstendi());
		}

		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);

			const layout = e.layout || this.layout;
			this.destroyWindows();
		}

		async destroyPart(e) {
			e = e || {};
			const {activePart, islemTuslari} = this;
			if (activePart)
				await activePart.destroyPart(e);
			
			if (islemTuslari && islemTuslari.length) {
				islemTuslari
					.removeClass(`prog ${this.class.appName} ${this.class.rootAppName}`)
					.detach()
					.appendTo(this.layout);
			}
			
			await super.destroyPart(e);
			// await this.cleanUpWidgets(e);
		}
		
		activatePart(e) {
			this.cleanUpWidgets(e);

			super.activatePart(e);
		}

		setUpTimers(e) {
			super.setUpTimers(e);

			if (!this.timerYokmu) {
				/*const {timers} = this;
				timers.timersDisabledFlagReset = {
					delay: 20000, interval: true,
					block: e => {
						if (!this.timersDisabledFlag_noReset)
							this.timersDisabledFlag = false;
					}
				}
				
				if (!this.bostaPortBulTimerYokmu && !this.syncServerPort) {
					timers.bostaPortBul = {
						delay: 40000, interval: true, args: e,
						block: async e => {
							if (!(this.bostaPortBulTimerYokmu || this.timersDisabledFlag))
								await this.bostaPortBul(e);
						}
					};
				}*/
			}
		}

		ortakReset(e) {
			this.ortakReset_basit(e);
			this.ortakReset_diger(e);
		}

		ortakReset_basit(e) {
			/*const keys = [];
			for (const i in keys)
				delete this[keys[i]];*/
		}

		ortakReset_diger(e) {
			const keys = ['_programcimi', '_timerYokmu', '_bostaPortBulTimerYokmu'];
			for (const i in keys)
				delete this[keys[i]];
		}

		async onbellekOlustur(e) {
			await this.doInitialFetches();
		}
		
		async doInitialFetches(e) {
			e = e || {};
			const urls = [
				`appBase/part/knobProgress.html`,
				`./manifest.php`,
				`images/logout.png`,
				`images/sec.png`,
				`images/tamam.png`,
				`images/kaydet.png`,
				`images/yeni.png`,
				`images/degistir.png`,
				`images/sil.png`,
				`images/temizle.png`,
				`images/kopyala.png`
			];

			const promises = [];
			for (let i in urls) {
				const url = urls[i];
				promises.push(Utils.ajaxDoWithCache({ url: url }))
			}
			return await Promise.all(promises);
		}

		async loadInitialScripts() {
			if (!navigator.onLine)
				return null;

			const {hostName} = sky.config;
			if (!hostName)
				return null;
			
			const promises = [];
			const ports = [8200, 81, 80, 82];
			const {appName} = this;
			for (let i in ports) {
				const port = ports[i];
				const urls = [];
				const hostNameSet = {};
				if (location.hostname != 'localhost' && location.hostname != '127.0.0.1') {
					urls.push(`http://${location.hostname}:${port}/${appName}.override.js`);
					hostNameSet[location.hostname] = true;
				}
				if (!(hostNameSet.localhost || hostNameSet['127.0.0.1']))
					urls.push(`http://localhost:${port}/${appName}.override.js`);
				if (!hostNameSet[hostName] && (hostName != 'localhost' && hostName != '127.0.0.1'));
					urls.push(`http://${hostName}:${port}/${appName}.override.js`);
				
				let timeout = 2500;
				for (let j in urls) {
					const url = urls[j];
					lastAjaxObj = $.get({
						timeout: timeout, dataType: 'script',
						url: `${url}`
					});
					promises.push(lastAjaxObj);
					timeout += 200;
				}
			}
			
			if (navigator.onLine) {
				const results = [];
				for (let i in promises) {
					try {
						let result = await promises[i];
						if (result)
							results.push(result);
					}
					catch (ex) { }
				}
				return results;
			}
			
			return null;
		}
		
		/*toggleRestPraIstendi(e) {
			const {pratikSatismi} = this.class;
			const {sessionInfo} = sky.config;
			const replace = pratikSatismi
					? { from: `SkyCafePratikApp`, to: `SkyCafeRestApp` }
					: { from: `SkyCafeRestApp`, to: `SkyCafePratikApp` };
			
			let url = location.href.replace(replace.from, replace.to);
			if (!url.includes(`loginTipi=`) && !url.includes(`sessionMatch=`))
				url += `&loginTipi=${sessionInfo.loginTipi || ''}`;
			if (!url.includes(`user=`))
				url += `&user=${sessionInfo.user || ''}`;
			if (!url.includes(`pass=`))
				url += `&pass=${sessionInfo.pass || ''}`;
			if (url.includes(`#nbb`))
				url = url.replace(`&#nbb`, ``);
			if (!url.endsWith(`&`))
				url += `&`;
			
			((window.savedProcs || {}).showProgress || showProgress)(null, null, 1);
			setTimeout(() => location.href = url, 300);
			// setTimeout(() => ((window.savedProcs || {}).hideProgress || hideProgress)(), 8000);
			
			return true;
		}*/

		async paramYukle(e) {
			if (this.class.isTest) {
				return { sonSyncTS: now() };
			}
			
			let rec = await this.wsGetParams();
			if (rec)
				this.params = rec;

			const {sessionInfo} = sky.config;
			let {dbName} = sessionInfo;
			if (!dbName) {
				rec = await this.wsGetSessionInfo();
				dbName = rec.dbName;
			}
			
			if (dbName)
				this.appTitleText += ` [${dbName}]`;
		}

		async gerekirseTazele(e) {
			const {timersDisabledFlag, timerYokmu, otoSyncTimerSure} = this;
			if (!(timersDisabledFlag || !timerYokmu || !otoSyncTimerSure || otoSyncTimerSure < 0))
				return await this.tazele(e);

			return { isError: false, rc: 'cancelled' };
		}

		async tazele(e) {
			e = e || {};
			this.timersDisabledFlag = true;
			try {
				try { await this.tazeleDevam(e) }
				finally { this.sonSyncTS = now() }
			}
			finally { delete this.timersDisabledFlag }

			const {tazeleHandlers} = this;
			if (tazeleHandlers) {
				for (const i in tazeleHandlers) {
					const handler = tazeleHandlers[i];
					if (handler) {
						const _e = e;
						if ($.isFunction(handler))
							handler.call(this, _e);
						else if (handler.run)
							handler.run(_e);
					}
				}
			}
			if (!e.sync)
				this.signalChange();
		}

		async tazeleDevam(e) {
			// debugger;
		}

		async tazeleTimerProc(e) {
			if (this.timerYokmu)
				return;
			
			const _e = $.extend({}, e, { sync: true });
			while (!this.tazeleTimerProcAbortFlag) {
				const {timersDisabledFlag, otoSyncTimerSure} = this;
				if (!(timersDisabledFlag || !otoSyncTimerSure || otoSyncTimerSure < 0)) {
					if (!this.timersDisabledFlag && (this.otoSyncTimerSure || 0) > 0) {
						try { await this.tazele(_e) }
						catch (ex) { }
					}
				}
				if ((otoSyncTimerSure || 0) > 0) {
					await new Promise(resolve =>
						setTimeout(() => resolve(), otoSyncTimerSure));
				}
			}
		}

		async signalChange(e) {
			const {signalHandlers} = this;
			if (signalHandlers) {
				for (const i in signalHandlers) {
					const handler = signalHandlers[i];
					if (handler) {
						const _e = e;
						if ($.isFunction(handler))
							handler.call(this, _e)
						else if (handler.run)
							handler.run(_e)
					}
				}
			}
		}

		async wsGetSessionInfo(e) {
			if (this.class.isTest)
				return { isError: false, result: {} };
			
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}getSessionInfo/?${$.param(this.buildAjaxArgs())}`
			});
			const result = (await lastAjaxObj) || {};
			return result;
		}

		async wsGetParams(e) {
			if (this.class.isTest)
				return { isError: false, result: {} };
			
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}params/?${$.param(this.buildAjaxArgs())}`
			});
			const result = (await lastAjaxObj) || {};
			return result;
		}

		async wsPersoneller(e) {
			if (this.class.isTest) {
				return [
					{ kod: 'a', aciklama: 'b'},
					{ kod: 'c', aciklama: 'd'}
				];
			}
			
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}personeller/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {};
			return result;
		}

		async wsPersonelAta(e) {
			if (this.class.isTest) {
				return { isError: false, result: true };
			}
			
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}personelAta/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {};
			return result;
		}

		async wsEkBilgiAta(e) {
			if (this.class.isTest) {
				return { isError: false, result: true };
			}
			
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}ekBilgiAta/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {};
			return result
		}

		async wsEkBilgiTopluSifirla(e) {
			if (this.class.isTest) {
				return { isError: false, result: true };
			}
			
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}wsEkBilgiTopluSifirla/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {};
			return result
		}

		initKlavyePart(e) {
			e = e || {};
			let {klavyePart} = this;
			if (klavyePart) {
				klavyePart.open(e);
				return;
			}

			klavyePart = this.klavyePart = new SkyMESKlavyePart({
				tip: 'text', canClose: true, opacity: 1,
				title: e.title, position: e.position, size: e.size,
				events: {
					tusTiklandi: e =>
						this.klavye_tusTiklandi(e)
				}
			});
			klavyePart.open(e);
			return klavyePart;
		}

		initNumKlavyePart(e) {
			e = e || {};
			let {numKlavyePart} = this;
			if (numKlavyePart) {
				numKlavyePart.open(e);
				return;
			}
			
			const {activePart} = this;
			numKlavyePart = this.numKlavyePart = new SkyMESKlavyePart({
				tip: 'numerik', canClose: true, opacity: .93,
				title: e.title, position: e.position, size: e.size,
				events: {
					tusTiklandi: e =>
						this.klavye_tusTiklandi(e)
				}
			});
			numKlavyePart.open(e);
			return numKlavyePart;
		}

		closeKlavyePart(e) {
			const {klavyePart} = this;
			if (klavyePart)
				klavyePart.close(e);
		}

		closeNumKlavyePart(e) {
			const {numKlavyePart} = this;
			if (numKlavyePart)
				numKlavyePart.close(e);
		}

		klavye_tusTiklandi(e) {
			const {activePart} = this;
			let result;
			if (activePart && activePart.klavye_tusTiklandi)
				result = activePart.klavye_tusTiklandi(e);
			
			if (result)
				return result;
			
			const {activeElement} = document;
			const {sender, id, event} = e;
			const {activeWnd, activeWndPart, miktarDuzenleniyorFlag} = this;
			const {commaFlag, lastActiveElement} = sender;
			const isGrid = activeElement.classList.contains(`jqx-datatable`);
			const numerikmi = !sender.textOnly && (sender.tip == 'numerik' || (activeElement && (activeElement.classList.contains(`jqx-numberinput`) || activeElement.parentElement.classList.contains(`jqx-numberinput`))));
			let hasOpenLayout = (activeWnd && activeWndPart && activeElement) || 
				(activeElement && (activeElement.tagName.toUpperCase() == 'INPUT'
						/*&& !activeElement.classList.contains(`jqx-combobox-input`)*/));
			// barkodUI için Miktar (nümerik) klavyeyi önle
			if (hasOpenLayout && numerikmi && activeElement.classList.contains(`jqx-combobox-input`))
				hasOpenLayout = false;
			
			const $activeElement = $(activeElement);
			if (numerikmi && (id == '.' || id == ',')) {
				sender.commaFlag = true;
			}
			else {
				let text;
				if (!lastActiveElement || lastActiveElement != activeElement) {
					text = '';
				}
				else {
					let value;
					if (isGrid) {
						const widget = $activeElement.jqxDataTable('getInstance');
						const uid = widget._lastSelectedKey;
						const {clickedTD} = widget;
						if (uid != null && clickedTD) {
							const col = widget.columns.records[$(clickedTD).index()];
							const {datafield} = col;
							value = widget.getCellValueByKey(uid, datafield);
							if (typeof value == 'number' && (id == '.' || id == ',')) {
								sender.commaFlag = true;
								setTimeout(() => activeElement.focus(), 5);
								return;
							}
						}
					}
					else {
						value = activeElement.value;
					}
					
					text = (numerikmi
									? asFloat(value) || ''
									: value || ''
								).toString();
				}
				sender.lastActiveElement = activeElement;

				const lastText = text;
				switch (id) {
					case 'enter':
						if (hasOpenLayout && activeWndPart && activeWndPart.tamamIstendi) {
							activeWndPart.tamamIstendi(e);
						}
						else {
							this.tazele(e);
						}
						break;
					case 'backspace':
						if (!commaFlag && text)
							text = text.slice(0, -1);
						break;
					case 'space':
						if (!commaFlag)
							text += ' ';
						break;
					case 'clear':
						text = '';
						break;
					default:
						if (commaFlag) {
							if (!text)
								text += '0';
							text += '.';
						}
						text += id;
						break;
				}
				sender.commaFlag = false;

				if (!text || text != lastText) {
					let value = numerikmi
									? roundToFra(asFloat(text), hasOpenLayout && activeElement.id == 'fiyat' ? 4 : 3) || ''
									: text || '';
					if (numerikmi && !value)
						value = '';
						// value = '0';
					if (isGrid) {
						const widget = $activeElement.jqxDataTable('getInstance');
						if (!widget.disabled && widget.editable !== false) {
							const uid = widget._lastSelectedKey;
							const {clickedTD} = widget;
							if (uid != null && clickedTD) {
								const ri = widget.rowinfo[uid];
								if (!(ri && ri.locked)) {
									const col = widget.columns.records[$(clickedTD).index()];
									if (col.editable !== false) {
										const {datafield} = col;
										widget.setCellValueByKey(uid, datafield, value);
										const {activeWndPart} = this;
										if (activeWndPart) {
											if (activeWndPart.liste_cellEndEdit) {
												const rowIndex = widget.getrowindex(ri.row)
												activeWndPart.liste_cellEndEdit({ fromKlavye: true, event: { args: { key: uid, dataField: datafield, index: rowIndex, boundIndex: rowIndex }} })
											}
											else if (activeWndPart.toplamTazele) {
												activeWndPart.toplamTazele(e);
											}
										}
									}
								}
							}
						}
					}
					else {
						activeElement.value = value;
					}
					$activeElement.trigger('change');
					$activeElement.trigger('keyup');

					if (activeElement.classList.contains(`jqx-input`))
						setTimeout(() => $(activeElement).jqxInput('open'), 500);
					else if (activeElement.classList.contains(`jqx-combobox`))
						setTimeout(() => $(activeElement).jqxComboBox('open'), 500);
				}
			}
			
			//if (hasOpenLayout)
			setTimeout(() => activeElement.focus(), 10);
			if (miktarDuzenleniyorFlag)
				this.miktarDuzenleniyorFlag = true;
		}

		async signalChangeExternal(e) {
			const promise = this.signalChange(e);
			// this.gerekirseTazele(e);
			return promise
		}

		async onResize(e) {
			await super.onResize(e);

			const {activeWnd, activeWndPart} = this;
			if (activeWnd && activeWndPart && !activeWndPart.isDestroyed && activeWndPart.onResize)
				await activeWndPart.onResize(e)

			// this.parent.width($(window).width())
		}
	}
})()
