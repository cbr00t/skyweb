(function() {
	window.CETBarkodParser_Tarti = class extends window.CETBarkodParser_Kuralli {
		static get aciklama() { return 'Tartı' } get tartimi() { return true }
		async parseDevam(e) {
			let result = await super.parseDevam(e); if (result) return result
			const {app} = sky, {fiyatFra} = app, {barkod, kural} = this, {kod} = kural, kodLen = kod.length;
			result = this.parcaAl({ bas: kural.stokBas, hane: kural.stokHane, callback: value => this.shKod = value }); if (!result) return result;
			let {shKod} = this, {stokBas, miktarBas, fiyatBas} = kural, _e = { barkod: kod + shKod };
			if (shKod) {
				let parser = new CETBarkodParser_Referans(); result = await parser.parse(_e);
				if (!result) { _e.barkod = shKod; parser = new CETBarkodParser_Referans(); result = await parser.parse(_e) }
				if (result) {
					for (let key of ['shKod', 'shAdi', 'grupKod', 'miktar', 'fiyat', 'fiyatGorFiyati', 'kdvOrani', 'kdvDegiskenmi', 'boyutTipi', 'bedenKategoriKod']) { delete this[key] }
					for (let [key, value] of Object.entries(parser)) { if (value != null && !this[key]) { this[key] = value } }
					shKod = this.shKod
				}
				_e.shKod = shKod; const {shRec} = _e; if (shRec) {
					await this.shEkBilgileriBelirle(_e);
					for (const key in shRec) { if (key == 'barkod') continue; const value = shRec[key]; if (value != null) this[key] = value }
				}
			}
			if (shKod) {
				let uygunmu = await this.shEkBilgileriBelirle(_e);
				if (!uygunmu) { _e.shKod = `${kod}${_e.shKod}`; uygunmu = await this.shEkBilgileriBelirle(_e) }
				if (!uygunmu) { return false }
			}
			this.parcaAl({ bas: miktarBas, hane: kural.miktarHane, callback: value => {
				let bolen = kural.miktarBolen; value = asFloat(value) || null;
				if (value && bolen) { value /= asFloat(bolen) || null }
				this.miktar = value || this.miktar || null
			} });
			this.parcaAl({ bas: fiyatBas, hane: kural.fiyatHane, callback: value => {
				let bolen = kural.fiyatBolen; value = asFloat(value) || null;
				if (value && bolen) { value /= roundToFra(bolen, fiyatFra) || null }
				value = value ? roundToFra(value, fiyatFra) : value; this.fiyat = value || this.fiyat || null
			} });
			return true
		}
	}
})()
