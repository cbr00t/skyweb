(function() {
	window.CETStokDetay = class extends window.CETStokTicariDetay {
		constructor(e) {
			e = e || {};
			super(e);
		}

		static get fisSinif() { return CETStokFis }
	}
})()
