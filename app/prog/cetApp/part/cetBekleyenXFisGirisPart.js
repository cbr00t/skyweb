(function() {
	window.CETBekleyenXFisGirisPart = class extends window.CETListeOrtakPart {
		static get partName() { return 'cetBekleyenXFisGirisPart' }
		get fisGirisEkranimi() { return true }
		get adimText() {
			const {fis} = this; let prefix = '';
			const {ayrimTipAdi} = fis; if (ayrimTipAdi) { prefix += `<span style="margin-right: 8px;"><u>${ayrimTipAdi}</u></span>` }
			return `<div class="fisTipText">${prefix}${fis.class.aciklama}</div>`
		}
		get yeniKayitmi() { const {islem} = this; return islem == 'yeni' || islem == 'kopya' }
		constructor(e) {
			e = e || {}; super(e); const {app} = this, param = app.param.deepCopy(), {fis} = e;
			$.extend(this, {
				islem: e.islem || 'degistir', param, eskiFis: e.eskiFis, fis, kaydetOncesi: e.kaydetOncesi, kaydetIslemi: e.kaydetIslemi, kaydedince: e.kaydedince,
				degistimi: false, idSaha: '', anah2Detaylar: {}, ayrisimAyiracli_barkod2Detay: {}
			});
			if (!(this.layout || this.template)) { this.template = app.templates.bekleyenXFisGiris }
		}
		async activatePart(e) {
			await super.activatePart(e);
			setTimeout(() => {
				const {btnToggleFullScreen, chkOtoAktar, btnGonderimIsaretSifirla, btnLogout} = sky.app;
				if (btnToggleFullScreen && btnToggleFullScreen.length) btnToggleFullScreen.addClass('jqx-hidden')
				if (chkOtoAktar && chkOtoAktar.length) chkOtoAktar.addClass('jqx-hidden')
				if (btnGonderimIsaretSifirla && btnGonderimIsaretSifirla.length) btnGonderimIsaretSifirla.addClass('jqx-hidden')
				if (btnLogout && btnLogout.length) btnLogout.addClass('jqx-hidden')
			}, 150);
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

			await super.deactivatePart(e);
		}

		async destroyPart(e) {
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

			const {btnToggleFullScreen, chkOtoAktar, btnGonderimIsaretSifirla, btnLogout} = sky.app;
			setTimeout(() => {
				if (btnToggleFullScreen && btnToggleFullScreen.length)
					btnToggleFullScreen.removeClass('jqx-hidden')
				if (chkOtoAktar && chkOtoAktar.length)
					chkOtoAktar.removeClass('jqx-hidden')
				if (btnGonderimIsaretSifirla && btnGonderimIsaretSifirla.length)
					btnGonderimIsaretSifirla.removeClass(`jqx-hidden`)
				if (btnLogout && btnLogout.length)
					btnLogout.removeClass('jqx-hidden')
			}, 100);

			return await super.destroyPart(e);
		}


		async preInitLayout(e) {
			e = e || {};
			await super.preInitLayout(e);

			const layout = e.layout || this.layout;
			layout.addClass('cetBekleyenXFisGiris cetFisGiris');
			this.templates = $.extend(this.templates || {}, {
				fisBaslik: layout.find('template#templates_fisBaslik')
			});

			const {app, param} = this;
			let {fis} = this;
			if (!this.eskiFis) {
				this.eskiFis = fis;
				fis = this.fis = fis.deepCopy();
			}

			let {numaratorTip} = fis;
			const {ozelIsaret} = fis;
			if (ozelIsaret)
				numaratorTip += `-${ozelIsaret}`;

			const num = fis.numarator;
			if (num && numaratorTip && (fis.gecicimi || this.yeniKayitmi || !fis.fisNo)) {
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
			fis._detaylar = fis.detaylar
		}

		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);
			
			const layout = e.layout || this.layout;
			const {app, fis} = this;
			
			this.musteriDegisti($.extend({}, e, { initFlag: true }));
			
			const userSettings = this.param.userSettings || {};
			$.extend(this, {
				kaydederkenYazdirFlag: userSettings.kaydederkenYazdir,
				kaydederkenAktarFlag: userSettings.kaydederkenAktar,
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

		async initMustBilgi(e) {
			e = e || {};
			const layout = this.layout;
			if (!(layout && layout.length))
				return;
			
			const {app} = this;
			const dbMgr = app.dbMgrs.rom_data;
			const divMustBilgi = layout.find(`#mustBilgi`);
			
			const {fis} = this;
			let {mustKod} = fis;
			const divMustText = divMustBilgi.find(`.mustText`);
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
				const divMustText = divMustBilgi.find('.mustText');
				divMustText.html(new CKodVeAdi({ kod: mustKod, aciklama: unvan }).parantezliOzet({ styled: true }));
				divMustText.removeClass('jqx-hidden');
			}
			else
				divMustText.addClass('jqx-hidden');

			const {seri, fisNo, sevkTarih, sevkAdresKod, seferAdi, containerNox, soforAdi, plaka, ekBilgi, yerKod} = fis;
			const divFisNoxBilgi = divMustBilgi.find(`.fisNoxBilgi`);
			if (seri || fisNo) {
				let text = (fisNo || 0).toString();
				if (seri)
					text = `${seri} ${text}`;
				divFisNoxBilgi.find('._veri').html(text);
				divFisNoxBilgi.removeClass('jqx-hidden');
			}
			else
				divFisNoxBilgi.addClass('jqx-hidden');

			const divSevkTarih = divMustBilgi.find(`.sevkTarihBilgi`);
			if (sevkTarih) {
				divSevkTarih.find('._veri').html(dateKisaString(sevkTarih));
				divSevkTarih.removeClass('jqx-hidden');
			}
			else
				divSevkTarih.addClass('jqx-hidden');

			let sevkAdresText;
			if (sevkAdresKod) {
				const stm = new MQStm({
					sent: new MQSent({
						from: 'mst_SevkAdres',
						where: [{ degerAta: sevkAdresKod, saha: 'kod' }],
						sahalar: [`yore`, 'ilAdi']
					})
				});
				const rec = await dbMgr.tekilExecuteSelect({ query: stm });
				if (rec)
					sevkAdresText = [rec.yore, rec.ilAdi].filter(x => !!x).join(' / ');
			}
			const divSevkAdres = divMustBilgi.find('.sevkAdresBilgi');
			if (sevkAdresText) {
				divSevkAdres.find('._veri').html(sevkAdresText);
				divSevkAdres.removeClass('jqx-hidden');
			}
			else
				divSevkAdres.addClass('jqx-hidden');
			
			const divSeferBilgi = divMustBilgi.find(`.seferBilgi`);
			if (seferAdi) {
				divSeferBilgi.find('._veri').html((seferAdi || '').replaceAll('<', '&lt;').replaceAll('>', '&gt;'));
				divSeferBilgi.removeClass('jqx-hidden');
			}
			else
				divSeferBilgi.addClass('jqx-hidden');

			const divSoforBilgi = divMustBilgi.find(`.soforBilgi`);
			if (soforAdi) {
				divSoforBilgi.find('._veri').html(soforAdi);
				divSoforBilgi.removeClass('jqx-hidden');
			}
			else
				divSoforBilgi.addClass('jqx-hidden');

			const divPlakaBilgi = divMustBilgi.find(`.plakaBilgi`);
			if (plaka) {
				divPlakaBilgi.find('._veri').html(plaka);
				divPlakaBilgi.removeClass('jqx-hidden');
			}
			else
				divPlakaBilgi.addClass('jqx-hidden');

			const divEkBilgi = divMustBilgi.find(`.ekBilgi`);
			if (ekBilgi) {
				divEkBilgi.html(ekBilgi);
				divEkBilgi.removeClass('jqx-hidden');
			}
			else
				divEkBilgi.addClass('jqx-hidden');

			const divContainerNoxBilgi = divMustBilgi.find(`.containerNoxBilgi`);
			if (containerNox) {
				divContainerNoxBilgi.find('._veri').html(containerNox);
				divContainerNoxBilgi.removeClass('jqx-hidden')
			}
			else
				divContainerNoxBilgi.addClass('jqx-hidden')

			const divYerBilgi = divMustBilgi.find('.yerBilgi');
			if (yerKod) {
				const {caches} = sky.app;
				const yerKod2Rec = caches.yerKod2Rec = caches.yerKod2Rec || {};
				let rec = yerKod2Rec[yerKod];
				if (rec == null) {
					let sent = new MQSent({
						from: 'mst_Yer',
						where: [{ degerAta: yerKod, saha: 'kod' }],
						sahalar: ['*']
					});
					rec = yerKod2Rec[yerKod] = sky.app.dbMgr_mf.tekilDegerExecuteSelect({ query: sent })
				}
				let {aciklama} = rec || {};
				divYerBilgi.find('._veri').html(new CKodVeAdi({ kod: yerKod, aciklama: aciklama }).parantezliOzet({ styled: true }));
				divYerBilgi.removeClass('jqx-hidden')
			}
			else { divYerBilgi.addClass('jqx-hidden') }
		}
		async musteriDegisti(e) {
			const {fis} = this, {mustKod} = fis;
			let {sonMustKod} = this; if (sonMustKod && mustKod && sonMustKod != mustKod) { fis.sevkAdresReset() }
			sonMustKod = this.sonMustKod = mustKod; return this.initMustBilgi(e)
		}
		async initBaslikPanel(e) {
			const {fis} = this, {ozelIsaret} = fis, num = fis.numarator;
			let numaratorTip = fis.numaratorTip; if (ozelIsaret) { numaratorTip += `-${ozelIsaret}` }
			const {content} = e, subContent = this.baslik_content = content.find('.baslik .header'), navBar = this.baslik_navBar = content.find('.baslik .navBar');
			navBar.jqxNavigationBar({
				theme, animationType: animationType, expandMode: 'toggle', width: false, toggleMode: 'none', expandAnimationDuration: 50, collapseAnimationDuration: 50,
				/* expandedIndexes: fis.aciklama ? [0] : [] */ expandedIndexes: [0]
			});
			const navBarArrowClickHandler = evt => {
				let widget = navBar.jqxNavigationBar('getInstance');
				const index = 0; if ($.inArray(index, widget.expandedIndexes) != -1) { widget.collapseAt(index) } else { widget.expandAt(index) }
				for (const timeout of [20, 50, 100, 200]) { setTimeout(() => this.onResize(e), timeout) }
			};
			navBar.find('.jqx-expander-arrow').off('click, touchend, mouseup')
				.on('click, touchend, mouseup', evt => navBarArrowClickHandler(evt));
			subContent.find(`.jqx-expander-header-content`).off('click, mouseup, touchend')
				.on('click, mouseup, touchend', evt => {
					const {target} = evt, tagName = target.tagName.toUpperCase();
					if (!(tagName == 'INPUT' || tagName == 'TEXTAREA' || tagName == 'BUTTON' || target.classList.contains(`jqx-input-icon`))) { navBarArrowClickHandler(evt) }
				});
			navBar.on('expandedItem', evt => this.onResize(e)); navBar.on('collapsedItem', evt => this.onResize(e));
			if (num) {
				let txtFisSeri = subContent.find('#fisSeri').jqxInput({ theme, width: 60, height: false, maxLength: 3 });
				txtFisSeri = this.txtFisSeri = subContent.find('#fisSeri'); txtFisSeri.val(fis.seri || '');
				txtFisSeri.on('change', evt => {
					let target = evt.args || evt.target;
					const seri = (target.value || '').toUpperCase(); evt.target.value = seri;
					if (numaratorTip && (fis.gecicimi || this.yeniKayitmi)) {
						const param = this.param;
						const fisTip2SonSeri = param.fisTip2SonSeri = param.fisTip2SonSeri || {};
						if (fisTip2SonSeri[numaratorTip] != seri) { fisTip2SonSeri[numaratorTip] = seri; this.paramDegistimi = true }
					}
					this.fis.seri = seri
				});
				let txtFisNo = subContent.find('#fisNo').attr('maxLength', 9).jqxNumberInput({
					theme, width: 165, inputMode: 'simple', min: 0, max: 999999999, decimalDigits: 0,
					spinButtons: true, spinButtonsWidth: 32, decimal: asInteger(fis.fisNo) || null
				});
				txtFisNo = this.txtFisNo = subContent.find('#fisNo');
				txtFisNo.on('change', evt => { let target = evt.args || evt.target; this.fis.fisNo = asInteger(target.value) });
				let fisSeriNoDegisti = async evt => {
					if (num && (fis.gecicimi || this.yeniKayitmi)) {
						num.seri = txtFisSeri.val() || ''; delete num.promise; await num.yukle();
						txtFisNo.jqxNumberInput('placeHolder', num.sonNo + 1);
						this.app.setUniqueTimeout({
							key: `fisSeriNoDegisti_fisNoVal_fix`, delayMS: 500, args: { txtFisNo: txtFisNo },
							block: e => { let val = txtFisNo.val(); if (!val && val != null) { txtFisNo.val(val = null) } }
						})
					}
				}
				subContent.find(`#fisSeri, #fisNo input`).on('change', evt => fisSeriNoDegisti(evt));
				subContent.find('#fisNo .jqx-action-button').on('click, touchend', evt => fisSeriNoDegisti(evt));
				if (fis.gecicimi || this.yeniKayitmi || !fis.fisNo) { (async () => { await num.promise; txtFisNo.jqxNumberInput('placeHolder', fis.numarator.sonNo + 1); })(); }
			}
			else { subContent.find('#fisNo').parent().addClass('jqx-hidden') }
			const detContent = content.find(`.baslik .content`), ci = Date.CultureInfo;
			let txtTarih = this.txtTarih = detContent.find('#tarih'); txtTarih.datepicker({
				changeMonth: true, changeYear: true, theme, constrainInput: false, showButtonPanel: true, /* showOn: 'button', */ buttonText: 'Tarih Seç',
				buttonImage: 'lib/calendar.gif', buttonImageOnly: true, dateFormat: /*ci.shortDate*/ 'dd.mm.yy', firstDay: ci.firstDayOfWeek,
				weekHeader: 'Hft.', showWeek: true, currentText: 'BUGÜN', closeText: 'KAPAT',
				dayNames: ci.dayNames, dayNamesShort: ci.abbreviatedDayNames, dayNamesMin: ci.shortestDayNames,
				monthNames: ci.monthNames, monthNamesShort: ci.abbreviatedMonthNames
			});
			txtTarih.val(dateToString(fis.tarih)); txtTarih.datepicker($.datepicker.regional['tr']);
			txtTarih.on('change', async evt => {
				const input = $(evt.target); let value = input.val();
				if (value && !isInvalidDate(value)) {
					input.data('savedVal', value);
					const eskiTarih = asDate(fis.tarih), tarih = asDate(value);
					fis.tarih = tarih;
					if (eskiTarih != tarih) {
						await fis.cacheReset(); for (const key of ['satisKosulYapilari', 'promosyonYapilari']) { delete this[key] }
						await this.musteriDegisti(e)
					}
				}
			});
			txtTarih.on('focusin', evt => evt.target.select());
			txtTarih.on('focusout', async evt => {
				let input = $(evt.target), ch = input.val(), value = tarihDegerDuzenlenmis(ch, () => input.data('savedVal'));
				if (value) {
					evt.preventDefault(); input.val(value || '');
					const eskiTarih = asDate(fis.tarih), tarih = asDate(value);
					fis.tarih = tarih;
					if (eskiTarih != tarih) {
						await fis.cacheReset(); for (const key of ['satisKosulYapilari', 'promosyonYapilari']) { delete this[key] }
						await this.musteriDegisti(e)
					}
				}
			});
			const divOzelIsaretIndicator = content.find(`#ozelIsaretIndicator`);
			if (ozelIsaret) {
				let cssClassName; switch (ozelIsaret) { case '*': cssClassName = `yildiz`; break; case 'X': cssClassName = `X`; break; }
				if (cssClassName) { divOzelIsaretIndicator.addClass(cssClassName); for (const elm of [subContent, content]) { elm.addClass(`ozelIsaret-${cssClassName}`) } }
				divOzelIsaretIndicator.html(ozelIsaret); divOzelIsaretIndicator.removeClass('jqx-hidden');
			}
			detContent.find('#notlar').val(fis.aciklama || '')
				.on('change', evt => { let target = evt.args || evt.target; this.fis.aciklama = (target.value || '') });

			const divFisBaslik = this.divFisBaslik = detContent.find(`.fisBaslik`); divFisBaslik.addClass(`basic-hidden`);
			setTimeout(async () => {
				await this.initFisBaslikUI(e);
				const baslikContentLayout = e.baslikContentLayout, baslikBilgisiVarmi = baslikContentLayout?.length && baslikContentLayout.find(`.parent:not(.jqx-hidden)`)?.length;
				if (!(fis.aciklama || (baslikBilgisiVarmi && this.yeniKayitmi))) {
					this.baslik_navBar.jqxNavigationBar('collapseAt', 0);
					const timeouts = [100, 200]; for (const timeout of timeouts) { setTimeout(() => this.onResize(e), timeout) }
				}
				if (baslikBilgisiVarmi) { setTimeout(() => divFisBaslik.removeClass(`basic-hidden`), 300); } else { divFisBaslik.removeClass(`basic-hidden`) }
				content.find(`input[type=text], input[type=textbox], input[type=textarea]`).on('focus', evt => evt.target.select());
			}, 100);
		}
		async initFisBaslikUI(e) {
			const {fis} = this, {adimTipi} = fis.class; if (!adimTipi) { return null }
			const subContent = this.divFisBaslik; if (!subContent?.length) { return null }
			const content = e.content || this.content, templates = this.templates.fisBaslik, layouts = [templates.contents(`.ortak`), templates.contents(`.${adimTipi}`)];
			for (let baslikContentLayout of layouts) {
				if (!baslikContentLayout?.length) { continue }
				baslikContentLayout = e.baslikContentLayout = baslikContentLayout.clone(true); baslikContentLayout.appendTo(subContent);
				let _e = { ...e, parentPart: this, parentContent: content, layout: baslikContentLayout }; await fis.initBaslikUI(_e);
				subContent[subContent.hasVScrollBar() ? 'addClass' : 'removeClass'](`vScroll scroll`);
				subContent[subContent.hasHScrollBar() ? 'addClass' : 'removeClass'](`hScroll scroll`);
				await new Promise(resolve => { setTimeout(() => resolve(), 100) })
			}
			return layouts.filter(x => x?.length)
		}
		async initDetayPanel(e) {
			const {layout, fis} = this, {content} = e, navBar = this.detay_navBar = content.find('.detay .navBar');
			navBar.jqxNavigationBar({ theme, animationType, expandMode: 'none', width: false, toggleMode: 'none', expandAnimationDuration: 50, collapseAnimationDuration: 50 });
			navBar.jqxNavigationBar('hideArrowAt', 0);
			const subContent = this.detay_content = content.find('.detay .header'); let width = subContent.width();
			navBar.on('expandedItem', evt => { this.onResize(e) }); navBar.on('collapsedItem', evt => { this.onResize(e) });
			setTimeout(async () => {
				const txtBarkod = this.txtBarkod = subContent.find('#txtBarkod');
				if (fis.devreDisimi) {
					txtBarkod.parent().addClass('jqx-hidden'); layout.find(`#sil`).addClass('jqx-hidden');
					layout.find(`#temizle`).addClass('jqx-hidden'); layout.find(`#barkod`).addClass('jqx-hidden');
				}
				else {
					txtBarkod.attr('placeholder', 'Barkod Okutunuz');
					txtBarkod.on('keyup', evt => {
						const key = evt.key?.toLowerCase();
						if (key == 'enter' || key == 'linefeed') { this.txtBarkod_enterIstendi({ event: evt, value: (evt.target.value || '').trim() }) }
					});
					txtBarkod.on('focus', evt => { evt.target.select() });
					txtBarkod.on('blur', evt => { if (this.lockedFlag) { this.setUniqueTimeout({ key: 'focusToDefault', delayMS: 2000, block: () => { this.focusToDefault() } }) } })
				}
			}, 500)
		}
		async tazele(e) { let result = await super.tazele(e); this.degistimi = false; return result }
		async degistir(e) {
			e = e || {}; let result = await super.degistir(e);
			const rec = e.rec || {}, {barkodParser} = rec;
			const barkod = rec.barkod || (rec.barkodParser || {}).barkod;
			if (barkod && barkodParser && barkodParser.ayrisimAyiraclimi && barkodParser.zVarmi) { this.ayrisimAyiracli_barkod2Detay[barkod] = rec }
			return result
		}
		sil(e) {
			e = e || {}; const rec = e.rec || this.selectedBoundRec || {};
			rec.miktar = rec.paketMiktar = rec.okutmaSayisi = 0; rec.altDetaylar = {};
			const {ayrisimAyiracli_barkod2Detay} = this, {barkod, okunanTumBarkodlar} = rec;
			if (barkod) { delete ayrisimAyiracli_barkod2Detay[barkod] }
			if (okunanTumBarkodlar) { for (const barkod in okunanTumBarkodlar) { delete ayrisimAyiracli_barkod2Detay[barkod] } }
			return this.degistir(e)
		}
		temizle(e) {
			const {listeRecs: recs} = this;
			for (const rec of recs) { rec.miktar = rec.paketMiktar = rec.okutmaSayisi = 0; rec.altDetaylar = {} }
			this.ayrisimAyiracli_barkod2Detay = {};
			return this.tazele(e)
		}
		async kaydet(e) {
			const {app, fis} = this, layout = e.layout || this.layout; app.hideNotifications();
			e = $.extend({ sender: this, islem: this.islem, eskiFis: this.eskiFis, gecicimi: fis.gecicimi }, e);
			fis.detaylar = this.listeRecs.map(rec => {
				rec = $.isPlainObject(rec) ? new fis.class.detaySinif(rec) : rec;
				for (const key of ['_visible']) { delete rec[key] } return rec
			});
			await fis.dipHesapla();
			let handler = this.kaydetOncesi || this.kaydetOncesiDefault;
			if (handler) { let result = await handler.call(this, e); if (result === false) { return false } }
			return await this.kaydetDevam(e)
		}
		async kaydetDevam(e) {
			e = e || {}; const {app} = this, {param} = app;
			if (!(this.prefetch || this.isPrefetch)) {
				setButonEnabled(this.islemTuslari, false); (savedProcs || window).showProgress(null, null, 1, true);
				setTimeout(() => { (savedProcs || window).hideProgress(); setButonEnabled(this.islemTuslari, true) }, 2000)
			}
			if (this.paramDegistimi) { await param.kaydet() }
			$.extend(param, this.param);
			const fis = e.fis || this.fis;
			let handler = this.kaydetIslemi || this.kaydetDevam2; if (handler) { let result = await handler.call(this, e); if (!result) { return false } }
			this.degistimi = false; handler = this.kaydedince; if (handler) { handler.call(this, e) }
			return true
		}
		async kaydetDevam2(e) {
			e = e || {}; const fis = e.fis || this.fis, dbMgr = fis.dbMgr;
			let savedFisNo = fis.fisNo; const num = fis.numarator;
			if (num /*&& !(e.gecicimi || fis.gecicimi)*/) {
				$.extend(num, { seri: fis.seri, sonNo: num.sonNo + 1 });
				let numaratorIcinUygunmu = !fis.fisNo && (e.gecicimi || fis.gecicimi || this.yeniKayitmi || !fis.fisNo);
				if (numaratorIcinUygunmu) {
					try { await num.kesinlestir({ yeniKayitmi: numaratorIcinUygunmu && this.yeniKayitmi, islem: this.islem, dbMgr, fisSinif: fis.class, fisID: fis.id }) }
					catch (ex) {
						if (ex.rc == 'runtimeInterrupt' || ex.rc == 'userAbort') { return false }
						displayMessage(`${ex.errorText || ex.message || ex}`, `@ Numaratör Kayıt İşlemi @`, undefined, undefined, false, true);
						console.error(`numarator kayıt hatası`, ex); throw ex;
					}
					fis.fisNo = num.sonNo || 1
				}
				if (savedFisNo) {
					let yeniNo = await num.fisNoDuzelt({
						yeniKayitmi: numaratorIcinUygunmu && this.yeniKayitmi, islem: this.islem, dbMgr: dbMgr, fisSinif: fis.class,
						fisID: fis.id, seri: fis.seri, fisNo: fis.fisNo || num.sonNo
					});
					if (fis.fisNo != yeniNo) { fis.fisNo = yeniNo || 1; if (numaratorIcinUygunmu) { num.sonNo = fis.fisNo; await num.kaydet() } }
				}
			}
			try {
				fis.gecicimi = false;
				let result = await fis.kaydet(e); if (!result || result.isError) { return result }
				await fis.geciciFisleriTemizle(); await dbMgr.transaction();
				if (savedFisNo && fis.fisNo != savedFisNo) { displayMessage(`<i>${savedFisNo}</i> olan Belge Numarası <b>${fis.fisNo}</b> olarak değişti.`, 'Bilgilendirme') }
				return result
			}
			catch (ex) {
				if (ex.rc == 'runtimeInterrupt' || ex.rc == 'userAbort') { return false }
				displayMessage(`${ex.errorText || ex.message || ex}`, `@ Belge Kayıt İşlemi @`, undefined, undefined, false, true); console.error(`fiş kayıt hatası`, ex)
			}
			finally { if (fis) { fis.gecicimi = e.gecicimi } }
		}
		async listeArgsDuzenle(e) {
			await super.listeArgsDuzenle(e); $.extend(e.listeArgs, {
				/* editable: true, */ serverProcessing: false, pageable: true, filterable: true, columnsResize: false,
				showToolbar: false, toolbarHeight: 36, filterHeight: 25, filterMode: 'default',
				pageSizeOptions: [3, 5, 8, 10, 11, 13, 15, 20, 25], pageSize: this.userSettings_liste.pageSize || 8,
				height: $(window).width() < 450 ? $(window).height() - 150 : $(window).height() - 180
			})
		}
		async liste_columnsDuzenle(e) {
			const {app} = this, {fiyatFra, ozelKampanyaKullanilirmi} = app;
			await super.liste_columnsDuzenle(e); $.merge(e.listeColumns, [
				{
					text: 'Ürün Adı', align: 'left', dataField: 'shAdi',
					cellsRenderer: (rowIndex, columnIndex, value, rec) => {
						const {app, fis} = this, Prefix_AltDetay = 'altDetay-';
						rec = rec.originalRecord || rec; const stokFra = app.brm2Fra[rec.brm || 'AD'] || 0;
						const divSatir = this.newListeSatirDiv(e); divSatir.attr('data-index', rowIndex);
						for (const key in rec) { const value = rec[key], item = divSatir.find(`.${key}`); if (item.length) { item.html(value) } }
						const {miktar} = rec, divMiktar = divSatir.find('.miktar'); if (divMiktar.length) {
							let miktarText = rec.paketKod ? `${rec.paketMiktar || 1} ${rec.paketKod} = ` : ``;
							miktarText += toStringWithFra(miktar, stokFra); divMiktar.html(miktarText)
						}
						const yerParent = divSatir.find('.yer'), {yerKod} = rec; if (yerKod) { yerParent.find('._veri').html(yerKod); yerParent.removeClass('jqx-hidden') }
						const ekOzelliklerParent = divSatir.find('.ekOzellikler'), {sadeceOzellikAnahtarStr} = rec; if (sadeceOzellikAnahtarStr) {
							ekOzelliklerParent.find('._veri').html(sadeceOzellikAnahtarStr); ekOzelliklerParent.removeClass('jqx-hidden') }
						const {hMiktar} = rec, divHedefMiktarBilgi = divSatir.find('.hedefMiktarBilgi'); if (hMiktar && fis.class.hedefMiktarGosterilirmi) {
							divHedefMiktarBilgi.find('._veri').html(toStringWithFra(hMiktar, stokFra)); divHedefMiktarBilgi.removeClass('jqx-hidden') }
						const {paketBilgi} = rec, divPaketBilgi = divSatir.find('.paketBilgiText');
						if (paketBilgi) { divPaketBilgi.find('._veri').html(paketBilgi); divPaketBilgi.removeClass('jqx-hidden') }
						const {karmaPaletNo} = rec, divKarmaPaletNoBilgi = divSatir.find('.karmaPaletNoBilgi');
						if (karmaPaletNo) { divKarmaPaletNoBilgi.find('._veri').html(karmaPaletNo); divKarmaPaletNoBilgi.removeClass('jqx-hidden') }
						const {altDetaylar} = rec; if (!$.isEmptyObject(altDetaylar)) {
							const divAltDetaylar = divSatir.find('.altDetaylar'), keys = Object.keys(altDetaylar).reverse(); let seq = 0;
							for (const detAnahStr of keys) {
								const altDetay = altDetaylar[detAnahStr], divAltDetay = this.newListeSubPart({ selector: '.altDetaySatir' });
								divAltDetay.attr('data-index', ++seq); divAltDetay.attr('data-key', detAnahStr);
								for (const key in altDetay) {
									const value = altDetay[key]; let item = divAltDetay.find(`.${Prefix_AltDetay}-${key}`);
									if (!item.length) { item = divAltDetay.find(`.${key}`) }
									if (item.length) { item.html(value) }
								}
								if (seq) { const divSeq = divAltDetay.find(`.${Prefix_AltDetay}seq`); if (divSeq.length) { divSeq.html(seq) } }
								const {miktar} = altDetay, divMiktar = divAltDetay.find(`.${Prefix_AltDetay}miktar`);
								if (divMiktar.length) {
									let miktarText = altDetay.paketkod ? `<span class="paketText">${altDetay.paketmiktar || 1} ${altDetay.paketkod}</span> = ` : ``;
									miktarText += toStringWithFra(miktar, stokFra); divMiktar.html(miktarText);
								}
								const {brm} = altDetay, divBrm = divAltDetay.find(`.${Prefix_AltDetay}brm`); if (divBrm.length) { divBrm.html(brm || 'AD') }
								const paketIcAdet = altDetay.paketicadet; if (paketIcAdet) {
									const divPaketIcAdet = divAltDetay.find('.altDetay-paketIcAdet');
									divPaketIcAdet.find('._veri').html(paketIcAdet); divPaketIcAdet.removeClass('jqx-hidden basic-hidden')
								}
								const yerParent = divAltDetay.find(`.${Prefix_AltDetay}yer`), {yerKod} = altDetay;
								if (yerKod) { yerParent.find('._veri').html(yerKod); yerParent.removeClass('jqx-hidden') }
								const ekOzelliklerParent = divAltDetay.find(`.${Prefix_AltDetay}ekOzellikler`), {ekOzellikler} = altDetay;
								if (ekOzellikler) {
									const ekOzelliklerStr = Object.values(ekOzellikler).join(CETEkOzellikler.anahtarDelim);
									ekOzelliklerParent.find('._veri').html(ekOzelliklerStr); ekOzelliklerParent.removeClass('jqx-hidden')
								}
								const rafBilgiParent = divAltDetay.find(`.${Prefix_AltDetay}rafBilgi`);
								if (ekOzellikler && ekOzellikler.rafKod) { rafBilgiParent.find('._veri').html(ekOzellikler.rafKod); rafBilgiParent.removeClass('jqx-hidden basic-hidden') }
								divAltDetay.appendTo(divAltDetaylar)
							}
							divAltDetaylar.removeClass('jqx-hidden basic-hidden')
						}
						return divSatir[0].outerHTML.trim();
					}
				},
				{ text: 'Ürün Kod', align: 'left', dataField: 'shKod', hidden: true }
			]);
		}
		async initIslemTuslari(e) {
			e = e || {}; const layout = e.layout || this.layout, {app, fis, listePopup} = this;
			const degisiklikYapilabilirmi = (this.islem != 'izle') && !(fis.devreDisimi || fis.gonderildimi /*|| fis.gecicimi*/);
			let islemTuslari = this.islemTuslari = layout.find('.asil.islemTuslari'); islemTuslari.children('button').jqxButton({ theme }); islemTuslari.removeClass('jqx-hidden');
			const btnKaydet = this.btnKaydet = islemTuslari.find('#kaydet'); btnKaydet.off('click');
			if (!(degisiklikYapilabilirmi || (fis.gecicimi || this.yeniKayitmi))) {
				if (!(this.prefetch || this.isPrefetch)) { setButonEnabled(btnKaydet, false); btnKaydet.jqxButton('disabled', true); islemTuslari.children().addClass('jqx-hidden') }
			}
			else { btnKaydet.on('click', evt => { this.kaydetIstendi($.extend({}, e, { event: evt })) }) }
			if (this.ozelIslemTuslariPart) { this.ozelIslemTuslariPart.destroyPart() }
			let ozelIslemTuslariPart = this.ozelIslemTuslariPart = new CETExpandableIslemTuslariPart({
				position: false, templateItems: layout.find(`.toolbar-external.islemTuslari-ozel`),
				onItemClicked: e => this.liste_islemTusuTiklandi(e)
			});
			await ozelIslemTuslariPart.run();
			let {parentMenu} = ozelIslemTuslariPart; if (parentMenu) { this.btnSil = parentMenu.find(`#sil`) }
			let islemTuslariPart = this.islemTuslariPart = new CETExpandableIslemTuslariPart({
				templateItems: layout.find(`.toolbar-external.islemTuslari`), onItemClicked: e => this.liste_islemTusuTiklandi(e) });
			await islemTuslariPart.run();
			parentMenu = islemTuslariPart.parentMenu;
			if (parentMenu) { const removeKeys = []; for (const key of removeKeys) { const item = parentMenu.find(`#${key}.item`); if (item.length) { item.remove() } } }			
		}
		async loadServerData(e) {
			const {app, fis} = this, {detaySinif} = fis.class, {depoSiparisKarsilamaZorunluHMRSet} = app;
			const recs = fis.orjDetaylar ?? fis.detaylar, stokKodSet = {}, paketKodSet = {}, stokKod2PaketKod2IcAdet = this.stokKod2PaketKod2IcAdet = {};
			if (fis.orjDetaylar == null) { fis.orjDetaylar = recs }
			for (const det of recs) {
				const {paketBilgi} = det; if (paketBilgi) {
					const paketKod2IcAdet = det.paketKod2IcAdet = {}, parts = paketBilgi.split(',').map(x => x.trim());
					for (const part of parts) {
						const subPart = part.split(' '), paketKod = (subPart.length > 1 ? subPart[1] : subPart[0]).trim();
						paketKod2IcAdet[paketKod] = null; stokKodSet[det.shKod] = true; paketKodSet[paketKod] = true
					}
				}
			}
			if (!$.isEmptyObject(paketKodSet)) {
				const sent = new MQSent({
					from: 'mst_StokPaket', sahalar: ['stokKod', 'paketKod', 'paketIcAdet'],
					where: [new MQOrClause([ { inDizi: Object.keys(stokKodSet), saha: 'stokKod' }, { inDizi: Object.keys(paketKodSet), saha: 'paketKod' } ])]
				});
				const stm = new MQStm({ sent, orderBy: ['varsayilanmi DESC'] }), _recs = await sky.app.dbMgr_mf.executeSqlReturnRowsBasic(sent);
				for (let i = 0; i < _recs.length; i++) {
					const _rec = _recs[i], {stokKod, paketKod} = _rec;
					const paketKod2IcAdet = stokKod2PaketKod2IcAdet[stokKod] = stokKod2PaketKod2IcAdet[stokKod] || {};
					if (paketKod2IcAdet[paketKod] == null) { paketKod2IcAdet[paketKod] = asFloat(_rec.paketIcAdet) }
				}
			}
			const anah2Detaylar = this.anah2Detaylar = {}, {ayrisimAyiracli_barkod2Detay} = this;
			for (let i = 0; i < recs.length; i++) {
				let det = recs[i]; if ($.isPlainObject(det)) { det = recs[i] = new detaySinif(det) }
				const {paketBilgi, shKod, altDetaylar} = det; if (paketBilgi) {
					const {paketKod2IcAdet} = det;
					for (const paketKod of Object.keys(paketKod2IcAdet)) {
						const paketIcAdet = (stokKod2PaketKod2IcAdet[shKod] || {})[paketKod] || 1; paketKod2IcAdet[paketKod] = paketIcAdet;
						const anahStr = det.getAnahtarStr({ with: [paketKod], hmrSet: depoSiparisKarsilamaZorunluHMRSet }); (anah2Detaylar[anahStr] = anah2Detaylar[anahStr] || []).push(det)
					}
				}
				if (altDetaylar) {
					for (const key in altDetaylar) {
						const altDetay = altDetaylar[key], {okunanbarkod} = altDetay, okunanTumBarkodlar = altDetay.okunanTumBarkodlar = altDetay.okunanTumBarkodlar || {};
						if (okunanbarkod) { okunanTumBarkodlar[okunanbarkod] = true }
						for (const barkod in okunanTumBarkodlar) { ayrisimAyiracli_barkod2Detay[barkod] = ayrisimAyiracli_barkod2Detay[barkod] || altDetay }
					}
				}
				const anahStr = det.getAnahtarStr({ with: [''], hmrSet: depoSiparisKarsilamaZorunluHMRSet });
				(anah2Detaylar[anahStr] = anah2Detaylar[anahStr] || []).push(det);
				fis.detaylar = []
			}
			e.callback({ totalrecords: recs.length, records: recs });
		}
		async satirlariYenidenHesapla(e) {
			e = e || {}; const {fis, satisKosulYapilari} = this, islemYenimi = this.islem == `yeni`;
			for (const det of fis.detaylar) {
				det.ozelFiyatVarmi = det.ozelIskontoVarmi = false; if (det.ekBilgileriBelirle) { await det.ekBilgileriBelirle({ fis }) }
				if (det.detayEkIslemler_ekle) { await det.detayEkIslemler_ekle({ fis, satisKosulYapilari }) }
				else if (det.detayEkIslemler) { await det.detayEkIslemler({ fis, satisKosulYapilari }) }
			}
			await fis.dipHesapla(); this.tazele()
		}
		focusToDefault() {
			const {activePart} = sky.app; if (!(activePart == this && $.isEmptyObject(this.windows))) { return false }
			this.txtBarkod.focus(); return true;
		}
		async geriYapilabilirmi(e) {
			if (!await super.geriYapilabilirmi(e)) { return false }
			if (this.fis.devreDisimi || !this.degistimi) { return true }
			return await new Promise(then => {
				displayMessage(
					'Ekranda değişiklik yapılmış, yine de çıkılsın mı?', this.app.appText, true, {
						EVET: (dlgUI, btnUI) => { dlgUI.jqxWindow('destroy'); then(true) },
						HAYIR: (dlgUI, btnUI) => { dlgUI.jqxWindow('destroy'); then(false) }
					}
				)
			})
		}
		txtBarkod_enterIstendi(e) {
			e = e ?? {}; const {target} = e;
			const value = e.value == null ? (target ? target.value : this.txtBarkod.val()) : e.value; e.barkod = value; delete e.value;
			if (target) { target.value = '' } else { this.txtBarkod.val('') }
			this.degistirIstendi(e); return true
		}
		async liste_veriYuklendi(e) {
			await super.liste_veriYuklendi({ ...e, noAutoSelect: true }); if (!this.listeReadyFlag) { return; }
			setTimeout(async () => { if (!this.isListeVeriYuklendiEventTriggered) { this.isListeVeriYuklendiEventTriggered = true } this.degistimi = false }, 10)
		}
		liste_rendered(e) {
			let inEventFlag = false; const {app} = sky, {fis} = this, {listeWidget} = this;
			const rafKullanilirmi = fis.class.rafKullanilirmi && (app.ekOzellikKullanim.raf || {}).kullanilirmi;
			if (listeWidget.table && listeWidget.table.length) {
				const trRow = listeWidget.table.find(`tr[role=row]`), divAltDetaylar = trRow.find(`.jqx-grid-cell .listeSatir .altDetaylar`);
				const handler_paketBoz = async evt => {
					if (inEventFlag) { return }
					inEventFlag = true; setTimeout(() => inEventFlag = false, 50); app.hideNotifications();
					const clickedElm = $(evt.target), uid = clickedElm.parents(`tr[role=row]`).data('key');
					let detay = listeWidget.rowsByKey[uid]; detay = detay.originalRecord || detay;
					let divAltDetaySatir = clickedElm; if (!divAltDetaySatir.hasClass('altDetaySatir')) { divAltDetaySatir = divAltDetaySatir.parents('.altDetaySatir') }
					const key = divAltDetaySatir.data('key'), orj_altDetay = detay.altDetaylar[key];
					const paketMiktar = orj_altDetay.paketmiktar || 0, paketIcAdet = orj_altDetay.paketicadet || 0;
					if (paketMiktar <= 0) { displayMessage(`Bozulacak paket kalmamıştır`, `! Paket Bozma İşlemi !`); return }
					const {shKod} = detay, paketKod = orj_altDetay.paketkod; let maxPaketIcAdet;
					if (paketKod) {
						let sent = new MQSent({
							from: 'mst_StokPaket', sahalar: ['paketIcAdet'],
							where: [{ degerAta: shKod, saha: 'stokKod' }, { degerAta: paketKod, saha: 'paketKod' }]
						});
						maxPaketIcAdet = asInteger(await sky.app.dbMgr_mf.tekilDegerExecuteSelect(sent))
					}
					let altDetay = orj_altDetay.deepCopy ? orj_altDetay.deepCopy() : $.extend(true, {}, orj_altDetay);
					this.disableListeResizeEventsFlag = true; setTimeout(() => {
						const trRow = listeWidget.table.find(`tr[role=row][data-key="${uid}"]`), divAltDetaylar = trRow.find(`.jqx-grid-cell .listeSatir .altDetaylar`);
						divAltDetaySatir = divAltDetaylar.find(`.altDetaySatir[data-key="${key}"]`); divAltDetaySatir.addClass('selected')
					}, 100);
					let promise = new $.Deferred();
					const wndCSSName = `paketBoz altDetay-duzenle ${this.class.partName} ${app.appName} ${app.rootAppName} cetBekleyenXFisGiris part`;
					let wndLayout = $(
						`<div class="${wndCSSName}">` +
							`<div class="sub-content">` +
								`<div id="paketIcAdet" class="_row flex-row">` +
									`<label class="_etiket">Paket İçi:</label>` +
									(`<input class="_veri" type="number" maxlength="9" ` +
										`value="${paketIcAdet}" `+
										`min="0" max="${maxPaketIcAdet}" `+
										`placeHolder="${maxPaketIcAdet}">` +
									`</input>`) +
								`</div>` +
								/*`<div id="miktar" class="_row flex-row">` +
									`<label class="_etiket">Miktar:</label>` +
									`<input class="_veri" type="textbox" maxlength="9"></input>` +
								`</div>` +*/
							`</div>` +
						`</div>`
					);
					const wnd = createJQXWindow(
						wndLayout, `Paket Bozma Ekranı`,
						{ isModal: true, autoOpen: true, width: 350, height: 200 },
						{
							TAMAM: (dlgUI, btnUI) => {
								const _promise = promise; promise = null;
								wnd.jqxWindow('close'); if (_promise) { _promise.resolve({ sender: dlgUI }) }
							},
							VAZGEC: (dlgUI, btnUI) => { wnd.jqxWindow('close') }
						}
					); wnd.addClass(wndCSSName);
					const wndContent = wnd.find('.jqx-window-content'), subContent = wndContent.find('.sub-content');
					let input = subContent.find('#paketIcAdet ._veri'); input.on('change', evt => { altDetay.paketicadet = asInteger(evt.target.value) || 0 });
					const inputs = subContent.find('input');
					inputs.on('focus', evt => { evt.target.select() });
					inputs.on('keyup', evt => {
						const key = evt.key?.toLowerCase();
						if (key == 'enter' || key == 'linefeed') { wnd.find(`.ui-window-content .ui-dialog-button input[type=button][value="TAMAM"]`).click() }
					});
					setTimeout(() => { subContent.find('#paketIcAdet > ._veri').focus() }, 10);
					wnd.on('close', evt => {
						delete this.disableListeResizeEventsFlag;
						divAltDetaySatir.removeClass('selected'); wnd.jqxWindow('destroy');
						if (promise) { promise.reject({ sender: null, isError: false, rc: 'userAbort' }) }
					});

					promise.then(e => {
						try {
							const paketIcAdet = altDetay.paketicadet, orjPaketIcAdet = orj_altDetay.paketicadet;
							if (paketIcAdet == orjPaketIcAdet) { return }
							if (paketIcAdet > maxPaketIcAdet) { displayMessage(`Paket İç Adedi <b>${maxPaketIcAdet}</b> miktarından <u>daha küçük</u> olmalıdır`, `@ Paket Bozma İşlemi @`); return }
							if (paketIcAdet <= 0) { displayMessage(`Paket İç Adedi <b>0</b>'dan <u>büyük</u> olmalıdır`, `@ Paket Bozma İşlemi @`); return }
							const paketKod = altDetay.paketkod, paketMiktar = altDetay.paketmiktar = 1;
							altDetay.miktar = paketMiktar * paketIcAdet;
							orj_altDetay.paketmiktar--; orj_altDetay.miktar -= orjPaketIcAdet;
							
							const farkMiktar = orjPaketIcAdet - paketIcAdet; detay.miktar -= farkMiktar;
							const {altDetaylar} = detay, newKey = detay.getAnahtarStr({ with: [paketKod, paketIcAdet], hmrSet: null });
							let _altDetay = altDetaylar[newKey];
							if (_altDetay) { _altDetay.paketmiktar += altDetay.paketmiktar; _altDetay.miktar += altDetay.miktar } else { altDetaylar[newKey] = altDetay }
							if (orj_altDetay.paketmiktar <= 0) { const silinenAltDetay = altDetaylar[key]; delete altDetaylar[key]; }
							setTimeout(() => { listeWidget.refresh(); this.focusToDefault() }, 50)
						}
						catch (ex) { console.error(ex); defFailBlock(ex, 'error') }
					})
				};
				const handler_sil = async evt => {
					if (inEventFlag) { return }
					app.hideNotifications(); inEventFlag = true; setTimeout(() => inEventFlag = false, 50);
					const clickedElm = $(evt.target), uid = clickedElm.parents(`tr[role=row]`).data('key');
					let detay = listeWidget.rowsByKey[uid]; detay = detay.originalRecord || detay;
					let divAltDetaySatir = clickedElm; if (!divAltDetaySatir.hasClass('altDetaySatir')) { divAltDetaySatir = divAltDetaySatir.parents('.altDetaySatir') }
					const key = divAltDetaySatir.data('key'), {altDetaylar} = detay, altDetay = altDetaylar[key]; if (!altDetay) { return }
					const trRow = listeWidget.table.find(`tr[role=row][data-key="${uid}"]`), divAltDetaylar = trRow.find(`.jqx-grid-cell .listeSatir .altDetaylar`);
					divAltDetaySatir = divAltDetaylar.find(`.altDetaySatir[data-key="${key}"]`); divAltDetaySatir.addClass('selected');
					if (clickedElm && clickedElm.length) { setButonEnabled(clickedElm, false); setButonEnabled(clickedElm.parent(), false) }
					const promiseWait = new $.Deferred(); displayMessage(
						(
							`<div class="bold red" style="font-size: 110%; margin-top: 5px; margin-bottom: 15px;">Seçilen Alt Detay silinecek, devam edilsin mi?</div>` +
							`<div class="bold flex-row" style="font-size: 83%; color: #999; padding-left: 20px;">${divAltDetaySatir.html().replace('altDetay-seqParent', 'altDetay-seqParent jqx-hidden').replace('altDetay-islemTuslari', 'altDetay-islemTuslari jqx-hidden')}</div>`
						), this.app.appText, true, {
							EVET: async (dlgUI, btnUI) => { dlgUI.jqxWindow('destroy'); if (promiseWait) { promiseWait.resolve(true) } },
							HAYIR: (dlgUI, btnUI) => { dlgUI.jqxWindow('destroy'); if (promiseWait) { promiseWait.resolve(false) } }
						}
					);
					const rdlg = await promiseWait; if (!rdlg) { if (clickedElm?.length) { setButonEnabled(clickedElm, true); setButonEnabled(clickedElm.parent(), true) } return }
					divAltDetaySatir.addClass('silinecek'); setTimeout(() => {
						detay.miktar -= altDetay.miktar; if (altDetay.paketKod) { detay.paketMiktar -= altDetay.paketMiktar }
						const {ayrisimAyiracli_barkod2Detay} = this, {okunanbarkod, okunanTumBarkodlar} = altDetay;
						if (okunanbarkod) { delete ayrisimAyiracli_barkod2Detay[okunanbarkod] }
						if (okunanTumBarkodlar) { for (const barkod in okunanTumBarkodlar) { delete ayrisimAyiracli_barkod2Detay[barkod] } delete okunanTumBarkodlar[okunanbarkod] }
						delete altDetaylar[key]; setTimeout(() => { listeWidget.refresh(); this.focusToDefault() }, 100)
					}, 100)
				};
				const handler_yerSec = async evt => {
					if (inEventFlag) { return }
					inEventFlag = true; setTimeout(() => inEventFlag = false, 50); app.hideNotifications();
					const clickedElm = $(evt.target), uid = clickedElm.parents(`tr[role=row]`).data('key');
					let detay = listeWidget.rowsByKey[uid]; detay = detay.originalRecord || detay;
					let divAltDetaySatir = clickedElm; if (!divAltDetaySatir.hasClass('altDetaySatir')) { divAltDetaySatir = divAltDetaySatir.parents('.altDetaySatir') }
					const key = divAltDetaySatir.data('key'), altDetay = detay.altDetaylar[key]; this.disableListeResizeEventsFlag = true;
					setTimeout(() => {
						const trRow = listeWidget.table.find(`tr[role=row][data-key="${uid}"]`), divAltDetaylar = trRow.find(`.jqx-grid-cell .listeSatir .altDetaylar`);
						divAltDetaySatir = divAltDetaylar.find(`.altDetaySatir[data-key="${key}"]`); divAltDetaySatir.addClass('selected')
					}, 100);
					let promise = new $.Deferred(), part = new CETKAListePart({
						sender: this, table: 'mst_Yer', secince: e => { promise.resolve(e) },
						liste_loadServerData_ekIslemler: e => {
							const value = altDetay ? altDetay.ekOzellikler.yerKod : null;
							if (value) { setTimeout(() => e.sender.selectRec({ uid: value }), 10) }
						}
					}); part.run();
					promise.then(e => {
						try {
							let newKey = key; const kod = e.rec.kod || '', _detay = detay.deepCopy();
							_detay.yerKod = kod; _detay.cacheReset();
							newKey = _detay.getAnahtarStr({ with: [altDetay.paketkod || '', altDetay.paketicadet || 0], hmrSet: null });
							let _altDetay = detay.altDetaylar[newKey] = $.extend(true, {}, altDetay);
							if (_altDetay.paketmiktar) { _altDetay.paketmiktar = 0 }
							_altDetay.miktar = 0; _altDetay.yerKod = kod; detay.altDetaylar[newKey] = _altDetay;
							if (key != newKey) {
								if (_altDetay.paketKod) { _altDetay.paketmiktar = (_altDetay.paketmiktar || 0) + (altDetay.paketmiktar || 0) }
								_altDetay.miktar = (_altDetay.miktar || 0) + (altDetay.miktar || 0);
								delete detay.altDetaylar[key]
							}
							setTimeout(() => { listeWidget.refresh(); this.focusToDefault(); this.onResize() }, 50)
						}
						catch (ex) {
							console.error(ex);
							defFailBlock(ex, 'error')
						}
					})
				};
				const handler_rafSec = async evt => {
					if (inEventFlag) { return }
					inEventFlag = true; setTimeout(() => inEventFlag = false, 50); app.hideNotifications();
					const clickedElm = $(evt.target), uid = clickedElm.parents(`tr[role=row]`).data('key');
					let detay = listeWidget.rowsByKey[uid]; detay = detay.originalRecord || detay;
					let divAltDetaySatir = clickedElm; if (!divAltDetaySatir.hasClass('altDetaySatir')) { divAltDetaySatir = divAltDetaySatir.parents('.altDetaySatir') }
					const key = divAltDetaySatir.data('key'), altDetay = detay.altDetaylar[key]; this.disableListeResizeEventsFlag = true;
					setTimeout(() => {
						const trRow = listeWidget.table.find(`tr[role=row][data-key="${uid}"]`), divAltDetaylar = trRow.find(`.jqx-grid-cell .listeSatir .altDetaylar`);
						divAltDetaySatir = divAltDetaylar.find(`.altDetaySatir[data-key="${key}"]`); divAltDetaySatir.addClass('selected')
					}, 100);
					
					let promise = new $.Deferred();
					let part = new CETKAListePart({
						sender: this, table: 'mst_YerRaf', kodsuzmu: true, idSaha: 'rafKod', adiSaha: 'rafKod',
						liste_stmDuzenleyici: e => { if (!e.rowCountOnly) { for (const sent of e.stm.getSentListe()) { sent.where.degerAta(this.fis.yerKod, 'yerKod') } } },
						liste_loadServerData_ekIslemler: e => { const value = altDetay ? altDetay.ekOzellikler.rafKod : null; if (value) { setTimeout(() => e.sender.selectRec({ uid: value }), 10) } },
						secince: e => { promise.resolve(e) }
					});
					part.run();
					
					promise.then(e => {
						try {
							let newKey = key, rafKod = e.rec.rafKod || '', _detay = detay.deepCopy();
							_detay.ekOzelliklerYapi.tip2EkOzellik.raf.value = rafKod; _detay.cacheReset();
							newKey = _detay.getAnahtarStr({ with: [altDetay.paketkod || '', altDetay.paketicadet || 0], hmrSet: null });
							let _altDetay = altDetay.ekOzellikler.rafKod ? altDetay : detay.altDetaylar[newKey];
							const degisiklikmi = altDetay == _altDetay && !detay.altDetaylar[newKey];
							if (!_altDetay) {
								detay.altDetaylar[newKey] = _altDetay = $.extend(true, {}, altDetay);
								if (_altDetay.paketmiktar) { _altDetay.paketmiktar = 0 }
								_altDetay.miktar = 0
							}
							_altDetay.ekOzellikler.rafKod = rafKod; detay.altDetaylar[newKey] = _altDetay;
							if (key != newKey) {
								if (!degisiklikmi) {
									if (_altDetay.paketkod) { _altDetay.paketmiktar = (_altDetay.paketmiktar || 0) + (altDetay.paketmiktar || 0) }
									_altDetay.miktar = (_altDetay.miktar || 0) + (altDetay.miktar || 0)
								}
								delete detay.altDetaylar[key]
							}
							setTimeout(() => { listeWidget.refresh(); this.focusToDefault(); this.onResize() }, 50)
						}
						catch (ex) { console.error(ex); defFailBlock(ex, 'error') }
					})
				};
				const buttons = divAltDetaylar.find('.altDetay-islemTuslari button');
				if (buttons.length) {
					buttons.jqxButton({ theme, height: false }); buttons.off('mouseup'); buttons.off('touchend');
					let button = buttons.filter('#paketBoz'); button.on('mouseup', handler_paketBoz); button.on('touchend', handler_paketBoz);
					button = buttons.filter('#yerSec'); button.on('mouseup', handler_yerSec); button.on('touchend', handler_yerSec);
					button = buttons.filter('#rafSec'); if (rafKullanilirmi) { button.on('mouseup', handler_rafSec); button.on('touchend', handler_rafSec) } else { button.addClass('jqx-hidden') }
					button = buttons.filter('#sil'); button.on('mouseup', handler_sil); button.on('touchend', handler_sil);
				}
				if (divAltDetaylar?.length) { Utils.makeScrollable(divAltDetaylar) }
			}			
			/*
			   det = sky.app.activePart.fis.detaylar[0];
				altDet = Object.values(det.altDetaylar)[0];
				det.miktar = 6;
				altDet.miktar = 6;
				altDet.paketicadet = 3;
				altDet = Object.values(det.altDetaylar)[0];
				det.getAnahtarStr({ with: [altDet.paketkod, altDet.paketicadet], hmrSet: null })
			*/
		}
		liste_degisti(e) {
			e = e || {}; super.liste_degisti(e); this.degistimi = true;
			const {fis} = this; fis.detaylar = this.listeRecs.map(rec => $.isPlainObject(rec) ? new fis.class.detaySinif(rec) : rec)
		}
		liste_satirCiftTiklandi(e) { if (!this.isEventFired_satirCifTiklandi) { this.isEventFired_satirCifTiklandi = true; return } }
		async liste_islemTusuTiklandi(e) {
			const elm = e.event.currentTarget, id = e.id || elm?.id;
			switch (elm.id) {
				case 'sil': this.silIstendi(e); break
				case 'temizle': this.temizleIstendi(e); break
				case 'barkod': this.barkodIstendi(e); break
				case 'fisOzetBilgi': this.fisOzetBilgiIstendi(e); break
				case 'raporlar': this.raporlarIstendi(e); break
				case 'filter': this.liste_toggleFilterBar(e); break
				/*case 'kaydet': this.kaydetIstendi(e); break*/
			}
		}
		async degistirIstendi(e) {
			e = e || {}; let rec; const {app, listeWidget} = this, {fis, anah2Detaylar} = this, fisSinif = fis.class, {bekleyenUgramaFismi} = fisSinif;
			let {barkod, carpan} = e, barkodDetay; app.hideNotifications(); const paketKodVarmi = paketKod => paketKod && paketKod != 'Tek';
			if (barkod) {
				barkod = barkod.trim(); let ind = -1; for (const matchStr of ['x', 'X', '*']) { ind = barkod.indexOf(matchStr); if (ind > -1) { break } }
				if (ind > -1) {
					let miktarStr = barkod.substring(0, ind);				/* substring from->to .. (to dahil degil) */
					e.barkod = barkod = barkod.substring(ind + 1); e.carpan = carpan = asFloat(miktarStr) || null;
				}
				const {fisGirisSadeceBarkodZorunlumu, depoSiparisKarsilamaZorunluHMRSet} = app;
				try {
					const barkodBilgi = await app.barkodBilgiBelirle({ barkod, /*carpan: carpan,*/ fis });
					if (barkodBilgi) {
						const _barkod = barkodBilgi.barkod, {karmaPaletmi} = barkodBilgi;
						if (karmaPaletmi) {
							if (!bekleyenUgramaFismi) {
								app.playSound_barkodError();
								displayMessage(`<u class="bold darkred">${_barkod}</u> <b>Karma Palet</b> barkodu sadece <b class="royalblue">Bekleyen Yükleme Fişinde</b> kullanılabilir !`, `Barkod İşlemi`, undefined, undefined, undefined, undefined, 'top-right');
								setTimeout(async () => { await this.onResize(); this.focusToDefault(); }, 50); return false
							}
							if (fis.planNo != barkodBilgi.planNo) {
								app.playSound_barkodError();
								displayMessage(`<u class="bold darkred">${_barkod}</u> barkodlu <b>Karma Palet</b> <b class="royalblue">${barkodBilgi.planNo}</b> nolu fişe aittir ve bu fişte kullanılamaz !`, `Barkod İşlemi`, undefined, undefined, undefined, undefined, 'top-right');
								setTimeout(async () => { await this.onResize(); this.focusToDefault(); }, 50); return false
							}
							let uygunDetListe = fis._detaylar.filter(det => det.karmaPaletNo == barkodBilgi.paletNo);
							if (!uygunDetListe.length) {
								app.playSound_barkodError();
								displayMessage(`<u class="bold darkred">${_barkod}</u> barkodlu <b>Karma Palet</b>, bu Bekleyen Yükleme fişine ait değildir !`, `Barkod İşlemi`, undefined, undefined, undefined, undefined, 'top-right');
								setTimeout(async () => { await this.onResize(); this.focusToDefault(); }, 50); return false
							}
							let stokSet = {}; for (const det of uygunDetListe) {
								if (!$.isEmptyObject(det.altDetaylar)) {
									app.playSound_barkodError();
									displayMessage(`<u class="bold darkred">${_barkod}</u> barkodlu <b>Karma Palet</b> yeniden okutulamaz !`, `Barkod İşlemi`, undefined, undefined, undefined, undefined, 'top-right');
									setTimeout(async () => { await this.onResize(); this.focusToDefault(); }, 50); return false
								}
								stokSet[det.shKod] = true
							}
							/* uygunDetListe için barkodOkutuldu işlemi */
							const {ekOzellikBelirtecSet_stokMstVeDiger: _ekOzellikBelirtecSet_stokMstVeDiger, tip2EkOzellik} = app;
							const ekOzellikBelirtecSet_stokMstVeDiger = {}; for (const [key, value] of Object.entries(_ekOzellikBelirtecSet_stokMstVeDiger)) { ekOzellikBelirtecSet_stokMstVeDiger[key] = value }
							const stokMstBelirtecSet = { ...ekOzellikBelirtecSet_stokMstVeDiger.stokMst };
							const digerBelirtecSet = ekOzellikBelirtecSet_stokMstVeDiger.diger; if (tip2EkOzellik.raf) { digerBelirtecSet.raf = true }
							const {yerKod} = fis; let barkodDetayYapilar = [];
							for (const det of uygunDetListe) {
								const {paketBilgi, paketKod2IcAdet} = det; let paketKod2Miktar = {}, parts = paketBilgi ? paketBilgi.split(',') : null;
								if (parts?.length) {
									for (let part of parts) {
										part = part.trim(); const subParts = part.split(' '), paketMiktar = asInteger(subParts[0].trim()), paketKod = subParts[1].trimEnd();
										paketKod2Miktar[paketKod] = paketMiktar
									}
								}
								if ($.isEmptyObject(paketKod2Miktar)) { continue }
								for (const [paketKod, paketMiktar] of Object.entries(paketKod2Miktar)) {
									if (paketMiktar <= 0) { continue } const paketIcAdet = paketKod2IcAdet[paketKod] || 0;
									const detaySinif = fisSinif.uygunDetaySinif({ rec: barkodBilgi }) || fisSinif.detaySinif;
									const barkodDetay = new detaySinif({ shKod: det.shKod, paketIcAdet, paketKod });
									barkodDetayYapilar.push({ det, barkodDetay, paketMiktar })
								}
							}
							const ekOzSiraliKodSahalar = { stokMst: [], diger: [] }; for (const key in ekOzellikBelirtecSet_stokMstVeDiger) {
								ekOzSiraliKodSahalar[key].push(...Object.keys(ekOzellikBelirtecSet_stokMstVeDiger[key]).map(belirtec => tip2EkOzellik[belirtec].idSaha)) }
							const anah2SonStokBilgiler = {}; for (const {det} of barkodDetayYapilar) {
								const {shKod: stokKod, urunToplama, ekOzelliklerYapi} = det; for (const urunTopBilgi of urunToplama) {
									for (const key of ['miktar', 'koli']) { if (typeof urunTopBilgi[key] == 'string') { urunTopBilgi[key] = asFloat(urunTopBilgi[key]) } }
									const {miktar} = urunTopBilgi, {tip2EkOzellik} = ekOzelliklerYapi;
									const anahStr = [stokKod, ...ekOzSiraliKodSahalar.stokMst.map(attr => tip2EkOzellik[attr]?.value || '')].join(delimWS);
									const sonStokBilgi = { miktar }; for (const attr of ekOzSiraliKodSahalar.diger) { sonStokBilgi[attr] = urunTopBilgi[attr] || '' };
									(anah2SonStokBilgiler[anahStr] = anah2SonStokBilgiler[anahStr] || []).push(sonStokBilgi)
								}
							}
							/* let sent = new MQSent({
									from: 'mst_SonStok', where: [{ degerAta: yerKod, saha: 'yerKod' }, { inDizi: Object.keys(stokSet), saha: 'stokKod' }],
									sahalar: ['stokKod', 'SUM(miktar) miktar'], groupBy: ['stokKod']
								});
								let stm = new MQStm({ sent, orderBy: ['stokKod'] });
								for (const belirtec in { ...stokMstBelirtecSet, ...digerBelirtecSet }) {
									const {idSaha} = tip2EkOzellik[belirtec]; sent.sahalar.add(idSaha);
									sent.groupBy.add(idSaha); stm.orderBy.add(idSaha)
								}
								const anah2SonStokBilgiler = {}; let recs = await app.dbMgr_mf.executeSqlReturnRows(stm); for (let i = 0; i < recs.length; i++) {
								const rec = recs[i], {stokKod, miktar} = rec, anahStr = [stokKod, ...ekOzSiraliKodSahalar.stokMst.map(attr => rec[attr] || '')].join(delimWS);
								const sonStokBilgi = { miktar }; for (const attr of ekOzSiraliKodSahalar.diger) { sonStokBilgi[attr] = rec[attr] || '' }
								(anah2SonStokBilgiler[anahStr] = anah2SonStokBilgiler[anahStr] || []).push(sonStokBilgi)
							}*/
							const _barkodDetayYapilar = barkodDetayYapilar; barkodDetayYapilar = []; let yetersizStokKodSet = {};
							for (const barkodDetayYapi of _barkodDetayYapilar) {
								const {det, barkodDetay, paketMiktar} = barkodDetayYapi, {hMiktar} = det;
								const {shKod, paketKod} = barkodDetay, paketIcAdet = barkodDetay.paketIcAdet || 1;
								const barDetMiktar = paketKodVarmi(paketKod) ? paketIcAdet * paketMiktar : paketMiktar, barkodDetay_tip2EkOzellik = barkodDetay.ekOzelliklerYapi.tip2EkOzellik;
								const anahStr = [shKod, ...ekOzSiraliKodSahalar.stokMst.map(attr => barkodDetay_tip2EkOzellik[attr]?.value || '')].join(delimWS);
								let sonStokBilgiler = anah2SonStokBilgiler[anahStr]; if (!sonStokBilgiler?.length) { yetersizStokKodSet[shKod] = true; continue }
								let kalan = hMiktar; for (const sonStokBilgi of sonStokBilgiler) {
									let dusulecek = Math.min(kalan, sonStokBilgi.miktar); sonStokBilgi.miktar -= dusulecek; if (dusulecek <= 0) { continue }
									let yBarkodDetay = barkodDetay.deepCopy(), yPaketMiktar = paketKodVarmi(paketKod) ? asInteger(dusulecek / paketIcAdet) : dusulecek;
									let yBarkodDetay_tip2EkOzellik = yBarkodDetay.ekOzelliklerYapi.tip2EkOzellik;
									for (const belirtec in digerBelirtecSet) {
										const {idSaha: kodSaha} = tip2EkOzellik[belirtec], value = sonStokBilgi[kodSaha];
										if (value != null) { yBarkodDetay_tip2EkOzellik[belirtec].value = value }
									} kalan -= dusulecek;
									const yBarkodDetayYapi = { ...barkodDetayYapi, paketMiktar: yPaketMiktar, barkodDetay: yBarkodDetay }; barkodDetayYapilar.push(yBarkodDetayYapi)
								}
							}
							if (!$.isEmptyObject(yetersizStokKodSet)) {
								app.playSound_barkodError();
								displayMessage(`<u class="bold darkred">${_barkod}</u> barkoduna ait şu ürünler için <b class="firebrick">Son Stok yetersizdir:</b> <ul>${Object.keys(yetersizStokKodSet).map(x => `<li>${x}</li>`)}</ul> !`, `Barkod İşlemi`, undefined, undefined, undefined, undefined, 'top-right');
								setTimeout(async () => { await this.onResize(); this.focusToDefault(); }, 50); return false
							}
							for (const {det, barkodDetay, paketMiktar} of barkodDetayYapilar) {
								const _e = { ...e, rec: det, barkodDetay, carpan: paketMiktar }; delete _e.barkod;
								await this.degistirIstendi(_e)
							}
								/*const paketKod = '', _det = anah2Detaylar[uygunDetListe[0].getAnahtarStr({ with: [paketKod], hmrSet: depoSiparisKarsilamaZorunluHMRSet })]*/
							setTimeout(async () => { await this.onResize(); this.focusToDefault() }, 50); return true
						}
						if (barkodBilgi.ayrisimAyiraclimi && barkodBilgi.zVarmi) {
							const _det = this.ayrisimAyiracli_barkod2Detay[_barkod];
							if (_det) {
								const {uid} = _det; listeWidget.selectrowbykey(uid);
								let displayIndex = listeWidget.getrowdisplayindex(_det), araMesaj = displayIndex < 0 ? `` : `<b>${displayIndex + 1}. satırda</b> `;
								app.playSound_barkodError();
								displayMessage(`<u class="bold darkred">${_barkod}</u> barkoduna ait ${araMesaj}tekrar eden kalem var !`, `Barkod İşlemi`, undefined, undefined, undefined, undefined, 'top-right');
								setTimeout(async () => { await this.onResize(); this.focusToDefault(); }, 50);
								return false
							}
						}
						const detaySinif = fisSinif.uygunDetaySinif({ rec: barkodBilgi }) || fisSinif.detaySinif;
						barkodDetay = await detaySinif.fromBarkodBilgi({ fis, barkodBilgi });
						const {paketKod} = barkodDetay;
						// const paketIcAdet = asInteger(barkodDetay.paketIcAdet) || 0;
						const anahStr = barkodDetay.getAnahtarStr({ with: [paketKod], hmrSet: depoSiparisKarsilamaZorunluHMRSet });
						const _recs = anah2Detaylar[anahStr];
						if (!$.isEmptyObject(_recs)) { for (const _rec of _recs) { rec = _rec; const {miktar, hMiktar} = _rec; if (miktar < hMiktar) { break } } }
						if (!rec) {
							app.playSound_barkodError();
							displayMessage(`<u class="bold darkred">${barkod}</u> barkoduna ait satır bulunamadı !`, `Barkod İşlemi`, undefined, undefined, undefined, undefined, 'top-right');
							this.focusToDefault(); return false
						}
						if (barkodDetay.barkodParser) { rec.barkodParser = barkodDetay.barkodParser }
						barkodDetay.barkod = _barkod; app.playSound_barkodOkundu()
					}
					else {
						app.playSound_barkodError();
						displayMessage(`<u class="bold darkred">${barkod}</u> barkodu hatalıdır !`, `Barkod İşlemi`, undefined, undefined, undefined, undefined, 'top-right');
						setTimeout(async () => { await this.onResize(); this.focusToDefault() }, 50); return
					}
				}
				catch (ex) {
					let message = ex; if (ex && ex.isError) { message = ex.errorText || ex.message }
					if (message) {
						app.playSound_barkodError(); displayMessage(message, `@ Barkod İşlemi @`, undefined, undefined, undefined, undefined, 'top-right');
						setTimeout(async () => { await this.onResize(); this.focusToDefault() }, 50); throw ex
					}
					return false
				}
			}
			else { rec = e.rec ?? this.selectedBoundRec; if (!barkodDetay) { barkodDetay = e.barkodDetay } }

			if (!rec) { this.focusToDefault(); return false } let det = rec; det.cacheReset();
			if (det) { det = $.isPlainObject(det) ? fis.class.detaySinif.From(det) : det.deepCopy() } if (!det) { return false }
			det.okutmaSayisi++; let paketKod = barkodDetay.paketKod ?? null, paketIcAdet = paketKodVarmi(paketKod) ? (det.paketKod2IcAdet || {})[paketKod] ?? null : null;
			let {miktar} = barkodDetay; let barkoddanMiktarGeldimi = !!miktar, paketMiktar = 0;
			if (paketKod) { paketMiktar = (carpan || 1); det.paketMiktar += paketMiktar; if (!miktar) { miktar = paketMiktar * paketIcAdet } }
			miktar = miktar || 1;
			if (barkoddanMiktarGeldimi) { if (paketKod) { paketIcAdet = miktar } if (carpan) { miktar *= carpan } }
			det.miktar += miktar;
			const altDetaylar = det.altDetaylar = det.altDetaylar || {}, _with = [paketKod, paketIcAdet || 0];
			const detAnahStr = barkodDetay.getAnahtarStr({ with: _with, hmrSet: null });
			let altDetay = altDetaylar[detAnahStr]; if (!altDetay) {
				const {barkod} = barkodDetay; altDetay = {
					okunanbarkod: barkod, shkod: barkodDetay.shKod, shadi: barkodDetay.shAdi, brm: barkodDetay.brm,
					okunanTumBarkodlar: (barkodDetay.okunanTumBarkodlar || {}),
					miktar: 0, okutmasayisi: 0, paketmiktar: 0,
					paketkod: paketKod, paketicadet: paketIcAdet
				};
				const ekOzellikler = altDetay.ekOzellikler = {}; await barkodDetay.ekOzelliklerDo({ callback: async _e => {
					const rafmi = _e.tip == 'raf', refRafmi = _e.tip == 'refRaf';
					if (rafmi && !fis.class.rafKullanilirmi) { return true }				// continue loop
					if (refRafmi && !fis.class.refRafKullanilirmi) { return true }			// continue loop
					const ekOzellik = _e.item, {idSaha, value} = ekOzellik; ekOzellikler[idSaha] = (value == null ? '' : value)
				} });
				altDetaylar[detAnahStr] = altDetay
			}
			altDetay.okunanTumBarkodlar[barkod] = true;
			altDetay.miktar += miktar; altDetay.paketmiktar += paketMiktar;
			const _rec = listeWidget.rowsByKey[det.uid]; if (_rec) { _rec.cacheReset() }
			const result = await this.degistir({ rec: det }); listeWidget.selectrowbykey(det.uid);
			const index = listeWidget.getrowdisplayindex(rec);
			if (index > -1 && listeWidget.pageable) { const {pageSize} = listeWidget, pageIndex = Math.floor(index / pageSize); listeWidget.goToPage(pageIndex) }
			this.focusToDefault(); return result
		}
		async silIstendi(e) {
			this.app.hideNotifications(); const wnd = displayMessage(
				'<p class="red">Seçilen Satır ve Satıra ait Paket Miktarları SIFIRLANACAK!</p><p>Devam Edilsin mi?</p>',
				this.app.appText, true, {
					EVET: async (dlgUI, btnUI) => { dlgUI.jqxWindow('destroy'); await this.sil(e) },
					HAYIR: (dlgUI, btnUI) => { dlgUI.jqxWindow('destroy') }
				})
		}
		temizleIstendi(e) {
			this.app.hideNotifications(); const wnd = displayMessage(
				'<p class="red">Tüm Miktarlar SIFIRLANACAK!</p><p>Devam Edilsin mi?</p>',
				this.app.appText, true, {
					EVET: async (dlgUI, btnUI) => { dlgUI.jqxWindow('destroy'); await this.temizle() },
					HAYIR: (dlgUI, btnUI) => dlgUI.jqxWindow('destroy')
				})
		}

		async barkodIstendi(e) {
			e = e || {}; const {layout} = this, barkodContainer = layout.find('#barkodContainer');
			let {barcodeReader} = this; if (!barcodeReader) {
				const deviceClass = CETBarkodDevice.defaultDeviceClass; if (!deviceClass) { return }
				barcodeReader = this.barcodeReader = new deviceClass({
					content: barkodContainer, debug: this.app.class.isDebug, onKamerami: this.app.onKamerami,
					readCallback: e => { const {result: value} = e; this.txtBarkod.val(value); this.txtBarkod_enterIstendi({ value }); this.focusToDefault() }
				})
			}
			if (!barcodeReader.initFlag || barcodeReader.isReady) { await barcodeReader.start() } else { await barcodeReader.destroy() }
			let elm = e.event?.currentTarget; if (elm) { elm = $(elm); elm.removeClass(`ready paused running`); elm.addClass(barcodeReader.state) }
		}
		async musteriDurumuIstendi(e) {
			const {mustKod} = this.fis; return await new CETMusteriDurumuPart({
				parentPart: this, mustKod, from: `fisGiris`,
				geriCallback: _e => { setTimeout(() => { this.liste_hideFilterBar(e); this.onResize(e); this.focusToDefault(e) }, 150) }
			}).run();
		}
		async fisOzetBilgiIstendi(e) {
			return await new CETFisOzetBilgiPart({
				parentPart: this, from: `fisGiris`,
				geriCallback: _e => {
					this.chkKaydederkenYazdir.jqxToggleButton('toggled', asBool(this.kaydederkenYazdirFlag));
					this.chkKaydederkenAktar.jqxToggleButton('toggled', asBool(this.kaydederkenAktarFlag))
					setTimeout(() => { this.liste_hideFilterBar(e); this.onResize(e); this.focusToDefault(e) }, 150)
				}
			}).run();
		}
		async raporlarIstendi(e) {
			return await new CETRaporlarPart({
				parentPart: this, from: `fisGiris`,
				geriCallback: _e => { setTimeout(() => { this.liste_hideFilterBar(e); this.onResize(e); this.focusToDefault(e) }, 150) }
			}).run();
		}
		async kaydetIstendi(e) {
			const {app} = this; if (app.fisOzetBilgiGosterilirmi) { return await this.fisOzetBilgiIstendi(e) }
			let result = await this.kaydet(e); if (result && !result.isError) { this.geriIstendi() }
			return result
		}
	}
})()
