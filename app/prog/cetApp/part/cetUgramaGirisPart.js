(function() {
	window.CETUgramaGirisPart = class extends window.CETListeOrtakPart {
		constructor(e) {
			e = e || {};
			super(e);

			const param = this.app.param.deepCopy();
			$.extend(this, {
				islem: e.islem || 'yeni',
				param: param,
				eskiFis: e.eskiFis,
				fis: e.fis,
				kaydetOncesi: e.kaydetOncesi,
				kaydetIslemi: e.kaydetIslemi,
				kaydedince: e.kaydedince,
				secinceGeriYapilmazFlag: true,
				secinceKontrolEdilmezFlag: true,
				// secince: e => this.kaydetIstendi(e),
				degistimi: false,
				table: 'mst_UgramaNeden'
			});
			this.targetRecUid = this.fis.nedenKod;
			if (!(this.layout || this.template))
				this.template = this.app.templates.ugramaGiris;
		}

		static get partName() { return 'cetUgramaGiris' }
		get fisGirisEkranimi() { return true }
		get adimText() { return 'Uğrama Giriş Ekranı' }
		get yeniKayitmi() { return this.islem == 'yeni' || this.islem == 'kopya' }


		async preInitLayout(e) {
			e = e || {};
			await super.preInitLayout(e);

			let layout = e.layout || this.layout;
			$.extend(this, {
				param: this.app.param.deepCopy()
			});
			
			let fis = this.fis;
			if (!this.eskiFis) {
				this.eskiFis = fis;
				fis = this.fis = fis.deepCopy();
			}
		}

		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);

			const {btnToggleFullScreen, chkOtoAktar, btnGonderimIsaretSifirla, btnLogout} = sky.app;
			if (btnToggleFullScreen && btnToggleFullScreen.length)
				btnToggleFullScreen.addClass('jqx-hidden')
			if (chkOtoAktar && chkOtoAktar.length)
				chkOtoAktar.addClass('jqx-hidden')
			if (btnGonderimIsaretSifirla && btnGonderimIsaretSifirla.length)
				btnGonderimIsaretSifirla.addClass('jqx-hidden')
			if (btnLogout && btnLogout.length)
				btnLogout.addClass('jqx-hidden')
			
			const layout = e.layout || this.layout;
			let _e = { content: layout };
			this.initMustBilgi(e);
			this.initBaslikPanel(_e);

			const islemTuslari = this.islemTuslari = layout.find('.asil.islemTuslari');
			islemTuslari.children('button').jqxButton({ theme: theme });
			islemTuslari.removeClass('jqx-hidden');

			const fis = this.fis;
			const degisiklikYapilabilirmi = (this.islem != 'izle') && !(fis.devreDisimi || fis.gonderildimi /*|| fis.gecicimi*/);
			const btnKaydet = this.btnKaydet = islemTuslari.find('#kaydet');
			if (!(degisiklikYapilabilirmi || (fis.gecicimi || this.yeniKayitmi))) {
				setButonEnabled(btnKaydet, false);
				btnKaydet.jqxButton('disabled', true);
				// btnKaydet.addClass('jqx-hidden');
				islemTuslari.children().addClass('jqx-hidden');
			}
			else {
				btnKaydet.off('click').on('click', evt =>
					this.kaydetIstendi($.extend({}, e, { event: evt })));
				// btnKaydet.jqxTooltip({ theme: theme, trigger: `hover`, content: `Belgeyi kaydet` });
			}

			const userSettings = this.param.userSettings || {};
			$.extend(this, {
				kaydederkenAktarFlag: userSettings.kaydederkenAktar
			});
			const chkKaydederkenAktar = this.chkKaydederkenAktar = islemTuslari.find('#chkKaydederkenAktar')
				.jqxToggleButton({ theme: theme, toggled: asBool(this.kaydederkenAktarFlag) });
			chkKaydederkenAktar.jqxTooltip({ theme: theme, trigger: `hover`, position: `bottom`, content: `Belge kaydedildikten sonra otomatik olarak Belgeyi <b>Merkeze Gönder</b>` });
			// chkKaydederkenAktar.off('click');
			chkKaydederkenAktar.on('click', evt => {
				this.kaydederkenAktarFlag = userSettings.kaydederkenAktar = chkKaydederkenAktar.jqxToggleButton('toggled');
				this.paramDegistimi = true;
			});

			setTimeout(() => {
				hideProgress();
				this.degistimi = false;
				this.focusToDefault();
			}, 500);
		}

		async destroyLayout(e) {
			e = e || {};
			const layout = e.layout || this.layout;
			let btnKaydet = this.btnKaydet;
			if (btnKaydet) {
				btnKaydet.detach()
					.appendTo(layout);
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
			
			return await super.destroyLayout(e);
		}

		async initMustBilgi(e) {
			e = e || {};
			const layout = this.layout;
			if (!(layout && layout.length))
				return;
			
			const {app} = this;
			const {bakiyeRiskGosterilmezmi, musteriRotaZorunlumu, konumTakibiYapilirmi, musteriDegistirilirmi} = app;
			const dbMgr = app.dbMgrs.rom_data;
			const divMustBilgi = layout.find(`#mustBilgi`);
			const {fis} = this;
			if (!fis.class.musteriKullanilirmi) {
				divMustBilgi.addClass('jqx-hidden');
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
				
				const riskCariKod = await fis.getRiskCariKod(e);
				stm = new MQStm({
					sent: new MQSent({
						from: `mst_Cari`,
						where: [{ degerAta: riskCariKod, saha: 'kod' }],
						sahalar: [`bakiye`, `riskLimiti`, `riskli`, `takipBorcLimiti`, `takipBorc`]
					})
				});
				rec = await dbMgr.tekilExecuteSelect({ query: stm });
				
				const bakiye = bakiyeRiskGosterilmezmi ? `` : bedel(rec.bakiye);
				const kalanRisk = bakiyeRiskGosterilmezmi ? `` : rec.riskLimiti ? bedel(rec.riskLimiti - rec.riskli) : `-Limit Yok-`;
				const kalanTakipBorc = bakiyeRiskGosterilmezmi ? `` : rec.takipBorcLimiti ? bedel(rec.takipBorcLimiti - rec.takipBorc) : ``;
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
					if (!kalanTakipBorc)
						divMustBilgi.find('.takipBorcParent').addClass('jqx-hidden');
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
									mustKod = e.rec.kod;
									if (mustKod == fis.mustKod)
										return;
										
									fis.mustKod = mustKod;
									fis.cacheReset();
									['satisKosulYapilari', 'promosyonYapilari'].forEach(key =>
										delete this[key]);
									await this.musteriDegisti(e);
									this.satirlariYenidenHesapla(e)
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
				divMustBilgi.addClass('jqx-hidden');
			}
		}

		musteriDegisti(e) {
			this.initMustBilgi(e);
		}

		initBaslikPanel(e) {
			const fis = this.fis;
			const content = e.content;
			const subContent = this.baslik_content = content.find('.baslik .header');
			const navBar = this.baslik_navBar = content.find('.baslik .navBar');
			navBar.jqxNavigationBar({
				theme: theme, animationType: animationType, expandMode: 'toggle',
				width: false, toggleMode: 'none',
				expandAnimationDuration: 50, collapseAnimationDuration: 50,
				/*expandedIndexes: fis.aciklama ? [0] : []*/
				expandedIndexes: [0]
			});
			navBar.find('.jqx-expander-arrow').off('click').on('click', evt => {
				let widget = navBar.jqxNavigationBar('getInstance');
				const index = 0;
				if ($.inArray(index, widget.expandedIndexes) != -1)
					widget.collapseAt(index)
				else
					widget.expandAt(index);
			});

			const ci = Date.CultureInfo;
			let txtTarih = this.txtTarih = content.find('#tarih');
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
			txtTarih.on('change', evt => {
				const input = $(evt.target);
				let val = input.val();
				if (val && !isInvalidDate(val)) {
					input.data('savedVal', val);
					fis.tarih = asDate(val);
				}
			});
			txtTarih.on('focusin', evt =>
				evt.target.select());
			txtTarih.on('focusout', evt => {
				let input = $(evt.target);
				let ch = input.val();
				let value = tarihDegerDuzenlenmis(ch, () => input.data('savedVal'));
				if (value) {
					evt.preventDefault();
					input.val(value || '');
					fis.tarih = asDate(value);
				}
			});

			content.find('#notlar')
				.val(fis.aciklama || '')
				.on('change', evt => {
					let target = evt.args || evt.target;
					this.fis.aciklama = (target.value || '');
				});
						
			content.find('input[type=text], input[type=textbox], input[type=textarea]')
				.on('focus', evt =>
					evt.target.select());
		}

		async kaydet(e) {
			const fis = this.fis;
			e = $.extend({
				sender: this, islem: this.islem, eskiFis: this.eskiFis,
				gecicimi: fis.gecicimi
			}, e);

			const layout = e.layout || this.layout;
			$.extend(fis, {
				nedenKod: (this.selectedBoundRec || {}).kod || ''
				// aciklama: layout.find('#notlar').val() || ''
			});
			
			let handler = this.kaydetOncesi;
			if (handler) {
				let result = await handler.call(this, e);
				if (result === false)
					return false;
			}

			if (this.paramDegistimi) {
				const param = this.app.param;
				$.extend(param, this.param);
				param.kaydet();
			}

			handler = this.kaydetIslemi || this.kaydetDevam;
			if (handler) {
				let result = await handler.call(this, e);
				if (!result)
					return false;
			}

			return true;
		}

		async kaydetDevam(e) {
			e = e || {};
			if (this.paramDegistimi) {
				const param = this.app.param;
				$.extend(param, this.param);
				param.kaydet();
			}

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
			//let tx = await dbMgr.transaction();5r
			try {
				fis.gecicimi = false;
				// let result = await fis.kaydet($.extend({ tx: tx }, e));
				let result = await fis.kaydet(e);
				if (!result || result.isError)
					return result;
				
				await fis.geciciFisleriTemizle();
				await dbMgr.transaction();
				
				return result;
			}
			catch (ex) {
				if (ex.rc == 'runtimeInterrupt' || ex.rc == 'userAbort')
					return;
				
				displayMessage(`${ex.errorText || ex.message || ex}`, `@ Belge Kayıt İşlemi @`);
				console.error(`fiş kayıt hatası`, ex);
			}
			finally {
				if (fis)
					fis.gecicimi = e.gecicimi;
			}
		}

		async listeArgsDuzenle(e) {
			await super.listeArgsDuzenle(e);
			
			$.extend(e.listeArgs, {
				pageable: true, showToolbar: false, filterable: true, columnsResize: false,
				serverProcessing: true, filterMode: 'default'
			});
		}

		async liste_columnsDuzenle(e) {
			await super.liste_columnsDuzenle(e);

			$.merge(e.listeColumns, [
				{	dataField: 'aciklama', text: 'Neden', align: 'left',
					cellsRenderer: (rowIndex, columnIndex, value, rec) =>
						this.liste_columnsDuzenle_generateCell({
							selector: 'aciklama', rowIndex: rowIndex, rec: rec, value: rec.aciklama
						})
				},
				{	dataField: 'kod', text: 'Kod', align: 'left', hidden: true }
			]);
		}

		focusToDefault() {
			this.setUniqueTimeout({
				key: 'focusToDefault', delayMS: 100, isInterval: false,
				block: e =>
					this.divListe.focus()
			});
		}

		liste_veriYuklendi(e) {
			super.liste_veriYuklendi(e);

			setTimeout(() => {
				this.degistimi = false
			}, 10);
		}

		async liste_islemTusuTiklandi(e) {
			let elm = e.event.currentTarget;
			switch (elm.id) {
				/*case 'kalaniYaz':
					this.kalaniYazIstendi(e);
					break;
				case 'sil':
					this.silIstendi(e);
					break;*/
				case 'filter':
					this.liste_toggleFilterBar(e);
			}
		}

		async kaydetIstendi(e) {
			/*let wnd = displayMessage(
				`Belge kaydedilsin mi?`,
				this.app.appText,
				true,
				{
					EVET: async (dlgUI, btnUI) => {
						dlgUI.jqxWindow('destroy');
						this.focusToDefault();
						if (await this.kaydet(e))
							this.geriIstendi();
					},
					HAYIR: (dlgUI, btnUI) =>
						dlgUI.jqxWindow('destroy')
				});
			wnd.on('close', evt => {
				// dlgUI.jqxWindow('destroy');
				this.focusToDefault();
			});
			wnd.jqxWindow('position', { x: 5, y: 50 }); */

			if (await this.kaydet(e))
				this.geriIstendi();
		}
	}
})()
