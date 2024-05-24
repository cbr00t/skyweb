(function() {
	window.SkyConfigLoginExtension = class extends window.LoginExtension {
		constructor(e) {
			super(e);
		}

		async login(e) {
			return await super.login(e);
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

			let part = new SkyConfigParamPart({
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
	}
})()
