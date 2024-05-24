(function() {
	window.SkyMES_PersonelSecPart = class extends window.SkyMESWindowPart {
		constructor(e) {
			e = e || {};
			super(e);

			const {id2Tezgah, tezgahBilgi} = this.app;
			const tezgahId = this.tezgahId = e.tezgahId;
			const tezgahAciklama = id2Tezgah ? (id2Tezgah[tezgahId] || {}).aciklama : (tezgahBilgi ? tezgahBilgi.tezgahAciklama : null);
			this.title = e.title || 'Personel Seçimi';
			this.title += ` - (<span class="gray">${tezgahId}</span>) ${tezgahAciklama || ''}`;
		}

		static get partName() { return 'personelSec' }
		get autoHeight_uiSelector() { return null }
		get klavyeAcilirmi() { return false }
		get numKlavyeAcilirmi() { return false }
		
		async tazeleDevam(e) {
			await super.tazeleDevam(e);

			const {app, noSwitchFlag, tezgahId, wndContent} = this;
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

			let {gridPart} = this;
			if (!gridPart || gridPart.isDestroyed) {
				const gridParent = wndContent.find(`.gridParent`);
				let grid = gridParent.find(`#grid`);
				gridPart = this.gridPart = new DataTablePart({
					layout: grid,
					widgetBeforeInit: _e => {
						$.extend(_e.widgetArgs, {
							pageable: true, pageSize: 13, selectionMode: 'singleRow',
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
					{ dataField: 'aciklama', text: 'İsim' },
					{ dataField: 'kod', text: 'Kod', width: 100, cellClassName: 'bold' }
				],
				loadServerData: async e => {
					const {app} = this;
					let recs;
					try {
						recs = await app.wsPersoneller(e.wsArgs);
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
			let recs = gridPart.widget.getSelection();
			let rec = $.isEmptyObject(recs) ? null : recs[0];
			if (!rec)
				return { isError: true, errorText: 'Personel seçilmelidir' };

			const {args} = e;
			args.rec = rec;
		}

		async liste_onItemClick(e) {
			/*const uid = e.event.args.key;
			const {widget} = this.gridPart;
			if (uid != null) {
				const rowInfo = widget.rowinfo[uid];
				if (rowInfo.selected)
					widget.unselectrowbykey(uid);
				else
					widget.selectrowbykey(uid);
			}*/
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
