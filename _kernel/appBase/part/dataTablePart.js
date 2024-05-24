(function() {
	window.DataTablePart = class extends window.Part {
		constructor(e) {
			super(e);

			e = e || {}
			$.extend(this, {
				// value: e.value || ''
				widgetBeforeInit: e.widgetBeforeInit,
				widgetAfterInit: e.widgetAfterInit,
				columns: e.columns,
				loadServerData: e.loadServerData,
				bindingComplete: e.bindingComplete,
				listeItemClick: e.itemClick,
				listeItemDblClick: e.itemDblClick,
				listeItemOnContextMenu: e.itemOnContextMenu,
				listeCellBeginEdit: e.cellBeginEdit,
				listeCellEndEdit: e.cellEndEdit,
				listeRowBeginEdit: e.rowBeginEdit,
				listeRowEndEdit: e.rowEndEdit,
				bindingComplete: e.bindingComplete,
				expandedUids: {}
			});
			
			if (!(this.layout || this.template))
				this.template = (this.app.templates || {})[this.class.defaultTemplateName];
		}

		static get partName() { return 'dataTable' }
		get partRoot() { return 'appBase/part/' }
		get defaultLayoutName() { return this.partName }


		postInitLayout(e) {
			e = e || {};
			super.postInitLayout(e);
			
			const layout = e.layout || this.layout;
			let widgetArgs = this.widgetArgs = {
				theme: theme, localization: localizationObj,
				width: false, height: 'auto', editable: false,
				altRows: true, autoRowHeight: true, columnsHeight: 30,
				sortable: true, columnsResize: true, filterable: true, pageable: false,
				filterMode: 'default', selectionMode: 'singlerow',
				pagerMode: 'advanced', pageSizeOptions: [4, 5, 6, 8, 9, 10, 11, 12, 13, 15, 20, 25, 30],
				pagerButtonsCount: 5, pagerPosition: 'top', pageSize: 10,
				/* serverProcessing: true, */
				autoShowLoadElement: true,
				editSettings: {
					saveOnPageChange: true, saveOnBlur: true, saveOnSelectionChange: true,
					cancelOnEsc: true, saveOnEnter: true, editSingleCell: true,
					editOnDoubleClick: true, editOnF2: true
				},
				source: this.getDataAdapter(e)
			};
			let {columns} = this;
			if (columns) {
				if ($.isFunction(columns))
					columns = columns.call(this, $.extend({}, e, { sender: this, widgetArgs: widgetArgs })) || [];
				if (columns)
					widgetArgs.columns = columns;
			}
			let handler = this.widgetBeforeInit;
			if ($.isFunction(handler))
				handler.call(this, $.extend({}, e, { sender: this, widgetArgs: widgetArgs }));
			const widgetPart = this.widgetPart = layout.jqxDataTable(widgetArgs);
			const widget = this.widget = widgetPart.jqxDataTable('getInstance');

			const eventNames = ['rowClick', 'rowDoubleClick', 'cellBeginEdit', 'cellEndEdit', 'rowBeginEdit', 'rowEndEdit'];
			for (const i in eventNames) {
				const eventName = eventNames[i];
				widgetPart.off(eventName);
			}
			widgetPart.on('rowClick', evt =>
				this.liste_onItemClick($.extend({}, e, { event: evt })));
			widgetPart.on('rowDoubleClick', evt =>
				this.liste_onItemDblClick($.extend({}, e, { event: evt })));
			widgetPart.on('contextmenu', evt =>
				this.liste_onItemContextMenu($.extend({}, e, { event: evt })));
			widgetPart.on('cellBeginEdit', evt =>
				this.liste_cellBeginEdit($.extend({}, e, { event: evt })));
			widgetPart.on('cellEndEdit', evt =>
				this.liste_cellEndEdit($.extend({}, e, { event: evt })));
			widgetPart.on('rowBeginEdit', evt =>
				this.liste_rowBeginEdit($.extend({}, e, { event: evt })));
			widgetPart.on('rowEndEdit', evt =>
				this.liste_rowEndEdit($.extend({}, e, { event: evt })));

			handler = this.widgetAfterInit;
			if ($.isFunction(handler))
				handler.call(this, $.extend({}, e, { sender: this, widget: widget, widgetPart: widgetPart, widgetArgs: widgetArgs }));

			// widget.touchDevice = true;
			// this.initEvents(e);
		}

		destroyPart(e) {
			const {widgetPart} = this;
			if (widgetPart && widgetPart.length)
				widgetPart.jqxDataTable('destroy');
			const keys = ['widgetPart', 'widget', 'expandedUids'];
			for (const i in keys)
				delete this[keys[i]];

			return super.destroyPart(e);
		}

		tazele() {
			const {widget} = this;
			try { widget.beginUpdate() }
			catch (ex) { }
			try {
				if (!widget) {
					console.error({ isError: true, sender: this, locus: `tazele()`, errorText: `(widget) is null` });
					return;
				}
				widget.updateBoundData();
				this.expandedUids = {};
			}
			finally {
				try { widget.endUpdate() }
				catch (ex) {}
			}
		}

		getDataAdapter(e) {
			return new $.jqx.dataAdapter({
				autoBind: false, cache: true,
				url: `empty.json`, dataType: defaultOutput
			},
			{
				loadServerData: async (wsArgs, source, callback) => {
					try {
						await this.onLoadServerData($.extend({}, e, { wsArgs: wsArgs, source: source, callback: callback }));
						
						setTimeout(() => {
							try { this.widgetPart.find(`span:contains("www.jqwidgets.com")`).hide() }
							catch (ex) { }
						}, 10);
					}
					catch (ex) {
						defFailBlock(ex);
						callback({ totalrecords: 0, records: [] });
						throw ex;
					}
				}
			});
		}

		async onLoadServerData(e) {
			let recs = [];
			let handler = this.loadServerData;
			if ($.isFunction(handler)) {
				let result = await handler.call(this, $.extend({}, e, { sender: this, widget: this.widget, widgetPart: this.widgetPart, widgetArgs: this.widgetArgs }));
				if (result)
					recs = result;
				else if (result === false)
					return;
			}
			if (!this.isDestroyed && this.widgetPart && this.widgetPart.length)
				e.callback({ totalrecords: recs.length, records: recs });

			await this.onBindingComplete(e);
		}

		onBindingComplete(e) {
			setTimeout(async () => {
				const {widgetPart} = this;
				const textInputs = widgetPart == null ? null : widgetPart.find(`input[type=textbox], input[type=text]`);
				if (textInputs && textInputs.length) {
					textInputs.attr('autocomplete', 'false');
					textInputs.attr('readonly', '');
					textInputs.attr('onfocus', `this.removeAttribute('readonly'); this.select()`);
					textInputs.attr('onkeyup', `if (event.key.toLowerCase() == 'enter' || event.key.toLowerCase() == 'linefeed') { this.blur() }`);
				}
				
				let handler = this.bindingComplete;
				if ($.isFunction(handler))
					await handler.call(this, $.extend({}, e, { sender: this, widget: this.widget, widgetPart: this.widgetPart, widgetArgs: this.widgetArgs }));
			}, 100);
		}

		async liste_onItemClick(e) {
			const {widget} = this;
			const {clickedTD} = widget;

			const {button} = (((e.event || {}).args || {}).originalEvent || {});
			if (button == 2 || button == 3)
				return;
			
			widget.table.find(`td.jqx-grid-cell.selected`).removeClass(`selected`);
			if (clickedTD)
				clickedTD.classList.add(`selected`);

			const func = this.listeItemClick;
			if ($.isFunction(func))
				await func.call(this, $.extend({}, e, { sender: this }));
		}

		async liste_onItemDblClick(e) {
			const func = this.listeItemDblClick;
			if ($.isFunction(func))
				await func.call(this, $.extend({}, e, { sender: this }));
		}

		async liste_onItemContextMenu(e) {
			const func = this.listeItemOnContextMenu;
			if ($.isFunction(func))
				await func.call(this, $.extend({}, e, { sender: this }));
		}

		async liste_cellBeginEdit(e) {
			e = e || {};
			const evt = e.event || {};
			const evtArgs = evt.args || {};
			
			this.lastEditingCell = this.editingCell = { mode: 'cell', rowIndex: evtArgs.index, uid: evtArgs.key, dataField: evtArgs.dataField };

			const func = this.listeCellBeginEdit;
			if ($.isFunction(func))
				await func.call(this, $.extend({}, e, { sender: this, widget: this.widget, widgetPart: this.widgetPart, widgetArgs: this.widgetArgs }));
		}

		async liste_cellEndEdit(e) {
			e = e || {};
			delete this.editingCell;

			const func = this.listeCellEndEdit;
			if ($.isFunction(func))
				await func.call(this, $.extend({}, e, { sender: this, widget: this.widget, widgetPart: this.widgetPart, widgetArgs: this.widgetArgs }));
		}

		async liste_rowBeginEdit(e) {
			e = e || {};
			const {widget} = this;
			const evt = e.event || {};
			const evtArgs = evt.args || {};
			const rowIndex = evt.args.index;
			const {clickedTD} = widget;

			const editingCell = this.lastEditingCell = this.editingCell = { mode: 'row', rowIndex: rowIndex, uid: evtArgs.key, dataField: null };
			if (rowIndex != null && rowIndex > -1 && clickedTD) {
				const {datafield} = widget.columns.records[$(clickedTD).index()];
				editingCell.dataField = datafield;
			}

			const func = this.listeCellBeginEdit;
			if ($.isFunction(func))
				await func.call(this, $.extend({}, e, { sender: this, widget: this.widget, widgetPart: this.widgetPart, widgetArgs: this.widgetArgs }));
		}

		async liste_rowEndEdit(e) {
			e = e || {};
			delete this.editingCell;

			const func = this.listeCellEndEdit;
			if ($.isFunction(func))
				await func.call(this, $.extend({}, e, { sender: this, widget: this.widget, widgetPart: this.widgetPart, widgetArgs: this.widgetArgs }));
		}
	}
})()
