(function() {
	window.CETNumaratorListePart = class extends window.CETListeOrtakPart {
		constructor(e) {
			e = e || {};
			super(e);

			if (!(this.layout || this.template))
				this.template = this.app.templates.numaratorListe;
			
			$.extend(this, {
				dbMgr: CETNumarator.dbMgr,
				secButonuKontrolEdilirmi: false,
				secince: e => this.kaydetIstendi(e)
			});
		}

		static get partName() { return 'cetNumaratorListe' }
		get adimText() { return 'Numaratörler' }
		static get noResizeEvent() { return true }

		
		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);

			const layout = e.layout || this.layout;

			if (this.ozelIslemTuslariPart)
				this.ozelIslemTuslariPart.destroyPart();
			let part = this.ozelIslemTuslariPart = new CETExpandableIslemTuslariPart({
				mode: 'menu',
				position: `bottom right`,
				templateItems: layout.find(`.toolbar-external.islemTuslari-ozel`),
				onItemClicked: e => this.liste_islemTusuTiklandi(e)
			});
			await part.run();

			/*if (this.islemTuslariPart)
				this.islemTuslariPart.destroyPart();
			part = this.islemTuslariPart = new CETExpandableIslemTuslariPart({
				templateItems: layout.find(`.toolbar-external.islemTuslari`),
				onItemClicked: e => this.liste_islemTusuTiklandi(e)
			});
			await part.run();*/
		}


		async listeArgsDuzenle(e) {
			await super.listeArgsDuzenle(e);
			
			$.extend(e.listeArgs, {
				editable: true, pageable: false, showToolbar: false, filterable: true,
				serverProcessing: false, filterMode: 'default',
				editSettings: {
					saveOnPageChange: true, saveOnBlur: true, saveOnSelectionChange: false,
					cancelOnEsc: true, saveOnEnter: true, editSingleCell: true,
					editOnDoubleClick: true, editOnF2: true
				}
				//groups: ['tipText']
			});
		}

		async liste_columnsDuzenle(e) {
			await super.liste_columnsDuzenle(e);
			
			$.merge(e.listeColumns, [
				{	text: 'Tip Kod', dataField: 'tip', hidden: true, filterable: false },
				{
					text: 'Tip', align: 'left', dataField: 'tipText', width: 250,
					editable: false, cellClassName: 'tip disabled'
					/*cellsRenderer: (rowIndex, columnIndex, value, rec) =>
						this.liste_columnsDuzenle_generateCell({
							selector: 'tip', rowIndex: rowIndex, rec: rec, value: rec.tipText
							// getter: e => this.app.mfTipIcinAdiFor(e.value)
						})*/
				},
				{
					text: 'Seri', align: 'left', dataField: 'seri', width: 80,
					cellClassName: 'seri',
					validation: (cell, value) => {
						value = (value || '').toUpperCase();
						if (value.length > 3)
							return { result: false, message: 'Seri 3 haneden uzun olamaz' };
						
						let recs = this.listeRecs;
						// let recs = this.fis.detaylar;
						let _rec = recs[cell.row];
						if (recs.filter(rec => rec.uid != _rec.uid && rec.tip == _rec.tip && rec.ozelIsaret == _rec.ozelIsaret &&  rec.seri == value).length)
							return { result: false, message: 'Bu numaratör Tip ve Serisi tekrarlanıyor' };
						
						return true;
					}
					/*cellsRenderer: (rowIndex, columnIndex, value, rec) =>
						this.liste_columnsDuzenle_generateCell({ selector: 'seri', rowIndex: rowIndex, rec: rec, value: rec.seri })*/
				},
				{
					text: 'Son No', align: 'left', cellsAlign: 'right', cellsFormat: 'n', dataField: 'sonNo', width: 95,
					cellClassName: 'sonNo',
					validation: (cell, value) => {
						value = parseInt(value);
						value = isNaN(value) || value == '' ? null : value;
						if (value != null && !(value >= 0 && value <= 999999999))
							return { result: false, message: 'Son No değeri en fazla 9 hane uzunluğunda bir tamsayı olmalıdır' };
						return true;
					}
					/*cellsRenderer: (rowIndex, columnIndex, value, rec) =>
						this.liste_columnsDuzenle_generateCell({ selector: 'sonNo', rowIndex: rowIndex, rec: rec, value: rec.sonNo })*/
				}
			]);
		}

		loadServerData_buildQuery(e) {
			const {app} = this;
			const wsArgs = $.extend({}, e.wsArgs, { rowCountOnly: e.rowCountOnly });
			wsArgs.filters = this.getFiltersFromListeWSArgs(wsArgs);
			wsArgs.sortdatafield = wsArgs.sortdatafield || ['tip'];	 		/* || ['tarih', 'seri', 'fisno'] */

			let sent = new MQSent({
				from: `const_Numarator num`,
				// where: [`(num.seri <> '' OR (num.seri = '' AND num.sonNo > 0))`],
				sahalar: (e.rowCountOnly
					? `COUNT(*) sayi`
					: [	'num.rowid', 'num.*' ])
			});
			if (!app.ozelIsaretKullanilirmi)
				sent.where.add(`ozelIsaret = ''`);
			
			let stm = new MQStm({ sent: sent });
			stm.fromGridWSArgs(wsArgs);

			return stm;
		}
		
		async loadServerData_ekIslemler(e) {
			let result = await super.loadServerData_ekIslemler(e);
			if (result)
				return result;
			
			/*let hasMatchingFilters = !!(e.wsArgs.filterGroups || []).filter(fg => fg.Field != 'tipText').length;
			let eksikTipSet = {};
			recs.forEach(rec => {
				if (hasMatchingFilters || !(rec.seri && rec.sonNo))
					eksikTipSet[rec.tip] = true;
			});
			
			if (!hasMatchingFilters) {
				app.numaratorOlanFisTipleri.forEach(ka => {
					let tip = ka.kod;
					if (eksikTipSet[tip]) {
						eksikTipSet[tip] = true;
						recs.push({ tip: tip, seri: '', sonNo: 0 });
					}
				});
			}
			let sortDataField = e.wsArgs.sortdatafield;
			if (!hasMatchingFilters && (!sortDataField || sortDataField == 'tipText'))
				recs.sort((a, b) => b.seri ? (a.tip < b.tip ? -1 : 1) : -1);*/
			
			const {app} = this;
			let {recs} = e;
			for (const i in recs) {
				const rec = recs[i];
				$.extend(rec, {
					seri: rec.seri || '',
					sonNo: asInteger(rec.sonNo) || 0
				});
				
				const {tip} = rec;
				if (tip && !rec.tipText) {
					const tipAdi = app.mfTipIcinAdiFor(tip);
					if (tipAdi == null)				// Fiş Tipi bu uygulama için geçersiz olanlar gösterilmez
						delete rec.tip;
					else
						rec.tipText = `${tipAdi}${rec.ozelIsaret || ''}`;
				}
			}
			e.recs = recs = recs.filter(rec => !!rec.tip);
		}

		
		liste_veriYuklendi(e) {
			super.liste_veriYuklendi(e);

			this.listeWidget.sortBy('tipText', true);
		}
		
		liste_satirCiftTiklandi(e) {
			// super.liste_satirCiftTiklandi(e);			
		}

		liste_satirSecimDegisti(e) {
			super.liste_satirSecimDegisti(e);
		}

		liste_satirTiklandi(e) {
			super.liste_satirTiklandi(e);

			this.selectedDataField = e.event.args.dataField;
		}

		liste_satirSecildi(e) {
			// let lastIndex = this.lastSelectedIndex;
			
			super.liste_satirSecildi(e);

			let dataField = this.selectedDataField || 'sonNo';
			let rec = this.selectedRec;
			if (rec) {
				const listeWidget = this.listeWidget;
				if (listeWidget.isBindingCompleted() && !listeWidget.updating()) {
					let editingCell = this.editingCell;
					if (editingCell) {
						try {
							if (!listeWidget._validateEditors(editingCell.dataField)) {
								delete this.editingCell;
								return;
							}
						}
						catch (ex) { }

						try { listeWidget.endRowEdit(editingCell.rowIndex, editingCell.dataField, false) }
						catch (ex) { }
						editingCell = this.editingCell;
					}

					try { listeWidget.beginCellEdit(listeWidget.getrowdisplayindex(rec), dataField) }
					catch (ex) { }
				}
			}
		}

		/*liste_cellBeginEdit(e) {
			super.liste_cellBeginEdit(e);
		}*/

		liste_cellEndEdit(e) {
			super.liste_cellEndEdit(e);
			
			let args = e.event.args;
			if (!args.value)
				return;
			let rec = args.row;
			if (!rec)
				return;

			let key = args.dataField;
			switch (key) {
				case 'seri':
					rec[key] = args.value = (args.value || '').toUpperCase();
					rec.degistimi = true;
					break;
				case 'sonNo':
					rec[key] = args.value = parseInt(args.value);
					rec.degistimi = true;
					break;
			}

			if (rec.degistimi)
				this.listeWidget.updaterowbykey(rec.uid, rec);
		}

		async liste_islemTusuTiklandi(e) {
			let editingCell = this.editingCell;
			if (editingCell) {
				try { listeWidget.endCellEdit(editingCell.rowIndex, editingCell.dataField, false) }
				catch (ex) { }
			}
			
			let elm = e.event.currentTarget;
			switch (elm.id) {
				case 'ekle':
					return this.ekleIstendi(e);
					break;
				case 'sil':
					return this.silIstendi(e);
					break;
			}
		}

		async ekleIstendi(e) {
			e = e || {};
			let rec = e.rec || this.selectedRec;
			let tip = (rec || {}).tip;
			if (!tip) {
				displayMessage(`Lütfen önce bir Numaratör seçiniz !`, this.app.appText);
				return;
			}
			
			const listeWidget = this.listeWidget;
			let _rec = this.listeRecs.find(rec => rec.tip == tip && !rec.seri);
			if (_rec) {
				let ind = listeWidget.getrowdisplayindex(_rec);
				if (ind >= 0)
					listeWidget.selectRow(ind);
				return;
			}

			_rec = rec.deepCopy ? rec.shallowCopy() : $.extend({}, rec);
			['leaf', 'level', 'parent', 'uid', '_visible', ' ', 'rowid'].forEach(key =>
				delete _rec[key]);
			$.extend(_rec, { seri: '', sonNo: 0 })
			listeWidget.addRow(null, _rec);
			let ind = listeWidget.getrowdisplayindex(_rec);
			if (ind >= 0)
				listeWidget.selectRow(ind);
			// listeWidget.refresh();
		}

		async silIstendi(e) {
			e = e || {};
			let rec = e.rec || this.selectedRec;

			const listeWidget = this.listeWidget;
			listeWidget.deleterowbykey(rec.uid);
			this.selectLastRec(e);
			// listeWidget.refresh();
		}

		async kaydetIstendi(e) {
			let result = await this.kaydet(e);
			if (!result)
				return result;
			
			// await this.geriIstendi();
		}

		async kaydet(e) {
			e = e || {};
			const {app} = this;
			// let recs = this.listeRecs.filter(rec => rec.degistimi);
			// let recs = this.getListeRecsKontrollu().filter(rec => rec.seri || rec.sonNo);
			
			const recs = this.listeRecs;
			// let recs = this.fis.detaylar;
			await app.knobProgressReset();
			await app.knobProgressShow({ update: { label: `Numaratörler kaydediliyor...` } });

			const cls = CETNumarator;
			const {dbMgr} = cls;
			let tx = await dbMgr.getTx();
			
			let query = `DELETE FROM const_Numarator`;
			await dbMgr.executeSql({ tx: tx, query: query });

			let result;
			if (!$.isEmptyObject(recs)) {
				const parcaSize = 5;
				let hvListe = recs.map(rec => new cls(rec).hostVars());
				// let hvListe = recs.map(det => det.hostVars());
				
				result = await cls.dbMgr.insertOrReplaceTable({
					tx: tx, mode: 'replace',
					table: cls.table, hvListe: hvListe,
					parcaSize: parcaSize,
					parcaCallback: async e =>
						await app.knobProgressStep(parseInt(100 / ((Math.max(recs.length, 1) * parcaSize) - 2) ))
				});
			}
			setTimeout(() =>
				app.aktarimProgressCompleted({ defer: true, delaySecs: 2, text: `Numaratörler kaydedildi!` }),
				100);
			if (result === false)
				return result;

			return true;
		}
	}
})()
