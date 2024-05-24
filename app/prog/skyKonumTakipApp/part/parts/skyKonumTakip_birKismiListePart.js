(function() {
	window.SkyKonumTakip_BirKismiListePart = class extends window.SkyKonumTakipWindowPart {
		constructor(e) {
			e = e || {};
			super(e);

			const kodSet = e.kodSet || e.kod;
			$.extend(this, {
				baslikText: e.baslikText,
				hepsiDisabled: asBool(e.hepsiDisabled),
				tekilmi: asBool(e.tekil) || asBool(e.tekilmi),
				hepsimi: asBool(e.hepsi) || asBool(e.hepsimi),
				recs: e.recs,
				kodSet: $.isEmptyObject(kodSet)
					? {}
					: (typeof kodSet == 'object' ? kodSet : asSet([kodSet]))
			});

			if (this.tekilmi) {
				this.hepsimi = false;
				if (!$.isEmptyObject(kodSet))
					this.kodSet = asSet(Object.keys(kodSet)[0]);
			}
		}

		static get partName() { return 'birKismiListe' }
		get defaultTitle() { return '' }
		get defaultIsModal() { return true }
		get autoFocus_uiSelector() { return `.liste_parent #liste` }


		static getSelectionText(e) {
			const {tekilmi, hepsimi} = e;
			let kodListe = e.kodListe || [];
			if (tekilmi) {
				kodListe = kodListe.slice(0, 1);
			}
			else {
				if (hepsimi)
					return '-Hepsi-';
			}
			
			return kodListe.join(', ') || ' ';
		}
		
		get selectionText() {
			const {listePart, tekilmi, hepsimi} = this;
			if (!(listePart && !listePart.isDestroyed && listePart.widget))
				return null;
			
			const {widget} = this.listePart;
			let selRecs = widget.getSelection().filter(rec => !!rec);
			const kodListe = selRecs.map(rec => rec.kod);
			this.kodSet = asSet(kodListe);
			
			return this.class.getSelectionText({ tekilmi: tekilmi, hepsimi: hepsimi, kodListe: kodListe })
		}
		
		
		async tazeleDevam(e) {
			await super.tazeleDevam(e);

			const {wndContent, baslikText, tekilmi, hepsiDisabled} = this;
			if (baslikText) {
				wndContent.find(`#baslikText`).html(baslikText);
				wndContent.find(`#baslikTextParent`).removeClass(`jqx-hidden`);
			}
			else {
				wndContent.find(`#baslikTextParent`).addClass(`jqx-hidden`);
			}

			const chkHepsimi_parent = this.chkHepsimi_parent = wndContent.find(`#hepsimi_parent`);
			const chkHepsimi = this.chkHepsimi = chkHepsimi_parent.find(`#hepsimi`);
			if (tekilmi || hepsiDisabled)
				chkHepsimi_parent.addClass(`basic-hidden`);
			
			let {listePart} = this;
			if (!listePart || listePart.isDestroyed) {
				const columns = this.liste_getColumns(e);
				const liste_parent = wndContent.find(`.liste_parent`);
				const divListe = liste_parent.find(`#liste`);
				listePart = this.listePart = new DataTablePart({
					layout: divListe,
					widgetBeforeInit: _e => {
						$.extend(_e.widgetArgs, {
							pageable: true, pageSize: 20,
							selectionMode: tekilmi ? 'singleRow' : 'custom',
							filterable: true, filterMode: 'default', filterHeight: 35,
							serverProcessing: false
						});
					},
					/*widgetAfterInit: _e => {
						const {widgetPart} = _e;
						widgetPart.on('rowDoubleClick', evt =>
							this.baslatIstendi(e));
					},*/
					columns: columns,
					loadServerData: e =>
						this.liste_loadServerData(e),
					itemClick: e =>
						this.liste_onItemClick(e),
					bindingComplete: e =>
						this.liste_veriYuklendi(e)
				});
				listePart.basicRun();
				listePart.layout
					.detach()
					.appendTo(liste_parent);
			}

			if (!tekilmi) {
				const hepsimiDegisti = evt => {
					const flag = this.hepsimi;
					chkHepsimi_parent[flag ? 'addClass' : 'removeClass']('checked');
					
					const {listePart} = this;
					if (!listePart.isDestroyed && listePart.widgetPart && listePart.widgetPart.length)
						listePart.widgetPart.jqxDataTable('disabled', flag);
				};
				chkHepsimi.prop('checked', this.hepsimi);
				hepsimiDegisti();
				chkHepsimi.on('change', evt => {
					this.hepsimi = chkHepsimi.is(':checked');
					hepsimiDegisti(evt);
				});
			}
		}

		tazeleSonrasi(e) {
			super.tazeleSonrasi(e);
		}

		close_araIslemler(e) {
			super.close_araIslemler(e);

			const {listePart} = this;
			if (listePart && !listePart.isDestroyed && listePart.widgetPart)
				listePart.destroyPart();
			
			delete this.hepsimi;
			delete this.listePart;
		}

		wndArgsDuzenle(e) {
			super.wndArgsDuzenle(e);

			const minHeight = 500;
			$.extend(e.args, {
				width: 450, height: Math.max($(window).height() - 50, minHeight),
				minWidth: 350, minHeight: minHeight
			});
		}

		tamamIstendi_argsDuzenle(e) {
			super.tamamIstendi_argsDuzenle(e);

			const {tekilmi, hepsimi, hepsiDisabled} = this;
			const {widget} = this.listePart;
			const selRecs = widget.getSelection().filter(rec => !!rec);
			const kodSet = this.kodSet = asSet(selRecs.map(rec => rec.kod));
			if (tekilmi && selRecs && selRecs.length > 1)
				return { isError: true, rc: 'noMultiSelect', errorText: `Sadece bir tane satır seçilmelidir` };

			const _this = this;
			const {args} = e;
			$.extend(args, {
				tekilmi: tekilmi,
				get selectionText() { return _this.selectionText }
			});
			if (!(tekilmi || hepsiDisabled))
				args.hepsimi = hepsimi;
			args[tekilmi ? 'kod' : 'kodSet'] = tekilmi ? Object.keys(kodSet || {})[0] : kodSet || {};
			args[tekilmi ? 'rec' : 'recs'] = tekilmi ? (selRecs || [])[0] : selRecs;
		}

		listeTazele(e) {
			const {listePart} = this;
			if (listePart && !listePart.isDestroyed && listePart.widgetPart)
				listePart.tazele();
		}

		liste_getColumns(e) {
			return [
				{ dataField: 'aciklama', text: ' ', cellClassName: 'aciklama' },
				{ dataField: 'kod', text: 'Kod', cellClassName: 'kod', width: 120 }
			];
		}

		async liste_loadServerData(e) {
			let recs = null;
			try {
				recs = this.recs;
			}
			catch (ex) {
				recs = [];
				((window.savedProcs || {}).hideProgress || hideProgress)();
				// defFailBlock(ex);
				// throw ex;
			}
			
			return recs;
		}

		liste_veriYuklendi(e) {
			if (!$.isEmptyObject(liste)) {
				const {widget} = this.listePart;
				if (!widget)
					return;
				
				let {kodSet} = this;
				if (kodSet && $.isArray(kodSet))
					kodSet = this.kodSet = asSet(kodSet);
				
				const recs = widget.getRows();
				widget.beginUpdate();
				for (const i in recs) {
					const rec = recs[i];
					const {uid, kod} = rec;
					if (kodSet[kod])
						widget.selectrowbykey(uid);
				}
				widget.endUpdate();
			}
		}

		liste_onItemClick(e) {
			const {tekilmi} = this;
			if (!tekilmi) {
				const uid = e.event.args.key;
				const {widget} = this.listePart;
				if (uid != null) {
					const rowInfo = widget.rowinfo[uid];
					if (rowInfo.selected)
						widget.unselectrowbykey(uid);
					else
						widget.selectrowbykey(uid);
				}
			}
		}

		async wnd_onResize(e) {
			await super.wnd_onResize(e);

			const {listePart} = this;
			if (listePart && !listePart.isDestroyed && listePart.widgetPart) {
				const {wnd, chkHepsimi_parent} = this;
				const divListe = listePart.widgetPart;
				let height = wnd.height() - (divListe.position().top + chkHepsimi_parent.height() - 35);
				divListe.jqxDataTable('height', height);
			}
		}
	}
})()
