
(function() {
	window.CKodVeAdi = class extends window.CKodYapi {
		constructor(e) {
			e = e || {};
			super(e);
			
			this.aciklama = e.aciklama;
		}

		parantezliOzet(e) {
			e = e || {};
			if (!this.aciklama)
				return super.parantezliOzet(e);
			
			if (!this.kod)
				return this.aciklama;
			
			return `(${e.styled ? '<b>' : ''}${this.kod}${e.styled ? '</b>' : ''}) ${this.aciklama}`;
		}
		
		cizgiliOzet(e) {
			e = e || {};
			if (!this.aciklama)
				return super.cizgiliOzet(e);
			
			if (!this.kod)
				return this.aciklama;
			
			return `${e.styled ? '<b>' : ''}${this.kod}${e.styled ? '</b>' : ''}-${this.aciklama}`;
		}
	}
})();
