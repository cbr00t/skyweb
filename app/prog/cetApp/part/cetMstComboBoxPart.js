(function() {
	/* let div = $(`<div/>`);
		div.appendTo(sky.app.layout);
		await new CETMstComboBoxPart({ content: div, parentPart: sky.app, listeSinif: CETCariListePart, table: 'mst_Cari', adiSaha: 'unvan' } ).run()
		*/
	
	window.CETMstComboBoxPart = class extends window.Part {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				disabled: asBool(e.disabled),
				kodsuzmu: asBool(e.kodsuzmu),
				sadeceKodmu: asBool(e.sadeceKodmu),
				selectedId: e.kod || e.id || e.selectedId,
				disableAutoCompleteFlag: asBool(e.disableAutoComplete),
				listedenSecilmezFlag: asBool(e.listedenSecilmezFlag),
				autoCompleteMaxRow: e.autoCompleteMaxRow || 100,
				autoCompleteMinLength: e.autoCompleteMinLength || 0,
				dropDownHeight: e.dropDownHeight || ($(window).width() < 450 ? 162 : 400),
				remoteAutoCompleteDelay: e.remoteAutoCompleteDelay || 200,
				placeHolder: e.placeHolder || '',
				listeSinif: e.listeSinif,
				table: e.table,
				alias: e.alias || e.tableAlias || 'mst',
				idSaha: e.idSaha || 'kod',
				adiSaha: e.adiSaha || 'aciklama',
				widgetDuzenleyici: e.widgetDuzenleyici,
				events: $.extend({}, e.events || {}),
				_text: e.text,
				width: e.width,
				height: e.height
			});
			if (!this.listeSinif && this.idSaha)
				 this.listeSinif = CETKAListePart;
			
			if (!(this.layout || this.template))
				this.template = this.app.templates.cetMstComboBox;
		}

		static get partName() { return 'cetMstComboBox' }
		// get defaultLayoutName() { return this.partName }

		get text() { return this.comboBoxWidget.input.val() }
		set text(value) { this.comboBoxWidget.input.val(value) }


		postInitLayout(e) {
			e = e || {};
			super.postInitLayout(e);
			
			let layout = e.layout || this.layout;
			if (!(layout && layout.length))
				layout = this.layout = this.template.contents(`div`);

			const form = layout.find(`form`);
			if (form.length) {
				form.on('submit', evt => {
					evt.preventDefault();
					return false
				});
			}
			
			this.comboBox = layout.find('#widget');
			this.templates = $.extend(this.templates || {}, {
				comboBox_item: (e.template_comboBox || layout.find('#comboBox_item'))
			});
			this.initComboBox(e);
			this.focusToDefault();

			if (this.selectedId) {
				setTimeout(() =>
					this.comboBox_itemSelectedDevam({ value: this.selectedId }),
					100);
			}
		}

		destroyPart(e) {
			return super.destroyPart(e);
		}

		initComboBox(e) {
			e = e || {};
			const layout = e.layout || this.layout;
			const {content, comboBox, remoteAutoCompleteDelay} = this;
			
			let width = this.getWidgetWidth(e);
			let widgetArgs = e.widgetArgs = {
				theme: theme, animationType: animationType, disabled: this.disabled,
				width: width, height: this.height == null ? false : this.height,
				placeHolder: this.placeHolder, valueMember: 'kod', displayMember: 'aciklama',
				searchMode: 'containsignorecase', minLength: this.autoCompleteMinLength,
				/*autoDropDownHeight: false,*/ dropDownWidth: width, dropDownHeight: this.dropDownHeight,
				/* itemHeight: 30, */
				/*autoComplete: true,*/ remoteAutoComplete: !this.disableAutoCompleteFlag,
				remoteAutoCompleteDelay: remoteAutoCompleteDelay, openDelay: 50, closeDelay: 50,
				search: searchText => {
					let ind = searchText.indexOf('x');
					ind = ind < 0 ? searchText.indexOf('*') : ind;
					if (ind >= 0) {
						const miktar = asFloat(searchText.substring(0, ind)) || null;
						if (miktar)
							searchText = searchText.substring(ind + 1);
					}
					
					const da = this.comboBoxWidget.source;
					da._source.data.searchText = searchText;
					da.dataBind();
				},
				renderer: (index, aciklama, kod) => {
					let div = this.templates.comboBox_item.contents(`div`).clone(true);
					const {parentPart} = this;
					if (parentPart)
						div.addClass(parentPart.partName);
					
					let rec = {
						index: index,
						kodText: !this.kodsuzmu && kod ? `(${kod})` : ``,
						aciklama: !this.sadeceKodmu && aciklama ? aciklama : ``
					};
					if (this.sadeceKodmu)
						rec.kodText = kod;
						
					['kodText', 'aciklama'].forEach(key => {
						const value = rec[key];
						const elm = div.find(`.${key}`);
						if (value) {
							if (elm.length)
								elm.html(value)
						}
						else {
							elm.addClass(`jqx-hidden`)
						}
					});
					return div[0].outerHTML;
				},
				renderSelectedItem: (index, item) => {
					return item.label
				}
			};
			let func = this.widgetDuzenleyici;
			if ($.isFunction(func)) {
				let _widgetArgs = func.call(this, $.extend({}, e, { sender: this }));
				if (!$.isEmptyObject(_widgetArgs))
					$.extend(e.widgetArgs, _widgetArgs);
				widgetArgs = e.widgetArgs;
			}
			if (this.isDestroyed || !(comboBox && comboBox.length))
				return;
			
			comboBox.jqxComboBox(widgetArgs);

			this.originalPlaceHolder = this.placeHolder;

			let comboBoxWidget = this.comboBoxWidget = comboBox.jqxComboBox('getInstance');
			let da = this.comboBox_getDataAdapter({ maxRow: this.autoCompleteMaxRow });
			setTimeout(() => comboBox.jqxComboBox('source', da), 200);

			if (this._text) {
				this.text = this._text;
				delete this._text;
			}
			
			/*comboBox.find('*').on('focus', evt => {
				let parent = this.content;
				for (let i = 0; i < 2; i++) {
					if (parent.parent())
						parent = parent.parent();
				}
				const otherParts = parent.find(`.jqx-combobox[aria-owns != ${comboBox.attr('aria-owns')}]`);
				if (otherParts.length) {
					otherParts.jqxComboBox('open');
					otherParts.jqxComboBox('close');
				}
			});*/
			comboBox.on('focus', evt =>
				comboBoxWidget.input.focus());
			comboBox.on('open', evt => {
				const listBox = comboBox.jqxComboBox('getInstance').listBox;
				if (listBox)
					listBox.touchMode = true
			});
			comboBoxWidget.input.on('focus', evt =>
				evt.target.select());
			comboBoxWidget.input.on('keyup', evt =>
				comboBox.jqxComboBox('placeHolder', this.originalPlaceHolder || ''));
			/*comboBox.on('open', evt => {
				if (this.comboBox_preventPopupFlag) {
					delete this.comboBox_preventPopupFlag;
					evt.preventDefault();
					setTimeout(() => comboBoxWidget.close(), 50);
					setTimeout(() => comboBoxWidget.close(), 200);
					this.focusToDefault();
				}
			});*/
			const id = this.selectedId;
			if (id && !this.selectedIdAtandimi && !$.isEmptyObject(comboBoxWidget.getItems()))
				comboBox.val(id);
			comboBox.on('change', evt => {
				let args = evt.args;
				if (args && args.type && args.type != 'none') {
					let item = args.item || {};
					let boundItem = item.originalItem;
					this.comboBox_itemSelected($.extend({}, e, {
						event: evt, args: args, item: item,
						boundItem: boundItem, index: args.index
					}));
				}
			});
			// comboBoxWidget.input.attr('type', 'submit');
			/*comboBoxWidget.input.on('change', evt => {
				displayMessage(evt);
			})*/;
			comboBoxWidget.input.on('keyup', evt => {
				let key = (evt.key || '').toLowerCase();
				if (key == 'enter' || key == 'linefeed') {
					// displayMessage(`pressed key: [${key}]  value: [${comboBox.val()}]  which: [${e.which}]`);
					this.comboBox_preventPopupFlag = true;
					setTimeout(() => comboBoxWidget.close(), 250);
					setTimeout(() => comboBoxWidget.close(), 400);
					this.focusToDefault();
					this.comboBox_enterIstendi($.extend({}, e, { event: evt }));
					setTimeout(() => delete this.comboBox_preventPopupFlag, 300);
					return false;
				}
			});
			comboBoxWidget.input.on('mouseup, touchend', evt => {
				//if (evt.target == document.activeElement)
				if (evt.target.matches(':focus')) {
					if (comboBoxWidget.isOpened()) {
						comboBoxWidget.close();
					}
					else {
						document.activeElement.blur();
						setTimeout(() => comboBoxWidget.open(), 20);
						setTimeout(() => document.activeElement.blur(), 50);
					}
				}
			});
			comboBoxWidget.input.on('blur', evt => {
				const {parentPart} = this;
				if (parentPart && !parentPart.isDestroyed && parentPart.onResize) {
					if (this._timer_blur) {
						clearTimeout(this._timer_blur);
						delete this._timer_blur
					}
					this._timer_blur = setTimeout(_e => {
						try { parentPart.onResize({ event: _e.event }) }
						finally { delete this._timer_blur }
					}, 300, { event: evt })
				}
			});
			/*comboBox.on('dblclick', evt => {
				debugger;
			});*/
		}

		getWidgetWidth(e) {
			const {content, comboBox} = this;
			let width = this.width || content.parent().parent().width();
			if ((width || 0) < 20)
				width = content.parent().width();
			width = width < 20 ? null : width - ($(window).width() < 450 ? 13 : 10);
			return width || '99.7%'
		}

		async onResize(e) {
			await super.onResize(e);
			const {app, comboBoxWidget, comboBox} = this;
			if (comboBoxWidget && comboBoxWidget.isOpened && comboBoxWidget.isOpened())
				return
			// comboBoxWidget.close();
			const currentWidth = asFloat(comboBoxWidget.width) || 0;
			const newWidth = this.getWidgetWidth(e) || 0;
			if (Math.abs(newWidth - currentWidth) > 10)
				comboBoxWidget.width = newWidth;
			comboBoxWidget.resize();
			comboBox.jqxComboBox('dropDownWidth', comboBox.width())
		}
		comboBox_getDataAdapter(e) {
			e = e || {};
			let handler = this.events.comboBox_getDataAdapter;
			let dataAdapter;
			if (handler) {
				let result = handler.call(this, $.extend({}, e, { sender: this }));
				if (result) {
					dataAdapter = result;
					// let recs = this.comboBoxWidget.getItems();
					this.comboBox_veriYuklendi($.extend(e, {}, { dataAdapter: dataAdapter, totalrecords: result.length, records: result }))
				}
			}
			if (!dataAdapter) {
				dataAdapter = new $.jqx.dataAdapter({
					datatype: 'json', id: this.idSaha, url: wsURLBase,
					data: { searchText: e.searchText, maxRow: e.maxRow }
				}, {
					autoBind: false,
					loadServerData: (wsArgs, source, callback) => {
						try {
							this.comboBox_loadServerData($.extend({}, e, { wsArgs: wsArgs, source: source, callback: callback }))
						}
						catch (ex) {
							defFailBlockBasit(ex);
							callback({ totalrecords: 0, records: [] });
							// throw ex;
						}
					}
				});
			}
			this.comboBox_dataAdapterOlustu($.extend({}, e, { dataAdapter: dataAdapter }));
			return dataAdapter
		}
		async comboBox_loadServerData(e) {
			const {wsArgs} = e;
			const dbMgr = this.app.dbMgrs.rom_data;
			let handler = this.events.comboBox_loadServerData;
			if (handler) {
				let result = await handler.call(this, $.extend({}, e, { sender: this }));
				if (result) {
					if ($.isArray(result)) {
						if (!this.listedenSecilmezFlag)
							result.unshift({ action: 'listedenSec', kod: '@action', aciklama: `<div class="action">Listeden Seç...<hr/></div>` });
						e.callback({ totalrecords: result.length, records: result });
					}
					else if (result == 'object') {
						e.callback(result);
					}
					this.comboBox_veriYuklendi($.extend(e, {}, { sender: this, totalrecords: result.length, records: result }));
					return result
				}
			}
			const {table} = this; if (!table) { return }
			const {alias, idSaha, adiSaha, sadeceKodmu} = this;
			const aliasVeNokta = alias ? alias + '.' : '';
			const tableVeAlias = `${table}${alias ? ' ' + alias : ''}`;
			// const kodClause = this.kodsuzmu ? `''` : `${aliasVeNokta}${idSaha}`;
			// const adiClause = sadeceKodmu ? `''` : `${aliasVeNokta}${adiSaha}`;
			const kodClause = `${aliasVeNokta}${idSaha}`;
			const adiClause = `${aliasVeNokta}${adiSaha}`;
			let sent = new MQSent({
				from: tableVeAlias,
				where: [`${kodClause} <> ''`],
				sahalar: [`${kodClause} kod`, `${adiClause} aciklama`]
			});
			let searchText = ((wsArgs || {}).searchText || '');
			searchText = searchText.trim ? searchText.trim().toLocaleUpperCase(culture) : null;
			if (searchText) {
				let {where: wh} = sent;
				let parts = searchText.split(' '); for (let part of parts) {
					part = part.trim(); if (part) {
						let orjPart = part = part.replace(/\*/g, `%`).replace(`'`, `''`);
						if (!(part[0] == '*' || part[0] == '%')) { part = `%${part}`; }
						wh.add(`(${kodClause} LIKE ${MQSQLOrtak.sqlDegeri(part + '%')} OR UPPER(${adiClause}) LIKE ${MQSQLOrtak.sqlDegeri(part + '%')})`)
					}
				}
			}
			let stm = new MQStm({
				sent, orderBy: [sadeceKodmu ? kodClause : adiClause],
				limit: wsArgs.maxRow
			});
			handler = this.events.comboBox_stmDuzenleyici;
			if ($.isFunction(handler)) {
				let _e = $.extend({}, e, { sender: this, stm, sent, table: this.table, alias: this.alias, searchText: searchText, maxRow: wsArgs.maxRow, wsArgs: wsArgs });
				let result = await handler.call(this, $.extend({}, _e));
				if (result === false)
					return;
				
				stm = _e.stm;
				if (result && typeof result != 'boolean')
					stm = result;
			}

			try {
				let recs = [];
				if (!this.listedenSecilmezFlag)
					recs.push({ action: 'listedenSec', kod: '@action', aciklama: `<div class="action">Listeden Seç...<hr/></div>` });
				
				let rowidSet = {};
				let rs = await dbMgr.executeSql({ query: stm });
				let _recs = [];
				for (let i = 0; i < rs.rows.length; i++) {
					const rec = rs.rows[i];
					const {rowid} = rec;
					const hasRowID = rowid != null;
					if (!hasRowID || !rowidSet[rowid]) {
						if (hasRowID)
							rowidSet[rowid] = true;
						_recs.push(rec);
					}
				}
				handler = this.events.comboBox_recsDuzenleyici;
				if ($.isFunction(handler)) {
					let result = await handler.call(this, $.extend({}, e, { sender: this, recs: _recs, searchText: searchText, maxRow: wsArgs.maxRow, wsArgs: wsArgs }));
					if (result === false)
						return;
					
					_recs = e.recs;
					if (result && typeof result != 'boolean')
						_recs = result;
				}
				recs.push(..._recs);
				try { e.callback({ totalrecords: recs.length, records: recs }) }
				catch (ex) { console.error(ex) }
				
				await this.comboBox_veriYuklendi($.extend(e, {}, { sender: this, totalrecords: recs.length, records: recs }))
			}
			catch (ex) {
				throw ex
			}
		}

		comboBox_dataAdapterOlustu(e) {
			/*if (this.selectedId)
				this.comboBox_itemSelectedDevam({ value: this.selectedId });*/
		}

		comboBox_veriYuklendi(e) {
			e = e || {};
			const id = this.selectedId;
			if (id && !this.selectedIdAtandimi) {
				this.comboBox.val(id);
				this.selectedIdAtandimi = true;
			}

			let handler = (e.handlers || {}).comboBox_veriYuklendi || this.events.comboBox_veriYuklendi;
			if ($.isFunction(handler))
				handler.call(this, $.extend({}, e, { id: id }));
			
			/*this.setUniqueTimeout({
				key: 'comboBoxWidget_refresh', delayMS: 1000, isInterval: false,
				block: e =>
					this.comboBoxWidget.refresh()
			})*/
		}

		focusToDefault() {
			const target = this.comboBox;
			if (target && target.length) {
				this.app.setUniqueTimeout({
					key: 'focusToDefault', delayMS: 100, isInterval: false,
					block: e => {
						e.target.find('input')
							.focus()
					},
					args: [{ target: target }]
				})
			}
		}


		comboBox_enterIstendi(e) {
			let value = e.value == null ? e.event.target.value : e.value;
			this.comboBox_itemSelectedDevam({ value: value });
		}

		comboBox_itemSelected(e) {
			const {boundItem} = e;
			if (!boundItem)
				return
			
			const {action} = boundItem;
			if (action) {
				let lastIndex = this.lastIndex;
				if (lastIndex == null)
					lastIndex = -1

				this.comboBox.jqxComboBox('selectedIndex', lastIndex);
				switch (action) {
					case 'listedenSec':
						this.listedenSecIstendi(e);
						break;
				}
			}
			else {
				$.extend(this, { lastItem: boundItem, lastIndex: e.index });
				this.selectedRec = boundItem;
				this.comboBox_itemSelectedDevam({ rec: boundItem })
			}
		}

		async listedenSecIstendi(e) {
			e = e || {};
			document.activeElement.blur();
			await new Promise(resolve =>
				setTimeout(async e => resolve(await this.listedenSecIstendiDevam(e)), 100, e));
		}

		async listedenSecIstendiDevam(e) {
			document.activeElement.blur();
			
			let handler = this.events.listedenSec;
			if (handler) {
				let result = handler.call(this, $.extend({}, e, { sender: this }));;
				if (result)
					return;
			}

			let listeSinif = this.listeSinif;
			if (listeSinif) {
				const ekArgs = $.extend({
					parentPart: this.parentPart,
					ekOzellik: this.ekOzellik,
					listeColumnsDuzenleFunc: this.events.listeColumnsDuzenleFunc,
					liste_loadServerData: this.events.liste_loadServerData,
					liste_loadServerData_buildQuery: this.events.liste_loadServerData_buildQuery,
					liste_stmDuzenleyici: this.events.liste_stmDuzenleyici,
					liste_loadServerData_ekIslemler: this.events.liste_loadServerData_ekIslemler,
					listeDataAdapterOlusturFunc: this.events.listeDataAdapterOlusturFunc,
					table: this.table, idSaha: this.idSaha, adiSaha: this.adiSaha,
					secince: e => setTimeout(e => this.masterListe_itemSelected(e), 100, e)
				}, this.events.listedenSec_ekArgs || {});
				
				const listePart = listeSinif.current;
				if (listePart) {
					for (let key in ekArgs) {
						const value = ekArgs[key];
						if (value !== undefined)
							listePart[key] = value;
					}
				}
				await listeSinif.run(ekArgs);
			}
		}

		async masterListe_itemSelected(e) {
			e = e || {};
			let rec = this.selectedRec = e.rec;
			const text = this.kodsuzmu
				? (rec.aciklama || '')
				: this.sadeceKodmu
					? (rec.kod || '')
					: new CKodVeAdi(rec).parantezliOzet();
			this.comboBox.val(text);

			let handler = this.events.masterListe_itemSelected;
			if (handler) {
				let result = await handler.call(this, $.extend({}, e, { sender: this }));;
				if (result)
					return
			}

			this.comboBox_itemSelectedDevam(e)
		}

		async comboBox_itemSelectedDevam(e) {
			// let rec = e.rec = e.rec || this.selectedRec;
			e = e ?? {}; let {rec, value} = e;
			const {comboBox, comboBoxWidget, table, idSaha, adiSaha} = this;
			comboBoxWidget.input.val('');
			comboBox.jqxComboBox('placeHolder', this.originalPlaceHolder || '');
			this.focusToDefault();
			if (value != null && table && idSaha) {
				/*let _recs = this.comboBoxWidget.getItems();
					if ($.isEmptyObject(_recs)) {
				*/
				let promise = new Promise(async resolve => {
					if (value) {
						let da = await this.comboBox_getDataAdapter({
							searchText: value,
							maxRow: this.autoCompleteMaxRow,
							handlers: {
								comboBox_veriYuklendi: _e => {
									if (value) {
										const _recs = (_e.records.filter(_rec => !_rec.action) || []);
										_e.rec = rec = _recs?.find(_rec => (_rec.kod || _rec.uid) == value) || _recs[0];
									}
									resolve(_e);
								}
							}
						});
						if (da)
							da.dataBind();
					}
					else {
						comboBoxWidget.search('');
						resolve({});
					}
				});
				if (value)
					await promise;
				/*}
				else {
					rec = (comboBoxWidget.getItemByValue('3') || {}).originalItem;
				}*/
			}

			let _rec = rec || {};
			$.extend(this, {
				selectedRec: rec || null,
				value: value || null,
				selectedId: _rec.id || _rec.kod || _rec[idSaha] || null
			});
			$.extend(e, {
				rec: rec || null,
				id: this.selectedId || null,
				aciklama: adiSaha ? _rec[adiSaha] : null
			});
			if (rec) {
				const text = this.kodsuzmu
					? (rec.aciklama || '')
					: this.sadeceKodmu
						? (rec.kod || '')
						: new CKodVeAdi({ kod: rec[idSaha] || rec.kod, aciklama: rec[adiSaha] || rec.aciklama }).parantezliOzet();
				
				// this.comboBox.val(value ? '' : text);
				
				this.comboBox.jqxComboBox('placeHolder', text);
			}

			this.focusToDefault();
			let handler = this.events.comboBox_itemSelected;
			if (handler /*&& (rec || value)*/) {
				let result = await handler.call(this, $.extend({}, e, { sender: this }));
				if (result)
					return;
			}
			this.focusToDefault();

			// this.comboBox.find('input').select();
		}
	}
})()
