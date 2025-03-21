(function() {
	window.LoginExtension = class extends window.PartExtension {
		constructor(e) {
			super(e);
		}

		get isLoginRequired() { return this.options.isLoginRequired == true }
		get loginUIClass() { return this.options.loginUIClass || window.LoginUI }
		get loginUI_content() { return this.options.loginUI_content }
		get loginUI_layout() { return this.options.loginUI_layout }

		get hasSession() {
			const sessionInfo = sky.config.sessionInfo;
			return sessionInfo && sessionInfo.hasSession;
		}
		get defaultLoginTypes() {
			return [
				{ kod: 'login', aciklama: 'VIO Kullanıcısı' }
			]
		}
		get loginTypes() {
			return this.options.loginTypes || this.defaultLoginTypes;
		}

		async ilkIslemler(e) {
			await super.ilkIslemler(e);

			if (this.isLoginRequired)
				return await this.loginIslemi(e);
		}

		async loginIslemi(e) {
			['layout'].forEach(key => {
				const layout = sky.app[key];
				if (layout && layout.length)
					layout.addClass(`jqx-hidden`);
			});

			let {sessionInfo} = sky.config;
			let hasSessionOrUser = sessionInfo && sessionInfo.hasSessionOrUser;
			
			/*let tamamIslemi = e.tamamIslemi || e.ilkIslemlerSonrasi;
			let tamamIslemiCalistiFlag = false;
			if (tamamIslemi == undefined || tamamIslemi == false) {
				tamamIslemi = e.tamamIslemi = e => {
					tamamIslemiCalistiFlag = true;
					sky.run(e);
				};
			}*/

			//if (sky.app && !hasSessionOrUser && $.isFunction(tamamIslemi))
			//	await sky.app.destroyPart();
			
			let result;
			try { result = await this.checkLoginCookies() }
			catch (ex) { result = await this.login(e) }

			sessionInfo = sky.config.sessionInfo;
			/*if (sessionInfo && sessionInfo.hasSessionOrUser)
				await this.wsGetUserInfo({ sessionInfo: sessionInfo });*/

			const {app} = sky;
			const {activePart} = app;
			for (const key of ['layout']) {
				const layout = app[key];
				if (layout && layout.length && (!activePart || activePart == app))
					layout.removeClass(`jqx-hidden`)
			}
			
			return result;
		}

		async checkLoginCookies() {
			let {sessionInfo} = sky.config;
			if (!(sessionInfo && sessionInfo.hasSessionOrUser)) {
				let value = Utils.cookie('autoLoginInfo');
				if (value) {
					try { value = JSON.parse(value) }
					catch (ex) { console.error(ex); throw ex }
				}
				sessionInfo = value ? new SessionInfo(value) : null;
			}
			if (!(sessionInfo && sessionInfo.hasSessionOrUser))
				throw { isError: true, rc: 'notLoggedIn', errorText: 'Oturum yok' };
			
			// await showProgress(`Oturum açılıyor...`, null, 1000);
			try {
				return await this.loginDevam({ sessionInfo })
			}
			finally {
				// await sky.app.knobProgressHideWithReset({ delayMS: 1 });
				await hideProgress();
				// displayServerResponse(ex, 'error');
			}
		}

		async setLoginCookies(e) {
			e = e || {};
			let _sessionInfo = e.sessionInfo;
			if (_sessionInfo && $.isPlainObject(_sessionInfo))
				_sessionInfo = new SessionInfo(_sessionInfo);
			
			if (!(_sessionInfo && _sessionInfo.hasSessionOrUser))
				_sessionInfo = null;
			
			let value = _sessionInfo ? toJSONStr(_sessionInfo) : null;
			Utils.cookie('autoLoginInfo', value);

			return value;
		}

		async login(e) {
			e = e || {};
			const sessionInfo = e.sessionInfo || sky.config.sessionInfo;
			if (sessionInfo && sessionInfo.hasSessionOrUser) {
				e.sessionInfo = $.isPlainObject(sessionInfo) ? new SessionInfo(sessionInfo) : sessionInfo;
				try {
					return await this.loginDevam(e)
				}
				catch (ex) {
					// sky.app.knobProgressHideWithReset({ delayMS: 1 });
					hideProgress();
					displayServerResponse(ex, 'error')
				}
			}
			
			const {loginUIClass} = this;
			if (!loginUIClass)
				throw { isError: true, rc: 'classNotFound', errorText: 'Oturum Açma Ekranı belirsiz' }
			
			let {loginUI} = this;
			if (loginUI)
				await this.closeLoginUI()
			
			const savedTamamIslemi = e.tamamIslemi || e.ilkIslemlerSonrasi;
			await new Promise(async resolve => {
				const part = loginUI = this.loginUI = new loginUIClass({
					app: this.app, content: e.content || this.loginUI_content, layout: e.layout || this.loginUI_layout,
					tamamIslemi: _e =>
						resolve(_e)
				});
				let result = await part.run($.extend({}, e));
				await this.initLoginUI($.extend({}, e, { loginUI: part }));
				await part.afterRun(e)
			});
			// return result;
		}

		async initLoginUI(e) {
		}

		async loginDevam(e) {
			e = e || {};
			let {sessionInfo} = sky.config;
			try {
				const _sessionInfo = e.sessionInfo || {};
				const result = await this.wsLogin(e);
				$.extend(sessionInfo, {
					sessionID: result.sessionID,
					loginTipi: _sessionInfo.loginTipi || sessionInfo.loginTipi,
					user: result.user || result.sessionObjectKod || _sessionInfo.user || sessionInfo.user,
					pass: result.pass || _sessionInfo.pass || sessionInfo.pass,
					userDesc: result.userDesc || result.sessionObjectAciklama,
					ozelTip: $.extend(sessionInfo.ozelTip || {}, {
						kod: result.ozelTipKod || '', aciklama: result.ozelTipAdi || ''
					}),
					isAdmin: result.sessionObjectAdminmi,
					// yetki: result.yetki,
					yetki: result.yetki || 'admin',
					subeKod: result.subeKod,
					dbName: result.dbName,
					firmaKisaUnvan: result.firmaKisaUnvan,
					digerSubeleriGorebilirmi: result.digerSubeleriGorebilirmi,
					hasSSO: result.hasSSO,
					isSSO: result.isSSO
				});
				sky.config.updateAjaxWSDefs(e);

				sessionInfo = sky.config.sessionInfo;
				e.result = result;

				if (e.saveLoginFlag)
					await this.setLoginCookies({ sessionInfo: sessionInfo })
				
				for (const key of ['layout']) {
					const layout = sky.app[key];
					if (layout && layout.length)
						layout.removeClass(`jqx-hidden`)
				}
				
				return result;
			}
			catch (ex) {
				throw ex
			}
		}

		async ssoLoginIslemi(e) {
			e = e || {};
			const {app} = sky;
			let {sessionInfo} = sky.config;
			const {login} = this;
			try {
				const _sessionInfo = e.sessionInfo || {};
				let loginSelector = _sessionInfo.loginTipi || _sessionInfo.sessionMatch;
				if (!loginSelector || loginSelector == true)
					loginSelector = 'login'
				const wsArgs = { user: _sessionInfo.user, ssoRequest: true };
				lastAjaxObj = $.post({
					async: true, cache: false,
					url: `${(app || sky.config).wsURLBase}${loginSelector}/`,
					data: wsArgs, timeout: app.programcimi ? 10000 : 30000
				});
				let result = await lastAjaxObj;
				if (!(result && result.sessionID))
					throw this.error_invalidCredentials;

				const {ssoEMails} = result;
				const eMailsStr = ssoEMails.join('; ')
				let wndContent = $(
					`<div class="ssoLoginWindow" style="padding: 13px;">` +
						`<div><label for="ssoPass">Lütfen ${eMailsStr} e-mail ${eMailsStr.length > 1 ? 'adreslerine' : 'adresine'} gönderilen Tek Kullanımlık şifreyi giriniz:</div>` +
						`<div><input id="ssoPass" name="ssoPass" type="number" maxlength="6" style="font-size: 230%; font-weight: bold; text-align: center; color: forestgreen; width: 98%; height: 50px;"></input></div>` +
					`</div>`
				);
				let promise = new $.Deferred();
				let wnd = createJQXWindow(
					wndContent, 'Tek Kullanımlık Şifre ile Giriş', {
						isModal: true, showCloseButton: false, showCollapseButton: true,
						position: 'center',
						width: 500,
						height: 320,
					},
					{
						'TAMAM': async (dlgUI, btnUI) => {
							setButonEnabled(btnUI, false);
							setTimeout(() => setButonEnabled(btnUI, true), 1000);
							const _ssoPass =  (dlgUI.find('.jqx-window-content #ssoPass').val() || '').toString() || '';
							if (!_ssoPass) {
								displayMessage(`Lütfen Tek Kullanımlık Şifreyi giriniz`, `! Şifre Girişi !`);
								return;
							}
							promise.resolve({ ssoPass: _ssoPass });
							dlgUI.jqxWindow('close')
						},
						'VAZGEÇ': (dlgUI, btnUI) =>
							dlgUI.jqxWindow('close')
					}
				);
				wnd.on('close', () =>
					promise.reject({ isError: true, rc: 'userAbort' }));
				setTimeout(() => wnd.find('.jqx-window-content #ssoPass').focus(), 100);

				result = await promise;
				const {ssoPass} = result;

				delete wsArgs.ssoRequest;
				wsArgs.sso = ssoPass;
				lastAjaxObj = $.post({
					async: true, cache: false,
					url: `${(app || sky.config).wsURLBase}${loginSelector}/`,
					data: wsArgs,
					timeout: app.programcimi ? 10000 : 30000
				});
				result = await lastAjaxObj;
				if (!(result && result.sessionID))
					throw this.error_invalidCredentials;

				_sessionInfo.sessionID = result.sessionID;
				_sessionInfo.isSSO = true;
				return this.loginDevam({ sessionInfo: _sessionInfo })
				
			}
			catch (ex) {
				throw ex
			}
		}

		async logout(e) {
			e = e || {};
			let result;
			try {
				result = await this.wsLogout(e)
			}
			catch (ex) {
				result = ex.responseJSON || ex;
				if (!(result && (result.rc == 'noSession' || result.rc == 'notLoggedIn')))
					throw ex;
			}
			
			const sessionInfo = sky.config.sessionInfo;
			delete sessionInfo.sessionID;
			delete sessionInfo.user;
			sky.config.updateAjaxWSDefs(e);

			//if (e.saveLoginFlag)
			await this.setLoginCookies({ sessionInfo: null });

			return result;
		}

		async closeLoginUI(e) {
			e = e || {};
			let loginUI = e.loginUI || this.loginUI;
			if (loginUI)
				await loginUI.closeUI(e);
		}
		
		async wsLogin(e) {
			e = e || {};
			const {app} = sky;
			const {sessionInfo} = e;
			if (!(sessionInfo && sessionInfo.hasSessionOrUser))
				throw this.error_invalidCredentials;
			
			if (sky.config.test) {
				return {
					isError: false,
					loginTipi: sessionInfo.loginTipi,
					user: sessionInfo.user,
					pass: sessionInfo.pass,
					userDesc: 'FAKE LOGIN',
					sessionID: (sessionInfo.sessionID || true),
					ozelTipKod: '',
					ozelTipAdi: ''
				}
			}

			let loginSelector = sessionInfo.loginTipi || sessionInfo.sessionMatch;
			if (!loginSelector || loginSelector == true)
				loginSelector = 'login';
			
			const wsArgs = {};
			if (sessionInfo.sessionID) {
				wsArgs.sessionID = sessionInfo.sessionID;
			}
			else {
				for (const key of SessionInfo.SabitAttrListe) {
					const value = sessionInfo[key];
					if (value)
						wsArgs[key] = value;
				}
				
				if (!loginSelector || loginSelector == 'login') {
					const {loginTypes} = this;
					if (!$.isEmptyObject(loginTypes)) {
						let bulundumu = false;
						for (const i in loginTypes) {
							const _loginTipi = (loginTypes[i] || {}).kod;
							if (!bulundumu && loginSelector == _loginTipi) {
								bulundumu = true;
								break;
							}
						}
						if (!bulundumu)
							loginSelector = loginTypes[0].kod;
					}
				}
	
				for (const key of ['loginTipi', 'sessionMatch'])
					delete wsArgs[key];
				if (loginSelector)
					wsArgs['sessionMatch'] = loginSelector;
			}

			lastAjaxObj = $.post({
				async: true, cache: false,
				url: `${(app || sky.config).wsURLBase}${loginSelector}/`,
				data: wsArgs.sessionMatch || wsArgs.loginTipi ? this.buildAjaxArgs(wsArgs) : wsArgs,
				timeout: app.programcimi ? 4000 : 8000
			});
			let result = await lastAjaxObj;
			if (!(result && result.sessionID))
				throw this.error_invalidCredentials;
			
			lastAjaxObj = $.get({
				async: true, cache: true,
				url: `${(app || sky.config).wsURLBase}getSessionInfo/`,
				data: wsArgs.sessionMatch || wsArgs.loginTipi ? this.buildAjaxArgs(wsArgs) : wsArgs,
				timeout: app.programcimi ? 1000 : 8000
			});
			result = await lastAjaxObj;
			/*if (!(result && result.hasSession))
				throw { isError: true, rc: 'notLoggedIn', errorText: 'Oturum açılamadı' };*/

			if (sessionInfo.isSSO)
				result.isSSO = true;

			return result;
		}

		async wsLogout(e) {
			e = e || {};
			const {app} = sky;
			const sessionInfo =  e.sessionInfo || sky.config.sessionInfo;
			if (!(sessionInfo && sessionInfo.hasSessionOrUser))
				throw { isError: true, rc: 'noSession', errorText: 'Oturum yok' };
			
			if (sky.config.test) {
				return { isError: false, sessionID: sessionInfo.sessionID || 'FAKE_SESSION_ID' };
			}

			const wsArgs = {};
			if (sessionInfo.hasSession) {
				wsArgs.sessionID = sessionInfo.sessionID;
			}
			else {
				for (const key of SessionInfo.SabitAttrListe) {
					const value = sessionInfo[key];
					if (value)
						wsArgs[key] = value;
				}
				if (wsArgs.loginTipi) {
					wsArgs.sessionMatch = wsArgs.loginTipi;
					delete wsArgs.loginTipi;
				}
			}
			/*if (sessionInfo.hasSession) {
				wsArgs.sessionID = sessionInfo.sessionID;
			}
			else {
				SessionInfo.SabitAttrListe.forEach(key => {
					const value = sessionInfo[key];
					if (value)
						wsArgs[key] = value;
				});
				if (wsArgs.loginTipi) {
					wsArgs.sessionMatch = wsArgs.loginTipi;
					delete wsArgs.loginTipi;
				}
			}*/
			
			lastAjaxObj = $.get({
				async: true, cache: true,
				url: `${(app || sky.config).wsURLBase}logout/`,
				data: this.buildAjaxArgs(wsArgs),
				timeout: app.programcimi ? 1000 : 3000
			});

			return await lastAjaxObj;
		}

		async wsGetUserInfo(e) {
			e = e || {};
			const {app} = sky;
			const sessionInfo =  e.sessionInfo || sky.config.sessionInfo;
			const wsArgs = { infoOnly: true, sadeceBilgimi: true };
			SessionInfo.SabitAttrListe.forEach(key => {
				const value = sessionInfo[key];
				if (value)
					wsArgs[key] = value;
			});
			let loginSelector = wsArgs.loginTipi || wsArgs.sessionMatch;
			if (!loginSelector || loginSelector == true)
				loginSelector = 'login';
			['loginTipi', 'sessionMatch'].forEach(key =>
				delete wsArgs[key]);

			if (!e.infoOnly && sessionInfo && !(sessionInfo.pass || sessionInfo.passMD5))
				throw { isError: true, rc: 'notLoggedIn', errorText: `Şifre boş olamaz` };
			
			lastAjaxObj = null;
			if (navigator.onLine) {
				lastAjaxObj = $.post({
					async: true, cache: false,
					url: `${(app || sky.config).wsURLBase}${loginSelector}/`,
					data: this.buildAjaxArgs(wsArgs),
					timeout: app.programcimi ? 1000 : 4000
				});
			}

			let result = await lastAjaxObj;
			if (!result)
				throw this.error_invalidCredentials;
			
			return result;
		}

		/*buildAjaxArgs(e) {
			e = e || {};
			return $.extend({}, ajaxWSDefOptsWithIO, e);
		}*/


		loginUIClosed(e) {
			e = e || {};
			delete this.loginUI;
			delete e.loginUI;
		}


		get error_invalidCredentials() {
			return { isError: true, rc: 'notLoggedIn', errorText: 'Hatalı kullanıcı veya parola' };
		}
	}
})()
