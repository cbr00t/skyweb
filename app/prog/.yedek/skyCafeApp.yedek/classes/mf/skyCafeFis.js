(function() {
	window.SkyCafeFis = class extends window.MQDetayli {
		constructor(e) {
			e = e || {};
			super(e);

			const _now = now();
			$.extend(this, {
				id: e.id || e.kod,
				orjID: e.orjID || null,
				vioID: e.vioID || e.uzakID || null,
				tipKod: e.tipKod || '',
				kayitZamani: asDate(e.kayitZamani || e.kayitzamani || _now),
				erisimZamani: asDate(e.erisimZamani || e.erisimzamani || _now),
				sonIslemZamani: asDate(e.sonIslemZamani || e.sonislemzamani || _now),
				yazdirildimi: asBool(e.yazdirildimi || e.yazdirildi),
				aktifMasaID: e.aktifMasaID || null,
				tarih: asDate(e.tarih) || today(),
				kapanmaZamani: asDate(e.kapanmaZamani|| e.kapanmazamani) || null,
				aciklama: e.aciklama || '',
				iptalAciklama: e.iptalAciklama || ''
			});
			this.tahsilatYapiReset(e);
			this.id = (this.id || newGUID()).toString();

			/*const _id = parseInt(this.id); 
			if (!isNaN(_id) && _id > 0)
				this.id = _id;*/
			
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
		static get idSaha() { return 'id' }
		static get idStringmi() { return true }

		static detaylarQueryStm(e) {
			e = e || {};
			const {id} = e;
			const idSaha = e.idSaha || `fisID`;
			const sent = new MQSent({
				from: `${this.table} fis`,
				fromIliskiler: [
					{ from: `${this.detayTable} har`, iliski: `har.${idSaha} = fis.id` },
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
				orderBy: [idSaha, `seq`]
			});
			return stm;
		}

		get kapandimi() { return !!this.kapanmaZamani }
		set kapandimi(value) { return this.kapanmaZamani = value ? now() : null };

		get fisSonuc() {
			const {_fisSonuc, detaylar} = this;
			if (_fisSonuc != null)
				return _fisSonuc;
			
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

		get acikSureSn() {
			const _now = now();
			// const kayitZamani = this.kayitZamani || _now;
			const sonIslemZamani = this.sonIslemZamani || _now;
			return (_now - sonIslemZamani) / 1000
		}
		get acikSureDk() {
			return roundToFra((this.acikSureSn || 0) / 60, 1)
		}

		async kaydetDevam(e) {
			const result = await super.kaydetDevam(e);
			return result;
		}

		hostVars() {
			const _now = now();
			const tahsilatYapi = this.tahsilatYapi || {};
			const hv = super.hostVars() || {};
			$.extend(hv, {
				id: this.id ? this.id.toString() : null,
				vioID: this.vioID || null,
				kayitzamani: Utils.asReverseDateTimeString(this.kayitZamani || _now),
				erisimzamani: Utils.asReverseDateTimeString(_now),
				sonislemzamani: Utils.asReverseDateTimeString(this.sonIslemZamani) || '',
				silindi: bool2FileStr(this.devreDisimi || false),
				yazdirildi: bool2FileStr(this.yazdirildimi || false),
				tipKod: this.tipKod,
				aktifMasaID: this.aktifMasaID || '',
				tarih: dateToString(this.tarih),
				kapanmazamani: Utils.asReverseDateTimeString(this.kapanmaZamani) || '',
				fisSonuc: asFloat(this.fisSonuc) || 0,
				tahsilatNakit: asFloat(tahsilatYapi.nakit) || 0,
				tahsilatPOS: asFloat(tahsilatYapi.pos) || 0,
				tahsilatYemekCeki: asFloat(tahsilatYapi.yemekCeki) || 0,
				tahsilatParaUstu: asFloat(tahsilatYapi.paraUstu) || 0,
				aciklama: this.aciklama || '',
				iptalAciklama: this.iptalAciklama || ''
			});
			
			return hv;
		}
		
		async setValues(e) {
			e = e || {};
			await super.setValues(e);
			
			const {rec} = e;
			/*const _id = parseInt(rec.id); 
			if (!isNaN(_id) && _id > 0)
				rec.id = _id;*/
			
			$.extend(this, {
				id: rec.id || null,
				vioID: rec.vioID || null,
				kayitZamani: asDate(rec.kayitzamani) || null,
				erisimZamani: asDate(rec.erisimzamani) || null,
				sonIslemZamani: asDate(rec.sonislemzamani) || null,
				yazdirildimi: asBool(rec.yazdirildi),
				tipKod: rec.tipKod,
				aktifMasaID: rec.aktifMasaID || null,
				tarih: asDate(rec.tarih),
				kapanmaZamani: asDate(rec.kapanmaZamani) || null,
				tahsilatYapi: {
					nakit: asFloat(rec.tahsilatNakit) || 0,
					pos: asFloat(rec.tahsilatPOS) || 0,
					yemekCeki: asFloat(rec.tahsilatYemekCeki) || 0,
					paraUstu: asFloat(rec.tahsilatParaUstu) || 0
				},
				aciklama: rec.aciklama,
				iptalAciklama: e.iptalAciklama || ''
			});
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
				id: this.id || null,
				orjID: this.orjID || null,
				vioID: this.vioID || null,
				kayitZamani: Utils.asReverseDateTimeString(this.kayitZamani) || null,
				erisimZamani: Utils.asReverseDateTimeString(this.erisimZamani) || null,
				sonIslemZamani: Utils.asReverseDateTimeString(this.sonIslemZamani) || null,
				tipKod: this.tipKod || '',
				aktifMasaID: this.aktifMasaID || null,
				tarih: dateToString(this.tarih) || null,
				kapandimi: asBool(this.kapandimi) || false,
				silindimi: asBool(this.devreDisimi) || false,
				kapanmaZamani: Utils.asReverseDateTimeString(this.kapanmaZamani) || null,
				// fisSonuc: this.fisSonuc == null ? null : this.fisSonuc,
				// tahsilatYapi: this.tahsilatYapi || null,
				aciklama: this.aciklama || ''
			}
		}
	}
})()
