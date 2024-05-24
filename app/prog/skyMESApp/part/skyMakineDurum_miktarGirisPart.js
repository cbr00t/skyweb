(function() {
	window.SkyMakineDurum_MiktarGirisPart = class extends window.SkyMESTextInputPart {
		constructor(e) {
			e = e || {};
			super(e);

			const title = this.title = e.title || 'Miktar Giriş';
			$.extend(this, {
				placeHolder: `Ürt.Mikt.`,
				value: 1,
				iskartaGridHeight: 150
			});
		}

		static get partName() { return 'miktarGiris' }
		get autoHeight_uiSelector() { return null }
		get klavyeAcilirmi() { return false }
		get numKlavyeAcilirmi() { return true }
		
		async tazeleDevam(e) {
			await super.tazeleDevam(e);

			const {wnd, wndContent} = this;
			const subContent = this.subContent = wndContent.find(`#subContent`);
			
			const iskartaGridParent = this.iskartaGridParent = subContent.find(`tr > td > .gridParent`)
			const toggleParent = subContent.find(`#toggleParent`);
			const btnToggle = this.btnToggle = toggleParent.find(`#btnToggle`);
			btnToggle.jqxToggleButton({ theme: theme, toggled: !iskartaGridParent.hasClass(`jqx-hidden`) });
			btnToggle.on('click', evt =>
				this.onExpandCollapse($.extend({}, e, { event: evt, flag: btnToggle.jqxToggleButton('toggled') })));
		}

		close_araIslemler(e) {
			super.close_araIslemler(e);
			
			const {iskartaGridPart} = this;
			if (iskartaGridPart && iskartaGridPart.layout && !iskartaGridPart.isDestroyed)
				iskartaGridPart.destroyPart();
		}

		wndArgsDuzenle(e) {
			super.wndArgsDuzenle(e);

			const size = {
				width: Math.min(700, $(window).width() - 1),
				height: 800
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
			
			const {args} = e;
			let {value} = args;
			args.value = value =
				(value && typeof value != 'number')
					? asFloat(value)
					: null;
			if (value == null || value <= 0)
				return { isError: true, errorText: `<b>Üretilen Miktar</b> değeri hatalıdır` };
			
			let gridPart = this.iskartaGridPart;
			if (gridPart && !gridPart.isDestroyed) {
				let recs = gridPart.widget.getRows().filter(rec => rec.miktar && rec.miktar > 0);
				args.iskartalar = recs.map(rec => { return { uid: rec.uid, kod: rec.kod, miktar: asFloat(rec.miktar) } });
			}
		}

		async onExpandCollapse(e) {
			const target = (e.event || {}).currentTarget;
			const $target = target ? $(target) : null;
			if (target)
				setButonEnabled($target, false);
			
			const parent = this.iskartaGridParent;
			const {flag} = e
			parent[flag ? 'removeClass' : 'addClass'](`jqx-hidden`);

			const {wnd, iskartaGridHeight} = this;
			let heightArtis = iskartaGridHeight;
			if (!flag)
				heightArtis = -heightArtis;
			wnd.jqxWindow('height', wnd.height() + heightArtis);

			if (flag && !this.iskartaGridPart)
				this.initIskartaGrid(e);

			await this.wnd_onResize(e);
			setTimeout(() => setButonEnabled($target, true), 10);
			if (target)
				target.blur();
		}

		initIskartaGrid(e) {
			const {app} = this;
			const parent = this.iskartaGridParent;
			const grid = parent.find(`#iskartaGrid`);
			const part = this.iskartaGridPart = new DataTablePart({
				layout: grid,
				widgetBeforeInit: _e => {
					$.extend(_e.widgetArgs, {
						// height: wnd.height() - (textInputParent.offset().top + textInputParent.height()) + 30,
						editable: true, pageable: false, pageSize: 8,
						filterable: true, filterMode: 'simple', filterHeight: 28,
						serverProcessing: false
					})
				},
				/*widgetAfterInit: _e => {
					const {widgetPart} = _e;
					widgetPart.on('rowDoubleClick', evt =>
						this.baslatIstendi(e));
				},*/
				columns: [
					{ dataField: 'kod', text: 'Kod', hidden: true },
					{
						dataField: 'aciklama', text: 'Iskarta', editable: false,
						cellsRenderer: (rowIndex, columnIndex, value, rec) =>
							`<b>${rec.kod}</b>-<span>${value}</span>`
					},
					{ dataField: 'miktar', text: 'Miktar', width: 80, cellsFormat: 'd1', cellsAlign: 'right', cellClassName: 'bold' }
				],
				loadServerData: async e => {
					let recs;
					try {
						recs = await app.wsIskartaNedenleri(e.wsArgs);
						recs = recs.rows || recs;
					}
					catch (ex) {
						((window.savedProcs || {}).hideProgress || hideProgress)();
						// defFailBlock(ex);
						throw ex;
					}
					return recs
				}
			});
			part.basicRun();
			part.layout
				.detach()
				.appendTo(parent);
		}

		async wnd_onResize(e) {
			await super.wnd_onResize(e);

			const {iskartaGridPart} = this;
			if (iskartaGridPart && !iskartaGridPart.isDestroyed && iskartaGridPart.widgetPart) {
				const {wnd, textInputParent, iskartaGridPart} = this;
				const grid = iskartaGridPart.widgetPart;
				grid.jqxDataTable('height', wnd.height() - (textInputParent.offset().top + textInputParent.height()) + 60);
			}
		}
	}
})()
