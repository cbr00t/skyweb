
(function() {
	window.CIdVeAdi = class extends window.CIdYapi {
		constructor(e) {
			e = e || {};
			super(e);
			
			this.aciklama = e.aciklama;
		}

		cizgiliOzet(e) {
			return this.aciklama || '';
		}
		
		parantezliOzet(e) {
			return this.aciklama || '';
		}
	}
})();
