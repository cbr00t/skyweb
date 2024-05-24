
(function() {
	window.CKodYapi = class extends window.CObject {
		constructor(e) {
			e = e || {};
			super(e);
			
			this.kod = e.kod || e.id;
		}

		cizgiliOzet(e) {
			return this.kod || '';
		}
		
		parantezliOzet(e) {
			return this.kod || '';
		}
		
		toString(e) {
			return this.parantezliOzet(e);
		}
	}
})();
