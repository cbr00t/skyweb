
(function() {
	window.LayoutBase = class extends window.CObject {
		constructor(e) {
			e = e || {};
			super(e);
			
			let parent = this.parent = $('#contentParent');
			$.extend(this, {
				header: parent.length ? parent.find('#header') : null,
				content: e.content == false ? null : e.content || (parent.length ? parent.find('#content') : null),
				layout: e.layout,
				template: e.template,
				layouts: {},
				parts: {},
				windows: {},
				lastEventTimes: {},
				noResizeEvent: this.class.noResizeEvent,
				noResizeEventOnInputs: this.class.noResizeEventOnInputs
			});
			this.updateWSUrlBase(e);

			const {header} = this;
			$.extend(this, {
				spanAppTitle: header.find('#appTitle .veri')
			});
		}

		static get isDebug() { return sky.config.debug }
		static get isTest() { return sky.config.test }
		static get noHeaderFlag() { return sky.config.noHeader }
		static get isLayoutView() { return true }
		static get isApp() { return false }
		static get isProg() { return false }
		static get isModule() { return false }
		static get isPart() { return false }
		static get tipBelirtec() { return 'app' }
		static get cssTipBelirtec() { return this.tipBelirtec }
		static get noResizeEvent() { return false }
		static get noResizeEventOnInputs() { return true }
		
		get cssTipBelirtec() { return this.class.cssTipBelirtec }
		get tipBelirtec() { return this.class.tipBelirtec }
		get defaultLayoutName() { return null }
		get defaultRootLayoutName() { return null }
		// get layoutRoot() { return 'layout/' }
		get layoutRoot() { return '' }
		get relPath() { return null }

		get wsURLBase() {
			this.updateWSUrlBase();
			return wsURLBase = this._wsURLBase
		}
		
		get appTitleText() { return this.spanAppTitle.html() }
		set appTitleText(value) { this.spanAppTitle.html(value) }

		get activePartContent() {
			return this.content && this.content.length ? this.content : (this.layout || this.defaultLayout)
		}


		preInit(e) { }

		ilkIslemler(e) { }

		init(e) { }

		run(e) { }

		afterRun(e) { }

		exiting(e) { }


		preInitLayout(e) {
			e = e || {};
			if (e.ilkmi)
				return this.preInitLayoutIlk(e);
			
			return this.preInitLayoutEk(e);
		}
		preInitLayoutIlk(e) {
		}
		preInitLayoutEk(e) {
		}

		postInitLayout(e) {
			if (e.ilkmi)
				return this.postInitLayoutIlk(e);
			
			return this.postInitLayoutEk(e);
		}
		postInitLayoutIlk(e) {
		}
		postInitLayoutEk(e) {
		}

		async setDefaultLayout(e) {
			e = e || {};
			
			const name = e.name || this.defaultLayoutName;
			let content = e.content;
			if (content == null)
				content = this.content;
			
			const id = e.id || this.partName || this.appName || name;
			let layout = e.layout || this.layout;
			let template = e.template || this.template;
			const _e = $.extend({}, e, {
				id: id, name: name,
				content: content, layout: layout, template: template,
				noInit: e.noInit, noSaveLayout: e.noSaveLayout
			});
			if (!(name || layout || template))
				return null;
			
			let result = await this.setLayout(_e);
			if (!result)
				throw { isError: true, rc: 'runtimeInterrupt', errorText: `Layout yapısı yükleme işlemi engellendi` };

			this.defaultLayout = _e.layout;

			return _e.layout;
		}

		basicSetDefaultLayout(e) {
			e = e || {};
			
			const name = e.name || this.defaultLayoutName;
			let content = e.content;
			if (content == null)
				content = this.content;
			
			const id = e.id || this.partName || this.appName || name;
			let layout = e.layout || this.layout;
			let template = e.template || this.template;
			const _e = $.extend({}, e, {
				id: id, name: name,
				content: content, layout: layout, template: template,
				noInit: e.noInit, noSaveLayout: e.noSaveLayout
			});
			if (!(name || layout || template))
				return null;
			
			let result = this.basicSetLayout(_e);
			if (!result)
				throw { isError: true, rc: `runtimeInterrupt`, errorText: `Layout yapısı yükleme işlemi engellendi` };
			
			this.defaultLayout = _e.layout;
			return _e.layout
		}
		async setLayout(e) {
			e = e || {};
			const partName = this.partName;
			const app = (this.app || sky.app);
			const activePart = (app || {}).activePart;
			if (activePart != app) {
				if (!this.isComponent && (this == activePart || (partName && partName == (activePart || {}).partName)))
					return null;
			}

			let layouts = this.layouts;
			let id = e.id;
			let ilkmi = e.ilkmi = !(id && layouts[id]);

			let layout = e.layout = e.layout || await this.fetchLayout(e);
			if (layout && !layout.html)
				layout = e.layout = $(layout);
			
			if (id)
				layouts[id] = layout;
			
			if (layout && layout.length) {
				const rootAppName = this.rootAppName;
				const appName = this.appName;
				const partOrAppName = this.partName || this.appName;
				const cssTipBelirtec = this.cssTipBelirtec;
				[cssTipBelirtec, partOrAppName, appName, rootAppName].forEach(cssClass => {
					if (!layout.hasClass(cssClass))
						layout.addClass(cssClass);
				});
			}
			
			let content = e.content == null ? this.content : e.content;
			let noInitFlag = e.noInit;
			if (!e.noSaveLayout)
				this.layout = e.layout;
			
			delete this.isDestroyed;
			if (!noInitFlag)
				await this.preInitLayout(e);
			if (layout && layout.length && content && (ilkmi || !e.unique)) {
				if (!content.find(layout).length)
					layout.appendTo(content);
			}
			if (!noInitFlag) {
				e.result = await this.postInitLayout(e);
				this.initFlag = true;
			}
			
			return e
		}

		basicSetLayout(e) {
			e = e || {};
			const partName = this.partName;
			const app = (this.app || sky.app);
			const activePart = (app || {}).activePart;
			if (activePart != app) {
				if (!this.isComponent && (this == activePart || (partName && partName == (activePart || {}).partName)))
					return null;
			}
			
			let layouts = this.layouts;
			let id = e.id;
			let ilkmi = e.ilkmi = !(id && layouts[id]);

			let layout = e.layout = e.layout || this.basicFetchLayout(e);
			if (layout && !layout.html)
				layout = e.layout = $(layout);
			
			if (id)
				layouts[id] = layout;
			
			const cssTipBelirtec = this.cssTipBelirtec;
			if (layout && layout.length) {
				const rootAppName = this.rootAppName;
				const appName = this.appName;
				const partOrAppName = this.partName || this.appName;
				[cssTipBelirtec, partOrAppName, appName, rootAppName].forEach(cssClass => {
					if (!layout.hasClass(cssClass))
						layout.addClass(cssClass);
				});
			}
			
			let content = e.content == null ? this.content : e.content;
			let noInitFlag = e.noInit;
			if (!e.noSaveLayout)
				this.layout = e.layout;
			
			delete this.isDestroyed;
			if (!noInitFlag)
				this.preInitLayout(e);
			if (layout && layout.length && content && (ilkmi || !e.unique)) {
				if (!content.find(layout).length)
					layout.appendTo(content);
			}
			if (!noInitFlag) {
				e.result = this.postInitLayout(e);
				this.initFlag = true;
			}
			
			return e;
		}

		setLayoutUnique(e) {
			return this.setLayout($.extend(e, { unique: true }))
		}

		setLayoutNoInit(e) {
			return this.setLayout($.extend(e, { noInit: true }))
		}

		setLayoutUniqueNoInit(e) {
			return this.setLayoutUnique($.extend(e, { noInit: true }))
		}

		clearLayout(e) {
			e = e || {};
			let layout = e.layout = e.layout || this.layout;
			let id = e.id;
			if (!layout && id)
				layout = e.layout = this.layouts[id];
			if (!layout)
				return $.extend(e, { success: false });
			
			if (!layout.html)
				layout = e.layout = $(layout);
			
			if (e.destroy) {
				const destroyedLayoutIDList = e._destroyedLayoutIDList || {};
				const destroyedLayoutNameList = e._destroyedLayoutNameList || {};
				const layouts = this.layouts;
				
				const layoutNameOrID = (layout[0] || layout).name;
				if ((id && destroyedLayoutIDList[id]) || (layoutNameOrID && destroyedLayoutNameList[layoutNameOrID]))
					return $.extend(e, { success: false });

				this.destroyLayout(e);
				layout.remove();

				if (id) {
					destroyedLayoutIDList[id] = true;
					delete layouts[id];
				}
				if (layoutNameOrID) {
					destroyedLayoutNameList[layoutNameOrID] = true;
					delete layouts[name];
				}
			}
			else {
				layout.detach();
			}

			if (id)
				delete this.layouts[id];
			
			['layout', 'defaultLayout'].forEach(key =>
				delete this[key]);
			
			return $.extend(e, { success: true });
		}

		clearLayoutWithDestroy(e) {
			return this.clearLayout($.extend({}, e, { destroy: true }));
		}

		clearSubLayouts(e) {
			e = e || {};
			
			const destroyedLayoutIDList = e._destroyedLayoutIDList || {};
			const destroyedLayoutNameList = e._destroyedLayoutNameList || {};
			const _id = e.id;
			if (_id && destroyedLayoutIDList[_id])
				return;
			
			let content = e.content || this.content;
			if (content.length) {
				const contentNameOrID = (content.name || content.id);
				if (contentNameOrID && destroyedLayoutNameList[contentNameOrID])
					return;

				let children = content.children();
				if (children.length)
					this.clearLayout($.extend(e, { layout: children } ));
				
				if (contentNameOrID)
					destroyedLayoutNameList[contentNameOrID] = true;
			}

			if (_id)
				destroyedLayoutIDList[_id] = true;
			
			if (e.destroy)
				this.layouts = {};
		}

		clearSubLayoutsWithDestroy(e) {
			return this.clearSubLayouts($.extend({}, e, { destroy: true }));
		}

		clearContent(e) {
			e = e || {};
			$.extend(e, {
				_destroyedLayoutIDList: {},
				_destroyedLayoutNameList: {}
			});
			for (let id in this.layouts) {
				let layout = this.layouts[id];
				this.clearLayout($.extend(e, { id: id, layout: layout }));
			}

			this.clearSubLayouts($.extend({}, e));
		}

		clearContentWithDestroy(e) {
			return this.clearContent($.extend({}, e, { destroy: true }));
		}

		clearLayoutAndSubLayouts(e) {
			e = e || {};
			this.clearLayout(e);
			this.clearSubLayouts($.extend({}, e));
		}

		clearLayoutAndSubLayoutsWithDestroy(e) {
			return this.clearLayoutAndSubLayouts($.extend({}, e, { destroy: true }));
		}

		destroyPart(e) {
			if (this.isDestroyed)
				return;
			
			e = $.extend({}, e, { content: this.layout });

			let layout = e.layout || this.layout;
			if (layout && layout.length)
				this.clearLayoutAndSubLayoutsWithDestroy(e);
			else
				this.clearLayoutWithDestroy(e);
			
			['rootLayout'].forEach(key =>
				delete this[key]);
			
			this.isDestroyed = true;
		}

		async fetchLayout(e) {
			e = e || {};
			let layout = e.layout;
			if ($.isFunction(layout))
				layout = await layout.call(this, e);
			
			if (!(layout && layout.length) && e.template) {
				let template = e.template;
				if ($.isFunction(template))
					template = await template.call(this, e);
				
				layout = template.contents('div');
				if (!(layout && layout.length))
					layout = template.contents();
				
				if (layout && layout.length)
					layout = layout.clone(true);
			}
			if ($.isFunction(layout))
				layout = layout.call(this, e);
			e.layout = layout;
			
			if (layout && !layout.html)
				layout = e.layout = $(layout);
			
			if (layout)
				return layout;
			
			let path = this.layoutPathFor(e);
			if (!path)
				throw { isError: true, rc: 'layoutNotFound', errorText: 'Layout not found' };
			
			const globalCache = sky.globalCache;
			const altProc = async () => {
				try {
					lastAjaxObj = $.get({ cache: false, async: true, url: path });
					layout = e.layout = await lastAjaxObj;
				}
				catch(ex2) {
					try {
						lastAjaxObj = $.get({ cache: true, async: true, url: path });
						layout = e.layout = await lastAjaxObj;
					}
					catch (ex3) {
						try {
							lastAjaxObj = globalCache.match(path);
							let result = await lastAjaxObj;
							if (result.text)
								result = await result.text();
							layout = e.layout = result;
						}
						catch (ex4) {
							defFailBlock(ex2)
							// throw ex;
						}
					}
				}
				return layout;
			};
			
			if (globalCache) {
				try {
					await (lastAjaxObj = globalCache.add(path));
					lastAjaxObj = globalCache.match(path);
					layout = e.layout = await (await lastAjaxObj).text();
				}
				catch (ex) {
					await altProc();
				}
			}
			else {
				await altProc();
			}

			if (layout && !layout.html)
				layout = e.layout = $(layout);
			
			return layout;
		}

		basicFetchLayout(e) {
			e = e || {};
			let layout = e.layout;
			if ($.isFunction(layout))
				layout = layout.call(this, e);
			
			if (!(layout && layout.length) && e.template) {
				let template = e.template;
				if ($.isFunction(template))
					template = template.call(this, e);
				
				layout = template.contents('div');
				if (!(layout && layout.length))
					layout = template.contents();
				
				if (layout && layout.length)
					layout = layout.clone(true);
			}

			if ($.isFunction(layout))
				layout = layout.call(this, e);
			e.layout = layout;
			
			if (layout && !layout.html)
				layout = e.layout = $(layout);
			
			return layout;
		}

		destroyLayout(e) {
			e = e || {};
			let {layout, id} = e;
			if (!layout && id)
				layout = e.layout = this.layouts[id];
			if (layout && !layout.html)
				layout = e.layout = $(layout);
			
			const {windows} = this;
			if (!$.isEmptyObject(windows)) {
				Object.keys(windows).forEach(key => {
					const wnd = windows[key];
					this.jqueryFind({ obj: wnd, action: wnd => { wnd.jqxWindow('destroy'); wnd.remove() } });
					delete windows[key];
				});
			};
			
			if (layout && layout.length) {
				this.jqueryFind({ getter: e => layout.find('.jqx-dropdownlist'), action: obj => { obj.jqxDropDownList('destroy'); obj.remove() } });
				this.jqueryFind({ getter: e => layout.find('.jqx-listbox'), action: obj => { obj.jqxListBox('destroy'); obj.remove() } });
				this.jqueryFind({ getter: e => layout.find('.jqx-input'), action: obj => { obj.jqxInput('destroy'); obj.remove() } });
				this.jqueryFind({ getter: e => layout.find('.jqx-button'), action: obj => { obj.jqxButton('destroy'); obj.remove() } });
				this.jqueryFind({ getter: e => layout.find('.jqx-dock'), action: obj => { obj.jqxDock('destroy'); obj.remove() } });
				this.jqueryFind({ getter: e => layout.find('.jqx-panel'), action: obj => { obj.jqxPanel('destroy'); obj.remove() } });
				this.jqueryFind({ getter: e => layout.find('.jqx-dockpanel'), action: obj => { obj.jqxDockPanel('destroy'); obj.remove() } });
				this.jqueryFind({ getter: e => layout.find('.jqx-splitter'), action: obj => { obj.jqxSplitter('destroy'); obj.remove() } });
				this.jqueryFind({ getter: e => layout.find('.jqx-gauge'), action: obj => { obj.jqxGauge('destroy'); obj.remove() } });
				this.jqueryFind({ getter: e => layout.find('.jqx-chart'), action: obj => { obj.jqxChart('destroy'); obj.remove() } });
				this.jqueryFind({ getter: e => layout.find('.jqx-grid'), action: obj => { obj.jqxGrid('destroy'); obj.remove() } });
				this.jqueryFind({ getter: e => layout.find('.jqx-datatable'), action: obj => { obj.jqxDataTable('destroy'); obj.remove() } });
				this.jqueryFind({ getter: e => layout.find('.jqx-popover'), action: obj => { obj.jqxPopover('destroy'); obj.remove() } });
				// this.jqueryFind({ getter: e => layout.find('.jqx-popup'), action: obj => obj.jqxPopup('destroy') });
				this.jqueryFind({ getter: e => layout.find('.jqx-knob'), action: obj => { obj.jqxKnob('destroy'); obj.remove() } });
				/*this.jqueryFind({ getter: e => $('.jqx-tooltip'), action: obj => { obj.jqxTooltip('destroy'); obj.remove() } });*/
				this.jqueryFind({ getter: e => layout.find('.ui-datepicker'), action: obj => { obj.remove() } });
				// this.jqueryFind({ getter: e => $('.jqx-jqx-menu-popup'), action: obj => obj.remove() });
				// this.jqueryFind({ getter: e => $('.jqx-window'), action: obj => obj.jqxWindow('destroy') });
				this.jqueryFind({ getter: e => layout.find('.jqx-validator'), action: obj => { obj.jqxValidator('destroy'); obj.remove() } });
				this.jqueryFind({ getter: e => $('.jqx-validator-hint'), action: obj => { obj.remove() } });
			}

			this.isDestroyed = true;
		}

		cleanUpWidgets(e) {
			e = e || {};
			let layout = e.layout || this.layout;
			const id = e.id;
			if (!layout && id)
				layout = e.layout = this.layouts[id];
			
			if (layout && !layout.html)
				layout = e.layout = $(layout);
			
			const windows = this.windows;
			if (!$.isEmptyObject(windows)) {
				Object.keys(windows).forEach(key => {
					const wnd = windows[key];
					this.jqueryFind({ obj: wnd, action: wnd => { wnd.jqxWindow('destroy'); wnd.remove() } });
					delete windows[key];
				});
			};
			
			const app = (this.app || sky.app);
			app.knobProgressDestroy();
			app.hideNotifications();
			if (layout && layout.length) {
				/*this.jqueryFind({ getter: e => $('.jqx-dropdownlist-container'), action: obj => { obj.remove() } });
				this.jqueryFind({ getter: e => $('.jqx-listbox-container'), action: obj => { obj.remove() } });
				this.jqueryFind({ getter: e => $('.jqx-menu-wrapper'), action: obj => { obj.remove() } });
				this.jqueryFind({ getter: e => $('.jqx-input'), action: obj => { obj.jqxInput('destroy'); obj.remove() } });
				this.jqueryFind({ getter: e => $('.jqx-popover'), action: obj => { obj.jqxPopover('destroy'); obj.remove() } });
				this.jqueryFind({ getter: e => $('.jqx-popup'), action: obj => { obj.remove() } });*/
				this.jqueryFind({ getter: e => $('.jqx-knob'), action: obj => { obj.jqxKnob('destroy'); obj.remove() } });
				this.jqueryFind({ getter: e => $('.jqx-notification'), action: obj => { obj.jqxNotification('destroy'); obj.remove() } });
				this.jqueryFind({ getter: e => $('.jqx-tooltip'), action: obj => { obj.jqxTooltip('destroy'); obj.remove() } });
				this.jqueryFind({ getter: e => $('.jqx-menu-popup'), action: obj => obj.remove() });
				this.jqueryFind({ getter: e => $('.jqx-window:not(.devConsole)'), action: obj => { obj.jqxWindow('destroy'); obj.remove() } });
				// this.jqueryFind({ getter: e => $('.jqx-listbox-container'), action: obj => obj.remove() });
				this.jqueryFind({ getter: e => layout.find('.jqx-validator'), action: obj => { obj.jqxValidator('destroy'); obj.remove() } });
				this.jqueryFind({ getter: e => $('.jqx-validator-hint'), action: obj => { obj.remove() } });
				this.jqueryFind({ getter: e => $('.ui-datepicker'), action: obj => { obj.remove() } });
				this.jqueryFind({ getter: e => $('svg'), action: obj => { obj.remove() } });
			}
		}

		hideNotifications() {
			this.jqueryFind({ obj: $(`.jqx-notification`), action: obj => { obj.jqxNotification('destroy'); obj.remove() } })
		}

		async setActivePart(e) {
			e = e || {};
			$.extend(e, {
				app: e.app || this.app,
				content: e.content || this.activePartContent
			});
			if (!e.part && $.isFunction(e.partBuilder))
				e.part = e.partBuilder.call(this, e);
			if (!e.part && e.partClass)
				e.part = new e.partClass(e);
			
			if (e.part)
				e.result = await e.part.run(e);
			if (!this.isComponent)
				this.activePart = e.part;
			
			return e;
		}

		removeActivePart(e) {
			e = e || {};
			const {activePart} = this;
			if (activePart) {
				activePart.clearLayout($.extend({}, e, { layout: activePart.layout, destroy: e.destroy !== false }));
				delete this.activePart;
			}
		}
		
		activatePart(e) {
			e = e || {};
			const thisLayout = e.layout || this.layout;
			const parentPart = e.parentPart || this.parentPart;
			const parentLayout = e.parentLayout || this.parentLayout || (parentPart || {}).layout;
			if (!this.isComponent && parentLayout && thisLayout && thisLayout != parentLayout) {
				parentLayout.addClass('jqx-hidden');
				thisLayout.removeClass('jqx-hidden');
			}
			
			const {app, isComponent} = this;
			if (app && !isComponent)
				app.activePart = (this == app ? null : this);
		}

		deactivatePart(e) {
			e = e || {};
			const thisLayout = e.layout || this.layout;
			const parentPart = e.parentPart || this.parentPart;
			const parentLayout = e.parentLayout || this.parentLayout || (parentPart || {}).layout;
			let promise;
			if (parentLayout && thisLayout && thisLayout != parentLayout) {
				if (!this.isComponent) {
					parentLayout.removeClass('jqx-hidden');
					thisLayout.addClass('jqx-hidden');
				}
				if (e.destroy)
					promise = this.destroyPart();
				if (parentPart)
					parentPart.activatePart(e);
			}

			const {app, isComponent} = this;
			if (app && !isComponent)
				app.activePart = (parentPart == app ? null : parentPart);
			
			return promise;
		}

		deactivatePartWithDestroy(e) {
			return this.deactivatePart($.extend({}, e, { destroy: true }))
		}

		async activateInnerPart(e) {
			e = e || {};
			const content = e.subContent || this.subContent;
			const parts = this.parts = this.parts || {};
			await this.deactivateInnerPart(e);

			const partClass = e.partClass;
			const partName = e.partName || (partClass || {}).partName;
			if (partName || partClass) {
				let part = parts[partName];
				if (!part && partClass) {
					part = new partClass($.extend({ parentPart: this }, e.args || {}));
					parts[partName] = part;
					await part.run();
				}
				await part.activatePart(e);
			}
		}

		async deactivateInnerPart(e) {
			e = e || {};
			const parts = this.parts = this.parts || {};
			const {activeInnerPart} = this;
			if (activeInnerPart) {
				if (!activeInnerPart.isDestroyed)
					await activeInnerPart.deactivatePart(e);
				delete this.activeInnerPart;
			}
		}

		updateWSUrlBase(e) {
		}
		
		layoutPathFor(e) {
			e = e || {};
			if (e.path)
				return e.path;
			
			let layoutRoot = e.layoutRoot || this.layoutRoot;
			if (layoutRoot) {
				let relPath = e.relPath || this.relPath || '';
				if (e.name)
					return `${layoutRoot}${relPath}${e.name}.html`;
			}

			return null;
		}

		disableEventsDo(e) {
			e = e || {};
			let callback = typeof e == 'object' ? e.callback : e;
			if (!callback)
				return;

			if (this.disableEventsFlag)
				return callback.call(this);
			
			this.disableEventsFlag = true;
			try { return callback.call(this) }
			finally { this.disableEventsFlag = false }
		}

		jqueryFind(e) {
			let obj = e.obj || (e.getter ? e.getter.call(this, e) : null);
			if (obj && !obj.html)
				obj = $(obj);

			e.obj = obj;
			if (obj && obj.length) {
				e.action.call(this, obj, e);
				return obj;
			}

			return null;
		}

		async onResize(e) {
			/*console.debug(`app resize event triggered`,
				this,
				$.extend({}, {
					sender: this, events: (this.app || this).events,
					activeElement: document.activeElement
				}, e))*/
		}
	}
})();
