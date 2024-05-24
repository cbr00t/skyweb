(function() {
	window.SkyCafeUstKategori = class extends window.MQCogul {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				id: e.id || e.kod || e.vioID || e.uzakID,
				aciklama: e.aciklama
			});
		}
		
		static get table() { return 'mst_ResUstKategori' }
		static get idSaha() { return 'vioID' }

		hostVars() {
			let hv = super.hostVars() || {};
			$.extend(hv, {
				vioID: this.id,
				aciklama: this.aciklama || ''
			});
			
			return hv;
		}
		
		async setValues(e) {
			e = e || {};
			await super.setValues(e);
			
			const {rec} = e;
			$.extend(this, {
				id: rec.kod || rec.id || rec.vioID,
				aciklama: rec.aciklama
			});
		}

		reduce(e) {
			return $.extend({}, super.reduce(e));
		}
	}
})()
