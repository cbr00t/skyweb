(function() {
	window.SosyalDurumPartBase = class extends window.SubPart {
		constructor(e) {
			e = e || {};
			super(e);

			if (!((this.layout && this.layout.length) || this.template))
				this.layout = () => this.app.innerContent.find(`#${this.partName}.part`);
		}

		static get deferDisplay() { return false }
		static get adimTextGosterilirmi() { return true }


		buildAjaxArgs(e) {
			return this.app.buildAjaxArgs(e)
		}

		async initActivatePartOrtak(e) {
			e = e || {};
			await super.initActivatePartOrtak(e);

			const {app} = this;
			app.activePart = this;
			
			const {layout} = this;
			if (layout && layout.length)
				layout.removeClass(`jqx-hidden basic-hidden`);
			
			app.kisiBilgiTazele();
		}

		async destroyDeactivatePartOrtak(e) {
			e = e || {};
			await super.destroyDeactivatePartOrtak(e);
			
			this.app.activePart = this.parentPart || this.app;
			
			const {layout} = this;
			if (layout && layout.length)
				layout.addClass(`jqx-hidden`);
		}

		geriIstendi(e) {
			this.app.navMenuTiklandi($.extend({}, e, { id: 'giris' }))
		}
	}
})()
