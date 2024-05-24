(function() {
	window.CETSatisKosul = class extends window.MQCogul {
		/*
			SELECT		DISTINCT kos.kosulTip, kos.kod kosulKod, kos.tarihBasi, kos.tarihSonu,
							kMus.kod mustKod, stk.kod stokKod
				FROM	mst_KosulOrtak kos, mst_KosulMusteriler kMus,
							mst_KosulStoklar stk, mst_Cari car
				WHERE	kos.kosulTip = kMus.kosulTip AND kos.kod = kMus.kosulKod
				AND		kos.kosulTip = stk.kosulTip AND kos.kod = stk.kosulKod
				AND		kMus.kod = car.kod LIMIT 10;
		*/

		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				id: e.kod || e.id || '',
				aciklama: e.aciklama || '',
				vioID: e.vioID || 0,
				isaretDurumu: e.isaretDurumu || '',
				ozelMusteriListesiVarmi: asBool(e.ozelMusteriListesiVarmi),
				iskontoYapilmazmi: asBool(e.iskontoYapilmazmi),
				promosyonYapilmazmi: asBool(e.promosyonYapilmazmi),
				kapsam: e.kapsam || {}
			});
		}

		static get table() { return 'mst_KosulOrtak' }
		static get tableAlias() { return 'kos' }
		static get idSaha() { return 'kod' }
		static get kosulTip() { return '' }
		static get kosulDetayEkSahalar() {
			return [ 'enDusukFiyat' ]
		}
		get kosulTip() { return this.class.kosulTip }

		static get kosulSiniflari() {
			if (this._kosulSiniflari == null) {
				this._kosulSiniflari = [
					CETFiyatKosul,
					CETIskontoKosul,
					CETKampanyaKosul,
					CETMalFazlasiKosul
				]
			}

			return this._kosulSiniflari;
		}


		static kosulTip2Sinif(e) {
			e = e || {};
			let _kosulTip2Sinif = this._kosulTip2Sinif;
			if (_kosulTip2Sinif == null) {
				_kosulTip2Sinif = this._kosulTip2Sinif = {};
				const siniflar = this.kosulSiniflari;
				for (let i in siniflar) {
					const sinif = siniflar[i];
					const tip = sinif.kosulTip;
					if (tip)
						_kosulTip2Sinif[tip] = sinif;
				}
			}

			let tip = e.kosulTip || e.tip || e;
			return _kosulTip2Sinif[tip];
		}

		static async tip2KosulYapilari(e) {
			e = e || {};
			if (typeof e != 'object')
				e = { kod: e };
			
			const dbMgr = e.dbMgr || this.dbMgr;
			let tipListe = e.kosulTip || e.tip || null;
			if (tipListe && !$.isArray(tipListe))
				tipListe = [tipListe];
			
			let idListe = e.kod || e.id || null;
			if (idListe && !$.isArray(idListe))
				idListe = [idListe];
			
			let _e = $.extend({}, e, { tipListe: tipListe, idListe: idListe, kapsam: e.kapsam });
			_e.cariRec = await this.tip2KosulYapilari_gerekirseCariEkBilgiler(_e);
			
			let stm = this.tip2KosulYapiStm(_e);
			if (!stm)
				return null;
			
			const istenenKapsam = e.kapsam;
				// ** önce Fiyat Koşulları gelir
			let recs = await dbMgr.executeSqlReturnRows({ tx: e.tx, query: stm });
			let result = {};
			// let iskontoYapilirmi = true;
			for (let i in recs) {
				const rec = recs[i];
				const {kosulTip} = rec;
				//if (!result[kosulTip]) {
					/*if (!iskontoYapilirmi && (kosulTip == 'SB' || kosulTip == 'KM'))
						continue;*/

					const kosulSinif = this.kosulTip2Sinif(kosulTip);
					if (kosulSinif) {
						const kosul = new kosulSinif({ id: rec.id || rec.kod });
						await kosul.setValues({ rec: rec });
						
						if ($.isEmptyObject(istenenKapsam) || await kosul.uygunmu(istenenKapsam)) {
							let liste = result[kosulTip] = result[kosulTip] || [];
							liste.push(kosul);
							
							/*if (kosulTip == 'FY' && kosul.iskontoYapilmazmi)
								iskontoYapilirmi = false;*/
						}
					}
				//}
			}

			return result;
		}

		static tip2KosulYapiStm(e) {
			e = e || {};
			let sent = new MQSent({
				from: `${this.table} kos`,
				sahalar: [
					`(case
							when kos.kosulTip = 'FY' then 1
							when (kos.kosulTip = 'SB' OR kos.kosulTip = 'KM') then 2
							else 99
						end) oncelik`,
					`kos.*`
				]
			});
			let tipListe = e.kosulTipListe || e.tipListe;
			if (tipListe)
				sent.where.inDizi(tipListe, 'kos.kosulTip');
			if (e.idListe)
				sent.where.inDizi(e.idListe, 'kos.kod');
			
			const istenenKapsam = e.kapsam;
			if (!$.isEmptyObject(istenenKapsam)) {
		/* !! tarih kismina kapsam.uygunmu(...) kisminda bakilir */
				/*const tarih = istenenKapsam.tarih;
				if (tarih) {
					const tarihClause = MQSQLOrtak.sqlDegeri(tarih);
					sent.where.addAll([
						`(kos.tarihBasi = '' OR kos.tarihBasi <= ${tarihClause})`,
						`(kos.tarihSonu = '' OR ${tarihClause} <= kos.tarihSonu)`
					]);
				}*/

				const cariRec = e.cariRec || {};
				const cariKod = istenenKapsam.cari;
				const cariTipKod = istenenKapsam.cariTip || cariRec.tipKod;
				const cariBolgeKod = istenenKapsam.cariBolge || cariRec.bolgeKod;
				const kosulGrupKod = istenenKapsam.cariKosulGrup || cariRec.kosulGrupKod;
				
				if (cariKod || cariTipKod || cariBolgeKod || kosulGrupKod) {
					const cariKodClause = MQSQLOrtak.sqlDegeri(cariKod);
					sent.leftJoin({
						alias: `kos`, from: `mst_KosulMusteriler mus`,
						on: [
							`kos.kosulTip = mus.kosulTip`, `kos.kod = mus.kosulKod`,
							`mus.kod = ${cariKodClause}`
						]
					});
					sent.where.add(new MQOrClause([
				/* cariKod icin ozel musteri listesi var ise sadece buna bakilir */
						new MQSubWhereClause([
							`kos.ozelMusteriListesiVarmi <> 0`,
							`mus.kod is not null`
						]),
							/* ... OR .... */
				/* 	aksinde secim araliklarindan belirtilenler arasinda istenen kapsamlara uygun olanlara bakilir */
						new MQSubWhereClause([
							`kos.ozelMusteriListesiVarmi = 0`,
							new MQOrClause([
								new MQSubWhereClause([
									cariKod ? `1 = 1` : `1 = 2`,
									`(kos.cariBasi = '' OR kos.cariBasi <= ${cariKodClause})`,
									`(kos.cariSonu = '' OR ${cariKodClause} <= kos.cariSonu)`
								]),
								new MQSubWhereClause([
									cariTipKod ? `1 = 1` : `1 = 2`,
									`(kos.cariTipBasi = '' OR kos.cariTipBasi <= ${MQSQLOrtak.sqlDegeri(cariTipKod)})`,
									`(kos.cariTipSonu = '' OR ${MQSQLOrtak.sqlDegeri(cariTipKod)} <= kos.cariTipSonu)`
								]),
								new MQSubWhereClause([
									cariBolgeKod ? `1 = 1` : `1 = 2`,
									`(kos.cariBolgeBasi = '' OR kos.cariBolgeBasi <= ${MQSQLOrtak.sqlDegeri(cariBolgeKod)})`,
									`(kos.cariBolgeSonu = '' OR ${MQSQLOrtak.sqlDegeri(cariBolgeKod)} <= kos.cariBolgeSonu)`
								]),
								new MQSubWhereClause([
									kosulGrupKod ? `1 = 1` : `1 = 2`,
									`(kos.cariKosulGrupBasi = '' OR kos.cariKosulGrupBasi <= ${MQSQLOrtak.sqlDegeri(kosulGrupKod)})`,
									`(kos.cariKosulGrupSonu = '' OR ${MQSQLOrtak.sqlDegeri(kosulGrupKod)} <= kos.cariKosulGrupSonu)`
								]),
							])
						])
					]));
				}
				
				/*if (!$.isEmptyObject(cariRec)) {
					let value = istenenKapsam.cariTip || cariRec.tipKod;
					if (value) {
						const kodClause = MQSQLOrtak.sqlDegeri(value);
						sent.where.addAll([
							`(kos.cariTipBasi = '' OR kos.cariTipBasi <= ${kodClause})`,
							`(kos.cariTipSonu = '' OR ${kodClause} <= kos.cariTipSonu)`
						]);
					}
					value = istenenKapsam.cariBolge || cariRec.bolgeKod;
					if (value) {
						const kodClause = MQSQLOrtak.sqlDegeri(value);
						sent.where.addAll([
							`(kos.cariBolgeBasi = '' OR kos.cariBolgeBasi <= ${kodClause})`,
							`(kos.cariBolgeSonu = '' OR ${kodClause} <= kos.cariBolgeSonu)`
						]);
					}
					value = istenenKapsam.cariKosulGrup || cariRec.kosulGrupKod;
					if (value) {
						const kodClause = MQSQLOrtak.sqlDegeri(value);
						sent.where.addAll([
							`(kos.cariKosulGrupBasi = '' OR kos.cariKosulGrupBasi <= ${kodClause})`,
							`(kos.cariKosulGrupSonu = '' OR ${kodClause} <= kos.cariKosulGrupSonu)`
						]);
					}
				}*/
			}
			
			let stm = new MQStm({
				sent: sent,
				orderBy: [`oncelik`, `tarihBasi DESC`, `ozelMusteriListesiVarmi DESC`, `kod DESC`, `tarihSonu`]
			})

			return stm;
		}

		static async tip2KosulYapilari_gerekirseCariEkBilgiler(e) {
			const istenenKapsam = e.kapsam;
			if ($.isEmptyObject(istenenKapsam))
				return null;
			
			const cariKod = istenenKapsam.cari;
			if (!cariKod)
				return null;
			
			let rec = await MQCogul.getCariEkBilgi({ tx: e.tx, mustKod: cariKod });
			return rec;
		}


		/*hostVars(e) {
			return $.extend(super.hostVars(e) || {}, {
				kosulTip: this.class.kosulTip,
				// kod: this.id,
				aciklama: this.aciklama || '',
				vioID: this.vioID || 0,
				isaretDurumu: this.isaretDurumu || '',
				ozelMusteriListesiVarmi: asBool(this.ozelMusteriListesiVarmi),
				iskontoYapilmazmi: asBool(this.iskontoYapilmazmi),
				promosyonYapilmazmi: asBool(this.promosyonYapilmazmi)
			});
		}*/

		async setValues(e) {
			let rec = e.rec || e;
			await super.setValues(e);
			$.extend(this, {
				id: rec.kod || rec.id || '',
				aciklama: rec.aciklama || '',
				vioID: rec.vioID || 0,
				isaretDurumu: rec.isaretDurumu || '',
				ozelMusteriListesiVarmi: asBool(rec.ozelMusteriListesiVarmi),
				iskontoYapilmazmi: asBool(rec.iskontoYapilmazmi),
				promosyonYapilmazmi: asBool(rec.promosyonYapilmazmi)
			});

			let kapsam = this.kapsam = new CETSatisKosulKapsam();
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
			bsEkle({ key: 'cariKosulGrup' });
			bsEkle({ key: 'plasiyer' });
			bsEkle({ key: 'plasiyerTip' });
			bsEkle({ key: 'plasiyerBolge' });
		}

		async uygunmu(e) {
			e = $.extend({}, e);
			const cariKod = e.cari;
			const kapsam = this.kapsam || {};

			let {ozelMusteriListesiVarmi} = this;
			if (ozelMusteriListesiVarmi) {
				if (!cariKod)
					return false;
				delete e.cari;
			}

			e._kosul = this;
			e._ozelMusteriListesiVarmi = this.ozelMusteriListesiVarmi;
			
			let result = kapsam.uygunmu ? kapsam.uygunmu(e) : true;
			if (!result)
				return result;
			
			const {dbMgr} = this;
			if (ozelMusteriListesiVarmi) {
				if (!cariKod)
					return false;
				
				let sent = new MQSent({
					from: 'mst_KosulMusteriler',
					sahalar: 'COUNT(*) sayi'
				});
				sent.where.degerAta(this.class.kosulTip, 'kosulTip');
				sent.where.degerAta(this.id, 'kosulKod');
				sent.where.degerAta(cariKod, 'kod');

				let sayi = asInteger(await dbMgr.tekilDegerExecuteSelect(sent));
				if (!sayi)
					return false;
			}
			
			return true;
		}

		static async kosullarIcinStokGrupBilgi(e) {
			const {app} = sky;
			const {caches} = app;
			const dbMgr = e.dbMgr || this.dbMgr;
			const {stokKod, grupKod} = e;
			
			const {kosulTip} = this;
			const _kosulKod = e.kosulKod || e.kosulKodListe;
			const kosulKodListe = $.isArray(_kosulKod) ? _kosulKod : [_kosulKod];
			
			const anah = [kosulTip, kosulKodListe.join(`;`), stokKod, grupKod].join(`$`);
			const anah2KosulStokGrupBilgi = caches.satisKosul_anah2KosulStokGrupBilgi = caches.satisKosul_anah2KosulStokGrupBilgi || {};
			let result = anah2KosulStokGrupBilgi[anah];
			if (result === undefined) {
				const ortakSentOlustur = e => {
					let ekSahalar = $.merge(this.kosulDetayEkSahalar || [], e.ekSahalar || []);
					ekSahalar = ekSahalar.map(saha => saha.includes('.') ? saha : `det.${saha}`);

					let sent = new MQSent({
						from: `${e.table} det`,
						fromIliskiler: [
							{ from: `${this.table} kos`, iliski: `det.kosulTip = kos.kosulTip AND det.kosulKod = kos.kod` }
						],
						sahalar: $.merge(
							$.merge([`'${e.tip || ''}' detTip`, `kos.kod kosulKod`, 'det.kod', 'det.markaKod'], ekSahalar),
							[`kos.iskontoYapilmazmi`, `kos.promosyonYapilmazmi`])
					});
					if (kosulTip)
						sent.where.degerAta(kosulTip,  `det.kosulTip`);
					if (kosulKodListe)
						sent.where.inDizi(kosulKodListe, `det.kosulKod`);
					sent.where.degerAta(e.kod, `det.kod`);

					return sent;
				}

				let uni = new MQUnionAll();
				if (stokKod)
					uni.add(ortakSentOlustur({ tip: 'stok', table: 'mst_KosulStoklar', kod: stokKod }));
				if (grupKod)
					uni.add(ortakSentOlustur({ tip: 'grup', table: 'mst_KosulStokGruplar', kod: grupKod }));

				let stm = new MQStm({ sent: uni, orderBy: ['detTip'] });
				let recs = await dbMgr.executeSqlReturnRows({ tx: e.tx, query: stm });
				const kosulKod2Recs = {};
				result = null;
				if (!$.isEmptyObject(recs)) {
					if (recs.length == 1) {
						result = recs[0];
					}
					else {
						for (let i = 0; i < recs.length; i++) {
							const rec = recs[i];
							const {kosulKod} = rec;
							const _recs = kosulKod2Recs[kosulKod] = kosulKod2Recs[kosulKod] || [];
							_recs.push(rec);
						}

						for (let i in kosulKodListe) {
							const kosulKod = kosulKodListe[i]
							const _recs = kosulKod2Recs[kosulKod];
							if (!$.isEmptyObject(_recs)) {
								result = _recs[0];
								break;
							}
						}
					}
				}
				
				if (result !== undefined)
					anah2KosulStokGrupBilgi[anah] = result;
			}

			return result;
		}
	}
})()
