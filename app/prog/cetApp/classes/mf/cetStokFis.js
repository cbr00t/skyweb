(function() {
	window.CETStokFis = class extends window.CETStokTicariFis {
		static get detaySinif() { return CETStokDetay } static get stokmu() { return true } static get fiiliCikismi() { return (this.alimmi == this.iademi) }
		static get musteriKullanilirmi() { return false } static get rafKullanilirmi() { return true } static get bedelKullanilirmi() { return false }
		get matbuuFormTip() { return 'Sevkiyat' }
		get sonucBedel() { this.gerekirseDipHesapla(); return bedel(this.toplamBedel) }
		constructor(e) { e = e || {}; super(e) }
		static varsayilanKeyHostVars(e) { return $.extend(super.varsayilanKeyHostVars(), { fistipi: this.adimTipi || '' }); }
		hostVars(e) {
			e = e || {}; const toplamBedel = bedel(this.toplamBedel) || 0;
			let hv = super.hostVars(); hv.brut = hv.ciro = hv.net = toplamBedel; return hv
		}
		async setValues(e) { e = e || {}; await super.setValues(e); const {rec} = e; this.toplamBedel = bedel(rec.net) || 0 }
		gerekirseDipHesapla(e) { if (!this.hesaplandimi) { this.dipHesapla(e) } }
		dipHesapla(e) { this.toplamBedel = 0; for (const det of this.detaylar) { this.toplamBedel += bedel(det.netBedel) || 0 } this.hesaplandimi = true }
		async kaydetOncesiKontrol(e) { await super.kaydetOncesiKontrol(e) }
		async getDokumDegeriDict(e) {
			return $.extend(await super.getDokumDegeriDict(e) || {}, {
				subeKod: this.subeKod, refSubeKod: this.refSubeKod,
				subeAdi: e => sky.app.caches?.subeKod2Rec?.[this.subeKod]?.aciklama ?? '',
				refSubeAdi: e => sky.app.caches?.subeKod2Rec?.[this.refSubeKod]?.aciklama ?? '',
				Dip(e) {
					const etiketSize = e.bedelEtiketUzunluk;
					const veriSize = e.bedelVeriUzunluk + 1;
					const tekCizgi = ''.padEnd(etiketSize + 2, ' ') + ''.padEnd(veriSize, '-');
					const ciftCizgi = ''.padEnd(etiketSize + 2, ' ') + ''.padEnd(veriSize, '=');
					/*const tekCizgi = ''.padEnd(etiketSize + veriSize + 2, '-');
					const ciftCizgi = ''.padEnd(etiketSize + veriSize + 2, '=');*/

					this.gerekirseDipHesapla();

					let satirlar = [];
					satirlar.push(ciftCizgi);
					satirlar.push(
						` TOPLAM`.padEnd(etiketSize) + `: ` +
						`${bedelStr(this.toplamBedel)}`.padStart(veriSize)
					);
					
					return satirlar;
				}
			})
		}
	}
	window.CETSayimFis = class extends window.CETStokFis {
		static get aciklama() { return 'Sayım' } static get numaratorTip() { return `SY` } static get fiiliCikismi() { return false }
		static get alimmi() { return true } static get sonStokEtkilenirmi() { return true }
		async initBaslikUI_ara(e) {
			await super.initBaslikUI_ara(e); const {parentPart, layout} = e, {param} = parentPart, userSettings = param.userSettings = param.userSettings || {};
			const sonDegerler = userSettings.sonDegerler = userSettings.sonDegerler || {}; let savedParentWidth;
			if (true) {
				let kod = this.yerKod, sonDeger = sonDegerler.yerKod;
				const divSaha = layout.find(`#yerKod`), sahaContainer = divSaha.parents(`.parent`), divEtiket = sahaContainer.find(`.etiket`);
				let part = new CETMstComboBoxPart({
					parentPart, content: divSaha, placeHolder: `${this.class.fiiliCikismi ? 'Çıkış' : 'Giriş'} Yeri`, listeSinif: CETKAListePart, table: 'mst_Yer',
					idSaha: 'kod', adiSaha: 'aciklama', selectedId: kod || sonDeger,
					widgetDuzenleyici: e => {
						savedParentWidth = e.widgetArgs.width = savedParentWidth || (e.widgetArgs.width - (divEtiket.width() ||  0) );
						e.widgetArgs.dropDownWidth = e.widgetArgs.width;
					},
					events: {
						comboBox_stmDuzenleyici: e => {
							const defaultSubeKod = sky.app.defaultSubeKod;
							if (defaultSubeKod != null) { e.stm.sentDo(sent => sent.where.degerAta(defaultSubeKod, `mst.subeKod`)); }
						},
						liste_stmDuzenleyici: e => {
							const defaultSubeKod = sky.app.defaultSubeKod;
							if (defaultSubeKod != null) { e.stm.sentDo(sent =>sent.where.degerAta(defaultSubeKod, `mst.subeKod`)); }
						},
						comboBox_itemSelected: e => {
							kod = this.yerKod = (e.rec || {}).kod || e.value || sky.app.defaultYerKod || '';
							if (sonDeger != kod) {
								sonDeger = sonDegerler.yerKod = kod; parentPart.paramDegistimi = true;
								if (parentPart.listeReadyFlag) {
									const {detaylar} = this; let degistimi = false;
									for (const det of detaylar) {
										det.cacheReset(); det.detYerKodReset();
										det.ekOzelliklerDo({
											callback: _e => {
												const ekOzellik = _e.item;
												if ((ekOzellik.tip == 'raf' || ekOzellik.tip == 'refRaf') && ekOzellik.value) { ekOzellik.value = ''; degistimi = true }
											}
										})
									}
									if (degistimi && parentPart && parentPart.tazele) { parentPart.tazele() }
								}
							}
						}
					}
				});
				sahaContainer.removeClass(`jqx-hidden`); await part.run()
			}
		}
		async onKontrol(e) {
			e = e || {}; if (!this.yerKod) { return this.error_onKontrol(`(Depo) belirtilmelidir`, 'emptyValue') }
			/*let result = sky.app.caches.yerKod2Rec[this.yerKod];
			if (result == null) { result = parseInt(await this.dbMgr.tekilDegerExecuteSelect({ tx: e.tx, query: `SELECT COUNT(*) sayi FROM mst_Yer WHERE kod = ?`, params: [this.yerKod] })) }
			if (!result) { return this.error_onKontrol(`(${this.yerKod} kodlu Depo) hatalıdır`, 'invalidValue') }*/
			return await super.onKontrol(e)
		}
		async sonStokDuzenle(e) { const _e = $.extend({}, e, { dogrudanMiktarAlinirmi: true }); return await super.sonStokDuzenle(e) }
	}
	window.CETTransferFis = class extends window.CETStokFis {
		static get sonStokKontrolEdilirmi() { return false } static get sonStokEtkilenirmi() { return false } static get refRafKullanilirmi() { return true }
	}
	window.CETDepoTransferFis = class extends window.CETTransferFis {
		static get numaratorTip() { return 'TR' } static get aciklama() { return 'Depo Transfer' }
		static get sonStokKontrolEdilirmi() { return sky.app.sonStokKontrolEdilirmi && this.fiiliCikismi } static get sonStokEtkilenirmi() { return true }
		constructor(e) { e = e || {}; super(e); this.refYerKod = e.refYerKod || '' }
		hostVars(e) { e = e || {}; let hv = super.hostVars(); hv.refyerkod = this.refYerKod || ''; return hv }
		async setValues(e) { e = e || {}; await super.setValues(e); const {rec} = e; this.refYerKod = rec.refyerkod || '' }
		async initBaslikUI_ara(e) {
			await super.initBaslikUI_ara(e);
			const parentPart = e.parentPart;
			const param = parentPart.param;
			const userSettings = param.userSettings = param.userSettings || {};
			const sonDegerler = userSettings.sonDegerler = userSettings.sonDegerler || {};

			const layout = e.layout;
			let savedParentWidth;
			if (true) {
				let kod = this.yerKod;
				let sonDeger = sonDegerler.yerKod;

				const divSaha = layout.find(`#yerKod`);
				const sahaContainer = divSaha.parents(`.parent`);
				const divEtiket = sahaContainer.find(`.etiket`);
				let part = new CETMstComboBoxPart({
					parentPart: parentPart,
					content: divSaha,
					// layout: layout.find('.hizliStok'),
					placeHolder: `${this.class.fiiliCikismi ? 'Çıkış' : 'Giriş'} Yeri`,
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
							const defaultSubeKod = sky.app.defaultSubeKod;
							if (defaultSubeKod != null) {
								e.stm.sentDo(sent =>
									sent.where.degerAta(defaultSubeKod, `mst.subeKod`));
							}
						},
						liste_stmDuzenleyici: e => {
							const defaultSubeKod = sky.app.defaultSubeKod;
							if (defaultSubeKod != null) {
								e.stm.sentDo(sent =>
									sent.where.degerAta(defaultSubeKod, `mst.subeKod`))
							}
						},
						comboBox_itemSelected: e => {
							kod = this.yerKod = (e.rec || {}).kod || e.value || sky.app.defaultYerKod || '';
							if (sonDeger != kod) {
								sonDeger = sonDegerler.yerKod = kod;
								parentPart.paramDegistimi = true;
								if (parentPart.listeReadyFlag) {
									let {detaylar} = this, degistimi = false;
									for (let det of detaylar) {
										det.detYerKodReset(); det.cacheReset();
										/*det.ekOzelliklerDo({    // rafKod, refRafKod  sıfırlamaya sebep oluyor - dikkat!
											callback: _e => {
												const ekOzellik = _e.item;
												if ((ekOzellik.tip == 'raf' || ekOzellik.tip == 'refRaf') && ekOzellik.value) {
													ekOzellik.value = '';
													degistimi = true;
												}
											}
										})*/
									}
									/* if (degistimi) { parentPart?.tazele?.() } */
								}
							}
						}
					}
				});
				sahaContainer.removeClass(`jqx-hidden`);
				await part.run();
			}
			
			if (true) {
				let kod = this.refYerKod;
				let sonDeger = sonDegerler.refYerKod;
				const divSaha = layout.find(`#refYerKod`);
				const sahaContainer = divSaha.parents(`.parent`);
				const divEtiket = sahaContainer.find(`.etiket`);
				let part = new CETMstComboBoxPart({
					parentPart: parentPart,
					content: divSaha,
					// layout: layout.find('.hizliStok'),
					placeHolder: `Giriş Yeri`,
					listeSinif: CETKAListePart, table: 'mst_Yer',
					idSaha: 'kod', adiSaha: 'aciklama',
					selectedId: kod /* || sonDeger */,
					widgetDuzenleyici: e => {
						savedParentWidth = e.widgetArgs.width = savedParentWidth || (
							e.widgetArgs.width - (divEtiket.width() ||  0) );
						e.widgetArgs.dropDownWidth = e.widgetArgs.width;
					},
					events: {
						comboBox_stmDuzenleyici: e => {
							const defaultSubeKod = sky.app.defaultSubeKod;
							if (defaultSubeKod != null) {
								e.stm.sentDo(sent =>
									sent.where.degerAta(defaultSubeKod, `mst.subeKod`));
							}
						},
						liste_stmDuzenleyici: e => {
							const defaultSubeKod = sky.app.defaultSubeKod;
							if (defaultSubeKod != null) {
								e.stm.sentDo(sent =>
									sent.where.degerAta(defaultSubeKod, `mst.subeKod`));
							}
						},
						comboBox_itemSelected: e => {
							kod = this.refYerKod = (e.rec || {}).kod || e.value || '';
							if (sonDeger != kod) {
								sonDeger = sonDegerler.refYerKod = kod;
								parentPart.paramDegistimi = true;

								if (parentPart.listeReadyFlag) {
									const {detaylar} = this;
									let degistimi = false;
									for (let i in detaylar) {
										const det = detaylar[i];
										det.detYerKodReset(); det.cacheReset()
										/*det.ekOzelliklerDo({
											callback: _e => {
												const ekOzellik = _e.item;
												if ((ekOzellik.tip == 'raf' || ekOzellik.tip == 'refRaf') && ekOzellik.value) {
													ekOzellik.value = '';
													degistimi = true;
												}
											}
										})*/
									}
									/* if (degistimi) { parentPart?.tazele?.() } */
								}
							}
						}
					}
				});
				sahaContainer.removeClass(`jqx-hidden`);
				await part.run();
			}
		}

		async onKontrol(e) {
			e = e || {};
			const {app} = sky;
			const {yerKod2Rec} = app.caches;
			if (!this.yerKod)
				return this.error_onKontrol(`(Depo) belirtilmelidir`, 'emptyValue');
			
			let result = yerKod2Rec[this.yerKod];
			if (result == null) {
				result = parseInt(await this.dbMgr.tekilDegerExecuteSelect({
					tx: e.tx,
					query: `SELECT COUNT(*) sayi FROM mst_Yer WHERE kod = ?`,
					params: [this.yerKod]
				}))
			}
			if (!result)
				return this.error_onKontrol(`(${this.yerKod} kodlu Depo) hatalıdır`, 'invalidValue');
			
			if (!this.refYerKod)
				return this.error_onKontrol(`(Ref. Depo) belirtilmelidir`, 'emptyValue');
			
			result = yerKod2Rec[this.refYerKod];
			if (result == null) {
				result = parseInt(await this.dbMgr.tekilDegerExecuteSelect({
					tx: e.tx,
					query: `SELECT COUNT(*) sayi FROM mst_Yer WHERE kod = ?`,
					params: [this.refYerKod]
				}))
			}
			if (!result)
				return this.error_onKontrol(`(${this.refYerKod} kodlu Ref. Depo) hatalıdır`, 'invalidValue');
			
			return await super.onKontrol(e);
		}

		async sonStokDuzenle(e) {
			e = e || {};
			await super.sonStokDuzenle(e);

			const fakeIslemFlag = asBool(e.fakeIslem || e.fakeIslemmi);
			const {islem, eskiFis} = e;
			if (!fakeIslemFlag) {
				const {yerKod, refYerKod, detaylar} = this;
				const fakeFis = new CETDepoTransferTersFis(this);
				// const fakeFis = this.shallowCopy();
				fakeFis.yerKod = refYerKod;
				delete fakeFis.refYerKod;
				fakeFis.detaylar = [];
				for (const i in detaylar) {
					const det = detaylar[i];
					const yDet = det.deepCopy();
					const {rafKod, refRafKod} = yDet;
					if (rafKod) {
						yDet.cacheReset();
						yDet.rafKod = refRafKod || '';
						yDet.refRafKod = '';
					}
					fakeFis.detaylar.push(yDet);
				}
				
				const _e = $.extend({}, e, { fakeIslem: true });
				_e[islem == 'sil' ? 'eskiFis' : 'fis'] = fakeFis;
				if (islem == 'degistir' && eskiFis) {
					const {yerKod, refYerKod, detaylar} = eskiFis;
					const eskiFakeFis = new CETDepoTransferTersFis(eskiFis);
					// const eskiFakeFis = eskiFis.shallowCopy();
					eskiFakeFis.yerKod = refYerKod;
					delete eskiFakeFis.refYerKod;

					eskiFakeFis.detaylar = [];
					for (const i in detaylar) {
						const det = detaylar[i];
						const yDet = det.deepCopy();
						const {rafKod, refRafKod} = yDet;
						if (rafKod) {
							yDet.cacheReset();
							yDet.rafKod = refRafKod || '';
							yDet.refRafKod = '';
						}
						eskiFakeFis.detaylar.push(yDet);
					}
					
					_e.eskiFis = eskiFakeFis;
				}
				await fakeFis.sonStokDuzenle(_e);
			}
		}
	};
	window.CETDepoTransferTersFis = class extends window.CETDepoTransferFis { static get fiiliCikismi() { return false } static get alimmi() { return false } }

	window.CETSubeTransferFis = class extends window.CETTransferFis {
		static get aciklama() { return 'Şube Transfer' } static get adimTipi() { return 'TRS' }
		static get noYilDesteklermi() { return true } static get eIslemKullanilirmi() { return true }
		static get numaratorTip() { return CETIrsaliyeFis.numaratorTip }
		get matbuuFormTip() {
			let {app} = sky; if (app.eIslemKullanilirmi && this.eIslemTip) {
				if (app.eIrsaliyeKullanilirmi) {
					let key = 'e-Irsaliye', tip2MatbuuForm = app._matbuuFormYapilari?.tip2MatbuuForm || {};
					if (!tip2MatbuuForm || tip2MatbuuForm[key]) { return key }
				}
				return (app.eIslemOzelDokummu ? 'e-Islem-Ozel' : 'e-Islem')
			}
			return 'Irsaliye'
		}
		constructor(e) {
			e = e || {}; super(e);
			$.extend(this, { refSubeKod: e.refSubeKod || '' });
		}
		async eIslemTipDegeriFor(e) {
			let {app} = sky, {eIslemKullanilirmi, eIrsaliyeKullanilirmi} = app;
			return eIslemKullanilirmi && eIrsaliyeKullanilirmi ? 'IR' : ''
		}
		hostVars(e) {
			e = e || {}; let hv = super.hostVars();
			$.extend(hv, { refsubekod: this.refSubeKod || '' });
			return hv
		}
		async setValues(e) {
			e = e || {}; await super.setValues(e);
			const {rec} = e; $.extend(this, { refSubeKod: rec.refsubekod || '' });
		}
		async initBaslikUI_ara(e) {
			await super.initBaslikUI_ara(e);

			const parentPart = e.parentPart;
			const param = parentPart.param;
			const userSettings = param.userSettings = param.userSettings || {};
			const sonDegerler = userSettings.sonDegerler = userSettings.sonDegerler || {};

			const layout = e.layout;
			let savedParentWidth;
			if (true) {
				let kod = this.yerKod;
				let sonDeger = sonDegerler.yerKod;
				const divSaha = layout.find(`#yerKod`);
				const sahaContainer = divSaha.parents(`.parent`);
				const divEtiket = sahaContainer.find(`.etiket`);
				let part = new CETMstComboBoxPart({
					parentPart: parentPart,
					content: divSaha,
					// layout: layout.find('.hizliStok'),
					placeHolder: `Çıkış Yeri`,
					listeSinif: CETKAListePart, table: 'mst_Yer',
					idSaha: 'kod', adiSaha: 'aciklama',
					selectedId: kod /* || sonDeger */,
					widgetDuzenleyici: e => {
						savedParentWidth = e.widgetArgs.width = savedParentWidth || (
							e.widgetArgs.width - (divEtiket.width() ||  0) );
						e.widgetArgs.dropDownWidth = e.widgetArgs.width;
					},
					events: {
						comboBox_stmDuzenleyici: e => {
							const {defaultSubeKod} = sky.app;
							if (defaultSubeKod != null) {
								e.stm.sentDo(sent =>
									sent.where.degerAta(defaultSubeKod, `mst.subeKod`));
							}
						},
						liste_stmDuzenleyici: e => {
							const {defaultSubeKod} = sky.app;
							if (defaultSubeKod != null) {
								e.stm.sentDo(sent =>
									sent.where.degerAta(defaultSubeKod, `mst.subeKod`));
							}
						},
						comboBox_itemSelected: e => {
							kod = this.yerKod = (e.rec || {}).kod || e.value || '';
							if (sonDeger != kod) {
								sonDeger = sonDegerler.yerKod = kod;
								parentPart.paramDegistimi = true;
							}
						}
					}
				});
				sahaContainer.removeClass(`jqx-hidden`);
				await part.run();
			}

			if (true) {
				let kod = this.refSubeKod;
				let sonDeger = sonDegerler.refSubeKod;

				const divSaha = layout.find(`#refSubeKod`);
				const sahaContainer = divSaha.parents(`.parent`);
				const divEtiket = sahaContainer.find(`.etiket`);
				let part = new CETMstComboBoxPart({
					parentPart: parentPart,
					content: divSaha,
					// layout: layout.find('.hizliStok'),
					placeHolder: `Giriş Şubesi`,
					listeSinif: CETKAListePart, table: 'mst_Sube',
					idSaha: 'kod', adiSaha: 'aciklama',
					selectedId: kod || sonDeger,
					widgetDuzenleyici: e => {
						savedParentWidth = e.widgetArgs.width = savedParentWidth || (
							e.widgetArgs.width - (divEtiket.width() ||  0) );
						e.widgetArgs.dropDownWidth = e.widgetArgs.width;
					},
					events: {
						comboBox_loadServerData: e => {
							return (e.wsArgs || {}).searchText ? null : Object.values(sky.app.caches.subeKod2Rec)
						},
						/*comboBox_recsDuzenleyici: e => {
							e.recs.unshift({ kod: ``, aciklama: `-MERKEZ ŞUBE-`})
						},
						liste_loadServerData_ekIslemler: e => {
							e.recs.unshift({ kod: ``, aciklama: `-MERKEZ ŞUBE-`});
							e.totalRecs++;
						},*/
						comboBox_itemSelected: e => {
							kod = this.refSubeKod = (e.rec || {}).kod || e.value || '';
							if (sonDeger != kod) {
								sonDeger = sonDegerler.refSubeKod = kod;
								parentPart.paramDegistimi = true;
							}
						}
					}
				});
				sahaContainer.removeClass(`jqx-hidden`);
				await part.run();
			}
		}

		async onKontrol(e) {
			e = e || {};
			if (!this.yerKod)
				return this.error_onKontrol(`(Yer) belirtilmelidir`, 'emptyValue');
			if (!this.refSubeKod)
				return this.error_onKontrol(`(Ref. Şube) belirtilmelidir`, 'emptyValue');
			
			let result = sky.app.caches.yerKod2Rec[this.yerKod];
			if (result == null) {
				result = parseInt(await this.dbMgr.tekilDegerExecuteSelect({
					tx: e.tx,
					query: `SELECT COUNT(*) sayi FROM mst_Yer WHERE kod = ?`,
					params: [this.yerKod]
				}))
			}
			if (!result)
				return this.error_onKontrol(`(${this.yerKod} kodlu Çıkış Depo) hatalıdır`, 'invalidValue');
			
			result = sky.app.caches.subeKod2Rec[this.refSubeKod];
			if (result == null) {
				result = parseInt(await this.dbMgr.tekilDegerExecuteSelect({
					tx: e.tx,
					query: `SELECT COUNT(*) sayi FROM mst_Sube WHERE kod = ?`,
					params: [this.refSubeKod]
				}))
			}
			if (!result)
				return this.error_onKontrol(`(${this.refSubeKod} kodlu Ref. Şube) hatalıdır`, 'invalidValue');
			
			return await super.onKontrol(e);
		}
	};
	window.CETSubelerArasiTransferSiparisFis = class extends window.CETTransferFis {
		static get aciklama() { return 'Şube Transfer Siparişi' } static get numaratorTip() { return 'TRSA' }
		constructor(e) {		/* (subeKod) üst seviyesinden atanmış idi .. super(e) .. ile */
			e = e || {}; super(e); $.extend(this, { subeKod: this.subeKod || sky.app.defaultSubeKod || '', refSubeKod: e.refSubeKod || '' })
		}
		hostVars(e) { e = e || {}; let hv = super.hostVars(); $.extend(hv, { refsubekod: this.refSubeKod || '' }); return hv }
		async setValues(e) { e = e || {}; await super.setValues(e); const {rec} = e; $.extend(this, { refSubeKod: rec.refsubekod || '' }) }
		hostVarsDuzenlenmis(e) {
			let hv = super.hostVarsDuzenlenmis(e);
			if (sky.app.transferOncelikKullanilirmi) { const {transferOncelikKod} = this; if (transferOncelikKod) { hv.fisaciklama = `${hv.fisaciklama || ''} - ${transferOncelikKod}` } }
			return hv
		}
		async initBaslikUI_ara(e) {
			await super.initBaslikUI_ara(e); const {parentPart, layout} = e, {param} = parentPart, userSettings = param.userSettings = param.userSettings || {};
			const sonDegerler = userSettings.sonDegerler = userSettings.sonDegerler || {}; let savedParentWidth;
			if (true) {
				let kod = this.subeKod, sonDeger = sonDegerler.subeKod;
				const divSaha = layout.find(`#subeKod`), sahaContainer = divSaha.parents(`.parent`), divEtiket = sahaContainer.find(`.etiket`);
				let part = new CETMstComboBoxPart({
					parentPart, content: divSaha, placeHolder: `Çıkış Şubesi`, listeSinif: CETKAListePart, table: 'mst_Sube',
					idSaha: 'kod', adiSaha: 'aciklama', selectedId: kod || sonDeger,
					widgetDuzenleyici: e => {
						savedParentWidth = e.widgetArgs.width = savedParentWidth || (e.widgetArgs.width - (divEtiket.width() || 0));
						e.widgetArgs.dropDownWidth = e.widgetArgs.width
					},
					events: {
						comboBox_loadServerData: e => e.wsArgs?.searchText ? null : Object.values(sky.app.caches.subeKod2Rec),
						comboBox_itemSelected: e => {
							kod = this.subeKod = e.rec?.kod || e.value || '';
							if (sonDeger != kod) { sonDeger = sonDegerler.subeKod = kod; parentPart.paramDegistimi = true }
						}
					}
				});
				sahaContainer.removeClass(`jqx-hidden`); await part.run()
			}
			if (true) {
				let kod = this.refSubeKod, sonDeger = sonDegerler.refSubeKod;
				const divSaha = layout.find(`#refSubeKod`), sahaContainer = divSaha.parents(`.parent`), divEtiket = sahaContainer.find(`.etiket`);
				let part = new CETMstComboBoxPart({
					parentPart, content: divSaha, placeHolder: `Giriş Şubesi`, listeSinif: CETKAListePart, table: 'mst_Sube',
					idSaha: 'kod', adiSaha: 'aciklama', selectedId: kod || sonDeger,
					widgetDuzenleyici: e => {
						savedParentWidth = e.widgetArgs.width = savedParentWidth || (e.widgetArgs.width - (divEtiket.width() ||  0) );
						e.widgetArgs.dropDownWidth = e.widgetArgs.width
					},
					events: {
						comboBox_itemSelected: e => {
							kod = this.refSubeKod = e.rec?.kod || e.value || '';
							if (sonDeger != kod) { sonDeger = sonDegerler.refSubeKod = kod; parentPart.paramDegistimi = true }
						}
					}
				});
				sahaContainer.removeClass(`jqx-hidden`); await part.run()
			}
		}
		async initBaslikUI_son(e) {
			await super.initBaslikUI_son(e); const {parentPart, layout} = e, {param} = parentPart;
			const userSettings = param.userSettings = param.userSettings || {}, sonDegerler = userSettings.sonDegerler = userSettings.sonDegerler || {};
			let savedParentWidth; if (sky.app.transferOncelikKullanilirmi) {
				const {transferOncelikKAListe: items} = sky.app; let divSaha = layout.find(`#transferOncelikKod`);
				if (!divSaha.length) {
					let divParent = $(`<div class="yerKodParent parent flex-row jqx-hidden"><div class="veri"><div id="transferOncelikKod"/></div></div>`).appendTo(layout);
					divSaha = divParent.find(`.veri > div`)
				}
				let kod = this.transferOncelikKod, sonDeger = sonDegerler.transferOncelikKod;
				const sahaContainer = divSaha.parents(`.parent`), divEtiket = sahaContainer.find(`.etiket`);
				let part = new CETMstComboBoxPart({
					parentPart, content: divSaha, placeHolder: `Transfer Öncelik`, listeSinif: CETKAListePart,
					idSaha: 'kod', adiSaha: 'aciklama', selectedId: kod || sonDeger, kodsuzmu: true,
					widgetDuzenleyici: e => {
						savedParentWidth = e.widgetArgs.width = savedParentWidth || (e.widgetArgs.width - (divEtiket.width() || 0));
						e.widgetArgs.dropDownWidth = e.widgetArgs.width
					},
					events: {
						comboBox_loadServerData: e => items, liste_loadServerData: e => items,
						comboBox_itemSelected: e => {
							kod = this.transferOncelikKod = (e.rec || {}).kod || e.value || '';
							if (sonDeger != kod) { sonDeger = sonDegerler.transferOncelikKod = kod; parentPart.paramDegistimi = true }
						}
					}
				});
				sahaContainer.removeClass(`jqx-hidden`); await part.run()
			}
		}
		async onKontrol(e) {
			e = e || {}; if (!this.subeKod) { return this.error_onKontrol(`(Çıkış Şubesi) belirtilmelidir`, 'emptyValue') }
			if (!this.refSubeKod) { return this.error_onKontrol(`(Giriş Şubesi) belirtilmelidir`, 'emptyValue') }
			let result = sky.app.caches.subeKod2Rec[this.subeKod];
			if (result == null) { result = parseInt(await this.dbMgr.tekilDegerExecuteSelect({ tx: e.tx, query: `SELECT COUNT(*) sayi FROM mst_Sube WHERE kod = ?`, params: [this.subeKod] })) }
			if (!result) { return this.error_onKontrol(`(${this.subeKod} kodlu Çıkış Şubesi) hatalıdır`, 'invalidValue') }
			result = sky.app.caches.subeKod2Rec[this.refSubeKod];
			if (result == null) { result = parseInt(await this.dbMgr.tekilDegerExecuteSelect({ tx: e.tx, query: `SELECT COUNT(*) sayi FROM mst_Sube WHERE kod = ?`, params: [this.refSubeKod] })) }
			if (!result) { return this.error_onKontrol(`(${this.refSubeKod} kodlu Giriş Şubesi) hatalıdır`, 'invalidValue') }
			return await super.onKontrol(e)
		}
	}

	window.CETPlasiyerFisOrtak = class extends window.CETStokFis {
		static get eIslemKullanilirmi() { let {app} = sky; return app.eIslemKullanilirmi && app.eIrsaliyeKullanilirmi && app.ertesiGunTeslimFisiIslenirmi }
		static get numaratorTip() { return this.adimTipi }
		// static get numaratorTip() { return this.eIslemKullanilirmi ? CETIrsaliyeFis.numaratorTip : this.adimTipi }
		static get noYilDesteklermi() { return this.eIslemKullanilirmi }
		get matbuuFormTip() { return this.class.eIslemKullanilirmi ? CETIrsaliyeFis.matbuuFormTip : super.matbuuFormTip }
		async eIslemTipDegeriFor(e) { return this.class.eIslemKullanilirmi ? 'IR' : '' }
		static get sonStokEtkilenirmi() { return false } static get alimmi() { return true }
		constructor(e) { e = e || {}; super(e); this.subeKod = e.subeKod || sky.app.defaultSubeKod || '' }
		async onKontrol(e) {
			e = e || {}; let tarih = this.tarih; const _today = today();
			if (!tarih) { return this.error_onKontrol(`(Tarih) belirtilmelidir`, 'emptyValue') }
			if (tarih <= today) { return this.error_onKontrol(`(Tarih) bugün veya daha eski olamaz`, 'invalidValue') }
			return await super.onKontrol(e)
		}
		async initBaslikUI_ara(e) {
			await super.initBaslikUI_ara(e);
			const parentPart = e.parentPart, {app} = sky, param = parentPart.param, userSettings = param.userSettings = param.userSettings || {};
			const sonDegerler = userSettings.sonDegerler = userSettings.sonDegerler || {}, {layout} = e; let savedParentWidth;
			if (!app.defaultPlasiyerKod || app.class.appMagazaVeyaSDMmi) {
				let kod = this.plasiyerKod, sonDeger = sonDegerler.plasiyerKod;
				const divSaha = layout.find(`#plasiyerKod`), sahaContainer = divSaha.parents(`.parent`), divEtiket = sahaContainer.find(`.etiket`);
				let part = new CETMstComboBoxPart({
					parentPart, content: divSaha, placeHolder: 'Plasiyer', listeSinif: CETKAListePart, table: 'mst_Plasiyer',
					idSaha: 'kod', adiSaha: 'aciklama', selectedId: kod,
					widgetDuzenleyici: e => {
						savedParentWidth = e.widgetArgs.width = savedParentWidth || ( e.widgetArgs.width - (divEtiket.width() ||  0) );
						e.widgetArgs.dropDownWidth = e.widgetArgs.width
					},
					events: {
						comboBox_loadServerData: e => e.wsArgs?.searchText ? null : Object.values(sky.app.caches.plasiyerKod2Rec),
						comboBox_itemSelected: e => {
							kod = this.plasiyerKod = e.rec?.kod || e.value || sky.app.defaultPlasiyerKod;
							if (sonDeger != kod) { sonDeger = sonDegerler.plasiyerKod = kod; parentPart.paramDegistimi = true }
						}
					}
				});
				sahaContainer.removeClass(`jqx-hidden`); await part.run()
			}
		}
	};
	window.CETPlasiyerErtesiGunSiparisFis = class extends window.CETPlasiyerFisOrtak {
		static get adimTipi() { return 'PS' } static get aciklama() { return 'Ertesi Gün Sipariş' }
		constructor(e) { e = e || {}; super(e) }
	};
	window.CETPlasiyerIadeFis = class extends window.CETPlasiyerFisOrtak {
		static get adimTipi() { return 'PI' } static get aciklama() { return 'Pls. Depoya İADE' }
		static get iademi() { return true } static get sonStokEtkilenirmi() { return true }
		constructor(e) { e = e || {}; super(e); this.bozukmu = asBool(e.bozukmu) }
		hostVars(e) { e = e || {}; let hv = super.hostVars(); hv.bozukmu = bool2Int(this.bozukmu); return hv }
		async setValues(e) { e = e || {}; await super.setValues(e); const {rec} = e; this.bozukmu = asBool(rec.bozukmu) }
		async initBaslikUI_ara(e) {
			await super.initBaslikUI_ara(e);
			const parentPart = e.parentPart, param = parentPart.param, userSettings = param.userSettings = param.userSettings || {};
			let sonDegerler = userSettings.sonDegerler = userSettings.sonDegerler || {}, {layout} = e, savedParentWidth;
			if (true) {
				let flag = this.bozukmu; const divSaha = layout.find(`#chkBozukmu`), sahaContainer = divSaha.parents(`.parent`);
				let changeHandler = evt => { flag = this.bozukmu = divSaha.prop('checked'); sonDeger = sonDegerler.bozukmu = flag; parentPart.paramDegistimi = true };
				divSaha.prop('checked', flag);
				divSaha.parent().find(`.label`).off('mouseup, touchend').on('mouseup, touchend', evt => { divSaha.prop('checked', !divSaha.prop('checked')); changeHandler(evt) });
				divSaha.off('change').on('change', evt => changeHandler(evt));
				sahaContainer.removeClass(`jqx-hidden`)
			}
		}
	}
})()
