(function() {
	window.SkyMakineDurum_GorevSecPart = class extends window.SkyMESWindowPart {
		constructor(e) {
			e = e || {};
			super(e);

			this.title = e.title || 'İş Atama Ekranı';
		}

		static get partName() { return 'gorevSec' }
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
						pageable: false, pageSize: 8, selectionMode: 'custom',
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
						dataField: 'fisnox', text: 'İş (No)',
						cellClassName: (rowIndex, columnField, value, rec) => {
							rec = rec.originalRecord || rec;
							const statu = rec.statu || '';
							const {statuHaricSet} = this.app;
							let result = statu ? `statu-${statu}` : ''
							/*if (statu) {
								if (result)
									result += ' ';
								result += `disabled`;
							}*/
							return result;
						},
						cellsRenderer: (rowIndex, columnIndex, value, rec) => {
							rec = rec.originalRecord || rec;
							const statu = rec.statu || '';
							const {statuHaricSet} = this.app;
							const statuTextCSS = asBool(rec.batandimi) ? '' : ` jqx-hidden`;
							return (
								`<div>` +
									`<span class="emir etiket">Emir:</span>` +
										`<span class="emir veri">${rec.fisnox}</span>` +
										`<span>-</span>` +
										`<span class="emir veri">${rec.emirmiktar}</span>` +
										`<span class="statuText${statuTextCSS}">(aktif iş)</span>` +
								`</div>` +
								`<div>` +
									`<span class="oper etiket">Oper:</span>` +
										`<span class="oper veri">${rec.opno}</span>` +
										`<span>-</span>` +
										`<span class="oper veri">${rec.opadi}</span>` +
								`</div>` +
								`<div>` +
								`<span class="etiket">Ürün:</span>` +
									`<span class="urun veri">${rec.urunkod}</span>` +
									`<span>-</span>` +
									`<span class="urun veri">${rec.urunadi}</span>` +
								`</div>`
							)
						}
					},
					{ dataField: 'urunadi', text: 'Ürün Adı', hidden: true },
					{ dataField: 'urunkod', text: 'Ürün Kod', hidden: true },
					{ dataField: 'opadi', text: 'Op. Adı', hidden: true },
					{ dataField: 'opno', text: 'Op. No', hidden: true },
					{
						dataField: 'emirtarih', text: 'Tarih', width: 70,
						/*cellsFormat: 'n', cellsAlign: 'right', cellClassName: 'bold'*/
						cellClassName: 'bold',
						cellsRenderer: (rowIndex, columnIndex, value, rec) => {
							return dateKisaString(asDate(value))
						}
					},
					{ dataField: 'emirmiktar', text: 'Emir Miktar', hidden: true },
					{ dataField: 'oemsayac', text: 'OEM Sayac', hidden: true }
				],
				loadServerData: async e => {
					const {app} = this;
					let recs;
					try {
						recs = await app.wsSiradakiIsler(e.wsArgs);
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
				width: Math.min(700, $(window).width() - 1),
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
			if (!rec)
				return { isError: true, errorText: 'Bir iş seçilmelidir' };*/

			const {args} = e;
			args.recs = recs;
		}

		async liste_onItemClick(e) {
			const uid = e.event.args.key;
			const {widget} = this.gridPart;
			if (uid != null) {
				const rowInfo = widget.rowinfo[uid];
				if (rowInfo.selected)
					widget.unselectrowbykey(uid);
				else
					widget.selectrowbykey(uid);
			}
			
			/*const rec = e.event.args.row;
			const {widget} = this.gridPart;
			const aktifIsmi = rec && asBool(rec.batandimi);
			if (aktifIsmi) {
				setTimeout(
					rec => widget.unselectrowbykey(rec.uid),
					1,
					rec);
			}*/
		}

		async wnd_onResize(e) {
			await super.wnd_onResize(e);

			const {gridPart} = this;
			if (gridPart && !gridPart.isDestroyed && gridPart.widgetPart) {
				const {wnd} = this;
				const grid = gridPart.widgetPart;
				let height = wnd.height() - 70;
				grid.jqxDataTable('height', height);
			}
		}
	}
})()
