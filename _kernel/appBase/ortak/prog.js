
(function() {
	window.Prog = class extends window.App {
		constructor(e) {
			super(e);
		}

		static get isProg() { return true }

		static get tipBelirtec() { return 'prog' }
		static get cssTipBelirtec() { return 'app prog' }
		get appRootPrefix() { return `${super.appRootPrefix || ''}prog/` }
	}
})();
