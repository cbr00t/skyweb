(function() {
	window.CETFisGirisPart = class extends window.CETListeOrtakPart {
		static get partName() { return 'cetFisGiris' }
		static get canDefer_slow() { return true }
		get fisGirisEkranimi() { return true }
		get adimText() {
			const {fis} = this;
			let prefix = '';
			const {ayrimTipAdi} = fis;
			if (ayrimTipAdi)
				prefix += `<span style="margin-right: 8px;"><u>${ayrimTipAdi}</u></span>`
			return `<div class="fisTipText">${prefix}${fis.class.aciklama}</div>`
		}
		get yeniKayitmi() { const islem = this.islem; return islem == 'yeni' || islem == 'kopya' }

		constructor(e) {
			e = e || {}; super(e); const {app} = this, param = app.param.deepCopy(), {fis} = e;
			$.extend(this, {
				islem: e.islem || 'yeni', param: param,
				eskiFis: e.eskiFis, fis: fis,
				kaydetOncesi: e.kaydetOncesi, kaydetIslemi: e.kaydetIslemi, kaydedince: e.kaydedince,
				degistimi: false, satisKosulYapilari: e.satisKosulYapilari, promosyonYapilari: e.promosyonYapilari,
				idSaha: '', ayrisimAyiracli_barkod2Detay: {}
			});
			this.sonStokKontrolEdilirmi = app.sonStokKontrolEdilirmi && fis.class.sonStokKontrolEdilirmi;
			if (!(this.layout || this.template))
				this.template = app.templates.fisGiris
		}
		async activatePart(e) {
			await super.activatePart(e);
			setTimeout(() => {
				const {barcodeReader} = this;
				if (this._barcodeReaderRunningFlag) {
					delete this._barcodeReaderRunningFlag;
					this.barkodIstendi(e)
				}
				const {btnToggleFullScreen, chkOtoAktar, btnGonderimIsaretSifirla, btnLogout} = sky.app;
				if (btnToggleFullScreen && btnToggleFullScreen.length)
					btnToggleFullScreen.addClass('jqx-hidden')
				if (chkOtoAktar && chkOtoAktar.length)
					chkOtoAktar.addClass('jqx-hidden')
				if (btnGonderimIsaretSifirla && btnGonderimIsaretSifirla.length)
					btnGonderimIsaretSifirla.addClass('jqx-hidden')
				if (btnLogout && btnLogout.length)
					btnLogout.addClass('jqx-hidden')
			}, 150)
		}
		async deactivatePart(e) {
			/*const {btnToggleFullScreen, chkOtoAktar, btnGonderimIsaretSifirla, btnLogout} = sky.app;
			setTimeout(() => {
				if (btnToggleFullScreen && btnToggleFullScreen.length)
					btnToggleFullScreen.removeClass('jqx-hidden')
				 if (chkOtoAktar && chkOtoAktar.length)
					chkOtoAktar.removeClass('jqx-hidden')
				 if (btnGonderimIsaretSifirla && btnGonderimIsaretSifirla.length)
					btnGonderimIsaretSifirla.removeClass('jqx-hidden')
				 if (btnLogout && btnLogout.length)
					 btnLogout.removeClass('jqx-hidden')
			}, 100);*/
			await super.deactivatePart(e)
		}
		async destroyPart(e) {
			e = e || {}; const layout = e.layout || this.layout;
			if (this.barcodeReader) {
				this.barcodeReader.destroy();
				delete this.barcodeReader
			}
			const {btnKaydet} = this;
			if (btnKaydet) {
				btnKaydet.detach()
					.appendTo(layout);
			}
			
			let {rbkGirisPart} = this;
			if (rbkGirisPart) {
				if (!rbkGirisPart.isDestroyed)
					await rbkGirisPart.destroyPart();
				rbkGirisPart = this.rbkGirisPart = null;
			}

			const {btnToggleFullScreen, chkOtoAktar, btnGonderimIsaretSifirla, btnLogout} = sky.app;
			setTimeout(() => {
				if (btnToggleFullScreen && btnToggleFullScreen.length)
					btnToggleFullScreen.removeClass('jqx-hidden')
				if (chkOtoAktar && chkOtoAktar.length)
					chkOtoAktar.removeClass('jqx-hidden')
				if (btnGonderimIsaretSifirla && btnGonderimIsaretSifirla.length)
					btnGonderimIsaretSifirla.removeClass('jqx-hidden')
				if (btnLogout && btnLogout.length)
					btnLogout.removeClass('jqx-hidden')
			}, 100);
			
			return await super.destroyPart(e)
		}

		async preInitLayout(e) {
			e = e || {};
			await super.preInitLayout(e);
			const layout = e.layout || this.layout;
			this.dipTable = layout.find('#dipTable');
			this.templates = $.extend(this.templates || {}, {
				hizliStokItem: layout.find('template#hizliStokItem'),
				fisBaslik: layout.find('template#templates_fisBaslik'),
				paketBozEkrani: layout.find('template#paketBozEkrani')
			});

			const {app, param} = this;
			let {fis} = this;
			if (!this.eskiFis) {
				this.eskiFis = fis;
				fis = this.fis = fis.deepCopy();
			}
			/*const num = fis.numarator;
			if (!this.yeniKayitmi && num && !fis.fisNo)
				$.extend(fis, { seri: num.seri, fisNo: num.sonNo + 1 });*/
			let {numaratorTip} = fis;
			const {ozelIsaret} = fis;
			if (ozelIsaret)
				numaratorTip += `-${ozelIsaret}`

			const num = fis.numarator;
			if (num && numaratorTip && (fis.gecicimi || this.yeniKayitmi)) {
				const numEFatmi = num.eFatmi;
				const fisTip2SonSeri = param.fisTip2SonSeri || {};
				const _seri = numEFatmi ? num.seri : fis.seri /*|| fisTip2SonSeri[numaratorTip]*/;
				let seriDegistimi = false;
				if (_seri && num.seri != _seri) {
					num.seri = _seri;
					seriDegistimi = true;
					delete num.promise;
				}
				num.seri = num.seri || '';
				fis.seri = num.seri;
				if (seriDegistimi)
					await num.yukle();
				if (!numEFatmi && _seri == null /*&& fis.seri != fisTip2SonSeri[numaratorTip]*/) {
					fisTip2SonSeri[numaratorTip] = fis.seri;
					this.paramDegistimi = true
				}
			}
			this.bedelKullanilirmi = fis.class.bedelKullanilirmi;
			this.fiyatGorurmu = fis && !fis.class.fiiliCikismi ? app.alimFiyatGorurmu : app.satisFiyatGorurmu
		}
		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);
			const layout = e.layout || this.layout;
			const {app, fis} = this;
			// const islemYenimi = this.islem == `yeni`;
			
			let promiseMusteriDegisti = this.musteriDegisti($.extend({}, e, { initFlag: true }));
			/*let promiseIlkHesap = new Promise(resolve => {
				setTimeout(async () => {
					await promiseMusteriDegisti;
					// resolve(await this.satirlariYenidenHesapla(e));
					resolve(true);
				}, 500);
			});*/

			const {fisGirisSadeceBarkodZorunlumu} = app;
			const userSettings = this.param.userSettings || {};
			$.extend(this, {
				kaydederkenYazdirFlag: userSettings.kaydederkenYazdir,
				kaydederkenAktarFlag: userSettings.kaydederkenAktar,
				otoBirlestirFlag: userSettings.otoBirlestirFlag,
				lockedFlag: userSettings.lockedFlag,
				hizliBarkodFlag: userSettings.hizliBarkodFlag
			});
			const {islemTuslari} = this;
			const chkKaydederkenYazdir = this.chkKaydederkenYazdir = islemTuslari.find('#chkKaydederkenYazdir')
				.jqxToggleButton({ theme: theme, toggled: asBool(this.kaydederkenYazdirFlag) });
			chkKaydederkenYazdir.jqxTooltip({ theme: theme, trigger: `hover`, position: `bottom`, content: `Belge kaydedildikten sonra otomatik olarak <b>Yazıcıya Gönder</b>` });
			// chkKaydederkenYazdir.off('click');
			chkKaydederkenYazdir.on('click', evt => {
				this.kaydederkenYazdirFlag = userSettings.kaydederkenYazdir = chkKaydederkenYazdir.jqxToggleButton('toggled');
				this.paramDegistimi = true;
			});
			const chkKaydederkenAktar = this.chkKaydederkenAktar = islemTuslari.find('#chkKaydederkenAktar')
				.jqxToggleButton({ theme: theme, toggled: asBool(this.kaydederkenAktarFlag) });
			chkKaydederkenAktar.jqxTooltip({ theme: theme, trigger: `hover`, position: `bottom`, content: `Belge kaydedildikten sonra otomatik olarak Belgeyi <b>Merkeze Gönder</b>` });
			// chkKaydederkenAktar.off('click');
			chkKaydederkenAktar.on('click', evt => {
				this.kaydederkenAktarFlag = userSettings.kaydederkenAktar = chkKaydederkenAktar.jqxToggleButton('toggled');
				this.paramDegistimi = true;
			});
			const chkOtoBirlestir = this.chkOtoBirlestir = islemTuslari.find('#chkOtoBirlestir')
				.jqxToggleButton({ theme: theme, toggled: asBool(this.otoBirlestirFlag) });
			chkOtoBirlestir.jqxTooltip({ theme: theme, trigger: `hover`, position: `bottom`, content: `Belge kaydetme öncesi olarak <u>AYNI ÖZELLİKTE olan</u> kalemleri <b>birleştir</b>` });
			// chkOtoBirlestir.off('click');
			chkOtoBirlestir.on('click', evt => {
				this.otoBirlestirFlag = userSettings.otoBirlestirFlag = chkOtoBirlestir.jqxToggleButton('toggled');
				this.paramDegistimi = true;
			});
			const chkHizliBarkod = this.chkHizliBarkod = islemTuslari.find('#chkHizliBarkod')
				.jqxToggleButton({ theme: theme, toggled: asBool(this.hizliBarkodFlag) });
			chkHizliBarkod.jqxTooltip({ theme: theme, trigger: `hover`, position: `bottom`, content: `Toplu Barkod Giriş modu` });
			chkHizliBarkod.on('click', evt => {
				const flag = this.hizliBarkodFlag = userSettings.hizliBarkodFlag = chkHizliBarkod.jqxToggleButton('toggled');
				this.paramDegistimi = true;
				this.hizliBarkod_durumDegisti($.extend({}, e, { event: evt }))
			});
			
			const chkKilitle = this.chkKilitle = islemTuslari.find('#chkKilitle')
				.jqxToggleButton({ theme: theme, toggled: asBool(this.lockedFlag) });
			chkKilitle.jqxTooltip({ theme: theme, trigger: `hover`, position: `bottom`, content: `Barkodlu Ürün Giriş kutusuna sabitler` });
			// chkOtoBirlestir.off('click');
			const chkKilitle_onToggle = e => {
				const {app, lockedFlag, layout, ortakIslemTuslariPart} = this;
				layout[lockedFlag ? 'addClass' : 'removeClass'](`locked`);
				if (ortakIslemTuslariPart && !ortakIslemTuslariPart.isDestroyed && ortakIslemTuslariPart.layout)
					ortakIslemTuslariPart.layout[lockedFlag ? 'addClass' : 'removeClass'](`locked`);
				app.islemTuslari[lockedFlag ? 'addClass' : 'removeClass'](`locked`);
			};
			/*if (app.fisGirisSadeceBarkodZorunlumu) {
				setButonEnabled(chkKilitle, false);
			}
			else {*/
			chkKilitle.on('click', evt => {
				const lockedFlag = this.lockedFlag = userSettings.lockedFlag = chkKilitle.jqxToggleButton('toggled');
				this.paramDegistimi = true;
				chkKilitle_onToggle({ event: evt });
				if (lockedFlag)
					this.focusToDefault()
			});
			if (!(this.prefetch || this.isPrefetch))
				chkKilitle_onToggle()

			let _e = { content: layout };
			await this.initBaslikPanel(_e);
			await this.initDetayPanel(_e);
			await this.initDipPanel(_e);
			// await this.initIslemTuslari(e);

			setTimeout(() => this.focusToDefault(), 700);
			// setTimeout(() => layout.find('#fisNo input').focus(), 200);
			this.degistimi = false;

			/*if (promiseIlkHesap)
				promiseIlkHesap.then(() => this.tazele());*/

			setTimeout(() => {
				// this.onResize(e);
				this.liste_hideFilterBar();
				hideProgress();
				this.degistimi = false;
				this.focusToDefault();
			}, 1500)
		}
		async initMustBilgi(e) {
			e = e || {};
			const layout = this.layout;
			if (!(layout && layout.length))
				return
			const {app} = this;
			const {bakiyeRiskGosterilmezmi, musteriRotaZorunlumu, konumTakibiYapilirmi, musteriDegistirilirmi} = app;
			const dbMgr = app.dbMgrs.rom_data;
			const divMustBilgi = layout.find(`#mustBilgi`);
			const {fis} = this;
			if (!fis.class.musteriKullanilirmi) {
				divMustBilgi.addClass('jqx-hidden');
				return;
			}
			
			let mustKod = fis.mustKod || '';
			if (mustKod) {
				let stm;
				let rec = fis.getCariEkBilgi ? await fis.getCariEkBilgi(e) : null;
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
					.html(new CKodVeAdi({ kod: mustKod, aciklama: unvan || '' }).parantezliOzet({ styled: true }));
				rec = null;
				
				const riskCariKod = await fis.getRiskCariKod(e);
				if (riskCariKod) {
					stm = new MQStm({
						sent: new MQSent({
							from: `mst_Cari`,
							where: [{ degerAta: riskCariKod, saha: 'kod' }],
							sahalar: [`bakiye`, `riskLimiti`, `riskli`, 'takipBorcLimiti', 'takipBorc']
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

				const btnDegistir = divMustBilgi.find(`#btnDegistir`);
				if (btnDegistir.length) {
					btnDegistir.jqxButton({ theme: theme });
					btnDegistir.off('click');
					if (!musteriDegistirilirmi || musteriRotaZorunlumu || konumTakibiYapilirmi) {
						btnDegistir.addClass('jqx-hidden');
					}
					else {
						btnDegistir.on('click', async evt => {
							const result = await CETCariListePart.run({
								parentPart: this,
								targetRec: mustKod,
								secince: _e => setTimeout(async e => {
									const {fis} = this;
									mustKod = e.rec.kod; if (mustKod == fis.mustKod) return
									fis.mustKod = mustKod; fis.cacheReset();
									for (const key of ['satisKosulYapilari', 'promosyonYapilari']) delete this[key]
									await this.musteriDegisti(e); this.satirlariYenidenHesapla(e)
								}, 10, $.extend({}, e, _e))
							});
							/*let part = (result || {}).part;
							if (part) {
								setTimeout(() => {
									part.selectRec({ key: this.fis.mustKod });
								}, $.isEmptyObject(part.listeRecs) ? 400 : 50);
							}*/
						});
						divMustBilgi.removeClass('jqx-hidden')
					}
				}
			}
			else {
				divMustBilgi.addClass('jqx-hidden')
			}
		}
		async musteriDegisti(e) {
			const {app, fis} = this, {mustKod} = fis; let {sonMustKod} = this;			
			/*if (mustKod == sonMustKod) return;*/
			if (!(e.initFlag && (this.satisKosulYapilari && this.promosyonYapilari))) {
				const mustKod2KosulProYapilari = app.mustKod2KosulProYapilari = app.mustKod2KosulProYapilari || {};
				let kosulProYapilari = mustKod2KosulProYapilari[mustKod] = /*mustKod2KosulProYapilari[mustKod] ||*/ {
					satisKosulYapilari: await fis.getSatisKosulYapilari(),
					promosyonYapilari: await fis.getPromosyonYapilari()
				};
				$.extend(this, kosulProYapilari);
			}

			if (sonMustKod && mustKod && sonMustKod != mustKod) fis.sevkAdresReset()
			sonMustKod = this.sonMustKod = mustKod;
			return this.initMustBilgi(e)
		}
		async initBaslikPanel(e) {
			const {fis} = this;
			const {ozelIsaret} = fis;
			const num = fis.numarator;
			
			let numaratorTip = fis.numaratorTip;
			if (ozelIsaret)
				numaratorTip += `-${ozelIsaret}`;

			const {content} = e;
			//const baslik_panel = this.baslik_panel = content.find('.baslik_panel');
			const subContent = this.baslik_content = content.find('.baslik .header');
			const navBar = this.baslik_navBar = content.find('.baslik .navBar');
			navBar.jqxNavigationBar({
				theme: theme, animationType: animationType, expandMode: 'toggle',
				width: false, toggleMode: 'none',
				expandAnimationDuration: 50, collapseAnimationDuration: 50,
				// expandedIndexes: fis.aciklama ? [0] : []
				expandedIndexes: [0]
				/*initContent: (index) => {
					if (index == 0) {
						// panel.jqxPanel({ theme: theme, height: panel.parent().height() });
						// panel.jqxPanel('hScrollBar').hide();
						this.initBaslikPanelDevam(e);
					}
				}*/
				// expandedIndexes: [0]
			});
			const navBarArrowClickHandler = evt => {
				let widget = navBar.jqxNavigationBar('getInstance');
				const index = 0;
				if ($.inArray(index, widget.expandedIndexes) != -1)
					widget.collapseAt(index)
				else
					widget.expandAt(index)
				
				const timeouts = [20, 50, 100, 200];
				for (const i in timeouts)
					setTimeout(() => this.onResize(e), timeouts[i])
			};
			navBar.find('.jqx-expander-arrow')
				.off('click, touchend, mouseup')
				.on('click, touchend, mouseup', evt => navBarArrowClickHandler(evt));
			subContent.find(`.jqx-expander-header-content`)
				.off('click, mouseup, touchend')
				.on('click, mouseup, touchend', evt => {
					const {target} = evt;
					const tagName = target.tagName.toUpperCase();
					if (!(tagName == 'INPUT' || tagName == 'TEXTAREA' || tagName == 'BUTTON' || target.classList.contains(`jqx-input-icon`)))
						navBarArrowClickHandler(evt);
				});
			navBar.on('expandedItem', evt =>
				this.onResize(e));
			navBar.on('collapsedItem', evt =>
				this.onResize(e));
			
			let txtFisSeri = subContent.find('#fisSeri')
				.jqxInput({ theme: theme, width: 60, height: false, maxLength: 3 });
			txtFisSeri = this.txtFisSeri = subContent.find('#fisSeri');
			txtFisSeri.val(fis.seri || '');
			txtFisSeri.on('change', evt => {
				let target = evt.args || evt.target;
				const seri = (target.value || '').toUpperCase();
				evt.target.value = seri;

				if (numaratorTip && (fis.gecicimi || this.yeniKayitmi)) {
					const param = this.param;
					const fisTip2SonSeri = param.fisTip2SonSeri = param.fisTip2SonSeri || {};
					if (fisTip2SonSeri[numaratorTip] != seri) {
						fisTip2SonSeri[numaratorTip] = seri;
						this.paramDegistimi = true;
					}
				}

				this.fis.seri = seri;
			});

			let txtFisNo = subContent.find('#fisNo')
				.attr('maxLength', 9)
				.jqxNumberInput({
					theme: theme, width: 150, inputMode: 'simple',
					min: 0, max: 999999999, decimalDigits: 0,
					spinButtons: true, spinButtonsWidth: 32,
					decimal: asInteger(fis.fisNo) || null
				});
			txtFisNo = this.txtFisNo = subContent.find('#fisNo');
			txtFisNo.on('change', evt => {
				let target = evt.args || evt.target;
				this.fis.fisNo = asInteger(target.value);
			});
			
			let fisSeriNoDegisti = async evt => {
				if (num && (fis.gecicimi || this.yeniKayitmi)) {
					num.seri = txtFisSeri.val() || '';
					delete num.promise;
					await num.yukle();
					txtFisNo.jqxNumberInput('placeHolder', num.sonNo + 1);

					this.app.setUniqueTimeout({
						key: `fisSeriNoDegisti_fisNoVal_fix`, delayMS: 500,
						args: { txtFisNo: txtFisNo },
						block: e => {
							let val = txtFisNo.val();
							if (!val && val != null)
								txtFisNo.val(val = null);
						}
					});
				}
			}
			subContent.find(`#fisSeri, #fisNo input`)
				.on('change', evt => fisSeriNoDegisti(evt));
			subContent.find('#fisNo .jqx-action-button')
				.on('click, touchend', evt => fisSeriNoDegisti(evt));
			
			if (fis.numarator && (fis.gecicimi || this.yeniKayitmi)) {
				(async () => {
					await num.promise;
					txtFisNo.jqxNumberInput('placeHolder', fis.numarator.sonNo + 1);
				})();
			}

			const detContent = content.find(`.baslik .content`);
			const ci = Date.CultureInfo;
			let txtTarih = this.txtTarih = detContent.find('#tarih');
			txtTarih.datepicker({
				changeMonth: true, changeYear: true, theme: theme,
				constrainInput: false, showButtonPanel: true,
				/* showOn: 'button', */ buttonText: 'Tarih Seç',
				buttonImage: 'lib/calendar.gif', buttonImageOnly: true,
				dateFormat: /*ci.shortDate*/ 'dd.mm.yy', firstDay: ci.firstDayOfWeek,
				weekHeader: 'Hft.', showWeek: true,
				currentText: 'BUGÜN', closeText: 'KAPAT',
				dayNames: ci.dayNames, dayNamesShort: ci.abbreviatedDayNames, dayNamesMin: ci.shortestDayNames,
				monthNames: ci.monthNames, monthNamesShort: ci.abbreviatedMonthNames
			});
			txtTarih.val(dateToString(fis.tarih));
			txtTarih.datepicker($.datepicker.regional['tr']);
			txtTarih.on('change', async evt => {
				const input = $(evt.target);
				let value = input.val();
				if (value && !isInvalidDate(value)) {
					input.data('savedVal', value);
					const eskiTarih = asDate(fis.tarih);
					const tarih = asDate(value);
					fis.tarih = tarih;
					if (eskiTarih != tarih) {
						await fis.cacheReset();
						['satisKosulYapilari', 'promosyonYapilari'].forEach(key =>
							delete this[key]);
						await this.musteriDegisti(e);
						// this.satirlariYenidenHesapla(e);
					}
				}
			});
			txtTarih.on('focusin', evt =>
				evt.target.select());
			txtTarih.on('focusout', async evt => {
				let input = $(evt.target);
				let ch = input.val();
				let value = tarihDegerDuzenlenmis(ch, () => input.data('savedVal'));
				if (value) {
					evt.preventDefault();
					input.val(value || '');

					const eskiTarih = asDate(fis.tarih);
					const tarih = asDate(value);
					fis.tarih = tarih;
					if (eskiTarih != tarih) {
						await fis.cacheReset();
						['satisKosulYapilari', 'promosyonYapilari'].forEach(key =>
							delete this[key]);
						await this.musteriDegisti(e)
						// this.satirlariYenidenHesapla(e)
					}
				}
			});

			const divOzelIsaretIndicator = content.find(`#ozelIsaretIndicator`);
			if (ozelIsaret) {
				let cssClassName;
				switch (ozelIsaret) {
					case '*': cssClassName = `yildiz`; break;
					case 'X': cssClassName = `X`; break;
				}
				if (cssClassName) {
					divOzelIsaretIndicator.addClass(cssClassName);
					[subContent, content].forEach(elm =>
						elm.addClass(`ozelIsaret-${cssClassName}`));
				}
				divOzelIsaretIndicator.html(ozelIsaret);
				divOzelIsaretIndicator.removeClass('jqx-hidden')
			}

			detContent.find('#notlar')
				.val(fis.aciklama || '')
				.on('change', evt => {
					let target = evt.args || evt.target;
					this.fis.aciklama = (target.value || '')
				});

			const divFisBaslik = this.divFisBaslik = detContent.find(`.fisBaslik`);
			divFisBaslik.addClass(`basic-hidden`);
			setTimeout(async () => {
				await this.initFisBaslikUI(e);
				const baslikContentLayout = e.baslikContentLayout;
				const baslikBilgisiVarmi = baslikContentLayout && baslikContentLayout.length &&
												baslikContentLayout.find(`.parent:not(.jqx-hidden)`).length;
				if (!fis.aciklama)
						this.baslik_navBar.jqxNavigationBar('collapseAt', 0)
				/* if (fis.aciklama)
					this.baslik_navBar.jqxNavigationBar('expandAt', 0) */
				
				if (baslikBilgisiVarmi)
					setTimeout(() => divFisBaslik.removeClass(`basic-hidden`), 500)
				else
					divFisBaslik.removeClass(`basic-hidden`)
				content.find(`input[type=text], input[type=textbox], input[type=textarea]`)
					.on('focus', evt =>
						evt.target.select())
			}, 5)
		}
		async initFisBaslikUI(e) {
			const {fis} = this;
			const {adimTipi} = fis.class;
			if (!adimTipi)
				return null
			const subContent = this.divFisBaslik;
			if (!subContent.length)
				return null
			const content = e.content || this.content;
			const templates = this.templates.fisBaslik;
			const layouts = [templates.contents(`.ortak`),  templates.contents(`.${adimTipi}`)];
			for (let baslikContentLayout of layouts) {
				if (baslikContentLayout?.length) {
					baslikContentLayout = e.baslikContentLayout = baslikContentLayout.clone(true);
					let _e = $.extend({}, e, { parentPart: this, parentContent: content, layout: baslikContentLayout });
					baslikContentLayout.appendTo(subContent);
					await fis.initBaslikUI(_e);
					subContent[subContent.hasVScrollBar() ? 'addClass' : 'removeClass'](`vScroll scroll`);
					subContent[subContent.hasHScrollBar() ? 'addClass' : 'removeClass'](`hScroll scroll`);
					await new Promise(resolve =>
						setTimeout(() => resolve(), 10))
				}
			}
			this.liste_degisti(e);
			return layouts.filter(x => x && x.length)
		}
		async initDetayPanel(e) {
			const {fis} = this;
			const {content} = e;
			//let panel = this.baslik_panel = content.find('.baslik_panel');
			const navBar = this.detay_navBar = content.find('.detay .navBar');
			navBar.jqxNavigationBar({
				theme: theme, animationType: animationType, expandMode: 'none',
				width: false, toggleMode: 'none',
				expandAnimationDuration: 50, collapseAnimationDuration: 50,
				/*initContent: (index) => {
					if (index == 0)
						this.initDetayPanelDevam(e);
				},*/
				// expandedIndexes: [0]
			});
			// navBar.find('.jqx-expander-arrow').addClass('jqx-hidden');
			navBar.jqxNavigationBar('hideArrowAt', 0);

			const subContent = this.detay_content = content.find('.detay .header');
			let width = subContent.width();

			navBar.on('expandedItem', evt =>
				this.onResize(e));
			navBar.on('collapsedItem', evt =>
				this.onResize(e));

			const {sonStokKontrolEdilirmi} = this;
			const hizliStokPart = this.hizliStokPart = new CETMstComboBoxPart({
				parentPart: this,
				content: subContent.find('.hizliStok'),
				// layout: layout.find('.hizliStok'),
				placeHolder: 'Ürün Adı veya Barkod',
				listeSinif: CETStokListePart, table: 'mst_Stok',
				idSaha: 'kod', adiSaha: 'aciklama',
				events: {
					comboBox_itemSelected: e => {
						this.hizliStok_itemSelected(e);
						// this.focusToDefault()
					},
					comboBox_stmDuzenleyici: async e => {
						const {fis, sonStokKontrolEdilirmi} = this;
						let stokSent = (await CETStokTicariDetay.getStokEkBilgiStm({
							fis: fis, alias: 'mst', yerKod: fis.yerKod,
							sonStokKontrolEdilirmi: sonStokKontrolEdilirmi
						})).sent;
						const {stm} = e;
						stm.sentDo(sent =>
							stokSent.where.birlestir(sent.where));
						stm.sent = stokSent;
						/*if (sonStokKontrolEdilirmi)
							this.app.stmSentDuzenle_sonStokBagla({ stm: stm, alias: 'mst', shKodClause: `mst.kod`, yerKod: fis.yerKod });*/
						return stm
					},
					listedenSec: e => { this.aboutToDeactivate(e) },
					liste_stmDuzenleyici: e => true,
					listedenSec_ekArgs: {
						fis: this.fis,
						sonStokKontrolEdilirmi: sonStokKontrolEdilirmi ? true : undefined,
						sonStokFilterDisabled: sonStokKontrolEdilirmi,
						geriCallback: e => {
							setTimeout(() => {
								this.onResize(e);
								this.focusToDefault(e);
							}, 150);
						}
					}
				}
			})
			const txtHizliBarkod = this.txtHizliBarkod = subContent.find('.hizliBarkod');
			txtHizliBarkod.on('focus', evt => evt.target.select());
			txtHizliBarkod.on('keyup', evt => {
				const key = (evt.key || '').toLowerCase();
				if (key == 'enter' || key == 'linefeed')
					this.hizliBarkod_enterIstendi($.extend({}, e, { event: evt }))
			});
			this.focusPart = hizliStokPart;
			setTimeout(async _e => {
				const {hizliStokPart} = _e; await hizliStokPart.run();
				const {input} = hizliStokPart.comboBoxWidget;
				input.on('blur', evt => {
					if (this.lockedFlag) {
						this.setUniqueTimeout({
							key: 'focusToDefault',
							delayMS: 2000,
							block: () =>
								this.focusToDefault()
						})
					}
				});
				this.hizliBarkod_durumDegisti(e)
			}, 500, { hizliStokPart: hizliStokPart })
		}
		async initDipPanel(e) {
			const {app, param, fis} = this;
			const satirIskOranSinir = asFloat(app.satirIskOranSinir) || 0;
			const iskKullanilirmi = satirIskOranSinir > 0 && (app.iskontoArttirilirmi && fis.class.dipIskBedelKullanilirmi);
			
			const content = e.content;
			const subContent = this.dipTable_content = content.find('#dipTable.navBar .content');
			const navBar = this.dipTable_navBar = content.find('#dipTable.navBar');
			navBar.jqxNavigationBar({
				theme: theme, animationType: animationType, expandMode: 'toggle',
				width: false, toggleMode: 'none',
				expandAnimationDuration: 50, collapseAnimationDuration: 50,
				expandedIndexes: iskKullanilirmi && (fis.dipIskOran || fis.dipIskBedel) ? [0] : []
			});
			
			const navBarArrowClickHandler = evt => {
				let widget = navBar.jqxNavigationBar('getInstance');
				const index = 0;
				if ($.inArray(index, widget.expandedIndexes) != -1)
					widget.collapseAt(index)
				else
					widget.expandAt(index);
			};
			navBar
				.off('click, mouseup, touchend')
				.on('click, mouseup, touchend', evt => {
					const {target} = evt;
					const tagName = target.tagName.toUpperCase();
					if (!(tagName == 'INPUT' || tagName == 'TEXTAREA' || tagName == 'BUTTON' || target.classList.contains(`jqx-input-icon`) || target.classList.contains(`jqx-expander-arrow`)))
						navBarArrowClickHandler(evt);
				});
			navBar.find('.jqx-expander-arrow')
				.off('click, touchend, mouseup')
				.on('click, touchend, mouseup', evt => navBarArrowClickHandler(evt));
			
			navBar.on('expandedItem', evt =>
				this.onResize(e));
			navBar.on('collapsedItem', evt =>
				this.onResize(e));
			
			if (iskKullanilirmi) {
				let divDipIskOran = subContent.find('#dipIskOran').jqxNumberInput({
					theme: theme, width: 130, inputMode: 'simple',
					spinButtons: true, spinButtonsWidth: 28,
					min: 0, max: satirIskOranSinir, decimalDigits: 2,
					decimal: roundToFra(fis.dipIskOran, 2) || 0
				});
				const dipIskOranDegisti = evt => {
					const value = roundToFra(divDipIskOran.jqxNumberInput('decimal'), 2) || 0;
					this.fis.dipIskOran = value;
					this.liste_degisti();
				};
				divDipIskOran
					.attr('maxLength', 3)
					.on('focus', evt => evt.target.select())
					.on('blur, change', evt => dipIskOranDegisti(evt));
				divDipIskOran.find('.jqx-action-button')
					.on('click, touchend', evt => dipIskOranDegisti(evt));
				
				let divDipIskBedel = subContent.find('#dipIskBedel').jqxNumberInput({
					theme: theme, width: 180, inputMode: 'simple',
					min: 0, max: 999999999.99, decimalDigits: 2,
					spinButtons: true, spinButtonsWidth: 28,
					decimal: bedel(fis.dipIskBedel) || 0
				});
				const dipIskBedelDegisti = evt => {
					const value = bedel(divDipIskBedel.jqxNumberInput('decimal')) || 0;
					this.fis.dipIskBedel = value;
					this.liste_degisti();
				};
				divDipIskBedel
					.attr('maxLength', 3)
					.on('focus', evt => evt.target.select())
					.on('blur, change', evt => dipIskBedelDegisti(evt));
				divDipIskBedel.find('.jqx-action-button')
					.on('click, touchend', evt => dipIskBedelDegisti(evt));
			}
			else {
				subContent.find('#dipIskParent').addClass('jqx-hidden');
				if (!subContent.children(`div:not(.jqx-hidden)`).length)
					navBar.find('.jqx-expander-arrow').addClass('jqx-hidden');
				/*['#dipIskOran', '#dipIskBedel'].forEach(selector => {
					let elm = content.find(selector);
					if (elm.length)
						elm.parent().addClass('jqx-hidden');
				});*/
			}
		}

		async tazele(e) {
			let result = await super.tazele(e);
			this.liste_degisti(e);
			this.degistimi = false;
			return result
		}
		async ekle(e) {
			e = e || {}; let result = await super.ekle(e);
			const rec = e.rec || {};
			const {barkodParser} = rec;
			const barkod = rec.barkod || (rec.barkodParser || {}).barkod;
			if (barkod && barkodParser && barkodParser.ayrisimAyiraclimi && barkodParser.zVarmi)
				this.ayrisimAyiracli_barkod2Detay[barkod] = rec
			const okunanTumBarkodlar = rec.okunanTumBarkodlar = rec.okunanTumBarkodlar || {};
			okunanTumBarkodlar[barkod] = true;
			return result
		}
		sil(e) {
			e = e || {};
			const rec = e.rec || this.selectedBoundRec || {};
			let result = super.sil(e);
			const {ayrisimAyiracli_barkod2Detay} = this;
			const {barkod} = rec;
			if (barkod)
				delete ayrisimAyiracli_barkod2Detay[barkod]
			const okunanTumBarkodlar = rec.okunanTumBarkodlar = rec.okunanTumBarkodlar || {};
			for (const barkod in okunanTumBarkodlar)
				delete ayrisimAyiracli_barkod2Detay[barkod];
			return result
		}
		temizle(e) {
			let result = super.temizle(e);
			this.ayrisimAyiracli_barkod2Detay = {};
			return result
		}
		async kaydet(e) {
			const {app, fis} = this;
			app.hideNotifications();
			e = $.extend({
				sender: this, islem: this.islem, fis: fis, eskiFis: this.eskiFis, gecicimi: fis.gecicimi,
				satisKosulYapilari: this.satisKosulYapilari, promosyonYapilari: this.promosyonYapilari
			}, e);
			const layout = e.layout || this.layout;
			if (this.otoBirlestirFlag)
				await this.birlestir(e)
			$.extend(fis, {
				/*seri: layout.find('#fisSeri').val(),
				fisNo: layout.find('#fisNo').val(),
				aciklama: layout.find('#notlar').val(),*/
				detaylar: this.listeRecs.map(rec => {
					rec = $.isPlainObject(rec) ? new fis.class.detaySinif(rec) : rec;
					['_visible'].forEach(key =>
						delete rec[key]);
					return rec;
				})
			});
			await fis.dipHesapla();
			let handler = this.kaydetOncesi || this.kaydetOncesiDefault;
			if (handler) {
				let result = await handler.call(this, e);
				if (result === false)
					return false
			}
			return await this.kaydetDevam(e)
		}
		async kaydetOncesiDefault(e) {
			if (this.prefetch || this.isPrefetch) { return true }
			let {fis} = this; if (fis?.karmaTahsilatmi) {
				let tahFisSinif = CETTahsilatFis, tahUISinif = tahFisSinif.fisGirisUISinif, {mustKod} = fis, hedefToplamBedel = fis.sonucBedel;
				let tsn = [fis.seri, fis.noYil, fis.fisNo], aciklama = `SkyTabFis:${tsn.filter(x => !!x).join(' ')}`;
				let tahFis = new tahFisSinif({ mustKod, aciklama }); await tahFis.numaratorOlustur();
				let kaydetOncesi = e => {
					let {fis} = e; if (fis.toplamBedel == hedefToplamBedel) { return true }
					displayMessage('Tahsilat Bedel Toplamı ile Fiş Bedeli aynı olmalıdır', '! Karma Tahsilat Girişi !'); return false
				};
				let promise = new $.Deferred(), kaydedince = e => promise.resolve(true);
				await new tahUISinif({ fis: tahFis, hedefToplamBedel, kaydetOncesi, kaydedince }).run(); return await promise
			}
			return true
		}
		async kaydetDevam(e) {
			e = e || {}; const {app} = this, {param} = app;
			if (!(this.prefetch || this.isPrefetch)) {
				setButonEnabled(this.islemTuslari, false);
				(savedProcs || window).showProgress(null, null, 1, true);
				setTimeout(() => { (savedProcs || window).hideProgress(); setButonEnabled(this.islemTuslari, true) }, 2000)
			}
			if (this.paramDegistimi) { await param.kaydet() } $.extend(param, this.param); const fis = e.fis || this.fis;
			let handler = this.kaydetIslemi || this.kaydetDevam2;
			if (handler) { let result = await handler.call(this, e); if (!result) { return false } }
			this.degistimi = false; handler = this.kaydedince; if (handler) { handler.call(this, e) }
			return true
		}
		async kaydetDevam2(e) {
			e = e || {}; const fis = e.fis || this.fis, dbMgr = fis.dbMgr;
			let savedFisNo = fis.fisNo;
			const num = fis.numarator;
			if (num /*&& !(e.gecicimi || fis.gecicimi)*/) {
				$.extend(num, { seri: fis.seri, sonNo: num.sonNo + 1 });
				let numaratorIcinUygunmu = !fis.fisNo && (e.gecicimi || fis.gecicimi || this.yeniKayitmi);
				if (numaratorIcinUygunmu) {
					try {
						await num.kesinlestir({
							yeniKayitmi: numaratorIcinUygunmu && this.yeniKayitmi, islem: this.islem, dbMgr: dbMgr,
							fisSinif: fis.class, fisID: fis.id
						});
					}
					catch (ex) {
						if (ex.rc == 'runtimeInterrupt' || ex.rc == 'userAbort') return false
						displayMessage(`${ex.errorText || ex.message || ex}`, `@ Numaratör Kayıt İşlemi @`, undefined, undefined, false, true);
						console.error(`numarator kayıt hatası`, ex);
						throw ex
					}
					fis.fisNo = num.sonNo || 1
				}

				if (savedFisNo) {
					let yeniNo = await num.fisNoDuzelt({
						yeniKayitmi: numaratorIcinUygunmu && this.yeniKayitmi,
						islem: this.islem, dbMgr: dbMgr, fisSinif: fis.class,
						fisID: fis.id, seri: fis.seri, fisNo: fis.fisNo || num.sonNo
					});
					if (fis.fisNo != yeniNo) {
						fis.fisNo = yeniNo || 1;
						if (numaratorIcinUygunmu) {
							num.sonNo = fis.fisNo;
							await num.kaydet()
						}
					}
				}
			}
			//let tx = await dbMgr.transaction();
			try {
				fis.gecicimi = false;
				// let result = await fis.kaydet($.extend({ tx: tx }, e));
				let result = await fis.kaydet(e);
				//if (!result)
				//	dbMgr.abortTransaction();
				if (!result || result.isError)
					return result
				await fis.geciciFisleriTemizle();
				await dbMgr.transaction();
				if (savedFisNo && fis.fisNo != savedFisNo) {
					displayMessage(
						`<i>${savedFisNo}</i> olan Belge Numarası <b>${fis.fisNo}</b> olarak değişti.`,
						`Bilgilendirme`
					)
				}
				return result
			}
			catch (ex) {
				if (ex.rc == 'runtimeInterrupt' || ex.rc == 'userAbort')
					return false
				displayMessage(`${ex.errorText || ex.message || ex}`, `@ Belge Kayıt İşlemi @`, undefined, undefined, false, true);
				console.error(`fiş kayıt hatası`, ex)
				// setTimeout(() => this.tazele(), 1500)
			}
			finally {
				if (fis)
					fis.gecicimi = e.gecicimi
			}
		}
		async listeArgsDuzenle(e) {
			await super.listeArgsDuzenle(e);
			$.extend(e.listeArgs, {
				/* editable: true, */ serverProcessing: false, pageable: true, filterable: true, columnsResize: false,
				showToolbar: false, toolbarHeight: 36, filterHeight: 25, filterMode: 'default',
				pageSizeOptions: [3, 5, 8, 10, 11, 13, 15, 20, 25],
				pageSize: this.userSettings_liste.pageSize || 8,
				height: $(window).width() < 450 ? $(window).height() - 150 : $(window).height() - 180
			})
		}
		async liste_columnsDuzenle(e) {
			const {app} = this, {ozelKampanyaKullanilirmi} = app; await super.liste_columnsDuzenle(e);
			e.listeColumns.push(
				{
					text: 'Ürün Adı', align: 'left', dataField: 'shAdi',
					cellsRenderer: (rowIndex, columnIndex, value, rec) => {
						const {app, fis, fiyatGorurmu, bedelKullanilirmi} = this;
						rec = rec.originalRecord || rec;

						const divSatir = this.newListeSatirDiv(e);
						divSatir.attr('data-index', rowIndex);
						
						const promoTextParent = divSatir.find(`.promoTextParent`);
						if (rec.promoKod) {
							divSatir.addClass(`promosyon`);
							promoTextParent.find(`.promoText`).html(rec.promoKod)
						}
						else {
							promoTextParent.addClass('jqx-hidden')
						}

						if (!bedelKullanilirmi) {
							[rec.class.ticariSahaKeys || [], rec.class.iskOranKeys || [], rec.class.kamOranKeys || []]
								.forEach(keys => {
									keys.forEach(key => {
										let elm = divSatir.find(`.${key}`);
										if (elm && elm.length)
											elm.remove();
										elm = divSatir.find(`.${key}Parent`);
									if (elm && elm.length)
										elm.remove();
									});
								});
						}

						for (const key in rec) {
							const value = rec[key];
							const item = divSatir.find(`.${key}`);
							if (item.length)
								item.html(value)
						}

						const {miktar} = rec;
						const brm = rec.brm || 'AD';
						const stokFra = app.brm2Fra[brm] || 0;
						
						const divMiktar = divSatir.find(`.miktar`);
						if (divMiktar.length) {
							let miktarText = '';
							const {paketKod} = rec;
							const paketMiktar = asInteger(rec.paketMiktar) || 0;
							if (paketKod && paketMiktar > 0) {
								const {paketIcAdet} = rec;
								const paketFazla = paketIcAdet ? (miktar - (paketMiktar * paketIcAdet)) : 0;
								miktarText += `<span class="paketBilgi"><span class="_veri">${rec.paketMiktar} ${rec.paketKod}</span></span> `;
								if (paketFazla)
									miktarText += `<span class="paketFazlaBilgi">(<span class="_veri">+${paketFazla} ${brm}</span>)</span>`;
								miktarText += ` = `;
							}

							const _miktarCoalesceDeger = sky.app.rbkKullanilirmi && rec.rbkIcinUygunmu ? 0 : 1;
							miktarText += toStringWithFra(miktar || _miktarCoalesceDeger, stokFra);
							divMiktar.html(miktarText)
						}

						const mfParent = divSatir.find(`.mfParent`);
						if (rec.malFazlasi) {
							mfParent.removeClass('jqx-hidden');
							mfParent.find(`.mf`).html((rec.malFazlasi || 0).toLocaleString())
						}
						else
							mfParent.addClass('jqx-hidden')

						const fiyatParent = divSatir.find(`.fiyatParent`);
						if (!(fiyatGorurmu && bedelKullanilirmi && rec.fiyat))
							fiyatParent.addClass('jqx-hidden')
						else {
							const {dovizlimi, dvKod} = fis;
							const fiyatFra = dovizlimi ? app.dvFiyatFra : app.fiyatFra;
							divSatir.find('.dvKod').html(dvKod || 'TL');
							fiyatParent.find(`.fiyat`).html(toStringWithFra(rec.fiyat || 0, fiyatFra));
							if (rec.ozelFiyatVarmi) {
								fiyatParent.addClass('ozelFiyat')
								// fiyatParent.find('.etiket').html('Koş:')
							}
							fiyatParent.removeClass('jqx-hidden')
						}
						
						const kdvOraniParent = divSatir.find(`.kdvOraniParent`);
						if (!bedelKullanilirmi || rec.kdvOrani == null)
							kdvOraniParent.addClass('jqx-hidden')
						else {
							divSatir.find(`.kdvOraniText`).html(`%${rec.kdvOrani}`);
							kdvOraniParent.removeClass('jqx-hidden')
						}

						const kadIskOranParent = divSatir.find('.kadIskOranParent');
						if (rec.kadIskOranVarmi) { kadIskOranParent.find('.kadIskOranText').html(`%${rec.kadIskOran.toLocaleString()}`); kadIskOranParent.removeClass('jqx-hidden') }
						else { kadIskOranParent.addClass('jqx-hidden') }
						
						const iskOranParent = divSatir.find('.iskOranParent');
						if (rec.iskOranVarmi) {
							iskOranParent.find('.iskOranText').html((rec.iskOranListe || []).map(val => val.toLocaleString()).join('+'));
							iskOranParent.removeClass('jqx-hidden')
						}
						else { iskOranParent.addClass('jqx-hidden') }

						const ozelKampanyaKodParent = divSatir.find(`.ozelKampanyaKodParent`);
						const ozelKampanyaOranParent = divSatir.find(`.ozelKampanyaOranParent`);
						if (ozelKampanyaKullanilirmi && rec.ozelKampanyaKod) {
							const ozelKampanyaKod = ozelKampanyaKodParent.find(`.ozelKampanyaKod`);
							ozelKampanyaKod.html(rec.ozelKampanyaKod);

							if (rec.ozelKamOranVarmi) {
								ozelKampanyaOranParent.find(`.ozelKampanyaOranText`).html(
									(rec.ozelKamOranListe || [])
										.map(val => val.toLocaleString())
									.join(`+`)
								);
							}
							else {
								ozelKampanyaOranParent.addClass('jqx-hidden');	
							}
						}
						else {
							ozelKampanyaOranParent.addClass('jqx-hidden');
							ozelKampanyaKodParent.addClass('jqx-hidden');
						}

						const {netBedel} = rec;
						if (fiyatGorurmu && bedelKullanilirmi && netBedel)
							divSatir.find(`.netBedel`).html(bedelStr(netBedel));
						else
							divSatir.find(`.netBedelParent`).addClass('jqx-hidden');
						
						const rafKodParent = divSatir.find(`.rafKodParent`);
						let ekOzellik = this.fis.class.rafKullanilirmi ? rec.ekOzellik_raf : null;
						if (ekOzellik) {
							const {value} = ekOzellik;
							if (value) {
								// rafKodParent.removeClass('jqx-hidden');
								rafKodParent.find(`.rafKod`).html(value);
							}
							else {
								// rafKodParent.addClass('jqx-hidden');
							}
							rafKodParent.removeClass('jqx-hidden')
						}
						else {
							rafKodParent.addClass('jqx-hidden');
						}

						const refRafKodParent = divSatir.find(`.refRafKodParent`);
						ekOzellik = this.fis.class.refRafKullanilirmi ? rec.ekOzellik_refRaf : null;
						if (ekOzellik) {
							const {value} = ekOzellik;
							if (value) {
								// refRafKodParent.removeClass('jqx-hidden');
								refRafKodParent.find(`.refRafKod`).html(value);
							}
							else {
								// refRafKodParent.addClass('jqx-hidden');
							}
							refRafKodParent.removeClass('jqx-hidden')
						}
						else {
							refRafKodParent.addClass('jqx-hidden')
						}

						const ekOzelliklerParent = divSatir.find('.ekOzellikler');
						const {sadeceOzellikAnahtarStr} = rec;
						if (sadeceOzellikAnahtarStr) {
							ekOzelliklerParent.find('._veri').html(sadeceOzellikAnahtarStr);
							ekOzelliklerParent.removeClass('jqx-hidden');
						}

						const barkodParent = divSatir.find(`.barkodParent`);
						if (barkodParent.length) {
							if (rec.barkod)
								barkodParent.removeClass('jqx-hidden');
							else
								barkodParent.addClass('jqx-hidden');
						}
						
						return divSatir[0].outerHTML.trim()
					}
				},
				{ text: 'Ürün Kod', align: 'left', dataField: 'shKod', hidden: true },
				{ text: 'Bedel', align: 'right', dataField: 'netBedel', cellsFormat: 'd2', hidden: true }
			)
		}
		liste_rendered(e) {
			super.liste_rendered(e);
			if (this._timer_listeRendered_ek) {
				clearTimeout(this._timer_listeRendered_ek);
				delete this._timer_listeRendered_ek
			}
			this._timer_listeRendered_ek = setTimeout(async e => {
				try { await this.liste_rendered_devam(e) }
				finally { delete this._timer_listeRendered_ek }
			}, 200, e)
		}
		liste_rendered_devam(e) {
			e = e || {};
			const {app, fis, listeWidget} = this, {resimBaseURL} = app;
			const rafKullanilirmi = fis.class.rafKullanilirmi && (app.ekOzellikKullanim.raf || {}).kullanilirmi;
			const refRafKullanilirmi = fis.class.refRafKullanilirmi && (app.ekOzellikKullanim.raf || {}).kullanilirmi;
			const handler_disableEvents = evt => {
				this.disableEventsFlag = true;
				setTimeout(() => this.disableEventsFlag = false, 100)
			};
			const trRows = listeWidget.table.find('tr[role=row]');
			for (let i = 0; i < trRows.length; i++) {
				const trRow = trRows.eq(i);
				const btnResimGoster = trRow.find('.listeSatir .resimGoster');
				if (resimBaseURL)
					btnResimGoster.removeClass('jqx-hidden basic-hidden');
				else
					btnResimGoster.addClass('jqx-hidden')
				btnResimGoster.on('click', async evt => {
					const {onLine} = navigator;
					if (!onLine) {
						displayMessage('Resim Gösterimi için İnternet Bağlantısı gereklidir', this.adimText);
						return
					}
					let {resimBaseURL} = app;
					if (!resimBaseURL)
						return
					if (!(resimBaseURL.includes('?') || resimBaseURL.endsWith('/')))
						resimBaseURL += '/'
					const uid = $(evt.currentTarget).parents('tr[role=row]').data('key');
					let det = listeWidget.rowsByKey[uid];
					det = (det?.originalRecord ?? det);
					if (!det)
						return
					const {shKod, shAdi, resimKodu} = det;
					const resimDosyaAdi = resimKodu || shKod;
					if (!resimDosyaAdi)
						return null
					await this.aboutToDeactivate(e);
					const wnd = createJQXWindow(
						`<div class="resim" style="background-image: url(${resimBaseURL}${resimDosyaAdi}), url(../_kernel/images/x.png)"></div>`,
						(
							`<span class="ek-bilgi">Resim:</span> ` +
							`<span class="shText"><b class="shAdi">${shKod}</b><span class="ek-bilgi">-</span><span class="shAdi">${shAdi}</span>`
						),
						{ isModal: false, width: '100%', height: '100%', showCollapseButton: true, closeButtonAction: 'close' }
					);
					wnd.addClass(`${app.appName} ${app.rootAppName} resimGoster part`);
					wnd.find('.jqx-window-content > div .resim').on('click', evt =>
						wnd.jqxWindow('close'));
					wnd.on('close', evt => {
						wnd.jqxWindow('destroy');
						setTimeout(() => this.aboutToActivate(e), 100)
					})
				});
				
				const uid = trRow.data('key');
				let detay = uid == null ? null : listeWidget.rowsByKey[uid];
				if (detay) {
					detay = detay.originalRecord || detay;
					detay = detay.deepCopy ? detay.deepCopy() : new fis.detaySinif(detay);
					const divSatir = trRow.find('.jqx-grid-cell .listeSatir');
					const btnContextMenu = divSatir.find('.contextMenu');
					if (btnContextMenu.length) {
						btnContextMenu.jqxButton({ theme: theme });
						for (const key of ['mousedown', 'touchstart']) {
							btnContextMenu.off(key);
							btnContextMenu.on(key, evt => {
								const elm = $(evt.currentTarget), pos = elm.offset();
								pos.left += elm.width() + 20; pos.top += elm.height() + 33;
								this.listeContextMenuIstendi({ event: evt, pos: pos })
							})
						}
					}
					if (rafKullanilirmi) {
						const parent = divSatir.find('.rafKodParent');
						let btn = parent.find('.listedenSec');
						if (btn.length) {
							btn.jqxButton({ theme: theme, width: 40, height: 35 });
							for (const key of ['mousedown', 'touchstart']) {
								btn.off(key);
								btn.on(key, evt => handler_disableEvents(evt))
							}
							btn.off('click');
							btn.on('click', evt => {
								handler_disableEvents(evt);
								app.hideNotifications();
								const trRow = $(evt.target).parents('tr[role=row]');
								const uid = trRow.data('key');
								let detay = uid == null ? null : listeWidget.rowsByKey[uid];
								const ekOzellik = detay && detay.ekOzelliklerYapi ? detay.ekOzelliklerYapi.tip2EkOzellik.raf : null;
								if (ekOzellik) {
									let promise = new $.Deferred();
									let part = new CETKAListePart({
										sender: this,
										table: 'mst_YerRaf', kodsuzmu: true,
										idSaha: 'rafKod', adiSaha: 'rafKod',
										liste_stmDuzenleyici: e => {
											if (!e.rowCountOnly) {
												for (const sent of e.stm.getSentListe())
													sent.where.degerAta(fis.yerKod, 'yerKod')
											}
										},
										liste_loadServerData_ekIslemler: e => {
											const {value} = ekOzellik;
											if (value)
												setTimeout(() => e.sender.selectRec({ uid: value }), 10)
										},
										secince: e =>
											promise.resolve(e)
									});
									part.run();
									
									promise.then(e => {
										try {
											detay.cacheReset();
											ekOzellik.value = e.rec.rafKod;
											this.degistir({ rec: detay })
										}
										catch (ex) {
											console.error(ex);
											defFailBlock(ex, 'error')
										}
									})
								}
							})
						}
					}
					if (refRafKullanilirmi) {
						const parent = divSatir.find('.refRafKodParent');
						let btn = parent.find('.listedenSec');
						if (btn.length) {
							btn.jqxButton({ theme: theme, width: 40, height: 40 });
							for (const key of ['mousedown', 'touchstart']) {
								btn.off(key);
								btn.on(key, evt => handler_disableEvents(evt))
							}
							btn.on('click', evt => {
								handler_disableEvents(evt);
								app.hideNotifications();
								const trRow = $(evt.target).parents('tr[role=row]');
								const uid = trRow.data('key');
								let detay = uid == null ? null : listeWidget.rowsByKey[uid];
								const ekOzellik = detay && detay.ekOzelliklerYapi ? detay.ekOzelliklerYapi.tip2EkOzellik.refRaf : null;
								if (ekOzellik) {
									let promise = new $.Deferred();
									let part = new CETKAListePart({
										sender: this,
										table: 'mst_YerRaf', kodsuzmu: true,
										idSaha: 'rafKod', adiSaha: 'rafKod',
										liste_stmDuzenleyici: e => {
											if (!e.rowCountOnly) {
												for (const sent of e.stm.getSentListe())
													sent.where.degerAta(fis.refYerKod, 'yerKod')
											}
										},
										liste_loadServerData_ekIslemler: e => {
											const {value} = ekOzellik;
											if (value)
												setTimeout(() => e.sender.selectRec({ uid: value }), 10)
										},
										secince: e =>
											promise.resolve(e)
									});
									part.run();
									
									promise.then(e => {
										try {
											detay.cacheReset();
											ekOzellik.value = e.rec.rafKod;
											this.degistir({ rec: detay })
										}
										catch (ex) {
											console.error(ex);
											defFailBlock(ex, 'error')
										}
									})
								}
							})
						}
					}
				}
			}
		}
		/*liste_renderToolbar(e) {
			const layout = e.layout || this.layout;
			const toolbar = e.listeToolbar;
			let islemTuslari = this.toolbarIslemTuslari;
			if (!islemTuslari) {
				islemTuslari = this.toolbarIslemTuslari = this.newListeSubPart('.toolbar-external.islemTuslari');
				islemTuslari.appendTo(toolbar);

				const liItems = islemTuslari.find('ul > li');
				islemTuslari.jqxMenu({
					theme: theme, mode: 'horizontal',
					width: '100%', height: false,
					animationShowDuration: 0, animationHideDuration: 0
				});
				liItems.on('click', evt =>
					this.liste_islemTusuTiklandi($.extend({}, e, { event: evt })));
			}
		}*/
		async initIslemTuslari(e) {
			e = e || {};
			const layout = e.layout || this.layout;
			const {app, fis, listePopup} = this;
			const degisiklikYapilabilirmi = (this.islem != 'izle') && !(fis.devreDisimi || fis.gonderildimi /*|| fis.gecicimi*/);
			
			let islemTuslari = this.islemTuslari = layout.find('.asil.islemTuslari');
			islemTuslari.children('button').jqxButton({ theme: theme });
			islemTuslari.removeClass('jqx-hidden');
			
			const btnKaydet = this.btnKaydet = islemTuslari.find('#kaydet');
			btnKaydet.off('click');
			if (!(degisiklikYapilabilirmi || (fis.gecicimi || this.yeniKayitmi))) {
				if (!(this.prefetch || this.isPrefetch)) {
					setButonEnabled(btnKaydet, false);
					btnKaydet.jqxButton('disabled', true);
					// btnKaydet.addClass('jqx-hidden');
					islemTuslari.children().addClass('jqx-hidden');
				}
			}
			else {
				btnKaydet.on('click', evt =>
					this.kaydetIstendi($.extend({}, e, { event: evt })));
				// btnKaydet.jqxTooltip({ theme: theme, trigger: `hover`, content: `Belgeyi kaydet` });
			}

			if (this.ozelIslemTuslariPart)
				this.ozelIslemTuslariPart.destroyPart();
			
			let ozelIslemTuslariPart = this.ozelIslemTuslariPart = new CETExpandableIslemTuslariPart({
				position: false,
				templateItems: layout.find(`.toolbar-external.islemTuslari-ozel`),
				onItemClicked: e => this.liste_islemTusuTiklandi(e)
			});
			await ozelIslemTuslariPart.run();
			let {parentMenu} = ozelIslemTuslariPart;
			if (parentMenu) {
				// parentMenu.find(`#sil`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Seçili Detay Satırını SİL` });
				this.btnSil = parentMenu.find(`#sil`);
			}
			/*ozelIslemTuslariPart.layout
				.detach()
				.prependTo(this.divListe.parent());*/
			
			let islemTuslariPart = this.islemTuslariPart = new CETExpandableIslemTuslariPart({
				/* position: ``, */
				templateItems: layout.find(`.toolbar-external.islemTuslari`),
				onItemClicked: e => this.liste_islemTusuTiklandi(e)
			});
			await islemTuslariPart.run();
			parentMenu = islemTuslariPart.parentMenu;
			if (parentMenu) {
				/*parentMenu.find(`#degistir`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Seçili Detay Satırı üzerine Miktar/Fiyat/İskonto/Ek Özellik ... vb. degişikliklerin yapılabileceği ekranı açar` });
				parentMenu.find(`#temizle`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Belgedeki bütün kalemleri <span class="bold red">siler</span>` });
				parentMenu.find(`#fiyatGor`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Seçili Detaya ait Stok için, Belgedeki Müşteri'ye göre Fiyat bilgileri ve Son Stok durumunu gösterir` });
				parentMenu.find(`#birlestir`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Belgedeki detaylardan <u>AYNI ÖZELLİKTE OLAN</u> kalemleri birleştirir` });
				parentMenu.find(`#sablon`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Vio tarafında ilgili Satış Fatura/Sipariş Fiş Giriş ekranında <b>Şablon Sakla</b> özelliği ile tanımlanmış Belge Giriş Şablon'u seçimini sağlar` });
				// parentMenu.find(`#degistir`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Seçili Detay Satırı üzerine Miktar/Fiyat/İskonto/Ek Özellik ... vb. degişikliklerin yapılabileceği ekranı açar` });*/
				const removeKeys = [];
				if (!app.musteriDurumuKullanilirmi)
					removeKeys.push('musteriDurumu');
				if (!fis.class.promosyonKullanilirmi)
					removeKeys.push('promosyon');
				if (!(app.siparisKontrolEdilirmi && fis.class.siparisKontrolEdilirmi))
					removeKeys.push('siparistenKarsila');
				if (!app.rbkKullanilirmi)
					removeKeys.push('rbkDuzenle');
				/*if (app.paketBozKullanilirmi)
					removeKeys.push('paketBoz');*/

				// const {listePopup} = this;
				const listePopupItems = listePopup ? listePopup.find('ul li') : null;
				for (const key of removeKeys) {
					let item = parentMenu.find(`#${key}.item`);
					if (item.length)
						item.remove();
					if (listePopupItems && listePopupItems.length) {
						item = listePopupItems.filter(`#${key}`);
						if (item.length)
							item.remove()
					}
				}
			}
		}
		async loadServerData(e) {
			const recs = this.fis.detaylar, {ayrisimAyiracli_barkod2Detay} = this;
			for (const rec of recs) {
				const okunanTumBarkodlar = rec.okunanTumBarkodlar = rec.okunanTumBarkodlar || {};
				for (const barkod in okunanTumBarkodlar)
					ayrisimAyiracli_barkod2Detay[barkod] = true
			}
			e.callback({ totalrecords: recs.length, records: recs })
		}
		async satirlariYenidenHesapla(e) {
			e = e || {}; const {fis, satisKosulYapilari} = this, islemYenimi = this.islem == `yeni`;
			for (const i in fis.detaylar) {
				const det = fis.detaylar[i];
				det.ozelFiyatVarmi = det.ozelIskontoVarmi = false;
				if (det.ekBilgileriBelirle)
					await det.ekBilgileriBelirle({ fis: fis });
				
				// if (!islemYenimi && det.detayEkIslemler_ekle)
				if (det.detayEkIslemler_ekle)
					await det.detayEkIslemler_ekle({ fis: fis, satisKosulYapilari: satisKosulYapilari });
				else if (det.detayEkIslemler)
					await det.detayEkIslemler({ fis: fis, satisKosulYapilari: satisKosulYapilari });
			}
			await fis.dipHesapla(); this.tazele();
		}
		async birlestir(e) {
			e = e || {};
			const {fis} = this, {detaySinif} = fis, recs = this.listeRecs, anah2Detay = {}, proDetListe = [];
			for (const rec of recs) {
				if (rec.class.promosyonmu || rec.promoKod) {
					proDetListe.push(rec);
					continue
				}
				const _det = $.isPlainObject(rec) ? new fis.class.detaySinif(rec) : rec.deepCopy();
				const anahStr = _det.getBirlestirIcinAnahtarStr({ fis: fis, birlestir: true });
				let det = anah2Detay[anahStr];
				if (det) {
					det.okutmaSayisi++;
					det.miktar += _det.miktar || 0;
					if (det.paketMiktar != null && _det.paketMiktar != null)
						det.paketMiktar += (_det.paketMiktar || 0);
					await det.bedelHesapla();
					const {siparisVioID2MiktarYapi} = det;
					const diger_siparisVioID2MiktarYapi = _det.siparisVioID2MiktarYapi;
					if (siparisVioID2MiktarYapi && diger_siparisVioID2MiktarYapi) {
						for (const vioID in diger_siparisVioID2MiktarYapi)
							siparisVioID2MiktarYapi[vioID] = (siparisVioID2MiktarYapi[vioID] || 0) + (diger_siparisVioID2MiktarYapi[vioID] || 0);
					}
				}
				else
					det = anah2Detay[anahStr] = _det
			};
			fis.detaylar = $.merge(Object.values(anah2Detay), proDetListe || []);
			await this.tazele()
		}
		async promosyonHesapla(e) {
			e = e || {}; const {fis} = this;
			if (!fis.class.promosyonKullanilirmi)
				return
			try {
				await fis.promosyonHesapla($.extend({}, e, { fis, promosyonYapilari: this.promosyonYapilari, satisKosulYapilari: this.satisKosulYapilari }));
				setTimeout(() => this.tazele(), 100)
			}
			finally { setTimeout(() => this.onResize(), 50) }
		}
		async siparistenKarsila(e) {
			e = e || {};
			const {fis} = this;
			if (!fis.class.siparisKontrolEdilirmi)
				return
			let result = await new CETBekleyenSiparislerListePart({
				parentPart: this, almSat: fis.class.almSat, mustKod: fis.mustKod, ayrimTipi: fis.ayrimTipi || '', sevkAdresKod: fis.sevkAdresKod || '',
				geriCallback: e => {
					setTimeout(() => { this.liste_hideFilterBar(e); this.onResize(e); this.focusToDefault(e); }, 150)
				},
				secince: _e => setTimeout(e => this.siparistenKarsilaDevam(e), 10, $.extend({}, e, _e))
			}).run()
		}
		async siparistenKarsilaDevam(e) {
			const {app, fis, satisKosulYapilari} = this, fisSinif = fis.class, {almSat, detaySinif} = fisSinif, {recs} = e;
			if ($.isEmptyObject(recs))
				return
			let hmrKullanilirmi = false;
			if (almSat) {
				switch (almSat) {
					case 'A': hmrKullanilirmi = app.depoMalKabulSiparisHMRlimi; break
					case 'T': hmrKullanilirmi = app.depoSevkiyatSiparisHMRlimi; break
				}
			}
			else
				hmrKullanilirmi = app.depoMalKabulSiparisHMRlimi || app.depoSevkiyatSiparisHMRlimi
			
			const {idSahalarSiparis} = CETEkOzellikler;
			const anah2Detay = {};
			for (const rec of recs) {
				const {stokKod, vioID, kalanMiktar} = rec;
				const _rec = { fis: fis, shKod: stokKod, miktar: 0 };
				let anah = [stokKod];
				if (hmrKullanilirmi) {
					for (const key of idSahalarSiparis) {
						const value = rec[key];
						if (value != null) { anah.push(value); _rec[key] = value }
					}
				}
				const anahStr = anah.join(CETEkOzellikler.anahtarDelim);
				let det = anah2Detay[anahStr];
				if (!det) {
					det = new detaySinif(_rec); det.miktar = 0;
					const {ekOzelliklerYapi} = det;
					if (ekOzelliklerYapi)
						await ekOzelliklerYapi.setValues({ rec: _rec })
					anah2Detay[anahStr] = det
				}
				det.miktar = (det.miktar || 0) + kalanMiktar;
				const {siparisVioID2MiktarYapi} = det;
				if (siparisVioID2MiktarYapi)
					siparisVioID2MiktarYapi[vioID] = kalanMiktar
			}
			for (const anahStr in anah2Detay) {
				const det = anah2Detay[anahStr]; await det.detayEkIslemler_ekle({ fis: fis, satisKosulYapilari: satisKosulYapilari });
				await this.ekle({ rec: det });
			}
			app.hideNotifications();
			if (!this.baslikNavBarCollapseInitFlag) {
				this.baslikNavBarCollapseInitFlag = true;
				this.baslik_navBar.jqxNavigationBar('collapseAt', 0)
			}
			setTimeout(async () => {
				await this.selectLastRec();
				setTimeout(() => { this.onResize(e); this.focusToDefault(e); }, 150)
			}, 50)
		}
		async paketBoz(e) {
			e = e || {}; const {app, fis} = this;
			/*if (!app.paketBozKullanilirmi)
				return;*/
			let orjDetay = e.rec || this.selectedBoundRec;
			if (orjDetay)
				orjDetay = orjDetay.originalRecord || orjDetay;
			let det = orjDetay;
			const {shKod, paketKod} = det || {};
			if (det) {
				if (!paketKod) {
					displayMessage(`Bu işlem sadece <b>Paketli Satırlar</b> için yapılabilir`, `! Paket Bozma İşlemi !`);
					return
				}
				if ((det.paketMiktar || 0) <= 0) {
					displayMessage(`Bozulacak paket kalmamıştır`, `! Paket Bozma İşlemi !`);
					return
				}
				det.cacheReset();
				det = $.isPlainObject(det) ? fis.class.detaySinif.From(det) : det.deepCopy();
			}
			if (!det)
				return
			let sent = new MQSent({
				from: 'mst_StokPaket',
				where: [ { degerAta: shKod, saha: 'stokKod' }, { degerAta: paketKod, saha: 'paketKod' } ],
				sahalar: ['paketIcAdet']
			});
			const maxPaketIcAdet = asInteger(await sky.app.dbMgr_mf.tekilDegerExecuteSelect({ query: sent }));
			const paketIcAdet = det.paketIcAdet || 1;
			const wndCSSName = `paketBozEkrani ${this.class.partName} ${app.appName} ${app.rootAppName} part`;
			let promise = new $.Deferred();
			const wnd = createJQXWindow(
				this.templates.paketBozEkrani.contents('div').clone(true),
				`Paket Bozma Ekranı`,
				{ isModal: true, autoOpen: true, width: 350, height: 200 },
				{
					TAMAM: (dlgUI, btnUI) => {
						const _promise = promise; promise = null;
						wnd.jqxWindow('close');
						if (_promise)
							_promise.resolve({ sender: dlgUI })
					},
					VAZGEC: (dlgUI, btnUI) =>
						wnd.jqxWindow('close')
				}
			);
			wnd.addClass(wndCSSName);
			const wndContent = wnd.find('.jqx-window-content');
			const subContent = wndContent.find('.sub-content');
			let input = subContent.find('#paketIcAdet ._veri');
			input.attr('max', maxPaketIcAdet);
			input.attr('placeHolder', maxPaketIcAdet);
			input.val(paketIcAdet);
			input.on('change', evt =>
				det.paketIcAdet = asInteger(evt.target.value) || 0);
			const inputs = subContent.find('input');
			inputs.on('focus', evt =>
				evt.target.select());
			inputs.on('keyup', evt => {
				const key = (evt.key || '').toLowerCase();
				if (key == 'enter' || key == 'linefeed')
					wnd.find(`.ui-window-content .ui-dialog-button input[type=button][value="TAMAM"]`).click()
			});
			setTimeout(() => subContent.find('#paketIcAdet > ._veri').focus(), 10);
			this.disableListeResizeEventsFlag = true;
			wnd.on('close', evt => {
				delete this.disableListeResizeEventsFlag;
				wnd.jqxWindow('destroy');
				if (promise)
					promise.reject({ sender: null, isError: false, rc: 'userAbort' });
			});
			promise.then(e => {
				try {
					const {paketIcAdet} = det;
					const orjPaketIcAdet = orjDetay.paketIcAdet;
					if (paketIcAdet == orjPaketIcAdet)
						return
					if (paketIcAdet > maxPaketIcAdet) {
						displayMessage(`Paket İç Adedi <b>${maxPaketIcAdet}</b> miktarından <u>daha küçük</u> olmalıdır`, `@ Paket Bozma İşlemi @`);
						return
					}
					if (paketIcAdet <= 0) {
						displayMessage(`Paket İç Adedi <b>0</b>'dan <u>büyük</u> olmalıdır`, `@ Paket Bozma İşlemi @`);
						return
					}
					const {paketKod} = det, paketMiktar = det.paketMiktar = 1;
					det.miktar = paketMiktar * paketIcAdet; orjDetay.paketMiktar--; orjDetay.miktar -= orjPaketIcAdet;
					const orjPaketKaldimi = orjDetay.paketMiktar > 0;
					if (!orjPaketKaldimi) {
						const {uid} = orjDetay;
						$.extend(orjDetay, det);
						orjDetay.uid = uid
					}
					this.degistir({ rec: orjDetay });
					if (orjPaketKaldimi) { delete det.uid; this.ekle({ rec: det }) }
				}
				catch (ex) { console.error(ex); defFailBlock(ex, 'error') }
			})
		}
		focusToDefault() {
			const {activePart} = sky.app, {windows, focusPart, barcodeReader} = this; if (!(focusPart && activePart == this && $.isEmptyObject(windows))) { return false }
			if (barcodeReader?.isRunning) { this.divListe.focus(); return false }
			if (focusPart.focusToDefault) { focusPart.focusToDefault() } else if (focusPart.focus) { focusPart.focus() }
			return true
		}
		async geriYapilabilirmi(e) {
			if (!await super.geriYapilabilirmi(e))
				return false
			if (this.fis.devreDisimi || !this.degistimi)
				return true
			return await new Promise(then => {
				displayMessage(
					'Ekranda değişiklik yapılmış, yine de çıkılsın mı?', this.app.appText, true, {
						EVET: (dlgUI, btnUI) => { dlgUI.jqxWindow('destroy'); then(true) },
						HAYIR: (dlgUI, btnUI) => { dlgUI.jqxWindow('destroy'); then(false) }
					}
				)
			})
		}
		hizliBarkod_durumDegisti(e) {
			const {hizliBarkodFlag, txtHizliBarkod, hizliStokPart} = this;
			if (hizliBarkodFlag) {
				this.focusPart = txtHizliBarkod;
				hizliStokPart.content.addClass('jqx-hidden');
				txtHizliBarkod.removeClass('jqx-hidden basic-hidden')
			}
			else {
				this.focusPart = hizliStokPart;
				txtHizliBarkod.addClass('jqx-hidden');
				hizliStokPart.content.removeClass('jqx-hidden basic-hidden')
			}
			this.focusToDefault()
		}
		hizliBarkod_enterIstendi(e) {
			if (this.timer_hizliBarkod_topluEkle) {
				clearTimeout(this.timer_hizliBarkod_topluEkle);
				delete this.timer_hizliBarkod_topluEkle
			}
			this.timer_hizliBarkod_topluEkle = setTimeout(async e => {
				e = e || {};
				try {
					const evt = e.event;
					const _e = $.extend({}, e, {
						event: evt,
						barkodlar: (evt.currentTarget.value || '').split('\n')
										.map(x => x.replace('\r', '').trim())
										.filter(x => !!x)
					});
					await this.hizliBarkod_topluEkle(_e)
				}
				finally { delete this.timer_hizliBarkod_topluEkle }
			}, 500, e)
		}
		async hizliBarkod_topluEkle(e) {
			e = e || {};
			this.txtHizliBarkod.val('');
			this.focusToDefault();
			
			if (this.baslikNavBarCollapseInitFlag)
				setTimeout(() => this.onResize(e), 150)
			else {
				this.baslikNavBarCollapseInitFlag = true;
				this.baslik_navBar.jqxNavigationBar('collapseAt', 0);
				for (const timeout of [200, 300])
					setTimeout(() => this.onResize(e), timeout)
			}
			const {barkodlar} = e;
			if ($.isEmptyObject(barkodlar))
				return
			const {listeWidget} = this;
			listeWidget.beginUpdate();
			try {
				for (const barkod of barkodlar)
					await this.ekleIstendi({ barkod: barkod })
			}
			catch (ex) {
				if (!(ex.rc == 'runtimeInterrupt' || ex.rc == 'userAbort'))
					displayMessage(`${ex.errorText || ex.message || ex}`, `@ Toplu Barkod Ekleme İşlemi @`, undefined, undefined, false, true);
			}
			finally { listeWidget.endUpdate() }
			setTimeout(() => { this.onResize(e); this.focusToDefault(); this.selectLastRec() }, 100)
		}
		hizliStok_itemSelected(e) {
			e.barkod = e.value; delete e.value;
			this.ekleIstendi(e);
			return true
		}
		async liste_veriYuklendi(e) {
			await super.liste_veriYuklendi($.extend({}, e, { noAutoSelect: true }));
			if (!this.listeReadyFlag)
			 	return
			setTimeout(async () => {
				if (!this.isListeVeriYuklendiEventTriggered)
					this.isListeVeriYuklendiEventTriggered = true;
				this.degistimi = false
			}, 10)
		}
		liste_degisti(e) {
			e = e || {}; super.liste_degisti(e);
			const {divFisBaslik} = this;
			const divDvKod = divFisBaslik?.length ? divFisBaslik.find('.ortak > .dvKodParent.parent div#dvKod > .cetMstComboBox.part #widget') : null;
			const ddDvKodWidget = divDvKod?.length ? divDvKod.jqxComboBox('getInstance') : null;
			if (ddDvKodWidget)
				divDvKod.jqxComboBox('disabled', !!this.listeWidget.getRows().length)
			this.degistimi = true;
			if (this.timer_listeDegisti) {
				clearTimeout(this.timer_listeDegisti);
				delete this.timer_listeDegisti
			}
			this.timer_listeDegisti = setTimeout(async e => {
				try { await this.liste_degisti_devam(e) }
				finally { delete this.timer_listeDegisti }
			}, 500, e)
		}
		liste_degisti_devam(e) {
			const {fis} = this;
			fis.detaylar = this.listeRecs.map(rec =>
				$.isPlainObject(rec) ? new fis.class.detaySinif(rec) : rec);
			fis.dipHesapla();
			const {dipTable} = this;
			const uiSetValue = e => {
				const ui = dipTable.find(e.selector);
				ui.html(typeof value == 'string' ? value : bedelStr(e.value || 0));
				if (!(this.fiyatGorurmu && this.bedelKullanilirmi))
					ui.parent().addClass('jqx-hidden');
				else if (e.value)
					ui.parent().removeClass('jqx-hidden');
				else if (!asBool(e.noHide))
					ui.parent().addClass('jqx-hidden');
			};
			const icmal = fis.icmal || {};
			['brut', 'topIskonto', 'topKdv', 'yuvarlamaFarki', 'sonuc'].forEach(key =>
				uiSetValue({ selector: `#${key}`, value: icmal[key] }));
			if (/*!(icmal &&*/ (icmal.topKdv || icmal.topDipIskonto))/*)*/
				uiSetValue({ selector: `#sonuc`, value: `${bedelStr(fis.sonucBedel)} ${fis.dvKod || 'TL'}`, noHide: true });
		}
		async liste_satirSecildi(e) {
			e = e || {}; await super.liste_satirSecildi(e);
			let rec = this.selectedBoundRec;
			const {app, fis, divListe} = this, {miktarGirilmezmi} = fis.class;
			const {fisGirisSadeceBarkodZorunlumu, rbkKullanilirmi} = app, index = this.selectedIndex, {lastSelectedIndex} = e;
			if (this.timer_listeSatirSecildi) { clearTimeout(this.timer_listeSatirSecildi); delete this.timer_listeSatirSecildi }
			this.timer_listeSatirSecildi = setTimeout(_e => {
				const {e} = _e; let {rec} = _e;
				try {
					if (rec)
						rec = $.isPlainObject(rec) ? fis.class.detaySinif.From(rec) : rec.deepCopy()
					const {promosyonmu} = rec.class, {degisiklikYapilmazmi} = fis.class;
					const rbkIcinUygunmu = rbkKullanilirmi && rec && rec.rbkIcinUygunmu;
					const maxMiktar = promosyonmu ? rec.miktar : null;
					if (!(fisGirisSadeceBarkodZorunlumu || rbkIcinUygunmu || degisiklikYapilmazmi || miktarGirilmezmi || promosyonmu || ((document.activeElement || {}).tagName || '').toUpperCase() == 'INPUT') && (index == lastSelectedIndex)) {
						// this.listeWidget.beginRowEdit(index);
						let elm = divListe.find(`.jqx-grid-table .listeSatir[data-index=${index}] .miktar`);
						if (elm.length) {
							if (e.event)
								e.event.stopPropagation();
							setTimeout(e => {
								let {elm} = e; let parent = elm.parent();
								if (!parent.length)
									return
								const {fis} = this, {rec} = e, fra = this.app.brm2Fra[rec.brm || 'AD'] || 0;
								let savedHTML = elm.outerHTML; elm = elm[0];
								elm.outerHTML = (
									`<form action="" autocomplete="false" readonly onfocus="this.removeAttribute('readonly')" onsubmit="javascript:return false">` +
									`	<input class="miktar" type="number"${maxMiktar == null ? '' : ` max="${maxMiktar}"`} maxlength="9" autocomplete="off" value="${roundToFra(asFloat(rec.miktar), fra) || 1}"></input>` +
									`</form>`
								);
								elm = parent.find(`.miktar`);
								// parent.parent().find(`.brm`).addClass('jqx-hidden');
								elm.off('keyup').on('keyup', evt => {
									const key = (evt.key || '').toLowerCase();
									if (key == 'enter' || key == 'linefeed')
										elm.blur()
								});
								elm.off('change').on('change', async evt => {
									let value = roundToFra(asFloat(evt.currentTarget.value.replaceAll(',', '.'), fra)) || 1;
									if (maxMiktar != null && value > maxMiktar) {
										value = maxMiktar;
										evt.currentTarget.value = value
									}
									rec.miktar = value;
									await rec.detayEkIslemler({ fis, satisKosulYapilari: this.satisKosulYapilari });
									try { this.degistir({ rec }) } catch (ex) { }
								});
								elm.off('blur').on('blur', evt => { this.listeWidget.refresh(); this.liste_degisti() });
								elm.focus(); elm.select();
							}, 100, { elm, rec, index });
						}
					}
				}
				finally { delete this.timer_listeSatirSecildi }
			}, 100, { rec, e })
		}
		liste_satirCiftTiklandi(e) {
			if (!this.isEventFired_satirCifTiklandi) {
				this.isEventFired_satirCifTiklandi = true
				return
			}
			return this.degistirIstendi()
		}
		async liste_islemTusuTiklandi(e) {
			const elm = e.event.currentTarget, id = e.id || (elm || {}).id;
			switch (elm.id) {
				case 'ekle': this.ekleIstendi(e); break
				case 'degistir': this.degistirIstendi(e); break
				case 'sil': this.silIstendi(e); break
				case 'temizle': this.temizleIstendi(e); break
				case 'birlestir': this.birlestirIstendi(e); break
				case 'barkod': this.barkodIstendi(e); break
				case 'promosyon': this.promosyonHesaplaIstendi(e); break
				case 'sablon': this.sablondanYukleIstendi(e); break
				case 'fiyatGor': this.fiyatGorIstendi(e); break
				case 'paketBoz': this.paketBozIstendi(e); break
				case 'siparistenKarsila': this.siparistenKarsilaIstendi(e); break
				case 'musteriDurumu': this.musteriDurumuIstendi(e); break
				case 'sonStoktanSec': this.sonStoktanSecIstendi(e); break
				case 'fisOzetBilgi': this.fisOzetBilgiIstendi(e); break
				case 'rbkDuzenle': this.rbkDuzenleIstendi(e); break
				case 'raporlar': this.raporlarIstendi(e); break
				case 'filter': this.liste_toggleFilterBar(e); break
				/* case 'kaydet': this.kaydetIstendi(e); break */
			}
		}
		async ekleIstendi(e) {
			e = e || {}; const batchFlag = asBool(e.batch || e.batchFlag), {app, fis} = this;
			const {degisiklikYapilmazmi, barkodGirisZorunlumu} = fis.class;
			if (degisiklikYapilmazmi) {
				displayMessage(`Bu belgeye satır eklenemez`, `@ Fiş Giriş İşlemi @`, undefined, undefined, undefined, undefined, 'top-right');
				return false
			}
			const fisGirisSadeceBarkodZorunlumu = app.fisGirisSadeceBarkodZorunlumu || barkodGirisZorunlumu;
			app.hideNotifications();
			let {barkod} = e;
			let rec = e.rec || (batchFlag ? null : this.selectedHizliStokRec);
			rec = (rec || {}).originalItem || rec;
			if (!batchFlag) {
				setTimeout(() => this.focusToDefault(), 10);
				this.focusToDefault()
			}
			const fisSinif = fis.class;
			let det = e.detay;
			if (!det && barkod) {
				barkod = barkod.trim();
				let ind = -1, carpan;
				for (const matchStr of ['x', 'X', '*']) {
					ind = barkod.indexOf(matchStr);
					if (ind > -1)
						break
				}
				if (ind > -1) {
					let miktarStr = barkod.substring(0, ind);		// substring from->to .. (to dahil degil)
					e.barkod = barkod = barkod.substring(ind + 1);
					e.carpan = carpan = asFloat(miktarStr) || null
				}
				if (fisGirisSadeceBarkodZorunlumu && (carpan && carpan != 1)) {
					app.playSound_barkodError();
					displayMessage(`Barkodlu eklemede <b>Miktar Belirtimi</b> (<i><u>3x12345</u> gibi</i>) yapamazsınız`, `@ Barkod İşlemi @`, undefined, undefined, undefined, undefined, 'top-right');
					return false
				}
				// barkod veya stok kod için ürün bul ve detay oluştur
				try {
					const barkodBilgi = await app.barkodBilgiBelirle({ barkod: barkod, carpan: carpan, fis: fis });
					if (barkodBilgi) {
						const {listeWidget} = this;
						/*if (fisGirisSadeceBarkodZorunlumu && barkodBilgi.barkod == barkodBilgi.shKod) {
							this.app.playSound_barkodError();
							displayMessage(`Barkod olarak doğrudan <b>Ürün Kodu</b> okutulamaz`, `@ Barkod İşlemi @`, undefined, undefined, undefined, undefined, 'top-right');
							return false;
						}*/
						const _barkod = barkodBilgi.barkod;
						if (barkodBilgi.ayrisimAyiraclimi && barkodBilgi.zVarmi) {
							const _det = this.ayrisimAyiracli_barkod2Detay[_barkod];
							if (_det) {
								const {uid} = _det;
								listeWidget.selectrowbykey(uid);
								let displayIndex = listeWidget.getrowdisplayindex(_det);
								let araMesaj = displayIndex < 0 ? `` : `<b>${displayIndex + 1}. satırda</b> `;
								app.playSound_barkodError();
								displayMessage(`<b>${_barkod}</b> barkoduna ait ${araMesaj}tekrar eden kalem var !`, `Barkod İşlemi`, undefined, undefined, undefined, undefined, 'top-right');
								setTimeout(async () => {
									await this.onResize();
									this.focusToDefault();
								}, 50);
								return false;
							}
						}
						const detaySinif = fisSinif.uygunDetaySinif({ rec: barkodBilgi }) || fisSinif.detaySinif;
						det = await detaySinif.fromBarkodBilgi({ fis: fis, barkodBilgi: barkodBilgi });
						app.playSound_barkodOkundu()
					}
					else {
						app.playSound_barkodError();
						displayMessage(`<u class="bold darkred">${barkod}</u> barkodu hatalıdır!`, `Barkod İşlemi`, undefined, undefined, undefined, undefined, 'top-right');
						if (!batchFlag)
							setTimeout(async () => { await this.onResize(); this.focusToDefault() }, 50)
					}
				}
				catch (ex) {
					let message = ex;
					if (ex && ex.isError)
						message = ex.errorText || ex.message
					if (message) {
						app.playSound_barkodError();
						displayMessage(message, `@ Barkod İşlemi @`, undefined, undefined, undefined, undefined, 'top-right');
						if (!batchFlag)
							setTimeout(async () => this.focusToDefault(), 50)
					}
					return false
				}
				// det = new fis.class.detaySinif({ barkod: barkod, shKod: shKod, shAdi: `${barkod} barkodundan oluştu` });
			}
			if (!det && rec) {
				if (fisGirisSadeceBarkodZorunlumu) {
					app.playSound_barkodError();
					displayMessage(`Sadece Barkod ile giriş yapılabilir`, `@ Detay Ekleme İşlemi @`, undefined, undefined, undefined, undefined, 'top-right');
					if (!batchFlag)
						setTimeout(async () => this.focusToDefault(), 50)
					return false
				}
				const detaySinif = fisSinif.uygunDetaySinif({ rec: rec }) || fisSinif.detaySinif;
				det = $.isPlainObject(rec) ? new detaySinif($.extend({}, rec, { fis: fis })) : rec.deepCopy()
			}
			if (det) {
				for (const key of ['uid', '_visible'])
					delete det[key]
				// this.focusToDefault();
				await det.detayEkIslemler_ekle({ fis: fis, satisKosulYapilari: this.satisKosulYapilari });
				// this.fis.detaylar.push(det);
				await this.ekle({ rec: det });
				setTimeout(() => {
					if (app.rbkKullanilirmi && det.rbkIcinUygunmu && app.fisGirisiRbkOtomatikAcilsinmi) { this.rbkDuzenleIstendi({ rec: det }) }
				}, 100);
				if (!batchFlag) {
					// let rec = this.selectedRec;				// selectrowbykey sırasında event tetikleniyor
					setTimeout(() => {
						this.selectLastRec();
						if (this.baslikNavBarCollapseInitFlag) {
							// setTimeout(() => this.onResize(e), 150)
						}
						else {
							this.baslikNavBarCollapseInitFlag = true;
							this.baslik_navBar.jqxNavigationBar('collapseAt', 0);
							setTimeout(() => this.onResize(e), 300)
						}
						// this.focusToDefault()
					}, 100)
				}
			}
			if (!batchFlag)
				setTimeout(() => this.focusToDefault(), 50)
		}
		async degistirIstendi(e) {
			e = e || {}; let rec = e.rec || this.selectedBoundRec, det = rec;
			if (det) {
				det.cacheReset();
				det = $.isPlainObject(det) ? this.fis.class.detaySinif.From(det) : det.deepCopy()
			}
			if (!det)
				return
			// delete det.uid;
			const {app} = this;
			/*if (app.fisGirisSadeceBarkodZorunlumu) {
				displayMessage(`Sadece Barkod ile giriş yapılabilir, değişiklik yapamazsınız`, `@ Detay Değiştir İşlemi @`, undefined, undefined, undefined, undefined, 'top-right');
				return false;
			}*/
			if (det.class.promosyonmu && !app.serbestModmu) { displayMessage(`<b>Promosyon</b> satırı <u>DEĞİŞTİRME</u> yetkiniz yok`, `! Değiştir İşlemi !`); return }
			let wnd = this.degistirEkrani; if (wnd) wnd.jqxWindow('close')
			const {layout, windows} = this, wndContent = layout.find('#degistirEkrani').contents('div').clone(true); wndContent.addClass(`part ${this.rootAppName} ${this.appName} ${this.partName}`);
			await this.aboutToDeactivate(e);
			wnd = createJQXWindow(
				wndContent, 'Değiştir',
				{ isModal: true, width: '100%', height: 410, position: { x: 0, y: $(window).width() < 450 ? 0 : 43 } },
				{
					TAMAM: (dlgUI, btnUI) => this.degistirIstendiDevam({ dlgUI: dlgUI, wnd: wnd, content: wndContent, detay: det }),
					VAZGEC: (dlgUI, btnUI) => dlgUI.jqxWindow('close')
				}
			);
			for (const target of [this, windows])
				target.degistirEkrani = wnd
			wnd.off('close').on('close', evt => {
				$(evt.target).jqxWindow('destroy');
				for (const target of [this, windows])
					delete target.degistirEkrani
				setTimeout(() => { this.aboutToActivate(e); this.onResize(e); this.focusToDefault() }, 150)
			});
			this.degistirEkrani_initLayout({ wnd: wnd, content: wndContent, detay: det })
		}
		async degistirEkrani_initLayout(e) {
			const det = e.detay, {content} = e, {app, param, fis, fiyatGorurmu, bedelKullanilirmi} = this, {dovizlimi} = fis;
			const {miktarGirilmezmi} = fis.class, {promosyonmu} = det.class, degisiklikYapilmazmi = fis.class.degisiklikYapilmazmi || promosyonmu;
			const {fisGirisSadeceBarkodZorunlumu, rbkKullanilirmi, detaylardaFiyatDegistirilirmi, kdvDegiskenmi, iskSayi, ozelKampanyaKullanilirmi, ozelKampanyaOranSayisi} = app;
			const fiyatFra = dovizlimi ? app.dvFiyatFra : app.fiyatFra, kadIskKullanilirmi = !$.isEmptyObject(det.kadIskYapi);
			const satirIskOranSinir = det.class.promosyonmu ? 0 : (asFloat(det.satirIskOranSinirUyarlanmis) || 0);
			const iskKullanilirmi = satirIskOranSinir > 0 && app.iskontoArttirilirmi, rbkIcinUygunmu = rbkKullanilirmi && det.rbkIcinUygunmu;
			let kadIskOranParent_hiddenState, iskOranParent_hiddenState, iskOranlarStrParent_hiddenState;
			const mfDegisti = evt => {
				const kadIskOranParent = content.find('#kadIskOranParent'), divKadIskOranText = kadIskOranParent?.length ? kadIskOranParent.find('.veri') : null;
				const iskOranParent = content.find('#iskOranParent'), iskOranlarStrParent = content.find('#iskOranlarStrParent');
				const {malFazlasi} = det, mfParent = content.find('#mfParent');
				if (malFazlasi) {
					mfParent.find('#mf').html((malFazlasi || 0).toLocaleString());
					mfParent.removeClass('jqx-hidden');
					if (kadIskOranParent?.length) { if (kadIskOranParent_hiddenState == null) kadIskOranParent_hiddenState = kadIskOranParent.hasClass('jqx-hidden'); kadIskOranParent.addClass('jqx-hidden') }
					if (iskOranParent?.length) { if (iskOranParent_hiddenState == null) iskOranParent_hiddenState = iskOranParent.hasClass('jqx-hidden'); iskOranParent.addClass('jqx-hidden') }
					if (iskOranlarStrParent?.length) { if (iskOranlarStrParent_hiddenState == null) iskOranlarStrParent_hiddenState = iskOranlarStrParent.hasClass('jqx-hidden'); iskOranlarStrParent.addClass('jqx-hidden') }
				}
				else {
					mfParent.addClass('jqx-hidden');
					if (kadIskOranParent && kadIskOranParent.length) { if (kadIskOranParent_hiddenState === false) kadIskOranParent.removeClass('jqx-hidden') }
					if (iskOranParent && iskOranParent.length) { if (iskOranParent_hiddenState === false) iskOranParent.removeClass('jqx-hidden') }
					if (iskOranlarStrParent && iskOranlarStrParent.length) { if (iskOranlarStrParent_hiddenState === false) iskOranlarStrParent.removeClass('jqx-hidden') }
					iskOranParent_hiddenState = iskOranlarStrParent_hiddenState = null
				}
				if (divKadIskOranText?.length) { divKadIskOranText.html(`%${det.kadIskOran || 0}`) }
				if (!det.iskOranVarmi) {
					let elm = iskOranParent ? iskOranParent.find(`.iskOran`) : null; if (elm && elm.length) elm.jqxNumberInput('value', 0)
					elm = iskOranlarStrParent ? iskOranlarStrParent.find(`#iskOranlarStr`) : null; if (elm?.length) elm.html('')
				}
			};
			let fra = app.brm2Fra[det.brm || 'AD'] || 0, urunKA = new CKodVeAdi({ kod: det.shKod, aciklama: det.shAdi });
			content.find('#urun').html(urunKA.parantezliOzet({ styled: true }));
			let uiMiktar = content.find(`#miktar`).jqxNumberInput({
				theme, width: 150, inputMode: 'simple', min: 0.1, max: 99999.99999, decimalDigits: fra, spinButtons: true, spinButtonsWidth: 32,
				decimal: roundToFra(det.miktar, fra) || 0, disabled: (fisGirisSadeceBarkodZorunlumu || degisiklikYapilmazmi || miktarGirilmezmi || rbkIcinUygunmu)
			});
			const miktarDegisti = async evt => {
				if (fisGirisSadeceBarkodZorunlumu || degisiklikYapilmazmi || miktarGirilmezmi || rbkIcinUygunmu) return
				const value = roundToFra(uiMiktar.jqxNumberInput('numberInput').val(), fra) || 0; $(evt.target).parent().jqxNumberInput('decimal', value);
				det.miktar = value; await this.degistirIstendiDevam_detaySetValues(e); mfDegisti(evt)
			};
			$(uiMiktar.parent().find(`input`))
				.off('focus').on('focus', evt => evt.target.select())
				.off('change').on('change', evt => miktarDegisti(evt))
				.off('blur').on('blur', evt => miktarDegisti(evt))
				.off('keyup').on('keyup', evt => {
					const key = (evt.key || '').toLowerCase();
					if (key == 'enter' || key == 'linefeed')
						miktarDegisti(evt);
				});
			const miktarActionButtons = uiMiktar.parent().find('.jqx-action-button');
			miktarActionButtons.off('click, touchend');
			miktarActionButtons.on('click', evt => miktarDegisti(evt));
			miktarActionButtons.on('touchend', evt => miktarDegisti(evt));
			mfDegisti(); content.find('#brm').html(det.brm || 'AD');
			const isKdvEditable = !fis.yildizlimi && (detaylardaFiyatDegistirilirmi || kdvDegiskenmi);
			let uiKdvOrani = content.find(`#kdvOrani`).jqxDropDownList({
				theme: theme, animationType: animationType, width: 100, height: 35,
				disabled: !isKdvEditable, valueMember: 'kod', displayMember: 'aciklama',
				selectedIndex: 0, checkboxes: false, filterable: false, searchMode: 'containsignorecase',
				placeHolder: 'Seçiniz:', filterPlaceHolder: 'Bul:', scrollBarSize: 25,
				dropDownHeight: 140, autoDropDownHeight: true, itemHeight: 45,
				renderer: (index, aciklama, kod) => `<div class="kdvOrani listeSatir degistirEkrani ${this.partName} ${this.appName} ${this.rootAppName}">${aciklama}</div>`,
				source: [
					new CKodVeAdi({ kod: '20', aciklama: '20%' }), new CKodVeAdi({ kod: '10', aciklama: '10%' }),
					new CKodVeAdi({ kod:  '1', aciklama:  '1%' }), new CKodVeAdi({ kod:  '0', aciklama:  '0%' })
				]
			});
			uiKdvOrani.val(det.kdvOrani || 0);
			uiKdvOrani.off('change').on('change', evt => {
				let value = evt.args?.item?.value ?? null; if (value == null) value = uiKdvOrani.val();
				det.kdvOrani = asInteger(value); this.degistirIstendiDevam_detaySetValues(e)
			});
			let uiFiyat = content.find('#fiyat'); if (!detaylardaFiyatDegistirilirmi) { uiFiyat.attr('disabled', '') } uiFiyat.val(toStringWithFra(det.fiyat, fiyatFra));
			let btnKdvAyir = content.find('#kdvAyir').jqxButton({ theme, width: 100, height: 35 });
			btnKdvAyir.off('click').on('click', evt => {
				/*const {app} = sky, kdvlimi = fis.yildizlimi ? app.yildizFiyatKdvlimi : app.stokFiyatKdvlimi;*/
				let {kdvOrani, fiyat} = det; if (kdvOrani) {
					const kdv = det.kdv = (fiyat * kdvOrani / (100 + kdvOrani)); fiyat = det.fiyat = roundToFra(fiyat - kdv, fiyatFra);
					(async evt => { await det.bedelHesapla(e); this.degistirIstendiDevam_detaySetValues(e); mfDegisti(evt) })(evt)
				}
			});
			if (fiyatGorurmu && bedelKullanilirmi) {
				content.find('.dvKod').html(dovizlimi ? fis.dvKod : 'TL');
				content.find(`#fiyatParent, #bedelParent`).removeClass('jqx-hidden');
				const fiyatDegisti = evt => {
					let text = evt.target.value || uiFiyat.val(); if (text) text = text.replace(',', '.')
					let value = roundToFra(text, fiyatFra) || 0; if (value < (det.enDusukFiyat || 0.1) || value > 9999999.999999) value = det.fiyat
					uiFiyat.val(toStringWithFra(value, fiyatFra)); det.fiyat = value; det.ozelFiyatVarmi = !!value;
					this.degistirIstendiDevam_detaySetValues(e)
				};
				uiFiyat.attr('maxLength', 17).off('focus').on('focus', evt => evt.target.select()).off('change, blur').on('change, blur', evt => fiyatDegisti(evt))
			}
			else {content.find(`#fiyatParent, #bedelParent`).addClass('jqx-hidden')}
			const _kadIskOranParent = content.find('#kadIskOranParent');
			if (_kadIskOranParent?.length) _kadIskOranParent[kadIskKullanilirmi ? 'removeClass' : 'addClass']('jqx-hidden')
			if (iskKullanilirmi && !degisiklikYapilmazmi && (satirIskOranSinir == 100 || !det.ozelIskontoVarmi)) {
				const iskOranParent = content.find(`#iskOranParent`); iskOranParent.removeClass('jqx-hidden'); content.find(`#iskOranlarStrParent`).addClass('jqx-hidden');
				const uiIskOranListe = iskOranParent.find(`input.iskOran`);
				for (let i = 1; i <= uiIskOranListe.length; i++) {
					let uiIskOran = uiIskOranListe.eq(i - 1);
					if (i > iskSayi) {
						uiIskOran.addClass('jqx-hidden');
						if (i > 1)
							uiIskOran.prev().addClass('jqx-hidden');
						continue;
					}
					
					uiIskOran = uiIskOran.jqxNumberInput({
						disabled: !iskKullanilirmi || degisiklikYapilmazmi,
						theme: theme, width: 140, inputMode: 'simple',
						min: 0, max: satirIskOranSinir,
						decimalDigits: 2, spinButtons: true, spinButtonsWidth: 30,
						decimal: roundToFra(det[`iskOran${i}`], 2) || 0
					});
					const iskOranDegisti = evt => {
						let target = $(evt.target);
						let index = target.data('index');
						if (index == null)
							index = target.parent().find('input').data('index');
						
						let value = roundToFra(evt.target.value || uiIskOran.jqxNumberInput('decimal'), 2) || 0;
						let uygunmu = value <= satirIskOranSinir;
						if (uygunmu) {
							det[`iskOran${index}`] = value;
							
							const {iskOranListe} = det;
							let yuzdeKalan = 100;
							for (const j in iskOranListe) {
								const _oran = iskOranListe[j];
								if (_oran) {
									const oran = roundToFra(_oran * yuzdeKalan / 100, 2);
									yuzdeKalan = bedel(yuzdeKalan - oran);
								}
							}
							const ortIskOran = roundToFra(100 - yuzdeKalan, 2);
							if (ortIskOran > 100 || ortIskOran > satirIskOranSinir)
								uygunmu = false;
						}

						if (!uygunmu) {
							value = 0;
							//det[`iskOran${index}`] = evt.target.value = 0;
							//this.degistirIstendiDevam_detaySetValues(e);
							//return;
						}
						target.parent().jqxNumberInput('decimal', value);
						det[`iskOran${index}`] = value;
						det.ozelIskontoVarmi = false;
						this.degistirIstendiDevam_detaySetValues(e);
					};
					uiIskOran.parent().find(`#iskOran${i} input`)
						.data('index', i)
						.attr('maxLength', 4)
						.off('focus').on('focus', evt => evt.target.select())
						.off('change, blur').on('change, blur', evt => iskOranDegisti(evt));
					uiIskOran.parent().find(`#iskOran${i} .jqx-action-button`)
						.off('click, touchend').on('click, touchend', evt => iskOranDegisti(evt));
				}
			}
			else {
				content.find(`#iskOranParent`).addClass('jqx-hidden');
				const iskOranlarStrParent = content.find(`#iskOranlarStrParent`);
				if (det.ozelIskontoVarmi)
					iskOranlarStrParent.removeClass('jqx-hidden')
				
				const divIskOranlarStr = iskOranlarStrParent.find(`#iskOranlarStr`);
				const {iskOranListe} = det;
				if ($.isEmptyObject(iskOranListe))
					divIskOranlarStr.html('')
				else
					divIskOranlarStr.html(`%${iskOranListe.join(' + ')}`)
			}

			const ozelKampanyaKodParent = content.find(`#ozelKampanyaKodParent`);
			if (ozelKampanyaKullanilirmi && !degisiklikYapilmazmi) {
				const ozelKampanyaDegisti = async _e => {
					const ozelKampanyaOranParent = content.find(`#ozelKampanyaOranParent`);
					if (det.ozelKampanyaKod) {
						if (det.ozelKampanyaKod && det.ozelKampanyaIskSinir == null)
							await det.ozelKampanyaIskOranSinirBul();
						const ozelKampanyaIskSinir = det.ozelKampanyaIskSinir || 0;
						
						ozelKampanyaOranParent.removeClass('jqx-hidden');
						const uiOzelKamOranListe = content.find(`.ozelKampanyaOran`);
						for (let i = 1; i <= uiOzelKamOranListe.length; i++) {
							let uiOzelKamOran = uiOzelKamOranListe.eq(i - 1);
							if (i > ozelKampanyaOranSayisi) {
								uiOzelKamOran.addClass('jqx-hidden');
								if (i > 1)
									uiOzelKamOran.prev().addClass('jqx-hidden');
								continue;
							}
							
							uiOzelKamOran = uiOzelKamOran.jqxNumberInput({
								disabled: !ozelKampanyaIskSinir,
								theme: theme, width: 140, inputMode: 'simple',
								min: 0, max: ozelKampanyaIskSinir,
								decimalDigits: 2, spinButtons: true, spinButtonsWidth: 30,
								decimal: roundToFra(det[`ozelKampanyaOran${i}`], 2) || 0
							});
							const ozelKamOranDegisti = evt => {
								let target = $(evt.target);
								let index = target.data('index');
								if (index == null)
									index = target.parent().find('input').data('index');
								
								let value = roundToFra(evt.target.value || uiOzelKamOran.jqxNumberInput('decimal'), 2) || 0;
								let uygunmu = value <= ozelKampanyaIskSinir;
								if (uygunmu) {
									det[`ozelKampanyaOran${index}`] = value;
									
									const {ozelKamOranListe} = det;
									let yuzdeKalan = 100;
									for (const j in ozelKamOranListe) {
										const _oran = ozelKamOranListe[j];
										if (_oran) {
											const oran = roundToFra(_oran * yuzdeKalan / 100, 2);
											yuzdeKalan = bedel(yuzdeKalan - oran);
										}
									}
									const ortIskOran = roundToFra(100 - yuzdeKalan, 2);
									if (ortIskOran > 100 || ortIskOran > ozelKampanyaIskSinir)
										uygunmu = false;
								}
		
								if (!uygunmu) {
									value = 0;
									//det[`ozelKampanyaOran${index}`] = evt.target.value = 0;
									//this.degistirIstendiDevam_detaySetValues(e);
									//return;
								}
								target.parent()
									.jqxNumberInput('decimal', value);
								det[`ozelKampanyaOran${index}`] = value;
								// det.ozelIskontoVarmi = false;
								this.degistirIstendiDevam_detaySetValues(e);
							};
							uiOzelKamOran.parent().find(`#ozelKampanyaOran${i} input`)
								.data('index', i)
								.attr('maxLength', 4)
								.off('focus').on('focus', evt => evt.target.select())
								.off('change, blur').on('change, blur', evt => ozelKamOranDegisti(evt));
							uiOzelKamOran.parent().find(`#ozelKampanyaOran${i} .jqx-action-button`)
								.off('click, touchend').on('click, touchend', evt => ozelKamOranDegisti(evt));
						}
					}
					else {
						ozelKampanyaOranParent.addClass('jqx-hidden');
					}
				};
				
				const ddOzelKampanyaKod = ozelKampanyaKodParent.find(`#ozelKampanyaKod`);
				let part = new CETMstComboBoxPart({
					parentPart: this, content: ddOzelKampanyaKod,
					// layout: layout.find('.hizliStok'),
					placeHolder: `Özel Kampanya`, listedenSecilmezFlag: true,
					listeSinif: CETKAListePart, table: 'mst_OzelKampanya',
					idSaha: 'kod', adiSaha: 'aciklama',
					selectedId: det.ozelKampanyaKod,
					widgetDuzenleyici: e => {
						/*savedParentWidth = e.widgetArgs.width = savedParentWidth || (
							e.widgetArgs.width - (divEtiket.width() ||  0) );
						e.widgetArgs.dropDownWidth = e.widgetArgs.width;*/
					},
					events: {
						comboBox_itemSelected: async _e => {
							const {id} = _e;
							if (det.ozelKampanyaKod != id) {
								det.ozelKampanyaKod = id;
								det.ozelKampanyaOranReset();
								// det.ozelIskontoVarmi = false;
								// await det.ozelKampanyaIskOranSinirBul(e);
								await this.degistirIstendiDevam_detaySetValues(e);
								await ozelKampanyaDegisti(_e);
							}
						}
					}
				});
				ozelKampanyaKodParent.removeClass('jqx-hidden'); await part.run();
				await ozelKampanyaDegisti()
			}
			else { ozelKampanyaKodParent.addClass('jqx-hidden') }
			await det.ekOzelliklerDo({ callback: async _e => {
				const {fis} = this;
				const rafmi = _e.tip == 'raf';
				const refRafmi = _e.tip == 'refRaf';
				const detYermi = _e.tip == 'yer';
				if (rafmi && !fis.class.rafKullanilirmi)
					return true;			// continue loop
				if (refRafmi && !fis.class.refRafKullanilirmi)
					return true;			// continue loop
				if (detYermi && !fis.class.detYerKullanilirmi)
					return true;			// continue loop
				
				const ekOzellik = _e.item;
				await ekOzellik.appendPartsInto({
					parentPart: this, content: content,
					disabled: (degisiklikYapilmazmi || rbkIcinUygunmu || (fisGirisSadeceBarkodZorunlumu && !(rafmi || refRafmi))),
					events: {
						valueChanged: _e => {
							// det[_e.sender.idSaha] = _e.value;
							const {tip} = _e.sender;
							det.cacheReset();
							if (_e.oldValue != _e.value)
								det.siparisKarsilamaYapiReset();
							this.degistirIstendiDevam_detaySetValues(e);
						}
					},
					widgetArgs: {
						listedenSecilmezFlag: true
					},
					widgetEvents: {
						comboBox_stmDuzenleyici: e => {
							if (degisiklikYapilmazmi || rbkIcinUygunmu || (fisGirisSadeceBarkodZorunlumu && !(rafmi || refRafmi))) {
								e.stm.sentDo(sent =>
									sent.where.add(`1 = 2`));
							}
							if (rafmi) {
								const alias = e.alias || 'mst';
								const {yerKod} = fis;
								/*if (!yerKod)
									return false;*/
								if (yerKod) {
									e.stm.sentDo(sent =>
										sent.where.degerAta(yerKod, `${alias}.yerKod`));
								}
							}
							if (refRafmi) {
								const alias = e.alias || 'mst';
								const {refYerKod} = fis;
								/*if (!refYerKod)
									return false;*/
								if (refYerKod) {
									e.stm.sentDo(sent =>
										sent.where.degerAta(refYerKod, `${alias}.yerKod`));
								}
							}
						}
						/*listedenSec_ekArgs: {
							secince: _e => {
								//e.rec = e.det;
								//this.degistirIstendi(e)
							},
							geriCallback: _e => {
								//e.rec = e.det;
								//this.degistirIstendi(e)
							}
						}*/
					}
				})
			} });

			if (!(fiyatGorurmu && bedelKullanilirmi)) {
				// const keys = $.merge((det.class.ticariSahaKeys || []), [`iskOran`]);
				const keys = det.class.ticariSahaKeys;
				for (const i in keys) {
					const selector = keys[i];
					let elm = content.find(`#${selector}`);
					if (elm && elm.length)
						elm.addClass('jqx-hidden');
					elm = content.find(`#${selector}Parent`);
					if (elm && elm.length)
						elm.addClass('jqx-hidden');
				}
			}

			const {wnd} = e;
			content.find(`input:not(.jqx-combobox-input):not([type=hidden])`)
				.off('focus').on('focus', evt =>
					evt.target.select())
				.off('keyup').on('keyup', evt => {
					const key = (evt.key || '').toLowerCase();
					if (key == 'enter' || key == 'linefeed') {
						if (wnd && wnd.length) {
							miktarDegisti(evt);
							wnd.find(`.ui-dialog-button[value=TAMAM]`).click();
						}
					}
				});
			
			await this.degistirIstendiDevam_detaySetValues(e);
			
			let msecList = [500];
			for (const mSec of msecList) {
				setTimeout(() => {
					if (wnd && wnd.length)
						wnd.focus();
					content.find(`#miktar input`)
						.focus();
				}, mSec);
			}
		}
		async degistirIstendiDevam(e) {
			const {content} = e;
			const det = e.detay;
			const {app, fis, listeWidget} = this;
			const {param} = app;
			const {dovizlimi, dvKod} = fis;
			const fiyatFra = dovizlimi ? app.dvFiyatFra : app.fiyatFra;
			
			det.cacheReset();
			await this.degistirIstendiDevam_detaySetValues(e);

			const satirIskOranSinir = asFloat(det.satirIskOranSinirUyarlanmis) || 0;
			const iskKullanilirmi = satirIskOranSinir > 0 && (app.iskontoArttirilirmi && fis.class.dipIskBedelKullanilirmi);
			if (iskKullanilirmi) {
				if (!det.ozelIskontoVarmi && satirIskOranSinir < 100) {
					let topIskOran = 0;
					let yuzdeKalan = 100;
					let proc = oranListe => {
						(oranListe || []).forEach(oran => {
							if (oran) {
								let _oran = roundToFra(oran * yuzdeKalan / 100, 2);
								topIskOran = roundToFra(topIskOran + _oran, 2);
								yuzdeKalan = roundToFra(yuzdeKalan - _oran);
							}
						});
					};
					proc(det.iskOranListe);
					proc(det.kamOranListe);

					if (topIskOran > satirIskOranSinir) {
						displayMessage(
							`İskonto Oran toplamı (%${topIskOran}) , izin verilenden (%${satirIskOranSinir}) daha fazla`,
							`@ ${app.appText} @`);
						return
					}
				}
			}
			/*else {
				let proc = oranKeys => {
					(oranKeys || []).forEach(key => {
						let oran = det[key];
						if (oran)
							det[key] = oran = 0;
					});
				};
				proc(det.class.iskOranKeys);
				proc(det.class.kamOranKeys);
			}*/
			
			const {enDusukFiyat, fiyat} = det;
			if (enDusukFiyat && fiyat < enDusukFiyat) {
				displayMessage(
					`Girilen Fiyat (${toStringWithFra(fiyat, fiyatFra)} TL) , izin verilenden (${toStringWithFra(enDusukFiyat, fiyatFra)} ${dvKod || 'TL'}) daha düşük`,
					`@ ${app.appText} @`);
				return
			}
			
			const {dlgUI} = e;
			if (dlgUI && dlgUI.length)
				dlgUI.jqxWindow('close');
			
			const _rec = listeWidget.rowsByKey[det.uid];
			if (_rec)
				_rec.cacheReset();
			await this.degistir({ rec: det })
		}
		async degistirIstendiDevam_detaySetValues(e) {
			const {app} = sky, {fis} = this, fiyatFra = fis.dovizlimi ? app.dvFiyatFra : app.fiyatFra, {content} = e;
			const det = e.detay; await det.detayEkIslemler({ fis: this.fis, satisKosulYapilari: this.satisKosulYapilari });
			content.find(`#fiyat`).val(det.fiyat || 0); content.find(`#bedel`).html(bedelStr(det.netBedel || 0))
		}
		async silIstendi(e) {
			// this.focusToDefault();
			const {app, fis, selectedIndex} = this;
			const {degisiklikYapilmazmi} = fis.class;
			app.hideNotifications();
			
			if (degisiklikYapilmazmi) {
				displayMessage(`Bu belgeden satır silinemez`, `@ Fiş Giriş İşlemi @`, undefined, undefined, undefined, undefined, 'top-right');
				setTimeout(() => this.focusToDefault(), 10);
				return false
			}
			
			await this.sil();
			if (selectedIndex && selectedIndex > 0)
				this.listeWidget.selectRow(selectedIndex - 1)

			setTimeout(() => this.focusToDefault(), 10)
		}
		temizleIstendi(e) {
			const {app, fis} = this;
			const {degisiklikYapilmazmi} = fis.class;
			app.hideNotifications();
			
			if (degisiklikYapilmazmi) {
				displayMessage(`Bu belgeden silme işlemi yapılamaz`, `@ Fiş Giriş İşlemi @`, undefined, undefined, undefined, undefined, 'top-right');
				setTimeout(() => this.focusToDefault(), 10);
				return false
			}
			
			let wnd = displayMessage(
				'<p class="red">Tüm Detaylar SİLİNECEK!</p><p>Devam Edilsin mi?</p>',
				app.appText,
				true,
				{
					EVET: async (dlgUI, btnUI) => {
						dlgUI.jqxWindow('destroy');
						await this.temizle();
						setTimeout(() => this.focusToDefault(), 10)
					},
					HAYIR: (dlgUI, btnUI) => {
						dlgUI.jqxWindow('destroy');
						setTimeout(() => this.focusToDefault(), 10)
					}
				}
			);
			wnd.off('close').on('close', evt => {
				// dlgUI.jqxWindow('destroy');
				// this.focusToDefault()
			})
		}
		birlestirIstendi(e) {
			this.birlestir();
			setTimeout(() => this.focusToDefault(), 10)

			/*let wnd = displayMessage(
				`<p class="red">Aynı özellikteki Detaylar birleştirilecek.</p><p>Devam Edilsin mi?</p>`,
				this.app.appText,
				true,
				{
					EVET: async (dlgUI, btnUI) => {
						dlgUI.jqxWindow('destroy');
						await this.birlestir();
						this.focusToDefault();
					},
					HAYIR: (dlgUI, btnUI) =>
						dlgUI.jqxWindow('destroy')
				});
			wnd.on('close', evt => {
				// dlgUI.jqxWindow('destroy');
				this.focusToDefault();
			})*/
		}
		async promosyonHesaplaIstendi(e) {
			await this.promosyonHesapla();
			setTimeout(() => this.focusToDefault(), 10)
			
			/*let wnd = displayMessage(
				`<p>Promosyonlar hesaplanacak.</p><p>Devam Edilsin mi?</p>`,
				this.app.appText,
				true,
				{
					EVET: async (dlgUI, btnUI) => {
						dlgUI.jqxWindow('destroy');
						await this.promosyonHesapla();
						this.focusToDefault();
					},
					HAYIR: (dlgUI, btnUI) =>
						dlgUI.jqxWindow('destroy')
				});
			wnd.on('close', evt => {
				// dlgUI.jqxWindow('destroy');
				this.focusToDefault();
			})*/
		}
		async barkodIstendi(e) {
			e = e || {}; const layout = this.layout, barkodContainer = layout.find('#barkodContainer');
			let {barcodeReader} = this; if (!barcodeReader) {
				const deviceClass = CETBarkodDevice.defaultDeviceClass; if (!deviceClass) { return }
				barcodeReader = this.barcodeReader = new deviceClass({
					content: barkodContainer, debug: this.app.class.isDebug, onKamerami: this.app.onKamerami,
					readCallback: e => {
						const barkod = e.result; this.hizliStokPart.text = barkod;
						this.hizliStok_itemSelected({ value: barkod }); this.focusToDefault()
					}
				})
			}
			if (!barcodeReader.initFlag || barcodeReader.isReady) { await barcodeReader.start() } else { await barcodeReader.destroy() }
			let elm = e.event?.currentTarget; if (elm) { elm = $(elm); elm.removeClass(`ready paused running`); elm.addClass(barcodeReader.state) }
			setTimeout(() => this.focusToDefault(), 10)
		}
		async fiyatGorIstendi(e) {
			e = e || {}; const rec = this.selectedBoundRec || {};
			const barcodeReader = this.barcodeReader;
			if (barcodeReader && !barcodeReader.isReady) {
				// await barcodeReader.destroy();
				this.layout.find('li#barkod').click();
			}
			
			return (await CETFiyatGorPart.run({
				parentPart: this,
				mustKod: this.fis.mustKod,
				stokKod: rec.shKod,
				geriCallback: e => {
					setTimeout(() => {
						this.onResize(e);
						this.focusToDefault(e)
					}, 150)
				},
				events: {
					barcodeReaderBeforeActivated: e => {
						const {barcodeReader} = this;
						if (barcodeReader && !barcodeReader.isReady) {
							// await barcodeReader.destroy();
							this.layout.find('li#barkod').click();
						}
					}
				}
			})).part
		}
		async sablondanYukleIstendi(e) {
			e = e || {};
			let sent = new MQSent({
				from: `mst_SablonFis`,
				sahalar: 'COUNT(*) sayi'
			});
			const fis = this.fis;
			let sayi = asInteger(await fis.dbMgr.tekilDegerExecuteSelect({ query: sent }));
			if (!sayi) {
				displayMessage(
					`Bu Belge Tipi (<i><b>${fis.class.adimTipi}</b> - ${fis.class.aciklama}</i>) için hiç Tanımlı Şablon bulunamadı`,
					`@ Şablondan Bilgi Yükle @`);
				return false;
			}

			await new CETKAListePart({
				parentPart: this, /* template: this.app.templates.cetListeOrtak, */
				table: `mst_SablonFis`, idSaha: `rowid`, adiSaha: `aciklama`,
				geriCallback: e => {
					setTimeout(() => {
						this.liste_hideFilterBar(e);
						this.onResize(e);
						this.focusToDefault(e);
					}, 150)
				},
				secince: e =>
					setTimeout(() => this.sablondanYukleIstendiDevam(e), 10),
				liste_stmDuzenleyici: e => {
					e.stm.sentDo(sent =>
						sent.where.degerAta(this.fis.class.adimTipi, `mst.etAdimTipi`))
				}
			}).run();
		}
		paketBozIstendi(e) {
			this.paketBoz(e)
		}
		siparistenKarsilaIstendi(e) {
			this.siparistenKarsila(e)
		}
		async musteriDurumuIstendi(e) {
			const {mustKod} = this.fis;
			return await new CETMusteriDurumuPart({
				parentPart: this,
				mustKod: mustKod,
				from: `fisGiris`,
				geriCallback: _e => {
					setTimeout(() => {
						this.liste_hideFilterBar(e);
						this.onResize(e);
						this.focusToDefault(e);
					}, 150)
				}
			}).run();
		}
		async sonStoktanSecIstendi(e) {
			e = e || {}; const {app, fis} = this;
			const {degisiklikYapilmazmi, barkodGirisZorunlumu} = fis.class;
			const fisGirisSadeceBarkodZorunlumu = app.fisGirisSadeceBarkodZorunlumu || barkodGirisZorunlumu;
			let _rec = e.rec || this.selectedBoundRec, detay = _rec;
			if (detay)
				detay = $.isPlainObject(detay) ? fis.class.detaySinif.From(detay) : detay;
			if (!detay)
				return
			detay.cacheReset(); e.detay = detay;
			if (detay.class.promosyonmu && !app.serbestModmu) {
				displayMessage(
					`<b>Promosyon</b> satırı <u>DEĞİŞTİRME</u> yetkiniz yok`,
					`! Son Stoktan Seç İşlemi !`
				);
				return
			}
			const secince = async _e => await this.sonStoktanSecIstendiDevam_kayitSecildi($.extend({ fis: fis, detay: detay }, _e));
			await this.aboutToDeactivate(e);
			return await CETSonStoktanSecPart.run({
				parentPart: this, fis, detay, from: 'fisGiris',
				secince: degisiklikYapilmazmi || fisGirisSadeceBarkodZorunlumu ? null : secince,
				geriCallback: _e => { setTimeout(() => { this.liste_hideFilterBar(e); this.onResize(e); this.focusToDefault(e) }, 150) }
			})
		}
		async sonStoktanSecIstendiDevam_kayitSecildi(e) {
			try {
				let {detay} = e;
				if (!detay) return
				const {app, fis} = this, {degisiklikYapilmazmi, barkodGirisZorunlumu} = fis.class;
				const fisGirisSadeceBarkodZorunlumu = app.fisGirisSadeceBarkodZorunlumu || barkodGirisZorunlumu;
				if (fisGirisSadeceBarkodZorunlumu) {
					displayMessage(`Sadece Barkod ile giriş yapılabilir, Son Stoktan Seçim yapamazsınız`, `@ Son Stoktan Seç İşlemi @`, undefined, undefined, undefined, undefined, 'top-right');
					return false
				}
				const orjDetay = detay, {sender, rec} = e, {detayEkleFlag, miktarAlinsinFlag} = sender;
				if (detayEkleFlag) {
					detay = $.isPlainObject(rec) ? await fis.class.detaySinif.fromBarkodBilgi({ fis: fis, barkodBilgi: rec }) : rec;
					detay.miktar = (miktarAlinsinFlag ? rec.sonStok : orjDetay.miktar) || 1;
					delete detay.barkodParser;
					await this.ekleIstendi({ detay: detay })
				}
				else {
					detay.cacheReset();
					if (miktarAlinsinFlag)
						detay.miktar = rec.sonStok || 1
					await detay.ekOzelliklerDo({ callback: async _e => {
						const rafmi = _e.tip == 'raf', refRafmi = _e.tip == 'refRaf', detYermi = _e.tip == 'yer';
						if (rafmi && !fis.class.rafKullanilirmi)
							return true			// continue loop
						if (refRafmi && !fis.class.refRafKullanilirmi)
							return true			// continue loop
						if (detYermi && !fis.class.detYerKullanilirmi)
							return true			// continue loop
						const ekOzellik = _e.item, {idSaha} = ekOzellik;
						for (const key in rec) {
							const value = rec[key];
							if (value != null && key == idSaha)
								ekOzellik.value = value
						}
					} });
					const {listeWidget} = this, _rec = listeWidget.rowsByKey[detay.uid];
					if (_rec)
						_rec.cacheReset()
					await this.degistir({ rec: detay })
				}
			}
			finally { setTimeout(() => { this.liste_hideFilterBar(e); this.onResize(e); this.focusToDefault(e) }, 150) }
		}
		async fisOzetBilgiIstendi(e) {
			await this.birlestir(e); await this.aboutToDeactivate(e);
			return await new CETFisOzetBilgiPart({
				parentPart: this,
				from: `fisGiris`,
				geriCallback: _e => {
					this.chkKaydederkenYazdir.jqxToggleButton('toggled', asBool(this.kaydederkenYazdirFlag));
					this.chkKaydederkenAktar.jqxToggleButton('toggled', asBool(this.kaydederkenAktarFlag));
					
					setTimeout(() => {
						this.liste_hideFilterBar(e);
						this.onResize(e);
						this.focusToDefault(e)
					}, 150)
				}
			}).run();
		}
		async rbkDuzenleIstendi(e) {
			const rec = e.rec || this.selectedBoundRec; let detay = rec;
			try {
				if (detay) { detay = $.isPlainObject(detay) ? fis.class.detaySinif.From(detay) : detay } if (!detay) { return }
				if (!sky.app.rbkKullanilirmi) { displayMessage(`RBK Kullanımı merkez parametrelerinde kapalıdır`, '! RBK Düzenleme İşlemi !'); return }
				if (!detay.rbkIcinUygunmu) { displayMessage(`<b>(${detay.shKod}) ${detay.shAdi}</b> ürünü RBK için <u>uygun değildir</u>`, '! RBK Düzenleme İşlemi !'); return }
			}
			finally { setTimeout(() => this.focusToDefault(), 10) }
			let {rbkGirisPart} = this;
			if (rbkGirisPart) {
				if (!rbkGirisPart.isDestroyed) { await rbkGirisPart.destroyPart() }
				rbkGirisPart = this.rbkGirisPart = null
			}
			const islemYeniVeyaKopyami = this.yeniKayitmi;
			rbkGirisPart = this.rbkGirisPart = new CETRBKGirisPart({
				parentPart: this, from: 'fisGiris',
				fis: this.fis, eskiFis: (islemYeniVeyaKopyami ? null : this.eskiFis),
				detay: detay, tableData: detay.rbkTableData,
				tamamIslemi: e => this.rbkDuzenleIstendi_devam(e),
				geriCallback: _e => setTimeout(() => { this.liste_hideFilterBar(e); this.onResize(e); this.focusToDefault(e) }, 150)
			});
			await this.aboutToDeactivate(e);
			return await rbkGirisPart.run()
		}
		async rbkDuzenleIstendi_devam(e) {
			const {detay, tableData} = e;
			// detay.cacheReset();
			// detay.rbkTableData = tableData;
			await detay.bedelHesapla({ fis: this.fis, satisKosulYapilari: this.satisKosulYapilari });
			await this.degistir({ rec: detay });
			this.liste_degisti(e);
			// this.tazele();
			setTimeout(() => {
				const {hizliStokPart} = this;
				hizliStokPart.value = '';
				hizliStokPart.comboBox_enterIstendi({ value: '' });
				this.liste_hideFilterBar(e); this.onResize(e); this.focusToDefault(e)
			}, 150)
		}
		async raporlarIstendi(e) {
			await this.aboutToDeactivate(e);
			return await new CETRaporlarPart({
				parentPart: this,
				from: 'fisGiris',
				geriCallback: _e => {
					setTimeout(() => {
						this.liste_hideFilterBar(e);
						this.onResize(e);
						this.focusToDefault(e)
					}, 150)
				}
			}).run()
		}
		async sablondanYukleIstendiDevam(e) {
			e = e || {}; const {rec} = e;
			let sent = new MQSent({
				from: `mst_SablonHar`,
				where: { degerAta: rec.rowid, saha: `fissayac` },
				sahalar: '*'
			});
			let stm = new MQStm({
				sent: sent,
				orderBy: [`seq`, `shKod`]
			})
			const detaylar = e.detaylar = await this.fis.dbMgr.executeSqlReturnRows({ query: stm });
			if ($.isEmptyObject(detaylar)) {
				displayMessage(`Şablon içeriğinde hiç Detay bilgi yok`, `@ Şablondan Bilgi Yükle @`);
				setTimeout(() => this.focusToDefault(), 10);
				return false
			}

			let wnd = displayMessage(
				`<p class="darkred">Mevcut detaylar silinip, Şablondaki <b>${detaylar.length} kalem</b> bilgi yüklenecek...</p><p>Devam Edilsin mi?</p>`,
				`Şablondan Bilgi Yükle`,
				true,
				{
					EVET: async (dlgUI, btnUI) => {
						dlgUI.jqxWindow('destroy');
						await this.sablondanYukle(e)
						
						setTimeout(() => {
							this.liste_hideFilterBar(e);
							this.onResize(e);
							this.focusToDefault(e)
						}, 150)
					},
					HAYIR: (dlgUI, btnUI) => {
						dlgUI.jqxWindow('destroy');
						setTimeout(() => this.focusToDefault(), 10)
					}
				});
			wnd.off('close').on('close', evt => {
				// dlgUI.jqxWindow('destroy');
				setTimeout(() => this.focusToDefault(), 10)
			})
		}
		async sablondanYukle(e) {
			e = e || {}; let recs = e.detaylar;
			if ($.isEmptyObject(recs))
				return false			
			const {fis, satisKosulYapilari} = this;
			const dbMgr = fis.dbMgr;
			const detaySinif = fis.class.detaySinif;
			const detaylar = [];
			const shKod2Detaylar = {};
			const {dovizlimi} = fis;
			for (const rec of recs) {
				let det = await detaySinif.fromSablonBilgi({ rec: rec });
				if (det) {
					await det.detayEkIslemler_ekle({ fis: fis, satisKosulYapilari: satisKosulYapilari });
					detaylar.push(det);
					const shKod = det.shKod;
					if (shKod) {
						(shKod2Detaylar[shKod] = shKod2Detaylar[shKod] || [])
							.push(det)
					}
				}
			}
			let sent = new MQSent({
				from: `mst_Stok stk`,
				where: { inDizi: Object.keys(shKod2Detaylar), saha: 'stk.kod' },
				sahalar: [
					`stk.kod shKod`, `stk.aciklama shAdi`, `stk.grupKod`, `stk.brm`,
					`stk.${dovizlimi ? 'dvBrmFiyat' : 'brmFiyat'} fiyat`,
					`stk.${fis.class.stokKdvSaha} kdvOrani`,
					`stk.${fis.class.stokKdvDegiskenmiSaha} kdvDegiskenmi`,
				]
			});
			recs = await dbMgr.executeSqlReturnRows({ tx: e.tx, query: sent });
			for (const rec of recs) {
				const shKod = rec.shKod || rec.stokKod;
				delete rec.shKod;
				const _detaylar = shKod2Detaylar[shKod] || [];
				for (const det of _detaylar) {
					let yenidenHesaplaFlag = false;
					for (const key in rec) {
						const value = rec[key];
						if (value) {
							det[key] = value;
							if (!yenidenHesaplaFlag && (key == 'fiyat' || key == 'kdvOrani' || key == 'kdvDegiskenmi'))
								yenidenHesaplaFlag = true
						}
					}
					if (yenidenHesaplaFlag)
						await det.detayEkIslemler({ fis: fis, satisKosulYapilari: satisKosulYapilari })
				}
			}

			fis.detaylar = detaylar;
			await this.tazele()
		}
		async kaydetIstendi(e) {
			const {app} = this;
			if (app.fisOzetBilgiGosterilirmi) { await this.aboutToDeactivate(e); return await this.fisOzetBilgiIstendi(e) }
			let result = await this.kaydet(e)
			if (result && !result.isError)
				this.geriIstendi()
			return result
		}
		async aboutToActivate(e) {
			const {barcodeReader} = this;
			if (this._barcodeReaderRunningFlag) { delete this._barcodeReaderRunningFlag; this.barkodIstendi(e) }
		}
		async aboutToDeactivate(e) {
			const {barcodeReader} = this;
			if (barcodeReader && (barcodeReader.initFlag || !barcodeReader.isReady)) { this.barkodIstendi(e) }
		}
		async onResize(e) {
			await super.onResize(e);
			/*const {divListe, listeWidget, btnSil, divFisBaslik} = this;
			if (!divListe)
				return
			const offset = divListe.offset();
			let newHeight = offset.top + (listeWidget.filterHeight || 0) + 20*/
		}
	}
})()
