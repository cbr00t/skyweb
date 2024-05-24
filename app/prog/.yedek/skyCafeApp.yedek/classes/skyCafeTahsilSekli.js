(function() {
	window.SkyCafeTahsilSekli = class extends window.MQCogul {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				id: asInteger(e.id || e.kod || e.kodNo),
				aciklama: e.aciklama,
				tip: e.tip || e.tahsilTipi
			});
		}
		
		static get table() { return 'mst_TahsilatSekli' }
		static get idSaha() { return 'kod' }

		hostVars() {
			let hv = super.hostVars() || {};
			$.extend(hv, {
				kodNo: asInteger(this.id),
				aciklama: this.aciklama || '',
				tahsilTipi: this.tip
			});
			
			return hv;
		}
		
		async setValues(e) {
			e = e || {};
			await super.setValues(e);
			
			const {rec} = e;
			$.extend(this, {
				id: asInteger(rec.kod || rec.kodNo || rec.id),
				aciklama: rec.aciklama,
				tip: rec.tahsilTipi
			});
		}

		reduce(e) {
			return $.extend({}, super.reduce(e));
		}
	}
})()
