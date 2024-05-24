(function() {
	window.SkyCafeLoginExtension = class extends window.LoginExtension {
		constructor(e) {
			super(e);
		}

		async login(e) {
			e = e || {};
			let result = await super.login(e);
			
			/*const sessionInfo = e.sessionInfo || sky.config.sessionInfo;
			if (sessionInfo && sessionInfo.hasSessionOrUser)
				await this.dbSaveLogin(e);*/
			
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
			
			/*const btnParam = $(`<button id="param">AYARLAR</button>`).appendTo(layout)
			 						.jqxButton({ theme: theme, width: 100, height: 35 })
			 						.on('click', evt =>
			 							this.loginUI_ayarlarIstendi($.extend({}, e, { event: evt })));*/
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
				try { return await super.wsLogin(e) }
				catch (ex) {
					try { await this.wsLogin_offline(e) }
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

			return await this.wsGetUserInfo_offline($.extend({}, e, { infoOnly: true }));
		}

		async wsLogin_offline(e) {
			e = e || {};
			const {sessionInfo} = e;
			if (sky.config.test || !(sessionInfo && sessionInfo.hasSessionOrUser))
				throw this.error_notSupported;
			
			const {app} = sky;
			const dbMgr = app.dbMgr_mf;
			let tx = await dbMgr.readTransaction();
			let query = `SELECT COUNT(*) sayi FROM mst_Kasiyer WHERE LOWER(kod) = ? AND (passMD5 = ? OR LOWER(passMD5) = ?)`
			let sayi = parseInt(await dbMgr.tekilDegerExecuteSelect({
				tx: tx, query: query,
				params: [sessionInfo.user.toLowerCase(), sessionInfo.pass, sessionInfo.passMD5.toLowerCase()]
			}));
			if (!sayi)
				throw this.error_invalidCredentials;
			
			return this.wsGetUserInfo_offline(e);
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
			const dbMgr = app.dbMgr_mf;
			let tx = await dbMgr.readTransaction();
			let query =
				 `SELECT * FROM mst_Kasiyer WHERE LOWER(kod) = ?` +
				` AND (${e.infoOnly ? '1 = 1 OR ' : ''}passMD5 = ? OR LOWER(passMD5) = ?)`;
			let rec = await dbMgr.tekilExecuteSelect({
				tx: tx, query: query,
				params: [sessionInfo.user.toLowerCase(), sessionInfo.pass, sessionInfo.passMD5.toLowerCase()]
			});
			if (!rec)
				throw this.error_invalidCredentials;
			
			const defaultLoginOzelTip = sky.app.class.defaultLoginOzelTip || {};
			return {
				sessionID: null,
				user: sessionInfo.user,
				userDesc: rec.aciklama || rec.userText,
				ozelTipKod: rec.ozelTipKod || defaultLoginOzelTip.kod,
				ozelTipAdi: rec.ozelTipAdi || defaultLoginOzelTip.aciklama,
				sessionObjectAdminmi: asBool(rec.sefmi) || rec.yetki == 'admin',
				sessionObjectKod: rec.kod || rec.user,
				sessionObjectAciklama: rec.aciklama || rec.userText,
				dbName: rec.dbName,
				firmaKisaUnvan: rec.firmaKisaUnvan,
				digerSubeleriGorebilirmi: asBool(rec.digerSubeleriGorebilirmi),
				yetki: rec.yetki
			}
		}
		

		async dbSaveLogin(e) {
			e = e || {};
			const {sessionInfo} = sky.config;
			if (sky.config.test || !(sessionInfo && sessionInfo.hasSessionOrUser))
				return;
			
			const {app} = sky;
			const dbMgr = app.dbMgr_mf;
			await dbMgr.transactionDo(async tx => {
				if (e.clear) {
					let query = `DELETE FROM mst_Kasiyer`;
					await dbMgr.executeSql({ tx: tx, query: query });
				}
				
				let query = `REPLACE INTO mst_Kasiyer (` +
								`kod, passMD5, aciklama, yetki` +
							`) VALUES (?, ?, ?, ?)`;
				await dbMgr.executeSql({
					tx: tx, query: query,
					params: [
						sessionInfo.user, sessionInfo.passMD5, sessionInfo.userDesc,
						sessionInfo.yetki == null
							? asBool(sessionInfo.isAdmin || sessionInfo.sessionObjectAdminmi) ? 'admin' : 'garson'
							: sessionInfo.yetki
					]
				});
			});
		}
	}
})()
