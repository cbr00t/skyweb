
(function() {
	window.Module = class extends window.App {
		constructor(e) {
			super(e);
		}

		static get isModule() { return true }

		static get tipBelirtec() { return 'module' }
		get appRootPrefix() { return `${super.appRootPrefix || ''}module/` }
	}
})();
