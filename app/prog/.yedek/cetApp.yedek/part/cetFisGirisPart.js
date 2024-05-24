(function() {
	window.CETFisGirisPart = class extends window.CETListeOrtakPart {
		constructor(e) {
			e = e || {};
			super(e);
			
			const {app} = this;
			const param = app.param.deepCopy();
			const {fis} = e;
			$.extend(this, {
				islem: e.islem || 'yeni',
				param: param,
				eskiFis: e.eskiFis,
				fis: fis,
				kaydetOncesi: e.kaydetOncesi,
				kaydetIslemi: e.kaydetIslemi,
				kaydedince: e.kaydedince,
				degistimi: false,
				satisKosulYapilari: e.satisKosulYapilari,
				promosyonYapilari: e.promosyonYapilari,
				idSaha: '',
				ayrisimAyiracli_barkod2Detay: {}
			});
			this.sonStokKontrolEdilirmi = app.sonStokKontrolEdilirmi && fis.class.sonStokKontrolEdilirmi;
			if (!(this.layout || this.template))
				this.template = app.templates.fisGiris;
		}

		static get partName() { return 'cetFisGiris' }

		get adimText() {
			const {fis} = this;
			let prefix = '';
			const {ayrimTipAdi} = fis;
			if (ayrimTipAdi)
				prefix += `<span style="margin-right: 8px;"><u>${ayrimTipAdi}</u></span>`;
			
			return `<div class="fisTipText">${prefix}${fis.class.aciklama}</div>`
		}

		get yeniKayitmi() {
			const islem = this.islem;
			return islem == 'yeni' || islem == 'kopya'
		}


		async activatePart(e) {
			await super.activatePart(e);
			
			const {btnToggleFullScreen} = sky.app;
			if (btnToggleFullScreen && btnToggleFullScreen.length)
				btnToggleFullScreen.addClass(`jqx-hidden`);
		}

		async deactivatePart(e) {
			/*const {btnToggleFullScreen} = sky.app;
			setTimeout(() => {
				if (btnToggleFullScreen && btnToggleFullScreen.length)
					btnToggleFullScreen.removeClass(`jqx-hidden`);
			}, 100);*/

			await super.deactivatePart(e);
		}


		async preInitLayout(e) {
			e = e || {};
			await super.preInitLayout(e);

			const layout = e.layout || this.layout;
			this.dipTable = layout.find('#dipTable');
			this.templates = $.extend(this.templates || {}, {
				hizliStokItem: layout.find('template#hizliStokItem'),
				fisBaslik: layout.find('template#templates_fisBaslik')
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
				numaratorTip += `-${ozelIsaret}`;

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
					this.paramDegistimi = true;
				}
			}

			this.bedelKullanilirmi = fis.class.bedelKullanilirmi;
			this.fiyatGorurmu = fis && !fis.class.fiiliCikismi ? app.alimFiyatGorurmu : app.satisFiyatGorurmu;
		}

		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);
			
			const layout = e.layout || this.layout;
			const {app, fis} = this;
			const islemYenimi = this.islem == `yeni`;
			
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
				lockedFlag: userSettings.lockedFlag
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
					this.focusToDefault();
			});
			if (!(this.prefetch || this.isPrefetch))
				chkKilitle_onToggle();

			this.liste_hideFilterBar();

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
				this.onResize(e);
				hideProgress();
				this.degistimi = false;
				this.focusToDefault();
			}, 1500);
		}

		async destroyLayout(e) {
			e = e || {};
			const layout = e.layout || this.layout;
			let btnKaydet = this.btnKaydet;
			if (btnKaydet) {
				btnKaydet.detach()
					.appendTo(layout);
			}

			if (this.barcodeReader) {
				this.barcodeReader.destroy();
				delete this.barcodeReader;
			}

			const {btnToggleFullScreen} = sky.app;
			setTimeout(() => {
				if (btnToggleFullScreen && btnToggleFullScreen.length)
					btnToggleFullScreen.removeClass(`jqx-hidden`);
			}, 100);

			return await super.destroyLayout(e);
		}

		async initMustBilgi(e) {
			e = e || {};
			const layout = this.layout;
			if (!(layout && layout.length))
				return;
			
			const {app} = this;
			const {bakiyeRiskGosterilmezmi, musteriRotaZorunlumu, konumTakibiYapilirmi} = app;
			const dbMgr = app.dbMgrs.rom_data;
			const divMustBilgi = layout.find(`#mustBilgi`);
			const {fis} = this;
			if (!fis.class.musteriKullanilirmi) {
				divMustBilgi.addClass(`jqx-hidden`);
				return;
			}
			
			let {mustKod} = fis;
			if (mustKod) {
				let stm;
				let rec = fis.getCariEkBilgi ? await fis.getCariEkBilgi(e) : null;
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
				}
				
				const riskCariKod = await fis.getRiskCariKod(e);
				stm = new MQStm({
					sent: new MQSent({
						from: `mst_Cari`,
						where: [{ degerAta: riskCariKod, saha: 'kod' }],
						sahalar: [`bakiye`, `riskLimiti`, `riskli`, 'takipBorcLimiti', 'takipBorc']
					})
				});
				rec = await dbMgr.tekilExecuteSelect({ query: stm });
				
				const bakiye = bakiyeRiskGosterilmezmi ? `` : bedel(rec.bakiye);
				const kalanRisk = bakiyeRiskGosterilmezmi ? `` : rec.riskLimiti ? bedel(rec.riskLimiti - rec.riskli) : `-Limit Yok-`;
				const kalanTakipBorc = bakiyeRiskGosterilmezmi ? `` : rec.takipBorcLimiti ? bedel(rec.takipBorcLimiti - rec.takipBorc) : ``;
				divMustBilgi.find('.mustText')
					.html(new CKodVeAdi({ kod: mustKod, aciklama: unvan }).parantezliOzet({ styled: true }));
				if (bakiye || kalanRisk || kalanTakipBorc) {
					let elm = divMustBilgi.find('.bakiyeText').html(typeof bakiye == 'number' ? `${bedelStr(bakiye)} TL` : bakiye || ``);
					if (typeof bakiye != 'number')
						elm.addClass(`gray bold`);
					else if (bakiye < 0)
						elm.addClass(`red`);
					
					elm = divMustBilgi.find('.kalanRiskText').html(typeof kalanRisk == 'number' ? `${bedelStr(kalanRisk)} TL` : kalanRisk || ``);
					if (typeof kalanRisk != 'number')
						elm.addClass(`gray bold`);
					else if (kalanRisk < 0)
						elm.addClass(`red`);

					elm = divMustBilgi.find('.kalanTakipBorcText').html(typeof kalanTakipBorc == 'number' ? `${bedelStr(kalanTakipBorc)} TL` : kalanTakipBorc || ``);
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
					btnDegistir.off('click').on('click', async evt => {
						let result = await CETCariListePart.run({
							parentPart: this,
							targetRec: mustKod,
							secince: _e => setTimeout(async e => {
								const {fis} = this;
								mustKod = e.rec.kod;
								if (mustKod == fis.mustKod)
									return;
									
								fis.mustKod = mustKod;
								fis.cacheReset();
								['satisKosulYapilari', 'promosyonYapilari'].forEach(key =>
									delete this[key]);
								await this.musteriDegisti(e);
								this.satirlariYenidenHesapla(e);
							}, 10, $.extend({}, e, _e))
						});
						/*let part = (result || {}).part;
						if (part) {
							setTimeout(() => {
								part.selectRec({ key: this.fis.mustKod });
							}, $.isEmptyObject(part.listeRecs) ? 400 : 50);
						}*/
					});
				}
				if (musteriRotaZorunlumu || konumTakibiYapilirmi)
					btnDegistir.addClass(`jqx-hidden`);
				divMustBilgi.removeClass(`jqx-hidden`);
			}
			else {
				divMustBilgi.addClass(`jqx-hidden`);
			}
		}

		async musteriDegisti(e) {
			const {app, fis} = this;
			let {sonMustKod} = this;
			const {mustKod} = fis;
			
			/*if (mustKod == sonMustKod)
				return;*/
			
			if (!(e.initFlag && (this.satisKosulYapilari && this.promosyonYapilari))) {
				const mustKod2KosulProYapilari = app.mustKod2KosulProYapilari = app.mustKod2KosulProYapilari || {};
				let kosulProYapilari = mustKod2KosulProYapilari[mustKod] = /*mustKod2KosulProYapilari[mustKod] ||*/ {
					satisKosulYapilari: await fis.getSatisKosulYapilari(),
					promosyonYapilari: await fis.getPromosyonYapilari()
				};
				$.extend(this, kosulProYapilari);
			}

			if (sonMustKod && mustKod && sonMustKod != mustKod)
				fis.sevkAdresReset();

			sonMustKod = this.sonMustKod = mustKod;
			
			return this.initMustBilgi(e);
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
					widget.expandAt(index);
				
				const timeouts = [20, 50, 100, 200];
				for (const i in timeouts) {
					setTimeout(() =>
						this.onResize(e),
						timeouts[i]);
				}
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
					theme: theme, width: 165, inputMode: 'simple',
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
						await this.musteriDegisti(e);
						// this.satirlariYenidenHesapla(e);
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
				divOzelIsaretIndicator.removeClass(`jqx-hidden`);
			}

			detContent.find('#notlar')
				.val(fis.aciklama || '')
				.on('change', evt => {
					let target = evt.args || evt.target;
					this.fis.aciklama = (target.value || '');
				});

			const divFisBaslik = this.divFisBaslik = detContent.find(`.fisBaslik`);
			divFisBaslik.addClass(`basic-hidden`);

			setTimeout(async () => {
				await this.initFisBaslikUI(e);

				const baslikContentLayout = e.baslikContentLayout;
				const baslikBilgisiVarmi = baslikContentLayout && baslikContentLayout.length &&
												baslikContentLayout.find(`.parent:not(.jqx-hidden)`).length;
				if (!(fis.aciklama || (baslikBilgisiVarmi && this.yeniKayitmi))) {
				// if (!fis.aciklama || baslikBilgisiVarmi)
					this.baslik_navBar.jqxNavigationBar('collapseAt', 0);
					
					const timeouts = [100, 200];
					for (const i in timeouts) {
						setTimeout(() =>
							this.onResize(e),
							timeouts[i]);
					}
				}
				
				if (baslikBilgisiVarmi)
					setTimeout(() => divFisBaslik.removeClass(`basic-hidden`), 300);
				else
					divFisBaslik.removeClass(`basic-hidden`);

				content.find(`input[type=text], input[type=textbox], input[type=textarea]`)
					.on('focus', evt =>
						evt.target.select());
			}, 100);
		}

		async initFisBaslikUI(e) {
			const {fis} = this;
			const {adimTipi} = fis.class;
			if (!adimTipi)
				return null;
			
			const subContent = this.divFisBaslik;
			if (!subContent.length)
				return null;

			const content = e.content || this.content;
			const templates = this.templates.fisBaslik;
			const layouts = [templates.contents(`.ortak`),  templates.contents(`.${adimTipi}`)];
			for (let i in layouts) {
				let baslikContentLayout = layouts[i];
				if (baslikContentLayout && baslikContentLayout.length) {
					baslikContentLayout = e.baslikContentLayout = baslikContentLayout.clone(true);
					let _e = $.extend({}, e, { parentPart: this, parentContent: content, layout: baslikContentLayout });
					baslikContentLayout.appendTo(subContent);
					await fis.initBaslikUI(_e);

					subContent[subContent.hasVScrollBar() ? 'addClass' : 'removeClass'](`vScroll scroll`);
					subContent[subContent.hasHScrollBar() ? 'addClass' : 'removeClass'](`hScroll scroll`);

					await new Promise(resolve =>
						setTimeout(() => resolve(), 100));
				}
			}

			return layouts.filter(x => x && x.length);
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
			setTimeout(async () => {
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

							return stm;
						},
						liste_stmDuzenleyici: e => {
							return true;
							
							/*if (this.param.sonStokKontrolEdilirmi && this.fis.class.sonStokKontrolEdilirmi) {
								e.stm.sentDo(sent => {
									sent.leftJoin({ alias: 'stk', from: 'mst_Stok son', on: 'stk.kod = son.stokKod' })
									sent.where
										.add(`son.miktar > 0`);
								});
							}*/
						},
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
				});
				await hizliStokPart.run();

				const input = hizliStokPart.comboBoxWidget.input;
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
			}, 500);
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
				subContent.find('#dipIskParent').addClass(`jqx-hidden`);
				if (!subContent.children(`div:not(.jqx-hidden)`).length)
					navBar.find('.jqx-expander-arrow').addClass(`jqx-hidden`);
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

			return result;
		}

		async ekle(e) {
			e = e || {};
			
			let result = await super.ekle(e);
			const rec = e.rec || {};
			const {barkod, barkodParser} = rec;
			if (barkod && barkodParser && barkodParser.ayrisimAyiraclimi && barkodParser.zVarmi)
				this.ayrisimAyiracli_barkod2Detay[barkod] = rec;
			
			return result;
		}
		
		sil(e) {
			e = e || {};
			let result = super.sil(e);
			
			const rec = e.rec || this.selectedBoundRec || {};
			const {barkod} = rec;
			if (barkod)
				delete this.ayrisimAyiracli_barkod2Detay[barkod];

			return result;
		}

		temizle(e) {
			let result = super.temizle(e);
			this.ayrisimAyiracli_barkod2Detay = {};
			
			return result;
		}

		async kaydet(e) {
			const {app, fis} = this;
			app.hideNotifications();

			e = $.extend({
				sender: this, islem: this.islem, eskiFis: this.eskiFis, gecicimi: fis.gecicimi,
				satisKosulYapilari: this.satisKosulYapilari, promosyonYapilari: this.promosyonYapilari
			}, e);
			const layout = e.layout || this.layout;
			if (this.otoBirlestirFlag)
				await this.birlestir(e);
			
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
					return false;
			}

			return await this.kaydetDevam(e);
		}

		kaydetOncesiDefault(e) {
			/*return new Promise(then => {
				let wnd = displayMessage(
					`Belge kaydedilsin mi?`,
					this.app.appText,
					true,
					{
						EVET: async (dlgUI, btnUI) => {
							dlgUI.jqxWindow('destroy');
							this.focusToDefault();
							then(true)
						},
						HAYIR: (dlgUI, btnUI) => {
							dlgUI.jqxWindow('destroy');
							this.focusToDefault();
							then(false)
						}
					});
				wnd.on('close', evt => {
					// dlgUI.jqxWindow('destroy');
					this.focusToDefault();
				});
				wnd.jqxWindow('position', { x: 5, y: 50 });
			})*/

			return true;
		}

		async kaydetDevam(e) {
			e = e || {};
			const {app} = this;
			const {param} = app;

			if (!(this.prefetch || this.isPrefetch)) {
				setButonEnabled(this.islemTuslari, false);
				(savedProcs || window).showProgress(null, null, 1, true);
				setTimeout(() => {
					(savedProcs || window).hideProgress();
					setButonEnabled(this.islemTuslari, true);
				}, 2000);
			}

			if (this.paramDegistimi)
				await param.kaydet();
			$.extend(param, this.param);

			const fis = e.fis || this.fis;
			let handler = this.kaydetIslemi || this.kaydetDevam2;
			if (handler) {
				let result = await handler.call(this, e);
				if (!result)
					return false;
			}

			this.degistimi = false;
			handler = this.kaydedince;
			if (handler)
				handler.call(this, e);

			return true;
		}

		async kaydetDevam2(e) {
			e = e || {};
			const fis = e.fis || this.fis;
			const dbMgr = fis.dbMgr;
			
			let savedFisNo = fis.fisNo;
			const num = fis.numarator;
			if (num /*&& !(e.gecicimi || fis.gecicimi)*/) {
				$.extend(num, { seri: fis.seri, sonNo: num.sonNo + 1 });
				let numaratorIcinUygunmu = !fis.fisNo && (e.gecicimi || fis.gecicimi || this.yeniKayitmi);
				if (numaratorIcinUygunmu) {
					await num.kesinlestir({
						yeniKayitmi: numaratorIcinUygunmu && this.yeniKayitmi,
						islem: this.islem,
						dbMgr: dbMgr,
						fisSinif: fis.class,
						fisID: fis.id
					});
					fis.fisNo = num.sonNo || 1;
				}

				if (savedFisNo) {
					let yeniNo = await num.fisNoDuzelt({
						yeniKayitmi: numaratorIcinUygunmu && this.yeniKayitmi,
						islem: this.islem,
						dbMgr: dbMgr, fisSinif: fis.class,
						fisID: fis.id, seri: fis.seri,
						fisNo: fis.fisNo || num.sonNo
					});
					if (fis.fisNo != yeniNo) {
						fis.fisNo = yeniNo || 1;
						if (numaratorIcinUygunmu) {
							num.sonNo = fis.fisNo;
							await num.kaydet();
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
					return result;
				
				await fis.geciciFisleriTemizle();
				await dbMgr.transaction();
				
				if (savedFisNo && fis.fisNo != savedFisNo) {
					displayMessage(
						`<i>${savedFisNo}</i> olan Belge Numarası <b>${fis.fisNo}</b> olarak değişti.`,
						`Bilgilendirme`
					)
				}

				return result;
			}
			catch (ex) {
				if (ex.rc == 'runtimeInterrupt' || ex.rc == 'userAbort')
					return false;
				
				displayMessage(`${ex.errorText || ex.message || ex}`, `@ Belge Kayıt İşlemi @`, undefined, undefined, false, true);
				console.error(`fiş kayıt hatası`, ex);
				// setTimeout(() => this.tazele(), 1500);
			}
			finally {
				if (fis)
					fis.gecicimi = e.gecicimi;
			}
		}
		
		async listeArgsDuzenle(e) {
			await super.listeArgsDuzenle(e);
			
			$.extend(e.listeArgs, {
				/* editable: true, */ serverProcessing: false, pageable: true, filterable: true,
				showToolbar: false, toolbarHeight: 36, filterHeight: 25, filterMode: 'default',
				pageSizeOptions: [3, 5, 8, 10, 11, 13, 15, 20, 25],
				pageSize: this.userSettings_liste.pageSize || 8,
				height: $(window).width() < 450 ? $(window).height() - 150 : $(window).height() - 180
			});
		}

		async liste_columnsDuzenle(e) {
			const {app} = this;
			const {fiyatFra, ozelKampanyaKullanilirmi} = app;
			
			await super.liste_columnsDuzenle(e);

			$.merge(e.listeColumns, [
				{
					text: 'Ürün Adı', align: 'left', dataField: 'shAdi',
					cellsRenderer: (rowIndex, columnIndex, value, rec) => {
						const {fiyatGorurmu, bedelKullanilirmi} = this;
						rec = rec.originalRecord || rec;

						const divSatir = this.newListeSatirDiv(e);
						divSatir.attr('data-index', rowIndex);
						
						const promoTextParent = divSatir.find(`.promoTextParent`);
						if (rec.promoKod) {
							divSatir.addClass(`promosyon`);
							promoTextParent.find(`.promoText`).html(rec.promoKod);
						}
						else {
							promoTextParent.addClass(`jqx-hidden`);
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
								item.html(value);
						}
						
						const stokFra = this.app.brm2Fra[rec.brm || 'AD'] || 0;
						const {miktar} = rec;
						const divMiktar = divSatir.find(`.miktar`);
						if (divMiktar.length) {
							let miktarText = rec.paketKod ? `${rec.paketMiktar || 1} ${rec.paketKod} = ` : ``;
							miktarText += toStringWithFra(miktar || 1, stokFra);
							divMiktar.html(miktarText);
						}

						const mfParent = divSatir.find(`.mfParent`);
						if (rec.malFazlasi) {
							mfParent.removeClass(`jqx-hidden`);
							mfParent.find(`.mf`).html((rec.malFazlasi || 0).toLocaleString());
						}
						else
							mfParent.addClass(`jqx-hidden`);

						const fiyatParent = divSatir.find(`.fiyatParent`);
						if (!(fiyatGorurmu && bedelKullanilirmi && rec.fiyat))
							fiyatParent.addClass(`jqx-hidden`);
						else {
							fiyatParent.find(`.fiyat`).html(toStringWithFra(rec.fiyat || 0, fiyatFra));
							fiyatParent.removeClass(`jqx-hidden`);
						}
						
						const kdvOraniParent = divSatir.find(`.kdvOraniParent`);
						if (!bedelKullanilirmi || rec.kdvOrani == null)
							kdvOraniParent.addClass(`jqx-hidden`);
						else {
							divSatir.find(`.kdvOraniText`).html(`%${rec.kdvOrani}`);
							kdvOraniParent.removeClass(`jqx-hidden`);
						}
						
						const iskOranParent = divSatir.find(`.iskOranParent`);
						if (rec.iskOranVarmi) {
							iskOranParent.find(`.iskOranText`).html(
								(rec.iskOranListe || [])
									.map(val => val.toLocaleString())
								.join(`+`)
							);
							iskOranParent.removeClass(`jqx-hidden`);
						}
						else {
							iskOranParent.addClass(`jqx-hidden`);
						}

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
								ozelKampanyaOranParent.addClass(`jqx-hidden`);	
							}
						}
						else {
							ozelKampanyaOranParent.addClass(`jqx-hidden`);
							ozelKampanyaKodParent.addClass(`jqx-hidden`);
						}

						const {netBedel} = rec;
						if (fiyatGorurmu && bedelKullanilirmi && netBedel)
							divSatir.find(`.netBedel`).html(bedelStr(netBedel));
						else
							divSatir.find(`.netBedelParent`).addClass(`jqx-hidden`);
						
						const rafKodParent = divSatir.find(`.rafKodParent`);
						let ekOzellik = this.fis.class.rafKullanilirmi ? rec.ekOzellik_raf : null;
						if (ekOzellik) {
							const {value} = ekOzellik;
							if (value) {
								rafKodParent.removeClass(`jqx-hidden`);
								rafKodParent.find(`.rafKod`).html(value);
							}
							else {
								rafKodParent.addClass(`jqx-hidden`);
							}
						}
						else {
							rafKodParent.addClass(`jqx-hidden`);
						}

						const refRafKodParent = divSatir.find(`.refRafKodParent`);
						ekOzellik = this.fis.class.refRafKullanilirmi ? rec.ekOzellik_refRaf : null;
						if (ekOzellik) {
							const {value} = ekOzellik;
							if (value) {
								refRafKodParent.removeClass(`jqx-hidden`);
								refRafKodParent.find(`.refRafKod`).html(value);
							}
							else {
								refRafKodParent.addClass(`jqx-hidden`);
							}
						}
						else {
							refRafKodParent.addClass(`jqx-hidden`);
						}
						
						return divSatir[0].outerHTML.trim();
					}
				},
				{ text: 'Ürün Kod', align: 'left', dataField: 'shKod', hidden: true },
				{ text: 'Bedel', align: 'right', dataField: 'netBedel', cellsFormat: 'd2', hidden: true }
			]);
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
				/*if (app.fisGirisSadeceBarkodZorunlumu)
					removeKeys.push('degistir');*/
				
				if (!app.musteriDurumuKullanilirmi)
					removeKeys.push('musteriDurumu');

				/*if (fis.class.promosyonKullanilirmi)
					parentMenu.find(`#promosyon`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Promosyon Hesabını belgeyi kaydetmeden önce yapıp, listede uygulanan promosyonları gösterir` });
				else
					removeKeys.push('promosyon');*/
				if (!fis.class.promosyonKullanilirmi)
					removeKeys.push('promosyon');
				
				/*if (app.siparisKontrolEdilirmi && fis.class.siparisKontrolEdilirmi)
					parentMenu.find(`#siparistenKarsila`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Bekleyen Siparişlerden ürün al` });
				else
					removeKeys.push('siparistenKarsila');*/
				if (!(app.siparisKontrolEdilirmi && fis.class.siparisKontrolEdilirmi)) {
					removeKeys.push('siparistenKarsila');
					if (listePopup && listePopup.length) {
						const li = listePopup.find('#siparistenKarsila');
						if (li.length)
							li.remove();
					}
				}

				for (const i in removeKeys) {
					const key = removeKeys[i];
					const item = parentMenu.find(`#${key}.item`);
					if (item.length)
						item.remove();
				}
			}
			
			/*islemTuslari = this.toolbarIslemTuslari = layout.find(`.toolbar-external.islemTuslari`);
			let liItems = islemTuslari.find('ul > li');
			islemTuslari.jqxMenu({
				theme: theme, mode: 'horizontal',
				animationShowDuration: 0, animationHideDuration: 0
			});
			liItems.off('click');
			liItems.on('click', evt =>
				this.liste_islemTusuTiklandi($.extend({}, e, { event: evt })));
			
			if (!fis.class.promosyonKullanilirmi)
				liItems.find(`#promosyon`).addClass('jqx-hidden');*/
		}

		async loadServerData(e) {
			const recs = this.fis.detaylar;
			e.callback({ totalrecords: recs.length, records: recs });
		}

		async satirlariYenidenHesapla(e) {
			e = e || {};
			const {fis, satisKosulYapilari} = this;
			const islemYenimi = this.islem == `yeni`;
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
			await fis.dipHesapla();
			this.tazele();
		}

		async birlestir(e) {
			e = e || {};
			const {fis} = this;
			const {detaySinif} = fis;
			const recs = this.listeRecs;
			const anah2Detay = {};
			const proDetListe = [];
			for (let i in recs) {
				const rec = recs[i];
				if (rec.class.promosyonmu || rec.promoKod) {
					proDetListe.push(rec);
					continue;
				}
				
				const _det = $.isPlainObject(rec) ? new fis.class.detaySinif(rec) : rec.deepCopy();
				const anahStr = _det.getBirlestirIcinAnahtarStr({ fis: fis });
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
				else {
					det = anah2Detay[anahStr] = _det;
				}
			};

			fis.detaylar = $.merge(Object.values(anah2Detay), proDetListe || []);
			await this.tazele();
		}

		async promosyonHesapla(e) {
			e = e || {};
			const {fis} = this;
			if (!fis.class.promosyonKullanilirmi)
				return;
			
			try {
				await fis.promosyonHesapla($.extend({}, e, {
					fis: fis,
					promosyonYapilari: this.promosyonYapilari,
					satisKosulYapilari: this.satisKosulYapilari
				}));
				setTimeout(() => this.tazele(), 100);
			}
			finally {
				setTimeout(() => this.onResize(), 50);
			}
		}

		async siparistenKarsila(e) {
			e = e || {};
			const {fis} = this;
			if (!fis.class.siparisKontrolEdilirmi)
				return;
			
			let result = await new CETBekleyenSiparislerListePart({
				parentPart: this,
				almSat: fis.class.almSat,
				mustKod: fis.mustKod,
				ayrimTipi: fis.ayrimTipi || '',
				sevkAdresKod: fis.sevkAdresKod || '',
				geriCallback: e => {
					setTimeout(() => {
						this.liste_hideFilterBar(e);
						this.onResize(e);
						this.focusToDefault(e);
					}, 150)
				},
				secince: _e => setTimeout(
					e => this.siparistenKarsilaDevam(e),
					10, $.extend({}, e, _e))
			}).run();
		}

		async siparistenKarsilaDevam(e) {
			const {app, fis, satisKosulYapilari} = this;
			const fisSinif = fis.class;
			const {almSat, detaySinif} = fisSinif;
			const {recs} = e;
			if ($.isEmptyObject(recs))
				return;
			
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
			
			const {idSahalarSiparis} = CETEkOzellikler;
			const anah2Detay = {};
			for (let i in recs) {
				const rec = recs[i];
				const {stokKod, vioID, kalanMiktar} = rec;
				
				const _rec = { fis: fis, shKod: stokKod, miktar: 0 };
				let anah = [stokKod];
				if (hmrKullanilirmi) {
					for (const i in idSahalarSiparis) {
						const key = idSahalarSiparis[i];
						const value = rec[key];
						if (value != null) {
							anah.push(value);
							_rec[key] = value;
						}
					}
				}
				const anahStr = anah.join(CETEkOzellikler.anahtarDelim);
				let det = anah2Detay[anahStr];
				if (!det) {
					det = new detaySinif(_rec);
					det.miktar = 0;
					const {ekOzelliklerYapi} = det;
					if (ekOzelliklerYapi)
						await ekOzelliklerYapi.setValues({ rec: _rec });
					anah2Detay[anahStr] = det;
				}
				
				det.miktar = (det.miktar || 0) + kalanMiktar;
				const {siparisVioID2MiktarYapi} = det;
				if (siparisVioID2MiktarYapi)
					siparisVioID2MiktarYapi[vioID] = kalanMiktar;
			}

			for (const anahStr in anah2Detay) {
				const det = anah2Detay[anahStr];
				await det.detayEkIslemler_ekle({ fis: fis, satisKosulYapilari: satisKosulYapilari });
				await this.ekle({ rec: det });
			}

			app.hideNotifications();
			if (!this.baslikNavBarCollapseInitFlag) {
				this.baslikNavBarCollapseInitFlag = true;
				this.baslik_navBar.jqxNavigationBar('collapseAt', 0);
			}
			setTimeout(async () => {
				await this.selectLastRec();
				setTimeout(() => {
					this.onResize(e);
					this.focusToDefault(e);
				}, 150)
			}, 50);
		}

		focusToDefault() {
			const {activePart} = sky.app;
			const {windows, hizliStokPart} = this;
			if (!(activePart == this && $.isEmptyObject(windows)))
				return false;
			
			hizliStokPart.focusToDefault();
			return true;
		}

		async geriYapilabilirmi(e) {
			if (!await super.geriYapilabilirmi(e))
				return false;
			
			if (!this.degistimi)
				return true;
			
			return await new Promise(then => {
				displayMessage(
					'Ekranda değişiklik yapılmış, yine de çıkılsın mı?', this.app.appText, true,
					{
						EVET: (dlgUI, btnUI) => {
							dlgUI.jqxWindow('destroy');
							then(true)
						},
						HAYIR: (dlgUI, btnUI) => {
							dlgUI.jqxWindow('destroy');
							then(false)
						}
					}
				)
			})
		}


		hizliStok_itemSelected(e) {
			e.barkod = e.value;
			delete e.value;
			
			this.ekleIstendi(e);
			return true;
		}

		async liste_veriYuklendi(e) {
			await super.liste_veriYuklendi($.extend({}, e, { noAutoSelect: true }));
			if (!this.listeReadyFlag)
			 	return;
			
			setTimeout(async () => {
				if (!this.isListeVeriYuklendiEventTriggered) {
					// await this.selectLastRec();
					this.isListeVeriYuklendiEventTriggered = true;
				}
				this.degistimi = false;
				// this.listeReadyFlag = (this.listeReadyFlag || 0) + 1;
			}, 10);
		}

		liste_degisti(e) {
			e = e || {};
			super.liste_degisti(e);

			this.degistimi = true;
			
			const {fis} = this;
			fis.detaylar = this.listeRecs.map(rec =>
				$.isPlainObject(rec) ? new fis.class.detaySinif(rec) : rec);
			fis.dipHesapla();

			const {dipTable} = this;
			const uiSetValue = e => {
				const ui = dipTable.find(e.selector);
				ui.html(typeof value == 'string' ? value : bedelStr(e.value || 0));
				if (!(this.fiyatGorurmu && this.bedelKullanilirmi))
					ui.parent().addClass(`jqx-hidden`);
				else if (e.value)
					ui.parent().removeClass('jqx-hidden');
				else if (!asBool(e.noHide))
					ui.parent().addClass('jqx-hidden');
			};

			const icmal = fis.icmal || {};
			['brut', 'topIskonto', 'topKdv', 'yuvarlamaFarki', 'sonuc'].forEach(key =>
				uiSetValue({ selector: `#${key}`, value: icmal[key] }));
			if (/*!(icmal &&*/ (icmal.topKdv || icmal.topDipIskonto))/*)*/
				uiSetValue({ selector: `#sonuc`, value: `${bedelStr(fis.sonucBedel)} TL`, noHide: true });
		}

		async liste_satirSecildi(e) {
			e = e || {};
			await super.liste_satirSecildi(e);

			const {app, fis, divListe} = this;
			const {fisGirisSadeceBarkodZorunlumu} = app;
			let rec = this.selectedBoundRec;
			if (rec)
				rec = $.isPlainObject(rec) ? fis.class.detaySinif.From(rec) : rec.deepCopy();
			
			const index = this.selectedIndex;
			const {lastSelectedIndex} = e;
			if (!fisGirisSadeceBarkodZorunlumu && rec && index != null && !rec.class.promosyonmu && index == lastSelectedIndex) {
				// this.listeWidget.beginRowEdit(index);
				let elm = divListe.find(`.jqx-grid-table .listeSatir[data-index=${index}] .miktar`);
				if (elm.length) {
					if (e.event)
						e.event.stopPropagation();
					
					setTimeout(e => {
						let {elm} = e;
						let parent = elm.parent();
						if (!parent.length)
							return;
						
						const {fis} = this;
						const {rec} = e;
						const fra = this.app.brm2Fra[rec.brm || 'AD'] || 0;
						
						elm = e.elm[0];
						let savedHTML = elm.outerHTML;
						elm.outerHTML = (
							`<form action="" autocomplete="false" readonly onfocus="this.removeAttribute('readonly')" onsubmit="javascript:return false">` +
							`	<input class="miktar" maxlength="9" autocomplete="off" value="${roundToFra(rec.miktar, fra) || 1}"></input>` +
							`</form>`
						);
						elm = parent.find(`.miktar`);
						// parent.parent().find(`.brm`).addClass(`jqx-hidden`);
						elm.off('keyup').on('keyup', evt => {
							const key = (evt.key || '').toLowerCase();
							if (key == 'enter' || key == 'linefeed')
								elm.blur();
						});
						elm.off('change').on('change', async evt => {
							rec.miktar = roundToFra(evt.target.value.replaceAll(',', '.'), fra) || 1;
							await rec.detayEkIslemler({ fis: fis, satisKosulYapilari: this.satisKosulYapilari });
							try { this.degistir({ rec: rec }) }
							catch (ex) { }
						});
						elm.off('blur').on('blur', evt =>
							this.listeWidget.refresh());
						elm.focus();
						elm.select();
					}, 100, { elm: elm, rec: rec, index: index });
				}
			}
		}

		liste_satirCiftTiklandi(e) {
			if (!this.isEventFired_satirCifTiklandi) {
				this.isEventFired_satirCifTiklandi = true;
				return;
			}
			
			return this.degistirIstendi();
		}
		
		async liste_islemTusuTiklandi(e) {
			const elm = e.event.currentTarget;
			const id = e.id || (elm || {}).id;
			// let rec = this.selectedRec;
			// displayMessage(`<ul style="padding: 8px;"><li>clicked: [${elm.innerHTML}]</li><li>activeRec: [(${(rec || {}).kod}) - ${(rec || {}).unvan}]</li>`);
			// displayMessage(`<ul style="padding: 8px;"><li>clicked: [<b>${elm.id}</b> - ${elm.innerHTML}]</li><li>activeRec: [(${(rec || {}).shKod}) - ${(rec || {}).shAdi}]</li>`);
			switch (elm.id) {
				case 'ekle':
					this.ekleIstendi(e);
					break;
				case 'degistir':
					this.degistirIstendi(e);
					break;
				case 'sil':
					this.silIstendi(e);
					break;
				case 'temizle':
					this.temizleIstendi(e);
					break;
				case 'birlestir':
					this.birlestirIstendi(e);
					break;
				case 'barkod':
					this.barkodIstendi(e);
					break;
				case 'promosyon':
					this.promosyonHesaplaIstendi(e);
					break;
				case 'sablon':
					this.sablondanYukleIstendi(e);
					break;
				case 'fiyatGor':
					this.fiyatGorIstendi(e);
					break;
				case 'siparistenKarsila':
					this.siparistenKarsilaIstendi(e);
					break;
				case 'musteriDurumu':
					this.musteriDurumuIstendi(e);
					break;
				case 'sonStoktanSec':
					this.sonStoktanSecIstendi(e);
					break;
				case 'fisOzetBilgi':
					this.fisOzetBilgiIstendi(e);
					break;
				case 'raporlar':
					this.raporlarIstendi(e);
					break;
				case 'filter':
					this.liste_toggleFilterBar(e);
					break;
				/*case 'kaydet':
					this.kaydetIstendi(e);
					break;*/
			}
		}

		async ekleIstendi(e) {
			e = e || {};
			const {app, fis} = this;
			const {fisGirisSadeceBarkodZorunlumu} = app;
			app.hideNotifications();
			
			let {barkod} = e;
			let rec = e.rec || this.selectedHizliStokRec;
			rec = (rec || {}).originalItem || rec;
			this.focusToDefault();
			
			const fisSinif = fis.class;
			let det = e.detay;
			if (!det && barkod) {
				barkod = barkod.trim();
				let ind = -1;
				$.each(['x', 'X', '*'], (_, matchStr) => {
					ind = barkod.indexOf(matchStr);
					if (ind > -1)
						return false;			// break loop
				});
				
				let carpan;
				if (ind > -1) {
					let miktarStr = barkod.substring(0, ind);		// substring from->to .. (to dahil degil)
					e.barkod = barkod = barkod.substring(ind + 1);
					e.carpan = carpan = asFloat(miktarStr) || null;
				}
				if (fisGirisSadeceBarkodZorunlumu && (carpan && carpan != 1)) {
					displayMessage(`Barkodlu eklemede <b>Miktar Belirtimi</b> (<i><u>3x12345</u> gibi</i>) yapamazsınız`, `@ Barkod İşlemi @`, undefined, undefined, undefined, undefined, 'top-right');
					return false;
				}

				// barkod veya stok kod için ürün bul ve detay oluştur
				try {
					const barkodBilgi = await app.barkodBilgiBelirle({ barkod: barkod, carpan: carpan, fis: fis });
					if (barkodBilgi) {
						const {listeWidget} = this;
						if (fisGirisSadeceBarkodZorunlumu && barkodBilgi.barkod == barkodBilgi.shKod) {
							displayMessage(`Barkod olarak doğrudan <b>Ürün Kodu</b> okutulamaz`, `@ Barkod İşlemi @`, undefined, undefined, undefined, undefined, 'top-right');
							return false;
						}
						const _barkod = barkodBilgi.barkod;
						if (barkodBilgi.ayrisimAyiraclimi && barkodBilgi.zVarmi) {
							const _det = this.ayrisimAyiracli_barkod2Detay[_barkod];
							if (_det) {
								const {uid} = _det;
								listeWidget.selectrowbykey(uid);
								let displayIndex = listeWidget.getrowdisplayindex(_det);
								let araMesaj = displayIndex < 0 ? `` : `<b>${displayIndex + 1}. satırda</b> `;
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
					}
					else {
						displayMessage(`<u class="bold darkred">${barkod}</u> barkodu hatalıdır!`, `Barkod İşlemi`, undefined, undefined, undefined, undefined, 'top-right');
						setTimeout(async () => {
							await this.onResize();
							this.focusToDefault();
						}, 50);
					}
				}
				catch (ex) {
					let message = ex;
					if (ex && ex.isError)
						message = ex.errorText || ex.message;

					if (message) {
						displayMessage(message, `@ Barkod İşlemi @`, undefined, undefined, undefined, undefined, 'top-right');
						setTimeout(async () => {
							await this.onResize();
							this.focusToDefault();
						}, 50);
					}
				}
				// det = new fis.class.detaySinif({ barkod: barkod, shKod: shKod, shAdi: `${barkod} barkodundan oluştu` });
			}

			if (!det && rec) {
				if (fisGirisSadeceBarkodZorunlumu) {
					displayMessage(`Sadece Barkod ile giriş yapılabilir`, `@ Detay Ekleme İşlemi @`, undefined, undefined, undefined, undefined, 'top-right');
					return false;
				}
				const detaySinif = fisSinif.uygunDetaySinif({ rec: rec }) || fisSinif.detaySinif;
				det = $.isPlainObject(rec)
							? new detaySinif($.extend({}, rec, { fis: fis }))
							: rec.deepCopy();
			}
			
			if (det) {
				['uid', '_visible'].forEach(key =>
					delete det[key]);

				// this.focusToDefault();
				await det.detayEkIslemler_ekle({ fis: fis, satisKosulYapilari: this.satisKosulYapilari });
				// this.fis.detaylar.push(det);
				await this.ekle({ rec: det });

				// let rec = this.selectedRec;				// selectrowbykey sırasında event tetikleniyor
				setTimeout(async () => {
					await this.selectLastRec();
					setTimeout(() =>
						this.focusToDefault(),
						200);
					
					if (this.baslikNavBarCollapseInitFlag) {
						setTimeout(() => this.onResize(e), 150);
					}
					else {
						this.baslikNavBarCollapseInitFlag = true;
						this.baslik_navBar.jqxNavigationBar('collapseAt', 0);

						const timeouts = [200, 300];
						for (const i in timeouts) {
							setTimeout(() =>
								this.onResize(e),
								timeouts[i]);
						}
					}
				}, 50);
			}
			setTimeout(() => this.focusToDefault(), 50);

			/*$.extend(this, {
				selectedRec: det,
				selectedBoundRec: det,
				selectedIndex: this.listeWidget.getrowindex(det)
			});*/
		}

		async degistirIstendi(e) {
			e = e || {};
			let rec = e.rec || this.selectedBoundRec;
			let det = rec;
			det.cacheReset();
			if (det)
				det = $.isPlainObject(det) ? this.fis.class.detaySinif.From(det) : det.deepCopy();
			if (!det)
				return;

			const {app} = this;
			/*if (app.fisGirisSadeceBarkodZorunlumu) {
				displayMessage(`Sadece Barkod ile giriş yapılabilir, değişiklik yapamazsınız`, `@ Detay Değiştir İşlemi @`, undefined, undefined, undefined, undefined, 'top-right');
				return false;
			}*/
			
			if (det.class.promosyonmu && !app.serbestModmu) {
				displayMessage(
					`<b>Promosyon</b> satırı <u>DEĞİŞTİRME</u> yetkiniz yok`,
					`! Değiştir İşlemi !`
				);
				return;
			}
			
			let wnd = this.degistirEkrani;
			if (wnd)
				wnd.jqxWindow('close');

			const layout = this.layout;
			const wndContent = layout.find('#degistirEkrani').contents('div').clone(true);
			wndContent.addClass(`part ${this.rootAppName} ${this.appName} ${this.partName}`);

			const windows = this.windows;
			wnd = createJQXWindow(
				wndContent, 'Değiştir',
				{
					isModal: true,
					width: '100%',
					height: 410,
					position: { x: 0, y: $(window).width() < 450 ? 0 : 43 }
				},
				{
					TAMAM: (dlgUI, btnUI) => {
						this.degistirIstendiDevam({ dlgUI: dlgUI, wnd: wnd, content: wndContent, detay: det })
					},
					VAZGEC: (dlgUI, btnUI) =>
						dlgUI.jqxWindow('close')
				}
			);
			[this, windows].forEach(target =>
				target.degistirEkrani = wnd);
			wnd.off('close').on('close', evt => {
				$(evt.target).jqxWindow('destroy');
				[this, windows].forEach(target =>
					delete target.degistirEkrani);
				setTimeout(() => {
					this.onResize(e);
					this.focusToDefault();
				}, 150);
			});

			this.degistirEkrani_initLayout({ wnd: wnd, content: wndContent, detay: det });
		}

		async degistirEkrani_initLayout(e) {
			const det = e.detay;
			const {content} = e;
			const {app, param, fis, fiyatGorurmu, bedelKullanilirmi} = this;
			const {fisGirisSadeceBarkodZorunlumu, detaylardaFiyatDegistirilirmi, kdvDegiskenmi,
				   fiyatFra, iskSayi, ozelKampanyaKullanilirmi, ozelKampanyaOranSayisi} = app;
			const satirIskOranSinir = asFloat(det.satirIskOranSinirUyarlanmis) || 0;
			const iskKullanilirmi = satirIskOranSinir > 0 && app.iskontoArttirilirmi;

			let iskOranParent_hiddenState, iskOranlarStrParent_hiddenState;
			const mfDegisti = evt => {
				const iskOranParent = content.find(`#iskOranParent`);
				const iskOranlarStrParent = content.find(`#iskOranlarStrParent`);
				
				const {malFazlasi} = det;
				const mfParent = content.find('#mfParent');
				if (malFazlasi) {
					mfParent.find('#mf').html((malFazlasi || 0).toLocaleString());
					mfParent.removeClass(`jqx-hidden`);
					if (iskOranParent && iskOranParent.length) {
						if (iskOranParent_hiddenState == null)
							iskOranParent_hiddenState = iskOranParent.hasClass(`jqx-hidden`);
						iskOranParent.addClass(`jqx-hidden`);
					}
					if (iskOranlarStrParent && iskOranlarStrParent.length) {
						if (iskOranlarStrParent_hiddenState == null)
							iskOranlarStrParent_hiddenState = iskOranlarStrParent.hasClass(`jqx-hidden`);
						iskOranlarStrParent.addClass(`jqx-hidden`);
					}
				}
				else {
					mfParent.addClass(`jqx-hidden`);
					if (iskOranParent && iskOranParent.length) {
						if (iskOranParent_hiddenState === false)
							iskOranParent.removeClass(`jqx-hidden`);
					}
					if (iskOranlarStrParent && iskOranlarStrParent.length) {
						if (iskOranlarStrParent_hiddenState === false)
							iskOranlarStrParent.removeClass(`jqx-hidden`);
					}
					iskOranParent_hiddenState = iskOranlarStrParent_hiddenState = null;
				}

				if (!det.iskOranVarmi) {
					let elm = iskOranParent ? iskOranParent.find(`.iskOran`) : null;
					if (elm && elm.length)
						elm.jqxNumberInput('value', 0);
					elm = iskOranlarStrParent ? iskOranlarStrParent.find(`#iskOranlarStr`) : null;
					if (elm && elm.length)
						elm.html('');
				}
			};
			
			let fra = app.brm2Fra[det.brm || 'AD'] || 0;
			let urunKA = new CKodVeAdi({ kod: det.shKod, aciklama: det.shAdi });
			content.find('#urun').html(urunKA.parantezliOzet({ styled: true }));
			
			let uiMiktar = content.find(`#miktar`).jqxNumberInput({
				theme: theme, width: 150, inputMode: 'simple',
				min: 0.1, max: 99999.99999, decimalDigits: fra,
				spinButtons: true, spinButtonsWidth: 32,
				decimal: roundToFra(det.miktar, fra) || 0,
				disabled: fisGirisSadeceBarkodZorunlumu
			});
			const miktarDegisti = async evt => {
				if (fisGirisSadeceBarkodZorunlumu)
					return;
				const value = roundToFra(uiMiktar.jqxNumberInput('numberInput').val(), fra) || 0;
				$(evt.target).parent()
					.jqxNumberInput('decimal', value);
				det.miktar = value;
				await this.degistirIstendiDevam_detaySetValues(e);
				mfDegisti(evt);
			};
			$(uiMiktar.parent().find(`input`))
				// .attr('maxLength', 3)
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

			mfDegisti();
			content.find('#brm').html(det.brm || 'AD');
			
			const isKdvEditable = !fis.yildizlimi && (detaylardaFiyatDegistirilirmi || kdvDegiskenmi);
			let uiKdvOrani = content.find(`#kdvOrani`).jqxDropDownList({
				theme: theme, animationType: animationType, width: 100, height: 35,
				disabled: !isKdvEditable, valueMember: 'kod', displayMember: 'aciklama',
				selectedIndex: 0, checkboxes: false, filterable: false, searchMode: 'containsignorecase',
				placeHolder: 'Seçiniz:', filterPlaceHolder: 'Bul:', scrollBarSize: 25,
				dropDownHeight: 140, autoDropDownHeight: true,
				renderer: (index, aciklama, kod) => {
					return (
						`<div class="kdvOrani listeSatir degistirEkrani ${this.partName} ${this.appName} ${this.rootAppName} part">` +
							aciklama +
						`</div>`
					)
				},
				source: [
					new CKodVeAdi({ kod: '18', aciklama: '18%' }),
					new CKodVeAdi({ kod:  '8', aciklama: '8%' }),
					new CKodVeAdi({ kod:  '1', aciklama: '1%' }),
					new CKodVeAdi({ kod:  '0', aciklama: '0%' })
				]
			});
			uiKdvOrani.val(det.kdvOrani || 0);
			uiKdvOrani.off('change').on('change', evt => {
				let value = (evt.args ? evt.args.item.value : null);
				if (value == null)
					value = uiKdvOrani.val();
				det.kdvOrani = asInteger(value);
				this.degistirIstendiDevam_detaySetValues(e);
			});

			let uiFiyat = content.find('#fiyat');
			if (!detaylardaFiyatDegistirilirmi)
				uiFiyat.attr('disabled', '');
			uiFiyat.val(toStringWithFra(det.fiyat, fiyatFra));
			if (fiyatGorurmu && bedelKullanilirmi) {
				content.find(`#fiyatParent, #bedelParent`)
					.removeClass(`jqx-hidden`);
				const fiyatDegisti = evt => {
					let text = evt.target.value || uiFiyat.val();
					if (text)
						text = text.replace(',', '.');
					let value = roundToFra(text, fiyatFra) || 0;
					if (value < (det.enDusukFiyat || 0.1) || value > 9999999.999999)
						value = det.fiyat;
					uiFiyat.val(toStringWithFra(value, fiyatFra));
					det.fiyat = value;
					det.ozelFiyatVarmi = !!value;
					this.degistirIstendiDevam_detaySetValues(e);
				};
				uiFiyat
					.attr('maxLength', 17)
					.off('focus').on('focus', evt => evt.target.select())
					.off('change, blur').on('change, blur', evt => fiyatDegisti(evt));
			}
			else {
				content.find(`#fiyatParent, #bedelParent`)
					.addClass(`jqx-hidden`);
			}
			
			if (iskKullanilirmi && (satirIskOranSinir == 100 || !det.ozelIskontoVarmi)) {
				const iskOranParent = content.find(`#iskOranParent`);
				iskOranParent.removeClass(`jqx-hidden`);
				content.find(`#iskOranlarStrParent`).addClass(`jqx-hidden`);
				const uiIskOranListe = iskOranParent.find(`input.iskOran`);
				for (let i = 1; i <= uiIskOranListe.length; i++) {
					let uiIskOran = uiIskOranListe.eq(i - 1);
					if (i > iskSayi) {
						uiIskOran.addClass(`jqx-hidden`);
						if (i > 1)
							uiIskOran.prev().addClass(`jqx-hidden`);
						continue;
					}
					
					uiIskOran = uiIskOran.jqxNumberInput({
						disabled: !app.iskontoArttirilirmi,
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
				content.find(`#iskOranParent`).addClass(`jqx-hidden`);
				const iskOranlarStrParent = content.find(`#iskOranlarStrParent`);
				if (det.ozelIskontoVarmi)
					iskOranlarStrParent.removeClass(`jqx-hidden`);
				
				const divIskOranlarStr = iskOranlarStrParent.find(`#iskOranlarStr`);
				const {iskOranListe} = det;
				if ($.isEmptyObject(iskOranListe))
					divIskOranlarStr.html('');
				else {
					divIskOranlarStr.html(`%${iskOranListe.join(' + ')}`);
				}
			}

			const ozelKampanyaKodParent = content.find(`#ozelKampanyaKodParent`);
			if (ozelKampanyaKullanilirmi) {
				const ozelKampanyaDegisti = async _e => {
					const ozelKampanyaOranParent = content.find(`#ozelKampanyaOranParent`);
					if (det.ozelKampanyaKod) {
						if (det.ozelKampanyaKod && det.ozelKampanyaIskSinir == null)
							await det.ozelKampanyaIskOranSinirBul();
						const ozelKampanyaIskSinir = det.ozelKampanyaIskSinir || 0;
						
						ozelKampanyaOranParent.removeClass(`jqx-hidden`);
						const uiOzelKamOranListe = content.find(`.ozelKampanyaOran`);
						for (let i = 1; i <= uiOzelKamOranListe.length; i++) {
							let uiOzelKamOran = uiOzelKamOranListe.eq(i - 1);
							if (i > ozelKampanyaOranSayisi) {
								uiOzelKamOran.addClass(`jqx-hidden`);
								if (i > 1)
									uiOzelKamOran.prev().addClass(`jqx-hidden`);
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
						ozelKampanyaOranParent.addClass(`jqx-hidden`);
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
				ozelKampanyaKodParent.removeClass(`jqx-hidden`);
				await part.run();

				await ozelKampanyaDegisti();
			}
			else {
				ozelKampanyaKodParent.addClass(`jqx-hidden`);
			}

			await det.ekOzelliklerDo({ callback: async _e => {
				const {fis} = this;
				const rafmi = _e.tip == 'raf';
				const refRafmi = _e.tip == 'refRaf';
				if (rafmi && !fis.class.rafKullanilirmi)
					return true;			// continue loop
				if (refRafmi && !fis.class.refRafKullanilirmi)
					return true;			// continue loop
				
				const ekOzellik = _e.item;
				await ekOzellik.appendPartsInto({
					parentPart: this, content: content,
					disabled: fisGirisSadeceBarkodZorunlumu,
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
							if (fisGirisSadeceBarkodZorunlumu) {
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
						elm.addClass(`jqx-hidden`);
					elm = content.find(`#${selector}Parent`);
					if (elm && elm.length)
						elm.addClass(`jqx-hidden`);
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
			for (let i in msecList) {
				setTimeout(() => {
					if (wnd && wnd.length)
						wnd.focus();
					content.find(`#miktar input`)
						.focus();
				}, msecList[i]);
			}
		}

		async degistirIstendiDevam(e) {
			const {content} = e;
			const det = e.detay;
			const {app, fis, listeWidget} = this;
			const {param, fiyatFra} = app;
			
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
							`@ ${this.app.appText} @`);
						return;
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
					`Girilen Fiyat (${toStringWithFra(fiyat, fiyatFra)} TL) , izin verilenden (${toStringWithFra(enDusukFiyat, fiyatFra)} TL) daha düşük`,
					`@ ${this.app.appText} @`);
				return;
			}
			
			const {dlgUI} = e;
			if (dlgUI && dlgUI.length)
				dlgUI.jqxWindow('close');
			
			const _rec = listeWidget.rowsByKey[det.uid];
			if (_rec)
				_rec.cacheReset();
			await this.degistir({ rec: det });
		}

		async degistirIstendiDevam_detaySetValues(e) {
			const {app} = sky;
			const {fiyatFra} = app;
			const {content} = e;
			//const {param} = this;
			const det = e.detay;
			// const fra = app.brm2Fra[det.brm || 'AD'] || 0;
			/*$.extend(det, {
				miktar: roundToFra(content.find('#miktar').jqxNumberInput('decimal'), fra) || 1,
				fiyat: roundToFra(content.find('#fiyat').jqxNumberInput('decimal'), fiyatFra) || 0,
				kdvOrani: parseInt(content.find('#kdvOrani').val()) || 0,
				iskOran1: roundToFra(content.find('#iskOran1').jqxNumberInput('decimal'), 2) || 0,
				iskOran2: roundToFra(content.find('#iskOran2').jqxNumberInput('decimal'), 2) || 0,
				iskOran3: roundToFra(content.find('#iskOran3').jqxNumberInput('decimal'), 2) || 0
			});*/
			await det.detayEkIslemler({ fis: this.fis, satisKosulYapilari: this.satisKosulYapilari });
			content.find(`#bedel`).html(bedelStr(det.netBedel));
		}

		async silIstendi(e) {
			// this.focusToDefault();
			this.app.hideNotifications();
			const {selectedIndex} = this;
			await this.sil();
			if (selectedIndex && selectedIndex > 0)
				this.listeWidget.selectRow(selectedIndex - 1);
		}

		temizleIstendi(e) {
			this.app.hideNotifications();
			let wnd = displayMessage(
				'<p class="red">Tüm Detaylar SİLİNECEK!</p><p>Devam Edilsin mi?</p>',
				this.app.appText,
				true,
				{
					EVET: async (dlgUI, btnUI) => {
						dlgUI.jqxWindow('destroy');
						await this.temizle();
						// this.focusToDefault();
					},
					HAYIR: (dlgUI, btnUI) =>
						dlgUI.jqxWindow('destroy')
				});
			wnd.off('close').on('close', evt => {
				// dlgUI.jqxWindow('destroy');
				// this.focusToDefault();
			})
		}

		birlestirIstendi(e) {
			this.birlestir();

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
			e = e || {};
			const layout = this.layout;
			const barkodContainer = layout.find('#barkodContainer');

			let barcodeReader = this.barcodeReader;
			if (!barcodeReader) {
				const deviceClass = CETBarkodDevice.defaultDeviceClass;
				if (!deviceClass)
					return;
				
				barcodeReader = this.barcodeReader = new deviceClass({
					content: barkodContainer,
					debug: this.app.class.isDebug,
					onKamerami: this.app.onKamerami,
					readCallback: e => {
						const barkod = e.result;
						this.hizliStokPart.text = barkod;
						this.hizliStok_itemSelected({ value: barkod });
						this.focusToDefault();
					}
				});
			}
			if (barcodeReader.isReady)
				await barcodeReader.start();
			else
				await barcodeReader.destroy();
			
			let elm = (e.event || {}).currentTarget;
			if (elm) {
				elm = $(elm);
				elm.removeClass(`ready paused running`);
				elm.addClass(barcodeReader.state);
			}
		}

		async fiyatGorIstendi(e) {
			e = e || {};
			const rec = this.selectedBoundRec || {};
			
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
						this.focusToDefault(e);
					}, 150)
				},
				events: {
					barcodeReaderBeforeActivated: async e => {
						const barcodeReader = this.barcodeReader;
						if (barcodeReader && !barcodeReader.isReady) {
							// await barcodeReader.destroy();
							this.layout.find('li#barkod').click();
						}
					}
				}
			})).part;
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

		siparistenKarsilaIstendi(e) {
			this.siparistenKarsila(e);
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
			e = e || {};
			const {app, fis} = this;
			let _rec = e.rec || this.selectedBoundRec;
			let detay = _rec;
			if (detay)
				detay = $.isPlainObject(detay) ? fis.class.detaySinif.From(detay) : detay;
			if (!detay)
				return;

			detay.cacheReset();
			e.detay = detay;
			if (detay.class.promosyonmu && !app.serbestModmu) {
				displayMessage(
					`<b>Promosyon</b> satırı <u>DEĞİŞTİRME</u> yetkiniz yok`,
					`! Son Stoktan Seç İşlemi !`
				);
				return;
			}

			const secince = async _e =>
				await this.sonStoktanSecIstendiDevam_kayitSecildi($.extend({ fis: fis, detay: detay }, _e));
			return await CETSonStoktanSecPart.run({
				parentPart: this,
				fis: fis, detay: detay,
				from: `fisGiris`,
				secince: app.fisGirisSadeceBarkodZorunlumu ? null : secince,
				geriCallback: _e => {
					setTimeout(() => {
						this.liste_hideFilterBar(e);
						this.onResize(e);
						this.focusToDefault(e);
					}, 150)
				}
			});
		}

		async sonStoktanSecIstendiDevam_kayitSecildi(e) {
			try {
				let {detay} = e;
				if (!detay)
					return;
	
				const {app, fis} = this;
				if (app.fisGirisSadeceBarkodZorunlumu) {
					displayMessage(`Sadece Barkod ile giriş yapılabilir, Son Stoktan Seçim yapamazsınız`, `@ Son Stoktan Seç İşlemi @`, undefined, undefined, undefined, undefined, 'top-right');
					return false;
				}
	
				const orjDetay = detay;
				const {sender, rec} = e;
				const {detayEkleFlag, miktarAlinsinFlag} = sender;
				if (detayEkleFlag) {
					detay = $.isPlainObject(rec) ? await fis.class.detaySinif.fromBarkodBilgi({ fis: fis, barkodBilgi: rec }) : rec;
					detay.miktar = (miktarAlinsinFlag ? rec.sonStok : orjDetay.miktar) || 1;
					delete detay.barkodParser;
					await this.ekleIstendi({ detay: detay });
				}
				else {
					detay.cacheReset();
					if (miktarAlinsinFlag)
						detay.miktar = rec.sonStok || 1;
	
					await detay.ekOzelliklerDo({ callback: async _e => {
						const rafmi = _e.tip == 'raf';
						const refRafmi = _e.tip == 'refRaf';
						if (rafmi && !fis.class.rafKullanilirmi)
							return true;			// continue loop
						if (refRafmi && !fis.class.refRafKullanilirmi)
							return true;			// continue loop
						
						const ekOzellik = _e.item;
						const {idSaha} = ekOzellik;
						for (const key in rec) {
							const value = rec[key];
							if (value != null && key == idSaha)
								ekOzellik.value = value;
						}
					} });
	
					const {listeWidget} = this;
					const _rec = listeWidget.rowsByKey[detay.uid];
					if (_rec)
						_rec.cacheReset();
					await this.degistir({ rec: detay });
				}
			}
			finally {
				setTimeout(() => {
					this.liste_hideFilterBar(e);
					this.onResize(e);
					this.focusToDefault(e);
				}, 150);
			}
		}
		
		async fisOzetBilgiIstendi(e) {
			await this.birlestir(e);
			
			return await new CETFisOzetBilgiPart({
				parentPart: this,
				from: `fisGiris`,
				geriCallback: _e => {
					this.chkKaydederkenYazdir.jqxToggleButton('toggled', asBool(this.kaydederkenYazdirFlag));
					this.chkKaydederkenAktar.jqxToggleButton('toggled', asBool(this.kaydederkenAktarFlag));
					
					setTimeout(() => {
						this.liste_hideFilterBar(e);
						this.onResize(e);
						this.focusToDefault(e);
					}, 150)
				}
			}).run();
		}

		async raporlarIstendi(e) {
			return await new CETRaporlarPart({
				parentPart: this,
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

		async sablondanYukleIstendiDevam(e) {
			e = e || {};
			const rec = e.rec;

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
				return false;
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
							this.focusToDefault(e);
						}, 150)
					},
					HAYIR: (dlgUI, btnUI) =>
						dlgUI.jqxWindow('destroy')
				});
			wnd.off('close').on('close', evt => {
				// dlgUI.jqxWindow('destroy');
				this.focusToDefault();
			})
		}

		async sablondanYukle(e) {
			e = e || {};
			let recs = e.detaylar;
			if ($.isEmptyObject(recs))
				return false;
			
			const {fis, satisKosulYapilari} = this;
			const dbMgr = fis.dbMgr;
			const detaySinif = fis.class.detaySinif;
			const detaylar = [];
			const shKod2Detaylar = {};
			for (let i in recs) {
				const rec = recs[i];
				let det = detaySinif.fromSablonBilgi({ rec: rec });
				if (det) {
					await det.detayEkIslemler_ekle({ fis: fis, satisKosulYapilari: satisKosulYapilari });
					detaylar.push(det);

					const shKod = det.shKod;
					if (shKod) {
						(shKod2Detaylar[shKod] = shKod2Detaylar[shKod] || [])
							.push(det);
					}
				}
			}

			let sent = new MQSent({
				from: `mst_Stok stk`,
				where: { inDizi: Object.keys(shKod2Detaylar), saha: 'stk.kod' },
				sahalar: [
					`stk.kod shKod`, `stk.aciklama shAdi`, `stk.grupKod`,
					`stk.brm`, `stk.brmFiyat fiyat`,
					`stk.${fis.class.stokKdvSaha} kdvOrani`,
					`stk.${fis.class.stokKdvDegiskenmiSaha} kdvDegiskenmi`,
				]
			});
			recs = await dbMgr.executeSqlReturnRows({ tx: e.tx, query: sent });
			for (let i in recs) {
				const rec = recs[i];
				const shKod = rec.shKod || rec.stokKod;
				delete rec.shKod;

				const _detaylar = shKod2Detaylar[shKod] || [];
				for (let i in _detaylar) {
					const det = _detaylar[i];
					let yenidenHesaplaFlag = false;
					for (const key in rec) {
						const value = rec[key];
						if (value) {
							det[key] = value;
							if (!yenidenHesaplaFlag && (key == 'fiyat' || key == 'kdvOrani' || key == 'kdvDegiskenmi'))
								yenidenHesaplaFlag = true;
						}
					}
					if (yenidenHesaplaFlag)
						await det.detayEkIslemler({ fis: fis, satisKosulYapilari: satisKosulYapilari });
				}
			}

			fis.detaylar = detaylar;
			await this.tazele();
		}

		async kaydetIstendi(e) {
			const {app} = this;
			if (app.fisOzetBilgiGosterilirmi)
				return await this.fisOzetBilgiIstendi(e);
			
			let result = await this.kaydet(e);
			if (result && !result.isError)
				this.geriIstendi();
			
			return result;
		}

		async onResize(e) {
			await super.onResize(e);
	
			const {divListe, listeWidget, btnSil, divFisBaslik/*, dipTable, dipTable_content*/} = this;
			if (!divListe)
				return;
			
			const offset = divListe.offset();
			let newHeight = offset.top + (listeWidget.filterHeight || 0) + 20;
			
			/*if (dipTable && dipTable.length && dipTable_content && dipTable_content.length) {
				const widget = dipTable.jqxNavigationBar('getInstance');
				if (!$.isEmptyObject(widget.expandedIndexes))
					newHeight += dipTable_content.height();
			}*/
			
			/*if (btnSil && btnSil.length) {
				btnSil.css('top', `${newHeight}px`);
				btnSil.css('left', `${offset.left + 100}px`);
			}*/

			/*const layouts = divFisBaslik.find(`.cetMstComboBox.part`);
			if (!$.isEmptyObject(layouts)) {
				const part = new CETMstComboBoxPart({ content: divFisBaslik });
				for (const i in layouts) {
					const subLayout = $(layouts[i]);
					const comboBox = part.comboBox = subLayout.find(`#widget`);
					if (comboBox && comboBox.length) {
						part.comboBoxWidget = comboBox.jqxComboBox('getInstance');
						await part.onResize(e);
					}
				}
			}*/
		}
	}
})()
