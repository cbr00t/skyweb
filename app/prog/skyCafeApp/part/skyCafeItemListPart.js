(function() {
	window.SkyCafeItemList = class extends window.SkyCafePartBase {
		constructor(e) {
			e = e || {};
			super(e);

			let keys = [
				'itemFormParent', 'itemForm', 'defaultFilters', 'filter', 'hizliBulForm', 'txtHizliBul',
				'textFilter', 'idSelector', 'aciklamaSelector', 'dataSource', 'itemBuilder', 'templateItem',
				'defaultItemDuzenleyici', 'itemDuzenleyiciler', 'itemDuzenleyici', 'cssDuzenleyiciler', 'cssDuzenleyici',
				'toplamParent', 'divToplam', 'toplamGetter', 'toplamValueDuzenleyici', 'toplamRenderer',
				'eventSelector', 'eventRightClickSelector'
			];
			for (const i in keys) {
				const key = keys[i];
				const value = e[key];
				if (value !== undefined)
					this[key] = value;
			}
		}

		static get noResizeEventOnInputs() { return false }
		static get partName() { return 'itemList' }
		static get isComponent() { return true }

		async destroyPart(e) {
			e = e || {};
			const itemForm = e.itemForm || this.itemForm;
			if (itemForm && itemForm.length)
				itemForm.remove();
			
			const {divToplam} = this;
			if (divToplam && divToplam.length) {
				divToplam.html(``);
				return;
			}
		}

		async tazele(e) {
			e = e || {};
			await this.listeTazele(e);
			await this.toplamTazele(e);
		}

		async listeTazele(e) {
			e = e || {};
			e.sender = this;
			
			const dataSource = await Utils.getFuncValue(e.dataSource == null ? this.dataSource : e.dataSource, e);
			let recs = await Utils.getFuncValue(dataSource, e);
			recs = await recs;
			recs = recs ? (recs.records || recs) : null;
			this.lastRecs = e.recs = recs;
			
			const itemFormParent = await Utils.getFuncValue(e.itemFormParent == null ? this.itemFormParent : e.itemForm, e);
			const itemForm = await Utils.getFuncValue(e.itemForm == null ? this.itemForm : e.itemForm, e);
			if (!recs) {
				itemForm.addClass(`jqx-hidden`);
				return;
			}
			
			const defaultFilters = await Utils.getFuncValue(e.defaultFilters == null ? this.defaultFilters : e.defaultFilters);
			const filter = await Utils.getFuncValue(e.filter == null ? this.filter : e.filter, e);
			const _filters = [];
			if (defaultFilters)
				_filters.push(defaultFilters);
			if (filter)
				_filters.push(filter);

			const filters = [];
			for (const i in _filters) {
				const _filter = _filters[i];
				if (_filter) {
					if ($.isArray(_filter))
						filters.push(..._filter);
					else
						filters.push(_filter);
				}
			}

			const _parent = $(document.createDocumentFragment());
			if ($.isEmptyObject(recs)) {
				itemForm.addClass(`jqx-hidden`);
			}
			else {
				const txtHizliBul = e.txtHizliBul || this.txtHizliBul;
				let textFilterParts = [], textFilterPartsLower = [], textFilterPartsTRLower = [];
				const _textFilter = e.textFilter || this.textFilter;
				const textFilter = _textFilter == null
					? (txtHizliBul && txtHizliBul.length ? txtHizliBul.val() : null)
					: await Utils.getFuncValue(_textFilter, e);
				if (textFilter) {
					const parts = textFilter.split(' ');
					for (const i in parts) {
						const part = parts[i];
						if (part) {
							textFilterParts.push(part);
							textFilterPartsLower.push(part.toLowerCase());
							textFilterPartsTRLower.push(part.toLocaleLowerCase(culture));
						}
					}
				}
				if ($.isEmptyObject(filters) && !$.isEmptyObject(textFilterParts))
					filters.push(e => this.filterAciklama(e));

				const defaultItemDuzenleyici = e.defaultItemDuzenleyici == null ? this.defaultItemDuzenleyici : e.defaultItemDuzenleyici;
				const itemDuzenleyiciler = [];
				if (defaultItemDuzenleyici)
					itemDuzenleyiciler.push(defaultItemDuzenleyici);
				
				const _itemDuzenleyiciler = (e.itemDuzenleyiciler || e.itemDuzenleyici) == null ? this.itemDuzenleyiciler : (e.itemDuzenleyiciler || e.itemDuzenleyici);
				if (_itemDuzenleyiciler) {
					if ($.isArray(_itemDuzenleyiciler))
						itemDuzenleyiciler.push(..._itemDuzenleyiciler);
					else
						itemDuzenleyiciler.push(_itemDuzenleyiciler);
				}
				const cssDuzenleyiciler = [];
				const _cssDuzenleyiciler = (e.cssDuzenleyiciler || e.cssDuzenleyici) == null
							? (this.cssDuzenleyiciler || this.cssDuzenleyici)
							: (e.cssDuzenleyiciler || e.cssDuzenleyici);
				if (_cssDuzenleyiciler) {
					if ($.isArray(_cssDuzenleyiciler))
						cssDuzenleyiciler.push(..._cssDuzenleyiciler);
					else
						cssDuzenleyiciler.push(_cssDuzenleyiciler);
				}

				const itemBuilder = e.itemBuilder == null ? this.itemBuilder : e.itemBuilder;
				const idSelector = e.idSelector || this.idSelector || 'id';
				let templateItem;
				const aciklamaSelector = e.aciklamaSelector || this.aciklamaSelector || 'aciklama';
				for (let i in recs) {
					i = asInteger(i);
					const rec = recs[i];
					const id = rec[idSelector];
					const aciklama = rec[aciklamaSelector] || '';
					const _e = $.extend({}, e, {
						itemFormParent: itemFormParent, itemForm: itemForm, dataSource: recs,
						rec: rec, boundIndex: i, id: id, aciklama: aciklama, textFilter: textFilter,
						textFilterParts: textFilterParts, textFilterPartsLower: textFilterPartsLower, textFilterPartsTRLower: textFilterPartsTRLower
					});

					let uygunmu = true;
					if (uygunmu && filters) {
						for (const i in filters) {
							if (!uygunmu)
								break;
							const filter = filters[i];
							uygunmu = await Utils.getFuncValue(filter, _e);
						}
						if (!uygunmu)
							continue;
					}
					if (uygunmu && rec.filter)
						uygunmu = await Utils.getFuncValue(rec.filter, _e);
					
					const _itemBuilder = rec.itemBuilder == null ? itemBuilder : rec.itemBuilder;
					let divItem;
					if (_itemBuilder) {
						divItem = _e.divItem = await Utils.getFuncValue(_itemBuilder, _e);
					}
					else {
						if (templateItem === undefined)
							templateItem = await Utils.getFuncValue(e.templateItem == null ? this.templateItem : e.templateItem, e);
						if (templateItem)
							divItem = _e.divItem = templateItem.clone(true);
					}
					
					divItem.prop('id', id);
					divItem.attr(`data-id`, id);
					if (i % 2 == 1)
						divItem.addClass(`even`);
					
					if (!$.isEmptyObject(itemDuzenleyiciler)) {
						for (const i in itemDuzenleyiciler) {
							const handler = itemDuzenleyiciler[i];
							const result = await Utils.getFuncValue(handler, _e);
							if (result === false)
								continue;
						}
					}
					if (rec.itemDuzenle) {
						const result = await rec.itemDuzenle(_e);
						if (result === false)
							continue;
					}
					
					if (!$.isEmptyObject(cssDuzenleyiciler)) {
						for (const j in cssDuzenleyiciler)
							Utils.getFuncValue(cssDuzenleyiciler[i], _e);
					}
					if (rec.cssDuzenle)
						rec.cssDuzenle(_e);

					divItem.appendTo(_parent);
					divItem.data('args', _e);

					const eventSelector = e.eventSelector == null ? this.eventSelector : e.eventSelector;
					if (eventSelector) {
						divItem.on('click', evt => {
							const tagName = evt.target.tagName.toUpperCase();
							if (!(tagName == 'DIV' || tagName == 'SPAN' || tagName == 'P' || tagName == 'B' || tagName == 'I' || tagName == 'U'))
								return;
							const divItem = $(evt.currentTarget);
							const _e = divItem.data('args');
							const {itemFormParent} = _e;
							if (!itemFormParent.hasClass(`scrolled`)) {
								const callArg = $.extend({}, e, _e, { id: divItem.id, event: evt });
								const handler = typeof eventSelector == 'string'
													? this[eventSelector]
													: eventSelector;
								Utils.getFuncValue(handler, callArg);
							}
						});
					}
					const eventRightClickSelector = e.eventRightClickSelector == null ? this.eventRightClickSelector : e.eventRightClickSelector;
					if (eventRightClickSelector) {
						divItem.on('contextmenu', evt => {
							const tagName = evt.target.tagName.toUpperCase();
							if (!(tagName == 'DIV' || tagName == 'SPAN' || tagName == 'P'))
								return;
							const divItem = $(evt.currentTarget);
							const _e = divItem.data('args');
							const {itemFormParent} = _e;
							if (!itemFormParent.hasClass(`scrolled`)) {
								const callArg = $.extend({}, e, _e, { id: divItem.id, event: evt });
								const handler = typeof eventRightClickSelector == 'string'
													? this[eventRightClickSelector]
													: eventRightClickSelector;
								Utils.getFuncValue(handler, callArg);
							}
						});
					}
				}
				itemForm.removeClass(`jqx-hidden`);

				itemForm.addClass(`basic-hidden`);
				itemForm.children().remove();
				_parent.appendTo(itemForm);
				itemForm.removeClass(`basic-hidden`);
				
				if (!itemFormParent.hasClass(`scrollable`)) {
					Utils.makeScrollable(itemFormParent);
					itemFormParent.addClass(`scrollable`);
				}
			}
		}

		async toplamTazele(e) {
			e = e || {};
			const {/*toplamParent,*/ divToplam} = this;
			if (!(divToplam && divToplam.length))
				return;
			
			const toplamGetter = e.toplamGetter == null ? this.toplamGetter : e.toplamGetter;
			if (!toplamGetter)
				return;
			
			let {recs} = e;
			if (recs == null) {
				const dataSource = await Utils.getFuncValue(e.dataSource == null ? this.dataSource : e.dataSource, e);
				recs = await Utils.getFuncValue(dataSource, e);
			}
			recs = await recs;
			this.lastRecs = recs = recs ? (recs.records || recs) : null;

			const toplamValueDuzenleyici = e.toplamValueDuzenleyici == null ? this.toplamValueDuzenleyici : e.toplamValueDuzenleyici;
			let toplam = 0;
			if (recs) {
				for (const i in recs) {
					const rec = recs[i];
					let value = typeof toplamGetter == 'string'
										? rec[toplamGetter]
										: getFuncValue(toplamGetter, { sender: this, rec: rec, recs: recs });
					value = asFloat(value) || 0;
					if (value) {
						if (toplamValueDuzenleyici) {
							const _e = { sender: this, toplam: toplam, value: value };
							value = Utils.getFuncValue(toplamValueDuzenleyici, _e);
						}
						toplam += value;
					}
				}
			}
			toplam = toplam || 0;

			let toplamHTML = numberToString(toplam);
			const toplamRenderer = e.toplamRenderer == null ? this.toplamRenderer : e.toplamRenderer;
			if (toplamRenderer) {
				const _e = { value: toplam, defaultHTML: toplamHTML };
				toplamHTML = Utils.getFuncValue(toplamRenderer, _e);
			}
			if (toplamHTML != null)
				divToplam.html(toplamHTML);
			// divToplam.html(`${bedelStr(toplam || 0)} TL`);
			
			/*if (toplam)
				toplamParent.removeClass(`jqx-hidden`);
			else
				toplamParent.addClass(`jqx-hidden`);*/
		}

		filterAciklama(e) {
			const {aciklama, textFilterParts, textFilterPartsLower, textFilterPartsTRLower} = e;
			const aciklamaLower = aciklama.toLowerCase();
			const aciklamaTRLower = aciklama.toLocaleLowerCase(culture);
			let uygunmu = true;
			for (let i = 0; i < textFilterParts.length; i++) {
				if (!(aciklama.includes(textFilterParts[i]) ||
							aciklamaLower.includes(textFilterPartsLower[i]) ||
							aciklamaTRLower.includes(textFilterPartsTRLower[i]))) {
					uygunmu = false;
					break
				}
			}
			return uygunmu;
		}

		async onResize(e) {
			await super.onResize(e);

			const {itemFormParent, itemForm, toplamParent} = this;
			if (itemFormParent && itemFormParent.length) {
				itemFormParent.height($(window).height() - itemFormParent.offset().top - 8);
				itemFormParent.width(itemFormParent.parent().width());
				
				if (toplamParent && toplamParent.length)
					toplamParent.width(itemFormParent.width() - 3);
			}
		}
	}
})()
