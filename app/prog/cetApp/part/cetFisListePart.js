(function() {
	window.CETFisListePart = class extends window.CETListeOrtakPart {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				mustKod: e.mustKod,
				idSaha: ''				// coklu tablo verisi icin uid kendisi oluştursun liste
			});
			if (!(this.layout || this.template))
				this.template = this.app.templates.fisListe;
		}

		static get partName() { return 'cetFisListe' }
		get adimText() { return 'Fiş Listesi' }


		preInitLayout(e) {
			e = e || {};
			super.preInitLayout(e);

			const layout = e.layout || this.layout;
			this.templates = $.extend(this.templates || {}, {
				windows: layout.find(`#windows`)
			});
		}

		async postInitLayout(e) {
			e = e || {};
			const layout = e.layout || this.layout;
			this.height = $(window).height() - 130;
			
			/*const serbestModmu = this.app.serbestModmu;
			if (!serbestModmu) {
				const liDegistir = layout.find('.liste.popup #degistir');
				liDegistir.find(`span`).html('İZLE');
			}*/

			await super.postInitLayout(e);
			await this.initIslemTuslari(e);

			const barkodParent = layout.find(`#barkodParent`);
			if (barkodParent && barkodParent.length) {
				this.barkodParent = barkodParent;
				
				const txtBarkod = this.txtBarkod = barkodParent.find(`#txtBarkod`);
				txtBarkod.attr(`placeHolder`, `Belge barkodunu buraya okutunuz`);
				txtBarkod.off('click').on('click', evt => {
					txtBarkod.blur();
					txtBarkod.focus();
				});
				txtBarkod.off('focus').on('focus', evt => {
					const elm = evt.target;
					if (elm && elm.select)
						elm.select();
				});
				txtBarkod.off('keyup').on('keyup', async evt => {
					const key = (evt.key || '').toLowerCase();
					if (key == 'enter' || key == 'linefeed') {
						const target = evt.target;
						target.value = (target.value || '').trim();
						target.select();
						try {
							await this.barkodOkundu($.extend({}, e, { event: evt, barkod: target.value }))
						}
						catch (ex) {
							ex = ex.responseJSON || ex;
							if (ex.errorText)
								displayMessage(ex.errorText, `Barkod Okutma İşlemi`);
						}
						target.value = '';
					}
				});
				// txtBarkod.focus();
			}
			this.focusToDefault();
		}

		async activatePart(e) {
			e = e || {};
			const layout = e.layout || this.layout;
			
			this.initMustBilgi(e);
			// setTimeout(() => this.tazele(e), 100);
			
			await super.activatePart(e);

			this.cleanUpWidgets();
		}

		async initActivatePartOrtak(e) {
			await super.initActivatePartOrtak(e);

			/*setTimeout(async () => {
				await this.setUniqueTimeout({
					key: 'yeniToolTip',
					delayMS: 2500,
					block: () => {
						if ($.isEmptyObject(this.listeRecs)) {
							const {ozelIslemTuslariPart} = this;
							const yeniItem = ozelIslemTuslariPart && ozelIslemTuslariPart.layout
												? ozelIslemTuslariPart.parentMenu.find(`#yeni.item`)
												: null;
							if (yeniItem && yeniItem.length)
								yeniItem.jqxTooltip('open');
						}
					}
				});

				const {ozelIslemTuslariPart} = this;
				const yeniItem = ozelIslemTuslariPart && ozelIslemTuslariPart.layout
									? ozelIslemTuslariPart.parentMenu.find(`#yeni.item`)
									: null;
				if (yeniItem && yeniItem.length) {
					yeniItem.on('focus, touchstart', evt =>
						yeniItem.jqxTooltip('destroy'));
				}
			}, 100);*/
		}

		async deactivePart(e) {
			e = e || {};
			const layout = e.layout || this.layout;	
			
			await super.deactivePart(e);
		}

		async initMustBilgi(e) {
			e = e || {};
			const {layout} = this;
			if (!(layout && layout.length))
				return;
			
			const {bakiyeRiskGosterilmezmi} = this.app;
			const divMustBilgi = layout.find(`#mustBilgi`);
			
			const dbMgr = this.app.dbMgr_mf;
			let {mustKod} = this;
			if (mustKod) {
				let stm;
				let rec = await MQCogul.getCariEkBilgi({ mustKod: mustKod });
				if (!rec) {
					stm = new MQStm({
						sent: new MQSent({
							from: `mst_Cari`,
							where: [{ degerAta: mustKod, saha: 'kod' }],
							sahalar: [`unvan`]
						})
					});
					rec = await dbMgr.tekilExecuteSelect({ query: stm });
				}
				
				let unvan;
				if (rec) {
					unvan = (rec.unvan || '').trim();
					const {konSubeAdi} = rec;
					if (konSubeAdi)
						unvan += ` (<span class="bold green">${konSubeAdi}</span>)`;
					divMustBilgi.find('.adresText')
						.html(`${rec.adres || ''} ${rec.yore || ''}` + (rec.ilAdi ? ` / ${rec.ilAdi}` : ''));
				}
				divMustBilgi.find('.mustText')
					.html(new CKodVeAdi({ kod: mustKod, aciklama: unvan }).parantezliOzet({ styled: true }));
				rec = null;
				
				const riskCariKod = await MQCogul.getRiskCariKod({ mustKod: mustKod });
				if (riskCariKod) {
					stm = new MQStm({
						sent: new MQSent({
							from: `mst_Cari`,
							where: [{ degerAta: riskCariKod, saha: 'kod' }],
							sahalar: [`bakiye`, `riskLimiti`, `riskli`, `takipBorcLimiti`, `takipBorc`]
						})
					});
					rec = await dbMgr.tekilExecuteSelect({ query: stm });
				}
				
				const bakiye = !rec || bakiyeRiskGosterilmezmi ? `` : bedel(rec.bakiye);
				const kalanRisk = !rec || bakiyeRiskGosterilmezmi ? `` : rec.riskLimiti ? bedel(rec.riskLimiti - rec.riskli) : `-Limit Yok-`;
				const kalanTakipBorc = !rec || bakiyeRiskGosterilmezmi ? `` : rec.takipBorcLimiti ? bedel(rec.takipBorcLimiti - rec.takipBorc) : ``;
				if (bakiye || kalanRisk || kalanTakipBorc) {
					let elm = divMustBilgi.find('.bakiyeText').html(typeof bakiye == 'number' ? `${bedelStr(bakiye)}` : bakiye || ``);
					if (typeof bakiye != 'number')
						elm.addClass(`gray bold`);
					else if (bakiye < 0)
						elm.addClass(`red`);
					
					elm = divMustBilgi.find('.kalanRiskText').html(typeof kalanRisk == 'number' ? `${bedelStr(kalanRisk)}` : kalanRisk || ``);
					if (typeof kalanRisk != 'number')
						elm.addClass(`gray bold`);
					else if (kalanRisk < 0)
						elm.addClass(`red`);

					elm = divMustBilgi.find('.kalanTakipBorcText').html(typeof kalanTakipBorc == 'number' ? `${bedelStr(kalanTakipBorc)}` : kalanTakipBorc || ``);
					if (typeof kalanTakipBorc != 'number') {
						elm.addClass(`gray bold`);
						divMustBilgi.find('.kalanTakipBorcParent').addClass('jqx-hidden');
					}
					else if (kalanTakipBorc < 0)
						elm.addClass(`red`);
					
					divMustBilgi.find('.bakiyeVeRiskBilgi').removeClass('jqx-hidden');
				}
				else {
					divMustBilgi.find('.bakiyeVeRiskBilgi').addClass('jqx-hidden');
				}
				divMustBilgi.removeClass('jqx-hidden');
			}
			else {
				divMustBilgi.addClass('jqx-hidden');
			}
		}
		
		async fisGirisYap(e) {
			const {app} = sky;
			const {param, serbestModmu} = app;
			let {islem, rec, fis, sablon} = e;
			
			await new $.Deferred(p => {
				document.activeElement.blur();
				this.divListe.focus();
				setTimeout(() => p.resolve(true), 50);
			});
			
			(savedProcs || window).showProgress(null, null, 1, true);
			setTimeout(() =>
				(savedProcs || window).hideProgress(null, null, 1, true), 10);
			
			if (islem == 'yeniSablonlu')
				islem = 'yeni';
			if (islem == 'yeni')
				delete e.rec;
			
			if (!serbestModmu && param.kapandimi) {
				displayMessage(`<b>Kapanış yapıldığı için</b> <b><u>Belge Girişi</u></b> yapılamaz`, `@ ${this.app.appText} @`);
				return;
			}
			
			const devreDisimi = rec && asBool(rec.devreDisimi || rec.silindi);
			const gonderildimi = rec && asBool(rec.gonderildimi || rec.gonderildi);
			const gecicimi = rec && asBool(rec.gecicimi || rec.gecici);
			const rapormu = rec && asBool(rec.rapormu || rec.rapor);
			
			if (!fis && islem == 'yeni') {
				const sablondanSec = async e => {
					let _result;
					let {sablon} = e;
					if (sablon) {
						if (sablon == true) {
							setTimeout(() =>
								(savedProcs || window).hideProgress(), 300);
							_result = await this.fisSablonTipiSec(e);
							sablon = (_result || {}).rec;
						}
					}
					if (sablon && typeof sablon != 'object')
						sablon = this.app.sablonFisTipiKod2Rec[sablon];
					
					if (sablon) {
						try {
							_result = await this.barkodOkundu($.extend({}, e, { barkod: sablon.data }));
						}
						catch (ex) {
							ex = ex.responseJSON || ex;
							if (ex.errorText)
								displayMessage(ex.errorText, `Şablon Fiş İşlemi`);
							
							result = false;
							// displayMessage((_result || {}).errorText || `Yeni Fiş işlemi yapılamadı`, `Barkod Okutma İşlemi`);
							(savedProcs || window).hideProgress();
							hideProgress();
						}

						return _result;
					};
				}				

				if (sablon) {
					let result = await sablondanSec(e);
					return result;
				}
				
				let result = await this.fisIslemTipiSec();
				const fisTipi = (result || {}).rec;
				if (!fisTipi)
					return
				
				// (savedProcs || window).showProgress(null, null, 1, true);
				if (fisTipi.kod == 'sablon')
					return await sablondanSec($.extend(e, { sablon: true }))

				$.extend(e, {
					fisTipi: fisTipi,
					ayrimTipi: result.sender.ayrimTipi || '',
					yildizlimi: result.sender.yildizlimi || false
				})
			}

			fis = e.fis = await this.getFis(e);
			if (!fis)
				return null

			let eskiFis = fis;
			fis = fis.deepCopy();
			if (islem == 'kopya') {
				delete fis.id;
				fis.devreDisimi = fis.yazdirildimi = fis.gonderildimi = fis.gecicimi = fis.rapormu = false;
			}
			
			const fisSinif = fis.class;
			const {musteriKullanilirmi} = fisSinif;
			const uiSinif = fis.gecicimi || (islem == 'yeni' || islem == 'kopya')
								? fisSinif.fisGirisUISinif
								: fisSinif.degistirFisGirisUISinif;
			if (!uiSinif)
				return
			
			let result = await new $.Deferred(async p => {
				const {dbMgr} = fis;
				let mustKod = fis.mustKod || this.mustKod;
				if (!mustKod && fis.class.musteriKullanilirmi) {
					setTimeout(() =>
						(savedProcs || window).hideProgress(null, null, 1, true), 300);
					await new $.Deferred(async p => {
						// this.islemTuslariVarsaGizle();
						await CETCariListePart.run({
							parentPart: this,
							targetRec: mustKod,
							/*geriCallback: e => {
								this.islemTuslariVarsaGoster()
							},*/
							secince: e => {
								// this.islemTuslariVarsaGoster();
								mustKod = fis.mustKod = e.rec.kod;
								p.resolve(mustKod)
							}
						})
						/*await new CETCariListePart({
							parentPart: this.parentPart || this,
							secince: e => p.resolve(e.rec.kod)
						}).run()*/
					});
				};
				
				switch (islem) {
					case 'yeni':
					case 'kopya':
						try {
							await fis.yeniTanimOncesiIslemler(e);
						}
						catch (ex) {
							if (ex.statusText)
								displayServerResponse(ex);
							else
								displayMessage(ex.errorText || (ex || '').toString(), `${ex.isError ? '@' : '!'} Belge Girişi ${ex.isError ? '@' : '!'}`);
							(savedProcs || window).hideProgress();
							hideProgress();
							throw ex
						}
						break;
					case 'degistir':
						try {
							await fis.degistirOncesiIslemler(e);
							app.merkezeBilgiGonderTimer_start(e);
							try { await fis.belgeGonderimKontrol($.extend({}, e, { id: undefined, inst: undefined, fis: undefined })) }
							catch (ex) { console.warn(ex) }
						}
						catch (ex) {
							if (ex.statusText)
								displayServerResponse(ex);
							else
								displayMessage(ex.errorText || (ex || '').toString(), `${ex.isError ? '@' : '!'} Belge Girişi ${ex.isError ? '@' : '!'}`);
							(savedProcs || window).hideProgress();
							hideProgress();
							throw ex
						}
						break;
				}

				islem = e.islem;
				/*if (!serbestModmu && islem == 'degistir' && fis.yazdirildimi)
					islem = e.islem = 'izle';*/
				
				$.extend(e, { eskiFis: eskiFis, fis: fis });
				switch (islem) {
					case 'degistir':
					case 'iptal':
					case 'sil':
						if (devreDisimi) {
							setTimeout(() =>
								displayMessage(`Bu belge DevreDışı olduğu için değişiklik yapılamaz!<br/> <i>&nbsp;&nbsp;&nbsp;Sadece izlemeye izin verilecek...</i>`, app.appText),
								500);
							// return null;
						}
						if (gonderildimi) {
							setTimeout(() =>
								displayMessage(`Bu belge Merkeze Gönderildiği için değişiklik yapılamaz!<br/> <i>&nbsp;&nbsp;&nbsp;Sadece izlemeye izin verilecek...</i>`, app.appText),
								500);
							// return null;
						}
						if (rapormu) {
							setTimeout(() =>
								displayMessage(`Bu belge Merkezeden Gelen bir belgedir ve değişiklik yapılamaz!<br/> <i>&nbsp;&nbsp;&nbsp;Sadece izlemeye izin verilecek...</i>`, app.appText),
								500);
							// return null;
						}
						break;
					case 'izle':
						if (!fis.gecicimi) {
							setTimeout(() =>
								displayMessage(`Sadece <b>BELGE İZLEME</b> için giriş yapıldı!<br/><i> &nbsp;&nbsp;&nbsp;Belgede yapacağınız değişiklikleri kaydede<u>me</u>zsiniz...`, `** UYARI **`),
								500);
							break;
						}
				}
				const mustRec = musteriKullanilirmi ? await fis.getCariEkBilgi({ mustKod }) : null;
				let mevcutKonumBilgi = null;
				if (mustKod && islem != 'izle' && musteriKullanilirmi && app.konumTakibiYapilirmi) {
					const promise_konumBilgi = navigator?.geolocation.getCurrentPosition
						? new $.Deferred(p => navigator.geolocation.getCurrentPosition(konumBilgi => p.resolve($.extend({}, konumBilgi)), null, { enableHighAccuracy: true }))
						: null;
					try { if (promise_konumBilgi) { mevcutKonumBilgi = await promise_konumBilgi } }
					catch (ex) { console.error(`Mevcut Konum bilgisi alınamadı`, ex) }
					mevcutKonumBilgi = e.mevcutKonumBilgi = mevcutKonumBilgi?.coords;
					if (mevcutKonumBilgi) { mevcutKonumBilgi = { latitude: mevcutKonumBilgi.latitude, longitude: mevcutKonumBilgi.longitude, accuracy: mevcutKonumBilgi.accuracy } }
					if (!mevcutKonumBilgi && !sky.app.konumsuzIslemYapilirmi) {
						const ex = { isError: true, rc: 'mevcutKonumBelirlenemedi', errorText: `<b>Mevcut Konum belirlenemediği</b> için işlem yapılamaz` };
						setTimeout(() => displayMessage(ex.errorText, `@ Fiş Girişi @`, 200)); throw ex
					}
					if (mevcutKonumBilgi) {
						const mustKod2Bilgi = param.mustKod2Bilgi = param.mustKod2Bilgi || {};
						let paramMustRec = mustKod2Bilgi[mustKod] = mustKod2Bilgi[mustKod] || {}, mustKonumBilgi = paramMustRec.konumBilgi;
						if (!mustKonumBilgi) {
							const {konumLatitude, konumLongitude, konumAccuracy} = mustRec;
							if (konumLatitude && konumLongitude) { mustKonumBilgi = { latitude: konumLatitude, longitude: konumLongitude, accuracy: konumAccuracy } }
						}
						if (!mustKonumBilgi) {
							mustKonumBilgi = paramMustRec.konumBilgi = { latitude: mevcutKonumBilgi.latitude, longitude: mevcutKonumBilgi.longitude, accuracy: mevcutKonumBilgi.accuracy }; param.kaydet();
							if (mustKonumBilgi.latitude != null && mustKonumBilgi.longitude != null) {
								let upd = new MQIliskiliUpdate({
									from: 'mst_Cari', where: { degerAta: mustKod, saha: 'kod' },
									set: [
										{ degerAta: mustKonumBilgi.longitude, saha: 'konumLongitude' },
										{ degerAta: mustKonumBilgi.latitude, saha: 'konumLatitude' },
										{ degerAta: mustKonumBilgi.accuracy || 0, saha: 'konumAccuracy' }
									]
								}); await dbMgr.executeSql({ query: upd })
							}
						}
						/*if (
							(Math.abs(mevcutKonumBilgi.latitude - mustKonumBilgi.latitude) > (konumLatitudeTolerans || 0)) ||
							(Math.abs(mevcutKonumBilgi.longitude - mustKonumBilgi.longitude) > (konumLongitudeTolerans || 0))
						) {*/
						if (app.konumFarki({ konum1: mevcutKonumBilgi, konum2: mustKonumBilgi }) > (app.konumToleransMetre || 0)) {
							const ex = { isError: true, rc: 'mustKonumGecersiz', errorText: `<b>(${mustKod}) ${mustRec.unvan}</b> Müşterisine ait <u>Konum civarında olmadığınız</u> için işlem yapılamaz` };
							setTimeout(() => displayMessage(ex.errorText, `@ Fiş Girişi @`, 200)); throw ex
						}
					}
				}
				let promise_numaratorOlustur = fis.numaratorOlustur(), fisGirisIslemiBittimi = false, hizliGirisPartPromise = { isCancelled: false };
				if (islem == 'yeni' && fis.class.sonStoktanSecimYapilirmi && app.sonStoktanSecimYapilirmi) {
					(savedProcs || window).showProgress(null, null, 1, true);
					hizliGirisPartPromise = new $.Deferred(p => {
						setTimeout(async () => {
							let promise = CETFisGirisSonStoktanSecimPart.run({
								parentPart: this, islem, eskiFis, fis,
								secince: async e => {
									const result = { sender: e.sender, isCancelled: false, recs: part.altListePart.listeWidget.getRows() },  {recs} = result;
									const {satisKosulYapilari, promosyonYapilari} = part;
									if (!$.isEmptyObject(recs)) {
										const detaySinif = fis.class.detaySinif;
										for (const rec of recs) {
											const _detaySinif = fis.class.uygunDetaySinif({ rec }) || detaySinif, det = new _detaySinif(rec);
											await det.detayEkIslemler_ekle({ fis, satisKosulYapilari, promosyonYapilari }); fis.detaylar.push(det)
										}
									} p.resolve(result)
								},
								geriCallback: async e => {
									fisGirisIslemiBittimi = true;
									if (fis) { if (fis.geciciFis_destroyTimer) { fis.geciciFis_destroyTimer() } await fis.geciciFisleriTemizle({ tx: e.tx }) }
									p.resolve({ isCancelled: true })
								}
							});
							setTimeout(() => (savedProcs || window).hideProgress(), 200);
							let part = (await promise).part
							// await part.run()
						}, 10)
					})
				}
				(savedProcs || window).showProgress(null, null, 1, true);
				const basTS = now(); let result = await hizliGirisPartPromise;
				if (!result || result.isCancelled) { await fis.geciciFisleriTemizle({ tx: e.tx }); p.resolve(result); return }
				const hizliGirisPart = result.sender, fisGirisPartPromise = new $.Deferred(async p => {
					if (promise_numaratorOlustur) { await promise_numaratorOlustur }
					if (hizliGirisPart) { await hizliGirisPart.promise_ilkIslemler }
					let fisGirisPart = new uiSinif({
						parentPart: this, islem, eskiFis, fis,
						satisKosulYapilari: hizliGirisPart?.satisKosulYapilari, promosyonYapilari: hizliGirisPart?.promosyonYapilari,
						kaydedince: async e => {
							fisGirisIslemiBittimi = true; const sender = e.sender || {};
							const _e = $.extend({}, e, {
								isCancelled: false, islem, eskiFis: eskiFis, fis: sender.fis || fis,
								kaydederkenYazdirFlag: sender.kaydederkenYazdirFlag, kaydederkenAktarFlag: sender.kaydederkenAktarFlag
							});
							await fis.geciciFisleriTemizle({ tx: e.tx }); p.resolve(_e);
							setTimeout(_e => this.kaydetSonrasi($.extend({}, e, { result: _e, basTS: basTS, mevcutKonumBilgi })), 1, _e)
						},
						geriCallback: async e => {
							fisGirisIslemiBittimi = true;
							if (fis) {
								if (fis.geciciFis_destroyTimer) { fis.geciciFis_destroyTimer() }
								await fis.geciciFisleriTemizle({ tx: e.tx });
							}
							p.resolve({ isCancelled: true })
						}
					});
					(savedProcs || window).showProgress(null, null, 1, true);
					setTimeout(() => (savedProcs || window).hideProgress(null, null, 1, true), 500);
					// this.islemTuslariVarsaGizle();
					let _promise = fisGirisPart.run();
					setTimeout(() => {
						let uygunmu = fis && !(app.geciciFisKullanilmazmi || fis.class.geciciFisKullanilmazmi) && !fisGirisIslemiBittimi;
						uygunmu = uygunmu && (
							(hizliGirisPart && !hizliGirisPart.isDestroyed) ||
							(fisGirisPart && !fisGirisPart.isDestroyed)
						);
						uygunmu = uygunmu && (
							!(fis.devreDisimi || fis.gonderildimi) &&
							(fis.class.forkliftmi || !fis.gecicimi) &&
							(islem != 'sil')
						);
						
						let geciciFis;
						if (uygunmu) {
							geciciFis = fis.deepCopy();
							$.extend(geciciFis, { id: null, gecicimi: true });
							// await geciciFis.kaydet({ tx: e.tx });
							fis._geciciFis = geciciFis;
							fis.geciciFis_initTimer()
						}
					}, 500);
					try {
						await _promise

						/* if (hizliGirisPart && fisGirisPart && !fisGirisPart.isDestroyed && fis.class.promosyonKullanilirmi && fis.promosyonHesapla && !$.isEmptyObject(fis.detaylar))
							setTimeout(() => fisGirisPart.promosyonHesapla(), 500);
						*/
					}
					catch (ex) {
						if (ex && ex.rc && ex.rc == 'runtimeInterrupt')
							return
						displayServerResponse(ex)
					}
				});

				try {
					await fis.belgeGonderimKontrol($.extend({}, e, { id: undefined, inst: undefined, fis: undefined }))
				}
				catch (ex) {
					if (ex.statusText)
						displayServerResponse(ex);
					else
						displayMessage(ex.errorText || (ex || '').toString(), `${ex.isError ? '@' : '!'} Belge Girişi ${ex.isError ? '@' : '!'}`);
					(savedProcs || window).hideProgress();
					hideProgress();
					this.tazele();
					throw ex
				}
				
				result = await fisGirisPartPromise;
				p.resolve(result)
			});

			/*if (result && result.fis && !(result.isCancelled || result.isError)) {
			}*/
			
			setTimeout(() => fis.geciciFis_destroyTimer(), 500);
			
			return result;
		}

		async kaydetSonrasi(e) {
			const {app, layout, divListe, islemTuslariPart, ozelIslemTuslariPart} = this;
			const {param} = app;
			const {result} = e;
			const fis = result ? result.fis : null;
			if (!(result && fis) || (result.isCancelled || result.isError))
				return false;

			const {mustKod} = fis;
			if (mustKod) {
				const {basTS} = e;
				const sonTS = e.sonTS = now();
				const mustKod2Bilgi = param.mustKod2Bilgi = param.mustKod2Bilgi || {};
				const rec = mustKod2Bilgi[mustKod] = mustKod2Bilgi[mustKod] || {};
				$.extend(rec, {
					ilkTS: rec.ilkTS || dateTimeToString(basTS),
					sonTS: dateTimeToString(sonTS)
				});
				// .. aslında konumBilgi param yüklemede alınır ve webde fiş giriş öncesi takibi yapılır ..
				param.kaydet();
			}

			const parentMenu = ozelIslemTuslariPart.parentMenu;
			const {kaydederkenAktarFlag, kaydederkenYazdirFlag} = result;
			
			let promises = [];
			let yazdirildimi = false;
			if (kaydederkenAktarFlag)
				promises.push(this.merkezeBilgiGonder({ fis: fis }));
			if (kaydederkenYazdirFlag) {
				await this.yazdir({ fis: fis });
				yazdirildimi = true;
			}
			try {
				if (!$.isEmptyObject(promises))
					await Promise.all(promises);
			}
			catch (ex) {
				defFailBlockBasit(ex, 'error')
			}
			
			setTimeout(() => { this.tazele() }, yazdirildimi ? 500 : 200);
			setTimeout(() => { this.onResize() }, yazdirildimi ? 1500 : 500);
			return true;
		}

		fisIslemTipiSec() {
			return new $.Deferred(p => {
				new CETFisGirisIslemSecimPart({
					parentPart: this,
					secince: e =>
						p.resolve(e)
				}).run()
			})
		}

		fisSablonTipiSec() {
			// this.islemTuslariVarsaGizle();
			return new $.Deferred(async p => {
				await new CETKAListePart({
					parentPart: this, /* template: this.app.templates.cetListeOrtak, */
					table: `mst_SablonFisTipi`, idSaha: `kod`, adiSaha: `aciklama`,
					kodsuzmu: true,
					/*geriCallback: e => {
						this.islemTuslariVarsaGoster()
					},*/
					secince: e =>
						p.resolve(e)
				}).run()
			});
		}

		async getFis(e) {
			const {mustRec} = this;
			e = $.extend({
				mustKod: this.mustKod || (mustRec || {}).kod },
				e || {}
			);
			
			let {fis, fisTipi, rec} = e;
			if (!fis) {
				if (rec) {
					fis = $.isPlainObject(rec)
								? await CETFis.fromRec({ islem: e.islem, rec: rec })
								: rec;
				}
				else {
					let fisSinif = (fisTipi || {}).fisSinif;
					if (fisSinif)
						fis = new fisSinif(e);
				}
			}
			
			return fis;
		}

		
		async listeArgsDuzenle(e) {
			await super.listeArgsDuzenle(e);

			$.extend(e.listeArgs, {
				pageable: true, showToolbar: false, serverProcessing: true,
				columnsHeight: 25, pagerHeight: 35, filterMode: 'default'
			});
		}

		async liste_columnsDuzenle(e) {
			await super.liste_columnsDuzenle(e);
			
			$.merge(e.listeColumns, [
				{ text: 'Belge No', dataField: 'fisno', hidden: true },
				{ text: 'Belge Seri', dataField: 'seri', hidden: true },
				{ text: 'Belge Tarih', dataField: 'tarih', cellsformat: 'd', hidden: true },
				{ text: 'Belge Tipi', dataField: 'fistipi', hidden: true },
				{ text: 'Müşteri Kodu', dataField: 'mustkod', hidden: true },
				{ text: 'Müşteri Ünvanı', dataField: 'mustunvan', hidden: true },
				{
					text: 'Belge', align: 'left', dataField: null, filterable: false,
					cellsRenderer: (rowIndex, columnIndex, value, rec) => {
						const {app} = this;
						rec = rec.originalRecord || rec;

						const divSatir = this.newListeSatirDiv({ cssSubClass: 'belge' });
						divSatir.attr('data-index', rowIndex);

						const rapormu = asBool(rec.rapormu || rec.rapor);
						for (const key in rec) {
							const item = divSatir.find(`.${key}`);
							if (item.length)
								item.html(rec[key]);
						}
						
						if (rec.yore)
							divSatir.find(`.yore`).removeClass(`jqx-hidden`);
						if (rec.ilAdi)
							divSatir.find(`.ilAdiParent`).removeClass(`jqx-hidden`);
						
						if (asBool(rec.devreDisimi || rec.silindi)) {
							divSatir.addClass('devreDisi');
							divSatir.find('.devreDisiTextParent').removeClass('jqx-hidden')
						}
						else
							divSatir.find('.devreDisiTextParent').addClass('jqx-hidden')
						if (!rapormu && asBool(rec.gonderildimi || rec.gonderildi))
							divSatir.addClass('gonderildi');
						if (asBool(rec.yazdirildimi || rec.yazdirildi))
							divSatir.addClass('yazdirildi');
						if (asBool(rec.degismedimi || rec.degismedi))
							divSatir.addClass('degismedi');
						
						const geciciFisTextParent = divSatir.find(`.geciciFisTextParent`);
						if (asBool(rec.gecicimi || rec.gecici)) {
							divSatir.addClass('gecici');
							if (geciciFisTextParent.length)
								geciciFisTextParent.removeClass(`jqx-hidden`);
						}
						else {
							if (geciciFisTextParent.length)
								geciciFisTextParent.addClass(`jqx-hidden`);
						}

						const raporFisTextParent = divSatir.find(`.raporFisTextParent`);
						if (asBool(rec.rapormu || rec.rapor)) {
							divSatir.addClass('rapor');
							if (raporFisTextParent.length)
								raporFisTextParent.removeClass(`jqx-hidden`);
						}
						else {
							if (raporFisTextParent.length)
								raporFisTextParent.addClass(`jqx-hidden`);
						}
						
						if (rec.ozelIsaret)
							divSatir.addClass(`ozelIsaret-${rec.ozelIsaret == '*' ? 'yildiz' : rec.ozelIsaret} ozelIsaretli`);

						if (rec.vade)
							divSatir.find(`.vadeParent`).removeClass(`jqx-hidden`);
						
						const eIslemTip = rec.efayrimtipi;
						if (eIslemTip) {
							divSatir.find('.eIslemParent').removeClass('jqx-hidden');
							divSatir.find('.eIslemText').html(app.eIslemTip2KisaAdi(rec.efayrimtipi));
							divSatir.addClass('eIslem');
							divSatir.addClass(`eIslem-${eIslemTip}`);
						}
						if (rec.zorunluguidstr)
							divSatir.find('.uuidParent').removeClass('jqx-hidden');

						if (rec.soforAdi || rec.plaka || rec.ekBilgi)
							divSatir.find('.seferBilgiParent').removeClass('jqx-hidden');
						if (rec.containerNox)
							divSatir.find('.containerNoxBilgiParent').removeClass('jqx-hidden');

						return divSatir[0].outerHTML.trim();
					}
				},
				{
					text: 'İşlem', align: 'left', dataField: null, width: 100,
					cellsRenderer: (rowIndex, columnIndex, value, rec) => {
						const divSatir = this.newListeSatirDiv({ cssSubClass: 'total' });
						divSatir.attr('data-index', rowIndex);

						const rapormu = asBool(rec.rapormu || rec.rapor);
						$.each(rec, (key, value) => {
							let item = divSatir.find(`.${key}`);
							if (item.length)
								item.html(value);
						});
						if (asBool(rec.devreDisimi || rec.silindi))
							divSatir.addClass('devreDisi');
						if (!rapormu && asBool(rec.gonderildimi || rec.gonderildi))
							divSatir.addClass('gonderildi');
						if (asBool(rec.yazdirildimi || rec.yazdirildi))
							divSatir.addClass('yazdirildi');
						if (asBool(rec.degismedimi || rec.degismedi))
							divSatir.addClass('degismedi');
						if (rec.ozelIsaret)
							divSatir.addClass(`ozelIsaret-${rec.ozelIsaret == '*' ? 'yildiz' : rec.ozelIsaret} ozelIsaretli`);
					
						const ekleyici = e => {
							if (!e.value)
								return null;
							let elm = divSatir.find(e.selector);
							if (elm.length) {
								let value = $.isFunction(e.valueGetter)
													? e.valueGetter.call(this, e.value)
													: (e.valueGetter || e.value);
								if (value) {
									elm.html(value);
									elm.removeClass('jqx-hidden');
								}
								else {
									elm.addClass('jqx-hidden');
								}

								return elm;
							}
							return null;
						}
						ekleyici({
							selector: `.kayitSayisiVefisSonucText`, value: rec,
							valueGetter: rec => (
								(rec.detaySayisi ? `<span class="veri">${rec.detaySayisi.toLocaleString()}</span> <span class="etiket">satır</span>` : ``) +
								(rec.fisSonuc ? `<br/><span class="veri">${bedelStr(rec.fisSonuc)} <u class="orangered">${rec.dvkod || 'TL'}</u></span>` : ``)
							)
						});
						/*let divBakiyeVeRiskText = ekleyici({
							selector: `.bakiyeVeRiskText`, value: rec,
							valueGetter: rec => (
								(rec.bakiye ? `<span class="etiket">B:</span><span class="veri bakiye">${bedelStr(rec.bakiye)}</span>` : ``) +
								(rec.riskli ? ` <span class="etiket">R:</span><span class="veri kalanRisk">${bedelStr(rec.riskli)}</span>` : ``)
							)
						});
						if (divBakiyeVeRiskText && divBakiyeVeRiskText.length) {
							if ((asFloat(rec.bakiye) || 0) < 0)
								divBakiyeVeRiskText.find('.bakiye').addClass('red');
							if ((asFloat(rec.riskli) || 0) < 0)
								divBakiyeVeRiskText.find('.kalanRisk').addClass('red');
						}*/

						return divSatir[0].outerHTML.trim();
					}
				}
			]);
		}

		loadServerData_buildQuery(e) {
			const {app} = this;
			const wsArgs = $.extend({}, e.wsArgs, { rowCountOnly: e.rowCountOnly });
			const filterGroups = wsArgs.filterGroups || [];
			for (const filterGroup of filterGroups) {
				const filters = filterGroup.filters || [];
				for (const filter of filters) {
					switch (filter.field) {
						case 'mustkod': filter.field = 'fis.mustkod'; break;
						case 'mustunvan': filter.field = 'car.unvan'; break;
					}
				}
			}
			wsArgs.filters = this.getFiltersFromListeWSArgs(wsArgs);
			switch (parseInt(wsArgs.sortdatafield)) {
				case 5:
					wsArgs.sortdatafield = ['tarih', 'seri', 'fisno'];
					break;
				case 6:
					wsArgs.sortdatafield = ['fisSonuc'];
					break;
			}
			if (!e.rowCountOnly && $.isEmptyObject(wsArgs.sortdatafield))
				wsArgs.sortdatafield = ['kayitzamani'];
				// wsArgs.sortdatafield = ['rowid'];
				// wsArgs.sortdatafield = [];
				// wsArgs.sortdatafield = ['tarih', 'kayitzamani', 'seri', 'fisno'];
				// wsArgs.sortdatafield = ['tarih', 'seri', 'fisno', 'fisTipText'];
				// wsArgs.sortdatafield = ['kayitzamani'];

			let uni = new MQUnionAll();
			let stm = new MQStm({ sent: uni });
			app.fisListe_stmSentDuzenle($.extend({ stm: stm, uni: uni }, wsArgs));
			
			const {mustKod} = this;
			if (mustKod) {
				uni.sentDo(sent =>
					sent.where.degerAta(mustKod, 'fis.mustkod'));
			}
			
			stm.fromGridWSArgs(wsArgs);

			return stm;
		}

		/*buildQuery_detayToplamlari(e) {
			let recs = e.recs;
			let idListe = [];
			$.each(recs, (_, rec) =>
				idListe.push(rec.rowid));
			
			let sent = new MQSent({
				from: `data_PIFStok har`,
				sahalar: ['har.fissayac', 'COUNT(*) detaySayisi']
			})
			sent.where.inDizi(idListe, 'har.fissayac');
			
			return sent.getQueryYapi();
		}*/

		async loadServerData_ekIslemler(e) {
			let result = await super.loadServerData_ekIslemler(e);
			if (result)
				return result;
			
			// let id2Rec = e.id2Rec = {};
			const {recs} = e;
			for (const i in recs) {
				const rec = recs[i];
				let fisTipText = (rec.fisTipText || '').trim();
				if (!fisTipText) {
					let fisSinif = CETFis.fisSinifFor({ rec: rec });
					const ayrimTipi = rec.ayrimtipi;
					fisTipText = (fisSinif ? fisSinif.aciklama : null) || '';
					if (ayrimTipi)
						fisTipText = `${fisSinif.ayrimTipAdiFor({ ayrimTipi: ayrimTipi })} ${fisTipText}`;
				}
				
				// id2Rec[rec.rowid] = rec;
				$.extend(rec, {
					tarih: dateKisaString(new Date(rec.tarih) || ''),
					vade: rec.vade ? dateKisaString(new Date(rec.vade) || '') : null,
					mustText: rec.mustkod
									? `(<span class="mustKod">${rec.mustkod}</span>) <span class="mustUnvan">${rec.mustunvan}</span>`
									: '',
					fisTipText: fisTipText
				})
			}

			this.focusToDefault();
		}

		
		async liste_veriYuklendi(e) {
			// await super.liste_veriYuklendi(e);
			
			if (this.isListeVeriYuklendiEventTriggered)
				return super.liste_veriYuklendi(e);

			await this.selectLastRec();
			this.isListeVeriYuklendiEventTriggered = true;

			if (!$.isEmptyObject(this.listeRecs))
				this.clearUniqueTimeout({ key: 'yeniToolTip' });
			this.focusToDefault();
		}

		liste_satirTiklandi(e) {
			this.focusToDefault();
		}

		liste_satirCiftTiklandi(e) {
			if (this.selectedRec)
				this.ozelIslemTuslariPart.itemClicked(`degistir`);
			// super.liste_satirCiftTiklandi(e);			
		}

		liste_satirSecimDegisti(e) {
			super.liste_satirSecimDegisti(e);

			const layout = e.layout || this.layout;
			const {islemTuslariPart} = this;
			const rec = this.selectedRec;
			setButonEnabled(islemTuslariPart.parentMenu.find(`*:not(yeni)`), !!rec);
			
			/*const param = this.app.param;
			const serbestModmu = this.app.serbestModmu;
			if (!serbestModmu) {
				$.merge(islemTuslariPart.parentMenu.find('#degistir'), $('.liste.popup #degistir'))
					.html(rec && asBool(rec.gecicimi || rec.gecici) ? 'DEĞİŞTİR' : 'İZLE');
				// .addClass('lightgray')
			}*/
		}

		/*liste_renderToolbar(e) {
			const param = this.app.param;
			const serbestModmu = this.app.serbestModmu;
			
			const layout = e.layout || this.layout;
			const toolbar = e.listeToolbar;
			let divIslemTuslari = toolbar.find('.toolbar.islemTuslari');
			if (!divIslemTuslari.length) {
				divIslemTuslari = this.template_listeParts.contents('.toolbar.islemTuslari').clone(true);
				divIslemTuslari.find('#sil').html(serbestModmu ? 'SİL' : 'İPTAL');
				divIslemTuslari.appendTo(toolbar);
				
				let liItems = divIslemTuslari.find('ul > li');
				divIslemTuslari.jqxMenu({
					theme: theme, mode: 'horizontal',
					animationShowDuration: 0, animationHideDuration: 0
				});
				liItems.on('click', evt =>
					this.liste_islemTusuTiklandi($.extend({}, e, { event: evt })));
			}
		}*/

		initIslemTuslari(e) {
			e = e || {};
			const {app} = this;
			const layout = e.layout || this.layout;
			let {islemTuslariPart} = this;
			if (!islemTuslariPart) {
				islemTuslariPart = this.islemTuslariPart = new CETExpandableIslemTuslariPart({
					/* position: ``, */
					templateItems: layout.find(`.toolbar-external.islemTuslari`),
					onItemClicked: async e => await this.liste_islemTusuTiklandi(e)
				});
				islemTuslariPart.basicRun();

				if (!app.musteriDurumuKullanilirmi) {
					setTimeout(() => {
						const menuItems = islemTuslariPart.parentMenu.find(`.item`);
						const item = menuItems.filter(`#musteriDurumu.item`);
						if (item.length)
							item.remove();
					}, 100);
				}
			
				/*let parentMenu = islemTuslariPart.parentMenu;
				setTimeout(() => {
					// parentMenu.find(`#yeniSablonlu`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Ticari programda <b>Yeni Fiş Yöntemi</b> adımından tanımlanmış yöntemlerden biri seçilerek, başlık bilgileri atanmış durumda, doğrudan yeni fiş girişine başlanır` });
					parentMenu.find(`#kopya`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Belge Kopyala` });
					parentMenu.find(`#yazdir`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Belge Yazdır` });
					parentMenu.find(`#gonder`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `<p style="font-weight: bold;">Belgeyi Merkeze Gönder</p><i>İstenirse Ana Menü'deki <b>Bilgi Gönder</b> adımı ile toplu gönderim de yapılabilir</i>` });
					parentMenu.find(`#belgeTransfer`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Belge Seri/No Değişikliği` });
					parentMenu.find(`#geciciFisleriSil`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Otomatik Kaydedilen (<i>Kurtarma Kaydı olarak da bilinen</i>) Geçici Fişleri temizler` });
					parentMenu.find(`#barkod`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Cihaz Kamerası ile Barkod okutarak belge girişi yapar` });
					parentMenu.find(`#tazele`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Listeyi tazele` });
				}, 10)*/
			}
			
			let {ozelIslemTuslariPart} = this;
			if (!ozelIslemTuslariPart) {
				ozelIslemTuslariPart = this.ozelIslemTuslariPart = new CETExpandableIslemTuslariPart({
					position: `bottom right`,
					mode: 'menu',
					templateItems: layout.find(`.toolbar-external.islemTuslari-ozel`),
					onItemClicked: async e => await this.liste_islemTusuTiklandi(e)
				});
				ozelIslemTuslariPart.basicRun();
				
				let parentMenu = ozelIslemTuslariPart.parentMenu;
				setTimeout(() => {
					/*parentMenu.find(`#yeni`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Yeni Belge` });
					parentMenu.find(`#yeniSablonlu`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Ticari programda <b>Yeni Fiş Yöntemi</b> adımından tanımlanmış yöntemlerden biri seçilerek, başlık bilgileri atanmış durumda, doğrudan yeni fiş girişine başlanır` });
					parentMenu.find(`#degistir`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Belge Değiştir/İzle` });
					parentMenu.find(`#iptal`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Belge <span class="bold">SİL</span>` });*/
				}, 10);
			}
			
			/*const {param} = this.app;
			const serbestModmu = this.app.serbestModmu;
			const itemSil = islemTuslariPart.parentMenu.find(`#sil`);
			if (itemSil.length)
				itemSil.find(`.item`).html(serbestModmu ? 'SİL' : 'İPTAL');*/
		}

		async liste_islemTusuTiklandi(e) {
			let rec = e.rec || this.selectedBoundRec;
			// displayMessage(`<ul style="padding: 8px;"><li>clicked: [${elm.innerHTML}]</li><li>activeRec: [(${(rec || {}).kod}) - ${(rec || {}).unvan}]</li>`);

			// let fisIslemTipi = (await this.fisGirisYap(e)).rec;
			// displayMessage(`<ul style="padding: 8px;"><li>clicked: [<b>${elm.id}</b> - ${elm.innerHTML}]</li><li>activeRec: [(${(rec || {}).kod}) - ${(rec || {}).unvan}]</li><li>fisTipi: [${fisTipi.parantezliOzet({ styled: true })}]</li>`);
			
			const islem = e.id;
			switch (islem) {
				case 'yeni':
				case 'yeniSablonlu':
				case 'degistir':
				case 'kopya':
					await this.fisGirisYap({ islem: e.id, rec: rec, sablon: (islem == 'yeniSablonlu' ? true : null) });
					await this.tazele();
					break;
				case 'sil':
				case 'iptal':
					await this.silIstendi(e);
					break;
				case 'yazdir':
					await this.yazdirIstendi($.extend({}, e, { rec: undefined }));
					break;
				case 'gonder':
					await this.merkezeBilgiGonderIstendi($.extend({}, e, { rec: undefined }));
					break;
				case 'geciciFisleriSil':
					await this.geciciFisleriSilIstendi($.extend({}, e, { rec: undefined }));
					break;
				case 'barkod':
					await this.barkodIstendi($.extend({}, e, { rec: undefined }));
					return;
				case 'belgeTransfer':
					await this.belgeTransferIstendi(e);
					return;
				case 'tazele':
					await this.tazele(e);
					break;
				case 'musteriDurumu':
					await this.musteriDurumuIstendi(e);
					break;
			}

			if (islem == 'yeni' || islem == 'kopya')
				this.selectLastRec();
			
			this.focusToDefault();

			/*switch (fisIslemTipi.kod) {
				case 'fisListesi':
					break;
			}*/
		}

		async tazele(e) {
			await super.tazele(e);
			this.initMustBilgi();
			// this.focusToDefault();
		}

		silIstendi(e) {
			e = e || {};
			const rec = e.rec || this.selectedBoundRec;
			const {app} = sky;
			const {param} = app;
			const serbestModmu = app.serbestModmu;
			const devreDisimi = asBool(rec.devreDisimi || rec.silindi);
			const gonderildimi = asBool(rec.gonderildimi || rec.gonderildi);
			const rapormu = asBool(rec.rapormu || rec.rapor);
			if (rapormu) {
				displayMessage(`Bu Merkezden Gelen bir belgedir ve İPTAL edilemez!`, app.appText);
				return false;
			}
			if (!serbestModmu) {
				if (param.kapandimi) {
					displayMessage(`<b>Kapanış yapıldığı için</b> İPTAL edilemez`, `@ ${app.appText} @`);
					return;
				}
				if (devreDisimi) {
					displayMessage(`Bu belge DevreDışı olduğu için İPTAL edilemez!`, app.appText);
					return false;
				}
				if (gonderildimi) {
					displayMessage(`Bu belge Merkeze Gönderildiği için İPTAL edilemez!`, app.appText);
					return false;
				}
			}

			return new $.Deferred(p => {
				let wnd = displayMessage(
					`<span class="bold darkred">Seçilen Belge ${serbestModmu ? 'SİLİNSİN' : 'İPTAL EDİLSİN'} mi?</span>`,
					this.app.appText,
					true,
					{
						EVET: async (dlgUI, btnUI) => {
							dlgUI.jqxWindow('destroy');
							p.resolve(await this.sil(e));
						},
						HAYIR: (dlgUI, btnUI) =>
							dlgUI.jqxWindow('destroy')
					}
				);
				wnd.find('.ui-dialog-button[value=EVET]')
					.css('color', 'red')
					.css('font-weight', 'bold');
			});
		}

		async sil(e) {
			e = e || {};
			const rec = e.rec || this.selectedBoundRec;
			const index = e.index;
			if (!rec && (index == null || index < 0))
				return false
			
			/*let fisSinif = e.fisSinif || await CETFis.fisSinifFor({ rec: rec });
			if (typeof fisSinif == 'string')
				fisSinif = window[fisSinif];*/

			try {
				const fis = await this.getFis({ rec: rec });
				sky.app.merkezeBilgiGonderTimer_start(e);
				try {
					if (fis)
						await fis.belgeGonderimKontrol($.extend({}, e, { id: undefined, inst: undefined, fis: undefined }))
				}
				catch (ex) {
					if (ex.statusText)
						displayServerResponse(ex);
					else
						displayMessage(ex.errorText || (ex || '').toString(), `${ex.isError ? '@' : '!'} Belge Girişi ${ex.isError ? '@' : '!'}`);
					(savedProcs || window).hideProgress();
					hideProgress();
					this.tazele();
					throw ex
				}
				
				if (!fis && rec) {
					let del = new MQIliskiliDelete({ from: CETStokTicariFis.table, where: { degerAta: rec.rowid, saha: 'rowid' } });
					let result = await CETStokTicariFis.dbMgr.executeSql({ tx: e.tx, query: del });
					if (result)
						await this.tazele(e)
					return result
					// return null
				}

				const {dbMgr} = fis;
				// let tx = await dbMgr.transaction();
				// let result = await fis.sil($.extend({ tx: tx }, e));
				let result = await fis.sil(e);
				if (!result)
					return result
				if (result.isError)
					throw result
			}
			catch (ex) {
				if (ex.statusText)
					displayServerResponse(ex);
				else
					displayMessage(ex.errorText || (ex || '').toString(), `${ex.isError ? '@' : '!'} Belge İPTAL İşlemi ${ex.isError ? '@' : '!'}`);
				throw ex;
			}
			
			// tx = await dbMgr.transaction();
			await this.tazele(e);

			return result
		}

		async yazdirIstendi(e) {
			e = e || {};
			const {app} = this;
			const rec = e.rec || this.selectedRec || {};
			const fis = e.fis || await this.getFis({ rec: rec });
			const devreDisimi = fis ? fis.devreDisimi : asBool(rec.silindi);
			const gecicimi = fis ? fis.gecicimi : asBool(rec.gecici);
			const rapormu = fis ? fis.rapormu : asBool(rec.rapor);
			if (devreDisimi) {
				displayMessage(`Bu belge DevreDışı olduğu için Yazdırılamaz!`, app.appText);
				return false;
			}
			if (gecicimi) {
				displayMessage(`Bu bir Geçici Belgedir ve Yazdırılamaz!`, app.appText);
				return false;	
			}
			if (rapormu) {
				displayMessage(`Bu Merkezden Gelen bir belgedir ve Yazdırılamaz!`, app.appText);
				return false;	
			}

			// let elm = e.event.currentTarget;
			// displayMessage(`<ul style="padding: 8px;"><li>clicked: [<b>${elm.id}</b> - ${elm.innerHTML}]</li><li>activeRec: [(${(rec || {}).mustkod}) - ${(rec || {}).mustUnvan}]</li>`);

			return await this.yazdir($.extend({}, e, { rec: rec, fis: fis }));
		}

		async yazdir(e) {
			try {
				const {fis} = e;
				if (!fis)
					return null;

				let result = await fis.yazdir(e);
				if (!result)
					return result;
				
				// setTimeout(() => this.tazele(), 3000);

				const fisSinif = fis.class;
				let upd = new MQIliskiliUpdate({
					from: fisSinif.table,
					set: `yazdirildi = '*'`,
					where: { degerAta: fis.id, saha: `rowid` }
				});
				
				result = await fis.dbMgr.executeSql({ query: upd });
				// setTimeout(() => this.tazele(), 3000);
				
				return result;
			}
			finally { hideProgress() }
		}

		async merkezeBilgiGonderIstendi(e) {
			e = $.extend({}, e || {});
			const {app} = this;
			const rec = e.rec || this.selectedRec || {};
			const fis = e.fis || await this.getFis({ rec: rec });
			
			const gonderildimi = asBool(fis ? fis.gonderildimi : rec.gonderildi);
			const gecicimi = asBool(fis ? fis.gecicimi : rec.gecici);
			const rapormu = fis ? fis.rapormu : asBool(rec.rapor);
			const degismedimi = fis ? fis.degismedimi : asBool(rec.degismedi);
			/*if (gonderildimi) {
				displayMessage(`Bu belge zaten merkeze gönderilmiş!`, app.appText);
				return false;
			}*/
			if (gecicimi) {
				displayMessage(`Bu geçici bir belgedir ve merkeze gönderilemez!`, app.appText);
				return false;
			}
			if (rapormu) {
				displayMessage(`Bu Merkezden Gelen bir belgedir ve Yazdırılamaz!`, app.appText);
				return false;	
			}
			if (degismedimi) {
				displayMessage(`Bu belge üzerinde bir değişiklik yapılmadığı için merkeze gönderilemez!`, app.appText);
				return false;	
			}

			const fisSinif = e.fisSinif || (fis ? fis.class : CETFis.fisSinifFor({ rec: rec }));
			if (!fisSinif)
				return null;
			
			const layout = app.templates.merkezeBilgiGonderMesaji.contents('div').clone(true);
			layout.addClass(`part ${app.appName} ${app.rootAppName}`);
			createJQXWindow(
				layout,
				app.appText,
				{
					isModal: true, showCollapseButton: false, closeButtonAction: 'destroy',
					width: 'auto', height: 230
				},
				{
					EVET: (dlgUI, btnUI) => {
						$.extend(e, { rec: rec, fis: fis, fisSinif: fisSinif });
						dlgUI.jqxWindow('destroy');
						this.merkezeBilgiGonderIstendiDevam(e);
					},
					HAYIR: (dlgUI, btnUI) => {
						dlgUI.jqxWindow('destroy')
					}
				}
			)
		}

		async merkezeBilgiGonderIstendiDevam(e) {
			const rec = e.rec || this.selectedRec || {};
			const fis = e.fis || await this.getFis({ rec: rec });
			
			const gonderildimi = (fis ? fis.gonderildimi : asBool(rec.gonderildi));
			const gecicimi = (fis ? fis.gecicimi : asBool(rec.gecici));
			const rapormu = fis ? fis.rapormu : asBool(rec.rapor);
			const degismedimi = fis ? fis.degismedimi : asBool(rec.degismedi);
			/*if (gonderildimi) {
				displayMessage(`Bu belge zaten merkeze gönderilmiş!`, this.app.appText);
				return false;
			}*/
			if (gecicimi) {
				displayMessage(`Bu geçici bir belgedir ve merkeze gönderilemez!`, this.app.appText);
				return false;
			}
			if (rapormu) {
				displayMessage(`Bu Merkezden Gelen bir belgedir ve Yazdırılamaz!`, app.appText);
				return false;	
			}
			if (degismedimi) {
				displayMessage(`Bu belge üzerinde bir değişiklik yapılmadığı için merkeze gönderilemez!`, app.appText);
				return false;	
			}

			let result = await this.merkezeBilgiGonder($.extend({}, e, { rec: rec, fis: fis }));
			setTimeout(() => this.tazele(), 10);

			return result;
		}

		async merkezeBilgiGonder(e) {
			const {app} = this;
			const {rec, fis} = e;
			const fisSinif = e.fisSinif || (fis ? fis.class : CETFis.fisSinifFor({ rec: rec }));
			if (!fisSinif)
				return null;

			const table = fisSinif ? fisSinif.table : null;
			const fisID = fis ? fis.id : rec.rowid;
			const dbMgr = fis ? fis.dbMgr : (fisSinif ? fisSinif.dbMgr : app.dbMgr_mf);
			/*if (fisID) {
				const idSaha = fisSinif.idSaha || 'rowid';
				let sent = new MQSent({
					from: table,
					where: [
						{ degerAta: fisID, saha: idSaha },
						`gonderildi <> ''`
					],
					sahalar: ['COUNT(*) sayi']
				});
				if (asInteger(await dbMgr.tekilDegerExecuteSelect({ tx: e.tx, query: new MQStm({ sent: sent })}))) {
					rec.gonderildimi = '*';
					if (fis)
						fis.gonderildimi = true;
					return null;
				}
			}*/

			const {divListe, islemTuslariPart, ozelIslemTuslariPart} = this;
			const parentMenu = ozelIslemTuslariPart.parentMenu;
			try {
				divListe.jqxDataTable('disabled', true);
				parentMenu.children().filter((ind, li) =>
					li.id == 'degistir' || li.id == 'iptal'
				).addClass(`jqx-hidden`);
				islemTuslariPart.popupMenu.children().filter((ind, li) =>
					li.id == 'gonder' || li.id == 'belgeTransfer'
				).addClass(`jqx-hidden`);
			}
			catch (ex) { }
			
			try {
				if (fisID) {
					const idSaha = fisSinif.idSaha || 'rowid';
					let upd = new MQIliskiliUpdate({
						from: table,
						where: [
							{ degerAta: fisID, saha: idSaha },
							`gonderildi <> ''`
						],
						set: [`gonderildi = ''`]
					});
					await dbMgr.executeSql({ tx: e.tx, query: upd });
				}
				
				const bilgiGonderTableYapilari = e.bilgiGonderTableYapilari = [];
				(this.app.bilgiGonderTableYapilari || []).forEach(tableYapi => {
					const fisTable = tableYapi.baslik;
					if (fisTable && fisTable == table)
						bilgiGonderTableYapilari.push($.extend({ fisIDListe: [fisID] }, tableYapi));
				});
	
				try { return await app.merkezeBilgiGonder({ otoGondermi: true, bilgiGonderTableYapilari: bilgiGonderTableYapilari }) }
				finally { hideProgress() }
			}
			finally {
				try {
					parentMenu.children().filter((ind, li) =>
						li.id == 'degistir' || li.id == 'iptal'
					).removeClass(`jqx-hidden`);
					islemTuslariPart.popupMenu.children().filter((ind, li) =>
						li.id == 'gonder' || li.id == 'belgeTransfer'
					).removeClass(`jqx-hidden`);
					divListe.jqxDataTable('disabled', false);
				}
				catch (ex) { }
			}
		}

		geciciFisleriSilIstendi(e) {
			this.geciciFisleriSil(e)
		}
		async geciciFisleriSil(e) {
			e = e || {}
			// await showProgress('Geçici Fişler temizleniyor...', null, 0);
			const bilgiGonderTableYapilari = this.app.bilgiGonderTableYapilari;
			try {
				let deleteCount = 0;
				for (let i in bilgiGonderTableYapilari) {
					const table = bilgiGonderTableYapilari[i].baslik;
					if (table) {
						const result = await MQCogul.geciciFisleriTemizle($.extend({}, e, { table: table }));
						if (result)
							deleteCount += result.rowsAffected || 0
					}
				}
				setTimeout(() => this.tazele(), 200)
				displayMessage(
					deleteCount
						? `.. ${deleteCount.toLocaleString()} adet Geçici Fiş silindi ..`
						: `Silinecek fiş bulunamadı!`
				)
				return true
			}
			finally { setTimeout(() => hideProgress(), 200) }
		}

		async barkodIstendi(e) {
			e = e || {};
			const {layout} = this;
			const barkodContainer = layout.find(`#barkodContainer`);
			let barcodeReader = this.barcodeReader;
			if (!barcodeReader) {
				const deviceClass = CETBarkodDevice.defaultDeviceClass;
				if (!deviceClass)
					return;
				
				barcodeReader = this.barcodeReader = new deviceClass({
					content: barkodContainer,
					debug: this.app.class.isDebug,
					onKamerami: this.app.onKamerami,
					readCallback: _e => {
						try {
							this.barkodOkundu($.extend({}, e, _e, { barkod: _e.result }))
						}
						catch (ex) {
							ex = ex.responseJSON || ex;
							if (ex.errorText)
								displayMessage(ex.errorText, `Barkod Okutma İşlemi`);
						}

					}
				});
			}
			if (!barcodeReader.initFlag || barcodeReader.isReady) {
				// this.barkodParent.removeClass(`jqx-hidden`);
				await barcodeReader.start()
			}
			else {
				// this.barkodParent.addClass(`jqx-hidden`);
				await await barcodeReader.destroy()
			}
			
			const btnBarkod = this.islemTuslariPart.parentMenu.find(`#barkod`);
			btnBarkod.removeClass(`ready paused running`);
			btnBarkod.addClass(barcodeReader.state);
		}

		async barkodOkundu(e) {
			e = e || {};
			const barkod = (e.barkod || '').trim();
			if (!barkod)
				return;
			
			let data, error;
			try {
				data = barkod ? JSON.parse(barkod) : null
			}
			catch (ex) {
				error = ex;
			}
			if (!data)
				throw { isError: true, errorText: `! <p class="bold;">Okunan barkod hatalıdır:</p><div style="margin-left: 10px;"${barkod}</div><p class="italic darkred">${(error || {}).message}</p> !`}
			
			let fisSinif = CETFis.fisSinifFor(data);
			if (!fisSinif)
				throw { isError: true, errorText: fisSinif || `@@ <b>${barkod}</b> barkodu için Belge Sınıfı belirlenemedi`};
			
			let fis = new fisSinif(data);
			if (!fis)
				throw { isError: true, errorText: fisSinif || `@@ <b>${barkod}</b> barkodu için Belge oluşturulamadı`};
			
			if (asBool(data.otoKaydet)) {
				await fis.kaydet();
				this.tazele();
				return fis;
			}

			fis.gecicimi = true;
			// await fis.kaydet();
			await this.liste_islemTusuTiklandi({ id: 'kopya', rec: fis });

			const {txtBarkod} = this;
			if (txtBarkod && txtBarkod.length)
				txtBarkod.select();
			this.focusToDefault();

			return fis;
		}

		belgeTransferIstendi(e) {
			e = $.extend({}, e);
			const rec = e.rec = e.rec || this.selectedBoundRec;
			if (asBool(rec.gonderildi) || asBool(rec.gonderildimi)) {
				displayMessage(`Merkeze gönderilmiş belgeler üzerinde değişiklik yapılamaz!`, `Belge Transfer`);
				return;
			}

			const fisSinif = e.fisSinif = e.fisSinif || (e.fis ? e.fis.class : null) || CETFis.fisSinifFor({ rec });
			if (!fisSinif) {
				displayMessage(`Seçilen belge için Fiş Sınıfı belirlenemedi`, `Belge Transfer`);
				return;
			}
			if (!fisSinif.seriNoDesteklermi) {
				displayMessage(`Seçilen belge için No Transferi yapılamaz`, `Belge Transfer`);
				return;
			}

			const wndName = e.wndName = `belgeTransfer`;
			const {windows} = this;
			const templateWindows = this.templates.windows;
			let wnd = windows[wndName];
			if (wnd)
				wnd.jqxWindow('close');
			
			const wndContent = e.wndMainContent = templateWindows.contents(`.${wndName}.ekran`).clone(true);
			wnd = e.wnd = windows[wndName] = createJQXWindow(
				wndContent,
				`Belge Transfer Ekranı`,
				{	isModal: true, showCollapseButton: true, closeButtonAction: 'close',
					autoOpen: false, width: '99.9%', height: 430,
					position: { x: 4, y: 80 }
				},
				{
					TAMAM: (dlgUI, btnUI) =>
						this.belgeTransferIstendiDevam_tamamIstendi(e),
					VAZGEC: (dlgUI, btnUI) =>
						wnd.jqxWindow('close')
				}
			);
			wnd.addClass(`part ${this.partName} ${wndName} ${this.app.appName} ${this.app.rootAppName}`);

			const btnTamam = e.btnTamam = wnd.find(`.ui-dialog-button input[type=button][value=TAMAM]`);
			btnTamam.addClass(`jqx-primary`);
			
			wnd
				.off('close')
				.on('close', evt =>
					this.belgeTransferIstendiDevam_ekranKapandi(e));
			wnd
				.off('open')
				.on('open', evt =>
					this.belgeTransferIstendiDevam_ekranAcildi(e));
			wnd.jqxWindow('open');
		}

		belgeTransferIstendiDevam_ekranAcildi(e) {
			const {wnd, wndMainContent, rec, btnTamam} = e;
			const tabs = e.tabs = wndMainContent.find(`#tabs`);

			if (asBool(rec.gonderildi) || asBool(rec.gonderildimi)) {
				tabs.find(`li:not(#topluFisNoTransfer), div:not(#topluFisNoTransfer)`).remove();
				displayMessage(`Seçilen belge merkeze gönderilmiş. Merkeze belgeler üzerinde <u>değişiklik yapılamaz</u>!<p/>Sadece <b>Toplu No Transferi</b> işlemine izin verilecek...`, `Belge Transfer`);
			}

			tabs.jqxTabs({ theme: theme, width: '100%', height: wndMainContent.parent().parent().height() - 70, position: 'top' });
			
			const subContents = e.wndSubContents = {
				belgeTransfer: tabs.find(`div#belgeTransfer`),
				topluFisNoTransfer: tabs.find(`div#topluFisNoTransfer`)
			};
			let wndContent = subContents.belgeTransfer;
			if (rec) {
				wndContent.find(`#yeniFisSeri`)
					.jqxInput({ theme: theme, height: false, maxLength: 3 })
					.off('change')
					.on('change', evt => {
						let target = evt.args || evt.target;
						const seri = (target.value || '').toUpperCase();
						evt.target.value = seri;
					}).val(rec.seri || '');
				wndContent.find(`#yeniFisNo`).jqxNumberInput({
					theme: theme, inputMode: 'simple',
					width: 140, height: false, min: 0, max: 999999999, decimalDigits: 0,
					spinButtons: true, spinButtonsWidth: 40,
					decimal: asInteger(e.fisNo || rec.fisno) || null
				});
				
				wndContent.find(`#yeniFisSeri`)
					.off('input keyup')
					.on('input keyup', evt => {
						const key = (evt.key || '').toLowerCase();
						if (key == 'enter' || key == 'linefeed') {
							if (btnTamam && btnTamam.length)
								btnTamam.click();
						}	
					});
				wndContent.find(`#yeniFisNo`)
					.off('input keyup')
					.on('input keyup', evt => {
						const key = (evt.key || '').toLowerCase();
						if (key == 'enter' || key == 'linefeed') {
							if (btnTamam && btnTamam.length)
								btnTamam.click();
						}	
					});
				
				wndContent.find(`#notlar`)
					.attr(`placeHolder`, `Belge Notları`)
					.val(rec.fisaciklama || rec.aciklama || '');
				
				wndContent.find(`#eskiFisSeri`)
					.val(rec.seri || '');
				wndContent.find(`#eskiFisNo`)
					.width(wndContent.find(`#yeniFisNo`).width() - wndContent.find(`#yeniFisNo`).jqxNumberInput('spinButtonsWidth') - 13)
					.val(asInteger(rec.fisNo || rec.fisno) || '');
			}
			
			wndContent.find(`input[type=text], input[type=textbox], input[type=textarea]`)
				.off('focus')
				.on('focus', evt =>
					evt.target.select());

			const timeouts = [200, 500];
			for (const timeout of timeouts) {
				setTimeout(() =>
					wndContent.find(`#yeniFisNo input`).focus(),
					timeout);
			}
		}

		belgeTransferIstendiDevam_ekranKapandi(e) {
			e = e || {};
			const {tabs, wndName, windows} = this;
			if (tabs && tabs.length) {
				tabs.jqxTabs('destroy');
				delete e.tabs;
			}
			const wnd = e.wnd || windows[wndName];
			if (wnd && wnd.length)
				wnd.jqxWindow('destroy');
			delete windows[wndName];
		}

		belgeTransferIstendiDevam_tamamIstendi(e) {
			const {tabs} = e;
			const tabIndex = e.tabIndex = tabs.val();
			const wndContent = e.wndContent = $(tabs.jqxTabs('getContentAt', tabIndex));
			switch (tabIndex) {
				case 0:					// No Transfer
					return this.belgeTransferIstendiDevam_tamamIstendi_belgeTransfer(e);
				case 1:					// Toplu No Transfer
					return this.belgeTransferIstendiDevam_tamamIstendi_topluFisNoTransfer(e);
			}
		}

		async belgeTransferIstendiDevam_tamamIstendi_belgeTransfer(e) {
			const {rec, wndContent, wnd} = e;
			if (asBool(rec.gonderildi) || asBool(rec.gonderildimi)) {
				displayMessage(`Merkeze gönderilmiş belgeler üzerinde değişiklik yapılamaz!`, `Belge Transfer`);
				return;
			}

			$.extend(e, {
				seri: wndContent.find(`#yeniFisSeri`).val() || '',
				fisNo: asInteger(wndContent.find(`#yeniFisNo`).val()) || 0,
				aciklama: wndContent.find(`#notlar`).val() || ''
			});

			const fisSinif = e.fisSinif = e.fisSinif || (e.fis ? e.fis.class : null) || CETFis.fisSinifFor({ rec: rec });
			if (!(fisSinif && fisSinif.seriNoDesteklermi)) {
				displayMessage(`Seçilen belge için No Transferi yapılamaz`, `Belge Transfer`);
				return;
			}

			sky.app.merkezeBilgiGonderTimer_start(e);
			const id = rec.rowid;
			try {
				await fisSinif.belgeGonderimKontrol($.extend({}, e, { fis: undefined, inst: e.fis || rec, id: id } ))
			}
			catch (ex) {
				if (ex.statusText)
					displayServerResponse(ex);
				else
					displayMessage(ex.errorText || (ex || '').toString(), `${ex.isError ? '@' : '!'} Belge Girişi ${ex.isError ? '@' : '!'}`);
				(savedProcs || window).hideProgress();
				hideProgress();
				this.tazele();
				throw ex
			}

			if (asBool(rec.gonderildi) || asBool(rec.gonderildimi)) {
				displayMessage(`Merkeze gönderilmiş belgeler üzerinde değişiklik yapılamaz!`, `Belge Transfer`);
				return
			}

			let degistimi = false;
			let upd = new MQIliskiliUpdate({
				from: fisSinif.table,
				where: { degerAta: rec.rowid, saha: `rowid` }
			});
			let value = e.seri;
			if (value)
				upd.set.degerAta(value, `seri`);
			value = e.fisNo;
			if (value)
				upd.set.degerAta(value, `fisno`);
			value = e.aciklama;
			(value)
				upd.set.degerAta(value, `fisaciklama`);
			
			if (!$.isEmptyObject(upd.set)) {
				degistimi = true;
				await fisSinif.dbMgr.executeSql({ tx: e.tx, query: upd });
			}
			
			if (wnd && wnd.length)
				wnd.jqxWindow('close');
			
			if (degistimi) {
				setTimeout(() => this.tazele(), 500);
				displayMessage(`Belge üzerinde istenilen değişiklik(ler) yapıldı`, `Belge Transfer`);
			}
			else {
				displayMessage(`Belge üzerinde <b>hiçbir değişiklik olmadı</b>`, `! Belge Transfer !`);
			}
		}

		belgeTransferIstendiDevam_tamamIstendi_topluFisNoTransfer(e) {
			const {wndContent, wnd} = e;
			/*$.extend(e, {
				seri: wndContent.find(`#yeniSeri`).val(),
				fisNo: asInteger(wndContent.find(`#yeniFisNo`).val())
			});*/

			displayMessage(`burada toplu fiş no transferi yapılacak`, `DEBUG`);
			debugger;

			if (wnd && wnd.length)
				wnd.jqxWindow('close');
		}

		async musteriDurumuIstendi(e) {
			let rec = this.selectedRec;
			/*if (!rec)
				return false;*/

			let mustKod = rec ? rec.mustKod || rec.mustkod || rec.must : this.mustKod;
			/*if (!mustKod)
				return false;*/
			
			let recCari = mustKod ? await MQCogul.getCariEkBilgi({ mustKod: mustKod }) : null;
			/*if (!recCari)
				return false;*/
			
			if (recCari && asBool(recCari.devreDisimi || recCari.rotaDevreDisimi)) {
				displayMessage(`Bu müşteri için işlem yapılamaz`, `@ UYARI @`);
				return false;
			}
			
			return await new CETMusteriDurumuPart({
				parentPart: this,
				mustKod: mustKod,
				geriCallback: _e =>
					this.tazele(e)
			}).run();
		}

		focusToDefault(e) {
			const {barkodluFisGirisYapilirmi} = this.app;
			const waitTimes = [300, 500, 1000, 1500];
			for (const i in waitTimes) {
				setTimeout(
					() => {
						const {txtBarkod, divListe} = this;
						if (barkodluFisGirisYapilirmi && txtBarkod && txtBarkod.length)
							txtBarkod.focus();
						else
							divListe.focus();
						
						//const {id} = document.activeElement || {};
						//displayMessage(`focus part is: [${id}]`);
					},
					waitTimes[i]);
			}
		}
	}
})()
