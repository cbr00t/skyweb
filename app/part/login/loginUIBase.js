(function() {
	window.LoginUIBase = class extends window.Part {
		constructor(e) {
			e = e || {};
			super(e);

			const app = this.app || sky.app;
			if (this.extensions)
				delete this.extensions.login;
			if (app && !app.extensions.login)
				app.extensions.login = new LoginExtension(e);
			
			$.extend(this, {
				tamamIslemi: e.tamamIslemi
			});
		}

		get _defaultLayoutName() { return null }
		get defaultLayoutName() { return null }
		/*get appRoot() { return '../app/part/' }*/
		get partRoot() { return `../app/part/${this.partName || ''}/` }


		async run(e) {
			e = e || {};
			await super.run(e);
			// await ((window.savedProcs || {}).showProgress || showProgress)(null, null, 1);
			delete e.sessionInfo;
			const defaultLayoutName = this._defaultLayoutName;
			if (defaultLayoutName)
				return await this.setLayout({ id: defaultLayoutName, name: defaultLayoutName });
			return null
		}
		async afterRun(e) {
			e = e || {}
			await super.afterRun(e);
			setTimeout(() => (savedProcs.hideProgress || hideProgress), 100);
		}

		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);
			const layout = e.layout || this.layout;
			if (layout && layout.length)
				layout.show()
		}
		async destroyLayout(e) {
			e = e || {};
			await super.destroyLayout(e)
			
			const layout = e.layout || this.layout;
			if (layout && layout.length)
				layout.hide();
			
			const {app} = sky;
			const ext = app ? app.extensions.login : null;
			if (ext)
				await ext.loginUIClosed(e);
			
			this.isDestroyEventTriggered = true;
		}


		async checkLogin(e) {
			e = e || {};
			['id', 'name', 'content', 'layout', 'template'].forEach(key =>
				delete e[key]);

			let {app} = sky;
			let ext = (app ? app.extensions.login : null) || new LoginExtension(e);
			await (window.savedProcs || window).showProgress(null, null, 1);
			try {
				await ext.loginDevam(e);
				await this.closeUI(e);

				if (this.tamamIslemi) {
					this.tamamIslemi.call(this, e);
					app = sky.app;
					//if (app && app.extensions)
					//	app.extensions.login = ext;
				}
			}
			finally {
				await (window.savedProcs || window).hideProgress();
			}
		}

		async ssoLoginIstendi(e) {
			e = e || {};
			['id', 'name', 'content', 'layout', 'template'].forEach(key =>
				delete e[key]);

			const {loginForm} = this;
			const _e = {
				saveLoginFlag: loginForm.find('#chkSaveLogin').is(':checked'),
				sessionInfo: new SessionInfo({
					loginTipi: loginForm.find('#loginTipi').val(),
					user: loginForm.find('#user').val(),
					pass: loginForm.find('#pass').val()
				})
			};
			
			let {app} = sky;
			let ext = (app ? app.extensions.login : null) || new LoginExtension(e);
			await (window.savedProcs || window).showProgress(null, null, 1);
			try {
				await ext.ssoLoginIslemi(_e);
				await this.closeUI(e);

				if (this.tamamIslemi) {
					this.tamamIslemi.call(this, e);
					app = sky.app;
					//if (app && app.extensions)
					//	app.extensions.login = ext;
				}
			}
			finally {
				await (window.savedProcs || window).hideProgress();
			}
		}

		async closeUI(e) {
			delete this.isDestroyEventTriggered;
			await this.clearContentWithDestroy($.extend(e, { content: this.layout }));

			if (!this.isDestroyEventTriggered)
				await this.destroyLayout(e);
			delete this.isDestroyEventTriggered;
		}
	}
})()
