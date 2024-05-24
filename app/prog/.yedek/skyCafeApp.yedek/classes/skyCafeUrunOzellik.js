(function() {
	window.SkyCafeUrunOzellik = class extends window.MQCogul {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				id: e.id || e.kod || e.vioID || e.uzakID,
				stokKod: e.stokKod,
				aciklama: e.ozellik || e.aciklama,
				ekFiyat: asFloat(e.ekFiyat) || 0
			});
		}
		
		static get table() { return 'mst_StokOzellik' }
		static get idSaha() { return 'vioID' }

		hostVars() {
			let hv = super.hostVars() || {};
			$.extend(hv, {
				vioID: this.id,
				stokKod: this.stokKod,
				ozellik: this.aciklama,
				ekFiyat: asFloat(this.ekFiyat) || 0
			});
			
			return hv;
		}
		
		async setValues(e) {
			e = e || {};
			await super.setValues(e);
			
			const {rec} = e;
			$.extend(this, {
				id: rec.kod || rec.id || rec.vioID,
				stokKod: rec.stokKod,
				aciklama: rec.ozellik || rec.aciklama,
				ekFiyat: asFloat(rec.ekFiyat) || 0
			});
		}

		reduce(e) {
			return $.extend({}, super.reduce(e));
		}
	}
})()
