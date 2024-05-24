
(function() {
	window.Part = class extends window.AppPartBase {
		constructor(e) {
			super(e);
			
			e = e || {};
			$.extend(this, {
				app: e.app || sky.app,
				_wsURLBase: e.wsURLBase || (this.app || this)._wsURLBase,
				initFlag: e.initFlag || false
			});
			this.parentPart = e.parentPart || (this.app || this).activePart || this.app;
		}

		static get isPart() { return true }		
		static get tipBelirtec() { return 'part' }
		static get partName() { return null }
		get rootAppName() { return (this.app || {}).rootAppName || this.class.rootAppName }
		get appName() { return (this.app || {}).appName || this.class.appName }
		get appRoot() { return (this.app || {}).appRoot }
		get partRoot() { return `${this.appRoot || ''}/part/` }
		get layoutRoot() { return `${this.partRoot}` }	

		updateWSUrlBase(e) {
			(this.app || sky.app).updateWSUrlBase(e);
		}
	}
})();
