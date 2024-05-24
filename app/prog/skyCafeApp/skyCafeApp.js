(function() {
	window.SkyCafeApp = class extends window.Prog {
		constructor(e) {
			super(e);

			/*$.extend(this, {
			});*/

			// this.updateWSUrlBase();

			sky.config.sessionInfo.loginTipi = 'kasiyerLogin';

			const extLogin = this.extensions.login;
			$.extend(extLogin.options, {
				// isLoginRequired: true,
				isLoginRequired: false,
				loginTypes: [
					{ kod: 'kasiyerLogin', aciklama: '<span style="color: darkgreen;">Kasiyer</span>' }
				]
			});
			$.extend(this, {
				parts: {},
				dbTablePrefixes: { const: 'const_', master: 'mst_' },
				dbMgrs: {
					rom_data: new DBMgr({ dbName: `${this.appName}_ROM_DATA` })
				},
				param: new SkyCafeParam(),
				ozelParam: {},
				id2Urun: {}
			});
			this.dbMgr_mf = this.dbMgrs.rom_data;
		}
		
		static get rootAppName() { return 'skyCafeApp' }
		static get appName() { return this.rootAppName }
		static get pratikSatismi() { return false }
		static get wsURLBasePostfix() { return `` }
		static get wsPortRepeatCount() { return 5 }
		get appRootName() { return this.class.rootAppName }
		get defaultRootLayoutName() { return this.rootAppName }
		get appText() { return `Sky Cafe` }
		get loginExtensionClass() { return SkyCafeLoginExtension }

		get programcimi() {
			let result = this._programcimi;
			if (result == null) {
				const {ozelParam, param} = this;
				result = qs.programci || ozelParam.programci;
				if (result == null)
					result = param.programcimi;
				if (result == null)
					result = this.isDevMode;
				this._programcimi = result = asBool(result);
			}
			return result;
		}
		get yetki() {
			if (this.promise_getParams /*|| this.promise_tanimlariYukle*/)
				return 'garson';
			
			let result = this._yetki;
			if (result == null) {
				const {ozelParam, param} = this;
				result = qs.yetki;
				if (result == null)
					result = param.yetki;
				/*const {sessionInfo} = sky.config;
				if (result == null) {
					result = sessionInfo && sessionInfo.hasSessionOrUser
						? (sessionInfo.isAdmin || sessionInfo.sessionObjectAdminmi
							   ? 'admin'
							   : (sessionInfo.yetki == null ? 'garson' : sessionInfo.yetki))
						: 'garson';
				}*/
				if (result == null)
					result = 'garson';
				this._yetki = result;
			}
			return result;
		}
		get sefmi() {
			let result;
			if (result == null) {
				result = this.yetki == 'admin' || this.yetki == 'sef';
				this._sefmi = result;
			}
			return result;
		}
		get garsonmu() {
			let result;
			if (result == null) {
				result = this.yetki == 'garson';
				this._garsonmu = result;
			}
			return result;
		}
		get tekTikmi() {
			let result;
			if (result == null) {
				const {ozelParam, param} = this;
				result = qs.tekTik || ozelParam.tekTik;
				if (result == null)
					result = param.tekTikmi;
				this._tekTikmi = result = asBool(result);
			}
			return result;
		}
		get iskontoYapabilirmi() {
			let result;
			if (result == null) {
				const {ozelParam, param} = this;
				result = qs.iskonto || ozelParam.isk;
				if (result == null)
					result = param.iskontoYapabilirmi;
				this._iskontoYapabilirmi = result = asBool(result);
			}
			return result;
		}
		get timerYokmu() {
			let result = this._timerYokmu;
			if (result == null) {
				const {ozelParam, param} = this;
				result = qs.timerYok || qs.noTimer || qs.noTimers ||
							ozelParam.timerYok;
				if (result == null)
					result = param.timerYokmu;
				this._timerYokmu = result = asBool(result);
			}
			return result;
		}
		get bostaPortBulTimerYokmu() {
			let result = this._bostaPortBulTimerYokmu;
			if (result == null) {
				const {ozelParam, param} = this;
				result = this.timerYokmu || qs.bostaPortBulTimerYok || qs.noBostaBulTimer || ozelParam.bostaPortBulTimerYok;
				if (result == null)
					result = param.bostaPortBulTimerYokmu;
				this._bostaPortBulTimerYokmu = result = asBool(result);
			}
			return result;
		}
		/*get tanimTimerYokmu() {
			let result = this._tanimTimerYokmu;
			if (result == null) {
				const {ozelParam, param} = this;
				result = this.timerYokmu || qs.tanimTimerYok || qs.noTanimTimer || ozelParam.tanimTimerYok;
				if (result == null)
					result = param.tanimTimerYokmu;
				this._tanimTimerYokmu = result = asBool(result);
			}
			return result;
		}
		get tanimTimerSure() {
			let result = this._tanimTimerSure;
			if (result == null) {
				const {ozelParam, param} = this;
				result = qs.tanimTimerSure == null ? ozelParam.tanimTimerSure : qs.tanimTimerSure;
				if (result == null)
					result = param.tanimTimerSure;
				this._tanimTimerSure = result = result == null ? null : asFloat(result);
			}
			return result;
		}*/
		get aktifBilgiTimerYokmu() {
			let result = this._aktifBilgiTimerYokmu;
			if (result == null) {
				const {ozelParam, param} = this;
				result = this.timerYokmu || qs.aktifBilgiTimerYok || qs.noAktifBilgiTimer || ozelParam.aktifBilgiTimerYok;
				if (result == null)
					result = param.aktifBilgiTimerYokmu;
				this._aktifBilgiTimerYokmu = result = asBool(result);
			}
			return result;
		}
		get aktifBilgiTimerSure() {
			let result = this._aktifBilgiTimerSure;
			if (result == null) {
				const {ozelParam, param} = this;
				result = qs.aktifBilgiTimerSure == null ? ozelParam.aktifBilgiTimerSure : qs.aktifBilgiTimerSure;
				if (result == null)
					result = param.aktifBilgiTimerSure;
				this._aktifBilgiTimerSure = result = result == null ? null : asFloat(result);
			}
			return result;
		}
		get webDataSourceWSRoot() {
			let result = this._webDataSourceWSRoot;
			if (result == null) {
				const {ozelParam, param} = this;
				result = qs.webDataSourceWSRoot || ozelParam.webDataSourceWSRoot;
				if (result == null)
					result = param.webDataSourceWSRoot;
				if (result == null)
					result = `http://${sky.config.hostName || ''}:81/output/SkyCafe/${this.class.pratikSatismi ? 'pratik' : 'rest'}/`;
				this._webDataSourceWSRoot = result;
			}
			return result;
		}
		get useWebDataSource_tanimlar() {
			let result = this._useWebDataSource_tanimlar;
			if (result == null) {
				const {ozelParam, param} = this;
				result = qs.webDataSource_tanimlar || ozelParam.useWebDataSource_tanimlar || (ozelParam.webDataSource || {}).tanimlar;
				if (result == null)
					result = (param.webDataSource || {}).tanimlar;
				this._useWebDataSource_tanimlar = result = asBool(result);
			}
			return result;
		}
		get useWebDataSource_aktifBilgiler() {
			let result = this._useWebDataSource_aktifBilgiler;
			if (result == null) {
				const {ozelParam, param} = this;
				result = qs.webDataSource_aktifBilgiler || ozelParam.useWebDataSource_aktifBilgiler || (ozelParam.webDataSource || {}).aktifBilgiler;
				if (result == null)
					result = (param.webDataSource || {}).aktifBilgiler;
				this._useWebDataSource_aktifBilgiler = result = asBool(result);
			}
			return result;
		}
		get noFastLogin() {
			let result = this._noFastLogin;
			if (result == null) {
				const {ozelParam, param} = this;
				result = qs.noFastLogin || ozelParam.noFastLogin;
				if (result == null)
					result = param.raporYokmu;
				this._noFastLogin = result = asBool(result);
			}
			return result;
		}
		get raporYokmu() {
			let result = this._raporYokmu;
			if (result == null) {
				const {ozelParam, param} = this;
				result = qs.raporYok || qs.raporYokmu || ozelParam.raporYok;
				if (result == null)
					result = param.raporYokmu;
				this._raporYokmu = result = asBool(result);
			}
			return result;
		}
		get syncServerPort() {
			let result = this._syncServerPort;
			if (result == undefined) {
				const {ozelParam, param} = this;
				result = qs.syncServerPort || ozelParam.syncServerPort;
				if (result == undefined)
					result = param.syncServerPort;
				this._syncServerPort = result = asInteger(result) || null;
			}
			return result;
		}
		get tahsilSekliTip2Id() {
			let result = this._tahsilSekliTip2Id;
			if (result == null) {
				const {ozelParam, param} = this;
				result = ozelParam.tahsilSekliTip2Id;
				if (result == null)
					result = param.tahsilSekliTip2Id || {};
				this._tahsilSekliTip2Id = result;
			}
			return result;
		}
		get brm2Fra() {
			let result = this._brm2Fra;
			if (result == null) {
				const {ozelParam, param} = this;
				result = ozelParam.brm2Fra;
				if (result == null)
					result = param.brm2Fra || {};
				this._brm2Fra = result;
			}
			return result;
		}
		get kasiyerKod() {
			const {ozelParam, param} = this;
			let result = ozelParam.kasiyerKod;
			if (result) {
				const _e = {};
				if (result.call)
					result = result.call(this, _e);
				else if ($.isFunction(result))
					result = result(_e);
			}
			if (result == null)
				result = param.kasiyerKod;
			if (!result)
				result = (sky.config.sessionInfo || {}).user || null;
			return result;
		}
		get zBilgi() {
			const {ozelParam, param} = this;
			let result = ozelParam.zBilgi;
			if (result == null)
				result = param.zBilgi;
			return result;
		}
		get zNo() {
			const {zBilgi} = this;
			return (zBilgi || {}).zNo || null;
		}
		get zSayac() {
			const {zBilgi} = this;
			return (zBilgi || {}).zSayac || null;
		}
		get zAcikmi() {
			const {zBilgi} = this;
			return zBilgi && !zBilgi.kapandimi;
		}
		/*get masaTazeleTimerYokmu() {
			let result = this._masaTazeleTimerYokmu;
			if (result == null) {
				const {ozelParam, param} = this;
				result = qs.masaTazeleTimerYok || qs.noMasaTazeleTimer || ozelParam.masaTazeleTimerYok;
				if (result == null)
					result = param.masaTazeleTimerYokmu;
				this._masaTazeleTimerYokmu = result = asBool(result);
			}
			return result;
		}
		get masaTazeleTimerSure() {
			let result = this._masaTazeleTimerSure;
			if (result == null) {
				const {ozelParam, param} = this;
				result = qs.masaTazeleTimerSure == null ? ozelParam.masaTazeleTimerSure : qs.masaTazeleTimerSure;
				if (result == null)
					result = param.masaTazeleTimerSure;
				this._masaTazeleTimerSure = result = result == null ? null : asFloat(result);
			}
			return result;
		}
		get otoKayitTimerYokmu() {
			let result = this._otoKayitTimerYokmu;
			if (result == null) {
				const {ozelParam, param} = this;
				result = qs.otoKayitTimerYok || qs.noOtoKayitTimer || ozelParam.otoKayitTimerYok;
				if (result == null)
					result = param.otoKayitTimerYokmu;
				this._otoKayitTimerYokmu = result = asBool(result);
			}
			return result;
		}
		get otoKayitTimerSure() {
			let result = this._otoKayitTimerSure;
			if (result == null) {
				const {ozelParam, param} = this;
				result = qs.otoKayitTimerSure == null ? ozelParam.otoKayitTimerSure : qs.otoKayitTimerSure;
				if (result == null)
					result = param.otoKayitTimerSure;
				this._otoKayitTimerSure = result = result == null ? null : asFloat(result);
			}
			return result;
		}
		get otoSyncTimerYokmu() {
			let result = this._otoSyncTimerYokmu;
			if (result == null) {
				const {ozelParam, param} = this;
				result = qs.otoSyncTimerYok || qs.noOtoSyncTimerYokmu || ozelParam.otoSyncTimerYok;
				if (result == null)
					result = param.otoSyncTimerYokmu;
				this._otoSyncTimerYokmu = result = asBool(result);
			}
			return result;
		}
		get otoSyncTimerSure() {
			let result = this._otoSyncTimerSure;
			if (result == null) {
				const {ozelParam, param} = this;
				result = qs.otoSyncTimerSure == null ? ozelParam.otoSyncTimerSure : qs.otoSyncTimerSure;
				if (result == null)
					result = param.otoSyncTimerSure;
				this._otoSyncTimerSure = result = result == null ? null : asFloat(result);
			}
			return result;
		}*/

		buildAjaxArgs(e) {
			e = e || {};
			return $.extend(super.buildAjaxArgs(e) || {}, {
				appUniqueId: this.appUniqueId || '',
				pratikSatismi: this.class.pratikSatismi,
				sonSyncTS: Utils.asReverseDateTimeString(asDate(this.param.sonSyncTS))
			});
		}

		/*updateWSUrlBase(e) {
			this._wsURLBase = updateWSUrlBaseBasit(
				$.extend({}, sky.config, { path: `ws/ticari/skyCafe${this.class.wsURLBasePostfix}/` },
				getArgsForRandomPort({ port: sky.config.port }), e)
			);
		}*/

		updateWSUrlBase(e) {
			return super.updateWSUrlBase({
				path: `ws/ticari/skyCafe${this.class.wsURLBasePostfix}/`
			})
		}

		async ilkIslemler(e) {
			try { Utils.disableHistoryBack() }
			catch (ex) { }

			/*try {
				if (sky.globalCache)
					sky.globalCache.yukle(e);
			}
			catch (ex) { console.error(ex) }*/
			
			try {
				await this.tablolariOlustur(e);
				await this.paramYukle(e);
			}
			catch (ex) {
				displayServerResponse(ex);
				console.error(ex);
			}

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
			
			await this.extensions.login.loginIslemi(e);
		}

		async afterRun(e) {
			await super.afterRun(e);

			await this.ortakReset();
			setTimeout(() => this.sonIslemler(e), 100);
		}

		async sonIslemler(e) {
			this.indicatorPart.ajaxCallback({ state: false });
			this.destroyWindows();
			this.ortakReset();
			
			const {indicatorPart} = this;
			let promise_tanimlariOku = this.promise_tanimlariOku = new $.Deferred(async d => {
				await showProgress(`İlk Tanımlar okunuyor...`, null, 200);
				try { d.resolve(await this.tanimlariOku($.extend({}, e, { noAbort: true }))) }
				finally { delete this.promise_tanimlariOku }
			});
			let promise_getParams = this.promise_getParams = new $.Deferred(async d => {
				const promise = this.wsParamYukle($.extend({}, e, { noAbort: true }));
				/*if (indicatorPart)
					setTimeout(() => indicatorPart.ajaxCallback({ state: true }), 10);*/
				await showProgress(`Parametreler merkezden yükleniyor...`, null, 200);
				try {
					/*if (indicatorPart)
						await indicatorPart.ajaxCallback({ state: true });*/
					/*setTimeout(() => {
						if (indicatorPart && indicatorPart.lastStates.ajax == null)
							indicatorPart.ajaxCallback({ state: true });
					}, 100);*/
					const result = await promise;
					d.resolve(result);
				}
				catch (ex) {
					setTimeout(async () => {
						this.syncCompleted(e);
						await this.knobProgressHideWithReset({ delayMS: 2000, update: { labelTemplate: 'error', label: `Parametreler merkezden yüklenemedi!` } });
						((window.savedProcs || {}).hideProgress || hideProgress)();
					}, 500);

					/*if (indicatorPart)
						indicatorPart.ajaxCallback({ state: null });*/
					/*setTimeout(() => {
						if (indicatorPart && indicatorPart.lastStates.ajax == null)
							indicatorPart.ajaxCallback({ state: false });
					}, 1000);*/
					d.reject(ex);
				}
				finally {
					delete this.promise_getParams;
				}
			});

			const tanimlariYuklemeFlag = asBool($.jqx.cookie.cookie('tanimlariYuklemeFlag'));
			if (tanimlariYuklemeFlag)
				$.jqx.cookie.cookie('tanimlariYuklemeFlag', null);
			let promise_tanimlariYukle = this.promise_tanimlariYukle = new $.Deferred(async d => {
				try { await this.promise_getParams }
				catch (ex) { }

				const {navPart} = this;
				if (navPart)
					navPart.tazele();

				const promise_wsTanimlariYukle = tanimlariYuklemeFlag ? null : this.wsTanimlariYukle($.extend({}, e, { noAbort: true, kuyrukSifirla: true }));
				/*if (indicatorPart)
					setTimeout(() => indicatorPart.ajaxCallback({ state: true }), 10);*/
				promise_tanimlariOku.always(async () => {
					if (tanimlariYuklemeFlag) {
						// await hideProgress();
						d.resolve(await promise_wsTanimlariYukle);
						/*if (indicatorPart) {
							setTimeout(() => { if (indicatorPart) { indicatorPart.ajaxCallback({ state: false }) } }, 1000);
							setTimeout(() => { if (indicatorPart) { indicatorPart.ajaxCallback({ state: false }) } }, 2000);
						}*/
						return;
					}

					await showProgress(`İlk Tanımlar merkezden yükleniyor...`, null, 200);
					try {
						/*if (indicatorPart) {
							indicatorPart.ajaxCallback({ state: true });
							setTimeout(() => {
								if (indicatorPart.lastStates.ajax == null)
									indicatorPart.ajaxCallback({ state: true });
							}, 1000);
						}*/
						const result = await promise_wsTanimlariYukle;
						// await this.tanimlariYukleOkuOrtak(e);
						d.resolve(result);
						/*if (indicatorPart) {
							setTimeout(() => { if (indicatorPart) { indicatorPart.ajaxCallback({ state: false }) } }, 1000);
							setTimeout(() => { if (indicatorPart) { indicatorPart.ajaxCallback({ state: false }) } }, 2000);
						}*/
					}
					catch (ex) {
						setTimeout(async () => {
							this.syncCompleted(e);
							await this.knobProgressHideWithReset({ delayMS: 2000, update: { labelTemplate: 'error', label: `Tanımlar merkezden yüklenemedi!` } });
							((window.savedProcs || {}).hideProgress || hideProgress)();
						}, 500);

						/*if (indicatorPart)
							indicatorPart.ajaxCallback({ state: null });*/
						/*setTimeout(() => {
							if (indicatorPart && indicatorPart.lastStates.ajax == null)
								indicatorPart.ajaxCallback({ state: false });
						}, 2000);*/
						d.reject(ex);
					}
					finally {
						delete this.promise_tanimlariYukle;
					}
				});
			});

			if (!this.noFullScreenFlag) {
				try { requestFullScreen() }
				catch (ex) { }
			}

			if (this.programcimi) {
				setTimeout(
					() => displayMessage(`! ** <b>PROGRAMCI</b> ** modu aktif !`, `Bilgi`),
					3000);
			}
			
			(async () => {
				try {
					await this.promise_getParams;
					const tanimlar = await this.promise_tanimlariYukle;
					if (tanimlar && !tanimlar.isError)
						await this.wsTanimlarYuklendi(e);
					setTimeout(async () => {
						this.syncCompleted(e);
						if (tanimlar && !tanimlar.isError)
							await this.knobProgressHideWithReset({ delayMS: 2000, update: { label: `Tanımlar merkezden yüklendi!` } });
						((window.savedProcs || {}).hideProgress || hideProgress)();
					}, 100);
				}
				catch (ex) {
					defFailBlock(ex);
					setTimeout(async () => {
						this.syncCompleted(e);
						await this.knobProgressHideWithReset({ delayMS: 2000, update: { labelTemplate: 'error', label: `Tanımlar merkezden yüklenemedi!` } });
						((window.savedProcs || {}).hideProgress || hideProgress)();
					}, 100);
				}
				finally {
					setTimeout(async () => await hideProgress(), 3000);
					setTimeout(async () => await hideProgress(), 4000);
					setTimeout(async () => await hideProgress(), 5000);
					setTimeout(() => {
						if (!this.uniqueTimers.wsAktifBilgileriYukleIslemi)
							this.wsAktifBilgileriYukleIslemi();
					}, 2000);
				}
			})();
			
			await promise_tanimlariOku;
			this.onbellekOlustur(e);

			const {layout} = this;
			const btnToggleRestPra = this.btnToggleRestPra = layout.find(`#btnToggleRestPra`);
			btnToggleRestPra.jqxButton({ theme: theme });
			btnToggleRestPra.on('click', evt =>
				this.toggleRestPraIstendi(e));

			const btnToggleFullScreen = this.btnToggleFullScreen = layout.find(`#btnToggleFullScreen`);
			btnToggleFullScreen.jqxButton({ theme: theme });
			btnToggleFullScreen.on('click', evt =>
				this.toggleFullScreen(e));

			this.zBilgiGoster(e);

			const divLoginTextParent = this.divLoginTextParent = layout.find(`#loginTextParent`);
			const divLoginText = this.divLoginText = divLoginTextParent.find(`#loginText`);
			if (divLoginText.length) {
				const {sessionInfo} = sky.config;
				const ka = new CKodVeAdi({ kod: sessionInfo.user });
				if ($(window).width() >= 500)
					ka.aciklama = sessionInfo.userDesc;
				divLoginText.html(ka.cizgiliOzet({ styled: true }));
				divLoginTextParent.removeClass(`jqx-hidden`);
			}
			
			const divZTextParent = this.divZTextParent = layout.find(`#zTextParent`);
			this.divZText = divZTextParent.find(`#zText`);
			this.zBilgiGoster(e);

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

			await this.promise_masalarTazele;
			// setTimeout(() => ((window.savedProcs || {}).hideProgress || hideProgress)(), 1000);
		}

		async preInitLayout(e) {
			e = e || {};
			await super.preInitLayout(e);
			
			const layout = e.layout || this.layout;
			// $('body').css('overflow-y', 'auto');
			$(document).on('contextmenu', evt =>
				evt.preventDefault());

			$.extend(this, {
				templatesOrtak: layout.find(`#templatesOrtak`),
				btnCacheReset: layout.find(`#btnCacheReset`),
				btnTanimlariYukle: layout.find(`#btnTanimlariYukle`),
				btnLogout: layout.find(`#btnLogout`),
				toolbar: layout.find(`#toolbar`),
				btnToggleResponsivePanel: layout.find(`#btnToggleResponsivePanel`),
				nav: layout.find(`#nav`),
				innerContent: layout.find(`#innerContent`)
			});
			const {nav, innerContent} = this;
			const navPart = this.navPart = new SkyCafeNavPart({
				layout: nav.find(`#menu`)
			});
			navPart.basicRun();

			const btnCacheReset = this.btnCacheReset
				.jqxButton({ theme: theme })
				.jqxTooltip({ theme: theme, trigger: `hover`, content: `Önbelleği temizle` })
				.on('click', evt => this.onbellekSilIstendi(e));
			//const cacheKeys = window.caches ? await window.caches.keys() : [];
			//if ($.isEmptyObject(cacheKeys))
			//	btnCacheReset.remove();
			
			const btnTanimlariYukle = this.btnTanimlariYukle
				.jqxButton({ theme: theme })
				.jqxTooltip({ theme: theme, trigger: `hover`, content: `Merkezden Tanimları Yükle` })
				.on('click', evt => this.tanimlariYukleIstendi(e));

			this.btnLogout
				.jqxButton({ theme: theme })
				.jqxTooltip({ theme: theme, trigger: `hover`, content: `Oturum kapat` })
				.on('click', evt => this.logoutIstendi());
			
			const {btnToggleResponsivePanel} = this;
			btnToggleResponsivePanel
				.jqxButton({ theme: theme })
				.jqxTooltip({ theme: theme, trigger: `hover`, content: `Küçült/Büyüt` });
			
			nav.jqxResponsivePanel({
				theme: theme, animationType: animationType,
				collapseBreakpoint: 10000, toggleButton: btnToggleResponsivePanel,
                autoClose: false, animationShowDelay: 'slow', animationHideDelay: 'slow'
			});
			const navWidget = this.navWidget = nav.jqxResponsivePanel('getInstance');
			navWidget.open();
			nav.on('open', evt => this.onResponsivePanelChanged($.extend({}, e, { event: evt, open: true })));
			nav.on('close', evt => this.onResponsivePanelChanged($.extend({}, e, { event: evt, open: false })));

			/*setTimeout(() => {
				((window.savedProcs || {}).hideProgress || hideProgress)();
				this.knobProgressHideWithReset({ delayMS: 1 });
			}, 1500);*/

			// const tanimlar = this.tanimlar = await promise;
			// await this.tanimlarYuklendi(tanimlar);
		}

		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);

			const layout = e.layout || this.layout;
			this.destroyWindows();
		}

		async destroyPart(e) {
			e = e || {};
			const {activePart, layout, islemTuslari} = this;
			if (activePart)
				await activePart.destroyPart(e);
			
			this.closeKlavyePart(e);
			
			if (islemTuslari && islemTuslari.length) {
				islemTuslari
					.removeClass(`prog ${this.class.rootAppName}`)
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

			const {programcimi, timers} = this;
			const {pratikSatismi} = this.class;
			if (!this.timerYokmu) {
				timers.timersDisabledFlagReset = {
					delay: 20000, interval: true,
					block: e => {
						if (!this.timersDisabledFlag_noReset)
							this.timersDisabledFlag = false;
					}
				}
				
				if (!(this.bostaPortBulTimerYokmu || this.syncServerPort)) {
					timers.bostaPortBul = {
						delay: 40000, interval: true, args: e,
						block: async e => {
							if (!(this.bostaPortBulTimerYokmu || this.timersDisabledFlag))
								await this.bostaPortBul(e);
						}
					};
				}
			}

			/*if (!this.tanimTimerYokmu) {
				timers.tanimlariYukle = {
					delay: programcimi ? 8000 : 30000, interval: true,
					block: async e => {
						if (!(this.tanimTimerYokmu || this.timersDisabledFlag)) {
							this.timersDisabledFlag = true;
							try {
								await this.wsTanimlariYukle(e);
								await this.wsTanimlarYuklendi(e);
							}
							finally {
								this.timersDisabledFlag = false;
							}
						}
					}
				}
			}*/
		}

		ortakReset(e) {
			this.ortakReset_mf(e);
			this.ortakReset_diger(e);
		}

		ortakReset_basit(e) {
			const keys = [
				'_noFastLogin', '_syncServerPort', '_useWebDataSource_tanimlar', '_useWebDataSource_aktifBilgiler',
				/*'_yetki',*/ '_sefmi', '_garsonmu', '_tekTikmi', '_iskontoYapabilirmi', '_tahsilSekliTip2Id'
			];
			for (const i in keys)
				delete this[keys[i]];
		}

		ortakReset_mf(e) {
			this.ortakReset_basit(e);
			SkyCafeBarkodParser_Kuralli.ortakReset(e);
		}

		ortakReset_diger(e) {
			const keys = [
				'_programcimi', '_timerYokmu', '_bostaPortBulTimerYokmu', '_tanimTimerYokmu', '_aktifBilgiTimerYokmu',
				'_otoKayitTimerYokmu', '_otoSyncTimerYokmu', '_masaTazeleTimerYokmu'
			];
			for (const i in keys)
				delete this[keys[i]];
		}

		async onbellekOlustur(e) {
			await this.initCaches(e);
			await Promise.all([
				this.loadInitialCaches(),
				this.doInitialFetches()
			]);
		}

		initCaches(e) {
			this.caches = {
				// stokKod2EkBilgi: {}
			};
		}

		async loadInitialCaches(e) {
			e = e || {};
			const {caches} = this;
			const dbMgr = this.dbMgr_mf;
			let stm, recs, cacheDict;
			
			/*stm = new MQStm({
				sent: new MQSent({
					from: `mst_Stok mst`,
					where: [`mst.kod <> ''`],
					sahalar: [`mst.*`]
				})
			});
			recs = [];
			recs.push(...(await dbMgr.executeSqlReturnRows({ tx: e.tx, query: stm })));
			cacheDict = caches.stokKod2Rec;
			for (let i in recs) {
				const rec = recs[i];
				cacheDict[rec.id] = rec;
			}*/
		}

		async doInitialFetches(e) {
			e = e || {};
			const urls = [
				`appBase/part/knobProgress.html`,
				`../app/prog/${this.class.rootAppName}/data/db_rom_data_initSQL.sql`,
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
			const {rootAppName} = this;
			for (let i in ports) {
				const port = ports[i];
				const urls = [];
				const hostNameSet = {};
				if (location.hostname != 'localhost' && location.hostname != '127.0.0.1') {
					urls.push(`http://${location.hostname}:${port}/${rootAppName}.override.js`);
					hostNameSet[location.hostname] = true;
				}
				if (!(hostNameSet.localhost || hostNameSet['127.0.0.1']))
					urls.push(`http://localhost:${port}/${rootAppName}.override.js`);
				if (!hostNameSet[hostName] && (hostName != 'localhost' && hostName != '127.0.0.1'));
					urls.push(`http://${hostName}:${port}/${rootAppName}.override.js`);
				
				let timeout = 2500;
				for (let j in urls) {
					const url = urls[j];
					lastAjaxObj = $.get({
						async: true,
						timeout: timeout,
						dataType: 'script',
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

		async tablolariTemizle(e) {
			e = e || {};
			await this.knobProgressShow();
			
			const dbMgrKeys = e.dbMgrKeys || Object.keys(this.dbMgrs);
			for (let i in dbMgrKeys) {
				let key = dbMgrKeys[i];
				let dbMgr = this.dbMgrs[key];
				await dbMgr.transactionDo(async tx => {
					await this.knobProgressSetLabel('Yerel Veritabanı temizleniyor...');
					
					let query = `SELECT name FROM sqlite_master WHERE type = 'table' AND (name NOT LIKE '^_^_%' ESCAPE '^' AND name NOT LIKE 'sqlite^_%' ESCAPE '^')`;
					if (e.verilerSilinmesinFlag)
						query += ` AND (name LIKE '${this.dbTablePrefixes.master}%')`;
					let recs = await dbMgr.executeSqlReturnRows({ tx: tx, query: query });
					for (let i in recs) {
						let rec = recs[i];
						await dbMgr.executeSql({ tx: tx, query: `DROP TABLE ${rec.name}` });
					}
					await this.knobProgressStep(2);
				});
			}
		}

		async tablolariOlustur(e) {
			e = e || {};
			const dbMgrKeys = e.dbMgrKeys || Object.keys(this.dbMgrs);
			for (let i in dbMgrKeys) {
				const key = dbMgrKeys[i];
				/*await this.knobProgressSetLabel(
					`Tablolar tanımları okunuyor (<span style="color: #555;"><i>${key.toUpperCase()}</i></span>)...`
				);*/
				let queryText = await Utils.ajaxDoWithCache({
					url: `../app/prog/${this.class.rootAppName}/data/db_${key}_initSQL.sql`,
					dataType: 'text'
				});
				queryText = (queryText || {}).text
					? await queryText.text()
					: await (queryText.response ? queryText.response.responseText : queryText);
				
				let queries = [];
				const _queryTextListe = queryText.split(';');
				for (const i in _queryTextListe) {
					let query = _queryTextListe[i];
					query = query ? query.trim() : null;
					if (!query)
						continue;
					
					if (query)
						queries.push(query);
				}

				const dbMgr = this.dbMgrs[key];
				await dbMgr.transactionDo(async tx => {
					/*await this.knobProgressSetLabel(
						`Tablolar oluşturuluyor (<span style="color: #555;"><i>${key.toUpperCase()}</i></span>)...`
					);*/
					if (!$.isEmptyObject(queries)) {
						for (let i in queries) {
							let query = queries[i];
							try {
								await dbMgr.executeSql({ tx: tx, query: query })
							}
							catch (ex) {
								debugger;
								throw ex;
							}
						}
					}
				});
			}
		}

		onResponsivePanelChanged(e) {
			e = e || {};
			const {innerContent} = this;
			const flag = e.open;

			innerContent[flag ? 'removeClass' : 'addClass'](`nav-collapsed`);
			$(window).trigger('resize');
		}

		navMenuTiklandi(e) {
			if (e.part || e.partClass)
				this.showContent(e);
		}

		async showContent(e) {
			e = e || {};
			const {innerContent, navPart} = this;
			const {navMenuItems} = navPart;
			const evt = e.event;
			let {id, part, partClass} = e;
			if (!id && partClass)
				id = partClass.partName;
			part = part || this.parts[id];
			if (!id && part)
				id = e.id = part.partName;
			
			const target = evt ? $(evt.args || evt.currentTarget) : (id ? navMenuItems.filter(`li#${id}`) : null);
			/*if (navMenuItems && navMenuItems.length)
				navMenuItems.parents(`ul`).find(`li`).removeClass(`selected`);*/
			if (target && target.length) {
				id = e.id = id || target[0].id;
				/*target.addClass(`selected`);*/
			}			
			if (!partClass) {
				const className = target && target.length ? target[0].dataset.partclass : null;
				partClass = e.partClass = e.partClass || (className ? window[className] : null);
			}
			
			// this.nav.jqxResponsivePanel('close');

			part = part || this.parts[id];
			if (part && part == this.activePart)
				return { id: id, isCurrent: true, part: part, innerContent: innerContent, subLayout: part ? part.layout : null };
			
			partClass = e.partClass = partClass || SkyCafePartBase;
			part = e.part = e.part || this.parts[id] || (() => {
				return new partClass({
					initFlag: false, isComponent: true, parentPart: this,
					content: innerContent, layout: innerContent.find(`#${id}.part`)
				})
			})();
			if (id && !part.partName)
				part.id = part.id || id;
			id = e.id = part.partName;
			this.parts[id] = part;
			
			let {initFlag} = part;
			let subLayout = e.subLayout = part.layout;
			if ($.isFunction(subLayout))
				subLayout = e.subLayout = part.layout = subLayout.call(this, e);
			
			innerContent.children(`.part`)
				.addClass(`jqx-hidden`);
			
			const {activePart} = this;
			if (activePart) {
				await activePart.deactivatePart();
				delete this.activePart;
			}
			if (!initFlag)
				subLayout.addClass(`basic-hidden`);
			subLayout.removeClass(`jqx-hidden`);

			let result;
			this.activePart = part;
			if (initFlag)
				result = await part.activatePart();
			else {
				result = await part.run();
				// subLayout.removeClass(`basic-hidden`);
			}

			return { id: id, isCurrent: false, part: part, result: result, innerContent: innerContent, subLayout: subLayout }
		}

		async hideContents() {
			const {innerContent, navPart} = this;
			/*const {navMenuItems} = navPart;
			if (navMenuItems && navMenuItems.length)
				navMenuItems.parents(`ul`).find(`li`).removeClass(`selected`);*/
			
			const {activePart} = this;
			delete this.activePart;
			if (activePart)
				await activePart.deactivatePart();
			innerContent.children(`.part`)
				.addClass(`jqx-hidden`);
			
			return { id: activePart ? activePart.id : null, activePart: activePart, innerContent: innerContent, subLayout: activePart ? activePart.layout : null }
		}

		async paramYukle(e) {
			// await this.knobProgressSetLabel(`Parametreler okunuyor...`);
			const {param} = this;
			await param.yukle();
			await this.paramYukleSonrasi(e);
			// await hideProgress();
			// this.knobProgressStep(2);
			// setTimeout(() => hideProgress(), 200);
		}

		paramYukleSonrasi(e) {
			this.ortakReset_basit(e);
		}

		async wsWaitAll(e) {
			e = e || {};
			try { await this.promiseWait } catch (ex) { }
			try { await this.promise_getParams } catch (ex) { }
			try { await this.promise_aktifBilgileriYukle } catch (ex) { }
			try { await this.promise_tanimlariYukle } catch (ex) { }
			try { await this.promise_verileriGonder } catch (ex) { }
		}

		async wsAktifBilgileriYukleIslemi(e) {
			// await this.clearUniqueTimeout({ key: 'wsAktifBilgileriYukleIslemi' });
			if (this != sky.app)
				return false;
			if (this.uniqueTimers.wsAktifBilgileriYukleIslemi)
				return false;
			
			const {pratikSatismi} = this.class;
			const {aktifBilgiTimerSure} = this;
			return await this.setUniqueTimeout({
				key: 'wsAktifBilgileriYukleIslemi',
				delayMS: aktifBilgiTimerSure == null
								? (this.syncServerPort ? 1000 : 4000)
								: aktifBilgiTimerSure * 1000,
				args: e,
				block: async e => {
					try {
						if (!this.aktifBilgiTimerYokmu) {
							const {activePart} = this;
							const masalarEkranindami = !activePart || activePart.partName == 'masalar';
							let uygunmu = !(this.aktifBilgiTimerYokmu || this.timersDisabledFlag);
							if (uygunmu && pratikSatismi)
								uygunmu = masalarEkranindami;
							
							if (uygunmu) {
								if (!masalarEkranindami) {
									await new $.Deferred(p => 
										setTimeout(() => p.resolve(), this.syncServerPort ? 100 : 500));
								}
								if (this.waitPromise) {
									try { await this.waitPromise } catch (ex) { }
									finally { delete this.waitPromise }
								}
								
								const {promise_verileriGonder} = this;
								if (promise_verileriGonder) {
									await this.setUniqueTimeout({
										key: 'promise_verileriGonder_reject',
										delayMS: this.syncServerPort ? 10000 : 60000,
										args: e,
										block: e => {
											const {promise_verileriGonder} = this;
											if (promise_verileriGonder)
												promise_verileriGonder.reject({ rc: 'userAbort' });
										}
									});
									try { await promise_verileriGonder }
									catch (ex) { }
									await this.clearUniqueTimeout({ key: 'promise_verileriGonder_reject' });
									delete this.promise_verileriGonder;
								}
								
								uygunmu = !(this.syncAbortFlag || this.waitPromise || this.promise_verileriGonder);
							}
							
							if (uygunmu) {
								await this.wsWaitAll();
								
								const _e = {};
								const TedbirSayisi = 30;
								const counter = this.wsAktifBilgileriYukleCounter = (this.wsAktifBilgileriYukleCounter || 0) + 1;
								if (!this.syncServerPort && (counter % TedbirSayisi == TedbirSayisi - 1)) {
									_e.noSyncControl = true;
									_e.useWebDataSource = false;
								}
								await this.wsAktifBilgileriYukle(_e);
								await this.wsAktifBilgilerYuklendi(_e);
							}
							else {
								console.warn(`@@ mevcut bekleme veya veri gönderimi sebebiyle wsAktifBilgileriYukleIslemi çağırımı iptal edildi!`);
							}
						}
					}
					finally {
						await this.clearUniqueTimeout({ key: 'wsAktifBilgileriYukleIslemi' });
						await this.wsAktifBilgileriYukleIslemi(e);
					}
				}
			});
		}

		async wsTanimlariAktifBilgileriYukleOncesiOrtak(e) {
			e = e || {};
			const {indicatorPart} = this;
			if (indicatorPart)
				indicatorPart.ajaxCallback({ state: null });
			setTimeout(() => {
				if (indicatorPart && indicatorPart.lastStates.ajax == null)
					indicatorPart.ajaxCallback({ state: true });
			}, 1000);

			let keys = ['result', 'tables', 'hasData'];
			for (const i in keys) {
				const key = keys[i];
				delete this[key];
			}
			
			const _promise = new $.Deferred(async p2 => {
				try { p2.resolve(await this.wsWaitAll()) }
				catch (ex) { p2.resolve(ex) }
			});
			setTimeout(() => _promise.resolve({ isError: true, rc: 'userAbort' }), 200);
			try { await _promise }
			catch (ex) { }

			if (!e.internalFlag) {
				const _e = $.extend({}, e);
				await this.wsBekleyenVerileriGonder(_e);
				// await this.wsBekleyenVerilerGonderildi(_e);
			}

			keys = ['tanimlar', 'aktifBilgiler', 'id2Masa', 'kasiyerIslemleri', 'zHesaplasma'];
			for (const i in keys) {
				const key = keys[i];
				delete this[key];
			}
		}

		async wsBekleyenVerileriGonder(e) {
			e = e || {};
			const {syncAbortFlag} = this;
			if (syncAbortFlag) {
				this.syncAbortFlag = false;
				return false;
			}
			
			let {promise_aktifBilgileriYukle} = this;
			if (promise_aktifBilgileriYukle && !this.syncServerPort) {
				// abortLastOperation();
				this.syncAbortFlag = true;
				promise_aktifBilgileriYukle.reject({ rc: 'userAbort' });
				try { await promise_aktifBilgileriYukle }
				catch (ex) { }
				delete this.promise_aktifBilgileriYukle;
				/*await this.clearUniqueTimeout({ key: 'promise_aktifBilgileriYukle_reject' });*/
			}
			let {promise_verileriGonder} = this;
			if (promise_verileriGonder) {
				await this.setUniqueTimeout({
					key: 'promise_verileriGonder_reject',
					delayMS: this.syncServerPort ? 15000 : 60000,
					args: e,
					block: e => {
						const {promise_verileriGonder} = this;
						if (promise_verileriGonder)
							promise_verileriGonder.reject({ rc: 'userAbort' });
					}
				});
				try { await promise_verileriGonder }
				catch (ex) { }
				await this.clearUniqueTimeout({ key: 'promise_verileriGonder_reject' });
				// delete this.promise_verileriGonder;
			}

			// this.timersDisabledFlag = true;
			// await this.wsWaitAll();
			promise_verileriGonder = this.promise_verileriGonder = new $.Deferred(async p => {
				/*if (this.promise_aktifBilgileriYukle) {
					await new $.Deferred(async p2 =>
						setTimeout(() => p.resolve(), 1000));
				}*/
				const {promise_aktifBilgileriYukle} = this;
				if (promise_aktifBilgileriYukle && !this.syncServerPort) {
					this.syncAbortFlag = true;
					promise_aktifBilgileriYukle.reject({ rc: 'userAbort' });
					try { await promise_aktifBilgileriYukle }
					catch (ex) { }
					delete this.promise_aktifBilgileriYukle;
				}
				
				const {indicatorPart} = this;
				try {
					this.syncAbortFlag = false;
					const result = await this.wsBekleyenVerileriGonderDevam(e);
					p.resolve(result);
					if (indicatorPart) {
						setTimeout(() => { if (indicatorPart) { indicatorPart.ajaxCallback({ state: false }) } }, 500);
						setTimeout(() => { if (indicatorPart) { indicatorPart.ajaxCallback({ state: false }) } }, 1000);
					}

					if (!result || (result || {}).isError) {
						this.timersDisabledFlag = this.syncAbortFlag = false;
						delete this.promise_verileriGonder;
					}
				}
				catch (ex) {
					if (indicatorPart)
						indicatorPart.ajaxCallback({ state: null });
					setTimeout(() => {
						if (indicatorPart && indicatorPart.lastStates.ajax == null)
							indicatorPart.ajaxCallback({ state: false });
					}, 2000);
					this.timersDisabledFlag = this.syncAbortFlag = false;
					delete this.promise_verileriGonder;
					
					p.reject(ex);
				}
			});

			return await promise_verileriGonder;
		}

		async wsBekleyenVerileriGonderDevam(e) {
			const {pratikSatismi} = this.class;
			const {param} = this;
			const isSilent = asBool(e.silent || e.mesajYok);
			const kuyrukSifirlaFlag = asBool(e.kuyrukSifirla);
			let {tx} = e;
			const hasTx = !!tx;
			const dbMgr = this.dbMgr_mf;
			const data = {
				param: {
					ilkSyncYapildimi: asBool(param.ilkSyncYapildimi),
					sonSyncTS: param.sonSyncTS ? Utils.asReverseDateTimeString(asDate(param.sonSyncTS)) : null,
				},
				tables: {}
			};
			const {tables} = data;
			
			console.debug(`o  wsBekleyenVerileriGonder başladı`, e);
			
			let stm, sent, rs, liste;
			if (kuyrukSifirlaFlag) {
				const tables = [SkyCafeLog.table, SkyCafeFis.table, SkyCafeDetay.table, `data_KasiyerIslem`, `data_ZHesaplasma`];
				for (const i in tables) {
					const table = tables[i]
					const upd = new MQIliskiliUpdate({
						from: table,
						set: [`gonderimKuyruktami = ''`],
						where: [`gonderimKuyruktami <> ''`]
					});
					await dbMgr.executeSql({ tx: tx, query: upd });
				}
			}

			let hasData = false;
			stm = new MQStm({
				sent: new MQSent({
					from: `${SkyCafeLog.table}`,
					where: [`gonderildi = ''`, `gonderimKuyruktami = ''`],
					sahalar: [`rowid`, `*`]
				})
			});
			rs = await dbMgr.executeSql({ tx: tx, query: stm });
			hasData = hasData || !!rs.rows.length;
			liste = tables[SkyCafeLog.table] = [];
			for (let i = 0; i < rs.rows.length; i++) {
				const rec = rs.rows[i];
				rec.data = rec.data == null ? null : JSON.parse(rec.data);
				liste.push(rec);
			}

			if (pratikSatismi) {
				stm = new MQStm({
					sent: new MQSent({
						from: `${SkyCafeFis.table}`,
						where: [
							`gonderildi = ''`, `gonderimKuyruktami = ''`,
							`(silindi <> '' OR (kapanmazamani is not null and kapanmazamani <> ''))`
						],
						sahalar: [`rowid`, `*`]
					})
				});
				rs = await dbMgr.executeSql({ tx: tx, query: stm });
				hasData = hasData || !!rs.rows.length;
				liste = tables[SkyCafeFis.table] = [];
				for (let i = 0; i < rs.rows.length; i++)
					liste.push(rs.rows[i]);
				
				stm = new MQStm({
					sent: new MQSent({
						from: `${SkyCafeDetay.table} har`,
						fromIliskiler: [
							{ from: `${SkyCafeFis.table} fis`, iliski: `har.fisID = fis.id` }
						],
						where: [
							`har.gonderildi = ''`, `har.gonderimKuyruktami = ''`,
							`(fis.silindi <> '' OR (fis.kapanmazamani is not null and fis.kapanmazamani <> ''))`
						],
						sahalar: [`har.rowid`, `har.*`]
					})
				});
				rs = await dbMgr.executeSql({ tx: tx, query: stm });
				hasData = hasData || !!rs.rows.length;
				liste = tables[SkyCafeDetay.table] = [];
				for (let i = 0; i < rs.rows.length; i++)
					liste.push(rs.rows[i]);
			}
			
			stm = new MQStm({
				sent: new MQSent({
					from: `data_KasiyerIslem`,
					where: [`gonderildi = ''`, `gonderimKuyruktami = ''` /*, `silindi = ''`*/],
					sahalar: [`rowid`, `*`]
				})
			});
			rs = await dbMgr.executeSql({ tx: tx, query: stm });
			hasData = hasData || !!rs.rows.length;
			liste = tables[`data_KasiyerIslem`] = [];
			for (let i = 0; i < rs.rows.length; i++)
				liste.push(rs.rows[i]);
			
			stm = new MQStm({
				sent: new MQSent({
					from: `data_ZHesaplasma`,
					where: [`gonderildi = ''`, `gonderimKuyruktami = ''`, `silindi = ''`],
					sahalar: [`rowid`, `*`]
				})
			});
			rs = await dbMgr.executeSql({ tx: tx, query: stm });
			hasData = hasData || !!rs.rows.length;
			liste = tables[`data_ZHesaplasma`] = [];
			for (let i = 0; i < rs.rows.length; i++)
				liste.push(rs.rows[i]);

			const table2IDListe = e.table2IDListe = {};
			let updListe = [];
			for (const table in tables) {
				const recs = tables[table];
				const idListe = table2IDListe[table] = table2IDListe[table] || [];
				for (const i in recs) {
					const rec = recs[i];
					// delete rec.gonderildi;
					// delete rec.gonderimKuyruktami;
					// elete rec.silindi;
					idListe.push(rec.rowid);
				}
				if (!$.isEmptyObject(idListe)) {
					updListe.push(new MQIliskiliUpdate({
						from: table,
						where: [
							`gonderildi = ''`, `gonderimKuyruktami = ''`,
							{ inDizi: idListe, saha: `rowid` }
						],
						set: [
							{ degerAta: '*', saha: `gonderimKuyruktami` }
						]
					}));
				}
			}
			
			// await this.knobProgressSetLabel(`Mevcut veriler merkeze gönderiliyor...`)			
			e.data = data;
			if (!$.isEmptyObject(updListe)) {
				for (const i in updListe) {
					const upd = updListe[i];
					await dbMgr.executeSql({ tx: tx, query: upd });
				}
			}
			if (!hasTx)
				tx = await dbMgr.getTx();

			try {
				if (!hasData) {
					this.timersDisabledFlag = this.syncAbortFlag = false;
					delete this.promise_verileriGonder;
					console.debug(`   x  wsBekleyenVerileriGonder bitti  (gönderilecek veri yok)`, e);
					return false;
				}
				
				const result = e.result = await this.wsBekleyenVerileriGonderDevam2({ tx: hasTx ? tx : null, data: data });
				/*if (!result)
					return result;*/
				console.debug(`     o  wsBekleyenVerilerGonderildi başladı`, e);
				await this.wsBekleyenVerilerGonderildi(e);
				console.debug(`     x  wsBekleyenVerilerGonderildi bitti`, e, `log count: [${(e.data.tables || {})['data_Log'].length}]`);
				
				if (!hasTx)
					tx = await dbMgr.getTx();

				const {mesaj, errorText, sonuclar} = result;
				if (!isSilent) {
					if (mesaj)
						displayMessage(mesaj, `Merkeze Veri Gönderim İşlemi`);
					else if (result.isError && (errorText || mesaj))
						displayMessage((errorText || mesaj), `@ Merkeze Veri Gönderim İşlemi @`);
				}
				
				if (!$.isEmptyObject(sonuclar)) {
					const logIDListe = [];
					for (const rowID in sonuclar) {
						let subResult = sonuclar[rowID];
						if (subResult == 'true' || subResult == 'false')
							subResult = asBool(subResult);

						if (subResult && typeof subResult == 'string')
							logIDListe.push(rowID);
					}
					const logID2Rec = {};
					for (const i in logIDListe) {
						const sent = new MQSent({
							from: SkyCafeLog.table,
							where: [ { inDizi: logIDListe, saha: `rowid` } ],
							sahalar: [`rowid`, `islem`]
						});
						const rs = await dbMgr.executeSql({ tx: tx, query: new MQStm({ sent: sent }) });
						for (let i = 0; i < rs.rows.length; i++) {
							const rec = rs.rows[i];
							logID2Rec[rec.rowid] = rec;
						}
					}
					
					const errorMessageList = [];
					for (const rowID in sonuclar) {
						let subResult = sonuclar[rowID];
						if (subResult == 'true' || subResult == 'false')
							subResult = asBool(subResult);

						if (subResult && typeof subResult == 'string') {
							const islemIgnoreSet = asSet([
								'fisIptal', 'yazdir', 'adisyonYazdir',
								'fisYazdir', 'mutfakFisiYazdir', 'tahsilatFisiYazdir'
							]);
							const rec = logID2Rec[rowID];
							const islem = (rec || {}).islem;
							if (!islemIgnoreSet[islem])
								errorMessageList.push(subResult);
						}
					}

					if (!$.isEmptyObject(errorMessageList)) {
						// abortLastOperation();
						displayMessage(
							`<ul><li>${errorMessageList.join(`</li><li>`)}</li></ul>`,
							`@ Merkeze Veri Gönderim İşlemi @`
						);

						const _e = { internalFlag: true, noSyncControl: true };
						this.wsAktifBilgileriYukle(_e).then(() =>
							this.wsAktifBilgilerYuklendi(_e));
					}
				}

				return result;
			}
			catch (ex) {
				const updListe = [];
				if (!$.isEmptyObject(table2IDListe)) {
					for (const table in table2IDListe) {
						const idListe = table2IDListe[table];
						if (!$.isEmptyObject(idListe)) {
							updListe.push(new MQIliskiliUpdate({
								from: table,
								where: [
									`gonderimKuyruktami <> ''`,
									{ inDizi: idListe, saha: `rowid` }
								],
								set: [
									`gonderimKuyruktami = ''`
								]
							}));
						}
					}
				}
				if (!$.isEmptyObject(updListe)) {
					setTimeout(async e => {
						const {dbMgr, updListe} = e;
						const tx = await dbMgr.getTx();
						for (const i in updListe) {
							const upd = updListe[i];
							await dbMgr.executeSql({ tx: tx, query: upd });
						}
					}, 2000, { dbMgr: dbMgr, updListe: updListe });
				}
				throw ex;
			}
			finally {
				delete this.promise_verileriGonder;
				this.timersDisabledFlag = this.syncAbortFlag = false;
				
				console.debug(`   x  wsBekleyenVerileriGonder bitti`, e, `log count: [${(e.data.tables || {})['data_Log'].length}]`);
			}
		}

		async wsBekleyenVerileriGonderDevam2(e) {
			let {promise_aktifBilgileriYukle} = this;
			if (promise_aktifBilgileriYukle && !this.syncServerPort) {
				/*await this.setUniqueTimeout({
					key: 'promise_aktifBilgileriYukle_reject',
					delayMS: 5000,
					args: e,
					block: e => {
						const {promise_aktifBilgileriYukle} = this;
						if (promise_aktifBilgileriYukle)
							promise_aktifBilgileriYukle.reject({ rc: 'userAbort' });
					}
				});*/
				// abortLastOperation();
				this.syncAbortFlag = true;
				promise_aktifBilgileriYukle.reject({ rc: 'userAbort' });
				try { await promise_aktifBilgileriYukle }
				catch (ex) { }
				this.syncAbortFlag = false;
				delete this.promise_aktifBilgileriYukle;
				/*await this.clearUniqueTimeout({ key: 'promise_aktifBilgileriYukle_reject' });*/
			}

			const {data} = e;
			let result;
			try {
				const result = await this.postWSVeriler(data);
				//if (!result)
				//	throw { isError: true, rc: 'emptyResponse' };
				return result;
			}
			catch (ex) {
				((window.savedProcs || {}).hideProgress || hideProgress)();
				hideProgress();
				if ((ex.status == 500 || ex.status == 501 || ex.status == 502) /* && ex.responseJSON*/) {
					const result = ex.responseJSON || { isError: true /*, errorText: ex.statusText*/ };
					result.isError = true;
					const {rc} = result;
					switch (rc) {
						case 'zAcik':
							result.isError = false;
							break;
					}
					if (!result.isError)
						return result;
					
					const _e = { internalFlag: true, noSyncControl: true };
					this.wsAktifBilgileriYukle(_e).then(() =>
						this.wsAktifBilgilerYuklendi(_e));
				}
				throw ex;
			}
		}

		async wsBekleyenVerilerGonderildi(e) {
			e = e || {};
			const {result} = e;
			if (!result)
				return;
			/*if (!result || result.isError)
				return;*/
			
			let {tx} = e;
			const hasTx = !!tx;
			const dbMgr = this.dbMgr_mf;

			const {sonuclar} = result;
			const log2HataliRowIDSet = {};
			const logID2Result = {};
			if (!$.isEmptyObject(sonuclar)) {
				const errorMessageList = [];
				for (const rowID in sonuclar) {
					let subResult = sonuclar[rowID];
					if (subResult == 'true' || subResult == 'false')
						subResult = asBool(subResult);
					
					if (subResult === false || (subResult && typeof subResult == 'string'))
						log2HataliRowIDSet[rowID] = true;
					
					logID2Result[rowID] = subResult;
				}
			}

			const data = e.data || {};
			const tables = data.tables || {};
			let hasChanges = false;
			const queries = [];
			for (const table in tables) {
				const isLogTable = table == `data_Log`;
				const gonderilenIDSet = {};
				const recs = tables[table];
				for (const i in recs) {
					const rec = recs[i];
					const id = rec.rowid;
					
					let uygunmu = !!id;
					if (isLogTable && log2HataliRowIDSet[id]) {
						// uygunmu = false;
						const subResult = logID2Result[id];
						if (subResult != null && subResult !== '') {
							const upd = new MQIliskiliUpdate({
								from: table,
								where: [
									{ degerAta: id, saha: `rowid` }
								],
								set: [
									`gonderildi = '*'`,
									`gonderimKuyruktami = ''`,
									{ degerAta: toJSONStr(subResult), saha: `wsResult` }
								]
							});
							queries.push(upd);
						}
					}
					if (uygunmu)
						gonderilenIDSet[id] = true;
				}
				if (!$.isEmptyObject(gonderilenIDSet)) {
					const upd = new MQIliskiliUpdate({
						from: table,
						where: [
							`gonderildi = ''`,
							{ inDizi: Object.keys(gonderilenIDSet), saha: `rowid` }
						],
						set: [
							`gonderildi = '*'`,
							`gonderimKuyruktami = ''`
						]
					});
					queries.push(upd);
				}
			}

			if (!$.isEmptyObject(queries)) {
				let del = new MQIliskiliDelete({
					from: `data_Log`,
					where: [
						`gonderildi <> ''`,
						`(JulianDay('now') - JulianDay(kayitzamani)) > 1`
					]
				});
				queries.push(del);

				let stm = new MQStm({
					sent: new MQSent({
						from: `data_RestoranFis`,
						where: [
							`gonderildi <> ''`,
							`(JulianDay('now') - JulianDay(kayitzamani)) > 1`
						],
						sahalar: [`id`]
					})
				});
				let fisIDListe = [];
				let rs = await dbMgr.executeSql({ tx: tx, query: stm });
				for (let i = 0; i < rs.rows.length; i++) {
					const rec = rs.rows[i];
					fisIDListe.push(rec.id);
				}
				
				if (!$.isEmptyObject(fisIDListe)) {
					del = new MQIliskiliDelete({
						from: `data_RestoranDetay`,
						where: [
							{ inDizi: fisIDListe, saha: `fisID` }
						]
					});
					queries.push(del);

					del = new MQIliskiliDelete({
						from: `data_RestoranFis`,
						where: [
							{ inDizi: fisIDListe, saha: `id` }
						]
					});
					queries.push(del);
				}
			}

			if (!$.isEmptyObject(queries)) {
				for (const i in queries)
					await dbMgr.executeSql({ tx: tx, query: queries[i] });

				hasChanges = true;
				if (!hasTx)
					tx = await dbMgr.getTx();
			}

			const _param = result.param || result;
			const sonSyncTS = _param.sonSyncTS || now();

			let paramDegistimi = false;
			const {param} = this;
			if (sonSyncTS && sonSyncTS != param.sonSyncTS) {
				param.sonSyncTS = sonSyncTS ? asDate(sonSyncTS) : null;
				paramDegistimi = true;
			}
			if (paramDegistimi)
				await param.kaydet();

			//if (hasTx)
			//	e.tx = tx;
			
			return true;
		}
		
		async wsParamYukle(e) {
			e = e || {};
			const savedFlag = this.timersDisabledFlag;
			this.timersDisabledFlag = true;
			try {
				let _param;
				try {
					_param = await this.wsGetParams(e);
					if ($.isEmptyObject(_param))
						throw { isError: true, rc: 'emptyResponse' };
					
					this._yetki = _param.yetki;
					
					const {param} = this;
					let paramDegistimi = false;
					if (_param && typeof _param == 'object') {
						for (const key in _param) {
							const value = _param[key];
							const oldValue = param[key];
							if (!(value === undefined || value == oldValue)) {
								param[key] = value;
								paramDegistimi = true;
							}
						}
					}
					if (paramDegistimi)
						param.kaydet();
					
					await this.paramYukleSonrasi(e);
					// setTimeout(() => ((window.savedProcs || {}).hideProgress || hideProgress)(), 1000);
				}
				catch (ex) {
					((window.savedProcs || {}).hideProgress || hideProgress)();
					hideProgress();
					// defFailBlock(ex);
					throw ex;
				}

				return _param;
			}
			finally {
				this.timersDisabledFlag = savedFlag;
			}
		}
		
		async wsTanimlariYukle(e) {
			let {promise_verileriGonder} = this;
			if (promise_verileriGonder) {
				await this.setUniqueTimeout({
					key: 'promise_verileriGonder_reject',
					delayMS: 10000,
					args: e,
					block: e => {
						promise_verileriGonder = this.promise_verileriGonder;
						if (promise_verileriGonder)
							promise_verileriGonder.reject({ rc: 'userAbort' });
					}
				});
				try { await promise_verileriGonder }
				catch (ex) { }
				await this.clearUniqueTimeout({ key: 'promise_verileriGonder_reject' });
				// delete this.promise_verileriGonder;
			}
			
			const savedFlag = this.timersDisabledFlag;
			this.timersDisabledFlag = true;
			try {
				await this.wsTanimlariAktifBilgileriYukleOncesiOrtak(e);
				const {param} = this;
				let result;
				try {
					result = this.tanimlar = this.aktifBilgiler = await this.getWSTanimlar(e);
					if ($.isEmptyObject(result)) {
						throw { isError: true, rc: 'emptyResponse' };
						// throw { isError: true, rc: 'emptyResponse' };
					}

					const {sonSyncTS} = (result.aktifBilgiler || {});
					if (sonSyncTS && param.sonSyncTS && asDate(sonSyncTS) <= asDate(param.sonSyncTS)) {
						// return null;
						// throw { isError: true, rc: 'notChanged', errorText: `Değişen veri yok` };
						
						result = this.tanimlar = this.aktifBilgiler = await this.getWSTanimlar($.extend({}, e, { useWebDataSource: false }));
						if ($.isEmptyObject(result))
							throw { isError: true, rc: 'emptyResponse' };
					}
					// setTimeout(() => ((window.savedProcs || {}).hideProgress || hideProgress)(), 1000);
				}
				catch (ex) {
					((window.savedProcs || {}).hideProgress || hideProgress)();
					hideProgress();
					// defFailBlock(ex);
					throw ex;
				}

				return result;
			}
			finally {
				this.timersDisabledFlag = false;
			}
		}

		async wsAktifBilgileriYukle(e) {
			e = e || {};
			/*let promise = this.promise_aktifBilgileriYukle;
			try {
				await promise;
			}
			catch (ex) {
				promise.reject(ex);
				delete this.promise_aktifBilgileriYukle;
				// throw ex;
			}*/
			
			await this.wsTanimlariAktifBilgileriYukleOncesiOrtak(e);
			let promise = this.promise_aktifBilgileriYukle = new $.Deferred(async p => {
				const {indicatorPart, param} = this;
				try {
					if (indicatorPart)
						setTimeout(() => indicatorPart.ajaxCallback({ state: true }), 10);
					
					let result = this.aktifBilgiler = await this.getWSAktifBilgiler(e);
					if ($.isEmptyObject(result)) {
						p.reject({ isError: true, rc: 'emptyResponse' });
						// throw { isError: true, rc: 'emptyResponse' };
					}

					const {sonSyncTS} = result;
					if (!e.noSyncControl && sonSyncTS && param.sonSyncTS && asDate(sonSyncTS) <= asDate(param.sonSyncTS)) {
						// p.resolve(null);
						p.reject({ isError: true, rc: 'notChanged', errorText: `Değişen veri yok` });
						return;
						
						/*result = this.aktifBilgiler = await this.getWSAktifBilgiler($.extend({}, e, { useWebDataSource: false }));
						if ($.isEmptyObject(result)) {
							p.reject({ isError: true, rc: 'emptyResponse' });
							return;
						}*/
					}
					
					// setTimeout(() => ((window.savedProcs || {}).hideProgress || hideProgress)(), 1000);
					this.wsAktifBilgileriYukleCounter = 0;
					p.resolve(result);
					setTimeout(() => { if (indicatorPart) { indicatorPart.ajaxCallback({ state: false }) } }, 2000);
					setTimeout(() => { if (indicatorPart) { indicatorPart.ajaxCallback({ state: false }) } }, 3000);
				}
				catch (ex) {
					if (indicatorPart) {
						indicatorPart.ajaxCallback({ state: null });
						setTimeout(() => {
							if (indicatorPart.lastStates.ajax == null)
								indicatorPart.ajaxCallback({ state: false });
						}, 2000);
					}
					((window.savedProcs || {}).hideProgress || hideProgress)();
					await hideProgress();
					console.error(ex);
					// defFailBlock(ex);
					p.reject(ex);
					this.syncCompleted(e);
				}
				finally {
					delete this.promise_aktifBilgileriYukle;
				}
			});

			return await promise;
		}

		async wsTanimlarYuklendi(e) {
			// await this.clearUniqueTimeout({ key: 'wsAktifBilgileriYukleIslemi' });
			if (this.syncAbortFlag)
				return false;
			
			const {param, tanimlar} = this;
			const aktifBilgiler = this.aktifBilgiler = (tanimlar || {}).aktifBilgiler;
			let paramDegistimi = false;
			if (aktifBilgiler) {
				const _param = aktifBilgiler.params;
				if (_param && _param.yetki) {
					delete _param.yetki;
					paramDegistimi = true;
				}
				if (param && param.yetki) {
					delete param.yetki;
					paramDegistimi = true;
				}
				if (_param && typeof _param == 'object') {
					for (const key in _param) {
						const value = _param[key];
						if (value !== undefined) {
							param[key] = value;
							paramDegistimi = true;
						}
					}
				}
				const {sonSyncTS} = aktifBilgiler;
				if (sonSyncTS && sonSyncTS != param.sonSyncTS) {
					param.sonSyncTS = sonSyncTS ? asDate(sonSyncTS) : null;
					paramDegistimi = true;
				}
			}
			if (paramDegistimi)
				param.kaydet();

			const promise = this.promiseWait = new $.Deferred(async p => {
				try {
					await this.wsTanimlarAktifBilgilerYuklendiOrtak(e);
					await this.tanimlariYukleOkuOrtak(e);
					console.info(`tanımlar webservisten yüklendi`, tanimlar, this);
					await this.tanimlariKaydet(e);
					this.ortakReset_mf(e);
					setTimeout(() => p.resolve(true), 1);
					await this.syncCompleted(e);

					if (!this.uniqueTimers.wsAktifBilgileriYukleIslemi) {
						await new $.Deferred(p => {
							setTimeout(
								async () => p.resolve(await this.wsAktifBilgileriYukleIslemi(e)),
								5000)
						});
					}
				}
				finally {
					setTimeout(() => {
						const p = this.promiseWait;
						if (p)
							p.resolve(true);
						delete this.promiseWait;
					}, 1);
				}
			});
			
			return await promise;
		}

		async wsAktifBilgilerYuklendi(e) {
			e = e || {};
			if (this.syncAbortFlag)
				return false;
			
			const {param} = this;
			const aktifBilgiler = this.aktifBilgiler = this.aktifBilgiler || (this.tanimlar || {}).aktifBilgiler;
			if (!aktifBilgiler)
				return false;

			let paramDegistimi = false;
			const _param = aktifBilgiler.params;
			if (_param && _param.yetki) {
				delete _param.yetki;
				paramDegistimi = true;
			}
			if (param && param.yetki) {
				delete param.yetki;
				paramDegistimi = true;
			}
			if (_param && typeof _param == 'object') {
				for (const key in _param) {
					const value = _param[key];
					if (value !== undefined) {
						param[key] = value;
						paramDegistimi = true;
					}
				}
			}
			// const sonSyncTS = (this.syncServerPort ? now() : (aktifBilgiler.sonSyncTS ? asDate(aktifBilgiler.sonSyncTS) : null)) || null;
			const sonSyncTS = aktifBilgiler.sonSyncTS ? asDate(aktifBilgiler.sonSyncTS) : null;
			if (sonSyncTS && sonSyncTS != param.sonSyncTS) {
				param.sonSyncTS = sonSyncTS;
				paramDegistimi = true;
			}
			if (paramDegistimi)
				param.kaydet();
			
			const promise = this.promiseWait = new $.Deferred(async p => {
				try {
					await this.wsTanimlarAktifBilgilerYuklendiOrtak(e);
					await this.aktifBilgileriYukleOkuOrtak(e);
					console.info(`aktif bilgiler webservisten yüklendi`, aktifBilgiler, this);
					await this.aktifBilgileriKaydet(e);
					if (paramDegistimi)
						this.ortakReset_basit(e);
					setTimeout(() => p.resolve(true), 1);
					await this.syncCompleted(e);
				}
				finally {
					setTimeout(() => {
						const p = this.promiseWait;
						if (p)
							p.resolve(true);
						delete this.promiseWait;
					}, 1);
				}
			});
			return await promise;
		}

		async wsTanimlarAktifBilgilerYuklendiOrtak(e) {
			if (this.syncAbortFlag)
				return false;
			
			const {param} = this;
			const tanimlar = this.tanimlar || {};
			const aktifBilgiler = this.aktifBilgiler || tanimlar.aktifBilgiler || {};
			const {pratikSatismi} = this.class;
			this.promises_veriYukleOrtak = this.promises_veriYukleOrtak || [];

			const ignoreKeySet = asSet(['param', 'params', 'sonSyncTS', 'aktifBilgiler', 'kasiyerIslemleri', 'zHesaplasma']);
			for (const key in tanimlar) {
				if (!ignoreKeySet[key]) {
					let recs = tanimlar[key];
					recs = tanimlar[key] = this.fixRecs({ recs: recs });
				}
			}
			if (tanimlar != aktifBilgiler) {
				for (const key in aktifBilgiler) {
					if (!ignoreKeySet[key]) {
						let recs = aktifBilgiler[key];
						recs = aktifBilgiler[key] = this.fixRecs({ recs: recs });
					}
				}
			}
			
			const {id2MasaTip} = tanimlar;
			if (id2MasaTip) {
				this.id2MasaTip = {};
				for (const id in id2MasaTip) {
					const rec = id2MasaTip[id];
					if (!this.id2MasaTip[id])
						this.id2MasaTip[id] = rec;
				}
			}

			const {id2TahsilSekli} = tanimlar;
			if (id2TahsilSekli) {
				this.id2TahsilSekli = {};
				for (const id in id2TahsilSekli) {
					const rec = id2TahsilSekli[id];
					if (!this.id2TahsilSekli[id]) {
						const inst = new SkyCafeTahsilSekli(rec);
						this.id2TahsilSekli[id] = inst;
					}
				}
			}

			if (this.syncAbortFlag)
				return false;

			const id2Masa = aktifBilgiler.id2Masa || tanimlar.id2Masa;
			if (id2Masa) {
				this.id2Masa = {};
				for (const id in id2Masa) {
					const rec = id2Masa[id];
					const uygunmu = (rec.anaTip == SkyCafeMasaTip.PratikSatis) == pratikSatismi;
					if (uygunmu) {
						if (!this.id2Masa[id]) {
							const inst = new SkyCafeMasa(rec);
							this.id2Masa[id] = inst;
						}
					}
				}
			}
			
			const {id2Fis, id2FisDetay, fisDetayId2OzellikId} = aktifBilgiler;
			if (id2Fis) {
				this.id2Fis = this.id2Fis || {};
				if (!pratikSatismi) {
					for (const id in id2Fis) {
						const rec = id2Fis[id];
						if (!this.id2Fis[id]) {
							if (!rec.detaylar && id2FisDetay) {
								const _detaylar = id2FisDetay[id];
								if (_detaylar != null) {
									const detaySinif = SkyCafeFis.detaySinif || SkyCafeDetay;
									rec.detaylar = [];
									for (const i in _detaylar) {
										const _rec = _detaylar[i];
										const detID = _rec.id;
										let {ozellikIDSet} = _rec;
										if (!ozellikIDSet) {
											const {ozellikIDListe} = _rec;
											if (ozellikIDListe)
												ozellikIDSet = Object.keys(ozellikIDListe);
										}
										if (!ozellikIDSet && fisDetayId2OzellikId != null) {
											const ozRecs = fisDetayId2OzellikId[detID];
											if (ozRecs) {
												for (const j in ozRecs) {
													const ozRefRec = ozRecs[j];
													const _ozID = ozRefRec.id;
													if (_ozID) {
														if (ozellikIDSet == null)
															ozellikIDSet = {};
														ozellikIDSet[_ozID] = true;
													}
												}
											}
										}
										if (ozellikIDSet)
											_rec.ozellikIDSet = ozellikIDSet;
										const det = new detaySinif(_rec);
										rec.detaylar.push(det);
									}
								}
							}
							const inst = new SkyCafeFis(rec);
							this.id2Fis[id] = inst;
							/*const eskiFis = this.id2Fis[id];
							if (eskiFis && eskiFis.gonderildimi)
								await inst.kaydet();*/
							// await inst.yukle();
						}
					}
				}
			}

			if (this.syncAbortFlag)
				return false;

			const {id2UstKategori} = tanimlar;
			if (id2UstKategori) {
				this.id2UstKategori = {};
				for (const id in id2UstKategori) {
					const rec = id2UstKategori[id];
					if (!this.id2UstKategori[id]) {
						const inst = new SkyCafeUstKategori(rec);
						this.id2UstKategori[id] = inst;
					}
				}
			}
			
			const {id2Kategori} = tanimlar;
			if (id2Kategori) {
				this.id2Kategori = {};
				for (const id in id2Kategori) {
					const rec = id2Kategori[id];
					if (!this.id2Kategori[id]) {
						const inst = new SkyCafeKategori(rec);
						this.id2Kategori[id] = inst;
					}
				}
			}
				

			if (this.syncAbortFlag)
				return false;

			const {id2UrunGrup} = tanimlar;
			if (id2UrunGrup) {
				this.id2UrunGrup = {};
				for (const id in id2UrunGrup) {
					const rec = id2UrunGrup[id];
					if (!this.id2UrunGrup[id]) {
						const inst = new SkyCafeUrunGrup(rec);
						this.id2UrunGrup[id] = inst;
					}
				}
			}

			/* const {id2Urun} = tanimlar;
			if (id2Urun) {*/
			this.id2Urun = {};
				/*for (const id in id2Urun) {
					const rec = id2Urun[id];
					if (!this.id2Urun[id]) {
						const inst = new SkyCafeUrun(rec);
						this.id2Urun[id] = inst;
					}
				}
			}*/

			const {id2UrunOzellik} = tanimlar;
			if (id2UrunOzellik) {
				this.id2UrunOzellik = {};
				const urunID2OzellikIDListe = this.urunID2OzellikIDListe = {};
				for (let id in id2UrunOzellik) {
					id = asInteger(id) || id;
					const rec = id2UrunOzellik[id];
					const {stokKod} = rec;
					if (!this.id2UrunOzellik[id]) {
						const inst = new SkyCafeUrunOzellik(rec);
						this.id2UrunOzellik[id] = inst;
						(urunID2OzellikIDListe[stokKod] = urunID2OzellikIDListe[stokKod] || [])
							.push(id);
					}
				}
			}

			if (this.syncAbortFlag)
				return false;

			let keys = ['kasiyerIslemleri', 'zHesaplasma'];
			for (const i in keys) {
				const key = keys[i];
				const value = aktifBilgiler[key] || tanimlar[key];
				if (value !== undefined)
					this[key] = value;
			}

			let paramDegistimi = false;
			const _param = aktifBilgiler.params || tanimlar.params;
			if (_param && _param.yetki) {
				delete _param.yetki;
				paramDegistimi = true;
			}
			if (param && param.yetki) {
				delete param.yetki;
				paramDegistimi = true;
			}
			if (_param && typeof _param == 'object') {
				for (const key in _param) {
					const value = _param[key];
					if (value !== undefined) {
						param[key] = value;
						paramDegistimi = true;
					}
				}
			}

			let _value = asInteger(qs.kasaNo || qs.kasano);
			if (_value && _value != param.kasaNo) {
				param.kasaNo = _value;
				paramDegistimi = true;
			}
			_value = qs.subeKod || qs.subekod;
			if (_value && _value != param.subeKod) {
				param.subeKod = _value;
				paramDegistimi = true;
			}
			
			/*const keys = [
				'id2MasaTip', 'id2Masa', 'id2Fis', 'id2Kategori', 'id2UrunGrup',
				'id2Urun', 'id2BarkodRef', 'id2TartiRef', 'id2BarkodAyrisim'
			];
			for (const i in keys) {
				const key = keys[i];
				const value = tanimlar[keys];
				if (value != null)
					this[key] = value;
			}*/

			const {zHesaplasma} = this;
			if (zHesaplasma) {
				const recs = zHesaplasma.recs || zHesaplasma || [];
				const rec_bitTS = recs.find(rec => rec.belirtec == 'bitTS');
				if (rec_bitTS) {
					const kapandimi = !!asDate(rec_bitTS.ts || rec_bitTS.bedel);
					const {zBilgi} = this;
					if (zBilgi.kapandimi != kapandimi) {
						zBilgi.kapandimi = kapandimi;
						paramDegistimi = true;
					}
				}
			}

			if (paramDegistimi) {
				await param.kaydet({ tx: e.tx });
				paramDegistimi = false;
			}
		}

		async tanimlariOku(e) {
			e = e || {};
			const {noAbort} = e;
			if (!noAbort && this.syncAbortFlag)
				return false;
			
			const dbMgr = this.dbMgr_mf;
			const {pratikSatismi} = this.class;
			let stm, recs;

			this.promises_veriYukleOrtak = this.promises_veriYukleOrtak || [];

			stm = new MQStm({
				sent: new MQSent({
					from: `mst_TahsilatSekli mst`,
					sahalar: [ `mst.rowid`, `mst.*` ]
				}),
				orderBy: [`mst.kodNo`]
			});
			const id2TahsilSekli = this.id2TahsilSekli = {};
			recs = await dbMgr.executeSqlReturnRows({ query: stm });
			for (const i in recs) {
				const rec = recs[i];
				const {kodNo} = rec;
				const inst = new SkyCafeTahsilSekli();
				await inst.setValues({ rec: rec });
				id2TahsilSekli[kodNo] = inst;
			}

			stm = new MQStm({
				sent: new MQSent({
					from: `mst_ResMasaTip mst`,
					sahalar: [ `mst.rowid`, `mst.*` ]
				}),
				orderBy: [`mst.kod`]
			});
			const id2MasaTip = this.id2MasaTip = {};
			recs = await dbMgr.executeSqlReturnRows({ query: stm });
			for (const i in recs) {
				const rec = recs[i];
				const {kod} = rec;
				id2MasaTip[kod] = rec;
			}

			stm = new MQStm({
				sent: new MQSent({
					from: `mst_ResUstKategori mst`,
					sahalar: [ `mst.rowid`, `mst.*` ]
				}),
				orderBy: [`mst.vioID`]
			});
			const id2UstKategori = this.id2UstKategori = {};
			recs = await dbMgr.executeSqlReturnRows({ query: stm });
			for (const i in recs) {
				const rec = recs[i];
				const {vioID} = rec;
				const inst = new SkyCafeUstKategori();
				await inst.yukle({ rec: rec });
				id2UstKategori[vioID] = inst;
			}

			stm = new MQStm({
				sent: new MQSent({
					from: `mst_ResKategori mst`,
					sahalar: [ `mst.rowid`, `mst.*` ]
				}),
				orderBy: [`mst.vioID`]
			});
			
			const id2Kategori = this.id2Kategori = {};
			recs = await dbMgr.executeSqlReturnRows({ query: stm });
			for (const i in recs) {
				const rec = recs[i];
				const {vioID} = rec;
				const inst = new SkyCafeKategori();
				// await inst.yukle({ rec: rec });
				await inst.setValues({ rec: rec });
				id2Kategori[vioID] = inst;
			}

			stm = new MQStm({
				sent: new MQSent({
					from: `mst_StokGrup mst`,
					sahalar: [ `mst.rowid`, `mst.*` ]
				}),
				orderBy: [`mst.kod`]
			});
			const id2UrunGrup = this.id2UrunGrup = {};
			recs = await dbMgr.executeSqlReturnRows({ query: stm });
			for (const i in recs) {
				const rec = recs[i];
				const {kod} = rec;
				const inst = new SkyCafeUrunGrup();
				await inst.setValues({ rec: rec });
				id2UrunGrup[kod] = inst;
			}

			/*stm = new MQStm({
				sent: new MQSent({
					from: `mst_Stok mst`,
					sahalar: [ `mst.rowid`, `mst.*` ]
				}),
				orderBy: [`mst.kod`]
			});*/
			const id2Urun = this.id2Urun = {};
			/*recs = await dbMgr.executeSqlReturnRows({ query: stm });
			for (const i in recs) {
				const rec = recs[i];
				const {kod} = rec;
				const inst = new SkyCafeUrun();
				await inst.setValues({ rec: rec });
				id2Urun[kod] = inst;
			}*/

			stm = new MQStm({
				sent: new MQSent({
					from: `mst_StokOzellik mst`,
					sahalar: [ `mst.rowid`, `mst.*` ]
				}),
				orderBy: [`mst.stokKod`, `mst.vioID`]
			});
			const id2UrunOzellik = this.id2UrunOzellik = {};
			const urunID2OzellikIDListe = this.urunID2OzellikIDListe = {};
			recs = await dbMgr.executeSqlReturnRows({ query: stm });
			for (const i in recs) {
				const rec = recs[i];
				const {vioID, stokKod} = rec;
				const inst = new SkyCafeUrunOzellik();
				await inst.setValues({ rec: rec });
				id2UrunOzellik[vioID] = inst;
				(urunID2OzellikIDListe[stokKod] = urunID2OzellikIDListe[stokKod] || [])
					.push(vioID);
			}

			/*stm = new MQStm({
				sent: new MQSent({
					from: `mst_ResMasa mst`,
					sahalar: [ `mst.rowid`, `mst.*` ]
				}),
				orderBy: [`mst.anaTip`, `mst.tipKod`, `mst.kod`]
			});
			stm.sentDo(sent => {
				if (pratikSatismi)
					sent.where.degerAta(SkyCafeMasaTip.PratikSatis, `mst.anaTip`);
				else
					sent.where.notDegerAta(SkyCafeMasaTip.PratikSatis, `mst.anaTip`);
			});
			const id2Masa = this.id2Masa = {};
			recs = await dbMgr.executeSqlReturnRows({ query: stm });
			this.promises_veriYukleOrtak.push(new $.Deferred(async p => {
				for (const i in recs) {
					const rec = recs[i];
					const {kod} = rec;
					if (!id2Masa[kod]) {
						const inst = new SkyCafeMasa();
						await inst.setValues({ rec: rec });
						id2Masa[kod] = inst;
					}
				}
				p.resolve({ result: id2Masa });
			}));

			this.id2Fis = this.id2Fis || {};
			stm = new MQStm({
				sent: new MQSent({
					from: `data_RestoranFis fis`,
					where: [
						`fis.silindi = ''`,
						`fis.gecici = ''`,
						`fis.kapanmazamani = ''`
					],
					sahalar: [ `fis.rowid`, `fis.*` ]
				}),
				orderBy: [`fis.rowid`]
			});
			const id2Fis = this.id2Fis = {};
			recs = await dbMgr.executeSqlReturnRows({ query: stm });
			this.promises_veriYukleOrtak.push(new $.Deferred(async p => {
				for (const i in recs) {
					const rec = recs[i];
					const id = rec.id || rec.vioID || rec.rowid;
					const inst = new SkyCafeFis();
					await inst.yukle({ rec: rec });
					await inst.detaylariYukle();
					id2Fis[id] = inst;
				}
				p.resolve({ result: id2Fis });
			}));*/

			// await this.aktifBilgileriOku(e);
			await this.tanimlariYukleOkuOrtak(e);

			console.info(`tanımlar veritabanından okundu`, this.tanimlar, this);
		}

		async aktifBilgileriOku(e) {
			e = e || {};
			const {noAbort} = e;
			if (!noAbort && this.syncAbortFlag)
				return false;

			const dbMgr = this.dbMgr_mf;
			let stm, recs;

			/*if (!this.class.pratikSatismi) {
				stm = new MQStm({
					sent: new MQSent({
						from: `mst_ResMasa mas`,
						sahalar: [ `mas.rowid`, `mas.*` ]
					}),
					orderBy: [`mas.rowid`]
				});
				const id2Masa = this.id2Masa = {};
				recs = await dbMgr.executeSqlReturnRows({ query: stm });
				for (const i in recs) {
					const rec = recs[i];
					const {kod} = rec;
					if (!id2Masa[kod]) {
						const inst = new SkyCafeMasa();
						await inst.setValues({ rec: rec });
						id2Masa[kod] = inst;
					}
				}
			}*/

			await this.aktifBilgileriYukleOkuOrtak(e);
			console.info(`aktif bilgiler veritabanından okundu`, this.aktifBilgiler, this);
		}

		async tanimlariYukleOkuOrtak(e) {
			e = e || {};
			this.tanimlariVeAktifBilgileriYukleOkuOrtak($.extend({}, e, { aktifBilgimi: false }));
		}

		async aktifBilgileriYukleOkuOrtak(e) {
			e = e || {};
			this.tanimlariVeAktifBilgileriYukleOkuOrtak($.extend({}, e, { aktifBilgimi: true }));
		}

		async tanimlariVeAktifBilgileriYukleOkuOrtak(e) {
			e = e || {};
			const {noAbort} = e;
			if (!noAbort && this.syncAbortFlag)
				return false;
			
			const {pratikSatismi} = this.class;
			const dbMgr = this.dbMgr_mf;
			let {tx} = e;
			const hasTx = !!tx;

			/*const {param} = this;
			const {sessionInfo} = sky.config;
			if (sessionInfo && sessionInfo.hasSessionOrUser) {
				const {user} = sessionInfo;
				let sent = new MQSent({
					from: `mst_Kasiyer`,
					where: [{ degerAta: user, saha: `kod `}],
					sahalar: [`yetki`]
				});
				let stm = new MQStm({ sent: sent });
				const yetki = await dbMgr.tekilDegerExecuteSelect({ tx: tx, query: stm });
				if (yetki != null) {
					param.yetki = yetki;
					if (!(yetki == 'admin' || yetki == 'sef'))
						sessionInfo.isAdmin = false;
				}
			}

			const {sessionInfo} = sky.config;
			const {param} = this;
			if (param.yetki != null && sessionInfo && sessionInfo.hasSessionOrUser) {
				let {yetki} = param;
				if (yetki == 'sef')
					yetki = 'admin';
				
				const upd = new MQIliskiliUpdate({
					from: `mst_Kasiyer`,
					where: { degerAta: sessionInfo.user, saha: `kod` },
					set: { degerAta: yetki, saha: `yetki` }
				});
				await dbMgr.executeSql({ tx: tx, query: upd });
				if (!hasTx)
					tx = await dbMgr.getTx();
				this.ortakReset_mf();
			}*/
			
			let id2Masa = this.id2Masa = this.id2Masa || {};
			let islemGormusMasaVarmi = false;
			if ($.isEmptyObject(id2Masa)) {
				const sent = new MQSent({
					from: `${SkyCafeMasa.table} mas`,
					where: [
						{ not: !this.class.pratikSatismi, degerAta: SkyCafeMasaTip.PratikSatis, saha: `mas.anaTip` },
						`kod <> ''`,
					],
					sahalar: [`mas.*`]
				});
				const stm = new MQStm({ sent: sent });
				const rs = await dbMgr.executeSql({ tx: tx, query: stm });
				for (let i = 0; i < rs.rows.length; i++) {
					const rec = rs.rows[i];
					const id = rec.id || rec.kod;
					const masa = new SkyCafeMasa({ id: id });
					await masa.setValues({ rec: rec });
					id2Masa[id] = masa;
					if (masa.aktifFisID || masa.servisDisimi)
						islemGormusMasaVarmi = true;
				}
			}
			
			if (pratikSatismi && !islemGormusMasaVarmi) {
				const hvListe = [];
				const _id2Masa = this.id2Masa || {};
				id2Masa = this.id2Masa = {};
				let {fisSayisi} = this.param;
				fisSayisi = fisSayisi || 5;
				for (let i = 1; i <= fisSayisi; i++) {
					const masa = id2Masa[i] = new SkyCafeMasa({
						id: i, aciklama: `Fis ${i.toString().padStart(2, '0')}`,
						anaTip: SkyCafeMasaTip.PratikSatis
					});
					hvListe.push(await masa.hostVars());
				}
				if (!$.isEmptyObject(hvListe)) {
					await dbMgr.insertOrReplaceTable({
						table: SkyCafeMasa.table, mode: 'insertIgnore',
						hvListe: hvListe, tx: e.tx
					});
				}
				/*if (!this.aktifMasaID && !$.isEmptyObject(id2Masa))
					this.aktifMasaID = (Object.values(id2Masa)[0] || {}).id;*/
			}

			const kullanilanMasaTipIDSet = this.kullanilanMasaTipIDSet = {};
			const id2MasaAnaTip = this.id2MasaAnaTip = {};
			for (const id in id2Masa) {
				const inst = id2Masa[id];
				const {tipKod} = inst;
				if (tipKod)
					kullanilanMasaTipIDSet[tipKod] = true;
				id2MasaAnaTip[id] = inst.anaTip || (pratikSatismi ? SkyCafeMasaTip.PratikSatis : SkyCafeMasaTip.Adisyon);
			}

			const {id2Kategori} = this;
			const kullanilanUstKategoriIDSet = this.kullanilanUstKategoriIDSet = {};
			for (const id in id2Kategori) {
				const inst = id2Kategori[id];
				const {ustKategoriID} = inst;
				if (ustKategoriID)
					kullanilanUstKategoriIDSet[ustKategoriID] = true;
			}

			this.zBilgiGoster(e);

			await Promise.all(this.promises_veriYukleOrtak || []);
			delete this.promises_veriYukleOrtak;
		}

		async tanimlariKaydet(e) {
			e = e || {};
			const {pratikSatismi} = this.class;
			const dbMgr = this.dbMgr_mf;
			const {param} = this;

			await Promise.all(this.promises_veriYukleOrtak || []);
			delete this.promises_veriYukleOrtak;

			let del, hvListe;
			const {tanimlar, id2Masa, id2Fis} = this;
			if (!tanimlar)
				return false;

			const aktifBilgiler = this.aktifBilgiler || (tanimlar || {}).aktifBilgiler || {};
			const {id2Kasiyer, id2TahsilSekli, id2UrunGrup, id2Urun,
				   id2BarkodRef, id2TartiRef, id2TartiFormat, id2BarkodAyrisim, id2BarkodOzelKural} = tanimlar;
			const id2MasaTip = aktifBilgiler.id2MasaTip || tanimlar.id2MasaTip;
			const id2UstKategori = aktifBilgiler.id2UstKategori || tanimlar.id2UstKategori;
			const id2Kategori = aktifBilgiler.id2Kategori || tanimlar.id2Kategori;
			const id2KategoriDetay = aktifBilgiler.id2KategoriDetay || tanimlar.id2KategoriDetay;
			const id2UrunOzellik = aktifBilgiler.id2UrunOzellik || tanimlar.id2UrunOzellik;
			const hasTx = !!e.tx;
			let tx = e.tx || (await dbMgr.getTx());

			if (id2Kasiyer) {
				const {sessionInfo} = sky.config;
				const user = sessionInfo && sessionInfo.hasSessionOrUser ? sessionInfo.user : null;
				
				del = new MQIliskiliDelete({
					from: `mst_Kasiyer`,
					where: [`kod <> ''`]
				});
				hvListe = [];
				for (const id in id2Kasiyer) {
					const rec = id2Kasiyer[id];
					let {yetki} = rec;
					if (yetki == 'sef')
						yetki = 'admin';
					
					if (user && rec.id == user) {
						if (yetki != null) {
							// param.yetki = yetki;
							// await param.kaydet();
							if (!(yetki == 'admin' || yetki == 'sef'))
								sessionInfo.isAdmin = false;
						}
					}
					
					const hv = {
						kod: rec.id, aciklama: rec.aciklama || '',
						passMD5: rec.passMD5 || '',
						yetki: (
							yetki == null
								? asBool(rec.sefmi) ? 'admin' : ''
								: yetki || ''
						)
					};
					hvListe.push(hv);
				}
				if (del)
					await dbMgr.executeSql({ tx: tx, query: del });
				if (!$.isEmptyObject(hvListe)) {
					await dbMgr.insertOrReplaceTable({
						table: 'mst_Kasiyer', mode: 'insertIgnore',
						hvListe: hvListe, tx: tx
					});
					if (!hasTx)
						tx = await dbMgr.getTx();
				}
			}
			
			if (id2TahsilSekli) {
				del = new MQIliskiliDelete({
					from: `mst_TahsilatSekli`
				});
				hvListe = [];
				for (const id in id2TahsilSekli) {
					const rec = id2TahsilSekli[id];
					const hv = {
						kodNo: asInteger(rec.id), aciklama: rec.aciklama || '',
						tahsilTipi: rec.tip
					};
					hvListe.push(hv);
				}
				if (del)
					await dbMgr.executeSql({ tx: tx, query: del });
				if (!$.isEmptyObject(hvListe)) {
					await dbMgr.insertOrReplaceTable({
						table: 'mst_TahsilatSekli', mode: 'insertIgnore',
						hvListe: hvListe, tx: tx
					});
					if (!hasTx)
						tx = await dbMgr.getTx();
				}
			}
			
			if (id2MasaTip) {
				del = new MQIliskiliDelete({
					from: `mst_ResMasaTip`,
					where: [`kod <> ''`]
				});
				hvListe = [];
				for (const id in id2MasaTip) {
					const rec = id2MasaTip[id];
					const hv = {
						kod: rec.id, aciklama: rec.aciklama || ''
					};
					hvListe.push(hv);
				}
				if (del)
					await dbMgr.executeSql({ tx: tx, query: del });
				if (!$.isEmptyObject(hvListe)) {
					await dbMgr.insertOrReplaceTable({
						table: 'mst_ResMasaTip', mode: 'insertIgnore',
						hvListe: hvListe, tx: tx
					});
					if (!hasTx)
						tx = await dbMgr.getTx();
				}
			}

			if (id2UstKategori) {
				del = new MQIliskiliDelete({
					from: `mst_ResUstKategori`
				});
				hvListe = [];
				for (const id in id2UstKategori) {
					const rec = id2UstKategori[id];
					const hv = {
						vioID: rec.id || rec.vioID || rec.uzakID,
						// tipKod: rec.tipKod || '',
						aciklama: rec.aciklama || ''
					};
					hvListe.push(hv);
				}
				if (del)
					await dbMgr.executeSql({ tx: tx, query: del });
				if (!$.isEmptyObject(hvListe)) {
					await dbMgr.insertOrReplaceTable({
						table: 'mst_ResUstKategori', mode: 'insertIgnore',
						hvListe: hvListe, tx: tx
					});
					if (!hasTx)
						tx = await dbMgr.getTx();
				}
			}

			if (id2Kategori) {
				del = new MQIliskiliDelete({
					from: `mst_ResKategori`
				});
				hvListe = [];
				for (const id in id2Kategori) {
					const rec = id2Kategori[id];
					const hv = {
						vioID: rec.id || rec.vioID || rec.uzakID,
						ustKategoriID: rec.ustKategoriID || null,
						tipKod: rec.tipKod || '',
						uygunlukPratikSatis: asInteger(rec.uygunlukPratikSatis) || 0,
						uygunlukAdisyon: asInteger(rec.uygunlukAdisyon) || 0,
						uygunlukPaket: asInteger(rec.uygunlukPaketSiparis) || asInteger(rec.uygunlukPaket) || 0,
						uygunlukSelfServis: asInteger(rec.uygunlukSelfServis) || 0,
						aciklama: rec.aciklama || ''
					};
					hvListe.push(hv);
				}
				if (del)
					await dbMgr.executeSql({ tx: tx, query: del });
				if (!$.isEmptyObject(hvListe)) {
					await dbMgr.insertOrReplaceTable({
						table: 'mst_ResKategori', mode: 'insertIgnore',
						hvListe: hvListe, tx: tx
					});
					if (!hasTx)
						tx = await dbMgr.getTx();
				}

				del = new MQIliskiliDelete({
					from: `mst_ResKategoriDetay`
				});
				hvListe = [];
				for (const id in id2Kategori) {
					const fis = id2Kategori[id];
					let {detaylar} = fis;
					if ($.isEmptyObject(detaylar) && id2KategoriDetay) {
						detaylar = fis.detaylar = [];
						const subRecs = id2KategoriDetay[id];
						if (subRecs) {
							for (const j in subRecs) {
								const _rec = subRecs[j];
								const {kayittipi} = _rec;
								_rec.grupmu = kayittipi == 'G';
								const det = new SkyCafeKategori.detaySinif(_rec);
								detaylar.push(det);
							}
						}
					}
					
					let maxSeq = 0;
					for (const i in detaylar) {
						const det = detaylar[i];
						const seq = det.seq || (maxSeq + 1);
						maxSeq = Math.max(seq, maxSeq);
						const hv = {
							fissayac: fis.id || fis.vioID || fis.uzakID,
							seq: seq,
							grupmu: asBool(det.grupmu),
							refID: det.refID
						};
						hvListe.push(hv);
					}
				}
				if (del)
					await dbMgr.executeSql({ tx: tx, query: del });
				if (!$.isEmptyObject(hvListe)) {
					await dbMgr.insertOrReplaceTable({
						table: 'mst_ResKategoriDetay', mode: 'insertIgnore',
						hvListe: hvListe, tx: tx
					});
					if (!hasTx)
						tx = await dbMgr.getTx();
				}
			}
			
			if (id2UrunGrup) {
				del = new MQIliskiliDelete({
					from: `mst_StokGrup`,
					where: [`kod <> ''`]
				});
				hvListe = [];
				for (const id in id2UrunGrup) {
					const rec = id2UrunGrup[id];
					const hv = {
						kod: rec.id, aciklama: rec.aciklama || ''
					};
					hvListe.push(hv);
				}
				if (del)
					await dbMgr.executeSql({ tx: tx, query: del });
				if (!$.isEmptyObject(hvListe)) {
					await dbMgr.insertOrReplaceTable({
						table: 'mst_StokGrup', mode: 'insertIgnore',
						hvListe: hvListe, tx: tx
					});
					if (!hasTx)
						tx = await dbMgr.getTx();
				}
			}
			
			if (id2Urun) {
				del = new MQIliskiliDelete({
					from: `mst_Stok`,
					where: [`kod <> ''`]
				});
				hvListe = [];
				const fiyatHV2IO = {
					adisyonFiyat: SkyCafeMasaTip.Adisyon,
					selfServisFiyat: SkyCafeMasaTip.SelfServis,
					paketFiyat: SkyCafeMasaTip.Paket,
					praFiyat: SkyCafeMasaTip.PratikSatis
				};
				for (const id in id2Urun) {
					const rec = id2Urun[id];
					const fiyatYapi = rec.fiyatYapi || {};
					const hv = {
						kod: rec.id, aciklama: rec.aciklama || '',
						brm: rec.brm || 'AD', kdvOrani: asInteger(rec.kdvOrani) || 0,
						tartilabilirmi: asBool(rec.tartilabilirmi),
						ilkTartiKod: rec.ilkTartiKod || '',
						degiskenFiyatmi: bool2Int(rec.degiskenFiyatmi),
						ozelFiyat: asFloat(rec.ozelFiyat) || 0
						/*adisyonFiyat: asFloat(fiyatYapi[SkyCafeMasaTip.Adisyon]) || 0,
						selfServisFiyat: asFloat(fiyatYapi[SkyCafeMasaTip.SelfServis]) || 0,
						paketFiyat: asFloat(fiyatYapi[SkyCafeMasaTip.Paket]) || 0,
						praFiyat: asFloat(fiyatYapi[SkyCafeMasaTip.PratikSatis]) || 0*/
					};
					for (const hvKey in fiyatHV2IO) {
						const ioKey = fiyatHV2IO[hvKey];
						let value = fiyatYapi[ioKey];
						if (value == null)
							value = rec[`fiyat_${ioKey}`];
						value = asFloat(value)|| 0;
						hv[hvKey] = value;
					}
					hvListe.push(hv);
				}
				if (del)
					await dbMgr.executeSql({ tx: tx, query: del });
				if (!$.isEmptyObject(hvListe)) {
					await dbMgr.insertOrReplaceTable({
						table: 'mst_Stok', mode: 'insertIgnore',
						hvListe: hvListe, tx: tx
					});
					if (!hasTx)
						tx = await dbMgr.getTx();
				}
			}
			
			if (id2UrunOzellik) {
				del = new MQIliskiliDelete({
					from: `mst_StokOzellik`
				});
				hvListe = [];
				for (const id in id2UrunOzellik) {
					const rec = id2UrunOzellik[id];
					const hv = {
						vioID: asInteger(rec.id), stokKod: rec.stokKod,
						ozellik: rec.ozellik || rec.aciklama,
						ekFiyat: asFloat(rec.ekFiyat || rec.fiyat) || 0
					};
					hvListe.push(hv);
				}
				if (del)
					await dbMgr.executeSql({ tx: tx, query: del });
				if (!$.isEmptyObject(hvListe)) {
					await dbMgr.insertOrReplaceTable({
						table: 'mst_StokOzellik', mode: 'insertIgnore',
						hvListe: hvListe, tx: tx
					});
					if (!hasTx)
						tx = await dbMgr.getTx();
				}
			}
			
			if (id2BarkodRef) {
				del = new MQIliskiliDelete({
					from: `mst_BarkodReferans`
				});
				hvListe = [];
				for (const id in id2BarkodRef) {
					const rec = id2BarkodRef[id];
					const hv = {
						refKod: rec.refKod || rec.id, stokKod: rec.stokKod,
						varsayilanmi: bool2Int(rec.varsayilanmi) || 0
					};
					hvListe.push(hv);
				}
				if (del)
					await dbMgr.executeSql({ tx: tx, query: del });
				if (!$.isEmptyObject(hvListe)) {
					await dbMgr.insertOrReplaceTable({
						table: 'mst_BarkodReferans', mode: 'insertIgnore',
						hvListe: hvListe, tx: tx
					});
					if (!hasTx)
						tx = await dbMgr.getTx();
				}
			}
			
			if (id2TartiRef) {
				del = new MQIliskiliDelete({
					from: `mst_TartiReferans`
				});
				hvListe = [];
				for (const id in id2TartiRef) {
					const rec = id2TartiRef[id];
					const hv = {
						refKod: rec.id, stokKod: rec.stokKod
					};
					hvListe.push(hv);
				}
				if (del)
					await dbMgr.executeSql({ tx: tx, query: del });
				if (!$.isEmptyObject(hvListe)) {
					await dbMgr.insertOrReplaceTable({
						table: 'mst_TartiReferans', mode: 'insertIgnore',
						hvListe: hvListe, tx: tx
					});
					if (!hasTx)
						tx = await dbMgr.getTx();
				}
			}
			
			if (id2TartiFormat) {
				del = new MQIliskiliDelete({
					from: `mst_BarTarti`
				});
				hvListe = [];
				for (const id in id2TartiFormat) {
					const getValue = (rec, key) => {
						let value = rec[key];
						if (value == null)
							value = rec[key.toLowerCase()];
						return value;
					}
					const rec = id2TartiFormat[id];
					const hv = {
						kod: rec.kod || rec.id, aciklama: rec.aciklama || '',
						stokBas: asInteger(getValue(rec, 'stokBas')) || 0, stokHane: asInteger(getValue(rec, 'stokHane')) || 0,
						miktarBas: asInteger(getValue(rec, 'miktarBas')) || 0, miktarHane: asInteger(getValue(rec, 'miktarHane')) || 0, miktarBolen: asFloat(getValue(rec, 'miktarBolen')) || 0,
						fiyatBas: asInteger(getValue(rec, 'fiyatBas')) || 0, fiyatHane: asInteger(getValue(rec, 'fiyatHane')) || 0, fiyatBolen: asFloat(getValue(rec, 'fiyatBolen')) || 0
					};
					hvListe.push(hv);
				}
				if (del)
					await dbMgr.executeSql({ tx: tx, query: del });
				if (!$.isEmptyObject(hvListe)) {
					await dbMgr.insertOrReplaceTable({
						table: 'mst_BarTarti', mode: 'insertIgnore',
						hvListe: hvListe, tx: tx
					});
					if (!hasTx)
						tx = await dbMgr.getTx();
				}
			}
			
			if (id2BarkodAyrisim) {
				del = new MQIliskiliDelete({
					from: `mst_BarAyrisim`
				});
				hvListe = [];
				for (const id in id2BarkodAyrisim) {
					const rec = id2BarkodAyrisim[id];
					const hv = {
						kod: rec.kod || rec.id, aciklama: rec.aciklama || '',
						formatTipi: rec.formattipi || '', bosFormat: rec.bosformat || '',
						ayiracSayi: asInteger(rec.ayiracsayi) || 0, ayiracStr: rec.ayiracstr || '',
						barkodBas: rec.barkodbas, barkodHane: rec.barkodhane,
						stokBas: rec.stokbas || 0, stokHane: rec.stokhane || 0,
						stokBaslangicdanmi: bool2Int(rec.stokBaslangicdanmi),
						miktarBas: rec.miktarbas || 0, miktarHane: rec.miktarhane || 0
					};
					hvListe.push(hv);
				}
				if (del)
					await dbMgr.executeSql({ tx: tx, query: del });
				if (!$.isEmptyObject(hvListe)) {
					await dbMgr.insertOrReplaceTable({
						table: 'mst_BarAyrisim', mode: 'insertIgnore',
						hvListe: hvListe, tx: tx
					});
					if (!hasTx)
						tx = await dbMgr.getTx();
				}
			}
			
			if (id2BarkodOzelKural) {
				del = new MQIliskiliDelete({
					from: `mst_BarOzelKural`
				});
				hvListe = [];
				for (const id in id2BarkodOzelKural) {
					const rec = id2BarkodOzelKural[id];
					const hv = {
						kod: rec.id, aciklama: rec.aciklama || ''
					};
					hvListe.push(hv);
				}
				if (del)
					await dbMgr.executeSql({ tx: tx, query: del });
				if (!$.isEmptyObject(hvListe)) {
					await dbMgr.insertOrReplaceTable({
						table: 'mst_BarOzelKural', mode: 'insertIgnore',
						hvListe: hvListe, tx: tx
					});
					if (!hasTx)
						tx = await dbMgr.getTx();
				}
			}

			/*if (!pratikSatismi && id2Masa) {
				del = new MQIliskiliDelete({
					from: `mst_ResMasa`,
					where: [`kod <> ''`]
				});
				if (del)
					await dbMgr.executeSql({ tx: tx, query: del });
				if (!hasTx)
					tx = await dbMgr.getTx();
			}*/

			await this.aktifBilgileriKaydet(e);
			if (!hasTx)
				tx = await dbMgr.getTx();

			//if (!hasTx)
			//	tx = await dbMgr.getTx();

			console.info(`tanımlar veritabanına kaydedildi`, tanimlar, this);
		}

		async aktifBilgileriKaydet(e) {
			e = e || {};
			const dbMgr = this.dbMgr_mf;
			const {pratikSatismi} = this.class;
			const {param, aktifBilgiler, id2Masa, id2Fis, kasiyerIslemleri, zHesaplasma, kasiyerKod} = this;
			const {zBilgi} = this;
			const {zNo, zSayac} = (zBilgi || {});
			await Promise.all(this.promises_veriYukleOrtak || []);

			delete this.promises_veriYukleOrtak;

			let del, hvListe, query, queries;
			let paramDegistimi = false;

			const hasTx = !!e.tx;
			let tx = e.tx || (await dbMgr.getTx());

			if (kasiyerIslemleri) {
				const hvListe = [];
				const recs = kasiyerIslemleri.recs || kasiyerIslemleri;
				for (const i in recs) {
					const rec = recs[i];
					hvListe.push({
						kasiyerKod: kasiyerKod,
						kayitzamani: Utils.asReverseDateTimeString(asDate(rec.zaman) || now()),
						gonderildi: '*',
						silindi: '',
						seq: rec.seq || (i + 1),
						vioID: rec.vioID || null,
						aciklama: rec.aciklama || '',
						tip: rec.tip || rec.islemTipi || '',
						/*acilis: asFloat(rec.acilis) || 0,
						teslim: asFloat(rec.teslim) || 0,*/
						giren: asFloat(rec.giren) || 0,
						cikan: asFloat(rec.cikan) || 0
					});
				}
				const del = new MQIliskiliDelete({
					from: `data_KasiyerIslem`,
					where: [{ degerAta: kasiyerKod, saha: `kasiyerKod` }]
				});

				if (!hasTx)
					tx = await dbMgr.getTx();
				await dbMgr.executeSql({ tx: tx, query: del });
				await dbMgr.insertOrReplaceTable({
					tx: tx, table: 'data_KasiyerIslem',
					mode: 'insertIgnore', hvListe: hvListe
				});
				if (!hasTx)
					tx = await dbMgr.getTx();
			}

			if (zHesaplasma) {
				const hvListe = [];
				const recs = zHesaplasma.recs || zHesaplasma;
				for (const i in recs) {
					const rec = recs[i];
					if (zNo) {
						hvListe.push({
							kayitzamani: Utils.asReverseDateTimeString(asDate(rec.zaman) || now()),
							gonderildi: '*',
							zSayac: zSayac,
							zNo: zNo,
							seq: rec.seq || (i + 1),
							belirtec: rec.belirtec || null,
							aciklama: rec.aciklama || '',
							bedel: rec.ts == null
										? (rec.bedel == null ? null : rec.bedel) :
										(typeof rec.ts == 'string' ? rec.ts : dateTimeToString(rec.ts)),
							olasiBedel: rec.olasiBedel == null ? null : rec.olasiBedel
						});
					}
				}
				const del = new MQIliskiliDelete({
					from: `data_ZHesaplasma`,
					where: [{ degerAta: zNo, saha: `zNo` }]
				});

				if (!hasTx)
					tx = await dbMgr.getTx();
				await dbMgr.executeSql({ tx: tx, query: del });
				await dbMgr.insertOrReplaceTable({
					tx: tx, table: 'data_ZHesaplasma',
					mode: 'insertIgnore', hvListe: hvListe
				});
				if (!hasTx)
					tx = await dbMgr.getTx();
			}

			if (!pratikSatismi && id2Fis) {
				/*const whClause = `gonderildi <> ''`;
				queries = [
					`DELETE FROM data_RestoranDetay WHERE fisID IN ( SELECT id FROM data_RestoranFis WHERE ${whClause} )`,
					`DELETE FROM data_RestoranFis WHERE ${whClause}`,
				];
				for (const i in queries)
					await dbMgr.executeSql({ tx: tx, query: queries[i] });
				if (!hasTx)
					tx = await dbMgr.getTx();*/

				/*const mevcutFisIDSet = {};
				const rs = await dbMgr.executeSql({ query: `SELECT id FROM data_RestoranFis` });
				let maxID = 0;
				for (let i = 0; i < rs.rows.length; i++) {
					const rec = rs.rows[i];
					const id = rec[SkyCafeFis.idSaha];
					mevcutFisIDSet[id] = true;
					maxID = Math.max(maxID, asInteger(id) || 0);
				}
				for (const id in id2Fis)
					maxID = Math.max(maxID, asInteger(id) || 0);*/
				
				const fisID2Masa = {};
				for (const id in id2Masa) {
					for (const id in id2Masa) {
						const inst = id2Masa[id];
						const {aktifFisID} = inst;
						if (aktifFisID)
							fisID2Masa[aktifFisID] = inst;
					}
				}

				if (!$.isEmptyObject(id2Fis)) {
					if (!hasTx)
						tx = await dbMgr.getTx();

					const fisIDListe = Object.keys(id2Fis);
					for (const i in fisIDListe) {
						/*const eskiID = fisIDListe[i];
						let id = eskiID;*/
						/*const fis = id2Fis[id];
						if (mevcutFisIDSet[id]) {
							maxID++;
							if (fis)
								id = fis.id = maxID;
						}
						else {
							if (fis && !fis.id)
								fis.id = newGUID();
						}*/
						
						let id = fisIDListe[i];
						const fis = id2Fis[id]
						if (fis && !id)
							fis.id = newGUID();
						
						// id2Fis[id] = fis;
						await fis.kaydet({ tx: tx });
						delete id2Fis[id];

						const masa = fisID2Masa[id];
						if (masa) {
							masa.aktifFisID = id;
							// delete id2Masa[eskiID];
							id2Masa[id] = masa;
							// ** masa icin hvListe ile toplu kayıt altta ypaılıyor
						}
					}
					if (!hasTx)
						tx = await dbMgr.getTx();
				}
				/*if (!hasTx)
					tx = await dbMgr.getTx();*/
			}

			if (id2Masa) {
				if (!hasTx)
					tx = await dbMgr.getTx();
				
				let masaIcinAktifFisIDSet = {};
				for (const id in id2Masa) {
					const rec = id2Masa[id];
					const {aktifFisID} = rec;
					masaIcinAktifFisIDSet[aktifFisID] = true;
				}
				await (async () => {
					const sent = new MQSent({
						from: `${SkyCafeFis.table} fis`,
						where: [
							{ inDizi: Object.keys(masaIcinAktifFisIDSet), saha: `fis.id` }
						],
						sahalar: [`fis.id`]
					});
					const stm = new MQStm({ sent: sent });

					const masaIcinMevcutFisIDSet = {};
					const rs = await dbMgr.executeSql({ tx: tx, query: stm });
					for (let i = 0; i < rs.rows.length; i++) {
						const rec = rs.rows[i];
						const {id} = rec;
						masaIcinMevcutFisIDSet[id] = true;
					}

					const _masaIcinAktifFisIDSet = masaIcinAktifFisIDSet;
					masaIcinAktifFisIDSet = {};
					for (const id in _masaIcinAktifFisIDSet) {
						if (masaIcinMevcutFisIDSet[id])
							masaIcinAktifFisIDSet[id] = true;
					}

					for (const id in id2Masa) {
						const rec = id2Masa[id];
						const {aktifFisID} = rec;
						if (aktifFisID && !masaIcinAktifFisIDSet[aktifFisID])
							rec.aktifFisID = null;
					}
				})();
				
				const islemGormusMasaIDSet = {};
				if (pratikSatismi) {
					const sent = new MQSent({
						from: `${SkyCafeMasa.table} mas`,
						where: [
							{ degerAta: SkyCafeMasaTip.PratikSatis, saha: `mas.anaTip` },
							`kod <> ''`,
						],
						sahalar: [`mas.*`]
					});
					const stm = new MQStm({ sent: sent });
					const rs = await dbMgr.executeSql({ tx: tx, query: stm });
					for (let i = 0; i < rs.rows.length; i++) {
						const rec = rs.rows[i];
						const id = rec.id || rec.kod;
						const {aktifFisID} = rec;
						if (aktifFisID || rec.servisDisimi)
							islemGormusMasaIDSet[id] = true;
					}
				}

				hvListe = [];
				for (const id in id2Masa) {
					if (pratikSatismi && islemGormusMasaIDSet[id])
						continue;
					
					const inst = id2Masa[id];
					const hv = inst.hostVars();
					if (hv) {
						if (pratikSatismi)
							delete hv.aktifFisID;
						hvListe.push(hv);
					}
				}
				if (!$.isEmptyObject(hvListe)) {
					await dbMgr.insertOrReplaceTable({
						tx: tx, table: 'mst_ResMasa',
						mode: 'replace',
						hvListe: hvListe
					});
					if (!hasTx)
						tx = await dbMgr.getTx();
				}
			}

			if (aktifBilgiler) {
				const removeKeys = [`kasiyerIslemleri`, `zHesaplasma`];
				for (const i in removeKeys) {
					const key = removeKeys[i];
					delete aktifBilgiler[key];
				}
			}

			if (paramDegistimi)
				await param.kaydet();

			console.info(`aktif bilgiler veritabanına kaydedildi`, aktifBilgiler, this);
		}

		initKlavyePart(e) {
			e = e || {};
			let {klavyePart} = this;
			if (klavyePart) {
				klavyePart.open(e);
				return;
			}

			klavyePart = this.klavyePart = new SkyCafeKlavyePart({
				tip: 'text', canClose: true, opacity: 1,
				position: e.position,
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
			numKlavyePart = this.numKlavyePart = new SkyCafeKlavyePart({
				tip: 'numerik', canClose: true, opacity: .9,
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
			let result = true;
			if (activePart && activePart.klavye_tusTiklandi)
				result = activePart.klavye_tusTiklandi(e);
			
			if (result)
				return result;
			
			const {activeElement} = document;
			const {sender, id, event} = e;
			const {activeWnd, activeWndPart, miktarDuzenleniyorFlag} = this;
			const {commaFlag, lastActiveElement} = sender;
			const isGrid = activeElement.classList.contains(`jqx-datatable`);
			const numerikmi = sender.tip == 'numerik' || (activeElement && (activeElement.classList.contains(`jqx-numberinput`) || activeElement.parentElement.classList.contains(`jqx-numberinput`)));
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
								setTimeout(() => activeElement.focus(), 10);
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

		async wsGetParams(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', datatype: defaultOutput,
				url: `${this.wsURLBase}params`,
				data: this.buildAjaxArgs()
			});
			const result = (await lastAjaxObj) || {};
			return result;
		}

		async getWSTanimlar(e) {
			const useWebDataSource = e.useWebDataSource == null ? this.useWebDataSource_tanimlar : e.useWebDataSource;
			const url = e.url || (
				useWebDataSource
					? `${this.webDataSourceWSRoot}tanimlar.php`
					: `${this.wsURLBase}tanimlar`
			);
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', datatype: defaultOutput,
				url: url, data: this.buildAjaxArgs()
			});
			try {
				return (await lastAjaxObj) || {};
			}
			catch (ex) {
				if (useWebDataSource)
					return await this.getWSTanimlar($.extend({}, e, { useWebDataSource: false }));
				throw ex;
			}
			return result;
		}

		async getWSAktifBilgiler(e) {
			e = e || {};
			const {ekKapsam, noErrorControl} = e;
			if (!$.isEmptyObject(ekKapsam)) {
				e.useWebDataSource = false;
				e.noSyncControl = true;
			}

			const {param, syncServerPort} = this;
			const useWebDataSource = e.useWebDataSource == null ? this.useWebDataSource_aktifBilgiler : e.useWebDataSource;
			// const timestamp = now();
			const timestamp = asDate(this.param.sonSyncTS) || now();
			let url = e.url || (
				syncServerPort && !e.noSyncControl
					? (
							`${this.wsURLBase}wait/` +
							`?key=skyCafe${this.class.pratikSatismi ? 'Pratik' : 'Rest'}_aktifBilgiler` +
							`&timestamp=${Utils.asReverseDateTimeString(timestamp/*.addSeconds(-5)*/)}`
							// `&timestamp=${dateTimeToString(asDate(param.sonSyncTS))}`
					  )
					: useWebDataSource
						? `${this.webDataSourceWSRoot}aktifBilgiler.php`
						: `${this.wsURLBase}aktifBilgiler`
			);
			const timeout = syncServerPort ? false : undefined;
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST',
				datatype: defaultOutput,
				url: url,
				timeout: timeout,
				data: this.buildAjaxArgs({
					ekKapsam: ekKapsam
						? typeof ekKapsam == 'string'
							? (ekKapsam || '')
							: (ekKapsam || []).join('|')
						: ''
					})
			});
			try {
				return (await lastAjaxObj) || {};
			}
			catch (ex) {
				if (e.url || !(useWebDataSource && syncServerPort))
					throw ex;
				
				url = (
					`http://${sky.config.hostName}:${syncServerPort}/ws/wait/` +
					`?key=skyCafe${this.class.pratikSatismi ? 'Pratik' : 'Rest'}_aktifBilgiler` +
					`&timestamp=${Utils.asReverseDateTimeString(timestamp/*.addSeconds(-5)*/)}`
					// `&timestamp=${dateTimeToString(asDate(param.sonSyncTS))}`
				);
				lastAjaxObj = $.ajax({
					cache: false, type: 'POST',
					datatype: defaultOutput,
					url: url,
					timeout: timeout,
					data: this.buildAjaxArgs({
						ekKapsam: ekKapsam
							? typeof ekKapsam == 'string'
								? (ekKapsam || '')
								: (ekKapsam || []).join('|')
							: ''
						})
				});
				try {
					return (await lastAjaxObj) || {};
				}
				catch (ex2) {
					if (!noErrorControl && useWebDataSource) {
						try {
							await new $.Deferred(p => setTimeout(() => p.resolve(true), 1000));
							try {
								return await this.getWSAktifBilgiler($.extend({}, e, { noErrorControl: true }));
							}
							catch (ex4) {
								try {
									await new $.Deferred(p => setTimeout(() => p.resolve(true), 1000));
									return await this.getWSAktifBilgiler($.extend({}, e, { noErrorControl: true }));
								}
								catch (ex5) {
									return await this.getWSAktifBilgiler($.extend({}, e, { useWebDataSource: false }));
								}
							}
						}
						catch (ex3) {
							return await this.getWSAktifBilgiler($.extend({}, e, { useWebDataSource: false }));
						}
					}
					throw ex;
				}
			}
		}
		
		async postWSVeriler(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				contentType: `application/json`,
				url: `${this.wsURLBase}verileriKaydet?${$.param(this.buildAjaxArgs())}`,
				processData: false,
				data: toJSONStr(e)
			});
			const result = (await lastAjaxObj) || {};
			return result;
		}

		get aktifMasaAnaTip() {
			const {aktifMasaID} = this;
			return this.getMasaIcinAnaTip({ id: aktifMasaID });
		}

		getMasaIcinAnaTip(e) {
			e = e || {};
			if (this.class.pratikSatismi)
				return SkyCafeMasaTip.PratikSatis;
			
			const {id2MasaAnaTip} = this;
			if (!id2MasaAnaTip)
				return null;
			
			let id = e.masaID || e.id;
			if (!id) {
				const {masa} = e;
				if (masa)
					id = masa.id;
			}
			
			return id ? id2MasaAnaTip[id] || SkyCafeMasaTip.Adisyon : null;
		}

		async getMasaAciklamaVeBilgi(e) {
			e = e || {};
			const {tx, fis, masa} = e;
			if (fis && fis.aciklama)
				return { ozelAciklamami: true, fisAciklamami: true, aciklama: fis.aciklama };
			
			if (masa) {
				if (masa.fisAciklama)
					return { ozelAciklamami: true, fisAciklamami: true, aciklama: masa.fisAciklama };
				if (masa.rezervemi && masa.rezerveAciklama)
					return { ozelAciklamami: true, rezerveAciklamami: true, aciklama: masa.rezerveAciklama };
				return { aciklama: masa.aciklama || null };
			}

			const masaID = e.masaID || e.id;
			let aciklama = null;
			if (masaID) {
				const sent = new MQSent({
					from: `${SkyCafeMasa.table} mas`,
					fromIliskiler: [
						{ alias: `mas`, leftJoin: `${SkyCafeFis.table} fis`, on: `mas.aktifFisID = fis.${SkyCafeFis.idSaha}` }
					],
					where: {
						degerAta: masaID, saha: `mas.${SkyCafeMasa.idSaha}`
					},
					sahalar: [
						`fis.aciklama fisAciklama`, `mas.aciklama`,
						`(case when mas.rezervemi = 0 then '' else mas.rezerveAciklama end) rezerveAciklama`, 
					]
				});
				const stm = new MQStm({ sent: sent });
				const rec = await this.dbMgr_mf.tekilExecuteSelect({ tx: tx, query: stm });
				
				if (rec.fisAciklama)
					return { ozelAciklamami: true, fisAciklamami: true, aciklama: rec.fisAciklama };
				if (rec.rezerveAciklama)
					return { ozelAciklamami: true, rezerveAciklamami: true, aciklama: rec.rezerveAciklama };
				
				return { aciklama: rec.aciklama || null }
			}

			return aciklama;
		}

		async getMasaAciklama(e) {
			const result = await this.getMasaAciklamaVeBilgi(e);
			if (!result)
				return result;
			
			return result.aciklama;
		}

		async getMasaAktifFisID(e) {
			e = e || {};
			const {tx, masa} = e;
			if (masa)
				return masa.aktifFisID;
			
			const masaID = e.masaID || e.id;
			let aktifFisID = null;
			if (masaID) {
				const sent = new MQSent({
					from: `mst_ResMasa mas`,
					where: [{ degerAta: masaID, saha: `mas.kod` }],
					sahalar: [`mas.aktifFisID`]
				});
				const stm = new MQStm({ sent: sent });
				aktifFisID = await this.dbMgr_mf.tekilDegerExecuteSelect({ tx: tx, query: stm }) || null;
			}

			return aktifFisID;
		}

		async setMasaAktifFisID(e) {
			e = e || {};
			const {masa, fis} = e;
			const dbMgr = this.dbMgr_mf;
			let {tx} = e;
			const hasTx = !!tx;
			let masaID = e.masaID || e.id;
			let fisID = e.fisID || e.value || (fis || {}).id || null;
			const {value} = e;
			
			// const aktifFisID = await this.getMasaAktifFisID({ tx: tx, masaID: masaID, masa: masa });
			const fisAktifMasaID = value ? masaID : null;
			if (masa) {
				masa.aktifFisID = value || null;
				masaID = masa.id;
			}
			if (fis)
				fis.aktifMasaID = fisAktifMasaID || null;
			
			const promises = [];
			let lastPromise = null;
			let result = false;
			if (fisID) {
				const upd = new MQIliskiliUpdate({ from: SkyCafeFis.table });
				upd.where.degerAta(fisID || null, SkyCafeFis.idSaha);
				if (fisAktifMasaID)
					upd.set.degerAta(fisAktifMasaID, `aktifMasaID`)
				else
					upd.set.add(`aktifMasaID = NULL`)
				promises.push(dbMgr.executeSql({ tx: tx, query: upd }));
			}
			if (masaID) {
				const upd = new MQIliskiliUpdate({
					from: SkyCafeMasa.table,
					where: [
						{ degerAta: masaID, saha: SkyCafeMasa.idSaha }
						// { notDegerAta: fisID, saha: `aktifFisID` }
					],
					set: [
						(value
							? { degerAta: value, saha: `aktifFisID` }
							: `aktifFisID = NULL`)
					]
				});
				lastPromise = dbMgr.executeSql({ tx: tx, query: upd });

				/*if (!(noLog || pratikSatismi)) {
					const log = new SkyCafeLog({
						refTable: SkyCafeMasa.table,
						refID: masaID,
						islem: 'setMasaAktifFisID',
						data: { masaID: masaID || null, aktifFisID: fisID || null }
					});
					await log.kaydet({ tx: tx });
				}*/
			}

			await Promise.all(promises);
			result = await lastPromise;
			if (!hasTx)
				tx = await dbMgr.getTx();

			return result;
		}

		async getMasa(e) {
			e = e || {};
			let {tx, masa} = e;
			if (masa)
				return masa;
			
			const id = e.masaID || e.id;
			if (id) {
				const sent = new MQSent({
					from: `mst_ResMasa mas`,
					where: [{ degerAta: id, saha: `mas.kod` }],
					sahalar: [`mas.*`]
				});
				const stm = new MQStm({ sent: sent });
				const rec = await this.dbMgr_mf.tekilExecuteSelect({ tx: tx, query: stm });
				if (rec) {
					masa = new SkyCafeMasa({ id: id });
					await masa.setValues({ rec: rec });
				}
			}

			return masa;
		}

		async getFis(e) {
			e = e || {};
			let {tx, fis} = e;
			if (fis)
				return fis;
			
			const id = e.fisID || e.id;
			if (id) {
				const sent = new MQSent({
					from: `${SkyCafeFis.table} fis`,
					where: [{ degerAta: id, saha: `fis.${SkyCafeFis.idSaha}` }],
					sahalar: [`fis.*`]
				});
				const stm = new MQStm({ sent: sent });
				const rec = await this.dbMgr_mf.tekilExecuteSelect({ tx: tx, query: stm })
				if (rec) {
					fis = new SkyCafeFis({ id: id });
					await fis.setValues({ rec: rec });
					// ** gerekirse çağıran yer fis.detaylariYukle() yapar
				}
			}

			return fis;
		}

		async getAktifMasa(e) {
			e = e || {};
			const {tx} = e;
			const target = e.target || this;
			let masa = e.masa || target.aktifMasa;
			if (!masa) {
				const id = e.id || e.masaID || this.aktifMasaID;
				if (id) {
					masa = new SkyCafeMasa({ id: id });
					await masa.yukle({ tx: tx });
				}
			}
			return masa;
		}

		async setAktifMasa(e) {
			e = e || {};
			const target = e.target || this;
			const masa = await this.getAktifMasa(e);
			if (masa) {
				const aktifMasaID = masa.id;
				target.aktifMasaID = aktifMasaID;
				target.aktifMasa = masa;

				const fis = target.aktifFis;
				if (fis)
					fis.aktifMasaID = aktifMasaID;
			}

			/*if (!(noLog || pratikSatismi)) {
				const log = new SkyCafeLog({
					refTable: SkyCafeMasa.table,
					refID: (masa || {}).id,
					islem: 'setAktifMasa'
				});
				await log.kaydet({ tx: tx });
			}*/
			
			return masa;
		}

		aktifMasaKaldir(e) {
			e = e || {};
			const target = e.target || this;
			const masa = target.aktifMasa;
			delete target.aktifMasa;
			delete target.aktifMasaID;

			/*if (!(noLog || pratikSatismi)) {
				const log = new SkyCafeLog({
					refTable: SkyCafeMasa.table,
					refID: (masa || {}).id || null,
					islem: 'aktifMasaKaldir'
				});
				await log.kaydet({ tx: tx });
			}*/
			
			return masa;
		}

		async gerekirseFisOlustur(e) {
			e = e || {};
			const {tx} = e;
			const {pratikSatismi} = this.class;
			let fis = this.aktifFis;
			if (!fis) {
				const aktifMasaID = e.aktifMasaID || e.masaID || this.aktifMasaID || null;
				fis = this.aktifFis = await this.aktifFisOlustur({ tx: tx, masaID: aktifMasaID });
				const aktifFisID = fis.id || null;
				await this.setMasaAktifFisID({ tx: tx, id: aktifMasaID, fis: fis, value: aktifFisID, noLog: e.noLog || pratikSatismi });
			}

			return fis;
		}

		async aktifFisOlustur(e) {
			e = e || {};
			const {pratikSatismi} = this.class;
			const {noLog} = e;
			const target = e.target || this;
			const masaID = e.masaID || (e.masa || {}).id || target.aktifMasaID;
			
			const fis = target.aktifFis = new SkyCafeFis();
			fis.aktifMasaID = masaID;
			// this.id2Fis[fis.id] = fis;
			await fis.kaydet();

			try { await this.promise_verileriGonder }
			catch (ex) { }
			
			if (!(noLog || pratikSatismi)) {
				const log = new SkyCafeLog({
					refTable: SkyCafeFis.table,
					refID: fis.id,
					islem: 'aktifFisOlustur',
					data: { aktifMasaID: masaID || null, fis: fis ? fis.reduce() : null }
				});
				await log.kaydet();
			}
			
			return fis;
		}

		async setAktifFis(e) {
			e = e || {};
			const {pratikSatismi} = this.class;
			const {noLog} = e;
			const target = e.target || this;
			const masaID = e.masaID || (e.masa || {}).id || target.aktifMasaID;
			const fis = await this.getFis(e);
			if (fis) {
				target.aktifFis = fis;
				target.aktifMasaID = masaID;
			}

			/*if (!(noLog || pratikSatismi)) {
				const log = new SkyCafeLog({
					refTable: SkyCafeFis.table,
					refID: (fis || {}).id || null,
					islem: 'setAktifFis',
					data: { aktifMasaID: masaID || null, fis: fis ? fis.reduce() : null }
				});
				await log.kaydet();
			}*/
			
			return fis;
		}

		aktifFisKaldir(e) {
			e = e || {};
			const target = e.target || this;
			const fis = target.aktifFis;
			delete target.aktifFis;

			/*if (!(noLog || pratikSatismi)) {
				const log = new SkyCafeLog({
					refTable: SkyCafeFis.table,
					refID: (fis || {}).id || null,
					islem: 'aktifFisKaldir'
				});
				await log.kaydet();
			*/

			return fis;
		}

		async tanimlariYukleIstendi(e) {
			const {miktarKlavyePart} = this.activePart || {};
			const wnd = (miktarKlavyePart || {}).wnd;
			const widget = wnd ? wnd.jqxWindow('getInstance') : null;
			if (widget)
				widget.collapse();
			try {
				await showProgress(`İlk Tanımlar merkezden yükleniyor...`, null, 100);
				await this.wsTanimlariYukle(e);
				await this.wsTanimlarYuklendi(e);
				setTimeout(async () => {
					await this.knobProgressHideWithReset({ delayMS: 1000, update: { label: `Tanımlar merkezden yüklendi!` } });
					((window.savedProcs || {}).hideProgress || hideProgress)();
				}, 100);
			}
			catch (ex) {
				setTimeout(async () => {
					await this.knobProgressHideWithReset();
					((window.savedProcs || {}).hideProgress || hideProgress)();
				}, 500);
				defFailBlock(ex);
			}
			finally {
				if (widget)
					setTimeout(() => widget.expand(), 2500);
			}
		}

		getNavMenuSource(e) {
			return []
		}

		async syncCompleted(e) {
			const {param} = this;
			const {ilkSyncYapildimi} = param;
			await this.syncCompletedDevam(e);
			this.setUniqueTimeout({
				key: 'syncCompletedSonrasi',
				delayMS: 10,
				// args: e,
				block: async () =>
					await this.syncCompletedSonrasi(e)
			});
		}

		async syncCompletedDevam(e) {
			this.paramYukleSonrasi(e);
		}

		async syncCompletedSonrasi(e) {
			const {param} = this;
			param.ilkSyncYapildimi = true;
			await param.kaydet();
			this.zBilgiGoster(e);
			
			const {activePart} = this;
			if (activePart) {
				if (activePart.syncCompleted)
					await activePart.syncCompleted(e);
			}
		}

		async barkodBilgiBelirle(e) {
			e = e || {};
			let barkod = (e.barkod || '').trim();
			if (!barkod)
				return null;
			
			const tip = e.tip || e.anaTip;
			let parser;
			if (barkod.length > 2) {
				let kural = await SkyCafeBarkodParser_Kuralli.kuralFor({ barkod: barkod, basKod: barkod.substring(0, 2) });
				if (kural)
					parser = await kural.parseSonucu(e);
			}
			
			if (!parser) {
				parser = new SkyCafeBarkodParser_Referans({ barkod: barkod });
				if (!await parser.parse(e))
					parser = null;
			}

			if (!parser)
				return false
			
			$.extend(parser, {
				barkod: parser.barkod || parser.okunanBarkod || barkod,
				miktar: parser.miktar || 1
			});
			// delete parser.okunanBarkod;

			const fisSinif = this.aktifFis ? this.aktifFis.class : SkyCafeFis;
			const det = fisSinif.newDetay($.extend(
				{ tip: tip, isParseResult: true, barkodParser: parser },
				parser
			));
			await det.detayEkIslemler({ tx: e.tx })
			
			return det;
		}

		/*async barkodSonucuBul(e) {
			const {barkod} = e;
			if (!barkod)
				return null;
			
			const promises = [
				this.barkodSonucuBul_urun(e)
			];

			let result;
			for (const i in promises) {
				const _result = await promises[i];
				if (_result !== undefined) {
					result = _result;
					break;
				}
			}

			if (!result)
				throw { isError: true, rc: `barkodYok`, errorText: `<span class="bold">${barkod}</span> barkodu hatalıdır` };
			
			return result;
		}

		async barkodSonucuBul_urun(e) {
			const {id2Urun} = this;
			const {tip, barkod} = e;

			let urun = id2Urun[barkod];
			if (!urun) {
				const fiyatAttr = tip ? SkyCafeUrun.tip2FiyatAttr[tip] : null;
				const dbMgr = this.dbMgr_mf;
				const sent = new MQSent({
					from: `mst_Stok mst`,
					fromIliskiler: [
						{ alias: `mst`, leftJoin: `mst_BarkodReferans bref`, on: `mst.kod = bref.stokKod` }
					],
					where: [
						new MQOrClause([
							{ degerAta: barkod, saha: `mst.kod` },
							{ degerAta: barkod, saha: `bref.refKod` }
						])
					],
					sahalar: [
						`mst.rowid`, `mst.*`
					]
				});
				if (fiyatAttr)
					sent.where.add(`mst.${fiyatAttr} > 0`);
				const stm = new MQStm({
					sent: sent,
					orderBy: [`mst.kod`, `bref.varsayilanmi DESC`]
				});
				const rec = await dbMgr.tekilExecuteSelect({ query: stm });
				if (!rec)
					return null;

				urun = this.id2Urun[rec.id] = new SkyCafeUrun();
				await urun.setValues({ rec: rec });
			}

			return { urun: urun, miktar: null };
		}*/

		zBilgiGoster(e) {
			this.setUniqueTimeout({
				key: 'zBilgiGoster',
				delayMS: 500,
				// args: e,
				block: () =>
					this.zBilgiGosterDevam(e)
			})
		}

		zBilgiGosterDevam(e) {
			const {zBilgi, divZTextParent, divZText} = this;
			if (divZText && divZText.length) {
				if (zBilgi) {
					const {zNo} = zBilgi;
					if (zNo)
						divZText.html(zNo);
					if (zBilgi.kapandimi)
						divZTextParent.addClass(`kapandi`);
					else
						divZTextParent.removeClass(`kapandi`);
				}
				else {
					divZTextParent.removeClass(`kapandi`);
				}
				divZTextParent.removeClass(`jqx-hidden`);
			}
		}

		async zAcKapatIstendi(e) {
			e = e || {};
			const {zBilgi, zAcikmi} = this;
			const flag = e.flag == null ? !zAcikmi : e.flag;
			if (!flag && !zBilgi) {
				displayMessage(`Kapatılacak Z yok`, `@ Z Kapat @`);
				return false;
			}

			return new $.Deferred(p => {
				displayMessage(
					`<p>Z <b class="${flag ? 'green' : 'red'}">${flag ? 'AÇILACAK' : 'KAPATILACAK'}</b></p> <p>Devam edilsin mi?</p>`,
					`Z ${flag ? 'Aç' : 'Kapat'}`,
					true,
					{
						EVET: async (dlgUI, btnUI) => {
							const result = await this.zAcKapatIstendiDevam($.extend({}, e, { flag: flag }));
							dlgUI.jqxWindow('close');
							p.resolve({ result: result });
						},
						HAYIR: (dlgUI, btnUI) => {
							dlgUI.jqxWindow('close');
							p.reject({ isError: false, rc: 'userAbort' });
						}
					}
				)
			})
		}

		async zAcKapatIstendiDevam(e) {
			const {zAcikmi} = this;
			const {flag} = e;
			if (flag == zAcikmi)
				return false;
			
			const {pratikSatismi} = this.class;
			const {noLog} = e;
			const {param, navPart} = this;
			const dbMgr = this.dbMgr_mf;
			const hasTx = !!e.tx;
			let {tx} = e;
			
			const zBilgi = param.zBilgi = e.zBilgi = this.zBilgi || { kapandimi: false, zSayac: null, zNo: 0, basTS: now() };
			zBilgi.kapandimi = !flag;
			if (flag) {
				zBilgi.zSayac = null;
				zBilgi.zNo++;
			}

			if (!e.noLog) {
				const log = new SkyCafeLog({
					refTable: SkyCafeParam.table,
					refID: zBilgi.zNo.toString(),
					islem: flag ? 'zAc' : 'zKapat'
				});
				await log.kaydet({ tx: tx });
			}
			if (!hasTx)
				tx = await dbMgr.getTx();
			
			const _e = { noSyncControl: true };
			this.wsAktifBilgileriYukle(_e).then(() =>
				this.wsAktifBilgilerYuklendi(_e));
		
			await param.kaydet();
			
			setTimeout(() => this.zBilgiGoster(e), 1000);
			if (navPart)
				navPart.tazele();
			
			return true;
		}

		async rezervasyonIstendi(e) {
			e = e || {};
			if (!this.zAcikmi) {
				displayMessage(`Z Kapalıdır, işlem yapılamaz`, `@ Z Kapalı @`);
				return false;
			}
			
			const masa = await this.getAktifMasa();
			if (!masa)
				return false;
			
			const {aktifFis} = this;
			if (!masa.rezervemi && aktifFis) {
				displayMessage(
					`Adisyon açık iken Rezervasyon yapılamaz`,
					`@ Rezervasyon @`
				);
				return false;
			}

			return new $.Deferred(p => {
				if (masa.rezervemi) {
					displayMessage(
						`${masa.parantezliOzet({ styled: true })} için Rezervasyon <b>kaldırılsın mı</b>?`,
						`Rezervasyon`,
						true,
						{
							EVET: (dlgUI, btnUI) => {
								const result = this.rezervasyonIstendiDevam($.extend({}, e, { flag: false, aktifMasa: masa }));
								dlgUI.jqxWindow('close');
								p.resolve({ result: result });
							},
							HAYIR: (dlgUI, btnUI) => {
								dlgUI.jqxWindow('close');
								p.reject({ isError: false, rc: 'userAbort' })
							}
						}
					)
					return;
				}

				new SkyCafeRezervasyonEkraniPart().open({
					// placeHolder: `Rezervasyon Yapan`,
					content: false,
					kisiSayisi: 2,
					zaman: '17:00',
					tamamIslemi: async e => {
						const {sender, value, kisiSayisi, zaman} = e;
						if (!value) {
							displayMessage(`<b>Rezervasyon Yapan</b> belirtilmelidir!`, `Rezervasyon`);
							return false;
						}
						if (asInteger(kisiSayisi) <= 0) {
							displayMessage(`<b>Kişi Sayısı</b> belirtilmelidir!`, `Rezervasyon`);
							return false;
						}

						const result = await this.rezervasyonIstendiDevam($.extend({}, e, {
							sender: sender, aktifMasa: masa, aktifMasaID: masa.id, flag: true, 
							aciklama: value, kisiSayisi: kisiSayisi, zaman: zaman
						}));
						p.resolve({
							sender: sender, value: value,
							kisiSayisi: kisiSayisi, zaman: zaman,
							result: result
						});
						return result;
					}
				});
			})
		}

		async rezervasyonIstendiDevam(e) {
			if (!this.zAcikmi) {
				displayMessage(`Z Kapalıdır, işlem yapılamaz`, `@ Z Kapalı @`);
				return false;
			}

			const {aktifFis} = this;
			const {flag} = e;
			if (flag && aktifFis) {
				displayMessage(
					`Adisyon açık iken Rezervasyon yapılamaz`,
					`@ Rezervasyon @`
				);
				return false;
			}

			const {pratikSatismi} = this.class;
			const dbMgr = this.dbMgr_mf;
			const hasTx = !!e.tx;
			let {tx} = e;
			const {aktifMasa, aciklama, kisiSayisi, zaman, noLog} = e;
			const aktifMasaID = e.aktifMasaID || (aktifMasa || {}).id;
			const mqSinif = SkyCafeMasa;
			const upd = new MQIliskiliUpdate({
				from: mqSinif.table,
				where: {
					degerAta: aktifMasaID, saha: mqSinif.idSaha
				},
				set: [
					{ degerAta: flag, saha: `rezervemi` },
					{ degerAta: flag ? aciklama : '', saha: `rezerveAciklama` },
					{ degerAta: flag ? kisiSayisi : 0, saha: `rezerveSayi` },
					{ degerAta: flag ? zaman : '', saha: `rezerveTahminiGelis` }
				]
			});
			await dbMgr.executeSql({ tx: tx, query: upd });
			
			if (!(noLog || pratikSatismi)) {
				const log = new SkyCafeLog({
					refTable: SkyCafeMasa.table,
					refID: aktifMasaID || null,
					islem: flag ? 'rezervasyonYap' : 'rezervasyonKaldir',
					data: flag ? { aciklama: aciklama || '', kisiSayisi: kisiSayisi || 0, zaman: zaman || null } : null
				});
				await log.kaydet({ tx: tx });
			}
			if (!hasTx)
				tx = await dbMgr.getTx();
			
			if (aktifMasa) {
				$.extend(aktifMasa, {
					rezervemi: flag,
					rezerveAciklama: (flag ? aciklama : '') || '',
					rezerveSayi: (flag ? kisiSayisi : 0),
					rezerveTahminiGelis: (flag ? zaman : null)
				});
			}

			return true;
		}

		fisAciklamaIstendi(e) {
			e = e || {};
			if (!this.zAcikmi) {
				displayMessage(`Z Kapalıdır, işlem yapılamaz`, `@ Z Kapalı @`);
				return false;
			}

			const {aktifFis, aktifMasaID} = this;
			const {pratikSatismi} = this.class;
			return new $.Deferred(p => {
				new SkyCafeTextInputPart().open({
					title: `${pratikSatismi ? `Fiş` : `Masa`} Açıklaması`,
					// baslikText: `${pratikSatismi ? `Fiş` : `Masa`} Açıklamasını belirtiniz veya boş bırakınız.`,
					value: (aktifFis || {}).aciklama || '',
					geriCallback: e => {
						const {activePart} = this;
						if (activePart) {
							if (activePart.barkodUIInput)
								activePart.barkodUIInput.val('');
							if (activePart.setFocusToDefault)
								activePart.setFocusToDefault(e);
						}
						// p.reject({ isError: false, rc: 'userAbort' })
					},
					tamamIslemi: async e => {
						const {sender, value} = e;
						const result = await this.fisAciklamaIstendiDevam($.extend({}, e, {
							sender: sender,
							aktifMasaID: aktifMasaID,
							aktifFisID: (aktifFis || {}).id || null,
							fisAciklama: value,
							aktifFis: aktifFis
						}));
						if (!result)
							return result;
						p.resolve({ sender: sender, value: value, result: result });
						return result;
					}
				})
			})
		}

		async fisAciklamaIstendiDevam(e) {
			if (!this.zAcikmi) {
				displayMessage(`Z Kapalıdır, işlem yapılamaz`, `@ Z Kapalı @`);
				return false;
			}

			const {pratikSatismi} = this.class;
			const {noLog} = e;
			const dbMgr = this.dbMgr_mf;
			const hasTx = !!e.tx;
			let {tx} = e;
			// let tx = e.tx || await dbMgr.getTx();
			let aktifFis = e.fis || e.aktifFis;
			if (!aktifFis)
				aktifFis = await this.gerekirseFisOlustur({ tx: tx });
			const aktifFisID = e.aktifFisID || (aktifFis || {}).id;
			const {aktifMasaID, fisAciklama} = e;
			const mqSinif = SkyCafeFis;
			const upd = new MQIliskiliUpdate({
				from: mqSinif.table,
				where: {
					degerAta: aktifFisID, saha: mqSinif.idSaha
				},
				set: [
					{ degerAta: fisAciklama, saha: `aciklama` }
				]
			});
			await dbMgr.executeSql({ tx: tx, query: upd });
			
			if (aktifFis)
				aktifFis.aciklama = fisAciklama;
			
			if (!(noLog || pratikSatismi)) {
				const log = new SkyCafeLog({
					refTable: SkyCafeFis.table,
					refID: aktifFisID || null,
					refID2: aktifMasaID || null,
					islem: 'fisAciklamaDegistir',
					data: { aciklama: fisAciklama || '' }
				});
				await log.kaydet({ tx: tx });
			}
			if (!hasTx)
				tx = await dbMgr.getTx();

			const _promise = new $.Deferred(async p2 => {
				try { p2.resolve(await this.wsWaitAll()) }
				catch (ex) { p2.resolve(ex) }
			});
			setTimeout(() => _promise.resolve({ isError: true, rc: 'userAbort' }), 200);
			try { await _promise }
			catch (ex) { }
			
			const _e = {};
			this.wsBekleyenVerileriGonder(_e);

			return true;
		}

		async servisDisiIstendi(e) {
			e = e || {};
			if (!this.zAcikmi) {
				displayMessage(`Z Kapalıdır, işlem yapılamaz`, `@ Z Kapalı @`);
				return false;
			}

			const masa = await this.getAktifMasa({ masaID: e.masaID, masa: e.masa });
			if (!masa)
				return;
			
			const {pratikSatismi} = this.class;
			const {aktifFis} = this;
			if (!masa.servisDisimi && aktifFis) {
				displayMessage(
					`${pratikSatismi ? 'Fiş' : 'Adisyon'} açık iken Servis Dışı yapılamaz`,
					`@ Servis Dışı İşlemi @`
				);
				return false;
			}
			
			//if (aktifMasa.servisDisimi)
			//	return this.servisDisiIstendiDevam({ aktifMasa: aktifMasa, flag: false });

			return new $.Deferred(p => {
				displayMessage(
					`${masa.parantezliOzet({ styled: true })} için <b>SERVİS DIŞI</b> <u>${masa.servisDisimi ? 'KALDIRILSIN' : 'YAPILSIN'}</u> mı?`,
					`Servis Dışı İşlemi`,
					true,
					{
						EVET: async (dlgUI, btnUI) => {
							const result = await this.servisDisiIstendiDevam($.extend({}, e, { flag: !masa.servisDisimi, aktifMasa: masa }));
							dlgUI.jqxWindow('close');
							p.resolve({ result: result });
						},
						HAYIR: (dlgUI, btnUI) => {
							dlgUI.jqxWindow('close');
							p.reject({ isError: false, rc: 'userAbort' })
						}
					}
				)
			})
		}

		async servisDisiIstendiDevam(e) {
			e = e || {};
			if (!this.zAcikmi) {
				displayMessage(`Z Kapalıdır, işlem yapılamaz`, `@ Z Kapalı @`);
				return false;
			}

			const {pratikSatismi} = this.class;
			const {noLog} = e;
			const dbMgr = this.dbMgr_mf;
			const hasTx = !!e.tx;
			let {tx} = e;
			const aktifMasa = e.masa || e.aktifMasa;
			const {flag} = e;
			const aktifMasaID = e.aktifMasaID || (aktifMasa || {}).id;
			const mqSinif = SkyCafeMasa;
			const upd = new MQIliskiliUpdate({
				from: mqSinif.table,
				where: {
					degerAta: aktifMasaID, saha: mqSinif.idSaha
				},
				set: [
					{ degerAta: flag, saha: `servisDisimi` }
				]
			});
			await dbMgr.executeSql({ tx: tx, query: upd });
			if (!hasTx)
				tx = await dbMgr.getTx();
			
			if (aktifMasa)
				aktifMasa.servisDisimi = flag;
			
			if (!(e.noLog || pratikSatismi)) {
				const log = new SkyCafeLog({
					refTable: SkyCafeMasa.table,
					refID: aktifMasaID || null,
					islem: flag ? 'masaServisDisiYap' : 'masaServisDisiKaldir'
				});
				await log.kaydet({ tx: tx });
			}
			if (!hasTx)
				tx = await dbMgr.getTx();
			
			const _promise = new $.Deferred(async p2 => {
				try { p2.resolve(await this.wsWaitAll()) }
				catch (ex) { p2.resolve(ex) }
			});
			setTimeout(() => _promise.resolve({ isError: true, rc: 'userAbort' }), 200);
			try { await _promise }
			catch (ex) { }
			
			const _e = {};
			this.wsBekleyenVerileriGonder(_e);
			
			return true;
		}

		masaTransferIstendi(e) {
			e = e || {};
			if (!this.zAcikmi) {
				displayMessage(`Z Kapalıdır, işlem yapılamaz`, `@ Z Kapalı @`);
				return false;
			}

			const {aktifMasaID} = this;
			if (!aktifMasaID)
				return false;
			
			return new $.Deferred(p => {
				new SkyCafeMasaTransferPart().open({
					content: false,
					aktifMasaID: aktifMasaID,
					geriCallback: e => {
						const {activePart} = this;
						if (activePart) {
							if (activePart.barkodUIInput)
								activePart.barkodUIInput.val('');
							if (activePart.setFocusToDefault)
								activePart.setFocusToDefault(e);
						}
						// p.reject({ isError: false, rc: 'userAbort' })
					},
					tamamIslemi: async e => {
						const result = await this.masaTransferIstendiDevam($.extend({}, e, {
							sender: e.sender,
							aktifMasaID: e.aktifMasaID,
							hedefMasaID: e.hedefMasaID
						}));
						if (!result)
							return result;
						p.resolve({ sender: e.sender, result: result });
					}
				})
			})
		}

		async masaTransferIstendiDevam(e) {
			this.timersDisabledFlag = true;
			try {
				const _promise = new $.Deferred(async p2 => {
					try { p2.resolve(await this.wsWaitAll()) }
					catch (ex) { p2.resolve(ex) }
				});
				setTimeout(() => _promise.resolve({ isError: true, rc: 'userAbort' }), 1000);
				try { await _promise }
				catch (ex) { }
				
				return await this.masaTransferIstendiDevam2(e)
			}
			finally {
				await this.setUniqueTimeout({
					key: 'enableTimers',
					delayMS: 1000,
					block: () =>
						this.timersDisabledFlag = false
				});
			}
		}
		
		async masaTransferIstendiDevam2(e) {
			if (!this.zAcikmi) {
				displayMessage(`Z Kapalıdır, işlem yapılamaz`, `@ Z Kapalı @`);
				return false;
			}

			const {pratikSatismi} = this.class;
			const {aktifMasaID, hedefMasaID, recs, noLog} = e;
			const dbMgr = this.dbMgr_mf;
			let {tx} = e;
			const hasTx = !!tx;
			if (!hedefMasaID) {
				displayMessage(`<b>Hedef Masa</b> seçilmelidir`, `@ Masa Transfer @`);
				return false;
			}
			if ($.isEmptyObject(recs)) {
				displayMessage(`<b>Transfer Edilecek Ürünler</b> seçilmelidir`, `@ Masa Transfer @`);
				return false;
			}

			const {aktifFis} = this;
			if (!aktifFis)
				return false;

			if (aktifFis.yazdirildimi && this.garsonmu) {
				displayMessage(`<b>${aktifMasaID}</b> masasına ait Adisyon yazdırıldığı için bu masaya transfer yapılamaz`, `@ Masa Transfer @`);
				return false;
			}
			
			const aktifFisID = aktifFis.id;
			const id2Detay = {};
			for (const i in aktifFis.detaylar) {
				const det = aktifFis.detaylar[i];
				if (!det.silindimi)
					id2Detay[det.id] = det;
			}
			
			let hedefFisID = await this.getMasaAktifFisID({ tx: tx, id: hedefMasaID });
			let hedefFis = hedefFisID ? await this.getFis({ tx: tx, id: hedefFisID }) : null;
			if (hedefFis) {
				if (hedefFis.yazdirildimi) {
					displayMessage(`<b>${hedefMasaID}</b> masasına ait Adisyon yazdırıldığı için bu masaya transfer yapılamaz`, `@ Masa Transfer @`);
					return false;
				}
				await hedefFis.getDetaylar();
			}
			else {
				hedefFis = aktifFis.shallowCopy();
				$.extend(hedefFis, {
					id: newGUID(), kapandimi: false,
					detaylar: []
				});
				hedefFisID = hedefFis.id;
			}
			
			if (!hedefFis.aciklama)
				hedefFis.aciklama = `Masa Trf. (${aktifMasaID}-${hedefMasaID})`;
			
			let degistimi = false;
			const promises = [];
			for (const i in recs) {
				const rec = recs[i];
				const {id} = rec;
				rec.orjID = id;
				rec.id = newGUID();
				
				const alinacakMiktar = Math.max(rec.alinacakMiktar || 0, 0);
				const det = rec && !rec.silindimi ? id2Detay[id] : null;
				if (det && !det.silindimi && alinacakMiktar && alinacakMiktar > 0) {
					det.miktar = Math.max(det.miktar - (alinacakMiktar || 0), 0);
					if (det.miktar && det.miktar > 0) {
						delete det.alinacakMiktar;
						det.brutBedel = det.netBedel = null;
						promises.push(det.detayEkIslemler({ tx: tx }));
					}
					else {
						delete id2Detay[id];
					}

					rec.miktar = alinacakMiktar;
					delete rec.alinacakMiktar;
					rec.brutBedel = rec.netBedel = null;
					promises.push(rec.detayEkIslemler({ tx: tx }));
					hedefFis.detaylar.push(rec);
					degistimi = true;
				}
			}
			await Promise.all(promises);

			const logKaydet = async e => {
				e = e || {};
				if (noLog || e.noLog)
					return null;
				
				const log = new SkyCafeLog({
					refTable: SkyCafeFis.table,
					refID: aktifFisID || null,
					refID2: hedefFisID || null,
					islem: 'masaTransfer',
					data: {
						kismimi: asBool(e.kismimi),
						aktifMasaID: aktifMasaID || null,
						aktifFisID: aktifFisID || null,
						hedefMasaID: hedefMasaID || null,
						hedefFisID: hedefFisID || null,
						aktifFis: aktifFis ? aktifFis.reduce() : null,
						hedefFis: hedefFis ? hedefFis.reduce() : null,
						detayRecs:
							recs.filter(rec => rec && rec.miktar && rec.miktar > 0)
									.map(rec => rec.reduce ? rec.reduce() : rec)
					}
				});

				const result = await log.kaydet({ tx: tx });
				if (result) {
					if (hedefFis.aciklama)
						await this.fisAciklamaIstendiDevam({
							fis: hedefFis,
							aktifMasaID: hedefMasaID,
							fisAciklama: hedefFis.aciklama
						});
				}
				
				/*const _e = {};
				this.wsBekleyenVerileriGonder(_e);*/
				
				return result;
			}

			if (degistimi) {
				const aktifDetaylar = aktifFis.detaylar = aktifFis.detaylar.filter(det => !det.silindimi && !!det.miktar);
				const aktifFisBosmu = $.isEmptyObject(aktifDetaylar);
				if ($.isEmptyObject(hedefFis.detaylar.filter(det => !det.silindimi && !!det.miktar))) {
					hedefFis = null;
				}
				else {
					await hedefFis.kaydet({ tx: tx });
					await this.setMasaAktifFisID({ id: hedefMasaID, fis: hedefFis, value: hedefFisID });
				}
				
				aktifFis.kapandimi = aktifFisBosmu;
				if (aktifFisBosmu)
					aktifFis.devreDisimi = true;
				await aktifFis.kaydet({ tx: tx });
				if (aktifFisBosmu) {
					// await aktifFis.sil({ tx: tx });
					/*if (!e.noLog) {
						const log = new SkyCafeLog({
							refTable: SkyCafeFis.table,
							refID: aktifFisID || null,
							islem: 'fisIptal',
							data: {
								from: 'masaTransfer_aktifFisBos',
								aktifMasaID: aktifMasaID || null,
								aktifFisID: aktifFisID || null,
								iptalAciklama: null
							}
						});
						await log.kaydet();
					}*/
					await logKaydet({ kismimi: false });
					await this.aktifFisKaldir();
					await this.setMasaAktifFisID({ tx: tx, id: aktifMasaID, fis: aktifFis, value: null });

					if (!this.syncServerPort) {
						const log2 = new SkyCafeLog({
							refTable: SkyCafeFis.table,
							refID: aktifFisID || null,
							islem: 'fisIptal',
							data: {
								from: 'masaTransfer',
								aktifMasaID: aktifMasaID || null,
								aktifFisID: aktifFisID || null,
								iptalAciklama: `Masa Transfer`
							}
						});
						await log2.kaydet({ tx: tx });
					}
				}
				else {
					await logKaydet({ kismimi: true });
				}
				
				if (!hasTx)
					tx = await dbMgr.getTx();

				const _promise = new $.Deferred(async p2 => {
					try { p2.resolve(await this.wsWaitAll()) }
					catch (ex) { p2.resolve(ex) }
				});
				setTimeout(() => _promise.resolve({ isError: true, rc: 'userAbort' }), 200);
				try { await _promise }
				catch (ex) { }
				
				const _e = {};
				this.wsBekleyenVerileriGonder(_e);
			}

			return true;
		}

		async tahsilatIstendi(e) {
			e = e || {};
			if (!this.zAcikmi) {
				displayMessage(`Z Kapalıdır, işlem yapılamaz`, `@ Z Kapalı @`);
				return false;
			}

			if (this.garsonmu) {
				setTimeout(() => displayMessage(`<b>Tahsilat Yapma</b> yetkiniz <u>yok</u>`, `@ Tahsilat İşlemi @`), 100);
				return false;
			}

			let toplam = 0;
			const {aktifFis} = this;
			const detaylar = (aktifFis || {}).detaylar || [];
			if ($.isEmptyObject(detaylar)) {
				setTimeout(() => displayMessage(`Hiç satış yok!`, `Tahsilat İşlemi`), 100);
				return false;
			}
			
			if (aktifFis) {
				for (const i in detaylar) {
					const det = detaylar[i];
					if (!det.silindimi)
						toplam += (det.netBedel || 0);
				}
				toplam = bedel(toplam);
			}

			/*if (!toplam) {
				setTimeout(() => displayMessage(`Ödemesi yapılacak hiç satış yok!`, `Tahsilat İşlemi`), 100);
				return false;
			}*/
			
			if (e.karmami) {
				let {tahsilatPart} = this;
				if (tahsilatPart)
					tahsilatPart.close();
				tahsilatPart = this.tahsilatPart
					= new SkyCafeTahsilatEkraniPart({ kismimi: e.kismimi });
				
				return new $.Deferred(async p => {
					$.extend(tahsilatPart, {
						geriCallback: _e => {
							const {activePart} = this;
							if (activePart) {
								if (activePart.barkodUIInput)
									activePart.barkodUIInput.val('');
								if (activePart.setFocusToDefault)
									activePart.setFocusToDefault(e);
							}
							// p.resolve(false)
							// p.reject({ isError: false, rc: 'userAbort' })
						},
						tamamIslemi: async _e => {
							const result = await this.tahsilatIstendiDevam($.extend({}, e, _e));
							if (!result)
								return result;
							p.resolve(result);
						}
					})
					return tahsilatPart.open();
				})
			}

			return await this.tahsilatIstendiDevam($.extend({}, e, { toplam: toplam }));
		}

		async tahsilatIstendiDevam(e) {
			this.timersDisabledFlag = true;
			try {
				const _promise = new $.Deferred(async p2 => {
					try { p2.resolve(await this.wsWaitAll()) }
					catch (ex) { p2.resolve(ex) }
				});
				setTimeout(() => _promise.resolve({ isError: true, rc: 'userAbort' }), 200);
				try { await _promise }
				catch (ex) { }
				
				return await this.tahsilatIstendiDevam2(e);
			}
			finally { this.timersDisabledFlag = false }
		}
		
		async tahsilatIstendiDevam2(e) {
			const {pratikSatismi} = this.class;
			const {karmami, toplam, sonuc, tahsilatBilgi, recs, noLog} = e;
			let {kismimi, tx} = e;
			const hasTx = !!tx;
			const {tahsilatPart, aktifFis, aktifMasaID} = this;
			const dbMgr = this.dbMgr_mf;

			if (tahsilatPart)
				tahsilatPart.close();
			
			if (!this.zAcikmi) {
				displayMessage(`Z Kapalıdır, işlem yapılamaz`, `@ Z Kapalı @`);
				return false;
			}
			if (!aktifFis)
				return false;

			const aktifFisID = aktifFis.id;
			const {tahsilatYapi} = aktifFis;
			for (const key in tahsilatBilgi) {
				if (tahsilatYapi[key] !== undefined)
					tahsilatYapi[key] = asFloat(tahsilatBilgi[key]) || 0;
			}

			const id2Detay = {};
			if (kismimi) {
				const {detaylar} = aktifFis;
				for (const i in detaylar) {
					const det = detaylar[i];
					if (!det.silindimi)
						id2Detay[det.id] = det;
				}
				
				let kapanmayanVarmi = false;
				const id2AcikDetay = $.extend({}, id2Detay);
				for (const i in recs) {
					const rec = recs[i];
					if (!rec.silindimi) {
						delete id2AcikDetay[rec.id];
						if ((rec.alinacakMiktar || 0) < (rec.miktar || 0)) {
							kapanmayanVarmi = true;
							break;
						}
					}
				}
				kapanmayanVarmi = kapanmayanVarmi || !$.isEmptyObject(id2AcikDetay);
				if (!kapanmayanVarmi)
					kismimi = false;
			}

			if (kismimi) {
				const kismiFis = aktifFis.shallowCopy();
				$.extend(kismiFis, {
					id: newGUID(),
					kapandimi: true, detaylar: []
				});
				const kismiFisID = kismiFis.id;

				let degistimi = false;
				const promises = [];
				for (const i in recs) {
					const rec = recs[i];
					const {id} = rec;
					rec.orjID = id;
					rec.id = newGUID();
					
					const alinacakMiktar = Math.max(rec.alinacakMiktar || 0, 0);
					const det = rec && !rec.silindimi ? id2Detay[id] : null;
					if (det && !det.silindimi && alinacakMiktar && alinacakMiktar > 0) {
						det.miktar = Math.max(det.miktar - (alinacakMiktar || 0), 0);
						if (det.miktar && det.miktar > 0)
							promises.push(det.detayEkIslemler({ tx: tx }));
						else
							delete id2Detay[id];

						rec.miktar = alinacakMiktar;
						delete rec.alinacakMiktar;
						promises.push(rec.detayEkIslemler({ tx: tx }));

						kismiFis.detaylar.push(rec);
						degistimi = true;
					}
				}
				await Promise.all(promises);
				
				if (degistimi) {
					if (!pratikSatismi) {
						await this.rezervasyonIstendiDevam({
							noLog: true, tx: tx,
							aktifMasaID: aktifMasaID, flag: false
						});
					}

					if ($.isEmptyObject(kismiFis.detaylar.filter(det => !det.silindimi && det.miktar)))
						kismiFis = null;
					else
						await kismiFis.kaydet();

					aktifFis.detaylar = aktifFis.detaylar.filter(det => !!det.miktar);
					aktifFis.tahsilatYapiReset();
					aktifFis.kapandimi = false;
					await aktifFis.kaydet({ tx: tx });

					/*if (pratikSatismi)
						await this.mutfakFisiYazdir({ tx: tx, fis: kismiFis });*/
					// await this.adisyonYazdir({ tx: tx, fis: kismiFis });

					if (!(noLog || pratikSatismi)) {
						const log = new SkyCafeLog({
							refTable: SkyCafeFis.table,
							refID: aktifFisID || null,
							refID2: kismiFisID || null,
							islem: 'kismiTahsilat',
							data: {
								dogrudanTahsilatTip: null,
								aktifMasaID: aktifMasaID || null,
								aktifFisID: aktifFisID || null,
								kismiFisID: kismiFisID || null,
								aktifFis: aktifFis.reduce(),
								kismiFis: kismiFis ? kismiFis.reduce() : null,
								toplam: toplam == null ? null : toplam,
								sonuc: sonuc == null ? null: sonuc,
								tahsilatBilgi: tahsilatBilgi,
								tahsilatDetayRecs:
									recs.filter(rec => rec && rec.miktar && rec.miktar > 0)
											.map(rec => rec.reduce ? rec.reduce() : rec)
							}
						});
						await log.kaydet();
					}
					if (toplam)
						await this.tahsilatFisiYazdir({ tx: tx, fis: kismiFis });
				}
				if (!hasTx)
					tx = await dbMgr.getTx();
				
				(async () => {
					const _promise = new $.Deferred(async p2 => {
						try { p2.resolve(await this.wsWaitAll()) }
						catch (ex) { p2.resolve(ex) }
					});
					setTimeout(() => _promise.resolve({ isError: true, rc: 'userAbort' }), 200);
					try { await _promise }
					catch (ex) { }
					
					const _e = {};
					this.wsBekleyenVerileriGonder(_e);
				})();
				
				// setTimeout(() => displayMessage(`... kısmi tahsilat işlemleri bla bla ...`), 500);
				return {
					karmami: karmami, kismimi: kismimi, dogrudanTahsilatTip: null,
					tahsilatBilgi: tahsilatBilgi, recs: recs, toplam: toplam, sonuc: sonuc,
					aktifFis: aktifFis, kismiFis: kismiFis, tahsilatPart: tahsilatPart
				};
			}

			if (!pratikSatismi) {
				await this.rezervasyonIstendiDevam({
					noLog: true, tx: tx,
					aktifMasaID: aktifMasaID, flag: false
				});
			}
			
			const tip2Selector = {
				NK: 'tahsilatNakit',
				PS: 'tahsilatPOS',
				YM: 'tahsilatYemekCeki'
			};
			const {tip} = e;
			const tahsilatSelector = tip2Selector[tip];
			if (aktifFis) {
				/*if (pratikSatismi)
					await this.mutfakFisiYazdir({ tx: tx, fis: aktifFis });*/
				// await this.adisyonYazdir({ tx: tx, fis: aktifFis });
				
				const _e = {};
				if (tahsilatSelector) {
					_e[tahsilatSelector] = aktifFis.fisSonuc;
					aktifFis.tahsilatYapiReset(_e);
				}
				aktifFis.kapandimi = true;
				await aktifFis.kaydet({ tx: tx });

				if (!(noLog || pratikSatismi)) {
					const log = new SkyCafeLog({
						refTable: SkyCafeFis.table,
						refID: aktifFisID || null,
						islem: tahsilatSelector ? 'dogrudanTahsilat' : 'karmaTahsilat',
						data: {
							dogrudanTahsilatTip: tahsilatSelector ? tip : null,
							aktifMasaID: aktifMasaID || null,
							aktifFisID: aktifFisID || null,
							aktifFis: aktifFis.reduce(),
							kismiFis: null,
							toplam: toplam == null ? null : toplam,
							sonuc: sonuc == null ? null : sonuc,
							tahsilatBilgi: tahsilatBilgi,
							tahsilatDetayRecs: null
						}
					});
					await log.kaydet({ tx: tx });
				}
				if (toplam)
					await this.tahsilatFisiYazdir({ tx: tx, fis: aktifFis });
			}

			await this.aktifFisKaldir();
			await this.setMasaAktifFisID({ tx: tx, id: aktifMasaID, value: null, noLog: noLog || pratikSatismi });
			if (!hasTx)
				tx = await dbMgr.getTx();

			(async () => {
				const _promise = new $.Deferred(async p2 => {
					try { p2.resolve(await this.wsWaitAll()) }
					catch (ex) { p2.resolve(ex) }
				});
				setTimeout(() => _promise.resolve({ isError: true, rc: 'userAbort' }), 200);
				try { await _promise }
				catch (ex) { }
				
				const _e = {};
				this.wsBekleyenVerileriGonder(_e);
			})();

			return {
				karmami: karmami, kismimi: kismimi, dogrudanTahsilatTip: tahsilatSelector ? tip : null,
				tahsilatBilgi: tahsilatBilgi, recs: recs, toplam: toplam, sonuc: sonuc,
				aktifFis: aktifFis, kismiFis: null, tahsilatPart: tahsilatPart
			};
		}

		async yazdirIstendi(e) {
			e = e || {};
			if (!this.zAcikmi) {
				displayMessage(`Z Kapalıdır, işlem yapılamaz`, `@ Z Kapalı @`);
				return false;
			}

			const {pratikSatismi} = this.class;
			const {aktifFis, aktifMasaID} = this;
			if (!aktifFis)
				return false;
			
			//if (aktifMasa.servisDisimi)
			//	return this.servisDisiIstendiDevam({ aktifMasa: aktifMasa, flag: false });

			return new $.Deferred(p => {
				displayMessage(
					`<p>${pratikSatismi ? 'FİŞ' : 'ADİSYON'} yazdırılacak...</p><p>Devam edilsin mi?</p>`,
					`Yazdır`,
					true,
					{
						EVET: async (dlgUI, btnUI) => {
							const result = await this.adisyonYazdir($.extend({}, e, {
								aktifFis: aktifFis,
								// aktifMasaID: aktifMasaID,
								instantSend: true
							}));
							dlgUI.jqxWindow('close');
							p.resolve({ result: result });
						},
						HAYIR: (dlgUI, btnUI) => {
							dlgUI.jqxWindow('close');
							p.reject({ isError: false, rc: 'userAbort' })
						}
					}
				)
			})
		}

		async adisyonYazdir(e) {
			return await this.yazdir($.extend({}, e, { tip: 'fis' }))
		}

		async mutfakFisiYazdir(e) {
			return await this.yazdir($.extend({}, e, { tip: 'mutfakFisi' }))
		}

		async tahsilatFisiYazdir(e) {
			return await this.yazdir($.extend({}, e, { tip: 'tahsilatFisi' }))
		}

		async yazdir(e) {
			e = e || {};
			if (!this.zAcikmi) {
				displayMessage(`Z Kapalıdır, işlem yapılamaz`, `@ Z Kapalı @`);
				return false;
			}

			let fis = e.fis || (e.fisID ? await this.getFis({ fisID: e.fisID }) : null) || this.aktifFis;
			const fisID = e.fisID || e.aktifFisID ||  (fis || {}).id;

			if (!fisID)
				return false;

			const {aktifMasaID} = e;					// !! Mevcut Aktif Masa ID'yi ALMA !!
			const {pratikSatismi} = this.class;
			const dbMgr = SkyCafeFis.dbMgr;
			const hasTx = !!e.tx;
			let tx = e.tx || await dbMgr.getTx();
			
			let tip = e.tip || 'fis';
			if (!pratikSatismi && tip == 'fis')
				tip = 'adisyon';

			const iptalmi = e.iptal || e.iptalmi;
			const adisyonmu = (tip == 'fis' || tip == 'adisyon');
			const mutfakFisimi = (tip == 'mutfakFisi');
			
			/*if (!iptalmi && fis && fis.yazdirildimi && adisyonmu && this.garsonmu) {
				displayMessage(`<b>${aktifMasaID}</b> masasına ait Adisyon yazdırılmış ve tekrar yazdırılamaz`, `@ Adisyon Yazdır İşlemi @`);
				return false;
			}*/
			
			const log = new SkyCafeLog({
				refTable: SkyCafeFis.table,
				refID: fisID,
				refID2: aktifMasaID || null,
				islem: `${tip}${iptalmi ? 'Iptal' : ''}Yazdir`,
				altIslem: `yazdir`
			});
			await log.kaydet({ tx: tx });

			let upd = new MQIliskiliUpdate({
				from: SkyCafeDetay.table,
				where: [
					{ degerAta: fisID, saha: SkyCafeDetay.fisIDSaha },
					`yazdirildi = ''`
				],
				set: [
					`yazdirildi = '*'`
				]
			});
			await dbMgr.executeSql({ tx: tx, query: upd });

			if (!mutfakFisimi) {
				upd = new MQIliskiliUpdate({
					from: SkyCafeFis.table,
					where: [
						{ degerAta: fisID, saha: SkyCafeFis.idSaha },
						`yazdirildi = ''`
					],
					set: [
						`yazdirildi = '*'`
					]
				});
				await dbMgr.executeSql({ tx: tx, query: upd });
				if (!hasTx)
					tx = await dbMgr.getTx();
			}
			
			if (fis) {
				if (!mutfakFisimi)
					fis.yazdirildimi = true;
				
				if (fis.detaylar) {
					for (const i in fis.detaylar) {
						const det = fis.detaylar[i];
						if (!det.silindimi && !det.yazdirildimi)
							det.yazdirildimi = true;
					}
				}
			}
			
			if (e.instantSend) {
				const _promise = new $.Deferred(async p2 => {
					try { p2.resolve(await this.wsWaitAll()) }
					catch (ex) { p2.resolve(ex) }
				});
				setTimeout(() => _promise.resolve({ isError: true, rc: 'userAbort' }), 200);
				try { await _promise }
				catch (ex) { }
				
				const _e = {};
				this.wsBekleyenVerileriGonder(_e);
			}
			
			return true;
		}

		async iptalAciklamaSor(e) {
			return new $.Deferred(p => {
				new SkyCafeTextInputPart().open({
					title: `İptal Sebebi`,
					// baslikText: `İptal Sebebi`,
					geriCallback: e => {
						p.reject({ isError: false, rc: 'userAbort' })
					},
					tamamIslemi: e => {
						const {sender, value} = e;
						if (!value) {
							displayMessage(`<b>İptal Sebebi</b> girilmelidir!`);
							return false;
						}
						p.resolve({ sender: sender, value: value.trim() });
					}
				})
			})
		}

		iptalIstendi(e) {
			e = e || {};
			if (!this.zAcikmi) {
				displayMessage(`Z Kapalıdır, işlem yapılamaz`, `@ Z Kapalı @`);
				return false;
			}
			
			const {aktifFis, aktifMasaID} = this;
			if (!aktifFis) {
				this.aktifFisKaldir({ tx: e.tx, noLog: false });
				this.setMasaAktifFisID({ tx: e.tx, id: aktifMasaID, value: null, noLog: false });
				return true;
			}
			
			let toplam = 0;
			if (aktifFis) {
				const {detaylar} = aktifFis;
				for (const i in detaylar) {
					const det = detaylar[i];
					if (!det.silindimi)
						toplam += (det.netBedel || 0);
				}
				toplam = bedel(toplam);
			}

			const {pratikSatismi} = this.class;
			if (pratikSatismi) {
				if (toplam) {
					return new $.Deferred(p => {
						this.iptalAciklamaSor(e).then(async _e => {
							p.resolve({ result: await this.iptalDevam($.extend({}, e, { toplam: toplam, iptalAciklama: _e.value })) })
						}).catch(ex => {
							p.reject(ex || { isError: false, rc: 'userAbort' })
						});
					})
				}
				return true;
			}
			
			return new $.Deferred(p => {
				displayMessage(
					`<p>ADİSYON <span class="bold red">İPTAL EDİLECEK</span>...</p><p>Devam edilsin mi?</p>`,
					`Adisyon İPTAL`,
					true,
					{
						EVET: async (dlgUI, btnUI) => {
							const result = await this.iptalDevam($.extend({}, e, { toplam: toplam }));
							dlgUI.jqxWindow('close');
							p.resolve({ result: result });
						},
						HAYIR: (dlgUI, btnUI) => {
							dlgUI.jqxWindow('close');
							p.reject({ isError: false, rc: 'userAbort' })
						}
					}
				)
			})
		}

		async iptalDevam(e) {
			this.timersDisabledFlag = true;
			try {
				const _promise = new $.Deferred(async p2 => {
					try { p2.resolve(await this.wsWaitAll()) }
					catch (ex) { p2.resolve(ex) }
				});
				setTimeout(() => _promise.resolve({ isError: true, rc: 'userAbort' }), 500);
				try { await _promise }
				catch (ex) { }
				
				return await this.iptalDevam2(e);
			}
			finally { this.timersDisabledFlag = false }
		}

		async iptalDevam2(e) {
			e = e || {};
			const aktifFis = e.aktifFis || e.fis || this.aktifFis;
			if (!aktifFis)
				return false;
			
			const {pratikSatismi} = this.class;
			const {noLog, tx, iptalAciklama} = e;
			const aktifMasaID = e.aktifMasaID || e.masaID || this.aktifMasaID;
			const aktifFisID = (aktifFis || {}).id;
			const from = e.from || 'ui';
			
			$.extend(aktifFis, {
				iptalAciklama: iptalAciklama,
				kapandimi: true,
				devreDisimi: true
			});
			await aktifFis.kaydet({ tx: tx });
			// await aktifFis.sil({ tx: tx });

			if (!pratikSatismi) {
				this.rezervasyonIstendiDevam({
					tx: tx, noLog: true,
					aktifMasaID: aktifMasaID, flag: false
				});
			}

			await this.aktifFisKaldir({ tx: tx, noLog: noLog || pratikSatismi });
			await this.setMasaAktifFisID({ tx: tx, id: aktifMasaID, value: null, noLog: noLog || pratikSatismi });

			let yazdirildimi = false;
			if (!(noLog || pratikSatismi)) {
				await this.adisyonYazdir({ tx: tx, aktifFisID: aktifFisID, iptalmi: true, instantSend: false });
				yazdirildimi = true;
				
				let log = new SkyCafeLog({
					refTable: SkyCafeFis.table,
					refID: aktifFisID || null,
					islem: 'fisIptal',
					data: {
						from: from,
						aktifMasaID: aktifMasaID || null,
						aktifFisID: aktifFisID || null,
						iptalAciklama: iptalAciklama || ''
					}
				});
				await log.kaydet({ tx: tx });
				
				(async () => {
					const _promise = new $.Deferred(async p2 => {
						try { p2.resolve(await this.wsWaitAll()) }
						catch (ex) { p2.resolve(ex) }
					});
					setTimeout(() => _promise.resolve({ isError: true, rc: 'userAbort' }), 200);
					try { await _promise }
					catch (ex) { }
					
					const _e = {};
					this.wsBekleyenVerileriGonder(_e);
				})();
			}

			if (!(e.silent || e.mesajYok) && e.toplam)
				setTimeout(() => displayMessage(`Belge iptal edildi!`), 1000);
			
			return true;
		}

		async kasiyerIslemleriIstendi(e) {
			e = e || {};
			const _e = { ekKapsam: ['kasiyerIslemleri'] };
			await showProgress(`Aktif Bilgiler merkezden yükleniyor...`, null, 10);
			let waitPromise = new $.Deferred(async p => {
				let {promise_aktifBilgileriYukle} = this;
				if (promise_aktifBilgileriYukle && !this.syncServerPort) {
					promise_aktifBilgileriYukle.reject({ rc: 'userAbort' });
					try { await promise_aktifBilgileriYukle }
					catch (ex) { }
				}
				
				try {
					await this.wsAktifBilgileriYukle(_e);
					await this.wsAktifBilgilerYuklendi(_e);
				}
				finally {
					waitPromise = null;
					setTimeout(() => {
						const {activeWndPart} = this;
						if (activeWndPart && activeWndPart.wnd && activeWndPart.listeTazele)
							activeWndPart.listeTazele();
						hideProgress();
						p.resolve(true);
					}, 100);
				}
			});
			
			return new $.Deferred(async p => {
				setTimeout(() => {
					if (waitPromise)
						waitPromise.resolve(null);
					hideProgress();
					this.hideNotifications();
				}, 3000);
				await waitPromise;
				new SkyCafeKasiyerIslemleriPart().open({
					content: false,
					geriCallback: e => {
						const {activePart} = this;
						if (activePart) {
							if (activePart.barkodUIInput)
								activePart.barkodUIInput.val('');
							if (activePart.setFocusToDefault)
								activePart.setFocusToDefault(e);
						}
						// p.reject({ isError: false, rc: 'userAbort' })
					},
					tamamIslemi: async e => {
						const result = await this.kasiyerIslemleriIstendiDevam($.extend({}, e, {
							sender: e.sender,
							recs: e.recs
						}));
						if (!result)
							return result;
						p.resolve({ sender: e.sender, result: result });
					}
				});
			})
		}

		async kasiyerIslemleriIstendiDevam(e) {
			const {pratikSatismi} = this.class;
			const {recs, noLog} = e;
			const dbMgr = this.dbMgr_mf;
			let {tx} = e;
			const hasTx = !!tx;
			if ($.isEmptyObject(recs)) {
				// displayMessage(`Kaydedilecek bilgi yok`, `@ Kasiyer İşlemleri @`);
				return false;
			}

			displayMessage(
				`<b>${recs.length}</b> satır bilgi kaydedildi`,
				`Kasiyer İşlemleri`
			);

			const _e = { noSyncControl: true };
			this.wsAktifBilgileriYukle(_e).then(() =>
				this.wsAktifBilgilerYuklendi(_e));
			
			return true;
		}

		async zHesaplasmaIstendi(e) {
			e = e || {};
			const _e = { ekKapsam: ['zHesaplasma'] };
			await showProgress(`Aktif Bilgiler merkezden yükleniyor...`, null, 10);
			let waitPromise = new $.Deferred(async p => {
				let {promise_aktifBilgileriYukle} = this;
				if (promise_aktifBilgileriYukle && !this.syncServerPort) {
					promise_aktifBilgileriYukle.reject({ rc: 'userAbort' });
					try { await promise_aktifBilgileriYukle }
					catch (ex) { }
				}

				try {
					await this.wsAktifBilgileriYukle(_e);
					await this.wsAktifBilgilerYuklendi(_e);
				}
				finally {
					waitPromise = null;
					setTimeout(() => {
						const {activeWndPart} = this;
						if (activeWndPart && activeWndPart.wnd && activeWndPart.listeTazele)
							activeWndPart.listeTazele();
						hideProgress();
						p.resolve(true);
					}, 100);
				}
			});
			
			return new $.Deferred(async p => {
				setTimeout(() => {
					if (waitPromise)
						waitPromise.resolve(null);
					hideProgress();
					this.hideNotifications();
				}, 5000);
				await waitPromise;
				new SkyCafeZHesaplasmaPart().open({
					content: false,
					geriCallback: e => {
						const {activePart} = this;
						if (activePart) {
							if (activePart.barkodUIInput)
								activePart.barkodUIInput.val('');
							if (activePart.setFocusToDefault)
								activePart.setFocusToDefault(e);
						}
						// p.reject({ isError: false, rc: 'userAbort' })
					},
					tamamIslemi: async e => {
						const result = await this.zHesaplasmaIstendiDevam($.extend({}, e, {
							sender: e.sender,
							zKapansinmi: e.zKapansinmi,
							recs: e.recs
						}));
						if (!result)
							return result;
						p.resolve({ sender: e.sender, result: result });
					}
				});
			})
		}

		async zHesaplasmaIstendiDevam(e) {
			const {pratikSatismi} = this.class;
			const {zKapansinmi, recs, noLog} = e;
			const dbMgr = this.dbMgr_mf;
			let {tx} = e;
			const hasTx = !!tx;
			/*if ($.isEmptyObject(recs)) {
				// displayMessage(`Kaydedilecek bilgi yok`, `@ Kasiyer İşlemleri @`);
				return false;
			}*/

			if (!$.isEmptyObject(recs)) {
				displayMessage(
					/*`<b>${recs.length}</b> satır bilgi kaydedildi`,*/
					`Z Hesaplaşma bilgisi kaydedildi`,
					`Z Hesaplaşma`
				);
			}

			if (zKapansinmi) {
				const _promise = new $.Deferred(async p2 => {
					try { p2.resolve(await this.wsWaitAll()) }
					catch (ex) { p2.resolve(ex) }
				});
				setTimeout(() => _promise.resolve({ isError: true, rc: 'userAbort' }), 200);
				try { await _promise }
				catch (ex) { }
				
				const _e = {};
				this.wsBekleyenVerileriGonder(_e).then(() =>
					this.zAcKapatIstendiDevam({ flag: false }));
			}
			else {
				const _e = { noSyncControl: true };
				this.wsAktifBilgileriYukle(_e).then(() =>
					this.wsAktifBilgilerYuklendi(_e));

				setTimeout(() => this.zBilgiGoster(e), 1000);
				const {navPart} = this;
				if (navPart)
					navPart.tazele();
			}
			
			return true;
		}

		raporIstendi(e) {
			const {sessionInfo} = sky.config;
			let url = location.href.replace(`SkyCafeRestApp`, `PanelRaporlamaApp`).replace(`SkyCafePratikApp`, `PanelRaporlamaApp`);
			if (!url.includes(`loginTipi=`) && !url.includes(`sessionMatch=`))
				url += `&loginTipi=${sessionInfo.loginTipi || ''}`;
			if (!url.includes(`user=`))
				url += `&user=${sessionInfo.user || ''}`;
			if (!url.includes(`pass=`))
				url += `&pass=${sessionInfo.pass || ''}`;
			if (!url.includes(`tamEkranYok`))
				url +=`&tamEkranYok`;
			if (!url.includes(`logoutClosesWindow`))
				url +=`&logoutClosesWindow`;
			if (!url.includes(`tip=restoran`))
				url +=`&tip=restoran`;
			if (!url.includes(`otoBaslat`))
				url +=`&otoBaslat`;
			
			if (url.includes(`#nbb`))
				url = url.replace(`&#nbb`, ``);
			
			if (!url.endsWith(`&`))
				url += `&`;
			
			const wnd = openNewWindow(url, `skyCafeRapor`);
			if (wnd)
				setTimeout(() => wnd.focus(), 500);

			return wnd;
		}

		toggleRestPraIstendi(e) {
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
		}

		async onResize(e) {
			await super.onResize(e);

			const {content, innerContent} = this;
			content.height($(window).height() - content.offset().top);
			innerContent.height($(window).height() - this.header.cssClip().bottom - 3);

			const {activeWnd, activeWndPart} = this;
			if (activeWnd && activeWndPart && !activeWndPart.isDestroyed && activeWndPart.onResize)
				await activeWndPart.onResize(e);
			
			const {navPart} = this;
			if (navPart)
				await navPart.onResize(e);
		}

		async loginIstendiDevam(e) {
			const extLogin = this.extensions.login;
			await (window.savedProcs || window).showProgress(null, null, 1);
			try {
				if (sky.config.logoutClosesWindow) {
					await extLogin.closeLoginUI();
					window.close();
					return;
				}
				await extLogin.closeLoginUI();
				await extLogin.logout();

				delete this._yetki;
				await this.ortakReset();
				
				await this.clearTimers();
				const {uniqueTimers} = this;
				if (uniqueTimers) {
					for (const key in uniqueTimers)
						await this.clearUniqueTimeout({ key: key });
				}

				await this.knobProgressDestroy();
				await this.destroyPart();
				await this.clearContentWithDestroy();
			}
			finally {
				await (window.savedProcs || window).hideProgress();
			}

			$.jqx.cookie.cookie('tanimlariYuklemeFlag', true);
			if (this.noFastLogin) {
				location.reload();
			}
			else {
				delete sky.app;
				await sky.run();
			}
		}

		fixRecs(e) {
			e = e || {};
			const {recs} = e;
			if (!recs || !$.isArray(recs))
				return recs;

			const id2Rec = {};
			for (const i in recs) {
				const rec = recs[i];
				if (!rec)
					continue;
				
				let id = rec.id;
				id == null ? rec.id : id;
				let parentID = rec.parentID;
				parentID = parentID == null ? rec.parentId : parentID;
				if (parentID == null && id == null)
					continue;

				if (parentID == null) {
					id2Rec[id] = rec;
				}
				else {
					const subRecs = id2Rec[parentID] = id2Rec[parentID] || [];
					subRecs.push(rec);
				}
			}
			
			return id2Rec
		}
	}
})()
