(function() {
	window.CETBarkodParser_Kuralli = class extends window.CETBarkodParser {
		get formatTipi() { return this.kural?.formatTipi }
		get formatBaslangicmi() { return !this.formatTipi } get formatAyiraclimi() { return this.formatTipi == 'A' }

		constructor(e) {
			e = e || {}; super(e);
			this.kural = e.kural;
		}
		static async kuralFor(e) {
			e = e || {}; const basKod = e.basKod ?? e.kod, barkod = e.barkod; if (!barkod) { return null }
			if (!(this.baslangicKod2Kural && this.ayrisimKurallari)) { await this.barkodKurallariBelirle() }
			let kural = this.baslangicKod2Kural[basKod]; if (kural) { return kural }
			const {ayrisimKurallari} = this; for (const kural of ayrisimKurallari) {
				const {formatTipi, ayiracStr} = kural;
				if (formatTipi && ayiracStr) {
					const kuralAyiracSayi = asInteger(kural.ayiracSayi), barkodAyiracSayi = barkod.split(ayiracStr).length - 1 || 0;
					if (kuralAyiracSayi == barkodAyiracSayi) { return kural }
				}
			}
			return null
		}
		static async barkodKurallariBelirle() {
			const baslangicKod2Kural = this.baslangicKod2Kural = {}, ayrisimKurallari = this.ayrisimKurallari = [], {app} = sky, dbMgr = app.dbMgr_mf, {karmaPaletBarkodBaslangic} = app;
			if (karmaPaletBarkodBaslangic) {
				const parserSinif = CETBarkodParser_KarmaPalet, kuralSinif = parserSinif.getKuralSinif();
				const kural = new kuralSinif({ parserSinif, kod: karmaPaletBarkodBaslangic }); baslangicKod2Kural[karmaPaletBarkodBaslangic] = kural
			}
		/* ayrışım daha önce gelmesi gerekirdi */
			let stm = new MQStm({ sent: new MQSent({ from: 'mst_BarTarti', where: `kod <> ''`, sahalar: '*' }), orderBy: 'kod' });
			let rs = await dbMgr.executeSql(stm);
			for (let i = 0; i < rs.rows.length; i++) {
				const rec = rs.rows[i], parserSinif = CETBarkodParser_Tarti, kuralSinif = parserSinif.getKuralSinif();
				const kural = new kuralSinif($.extend({ parserSinif }, rec)); baslangicKod2Kural[rec.kod] = kural
			}
			stm = new MQStm({ sent: new MQSent({ from: 'mst_BarAyrisim', where: `kod <> ''`, sahalar: '*' }), orderBy: 'kod' });
			rs = await dbMgr.executeSql(stm);
			for (let i = 0; i < rs.rows.length; i++) {
				const rec = rs.rows[i], parserSinif = CETBarkodParser_Ayrisim, {formatTipi} = rec;
				const kuralSinif = parserSinif.getKuralSinif({ formatTipi });
				const kural = new kuralSinif($.extend({ parserSinif }, rec));
				if (formatTipi) { ayrisimKurallari.push(kural) } else { baslangicKod2Kural[rec.kod] = kural }
			}
		}
		async parseDevam(e) { let result = await super.parseDevam(e); if (result) { return result } return false }
		async parseSonrasi(e) {
			let result = await super.parseSonrasi(e); let {kural, brm} = this;
			if (!brm) {
				let _brm = kural == null ? null : (kural.miktarBrm ?? kural.miktarbrm ?? kural.brm);
				if (_brm) { this.brm = brm = _brm }
			}
			return result
		}
		parcaAl(e) {
			if (!e.bas || !e.hane) { return false }
			let value = e.value || this.barkod; /*if (value.length < (e.bas + e.hane - 1)) { return false }*/
			value = value.substr(e.bas - 1, e.hane).trim(); e.callback.call(this, value, { value });
			return true
		}
	}
})();
