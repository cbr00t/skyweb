(function() {
	window.InnerPart = class extends window.Part {
		constructor(e) {
			e = e || {};
			super(e);

			const {partName} = this;
			if (!(this.layout || this.template))
				this.layout = this.subContent.find(`#${partName}.part`);
		}

		get subContent() {
			return this.content;
		}

		
		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);
			
			const layout = e.layout || this.layout;
		}

		async activatePart(e) {
			e = e || {};
			// await super.activatePart(e);

			const layout = e.layout || this.layout;
			layout.removeClass(`jqx-hidden`);
			layout.addClass(`basic-hidden`);
			setTimeout(() => layout.removeClass(`basic-hidden`), this.innerPart_activatedFlag ? 50 : 150);
			
			const {app} = sky;
			app.activeInnerPart = this;
			this.innerPart_activatedFlag = true;
		}

		async deactivatePart(e) {
			e = e || {};
			const layout = e.layout || this.layout;
			layout.addClass(`jqx-hidden`);
			
			const {app} = sky;
			if (app.activeInnerPart == this)
				delete app.activeInnerPart;
			
			// await super.deactivatePart(e);
		}

		async onResize(e) {
			if (this.app.activeInnerPart != this)
				return false;
			
			await super.onResize(e);
		}
	}
})()
