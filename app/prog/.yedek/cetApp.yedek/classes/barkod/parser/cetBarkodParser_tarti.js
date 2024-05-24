(function() {
	window.CETBarkodParser_Tarti = class extends window.CETBarkodParser_Kuralli {
		constructor(e) {
			e = e || {};
			super(e);
		}

		static get aciklama() { return 'Tartı' }

		async parseDevam(e) {
			let result = await super.parseDevam(e);
			if (result)
				return result;

			const {app} = sky;
			const {fiyatFra} = app;
			const {kural} = this;
			result = this.parcaAl({ bas: kural.stokBas, hane: kural.stokHane,
				callback: value => this.shKod = value });
			if (!result)
				return result;
			
			if (this.shKod) {
				const _e = { barkod: `${kural.kod}${this.shKod}` };
				let parser = new CETBarkodParser_Referans();
				result = await parser.parse(_e);
				if (result) {
					// this.barkod = parser.barkod || parser.okunanBarkod;
					this.shKod = parser.shKod;
				}
				_e.shKod = this.shKod;
				
				const {shRec} = _e;
				if (shRec) {
					for (const key in shRec) {
						const value = shRec[key];
						if (value != null)
							this[key] = value;
					}
				}
				else {
					if (!await this.shEkBilgileriBelirle(_e))
						return false;
				}
			}
			
			this.parcaAl({ bas: kural.miktarBas, hane: kural.miktarHane,
				callback: value => {
					value = asFloat(value) || null;
					let bolen = kural.miktarBolen;
					if (value && bolen)
						value /= asFloat(bolen) || null;
					this.miktar = value || this.miktar || null;
				} });
			
			this.parcaAl({ bas: kural.fiyatBas, hane: kural.fiyatHane,
				callback: value => {
					value = asFloat(value) || null;
					let bolen = kural.fiyatBolen;
					if (value && bolen)
						value /= roundToFra(bolen, fiyatFra) || null;
					value = value ? roundToFra(value, fiyatFra) : value;
					this.fiyat = value || this.fiyat || null;
				} });

			return true;
		}
	}
})();
