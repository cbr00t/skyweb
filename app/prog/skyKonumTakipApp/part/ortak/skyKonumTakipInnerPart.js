(function() {
	window.SkyKonumTakipInnerPart = class extends window.InnerPart {
		constructor(e) {
			e = e || {};
			super(e);
		}

		static get partName() { return null }
		
		get subContent() {
			const {parentPart} = this;
			return parentPart.subContent;
		}

		async activatePart(e) {
			const {innerPart_activatedFlag} = this;
			await super.activatePart(e);
			if (innerPart_activatedFlag)
				this.tazele(e);
		}

		activatePart_tazele(e) {
			this.tazele(e);
		}

		tazele(e) {
		}
	}
})()
