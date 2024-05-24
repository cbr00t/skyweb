
(function() {
	window.Extension = class extends window.CObject {
		constructor(e) {
			super(e);

			e = e || {};
			$.extend(this, {
				app: e.app,
				options: e.options || {}
			});
		}

		preInit(e) { }

		ilkIslemler(e) { }

		init(e) { }

		run(e) { }

		afterRun(e) { }

		exiting(e) { }


		buildAjaxArgs(e) {
			if (this.app)
				return this.app.buildAjaxArgs(e);
			
			e = e || {};
			return $.extend({}, ajaxWSDefOptsWithIO, e);
		}
	}
})();
