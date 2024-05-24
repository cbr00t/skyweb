(function() {
	window.CETApp = class extends window.Prog {
		constructor(e) {
			super(e);

			$.extend(this, {
				mainPart: this,
				// wsURLBase: updateWSUrlBaseBasit($.extend({}, sky.config, { path: sky.config.wsPath })),
				param: new CETParam(),
				dbMgrs: {
					param: new DBMgr({ dbName: `${this.appName}_PARAM` }),
					rom_data: new DBMgr({ dbName: `${this.appName}_ROM_DATA` })
					//data: new DBMgr({ dbName: `${this.appName}_Data` })
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
					kmTakibi: qs.kmTakip == null ? null : asBool(qs.kmTakip),
					konumTakip: qs.konumTakip == null ? null : asBool(qs.konumTakip),
					gridAltMultiSelect: asBoolQ(qs.gridAltMultiSelect),
					listeKodDogrudanArama: asBoolQ(qs.listeKodDogrudanArama) == null ? asBoolQ(qs.listeKodDogrudanAramaYapilir) : asBoolQ(qs.listeKodDogrudanArama),
					fisOzetBilgi: asBoolQ(qs.fisOzetBilgiGosterilir),
					eIslem: asBoolQ(qs.eIslem),
					eIslemOzelDokum: asBoolQ(qs.eIslemOzelDokum),
					eBelgeAltSinir: qs.eBelgeAltSinir == null ? null : asFloat(qs.eBelgeAltSinir),
					rota: asBoolQ(qs.rota) == null ? asBoolQ(qs.rotaKullanilir) : asBoolQ(qs.rota),
					rotaZorunlu: asBoolQ(qs.rotaZorunlu) == null ? asBoolQ(qs.musteriRotaZorunlu) : asBoolQ(qs.rotaZorunlu),
					bakiyeRiskGosterilmez: asBoolQ(qs.bakiyeRiskGosterilmez),
					oncekiFislerGosterilmez: asBoolQ(qs.oncekiFislerGosterilmez),
					fiyat: asBoolQ(qs.fiyat),
					tahsilatIptal: asBoolQ(qs.tahsilatIptal) == null ? asBoolQ(qs.tahIptal) : asBoolQ(qs.tahsilatIptal),
					alimNetFiyat: asBoolQ(qs.alimNetFiyat),
					alimFiyatGormez: asBoolQ(qs.alimFiyatGormez),
					satisFiyatGormez: asBoolQ(qs.satisFiyatGormez),
					iskonto: asBoolQ(qs.iskonto) == null ? asBoolQ(qs.isk) : asBoolQ(qs.iskonto),
					iskSayi: qs.iskSayi == null ? null : asInteger(qs.iskSayi),
					satirIskOranSinir: qs.satirIskOranSinir ? asFloat(qs.satirIskOranSinir) || 0 : null,
					menuAdimKisitIDListe: qs.menuAdimKisitIDListe ? qs.menuAdimKisitIDListe.split('|') : null,
					fisAdimKisitIDListe: qs.fisAdimKisitIDListe ? qs.fisAdimKisitIDListe.split('|') : null,
					dogrudanFisListeyeGirilirmi: asBool(qs.dogrudanFisListe),
					barkodluFisGiris: asBoolQ(qs.barkodluFisGiris),
					fisGirisSadeceBarkod: asBoolQ(qs.fisGirisSadeceBarkod),
					geciciFisYok: asBoolQ(qs.geciciFisYok),
					silerekBilgiAl: asBoolQ(qs.silerekBilgiAl),
					ozelKampanya: asBoolQ(qs.ozelKampanya),
					ozelKampanyaOranSayisi: qs.ozelKampanyaOranSayisi ? asInteger(qs.ozelKampanyaOranSayisi) : null
				},
				initCallbacks: []
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

		static get qrScanDesteklenirmi() { return true }
		static get aceEditorDesteklermi() { return true }
		
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

		get fisTipleri() {
			return [];
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
				CETRapor.getListeItem({ raporSinif: CETRapor_SonStok_Detayli })
			]
		}

		get bilgiGonderTableYapilari() {
			return [
				{ baslik: 'data_PIFFis', diger: ['data_PIFStok'], tanim: [`mst_Cari`] },
				{ baslik: 'data_TahsilatFis', diger: ['data_TahsilatDetay'] }
			]
		}

		get tip2EkOzellik() {
			const {param} = this;
			const kullanimYapi = this.ekOzellikKullanim || {};
			const tip2EkOzellik = {};
			let tip;
			if (this.isDevMode && this.class.appMagazaVeyaSDMmi) {
				tip = 'yer';
				tip2EkOzellik[tip] = new CETEkOzellik_KA({
					tip: tip, mbTable: `mst_Yer`, tipAdi: `Detay Yer`,
					widgetEvents: {
						comboBox_stmDuzenleyici: e => {
							const subeKod = e.subeKod == null ? this.defaultSubeKod : e.subeKod;
							if (subeKod != null) {
								e.stm.sentDo(sent =>
									sent.where.degerAta(subeKod, `mst.subeKod`));
							}
						},
						liste_stmDuzenleyici: e => {
							const subeKod = e.subeKod == null ? this.defaultSubeKod : e.subeKod;
							if (subeKod != null) {
								e.stm.sentDo(sent =>
									sent.where.degerAta(subeKod, `mst.subeKod`));
							}
						}
					}
				});
			}
			
			tip = 'model';
			if ((kullanimYapi[tip] || {}).kullanilirmi)
				tip2EkOzellik[tip] = new CETEkOzellik_KA({ tip: tip, mbTable: 'mst_Model', tipAdi: (kullanimYapi[tip]).etiket || 'Model' });
			tip = 'renk';
			if ((kullanimYapi[tip] || {}).kullanilirmi)
				tip2EkOzellik[tip] = new CETEkOzellik_KA({ tip: tip, mbTable: 'mst_Renk', tipAdi: (kullanimYapi[tip]).etiket || 'Renk' });
			tip = 'desen';
			if ((kullanimYapi[tip] || {}).kullanilirmi)
				tip2EkOzellik[tip] = new CETEkOzellik_KA({ tip: tip, mbTable: 'mst_Desen', tipAdi: (kullanimYapi[tip]).etiket || 'Desen' });
			
			tip = 'raf';
			if ((kullanimYapi[tip] || {}).kullanilirmi) {
				tip2EkOzellik[tip] = new CETEkOzellik_KA({
					tip: tip, mbTable: 'mst_YerRaf', tipAdi: (kullanimYapi[tip]).etiket || 'Raf Kodu',
					mbKodSaha: 'rafKod', mbAdiSaha: 'rafKod',
					sadeceKodmu: true, placeHolder: 'Raf kodu',
					widgetEvents: {
						comboBox_stmDuzenleyici: e => {
							const yerKod = e.sender.parentPart.fis.yerKod || this.defaultYerKod;
							if (!yerKod)
								return false;
							e.stm.sentDo(sent =>
								sent.where.degerAta(yerKod, `mst.yerKod`));
						}
					}
				});
			}
			tip = 'refRaf';
			if ((kullanimYapi.raf || {}).kullanilirmi) {
				tip2EkOzellik[tip] = new CETEkOzellik_KA({
					tip: tip, mbTable: 'mst_YerRaf', tipAdi: (kullanimYapi.raf).etiket || 'Giriş Raf Kodu',
					mbKodSaha: 'rafKod', mbAdiSaha: 'rafKod',
					idSaha: 'refRafKod', adiSaha: 'refRafKod',
					sadeceKodmu: true, placeHolder: 'Giriş Raf kodu',
					widgetEvents: {
						comboBox_stmDuzenleyici: e => {
							const refYerKod = e.sender.parentPart.fis.refYerKod || this.defaultYerKod;
							if (!refYerKod)
								return false;
							e.stm.sentDo(sent =>
								sent.where.degerAta(refYerKod, `mst.yerKod`));
						}
					}
				});
			}
			
			tip = 'lotNo';
			if ((kullanimYapi[tip] || {}).kullanilirmi)
				tip2EkOzellik[tip] = new CETEkOzellik_Ozellik({ tip: tip, tipAdi: (kullanimYapi[tip]).etiket || 'Lot No' });
			tip = 'en';
			if ((kullanimYapi[tip] || {}).kullanilirmi)
				tip2EkOzellik[tip] = new CETEkOzellik_Ozellik({ tip: tip, tipAdi: (kullanimYapi[tip]).etiket || 'En' });
			tip = 'boy';
			if ((kullanimYapi[tip] || {}).kullanilirmi)
				tip2EkOzellik[tip] = new CETEkOzellik_Ozellik({ tip: tip, tipAdi: (kullanimYapi[tip]).etiket || 'Boy' });
			tip = 'yukseklik';
			if ((kullanimYapi[tip] || {}).kullanilirmi)
				tip2EkOzellik[tip] = new CETEkOzellik_Ozellik({ tip: tip, tipAdi: (kullanimYapi[tip]).etiket || 'Yukseklik' });

			const _tip2EkOzellikYapi = param.tip2EkOzellikYapi;
			if (!$.isEmptyObject(_tip2EkOzellikYapi)) {
				for (const _tip in _tip2EkOzellikYapi) {
					const rec = _tip2EkOzellikYapi[_tip];
					if (!rec.kullanilirmi)
						continue;
					
					const sinif = CETEkOzellik.classFor({ ozellikTip: rec.ozellikTip });
					if (!sinif)
						continue;
					
					const inst = new sinif({ tip: _tip, mbTable: `mst_${_tip}`, tipAdi: rec.tipAdi });
					tip2EkOzellik[_tip] = inst;
				}
			}
			
			return tip2EkOzellik;
		}

		/*get tip2EkOzellik() {
			const param = this.param;
			const tip2EkOzellik = {
				model: new CETEkOzellik_KA({
					tip: 'model', tipAdi: 'Model',
					// mbTable: 'mst_Model',
					widgetEvents: (() => {
						const ornekVeri = [
							{ kod: 'm01', aciklama: 'model 1' },
							{ kod: 'm02', aciklama: 'model 2' },
							{ kod: 'm03', aciklama: 'model 3' }
						];
						return {
							comboBox_loadServerData: e => $.merge([
								{ action: 'listedenSec', kod: '', aciklama: `<div class="action">Listeden Seç...<hr/></div>` }
							], ornekVeri),
							liste_loadServerData: e => ornekVeri
						}
					})()
				}),
				serbest1: new CETEkOzellik_Ozellik({
					tip: 'serbest1', tipAdi: 'Serbest 1',
					maxLength: 30
				})
			};

			return tip2EkOzellik;
		}*/

		get tabloEksikIslemYapi() {
			return [
				{
					kosul: async e => {
						const query = `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'data_BekleyenSiparisler'`;
						const def = await e.dbMgr.tekilDegerExecuteSelect({ tx: e.tx, query: query });
						return !def.includes(`odemeGunKod`);
					},
					queries: [
						`ALTER TABLE data_BekleyenSiparisler ADD odemeGunKod		TEXT NOT NULL DEFAULT ''`,
						`ALTER TABLE data_BekleyenSiparisler ADD tahSekliKodNo		INTEGER NOT NULL DEFAULT 0`
					]
				}
			];
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

		get defaultYerKod() { return this.param.yerKod == null ? null : (this.param.yerKod || '') }
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
		static get sonStoktanSecimYapilirmi() { return false }

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
			let result = (this.ozelYetkiler || {}).fiyatFra;
			if (result == null)
				result = this.param.fiyatFra;
			return result;
		}
		get brm2Fra() {
			let result = (this.ozelYetkiler || {}).brm2Fra;
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
			let result = (this.ozelYetkiler || {}).tip2Renk;
			if (result == null)
				result = this.param.tip2Renk;
			if (!result || $.isEmptyObject(result))
				result = this.class.defaultTip2Renk;
			return result;
		}
		get tarihAralik() {
			let result = (this.ozelYetkiler || {}).tarihAralik;
			if (result == null)
				result = this.param.tarihAralik;
			if (result == null) {
				const yil = now().getFullYear();
				result = { basi: `01.01.${yil}`, sonu: `31.12.${yil}` };
			}
			return result;
		}
		get sonStoktanSecimYapilirmi() {
			let flag = (this.ozelYetkiler || {}).sonStoktanSecim;
			if (flag == null)
				flag = this.param.sonStoktanSecimYapilirmi;
			return flag;
		}
		get rotaKullanilirmi() {
			let flag = (this.ozelYetkiler || {}).rota;
			if (flag == null)
				flag = this.param.rotaKullanilirmi;
			return flag;
		}
		get rotaDevreDisiGosterilirmi() {
			let flag = (this.ozelYetkiler || {}).rotaDevreDisi;
			if (flag == null)
				flag = this.param.rotaDevreDisiGosterilirmi;
			return flag;
		}
		get sicakTeslimFisimi() {
			let flag = (this.ozelYetkiler || {}).sicakTeslimFisi;
			if (flag == null)
				flag = this.param.sicakTeslimFisimi;
			return flag;
		}
		get riskKontrolDurum() {
			let value = (this.ozelYetkiler || {}).riskKontrolDurum;
			if (value == null)
				value = this.param.riskKontrolDurum;
			return value || '';
		}
		get stokFiyatKdvlimi() {
			let flag = (this.ozelYetkiler || {}).stokFiyatKdvli;
			if (flag == null)
				flag = this.param.stokFiyatKdvlimi;
			return flag;
		}
		get ozelIsaretKullanilirmi() {
			let flag = (this.ozelYetkiler || {}).ozelIsaret;
			if (flag == null)
				flag = this.param.yildizKullanilirmi;
			return flag;
		}
		get isaretliBelgeKDVDurumu() {
			let flag = (this.ozelYetkiler || {}).isaretliBelgeKDVDurumu
			if (flag == null)
				flag = this.param.isaretliBelgeKDVDurumu;
			return flag;
		}
		get yildizFiyatKdvlimi() {
			return this.isaretliBelgeKDVDurumu == 'K';
		}
		get yildizYuvarlamaFarkimi() {
			return this.isaretliBelgeKDVDurumu == 'N';
		}
		get sonStokKontrolEdilirmi() {
			let flag = (this.ozelYetkiler || {}).sonStok;
			if (flag == null)
				flag = this.param.sonStokKontrolEdilirmi;
			return flag;
		}
		get sonStokKontrolEdilirmi_siparis() {
			let flag = (this.ozelYetkiler || {}).sonStok_siparis;
			if (flag == null)
				flag = this.param.sonStokKontrolEdilirmi_siparis;
			return flag;
		}
		static get defaultUygunAyrimTipleri() {
			return [
				{ kod: '', aciklama: 'Normal' },
				{ kod: 'IH', aciklama: 'İhracat' },
				{ kod: 'IK', aciklama: 'İhraç Kayıtlı' }
			];
		}
		get uygunAyrimTipleri() {
			let result = (this.ozelYetkiler || {}).uygunAyrimTipleri;
			if (result == null)
				result = this.param.uygunAyrimTipleri;
			if ($.isEmptyObject(result))
				result = this.class.defaultUygunAyrimTipleri;
			return result;
		}
		get serbestModmu() {
			let flag = (this.ozelYetkiler || {}).serbestMod;
			if (flag == null)
				flag = this.param.serbestModmu;
			return flag;
		}
		get gridAltMultiSelectFlag() {
			let flag = (this.ozelYetkiler || {}).gridAltMultiSelect;
			if (flag == null)
				flag = this.param.gridAltMultiSelectFlag;
			return flag;
		}
		get listeKodDogrudanAramaYapilirmi() {
			let flag = (this.ozelYetkiler || {}).listeKodDogrudanArama;
			if (flag == null)
				flag = this.param.listeKodDogrudanAramaYapilirmi;
			return flag;
		}
		get fisOzetBilgiGosterilirmi() {
			let flag = (this.ozelYetkiler || {}).fisOzetBilgi;
			if (flag == null)
				flag = this.param.fisOzetBilgiGosterilirmi;
			return flag;
		}
		get eIslemDesteklenirmi() {
			return true;
		}
		get eIslemKullanilirmi() {
			let flag = (this.ozelYetkiler || {}).eIslem;
			if (flag == null)
				flag = asBool(this.param.eIslemKullanilirmi) || false;
			return flag;
		}
		get eBelgeAltSinir() {
			let result = (this.ozelYetkiler || {}).eBelgeAltSinir;
			if (result == null)
				result = asFloat(this.param.eBelgeAltSinir) || 0;
			return result;
		}
		get rotaKullanilirmi() {
			let flag = (this.ozelYetkiler || {}).rota;
			if (flag == null)
				flag = asBool(this.class.rotaKullanilirmi) || false;
			return flag;
		}
		get musteriRotaZorunlumu() {
			let flag = (this.ozelYetkiler || {}).rotaZorunlu;
			if (flag == null)
				flag = asBool(this.param.musteriRotaZorunlumu) || false;
			return flag;
		}
		get bakiyeRiskGosterilmezmi() {
			let flag = (this.ozelYetkiler || {}).bakiyeRiskGosterilmez;
			if (flag == null)
				flag = asBool(this.param.bakiyeRiskGosterilmezmi) || false;
			return flag;
		}
		get oncekiFislerGosterilmezmi() {
			let flag = (this.ozelYetkiler || {}).oncekiFislerGosterilmez;
			if (flag == null)
				flag = asBool(this.param.oncekiFislerGosterilmezmi) || false;
			return flag;
		}
		get musteriDurumuKullanilirmi() {
			const {menuAdimKisitIDSet} = this;
			return $.isEmptyObject(menuAdimKisitIDSet) || !!menuAdimKisitIDSet.musteriDurumu;
		}
		get maxIskSayi() {
			return 6
		}
		get iskSayi() {
			const {maxIskSayi} = this;
			let result = (this.ozelYetkiler || {}).iskSayi;
			if (result == null)
				result = asFloat(this.param.iskSayi) || maxIskSayi;
			return Math.min(result, maxIskSayi);
		}
		get iskontoArttirilirmi() {
			const {param} = this;
			const ozelYetki_iskontoArttirilirmi = (this.ozelYetkiler || {}).iskonto;
			const satirIskOranSinir = this.satirIskOranSinir;
			let flag;
			if (ozelYetki_iskontoArttirilirmi !== false && satirIskOranSinir && satirIskOranSinir == 100)
				flag = true;
			else if (satirIskOranSinir == 0)
				flag = false;
			else if (flag == null)
				flag = (this.ozelYetkiler || {}).iskonto;
			if (flag == null)
				flag = asBool(param.iskontoArttirilirmi);
			return flag;
		}
		get satirIskOranSinir() {
			let result = (this.ozelYetkiler || {}).satirIskOranSinir;
			if (result == null)
				result = (this.ozelYetkiler || {}).iskOranSinir;
			if (result == null)
				result = asFloat(this.param.satirIskOranSinir) || 0;
			return result;
		}
		get detaylardaFiyatDegistirilirmi() {
			let flag = (this.ozelYetkiler || {}).fiyat;
			if (flag == null)
				flag = this.param.detaylardaFiyatDegistirilirmi;
			return flag;
		}
		get yazdirilanTahsilatDegistirilmezmi() {
			let flag = (this.ozelYetkiler || {}).yazdirilanTahsilatDegistirilmez;
			if (flag == null)
				flag = this.param.yazdirilanTahsilatDegistirilmezmi || false;
			return flag;
		}
		get tahsilatIptalEdilemezmi() {
			let flag = (this.ozelYetkiler || {}).tahsilatIptal;
			flag = flag == null ? this.param.tahsilatIptalEdilemezmi : !flag;
			return flag;
		}
		get alimNetFiyatGosterilirmi() {
			let flag = (this.ozelYetkiler || {}).alimNetFiyat;
			if (flag == null)
				flag = this.param.alimNetFiyatGosterilirmi;
			return flag;
		}
		get alimFiyatGorurmu() {
			let flag = (this.ozelYetkiler || {}).alimFiyatGormez;
			flag = flag == null ? this.param.alimFiyatGorurmu : !flag;
			return flag;
		}
		get satisFiyatGorurmu() {
			let flag = (this.ozelYetkiler || {}).satisFiyatGormez;
			flag = flag == null ? this.param.satisFiyatGorurmu : !flag;
			return flag;
		}
		get menuAdimKisitIDSet() {
			let result = this._menuAdimKisitIDSet;
			if (result === undefined) {
				let idListe = (this.ozelYetkiler || {}).menuAdimKisitIDListe;
				if ($.isEmptyObject(idListe))
					idListe = this.param.menuAdimKisitIDListe;
				result = idListe ? asSet(idListe) : null;
				if (result)
					result.veriYonetimi = true;
				this._menuAdimKisitIDSet = result;
			}
			return result;
		}
		get fisAdimKisitIDSet() {
			let result = this._fisAdimKisitIDSet;
			if (result === undefined) {
				let idListe = (this.ozelYetkiler || {}).fisAdimKisitIDListe;
				if ($.isEmptyObject(idListe))
					idListe = this.param.fisAdimKisitIDListe;
				result = idListe ? asSet(idListe) : null;
				this._fisAdimKisitIDSet = result;
			}
			return result;
		}
		get dogrudanFisListeyeGirilirmi() {
			let flag = (this.ozelYetkiler || {}).dogrudanFisListe;
			if (flag == null)
				flag = this.param.dogrudanFisListeyeGirilirmi;
			return flag;
		}
		get barkodluFisGirisYapilirmi() {
			let flag = (this.ozelYetkiler || {}).barkodluFisGiris;
			if (flag == null)
				flag = this.param.barkodluFisGirisYapilirmi;
			return flag;
		}
		get fisGirisSadeceBarkodZorunlumu() {
			let flag = (this.ozelYetkiler || {}).fisGirisSadeceBarkod;
			if (flag == null)
				flag = this.param.fisGirisSadeceBarkodZorunlumu;
			return flag;
		}
		get geciciFisKullanilmazmi() {
			let flag = (this.ozelYetkiler || {}).geciciFisYok;
			if (flag == null)
				flag = this.param.geciciFisKullanilmazmi;
			return flag;
		}
		get silerekBilgiAlYapilirmi() {
			let flag = (this.ozelYetkiler || {}).silerekBilgiAl;
			if (flag == null)
				flag = this.param.silerekBilgiAlYapilirmi;
			return flag;
		}
		get nakitUstLimit() {
			let result = (this.ozelYetkiler || {}).nakitUstLimit;
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
			let flag = (this.ozelYetkiler || {}).depoMalKabulSiparisKontrolEdilir;
			if (flag == null)
				flag = this.param.depoMalKabulSiparisKontrolEdilirmi;
			return flag;
		}
		get depoMalKabulSiparisMiktariKontrolEdilirmi() {
			let flag = (this.ozelYetkiler || {}).depoMalKabulSiparisMiktariKontrolEdilir;
			if (flag == null)
				flag = this.param.depoMalKabulSiparisMiktariKontrolEdilirmi;
			return flag;
		}
		get depoMalKabulSiparisHMRlimi() {
			let flag = (this.ozelYetkiler || {}).depoMalKabulSiparisHMRli;
			if (flag == null)
				flag = this.param.depoMalKabulSiparisHMRlimi;
			return flag;
		}
		get depoSevkiyatSiparisKontrolEdilirmi() {
			let flag = (this.ozelYetkiler || {}).depoSevkiyatSiparisKontrolEdilir;
			if (flag == null)
				flag = this.param.depoSevkiyatSiparisKontrolEdilirmi;
			return flag;
		}
		get depoSevkiyatSiparisMiktariKontrolEdilirmi() {
			let flag = (this.ozelYetkiler || {}).depoSevkiyatSiparisMiktariKontrolEdilir;
			if (flag == null)
				flag = this.param.depoSevkiyatSiparisMiktariKontrolEdilirmi;
			return flag;
		}
		get depoSevkiyatSiparisHMRlimi() {
			let flag = (this.ozelYetkiler || {}).depoSevkiyatSiparisHMRli;
			if (flag == null)
				flag = this.param.depoSevkiyatSiparisHMRlimi;
			return flag;
		}
		get depoSiparisRefKontrolEdilirmi() {
			let flag = (this.ozelYetkiler || {}).depoSiparisRefKontrolEdilir;
			if (flag == null)
				flag = this.param.depoSiparisRefKontrolEdilirmi;
			return flag;
		}
		get depoSevkiyatSiparisKarsilamaOdemeGunTekmi() {
			let flag = (this.ozelYetkiler || {}).depoSiparisKarsilamaOdemeGunTekmi;
			if (flag == null)
				flag = this.param.depoSevkiyatSiparisKarsilamaOdemeGunTekmi;
			return flag;
		}
		get ozelKampanyaKullanilirmi() {
			let flag = (this.ozelYetkiler || {}).ozelKampanya;
			if (flag == null)
				flag = this.param.ozelKampanyaKullanilirmi;
			return flag;
		}
		get ozelKampanyaOranSayisi() {
			if (!this.ozelKampanyaKullanilirmi)
				return 0;
			let result = (this.ozelYetkiler || {}).ozelKampanyaOranSayisi;
			if (result == null)
				result = asFloat(this.param.ozelKampanyaOranSayisi) || 0;
			return result;
		}
		get otoSonStokGuncellenirmi() {
			let flag = (this.ozelYetkiler || {}).otoSonStokGuncelle;
			if (flag == null)
				flag = this.param.otoSonStokGuncellenirmi;
			return flag;
		}
		get kmTakibiYapilirmi() {
			let flag = (this.ozelYetkiler || {}).kmTakip;
			if (flag == null)
				flag = this.param.kmTakibiYapilirmi;
			return flag;
		}
		get konumTakibiYapilirmi() {
			let flag = (this.ozelYetkiler || {}).konumTakip;
			if (flag == null)
				flag = this.param.konumTakibiYapilirmi;
			return flag;
		}
		get konumsuzIslemYapilirmi() {
			let flag = (this.ozelYetkiler || {}).konumsuzIslem;
			if (flag == null)
				flag = this.param.konumsuzIslemYapilirmi;
			return flag;
		}
		get konumToleransMetre() {
			let result = (this.ozelYetkiler || {}).konumToleransMetre;
			if (result == null)
				result = asFloat(this.param.konumToleransMetre);
			return result || 0;
		}
		get eIslemOzelDokummu() {
			let flag = (this.ozelYetkiler || {}).eIslemOzelDokum;
			if (flag == null)
				flag = this.param.dokumRuloDuzmu;
			return flag;
		}
		get ruloParam() {
			let result = this._ruloParam;
			if (result === undefined) {
				result = (this.ozelYetkiler || {}).ruloParam;
				if (result == null)
					result = this.param.ruloParam || {};
				this._ruloParam = result;
			}
			return result;
		}
		get ruloEkNotlar() {
			let result = this._ruloEkNotlar;
			if (result === undefined) {
				result = (this.ozelYetkiler || {}).ruloEkNotlar;
				if (result == null)
					result = this.param.ruloEkNotlar || {};
				this._ruloEkNotlar = result;
			}
			return result;
		}
		get ekOzellikKullanim() {
			let result = this._ekOzellikKullanim;
			if (result === undefined) {
				result = (this.ozelYetkiler || {}).ekOzellikKullanim;
				if (result == null)
					result = this.param.ekOzellikKullanim || {};
				this._ekOzellikKullanim = result;
			}
			return result;
		}
		get isyeri() {
			let result = this._isyeri;
			if (result === undefined) {
				result = (this.ozelYetkiler || {}).isyeri;
				if (result == null)
					result = this.param.isyeri || {};
				this._isyeri = result;
			}
			return result;
		}
		get tip2MatbuuFormDuzenleyiciler() {
			let result = this._tip2MatbuuFormDuzenleyiciler;
			if (result === undefined) {
				result = (this.ozelYetkiler || {}).tip2MatbuuFormDuzenleyiciler;
				if (result == null)
					result = this.param.tip2MatbuuFormDuzenleyiciler || {};
				this._tip2MatbuuFormDuzenleyiciler = result;
			}
			return result;
		}

		get tip2MatbuuFormDuzenleyiciler_runtime() {
			let result = this._tip2MatbuuFormDuzenleyiciler_runtime;
			if (result === undefined) {
				result = (this.ozelYetkiler || {}).tip2MatbuuFormDuzenleyiciler_runtime;
				if (result == null)
					result = this.param.tip2MatbuuFormDuzenleyiciler_runtime || {};
				this._tip2MatbuuFormDuzenleyiciler_runtime = result;
			}
			return result;
		}
		
		
		updateWSUrlBase(e) {
			this._wsURLBase = updateWSUrlBaseBasit($.extend({}, sky.config, { path: `ws/elterm${this.class.wsURLBase_postfix}/` }, getArgsForRandomPort({ port: sky.config.port }), e));
		}

		async ilkIslemler(e) {
			try { Utils.disableHistoryBack() }
			catch (ex) { }

			/*try {
				if (sky.globalCache)
					sky.globalCache.yukle(e);
			}
			catch (ex) { console.error(ex) }*/
			
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

			const {loadScriptsResultsPromise} = this;
			if (loadScriptsResultsPromise && loadScriptsResultsPromise.then) {
				loadScriptsResultsPromise.then(async result => {
					const {initCallbacks} = this;
					if (!$.isEmptyObject(initCallbacks)) {
						if (!$.isEmptyObject(this.promisesWait)) {
							try { await Promise.all(this.promisesWait) }
							finally { delete this.promisesWait }
						}
						
						for (let i in initCallbacks) {
							const _result = await initCallbacks[i];
							try {
								if (_result && $.isFunction(_result.run))
									await _result.run(e);
							}
							catch (ex) { defFailBlock(ex) }
						}

						this.afterRunVeMerkezdenBilgiYukleSonrasiOrtak(e);
					}
				})
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
			const timeouts = [500, 1000, 2000];
			for (const i in timeouts) {
				setTimeout(() => {
					hideProgress();
					((window.savedProcs || {}).hideProgress || hideProgress)();
				}, timeouts[i])
			}
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
				return;
			}

			await this.sonIslemler(e);
		}

		async afterRun(e) {
			await super.afterRun(e);
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
					activePart.geriIstendi({ event: evt });
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
					fisGiris: rootLayout.find('#cetFisGiris.part'),
					forkliftFisGiris: rootLayout.find('#cetForkliftFisGiris.part'),
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

			const islemTuslari = this.islemTuslari = layout.find('.islemTuslari');
			islemTuslari
				.addClass(`prog ${this.appName} ${this.rootAppName}`)
				.detach()
				.appendTo(this.header);
			const btnLogout = islemTuslari.find('#btnLogout');
			btnLogout
				.jqxButton({ theme: theme })
				// .jqxTooltip({ theme: theme, trigger: `hover`, content: `Oturum kapat` })
				.on('click', evt => this.logoutIstendi());
			const btnToggleFullScreen = this.btnToggleFullScreen = islemTuslari.find(`#btnToggleFullScreen`);
			btnToggleFullScreen.jqxButton({ theme: theme });
			btnToggleFullScreen.on('click', evt =>
				this.toggleFullScreen(e));
		}

		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);

			const {rootLayout} = this;
			const layout = e.layout || this.layout;

			const {indicatorPart} = this;
			if (indicatorPart)
				indicatorPart.initCallbacks();
			
			let menu = this.divAnaMenu = layout.find(`#anaMenu`);
			let items = menu.find(`.item`);
			if (!this.rotaKullanilirmi) {
				const li = items.filter(`#rotaListesi`);
				if (li.length)
					li.remove();
			}
			const cacheKeys = window.caches ? await window.caches.keys() : [];
			if ($.isEmptyObject(cacheKeys)) {
				const li = items.filter(`#cacheReset`);
				if (li.length)
					li.remove();
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
					.appendTo(this.layout);
			}
			
			await super.destroyLayout(e);
			// await this.cleanUpWidgets(e);
		}
		
		async activatePart(e) {
			await this.cleanUpWidgets(e);

			await super.activatePart(e);
		}

		ajaxSetup(e) {
			if (!this.programcimi)
				$.ajaxSetup({ timeout: 500000 });
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
				result[rec.kod] = rec.aciklama;
			}

			return result;
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
						: [	`fis.rowid rowid`,
							`'Uğrama' fisTipText`,
							`0 topKdv`, `0 fisSonuc`, `0 detaySayisi`,
							`fis.kayitzamani`, `fis.gonderildi`, `fis.silindi`, `fis.yazdirildi`, `fis.gecici`, `fis.rapor`, `'*' tamamlandi`,
							`'U' fistipi`, `'' piftipi`, `'' almsat`, `'' iade`, `'' ayrimtipi`, `'' ozelIsaret`, `fis.tarih`, `NULL vade`, `'' seri`, `0 fisno`,
							'fis.mustkod ticmustkod', /*'car.bakiye', 'car.riskli kalanRisk',*/ `'' efayrimtipi`, `'' zorunluguidstr`,
							`fis.mustkod`, 'car.unvan mustunvan', 'car.yore', 'car.ilKod', 'car.ilAdi', `car.efatmi`, `fis.fisaciklama`, `'' ba`
						  ])
				}));
			//}

			let ayrimTipiClause = '';
			const {uygunAyrimTipleri} = this;
			if (!$.isEmptyObject(uygunAyrimTipleri)) {
				for (const i in uygunAyrimTipleri) {
					const ka = uygunAyrimTipleri[i];
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
					{ alias: `fis`, leftJoin: `mst_Cari car`, on: `fis.mustkod = car.kod` }
				],
				where: [
					( ozelIsaretKullanilirmi
						? `1 = 1`
						: `fis.ozelIsaret = ''` ),
					( musteriDurumumu
						 ? `1 = 1`
						 : `fis.rapor = ''` )
				],
				sahalar: (rowCountOnly
					? `COUNT(*) sayi`
					: [	`fis.rowid rowid`,
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
						`fis.topKdv`, `fis.net fisSonuc`, `fis.detaykayitsayisi detaySayisi`,
						`fis.kayitzamani`, `fis.gonderildi`, `fis.silindi`, `fis.yazdirildi`, `fis.gecici`, `fis.rapor`, `fis.tamamlandi`,
						`fis.fistipi`, `fis.piftipi`, `fis.almsat`, `fis.iade`, `fis.ayrimtipi`, `fis.ozelIsaret`, `fis.tarih`, `fis.vade`, `fis.seri`, `fis.fisno`,
						`fis.ticmustkod`, /*, 'rcar.bakiye', 'rcar.riskli',*/ `fis.efayrimtipi`, `fis.zorunluguidstr`,
						`fis.mustkod`, `car.unvan mustunvan`, `car.yore`, `car.ilKod`, `car.ilAdi`, `car.efatmi`, `fis.fisaciklama`,
						`(case
								when (
									(fis.almsat = 'T' and fis.iade = '') OR
									(fis.almsat = 'A' and fis.iade = 'I')
								) then 'B'
								else
									'A'
							end) ba`
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
						: `fis.ozelIsaret = ''` ),
					( musteriDurumumu
						 ? `1 = 1`
						 : `fis.rapor = ''` )
				],
				sahalar: (e.rowCountOnly
					? `COUNT(*) sayi`
					: [	`fis.rowid rowid`,
						`'Tahsilat' fisTipText`,
						`0 topKdv`, `fis.toplamBedel fisSonuc`, `fis.detaykayitsayisi detaySayisi`,
						`fis.kayitzamani`, `fis.gonderildi`, `fis.silindi`, `fis.yazdirildi`, `fis.gecici`, `fis.rapor`, `'*' tamamlandi`,
						`'BT' fistipi`, `'' piftipi`, `'' almsat`, `'' iade`, `'' ayrimtipi`, `fis.ozelIsaret`, `fis.tarih`, `NULL vade`, `fis.seri`, `fis.fisno`,
						`fis.mustkod ticmustkod`, /*'car.bakiye', 'car.riskli kalanRisk',*/ `'' efayrimtipi`, `'' zorunluguidstr`,
						`fis.mustkod`, `car.unvan mustunvan`, `car.yore`, `car.ilKod`, `car.ilAdi`, `car.efatmi`, `fis.fisaciklama`, `'' ba`
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
							`NULL kayitzamani`, `'*' gonderildi`, `fis.silindi`, `'' yazdirildi`, `fis.gecici`, `fis.rapor`, `'*' tamamlandi`,
							`fis.fistipi`, `'' piftipi`, `'' almsat`, `'' iade`, `'' ayrimTipi`, `fis.ozelisaret ozelIsaret`, `fis.tarih`, `fis.vade`, `fis.seri`, `fis.fisno`,
							'fis.mustkod ticmustkod', /*'car.bakiye', 'car.riskli kalanRisk',*/ `'' efayrimtipi`, `'' zorunluguidstr`,
							`fis.mustkod`, `car.unvan mustunvan`, `car.yore`, `car.ilKod`, `car.ilAdi`, `car.efatmi`, `fis.refText fisaciklama`, `fis.ba`
						  ])
				}));
			}
		}

		rotaListe_fisIslemleri_stmSentDuzenle(e) {
			this.rotaListe_fisIslemleri_stmSentDuzenleDevam(e);
			this.rotaListe_fisIslemleri_stmSentDuzenleDevam_whereBagla(e);

			this.fisSinifOlanFisTipleri.forEach(rec =>
				rec.fisSinif.rotaListe_fisIslemleri_stmSentDuzenle(e));
		}

		rotaListe_fisIslemleri_stmSentDuzenleDevam(e) {
			const {ozelIsaretKullanilirmi} = this;
			const {uni, rowCountOnlyFlag} = e;

			uni.add(new MQSent({
				from: `data_PIFFis fis`,
				where: [
					( ozelIsaretKullanilirmi
						? `1 = 1`
						: `fis.ozelIsaret = ''` ),
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
						: `fis.ozelIsaret = ''` ),
					`fis.silindi = ''`, `fis.gecici = ''`, `fis.rapor = ''`
				],
				sahalar: (e.rowCountOnlyFlag
					? `COUNT(*) sayi`
					: [	'fis.mustkod mustKod', '0 topKdv',
							/* `SUM(fis.toplamBedel) fisSonuc`, */
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
				});
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
					`SUM(son.orjMiktar) orjMiktar`, `SUM(son.miktar) kalanMiktar`
				],
				groupBy: [`son.yerKod`, `stk.kod`]
			});
			if (detaylimi) {
				const {idSahalar} = CETEkOzellikler;
				if (!$.isEmptyObject(idSahalar)) {
					for (const i in idSahalar) {
						const idSaha = idSahalar[i];
						const aliasVeSaha = `son.${idSaha}`;
						sent.sahalar.add(aliasVeSaha);
						sent.groupBy.add(aliasVeSaha);
					}
				}
			}
			uni.add(sent);

			const {defaultPlasiyerKod, defaultYerKod} = this;
			let yerKod;
			if (!this.class.appMagazaVeyaSDMmi && defaultYerKod) {
				if (defaultPlasiyerKod)
					yerKod = defaultYerKod;
			}
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
				.addAll([`yerKod`, `aciklama`]);
		}

		rapor_sonStok_stmSentDuzenle(e) {
			this.rapor_sonStok_stmSentDuzenleDevam(e);

			this.fisSinifOlanFisTipleri.forEach(rec =>
				rec.fisSinif.rapor_sonStok_stmSentDuzenle(e));
		}

		rapor_sonStok_stmSentDuzenleDevam(e) {
			const {uni, stm} = e;
			const detaylimi = asBool(e.detayli || e.detaylimi);
			const sent = new MQSent({
				from: `mst_Stok stk`,
				where: [`stk.kod <> ''`],
				sahalar: [
					`son.yerKod`, `stk.kod stokKod`, `stk.aciklama stokAdi`, `stk.brm`,
					`SUM(son.orjMiktar) orjMiktar`, `SUM(son.miktar) kalanMiktar`
				],
				groupBy: [`son.yerKod`, `stk.kod`]
			});
			if (detaylimi) {
				const {idSahalar} = CETEkOzellikler;
				if (!$.isEmptyObject(idSahalar)) {
					for (const i in idSahalar) {
						const idSaha = idSahalar[i];
						const aliasVeSaha = `son.${idSaha}`;
						sent.sahalar.add(aliasVeSaha);
						sent.groupBy.add(aliasVeSaha);
					}
				}
			}
			uni.add(sent);

			const {defaultPlasiyerKod, defaultYerKod} = this;
			let yerKod;
			if (!this.class.appMagazaVeyaSDMmi && defaultYerKod) {
				if (defaultPlasiyerKod)
					yerKod = defaultYerKod;
			}
			/*uni.sentDo(sent => {
				if (yerKod)
					sent.where.degerAta(yerKod, `son.yerKod`);
				else
					sent.where.add(`son.yerKod <> ''`);
			})*/

			this.stmSentDuzenle_sonStokBagla({
				stm: stm, alias: `stk`, shKodClause: `stk.kod`,
				leftJoin: false, yerKod: yerKod || null,
				detaylimi: detaylimi
			});
			stm.orderBy
				.addAll([`yerKod`, `aciklama`]);
		}

		rapor_satislar_stmSentDuzenle(e) {
			this.rapor_satislar_stmSentDuzenleDevam(e);

			this.fisSinifOlanFisTipleri.forEach(rec =>
				rec.fisSinif.rapor_satislar_stmSentDuzenle(e));
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
			e.stm.orderBy.addAll(['aciklama']);
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
				where: [
					`son.orjMiktar > 0`
				],
				sahalar: (e.rowCountOnly
					? `COUNT(*) sayi`
					: [
						`NULL tarih`, `stk.grupKod`, `grp.aciklama grupAdi`,
						`son.stokKod`, `stk.aciklama stokAdi`,
						`(case when COALESCE(stk.brm, '') = '' then 'AD' else stk.brm end) brm`,
						`SUM(son.orjMiktar) devir`, `SUM(son.miktar) kalan`
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
						.degerAta(yerKod, `son.yerKod`)
				});
			}
			e.stm.orderBy
				.addAll([`tarih DESC`, `stokAdi`]);
		}

		rapor_gunSonuRaporu_stmSentDuzenle_miktarHesaplasma_satisHareketler(e) {
			this.rapor_gunSonuRaporu_stmSentDuzenleDevam_miktarHesaplasma_satisHareketler(e);

			this.fisSinifOlanFisTipleri.forEach(rec =>
				rec.fisSinif.rapor_gunSonuRaporu_stmSentDuzenle_miktarHesaplasma_satisHareketler(e));
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
					`fis.silindi = ''`, `fis.gecici = ''`, `fis.rapor = ''`,
					`har.miktar <> 0`,
					{ degerAta: yerKod, saha: `fis.yerkod` }
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
				rec.fisSinif.rapor_gunSonuRaporu_stmSentDuzenle_bedelHesaplasma_satisHareketler(e));
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
					`fis.silindi = ''`, `fis.gecici = ''`, `fis.rapor = ''`,
					`har.miktar <> 0`,
					{ degerAta: yerKod, saha: `fis.yerkod` }
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
					`fis.silindi = ''`, `fis.gecici = ''`, `fis.rapor = ''`, `fis.net <> 0`,
					`fis.piftipi IN ('F', 'I')`, `(fis.almsat = 'T' and fis.iade='')`
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
					uni.sentDo(sent => {
						for (const i in idSahalarSiparis) {
							const idSaha = idSahalarSiparis[i];
							const clause = `har.${idSaha}`;
							sent.sahalar.add(clause);
							sent.groupBy.add(clause);
						}
					});
				}
			}
			
			stm.orderBy
				.addAll([`almSat`, `tarih DESC`]);
		}

		stmSentDuzenle_sonStokBagla(e) {
			e = e || {};
			const {alias, yerKod} = e;
			let {shKodClause} = e;
			const leftJoinFlag = asBool(e.leftJoin);
			const detaylimi = asBool(e.detayli || e.detaylimi);
			// const yerKod = e.yerKod == null ? sky.app.defaultYerKod : e.yerKod;

			e.stm.sentDo(sent => {
				if (!sent.from.aliasIcinTable('son')) {
					if (shKodClause && $.isFunction(shKodClause))
						shKodClause = shKodClause.call(this, e);

					const detaySinif = (
						e.detaySinif ? e.detaySinif :
								((e.fis ? e.fis.class : e.fisSinif ? e.fisSinif : null) || {}).detaySinif
						) || CETStokTicariDetay;
					if (leftJoinFlag) {
						const onListe = [`${shKodClause} = son.stokKod`];
						if (yerKod)
							onListe.push(`son.yerKod = ${MQSQLOrtak.sqlDegeri(yerKod || '')}`);

						if (!detaylimi && detaySinif) {
							const ekOzelliklerIDSahalar = CETEkOzellikler.idSahalar;
							for (const i in ekOzelliklerIDSahalar) {
								const idSaha = ekOzelliklerIDSahalar[i];
								if (idSaha == 'yerKod' || idSaha == 'refRafKod')
									continue;
								onListe.push(`(son.${idSaha} IS NULL OR son.${idSaha} = '' OR son.${idSaha} = 0)`);
							}
						}
						
						sent.leftJoin({ alias: alias, leftJoin: 'mst_SonStok son', on: onListe.join(' AND ') });
					}
					else {
						const iliskiListe = [`${shKodClause} = son.stokKod`];
						if (yerKod)
							iliskiListe.push(`son.yerKod = ${MQSQLOrtak.sqlDegeri(yerKod || '')}`);
						sent.fromIliski({ from: `mst_SonStok son`, iliski: iliskiListe });
						sent.where.add(`son.miktar > 0`);

						if (!detaylimi && detaySinif) {
							const ekOzelliklerIDSahalar = CETEkOzellikler.idSahalar;
							for (const i in ekOzelliklerIDSahalar) {
								const idSaha = ekOzelliklerIDSahalar[i];
								if (idSaha == 'yerKod' || idSaha == 'refRafKod')
									continue;
								sent.where
									.add(`(son.${idSaha} IS NULL OR son.${idSaha} = '' OR son.${idSaha} = 0)`);
							}
						}
					}
				}
			});
			/*const aliasVeNokta = e.alias ? `${e.alias}.` : '';
			e.stm.sentDo(sent =>
				sent.where.add(`${aliasVeNokta}sonStok > 0`));*/
		}

		ortakReset(e) {
			$.extend(this, {
				ilkKMGirildimi: false, sonKMGirildimi: false,
				ilkIrsaliyeRaporuAlindimi: false
			});
			
			[	'_matbuuFormYapilari', '_grupKod2Adi', 'mustKod2KosulProYapilari',
				'_ekOzellikKullanim', '_isyeri', '_ruloParam', '_ruloEkNotlar',
				 '_tip2MatbuuFormDuzenleyiciler', '_tip2MatbuuFormDuzenleyiciler_runtime',
				 '_defaultTip2Renk'
			].forEach(key =>
				delete this[key]);
			
			['baslangicKod2Kural', 'ayrisimKurallari'].forEach(key =>
				delete CETBarkodParser_Kuralli[key]);
			
			const {caches, isDevMode} = this;
			if (caches) {
				for (let key in caches)
					delete caches[key];
				delete this.caches;
			}
			
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
			await this.initCaches(e);
			await Promise.all([
				/* this.numaratorleriYukle(e), */
				CETBarkodParser_Kuralli.barkodKurallariBelirle(),
				this.loadInitialCaches(),
				this.doInitialFetches()
			]);
		}

		initCaches(e) {
			this.caches = {
				mustKod2EkBilgi: {},
				stokKod2EkBilgi: {},
				subeKod2Rec: {},
				yerKod2Rec: {},
				plasiyerKod2Rec: {},
				nakSekliKod2Rec: {},
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
			for (let i in recs) {
				const rec = recs[i];
				cacheDict[rec.kod] = rec;
			}

			stm = new MQStm({
				sent: new MQSent({
					from: `mst_Yer yer`,
					where: [`yer.kod <> ''`],
					sahalar: [`yer.*`]
				})
			});
			recs = await dbMgr.executeSqlReturnRows({ tx: e.tx, query: stm });
			cacheDict = caches.yerKod2Rec;
			for (let i in recs) {
				const rec = recs[i];
				cacheDict[rec.kod] = rec;
			}

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
					from: `mst_TahsilSekli tsek`,
					where: [`tsek.kodNo > 0`],
					sahalar: [`tsek.*`]
				})
			});
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
			const urls = [
				`appBase/part/knobProgress.html`,
				`../app/prog/cetApp/data/cetDB_param_initSQL.sql`,
				`../app/prog/cetApp/data/cetDB_rom_data_initSQL.sql`,
				`./manifest.json`,
				`images/logout.png`,
				`images/sec.png`,
				`images/tamam.png`,
				`images/kaydet.png`,
				`images/yeni.png`,
				`images/degistir.png`,
				`images/sil.png`,
				`images/temizle.png`,
				`images/kopyala.png`
			];

			const promises = [];
			for (let i in urls) {
				const url = urls[i];
				promises.push(Utils.ajaxDoWithCache({ url: url }))
			}
			return await Promise.all(promises);
		}

		async prefetchUIs(e) {
			e = e || {};
			const {parent, tempLayout} = this;
			parent.css('opacity', .01);

			((window.savedProcs || {}).showProgress || showProgress)(null, null, 1, false);
			
			const fis = new CETSatisFaturaFis();
			if (fis.class.numaratorTip)
				await fis.numaratorOlustur();

			const fisGirisUIClassList = [CETFisGirisPart];
			if (this.class.appSDMmi)
				fisGirisUIClassList.push(CETForkliftFisGirisPart);
			else
				fisGirisUIClassList.push(CETFisGirisSonStoktanSecimPart);
			
			for (const i in fisGirisUIClassList) {
				const fisGirisUIClass = fisGirisUIClassList[i];
				const part = new fisGirisUIClass({
					prefetch: true, content: tempLayout,
					fis: fis
				});
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
			let barkod = (e.barkod || '').trim();
			if (!barkod)
				return null;
			
			let parser;
			if (barkod.length > 2) {
				let kural = await CETBarkodParser_Kuralli.kuralFor({ barkod: barkod, basKod: barkod.substring(0, 2) });
				if (kural) {
					parser = await kural.parseSonucu(e);
					if (parser)
						return parser;
				}
			}
			
			parser = new CETBarkodParser_Referans({ barkod: barkod });
			if (await parser.parse(e))
				return parser;
			
			return null;
		}
		
		
		async loadInitialScripts() {
			if (!navigator.onLine)
				return null;

			const {param} = this;
			const hostName = param.wsHostNameUyarlanmis;
			if (!hostName)
				return null;
			
			const promises = [];
			const ports = [8200, 81, 80, 82];
			for (let i in ports) {
				const port = ports[i];
				const urls = [];
				const hostNameSet = {};
				if (location.hostname != 'localhost' && location.hostname != '127.0.0.1') {
					urls.push(`http://${location.hostname}:${port}/cetapp.override.js`);
					hostNameSet[location.hostname] = true;
				}
				if (!(hostNameSet.localhost || hostNameSet['127.0.0.1'])) {
					urls.push(`http://localhost:${port}/cetapp.override.js`);
					hostNameSet.localhost = hostNameSet['127.0.0.1'] = true;
				}
				if (!hostNameSet[hostName] && (hostName != 'localhost' && hostName != '127.0.0.1')) {
					urls.push(`http://${hostName}:${port}/cetapp.override.js`);
					hostNameSet[hostName] = true;
				}
				
				let timeout = 2500;
				for (let j in urls) {
					const url = urls[j];
					lastAjaxObj = $.get({
						async: true,
						timeout: timeout,
						dataType: 'script',
						url: `${url}`
					});
					promises.push(lastAjaxObj);
					timeout += 200;
				}
			}
			
			if (navigator.onLine) {
				const results = [];
				for (let i in promises) {
					try {
						let result = await promises[i];
						if (result)
							results.push(result);
					}
					catch (ex) {
						if (this.showLoadErrorsFlag)
							console.error(ex)
					}
				}
				return results;
			}
			
			return null;
		}

		async tablolariTemizle(e) {
			e = e || {};
			const dbMgrKeys = e.dbMgrKeys || Object.keys(this.dbMgrs);
			for (let i in dbMgrKeys) {
				let key = dbMgrKeys[i];
				let dbMgr = this.dbMgrs[key];
				await dbMgr.transactionDo(async tx => {
					await this.knobProgressSetLabel('Yerel Veritabanı temizleniyor...');
					
					let query = `SELECT name FROM sqlite_master WHERE type = 'table' AND (name NOT LIKE '^_^_%' ESCAPE '^' AND name NOT LIKE 'sqlite^_%' ESCAPE '^')`;
					if (e.verilerSilinmesinFlag)
						query += ` AND (name LIKE '${this.dbTablePrefixes.master}%')`;
					let recs = await dbMgr.executeSqlReturnRows({ tx: tx, query: query });
					for (let i in recs) {
						let rec = recs[i];
						await dbMgr.executeSql({ tx: tx, query: `DROP TABLE ${rec.name}` });
					}
				});
			}
		}

		async tablolariOlustur(e) {
			e = e || {};
			let {tx} = e;
			const hasTx = !!tx;
			
			const dbMgrKeys = e.dbMgrKeys || Object.keys(this.dbMgrs);
			for (let i in dbMgrKeys) {
				const key = dbMgrKeys[i];
				const dbMgr = this.dbMgrs[key];
				
				await this.knobProgressSetLabel(
					`Tablolar tanımları okunuyor (<span style="color: #555;"><i>${key.toUpperCase()}</i></span>)...`
				);
				let queryText = await Utils.ajaxDoWithCache({
					url: `../app/prog/cetApp/data/cetDB_${key}_initSQL.sql`,
					dataType: 'text'
				});
				queryText = (queryText || {}).text ? await queryText.text() : await(queryText.response ? queryText.response.responseText : queryText);
				let queries = [];
				const _queryTextListe = queryText.split(';');
				for (const i in _queryTextListe) {
					let query = _queryTextListe[i];
					query = query ? query.trim() : null;
					if (!query)
						continue;
					
					if (query)
						queries.push(query);
				}
				await this.knobProgressStep();

				if (!hasTx)
					tx = await dbMgr.getTx();
				await this.knobProgressSetLabel(
					`Tablolar oluşturuluyor (<span style="color: #555;"><i>${key.toUpperCase()}</i></span>)...`
				);
				if (!$.isEmptyObject(queries)) {
					for (let i in queries) {
						let query = queries[i];
						try {
							await dbMgr.executeSql({ tx: tx, query: query })
						}
						catch (ex) {
							debugger;
						}
					}
				}
				if (!hasTx)
					tx = await dbMgr.getTx();
				await this.knobProgressStep(3);
			}
		}

		async tabloEksikleriTamamla(e) {
			e = e || {};
			const dbMgr = e.dbMgr || this.dbMgr_mf;
			let {tx} = e;
			const hasTx = !!tx;
			await this.knobProgressSetLabel(`Tablo eksikleri araştırılıyor...`);
			const islemler = this.tabloEksikIslemYapi;
			
			let lastResult;
			const temps = {};
			let degistimi = false, kosulluDegisiklikOldumu = false;
			for (const i in islemler) {
				const _e = $.extend({}, e, { dbMgr: dbMgr, tx: tx, lastResult: lastResult, temps: temps });
				const islemYapi = islemler[i];

				if (!hasTx)
					tx = e.tx = _e.tx = await dbMgr.getTx();
				
				let uygunmu = true;
				let kosulluDegisiklikmi = false;
				const {kosul} = islemYapi;
				if (kosul) {
					if ($.isFunction(kosul))
						uygunmu = await kosul.call(this, _e);
					else if (kosul.run)
						uygunmu = await kosul.run(_e);
					kosulluDegisiklikmi = true;
				}
				tx = e.tx = _e.tx;
				if (!uygunmu)
					continue;

				const {queries, action} = islemYapi;
				if (!$.isEmptyObject(queries)) {
					for (const j in queries) {
						const query = queries[j];
						try {
							await dbMgr.executeSql({ tx: tx, query: query });
							degistimi = true;
							if (kosulluDegisiklikmi)
								kosulluDegisiklikOldumu = true;
						}
						catch (ex) {
							console.error('tabloEksikleriTamamla', i, 'queries', query, ex);
							debugger;
						}
					}
				}

				if (action) {
					try {
						if ($.isFunction(action))
							lastResult = await action.call(this, _e);
						else if (kosul.run)
							lastResult = await action.run(_e);

						degistimi = true;
						if (kosulluDegisiklikmi)
							kosulluDegisiklikOldumu = true;
					}
					catch (ex) {
						lastResult = ex;
						console.error('tabloEksikleriTamamla', i, 'action', ex);
						debugger;
					}
				}
				await this.knobProgressStep();
			}
			if (!hasTx)
				tx = e.tx = await dbMgr.getTx();

			if (degistimi) {
				const cacheKeys = window.caches ? await window.caches.keys() : [];
				const cacheSize = cacheKeys.length;
				if (cacheSize)
					this.onbellekSilIstendi()
			}
		}

		async gonderilecekBilgiler(e) {
			e = e || {};
			const dbMgr = e.dbMgr || this.dbMgr_mf;
			const {tx} = e;
			
			let {bilgiGonderTableYapilari} = e;
			if (!bilgiGonderTableYapilari)
				bilgiGonderTableYapilari = this.bilgiGonderTableYapilari;

			const table2Info = {};
			const result = { totalCount: 0, table2Info: table2Info };
			if ($.isEmptyObject(bilgiGonderTableYapilari))
				return result;

			// await this.knobProgressSetLabel(`Belgeler taranıyor...`);
			const fetchBlock = async e => {
				let rs = await dbMgr.executeSql({ tx: e.tx || tx, query: e.query });
				for (let i = 0; i < rs.rows.length; i++) {
					const table = e.table || rec._table;
					const rec = rs.rows[i];
					const info = table2Info[table] = table2Info[table] || { count: 0 };
					info.count++;
					result.totalCount++;
				}
				await this.knobProgressStep(3);
			};

			const table2Recs = {};
			for (const i in bilgiGonderTableYapilari) {
				const tableYapi = bilgiGonderTableYapilari[i];
				const fisIDListe = tableYapi.fisIDListe;
				const baslikTable = tableYapi.baslik;
				let sent = new MQSent({
					from: baslikTable,
					where: [`gonderildi = ''`, `gecici = ''`],
					sahalar: [`'${baslikTable}' _table`, `'fis' _tip`, `rowid`, `*`]
				});
				if (fisIDListe)
					sent.where.inDizi(fisIDListe, `rowid`);
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
					for (const j in tanimTablolar) {
						const table = tanimTablolar[j];
						let sent = new MQSent({
							from: table,
							where: [`gonderildi=''`],
							sahalar: [`'${table}' _table`, `'tanim' _tip`, `rowid`, `*`]
						});
						await fetchBlock({ table: table, query: new MQStm({ sent: sent }) });
					}
				}
			}

			return result;
		}
		
		async merkezdenBilgiYukle(e) {
			e = $.extend({}, e);
			const {isDevMode} = this;
			const {silent, verilerSilinmesinFlag} = e;

			const table2TipAdi = {
				data_PIFFis: `Belge`,
				data_TahsilatFis: `Tahsilat Fişi`,
				data_UgramaFis: `Uğrama Fişi`
				// mst_Cari: `Yeni Cari Tanım`
			}
			
			if (!silent && !verilerSilinmesinFlag) {
				const gonderilecekBilgiler = await this.gonderilecekBilgiler(e);
				if (gonderilecekBilgiler && gonderilecekBilgiler.totalCount) {
					const {table2Info} = gonderilecekBilgiler;
					let bilgiText = '';
					for (const table in table2Info) {
						if (!table2TipAdi[table])
							continue;
						
						const info = table2Info[table];
						const {count} = info;
						if (count) {
							const tipAdi = table2TipAdi[table] || table;
							if (bilgiText)
								bilgiText += ', ';
							bilgiText += `${count.toLocaleString()} adet ${tipAdi}`;
						}
					}
					
					if (bilgiText) {
						let result;
						if (this.silerekBilgiAlYapilirmi) {
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
									`<p>Lütfen önce <b>Verileri Gönder</b> işlemini yapınız</p>`
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
				
				result = await this.merkezdenBilgiYukleDevam(e);
				await this.merkezdenBilgiYukleSonrasi(e);
			}
			catch (ex) {
				hideProgress();
				((window.savedProcs || {}).hideProgress || hideProgress)();

				if (ex.statusText)
					displayServerResponse(ex);
				else
					displayMessage(ex.errorText || (ex || '').toString(), `${ex.isError ? '@' : '!'} Merkezden Bilgi Alımı ${ex.isError ? '@' : '!'}`)	
				throw ex;
			}
			finally {
				if (savedProgressMaxValue != null && savedProgressMaxValue != progressMaxValue &&
							knobProgressPart && knobProgressPart.progress && knobProgressPart.progress.length)
					knobProgressPart.progress.jqxKnob('max', savedProgressMaxValue);
			}

			return result;
		}

		async merkezdenBilgiYukleDevam(e) {
			e = e || {};
			this.prefetchAbortedFlag = true;

			const {isDevMode} = this;
			const {appMagazaVeyaSDMmi} = this.class;
			const {dbMgrKeys, dbMgr, verilerSilinmesinFlag} = e;
			const dbMgr_param = this.dbMgrs.param;
			let wsFetches = e.wsFetches = {};
			let islemAdi, _rec, recs, subCount, hvListe;
			
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
			
			const _param = this.param;
			const param = this.param = new this.param.class();
			param.class.sabitAttrListe.forEach(key => {
				let value = _param[key];
				if (value != null)
					param[key] = value;
			});
			$.each(_rec, (key, value) => {
				if (value != null)
					param[key] = value;
			});
			await param.kaydet();
			delete this._ekOzellikKullanim;

			let {tx} = e;
			const _e = $.extend({}, e, { tx: tx, dbMgrKeys: dbMgrKeys, verilerSilinmesinFlag: verilerSilinmesinFlag });
			await this.tablolariTemizle(_e);
			delete _e.verilerSilinmesinFlag;
			await this.tablolariOlustur(_e);
			tx = e.tx = _e.tx;

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
					kod: rec.kod, aciklama: rec.aciklama || ''
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
			if (appMagazaVeyaSDMmi)
				wsFetches.yerRafListe = this.wsYerRafListe();
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
				});
			}


			islemAdi = 'Stok Grup listesi';
			$.extend(wsFetches, {															// next prefetch
				barkodReferans: this.wsBarkodReferansListe(),
				tartiBarkodKuralListe: this.wsTartiBarkodKuralListe(),
				ayrisimBarkodKuralListe: this.wsAyrisimBarkodKuralListe()
			});
			if (ozelKampanyaKullanilirmi)
				wsFetches.ozelKampanyaListe = this.wsOzelKampanyaListe();
			recs = await this.fetchWSRecs({ source: wsFetches.stokGrup, islemAdi: islemAdi, step: 1 });
			// subCount = asInteger(recs.length / 2);
			subCount = 1;
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			
			hvListe = [];
			recs.forEach(rec => {
				hvListe.push({ kod: rec.kod, aciklama: rec.aciklama || '' });
			});
			await dbMgr.insertOrReplaceTable({
				table: 'mst_StokGrup', mode: 'insertIgnore', hvListe: hvListe,
				parcaCallback: e => {
					if (e.index % subCount == 0)
						this.knobProgressStep();
				}
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


			islemAdi = 'Tahsil Şekli listesi';
			$.extend(wsFetches, {														// next prefetch
				cariRiskVeBakiyeListe: this.wsCariRiskVeBakiyeListe()
			});
			recs = await this.fetchWSRecs({ source: wsFetches.tahsilSekli, islemAdi: islemAdi, step: 2 });
			// subCount = asInteger(recs.length / 3);
			subCount = 6;
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			
			hvListe = [];
			recs.forEach(rec => {
				let uygunmu = asBool(rec.elterkullan) && !((rec.tahsiltipi == 'PS' || rec.tahsiltipi == 'P') && asBool(rec.posisaret));
				if(uygunmu) {
					hvListe.push({
						kodNo: asInteger(rec.kodno), aciklama: rec.aciklama || '',
						tahsilTipi: rec.tahsiltipi, tahsilAltTipi: rec.ahalttipi || ''
					});
				}
			});
			await dbMgr.insertOrReplaceTable({
				table: 'mst_TahsilSekli', mode: 'insertIgnore', hvListe: hvListe,
				parcaCallback: e => {
					if (e.index % subCount == 0)
						this.knobProgressStep();
				}
			});


			islemAdi = 'Cari Risk ve Bakiye listesi';
			$.extend(wsFetches, {														// next prefetch
				cari: this.wsCariListe()
			});
			recs = await this.fetchWSRecs({ source: wsFetches.cariRiskVeBakiyeListe, islemAdi: islemAdi, step: 1 });
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


			islemAdi = 'Cari listesi';
			$.extend(wsFetches, {															// next prefetch
				stok: this.wsStokListe()
			});
			recs = await this.fetchWSRecs({ source: wsFetches.cari, islemAdi: islemAdi, step: 10 });
			subCount = asInteger(recs.length / 8);
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			hvListe = [];
			recs.forEach(rec => {
				const {kod} = rec;
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

				let hv = {
					kod: kod, seq: asInteger(rec.seq), gonderildi: '*', tipKod: rec.tipkod || '', herGunmu: bool2Int(rec.hermi),
					rotaDisimi: bool2Int(rec.rotadisimi), rotaIciSayi: asInteger(rec.rotaicisayi), rotaDevreDisimi: bool2Int(rec.rotaDevreDisimi),
					efatmi: bool2Int(rec.efaturakullanirmi || rec.efatmi), matbuuStokRefYazilirmi: bool2Int(rec.etmatbuustokrefyazmi),
					stkFytInd: asInteger(rec.stkfytind) || 0,
					email: rec.email || '', tel1: rec.tel1 || '', tel2: rec.tel2 || '', tel3: rec.tel3 || '',
					yore: rec.yore || '', posta: rec.posta || '', ilKod: rec.ilkod || '', ilAdi: rec.iladi || '',
					bolgeKod: rec.bolgekod || '', bolgeAdi: rec.bolgeadi || '', vergiDaire: rec.vdaire || '', sahismi: bool2Int(rec.sahismi),
					vkn: rec.vkno || ((asBool(rec.sahismi) ? rec.tckimlikno : rec.vnumara) || ''), konTipKod: rec.kontipkod || '', konSubeAdi: rec.konsubeadi || '',
					riskCariKod: rec.rcarkod || '', plasiyerKod: rec.plasiyerkod || '', kosulGrupKod: rec.kosulgrupkod || '', kdvDurumu: rec.kdvdurumu || '',
					/*satisFisTipi: rec.satisfistipi || '',*/ /*fiyatListeKod: rec.fiyatlistekod || '',*/ stokFiyatInd: rec.stokfiyatind || '',
					stdDipIskOran: asFloat(rec.stddipiskoran) || 0,
					bakiye: bedel(rec.bakiye) || 0, riskLimiti: bedel(rec.risklimiti) || 0, riskli: bedel(rec.riskli) || 0,
					takipBorcLimiti: bedel(rec.takipborclimiti) || 0, takipBorc: bedel(rec.takipborc) || 0,
					konumLongitude: asFloat(rec.konumLongitude) || 0, konumLatitude: asFloat(rec.konumLatitude) || 0, konumAccuracy: asFloat(rec.konumAccuracy) || 0,
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
			});
			await dbMgr.insertOrReplaceTable({
				table: 'mst_Cari', mode: 'insertIgnore', hvListe: hvListe,
				parcaCallback: e => {
					if (e.index % subCount == 0)
						this.knobProgressStep();
				}
			});

			await this.merkezdenBilgiYukleDevam_ekOzellikler(e);

			const ekOzellikIDSahalar = CETEkOzellikler.idSahalar;
			$.extend(wsFetches, {															// next prefetch
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
			recs = await this.fetchWSRecs({ source: wsFetches.stok, islemAdi: islemAdi, step: 13 });
			subCount = asInteger(recs.length / 5);
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			
			hvListe = [];
			let hvListe_sonStok = [];
			recs.forEach(rec => {
				const sonStok = (sicakTeslimFisimi ? asFloat(rec.sonmiktar || rec.miktar || rec.sonstok) : null) || 0;
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
					tartiReferans: rec.tartireferans || '', /*resimKodu: rec.resimkodu || '',*/
					paketIciAdet: asFloat(rec.koliici) || 0, paketIciAdet2: asFloat(rec.koliici2) || 0,
					/*satFiyatMiktarTipi: rec.satfiyatmiktartipi, almFiyatMiktarTipi: rec.almfiyatmiktartipi,*/
					brmFiyat: asFloat(rec.brmfiyat) || 0, fiyatGorFiyati: asFloat(rec.fiyatgorfiyati) || 0,
					almFiyat: asFloat(rec.almfiyat) || 0, almNetFiyat: asFloat(rec.almnetfiyat) || 0,
					satFiyat1: asFloat(rec.satfiyat1) || 0, satFiyat2: asFloat(rec.satfiyat2) || 0, satFiyat3: asFloat(rec.satfiyat3) || 0,
					satFiyat4: asFloat(rec.satfiyat4) || 0, satFiyat5: asFloat(rec.satfiyat5) || 0, satFiyat6: asFloat(rec.satfiyat6) || 0,
					satFiyat7: asFloat(rec.satfiyat7) || 0,
					satirIskOranSinirVarmi: bool2Int(satirIskOranSinirVarmi),
					satirIskOranSinir: satirIskOranSinir || 0
				});
				if (sonStok)
					hvListe_sonStok.push({ stokKod: rec.kod, yerKod: rec.yerkod || '', orjMiktar: sonStok, miktar: sonStok });
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
				recs = await this.fetchWSRecs({ source: wsFetches.sonStok, islemAdi: islemAdi, step: 15 });
				subCount = asInteger(recs.length / 3);
				await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
				hvListe = [];
				recs.forEach(rec => {
					const miktar = asFloat((rec.sonmiktar || rec.miktar || rec.sonStok) || 0);
					if (miktar) {
						const hv = {
							stokKod: rec.stokkod, yerKod: rec.yerkod || '',
							orjMiktar: miktar, miktar: miktar
						};
						if (!$.isEmptyObject(ekOzellikIDSahalar)) {
							const Prefix_EkOz = `ekOz_`;
							for (const i in ekOzellikIDSahalar) {
								const idSaha = ekOzellikIDSahalar[i];
								const recAttr = idSaha.startsWith(Prefix_EkOz) ? idSaha.replace(Prefix_EkOz, 'ekoz') : idSaha;
								let value = rec[recAttr.toLowerCase()];			// !! idSaha lowercase olacak !!
								hv[idSaha] = value || '';
							}
						}
						hvListe.push(hv);
					}
				});
				await dbMgr.insertOrReplaceTable({
					table: 'mst_SonStok', mode: 'insertIgnore', hvListe: hvListe,
					parcaCallback: e => {
						if (e.index % subCount == 0)
							this.knobProgressStep();
					}
				});
			}
			
			if (appMagazaVeyaSDMmi) {
				$.extend(wsFetches, {															// next prefetch
					bekleyenSiparisler: this.wsBekleyenSiparisler()
				});
			}
			
			await this.merkezdenBilgiYukleDevam_promosyon(e);
			
			islemAdi = 'Barkod Referans listesi';
			recs = await this.fetchWSRecs({ source: wsFetches.barkodReferans, islemAdi: islemAdi, step: 12 });
			subCount = asInteger(recs.length / 8);
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			
			hvListe = [];
			recs.forEach(rec => {
				var hv = {
					refKod: rec.refkod, stokKod: rec.stokkod, varsayilanmi: bool2Int(rec.varsayilan),
					koliBarkodmu: bool2Int(rec.bkolibarkodmu), paketKod: rec.paketkod || '', koliIci: asFloat(rec.koliici) || 0
				};
				/*if (!$.isEmptyObject(ekOzellikIDSahalar)) {
					const Prefix_EkOz = `ekOz_`;
					for (const i in ekOzellikIDSahalar) {
						const idSaha = ekOzellikIDSahalar[i];
						const recAttr = idSaha.startsWith(Prefix_EkOz) ? idSaha.replace(Prefix_EkOz, 'ekoz') : idSaha;
						let value = rec[recAttr.toLowerCase()];			// !! idSaha lowercase olacak !!
						hv[idSaha] = value || '';
					}
				}*/
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
			recs = await this.fetchWSRecs({ source: wsFetches.tartiBarkodKuralListe, islemAdi: islemAdi, step: 2 });
			subCount = asInteger(recs.length / 20);
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			
			hvListe = [];
			recs.forEach(rec => {
				hvListe.push({
					kod: rec.kod || rec.id, aciklama: rec.aciklama || '',
					stokBas: asInteger(rec.stokbas), stokHane: asInteger(rec.stokhane),
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
			recs = await this.fetchWSRecs({ source: wsFetches.ayrisimBarkodKuralListe, islemAdi: islemAdi, step: 2 });
			subCount = asInteger(recs.length / 20);
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			
			hvListe = [];
			recs.forEach(rec => {
				const hv = {
					kod: rec.kod || rec.id, aciklama: rec.aciklama || '',
					formatTipi: rec.formattipi || '', bosFormat: rec.bosformat || '',
					ayiracSayi: asInteger(rec.ayiracsayi) || 0, ayiracStr: rec.ayiracstr || '',
					barkodBas: rec.barkodbas, barkodHane: rec.barkodhane,
					stokBas: rec.stokbas || 0, stokHane: rec.stokhane || 0,
					stokBaslangicdanmi: bool2Int(rec.stokBaslangicdanmi),
					miktarBas: rec.miktarbas || 0, miktarHane: rec.miktarhane || 0,
					// fiyatBas: rec.fiyatbas || 0, fiyatHane: rec.fiyathane || 0,
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
				hvListe.push(hv);
			});
			await dbMgr.insertOrReplaceTable({
				table: 'mst_BarAyrisim', mode: 'insertIgnore', hvListe: hvListe,
				parcaCallback: e => {
					if (e.index % subCount == 0)
						this.knobProgressStep();
				}
			});


			if (appMagazaVeyaSDMmi) {
				recs = null;
				try {
					recs = await this.fetchWSRecs({ source: wsFetches.bekleyenSiparisler, islemAdi: islemAdi, step: 20 });
				}
				catch (ex) {
					console.warn({ isError: true, rc: `wsIletisim`, locus: `bekleyenSiparisler`, errorText: ex.responseJSON || ex });
				}

				if (recs) {
					islemAdi = 'Bekleyen Siparişler';
					subCount = asInteger(recs.length / 8);
					await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);

					hvListe = [];
					const {idSahalarSiparis} = CETEkOzellikler;
					recs.forEach(rec => {
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
							for (const i in idSahalarSiparis) {
								const idSaha = idSahalarSiparis[i];
								const recAttr = idSaha.startsWith(Prefix_EkOz) ? idSaha.replace(Prefix_EkOz, 'ekoz') : idSaha;
								let value = rec[recAttr.toLowerCase()];			// !! idSaha lowercase olacak !!
								hv[idSaha] = value || '';
							}
						}
						hvListe.push(hv);
					});
					await dbMgr.insertOrReplaceTable({
						table: 'data_BekleyenSiparisler', mode: 'insertIgnore', hvListe: hvListe,
						parcaCallback: e => {
							if (e.index % subCount == 0)
								this.knobProgressStep();
						}
					});
				}
			}


			const {oncekiFislerGosterilmezmi} = this;
			if (!oncekiFislerGosterilmezmi) {
				$.extend(wsFetches, {															// next prefetch
					oncekiFisler: this.wsOncekiFisler()
				});
			}
			islemAdi = 'Fiş Şablon listesi';
			recs = await this.fetchWSRecs({ source: wsFetches.fisSablon, islemAdi: islemAdi, step: 5 });
			// subCount = asInteger(recs.length / 3);
			subCount = 8;
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);


			if (!oncekiFislerGosterilmezmi) {
				await (async () => {
					islemAdi = 'Önceki Belgeler';
					/*$.extend(wsFetches, {															// next prefetch
						oncekiFisler: this.wsOncekiFisler()
					});*/
					recs = await this.fetchWSRecs({ source: wsFetches.oncekiFisler, islemAdi: islemAdi, step: 5 });
					// subCount = asInteger(recs.length / 3);
					subCount = 8;
					await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
		
					const removeAttrList = ['_table', '_harTable', 'har_fissayac', 'fissayac', 'fisSayac', 'kaysayac', 'kaySayac'];
					let table2VioID2RowID = {};
					const hasTx = !!e.tx;
					let tx = await dbMgr.getTx({ tx: e.tx });
		
					const deletedTablesSet = {};
					const PrefixFis = 'fis_';
					for (let i in recs) {
						const rec = recs[i];
						const table = rec._table;
						if (!table)
							continue;
						
						const vioID = rec.fissayac || rec.fisSayac;
						const vioID2RowID = table2VioID2RowID[table] = table2VioID2RowID[table] || {};
						if (!vioID2RowID[vioID]) {
							const hv = { rapor: '*', gonderildi: '*' };
							for (let key in rec) {
								const value = rec[key];
								if (value != null && key.startsWith(PrefixFis)) {
									key = key.substr(PrefixFis.length);
									hv[key] = value;
								}
							}
							for (const i in removeAttrList)
								delete hv[removeAttrList[i]];
		
							if (!deletedTablesSet[table]) {
								const del = new MQIliskiliDelete({
									from: table,
									where: [`rapor <> ''`]
								});
								await dbMgr.executeSql({ tx: tx, query: del });
								deletedTablesSet[table] = true;
							}
		
							try {
								await dbMgr.insertOrReplaceTable({
									table: table, mode: 'insertIgnore',
									tx: tx, hv: hv, parcaSize: 20,
									parcaCallback: e => {
										const insertId = (e.rs || {}).insertId;
										if (insertId)
											vioID2RowID[vioID] = insertId;
										if (e.index % subCount == 0)
											this.knobProgressStep();
									}
								});
							}
							catch (ex) { console.error('oncekiFisler', 'insertTable', 'baslik', ex) }
						}
					}
		
					const harTable2HVListe = [], harTable2FisTable = {};
					const table2RowID2SonSeq = {};
					for (let i in recs) {
						const rec = recs[i];
						const table = rec._table;
						const harTable = rec._harTable;
						if (!harTable)
							continue;
		
						if (table && !harTable2FisTable[harTable])
							harTable2FisTable[harTable] = table;
						
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
									hv[key] = value = Math.abs(value);
							}
						}
						
						const hv = {};
						for (let key in rec) {
							let value = rec[key];
							if (value != null && !key.startsWith(PrefixFis))						
								hv[key] = value;
						}
						for (const i in removeAttrList)
							delete hv[removeAttrList[i]];
						if (rowID)
							hv.fissayac = rowID;
						hv.seq = seq;
						hvListe.push(hv);
					}
					
					for (const harTable in harTable2HVListe) {
						if (!deletedTablesSet[harTable]) {
							const table = harTable2FisTable[harTable];
							if (table) {
								const del = new MQIliskiliDelete({
									from: `${harTable}`,
								});
								if (table) {
									del.where
										.add(`fissayac IN (SELECT rowid fissayac FROM ${table} WHERE rapor <> '')`);
								}
								await dbMgr.executeSql({ tx: tx, query: del });
								deletedTablesSet[harTable] = true;
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
											this.knobProgressStep();
									}
								});
							}
							catch (ex) { console.error('oncekiFisler', 'insertTable', 'baslik', ex) }
						}
					}
					// if (!hasTx)
					// 		await dbMgr.getTx();
				})();
			}
			
			await (async () => {
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
								const insertId = (e.rs || {}).insertId;
								if (insertId)
									vioID2RowID[anahStr] = insertId;
								
								if (e.index % subCount == 0)
									this.knobProgressStep();
							}
						});
					}
				}

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

			await this.merkezdenBilgiYukleDevam_satisKosullari(e);
		}

		async merkezdenBilgiYukleDevam_ekOzellikler(e) {
			const {dbMgr, wsFetches} = e;
			const {tip2EkOzellik} = this;
			let islemAdi, recs, subCount, hvListe;

			$.extend(wsFetches, {
				// _ozellik: {},
				_ozellik: this.wsOzellikListe(),
				model: this.wsModelListe(),
				renk: this.wsRenkListe(),
				desen: this.wsDesenListe(),
			});

			const tip2EkOzellikRecs = e.tip2EkOzellikRecs = {};
			islemAdi = 'Ek Özellikler';
			recs = await this.fetchWSRecs({ source: wsFetches._ozellik, islemAdi: islemAdi, step: 1 });
			for (const i in recs) {
				const rec = recs[i];
				const {tip} = rec;
				const _recs = tip2EkOzellikRecs[tip] = tip2EkOzellikRecs[tip] || [];
				_recs.push(rec);
			}

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
				
				islemAdi = tipAdi;
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
					for (const i in hmrTables) {
						const hmrTable = hmrTables[i];
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
					for (const i in queries) {
						const query = queries[i];
						try { await dbMgr.executeSql({ query: query }) }
						catch (ex) { console.warn('-ignorable-', 'auto db update', ex, { query: query } ) }
						this.knobProgressStep(2);
					}
				}
				
				const source = wsFetches[tip] || tip2EkOzellikRecs[tip];
				recs = source ? await this.fetchWSRecs({ source: source, islemAdi: islemAdi, step: 1 }) : null;
				if (!$.isEmptyObject(recs)) {
					subCount = asInteger(recs.length / 10);
					await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);

					hvListe = [];
					for (const i in recs) {
						const rec = recs[i];
						const hv = {};
						if (!kodsuzmu)
							hv[mbKodSaha] = (rec[mbKodSaha] == null ? rec[mbKodSaha.toLowerCase()] : rec[mbKodSaha]);
						if (!sadeceKodmu)
							hv[mbAdiSaha] = (rec[mbAdiSaha] == null ? rec[mbAdiSaha.toLowerCase()] : rec[mbAdiSaha]);
						if (!$.isEmptyObject(hv))
							hvListe.push(hv);
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

			const hmrSahaListe_pifStokHaric = hmrSahaListe.filter(idSaha => idSaha != 'refRafKod');
			const queries = [];
			if (!$.isEmptyObject(hmrSahaListe_pifStokHaric)) {
				const tables = ['mst_SonStok' /*, 'data_BekleyenSiparisler'*/];
				for (const i in tables) {
					const table = tables[i];
					const idxName = `idx${table}2Asil`;
					queries.push(`DROP INDEX IF EXISTS ${idxName}`);
					queries.push(`CREATE UNIQUE INDEX IF NOT EXISTS ${idxName} ON ${table} (${hmrSahaListe_pifStokHaric.join(', ')})`);
				}
			}
			
			if (!$.isEmptyObject(queries)) {
				await this.knobProgressSetLabel(`Veritabanı yapısı düzenleniyor...`);
				for (const i in queries) {
					const query = queries[i];
					try { await dbMgr.executeSql({ query: query }) }
					catch (ex) { console.warn('-ignorable-', 'auto db update (global)', ex, query) }
					this.knobProgressStep(2);
				}
			}
			
			
			/*islemAdi = 'Model listesi';
			recs = await this.fetchWSRecs({ source: wsFetches.model, islemAdi: islemAdi, step: 1 });
			subCount = asInteger(recs.length / 10);
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);

			hvListe = [];
			recs.forEach(rec => {
				hvListe.push({
					kod: rec.kod, aciklama: rec.aciklama || ''
				});
			});
			await dbMgr.insertOrReplaceTable({
				table: 'mst_Model', mode: 'insertIgnore', hvListe: hvListe,
				parcaCallback: e => {
					if (e.index % subCount == 0)
						this.knobProgressStep();
				}
			});

			islemAdi = 'Renk listesi';
			recs = await this.fetchWSRecs({ source: wsFetches.renk, islemAdi: islemAdi, step: 1 });
			subCount = 5;
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);

			hvListe = [];
			recs.forEach(rec => {
				hvListe.push({
					kod: rec.kod, aciklama: rec.aciklama || ''
				});
			});
			await dbMgr.insertOrReplaceTable({
				table: 'mst_Renk', mode: 'insertIgnore', hvListe: hvListe,
				parcaCallback: e => {
					if (e.index % subCount == 0)
						this.knobProgressStep();
				}
			});

			islemAdi = 'Desen listesi';
			recs = await this.fetchWSRecs({ source: wsFetches.desen, islemAdi: islemAdi, step: 1 });
			subCount = 5;
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);

			hvListe = [];
			recs.forEach(rec => {
				hvListe.push({
					kod: rec.kod, aciklama: rec.aciklama || ''
				});
			});
			await dbMgr.insertOrReplaceTable({
				table: 'mst_Desen', mode: 'insertIgnore', hvListe: hvListe,
				parcaCallback: e => {
					if (e.index % subCount == 0)
						this.knobProgressStep();
				}
			});*/
		}

		async merkezdenBilgiYukleDevam_satisKosullari(e) {
			const {dbMgr, wsFetches} = e;
			const {tip2EkOzellik, iskSayi} = this;
			
			let islemAdi = 'Satış Koşulları';
			// wsFetches. ...  = this.ws ... Liste();
			let kosulYapilari = await this.fetchWSRecs({ source: wsFetches.satisKosullari, islemAdi: islemAdi, step: 18 });
			if (!kosulYapilari)
				return false;
			delete kosulYapilari.isError;
			
			let subCount = 0;
			Object.values(kosulYapilari).forEach(liste =>
				subCount += liste.length);
			subCount = subCount / 10;
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			
			let hvListe = [];
			const mustKod2HVListe = {}, detayTip2Kod2HVListe = {};
			$.each(kosulYapilari, (kosulTip, kosulListe) => {
				kosulListe.forEach(kosul => {
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
						hv[`${e.rowAttr}Sonu`] = convertedValue({ converter: e.converter, value: (kapsamSecimler[e.ioAttr] || {}).sonu }) || '';
					};
					bsEkle({ rowAttr: 'tarih', ioAttr: 'tarih',
							 	converter: value => value ? asReverseDateString(value) : value });
					bsEkle({ rowAttr: 'cari', ioAttr: 'cari' });
					bsEkle({ rowAttr: 'cariTip', ioAttr: 'tip' });
					bsEkle({ rowAttr: 'cariBolge', ioAttr: 'bolge' });
					bsEkle({ rowAttr: 'cariKosulGrup', ioAttr: 'cariKosulGrup' });
					bsEkle({ rowAttr: 'plasiyer', ioAttr: 'plasiyer' });
					bsEkle({ rowAttr: 'plasiyerTip', ioAttr: 'plTip' });
					bsEkle({ rowAttr: 'plasiyerBolge', ioAttr: 'plBolge' });
					hvListe.push(hv);

					let key = 'Musteri';
					(kosul.kapsamMusteriler || []).forEach(rec => {
						let kod = rec.must;
						if (kod) {
							const _hvListe = mustKod2HVListe[kod] = mustKod2HVListe[kod] || [];
							_hvListe.push({
								kosulTip: kosulTip, kosulKod: kosulKod, kod: kod
							})
						}
					});

					key = 'Stok';
					let detayKod2HVListe = detayTip2Kod2HVListe[key] = detayTip2Kod2HVListe[key] || {};
					(kosul.kapsamStoklar || []).forEach(rec => {
						let kod = rec.stokkod;
						if (kod) {
							const hv = {
								kosulTip: kosulTip, kosulKod: kosulKod, kod: kod, markaKod: rec.smarkakod || '',
								fiyatMiktarTipi: rec.fiyatmiktartipi || '', kotaMiktar: asFloat(rec.kotamiktar) || 0,
								rafFiyati: asFloat(rec.raffiyati) || 0, mfPay: asInteger(rec.mfpay) || 0, mfBaz: asInteger(rec.mfbaz),
								ozelFiyat: asFloat(rec.ozelfiyat) || 0, ozelDvFiyat: asFloat(rec.ozeldvfiyat) || 0,
								orjFiyat: asFloat(rec.orjfiyat) || 0, orjDvFiyat: asFloat(rec.orjdvfiyat) || 0,
								enDusukFiyat: asFloat(rec.endusukfiyat) || 0
								/*iskOran1: asFloat(rec.iskoran1) || 0, iskOran2: asFloat(rec.iskoran2) || 0, iskOran3: asFloat(rec.iskoran3) || 0,
								kamOran1: asFloat(rec.kamoran1) || 0, kamOran2: asFloat(rec.kamoran2) || 0, kamOran3: asFloat(rec.kamoran3) || 0*/
							};
							for (let i = 1; i <= iskSayi; i++) {
								hv[`iskOran${i}`] = asFloat(rec[`iskoran${i}`]) || 0;
								hv[`kamOran${i}`] = asFloat(rec[`kamoran${i}`]) || 0;
							}
							const _hvListe = detayKod2HVListe[kod] = detayKod2HVListe[kod] || [];
							_hvListe.push(hv);
						}
					});

					key = 'StokGrup';
					detayKod2HVListe = detayTip2Kod2HVListe[key] = detayTip2Kod2HVListe[key] || {};
					(kosul.kapsamStokGruplar || []).forEach(rec => {
						let kod = rec.grupkod;
						if (kod) {
							const hv = {
								kosulTip: kosulTip, kosulKod: kosulKod, kod: kod, markaKod: rec.smarkakod || '', kotaMiktar: asFloat(rec.kotamiktar) || 0,
								rafFiyati: asFloat(rec.raffiyati) || 0, mfPay: asInteger(rec.mfpay) || 0, mfBaz: asInteger(rec.mfbaz),
								ozelFiyat: asFloat(rec.ozelfiyat) || 0, ozelDvFiyat: asFloat(rec.ozeldvfiyat) || 0,
								orjFiyat: asFloat(rec.orjfiyat) || 0, orjDvFiyat: asFloat(rec.orjdvfiyat) || 0
								/*iskOran1: asFloat(rec.iskoran1) || 0, iskOran2: asFloat(rec.iskoran2) || 0, iskOran3: asFloat(rec.iskoran3) || 0,
								kamOran1: asFloat(rec.kamoran1) || 0, kamOran2: asFloat(rec.kamoran2) || 0, kamOran3: asFloat(rec.kamoran3) || 0*/
							};
							for (let i = 1; i <= iskSayi; i++) {
								hv[`iskOran${i}`] = asFloat(rec[`iskoran${i}`]) || 0;
								hv[`kamOran${i}`] = asFloat(rec[`kamoran${i}`]) || 0;
							}
							const _hvListe = detayKod2HVListe[kod] = detayKod2HVListe[kod] || [];
							_hvListe.push(hv);
						}
					});
				});
			});

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
			const dbMgr = e.dbMgr;
			const wsFetches = e.wsFetches;
			
			const islemAdi = 'Promosyon Listesi';
			// wsFetches. ...  = this.ws ... Liste();
			const recsYapi = await this.fetchWSRecs({ source: wsFetches.promosyon, islemAdi: islemAdi, step: 10 });
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
			let recs = recsYapi.Baslik;
			if (!$.isEmptyObject(recs)) {
				for (const i in recs) {
					const rec = recs[i];
					let hv = ({
						proTip: rec.tipkod, kod: rec.kod, vioID: asInteger(rec.kaysayac) || null, aciklama: rec.aciklama || '',
						veriTipi: rec.veritipi || '', vGrupKod: rec.vgrupkod || '', vStokKod: rec.vstokkod || '', vMiktar: asFloat(rec.vmiktar) || 0,
						vBrm: rec.vbrm || '', vCiro: asFloat(rec.vciro) || 0, vCiroKdvlimi: bool2Int(rec.vcirokdvlimi),
						hedefTipi: rec.hedeftipi || '', hGrupKod: rec.hgrupkod || '', hStokKod: rec.hstokkod || '', hMiktar: asFloat(rec.hmiktar) || 0,
						hBrm: rec.hbrm || '', hDipIsk: asFloat(rec.hdipisk) || 0, hMFVarsaSatirIskKapat: bool2Int(rec.hmfvarsasatiriskkapat),
						detayliMusterimi: bool2Int(rec.detaylimust), kademelimi: bool2Int(rec.kademelimi)
					});
					bsEkle({ hv: hv, rec: rec, rowAttr: 'tarih', ioAttr: 'tarih', converter: value => value ? asReverseDateString(value) : value });
					bsEkle({ hv: hv, rec: rec, rowAttr: 'cariTip', ioAttr: 'ctip' });
					bsEkle({ hv: hv, rec: rec, rowAttr: 'cariBolge', ioAttr: 'bolge' });
					bsEkle({ hv: hv, rec: rec, rowAttr: 'cari', ioAttr: 'must' });
					bsEkle({ hv: hv, rec: rec, rowAttr: 'plasiyer', ioAttr: 'plasiyer' });
					hvListeYapi.baslik.push(hv);
				}
				await dbMgr.insertOrReplaceTable({
					table: 'mst_Promosyon', mode: 'insertIgnore',
					hvListe: hvListeYapi.baslik,
					parcaCallback: e => {
						if (e.index % subCount == 0)
							this.knobProgressStep();
					}
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
				recs.forEach(rec => {
					seq++;
					let eKadar = asFloat(rec.ekadar) || 0;
					if (eKadar) {
						hvListeYapi.kademe.push({
							proTip: rec.protip, proKod: rec.prokod, seq: (asInteger(rec.seq) || seq),
							eKadar: eKadar, mfAdet: asFloat(rec.mfadet) || 0
						});
					}
				});
				await dbMgr.insertOrReplaceTable({
					table: 'mst_PromosyonKademe', mode: 'insertIgnore',
					hvListe: hvListeYapi.kademe,
					parcaCallback: e => {
						if (e.index % subCount == 0)
							this.knobProgressStep();
					}
				});
			}
		}
		
		async merkezdenBilgiYukleSonrasi(e) {
			e = e || {};
			const {sessionInfo} = sky.config;
			if (!sky.config.test && (sessionInfo && sessionInfo.hasSessionOrUser)) {
				await this.knobProgressSetLabel('Oturum Bilgileri kaydediliyor...');
				await this.extensions.login.dbSaveLogin({ clear: true });
				await this.knobProgressStep(1);
			}

			await this.knobProgressSetLabel('Son işlemler...');
			await this.merkezdenBilgiYukleSonrasiDevam(e);
			await this.knobProgressStep(5);
			
			await this.ortakReset(e);
			await this.onbellekOlustur(e);
			await this.knobProgressStep(3);

			// setTimeout(() => this.aktarimProgressKapat(), 1000);

			this.afterRunVeMerkezdenBilgiYukleSonrasiOrtak(e);
			
			setTimeout(() => {
				this.aktarimProgressCompleted({
					defer: true,
					delaySecs: 30,
					text: `<span style="font-weight: bold; color: forestgreen;">Merkezden Veri Alımı tamamlandı</span>`
				})
			}, 2000);
		}

		async merkezdenBilgiYukleSonrasiDevam(e) {
			e = e || {};
			// bakiye, risk, sonStok ... hesaplaması

			const {param} = this;
			if (param.kmTakibiYapilirmi)
				param.kapandimi = false;
			await param.kaydet();
			displayMessage(`BİLGİLENDİRME: <b>Açılış yapıldı</b>`, this.appText);

			const dbMgr = this.dbMgrs.rom_data;
			await (async () => {
				let uni = new MQUnionAll();
				let stm = new MQStm({ sent: uni });
				this.fisListe_stmSentDuzenle({ stm: stm, uni: uni, musteriDurumu: false });
				let rs = await dbMgr.executeSql({ query: stm });
				for (let i = 0; i < rs.rows.length; i++) {
					const rec = rs.rows[i];
					const fis = await CETFis.fromRec({ rec: rec });
					if (fis) {
						if (fis.class.sonStokEtkilenirmi)
							await fis.sonStokDuzenle(e);
						await this.knobProgressStep(1);
					}
				}
			})();
		}

		async merkezeBilgiGonder(e) {
			e = $.extend({}, e);
			this.prefetchAbortedFlag = true;

			await this.knobProgressShow();
			await this.knobProgressReset();

			// e.dbMgr = this.dbMgr_mf;
			let result;
			try {
				result = await this.merkezeBilgiGonderDevam(e);

				setTimeout(() => {
					this.aktarimProgressCompleted({
						defer: true,
						delaySecs: 15,
						text: `<span style="font-weight: bold; color: forestgreen;">Merkeze Bilgi Gönderimi tamamlandı</span>`
					})
				}, 1000);
			}
			catch (ex) {
				hideProgress();
				((window.savedProcs || {}).hideProgress || hideProgress)();

				if (ex.statusText)
					displayServerResponse(ex);
				else
					displayMessage(ex.errorText || (ex || '').toString(), `${ex.isError ? '@' : '!'} Merkeze Bilgi Gönderimi ${ex.isError ? '@' : '!'}`);
				throw ex;
			}
			return result;
		}

		async merkezeBilgiGonderDevam(e) {
			let {promise_merkezeBilgiGonder} = this;
			if (promise_merkezeBilgiGonder) {
				try { await promise_merkezeBilgiGonder }
				catch (ex) { }
			}
			
			promise_merkezeBilgiGonder = this.promise_merkezeBilgiGonder = new $.Deferred(p => {
				this.merkezeBilgiGonderDevam2(e)
					.then(result => p.resolve(result))
					.catch(err => p.reject(err))
					.finally(() => this.promise_merkezeBilgiGonder = null);
			});
			return await promise_merkezeBilgiGonder;
		}

		async merkezeBilgiGonderDevam2(e) {
			e = e || {};
			const {silent} = e;
			const dbMgr = e.dbMgr || this.dbMgr_mf;
			let {bilgiGonderTableYapilari} = e;
			if (!bilgiGonderTableYapilari)
				bilgiGonderTableYapilari = this.bilgiGonderTableYapilari;

			if ($.isEmptyObject(bilgiGonderTableYapilari)) {
				if (!silent)
					displayMessage('Gönderilecek belge bulunamadı!', this.appText);
				await this.merkezeBilgiGonderSonrasi(e);
				return false;
			}

			// await this.knobProgressSetLabel(`Belgeler taranıyor...`);
			let totalRecords = 0;
			const fetchBlock = async e => {
				let rs = await dbMgr.executeSql({ query: e.query });
				for (let i = 0; i < rs.rows.length; i++) {
					const table = e.table || rec._table;
					const rec = rs.rows[i];
					const recs = table2Recs[table] = table2Recs[table] || [];
					recs.push(rec);
					totalRecords++;
				}
				if (!silent)
					await this.knobProgressStep(3);
			};

			const table2Recs = {};
			for (const i in bilgiGonderTableYapilari) {
				const tableYapi = bilgiGonderTableYapilari[i];
				const fisIDListe = tableYapi.fisIDListe;
				const baslikTable = tableYapi.baslik;
				let sent = new MQSent({
					from: baslikTable,
					where: [`gonderildi = ''`, `gecici = ''`, `rapor = ''`],
					sahalar: [`'${baslikTable}' _table`, `'fis' _tip`, `rowid`, `*`]
				});
				if (fisIDListe)
					sent.where.inDizi(fisIDListe, `rowid`);
				await fetchBlock({ table: baslikTable, query: new MQStm({ sent: sent }) });

				const digerTablolar = tableYapi.diger;
				if (!$.isEmptyObject(digerTablolar)) {
					for (const j in digerTablolar) {
						const table = digerTablolar[j];
						let sent = new MQSent({
							from: `${table} har`,
							fromIliskiler: [
								{ from: `${baslikTable} fis`, iliski: `har.fissayac = fis.rowid` }
							],
							where: [`fis.gonderildi = ''`, `fis.gecici = ''`, `fis.rapor = ''`],
							sahalar: [`'${baslikTable}' _parentTable`, `'${table}' _table`, `'diger' _tip`, `har.rowid`, `har.*`]
						});
						if (fisIDListe)
							sent.where.inDizi(fisIDListe, `har.fissayac`);
						await fetchBlock({ table: table, query: new MQStm({ sent: sent }) });
					}
				}

				const tanimTablolar = tableYapi.tanim;
				if (!$.isEmptyObject(tanimTablolar)) {
					for (const j in tanimTablolar) {
						const table = tanimTablolar[j];
						let sent = new MQSent({
							from: table,
							where: [`gonderildi = ''`],
							sahalar: [`'${table}' _table`, `'tanim' _tip`, `rowid`, `*`]
						});
						await fetchBlock({ table: table, query: new MQStm({ sent: sent }) });
					}
				}
			}

			if (!totalRecords)
				throw { isError: false, rc: 'noRecords', errorText: `Gönderilmeyi bekleyen hiç belge bulunamadı` };
			
			await this.knobProgressSetLabel(`Belgeler gönderiliyor...`);
			let result = await this.wsCETSaveTables({
				silent: true,
				data: {
					param: this.param.reduce(),
					table2Recs: table2Recs
				}
			});
			if (!result)
				result = { isError: true, rc: 'unknownError', errorText: '' };
			if (result.isError)
				throw result;

			await this.knobProgressStep(50);
			
			let mesaj = result.message || result.mesaj;
			if (mesaj) {
				if (silent) {
					await this.knobProgressHideWithReset({
						update: {
							labelTemplate: 'error',
							label: `<u>Sunucu Yanıtı</u>: ${mesaj}`
						}, delayMS: 8000
				   });
				}
				else
					await displayMessage(mesaj, 'Sunucu Yanıtı');
			}

			$.extend(e, {
				result: result,
				mesaj: mesaj
			});
			await this.merkezeBilgiGonderSonrasi(e);

			return true;
		}

		async merkezeBilgiGonderSonrasi(e) {
			e = e || {};
			const dbMgr = e.dbMgr || this.dbMgr_mf;
			const bilgiGonderTableYapilari = e.bilgiGonderTableYapilari || this.bilgiGonderTableYapilari || [];
			if ($.isEmptyObject(bilgiGonderTableYapilari))
				return;
			
			const {silent, result} = e;
			const hataliTable2FisIDListe = (result || {}).hataliTable2FisIDListe || {};
			for (const i in bilgiGonderTableYapilari) {
				const tableYapi = bilgiGonderTableYapilari[i];
				let table = tableYapi.baslik;
				if (table) {
					const fisIDListe = tableYapi.fisIDListe;
					const hataliFisIDListe = asSet(hataliTable2FisIDListe[table] || []);
					let upd = new MQIliskiliUpdate({
						from: table,
						where: [`gonderildi = ''`, `gecici = ''`, `rapor = ''`],
						set: `gonderildi = '*'`
					});
					if (!$.isEmptyObject(fisIDListe))
						upd.where.inDizi(fisIDListe, 'rowid');
					if (!$.isEmptyObject(hataliFisIDListe)) {
						upd.where.add(new MQOrClause([
							`silindi <> ''`,
							{ notInDizi: hataliFisIDListe, saha: `rowid` }
						]));
					}
					await dbMgr.executeSql({ query: upd });
				}

				table = tableYapi.tanim;
				if (table) {
					let upd = new MQIliskiliUpdate({
						from: table,
						where: [`gonderildi = ''`],
						set: `gonderildi = '*'`
					});
					await dbMgr.executeSql({ query: upd });
				}
			}

			const {param} = this;
			if (!silent && param.kmTakibiYapilirmi && !e.bilgiGonderTableYapilari && !param.kapandimi /*&& $.isEmptyObject(hataliTable2FisIDListe)*/) {
				param.kapandimi = true;
				await param.kaydet();
				displayMessage(`UYARI: <b>Kapanış yapıldı!</b>`, this.appText);
			}
		}

		async afterRunVeMerkezdenBilgiYukleSonrasiOrtak(e) {
			e = e || {};
			
			await this.kisitlamalariUygula();
			
			if (this.dogrudanFisListeyeGirilirmi && (!this.activePart || this.activePart == this)) {
				/*try { await this.promise_prefetchUI }
				catch (ex) { }*/
				await this.fisListesiIstendi(e);
			}

			if (this.konumTakibiYapilirmi)
				this.gpsTimer_start(e);
			this.merkezeBilgiGonderTimer_start(e);
		}

		async fetchWSRecs(e) {
			e = e || {};
			await this.knobProgressSetLabel(`Merkezden ${e.islemAdi} alınıyor...`);

			let recs;
			try {
				this.indicatorPart.ajaxCallback({ state: true });
				recs = e.source ? await e.source : null;
				if ($.isFunction(recs))
					recs = await recs.call(this, e);
				recs = e.recs = (recs || {}).rows || recs || []
			}
			catch (ex) {
				// defFailBlock(ex);
				throw ex;
			}

			await this.knobProgressStep(e.step);

			return recs;
		}

		async tablolariOlusturIslemi(e) {
			await this.tablolariOlustur(e);
			await this.tabloEksikleriTamamla(e);
		}

		async loginOncesiKontrol(e) {
			await this.knobProgressSetLabel(`Ön Kontroller yapılıyor...`);
			
			let result = await this.vtYapisiUygunmu(e);
			if (!result)
				return false;
			
			let {param} = this;
			let degistimi = false;
			let hasQSArgs = qs.hostname || qs.port;
			$.extend(qs, {
				hostname: qs.hostname || param.wsHostNameUyarlanmis,
				port: qs.port || param.wsPort
			});
			qs._port = qs.port;
			await sky.config.load();
			this.updateWSUrlBase();
			if (!hasQSArgs) {
				delete qs.hostname;
				delete qs.port;
			}
			/*if (degistimi) {
				await sky.config.load();
			}*/
			await this.knobProgressStep(5);
			
			if (!param.wsHostNameUyarlanmis)
				return false;
			
			return result;
		}

		async vtYapisiUygunmu(e) {
			e = e || {};
			let dbMgr = this.dbMgrs.param;
			let result = await dbMgr.hasTables({ tx: e.tx, names: ['mst_Login'] });
			if (!result)
				return false;

			return true;
		}

		async paramYukle(e) {
			await this.knobProgressSetLabel(`Parametreler okunuyor...`);
			await this.param.yukle();
			await this.paramYukleSonrasi(e);
			this.knobProgressStep(2);
		}

		paramYukleSonrasi(e) {
		}

		async paramKaydet(e) {
			await this.knobProgressSetLabel(`Parametreler kaydediliyor...`);
			
			const eskiParam = this.param || {};
			let {param} = e;
			param.version = param.version || eskiParam.version || param.class.version;
			await param.kaydet({
				parcaCallback: e =>
					this.knobProgressStep(2)
			});
			this.param = param;
			let degistimi = 
				eskiParam.wsHostNameUyarlanmis && eskiParam.wsPort &&
				!(eskiParam.wsHostNameUyarlanmis == param.wsHostNameUyarlanmis && eskiParam.wsPort == param.wsPort);

			const hasQSArgs = qs.hostname || qs.port;
			$.extend(qs, {
				hostname: qs.hostname || param.wsHostNameUyarlanmis,
				port: qs.port || param.wsPort
			});
			
			if (degistimi) {
				const {config} = sky;
				const savedSessionInfo = config.sessionInfo;
				await config.load();
				this.updateWSUrlBase();
				if (!hasQSArgs) {
					delete qs.hostname;
					delete qs.port;
				}
				config.sessionInfo = savedSessionInfo;
				this.loginIstendiDevam(e);
			}

			setTimeout(() =>
				this.aktarimProgressCompleted({ defer: true, delaySecs: 2, text: `Parametreler kaydedildi!` }),
				100);
		}

		async getMatbuuFormYapilari(e) {
			let result = this._matbuuFormYapilari;
			if (!result) {
				result = new CETMatbuuFormYapilari();
				if (!await result.yukle(e))
					result = null;
				this._matbuuFormYapilari = result;
			}

			return result;
		}

		rotaVeFisListeOncesiIslemler(e) {
			return new $.Deferred(async p => {
				await this.gerekirseKMGirisYap({ sonmu: false });
				setTimeout(async () => {
					await this.ilkIrsaliyeRaporuKontrol(e);
					setTimeout(() =>
						p.resolve({ result: true }),
						100)
				}, 100)
			});
		}

		async gerekirseKMGirisYap(e) {
		}

		async ilkIrsaliyeRaporuKontrol(e) {
		}

		aktarimProgressCompleted(e) {
			e = e || {};
			e.delayMS = e.delaySecs ? e.delaySecs * 1000 : e.delayMS;
			if (!e.defer)
				delete e.delayMS;
			
			return this.aktarimProgressKapat(e);
		}

		aktarimProgressKapat(e) {
			e = e || {}
			this.knobProgressHideWithReset({
				delayMS: e.delayMS || 1000,
				update: {
					showLoading: false,
					progress: 100,
					label: `<span style="font-weight: bold; color: forestgreen;">${e.text || e.label || ''}</span>`
				}
			});
		}


		wsETParam(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}etParam`,
				data: this.buildAjaxArgs(e)
				/*dataType: defaultOutput*/
			})
		}

		wsNumaratorListe(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}numaratorListe`,
				data: this.buildAjaxArgs(e)
				/*dataType: defaultOutput*/
			});
		}

		wsETMatbuuTanimlar(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}etMatbuuTanimlar`,
				data: this.buildAjaxArgs(e)
				/*dataType: defaultOutput*/
			});
		}

		wsSevkAdresListe(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}sevkAdresListe`,
				data: this.buildAjaxArgs(e)
				/*dataType: defaultOutput*/
			});
		}

		wsNakliyeSekliListe(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}nakliyeSekliListe`,
				data: this.buildAjaxArgs(e)
				/*dataType: defaultOutput*/
			});
		}

		wsTahsilSekliListe(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}tahsilSekliListe`,
				data: this.buildAjaxArgs(e)
				/*dataType: defaultOutput*/
			});
		}

		wsUgramaSebepListe(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}ugramaSebepListe`,
				data: this.buildAjaxArgs(e)
			});
		}

		wsFisSablonListe(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}fisSablonListe`,
				data: this.buildAjaxArgs(e)
			});
		}

		wsSablonFisTipiListe(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}sablonFisTipiListe`,
				data: this.buildAjaxArgs(e)
			});
		}

		wsStokGrupListe(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}stokGrupListe`,
				data: this.buildAjaxArgs(e)
			});
		}

		wsOzelKampanyaListe(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}ozelKampanyaListe`,
				data: this.buildAjaxArgs(e)
			});
		}

		wsStokMarkaListe(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}stokMarkaListe`,
				data: this.buildAjaxArgs(e)
			});
		}

		wsStokYerListe(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}stokYerListe`,
				data: this.buildAjaxArgs(e)
			});
		}

		wsYerRafListe(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}yerRafListe`,
				data: this.buildAjaxArgs(e)
			});
		}

		wsTransferYontemiListe(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}transferYontemiListe`,
				data: this.buildAjaxArgs(e)
			});
		}

		wsSubeListe(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}subeListe`,
				data: this.buildAjaxArgs(e)
			});
		}

		wsPlasiyerListe(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}plasiyerListe`,
				data: this.buildAjaxArgs(e)
			});
		}

		wsStokListe(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}stokListe`,
				data: this.buildAjaxArgs(e),
				timeout: 5000000
			});
		}

		wsCariListe(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}cariListe`,
				data: this.buildAjaxArgs(e),
				timeout: 5000000
			});
		}

		wsCariRiskVeBakiyeListe(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}cariRiskVeBakiyeListe`,
				data: this.buildAjaxArgs(e),
				timeout: 5000000
			});
		}

		wsModelListe(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}modelListe`,
				data: this.buildAjaxArgs(e)
			});
		}

		wsRenkListe(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}renkListe`,
				data: this.buildAjaxArgs(e)
			});
		}

		wsDesenListe(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}desenListe`,
				data: this.buildAjaxArgs(e)
			});
		}

		wsOzellikListe(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}ozellikListe`,
				data: this.buildAjaxArgs(e)
			});
		}

		wsSonStokListe(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}sonStokListe`,
				data: this.buildAjaxArgs(e),
				timeout: 5000000
			});
		}

		wsBarkodReferansListe(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}barkodReferansListe`,
				data: this.buildAjaxArgs(e)
			});
		}

		wsTartiBarkodKuralListe(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}tartiFormatListe`,
				data: this.buildAjaxArgs(e)
			});
		}

		wsAyrisimBarkodKuralListe(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}ayrisimBarkodListe`,
				data: this.buildAjaxArgs(e)
			});
		}

		wsSatisKosullari(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}satisKosullari`,
				data: this.buildAjaxArgs(e),
				timeout: 5000000
			});
		}

		wsPromosyonListe(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}promosyonListe`,
				data: this.buildAjaxArgs(e),
				timeout: 5000000
			});
		}

		wsBekleyenSiparisler(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}bekleyenSiparisler`,
				data: this.buildAjaxArgs(e),
				timeout: 5000000
			});
		}

		wsOncekiFisler(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}oncekiFisler`,
				data: this.buildAjaxArgs(e),
				timeout: 5000000
			});
		}

		wsCETSaveTables(e) {
			e = e || {};
			const {data} = e;
			delete e.data;

			return lastAjaxObj = $.post({
				url: `${this.wsURLBase}cetSaveTables?${$.param(this.buildAjaxArgs($.extend({}, e, { input: defaultInput })))}`,
				contentType: 'application/json',
				data: toJSONStr(data)
				/*dataType: defaultOutput*/
			}).fail(e.silent ? defFailBlockBasit : defFailBlock);
		}

		wsKonumKaydet(e) {
			e = e || {};
			const {data} = e;
			delete e.data;

			const _wsURLBase = updateWSUrlBaseBasit($.extend({}, sky.config, {
				path: `ws/elterm/`,
				port: SkyConfigParam.DefaultWSPort
			}));
			return lastAjaxObj = $.post({
				url: `${_wsURLBase}konumKaydet?${$.param($.extend({}, e))}`,
				contentType: 'application/json',
				data: toJSONStr(data)
				/*dataType: defaultOutput*/
			}).fail(e.silent ? defFailBlockBasit : defFailBlock);
		}

		konumFarki(e) {
			const {konum1, konum2} = e;
			return 0;
		}

		kisitlamalariUygula(e) {
			this._fisTipleri = this._fisAdimKisitIDSet = this._menuAdimKisitIDSet = undefined;
			
			setTimeout(() => {
				const menuItems = this.divAnaMenu.find(`.item`);
				const {menuAdimKisitIDSet} = this;
				if (!$.isEmptyObject(menuAdimKisitIDSet)) {
					const removeItems = menuItems.filter((index, item) => !menuAdimKisitIDSet[item.id]);
					if (!$.isEmptyObject(removeItems))
						removeItems.remove();
				}
			}, 100);

			const {fisAdimKisitIDSet} = this;
			if (!$.isEmptyObject(fisAdimKisitIDSet))
				this._fisTipleri = this.fisTipleriDuzenlenmis.filter(item => fisAdimKisitIDSet[item.kod]);
		}

		get gpsTimer_key() { return 'gpsTimer' }
		get merkezeBilgiGonderTimer_key() { return 'merkezeBilgiGonder' }

		async gpsTimer_start(e) {
			await this.gpsTimer_stop();

			await this.setUniqueTimeout({
				key: this.gpsTimer_key,
				isInterval: true,
				delayMS: (this.programcimi ? 10 : 60) * 1000,
				block: () => {
					const result = this.gpsTimer_proc(e);
					if (result === false)
						this.clearUniqueTimeout({ key: this.gpsTimer_key });
				}
			});
		}

		async gpsTimer_stop(e) {
			await this.clearUniqueTimeout({
				key: this.gpsTimer_key,
				isInterval: true
			});
		}

		async gpsTimer_proc(e) {
			e = e || {};
			const {geolocation} = navigator;
			if (!geolocation)
				return true;

			const gpsInfo = await new $.Deferred(p => {
				geolocation.getCurrentPosition(_e =>
					p.resolve(_e))
			});
			if (!gpsInfo)
				return true;
			
			const {timestamp} = gpsInfo;
			const coords = $.extend({}, gpsInfo.coords);
			if (asFloat(coords.latitude) <= 0 || asFloat(coords.longitude) <= 0)
				return true;

			const sonCoords = (this.sonKonumBilgi || {}).coords;
			if (sonCoords && (sonCoords.latitude == coords.latitude && sonCoords.longitude == coords.longitude))
				return true;
			
			const kayitTS = dateTimeToString(timestamp ? new Date(timestamp) : now());
			const {sessionInfo} = sky.config;
			const userTip = (
				sessionInfo.loginTipi
					? sessionInfo.loginTipi
							.replace('Login', '')
							.replace('login', '')
					: null) || 'vio';
			const table = 'data_KonumBilgi';
			const dbMgr = e.dbMgr || this.dbMgr_mf;
			const {tx} = e;
			let sent, stm, maxRowID, del, hv, upd, recs;

			const KeepRecsCount = 20;
			sent = new MQSent({
				from: table,
				where: [`gonderildi = '*'`],
				sahalar: [`MAX(rowid)`]
			});
			stm = new MQStm({ sent: sent });
			maxRowID = asInteger(await dbMgr.tekilDegerExecuteSelect({ tx: tx, query: stm }));
			if (maxRowID && maxRowID > KeepRecsCount) {
				del = new MQIliskiliDelete({
					from: table,
					where: [
						`gonderildi = '*'`,
						`rowid < ${MQSQLOrtak.sqlParamValue(maxRowID - KeepRecsCount)}`
					]
				});
				await dbMgr.executeSql({ tx: tx, query: del });
			}

			hv = {
				kayitTS: kayitTS,
				userTip: userTip,
				userKod: sessionInfo.user,
				gonderildi: '',
				latitude: coords.latitude,
				longitude: coords.longitude,
				speed: coords.speed || 0
			};
			await dbMgr.insertOrReplaceTable({ mode: 'insertIgnore', tx: tx, table: table, hv: hv });

			const data = {};
			const tables = data.tables = {};
			const tblKonumBilgi = tables[table] = [];
			sent = new MQSent({
				from: table,
				where: [`gonderildi = ''`],
				sahalar: [`*`]
			});
			stm = new MQStm({ sent: sent });
			recs = await dbMgr.executeSqlReturnRowsBasic({ tx: tx, query: stm });
			for (let i = 0; i < recs.length; i++)
				tblKonumBilgi.push(recs[i]);
			await this.wsKonumKaydet({ silent: true, data: data });
			
			upd = new MQIliskiliUpdate({
				from: table,
				where: [`gonderildi = ''`],
				set: [`gonderildi = '*'`]
			});
			await dbMgr.executeSql({ tx: tx, query: upd });
			this.sonKonumBilgi = { timestamp: timestamp, coords: coords };
			
			return true;
		}

		async merkezeBilgiGonderTimer_start(e) {
			await this.merkezeBilgiGonderTimer_stop();

			await this.setUniqueTimeout({
				key: this.merkezeBilgiGonderTimer_key,
				isInterval: true,
				delayMS: (this.programcimi ? 10 : 30) * 1000,
				block: () => {
					const result = this.merkezeBilgiGonderTimer_proc(e);
					if (result === false)
						this.clearUniqueTimeout({ key: this.merkezeBilgiGonderTimer_key });
				}
			});
		}

		async merkezeBilgiGonderTimer_stop(e) {
			await this.clearUniqueTimeout({
				key: this.merkezeBilgiGonderTimer_key,
				isInterval: true
			});
		}

		async merkezeBilgiGonderTimer_proc(e) {
			e = e || {};
			if (!navigator.onLine)
				return true;

			const userSettings = this.param.userSettings || {};
			if (!userSettings.kaydederkenAktar)
				return true;
			
			const _e = { silent: true };
			await this.merkezeBilgiGonderDevam(_e);
			// await this.knobProgressHideWithReset();

			return true;
		}

		async menuItemClicked(e) {
			let item = e.event.currentTarget;
			let id = item.id;
			if (!id)
				return;
			
			let aktarimProgressPart = this.aktarimProgressPart;
			if (aktarimProgressPart) {
				aktarimProgressPart.destroyPart();
				delete this.aktarimProgressPart;
			}

			$(item).parent().children('li')
				.removeClass('active');
			
			let block = eval(item.dataset.block);
			if (block) {
				if (asBool(item.dataset.selectable))
					$(item).addClass('active');
				return await block.call(this, e);
			}
			
			return null;
		}

		merkezdenBilgiYukleIstendi(e) {
			let layout = this.templates.merkezdenBilgiYukleMesaji.contents('div').clone(true);
			layout.addClass(`part ${this.appName} ${this.rootAppName}`);

			this.prefetchAbortedFlag = true;
			createJQXWindow(
				layout,
				this.appText,
				{
					isModal: true, showCollapseButton: false, closeButtonAction: 'destroy',
					width: 'auto', height: 280
				},
				{
					EVET: (dlgUI, btnUI) => {
						e = $.extend({}, e, {
							verilerSilinmesinFlag: dlgUI.find('.jqx-window-content #verilerSilinmesinFlag').is(':checked')
						});
						dlgUI.jqxWindow('destroy');
						this.merkezdenBilgiYukle(e);
					},
					HAYIR: (dlgUI, btnUI) => {
						dlgUI.jqxWindow('destroy')
					}
				}
			)
		}

		merkezeBilgiGonderIstendi(e) {
			this.prefetchAbortedFlag = true;
			
			let layout = this.templates.merkezeBilgiGonderMesaji.contents('div').clone(true);
			layout.addClass(`part ${this.appName} ${this.rootAppName}`);

			createJQXWindow(
				layout,
				this.appText,
				{
					isModal: true, showCollapseButton: false, closeButtonAction: 'destroy',
					width: 'auto', height: 250
				},
				{
					EVET: async (dlgUI, btnUI) => {
						e = $.extend({}, e);
						dlgUI.jqxWindow('destroy');
						await this.merkezeBilgiGonderOnKontrol(e);
						await this.merkezeBilgiGonder(e);
					},
					HAYIR: (dlgUI, btnUI) => {
						dlgUI.jqxWindow('destroy')
					}
				}
			)
		}

		async merkezeBilgiGonderOnKontrol(e) {
			await this.gerekirseKMGirisYap({ sonmu: true });
		}

		async veriYonetimi_cloud_import(e) {
			const {param, dbTablePrefixes} = this;
			const dbMgr = this.dbMgr_mf;
			const {sender, cloudURL} = e;
			const {alinacaklar} = sender;
			let {tx} = e;
			const hasTx = !!tx;

			lastAjaxObj = $.ajax({
				cache: false, async: true, method: 'GET',
				// contentType: 'application/json',
				url: `${cloudURL}?${$.param(this.buildAjaxArgs({ input: defaultInput }))}`
			});
			let data = null;
			try {
				let result = await lastAjaxObj;
				if (result && typeof result != 'object')
					result = { isError: true, rc: 'invalidResponse', errorText: 'Yükleme Verisi hatalıdır' };
				if (result && result.isError)
					throw result;
				if (!result)
					throw { isError: true, rc: 'emptyResponse', errorText: `Yüklenecek veri bulunamadı` };
				data = result;
			}
			catch (ex) {
				// defFailBlock(ex);
				throw ex;
			}
			
			let query = `SELECT name FROM sqlite_master WHERE type = 'table' AND (name NOT LIKE '^_^_%' ESCAPE '^' AND name NOT LIKE 'sqlite^_%' ESCAPE '^')`;
			/*if (e.verilerSilinmesinFlag)
				query += ` AND (name LIKE '${this.dbTablePrefixes.master}%')`;*/
			let rs = await dbMgr.executeSql({ tx: tx, query: query });
			const tableNames = {};
			for (let i = 0; i < rs.rows.length; i++) {
				const rec = rs.rows[i];
				const table = rec.name;
				let uygunmu =
					( alinacaklar.belgeler && !(table.startsWith(dbTablePrefixes.master) || table.startsWith(dbTablePrefixes.const)) ) ||
					( alinacaklar.sabitTanimlar && table.startsWith(dbTablePrefixes.master) );
				if (uygunmu)
					tableNames[table] = true;
			}

			const {table2Recs} = data;
			if (!$.isEmptyObject(table2Recs)) {
				for (const table in table2Recs) {
					if (!tableNames[table])
						continue;

					const recs = table2Recs[table];
					if ($.isEmptyObject(recs))
						continue;
					
					const del = new MQIliskiliDelete({ from: table });
					const hvListe = recs;
					if (!hasTx)
						tx = e.tx = await dbMgr.getTx();
					
					await dbMgr.executeSql({ tx: tx, query: del });
					await dbMgr.insertOrReplaceTable({
						tx: tx, table: table,
						mode: 'insertIgnore', hvListe: hvListe
					});
				}
				if (!hasTx)
					tx = e.tx = await dbMgr.getTx();
			}
			
			if (alinacaklar.param && !$.isEmptyObject(data.param)) {
				$.extend(param, data.param);
				await param.kaydet();
			}

			return true;
		}

		async veriYonetimi_cloud_export(e) {
			const {param, dbTablePrefixes} = this;
			const dbMgr = this.dbMgr_mf;
			const {sender, cloudURL} = e;
			const {alinacaklar} = sender;
			let {tx} = e;
			
			let query = `SELECT name FROM sqlite_master WHERE type = 'table' AND (name NOT LIKE '^_^_%' ESCAPE '^' AND name NOT LIKE 'sqlite^_%' ESCAPE '^')`;
			/*if (e.verilerSilinmesinFlag)
				query += ` AND (name LIKE '${this.dbTablePrefixes.master}%')`;*/
			let rs = await dbMgr.executeSql({ tx: tx, query: query });
			const tableNames = [];
			for (let i = 0; i < rs.rows.length; i++) {
				const rec = rs.rows[i];
				const table = rec.name;
				
				let uygunmu =
					( alinacaklar.belgeler && !(table.startsWith(dbTablePrefixes.master) || table.startsWith(dbTablePrefixes.const)) ) ||
					( alinacaklar.sabitTanimlar && table.startsWith(dbTablePrefixes.master) );
				if (uygunmu)
					tableNames.push(table);
			}

			const table2Recs = {};
			const data = { param: null, table2Recs: table2Recs };
			for (const i in tableNames) {
				const table = tableNames[i];
				const recs = table2Recs[table] = table2Recs[table] || [];
				let sent = new MQSent({
					from: table,
					sahalar: ['rowid', '*']
				});
				let stm = new MQStm({ sent: sent });
				rs = await dbMgr.executeSql({ tx: tx, query: stm });
				for (let j = 0; j < rs.rows.length; j++) {
					const rec = rs.rows[j];
					recs.push(rec);
				}
			}
			if (alinacaklar.param)
				data.param = param.reduce();

			lastAjaxObj = $.ajax({
				cache: false, async: true, method: 'POST',
				contentType: 'application/json',
				url: `${cloudURL}?${$.param(this.buildAjaxArgs({ input: defaultInput }))}`,
				data: toJSONStr(data)
			});
			try {
				const result = await lastAjaxObj;
				if (result && result.isError)
					throw result;
				return result || true;
			}
			catch (ex) {
				// defFailBlock(ex);
				throw ex;
			}
		}

		veriYonetimiIstendi(e) {
			this.prefetchAbortedFlag = true;
			return new $.Deferred(async p => {
				let part = new CETVeriYonetimiPart({
					parentPart: this.activePart || this,
					bitince: e =>
						p.resolve(e)
					/*kaydetIslemi: e =>
						p.resolve(e)*/
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
					kaydetIslemi: e =>
						p.resolve(e)
				});
				await part.run();
			});
		}

		async fiyatGorIstendi(e) {
			this.prefetchAbortedFlag = true;
			return CETFiyatGorPart.run({ parentPart: this });
		}

		async rotaListesiIstendi(e) {
			if (!this.rotaKullanilirmi) {
				displayMessage(`Bu program için <b>Rota Listesi</b> kullanılamaz!`, this.appText);
				return false;
			}

			this.prefetchAbortedFlag = true;
			await this.rotaVeFisListeOncesiIslemler(e);
			return await new CETRotaListesiPart({ parentPart: this }).run();
		}

		async fisListesiIstendi(e) {
			/*if (this.musteriRotaZorunlumu) {
				displayMessage(
					(	`Rotalı Satış merkez kuralına göre zorunlu olduğu için ` +
						`lütfen <b>Rotalı Satış</b> adımını kullanınız!`
					), this.appText);
				return false;
			}*/

			this.prefetchAbortedFlag = true;
			await this.rotaVeFisListeOncesiIslemler(e);
			return await new CETFisListePart({ parentPart: this }).run();
		}

		async musteriDurumuIstendi(e) {
			this.prefetchAbortedFlag = true;
			await this.rotaVeFisListeOncesiIslemler(e);
			return await new CETMusteriDurumuPart({ parentPart: this }).run();
		}

		async raporlarIstendi(e) {
			this.prefetchAbortedFlag = true;
			return new CETRaporlarPart({ parentPart: this }).run();
		}

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
									: ex.message || ex.errorText || (ex.responseJSON || {}).errorText
							);
							await this.knobProgressHideWithReset({
								update: {
									labelTemplate: 'error',
									label: `<b>${errorText}</b>`
								}, delayMS: 5000
						   });
						}
					},
					HAYIR: (dlgUI, btnUI) => {
						dlgUI.jqxWindow('destroy')
					}
				}
			)
		}

		async numaratorListeIstendi(e) {
			this.prefetchAbortedFlag = true;
			return new CETNumaratorListePart({ parentPart: this }).run();
		}

		async ayarlarIstendi(e) {
			this.prefetchAbortedFlag = true;
			return new CETParamPart({ parentPart: this }).run();
		}

		async sonStokGuncelle(e) {
			e = e || {};
			this.prefetchAbortedFlag = true;
			const promise_sonStokListe = this.wsSonStokListe();

			const dbMgr = this.dbMgr_mf;
			let {tx} = e;
			const hasTx = !!tx;
			if (!hasTx)
				tx = await dbMgr.getTx();

			const Prefix_EkOz = `ekOz_`;
			const {anahtarDelim} = CETEkOzellikler
			const ekOzelliklerIDSahalar = CETEkOzellikler.idSahalar;
			const ignoreSet = asSet(['stokKod', 'yerKod', 'refRafKod']);
			let sent = new MQSent({
				from: `mst_SonStok son`,
				where: [`son.orjMiktar <> 0`],
				sahalar: [`son.yerKod`, `son.stokKod`, `SUM(son.orjMiktar) devir`, `SUM(son.miktar) kalan`],
				groupBy: [`son.yerKod`, `son.stokKod`]
			});
			for (const i in ekOzelliklerIDSahalar) {
				const idSaha = ekOzelliklerIDSahalar[i];
				if (!ignoreSet[idSaha]) {
					sent.sahalar.add(`son.${idSaha}`);
					sent.groupBy.add(`son.${idSaha}`);
				}
			}
			let stm = new MQStm({ sent: sent });
			
			const dbRecs = await dbMgr.executeSqlReturnRowsBasic({ tx: tx, query: stm });
			let wsRecs = await promise_sonStokListe;
			if (wsRecs && wsRecs.rows)
				wsRecs = wsRecs.rows;
			
			if ($.isEmptyObject(wsRecs))
				throw { isError: true, rc: 'noWSRecord', errorText: `Merkezden Son Stok bilgisi alınamadı` };
			if ($.isEmptyObject(dbRecs))
				throw { isError: true, rc: 'noDBRecord', errorText: `Tablette güncellenecek Son Stok bilgisi bulunamadı` };

			const getAnahStr = e => {
				let {values} = e;
				if (!values) {
					const _ignoreSet = e.ignoreSet || ignoreSet;
					const _with = e.with;
					const {rec} = e;
					values = [];
					if (!$.isEmptyObject(_with))
						values.push(..._with);
					for (const i in ekOzelliklerIDSahalar) {
						const key = ekOzelliklerIDSahalar[i];
						if (!_ignoreSet[key]) {
							let value = rec[key];
							if (value == null) {
								const recAttr = key.startsWith(Prefix_EkOz) ? key.replace(Prefix_EkOz, 'ekoz') : key;
								value = rec[recAttr.toLowerCase()];			// !! idSaha lowercase olacak !!
							}
							values.push(value);
						}
					}
				}
				return values.join(anahtarDelim);
			};
			
			const anah2SonStokBilgi = {}, degisenAnahStr2SonStokBilgi = {};
			for (let i = 0; i < dbRecs.length; i++) {
				const rec = dbRecs[i];
				const {stokKod, yerKod} = rec;
				const anahStr = getAnahStr({ with: [stokKod, yerKod], rec: rec });
				anah2SonStokBilgi[anahStr] = {
					stokKod: stokKod, yerKod: yerKod,
					orjMiktar: rec.devir, miktar: rec.kalan
				};
			}
			for (let i = 0; i < wsRecs.length; i++) {
				const rec = wsRecs[i];
				const wsMiktar = asFloat((rec.sonmiktar || rec.miktar || rec.sonStok) || 0);
				if (!wsMiktar)
					continue;
				
				const stokKod = rec.stokkod;
				const yerKod = rec.yerkod || '';
				if (!$.isEmptyObject(ekOzelliklerIDSahalar)) {
					const values = [];
					for (const i in ekOzelliklerIDSahalar) {
						const idSaha = ekOzelliklerIDSahalar[i];
						const recAttr = idSaha.startsWith(Prefix_EkOz) ? idSaha.replace(Prefix_EkOz, 'ekoz') : idSaha;
						const value = rec[recAttr.toLowerCase()];			// !! idSaha lowercase olacak !!
						values.push(value || '');
					}
				}
				const anahStr = getAnahStr({ with: [stokKod, yerKod], rec: rec });
				const sonStokBilgi = anah2SonStokBilgi[anahStr] = anah2SonStokBilgi[anahStr] || {
					stokKod: stokKod, yerKod: yerKod,
					orjMiktar: 0, miktar: 0
				};
				const {orjMiktar, miktar} = sonStokBilgi;
				/*if (!miktar)
					continue;*/

				/*if (stokKod == 'H022' && yerKod == 'A')
					debugger;*/
				
				if (wsMiktar != orjMiktar) {
					sonStokBilgi.orjMiktar = wsMiktar;
					sonStokBilgi.miktar = (wsMiktar - orjMiktar) + miktar;
					degisenAnahStr2SonStokBilgi[anahStr] = sonStokBilgi;
				}
			}

			if (!$.isEmptyObject(degisenAnahStr2SonStokBilgi)) {
				const hvListe = [];
				for (const anahStr in degisenAnahStr2SonStokBilgi) {
					const sonStokBilgi = degisenAnahStr2SonStokBilgi[anahStr];
					const values = anahStr.split(anahtarDelim);
					
					let index = 0;
					const hv = {};
					hv.stokKod = values[index++];
					hv.yerKod = values[index++];
					for (const i in ekOzelliklerIDSahalar) {
						const key = ekOzelliklerIDSahalar[i];
						if (ignoreSet[key])
							continue;
						hv[key] = values[index++];
					}
					hv.orjMiktar = sonStokBilgi.orjMiktar;
					hv.miktar = sonStokBilgi.miktar;
					hvListe.push(hv);
				}

				if (!hasTx)
					tx = await dbMgr.getTx();
				await dbMgr.insertOrReplaceTable({
					tx: tx, table: `mst_SonStok`,
					mode: 'replace', hvListe: hvListe
				});
			}
			if (!hasTx)
				tx = await dbMgr.getTx();
			
			/*
			ekOzellikler.getAnahtarStr({ ignoreListe: ['raf', 'refRaf'] });*/

			return degisenAnahStr2SonStokBilgi;
		}

		async onResize(e) {
			e = e || {};
			await super.onResize(e);

			const {activePart} = this;
			if (activePart && activePart != this)
				return;

			const layout = this.rootLayout;
			const divItems = layout.find(`#anaMenu .items`);
			if (divItems.length)
				divItems.height($(window).height() - divItems.offset().top - 30)
		}
	}
})()




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
}*/
