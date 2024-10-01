(function() {
	window.CETStokTicariDetay = class extends window.MQDetay {
		static get fisSinif() { return CETStokTicariFis } static get table() { return 'data_PIFStok' } static get detTipi() { return 'S' }
		static get dipIskBedelKullanilirmi() { return false } static get promosyonmu() { return false }
		constructor(e) {
			e = e || {}; super(e); const orjMiktar = e.miktar;
			$.extend(this, {
				vioID: e.vioID || null,
				barkod: e.barkod || null,
				okunanTumBarkodlar: e.okunanTumBarkodlar || {},
				shKod: e.shKod || e.kod,
				shAdi: e.shAdi || e.aciklama || e.adi,
				grupKod: e.grupKod,
				yerKod: e.yerKod,
				miktar: asFloat(orjMiktar) || 1,
				brm: e.brm || '',
				hMiktar: asFloat(e.hMiktar) || 0,
				paketKod: e.paketKod || '',
				paketMiktar: asInteger(e.paketMiktar) || 0,
				paketIcAdet: 0,
				okutmaSayisi: e.okutmaSayisi || 1,
				boyutTipi: e.boyutTipi || e.boyuttipi || '',
				bedenKategoriKod: e.bedenKategoriKod || e.bedenkategorikod || '',
				rbkTableData: e.rbkTableData || {},
				satirIskOranSinirVarmi: e.satirIskOranSinirVarmi == null ? null : asBool(e.satirIskOranSinirVarmi),
				satirIskOranSinir: null,
				iskSinir: e.iskSinir,
				ekOzelliklerYapi: !e.isCopy && (!e.ekOzelliklerYapi || $.isPlainObject(e.ekOzelliklerYapi)) ? new CETEkOzellikler(e.ekOzelliklerYapi) : e.ekOzelliklerYapi,
				iskontoYapilmazmi: true,
				promosyonYapilmazmi: true
			});
			// this.kdvOrani = this.fiyat = this.brutBedel = this.netBedel = this.netFiyat = 0;
			if (this.paketKod) {
				/*if (!this.paketMiktar) this.paketMiktar = asFloat(e.carpan) || 1;*/
				const paketIcAdet = this.paketIcAdet = asFloat(e.paketIcAdet || e.carpan) || 0;
				if (!orjMiktar) { this.miktar = paketIcAdet }
				if (this.paketIcAdet && !this.paketMiktar) { this.miktar2PaketMiktarHesapla(e) }
			}

			let {okunanTumBarkodlar} = this; if (!okunanTumBarkodlar) { okunanTumBarkodlar = this.okunanTumBarkodlar = {} }
			else if ($.isArray(okunanTumBarkodlar)) { okunanTumBarkodlar = this.okunanTumBarkodlar = asSet(okunanTumBarkodlar) }
			const {barkod} = this; if (barkod) { okunanTumBarkodlar[barkod] = true }
		}
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
			const {dovizlimi} = fis;
			let stkFytInd = (e.cariRow || {}).stkFytInd || (fis || {}).cariStkFytInd;
			if (!stkFytInd) {
				const mustKod = e.mustKod || (e.cariRow || {}).kod || (fis || {}).mustKod;
				if (mustKod)
					stkFytInd = await MQCogul.getCariStkFytInd({ mustKod: mustKod });
			}
			const brmFiyatSaha =
				dovizlimi
					? (stkFytInd ? `dvFiyat${stkFytInd}` : 'dvBrmFiyat')
					: (stkFytInd ? `satFiyat${stkFytInd}` : 'brmFiyat');
			
			let sent = new MQSent({
				from: `mst_Stok ${alias}`,
				fromIliskiler: [
					{ alias: alias, from: `mst_StokGrup grp`, on: `${alias}.grupKod = grp.kod` }
					// { alias: alias, leftJoin: `mst_BarkodReferans bref`, on: `${alias}.kod = bref.stokKod AND bref.varsayilanmi <> 0` }
				],
				// where: [],
				sahalar: (e.rowCountOnly
					? `COUNT(*) sayi`
					: [
						`${alias}.rowid`, `${alias}.kod`, `${alias}.aciklama`, `${alias}.brm`, /* `bref.refKod barkod`, */
						`${alias}.grupKod`, `grp.aciklama grupAdi`, `grp.anaGrupKod`,
						basitmi ? `NULL yerKod` : `son.yerKod`,
						basitmi ? `NULL sonStok` : `son.miktar sonStok`,
						basitmi ? `NULL olasiMiktar` : `(son.orjMiktar + son.olasiFark) olasiMiktar`,
						/*`${sonStokKontrolEdilirmi ? 'son.miktar' : 'NULL'} sonStok`,*/
						(
							dovizlimi
								? (fiiliCikismi
									 ? `${alias}.${brmFiyatSaha} brmFiyat`
									 : `(case when ${alias}.almFiyat == 0 then ${alias}.dvBrmFiyat else ${alias}.almFiyat end) brmFiyat`)
								: (fiiliCikismi
									 ? `${alias}.${brmFiyatSaha} brmFiyat`
									 : `(case when ${alias}.almFiyat == 0 then ${alias}.dvBrmFiyat else ${alias}.almFiyat end) brmFiyat`)
						),
						((stokKdvSaha ? `${alias}.${stokKdvSaha}` : `NULL`) + ` kdvOrani`),
						((stokKdvDegiskenmiSaha ? `${alias}.${stokKdvDegiskenmiSaha}` : `NULL`) + ` kdvDegiskenmi`),
						`${alias}.satirIskOranSinirVarmi`, `${alias}.satirIskOranSinir`,
						`${alias}.boyutTipi`, `${alias}.bedenKategoriKod`
					  ])
			});
			let stm = new MQStm({ sent: sent });
			if (!$.isEmptyObject(wsArgs))
				stm.fromGridWSArgs(wsArgs)
			
			let shKodListe = e.shKod || e.shKodListe;
			if (shKodListe && !$.isArray(shKodListe))
				shKodListe = [shKodListe]
			if (!$.isEmptyObject(shKodListe))
				sent.where.inDizi(shKodListe, `${alias}.kod`)

			if (!basitmi) {
				app.stmSentDuzenle_sonStokBagla({
					stm: stm, alias: alias,
					shKodClause: `${alias}.kod`,
					yerKod: e.yerKod /*|| fis.yerKod*/,
					leftJoin: !sonStokKontrolEdilirmi,
					detaylimi: detaylimi
				})
			}
			
			return stm
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
			e = e || {};
			const idSahalar = this.class.ekOzelliklerIDSahalar;
			if (e.paketAlinir || e.paketAlinirmi || e.paketKod)
				idSahalar.push('paketKod');
			if (e.paketIcAdet != null)
				idSahalar.push('paketIcAdet');
			
			return CETEkOzellikler.keyHostVarsFrom({
				refRafAlinirmi: e.refRafAlinirmi, hmrSet: e.hmrSet,
				with: idSahalar,
				anahtarDegeri: this.getAnahtarDegeri(e)
				// anahtarStr: this.getAnahtarStr()
			})
		}
		
		getEkOzelliklerPrefixAnahtarValues(e) {
			e = e || {};
			const fis = e.fis || {};
			const yerKod = (e.yerKod == null ? this.yerKod || fis.yerKod : e.yerKod) || '';
			
			const result = [];
			result.push(this.shKod || '', yerKod);

			if (e.paketAlinir || e.paketAlinirmi || e.paketKod)
				result.push(e.paketKod || this.paketKod || '');
			if (e.paketIcAdet != null)
				result.push(e.paketIcAdet)
			
			if (e.with)
				result.push(...e.with)
			
			return result
		}

		getAnahtarDegeri(e) {
			e = e || {};
			return this.ekOzelliklerYapi.getAnahtarDegeri($.extend({}, e, { delim: e.delim || e.anahtarDelim, hmrSet: e.hmrSet, with: this.getEkOzelliklerPrefixAnahtarValues(e) }))
		}
		
		getAnahtarStr(e) {
			e = e || {};
			return this.ekOzelliklerYapi.getAnahtarStr($.extend({}, e, { delim: e.delim || e.anahtarDelim, hmrSet: e.hmrSet, anahtarDegeri: this.getAnahtarDegeri(e) }))
		}

		getBirlestirIcinAnahtarDegeri(e) {
			e = e || {};
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
				this.paketKod || '',
				this.paketIcAdet || '',
				(this.iskOranListe || []).map(oran => roundToFra(oran, 2).toString()).join('+'),
				(this.kamOranListe || []).map(oran => roundToFra(oran, 2).toString()).join('+'),
				(this.ozelKamOranListe || []).map(oran => roundToFra(oran, 2).toString()).join('+')
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
			return hv
		}
		getAnahtarDegeriSiparis(e) { const hv = this.getAnahtarHVSiparis(e); return hv ? Object.values(hv) : null }
		getAnahtarStrSiparis(e) {
			e = e || {}; const anah = this.getAnahtarDegeriSiparis(e);
			return $.isEmptyObject(anah) ? '' : anah.join(e.delim || e.anahtarDelim || CETEkOzellikler.anahtarDelim)
		}
		getAnahtarStr(e) { e = e || {}; return this.ekOzelliklerYapi.getAnahtarStr($.extend({}, e, { delim: e.delim || e.anahtarDelim, anahtarDegeri: this.getAnahtarDegeri(e) })) }
		getSadeceOzellikAnahtarDegeri(e) { e = e || {}; return this.ekOzelliklerYapi.getAnahtarDegeri($.extend({}, e, { delim: e.delim || e.anahtarDelim })) }
		getSadeceOzellikAnahtarStr(e) {
			e = e || {}; const anah = this.getSadeceOzellikAnahtarDegeri(e);
			if ($.isEmptyObject(anah)) { return '' }
			return anah.filter(x => !!x).join(e.delim || e.anahtarDelim || CETEkOzellikler.anahtarDelim)
		}
		get sadeceOzellikAnahtarDegeri() { return this.getSadeceOzellikAnahtarDegeri() }
		get sadeceOzellikAnahtarStr() { return this.getSadeceOzellikAnahtarStr() }
		get kadIskOranVarmi() { return !!this.kadIskOran }
		get proIskOranVarmi() { return !!this.proIskOran }
		static get iskOranKeys() { return [] }
		get iskOranVarmi() { return this.class.iskOranKeys.find(key => !!this[key]) }
		
		get iskOranListe() {
			const liste = [];
			const {iskOranKeys} = this.class;
			for (const key of iskOranKeys) {
				const value = this[key];
				if (value)
					liste.push(roundToFra(value, 2))
			}
			return liste
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

		get refRafKod() { const ekOzellik = this.ekOzellik_refRaf; return ekOzellik ? ekOzellik.value : null }
		set refRafKod(valueOrBlock) {
			const ekOzellik = this.ekOzellik_refRaf;
			if (ekOzellik) {
				const value = $.isFunction(valueOrBlock) ? valueOrBlock.call(this, { sender: this, ekOzellik: ekOzellik }) : valueOrBlock;
				ekOzellik.value = value;
			}
		}

		get rbkIcinUygunmu() {
			return this.boyutTipi == 'RB';
		}

		getSonStokIcinAltDetaylar(e) {
			return this.getAltDetaylar(e)
		}
		
		getAltDetaylar(e) {
			e = e || {};
			const {fis} = e;
			const {rbkKullanilirmi} = sky.app;
			const rbkTableData = rbkKullanilirmi && this.rbkIcinUygunmu ? this.rbkTableData : null;

			const detArgs = e;
			const altDetaylar = [];
			if (rbkTableData) {
				const carpanlimi = asBool(e.carpanli || e.carpanlimi);
				const bedenKategoriKod2AsortiKod2Carpan = (fis || {})._bedenKategoriKod2AsortiKod2Carpan || {};
				for (const desenKod in rbkTableData) {
					const renk2Beden2Miktar = rbkTableData[desenKod];
					for (const renkKod in renk2Beden2Miktar) {
						const beden2Miktar = renk2Beden2Miktar[renkKod];
						for (const beden in beden2Miktar) {
							let miktar = beden2Miktar[beden];
							if (!miktar)
								continue

							let carpan = 1;
							if (carpanlimi) {
								const {bedenKategoriKod} = this;
								const asortiKod2Carpan = bedenKategoriKod2AsortiKod2Carpan[bedenKategoriKod] || {};
								carpan = asortiKod2Carpan[beden] || 1
							}
							
							const altDet = this.deepCopy();
							altDet.cacheReset();
							delete altDet.rbkTableData;
							
							const tip2EkOzellik = (altDet.ekOzelliklerYapi || {}).tip2EkOzellik || {};
							(tip2EkOzellik.desen || {}).value = desenKod;
							(tip2EkOzellik.renk || {}).value = renkKod;
							(tip2EkOzellik.beden || {}).value = beden;

							altDet.miktar = (miktar * carpan);
							altDet.malFazlasi = 0;
							if (altDet.bedelHesapla)
								altDet.bedelHesapla(detArgs)
							if (altDet.kdvHesapla)
								altDet.kdvHesapla(detArgs)
							
							altDetaylar.push(altDet)
						}
					}
				}
			}
			else {
				const _altDetaylar = this.altDetaylar;
				if ($.isEmptyObject(_altDetaylar))
					altDetaylar.push(this)
				else {
					for (const key in _altDetaylar) {
						const altDet = _altDetaylar[key];
						const fakeDet = this.deepCopy();
						fakeDet.cacheReset();
						delete fakeDet.altDetaylar;
						
						$.extend(fakeDet, {
							barkod: altDet.okunanbarkod,
							okunanTumBarkodlar: altDet.okunanTumBarkodlar,
							okutmaSayisi: (altDet.okutmasayisi || 1),
							miktar: altDet.miktar,
							malFazlasi: 0,
							ekOzelliklerYapi: new fakeDet.ekOzelliklerYapi.class()
						});
						
						const _ekOzellikler = altDet.ekOzellikler;
						if (!$.isEmptyObject(_ekOzellikler)) {
							const ekOzIdSahaTip = {};
							const {tip2EkOzellik} = fakeDet.ekOzelliklerYapi;
							for (const tip in tip2EkOzellik) {
								const ekOz = tip2EkOzellik[tip];
								const {idSaha} = ekOz;
								ekOzIdSahaTip[idSaha] = tip
							}
							for (const idSaha in _ekOzellikler) {
								const tip = ekOzIdSahaTip[idSaha] || idSaha;
								const ekOzellik = tip2EkOzellik[tip];
								const _ekOzellik_value = _ekOzellikler[idSaha];
								if (ekOzellik && _ekOzellik_value != null)
									ekOzellik.value = _ekOzellik_value;
							}
						}

						if (fakeDet.bedelHesapla)
							fakeDet.bedelHesapla(detArgs)
						if (fakeDet.kdvHesapla)
							fakeDet.kdvHesapla(detArgs)
						altDetaylar.push(fakeDet)
					}
				}
			}

			return altDetaylar
		}
		

		hostVars(e) {
			e = e || {}; let okunanTumBarkodlar = this.okunanTumBarkodlar = (this.okunanTumBarkodlar || {});
			if ($.isArray(okunanTumBarkodlar)) { okunanTumBarkodlar = this.okunanTumBarkodlar = asSet(okunanTumBarkodlar) }
			for (const key in Object.keys(okunanTumBarkodlar)) { if (key == null || key == 'undefined') { delete okunanTumBarkodlar[key] } }
			const {fis} = e; let hv = super.hostVars(e);
			$.extend(hv, {
				vioID: this.vioID || null,
				dettipi: this.class.detTipi,
				okunanbarkod: this.barkod || '',
				okunanTumBarkodlar: toJSONStr(Object.keys(okunanTumBarkodlar)),
				okutmasayisi: asInteger(this.okutmaSayisi),
				shkod: this.shKod || '',
				miktar: asFloat(this.miktar) || 0,
				xbrm: this.brm || '',
				hMiktar: asFloat(this.hMiktar) || 0,
				yerKod: this.yerKod || '',
				paketkod: this.paketKod || '',
				paketmiktar: asFloat(this.paketMiktar) || 0,
				paketicadet: asFloat(this.paketIcAdet) || 0,
				boyutTipi: this.boyutTipi || '',
				bedenKategoriKod: this.bedenKategoriKod || '',
				rbkTableData: toJSONStr(this.rbkTableData || null),
				satirIskOranSinirVarmi: asInteger(this.satirIskOranSinirVarmi),
				satirIskOranSinir: asFloat(this.satirIskOranSinir) || 0,
				iskSinir: asFloat(this.iskSinir) || 0
			}, this.ekOzelliklerYapi.hostVars($.extend({}, e, { refRafAlinirmi: true })) || {});

			if (fis && fis.class.altDetayKullanilirmi) {
				let {altDetaylar} = this; if ($.isArray(altDetaylar)) { altDetaylar = this.altDetaylar = $.extend({}, altDetaylar) }
				hv.altDetaylar = toJSONStr(altDetaylar || null);
			}
			return hv
		}
		async setValues(e) {
			e = e || {}; await super.setValues(e);
			const {rec, fis} = e, {yerKod} = rec;
			if (fis && fis.class.altDetayKullanilirmi) {
				let altDetaylar = null; try { altDetaylar = rec.altDetaylar ? JSON.parse(rec.altDetaylar || null) : null } catch (ex) { console.error('detay altDetaylar parse', ex) }
				altDetaylar = altDetaylar || {}; if ($.isArray(altDetaylar)) { altDetaylar = $.extend({}, altDetaylar) }
				this.altDetaylar = altDetaylar
			}
			delete this._anah2AltDetay;
			let rbkTableData = null; try { rbkTableData = rec.rbkTableData ? JSON.parse(rec.rbkTableData || null) : null } catch (ex) { console.error('detay rbkTableData parse', ex) }
			let okunanTumBarkodlar = rec.okunanTumBarkodlar ? asSet(JSON.parse(rec.okunanTumBarkodlar) || []) : {};
			if ($.isArray(okunanTumBarkodlar)) { okunanTumBarkodlar = this.okunanTumBarkodlar = asSet(okunanTumBarkodlar) }
			for (const key in Object.keys(okunanTumBarkodlar)) { if (key == null || key == 'undefined') { delete okunanTumBarkodlar[key] } }
			$.extend(this, {
				vioID: rec.vioID || null,
				barkod: rec.okunanbarkod,
				okunanTumBarkodlar,
				shKod: rec.shkod,
				shAdi: rec.shadi,
				grupKod: rec.grupkod,
					// fiş ile aynı ise yerKod detay'a yüklenmez
				yerKod: fis && yerKod == fis.yerKod ? null : yerKod,
				okutmaSayisi: asFloat(rec.okutmasayisi) || 0,
				miktar: asFloat(rec.miktar) || 0,
				brm: rec.xbrm || rec.brm || this.brm,
				hMiktar: asFloat(rec.hMiktar) || 0,
				paketKod: rec.paketkod || rec.paketKod,
				paketMiktar: asFloat(rec.paketmiktar) || asFloat(rec.paketMiktar) || 0,
				paketIcAdet: asFloat(rec.paketicadet) || 0,
				boyutTipi: rec.boyutTipi || rec.boyuttipi || '',
				bedenKategoriKod: rec.bedenKategoriKod || rec.bedenkategorikod || '',
				rbkTableData: rbkTableData,
				satirIskOranSinirVarmi: asBool(rec.satirIskOranSinirVarmi),
				satirIskOranSinir: rec.satirIskOranSinir,
				iskSinir: asFloat(rec.iskSinir) || 0
			});
			if (this.paketKod && !this.paketMiktar)
				this.paketMiktar = asFloat(rec.carpan) || 1;
			
			const {ekOzelliklerYapi} = this;
			if (ekOzelliklerYapi)
				await ekOzelliklerYapi.setValues($.extend({}, e, { refRafAlinirmi: true }));

			const {barkod} = this; if (barkod) { this.okunanTumBarkodlar[barkod] = true }
		}

		async setValuesFromSablon(e) {
			e = e || {};
			await super.setValuesFromSablon(e);
			
			const {rec} = e;
			$.extend(this, {
				barkod: rec.barkod == null ? this.barkod : rec.barkod,
				okunanTumBarkodlar: rec.okunanTumBarkodlar ? asSet(rec.okunanTumBarkodlar || []) : {},
				shKod: rec.shKod == null ? this.shKod : rec.shKod,
				shAdi: rec.shAdi == null ? this.shAdi : rec.shAdi,
				grupKod: rec.grupKod == null ? this.grupKod : rec.grupKod,
				okutmaSayisi: rec.okutmaSayisi == null ? this.okutmaSayisi : (asFloat(rec.okutmaSayisi) || 0) || (asFloat(rec.okutmasayisi) || 0),
				miktar: rec.miktar == null ? this.miktar : (asFloat(rec.miktar) || 0),
				brm: rec.brm == null ? this.brm : rec.brm,
				paketKod: rec.paketKod == null ? this.paketKod : (rec.paketkod || rec.paketKod),
				paketMiktar: asFloat(rec.paketmiktar) || asFloat(rec.paketMiktar) || 0,
				satirIskOranSinirVarmi: asBool(rec.satirIskOranSinirVarmi),
				satirIskOranSinir: rec.satirIskOranSinir,
				iskSinir: rec.iskSinir
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

			return await super.detayEkIslemler_ekle(e)
		}

		async detayEkIslemler(e) {
			await this.gerekirseEkBilgileriBelirle(e);
			await this.miktar2PaketMiktarHesapla(e);
			await super.detayEkIslemler(e)
		}

		async satisKosulYapilariIcinDuzenle(e) {
			this.iskontoYapilmazmi = this.promosyonYapilmazmi = false;
		}
		async gerekirseEkBilgileriBelirle(e) {
			if (this.shAdi == null || this.grupKod == null || this.barkod == null ||
					this.satirIskOranSinirVarmi == null || this.satirIskOranSinir == null ||
					this.boyutTipi == null || this.bedenKategoriKod == null) {
				await this.ekBilgileriBelirle(e)
			}
		}
		async ekBilgileriBelirle(e) {
			e = e || {};
			const {app} = sky;
			const {fis} = e;
			const dbMgr = e.dbMgr = fis ? fis.dbMgr : app.dbMgr_mf;
			let stm = e.stm = await this.class.getStokEkBilgiStm({ basit: true, fis: fis, shKod: this.shKod });
			if (!stm)
				return false
			const rec = e.rec = await dbMgr.tekilExecuteSelect({ tx: e.tx, query: stm });
			if (!rec)
				return false
			const {shKod} = this;
			this.barkod = this.barkod ?? rec.barkod ?? undefined;
			const cache_stokKod2VarsayilanBarkod = app.caches?.stokKod2VarsayilanBarkod || {};
			let promise_barkod;
			if (this.barkod === undefined) {
				let barkod = cache_stokKod2VarsayilanBarkod[shKod];
				if (barkod === undefined) {
					let sent = new MQSent({
						from: 'mst_BarkodReferans',
						where: [
							{ degerAta: shKod, saha: 'stokKod' },
							`varsayilanmi <> 0`
						],
						sahalar: ['refKod']
					});
					promise_barkod = dbMgr.tekilDegerExecuteSelect(sent)
				}
			}
			$.extend(this, {
				shAdi: this.shAdi || rec.shadi || rec.aciklama || '',
				grupKod: this.grupKod || rec.grupkod || rec.grupKod || '',
				brm: this.brm || rec.brm || '',
				satirIskOranSinirVarmi: asBool(rec.satirIskOranSinirVarmi),
				satirIskOranSinir: asFloat(rec.satirIskOranSinir) || 0,
				boyutTipi: rec.boyutTipi || rec.boyuttipi || '',
				bedenKategoriKod: rec.bedenKategoriKod || rec.bedenkategorikod || ''
			});
			await this.ekBilgileriBelirleDevam(e);
			if (promise_barkod) { const barkod = this.barkod = await promise_barkod; if (barkod !== undefined) { cache_stokKod2VarsayilanBarkod[shKod] = barkod } }
			return true
		}
		ekBilgileriBelirleDevam(e) { }
		miktar2PaketMiktarHesapla(e) {
			const fra = sky.app.param.brm2Fra[this.brm || 'AD'] || 2;
			if (this.paketKod && this.paketIcAdet)
				this.paketMiktar = asInteger(this.miktar / this.paketIcAdet) || 0;
		}
		paketMiktar2MiktarHesapla(e) {
			const fra = sky.app.param.brm2Fra[this.brm || 'AD'] || 0;
			if (this.paketKod && this.paketMiktar && this.paketIcAdet) {
				this.miktar = roundToFra(this.paketMiktar * this.paketIcAdet, fra) || 0;
				this.bedelHesapla(e);
			}
		}
		bedelHesapla(e) { }
		iskontoKampanyaReset(e) {
			const resetci = keys => { for (const key of (keys || [])) { let value = this[key]; if (value) { this[key] = value = 0 } } }
			resetci(this.class.iskOranKeys); resetci(this.class.kamOranKeys); this.kademeliIskontoReset(e); this.ozelKampanyaKod = ''; this.ozelKampanyaOranReset(e);
		}
		ozelKampanyaIskOranSinirBul(e) { }
		ozelKampanyaOranReset(e) {
			this.ozelKampanyaIskSinir = null; const {ozelKamOranKeys} = this.class;
			for (const key of ozelKamOranKeys) { let value = this[key]; if (value) { this[key] = value = 0 } }
		}
		detYerKodReset(e) { delete this.yerKod }
		cacheReset(e) { super.cacheReset(e); delete this._ekOzellik_raf; delete this._ekOzellik_refRaf }
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
			const {caches} = sky.app;
			const getModelKod2Rec = async () => {
				let kod2Rec = caches.modelKod2Rec;
				if ($.isEmptyObject(kod2Rec)) {
					const sent = new MQSent({ from: 'mst_Model', where: `kod <> ''`, sahalar: ['*'] });
					kod2Rec = caches.modelKod2Rec = caches.modelKod2Rec || {};
					const _recs = await dbMgr.executeSqlReturnRowsBasic({ query: sent });
					for (let i = 0; i < _recs.length; i++) {
						const rec = _recs[i];
						cache[rec.kod] = rec
					}
				}
				return kod2Rec
			};
			const getRenkKod2Rec = async () => {
				let kod2Rec = caches.renkKod2Rec;
				if ($.isEmptyObject(kod2Rec)) {
					const sent = new MQSent({ from: 'mst_Renk', where: `kod <> ''`, sahalar: ['*'] });
					kod2Rec = caches.renkKod2Rec = caches.renkKod2Rec || {};
					const _recs = await dbMgr.executeSqlReturnRowsBasic({ query: sent });
					for (let i = 0; i < _recs.length; i++) {
						const rec = _recs[i];
						kod2Rec[rec.kod] = rec
					}
				}
				return kod2Rec
			};
			const getDesenKod2Rec = async () => {
				let kod2Rec = caches.desenKod2Rec;
				if ($.isEmptyObject(kod2Rec)) {
					const sent = new MQSent({ from: 'mst_Desen', where: `kod <> ''`, sahalar: ['*'] });
					kod2Rec = caches.desenKod2Rec = caches.desenKod2Rec || {};
					const _recs = await dbMgr.executeSqlReturnRowsBasic({ query: sent });
					for (let i = 0; i < _recs.length; i++) {
						const rec = _recs[i];
						kod2Rec[rec.kod] = rec
					}
				}
				return kod2Rec
			};
			
			return $.extend(await super.getDokumDegeriDict(e) || {}, {
				stokKod: this.shKod,
				stokAdi: e => {
					e = e || {};
					const fis = e.fis || {};
					let result = this.shAdi;
					const {ekOzelliklerYapi} = this;
					const postfix = (ekOzelliklerYapi ? ekOzelliklerYapi.getAnahtarDegeri({ with: [this.paketKod] }) : [])
											.filter(value => !!value);
					if (!$.isEmptyObject(postfix))
						result += ` [${postfix.join('|')}]`
					return result
				},
				fiyat: e => {
					const {dokumNettenmi} = sky.app;
					return dokumNettenmi ? this.netFiyat : this.fiyat
				},
				ekOzModelKod: e => {
					const {tip2EkOzellik} = this.ekOzelliklerYapi || {};
					return (tip2EkOzellik.model || {}).value
				},
				ekOzModelAdi: async e => {
					const {tip2EkOzellik} = this.ekOzelliklerYapi || {};
					const kod = (tip2EkOzellik.model || {}).value;
					if (!kod)
						return null
					const kod2Rec = (await getModelKod2Rec()) || {};
					return (kod2Rec[kod] || {}).aciklama
				},
				ekOzModelBirlesik: async e => {
					const {tip2EkOzellik} = this.ekOzelliklerYapi || {};
					const kod = (tip2EkOzellik.model || {}).value;
					if (!kod)
						return kod
					const kod2Rec = (await getModelKod2Rec()) || {};
					return `${kod}-${(kod2Rec[kod] || {}).aciklama || ''}`
				},
				ekOzRenkKod: e => {
					const {tip2EkOzellik} = this.ekOzelliklerYapi || {};
					return (tip2EkOzellik.renk || {}).value
				},
				ekOzRenkAdi: async e => {
					const {tip2EkOzellik} = this.ekOzelliklerYapi || {};
					const kod = (tip2EkOzellik.renk || {}).value;
					if (!kod)
						return null
					const kod2Rec = (await getRenkKod2Rec()) || {};
					return (kod2Rec[kod] || {}).aciklama
				},
				ekOzRenkBirlesik: async e => {
					const {tip2EkOzellik} = this.ekOzelliklerYapi || {};
					const kod = (tip2EkOzellik.renk || {}).value;
					if (!kod)
						return kod
					const kod2Rec = (await getRenkKod2Rec()) || {};
					return `${kod}-${(kod2Rec[kod] || {}).aciklama || ''}`
				},
				ekOzDesenKod: e => {
					const {tip2EkOzellik} = this.ekOzelliklerYapi || {};
					return (tip2EkOzellik.desen || {}).value
				},
				ekOzDesenAdi: async e => {
					const {tip2EkOzellik} = this.ekOzelliklerYapi || {};
					const kod = (tip2EkOzellik.desen || {}).value;
					if (!kod)
						return null
					const kod2Rec = (await getDesenKod2Rec()) || {};
					return (kod2Rec[kod] || {}).aciklama
				},
				ekOzDesenBirlesik: async e => {
					const {tip2EkOzellik} = this.ekOzelliklerYapi || {};
					const kod = (tip2EkOzellik.desen || {}).value;
					if (!kod)
						return kod
					const kod2Rec = (await getDesenKod2Rec()) || {};
					return `${kod}-${(kod2Rec[kod] || {}).aciklama || ''}`
				},
				ekOzBeden: e => {
					const {tip2EkOzellik} = this.ekOzelliklerYapi || {};
					return (tip2EkOzellik.beden || {}).value
				},
				ekOzLotNo: e => {
					const {tip2EkOzellik} = this.ekOzelliklerYapi || {};
					return (tip2EkOzellik.lotNo || {}).value
				},
				ekOzRaf: e => {
					const {tip2EkOzellik} = this.ekOzelliklerYapi || {};
					return (tip2EkOzellik.raf || {}).value
				},
				ekOzRefRaf: e => {
					const {tip2EkOzellik} = this.ekOzelliklerYapi || {};
					return (tip2EkOzellik.refRaf || {}).value
				}
			})
		}

		ekOzelliklerDo(e) {
			const {ekOzelliklerYapi} = this;
			if (ekOzelliklerYapi)
				return this.ekOzelliklerYapi.ekOzelliklerDo(e)
			return null
		}
	}
})()
