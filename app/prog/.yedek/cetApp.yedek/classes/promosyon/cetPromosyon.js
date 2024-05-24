(function() {
	window.CETPromosyon = class extends window.MQCogul {
		/*
			kapsam = { tarih: today(), cari: '1230' };
			pro = (await CETPromosyon.tip2ProYapilari({ kapsam: kapsam })).GRUP1[0];
			uygunmu = await pro.uygunmu({ kapsam: kapsam });
			if (uygunmu && pro.kademelimi)
				kademeler = await pro.class.proIcinKademeler({ proKod: pro.id });
			
			let grupKod = `1`;
			let tamamYapildimi = false;
			await new Promise(resolve => {
				let part = new CETPromoUrunSecimPart({
					proDetaylar: [{
						proKod: `p1`,
						proAdi: `falanca promosyon`,
						proSHGrupKod: grupKod,
						proSHGrupAdi: `PİLİÇ`,
						miktar: 10
					}],
					stokStmDuzenleyici: e => {
						const grupKodClause = e.grupKodClause || `${e.alias}.grupKod`;
						e.stm.sentDo(sent => {
							sent.where
								.degerAta(grupKod, grupKodClause);
						})
					},
					kaydedince: e => {
						tamamYapildimi = true;
						resolve(e.recs)
					},
					geriCallback: e => {
						if (!tamamYapildimi)
							throw { isError: true, rc: 'vazgecYapildi', errorText: 'Ekrandan ürün seçilmedi' }
					}
				});
				part.run()
			});
		*/

		constructor(e) {
			e = e || {};
			super(e);

			['id', 'aciklama',
				'veriTipi', 'vGrupKod', 'vStokKod', 'vBrm',
				'hedefTipi', 'hGrupKod', 'hStokKod', 'hBrm'].forEach(key =>
				this[key] = e[key] || '');
			['vioID', 'vMiktar', 'vCiro', 'hMiktar', 'hDipIsk' ].forEach(key =>
				this[key] = asFloat(e[key]) || 0);
			['vCiroKdvlimi', 'detayliMusterimi', 'kademelimi'].forEach(key =>
				this[key] = asBool(e[key]));
			$.extend(this, {
				hMFVarsaSatirIskKapatmi: asBool(e.hMFVarsaSatirIskKapatmi || e.hMFVarsaSatirIskKapat),
				kapsam: e.kapsam || {}
			});
		}

		static get table() { return 'mst_Promosyon' }
		static get tableAlias() { return 'pro' }
		static get idSaha() { return 'kod' }
		static get proTip() { return null }
		static get stokSecimlimi() { return false }

		static get proSiniflari() {
			if (this._proSiniflari == null) {
				this._proSiniflari = [
					CETPromosyon_CIRO1, /* CETPromosyon_CIRO2, */
					CETPromosyon_STOK1, CETPromosyon_STOK2, /* CETPromosyon_STOK3, */
					CETPromosyon_GRUP3, CETPromosyon_GRUP1, CETPromosyon_GRUP2
				]
			}

			return this._proSiniflari;
		}


		static proTip2Sinif(e) {
			e = e || {};
			let _proTip2Sinif = this._proTip2Sinif;
			if (_proTip2Sinif == null) {
				_proTip2Sinif = this._proTip2Sinif = {};
				const siniflar = this.proSiniflari;
				for (let i in siniflar) {
					const sinif = siniflar[i];
					const tip = sinif.proTip;
					if (tip)
						_proTip2Sinif[tip] = sinif;
				}
			}

			let tip = e.proTip || e.tip || e;
			return _proTip2Sinif[tip];
		}

		static async tip2ProYapilari(e) {
			e = e || {};
			if (typeof e != 'object')
				e = { kod: e };
			
			const dbMgr = e.dbMgr || this.dbMgr;
			let tipListe = e.proTip || e.tip || null;
			if (tipListe && !$.isArray(tipListe))
				tipListe = [tipListe];
			
			let idListe = e.kod || e.id || null;
			if (idListe && !$.isArray(idListe))
				idListe = [idListe];
			
			let _e = $.extend({}, e, { tipListe: tipListe, idListe: idListe, kapsam: e.kapsam });
			_e.cariRec = await this.tip2ProYapilari_gerekirseCariEkBilgiler(_e);

			let stm = this.tip2ProYapiStm(_e);
			if (!stm)
				return null;
			
			let recs = await dbMgr.executeSqlReturnRows({ tx: e.tx, query: stm });
			const result = {};
			const proTip2Kod2Inst = {}, uygunProKodSet = {};
			const istenenKapsam = e.kapsam;
			for (let i = 0; i < recs.length; i++) {
				const rec = recs[i];
				const proTip = rec.proTip;
				const proKod = rec.kod;
				const sinif = this.proTip2Sinif(proTip);
				if (sinif) {
					let inst = new sinif({ id: proKod });
					await inst.setValues({ rec: rec });
					
					if ($.isEmptyObject(istenenKapsam) || await inst.uygunmu(istenenKapsam)) {
						const liste = result[proTip] = result[proTip] || [];
						liste.push(inst);
						
						if (inst.kademelimi) {
							const proKod2Inst = proTip2Kod2Inst[proTip] = proTip2Kod2Inst[proTip] || {};
							proKod2Inst[proKod] = inst;
							uygunProKodSet[proKod] = true;
						}
					}
				}
			}

			recs = await this.proIcinKademeler({
				tx: e.tx,
				proTipListe: Object.keys(proTip2Kod2Inst),
				proKodListe: Object.keys(uygunProKodSet)
			});
			for (let i = 0; i < recs.length; i++) {
				const rec = recs[i];
				const proKod2Inst = proTip2Kod2Inst[rec.proTip] || {};
				const inst = proKod2Inst[rec.proKod];
				if (inst && inst.kademelimi) {
					const kademeler = inst.kademeler = inst.kademeler || [];
					kademeler.push(rec);
				}
			}

			return result;
		}

		static tip2ProYapiStm(e) {
			e = e || {};
			let sent = new MQSent({
				from: `${this.table} pro`,
				sahalar: [
						/* .. GRUP3, GRUP1, GRUP2 sırası doğrudur .. */
					`(case
							when pro.proTip = 'CIRO1' then 1
							when pro.proTip = 'CIRO2' then 2
							when pro.proTip = 'STOK1' then 3
							when pro.proTip = 'STOK2' then 4
							when pro.proTip = 'STOK3' then 5
							when pro.proTip = 'GRUP3' then 6
							when pro.proTip = 'GRUP1' then 7
							when pro.proTip = 'GRUP2' then 8
							else 99
						end) oncelik`,
					'pro.*'
				]
			});
			let tipListe = e.proTipListe || e.tipListe;
			if (tipListe)
				sent.where.inDizi(tipListe, 'pro.proTip');
			if (e.idListe)
				sent.where.inDizi(e.idListe, 'pro.kod');
			
			const istenenKapsam = e.kapsam;
			if (!$.isEmptyObject(istenenKapsam)) {
				/*const tarih = istenenKapsam.tarih;
				if (tarih) {
					const tarihClause = MQSQLOrtak.sqlDegeri(tarih);
					sent.where.addAll([
						`(pro.tarihBasi = '' OR pro.tarihBasi <= ${tarihClause})`,
						`(pro.tarihSonu = '' OR ${tarihClause} <= pro.tarihSonu)`
					]);
				}*/

				const cariKod = istenenKapsam.cari;
				if (cariKod) {
					const kodClause = MQSQLOrtak.sqlDegeri(cariKod);
					sent.leftJoin({
						alias: `pro`, from: `mst_PromosyonMusteri mus`,
						on: [
							`pro.proTip = mus.proTip`, `pro.kod = mus.proKod`,
							`mus.kod = ${kodClause}`
						]
					});
					sent.where.add(new MQOrClause([
						new MQSubWhereClause([
							`pro.detayliMusterimi <> 0`,
							`mus.kod is not null`
						]),
						new MQSubWhereClause([
							`pro.detayliMusterimi = 0`,
							new MQSubWhereClause([
								`(pro.cariBasi = '' OR pro.cariBasi <= ${kodClause})`,
								`(pro.cariSonu = '' OR ${kodClause} <= pro.cariSonu)`
							])
						])
					]));
				}

				const cariRec = e.cariRec;
				if (!$.isEmptyObject(cariRec)) {
					let value = istenenKapsam.cariTip || cariRec.tipKod;
					if (value) {
						const kodClause = MQSQLOrtak.sqlDegeri(value);
						sent.where.addAll([
							`(pro.cariTipBasi = '' OR pro.cariTipBasi <= ${kodClause})`,
							`(pro.cariTipSonu = '' OR ${kodClause} <= pro.cariTipSonu)`
						]);
					}
					value = istenenKapsam.cariBolge || cariRec.bolgeKod;
					if (value) {
						const kodClause = MQSQLOrtak.sqlDegeri(value);
						sent.where.addAll([
							`(pro.cariBolgeBasi = '' OR pro.cariBolgeBasi <= ${kodClause})`,
							`(pro.cariBolgeSonu = '' OR ${kodClause} <= pro.cariBolgeSonu)`
						]);
					}
				}
			}
			
			let stm = new MQStm({
				sent: sent,
				orderBy: [ `oncelik`, 'tarihBasi', 'kod', 'tarihSonu DESC' ]
			});

			return stm;
		}

		static async tip2ProYapilari_gerekirseCariEkBilgiler(e) {
			const istenenKapsam = e.kapsam;
			if ($.isEmptyObject(istenenKapsam))
				return null;
			
			const cariKod = istenenKapsam.cari;
			if (!cariKod)
				return null;
			
			const cariKod2EkBilgi = this.cariKod2EkBilgi = this.cariKod2EkBilgi || {};
			let rec = cariKod2EkBilgi[cariKod];
			if (rec !== undefined)
				return rec;
			
			let sent = new MQSent({
				from: `mst_Cari car`,
				where: [ { degerAta: cariKod, saha: `car.kod` } ],
				sahalar: [ `car.kod`, `car.tipKod`, `car.bolgeKod` ]
			});
			let stm = new MQStm({ sent: sent });
			
			const dbMgr = e.dbMgr || this.dbMgr;
			rec = await dbMgr.tekilExecuteSelect({ tx: e.tx, query: stm });
			cariKod2EkBilgi[cariKod] = rec;
			
			return rec;
		}

		async setValues(e) {
			await super.setValues(e);
			
			let rec = e.rec || e;
			this.id = rec.kod || rec.id || '';
			['aciklama',
				'veriTipi', 'vGrupKod', 'vStokKod', 'vBrm',
				'hedefTipi', 'hGrupKod', 'hStokKod', 'hBrm'].forEach(key =>
				this[key] = rec[key] || '');
			['vioID', 'vMiktar', 'vCiro', 'hMiktar', 'hDipIsk' ].forEach(key =>
				this[key] = asFloat(rec[key]) || 0);
			['vCiroKdvlimi', 'detayliMusterimi', 'kademelimi'].forEach(key =>
				this[key] = asBool(rec[key]));
			$.extend(this, {
				hMFVarsaSatirIskKapatmi: asBool(rec.hMFVarsaSatirIskKapat)
			});

			let kapsam = this.kapsam = new CETPromosyonKapsam();
			const convertedValue = e => {
				let value = e.value;
				return e.converter
						? e.converter.call(this, value, e)
						: value
			}
			const bsEkle = e => {
				let key = e.key;
				let item = kapsam[key] = {
					basi: convertedValue({ value: rec[`${key}Basi`], converter: e.converter }),
					sonu: convertedValue({ value: rec[`${key}Sonu`], converter: e.converter }),
				};
				return item
			};
			bsEkle({ key: 'tarih', converter: value => value ? asDate(value) : value });
			bsEkle({ key: 'cari' });
			bsEkle({ key: 'cariTip' });
			bsEkle({ key: 'cariBolge' });
		}

		async uygunmu(e) {
			e = $.extend({}, e);
			let cariKod = e.cari;
			let kapsam = this.kapsam || {};
			
			const {detayliMusterimi} = this;
			if (detayliMusterimi) {
				if (!cariKod)
					return false;
				delete e.cari;
			}
			
			let result = kapsam.uygunmu ? kapsam.uygunmu(e) : true;
			if (!result)
				return result;
			
			const dbMgr = this.dbMgr;
			if (detayliMusterimi) {
				if (!cariKod)
					return false;
				
				let sent = new MQSent({
					from: 'mst_PromosyonMusteri',
					sahalar: 'COUNT(*) sayi'
				});
				sent.where.degerAta(this.class.proTip, 'proTip');
				sent.where.degerAta(this.id, 'proKod');
				sent.where.degerAta(cariKod, 'kod');

				let sayi = asInteger(await dbMgr.tekilDegerExecuteSelect(sent));
				if (!sayi)
					return false;
			}
			
			return true;
		}

		static async proIcinKademeler(e) {
			let _proTip = e.proTip || e.proTipListe;
			let _proKod = e.proKod || e.proKodListe;
			const proTipListe = $.isArray(_proTip) ? _proTip : [_proTip];
			const proKodListe = $.isArray(_proKod) ? _proKod : [_proKod];
			
			let sent = new MQSent({
				from: `mst_PromosyonKademe kad`,
				sahalar: [`kad.proTip`, `kad.proKod`, `kad.seq`, `kad.eKadar`, `kad.mfAdet`]
			});
			if (!$.isEmptyObject(proTipListe))
				sent.where.inDizi(proTipListe, 'kad.proTip');
			if (!$.isEmptyObject(proKodListe))
				sent.where.inDizi(proKodListe, 'kad.proKod');

			let stm = new MQStm({
				sent: sent,
				orderBy: ['proTip', 'proKod', 'seq DESC']
			});

			const recs = await this.dbMgr.executeSqlReturnRows({ tx: e.tx, query: stm });
			return recs;
		}

		async promosyonSonucu(e) {
			let result = await this._promosyonSonucu(e);
			const proDet = result ? result.proDet : null;
			if (!proDet)
				return proDet;
			
			if (!proDet.promoKod) {
				proDet.promoKod = this.id;
				await proDet.detayEkIslemler_ekle(e);
			}

			const shKod2Bilgi = e.shKod2Bilgi;
			const uygulananStoklar = result.uygulananStoklar || {};
			if (this.hMFVarsaSatirIskKapatmi) {
				for (let shKod in uygulananStoklar) {
					const bilgi = shKod2Bilgi[shKod] || {};
					for (const i in bilgi.detaylar)
						bilgi.detaylar[i].iskontoKampanyaReset();
				}
			}
			for (const shKod in uygulananStoklar)
				delete shKod2Bilgi[shKod];
			
			return result;
		}

		_promosyonSonucu(e) {
			// shKod2Bilgi, grupKod2StokSet, tavsiyeStokKod
		}


		error_ekranVazgecYapildi(e) {
			e = e || {};
			return { isError: true, rc: e.rc || 'vazgecYapildi', errorText: 'Ekrandan ürün seçilmedi' };
		}

		error_ekranVazgecYapildi_silent(e) {
			e = $.extend({ rc: 'userAbort' }, e || {});
			return this.error_ekranVazgecYapildi(e);
		}
	}
})()
