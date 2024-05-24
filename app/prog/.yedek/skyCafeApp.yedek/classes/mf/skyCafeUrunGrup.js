(function() {
	window.SkyCafeUrunGrup = class extends window.MQCogul {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				id: e.id || e.kod,
				aciklama: e.aciklama
			});
		}
		
		static get table() { return 'mst_StokGrup' }
		static get idSaha() { return 'kod' }
		static get grupmu() { return true }

		hostVars() {
			let hv = super.hostVars() || {};
			$.extend(hv, {
				kod: this.id,
				aciklama: this.aciklama || ''
			});
			
			return hv;
		}
		
		async setValues(e) {
			e = e || {};
			await super.setValues(e);
			
			const {rec} = e;
			$.extend(this, {
				kod: rec.kod || rec.id,
				aciklama: rec.aciklama
			});
		}

		reduce(e) {
			return $.extend({}, super.reduce(e));
		}
	}
})()
