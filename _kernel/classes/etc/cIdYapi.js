
(function() {
	window.CIdYapi = class extends window.CObject {
		constructor(e) {
			e = e || {};
			super(e);
			
			this.id = e.id;
		}

		cizgiliOzet(e) {
			return '';
		}
		
		parantezliOzet(e) {
			return '';
		}
		
		toString(e) {
			return this.parantezliOzet(e);
		}
	}
})();
