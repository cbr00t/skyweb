(function() {
	window.CETFiyatGorPart = class extends window.CETListeOrtakPart {
		static get canDestroy() { return false } static get partName() { return 'cetFiyatGor' } get adimText() { return 'Fiyat Gör Ekranı' }
		constructor(e) {
			e = e || {}; super(e); $.extend(this, { mustKod: e.mustKod, stokKod: e.stokKod, events: $.extend({}, e.events || {}), secButonuKontrolEdilirmi: false, secinceGeriYapilmazFlag: true });
			if (!(this.layout || this.template)) { this.template = this.app.templates.fiyatGor }
		}
		async postInitLayout(e) {
			e = e || {}; const layout = e.layout || this.layout;
			this.templates = this.templates || {};
			/*this.templates = $.extend(this.templates || {}, { hizliStokItem: layout.find('#hizliStokItem') });*/
			this.isReady = false;
			let hizliCariPart = this.hizliCariPart = new CETMstComboBoxPart({
				parentPart: this, content: layout.find('.hizliCari'), /* layout: layout.find('.hizliStok'), */
				placeHolder: 'Müşteri Ünvan veya Kodu', listeSinif: CETCariListePart, table: 'mst_Cari',
				idSaha: 'kod', adiSaha: 'unvan', selectedId: this.mustKod, /* text: this.mustKod, */
				events: {
					comboBox_itemSelected: e => { this.hizliCari_itemSelected(e); this.focusToDefault() },
					comboBox_stmDuzenleyici: e => {
						const {alias} = e; let aliasVeNokta = alias ? alias + '.' : '';
						for (const sent of e.stm.getSentListe()) { sent.sahalar.addAll([`${aliasVeNokta}bolgeKod`, `${aliasVeNokta}tipKod`, `${aliasVeNokta}kosulGrupKod`]) }
					}
				}
			});
			await hizliCariPart.run(); delete this.mustKod;
			let hizliStokPart = this.hizliStokPart = new CETMstComboBoxPart({
				parentPart: this, content: layout.find('.hizliStok'), /* layout: layout.find('.hizliStok'), */
				placeHolder: 'Ürün Adı veya Barkod', listeSinif: CETStokListePart, table: 'mst_Stok',
				idSaha: 'kod', adiSaha: 'aciklama', selectedId: this.stokKod, /* text: this.stokKod, */
				events: {
					comboBox_itemSelected: e => { this.hizliStok_itemSelected(e); this.focusToDefault() },
					comboBox_stmDuzenleyici: e => true,
					liste_stmDuzenleyici: e => { return true },
					listedenSec_ekArgs: { fis: null, sonStokKontrolEdilirmi: false, sonStokFilterDisabled: false, liste_stmDuzenleyici: e => true }
				}
			});
			await hizliStokPart.run(); delete this.stokKod;
			this.isReady = true; await super.postInitLayout(e);
			let part = this.islemTuslariPart = new CETExpandableIslemTuslariPart({ /* position: ``, */ templateItems: layout.find(`.toolbar-external.islemTuslari`), onItemClicked: e => this.liste_islemTusuTiklandi(e) });
			part.basicRun(); this.focusToDefault()
		}
		async initActivatePartOrtak(e) {
			e = e || {}; await super.initActivatePartOrtak(e);
			this.isReady = false; let id = this.mustKod, degistimi = false;
			if (id) { await this.hizliCariPart.comboBox_itemSelectedDevam({ value: id }) }
			delete this.mustKod; degistimi = degistimi || id;
			id = this.stokKod; if (id) { await this.hizliStokPart.comboBox_itemSelectedDevam({ value: id }) }
			delete this.stokKod; this.isReady = true;
			if (degistimi) { await this.tazele() } setTimeout(() => this.focusToDefault(), 500)
		}
		async destroyDeactivatePartOrtak(e) {
			e = e || {}; this.isReady = false;
			if (this.barcodeReader) { { this.barcodeReader.destroy() } delete this.barcodeReader }
			await super.destroyDeactivatePartOrtak(e)
		}
		async listeArgsDuzenle(e) {
			await super.listeArgsDuzenle(e);
			$.extend(e.listeArgs, {
				showToolbar: false, columnsHeight: 24, pagerHeight: 30,
				columnsResize: true, serverProcessing: false, filterMode: 'default',
				pageSize: this.userSettings_liste.pageSize || 12
			})
		}
		/*liste_renderToolbar(e) {
			const layout = e.layout || this.layout;
			const toolbar = e.listeToolbar;
			let divIslemTuslari = this.toolbarIslemTuslari;
			if (!divIslemTuslari) {
				divIslemTuslari = this.toolbarIslemTuslari = this.newListeSubPart('.toolbar.islemTuslari');
				divIslemTuslari.appendTo(toolbar);

				const liItems = divIslemTuslari.find('ul > li');
				divIslemTuslari.jqxMenu({
					theme: theme, mode: 'horizontal',
					width: '100%', height: false,
					animationShowDuration: 0, animationHideDuration: 0
				});
				liItems.on('click', evt =>
					this.liste_islemTusuTiklandi($.extend({}, e, { event: evt })));
			}
		}*/
		async liste_columnsDuzenle(e) {
			await super.liste_columnsDuzenle(e);
			$.merge(e.listeColumns, [
				{	datafield: 'etiket', text: 'Etiket', align: 'left', width: 230,
					cellsRenderer: (rowIndex, columnIndex, value, rec) =>
						this.liste_columnsDuzenle_generateCell({
							selector: 'etiket', rowIndex: rowIndex, rec: rec, value: rec.etiket
						})
				},
				{	datafield: 'veri', text: 'Veri', align: 'left', cellsFormat: 'd2', cellsAlign: 'right',
					cellsRenderer: (rowIndex, columnIndex, value, rec) =>
						this.liste_columnsDuzenle_generateCell({
							selector: 'veri', rowIndex: rowIndex, rec: rec, value: rec.veri,
							getter: e => {
								const value = e.value;
								return e.rec.bedelmi
											? bedelStr(value)
											: (value
												? value.toLocaleString(culture, { minimumIntegerDigits: 1, useGrouping: true })
												: '')
							}
						})
				}
			])
		}
		async loadServerData(e) {
			e = e || {}; const {app} = sky; const fis = e.fis || this.fis || ((e.parentPart || this.parentPart) || {}).fis || {};
			const {dovizlimi, dvKod} = fis, {satisFiyatGorurmu, alimFiyatGorurmu, alimNetFiyatGosterilirmi} = app;
			const fiyatFra = dovizlimi ? app.dvFiyatFra : app.fiyatFra;
				// oncesinde promise olarak veri cekme islemi baslatilmis idi
			const stokRec = this.stokRec = await this.stokRec, sonStokRecs = this.sonStokRecs = await this.sonStokRecs;
			const recs = [];
			if (stokRec) {
				const {brm} = stokRec, satisKosulYapilari = this.satisKosulYapilari || {};
				let kosulTip = 'FY', kosulSinif = CETSatisKosul.kosulTip2Sinif(kosulTip), kosulKodListe = (satisKosulYapilari[kosulTip] || []).map(kosul => kosul.id);
				let _e = { kosulKodListe, stokKod: stokRec.kod, grupKod: stokRec.grupKod };
				const fiyatKosulDetay = await kosulSinif.kosullarIcinStokGrupBilgi(_e) || {};
				kosulTip = 'SB'; kosulSinif = CETSatisKosul.kosulTip2Sinif(kosulTip);
				kosulKodListe = (satisKosulYapilari[kosulTip] || []).map(kosul => kosul.id);
				_e = { kosulKodListe: kosulKodListe, stokKod: stokRec.kod, grupKod: stokRec.grupKod };
				const iskKosulDetay = await kosulSinif.kosullarIcinStokGrupBilgi(_e) || {};
				
				recs.push({
					etiket: 'ÜRÜN ADI',
					veri: stokRec.aciklama || '',
					bedelmi: false
				});
				if (app.satisFiyatGorurmu) {
					recs.push({
						etiket: 'FİYAT', veri: (
							toStringWithFra(
								(dovizlimi ? (fiyatKosulDetay.ozelDvFiyat || stokRec.dvFiyatGorFiyati || stokRec.dvBrmFiyat || 0) : (fiyatKosulDetay.ozelFiyat || stokRec.fiyatGorFiyati || stokRec.brmFiyat || 0)),
								fiyatFra
							) + (` ${dvKod || 'TL'}`)
						),
						bedelmi: true
					});
					if (!dovizlimi && !app.stokFiyatKdvlimi && app.kdvDahilFiyatGosterim) {
						const fiyat = fiyatKosulDetay.ozelFiyat || stokRec.fiyatGorFiyati || stokRec.brmFiyat || 0;
						const kdvliFiyat = roundToFra(fiyat + (fiyat * bedel((stokRec.kdvOrani || 0) / 100)), fiyatFra);
						recs.push({ etiket: `FİYAT (<span class="orangered">KDV Dahil</span>)`, veri: `<span class="orangered">${toStringWithFra(kdvliFiyat)} TL</span>`, bedelmi: true })
					}
				}
				if (iskKosulDetay && asFloat(iskKosulDetay.iskOran1)) {
					const Prefix = 'iskOran';
					const iskOranStrListe = [];
					for (let key in iskKosulDetay) {
						const value = iskKosulDetay[key];
						if (key.startsWith(Prefix) && asFloat(value))
							iskOranStrListe.push(toStringWithFra(roundToFra(value, 2)));
					}
					recs.push({
						etiket: 'ISK. ORAN',
						veri: ('%' + iskOranStrListe.join('+')),
						bedelmi: false
					})
				}
				if (satisFiyatGorurmu) {
					const Prefix = dovizlimi ? 'dvFiyat' : 'satFiyat';
					for (let key in stokRec) {
						const value = stokRec[key];
						if (value && key.startsWith(Prefix)) {
							let keySizeFark = key.length - Prefix.length;
							if (keySizeFark == 1 || keySizeFark == 2) {
								let ind = parseInt(key.slice(Prefix.length));
								recs.push({
									etiket: `SAT. FİYAT ${ind}`,
									veri: (
										toStringWithFra(value || 0, fiyatFra) +
										(` ${dvKod || 'TL'}`)
									),
									bedelmi: true
								})
							}
						}
					}
				}
				if (alimFiyatGorurmu && alimNetFiyatGosterilirmi) {
					const value = stokRec.almNetFiyat;
					if (value) {
						recs.push({
							etiket: 'ALIM NET FIYAT',
							veri: (
								toStringWithFra(stokRec.almNetFiyat || 0, fiyatFra) +
								(` ${dvKod || 'TL'}`)
							),
							bedelmi: true
						})
					}
				}
				
				if (!$.isEmptyObject(sonStokRecs)) {
					for (let i = 0; i < sonStokRecs.length; i++) {
						const _rec = sonStokRecs[i];
						const {yerKod, sonStok} = _rec;
						if (sonStok) {
							let etiket = `DEPO: (<span class="yerKod">${yerKod}</span>)`;
							const ekOzellikIDSahalar = CETEkOzellikler.idSahalar;
							if (!$.isEmptyObject(ekOzellikIDSahalar)) {
								const sahaDegerleri = [];
								for (const i in ekOzellikIDSahalar) {
									const idSaha = ekOzellikIDSahalar[i];
									const value = _rec[idSaha];
									if (value)
										sahaDegerleri.push(value);
								}
								if (!$.isEmptyObject(sahaDegerleri))
									etiket += `<br/><span class="ekOzelliklerParent">[ <span class="ekOzellikler">${sahaDegerleri.join('; ')}</span> ]</span>`;
							}
							recs.push({
								etiket: etiket,
								// veri: `<span class="yerKod">${yerKod ? yerKod + ': ' : ''}</span><span class="sonStok">${sonStok.toLocaleString() || 0} ${brm || 'AD'}</span>`,
								veri: `<span class="sonStok">${sonStok.toLocaleString() || 0} ${brm || 'AD'}</span>`,
								bedelmi: false
							})
						}
					}
				}
			}
			e.callback({ totalrecords: recs.length, records: recs })
		}
		async stokBilgiStm(e) {
			e = e || {};
			let stokKod = this.hizliStokPart.selectedId;
			if (!stokKod)
				return null
			const fis = e.fis || this.fis || ((e.parentPart || this.parentPart) || {}).fis;
			let stkFytInd = (e.cariRow || {}).stkFytInd || (fis || {}).cariStkFytInd;
			if (!stkFytInd) {
				const mustKod = e.mustKod || (e.cariRow || {}).kod || this.mustKod || (fis || {}).mustKod;
				if (mustKod)
					stkFytInd = await MQCogul.getCariStkFytInd({ mustKod: mustKod });
			}
			const brmFiyatSaha = stkFytInd ? `satFiyat${stkFytInd}` : `brmFiyat`;
			let sent = new MQSent({
				from: `mst_Stok stk`,
				where: [
					{ degerAta: stokKod, saha: `stk.kod` }
				],
				sahalar: [
					`stk.kod`, `stk.aciklama`, `stk.grupKod`, `stk.fiyatGorFiyati`, `stk.satFiyat1`, `stk.satFiyat2`,
					`stk.satFiyat3`, `stk.satFiyat4`, `stk.satFiyat5`, `stk.satFiyat6`, `stk.satFiyat7`,
					`stk.almFiyat`, `stk.almNetFiyat`, `stk.brm`,
					`stk.${brmFiyatSaha} brmFiyat`
				]
			});
			let stm = new MQStm({ sent: sent });
			return stm
		}
		async sonStokBilgiStm(e) {
			e = e || {}; let stokKod = this.hizliStokPart.selectedId;
			if (!stokKod)
				return null
			const {app} = this, {appSicakVeyaSogukmu} = app.class, {defaultYerKod} = app;
			const ekOzellikIDSahalar = CETEkOzellikler.idSahalar;
			let sent = new MQSent({
				from: `mst_SonStok son`,
				where: [ { degerAta: stokKod, saha: `son.stokKod` } ],
				sahalar: [ `son.yerKod` ], groupBy: [ `son.yerKod` ]
			});
			if (!$.isEmptyObject(ekOzellikIDSahalar)) {
				for (const i in ekOzellikIDSahalar) {
					const idSaha = ekOzellikIDSahalar[i];
					const aliasVeSaha = `son.${idSaha}`;
					sent.sahalar.add(aliasVeSaha);
					sent.groupBy.add(aliasVeSaha);
				}
			}
			sent.sahalar.add(`SUM(son.miktar) sonStok`);
			if (appSicakVeyaSogukmu && defaultYerKod)
				sent.where.degerAta(defaultYerKod, `son.yerKod`)
			let stm = new MQStm({ sent: sent });
			return stm
		}
		focusToDefault() {
			const {hizliStokPart} = this; const target = hizliStokPart.comboBox;
			if (target && target.length) {
				this.setUniqueTimeout({
					key: 'focusToDefault', delayMS: 200, isInterval: false,
					block: e => {
						e.target.find('input').focus();
						hizliStokPart.comboBox_preventPopupFlag = true;
						setTimeout(() => hizliStokPart.comboBoxWidget.close(), 100);
						setTimeout(() => hizliStokPart.comboBoxWidget.close(), 250);
						setTimeout(() => hizliStokPart.comboBoxWidget.close(), 350);
						setTimeout(() => { hizliStokPart.comboBoxWidget.close(); delete hizliStokPart.comboBox_preventPopupFlag }, 450)
					},
					args: [{ target }]
				})
			}
		}
		async hizliCari_itemSelected(e) {
			let _e = { kosulTip: ['FY', 'SB'], kapsam: { tarih: today(), cari: e.id } }; const {kapsam} = _e, cariRec = this.hizliCariPart.selectedRec;
			if (cariRec != null) {
				const {tipKod, bolgeKod, kosulGrupKod} = cariRec;
				if (tipKod != null) { kapsam.cariTip = tipKod }
				if (bolgeKod != null) { kapsam.cariBolge = bolgeKod }
				if (kosulGrupKod != null) { kapsam.cariKosulGrup = kosulGrupKod }
			}
			const plasiyerKod = sky.app.defaultPlasiyerKod; if (plasiyerKod) { kapsam.plasiyer = plasiyerKod }
			this.satisKosulYapilari = await CETSatisKosul.tip2KosulYapilari(_e); if (this.isReady) { await this.tazele(); this.focusToDefault() }
			return true
		}
		async hizliStok_itemSelected(e) {
			const {app, hizliStokPart} = this, dbMgr = app.dbMgrs.rom_data; let barkodBilgi; let barkod = e.value?.trim();
			if (barkod) {
				let ind = -1; for (const matchStr of ['x', 'X', '*']) { ind = barkod.indexOf(matchStr); if (ind > -1) { break } }
				let carpan; if (ind > -1) { let miktarStr = barkod.substring(0, ind); e.barkod = barkod = barkod.substring(ind + 1); e.carpan = carpan = asFloat(miktarStr) || null }
				barkodBilgi = await this.app.barkodBilgiBelirle({ barkod: barkod, carpan: carpan });
				/*if (!barkodBilgi) { displayMessage(`(${barkod}) barkodu hatalıdır!`, this.app.appText); return }*/
			}
			if (barkodBilgi) { hizliStokPart.selectedId = barkodBilgi.shKod }
			let stm = await this.stokBilgiStm(e); if (!stm) { return } let rec = this.stokRec = await dbMgr.tekilExecuteSelect({ query: stm });
			if (rec) {
				stm = await this.sonStokBilgiStm(e);
				if (stm) { let _recs = await dbMgr.executeSqlReturnRows({ query: stm }); if (_recs) { this.sonStokRecs = _recs } }
				if (barkodBilgi) { $.extend(rec, barkodBilgi) }
			}
			await this.tazele(); this.focusToDefault(); return true
		}
		async liste_islemTusuTiklandi(e) {
			const elm = e.event.currentTarget; const id = e.id || (elm || {}).id;
			switch (elm.id) { case 'barkod': this.barkodIstendi(e); break }
		}
		sec(e) { }
		async barkodIstendi(e) {
			e = e || {}; const {layout} = this, barkodContainer = layout.find(`#barkodContainer`);
			let barcodeReader = this.barcodeReader; if (!barcodeReader) {
				const deviceClass = CETBarkodDevice.defaultDeviceClass; if (!deviceClass) { return }
				barcodeReader = this.barcodeReader = new deviceClass({
					content: barkodContainer, debug: this.app.class.isDebug, onKamerami: this.app.onKamerami,
					readCallback: e => { const barkod = e.result; this.hizliStokPart.text = barkod; this.hizliStok_itemSelected({ value: barkod }); this.focusToDefault() }
				})
			}
			if (!barcodeReader.initFlag || barcodeReader.isReady) {
				let handler = this.events.barcodeReaderBeforeActivated; if (handler) { handler.call(this, { sender: this, barcodeReader }) }
				await barcodeReader.start()
			}
			else {
				await barcodeReader.destroy();
				let handler = this.events.barcodeReaderDeactivated; if (handler) { handler.call(this, { sender: this, barcodeReader }) }
			}
			let elm = e.event?.currentTarget;
			if (elm) { elm = $(elm); elm.removeClass(`ready paused running`); elm.addClass(barcodeReader.state); }
			this.focusToDefault()
		}
	}
})()
