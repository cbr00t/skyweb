(function() {
	window.SkyCafeFis = class extends window.MQDetayli {
		constructor(e) {
			e = e || {};
			super(e);

			const _now = now();
			$.extend(this, {
				id: e.id || e.kod || e.vioID || e.uzakID,
				tipKod: e.tipKod || '',
				kayitZamani: Utils.asReverseDateTimeString(e.kayitZamani || e.kayitzamani || _now),
				erisimZamani: Utils.asReverseDateTimeString(e.erisimZamani || e.erisimzamani || _now),
				sonIslemZamani: Utils.asReverseDateTimeString(e.sonIslemZamani || e.sonislemzamani || _now),
				tarih: asDate(e.tarih) || today(),
				kapanmaZamani: asBool(e.kapanmaZamani || e.kapanmazamani),
				aciklama: e.aciklama
			});
			this.tahsilatYapiReset(e);
			const hasID = this.hasID = !!this.id;
			if (!hasID)
				this.id = newGUID();
			/*const {detaylar} = e;
			const {detaySinif} = this.class;
			if (!$.isEmptyObject(detaylar)) {
				for (const i in detaylar) {
					const _det = detaylar[i];
					this.detaylar.push(new detaySinif(_det));
				}
			}*/
		}
		
		static get iptalDesteklenirmi() { return true }
		static get silindiGonderildiDesteklermi() { return true }
		static get table() { return 'data_RestoranFis' }
		static get detaySinif() { return SkyCafeDetay }
		static get idSaha() { return 'rowid' }

		static detaylarQueryStm(e) {
			e = e || {};
			const {id} = e;
			const idSaha = e.idSaha || `fissayac`;
			const sent = new MQSent({
				from: `${this.table} fis`,
				fromIliskiler: [
					{ from: `${this.detayTable} har`, iliski: `har.${idSaha} = fis.rowid` },
					{ from: `mst_Stok stk`, iliski: `har.stokKod = stk.kod` }
				],
				sahalar: [
					`har.rowid`, `har.*`,
					`stk.aciklama stokAdi`, `stk.kdvOrani`
				]
			});
			if (id)
				sent.where.degerAta(id, `har.${idSaha}`);
			const {tip2FiyatAttr} = SkyCafeUrun;
			for (const tip in tip2FiyatAttr) {
				const fiyatAttr = tip2FiyatAttr[tip];
				sent.sahalar
					.add(`stk.${fiyatAttr}`);
			}
			const stm = new MQStm({
				sent: sent,
				orderBy: [`fissayac`, `seq`]
			});
			return stm;
		}

		async getDetaylar(e) {
			if ($.isEmptyObject(this.detaylar))
				await this.detaylariYukle(e);
			return this.detaylar;
		}

		get kapandimi() { return !!this.kapanmaZamani }
		set kapandimi(value) { return this.kapanmaZamani = value ? now() : null };

		get fisSonuc() {
			const {detaylar} = this;
			let toplam = 0;
			if (detaylar) {
				for (const i in detaylar) {
					const det = detaylar[i];
					if (!det.silindimi)
						toplam += det.netBedel;
				}
			}
			return toplam;
		}

		get acikSureSm() {
			const _now = now();
			const kayitZamani = this.kayitZamani || _now;
			const sonIslemZamani = this.sonIslemZamani || _now;
			return (sonIslemZamani - kayitZamani) / 1000
		}

		get acikSureDk() {
			return roundToFra((this.acikSureSn || 0) / 60, 1)
		}

		async kaydetDevam(e) {
			const result = await super.kaydetDevam(e);
			if (result == true)
				this.hasID = !!this.id;
			
			return result;
		}

		hostVars() {
			const _now = now();
			const tahsilatYapi = this.tahsilatYapi || {};
			const hv = super.hostVars() || {};
			$.extend(hv, {
				// id: this.hasID ? this.id : undefined,
				kayitzamani: Utils.asReverseDateTimeString(this.kayitZamani || _now),
				erisimzamani: Utils.asReverseDateTimeString(_now),
				sonislemzamani: Utils.asReverseDateTimeString(this.sonIslemZamani) || '',
				tipKod: this.tipKod,
				tarih: dateToString(this.tarih),
				kapanmazamani: Utils.asReverseDateTimeString(this.kapanmaZamani) || '',
				fisSonuc: asFloat(this.fisSonuc) || 0,
				tahsilatNakit: asFloat(tahsilatYapi.nakit) || 0,
				tahsilatPOS: asFloat(tahsilatYapi.pos) || 0,
				tahsilatYemekCeki: asFloat(tahsilatYapi.yemekCeki) || 0,
				tahsilatParaUstu: asFloat(tahsilatYapi.paraUstu) || 0,
				aciklama: this.aciklama || ''
			});
			if (!this.hasID)
				delete hv.rowid;
			
			return hv;
		}
		
		async setValues(e) {
			e = e || {};
			await super.setValues(e);
			
			const {rec} = e;
			$.extend(this, {
				id: rec.id || rec.vioID || rec.rowid || null,
				tipKod: rec.tipKod,
				kayitZamani: asDate(rec.kayitzamani) || null,
				erisimZamani: asDate(rec.erisimzamani) || null,
				sonislemzamani: asDate(rec.sonislemzamani) || null,
				tarih: asDate(rec.tarih),
				kapanmaZamani: asDate(rec.kapanmaZamani) || null,
				tahsilatYapi: {
					nakit: asFloat(rec.tahsilatNakit) || 0,
					pos: asFloat(rec.tahsilatPOS) || 0,
					yemekCeki: asFloat(rec.tahsilatYemekCeki) || 0,
					paraUstu: asFloat(rec.tahsilatParaUstu) || 0
				},
				aciklama: rec.aciklama
			});
			this.hasID = !!this.id;
		}

		tahsilatYapiReset(e) {
			e = e || {};
			this.tahsilatYapi = {
				nakit: asFloat(e.tahsilatNakit) || 0,
				pos: asFloat(e.tahsilatPOS) || 0,
				yemekCeki: asFloat(e.tahsilatYemekCeki) || 0,
				paraUstu: asFloat(e.tahsilatParaUstu) || 0
			}
		}

		reduce(e) {
			return {
				id: this.id,
				hasID: this.hasID,
				tipKod: this.tipKod,
				kayitZamani: Utils.asReverseDateTimeString(this.kayitZamani),
				erisimZamani: Utils.asReverseDateTimeString(this.erisimZamani),
				tarih: dateToString(this.tarih),
				kapandimi: this.kapandimi,
				kapanmaZamani: Utils.asReverseDateTimeString(this.kapanmaZamani),
				fisSonuc: this.fisSonuc,
				tahsilatYapi: this.tahsilatYapi,
				aciklama: this.aciklama
			}
		}
	}
})()
