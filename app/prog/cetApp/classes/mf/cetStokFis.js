(function() {
	window.CETStokFis = class extends window.CETStokTicariFis {
		constructor(e) {
			e = e || {};
			super(e);
		}

		static get detaySinif() { return CETStokDetay }
		static get stokmu() { return true }
		static get fiiliCikismi() { return (this.alimmi == this.iademi) }
		static get musteriKullanilirmi() { return false }
		// static get sonStoktanSecimYapilirmi() { return true }
		// static get sonStokKontrolEdilirmi() { return !(this.alimmi || this.iademi) }
		// static get sonStokEtkilenirmi() { return true }
		static get rafKullanilirmi() { return true }
		static get bedelKullanilirmi() { return false }
		get matbuuFormTip() { return `Sevkiyat` }

		get sonucBedel() {
			this.gerekirseDipHesapla();
			return bedel(this.toplamBedel);
		}
		
		static varsayilanKeyHostVars(e) {
			return $.extend(super.varsayilanKeyHostVars(), {
				fistipi: this.adimTipi || ''
			});
		}

		hostVars(e) {
			e = e || {};
			const toplamBedel = bedel(this.toplamBedel) || 0;

			let hv = super.hostVars();
			/*$.extend(hv, {
				fistipi: this.class.adimTipi || ''
			});*/
			hv.brut = hv.ciro = hv.net = toplamBedel;

			return hv;
		}

		async setValues(e) {
			e = e || {};
			await super.setValues(e);

			const {rec} = e;
			this.toplamBedel = bedel(rec.net) || 0;
		}

		gerekirseDipHesapla(e) {
			if (!this.hesaplandimi)
				this.dipHesapla(e);
		}
		
		dipHesapla(e) {
			this.toplamBedel = 0;
			this.detaylar.forEach(det =>
				this.toplamBedel += bedel(det.netBedel) || 0);
			this.hesaplandimi = true;
		}

		async kaydetOncesiKontrol(e) {
			await super.kaydetOncesiKontrol(e);
		}

		async getDokumDegeriDict(e) {
			return $.extend(await super.getDokumDegeriDict(e) || {}, {
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
	};


	window.CETSayimFis = class extends window.CETStokFis {
		static get aciklama() { return 'Sayım' }
		static get numaratorTip() { return `SY` }
		static get fiiliCikismi() { return false }
		static get alimmi() { return true }
		static get sonStokEtkilenirmi() { return true }
		
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
									sent.where.degerAta(defaultSubeKod, `mst.subeKod`));
							}
						},
						comboBox_itemSelected: e => {
							kod = this.yerKod = (e.rec || {}).kod || e.value || sky.app.defaultYerKod || '';
							if (sonDeger != kod) {
								sonDeger = sonDegerler.yerKod = kod;
								parentPart.paramDegistimi = true;

								if (parentPart.listeReadyFlag) {
									const {detaylar} = this;
									let degistimi = false;
									for (let i in detaylar) {
										const det = detaylar[i];
										det.cacheReset();
										det.detYerKodReset();
										det.ekOzelliklerDo({
											callback: _e => {
												const ekOzellik = _e.item;
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
		}

		async onKontrol(e) {
			e = e || {};
			if (!this.yerKod)
				return this.error_onKontrol(`(Depo) belirtilmelidir`, 'emptyValue');
			
			let result = sky.app.caches.yerKod2Rec[this.yerKod];
			if (result == null) {
				result = parseInt(await this.dbMgr.tekilDegerExecuteSelect({
					tx: e.tx,
					query: `SELECT COUNT(*) sayi FROM mst_Yer WHERE kod = ?`,
					params: [this.yerKod]
				}))
			}
			if (!result)
				return this.error_onKontrol(`(${this.yerKod} kodlu Depo) hatalıdır`, 'invalidValue');
			
			return await super.onKontrol(e);
		}

		async sonStokDuzenle(e) {
			const _e = $.extend({}, e, { dogrudanMiktarAlinirmi: true });
			return await super.sonStokDuzenle(e);
		}
	};


	window.CETTransferFis = class extends window.CETStokFis {
		static get sonStokKontrolEdilirmi() { return false }
		static get sonStokEtkilenirmi() { return false }
		static get refRafKullanilirmi() { return true }
		// get hesaplanmisStokMiktarBilgileri() { return {} }
		// get hesaplanmisSonStokBilgileri() { return {} }
	};

	window.CETDepoTransferFis = class extends window.CETTransferFis {
		constructor(e) {
			e = e || {};
			super(e);
			
			this.refYerKod = e.refYerKod || '';
		}

		static get aciklama() { return 'Depo Transfer' }
		static get numaratorTip() { return `TR` }
		static get sonStokKontrolEdilirmi() { return sky.app.sonStokKontrolEdilirmi && this.fiiliCikismi }
		static get sonStokEtkilenirmi() { return true }
		
		hostVars(e) {
			e = e || {};
			let hv = super.hostVars();
			hv.refyerkod = this.refYerKod || '';

			return hv;
		}

		async setValues(e) {
			e = e || {};
			await super.setValues(e);

			const rec = e.rec;
			this.refYerKod = rec.refyerkod || '';
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
									sent.where.degerAta(defaultSubeKod, `mst.subeKod`));
							}
						},
						comboBox_itemSelected: e => {
							kod = this.yerKod = (e.rec || {}).kod || e.value || sky.app.defaultYerKod || '';
							if (sonDeger != kod) {
								sonDeger = sonDegerler.yerKod = kod;
								parentPart.paramDegistimi = true;
								
								if (parentPart.listeReadyFlag) {
									const {detaylar} = this;
									let degistimi = false;
									for (let i in detaylar) {
										const det = detaylar[i];
										det.cacheReset();
										det.detYerKodReset();
										det.ekOzelliklerDo({
											callback: _e => {
												const ekOzellik = _e.item;
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
										det.cacheReset();
										det.detYerKodReset();
										det.ekOzelliklerDo({
											callback: _e => {
												const ekOzellik = _e.item;
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

	window.CETDepoTransferTersFis = class extends window.CETDepoTransferFis {
		static get fiiliCikismi() { return false }
		static get alimmi() { return false }
	}

	window.CETSubeTransferFis = class extends window.CETTransferFis {
		constructor(e) {
			e = e || {};
			super(e);
			
			$.extend(this, {
				// yerKod: e.yerKod || '',
				refSubeKod: e.refSubeKod || ''
			});
		}
		
		static get aciklama() { return 'Şube Transfer' }
		// static get sonStoktanSecimYapilirmi() { return true }
		// static get sonStokKontrolEdilirmi() { return !(this.alimmi || this.iademi) }
		static get numaratorTip() { return `TRS` }

		hostVars(e) {
			e = e || {};
			let hv = super.hostVars();
			$.extend(hv, {
				// yerKod: this.yerKod || '',
				refsubekod: this.refSubeKod || ''
			});

			return hv;
		}

		async setValues(e) {
			e = e || {};
			await super.setValues(e);

			const {rec} = e;
			$.extend(this, {
				// yerKod: rec.yerkod || '',
				refSubeKod: rec.refsubekod || ''
			});
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
		constructor(e) {
			e = e || {};
			super(e);
			
			$.extend(this, {
				subeKod: this.subeKod || sky.app.defaultSubeKod || '',			// (subeKod) üst seviyesinden atanmış idi .. super(e) .. ile
				refSubeKod: e.refSubeKod || ''
			});
		}
		
		static get aciklama() { return 'Şube Transfer Siparişi' }
		// static get sonStoktanSecimYapilirmi() { return true }
		// static get sonStokKontrolEdilirmi() { return !(this.alimmi || this.iademi) }
		static get numaratorTip() { return `TRSA` }

		hostVars(e) {
			e = e || {};
			let hv = super.hostVars();
			$.extend(hv, {
				refsubekod: this.refSubeKod || ''
			});

			return hv;
		}

		async setValues(e) {
			e = e || {};
			await super.setValues(e);

			const {rec} = e;
			$.extend(this, {
				refSubeKod: rec.refsubekod || ''
			});
		}

		hostVarsDuzenlenmis(e) {
			let hv = super.hostVarsDuzenlenmis(e);
			if (sky.app.transferOncelikKullanilirmi) {
				const {transferOncelikKod} = this;
				if (transferOncelikKod)
					hv.fisaciklama = `${hv.fisaciklama || ''} - ${transferOncelikKod}`;
			}

			return hv;
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
				let kod = this.subeKod;
				let sonDeger = sonDegerler.subeKod;

				const divSaha = layout.find(`#subeKod`);
				const sahaContainer = divSaha.parents(`.parent`);
				const divEtiket = sahaContainer.find(`.etiket`);
				let part = new CETMstComboBoxPart({
					parentPart: parentPart,
					content: divSaha,
					// layout: layout.find('.hizliStok'),
					placeHolder: `Çıkış Şubesi`,
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
						comboBox_itemSelected: e => {
							kod = this.subeKod = (e.rec || {}).kod || e.value || '';
							if (sonDeger != kod) {
								sonDeger = sonDegerler.subeKod = kod;
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

		async initBaslikUI_son(e) {
			await super.initBaslikUI_son(e);

			const parentPart = e.parentPart;
			const param = parentPart.param;
			const userSettings = param.userSettings = param.userSettings || {};
			const sonDegerler = userSettings.sonDegerler = userSettings.sonDegerler || {};

			const layout = e.layout;
			let savedParentWidth;
			if (sky.app.transferOncelikKullanilirmi) {
				const items = sky.app.transferOncelikKAListe;
				let divSaha = layout.find(`#transferOncelikKod`);
				if (!divSaha.length) {
					let divParent = $(
						`<div class="yerKodParent parent flex-row jqx-hidden">` +
						`	<div class="veri"><div id="transferOncelikKod"/></div>` +
						`</div>`
					).appendTo(layout);
					divSaha = divParent.find(`.veri > div`);
				}

				let kod = this.transferOncelikKod;
				let sonDeger = sonDegerler.transferOncelikKod;

				const sahaContainer = divSaha.parents(`.parent`);
				const divEtiket = sahaContainer.find(`.etiket`);
				let part = new CETMstComboBoxPart({
					parentPart: parentPart,
					content: divSaha,
					// layout: layout.find('.hizliStok'),
					placeHolder: `Transfer Öncelik`,
					listeSinif: CETKAListePart,
					idSaha: 'kod', adiSaha: 'aciklama',
					selectedId: kod || sonDeger,
					kodsuzmu: true,
					widgetDuzenleyici: e => {
						savedParentWidth = e.widgetArgs.width = savedParentWidth || (
							e.widgetArgs.width - (divEtiket.width() ||  0) );
						e.widgetArgs.dropDownWidth = e.widgetArgs.width;
					},
					events: {
						comboBox_loadServerData: e => {
							return items
						},
						liste_loadServerData: e => {
							return items
						},
						comboBox_itemSelected: e => {
							kod = this.transferOncelikKod = (e.rec || {}).kod || e.value || '';
							if (sonDeger != kod) {
								sonDeger = sonDegerler.transferOncelikKod = kod;
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
			if (!this.subeKod)
				return this.error_onKontrol(`(Çıkış Şubesi) belirtilmelidir`, 'emptyValue');
			if (!this.refSubeKod)
				return this.error_onKontrol(`(Giriş Şubesi) belirtilmelidir`, 'emptyValue');
			
			let result = sky.app.caches.subeKod2Rec[this.subeKod];
			if (result == null) {
				result = parseInt(await this.dbMgr.tekilDegerExecuteSelect({
					tx: e.tx,
					query: `SELECT COUNT(*) sayi FROM mst_Sube WHERE kod = ?`,
					params: [this.subeKod]
				}))
			}
			if (!result)
				return this.error_onKontrol(`(${this.subeKod} kodlu Çıkış Şubesi) hatalıdır`, 'invalidValue');
			
			result = sky.app.caches.subeKod2Rec[this.refSubeKod];
			if (result == null) {
				result = parseInt(await this.dbMgr.tekilDegerExecuteSelect({
					tx: e.tx,
					query: `SELECT COUNT(*) sayi FROM mst_Sube WHERE kod = ?`,
					params: [this.refSubeKod]
				}))
			}
			if (!result)
				return this.error_onKontrol(`(${this.refSubeKod} kodlu Giriş Şubesi) hatalıdır`, 'invalidValue');
			
			return await super.onKontrol(e);
		}
	};


	window.CETPlasiyerFisOrtak = class extends window.CETStokFis {
		static get sonStokEtkilenirmi() { return false }
		static get alimmi() { return true }
		
		async onKontrol(e) {
			e = e || {};
			let tarih = this.tarih;
			const _today = today();
			if (!tarih)
				return this.error_onKontrol(`(Tarih) belirtilmelidir`, 'emptyValue');
			if (tarih <= today)
				return this.error_onKontrol(`(Tarih) bugün veya daha eski olamaz`, 'invalidValue');
			
			return await super.onKontrol(e);
		}
	};

	window.CETPlasiyerErtesiGunSiparisFis = class extends window.CETPlasiyerFisOrtak {
		constructor(e) {
			e = e || {};
			super(e);
		}
		
		static get numaratorTip() { return `PS` }
		static get aciklama() { return 'Ertesi Gün Sipariş' }
	};

	window.CETPlasiyerIadeFis = class extends window.CETPlasiyerFisOrtak {
		constructor(e) {
			e = e || {};
			super(e);

			this.bozukmu = asBool(e.bozukmu);
		}
		
		static get numaratorTip() { return `PI` }
		static get aciklama() { return 'Pls. Depoya İADE' }
		static get iademi() { return true }
		static get sonStokEtkilenirmi() { return true }
		// static get sonStokKontrolEdilirmi() { return true }

		hostVars(e) {
			e = e || {};
			let hv = super.hostVars();
			hv.bozukmu = bool2Int(this.bozukmu);

			return hv;
		}

		async setValues(e) {
			e = e || {};
			await super.setValues(e);

			const {rec} = e;
			this.bozukmu = asBool(rec.bozukmu);
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
				let flag = this.bozukmu;
				// let sonDeger = sonDegerler.bozukmu;
				const divSaha = layout.find(`#chkBozukmu`);
				const sahaContainer = divSaha.parents(`.parent`);
				let changeHandler = evt => {
					flag = this.bozukmu = divSaha.prop('checked');
					/*if (sonDeger != flag) {
						sonDeger = sonDegerler.bozukmu = flag;
						parentPart.paramDegistimi = true;
					}*/
				};
				divSaha.prop('checked', flag);
				divSaha.parent().find(`.label`)
					.off('mouseup, touchend')
					.on('mouseup, touchend', evt => {
						divSaha.prop('checked', !divSaha.prop('checked'));
						changeHandler(evt)
					});
				divSaha
					.off('change')
					.on('change', evt =>
						changeHandler(evt));
				sahaContainer.removeClass(`jqx-hidden`);
			}
		}
	};
})()
