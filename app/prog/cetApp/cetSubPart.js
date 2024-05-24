(function() {
	window.CETSubPart = class extends window.SubPart {
		static get noResizeEvent() { return this.app && this.app.resizeEvents ? false : ($.jqx.mobile.isMobileBrowser() || $.jqx.mobile.isTouchDevice()) }
		static get ortakIslemTuslariPartClass() { return CETPartOrtakIslemTuslariPart }
		async run(e) {
			/*const {app} = this;
			if (!(this.isComponent || this.prefetch || this.isPrefetch)) {
				try { await app.promise_prefetchUI }
				catch (ex) { }
			}*/
			await super.run(e)
		}
		islemTuslariVarsaGoster(e) {
			e = e || {};
			const islemTuslariPart = e.islemTuslariPart || this.islemTuslariPart;
			if (islemTuslariPart && islemTuslariPart.layout)
				islemTuslariPart.layout.addClass(`jqx-hidden`)
		}
		islemTuslariVarsaGizle(e) {
			e = e || {};
			const islemTuslariPart = e.islemTuslariPart || this.islemTuslariPart;
			if (islemTuslariPart && islemTuslariPart.layout)
				islemTuslariPart.layout.addClass(`jqx-hidden`)
		}
	}
})()
