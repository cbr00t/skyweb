(function() {
	/*
		await new SkyConfigTextInputPart({
			title: 'title',
			baslikText: 'baslikText',
			value: 'value',
			tamamIslemi: e =>
				console.info(e.value),
			geriCallback: e =>
				console.warn(e)
		}).open()
	*/
	
	window.SkyConfigDurumPart = class extends window.SkyConfigInnerPartWithTabs {
		constructor(e) {
			e = e || {};
			super(e);
		}

		static get partName() { return 'durum' }

		static get reservedConfigKeys() {
			let result = this._reservedConfigKeys;
			if (!result) {
				result = this._reservedConfigKeys = asSet([
					'config', 'tip', 'name', 'id', 'parentID', 'gorevID', 'gorev', 'timerVarmi', 'aciklama'
				]);
			}
			
			return result;
		}
		
		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);
		}

		async initTabContent(e) {
			await super.initTabContent(e);

			const {tabID} = e;
			switch (tabID) {
				case 'servisler':
					return await this.initTabContent_servisler(e);
			}
		}

		async initTabContent_servisler(e) {
			const {tabPage} = e;
			$.extend(this, {
				tblServisler: tabPage.find(`table#servisler`),
				template_servisGrupSatir: tabPage.find(`template#servisGrupSatir`),
				template_servisSatir: tabPage.find(`template#servisSatir`)
			});
		}

		async tazele(e) {
			await super.tazele();
			this.tazele_servisler(e);
		}

		async tazele_servisler(e) {
			const {app, tblServisler} = this;
			if (!(tblServisler && tblServisler.length))
				return;

			let promises = this.promises_tazele_servisler;
			if (!$.isEmptyObject(promises)) {
				for (const key in promises) {
					const promise = promises[key];
					if (!promise)
						continue;
					if (promise.abort)
						promise.abort();
					else if (promise.reject)
						promise.reject({ isError: false, rc: 'userAbort' });
					try { await promise }
					catch (ex) { }
					abortLastOperation();
				}
				promises = this.promises_tazele_servisler = null;
			}
			
			promises = this.promises_tazele_servisler = {
				sessionInfo: app.wsGetSessionInfo(),
				cvmStatus: app.wsGetCVMStatus(),
				subServices: app.wsGetSubServices()
			};
			const grupId2Satir = this.grupId2Satir = {};
			let parent = $(document.createDocumentFragment());
			let seq = 0;
			let grup = { id: 'temel', aciklama: `Temel Servisler`, islemTuslariYok: false };
			this.tblServisler_satirEkle({
				parent: parent, grup: grup, index: ++seq, id: 'skyWS', aciklama: `Sky WebServis`
			});
			this.tblServisler_satirEkle({
				parent: parent, grup: grup,index: ++seq, id: 'cvm', aciklama: `Vio CVM Hizmeti`
			});

			const tr = tblServisler.find(`tr.item`);
			if (tr && tr.length)
				tr.attr('data-durum', '');

			const pSeq = { seq: seq };
			promises.sessionInfo
				.then(result => this.wsSessionInfo_onResponse($.extend({}, e, { parent: parent, pSeq: pSeq, isError: result.isError || false, result: result })))
				.catch(result => this.wsSessionInfo_onResponse($.extend({}, e, { parent: parent, pSeq: pSeq, isError: true, result: result })));
			promises.cvmStatus
				.then(result => this.wsGetCVMStatus_onResponse($.extend({}, e, { parent: parent, pSeq: pSeq, isError: result.isError || (result || {}).cvmStatus == 'error', result: (result || {}).cvmStatus })))
				.catch(result => this.wsGetCVMStatus_onResponse($.extend({}, e, { parent: parent, pSeq: pSeq, isError: true, result: result })));
			promises.subServices
				.then(result => this.wsGetSubServices_onResponse($.extend({}, e, { parent: parent, pSeq: pSeq, isError: result.isError || false, result: result })))
				.catch(result => this.wsGetSubServices_onResponse($.extend({}, e, { parent: parent, pSeq: pSeq, isError: true, result: result })));

			try {
				for (const key in promises) {
					try { await promises[key] }
					catch (ex) { console.error(ex) }
				}
			}
			finally {
				promises = this.promises_tazele_servisler = null;
				
				(() => {
					const {grupId2Satir} = this;
					grupId2Satir.temel.children(`td`).children(`.islemTuslari`).children(`:not(#ekle)`).addClass(`basic-hidden`);
					
					const subTR = parent.find(`tr#skyWS.item`);
					if (subTR && subTR.length) {
						const islemTuslari = subTR.children(`td`).children(`.islemTuslari`);
						if (islemTuslari && islemTuslari.length)
							islemTuslari.find(`button:not(#restart)`).addClass(`basic-hidden`);
					}
				})();
				
				tblServisler.find(`tr.item, tr.item-group`).remove();
				tblServisler.find(`document-fragment`).remove();
				tblServisler.append(parent);
				parent = tblServisler;
				this.initButtonEvents(e);
			}
		}

		tblServisler_satirEkle(e) {
			const {app, template_servisSatir, grupId2Satir} = this;
			const {index, id, grup, tip, args, ekAciklama, aciklamaPostFix, durum, islemTuslariYok} = e;
			const grupID = e.grupID || e.grupId || (grup ? grup.id : null);
			
			let {aciklama} = e;
			if (!aciklama && tip)
				aciklama = app.servisTip2Aciklama[tip];
			if (aciklamaPostFix)
				aciklama = (aciklama || '') + aciklamaPostFix;
			if (ekAciklama) {
				const html = `<div class="ek-aciklama ekBilgi">${ekAciklama}</div>`;
				aciklama = aciklama ? aciklama + ` ${html}` : html;
			}
			
			let grupAciklama = e.grupAciklama == null ? (grup ? grup.aciklama : null) : e.grupAciklama;
			const grupEkAciklama = e.grupEkAciklama == null ? (grup ? grup.ekAciklama : null) : e.grupEkAciklama;
			if (grupEkAciklama) {
				const html = `<span class="ek-aciklama ekBilgi">${grupEkAciklama}</span>`;
				grupAciklama = grupAciklama ? grupAciklama + ` ${html}` : html;
			}
			const grupIslemTuslariYok = e.grupIslemTuslariYok == null ? (grup ? grup.islemTuslariYok : null) : e.grupIslemTuslariYok;
			
			let {parent} = e;
			if (grupID) {
				let trGrup = grupId2Satir[grupID];
				if (!(trGrup && trGrup.length)) {
					const {template_servisGrupSatir} = this;
					trGrup = template_servisGrupSatir.contents('tr').clone(true);
					trGrup.prop('id', id);
					trGrup.find(`#aciklama`).html(grupAciklama || '');
					if (grupIslemTuslariYok) {
						const islemTuslari = trGrup.find(`.islemTuslari`);
						if (islemTuslari && islemTuslari.length)
							islemTuslari.remove();
					}
					grupId2Satir[grupID] = trGrup;
					parent.append(trGrup);
				}
				parent = trGrup.find(`.item-group-detay`);
			}
			
			const tr = template_servisSatir.contents('tr').clone(true);
			tr.prop(`id`, id);
			tr.addClass(`item`);
			if (index != null && index > -1)
				tr.attr(`data-row`, index);
			if (tip)
				tr.attr('data-tip', tip);
			if (args)
				tr.attr('data-args', toJSONStr(args));
			if (aciklama != null)
				tr.find(`#aciklama`).html(aciklama);
			if (durum != null)
				tr.attr('data-durum', durum);
			if (islemTuslariYok) {
				const islemTuslari = tr.find(`.islemTuslari`);
				if (islemTuslari && islemTuslari.length)
					islemTuslari.children().remove();
			}
			parent.append(tr);
			
			return tr;
		}

		initButtonEvents(e) {
			const {tblServisler} = this;
			const buttons = tblServisler.find(`tr td .islemTuslari button, tr td .islemTuslari-ek button`);
			if (buttons.length) {
				buttons
					.jqxButton({ theme: theme })
					.off('click')
					.on('click', evt => {
						const target = evt.currentTarget;
						let rec = $(target).parents(`tr.item`);
						if (!(rec && rec.length))
							rec = $(target).parents(`tr.item-group`);
						let index = rec.data('row');
						index = index == null ? null : asInteger(index);
						const parentID = rec.prop('id');
						this.servisIslemTusuTiklandi({
							event: evt, id: target.id, index: index,
							parentID: parentID, rec: rec
						})
					});
			}
		}

		wsSessionInfo_onResponse(e) {
			const {isError, result, parent} = e;
			const {tblServisler} = this;
			if (!(tblServisler && tblServisler.length))
				return;
			
			let tr = parent.find(`tr.item#skyWS`);
			if (tr && tr.length)
				tr.attr('data-durum', isError ? 'error' : 'running');
		}

		wsGetCVMStatus_onResponse(e) {
			const {isError, result, parent} = e;
			const {tblServisler} = this;
			if (!(tblServisler && tblServisler.length))
				return;
			
			let tr = parent.find(`tr.item#cvm`);
			if (tr && tr.length) {
				const durum =
					isError || result == 'broken'
						? 'error'
						: result == 'running' ? 'running' : 'stopped';
				tr.attr('data-durum', durum);
			}
		}

		wsGetSubServices_onResponse(e) {
			const {app, tblServisler} = this;
			if (!(tblServisler && tblServisler.length))
				return;

			const promises = this.promises_tazele_servisler;
			if (promises && promises.subServices) {
				const promise = promises.subServices;
				if (promise) {
					if (promise.abort)
						promise.abort();
					else if (promise.reject)
						promise.reject({ isError: true, rc: 'userAbort' });
				}
			}

			return this.wsGetSubServices_onResponseDevam(e);

			/*if (this.timer_onResponse)
				clearTimeout(this.timer_onResponse);
			this.timer_onResponse = setTimeout( e => {
				try { this.wsGetSubServices_onResponseDevam(e) }
				finally { delete this.timer_onResponse }
			}, 1000, e);*/
		}

		wsGetSubServices_onResponseDevam(e) {
			const {app, tblServisler} = this;
			if (!(tblServisler && tblServisler.length))
				return;

			const {isError, result, parent, pSeq} = e;
			if (isError) {
				const error = (result || {}).responseJSON || result;
				if ((result || {}).status !== 0 && (error.rc || error.code) != 'accessDenied' && (result || {}).statusText != 'abort')
					defFailBlock(result);
				abortLastOperation();
				return;
			}
			
			const {reservedConfigKeys} = this.class;
			const id2SubServices = this.id2SubServices = {};
			for (const key in result) {
				const subResult = result[key];
				const {id} = subResult;
				id2SubServices[id] = subResult;
				
				const tip = subResult.tip || subResult.name;
				const {aciklama, config} = subResult;
				const gorev = subResult.gorev || config.gorev;
				/*const html_grupIslemTuslari = (
					`<div class="islemTuslari">` +
					`	<button id="baslat">B</button>` +
					`	<button id="durdur">D</button>` +
					`</div>`
				);*/

				let grupEkAciklama = '';
				let ekAciklama = '';
				let altBilgiOlustur = _e => {
					const {source} = _e;
					let target = '';
					for (const key in source) {
						if (reservedConfigKeys[key])
							continue;
						let value = source[key];
						if (typeof value == 'boolean')
							value = value ? 'evet' : 'hayır';
						else if ($.isArray(value)) {
							if (key == 'query')
								value = value.map(item => item.query);
							value = $.isEmptyObject(value) ? null : value.join(' ; ');
						}
						else if (typeof value == 'object') {
							target += altBilgiOlustur({ source: value });
							continue;
						}
						if (!value)
							continue;
	
						target += (
							`<div class="config-item ekBilgi">` +
							`	<span class="_etiket">${key}:</span>` +
							`	<span class="_veri bold">${value}</span>` +
							`</div>`
						);
					}
					return target;
				};
				ekAciklama += `<div class="config">`;
				ekAciklama += altBilgiOlustur({ source: config });
				ekAciklama += `</div>`;
				if (gorev) {
					let altBilgiOlustur = _e => {
						const {source} = _e;
						let target = '';
						for (const key in source) {
							if (reservedConfigKeys[key])
								continue;
							let value = source[key];
							if (typeof value == 'boolean')
								value = value ? 'evet' : 'hayır';
							else if ($.isArray(value))
								value = $.isEmptyObject(value) ? null : value.join(' ; ');
							else if (typeof value == 'object') {
								target += altBilgiOlustur({ source: value });
								continue;
							}
							if (!value)
								continue;
		
							target += (
								`<div class="gorev-item ekBilgi">` +
								`	<span class="_etiket">${key}:</span>` +
								`	<span class="_veri bold">${value}</span>` +
								`</div>`
							);
						}
						return target;
					};
						
					let html_gorev = `<div class="gorev">`;
					html_gorev += altBilgiOlustur({ source: gorev });
					html_gorev += `</div>`;
					
					if (ekAciklama)
						ekAciklama += "<div/>";
					ekAciklama += html_gorev;
				}

				// const isRunning = gorev ? subResult.isWorkerRunning : subResult.isProcessRunning;
				/*const durum =
					subResult.isWorkerRunning || (subResult.temp && subResult.isProcessRunning)
						? subResult.durum || ( (subResult.isProcessRunning == subResult.isProcessResponding) ? 'running' : 'error' )
						: gorev
							? gorev.durum == 'running'
								? 'running'
								: gorev.timerVarmi ? 'stopped' : 'error'
							: 'stopped';*/
				const durum =
					subResult.gorev
						// ? gorev.durum == 'running' ? gorev.durum : (gorev.timerVarmi ? 'stopped' : 'error')
						? gorev.durum
						: subResult.durum || ( (subResult.isProcessRunning == subResult.isProcessResponding) ? 'running' : 'error' );

				let aciklamaPostFix = '';
				if (gorev)
					aciklamaPostFix += `<span class="gorev-uyari ekBilgi">(görev)</span>`;
				
				pSeq.seq++;
				/*const grup = gorev
					? { id: 'servisGorev', aciklama: `Vio Servis Görevi`, islemTuslariYok: false }
					: { id: 'servis', aciklama: `Vio Servisleri`, islemTuslariYok: false };*/
				const grup = app.servisTip2Grup[tip] || { id: 'servis', aciklama: `Vio Servisleri` };
				grup.ekAciklama = grupEkAciklama;
				const tr = this.tblServisler_satirEkle({
					parent: parent, grup: grup, index: pSeq.seq,
					id: id, tip: tip, aciklama: aciklama, args: config, aciklamaPostFix: aciklamaPostFix,
					ekAciklama: ekAciklama, durum: durum, islemTuslariYok: false
				});
				if (gorev)
					tr.addClass('gorev');
				else
					tr.addClass('servis');
				tr.addClass('servis-gorev');
				
				const islemTuslari = tr.children(`td`).children(`.islemTuslari`);
				// islemTuslari.children().remove();
				islemTuslari.append(
					$(
						`<button id="degistir">D</button>` +
						`<button id="sil">S</button>`
					)
				);
			}

			(() => {
				const {grupId2Satir} = this;
				const tr = grupId2Satir.servis || grupId2Satir.temel;
				const islemTuslari = tr.children(`td`).children(`.islemTuslari`);
				islemTuslari.append(
					 $(
						`<button id="ekle">+</button>`
					 )
				);
			})();

			(() => {
				const tr = parent.find(`tr.item#skyWS`);
				if (tr && tr.length)
					tr.attr('data-durum', isError ? 'stopped' : 'running');
			})();

			this.initButtonEvents(e);
		}
		

		async servisIslemTusuTiklandi(e) {
			const {id, parentID, event} = e;
			const {currentTarget} = event || {};
			let servisVeyaGorevmi = false;
			if (currentTarget) {
				servisVeyaGorevmi = $(currentTarget).parents('tr').hasClass('servis-gorev');
				currentTarget.blur();
				setButonEnabled($(currentTarget), false);
			}
			e.servisVeyaGorevmi = servisVeyaGorevmi;

			const {tblServisler} = this;
			// const tr = tblServisler.find(`tr.item#${parentID}`);
			// const tr = tblServisler.find(`tr.item#${parentID}`).parent().find(`tr.item`);
			const trAll = tblServisler.find(`tr.item`);
			
			/*await (((window.savedProcs || {}).showProgress || showProgress)('', '', 1));*/

			await this.clearUniqueTimeout({ key: 'otoTazele' });
			this.setUniqueTimeout({
				key: 'otoTazele',
				delayMS: 1500,
				block: async () => {
					/*await this.clearUniqueTimeout({ key: 'hideProgress' });
					await this.setUniqueTimeout({
						key: 'hideProgress',
						delayMS: 1000,
						block: async () =>
							await (((window.savedProcs || {}).hideProgress || hideProgress)('', '', 1))
					});*/
					await this.tazele(e);
				}
			});
			
			try {
				switch (id) {
					case 'baslat':
						if (trAll && trAll.length)
							trAll.attr('data-durum', '');
						return await this.servisBaslatIstendi(e);
					case 'durdur':
						if (trAll && trAll.length)
							trAll.attr('data-durum', '');
						return await this.servisDurdurIstendi(e);
					case 'restart':
						if (trAll && trAll.length)
							trAll.attr('data-durum', '');
						return await this.servisRestartIstendi(e);
					case 'ekle':
						return await this.servisEkleIstendi(e);
					case 'degistir':
						return await this.servisDegistirIstendi(e);
					case 'sil':
						return await this.servisSilIstendi(e);
				}
			}
			finally {
				await this.clearUniqueTimeout({ key: 'otoTazele' });
				await this.setUniqueTimeout({
					key: 'otoTazele',
					delayMS: 3000,
					block: async () => {
						await this.tazele(e);
					}
				});
				if (currentTarget) {
					currentTarget.blur();
					setButonEnabled($(currentTarget), true);
				}
				/*await this.setUniqueTimeout({
					key: 'hideProgress',
					delayMS: 500,
					block: async () =>
						await (((window.savedProcs || {}).hideProgress || hideProgress)('', '', 1))
				});*/
			}
		}

		async servisBaslatIstendi(e) {
			const {app} = this;
			const {parentID, servisVeyaGorevmi} = e;
			try {
				switch (parentID) {
					case 'cvm':
						return await app.wsShell({
							args: { cmd: `NET START CVMService` }
						})
					default:
						const _e = {};
						if (servisVeyaGorevmi)
							_e.id = parentID;
						return await app.wsRunSubServices(_e);
				}
			}
			catch (ex) {
				defFailBlock(ex);
			}
		}

		async servisDurdurIstendi(e) {
			const {app} = this;
			const {parentID, servisVeyaGorevmi} = e;
			try {
				switch (parentID) {
					case 'cvm':
						return await app.wsShell({
							args: { cmd: `NET STOP CVMService` }
						})
					default:
						const _e = {};
						if (servisVeyaGorevmi)
							_e.id = parentID;
						return await app.wsStopSubServices(_e);
				}
			}
			catch (ex) {
				defFailBlock(ex);
			}
		}

		async servisRestartIstendi(e) {
			const {app} = this;
			const {parentID, servisVeyaGorevmi} = e;
			try {
				switch (parentID) {
					case 'skyWS':
						try { return await app.wsRestart() }
						catch (ex) {
							const error = (ex || {}).responseJSON || ex;
							if (ex.status !== 0 && (error.rc || error.code) != 'accessDenied' && (ex || {}).statusText != 'abort')
								throw ex;
							return { }
					   }
					case 'cvm':
						return await app.wsCVMRestart();
					default:
						const _e = {};
						if (servisVeyaGorevmi)
							_e.id = parentID;
						return await app.wsRestartSubServices(_e);
				}
			}
			catch (ex) {
				defFailBlock(ex);
			}
		}

		async servisEkleIstendi(e) {
			const {app} = this;
			const baslikText = `Servis Ekle`;
			try {
				return await new $.Deferred(p => {
					const part = new SkyConfigServisDuzenlePart({
						title: baslikText,
						baslikText: baslikText,
						tamamIslemi: async _e => {
							(async () => {
								showProgress(`Servis Ekleniyor...`, '', 1);
								const tr = this.tblServisler.find(`tr.item`);
								if (tr && tr.length)
									tr.attr('data-durum', '');
								try { p.resolve(await this.servisEkle($.extend({}, e, _e))) }
								catch (ex) { p.reject(ex) }
								finally {
									setTimeout(() => this.tazele(), 1000);
									setTimeout(() => hideProgress(), 200);
								}
							})();
						}/*,
						geriCallback: _e =>
							p.reject($.extend({ isError: false, rc: 'userAbort' }, _e))*/
					});
					part.open();
				})
			}
			catch (ex) {
				defFailBlock(ex);
			}
		}

		async servisDegistirIstendi(e) {
			const {app, id2SubServices} = this;
			const {parentID, rec} = e;
			const args = ((id2SubServices[parentID] || {}).config) || rec.data('args');
			const tip = (args || {}).tip || rec.data('tip');
			
			const baslikText = `Servis Değiştir`;
			try {
				return await new $.Deferred(p => {
					const part = new SkyConfigServisDuzenlePart({
						title: baslikText,
						baslikText: baslikText,
						servisID: parentID,
						args: args,
						tamamIslemi: _e => {
							(async () => {
								showProgress(`Servis Güncelleniyor...`, '', 1);
								const tr = this.tblServisler.find(`tr.item`);
								if (tr && tr.length)
									tr.attr('data-durum', '');
								try {
									p.resolve(await this.servisDegistir($.extend({}, e, _e)));
								}
								catch (ex) { p.reject(ex) }
								finally {
									setTimeout(() => this.tazele(), 1000);
									setTimeout(() => hideProgress(), 200);
								}
							})();
						}/*,
						geriCallback: _e =>
							p.reject($.extend({ isError: false, rc: 'userAbort' }, _e))*/
					});
					part.open();
				})
			}
			catch (ex) {
				defFailBlock(ex);
			}
		}

		async servisSilIstendi(e) {
			const {app} = this;
			const {parentID, rec} = e;

			try {
				return await new $.Deferred(p => {
					createJQXWindow(
						(
							`<div class="bold red">Seçilen Servis silinsin mi?</div>` +
							`<p/>` +
							`<div style="margin-left: 20px; font-size: 80%; color: #aaa;" class="ekBilgi">${rec.find(`#aciklama`).html()}</div>`
						),
						`Servis Silinecek`,
						{
							width: 500, height: 400, isModal: true
						},
						{
							EVET: async (dlgUI, btnUI) => {
								dlgUI.jqxWindow('destroy');
								(async () => {
									showProgress(`Servis Siliniyor...`, '', 1);
									const tr = this.tblServisler.find(`tr.item`);
									if (tr && tr.length)
										tr.attr('data-durum', '');
									try {
										p.resolve(await this.servisSil($.extend({}, e)));
									}
									catch (ex) { p.reject(ex) }
									finally {
										setTimeout(() => this.tazele(), 1000);
										setTimeout(() => hideProgress(), 200);
									}
								})();
							},
							HAYIR: (dlgUI, btnUI) => {
								dlgUI.jqxWindow('destroy');
								/* p.reject({ isError: false, rc: 'userAbort' }) */
							},
						}
					)
				})
			}
			catch (ex) {
				defFailBlock(ex);
			}
		}

		async servisEkle(e) {
			const {args} = e;
			const id = args.id || newGUID();
			
			const {app} = this;
			let {config} = (await app.wsReadSubServicesConfig()) || {};
			config = config || [];
			let subConfig = config.find(rec => rec.id == id);
			if (!subConfig)
				config.push(subConfig = { id: id });
			
			for (const key in args) {
				const value = args[key];
				if (value != null)
					subConfig[key] = value;
			}
			
			return await app.wsUpdateSubServicesConfig({ temp: false, config: config });
		}

		async servisDegistir(e) {
			const {args} = e;
			const id = e.parentID;
			const rec = this.id2SubServices[id];
			if (!rec)
				return false;

			const {app} = this;
			let {config} = (await app.wsReadSubServicesConfig()) || {};
			config = config || [];
			let subConfig = config.find(rec => rec.id == id);
			if (!subConfig)
				config.push(subConfig = { id: id });
			for (const key in args) {
				const value = args[key];
				if (value !== undefined)
					subConfig[key] = value;
			}
			
			return await app.wsUpdateSubServicesConfig({ temp: false, config: config });
		}

		async servisSil(e) {
			const {args} = e;
			const id = e.parentID;
			const rec = this.id2SubServices[id];
			if (!rec)
				return false;

			const {app} = this;
			let {config} = (await app.wsReadSubServicesConfig()) || {};
			config = config || [];
			const index = config.findIndex(rec => rec.id == id);
			if (index == null || index < 0)
				return false;

			config.splice(index, 1);
			return await app.wsUpdateSubServicesConfig({ temp: false, config: config });
		}

		async onResize(e) {
			if ((await super.onResize(e)) === false)
				return false;
		}
	}
})()
