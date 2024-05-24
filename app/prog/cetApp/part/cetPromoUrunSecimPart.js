(function() {
	window.CETPromoUrunSecimPart = class extends window.CETListeOrtakPart {
		/*
			let grupKod = `1`;
			let part = new CETPromoUrunSecimPart({
				kaydedince: e => resolve(e.recs),
				sonStokKontrolEdilirmi: true,
				proDetaylar: [{
					proKod: `p1`,
					proAdi: `falanca promosyon`,
					proSHGrupKod: grupKod,
					proSHGrupAdi: `PİLİÇ`,
					miktar: 10
				}],
				stokStmDuzenleyici: e => {
					const grupKodClause = e.grupKodClause || `${e.alias}.grupKod`;
					e.stm.sentDo(sent => {
						sent.where
							.degerAta(grupKod, grupKodClause);
					});
				}
			});
			part.run();
		*/

		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				editable: e.editable == null ? true : asBool(e.editable),
				// sonStokKontrolEdilirmi: e.sonStokKontrolEdilirmi == null ? this.app.sonStokKontrolEdilirmi : e.sonStokKontrolEdilirmi,
				sonStokKontrolEdilirmi: e.sonStokKontrolEdilirmi == null ? false : e.sonStokKontrolEdilirmi,
				stokStmDuzenleyici: e.stokStmDuzenleyici,
				fis: e.fis,
				asilDetay: e.asilDetay,
				proDetaylar: e.proDetaylar,
				promosyonlar: e.promosyonlar,
				kaydedince: e.kaydedince,
				idSaha: ''
			});

			if (!(this.layout || this.template))
				this.template = this.app.templates.cetPromoUrunSecim;
		}

		static get partName() { return 'cetPromoUrunSecim' }
		get adimText() { return 'Promosyon Seçim Ekranı' }


		async preInitLayout(e) {
			e = e || {};
			await super.preInitLayout(e);

			const layout = e.layout || this.layout;
			const templates = this.templates = $.extend(this.templates || {});
			
			const editForm = layout.find(`.editForm`);
			$.extend(this, {
				editForm: editForm,
				divHizliStok: editForm.find(`.hizliStok`)
			});

			const {sonStokKontrolEdilirmi} = this;
			const hizliStokWidget = this.hizliStokWidget = new CETMstComboBoxPart({
				parentPart: this,
				content: this.divHizliStok,
				placeHolder: 'Ürün Adı veya Barkod',
				listeSinif: CETStokListePart,
				table: 'mst_Stok',
				idSaha: 'kod', adiSaha: 'aciklama',
				events: {
					comboBox_itemSelected: async e => {
						const rec = this.selectedRec;
						if (rec) {
							let _rec = e.rec;
							let barkod = (e.value || '').trim();;
							let barkodBilgi;
							if (barkod) {
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

									// barkod veya stok kod için ürün bul ve sonucu 'rec' gibi kullan
								barkodBilgi = await this.app.barkodBilgiBelirle({ barkod: barkod, carpan: carpan });
								if (!barkodBilgi) {
									displayMessage(`(${barkod}) barkodu hatalıdır!`, this.app.appText);
									return;
								}
								_rec = barkodBilgi;
							}

							$.extend(rec, {
								shKod: _rec.kod || _rec.shKod,
								shAdi: _rec.aciklama || _rec.shAdi
							});
							this.degistir({ rec: rec });
						}
					},
					comboBox_stmDuzenleyici: async e => {
						const fis = this.fis || (this.parentPart || {}).fis;
						let _e = { alias: 'mst', fis: fis, yerKod: (fis || {}).yerKod || this.app.defaultYerKod };
						let sent = (await CETStokTicariDetay.getStokEkBilgiStm(_e)).sent;
						let stm = e.stm;
						stm.sentDo(_sent =>
							sent.where.birlestir(_sent.where));
						stm.sent = sent;

						_e = { stm: stm, alias: 'mst', shKodClause: `mst.kod`, grupKodClause: `mst.grupKod` };
						if (this.sonStokKontrolEdilirmi)
							this.app.stmSentDuzenle_sonStokBagla(_e);
						
						let handler = this.stokStmDuzenleyici;
						if ($.isFunction(handler))
							handler.call(this, _e);
						
						return stm;
					},
					liste_stmDuzenleyici: e => {
						return true;
					},
					listedenSec_ekArgs: {
						fis: this.fis || (this.parentPart || {}).fis,
						sonStokKontrolEdilirmi: sonStokKontrolEdilirmi,
						sonStokFilterDisabled: sonStokKontrolEdilirmi,
						liste_stmDuzenleyici: e => {
							let _e = { stm: e.stm, alias: 'stk', shKodClause: `stk.kod`, grupKodClause: `stk.grupKod` };
							let handler = this.stokStmDuzenleyici;
							if ($.isFunction(handler))
								handler.call(this, _e);
							return true;
						}
					}
				}
			});
		}

		async activatePart(e) {
			e = e || {};
			await super.activatePart(e);
			
			const layout = e.layout || this.layout;
			await this.hizliStokWidget.run();
			await this.detayDegisti(e);

			const islemTuslari = this.islemTuslari = layout.find(`.asil.islemTuslari`);
			islemTuslari.children('button').jqxButton({ theme: theme });
			islemTuslari.removeClass('jqx-hidden');

			const btnKaydet = this.btnKaydet = islemTuslari.find('#kaydet');
			btnKaydet
				.off('click')
				.on('click', evt =>
					this.kaydetIstendi($.extend({}, e, { event: evt })));
			
			const listeSatirIslemTuslari = this.listeSatirIslemTuslari = layout.find(`.listeSatir.islemTuslari`);
			listeSatirIslemTuslari.children('button').jqxButton({ theme: theme });
			listeSatirIslemTuslari.removeClass('jqx-hidden');

			const btnSatirSil = this.btnSatirSil = listeSatirIslemTuslari.find(`#sil`);
			btnSatirSil
				.off('click')
				.on('click', evt =>
					this.liste_islemTusuTiklandi($.extend({}, e, { id: `sil`, event: evt })));

			setTimeout(() => this.focusToDefault(), 200);
			// setTimeout(() => layout.find('#fisNo input').focus(), 200);
			this.degistimi = false;
		}

		async destroyLayout(e) {
			e = e || {};
			const layout = e.layout || this.layout;
			let btnKaydet = this.btnKaydet;
			if (btnKaydet) {
				btnKaydet.detach()
					.appendTo(layout);
			}

			await this.hizliStokWidget.destroyPart();
			return await super.destroyLayout(e);
		}

		async initUrunBilgi(e) {
			const layout = e.layout || this.layout;
			const divBilgi = layout.find(`#urunBilgi`);
			const dbMgr = this.app.dbMgrs.rom_data;
			
			let det = this.asilDetay;
			if (det && det.shKod) {
				$.each(det, (key, value) => {
					let item = divBilgi.find(`.${key}`);
					if (item.length)
						item.html(value);
				});
				divBilgi.removeClass('jqx-hidden');
			}
			else {
				divBilgi.addClass('jqx-hidden');
			}

			const fis = this.fis || (this.parentPart || {}).fis;
			if (fis) {
				await fis.dipHesapla(e);
				const fisToplamParent = layout.find(`#fisToplamParent`);
				const divFisToplam = fisToplamParent.find(`#fisToplam`);
				divFisToplam.html(`${bedelStr(fis.sonucBedel || 0)} TL`);
				fisToplamParent.removeClass(`jqx-hidden`);
			}
		}

		detayDegisti(e) {
			this.initUrunBilgi(e);
		}

		async tazele(e) {
			let result = await super.tazele(e);
			// this.liste_degisti(e);
			this.degistimi = false;

			return result;
		}

		async kaydet(e) {
			const recs = this.proDetaylar = this.listeRecs;
			recs.forEach(rec =>
				delete rec._visible);
			
			e = $.extend({
				sender: this, asilDetay: this.asilDetay, promosyonlar: this.promosyonlar,
				recs: recs
			}, e);
			
			this.focusToDefault();
			
			let result = await this.kaydetOncesiKontrol(e);
			if (result === false)
				return false;
			
			await this.geriIstendiNoCallback();
			
			this.degistimi = false;
			let handler = this.kaydedince;
			if (handler)
				result = await handler.call(this, e);

			return result !== false;
		}

		kaydetOncesiKontrol(e) {
			if (this.editable) {
				const recs = this.listeRecs;
				let index = recs.findIndex(rec => !rec.shKod);
				let rec = recs[index];
				if (index > -1) {
					displayMessage(
						(	`<b>${index + 1}.</b> satırdaki <b>${rec.proKod}${rec.proAdi ? '-' + rec.proAdi : ''}</b>` +
							`${rec.proSHGrupAdi ? ' <b>' + rec.proSHGrupAdi + '</b>' : ''}` +
							` promosyonuna ait <b>Ürün</b> belirtilmelidir` ),
						`! Promosyon Seçimi !`
					);
					return false;
				}
			}

			return true;
		}

		async listeArgsDuzenle(e) {
			await super.listeArgsDuzenle(e);
			
			$.extend(e.listeArgs, {
				editable: false, serverProcessing: false, pageable: true, filterable: true, showToolbar: false,
				pageSize: 10, toolbarHeight: 35, filterHeight: 23, filterMode: 'default'
				//pageSizeOptions: [4, 5, 6, 7, 8, 9, 10, 12, 15, 20]
			});
		}

		async liste_columnsDuzenle(e) {
			await super.liste_columnsDuzenle(e);
			
			$.merge(e.listeColumns, [
				{ dataField: 'shAdi', text: 'Ürün Adı', hidden: true, filterable: true, sortable: false, groupable: false },
				/*{	text: ' ', width: 40,
						editable: false, filterable: false, sortable: false, groupable: false,
						createwidget: (row, column, value, content) => {
							this.liste_initColumnButtons({ content: content })
						},
						initwidget: (row, column, value, content) => {
							this.liste_updateColumnButtons({ content: content, index: row })
						}
					},*/
				{	dataField: 'islemTuslari', text: '', align: 'left', width: 40,
					filterable: false, sortable: false, groupable: false
				},
				{	dataField: 'shKod', text: 'Promosyonlar', align: 'left', filterable: true,
					cellsRenderer: (rowIndex, columnIndex, value, rec) => {
						const divSatir = this.newListeSatirDiv({ cssSubClass: `asil` });
						divSatir.attr('data-index', rowIndex);
						$.each(rec, (key, value) => {
							if (key) {
								let item = divSatir.find(`.${key}`);
								if (item.length)
									item.html(value);
							}
						});
						// const divMiktarParent = divSatir.find(`.miktarBilgiParent`);
						[`kaynakMiktar`, `hedefMiktar`].forEach(key => {
							if (rec[key] != null) {
								rec[key] = asFloat(rec[key]) || 0;
								divSatir.find(`.${key}Parent`).removeClass(`jqx-hidden`)
							}
						});
						if (rec.iskontoKaldirilirmi) {
							const uyariParent = divSatir.find(`.uyariParent`);
							const iskontoYokUyari = uyariParent.find(`.iskontoYokUyari`);
							iskontoYokUyari.removeClass(`jqx-hidden`);
							uyariParent.removeClass(`jqx-hidden`);
						}
						//if (rec.kaynakMiktar || rec.hedefMiktar)
						//	divMiktarParent.removeClass(`jqx-hidden`);
						return divSatir.prop('outerHTML');
					}
				},
				{ dataField: 'proKod', text: 'Promosyon Kodu', hidden: true, filterable: true, sortable: false, groupable: false },
				{ dataField: 'proAdi', text: 'Promosyon Adı', hidden: true, filterable: true, sortable: false, groupable: false },
				{ dataField: 'proSHGrupKod', text: 'Pro. Ürün Grup Kodu', hidden: true, filterable: true, sortable: false, groupable: false },
				{ dataField: 'proSHGrupAdi', text: 'Pro. Ürün Grup Adı', hidden: true, filterable: true, sortable: false, groupable: false },
			]);
		}

		/*liste_renderToolbar(e) {
			const layout = e.layout || this.layout;
			const toolbar = e.listeToolbar;
			let islemTuslari = this.toolbarIslemTuslari;
			if (!islemTuslari) {
				islemTuslari = this.toolbarIslemTuslari = this.newListeSubPart('.toolbar.islemTuslari');
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

			// this.focusToDefault();
		}*/

		async loadServerData(e) {
			let recs = this.proDetaylar;
			e.callback({ totalrecords: recs.length, records: recs });
		}

		focusToDefault() {
			this.setUniqueTimeout({
				key: 'focusToDefault', delayMS: 100, isInterval: false,
				block: e =>
					this.divListe.focus()
			});
		}

		async geriYapilabilirmi(e) {
			if (!await super.geriYapilabilirmi(e))
				return false;
			
			return true;
			
			
			/*if (!this.degistimi)
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
			})*/
		}

		
		async liste_veriYuklendi(e) {
			// this.targetRecUid = (this.listeRecs[0] || {}).uid;
			// this.lastSelectedIndex = 0;
			await super.liste_veriYuklendi(e);
			this.setUniqueTimeout({
				key: 'focusToDefault', delayMS: 10,
				isInterval: false,
				block: e =>
					this.selectFirstRec()
			});
		}

		liste_degisti(e) {
			e = e || {};
			super.liste_degisti(e);
			if (!this.listeReadyFlag)
				return;
			
			this.degistimi = true;
		}

		liste_satirCiftTiklandi(e) {
			// super.liste_satirCiftTiklandi(e);

			if (!this.isEventFired_satirCifTiklandi) {
				this.isEventFired_satirCifTiklandi = true;
				return;
			}
			
			// return this.degistirIstendi();
		}

		liste_satirSecildi(e) {
			e = e || {};
			const lastSelectedIndex = e.lastSelectedIndex || this.lastSelectedIndex;
			
			super.liste_satirSecildi(e);
			
			if (!(this.listeReadyFlag) /*|| this.lastSelectedIndex == lastSelectedIndex*/)
				return;
			
			const listeWidget = this.listeWidget;
			let rec = this.selectedRec;
			const selectedIndex = this.selectedIndex;
			const td = listeWidget.clickedTD
							? $(listeWidget.clickedTD)
							: selectedIndex != null && selectedIndex > -1
								? listeWidget._getuirow(selectedIndex).find(`td`)
								: null;
			const divSatir = td && td.length ? td.find(`.listeSatir`) : null;
			const {hizliStokWidget} = this;
			if (!(divSatir && divSatir.length))
				return;
			
			if (this.editable && hizliStokWidget && hizliStokWidget.comboBox && hizliStokWidget.comboBox.length) {
				const {editForm, divHizliStok} = this;
				let placeHolder = hizliStokWidget.originalPlaceHolder || '';
				if (rec.shKod)
					placeHolder = `${rec.shKod}` + (rec.shAdi ? `-${rec.shAdi}` : ``);
				hizliStokWidget.comboBox.jqxComboBox('placeHolder', placeHolder);
				editForm.css('top', divSatir.offset().top + divSatir.parent().height());
				editForm.removeClass(`jqx-hidden`);
				hizliStokWidget.focusToDefault();
			}

			const listeSatirIslemTuslari = this.listeSatirIslemTuslari;
			if (listeSatirIslemTuslari && listeSatirIslemTuslari.length) {
				listeSatirIslemTuslari.css('top', divSatir.offset().top);
				listeSatirIslemTuslari.removeClass(`jqx-hidden`);
			}
		}

		liste_satirSecimKaldirildi(e) {
			e = e || {};
			const lastSelectedIndex = e.lastSelectedIndex || this.lastSelectedIndex;
			super.liste_satirSecimKaldirildi(e);
			
			const listeWidget = this.listeWidget;
			const editForm = this.editForm;
			if (editForm && editForm.length)
				editForm.addClass(`jqx-hidden`);
			
			const listeSatirIslemTuslari = this.listeSatirIslemTuslari;
			if (listeSatirIslemTuslari && listeSatirIslemTuslari.length)
				listeSatirIslemTuslari.addClass(`jqx-hidden`);
		}

		async liste_islemTusuTiklandi(e) {
			const elm = (e.event || {}).currentTarget;
			const id = e.id || elm.id;

			// let rec = this.selectedRec;
			// displayMessage(`<ul style="padding: 8px;"><li>clicked: [${elm.innerHTML}]</li><li>activeRec: [(${(rec || {}).kod}) - ${(rec || {}).unvan}]</li>`);
			// displayMessage(`<ul style="padding: 8px;"><li>clicked: [<b>${elm.id}</b> - ${elm.innerHTML}]</li><li>activeRec: [(${(rec || {}).shKod}) - ${(rec || {}).shAdi}]</li>`);
			switch (elm.id) {
				case 'sil':
					this.silIstendi(e);
					break;
				case 'filter':
					this.liste_toggleFilterBar(e);
			}
		}

		async kaydetIstendi(e) {
			return await this.kaydet(e);
		}

		async silIstendi(e) {
			e = e || {};

			const listeWidget = this.listeWidget;
			let editingIndex = this.editingRowIndex;
			if (editingIndex != null) {
				try { listeWidget.endRowEdit(editingIndex, false) }
				catch (ex) { }
			}
			
			const recs = this.listeRecs;
			let rec = editingIndex ? recs[editingIndex] : this.selectedRec;
			rec.bedel = 0;
			this.sil({ rec: rec });

			this.focusToDefault();

			if ($.isEmptyObject(this.listeRecs))
				await this.kaydetIstendi();
		}
	}
})()
