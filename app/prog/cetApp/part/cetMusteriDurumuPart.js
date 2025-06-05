(function() {
	window.CETMusteriDurumuPart = class extends window.CETListeOrtakPart {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				from: e.from,
				mustKod: e.mustKod,
				idSaha: '',				// coklu tablo verisi icin uid kendisi oluştursun liste
				expandedUids: {}
			});
			if (!(this.layout || this.template))
				this.template = this.app.templates.musteriDurumu;
		}

		static get partName() { return 'cetMusteriDurumu' }
		get adimText() { return 'Müşteri Durumu' }
		
		get fisGirisAdimindanmi() { return this.from == 'fisGiris' }


		async postInitLayout(e) {
			e = e || {};
			const layout = e.layout || this.layout;

			this.isReady = false;
			await super.postInitLayout(e);

			await this.liste_initEvents(e);
			await this.initHizliPart(e);
			await this.initIslemTuslari(e);
			// this.focusToDefault();
			this.isReady = true;
		}

		async activatePart(e) {
			e = e || {};
			const layout = e.layout || this.layout;

			this.isReady = false;
			
			setTimeout(() => {
				const {btnToggleFullScreen, chkOtoAktar, btnGonderimIsaretSifirla} = sky.app;
				if (btnToggleFullScreen && btnToggleFullScreen.length)
					btnToggleFullScreen.addClass('jqx-hidden');
				if (chkOtoAktar && chkOtoAktar.length)
					chkOtoAktar.addClass('jqx-hidden');
				if (btnGonderimIsaretSifirla && btnGonderimIsaretSifirla.length)
					btnGonderimIsaretSifirla.addClass('jqx-hidden');
			}, 150);
			
			this.initMustBilgi(e);
			
			await super.activatePart(e);
			this.isReady = true;

			this.cleanUpWidgets();
		}

		async initActivatePartOrtak(e) {
			await super.initActivatePartOrtak(e);

			/*setTimeout(async () => {
				await this.setUniqueTimeout({
					key: 'cariTooltip',
					delayMS: 2500,
					block: () => {
						const {comboBox} = this.hizliCariPart;
						if ($.isEmptyObject(this.listeRecs))
							comboBox.jqxTooltip('open');
					}
				});
				const {comboBox} = this.hizliCariPart;
				comboBox.find('input').on('focus, touchstart', evt =>
					comboBox.jqxTooltip('destroy'));
			}, 100);*/
		}

		async deactivePart(e) {
			e = e || {};
			this.isReady = false;

			const {btnToggleFullScreen, chkOtoAktar, btnGonderimIsaretSifirla} = sky.app;
			setTimeout(() => {
				if (btnToggleFullScreen && btnToggleFullScreen.length)
					btnToggleFullScreen.removeClass('jqx-hidden');
				if (chkOtoAktar && chkOtoAktar.length)
					chkOtoAktar.removeClass('jqx-hidden');
				if (btnGonderimIsaretSifirla && btnGonderimIsaretSifirla.length)
					btnGonderimIsaretSifirla.removeClass(`jqx-hidden`);
			}, 100);
			
			await super.deactivePart(e);
			
			this.isReady = true;
		}

		async initMustBilgi(e) {
			e = e || {};
			const {layout} = this;
			if (!(layout && layout.length))
				return;
			
			const {bakiyeRiskGosterilmezmi} = this.app;
			const divMustBilgi = this.divMustBilgi = layout.find(`#mustBilgi`);
			
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
							sahalar: ['unvan', 'adres', 'yore', 'ilAdi']
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
				
				const riskCariKod = await MQCogul.getRiskCariKod({ mustKod: mustKod });
				stm = new MQStm({
					sent: new MQSent({
						from: `mst_Cari`,
						where: [{ degerAta: riskCariKod, saha: 'kod' }],
						sahalar: [`bakiye`, `riskLimiti`, `riskli`, `takipBorcLimiti`, `takipBorc`]
					})
				});
				rec = await dbMgr.tekilExecuteSelect({ query: stm });
				
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
			}

			this.dipGosterimTazele(e);
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
					yildizlimi: result.sender.yildizlimi
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
				return;
			
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
								p.resolve(mustKod);
							}
						});
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
							throw ex;
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

				const mustRec = musteriKullanilirmi ? await fis.getCariEkBilgi({ mustKod: mustKod }) : null;
				let mevcutKonumBilgi = null;
				if (mustKod && islem != 'izle' && musteriKullanilirmi && app.konumTakibiYapilirmi) {
					const promise_konumBilgi = navigator.geolocation && navigator.geolocation.getCurrentPosition
							? new $.Deferred(p =>
								navigator.geolocation.getCurrentPosition(konumBilgi =>
									p.resolve($.extend({}, konumBilgi))))
							: null;
					try {
						if (promise_konumBilgi)
							mevcutKonumBilgi = await promise_konumBilgi;
					}
					catch (ex) {
						console.error(`Mevcut Konum bilgisi alınamadı`, ex)
					}

					mevcutKonumBilgi = e.mevcutKonumBilgi = (mevcutKonumBilgi || {}).coords;
					if (mevcutKonumBilgi)
						mevcutKonumBilgi = $.extend({}, mevcutKonumBilgi);
					
					if (!mevcutKonumBilgi && !konumsuzIslemYapilirmi) {
						const ex = {
							isError: true, rc: 'mevcutKonumBelirlenemedi',
							errorText: `<b>Mevcut Konum belirlenemediği</b> için işlem yapılamaz`
						};
						setTimeout(() => displayMessage(ex.errorText, `@ Fiş Girişi @`, 200));
						throw ex;
					}
					
					if (mevcutKonumBilgi) {
						const mustKod2Bilgi = param.mustKod2Bilgi = param.mustKod2Bilgi || {};
						let paramMustRec = mustKod2Bilgi[mustKod] = mustKod2Bilgi[mustKod] || {};
						let mustKonumBilgi = paramMustRec.konumBilgi;
						if (!mustKonumBilgi) {
							const {konumLatitude, konumLongitude, konumAccuracy} = mustRec;
							if (konumLatitude && konumLongitude)
								mustKonumBilgi = { latitude: konumLatitude, longitude: konumLongitude, accuracy: konumAccuracy };
						}
						if (!mustKonumBilgi) {
							mustKonumBilgi = paramMustRec.konumBilgi = mevcutKonumBilgi;
							param.kaydet();

							let upd = new MQIliskiliUpdate({
								from: 'mst_Cari',
								where: { degerAta: mustKod, saha: `kod` },
								set: [
									{ degerAta: mustKonumBilgi.longitude, saha: `konumLongitude` },
									{ degerAta: mustKonumBilgi.latitude, saha: `konumLatitude` },
									{ degerAta: mustKonumBilgi.accuracy, saha: `konumAccuracy` }
								]
							});
							await dbMgr.executeSql({ query: upd });
						}

						/*if (
							(Math.abs(mevcutKonumBilgi.latitude - mustKonumBilgi.latitude) > (konumLatitudeTolerans || 0)) ||
							(Math.abs(mevcutKonumBilgi.longitude - mustKonumBilgi.longitude) > (konumLongitudeTolerans || 0))
						) {*/
						if (app.konumFarki({ konum1: mevcutKonumBilgi, konum2: mustKonumBilgi }) > (app.konumToleransMetre || 0)) {
							const ex = {
								isError: true, rc: 'mustKonumGecersiz',
								errorText: `<b>(${mustKod}) ${mustRec.unvan}</b> Müşterisine ait <u>Konum civarında olmadığınız</u> için işlem yapılamaz`
							};
							setTimeout(() => displayMessage(ex.errorText, `@ Fiş Girişi @`, 200));
							throw ex;
						}
					}

					// mustKonumBilgi;
					// mevcutKonumBilgi;
				}

				let promise_numaratorOlustur = fis.numaratorOlustur();
				let fisGirisIslemiBittimi = false;
				let hizliGirisPartPromise = { isCancelled: false };
				if (islem == 'yeni' && fis.class.sonStoktanSecimYapilirmi && app.sonStoktanSecimYapilirmi) {
					(savedProcs || window).showProgress(null, null, 1, true);
					hizliGirisPartPromise = new $.Deferred(p => {
						setTimeout(async () => {
							let promise = CETFisGirisSonStoktanSecimPart.run({
								parentPart: this, islem: islem,
								eskiFis: eskiFis, fis: fis,
								secince: async e => {
									const result = { sender: e.sender, isCancelled: false, recs: part.altListePart.listeWidget.getRows() };
									const {recs} = result;
									const {satisKosulYapilari, promosyonYapilari} = part;
									if (!$.isEmptyObject(recs)) {
										const detaySinif = fis.class.detaySinif;
										for (const i in recs) {
											const rec = recs[i];
											const _detaySinif = fis.class.uygunDetaySinif({ rec: rec }) || detaySinif;
											const det = new _detaySinif(rec);
											await det.detayEkIslemler_ekle({ fis: fis, satisKosulYapilari: satisKosulYapilari, promosyonYapilari: promosyonYapilari });
											fis.detaylar.push(det)
										}
									}
									p.resolve(result);
								},
								geriCallback: async e => {
									// this.islemTuslariVarsaGoster();
									fisGirisIslemiBittimi = true;
									if (fis) {
										if (fis.geciciFis_destroyTimer)
											fis.geciciFis_destroyTimer();
										await fis.geciciFisleriTemizle({ tx: e.tx });
									}
									p.resolve({ isCancelled: true });
								}
							});
							setTimeout(() =>
								(savedProcs || window).hideProgress(), 500);
							
							let part = (await promise).part;
							// await part.run();
						}, 10);
					});
				}

				(savedProcs || window).showProgress(null, null, 1, true);
				const basTS = now();
				let result = await hizliGirisPartPromise;
				if (!result || result.isCancelled) {
					await fis.geciciFisleriTemizle({ tx: e.tx });
					p.resolve(result);
					return
				}
				
				const hizliGirisPart = result.sender;
				const fisGirisPartPromise = new $.Deferred(async p => {
					if (promise_numaratorOlustur)
						await promise_numaratorOlustur;
					if (hizliGirisPart)
						await hizliGirisPart.promise_ilkIslemler;
					
					let fisGirisPart = new uiSinif({
						parentPart: this, islem: islem,
						eskiFis: eskiFis, fis: fis,
						satisKosulYapilari: (hizliGirisPart || {}).satisKosulYapilari,
						promosyonYapilari: (hizliGirisPart || {}).promosyonYapilari,
						kaydedince: async e => {
							fisGirisIslemiBittimi = true;
							const sender = e.sender || {};
							const _e = $.extend({}, e, {
								isCancelled: false, islem: islem,
								eskiFis: eskiFis, fis: sender.fis || fis,
								kaydederkenYazdirFlag: sender.kaydederkenYazdirFlag,
								kaydederkenAktarFlag: sender.kaydederkenAktarFlag
							});
							await fis.geciciFisleriTemizle({ tx: e.tx });
							// this.islemTuslariVarsaGoster();
							p.resolve(_e);

							setTimeout(_e =>
								this.kaydetSonrasi($.extend({}, e, {
									result: _e, basTS: basTS,
									mevcutKonumBilgi: mevcutKonumBilgi
								})),
								10, _e);
						},
						geriCallback: async e => {
							fisGirisIslemiBittimi = true;

							// this.islemTuslariVarsaGoster();
							if (fis) {
								if (fis.geciciFis_destroyTimer)
									fis.geciciFis_destroyTimer();
								await fis.geciciFisleriTemizle({ tx: e.tx });
							}
							p.resolve({ isCancelled: true });
						}
					});
					(savedProcs || window).showProgress(null, null, 1, true);
					setTimeout(() => (savedProcs || window).hideProgress(null, null, 1, true), 700);
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
							fis.geciciFis_initTimer();
						}
					}, 500);
					try {
						await _promise;
					}
					catch (ex) {
						if (ex && ex.rc && ex.rc == 'runtimeInterrupt')
							return;
						displayServerResponse(ex);
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
				p.resolve(result);
			});
			
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
			
			setTimeout(() => this.tazele(), yazdirildimi ? 1500 : 10);
			return true;
		}

		fisIslemTipiSec() {
			return new $.Deferred(p => {
				new CETFisGirisIslemSecimPart({
					parentPart: this,
					secince: e =>
						p.resolve(e)
				}).run();
			});
		}

		fisSablonTipiSec() {
			// this.islemTuslariVarsaGizle();
			return new $.Deferred(async p => {
				await new CETKAListePart({
					parentPart: this, /* template: this.app.templates.cetListeOrtak, */
					table: `mst_SablonFisTipi`, idSaha: `kod`, adiSaha: `aciklama`,
					kodsuzmu: true,
					secince: e =>
						p.resolve(e)
				}).run()
			});
		}

		async getFis(e) {
			const mustRec = this.mustRec;
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

			const {userSettings_liste} = this;
			$.extend(e.listeArgs, {
				height: $(window).height() - ($(window).height() < 700 ? 450 : 230),
				pageable: true, showToolbar: false, serverProcessing: true,
				columnsHeight: 25, pagerHeight: 33, filterMode: 'default',
				pageSize: userSettings_liste.pageSize || 5,
				rowDetails: true,
                initRowDetails: (uid, rec, parent, rowInfo) =>
					this.initRowDetails({ uid: uid, rec: rec, parent: parent, rowInfo: rowInfo })
			});
		}

		liste_initEvents(e) {
			const {divListe} = this;
			divListe.on('rowExpand', evt => {
				const uid = evt.args.rowKey;
				const {listeWidget, expandedUids} = this;
				if (uid != null) {
					if (!$.isEmptyObject(expandedUids)) {
						listeWidget.beginUpdate();
						for (const uid in expandedUids)
							listeWidget.hidedetailsbykey(uid);
						listeWidget.endUpdate();
					}
					expandedUids[uid] = true;
				}
			});
			divListe.on('rowCollapse', evt => {
				const uid = evt.args.rowKey;
				if (uid != null)
					delete this.expandedUids[uid];
			});
		}

		async liste_columnsDuzenle(e) {
			await super.liste_columnsDuzenle(e);
			
			$.merge(e.listeColumns, [
				{ text: 'Grup', dataField: 'grupText', hidden: true, filterable: false },
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
						$.each(rec, (key, value) => {
							const item = divSatir.find(`.${key}`);
							if (item.length)
								item.html(value);
						});
						
						if (rec.yore)
							divSatir.find(`.yore`).removeClass(`jqx-hidden`);
						if (rec.ilAdi)
							divSatir.find(`.ilAdiParent`).removeClass(`jqx-hidden`);
						
						if (asBool(rec.devreDisimi || rec.silindi))
							divSatir.addClass('devreDisi');
						if (!rapormu && asBool(rec.gonderildimi || rec.gonderildi))
							divSatir.addClass('gonderildi');
						if (asBool(rec.yazdirildimi || rec.yazdirildi))
							divSatir.addClass('yazdirildi');
						
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
						if (rapormu) {
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

						if (rec.vade && rec.vade != rec.tarih)
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

						const dipIskBilgiParent = divSatir.find('.dipIskBilgiParent');
						const dipIskBilgi = dipIskBilgiParent.find('.dipIskBilgi');
						const dipIskOran = rec.dipiskoran;
						const dipIskBedel = rec.dipiskbedel;
						if (dipIskOran || dipIskBedel) {
							const bilgiler = [];
							if (dipIskOran)
								bilgiler.push(`%${dipIskOran.toLocaleString()}`);
							if (dipIskBedel)
								bilgiler.push(`${bedelStr(dipIskOran)}`);
							if (bilgiler.length) {
								dipIskBilgi.html(bilgiler.join(' + '));
								dipIskBilgiParent.removeClass('jqx-hidden basic-hidden')
							}
						}

						return divSatir[0].outerHTML.trim()
					}
				},
				{
					text: 'B/A', align: 'center', dataField: 'bedel', width: 140,
					cellsRenderer: (rowIndex, columnIndex, value, rec) => {
						const {app} = this;
						rec = rec.originalRecord || rec;

						let cssSubClass = 'total';
						const divSatir = this.newListeSatirDiv({ cssSubClass: 'total' });
						divSatir.attr('data-index', rowIndex);

						const rapormu = asBool(rec.rapormu || rec.rapor);
						const gosterSahalar = [e.attr];
						for (const i in gosterSahalar) {
							const key = gosterSahalar[i];
							let item = divSatir.find(`.${key}`);
							if (item.length)
								item.html(value);
						}
						if (asBool(rec.devreDisimi || rec.silindi))
							divSatir.addClass('devreDisi');
						if (!rapormu && asBool(rec.gonderildimi || rec.gonderildi))
							divSatir.addClass('gonderildi');
						if (asBool(rec.yazdirildimi || rec.yazdirildi))
							divSatir.addClass('yazdirildi');
						if (rec.ozelIsaret)
							divSatir.addClass(`ozelIsaret-${rec.ozelIsaret == '*' ? 'yildiz' : rec.ozelIsaret} ozelIsaretli`);
						
						const ekleyici = e => {
							if (!e.value)
								return null;

							e.rec = rec;
							let elm = e.divCell = divSatir.find(e.selector);
							if (elm.length) {
								let value = $.isFunction(e.valueGetter)
													? e.valueGetter.call(this, e)
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
							selector: `.bedelText`, value: rec,
							valueGetter: e => {
								const {divCell, rec} = e;
								let value = rec.fisSonuc;
								let ba = rec.ba || rec.almsat;
								if (!ba) {
									const fisSinif = CETFis.fisSinifFor({ rec: rec });
									ba = fisSinif ? (fisSinif.fiiliCikismi ? 'B' : 'A') : null;
								}
								if (!ba)
									return '';
								switch (ba) {
									case 'B':
										divCell.addClass(`borc`);
										break;
									case 'A':
										divCell.addClass(`alacak`);
										break;
								}
								return value ? `<br/><span class="veri">${bedelStr(value)} <u class="orangered">${rec.dvkod || 'TL'}</u></span>` : ``
							}
						});

						return divSatir[0].outerHTML.trim();
					}
				}
			]);
		}

		initRowDetails(e) {
			const {rec} = e;
			const fisSinif = rec ? CETFis.fisSinifFor({ rec: rec }) : null;
			if (!fisSinif)
				return false;

			const {parent} = e;
			if (!fisSinif.musteriDurumu_initRowDetails)
				return false;
			
			const grid = e.grid = $(`<div style="margin: 3px 3px 3px 15px;"></div>`);
			grid.appendTo(parent);

			const getDataAdapter = _e => {
				const da = _e.dataAdapter = new $.jqx.dataAdapter(
					{
						id: 'seq', datatype: defaultOutput,
						url: 'empty.json', datafields: []
					},
					{
						loadServerData: async (wsArgs, source, callback) => {
							try {
								let result;
								if (_e.loadServerData)
									result = await _e.loadServerData($.extend({}, e, { wsArgs: wsArgs, source: source, callback: callback }));

								if ($.isArray(result))
									result = { totalrecords: result.length, records: result };
								if (typeof result == 'object')
									callback(result);
								
								setTimeout(() => {
									try { this.divListe.find(`span:contains("www.jqwidgets.com")`).hide() }
									catch (ex) { }
								}, 10);
								// this.divListe.jqxDataTable('selectRow', 0);
							}
							catch (ex) {
								defFailBlock(ex);
								callback({ totalrecords: 0, records: [] });
								throw ex;
							}
						}
					}
				);
				return da;
			};
			$.extend(e, {
				sender: this,
				layout: this.layout,
				parent: parent,
				grid: grid,
				parentGrid: this.divListe,
				parentGridWidget: this.listeWidget,
				getDataAdapter: getDataAdapter,
				buildGrid: _e => {
					const {grid, columns, listeArgsDuzenle} = _e;
					let {dataAdapter} = _e;
					if (!dataAdapter)
						dataAdapter = _e.dataAdapter = getDataAdapter(_e);
					
					const isMiniDevice = $(window).width() < 350;
					const listeArgs = {
						theme: theme, localization: localizationObj,
						width: false, height: roundToFra(parent.parents('td').height(), 2),
						altRows: true, autoRowHeight: true,
						filterMode: 'simple', selectionMode: 'singlerow',
						filterHeight: isMiniDevice ? 28 : 32,
						pagerHeight: isMiniDevice ? 30 : 40,
						toolbarHeight: isMiniDevice ? 30 : 34,
						columnsHeight: isMiniDevice ? 25 : 32,
						sortable: true, filterable: false, pageable: false, columnsResize: true, showToolbar: false,
						pagerMode: 'advanced', pageSizeOptions: [3, 5, 7, 8, 9, 10, 12, 13, 15, 20],
						pagerButtonsCount: 5, pagerPosition: 'top', pageSize: 5,
						columns: columns, source: dataAdapter
					};
					if (listeArgsDuzenle) { listeArgsDuzenle.call(this, _e) }
					grid.jqxDataTable(listeArgs);
				}
			});
			fisSinif.musteriDurumu_initRowDetails(e)
		}
		loadServerData_buildQuery(e) {
			let {app, mustKod} = this, {rowCountOnly} = e;
			let wsArgs = { ...e.wsArgs, rowCountOnly: rowCountOnly };
			wsArgs.filters = this.getFiltersFromListeWSArgs(wsArgs);
			switch (parseInt(wsArgs.sortdatafield)) {
				case 7: wsArgs.sortdatafield = ['tarih', 'seri', 'fisno']; break;
				case 8: case 9: wsArgs.sortdatafield = ['fisSonuc']; break;
			}
			if (!rowCountOnly) {
				if ($.isEmptyObject(wsArgs.sortdatafield)) { wsArgs.sortdatafield = ['tarih DESC', 'kayitzamani DESC'] }
				if (typeof wsArgs.sortdatafield != 'object') { wsArgs.sortdatafield = [wsArgs.sortdatafield] }
				wsArgs.sortdatafield.unshift('rapor');
			}
			let uni = new MQUnionAll(), stm = new MQStm({ sent: uni });
			app.fisListe_stmSentDuzenle({ stm, uni, musteriDurumu: true, ...wsArgs });
			if (mustKod) {
				uni.sentDo(sent =>
					sent.where.degerAta(mustKod, 'fis.mustkod'));
			}
			stm.fromGridWSArgs(wsArgs);
			return stm
		}
		async loadServerData_ekIslemler(e) {
			let result = await super.loadServerData_ekIslemler(e); if (result) { return result }
			let topKDV = 0, topSatisBedel = 0, topIadeBedel = 0, topTahsilatBedel = 0;
			let {recs} = e; for (const rec of recs) {
				let fisSinif = CETFis.fisSinifFor({ rec }), fisTipText = (rec.fisTipText || '').trim();
				if (!fisTipText) { fisTipText = (fisSinif ? fisSinif.aciklama : null) || '' }
				$.extend(rec, {
					grupText: rec.rapormu || rec.rapor ? '2- Merkezdeki Hareketler' : '1- Tabletteki Belgeler',
					tarih: dateKisaString(new Date(rec.tarih) || ''),
					vade: rec.vade ? dateKisaString(new Date(rec.vade) || '') : null,
					mustText: rec.mustkod ? `(<span class="mustKod">${rec.mustkod}</span>) <span class="mustUnvan">${rec.mustunvan}</span>` : '',
					fisTipText
				});
				if (fisSinif) {
					let _bedel = bedel(rec.fisSonuc || rec.fissonuc || rec.net || rec.toplambedel || 0);
					if (_bedel) {
						let {fiiliCikismi} = fisSinif;
						if (fisSinif.stokmu || fisSinif.ticarimi) {
							if (fiiliCikismi) { topSatisBedel += _bedel } else { topIadeBedel += _bedel }
							if (fisSinif.ticarimi && !(rec.ozelisaret || rec.ozelIsaret)) {
								let kdv = bedel(rec.topkdv || rec.topKDV || 0);
								if (fiiliCikismi) { topKDV += kdv } else { topKDV -= kdv }
							}
						}
						else if (fisSinif.tahsilatmi) { topTahsilatBedel += _bedel }
					}
				}
			}
			$.extend(this, { topKDV, topSatisBedel, topIadeBedel, topTahsilatBedel });
			this.dipGosterimTazele(e)
		}
		async liste_veriYuklendi(e) {
			if (this.isListeVeriYuklendiEventTriggered) { return super.liste_veriYuklendi(e) }
			this.isListeVeriYuklendiEventTriggered = true;
			if (!$.isEmptyObject(this.listeRecs)) { this.clearUniqueTimeout({ key: 'cariTooltip' }) }
			this.focusToDefault(); this.initMustBilgi(e);
			this.divListe.jqxDataTable('groups', ['grupText'])
		}
		liste_satirTiklandi(e) {
			// this.focusToDefault();
		}

		liste_satirCiftTiklandi(e) {
			const {selectedRec, listeWidget} = this;
			const uid = (selectedRec || {}).uid;
			if (uid != null) {
				if (this.expandedUids[uid])
					listeWidget.hidedetailsbykey(uid);
				else
					listeWidget.showdetailsbykey(uid);
			}
			/*if (this.selectedRec)
				this.ozelIslemTuslariPart.itemClicked(`degistir`);*/
		}

		liste_satirSecimDegisti(e) {
			super.liste_satirSecimDegisti(e);

			/*const layout = e.layout || this.layout;
			const {islemTuslariPart} = this;
			const rec = this.selectedRec;
			setButonEnabled(islemTuslariPart.parentMenu.find(`*:not(yeni)`), !!rec);*/
		}

		async initHizliPart(e) {
			e = e || {};
			const layout = e.layout || this.layout;
			const hizliCariPart = this.hizliCariPart = new CETMstComboBoxPart({
				parentPart: this,
				content: layout.find('.hizliCari'),
				// layout: layout.find('.hizliStok'),
				placeHolder: 'Müşteri Ünvan veya Kodu',
				listeSinif: CETCariListePart, table: 'mst_Cari',
				idSaha: 'kod', adiSaha: 'unvan',
				selectedId: this.mustKod,
				// text: this.mustKod,
				events: {
					comboBox_itemSelected: e =>
						this.hizliCari_itemSelected(e)
				}
			});
			await hizliCariPart.run();

			/*const {app} = this;
			if (app.musteriRotaZorunlumu)
				hizliCariPart.comboBox.jqxComboBox('disabled', true);*/
		}

		initIslemTuslari(e) {
			e = e || {};
			const layout = e.layout || this.layout;
			if (this.fisGirisAdimindanmi)
				return;
			
			let {islemTuslariPart} = this;
			if (!islemTuslariPart) {
				islemTuslariPart = this.islemTuslariPart = new CETExpandableIslemTuslariPart({
					/* position: ``, */
					templateItems: layout.find(`.toolbar-external.islemTuslari`),
					onItemClicked: async e => await this.liste_islemTusuTiklandi(e)
				});
				islemTuslariPart.basicRun();
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
			}
			
			/*const {param} = this.app;
			const serbestModmu = this.app.serbestModmu;
			const itemSil = islemTuslariPart.parentMenu.find(`#sil`);
			if (itemSil.length)
				itemSil.find(`.item`).html(serbestModmu ? 'SİL' : 'İPTAL');*/
		}

		async hizliCari_itemSelected(e) {
			if (!this.isReady)
				return false;

			let mustKod = e.id;
			if (!mustKod) {
				const {rec} = e;
				if (rec)
					mustKod = rec.id || rec.kod;
			}
			if (mustKod)
				this.mustKod = mustKod;
			
			this.initMustBilgi();
			await this.tazele({ noFocus: e.noFocus });

			return true;
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
				case 'tazele':
					await this.tazele(e);
					break;
			}
			if (islem == 'yeni' || islem == 'kopya')
				this.selectLastRec();
			
			this.focusToDefault();
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
					displayMessage(`<b>Kapanış yapıldığı için</b> <b><u>Belge SİLME</u></b> yapılamaz`, `@ ${app.appText} @`);
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
					let del = new MQIliskiliDelete({
						from: CETStokTicariFis.table,
						where: { degerAta: rec.rowid, saha: `rowid` }
					});
					let result = await CETStokTicariFis.dbMgr.executeSql({ tx: e.tx, query: del });
					if (result)
						await this.tazele(e)

					return result;
					// return null;
				}

				const {dbMgr} = fis;
				// let tx = await dbMgr.transaction();
				// let result = await fis.sil($.extend({ tx: tx }, e));
				let result = await fis.sil(e);
				if (!result)
					return result;
				if (result.isError)
					throw result;
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

			return result;
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

		async tazele(e) {
			this.topKDV = this.topSatisBedel = this.topIadeBedel = this.topTahsilatBedel = 0;
			const {mustKod} = this;
			if (this.mustKod)
				await super.tazele(e);
			this.initMustBilgi();
			// this.focusToDefault();
		}

		dipGosterimTazele(e) {
			const {divMustBilgi, topKDV, topSatisBedel, topIadeBedel, topTahsilatBedel} = this;
			const dipGoster = e => {
				const {key, value} = e;
				const reverseFlag = asBool(e.reverse || e.reverseFlag);
				let selector = e.selector || `.dipDiger .${key}.veri`;
				let elm = divMustBilgi.find(selector);
				if (elm.length) {
					elm.html(`${bedelStr(value || 0)}`);
					const negatifmi = value && value < 0;
					let kosul = negatifmi;
					if (reverseFlag)
						kosul = !kosul;
					if (kosul)
						elm.addClass('red');
				}
			}
			dipGoster({ selector: `.kdvText`, value: topKDV });
			dipGoster({ selector: `.toplamSatisBedelText`, value: topSatisBedel });
			dipGoster({ selector: `.toplamIadeBedelText`, value: topIadeBedel, reverse: true });
			dipGoster({ selector: `.toplamTahsilatBedelText`, value: topTahsilatBedel });
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
					if (fisTable && fisTable == fisSinif.table)
						bilgiGonderTableYapilari.push($.extend({ fisIDListe: [fisID] }, tableYapi));
				});
	
				try { return await app.merkezeBilgiGonder({ bilgiGonderTableYapilari: bilgiGonderTableYapilari }) }
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

		focusToDefault(e) {
			if (this.mustKod) {
				const waitTimes = [300, 500];
				for (const i in waitTimes) {
					setTimeout(
						() => {
							const {divListe} = this;
							divListe.focus();
							//const {id} = document.activeElement || {};
							//displayMessage(`focus part is: [${id}]`);
						},
						waitTimes[i]);
				}
			}
		}
	}
})()
