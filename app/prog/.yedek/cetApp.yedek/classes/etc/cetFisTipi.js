(function() {
	window.CETFisTipi = class extends window.CKodVeAdi {
		constructor(e) {
			e = e || {};
			super(e);
			
			$.extend(this, {
				fisSinif: e.fisSinif
			});
		}

		static fromFisSinif(e) {
			e = e || {};
			const fisSinif = e.fisSinif;
			const kod = e.kod || fisSinif.adimTipi || fisSinif.kod;
			const aciklamaPrefix = e.aciklamaPrefix;
			let aciklama = e.aciklama || fisSinif.aciklama;
			if (aciklamaPrefix)
				aciklama = `${aciklamaPrefix}${aciklama}`;
			
			return new this($.extend({}, e, { kod: kod, aciklama: aciklama, fisSinif: fisSinif }));
		}
	}
})()
