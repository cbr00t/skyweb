(function() {
	window.CETUgramaFis = class extends window.MQCogul {
		constructor(e) {
			e = e || {};
			super(e);
			
			$.extend(this, {
				id: e.id || e.rowid,
				tarih: e.tarih || today(),
				aciklama: e.aciklama,
				mustKod: e.mustKod || '',
				nedenKod: e.nedenKod || '',
				nedenAdi: e.nedenAdi
			});
		}

		static get table() { return 'data_UgramaFis' }
		static get tableAlias() { return 'fis' }
		static get fisGirisUISinif() { return CETUgramaGirisPart }
		static get adimTipi() { return 'U' }
		static get aciklama() { return 'Uğrama' }
		static get ugramami() { return true }
		static get iptalDesteklenirmi() { return true }
		static get raporDesteklenirmi() { return true }
		static get silindiGonderildiDesteklermi() { return true }
		static get ugramami() { return true }
		static get tarihKontrolYapilirmi() { return true }

		static queryStm(e) {
			return this.queryStmOrtak($.extend({
				sahalarEkClause: `ned.aciklama nedenAdi`,
				fromWhereArasiEkClause: `LEFT JOIN mst_UgramaNeden ned ON fis.nedenKod = ned.kod`
			}, e))
		}

		static async fromRec(e) {
			e = e || {};
			const rec = e.rec || e;

			let fis = new this({ id: e.id || rec.rowid });
			if (!await fis.yukle())
				return null;

			return fis;
		}

		hostVars(e) {
			e = e || {};

			let _now = now();
			this.erisimZamani = _now;
			
			let hv = super.hostVars();
			$.extend(hv, {
				kayitzamani: Utils.asReverseDateTimeString(this.kayitZamani || _now),
				erisimzamani: Utils.asReverseDateTimeString(this.erisimZamani || _now),
				tarih: Utils.asReverseDateString(this.tarih) || '',
				mustkod: this.mustKod,
				nedenKod: this.nedenKod || '',
				fisaciklama: this.aciklama || ''
			});

			return hv;
		}

		async setValues(e) {
			e = e || {};
			const rec = e.rec;

			await super.setValues(e);
			if (rec.tarih)
				this.tarih = asDate(rec.tarih);
			$.extend(this, {
				kayitZamani: asDate(rec.kayitzamani) || null,
				erisimZamani: asDate(rec.erisimzamani) || null,
				mustKod: rec.mustkod || rec.mustKod || '',
				nedenKod: rec.nedenKod || '',
				nedenAdi: rec.nedenAdi,
				aciklama: rec.fisaciklama || ''
			});
		}

		async onKontrol(e) {
			e = e || {};
			if (!this.mustKod)
				return this.error_onKontrol(`(Müşteri) belirtilmelidir`, 'bos_mustKod');
			let result = parseInt(await this.dbMgr.tekilDegerExecuteSelect({
				tx: e.tx,
				query: `SELECT COUNT(*) sayi FROM mst_Cari WHERE kod = ?`,
				params: [this.mustKod]
			}));
			if (!result)
				return this.error_onKontrol(`(${this.mustKod} kodlu Müşteri) hatalıdır`, 'hatali_mustKod');
			
			if (!this.nedenKod)
				return this.error_onKontrol(`(Uğrama Nedeni) belirtilmelidir`, 'bos_nedenKod');
			result = parseInt(await this.dbMgr.tekilDegerExecuteSelect({
				tx: e.tx,
				query: `SELECT COUNT(*) sayi FROM mst_UgramaNeden WHERE kod = ?`,
				params: [this.nedenKod]
			}));
			if (!result)
				return this.error_onKontrol(`(${this.nedenKod} kodlu Neden) hatalıdır`, 'hatali_nedenKod');
			
			return await super.onKontrol(e);
		}
	};
})()
