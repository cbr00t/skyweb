(function() {
	window.SkyCafeZHesaplasmaPart = class extends window.SkyCafeWindowPart {
		constructor(e) {
			e = e || {};
			super(e);

			this.editableBelirtecSet = asSet(this.editableBelirtecListe || []);
			this.zKapansinmi = asBool(e.zKapansinmi);
			
			/*$.extend(this, {
				aktifMasaID: e.aktifMasaID || this.app.aktifMasaID,
				hedefMasaID: e.hedefMasaID || null
			});*/
		}

		static get partName() { return 'zHesaplasma' }
		get defaultTitle() { return `Z Hesaplaşma` }
		/*get templatesParent() { return this.parentPart.templates }*/
		get autoFocus_uiSelector() { return `#listeParent liste` }
		// get autoHeight_uiSelector() { return `#masalarFormParent` }
		get autoHeight_uiSelector() { return null }
		get defaultIsModal() { return false }
		get defaultCanCollapseByTitle() { return true }
		get klavyeAcilirmi() { return false }
		get numKlavyeAcilirmi() { return true }

		get editableBelirtecListe() {
			return [/*`posTeslim`, `yemekCekTeslim`,*/ `kasadaKalan`]
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
			const {zAcikmi} = app;
			wndContent.find(`#btnTamam`)[zAcikmi ? 'removeClass' : 'addClass'](`jqx-hidden`);

			this.templates = wndContent.find(`#templates`);
			
			const divIslemTuslariEk = wndContent.find(`#islemTuslari-ek`);
			const btnYazdir = divIslemTuslariEk.find(`#yazdir`);
			btnYazdir.jqxButton({ theme: theme });
			btnYazdir.on('click', evt =>
				this.yazdir($.extend({}, e, { event: evt })));
			
			const chkZKapansinParent = wndContent.find(`#chkZKapansinParent`);
			if (zAcikmi) {
				const chkZKapansin = this.chkZKapansin = chkZKapansinParent.find(`#chkZKapansin`);
				chkZKapansin.on('change', evt => {
					const flag = this.zKapansinmi = chkZKapansin.prop('checked');
					chkZKapansinParent[flag ? 'addClass' : 'removeClass'](`checked`);
				});
				chkZKapansin.prop('checked', this.zKapansinmi);
				wndContent.find(`#chkZKapansin_etiket`).on('mouseup, touchend', evt =>
					chkZKapansin.click());
			}
			else {
				chkZKapansinParent.addClass(`jqx-hidden`);
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

			if (!this.app.zAcikmi) {
				displayMessage(`Z Kapalıdır, işlem yapılamaz`, `@ Z Kapalı @`);
				return false;
			}

			const {listeWidget, editableBelirtecSet} = this;
			let recs = null;
			if (listeWidget) {
				recs = [];
				const _recs = listeWidget.getRows() || [];
				for (let i in _recs) {
					i = asInteger(i);
					let rec = _recs[i];
					rec = rec ? rec.originalRecord || rec : null;
					if (rec) {
						const {belirtec} = rec;
						if (belirtec /*&& editableBelirtecSet[belirtec]*/)
							recs.push(rec);
					}
				}
			}
			/*if ($.isEmptyObject(recs)) {
				displayMessage(`Kaydedilecek bilgi yok`, `@ ${this.title || this.defaultTitle} @`);
				return false;
			}*/
			$.extend(e.args, {
				zKapansinmi: this.zKapansinmi,
				recs: recs
			});

			const {app} = this;
			const dbMgr = app.dbMgr_mf;
			let {tx} = e;
			const hasTx = !!tx;
			const {zBilgi} = app;
			const {zNo, zSayac} = zBilgi;

			const del = new MQIliskiliDelete({
				from: `data_ZHesaplasma`,
				where: [
					{ degerAta: zNo, saha: `zNo` }
				]
			});
			const hvListe = [];
			for (let i in recs) {
				i = asInteger(i);
				const rec = recs[i];
				hvListe.push({
					kayitzamani: Utils.asReverseDateTimeString(asDate(rec.kayitzamani) || now()),
					gonderildi: typeof rec.gonderildi == 'boolean' ? bool2FileStr(rec.gonderildi) : (rec.gonderildi || ''),
					zNo: zNo,
					zSayac: zSayac || null,
					seq: (i + 1),
					belirtec: rec.belirtec,
					aciklama: rec.aciklama || '',
					bedel: rec.bedel == null ? null : rec.bedel,
					olasiBedel: rec.olasiBedel == null ? null : rec.olasiBedel
				});
			}

			if (!hasTx)
				tx = await dbMgr.getTx();
			await dbMgr.executeSql({ tx: tx, query: del });
			if (!$.isEmptyObject(hvListe)) {
				await dbMgr.insertOrReplaceTable({
					tx: tx, table: `data_ZHesaplasma`,
					mode: 'insertIgnore', hvListe: hvListe
				});
			}
			if (!hasTx)
				tx = await dbMgr.getTx();
			
			// delete app.zHesaplasma;
			return true;
		}
	
		wndArgsDuzenle(e) {
			super.wndArgsDuzenle(e);

			const {args} = e;
			const {position} = this;
			$.extend(args, {
				// width:  $(window).width(),
				width: $(window).width() > 800 ? 780 : $(window).width(),
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
		
		/*toplamTazele(e) {
			const {listeWidget} = this;
			if (listeWidget == null)
				return;

			const {app, wndContent} = this;
			let toplamGiren = 0, toplamCikan = 0;
			const recs = listeWidget.getRows();
			for (const i in recs) {
				let rec = recs[i];
				rec = rec.originalRecord || rec;
				const giren = bedel(rec.giren) || 0;
				const cikan = bedel(rec.cikan) || 0;
				if (giren && giren > 0)
					toplamGiren += giren;
				if (cikan && cikan > 0)
					toplamCikan += cikan;
			}
			this.toplamGiren = bedel(toplamGiren);
			this.toplamCikan = bedel(toplamCikan);
			wndContent.find(`#toplamParent #toplamGiren`)
				.html(`${bedelStr(toplamGiren)} TL`);
			wndContent.find(`#toplamParent #toplamCikan`)
				.html(`${bedelStr(toplamCikan)} TL`);
		}*/

		initListe(e) {
			e = e || {};
			const {app, wndContent} = this;
			const divListe = wndContent.find(`#listeParent #liste`);
			const listePart = this.listePart = new DataTablePart({
				content: wndContent.find(`#listeParent`),
				layout: divListe,
				loadServerData: e =>
					this.getDataSource(e),
				bindingComplete: e => {
					const {editableBelirtecSet} = this;
					const {widget} = e;
					const recs = widget.getRows();
					for (const i in recs) {
						let rec = recs[i];
						rec = rec.originalRecord || rec;
						const {belirtec} = rec;
						if (!editableBelirtecSet[belirtec])
							widget.lockrowbykey(rec.uid);
					}
				},
				widgetBeforeInit: _e => {
					$.extend(_e.widgetArgs, {
						editable: app.zAcikmi,
						width: false, serverProcessing: false, columnsHeight: 33,
						sortable: true, pageable: false, pageSize: 8, pagerHeight: 40,
						filterable: true, filterHeight: 33 , filterMode: 'default',
						selectionMode: 'singlerow', /*selectionMode: 'none',*/
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
					{ dataField: 'zNo', hidden: true, editable: false, filterable: false, sortable: false },
					{ dataField: 'seq', hidden: true, editable: false, filterable: false, sortable: false },
					{ dataField: 'belirtec', hidden: true, editable: false, filterable: false, sortable: false },
					{
						dataField: 'aciklama', text: 'Açıklama', width: 300, align: 'left', cellsAlign: 'left', editable: false,
						cellClassName: (rowIndex, columnField, value, rec) => {
							let belirtec = (rec || {}).belirtec || '';
							if (belirtec == '-')
								belirtec = 'separator';
							let result = `detay aciklama ${belirtec}`;
							/*if (!this.editableBelirtecSet[belirtec])
								result += ` disabled`;*/
							if (rec.ekCSS)
								result += ` ${rec.ekCSS}`;
							return result;
						}
					},
					{
						dataField: 'bedel', text: 'Bedel', width: 200, align: 'left', cellsAlign: 'right', cellsFormat: 'n',
						cellClassName: (rowIndex, columnField, value, rec) => {
							let belirtec = (rec || {}).belirtec || '';
							if (belirtec == '-')
								belirtec = 'separator';
							let result = `detay bedel ${belirtec}`;
							if (!this.editableBelirtecSet[belirtec])
								result += ` disabled`;
							if (rec.ekCSS)
								result += ` ${rec.ekCSS}`;
							return result;
						},
						cellsRenderer: (rowIndex, columnField, value, rec) => {
							const belirtec = (rec || {}).belirtec || '';
							if (belirtec == '-' || belirtec.endsWith('Sayi'))
								return value;
							if (belirtec.endsWith('TS'))
								return dateTimeToString(asDate(value));
							return value ? `${value} TL` : ``;
						},
						validation: (cell, value) => {
							value = asFloat(value) || 0;
							if (value < 0)
								return { result: false, message: `Bedel değeri 0'dan küçük olamaz` };
							return true
						}
					},
					{
						dataField: 'olasiBedel', text: 'Olası Bedel', width: 200, align: 'left', cellsAlign: 'right',
						cellsFormat: 'n', editable: false, 
						cellClassName: (rowIndex, columnField, value, rec) => {
							let belirtec = (rec || {}).belirtec || '';
							if (belirtec == '-')
								belirtec = 'separator';
							let result = `detay olasiBedel ${belirtec} disabled`;
							/*if (!this.editableBelirtecSet[rec.belirtec])
								result += ` disabled`;*/
							if (rec.ekCSS)
								result += ` ${rec.ekCSS}`;
							return result;
						},
						cellsRenderer: (rowIndex, columnField, value, rec) => {
							const belirtec = (rec || {}).belirtec || '';
							if (belirtec == '-' || belirtec.endsWith('Sayi') || belirtec.endsWith('TS'))
								return value;
							return value ? `${value} TL` : ``;
						},
						validation: (cell, value) => {
							value = asFloat(value) || 0;
							if (value < 0)
								return { result: false, message: `Bedel değeri 0'dan küçük olamaz` };
							return true
						}
					}
				]
			});
			listePart.basicRun();
			this.listeWidget = listePart.widget;
			this.listeTazele(e);
			// setTimeout(() => this.toplamTazele(e), 300);
		}

		listeTazele(e) {
			delete this.listeRecs;
			const {listePart} = this;
			if (listePart)
				return listePart.tazele(e);
		}

		async getDataSource(e) {
			const {app} = this;
			const dbMgr = app.dbMgr_mf;
			const {tx} = e;
			
			let {listeRecs} = this;
			if (listeRecs == null) {
				const sent = new MQSent({
					from: `data_ZHesaplasma har`,
					where: [
						{ degerAta: app.zNo, saha: `har.zNo` }
					],
					sahalar: [
						`har.kayitzamani`, `har.gonderildi`, `har.zNo`, `har.seq`, `har.aciklama`, `har.belirtec`, `har.bedel`, `har.olasiBedel`
					]
				})
				const stm = new MQStm({
					sent: sent,
					orderBy: [`seq`]
				});
				const rs = await dbMgr.executeSql({ tx: tx, query: stm });
				listeRecs = this.listeRecs = [];
				const belirtec2Rec = this.belirtec2Rec = {};
				// const {editableBelirtecSet} = this;
				for (let i = 0; i < rs.rows.length; i++) {
					const rec = rs.rows[i];
					const {belirtec} = rec;
					if (belirtec /*&& editableBelirtecSet[belirtec]*/) {
						rec.kayitzamani = asDate(rec.kayitzamani) || null;
						rec.gonderildi = asBool(rec.gonderildi);
						rec.seq = asInteger(rec.seq) || (i + 1);
						rec.aciklama = rec.aciklama || '';
						rec.bedel = rec.bedel == null ? null : rec.bedel;
						rec.olasiBedel = rec.olasiBedel == null ? null : rec.olasiBedel;
						listeRecs.push(rec);
						if (belirtec != '-')
							belirtec2Rec[belirtec] = rec;
					}
				}
			}

			return listeRecs;
		}

		liste_onItemClick(e) {
			// this.toplamTazele(e);

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
			const {listeWidget} = this;
			const evt = e.event;
			const uid = evt.args.key;
			const rec = listeWidget.rowsByKey[uid];
			if (rec) {
				const {belirtec} = rec;
				if (this.editableBelirtecSet[belirtec])
					return true;
			}

			evt.preventDefault();
			listeWidget.endroweditbykey(uid);
		}

		liste_cellEndEdit(e) {
			const {listeWidget} = this;
			const keys = ['bedel'];
			const recs = listeWidget.getRows();
			for (const i in recs) {
				let rec = recs[i];
				delete rec['null'];
				rec = rec.originalRecord || rec;
				for (const j in keys) {
					const key = keys[j];
					let value = rec[key];
					if (value != null && typeof value != 'string' && typeof value != 'number') {
						value = asFloat(value) || null;
						rec[key] = value;
					}
				}

				let seq = rec.seq = asInteger(rec.seq);
				if (!seq)
					seq = rec.seq = null;
			}

			const uid = e.uid || ((e.event || {}).args || {}).key;
			let rec = e.rec || uid == null ? null : listeWidget.rowsByKey[uid];
			rec = rec ? rec.originalRecord || rec : rec;
			if (!rec)
				return;
			
			$.extend(rec, {
				kayitzamani: now(),
				gonderildi: false
			});
			
			const {belirtec2Rec} = this;
			const {belirtec} = rec;
			switch (belirtec) {
				case 'posTeslim':
				case 'yemekCekTeslim':
				case 'kasadaKalan':
					belirtec2Rec.giderTeslimToplam.bedel = (
						((belirtec2Rec.oncedenNakit || {}).bedel || 0) +
						((belirtec2Rec.posTeslim || {}).bedel || 0) +
						((belirtec2Rec.yemekCekTeslim || {}).bedel || 0) +
						((belirtec2Rec.giderler || {}).bedel || 0)
					);
					belirtec2Rec.nakitKalan.bedel = (
						((belirtec2Rec.girdiToplam || {}).bedel || 0) -
						((belirtec2Rec.giderTeslimToplam || {}).bedel || 0)
					);
					belirtec2Rec.nakitTeslimEdilecek.bedel = (
						((belirtec2Rec.nakitKalan || {}).bedel || 0) -
						((belirtec2Rec.kasadaKalan || {}).bedel || 0)
					);
					break;
			}

			setTimeout(() => {
				listeWidget.beginUpdate();
				listeWidget.endUpdate();
			}, 10);

			// this.toplamTazele(e);
		}

		yazdir(e) {
			e = e || {};
			const {listeWidget, app, templates} = this;
			const {exportSettings} = listeWidget;
			exportSettings.fileName = null;
			
			let exportData = listeWidget.exportData('html');
			if (!exportData)
				return false;
			
			exportData = exportData.html ? exportData : $(exportData);
			
			const tsTextConverter = value =>
				value ? asDate(value).toString(`dd/MM HH:mm`) : null;
			
			const zBilgi = app.zBilgi || {};
			const recs = listeWidget.getRows();
			const kapanisTSIndex = recs.findIndex(rec => rec.belirtec == `bitTS`);
			const zTSTextListe = [];
			if (zBilgi.basTS)
				zTSTextListe.push(tsTextConverter(zBilgi.basTS));
			if (recs[kapanisTSIndex].bedel)
				zTSTextListe.push(tsTextConverter(recs[kapanisTSIndex].bedel));
			if (kapanisTSIndex > -1)
				exportData.find(`tr:eq(${kapanisTSIndex + 1})`).remove();				// ilk satır header
			
			$.each(exportData.find(`tr`), (_, tr) => {
				const tdLen = tr.querySelectorAll(`td, th`).length;
				for (let i = tdLen - 1; i >= 2; i--)
					tr.children[i].remove();
				
				const cellBedel = tr.children[1];
				if (cellBedel.tagName.toUpperCase() == 'TD')
					cellBedel.innerText = bedel(cellBedel.innerText) || 0 ? `${bedelStr(bedel(cellBedel.innerText))} TL` : ``;
			});

			const printLayout = templates.contents(`.printLayout`).clone(true);
			printLayout.find(`#zNo`).html(zBilgi.zNo.toLocaleString());
			if ($.isEmptyObject(zTSTextListe))
				printLayout.find(`#zTSParent`).remove();
			else
				printLayout.find(`#zTS`).html(zTSTextListe.join(` -> `));
			printLayout.find(`#exportData`).html(exportData);
			printExportData(printLayout);
			
			return true;
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
