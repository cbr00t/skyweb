(function() {
	window.CETTicariFis = class extends window.CETStokTicariFis {
		static get sevkTarihEtiket() { return 'Sevk' }; static get detaySinif() { return CETTicariDetay }
		static uygunDetaySinif(e) {
			let rec = e.rec || e; if (rec.promokod || rec.promoKod) { return CETPromosyonDetay }
			return super.uygunDetaySinif(e)
		}
		static get icmalSinif() { return CETTicariIcmal }
		static get adimTipi() { return `${this.almSat || ''}${this.pifTipi || ''}${this.iade || ''}` }
		static get numaratorTip() { return this.adimTipi }
		get eIslemNumaratorTip() { return super.eIslemNumaratorTip /*let {app} = sky; return app.eIslemKullanilirmi ? super.eIslemNumaratorTip : '';*/ }
		static get pifTipi() { return null } static get almSat() { return '' } static get satismi() { return this.almSat == 'T' }
		static get alimmi() { return this.almSat == 'A' } static get fiiliCikismi() { return (this.alimmi == this.iademi) }
		static get ozelIsaretKullanilirmi() { return true } static get ayrimTipiKullanilirmi() { return true }
		static get uygunAyrimTipleri() { return $.merge(super.uygunAyrimTipleri || [], sky.app.uygunAyrimTipleri) }
		static get bedelKullanilirmi() { return true } static get dipIskBedelKullanilirmi() { return true }
		static get promosyonKullanilirmi() { return this.satismi && !this.iademi } static get sevkTarihKullanilirmi() { return !(this.alimmi || this.iademi) }
		static get sevkYeriKullanilirmi() { return (this.alimmi == this.iademi) } static get riskKontrolEdilirmi() { return !(this.alimmi || this.iademi) }
		static get bakiyeRiskEtkilenirmi() { return true } static get detYerKullanilirmi() { return true } get dovizlimi() { return !!this.dvKod }
		static get aciklama() {
			let {pifTipi, almSat, iademi} = this; return (
				`<span style="color: ${this.renkFor({ tip: 'almSat' })};">${(almSat == 'A' ? 'Alım' : almSat == 'T' ? 'Satış' : '')}</span>&nbsp;` +
				`<span style="color: ${this.renkFor({ tip: 'iade' })};">${(iademi ? 'İADE&nbsp;' : '')}</span>` +
				`<span style="color: ${this.renkFor({ tip: 'pifTipi' })};">${pifTipi == 'F' ? 'Fatura' : pifTipi == 'I' ? 'İrsaliye': pifTipi == 'S' ? 'Sipariş' : ''}</span>`
			)
		}
		constructor(e) {
			e = e || {}; super(e); $.extend(this, {
				tahsilatRowId: e.tahsilatRowId || null, dvKod: e.dvKod || sky.app.defaultDovizKod || '', dvKur: e.dvKur || 0,
				nakSekliKod: e.nakSekliKod == null ? e.nakseklikod : e.nakSekliKod.trimEnd(),
				tahSekliKodNo: asInteger(e.tahSekliKodNo == null ? e.tahseklikodno : e.tahseklikodno) || null,
				dipIskOran: asFloat(e.dipIskOran == null ? e.dipiskoran : e.dipIskOran),
				dipIskBedel: asFloat(e.dipIskBedel == null ? e.dipiskbedel : e.dipIskBedel),
				icmal: e.icmal || this.icmal, _otoDipIskHesaplandimi: false
			});
			this.karmaTahsilatmi = !!this.tahsilatRowId;
			if (this.dvKod && !this.dvKur) { this.dvKurBelirle(e) }
		}
		static async getCariStdDipIskOran(e) {
			e = e || {}; let {mustKod} = e; let result = null;
			if (mustKod != null) {
				result = '';
				if (mustKod) { let rec = e.cariEkBilgi || await this.getCariEkBilgi(e) || {}; result = rec.stdDipIskOran }
			}
			return result
		}
		async getCariStdDipIskOran(e) {
			let result = this.riskCariKod;
			if (result == null) {
				let cariEkBilgi = await this.getCariEkBilgi(e);
				result = await this.class.getCariStdDipIskOran({ mustKod: this.mustKod, cariEkBilgi: cariEkBilgi });
				this.stdDipIskOran = result
			}
			return result
		}
		get sonucBedel() { this.gerekirseDipHesapla(); return bedel(this.icmal.sonuc); }
		get tahsilatDusulmusBedel() {
			let {tahSekliKodNo} = this;
			if (!!tahSekliKodNo) {
				let rec = sky.app.caches.tahsilSekliKodNo2Rec[tahSekliKodNo];
				let acikHesapmi = rec ? !rec.tahsilTipi && !rec.tahsilAltTipi : true;
				if (!acikHesapmi)				// Açık Hesap DEĞİLSE
					return 0
			}
			return this.sonucBedel
		}
		get hesaplanmisRiskArtisi() {
			// ** Faturada Tahsilat olsaydı Açık Kısım alınırdı
			let result = this.tahsilatDusulmusBedel;
			if (this.ihracKayitlimi) { this.gerekirseDipHesapla(); result -= bedel(this.icmal.topKdv || 0) }
			if (!this.class.fiiliCikismi) result = -result
			return result
		}
		/*get hesaplanmisTakipBorcArtisi() { return this.class.fiiliCikismi ? this.hesaplanmisRiskArtisi : 0; }*/
		
		static varsayilanKeyHostVars(e) { return $.extend(super.varsayilanKeyHostVars(), { piftipi: this.pifTipi, almsat: this.almSat, iade: this.iade }) }
		hostVars(e) {
			e = e || {}; let hv = super.hostVars(); $.extend(hv, {
				tahsilatRowId: this.tahsilatRowId || null, dvkod: this.dvKod || '', dvkur: roundToFra(this.dvKur, 6) || 0,
				nakseklikod: this.nakSekliKod || '', tahseklikodno: asInteger(this.tahSekliKodNo) || 0,
				dipiskoran: roundToFra(this.dipIskOran, 2) || 0, dipiskbedel: bedel(this.dipIskBedel) || 0
			});
			let {icmal} = this; if (icmal) { $.extend(hv, icmal.hostVars(e)) }
			return hv
		}
		async setValues(e) {
			e = e || {}; await super.setValues(e); let {rec} = e; $.extend(this, {
				tahsilatRowId: rec.tahsilatRowId || null, dvKod: rec.dvkod || '', dvKur: roundToFra(rec.dvkur, 6) || 0,
				nakSekliKod: rec.nakseklikod || '', tahSekliKodNo: asInteger(rec.tahseklikodno) || null,
				dipIskOran: roundToFra(rec.dipiskoran, 2) || 0, dipIskBedel: bedel(rec.dipiskbedel) || 0
			});
			this.karmaTahsilatmi = !!this.tahsilatRowId;
			let icmal = this.icmal = new this.class.icmalSinif(); icmal.setValues(e)
		}
		async yeniTanimOncesiIslemler(e) {
			e = e || {}; await super.yeniTanimOncesiIslemler(e);
			if (!this.dipIskOran) await this.getCariStdDipIskOran({ tx: e.tx })
		}
		async initBaslikUI_ara(e) {
			await super.initBaslikUI_ara(e);
			let {app} = sky, {parentPart, layout} = e;
			let {satismi, iademi, fiiliCikismi} = this.class, {param} = parentPart;
			let userSettings = param.userSettings = param.userSettings || {};
			let sonDegerler = userSettings.sonDegerler = userSettings.sonDegerler || {}; let savedParentWidth;
			if (this.class.sevkTarihKullanilirmi) {
				let divSaha = layout.find(`#sevkTarih`);
				let sahaContainer = divSaha.parents(`.parent`);
				let divEtiket = sahaContainer.find(`.etiket`);
				if (divEtiket.length)
					divEtiket.html(`${this.class.sevkTarihEtiket} Tarihi`);
				let ci = Date.CultureInfo;
				divSaha.datepicker({
					changeMonth: true, changeYear: true, theme: theme,
					letrainInput: false, showButtonPanel: true,
					/* showOn: 'button', */ buttonText: 'Tarih Seç',
					buttonImage: `lib/calendar.gif`, buttonImageOnly: true,
					dateFormat: /*ci.shortDate*/ 'dd.mm.yy', firstDay: ci.firstDayOfWeek,
					weekHeader: 'Hft.', showWeek: true,
					currentText: 'BUGÜN', closeText: 'KAPAT',
					dayNames: ci.dayNames, dayNamesShort: ci.abbreviatedDayNames, dayNamesMin: ci.shortestDayNames,
					monthNames: ci.monthNames, monthNamesShort: ci.abbreviatedMonthNames
				});
				divSaha.val(dateToString(this.sevkTarih));
				divSaha.datepicker($.datepicker.regional['tr']);
				divSaha.on('change', evt => {
					let input = $(evt.target);
					let val = input.val();
					if (val && !isInvalidDate(val)) {
						input.data('savedVal', val);
						this.sevkTarih = asDate(val);
					}
				});
				divSaha.on('focusin', evt =>
					evt.target.select());
				divSaha.on('focusout', evt => {
					let input = $(evt.target);
					let ch = input.val();
					let value = tarihDegerDuzenlenmis(ch, () => input.data('savedVal'));
					if (value) {
						evt.preventDefault();
						input.val(value || '');
						this.sevkTarih = asDate(value);
					}
				});
				sahaContainer.removeClass(`jqx-hidden`);
			}

			if (!app.sevkYeriKullanilmazmi && this.class.sevkYeriKullanilirmi) {
				let kod = this.sevkAdresKod, sonDeger = sonDegerler.sevkAdresKod;
				let divSaha = layout.find(`#sevkAdresKod`), sahaContainer = divSaha.parents(`.parent`), divEtiket = sahaContainer.find(`.etiket`);
				let part = this._sevkAdresKodPart = new CETMstComboBoxPart({
					parentPart, content: divSaha, placeHolder: 'Sevk Yeri', listeSinif: CETKAListePart,
					table: 'mst_SevkAdres', idSaha: 'kod', adiSaha: 'aciklama', selectedId: kod,
					widgetDuzenleyici: e => {
						savedParentWidth = e.widgetArgs.width = savedParentWidth || (e.widgetArgs.width - (divEtiket.width() ||  0));
						e.widgetArgs.dropDownWidth = e.widgetArgs.width;
					},
					events: {
						comboBox_stmDuzenleyici: e => {
							let {mustKod} = this;
							if (mustKod) { e.stm.sentDo(sent => sent.where.degerAta(mustKod, `mst.mustKod`)) }
						},
						liste_stmDuzenleyici: e => {
							let {mustKod} = this;
							if (mustKod) { e.stm.sentDo(sent => sent.where.degerAta(mustKod, `mst.mustKod`)) }
						},
						/*comboBox_loadServerData: e => {
							return (e.wsArgs || {}).searchText ? null : Object.values(sky.app.caches.sevkAdresKod2Rec)
						},*/
						comboBox_itemSelected: e => {
							kod = this.sevkAdresKod = e.rec?.kod || e.value || '';
							if (sonDeger != kod) {
								sonDeger = sonDegerler.sevkAdresKod = kod;
								parentPart.paramDegistimi = true
							}
						}
					}
				});
				sahaContainer.removeClass(`jqx-hidden`); await part.run();
			}
			if (!app.defaultYerKod || app.class.appMagazaVeyaSDMmi) {
				let kod = this.yerKod;
				let sonDeger = sonDegerler.yerKod;
				let divSaha = layout.find(`#yerKod`);
				let sahaContainer = divSaha.parents(`.parent`);
				let divEtiket = sahaContainer.find(`.etiket`);
				let part = new CETMstComboBoxPart({
					parentPart: parentPart,
					content: divSaha,
					// layout: layout.find('.hizliStok'),
					placeHolder: `${fiiliCikismi ? 'Çıkış' : 'Giriş'} Yeri`,
					listeSinif: CETKAListePart, table: 'mst_Yer',
					idSaha: 'kod', adiSaha: 'aciklama',
					selectedId: kod || sonDeger,
					widgetDuzenleyici: e => {
						savedParentWidth = e.widgetArgs.width = savedParentWidth || (
							e.widgetArgs.width - (divEtiket.width() ||  0) );
						e.widgetArgs.dropDownWidth = e.widgetArgs.width;
					},
					events: {
						comboBox_stmDuzenleyici: e => {
							let defaultSubeKod = sky.app.defaultSubeKod;
							if (defaultSubeKod != null) {
								e.stm.sentDo(sent =>
									sent.where.degerAta(defaultSubeKod, `mst.subeKod`));
							}
						},
						liste_stmDuzenleyici: e => {
							let defaultSubeKod = sky.app.defaultSubeKod;
							if (defaultSubeKod != null) {
								e.stm.sentDo(sent =>
									sent.where.degerAta(defaultSubeKod, `mst.subeKod`));
							}
						},
						comboBox_itemSelected: e => {
							kod = this.yerKod = (e.rec || {}).kod || e.value || sky.app.defaultYerKod || '';
							if (sonDeger != kod) {
								sonDeger = sonDegerler.yerKod = kod;
								parentPart.paramDegistimi = true;
								
								if (parentPart.listeReadyFlag) {
									let {detaylar} = this;
									let degistimi = false;
									for (let i in detaylar) {
										let det = detaylar[i];
										det.cacheReset();
										det.detYerKodReset();
										det.ekOzelliklerDo({
											callback: _e => {
												let ekOzellik = _e.item;
												if ((ekOzellik.tip == 'raf' || ekOzellik.tip == 'refRaf') && ekOzellik.value) {
													ekOzellik.value = '';
													degistimi = true;
												}
											}
										})
									}
									if (degistimi && parentPart && parentPart.tazele)
										parentPart.tazele();
								}
							}
						}
					}
				});
				sahaContainer.removeClass(`jqx-hidden`);
				await part.run();
			}

			// if (!app.appSicakVeyaSogukmu || !app.defaultPlasiyerKod) {
			if (!app.defaultPlasiyerKod) {
				let kod = this.plasiyerKod;
				let sonDeger = sonDegerler.plasiyerKod;
				/*if (sonDeger != kod) {
					sonDeger = sonDegerler.plasiyerKod = kod;
					parentPart.paramDegistimi = true;
				}*/

				let divSaha = layout.find(`#plasiyerKod`);
				let sahaContainer = divSaha.parents(`.parent`);
				let divEtiket = sahaContainer.find(`.etiket`);
				let part = new CETMstComboBoxPart({
					parentPart: parentPart,
					content: divSaha,
					// layout: layout.find('.hizliStok'),
					placeHolder: 'Plasiyer',
					listeSinif: CETKAListePart, table: 'mst_Plasiyer',
					idSaha: 'kod', adiSaha: 'aciklama',
					selectedId: kod,
					widgetDuzenleyici: e => {
						savedParentWidth = e.widgetArgs.width = savedParentWidth || (
							e.widgetArgs.width - (divEtiket.width() ||  0) );
						e.widgetArgs.dropDownWidth = e.widgetArgs.width;
					},
					events: {
						comboBox_loadServerData: e => {
							return (e.wsArgs || {}).searchText ? null : Object.values(sky.app.caches.plasiyerKod2Rec)
						},
						comboBox_itemSelected: e => {
							kod = this.plasiyerKod = (e.rec || {}).kod || e.value || sky.app.defaultPlasiyerKod;
							if (sonDeger != kod) {
								sonDeger = sonDegerler.plasiyerKod = kod;
								parentPart.paramDegistimi = true;
							}
						}
					}
				});
				sahaContainer.removeClass(`jqx-hidden`);
				await part.run();
			}

			if (!app.nakliyeSekliKullanilmazmi && !app.defaultNakSekliKod) {
				let kod = this.nakSekliKod;
				let sonDeger = sonDegerler.nakSekliKod;
				/*if (sonDeger != kod) {
					sonDeger = sonDegerler.plasiyerKod = kod;
					parentPart.paramDegistimi = true;
				}*/

				let divSaha = layout.find(`#nakSekliKod`);
				let sahaContainer = divSaha.parents(`.parent`);
				let divEtiket = sahaContainer.find(`.etiket`);
				let part = new CETMstComboBoxPart({
					parentPart: parentPart,
					content: divSaha,
					// layout: layout.find('.hizliStok'),
					placeHolder: 'Nakliye Şekli',
					listeSinif: CETKAListePart, table: 'mst_NakliyeSekli',
					idSaha: 'kod', adiSaha: 'aciklama',
					selectedId: kod || sonDeger,
					widgetDuzenleyici: e => {
						savedParentWidth = e.widgetArgs.width = savedParentWidth || (
							e.widgetArgs.width - (divEtiket.width() ||  0) );
						e.widgetArgs.dropDownWidth = e.widgetArgs.width;
					},
					events: {
						comboBox_loadServerData: e => {
							return (e.wsArgs || {}).searchText ? null : Object.values(sky.app.caches.nakliyeSekliKod2Rec)
						},
						comboBox_itemSelected: e => {
							kod = this.nakSekliKod = (e.rec || {}).kod || e.value || sky.app.defaultNakSekliKod;
							if (sonDeger != kod) {
								sonDeger = sonDegerler.nakSekliKod = kod;
								parentPart.paramDegistimi = true;
							}
						}
					}
				});
				sahaContainer.removeClass(`jqx-hidden`); await part.run();
			}
			if (satismi && !iademi) {
				let divSaha_tahSekliKodNo = layout.find('#tahSekliKodNo'), sahaContainer_tahSekliKodNo = divSaha_tahSekliKodNo?.parents('.parent');
				let hasTahSekliNoLayout, divSaha = layout.find('#karmaTahsilat'), sahaContainer = divSaha.parents('.parent');
				let value = this.karmaTahsilatmi; divSaha.prop('checked', value);
				if (!!this.tahsilatRowId) { divSaha.attr('disabled', '') }
				let changeHandler = evt => {
					value = this.karmaTahsilatmi = $(evt.currentTarget).is(':checked');
					setTimeout(() => {
						if (hasTahSekliNoLayout == null) { hasTahSekliNoLayout = sahaContainer_tahSekliKodNo?.length && !(sahaContainer_tahSekliKodNo.hasClass('jqx-hidden') || sahaContainer_tahSekliKodNo.hasClass('basic-hidden')) }
						if (hasTahSekliNoLayout) { if (value) { sahaContainer_tahSekliKodNo.addClass('jqx-hidden') } else { sahaContainer_tahSekliKodNo.removeClass('jqx-hidden basic-hidden') } }
					}, 10)
				}
				changeHandler({ currentTarget: divSaha[0] });
				divSaha.on('change', changeHandler); sahaContainer.removeClass('jqx-hidden basic-hidden')
			}
			if (satismi && !iademi && app.param.faturadaTahsilatYapilirmi) {
				let kodNo = asInteger(this.tahSekliKodNo), sonDeger = sonDegerler.tahSekliKodNo;
				let divSaha = layout.find('#tahSekliKodNo'), sahaContainer = divSaha.parents('.parent'), divEtiket = sahaContainer.find('.etiket');
				let part = new CETMstComboBoxPart({
					parentPart, content: divSaha, placeHolder: 'Tahsil Şekli', listeSinif: CETKAListePart, table: 'mst_TahsilSekli',
					idSaha: 'kodNo', adiSaha: 'aciklama', selectedId: kodNo || null,
					widgetDuzenleyici: e => {
						savedParentWidth = e.widgetArgs.width = savedParentWidth || (e.widgetArgs.width - (divEtiket.width() || 0));
						e.widgetArgs.dropDownWidth = e.widgetArgs.width;
					},
					events: {
						comboBox_loadServerData: e => e.wsArgs?.searchText ? null : Object.values(sky.app.caches.tahsilSekliKodNo2Rec),
						comboBox_itemSelected: e => {
							let rec = e.rec || {}; kodNo = this.tahSekliKodNo = asInteger(rec.kod || rec.kodNo) || null;
							if (sonDeger != kodNo) { sonDeger = sonDegerler.tahSekliKodNo = kodNo; parentPart.paramDegistimi = true }
						}
					}
				});
				sahaContainer.removeClass('jqx-hidden'); await part.run()
			}
			if (app.dovizKullanilirmi && !app.defaultDovizKod) {
				let kod = this.dvKod, sonDeger = sonDegerler.dvKod;
				let divSaha = layout.find(`#dvKod`), sahaContainer = divSaha.parents(`.parent`), divEtiket = sahaContainer.find(`.etiket`);
				let part = new CETMstComboBoxPart({
					parentPart, content: divSaha, placeHolder: 'Döviz', listeSinif: CETKAListePart, table: 'mst_Doviz',
					idSaha: 'kod', adiSaha: 'aciklama', selectedId: kod || sonDeger,
					widgetDuzenleyici: e => {
						let {widgetArgs} = e; savedParentWidth = widgetArgs.width = savedParentWidth || (widgetArgs.width - (divEtiket.width() ||  0));
						$.extend(widgetArgs, { dropDownWidth: widgetArgs.width })
					},
					events: {
						comboBox_loadServerData: e => (e.wsArgs || {}).searchText ? null : Object.values(sky.app.caches.dvKod2Rec),
						comboBox_itemSelected: async e => {
							let {sender} = e, {parentPart} = sender;
							kod = this.dvKod = (e.rec || {}).kod || e.value || sky.app.defaultDovizKod;
							if (sonDeger != kod) {
								sonDeger = sonDegerler.dvKod = kod;
								if (parentPart)
									parentPart.paramDegistimi = true
								await this.dvKodDegisti(e)
							}
							let {dvKod, dvKur} = this;
							sender.comboBoxWidget.input.attr('placeholder', `${dvKod || ''}` + (dvKur ? ` [${dvKur.toLocaleString()} TL]` : ''));
							if (parentPart && parentPart.liste_degisti)
								parentPart.liste_degisti(e)
						},
						comboBox_stmDuzenleyici: e => {
							let {alias, stm} = e;
							for (let sent of stm.getSentListe())
								sent.sahalar.add(`${alias}.${fiiliCikismi ? 'satisKur' : 'alimKur'} dvkur`)
						},
						liste_stmDuzenleyici: e => {
							let {alias, stm} = e;
							for (let sent of stm.getSentListe())
								sent.sahalar.add(`${fiiliCikismi ? 'satisKur' : 'alimKur'} dvkur`)
						},
						listeColumnsDuzenleFunc: e => {
							let {listeColumns} = e;
							listeColumns.push({ dataField: 'kur', text: 'Dv. Kur', width: 110, columnType: 'number', cellsAlign: 'right' })
						}
					}
				});
				sahaContainer.removeClass(`jqx-hidden`);
				await part.run()
			}
		}
		async dvKodDegisti(e) {
			e = e || {}; await this.dvKurBelirle(e);
			$.extend(this, { sonDvKod: this.dvKod, sonDvKur: this.dvKur })
		}
		static async dvKurBelirle(e) {
			let result = this.dvKurBelirleFromCache(e);
			if (result != null)
				return result
			let {dbMgr} = this;
			let sent = new MQSent({ from: 'mst_Doviz', where: [ { degerAta: dvKod, saha: 'kod' } ], sahalar: [ `${this.fiiliCikismi ? 'satisKur' : 'alimKur'} dvkur` ] });
			return roundToFra(await dbMgr.tekilDegerExecuteSelect({ query: sent }), 6)
		}
		static dvKurBelirleFromCache(e) {
			let {dvKod} = e;
			if (!dvKod)
				return 0
			let {dvKod2Rec} = sky.app.caches || {};
			let rec = dvKod2Rec[dvKod];
			return rec ? roundToFra(rec[this.fiiliCikismi ? 'satisKur' : 'alimKur'], 6) : null }
		async dvKurBelirle(e) {
			e = e || {}; let {dvKod} = this;
			if (!dvKod) { this.dvKur = 0; return this }
			this.dvKur = await this.class.dvKurBelirle($.extend({}, e, { dvKod: dvKod }));
			return this
		}
		gerekirseDipHesapla(e) {
			super.gerekirseDipHesapla(e); let {icmal} = this;
			if (!icmal) { icmal = this.dipOlustur(e); icmal.hesaplandimi = true; return icmal }
			if (!icmal.hesaplandimi) { this.dipHesapla(e) }
			return icmal
		}
		dipHesapla(e) {
			super.dipHesapla(e); let {icmal} = this;
			if (!icmal) { icmal = this.dipOlustur(e); icmal.hesaplandimi = true; return icmal }
			icmal.hesapla({ fis: this }); icmal.hesaplandimi = true;
			return icmal
		}
		dipOlustur(e) { super.dipOlustur(e); return this.icmal = this.class.icmalSinif.fromFis({ fis: this }) }
		async promosyonHesapla(e) {
			await this.dipHesapla(e); let {sonucBedel} = this;
			let tavsiyeProKod2Stok = {}, shKod2Bilgi = {}, grupKod2StokSet = {};
			let {detaylar: orjDetaylar} = this, detaylar = orjDetaylar.map(det => det.deepCopy());
			let yDetaylar = []; /* normal satırlar ve bulunacak promosyonlar */ for (let det of detaylar) {
				let {shKod} = det; $.extend(det, { proIskOran: 0, ozelIskontoVarmi: false }); await det.detayEkIslemler(e);
				if (det.class.promosyonmu) { let proKod = det.promoKod; tavsiyeProKod2Stok[proKod] = shKod }
				else {
					yDetaylar.push(det); if (det.promosyonYapilmazmi) { continue }
					let {grupKod} = det; let bilgi = shKod2Bilgi[shKod] = shKod2Bilgi[shKod] || { topMiktar: 0, grupKod };
					bilgi.topMiktar = (asFloat(bilgi.topMiktar) || 0) + (asFloat(det.miktar) || 0);
					let _detaylar = bilgi.detaylar = bilgi.detaylar || []; if (!$.isArray(_detaylar)) { _detaylar = bilgi.detaylar = Object.keys(_detaylar) }
					_detaylar.push(det); let shKodSet = grupKod2StokSet[grupKod] = grupKod2StokSet[grupKod] || {}; shKodSet[shKod] = true
				}
			}
			let dogrudanProDetListe = []; if (!$.isEmptyObject(yDetaylar)) {
				let promosyonYapilari = e.promosyonYapilari || {}, ekBilgiDict = e.ekBilgiDict = {};
				for (let proTip in promosyonYapilari) {
					if ($.isEmptyObject(shKod2Bilgi)) { break }
					let promosyonListe = promosyonYapilari[proTip]; for (let pro of promosyonListe) {
						let tavsiyeStokKod = tavsiyeProKod2Stok[pro.id];
						let result = await pro.promosyonSonucu({ ...e, detaylar, yDetaylar, shKod2Bilgi, grupKod2StokSet, tavsiyeStokKod, ekBilgiDict });
						let proDet = result?.proDet; if (proDet) {
							proDet.promoKod = proDet.promoKod || pro.id; yDetaylar.push(proDet);
							if (!pro.class.stokSecimlimi) { dogrudanProDetListe.push(proDet) }
						}
					}
				}
			}
			this.detaylar = yDetaylar; let rollbackFlag = false;
			if (e.islem && !e.gecici && !$.isEmptyObject(dogrudanProDetListe)) {
				let yProDetListe = await new Promise(async (resolve, fail) => {
					let _recs = [], seq2ProDet = {};
					for (let seq = 0; seq < dogrudanProDetListe.length; seq++) {
						let det = dogrudanProDetListe[seq];
						_recs.push({ seq, proKod: det.promoKod, proAdi: det.promoAdi, proSHKod: det.shKod, proSHAdi: det.shAdi, hedefMiktar: det.miktar });
						seq2ProDet[seq] = det
					}
					let part = new CETPromoUrunSecimPart({
						editable: false, proDetaylar: _recs,
						kaydedince: e => {
							let _proDetListe = [], recs = e.recs.filter(rec => !!rec.proSHKod);
							for (let rec of recs) { let det = seq2ProDet[rec.seq]; _proDetListe.push(det) }
							resolve(_proDetListe)
						},
						geriCallback: e => resolve({ isError: true, rc: 'vazgecYapildi', errorText: 'İşlem kullanıcı tarafından iptal edildi' })
					});
					await part.run();
				}) || [];
				if (yProDetListe && yProDetListe.isError) { throw yProDetListe }
				yDetaylar = yDetaylar.filter(det => !det.class.promosyonmu); yDetaylar.push(...(yProDetListe || []));
				this.detaylar = yDetaylar; if (this.promosyonHesaplaSonrasi_araIslem(e) === false) { rollbackFlag = true }
			}
			if (!rollbackFlag) {
				await this.dipHesapla(e) /* let yeniSonucBedel = this.sonucBedel;
				if (sonucBedel != yeniSonucBedel) {
					let _result = await new $.Deferred(p => {
						displayMessage(
							(   `<p><span class="blue">Promosyon Hesabı sonrası <b>Belge Sonuç Bedeli</b> değişti!</span><br/><span class="bold">Devam edilsin mi?</span></p>` +
								`<p class="ekBilgi"><ul><li>Önce : <span class="bold red">${bedelStr(sonucBedel)} TL</span></li><li>Sonra: <span class="bold green">${bedelStr(yeniSonucBedel)} TL</span></li></ul></p>`
							), sky.app.appText, true,
							{ EVET: (dlgUI, btnUI) => { dlgUI.jqxWindow('destroy'); p.resolve(true) }, HAYIR: (dlgUI, btnUI) => { dlgUI.jqxWindow('destroy'); p.resolve(false) } }
						)
					});
					if (!_result) { rollbackFlag = true }
				} */
			}
			if (rollbackFlag) { this.detaylar = orjDetaylar; await this.dipHesapla(e); throw { isError: true, rc: 'userAbort' } }
			return yDetaylar
		}
		promosyonHesaplaSonrasi_araIslem(e) { }
		async onKontrol(e) {
			e = e || {}; let superResult = await super.onKontrol(e);
			if (!superResult || superResult.isError) { return superResult }
			let kod = this.nakSekliKod;
			if (kod) {
				let result = sky.app.caches.nakliyeSekliKod2Rec[kod];
				if (result == null) { result = parseInt(await this.dbMgr.tekilDegerExecuteSelect({ tx: e.tx, query: `SELECT COUNT(*) sayi FROM mst_NakliyeSekli WHERE kod = ?`, params: [kod] })) }
				if (!result) { return this.error_onKontrol(`<b>(${kod})</b> kodlu <u>Nakliye Şekli</u> hatalıdır.<p/><p class="gray">** Ekranda <u>Nakliye Şekli</u> kutusu <b>boş gözüküyor ise</b>, üzerine tıklayıp ENTER tuşuna basarak değeri silebilirsiniz</p>`, 'invalidValue') }
			}
			kod = this.tahSekliKodNo;
			if (kod) {
				let result = sky.app.caches.tahsilSekliKodNo2Rec[kod];
				if (result == null)
					result = parseInt(await this.dbMgr.tekilDegerExecuteSelect({ tx: e.tx, query: `SELECT COUNT(*) sayi FROM mst_TahsilSekli WHERE kodNo = ?`, params: [kod] }))
				if (!result)
					return this.error_onKontrol(`<b>(${kod})</b> kodlu <u>Tahsil Şekli</u> hatalıdır.<p/><p class="gray">** Ekranda <u>Tahsil Şekli</u> kutusu <b>boş gözüküyor ise</b>, üzerine tıklayıp ENTER tuşuna basarak değeri silebilirsiniz</p>`, 'invalidValue');
			}
			return superResult
		}
		async kaydetOncesiKontrol_ara(e) {
			await super.kaydetOncesiKontrol_ara(e);
			if (this.class.sevkTarihKullanilirmi) {
				let {tarih, sevkTarih} = this;
				if (tarih && sevkTarih && asDate(tarih).clearTime() > asDate(sevkTarih).clearTime())
					throw { isError: true, rc: 'invalidValue', errorText: `<b>${this.class.sevkTarihEtiket} Tarihi</b> , Fiş Tarihi'nden <u>geri olamaz</u>` }
			}
			if (this.class.siparisKontrolEdilirmi) { await this.kaydetOncesiKontrol_bekleyenSiparis(e) }
			await this.kaydetOncesiKontrol_iskOran(e);
			if (sky.app.ozelKampanyaKullanilirmi) { await this.kaydetOncesiKontrol_ozelKamOran(e) }
			await this.kaydetOncesiKontrol_promosyon(e); await this.kaydetOncesiKontrol_nakitUstLimit(e);
			await this.kaydetOncesiKontrol_fiyat(e)
		}
		kaydetOncesiKontrol_fiyat(e) { }
		async kaydetOncesiKontrol_bekleyenSiparis(e) {
			let {siparisRefKontrolEdilirmi, siparisMiktarKontrolEdilirmi} = this.class, {dbMgr, mustKod} = this, {gecicimi, islem, tx} = e;
			let eskiFis = !asBool(gecicimi) && (islem == 'degistir') ? e.eskiFis : null, detaylar = this.sonStokIcinAltDetaylar;
			let anahStr2HV = {}; for (let det of detaylar) {
				if (!det.class.promosyonmu) {
					// let stokKod = det.shKod;
					let anahStr = det.getAnahtarStrSiparis({ fis: this });
					anahStr2HV[anahStr] = det.getAnahtarHVSiparis({ fis: this });
				}
			}
			if ($.isEmptyObject(anahStr2HV))
				return

			let {anahtarDelim, idSahalarSiparis} = CETEkOzellikler;
			let anahStr2KarsilamaYapi = {};
			for (let det of detaylar) {
				if (!det.class.promosyonmu) {
					// let stokKod = det.shKod;
					let anahStr = det.getAnahtarStrSiparis({ fis: this });
					let karsilamaYapi = anahStr2KarsilamaYapi[anahStr] = anahStr2KarsilamaYapi[anahStr] || {};
					karsilamaYapi.topMiktar = (karsilamaYapi.topMiktar || 0) + det.miktar;
					karsilamaYapi.bekleyenSayac2MiktarYapi = karsilamaYapi.bekleyenSayac2MiktarYapi || {};
				}
			}

			let stm, sent, recs;
			if (eskiFis) {
				let _detaylar = eskiFis.sonStokIcinAltDetaylar;
				for (let det of _detaylar) {
					if (!det.class.promosyonmu) {
						// let stokKod = det.shKod;
						let anahStr = det.getAnahtarStrSiparis({ fis: this });
						let karsilamaYapi = anahStr2KarsilamaYapi[anahStr] = anahStr2KarsilamaYapi[anahStr] || {};
						karsilamaYapi.topMiktar = (karsilamaYapi.topMiktar || 0) - det.miktar;
						let bekleyenSayac2MiktarYapi = karsilamaYapi.bekleyenSayac2MiktarYapi = karsilamaYapi.bekleyenSayac2MiktarYapi || {};
						let {siparisVioID2MiktarYapi} = det;
						for (let vioID in siparisVioID2MiktarYapi) {
							let miktar = siparisVioID2MiktarYapi[vioID];
							let miktarYapi = bekleyenSayac2MiktarYapi[vioID] = bekleyenSayac2MiktarYapi[vioID] || {};
								// (- miktar) ==> geri konacak anlamındadır (karşılama iptali)
							miktarYapi.miktar = (miktarYapi.miktar || 0) - miktar;
							miktarYapi.olasiMiktar = (miktarYapi.olasiMiktar || 0) + miktar		// eski karsilanan kadar ilave
						}
					}
				}
			}
		// belirlenen stoklar icin tablodaki bekleyenler
			let anahHVListe = [];
			for (let anahStr in anahStr2KarsilamaYapi) {
				let anahHV = anahStr2HV[anahStr];
				if (anahHV)
					anahHVListe.push(anahHV);
			}
			stm = this.class.siparisKontrolStm({ mustKod, anahHVListe });
			recs = await dbMgr.executeSqlReturnRowsBasic({ tx: tx, query: stm });
			for (let i = 0; i < recs.length; i++) {
				let rec = recs[i], {stokKod, vioID, kalanMiktar} = rec;
				let anah = [stokKod];
				for (let key of idSahalarSiparis) {
					let value = rec[key];
					if (value != null)
						anah.push(value)
				}			
				let anahStr = anah.join(anahtarDelim);
				let karsilamaYapi = anahStr2KarsilamaYapi[anahStr];
				let bekleyenSayac2MiktarYapi = karsilamaYapi ? karsilamaYapi.bekleyenSayac2MiktarYapi : null;
				if (bekleyenSayac2MiktarYapi) {
					let miktarYapi = bekleyenSayac2MiktarYapi[vioID] = bekleyenSayac2MiktarYapi[vioID] || {};
					if (miktarYapi)
						miktarYapi.olasiMiktar = (miktarYapi.olasiMiktar || 0) + kalanMiktar
				}
			}
// detaylar artik fifo yontemine göre vioID sirasinda karsilanabilir
			let siparisteOlmayanlar = {};
			let karsilanamayanAnahStr2Miktar = {};
			for (let det of detaylar) {
				let anahStr = det.getAnahtarStrSiparis({ fis: this });
				// let stokKod = det.shKod;
				let karsilamaYapi = anahStr2KarsilamaYapi[anahStr] || {};
				let siparisVioID2MiktarYapi = det.siparisVioID2MiktarYapi = det.siparisVioID2MiktarYapi || {};
				let bekleyenSayac2MiktarYapi = karsilamaYapi.bekleyenSayac2MiktarYapi = karsilamaYapi.bekleyenSayac2MiktarYapi || {};
				let bekleyenSayac2MiktarYapiKeys = Object.keys(bekleyenSayac2MiktarYapi);
				let kalanMiktar = det.miktar;
				for (let vioID in siparisVioID2MiktarYapi) {
					let karsilananMiktar = siparisVioID2MiktarYapi[vioID] || 0;
					let dusMiktar = Math.min(kalanMiktar, karsilananMiktar);
					kalanMiktar -= dusMiktar;
					if (karsilananMiktar > dusMiktar)
						siparisVioID2MiktarYapi[vioID] = dusMiktar
					let miktarYapi = bekleyenSayac2MiktarYapi[vioID] = bekleyenSayac2MiktarYapi[vioID] || { olasiMiktar: 0 };
					miktarYapi.olasiMiktar -= dusMiktar
				}
				let sipInd = 0;
				while (kalanMiktar > 0 && sipInd < bekleyenSayac2MiktarYapiKeys.length) {
					let vioID = asInteger(bekleyenSayac2MiktarYapiKeys[sipInd]);
					let miktarYapi = bekleyenSayac2MiktarYapi[vioID];
					let olasiMiktar = miktarYapi.olasiMiktar || 0;
					let dusMiktar = Math.min(kalanMiktar, olasiMiktar);
					kalanMiktar -= dusMiktar;
					olasiMiktar = miktarYapi.olasiMiktar = olasiMiktar - dusMiktar;
					if (dusMiktar > 0)
						siparisVioID2MiktarYapi[vioID] = dusMiktar
					sipInd++
				}
				if ($.isEmptyObject(siparisVioID2MiktarYapi))
					siparisteOlmayanlar[anahStr] = true;
				if (kalanMiktar > 0)
					karsilanamayanAnahStr2Miktar[anahStr] = kalanMiktar
			}
			let sipIDSet = {};
			for (let det of detaylar) {
				let anahStr = det.getAnahtarStrSiparis({ fis: this });
				// let stokKod = det.shKod;
				let {siparisVioID2MiktarYapi} = det;
				if (siparisVioID2MiktarYapi) {
					for (let vioID in siparisVioID2MiktarYapi)
						sipIDSet[vioID] = true
				}
			}
			stm = new MQStm({
				sent: new MQSent({
					from: 'data_BekleyenSiparisler bhar',
					where: [ { inDizi: Object.keys(sipIDSet), saha: 'bhar.vioID' } ],
					sahalar: ['bhar.vioID', 'bhar.odemeGunKod', 'bhar.tahSekliKodNo']
				})
			});
			recs = await dbMgr.executeSqlReturnRowsBasic({ tx: tx, query: stm });
			let sipCakisma = { tahSekli: {}, odemeGun: {} };
			for (let i = 0; i < recs.length; i++) {
				let rec = recs[i], tahSekliKodNo = asInteger(rec.tahSekliKodNo) || 0, {vioID, odemeGunKod} = rec;
				sipCakisma.tahSekli[tahSekliKodNo] = true;
				if (!tahSekliKodNo)
					sipCakisma.odemeGun[odemeGunKod] = true
			}
			let errorStr = '';
			if (siparisRefKontrolEdilirmi && !$.isEmptyObject(siparisteOlmayanlar)) {
				errorStr += (
					`<p>Bazı ürünler için <b>Sipariş <u>YOKTUR</u>:</b></p>${CrLf}` +
						`<ul style="font-size: 105%; padding-left: 25px;">${CrLf}`
				);
				for (let anahStr in siparisteOlmayanlar)
					errorStr += `<li><u class="bold">${anahStr}</u></li>${CrLf}`
				errorStr += `${CrLf}</ul>`
			}
			if (siparisMiktarKontrolEdilirmi && !$.isEmptyObject(karsilanamayanAnahStr2Miktar)) {
				errorStr += (
					`<p>Bazı ürünler için <b>Sipariş Miktarı <u>YETERSİZ</u>:</b></p>${CrLf}` +
						`<ul style="font-size: 105%; padding-left: 25px;">${CrLf}`
				);
				for (let anahStr in karsilanamayanAnahStr2Miktar) {
					let kalanMiktar = karsilanamayanAnahStr2Miktar[anahStr];
					errorStr += `<li><u>${anahStr}</u> : <i class="bold" style="float: right;">${kalanMiktar}</i></li>${CrLf}`
				}
				errorStr += `${CrLf}</ul>`
			}
			if (Object.keys(sipCakisma.tahSekli).length > 1)
				errorStr += `<p>Karşılanan Siparişlerde <b>Çoklu Tahsil Şekli</b> var</p>`
			else {
				let tahsilSekliVarmi = !!asInteger(Object.keys(sipCakisma.tahSekli)[0]);
				if (tahsilSekliVarmi) {
					if (Object.keys(sipCakisma.odemeGun)[0])
						errorStr += `<p>Karşılanan Siparişlerde Hem <b>Tahsil Şekli</b> hem de <b>Ödeme Gün Kodu</b> olamaz</p>`;
				}
				else {
					if (Object.keys(sipCakisma.odemeGun).length > 1 && this.class.depoSevkiyatSiparisKarsilamaOdemeGunTekmi)
						errorStr += (
							`<p>Sipariş Karşılama <b>Çoklu Ödeme Gün</b> için yapılamaz` +
							`<div style="margin-top: -10px; margin-left: 25px; font-size: 90%; color: #acacac;">(<i>Merkez Parametre Kuralı sebebiyle</i>)</div></p>`
						)
				}
			}
			if (errorStr)
				throw { isError: true, rc: `bekleyenSiparisKontrol`, errorText: errorStr }
		}
		static siparisKontrolStm(e) {
			let sent = new MQSent({
				from: `data_BekleyenSiparisler bhar`,
				where: [
					{ degerAta: this.almSat, saha: `bhar.almSat` },
					{ degerAta: e.mustKod, saha: `bhar.mustKod` },
					// { inDizi: e.stokKodListe, saha: `bhar.stokKod` }
				],		// miktar yetersizlik bakilmayacak
				sahalar: [
					`bhar.vioID`, `bhar.stokKod`,
					`SUM(bhar.bekleyenMiktar) bekleyenMiktar`, `SUM(bhar.kalanMiktar) kalanMiktar`
				],
				groupBy: [
					`bhar.vioID`, `bhar.stokKod`
				]
			});
			let {anahHVListe} = e;
			let or = new MQOrClause();
			if (!$.isEmptyObject(anahHVListe)) {
				let excludeSet = asSet(['shKod', 'stokKod']);
				for (let i in anahHVListe) {
					let anahHV = anahHVListe[i], stokKod = anahHV.shKod || anahHV.stokKod;
					let _wh = new MQSubWhereClause({ parantezli: true });
					_wh.degerAta(stokKod, `bhar.stokKod`);
					for (let key in anahHV) {
						if (!excludeSet[key]) {
							let value = anahHV[key];
							_wh.degerAta(value, key)
						}
					}
					or.add(_wh)
				}
			}
			if (!$.isEmptyObject(or.liste))
				sent.where.add(or)
			let {idSahalarSiparis} = CETEkOzellikler;
			for (let idSaha of idSahalarSiparis) {
				let clause = `bhar.${idSaha}`;
				sent.sahalar.add(clause); sent.groupBy.add(clause);
			}
			return new MQStm({ sent });
		}
		async kaydetOncesiKontrol_iskOran(e) {
			let {app} = sky;
			let {detaylar, dipIskOran, icmal} = this;
			let detaySinif = $.isEmptyObject(detaylar) ? this.class.detaySinif : detaylar[0].class;
			let satirIskOranSinir = asFloat(app.satirIskOranSinir) || 0;
			let iskKullanilirmi = satirIskOranSinir > 0;
			let maxOrtIskOran = 0;
			let maxOrtIskOranBelirleForOranlar = oranlar => {
				let yuzdeKalan = 100;
				if (oranlar) {
					for (let _oran of oranlar) {
						if (_oran) {
							let oran = roundToFra(_oran * yuzdeKalan / 100, 2);
							yuzdeKalan = bedel(yuzdeKalan - oran);
						}
					}
				}
				let ortIskOran = roundToFra(100 - yuzdeKalan, 2);
				if (ortIskOran > maxOrtIskOran)
					maxOrtIskOran = ortIskOran;
				return ortIskOran;
			};
			
			let maxOrtIskOranBelirleForKeys = e => {
				let {keys, det, index} = e;
				let oranlar = det.ozelIskontoVarmi ? [] : (keys || []).map(key => det[key]);
				let ortIskOran = maxOrtIskOranBelirleForOranlar(oranlar);
				let detIskOranSinir = det.satirIskOranSinirUyarlanmis;
				if (ortIskOran > detIskOranSinir) {
					let {shKod, shAdi} = det;
					throw {
						isError: true,
						rc: iskKullanilirmi
								? 'iskOranSinirAsildi'
								: 'accessDenied',
						errorText: 
							iskKullanilirmi
								?
									(
										`<u class="bold red">${(index + 1).toLocaleString()}. satır</u>daki <b>(${shKod}) ${shAdi}</b> ürününe ait İskonto Oran Ortalaması (<b class="red">%${ortIskOran}</b>)` +
										` , izin verilenden (<b class="blue">%${detIskOranSinir}</b>) daha fazla`
									)
								:
									`<u>İskonto Yapma</u> yetkiniz yok`
					}
				}	
			};
			
			let {iskOranKeys} = detaySinif;
			for (let i = 0; i < detaylar.length; i++) {
				let det = detaylar[i];
				if (!(det.class.promosyonmu || det.ozelIskontoVarmi)) {
					// let keys = ['kadIskOran'];
					let keys = [];
					keys.push(...iskOranKeys);
					maxOrtIskOranBelirleForKeys({ det: det, index: i, keys: keys });
					// maxOrtIskOranBelirleForKeys({ det: det, keys: detaySinif.kamOranKeys });
				}
			}
			
			let dipIskBedelOran2 = 0;
			let {topDipIskonto} = icmal;
			if (topDipIskonto)
				dipIskBedelOran2 = roundToFra(topDipIskonto * 100 / icmal.brut, 2);
			
			let yuzdeKalan = 100;
			let oranlarIcinYap = oranlar => {
				if (oranlar) {
					for (let _oran of oranlar) {
						let oran = roundToFra(_oran * yuzdeKalan / 100, 2);
						yuzdeKalan = bedel(yuzdeKalan - oran);
					}
				}
			}
			oranlarIcinYap([maxOrtIskOran, dipIskBedelOran2]);

			let ortIskOran = roundToFra(100 - yuzdeKalan, 2);
			if (satirIskOranSinir < 100 && ortIskOran > satirIskOranSinir) {
				/*if (!iskKullanilirmi) {
					(this.detaylar || []).forEach(det => {
						let proc = oranKeys => {
							(oranKeys || []).forEach(key => {
								if (!det.ozelIskontoVarmi) {
									let oran = det[key];
									if (oran)
										det[key] = oran = 0;
								}
							});
						};
						proc(det.class.iskOranKeys);
						proc(det.class.kamOranKeys);
					});
				}*/
				
				throw {
					isError: true,
					rc: iskKullanilirmi
							? 'iskOranSinirAsildi'
							: 'accessDenied',
					errorText: 
						iskKullanilirmi
							?
								(
									`İskonto Oran Toplamı (<b class="red">%${ortIskOran}</b>)` +
									` , izin verilenden (<b class="blue">%${satirIskOranSinir}</b>) daha fazla`
								)
							:
								`<u>İskonto Yapma</u> yetkiniz yok`
								
				}
			}
		}
	
		async kaydetOncesiKontrol_ozelKamOran(e) {
			let {app} = sky;
			if (!app.ozelKampanyaKullanilirmi)
				return;
			
			let {detaylar} = this;
			let detaySinif = $.isEmptyObject(detaylar) ? this.class.detaySinif : detaylar[0].class;
			let {ozelKamOranKeys} = detaySinif;
			for (let i = 0; i < detaylar.length; i++) {
				let det = detaylar[i];
				if (!det.ozelKampanyaKod)
					continue;
				
				let {ozelKampanyaIskSinir, ozelKamOranListe} = det;
				if (!ozelKampanyaIskSinir)
					await det.ozelKampanyaIskOranSinirBul(e);

				if (ozelKampanyaIskSinir >= 100)
					continue;
				
				let yuzdeKalan = 100;
				for (let j in ozelKamOranListe) {
					let _oran = ozelKamOranListe[j];
					if (_oran) {
						let oran = roundToFra(_oran * yuzdeKalan / 100, 2);
						yuzdeKalan = bedel(yuzdeKalan - oran);
					}
				}
				let ortIskOran = roundToFra(100 - yuzdeKalan, 2);
				if (ozelKampanyaIskSinir < 100 && ortIskOran > ozelKampanyaIskSinir) {
					throw {
						isError: true,
						rc: 'ozelKampanyaOranSinirAsildi',
						errorText: 
							(
								`<b>${i + 1}. satırdaki</b> kaleme ait <u>Özel Kampanya Oran Toplamı</u> (<b class="red">%${ortIskOran}</b>)` +
								` , izin verilenden (<span class="blue">%${ozelKampanyaIskSinir}</span>) daha fazla`
							)
									
					}
				}
			}
		}
		async kaydetOncesiKontrol_promosyon(e) { if (this.class.promosyonKullanilirmi) { await this.promosyonHesapla(e) } }
		kaydetOncesiKontrol_nakitUstLimit(e) {
			e = e || {};
			let {app} = sky;
			let rec = app.caches.tahsilSekliKodNo2Rec[this.tahSekliKodNo];
			if (!rec)
				return;
			
			let {tahsilTipi} = rec;
			let nakitmi = tahsilTipi == 'NK' || tahsilTipi == 'N' || tahsilTipi == 'K';
			if (!nakitmi)
				return;
			
			let {sonucBedel} = this;
			let {nakitUstLimit} = app;
			if (nakitUstLimit && sonucBedel > nakitUstLimit) {
				throw {
					isError: true, rc: 'nakitUstLimit',
					errorText: `<p><b><u>${bedelStr(sonucBedel)} TL</u></b> <i>Nakit Tahsilat</i> yapılmak istendi.</p><p><b>${bedelStr(nakitUstLimit)} TL</b> olan Nakit Üst Limit aşıldı.</p>`
				}
			}
		}
		async degistirOncesiIslemler(e) {
			await super.degistirOncesiIslemler(e); let {app} = sky, {param} = app;
			if (app.yazdirilanTahsilatDegistirilmezmi && this.yazdirildimi) { e.islem = 'izle' }
		}
		async kaydetSonrasiIslemler(e) {
			await super.kaydetSonrasiIslemler(e);
			if (this.class.siparisKontrolEdilirmi) { await this.kaydetSonrasiIslemler_bekleyenSiparis(e) }
		}
		async silmeSonrasiIslemler(e) {
			await super.silmeSonrasiIslemler(e);
			let {tahsilatRowId} = this; if (tahsilatRowId) {
				let tahFis = new CETTahsilatFis({ id: tahsilatRowId });
				if (await tahFis.yukle()) { await tahFis.silForce(); tahsilatRowId = this.tahsilatRowId = null }
			}
			if (this.class.siparisKontrolEdilirmi) { await this.kaydetSonrasiIslemler_bekleyenSiparis(e) }
		}
		async kaydetSonrasiIslemler_bekleyenSiparis(e) {
			e = e || {}; let islem = e.islem || (e.sender || {}).islem;
			let eskiFis = !asBool(e.gecicimi) && (islem == 'degistir') ? e.eskiFis : (islem == 'sil') ? this : null;
			let yeniFis = (islem == 'sil') ? null : this, siparisVioID2DusulecekMiktar = {};
			if (yeniFis) {
				let {detaylar} = yeniFis;
				for (let det of detaylar) {
					let {siparisVioID2MiktarYapi} = det;
					for (let vioID in siparisVioID2MiktarYapi) {
						vioID = asInteger(vioID); let karsilanan = siparisVioID2MiktarYapi[vioID] || 0;
						siparisVioID2DusulecekMiktar[vioID] = (siparisVioID2DusulecekMiktar[vioID] || 0) + karsilanan;
					}
				}
			}
			if (eskiFis) {
				let {detaylar} = eskiFis;
				for (let det of detaylar) {
					let {siparisVioID2MiktarYapi} = det;
					for (let vioID in siparisVioID2MiktarYapi) {
						vioID = asInteger(vioID); let karsilanan = siparisVioID2MiktarYapi[vioID] || 0;
						siparisVioID2DusulecekMiktar[vioID] = (siparisVioID2DusulecekMiktar[vioID] || 0) - karsilanan;
					}
				}
			}
			if ($.isEmptyObject(siparisVioID2DusulecekMiktar)) return;
			let {dbMgr} = this, hasTx = !!e.tx; let tx = hasTx ? e.tx : await dbMgr.getTx();
			for (let vioID in siparisVioID2DusulecekMiktar) {
				let dusulecekMiktar = siparisVioID2DusulecekMiktar[vioID];
				if (dusulecekMiktar) {
					let upd = new MQIliskiliUpdate({
						from: `data_BekleyenSiparisler`, where: [{ degerAta: vioID, saha: `vioID` }],
						set: [`kalanMiktar = kalanMiktar - ${MQSQLOrtak.sqlDegeri(dusulecekMiktar)}`]
					});
					await dbMgr.executeSql({ tx: tx, query: upd });
				}
			}
			// if (!hasTx) tx = await dbMgr.getTx()						// commit
		}
		async getSatisKosulYapilari(e) {
			e = e || {}; let result = await super.getSatisKosulYapilari(e) || {};
			let kapsam = e.kapsam = $.extend(e.kapsam || {}, { tarih: this.tarih, cari: this.mustKod }), cariEkBilgi = await this.getCariEkBilgi();
			if (cariEkBilgi != null) {
				let {tipKod, bolgeKod, kosulGrupKod} = cariEkBilgi;
				if (tipKod != null) { kapsam.cariTip = tipKod }
				if (bolgeKod != null) { kapsam.cariBolge = bolgeKod }
				if (kosulGrupKod != null) { kapsam.cariKosulGrup = kosulGrupKod }
			}
			let plasiyerKod = sky.app.defaultPlasiyerKod; if (plasiyerKod) { kapsam.plasiyer = plasiyerKod }
			$.extend(result, await CETSatisKosul.tip2KosulYapilari(e)); return result
		}
		async getPromosyonYapilari(e) {
			e = e || {}; let result = await super.getPromosyonYapilari(e) || {};
			let kapsam = e.kapsam = $.extend(e.kapsam || {}, { tarih: this.tarih, cari: this.mustKod }), cariEkBilgi = await this.getCariEkBilgi();
			if (cariEkBilgi != null) {
				let {tipKod, bolgeKod, kosulGrupKod} = cariEkBilgi;
				if (tipKod != null) kapsam.cariTip = tipKod;
				if (bolgeKod != null) kapsam.cariBolge = bolgeKod;
				if (kosulGrupKod != null) kapsam.cariKosulGrup = kosulGrupKod;
			}
			let plasiyerKod = sky.app.defaultPlasiyerKod; if (plasiyerKod) { kapsam.plasiyer = plasiyerKod }
			$.extend(result, await CETPromosyon.tip2ProYapilari(e)); return result
		}
		async getTahsilSekliAdi(e) {
			e = e || {};
			let {tahSekliKodNo} = this; if (!tahSekliKodNo) return ``;
			let result = this.tahSekliAdi;
			if (result == null) {
				let {caches} = sky.app, cache = caches.tahsilSekliKodNo2Rec = caches.tahsilSekliKodNo2Rec || {}, rec = cache[tahSekliKodNo] || {};
				result = rec.tahSekliAdi || rec.aciklama;
				if (result == null) {
					let sent = new MQSent({
						from: `${this.class.table} fis`, fromIliskiler: [{ from: `mst_TahsilSekli tsek`, iliski: `fis.tahseklikodno = tsek.kodNo` }],
						sahalar: [`fis.tahseklikodno tahSekliKodNo`, `tsek.aciklama tahSekliAdi`]
					});
					let stm = new MQStm({ sent });
					let rec = await this.dbMgr.tekilExecuteSelect({ tx: e.tx, query: stm }); result = this.tahSekliAdi = (rec || {}).tahSekliAdi
				}
			}
			return result
		}
		dokumDipSatirlar(e) {
			let {app} = sky; if (app.eIslemKullanilirmi && app.eIslemOzelDokummu && this.eIslemTip) { return this.dokumDipSatirlar_ozelEIslem(e) }
			return this.dokumDipSatirlar_normal(e)
		}
		dokumDipSatirlar_normal(e) {
			let {app} = sky, {dokumNettenmi} = app;
			let {fis} = e, etiketSize = e.bedelEtiketUzunluk + 1, veriSize = e.bedelVeriUzunluk;
			let tekCizgi = ''.padEnd(etiketSize + 2, ' ') + ''.padEnd(veriSize, '-'), ciftCizgi = ''.padEnd(etiketSize + 2, ' ') + ''.padEnd(veriSize, '=');
			this.gerekirseDipHesapla(); let {detaylar, icmal} = this, {cokluKdvmi} = icmal, {brut} = icmal;
			let {dipIskOran, dipIskBedel} = this, dipIskVarmi = dipIskOran || dipIskBedel;
			let yuruyenBakiye = brut,  toplamSatirIskBedel = 0;
			for (let det of detaylar) { if (!det.silindimi) toplamSatirIskBedel += det.toplamIskontoBedel } toplamSatirIskBedel = bedel(toplamSatirIskBedel);
			let satirlar = []; satirlar.push(ciftCizgi, 'BRÜT'.padStart(etiketSize) + ': ' + bedelStr(brut).padStart(veriSize));
			if (!dokumNettenmi && toplamSatirIskBedel) { satirlar.push('SATIR ISK.'.padStart(etiketSize) + ': ' + bedelStr(toplamSatirIskBedel).padStart(veriSize) ) }
			if (!dokumNettenmi && dipIskVarmi) {
				if (dipIskOran) {
					let oranIskBedel = bedel(brut * dipIskOran / 100); yuruyenBakiye -= oranIskBedel;
					satirlar.push(`İSKONTO %${dipIskOran.toLocaleString()}`.padStart(etiketSize) + ': ' + bedelStr(oranIskBedel).padStart(veriSize))
				}
				if (dipIskBedel) {
					yuruyenBakiye -= dipIskBedel;
					satirlar.push('İSKONTO'.padStart(etiketSize) +': ' + bedelStr(dipIskBedel).padStart(veriSize))
				}
				satirlar.push(tekCizgi);
				satirlar.push('ARA TOPLAM'.padStart(etiketSize) + ': ' + bedelStr(yuruyenBakiye).padStart(veriSize))
			}
			let {oran2MatrahVeKdv, yuvarlamaFarki} = icmal;
			for (let oran in oran2MatrahVeKdv) {
				let matrahVeKdv = oran2MatrahVeKdv[oran], matrah = asFloat(matrahVeKdv.matrah) || 0, kdv = asFloat(matrahVeKdv.kdv) || 0;
				yuruyenBakiye += kdv; let oranText = oran.toString();
				if (oran && (cokluKdvmi /* || dipIskVarmi || toplamSatirIskBedel*/)) { satirlar.push(`KDV MAT. %${oranText}`.padStart(etiketSize) + ': ' + bedelStr(matrah).padStart(veriSize)) }
				satirlar.push(`KDV %${oranText}`.padStart(etiketSize) + ': ' + bedelStr(kdv).padStart(veriSize))
			}
			if (yuvarlamaFarki) { yuruyenBakiye += yuvarlamaFarki; satirlar.push('HESAP. KDV'.padStart(etiketSize) +': ' + bedelStr(yuvarlamaFarki).padStart(veriSize)) }
			satirlar.push(ciftCizgi);
			satirlar.push('SONUÇ'.padStart(etiketSize) + ': ' + bedelStr(icmal.sonuc).padStart(veriSize) /*+ ` ${fis?.dvKod || 'TL'}`*/);
			return satirlar
		}
		dokumDipSatirlar_ozelEIslem(e) {
			let {app} = sky, {ruloParam, dokumNettenmi} = app, {fiyatIskontoGosterim, stokGosterim, kdvVar} = ruloParam;
			dokumNettenmi = dokumNettenmi || fiyatIskontoGosterim == 'NT';
			let postfix = ' TL', etiketSize = e.bedelEtiketUzunluk + 2, veriSize = e.bedelVeriUzunluk - postfix.length;
			let tekCizgi = ''.padEnd(etiketSize + 2, ' ') + ''.padEnd(veriSize, '-'), ciftCizgi = ''.padEnd(etiketSize + 2, ' ') + ''.padEnd(veriSize, '=');
			this.gerekirseDipHesapla(); let {detaylar, icmal} = this, {cokluKdvmi} = icmal, {brut} = icmal;
			let yuruyenBakiye = brut, toplamSatirIskBedel = 0; for (let det of detaylar) { if (!det.silindimi) toplamSatirIskBedel += det.toplamIskontoBedel }
			toplamSatirIskBedel = bedel(toplamSatirIskBedel);
			let satirlar = []; satirlar.push(ciftCizgi, `Brüt Tutar`.padStart(etiketSize) + ': ' + bedelStr(brut).padStart(veriSize) + postfix);
			if (!dokumNettenmi && fiyatIskontoGosterim == 'DP' && toplamSatirIskBedel) {
				satirlar.push(`Satır İsk. Toplamı`.padStart(etiketSize) + ': ' + bedelStr(toplamSatirIskBedel).padStart(veriSize) + postfix) }
			let {dipIskOran, dipIskBedel} = this, dipIskVarmi = dipIskOran || dipIskBedel;
			if (!dokumNettenmi && dipIskVarmi) {
				if (dipIskOran) {
					let oranIskBedel = bedel(brut * dipIskOran / 100); yuruyenBakiye -= oranIskBedel;
					satirlar.push(`Dip Oran İsk.(%${dipIskOran.toLocaleString()})`.padStart(etiketSize) + ': ' + bedelStr(oranIskBedel).padStart(veriSize) + postfix)
				}
				if (dipIskBedel) {
					yuruyenBakiye -= dipIskBedel;
					satirlar.push('Dip Bedel İsk.'.padStart(etiketSize) + ': ' + bedelStr(dipIskBedel).padStart(veriSize) + postfix)
				}
				satirlar.push(`Vergi Öncesi Tutar`.padStart(etiketSize) + ': ' + bedelStr(yuruyenBakiye).padStart(veriSize) + postfix);
			}
			let {oran2MatrahVeKdv, yuvarlamaFarki} = icmal;
			for (let oran in oran2MatrahVeKdv) {
				let matrahVeKdv = oran2MatrahVeKdv[oran], matrah = asFloat(matrahVeKdv.matrah) || 0, kdv = asFloat(matrahVeKdv.kdv) || 0;
				yuruyenBakiye += kdv; let oranText = oran.toString();
				if (oran && (cokluKdvmi /* || dipIskVarmi || toplamSatirIskBedel*/)) {
					satirlar.push(`Hesaplanan (%${oranText}) Matrah`.padStart(etiketSize) + ': ' + bedelStr(matrah).padStart(veriSize) + postfix)
				}
				satirlar.push(`Hesaplanan KDV(%${oranText})`.padStart(etiketSize) + ': ' + bedelStr(kdv).padStart(veriSize) + postfix)
			}
			if (yuvarlamaFarki) { yuruyenBakiye += yuvarlamaFarki; satirlar.push('Hesaplanan KDV'.padStart(etiketSize) +': ' + bedelStr(yuvarlamaFarki).padStart(veriSize)) }
			satirlar.push(`Vergiler Dahil Tutar`.padStart(etiketSize) + ': ' + bedelStr(icmal.sonuc).padStart(veriSize) + postfix);
			satirlar.push('Ödenecek Tutar'.padStart(etiketSize) + ': ' + `<BOLD>${bedelStr(icmal.sonuc).padStart(veriSize) + postfix}<NORMAL>`);
			return satirlar
		}
		async getDokumDegeriDict(e) {
			return $.extend(await super.getDokumDegeriDict(e) || {}, {
				//sevkTarih: dateToString(this.sevkTarih),
				//sevkTarihKisa: dateKisaString(this.sevkTarih),
				Dip: e => this.dokumDipSatirlar(e),
				tahsilSekliAdi: e => this.getTahsilSekliAdi(e),
				TahsilYazi: async e => {
					e = e || {}; let tahSekliAdi = await this.getTahsilSekliAdi(e); if (tahSekliAdi == null) { return null }
					return tahSekliAdi ? `${tahSekliAdi || ''} ile ${bedelStr(this.sonucBedel)} TL TAHSİL EDİLMİŞTİR` : ''
				},
				qrBilgi: async e => {
					this.gerekirseDipHesapla(); let {icmal, dvKod, tarih, seri, noYil, fisNo, efUUID} = this;
					let {satismi, iademi} = this.class, currencyID = dvKod || 'TRY', {brut, sonuc} = icmal;
					let {oran2MatrahVeKdv} = icmal, mustRec = await this.dokum_getMustRec(e), cariEFatmi = await this.getCariEFatmi(e);
					let qrData = {
						vkntckn: await this.dokum_getIsyeriVKN(e), avkntckn: mustRec.vkn, senaryo: cariEFatmi ? 'TICARIFATURA' : 'EARSIVFATURA',
						tip: satismi == iademi ? 'IADE' : 'SATIS', tarih: asReverseDateString(dateToString(tarih)), no: `${seri}${noYil}${(fisNo || 0).toString().padStart(9, '0')}`,
						ettn: efUUID, parabirimi: currencyID, malhizmettoplam: toFileStringWithFra(brut, 2), vergidahil: toFileStringWithFra(sonuc, 2), odenecek: toFileStringWithFra(sonuc, 2)
					};
					for (let oran in oran2MatrahVeKdv) {
						let matrahVeKdv = oran2MatrahVeKdv[oran], matrah = asFloat(matrahVeKdv.matrah) || 0, kdv = asFloat(matrahVeKdv.kdv) || 0;
						qrData[`kdvmatrah(${oran})`] = toFileStringWithFra(matrah, 2); qrData[`hesaplanankdv(${oran})`] = toFileStringWithFra(kdv, 2)
					}
					return toJSONStr(qrData)
					/*let qrData = {
						vkntckn: app.params.isyeri.vknTckn, avkntckn: baslik.aliciBilgi.vknTckn, senaryo: baslik._profileID, tip: baslik._belgeTipKod,
						tarih: asReverseDateString(baslik.tarih), no: baslik.fisnox, ettn: baslik.uuid, parabirimi: this.currencyID,
						malhizmettoplam: toFileStringWithFra(icmal.brutBedelYapi[bedelSelector], 2), vergidahil: toFileStringWithFra(icmal.vergiDahilToplamYapi[bedelSelector], 2),
						odenecek: toFileStringWithFra(icmal.sonucBedelYapi[bedelSelector], 2)
					};
					for (let oran in kdvOran2MatrahVeBedel) {
						let {matrah, bedel} = kdvOran2MatrahVeBedel[oran];
						qrData[`kdvmatrah(${oran})`] = toFileStringWithFra(matrah, 2);
						qrData[`hesaplanankdv(${oran})`] = toFileStringWithFra(bedel || 0, 2)
					}*/
				}
			})
		}
	};

	window.CETSevkiyatFis = class extends window.CETTicariFis {
		static get sevkiyatmi() { return true }
		static get noYilDesteklermi() { return true }
		static get sonStoktanSecimYapilirmi() { return true }
		static get sonStokKontrolEdilirmi() { return sky.app.sonStokKontrolEdilirmi && this.fiiliCikismi }
		static get sonStokEtkilenirmi() { return true }
		/*static get promosyonKullanilirmi() { return this.satismi && !this.iademi }*/
		static get eIslemKullanilirmi() { return true }
		static get rafKullanilirmi() { return true }
		// static get ayrimTipiKullanilirmi() { return this.fiiliCikismi }
		static get siparisKontrolEdilirmi() { return !this.iademi && sky.app[this.fiiliCikismi ? 'depoSevkiyatSiparisKontrolEdilirmi' : 'depoMalKabulSiparisKontrolEdilirmi'] }
		static get siparisMiktarKontrolEdilirmi() { return !this.iademi && sky.app[this.fiiliCikismi ? 'depoSevkiyatSiparisMiktariKontrolEdilirmi' : 'depoMalKabulSiparisMiktariKontrolEdilirmi'] }
		static get siparisRefKontrolEdilirmi() { return sky.app.depoSiparisRefKontrolEdilirmi }
		static get depoSevkiyatSiparisKarsilamaOdemeGunTekmi() { return sky.app.depoSevkiyatSiparisKarsilamaOdemeGunTekmi }
		get hesaplanmisBakiyeArtisi() {
			if (!(this.class.faturami || (this.class.irsaliyemi && sky.app.irsaliyeBakiyeyiEtkilermi))) { return super.hesaplanmisBakiyeArtisi }
			let result = this.tahsilatDusulmusBedel;
			if (this.ihracKayitlimi) { this.gerekirseDipHesapla(); result -= bedel(this.icmal.topKdv || 0) }
			if (!this.class.fiiliCikismi) { result = -result }
			return result
		}
		get hesaplanmisSiparisVioID2MiktarBilgileri() {
			let result = {}, katSayi = this.class.fiiliCikismi ? -1 : 1, {detaylar} = this;
			for (let det of detaylar) {
				if (!det.class.promosyonmu) {
					let {siparisVioID} = det;
					if (siparisVioID)
						result[siparisVioID] = (result[siparisVioID] || 0) + (det.miktar * katSayi)
				}
			}
			return result
		}
		kaydetOncesiKontrol_fiyat(e) {
			super.kaydetOncesiKontrol_fiyat(e); if (!this.class.fiiliCikismi) { return }
			/*let {detaylar} = this; if (detaylar.find(det => !(det.class.promosyonmu || det.fiyat))) { throw { isError: true, errorText: 'Fiyatsız ürün satışı yapılamaz' } }*/
		}
		static getOzelForm_eIslem(e) {
			let {tip} = e, width = 47, sayfaWidth = width + 1, dipUzunluk = { etiket: 36, veri: 12 };
			return new CETMatbuuForm({
				tip: tip,
				formBilgi: {
					darDokummu: false, kolonBaslikGosterilirmi: true, nakilYapilirmi: false, dipYazdirilirmi: true,
					tekDetaySatirSayisi: 2, sayfaBoyutlari: { x: sayfaWidth, y: 0 }, otoYBasiSonu: { sonu: 0 },
					bedelEtiketUzunluk: dipUzunluk.etiket, bedelVeriUzunluk: dipUzunluk.veri
				},
				dipPos: { x: sayfaWidth - (dipUzunluk.etiket + dipUzunluk.veri + 2), y: 0 },
				digerSahalar: {
					Dip: { pos: { x: 1 }, genislik: width }, TahsilYazi: { pos: { x: 0 }, genislik: width },
					Miktar: { pos: { x: 1 }, genislik: width }, Bakiye: { pos: { x: 1 }, genislik: width },
					Yalniz: { pos: { x: 1 }, genislik: width }, Notlar: { pos: { x: 1 }, genislik: width }
				},
				normalSahalar: { Aciklama: {}, Detay: {} }
			})
		}
		static async matbuuFormDuzenleRuntime_eIslem(e) {
			let {app} = sky, {ruloParam, ruloEkNotlar, dokumNettenmi} = app, {fiyatIskontoGosterim, stokGosterim, kdvVar} = ruloParam;
			dokumNettenmi = dokumNettenmi || fiyatIskontoGosterim == 'NT';
			let {matbuuForm, tip, fis} = e, {formBilgi, normalSahalar, digerSahalar} = matbuuForm, {sayfaBoyutlari, otoYBasiSonu, bedelEtiketUzunluk, bedelVeriUzunluk} = formBilgi;
			let {eIslemTip} = fis, {pifTipi} = fis.class, width = sayfaBoyutlari.x - 1, boslukAttrLength = 1, spacer = () => ' '.repeat(boslukAttrLength++);
			let ekNotlarDigerKeys = ['eIslemGenel', 'tumGenel']; let ekNotlarKey, ekNotlar, ekNotlarListe = [];
			switch (eIslemTip) {
				case 'E': ekNotlarKey = 'eFatura'; break; case 'A': ekNotlarKey = 'eArsiv'; break;
				case 'IR': ekNotlarKey = 'eIrsaliye'; break; case 'BL': ekNotlarKey = 'eBelge'; break
			}
			if (ekNotlarKey && !$.isEmptyObject(ekNotlar = ruloEkNotlar[ekNotlarKey])) ekNotlarListe.push(...ekNotlar)
			if (fis.yildizlimi && !$.isEmptyObject(ekNotlar = ruloEkNotlar[ekNotlarKey = 'isaretli'])) ekNotlarListe.push(...ekNotlar)
			for (let ekNotlarKey of ekNotlarDigerKeys) {
				let items = ruloEkNotlar[ekNotlarKey];
				if (!$.isEmptyObject(items)) { ekNotlarListe.push(...items) }
			}
			let y = 1, sahalar = [];
			if (!$.isEmptyObject(ekNotlarListe)) {
				let isFullRow = false, _ekNotlarListe = ekNotlarListe; ekNotlarListe = [];
				if (_ekNotlarListe.find(x => x[0] == '!')) { isFullRow = true; _ekNotlarListe = [_ekNotlarListe.join('')] }
				for (let text of _ekNotlarListe) {
					if (text == null) continue; text = text || ' '; let lines = text[0] == '!' ? [text.substring(1)] : text.split('\n');
					for (let line of lines) {
						text = line.padEnd(); if (!(text && text[0] == '^')) continue; text = text.substring(1);
						if (isFullRow || text.length <= width) { ekNotlarListe.push(text); continue }
						while (text.length) {
							let part = text.substr(0, width); if (!part) { break }
							ekNotlarListe.push(part); text = text.substring(part.length)
						}
					}
				}
				sahalar.push({ pos: { x: 1, y: 0 }, genislik: width, attr: spacer() });
				for (let satir of ekNotlarListe) {
					if (!satir) { continue }
					sahalar.push({ pos: { x: 1, y: y++ }, genislik: width, attr: satir })
				}
			}
			sahalar.push({ pos: { x: 1, y: y++ }, /* <LOGO> <LOGO2> */ attr: '<CENTER><LOGO2><CENTER><BOLD><BIG>[efBelgeTipi]<MEDIUM1>' });
			/* if (eIslemTip == 'A') sahalar.push({ pos: { x: 1, y: y++ }, attr: '<CENTER><LOGO2><LEFT>' }) */
			sahalar.push({ pos: { x: 1, y: y++ }, genislik: width, attr: '<NORMAL><LEFT>[isyeri_unvan1]' });
			if (await fis.dokumSahaDegeri({ attr: 'isyeri_unvan2' })) sahalar.push({ pos: { x: 1, y: y++ }, genislik: width, attr: '[isyeri_unvan2]' })
			if (await fis.dokumSahaDegeri({ attr: 'isyeri_adres1' })) sahalar.push({ pos: { x: 1, y: y++ }, genislik: width, attr: '[isyeri_adres1]' })
			if (await fis.dokumSahaDegeri({ attr: 'isyeri_adres2' })) sahalar.push({ pos: { x: 1, y: y++ }, genislik: width, attr: '[isyeri_adres2]' })
			let yoreVarmi = await fis.dokumSahaDegeri({ attr: 'isyeri_yore' }), ilVarmi = await fis.dokumSahaDegeri({ attr: 'isyeri_il' });
			if (yoreVarmi || ilVarmi) {
				let expListe = []; if (yoreVarmi) expListe.push('[isyeri_yore]'); if (ilVarmi) expListe.push('[isyeri_il]')
				sahalar.push({ pos: { x: 1, y: y++ }, genislik: width, attr: expListe.join(` / `) })
			}
			sahalar.push({ pos: { x: 1, y: y++ }, genislik: width, attr: 'Vergi Daire ve No: [isyeriVergiDaireVeVKN]' });
			if (await fis.dokumSahaDegeri({ attr: 'isyeri_tel1' })) sahalar.push({ pos: { x: 1, y: y++ }, genislik: width, attr: `Telefon: [isyeri_tel1]` });
			if (await fis.dokumSahaDegeri({ attr: 'isyeri_email' })) sahalar.push({ pos: { x: 1, y: y++ }, genislik: width, attr: `e-Posta: [isyeri_email]` });
			sahalar.push({ pos: { x: 1, y: y++ }, genislik: width, attr: '<LINE0>' });
			y++;
			sahalar.push({ pos: { x: 1, y: y++ }, genislik: width, attr: 'SAYIN <BOLD>[musteriUnvan1],<NORMAL>' });
			if (await fis.dokumSahaDegeri({ attr: 'musteriUnvan2' })) sahalar.push({ pos: { x: 1, y: y++ }, genislik: width, attr: '<BOLD>[musteriUnvan2]<NORMAL>' })
			if (await fis.dokumSahaDegeri({ attr: 'musteriAdres1' })) sahalar.push({ pos: { x: 1, y: y++ }, genislik: width, attr: '[musteriAdres1]' })
			if (await fis.dokumSahaDegeri({ attr: 'musteriAdres2' })) sahalar.push({ pos: { x: 1, y: y++ }, genislik: width, attr: '[musteriAdres2]' })
			yoreVarmi = await fis.dokumSahaDegeri({ attr: 'musteriYore' }); ilVarmi = await fis.dokumSahaDegeri({ attr: 'musteriIl' });
			if (yoreVarmi || ilVarmi) sahalar.push({ pos: { x: 1, y: y++ }, genislik: width, attr: '[musteriYoreVeIl]' })
			sahalar.push({ pos: { x: 1, y: y++ }, genislik: width, attr: 'Vergi Daire ve No: [musteriVergiDaireVeVKN]' });
			if (await fis.dokumSahaDegeri({ attr: 'musteriTel' })) sahalar.push({ pos: { x: 1, y: y++ }, genislik: width, attr: `Telefon: [musteriTel]` });
			if (await fis.dokumSahaDegeri({ attr: 'musteriEMail' })) sahalar.push({ pos: { x: 1, y: y++ }, genislik: width, attr: `e-Posta: [musteriEMail]` });
			sahalar.push({ pos: { x: 1, y: y++ }, genislik: width, attr: '<LINE0> ' });
			y++;
			sahalar.push({ pos: { x: 1, y: y++ }, genislik: width, attr: 'Özelleştirme No: <BOLD>TR1.2<NORMAL>' });
			sahalar.push({ pos: { x: 1, y: y++ }, genislik: width, attr: '        Senaryo: <BOLD>[efSenaryoTipi]<NORMAL>' });
			sahalar.push({ pos: { x: 1, y: y++ }, genislik: width, attr: '    Fatura Tipi: <BOLD>[efFaturaTipi]<NORMAL>' });
			sahalar.push({ pos: { x: 1, y: y++ }, genislik: width, attr: '      Fatura No: <BOLD>[efatNoStr]<NORMAL>' });
			sahalar.push({ pos: { x: 1, y: y++ }, genislik: width, attr: '  Fatura Tarihi: <BOLD>[tarih]<NORMAL>' });
			sahalar.push({ pos: { x: 1, y: y++ }, genislik: width, attr: 'Düzenleme Saati: <BOLD>[sevkSaat]<NORMAL>' });
			if (await fis.dokumSahaDegeri({ attr: 'plasiyerText' })) sahalar.push({ pos: { x: 1, y: y++ }, genislik: width, attr: '       Plasiyer: <BOLD>[plasiyerText]<NORMAL>' })
			if (await fis.dokumSahaDegeri({ attr: 'tahsilSekliAdi' })) sahalar.push({ pos: { x: 1, y: y++ }, genislik: width, attr: '   Tahsil Şekli: <BOLD>[tahsilSekliAdi]<NORMAL>' })
			y++;
			if (await fis.dokumSahaDegeri({ attr: 'efUUID' })) sahalar.push({ pos: { x: 1, y: y++ }, genislik: width, attr: 'ETTN: <BOLD>[efUUID]<NORMAL>' })
			y += 2;
			for (let i in sahalar) { let saha = new CETMatbuuSaha_Aciklama(sahalar[i]); if (saha) normalSahalar.Aciklama[saha.attr] = saha }
			otoYBasiSonu.basi = y; sahalar = [];
			let x = 0, genislik = 0;
			// sahalar.push({ attr: 'stokKod', pos: { x: (x += genislik + 1), y: 1 }, genislik: (genislik = 10) });
			if (stokGosterim == 'AB')
				sahalar.push({ attr: 'barkod', pos: { x: (x += genislik + 1), y: 1 }, genislik: (genislik = 13) })
			sahalar.push({ attr: 'stokAdi', pos: { x: (x += genislik + 1), y: 1 }, genislik: (genislik = 33 - genislik) });
			sahalar.push({ attr: 'miktar', pos: { x: (x += genislik + 1), y: 1 }, genislik: (genislik = 9), alignment: 'r', tip: 'miktar' });
			sahalar.push({ attr: 'brm', pos: { x: (x += genislik + 1), y: 1 }, genislik: (genislik = 4) });
			x = 1; genislik = 0;
			sahalar.push({ attr: (dokumNettenmi ? 'netFiyat' : 'fiyat'), pos: { x: (x += genislik + 1), y: 2 }, genislik: (genislik = 13), alignment: 'r', tip: 'fiyat' });
			if (kdvVar) sahalar.push({ attr: 'kdvOraniText', pos: { x: (x += genislik + 1), y: 2 }, genislik: (genislik = 4), alignment: 'r' });
			sahalar.push({ attr: 'kdvBedel', pos: { x: (x += genislik + 1), y: 2 }, genislik: (genislik = 10), alignment: 'r', ozelDonusum: e => bedelStr(e.value) });
			if (!dokumNettenmi) {
				sahalar.push({ attr: 'iskOranlariText', pos: { x: (x += genislik + 1), y: 2 }, genislik: (genislik = 9) });
				sahalar.push({ attr: 'toplamIskontoBedel', pos: { x: (x += genislik + 1), y: 2 }, genislik: (genislik = 12) })
			}
			sahalar.push({
				attr: (dokumNettenmi ? 'netBedel' : 'brutBedel'), alignment: 'r', tip: 'bedel',
				pos: { x: width - (bedelVeriUzunluk + 1), y: 2 }, genislik: (genislik = bedelVeriUzunluk)
			});
			for (let i in sahalar) { let saha = new CETMatbuuSaha_Detay(sahalar[i]); if (saha) normalSahalar.Detay[saha.attr] = saha }
			sahalar = []; let eIslDipYazi = pifTipi == 'I' ? '' : 'İrsaliye Yerine Geçer';
			if (eIslDipYazi) {
				sahalar.push({ pos: { x: 1, y: 0 }, genislik: width, attr: spacer() });
				sahalar.push({ pos: { x: 1, y: 0 }, genislik: width, attr: eIslDipYazi })
			}
			ekNotlarListe = []; if (ekNotlarKey && !$.isEmptyObject(ekNotlar = ruloEkNotlar[ekNotlarKey])) { ekNotlarListe.push(...ekNotlar) }
			if (fis.yildizlimi && !$.isEmptyObject(ekNotlar = ruloEkNotlar[ekNotlarKey = 'isaretli'])) { ekNotlarListe.push(...ekNotlar) }
			for (let ekNotlarKey of ekNotlarDigerKeys) {
				let items = ruloEkNotlar[ekNotlarKey];
				if (!$.isEmptyObject(items)) { ekNotlarListe.push(...items) }
			}
			if (!$.isEmptyObject(ekNotlarListe)) {
				let isFullRow = false, _ekNotlarListe = ekNotlarListe; ekNotlarListe = [];
				if (_ekNotlarListe.find(x => x[0] == '!')) { isFullRow = true; _ekNotlarListe = [_ekNotlarListe.join('')] }
				for (let text of _ekNotlarListe) {
					if (!text) continue; let lines = text[0] == '!' ? [text.substring(1)] : text.split('\n');
					for (let line of lines) {
						text = line.padEnd(); if (!text || text[0] == '^') continue
						if (isFullRow || text.length <= width) { ekNotlarListe.push(text); continue }
						while (text.length) { let part = text.substr(0, width); if (!part) break; ekNotlarListe.push(part); text = text.substring(part.length) }
					}
				}
				sahalar.push({ pos: { x: 1, y: 0 }, genislik: width, attr: spacer() });
				for (let satir of ekNotlarListe) {
					if (!satir) { continue }
					sahalar.push({ pos: { x: 1, y: 0 }, genislik: width, attr: satir })
				}
			}
			for (let i in sahalar) {
				let saha = new CETMatbuuSaha_OtoAciklama(sahalar[i]);
				if (saha) { digerSahalar[saha.attr] = saha }
			}
			return true
		}
	};


	window.CETFaturaFis = class extends window.CETSevkiyatFis {
		static get pifTipi() { return 'F' } static get faturami() { return true }
		get matbuuFormTip() {
			let {app} = sky, {yildizlimi} = this;
			if (!yildizlimi && app.eIslemKullanilirmi && this.eIslemTip) { return app.eIslemOzelDokummu ? 'e-Islem-Ozel' : 'e-Islem' }
			return 'Fatura'
		}
		async eIslemTipDegeriFor(e) {
			// if (this.class.alimmi || this.class.iademi)
			if (this.class.alimmi != this.class.iademi) { return '' }
			return await super.eIslemTipDegeriFor(e)
		}

		hostVars(e) {
			e = e || {}; let {app} = sky;
			if (!app.eIslemKullanilirmi) {
				let eBelgeAltSinir = (app.eBelgeAltSinir || 0);
				this.eIslemTip = !eBelgeAltSinir || (this.sonucBedel || 0) > eBelgeAltSinir ? 'BL' : '';
				let {uuid} = this; if (!uuid) this.uuid = newGUID()
			}
			let hv = super.hostVars();
			$.extend(hv, {
				nakseklikod: this.nakSekliKod || '', tahseklikodno: asInteger(this.tahSekliKodNo) || 0,
				dipiskoran: roundToFra(this.dipIskOran, 2) || 0, dipiskbedel: bedel(this.dipIskBedel) || 0
			});
			let {icmal} = this; if (icmal) $.extend(hv, icmal.hostVars(e))
			return hv;
		}
		async yeniTanimOncesiIslemler(e) {
				// Artık e-Belge kesilebilecek
			/*if (!sky.app.eIslemKullanilirmi) {
				let cariEFatmi = await this.getCariEFatmi(e);
				if (cariEFatmi) {
					let cariEkBilgi = await this.getCariEkBilgi(e) || {};
					let unvan = cariEkBilgi.unvan || '';
					throw {
						isError: true,
						rc: 'cariEFat',
						errorText: `<p><b>${this.mustKod}-${unvan}</b> carisi <u>e-Fatura mükellefi olduğu</u> için bu müşteriye Fatura kesilemez!</p><p class="dark">Sadece <b>İrsaliye</b> kesilebilir.</p>`
					}
				}
			}*/
			return await super.yeniTanimOncesiIslemler(e)
		}
	};

	window.CETSatisFaturaFis = class extends window.CETFaturaFis {
		static get almSat() { return 'T' }
		static get numaratorTip() { return 'TF' }
	};

	window.CETAlimFaturaFis = class extends window.CETFaturaFis {
		static get almSat() { return 'A' }
		static get numaratorTip() { return null }
	};

	window.CETSatisIadeFaturaFis = class extends window.CETAlimFaturaFis {
		static get iademi() { return true }
		static get almSat() { return 'T' }
	};

	window.CETAlimIadeFaturaFis = class extends window.CETSatisFaturaFis {
		static get iademi() { return true }
		static get almSat() { return 'A' }
	};


	window.CETIrsaliyeFis = class extends window.CETSevkiyatFis {
		static get pifTipi() { return 'I' } static get irsaliyemi() { return true }
		get matbuuFormTip() {
			let {app} = sky;
			if (app.eIslemKullanilirmi && this.eIslemTip) {
				if (app.eIrsaliyeKullanilirmi) {
					let key = 'e-Irsaliye';
					let tip2MatbuuForm = ((app._matbuuFormYapilari || {}).tip2MatbuuForm || {});
					if (!tip2MatbuuForm || tip2MatbuuForm[key])
						return key
				}
				return (app.eIslemOzelDokummu ? 'e-Islem-Ozel' : 'e-Islem')
			}
			return 'Irsaliye'
		}
		
		async eIslemTipDegeriFor(e) {
			if (this.class.alimmi != this.class.iademi) { return '' }
			let {app} = sky; return app.eIslemKullanilirmi && app.eIrsaliyeKullanilirmi ? 'IR' : ''
		}

		async yeniTanimOncesiIslemler(e) {
			e = e || {};
			await super.yeniTanimOncesiIslemler(e);

			/*let cariEFatmi = await this.getCariEFatmi(e);
			if (this.eIslemTip && !cariEFatmi) {
				let cariEkBilgi = await this.getCariEkBilgi(e) || {};
				let unvan = cariEkBilgi.unvan || '';
				throw {
					isError: true,
					rc: 'cariEFatDegil',
					errorText: `(<b>${this.mustKod}-${unvan}</b>) carisi e-Fatura/e-İrsaliye mükellefi olmadığı için e-İrsaliye kesilemez`
				}
			}*/
		}

		async getDokumDegeriDict(e) {
			return $.extend(await super.getDokumDegeriDict(e) || {}, {
				efSenaryoTipi: 'EIRSALIYE'
			})
		}
	};

	window.CETSatisIrsaliyeFis = class extends window.CETIrsaliyeFis {
		static get almSat() { return 'T' }
		static get numaratorTip() { return 'TI' }
	};

	window.CETAlimIrsaliyeFis = class extends window.CETIrsaliyeFis {
		static get almSat() { return 'A' }
		static get numaratorTip() { return null }
	};

	window.CETSatisIadeIrsaliyeFis = class extends window.CETAlimIrsaliyeFis {
		static get iademi() { return true }
		static get almSat() { return 'T' }
	};

	window.CETAlimIadeIrsaliyeFis = class extends window.CETSatisIrsaliyeFis {
		static get iademi() { return true }
		static get almSat() { return 'A' }
	};


	window.CETSiparisFis = class extends window.CETTicariFis {
		static get pifTipi() { return 'S' }
		get matbuuFormTip() { return 'Siparis' }
		
		static get sevkTarihEtiket() { return 'Teslim' };
		static get sonStoktanSecimYapilirmi() { return true }
		static get sonStokKontrolEdilirmi() { return sky.app.sonStokKontrolEdilirmi_siparis && this.fiiliCikismi }
		static get sonStokEtkilenirmi() { return sky.app.param.bakiyeyeEtkilenirmi }
		
		get hesaplanmisBakiyeArtisi() {
			if (!sky.app.param.bakiyeyeEtkilenirmi)
				return 0;
			
			let result = this.tahsilatDusulmusBedel;			
			if (!this.class.fiiliCikismi)
				result = -result;
			
			return result;
		}
	};

	window.CETSatisSiparisFis = class extends window.CETSiparisFis {
		static get almSat() { return 'T' }
		static get numaratorTip() { return 'TS' }
	};

	window.CETAlimSiparisFis = class extends window.CETSiparisFis {
		static get almSat() { return 'A' }
		static get numaratorTip() { return 'AS' }
	};
})()
