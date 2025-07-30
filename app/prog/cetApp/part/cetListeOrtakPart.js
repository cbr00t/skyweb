(function() {
	window.CETListeOrtakPart = class extends window.CETSubPart {
		static get canDefer() { return true }
		static get _partName() { return 'cetListeOrtak' }
		static get partName() { return this._partName }
		get partRoot() { return `../app/prog/cetApp/part/` }
		static get noResizeEvent() { return false }
		/* static get noResizeEventOnInputs() { return false } */
		get listeDefaultHeight() {
			return typeof this.height == 'number' || typeof this.height == 'string'
						? this.height
						: $(window).height() - this.divListe.offset().top - ($(window).width() < 500 ? 30 : 40)
		}
		
		constructor(e) {
			e = e || {};
			super(e);
			this.setParams(e);
			this.selectedIndexes = {}
			// if (!(this.layout || this.template))
			// 	this.template = this.app.templates.cetListeOrtak
		}
		async preInitLayout(e) {
			e = $.extend(e || {}, { part: this });
			await super.preInitLayout(e);
			
			const layout = e.layout = e.layout || this.layout;
			// if (this.class.canDefer)
			// 	layout.css('opacity', .01);

			let thisPartName = this.class._partName;
			if (!layout.hasClass(thisPartName))
				layout.addClass(thisPartName);
			
			const {param, parentPart} = this;
			if (param) {
				const partName = (parentPart || this).partName;
				let _userSettings = param.userSettings = param.userSettings || {};
				_userSettings = _userSettings[partName] = _userSettings[partName] || {};

				const _layout = layout[0];
				const partID = _layout.id || _layout.getAttribute('name') || _layout.className;
				this.userSettings_liste = _userSettings = _userSettings[partID] = _userSettings[partID] || {};
			}
		}

		async postInitLayout(e) {
			e = e || {};
			const layout = e.layout = e.layout || this.layout;
			await super.postInitLayout(e);
			await this.saveGlobals(e);
			await this.initListe(e);
			setTimeout(() => {
				if (!this.ilkTazeleYapildimi)
					this.tazele($.extend({}, e, { initFlag: true }))
			}, 50)
		}
		async activatePart(e) {
			e = e || {};
			// this.setParams(e);
			const layout = e.layout || this.layout;
			// if (this.class.canDefer)
			//	layout.css('opacity', .01)

			try {
				await super.activatePart(e);
				
				await this.initIslemTuslari();
				this.initListePopup(e);
				// await this.onResize(e);
			}
			finally {
				// setTimeout(() => layout.css('opacity', 1), 300);
				// setTimeout(() => layout.css('opacity', 1), 600);
				// setTimeout(() => layout.css('opacity', 1), 1300);
			}
		}

		async deactivatePart(e) {
			this.listeReadyFlag = 0;

			const {listeWidget, param, userSettings_liste} = this;
			if (listeWidget && param && userSettings_liste) {
				let paramDegistimi = false;
				if (userSettings_liste.pageSize != listeWidget.pageSize) {
					userSettings_liste.pageSize = listeWidget.pageSize;
					paramDegistimi = true;
				}
				
				const {filtercolumnsList} = listeWidget;
				if (userSettings_liste && filtercolumnsList && filtercolumnsList.length) {
					const filterKey = filtercolumnsList.val();
					if (filterKey != userSettings_liste.lastFilterKey) {
						userSettings_liste.lastFilterKey = filterKey;
						paramDegistimi = true;
					}
				}

				if (paramDegistimi) {
					await param.kaydet();

					const _param = (this.app || sky.app).param;
					if (_param && param != _param) {
						_param.userSettings = param.userSettings;
						await _param.kaydet();
					}
				}
			}
			
			await super.deactivatePart(e);
		}
		

		setParams(e) {
			e = e || {};
			$.extend(this, {
				secButonuKontrolEdilirmi: true,
				secinceGeriYapilmazFlag: asBool(e.secinceGeriYapilmaz),
				secinceKontrolEdilmezFlag: false,
				listeLayout: e.listeLayout || '#liste',
				listeLayoutTemplate: e.listeLayoutTemplate || null,
				listePartsLayout: e.listePartsLayout || '#listeParts',
				islemTuslariLayout: e.islemTuslariLayout || '.asil.islemTuslari',
				islemTuslariLayoutTemplate: e.islemTuslariLayoutTemplate || null,
				table: e.table, idSaha: e.idSaha || 'kod', adiSaha: e.adiSaha || 'aciklama',
				secince: e.secince, defaultSortField: e.defaultSortField,
				targetRecUid: e.targetRecUid, widgetDuzenleyici: e.widgetDuzenleyici,
				liste_loadServerData: e.liste_loadServerData,
				liste_loadServerData_buildQuery: e.liste_loadServerData_buildQuery,
				liste_stmDuzenleyici: e.liste_stmDuzenleyici,
				liste_loadServerData_ekIslemler: e.liste_loadServerData_ekIslemler,
				listeColumnsDuzenleFunc: e.listeColumnsDuzenleFunc,
				listeDataAdapterOlusturFunc: e.listeDataAdapterOlusturFunc,
				listeCellBeginEditFunc: e.listeCellBeginEditFunc,
				listeCellEndEditFunc: e.listeCellEndEditFunc,
				listeSatirTiklandiFunc: e.listeSatirTiklandiFunc,
				listeSatirCiftTiklandiFunc: e.listeSatirCiftTiklandiFunc,
				listeSatirSecildiFunc: e.listeSatirSecildiFunc,
				listeSatirSecimDegistiFunc: e.listeSatirSecimDegistiFunc,
				listeRenderedFunc: e.listeRenderedFunc,
				selectFilterKey: e.selectFilterKey,
				dbMgr: this.app.dbMgrs.rom_data,
				param: (this.parentPart || {}).param || (this.app || {}).param
			});
		}

		saveGlobals(e) {
			e = e || {};
			const layout = e.layout = e.layout || this.layout;
			
			$.extend(this, {
				divListe: this.findDivListe(e),
				template_listeParts: this.findDivListeParts(e),
				islemTuslari: this.findIslemTuslari(e)
			});

			let {islemTuslari} = this;
			if (!(islemTuslari && islemTuslari.length))
				delete this.islemTuslari;
			
			let listePopup = layout.find('.liste.popup');
			if (listePopup.length)
				this.listePopup = listePopup;
		}

		initIslemTuslari(e) {
			e = e || {};
			let islemTuslari = this.islemTuslari;
			if (!islemTuslari)
				return false;
			
			if (this.isComponent)
				islemTuslari.addClass('jqx-hidden');

			let btnSec = islemTuslari.find('#sec');
			if (btnSec.length)
				this.btnSec = btnSec;
			else
				btnSec = null;
			
			if (this.secince) {
				if (btnSec) {
					btnSec.jqxButton({ theme: theme, width: 40, height: 35 });
					// btnSec.jqxTooltip({ theme: theme, trigger: `hover`, content: `Seç` });
					btnSec.off('click');
					btnSec.on('click', evt =>
						this.sec($.extend({}, e, { event: evt })));
					islemTuslari.removeClass('jqx-hidden');
				}
			}
			else {
				if (!this.secinceKontrolEdilmezFlag)
					islemTuslari.addClass('jqx-hidden');
			}

			return true;
		}

		async initListe(e) {
			let {divListe, listeWidget} = this;
			e.listeArgs = {};
			await this.listeArgsDuzenle(e);
			
			divListe.addClass('liste');
			divListe.jqxDataTable(e.listeArgs);
			listeWidget = this.listeWidget = divListe.jqxDataTable('getInstance');
			this.divListeParent = this.divListe.parent();

			// listeWidget.touchDevice = true;

			divListe.on('bindingComplete', async evt =>
				await this.liste_veriYuklendi($.extend({}, e, { event: evt })));
			divListe.on('rowSelect', evt =>
				this.liste_satirSecildi($.extend({}, e, { event: evt })));
			divListe.on('rowUnselect', evt =>
				this.liste_satirSecimKaldirildi($.extend({}, e, { event: evt })));
			divListe.on('cellBeginEdit', evt =>
				this.liste_cellBeginEdit($.extend({}, e, { event: evt })));
			divListe.on('cellEndEdit', evt =>
				this.liste_cellEndEdit($.extend({}, e, { event: evt })));
			divListe.on('mousedown', async evt =>
				await this.liste_onMouseDown($.extend({}, e, { event: evt })));
			divListe.on('touchstart', async evt =>
				await this.liste_onMouseDown($.extend({}, e, { event: evt })));
			divListe.on('mousemove', async evt =>
				await this.liste_onMouseMove($.extend({}, e, { event: evt })));
			divListe.on('mouseup', async evt =>
				await this.liste_onMouseUp($.extend({}, e, { event: evt })));
			divListe.on('touchend', async evt =>
				await this.liste_onMouseUp($.extend({}, e, { event: evt })));
			divListe.on('rowClick', async evt => {
				const {mouseDownY, mouseMoveY} = this;
				if (mouseDownY == null || mouseMoveY == null || (Math.abs(mouseMoveY - mouseDownY) < 20))
					await this.liste_satirTiklandi($.extend({}, e, { event: evt }))
				this.mouseDownY = this.mouseMoveY = null;
			});
			divListe.on('contextmenu', async evt => {
				const {mouseDownY, mouseMoveY} = this;
				if (mouseDownY == null || mouseMoveY == null || (Math.abs(mouseMoveY - mouseDownY) < 20))
					await this.liste_satirSagTiklandi($.extend({}, e, { event: evt }))
				this.mouseDownY = this.mouseMoveY = null;
			});
			divListe.on('rowDoubleClick', async evt => {
				if (this.inEventFlag_rowDoubleClick)
					return;
				
				/*if (this.timerEvent_rowDoubleClick)
					clearTimeout(this.timerEvent_rowDoubleClick);*/
				
				/*this.inEventFlag_rowDoubleClick = true;
				this.timerEvent_rowDoubleClick = setTimeout(() => {
					try { delete this.inEventFlag_rowDoubleClick }
					finally { delete this.timerEvent_rowDoubleClick }
				}, 50);*/

				await this.liste_satirCiftTiklandi($.extend({}, e, { event: evt }))
			});
			divListe.on('focus', evt =>
				this.liste_onFocus($.extend({}, e, { event: evt })));
			divListe.on('blur', evt =>
				this.liste_onBlur($.extend({}, e, { event: evt })));
			divListe.on('filter', evt =>
				this.liste_onFilter($.extend({}, e, { event: evt })));
		/* dokunmatikte secili satir icin (tek tik => cift tik gibi) algilamasini onlemek icin comment'i kaldirin */
			/*
				let lastEventTime = this.lastEventTimes.rowDoubleClick;
				let currentEventTime = Date.now();
				if (lastEventTime && parseInt((currentEventTime - lastEventTime) / 50) > 1)
					this.liste_satirCiftTiklandi($.extend, e, { event: event });
				lastEventTime = this.lastEventTimes.rowDoubleClick = currentEventTime;
			*/
		/* ****************************************************************************************************** */
		}

		initListePopup(e) {
			const {listePopup} = this;
			if (listePopup) {
				const liItems = listePopup.find('ul > li');
				listePopup.jqxMenu({
					theme: theme, mode: 'popup', autoOpenPopup: false, enableHover: false,
					animationShowDuration: 0, animationHideDuration: 0, width: 220
				});
				liItems.off('click');
				liItems.on('click', evt => {
					listePopup.jqxMenu('close');
					setTimeout(() => this.liste_islemTusuTiklandi($.extend({}, e, { event: evt, id: evt.target.id })), 0);
				});
				
				const {divListe} = this;
				$(divListe, divListe.find('*, tr, td, td *, div, span, div *, span *'))
					.off('contextmenu')
					.on('contextmenu', evt => this.listeContextMenuIstendi($.extend({}, e, { event: evt })))
			}
		}
		listeContextMenuIstendi(e) {
			e = e || {}; const evt = e.event, {divListe, listePopup} = this;
			if (evt)
				evt.preventDefault()
			// const pos = divListe.position();
			// listePopup.jqxMenu('open', pos.left + 230, pos.top + 150);
			const pos = e.pos ?? e.position ?? new $.jqx.position(evt) ?? { left: 0, top: 0 };
			const x = ($(window).width() - pos.left < (divListe.width() / 2) + 10
							?  pos.left - (divListe.width() / 5)
							:  pos.left
					   ) - 60;
			const y = ($(window).height() - pos.top < (divListe.height() / 2) + 10
							?  pos.top - (divListe.height() / 2)
							:  pos.top
					   ) - 30;
			listePopup.jqxMenu('open', x, y)
			// listePopup.jqxMenu('open', pos.left, pos.top)
		}
		listeInitEkIslemler(e) {
			e = e || {};
			let {listeWidget} = this;
			const {userSettings_liste, selectFilterKey} = this;
			const {filtercolumnsList} = listeWidget;
			if ((selectFilterKey != null || userSettings_liste) && filtercolumnsList && filtercolumnsList.length) {
				if (selectFilterKey == null) {
					if (userSettings_liste) {
						let {lastFilterKey} = userSettings_liste;
						if (lastFilterKey != null)
							filtercolumnsList.val(lastFilterKey);
					}
				}
				else {
					filtercolumnsList.val(selectFilterKey);
				}
			}
		}

		async onResize(e) {
			return await new $.Deferred(p => {
				setTimeout(async () => {
					//if (this.isComponent)
					//	return;
					
					await super.onResize(e);
		
					const {app, divListe, listeWidget} = this;
					const activePartLayout = (app.activePart || {}).layout;
					if (this.isDestroyed || this.isPrefetch || app.activePart != this || !listeWidget || this.disableListeResizeEventsFlag) {
						p.resolve()
						return;
					}
		
					try {
						const selectedRecs = listeWidget.getSelection();
						const isMultiSelect = !(listeWidget.selectionMode || '').startsWith(`single`);
		
						const currentHeight = asFloat(divListe.jqxDataTable('height')) || 0;
						const newHeight = this.listeDefaultHeight || 0;
						let degistimi = false;
						if (Math.abs(newHeight - currentHeight) > 10) {
							divListe.jqxDataTable('height', newHeight);
							degistimi = true;
						}
						// divListe.jqxDataTable('width', divListe.jqxDataTable('width'));
						// try { listeWidget.render() } catch (ex) { }
						if (degistimi) {
							try { listeWidget.beginUpdate(); listeWidget.endUpdate() }
							catch (ex) { }
						}
						this.listeInitEkIslemler(e);
		
						if (!$.isEmptyObject(selectedRecs)) {
							this.afterRefreshOnce = e => {
								this.disableEventsDo(() => {
									const {listeWidget} = this;
									if (this.isDestroyed || !listeWidget)
										return;
									
									const selectedRecs = listeWidget.getSelection();
									if (!$.isEmptyObject(selectedRecs)) {
										try {
											for (const rec of selectedRecs)
												listeWidget.selectrowbykey(rec.uid)
										}
										catch (ex) { console.error(ex) }
									}
								});
							};
						}
					}
					catch (ex) { console.error(ex) }
					
					p.resolve()
				}, 100);
			})
		}

		async tazele(e) {
			if (this.isDestroyed || this.isPrefetch)
				return null
			e = e || {};
			this.ilkTazeleYapildimi = true;
			['selectedRec', 'selectedBoundRec', 'selectedIndex'].forEach(key =>
				delete this[key]);

			const layout = e.layout || this.layout;
			/*if (!e.initFlag && this.class.canDefer)
				layout.css('opacity', .01);*/
			const {listeWidget} = this;
			if (!listeWidget)
				return null

			// layout.removeClass('animate-veryslow animate-slow animate animate-fast');
			// layout.addClass('animate');
			
			try {
				try { widget.beginUpdate() }
				catch (ex) { }
				if (!(e.basitmi && listeWidget.source)) {
					e.listeDataAdapter = {};
					let result = await this.liste_dataAdapterOlustur(e);
					listeWidget.source = result ? result : e.listeDataAdapter;
				}
				this.listeReadyFlag = 0;
				if (!listeWidget)
					return null;
				listeWidget.updateBoundData();
				// listeWidget.refresh();

				if ($.isEmptyObject(listeWidget.getRows()))
					this.liste_degisti(e);
			}
			finally {
				try { listeWidget.endUpdate() }
				catch (ex) { }
				/*if (!e.initFlag)
					setTimeout(() => layout.css('opacity', 1), 10);*/
			}

			return listeWidget.source
		}

		/*async tazeleBasit(e) {
			return this.tazele($.extend({}, e, { basitmi: true }))
		}*/

		async sec(e) {
			e = e || {};
			const rec = e.rec || this.selectedRec;
			if (!rec && this.secButonuKontrolEdilirmi)
				return false;
			
			const {listeWidget} = this;
			const isMultiSelect = !(listeWidget.selectionMode || '').startsWith(`single`);
			const recs = listeWidget.getSelection() || [];
			const {layout, btnSec, secince} = this;
			if (btnSec && btnSec.length)
				setButonEnabled(btnSec, false);
			let _e = $.extend({}, e, { sender: this, rec: rec, recs: recs, multiSelect: isMultiSelect });
			// if (this.class.canDefer)
			// 	layout.css('opacity', .01);
			try {
				if (!this.secinceGeriYapilmazFlag)
					await this.geriIstendi($.extend({}, e, { noGeriCallback: true }))
				
				if ($.isFunction(secince)) {
					if (await secince.call(this, _e) === false)
						return false
				}
			}
			finally {
				// if (!e.initFlag)
				// 	setTimeout(() => layout.css('opacity', 1), 300);
				if (btnSec && btnSec.length)
					setTimeout(() => setButonEnabled(btnSec, true), 1000)
			}
			return true
		}
		ekle(e) {
			e = e || {}; let {rec} = e, reverseFlag = e.reverse ?? e.reverseFlag; if (!rec) { return false }
			this.listeWidget.addRow(rec.uid, rec, reverseFlag ? 'first' : 'last');
			this.liste_degisti(e); return true
		}
		degistir(e) {
			e = e || {}; let rec = e.rec || this.selectedBoundRec; if (!rec) { return false }
			const {listeWidget} = this; rec = $.extend(listeWidget.rowsByKey[rec.uid], rec);
			listeWidget.updaterowbykey(rec.uid, rec); delete rec[' ']; this.liste_degisti(e);
			return true
		}
		sil(e) {
			e = e || {}; const rec = e.rec || this.selectedBoundRec, {index} = e;
			if (!rec && (index == null || index < 0)) { return }
			const {listeWidget} = this;
			if (rec) { listeWidget.deleterowbykey(rec.uid) } else { listeWidget.deleteRow(index) }
			this.liste_degisti(e); return true
		}
		temizle(e) { this.listeWidget.clear(); this.liste_degisti(e); return true }
		get listeRecs() { return this.listeWidget.getRows() }
		getListeRecsKontrollu() {
			const {listeWidget} = this; if ($.isEmptyObject(listeWidget.source.originaldata)) { listeWidget.clearFilters() }
			return this.listeRecs
		}
		get editingUid() {
			let {listeWidget} = this, editingIndex = (this.editingCell || {}).rowIndex;
			let uid = editingIndex == null || editingIndex < 0 ? null : this.listeRecs[editingIndex].uid; if (uid == null) { uid = listeWidget.editKey }
			return uid
		}
		get editingRowIndex() {
			let {listeWidget} = this, editingIndex = this.editingCell?.rowIndex;
			if (editingIndex == null || editingRowIndex < 0) {
				let {editKey: uid} = listeWidget;
				if (uid != null) { editingIndex = listeWidget.getrowdisplayindex(listeWidget.rowsByKey[uid]) }
			}
			return editingIndex
		}
		get editingRec() {
			let {listeWidget} = this, editingIndex = this.editingCell?.rowIndex;
			let rec = editingIndex == null || editingIndex < 0 ? null : this.listeRecs[editingIndex];
			if (!rec) {
				let {editKey: uid} = listeWidget;
				if (uid != null) { editingIndex = listeWidget.rowsByKey[uid] }
			}
			return editingIndex
		}
		selectRec(e) {
			e = e || {}; const {listeWidget: widget} = this;
			if ($.isEmptyObject(this.listeRecs) && $.isEmptyObject(widget.dataViewRecords)) { return false }
			let {noSelect, index} = e; if (index != 'last') {
				const {listeRecs: recs} = this; if (!$.isEmptyObject(recs)) {
					switch (index) {
						case 'first': index = 0; break;
						case 'last': index = recs.length - 1; break;
					}
					const uid = e.rec ? e.rec.uid : (index == null ? e.key || e.uid : (recs[index] || {}).uid);
					if (index == null || index < 0) { index = this.indexOfRec(e) }
					if (uid != null) {
						this.disableEventsDo(() => { widget.selectrowbykey(uid); widget.ensurerowvisiblebykey(uid) });
						this.liste_satirSecildiBasit({ index });
					}
				}
				return
			}
			let selectLastRecBlock = e => {
				const widget = e.widget;
				let index = e.index;
				let abortFlag = false;
				abortFlag = !widget.isBindingCompleted();
				if (!abortFlag && index == 'last') {
					this.disableEventsDo(() => {
						let recCount = Math.max(widget.source.totalrecords || 0, this.listeRecs.length);
						if (widget.pageable && recCount) {
							let pageNo = parseInt((recCount - 1) / widget.dataview.pagesize);
							if (pageNo && pageNo == this._lastAutoPageNo) {
								abortFlag = true;
								return;
							}
							widget.goToPage(pageNo);
							this._lastAutoPageNo = pageNo;
							//let input = widget.pager.find('.jqx-grid-pager-top div .jqx-grid-pager-input');
							//input.val(pageNo);
							// widget.dataview.pagenum = pageNo;
						}
						if (!recCount)
							abortFlag = true;
					});
					abortFlag = !widget.isBindingCompleted();
				}
				if (abortFlag)
					return;

				const recs = this.listeRecs;
				if (!$.isEmptyObject(recs)) {
					switch (index) {
						case 'first': index = 0;
						case 'last': index = recs.length - 1;
					}

					const uid = (recs[index] || {}).uid;
					if (uid != null) {
						this.disableEventsDo(() => {
							if (!noSelect)
								widget.selectrowbykey(uid);
							widget.ensurerowvisiblebykey(uid);
						});
						if (!noSelect)
							this.liste_satirSecildiBasit({ index: index });
					}
				}

				// widget.endUpdate();
				this.clearUniqueTimeout({ key: timerKey, isInterval: true });
				widget.refresh(false);
			};
			
			// selectLastRecBlock({ widget: widget, index: index });
			
			let timerKey = `listeOrtakPart_selectLastRec`;
			this.setUniqueTimeout({
				key: timerKey, delayMS: 1, isInterval: false,
				args: { widget: widget, index: index },
				block: e => selectLastRecBlock(e)
			});

			return true;
		}

		selectFirstRec(e) {
			return this.selectRec($.extend({}, e, { index: 'first' }));
		}

		selectLastRec(e) {
			return this.selectRec($.extend({}, e, { index: 'last' }));
		}

		indexOfRec(e) {
			e = e || {}
			let rec = e.rec;
			let uid = rec == null ? e.key || e.uid : rec.uid;
			if (uid == null)
				return -1;
			
			const widget = this.listeWidget;
			rec = widget.rowsByKey[uid];
			
			return widget.getrowindex(rec);
		}

		get liste_isFilterBarVisible() {
			return !this.savedFilterHeight;
		}

		liste_showFilterBar() {
			if (!this.savedFilterHeight)
				return false;
			
			const {divListe} = this;
			divListe.jqxDataTable('filterHeight', this.savedFilterHeight);
			divListe.find('#filterliste .filtercolumns').css('margin-top', 0).height('100%');
			delete this.savedFilterHeight;

			if (!(this.isComponent || this.noResizeEvent))
				this.onResize()

			return true;
		}

		liste_hideFilterBar() {
			if (this.savedFilterHeight)
				return false
			
			this.savedFilterHeight = this.divListe.jqxDataTable('filterHeight');
			this.divListe.jqxDataTable('filterHeight', 0);

			if (!(this.isComponent || this.noResizeEvent))
				this.onResize()

			return true
		}

		liste_toggleFilterBar() {
			if (this.liste_isFilterBarVisible)
				return this.liste_hideFilterBar();
			
			return this.liste_showFilterBar();
		}

		getFiltersFromListeWSArgs(e) {
			let _filters = e.filters || e;
			let {filterGroups} = e;
			if ($.isEmptyObject(filterGroups) && $.isArray(_filters))
				filterGroups = [{ filters: _filters }];
			
			if (!filterGroups)
				return [];

			const app = this.app || sky.app;
			const {listeKodDogrudanAramaYapilirmi} = app;
			const gridFiltreKodSahalari = listeKodDogrudanAramaYapilirmi ? app.gridFiltreKodSahalari : null;
			const filters = [];
			for (const filterGroup of filterGroups) {
				for (const filter of filterGroup.filters) {
					let value = typeof filter.value == 'string' ? filter.value.trim() : filter.value;
					const dataField = filter.field;
					if (!dataField || value == null || value == '')
						continue;

					if (typeof value == 'string')
						value = value.replace(/'/g, `''`).replace(/\*/g, `%`).toLocaleUpperCase(culture);

					let type = filter.type.toLowerCase();
					if (type == 'stringfilter' && typeof value == 'string') {
						if (listeKodDogrudanAramaYapilirmi && gridFiltreKodSahalari && gridFiltreKodSahalari[dataField])
							filter.comparisonoperator = 'EQUAL';
						filter.value = [];
						const parts = value.split(' ');
						for (let part of parts) {
							part = part.trim();
							if (part)
								filter.value.push(part);
						}
					}
					filters.push(filter);
				}
			}

			return filters;
		}

		liste_disableGroupsDo(e) {
			e = e || {};
			let callback = typeof e == 'object' ? e.callback : e;
			if (!callback)
				return;

			const divListe = this.divListe;
			let savedGroups = divListe.jqxDataTable('groups');
			if ($.isEmptyObject(savedGroups))
				return callback.call(this);
			
			divListe.jqxDataTable('groups', []);
			try {
				return callback.call(this)
			}
			finally {
				divListe.jqxDataTable('groups', savedGroups);
			}
		}

		newListeSatirDiv(e) {
			e = e || {};
			return this.newListeSubPart(`.listeSatir${e.cssSubClass ? '.' + e.cssSubClass : ''}`);
		}

		newListeSubPart(e) {
			e = e || {};
			if (typeof e != 'object')
				e = { selector: e };
			
			return this.template_listeParts.contents(e.selector).clone(true);
		}

		findDivListe(e) {
			const layout = e.layout || this.layout;
			const template = this.listeLayoutTemplate;
			
			let div = this.listeLayout;
			if (typeof div == 'string')
				div = layout.find(div);
			
			if ($.isFunction(div)) {
				div = div.call(this, $.extend({}, e, { sender: this }));
				if (typeof div == 'string')
					div = layout.find(div);
			}
			
			if (!(div && div.length) && (template && template.length))
				div = template.contents('div').clone(true);
			
			return div;
		}

		findDivListeParts(e) {
			const layout = e.layout || this.layout;
			const template = this.listePartsLayoutTemplate;
			
			let div = this.listePartsLayout;
			if (typeof div == 'string')
				div = layout.find(div);
			
			if ($.isFunction(div)) {
				div = div.call(this, $.extend({}, e, { sender: this }));
				if (typeof div == 'string')
					div = layout.find(div);
			}
			
			return div;
		}

		findIslemTuslari(e) {
			const layout = e.layout || this.layout;
			const template = this.islemTuslariLayoutTemplate;
			
			let div = this.islemTuslariLayout;
			if (typeof div == 'string')
				div = layout.find(div);
			
			if ($.isFunction(div)) {
				div = div.call(this, $.extend({}, e, { sender: this }));
				if (typeof div == 'string')
					div = layout.find(div);
			}
			
			if (!(div && div.length) && (template && template.length))
				div = template.contents('div').clone(true);
			
			return div;
		}


		async listeArgsDuzenle(e) {
			e.listeColumns = [];
			await this.liste_columnsDuzenle(e);

			const isMiniDevice = $(window).height() < 650;
			const {userSettings_liste} = this;
			$.extend(e.listeArgs, {
				theme: theme, localization: localizationObj,
				width: false, /* height: 'auto', */
				altRows: true, autoRowHeight: true, incrementalSearch: false,
				filterMode: 'simple', selectionMode: 'singlerow',
				filterHeight: isMiniDevice ? 35 : 40,
				pagerHeight: isMiniDevice ? 32 : 40,
				toolbarHeight: isMiniDevice ? 30 : 34,
				columnsHeight: isMiniDevice ? 23 : 28,
				sortable: true, filterable: true, pageable: true, columnsResize: true, showToolbar: true,
				pagerMode: 'advanced',
				pageSizeOptions: [
					3, 4, 5, 6, 7, 8, 10, 13, 15, 20, 25, 30, 33, 35
				],
				pagerButtonsCount: 5, pagerPosition: 'top',
				pageSize: userSettings_liste.pageSize || (isMiniDevice ? 5 : 8),
				/* serverProcessing: true, */
				autoShowLoadElement: true,
				renderToolbar: toolbar => {
					this.listeToolbar = e.listeToolbar = toolbar;
					this.liste_renderToolbar(e)
				},
				columns: e.listeColumns,
				// ready: () => this.liste_veriYuklendi($.extend({}, e)),
				rendered: () => {
					if (this._timer_listeRendered) {
						clearTimeout(this._timer_listeRendered);
						delete this._timer_listeRendered
					}
					this._timer_listeRendered = setTimeout(async e => {
						try {
							if (!this.listeWidget) {
								const {divListe} = this;
								if (!this.isDestroyed && divListe && divListe.length)
									this.listeWidget = divListe.jqxDataTable('getInstance');
							}
							await this.liste_rendered(e)
						}
						finally { delete this._timer_listeRendered }
					}, 10, e)
				}
			});

			let func = this.widgetDuzenleyici;
			if ($.isFunction(func)) {
				let _listeArgs = await func.call(this, $.extend({}, e, { sender: this }));
				if (!$.isEmptyObject(_listeArgs))
					$.extend(e.listeArgs, _listeArgs);
			}

			if (!e.listeArgs.pageable)
				e.listeArgs.pageSize = 0;
			
			let {height} = e.listeArgs;
			if (height)
				this.height = typeof height == 'number' || typeof height == 'string';
			else
				height = e.listeArgs.height = this.listeDefaultHeight;
		}

		async liste_columnsDuzenle(e) {
			let columns = e.listeColumns;
			let func = this.listeColumnsDuzenleFunc;
			if ($.isFunction(func)) {
				let ekColumns = await func.call(this, $.extend({}, e, { sender: this }));
				if (ekColumns)
					columns.push(...ekColumns)
			}
		}

		liste_columnsDuzenle_generateCell(e) {
			let {getter} = e;
			let value = getter ? ($.isFunction(getter) ? (getter.call(this, $.extend({}, e, { sender: this }))) : getter) : e.value;
			
			let divSatir = this.newListeSatirDiv(e);
			divSatir.addClass(e.selector);
			divSatir.attr('data-index', e.rowIndex);
			divSatir.html(value);
			
			return divSatir[0].outerHTML.trim()
		}

		liste_renderToolbar(e) {
			// e.listeToolbar;
		}

		async liste_dataAdapterOlustur(e) {
			let func = this.listeDataAdapterOlusturFunc || (e => this.getDataAdapter_liste(e));
			if ($.isFunction(func)) {
				let da = await func.call(this, $.extend({}, e, { sender: this }));
				if (da)
					e.listeDataAdapter = da;
			}
		}

		getDataAdapter_liste(e) {
			e = e || {};
			let source = {
				id: this.idSaha, datatype: defaultOutput, datafields: [],
				url: 'empty.json', data: {}
				// data: this.buildAjaxArgs({}),
			};
			return new $.jqx.dataAdapter(source, {
				loadServerData: async (wsArgs, source, callback) => {
					try {
						await this.loadServerData($.extend({}, e, { wsArgs: wsArgs, source: source, callback: callback }));
						setTimeout(() => {
							try { this.divListe.find(`span:contains("www.jqwidgets.com")`).hide() }
							catch (ex) { }
						}, 10);
						// this.divListe.jqxDataTable('selectRow', 0);
					}
					catch (ex) {
						defFailBlock(ex);
						callback({ totalrecords: 0, records: [] });
						throw ex
					}
				}
			});
		}

		async loadServerData(e) {
			e = e || {};
			e.sender = this;

			const {listeWidget} = this;
			const {wsArgs} = e;
			if (!listeWidget.pageable) {
				const keys = ['pagesize', 'pageSize', 'pagenum', 'pageNum'];
				for (const i in keys)
					delete wsArgs[keys[i]];
			}
			
			let handler = this.liste_loadServerData;
			if (handler) {
				let result = await handler.call(this, e);
				if (result) {
					if ($.isArray(result))
						e.callback({ totalrecords: result.length, records: result });
					else if (result == 'object')
						e.callback(result);
					return result;
				}
			}

			const {app, dbMgr} = this;
			// const recCounts = app.dbCache.recCounts;
			
			let query = await this.loadServerData_buildQuery($.extend(e, { rowCountOnly: true }));
			let totalRecs = 0;
			let rs = await dbMgr.executeSql({ query });
			for (let i = 0; i < rs.rows.length; i++) {
				const rec = rs.rows[i];
				totalRecs += asInteger(rec[0] || rec.sayi);
			}
			e.totalRecs = totalRecs;
			
			query = e.query = await this.loadServerData_buildQuery($.extend(e, { rowCountOnly: false }));
			let recs = e.recs = await dbMgr.executeSqlReturnRows({ query: query });
			// totalRecs = e.totalRecs = Math.max(totalRecs, recs.length);
			if (!totalRecs && !$.isEmptyObject(recs))
				totalRecs = e.totalRecs = recs.length + (e.wsArgs.pagesize || 1) - 1;

			handler = this.liste_loadServerData_ekIslemler || (e => this.loadServerData_ekIslemler(e));
			if (handler) {
				let result = await handler.call(this, e);
				if (result)
					return result;
				
				query = e.query;
				totalRecs = e.totalRecs;
				recs = e.recs;
			}

			e.callback({ totalrecords: totalRecs, records: recs });
		}

		loadServerData_ekIslemler(e) {
		}

		loadServerData_buildQuery(e) {
			e = e || {}; e.sender = this;
			const wsArgs = $.extend({}, e.wsArgs, { rowCountOnly: e.rowCountOnly });
			wsArgs.filters = this.getFiltersFromListeWSArgs(wsArgs);
			wsArgs.sortdatafield = wsArgs.sortdatafield || this.defaultSortField || [this.idSaha];	 		/* || ['tarih', 'seri', 'fisno'] */
			if (!this.pageable) {
				['pagesize', 'pagenum', 'pageindex', 'pageSize', 'pageNum', 'pageIndex'].forEach(key =>
					delete wsArgs[key]);
			}
			let stm;
			let handler = this.liste_loadServerData_buildQuery;
			if (handler) {
				stm = handler.call(this, e);
				if (stm === false)
					stm = null;
				else if (stm === true)
					return e.stm;
			}
			
			if (!stm) {
				stm = e.stm = new MQStm({
					sent: new MQSent({
						from: `${this.table} mst`,
						sahalar: (e.rowCountOnly
									? `COUNT(*) sayi`
									: [	'mst.rowid', 'mst.*' ])
					})
				});
			}
			stm.fromGridWSArgs(wsArgs);

			this.loadServerData_buildQuery_callHandlers(e);
			stm = e.stm;

			return stm;
		}

		loadServerData_buildQuery_callHandlers(e) {
			e.sender = this;
			let {stm, wsArgs} = e;
			const handler = this.liste_stmDuzenleyici;
			if ($.isFunction(handler)) {
				let result = handler.call(this, e);
				if (result === false)
					return null;
				
				stm = e.stm;
				if (result && typeof result != 'boolean')
					stm = e.stm = result;
			}
		}

		liste_onFocus(e) {
			if (!(this.isComponent || this.noResizeEvent))
				this.onResize();
		}

		liste_onBlur(e) {
		}

		liste_onFilter(e) {
			e = e || {};
			const {args} = e.event || {};
			if (!args)
				return false;

			if (this.disableFilterEvents) {
				this.disableFilterEvents = false;
				return false;
			}

			const {listeWidget} = this;
			if (listeWidget.serverProcessing)
				return false;
			
			const app = this.app || sky.app;
			const {listeKodDogrudanAramaYapilirmi} = app;
			if (!listeKodDogrudanAramaYapilirmi)
				return false;
			
			const gridFiltreKodSahalari = listeKodDogrudanAramaYapilirmi ? app.gridFiltreKodSahalari : null;
			const {dataview} = listeWidget;
			const {filters} = args;
			listeWidget.beginUpdate();
			for (const i in filters) {
				const filterInfo = filters[i];
				const {datafield, filter} = filterInfo;
				if (gridFiltreKodSahalari && gridFiltreKodSahalari[datafield]) {
					dataview.removeFilter(datafield);
					const subFilters = filter.getfilters();
					for (let j in subFilters) {
						j = asInteger(j);
						const subFilter = filter.getfilterat(j);
						subFilter.comparisonoperator = 'EQUAL'
						// filter.setfilterat(j, subFilter);
					}
					dataview.addFilter(datafield, filter);
				}
			}
			listeWidget.endUpdate();
			
			this.disableFilterEvents = true;
			listeWidget.applyFilters();
			
			return true;
		}

		liste_rendered(e) {
		}
		
		async liste_satirTiklandi(e) {
			e = $.extend({}, e);
			const {event} = e;
			const y = (event || {}).clientY || (((event || {}).args || {}).originalEvent || {}).clientY;
			if (y != null)
				this.mouseDownY = y;

			const {app, listeWidget} = this;
			if (!listeWidget.selectionMode.startsWith(`single`))  {
				if (listeWidget.selectionMode == 'custom' && !app.gridAltMultiSelectFlag) {
					const {boundIndex} = e.event.args;
					if (boundIndex != null && boundIndex > -1) {
						const isSelected = !!this.selectedIndexes[boundIndex];
						listeWidget[isSelected ? 'unselectRow' : 'selectRow'](boundIndex);
					}
				}
			}

			let rec = e.rec = this.selectedRec;
			let func = this.listeSatirTiklandiFunc;
			if (rec && $.isFunction(func)) {
				let result = await func.call(this, $.extend({}, e, { sender: this }));
				if (result === false)
					return false;
			}
			
			return true;
		}

		async liste_satirSagTiklandi(e) {
			e = $.extend({}, e);
			const {event} = e;
			const y = (event || {}).clientY || (((event || {}).args || {}).originalEvent || {}).clientY;
			if (y != null)
				this.mouseDownY = y;

			const {app, listeWidget} = this;
			if (!listeWidget.selectionMode.startsWith(`single`))  {
				if (listeWidget.selectionMode == 'custom' && app.gridAltMultiSelectFlag) {
					//const {boundIndex} = e.event.args;
					const boundIndex = $(e.event.target).parents(`tr`).data('key');
					if (boundIndex != null && boundIndex > -1) {
						const isSelected = !!this.selectedIndexes[boundIndex];
						listeWidget[isSelected ? 'unselectRow' : 'selectRow'](boundIndex);
					}
				}
			}
		}

		async liste_satirCiftTiklandi(e) {
			e = $.extend({}, e);
			const {app, listeWidget} = this;
			if (!listeWidget.selectionMode.startsWith(`single`))  {
				if (listeWidget.selectionMode == 'custom' && app.gridAltMultiSelectFlag) {
					//const {boundIndex} = e.event.args;
					const boundIndex = $(e.event.target).parents(`tr`).data('key');
					if (boundIndex != null && boundIndex > -1) {
						const isSelected = !!this.selectedIndexes[boundIndex];
						listeWidget[isSelected ? 'unselectRow' : 'selectRow'](boundIndex);
					}
				}
				return false;
			}
			
			$.extend(e, {
				rec: this.selectedRec || null,
				boundRec: this.selectedBoundRec || null,
				index: this.selectedIndex || null
			});
			let func = this.listeSatirCiftTiklandiFunc;
			if (e.rec && $.isFunction(func)) {
				let result = await func.call(this, $.extend({}, e, { sender: this }));
				if (result === false)
					return false;
			}

			/*let btnSec = this.btnSec;
			if (e.rec && btnSec && btnSec.length)
				btnSec.click();*/
			
			this.sec(e);
			
			return true;
		}

		async liste_satirSecildi(e) {
			if (this.disableEventsFlag)
				return;
			
			e = e || {};
			this.liste_satirSecildiBasit(e);

			if (!(this.isComponent || this.noResizeEvent))
				this.onResize();

			let oldRec = e.oldRec || this.oldRec;
			this.liste_satirSecimDegisti($.extend({}, e, { selected: true }));
			let selectedRec = e.rec || this.selectedRec;

			let func = this.listeSatirSecildiFunc;
			if (selectedRec != oldRec && $.isFunction(func))
				await func.call(this, $.extend({}, e, { sender: this }));
		}

		liste_satirSecildiBasit(e) {
			e = e || {};
			const evt = e.event || {};
			const evtArgs = evt.args || {};
			const evtSource = (evt.owner || {}).source || this.listeWidget.source;
			
			let boundIndex = e.index = (e.index == null ? evtArgs.boundIndex : e.index);
			let orjRec = e.orjRec || (evtSource ? evtSource.originaldata[boundIndex] : null);
			let boundRec = e.rec || evtArgs.row || (evtSource ? evtSource.records[boundIndex] : null);
			let rec = orjRec || boundRec;
			if ((boundIndex == null || boundIndex < 0) && evtSource)
				boundIndex = this.listeWidget.getrowindex(rec);

			let oldRec = e.oldRec = this.oldRec;
			let selectedRec = e.rec = this.selectedRec = rec;
			this.selectedBoundRec = e.boundRec = boundRec;

			e.lastSelectedIndex = this.lastSelectedIndex;
			this.lastSelectedIndex = this.selectedIndex = boundIndex;
			this.selectedIndexes[boundIndex] = true;
		}

		liste_satirSecimKaldirildi(e) {
			if (this.disableEventsFlag)
				return;
			
			const {boundIndex} = e.event.args;
			const {selectedIndexes} = this;
			delete selectedIndexes[boundIndex];
			['selectedRec', 'selectedBoundRec', 'selectedIndex'].forEach(key =>
				delete this[key]);
			
			if (!this.listeWidget.selectionMode.startsWith(`single`)) {
				const _selectedIndexes = Object.keys(selectedIndexes);
				this.selectedRec = $.isEmptyObject(_selectedIndexes)
										? null
										: this.listeRecs[_selectedIndexes[_selectedIndexes.length - 1]]
			}
			
			this.liste_satirSecimDegisti($.extend({}, e, { selected: false }));
		}

		async liste_satirSecimDegisti(e) {
			if (this.disableEventsFlag)
				return;
			
			e = e || {};
			let selectedRec = e.rec = this.selectedRec;
			let oldRec = e.oldRec = this.oldRec;
			
			const layout = e.layout || this.layout;
			const btnSec = this.btnSec;
			if (this.secButonuKontrolEdilirmi && btnSec)
				setButonEnabled(btnSec, !!this.selectedRec);

			let func = this.listeSatirSecimDegistiFunc;
			if (selectedRec != oldRec && $.isFunction(func))
				await func.call(this, $.extend({}, e, { sender: this }));
			
			this.oldRec = selectedRec;
		}

		liste_cellBeginEdit(e) {
			e = e || {};
			let evt = e.event || {};
			let evtArgs = evt.args || {};
			
			this.editingCell = { rowIndex: evtArgs.index, dataField: evtArgs.dataField };

			let func = this.listeCellBeginEditFunc;
			if ($.isFunction(func))
				func.call(this, $.extend({}, e, { sender: this }))
		}

		liste_cellEndEdit(e) {
			e = e || {};
			delete this.editingCell;

			let func = this.listeCellEndEditFunc;
			if ($.isFunction(func))
				func.call(this, $.extend({}, e, { sender: this }));
		}

		liste_onMouseDown(e) {
			const {event} = e;
			let y = event.clientY;
			if (y == null && !$.isEmptyObject(event.changedTouches))
				y = event.changedTouches[0].clientY;
			this.mouseDownY = y;
			this.mouseMoveY = null;
		}

		liste_onMouseMove(e) {
			const {event} = e;
			const y = event.clientY;
			if (y != null)
				this.mouseMoveY = y;
		}
		liste_onMouseUp(e) { const {event} = e; const y = event.clientY; if (y != null) { this.mouseMoveY = y } }
		liste_degisti(e) { }
		async liste_veriYuklendi(e) {
			if ((this.listeReadyFlag || 0) == 1) { this.listeInitEkIslemler(e) }
			this.listeReadyFlag = (this.listeReadyFlag || 0) + 1;
			const {afterRefreshOnce, divListe} = this;
			if (afterRefreshOnce) {
				if ($.isFunction(afterRefreshOnce)) { afterRefreshOnce.call(this, e) } else if (afterRefreshOnce.run) { afterRefreshOnce.run(e) }
				delete this.afterRefreshOnce;
			}
			else {
				const {targetRecUid} = this;
				if (targetRecUid && !this.targetRecSelectedFlag) { await this.selectRec({ uid: targetRecUid }); this.targetRecSelectedFlag = true; }
				else { const noAutoSelectFlag = asBool(e.noAutoSelect || e.noAutoSelectFlag); if (!noAutoSelectFlag) { await this.liste_selectSavedIndex(e) } }
			}
			const textInputs = divListe.find(`input[type=textbox], input[type=text]`);
			if (textInputs.length) {
				textInputs.attr('autocomplete', 'false'); textInputs.attr('readonly', '');
				textInputs.attr('onfocus', `this.removeAttribute('readonly'); this.select()`);
				textInputs.attr('onkeyup', `if (event.key.toLowerCase() == 'enter' || event.key.toLowerCase() == 'linefeed') { this.blur() }`);
			}
		}
		async liste_selectSavedIndex(e) {
			let index = this.lastSelectedIndex; if (index == null || index < 0) { index = 0 }
			return await this.selectRec({ index })
		}
	}

	/*
		*** Sub-Component olarak kullanım örneği  ***
			{ = dev-tools console code = }
		---------------------------------------------
		
		let parent = sky.app.content.find(`.cetListeOrtak.cetApp.part`);
		// parent.children().remove();
		parent.css('overflow-y', 'auto');
		
		let content = parent.find(`#tempListeParent`);
		if (!content.length) {
			content = $(`<div id="tempListeParent" style="height: 100%" />`);
			content.appendTo(parent);
		}
		
		// /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\ //
		let part = new CETListeOrtakPart({
			content: content, template: sky.app.templates.stokListe, isComponent: true,
			listeColumnsDuzenleFunc: e => {
				return [
					{	datafield: ' ', text: 'Column', align: 'left',
						cellsRenderer: (rowIndex, columnIndex, value, rec) =>
							`<div>deneme satır - ${rowIndex}</div>`
					}
				]
			},
			listeDataAdapterOlusturFunc: e => {
				let source = {
					id: 'kod', datatype: 'array',
					localdata: [
						new CKodVeAdi({ kod: 'a01', aciklama: 'satır 1' }),
						new CKodVeAdi({ kod: 'a02', aciklama: 'satır 2' }),
						new CKodVeAdi({ kod: 'a03', aciklama: 'satır 3' })
					]
				};
				return new $.jqx.dataAdapter(source);
			},
			secince: e => {
				displayMessage(`${toJSONStr(e.rec)}`, `record selected`)
			}
		});
		await part.run();
		// /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\ //

		********************************************
	*/
})()
