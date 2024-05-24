(function() {
	window.LoginUI = class extends window.LoginUIBase {
		constructor(e) {
			super(e);
		}

		static get partName() { return 'login' }
		get _defaultLayoutName() { return 'loginUI' }


		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);

			const layout = e.layout || this.layout;
			const template = layout.find('#windows');
			
			const windows = this.windows;
			let wnd = windows.login;
			this.jqueryFind({ obj: wnd, action: obj => obj.jqxWindow('close') });
			
			const loginForm = this.loginForm = template.contents('#loginForm');
			wnd = this.windows.login = createJQXWindow(
				loginForm, 'Sisteme Giriş Ekranı', {
					isModal: true, showCloseButton: false, showCollapseButton: false,
					position: {
						x: $(window).width() < 550 ? 3 : $(window).width() / 4,
						y: 50
					},
					// position: 'center',
					width: $(window).width() < 550 ? 480 : 510,
					height: $(window).height() < 700 ? 425 : 510,
				},
				{
					'TAMAM': async (dlgUI, btnUI) => {
						setButonEnabled(btnUI, false);
						setTimeout(() => setButonEnabled(btnUI, true), 1000);
						$.extend(e, {
							saveLoginFlag: loginForm.find('#chkSaveLogin').is(':checked'),
							sessionInfo: new SessionInfo({
								loginTipi: loginForm.find('#loginTipi').val(),
								user: loginForm.find('#user').val(),
								pass: loginForm.find('#pass').val()
							})
						});
						await showProgress(null, null, 500);
						try {
							await this.checkLogin(e)
						}
						catch (ex) {
							displayServerResponse(ex);
							throw ex;
						}
						finally { await hideProgress() }
						dlgUI.jqxWindow('close');
					},
					'VAZGEÇ': (dlgUI, btnUI) => {
						dlgUI.jqxWindow('close');
					}
				}
			);
			wnd.on('close', () =>
				this.closeUI());
			
			const {app} = sky;
			const {rootAppName, appName} = app;
			
			const partOrAppName = `loginUI`;
			const cssTipBelirtec = app.cssTipBelirtec;
			[loginForm, wnd].forEach(elm => {
				if (elm && elm.length) {
					[cssTipBelirtec, partOrAppName, appName, rootAppName].forEach(cssClass => {
						if (!elm.hasClass(cssClass))
							elm.addClass(cssClass);
					})
				}
			});

			const ext = (app ? app.extensions.login : null) || new LoginExtension(e);
			if (ext) {
				let elm = loginForm.find('#loginTipi');
				const size = { width: elm.width(), height: elm.height() };
				elm.jqxDropDownList({
					valueMember: 'kod', displayMember: 'aciklama',
					source: ext.loginTypes, selectedIndex: 0,
					searchMode: 'containsignorecase', placeHolder: 'Seçiniz:', filterPlaceHolder: 'Bul:',
					checkboxes: false, filterable: true, theme: theme, animationType: animationType,
					dropDownHeight: 200, scrollBarSize: 25, autoDropDownHeight: false,
					width: size.width, height: size.height, itemHeight: size.height - 2
				});
				const loginTipi = this.loginTipi || qs.loginTipi || qs.loginWSSelector;
				if (loginTipi)
					ddListSelectItemByValue(elm, loginTipi);
			}

			loginForm.find('input[type != checkbox]').jqxInput({ theme: theme });

			let txtUser = loginForm.find('#user');
			txtUser.on('blur', evt => this.loginUserDegisti(e));
			txtUser.jqxInput('focus');

			if (sky.config.kiosk)
				txtUser.attr('type', 'password')

			const cookie = $.jqx.cookie;
			let chkSaveLogin = loginForm.find('#chkSaveLogin');
			chkSaveLogin.prop('checked', asBool(cookie.cookie('saveLoginFlag')));
			chkSaveLogin.on('change', evt =>
				cookie.cookie('saveLoginFlag', evt.target.checked));

			const btnSSOLogin = this.btnSSOLogin = loginForm.find('#ssoLogin');
			btnSSOLogin.jqxButton({ theme: theme });
			btnSSOLogin.off('click');
			btnSSOLogin.on('click', evt =>
				this.ssoLoginIstendi($.extend({}, e, { event: evt })));
			
			let inputs = loginForm.find('#user, #pass, #chkSaveLogin');
			inputs.on('keyup', evt => {
				let key = (evt.key || '').toLowerCase();
				if (key == 'enter' || key == 'linefeed')
					wnd.find('.ui-dialog-button input[value="TAMAM"]').click();
			});
			inputs.on('focus', evt =>
				evt.target.select());
		}

		async closeUI() {
			const windows = this.windows;
			const wnd = this.windows.login;
			delete this.windows.login;
			try { wnd.jqxWindow('destroy') }
			catch (ex) { }
			
			await super.closeUI();
		}

		async loginUserDegisti(e) {
			const app = sky.app;
			const ext = (app ? app.extensions.login : null) || new LoginExtension(e);
			let loginForm = this.loginForm;
			let _sessionInfo = new SessionInfo({
				loginTipi: loginForm.find('#loginTipi').val(),
				user: loginForm.find('#user').val()
			});

			let divUserText = loginForm.find('#userText');
			try {
				let userInfo = await ext.wsGetUserInfo({ sessionInfo: _sessionInfo, infoOnly: true }) || {};
				let text = `<b>(${userInfo.kod || userInfo.user || userInfo.sessionObjectKod || ''})</b> ${userInfo.aciklama || userInfo.userDesc || userInfo.sessionObjectAciklama || ''}`
				divUserText.html(text);
				divUserText.parent().removeClass('jqx-hidden');

				const {btnSSOLogin} = this;
				if (userInfo && userInfo.hasSSO)
					btnSSOLogin.removeClass('jqx-hidden basic-hidden');
				else
					btnSSOLogin.addClass('jqx-hidden');
			}
			catch (ex) {
				if (ex.responseJSON && ['loginFailed', 'notLoggedIn'].includes(ex.responseJSON.rc)) {
					divUserText.html('');
					divUserText.parent().addClass('jqx-hidden')
				}
				else {
					throw ex
				}
			}
		}
	}
})()
