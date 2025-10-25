(function() {
	window.MQDetayli = class extends window.MQCogul {
		constructor(e) {
			e = e || {};
			super(e);

			this.yuklendimi = false;
			
			const detaylar = this.detaylar = [];
			const detaySinif = this.class.detaySinif;
			const _detaylar = e.detaylar || [];
			if (_detaylar[0] && !$.isPlainObject(_detaylar[0])) {
				detaylar.push(..._detaylar);
			}
			else {
				for (let index in _detaylar) {
					const det = _detaylar[index];
					if (!det)
						continue;
					
					if ($.isPlainObject(det)) {
						const _detaySinif = this.class.uygunDetaySinif({ detaySinif: detaySinif, rec: det });
						if (_detaySinif) {
							if (!det.seq)
								det.seq = (index + 1);
							det = new _detaySinif(det);
							det.detayEkIslemler_ekle({ fis: this });
						}
						else {
							det = null;
						}
					}

					if (det)
						detaylar.push(det);
				}
			}
		}

		shallowCopy() {
			const inst = super.shallowCopy();
			inst.detaylar = [];
			$.each(this.detaylar || [], (index, value) =>
				inst.detaylar.push(value ? value.shallowCopy ? value.shallowCopy() : $.extend({}, value) : value));

			return inst;
		}
		
		deepCopy(e) {
			const inst = super.deepCopy(e);
			inst.detaylar = [];
			$.each(this.detaylar || [], (index, value) =>
				inst.detaylar.push(value ? value.deepCopy ? value.deepCopy() : $.extend(true, {}, value) : value));

			return inst;
		}

		static get deepCopyAlinmayacaklar() {
			return $.merge(super.deepCopyAlinmayacaklar || [], [
				'detaylar'
			])
		}

		static get detaySinif() { return MQDetay }
		static detaySinif() { return this.class.detaySinif }
		static get detayTable() {
			const sinif = this.detaySinif;
			return sinif ? sinif.table : null
		}

		static detaylarQueryStm(e) {
			e = e || {};
			const detaySinif = e.detaySinif || this.detaySinif;
			const table = e.table || detaySinif.table;
			const idSaha = e.idSaha || this.idSaha;
			const id = e.id || this.id;
			
			return this.queryStmOrtak({ table: table, idSaha: idSaha, id: id, tableAlias: 'har' })
		}

		static uygunDetaySinif(e) {
			return e.detaySinif;
		}

		uygunDetaySinif(e) {
			return this.class.uygunDetaySinif(e)
		}

		static newDetay(e) {
			e = e || {};
			const detaySinif = e.detaySinif || this.detaySinif;
			delete e.detaySinif;
			
			return new detaySinif(e);
		}
		newDetay(e) {
			return this.class.newDetay($.extend({}, e, { detaySinif: this.detaySinif }));
		}

		async getDetaylar(e) {
			if ($.isEmptyObject(this.detaylar))
				await this.detaylariYukle(e);
			return this.detaylar;
		}

		static async baslikOku(e) {
			return await super.oku($.extend({}, e, { headerOnly: true }));
		}

		async yukle(e) {
			e = e || {};
			const {dbMgr} = this;

			const id = e.id || this.id;
			let result = !id || e.rec
				? await super.yukle(e)
				: await super.yukle({ tx: e.tx, id: id, islem: e.islem });
			if (!result)
				return result;
			
			if (!e.headerOnly) {
				result = await this.detaylariYukle({ tx: e.tx, islem: e.islem });
				if (!result)
					return result;
			}

			await this.yukleSonrasi(e);
			return true
		}

		async baslikYukle(e) {
			return await this.yukle($.extend({}, e, { headerOnly: true }));
		}

		async detaylariYukle(e) {
			e = e || {};
			const {dbMgr} = this;
			
			let recs = e.recs || e.detaylar;
			if (!recs) {
				const {detaySinif} = this.class;
				let _e = { idSaha: e.fisIDSaha || detaySinif.fisIDSaha, id: e.id || this.id };
				let stm = this.class.detaylarQueryStm($.extend({}, e, _e));
				if (!stm)
					return false;
				
				recs = await dbMgr.executeSqlReturnRows($.extend({}, e, { query: stm }));
			}

			if (!recs)
				return false;
			
			await this.detaylarSetValues({ recs: recs });
			return true;
		}

		yukleSonrasi(e) {
			e ??= {}; let {islem} = e
			if (islem == 'kopya') {
				let {detaylar} = this
				if (this.uniqueId)
					this.uniqueId = null
				if (detaylar) {
					for (let det of detaylar) {
						if (det.uniqueId)
							det.uniqueId = null
					}
				}
			}
		}

		async kaydetDevam(e) {
			e = e || {};
			const {dbMgr} = this;
			
			// let tx = e.tx || await dbMgr.transaction();
			let result = await super.kaydetDevam(e);
			if (!result)
				return result;

			const idSaha = e.idSaha || this.class.idSaha;
			let id = (e.rs || {}).insertId || this.id;
			if (!id) {
				const stm = new MQStm({
					sent: new MQSent({
						from: this.class.table,
						sahalar: [`MAX(${idSaha}) maxID`]
					})
				})
				const _e = { tx: e.tx, query: stm };
				id = await dbMgr.tekilDegerExecuteSelect(_e);
				if (id == null || id.isError)
					return id;
				this.id = id;
			}
			if (!this.class.idStringmi)
				this.id = id;

			result = await this.detaylariKaydet({ tx: e.tx });
			if (!result)
				return result;

			return true;
		}

		async detaylariKaydet(e) {
			e = e || {};
			const {dbMgr} = this;
			
			let hvListe = await this.detaylarHVListe(e);
			if (!hvListe)
				return false;
			
			const detayTable = e.detayTable || this.class.detayTable;
			const fisIDSaha = e.fisIDSaha || this.class.detaySinif.fisIDSaha;
			const id = e.id || this.id;
			let result;
			if (id) {
				const del = new MQIliskiliDelete({
					from: detayTable,
					where: { degerAta: id, saha: fisIDSaha }
				})
				const _e = $.extend({ tx: e.tx, query: del }, e || {});
				const result = await dbMgr.executeSql(_e);
				if (!result || result.isError)
					return result;
			}
			if (!$.isEmptyObject(hvListe)) {
				const _e = $.extend({
					table: detayTable, hvListe: hvListe, mode: 'replace'
				}, e || {});
				result = await dbMgr.insertOrReplaceTable(_e) || {};
				if (!result || result.isError)
					return result;
				result.rs = _e.rs;
			}

			return true;
		}

		async silDevam(e) {
			const result = await this.detaylariSil(e);
			if (!result || result.isError)
				return result;
			
			return super.silDevam(e);
		}

		async detaylariSil(e) {
			e = e || {};
			const detaySinif = $.isEmptyObject(this.detaylar) ? (this.uygunDetaySinif(e) || this.class.detaySinif) : this.detaylar[0].class;
			const detayTable = (detaySinif || {}).table;
			if (!detayTable)
				return true;				// detay sınıf desteği yoksa silinecek detay da yoktur
			
			const fisIDSaha = e.fisIDSaha || (detaySinif || {}).fisIDSaha || `fissayac`;
			const {serbestModmu} = sky.app;
			let iptalmi = e.iptal || e.iptalmi;
			iptalmi = (iptalmi == null ? !(serbestModmu || this.gecicimi) : asBool(iptalmi));
			if (iptalmi)					// iptalse detaylara dokunma
				return true;

			const {id} = this;
			let result;
			if (id) {
				const del = new MQIliskiliDelete({
					from: detayTable,
					where: { degerAta: id, saha: fisIDSaha }
				})
				const _e = $.extend({ tx: e.tx, query: del }, e || {});
				result = await this.dbMgr.executeSql(_e);
				if (result)
					e.rs = result.rs;
			}
			if (!result || result.isError)
				return result;
			
			return result;
		}

		hostVarsDuzenlenmis(e) {
			e = e || {};
			let hv = super.hostVarsDuzenlenmis(e);
			if (!hv)
				return hv;

			const idSaha = e.idSaha || this.class.idSaha;
			if (idSaha && !this.id)
				delete hv[idSaha];
			
			return hv;
		}

		async setValues(e) {
			await super.setValues(e);
			this.yuklendimi = true;
		}

		detaylarHVListe(e) {
			e = e || {};
			e.fis = this;
			const fisID = e.fisID = this.id;

			let hvListe = [];
			//let maxSeq = 0;
			for (let ind in this.detaylar) {
				ind = asInteger(ind);
				const det = this.detaylar[ind];
				let seq = ind + 1;
				//if (det.seq && det.seq > maxSeq)
				//	maxSeq = seq;
				
				//if (!det.seq)
				//det.seq = ++maxSeq;
				det.seq = seq;
				
				let hv = det.hostVars(e);
				if (hv) {
					let fisIDSaha = det.class.fisIDSaha;
					if (fisIDSaha && fisID && !hv[fisIDSaha])
						hv[fisIDSaha] = fisID;
					hvListe.push(hv);
				}
			}

			return hvListe;
		}

		async detaylarSetValues(e) {
			e = e || {};
			const detaySinif = e.detaySinif || this.class.detaySinif;
			if (!detaySinif)
				return false;
			
			let {recs} = e;
			if (!recs)
				return false;
			
			let detaylar = [];
			for (let i in recs) {
				const rec = recs[i];
				const seq = i + 1;
				let _detaySinif = await this.class.uygunDetaySinif({ tx: e.tx, detaySinif: detaySinif, fis: this, rec: rec, seq: seq, recs: recs });
				if (!_detaySinif)
					throw { isError: true, rc: `classNotFound`, errorText: `Belge için Detay Sınıfı belirlenemedi` };
				
				let det = new _detaySinif();
				await det.setValues({ fis: this, rec: rec, seq: seq });
				detaylar.push(det);
			}
			this.detaylar = detaylar;

			return true;
		}

		getDokumDetaylar(e) {
			return this.detaylar;
		}

		async getDokumDegeriDict(e) {
			return $.extend(await super.getDokumDegeriDict(e) || {}, {
				Miktar({ matbuuForm }) {
					let {app} = sky, {brm2Fra} = app, {detaylar} = this;
					let {normalSahalar: normal} = matbuuForm, {yazdirilabilirmi: okutmaSayisiVarmi} = normal.Detay.okutmaSayisi ?? {};
					let brm2Toplam = {}, brm2MF = {}, topOkutmaSayisi = 0;
					for (let {miktar, brm, malFazlasi, okutmaSayisi} of detaylar) {
						brm = brm || 'AD'; miktar = asFloat(miktar); okutmaSayisi = asFloat(okutmaSayisi);
						let fra = brm2Fra[brm]; if (miktar && fra != null) { miktar = roundToFra(miktar, fra) }
						brm2Toplam[brm] = (brm2Toplam[brm] || 0) + asFloat(miktar) || 0;
						if (malFazlasi) { brm2MF[brm] = (brm2MF[brm] || 0) + asFloat(malFazlasi) || 0 }
						if (okutmaSayisi) { topOkutmaSayisi += okutmaSayisi }
					}
					let result = []; for (let [brm, toplam] of Object.entries(brm2Toplam)) {
						let malFazlasi = brm2MF[brm];
						if (toplam) { result.push(`${numberToString(toplam)}${malFazlasi ? `+${malFazlasi}` : ''} ${brm}`) }
					}
					if (okutmaSayisiVarmi && topOkutmaSayisi) { result.push(`O: ${topOkutmaSayisi}`) }
					return `TOPLAM : ${result.join(' | ')}`
				}
			})
		}
	}
})()
