(function() {
	window.ĞanelRaporlamaTestPart = class extends window.SubPart {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				tamamIslemi: e.tamamIslemi
			});
			if (!(this.layout || this.template))
				this.template = this.app.templates[this.partName];
		}

		static get partName() { return 'test' }
		get adimText() { return 'Test' }
		static get deferDisplay() { return true }


		preInitLayout(e) {
			e = e || {};
			super.preInitLayout(e);

			const layout = e.layout || this.layout;
			this.templates = $.extend(this.templates || {}, {
				windows: layout.find(`#windows`)
			});
			const islemTuslari = this.islemTuslari = layout.find('.islemTuslari.asil');
			islemTuslari.find(`#btnTest2`)
				.jqxButton({ theme: theme })
				.on('click', evt => this.test2Istendi(e));
			layout.find(`#btnTest3`)
				.jqxButton({ theme: theme })
				.on('click', evt => this.test3Istendi(e));
		}

		postInitLayout(e) {
			e = e || {};
			super.postInitLayout(e);
			
			const layout = e.layout || this.layout;
			const {app} = sky;
		}
	}
})()
