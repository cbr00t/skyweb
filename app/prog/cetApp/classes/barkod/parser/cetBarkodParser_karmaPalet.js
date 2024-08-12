(function() {
	window.CETBarkodParser_KarmaPalet = class extends window.CETBarkodParser_Kuralli {
		static get aciklama() { return 'Karma Palet' } get karmaPaletmi() { return true }
		async parseDevam(e) {
			let result = await super.parseDevam(e); if (result) { return result } const {app} = sky, {barkod} = this;
			$.extend(this, { planNo: asInteger(barkod.substr(2, 7)), paletNo: asInteger(barkod.substr(9, 3)) })
			return true
		}
	}
})()
