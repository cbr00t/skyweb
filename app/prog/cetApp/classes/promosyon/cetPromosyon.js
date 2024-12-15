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
		static get table() { return 'mst_Promosyon' } static get tableAlias() { return 'pro' } static get idSaha() { return 'kod' }
		static get proTip() { return null } static get stokSecimlimi() { return false }
		static get proSiniflari() {
			if (this._proSiniflari == null) this._proSiniflari = [
				CETPromosyon_CIRO1, CETPromosyon_STOK1, CETPromosyon_STOK2, CETPromosyon_GRUP3, CETPromosyon_GRUP1, CETPromosyon_GRUP2, CETPromosyon_OGRP1
			]
			return this._proSiniflari
		}
		constructor(e) {
			e = e || {}; super(e);
			for (const key of ['id', 'aciklama', 'veriTipi', 'oncelik', 'vGrupKod', 'vStokKod', 'vBrm', 'hedefTipi', 'hGrupKod', 'hStokKod', 'hBrm']) { this[key] = e[key] || '' }
			for (const key of ['vioID', 'vMiktar', 'vCiro', 'hMiktar', 'hDipIsk']) { this[key] = asFloat(e[key]) || 0 }
			for (const key of ['vCiroKdvlimi', 'detayliMusterimi', 'kademelimi']) { this[key] = asBool(e[key]) }
			$.extend(this, { hMFVarsaSatirIskKapatmi: asBool(e.hMFVarsaSatirIskKapatmi || e.hMFVarsaSatirIskKapat), kapsam: e.kapsam || {} });
		}
		static proTip2Sinif(e) {
			e = e || {}; let _proTip2Sinif = this._proTip2Sinif; if (_proTip2Sinif == null) {
				_proTip2Sinif = this._proTip2Sinif = {}; const siniflar = this.proSiniflari;
				for (let cls of siniflar) { const tip = cls.proTip; if (tip) { _proTip2Sinif[tip] = cls } }
			}
			const tip = e.proTip ?? e.tip ?? e; return _proTip2Sinif[tip]
		}
		static async tip2ProYapilari(e) {
			e = e || {}; if (typeof e != 'object') e = { kod: e }
			const dbMgr = e.dbMgr || this.dbMgr, {kapsam} = e;
			let tipListe = e.proTip || e.tip || null; if (tipListe && !$.isArray(tipListe)) tipListe = [tipListe]
			let idListe = e.kod || e.id || null; if (idListe && !$.isArray(idListe)) { idListe = [idListe] }
			let _e = $.extend({}, e, { tipListe, idListe, kapsam }); _e.cariRec = await this.tip2ProYapilari_gerekirseCariEkBilgiler(_e);
			let stm = this.tip2ProYapiStm(_e); if (!stm) { return null } let recs = await dbMgr.executeSqlReturnRows({ tx: e.tx, query: stm });
			const result = {}, proTip2Kod2Inst = {}, uygunProKodSet = {}, istenenKapsam = kapsam;
			for (let i = 0; i < recs.length; i++) {
				const rec = recs[i], {proTip} = rec, proKod = rec.kod, sinif = this.proTip2Sinif(proTip);
				if (sinif) {
					let inst = new sinif({ id: proKod }); await inst.setValues({ rec });
					if ($.isEmptyObject(istenenKapsam) || await inst.uygunmu(istenenKapsam)) {
						const liste = result[proTip] = result[proTip] || []; liste.push(inst);
						if (inst.kademelimi) {
							const proKod2Inst = proTip2Kod2Inst[proTip] = proTip2Kod2Inst[proTip] || {};
							proKod2Inst[proKod] = inst; uygunProKodSet[proKod] = true
						}
					}
				}
			}
			recs = await this.proIcinKademeler({ tx: e.tx, proTipListe: Object.keys(proTip2Kod2Inst), proKodListe: Object.keys(uygunProKodSet) });
			for (let i = 0; i < recs.length; i++) {
				const rec = recs[i], proKod2Inst = proTip2Kod2Inst[rec.proTip] || {}, inst = proKod2Inst[rec.proKod];
				if (inst?.kademelimi) { const kademeler = inst.kademeler = inst.kademeler || []; kademeler.push(rec) }
			}
			return result
		}
		static tip2ProYapiStm(e) {
			e = e || {}; const istenenKapsam = e.kapsam;
			let sent = new MQSent({
				from: `${this.table} pro`,
				sahalar: [ /* .. GRUP3, GRUP1, GRUP2 sırası doğrudur .. */
					`(case
							when pro.proTip = 'CIRO1' then 1 when pro.proTip = 'CIRO2' then 2 when pro.proTip = 'STOK1' then 3
							when pro.proTip = 'STOK2' then 4 when pro.proTip = 'STOK3' then 5 when pro.proTip = 'GRUP3' then 6
							when pro.proTip = 'GRUP1' then 7 when pro.proTip = 'GRUP2' then 8 else 99
						end) tipOncelik`,
					'pro.*'
				]
			});
			let tipListe = e.proTipListe || e.tipListe; if (tipListe) { sent.where.inDizi(tipListe, 'pro.proTip') }
			if (e.idListe) { sent.where.inDizi(e.idListe, 'pro.kod') }
			if (!$.isEmptyObject(istenenKapsam)) {
				const cariKod = istenenKapsam.cari;
				if (cariKod) {
					const kodClause = MQSQLOrtak.sqlDegeri(cariKod);
					sent.leftJoin({ alias: 'pro', from: `mst_PromosyonMusteri mus`, on: [`pro.proTip = mus.proTip`, `pro.kod = mus.proKod`, `mus.kod = ${kodClause}`] });
					sent.where.add(new MQOrClause([
						new MQSubWhereClause([`pro.detayliMusterimi <> 0`, `mus.kod is not null`]),
						new MQSubWhereClause([`pro.detayliMusterimi = 0`, new MQSubWhereClause([`(pro.cariBasi = '' OR pro.cariBasi <= ${kodClause})`, `(pro.cariSonu = '' OR ${kodClause} <= pro.cariSonu)`])])
					]))
				}
				const {cariRec} = e;
				if (!$.isEmptyObject(cariRec)) {
					let value = istenenKapsam.cariTip ?? cariRec.tipKod;
					if (value) {
						const kodClause = MQSQLOrtak.sqlDegeri(value);
						sent.where.addAll([`(pro.cariTipBasi = '' OR pro.cariTipBasi <= ${kodClause})`, `(pro.cariTipSonu = '' OR ${kodClause} <= pro.cariTipSonu)`])
					}
					value = istenenKapsam.cariBolge ?? cariRec.bolgeKod;
					if (value) {
						const kodClause = MQSQLOrtak.sqlDegeri(value);
						sent.where.addAll([`(pro.cariBolgeBasi = '' OR pro.cariBolgeBasi <= ${kodClause})`, `(pro.cariBolgeSonu = '' OR ${kodClause} <= pro.cariBolgeSonu)`])
					}
					value = istenenKapsam.cariKosulGrup ?? cariRec.kosulGrupKod;
					if (value) {
						const kodClause = MQSQLOrtak.sqlDegeri(value);
						sent.where.addAll([`(pro.cariKosulGrupBasi = '' OR pro.cariKosulGrupBasi <= ${kodClause})`, `(pro.cariKosulGrupSonu = '' OR ${kodClause} <= pro.cariKosulGrupSonu)`])
					}
				}
			}
			return new MQStm({ sent: sent, orderBy: ['tarihBasi DESC', 'oncelik', 'tarihSonu', 'kod'] })
		}
		static async tip2ProYapilari_gerekirseCariEkBilgiler(e) {
			const dbMgr = e.dbMgr ?? this.dbMgr, istenenKapsam = e.kapsam; if ($.isEmptyObject(istenenKapsam)) return null
			const cariKod = istenenKapsam.cari; if (!cariKod) return null;
			const cariKod2EkBilgi = this.cariKod2EkBilgi = this.cariKod2EkBilgi || {}; let rec = cariKod2EkBilgi[cariKod]; if (rec !== undefined) return rec
			let sent = new MQSent({ from: `mst_Cari car`, where: [ { degerAta: cariKod, saha: `car.kod` } ], sahalar: [ `car.kod`, `car.tipKod`, `car.bolgeKod`, 'car.kosulGrupKod' ] });
			rec = await dbMgr.tekilExecuteSelect({ tx: e.tx, query: new MQStm({ sent }) }); cariKod2EkBilgi[cariKod] = rec;
			return rec
		}
		async setValues(e) {
			await super.setValues(e); let rec = e.rec ?? e;
			this.id = rec.kod ?? rec.id ?? '';
			for (const key of ['aciklama', 'veriTipi', 'vGrupKod', 'vStokKod', 'vBrm', 'hedefTipi', 'hGrupKod', 'hStokKod', 'hBrm']) { this[key] = rec[key] || '' }
			for (const key of ['vioID', 'oncelik']) { this[key] = asInteger(rec[key]) || 0 }
			for (const key of ['vMiktar', 'vCiro', 'hMiktar', 'hDipIsk']) { this[key] = asFloat(rec[key]) || 0 }
			for (const key of ['vCiroKdvlimi', 'detayliMusterimi', 'kademelimi']) { this[key] = asBool(rec[key]) }
			$.extend(this, { hMFVarsaSatirIskKapatmi: asBool(rec.hMFVarsaSatirIskKapat) }); let kapsam = this.kapsam = new CETPromosyonKapsam();
			const convertedValue = e => { const {value} = e; return e.converter ? e.converter.call(this, value, e) : value };
			const bsEkle = ({ key, converter }) => {
				let item = kapsam[key] = { basi: convertedValue({ value: rec[`${key}Basi`], converter: e.converter }), sonu: convertedValue({ value: rec[`${key}Sonu`], converter }), };
				return item
			};
			bsEkle({ key: 'tarih', converter: value => value ? asDate(value) : value });
			bsEkle({ key: 'cari' }); bsEkle({ key: 'cariTip' }); bsEkle({ key: 'cariBolge' });
			bsEkle({ key: 'cariKosulGrup' }); bsEkle({ key: 'plasiyer' })
		}
		async uygunmu(e) {
			e = $.extend({}, e); let cariKod = e.cari, kapsam = this.kapsam || {}; const {dbMgr, detayliMusterimi} = this;
			if (detayliMusterimi) { if (!cariKod) { return false } delete e.cari }
			let result = kapsam.uygunmu ? kapsam.uygunmu(e) : true; if (!result) { return result }
			if (detayliMusterimi) {
				if (!cariKod) { return false }
				let sent = new MQSent({ from: 'mst_PromosyonMusteri', sahalar: 'COUNT(*) sayi' });
				sent.where.degerAta(this.class.proTip, 'proTip'); sent.where.degerAta(this.id, 'proKod'); sent.where.degerAta(cariKod, 'kod');
				let sayi = asInteger(await dbMgr.tekilDegerExecuteSelect(sent)); if (!sayi) return false
			}
			return true
		}
		static async proIcinKademeler(e) {
			let _proTip = e.proTip || e.proTipListe, _proKod = e.proKod || e.proKodListe;
			const proTipListe = $.isArray(_proTip) ? _proTip : [_proTip], proKodListe = $.isArray(_proKod) ? _proKod : [_proKod];
			let sent = new MQSent({ from: 'mst_PromosyonKademe kad', sahalar: ['kad.proTip', 'kad.proKod', 'kad.eKadar', 'kad.seq', 'kad.mfAdet'] });
			if (!$.isEmptyObject(proTipListe)) { sent.where.inDizi(proTipListe, 'kad.proTip') }
			if (!$.isEmptyObject(proKodListe)) { sent.where.inDizi(proKodListe, 'kad.proKod') }
			const recs = await this.dbMgr.executeSqlReturnRows({ tx: e.tx, query: new MQStm({ sent, orderBy: ['proTip', 'proKod', 'eKadar DESC', 'seq DESC'] }) }); return recs
		}
		async promosyonSonucu(e) {
			let result = await this._promosyonSonucu(e); const proDet = result?.proDet;
			if (proDet) { if (!proDet.promoKod) { proDet.promoKod = this.id; await proDet.detayEkIslemler_ekle(e) } }
			const {shKod2Bilgi} = e; let uygulananStoklar = result?.uygulananStoklar;
			if (typeof uygulananStoklar == 'object' && !$.isArray(uygulananStoklar)) { uygulananStoklar = Object.keys(uygulananStoklar) }
			if (uygulananStoklar) {
				const {hMFVarsaSatirIskKapatmi} = this; for (let shKod of uygulananStoklar) {
					const bilgi = shKod2Bilgi[shKod] || {}; let {detaylar: _detaylar} = bilgi; if (_detaylar) {
						if (!$.isArray(_detaylar)) { _detaylar = bilgi.detaylar = Object.keys(_detaylar) }
						for (const det of _detaylar) { if (hMFVarsaSatirIskKapatmi) { det.iskontoKampanyaReset() } }
					}
				}
				const {proTip} = this.class; for (const shKod of uygulananStoklar) {
					const _detaylar = shKod2Bilgi[shKod]?.detaylar; if (_detaylar) { for (const det of _detaylar) { await det.bedelHesapla(e) } }
					if (proTip != 'OGRP1') { delete shKod2Bilgi[shKod] }
				}
			}
			return result ?? null
		}
		_promosyonSonucu(e) { return null }
		error_ekranVazgecYapildi(e) { e = e || {}; return { isError: true, rc: e.rc || 'vazgecYapildi', errorText: 'Ekrandan ürün seçilmedi' } }
		error_ekranVazgecYapildi_silent(e) { e = $.extend({ rc: 'userAbort' }, e || {}); return this.error_ekranVazgecYapildi(e) }
	}
})()
