(function() {
	window.SkyCafeSatisEkraniPart = class extends window.SkyCafePartBase {
		constructor(e) {
			e = e || {};
			super(e);
		}

		static get noResizeEventOnInputs() { return false }
		static get partName() { return 'satisEkrani' }

		async getAdimText() {
			const {app} = this;
			const {pratikSatismi} = app.class;
			const {aktifMasaID} = app;
			const aciklamaVeBilgi = await app.getMasaAciklamaVeBilgi({ masaID: aktifMasaID, fisID: (app.aktifFis || {}).id });
			const ka = new CKodVeAdi({ kod: aktifMasaID, aciklama: (aciklamaVeBilgi || {}).aciklama });
			if (aciklamaVeBilgi && aciklamaVeBilgi.ozelAciklamami)
				ka.aciklama = `<span class="ozelAciklama"><u style="font-weight: normal;">${aciklamaVeBilgi.rezerveAciklamami ? 'Rezerve' : 'Açıklama'}</u>: ${ka.aciklama}</span>`;
			// const masa = app.id2Masa[id];
			return `[${pratikSatismi ? 'PR' : 'RS'}] Satış Ekranı`+ (ka ? `<div class="title-ekBilgi">${ka.parantezliOzet({ styled: true })}</div>` : '')
		}

		async preInitLayout(e) {
			e = e || {};
			const layout = e.layout || this.layout;
			$.extend(this, {
				templates: layout.find(`#templates`),
				toolbar: layout.find(`#toolbar`),
				innerContent: layout.find(`#innerContent`),
				solForm: layout.find(`#innerContent #solForm`),
				sagForm: layout.find(`#innerContent #sagForm`),
				barkodForm: layout.find(`#barkodForm`),
				barkodUI: layout.find(`#barkodForm #barkodUI`),
				kategoriForm_ust: layout.find(`#kategoriForm-ust`),
				kategoriForm_alt: layout.find(`#kategoriForm-alt`),
				kategoriFormOrtak_header: layout.find(`#kategoriFormOrtak-header`),
				kategoriFormOrtak_content: layout.find(`#kategoriFormOrtak-content`),
				divAktifUstKategoriText: layout.find(`#kategoriFormOrtak-header #aktifUstKategoriText`),
				divAktifKategoriText: layout.find(`#kategoriFormOrtak-header #aktifKategoriText`),
				ustKategoriForm: layout.find(`#ustKategoriForm`),
				ustKategoriFormHeader: layout.find(`#ustKategoriForm .subHeader`),
				ustKategoriParent: layout.find(`#ustKategoriForm #ustKategoriler`),
				kategoriForm: layout.find(`#kategoriForm`),
				kategoriFormHeader: layout.find(`#kategoriForm .subHeader`),
				kategoriParent: layout.find(`#kategoriForm #kategoriler`),
				kategoriDetayForm: layout.find(`#kategoriDetayForm`),
				kategoriDetayParent: layout.find(`#kategoriDetayForm #kategoriDetaylar`),
				btnToggleResponsivePanel_kategoriOrtak: layout.find(`#btnToggleResponsivePanel_kategoriOrtak`),
				toplamParent: layout.find(`#toplamParent`),
				divToplam: layout.find(`#toplamParent #toplam`),
				listeParent: layout.find(`#listeParent`),
				divListe: layout.find(`#listeParent #liste`),
				btnCikarParent: layout.find(`#cikarParent`),
				btnCikar: layout.find(`#cikarParent #cikar`)
			});

			Utils.makeScrollable(this.ustKategoriParent);
			Utils.makeScrollable(this.kategoriParent);
			Utils.makeScrollable(this.kategoriDetayParent);
			// Utils.makeScrollable(this.listeParent);

			this.initBarkodUI(e);
			
			const listePart = this.listePart = new SkyCafeSatisGridPart({ layout: this.sagForm });
			listePart.basicRun(e);
			const {itemListPart} = listePart;
			itemListPart.eventRightClickSelector = e =>
				this.listeItem_sagTiklandi(e);
			//divListe.on('contextmenu', evt =>
			//	this.listeItem_sagTiklandi($.extend({}, e, { event: evt })));

			this.btnCikar
				.jqxButton({ theme: theme })
				.on('click', evt => this.cikarIstendi($.extend({}, e, { event: evt })));
			this.btnCikarParent.detach()
				.prependTo(this.listeParent);
			
			const kategoriResponsiveForm = this.kategoriResponsiveForm = this.kategoriFormOrtak_header;
			const {btnToggleResponsivePanel_kategoriOrtak, ustKategoriFormHeader, kategoriFormHeader} = this;
			kategoriResponsiveForm.jqxResponsivePanel({
				theme: theme, animationType: animationType,
				collapseBreakpoint: 10000, toggleButton: btnToggleResponsivePanel_kategoriOrtak,
                autoClose: false, animationShowDelay: 'slow', animationHideDelay: 'slow'
			});
			const kategoriResponsiveWidget = this.kategoriResponsiveWidget
				= kategoriResponsiveForm.jqxResponsivePanel('getInstance');
			kategoriResponsiveForm.on('open', evt => this.kategoriResponsiveForm_opened($.extend({}, e, { event: evt, open: true })));
			kategoriResponsiveForm.on('close', evt => this.kategoriResponsiveForm_closed($.extend({}, e, { event: evt, open: false })));
			kategoriResponsiveForm.on('click', evt => this.kategoriFormOrtak_headerClicked($.extend({}, e, { event: evt })));
			// ustKategoriFormHeader.on('click', evt => this.kategoriFormOrtak_headerClicked($.extend({}, e, { event: evt })));
			// kategoriFormHeader.on('click', evt => this.kategoriFormOrtak_headerClicked($.extend({}, e, { event: evt })));
			
			kategoriResponsiveWidget.close();

			await super.preInitLayout(e);
		}

		async postInitLayout(e) {
			e = e || {};
			const {layout} = this;

			// const layout = e.layout || this.layout;
			// await this.activatePartDevam(e);
			// this.tazele(e);

			await super.postInitLayout(e);

			setTimeout(() => {
				const detayDuzenlePart = this.detayDuzenlePart = new SkyCafeDetayDuzenlePart();
				// detayDuzenlePart.open(e);
				this.initMiktarKlavyePart(e);

				this.timersDisabledFlag = false;
			}, 300);
		}

		async destroyPart(e) {
			// this.timersDisabledFlag = true;
			
			const {listePart, detayDuzenlePart} = this;
			if (listePart)
				listePart.destroyPart();
			delete this.listePart;

			if (detayDuzenlePart)
				detayDuzenlePart.close(e);
			delete this.detayDuzenlePart;

			return await super.destroyPart(e);
		}

		async activatePart(e) {
			e = e || {};
			const {layout, detayDuzenlePart} = this;
			layout.css(`opacity`, .02);

			await super.activatePart(e);
			this.timersDisabledFlag = false;

			const {app} = this;
			let aktifBilgileriYukle_promise = new $.Deferred(async p => {
				try {
					const _e = { noSyncControl: true };
					await app.wsAktifBilgileriYukle(_e);
					p.resolve(await app.wsAktifBilgilerYuklendi(_e));
				}
				catch (ex) {
					console.error(ex);
					p.reject(ex);
				}
			});

			this.setUniqueTimeout({
				key: 'aktifBilgileriYukle_promise_reject',
				delayMS: 1000,
				block: () => {
					if (aktifBilgileriYukle_promise)
						aktifBilgileriYukle_promise.reject();
					aktifBilgileriYukle_promise = null;
				}
			})

			try { await aktifBilgileriYukle_promise }
			catch (ex) { }

			// await this.initBarkodUI();
			await this.masaFisIlkIslemler(e);
			layout.css(`opacity`, .04);
			await this.activatePartDevam(e);

			//if (detayDuzenlePart)
			//	detayDuzenlePart.open(e);
		}

		async activatePartDevam(e) {
			e = e || {};
			const {app, layout, btnToggleResponsivePanel_kategoriOrtak} = this;
			const {zAcikmi} = app;
			const {aktifMasaID} = app;
			
			const aciklamaVeBilgi = await app.getMasaAciklamaVeBilgi({ masaID: aktifMasaID, fisID: (app.aktifFis || {}).id });
			const ka = new CKodVeAdi({ kod: aktifMasaID, aciklama: (aciklamaVeBilgi || {}).aciklama });
			if (aciklamaVeBilgi && aciklamaVeBilgi.ozelAciklamami)
				ka.aciklama = `<span class="ozelAciklama"><u style="font-weight: normal;">${aciklamaVeBilgi.rezerveAciklamami ? 'Rezerve' : 'Açıklama'}</u>: ${ka.aciklama}</span>`;
			layout.find(`#masaBilgiForm #masaText`).html(ka.parantezliOzet({ styled: true }));
			this.appTitleText = await this.getAdimText();

			if (this.lastState_zAcikmi != zAcikmi) {
				setTimeout(() => {
					this.listeParent[this.app.zAcikmi ? 'removeClass' : 'addClass'](`zKapali`);
					
					const elmList = [this.btnCikar, this.solForm];
					for (const i in elmList) {
						const elm = elmList[i];
						elm[zAcikmi ? 'removeClass' : 'addClass'](`jqx-hidden`);
					}
				}, 100);
				this.lastState_zAcikmi = zAcikmi;
			}
			
			if ($.isEmptyObject(app.id2UstKategori))
				btnToggleResponsivePanel_kategoriOrtak.removeClass(`ustKategoriVar`);
			else
				btnToggleResponsivePanel_kategoriOrtak.addClass(`ustKategoriVar`);
			
			this.aktifMiktarReset();
			
			setTimeout(() => {
				const {barkodUI} = this;
				barkodUI.jqxComboBox('input').val('');
				barkodUI.jqxComboBox('close');
			}, 150);

			if (this.aktifUstKategoriID == null)
				delete this.aktifKategoriID;
			
			// app.navPart.tazele();
			// setTimeout(() => this.setFocusToDefault(e), 10);
			this.tazele($.extend({}, e, { ilkmi: true }));

			/*if (app.programcimi) {
				setTimeout(() => {
					new SkyCafeTextInputPart().open({
						baslikText: `textInput part test window`,
						tamamIslemi: e => {
							const {sender, value} = e;
							console.info(e);
							if (!value) {
								displayMessage(`@ boş değer @`);
								return false
							}
							displayMessage(`<p>değer girildi: <b>${value}</b></p><p>partName: <b>${sender.partName}</b></p>`);
						}
					});
				},500);
			}*/

			if (this.miktarKlavyePart)
				this.initMiktarKlavyePart(e);
		}

		async deactivatePart(e) {
			e = e || {};
			// this.timersDisabledFlag = true;

			const {app, detayDuzenlePart, miktarKlavyePart} = this;
			if (detayDuzenlePart)
				detayDuzenlePart.close(e);
			if (miktarKlavyePart)
				miktarKlavyePart.close(e);
			
			await app.closeNumKlavyePart();
			await app.closeKlavyePart();

			this.setUniqueTimeout({
				key: 'aktifBilgileriYukle',
				delayMS: 50,
				args: e,
				block: async e => {
					let {waitPromise} = this;
					if (waitPromise) {
						try { await waitPromise }
						catch (ex) { /*return false*/ }
					}

					waitPromise = app.waitPromise;
					if (waitPromise) {
						try { await waitPromise }
						catch (ex) { /*return false*/ }
					}

					let {promise_getParams} = app;
					if (promise_getParams) {
						try { await promise_getParams }
						catch (ex) { /*return false*/ }
					}
					let {promise_tanimlariYukle} = app;
					if (promise_tanimlariYukle) {
						try { await promise_aktifBilgileriYukle }
						catch (ex) { /*return false*/ }
					}
					let {promise_aktifBilgileriYukle} = app;
					if (promise_aktifBilgileriYukle && !app.syncServerPort) {
						// abortLastOperation();
						// promise_aktifBilgileriYukle.reject();
						// console.debug(`promise_aktifBilgileriYukle reject`, promise_aktifBilgileriYukle);
						try { await promise_aktifBilgileriYukle }
						catch (ex) { /*return false*/ }
					}

					/*const _e = {};
					try {
						await app.wsAktifBilgileriYukle(_e);
						app.wsAktifBilgilerYuklendi(_e);
					}
					catch (ex) { }*/
				}
			});

			await super.deactivatePart(e);
		}

		async run(e) {
			await super.run(e);
		}

		setUpTimers(e) {
			super.setUpTimers(e);

			const {app, timers} = this;
			const {pratikSatismi} = app.class;
			const {programcimi} = app;
			/*if (!pratikSatismi && !(app.timerYokmu || app.otoKayitTimerYokmu)) {
				timers.otoKayit = {
					delay: 2000, interval: true,
					block: async e => {
						if (!pratikSatismi && !(app.timerYokmu || app.otoKayitTimerYokmu || this.timersDisabledFlag)) {
							try {
								await this.gerekirseFisKaydet(e);
							}
							finally {
								this.timersDisabledFlag = false;
							}
						}
					}
				}
			}*/
		}

		async masaFisIlkIslemler(e) {
			const {app} = this;
			const {aktifMasaID} = app;
			const masa = await app.getAktifMasa({ id: aktifMasaID, masa: app.aktifMasa });
			delete app.aktifMasa;
			delete app.aktifFis;

			let fis = app.aktifFis || (masa ? await masa.getAktifFis({ masa: masa }) : null);
			if (fis) {
				if (!fis.yuklendimi) {
					await fis.yukle();
					await fis.getDetaylar();
				}
			}
			app.aktifFis = fis;
			// app.setAktifFis({ fis: fis });
			await app.setMasaAktifFisID({ id: aktifMasaID, fis: fis, value: (fis || {}).id || null });
			app.navPart.tazele();
		}

		async gerekirseFisOlustur(e) {
			const {app} = this;
			const {aktifFis} = app;
			
			const result = await app.gerekirseFisOlustur(e);
			if (result && !aktifFis)
				app.navPart.tazele();

			return result;
		}

		async fisKaydetIslemi(e) {
			return await this.gerekirseFisKaydet(e);
		}

		async gerekirseFisKaydet(e) {
			e = e || {};
			const {app} = this;
			const {pratikSatismi} = app.class;

			// app.syncAbortFlag = true;
			let {waitPromise} = this;
			if (waitPromise) {
				try { await waitPromise }
				catch (ex) { }
			}
			
			waitPromise = this.waitPromise = new $.Deferred(async p => {
				try {
					const fis = e.fis || app.aktifFis;
					let result = false;
					if (fis && fis.degistimi)
						result = await this.gerekirseFisKaydetDevam(e);
					p.resolve(result);
				}
				catch (ex) {
					p.reject(ex)
				}
				finally {
					const p = this.waitPromise;
					if (p)
						p.resolve(true);
					delete this.waitPromise;
					// app.syncAbortFlag = false;
				};
			});
			
			const result = await waitPromise;
			return result;
		}

		async gerekirseFisKaydetDevam(e) {
			e = e || {};
			const {app} = this;
			const {pratikSatismi} = app.class;
			const fis = e.fis || app.aktifFis;
			if (!fis || !fis.degistimi)
				return false;
			
			await app.promise_aktifBilgileriKaydet;
			fis.degistimi = false;

			/*const {masa} = e;
			this.setUniqueTimeout({
				key: 'setMasaAktifFisID',
				delayMS: 200,
				args: { masa: masa, fis: fis },
				block: e =>
					app.setMasaAktifFisID({ id: e.masa ? e.masa.id : e.masaID || app.aktifMasaID, fis: fis, value: fis.id || null })
			});*/
			
			let result = await fis.kaydet();
			return result;
		}

		/*async sync(e) {
			const {app} = this;
			await this.gerekirseFisKaydet(e);
			await app.wsAktifBilgileriYukle(e);
			await app.wsAktifBilgilerYuklendi(e);
		}*/

		async syncCompleted(e) {
			const {app, listePart} = this;
			const {pratikSatismi} = app.class;

			app.navPart.tazele();
			
			const itemListPart = (listePart || {}).itemListPart || {};
			if (!itemListPart)
				return;
			
			const {itemForm, txtHizliBul} = itemListPart;
			let tazelenebilirmi = !app.miktarDuzenleniyorFlag && !(app.activeWndPart && app.activeWndPart.wnd);
			if (tazelenebilirmi)
				tazelenebilirmi = document.activeElement != txtHizliBul[0];
			if (tazelenebilirmi && itemForm && itemForm.length)
				tazelenebilirmi = !itemForm.find(`.item.selected`).length;
			if (!tazelenebilirmi)
				return;
			
			await this.waitPromise;
			
			let fis = app.aktifFis;
			const fisDegistimi = fis && fis.degistimi;
			await this.gerekirseFisKaydet();
			if (fisDegistimi) {
				// await this.wsBekleyenVerileriGonderIslemiIptal();
				await new $.Deferred(p =>
					setTimeout(() => p.resolve(), 500));
				try {
					const _e = {}
					await app.wsBekleyenVerileriGonder(_e);
					// await app.wsBekleyenVerilerGonderildi(_e);
				} catch (ex) { }
				return false;
			}

			const {aktifMasaID} = app;
			if (!pratikSatismi) {
				const masa = await app.getAktifMasa({ id: aktifMasaID, masa: app.aktifMasa });
				fis = masa ? await masa.getAktifFis({ masa: masa }) : null;
				if (masa) {
					if (masa.aktifFisID && !app.aktifFis) {
						app.aktifFis = fis;
					}
					else if (!masa.aktifFisID) {
							// masaya bağlı adisyon başka cihazdan iptal edildi veya tahsilat yapılıp kapandı
						fis = null;
						await app.setMasaAktifFisID({ id: aktifMasaID, fis: app.aktifFis, value: null });
						await app.aktifFisKaldir();
					}
				}
			}
			
			if (fis && !fis.yuklendimi) {
				await fis.yukle();
				await fis.getDetaylar();
			}

			/*if (!pratikSatismi) {
				for (const i in fis.detaylar) {
					const det = fis.detaylar[i];
					det.yazdirildimi = true;
				}
				await this.fisKaydetIslemi({ fis: fis, masaID: aktifMasaID });
			}*/
			
			if (fis)
				await app.setAktifFis({ aktifMasaID: aktifMasaID, fis: fis });
			else
				await app.aktifFisKaldir();

			let tazelendimi = false;
			if (/*fis &&*/ !pratikSatismi) {
				if (tazelenebilirmi /*&& app.aktifFis_sonIslemZamani && fis.sonIslemZamani && app.aktifFis_sonIslemZamani < fis.sonIslemZamani*/) {
					this.listeTazele(e);
					tazelendimi = true;
				}
				// this.tazele();
				if (fis)
					app.aktifFis_sonIslemZamani = asDate(fis.sonIslemZamani) || null;
			}

			/*if (tazelenebilirmi && !tazelendimi && $.isEmptyObject(this.lastID2Kategori)) {
				this.tazele();
				tazelendimi = true;
			}*/
		}

		wsBekleyenVerileriGonderIslemi(e) {
			e = e || {};
			const {app} = this;
			// app.syncAbortFlag = false;
			this.setUniqueTimeout({
				key: 'bekleyenVerileriGonder',
				delayMS: 500,
				args: e,
				block: async e => {
					// if (app.syncAbortFlag)
					// 	return;
					
					await this.waitPromise;
					await app.waitPromise;
					await this.gerekirseFisKaydet(e);

					const _e = {};
					await app.wsBekleyenVerileriGonder(_e);
				}
			});
		}

		wsBekleyenVerileriGonderIslemiIptal(e) {
			e = e || {};
			// const {app} = this;
			// app.syncAbortFlag = true;
			
			this.clearUniqueTimeout({ key: 'bekleyenVerileriGonder' });
			
			// abortLastOperation();
			/*this.setUniqueTimeout({
				key: 'bekleyenVerileriGonderIptalFlagReset',
				delayMS: 2000,
				args: e,
				block: e =>
					app.syncAbortFlag = false
			});*/
			// abortLastOperation();
		}

		wsBekleyenVerilerGonderildi(e) {
			const {app, listePart} = this;
			const {pratikSatismi} = app.class;
			const {aktifFis} = app;
			if (aktifFis) {
				const {detaylar} = aktifFis;
				for (const i in detaylar) {
					const det = detaylar[i];
					det.gonderildimi = true;
					/*if (!pratikSatismi)
						det.yazdirildimi = true;*/
				}
			}

			const {itemForm} = (listePart || {}).itemListPart;
			let tazelenebilirmi = !app.miktarDuzenleniyorFlag && !(app.activeWndPart && app.activeWndPart.wnd);
			if (tazelenebilirmi && itemForm && itemForm.length)
				tazelenebilirmi = !itemForm.find(`.item.selected`).length;
			
			if (tazelenebilirmi)
				this.listeTazele(e);
		}

		fisDegisti(e) {
			const {app, listePart} = this;
			const {pratikSatismi} = app.class;
			const fis = app.aktifFis;
			if (!fis)
				return;
			
			app.aktifFis_sonIslemZamani = fis.sonIslemZamani = now();
			if (!app.garsonmu)
				fis.yazdirildimi = false;
			fis.gonderildimi = false;
			fis.degistimi = true;
			listePart.itemListPart.toplamTazele();

			const {navPart} = app;
			if (navPart && navPart.layout)
				navPart.widgetPart.jqxMenu('disabled', true);
			this.clearUniqueTimeout({ key: 'navPartEnable' });
			this.setUniqueTimeout({
				key: 'navPartEnable',
				delayMS: 500,
				block: () => {
					if (navPart && navPart.layout)
						navPart.widgetPart.jqxMenu('disabled', false);
				}
			});
			
			this.wsBekleyenVerileriGonderIslemiIptal(e);
			if (!pratikSatismi) {
				this.setUniqueTimeout({
					key: 'bekleyenVerileriGonder',
					delayMS: 100,
					args: e,
					block: async e => {
						const _promise = new $.Deferred(async p2 => {
							try { p2.resolve(await app.wsWaitAll()) }
							catch (ex) { p2.resolve(ex) }
						});
						setTimeout(() => _promise.resolve({ isError: true, rc: 'userAbort' }), 1000);
						try { await _promise }
						catch (ex) { }
						
						await this.wsBekleyenVerileriGonderIslemi(e);
					}
				});
			}
		}

		async detayDegisti(e) {
			const {app} = this;
			const {pratikSatismi} = app.class;
			const {noLog} = e;
			const {aktifFis} = app;
			const det = e.detay;
			if (!(aktifFis && det))
				return;
			
			det.yazdirildimi = det.gonderildimi = false;
			await det.brutBedelHesapla(e);
			await det.netBedelHesapla(e);

			if (!(noLog || pratikSatismi)) {
				const log = new SkyCafeLog({
					refTable: SkyCafeDetay.table,
					refID: (det || {}).id || null,
					refID2: aktifFis.id || null,
					islem: 'detayDegistir',
					data: {
						from: e.from || 'grid',
						aktifMasaID: app.aktifMasaID || null,
						aktifFisID: aktifFis.id || null,
						detay: det.reduce()
					}
				});
				await log.kaydet();
			}

			await this.fisDegisti();
		}

		async tazele(e) {
			e = e || {};
			const {ilkmi} = e;
			const {app, layout} = this;
			const {activeWndPart} = app;
			const promiseTazeleKategoriOrtak = new $.Deferred(async p => {
				await this.tazele_ustKategoriler(e);
				await this.tazele_kategoriler(e);
				this.tazele_kategoriDetaylar(e);
				p.resolve();
			});
			
			this.listeTazele(e);
			// app.navPart.tazele(e);
			// this.barkodUI.jqxComboBox('source').dataBind();
			this.updateUI(e);
			
			let clickIds = {
				ustKategori: this.aktifUstKategoriID,
				kategori: this.aktifKategoriID
			};
			/*if (!this.aktifUstKategoriID && !$.isEmptyObject(app.id2UstKategori))
				clickIds.ustKategori = this.aktifUstKategoriID = Object.keys(app.id2UstKategori)[0];
			if (!this.aktifKategoriID && !$.isEmptyObject(app.id2Kategori))
				clickIds.kategori = this.aktifKategoriID = Object.keys(app.id2Kategori)[0];*/
			
			await promiseTazeleKategoriOrtak;

			if (!(activeWndPart && activeWndPart.wnd)) {
				const waitTimes = [10, 50, 200, 300];
				for (const i in waitTimes) {
					setTimeout(() => {
						this.setFocusToDefault(e);
						this.onResize(e);
					}, waitTimes[i])
				}
			}

			let id, elm;
			if (id = clickIds.ustKategori)
				elm = this.ustKategoriParent.find(`#${id}.item`);
			else
				elm = this.ustKategoriParent.find(`.item:eq(0)`);
			if (elm.length)
				elm.click();

			if (id = clickIds.kategori)
				elm = this.kategoriParent.find(`#${id}.item`);
			else
				elm = this.kategoriParent.find(`.item:eq(0)`);
			if (elm.length)
				elm.click();
			
			if (ilkmi) {
				setTimeout(() => {
					layout.css(`opacity`, .3);
				}, 50);
			}
			setTimeout(() => {
				layout.css(`opacity`, 1);
			}, $.isEmptyObject(clickIds) ? 200 : 300);
		}

		async listeTazele(e) {
			return await this.listePart.tazele(e);
		}

		async tazele_ustKategoriler(e) {
			const {app} = this;
			await this.initSubLayout({
				tip: 'ustKategori',
				parent: this.ustKategoriParent,
				eventSelector: 'ustKategoriTiklandi',
				autoBackgroundColor: true,
				dataSource: e => {
					let ustKategoriler = Object.values(app.id2UstKategori || {});
					if ($.isEmptyObject(ustKategoriler))
						return [];
					
					const anaTip = app.aktifMasaAnaTip;
					const {id2Kategori} = app;
					this.lastID2Kategori = id2Kategori;
					const ustID2Set = {};
					let uygunKategoriVarmi = false;
					for (const id in id2Kategori) {
						const rec = id2Kategori[id];
						const {ustKategoriID} = rec;
						if (rec.tipIcinUygunmu({ tip: anaTip })) {
							uygunKategoriVarmi = true;
							if (ustKategoriID)
								ustID2Set[ustKategoriID] = true;
						}
					}

					ustKategoriler = ustKategoriler
						.filter(rec => ustID2Set[rec.id || 0]);

					const result = [];
					if (uygunKategoriVarmi) {
						result.push(...ustKategoriler);
						result.push(new SkyCafeUstKategori({ id: 0, aciklama: `- <u>DİĞERLERLERİ</u> -` }));
					}
					
					return result;
				}
			});
		}

		async tazele_kategoriler(e) {
			const {app} = this;
			await this.initSubLayout({
				tip: 'kategori',
				parent: this.kategoriParent,
				eventSelector: 'kategoriTiklandi',
				autoBackgroundColor: true,
				dataSource: e => {
					const anaTip = app.aktifMasaAnaTip;
					const kategoriler = Object.values(app.id2Kategori || {})
						.filter(rec => {
							return rec.tipIcinUygunmu({ tip: anaTip }) &&
								(this.aktifUstKategoriID == null || (rec.ustKategoriID || 0) == (this.aktifUstKategoriID || 0))
						});
					
					return kategoriler;
				}
			});
		}

		async tazele_kategoriDetaylar(e) {
			const {app} = this;
			await this.initSubLayout({
				tip: 'kategoriDetay',
				parent: this.kategoriDetayParent,
				eventSelector: 'kategoriDetayTiklandi',
				eventRightClickSelector: 'kategoriDetaySagTiklandi',
				dataSource: async e => {
					const parentID = this.aktifKategoriID;
					if (!parentID)
						return null;
					
					const anaTip = app.aktifMasaAnaTip;
					const kategori = app.id2Kategori[parentID];
					const _result = await kategori.getRefInstListe({ tip: anaTip });
					const result = [];
					for (const i in _result) {
						const inst = _result[i];
						if (!inst || (anaTip && !inst.class.grupmu && !inst.fiyatFor({ tip: anaTip })))
							continue;
						result.push(inst);
					}

					return result;
				},
				templateItemSelector: `.kategoriDetay`,
				itemDuzenleyici: e => {
					const {rec, divItem} = e;
					const anaTip = app.aktifMasaAnaTip;
					// divItem.find(`#aciklama`).html(rec.aciklama || '');
					const divFiyat = divItem.find(`#fiyat`);
					if (divFiyat.length) {
						const fiyat = rec.fiyatFor({ tip: anaTip });
						if (fiyat) {
							divFiyat.html(fiyat);
							divFiyat.parent().removeClass(`jqx-hidden`);
						}
						else {
							divFiyat.parent().addClass(`jqx-hidden`);
						}
					}

					const btnIzle = divItem.find(`.islemTuslari #btnIzle`);
					if (btnIzle.length) {
						btnIzle.jqxButton({ theme: theme })
							.on('click', evt =>
								this.kategoriDetaySagTiklandi($.extend({}, e, { event: evt, rec: rec })))
					}
				}
			});
		}

		initBarkodUI(e) {
			const {app, barkodUI} = this;
			barkodUI
				// .jqxInput({ theme: theme, maxLength: 100 })
				.jqxComboBox({
					theme: theme, animationType: animationType,
					width: false, height: false,
					placeHolder: `Barkod okutunuz veya Arama yapınız`,
					valueMember: 'id', displayMember: 'aciklama',
					searchMode: 'containsignorecase', minLength: 0, itemHeight: 50,
					/*autoDropDownHeight: false, dropDownWidth: barkodUI.width(),*/
					autoDropDownHeight: false, dropDownHeight: 350, remoteAutoComplete: true, remoteAutoCompleteDelay: 50,
					openDelay: 500, closeDelay: 1000, autoOpen: false,
					source: new $.jqx.dataAdapter({
						id: `id`, datatype: `json`, url: `empty.json`,
						data: { searchText: barkodUI.val(), maxRow: 50 }
					}, {
						autoBind: true, async: false,
						loadServerData: async (wsArgs, source, callback) => {
							const result = await this.barkodUI_loadServerData({ wsArgs: wsArgs, source: source, callback: callback });
							if (result) {
								callback({ totalrecords: result.length, records: result });

								/*const widget = barkodUI.jqxComboBox('getInstance');
								const isOpen = widget.isOpened();
								if (isOpen)
									widget.close();*/

								/*const widget = barkodUI.jqxComboBox('getInstance');
								const isOpen = widget.isOpened();
								if ($.isEmptyObject(result)) {
									if (isOpen)
										widget.close();
								}
								else {
									if (!isOpen)
										widget.open();
								}*/
							}
						}
					}),
					search: searchText => {
						let ind = searchText.indexOf('x');
						ind = ind < 0 ? searchText.indexOf('*') : ind;
						delete this.sonAktifMiktar;
						if (ind >= 0) {
							const miktar = asFloat(searchText.substring(0, ind)) || null;
							if (miktar) {
								this.sonAktifMiktar = miktar;
								searchText = searchText.substring(ind + 1);
							}
						}
						
						this.setUniqueTimeout({
							key: 'barkodUI_search',
							delayMS: 500,
							args: $.extend({}, e, { searchText: searchText }),
							block: e => {
								const {searchText} = e;
								const da = barkodUI.jqxComboBox('source');
								if (da._source.data.searchText != searchText) {
									da._source.data.searchText = searchText;
									da.dataBind();
									//setTimeout(() => barkodUI.jqxComboBox('open'), 300);
								}
							}
						});
					},
					renderer: (index, aciklama, id) => {
						return `<span class="autoComplete-item">${aciklama}</span>`
						// return aciklama
					},
					renderSelectedItem: (index, item) => {
						return item.label
					}
				})
			barkodUI.jqxTooltip({ theme: theme, trigger: `hover`, content: `Barkod okutma alanı` });
			barkodUI.on(`keyup`, evt => {
				const key = (evt.key || '').toLowerCase();
				if (key == 'enter' || key == 'linefeed') {
					this.barkodOkutuldu($.extend({}, e, {
						event: evt, barkod: evt.target.value,
						miktar: this.sonAktifMiktar || null, noTextParse: false
					}));
				}
			});
			barkodUI.on('change', evt => {
				const args = evt.args;
				if (args && args.type && args.type != 'none') {
					const item = args.item || {};
					const boundItem = item.originalItem;
					this.barkodOkutuldu($.extend({}, e, {
						event: evt, item: item, boundItem: boundItem, index: args.index,
						miktar: this.sonAktifMiktar || null, noTextParse: true
					}));
				}
			});
			const barkodUIInput = this.barkodUIInput = barkodUI.jqxComboBox('input');
			barkodUIInput.on('focus', evt =>
				this.barkodUIInput_onFocus($.extend({}, e, { event: evt })));
			barkodUIInput.on('click', evt =>
				this.barkodUIInput_onClick($.extend({}, e, { event: evt })));
			barkodUIInput.on('contextmenu', evt =>
				this.barkodUIInput_onDblClick($.extend({}, e, { event: evt })));
			
			barkodUI.on('open', evt =>
				this.barkodUI_onOpen($.extend({}, e, { event: evt })));
			barkodUI.on('close', evt =>
				this.barkodUI_onClose($.extend({}, e, { event: evt })));
			
			// barkodUI.jqxComboBox('source').dataBind();
		}

		initMiktarKlavyePart(e) {
			this.initMiktarKlavyePartDevam(e);

			const waitTimes = [50, 150, 300];
			for (const i in waitTimes) {
				setTimeout(() => {
					const {miktarKlavyePart} = this;
					const miktarKlavyeWnd = miktarKlavyePart ? miktarKlavyePart.wnd : null;
					if (miktarKlavyeWnd) {
						const {wndContent} = miktarKlavyePart;
						miktarKlavyeWnd.jqxWindow('position', {
							x: $(window).width() - wndContent.width() - 20,
							y: $(window).height() - wndContent.height() - 50
						})
					}
				}, waitTimes[i]);
			}
		}

		initMiktarKlavyePartDevam(e) {
			let {miktarKlavyePart} = this;
			if (miktarKlavyePart) {
				miktarKlavyePart.open(e);
				return;
			}

			miktarKlavyePart = this.miktarKlavyePart = new SkyCafeKlavyePart({
				tip: 'numerik', canClose: false,
				title: `<div id="title-text" class="float-left">Miktar</div> <div id="aktifMiktarParent" class="float-left jqx-hidden"><span id="aktifMiktar"/></div>`,
				position: {
					x: $(window).width() - 235,
					y: $(window).height() - 235
				},
				opacity: .8,
				events: {
					tusTiklandi: e =>
						this.klavye_tusTiklandi(e)
				}
			});
			miktarKlavyePart.open(e);
		}

		klavye_tusTiklandi(e) {
			const {activeElement} = document;
			const {sender, id, event} = e;
			const {app} = this;
			const {activeWnd, activeWndPart, miktarDuzenleniyorFlag} = app;
			const {commaFlag, lastActiveElement} = sender;
			const numerikmi = sender.tip == 'numerik' || (activeElement && (activeElement.classList.contains(`jqx-numberinput`) || activeElement.parentElement.classList.contains(`jqx-numberinput`)));
			const isNumberInput = activeElement.classList.contains(`jqx-numberinput`);
			const isNumberInputOrParent = isNumberInput || activeElement.parentElement.classList.contains(`jqx-numberinput`);
			let hasOpenLayout = (activeWnd && activeWndPart && activeElement) || 
				(activeElement && (activeElement.tagName.toUpperCase() == 'INPUT'
						/*&& !activeElement.classList.contains(`jqx-combobox-input`)*/));
			// barkodUI için Miktar (nümerik) klavyeyi önle
			if (hasOpenLayout && numerikmi && activeElement.classList.contains(`jqx-combobox-input`))
				hasOpenLayout = false;
			
			if (numerikmi && (id == '.' || id == ',')) {
				if (isNumberInputOrParent) {
					const $activeElement = $(isNumberInput ? activeElement : activeElement.parentElement);
					if (!$activeElement.jqxNumberInput('decimalDigits')) {
						setTimeout(() => activeElement.focus(), 10);
						return true;
					}
				}
				sender.commaFlag = true;
			}
			else {
				let text;
				if (hasOpenLayout) {
					text = !lastActiveElement || lastActiveElement != activeElement
								? ''
								: (numerikmi
										? asFloat(activeElement.value) || ''
										: activeElement.value || ''
									).toString()
				}
				else {
					text = (this.aktifMiktar || '').toString();
				}
				sender.lastActiveElement = activeElement;

				const lastText = text;
				switch (id) {
					case 'enter':
						if (hasOpenLayout && activeWndPart && activeWndPart.tamamIstendi) {
							activeWndPart.tamamIstendi(e);
						}
						else {
							this.barkodOkutuldu($.extend({}, e, {
								event: event, rec: null, barkod: this.barkodUIInput.val(),
								miktar: this.sonAktifMiktar || null, noTextParse: false
							}));
						}
						break;
					case 'backspace':
						if (!commaFlag && text)
							text = text.slice(0, -1);
						break;
					case 'space':
						if (!commaFlag)
							text += ' ';
						break;
					case 'clear':
						text = '';
						break;
					default:
						if (numerikmi && commaFlag) {
							if (!text)
								text += '0';
							text += '.';
						}
						text += id;
						break;
				}
				sender.commaFlag = false;

				if (!text || text != lastText) {
					let value = numerikmi
									? roundToFra(asFloat(text), hasOpenLayout && activeElement.id == 'fiyat' ? 4 : 3) || ''
									: text || '';
					if (hasOpenLayout) {
						const $activeElement = $(activeElement);
						if (numerikmi && !value)
							value = '';
							// value = '0';

						let uygunmu = true;
						if (uygunmu) {
							if (isNumberInputOrParent && typeof value == 'number') {
								const w = (isNumberInput ? $activeElement : $activeElement.parent()).jqxNumberInput('getInstance');
								const {min, max} = w;
								uygunmu = (min == null || value >= min) && (max == null || value <= max);
							}
						}

						if (uygunmu) {
							activeElement.value = value;
							$activeElement.trigger('change');
							$activeElement.trigger('keyup');
							if (isNumberInputOrParent) 
								$activeElement.jqxNumberInput('validate');
						}


						//if (activeElement.classList.contains(`jqx-input`))
						//	setTimeout(() => $(activeElement).jqxInput('open'), 500);
						//if (activeElement.classList.contains(`jqx-combobox`))
						//	setTimeout(() => $(activeElement).jqxComboBox('open'), 500);
					}
					else {
						if (numerikmi && (value >= 0 && value < 1000))
							this.setAktifMiktar(value);
					}
				}
			}
			
			//if (hasOpenLayout)
			setTimeout(() => activeElement.focus(), 10);
			if (miktarDuzenleniyorFlag)
				app.miktarDuzenleniyorFlag = true;
			
			return true;
		}

		async initSubLayout(e) {
			const BackgroundMaxStyle = 5;
			const {txtHizliBul, templates} = this;
			const {tip, filter, dataSource, parent, eventSelector, eventRightClickSelector} = e;
			const autoBackgroundColor = asBool(e.autoBackgroundColor);
			const templateItemSelector = e.templateItemSelector || `.ortak`;
			
			let recs = dataSource
							? $.isFunction(dataSource)
								? dataSource.call(this, e)
								: dataSource.run ? dataSource.run(e) : dataSource
							: null;
			recs = await recs;
			recs = recs ? recs.records || recs : null;
			
			const parentForm = parent.parent();
			if (!recs) {
				parentForm.addClass(`jqx-hidden`);
				return;
			}
			
			const filters = [];
			if (filter) {
				if ($.isArray(filter))
					filters.push(...filter);
				else
					filters.push(filter);
			}

			const _parent = $(document.createDocumentFragment());
			if ($.isEmptyObject(recs)) {
				parentForm.addClass(`jqx-hidden`);
			}
			else {
				let textFilterParts, textFilterPartsLower, textFilterPartsTRLower;
				const textFilter = e.textFilter == null ? (txtHizliBul && txtHizliBul.length ? txtHizliBul.val() : null) : e.textFilter;
				if (textFilter) {
					textFilterParts = [];
					textFilterPartsLower = [];
					textFilterPartsTRLower = [];
					const parts = textFilter.split(' ');
					for (const i in parts) {
						const part = parts[i];
						if (part) {
							textFilterParts.push(part);
							textFilterPartsLower.push(part.toLowerCase());
							textFilterPartsTRLower.push(part.toLocaleLowerCase(culture));
						}
					}
				}
				if (!$.isEmptyObject(textFilterParts)) {
					filters.push(e => {
						const {id, aciklama, textFilterParts, textFilterPartsLower} = e;
						const aciklamaLower = aciklama.toLowerCase();
						const aciklamaTRLower = aciklama.toLocaleLowerCase(culture);
						let uygunmu = true;
						for (let i = 0; i < textFilterParts.length; i++) {
							if (!(aciklama.includes(textFilterParts[i]) || aciklamaLower.includes(textFilterPartsLower[i]) || aciklamaTRLower.includes(textFilterPartsTRLower[i]))) {
								uygunmu = false;
								break
							}
						}
						return uygunmu;
					});
				}

				const itemDuzenleyiciler = [];
				itemDuzenleyiciler.push(e => {
					const {rec, divItem} = e;
					divItem.find(`#aciklama`).html(rec.aciklama || '');
				});
				const {itemDuzenleyici} = e;
				if (itemDuzenleyici) {
					if ($.isArray(itemDuzenleyici))
						itemDuzenleyiciler.push(...itemDuzenleyici);
					else
						itemDuzenleyiciler.push(itemDuzenleyici);
				}

				const templateItem = templates.contents(`${templateItemSelector}.item`);
				for (const i in recs) {
					const rec = recs[i];
					const {id, aciklama} = rec;
					const _e = $.extend({}, e, {
						parent: parent, tip: tip, dataSource: dataSource,
						rec: rec, id: id, aciklama: aciklama, textFilter: textFilter,
						textFilterParts: textFilterParts, textFilterPartsLower: textFilterPartsLower
					});

					let uygunmu = true;
					if (uygunmu && filters) {
						for (const i in filters) {
							if (!uygunmu)
								break;
							const filter = filters[i];
							uygunmu = filter.run
											? filter.run(_e)
											: $.isFunction(filter) ? filter.call(this, _e) : filter;
						}
						if (!uygunmu)
							continue;
					}

					const divItem = _e.divItem = templateItem.clone(true);
					divItem.prop('id', id);
					if (!$.isEmptyObject(itemDuzenleyiciler)) {
						for (const i in itemDuzenleyiciler) {
							const handler = itemDuzenleyiciler[i];
							const result =
								handler.run
									? handler.run(_e)
									: $.isFunction(handler) ? handler.call(this, _e) : handler;
							if (result === false)
								continue;
						}
					}
					if ($.isFunction(rec.cssDuzenle))
						rec.cssDuzenle({ target: divItem });
					
					if (autoBackgroundColor)
						divItem.addClass(`style-${(i % BackgroundMaxStyle) + 1}`);

					divItem.appendTo(_parent);
					divItem.data('args', _e);
					if (eventSelector) {
						divItem.on('click', evt => {
							const divItem = $(evt.currentTarget);
							const _e = divItem.data('args');
							const {parent, dataSource} = _e;
							if (!parent.hasClass(`scrolled`)) {
								const callArg = $.extend({}, e, _e, { id: divItem.id, event: evt });
								if (eventSelector.run)
									eventSelector.run(callArg);
								else if ($.isFunction(eventSelector))
									eventSelector.call(this, callArg);
								else
									this[eventSelector].call(this, callArg);
							}
						});
					}
					if (eventRightClickSelector) {
						divItem.on('contextmenu', evt => {
							const divItem = $(evt.currentTarget);
							const _e = divItem.data('args');
							const {parent, dataSource} = _e;
							if (!parent.hasClass(`scrolled`)) {
								const callArg = $.extend({}, e, _e, { id: divItem.id, event: evt });
								if (eventRightClickSelector.run)
									eventRightClickSelector.run(callArg);
								else if ($.isFunction(eventRightClickSelector))
									eventRightClickSelector.call(this, callArg);
								else
									this[eventRightClickSelector].call(this, callArg);
							}
						});
					}
				}
				parentForm.removeClass(`jqx-hidden`);
			}

			parentForm.addClass(`basic-hidden`);
			parent.children().remove();
			_parent.appendTo(parent);
			parentForm.removeClass(`basic-hidden`);
			// Utils.makeScrollable(parentForm);
		}

		async ustKategoriTiklandi(e) {
			const {app} = this;
			const {id2Kategori} = app;

			this.aktifUstKategoriID = e.id;
			this.aktifKategoriID = null;

			this.tazele_kategoriler(e).then(() => {
				e.parent.children().removeClass(`selected`);
				e.divItem.addClass(`selected`);
			});
			await this.tazele_kategoriDetaylar(e);

			let elm = this.kategoriParent.find(`.item:eq(0)`);
			if (elm.length)
				elm.click();

			await this.itemTiklandiOrtak(e);
		}

		async kategoriTiklandi(e) {
			this.aktifKategoriID = e.id;
			
			this.tazele_kategoriDetaylar(e).then(() => {
				e.parent.children().removeClass(`selected`);
				e.divItem.addClass(`selected`);
			});

			await this.itemTiklandiOrtak(e);
		}

		async kategoriDetayTiklandi(e) {
			await this.itemTiklandiOrtak(e);

			const evt = e.event || {};
			if (evt.target && evt.target.tagName.toUpperCase() == 'BUTTON')
				return;

			const {barkodUIInput} = this;
			let {miktar} = e;
			let text = barkodUIInput.val();
			if (text) {
				let ind = text.indexOf('x');
				if (ind < 0)
					ind = text.indexOf('X');
				if (ind < 0)
					ind = text.indexOf('*');
				if (ind >= 0)
					text = text.substring(0, ind);
				 miktar = e.miktar = asFloat(text) || null;
			}
			e.miktar = (this.aktifMiktar || 1) * (miktar || 1);
			
			this.ekle($.extend({}, e, { from: 'kategoriDetay', urun: e.rec, miktar: miktar }));
			
			this.aktifMiktarReset(e);
			barkodUIInput.val('');
			this.setFocusToDefault(e);
		}

		async kategoriDetaySagTiklandi(e) {
			await this.itemTiklandiOrtak(e);

			const {app, barkodUIInput, detayDuzenlePart} = this;
			if (!app.zAcikmi) {
				displayMessage(`Z Kapalıdır, işlem yapılamaz`, `@ Z Kapalı @`);
				barkodUIInput.val('');
				this.setFocusToDefault(e);
				return false;
			}

			const {rec} = e;
			let {miktar} = e;
			let text = barkodUIInput.val();
			if (text) {
				let ind = text.indexOf('x');
				if (ind < 0)
					ind = text.indexOf('X');
				if (ind < 0)
					ind = text.indexOf('*');
				if (ind >= 0)
					text = text.substring(0, ind);
				 miktar = e.miktar = asFloat(text) || null;
			}
			miktar = miktar || this.aktifMiktar || 1;
			
			barkodUIInput.val('');
			this.setFocusToDefault(e);
			
			const newDetay = e => {
				const fis = app.aktifFis;
				return fis ? fis.newDetay(e) : new SkyCafeFis.detaySinif(e);
			}
			const anaTip = app.aktifMasaAnaTip;
			const det = newDetay({ tip: anaTip, urun: rec, miktar: miktar });
			if (!det.promise_detayEkIslemler)
				await det.detayEkIslemler(e);
			
			if (detayDuzenlePart) {
				const _e = {
					title: `Ürün Ekle`,
					detay: det,
					modal: false,
					geriCallback: e => {
						// this.detayDegisti({ detay: e.detay });
						// this.listeTazele(e);
						barkodUIInput.val('');
						this.setFocusToDefault(e);
					},
					tamamIslemi: e => {
						this.ekle({ from: 'detayDuzenlePart', fromDuzenleEkraniFlag: true, rec: e.detay });
						return true;
					}
				};
				detayDuzenlePart.open(_e);
				this.aktifMiktarReset(e);
			}
		}

		async itemTiklandiOrtak(e) {
			// debugger;
			this.app.hideNotifications();
		}

		async listeItem_sagTiklandi(e) {
			const {app} = this;
			if (!app.zAcikmi) {
				displayMessage(`Z Kapalıdır, işlem yapılamaz`, `@ Z Kapalı @`);
				this.barkodUIInput.val('');
				this.setFocusToDefault(e);
				return false;
			}

			const {detayDuzenlePart} = this;
			const det = e.rec;
			if (!det)
				return false;
			
			if (!app.class.pratikSatismi && det.yazdirildimi && /*det.gonderildimi &&*/ !app.sefmi) {
				displayMessage(`Bu satış için <u>Mutfak Fişi</u> yazdırılmıştır ve sadece <b>ŞEF KULLANICI</b> değiştirebilir!`, `Satış Değiştirme İşlemi`);
				return false;
			}
			
			if (detayDuzenlePart) {
				if (detayDuzenlePart.wnd) {
					const detay = detayDuzenlePart.aktifDetay;
					if (detay && !detay.silindimi) {
						await this.detayDegisti({ from: 'ui', detay: detayDuzenlePart.detay });
						this.listeTazele(e);
					}
				}

				const _e = {
					title: `Satış Düzenle`,
					detay: det,
					// detay: det.deepCopy(),
					geriCallback: async e => {
						const {detay} = e;
						if (detay && !detay.silindimi) {
							await this.detayDegisti({ from: 'ui', detay: detay });
							this.listeTazele(e);
						}
						this.barkodUIInput.val('');
						this.setFocusToDefault(e);
					},
					tamamIslemi: e => {
						// this.detayDegisti(e)
						// this.listeTazele(e);
						this.barkodUIInput.val('');
						this.setFocusToDefault(e);
						return true;
					}
				};
				detayDuzenlePart.open(_e);
				this.aktifMiktarReset(e);
			}
		}

		async tamamIstendi(e) {
			e = e || {};
			const {app} = this;
			const {pratikSatismi} = app.class;
			const {aktifMasaID, aktifFis} = app;
			const {tx} = e;

			/*let _promise = new $.Deferred(async p2 => {
				try { p2.resolve(await app.wsWaitAll()) }
				catch (ex) { p2.resolve(ex) }
			});
			setTimeout(() => _promise.resolve({ isError: true, rc: 'userAbort' }), 500);
			try { await _promise }
			catch (ex) { }*/
			
			let yazdirildimi = false;
			if (aktifFis && !aktifFis.aciklama && $.isEmptyObject(aktifFis.detaylar.filter(det => !det.silindimi))) {
				yazdirildimi = true;
				await this.fisKaydetIslemi({ fis: aktifFis, masaID: aktifMasaID });
				await app.iptalDevam({ tx: tx, silent: true, from: 'detaylariSil' });
			}
			else {
				if (aktifFis) {
					if (!pratikSatismi) {
						if (aktifFis.detaylar.find(det => !det.silindimi && !det.yazdirildimi)) {
							yazdirildimi = true;
							for (const i in aktifFis.detaylar) {
								const det = aktifFis.detaylar[i];
								if (!det.yazdirildimi)
									det.yazdirildimi = true;
							}
							await this.fisKaydetIslemi({ fis: aktifFis, masaID: aktifMasaID });
							await app.mutfakFisiYazdir({ tx: tx, aktifMasaID: aktifMasaID });
						}
					}
					if (!yazdirildimi)
						await this.fisKaydetIslemi({ fis: aktifFis, masaID: aktifMasaID });
				}
				await app.aktifFisKaldir();
				app.navPart.tazele();
			}
			await app.aktifMasaKaldir();

			await this.wsBekleyenVerileriGonderIslemiIptal();
			delete app.syncAbortFlag;
			app.timersDisabledFlag = true;
			try {
				let _promise = new $.Deferred(async p2 => {
					try { p2.resolve(await app.wsWaitAll()) }
					catch (ex) { p2.resolve(ex) }
				});
				setTimeout(() => _promise.resolve({ isError: true, rc: 'userAbort' }), 200);
				try { await _promise }
				catch (ex) { }
				
				const _e = {}
				app.wsBekleyenVerileriGonder(_e);
				//app.wsAktifBilgileriYukle(_e).then(() =>
				//	app.wsAktifBilgilerYuklendi(_e));
			}
			catch (ex) { }
			finally {
				await app.setUniqueTimeout({
					key: 'enableTimers',
					delayMS: 3000,
					block: () =>
						app.timersDisabledFlag = false
				});
			}

			app.showContent({ partClass: SkyCafeMasalarPart });
		}

		async iptalIstendi(e) {
			const {app} = this;
			if (!app.zAcikmi) {
				displayMessage(`Z Kapalıdır, işlem yapılamaz`, `@ Z Kapalı @`);
				return false;
			}

			const masa = await app.getAktifMasa();
			if (masa && masa.servisDisimi) {
				displayMessage(`Masa Servis Dışıdır, işlem yapılamaz`, `@ Masa Servis Dışı @`);
				return false;
			}

			const {pratikSatismi} = app.class;
			const {aktifFis, aktifMasaID} = app;
			if (aktifFis && !pratikSatismi && !app.sefmi) {
				const {detaylar} = aktifFis;
				const silinmeyenDetaylar = [];
				const yazdirilmayanDetIndexListe = [];
				for (const i in detaylar) {
					const det = detaylar[i];
					if (!det.silindimi) {
						silinmeyenDetaylar.push(det);
						if (!det.yazdirildimi)
							yazdirilmayanDetIndexListe.push(i);
					}
				}

				if (yazdirilmayanDetIndexListe.length < silinmeyenDetaylar.length) {
					const iptalAciklama = 'Adisyon İPTAL Butonu işlemi';
					const silinenDetayBilgiler = [];
					const removeIndexes = $.isEmptyObject(yazdirilmayanDetIndexListe) ? [] : yazdirilmayanDetIndexListe.sort().reverse();
					if (!$.isEmptyObject(removeIndexes)) {
						for (const i in removeIndexes) {
							const index = removeIndexes[i];
							const det = detaylar[index];
							det.silindimi = true;
							if (iptalAciklama)
								det.iptalAciklama = '';
							silinenDetayBilgiler.push({ index: index, detayID: det.id });
						}
						
						const log = new SkyCafeLog({
							refTable: SkyCafeFis.table,
							refID: aktifFis.id,
							refID2: aktifMasaID || null,
							islem: 'detaylariSil',
							data: {
								aktifMasaID: aktifMasaID || null,
								aktifFisID: aktifFis.id || null,
								iptalAciklama: iptalAciklama || '',
								silinenDetayBilgiler: silinenDetayBilgiler
							}
						});
						await log.kaydet();
	
						const fisBosmu = $.isEmptyObject(aktifFis.detaylar.filter(det => !det.silindimi));
						await this.listeTazele();
						await this.fisDegisti(e);
						
						if (fisBosmu) {
							// await app.setMasaAktifFisID({ id: aktifMasaID, fis: aktifFis, value: null });
							// await app.aktifFisKaldir();
							 await this.fisKaydetIslemi({ fis: aktifFis, masaID: aktifMasaID });
							 await app.iptalDevam({ tx: e.tx, silent: true });
						}
					}
					return true;
				}
			}
			
			await this.fisKaydetIslemi();
			
			let result = await app.iptalIstendi(e);
			if (result && result.result !== undefined)
				result = result.result;
			if (result === false)
				return result;
			
			await this.wsBekleyenVerileriGonderIslemiIptal();
			delete app.syncAbortFlag;
			try {
				const _e = {}
				app.wsBekleyenVerileriGonder(_e);
				//app.wsAktifBilgileriYukle(_e).then(() =>
				//	app.wsAktifBilgilerYuklendi(_e));
			} catch (ex) { }

			if (pratikSatismi) {
				await this.fisDegisti();
				this.activatePartDevam();
				return;
			}
			await app.aktifMasaKaldir();
			app.showContent({ partClass: SkyCafeMasalarPart });

			return result;
		}

		async nakitIstendi(e) {
			await this.tahsilatIstendi($.extend({}, e, { tip: 'NK' }));
		}

		async posIstendi(e) {
			await this.tahsilatIstendi($.extend({}, e, { tip: 'PS' }));
		}

		async yemekCekiIstendi(e) {
			await this.tahsilatIstendi($.extend({}, e, { tip: 'YM' }));
		}

		async karmaTahsilatIstendi(e) {
			await this.tahsilatIstendi($.extend({}, e, { karmami: true }));
		}

		async kismiTahsilatIstendi(e) {
			await this.tahsilatIstendi($.extend({}, e, { karmami: true, kismimi: true }));
		}

		async rezervasyonIstendi(e) {
			const {app} = this;
			if (!app.zAcikmi) {
				displayMessage(`Z Kapalıdır, işlem yapılamaz`, `@ Z Kapalı @`);
				return false;
			}

			// await this.gerekirseFisOlustur();
			let result = await this.app.rezervasyonIstendi(e);
			if (result && result.result !== undefined)
				result = result.result;
			
			if (result === false)
				return result;
			
			await this.fisDegisti();
			await this.activatePartDevam();
			app.navPart.tazele();

			return result;
		}

		async fisAciklamaIstendi(e) {
			if (!this.app.zAcikmi) {
				displayMessage(`Z Kapalıdır, işlem yapılamaz`, `@ Z Kapalı @`);
				return false;
			}

			// await this.gerekirseFisOlustur();
			let result = await this.app.fisAciklamaIstendi(e);
			if (result && result.result !== undefined)
				result = result.result;
			
			if (result === false)
				return result;
			
			await this.fisDegisti();
			await this.activatePartDevam();

			return result;
		}

		async masaTransferIstendi(e) {
			const {app} = this;
			if (!app.zAcikmi) {
				displayMessage(`Z Kapalıdır, işlem yapılamaz`, `@ Z Kapalı @`);
				return false;
			}

			const {aktifFis, aktifMasaID} = app;
			if (aktifFis && aktifFis.yazdirildimi && app.garsonmu) {
				displayMessage(`<b>${aktifMasaID}</b> masasına ait Adisyon yazdırıldığı için <u>işlem yapılamaz</u>`, `@ Adisyon Yazdırılmış @`);
				return false;
			}

			let result = await app.masaTransferIstendi(e);
			if (result && result.result !== undefined)
				result = result.result;
			
			if (result === false)
				return result;
			
			await this.fisKaydetIslemi();
			await this.activatePartDevam();
			
			return result;
		}

		async servisDisiIstendi(e) {
			const {app} = this;
			if (!app.zAcikmi) {
				displayMessage(`Z Kapalıdır, işlem yapılamaz`, `@ Z Kapalı @`);
				return false;
			}

			let result = await app.servisDisiIstendi(e);
			if (result && result.result !== undefined)
				result = result.result;
			
			if (result === false)
				return result;
			
			this.fisKaydetIslemi();

			const masa = await app.getAktifMasa();
			if (!masa || masa.servisDisimi)
				this.tamamIstendi();
			else
				this.activatePartDevam();
			
			return result;
		}

		async yazdirIstendi(e) {
			const {app} = this;
			if (!app.zAcikmi) {
				displayMessage(`Z Kapalıdır, işlem yapılamaz`, `@ Z Kapalı @`);
				return false;
			}

			const {aktifFis, aktifMasaID} = app;
			if (aktifFis && aktifFis.yazdirildimi && app.garsonmu) {
				displayMessage(`<b>${aktifMasaID}</b> masasına ait Adisyon yazdırılmış ve tekrar yazdırılamaz`, `@ Adisyon Yazdır İşlemi @`);
				return false;
			}

			let result = await app.yazdirIstendi(e);
			if (result && result.result !== undefined)
				result = result.result;
			
			if (result === false)
				return result;
			
			this.fisKaydetIslemi();
			this.activatePartDevam();
			app.navPart.tazele();

			setTimeout(
				() => displayMessage(`<b>${aktifMasaID}</b> masasına ait Adisyon yazdırılmak için sıraya alındı`, `Adisyon Yazdır İşlemi`),
				1000);
			
			return result;
		}

		async tahsilatIstendi(e) {
			const {app} = this;
			if (!app.zAcikmi) {
				displayMessage(`Z Kapalıdır, işlem yapılamaz`, `@ Z Kapalı @`);
				return false;
			}

			const masa = await app.getAktifMasa();
			if (masa && masa.servisDisimi) {
				displayMessage(`Masa Servis Dışıdır, işlem yapılamaz`, `@ Masa Servis Dışı @`);
				return false;
			}

			await this.wsBekleyenVerileriGonderIslemiIptal();
			delete app.syncAbortFlag;
			app.timersDisabledFlag = true;
			try {
				let _promise = new $.Deferred(async p2 => {
					try { p2.resolve(await app.wsWaitAll()) }
					catch (ex) { p2.resolve(ex) }
				});
				setTimeout(() => _promise.resolve({ isError: true, rc: 'userAbort' }), 200);
				try { await _promise }
				catch (ex) { }
				
				const _e = {}
				app.wsBekleyenVerileriGonder(_e);
				//app.wsAktifBilgileriYukle(_e).then(() =>
				//	app.wsAktifBilgilerYuklendi(_e));
			}
			catch (ex) { }
			finally {
				await app.setUniqueTimeout({
					key: 'enableTimers',
					delayMS: 3000,
					block: () =>
						app.timersDisabledFlag = false
				});
			}

			const {pratikSatismi} = app.class;		
			let result = await app.tahsilatIstendi(e);
			if (result && result.result !== undefined)
				result = result.result;
			
			if (result === false)
				return result;
			
			if (pratikSatismi || result.kismimi) {
				/*const fis = app.aktifFisOlustur();
				masa.aktifFisID = fis ? fis.id : null;*/
				this.activatePartDevam();
			}
			else {
				// app.aktifMasaKaldir();
				app.showContent({ partClass: SkyCafeMasalarPart });
				/*setTimeout(() => {
					displayMessage(`<b>${bedelStr(result.toplam)} TL</b> satış için Tahsilat yapıldı`)
				}, 1000);*/
			}
			
			return result;
		}

		async barkodOkutuldu(e) {
			const {app, barkodUI, barkodUIInput} = this;
			const {noTextParse} = e;
			let {miktar} = e;
			const item = e.boundItem || e.item;
			const urunKod = item ? item.id || item.kod : e.stokKod || e.urunKod;
			let barkod = e.barkod || urunKod;
			
			app.hideNotifications();

			let result;
			if (barkod) {
				barkod = barkod.trim();
				let ind = barkod.indexOf('x');
				if (ind < 0)
					ind = barkod.indexOf('X');
				if (ind < 0)
					ind = barkod.indexOf('*');
				
				if (ind >= 0) {
					miktar = e.miktar = asFloat(barkod.substring(0, ind)) || null;
					barkod = e.barkod = barkod.substring(ind + 1);
				}

				try {
					const anaTip = app.aktifMasaAnaTip;
					// result = await app.barkodSonucuBul({ tip: anaTip, barkod: barkod });
					result = await app.barkodBilgiBelirle({ tip: anaTip, barkod: barkod });
					if (result) {
						result.miktar = miktar || result.miktar;
						miktar = e.miktar = result.miktar = (this.aktifMiktar || 1) * (miktar || result.miktar || 1);
						await this.ekle({ from: 'barkod', noTextParse: noTextParse, detaymi: true, tip: anaTip, rec: result });
					}
				}
				catch (ex) {
					defFailBlock(ex);
				}
			}

			barkodUIInput.addClass(`flick`);

			if (barkod) {
				const audio = new Audio(`media/ding-ding-sound-effect.mp3`);
				try { await audio.play() }
				catch (ex) { }

				if (result) {
					setTimeout(() => audio.pause(), 200);
					setTimeout(() => barkodUIInput.removeClass(`flick error`) , 100);
				}
				else {
					barkodUIInput.addClass(`error`);
					setTimeout(() => audio.pause(), 1000);
					setTimeout(() => barkodUIInput.removeClass(`flick error`) , 1000);
				}
			}
			else {
				barkodUIInput.addClass(`error`);
				setTimeout(() => barkodUIInput.removeClass(`flick error`) , 50);
			}
			
			this.aktifMiktarReset(e);
			barkodUIInput.val('');
			this.setFocusToDefault(e);
		}

		async ekle(e) {
			let {waitPromise} = this;
			if (waitPromise)
				await waitPromise;
			
			waitPromise = this.waitPromise = new $.Deferred(async p => {
				try { p.resolve(await this.ekleDevam(e)) }
				catch (ex) { p.reject(ex) }
				finally { delete this.waitPromise };
			});
			setTimeout(() => delete this.waitPromise, 1000);
			
			const result = await waitPromise;
			await this.wsBekleyenVerileriGonderIslemiIptal(e);
			this.wsBekleyenVerileriGonderIslemi(e);

			return result;
		}

		async ekleDevam(e) {
			e = e || {};
			await this.gerekirseFisOlustur(e);

			const {app} = this;
			if (!app.zAcikmi) {
				displayMessage(`Z Kapalıdır, işlem yapılamaz`, `@ Z Kapalı @`);
				return false;
			}

			const masa = await app.getAktifMasa();
			if (masa && masa.servisDisimi) {
				displayMessage(`Masa Servis Dışıdır, işlem yapılamaz`, `@ Masa Servis Dışı @`);
				return false;
			}

			const {aktifFis} = app;
			if (!aktifFis)
				return false;

			const aktifMasaID = masa ? masa.id : null;
			if (aktifFis && aktifFis.yazdirildimi && app.garsonmu) {
				displayMessage(`<b>${aktifMasaID}</b> masasına ait Adisyon yazdırıldığı için <u>işlem yapılamaz</u>`, `@ Adisyon Yazdırılmış @`);
				return false;
			}

			const {listePart, detayDuzenlePart} = this;
			const {pratikSatismi} = app.class;
			const {noLog} = e;
			let {fromDuzenleEkraniFlag, urun} = e;
			const {detaylar} = aktifFis;
			
			let {rec, noTextParse} = e;
			if (!rec && urun)
				rec = urun;
			
			if (!rec.detaymi) {
				let {miktar} = e;
				if (!noTextParse) {
					let text = this.barkodUIInput.val();
					if (text) {
						let ind = text.indexOf('x');
						if (ind < 0)
							ind = text.indexOf('X');
						if (ind < 0)
							ind = text.indexOf('*');
						if (ind >= 0) {
							text = text.substring(0, ind);
							miktar = e.miktar = asFloat(text) || null;
						}
					}
				}
				miktar = miktar || this.aktifMiktar || 1;
				if (rec.miktar)
					miktar *= rec.miktar;
				
				const brm = rec.brm || 'AD';
				const fra = app.brm2Fra[brm] || 0;
				miktar = roundToFra(miktar, fra) || 1;
				
				const anaTip = app.aktifMasaAnaTip;
				rec = aktifFis.newDetay({
					tip: anaTip, urun: rec,
					barkod: e.barkod || rec.barkod || '',
					miktar: miktar,
					fiyat: rec.fiyat || null
				});
				if (!rec.promise_detayEkIslemler)
					await rec.detayEkIslemler(e);
			}

			if (!rec.ikrammi && (rec.degiskenFiyatmi || (rec.fiyat && rec.fiyat <= 0.01))) {
				if (rec.fiyat)
					rec.fiyat = 0;
			}
			await rec.brutBedelHesapla(e);
			await rec.netBedelHesapla(e);

			const detayDuzenlePartUpdate = async () => {
				if (!fromDuzenleEkraniFlag && detayDuzenlePart && detayDuzenlePart.wnd && rec) {
					const detay = detayDuzenlePart.aktifDetay;
					if (detay && !detay.silindimi) {
						await this.detayDegisti({ from: 'ui', detay: detayDuzenlePart.detay });
						// await this.listeTazele(e);
					}
					const _e = {
						title: `Satış Düzenle`,
						detay: rec,
						geriCallback: async e => {
							const {detay} = e;
							if (detay && !detay.silindimi) {
								await this.detayDegisti({ detay: detay });
								this.listeTazele(e);
							}
							this.barkodUIInput.val('');
							this.setFocusToDefault(e);
						},
						tamamIslemi: async e => {
							// this.fisDegisti(e);
							// this.listeTazele(e);
							this.barkodUIInput.val('');
							this.setFocusToDefault(e);

							return true;
						}
					};
					detayDuzenlePart.open(_e);
				}
			};

			let {from} = e;
			let eslesenDetay = detaylar.find(_det => (pratikSatismi || !_det.yazdirildimi) && _det.aynimi({ diger: rec }));
			if (eslesenDetay) {
				eslesenDetay.miktar = (eslesenDetay.miktar || 1) + (rec.miktar || 1);
				await eslesenDetay.brutBedelHesapla(e);
				await eslesenDetay.netBedelHesapla(e);
				eslesenDetay.yazdirildimi = eslesenDetay.gonderildimi = false;
				rec = eslesenDetay;

				if (!(noLog || pratikSatismi)) {
					const log = new SkyCafeLog({
						refTable: SkyCafeDetay.table,
						refID: (eslesenDetay || {}).id,
						refID2: aktifFis.id || null,
						islem: 'detayDegistir',
						data: {
							from: from || 'ui',
							aktifMasaID: app.aktifMasaID || null,
							aktifFisID: aktifFis.id || null,
							detay: eslesenDetay.reduce()
						}
					});
					await log.kaydet();
				}

				detayDuzenlePartUpdate();
			}
			else {
				if (!rec.ikrammi && (!rec.fiyat || rec.fiyat <= 0.01)) {
					if (!detayDuzenlePart)
						return false;
					
					const promise = new $.Deferred(p => {
						const _e = {
							title: `Ürün Ekle`,
							detay: rec,
							modal: false,
							events: {
								open: e => {
									setTimeout(e => {
										const {sender, wndContent} = e;
										wndContent.find(`#fiyatTam input`).focus();
										setTimeout(() => {
											displayMessage(
												`Lütfen <b>Ürün Fiyatını</b> giriniz`,
												sender.title);
										}, 50);
									}, 100, e);
								}
							},
							geriCallback: e => {
								// this.detayDegisti({ detay: e.detay });
								// this.listeTazele(e);
								this.barkodUIInput.val('');
								this.setFocusToDefault(e);
								app.hideNotifications();

								const {events} = e.sender;
								if (events)
									delete events.open;
							},
							tamamIslemi: e => {
								p.resolve({ from: 'degiskenFiyat', fromDuzenleEkraniFlag: true, rec: e.detay });
								return true;
							}
						};
						detayDuzenlePart.open(_e);
						this.aktifMiktarReset(e);
					});
					const _e = await promise;
					if (!_e || _e.isError)
						return _e || false;
					
					rec = e.rec = _e.rec;
					from = e.from = _e.from;
					fromDuzenleEkraniFlag = e.fromDuzenleEkraniFlag = _e.fromDuzenleEkraniFlag;
				}

				const brm = rec.brm || 'AD';
				const fra = app.brm2Fra[brm] || 0;
				const orjMiktar = rec.miktar;
				const miktar = roundToFra(rec.miktar, fra) || 1;
				if (miktar != orjMiktar) {
					rec.miktar = miktar;
					if (rec.brutBedelHesapla) {
						await rec.brutBedelHesapla(e);
						await rec.netBedelHesapla(e);
					}
				}
				detaylar.push(rec);

				if (!(noLog || pratikSatismi)) {
					const log = new SkyCafeLog({
						refTable: SkyCafeDetay.table,
						refID: (rec || {}).id,
						refID2: aktifFis.id || null,
						islem: 'detayEkle',
						data: {
							from: from || 'ui',
							aktifMasaID: app.aktifMasaID || null,
							aktifFisID: aktifFis.id || null,
							detay: rec.reduce()
						}
					});
					await log.kaydet();
				}
			}
			
			await this.fisDegisti(e);
			await this.listeTazele();
			detayDuzenlePartUpdate();

			return rec;
		}

		async cikarIstendi(e) {
			e = e || {};
			const {app} = this;
			const {pratikSatismi} = app.class;
			if (!app.zAcikmi) {
				displayMessage(`Z Kapalıdır, işlem yapılamaz`, `@ Z Kapalı @`);
				return false;
			}
			
			await this.gerekirseFisOlustur(e);
			if (pratikSatismi) {
				this.iptalAciklamaSor(e).then(_e =>
					this.cikarDevam($.extend({}, e, { iptalAciklama: _e.value })));
			}
			else {
				this.cikarDevam(e);
			}
		}

		async cikarDevam(e) {
			e = e || {};
			const {app, listePart} = this;
			if (!app.zAcikmi) {
				displayMessage(`Z Kapalıdır, işlem yapılamaz`, `@ Z Kapalı @`);
				return false;
			}
			
			const {aktifFis, aktifMasaID} = app;
			if (aktifFis && aktifFis.yazdirildimi && app.garsonmu) {
				displayMessage(`<b>${aktifMasaID}</b> masasına ait Adisyon yazdırıldığı için <u>işlem yapılamaz</u>`, `@ Adisyon Yazdırılmış @`);
				return false;
			}

			const masa = await app.getAktifMasa();
			if (masa && masa.servisDisimi) {
				displayMessage(`Masa Servis Dışıdır, işlem yapılamaz`, `@ Masa Servis Dışı @`);
				return false;
			}

			const {pratikSatismi} = app.class;
			const {noLog} = e;
			const {itemForm} = listePart.itemListPart;
			let {items} = e;
			if (!items)
				items = itemForm.find(`.item.selected`);
			if (!items.length)
				items = itemForm.find(`.item:last()`);
			
			const removeIndexes = [];
			for (let i = 0; i < items.length; i++) {
				const {boundIndex} = (items.eq(i).data('args') || {});
				removeIndexes.push(boundIndex);
			}
			removeIndexes.sort().reverse();

			const detaylar = aktifFis.detaylar.filter(det => !det.silindimi);
			if (!pratikSatismi && !app.sefmi) {
				for (const i in removeIndexes) {
					const index = removeIndexes[i];
					const det = detaylar[index];
					if (det.yazdirildimi /*&& det.gonderildimi*/) {
						displayMessage(`Bazı satışlar için <u>Mutfak Fişi</u> yazdırılmıştır.<p/>Bu satışları sadece <b>ŞEF KULLANICI</b> silebilir!`, `Satış Silme İşlemi`);
						return false;
					}
				}
			}

			let {waitPromise} = this;
			if (waitPromise)
				await waitPromise;
			
			waitPromise = this.waitPromise = new $.Deferred(async p => {
				try {
					const {iptalAciklama} = e;
					const silinenDetayBilgiler = [];
					for (const i in removeIndexes) {
						const index = removeIndexes[i];
						const det = detaylar[index];
						if (!det)
							continue;
						
						det.silindimi = true;
						if (iptalAciklama)
							det.iptalAciklama = iptalAciklama;

						silinenDetayBilgiler.push({ index: index, detayID: det.id });
						// detaylar.splice(index, 1);
					}
					listePart.tazele();

					if (!$.isEmptyObject(silinenDetayBilgiler)) {
						if (!(noLog || pratikSatismi)) {
							const log = new SkyCafeLog({
								refTable: SkyCafeFis.table,
								refID: aktifFis.id,
								refID2: aktifMasaID || null,
								islem: 'detaylariSil',
								data: {
									aktifMasaID: aktifMasaID || null,
									aktifFisID: aktifFis.id || null,
									iptalAciklama: iptalAciklama || '',
									silinenDetayBilgiler: silinenDetayBilgiler
								}
							});
							await log.kaydet();
						}
					}
					p.resolve(true);

					const fisBosmu = $.isEmptyObject(aktifFis.detaylar.filter(det => !det.silindimi));
					if (!$.isEmptyObject(removeIndexes)) {
						await this.listeTazele();
						await this.fisDegisti(e);
					}
					if (fisBosmu) {
						// await app.setMasaAktifFisID({ id: aktifMasaID, fis: aktifFis, value: null });
						// await app.aktifFisKaldir();
						 await this.fisKaydetIslemi({ fis: aktifFis, masaID: aktifMasaID });
						 await app.iptalDevam({ tx: e.tx, silent: true });
					}
				}
				catch (ex) { p.reject(ex) }
				finally { delete this.waitPromise };
			});
			setTimeout(() => delete this.waitPromise, 500);

			const result = await waitPromise;
			await this.wsBekleyenVerileriGonderIslemiIptal();
			await this.wsBekleyenVerileriGonderIslemi(e);

			return result;
		}

		async iptalAciklamaSor(e) {
			return await this.app.iptalAciklamaSor(e);
		}

		setFocusToDefault(e) {
			const {activeWndPart} = this.app;
			if (!(activeWndPart && activeWndPart.wnd))
				this.barkodUIInput.focus();
		}

		setAktifMiktar(e) {
			const miktar = (typeof e == 'object' ? e.miktar : e) || null;
			delete this.sonAktifMiktar;
			this.aktifMiktar = miktar;
			this.aktifMiktarAtandi(e);
		}

		aktifMiktarReset(e) {
			delete this.aktifMiktar;
			delete this.sonAktifMiktar;
			this.aktifMiktarAtandi(e);
		}

		aktifMiktarAtandi(e) {
			const {miktarKlavyePart, aktifMiktar} = this;
			const wnd = (miktarKlavyePart || {}).wnd;
			if (wnd) {
				const divAktifMiktar = wnd.find(`.jqx-window-header #aktifMiktar`);
				if (divAktifMiktar.length) {
					if (aktifMiktar) {
						divAktifMiktar.html(aktifMiktar);
						divAktifMiktar.parent().removeClass(`jqx-hidden`);
					}
					else {
						divAktifMiktar.parent().addClass(`jqx-hidden`);
					}
				}
			}

			this.updateUI(e);
		}

		async barkodUI_loadServerData(e) {
			const {app} = this;
			const {id2Urun} = app;
			const {wsArgs} = e;
			const dbMgr = app.dbMgr_mf;
			
			const tip = app.aktifMasaAnaTip;
			const fiyatAttr = SkyCafeUrun.tip2FiyatAttr[tip];

			let searchText = ((wsArgs || {}).searchText || '');
			searchText = searchText.trim ? searchText.trim().toLocaleUpperCase() : null;
			let parts = searchText ? searchText.split(' ') : [];

			let sent = new MQSent({
				from: `mst_Stok mst`,
				where: [`mst.kod <> ''`],
				sahalar: [`mst.rowid`, `mst.*`]
			});
			if (fiyatAttr)
				sent.where.add(`mst.${fiyatAttr} > 0`);
			if (!$.isEmptyObject(parts)) {
				for (const i in parts) {
					const part = parts[i];
					if (!part)
						continue;
					sent.where.add(new MQOrClause([
						{ degerAta: part, saha: `mst.kod` },
						{ like: `${part}%`, saha: `mst.ilkTartiKod` },
						{ like: `%${part}%`, saha: `mst.aciklama` },
						{ like: `%${part.toLowerCase()}%`, saha: `LOWER(mst.aciklama)` },
						{ like: `%${part.toLocaleLowerCase(culture)}%`, saha: `LOWER(mst.aciklama)` }
					]));
				}
			}
			let stm = new MQStm({
				sent: sent,
				orderBy: [`mst.aciklama`],
				limit: wsArgs.maxRow || null
			});
			const rs = await dbMgr.executeSql({ query: stm });
			const result = [];
			for (let i = 0; i < rs.rows.length; i++) {
				const rec = rs.rows[i];
				const {kod} = rec;
				if (!id2Urun[kod]) {
					const inst = id2Urun[kod] = new SkyCafeUrun(rec);
					await inst.setValues({ rec: rec });		// .. diger atamalar async olarak yapılsın ..
				}
				if (fiyatAttr && rec[fiyatAttr] <= 0)
					continue;
				result.push(rec);
			}

			return result;
		}

		kategoriFormOrtak_headerClicked(e) {
			const {kategoriResponsiveWidget} = this;
			if (kategoriResponsiveWidget.isOpened())
				kategoriResponsiveWidget.close();
			else
				kategoriResponsiveWidget.open();
		}

		kategoriResponsiveForm_opened(e) {
			const {app, btnToggleResponsivePanel_kategoriOrtak, kategoriDetayParent, aktifUstKategoriID, divAktifUstKategoriText, aktifKategoriID, divAktifKategoriText} = this;
			btnToggleResponsivePanel_kategoriOrtak.addClass(`collapsed`);
			kategoriDetayParent.addClass(`collapsed`);

			if (aktifUstKategoriID != null) {
				divAktifUstKategoriText.html((app.id2UstKategori[aktifUstKategoriID] || {}).aciklama || this.ustKategoriParent.find(`#0.item`).html());
				divAktifUstKategoriText.removeClass(`jqx-hidden`);
			}
			else {
				divAktifUstKategoriText.addClass(`jqx-hidden`);
			}

			if (aktifKategoriID != null) {
				divAktifKategoriText.html((app.id2Kategori[aktifKategoriID] || {}).aciklama);
				divAktifKategoriText.removeClass(`jqx-hidden`);
			}
			else {
				divAktifKategoriText.addClass(`jqx-hidden`);
			}

			this.kategoriFormOrtak_header.removeClass(`jqx-hidden`);
			this.kategoriFormOrtak_content.addClass(`jqx-hidden`);
			this.kategoriForm_ust.addClass(`jqx-hidden`);
			this.kategoriForm_alt.addClass(`full`);
			this.onResize(e);
		}

		kategoriResponsiveForm_closed(e) {
			this.onResize(e);

			const {app, btnToggleResponsivePanel_kategoriOrtak, kategoriDetayParent, aktifUstKategoriID, divAktifUstKategoriText, aktifKategoriID, divAktifKategoriText} = this;
			btnToggleResponsivePanel_kategoriOrtak.removeClass(`collapsed`);
			kategoriDetayParent.removeClass(`collapsed`);

			if (aktifUstKategoriID) {
				divAktifUstKategoriText.html((app.id2UstKategori[aktifUstKategoriID] || {}).aciklama);
				divAktifUstKategoriText.removeClass(`jqx-hidden`);
			}
			else {
				divAktifUstKategoriText.addClass(`jqx-hidden`);
			}

			if (aktifKategoriID) {
				divAktifKategoriText.html((app.id2Kategori[aktifKategoriID] || {}).aciklama);
				divAktifKategoriText.removeClass(`jqx-hidden`);
			}
			else {
				divAktifKategoriText.addClass(`jqx-hidden`);
			}

			this.kategoriFormOrtak_header.addClass(`jqx-hidden`);
			this.kategoriFormOrtak_content.removeClass(`jqx-hidden`);
			this.kategoriForm_ust.removeClass(`jqx-hidden`);
			this.kategoriForm_alt.removeClass(`full`);
			this.onResize(e);
		}

		barkodUIInput_onFocus(e) {
			setTimeout(() => {
				const {barkodUI, barkodUIInput} = this;
				const widget = barkodUI.jqxComboBox('getInstance');
				const isOpen = widget.isOpened();
				let hasFocus = document.activeElement == barkodUIInput[0];
				if (!isOpen)
					barkodUIInput.select();
			}, 100);
		}

		async barkodUIInput_onClick(e) {
			const {app, barkodUIInput} = this;
			const {klavyePart} = app;
			if (!(klavyePart && klavyePart.wnd)) {
				const _e = {
					/*width: $(window).width() < 680 ? 650 : $(window).width(),
					height: 250,*/
					position: `bottom`
				};
				await this.app.initKlavyePart(_e);
				setTimeout(() => barkodUIInput.focus(), 150);
			}
			else {
				setTimeout(() => barkodUIInput.focus(), 0);
			}
		}

		barkodUIInput_onDblClick(e) {
			const {barkodUI, barkodUIInput} = this;
			const widget = barkodUI.jqxComboBox('getInstance');
			const isOpen = widget.isOpened();
			let hasFocus = document.activeElement == barkodUIInput[0];
			//if (hasFocus)
			//	hasFocus = this.barkodUI_triggerFocusFlag = !this.barkodUI_triggerFocusFlag;
			
			if (hasFocus && !isOpen) {
				widget.open();
			}
			else {
				if (isOpen)
					widget.close();
				barkodUIInput.select();
			}
		}

		barkodUI_onOpen(e) {
			setTimeout(() => {
				const {app, barkodUI} = this;
				const listBox = barkodUI.jqxComboBox('getInstance').listBox;
				listBox.element.classList
					.add(...[this.partName, app.appName, app.rootAppName, `part`, `barkodUI`]);
				if (listBox) {
					listBox.beginUpdate();
					listBox.touchMode = true;
					listBox.endUpdate();
					// listBox.refresh();
				}
			}, 200);
		}

		barkodUI_onClose(e) {
		}

		updateUI(e) {
		}

		async getNavMenuSource(e) {
			const {app} = this;
			const {pratikSatismi} = app.class;
			const {zAcikmi, sefmi, garsonmu, aktifFis} = app;
			const aktifMasa = await app.getAktifMasa();
			const aktifMasaID = aktifMasa ? aktifMasa.id : null;
			const masaServisDisimi = aktifMasa && aktifMasa.servisDisimi;
			const adisyonYazdirildimi = aktifFis && aktifFis.yazdirildimi;
			const garsonIseAdisyonYazdirildimi = adisyonYazdirildimi && app.garsonmu;

			const liste = [
				{ id: 'tamam', html: 'TAMAM' }
			];
			if (zAcikmi && !masaServisDisimi) {
				if (!garsonmu) {
					liste.push(...[
						{ id: 'nakit', html: 'NAKİT' },
						{ id: 'pos', html: 'POS' },
						{ id: 'yemekCeki', html: 'YEMEK ÇEKİ' },
						{ id: 'karmaTahsilat', html: 'KARMA TAHSİLAT' }
					]);
					if (!pratikSatismi)
						liste.push({ id: 'kismiTahsilat', html: 'KISMİ TAHSİLAT' });
				}
				liste.push({ id: 'fisAciklama', html: `AÇIKLAMA` });
				if (!pratikSatismi) {
					if (!garsonIseAdisyonYazdirildimi) {
						liste.push({ id: 'masaTransfer', html: 'MASA TRF.' });
						if (sefmi)
							liste.push({ id: 'servisDisi', html: 'SERVIS DIŞI YAP' });
						liste.push({ id: 'yazdir', html: `${pratikSatismi ? 'FİŞ' : 'ADİSYON'} YAZDIR` });
					}
				}
				if (!pratikSatismi && !garsonmu) {
					const rezervemi = aktifMasa && aktifMasa.rezervemi;
					liste.push({ id: 'rezervasyon', html: rezervemi ? `REZERVE KALDIR` : `REZERVE YAP` });
				}
				if (!garsonIseAdisyonYazdirildimi)
					liste.push({ id: 'iptal', html: '<span class="red">İPTAL</span>' });
			}

			return liste;
		}

		navMenuTiklandi(e) {
			const {app} = this;
			const {sender, navMenuItems} = e;
			const evt = e.event;
			const target = evt ? $(evt.args || evt.currentTarget) : (id ? navMenuItems.filter(`li#${id}`) : null);
			const id = e.id || (target ? target.prop('id') : null);

			switch (id) {
				case 'tamam':
					this.tamamIstendi(e);
					break;
				case 'iptal':
					this.iptalIstendi(e);
					break;
				case 'nakit':
					this.nakitIstendi(e);
					break;
				case 'pos':
					this.posIstendi(e);
					break;
				case 'yemekCeki':
					this.yemekCekiIstendi(e);
					break;
				case 'karmaTahsilat':
					this.karmaTahsilatIstendi(e);
					break;
				case 'kismiTahsilat':
					this.kismiTahsilatIstendi(e);
					break;
				case 'rezervasyon':
					this.rezervasyonIstendi(e);
					break;
				case 'fisAciklama':
					this.fisAciklamaIstendi(e);
					break;
				case 'masaTransfer':
					this.masaTransferIstendi(e);
					break;
				case 'servisDisi':
					this.servisDisiIstendi(e);
					break;
				case 'yazdir':
					this.yazdirIstendi(e);
					break;
				
			}
		}

		async onResize(e) {
			await super.onResize(e);

			const {layout, innerContent, barkodUI, listePart, kategoriParent, kategoriDetayParent, miktarKlavyePart, sagForm} = this;
			if (listePart) {
				const {listeParent, btnCikarParent} = this;
				// btnCikarParent.addClass(`basic-hidden`);
				await listePart.onResize(e);
				setTimeout(() => {
					btnCikarParent.css('left', `${listeParent.offset().left + listeParent.width() - btnCikarParent.width() - 4}px`);
					// setTimeout(() => btnCikarParent.removeClass(`basic-hidden`), 100);
				}, 100);
			}

			if (barkodUI) {
				const barkodUIWidget = barkodUI.jqxComboBox('getInstance');
				if (barkodUIWidget) {
					barkodUIWidget.resize();
					barkodUI.jqxComboBox('dropDownWidth', barkodUI.width());
				}
			}

			// const sagFormWidth = this.sagForm.width();
			let targets;
			/*targets = [this.ustKategoriParent, this.kategoriParent, this.kategoriDetayParent];
			for (const i in targets) {
				const target = targets[i];
				target.width(layout.width() - sagFormWidth - 2);
			}*/
			targets = [innerContent];
			for (const i in targets) {
				const target = targets[i];
				target.height($(window).height() - target.offset().top);
			}
			targets = [kategoriParent, kategoriDetayParent];
			for (const i in targets) {
				const target = targets[i];
				target.height($(window).height() - target.offset().top - 12);
			}

			sagForm.width($(window).width() - sagForm.offset().left);
			
			/*const miktarKlavyeWnd = miktarKlavyePart ? miktarKlavyePart.wnd : null;
			if (miktarKlavyeWnd) {
				const {wndContent} = miktarKlavyePart;
				miktarKlavyeWnd.jqxWindow('position', {
					x: $(window).width() - wndContent.width() - 8,
					y: $(window).height() - wndContent.height() - 40
				})
			}*/
		}
	}
})()
