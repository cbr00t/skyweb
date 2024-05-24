(function() {
	window.SkyHatIzleme_OperSecPart = class extends window.SkyMESWindowPart {
		constructor(e) {
			e = e || {};
			super(e);

			this.noSwitchFlag = e.noSwitch;
			this.oemSayac = e.oemSayac;
			let urunAgacinaEkleFlag = this.urunAgacinaEkleFlag = e.urunAgacinaEkle || e.urunAgacinaEkleFlag
			if (urunAgacinaEkleFlag == null)
				urunAgacinaEkleFlag = this.urunAgacinaEkleFlag = asBoolQ(Utils.cookie('skyMES.operSecPart.urunAgacinaEkleFlag'))
			if (urunAgacinaEkleFlag == null)
				urunAgacinaEkleFlag = this.urunAgacinaEkleFlag = false

			const {id2Tezgah, tezgahBilgi} = this.app;
			const tezgahId = this.tezgahId = e.tezgahId;
			const tezgahAciklama = id2Tezgah ? (id2Tezgah[tezgahId] || {}).aciklama : (tezgahBilgi ? tezgahBilgi.tezgahAciklama : null);
			this.title = e.title || 'Operasyonlar';
			this.title += ` - (<span class="gray">${tezgahId}</span>) ${tezgahAciklama || ''}`;
		}

		static get partName() { return 'operSec' }
		get autoHeight_uiSelector() { return null }
		get klavyeAcilirmi() { return false }
		get numKlavyeAcilirmi() { return false }

		async open(e) {
			await super.open(e);

			const {signalHandlers} = this.app;
			signalHandlers[this.partName] = _e => {
				const {gridPart} = this;
				if (!this.isDestroyed && gridPart && gridPart.widgetPart && gridPart.widgetPart.length)
					this.gridPart.tazele()
			};
		}

		async close(e) {
			const {signalHandlers} = this.app;
			delete signalHandlers[this.partName];
			
			await super.close(e);
		}
		
		async tazeleDevam(e) {
			await super.tazeleDevam(e);

			const {app, wndContent} = this;
			wndContent.find(`button`).jqxButton({ theme: theme });

			const {btnTazele} = this;
			if (btnTazele && btnTazele.length) {
				btnTazele
					.off('click')
					.on('click', evt =>
						this.gridPart.tazele());
			}
			
			const divHeader = this.divHeader = wndContent.find(`#header`);
			const islemTuslari = this.islemTuslari = divHeader.find(`#islemTuslari`);
			const divFooter = this.divFooter = wndContent.find(`#footer`);
			const islemTuslari_bottom = this.islemTuslari_bottom = divFooter.find(`#islemTuslari-bottom`);

			const chkUrunAgacinaEkle = this.chkUrunAgacinaEkle = divHeader.find(`#chkUrunAgacinaEkle`);
			const chkUrunAgacinaEkle_parent = chkUrunAgacinaEkle.parent();
			chkUrunAgacinaEkle_parent[this.urunAgacinaEkleFlag ? 'addClass' : 'removeClass']('checked');
			chkUrunAgacinaEkle.off('change');
			chkUrunAgacinaEkle.prop('checked', this.urunAgacinaEkleFlag);
			chkUrunAgacinaEkle.on('change', evt => {
				const flag = this.urunAgacinaEkleFlag = $(evt.currentTarget).is(':checked');
				Utils.cookie('skyMES.operSecPart.urunAgacinaEkleFlag', flag);
				chkUrunAgacinaEkle_parent[flag ? 'addClass' : 'removeClass']('checked');
			});

			let {gridPart} = this;
			if (!gridPart || gridPart.isDestroyed) {
				const gridParent = wndContent.find(`.gridParent`);
				let grid = gridParent.find(`#grid`);
				gridPart = this.gridPart = new DataTablePart({
					layout: grid,
					widgetBeforeInit: _e => {
						$.extend(_e.widgetArgs, {
							pageable: true, pageSize: 13, selectionMode: 'custom',
							filterable: true, filterMode: 'default', filterHeight: 35,
							serverProcessing: false
						});
					},
					/*widgetAfterInit: _e => {
						const {widgetPart} = _e;
						widgetPart.on('rowDoubleClick', evt =>
							this.baslatIstendi(e));
					},*/
					columns: [
						{ dataField: 'opAdi', text: 'Op.Adı' },
						{ dataField: 'opNo', text: 'Op.No', width: 100, cellClassName: 'bold' }
					],
					loadServerData: async e => {
						const {app} = this;
						let recs;
						try {
							e.wsArgs.oemSayac = this.oemSayac || '';
							recs = await app.wsBekleyenIs_yeniOperasyonlar(e.wsArgs);
							recs = recs.rows || recs;
						}
						catch (ex) {
							((window.savedProcs || {}).hideProgress || hideProgress)();
							// defFailBlock(ex);
							throw ex;
						}
						return recs
					},
					itemClick: e =>
						this.liste_onItemClick(e)
					/*bindingComplete: async e =>
						gridPart.widget.selectRow(0)*/
				});
				gridPart.basicRun();
				gridPart.layout
					.detach()
					.appendTo(gridParent);
			}
		}

		close_araIslemler(e) {
			super.close_araIslemler(e);
			
			const {gridPart} = this;
			if (gridPart && gridPart.layout && !gridPart.isDestroyed)
				gridPart.destroyPart();
		}

		wndArgsDuzenle(e) {
			super.wndArgsDuzenle(e);

			const size = {
				width: Math.min(900, $(window).width() - 1),
				height: $(window).height() - this.header.height() - 23
			};
			$.extend(e.args, {
				isModal: false, width: size.width, height: size.height
				// minWidth: size.width - 20, minHeight: size.height
			});
		}

		tamamIstendi_argsDuzenle(e) {
			let result = super.tamamIstendi_argsDuzenle(e);
			if (result === false || (result && result.isError))
				return result;
			
			const {gridPart} = this;
			const recs = gridPart.widget.getSelection();
			/*let rec = $.isEmptyObject(recs) ? null : recs[0];
			if (!rec)*/
			if ($.isEmptyObject(recs))
				return { isError: true, errorText: 'Operasyon(lar) seçilmelidir' };

			const {args} = e;
			// args.rec = rec;
			args.urunAgacinaEkleFlag = this.urunAgacinaEkleFlag;
			args.recs = recs;
		}

		liste_onItemClick(e) {
			const uid = e.event.args.key;
			const {widget} = this.gridPart;
			if (uid != null) {
				const rowInfo = widget.rowinfo[uid];
				if (rowInfo.selected)
					widget.unselectrowbykey(uid);
				else
					widget.selectrowbykey(uid);
			}

			const selRecs = widget.getSelection();
			const {app, btnTamam} = this;
			setButonEnabled(btnTamam, !$.isEmptyObject(selRecs));
		}

		async wnd_onResize(e) {
			await super.wnd_onResize(e);

			const {gridPart} = this;
			if (gridPart && !gridPart.isDestroyed && gridPart.widgetPart) {
				const {wnd, divFooter} = this;
				const grid = gridPart.widgetPart;
				let height = wnd.height() - (grid.position().top + divFooter.height() + 13);
				grid.jqxDataTable('height', height);
			}
		}
	}
})()
