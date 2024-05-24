(function() {
	window.CETLoginExtension = class extends window.LoginExtension {
		constructor(e) {
			super(e);
		}

		async login(e) {
			e = e || {};
			let result = await super.login(e);
			
			const sessionInfo = e.sessionInfo || sky.config.sessionInfo;
			if (sessionInfo && sessionInfo.hasSessionOrUser)
				await this.dbSaveLogin(e);
			
			return result;
		}

		async initLoginUI(e) {
			e = e || {};
			await super.initLoginUI(e);

			const loginUI = e.loginUI || this.loginUI;
			if (!(loginUI && (loginUI.layout || {}).length))
				return;
			
			const {app} = sky;
			const layout = loginUI.loginForm && loginUI.loginForm.length ? loginUI.loginForm : loginUI;
			loginUI.layout.addClass(`${app.appName} ${app.rootAppName} part`);
			layout.addClass(`${app.appName} ${app.rootAppName} part`);
			
			const btnParam = $(`<button id="param">AYARLAR</button>`).appendTo(layout)
			 						.jqxButton({ theme: theme, width: 100, height: 35 })
			 						.on('click', evt =>
			 							this.loginUI_ayarlarIstendi($.extend({}, e, { event: evt })));
		}

		async loginUI_ayarlarIstendi(e) {
			const loginUI = e.loginUI || this.loginUI;
			const {content} = loginUI;
			const layout = loginUI.loginForm && loginUI.loginForm.length ? loginUI.loginForm : loginUI;

			const app = sky.app;
			await app.param.yukle();
			
			/*const appLayout = await app.fetchLayout({ name: app.defaultRootLayoutName });
			appLayout.addClass('jqx-hidden');
			appLayout.appendTo(content);*/

			let part = new CETParamPart({
				tamamIslemi: async e => {
					qs._port = sky.config.port;
					await e.sender.destroyPart();
					await app.destroyPart();
					delete sky.app;
					if (navigator.onLine)
						location.reload(false);
					else
						sky.run();
				}
			});
			await part.run();
			if (part.ortakIslemTuslariPart)
				await part.ortakIslemTuslariPart.destroyPart();
			this.closeLoginUI();
		}

		async loginDevam(e) {
			let result = await super.loginDevam(e);
			await this.dbSaveLogin(e);

			return result;
		}

		async wsLogin(e) {
			e = e || {};
			const {sessionInfo} = e;
			if (sky.config.test || !(sessionInfo && sessionInfo.hasSessionOrUser))
				return await super.wsLogin(e);
			
			if (true || navigator.onLine) {
				try {
					return await super.wsLogin(e)
				}
				catch (ex) {
					try {
						await this.wsLogin_offline(e)
					}
					catch (ex2) {
						throw (ex && (ex.readyState || 0) < 4)
								? ex
								: ex2;
					}
				}
			}

			return await this.wsLogin_offline(e);
		}

		async wsLogout(e) {
			e = e || {};
			if (true || navigator.onLine) {
				try { return await super.wsLogout(e) }
				catch (ex) { return await this.wsLogout_offline(e) }
			}

			return await this.wsLogout_offline(e);
		}

		async wsGetUserInfo(e) {
			e = e || {};
			const sessionInfo = e.sessionInfo || sky.config.sessionInfo;
			if (sky.config.test || !(sessionInfo && sessionInfo.hasSessionOrUser))
				return await super.wsGetUserInfo(e);
			
			if (true || navigator.onLine) {
				try { return await super.wsGetUserInfo(e) }
				catch (ex) { return await this.wsGetUserInfo_offline(e) }
			}
			return await this.wsGetUserInfo_offline($.extend({}, e, { infoOnly: true }))
		}
		async wsLogin_offline(e) {
			e = e || {};
			const {sessionInfo} = e;
			if (sky.config.test || !(sessionInfo && sessionInfo.hasSessionOrUser))
				throw this.error_notSupported
			const {app} = sky;
			const dbMgr = app.dbMgrs.param;
			let tx = await dbMgr.readTransaction();
			let sent = new MQSent({
				from: 'mst_Login',
				where: [
					{ degerAta: sessionInfo.loginTipi, saha: 'loginTipi' },
					{ degerAta: sessionInfo.user, saha: 'user' },
					new MQOrClause([
						{ degerAta: sessionInfo.pass, saha: 'pass' },
						{ degerAta: sessionInfo.passMD5.toLowerCase(), saha: 'pass' }
					])
				],
				sahalar: `COUNT(*) sayi`
			});
			let sayi = parseInt(await dbMgr.tekilDegerExecuteSelect({ tx: tx, query: sent }));
			if (!sayi)
				throw this.error_invalidCredentials
			return this.wsGetUserInfo_offline(e)
		}
		async wsLogout_offline(e) {
			e = e || {};
			const {sessionInfo} = sky.config;
			if (sky.config.test)
				throw this.error_notSupported;
			
			return { sessionID: sessionInfo.sessionID, user: sessionInfo.user }
		}
		async wsGetUserInfo_offline(e) {
			e = e || {};
			const sessionInfo = e.sessionInfo || sky.config.sessionInfo;
			if (sky.config.test || !(sessionInfo && sessionInfo.hasSessionOrUser))
				throw this.error_notSupported;
			
			const {app} = sky;
			const dbMgr = app.dbMgrs.param;
			let tx = await dbMgr.readTransaction();
			let sent = new MQSent({
				from: 'mst_Login',
				where: [
					{ degerAta: sessionInfo.loginTipi, saha: 'loginTipi' },
					{ degerAta: sessionInfo.user, saha: 'user' }
				],
				sahalar: '*'
			});
			if (!e.infoOnly) {
				sent.where.add(new MQOrClause([
					{ degerAta: sessionInfo.pass, saha: 'pass' },
					{ degerAta: sessionInfo.passMD5.toLowerCase(), saha: 'pass' }
				]))
			}
			let rec = await dbMgr.tekilExecuteSelect({ tx: tx, query: sent });
			if (!rec)
				throw this.error_invalidCredentials
			
			const defaultLoginOzelTip = sky.app.class.defaultLoginOzelTip || {};
			return {
				sessionID: null,
				user: sessionInfo.user,
				userDesc: rec.userText,
				ozelTipKod: rec.ozelTipKod || defaultLoginOzelTip.kod,
				ozelTipAdi: rec.ozelTipAdi || defaultLoginOzelTip.aciklama,
				sessionObjectAdminmi: false,
				sessionObjectKod: rec.user,
				sessionObjectAciklama: rec.userText,
				dbName: rec.dbName,
				firmaKisaUnvan: rec.firmaKisaUnvan,
				digerSubeleriGorebilirmi: asBool(rec.digerSubeleriGorebilirmi)
			}
		}
		async dbSaveLogin(e) {
			e = e || {};
			const {sessionInfo} = sky.config;
			if (sky.config.test || !(sessionInfo && sessionInfo.hasSessionOrUser))
				return
			const {app} = sky;
			const dbMgr = app.dbMgrs.param;
			await dbMgr.transactionDo(async tx => {
				if (e.clear) {
					let del = new MQIliskiliDelete({ from: 'mst_Login' });
					await dbMgr.executeSql({ tx: tx, query: del })
				}
				const hv = {
					loginTipi: sessionInfo.loginTipi, user: sessionInfo.user,
					pass: sessionInfo.passMD5, userText: sessionInfo.userDesc,
					ozelTipKod: sessionInfo.ozelTip?.kod, ozelTipAdi: sessionInfo.ozelTip?.aciklama,
					dbName: sessionInfo.dbName, firmaKisaUnvan: sessionInfo.firmaKisaUnvan,
					digerSubeleriGorebilirmi: bool2Int(asBool(sessionInfo.digerSubeleriGorebilirmi))
				};
				await dbMgr.insertOrReplaceTable({ tx: tx, table: 'mst_Login', mode: 'replace', hv: hv })
			})
		}
	}
})()
