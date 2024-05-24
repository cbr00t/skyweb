(function() {
	window.SkyMakineDurum_DuraksamaNedeniSecPart = class extends window.SkyMESWindowPart {
		constructor(e) {
			e = e || {};
			super(e);

			this.title = e.title || 'Duraksama Nedeni';
		}

		static get partName() { return 'duraksamaNedeniSec' }
		get autoHeight_uiSelector() { return null }
		get klavyeAcilirmi() { return false }
		get numKlavyeAcilirmi() { return false }
		
		async tazeleDevam(e) {
			await super.tazeleDevam(e);

			const {wndContent} = this;
			const subContent = this.subContent = wndContent.find(`#subContent`);
			const gridParent = subContent.find(`tr > td > .gridParent`)
			let grid = gridParent.find(`#grid`);
			let gridPart = this.gridPart = new DataTablePart({
				layout: grid,
				widgetBeforeInit: _e => {
					$.extend(_e.widgetArgs, {
						pageable: false, pageSize: 9,
						filterable: true, filterMode: 'simple', filterHeight: 28,
						serverProcessing: false
					});
				},
				/*widgetAfterInit: _e => {
					const {widgetPart} = _e;
					widgetPart.on('rowDoubleClick', evt =>
						this.baslatIstendi(e));
				},*/
				columns: [
					{
						dataField: 'aciklama', text: 'Açıklama'
					},
					{
						dataField: 'kod', text: 'Kod', width: 70, cellClassName: 'bold'
						/*cellsFormat: 'n', cellsAlign: 'right', cellClassName: 'bold'*/
					}
				],
				loadServerData: async e => {
					const {app} = this;
					let recs;
					try {
						recs = await app.wsDuraksamaNedenleri(e.wsArgs);
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
					this.liste_onItemClick(e),
				/*itemDblClick: e =>
					this.tamamIstendi(),*/
				/*bindingComplete: e =>
					gridPart.widget.selectRow(0)*/
			});
			gridPart.basicRun();
			gridPart.layout
				.detach()
				.appendTo(gridParent);
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
				width: Math.min(500, $(window).width() - 1),
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
				return { isError: true, errorText: '<b>Duraksama Nedeni</b> seçilmelidir' };

			const {args} = e;
			args.rec = rec;
		}

		async liste_onItemClick(e) {
		}

		async wnd_onResize(e) {
			await super.wnd_onResize(e);

			const {wnd, gridPart} = this;
			if (gridPart && !gridPart.isDestroyed && gridPart.widgetPart) {
				const {wnd} = this;
				const grid = gridPart.widgetPart;
				let height = wnd.height() - 70;
				grid.jqxDataTable('height', height);
			}
		}
	}
})()
