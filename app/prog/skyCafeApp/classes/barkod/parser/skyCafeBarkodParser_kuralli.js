(function() {
	window.SkyCafeBarkodParser_Kuralli = class extends window.SkyCafeBarkodParser {
		constructor(e) {
			e = e || {};
			super(e);

			this.kural = e.kural;
		}

		get formatTipi() { return (this.kural || {}).formatTipi }
		get formatBaslangicmi() { return !this.formatTipi }
		get formatAyiraclimi() { return this.formatTipi == 'A' }

		static async kuralFor(e) {
			e = e || {};
			const basKod = e.basKod || e.kod;
			const barkod = e.barkod;
			if (!barkod)
				return null;

			if (!(this.baslangicKod2Kural && this.ayrisimKurallari))
				await this.barkodKurallariBelirle();
			
			let kural = this.baslangicKod2Kural[basKod];
			if (kural)
				return kural;
			
			const {ayrisimKurallari} = this;
			for (let i in ayrisimKurallari) {
				kural = ayrisimKurallari[i];
				const {formatTipi, ayiracStr} = kural;
				if (formatTipi && ayiracStr) {
					const kuralAyiracSayi = asInteger(kural.ayiracSayi);
					const barkodAyiracSayi = barkod.split(ayiracStr).length - 1 || 0;
					if (kuralAyiracSayi == barkodAyiracSayi)
						return kural;
				}
			}

			return null;
		}

		static async barkodKurallariBelirle() {
			const baslangicKod2Kural = this.baslangicKod2Kural = {};
			const ayrisimKurallari = this.ayrisimKurallari = [];

			const dbMgr = sky.app.dbMgr_mf;
			let stm = new MQStm({
				sent: new MQSent({
					from: 'mst_BarTarti',
					where: `kod <> ''`,
					sahalar: '*'
				}),
				orderBy: 'kod'
			});
			let rs = await dbMgr.executeSql(stm.getQueryYapi());
			for (let i = 0; i < rs.rows.length; i++) {
				const rec = rs.rows[i];
				const parserSinif = SkyCafeBarkodParser_Tarti;
				const kuralSinif = parserSinif.getKuralSinif();
				const kural = new kuralSinif($.extend({ parserSinif: parserSinif }, rec));
				baslangicKod2Kural[rec.kod] = kural;
			}
			
			stm = new MQStm({
				sent: new MQSent({
					from: 'mst_BarAyrisim',
					where: `kod <> ''`,
					sahalar: '*'
				}),
				orderBy: 'kod'
			});
			rs = await dbMgr.executeSql(stm.getQueryYapi());
			for (let i = 0; i < rs.rows.length; i++) {
				const rec = rs.rows[i];
				const parserSinif = SkyCafeBarkodParser_Ayrisim;
				const {formatTipi} = rec;
				const kuralSinif = parserSinif.getKuralSinif({ formatTipi: formatTipi });
				const kural = new kuralSinif($.extend({ parserSinif: parserSinif }, rec));
				if (formatTipi)
					ayrisimKurallari.push(kural);
				else
					baslangicKod2Kural[rec.kod] = kural;
			}
		}

		async parseDevam(e) {
			let result = await super.parseDevam(e);
			if (result)
				return result;
			
			return false;
		}

		parcaAl(e) {
			if (!e.bas || !e.hane)
				return false;

			let value = e.value || this.barkod;
			if (value.length < (e.bas + e.hane - 1))
				return false;

			value = value.substr(e.bas - 1, e.hane).trim();
			e.callback.call(this, value, { value: value });

			return true;
		}

		static ortakReset(e) {
			const keys = ['baslangicKod2Kural', 'ayrisimKurallari'];
			
		}
	}
})();
