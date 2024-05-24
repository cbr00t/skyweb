(function() {
	window.SkyCafeKategori = class extends window.MQDetayli {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				id: e.id || e.kod || e.vioID || e.uzakID,
				tipKod: e.tipKod || '',
				ustKategoriID: e.ustKategoriID,
				uygunlukPratikSatis: asBool(e.uygunlukPratikSatis),
				uygunlukAdisyon: asBool(e.uygunlukAdisyon),
				uygunlukPaket: asBool(e.uygunlukPaket),
				uygunlukSelfServis: asBool(e.uygunlukSelfServis),
				aciklama: e.aciklama
			});
			/*const {detaylar} = e;
			const {detaySinif} = this.class;
			if (!$.isEmptyObject(detaylar)) {
				for (const i in detaylar) {
					const _det = detaylar[i];
					this.detaylar.push(new detaySinif(_det));
				}
			}*/
		}
		
		static get table() { return 'mst_ResKategori' }
		static get detaySinif() { return SkyCafeKategoriDetay }
		static get idSaha() { return 'vioID' }
		async getDetaylar(e) {
			if ($.isEmptyObject(this.detaylar))
				await this.detaylariYukle(e);
			return this.detaylar;
		}

		async getRefInstListe(e) {
			e = e || {};
			let result = this._refInstListe;
			if (result == null) {
				result = [];
				const detaylar = await this.getDetaylar(e);
				if ($.isEmptyObject(detaylar))
					return this._refInstListe = result = detaylar;
				
				const {app} = sky;
				const {id2Urun} = app;
				const eksikRefIDSet = {};
				for (const i in detaylar) {
					const det = detaylar[i];
					if (!det.grupmu) {
						const {refID} = det;
						if (!id2Urun[refID])
							eksikRefIDSet[refID] = true;
					}
				}

				const tip = app.pratikSatismi ? SkyCafeMasaTip.PratikSatis : e.tip;
				const fiyatAttr = SkyCafeUrun.tip2FiyatAttr[tip];
				const promises = [];
				if (!$.isEmptyObject(eksikRefIDSet)) {
					const dbMgr = app.dbMgr_mf;
					const sent = new MQSent({
						from: `mst_Stok mst`,
						where: [
							{ inDizi: Object.keys(eksikRefIDSet), saha: `mst.kod` }
						],
						sahalar: [`mst.rowid`, `mst.*`]
					});
					/*if (tip)
						sent.where.add(`mst.${fiyatAttr} > 0`);*/
					const stm = new MQStm({ sent: sent });
					const rs = await dbMgr.executeSql({ query: stm });
					for (let i = 0; i < rs.rows.length; i++) {
						const rec = rs.rows[i];
						const {kod} = rec;
						const inst = new SkyCafeUrun();
						promises.push(inst.setValues({ rec: rec }));
						id2Urun[kod] = inst;
					}
				}

				for (const i in detaylar) {
					const det = detaylar[i];
					const {grupmu, refID} = det;
					const target = app[grupmu ? 'id2UrunGrup' : 'id2Urun'];
					const inst = target[refID];
					if (inst)
						result.push(inst);
					/*if (grupmu) {
						result.push(app.id2UrunGrup[refID]);
					}
					else {
						const inst = app.id2Urun[refID];
						if (!inst || (tip && !inst.fiyatFor({ tip: tip })))
							continue;
						result.push(inst);
					}*/
				}
				await Promise.all(promises);
				this._refInstListe = result;
			}
			
			return result;
		}

		tipIcinUygunmu(e) {
			const tip = (typeof e == 'object' ? e.tip : e) || SkyCafeMasaTip.Adisyon;
			switch (tip) {
				case SkyCafeMasaTip.Adisyon:
					return this.uygunlukAdisyon;
				case SkyCafeMasaTip.Paket:
					return this.uygunlukPaket;
				case SkyCafeMasaTip.SelfServis:
					return this.uygunlukSelfServis;
				case SkyCafeMasaTip.PratikSatis:
					return this.uygunlukPratikSatis;
			}
		}

		hostVars() {
			let hv = super.hostVars() || {};
			$.extend(hv, {
				vioID: this.id,
				tipKod: this.tipKod,
				ustKategoriID: this.ustKategoriID || null,
				uygunlukPratikSatis: asInteger(this.uygunlukPratikSatis) || 0,
				uygunlukAdisyon: asInteger(this.uygunlukAdisyon) || 0,
				uygunlukPaket: asInteger(this.uygunlukPaket) || 0,
				uygunlukSelfServis: asInteger(this.uygunlukSelfServis) || 0,
				aciklama: this.aciklama || ''
			});
			
			return hv;
		}
		
		async setValues(e) {
			e = e || {};
			await super.setValues(e);
			
			const {rec} = e;
			$.extend(this, {
				id: rec.kod || rec.id || rec.vioID,
				tipKod: rec.tipKod,
				ustKategoriID: rec.ustKategoriID || null,
				uygunlukPratikSatis: asBool(rec.uygunlukPratikSatis),
				uygunlukAdisyon: asBool(rec.uygunlukAdisyon),
				uygunlukPaket: asBool(rec.uygunlukPaket),
				uygunlukSelfServis: asBool(rec.uygunlukSelfServis),
				aciklama: rec.aciklama
			});
		}

		reduce(e) {
			return {
				id: this.id,
				tipKod: this.tipKod,
				ustKategoriID: this.ustKategoriID || null,
				uygunlukPratikSatis: asBool(this.uygunlukPratikSatis),
				uygunlukAdisyon: asBool(this.uygunlukAdisyon),
				uygunlukPaket: asBool(this.uygunlukPaket),
				uygunlukSelfServis: asBool(this.uygunlukSelfServis),
				aciklama: this.aciklama
			}
		}
	}
})()
