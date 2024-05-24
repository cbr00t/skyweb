(function() {
	window.SkyCafeMasaTransferPart = class extends window.SkyCafeWindowPart {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				aktifMasaID: e.aktifMasaID || this.app.aktifMasaID,
				hedefMasaID: e.hedefMasaID || null
			});
		}

		static get partName() { return 'masaTransfer' }
		get defaultTitle() { return `Masa Transfer / Adisyon Parçala` }
		get templatesParent() { return this.parentPart.templates }
		get autoFocus_uiSelector() { return `#listeParent liste` }
		// get autoHeight_uiSelector() { return `#masalarFormParent` }
		get autoHeight_uiSelector() { return null }
		get defaultIsModal() { return true }
		get defaultCanCollapseByTitle() { return false }
		get klavyeAcilirmi() { return false }
		
		/*get autoCompleteSelector2ValueGetter() {
			return $.extend(super.autoCompleteSelector2ValueGetter || {}, {
				ekNot: e => (this.aktifDetay || {}).ekNot
			})
		}*/

		close_araIslemler(e) {
			super.close_araIslemler(e);
			
			const {listePart, masalarItemListPart} = this;
			if (listePart) {
				listePart.destroyPart();
				const keys = ['listePart', 'divListe', 'listeWidget'];
				for (const i in keys)
					delete this[keys[i]];
			}
			if (masalarItemListPart) {
				masalarItemListPart.destroyPart();
				const keys = ['masalarItemListPart', 'masalarFormParent', 'masalarForm'];
				for (const i in keys)
					delete this[keys[i]];
			}
			
			const keys = ['aktifMasaID', 'hedefMasaID'];
			for (const i in keys)
				delete this[keys[i]];
		}
		
		async tazeleDevam(e) {
			await super.tazeleDevam(e);
			
			const {app, parentPart, wndContent} = this;
			wndContent.find(`#btnHepsiniSec`)
				.jqxButton({ theme: theme })
				.off('click')
				.on('click', evt =>
					this.hepsiniSecIstendi($.extend({}, e, { event: evt })));
			
			const txtHizliBul = wndContent.find(`#hizliBulForm #txtHizliBul`);
			txtHizliBul.jqxInput({ theme: theme, height: false, maxLength: 40 });
			$(txtHizliBul.jqxInput('input'))
				.on('focus', evt =>
					evt.target.select())
				.on('keyup', evt => {
					const key = (evt.key || '').toLowerCase();
					if (key == 'enter' || key == 'linefeed') {
						this.masalarItemListPart.tazele($.extend({}, e, { event: evt }));
					}
					else {
						this.setUniqueTimeout({
							key: 'hizliBul_onChange',
							delayMS: 500,
							args: $.extend({}, e, { event: evt }),
							block: e =>
								this.masalarItemListPart.tazele($.extend({}, e, { event: evt }))
						})
					}
				});
			
			wndContent.find(`#listeParent`).removeClass(`jqx-hidden`);
			setTimeout(() => this.initListe(e), 200);

			wndContent.find(`#masalarFormParent`).removeClass(`jqx-hidden`);
			setTimeout(() => this.initMasalarItemList(e), 250);

			wndContent.find(`#hizliBulForm`).removeClass(`jqx-hidden`);
		}

		tazeleSonrasi(e) {
			super.tazeleSonrasi(e);

			/*const {wnd, wndContent} = this;
			const sonucParent = wndContent.find(`#sonucParent`);
			wnd.jqxWindow('height', sonucParent.position().top + sonucParent.height() + 23);
			setTimeout(
				() => wndContent.find(`#miktarTam input`).focus(),
				300);*/
		}

		setValues(e) {
			super.setValues(e);

			$.extend(this, {
				aktifMasaID: e.aktifMasaID == null ? this.aktifMasaID : e.aktifMasaID,
				hedefMasaID: e.hedefMasaID == null ? this.hedefMasaID : e.hedefMasaID
			});
		}

		tamamIstendi_argsDuzenle(e) {
			super.tamamIstendi_argsDuzenle(e);

			const {listeWidget} = this;
			let recs = null;
			if (listeWidget) {
				recs = [];
				const _recs = listeWidget.getRows() || [];
				for (const i in _recs) {
					let rec = _recs[i];
					rec = rec ? rec.originalRecord || rec : null;
					if (rec && (rec.alinacakMiktar || 0) > 0) {
						rec.alinacakMiktar = Math.max(Math.min(rec.miktar, rec.alinacakMiktar), 0);
						recs.push(rec);
					}
				}
			}
			$.extend(e.args, {
				aktifMasaID: this.aktifMasaID,
				hedefMasaID: this.hedefMasaID,
				toplam: this.toplam,
				recs: recs
			});
		}
	
		wndArgsDuzenle(e) {
			super.wndArgsDuzenle(e);

			const {args} = e;
			const {position} = this;
			$.extend(args, {
				width:  $(window).width(),
				height: $(window).height() - 60
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
			const {app, wndContent} = this;
			let toplam = 0;
			const {listeWidget} = this;
			if (listeWidget == null)
				return;

			const recs = listeWidget.getRows();
			for (const i in recs) {
				let rec = recs[i];
				rec = rec.originalRecord || rec;
				const {alinacakMiktar, miktar} = rec;
				if (alinacakMiktar) {
					const kismiBedel = bedel((alinacakMiktar / miktar) * (rec.netBedel || 0));
					toplam += kismiBedel;
				}
			}
			this.toplam = bedel(toplam);
			wndContent.find(`#toplam`)
				.html(`${bedelStr(toplam)}`);
		}

		initListe(e) {
			e = e || {};
			const {app, wndContent} = this;
			const divListe = wndContent.find(`#listeParent #liste`);
			const listePart = this.listePart = new DataTablePart({
				content: wndContent.find(`#listeParent`),
				layout: divListe,
				widgetBeforeInit: _e => {
					$.extend(_e.widgetArgs, {
						width: false, serverProcessing: false, columnsHeight: 33,
						sortable: true, pageable: false, pageSize: 15, pagerHeight: 25,
						filterable: true, filterHeight: 38 , filterMode: 'default',
						/*selectionMode: 'singlerow',*/ selectionMode: 'none',
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
											case 'tamaminiAl':
												rec.alinacakMiktar = rec.alinacakMiktar < rec.miktar
																			? rec.miktar
																			: 0;
												listeWidget.beginUpdate();
												listeWidget.endUpdate();
												this.toplamTazele(e);
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
				columns: [
					{
						text: ' ', width: 50, columnType: 'none', align: 'center', cellsAlign: 'center',
						cellClassName: 'islemTuslari',
						cellsRenderer: (rowIndex, columnField, value, rec) => {
							return `<div data-rowindex=${rowIndex} class="gridCell-islemTuslari"><button id="tamaminiAl"></button></div>`
						}
					},
					{
						dataField: 'stokAdi', text: 'Ürün Adı', width: '60%',
						cellClassName: `detay stokAdi`
					},
					{
						dataField: 'miktar', text: 'Satış', width: 90, align: 'left', cellsAlign: 'right', cellsFormat: 'd',
						cellClassName: `detay miktar`
					},
					{
						dataField: 'alinacakMiktar', text: 'Alınacak', width: 90, align: 'left', cellsAlign: 'right', cellsFormat: 'd',
						cellClassName: (rowIndex, columnField, value, rec) => {
							const postfix =
								!rec.alinacakMiktar
									? ` bos`
									: rec.alinacakMiktar < rec.miktar
										? ''
										: ` hepsi`;
							return `detay alinacakMiktar${postfix}`
						}
					}
				],
				widgetAfterInit: _e => {
					const {widgetPart, widget} = _e;
					widgetPart.on('rowClick', evt =>
						this.liste_onItemClick($.extend({}, e, { event: evt })));
					widgetPart.on('rowDoubleClick', evt =>
						this.liste_onItemDblClick($.extend({}, e, { event: evt })));
				},
				loadServerData: e =>
					this.getDataSource(e)
			});
			listePart.basicRun();
			this.listeWidget = listePart.widget;
			this.listeTazele(e);
			setTimeout(() => this.toplamTazele(e), 300);
		}

		async initMasalarItemList(e) {
			const {app, wndContent} = this;
			const itemListPart = this.masalarItemListPart = new SkyCafeItemList({
				content: wndContent,
				hizliBulForm: wndContent.find(`#hizliBulForm`),
				txtHizliBul: wndContent.find(`#hizliBulForm #txtHizliBul`),
				itemFormParent: wndContent.find(`#masalarFormParent`),
				itemForm: wndContent.find(`#masalarFormParent #masalarForm`),
				templateItem: wndContent.find(`#templates`).contents(`.masa.item`),
				idSelector: 'id', aciklamaSelector: 'aciklama',
				defaultFilters: e => {
					const {app, aktifFiltre} = this;
					// const {aktifMasaTipKod} = app;
					const filters = [];
					if (aktifFiltre)
						filters.push(aktifFiltre);
					/*if (aktifMasaTipKod) {
						filters.push(e =>
							e.rec.tipKod == aktifMasaTipKod);
					}*/
					return filters
				},
				dataSource: async e => {
					e = e || {};
					const stm = new MQStm({
						sent: new MQSent({
							from: `${SkyCafeMasa.table} mas`,
							fromIliskiler: [
								{
									alias: `mas`, leftJoin: `${SkyCafeFis.table} fis`,
									iliski: `fis.${SkyCafeFis.idSaha} = mas.aktifFisID`
								}
							],
							where: [
								{ not: !this.app.class.pratikSatismi, degerAta: SkyCafeMasaTip.PratikSatis, saha: `anaTip` }
							],
							sahalar: [
								`mas.rowid`, `mas.*`,
								`fis.aciklama fisAciklama`, `fis.sonislemzamani`, `fis.kapanmazamani`,
								`fis.yazdirildi`, `fis.fisSonuc`
							]
						}),
						orderBy: [
							`mas.anaTip`, `mas.kod`
						]
					});
					const result = [];
					const rs = await SkyCafeMasa.dbMgr.executeSql({ tx: e.tx, query: stm });
					for (let i = 0; i < rs.rows.length; i++) {
						const rec = rs.rows[i];
						const inst = new SkyCafeMasa();
						await inst.setValues({ rec: rec });

						const {aktifFisID} = rec;
						if (aktifFisID) {
							const _rec = {
								id: aktifFisID,
								aciklama: rec.fisAciklama,
								kapanmazamani: rec.kapanmazamani,
								sonislemzamani: rec.sonislemzamani,
								yazdirildi: rec.yazdirildi
							};
							const fis = inst._aktifFis = new SkyCafeFis();
							await fis.setValues({ rec: _rec });
							fis._fisSonuc = rec.fisSonuc;
						}

						result.push(inst);
					}

					return result;
				},
				/*defaultItemDuzenleyici: e =>
					this.listeRenderItem(e),*/
				eventSelector: e =>
					this.masaTiklandi(e)
			});
			await itemListPart.tazele();

			const {aktifMasaID} = this;
			if (aktifMasaID) {
				const divItem = itemListPart.itemForm.find(`.item[data-id="${aktifMasaID}"]`);
				if (divItem.length)
					divItem[0].setAttribute(`data-servisdisi`, '');
			}
		}

		listeTazele(e) {
			delete this.listeRecs;
			const {listePart} = this;
			if (listePart)
				return listePart.tazele(e);
		}

		getDataSource(e) {
			let {app, listeRecs} = this;
			if (listeRecs == null) {
				listeRecs = this.listeRecs = [];
				const detaylar = (app.aktifFis || {}).detaylar;
				for (const i in detaylar) {
					const det = detaylar[i];
					if (!det.silindimi) {
						const _det = det.deepCopy();
						_det.alinacakMiktar = 0;
						listeRecs.push(_det);
					}
				}
			}
			return listeRecs;
		}

		liste_onItemClick(e) {
			const evt = e.event;
			const {args} = evt;
			if (!args.dataField || args.dataField == 'islemTuslari')
				return;
			
			const originalEvent = args.originalEvent || {};
			let rec = args.row;
			if (rec)
				rec = rec.originalRecord || rec;
			
			const {miktar, brm} = rec;
			const fra = this.app.brm2Fra[rec.brm || 'AD'] || 0;
			if (originalEvent.button == 2) {
				if (rec.alinacakMiktar > 0)
					rec.alinacakMiktar--;
				else
					rec.alinacakMiktar = miktar;
			}
			else {
				if (rec.alinacakMiktar < miktar)
					rec.alinacakMiktar++;
				else
					rec.alinacakMiktar = null;
			}
			
			rec.alinacakMiktar = rec.alinacakMiktar || null;
			if (rec.alinacakMiktar != null)
				rec.alinacakMiktar = roundToFra(Math.max(Math.min(miktar, rec.alinacakMiktar), 0), fra)
			
			const {listeWidget} = this;
			listeWidget.beginUpdate();
			listeWidget.endUpdate();
			setTimeout(() => listeWidget.ensurerowvisiblebykey(rec.uid), 5);
			
			this.toplamTazele(e);
		}

		liste_onItemDblClick(e) {
		}

		masaTiklandi(e) {
			const {app, masalarItemListPart} = this;
			const {itemForm, divItem, rec} = e;
			if (rec.servisDisimi || divItem[0].hasAttribute(`data-servisdisi`))
				return;
			
			itemForm.find(`.item.selected`).removeClass(`selected`);
			divItem.addClass(`selected`);
			this.hedefMasaID = rec.id;
		}

		hepsiniSecIstendi(e) {
			const {listeWidget} = this;
			const recs = listeWidget.getRows();
			if ($.isEmptyObject(recs))
				return;

			let hepsiSecilimi = true;
			for (const i in recs) {
				let rec = recs[i];
				rec = rec.originalRecord || rec;
				if (rec.alinacakMiktar < rec.miktar) {
					hepsiSecilimi = false;
					break;
				}
			}

			let degistimi = false;
			for (const i in recs) {
				let rec = recs[i];
				rec = rec.originalRecord || rec;
				if (hepsiSecilimi) {
					if (rec.alinacakMiktar > 0) {
						rec.alinacakMiktar = 0;
						degistimi = true;
					}
				}
				else {
					if (rec.alinacakMiktar < rec.miktar) {
						rec.alinacakMiktar = rec.miktar;
						degistimi = true;
					}
				}
			}
			if (degistimi) {
				listeWidget.beginUpdate();
				listeWidget.endUpdate();
				this.toplamTazele(e);
				// setTimeout(() => listeWidget.ensurerowvisiblebykey(rec.uid), 5);
			}
		}

		async onResize(e) {
			e = e || {};
			const {wnd, wndContent, masalarItemListPart} = this;
			const listeParent = wndContent.find(`#listeParent`);
			listeParent.height(wnd.height() - listeParent.offset().top);

			if (masalarItemListPart)
				masalarItemListPart.onResize(e);
		}
	}
})()
