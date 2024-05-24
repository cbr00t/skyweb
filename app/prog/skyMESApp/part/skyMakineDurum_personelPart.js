(function() {
	window.SkyMakineDurum_PersonelPart = class extends window.SkyMESTextInputPart {
		constructor(e) {
			e = e || {};
			super(e);

			const title = this.title = e.title || 'Personel';
			this.placeHolder = `${title} Numarası`;
		}

		static get partName() { return 'personel' }
		get autoHeight_uiSelector() { return null }
		get klavyeAcilirmi() { return false }
		get numKlavyeAcilirmi() { return true }
		get isNumKlavyeTextOnly() { return true }
		
		async tazeleDevam(e) {
			await super.tazeleDevam(e);
		}

		wndArgsDuzenle(e) {
			super.wndArgsDuzenle(e);

			const size = {
				width: Math.min(500, $(window).width() - 1),
				height: 125
			};
			$.extend(e.args, {
				isModal: true, width: size.width, height: size.height
				// minWidth: size.width - 20, minHeight: size.height
			});
		}
	}
})()
