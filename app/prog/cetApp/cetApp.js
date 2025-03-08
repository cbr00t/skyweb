(function() {
	window.CETApp = class extends window.Prog {
		static get dbMgrSinif() {
			const cls = (
				(qs.sqlJS ?? qs.sqljs ?? qs.dbMgrV2 ?? qs.dbmgrv2) ? DBMgr_SqlJS :
				(qs.alaSql ?? qs.alaSQL ?? qs.alasql ?? qs.dbMgrV3 ?? qs.dbmgrv3) ? DBMgr_AlaSQL :
				(qs.webSql ?? qs.webSQL ?? qs.websql) ? DBMgr_WebSQL : null
			);
			return cls ?? ( window.openDatabase ? DBMgr_WebSQL : DBMgr_SqlJS )
		}
		static get rootAppName() { return 'cetApp' }
		static get appName() { return this.rootAppName }
		get appText() { return 'Sky ElTerminali' }
		static get _defaultLayoutName() { return this.appName }
		get defaultRootLayoutName() {
			const rootAppName = this.class.rootAppName;
			return `../${rootAppName}/${rootAppName}`
		}
		get loginExtensionClass() { return CETLoginExtension }
		static get wsURLBase_postfix() { return ''}

		static get defaultLoginOzelTip() {
			return new CKodVeAdi({ kod: '', aciklama: '' })
		}

		static get qrScanDesteklenirmi() { return true }
		static get aceEditorDesteklermi() { return true }
		static get kmTakibiDesteklenirmi() { return false }

		get fisTipleri() {
			return [
				CETFisTipi.fromFisSinif({ fisSinif: CETPlasiyerErtesiGunSiparisFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETPlasiyerIadeFis })
			]
		}
		get fisTipleriDuzenlenmis() {
			let result = this._fisTipleri;
			if (result == null)
				result = this._fisTipleri = this.fisTipleri;
			
			return result;
		}
		get fisTipleriVeSablon() {
			let liste = $.merge([], this.fisTipleriDuzenlenmis);
			liste.push(new CETFisTipi({ kod: `sablon`, aciklama: `<div class="sablondanSec">Şablondan Seç</div>` }));

			return liste;
		}
		get fisSinifOlanFisTipleri() {
			let result = this._fisSinifOlanFisTipleri;
			if (result == null) {
				result = this._fisSinifOlanFisTipleri = [];
				const {fisTipleriDuzenlenmis} = this;
				for (const i in fisTipleriDuzenlenmis) {
					const rec = fisTipleriDuzenlenmis[i];
					const {fisSinif} = rec;
					if (fisSinif)
						result.push(rec);
				}
			}

			return result;
		}
		get numaratorOlanFisTipleri() {
			let result = this._numaratorOlanFisTipleri;
			if (result == null) {
				result = this._numaratorOlanFisTipleri = [];
				this.fisSinifOlanFisTipleri.forEach(rec => {
					const fisSinif = rec.fisSinif || {};
					const numaratorTip = fisSinif.numaratorTip;
					if (numaratorTip) {
						let _rec = rec;
						if (!_rec.numaratorTip) {
							_rec = rec.deepCopy ? rec.deepCopy() : $.extend(true, {}, rec);
							_rec.numaratorTip = numaratorTip;
						}
						result.push(_rec);
					}
				});
			}

			return result;
		}
		get adimTipi2FisSinif() {
			let result = this._adimTipi2FisSinif;
			if (result == null) {
				result = this._adimTipi2FisSinif = {};
				const {fisSinifOlanFisTipleri} = this;
				for (let i in fisSinifOlanFisTipleri) {
					const fisTipi = fisSinifOlanFisTipleri[i];
					const sinif = fisTipi.fisSinif;
					const adimTipi = (sinif.adimTipi || sinif.numaratorTip);
					if (sinif && adimTipi)
						result[adimTipi] = sinif;
				}
			}

			return result;
		}

		get mfTip2AciklamaDict() {
			let mfTip2Aciklama = this._mfTip2Aciklama;
			if (!mfTip2Aciklama) {
				this._mfTip2Aciklama = mfTip2Aciklama = {};
				this.mfTip2AciklamaDuzenle({ mfTip2Aciklama: mfTip2Aciklama });
			}

			return mfTip2Aciklama;
		}
		get eIslemTip2AciklamaDict() {
			let result = this._eIslemTip2Aciklama;
			if (!result) {
				this._eIslemTip2Aciklama = result = {};
				this.eIslemTip2AciklamaDuzenle({ target: result });
			}

			return result;
		}
		get konsolideTip2AciklamaDict() {
			let result = this._konsolideTip2Aciklama;
			if (!result) {
				this._konsolideTip2Aciklama = result = {};
				this.konsolideTip2AciklamaDuzenle({ target: result });
			}

			return result;
		}

		get raporlar() {
			return [
				CETRapor.getListeItem({ raporSinif: CETRapor_IlkIrsaliye }),
				CETRapor.getListeItem({ raporSinif: CETRapor_SatisVeTahsilatlar }),
				CETRapor.getListeItem({ raporSinif: CETRapor_SonStok }),
				CETRapor.getListeItem({ raporSinif: CETRapor_SonStok_Detayli }),
				CETRapor.getListeItem({ raporSinif: CETRapor_Ozet })
			]
		}

		get bilgiGonderTableYapilari() {
			return [
				{ baslik: 'data_PIFFis', diger: ['data_PIFStok'], tanim: [`mst_Cari`] },
				{ baslik: 'data_TahsilatFis', diger: ['data_TahsilatDetay'] }
			]
		}

		get tip2EkOzellik() {
			const {param} = this, kullanimYapi = this.ekOzellikKullanim || {}, tip2EkOzellik = {}; let tip;
			if (this.isDevMode && this.class.appMagazaVeyaSDMmi) {
				tip = 'yer';
				tip2EkOzellik[tip] = new CETEkOzellik_KA({
					tip, mbTable: `mst_Yer`, tipAdi: `Detay Yer`,
					widgetEvents: {
						comboBox_stmDuzenleyici: e => {
							const subeKod = e.subeKod == null ? this.defaultSubeKod : e.subeKod;
							if (subeKod != null) { e.stm.sentDo(sent => sent.where.degerAta(subeKod, `mst.subeKod`)) }
						},
						liste_stmDuzenleyici: e => {
							const subeKod = e.subeKod == null ? this.defaultSubeKod : e.subeKod;
							if (subeKod != null) { e.stm.sentDo(sent => sent.where.degerAta(subeKod, `mst.subeKod`)) }
						}
					}
				})
			}
			tip = 'model'; if (kullanimYapi[tip]?.kullanilirmi) tip2EkOzellik[tip] = new CETEkOzellik_KA({ tip, mbTable: 'mst_Model', tipAdi: (kullanimYapi[tip]).etiket || 'Model' });
			tip = 'renk'; if (kullanimYapi[tip]?.kullanilirmi) tip2EkOzellik[tip] = new CETEkOzellik_KA({ tip, mbTable: 'mst_Renk', tipAdi: (kullanimYapi[tip]).etiket || 'Renk' });
			tip = 'desen'; if (kullanimYapi[tip]?.kullanilirmi) tip2EkOzellik[tip] = new CETEkOzellik_KA({ tip, mbTable: 'mst_Desen', tipAdi: (kullanimYapi[tip]).etiket || 'Desen' });
			tip = 'raf'; if (kullanimYapi[tip]?.kullanilirmi) {
				tip2EkOzellik[tip] = new CETEkOzellik_KA({
					tip, mbTable: 'mst_YerRaf', tipAdi: (kullanimYapi[tip]).etiket || 'Raf Kodu',
					mbKodSaha: 'rafKod', mbAdiSaha: 'rafKod',
					sadeceKodmu: true, placeHolder: 'Raf kodu',
					widgetEvents: {
						comboBox_stmDuzenleyici: e => {
							const yerKod = e.sender.parentPart.fis.yerKod || this.defaultYerKod; if (!yerKod) return false;
							e.stm.sentDo(sent => sent.where.degerAta(yerKod, `mst.yerKod`));
						}
					}
				})
			}
			tip = 'refRaf'; if ((kullanimYapi.raf || {}).kullanilirmi) {
				tip2EkOzellik[tip] = new CETEkOzellik_KA({
					tip, mbTable: 'mst_YerRaf', tipAdi: (kullanimYapi.raf).etiket || 'Giriş Raf Kodu',
					mbKodSaha: 'rafKod', mbAdiSaha: 'rafKod', idSaha: 'refRafKod', adiSaha: 'refRafKod',
					sadeceKodmu: true, placeHolder: 'Giriş Raf kodu',
					widgetEvents: {
						comboBox_stmDuzenleyici: e => {
							const refYerKod = e.sender.parentPart.fis.refYerKod || this.defaultYerKod; if (!refYerKod) return false;
							e.stm.sentDo(sent => sent.where.degerAta(refYerKod, `mst.yerKod`));
						}
					}
				})
			}
			tip = 'lotNo'; if (kullanimYapi[tip]?.kullanilirmi) tip2EkOzellik[tip] = new CETEkOzellik_Ozellik({ tip, tipAdi: (kullanimYapi[tip]).etiket || 'Lot No' });
			tip = 'en'; if (kullanimYapi[tip]?.kullanilirmi) tip2EkOzellik[tip] = new CETEkOzellik_Ozellik({ tip, tipAdi: (kullanimYapi[tip]).etiket || 'En' });
			tip = 'boy'; if (kullanimYapi[tip]?.kullanilirmi) tip2EkOzellik[tip] = new CETEkOzellik_Ozellik({ tip, tipAdi: (kullanimYapi[tip]).etiket || 'Boy' });
			tip = 'yukseklik'; if (kullanimYapi[tip]?.kullanilirmi) tip2EkOzellik[tip] = new CETEkOzellik_Ozellik({ tip, tipAdi: (kullanimYapi[tip]).etiket || 'Yukseklik' });
			tip = 'beden'; if (kullanimYapi[tip]?.kullanilirmi) tip2EkOzellik[tip] = new CETEkOzellik_Ozellik({ tip, tipAdi: (kullanimYapi[tip]).etiket || 'Beden' });
			tip = 'utsNo'; if (kullanimYapi[tip]?.kullanilirmi) tip2EkOzellik[tip] = new CETEkOzellik_Ozellik({ tip, tipAdi: (kullanimYapi[tip]).etiket || 'UTS No' });
			tip = 'harDet'; if (kullanimYapi[tip]?.kullanilirmi) tip2EkOzellik[tip] = new CETEkOzellik_Ozellik({ tip, tipAdi: (kullanimYapi[tip]).etiket || 'Har.Det.' });
			const _tip2EkOzellikYapi = param.tip2EkOzellikYapi;
			if (!$.isEmptyObject(_tip2EkOzellikYapi)) {
				for (const _tip in _tip2EkOzellikYapi) {
					const rec = _tip2EkOzellikYapi[_tip]; if (!rec.kullanilirmi) continue;
					const sinif = CETEkOzellik.classFor({ ozellikTip: rec.ozellikTip }); if (!sinif) continue;
					const inst = new sinif({ tip: _tip, mbTable: `mst_${_tip}`, tipAdi: rec.tipAdi }); tip2EkOzellik[_tip] = inst
				}
			}
			return tip2EkOzellik
		}
		get ekOzellikBelirtecSet_stokMstVeDiger() {
			let result = this._ekOzellikBelirtecSet_stokMstVeDiger;
			if (result === undefined) {
				const {tip2EkOzellik} = this, uygunBelirtecSet = asSet(['model', 'renk', 'desen', 'beden']);
				result = { stokMst: {}, diger: {} }; if (tip2EkOzellik.lotNo) { result.diger.lotNo = true }					/* 'lotNo' en başa gelir */
				for (const tip in tip2EkOzellik) {
					if (tip == 'raf' || tip == 'refRaf') { continue }
					const target = uygunBelirtecSet[tip] ? result.stokMst : result.diger;
					if (!target[tip]) { target[tip] = true }
				}
				this._ekOzellikBelirtecSet_stokMstVeDiger = result
			}
			return result
		}
		get tabloEksikIslemYapi() {
			return [
				{
					kosul: async e => !(await e.dbMgr.hasColumns('mst_Promosyon', 'oncelik')),
					queries: [`ALTER TABLE mst_Promosyon ADD oncelik	INTEGER NOT NULL DEFAULT 0`]
				}
				/*{
					kosul: async e => !(await e.dbMgr.hasColumns('mst_Promosyon', 'cariKosulGrupBasi')),
					queries: [
						`ALTER TABLE mst_Promosyon ADD cariKosulGrupBasi	TEXT NOT NULL DEFAULT ''`,
						`ALTER TABLE mst_Promosyon ADD cariKosulGrupSonu	TEXT NOT NULL DEFAULT ''`
					]
				},
				{
					kosul: async e => !(await e.dbMgr.hasColumns('mst_Promosyon', 'voGrup6Varmi')),
					queries: [
						`ALTER TABLE mst_Promosyon ADD voGrup6Varmi			INTEGER NOT NULL DEFAULT 0`,
						`ALTER TABLE mst_Promosyon ADD voGrup7Varmi			INTEGER NOT NULL DEFAULT 0`,
						`ALTER TABLE mst_Promosyon ADD voGrup8Varmi			INTEGER NOT NULL DEFAULT 0`,
						`ALTER TABLE mst_Promosyon ADD voGrup9Varmi			INTEGER NOT NULL DEFAULT 0`,
						`ALTER TABLE mst_Promosyon ADD voGrup10Varmi		INTEGER NOT NULL DEFAULT 0`
					]
				},
				{
					kosul: async e => !(await e.dbMgr.hasColumns('mst_Promosyon', 'voGrup6Kod')),
					queries: [
						`ALTER TABLE mst_Promosyon ADD voGrup6Kod			TEXT NOT NULL DEFAULT ''`,
						`ALTER TABLE mst_Promosyon ADD voGrup6Miktar		REAL NOT NULL DEFAULT 0`,
						`ALTER TABLE mst_Promosyon ADD voGrup7Kod			TEXT NOT NULL DEFAULT ''`,
						`ALTER TABLE mst_Promosyon ADD voGrup7Miktar		REAL NOT NULL DEFAULT 0`,
						`ALTER TABLE mst_Promosyon ADD voGrup8Kod			TEXT NOT NULL DEFAULT ''`,
						`ALTER TABLE mst_Promosyon ADD voGrup8Miktar		REAL NOT NULL DEFAULT 0`,
						`ALTER TABLE mst_Promosyon ADD voGrup9Kod			TEXT NOT NULL DEFAULT ''`,
						`ALTER TABLE mst_Promosyon ADD voGrup9Miktar		REAL NOT NULL DEFAULT 0`,
						`ALTER TABLE mst_Promosyon ADD voGrup10Kod			TEXT NOT NULL DEFAULT ''`,
						`ALTER TABLE mst_Promosyon ADD voGrup10Miktar		REAL NOT NULL DEFAULT 0`
					]
				}*/
			]
		}
		get gridFiltreKodSahalari() {
			let result = this._gridFiltreKodSahalari;
			if (result == null) {
				result = this._gridFiltreKodSahalari = asSet([
					'kod', 'fistipi', 'stokKod', 'stokkod', 'urunKod', 'urunkod', 'shKod', 'shkod',
					'yerKod', 'yerkod', 'depoKod', 'depokod', 'plasiyerKod', 'plasiyerkod',
					'mustKod', 'mustkod', 'must', 'cariKod', 'carikod', 'cari',
					'tahSekliNo', 'tahseklino', 'tahSekliKodNo', 'tahseklikodno', 'grupKod', 'grupkod'
				]);
			}
			return result;
		}
		get gridFiltreAdiSahalari() {
			let result = this._gridFiltreAdiSahalari;
			if (result == null) {
				result = this._gridFiltreAdiSahalari = asSet([
					'aciklama', 'adi', 'stokAdi', 'stokadi', 'urunAdi', 'urunadi', 'unvan', 'birUnvan', 'birunvan',
					'mustUnvan', 'mustunvan', 'mustAdi', 'mustadi', 'plasiyerAdi', 'plasiyeadi', 'cariUnvan', 'cariunvan',
					'tahSekliAdi', 'tahsekliadi', 'grupAdi', 'grupadi'
				]);
			}
			return result;
		}
		get defaultDovizKod() { return qs.dovizKod == null ? (this.param.dovizKod == null ? null : (this.param.dovizKod || '')) : qs.dovizKod }
		get defaultYerKod() { return qs.yerKod == null ? (this.param.yerKod == null ? null : (this.param.yerKod || '')) : qs.yerKod }
		get defaultSubeKod() { return this.param.subeKod == null ? (sky.config.sessionInfo || {}).subeKod : (this.param.subeKod || '') }
		get defaultPlasiyerKod() {
			const sessionInfo = sky.config.sessionInfo || {};
			return sessionInfo.loginTipi == 'plasiyerLogin' ? sessionInfo.user : null;
		}
		static get appSicakmi() { return false }
		static get appSogukmu() { return false }
		static get appMagazami() { return false }
		static get appSDMmi() { return false }
		static get appSicakVeyaSogukmu() { return this.appSicakmi || this.appSogukmu }
		static get appSicakSogukVeyaMagazami() { return this.appSicakVeyaSogukmu || this.appMagazami }
		static get appMagazaVeyaSDMmi() { return this.appMagazami || this.appSDMmi }
		static get sonStoktanSecimYapilirmi() { return true }

		get programcimi() {
			let result = this._programcimi;
			if (result == null) {
				const {ozelYetkiler, param} = this;
				result = qs.programci || ozelYetkiler.programci;
				if (result == null)
					result = param.programcimi;
				if (result == null)
					result = this.isDevMode;
				this._programcimi = result = asBool(result);
			}
			return result;
		}
		get fiyatFra() {
			let result = this.ozelYetkiler?.fiyatFra;
			if (result == null)
				result = this.param.fiyatFra;
			return result;
		}
		get dvFiyatFra() {
			let result = this.ozelYetkiler?.dvFiyatFra;
			if (result == null)
				result = this.param.dvFiyatFra;
			if (result == null)
				result = this.fiyatFra
			return result;
		}
		get brm2Fra() {
			let result = this.ozelYetkiler?.brm2Fra;
			if (result == null)
				result = this.param.brm2Fra;
			return result || {};
		}
		static get defaultTip2Renk() {
			let result = this._defaultTip2Renk;
			if (!result) {
				result = this._defaultTip2Renk = {
					almSat: {
						A: '#60cec9',
						T: '#debb00'
					},
					iade: {
						/* '': '', */
						'I': 'firebrick'
					},
					fisTipi: {
						// U: '',
						// BT: ''	
					},
					pifTipi: {
						S: '#1138FD',
						I: '#FA8605',
						F: '#02C82C'
					},
					ayrimTipi: {
						/*'': '',*/
						IH: 'purple',
						IK: 'slategray'
						/* FS: '',
						KN: '',
						EM: ''*/
					}
				};
			}
			return result;
		}
		get tip2Renk() {
			let result = this.ozelYetkiler?.tip2Renk;
			if (result == null)
				result = this.param.tip2Renk;
			if (!result || $.isEmptyObject(result))
				result = this.class.defaultTip2Renk;
			return result;
		}
		get tarihAralik() {
			let result = this.ozelYetkiler?.tarihAralik;
			if (result == null)
				result = this.param.tarihAralik;
			if (result == null) {
				const yil = now().getFullYear();
				result = { basi: `01.01.${yil}`, sonu: `31.12.${yil}` };
			}
			return result;
		}
		get sonStoktanSecimYapilirmi() {
			if (!this.class.sonStoktanSecimYapilirmi) { return false }
			let flag = this.ozelYetkiler?.sonStoktanSecim; if (flag == null) {
				if (this.rbkKullanilirmi && this.fisGirisiRbkOtomatikAcilsinmi) { return false }
				const _flag = this.param.sonStoktanSecimYapilirmi; flag = _flag == null || _flag === '' ? true : asBool(_flag);
			}
			return flag;
		}
		get rotaKullanilirmi() { let flag = this.ozelYetkiler?.rota; if (flag == null) { flag = this.param.rotaKullanilirmi } return flag; }
		get rotaDevreDisiGosterilirmi() { let flag = this.ozelYetkiler?.rotaDevreDisi; if (flag == null) { flag = this.param.rotaDevreDisiGosterilirmi } return flag }
		get sicakTeslimFisimi() { let flag = this.ozelYetkiler?.sicakTeslimFisi; if (flag == null) { flag = this.param.sicakTeslimFisimi } return flag }
		get riskKontrolDurum() { let value = this.ozelYetkiler?.riskKontrolDurum; if (value == null) { value = this.param.riskKontrolDurum } return value || '' }
		get stokFiyatKdvlimi() { let flag = this.ozelYetkiler?.stokFiyatKdvli; if (flag == null) { flag = this.param.stokFiyatKdvlimi } return flag }
		get kdvDahilFiyatGosterim() { let flag = this.ozelYetkiler?.kdvDahilFiyatGosterim; if (flag == null) { flag = this.param.kdvDahilFiyatGosterim } return flag }
		get ozelIsaretKullanilirmi() { let flag = this.ozelYetkiler?.ozelIsaret; if (flag == null) { flag = this.param.yildizKullanilirmi } return flag }
		get isaretliBelgeKDVDurumu() { let flag = this.ozelYetkiler?.isaretliBelgeKDVDurumu; if (flag == null) { flag = this.param.isaretliBelgeKDVDurumu } return flag }
		get yildizFiyatKdvlimi() { return this.isaretliBelgeKDVDurumu == 'K' }
		get yildizYuvarlamaFarkimi() { return this.isaretliBelgeKDVDurumu == 'N' }
		get sonStokKontrolEdilirmi() { let flag = this.ozelYetkiler?.sonStok; if (flag == null) { flag = this.param.sonStokKontrolEdilirmi } return flag }
		get sonStokKontrolEdilirmi_siparis() { let flag = this.ozelYetkiler?.sonStok_siparis; if (flag == null) { flag = this.param.sonStokKontrolEdilirmi_siparis } return flag }
		static get defaultUygunAyrimTipleri() {
			return [
				{ kod: '', aciklama: 'Normal' }, { kod: 'IH', aciklama: 'İhr.' }, { kod: 'FS', aciklama: 'Fason' },
				{ kod: 'EM', aciklama: 'Emanet' }, { kod: 'KN', aciklama: 'Konsinye' }
			]
		}
		get uygunAyrimTipleri() {
			let result = this.ozelYetkiler?.uygunAyrimTipleri; if (result == null) { result = this.param.uygunAyrimTipleri }
			if ($.isEmptyObject(result)) { result = this.class.defaultUygunAyrimTipleri }
			return result
		}
		get serbestModmu() { let flag = this.ozelYetkiler?.serbestMod; if (flag == null) { flag = this.param.serbestModmu } return flag }
		get gridAltMultiSelectFlag() { let flag = this.ozelYetkiler?.gridAltMultiSelect; if (flag == null) { flag = this.param.gridAltMultiSelectFlag } return flag }
		get listeKodDogrudanAramaYapilirmi() { let flag = this.ozelYetkiler?.listeKodDogrudanArama; if (flag == null) { flag = this.param.listeKodDogrudanAramaYapilirmi } return flag }
		get fisOzetBilgiGosterilirmi() { let flag = this.ozelYetkiler?.fisOzetBilgi; if (flag == null) { flag = this.param.fisOzetBilgiGosterilirmi } return flag }
		get eIslemDesteklenirmi() { return true }
		get eIslemKullanilirmi() { let flag = this.ozelYetkiler?.eIslem; if (flag == null) { flag = asBool(this.param.eIslemKullanilirmi) } return flag }
		get eIrsaliyeKullanilirmi() {
			let flag = this.ozelYetkiler?.eIrsaliye;
			if (flag == null) { const _flag = this.param.eIrsaliyeKullanilirmi; flag = _flag == null ? this.eIslemKullanilirmi : asBool(this.param.eIrsaliyeKullanilirmi) }
			return flag
		}
		get eBelgeAltSinir() { let result = this.ozelYetkiler?.eBelgeAltSinir; if (result == null) { result = asFloat(this.param.eBelgeAltSinir) || 0 } return result }
		get rotaKullanilirmi() { let flag = this.ozelYetkiler?.rota; if (flag == null) { flag = asBool(this.class.rotaKullanilirmi) || false } return flag }
		get musteriDegistirilirmi() { let flag = this.ozelYetkiler?.musteriDegistirilir; if (flag == null) { flag = this.param.musteriDegistirilirmi ?? false } return flag }
		get musteriRotaZorunlumu() { let flag = this.ozelYetkiler?.rotaZorunlu; if (flag == null) { flag = asBool(this.param.musteriRotaZorunlumu) ?? false } return flag }
		get bakiyeRiskGosterilmezmi() { let flag = this.ozelYetkiler?.bakiyeRiskGosterilmez; if (flag == null) { flag = asBool(this.param.bakiyeRiskGosterilmezmi) ?? false } return flag }
		get oncekiFislerGosterilmezmi() { let flag = this.ozelYetkiler?.oncekiFislerGosterilmez; if (flag == null) { flag = asBool(this.param.oncekiFislerGosterilmezmi) ?? false } return flag }
		get musteriDurumuKullanilirmi() {
			const {menuAdimKisitIDSet} = this;
			return $.isEmptyObject(menuAdimKisitIDSet) || !!menuAdimKisitIDSet.musteriDurumu;
		}
		get karmaPaletBarkodBaslangic() { let value = this.ozelYetkiler?.karmaPaletBarkodBaslangic; if (value == null) { value = this.param.karmaPaletBarkodBaslangic } return value }
		get irsaliyeBakiyeyiEtkilermi() { let flag = this.ozelYetkiler?.irsaliyeBakiyeyiEtkiler; if (flag == null) { flag = asBool(this.param.irsaliyeBakiyeyiEtkilermi) ?? false } return flag }
		get barkodReferansAlinmazmi() { let flag = this.ozelYetkiler?.barkodReferansAlinmaz; if (flag == null) { flag = asBool(this.param.barkodReferansAlinmazmi) ?? false } return flag }
		get detaylarTersSiradami() { let flag = this.ozelYetkiler?.detaylarTersSirada; if (flag == null) { flag = asBool(this.param.detaylarTersSiradami) ?? false } return flag }
		get hataliBarkodlarIcinMesajGosterilirmi() { let flag = this.ozelYetkiler?.hataliBarkodlarIcinMesaj; if (flag == null) { flag = asBool(this.param.hataliBarkodlarIcinMesajGosterilirmi) ?? false } return flag }
		get barkodOkutmaSessizmi() { let flag = this.ozelYetkiler?.barkodOkutmaSessiz; if (flag == null) { flag = asBool(this.param.barkodOkutmaSessizmi) ?? false } return flag }
		get maxIskSayi() { return 6 } get maxKamSayi() { return this.maxIskSayi } get maxKadIskSayi() { return 5 }
		get iskSayi() {
			const {maxIskSayi} = this; let result = this.ozelYetkiler?.iskSayi;
			if (result == null) { result = asFloat(this.param.iskSayi) || 1 }
			return Math.min(result, maxIskSayi)
		}
		get kamSayi() {
			const {maxKamSayi} = this; let result = this.ozelYetkiler?.kamSayi;
			if (result == null) { result = asFloat(this.param.kamSayi) || this.iskSayi }
			return Math.min(result, maxKamSayi)
		}
		get kadIskSayi() {
			const {maxKadIskSayi} = this;
			let result = this.ozelYetkiler?.kadIskSayi;
			if (result == null)
				result = asFloat(this.param.kadIskSayi) || 1;
			return Math.min(result, maxKadIskSayi);
		}
		get iskontoArttirilirmi() {
			const {param} = this;
			const ozelYetki_iskontoArttirilirmi = this.ozelYetkiler?.iskonto;
			const {satirIskOranSinir} = this;
			let flag;
			if (ozelYetki_iskontoArttirilirmi != null)
				flag = ozelYetki_iskontoArttirilirmi;
			else {
				if (satirIskOranSinir == 0)
					flag = false;
				else
					flag = asBool(param.iskontoArttirilirmi);
			}
			return flag;
		}
		get satirIskOranSinir() {
			let result = this.ozelYetkiler?.satirIskOranSinir;
			if (result == null)
				result = this.ozelYetkiler?.iskOranSinir;
			if (result == null)
				result = asFloat(this.param.satirIskOranSinir) || 0;
			if (result && result <= 0.1)
				result = 0;
			return result;
		}
		get detaylardaFiyatDegistirilirmi() {
			let flag = this.ozelYetkiler?.fiyat;
			if (flag == null)
				flag = this.param.detaylardaFiyatDegistirilirmi;
			return flag;
		}
		get yazdirilanTahsilatDegistirilmezmi() { return this.ozelYetkiler?.yazdirilanTahsilatDegistirilmez ?? this.param.yazdirilanTahsilatDegistirilmezmi ?? false }
		get tahsilatIptalEdilemezmi() {
			let flag = this.ozelYetkiler?.tahsilatIptal;
			flag = flag == null ? this.param.tahsilatIptalEdilemezmi : !flag;
			return flag
		}
		get tahsilattaAcikHesapKullanilirmi() { return this.ozelYetkiler?.tahsilattaAcikHesap ?? this.param.tahsilattaAcikHesapKullanilirmi ?? false }
		get alimNetFiyatGosterilirmi() {
			let flag = this.ozelYetkiler?.alimNetFiyat;
			if (flag == null)
				flag = this.param.alimNetFiyatGosterilirmi;
			return flag;
		}
		get alimFiyatGorurmu() {
			let flag = this.ozelYetkiler?.alimFiyatGormez;
			flag = flag == null ? this.param.alimFiyatGorurmu : !flag;
			return flag;
		}
		get satisFiyatGorurmu() {
			let flag = this.ozelYetkiler?.satisFiyatGormez;
			flag = flag == null ? this.param.satisFiyatGorurmu : !flag;
			return flag;
		}
		get menuAdimKisitIDSet() {
			let result = this._menuAdimKisitIDSet;
			if (result === undefined) {
				let idListe = this.ozelYetkiler?.menuAdimKisitIDListe;
				if ($.isEmptyObject(idListe))
					idListe = this.param.menuAdimKisitIDListe;
				result = idListe ? asSet(idListe) : null;
				if (result)
					result.veriYonetimi = result.cacheReset = true;
				this._menuAdimKisitIDSet = result;
			}
			return result;
		}
		get fisAdimKisitIDSet() {
			let result = this._fisAdimKisitIDSet;
			if (result === undefined) {
				let idListe = this.ozelYetkiler?.fisAdimKisitIDListe;
				if ($.isEmptyObject(idListe))
					idListe = this.param.fisAdimKisitIDListe;
				result = idListe ? asSet(idListe) : null;
				this._fisAdimKisitIDSet = result;
			}
			return result;
		}
		get dogrudanFisListeyeGirilirmi() {
			let flag = this.ozelYetkiler?.dogrudanFisListe;
			if (flag == null)
				flag = this.param.dogrudanFisListeyeGirilirmi;
			return flag;
		}
		get barkodluFisGirisYapilirmi() {
			let flag = this.ozelYetkiler?.barkodluFisGiris;
			if (flag == null)
				flag = this.param.barkodluFisGirisYapilirmi;
			return flag;
		}
		get fisGirisSadeceBarkodZorunlumu() {
			let flag = this.ozelYetkiler?.fisGirisSadeceBarkod;
			if (flag == null)
				flag = this.param.fisGirisSadeceBarkodZorunlumu;
			return flag;
		}
		get geciciFisKullanilmazmi() {
			let flag = this.ozelYetkiler?.geciciFisYok;
			if (flag == null)
				flag = this.param.geciciFisKullanilmazmi;
			return flag;
		}
		get silerekBilgiAlYapilirmi() {
			let flag = this.ozelYetkiler?.silerekBilgiAl;
			if (flag == null)
				flag = this.param.silerekBilgiAlYapilirmi;
			return flag;
		}
		get nakitUstLimit() {
			let result = this.ozelYetkiler?.nakitUstLimit;
			if (result == null)
				result = this.param.nakitUstLimit;
			if (result != null)
				result = asFloat(result) || 0
			return result;
		}
		get siparisKontrolEdilirmi() {
			return this.depoMalKabulSiparisKontrolEdilirmi || this.depoSevkiyatSiparisKontrolEdilirmi
		}
		get depoMalKabulSiparisKontrolEdilirmi() {
			let flag = this.ozelYetkiler?.depoMalKabulSiparisKontrolEdilir;
			if (flag == null)
				flag = this.param.depoMalKabulSiparisKontrolEdilirmi;
			return flag;
		}
		get depoMalKabulSiparisMiktariKontrolEdilirmi() {
			let flag = this.ozelYetkiler?.depoMalKabulSiparisMiktariKontrolEdilir;
			if (flag == null)
				flag = this.param.depoMalKabulSiparisMiktariKontrolEdilirmi;
			return flag;
		}
		get depoMalKabulSiparisHMRlimi() {
			let flag = this.ozelYetkiler?.depoMalKabulSiparisHMRli;
			if (flag == null)
				flag = this.param.depoMalKabulSiparisHMRlimi;
			return flag;
		}
		get depoSevkiyatSiparisKontrolEdilirmi() {
			let flag = this.ozelYetkiler?.depoSevkiyatSiparisKontrolEdilir;
			if (flag == null)
				flag = this.param.depoSevkiyatSiparisKontrolEdilirmi;
			return flag;
		}
		get depoSevkiyatSiparisMiktariKontrolEdilirmi() {
			let flag = this.ozelYetkiler?.depoSevkiyatSiparisMiktariKontrolEdilir;
			if (flag == null)
				flag = this.param.depoSevkiyatSiparisMiktariKontrolEdilirmi;
			return flag;
		}
		get depoSevkiyatSiparisHMRlimi() {
			let flag = this.ozelYetkiler?.depoSevkiyatSiparisHMRli;
			if (flag == null)
				flag = this.param.depoSevkiyatSiparisHMRlimi;
			return flag;
		}
		get depoSiparisRefKontrolEdilirmi() {
			let flag = this.ozelYetkiler?.depoSiparisRefKontrolEdilir;
			if (flag == null)
				flag = this.param.depoSiparisRefKontrolEdilirmi;
			return flag;
		}
		get depoSevkiyatSiparisKarsilamaOdemeGunTekmi() {
			let flag = this.ozelYetkiler?.depoSiparisKarsilamaOdemeGunTekmi;
			if (flag == null)
				flag = this.param.depoSevkiyatSiparisKarsilamaOdemeGunTekmi;
			return flag;
		}
		get ozelKampanyaKullanilirmi() {
			let flag = this.ozelYetkiler?.ozelKampanya;
			if (flag == null)
				flag = this.param.ozelKampanyaKullanilirmi;
			return flag;
		}
		get ozelKampanyaOranSayisi() {
			if (!this.ozelKampanyaKullanilirmi)
				return 0;
			let result = this.ozelYetkiler?.ozelKampanyaOranSayisi;
			if (result == null)
				result = asFloat(this.param.ozelKampanyaOranSayisi) || 0;
			return result;
		}
		get otoSonStokGuncellenirmi() {
			let flag = this.ozelYetkiler?.otoSonStokGuncelle;
			if (flag == null)
				flag = this.param.otoSonStokGuncellenirmi;
			return flag;
		}
		get kmTakibiYapilirmi() {
			if (!this.class.kmTakibiDesteklenirmi)
				return false;
			let flag = this.ozelYetkiler?.kmTakip;
			if (flag == null)
				flag = this.param.kmTakibiYapilirmi;
			return flag;
		}
		get ilkIrsaliyeDokumuZorunlumu() {
			let flag = this.ozelYetkiler?.ilkIrsaliye;
			if (flag == null)
				flag = this.param.ilkIrsaliyeDokumuZorunlumu;
			return flag;
		}
		get konumTakibiYapilirmi() {
			let flag = this.ozelYetkiler?.konumTakip;
			if (flag == null)
				flag = this.param.konumTakibiYapilirmi;
			return flag;
		}
		get konumsuzIslemYapilirmi() {
			let flag = this.ozelYetkiler?.konumsuzIslem;
			if (flag == null)
				flag = this.param.konumsuzIslemYapilirmi;
			return flag;
		}
		get konumToleransMetre() {
			let result = this.ozelYetkiler?.konumToleransMetre;
			if (result == null)
				result = asFloat(this.param.konumToleransMetre);
			return result || 0;
		}
		get rbkKullanilirmi() {
			let flag = this.ozelYetkiler?.rbk;
			if (flag == null)
				flag = this.param.rbkKullanilirmi;
			return flag;
		}
		get fisGirisiRbkOtomatikAcilsinmi() {
			const _flag = this.param.fisGirisiRbkOtomatikAcilsinmi;
			let flag = _flag == null || _flag === '' ? true : asBool(_flag);
			return flag
		}
		get dokumNushaSayi() { return (this.ozelYetkiler?.dokumNushaSayi ?? this.param.dokumNushaSayi) ?? 0 }
		get dokumNettenmi() {
			let flag = this.ozelYetkiler?.dokumNetten;
			if (flag == null)
				flag = this.param.dokumNettenmi;
			return flag;
		}
		get dokumDataPrefix() { let value = this.ozelYetkiler?.dokumDataPrefix; if (value == null) { value = this.param.dokumDataPrefix } return value }
		get dokumDataPostfix() { let value = this.ozelYetkiler?.dokumDataPostfix; if (value == null) { value = this.param.dokumDataPostfix } return value }
		get darDokummu() { let flag = this.ozelYetkiler?.darDokum; if (flag == null) { flag = this.param.darDokummu } return flag }
		get dokumZPLmi() { let flag = this.ozelYetkiler?.dokumZPL; if (flag == null) { flag = this.param.dokumZPLmi } return flag }
		get zplSatirYukseklik() { let value = this.ozelYetkiler?.zplSatirYukseklik; if (value == null) { value = this.param.zplSatirYukseklik || CETParam._defaultZPLSatirYukseklik } return value }
		get zplFontSize() { let value = this.ozelYetkiler?.zplFontSize; if (value == null) { value = this.param.zplFontSize || CETParam._defaultZPLFontSize } return value }
		get zplFontKod() { let value = this.ozelYetkiler?.zplFontKod; if (value == null) { value = this.param.zplFontKod || CETParam._defaultZPLFontKod } return value }
		get dokumNettenmi() {
			let flag = this.ozelYetkiler?.dokumNetten;
			if (flag == null)
				flag = this.param.dokumNettenmi;
			return flag;
		}
		get depoSiparisKarsilamaZorunluHMRListe() {
			let result = this.ozelYetkiler?.depoSiparisKarsilamaZorunluHMRListe;
			if (result == null)
				result = this.param.depoSiparisKarsilamaZorunluHMRListe;
			return result || [];
		}
		get depoSiparisKarsilamaZorunluHMRSet() {
			let result = asSet(this.depoSiparisKarsilamaZorunluHMRListe);
			if (!result.raf && ((this.ekOzellikKullanim || {}).raf || {}).kullanilirmi)
				result.raf = true
			return result
		}
		get dovizKullanilirmi() {
			let result = this.ozelYetkiler?.doviz;
			if (result == null)
				result = this.param.dovizKullanilirmi
				// result = this.programcimi && this.param.dovizKullanilirmi;
			return result == null ? false : result;
		}
		get nakliyeSekliKullanilmazmi() {
			let result = this.ozelYetkiler?.nakliyeSekliKullanilmaz ?? this.param.nakliyeSekliKullanilmazmi;
			return result == null ? false : result
		}
		get sevkYeriKullanilmazmi() {
			let result = this.ozelYetkiler?.sevkYeriKullanilmaz ?? this.param.sevkYeriKullanilmazmi;
			return result == null ? false : result
		}
		get eIslemOzelDokummu() {
			let flag = this.ozelYetkiler?.eIslemOzelDokum;
			if (flag == null)
				flag = this.param.dokumRuloDuzmu;
			return flag;
		}
		get ruloParam() {
			let result = this._ruloParam;
			if (result === undefined) {
				result = this.ozelYetkiler?.ruloParam;
				if (result == null)
					result = this.param.ruloParam || {};
				this._ruloParam = result;
			}
			return result;
		}
		get ruloEkNotlar() {
			let result = this._ruloEkNotlar;
			if (result === undefined) {
				result = this.ozelYetkiler?.ruloEkNotlar;
				if (result == null)
					result = this.param.ruloEkNotlar || {}
				this._ruloEkNotlar = result
			}
			return result
		}
		get ekOzellikKullanim() {
			let result = this._ekOzellikKullanim;
			if (result === undefined) {
				result = this.ozelYetkiler?.ekOzellikKullanim;
				if (result == null)
					result = this.param.ekOzellikKullanim || {}
				this._ekOzellikKullanim = result
			}
			return result
		}
		get resimBaseURL() { return (this.ozelYetkiler?.resimBaseURL ?? this.param.resimBaseURL) || `https://${this.param.wsHostNameUyarlanmis}:9200/ws/skyTablet/stokResim/?id=` }
		get isyeri() {
			let result = this._isyeri;
			if (result === undefined) {
				result = this.ozelYetkiler?.isyeri;
				if (result == null)
					result = this.param.isyeri || {};
				this._isyeri = result;
			}
			return result;
		}
		get tip2MatbuuFormDuzenleyiciler() {
			let result = this._tip2MatbuuFormDuzenleyiciler;
			if (result === undefined) {
				result = this.ozelYetkiler?.tip2MatbuuFormDuzenleyiciler;
				if (result == null)
					result = this.param.tip2MatbuuFormDuzenleyiciler || {};
				this._tip2MatbuuFormDuzenleyiciler = result;
			}
			return result;
		}

		get tip2MatbuuFormDuzenleyiciler_runtime() {
			let result = this._tip2MatbuuFormDuzenleyiciler_runtime;
			if (result === undefined) {
				result = this.ozelYetkiler?.tip2MatbuuFormDuzenleyiciler_runtime;
				if (result == null)
					result = this.param.tip2MatbuuFormDuzenleyiciler_runtime || {};
				this._tip2MatbuuFormDuzenleyiciler_runtime = result;
			}
			return result;
		}
		

		constructor(e) {
			e = e ?? {}; super(e); const {dbMgrSinif} = this.class;
			$.extend(this, {
				mainPart: this,
				// wsURLBase: updateWSUrlBaseBasit($.extend({}, sky.config, { path: sky.config.wsPath })),
				param: new CETParam(),
				dbMgrs: {
					param: new dbMgrSinif({ dbName: `${this.appName}_PARAM` }),
					rom_data: new dbMgrSinif({ dbName: `${this.appName}_ROM_DATA` })
					//data: new dbMgrSinif({ dbName: `${this.appName}_Data` })
				},
				dbTablePrefixes: { const: 'const_', master: 'mst_', data: 'data_' },
				dbCache: { recCounts: {} },
				dokumTemps: {},
				isAdmin: asBool(qs.admin),
				isDokumDebug: asBool(qs.dokumDebug),
				showLoadErrorsFlag: asBoolQ(qs.loadErrors),
				onKamerami: asBoolQ(qs.onKamerami) == null ? false : asBool(qs.onKamerami),
				ozelYetkiler: {
					uygunAyrimTipleri: qs.uygunAyrimTipleri == null ? null : qs.uygunAyrimTipleri.split('|').filter(ka => ka && ka.kod),
					serbestMod: asBoolQ(qs.serbestMod),
					otoSonStokGuncelle: qs.otoSonStokGuncelle == null ? null : asBool(qs.otoSonStokGuncelle),
					kmTakip: qs.kmTakip == null ? null : asBool(qs.kmTakip),
					ilkIrsaliye: qs.ilkIrsaliye == null ? null : asBool(qs.ilkIrsaliye),
					konumTakip: qs.konumTakip == null ? null : asBool(qs.konumTakip),
					gridAltMultiSelect: asBoolQ(qs.gridAltMultiSelect),
					listeKodDogrudanArama: asBoolQ(qs.listeKodDogrudanArama) == null ? asBoolQ(qs.listeKodDogrudanAramaYapilir) : asBoolQ(qs.listeKodDogrudanArama),
					fisOzetBilgi: asBoolQ(qs.fisOzetBilgiGosterilir),
					eIslem: asBoolQ(qs.eIslem),
					eIslemOzelDokum: asBoolQ(qs.eIslemOzelDokum),
					eBelgeAltSinir: qs.eBelgeAltSinir == null ? null : asFloat(qs.eBelgeAltSinir),
					rota: asBoolQ(qs.rota) == null ? asBoolQ(qs.rotaKullanilir) : asBoolQ(qs.rota),
					rotaZorunlu: asBoolQ(qs.rotaZorunlu) == null ? asBoolQ(qs.musteriRotaZorunlu) : asBoolQ(qs.rotaZorunlu),
					musteriDegistirilir: asBoolQ(qs.musteriDegistirilirmi) == null ? asBoolQ(qs.musteriDegistirilir) : asBoolQ(qs.musteriDegistirilirmi),
					bakiyeRiskGosterilmez: asBoolQ(qs.bakiyeRiskGosterilmez),
					oncekiFislerGosterilmez: asBoolQ(qs.oncekiFislerGosterilmez),
					fiyat: asBoolQ(qs.fiyat),
					tahsilatIptal: asBoolQ(qs.tahsilatIptal) == null ? asBoolQ(qs.tahIptal) : asBoolQ(qs.tahsilatIptal),
					tahsilattaAcikHesap: asBoolQ(qs.tahsilattaAcikHesap),
					alimNetFiyat: asBoolQ(qs.alimNetFiyat),
					alimFiyatGormez: asBoolQ(qs.alimFiyatGormez),
					satisFiyatGormez: asBoolQ(qs.satisFiyatGormez),
					iskonto: asBoolQ(qs.iskonto) == null ? asBoolQ(qs.isk) : asBoolQ(qs.iskonto),
					iskSayi: qs.iskSayi == null ? null : asInteger(qs.iskSayi),
					kamSayi: qs.kamSayi == null ? null : asInteger(qs.kamSayi),
					satirIskOranSinir: qs.satirIskOranSinir ? asFloat(qs.satirIskOranSinir) || 0 : null,
					menuAdimKisitIDListe: qs.menuAdimKisitIDListe ? qs.menuAdimKisitIDListe.split('|') : null,
					fisAdimKisitIDListe: qs.fisAdimKisitIDListe ? qs.fisAdimKisitIDListe.split('|') : null,
					dogrudanFisListeyeGirilirmi: asBool(qs.dogrudanFisListe),
					barkodluFisGiris: asBoolQ(qs.barkodluFisGiris),
					fisGirisSadeceBarkod: asBoolQ(qs.fisGirisSadeceBarkod),
					geciciFisYok: asBoolQ(qs.geciciFisYok),
					silerekBilgiAl: asBoolQ(qs.silerekBilgiAl),
					ozelKampanya: asBoolQ(qs.ozelKampanya),
					ozelKampanyaOranSayisi: qs.ozelKampanyaOranSayisi ? asInteger(qs.ozelKampanyaOranSayisi) : null,
					rbk: asBoolQ(qs.rbk) == null ? null : asBool(qs.rbk),
					doviz: asBoolQ(qs.doviz) == null ? null : asBool(qs.doviz),
					resimBaseURL: qs.resimBaseURL, barkodReferansAlinmaz: qs.barkodReferansAlinmaz,
					detaylarTersSirada: qs.detaylarTersSirada, hataliBarkodlarIcinMesaj: qs.hataliBarkodlarIcinMesaj, barkodOkutmaSessiz: qs.barkodOkutmaSessiz
				},
				initCallbacks: [],
				table2TipAdi: {
					data_PIFFis: `Belge`,
					data_TahsilatFis: `Tahsilat Fişi`,
					data_UgramaFis: `Uğrama Fişi`
					// mst_Cari: `Yeni Cari Tanım`
				}
			});
			this.dbMgr_mf = this.dbMgrs.rom_data;

			const extLogin = this.extensions.login;
			$.extend(extLogin.options, {
				isLoginRequired: false
				/*loginTypes: [
					{ kod: 'login', aciklama: 'VIO Kullanıcısı' },
					// { kod: 'plasiyerLogin', aciklama: '<span style="color: steelblue;">Plasiyer</span>' }
				]*/
			});
			// $.extend(extLogin.options, { isLoginRequired: true });
			this.updateWSUrlBase();
		}
		updateWSUrlBase(e) {
			let portArgs;
			for (let i = 0; i < 10; i++)
				portArgs = getArgsForRandomPort({ port: sky.config.port })
			
			this._wsURLBase = updateWSUrlBaseBasit($.extend({}, sky.config, { path: `ws/elterm${this.class.wsURLBase_postfix}/` }, portArgs, e));
		}

		async ilkIslemler(e) {
			try { Utils.disableHistoryBack() }
			catch (ex) { }

			if (Utils.consoleRedirect) {
				Utils.consoleRedirect({
					block: e => {
						const {divLine, divResult} = e;
						if (divLine && (divResult && divResult.length)) {
							divLine.appendTo(divResult);
							setTimeout(() =>
								divResult.scrollTop(10000000),
								1);
						}
					}
				});
			}

			let temp = qs.pre || qs.prescript || qs.preScript || qs.prescripts || qs.preScripts;
			if (temp) {
				const urls = temp.split('|').map(x => x.trim()).filter(x => !!x);
				await this.loadInjectScripts($.extend({}, e, { type: 'pre', urls: urls }));
			}

			/*try {
				if (sky.globalCache)
					sky.globalCache.yukle(e);
			}
			catch (ex) { console.error(ex) }*/

			for (const dbMgr of Object.values(this.dbMgrs || {})) {
				if (dbMgr?.open)
					await dbMgr.open()
			}
			try { await this.tablolariOlusturIslemi(e) }
			catch (ex) {
				displayServerResponse(ex);
				console.error(ex);
			}
			delete e.tx;
			
			await this.paramYukle(e);

			this.destroyWindows();
			try {
				this.loadScriptsResultsPromise = new $.Deferred(p => {
					setTimeout(async e => {
						try { p.resolve(this.loadInitialScripts(e)) }
						catch (ex) { p.reject(ex) }
					}, 10), e
				})
			}
			catch (ex) { console.error(ex) }

			if (!this.noFullScreenFlag) {
				try { requestFullScreen() }
				catch (ex) { }
			}

			await super.ilkIslemler(e);
		}

		async sonIslemler(e) {
			/*try {
				if (sky.globalCache)
					sky.globalCache.kaydet(e);
			}
			catch (ex) { console.error(ex) }*/

			let {activePart, isDevMode} = this;
			if (!activePart || activePart == this)
				await this.destroyWindows();
			
			await this.ortakReset();
			this.onbellekOlustur(e);
			
			if (!this.noFullScreenFlag) {
				try { requestFullScreen() }
				catch (ex) { }
			}

			((window.savedProcs || {}).showProgress || showProgress)
				(null, null, 100, false);
			
			/*const barkodContainer = $(`<div id="barkodContainer" style="width: 100px; height: 100px;"/>`).appendTo(sky.app.content);
			let qr = this.barcodeReader = new CETBarkodDevice.tip2Device.camera_qrCode({
				content: barkodContainer,
				debug: true,
				onKamerami: false,
				// onKamerami: false,
				readCallback: e => console.warn(e)
			});
			await qr.start()*/

			const {layout} = this;
			const spanLoginText = this.spanLoginText = layout.find(`#loginText`);
			spanLoginText.html(sky.config.sessionInfo.userBilgiCizgiliOzet({ styled: true }));
			this.postInitLayout_ara(e);

			const {loadScriptsResultsPromise} = this; if (loadScriptsResultsPromise?.then) {
				loadScriptsResultsPromise.then(async result => {
					const {initCallbacks} = this;
					if (!$.isEmptyObject(initCallbacks)) {
						if (!$.isEmptyObject(this.promisesWait)) { try { await Promise.all(this.promisesWait) } finally { delete this.promisesWait } }
						for (let i in initCallbacks) {
							const _result = await initCallbacks[i];
							try { if (_result && $.isFunction(_result.run)) { await _result.run(e) } } catch (ex) { defFailBlock(ex) }
						}
						this.afterRunVeMerkezdenBilgiYukleSonrasiOrtak(e)
					}
				})
			}

			let temp = qs.post || qs.postscript || qs.postScript || qs.postscripts || qs.postScripts;
			if (temp) {
				const urls = temp.split('|').map(x => x.trim()).filter(x => !!x);
				await this.loadInjectScripts($.extend({}, e, { type: 'post', urls: urls }));
			}
			await this.afterRunVeMerkezdenBilgiYukleSonrasiOrtak(e);
			
			/*if (!isDevMode) {
				const item = menuItems.filter(`#musteriDurumu.item`);
				if (item.length)
					item.remove();
			}*/

			layout.css('opacity', 1);
			
			if (this.dogrudanFisListeyeGirilirmi) {
				/*try { await this.promise_prefetchUI }
				catch (ex) { }*/
				await this.fisListesiIstendi(e);
			}

			hideProgress();
			((window.savedProcs || {}).hideProgress || hideProgress)();
			setTimeout(() => {
				hideProgress();
				((window.savedProcs || {}).hideProgress || hideProgress)();
				this.sonIslemlerSonrasi(e);
			}, 1000);
		}

		sonIslemlerSonrasi(e) {
			const {sonIslemlerSonrasi_ek} = this;
			if (sonIslemlerSonrasi_ek)
				sonIslemlerSonrasi_ek.call(this, e)
		}

		async run(e) {
			await super.run(e);

			const timeouts = [1000, 2000, 3000];
			for (const i in timeouts) {
				setTimeout(() => {
					hideProgress();
					((window.savedProcs || {}).hideProgress || hideProgress)();
				}, timeouts[i])
			}

			let result = await this.loginOncesiKontrol(e);
			this.aktarimProgressCompleted({ defer: true, delaySecs: 2, text: `İlk İşlemler tamamlandı` });
			if (!result) {
				let part = new CETParamPart({
					content: this.content,
					tamamIslemi: async e => {
						await e.sender.destroyPart();
						await this.destroyPart();
						delete sky.app;
						sky.run();
					}
				});
				await part.run();
				if (part.ortakIslemTuslariPart)
					await part.ortakIslemTuslariPart.destroyPart();
				this.destroyPart();
				return;
			}
			
			await this.extensions.login.loginIslemi(e);
			
			showProgress(null, null, 10);
			((window.savedProcs || {}).showProgress || showProgress)(null, null, 10, false);

			let callback = this.afterRunCallback;
			if ($.isFunction(callback)) {
				setTimeout(() => callback.call(this, e), 10);
				return
			}
			await this.sonIslemler(e)
		}
		async afterRun(e) {
			await super.afterRun(e)
		}
		async preInitLayout(e) {
			e = e || {};
			await super.preInitLayout(e);
			const rootLayout = this.rootLayout;
			const layout = e.layout || this.layout;
			// $('body').css('overflow-y', 'auto');
			$(document).on('contextmenu', evt => {
				evt.preventDefault();
				// return false;
			});

			document.addEventListener("backbutton", evt => {
				const {activePart} = this;
				if (activePart && activePart != this)
					activePart.geriIstendi({ event: evt })
			}, false);
			layout.css('opacity', .01);

			$.extend(this, {
				tempLayout: rootLayout.find(`#tempLayout`),
				templates: {
					merkezdenBilgiYukleMesaji: rootLayout.find(`#merkezdenBilgiYukleMesaji.template`),
					merkezeBilgiGonderMesaji: rootLayout.find(`#merkezeBilgiGonderMesaji.template`),
					cetAppIndicator: rootLayout.find(`#cetAppIndicator.part`),
					cetKnobProgress: rootLayout.find(`#cetKnobProgress.part`),
					cetExpandableIslemTuslari: rootLayout.find(`#cetExpandableIslemTuslari.part`),
					cetMstComboBox: rootLayout.find(`#cetMstComboBox.part`),
					cetOrtakIslemTuslari: rootLayout.find(`#cetOrtakIslemTuslari.part`),
					cetListeOrtak: rootLayout.find(`#cetListeOrtak.part`),
					cetDokumOnizleme: rootLayout.find(`#cetDokumOnizleme.part`),
					param: rootLayout.find(`#cetParam.part`),
					cetVeriYonetimi: rootLayout.find(`#cetVeriYonetimi.part`),
					cetKMGiris: rootLayout.find(`#cetKMGiris.part`),
					cariTanim: rootLayout.find(`#cetCariTanim.part`),
					fiyatGor: rootLayout.find(`#cetFiyatGor.part`),
					numaratorListe: rootLayout.find(`#cetNumaratorListe.part`),
					cetKAListe: rootLayout.find(`#cetKAListe.part`),
					cetSonStoktanSec: rootLayout.find(`#cetSonStoktanSec.part`),
					stokListe: rootLayout.find(`#cetStokListe.part`),
					cariListe: rootLayout.find(`#cetCariListe.part`),
					bekleyenSiparislerListe: rootLayout.find(`#cetBekleyenSiparislerListe.part`),
					fisListe: rootLayout.find('#cetFisListe.part'),
					fisGirisIslemSecim: rootLayout.find('#cetFisGirisIslemSecim.part'),
					fisOzetBilgi: rootLayout.find(`#cetFisOzetBilgi.part`),
					rbkGiris: rootLayout.find('#cetRBKGiris.part'),
					fisGiris: rootLayout.find('#cetFisGiris.part'),
					forkliftFisGiris: rootLayout.find('#cetForkliftFisGiris.part'),
					bekleyenXFisGiris: rootLayout.find('#cetBekleyenXFisGiris.part'),
					tahsilat: rootLayout.find('#cetTahsilat.part'),
					ugramaGiris: rootLayout.find('#cetUgramaGiris.part'),
					fisGirisSonStoktanSecim: rootLayout.find('#cetFisGirisSonStoktanSecim.part'),
					cetRaporlar: rootLayout.find('#cetRaporlar.part'),
					cetRaporGridli: rootLayout.find('#cetRaporGridli.part'),
					cetPromoUrunSecim: rootLayout.find('#cetPromoUrunSecim.part'),
					musteriDurumu: rootLayout.find('#cetMusteriDurumu.part')
				}
			});
			$.extend(this.extensions.login.options, {
				loginUI_content: layout
			});

			const knobProgressInitArgs = this.knobProgressInitArgs = this.knobProgressInitArgs || {};
			knobProgressInitArgs.template = () => this.templates.cetKnobProgress;
			const indicatorPartInitArgs = this.indicatorPartInitArgs = this.indicatorPartInitArgs || {};
			indicatorPartInitArgs.template = () => this.templates.cetAppIndicator;

			await this.knobProgressDestroy();
			this.aktarimProgressCompleted({ defer: true, delaySecs: 5, text: `İlk İşlemler tamamlandı` });

			const {param} = this;
			const userSettings = param.userSettings = param.userSettings || {};
			const islemTuslari = this.islemTuslari = layout.find('.islemTuslari');
			islemTuslari
				.addClass(`prog ${this.appName} ${this.rootAppName}`)
				.detach()
				.appendTo(this.header);
			const btnLogout = this.btnLogout = islemTuslari.find('#btnLogout');
			btnLogout
				.jqxButton({ theme: theme })
				// .jqxTooltip({ theme: theme, trigger: `hover`, content: `Oturum kapat` })
				.on('click', evt => this.logoutIstendi());
			const btnToggleFullScreen = this.btnToggleFullScreen = islemTuslari.find(`#btnToggleFullScreen`);
			btnToggleFullScreen.jqxButton({ theme: theme });
			btnToggleFullScreen.on('click', evt =>
				this.toggleFullScreen(e));

			// this.otoAktarFlag = userSettings.otoAktar;
			this.otoAktarFlag = false;
			const chkOtoAktar = this.chkOtoAktar = islemTuslari.find('#chkOtoAktar');
			chkOtoAktar.jqxToggleButton({ theme: theme, toggled: asBool(this.otoAktarFlag) });
			chkOtoAktar.jqxTooltip({ theme: theme, trigger: `hover`, position: `bottom`, content: `Aktarılmamış Belgeler otomatik olarak arkaplanda kontrol edilir ve Merkeze Aktarılır` });
			// chkOtoAktar.off('click');
			chkOtoAktar.on('click', evt => {
				this.otoAktarFlag = userSettings.otoAktar = chkOtoAktar.jqxToggleButton('toggled');
				this.param.kaydet();
			});

			const btnGonderimIsaretSifirla = this.btnGonderimIsaretSifirla = islemTuslari.find('#btnGonderimIsaretSifirla');
			btnGonderimIsaretSifirla.jqxButton({ theme: theme });
			btnGonderimIsaretSifirla.on('click', evt =>
				this.gonderimIsaretSifirlaIstendi(e));
		}
		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);
			const {rootLayout} = this;
			const layout = e.layout || this.layout;
			const {indicatorPart} = this;
			if (indicatorPart)
				indicatorPart.initCallbacks()
			
			const menu = this.divAnaMenu = layout.find(`#anaMenu`);
			let items = menu.find(`.item`);
			if (!this.rotaKullanilirmi) {
				const li = items.filter(`#rotaListesi`);
				if (li.length)
					li.remove();
			}
			if (!this.class.appMagazaVeyaSDMmi) {
				const li = items.filter(`#bekleyenXFislerGuncelle`);
				if (li.length)
					li.remove();
			}
			const cacheKeys = window.caches ? await window.caches.keys() : [];
			if ($.isEmptyObject(cacheKeys)) {
				const li = items.filter(`#cacheReset`);
				if (li.length)
					li.addClass('jqx-hidden');
			}
			else {
				items.filter(`#cacheReset`)
					.jqxTooltip({ theme: theme, trigger: `hover`, content: `Önbelleği temizle` });
			}

			if (true) {
				const li = items.filter(`#veriYonetimi`);
				if (li.length)
					li.jqxTooltip({ theme: theme, trigger: `hover`, content: `Veri Yönetimi` });
			}

			/*menu.jqxMenu({
				mode: 'vertical',
				theme: theme, minimizeWidth: 300,
				animationShowDuration: 0, animationHideDuration: 0
			});*/
			items.on('click', evt =>
				this.menuItemClicked($.extend({}, e, { event: evt })));
			
			//if (navigator.onLine)
			//	this.merkezdenBilgiYukle();
		}
		postInitLayout_ara(e) {
		}
		async destroyLayout(e) {
			e = e || {};
			let layout = e.layout || this.layout;
			let islemTuslari = this.islemTuslari;
			if (islemTuslari && islemTuslari.length) {
				islemTuslari
					.removeClass(`prog ${this.class.rootAppName}`)
					.detach()
					.appendTo(this.layout)
			}
			await super.destroyLayout(e)
			// await this.cleanUpWidgets(e)
		}
		async activatePart(e) {
			await this.cleanUpWidgets(e);
			await super.activatePart(e)
		}

		ajaxSetup(e) {
			if (!this.programcimi)
				$.ajaxSetup({ timeout: 10 * 60 * 1000 });
		}
		getSubLayoutContainer(e) {
			const layout = e.layout || this.layout;
			return layout.find('#mainPart')
		}
		getSubLayoutContent(e) {
			return this.parent.find('#_mainPart').children()
		}

		mfTip2AciklamaDuzenle(e) {
			const {fisTipleriDuzenlenmis} = this;
			for (const i in fisTipleriDuzenlenmis) {
				const ka = fisTipleriDuzenlenmis[i];
				e.mfTip2Aciklama[ka.kod] = ka.aciklama;
			}
		}
		mfTipIcinAdiFor(e) {
			e = e || {};
			const tip = typeof e == 'object' ? e.tip : e;
			
			let parts = tip.split('-');
			const anaTip = parts[0];
			const altTip = parts[1];
			
			let text = this.mfTip2AciklamaDict[anaTip];
			if (text && altTip) {
				let altTipText = this.eIslemTip2KisaAdi(altTip);
				if (altTipText)
					text += ` (${altTipText})`;
			}

			return text;
		}
		eIslemTip2AciklamaDuzenle(e) {
			const {target} = e;
			$.extend(target, {
				E: { aciklama: 'e-Fatura', kisaAdi: 'e-Fat' },
				A: { aciklama: 'e-Arşiv', kisaAdi: 'e-Arşiv' },
				IR: { aciklama: 'e-İrsaliye', kisaAdi: 'e-İrs.' },
				BL: { aciklama: 'e-Belge', kisaAdi: 'e-Belge' }
			});
		}
		eIslemTip2Aciklama(e) {
			e = e || {};
			const rec = (typeof e == 'object' ? e.rec : e) || e;
			const tip = typeof e == 'object' ? rec.tip || rec.eIslemTip || rec.efayrimtipi : rec;
			return this.eIslemTip2AciklamaDict[tip]
		}
		eIslemTip2UzunAdi(e) {
			return (this.eIslemTip2Aciklama(e) || {}).aciklama
		}
		eIslemTip2KisaAdi(e) {
			return (this.eIslemTip2Aciklama(e) || {}).kisaAdi
		}
		konsolideTip2AciklamaDuzenle(e) {
			const {target} = e;
			$.extend(target, {
				M: 'K.Merkez',
				S: 'K.Şube'
			});
		}
		konsolideTip2Aciklama(e) {
			e = e || {};
			const rec = (typeof e == 'object' ? e.rec : e) || e;
			const key = typeof e == 'object' ? rec.konTipKod : rec;
			return this.konsolideTip2AciklamaDict[key]
		}
		async grupKod2Adi(e) {
			e = e || {};
			const kod = typeof e == 'object' ? e.grupKod || e.kod : e;
			let dict = this._grupKod2Adi;
			if (dict == null)
				dict = await this.grupKod2AdiOlustur(e);
			
			return dict[kod];
		}
		async grupKod2AdiOlustur(e) {
			e = e || {};
			const tx = e.tx;

			let stm = new MQStm({
				sent: new MQSent({
					from: `mst_StokGrup grp`,
					where: `grp.kod <> ''`,
					sahalar: [`grp.kod`, `grp.aciklama`]
				})
			});
			let rs = await this.dbMgrs.rom_data.executeSql({ tx: tx, query: stm });
			let result = this._grupKod2Adi = {};
			for (let i = 0; i < rs.rows.length; i++) {
				const rec = rs.rows[i];
				result[rec.kod] = rec.aciklama
			}
			return result
		}
		fisListe_stmSentDuzenle(e) {
			this.fisListe_stmSentDuzenleDevam(e);
			this.fisSinifOlanFisTipleri.forEach(rec =>
				rec.fisSinif.fisListe_stmSentDuzenle(e));
			/*let orderBy = e.stm.orderBy;
			if (!e.rowCountOnly && $.isEmptyObject(orderBy.liste))
				orderBy.add('kayitzamani');*/
		}
		fisListe_stmSentDuzenleDevam(e) {
			e = e || {};
			const {rowCountOnly} = e;
			const {ozelIsaretKullanilirmi, bakiyeRiskGosterilmezmi} = this;
			const musteriDurumumu = bakiyeRiskGosterilmezmi ? false : (e.musteriDurumu || e.musteriDurumumu);
			//if (!musteriDurumumu) {
				e.uni.add(new MQSent({
					from: `data_UgramaFis fis`,
					fromIliskiler: [
						// { from: 'mst_Cari car', iliski: 'fis.mustkod = car.kod' }
						{ alias: `fis`, leftJoin: `mst_Cari car`, on: `fis.mustkod = car.kod` }
					],
					sahalar: (rowCountOnly
						? `COUNT(*) sayi`
						: [	`fis.rowid`,
							`'Uğrama' fisTipText`,
							`0 topKdv`, `0 fisSonuc`, `0 detaySayisi`,
							`fis.kayitzamani`, `fis.gonderildi`, `fis.silindi`, `fis.yazdirildi`, `fis.gecici`, `fis.rapor`, `'*' tamamlandi`, `fis.degismedi`,
							`'U' fistipi`, `'' piftipi`, `'' almsat`, `'' iade`, `'' ayrimtipi`, `'' ozelIsaret`, `fis.tarih`, `NULL vade`, `'' seri`, `0 fisno`,
							'fis.mustkod ticmustkod', /*'car.bakiye', 'car.riskli kalanRisk',*/ `'' efayrimtipi`, `'' zorunluguidstr`,
							`fis.mustkod`, 'car.unvan mustunvan', 'car.yore', 'car.ilKod', 'car.ilAdi', `car.efatmi`, `fis.fisaciklama`, `'' ba`,
						    `'' seferAdi`, `'' soforAdi`, `'' plaka`, `'' ekBilgi`, `'' containerNox`, `0 planNo`, `0 dipiskoran`, `0 dipiskbedel`, `'' dvkod`
						  ])
				}));
			//}

			let ayrimTipiClause = '';
			const {uygunAyrimTipleri} = this;
			if (!$.isEmptyObject(uygunAyrimTipleri)) {
				for (const ka of uygunAyrimTipleri) {
					const {kod, aciklama} = ka;
					if (kod) {
						if (ayrimTipiClause)
							ayrimTipiClause += ' ';
						else
							ayrimTipiClause = '(case';
						if (kod == 'IH')
							ayrimTipiClause += ` when fis.ayrimtipi = '${kod}' then (case when almsat = 'A' then ' İthalat' else ' ${aciklama}' end)`;
						else
							ayrimTipiClause += ` when fis.ayrimtipi = '${kod}' then ' ${aciklama}'`;
					}
				}
				if (ayrimTipiClause)
					ayrimTipiClause += ' end)';
			}

			e.uni.add(new MQSent({
				from: `data_PIFFis fis`,
				fromIliskiler: [
					// { from: 'mst_Cari car', iliski: 'fis.mustkod = car.kod' }
					{ alias: `fis`, leftJoin: `mst_Cari car`, on: `fis.mustkod = car.kod` },
					{ alias: `fis`, leftJoin: `mst_SevkAdres sadr`, on: `fis.xadreskod = sadr.kod` },
				],
				where: [
					( ozelIsaretKullanilirmi
						? `1 = 1`
						: `fis.ozelisaret = ''` ),
					( musteriDurumumu
						 ? `1 = 1`
						 : `fis.rapor = ''` )
				],
				sahalar: (rowCountOnly
					? `COUNT(*) sayi`
					: [	`fis.rowid`,
						/*`(
							(case
								when fis.almsat = 'A' then 'Alım '
								when fis.almsat = 'T' then 'Satış '
								else '' end) ||
							(case when
								fis.iade = '' then '' else ' İade'
									end) || '' ||
							${ayrimTipiClause || `''`} ||
							(case
								when fis.piftipi = 'F' then ' Fatura'
								when fis.piftipi = 'I' then ' İrsaliye'
								when fis.piftipi = 'S' then ' Sipariş'
								when fis.fistipi = 'SY' then ' Sayım'
								when fis.fistipi = 'TR' then ' Depo Transfer'
								when fis.fistipi = 'TRS' then ' Şube Transfer'
								when fis.fistipi = 'ML' then ' Mal Kabul'
								when fis.fistipi = 'SV' then ' Sevkiyat'
								when fis.fistipi = 'PS' then ' Plasiyer Ertesi Gün Sipariş'
								when fis.fistipi = 'PI' then ' Plasiyer Depoya İADE'
								when fis.fistipi = 'FORKLIFT' then ' Forklift Taşıma'
								else '' end)
						 )*/ `NULL fisTipText`,
						`fis.topkdv topKdv`, `fis.net fisSonuc`, `fis.detaykayitsayisi detaySayisi`,
						`fis.kayitzamani`, `fis.gonderildi`, `fis.silindi`, `fis.yazdirildi`, `fis.gecici`, `fis.rapor`, `fis.tamamlandi`, `fis.degismedi`,
						`fis.fistipi`, `fis.piftipi`, `fis.almsat`, `fis.iade`, `fis.ayrimtipi`, `fis.ozelisaret ozelIsaret`, `fis.tarih`, `fis.vade`, `fis.seri`, `fis.fisno`,
						`fis.ticmustkod`, /*, 'rcar.bakiye', 'rcar.riskli',*/ `fis.efayrimtipi`, `fis.zorunluguidstr`,
						`fis.mustkod`, `car.unvan mustunvan`,
						   `COALESCE(sadr.yore, car.yore) yore`,
						   `COALESCE(sadr.ilKod, car.ilKod) ilKod`,
						   `COALESCE(sadr.ilAdi, car.ilAdi) ilAdi`,
						`car.efatmi`, `fis.fisaciklama`,
						`(case
								when (
									(fis.almsat = 'T' and fis.iade = '') OR
									(fis.almsat = 'A' and fis.iade = 'I')
								) then 'B'
								else
									'A'
							end) ba`,
						`fis.seferAdi`, `fis.soforAdi`, `fis.plaka`, `fis.ekBilgi`, `fis.containerNox`, `fis.planNo`,
					   `fis.dipiskoran`, `fis.dipiskbedel`, `fis.dvkod`
					  ])
			}));

			e.uni.add(new MQSent({
				from: `data_TahsilatFis fis`,
				fromIliskiler: [
					// { from: 'mst_Cari car', iliski: 'fis.mustkod = car.kod' }
					{ alias: `fis`, leftJoin: `mst_Cari car`, on: `fis.mustkod = car.kod` }
				],
				where: [
					( ozelIsaretKullanilirmi
						? `1 = 1`
						: `fis.ozelisaret = ''` ),
					( musteriDurumumu
						 ? `1 = 1`
						 : `fis.rapor = ''` )
				],
				sahalar: (e.rowCountOnly
					? `COUNT(*) sayi`
					: [	`fis.rowid rowid`,
						`'Tahsilat' fisTipText`,
						`0 topKdv`, `fis.toplambedel fisSonuc`, `fis.detaykayitsayisi detaySayisi`,
						`fis.kayitzamani`, `fis.gonderildi`, `fis.silindi`, `fis.yazdirildi`, `fis.gecici`, `fis.rapor`, `'*' tamamlandi`, `fis.degismedi`,
						`'BT' fistipi`, `'' piftipi`, `'' almsat`, `'' iade`, `'' ayrimtipi`, `fis.ozelisaret ozelIsaret`, `fis.tarih`, `NULL vade`, `fis.seri`, `fis.fisno`,
						`fis.mustkod ticmustkod`, /*'car.bakiye', 'car.riskli kalanRisk',*/ `'' efayrimtipi`, `'' zorunluguidstr`,
						`fis.mustkod`, `car.unvan mustunvan`, `car.yore`, `car.ilKod`, `car.ilAdi`, `car.efatmi`, `fis.fisaciklama`, `'' ba`,
					   `'' seferAdi`, `'' soforAdi`, `'' plaka`, `'' ekBilgi`, `'' containerNox`, `0 planNo`, `0 dipiskoran`, `0 dipiskbedel`, `'' dvkod`
					  ])
			}));

			if (musteriDurumumu) {
				e.uni.add(new MQSent({
					from: `data_DigerHareket fis`,
					fromIliskiler: [
						// { from: 'mst_Cari car', iliski: 'fis.mustkod = car.kod' }
						{ alias: `fis`, leftJoin: `mst_Cari car`, on: `fis.mustkod = car.kod` }
					],
					sahalar: (rowCountOnly
						? `COUNT(*) sayi`
						: [	`fis.rowid`, `fis.islAdi fisTipText`,
							`0 topKdv`, `fis.bedel fisSonuc`, `0 detaySayisi`,
							`NULL kayitzamani`, `'*' gonderildi`, `fis.silindi`, `'' yazdirildi`, `fis.gecici`, `fis.rapor`, `'*' tamamlandi`, `'' degismedi`,
							`fis.fistipi`, `'' piftipi`, `'' almsat`, `'' iade`, `'' ayrimTipi`, `fis.ozelisaret ozelIsaret`, `fis.tarih`, `fis.vade`, `fis.seri`, `fis.fisno`,
							'fis.mustkod ticmustkod', /*'car.bakiye', 'car.riskli kalanRisk',*/ `'' efayrimtipi`, `'' zorunluguidstr`,
							`fis.mustkod`, `car.unvan mustunvan`, `car.yore`, `car.ilKod`, `car.ilAdi`, `car.efatmi`, `fis.refText fisaciklama`, `fis.ba`,
						   `'' seferAdi`, `'' soforAdi`, `'' plaka`, `'' ekBilgi`, `'' containerNox`, `0 planNo`, `0 dipiskoran`, `0 dipiskbedel`, `'' dvkod`
						  ])
				}));
			}
		}
		rotaListe_fisIslemleri_stmSentDuzenle(e) {
			this.rotaListe_fisIslemleri_stmSentDuzenleDevam(e);
			this.rotaListe_fisIslemleri_stmSentDuzenleDevam_whereBagla(e);
			this.fisSinifOlanFisTipleri.forEach(rec =>
				rec.fisSinif.rotaListe_fisIslemleri_stmSentDuzenle(e))
		}
		rotaListe_fisIslemleri_stmSentDuzenleDevam(e) {
			const {ozelIsaretKullanilirmi} = this;
			const {uni, rowCountOnlyFlag} = e;
			uni.add(new MQSent({
				from: `data_PIFFis fis`,
				where: [
					( ozelIsaretKullanilirmi
						? `1 = 1`
						: `fis.ozelisaret = ''` ),
					`fis.silindi = ''`, `fis.gecici = ''`, `fis.rapor = ''`
				],
				sahalar: (rowCountOnlyFlag
					? `COUNT(*) sayi`
					: [	'fis.mustkod mustKod', 'SUM(fis.topkdv) topKdv',
						`(case
								when (fis.almsat = '') <> (fis.iade = '')
									then	SUM(fis.net)
									else	0 - SUM(fis.net)
							end) fisSonuc`,
						'COUNT(*) kayitSayisi' ]),
				groupBy: ['fis.mustKod']
			}));
			
			e.uni.add(new MQSent({
				from: `data_TahsilatFis fis`,
				where: [
					( ozelIsaretKullanilirmi
						? `1 = 1`
						: `fis.ozelisaret = ''` ),
					`fis.silindi = ''`, `fis.gecici = ''`, `fis.rapor = ''`
				],
				sahalar: (e.rowCountOnlyFlag
					? `COUNT(*) sayi`
					: [	'fis.mustkod mustKod', '0 topKdv',
							/* `SUM(fis.toplambedel) fisSonuc`, */
							`0 fisSonuc`,
							'COUNT(*) kayitSayisi'
					  ]),
				groupBy: ['fis.mustKod']
			}));
			
			uni.add(new MQSent({
				from: `data_UgramaFis fis`,
				where: [
					`fis.silindi = ''`, `fis.gecici = ''`, `fis.rapor = ''`
				],
				sahalar: (rowCountOnlyFlag
					? `COUNT(*) sayi`
					: [	'fis.mustkod mustKod', '0 topKdv',
						`0 fisSonuc`,
						'COUNT(*) kayitSayisi'
					  ]),
				groupBy: ['fis.mustKod']
			}));
		}
		rotaListe_fisIslemleri_stmSentDuzenleDevam_whereBagla(e) {
			const {ozelIsaretKullanilirmi} = this;
			const {uni, mustKodListe} = e;
			if (!$.isEmptyObject(mustKodListe)) {
				uni.sentDo(sent => {
					sent.where
						.inDizi(mustKodListe, 'fis.mustkod');
				})
			}
		}
		rapor_ilkIrsaliye_stmSentDuzenle(e) {
			this.rapor_ilkIrsaliye_stmSentDuzenleDevam(e);
			this.fisSinifOlanFisTipleri.forEach(rec =>
				rec.fisSinif.rapor_ilkIrsaliye_stmSentDuzenle(e));
		}
		rapor_ilkIrsaliye_stmSentDuzenleDevam(e) {
			const {uni, stm} = e;
			const detaylimi = asBool(e.detayli || e.detaylimi);
			const sent = new MQSent({
				from: `mst_Stok stk`,
				where: [`stk.kod <> ''`],
				sahalar: [
					`son.yerKod`, `stk.kod stokKod`, `stk.aciklama stokAdi`, `stk.brm`,
					`SUM(son.orjMiktar) orjMiktar`, `SUM(son.miktar) kalanMiktar`, `SUM(son.orjMiktar + son.olasiFark) olasiMiktar`
				],
				groupBy: [`son.yerKod`, `stk.kod`]
			});
			if (detaylimi) {
				const {idSahalar} = CETEkOzellikler;
				if (!$.isEmptyObject(idSahalar)) {
					for (const idSaha of idSahalar) {
						const aliasVeSaha = `son.${idSaha}`;
						sent.sahalar.add(aliasVeSaha);
						sent.groupBy.add(aliasVeSaha)
					}
				}
			}
			uni.add(sent);

			const {defaultPlasiyerKod, defaultYerKod} = this;
			let yerKod = !this.class.appMagazaVeyaSDMmi && defaultYerKod && defaultPlasiyerKod ? defaultYerKod : null;
			/*uni.sentDo(sent => {
				if (yerKod)
					sent.where.degerAta(yerKod, `son.yerKod`);
				else
					sent.where.add(`son.yerKod <> ''`);
			})*/
			this.stmSentDuzenle_sonStokBagla({
				stm: stm, alias: `stk`, shKodClause: `stk.kod`,
				leftJoin: false, yerKod: yerKod || null
			});
			stm.orderBy
				.addAll([`yerKod`, `aciklama`])
		}
		rapor_sonStok_stmSentDuzenle(e) {
			this.rapor_sonStok_stmSentDuzenleDevam(e);
			this.fisSinifOlanFisTipleri.forEach(rec =>
				rec.fisSinif.rapor_sonStok_stmSentDuzenle(e))
		}
		rapor_sonStok_stmSentDuzenleDevam(e) {
			const {uni, stm} = e;
			const detaylimi = asBool(e.detayli || e.detaylimi);
			const sent = new MQSent({
				from: `mst_Stok stk`,
				where: [`stk.kod <> ''`],
				sahalar: [
					`son.yerKod`, `stk.kod stokKod`, `stk.aciklama stokAdi`, `stk.brm`,
					`SUM(son.orjMiktar) orjMiktar`, `SUM(son.miktar) kalanMiktar`, `SUM(son.orjMiktar + son.olasiFark) olasiMiktar`
				],
				groupBy: [`son.yerKod`, `stk.kod`]
			});
			if (detaylimi) {
				const {idSahalar} = CETEkOzellikler;
				if (!$.isEmptyObject(idSahalar)) {
					for (const idSaha of idSahalar) {
						const aliasVeSaha = `son.${idSaha}`;
						sent.sahalar.add(aliasVeSaha);
						sent.groupBy.add(aliasVeSaha)
					}
				}
			}
			uni.add(sent);

			const {defaultPlasiyerKod, defaultYerKod} = this;
			let yerKod = !this.class.appMagazaVeyaSDMmi && defaultYerKod && defaultPlasiyerKod ? defaultYerKod : null;
			/*uni.sentDo(sent => {
				if (yerKod)
					sent.where.degerAta(yerKod, `son.yerKod`);
				else
					sent.where.add(`son.yerKod <> ''`);
			})*/
			this.stmSentDuzenle_sonStokBagla({
				stm: stm, alias: 'stk', shKodClause: 'stk.kod',
				leftJoin: false, yerKod: yerKod || null,
				detaylimi: detaylimi
			});
			stm.orderBy
				.addAll([`yerKod`, `aciklama`])
		}
		rapor_satislar_stmSentDuzenle(e) {
			this.rapor_satislar_stmSentDuzenleDevam(e);
			this.fisSinifOlanFisTipleri.forEach(rec =>
				rec.fisSinif.rapor_satislar_stmSentDuzenle(e))
		}
		rapor_satislar_stmSentDuzenleDevam(e) {
			e = e || {};
			const {rowCountOnly} = e;
			const sent = new MQSent({
				from: `data_PIFStok har`,
				fromIliskiler: [
					{ from: 'data_PIFFis fis', iliski: 'har.fissayac = fis.rowid' },
					{ from: 'mst_Stok stk', iliski: 'har.shkod = stk.kod' }
				],
				where: [
					`fis.silindi = ''`, `fis.gecici = ''`, `fis.rapor = ''`,
					`har.miktar <> 0`
				],
				sahalar: (rowCountOnly
					? `COUNT(*) sayi`
					: [	'har.shkod stokKod', 'stk.aciklama stokAdi',
						`(case when COALESCE(har.xbrm, '') = '' then 'AD' else har.xbrm end) brm`,
						'sum(har.miktar) miktar', 'sum(har.belgebedel) netBedel' ]),
				groupBy: (rowCountOnly
							? null
							: [
								'har.shkod', 'stk.aciklama',
								`(case when COALESCE(har.xbrm, '') = '' then 'AD' else har.xbrm end)`
							  ])
			});
			const {idSahalar} = CETEkOzellikler;
			if (!$.isEmptyObject(idSahalar)) {
				for (const i in idSahalar) {
					const idSaha = idSahalar[i];
					const aliasVeSaha = `har.${idSaha}`;
					if (!rowCountOnly) {
						sent.sahalar.add(aliasVeSaha);
						sent.groupBy.add(aliasVeSaha);
					}
				}
			}
			e.uni.add(sent);
			e.stm.orderBy.addAll(['aciklama'])
		}
		rapor_tahsilatlar_stmSentDuzenle(e) {
			this.rapor_tahsilatlar_stmSentDuzenleDevam(e);
			this.fisSinifOlanFisTipleri.forEach(rec =>
				rec.fisSinif.rapor_tahsilatlar_stmSentDuzenle(e));
		}
		rapor_tahsilatlar_stmSentDuzenleDevam(e) {
			e.uni.add(new MQSent({
				from: `data_TahsilatDetay har`,
				fromIliskiler: [
					{ from: 'data_TahsilatFis fis', iliski: 'har.fissayac = fis.rowid' },
					{ from: 'mst_TahsilSekli tsek', iliski: 'har.tahSekliNo = tsek.kodNo' }
				],
				where: [
					`fis.silindi = ''`, `fis.gecici = ''`, `fis.rapor = ''`,
					`har.bedel <> 0`
				],
				sahalar: (e.rowCountOnly
					? `COUNT(*) sayi`
					: [	'har.tahSekliNo', 'tsek.aciklama tahSekliAdi', 'sum(har.bedel) bedel' ]),
				groupBy: (e.rowCountOnly
							? null
							: ['har.tahSekliNo', 'tsek.aciklama'])
			}));

			e.uni.add(new MQSent({
				from: `data_PIFFis fis`,
				fromIliskiler: [
					{ from: 'mst_TahsilSekli tsek', iliski: 'fis.tahseklikodno = tsek.kodNo' }
				],
				where: [
					`fis.silindi = ''`, `fis.gecici = ''`, `fis.rapor = ''`,
					`fis.tahseklikodno > 0`, `fis.net <> 0`,
					`(tsek.tahsilTipi <> '' OR tsek.tahsilAltTipi <> '')`
				],
				sahalar: (e.rowCountOnly
					? `COUNT(*) sayi`
					: [	'fis.tahseklikodno tahSekliNo', 'tsek.aciklama tahSekliAdi', 'sum(fis.net) bedel' ]),
				groupBy: (e.rowCountOnly
							? null
							: [`tahSekliNo`, `tsek.aciklama`])
			}));

			e.stm.orderBy
				.addAll(['tahSekliAdi']);
		}
		rapor_gunSonuRaporu_stmSentDuzenle_miktarHesaplasma_devirVeKalan(e) {
			this.rapor_gunSonuRaporu_stmSentDuzenleDevam_miktarHesaplasma_devirVeKalan(e);
			this.fisSinifOlanFisTipleri.forEach(rec =>
				rec.fisSinif.rapor_gunSonuRaporu_stmSentDuzenle_miktarHesaplasma_devirVeKalan(e));
		}
		rapor_gunSonuRaporu_stmSentDuzenleDevam_miktarHesaplasma_devirVeKalan(e) {
			const yerKod = e.yerKod || this.defaultYerKod || '';
			const {uni} = e;
			uni.add(new MQSent({
				from: `mst_SonStok son`,
				fromIliskiler: [
					{ from: 'mst_Stok stk', iliski: `son.stokKod = stk.kod` },
					{ alias: 'stk', leftJoin: `mst_StokGrup grp`, iliski: `stk.grupKod = grp.kod` }
				],
				where: [`son.orjMiktar > 0`],
				sahalar: (e.rowCountOnly
					? `COUNT(*) sayi`
					: [
						`NULL tarih`, `stk.grupKod`, `grp.aciklama grupAdi`,
						`son.stokKod`, `stk.aciklama stokAdi`,
						`(case when COALESCE(stk.brm, '') = '' then 'AD' else stk.brm end) brm`,
						`SUM(son.orjMiktar) devir`, `SUM(son.miktar) kalan`, `SUM(son.orjMiktar + son.olasiFark) olasiMiktar`
					  ]),
				groupBy: (e.rowCountOnly
							? null
							: [
								`stk.grupKod`, `grp.aciklama`, 'son.stokKod', 'stk.aciklama',
								`(case when COALESCE(stk.brm, '') = '' then 'AD' else stk.brm end)`
							  ])
			}));
			if (yerKod) {
				uni.sentDo(sent => {
					sent.where
						.degerAta(yerKod, 'son.yerKod')
				});
			}
			e.stm.orderBy
				.addAll([`tarih DESC`, `stokAdi`]);
		}
		rapor_gunSonuRaporu_stmSentDuzenle_miktarHesaplasma_satisHareketler(e) {
			this.rapor_gunSonuRaporu_stmSentDuzenleDevam_miktarHesaplasma_satisHareketler(e);
			this.fisSinifOlanFisTipleri.forEach(rec =>
				rec.fisSinif.rapor_gunSonuRaporu_stmSentDuzenle_miktarHesaplasma_satisHareketler(e))
		}
		rapor_gunSonuRaporu_stmSentDuzenleDevam_miktarHesaplasma_satisHareketler(e) {
			const yerKod = e.yerKod || this.defaultYerKod || '';
			const {uni} = e;
			uni.add(new MQSent({
				from: `data_PIFStok har`,
				fromIliskiler: [
					{ from: `data_PIFFis fis`, iliski: `har.fissayac = fis.rowid` },
					{ from: `mst_Stok stk`, iliski: `har.shkod = stk.kod` },
					{ alias: 'stk', leftJoin: `mst_StokGrup grp`, iliski: [`stk.grupKod = grp.kod`] }
				],
				where: [
					`fis.silindi = ''`, `fis.gecici = ''`, `fis.rapor = ''`, `har.miktar <> 0`
					// { degerAta: yerKod, saha: `fis.yerkod` }
				],
				sahalar: (e.rowCountOnly
					? `COUNT(*) sayi`
					: [
						`fis.tarih`, `stk.grupKod`, `grp.aciklama grupAdi`,
						`har.shkod stokKod`, `stk.aciklama stokAdi`,
						`(case when COALESCE(har.xbrm, '') = '' then 'AD' else har.xbrm end) brm`,
						`(case when (fis.almsat = '') <> (fis.iade = '') then SUM(har.miktar) else 0 end) satis`,
						`(case when (fis.almsat = '') <> (fis.iade = '') then 0 else SUM(har.miktar) end) iade`
					  ]),
				groupBy: (e.rowCountOnly
							? null
							: [
								`fis.tarih`, `fis.almsat`, `fis.iade`,
								`stk.grupKod`, `grp.aciklama`, `har.shkod`, `stk.aciklama`,
								`(case when COALESCE(har.xbrm, '') = '' then 'AD' else har.xbrm end)`
							  ])
			}));
			e.stm.orderBy
				.addAll([`tarih DESC`, `stokAdi`]);
		}
		rapor_gunSonuRaporu_stmSentDuzenle_bedelHesaplasma_satisHareketler(e) {
			this.rapor_gunSonuRaporu_stmSentDuzenleDevam_bedelHesaplasma_satisHareketler(e);
			this.fisSinifOlanFisTipleri.forEach(rec =>
				rec.fisSinif.rapor_gunSonuRaporu_stmSentDuzenle_bedelHesaplasma_satisHareketler(e))
		}
		rapor_gunSonuRaporu_stmSentDuzenleDevam_bedelHesaplasma_satisHareketler(e) {
			const yerKod = e.yerKod || this.defaultYerKod || '';
			const {uni} = e;
			uni.add(new MQSent({
				from: `data_PIFStok har`,
				fromIliskiler: [
					{ from: `data_PIFFis fis`, iliski: `har.fissayac = fis.rowid` },
					{ from: `mst_Stok stk`, iliski: `har.shkod = stk.kod` },
					{ alias: 'stk', leftJoin: `mst_StokGrup grp`, iliski: [`stk.grupKod = grp.kod`] }
				],
				where: [
					`fis.silindi = ''`, `fis.gecici = ''`, `fis.rapor = ''`, `har.miktar <> 0`
					// { degerAta: yerKod, saha: `fis.yerkod` }
				],
				sahalar: (e.rowCountOnly
					? `COUNT(*) sayi`
					: [
						`fis.tarih`, `stk.grupKod`, `grp.aciklama grupAdi`,
						`har.shkod stokKod`, `stk.aciklama stokAdi`,
						`(case when COALESCE(har.xbrm, '') = '' then 'AD' else har.xbrm end) brm`,
						`(case when (fis.almsat = '') <> (fis.iade = '') then SUM(har.miktar) else (0 - SUM(har.miktar)) end) miktar`,
						`(case when (fis.almsat = '') <> (fis.iade = '') then SUM(har.belgebrutbedel) else (0 - SUM(har.belgebrutbedel)) end) brutBedel`,
						`(
							(case when (fis.almsat = '') <> (fis.iade = '') then SUM(har.belgebrutbedel) else (0 - SUM(har.belgebrutbedel)) end)
								- (case when (fis.almsat = '') <> (fis.iade = '') then SUM(har.belgebedel) else (0 - SUM(har.belgebedel)) end)
						 ) iskBedel`,
						`(case when (fis.almsat = '') <> (fis.iade = '') then SUM(har.belgebedel) else (0 - SUM(har.belgebedel)) end) netBedel`
					  ]),
				groupBy: (e.rowCountOnly
							? null
							: [
								`fis.tarih`, `fis.almsat`, `fis.iade`,
								`stk.grupKod`, `grp.aciklama`, `har.shkod`, `stk.aciklama`,
								`(case when COALESCE(har.xbrm, '') = '' then 'AD' else har.xbrm end)`
							  ])
			}));
			e.stm.orderBy
				.addAll([`tarih DESC`, `stokAdi`]);
		}
		rapor_gunSonuRaporu_stmSentDuzenle_tahsilatlar(e) {
			this.rapor_gunSonuRaporu_stmSentDuzenleDevam_tahsilatlar(e);
			this.fisSinifOlanFisTipleri.forEach(rec =>
				rec.fisSinif.rapor_gunSonuRaporu_stmSentDuzenle_tahsilatlar(e));
		}
		rapor_gunSonuRaporu_stmSentDuzenleDevam_tahsilatlar(e) {
			const yerKod = e.yerKod || this.defaultYerKod || '';
			const {uni} = e;
			uni.add(new MQSent({
				from: `data_PIFFis fis`,
				fromIliskiler: [
					{ from: `mst_Cari car`, iliski: `fis.ticmustkod = car.kod` },
					{ alias: `fis`, leftJoin: `mst_TahsilSekli tsek`, on: [`fis.tahseklikodno = tsek.kodNo`] }
				],
				where: [
					`fis.silindi = ''`, `fis.gecici = ''`, `fis.rapor = ''`,
					`fis.piftipi IN ('F', 'I', 'S')`, `(fis.almsat = 'T' and fis.iade='')`
				],
				sahalar: (e.rowCountOnly
					? `COUNT(*) sayi`
					: [
						`fis.tarih`, `fis.ticmustkod mustKod`, `car.unvan mustUnvan`, `SUM(fis.net) fisSonuc`,
						`(case when tsek.tahsilTipi = 'N' OR tsek.tahsilTipi = 'NK' then SUM(fis.net) else 0 end) nakit`,
						`(case when tsek.tahsilTipi = 'P' OR tsek.tahsilTipi = 'PS' then SUM(fis.net) else 0 end) pos`,
						`(case when tsek.tahsilTipi = '' AND (tsek.tahsilAltTipi = 'C' OR tsek.tahsilAltTipi = 'CK' OR tsek.tahsilAltTipi = 'S' OR tsek.tahsilAltTipi = 'SN') then SUM(fis.net) else 0 end) cekSenet`,
						`(case when (tsek.tahsilTipi IS NULL OR tsek.tahsilTipi = '') AND (tsek.tahsilAltTipi IS NULL OR tsek.tahsilAltTipi = '') then SUM(fis.net) else 0 end) acikHesap`
					  ]),
				groupBy: (e.rowCountOnly
							? null
							: [ `fis.tarih`, `fis.ticmustkod`, `car.unvan`, `fis.tahseklikodno` ])
			}));
			uni.add(new MQSent({
				from: `data_TahsilatDetay har`,
				fromIliskiler: [
					{ from: `data_TahsilatFis fis`, iliski: `har.fissayac = fis.rowid` },
					{ from: `mst_Cari car`, iliski: `fis.mustkod = car.kod` },
					{ from: `mst_TahsilSekli tsek`, iliski: `har.tahSekliNo = tsek.kodNo` }
				],
				where: [
					`fis.silindi = ''`, `fis.gecici = ''`, `fis.rapor = ''`,
					`har.tahSekliNo > 0`, `har.bedel <> 0`
				],
				sahalar: (e.rowCountOnly
					? `COUNT(*) sayi`
					: [
						`fis.tarih`, `fis.mustkod mustKod`, `car.unvan mustUnvan`, `0 fisSonuc`,
						`(case when tsek.tahsilTipi = 'N' OR tsek.tahsilTipi = 'NK' then SUM(har.bedel) else 0 end) nakit`,
						`(case when tsek.tahsilTipi = 'P' OR tsek.tahsilTipi = 'PS' then SUM(har.bedel) else 0 end) pos`,
						`(case when tsek.tahsilTipi = '' AND (tsek.tahsilAltTipi = 'C' OR tsek.tahsilAltTipi = 'CK' OR tsek.tahsilAltTipi = 'S' OR tsek.tahsilAltTipi = 'SN') then SUM(har.bedel) else 0 end) cekSenet`,
						`(case when tsek.tahsilTipi = '' AND tsek.tahsilAltTipi = '' then SUM(har.bedel) else 0 end) vadeli`
					  ]),
				groupBy: (e.rowCountOnly
							? null
							: [ `fis.tarih`, `fis.mustkod`, `car.unvan`, `har.tahSekliNo` ])
			}));
			e.stm.orderBy
				.addAll([`tarih DESC`, `mustUnvan`]);
		}
		rapor_bekleyenSiparisler_stmSentDuzenle(e) {
			this.rapor_bekleyenSiparisler_stmSentDuzenleDevam(e);
			this.fisSinifOlanFisTipleri.forEach(rec =>
				rec.fisSinif.rapor_bekleyenSiparisler_stmSentDuzenle(e));
		}
		rapor_bekleyenSiparisler_stmSentDuzenleDevam(e) {
			const {almSat, uni, stm, rowCountOnly} = e;
			uni.add(new MQSent({
				from: `data_BekleyenSiparisler har`,
				fromIliskiler: [
					{ alias: 'har', leftJoin: 'mst_NakliyeSekli nak', on: [`har.nakSekliKod = nak.kod`] },
					{ alias: 'har', leftJoin: 'mst_SevkAdres sadr', on: [`har.teslimYerKod = sadr.kod`, `har.mustKod = sadr.mustKod`] },
					{ alias: 'har', leftJoin: 'mst_TahsilSekli tsek', on: [`har.tahSekliKodNo = tsek.kodNo`] },
					{ from: 'mst_Cari car', iliski: 'har.mustKod = car.kod' },
					{ from: 'mst_Stok stk', iliski: 'har.stokKod = stk.kod' }
				],
				where: [
					`har.bekleyenMiktar <> 0`
				],
				sahalar: (rowCountOnly
					? `COUNT(*) sayi`
					: [	`har.vioID`,
						`har.tarih`, `har.ayrimTipi`, `har.fisNox`, `har.almSat`, `har.mustKod`, `car.unvan mustUnvan`,
					    `har.teslimTarih`, `har.teslimYerKod`, `sadr.aciklama teslimYerAdi`, `har.nakSekliKod`, `nak.aciklama nakSekliAdi`,
					    `har.odemeGunKod`, `har.tahSekliKodNo`, `tsek.aciklama tahSekliAdi`,
					    `har.stokKod`, `stk.aciklama stokAdi`,
						`(case when COALESCE(stk.brm, '') = '' then 'AD' else stk.brm end) brm`,
						`har.bekleyenMiktar`, `har.kalanMiktar`
					  ]),
				groupBy: rowCountOnly
					? null
					: [
						/*`har.vioID`,*/
						`har.almSat`, `har.tarih`, `har.fisNox`, `har.stokKod`
					  ]
			}));
			if (almSat) {
				uni.sentDo(sent =>
					sent.where.degerAta(almSat, `har.almSat`));
			}
			if (!rowCountOnly) {
				let hmrlimi = false;
				if (almSat) {
					switch (almSat) {
						case 'A': hmrlimi = this.depoMalKabulSiparisHMRlimi; break;
						case 'T': hmrlimi = this.depoSevkiyatSiparisHMRlimi; break;
					}
				}
				else {
					hmrlimi = this.depoMalKabulSiparisHMRlimi || this.depoSevkiyatSiparisHMRlimi;
				}
				if (hmrlimi) {
					const {idSahalarSiparis} = CETEkOzellikler;
					for (const sent of uni.getSentListe()) {
						for (const idSaha of idSahalarSiparis) {
							const clause = `har.${idSaha}`;
							sent.sahalar.add(clause);
							sent.groupBy.add(clause)
						}
					}
				}
			}
			stm.orderBy
				.addAll([`almSat`, `tarih DESC`])
		}
		rapor_ozet_stmSentDuzenle(e) {
			this.rapor_ozet_stmSentDuzenleDevam(e);
			for (const rec of this.fisSinifOlanFisTipleri)
				rec.fisSinif.rapor_ozet_stmSentDuzenle(e)
		}
		rapor_ozet_stmSentDuzenleDevam(e) {
			const {uni, stm, rowCountOnly} = e;
			uni.addAll([
				new MQSent({
					distinct: true,
					from: `data_PIFFis fis`,
					where: [`fis.silindi = ''`, `fis.gecici = ''`, `fis.rapor = ''`, `fis.mustkod <> ''`, `fis.piftipi IN ('F', 'I', 'S')`],
					sahalar: rowCountOnly ? `COUNT(*) sayi` : [
						`(case when fis.piftipi = 'S' then 'siparis' when fis.piftipi = 'I' then 'irsaliye' else 'fatura' end) tip`,
						`fis.mustkod`, `fis.dvkod`, `SUM(fis.net) toplambedel`, `COUNT(*) sayi`
					],
					groupBy: ['tip', 'dvkod', 'mustkod']
				}),
				new MQSent({
					distinct: true,
					from: `data_TahsilatFis fis`,
					where: [`fis.silindi = ''`, `fis.gecici = ''`, `fis.rapor = ''`, `fis.mustkod <> ''`],
					sahalar: rowCountOnly ? `COUNT(*) sayi` : [
						`'tahsilat' tip`, `fis.mustkod`, `'' dvkod`, `SUM(fis.toplambedel) toplambedel`, `COUNT(*) sayi` ],
					groupBy: ['tip', 'mustkod']
				}),
				new MQSent({
					distinct: true,
					from: `data_UgramaFis fis`,
					where: [`fis.silindi = ''`, `fis.gecici = ''`, `fis.rapor = ''`, `fis.mustkod <> ''`],
					sahalar: rowCountOnly ? `COUNT(*) sayi` : [
						`'ugrama' tip`, `fis.mustkod`, `'' dvkod`, `0 toplambedel`, `COUNT(*) sayi`]
				})
			])
		}

		stmSentDuzenle_sonStokBagla(e) {
			e = e || {};
			const {alias, yerKod} = e;
			let {shKodClause} = e;
			const leftJoinFlag = asBool(e.leftJoin);
			const detaylimi = asBool(e.detayli || e.detaylimi);
			// const subeKod = e.subeKod == null ? this.defaultSubeKod : e.subeKod;
			for (const sent of e.stm.getSentListe()) {
				if (!sent.from.aliasIcinTable('son')) {
					if (shKodClause && $.isFunction(shKodClause))
						shKodClause = shKodClause.call(this, e)
					const detaySinif = (
						e.detaySinif ? e.detaySinif :
								((e.fis ? e.fis.class : e.fisSinif ? e.fisSinif : null) || {}).detaySinif
						) || CETStokTicariDetay;
					const detaylimiUyarlanmis = detaylimi || !detaySinif;
					if (!detaylimiUyarlanmis) {
						if ($.isArray(sent.sahalar)) {
							for (const saha of sent.sahalar.liste) {
								const value = saha.deger;
								if (value == 'son.miktar')
									saha.deger = `SUM(${value})`
								else if (value == 'son.olasiMiktar')
									saha.deger = `SUM(son.orjMiktar + son.olasiFark)`
								else
									sent.groupBy.add(saha.deger)
							}
						}
					}
					if (leftJoinFlag) {
						const onListe = [`${shKodClause} = son.stokKod`];
						if (yerKod)
							onListe.push(`son.yerKod = ${MQSQLOrtak.sqlDegeri(yerKod || '')}`);
						sent.leftJoin({ alias: alias, leftJoin: 'mst_SonStok son', on: onListe.join(' AND ') })
					}
					else {
						const iliskiListe = [`${shKodClause} = son.stokKod`];
						if (yerKod)
							iliskiListe.push(`son.yerKod = ${MQSQLOrtak.sqlDegeri(yerKod || '')}`);
						sent.fromIliski({ from: 'mst_SonStok son', iliski: iliskiListe });
						sent.where.add('son.miktar > 0')
					}
				}
			}
		}
		ortakReset(e) {
			for (const key of [
				'_matbuuFormYapilari', '_grupKod2Adi', 'mustKod2KosulProYapilari',
				'_ekOzellikKullanim', '_isyeri', '_ruloParam', '_ruloEkNotlar',
				 '_tip2MatbuuFormDuzenleyiciler', '_tip2MatbuuFormDuzenleyiciler_runtime',
				 '_defaultTip2Renk', '_ekOzellikBelirtecSet_stokMstVeDiger' /*, '_menuAdimKisitIDSet', '_fisAdimKisitIDSet'*/
			]) { delete this[key] }
			for (const key of ['baslangicKod2Kural', 'ayrisimKurallari']) { delete CETBarkodParser_Kuralli[key] }
			
			const {caches, isDevMode} = this;
			if (caches) { for (let key in caches) delete caches[key]; delete this.caches }
			this.initCaches(e);
			// if (!isDevMode) {
			this.promise_prefetchUI = new $.Deferred(p => {
				setTimeout(async () => {
					let result;
					const {activePart} = this;
					if (!this.prefetchAbortedFlag && (!activePart || activePart == this)) {
						try { result = await this.prefetchUIs(e) }
						finally {
							delete this.promise_prefetchUI
							delete this.prefetchAbortedFlag;
						}
					}
					setTimeout(() => p.resolve(result), 10);
				}, 5000);
			});

			const savedAppTitleText = this.appTitleText;
			const uiClassList = [CETCariListePart, CETStokListePart];
			try {
				for (const i in uiClassList) {
					const ui = uiClassList[i].current;
					if (ui && !ui.isDestroyed) {
						ui.destroyPart();
						ui.class.resetInstance();
					}
				}
			}
			finally {
				if (savedAppTitleText != this.appTitleText)
					this.appTitleText = savedAppTitleText;
			}

		}
		async onbellekOlustur(e) {
			this.doInitialFetches();
			await this.initCaches(e);
			await Promise.all([
				/* this.numaratorleriYukle(e), */
				CETBarkodParser_Kuralli.barkodKurallariBelirle(),
				this.loadInitialCaches()
			]);
		}

		initCaches(e) {
			this.caches = {
				dvKod2Rec: {},
				mustKod2EkBilgi: {},
				stokKod2EkBilgi: {},
				subeKod2Rec: {},
				yerKod2Rec: {},
				stokKod2VarsayilanBarkod: {},
				plasiyerKod2Rec: {},
				modelKod2Rec: {},
				desenKod2Rec: {},
				renkKod2Rec: {},
				proGrupKod2Stoklar: {},
				sablonFisTipiKod2Rec: {},
				tahsilSekliKodNo2Rec: {},
				nakliyeSekliKod2Rec: {},
				sevkAdresKod2Rec: {},
				ozelKampanyaKod2Rec: {},
				mustKodVeTarih2SatisKosullari: {},
				satisKosul_anah2KosulStokGrupBilgi: {}
			};
		}

		async loadInitialCaches(e) {
			e = e || {};
			const {caches} = this;
			const dbMgr = this.dbMgr_mf;
			let stm, recs, cacheDict;
			
			stm = new MQStm({
				sent: new MQSent({
					from: `mst_Sube sub`,
					where: [`sub.kod <> ''`],
					sahalar: [`sub.*`]
				})
			});
			recs = [
				{ kod: ` `, aciklama: `-MERKEZ ŞUBE-` }
			];
			recs.push(...(await dbMgr.executeSqlReturnRows({ tx: e.tx, query: stm })));
			cacheDict = caches.subeKod2Rec;
			for (const rec of recs)
				cacheDict[rec.kod] = rec

			stm = new MQStm({
				sent: new MQSent({
					from: `mst_Doviz dvz`,
					// where: [`dvz.kod <> ''`],
					sahalar: [`dvz.*`]
				})
			});
			recs = await dbMgr.executeSqlReturnRows({ tx: e.tx, query: stm });
			cacheDict = caches.dvKod2Rec;
			for (const rec of recs)
				cacheDict[rec.kod] = rec

			stm = new MQStm({
				sent: new MQSent({
					from: `mst_Yer yer`,
					where: [`yer.kod <> ''`],
					sahalar: [`yer.*`]
				})
			});
			recs = await dbMgr.executeSqlReturnRows({ tx: e.tx, query: stm });
			cacheDict = caches.yerKod2Rec;
			for (const rec of recs)
				cacheDict[rec.kod] = rec

			stm = new MQStm({
				sent: new MQSent({
					from: `mst_Plasiyer pls`,
					where: [`pls.kod <> ''`],
					sahalar: [`pls.*`]
				})
			});
			recs = await dbMgr.executeSqlReturnRows({ tx: e.tx, query: stm });
			cacheDict = caches.plasiyerKod2Rec;
			for (let i in recs) {
				const rec = recs[i];
				cacheDict[rec.kod] = rec;
			}

			stm = new MQStm({
				sent: new MQSent({
					from: `mst_Model mod`,
					where: [`mod.kod <> ''`],
					sahalar: [`mod.*`]
				})
			});
			recs = await dbMgr.executeSqlReturnRows({ tx: e.tx, query: stm });
			cacheDict = caches.modelKod2Rec;
			for (let i in recs) {
				const rec = recs[i];
				cacheDict[rec.kod] = rec;
			}

			stm = new MQStm({
				sent: new MQSent({
					from: `mst_Desen des`,
					where: [`des.kod <> ''`],
					sahalar: [`des.*`]
				})
			});
			recs = await dbMgr.executeSqlReturnRows({ tx: e.tx, query: stm });
			cacheDict = caches.desenKod2Rec;
			for (let i in recs) {
				const rec = recs[i];
				cacheDict[rec.kod] = rec;
			}

			stm = new MQStm({
				sent: new MQSent({
					from: `mst_Renk rnk`,
					where: [`rnk.kod <> ''`],
					sahalar: [`rnk.*`]
				})
			});
			recs = await dbMgr.executeSqlReturnRows({ tx: e.tx, query: stm });
			cacheDict = caches.renkKod2Rec;
			for (let i in recs) {
				const rec = recs[i];
				cacheDict[rec.kod] = rec;
			}

			stm = new MQStm({
				sent: new MQSent({ from: `mst_TahsilSekli tsek`, where: [`tsek.kodNo > 0`], sahalar: [`tsek.*`] })
			});
			if (!this.tahsilattaAcikHesapKullanilirmi) {
				let or = new MQOrClause(); or.inDizi(['NK', 'PS'], 'tsek.tahsilTipi');
				or.add(new MQSubWhereClause([
					{ degerAta: '', saha: 'tsek.tahsilTipi' },
					{ inDizi: ['CK', 'SN', 'C', 'S'], saha: 'tsek.tahsilAltTipi' }
				])); for (const sent of stm.getSentListe()) { sent.where.add(or) }
			}
			recs = await dbMgr.executeSqlReturnRows({ tx: e.tx, query: stm });
			cacheDict = caches.tahsilSekliKodNo2Rec;
			for (let i in recs) {
				const rec = recs[i];
				rec.kod = rec.kodNo;
				cacheDict[rec.kodNo] = rec;
			}

			stm = new MQStm({
				sent: new MQSent({
					from: `mst_NakliyeSekli nsek`,
					where: [`nsek.kod <> ''`],
					sahalar: [`nsek.*`]
				})
			});
			recs = await dbMgr.executeSqlReturnRows({ tx: e.tx, query: stm });
			cacheDict = caches.nakliyeSekliKod2Rec;
			for (let i in recs) {
				const rec = recs[i];
				cacheDict[rec.kod] = rec;
			}

			stm = new MQStm({
				sent: new MQSent({
					from: `mst_SevkAdres sadr`,
					where: [`sadr.kod <> ''`],
					sahalar: [`sadr.*`]
				})
			});
			recs = await dbMgr.executeSqlReturnRows({ tx: e.tx, query: stm });
			cacheDict = caches.sevkAdresKod2Rec;
			for (let i in recs) {
				const rec = recs[i];
				cacheDict[rec.kod] = rec;
			}

			stm = new MQStm({
				sent: new MQSent({
					from: `mst_SablonFisTipi sfis`,
					where: [`sfis.kod > ''`],
					sahalar: [`sfis.*`]
				})
			});
			recs = await dbMgr.executeSqlReturnRows({ tx: e.tx, query: stm });
			cacheDict = caches.sablonFisTipiKod2Rec;
			for (let i in recs) {
				const rec = recs[i];
				cacheDict[rec.kod] = rec;
			}

			if (this.ozelKampanyaKullanilirmi) {
				stm = new MQStm({
					sent: new MQSent({
						from: `mst_OzelKampanya okam`,
						where: [`okam.kod > ''`],
						sahalar: [`okam.*`]
					})
				});
				recs = await dbMgr.executeSqlReturnRows({ tx: e.tx, query: stm });
				cacheDict = caches.ozelKampanyaKod2Rec;
				for (let i in recs) {
					const rec = recs[i];
					cacheDict[rec.kod] = rec;
				}
			}
		}

		async doInitialFetches(e) {
			e = e || {};
			let urls = [
				`appBase/part/knobProgress.html`,
				`images/firmalogo.png`,
				`images/loading.gif`,
				`images/iletisim.png`,
				`images/kopyala.png`,
				`images/logout.png`,
				`images/sec.png`,
				`images/tamam.png`,
				`images/kaydet.png`,
				`images/yeni.png`,
				`images/degistir.png`,
				`images/sil.png`,
				`images/temizle.png`,
				`images/kopyala.png`,
				`images/copy.png`,
				`images/ekle.png`,
				`images/iptal.png`,
				`images/yazdir.png`,
				`images/tamEkranAcBeyaz.png`,
				`images/sky_logo.svg`,
				`images/home_icon.png`,
				`images/ayarlar.png`,
				`images/db_copy.png`,
				`images/bilgiYukle.png`,
				`images/anaMenu_fiyatGor.png`,
				`images/rotaListesi.png`,
				`images/fisListesi.png`,
				`images/musteri_durumu_anaMenu.svg`,
				`images/raporlar.png`,
				`images/numaratorler.png`,
				`images/bilgiGonder.png`,
				`images/son_stok_guncelle.svg`,
				`images/stokBeklemeRaporu-1.svg`,
				`images/popup_asagi.png`,
				`images/popup_yukari.png`,
				`images/kaydet_yazdir.png`,
				`images/cihaz_to_merkez.png`,
				`images/birlestir.png`,
				`images/kilitle.svg`,
				`images/json.png`,
				`images/export.png`,
				`images/fiyatGor.png`,
				`images/birlestir.png`,
				`images/promosyon.png`,
				`images/sablon.png`,
				`images/filtre.png`,
				`images/barkod.png`,
				`images/tazele.png`,
				`images/belgeTransfer.png`,
				`images/geciciFisleriSil.png`,
				`images/siparisten_karsila.png`,
				`images/musteri_durumu.svg`,
				`images/solmenu_raporlar.svg`,
				`images/fis_ozet_bilgi.svg`,
				`images/son_stoktan_sec.svg`,
				`images/yukari.png`,
				`images/asagi.png`
			];
			const promises = [];
			for (const url of urls)
				promises.push(Utils.ajaxDoWithCache({ url: url }))
			urls = [
				`../app/prog/cetApp/data/cetDB_param_initSQL.sql`,
				`../app/prog/cetApp/data/cetDB_rom_data_initSQL.sql`,
				`./manifest.php`
			];
			for (const url of urls) {	
				lastAjaxObj = $.ajax({ cache: false, async: true, method: 'POST', url: `${url}?${siteVersion}` });
				promises.push(lastAjaxObj)
			}
			return await Promise.all(promises)
		}
		async prefetchUIs(e) {
			e = e || {}; const {parent, tempLayout} = this;
			parent.css('opacity', .01);
			((window.savedProcs || {}).showProgress || showProgress)(null, null, 1, false);
			const fis = new CETSatisFaturaFis();
			if (fis.class.numaratorTip)
				await fis.numaratorOlustur()
			const fisGirisUIClassList = [CETFisGirisPart];
			if (this.class.appSDMmi)
				fisGirisUIClassList.push(...[CETForkliftFisGirisPart, CETBekleyenSayimFisGirisPart, CETBekleyenUgramaFisGirisPart]);
			else
				fisGirisUIClassList.push(CETFisGirisSonStoktanSecimPart);
			
			for (const i in fisGirisUIClassList) {
				const fisGirisUIClass = fisGirisUIClassList[i];
				const part = new fisGirisUIClass({ prefetch: true, content: tempLayout, fis });
				try {
					await new $.Deferred(async p => {
						const {activePart} = this;
						if (this.prefetchAbortedFlag || (activePart && activePart != this))
							p.reject({ isError: true, rc: 'userAbort' });
						const result = await part.run();
						setTimeout(() => p.resolve(result), 10);
					})
				}
				catch (ex) {
					console.error(`prefetch error`, ex);
				}
				finally {
					const {activePart} = this;
					if (part && (!activePart || part == activePart) && part.geriIstendi)
						await part.geriIstendi();
				}
			}
			setTimeout(() => {
				parent.css('opacity', 1);
				((window.savedProcs || {}).hideProgress || hideProgress)();
			}, 10);
		}

		async barkodBilgiBelirle(e) {
			let parser, barkod = (e.barkod || '').trim(); if (!barkod) { return null }
			if (barkod.length > 2) {
				let kural = await CETBarkodParser_Kuralli.kuralFor({ barkod, basKod: barkod.substring(0, 2) });
				if (kural) { parser = await kural.parseSonucu(e); if (parser) { return parser } }
			}
			parser = new CETBarkodParser_Referans({ barkod });
			return (await parser.parse(e)) ? parser : null
		}
		async loadInjectScripts(e) {
			e = e || {}; if (!navigator.onLine) return undefined
			let urls = e.urls || e.url; if (urls && !$.isArray(urls)) urls = [urls]
			if ($.isEmptyObject(urls)) return undefined
			let lastResult = null;
			for (const url of urls) {
				lastAjaxObj = $.get({ async: true, timeout: 5000, dataType: 'script', url: url });
				try { lastResult = await lastAjaxObj; console.info('loadInjectScripts', e, { isError: false, result: lastResult }); }
				catch (ex) { console.error('loadInjectScripts', e, { isError: true, error: ex }); if (ex.rc && ex.rc == 'throw') throw ex }
			}
			return lastResult
		}
		async loadInitialScripts() {
			if (!navigator.onLine) { return null }
			const {param} = this, hostName = param.wsHostNameUyarlanmis; if (!hostName) { return null }
			const promises = [], ports = [8200, 81, 80, 82];
			for (const port of ports) {
				const urls = [], hostNameSet = {};
				if (location.hostname != 'localhost' && location.hostname != '127.0.0.1') {
					urls.push(`http://${location.hostname}:${port}/cetapp.override.js`); hostNameSet[location.hostname] = true }
				if (!(hostNameSet.localhost || hostNameSet['127.0.0.1'])) {
					urls.push(`http://localhost:${port}/cetapp.override.js`); hostNameSet.localhost = hostNameSet['127.0.0.1'] = true }
				if (!hostNameSet[hostName] && (hostName != 'localhost' && hostName != '127.0.0.1')) {
					urls.push(`http://${hostName}:${port}/cetapp.override.js`); hostNameSet[hostName] = true }
				let timeout = 2500;
				for (const url of urls) {
					lastAjaxObj = $.get({ async: true, timeout: timeout, dataType: 'script', url: `${url}` }); promises.push(lastAjaxObj); timeout += 200 }
			}
			if (navigator.onLine) {
				const results = []; for (const promise in promises) {
					try { let result = await promise; if (result) results.push(result) }
					catch (ex) { if (this.showLoadErrorsFlag) console.error(ex) }
				}
				return results
			}
			return null
		}
		async tablolariTemizle(e) {
			e = e || {}; const temps = e.temps = e.temps || {};
			const {verilerSilinmesinFlag} = e;
			if (verilerSilinmesinFlag) {
				await (async () => {
					const dbMgr = this.dbMgr_mf;
					if (await dbMgr.hasTables(['mst_Cari'])) {
						const query = new MQSent({
							from: 'mst_Cari',
							where: [`gonderildi = ''`],
							sahalar: '*'
						});
						temps.gonderilmeyenCariRecs = await dbMgr.executeSqlReturnRows({ query: query });
					}
				})()
			}
			const dbMgrKeys = e.dbMgrKeys || Object.keys(this.dbMgrs);
			for (const key of dbMgrKeys) {
				let dbMgr = this.dbMgrs[key];
				if (!verilerSilinmesinFlag && !dbMgr.webSQLmi) {
					if (dbMgr.close)
						await dbMgr.close()
					if (dbMgr.dbClear)
						await dbMgr.dbClear()
					if (dbMgr.open)
						await dbMgr.open()
					await this.tablolariOlusturIslemi(e);
					await dbMgr.getTx();
					return
				}
				await this.knobProgressSetLabel('Yerel Veritabanı temizleniyor...');
				let tables = (await dbMgr.tables())?.filter(name => !(name.startsWith('_') || name.startsWith('sqlite_')));
				if (verilerSilinmesinFlag) {
					const prefix = this.dbTablePrefixes.master;
					tables = tables.filter(name => name.startsWith(prefix))
				}
				let tx = await dbMgr.getTx();
				for (const name of tables)
					await dbMgr.executeSql({ tx: tx, query: `DROP TABLE ${name}` })
			}
		}
		async tablolariOlustur(e) {
			e = e || {};
			let {tx} = e;
			const hasTx = !!tx;
			
			const dbMgrKeys = e.dbMgrKeys || Object.keys(this.dbMgrs);
			for (const key of dbMgrKeys) {
				const dbMgr = this.dbMgrs[key];
				await this.knobProgressSetLabel(`Tablolar tanımları okunuyor (<span style="color: #555;"><i>${key.toUpperCase()}</i></span>)...`);
				lastAjaxObj = $.ajax({
					cache: false, async: true, method: 'POST',
					url: `../app/prog/cetApp/data/cetDB_${key}_initSQL.sql?${siteVersion}`
				});
				const queryText = await lastAjaxObj;
				// queryText = (queryText || {}).text ? await queryText.text() : await(queryText.response ? queryText.response.responseText : queryText);
				const queries = [];
				const _queryTextListe = queryText ? queryText.split(';') : null;
				if (_queryTextListe) {
					for (const _query of _queryTextListe) {
						let query = _query;
						query = query ? query.trim() : null;
						if (query)
							queries.push(query)
					}
				}
				await this.knobProgressStep();
				if (!hasTx)
					tx = await dbMgr.getTx()
				await this.knobProgressSetLabel(`Tablolar oluşturuluyor (<span style="color: #555;"><i>${key.toUpperCase()}</i></span>)...`);
				if (!$.isEmptyObject(queries)) {
					for (const query of queries) {
						try { await dbMgr.executeSql({ tx: tx, query: query }) }
						catch (ex) { console.error(ex) }
					}
				}
				if (!hasTx)
					tx = await dbMgr.getTx()
				await this.knobProgressStep(3)
			}
			const temps = e.temps = e.temps || {};
			await (async () => {
				const {gonderilmeyenCariRecs} = temps;
				if (!$.isEmptyObject(gonderilmeyenCariRecs)) {
					const dbMgr = this.dbMgr_mf;
					if (await dbMgr.hasTables(['mst_Cari'])) {
						if (gonderilmeyenCariRecs[0].rowid != null) {
							for (const rec of gonderilmeyenCariRecs)
								delete rec.rowid
						}
						await dbMgr.insertOrReplaceTable({
							table: 'mst_Cari', mode: 'insertIgnore',
							hvListe: gonderilmeyenCariRecs
						});
						delete temps.gonderilmeyenCariRecs
					}
				}
			})()
		}
		async tabloEksikleriTamamla(e) {
			e = e || {};
			const dbMgr = e.dbMgr || this.dbMgr_mf;
			let {tx} = e;
			const hasTx = !!tx;
			// tx = e.tx = await dbMgr.getTx();
			await this.knobProgressSetLabel(`Tablo eksikleri araştırılıyor...`);
			const islemler = this.tabloEksikIslemYapi || [];
			const {tabloEksikIslemYapi_ek} = this;
			if (tabloEksikIslemYapi_ek)
				islemler.push(...tabloEksikIslemYapi_ek)
			let lastResult;
			const temps = {};
			let degistimi = false, kosulluDegisiklikOldumu = false;
			for (const islemYapi of islemler) {
				const _e = $.extend({}, e, { dbMgr: dbMgr, tx: tx, lastResult: lastResult, temps: temps });
				//if (!hasTx)
				//	tx = e.tx = _e.tx = await dbMgr.getTx()
				let uygunmu = true;
				let kosulluDegisiklikmi = false;
				const {kosul} = islemYapi;
				if (kosul != null) {
					if ($.isFunction(kosul))
						uygunmu = await kosul.call(this, _e)
					else if (kosul.run)
						uygunmu = await kosul.run(_e)
					else
						uygunmu = kosul
					kosulluDegisiklikmi = true
				}
				tx = e.tx = _e.tx;
				if (!uygunmu)
					continue
				const {queries, action} = islemYapi;
				if (!$.isEmptyObject(queries)) {
					for (const query of queries) {
						try {
							await dbMgr.executeSql({ tx: tx, query: query });
							/*.replaceAll('INDEX IF NOT EXISTS ', 'INDEX ')
								.replaceAll(' ON DELETE CASCADE', '')
								.replaceAll('AS (orjMiktar + olasiFark)', '')*/
							degistimi = true;
							if (kosulluDegisiklikmi)
								kosulluDegisiklikOldumu = true
						}
						catch (ex) {
							let errText = ex?.errorText ?? ex?.message ?? ex; if (typeof errText != 'string') errText = null;
							if (errText?.includes('duplicate')) continue
							console.error('tabloEksikleriTamamla', queries, 'queries', query, ex) /* debugger */
						}
					}
				}
				if (action) {
					try {
						if ($.isFunction(action))
							lastResult = await action.call(this, _e)
						else if (action.run)
							lastResult = await action.run(_e)
						degistimi = true;
						if (kosulluDegisiklikmi)
							kosulluDegisiklikOldumu = true
					}
					catch (ex) { lastResult = ex; console.error('tabloEksikleriTamamla', queries, 'action', ex); debugger }
				}
				await this.knobProgressStep()
			}
			if (!hasTx)
				tx = e.tx = await dbMgr.getTx();
			
			if (dbMgr.alaSQLmi && !dbMgr.isIndexedDB) {
				const promises = [];
				const {db} = dbMgr;
				const colName = 'rowid';
				for (const [table, tableObj] of Object.entries(db.tables)) {
					if ($.isEmptyObject(tableObj.xcolumns) && !$.isEmptyObject(tableObj.columns))
						tableObj.indexColumns()
					const {xcolumns, pk} = tableObj;
					if (!xcolumns || !xcolumns[colName]) {
						let pkClause = $.isEmptyObject(pk?.columns) ? ' PRIMARY KEY' : '';
						promises.push(new $.Deferred(async p => {
							try { p.resolve(await dbMgr.executeSql(`ALTER TABLE ${table} ADD COLUMN ${colName} INTEGER NOT NULL AUTOINCREMENT${pkClause}`)) }
							catch (ex) { p.reject(ex) }
						}))
					}
				}
				await Promise.all(promises)
			}
			if (degistimi && !asBool(e.noCacheReset) && navigator.onLine) {
				const cacheKeys = window.caches ? await window.caches.keys() : [];
				const cacheSize = cacheKeys.length;
				if (cacheSize)
					this.onbellekSilIstendi()
			}
		}
		
		async tabloEksikleriTamamla_noCacheReset(e) {
			return await this.tabloEksikleriTamamla($.extend({}, e, { noCacheReset: true }))
		}

		async gonderilecekBilgiler(e) {
			e = e || {};
			const dbMgr = e.dbMgr || this.dbMgr_mf;
			const {alaSQLmi} = dbMgr;
			const {tx} = e;
			let {bilgiGonderTableYapilari} = e;
			if (!bilgiGonderTableYapilari)
				bilgiGonderTableYapilari = this.bilgiGonderTableYapilari

			const {param} = this;
			let _param = e.param;
			if (!_param) {
				_param = e.param = {};
				if (this.kmTakibiYapilirmi) /* param.kapandimi */
					_param.kapandimi = true;
				if (param.ilkKM)
					_param.ilkKM = param.ilkKM
				if (param.sonKM)
					_param.sonKM = param.sonKM
				if (param.mustKod2Bilgi) {
					for (const mustKod in param.mustKod2Bilgi) {
						const bilgi = param.mustKod2Bilgi[mustKod];
						if (!$.isEmptyObject(bilgi)) {
							const _mustKod2Bilgi = _param.mustKod2Bilgi = _param.mustKod2Bilgi || {};
							_mustKod2Bilgi[mustKod] = bilgi
						}
					}
				}
			}
			let paramGonderilsinmi = false;
			if (_param) {
				if (!paramGonderilsinmi && param.kapandimi)
					paramGonderilsinmi = true;
				
				if (!paramGonderilsinmi && _param.mustKod2Bilgi) {
					for (const mustKod in param.mustKod2Bilgi) {
						const bilgi = param.mustKod2Bilgi[mustKod];
						if (!$.isEmptyObject(bilgi)) {
							paramGonderilsinmi = true;
							break
						}
					}
				}
			}

			const table2Info = {};
			const result = { totalCount: 0, table2Info: table2Info };
			if (paramGonderilsinmi) {
				result.param = _param;
				result.totalCount++
			}
			else if ($.isEmptyObject(bilgiGonderTableYapilari))
				return result
			
			// await this.knobProgressSetLabel(`Belgeler taranıyor...`);
			const fetchBlock = async e => {
				let rs = await dbMgr.executeSql({ tx: e.tx || tx, query: e.query });
				for (let i = 0; i < rs.rows.length; i++) {
					const table = e.table || rec._table;
					const rec = rs.rows[i];
					const info = table2Info[table] = table2Info[table] || { count: 0, recs: [] };
					info.count++;
					info.recs.push(rec);
					result.totalCount++
				}
				// await this.knobProgressStep(3)
			};
			const table2Recs = {};
			for (const tableYapi of bilgiGonderTableYapilari) {
				const fisIDListe = tableYapi.fisIDListe;
				const baslikTable = tableYapi.baslik;
				let sent = new MQSent({
					from: baslikTable,
					where: [`gonderildi = ''`, `gecici = ''`, `degismedi = ''`],
					sahalar: [`'${baslikTable}' _table`, `'fis' _tip`, ...(alaSQLmi ? [] : ['rowid']), '*']
				});
				if (fisIDListe && alaSQLmi)
					sent.where.inDizi(fisIDListe, 'rowid')
				await fetchBlock({ table: baslikTable, query: new MQStm({ sent: sent }) });
				/*const digerTablolar = tableYapi.diger;
				if (!$.isEmptyObject(digerTablolar)) {
					for (const j in digerTablolar) {
						const table = digerTablolar[j];
						let sent = new MQSent({
							from: `${table} har`,
							fromIliskiler: [
								{ from: `${baslikTable} fis`, iliski: `har.fissayac = fis.rowid` }
							],
							where: [`fis.gonderildi=''`],
							sahalar: [`'${baslikTable}' _parentTable`, `'${table}' _table`, `'diger' _tip`, `har.rowid`, `har.*`]
						});
						if (fisIDListe)
							sent.where.inDizi(fisIDListe, `har.fissayac`);
						await fetchBlock({ table: table, query: new MQStm({ sent: sent }) });
					}
				}*/
				const tanimTablolar = tableYapi.tanim;
				if (!$.isEmptyObject(tanimTablolar)) {
					for (const table of tanimTablolar) {
						let sent = new MQSent({
							from: table,
							where: [`gonderildi=''`],
							sahalar: [`'${table}' _table`, `'tanim' _tip`, ...(alaSQLmi ? [] : ['rowid']), '*']
						});
						await fetchBlock({ table: table, query: new MQStm({ sent: sent }) })
					}
				}
			}
			return result
		}
		async merkezdenBilgiYukle(e) {
			e = $.extend({}, e); const {isDevMode} = this, {silent, verilerSilinmesinFlag} = e, {table2TipAdi} = this;
			if (!silent && !verilerSilinmesinFlag) {
				let gonderilecekBilgiler = await this.gonderilecekBilgiler(e);
				if (gonderilecekBilgiler?.totalCount) {
					const {table2Info} = gonderilecekBilgiler;
					let bilgiText = '';
					for (const table in table2Info) {
						if (!table2TipAdi[table]) { continue }
						const info = table2Info[table], {count} = info;
						if (count) {
							const tipAdi = table2TipAdi[table] || table;
							if (bilgiText) { bilgiText += ', ' } bilgiText += `${count.toLocaleString()} adet ${tipAdi}`;
						}
					}
					if (bilgiText) {
						let result; if (this.silerekBilgiAlYapilirmi) {
							result = await new $.Deferred(p => {
								displayMessage(
									(
										`<p>Merkeze <u>GÖNDERİLMEMİŞ</u> olan <b>${bilgiText}</b> var. ` +
										`<b class="red">Devam edilirse bunlar silinecek!</b><p/>` +
										`<p><span style="font-weight: bold;">Yine de devam edilsin mi?</span></p>`
									),
									`Merkeze Gönderilmemiş Bilgi Var`, true,
									{
										EVET: (dlgUI, btnUI) => {
											dlgUI.jqxWindow('destroy');
											p.resolve(true)
										},
										HAYIR: (dlgUI, btnUI) => {
											dlgUI.jqxWindow('destroy')
											p.resolve(false)
										}
									})
							});
						}
						else {
							result = false;
							displayMessage(
								(
									`<p>Merkeze <u>GÖNDERİLMEMİŞ</u> olan <b>${bilgiText}</b> var.<br/>` +
									`<p><b class="red">Firma politkası gereği bu işleme izin verilmeyecek</span></b>` +
									`<p>Lütfen önce <b>Merkeze Veri Gönder</b> işlemini yapınız</p>`
								),
								`Merkeze Gönderilmemiş Bilgi Var!`, true
							);
						}
						
						if (!result)
							return false;
					}
				}
			}

			await this.knobProgressShow();
			await this.knobProgressReset();

			const dbMgrKeys = ['rom_data'];
			/*if (!e.verilerSilinmesinFlag)
				dbMgrKeys.push('data');*/
			$.extend(e, {
				dbMgrKeys: dbMgrKeys,
				dbMgr: this.dbMgrs.rom_data
			});

			const {knobProgressPart} = this;
			const savedProgressMaxValue = knobProgressPart.progress.jqxKnob('max');
			const progressMaxValue = 200;
			let result;
			try {
				if (savedProgressMaxValue != progressMaxValue)
					knobProgressPart.progress.jqxKnob('max', progressMaxValue);

				let savedOtoAktarFlag = this.otoAktarFlag;
				this.otoAktarFlag = false;
				try {
					result = await this.merkezdenBilgiYukleDevam(e);
					await this.merkezdenBilgiYukleSonrasi(e)
				}
				finally {
					if (savedOtoAktarFlag)
						this.otoAktarFlag = savedOtoAktarFlag
				}
			}
			catch (ex) {
				hideProgress();
				((window.savedProcs || {}).hideProgress || hideProgress)();

				if (!ex || ex.statusText)
					displayServerResponse(ex);
				else
					displayMessage(ex.message || ex.errorText || ex.message || (ex.responseJSON || {}).errorText, `${ex.isError ? '@' : '!'} Merkezden Bilgi Alımı ${ex.isError ? '@' : '!'}`);
				throw ex
			}
			finally {
				if (savedProgressMaxValue != null && savedProgressMaxValue != progressMaxValue &&
							knobProgressPart && knobProgressPart.progress && knobProgressPart.progress.length)
					knobProgressPart.progress.jqxKnob('max', savedProgressMaxValue);
			}

			return result
		}

		async merkezdenBilgiYukleDevam(e) {
			e = e || {}; this.prefetchAbortedFlag = true;
			const {appMagazaVeyaSDMmi} = this.class, {isDevMode} = this, {dbMgrKeys, dbMgr, verilerSilinmesinFlag} = e, dbMgr_param = this.dbMgrs.param;
			let wsFetches = e.wsFetches = {}, _param = this.param, islemAdi, _rec, recs, subCount, hvListe;
			if (this.kmTakibiYapilirmi) {
				const _e = { otoGondermi: true, bilgiGonderTableYapilari: [] };
				try {
					/*await this.merkezeBilgiGonderOnKontrol(_e);*/ _param = this.param; _param.kapandimi = true; await _param.kaydet();
					_param.ilkKM = _param.sonKM = null; const _result = await this.merkezeBilgiGonder(_e); if (_result?.isError) { throw _result }
					const hataliTable2FisIDListe = _result?.hataliTable2FisIDListe || {}; if (!$.isEmptyObject(hataliTable2FisIDListe)) { throw { isError: true, rc: 'warnings', errorText: 'Bazı belgeler merkeze gönderilemedi' } }
					await _param.kaydet()
				}
				catch (ex) { console.error(ex); _param.kapandimi = false }
			}
			
			islemAdi = 'Parametreler';
			// (wsFetches.etParam = this.wsETParam()).fail(e.silent ? defFailBlockBasit : defFailBlock);
			(wsFetches.etParam = this.wsETParam()).fail(defFailBlockBasit);
			$.extend(wsFetches, {															// next prefetch
				numaratorListe: this.wsNumaratorListe(),
				etMatbuuTanimlar: this.wsETMatbuuTanimlar(),
				tahsilSekli: this.wsTahsilSekliListe()
			});
			_rec = await this.fetchWSRecs({ source: wsFetches.etParam, islemAdi: islemAdi, step: 3 });
			// subCount = asInteger(recs.length / 3);
			subCount = 5;
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			
			const param = this.param = new this.param.class();
			for (const key of param.class.sabitAttrListe) { let value = _param[key]; if (value != null) { param[key] = value } }
			for (const key in _rec) { const value = _rec[key]; if (value != null) { param[key] = value } }
			param.ilkKM = null; for (const key of ['ilkKMGirildimi', 'sonKMGirildimi', 'ilkIrsaliyeRaporuAlindimi']) { param[key] = false }
			await param.kaydet(); await this.ortakReset(e);
			/*delete this._fisAdimKisitIDSet; delete this._menuAdimKisitIDSet;*/ delete this._ekOzellikKullanim;
			let {tx} = e; const _e = $.extend({}, e, { tx, dbMgrKeys, verilerSilinmesinFlag, temps: {} }); this._bilgiYukleYapiliyorFlag = true;
			await this.tablolariTemizle(_e); delete _e.verilerSilinmesinFlag; await this.tablolariOlustur(_e); tx = e.tx = _e.tx;
			const {sicakTeslimFisimi, tip2EkOzellik, ozelKampanyaKullanilirmi} = this;
			islemAdi = 'Numaratör listesi';
			$.extend(wsFetches, {															// next prefetch
				ugramaSebep: this.wsUgramaSebepListe(),
				yer: this.wsStokYerListe(),
				stokGrup: this.wsStokGrupListe(),
				marka: this.wsStokMarkaListe()
			});
			
			recs = await this.fetchWSRecs({ source: wsFetches.numaratorListe, islemAdi: islemAdi, step: 4 });
			// subCount = asInteger(recs.length / 3);
			subCount = 8;
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			
			hvListe = [];
			Object.values(recs).forEach(rec => {
				const tipVeOzelIsaret =
					rec.tip || rec.Tip
						? { tip: rec.tip || rec.Tip, ozelIsaret: '', efAyrimTipi: '' }
						: CETNumarator.wsBelirtec2TipVeOzelIsaret({
							belirtec: rec.Belirtec == null ? rec.belirtec : rec.Belirtec,
							efAyrimTipi: rec.EFAyrimTipi == null ? rec.efAyrimTipi : rec.EFAyrimTipi,
							ozelIsaret: rec.OzelIsaret == null ? rec.ozelIsaret : rec.OzelIsaret
						});
				hvListe.push({
					tip: tipVeOzelIsaret.tip,
					ozelIsaret: ((rec.ozelisaret || rec.OzelIsaret) == null ? tipVeOzelIsaret.ozelIsaret : rec.ozelisaret || rec.OzelIsaret),
					seri: rec.Seri || rec.seri || rec.maxseri || '',
					sonNo: asInteger(rec.SonNo || rec.sonNo || rec.sonno) || 0
				});
			});
			await CETNumarator.dbMgr.insertOrReplaceTable({
				table: 'const_Numarator', mode: 'insertIgnore',
				hvListe: hvListe,
				parcaCallback: e => {
					if (e.index % subCount == 0)
						this.knobProgressStep();
				}
			});


			islemAdi = 'Matbuu Tanımlar';
			$.extend(wsFetches, {															// next prefetch
				sube: this.wsSubeListe(),
				plasiyer: this.wsPlasiyerListe()
			});

			recs = await this.fetchWSRecs({ source: wsFetches.etMatbuuTanimlar, islemAdi: islemAdi, step: 4 });
			// subCount = asInteger(recs.length / 3);
			subCount = 2;
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			
			let matbuuFormYapilari = this._matbuuFormYapilari = new CETMatbuuFormYapilari({ tip2MatbuuForm: recs });
			await matbuuFormYapilari.kaydet();

			islemAdi = 'Uğrama Sebep listesi';
			$.extend(wsFetches, {															// next prefetch
				nakliyeSekli: this.wsNakliyeSekliListe(),
				sevkAdres: this.wsSevkAdresListe(),
				sablonFisTipi: this.wsSablonFisTipiListe()
			});

			recs = await this.fetchWSRecs({ source: wsFetches.ugramaSebep, islemAdi: islemAdi, step: 1 });
			// subCount = asInteger(recs.length / 2);
			subCount = 1;
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			
			hvListe = [];
			recs.forEach(rec => {
				hvListe.push({ kod: rec.kod, aciklama: rec.aciklama || '' });
			});
			await dbMgr.insertOrReplaceTable({
				table: 'mst_UgramaNeden', mode: 'insertIgnore', hvListe: hvListe,
				parcaCallback: e => {
					if (e.index % subCount == 0)
						this.knobProgressStep();
				}
			});


			islemAdi = 'Şube listesi';
			$.extend(wsFetches, {															// next prefetch
				dovizListe: this.wsDovizListe(),
				dvKurListe: this.wsDvKurListe()
			});
			recs = await this.fetchWSRecs({ source: wsFetches.sube, islemAdi: islemAdi, step: 1 });
			// subCount = asInteger(recs.length / 2);
			subCount = 1;
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			
			hvListe = [];
			recs.forEach(rec => {
				hvListe.push({ kod: rec.kod, aciklama: rec.aciklama || '' });
			});
			await dbMgr.insertOrReplaceTable({
				table: 'mst_Sube', mode: 'insertIgnore', hvListe: hvListe,
				parcaCallback: e => {
					if (e.index % subCount == 0)
						this.knobProgressStep();
				}
			});


			islemAdi = 'Döviz listesi';
			recs = await this.fetchWSRecs({ source: wsFetches.dovizListe, islemAdi: islemAdi, step: 1 });
			const dvKod2Rec = {};
			await (async () => {
				const _recs = await this.fetchWSRecs({ source: wsFetches.dvKurListe, islemAdi: islemAdi, step: 1 });
				for (const rec of _recs)
					dvKod2Rec[rec.kod] = rec
			})();
			// subCount = asInteger(recs.length / 2);
			subCount = 1;
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			
			hvListe = [
				{ kod: '', aciklama: '', alimKur: 0, satisKur: 0 }
			];
			for (const _rec of recs) {
				const {kod, aciklama} = _rec;
				const rec = dvKod2Rec[kod] || {};
				hvListe.push({
					kod: kod, aciklama: aciklama || '',
					alimKur: asFloat(rec.efekalis || rec.dovizalis || rec.alimkur || rec.sonalimkur) || 0,
					satisKur: asFloat(rec.efeksatis || rec.dovizsatis || rec.satiskur || rec.sonsatiskur) || 0
				})
			}
			await dbMgr.insertOrReplaceTable({
				table: 'mst_Doviz', mode: 'insertIgnore', hvListe: hvListe,
				parcaCallback: e => {
					if (e.index % subCount == 0)
						this.knobProgressStep();
				}
			});

			
			islemAdi = 'Plasiyer listesi';
			recs = await this.fetchWSRecs({ source: wsFetches.plasiyer, islemAdi: islemAdi, step: 1 });
			// subCount = asInteger(recs.length / 2);
			subCount = 1;
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			
			hvListe = [];
			recs.forEach(rec => {
				hvListe.push({ kod: rec.kod, aciklama: rec.aciklama || '' });
			});
			await dbMgr.insertOrReplaceTable({
				table: 'mst_Plasiyer', mode: 'insertIgnore', hvListe: hvListe,
				parcaCallback: e => {
					if (e.index % subCount == 0)
						this.knobProgressStep();
				}
			});


			islemAdi = 'Nakliye Şekli';
			recs = await this.fetchWSRecs({ source: wsFetches.nakliyeSekli, islemAdi: islemAdi, step: 1 });
			// subCount = asInteger(recs.length / 2);
			subCount = 1;
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			
			hvListe = [];
			recs.forEach(rec => {
				hvListe.push({ kod: rec.kod, aciklama: rec.aciklama || '' });
			});
			await dbMgr.insertOrReplaceTable({
				table: 'mst_NakliyeSekli', mode: 'insertIgnore', hvListe: hvListe,
				parcaCallback: e => {
					if (e.index % subCount == 0)
						this.knobProgressStep();
				}
			});


			islemAdi = 'Sevk Adres';
			recs = await this.fetchWSRecs({ source: wsFetches.sevkAdres, islemAdi: islemAdi, step: 1 });
			// subCount = asInteger(recs.length / 2);
			subCount = 1;
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			
			hvListe = [];
			recs.forEach(rec => {
				hvListe.push({
					mustKod: rec.mustKod || rec.mustkod || '',
					kod: rec.kod, aciklama: rec.aciklama || '',
					yore: rec.yore || '',
					ilKod: rec.ilKod || rec.ilkod || '',
					ilAdi: rec.ilAdi || rec.iladi || ''
				});
			});
			await dbMgr.insertOrReplaceTable({
				table: 'mst_SevkAdres', mode: 'insertIgnore', hvListe: hvListe,
				parcaCallback: e => {
					if (e.index % subCount == 0)
						this.knobProgressStep();
				}
			});


			islemAdi = 'Stok Yer listesi';
			if (appMagazaVeyaSDMmi) { wsFetches.yerRafListe = this.wsYerRafListe() }
			recs = await this.fetchWSRecs({ source: wsFetches.yer, islemAdi: islemAdi, step: 1 });
			// subCount = asInteger(recs.length / 2);
			subCount = 1;
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			
			hvListe = [];
			recs.forEach(rec => {
				hvListe.push({
					kod: rec.kod, aciklama: rec.aciklama || '',
					subeKod: rec.bizsubekod || ''
				});
			});
			await dbMgr.insertOrReplaceTable({
				table: 'mst_Yer', mode: 'insertIgnore', hvListe: hvListe,
				parcaCallback: e => {
					if (e.index % subCount == 0)
						this.knobProgressStep();
				}
			});
			

			islemAdi = 'Şablon Fiş Tipi listesi';
			/*$.extend(wsFetches, {															// next prefetch
				transferYontemiListe: this.wsTransferYontemiListe()
			});*/
			recs = await this.fetchWSRecs({ source: wsFetches.sablonFisTipi, islemAdi: islemAdi, step: 1 });
			// subCount = asInteger(recs.length / 2);
			subCount = 1;
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			
			hvListe = [];
			recs.forEach(rec => {
				hvListe.push({ kod: rec.kod, aciklama: rec.aciklama || '', data: rec.data || '' });
			});
			await dbMgr.insertOrReplaceTable({
				table: 'mst_SablonFisTipi', mode: 'insertIgnore', hvListe: hvListe,
				parcaCallback: e => {
					if (e.index % subCount == 0)
						this.knobProgressStep();
				}
			});


			if (appMagazaVeyaSDMmi) {
				islemAdi = 'Yer Raf listesi';
				$.extend(wsFetches, {															// next prefetch
					transferYontemiListe: this.wsTransferYontemiListe()
				});
				recs = await this.fetchWSRecs({ source: wsFetches.yerRafListe, islemAdi: islemAdi, step: 1 });
				// subCount = asInteger(recs.length / 2);
				subCount = 1;
				await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);

				hvListe = [];
				recs.forEach(rec => {
					hvListe.push({ yerKod: rec.yerkod, rafKod: rec.rafkod });
				});
				await dbMgr.insertOrReplaceTable({
					table: 'mst_YerRaf', mode: 'insertIgnore', hvListe: hvListe,
					parcaCallback: e => {
						if (e.index % subCount == 0)
							this.knobProgressStep();
					}
				});


				islemAdi = 'Transfer Yöntemi listesi';
				/*$.extend(wsFetches, {															// next prefetch
					transferYontemiListe: this.wsTransferYontemiListe()
				});*/
				recs = await this.fetchWSRecs({ source: wsFetches.transferYontemiListe, islemAdi: islemAdi, step: 1 });
				// subCount = asInteger(recs.length / 2);
				subCount = 1;
				await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);

				hvListe = [];
				recs.forEach(rec => {
					hvListe.push({
						aciklama: rec.aciklama || '',
						cikisYerKod: rec.cyerkod || '', girisYerKod: rec.gyerkod || ''
					});
				});
				await dbMgr.insertOrReplaceTable({
					table: 'mst_TransferYontemi', mode: 'insertIgnore', hvListe: hvListe,
					parcaCallback: e => {
						if (e.index % subCount == 0)
							this.knobProgressStep();
					}
				})
			}

			islemAdi = 'Stok Grup listesi';
			$.extend(wsFetches, {															// next prefetch
				barkodReferans: this.wsBarkodReferansListe(),
				proGrupDetaylar: this.wsProGrupDetaylar()
			});
			if (ozelKampanyaKullanilirmi) { wsFetches.ozelKampanyaListe = await this.wsOzelKampanyaListe() }
			recs = await this.fetchWSRecs({ source: wsFetches.stokGrup, islemAdi, step: 1 });
			subCount = 1; await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			hvListe = []; for (const rec of recs) { hvListe.push({ kod: rec.kod, aciklama: rec.aciklama || '' }) }
			await dbMgr.insertOrReplaceTable({
				table: 'mst_StokGrup', mode: 'insertIgnore', hvListe,
				parcaCallback: e => { if (e.index % subCount == 0) { this.knobProgressStep() } }
			});

			islemAdi = 'Promosyon Grup Detayları';
			recs = await this.fetchWSRecs({ source: wsFetches.proGrupDetaylar, islemAdi, step: 1 });
			subCount = 1; await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			hvListe = []; for (const rec of recs) { hvListe.push({ proGrupKod: rec.proGrupKod, stokKod: rec.stokKod }) }
			await dbMgr.insertOrReplaceTable({
				table: 'mst_ProGrup2Stok', mode: 'insertIgnore', hvListe,
				parcaCallback: e => { if (e.index % subCount == 0) { this.knobProgressStep() } }
			});
			
			islemAdi = 'Marka listesi';
			/*$.extend(wsFetches, {															// next prefetch
				transferYontemiListe: this.wsTransferYontemiListe()
			});*/
			recs = await this.fetchWSRecs({ source: wsFetches.marka, islemAdi: islemAdi, step: 1 });
			// subCount = asInteger(recs.length / 2);
			subCount = 1;
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			
			hvListe = [];
			recs.forEach(rec => {
				hvListe.push({ kod: rec.kod, aciklama: rec.aciklama || '' });
			});
			await dbMgr.insertOrReplaceTable({
				table: 'mst_Marka', mode: 'insertIgnore', hvListe: hvListe,
				parcaCallback: e => {
					if (e.index % subCount == 0)
						this.knobProgressStep();
				}
			});


			if (ozelKampanyaKullanilirmi) {
				islemAdi = 'Özel Kampanya listesi';
				/*$.extend(wsFetches, {															// next prefetch
					transferYontemiListe: this.wsTransferYontemiListe()
				});*/
				recs = await this.fetchWSRecs({ source: wsFetches.ozelKampanyaListe, islemAdi: islemAdi, step: 1 });
				// subCount = asInteger(recs.length / 2);
				subCount = 1;
				await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
				
				hvListe = [];
				recs.forEach(rec => {
					hvListe.push({
						kod: rec.kod, aciklama: rec.aciklama || '',
						iskSinir: asFloat(rec.isksinir || rec.iskSinir || rec.sinir) || 0
					});
				});
				await dbMgr.insertOrReplaceTable({
					table: 'mst_OzelKampanya', mode: 'insertIgnore', hvListe: hvListe,
					parcaCallback: e => {
						if (e.index % subCount == 0)
							this.knobProgressStep();
					}
				});
			}

			const {rbkKullanilirmi} = this;
			if (rbkKullanilirmi) {
				$.extend(wsFetches, {
					rbk2ABListe: this.wsRBK2ABListe(),
					bedenKategoriAsortiCarpanlari: this.wsBedenKategoriAsortiCarpanlari(),
					stokRBKListe: await this.wsStokRBKListe()
				})
			}

			islemAdi = 'Tahsil Şekli listesi';
			$.extend(wsFetches, {														// next prefetch
				cariRiskVeBakiyeListe: this.wsCariRiskVeBakiyeListe() });
			recs = await this.fetchWSRecs({ source: wsFetches.tahsilSekli, islemAdi: islemAdi, step: 2 });
			// subCount = asInteger(recs.length / 3);
			subCount = 6;
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			
			hvListe = [];
			recs.forEach(rec => {
				let uygunmu = asBool(rec.elterkullan) && !((rec.tahsiltipi == 'PS' || rec.tahsiltipi == 'P') && asBool(rec.posisaret));
				if(uygunmu) { hvListe.push({ kodNo: asInteger(rec.kodno), aciklama: rec.aciklama || '', tahsilTipi: rec.tahsiltipi, tahsilAltTipi: rec.ahalttipi || '' }); }
			});
			await dbMgr.insertOrReplaceTable({
				table: 'mst_TahsilSekli', mode: 'insertIgnore', hvListe,
				parcaCallback: e => { if (e.index % subCount == 0) { this.knobProgressStep() } }
			});


			islemAdi = 'Cari Risk ve Bakiye listesi';
			$.extend(wsFetches, {														// next prefetch
				cariTip: this.wsCariTipListe()
			});
			recs = await this.fetchWSRecs({ source: await wsFetches.cariRiskVeBakiyeListe, islemAdi: islemAdi, step: 1 });
			// subCount = asInteger(recs.length / 2);
			subCount = 1;
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			
			const mustKod2RiskBakiyeRec = {};
			recs.forEach(rec => {
				const mustKod = rec.kod;
				if (mustKod) {
					const _rec = {
						riskLimiti: asFloat(rec.risklimiti) || 0,
						bakiye: asFloat(rec.bakiye) || 0,
						riskli: asFloat(rec.riskli) || 0,
						takipBorcLimiti: asFloat(rec.takipborclimiti) || 0,
						takipBorc: asFloat(rec.takipborc) || 0
					};
					if (Object.values(_rec).find(value => !!value))
						mustKod2RiskBakiyeRec[mustKod] = _rec;
				}
			});


			islemAdi = 'Cari Tip Listesi';
			$.extend(wsFetches, {														// next prefetch
				cari: this.wsCariListe()
			});
			try {
				recs = await this.fetchWSRecs({ source: await wsFetches.cariTip, islemAdi: islemAdi, step: 1 });
				// subCount = asInteger(recs.length / 3);
				subCount = 10;
				await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
				
				hvListe = [];
				for (const rec of recs) {
					hvListe.push({
						kod: rec.kod || '', aciklama: rec.aciklama || ''
					})
				}
				await dbMgr.insertOrReplaceTable({
					table: 'mst_CariTip', mode: 'insertIgnore', hvListe: hvListe,
					parcaCallback: e => {
						if (e.index % subCount == 0)
							this.knobProgressStep();
					}
				})
			}
			catch (ex) {
				console.error('-ignorable-', ex)
			}

			islemAdi = 'Cari listesi';
			$.extend(wsFetches, {															// next prefetch
				stok: this.wsStokListe()
			});
			recs = await this.fetchWSRecs({ source: await wsFetches.cari, islemAdi: islemAdi, step: 10 });
			subCount = asInteger(recs.length / 8);
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			hvListe = [];
			let maxSeq = 0;
			await (async () => {
				const sent = new MQSent({
					from: 'mst_Cari',
					where: [
						`(seq IS NOT NULL AND seq > 0)`,
						{ like: `WSAKT%`, saha: 'kod' }
					],
					sahalar: `MAX(seq) maxSeq`
				});
				maxSeq = asInteger(await dbMgr.tekilDegerExecuteSelect({ query: sent })) || 0;
			})();
			for (const rec of recs) {
				const {kod} = rec;
				let seq = asInteger(rec.seq) || 0;
				const bakiyeRiskRec = mustKod2RiskBakiyeRec[kod];
				if (bakiyeRiskRec) {
					const keys = [
						'bakiye', 'riskLimiti', 'riskli',
						'takipBorcLimiti', 'takipBorc'
					];
					for (const i in keys) {
						const key = keys[i];
						const keyLower = key.toLowerCase();
						let value = asFloat(rec[keyLower]);
						if (!value)
							value = rec[keyLower] = bakiyeRiskRec[key];
					}
				}

				if (!seq && kod.startsWith('WSAKT'))
					seq = ++maxSeq;
				
				let hv = {
					kod: kod,
					seq: seq,
					gonderildi: '*',
					tipKod: rec.tipkod || '', herGunmu: bool2Int(rec.hermi),
					rotaDisimi: bool2Int(rec.rotadisimi), rotaIciSayi: asInteger(rec.rotaicisayi), rotaDevreDisimi: bool2Int(rec.rotaDevreDisimi),
					efatmi: bool2Int(rec.efaturakullanirmi || rec.efatmi), matbuuStokRefYazilirmi: bool2Int(rec.etmatbuustokrefyazmi),
					stkFytInd: asInteger(rec.stkfytind) || 0,
					email: rec.email || '', tel1: rec.tel1 || '', tel2: rec.tel2 || '', tel3: rec.tel3 || '',
					yore: rec.yore || '', posta: rec.posta || '', ulkeKod: rec.ulkekod || '', ulkeAdi: rec.ulkeadi || '', ilKod: rec.ilkod || '', ilAdi: rec.iladi || '',
					bolgeKod: rec.bolgekod || '', bolgeAdi: rec.bolgeadi || '', vergiDaire: rec.vdaire || '', sahismi: bool2Int(rec.sahismi),
					vkn: rec.vkno || ((asBool(rec.sahismi) ? rec.tckimlikno : rec.vnumara) || ''), konTipKod: rec.kontipkod || '', konSubeAdi: rec.konsubeadi || '',
					riskCariKod: rec.rcarkod || '', plasiyerKod: rec.plasiyerkod || '', kosulGrupKod: rec.kosulgrupkod || '', kdvDurumu: rec.kdvdurumu || '',
					/*satisFisTipi: rec.satisfistipi || '',*/ /*fiyatListeKod: rec.fiyatlistekod || '',*/ stokFiyatInd: rec.stokfiyatind || '',
					stdDipIskOran: asFloat(rec.stddipiskoran) || 0,
					bakiye: bedel(rec.bakiye) || 0, riskLimiti: bedel(rec.risklimiti) || 0, riskli: bedel(rec.riskli) || 0,
					takipBorcLimiti: bedel(rec.takipborclimiti) || 0, takipBorc: bedel(rec.takipborc) || 0,
					konumLongitude: asFloat(rec.konumLongitude) || 0, konumLatitude: asFloat(rec.konumLatitude) || 0, konumAccuracy: asFloat(rec.konumAccuracy) || 0,
					disTicaretFirma: rec.disticaretfirma || '', /*tcOlmayanUyruk: rec.tcolmayanuyruk || '',*/
					unvan: [rec.unvan1 || '', rec.unvan2 || ''].join(' '),
					adres: [rec.adres1 || '', rec.adres2 || ''].join(' ')
				};
					/* orjBakiye, orjRiskli, orjTakipBorc */
				const keyDonusum = {
					bakiye: 'orjBakiye',
					riskli: 'orjRiskli',
					takipBorc: 'orjTakipBorc'
				};
				for (const asilKey in keyDonusum) {
					const orjKey = keyDonusum[asilKey];
					hv[orjKey] = hv[asilKey];
				}
				hvListe.push(hv);
			}
			await dbMgr.insertOrReplaceTable({
				table: 'mst_Cari', mode: 'insertIgnore', hvListe: hvListe,
				parcaCallback: e => {
					if (e.index % subCount == 0)
						this.knobProgressStep();
				}
			});

			await this.merkezdenBilgiYukleDevam_ekOzellikler(e);

			const Prefix_EkOz = `ekOz_`;
			const ekOzellikIDSahalar = CETEkOzellikler.idSahalar;
			$.extend(wsFetches, {																// next prefetch
				urunPaket: this.wsUrunPaketListe(),
				promosyon: this.wsPromosyonListe(),
				fisSablon: this.wsFisSablonListe(),
				satisKosullari: this.wsSatisKosullari()
			});

			islemAdi = 'Stok listesi';
			if (!sicakTeslimFisimi) {
				$.extend(wsFetches, {															// next prefetch
					sonStok: this.wsSonStokListe()
				});
			}
			recs = await this.fetchWSRecs({ source: await wsFetches.stok, islemAdi: islemAdi, step: 13 });
			subCount = asInteger(recs.length / 5);
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			
			hvListe = [];
			let hvListe_sonStok = [];
			recs.forEach(rec => {
				const sonStok = (sicakTeslimFisimi ? asFloat(rec.sonmiktar || rec.miktar || rec.sonstok) : null) || 0;
				const olasiFark = (sicakTeslimFisimi ? asFloat(rec.olasifark) : null) || 0;
				const iskDegisebilirFlag = asBoolQ(rec.iskdegisebilir);
				const satirIskOranSinirVarmi = (
					iskDegisebilirFlag == null
						? false
						: iskDegisebilirFlag === true
							? asBool(rec.isksinirlanir)
							: true
				);
				const satirIskOranSinir = (
					iskDegisebilirFlag === false
						? 0
						: (rec.iskmax == null
								? null
								: (asFloat(rec.iskmax) || 0))
				);
				hvListe.push({
					kod: rec.kod, aciklama: rec.aciklama || '', grupKod: rec.grupkod || '', /*kisaAdi: rec.kisaadi || '',*/
					fiyatKdvlimi: bool2Int(rec.fiyatkdvlimi), brm: rec.brm || '', brm2: rec.brm2 || '', brmOrani: asFloat(rec.brmorani) || 0,
					/*stkFytInd: asInteger(rec.stkfytind) || 0, yerKod: rec.yerkod || '',*/
					dayaniksizmi: bool2Int(rec.dayaniksizmi), /*toptanaEsasmi: bool2Int(rec.toptanaesasmi),*/
					satKdvOrani: asInteger(rec.satkdvorani) || 0, almKdvOrani: asInteger(rec.almkdvorani) || 0,
					satKdvDegiskenmi: bool2Int(rec.satkdvdegiskenmi), almKdvDegiskenmi: bool2Int(rec.kdvdegiskenmi),
					tartiReferans: rec.tartireferans || '', resimKodu: rec.resimkodu || '',
					paketIciAdet: asFloat(rec.koliici) || 0, paketIciAdet2: asFloat(rec.koliici2) || 0,
					/*satFiyatMiktarTipi: rec.satfiyatmiktartipi, almFiyatMiktarTipi: rec.almfiyatmiktartipi,*/
					brmFiyat: asFloat(rec.brmfiyat) || 0, fiyatGorFiyati: asFloat(rec.fiyatgorfiyati) || 0,
					dvBrmFiyat: asFloat(rec.dvbrmfiyat) || 0, dvFiyatGorFiyati: asFloat(rec.dvfiyatgorfiyati) || 0,
					almFiyat: asFloat(rec.almfiyat) || 0, almNetFiyat: asFloat(rec.almnetfiyat) || 0,
					satFiyat1: asFloat(rec.satfiyat1) || 0, satFiyat2: asFloat(rec.satfiyat2) || 0, satFiyat3: asFloat(rec.satfiyat3) || 0,
					satFiyat4: asFloat(rec.satfiyat4) || 0, satFiyat5: asFloat(rec.satfiyat5) || 0, satFiyat6: asFloat(rec.satfiyat6) || 0, satFiyat7: asFloat(rec.satfiyat7) || 0,
					dvFiyat1: asFloat(rec.dvfiyat1) || 0, dvFiyat2: asFloat(rec.dvfiyat2) || 0, dvFiyat3: asFloat(rec.dvfiyat3) || 0,
					dvFiyat4: asFloat(rec.dvfiyat4) || 0, dvFiyat5: asFloat(rec.dvfiyat5) || 0, dvFiyat6: asFloat(rec.dvfiyat6) || 0, dvFiyat7: asFloat(rec.dvfiyat7) || 0,
					satirIskOranSinirVarmi: bool2Int(satirIskOranSinirVarmi), satirIskOranSinir: satirIskOranSinir || 0,
					boyutTipi: rec.boyuttipi || '',			/* '': Yok ; 'RB': RBK */
					bedenKategoriKod: rec.rbkbedenkategorikod || ''
				});
				if (sonStok || olasiFark) {
					hvListe_sonStok.push({
						stokKod: rec.kod, yerKod: rec.yerkod || '',
						orjMiktar: sonStok, miktar: sonStok,
						olasiFark: olasiFark
					})
				}
			});
			await dbMgr.insertOrReplaceTable({
				table: 'mst_Stok', mode: 'insertIgnore', hvListe: hvListe,
				parcaCallback: e => {
					if (e.index % subCount == 0)
						this.knobProgressStep();
				}
			});
			await dbMgr.insertOrReplaceTable({
				table: 'mst_SonStok', mode: 'insertIgnore', hvListe: hvListe_sonStok,
				parcaCallback: e => {
					if (e.index % (subCount * 2) == 0)
						this.knobProgressStep();
				}
			});


			if (!sicakTeslimFisimi) {
				islemAdi = 'Son Stok listesi';
				recs = await this.fetchWSRecs({ source: await wsFetches.sonStok, islemAdi: islemAdi, step: 15 });
				subCount = asInteger(recs.length / 3);
				await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
				hvListe = [];
				recs.forEach(rec => {
					const miktar = asFloat((rec.sonmiktar || rec.miktar || rec.sonStok) || 0);
					const olasiFark = asFloat(rec.olasifark) || 0;
					if (miktar || olasiFark) {
						const hv = {
							stokKod: rec.stokkod, yerKod: rec.yerkod || '',
							orjMiktar: miktar, miktar: miktar,
							olasiFark: olasiFark
						};
						if (!$.isEmptyObject(ekOzellikIDSahalar)) {
							for (const idSaha of ekOzellikIDSahalar) {
								const recAttr = idSaha.startsWith(Prefix_EkOz) ? idSaha.replace(Prefix_EkOz, 'ekoz') : idSaha;
								const value = rec[recAttr.toLowerCase()];			// !! idSaha lowercase olacak !!
								hv[idSaha] = value || ''
							}
						}
						hvListe.push(hv)
					}
				});
				await dbMgr.insertOrReplaceTable({
					table: 'mst_SonStok', mode: 'insertIgnore',
					hvListe: hvListe,
					parcaCallback: e => {
						if (e.index % subCount == 0)
							this.knobProgressStep()
					}
				})
			}

			if (appMagazaVeyaSDMmi) {
				$.extend(wsFetches, {															// next prefetch
					bekleyenSayimFisler: this.wsBekleyenSayimFisler(),
					bekleyenUgramaFisler: this.wsBekleyenUgramaFisler(),
					bekleyenSiparisler: this.wsBekleyenSiparisler()
				});
			}

			islemAdi = 'Stok Paket listesi';
			$.extend(wsFetches, {																// next prefetch
				tartiBarkodKuralListe: this.wsTartiBarkodKuralListe(),
				ayrisimBarkodKuralListe: this.wsAyrisimBarkodKuralListe()
			});
			recs = await this.fetchWSRecs({ source: wsFetches.urunPaket, islemAdi: islemAdi, step: 1 });
			// subCount = asInteger(recs.length / 3);
			subCount = 10;
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			
			hvListe = [];
			for (const rec of recs) {
				hvListe.push({
					stokKod: rec.urunkod || rec.stokkod || '',
					paketKod: rec.paketkod || '',
					paketIcAdet: asFloat(rec.urunmiktari || rec.paketicadet || rec.koliici),
					varsayilanmi: coalesce(rec.varsayilan || '*')
				});
			}
			await dbMgr.insertOrReplaceTable({
				table: 'mst_StokPaket', mode: 'insertIgnore', hvListe: hvListe,
				parcaCallback: e => {
					if (e.index % subCount == 0)
						this.knobProgressStep();
				}
			});
			
			await this.merkezdenBilgiYukleDevam_promosyon(e);
			
			islemAdi = 'Barkod Referans listesi';
			recs = await this.fetchWSRecs({ source: await wsFetches.barkodReferans, islemAdi: islemAdi, step: 12 });
			subCount = asInteger(recs.length / 8);
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);

			const barkodRef_ekOzellikTipSet = CETBarkodParser_Referans.uygunEkOzellikTipSet;
			hvListe = [];
			recs.forEach(rec => {
				var hv = {
					refKod: rec.refkod, stokKod: rec.stokkod, varsayilanmi: bool2Int(rec.varsayilan),
					koliBarkodmu: bool2Int(rec.bkolibarkodmu), paketKod: rec.paketkod || '', koliIci: asFloat(rec.koliici) || 0
				};
				for (const tip of Object.keys(barkodRef_ekOzellikTipSet)) {
					const ekOzellik = tip2EkOzellik[tip] || {}, {idSaha} = ekOzellik;
					const recAttr = idSaha.startsWith(Prefix_EkOz) ? idSaha.replace(Prefix_EkOz, 'ekoz') : idSaha;
					let value = rec[recAttr.toLowerCase()];			// !! idSaha lowercase olacak !!
					hv[idSaha] = value || '';
				}
				hvListe.push(hv);
			});
			await dbMgr.insertOrReplaceTable({
				table: 'mst_BarkodReferans', mode: 'insertIgnore', hvListe: hvListe,
				parcaCallback: e => {
					if (e.index % subCount == 0)
						this.knobProgressStep();
				}
			});


			islemAdi = 'Tartı Barkod Kuralları';
			recs = await this.fetchWSRecs({ source: await wsFetches.tartiBarkodKuralListe, islemAdi: islemAdi, step: 2 });
			subCount = asInteger(recs.length / 20);
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			
			hvListe = [];
			recs.forEach(rec => {
				hvListe.push({
					kod: rec.kod || rec.id, aciklama: rec.aciklama || '',
					stokBas: asInteger(rec.stokbas), stokHane: asInteger(rec.stokhane), miktarBrm: rec.miktarbrm || '',
					miktarBas: asInteger(rec.miktarbas), miktarHane: asInteger(rec.miktarhane), miktarBolen: asFloat(rec.miktarbolen),
					fiyatBas: asInteger(rec.fiyatbas), fiyatHane: asInteger(rec.fiyathane), fiyatBolen: asFloat(rec.fiyatbolen)
				});
			});
			await dbMgr.insertOrReplaceTable({
				table: 'mst_BarTarti', mode: 'insertIgnore', hvListe: hvListe,
				parcaCallback: e => {
					if (e.index % subCount == 0)
						this.knobProgressStep();
				}
			});


			islemAdi = 'Ayrışım Barkod Kuralları';
			recs = await this.fetchWSRecs({ source: await wsFetches.ayrisimBarkodKuralListe, islemAdi: islemAdi, step: 2 });
			subCount = asInteger(recs.length / 20);
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			
			hvListe = [];
			for (const rec of recs) {
				const hv = {
					kod: rec.kod || rec.id, aciklama: rec.aciklama || '',
					formatTipi: rec.formattipi || '', bosFormat: rec.bosformat || '',
					ayiracSayi: asInteger(rec.ayiracsayi) || 0, ayiracStr: rec.ayiracstr || '',
					// paketIcAdet: asFloat(rec.paketicadet || rec.paketIcAdet) || 0,
					barkodBas: rec.barkodbas, barkodHane: rec.barkodhane,
					stokBas: rec.stokbas || 0, stokHane: rec.stokhane || 0,
					stokBaslangicdanmi: bool2Int(rec.stokBaslangicdanmi),
					miktarBas: rec.miktarbas || 0, miktarHane: rec.miktarhane || 0,
					// fiyatBas: rec.fiyatbas || 0, fiyatHane: rec.fiyathane || 0,
					paketBas: rec.paketbas || 0, paketHane: rec.pakethane || 0,
					modelBas: rec.modelbas || 0, modelHane: rec.modelhane || 0,
					renkBas: rec.renkbas || 0, modelHane: rec.renkhane || 0,
					desenBas: rec.desenbas || 0, desenHane: rec.desenhane || 0,
					kavalaBas: rec.kavalabas || 0, kavalaHane: rec.kavalahane || 0,
					enBas: rec.enbas || 0, enHane: rec.enhane || 0,
					boyBas: rec.boybas || 0, boyHane: rec.boyhane || 0,
					enBas: rec.enbas || 0, enHane: rec.enhane || 0,
					yukseklikBas: rec.yukseklikbas || 0, yukseklikHane: rec.yukseklikhane || 0,
					lotNoBas: rec.lotnobas || 0, lotNoHane: rec.lotnohane || 0,
					seriNoBas: rec.serinobas || 0, seriNoHane: rec.serinohane || 0,
					rafBas: rec.rafbas || 0, rafHane: rec.rafhane || 0
				};
				for (let i = 1; i <= 9; i++) {
					const keyPrefix_hv = `ekOz${i}`;
					const keyPrefix_rec = `ekoz${i}`;
					hv[`${keyPrefix_hv}Bas`] = rec[`${keyPrefix_rec}bas`] || 0;
					hv[`${keyPrefix_hv}Hane`] = rec[`${keyPrefix_rec}hane`] || 0;
				}
				hvListe.push(hv)
			}
			await dbMgr.insertOrReplaceTable({
				table: 'mst_BarAyrisim', mode: 'insertIgnore', hvListe: hvListe,
				parcaCallback: e => {
					if (e.index % subCount == 0)
						this.knobProgressStep();
				}
			});
			if (rbkKullanilirmi) {
				islemAdi = 'Beden Kategori Detayları';
				recs = await this.fetchWSRecs({ source: await wsFetches.rbk2ABListe, islemAdi: islemAdi, step: 1 });
				subCount = asInteger(recs.length / 30);
				await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
				hvListe = [];
				let seq = 0;
				for (const rec of recs) {
					const _seq = asInteger(rec.seq) || 0;
					seq = Math.max(seq, _seq) + 1;
					const hv = {
						// vioID: rec.vioID, rec.vioid || rec.id,
						seq: seq, kategoriKod: rec.kategorikod || null,
						abKod: rec.abkod || rec.beden || null,
						abTipi: rec.abtipi || (asBool(rec.asortimi) ? 'A' : ''),
					};
					hvListe.push(hv)
				}
				await dbMgr.insertOrReplaceTable({
					table: 'mst_BedenKategoriDetay', mode: 'insertIgnore', hvListe: hvListe,
					parcaCallback: e => {
						if (e.index % subCount == 0)
							this.knobProgressStep()
					}
				});

				islemAdi = 'Beden Asorti Çarpanları';
				recs = await this.fetchWSRecs({ source: wsFetches.bedenKategoriAsortiCarpanlari, islemAdi: islemAdi, step: 1 });
				subCount = asInteger(recs.length / 30);
				await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
				
				hvListe = [];
				for (const rec of recs) {
					const hv = {
						// vioID: rec.vioID, rec.vioid || rec.id,
						bedenKategoriKod: rec.bkatkod || null,
						asortiKod: rec.asortikod || null,
						carpan: rec.carpan || 1
					};
					hvListe.push(hv)
				}
				await dbMgr.insertOrReplaceTable({
					table: 'mst_BedenKategoriCarpan', mode: 'insertIgnore', hvListe: hvListe,
					parcaCallback: e => {
						if (e.index % subCount == 0)
							this.knobProgressStep();
					}
				});
				
				islemAdi = 'Stok RBK';
				recs = await this.fetchWSRecs({ source: await wsFetches.stokRBKListe, islemAdi: islemAdi, step: 1 });
				subCount = asInteger(recs.length / 30);
				await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
				
				hvListe = [];
				for (const rec of recs) {
					const hv = {
						// vioID: rec.vioID, rec.vioid || rec.id,
						stokKod: rec.stokKod || rec.stokkod || null,
						desenKod: rec.desenKod || rec.desenkod || '',
						renkKod: rec.renkKod || rec.renkkod || '',
						asortiVeyaBeden: rec.asortiVeyaBeden || rec.asortiveyabeden || ''
					};
					hvListe.push(hv)
				}
				await dbMgr.insertOrReplaceTable({
					table: 'mst_StokRBK', mode: 'insertIgnore', hvListe: hvListe,
					parcaCallback: e => {
						if (e.index % subCount == 0)
							this.knobProgressStep();
					}
				});
			}
			if (appMagazaVeyaSDMmi) {
				recs = null;
				try { recs = await this.fetchWSRecs({ source: await wsFetches.bekleyenSiparisler, islemAdi: islemAdi, step: 20 }) }
				catch (ex) { console.warn({ isError: true, rc: `wsIletisim`, locus: `bekleyenSiparisler`, errorText: ex.responseJSON || ex }) }

				if (recs) {
					islemAdi = 'Bekleyen Siparişler';
					subCount = asInteger(recs.length / 8);
					await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);

					hvListe = [];
					const {idSahalarSiparis} = CETEkOzellikler;
					for (const rec of recs) {
						const bekleyenMiktar = asFloat(rec.bekleyenmiktar || rec.bekleyenMiktar || rec.miktar) || 0;
						const hv = {
							vioID: asInteger(rec.vioID || rec.vioid || rec.id || rec.kaysayac), tarih: rec.tarih || '',
							teslimTarih: rec.teslimtarih || rec.teslimtarihi || rec.teslimTarih || rec.teslimTarihi ||'',
							ayrimTipi: rec.ayrimTipi || rec.ayrimtipi || '', teslimYerKod: rec.xadreskod || '', nakSekliKod: rec.nakseklikod || '',
							odemeGunKod: rec.odemeGunKod || rec.odemegunkod || '',
							tahSekliKodNo: asInteger(rec.tahSekliKodNo || rec.tahseklikodno || rec.tahSekliNo || rec.tahseklino) || 0,
							almSat: rec.almSat || rec.almsat, fisNox: rec.fisNox || rec.fisnox || rec.fisNoxKisa || rec.fisnoxkisa || '',
							mustKod: rec.mustKod || rec.mustkod || rec.must, stokKod: rec.stokKod || rec.stokkod,
							bekleyenMiktar: bekleyenMiktar, kalanMiktar: bekleyenMiktar
						};
						if (!$.isEmptyObject(idSahalarSiparis)) {
							const Prefix_EkOz = `ekOz_`;
							for (const idSaha of idSahalarSiparis) {
								const recAttr = idSaha.startsWith(Prefix_EkOz) ? idSaha.replace(Prefix_EkOz, 'ekoz') : idSaha;
								let value = rec[recAttr.toLowerCase()];			// !! idSaha lowercase olacak !!
								hv[idSaha] = value || ''
							}
						}
						hvListe.push(hv)
					}
					await dbMgr.insertOrReplaceTable({
						table: 'data_BekleyenSiparisler', mode: 'insertIgnore', hvListe: hvListe,
						parcaCallback: e => {
							if (e.index % subCount == 0)
								this.knobProgressStep()
						}
					})
				}
			}

			(async() => {
				try {
					await this.merkezdenBilgiYukleDevam_bekleyenSayimFisler(e);
					await this.merkezdenBilgiYukleDevam_bekleyenUgramaFisler(e)
				}
				catch (ex) {
					if (!ex || ex.statusText)
						displayServerResponse(ex)
					else
						displayMessage(ex.message || ex.errorText || ex.message || (ex.responseJSON || {}).errorText || '', `${ex.isError ? '@' : '!'} Bekleyen X Fişler Yükleme ${ex.isError ? '@' : '!'}`)
				}
			})()

			const {oncekiFislerGosterilmezmi} = this;
			if (!oncekiFislerGosterilmezmi) {
				$.extend(wsFetches, { oncekiFisler: this.wsOncekiFisler() })						// next prefetch
				await (async () => {
					islemAdi = 'Önceki Belgeler';
					recs = await this.fetchWSRecs({ source: await wsFetches.oncekiFisler, islemAdi: islemAdi, step: 5 });
					// subCount = asInteger(recs.length / 3);
					subCount = 8;
					await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
					const removeAttrList = ['_table', '_harTable', 'har_fissayac', 'fissayac', 'fisSayac', 'kaysayac', 'kaySayac'];
					let table2VioID2RowID = {};
					const hasTx = !!e.tx;
					let tx = await dbMgr.getTx({ tx: e.tx });
					const deletedTablesSet = {};
					const PrefixFis = 'fis_';
					for (const rec of recs) {
						const table = rec._table;
						if (!table)
							continue
						const vioID = rec.fissayac || rec.fisSayac;
						const vioID2RowID = table2VioID2RowID[table] = table2VioID2RowID[table] || {};
						if (!vioID2RowID[vioID]) {
							const hv = { rapor: '*', gonderildi: '*', vioID: vioID };
							for (let key in rec) {
								const value = rec[key];
								if (value != null && key.startsWith(PrefixFis)) {
									key = key.substr(PrefixFis.length);
									hv[key] = value
								}
							}
							for (const key of removeAttrList)
								delete hv[key]
							if (!deletedTablesSet[table]) {
								const del = new MQIliskiliDelete({ from: table, where: [`rapor <> ''`] });
								await dbMgr.executeSql({ tx: tx, query: del });
								deletedTablesSet[table] = true
							}
							try {
								await dbMgr.insertOrReplaceTable({
									table: table, mode: 'insertIgnore',
									tx: tx, hv: hv, parcaSize: 20,
									parcaCallback: e => {
										let insertId = (e.rs ?? e).insertId;
										if (insertId)
											vioID2RowID[vioID] = insertId
										if (e.index % subCount == 0)
											this.knobProgressStep()
									}
								});
							}
							catch (ex) { console.error('oncekiFisler', 'insertTable', 'baslik', ex) }
						}
					}
		
					const harTable2HVListe = [], harTable2FisTable = {};
					const table2RowID2SonSeq = {};
					for (const rec of recs) {
						const table = rec._table;
						const harTable = rec._harTable;
						if (!harTable)
							continue
						if (table && !harTable2FisTable[harTable])
							harTable2FisTable[harTable] = table
						const vioID = rec.fissayac || rec.fisSayac;
						const hvListe = harTable2HVListe[harTable] = harTable2HVListe[harTable] || [];
						const vioID2RowID = table ? table2VioID2RowID[table] || {} : null;
						const rowID = table ? vioID2RowID[vioID] : null;
						const rowID2SonSeq = table2RowID2SonSeq[harTable] = table2RowID2SonSeq[harTable] || {};
						const seq = rowID2SonSeq[rowID] = (rowID2SonSeq[rowID] || 0) + 1;
						if (rec.fis_iade) {
							const keys = ['miktar', 'belgebedel', 'belgebrutbedel'];
							for (const key in keys) {
								let value = rec[key];
								if (typeof value == 'number' && value < 0)
									hv[key] = value = Math.abs(value)
							}
						}
						const hv = {};
						for (let key in rec) {
							let value = rec[key];
							if (value != null && !key.startsWith(PrefixFis))						
								hv[key] = value;
						}
						for (const key of removeAttrList)
							delete hv[key]
						if (rowID)
							hv.fissayac = rowID
						hv.seq = seq;
						hvListe.push(hv)
					}
					for (const harTable in harTable2HVListe) {
						if (!deletedTablesSet[harTable]) {
							const table = harTable2FisTable[harTable];
							if (table) {
								const del = new MQIliskiliDelete({ from: harTable });
								if (table)
									del.where.add(`fissayac IN (SELECT rowid fissayac FROM ${table} WHERE rapor <> '')`)
								await dbMgr.executeSql({ tx: tx, query: del });
								deletedTablesSet[harTable] = true
							}
						}
						const hvListe = harTable2HVListe[harTable];
						if (!$.isEmptyObject(hvListe)) {
							try {
								await dbMgr.insertOrReplaceTable({
									table: harTable, mode: 'insertIgnore',
									tx: tx, hvListe: hvListe,
									parcaCallback: e => {
										if (e.index % subCount == 0)
											this.knobProgressStep()
									}
								});
							}
							catch (ex) { console.error('oncekiFisler', 'insertTable', 'baslik', ex) }
						}
					}
					// if (!hasTx)
					// 	await dbMgr.getTx()
				})()
			}
			
			await (async () => {
				islemAdi = 'Fiş Şablon listesi';
				recs = await this.fetchWSRecs({ source: wsFetches.fisSablon, islemAdi: islemAdi, step: 5 });
				// subCount = asInteger(recs.length / 3);
				subCount = 8;
				await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
				
				let getAnahtarStr = rec =>
					`${rec.etAdimTipi}|${rec.fisSayac}`;
				let vioID2RowID = {};
				let hasTx = !!e.tx;
				let tx = await dbMgr.getTx({ tx: e.tx });
				for (let i in recs) {
					const rec = recs[i];
					const {fisSayac, etAdimTipi, aciklama} = rec;
					const anahStr = getAnahtarStr(rec);
					if (fisSayac && !vioID2RowID[anahStr] && etAdimTipi && aciklama) {
						const hv = { etAdimTipi: etAdimTipi, aciklama: aciklama };
						await dbMgr.insertOrReplaceTable({
							table: 'mst_SablonFis', mode: 'insertIgnore', hv: hv,
							parcaCallback: e => {
								let insertId = (e.rs ?? e).insertId;
								if (insertId)
									vioID2RowID[anahStr] = insertId
								if (e.index % subCount == 0)
									this.knobProgressStep();
							}
						});
					}
				}

				const ekOzelliklerIDSahalar = CETEkOzellikler.idSahalar;
				hvListe = [];
				let rowID2SonSeq = {};
				for (let i in recs) {
					const rec = recs[i];
					const vioID = getAnahtarStr(rec);
					const fisSayac = vioID2RowID[vioID];
					if (fisSayac) {
						const seq = rowID2SonSeq[fisSayac] = (rowID2SonSeq[fisSayac] || 0) + 1;
						const hv = {
							fissayac: fisSayac, seq: seq, shKod: rec.shKod || '', miktar: asFloat(rec.miktar) || 0, fiyat: asFloat(rec.asilFiyat) || 0,
							iskOran1: asFloat(rec.iskOran1) || 0, iskOran2: asFloat(rec.iskOran2) || 0, iskOran3: asFloat(rec.iskOran3) || 0,
							detAciklama: rec.ekAciklama || ''
						};
						if (!$.isEmptyObject(ekOzelliklerIDSahalar)) {
							const Prefix_EkOz = `ekOz_`;
							for (const i in ekOzelliklerIDSahalar) {
								const idSaha = ekOzelliklerIDSahalar[i];
								const recAttr = idSaha.startsWith(Prefix_EkOz) ? idSaha.replace(Prefix_EkOz, 'ekoz') : idSaha;
								let value = rec[recAttr];			// !! recAttr lowerCase YAPMA !!
								hv[idSaha] = value || '';
							}
						}
						hvListe.push(hv);
					}
				}
				if (!$.isEmptyObject(hvListe)) {
					await dbMgr.insertOrReplaceTable({
						table: 'mst_SablonHar', mode: 'insertIgnore',
						hvListe: hvListe,
						parcaCallback: e => {
							if (e.index % subCount == 0)
								this.knobProgressStep();
						}
					});
				}
				if (!hasTx)
					await dbMgr.getTx();
				// }
			})();

			await this.merkezdenBilgiYukleDevam_satisKosullari(e)
		}

		async merkezdenBilgiYukleDevam_ekOzellikler(e) {
			e = e || {};
			const dbMgr = e.dbMgr || this.dbMgr_mf;
			const wsFetches = e.wsFetches || {};
			const {tip2EkOzellik} = this;
			let islemAdi, recs, subCount, hvListe;

			$.extend(wsFetches, {
				// _ozellik: {},
				_ozellik: this.wsOzellikListe(),
				model: this.wsModelListe(),
				renk: this.wsRenkListe(),
				desen: this.wsDesenListe()
			});

			const tip2EkOzellikRecs = e.tip2EkOzellikRecs = {};
			islemAdi = 'Ek Özellikler';
			try { recs = await this.fetchWSRecs({ source: wsFetches._ozellik, islemAdi: islemAdi, step: 1 }) }
			catch (ex) { recs = null }
			for (const rec of (recs || [])) {
				const {tip} = rec;
				const _recs = tip2EkOzellikRecs[tip] = tip2EkOzellikRecs[tip] || [];
				_recs.push(rec);
			}

			await this.ekOzellikler_tabloDuzenlemeleriYap_ilk(e);
			
			for (const tip in tip2EkOzellik) {
				const ekOzellik = tip2EkOzellik[tip];
				const {mbTable, mbKodSaha, mbAdiSaha, kodsuzmu, sadeceKodmu} = ekOzellik;
				
				const source = wsFetches[tip] || tip2EkOzellikRecs[tip];
				recs = source ? await this.fetchWSRecs({ source: source, islemAdi: islemAdi, step: 1 }) : null;
				if (!$.isEmptyObject(recs)) {
					subCount = asInteger(recs.length / 10);
					await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
					hvListe = [];
					for (const rec of recs) {
						const hv = {};
						if (!kodsuzmu)
							hv[mbKodSaha] = (rec[mbKodSaha] == null ? rec[mbKodSaha.toLowerCase()] : rec[mbKodSaha]);
						if (!sadeceKodmu)
							hv[mbAdiSaha] = (rec[mbAdiSaha] == null ? rec[mbAdiSaha.toLowerCase()] : rec[mbAdiSaha]);
						
						switch (tip) {
							case 'desen':
								$.extend(hv, {
									resimDosyaExt: rec.resimdosyaext || rec.resimDosyaExt || '',
									resimContentType: rec.resimcontenttype || rec.resimContentType || '',
									resimData: rec.resimdata || rec.resimData || ''
								});
								break
							case 'renk':
								$.extend(hv, {
									renk: rec.renk || '',
									renk2: rec.renk2 || ''
								});
								break
						}
						if (!$.isEmptyObject(hv))
							hvListe.push(hv)
					}
					await dbMgr.insertOrReplaceTable({
						table: mbTable, mode: 'insertIgnore',
						hvListe: hvListe,
						parcaCallback: e => {
							if (e.index % subCount == 0)
								this.knobProgressStep();
						}
					});
				}
			}
			await this.ekOzellikler_tabloDuzenlemeleriYap_son(e)
		}
		async ekOzellikler_tabloDuzenlemeleriYap(e) {
			e = e || {};
			await this.ekOzellikler_tabloDuzenlemeleriYap_ilk(e);
			await this.ekOzellikler_tabloDuzenlemeleriYap_son(e);
		}
		async ekOzellikler_tabloDuzenlemeleriYap_ilk(e) {
			e = e || {};
			const dbMgr = e.dbMgr || this.dbMgr_mf;
			const {tip2EkOzellik} = this;

			const hmrTables = ['data_PIFStok', 'mst_SonStok', 'mst_SablonHar', 'data_BekleyenSiparisler'];
			const mevcutSabitTipSet = asSet(['yer']);
			
			const tables = asSet(await dbMgr.tables());
			const hmrSahaListe = ['stokKod', 'yerKod', 'rafKod'];
			const hmrSahaSet = asSet(hmrSahaListe);
			for (const tip in tip2EkOzellik) {
				const ekOzellik = tip2EkOzellik[tip];
				const {ozellikTip} = ekOzellik.class;
				const kami = ozellikTip == 'ka';
				const {tipAdi, idSaha} = ekOzellik;
				const {mbTable, mbKodSaha, mbAdiSaha, kodsuzmu, sadeceKodmu} = ekOzellik;

				if (!hmrSahaSet[idSaha]) {
					hmrSahaSet[idSaha] = true;
					hmrSahaListe.push(idSaha);
				}
				
				const queries = [];
				if (kami && mbTable && !tables[mbTable]) {
					let sahaEklendimi = false;
					let query = `CREATE TABLE IF NOT EXISTS ${mbTable} (`;
					if (!kodsuzmu) {
						query += `${mbKodSaha} TEXT NOT NULL PRIMARY KEY`;
						sahaEklendimi = true;
					}
					if (!sadeceKodmu) {
						if (sahaEklendimi)
							query += ', ';
						query += `${mbAdiSaha} TEXT NOT NULL `+ (kodsuzmu ? `PRIMARY KEY` : `DEFAULT ''`);
						sahaEklendimi = true;
					}
					query += ')';
					queries.push(query);
				}

				if (!mevcutSabitTipSet[tip]) {
					for (const hmrTable of hmrTables) {
						switch (hmrTable) {
							case 'data_BekleyenSiparisler':
								if (tip == 'yer' || tip == 'raf' || tip == 'refRaf' || tip == 'lotNo')
									continue;
								break;
							case 'mst_SonStok':
							case 'mst_SablonHar':
								if (tip == 'refRaf')
									continue;
								break;
						}
						queries.push(`ALTER TABLE ${hmrTable} ADD ${idSaha} NOT NULL DEFAULT ''`);
					}
				}

				if (!$.isEmptyObject(queries)) {
					await this.knobProgressSetLabel(`Veritabanı yapısı düzenleniyor...`);
					for (const query of queries) {
						try { await dbMgr.executeSql({ query: query }) }
						catch (ex) { console.info('-ignorable-', 'auto db update', ex, { query: query } ) }
						this.knobProgressStep(2);
					}
				}
			}
		}
		async ekOzellikler_tabloDuzenlemeleriYap_son(e) {
			e = e || {};
			const dbMgr = e.dbMgr || this.dbMgr_mf;
			const {tip2EkOzellik} = this;

			const mevcutSabitTipSet = asSet(['yer']);
			const tables = asSet(await dbMgr.tables());
			const hmrSahaListe = ['stokKod', 'yerKod', 'rafKod'];
			const hmrSahaSet = asSet(hmrSahaListe);
			for (const tip in tip2EkOzellik) {
				if (tip == 'refRaf')
					continue
				const ekOzellik = tip2EkOzellik[tip];
				const {ozellikTip} = ekOzellik.class;
				const kami = ozellikTip == 'ka';
				const {tipAdi, idSaha} = ekOzellik;
				const {mbTable, mbKodSaha, mbAdiSaha, kodsuzmu, sadeceKodmu} = ekOzellik;
				if (!hmrSahaSet[idSaha]) {
					hmrSahaSet[idSaha] = true;
					hmrSahaListe.push(idSaha)
				}
			}
			const queries = [];
			if (!$.isEmptyObject(hmrSahaListe)) {
				const tables = ['mst_SonStok' /*, 'data_BekleyenSiparisler'*/];
				for (const table of tables) {
					const idxName = `idx${table}2Asil`;
					queries.push(`DROP INDEX IF EXISTS ${idxName}`);
					queries.push(`CREATE UNIQUE INDEX IF NOT EXISTS ${idxName} ON ${table} (${hmrSahaListe.join(', ')})`)
				}
			}
			if (!$.isEmptyObject(queries)) {
				await this.knobProgressSetLabel(`Veritabanı yapısı düzenleniyor...`);
				for (const query of queries) {
					try { await dbMgr.executeSql({ query: query }) }
					catch (ex) { console.warn('-ignorable-', 'auto db update (global)', ex, query) }
					this.knobProgressStep(2)
				}
			}
		}

		async merkezdenBilgiYukleDevam_satisKosullari(e) {
			const {dbMgr, wsFetches} = e;
			const {tip2EkOzellik, iskSayi, kamSayi, kadIskSayi} = this;
			
			let islemAdi = 'Satış Koşulları';
			// wsFetches. ...  = this.ws ... Liste();
			let kosulYapilari = await this.fetchWSRecs({ source: await wsFetches.satisKosullari, islemAdi: islemAdi, step: 18 });
			if (!kosulYapilari)
				return false;
			delete kosulYapilari.isError;
			
			let subCount = 0;
			for (const liste of Object.values(kosulYapilari))
				subCount += liste.length
			subCount = subCount / 10;
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			
			let hvListe = [];
			const mustKod2HVListe = {}, detayTip2Kod2HVListe = {};
			for (const kosulTip in kosulYapilari) {
				const kosulListe = kosulYapilari[kosulTip];
				for (const kosul of kosulListe) {
					const kapsamSecimler = kosul.kapsamSecimler || {};
					let kosulKod = kosul.kod || '';
					let ozelMusteriListesiVarmi = asBool(kosul.ozelMusteriListesiVarmi);
					
					let hv = {
						kosulTip: kosulTip, kod: kosulKod,
						aciklama: kosul.adi || kosul.aciklama || '',
						vioID: kosul.id || 0, isaretDurumu: kosul.isaretDurumu || '',
						ozelMusteriListesiVarmi: bool2Int(ozelMusteriListesiVarmi),
						iskontoYapilmazmi: bool2Int(kosul.iskontoYapilmazmi),
						promosyonYapilmazmi: bool2Int(kosul.promosyonYapilmazmi)
					};
					
					const convertedValue = e => {
						let value = (typeof e == 'object' ? e.value : e);
						return e.converter
								? e.converter.call(this, value, e)
								: value
					}
					const bsEkle = e => {
						hv[`${e.rowAttr}Basi`] = convertedValue({ converter: e.converter, value: (kapsamSecimler[e.ioAttr] || {}).basi }) || '';
						hv[`${e.rowAttr}Sonu`] = convertedValue({ converter: e.converter, value: (kapsamSecimler[e.ioAttr] || {}).sonu }) || ''
					};
					bsEkle({ rowAttr: 'tarih', ioAttr: 'tarih', converter: value => value ? asReverseDateString(value) : value });
					bsEkle({ rowAttr: 'cari', ioAttr: 'cari' });
					bsEkle({ rowAttr: 'cariTip', ioAttr: 'tip' });
					bsEkle({ rowAttr: 'cariBolge', ioAttr: 'bolge' });
					bsEkle({ rowAttr: 'cariKosulGrup', ioAttr: 'cariKosulGrup' });
					bsEkle({ rowAttr: 'plasiyer', ioAttr: 'plasiyer' });
					bsEkle({ rowAttr: 'plasiyerTip', ioAttr: 'plTip' });
					bsEkle({ rowAttr: 'plasiyerBolge', ioAttr: 'plBolge' });
					hvListe.push(hv);

					let key = 'Musteri';
					for (const rec of (kosul.kapsamMusteriler || [])) {
						let kod = rec.must;
						if (kod) {
							const _hvListe = mustKod2HVListe[kod] = mustKod2HVListe[kod] || [];
							_hvListe.push({ kosulTip: kosulTip, kosulKod: kosulKod, kod: kod })
						}
					}

					key = 'Stok';
					let detayKod2HVListe = detayTip2Kod2HVListe[key] = detayTip2Kod2HVListe[key] || {};
					for (const rec of (kosul.kapsamStoklar || [])) {
						let kod = rec.stokkod;
						if (kod) {
							const hv = {
								kosulTip: kosulTip, kosulKod: kosulKod, kod: kod, markaKod: rec.smarkakod || '',
								fiyatMiktarTipi: rec.fiyatmiktartipi || '', kotaMiktar: asFloat(rec.kotamiktar) || 0,
								rafFiyati: asFloat(rec.raffiyati) || 0, mfPay: asInteger(rec.mfpay) || 0, mfBaz: asInteger(rec.mfbaz),
								ozelFiyat: asFloat(rec.ozelfiyat) || 0, ozelDvFiyat: asFloat(rec.ozeldvfiyat) || 0,
								orjFiyat: asFloat(rec.orjfiyat) || 0, orjDvFiyat: asFloat(rec.orjdvfiyat) || 0,
								enDusukFiyat: asFloat(rec.endusukfiyat) || 0,
								iskSinir: asFloat(rec.isksinir) || 0
							};
							for (let i = 1; i <= iskSayi; i++) {
								hv[`iskOran${i}`] = asFloat(rec[`iskoran${i}`]) || 0;
								hv[`kamOran${i}`] = asFloat(rec[`kamoran${i}`]) || 0
							}
							for (let i = 1; i <= kadIskSayi; i++) {
								hv[`kadHMiktar${i}`] = asFloat(rec[`miktardanitibaren${i}`]) || 0;
								hv[`kadIskOran${i}`] = asFloat(rec[`kademeiskoran${i}`]) || 0
							}
							const _hvListe = detayKod2HVListe[kod] = detayKod2HVListe[kod] || [];
							_hvListe.push(hv)
						}
					}

					key = 'StokGrup';
					detayKod2HVListe = detayTip2Kod2HVListe[key] = detayTip2Kod2HVListe[key] || {};
					for (const rec of (kosul.kapsamStokGruplar || [])) {
						let kod = rec.grupkod;
						if (kod) {
							const hv = {
								kosulTip: kosulTip, kosulKod: kosulKod, kod: kod, markaKod: rec.smarkakod || '', kotaMiktar: asFloat(rec.kotamiktar) || 0,
								rafFiyati: asFloat(rec.raffiyati) || 0, mfPay: asInteger(rec.mfpay) || 0, mfBaz: asInteger(rec.mfbaz),
								ozelFiyat: asFloat(rec.ozelfiyat) || 0, ozelDvFiyat: asFloat(rec.ozeldvfiyat) || 0,
								orjFiyat: asFloat(rec.orjfiyat) || 0, orjDvFiyat: asFloat(rec.orjdvfiyat) || 0,
								iskSinir: asFloat(rec.isksinir) || 0
							};
							for (let i = 1; i <= iskSayi; i++) {
								hv[`iskOran${i}`] = asFloat(rec[`iskoran${i}`]) || 0;
								hv[`kamOran${i}`] = asFloat(rec[`kamoran${i}`]) || 0
							}
							for (let i = 1; i <= kadIskSayi; i++) {
								hv[`kadHMiktar${i}`] = asFloat(rec[`miktardanitibaren${i}`]) || 0;
								hv[`kadIskOran${i}`] = asFloat(rec[`kademeiskoran${i}`]) || 0
							}
							const _hvListe = detayKod2HVListe[kod] = detayKod2HVListe[kod] || [];
							_hvListe.push(hv)
						}
					}
				}
			}

			await dbMgr.insertOrReplaceTable({
				table: 'mst_KosulOrtak', mode: 'insertIgnore', hvListe: hvListe,
				parcaCallback: e => {
					if (e.index % subCount == 0)
						this.knobProgressStep();
				}
			});
			if (!$.isEmptyObject(mustKod2HVListe)){
				hvListe = [];
				Object.values(mustKod2HVListe).forEach(_hvListe =>
					hvListe.push(..._hvListe));
				await this.knobProgressSetLabel(`${islemAdi} kaydediliyor (Müşteriler)...`);
				await dbMgr.insertOrReplaceTable({
					table: 'mst_KosulMusteriler', mode: 'insertIgnore',
					hvListe: hvListe,
					parcaCallback: e => {
						if (e.index % subCount == 0)
							this.knobProgressStep();
					}
				});
			}
			hvListe = [];
			$.each(detayTip2Kod2HVListe.Stok, (kod, _hvListe) =>
				hvListe.push(..._hvListe));
			if (!$.isEmptyObject(hvListe)){
				await this.knobProgressSetLabel(`${islemAdi} kaydediliyor (Ürünler)...`);
				await dbMgr.insertOrReplaceTable({
					table: 'mst_KosulStoklar', mode: 'insertIgnore',
					hvListe: hvListe,
					parcaCallback: e => {
						if (e.index % subCount == 0)
							this.knobProgressStep();
					}
				});
			}
			hvListe = [];
			$.each(detayTip2Kod2HVListe.StokGrup, (kod, _hvListe) =>
				hvListe.push(..._hvListe));
			if (!$.isEmptyObject(hvListe)){
				await this.knobProgressSetLabel(`${islemAdi} kaydediliyor (Ürün Gruplar)...`);
				await dbMgr.insertOrReplaceTable({
					table: 'mst_KosulStokGruplar', mode: 'insertIgnore',
					hvListe: hvListe,
					parcaCallback: e => {
						if (e.index % subCount == 0)
							this.knobProgressStep();
					}
				});
			}

			/* kosulYapilari: {
				...{FY, KM, MF, SB}: {													(kosul tip)
					id: integer, kod: string: adi: string,
					ozelMusteriListesiVarmi: bool,
				[[tip=FY]]
					isaretDurumu: string, iskontoYapilmazmi: bool, promosyonYapilmazmi: bool,
				[[______]]
					kapsamSecimler: {
						tarih:					{ basi: string, sonu: string }
						detayliFlag:			{ deger: bool },
						ozelSubeGecerliFlag:	{ deger: bool },
						ozelSubeSecim:			{ default: string, liste: array (kod liste) },
						tip:					{ basi: string, sonu: string },
						bolge:					{ basi: string, sonu: string },
						cari:					{ basi: string, sonu: string },
						cariKosulGrup:			{ basi: string, sonu: string },
						plTip:					{ basi: string, sonu: string },
						plBolge:				{ basi: string, sonu: string },
						plasiyer:				{ basi: string, sonu: string }
					},
					kapsamMusteriler: [],		(opt. - {{kosul.ozelMusteriListesiVarmi}} için listeye bakılır aksinde {{kapsamSecimler.cari[basi -> sonu]}})
					kapsamStoklar: [													(opt.)
						[ { ...kosulDetayRec[kosulTip].Stok } x N ]
					],
					kapsamStokGruplar: [												(opt.)
						[ { ...kosulDetayRec[kosulTip].Grup } x N ]
					]
				}
			*/
			/*
				kosulDetayRec: {
					FY: {
						Stok: {
							stokkod: string, stokadi: string, smarkakod: string, smarkaadi: string,
							ozelfiyat: decimal, ozeldvfiyat: decimal,
							orjfiyat: decimal, orjdvfiyat: decimal,
							fiyatmiktartipi: int	(satfiyatmiktartipi)
						},
						Grup: {
							grupkod: string, grupadi: string smarkakod: string, smarkaadi: string,
							ozelfiyat: decimal, ozeldvfiyat: decimal
						}
					},
					KM: {
						Stok: {
							stokkod: string, stokadi: string, smarkakod: string, smarkaadi: string,
							kamoran1: decimal, kamoran2: decimal, kamoran3: decimal, ... , kamoranN: decimal,
							kotamiktar: decimal (opt.), raffiyati: decimal (opt.)
						},
						Grup: {
							grupkod: string, grupadi: string smarkakod: string, smarkaadi: string,
							iskoran1: decimal, iskoran2: decimal, iskoran3: decimal, ... , iskoranN: decimal
						}
					},
					MF: {
						Stok: { stokkod: string, stokadi: string, mfpay: decimal, mfbaz: decimal },
						Grup: { grupkod: string, grupadi: string, mfpay: decimal, mfbaz: decimal }
					}
					SB: {
						Stok: {
							stokkod: string, stokadi: string, smarkakod: string, smarkaadi: string,
							iskoran1: decimal, iskoran2: decimal, iskoran3: decimal, ... , iskoranN: decimal
						},
						Grup: {
							grupkod: string, grupadi: string smarkakod: string, smarkaadi: string,
							iskoran1: decimal, iskoran2: decimal, iskoran3: decimal, ... , iskoranN: decimal
						}
					}
				}
			*/
		}

		async merkezdenBilgiYukleDevam_promosyon(e) {
			const {dbMgr, wsFetches} = e;
			const islemAdi = 'Promosyon Listesi';
			// wsFetches. ...  = this.ws ... Liste();
			const recsYapi = await this.fetchWSRecs({ source: await wsFetches.promosyon, islemAdi: islemAdi, step: 10 });
			if (!recsYapi)
				return false;
			delete recsYapi.isError;

			let subCount = 0;
			Object.values(recsYapi).forEach(liste =>
				subCount += liste.length);
			subCount = subCount / 10;
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			
			const convertedValue = e => {
				let value = (typeof e == 'object' ? e.value : e);
				return e.converter
						? e.converter.call(this, value, e)
						: value
			}
			const bsEkle = e => {
				e.hv[`${e.rowAttr}Basi`] = convertedValue({ converter: e.converter, value: e.rec[`${e.ioAttr}b`] }) || '';
				e.hv[`${e.rowAttr}Sonu`] = convertedValue({ converter: e.converter, value: e.rec[`${e.ioAttr}s`] }) || '';
			};
			const hvListeYapi = { baslik: [], musteri: [], kademe: [] };
			let recs = recsYapi.Baslik; if (!$.isEmptyObject(recs)) {
				for (const i in recs) {
					const rec = recs[i]; let hv = ({
						proTip: rec.tipkod, kod: rec.kod, vioID: asInteger(rec.kaysayac) || null, aciklama: rec.aciklama || '', oncelik: rec.oncelik || 0,
						veriTipi: rec.veritipi || '', vGrupKod: rec.vgrupkod || '', vStokKod: rec.vstokkod || '', vMiktar: asFloat(rec.vmiktar) || 0,
						vBrm: rec.vbrm || '', vCiro: asFloat(rec.vciro) || 0, vCiroKdvlimi: bool2Int(rec.vcirokdvlimi),
						hedefTipi: rec.hedeftipi || '', hGrupKod: rec.hgrupkod || '', hStokKod: rec.hstokkod || '', hMiktar: asFloat(rec.hmiktar) || 0,
						hBrm: rec.hbrm || '', hDipIsk: asFloat(rec.hdipisk) || 0, hMFVarsaSatirIskKapat: bool2Int(rec.hmfvarsasatiriskkapat),
						detayliMusterimi: bool2Int(rec.detaylimust), kademelimi: bool2Int(rec.kademelimi), hIskOran: rec.hproiskoran || 0
					});
					const {maxSayi} = CETPromosyon_OGRP1; for (let j = 1; j <= maxSayi; j++) {
						hv[`voGrup${j}Kod`] = rec[`vogrup${j}kod`] || ''; hv[`voGrup${j}Miktar`] = rec[`vogrup${j}miktar`] || 0;
						if (j > 1) { hv[`voGrup${j}Varmi`] = bool2Int(rec[`vogrup${j}varmi`] ?? rec[`bvogrup${j}varmi`]) }
					}
					bsEkle({ hv, rec, rowAttr: 'tarih', ioAttr: 'tarih', converter: value => value ? asReverseDateString(value) : value });
					bsEkle({ hv, rec, rowAttr: 'cariTip', ioAttr: 'ctip' });
					bsEkle({ hv, rec, rowAttr: 'cariBolge', ioAttr: 'bolge' });
					bsEkle({ hv, rec, rowAttr: 'cariKosulGrup', ioAttr: 'ckgrup' });
					bsEkle({ hv, rec, rowAttr: 'cari', ioAttr: 'must' });
					bsEkle({ hv, rec, rowAttr: 'plasiyer', ioAttr: 'plas' });
					hvListeYapi.baslik.push(hv);
				}
				await dbMgr.insertOrReplaceTable({
					table: 'mst_Promosyon', mode: 'insertIgnore', hvListe: hvListeYapi.baslik,
					parcaCallback: e => { if (e.index % subCount == 0) { this.knobProgressStep() } }
				});
			}
			recs = recsYapi.Musteri;
			if (!$.isEmptyObject(recs)) {
				await this.knobProgressSetLabel(`${islemAdi} kaydediliyor (Müşteriler)...`);
				recs.forEach(rec => {
					let kod = rec.kod;
					if (kod) {
						hvListeYapi.musteri.push({
							proTip: rec.protip, proKod: rec.prokod, kod: kod
						});
					}
				});
				await dbMgr.insertOrReplaceTable({
					table: 'mst_PromosyonMusteri', mode: 'insertIgnore',
					hvListe: hvListeYapi.musteri,
					parcaCallback: e => {
						if (e.index % subCount == 0)
							this.knobProgressStep();
					}
				});
			}

			recs = recsYapi.Kademe;
			if (!$.isEmptyObject(recs)) {
				await this.knobProgressSetLabel(`${islemAdi} kaydediliyor (Müşteriler)...`);
				let seq = 0;
				for (const rec of recs) {
					seq++;
					let eKadar = asFloat(rec.ekadar) || 0;
					if (eKadar) {
						hvListeYapi.kademe.push({
							proTip: rec.protip, proKod: rec.prokod, seq: (asInteger(rec.seq) || seq),
							eKadar: eKadar, mfAdet: asFloat(rec.mfadet) || 0
						})
					}
				}
				await dbMgr.insertOrReplaceTable({
					table: 'mst_PromosyonKademe', mode: 'insertIgnore',
					hvListe: hvListeYapi.kademe,
					parcaCallback: e => {
						if (e.index % subCount == 0)
							this.knobProgressStep();
					}
				})
			}
		}
		async merkezdenBilgiYukleDevam_bekleyenSayimFisler(e) { return null }
		async merkezdenBilgiYukleDevam_bekleyenUgramaFisler(e) { return null }
		async merkezdenBilgiYukleSonrasi(e) {
			e = e || {}; const {sessionInfo} = sky.config;
			if (!sky.config.test && (sessionInfo && sessionInfo.hasSessionOrUser)) {
				await this.knobProgressSetLabel('Oturum Bilgileri kaydediliyor...');
				await this.extensions.login.dbSaveLogin({ clear: true });
				await this.knobProgressStep(1);
			}
			await this.knobProgressSetLabel('Son işlemler...'); await this.merkezdenBilgiYukleSonrasiDevam(e); await this.knobProgressStep(8);
			await this.ortakReset(e); this._bilgiYukleYapiliyorFlag = this.ozelKonfYuklendimi = false;
			await this.onbellekOlustur(e); await this.knobProgressStep(3);
			const {loadScriptsResultsPromise} = this; if (loadScriptsResultsPromise?.then) {
				loadScriptsResultsPromise.then(async result => {
					const {initCallbacks} = this;
					if (!$.isEmptyObject(initCallbacks)) {
						if (!$.isEmptyObject(this.promisesWait)) { try { await Promise.all(this.promisesWait) } finally { delete this.promisesWait } }
						for (let i in initCallbacks) {
							const _result = await initCallbacks[i];
							try { if (_result && $.isFunction(_result.run)) { await _result.run(e) } } catch (ex) { defFailBlock(ex) }
						}
						this.afterRunVeMerkezdenBilgiYukleSonrasiOrtak(e)
					}
				})
			}
			else { this.afterRunVeMerkezdenBilgiYukleSonrasiOrtak(e) }
			
			setTimeout(() => {
				this.aktarimProgressCompleted({
					defer: true,
					delaySecs: 30,
					text: `<span style="font-weight: bold; color: forestgreen;">Merkezden Veri Alımı tamamlandı</span>`
				})
			}, 2000)
		}

		async merkezdenBilgiYukleSonrasiDevam(e) {
			e = e || {};
			// bakiye, risk, sonStok ... hesaplaması

			const {param, kmTakibiYapilirmi} = this;
			let paramDegistimi = false;
			if (param.kapandimi) {
				param.kapandimi = false;
				paramDegistimi = true;
			}
			if (kmTakibiYapilirmi) {
				const sonKM = param.sonKM || 0;
				const ilkKM = param.ilkKM || 0;
				if (sonKM < ilkKM) {
					param.sonKM = param.ilkKM;
					paramDegistimi = true;
				}
				if (ilkKM != sonKM) {
					param.ilkKM = param.sonKM;
					paramDegistimi = true;
				}
			}
			if (paramDegistimi)
				await param.kaydet();

			await this.merkezdenBilgiYukleDevam_fisKaydetSonrasiIslemler(e);

			if (this.class.appSicakVeyaSogukmu)
				displayMessage(`BİLGİLENDİRME: <b>Açılış yapıldı</b>`, this.appText);
		}

		async merkezdenBilgiYukleDevam_fisKaydetSonrasiIslemler(e) {
			e = e || {};
			const uni = new MQUnionAll();
			const stm = new MQStm({ sent: uni });
			this.fisListe_stmSentDuzenle({ stm: stm, uni: uni, musteriDurumu: false });
			
			const haricTabloSet = asSet(['data_UgramaFis']);
			uni.liste = uni.liste.filter(sent =>
				!haricTabloSet[sent.from.liste[0].deger]
			);
			stm.sentDo(sent => {
				sent.where.addAll([
					`fis.gonderildi = ''`,
					`fis.rapor = ''`,
					`fis.gecici = ''`,
					`fis.degismedi = ''`
				]);
			});
			
			const dbMgr = this.dbMgrs.rom_data;
			const recs = await dbMgr.executeSqlReturnRowsBasic({ query: stm });
			if (!$.isEmptyObject(recs)) {
				await this.knobProgressSetLabel('Son Stok/Bakiye-Risk/Bek.Sipariş Düzenlemesi...');
				for (let i = 0; i < recs.length; i++) {
					const rec = recs[i];
					const fis = await CETFis.fromRec({ rec: rec });
					if (fis) {
						if (fis.kaydetSonrasiIslemler)
							await fis.kaydetSonrasiIslemler({ islem: 'yeni' });
						await this.knobProgressStep(1);
					}
				}
			}
		}
		async merkezeBilgiGonder(e) {
			e = $.extend({}, e); this.prefetchAbortedFlag = true;
			await this.knobProgressShow(); await this.knobProgressReset();
			let result; try {
				result = await this.merkezeBilgiGonderDevam(e);
				setTimeout(() => {
					this.aktarimProgressCompleted({ defer: true, delaySecs: 15, text: `<span style="font-weight: bold; color: forestgreen;">Merkeze Bilgi Gönderimi tamamlandı</span>` })
				}, 1000);
			}
			catch (ex) {
				hideProgress(); ((window.savedProcs || {}).hideProgress || hideProgress)();
				if (!ex || ex.statusText) { displayServerResponse(ex) }
				else { displayMessage(ex.message || ex.errorText || ex.message || (ex.responseJSON || {}).errorText || '', `${ex.isError ? '@' : '!'} Merkeze Bilgi Gönderimi ${ex.isError ? '@' : '!'}`) }
				throw ex
			}
			return result
		}
		async merkezeBilgiGonderDevam(e) {
			let {promise_merkezeBilgiGonder} = this; if (promise_merkezeBilgiGonder) { try { await promise_merkezeBilgiGonder } catch (ex) { } }
			promise_merkezeBilgiGonder = this.promise_merkezeBilgiGonder = new $.Deferred(p => {
				this.merkezeBilgiGonderDevam2(e)
					.then(result => p.resolve(result)).catch(err => p.reject(err))
					.finally(() => this.promise_merkezeBilgiGonder = null);
			});
			return await promise_merkezeBilgiGonder
		}
		async merkezeBilgiGonderDevam2(e) {
			e = e || {}; const dbMgr = e.dbMgr || this.dbMgr_mf, {silent, otoGondermi, timer} = e;
			let {bilgiGonderTableYapilari} = e; if (!bilgiGonderTableYapilari) { bilgiGonderTableYapilari = this.bilgiGonderTableYapilari }
			let totalRecords = 0, kontroleEsasToplamSayi = 0; const {param} = this; let _param = e.param = e.param = {};
			if (this.kmTakibiYapilirmi /*param.kapandimi*/) { _param.kapandimi = true }
			if (param.ilkKM) { _param.ilkKM = param.ilkKM } if (param.sonKM) { _param.sonKM = param.sonKM }
			if (param.mustKod2Bilgi) {
				for (const mustKod in param.mustKod2Bilgi) {
					const bilgi = param.mustKod2Bilgi[mustKod];
					if (!$.isEmptyObject(bilgi)) { const _mustKod2Bilgi = _param.mustKod2Bilgi = _param.mustKod2Bilgi || {}; _mustKod2Bilgi[mustKod] = bilgi; }
				}
			}
			let paramGonderilsinmi = false;
			if (_param) {
				if (!paramGonderilsinmi && (param.ilkKM || param.sonKM || param.kapandimi)) { paramGonderilsinmi = true }
				if (!paramGonderilsinmi && _param.mustKod2Bilgi) {
					for (const mustKod in param.mustKod2Bilgi) { const bilgi = param.mustKod2Bilgi[mustKod]; if (!$.isEmptyObject(bilgi)) { paramGonderilsinmi = true; break } } }
			}
			if (!paramGonderilsinmi && $.isEmptyObject(bilgiGonderTableYapilari)) {
				if (!silent) { displayMessage('Gönderilecek belge bulunamadı!', this.appText); }
				await this.merkezeBilgiGonderSonrasi(e); return false
			}
			if (paramGonderilsinmi) { totalRecords++ }
			// await this.knobProgressSetLabel(`Belgeler taranıyor...`);
			const fetchBlock = async e => {
				let rs = await dbMgr.executeSql({ query: e.query });
				for (let i = 0; i < rs.rows.length; i++) {
					const table = e.table || rec._table, rec = rs.rows[i];
					const recs = table2Recs[table] = table2Recs[table] || []; recs.push(rec);
					totalRecords++; e.toplamSayi = recs.length
				}
				if (!silent) { await this.knobProgressStep(3) }
			};
			const table2Recs = {}; for (const tableYapi of bilgiGonderTableYapilari) {
				const {fisIDListe} = tableYapi, baslikTable = tableYapi.baslik;
				let sent = new MQSent({
					from: baslikTable, where: [`gonderildi = ''`, `gecici = ''`, `rapor = ''`, `degismedi = ''`],
					sahalar: [`'${baslikTable}' _table`, `'fis' _tip`, `rowid`, `*`]
				});
				if (timer) {
					if (baslikTable == 'data_PIFFis') {
						sent.where.add(
							`NOT ` +
							new MQOrClause([
								new MQSubWhereClause({ parantezli: true, birlestirDict: CETSayimFis.varsayilanKeyHostVars() }),
								new MQSubWhereClause({ parantezli: true, birlestirDict: CETBekleyenSayimFis.varsayilanKeyHostVars() }),
								new MQSubWhereClause({ parantezli: true, birlestirDict: CETBekleyenUgramaFis.varsayilanKeyHostVars() })
							]).toString()
						)
					}
				}
				if (fisIDListe) { sent.where.inDizi(fisIDListe, `rowid`) }
				const _e = { table: baslikTable, query: new MQStm({ sent }) }; await fetchBlock(_e); kontroleEsasToplamSayi += (_e.toplamSayi || 0);
				const digerTablolar = tableYapi.diger;
				if (!$.isEmptyObject(digerTablolar)) {
					for (const table of digerTablolar) {
						let sent = new MQSent({
							from: `${table} har`,
							fromIliskiler: [ { from: `${baslikTable} fis`, iliski: `har.fissayac = fis.rowid` } ],
							where: [`fis.gonderildi = ''`, `fis.gecici = ''`, `fis.rapor = ''`, `fis.degismedi = ''`],
							sahalar: [`'${baslikTable}' _parentTable`, `'${table}' _table`, `'diger' _tip`, `har.rowid`, `har.*`]
						});
						if (fisIDListe) { sent.where.inDizi(fisIDListe, `har.fissayac`) }
						await fetchBlock({ table: table, query: new MQStm({ sent }) })
					}
				}
				const tanimTablolar = tableYapi.tanim;
				if (!$.isEmptyObject(tanimTablolar)) {
					for (const table of tanimTablolar) {
						let sent = new MQSent({ from: table, where: [`gonderildi = ''`], sahalar: [`'${table}' _table`, `'tanim' _tip`, `rowid`, `*`] });
						await fetchBlock({ table: table, query: new MQStm({ sent }) })
					}
				}
			}
			if (!totalRecords) { throw { isError: false, rc: 'noRecords', errorText: `Gönderilmeyi bekleyen hiç belge bulunamadı` } }
			await this.knobProgressSetLabel(`Belgeler gönderiliyor...`);
			let result = await this.wsCETSaveTables({ silent: true, data: { param: _param, table2Recs } });
			if (!result) { result = { isError: true, rc: 'unknownError', errorText: '' } } if (result.isError) { throw result }
			result = result || {}; $.extend(e, { toplamSayi: kontroleEsasToplamSayi, hataSayi: 0 });
			const hataliTable2FisIDListe = result.hataliTable2FisIDListe || {};
			for (const fisIDListe of Object.values(hataliTable2FisIDListe)) { if (fisIDListe && fisIDListe.length) { e.hataSayi += fisIDListe.length } }
			await this.knobProgressStep(50);
			let mesaj = result.message || result.mesaj;
			if (mesaj) {
				if (silent) { await this.knobProgressHideWithReset({ update: { labelTemplate: 'error', label: `<u>Sunucu Yanıtı</u>: ${mesaj}` }, delayMS: 8000 }) }
				else { await displayMessage(mesaj, 'Sunucu Yanıtı') }
			}
			$.extend(e, { result, mesaj }); await this.merkezeBilgiGonderSonrasi(e);
			return result
		}
		async merkezeBilgiGonderSonrasi(e) {
			e = e || {}; const dbMgr = e.dbMgr || this.dbMgr_mf, bilgiGonderTableYapilari = e.bilgiGonderTableYapilari || this.bilgiGonderTableYapilari || [];
			if ($.isEmptyObject(e.param) && $.isEmptyObject(bilgiGonderTableYapilari)) { return }
			const minProgVersion = '4.14.5.7.1'.split('.').map(x => asInteger(x));
			let {progVersion} = (await this.wsGetSessionInfo() || {}); if (progVersion) { progVersion = progVersion.split('.').map(x => asInteger(x)) }
			const uygunSurummu = progVersion >= minProgVersion, {silent, otoGondermi, timer} = e, result = e.result || {};
			const basariliTable2FisIDListe = uygunSurummu ? result.basariliTable2FisIDListe : null;
			const hataliTable2FisIDListe = uygunSurummu ? null : result.hataliTable2FisIDListe;
			const {toplamSayi} = e; let basariliSayi;
			for (const tableYapi of bilgiGonderTableYapilari) {
				let table = tableYapi.baslik;
				if (table) {
					const {fisIDListe} = tableYapi; let basariliFisIDListe = basariliTable2FisIDListe ? asSet(basariliTable2FisIDListe[table]) : null;
					basariliFisIDListe = basariliFisIDListe ? Object.keys(basariliFisIDListe).map(x => asInteger(x)) : null;
					let hataliFisIDListe = hataliTable2FisIDListe ? asSet(hataliTable2FisIDListe[table]) : null;
					hataliFisIDListe = hataliFisIDListe ? Object.keys(hataliFisIDListe).map(x => asInteger(x)) : null;
					let upd = new MQIliskiliUpdate({ from: table, where: [`gonderildi = ''`, `gecici = ''`, `rapor = ''`], set: `gonderildi = '*'` });
					if (!$.isEmptyObject(fisIDListe)) { upd.where.inDizi(fisIDListe, 'rowid') }
					if (basariliFisIDListe) {
						if (!$.isEmptyObject(basariliFisIDListe)) {
							basariliSayi = (basariliSayi || 0) + basariliFisIDListe.length;
							upd.where.inDizi(basariliFisIDListe, 'rowid');
							await dbMgr.executeSql({ query: upd })
						}
					}
					else {
						if (hataliFisIDListe) {
							if (!$.isEmptyObject(hataliFisIDListe)) { upd.where.notInDizi(hataliFisIDListe, 'rowid') }
							await dbMgr.executeSql({ query: upd })
						}
					}
				}
				table = tableYapi.tanim;
				if (table) {
					let basariliFisIDListe = basariliTable2FisIDListe ? asSet(basariliTable2FisIDListe[table]) : null;
					basariliFisIDListe = basariliFisIDListe ? Object.keys(basariliFisIDListe) : null;
					if (basariliFisIDListe) {
						if (!$.isEmptyObject(basariliFisIDListe)) {
							let upd = new MQIliskiliUpdate({ from: table, where: [`gonderildi = ''`], set: `gonderildi = '*'` });
							upd.where.inDizi(basariliFisIDListe, 'kod'); await dbMgr.executeSql({ query: upd })
						}
					}
				}
			}
			const {param} = this;
			if (!(silent || otoGondermi || timer) && !e.hataSayi && this.kmTakibiYapilirmi && !e.bilgiGonderTableYapilari
						&& !param.kapandimi && (basariliSayi == null || basariliSayi >= toplamSayi)) {
				param.kapandimi = true; await param.kaydet();
				displayMessage(`UYARI: <b>Kapanış yapıldı!</b>`, this.appText)
			}
		}
		async afterRunVeMerkezdenBilgiYukleSonrasiOrtak(e) {
			e = e || {}; await this.kisitlamalariUygula();
			if (this.dogrudanFisListeyeGirilirmi && (!this.activePart || this.activePart == this)) { await this.fisListesiIstendi(e) }
			if (this.konumTakibiYapilirmi) { this.gpsTimer_start(e) } this.merkezeBilgiGonderTimer_start(e)
			const {dbMgrs} = this; for (const dbMgr of Object.values(dbMgrs)) { if (dbMgr.dbSave) { await dbMgr.dbSave() } }
		}
		async fetchWSRecs(e) {
			e = e || {}; let recs; await this.knobProgressSetLabel(`Merkezden ${e.islemAdi} alınıyor...`);
			try {
				this.indicatorPart.ajaxCallback({ state: true });
				recs = e.source ? await e.source : null; if ($.isFunction(recs)) { recs = await recs.call(this, e) }
				recs = e.recs = recs?.rows || recs || []
			}
			catch (ex) { const code = ex?.responseJSON?.rc ?? ex?.responseJSON?.code; if (code == 'islemHatali') { recs = e.recs = [] } else { throw ex } }
			await this.knobProgressStep(e.step); return recs
		}
		async tablolariOlusturIslemi(e) { await this.tablolariOlustur(e); await this.tabloEksikleriTamamla(e) }
		async loginOncesiKontrol(e) {
			await this.knobProgressSetLabel(`Ön Kontroller yapılıyor...`);
			let result = await this.vtYapisiUygunmu(e); if (!result) { return false }
			let {param} = this, degistimi = false, hasQSArgs = qs.hostname || qs.port;
			$.extend(qs, { hostname: qs.hostname || param.wsHostNameUyarlanmis, port: qs.port || param.wsPort }); qs._port = qs.port;
			await sky.config.load(); this.updateWSUrlBase();
			if (!hasQSArgs) { delete qs.hostname; delete qs.port }
			await this.knobProgressStep(5); if (!param.wsHostNameUyarlanmis) { return false }
			return result
		}
		async vtYapisiUygunmu(e) { e = e || {}; let dbMgr = this.dbMgrs.param; let result = await dbMgr.hasTables(['mst_Login']); return !!result }
		async paramYukle(e) { await this.knobProgressSetLabel(`Parametreler okunuyor...`); await this.param.yukle(); await this.paramYukleSonrasi(e); this.knobProgressStep(2) }
		paramYukleSonrasi(e) { }
		async paramKaydet(e) {
			await this.knobProgressSetLabel(`Parametreler kaydediliyor...`);
			const eskiParam = this.param || {}; let {param} = e; param.version = param.version || eskiParam.version || param.class.version;
			await param.kaydet({ parcaCallback: e => this.knobProgressStep(2) }); this.param = param;
			let degistimi = eskiParam.wsHostNameUyarlanmis && eskiParam.wsPort && !(eskiParam.wsHostNameUyarlanmis == param.wsHostNameUyarlanmis && eskiParam.wsPort == param.wsPort);
			const hasQSArgs = qs.hostname || qs.port; $.extend(qs, { hostname: qs.hostname || param.wsHostNameUyarlanmis, port: qs.port || param.wsPort });
			if (degistimi) {
				const {config} = sky, savedSessionInfo = config.sessionInfo; await config.load(); this.updateWSUrlBase();
				if (!hasQSArgs) { delete qs.hostname; delete qs.port }
				config.sessionInfo = savedSessionInfo; this.loginIstendiDevam(e)
			}
			setTimeout(() => this.aktarimProgressCompleted({ defer: true, delaySecs: 2, text: `Parametreler kaydedildi!` }), 100)
		}
		async getMatbuuFormYapilari(e) {
			let result = this._matbuuFormYapilari;
			if (!result) {
				result = new CETMatbuuFormYapilari(); if (!await result.yukle(e)) { result = null }
				this._matbuuFormYapilari = result
			}
			return result
		}
		rotaVeFisListeOncesiIslemler(e) {
			if (this._bilgiYukleYapiliyorFlag) {
				displayMessage('Merkezden Bilgi Yükleme işlemi henüz tamamlanmamış, bu adıma giriş yapılamaz', `@ ${this.appText} @`);
				throw { isError: true, rc: 'accessDenied' }
			}
			return new $.Deferred(async p => {
				await this.gerekirseKMGirisYap({ sonmu: false });
				setTimeout(async () => { await this.ilkIrsaliyeRaporuKontrol(e); setTimeout(() => p.resolve({ result: true }), 100) }, 100)
			})
		}
		async gerekirseKMGirisYap(e) {
			if (!this.kmTakibiYapilirmi || asBool(this.param[`${e.sonmu ? 'son' : 'ilk'}KMGirildimi`])) { return }
			await this.kmGirisIstendi(e)
		}
		async ilkIrsaliyeRaporuKontrol(e) {
			if (this.ilkIrsaliyeDokumuZorunlumu && !this.param.ilkIrsaliyeRaporuAlindimi) {
				const result = await new CETRapor_IlkIrsaliye().run(); if (!result || result.isError || !result.part) { return }
				return new Promise(resolve => {
					result.part.geriCallback = e => { resolve(e) };
					const message = `Bu adıma girmeden önce <b>İlk İrsaliye Raporu</b> alınmalıdır!`; displayMessage(message, this.appText)
				})
			}
		}
		aktarimProgressCompleted(e) {
			e = e || {}; e.delayMS = e.delaySecs ? e.delaySecs * 1000 : e.delayMS;
			if (!e.defer) { delete e.delayMS }
			return this.aktarimProgressKapat(e)
		}
		aktarimProgressKapat(e) {
			e = e || {}; this.knobProgressHideWithReset({
				delayMS: e.delayMS || 1000,
				update: { showLoading: false, progress: 100, label: `<span style="font-weight: bold; color: forestgreen;">${e.text || e.label || ''}</span>` }
			})
		}
		wsETParam(e) { return lastAjaxObj = $.get({ url: `${this.wsURLBase}etParam`, data: this.buildAjaxArgs(e) /*dataType: defaultOutput*/ }) }
		wsNumaratorListe(e) { return lastAjaxObj = $.get({ url: `${this.wsURLBase}numaratorListe`, data: this.buildAjaxArgs(e), /*dataType: defaultOutput*/ }) }
		wsETMatbuuTanimlar(e) { return lastAjaxObj = $.get({ url: `${this.wsURLBase}etMatbuuTanimlar`, data: this.buildAjaxArgs(e) /*dataType: defaultOutput*/ }) }
		wsSevkAdresListe(e) {
			return this.wsCallWithSkyWS({ url: `${this.wsURLBase}tahsilSekliListe`, data: this.buildAjaxArgs(e) }).catch(() =>
				lastAjaxObj = $.get({ url: `${this.wsURLBase}sevkAdresListe`, data: this.buildAjaxArgs(e), timeout: sky.config.ajaxTimeout /*dataType: defaultOutput*/ }))
		}
		wsNakliyeSekliListe(e) {
			return this.wsCallWithSkyWS({ url: `${this.wsURLBase}tahsilSekliListe`, data: this.buildAjaxArgs(e) }).catch(() =>
				lastAjaxObj = $.get({ url: `${this.wsURLBase}nakliyeSekliListe`, data: this.buildAjaxArgs(e), timeout: sky.config.ajaxTimeout /*dataType: defaultOutput*/ }))
		}
		wsTahsilSekliListe(e) {
			return this.wsCallWithSkyWS({ url: `${this.wsURLBase}tahsilSekliListe`, data: this.buildAjaxArgs(e) }).catch(() =>
				lastAjaxObj = $.get({ url: `${this.wsURLBase}tahsilSekliListe`, data: this.buildAjaxArgs(e) }))
		}
		wsUgramaSebepListe(e) {
			return this.wsCallWithSkyWS({
				url: `${this.wsURLBase}ugramaSebepListe`,
				data: this.buildAjaxArgs(e)
			}).catch(() =>
				lastAjaxObj = $.get({
					url: `${this.wsURLBase}ugramaSebepListe`,
					data: this.buildAjaxArgs(e)
				})
			)
		}
		wsFisSablonListe(e) {
			return this.wsCallWithSkyWS({
				url: `${this.wsURLBase}fisSablonListe`,
				data: this.buildAjaxArgs(e)
			}).catch(() =>
				lastAjaxObj = $.get({
					url: `${this.wsURLBase}fisSablonListe`,
					data: this.buildAjaxArgs(e)
					
				})
			)
		}
		wsSablonFisTipiListe(e) {
			return this.wsCallWithSkyWS({
				url: `${this.wsURLBase}sablonFisTipiListe`,
				data: this.buildAjaxArgs(e)
			}).catch(() =>
				lastAjaxObj = $.get({
					url: `${this.wsURLBase}sablonFisTipiListe`,
					data: this.buildAjaxArgs(e)
					
				})
			)
		}
		wsStokGrupListe(e) {
			return this.wsCallWithSkyWS({
				url: `${this.wsURLBase}stokGrupListe`,
				data: this.buildAjaxArgs(e)
			}).catch(() =>
				lastAjaxObj = $.get({
					url: `${this.wsURLBase}stokGrupListe`,
					data: this.buildAjaxArgs(e)
					
				})
			)
		}
		wsOzelKampanyaListe(e) {
			return this.wsCallWithSkyWS({
				url: `${this.wsURLBase}ozelKampanyaListe`,
				data: this.buildAjaxArgs(e)
			}).catch(() =>
				lastAjaxObj = $.get({
					url: `${this.wsURLBase}ozelKampanyaListe`,
					data: this.buildAjaxArgs(e)
					
				})
			)
		}
		wsStokMarkaListe(e) {
			return this.wsCallWithSkyWS({
				url: `${this.wsURLBase}stokMarkaListe`,
				data: this.buildAjaxArgs(e)
			}).catch(() =>
				lastAjaxObj = $.get({
					url: `${this.wsURLBase}stokMarkaListe`,
					data: this.buildAjaxArgs(e)
					
				})
			)
		}
		wsStokYerListe(e) {
			return this.wsCallWithSkyWS({
				url: `${this.wsURLBase}stokYerListe`,
				data: this.buildAjaxArgs(e)
			}).catch(() =>
				lastAjaxObj = $.get({
					url: `${this.wsURLBase}stokYerListe`,
					data: this.buildAjaxArgs(e)
					
				})
			)
		}
		wsYerRafListe(e) {
			return this.wsCallWithSkyWS({
				url: `${this.wsURLBase}yerRafListe`,
				data: this.buildAjaxArgs(e)
			}).catch(() =>
				lastAjaxObj = $.get({
					url: `${this.wsURLBase}yerRafListe`,
					data: this.buildAjaxArgs(e)
				})
			)
		}
		wsTransferYontemiListe(e) {
			return this.wsCallWithSkyWS({
				url: `${this.wsURLBase}transferYontemiListe`,
				data: this.buildAjaxArgs(e)
			}).catch(() =>
				lastAjaxObj = $.get({
					url: `${this.wsURLBase}transferYontemiListe`,
					data: this.buildAjaxArgs(e)
				})
			)
		}
		wsDovizListe(e) {
			return this.wsCallWithSkyWS({
				url: `${this.wsURLBase}dovizListe`,
				data: this.buildAjaxArgs(e)
			}).catch(() =>
				lastAjaxObj = $.get({
					url: `${this.wsURLBase}dovizListe`,
					data: this.buildAjaxArgs(e)
				})
			)
		}
		wsDvKurListe(e) {
			return this.wsCallWithSkyWS({
				url: `${this.wsURLBase}dvKurListe`,
				data: this.buildAjaxArgs(e)
			}).catch(() =>
				lastAjaxObj = $.get({
					url: `${this.wsURLBase}dvKurListe`,
					data: this.buildAjaxArgs(e)
					
				})
			)
		}
		wsSubeListe(e) {
			return this.wsCallWithSkyWS({
				url: `${this.wsURLBase}subeListe`,
				data: this.buildAjaxArgs(e)
			}).catch(() =>
				lastAjaxObj = $.get({
					url: `${this.wsURLBase}subeListe`,
					data: this.buildAjaxArgs(e)
				})
			)
		}
		wsPlasiyerListe(e) {
			return this.wsCallWithSkyWS({
				url: `${this.wsURLBase}plasiyerListe`,
				data: this.buildAjaxArgs(e)
			}).catch(() =>
				lastAjaxObj = $.get({
					url: `${this.wsURLBase}plasiyerListe`,
					data: this.buildAjaxArgs(e)
				})
			)
		}
		wsStokListe(e) {
			return this.wsCallWithSkyWS({
				url: `${this.wsURLBase}stokListe`,
				data: this.buildAjaxArgs(e)
			}).catch(() =>
				lastAjaxObj = $.get({
					url: `${this.wsURLBase}stokListe`,
					data: this.buildAjaxArgs(e)
					
				})
			)
		}
		wsCariTipListe(e) {
			return this.wsCallWithSkyWS({ url: `${this.wsURLBase}cariTipListe`, data: this.buildAjaxArgs(e) }).catch(() =>
				lastAjaxObj = $.get({ url: `${this.wsURLBase}cariTipListe`, data: this.buildAjaxArgs(e), timeout: 100000 }))
		}
		wsCariListe(e) {
			return this.wsCallWithSkyWS({ url: `${this.wsURLBase}cariListe`, data: this.buildAjaxArgs(e) }).catch(() =>
				lastAjaxObj = $.get({ url: `${this.wsURLBase}cariListe`, data: this.buildAjaxArgs(e) }))
		}
		wsCariRiskVeBakiyeListe(e) {
			return this.wsCallWithSkyWS({ url: `${this.wsURLBase}cariRiskVeBakiyeListe`, data: this.buildAjaxArgs(e) }).catch(() =>
				lastAjaxObj = $.get({ url: `${this.wsURLBase}cariRiskVeBakiyeListe`, data: this.buildAjaxArgs(e) }))
		}
		wsModelListe(e) {
			return this.wsCallWithSkyWS({ url: `${this.wsURLBase}modelListe`, data: this.buildAjaxArgs(e) }).catch(() =>
				lastAjaxObj = $.get({ url: `${this.wsURLBase}modelListe`, data: this.buildAjaxArgs(e) }))
		}
		wsRenkListe(e) {
			return this.wsCallWithSkyWS({
				url: `${this.wsURLBase}renkListe`,
				data: this.buildAjaxArgs(e)
			}).catch(() =>
					lastAjaxObj = $.get({
					url: `${this.wsURLBase}renkListe`,
					data: this.buildAjaxArgs(e)
				})
			)
		}
		wsDesenListe(e) {
			return this.wsCallWithSkyWS({
				url: `${this.wsURLBase}desenListe`,
				data: this.buildAjaxArgs(e)
			}).catch(() =>
				lastAjaxObj = $.get({
					url: `${this.wsURLBase}desenListe`,
					data: this.buildAjaxArgs(e)
				})
			)
		}
		wsOzellikListe(e) {
			return this.wsCallWithSkyWS({
				url: `${this.wsURLBase}ozellikListe`,
				data: this.buildAjaxArgs(e)
			}).catch(() =>
				lastAjaxObj = $.get({
					url: `${this.wsURLBase}ozellikListe`,
					data: this.buildAjaxArgs(e)
					
				})
			)
		}
		wsSonStokListe(e) {
			return this.wsCallWithSkyWS({
				url: `${this.wsURLBase}sonStokListe`,
				data: this.buildAjaxArgs(e)
			}).catch(() =>
				lastAjaxObj = $.get({
					url: `${this.wsURLBase}sonStokListe`,
					data: this.buildAjaxArgs(e)
					
				})
			)
		}
		wsUrunPaketListe(e) {
			return this.wsCallWithSkyWS({
				url: `${this.wsURLBase}urunPaketListe`,
				data: this.buildAjaxArgs(e)
			}).catch(() =>
				lastAjaxObj = $.get({
					url: `${this.wsURLBase}urunPaketListe`,
					data: this.buildAjaxArgs(e)
					
				})
			)
		}
		wsBarkodReferansListe(e) {
			if (this.barkodReferansAlinmazmi) { return new Promise(resolve => resolve([])) }
			return this.wsCallWithSkyWS({ url: `${this.wsURLBase}barkodReferansListe`, data: this.buildAjaxArgs(e) }).catch(() =>
				lastAjaxObj = $.get({ url: `${this.wsURLBase}barkodReferansListe`, data: this.buildAjaxArgs(e) }))
		}
		wsProGrupDetaylar(e) {
			return this.wsCallWithSkyWS({ url: `${this.wsURLBase}proGrupDetaylar`, data: this.buildAjaxArgs(e) }).catch(() =>
				lastAjaxObj = $.get({ url: `${this.wsURLBase}proGrupDetaylar`, data: this.buildAjaxArgs(e) }))
		}
		wsTartiBarkodKuralListe(e) {
			return this.wsCallWithSkyWS({
				url: `${this.wsURLBase}tartiFormatListe`,
				data: this.buildAjaxArgs(e)
			}).catch(() =>
				lastAjaxObj = $.get({
					url: `${this.wsURLBase}tartiFormatListe`,
					data: this.buildAjaxArgs(e)
				})
			)
		}
		wsAyrisimBarkodKuralListe(e) {
			return this.wsCallWithSkyWS({
				url: `${this.wsURLBase}ayrisimBarkodListe`,
				data: this.buildAjaxArgs(e)
			}).catch(() =>
				lastAjaxObj = $.get({
					url: `${this.wsURLBase}ayrisimBarkodListe`,
					data: this.buildAjaxArgs(e)
				})
			)
		}
		wsRBK2ABListe(e) {
			return this.wsCallWithSkyWS({
				url: `${this.wsURLBase}rbk2ABListe`,
				data: this.buildAjaxArgs(e)
			}).catch(() =>
				lastAjaxObj = $.get({
					url: `${this.wsURLBase}rbk2ABListe`,
					data: this.buildAjaxArgs(e)
				})
			)
		}
		wsStokRBKListe(e) {
			return this.wsCallWithSkyWS({
				url: `${this.wsURLBase}stokRBKListe`,
				data: this.buildAjaxArgs(e)
			}).catch(() =>
				lastAjaxObj = $.get({
					url: `${this.wsURLBase}stokRBKListe`,
					data: this.buildAjaxArgs(e)
				})
			)
		}
		wsBedenKategoriAsortiCarpanlari(e) {
			return this.wsCallWithSkyWS({
				url: `${this.wsURLBase}bedenKategoriAsortiCarpanlari`,
				data: this.buildAjaxArgs(e)
			}).catch(() =>
				lastAjaxObj = $.get({
					url: `${this.wsURLBase}bedenKategoriAsortiCarpanlari`,
					data: this.buildAjaxArgs(e)
				})
			)
		}
		wsSatisKosullari(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}satisKosullari`,
				data: this.buildAjaxArgs(e)
			})
		}
		wsPromosyonListe(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}promosyonListe`,
				data: this.buildAjaxArgs(e)
			})
		}
		wsBekleyenSayimFisler(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}bekleyenSayimFisler`,
				data: this.buildAjaxArgs(e)
			})
		}
		wsBekleyenUgramaFisler(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}bekleyenUgramaFisler`,
				data: this.buildAjaxArgs(e)
			})
		}
		wsBekleyenSiparisler(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}bekleyenSiparisler`,
				data: this.buildAjaxArgs(e)
			})
		}
		wsOncekiFisler(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}oncekiFisler`,
				data: this.buildAjaxArgs(e)
			})
		}
		wsCETSaveTables(e) {
			e = e || {}; const {data} = e; delete e.data;
			return lastAjaxObj = $.post({
				url: `${this.wsURLBase}cetSaveTables?${$.param(this.buildAjaxArgs($.extend({}, e, { input: defaultInput })))}`,
				contentType: 'application/json', data: toJSONStr(data) /*, dataType: defaultOutput*/
			}).fail(e.silent ? defFailBlockBasit : defFailBlock)
		}
		wsKonumKaydet(e) {
			e = e || {}; const {data} = e; delete e.data;
			const _wsURLBase = updateWSUrlBaseBasit($.extend({}, sky.config, { path: `ws/elterm/`, port: SkyConfigParam.DefaultWSPort }));
			return lastAjaxObj = $.post({
				url: `${_wsURLBase}konumKaydet?${$.param($.extend({}, e))}`, contentType: 'application/json', data: toJSONStr(data) /*, dataType: defaultOutput*/
			}).fail(e.silent ? defFailBlockBasit : defFailBlock)
		}
		wsCallWithSkyWS(e) {
			const skyWSURL = this.param.skyWSURLUyarlanmis; if (!skyWSURL) { return new $.Deferred(p => p.reject({ isError: true, rc: 'noSkyWSUrl' })) }
			let {api} = e; if (!api) { const url = new URL(e.url); api = url.pathname.trim('/'); if (api.startsWith('/')) { api = api.substring(1) } }
			const wsArgs = $.extend({}, { exec: true, port: getArgsForRandomPort().port, api: api }, e.data || {});
			return lastAjaxObj = $.post({ url: `${skyWSURL}ws/skyTablet/vioQueryYapi`, processData: false, contentType: 'application/json', data: toJSONStr(wsArgs) })
		}
		konumFarki(e) { const {konum1, konum2} = e; const result = Utils.konumFarki(konum1, konum2); console.info('konumFarki', result, 'mt'); return result }
		kisitlamalariUygula(e) {
			let {kisitlamalariUygulaOncesi} = this; if (kisitlamalariUygulaOncesi) {
				const _e = { ...e, silent: true };
				if (kisitlamalariUygulaOncesi.run) { kisitlamalariUygulaOncesi.run(_e) } else { getFuncValue.call(this, kisitlamalariUygulaOncesi, _e) }
			}
			this._fisTipleri = this._fisAdimKisitIDSet = this._menuAdimKisitIDSet = undefined;
			setTimeout(() => {
				const menuItems = this.divAnaMenu.find(`.item`); const {menuAdimKisitIDSet} = this;
				if (!$.isEmptyObject(menuAdimKisitIDSet)) {
					menuAdimKisitIDSet.bekleyenXFislerGuncelle = true;
					const removeItems = menuItems.filter((index, item) => !menuAdimKisitIDSet[item.id]);
					if (!$.isEmptyObject(removeItems)) { removeItems.remove() }
				}
			}, 100);
			const {fisAdimKisitIDSet} = this; if (fisAdimKisitIDSet) {
				if (fisAdimKisitIDSet.SY && !fisAdimKisitIDSet.BS) { fisAdimKisitIDSet.BS = true }
				if (!fisAdimKisitIDSet.UG) { fisAdimKisitIDSet.UG = true }
			}
			const orjFisTipleri = this.fisTipleriDuzenlenmis; if (!$.isEmptyObject(fisAdimKisitIDSet)) { this._fisTipleri = orjFisTipleri.filter(rec => fisAdimKisitIDSet[rec.kod]) }
		}
		get gpsTimer_key() { return 'gpsTimer' } get merkezeBilgiGonderTimer_key() { return 'merkezeBilgiGonder' }
		async gpsTimer_start(e) {
			await this.gpsTimer_stop(); await this.setUniqueTimeout({
				key: this.gpsTimer_key, isInterval: true, delayMS: (this.programcimi ? 10 : 60) * 1000,
				block: () => { const result = this.gpsTimer_proc(e); if (result === false) { this.clearUniqueTimeout({ key: this.gpsTimer_key }) } }
			})
		}
		async gpsTimer_stop(e) { await this.clearUniqueTimeout({ key: this.gpsTimer_key, isInterval: true }) }
		async gpsTimer_proc(e) {
			e = e || {}; const {geolocation} = navigator; if (!geolocation) { return true }
			const gpsInfo = await new $.Deferred(p => { geolocation.getCurrentPosition(_e => p.resolve(_e)) }); if (!gpsInfo) { return true }
			const {timestamp} = gpsInfo, coords = $.extend({}, gpsInfo.coords);
			if (asFloat(coords.latitude) <= 0 || asFloat(coords.longitude) <= 0) { return true }
			const sonCoords = (this.sonKonumBilgi || {}).coords; if (sonCoords && (sonCoords.latitude == coords.latitude && sonCoords.longitude == coords.longitude)) { return true }
			const kayitTS = dateTimeToString(timestamp ? new Date(timestamp) : now()),  {sessionInfo} = sky.config;
			const userTip = (sessionInfo.loginTipi ? sessionInfo.loginTipi.replace('Login', '').replace('login', '') : null) || 'vio';
			const table = 'data_KonumBilgi', dbMgr = e.dbMgr || this.dbMgr_mf, {tx} = e; let sent, stm, maxRowID, del, hv, upd, recs;
			const KeepRecsCount = 20; sent = new MQSent({ from: table, where: [`gonderildi = '*'`], sahalar: [`MAX(rowid)`] }); stm = new MQStm({ sent });
			maxRowID = asInteger(await dbMgr.tekilDegerExecuteSelect({ tx, query: stm }));
			if (maxRowID && maxRowID > KeepRecsCount) {
				del = new MQIliskiliDelete({ from: table, where: [`gonderildi = '*'`, `rowid < ${MQSQLOrtak.sqlParamValue(maxRowID - KeepRecsCount)}`] });
				await dbMgr.executeSql({ tx, query: del });
			}
			hv = { kayitTS: kayitTS, userTip: userTip, userKod: sessionInfo.user, gonderildi: '', latitude: coords.latitude, longitude: coords.longitude, speed: coords.speed || 0 };
			await dbMgr.insertOrReplaceTable({ mode: 'insertIgnore', tx, table, hv });
			const data = {}, tables = data.tables = {}, tblKonumBilgi = tables[table] = [];
			sent = new MQSent({ from: table, where: [`gonderildi = ''`], sahalar: [`*`] });
			stm = new MQStm({ sent }); recs = await dbMgr.executeSqlReturnRowsBasic({ tx, query: stm });
			for (let i = 0; i < recs.length; i++) { tblKonumBilgi.push(recs[i]); } await this.wsKonumKaydet({ silent: true, data });
			upd = new MQIliskiliUpdate({ from: table, where: [`gonderildi = ''`], set: [`gonderildi = '*'`] });
			await dbMgr.executeSql({ tx, query: upd }); this.sonKonumBilgi = { timestamp, coords };
			return true
		}
		async merkezeBilgiGonderTimer_start(e) {
			await this.merkezeBilgiGonderTimer_stop();
			await this.setUniqueTimeout({
				key: this.merkezeBilgiGonderTimer_key, isInterval: true, delayMS: (this.programcimi ? 5 : 15) * 1000,
				block: async () => {
					const result = await this.merkezeBilgiGonderTimer_proc(e);
					if (result === false) { this.clearUniqueTimeout({ key: this.merkezeBilgiGonderTimer_key }) }
				}
			})
		}
		async merkezeBilgiGonderTimer_stop(e) { await this.clearUniqueTimeout({ key: this.merkezeBilgiGonderTimer_key, isInterval: true }) }
		async merkezeBilgiGonderTimer_proc(e) {
			e = e || {}; if (!navigator.onLine || !this.otoAktarFlag || this.kmTakibiYapilirmi) { return true }
			const {activePart} = sky.app; if (activePart && activePart.fisGirisEkranimi) { return true }
			const _e = { silent: true, timer: true }; let result = await this.merkezeBilgiGonderDevam(_e);
			if (result && !$.isEmptyObject(result.basariliTable2FisIDListe)) { if (activePart?.tazele && !activePart.fisGirisEkranimi) { activePart.tazele() } }
			return true
		}
		async menuItemClicked(e) {
			let item = e.event.currentTarget, id = item.id; if (!id) { return }
			let {aktarimProgressPart} = this; if (aktarimProgressPart) { aktarimProgressPart.destroyPart(); delete this.aktarimProgressPart }
			$(item).parent().children('li') .removeClass('active');
			let block = eval(item.dataset.block); if (block) { if (asBool(item.dataset.selectable)) { $(item).addClass('active') } return await block.call(this, e) }
			return null
		}
		merkezdenBilgiYukleIstendi(e) {
			let layout = this.templates.merkezdenBilgiYukleMesaji.contents('div').clone(true);
			layout.addClass(`part ${this.appName} ${this.rootAppName}`); this.prefetchAbortedFlag = true;
			createJQXWindow(layout, this.appText,
				{ isModal: true, showCollapseButton: false, closeButtonAction: 'destroy', width: 'auto', height: 280 },
				{
					EVET: (dlgUI, btnUI) => {
						e = $.extend({}, e, { verilerSilinmesinFlag: dlgUI.find('.jqx-window-content #verilerSilinmesinFlag').is(':checked') });
						dlgUI.jqxWindow('destroy'); this.merkezdenBilgiYukle(e);
					},
					HAYIR: (dlgUI, btnUI) => { dlgUI.jqxWindow('destroy') }
				}
			)
		}
		async merkezeBilgiGonderIstendi(e) {
			this.prefetchAbortedFlag = true; let layout = this.templates.merkezeBilgiGonderMesaji.contents('div').clone(true); layout.addClass(`part ${this.appName} ${this.rootAppName}`);
			const gonderilecekBilgiler = await this.gonderilecekBilgiler(e);
			if (!(gonderilecekBilgiler && gonderilecekBilgiler.totalCount)) { displayMessage(`Gönderilmeyi bekleyen hiç belge bulunamadı`, this.appText); return false }
			let bilgiText = ''; const {table2TipAdi} = this, {table2Info} = gonderilecekBilgiler;
			for (const table in table2Info) {
				if (!table2TipAdi[table]) { continue }
				const info = table2Info[table], {count} = info;
				if (count) { const tipAdi = table2TipAdi[table] || table; if (bilgiText) { bilgiText += ', ' } bilgiText += `${count.toLocaleString()} adet ${tipAdi}` }
			}
			if (bilgiText) { layout.find(`.belgelerText`).html(bilgiText) }
			createJQXWindow(layout, this.appText,
				{ isModal: true, showCollapseButton: false, closeButtonAction: 'destroy', width: 'auto', height: 250 },
				{
					EVET: async (dlgUI, btnUI) => { e = $.extend({}, e); dlgUI.jqxWindow('destroy'); await this.merkezeBilgiGonderOnKontrol(e); await this.merkezeBilgiGonder(e) },
					HAYIR: (dlgUI, btnUI) => { dlgUI.jqxWindow('destroy') }
				}
			)
		}
		async merkezeBilgiGonderOnKontrol(e) { await this.gerekirseKMGirisYap({ sonmu: true }) }
		async veriYonetimi_cloud_import(e) {
			const {param, dbTablePrefixes} = this, dbMgr = this.dbMgr_mf, {sender, cloudURL} = e, {alinacaklar} = sender; let {tx} = e; const hasTx = !!tx;
			lastAjaxObj = $.ajax({ cache: false, async: true, method: 'GET', url: `${cloudURL}?${$.param(this.buildAjaxArgs({ input: defaultInput }))}` });
			let data = null, result = await lastAjaxObj; if (result && typeof result != 'object') { result = { isError: true, rc: 'invalidResponse', errorText: 'Yükleme Verisi hatalıdır' } }
			if (result && result.isError) { throw result } if (!result) { throw { isError: true, rc: 'emptyResponse', errorText: `Yüklenecek veri bulunamadı` } }
			data = result; if (alinacaklar.param && !$.isEmptyObject(data.param)) {
				$.extend(param, data.param); await param.kaydet();
				delete this._ekOzellikKullanim; this.ortakReset(); await this.ekOzellikler_tabloDuzenlemeleriYap();
			}
			let tables = asSet((await dbMgr.tables()).filter(name => !(name.startsWith('_') || name.startsWith('sqlite_'))));
			const tableNames = {}; for (const table in tables) {
				let uygunmu =
					( alinacaklar.belgeler && !(table.startsWith(dbTablePrefixes.master) || table.startsWith(dbTablePrefixes.const)) ) ||
					( alinacaklar.sabitTanimlar && table.startsWith(dbTablePrefixes.master) );
				if (uygunmu) { tableNames[table] = true }
			}
			const ignoreColSet = asSet(['_parentTable', '_table', '_tip', 'olasiMiktar']), {table2Recs} = data;
			if (!$.isEmptyObject(table2Recs)) {
				for (const table in table2Recs) {
					if (!tableNames[table]) { continue }
					const recs = table2Recs[table]; if ($.isEmptyObject(recs)) { continue }
					const del = new MQIliskiliDelete({ from: table }), hvListe = [];
					for (const rec of recs) { for (const key in ignoreColSet) { delete rec[key] } hvListe.push(rec) }
					if (!hasTx) { tx = e.tx = await dbMgr.getTx() }
					await dbMgr.executeSql({ tx, query: del });
					await dbMgr.insertOrReplaceTable({ tx, table, mode: 'insertIgnore', hvListe })
				}
				if (!hasTx) { tx = e.tx = await dbMgr.getTx() }
			}
			this.onbellekOlustur(e); return true
		}
		async veriYonetimi_cloud_export(e) {
			const {param, dbTablePrefixes} = this, dbMgr = this.dbMgr_mf, {sender, cloudURL} = e, {alinacaklar} = sender; let {tx} = e;
			let tables = (await dbMgr.tables()).filter(name => !(name.startsWith('_') || name.startsWith('sqlite_'))); const tableNames = [];
			for (const table of tables) {
				let uygunmu = (
					( alinacaklar.belgeler && !(table.startsWith(dbTablePrefixes.master) || table.startsWith(dbTablePrefixes.const)) ) ||
					( alinacaklar.sabitTanimlar && table.startsWith(dbTablePrefixes.master) )
				);
				if (uygunmu) { tableNames.push(table) }
			}
			const table2Recs = {}, data = { param: null, table2Recs };
			for (const table of tableNames) {
				const recs = table2Recs[table] = table2Recs[table] || [];
				let sent = new MQSent({ from: table, sahalar: ['rowid', '*'] }), stm = new MQStm({ sent });
				let rs = await dbMgr.executeSql({ tx, query: stm }); for (let j = 0; j < rs.rows.length; j++) { const rec = rs.rows[j]; recs.push(rec) }
			}
			if (alinacaklar.param) { data.param = param.reduce() }
			lastAjaxObj = $.ajax({
				cache: false, async: true, method: 'POST', contentType: 'application/json',
				url: `${cloudURL}?${$.param(this.buildAjaxArgs({ input: defaultInput }))}`, data: toJSONStr(data)
			});
			const result = await lastAjaxObj; if (result && result.isError) { throw result } return result || true
		}
		veriYonetimiIstendi(e) {
			this.prefetchAbortedFlag = true;
			return new $.Deferred(async p => {
				let part = new CETVeriYonetimiPart({
					parentPart: this.activePart || this,
					bitince: e => p.resolve(e)
					/*kaydetIslemi: e => p.resolve(e)*/
				});
				await part.run();
			});
		}
		kmGirisIstendi(e) {
			this.prefetchAbortedFlag = true;
			return new $.Deferred(async p => {
				let part = new CETKMGirisPart({
					parentPart: this.activePart || this,
					sonmu: e.sonmu,
					kaydetIslemi: e =>
						p.resolve(e)
				});
				await part.run();
			});
		}
		cariTanimIstendi(e) {
			this.prefetchAbortedFlag = true;
			return new $.Deferred(async p => {
				let part = new CETCariTanimPart({
					parentPart: this.activePart || this,
					kaydetIslemi: e => p.resolve(e)
				});
				await part.run()
			})
		}
		async fiyatGorIstendi(e) { this.prefetchAbortedFlag = true; return CETFiyatGorPart.run({ parentPart: this }); }
		async rotaListesiIstendi(e) {
			if (!this.rotaKullanilirmi) { displayMessage(`Bu program için <b>Rota Listesi</b> kullanılamaz!`, this.appText); return false }
			this.prefetchAbortedFlag = true; await this.rotaVeFisListeOncesiIslemler(e);
			return await new CETRotaListesiPart({ parentPart: this }).run()
		}
		async fisListesiIstendi(e) {
			this.prefetchAbortedFlag = true; await this.rotaVeFisListeOncesiIslemler(e);
			return await new CETFisListePart({ parentPart: this }).run()
		}
		async musteriDurumuIstendi(e) {
			this.prefetchAbortedFlag = true; await this.rotaVeFisListeOncesiIslemler(e);
			return await new CETMusteriDurumuPart({ parentPart: this }).run();
		}
		async raporlarIstendi(e) { this.prefetchAbortedFlag = true; return new CETRaporlarPart({ parentPart: this }).run() }
		async sonStokGuncelleIstendi(e) {
			createJQXWindow(
				`<p class="bold">Son Stoklar Merkezden indirilip, tablette güncellenecek</p><div>Devam edilsin mi?</div>`,
				this.appText,
				{
					isModal: true, showCollapseButton: false, closeButtonAction: 'destroy',
					width: 'auto', height: 250
				},
				{
					EVET: async (dlgUI, btnUI) => {
						e = $.extend({}, e);
						dlgUI.jqxWindow('destroy');
						await this.knobProgressShow();
						await this.knobProgressSetLabel(`Son Stoklar merkezden güncelleniyor...`);
						try {
							const result = await this.sonStokGuncelle(e);
							const updateSayi = typeof result == 'object' ? Object.keys(result).length : null;
							await this.knobProgressHideWithReset({
								update: {
									labelTemplate: 'success',
									label: (
										updateSayi
											? `<u class="bold royalblue">${updateSayi.toLocaleString()} adet</u> Son Stok Merkezden güncellendi`
											: `Son Stok Bilgileri Güncellemesi Bitti`
									)
								}, delayMS: 3000
						   });
						}
						catch (ex) {
							let errorText = (
								ex.statusText == 'error'
									? `Merkez ile iletişim kurulamadı<br/>${this.wsURLBase}`
									: ex.message || ex.errorText || ex.message || (ex.responseJSON || {}).errorText || ''
							);
							await this.knobProgressHideWithReset({
								update: {
									labelTemplate: 'error',
									label: `<b>${errorText}</b>`
								}, delayMS: 5000
						   });
						}
					},
					HAYIR: (dlgUI, btnUI) => dlgUI.jqxWindow('destroy')
				}
			)
		}
		async numaratorListeIstendi(e) { this.prefetchAbortedFlag = true; return new CETNumaratorListePart({ parentPart: this }).run() }
		async ayarlarIstendi(e) { this.prefetchAbortedFlag = true; return new CETParamPart({ parentPart: this }).run() }

		async sonStokGuncelle(e) {
			e = e || {}; this.prefetchAbortedFlag = true; const {sicakTeslimFisimi, defaultYerKod} = this;
			const promise_sonStokListe = sicakTeslimFisimi ? this.wsStokListe() : this.wsSonStokListe();
			const dbMgr = this.dbMgr_mf; let {tx} = e; const hasTx = !!tx;
			if (!hasTx) tx = await dbMgr.getTx();
			const Prefix_EkOz = `ekOz_`, {anahtarDelim} = CETEkOzellikler, ekOzelliklerIDSahalar = CETEkOzellikler.idSahalar;
			const ignoreSet = asSet(['stokKod', 'yerKod', 'refRafKod']);
			let sent = new MQSent({
				from: `mst_SonStok son`, where: [`son.orjMiktar <> 0`],
				sahalar: [`son.yerKod`, `son.stokKod`, `SUM(son.orjMiktar) devir`, `SUM(son.miktar) kalan`, `SUM(son.olasiFark) olasiFark`],
				groupBy: [`son.yerKod`, `son.stokKod`]
			});
			for (const idSaha of ekOzelliklerIDSahalar) {
				if (!ignoreSet[idSaha]) {
					sent.sahalar.add(`son.${idSaha}`);
					sent.groupBy.add(`son.${idSaha}`)
				}
			}
			let stm = new MQStm({ sent: sent });
			const dbRecs = await dbMgr.executeSqlReturnRowsBasic({ tx, query: stm });
			let wsRecs = await promise_sonStokListe;
			if (wsRecs && wsRecs.rows) wsRecs = wsRecs.rows
			if (wsRecs == null) throw { isError: true, rc: 'noWSRecord', errorText: `Merkezden Son Stok bilgisi alınamadı` };
			if ($.isEmptyObject(wsRecs)) throw { isError: false, rc: 'emptyWSRecord', errorText: `Merkezden Gelen Son Stok bilgisi yok` };
			if ($.isEmptyObject(dbRecs)) throw { isError: true, rc: 'noDBRecord', errorText: `Tablette güncellenecek Son Stok bilgisi bulunamadı` };
			const getAnahStr = e => {
				let {values} = e;
				if (!values) {
					const _ignoreSet = e.ignoreSet || ignoreSet, _with = e.with, {rec} = e; values = [];
					if (!$.isEmptyObject(_with)) values.push(..._with);
					for (const key of ekOzelliklerIDSahalar) {
						if (!_ignoreSet[key]) {
							let value = rec[key];
							if (value == null) {
								const recAttr = key.startsWith(Prefix_EkOz) ? key.replace(Prefix_EkOz, 'ekoz') : key;
								value = rec[recAttr.toLowerCase()];			// !! idSaha lowercase olacak !!
							}
							values.push(value)
						}
					}
				}
				return values.join(anahtarDelim)
			};
			const anah2SonStokBilgi = {}, degisenAnahStr2SonStokBilgi = {};
			for (let i = 0; i < dbRecs.length; i++) {
				const rec = dbRecs[i], {stokKod, yerKod} = rec;
				const anahStr = getAnahStr({ with: [stokKod, yerKod], rec });
				anah2SonStokBilgi[anahStr] = { stokKod, yerKod, orjMiktar: rec.devir, miktar: rec.kalan, olasiFark: rec.olasiFark }
			}
			for (let i = 0; i < wsRecs.length; i++) {
				const rec = wsRecs[i], wsMiktar = asFloat((rec.sonmiktar || rec.miktar || rec.sonStok || rec.sonstok) || 0);
				const wsOlasiFark = asFloat(rec.olasifark) || 0;
				if (!(wsMiktar || wsOlasiFark)) continue
				const stokKod = rec.stokkod || rec.kod, yerKod = rec.yerkod || defaultYerKod || '';
				if (!$.isEmptyObject(ekOzelliklerIDSahalar)) {
					const values = [];
					for (const idSaha of ekOzelliklerIDSahalar) {
						const recAttr = idSaha.startsWith(Prefix_EkOz) ? idSaha.replace(Prefix_EkOz, 'ekoz') : idSaha;
						const value = rec[recAttr.toLowerCase()];			// !! idSaha lowercase olacak !!
						values.push(value || '')
					}
				}
				const anahStr = getAnahStr({ with: [stokKod, yerKod], rec: rec });
				const sonStokBilgi = anah2SonStokBilgi[anahStr] = anah2SonStokBilgi[anahStr] || {
					stokKod: stokKod, yerKod: yerKod,
					orjMiktar: 0, miktar: 0, olasiFark: 0
				};
				
				const {orjMiktar, miktar, olasiFark} = sonStokBilgi;
				if (wsMiktar != orjMiktar || wsOlasiFark != wsOlasiFark) {
					if (wsMiktar != orjMiktar) {
						sonStokBilgi.orjMiktar = wsMiktar;
						sonStokBilgi.miktar = (wsMiktar - orjMiktar) + miktar
					}
					if (wsOlasiFark != olasiFark)
						sonStokBilgi.olasiFark = wsOlasiFark
					degisenAnahStr2SonStokBilgi[anahStr] = sonStokBilgi
				}
			}
			if (!$.isEmptyObject(degisenAnahStr2SonStokBilgi)) {
				const hvListe = [];
				for (const anahStr in degisenAnahStr2SonStokBilgi) {
					const sonStokBilgi = degisenAnahStr2SonStokBilgi[anahStr], values = anahStr.split(anahtarDelim);
					let index = 0; const hv = {};
					hv.stokKod = values[index++]; hv.yerKod = values[index++];
					for (const idSaha of ekOzelliklerIDSahalar) {
						if (!ignoreSet[idSaha])
							hv[idSaha] = values[index++]
					}
					hv.orjMiktar = sonStokBilgi.orjMiktar; hv.miktar = sonStokBilgi.miktar;
					hvListe.push(hv)
				}
				if (!hasTx) tx = await dbMgr.getTx()
				await dbMgr.insertOrReplaceTable({ tx, table: `mst_SonStok`, mode: 'replace', hvListe })
			}
			if (!hasTx) tx = await dbMgr.getTx()
			// await this.merkezdenBilgiYukleDevam_fisKaydetSonrasiIslemler(e);
			return degisenAnahStr2SonStokBilgi
		}
		async bekleyenXFislerGuncelleIstendi(e) { }
		async gonderimIsaretSifirlaIstendi(e) {
			const urlPostfix = 'debug/cetIsaretSifirla.php', urls = [
				`http://${sky.config.hostName}:81/${urlPostfix}`,
				`http://${sky.config.hostName}:8200/${urlPostfix}`,
				`/${urlPostfix}`
			], promises = [];
			for (const url of urls) {
				lastAjaxObj = $.post({ url: url, dataType: defaultOutput, timeout: 10000 });
				promises.push(lastAjaxObj)
			}
			await this.hideNotifications(); await showProgress('Merkezden yetki sorgusu yapılıyor...'); let result;
			try {
				const results = [];
				for (const promise of promises) {
					try { results.push(await promise) }
					catch (ex) {
						console.error(ex);
						let errorText = (ex.readyState === 4 && (ex.status == 404 || !ex.responseText))
											? `Bu işlem için Merkezden veya Sky Bulut Sunucusundan yetki verilmelidir`
											: ex.errorText || (ex.responseJSON || {}).errorText || ex.responseText || ex.toString();
						results.push({ isError: true, rc: 'promiseError', errorText: errorText })
					}
				}
				if (results) {
					let lastResult;
					for (const _result of results) {
						if (!_result) { continue } lastResult = _result;
						if (!_result.isError) { result = _result; break }
					}
					result = result || lastResult
				}
			}
			catch (ex) {
				const savedWSUrlBase = wsURLBase; wsURLBase = '<ul>' + urls.map(x => `<li>${x}</li>`).join('') + '</ul>';
				try { defFailBlock(ex) } finally { wsURLBase = savedWSUrlBase } throw ex
			}
			finally { await hideProgress() }

			if (!result || (result.isError && !result.errorText)) result = { isError: true, rc: 'wsError', errorText: 'İşleme izin verilmedi' };
			if (result.isError) { displayMessage(result.errorText, `@ Gönderildi İşareti Sıfırla @`); return false }
			const mesaj = result.mesaj || result.uyari || result.message || result.errorText;
			if (mesaj) displayMessage(mesaj, `Gönderim İşareti Sıfırla`);
			const promise_confirm = new $.Deferred(), wnd = createJQXWindow(
				`<b class="darkred">Belgelerin <u class="red">Gönderildi İşareti</u> kaldırılacak!</b><p/>Devam edilsin mi?`,
				`Gönderildi İşareti Sıfırla`,
				{
					isModal: true, showCollapseButton: false, closeButtonAction: 'destroy',
					width: 'auto', height: 250
				},
				{
					EVET: (dlgUI, btnUI) => {
						dlgUI.jqxWindow('destroy');
						promise_confirm.resolve(true);
					},
					HAYIR: (dlgUI, btnUI) => {
						dlgUI.jqxWindow('destroy');
						promise_confirm.reject(false);
					}
				}
			)
			const btnEvet = wnd.find('.ui-dialog-button input[type=button][value=EVET]'); btnEvet.jqxButton({ template: 'danger' });
			await promise_confirm; result = await this.gonderimIsaretSifirla(e);
			if (result == null || result === false) return false
			const {totalRowsAffected, totalRowsAffected_data, totalRowsAffected_master} = result;
			displayMessage(
				(
					totalRowsAffected == 0
						? 'İşareti kaldırılacak belge yok!'
						: (
							( totalRowsAffected == null
								 ? 'Belgeler'
								 : (
									 ( totalRowsAffected_data ? `<b>${totalRowsAffected_data}</b> <u>Belge</u> ` : '' ) +
									 ( totalRowsAffected_master ? `<b>${totalRowsAffected_master}</b> <u>Sabit Tanım (<i>Cari tanımı</i>)</u> ` : '' )
								 )
							) +
							`için <u>Gönderildi İşareti</u> kaldırıldı`
						  )
				),
				`Gönderildi İşareti Kaldır işlemi`
			)
			return true
		}
		async gonderimIsaretSifirla(e) {
			e = e || {}; const dbMgr = e.dbMgr || this.dbMgr_mf;
			let totalRowsAffected = 0, totalRowsAffected_data = 0;
			let tables = ['data_PIFFis', 'data_TahsilatFis', 'data_UgramaFis'];
			for (const table of tables) {
				const rowCount = await dbMgr.tekilDegerExecuteSelect(`SELECT COUNT(*) FROM ${table} WHERE gecici = '' AND rapor = '' AND gonderildi <> ''`);
				const rs = await dbMgr.executeSql(`UPDATE ${table} SET gonderildi = '' WHERE gecici = '' AND rapor = '' AND gonderildi <> ''`);
				if (rowCount) { totalRowsAffected_data += rowCount; totalRowsAffected += rowCount }
				// if (rs?.rowsAffected) { totalRowsAffected_data += rs.rowsAffected; totalRowsAffected += rs.rowsAffected }
			}
			let totalRowsAffected_master = 0;
			/*tables = ['mst_Cari'];
			for (const table of tables) {
				const query = `UPDATE ${table} SET gonderildi = '' WHERE gonderildi <> ''`;
				const rs = await dbMgr.executeSql({ query: query });
				if (rs && rs.rowsAffected) {
					totalRowsAffected_master += rs.rowsAffected;
					totalRowsAffected += rs.rowsAffected;
				}
			}*/
			return { totalRowsAffected, totalRowsAffected_data, totalRowsAffected_master }
		}
		playSound_barkodOkundu() {
			if (this.barkodOkutmaSessizmi) { return }
			setTimeout(async () => {
				const audio = new Audio(`media/Barcode-scanner-beep-sound.mp3`);
				try { await audio.play() } catch (ex) { }
			}, 10)
		}
		playSound_barkodError() {
			setTimeout(async () => {
				const audio = new Audio(`media/Beep-tone-sound-effect.mp3`);
				try { await audio.play() } catch (ex) { }
			}, 10)
		}
		async onResize(e) {
			e = e || {}; await super.onResize(e);
			const {activePart} = this;
			if (activePart && activePart != this) return;
			const layout = this.rootLayout;
			const divItems = layout && layout.length ? layout.find(`#anaMenu .items`) : null;
			if (divItems && divItems.length) divItems.height($(window).height() - divItems.offset().top - 30)
		}
	}
})();




/*
content = sky.app.content;
elmId = `barcodePreview`;
divPreview = content.find(`#${elmId}`);
if (!divPreview.length)
	(divPreview = $(`<video id="${elmId}" />`)).appendTo(content);

scanner = new Instascan.Scanner({ video: divPreview });
scanner.on('scan', data =>
	console.log(data));

cameras = await Instascan.Camera.getCameras();
if (cameras.length) {
	scanner.start(cameras[0]);
	console.info('barcode scan started')
}
else {
	console.error('@ No cameras found')
}
*/


/*if (true) {
	const content = sky.app.content;
	const elmId = `barcodePreview`;
	let container = content.find(`#${elmId}`);
	if (!container.length) {
		(container = $(`<div id="${elmId}" style="width: 100%" />`)).appendTo(content);
		$(`<video id="video"></video>`).appendTo(container);
		$(`<canvas id="canvas" hidden></canvas>`).appendTo(container);
	}
	const video = container.find(`#video`)[0];
	const canvasElm = container.find(`#canvas`)[0];
	const canvas = canvasElm.getContext('2d');

	const srm = await navigator.mediaDevices.getUserMedia({
		video: {
			// exact: { id: (await navigator.mediaDevices.enumerateDevices())[2].id },
			// facingMode: 'user'
			facingMode: 'environment'
		}
	});
	video.srcObject = srm;
	video.setAttribute('playsinline', true);

	const drawLine = (begin, end, color) => {
	  canvas.beginPath();
	  canvas.moveTo(begin.x, begin.y);
	  canvas.lineTo(end.x, end.y);
	  canvas.lineWidth = 4;
	  canvas.strokeStyle = color;
	  canvas.stroke();
	};
	const animate = video => {
		let barcode;
		if (this.barcodeCallbackState == 'pause') {
			if (!video.paused)
				video.pause();
		}
		else {
			if (video.paused)
				video.play();

			if (video.readyState === video.HAVE_ENOUGH_DATA) {
				canvasElm.height = video.videoHeight;
				canvasElm.width = video.videoWidth;
				canvas.drawImage(video, 0, 0, canvasElm.width, canvasElm.height);

				const imageData = canvas.getImageData(0, 0, canvasElm.width, canvasElm.height);
				barcode = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
				if (barcode && barcode.data) {
					drawLine(barcode.location.topLeftCorner, barcode.location.topRightCorner, "#FF3B58");
					drawLine(barcode.location.topRightCorner, barcode.location.bottomRightCorner, "#FF3B58");
					drawLine(barcode.location.bottomRightCorner, barcode.location.bottomLeftCorner, "#FF3B58");
					drawLine(barcode.location.bottomLeftCorner, barcode.location.topLeftCorner, "#FF3B58");	

					console.info(`barcode read:`, barcode);
					displayMessage(`barkod okundu: <b>${(barcode.data || '').toString()}</b>`);
				}
			}
		}
		if (this.barcodeCallbackState == 'abort') {
			delete this.hBarcodeCallback;
			video.pause();

		}
		else {
			setTimeout(
				e => requestAnimationFrame(() => animate(e.video)),
				barcode ? 1000 : 0,
				{ video: video });
		}
	};
	this.hBarcodeCallback = requestAnimationFrame(() =>
		animate(video));
	this.barcodeCallbackState = null;


	sql = await initSqlJs();
	db = new sql.Database();
	db.exec(`create table if not exists test (a TEXT not null primary key)`);
	db.exec(`insert into test (a) values ('1'), ('2')`);
	data = db.export()
	json = toJSONStr(Array.from(data));
	
	data = Uint8Array.from(JSON.parse(json));
	db = new sql.Database(data)
	db.exec(`select * from test`)


	dbMgr = sky.app.dbMgr_mf;
	dbName = 'testdb';
	db = new alasql.Database(dbName);
	recs = await dbMgr.executeSqlReturnRows(`SELECT name FROM sqlite_master WHERE type = 'table'`)
	tables = [];
	for (const rec of recs) {
		table = rec.name;
		if (table.startsWith('__'))
			continue
		tables.push(table);
		_recs = await dbMgr.executeSqlReturnRows(`select * from ${table}`);
		db.exec(`DROP TABLE IF EXISTS ${table}; CREATE TABLE ${table}`);
		db.exec(`SELECT * INTO ${table} FROM ?`, [_recs])
	}
	data = {};
	for (const table in db.tables) {
		const tableObj = db.tables[table];
		data[table] = tableObj.data
	}
	localData = new CETLocalData({ dbName: dbName, data: null });
	await localData.kaydet();
	localData.data = Base64.encode(toJSONStr(data));
	await localData.kaydet();
	
	localData = new CETLocalData({ dbName: dbName });
	await localData.yukle();
	data = localData.data;
	data = data ? Base64.decode(Base64.fromUint8Array(data)) : data;
	data = data ? JSON.parse(data) : null;
	for (const table in data) {
		const recs = data[table];
		db.exec(`DROP TABLE IF EXISTS ${table}; CREATE TABLE ${table}`);
		db.exec(`SELECT * INTO ${table} FROM ?`, [recs])
		console.info({ table: table, recs: recs, queryResult: db.exec(`SELECT * FROM ${table}`) })
	}

	storage = navigator.storage;
	await storage.persist();
	rootDir = await storage.getDirectory();
	dir = await rootDir.getDirectoryHandle('dir2', { create: true });
	iter = await rootDir.entries();
	await dir.remove({ recursive: true });
	iter = await rootDir.entries();
	while (true) {
		entry = await iter.next();
		if (entry.done) break
		console.info(entry.value)
	}
	// fh = await rootDir.getFileHandle('A', { create: true });
	// await fh.remove();
	fh = await rootDir.getFileHandle('A', { create: false });
	sw = await fh.createWritable();
	try {
		// await sw.truncate(0);
		file = await fh.getFile();
		ld = new CETLocalData({ dbName: sky.app.dbMgr_mf.dbName });
		await ld.yukle();
		await sw.write(ld.data)
	}
	finally { await sw.close() }
	file = await fh.getFile();
	fileData = (await file.arrayBuffer());
	for (i = 0; i < fileData.length; i++) {
		if (fileData[i] != ld.data.buffer[i])
			console.info('diff', i)
	}
	sql = await new initSqlJs();
	db = await new sql.Database(new Uint8Array(fileData));
	db.exec(`select * from sqlite_master`)

	// globals
	app = sky.app;
	appName = app.appName;
	dbName = 'rom_data';
	console.debug('globals', appName, dbName, app);
	
	// db create
	delete alasql.databases.db;
	db = new alasql.Database(dbName);
	console.debug('db create', dbName, db);
	
	// db init
	args = { url: `../app/prog/cetApp/data/cetDB_${dbName}_initSQL.sql`, dataType: 'text' };
	fileData = await $.get(args);
	console.debug('ajax', 'query fetch', args);
	queries = fileData.split(';');
	for (let query of queries) {
		query = query?.trim();
		if (!query) continue
		try {
			db.exec(
				query
					.replaceAll('INDEX IF NOT EXISTS ', 'INDEX ')
					.replaceAll(' ON DELETE CASCADE', '')
					.replaceAll('AS (orjMiktar + olasiFark)', '')
			)
		}
		catch (ex) { console.error('sql', query, ex.message) }
	}
	console.debug('query parse', { queryies: queries });
	
	// db save
	fs = (await Utils.getFS()).fs;
	rootDir = await Utils.getFSDirHandle(`sky/${appName}/db/${dbName}`, true, { fs });
	for (const table in db.tables) {
		tableObj = db.tables[table];
		dh = await rootDir.getDirectoryHandle(table, { create: true });
		for (const key in tableObj) {
			const value = tableObj[key];
			if ((value === undefined || typeof value == 'function'))
				continue
			data = value === undefined ? value : toJSONStr(value);
			fh = null;
			try {
				fh = await dh.getFileHandle(key, { create: false });
				await fh.remove()
			}
			catch (ex) { }
			if (data !== undefined) {
				fh = await dh.getFileHandle(key, { create: true });
				sw = await fh.createWritable();
				try { await sw.write(data) }
				finally { await sw.close() }
			}
		}
		console.log('', '', 'db save', 'table', table, tableObj);
	}
	console.debug('db save', tables);
	
	// db load
	db = new alasql.Database(dbName);
	fs = (await Utils.getFS()).fs;
	try { rootDir = await Utils.getFSDirHandle(`sky/${appName}/db/${dbName}`, false, { fs }) }
	catch (ex) { }
	if (rootDir) {
		enmTables = await rootDir.values();
		while (true) {
			item = await enmTables.next();
			if (item.done) break
			dh = item.value;
			table = dh.name;
			tableObj = {};
			enmKeys = await dh.values();
			while (true) {
				item = await enmKeys.next();
				if (item.done) break
				fh = item.value;
				key = fh.name;
				fh = file = null;
				try {
					fh = await dirTable.getFileHandle(key, {});
					file = await fh.getFile()
				}
				catch (ex) { }
				if (!file) continue
				data = await file.text();
				value = data ? JSON.parse(data) : undefined;
				if (value !== undefined)
					tableObj[key] = value
			}
			db.tables[table] = tableObj;
			console.log('', '', 'db load', 'table', table, tableObj);
		}
		console.debug('db load', db.tables);
	}
	
	// db table save
	tables = ['mst_SonStok', 'data_PIFFis'];
	fs = (await Utils.getFS()).fs;
	rootDir = await Utils.getFSDirHandle(`sky/${appName}/db/${dbName}`, true, { fs });
	for (const table of tables) {
		tableObj = db.tables[table];
		dh = await rootDir.getDirectoryHandle(table, { create: true });
		keys = ['data'];
		for (const key in tableObj) {
			const value = tableObj[key];
			if ((value === undefined || typeof value == 'function'))
				continue
			data = value === undefined ? value : toJSONStr(value);
			fh = null;
			try {
				fh = await dh.getFileHandle(key, { create: false });
				await fh.remove()
			}
			catch (ex) { }
			if (data !== undefined) {
				fh = await dh.getFileHandle(key, { create: true });
				sw = await fh.createWritable();
				try { await sw.write(data) }
				finally { await sw.close() }
			}
		}
		console.info('', '', 'table data save', 'table', table, tableObj, tableObj.data);
	}
	console.debug('table data save', tables, db.tables)


	dbMgr = sky.app.dbMgrs.param;
	await dbMgr.executeSql(`DELETE FROM mst_Login GO INSERT INTO mst_Login (loginTipi, user, pass, userText) VALUES (?, ?, ?, ?)`, ['plasiyerLogin', 'P02', '2', 'Plasiyer 2']);
	console.table(await dbMgr.executeSqlReturnRows(`SELECT * FROM mst_Login`))

	dbName = 'test'; objStoreName = 'data'; internalDBName = 'rom_data';
	await indexedDB.deleteDatabase(dbName);
	sql = await indexedDB.open(dbName);
	promise = new $.Deferred();
	sql.onupgradeneeded = evt => {
		db = evt.currentTarget.result;
		db.createObjectStore(objStoreName)
	};
	sql.onsuccess = evt => {
		db = evt.currentTarget.result;
		try {
			tx = db.transaction(objStoreName, 'readwrite');
			objStore = tx.objectStore(objStoreName);
			objStore.add(toJSONStr(sky.app.dbMgr_mf.db.tables), internalDBName);
			db.close();
			promise.resolve(true)
		}
		catch (ex) {
			db.close();
			promise.fail(ex)
		}
	}
	await promise
	
	sql = await indexedDB.open(dbName);
	promise = new $.Deferred();
	sql.onsuccess = evt => {
		db = evt.currentTarget.result;
		try {
			tx = db.transaction(objStoreName, 'readonly');
			objStore = tx.objectStore(objStoreName);
			req = objStore.get(internalDBName);
			req.onsuccess = evt => {
				data = evt.target.result;
				db.close();
				promise.resolve(data)
			};
			req.onerror = evt => {
				err = evt.target.result;
				db.close();
				promise.reject(err)
			}
		}
		catch (ex) {
			db.close();
			promise.fail(ex)
		}
	}
	({ data: await promise })
*/
