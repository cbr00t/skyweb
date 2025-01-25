(function() {
	window.SkyConfigApp = class extends window.Prog {
		static get appName() { return 'skyConfigApp' }
		get defaultLayoutName() { return this.appName }
		static get appText() { return `Sky Konfigurasyon` }
		get appText() {
			const {hostName} = sky.config;
			return this.class.appText + (hostName ? `  [${hostName}]` : '')
		}
		get loginExtensionClass() { return SkyConfigLoginExtension }
		static get qrScanDesteklenirmi() { return true }
		static get jsonEditorDesteklermi() { return true }
		static get aceEditorDesteklermi() { return true }

		get servisTip2Aciklama() {
			let result = this._servisTip2Aciklama;
			if (!result) {
				const {gelismisModmu, gelismisModDisabledFlag} = this;
				result = this._servisTip2Aciklama = {
					vioWS: `VIO WebServis`, cariEFatListeSorgula: `Cari e-Fat Sorgula`, cariEFatListeGuncelle: `Cari e-Fat Güncelle`, cariEFatListeSorgulaVeGuncelle: `Cari e-Fat Sorgula ve Güncelle`,
					zamanlanmisGorev: `VIO (<i>Ticari Program</i>) Zamanlanmış Görevler`, dovizKurGuncelle: 'Döviz Kur Güncelle', maliyetDuzenle: 'Maliyet Düzenleme İşlemi',
					pdaIPC: `Eski ElTerminali (<i>PDA</i>) IPC Sunucusu`, pdaAktarici: `Eski ElTerminali (<i>PDA</i>) Ticariye Aktarıcı`, 'pdks-mukerrerSil': `PDKS Tekrarlayan Kayıtları Sil`,
					'pdks-api': 'PDKS Veri Alımı (<i>ZK API</i>)', 'pdks-api-sbx': 'PDKS Veri Alımı (<i>SBX API</i>)', 'pdks-api-fpclock': 'PDKS Veri Alımı (<i>FPCLock API</i>)',
					'pdks-db-zktime': `PDKS Veri Alımı (<i>ZKTime Veritabanından</i>)`, 'pdks-db-timeroll': `PDKS Veri Alımı (<i>TimeRoll Veritabanından</i>)`,
					pdks: `PDKS Veri Alımı (<i>Web Arayüzü üzerinden</i>)`, skyBulutYedekleme: `Sky Bulut Yedekleme`, vioProg: `VIO Program Servisi`, frp: 'FRP', 
					eIslemGonder: `e-İşlem Gönder`, eIslemAkibetSorgula: `e-İşlem Akıbet Sorgula`, gelenEIslemSorgula: `Gelen e-İşlem Sorgula`, eIslemArsivle: `e-İşlem Arşivle`,
					vioGuncelle: `Vio Sürüm Güncelleme İşlemi`, vioMenuGorev: `VIO Menü Görevi`, /*eMail: `e-Mail Gönderimi`,*/ eMailQueue: `e-Mail Kuyruğu İşlet`,
					cvmRestart: `CVM Yeniden Başlat` /*, wsRestart: `SkyWS Yeniden Başlat`*/
				};
				if (gelismisModmu && !gelismisModDisabledFlag && SkyConfigYetki.yetkilimi({ yetki: 'subServiceManager' })) {
					$.extend(result, {
						appStart: 'Uygulama Çalıştır', shell: 'Shell Komutu Çalıştır', cvmCall: 'CVM Komut Çalıştır', sqlExec: 'SQL Komutu Çalıştır',
						webRequest: 'Web İsteği Gönder', hamachi: 'Hamachi VPN', skyWS: 'Sky WebServis (Alt İşlem)', hfs: 'HFS (Http File Server)', frps: 'FRP Server',
						vioPortal: 'VIO Portal', skyTurmob: 'Sky Turmob Sorgusu'
					})
				}
			}
			return result
		}
		get servisTip2Grup() {
			let result = this._servisTip2Grup;
			if (!result) {
				const grup_system = { id: 'system', aciklama: 'Sistem' };
				const grup_vioServer = { id: 'vioServer', aciklama: 'VIO Sunucu' };
				result = this._servisTip2Grup = {
					appStart: grup_system, shell: grup_system, cvmCall: grup_system, sqlExec: grup_system, webRequest: grup_system,
					skyWS: grup_system, hfs: grup_system, frp: grup_system, frps: grup_system, hamachi: grup_system, vioPortal: grup_vioServer, skyTurmob: grup_vioServer
				}
			}
			return result
		}
		get eIslemTipKAListe() {
			let result = this._eIslemTipKAListe;
			if (!result) {
				result = this._eIslemTipKAListe = [
					{ kod: 'E', aciklama: 'e-Fatura' },
					{ kod: 'A', aciklama: 'e-Arşiv' },
					{ kod: 'IR', aciklama: 'e-İrsaliye' },
					{ kod: 'IH', aciklama: 'e-İhracat' },
					{ kod: 'MS', aciklama: 'e-Müstahsil' }
				]
			}
			return result
		}
		get vioUzakDestekPaketAdi() { return 'anydesk' }
		get vioPaketler() {
			let result = this._vioPaketler;
			if (!result) {
				const liste = [
					{ paketAdi: 'VioKur', aciklama: `VIO Kurulum` },
					{ paketAdi: 'VioKur_Ek', aciklama: `VIO Kurulum (Ek Bileşenler)` },
					{ paketAdi: 'CSkyWSKur', aciklama: `Sky WebServis` },
					{ paketAdi: 'VioTicari', aciklama: `Ticari Sistem` },
					{ paketAdi: 'VioMuhasebeci', aciklama: `Muhasebeci` },
					{ paketAdi: 'VioTablet', aciklama: `Windows Tablet` },
					{ paketAdi: 'VDisTicari', aciklama: `VIO Dış Ticari` },
					{ paketAdi: 'AppServKur', aciklama: `Web Sunucusu (AppServ)` }
				];
				if (this.gelismisModmu && !this.gelismisModDisabledFlag && this.programcimi && SkyConfigYetki.yetkilimi({ yetki: 'developer' }))
					liste.push({ paketAdi: 'VioPortal', aciklama: `VIO Portal` })
				return liste
			}
			return result
		}

		constructor(e) {
			super(e); e = e || {};
			const extLogin = this.extensions.login;
			extLogin.options.isLoginRequired = false;
			this.param = new SkyConfigParam();
			const {programcimi} = this;
			let value = asBoolQ(qs.gelismis || qs.advanced);
			/*if (programcimi) {
				if (value == null)
					value = asBoolQ(Utils.cookie(`${this.appName}-gelismisModmu`))
			}
			else
				this.gelismisModDisabledFlag = true
			*/
			if (value == null)
				value = asBoolQ(Utils.cookie(`${this.appName}-gelismisModmu`))
			/*if (value == null)
				value = programcimi*/
			this.gelismisModmu = value
		}

		updateWSUrlBase(e) {
			const port = $.isEmptyObject(window.wsPorts) ? SkyConfigParam.DefaultWSPort : undefined;
			return super.updateWSUrlBase({ port: port, path: `ws/yonetim/` })
		}
		async ilkIslemler(e) {
			/*try { Utils.disableHistoryBack() } catch (ex) { }*/
			await this.paramYukle(e);
			this.destroyWindows();
			if (!this.noFullScreenFlag)
				try { requestFullScreen() } catch (ex) { }
			await super.ilkIslemler(e)
		}
		async run(e) {
			e = e || {}; await super.run(e);
			if (!await this.loginOncesiKontrol(e)) {
				let part = new SkyConfigParamPart({
					content: this.content,
					tamamIslemi: async e => {
						await e.sender.destroyPart();
						await this.destroyPart();
						delete sky.app;
						sky.run()
					}
				});
				await part.run();
				if (part.ortakIslemTuslariPart)
					await part.ortakIslemTuslariPart.destroyPart()
				this.destroyPart();
				return
			}
			await this.extensions.login.loginIslemi(e)
		}

		async afterRun(e) {
			e = e || {}; await super.afterRun(e);
			let {activePart} = this;
			if (!activePart || activePart == this)
				await this.destroyWindows()
			if (!this.noFullScreenFlag)
				try { requestFullScreen() } catch (ex) { }

			const {config} = sky, sessionInfo = config.sessionInfo || {}, {user, userDesc} = sessionInfo, {hostName} = config;
			this.btnUserInfo.html(`<b>${user}</b>` + (userDesc ? `<span>-</span><span>${userDesc}</span>` : ''));
			if (hostName)
				this.appTitleText = `${this.class.appText}<span class="lightgray" style="font-size: 115%; margin-left: 30px; margin-top: 5px;">[ ${hostName} ]</span>`

			const {nav} = this;
			if (asBool(qs.veriYonetimi)) {
				nav.addClass('jqx-hidden');
				// this.gelismisModDisabledFlag = true;
				this.btnAyarlar.addClass('jqx-hidden');
				this.chkGelismis_parent.addClass('jqx-hidden');
				const {sessionInfo} = sky.config;
				if (sessionInfo && !sessionInfo.yetki)
					sessionInfo.yetki = 'restricted';
				this.sessionInfoDegisti(e);
				try {
					const key = 'skyBulutYedekleme', wsConfig = await this.wsConfigOku(), subWSConfig = wsConfig[key] = wsConfig[key] || {};
					const part = new SkyConfigSkyBulutYedeklemeVeriYonetimiPart({ parentPart: this, canClose: false });
					await part.open();
					$('.jqx-window-modal').css('z-index', 1)
				}
				catch (ex) { defFailBlock(ex) }
			}
			else
				nav.find(`ul > li#durum`).click()
			hideProgress();
			((window.savedProcs || {}).hideProgress || hideProgress)();
			for (const timeout of [500, 1000, 2000])
				setTimeout(() => { hideProgress(); ((window.savedProcs || {}).hideProgress || hideProgress)() }, timeout)
		}
		async postInitLayout(e) {
			e = e || {}; await super.postInitLayout(e);
			const layout = e.layout || this.layout;
			await this.initGlobals(e);
			const btnAyarlar = this.btnAyarlar = layout.find(`#ayarlar`).jqxButton({ theme: theme });
			btnAyarlar.on('click', evt =>
				this.ayarlarIstendi({ event: evt }));
			const btnTazele = layout.find(`#btnTazele`).jqxButton({ theme: theme });
			btnTazele.on('click', evt =>
				this.tazele({ event: evt }));
			const btnToggleFullScreen = layout.find(`#btnToggleFullScreen`).jqxButton({ theme: theme });
			btnToggleFullScreen.on('click', evt =>
				this.toggleFullScreen({ event: evt }));
			const userInfo_popup = this.userInfo_popup = layout.find(`#userInfo_popup`).jqxMenu({
				theme: theme, width: 300,
				mode: 'popup', autoOpenPopup: false
			});
			userInfo_popup.on('itemclick', evt => {
				const {id} = evt.target;
				switch (id) {
					case 'sifreDegistir': return this.sifreDegistirIstendi({ event: evt })
					case 'logout': return this.logoutIstendi({ event: evt })
				}
			});
			const btnUserInfo = this.btnUserInfo = layout.find(`#userInfo`).jqxButton({ theme: theme });
			btnUserInfo.on('click', evt => {
				const pos = {
					x: btnUserInfo.position().left + btnUserInfo.width() - userInfo_popup.jqxMenu('width') + 7,
					y: btnUserInfo.position().top + btnUserInfo.height() + 10
				};
				userInfo_popup.jqxMenu('open', pos.x, pos.y)
			});
			/*const btnLogout = layout.find(`#btnLogout`).jqxButton({ theme: theme });
			btnLogout.on('click', evt =>
				this.logoutIstendi({ event: evt }))*/
			const chkGelismis_parent = this.chkGelismis_parent = layout.find(`#chkGelismis_parent`);
			const chkGelismis = this.chkGelismis = chkGelismis_parent.find(`#chkGelismis`);
			chkGelismis.prop('checked', this.gelismisModmu);
			chkGelismis_parent[this.gelismisModmu ? 'addClass' : 'removeClass'](`checked`);
			if (this.gelismisModDisabledFlag) {
				this.gelismisModmu = false;
				chkGelismis[0].disabled = true
			}
			else {
				chkGelismis.on('change', evt => {
					if (this.gelismisModDisabledFlag)
						return
					const flag = this.gelismisModmu = chkGelismis.is(`:checked`);
					chkGelismis_parent[flag ? 'addClass' : 'removeClass'](`checked`);
					Utils.cookie(`${this.appName}-gelismisModmu`, flag);
					this.gelismisModFlagDegisti($.extend({}, e, { event: evt }))
				});
				chkGelismis[0].disabled = false
			}

			const outer = this.outer = layout.find(`#outer`);
			const navBar = this.navBar = outer.find(`#navBar`);
			const nav = this.nav = navBar.find(`#nav`).jqxMenu({
				theme: theme, mode: 'vertical',
				width: 'auto', minimizeWidth: 700
			});
			nav.on('itemclick', evt =>
				this.menuItemTiklandi({ event: evt, id: evt.target.id }));
			const subContent = this.subContent = outer.find(`#subContent`);
			this.gelismisModFlagDegisti(e)
		}
		initGlobals(e) {
			e = e || {}; const layout = e.layout || this.layout;
			this.templatesOrtak = layout
		}
		async loginOncesiKontrol(e) {
			let {param} = this, degistimi = false, hasQSArgs = qs.hostname || qs.port;
			$.extend(qs, { hostname: qs.hostname || param.wsHostNameUyarlanmis, port: qs.port || param.wsPort });
			qs._port = qs.port;
			await sky.config.load();
			this.updateWSUrlBase();
			if (!hasQSArgs) { delete qs.hostname; delete qs.port }
			return hasQSArgs || !!param.wsHostNameUyarlanmis
		}
		async paramYukle(e) { await this.param.yukle() }
		async paramKaydet(e) {
			const eskiParam = this.param || {}; let {param} = e;
			param.version = param.version || eskiParam.version || param.class.version;
			await param.kaydet({ parcaCallback: e => this.knobProgressStep(2) });
			this.param = param;
			let degistimi = (
				eskiParam.wsHostNameUyarlanmis && eskiParam.wsPort &&
				!(eskiParam.wsHostNameUyarlanmis == param.wsHostNameUyarlanmis && eskiParam.wsPort == param.wsPort)
			);
			const hasQSArgs = qs.hostname || qs.port;
			$.extend(qs, { hostname: qs.hostname || param.wsHostNameUyarlanmis, port: qs.port || param.wsPort });
			if (degistimi) {
				const {config} = sky, savedSessionInfo = config.sessionInfo;
				await config.load(); this.updateWSUrlBase();
				if (!hasQSArgs) { delete qs.hostname; delete qs.port; }
				config.sessionInfo = savedSessionInfo;
				this.loginIstendiDevam(e)
			}
			setTimeout(() => {
				this.knobProgressHideWithReset({
					delayMS: 2000,
					update: {
						showLoading: false,
						progress: 100,
						label: `<span style="font-weight: bold; color: forestgreen;">Parametreler kaydedildi</span>`
					}
				})
			}, 100)
		}
		async tazele(e) {
			const {activePart, activeInnerPart} = this;
			// await showProgress(null, null, 1);
			return await new $.Deferred(async p => {
				try {
					if (activePart && activePart.tazele)
						await activePart.tazele(e);
					if (activeInnerPart && activeInnerPart.tazele)
						await activeInnerPart.tazele(e);
					p.resolve(true);
					// await this.knobProgressHideWithReset({ delayMS: 500, update: { labelTemplate: 'success', label: `` } })
					setTimeout(async () => await this.knobProgressHideWithReset({ delayMS: 0, update: { labelTemplate: 'success', label: `` } }), 500)
				}
				catch (ex) {
					defFailBlock(ex);
					setTimeout(async () => this.knobProgressHideWithReset({ delayMS: 1500, update: { labelTemplate: 'error', label: `İletişim sorunu` } }), 500)
				}
			})
		}
		wsGetSessionInfo(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				timeout: 10000, url: `${this.wsURLBase}getSessionInfo/?${$.param(this.buildAjaxArgs())}`
			});
			lastAjaxObj.then(result => {
				const {sessionInfo} = sky.config;
				let degistimi = false;
				if (sessionInfo) {
					if (sessionInfo.sessionID == result.sessionID || sessionInfo.user == result.user) {
						const keys = sessionInfo.class.EkAttrListe;
						for (const key of keys) {
							const value = result[key];
							if (value !== undefined && sessionInfo[key] != value) {
								sessionInfo[key] = value;
								degistimi = true
							}
						}
					}
				}
				this.clearUniqueTimeout({ key: 'sessionInfoDegisti' });
				this.setUniqueTimeout({
					key: 'sessionInfoDegisti', delayMS: 100,
					args: $.extend({}, e, { sessionInfo: sessionInfo, wsResult: result }),
					block: _e => this.sessionInfoDegisti(_e)
				});
			});
			return lastAjaxObj
		}
		wsDBListe(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput, timeout: 3000,
				url: `${this.wsURLBase}dbListe/?${$.param(this.buildAjaxArgs(e))}`
			});
			return lastAjaxObj
		}
		wsLog(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput, timeout: 15000,
				url: `${this.wsURLBase}log/?${$.param(this.buildAjaxArgs(e))}`
			});
			return lastAjaxObj
		}
		wsGetCVMStatus(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				timeout: 15000, url: `${this.wsURLBase}getCVMStatus/?${$.param(this.buildAjaxArgs(e))}`
			});
			return lastAjaxObj
		}
		wsGetSubServices(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				timeout: 30000, url: `${this.wsURLBase}getSubServices/?${$.param(this.buildAjaxArgs(e))}`
			});
			return lastAjaxObj
		}
		wsReadSubServicesConfig(e) {
			lastAjaxObj = $.ajax({
				cache: true, type: 'POST', dataType: defaultOutput,
				timeout: 15000, url: `${this.wsURLBase}readSubServicesConfig/?${$.param(this.buildAjaxArgs(e))}`
			});
			return lastAjaxObj
		}
		wsUpdateSubServicesConfig(e) {
			const data = toJSONStr(e.config);
			delete e.config;
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', timeout: 15000, dataType: defaultOutput, contentType: `application/json; charset=utf-8`,
				url: `${this.wsURLBase}updateSubServicesConfig/?${$.param(this.buildAjaxArgs(e))}`,
				processData: false, data: data
			});
			return lastAjaxObj
		}
		wsRestart(e) {
			lastAjaxObj = $.ajax({
				cache: true, type: 'POST', dataType: defaultOutput,
				timeout: 10000, url: `${this.wsURLBase}restart/?${$.param(this.buildAjaxArgs(e))}`
			});
			return lastAjaxObj
		}
		wsCVMRestart(e) {
			lastAjaxObj = $.ajax({
				cache: true, type: 'POST', dataType: defaultOutput,
				timeout: 15000, url: `${this.wsURLBase}cvmRestart/?${$.param(this.buildAjaxArgs(e))}`
			});
			return lastAjaxObj
		}
		wsRunSubServices(e) {
			e = e || {};
			lastAjaxObj = $.ajax({
				cache: true, type: 'POST', dataType: defaultOutput,
				timeout: e.subService || e.subservices ? 500000 : 30000,
				url: `${this.wsURLBase}runSubServices/?${$.param(this.buildAjaxArgs(e))}`
			});
			return lastAjaxObj
		}
		wsStopSubServices(e) {
			lastAjaxObj = $.ajax({
				cache: true, type: 'POST', dataType: defaultOutput,
				timeout: 15000, url: `${this.wsURLBase}stopSubServices/?${$.param(this.buildAjaxArgs(e))}`
			});
			return lastAjaxObj
		}
		wsRestartSubServices(e) {
			lastAjaxObj = $.ajax({
				cache: true, type: 'POST', dataType: defaultOutput,
				timeout: e.subService || e.subservices ? 500000 : 30000,
				url: `${this.wsURLBase}restartSubServices/?${$.param(this.buildAjaxArgs(e))}`
			});
			return lastAjaxObj
		}
		wsConfigOku(e) {
			e = e || {};
			lastAjaxObj = $.ajax({
				cache: true, type: 'POST', dataType: defaultOutput,
				timeout: 10000, url: `${e.wsURLBase || this.wsURLBase/*.replace('/yonetim', '')*/}configOku/?${$.param(this.buildAjaxArgs(e))}`
			});
			return lastAjaxObj
		}
		wsConfigYaz(e) {
			e = e || {}; const {rootConfig} = e;
			if (rootConfig) {
				const keys = [
					'iconlib', 'object_layout', 'schema', 'show_errors', 'theme',
					'required_by_default', 'display_required_only', 'remove_empty_properties',
					'show_opt_in', 'no_additional_properties', 'ajax', 'disable_edit_json', 'disable_collapse',
					'disable_properties', 'disable_array_add', 'disable_array_reorder', 'disable_array_delete',
					'enable_array_copy', 'array_controls_top', 'disable_array_delete_all_rows', 'disable_array_delete_last_row'
				];
				for (const key of keys)
					delete rootConfig[key]
			}
			const data = toJSONStr(rootConfig);
			delete e.rootConfig;
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', timeout: 10000, dataType: defaultOutput, contentType: `application/json; charset=utf-8`,
				url: `${e.wsURLBase || this.wsURLBase/*.replace('/yonetim', '')*/}configYaz/?${$.param(this.buildAjaxArgs(e))}`,
				processData: false, data: data
			});
			return lastAjaxObj
		}
		wsReadVioConfigBasit(e) {
			lastAjaxObj = $.ajax({
				cache: true, type: 'POST', dataType: defaultOutput,
				timeout: 10000, url: `${this.wsURLBase}readVioConfigBasit/?${$.param(this.buildAjaxArgs(e))}`
			});
			return lastAjaxObj
		}
		wsReadVioConfig(e) {
			lastAjaxObj = $.ajax({
				cache: true, type: 'POST', dataType: defaultOutput,
				timeout: 10000, url: `${this.wsURLBase}readVioConfig/?${$.param(this.buildAjaxArgs(e))}`
			});
			return lastAjaxObj
		}
		wsWriteVioConfig(e) {
			const data = toJSONStr(e.config);
			delete e.config;
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', timeout: 10000, dataType: defaultOutput, contentType: `application/json; charset=utf-8`,
				url: `${this.wsURLBase}writeVioConfig/?${$.param(this.buildAjaxArgs(e))}`,
				processData: false, data: data
			});
			return lastAjaxObj
		}
		wsReadVioConfigRecs(e) {
			lastAjaxObj = $.ajax({
				cache: true, type: 'POST', dataType: defaultOutput,
				timeout: 10000,
				url: `${this.wsURLBase}readVioConfigRecs/?${$.param(this.buildAjaxArgs(e))}`
			});
			return lastAjaxObj
		}
		wsWriteVioConfigRecs(e) {
			const data = toJSONStr(e.config); delete e.config;
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', timeout: 10000, dataType: defaultOutput, contentType: `application/json; charset=utf-8`,
				url: `${this.wsURLBase}writeVioConfigRecs/?${$.param(this.buildAjaxArgs(e))}`,
				processData: false, data: data
			});
			return lastAjaxObj
		}
		wsVioGuncelle(e) {
			e = e || {}; const data = toJSONStr(e.args); delete e.args;
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', timeout: 120000, dataType: defaultOutput, contentType: `application/json; charset=utf-8`,
				url: `${this.wsURLBase}vioGuncelle/?${$.param(this.buildAjaxArgs(e))}`,
				processData: false, data: data
			});
			return lastAjaxObj
		}
		wsEMailSend(e) {
			e = e || {}; const data = toJSONStr(e.args); delete e.args;
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', timeout: 120000, dataType: defaultOutput, contentType: `application/json; charset=utf-8`,
				url: `${e.wsURLBase || this.wsURLBase.replace('/yonetim', '/eMail')}send/?${$.param(this.buildAjaxArgs(e))}`,
				processData: false, data: data
			});
			return lastAjaxObj
		}
		wsDownload(e) {
			e = e || {}; const data = toJSONStr(e.args); delete e.args;
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST',
				timeout: 1000000,
				contentType: `application/json; charset=utf-8`,
				url: `${this.wsURLBase}download/?${$.param(this.buildAjaxArgs(e))}`,
				processData: false, data: data
			});
			return lastAjaxObj;
		}
		wsDownloadURL(e) {
			e = e || {}; const data = toJSONStr(e.args); delete e.args;
			return `${this.wsURLBase}download/?${$.param(this.buildAjaxArgs(e))}`
		}
		wsUpload(e) {
			e = e || {}; const data = e.args; delete e.args;
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', timeout: 1000000, contentType: 'application/octet-stream; charset=utf-8',
				url: `${this.wsURLBase}upload/?${$.param(this.buildAjaxArgs(e))}`,
				processData: false, data
			});
			return lastAjaxObj
		}
		wsSqlExec(e) {
			e = e || {}; const data = toJSONStr(e.args); delete e.args;
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST',
				timeout: 30000, dataType: defaultOutput,
				contentType: `application/json; charset=utf-8`,
				url: `${this.wsURLBase}sqlExec/?${$.param(this.buildAjaxArgs(e))}`,
				processData: false, data: data
			});
			return lastAjaxObj
		}
		wsShell(e) {
			e = e || {}; const data = toJSONStr(e.args); delete e.args;
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', timeout: 60000, dataType: defaultOutput, contentType: `application/json; charset=utf-8`,
				url: `${this.wsURLBase}shell/?${$.param(this.buildAjaxArgs(e))}`,
				processData: false, data: data
			});
			return lastAjaxObj
		}
		wsCVMCall(e) {
			e = e || {}; const data = toJSONStr(e.args); delete e.args;
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', timeout: 30000, dataType: defaultOutput, contentType: `application/json; charset=utf-8`,
				url: `${this.wsURLBase}cvmCall/?${$.param(this.buildAjaxArgs(e))}`,
				processData: false, data: data
			});
			return lastAjaxObj
		}
		wsWebRequest(e) {
			e = e || {}; const data = toJSONStr(e.args); delete e.args;
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST',
				timeout: 60000, dataType: defaultOutput,
				contentType: `application/json; charset=utf-8`,
				url: `${this.wsURLBase}webRequest/?${$.param(this.buildAjaxArgs(e))}`,
				processData: false, data: data
			});
			return lastAjaxObj
		}
		wsVioMenuGorev(e) {
			e = e || {}; const data = toJSONStr(e.args); delete e.args;
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', timeout: 10000, dataType: defaultOutput, contentType: `application/json; charset=utf-8`,
				url: `${this.wsURLBase}vioMenuGorev/?${$.param(this.buildAjaxArgs(e))}`,
				processData: false, data: data
			});
			return lastAjaxObj
		}
		wsUzakDosyaIndirToLocalServer(e) {
			e = e || {}; const data = toJSONStr(e.args); delete e.args;
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', timeout: 300000, dataType: defaultOutput, contentType: `application/json; charset=utf-8`,
				url: `${this.wsURLBase.replace('/yonetim', '/skyBulutYedekleme')}uzakDosyaIndirToLocalServer/?${$.param(this.buildAjaxArgs(e))}`,
				processData: false, data: data
			});
			return lastAjaxObj
		}
		async wsConfigSchema(e) {
			let result = this._wsConfigSchema;
			if (!result)
				result = this._wsConfigSchema = await this.getWSConfigSchema(e)
			return result
		}

		getWSConfigSchema(e) {
			const properties_sql_basit = {
				server: { type: 'string', title: `SQL Ana Sistem`, description: `Belirtilmediği durumda VioMenü Varsayılanı kullanılır` },
				db: { type: 'string', e: `SQL Veritabanı` }
			};
			const properties_sql = $.extend({}, properties_sql_basit, {
				singleConn: { type: 'boolean', /* format: 'checkbox', */ default: false, title: `Tek SQL Bağlantısı kullanılsın` }
			});
			const properties_ekSql = {
				type: 'array', title: `Ek SQL Bağlantı Ayarları`, description: `Sadece gerekli durumlarda kullanılır`,
				items: {
					type: 'object',
					properties: {
						server: { type: 'string', title: `SQL Ana Sistem`, description: `Belirtilmediği durumda VioMenü Varsayılanı kullanılır` },
						db: { type: 'string', e: `SQL Veritabanı` }
					}
				}
			};
			const properties_sqlVeEkSql = $.extend({}, properties_sql, { ekSql: properties_ekSql });
			const item_sql = { type: 'object', title: `SQL Bağlantı Ayarları`, properties: properties_sql };
			const item_sqlVeEkSql = { type: 'object', title: `SQL Bağlantı Ayarları`, properties: properties_sqlVeEkSql };
			const item_disabled = { type: 'boolean', /* format: 'checkbox', */ default: false, title: `Modül Kullanım Dışıdır` };
			const item_resimAnaBolum = { type: 'string', title: 'Resim Ana Bölüm', description: 'Ürün Resimleri için Ana Bölüm Klasör Yolu.<br/>( Lütfen <code>c:/VioData/Resim</code> gibi yazınız )' };
			const item_resimExt = { type: 'string', title: 'Resim Dosya Uzantısı', description: '(Opsiyonel)' };
			const properties_skyCafe_ozelYaziciTanimlari_alt4 = { type: 'array', description: `Yazıcı İsimleri`, items: { type: 'string' } };
			const properties_skyCafe_ozelYaziciTanimlari_alt3 = {
				type: 'object', description: `Stok Ürün Grubu için Yazıcı İsimleri Tanımları`,
				properties: {
					'*': $.extend({}, properties_skyCafe_ozelYaziciTanimlari_alt4, { title: `-Hepsi-` }),
					'': properties_skyCafe_ozelYaziciTanimlari_alt4
				}
			};
			const item_skyCafe_ozelYaziciTanimlari_alt2 = {
				type: 'object', description: `Şube'ye ait Stok Ürün Grubu için Yazıcı İsimleri Tanımları`,
				properties: {
					'*': $.extend({}, properties_skyCafe_ozelYaziciTanimlari_alt3, { title: `-Hepsi-` }),
					'': $.extend({}, properties_skyCafe_ozelYaziciTanimlari_alt3, { title: `-Merkez Şube-` }),
					'01': properties_skyCafe_ozelYaziciTanimlari_alt3,
					'02': properties_skyCafe_ozelYaziciTanimlari_alt3,
					'03': properties_skyCafe_ozelYaziciTanimlari_alt3,
					'04': properties_skyCafe_ozelYaziciTanimlari_alt3,
					'05': properties_skyCafe_ozelYaziciTanimlari_alt3,
					'06': properties_skyCafe_ozelYaziciTanimlari_alt3,
					'07': properties_skyCafe_ozelYaziciTanimlari_alt3,
					'08': properties_skyCafe_ozelYaziciTanimlari_alt3,
					'SUB01': properties_skyCafe_ozelYaziciTanimlari_alt3,
					'SUB02': properties_skyCafe_ozelYaziciTanimlari_alt3,
					'SUB03': properties_skyCafe_ozelYaziciTanimlari_alt3,
					'SUB04': properties_skyCafe_ozelYaziciTanimlari_alt3,
					'SUB05': properties_skyCafe_ozelYaziciTanimlari_alt3,
					'SUB06': properties_skyCafe_ozelYaziciTanimlari_alt3,
					'SUB07': properties_skyCafe_ozelYaziciTanimlari_alt3,
					'SUB08': properties_skyCafe_ozelYaziciTanimlari_alt3
				}
			};
			const item_skyCafe_ozelYaziciTanimlari = {
				type: 'object', title: `Özel Yazıcı Tanımları`,
				description: `Masa/Fiş Tipi için Şube'ye ait Stok Ürün Grubu için Yazıcı İsimleri Tanımları`,
				properties: {
					'*': $.extend({}, item_skyCafe_ozelYaziciTanimlari_alt2, { title: '-Hepsi-' }),
					PRESTADS: $.extend({}, item_skyCafe_ozelYaziciTanimlari_alt2, { title: 'Adisyon' }),
					PRESTMTF: $.extend({}, item_skyCafe_ozelYaziciTanimlari_alt2, { title: 'Mutfak Fişi' }),
					PRESTPRA: $.extend({}, item_skyCafe_ozelYaziciTanimlari_alt2, { title: 'Pratik Satış' }),
					PRESTTAH: $.extend({}, item_skyCafe_ozelYaziciTanimlari_alt2, { title: 'Tahsilat Fişi' })
				}
			};
			const properties_b2b_modulAyarlari =  {
				quka: {
					type: 'object', title: 'Quka API Erişimi',
					properties: {
						apiKey: { type: 'string', title: 'Quka API Anahtarı' },
						apiSecret: { type: 'string', format: 'password', title: 'Quka API Şifresi' }
					}
				},
				payFlex: {
					type: 'object', title: 'PayFlex POS API Erişimi',
					properties: {
						dealerId: { type: 'string', title: 'Kullanıcı ID' },
						dealerPass: { type: 'string', format: 'password', title: 'Şifre' }
					}
				}
			};
			const handlerList = [
				'genel', 'waitSignal', 'yonetim', 'cariEFatSorgu', 'skyMES/hatIzleme', 'skyMES/makineDurum',
				'pdks', 'skyBulutYedekleme', 'b2b', 'b2b/fuhrer', 'b2b/atomedya', 'skyCafe/rest', 'skyCafe/pratik', /*'elterm',*/
				'vioProg', 'eIslemGonder', 'eIslemAkibetSorgula', 'gelenEIslemSorgula', 'eIslemArsivle', 'eMutabakat', 'sgk', 'skyERP', 'skyTablet',
				'vioGuncelle', 'vioMenuGorev', 'eMail', 'eMailQueue', 'appStart', 'shell', 'sqlExec', 'webRequest', 'hamachi', 'skyWS', 'hfs', 'frp', 'frps', 'vioPortal', 'skyTurmob'
			];
			const servisTipListe = Object.keys(this.servisTip2Aciklama);
			return {
				type: 'object', title: 'SkyWS Ayarlar', required: [ 'wsConfig', 'subServices' ],
				properties: {
					serverPort: { type: 'integer', default: 8200, title: `WebServis Port` },
					sslPort: { type: 'integer', /* default: 9200, */ title: `SSL Port`, description: `Sadece SSL kullanımı olacaksa belirtilmelidir. (<i>Varsayılan: <b>9200</b></i>)` },
					sslCertHash: { type: 'string', title: `SSL Sertifika Hash Değeri`, description: `Sadece SSL kullanımı olacaksa ve Özel bir Sertifika kullanılacaksa belirtilmelidir` },
					logFile: { type: 'string', default: `%PROGRAMDATA%/Vio/service/son/CSkyWSApp.son`, title: `WebServis Log Dosyası yolu` },
					log: {
						type: 'object', title: `WebServis Log Ayarları`,
						properties: {
							console: {
								type: 'object', title: `Konsol Ekranı`,
								properties: {
									level: {
										type: 'string', title: `Log Düzeyi`, default: 'normal',
										enum: ['off', 'user', 'normal', 'debug'],
										options: {
											enum: [
												{ title: 'Kapalı' },
												{ title: 'Kullanıcı' },
												{ title: 'Normal' },
												{ title: 'Teknik' }
											]
										}
									},
									output: {
										type: 'string', title: `Log Çıktı Türü`, default: 'text',
										enum: ['text', 'json'],
										options: {
											enum: [
												{ title: 'Düz Metin' },
												{ title: 'JSON Verisi' }
											]
										}
									},
									shortDisplay: { type: 'boolean', /* format: 'checkbox' */ default: false, title: `Kısa Gösterim (Daha Az Teknik Bilgi)` }
								}
							},
							file: {
								type: 'object', title: `Dosya`,
								properties: {
									level: {
										type: 'string', default: 'user', title: `Log Düzeyi`,
										enum: ['off', 'user', 'normal', 'debug'],
										options: {
											enum: [
												{ title: 'Kapalı' },
												{ title: 'Kullanıcı' },
												{ title: 'Normal' },
												{ title: 'Teknik' }
											]
										}
									},
									output: {
										type: 'string', default: 'json', title: `Log Çıktı Türü`,
										enum: ['text', 'json'],
										options: {
											enum: [
												{ title: 'Düz Metin' },
												{ title: 'JSON Verisi' }
											]
										}
									},
									shortDisplay: { type: 'boolean', /* format: 'checkbox' */ default: false, title: `Kısa Gösterim (Daha Az Teknik Bilgi)` }
								}
							}
						}
					},
					sqlSingleConn: { type: 'boolean', /* format: 'checkbox' */ default: false, title: `WebServis Geneli: Tek SQL Bağlantısı kullanılsın` },
					sql: item_sqlVeEkSql,
					maxWait: { type: 'number', default: 8, title: `WebServis Geneli: En Fazla Eşzamanlı Senkronizasyon Bekleme Sayısı` },
					noLogAPI: {
						type: 'array', uniqueItems: true, default: [],
						title: `WebServis Geneli: Sky Servisler için Log kaydı <u>ALINMAYACAK</u> API İsimleri`,
						description: `Bu seçenek belirtilirse sadece listedeki API'ler için Log Kaydı <u>TUTULMAZ</u> aksinde <u>Varsayılan API Hariç Listesi</u> geçerli olur`,
						items: { type: 'string' }
					},
					serverIP: {
						type: 'array',
						uniqueItems: true,
						default: [],
						title: `WebServis Geneli: Sky Servisler için Ana Makine Kısıtlaması`,
						description: `Bu seçenek belirtilirse sadece listedeki IP Adresi veya Makine Adı ile eşleşen bilgisayarlarda Sky Servislerin çalışmasına izin verilecek`,
						items: { type: 'string' }
					},
					remoteCommandServer: {
						type: 'string',
						title: `WebServis Geneli: Sky Servisler için Uzaktan Komut Çalıştırma Ana Makinesi`,
						description: `[ Uzak Komut ] olarak işaretli komutları buraya yazılan ana sistemden alır. [ http://SERVER:8200, https://SERVER:9200, SERVER:9200, SERVER ] biçimlerinde yazılabilir`
					},
					handlerList: {
						type: 'array', /* format: 'checkbox', uniqueItems: true */ title: `WebServis Geneli: Kullanılabilir WebServis Modül Listesi`,
						default: [], items: { type: 'string', enum: handlerList }
					},
					plugins: {
						type: 'array', title: `SkyWS C# Modül Eklentileri`,
						items: {
							type: 'object',
							properties: {
								file: { type: 'string', title: `C# Modül DLL Dosyası` },
								name: { type: 'string', title: `C# Modül Assembly İsmi` }
							}
						}
					},
					subServices: {
						type: 'array', title: `Sky Hizmet Tanımları`,
						items: { type: 'object',
							required: ['tip', 'id'],
							properties: {
								tip: { type: 'string', enum: servisTipListe },
								id: { type: 'string', title: `Hizmet Belirteci`, description: `Boş bırakılırsa otomatik üretilir` },
								aciklama: { type: 'string', title: `Servis Adı`, description: `Opsiyonel` },
								dosya: { type: 'string', title: `Başlatılacak Uygulama Yolu`, description: `Opsiyonel - 'Uygulama' tipi görevler için geçerlidir` },
								args: { type: 'string', title: `Ek Parametreler`, description: `Opsiyonel` },
								workingDirectory: { type: 'string', title: `Uygulama Çalışma Dizini`, description: `Opsiyonel` },
								shellExecute: { type: 'boolean', title: `Shell Execute`, description: `Opsiyonel - 'Uygulama' tipi görevler için DOS Komuu gibi çalışıp çalışmayacağını belirtir` },
								server: { type: 'string', title: `SQL Ana Sistem`, description: `Belirtilmediği durumda VioMenü Varsayılanı kullanılır` },
								db: { type: 'string', title: `SQL Veritabanı`, description: `Servis için kullanılacak Veritabanı` },
								user: { type: 'string', title: `VIO Kullanıcısı`, description: `Servis için kullanılacak VIO Kullanıcısı. Belirtilmediği durumda bir tane ANA KULLANICI otomatik olarak seçilir` },
								pass: { type: 'string', title: `VIO Şifresi`, description: `Servis için kullanılacak VIO Kullanıcı Şifresi. Belirtilmediği durumda VIO Kullanıcısı'na ait şifre otomatik belirlenir` },
								temp: { type: 'boolean', title: `Geçici Servis`, description: `Sadece bir kere çalışır` },
								/*remote: { type: 'boolean', title: `Uzaktan Atanan Servis işareti` },*/
								gorev: {
									type: 'object', title: `Zamanlanmış Görev Tanımı`, required: ['zamanlama', 'id'],
									properties: {
										zamanlama: { type: 'string', default: 'gunluk', enum: ['gunluk', 'dakikalik'] },
										id: { type: 'string', title: `Görev Belirteci` }
									}
								}
							}
						}
					},
					wsConfig: {
						type: 'object', title: `WebServis Modül Ayarları`,
						properties: {
							genel: {
								type: 'object', title: 'Genel',
								properties: {
									sql: item_sqlVeEkSql,
									config: { type: 'object', title: 'Modül Ayarları', properties: { resimAnaBolum: item_resimAnaBolum, resimExt: item_resimExt } },
									disabled: item_disabled
								}
							},
							waitSignal: {
								type: 'object', title: `Bekleme-Sinyal Yapısı`,
								properties: {
									monitors: { type: 'object', title: `Dosya Değişiklik İzleme ve Senkronizasyon Tanımları`, items: { type: 'object' } },
									disabled: item_disabled
								}
							},
							yonetim: {
								type: 'object', title: `Yönetimsel İşlemler`,
								properties: {
									users: {
										type: 'array', title: `Kullanıcı Tanımları`,
										items: {
											type: 'object', title: `Kullanıcı`, required: [ 'user' ],
											properties: {
												user: { type: 'string', title: `Kullanıcı Kodu` },
												userDesc: { type: 'string', title: `Kullanıcı İsmi` },
												pass: { type: 'string', format: 'password', title: `Şifre` },
												yetki: { type: 'string', title: `Yetki`, default: 'restricted', enum: Object.keys(SkyConfigYetki.yetkiler) },
												eMails: {
													type: 'array', title: `SSO e-Mail Adresleri`, description: 'Tek Seferlik Oturum Açma şifresdinin gönderileceği e-Mail Adres(ler)i',
													items: { type: 'string', title: `e-Mail` }
												},
												apiAccess: {
													type: 'array',
													title: `API Erişim Yetki Kısıtlamaları`,
													items: { type: 'string' }
												}
											}
										}
									},
									sql: item_sql, disabled: item_disabled
								}
							},
							cariEFatSorgu: {
								type: 'object', title: `Cari e-Fatura Mükellef Sorgusu`,
								properties: {
									sql: item_sqlVeEkSql,
									config: {
										type: 'object', title: 'Modül Ayarları',
										properties: {
											cache: { type: 'boolean', /* format: 'checkbox' */ title: `İndirme Önbelleği kullanılır` },
											noHash: {
												type: 'boolean', /* format: 'checkbox' */ title: `Mükellef Listesi Değişiklik Kontrol Yapılmaz`,
												description: `** İşaretlenirse: İndirilen Mükellef Listesi önceki ile aynı olsa bile VIO tarafı tablo güncellemeleri yapılır`
											},
											noRedownload: {
												type: 'boolean', /* format: 'checkbox' */ title: `Mükellef Listesi yeniden indirilmez`,
												description: `** Sadece test amaçlı kullanılmalıdır`
											},
											noAutoReset: {
												type: 'boolean', /* format: 'checkbox' */ title: `Geçici e-Fata Tabi Liste Tablosunu SİLME`,
												description: `SkyWS Görev ile yapılan sorgulamada Geçici e-Fata Tabi Liste tablo içeriği silinmez. Sadece e-Faturaya geçen mükellefler sorgulanabilir, e-Faturadan çıkanlar sorgulanmamış olur`
											},
											gibAlias2Donusum: { type: 'object', title: 'GIB Alias için Dönüşüm', items: { type: 'object' } }
										}
									},
									disabled: item_disabled
								}
							},
							'skyMES/hatIzleme': {
								type: 'object', title: `Sky MES: Hat İzleme`,
								properties: { sql: item_sql, config: { type: 'object', title: 'Modül Ayarları' }, disabled: item_disabled }
							},
							'skyMES/makineDurum': {
								type: 'object', title: `Sky MES: Tekil Makine Durum`,
								properties: { sql: item_sql, config: { type: 'object', title: 'Modül Ayarları' }, disabled: item_disabled }
							},
							'skyCafe/rest': {
								type: 'object', title: `Sky Cafe: Restoran`,
								properties: {
									sql: item_sql,
									config: { type: 'object', title: 'Modül Ayarları', properties: { ozelYaziciTanimlari: item_skyCafe_ozelYaziciTanimlari } },
									disabled: item_disabled
								}
							},
							'skyCafe/pratik': {
								type: 'object', title: `Sky Cafe: Pratik Satış`,
								properties: {
									sql: item_sql,
									config: { type: 'object', title: 'Modül Ayarları', properties: { ozelYaziciTanimlari: item_skyCafe_ozelYaziciTanimlari } },
									disabled: item_disabled
								}
							},
							b2b: {
								type: 'object', title: 'B2B İşlemleri',
								properties: {
									sql: item_sql,
									config: { type: 'object', title: 'Modül Ayarları', properties: properties_b2b_modulAyarlari },
									disabled: item_disabled }
							},
							'b2b/fuhrer': {
								type: 'object', title: 'B2B İşlemleri: Führer',
								properties: {
									sql: item_sql,
									config: { type: 'object', title: 'Modül Ayarları', properties: properties_b2b_modulAyarlari },
									disabled: item_disabled }
							},
							'b2b/atomedya': {
								type: 'object', title: 'B2B İşlemleri: Atomedya',
								properties: {
									sql: item_sql,
									config: { type: 'object', title: 'Modül Ayarları', properties: properties_b2b_modulAyarlari },
									disabled: item_disabled }
							},
							pdks: {
								type: 'object', title: `PDKS İşlemleri`,
								properties: {
									sql: item_sql, cihazKod: { type: 'string', title: `Cihaz Kodu` },
									odbcAdi: { type: 'string', title: 'ZKTime Programı Veritabanı Erişimi için ODBC Adı'},
									wsIP: { type: 'string', title: `PDKS Cihazı Webservis IP Adresi` }, wsPort: { type: 'number', title: `PDKS Cihazı Webservis Port` },
									user: { type: 'string', title: `PDKS Cihazı Kullanıcı Kodu` }, pass: { type: 'string', format: 'password', title: `PDKS Cihazı Kullanıcı Şifresi` },
									maxWait: { type: 'string', format: 'number', title: `PDKS Cihazına Bağlantı Zaman Aşımı (saniye)` }, disabled: item_disabled
								}
							},
							skyBulutYedekleme: {
								type: 'object', title: `Sky Bulut Yedekleme`,
								properties: {
									sql: item_sqlVeEkSql,
									userID: { type: 'string', title: `Kullanıcı ID` }, userPass: { type: 'string', format: 'password', title: `Kullanıcı Şİfresi` },
									backupServer: { type: 'string', title: `Yedekleme Sunucusu IP`, description: `Varsayılan Skylog Sunucusu kullanımı için boş bırakınız` },
									sqlBackupDir: { type: 'string', title: `SQL Yedek Dizini`, description: `Varsayılan Yedek Dizini kullanımı için boş bırakınız` },
									filePatterns: {
										type: 'array', title: `Dosya Desenleri`, items: { type: 'string' },
										description: `Yedekleme için bulunacak dosya desenleri. Dosya deseni <code>C:/VioData/EFatura/IMZALI/*.zip</code> gibi belirtilir`,
									},
									serverStorageDir: {
										type: 'string', title: `Yedekleme Sunucusu: Veri Depolama Ana Dizini`,
										description: `Sadece Yedekleme Sunucusu olarak kullanılacak sunucu için bu alan geçerlidir. Varsayılan Veri Depolama AnaDizini kullanımı için boş bırakınız`
									},
									users: {
										type: 'array', title: `Kullanıcı Tanımları`,
										items: {
											type: 'object', title: `Kullanıcı`, required: ['user'],
											properties: {
												user: { type: 'string', title: `Kullanıcı Kodu` },
												userDesc: { type: 'string', title: `Kullanıcı İsmi` },
												pass: { type: 'string', format: 'password', title: `Şifre` },
												kota: { type: 'number', title: `Kota Sınırı (MB)` },
												yetki: { type: 'string', title: `Yetki`, default: 'user', enum: Object.keys(SkyConfigYetki.yetkiler) }
											}
										}
									},
									disabled: item_disabled
								}
							},
							vioProg: { type: 'object', title: `VIO Program Servisi`, properties: { sql: item_sql, disabled: item_disabled } },
							eIslemGonder: { type: 'object', title: `e-İşlem Gönder`, properties: { sql: item_sql, disabled: item_disabled } },
							eIslemAkibetSorgula: { type: 'object', title: `e-İşlem Akıbet Sorgula`, properties: { sql: item_sql, disabled: item_disabled } },
							gelenEIslemSorgula: { type: 'object', title: `Gelen e-İşlem Sorgula`, properties: { sql: item_sql, disabled: item_disabled } },
							eIslemArsivle: {
								type: 'object', title: `e-İşlem Dosyalarını Arşivle`,
								properties: {
									sql: item_sqlVeEkSql,
									srcDir: { type: 'string', title: `Kaynak Dizin`, description: `Opsiyonel` },
									destDir: { type: 'string', title: `Hedef Dizin`, description: `Opsiyonel` },
									disabled: item_disabled
								}
							},
							eMutabakat: {
								type: 'object', title: `e-Mutabakat`,
								properties: {
									sql: item_sqlVeEkSql,
									anaBolum: { type: 'string', title: `Ana Bölüm`, description: `Opsiyonel` },
									disabled: item_disabled
								}
							},
							sgk: {
								type: 'object',
								title: `SGK Emeklilik Sorgu`,
								properties: {
									sql: item_sqlVeEkSql,
									config: {
										type: 'object', title: 'Modül Ayarları',
										properties: {
											timeout: { type: 'integer', title: `SGK WebBrowser İşlemi Zaman Aşımı (ms)` },
											captcha: {
												type: 'object', title: `Captcha Kodu Pozisyon ve Boyut`,
												properties: { x: { type: 'number' }, y: { type: 'number' }, width: { type: 'number' }, height: { type: 'number' } }
											}
										}
									},
									sgkUsers: {
										type: 'object', title: `İşyeri Kodu için SGK Kullanıcı Bilgisi`,
										items: {
											type: 'object',
											properties: {
												user: { type: 'string', title: `Kullanıcı` },
												isyeriKod: { type: 'string', title: `SGK İşyeri Kodu` },
												pass: { type: 'string', format: 'password', title: `SGK Şifre` },
												isyeriSifre: { type: 'string', format: 'password', title: `İşyeri Şifre` }
											}
										}
									},
									disabled: item_disabled
								}
							},
							skyERP: { type: 'object', title: `Sky ERP`, properties: { sql: item_sql, disabled: item_disabled } },
							skyTablet: {
								type: 'object', title: `Sky Tablet`,
								properties: {
									sql: item_sql,
									config: { type: 'object', title: 'Modül Ayarları', properties: { resimAnaBolum: item_resimAnaBolum, resimExt: item_resimExt } },
									disabled: item_disabled }
							},
							vioPortal: { type: 'object', title: `VIO Portal`, properties: { sql: item_sql, disabled: item_disabled } }
						}
					},
					map: {
						type: 'object', title: `İstek Yönlendirmesi`,
						items: {
							type: 'object', defaultProperties: ['file'],
							properties: {
								file: { type: 'string', title: `Dosya` },
								data: { type: 'string', title: `Veri` },
								type: { type: 'string', title: `MIME Type`, description: 'Web İçerik Türü' }
							}
						}
					}
				}
			}
		}

		sifreDegistirIstendi(e) {
			const {sessionInfo} = sky.config, {user} = sessionInfo, pass = sessionInfo.pass || sessionInfo.passMD5;
			const part = new SkyConfigSifreDegistirPart({
				pass: pass,
				tamamIslemi: async _e => {
					const rootConfig = ((await this.wsConfigOku()) || {}).rootConfig || {};
					const wsConfig_root = rootConfig.wsConfig = rootConfig.wsConfig || {};
					const wsConfig = wsConfig_root.yonetim = wsConfig_root.yonetim || {};
					const users = wsConfig.users = wsConfig.users || [], rec = users.find(rec => rec.user == user);
					if (!rec)
						throw { isError: true, rc: 'noRecordMatch', errorText: `<b>${user}</b> kodlu Kullanıcı için tanım belirlenemedi` };
					rec.pass = _e.pass;
					this.wsConfigYaz({ rootConfig: rootConfig }).then(() =>
						this.tazele())
				}
			});
			part.open();
			return part
		}
		async menuItemTiklandi(e) {
			const {id} = e;
			if (!id)
				return
			const {nav} = this;
			const cssClass = `selected`;
			const items = nav.jqxMenu('items');
			let item = null;
			for (const i in items) {
				const _item = items[i];
				if (_item.id == id) {
					item = _item;
					continue
				}
				const classList = _item.element ? _item.element.classList : null;
				if (classList && classList.contains(cssClass))
					classList.remove(cssClass)
			}
			const elm = item ? item.element : null;
			if (elm)
				elm.classList.add(cssClass)
			const partClass = elm ? window[elm.getAttribute('data-partclass')] : null;
			const partName = elm ? elm.getAttribute('data-partname') : null;
			await this.activateInnerPart({ subContent: this.subContent, partClass, partName: partName || (partClass || {}).partName, args: null })
		}

		ayarlarIstendi(e) {
			SkyConfigParamPart.run({ parentPart: this })
		}

		sessionInfoDegisti(e) {
			e = e || {};
			let degistimi = false;
			const {sessionInfo} = sky.config;
			if (sessionInfo && !sessionInfo.yetki)
				sessionInfo.yetki = 'restricted'
			let {gelismisModDisabledFlag} = this; const {chkGelismis} = this;
			if (!gelismisModDisabledFlag && !SkyConfigYetki.yetkilimi({ yetki: 'admin_readOnly' })) {
				gelismisModDisabledFlag = this.gelismisModDisabledFlag = true;
				this.gelismisModmu = false
			}
			chkGelismis[0].disabled = gelismisModDisabledFlag;
			if (gelismisModDisabledFlag && chkGelismis.is(':checked'))
				chkGelismis.prop('checked', false)
			this.gelismisModFlagDegistiBasit(e)
		}
		gelismisModFlagDegisti(e) { this.gelismisModFlagDegistiBasit(e); this.tazele() }
		gelismisModFlagDegistiBasit(e) {
			const {layout, nav, gelismisModmu, gelismisModDisabledFlag} = this, yetkilimi_developer = this.programcimi && SkyConfigYetki.yetkilimi({ yetki: 'developer' });
			const yetkilimi_admin_readOnly = SkyConfigYetki.yetkilimi({ yetki: 'admin_readOnly' }), yetkilimi_admin = SkyConfigYetki.yetkilimi({ yetki: 'admin' });
			delete this._servisTip2Aciklama; if (layout?.length) {
				layout.find(`.gelismis`)[gelismisModmu ? 'removeClass' : 'addClass']('jqx-hidden');
				layout.find(`*[data-gelismis]`)[gelismisModmu ? 'removeClass' : 'addClass']('jqx-hidden')
			}
			if (nav && nav.length) {
				nav.find(`ul > li#conf`)[yetkilimi_admin_readOnly ? 'removeClass' : 'addClass']('jqx-hidden');
				nav.find(`ul > li#users`)[yetkilimi_admin_readOnly ? 'removeClass' : 'addClass']('jqx-hidden');
				nav.find(`ul > li#gelismis`)[yetkilimi_admin_readOnly && gelismisModmu && !gelismisModDisabledFlag ? 'removeClass' : 'addClass']('jqx-hidden')
			}
			const gelismis_devTabs = ['sqlExec', 'shell', 'cvmCall', 'appStart'];
			for (const i in gelismis_devTabs) {
				const id = gelismis_devTabs[i], tab = layout.find(`.panel .tabs li#${id}`);
				if (tab?.length) { tab[gelismisModmu && !gelismisModDisabledFlag && yetkilimi_developer ? 'removeClass' : 'addClass']('jqx-hidden') }
			}
			const tab_sgk = layout.find(`.panel .tabs li#sgk`); if (tab_sgk && tab_sgk.length) { tab_sgk[gelismisModmu ? 'removeClass' : 'addClass']('jqx-hidden') }
			delete SkyConfigYetki._yetki2EkBilgi
		}
	}
})()
