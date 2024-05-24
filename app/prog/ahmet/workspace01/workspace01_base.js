(function() {
	window.AhmetWorkspace01_Base = class extends window.Prog {
		constructor(e) {
			super(e);
			
			const extLogin = this.extensions.login;
			extLogin.options.isLoginRequired = false;
		}

		static get appName() { return 'ahmet_workspace01' }
		get defaultRootLayoutName() { return 'workspace01' }
		get appRoot() { return super.appRoot + '../ahmet/workspace01/' }

		buildAjaxArgs(e) {
			e = e || {};
			return $.extend(super.buildAjaxArgs(e) || {}, {
				appUniqueId: this.appUniqueId || ''
			});
		}

		async ilkIslemler(e) {
			try { Utils.disableHistoryBack() } catch (ex) { }
			try { requestFullScreen() } catch (ex) { }
			await super.ilkIslemler(e);
		}
	}
})()
