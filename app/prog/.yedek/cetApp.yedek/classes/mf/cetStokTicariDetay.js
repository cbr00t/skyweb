(function() {
	window.CETStokTicariDetay = class extends window.MQDetay {
		constructor(e) {
			e = e || {};
			super(e);
			
			$.extend(this, {
				barkod: e.barkod || null,
				shKod: e.shKod || e.kod,
				shAdi: e.shAdi || e.aciklama || e.adi,
				grupKod: e.grupKod,
				yerKod: e.yerKod,
				miktar: asFloat(e.miktar) || 1,
				brm: e.brm || '',
				paketKod: e.paketKod || '',
				paketMiktar: asFloat(e.paketMiktar) || 0,
				paketIcAdet: 0,
				okutmaSayisi: e.okutmaSayisi || 1,
				satirIskOranSinirVarmi: e.satirIskOranSinirVarmi == null ? null : asBool(e.satirIskOranSinirVarmi),
				satirIskOranSinir: null,
				ekOzelliklerYapi: !e.isCopy && (!e.ekOzelliklerYapi || $.isPlainObject(e.ekOzelliklerYapi))
										? new CETEkOzellikler(e.ekOzelliklerYapi)
										: e.ekOzelliklerYapi,
				iskontoYapilmazmi: true,
				promosyonYapilmazmi: true
			});
			// this.kdvOrani = this.fiyat = this.brutBedel = this.netBedel = this.netFiyat = 0;
			if (this.paketKod) {
				/*if (!this.paketMiktar)
					this.paketMiktar = asFloat(e.carpan) || 1;*/
				this.paketIcAdet = asFloat(e.paketIcAdet || e.carpan) || 0;
				if (this.paketIcAdet && !this.paketMiktar)
					this.miktar2PaketMiktarHesapla(e);
			}
		}

		static get fisSinif() { return CETStokTicariFis }
		static get table() { return 'data_PIFStok' }
		static get detTipi() { return 'S' }
		static get dipIskBedelKullanilirmi() { return false }
		static get promosyonmu() { return false }

		static async getStokEkBilgiStm(e) {
			e = e || {};
			const alias = e.alias || 'stk';
			const {app} = sky;
			const {sonStokKontrolEdilirmi, wsArgs} = e;
			const basitmi = e.basit || e.basitmi;
			const detaylimi = e.detayli || e.detaylimi;
			const fis = e.fis || {};
			const fisSinif = fis.class || {
				fiiliCikismi: true,
				stokKdvSaha: CETTicariFis.stokKdvSaha,
				stokKdvDegiskenmiSaha: CETTicariFis.stokKdvDegiskenmiSaha
			};
			const {fiiliCikismi, stokKdvSaha, stokKdvDegiskenmiSaha} = fisSinif;

			let stkFytInd = (e.cariRow || {}).stkFytInd || (fis || {}).cariStkFytInd;
			if (!stkFytInd) {
				const mustKod = e.mustKod || (e.cariRow || {}).kod || (fis || {}).mustKod;
				if (mustKod)
					stkFytInd = await MQCogul.getCariStkFytInd({ mustKod: mustKod });
			}
			const brmFiyatSaha = stkFytInd ? `satFiyat${stkFytInd}` : `brmFiyat`;
			
			let sent = new MQSent({
				from: `mst_Stok ${alias}`,
				fromIliskiler: [
					{ alias: alias, from: `mst_StokGrup grp`, on: `${alias}.grupKod = grp.kod` },
					{ alias: alias, leftJoin: `mst_BarkodReferans bref`, on: `${alias}.kod = bref.stokKod AND bref.varsayilanmi <> 0` }
				],
				where: [
					// `(bref.varsayilanmi is NULL OR bref.varsayilanmi <> 0)`
					// `bref.varsayilanmi <> 0`
				],
				sahalar: (e.rowCountOnly
					? `COUNT(*) sayi`
					: [
						`${alias}.rowid`, `${alias}.kod`, `${alias}.aciklama`, `${alias}.brm`, `bref.refKod barkod`,
						`${alias}.grupKod`, `grp.aciklama grupAdi`, `grp.anaGrupKod`,
						basitmi ? `NULL yerKod` : `son.yerKod`,
						basitmi ? `NULL sonStok` : `son.miktar sonStok`,
						/*`${sonStokKontrolEdilirmi ? 'son.miktar' : 'NULL'} sonStok`,*/
						(fiiliCikismi
							 ? `${alias}.${brmFiyatSaha} brmFiyat`
							 : `(case when ${alias}.almFiyat == 0 then ${alias}.brmFiyat else ${alias}.almFiyat end) brmFiyat`),
						((stokKdvSaha ? `${alias}.${stokKdvSaha}` : `NULL`) + ` kdvOrani`),
						((stokKdvDegiskenmiSaha ? `${alias}.${stokKdvDegiskenmiSaha}` : `NULL`) + ` kdvDegiskenmi`),
						`${alias}.satirIskOranSinirVarmi`, `${alias}.satirIskOranSinir`
					  ])
			});
			let stm = new MQStm({ sent: sent });
			if (!$.isEmptyObject(wsArgs))
				stm.fromGridWSArgs(wsArgs);
			
			let shKodListe = e.shKod || e.shKodListe;
			if (shKodListe && !$.isArray(shKodListe))
				shKodListe = [shKodListe];
			if (!$.isEmptyObject(shKodListe))
				sent.where.inDizi(shKodListe, `${alias}.kod`);

			if (!basitmi) {
				app.stmSentDuzenle_sonStokBagla({
					stm: stm, alias: alias,
					shKodClause: `${alias}.kod`,
					yerKod: e.yerKod /*|| fis.yerKod*/,
					leftJoin: !sonStokKontrolEdilirmi,
					detaylimi: detaylimi
				});
			}
			
			return stm;
		}

		static async fromBarkodBilgi(e) {
			e = e || {};
			const fis = e.fis || {};
			let det = await super.fromBarkodBilgi(e);
			if (!det)
				return det;
			
			const rec = e.barkodBilgi || e;
			const tip2EkOzellik = (det.ekOzelliklerYapi || {}).tip2EkOzellik;
			if (!$.isEmptyObject(tip2EkOzellik)) {
				const rafKullanilirmi = fis ? fis.class.rafKullanilirmi : false;
				const refRafKullanilirmi = fis ? fis.class.refRafKullanilirmi : false;
				for (const tip in tip2EkOzellik) {
					const ekOzellik = tip2EkOzellik[tip];
					const {idSaha} = ekOzellik;
					if (!rafKullanilirmi && tip == 'raf')
						continue;				// continue loop
					if (!refRafKullanilirmi && tip == 'refRaf')
						continue;				// continue loop
					
					const value = rec[idSaha];
					if (value != null)
						ekOzellik.value = value;
				}
			}
			
			return det;
		}

		static get ekOzelliklerIDSahalar() {
			return ['stokKod', 'yerKod'];
		}

		static get ekOzelliklerTumIDSahalar() {
			return CETEkOzellikler.getEkOzelliklerIdSahalar({ with: this.ekOzelliklerIDSahalar, refRafAlinirmi: true });
		}

		getEkOzelliklerKeyHostVars(e) {
			return CETEkOzellikler.keyHostVarsFrom({
				with: this.class.ekOzelliklerIDSahalar,
				anahtarDegeri: this.getAnahtarDegeri(e)
				// anahtarStr: this.getAnahtarStr()
			})
		}
		
		getEkOzelliklerPrefixAnahtarValues(e) {
			e = e || {};
			const fis = e.fis || {};
			const yerKod = (e.yerKod == null ? this.yerKod || fis.yerKod : e.yerKod) || '';
			return [this.shKod || '', yerKod]
		}

		getAnahtarDegeri(e) {
			e = e || {};
			return this.ekOzelliklerYapi.getAnahtarDegeri({ delim: e.delim || e.anahtarDelim, with: this.getEkOzelliklerPrefixAnahtarValues(e) })
		}
		
		getAnahtarStr(e) {
			e = e || {};
			return this.ekOzelliklerYapi.getAnahtarStr({ delim: e.delim || e.anahtarDelim, anahtarDegeri: this.getAnahtarDegeri(e) })
		}

		getBirlestirIcinAnahtarDegeri(e) {
			let {barkod} = this;
			const {barkodParser} = this;
			if (barkod && barkodParser && barkodParser.ayrisimAyiraclimi && barkodParser.zVarmi) {
				const {kural} = barkodParser;
				const ayiracStr = kural ? kural.ayiracStr : null;
				if (ayiracStr) {
					let parts = barkodParser.barkodParcalar || barkod.split(ayiracStr);
					parts.pop();
					barkod = parts.join(ayiracStr);
				}
			}
			
			return [
				this.getAnahtarStr(e),
				barkod || '',
				this.fiyat || 0,
				this.kdvOrani || 0,
				(this.iskOranListe || []).map(oran => roundToFra(oran, 2)),
				(this.kamOranListe || []).map(oran => roundToFra(oran, 2)),
				(this.ozelKamOranListe || []).map(oran => roundToFra(oran, 2))
			]
		}

		getBirlestirIcinAnahtarStr(e) {
			const anah = this.getBirlestirIcinAnahtarDegeri(e);
			return anah ? anah.join(CETEkOzellikler.anahtarDelim) : ``;
		}

		getAnahtarHVSiparis(e) {
			e = e || {};
			const {app} = sky;
			const almSat = e.almSat || (e.fis ? e.fis.class.almSat : null);
			let hmrKullanilirmi = false;
			if (almSat) {
				switch (almSat) {
					case 'A':
						hmrKullanilirmi = app.depoMalKabulSiparisHMRlimi;
						break;
					case 'T':
						hmrKullanilirmi = app.depoSevkiyatSiparisHMRlimi;
						break;
				}
			}
			else {
				hmrKullanilirmi = app.depoMalKabulSiparisHMRlimi || app.depoSevkiyatSiparisHMRlimi;
			}
			
			
			const hv = { shKod: this.shKod };
			if (hmrKullanilirmi) {
				const {ekOzelliklerYapi} = this;
				if (ekOzelliklerYapi) {
					const excludeSet = asSet(['yer', 'lotNo', 'raf', 'refRaf']);
					const {idSahalarSiparis} = CETEkOzellikler;
					this.ekOzelliklerDo({ callback: e => {
						const {tip, idSaha} = e;
						if (!excludeSet[tip])
							hv[idSaha] = e.value || '';
					} });
				}
			}
			
			return hv;
		}

		getAnahtarDegeriSiparis(e) {
			const hv = this.getAnahtarHVSiparis(e);
			return hv ? Object.values(hv) : null;
		}

		getAnahtarStrSiparis(e) {
			e = e || {};
			const anah = this.getAnahtarDegeriSiparis(e);
			return $.isEmptyObject(anah) ? '' : anah.join(e.delim || e.anahtarDelim || CETEkOzellikler.anahtarDelim)
		}
		
		getAnahtarStr(e) {
			e = e || {};
			return this.ekOzelliklerYapi.getAnahtarStr({ delim: e.delim || e.anahtarDelim, anahtarDegeri: this.getAnahtarDegeri(e) })
		}

		getSadeceOzellikAnahtarDegeri(e) {
			e = e || {};
			return this.ekOzelliklerYapi.getAnahtarDegeri({ delim: e.delim || e.anahtarDelim });
		}

		getSadeceOzellikAnahtarStr(e) {
			e = e || {};
			const anah = this.getSadeceOzellikAnahtarDegeri(e);
			if ($.isEmptyObject(anah))
				return '';
			
			return anah.filter(x => !!x)
						.join(e.delim || e.anahtarDelim || CETEkOzellikler.anahtarDelim)
		}

		get sadeceOzellikAnahtarDegeri() {
			return this.getSadeceOzellikAnahtarDegeri();
		}
		
		get sadeceOzellikAnahtarStr() {
			return this.getSadeceOzellikAnahtarStr();
		}

		static get iskOranKeys() { return [] }
		
		get iskOranVarmi() {
			return this.class.iskOranKeys.find(key => !!this[key])
		}
		
		get iskOranListe() {
			const liste = [];
			const {iskOranKeys} = this.class;
			for (const i in iskOranKeys) {
				const key = iskOranKeys[i];
				const value = this[key];
				if (value)
					liste.push(roundToFra(value, 2));
			}
			
			return liste;
		}
		
		static get kamOranKeys() { return [] }
		
		get kamOranVarmi() {
			return this.class.kamOranKeys.find(key => !!this[key])
		}
		
		get kamOranListe() {
			const liste = [];
			const {kamOranKeys} = this.class;
			for (const i in kamOranKeys) {
				const key = kamOranKeys[i];
				const value = this[key];
				if (value)
					liste.push(roundToFra(value, 2));
			}
			
			return liste;
		}

		static get ozelKamOranKeys() { return [] }

		get ozelKamOranVarmi() {
			return this.class.ozelKamOranKeys.find(key => !!this[key])
		}

		get ozelKamOranListe() {
			const liste = [];
			const {ozelKamOranKeys} = this.class;
			for (const i in ozelKamOranKeys) {
				const key = ozelKamOranKeys[i];
				const value = this[key];
				if (value)
					liste.push(roundToFra(value, 2));
			}
			
			return liste;
		}

		get ekOzellik_raf() {
			let result = this._ekOzellik_raf;
			if (result == null) {
				this.ekOzelliklerDo({ callback: _e => {
					const ekOzellik = _e.item;
					const {value} = ekOzellik;
					if (ekOzellik.tip == 'raf') {
						result = this._ekOzellik_raf = ekOzellik;
						return false;				// break loop
					}
				}});
			}
			return result;
		}
		get ekOzellik_refRaf() {
			let result = this._ekOzellik_refRaf;
			if (result == null) {
				this.ekOzelliklerDo({ callback: _e => {
					const ekOzellik = _e.item;
					const {value} = ekOzellik;
					if (ekOzellik.tip == 'refRaf') {
						result = this._ekOzellik_refRaf = ekOzellik;
						return false;				// break loop
					}
				}});
			}
			return result;
		}

		get rafKod() {
			const ekOzellik = this.ekOzellik_raf;
			return ekOzellik ? ekOzellik.value : null;
		}
		set rafKod(valueOrBlock) {
			const ekOzellik = this.ekOzellik_raf;
			if (ekOzellik) {
				const value = $.isFunction(valueOrBlock) ? valueOrBlock.call(this, { sender: this, ekOzellik: ekOzellik }) : valueOrBlock;
				ekOzellik.value = value;
			}
		}

		get refRafKod() {
			const ekOzellik = this.ekOzellik_refRaf;
			return ekOzellik ? ekOzellik.value : null;
		}
		set refRafKod(valueOrBlock) {
			const ekOzellik = this.ekOzellik_refRaf;
			if (ekOzellik) {
				const value = $.isFunction(valueOrBlock) ? valueOrBlock.call(this, { sender: this, ekOzellik: ekOzellik }) : valueOrBlock;
				ekOzellik.value = value;
			}
		}

		hostVars(e) {
			let hv = super.hostVars(e);
			$.extend(hv, {
				dettipi: this.class.detTipi,
				okunanbarkod: this.barkod || '',
				okutmasayisi: asInteger(this.okutmaSayisi),
				shkod: this.shKod || '',
				miktar: asFloat(this.miktar) || 0,
				xbrm: this.brm || '',
				yerKod: this.yerKod || '',
				paketkod: this.paketKod || '',
				paketmiktar: asFloat(this.paketMiktar) || 0,
				paketicadet: asFloat(this.paketIcAdet) || 0,
				satirIskOranSinirVarmi: asInteger(this.satirIskOranSinirVarmi),
				satirIskOranSinir: asFloat(this.satirIskOranSinir) || 0
			}, this.ekOzelliklerYapi.hostVars($.extend({}, e, { refRafAlinirmi: true })) || {});

			return hv;
		}

		async setValues(e) {
			e = e || {};
			await super.setValues(e);
			
			const {fis, rec} = e;
			const {yerKod} = rec;
			$.extend(this, {
				barkod: rec.okunanbarkod,
				shKod: rec.shkod,
				shAdi: rec.shadi,
				grupKod: rec.grupkod,
					// fiş ile aynı ise yerKod detay'a yüklenmez
				yerKod: fis && yerKod == fis.yerKod ? null : yerKod,
				okutmaSayisi: asFloat(rec.okutmasayisi) || 0,
				miktar: asFloat(rec.miktar) || 0,
				brm: rec.xbrm || rec.brm || this.brm,
				paketKod: rec.paketkod || rec.paketKod,
				paketMiktar: asFloat(rec.paketmiktar) || asFloat(rec.paketMiktar) || 0,
				paketIcAdet: asFloat(rec.paketicadet) || 0,
				satirIskOranSinirVarmi: asBool(rec.satirIskOranSinirVarmi),
				satirIskOranSinir: rec.satirIskOranSinir
			});
			if (this.paketKod && !this.paketMiktar)
				this.paketMiktar = asFloat(rec.carpan) || 1;
			
			const {ekOzelliklerYapi} = this;
			if (ekOzelliklerYapi)
				await ekOzelliklerYapi.setValues($.extend({}, e, { refRafAlinirmi: true }));
		}

		async setValuesFromSablon(e) {
			e = e || {};
			await super.setValuesFromSablon(e);
			
			const {rec} = e;
			$.extend(this, {
				barkod: rec.barkod == null ? this.barkod : rec.barkod,
				shKod: rec.shKod == null ? this.shKod : rec.shKod,
				shAdi: rec.shAdi == null ? this.shAdi : rec.shAdi,
				grupKod: rec.grupKod == null ? this.grupKod : rec.grupKod,
				okutmaSayisi: rec.okutmaSayisi == null ? this.okutmaSayisi : (asFloat(rec.okutmaSayisi) || 0) || (asFloat(rec.okutmasayisi) || 0),
				miktar: rec.miktar == null ? this.miktar : (asFloat(rec.miktar) || 0),
				brm: rec.brm == null ? this.brm : rec.brm,
				paketKod: rec.paketKod == null ? this.paketKod : (rec.paketkod || rec.paketKod),
				paketMiktar: asFloat(rec.paketmiktar) || asFloat(rec.paketMiktar) || 0,
				satirIskOranSinirVarmi: asBool(rec.satirIskOranSinirVarmi),
				satirIskOranSinir: rec.satirIskOranSinir
			});
			if (this.paketKod && !this.paketMiktar)
				this.paketMiktar = asFloat(rec.carpan) || 1;

			const {ekOzelliklerYapi} = this;
			if (ekOzelliklerYapi)
				await ekOzelliklerYapi.setValues(e);
		}

		async detayEkIslemler_ekle(e) {
			await this.gerekirseEkBilgileriBelirle(e);
			await this.satisKosulYapilariIcinDuzenle(e);

			return await super.detayEkIslemler_ekle(e);
		}

		async detayEkIslemler(e) {
			await this.gerekirseEkBilgileriBelirle(e);
			await this.miktar2PaketMiktarHesapla(e);
			await super.detayEkIslemler(e);
		}

		async satisKosulYapilariIcinDuzenle(e) {
			this.iskontoYapilmazmi = this.promosyonYapilmazmi = false;
		}

		async gerekirseEkBilgileriBelirle(e) {
			if (this.shAdi == null || this.grupKod == null || this.barkod == null ||
					this.satirIskOranSinirVarmi == null || this.satirIskOranSinir == null) {
				await this.ekBilgileriBelirle(e);
			}
		}

		async ekBilgileriBelirle(e) {
			e = e || {};
			const {app} = sky;
			const {fis} = e;
			const dbMgr = e.dbMgr = fis ? fis.dbMgr : app.dbMgr_mf;
			let stm = e.stm = await this.class.getStokEkBilgiStm({ basit: true, fis: fis, shKod: this.shKod });
			if (!stm)
				return false;
			
			const rec = e.rec = await dbMgr.tekilExecuteSelect({ tx: e.tx, query: stm });
			if (!rec)
				return false;
			
			$.extend(this, {
				shAdi: this.shAdi || rec.shadi || rec.aciklama || '',
				barkod: this.barkod || rec.barkod || '',
				grupKod: this.grupKod || rec.grupkod || rec.grupKod || '',
				brm: this.brm || rec.brm || '',
				satirIskOranSinirVarmi: asBool(rec.satirIskOranSinirVarmi),
				satirIskOranSinir: asFloat(rec.satirIskOranSinir) || 0
			});
			await this.ekBilgileriBelirleDevam(e);
			
			return true;
		}

		ekBilgileriBelirleDevam(e) {
		}

		miktar2PaketMiktarHesapla(e) {
			const fra = sky.app.param.brm2Fra[this.brm || 'AD'] || 2;
			if (this.paketKod && this.paketIcAdet)
				this.paketMiktar = roundToFra(this.miktar / this.paketIcAdet, fra) || 0;
		}

		paketMiktar2MiktarHesapla(e) {
			const fra = sky.app.param.brm2Fra[this.brm || 'AD'] || 0;
			if (this.paketKod && this.paketMiktar && this.paketIcAdet) {
				this.miktar = roundToFra(this.paketMiktar * this.paketIcAdet, fra) || 0;
				this.bedelHesapla(e);
			}
		}

		bedelHesapla(e) {
		}

		iskontoKampanyaReset(e) {
			const resetci = keys => {
				keys = keys || [];
				for (const i in keys) {
					const key = keys[i];
					let value = this[key];
					if (value)
						this[key] = value = 0;
				}
			}
			resetci(this.class.iskOranKeys);
			resetci(this.class.kamOranKeys);
			
			this.ozelKampanyaKod = '';
			this.ozelKampanyaOranReset(e);
		}

		ozelKampanyaIskOranSinirBul(e) {
		}

		ozelKampanyaOranReset(e) {
			this.ozelKampanyaIskSinir = null;
			const {ozelKamOranKeys} = this.class;
			for (const i in ozelKamOranKeys) {
				const key = ozelKamOranKeys[i];
				let value = this[key];
				if (value)
					this[key] = value = 0;
			}
		}

		detYerKodReset(e) {
			delete this.yerKod;
		}

		cacheReset(e) {
			super.cacheReset(e);
			delete this._ekOzellik_raf;
			delete this._ekOzellik_refRaf;
		}

		static getDokumAttr2Baslik(e) {
			return $.extend(super.getDokumAttr2Baslik(e) || {}, {
				barkod: `Barkod`,
				grupKod: `Grup`,
				grupAdi: `Grup Adı`,
				yerKod: `Det.Yer`,
				yerAdi: `Det.Yer Adı`,
				shKod: `Ürün`,
				stokKod: `Ürün`,
				shAdi: `Ürün`,
				stokAdi: `Ürün Adı`,
				brm: `Br`,
				miktar: `Miktar`,
				miktar2: `Miktar2`,
				okutmaSayisi: `Okutma #`,
				brutBedel: `Brüt Bedel`,
				fiyat: `Fiyat`,
				netBedel: `Net Bedel`,
				netFiyat: `Net Fiyat`,
				paketKod: `Paket`,
				paketMiktar: `Paket İç Adet`,
				iskOranlariText: `İsk%`,
				iskOran1: `İsk1(%)`,
				iskOran2: `İsk2(%)`,
				iskOran3: `İsk3(%)`,
				iskOran4: `İsk4(%)`,
				iskOran5: `İsk5(%)`,
				iskOran6: `İsk6(%)`,
				ozelKampanyaKod: `Ö.Kam`,
				ozelKampanyaOran1: `ÖK1(%)`,
				ozelKampanyaOran2: `ÖK2(%)`,
				ozelKampanyaOran3: `ÖK3(%)`,
				ozelKampanyaOran4: `ÖK4(%)`,
				ozelKampanyaOran5: `ÖK5(%)`,
				ozelKampanyaOran6: `ÖK6(%)`
			})
		}

		async getDokumDegeriDict(e) {
			return $.extend(await super.getDokumDegeriDict(e) || {}, {
				stokKod: this.shKod,
				stokAdi: e => {
					let result = this.shAdi;
					const {ekOzelliklerYapi} = this;
					const postfix = (ekOzelliklerYapi ? ekOzelliklerYapi.getAnahtarDegeri() : [])
											.filter(value => !!value);
					if (!$.isEmptyObject(postfix))
						result += ` [${postfix.join(';')}]`;
					return result;
				}
			})
		}

		ekOzelliklerDo(e) {
			const {ekOzelliklerYapi} = this;
			if (ekOzelliklerYapi)
				return this.ekOzelliklerYapi.ekOzelliklerDo(e);
			return null;
		}
	}
})()
