(function() {
	window.SkyCafeKasiyerIslemleriPart = class extends window.SkyCafeWindowPart {
		constructor(e) {
			e = e || {};
			super(e);

			this.bedelKeys = [
				/*`acilis`, `teslim`,*/ `giren`, `cikan`
			];

			/*$.extend(this, {
				aktifMasaID: e.aktifMasaID || this.app.aktifMasaID,
				hedefMasaID: e.hedefMasaID || null
			});*/
		}

		static get partName() { return 'kasiyerIslemleri' }
		get defaultTitle() { return `Kasiyer İşlemleri` }
		/*get templatesParent() { return this.parentPart.templates }*/
		get autoFocus_uiSelector() { return `#listeParent liste` }
		// get autoHeight_uiSelector() { return `#masalarFormParent` }
		get autoHeight_uiSelector() { return null }
		get defaultIsModal() { return false }
		get defaultCanCollapseByTitle() { return true }
		get klavyeAcilirmi() { return true }
		get numKlavyeAcilirmi() { return true }

		static get tipKAListe() {
			let result = this._tipKAListe;
			if (result == null) {
				result = this._tipKAListe = [
					new CKodVeAdi({ kod: '+', aciklama: 'Açılış' }),
					new CKodVeAdi({ kod: '-', aciklama: 'Teslim' }),
					new CKodVeAdi({ kod: 'B', aciklama: 'Giren' }),
					new CKodVeAdi({ kod: 'A', aciklama: 'Çıkan' }),
					new CKodVeAdi({ kod: 'PS', aciklama: 'POS' }),
					new CKodVeAdi({ kod: 'YM', aciklama: 'Yemek Çeki' }),
					new CKodVeAdi({ kod: 'OS', aciklama: 'Online Satış' }),
					new CKodVeAdi({ kod: 'OI', aciklama: 'Online İndirim' })
				];
			}
			return result;
		}
		static get tip2Aciklama() {
			let result = this._tip2Aciklama;
			if (result == null) {
				result = this._tip2Aciklama = {};
				const {tipKAListe} = this;
				for (const i in tipKAListe) {
					const ka = tipKAListe[i];
					result[ka.kod] = ka.aciklama;
				}
			}
			return result;
		}
		static get aciklama2Tip() {
			let result = this._aciklama2Tip;
			if (result == null) {
				result = this._aciklama2Tip = {};
				const {tipKAListe} = this;
				for (const i in tipKAListe) {
					const ka = tipKAListe[i];
					result[ka.aciklama] = ka.kod;
				}
			}
			return result;
		}
		
		/*get autoCompleteSelector2ValueGetter() {
			return $.extend(super.autoCompleteSelector2ValueGetter || {}, {
				ekNot: e => (this.aktifDetay || {}).ekNot
			})
		}*/

		close_araIslemler(e) {
			super.close_araIslemler(e);
			
			const {listePart} = this;
			if (listePart) {
				listePart.destroyPart();
				const keys = ['listePart', 'divListe', 'listeWidget'];
				for (const i in keys)
					delete this[keys[i]];
			}
			
			/*const keys = ['aktifMasaID', 'hedefMasaID'];
			for (const i in keys)
				delete this[keys[i]];*/
		}
		
		async tazeleDevam(e) {
			await super.tazeleDevam(e);
			
			const {app, parentPart, wndContent} = this;
			
			const btnTamam = wndContent.find(`#btnTamam`);
			const btnEkle = wndContent.find(`#btnEkle`);
			if (app.zAcikmi) {
				btnEkle.jqxButton({ theme: theme });
				btnEkle.on('click', evt => 
					this.ekleIstendi($.extend({}, e, { event: evt })))
				btnEkle.removeClass(`jqx-hidden`);
				btnTamam.removeClass(`jqx-hidden`);
			}
			else {
				btnEkle.addClass(`jqx-hidden`);
				btnTamam.addClass(`jqx-hidden`);
			}
			
			wndContent.find(`#listeParent`).removeClass(`jqx-hidden`);
			setTimeout(() => this.initListe(e), 200);
		}

		tazeleSonrasi(e) {
			super.tazeleSonrasi(e);
		}

		setValues(e) {
			super.setValues(e);

			/*$.extend(this, {
				aktifMasaID: e.aktifMasaID == null ? this.aktifMasaID : e.aktifMasaID,
				hedefMasaID: e.hedefMasaID == null ? this.hedefMasaID : e.hedefMasaID
			});*/
		}

		async tamamIstendi_argsDuzenle(e) {
			e = e || {};
			await super.tamamIstendi_argsDuzenle(e);

			const {app, bedelKeys} = this;
			if (!app.zAcikmi) {
				displayMessage(`Z Kapalıdır, işlem yapılamaz`, `@ Z Kapalı @`);
				return false;
			}

			const {listeWidget} = this;
			let recs = null;
			if (listeWidget) {
				recs = [];
				const _recs = listeWidget.getRows() || [];
				for (let i in _recs) {
					i = asInteger(i);
					let rec = _recs[i];
					rec = rec ? rec.originalRecord || rec : null;
					if (rec) {
						const vioID = rec.vioID || null;
						const {tip} = rec;
						let doluBedelSayi = 0;
						for (const i in bedelKeys) {
							const key = bedelKeys[i];
							const value = asFloat(rec[key]) || 0;
							if (value > 0)
								doluBedelSayi++;
						}

						let errorRowIndex = null;
						let errorMessageBlock;
						if (doluBedelSayi > 1) {
							errorRowIndex = i;
							errorMessageBlock = e =>
								`<p><u><b>${e.targetPageIndex + 1}. sayfa</u> ve <u>${e.targetRowIndex + 1}.</b> satırdaki</u> bilgi girişi hatalıdır.</p><p><b>Giren, Çıkan</b> değerlerinden sadece <u>1 tanesi</u> belirtilebilir</p>`;
						}
						else if (doluBedelSayi == 1) {
							if (!tip) {
								errorRowIndex = i;
								errorMessageBlock = e =>
									`<u><b>${e.targetPageIndex + 1}. sayfa</u> ve <u>${e.targetRowIndex + 1}.</b> satırdaki</u> <b>Tip</b> belirtilmelidir`;
							}
						}

						if (errorRowIndex != null && errorRowIndex > -1) {
							if (listeWidget.pageable) {
								const {pageSize} = listeWidget;
								const targetPageIndex = asInteger(errorRowIndex / pageSize);
								const targetRowIndex = asInteger(errorRowIndex % pageSize);

								listeWidget.goToPage(targetPageIndex);
								listeWidget.selectRow(errorRowIndex);

								if (errorMessageBlock) {
									const _e = { rec: rec, errorRowIndex: errorRowIndex, targetPageIndex: targetPageIndex, targetRowIndex: targetRowIndex };
									let errorText;
									if ($.isFunction(errorMessageBlock))
										errorText = errorMessageBlock.call(this, _e);
									else if (errorMessageBlock.run)
										errorText = errorMessageBlock.run(_e);
									else
										errorText = errorMessageBlock;
																		
									if (errorText)
										displayMessage(errorText, `@ ${this.title || this.defaultTitle} @`);
								}
							}
							return false;
						}
						
						if (vioID || doluBedelSayi)
							recs.push(rec);
					}
				}
			}
			if ($.isEmptyObject(recs)) {
				// displayMessage(`Kaydedilecek bilgi yok`, `@ ${this.title || this.defaultTitle} @`);
				return false;
			}
			$.extend(e.args, {
				toplam: this.toplam,
				recs: recs
			});

			const dbMgr = app.dbMgr_mf;
			let {tx} = e;
			const hasTx = !!tx;
			const {kasiyerKod} = app;

			if (!hasTx)
				tx = await dbMgr.getTx();
			const del = new MQIliskiliDelete({
				from: `data_KasiyerIslem`,
				where: [
					{ degerAta: kasiyerKod, saha: `kasiyerKod` }
				]
			});
			await dbMgr.executeSql({ tx: tx, query: del });
			
			const hvListe = [];
			for (let i in recs) {
				i = asInteger(i);
				const rec = recs[i];
				const hv = {
					kayitzamani: Utils.asReverseDateTimeString(rec.kayitZamani),
					gonderildi: bool2FileStr(rec.gonderildimi),
					silindi: bool2FileStr(rec.silindimi),
					kasiyerKod: kasiyerKod,
					seq: (i + 1),
					vioID: rec.vioID || null,
					aciklama: rec.aciklama || '',
					tip: rec.tip
				};
				for (const i in bedelKeys) {
					const key = bedelKeys[i];
					hv[key] = asFloat(rec[key]) || 0;
				}
				hvListe.push(hv);
			}
			if (!$.isEmptyObject(hvListe)) {
				await dbMgr.insertOrReplaceTable({
					tx: tx, table: `data_KasiyerIslem`,
					mode: 'insertIgnore', hvListe: hvListe
				});
			}
			if (!hasTx)
				tx = await dbMgr.getTx();
			
			// delete app.kasiyerIslemleri;
			return true;
		}
	
		wndArgsDuzenle(e) {
			super.wndArgsDuzenle(e);

			const {args} = e;
			const {position} = this;
			$.extend(args, {
				width:  $(window).width(),
				height: $(window).height() - 60,
				keyboardCloseKey: 'none'
			});
			if (!position) {
				args.position = {
					// x: $(window).width() < 950 ? 'right, top' : $(window).width() - 655,
					x: '',
					y: 48
				};
			}
		}

		initKlavyePart_argsDuzenle(e) {
			super.initKlavyePart_argsDuzenle(e);

			/*$.extend(e.args, {
			});*/
		}
		
		toplamTazele(e) {
			const {listeWidget} = this;
			if (listeWidget == null)
				return;

			const {app, wndContent, bedelKeys} = this;
			let toplam = {};
			for (const i in bedelKeys) {
				const key = bedelKeys[i];
				toplam[key] = 0;
			}

			const recs = listeWidget.getRows();
			for (const i in recs) {
				let rec = recs[i];
				rec = rec.originalRecord || rec;
				for (const i in bedelKeys) {
					const key = bedelKeys[i];
					const value = bedel(rec[key]) || 0;
					if (value && value > 0)
						toplam[key] += value;
				}
			}

			this.toplam = toplam;
			const divToplamParent = wndContent.find(`#toplamParent`);
			for (const i in bedelKeys) {
				const key = bedelKeys[i];
				const value = toplam[key] = bedel(toplam[key]) || 0;

				const divToplam = divToplamParent.find(`#toplam_${key}`)
				if (divToplam.length)
					divToplam.html(value ? `${bedelStr(value)} TL` : ``);
			}
		}

		initListe(e) {
			e = e || {};
			const {app, wndContent} = this;
			const divListe = wndContent.find(`#listeParent #liste`);
			const listePart = this.listePart = new DataTablePart({
				content: wndContent.find(`#listeParent`),
				layout: divListe,
				loadServerData: e =>
					this.getDataSource(e),
				widgetBeforeInit: _e => {
					$.extend(_e.widgetArgs, {
						editable: app.zAcikmi, id: undefined,
						width: false, serverProcessing: false, columnsHeight: 33,
						sortable: true, pageable: true, pageSize: 8, pagerHeight: 40,
						filterable: true, filterHeight: 33 , filterMode: 'default',
						selectionMode: 'singlerow', /*selectionMode: 'none',*/
						rendered: () => {
							const listeWidget = divListe.jqxDataTable('getInstance');
							const buttons = divListe.find(`table.jqx-grid-table tr[role=row] td[role=gridcell] div.gridCell-islemTuslari button`);
							if (buttons.length) {
								buttons
									.jqxButton({ theme: theme })
									.on('click', evt => {
										const elm = evt.currentTarget;
										const parent = elm.parentElement;
										let rowIndex = parent.dataset.rowindex;
										if (rowIndex != null && rowIndex != '')
											rowIndex = asInteger(rowIndex);
										let rec = listeWidget.getRows()[rowIndex];
										rec = rec.originalRecord || rec;
										switch (elm.id) {
											case 'temizle':
												const {bedelKeys} = this;
												let uygunmu = rec.aciklama;
												if (!uygunmu) {
													for (const i in bedelKeys) {
														const key = bedelKeys[i];
														if (rec[key]) {
															uygunmu = true;
															break;
														}
													}
												}

												if (uygunmu) {
													rec.aciklama = rec.tip = '';
													for (const i in bedelKeys) {
														const key = bedelKeys[i];
														rec[key] = null;
													}
													this.liste_cellEndEdit({ event: { args: { key: rec.uid, row: rec, boundIndex: rowIndex }}});
													setTimeout(() => {
														listeWidget.beginUpdate();
														listeWidget.endUpdate();
													}, 10);
													this.toplamTazele(e);
												}
												setTimeout(() => listeWidget.ensurerowvisiblebykey(rec.uid), 5);
												break;
										}
									})
									.on('mouseup', evt => {
										evt.currentTarget.click()
									});
							}
							
							/*const listeWidget = divListe.jqxDataTable('getInstance');
							const trRows = listeWidget.table.find(`table > tbody > tr`);
							const btnSil = trRows.find(`td > #sil`);
							if (btnSil.length) {
								btnSil.jqxButton({ theme: theme })
									.on('click', evt => {
										let index = evt.currentTarget.dataset.rowindex;
										if (index != null) {
											index = asInteger(index);
											this.sil({ index: index });
										}
									});
								btnSil.parent().on('mouseup', evt => {
									const btnSil = evt.currentTarget.querySelector(`#sil`);
									if (btnSil)
										btnSil.click();
								});
							}*/
						}
					})
				},
				/*widgetAfterInit: _e => {
					const {widgetPart, widget} = _e;
				},*/
				itemClick: e =>
					this.liste_onItemClick(e),
				itemDblClick: e =>
					this.liste_onItemDblClick(e),
				cellBeginEdit: e =>
					this.liste_cellBeginEdit(e),
				cellEndEdit: e =>
					this.liste_cellEndEdit(e),
				columns: [
					{
						dataField: 'seq', hidden: true, editable: false, filterable: false, sortable: false
					},
					{	text: '#', width: 40, editable: false, align: 'right', cellsAlign: 'right',
						cellClassName: 'disabled satirNo',
						cellsRenderer: (rowIndex, columnField, value, rec) => {
							return rowIndex.toString();
						}
					},
					{
						text: ' ', width: 50, editable: false, filterable: false, sortable: false,
						columnType: 'none', align: 'center', cellsAlign: 'center',
						cellClassName: 'islemTuslari',
						cellsRenderer: (rowIndex, columnField, value, rec) => {
							return `<div data-rowindex=${rowIndex} class="gridCell-islemTuslari"><button id="temizle"></button></div>`
						}
					},
					{
						dataField: 'aciklama', text: 'Açıklama', align: 'left', cellsAlign: 'left',
						cellClassName: `detay aciklama`,
					},
					/*{
						dataField: 'acilis', text: 'Açılış', width: 200, align: 'left', cellsAlign: 'right', cellsFormat: 'c',
						cellClassName: `detay acilis`,
						validation: (cell, value) => {
							value = asFloat(value) || 0;
							if (value < 0)
								return { result: false, message: `Değer 0'dan küçük olamaz` };
							return true
						}
					},
					{
						dataField: 'teslim', text: 'Teslim', width: 200, align: 'left', cellsAlign: 'right', cellsFormat: 'c',
						cellClassName: `detay teslim`,
						validation: (cell, value) => {
							value = asFloat(value) || 0;
							if (value < 0)
								return { result: false, message: `Değer 0'dan küçük olamaz` };
							return true
						}
					},*/
					{
						dataField: 'tip', text: 'Tip', width: 200, editable: false,
						cellClassName: `detay tip`,
						cellsRenderer: (rowIndex, columnField, value, rec) => {
							const aciklama = this.class.tip2Aciklama[rec.tip] || '';
							return `<span>${aciklama}</span>`
						},
					},
					{
						dataField: 'giren', text: 'Giren', width: 200, align: 'left', cellsAlign: 'right', cellsFormat: 'c',
						cellClassName: `detay giren`,
						validation: (cell, value) => {
							value = asFloat(value) || 0;
							if (value < 0)
								return { result: false, message: `Değer 0'dan küçük olamaz` };
							return true
						}
					},
					{
						dataField: 'cikan', text: 'Çıkan', width: 200, align: 'left', cellsAlign: 'right', cellsFormat: 'c',
						cellClassName: `detay cikan`,
						validation: (cell, value) => {
							value = asFloat(value) || 0;
							if (value < 0)
								return { result: false, message: `Değer 0'dan küçük olamaz` };
							return true
						}
					}
				]
			});
			listePart.basicRun();
			this.listeWidget = listePart.widget;
			this.listeTazele(e);
			setTimeout(() => this.toplamTazele(e), 300);
		}

		listeTazele(e) {
			delete this.listeRecs;
			const {listePart} = this;
			if (listePart)
				return listePart.tazele(e);
		}

		async getDataSource(e) {
			const {app, bedelKeys} = this;
			const dbMgr = app.dbMgr_mf;
			const {tx} = e;
			
			let {listeRecs} = this;
			if (listeRecs == null) {
				const sent = new MQSent({
					from: `data_KasiyerIslem har`,
					where: [
						{ degerAta: app.kasiyerKod, saha: `har.kasiyerKod` }
					],
					sahalar: [
						`har.kayitzamani`, `har.gonderildi`, `har.seq`, `har.tip`, `har.vioID`, `har.aciklama`,
						/*`har.acilis`, `har.teslim`,*/ `har.giren`, `har.cikan`
					]
				})
				const stm = new MQStm({
					sent: sent,
					orderBy: [`seq`]
				});
				const rs = await dbMgr.executeSql({ tx: tx, query: stm });
				listeRecs = this.listeRecs = [];
				for (let i = 0; i < rs.rows.length; i++) {
					const rec = rs.rows[i];
					rec.kayitZamani = asDate(rec.kayitzamani) || null;
					rec.gonderildimi = asBool(rec.gonderildi);
					rec.silindimi = asBool(rec.silindi),
					delete rec.kayitzamani;
					delete rec.gonderildi;

					rec.seq = asInteger(rec.seq) || (i + 1);
					for (const i in bedelKeys) {
						const key = bedelKeys[i];
						rec[key] = asFloat(rec[key]) || null;
					}
					listeRecs.push(rec);
				}

				const MinRowSize = 100;
				if (listeRecs.length < MinRowSize) {
					for (let seq = listeRecs.length + 1; seq <= MinRowSize; seq++)
						listeRecs.push({ seq: seq });
				}
			}

			return listeRecs;
		}

		liste_onItemClick(e) {
			e = e || {};
			const {listeWidget, wndContent} = this;
			const args = e.event ? e.event.args : null;
			if (!args)
				return;
			
			const {dataField, boundIndex} = args;
			let {listeCellEditorParent_tip, listeCellEditor_tip} = this;
			delete this.activeRec;
			if (listeCellEditorParent_tip)
				listeCellEditorParent_tip.addClass(`jqx-hidden`);
			if (listeCellEditor_tip)
				listeCellEditor_tip.jqxDropDownList('close');

			let {clickedTD} = listeWidget;
			let rec = args.row;
			rec = this.activeRec = (rec || {}).originalRecord || rec;
			if (rec && dataField == 'tip') {
				let clickedTD_pos = $(clickedTD).offset();
				if (!clickedTD_pos.top && !clickedTD_pos.left)
					return false;
				
				if (!listeCellEditor_tip) {
					listeCellEditorParent_tip = this.listeCellEditorParent_tip = wndContent.find(`#listeCellEditorParent_tip`);
					listeCellEditor_tip = this.listeCellEditor_tip = listeCellEditorParent_tip.find(`#listeCellEditor_tip`);
					listeCellEditor_tip.jqxDropDownList({
						theme: theme, valueMember: 'kod', displayMember: 'aciklama',
						width: false, height: false,
						autoDropDownHeight: false, dropDownHeight: 270,
						source: new $.jqx.dataAdapter({
							id: `kod`, /*url: `empty.json`, dataType: `json`,*/
							datatype: 'array', localdata: this.class.tipKAListe
						}, { autoBind: false, async: true, cache: true })
					});
					listeCellEditor_tip.on('blur', evt => {
						listeCellEditorParent_tip.addClass(`jqx-hidden`);
						listeCellEditor_tip.jqxDropDownList('close');
						delete this.activeRec;
						this.liste_cellEndEdit(e);
						listeWidget.beginUpdate();
						listeWidget.endUpdate();
					});
				}
				// listeCellEditor_tip.jqxDropDownList({ width: clickedTD.width, height: clickedTD.height });
				if (rec.tip)
					listeCellEditor_tip.val(rec.tip);
				listeCellEditor_tip
					.off('change')
					.on('change', evt => {
						const {activeRec} = this;
						if (activeRec)
							activeRec.tip = this.listeCellEditor_tip.val() || '';
					});
				listeCellEditorParent_tip.css('top', `${clickedTD_pos.top - clickedTD.height}px`);
				listeCellEditorParent_tip.css('left', `${clickedTD_pos.left}px`);
				listeCellEditorParent_tip.css('width', `${clickedTD.style.width}`);
				listeCellEditorParent_tip.css('height', `${clickedTD.style.height}`);
				listeCellEditorParent_tip.removeClass(`jqx-hidden`);
				listeCellEditor_tip.jqxDropDownList('open');
			}
			this.toplamTazele(e);

			//const {listeWidget} = this;
			//setTimeout(() => listeWidget.beginRowEdit(listeWidget.getSelection()[0].uid), 1);

			/*const evt = e.event;
			const {args} = evt;
			if (!args.dataField || args.dataField == 'islemTuslari')
				return;
			
			const {listeWidget} = this;
			listeWidget.beginUpdate();
			listeWidget.endUpdate();
			setTimeout(() => listeWidget.ensurerowvisiblebykey(rec.uid), 5);
			
			this.toplamTazele(e);*/
		}

		liste_onItemDblClick(e) {
		}

		liste_cellBeginEdit(e) {
		}

		liste_cellEndEdit(e) {
			e = e || {};
			const {fromKlavye} = e;
			const {args} = (e.event || {}) || {};
			const {dataField} = args;
			const {listeWidget, bedelKeys} = this;
			const recs = listeWidget.getRows();
			for (const i in recs) {
				let rec = recs[i];
				delete rec['null'];
				rec = rec.originalRecord || rec;
				for (const j in bedelKeys) {
					const key = bedelKeys[j];
					let value = rec[key];
					if (value != null && typeof value != 'number') {
						value = asFloat(value) || null;
						rec[key] = value;
					}
				}

				/*
				let rec = e.rec || args.row;
				if (!rec) {
					const index = e.boundIndex || e.index || args.boundIndex || args.index;
					if (index != null && index > -1)
						rec = recs[index];
					else {
						const uid = e.uid || args.uid || args.key;
						if (uid)
							rec = listeWidget.rowsByKey[uid];
					}
				}
				rec = (rec || {}).originalRecord || rec;*/
				const {tip} = rec;
				const bedel = bedelKeys.includes(dataField) ? rec[dataField] : (rec.cikan || rec.giren);
				if (bedel != null) {
					rec.giren = rec.cikan = null;
					switch (tip) {
						case '+':						// Açılış
						case 'B':						// Giren
							rec.giren = bedel;
							break;
						default:						// Teslim, Çıkan ... ve diğerleri
							rec.cikan = bedel;
							break;
					}
				}

				let seq = rec.seq = asInteger(rec.seq);
				if (!seq)
					seq = rec.seq = null;
			}

			let rec = e.rec || args.row;
			if (!rec) {
				const index = e.boundIndex || e.index || args.boundIndex || args.index;
				if (index != null && index > -1)
					rec = recs[index];
				else {
					const uid = e.uid || args.uid || args.key;
					if (uid)
						rec = listeWidget.rowsByKey[uid];
				}
			}
			rec = (rec || {}).originalRecord || rec;
			if (rec) {
				rec.kayitZamani = now();
				rec.gonderildimi = false;

				let silindimi = true;
				for (const i in bedelKeys) {
					const key = bedelKeys[i];
					const value = asFloat(rec[key]) || 0;
					if (value > 0) {
						silindimi = false;
						break;
					}
				}
				rec.silindimi = silindimi;
			}

			if (fromKlavye) {
				setTimeout(() => {
					listeWidget.beginUpdate();
					listeWidget.endUpdate();
				}, 10);
			}
			
			this.toplamTazele(e);
		}

		async ekleIstendi(e) {
			const {app, listeWidget} = this;
			const _rec = listeWidget.getSelection()[0];
			const rowIndex = _rec ? listeWidget.getrowindex(_rec) : null;
			listeWidget.beginUpdate();
			for (let i = 0; i < 5; i++) {
				const rec = {};
				listeWidget.addRow(undefined, rec, rowIndex != null && rowIndex > -1 ? rowIndex : 'last');
				rec.seq = rec.uid;
				delete rec['undefined'];
			}
			listeWidget.endUpdate();
		}

		async onResize(e) {
			e = e || {};
			const {wnd, wndContent} = this;
			if (!(wnd && wndContent && wndContent.length))
				return;
			
			const listeParent = wndContent.find(`#listeParent`);
			listeParent.height(wnd.jqxWindow('height') - listeParent.position().top - 8);
		}
	}
})()
