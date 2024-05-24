(function() {
	window.CETRBKGirisPart = class extends window.CETSubPart {
		/*
		  son stok gösterim:   ( shkod + yerkod => (desen + renk + beden) için sum(miktar) )
			son stok toggle  Kapalı => boş hücrelerde placeholder gösterim, yoksa farklı renkte tüm hücrelerde gösterim
		*/
		
		constructor(e) {
			e = e || {};
			super(e);

			const {app, parentPart} = this;
			$.extend(this, {
				fis: e.fis || (parentPart || {}).fis,
				eskiFis: e.eskiFis,
				detay: e.detay,
				tableData: e.tableData || {},
				tamamIslemi: e.tamamIslemi
			});
			this.dbMgr = app.dbMgr_mf;

			const det = this.detay;
			this.bedenKategoriKod = det.bedenKategoriKod || '';
			
			if (!(this.layout || this.template))
				this.template = app.templates.rbkGiris
		}

		static get canDefer() { return true }
		static get canDestroy() { return true }
		static get partName() { return 'cetRBKGiris' }
		get adimText() { return 'RBK Giriş Ekranı' }

		get genelToplam() {
			const {rec_genelToplam} = this;
			return rec_genelToplam ? rec_genelToplam.toplam : null;
		}

		
		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);

			const {app} = sky;
			const layout = e.layout || this.layout;
			const {parentPart} = this;

			const islemTuslari = this.islemTuslari = layout.find('.asil.islemTuslari');
			islemTuslari.children('button').jqxButton({ theme: theme });
			islemTuslari.removeClass('jqx-hidden');
			
			const btnKaydet = this.btnKaydet = islemTuslari.find('#kaydet');
			btnKaydet.off('click');
			if (this.prefetch || this.isPrefetch) {
				setButonEnabled(btnKaydet, false);
				btnKaydet.jqxButton('disabled', true);
				// btnKaydet.addClass('jqx-hidden');
				islemTuslari.children().addClass('jqx-hidden');
			}
			else {
				btnKaydet.on('click', evt =>
					this.kaydetIstendi($.extend({}, e, { event: evt })));
				// btnKaydet.jqxTooltip({ theme: theme, trigger: `hover`, content: `Belgeyi kaydet` });
			}

			const header = this.header = layout.find('#header');
			const divStokBilgi = this.divStokBilgi = header.find('#stokText');
			const tableToolbar = this.tableToolbar = layout.find('#table-toolbar');
			const tableParent = this.tableParent = layout.find('.tableParent');
			const table = this.table = tableParent.find('#table');

			this.rbkTabloToolbarOlustur(e);

			await this.fetchGlobals(e);
			this.tazele(e);
		}

		async activatePart(e) {
			e = e || {};
			await super.activatePart(e);

			const {islemTuslari} = this;
			islemTuslari.removeClass('jqx-hidden');
			this.tazele(e);
		}

		tazele(e) {
			e = e || {};
			const {dbMgr, fis} = this;
			const det = this.detay;
			const {shKod} = det;
			const yerKod = det.yerKod || fis.yerKod || sky.app.defaultYerKod;

			this.stokBilgiGoster(e);
			
			const stm = CETTicariDetay.getStokRBKQueryStm({ stokKod: shKod, yerKod: yerKod });
			dbMgr.executeSqlReturnRows({ query: stm }).then(recs =>
				this.rbkTabloOlustur($.extend({}, e, { recs: recs })))
		}

		async fetchGlobals(e) {
			const {app, dbMgr} = this;
			const caches = app.caches = app.caches || {};
			if ($.isEmptyObject(caches.desenKod2Rec)) {
				const sent = new MQSent({
					from: 'mst_Desen',
					where: `kod <> ''`,
					sahalar: ['*']
				});
				const cache = caches.desenKod2Rec = caches.desenKod2Rec || {};
				const _recs = await dbMgr.executeSqlReturnRowsBasic({ query: sent });
				for (let i = 0; i < _recs.length; i++) {
					const rec = _recs[i];
					cache[rec.kod] = rec;
				}
			}

			if ($.isEmptyObject(caches.renkKod2Rec)) {
				const sent = new MQSent({
					from: 'mst_Renk',
					where: `kod <> ''`,
					sahalar: ['*']
				});
				const cache = caches.renkKod2Rec = caches.renkKod2Rec || {};
				const _recs = await dbMgr.executeSqlReturnRowsBasic({ query: sent });
				for (let i = 0; i < _recs.length; i++) {
					const rec = _recs[i];
					cache[rec.kod] = rec;
				}
			}

			const asortiKod2Carpan = this.asortiKod2Carpan = {};
			const siraliBedenKodlari = this.siraliBedenKodlari = [];
			const {bedenKategoriKod} = this;
			if (bedenKategoriKod) {
				let stm;
				let sent = new MQSent({
					from: 'mst_BedenKategoriCarpan',
					where: { degerAta: bedenKategoriKod, saha: 'bedenKategoriKod' },
					sahalar: ['asortiKod', 'carpan']
				});
				let _recs = await dbMgr.executeSqlReturnRowsBasic({ query: sent });
				for (let i = 0; i < _recs.length; i++) {
					const rec = _recs[i];
					asortiKod2Carpan[rec.asortiKod] = asFloat(rec.carpan) || 1;
				}
				
				sent = new MQSent({
					from: 'mst_BedenKategoriDetay',
					where: { degerAta: bedenKategoriKod, saha: 'kategoriKod' },
					sahalar: ['abKod']
				});
				stm = new MQStm({
					sent: sent,
					orderBy: ['abTipi DESC', 'seq', 'abKod']
				});
				_recs = await dbMgr.executeSqlReturnRowsBasic({ query: stm });
				for (let i = 0; i < _recs.length; i++) {
					const rec = _recs[i];
					siraliBedenKodlari.push(rec.abKod)
				}
			}
		}

		stokBilgiGoster(e) {
			const {detay, divStokBilgi} = this;
			const {shKod, shAdi} = detay;
			divStokBilgi.html(new CKodVeAdi({ kod: shKod, aciklama: shAdi }).parantezliOzet({ styled: true }));
		}

		rbkTabloToolbarOlustur(e) {
			const {tableToolbar, fis} = this;
			let buttons = tableToolbar.find('button#arttir, button#azalt');
			buttons.jqxRepeatButton({ theme: theme, delay: 50 });
			buttons.on('click', evt => {
				switch (evt.target.id) {
					case 'arttir':
						this.arttirAzaltSifirlaIstendi($.extend({}, e, { event: evt, useTimer: true, artis: 1 }));
						break;
					case 'azalt':
						this.arttirAzaltSifirlaIstendi($.extend({}, e, { event: evt, useTimer: true, artis: -1 }));
						break;
				}
			});
			buttons = tableToolbar.find('button#sifirla');
			buttons.jqxButton({ theme: theme });
			buttons.on('click', evt => {
				switch (evt.target.id) {
					case 'sifirla':
						this.arttirAzaltSifirlaIstendi($.extend({}, e, { event: evt, sifirla: true }));
						break;
				}
			});
			buttons = tableToolbar.find('button.sonXGosterim');
			buttons.jqxToggleButton({ theme: theme /*disabled: !fis.class.sonStokKontrolEdilirmi*/ });
			buttons.on('click', evt => {
				const elm = $(evt.target);
				const id = elm.prop('id');
				const flag = elm.jqxToggleButton('toggled');
				this.sonStokGosterilirmi = this.olasiMiktarGosterilirmi = false;
				switch (id) {
					case 'sonStok': this.sonStokGosterilirmi = flag; break;
					case 'olasiMiktar': this.olasiMiktarGosterilirmi = flag; break;
				}

				const elmOthers = elm.parents('#table-toolbar').find(`button.sonXGosterim:not(#${id})`);
				if (elmOthers.length)
					elmOthers.jqxToggleButton({ toggled: false })
				
				const {tableWidget} = this;
				if (tableWidget)
					tableWidget.refresh()
			});
		}

		rbkTabloOlustur(e) {
			e = e || {};
			const {app, eskiFis} = this;
			let eskiRBKTableData;
			if (eskiFis) {
				const buDetay = this.detay;
				const eskiDetaylar = eskiFis.detaylar;
				const eskiDetay = eskiDetaylar.find(det => det.getAnahtarStr() == buDetay.getAnahtarStr());
				eskiRBKTableData = (eskiDetay || {}).rbkTableData;
			}
			
			const initTableData = {};
			const {recs} = e;
			const tableData = this.tableData || {};
			const bedenSet = this.bedenSet = {};
			const anah2Rec = this.anah2Rec = {};
			for (let i = 0; i < recs.length; i++) {
				const rec = recs[i];
				const {desenKod, renkKod} = rec;
				let beden = rec.asortiVeyaBeden;
				if (!beden || beden == '0' || beden == '0.0')
					beden = '';
				const miktar = ((tableData[desenKod] || {})[renkKod] || {})[beden] || 0;
				
				const subTableData = initTableData[desenKod] = initTableData[desenKod] || {};
				const beden2Miktar = subTableData[renkKod] = subTableData[renkKod] || {};
				beden2Miktar[beden] = miktar;
				bedenSet[beden] = true;
				const anah = this.getAnahtar({ desenKod: desenKod, renkKod: renkKod, beden: beden });
				anah2Rec[anah] = rec;

				let {sonStok, olasiMiktar} = rec;
				if (eskiRBKTableData) {
					const eskiSubTableData = eskiRBKTableData[desenKod] || {};
					const eskiBeden2Miktar = eskiSubTableData[renkKod] || {};
					const eskiMiktar = eskiBeden2Miktar[beden];
					if (eskiMiktar) {
						const dusecek = eskiMiktar * eskiFis.class.sonStokKatSayi;
						sonStok -= dusecek;
						olasiMiktar -= dusecek;
						rec.sonStok = sonStok;
						rec.olasiMiktar = olasiMiktar
					}
				}
			}

			const {desenKod2Rec, renkKod2Rec} = app.caches;
			const {asortiKod2Carpan} = this;
			const gridData = this.gridData = [];
			const rec_genelToplam = this.rec_genelToplam = {
				_grupmu: true, _genelToplammi: true,
				renkAdi: 'TOPLAM =>'
			};
			gridData.push(rec_genelToplam);
			const recs_desenToplam = this.recs_desenToplam = {};
			for (const desenKod in initTableData) {
				const subTableData = initTableData[desenKod];
				if (!subTableData)
					continue;

				const desenAdi = (desenKod2Rec[desenKod] || {}).aciklama;
				const rec_desenToplam = {
					_grupmu: true, _desenSatirimi: true,
					desenKod: desenKod,
					renkAdi: desenAdi || desenKod || '- Desensiz -'
				};
				recs_desenToplam[desenKod] = rec_desenToplam;
				gridData.push(rec_desenToplam);
				for (const renkKod in subTableData) {
					const rec = {
						_bedenSet: {},
						desenKod: desenKod || '',
						renkKod: renkKod,
						renkAdi: (renkKod2Rec[renkKod] || {}).aciklama || renkKod
					};
					let yatayToplam = 0;
					const beden2Miktar = subTableData[renkKod];
					for (let beden in beden2Miktar) {
						if (!beden || beden == '0' || beden == '0.0')
							beden = '';
						const carpan = asortiKod2Carpan[beden] || 1;
						const miktar = beden2Miktar[beden] || 0;
						rec[beden] = miktar;
						rec_desenToplam[beden] = (rec_desenToplam[beden] || 0) + miktar;
						rec_genelToplam[beden] = (rec_genelToplam[beden] || 0) + miktar;
						yatayToplam += (miktar * carpan);
						rec._bedenSet[beden] = true;
					}
					rec.toplam = yatayToplam;
					rec_desenToplam.toplam = (rec_desenToplam.toplam || 0) + yatayToplam;
					rec_genelToplam.toplam = (rec_genelToplam.toplam || 0) + yatayToplam;
					gridData.push(rec);
				}
			}

			for (let i = 0; i < 5; i++)
				gridData.push({ _disabled: true });

			const cellsClassNameHandler = (rowIndex, dataField, value, recInfo) => {
				const {tableWidget} = this;
				const rec = tableWidget.getrowdata(rowIndex);
				if (rec.subItems)
					return;
				
				let result = `${dataField}`;
				const isDisabled = rec._disabled;
				const grupmu = rec._grupmu;
				const desenSatirimi = rec._desenSatirimi;
				const isEditable = !isDisabled && !grupmu && (rec._bedenSet || {})[dataField];
				if (grupmu) {
					result += ' grup';
					if (rec._genelToplammi)
						result += ' genelToplam';
					if (desenSatirimi)
						result += ' desenSatiri'
				}
				else if (!isEditable)
					result += ' grid-readOnly';
				else if (rec._degistimi)
					result += ' degisti';

				if (!grupmu) {
					const {fis} = this;
					if ((this.sonStokGosterilirmi || this.olasiMiktarGosterilirmi) /*&& fis.class.sonStokKontrolEdilirmi*/) {
						value = asInteger(value);
						const sonStokVeyaOlasiMiktar = this.getSonStokVeyaOlasiMiktar(rec, dataField);
						if (sonStokVeyaOlasiMiktar != null & value > sonStokVeyaOlasiMiktar)
							result += ' red';
					}
				}
				
				return result
			};
			
			const jqxGridCols = [
				{
					dataField: '_rowNumber', text: '', width: 25,
					editable: false, cellClassName: '_rowNumber grid-readOnly',
					align: 'center', cellsAlign: 'right',
					cellsRenderer: (rowIndex, columnField, value, html, jqxCol, rec) =>
						changeTagContent(html, (asInteger(rowIndex) + 1).toLocaleString())
				},
				{
					dataField: 'desenKod', text: 'Desen Kod',
					editable: false, hidden: true
				},
				{
					dataField: 'renkKod', text: 'Renk Kod',
					editable: false, hidden: true
				},
				{
					editable: false,
					dataField: 'renkAdi', text: ' ', width: 130, align: 'center',
					cellClassName: cellsClassNameHandler,
					cellsRenderer: (rowIndex, columnField, value, html, jqxCol, rec) => {
						if (rec._desenSatirimi) {
							const desenRec = (app.caches.desenKod2Rec[rec.desenKod]) || {};
							const {resimData, resimContentType} = desenRec;
							if (resimData) {
								const search = 'style="';
								const replace = `style="color: whitesmoke; backdrop-filter: drop-shadow(4px 7px 8px black); min-height: 100px; background-color: #00000033; background-repeat: repeat; background-size: 100px 100px; background-image: url('data:${resimContentType};base64,${resimData}');`;
								html = html.replace(search, replace);
							}
						}
						else if (!rec._grupmu) {
							html = this.htmlRenkIcinDuzenlenmis({ html: html, rec: rec });
						}
						
						return html;
					}
				},
				/*{
					dataField: '_empty1', text: ' ', minWidth: 1, width: 5, align: 'center',
					editable: false, filterable: false,
					cellClassName: '_empty grid-readOnly'
				},*/
				{
					dataField: 'toplam', text: 'Top.', width: 45,
					align: 'center', cellsAlign: 'center',
					editable: false, cellClassName: 'toplam grid-readOnly',
					cellsRenderer: (rowIndex, columnField, value, html, jqxCol, rec) =>
						value ? html : ''
					// aggregates: ['sum']
				}
			];
			
			const bedenKolonEkle = beden => {
				jqxGridCols.push({
					dataField: beden || '', text: (beden || ' ').toString(), width: 45,
					editable: true, columnType: 'input',
					align: 'center', cellsAlign: 'center',
					cellClassName: cellsClassNameHandler,
					cellsRenderer: (rowIndex, columnField, value, html, jqxCol, rec) => {
						if (!value)
							html = changeTagContent(html, '');
						
						if (!rec._grupmu) {
							// html = this.htmlRenkIcinDuzenlenmis({ html: html, rec: rec });
							
							if (!value) {
								const {fis} = this;
								if ((this.sonStokGosterilirmi || this.olasiMiktarGosterilirmi) /*&& fis.class.sonStokKontrolEdilirmi*/) {
									const sonStokVeyaOlasiMiktar = this.getSonStokVeyaOlasiMiktar(rec, columnField);
									let newHTML = '';
									if (sonStokVeyaOlasiMiktar)
										newHTML += `<div class="sonStokVeyaOlasiMiktar"><span class="_veri">${sonStokVeyaOlasiMiktar}</span></div>`
									if (newHTML)
										html = changeTagContent(html, newHTML)
								}
							}
						}

						return html;
					},
					cellBeginEdit: (rowIndex, dataField, inputType) => {
						const {tableWidget} = this;
						const rec = tableWidget.getrowdata(rowIndex);
						const isEditable = !rec._disabled && !rec._grupmu && (rec._bedenSet || {})[dataField];
						if (!isEditable)
							return false;
					},
					cellEndEdit: (rowIndex, dataField, inputType, cellValue, editValue) => {
						const {tableWidget} = this;
						tableWidget.clearselection();
						tableWidget.selectcell(rowIndex, dataField);
					},
					initEditor: (rowIndex, value, editor, cellText, pressedChar) => {
						editor.attr('type', 'number');
						editor.attr('min', 0);
						editor.css('text-align', 'center');
						if (!asInteger(editor.val()))
							editor.val('')
						setTimeout(() => editor.select(), 50)
					},
					getEditorValue: (rowIndex, value, editor) =>
						asInteger(editor.val().replace(',', '.')),
					validation: (e, value) => {
						value = asInteger(value) || 0;
						if (value < 0)
							return { result: false, message: 'Miktar >= 0 olmalıdır'};
						
						const {fis, tableWidget, app} = this;
						app.hideNotifications();
						if (this.sonStokGosterilirmi /*&& fis.class.sonStokKontrolEdilirmi*/) {
							const rowIndex = e.row == null ? e.rowindex : e.row;
							const {datafield} = e;
							const sonStokVeyaOlasiMiktar = this.getSonStokVeyaOlasiMiktar(tableWidget.getrowdata(rowIndex), datafield);
							if (sonStokVeyaOlasiMiktar != null && value > sonStokVeyaOlasiMiktar) {
								displayMessage(`Son Stok (<b class="red">${value - sonStokVeyaOlasiMiktar}</b> adet) aşıldı!`)
								// return { result: null, message: `Son Stok (<b class="red">${value - sonStok}</b> adet) aşıldı` }
							}
						}
						return true
					}
					// aggregates: ['sum']
				});
			};
			
			const {siraliBedenKodlari} = this;
			const bedenKodlari = this.bedenKodlari = [];
			const bedenKodlariSet = this.bedenKodlariSet = {};
			const _bedenKodlari = [];
			for (const bedenKod of siraliBedenKodlari) {
				if (bedenSet[bedenKod] && !bedenKodlariSet[bedenKod]) {
					bedenKodlariSet[bedenKod] = true;
					_bedenKodlari.push(bedenKod)
				}
			}
			let asortiVarmi = false;
			for (const beden of _bedenKodlari) {
				if (asortiKod2Carpan[beden]) {
					asortiVarmi = true;
					bedenKodlariSet[beden] = true;
					bedenKodlari.push(beden);
					bedenKolonEkle(beden)
				}
			}
			if (asortiVarmi) {
				jqxGridCols.push({
					dataField: '_empty2', text: ' ', minWidth: 1, width: 5, align: 'center',
					editable: false, filterable: false,
					cellClassName: '_empty grid-readOnly'
				})
			}
			for (const beden of _bedenKodlari) {
				if (!asortiKod2Carpan[beden]) {
					bedenKodlariSet[beden] = true;
					bedenKodlari.push(beden);
					bedenKolonEkle(beden)
				}
			}

			const {table} = this;
			let {tableWidget} = this;
			if (tableWidget) {
				table.jqxGrid({ columns: jqxGridCols });
				tableWidget.updatebounddata()
			}
			else {
				const _e = {
					theme: theme, localization: localizationObj, width: '100%', height: '100%',
					autoHeight: false, autoRowHeight: false, rowsHeight: 35, altRows: false,
					columnsResize: false, columnsReorder: false, columnsMenu: false, sortable: false,
					editable: true, editMode: 'selectedcell', groupsExpandedByDefault: true,
					groupable: true, showGroupsHeader: false, filterable: true, filterMode: 'default', showFilterRow: false,
					groupIndentWidth: 35, groupsHeaderHeight: 35, selectionMode: 'multiplecellsextended',
					pageable: false, pagermode: 'advanced', adaptive: false, virtualMode: false,
					updatedelay: 10, scrollbarsize: 20,
					renderGridRows: e =>
						e.data.slice(e.startindex, e.startindex + e.endindex),
					/*groupsRenderer: (text, group, expanded, groupInfo) => {
						const {tableWidget} = this;
						const {level} = groupInfo;
						const subRecs = (level == 0 ? groupInfo.subGroups[0] : groupInfo).subItems;
						const key2Toplam = { toplam: 0 };
						for (const rec of subRecs) {
							const keys = ['toplam'];
							keys.push(...Object.keys(rec._bedenSet || {}));
							for (const key of keys) {
								const value = asFloat(rec[key]) || 0;
								if (value)
									key2Toplam[key] = (key2Toplam[key] || 0) + value;
							}
						}
						
						const sortedKeys = Object.keys(key2Toplam).filter(x => x != 'toplam').sort();
						sortedKeys.unshift('toplam');
						
						let result = `<div class="group-text">${group}</div><div class="toplamText">`;
						for (const key of sortedKeys) {
							const toplam = key2Toplam[key] || 0;
							groupInfo[key] = toplam;
							result += `<span class="group-${key} item"><span class="_etiket">${key}:</span> <span class="_veri">${toplam.toLocaleString()}</span></span>`;
						}
						result += `</div>`
						
						return `<div class="grid-cell-group flex-row" data-level="${level}">${result}</div>`
					},*/
					columns: jqxGridCols,
					source: new $.jqx.dataAdapter(
						{
							dataType: defaultOutput,
							url: `empty.json`
						}, {
							async: true,
							updaterow: (rowIndex, rec, commit) => {
								rec._degistimi = true;
								commit(true)
							},
							loadServerData: async (wsArgs, source, callback) => {
								let result = await this.gridData;
								if (result) {
									if ($.isArray(result))
										result = { totalrecords: result.length, records: result }
									
									if (typeof result == 'object') {
										if (result.records && !result.totalrecords)
											result.totalrecords = result.records.length
										callback(result)
									}
								}
							}
						})
				};
				table.jqxGrid(_e);
				tableWidget = this.tableWidget = table.jqxGrid('getInstance');

				table.on('cellclick', evt => {
					const {args} = evt;
					const {datafield} = args;
					if (datafield == '_rowNumber') {
						const {tableWidget} = this;
						const {rowindex} = args;
						const {columns} = tableWidget;
						setTimeout(() => {
							tableWidget.beginupdate();
							tableWidget.clearselection();
							for (let i = 1; i < columns.records.length; i++) {
								const {datafield} = columns.records[i];
								tableWidget.selectcell(rowindex, datafield);
							}
							tableWidget.endupdate()
						}, 10)
					}
				});
				table.on('columnclick', evt => {
					const {tableWidget} = this;
					const {datafield} = evt.args;
					setTimeout(() => {
						tableWidget.beginupdate();
						tableWidget.clearselection();
						for (let i = 0; i < tableWidget.getrecordscount(); i++)
							tableWidget.selectcell(i, datafield);
						tableWidget.endupdate()
					}, 10)
				});
				table.on('cellvaluechanged', evt => {
					const {tableWidget, asortiKod2Carpan} = this;
					const {args} = evt;
					const rowIndex = args.rowindex;
					const dataField = args.datafield;
					const rec = tableWidget.getrowdata(rowIndex);
					if (!rec._grupmu) {
						const bedenSet = rec._bedenSet;
						if (bedenSet && bedenSet[dataField]) {
							const beden = dataField;
							const yatayCarpan = asortiKod2Carpan[beden] || 1;
							
							let yatayToplam = rec.toplam;
							const newValue = asFloat(args.newvalue) || 0;
							const oldValue = asFloat(args.oldvalue) || 0;
							const fark = (newValue - oldValue);
							yatayToplam = rec.toplam = (yatayToplam + (fark * yatayCarpan));
							tableWidget.setcellvalue(rowIndex, 'toplam', yatayToplam);

							const {desenKod} = rec;
							const {rec_genelToplam, recs_desenToplam} = this;
							const rec_desenToplam = (recs_desenToplam || {})[desenKod];
							if (rec_genelToplam) {
								tableWidget.setcellvalue(rec_genelToplam.boundindex, 'toplam', (rec_genelToplam.toplam || 0) + (fark * yatayCarpan));
								tableWidget.setcellvalue(rec_genelToplam.boundindex, beden, ((rec_genelToplam[beden] || 0) + fark));						// !! dikeyde yatayCarpan olmaz
							}
							if (rec_desenToplam) {
								tableWidget.setcellvalue(rec_desenToplam.boundindex, 'toplam', ((rec_desenToplam.toplam || 0) + (fark * yatayCarpan)));
								tableWidget.setcellvalue(rec_desenToplam.boundindex, beden, ((rec_desenToplam[beden] || 0) + fark));						// !! dikeyde yatayCarpan olmaz
							}

							/*const _recs = tableWidget.getboundrows();
							for (let i = 0; i < _recs.length; i++) {
								const _rec = _recs[i];
								if (_rec._grupmu) {
									if (_rec._genelToplammi || _rec.desenKod == rec.desenKod) {
										tableWidget.setcellvalue(i, 'toplam', (_rec.toplam || 0) + (fark * yatayCarpan));
										tableWidget.setcellvalue(i, beden, ((_rec[beden] || 0) + fark));		// !! dikeyde yatayCarpan olmaz
									}
								}
							}*/
						}
					}
				});
			}

			setTimeout(() => {
				tableWidget.pincolumn('_rowNumber');
				tableWidget.pincolumn('renkAdi');
			}, 20);

			// table.jqxGrid('groups', ['_genelToplamSatiri', '_desenText']);

			this.onResize();
		}

		getSonStok(rec, _beden) {
			return (this.getSonStokVeOlasiMiktar(rec, _beden) || {}).sonStok
		}

		getOlasiMiktar(rec, _beden) {
			return (this.getSonStokVeOlasiMiktar(rec, _beden) || {}).olasiMiktar
		}

		getSonStokVeyaOlasiMiktar(rec, _beden) {
			if (this.sonStokGosterilirmi)
				return this.getSonStok(rec, _beden)
			if (this.olasiMiktarGosterilirmi)
				return this.getOlasiMiktar(rec, _beden)
			return null
		}

		getSonStokVeOlasiMiktar(rec, _beden) {
			const _rec = this.getOriginalRecord(rec, _beden) || {};
			return _rec ? ({ sonStok: _rec.sonStok, olasiMiktar: _rec.olasiMiktar }) : null
		}

		getOriginalRecord(rec, _beden) {
			if (!rec)
				return null;

			const {anah2Rec} = this;
			if (!anah2Rec)
				return null;
			
			const anah = this.getAnahtar(rec, _beden);
			return anah2Rec[anah]
		}

		getAnahtar(e, _beden) {
			return e ? `${e.desenKod || ''}|${e.renkKod || ''}|${_beden || e.beden || e.bedenKod || ''}` : null
		}

		htmlRenkIcinDuzenlenmis(e) {
			let {html} = e;
			if (!html)
				return html;

			const {renkKod} = e.rec || {};
			if (!renkKod)
				return html;
				
			const recRenk = (this.app.caches.renkKod2Rec[renkKod] || {});
			const {renk, renk2} = recRenk;
			if (renk) {
				const textRenk = Utils.getContrastedColor(renk, '#ffffff', null);
				const search = 'style="';
				let replace = `style="background: `;
				if (renk2 && renk != renk2)
					replace += `linear-gradient(270deg, ${renk2} 5%, ${renk} 70%) !important;`;
				else
					replace += `${renk};`;
				
				if (textRenk)
					replace += ` color: ${textRenk};`;
				html = html.replace(search, replace);
			}

			return html;
		}

		arttirAzaltSifirlaIstendi(e) {
			e = e || {};
			const {tableWidget, bedenKodlariSet} = this;
			if (!tableWidget)
				return;

			let {editcell} = tableWidget;
			if (editcell) {
				tableWidget.endcelledit(editcell.row, editcell.datafield, true);
				tableWidget.selectcell(editcell.row, editcell.datafield);
			}

			const {sifirla, useTimer} = e;
			if (sifirla || !useTimer)
				return this.arttirAzaltSifirlaIstendiDevam(e);

			const {target} = e.event;
			const buttonText = target.innerHTML;
			if (!this.currentButtonText)
				this.currentButtonText = buttonText;
			let {timer_arttirAzalt} = this;
			if (timer_arttirAzalt) {
				const {artis} = e;
				const ekArtis = this.ekArtis = (this.ekArtis || 0) + artis;
				const topArtis = (artis + ekArtis);
				const buttonText = (topArtis > 0 ? '+' : '') + topArtis.toString();
				if (target.innerHTML != buttonText)
					target.innerHTML = buttonText;
				clearTimeout(timer_arttirAzalt);
				delete this.timer_arttirAzalt
			}
			timer_arttirAzalt = this.timer_arttirAzalt = setTimeout(e => {
				try { this.arttirAzaltSifirlaIstendiDevam(e) }
				catch (ex) { console.error(ex); throw ex; }
				finally {
					delete this.ekArtis;
					delete this.timer_arttirAzalt;
					
					const {target} = e.event;
					const {currentButtonText} = this;
					if (target.innerHTML != currentButtonText)
						target.innerHTML = currentButtonText;
					delete this.currentButtonText;
				}
			}, 100, e)
		}
		
		arttirAzaltSifirlaIstendiDevam(e) {
			const {tableWidget} = this;
			if (!tableWidget)
				return;

			// console.debug(e.artis + (this.ekArtis || 0));
			
			const recs = tableWidget.getboundrows();
			const selectedCells = tableWidget.getselectedcells();
			const selectedEditableCells = [];
			for (const cell of selectedCells) {
				const {datafield, rowindex} = cell;
				/*if (!bedenKodlariSet[datafield])
					continue;*/
				const rec = recs[rowindex];
				if (rec._grupmu || rec._disabled)
					continue

				const {_bedenSet} = rec;
				if (_bedenSet && _bedenSet[datafield])
					selectedEditableCells.push(cell)
			}

			if ($.isEmptyObject(selectedEditableCells))
				return

			//const hasManyCells = selectedEditableCells.length > 1;
			const {sifirla} = e;
			let artis = sifirla ? null : (e.artis + (this.ekArtis || 0));
			const scrollPos = tableWidget.scrollposition();
			//if (hasManyCells)

			const {app} = this;
			app.hideNotifications();
			
			tableWidget.beginupdate();
			for (const cell of selectedEditableCells) {
				let value = sifirla
							? null
							: ((asInteger(tableWidget.getcellvalue(cell.rowindex, cell.datafield)) || 0) + artis) || null;
				if (value == null || value >= 0) {
					tableWidget.setcellvalue(cell.rowindex, cell.datafield, value);
					// tableWidget.showvalidationpopup(cell.rowindex, cell.datafield, value);

					if (selectedEditableCells.length == 1) {
						const col = tableWidget.getcolumn(cell.datafield);
						if (col && $.isFunction(col.validation)) {
							setTimeout(() => {
								const _result = col.validation(cell, value) || {};
								if (!_result.result && _result.message)
									tableWidget.showvalidationpopup(cell.rowindex, cell.datafield, _result.message);
							}, 100);
						}
					}
				}
			}
			//if (hasManyCells)
			tableWidget.endupdate();
			tableWidget.scrollto(scrollPos.left, scrollPos.top);
		}

		async kaydetIstendi(e) {
			e = e || {};
			const {tamamIslemi} = this;
			let result;
			if (tamamIslemi) {
				const {tableWidget, bedenKodlari, parentPart, fis, detay} = this;
				const tableData = {};
				const recs = tableWidget.getboundrows();
				for (const rec of recs) {
					if (rec._disabled || rec._grupmu)
						continue;
					
					const {desenKod, renkKod} = rec;
					const subTableData = tableData[desenKod] || {};
					const beden2Miktar = subTableData[renkKod] || {};
					for (const bedenKod of bedenKodlari) {
						const miktar = rec[bedenKod];
						if (miktar)
							beden2Miktar[bedenKod] = miktar;
					}
					if (!$.isEmptyObject(beden2Miktar)) {
						subTableData[renkKod] = beden2Miktar;
						if (!tableData.desenKod)
							tableData[desenKod] = subTableData;
					}
				}
				
				detay.miktar = this.genelToplam;
				detay.rbkTableData = tableData;
				if (detay.detayEkIslemler)
					detay.detayEkIslemler({ fis: fis, satisKosulYapilari: (parentPart || {}).satisKosulYapilari });
				
				result = getFuncValue.call(this, tamamIslemi, { sender: this, fis: fis, detay: detay, tableData: tableData })
			}
				
			await this.geriIstendiNoCallback();
			return result;
		}

		async onResize(e) {
			await super.onResize(e);

			const {app, header, tableParent, tableWidget} = this;
			const activePartLayout = (app.activePart || {}).layout;
			if (this.isDestroyed || this.isPrefetch || app.activePart != this || !tableWidget)
				return;

			const appHeaderHeight = app.header && app.header.length ? app.header.height() : 0;
			tableParent.height($(window).height() - header.height() - appHeaderHeight - 90);
			try {
				tableWidget.beginupdate();
				tableWidget.endupdate();
			}
			catch (ex) { }
		}
	}
})()
