(function() {
	window.SkyCafeBarkodParser_Tarti = class extends window.SkyCafeBarkodParser_Kuralli {
		static get aciklama() { return 'Tartı' }
		async parseDevam(e) {
			let result = await super.parseDevam(e); if (result) return result
			const {app} = sky, {fiyatFra} = app, {barkod, kural} = this, {kod} = kural, kodLen = kod.length;
			result = this.parcaAl({ bas: kural.stokBas, hane: kural.stokHane, callback: value => this.shKod = value }); if (!result) return result;
			let {shKod} = this, {stokBas, miktarBas, fiyatBas} = kural;
			if (shKod) {
				const _e = { barkod: kod + shKod }; let parser = new CETBarkodParser_Referans(); result = await parser.parse(_e);
				if (!result) { _e.barkod = shKod; parser = new CETBarkodParser_Referans(); result = await parser.parse(_e) }
				if (result) shKod = this.shKod = parser.shKod
				_e.shKod = shKod; const {shRec} = _e;
				if (shRec) {
					await this.shEkBilgileriBelirle(_e);
					for (const key in shRec) { if (key == 'barkod') continue; const value = shRec[key]; if (value != null) this[key] = value }
				}
				else {
					let uygunmu = await this.shEkBilgileriBelirle(_e);
					if (!uygunmu) { _e.shKod = `${kod}${_e.shKod}`; uygunmu = await this.shEkBilgileriBelirle(_e) }
					if (!uygunmu) return false
				}
			}
			this.parcaAl({ bas: miktarBas, hane: kural.miktarHane, callback: value => {
				let bolen = kural.miktarBolen; value = asFloat(value) || null;
				if (value && bolen) value /= asFloat(bolen) || null;
				this.miktar = value || this.miktar || null
			} });
			this.parcaAl({ bas: fiyatBas, hane: kural.fiyatHane, callback: value => {
				let bolen = kural.fiyatBolen; value = asFloat(value) || null;
				if (value && bolen) value /= roundToFra(bolen, fiyatFra) || null; value = value ? roundToFra(value, fiyatFra) : value;
				this.fiyat = value || this.fiyat || null
			} });
			return true
		}
	}
})()
