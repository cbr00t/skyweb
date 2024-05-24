
(function() {
	window.App = class extends window.AppPartBase {
		constructor(e) {
			super(e);

			const {config} = sky;
			$.extend(this, {
				disableIndicatorsFlag: config.disableIndicatorsFlag,
				isDevMode: config.isDevMode,
				noFullScreenFlag: config.noFullScreenFlag,
				mainPart: this,
				knobProgressInitArgs: {},
				indicatorPartInitArgs: {},
				appUniqueId: newGUID(),
				events: {},
				resizeEvents: asBool(qs.resizeEvents),
				wsURLUpdateCount: 0
			});
			this.prefetchAbortedFlag = false;
		}

		static get isApp() { return true }
		static get rootAppName() { return null }
		static get appName() { return null }
		static get tipBelirtec() { return 'app' }
		static get dateLibDesteklenirmi() { return true }
		static get smartElementsDesteklenirmi() { return false }
		static get qrScanDesteklenirmi() { return false }
		static get jsonEditorDesteklermi() { return false }
		static get aceEditorDesteklermi() { return this.jsonEditorDesteklermi }
		static get wsPortRepeatCount() { return 0 }
		get appText() { return this.class.appName }
		get adimText() { return this.appText }
		get appRootPrefix() { return `../app/` }
		get appRootName() { return this.class.appName }
		get appRoot() { return `${this.appRootPrefix || ''}${this.appRootName || '.'}/` }
		get layoutRoot() { return `${this.appRoot}` }

		get programcimi() {
			let result = this._programcimi;
			if (result == null) {
				const {ozelParam, param} = this;
				result = qs.programci || (ozelParam || {}).programci;
				if (result == null)
					result = (param || {}).programcimi;
				if (result == null)
					result = this.isDevMode;
				this._programcimi = result = asBool(result);
			}
			return result;
		}
		get timerYokmu() {
			let result = this._timerYokmu;
			if (result == null) {
				const {ozelParam, param} = this;
				result = qs.timerYok || qs.noTimer || qs.noTimers ||
							(ozelParam || {}).timerYok;
				if (result == null)
					result = (param || {}).timerYokmu;
				this._timerYokmu = result = asBool(result);
			}
			return result;
		}
		get bostaPortBulTimerYokmu() {
			let result = this._bostaPortBulTimerYokmu;
			if (result == null) {
				const {ozelParam, param} = this;
				result = this.timerYokmu || qs.bostaPortBulTimerYok || qs.noBostaBulTimer || (ozelParam || {}).bostaPortBulTimerYok;
				if (result == null)
					result = (param || {}).bostaPortBulTimerYokmu;
				this._bostaPortBulTimerYokmu = result = asBool(result);
			}
			return result;
		}
		get ajaxInfiniteMS() {
			return 5 * 60000
			// return false
		}

		updateWSUrlBase(e) {
			e = e || {};
			super.updateWSUrlBase(e);
			
			const {config} = sky;
			const wsURLUpdateCount = this.wsURLUpdateCount = (this.wsURLUpdateCount || 0) + 1;
			const {wsPortRepeatCount} = this.class;
			
			const ekArgs = {};
			let port = e.port || this.wsBostaPort || config.port;
			if (wsURLUpdateCount < 2 || !wsPortRepeatCount || (wsURLUpdateCount % (wsPortRepeatCount + 1) == wsPortRepeatCount)) {
				$.extend(ekArgs, getArgsForRandomPort({ port: port }));
				this._wsURLBase = updateWSUrlBaseBasit($.extend({}, config, {
					path: e.wsPath || e.path || config.wsPath
				}, ekArgs, e));
			}

			return this._wsURLBase;
		}

		async bostaPortBul(e) {
			if ($.isEmptyObject(window.wsPorts) || wsPorts.length == 1) {
				this.wsBostaPort = null;
				return;
			}

			const {config} = sky;
			const promises = [];
			for (const i in wsPorts) {
				const port = wsPorts[i];
				const urlBase = updateWSUrlBaseBasit($.extend({}, config, { path: config.wsPath, port: port }, e));
				promises.push(new $.Deferred(p => {
					$.get({
						async: true, cache: false,
						url: `${urlBase}ping`,
						data: { output: 'json', apiAuthKey: apiAuthKey }
						/*dataType: defaultOutput*/
					}).then(result => p.resolve(port))
					.fail(result => p.reject(port))
				}));
			}

			let uygunPort = null;
			try { uygunPort = await Promise.race(promises) }
			catch (ex) { }
			
			return this.wsBostaPort = uygunPort;
		}

		
		async ilkIslemler(e) {
			await super.ilkIslemler(e);

			this.ajaxSetup(e);
			sky.config.updateAjaxWSDefs();
		}

		ajaxSetup(e) {
			if (this.programcimi)
				$.ajaxSetup({ timeout: false });
			else
				$.ajaxSetup({ timeout: 2 * 60 * 1000 });
		}

		async preInit(e) {
			await super.preInit(e);

			await this.hackVioWebProcs();
			await this.loadLibs(e);

			const rootAppName = this.rootAppName;
			const appName = this.appName;
			const partOrAppName = this.partName || this.appName;
			const cssTipBelirtec = this.cssTipBelirtec;
			[this.parent, this.content, $(`body`)].forEach(elm => {
				if (elm && elm.length) {
					[cssTipBelirtec, partOrAppName, appName, rootAppName].forEach(cssClass =>
						elm.addClass(cssClass));
				}
			});

			window.dlgUIEkCSS = [cssTipBelirtec, partOrAppName, appName, rootAppName].join(` `);
			if (Utils.isVirtualKeyboardSupported)
				navigator.virtualKeyboard.overlaysContent = true;
		}

		async run(e) {
			await super.run(e);

			/*let result = await this.setLayoutUnique({ id: 'test', name: 'test', layoutRoot: 'appBase/layout/' });
			await this.setLayoutUnique({ id: 'test2', name: 'test', content: result.layout, layoutRoot: 'appBase/layout/' });*/
		}

		async afterRun(e) {
			await super.afterRun(e);

			this.setUniqueTimeout({
				key: `triggerResizeEvent`,
				delayMS: 500,
				block: e =>
					$(window).trigger('resize')
			});
		}

		async destroyLayout(e) {
			let part = this.indicatorPart;
			if (part) {
				await part.destroyPart();
				delete this.indicatorPart;
			}
			part = this.knobProgressPart;
			if (part) {
				await part.destroyPart();
				delete this.knobProgressPart;
			}

			this.removeMainResizeEvent(e);
			
			await super.destroyLayout(e);
		}
		

		preInitLayout(e) {
			super.preInitLayout(e);
		}

		postInitLayout(e) {
			super.postInitLayout(e);

			if (!this.disableIndicatorsFlag)
				this.showIndicatorsPart(e);
			
			this.initMainResizeEvent(e);
		}

		async showInitLayout(e) {
			await super.showInitLayout(e);

			const parent = this.parent;
			if (this.class.noHeaderFlag) {
				const divHeader = this.header;
				if (divHeader.length)
					divHeader.hide();
			}

			if (this.class.isDebug) {
				const divInfo = parent.find('#info');
				if (divInfo.length) {
					// $('<h2>boot layout loaded</h2>').appendTo(divInfo);
					divInfo.find('#_appName').html(this.class.appName);
				}
				
				/*const content = this.content;
				if (content.length) {
					$(`<div id="appName">Active app: <b>${this.class.appName}</b></div>`)
						.appendTo(this.content);
				}*/
			}

			let {appText} = this;
			$('head title').html(appText);
			this.appTitleText = appText;
			
			Utils.ajaxDoWithCache({
				url: `./manifest.php`,
				dataType: 'json'
			}).then(manifest => {
				parent.find('#siteVersion .veri')
					.html(`v${manifest.version}`);
			}).catch((xhr, state, error) => {
				if (navigator.onLine)
					defFailBlock(xhr, state, error)
			});
		}

		async showInitLayoutSon(e) {
			await super.showInitLayoutSon($.extend({}, e, { layout: this.parent }));
		}

		initMainResizeEvent(e) {
			e = e || {};
			const partName = this.partName || this.appName;
			const events = this.events[partName] = this.events[partName] || {};
			let eventName = `resize`;
			if (!this.isComponent && !this.noResizeEvent && !events[eventName]) {
				events[eventName] = evt => {
					this.setUniqueTimeout({
						key: `${eventName}Event`,
						delayMS: 50,
						args: $.extend({}, e, {
							partName: partName,
							eventName: eventName,
							event: evt
						}),
						block: async e => {
							const {partName, eventName} = e;
							const activePart = this.activePart || this;
							const activeElement = document.activeElement || {};
							if (activePart.noResizeEvent)
								return;
							if (activePart.noResizeEventOnInputs) {
								if ((activeElement.tagName || '').toUpperCase() == 'INPUT' && (activeElement.type || '').toLowerCase().startsWith('text'))
									return;
							}
							
							const events = this.events[partName] || {};
							if (!events[eventName])
								return;
							
							this.setUniqueTimeout({
								key: 'resizeEvent',
								delayMS: 5,
								args: e,
								block: async e => {
									try { await this.onResize(e) }
									catch (ex) { console.error(ex) }
								}
							});
						}
					})
				};
				$(window).on(eventName, events[eventName]);
			}
		}

		removeMainResizeEvent(e) {
			e = e || {};
			const partName = this.partName || this.appName;
			const events = this.events[partName] = this.events[partName] || {};
			const eventNames = [`resize`];
			for (let i in eventNames) {
				const eventName = eventNames[i];
				if (events[eventName]) {
					// $(window).off(eventName);
					delete events[eventName];
				}
			}
		}

		async showIndicatorsPart(e) {
			const initArgs = this.indicatorPartInitArgs || {};
			let part = this.indicatorPart = new AppIndicatorPart({
				content: this.content,
				template: initArgs.template,
				layout: initArgs.layout
			});
			return await part.run();
		}

		get hasKnobProgress() {
			const {knobProgressPart} = this;
			return knobProgressPart && !knobProgressPart.isDestroyed && knobProgressPart.layout && !knobProgressPart.layout.hasClass('jqx-hidden');
		}

		async knobProgressShow(e) {
			try {
				e = $.extend({}, e || {});
				e.update = $.extend({ showLoading: true }, e.update || {});

				let {knobProgressPart} = this;
				if (!(knobProgressPart && knobProgressPart.layout && knobProgressPart.layout.length)) {
					knobProgressPart = null;
					delete this.knobProgressPart;
				}
				
				if (knobProgressPart) {
					try {
						if (e.update)
							knobProgressPart.update(e.update);
						knobProgressPart.layout.removeClass('jqx-hidden');
					}
					catch (ex) {
						console.error(ex);
					}
				}
				else {
					knobProgressPart = this.knobProgressPart = new KnobProgressPart($.extend({}, this.knobProgressInitArgs, e || {}));
					try { await knobProgressPart.run() }
					catch (ex) { console.error(ex) }
				}

				return knobProgressPart;
			}
			catch (ex) { console.error(ex) }
		}

		async knobProgressHide(e) {
			try {
				e = $.extend({}, e || {});
				e.update = $.extend({ labelTemplate: 'success', progress: 100 }, e.update || {});

				let {knobProgressPart} = this;
				if (!(knobProgressPart && knobProgressPart.layout && knobProgressPart.layout.length)) {
					knobProgressPart = null;
					delete this.knobProgressPart;
					return true;
				}
				
				if (knobProgressPart) {
					await this.knobProgressSuccess(e);
					
					this.setUniqueTimeout({
						key: 'knobProgressHide',
						delayMS: e.delayMS == null ? 100 : e.delayMS,
						args: e,
						block: async e => {
							if (e.reset)
								await this.knobProgressReset();
							if (this.knobProgressPart)
								this.knobProgressPart.layout.addClass('jqx-hidden');
						}
					});
				}
			}
			catch (ex) { console.error(ex) }
		}
		
		async knobProgressHideWithReset(e) {
			return await this.knobProgressHide($.extend({ reset: true }, e || {}));
		}

		async knobProgressReset(e) {
			let knobProgressPart = this.knobProgressPart;
			if (knobProgressPart)
				await knobProgressPart.update($.extend({ showLoading: true, label: '', progress: 0 }, e || {}));
		}

		async knobProgressDestroy(e) {
			let knobProgressPart = this.knobProgressPart;
			if (knobProgressPart) {
				await knobProgressPart.destroyPart();
				delete this.knobProgressPart;
			}
		}

		async knobProgressUpdate(e) {
			let knobProgressPart = this.knobProgressPart;
			if (knobProgressPart)
				await knobProgressPart.update(e);
			else
				await this.knobProgressShow({ update: e });
		}

		knobProgressSetLabel(e) {
			if (!this.hasKnobProgress)
				return null;
			
			e = e || {};
			if (typeof e != 'object')
				e = { label: e };
			
			return this.knobProgressUpdate(e);
		}

		knobProgressSetProgress(e) {
			if (!this.hasKnobProgress)
				return null;
			
			e = e || {};
			if (typeof e != 'object')
				e = { progress: e };
			
			return this.knobProgressUpdate(e);
		}

		knobProgressStep(e) {
			if (!this.hasKnobProgress)
				return null;
			
			e = e || {};
			if (typeof e != 'object')
				e = { step: e };
			
			e.step = e.step || 1;
			return this.knobProgressUpdate(e);
		}

		async knobProgressSuccess(e) {
			e = e || {};
			e.update = $.extend({ labelTemplate: 'success' }, e.update || {});
			return this.knobProgressShow(e);
		}

		async knobProgressWarning(e) {
			e = e || {};
			e.update = $.extend({ labelTemplate: 'warning' }, e.update || {});
			return this.knobProgressShow(e);
		}

		async knobProgressError(e) {
			e = e || {};
			e.update = $.extend({ labelTemplate: 'error' }, e.update || {});
			return this.knobProgressShow(e);
		}

		hackVioWebProcs() {
			window.savedProcs = window.savedProcs || {};
			
			if (!savedProcs.showProgress) {
				savedProcs.showProgress = showProgress;
				showProgress = (text, title, delayMS, noAbortFlag) => {
					let func = e =>
						this.knobProgressShow({ update: { label: e.text, step: 5 } });

					let e = { text: text };
					if (delayMS && delayMS > 0) {
						this.setUniqueTimeout({
							key: 'showProgress', delayMS: delayMS,
							args: [e],
							block: e => func(e)
						});
					}
					else {
						func(e);
					}
				};
			}
			
			if (!savedProcs.hideProgress) {
				savedProcs.hideProgress = hideProgress;
				hideProgress = () => {
					this.knobProgressHideWithReset();
				};
			}

			if (!savedProcs.displayMessage) {
				savedProcs.displayMessage = displayMessage;
				displayMessage = (text, title, showCloseButton, buttons, isModal, collapseButton, position) => {
					if (buttons || isModal != null || !text ||
							(typeof text == 'string' && (text.length > 250 || text.includes("<div"))))
						return window.savedProcs.displayMessage(text, title, showCloseButton, buttons, isModal, collapseButton);
					
					text = text || '';
					title = title || '';
					let html = $(
						`<div class="notification">` +
						(title ? `	<div class="header">${title}</div>` : ``) +
								`	<div class="content">${text || ''}</div>` +
						`<div>`
					);
					html.appendTo('body');

					let notificationTemplate = 'info';
					let notificationBlink = false;
					if (text && typeof text == 'string') {
						if (text.includes('!') || title.includes('!')) {
							notificationTemplate = 'warning';
							notificationBlink = true;
						}
						else if (text.includes('@') || title.includes('@')) {
							notificationTemplate = 'error';
							notificationBlink = true;
						}
					}

					const notification = html.jqxNotification({
						theme: theme, width: 'auto', opacity: .95,
						animationOpenDelay: 400, animationCloseDelay: 50,
						autoOpen: true, closeOnClick: true, autoClose: false,
						// autoClose: true, autoCloseDelay: 1000,
						template: notificationTemplate, blink: notificationBlink,
						position: position || 'bottom-right'
					});
					notification.on('close', evt => {
						notification.jqxNotification('destroy');
						notification.remove();
					});

					return notification;
				};
			}

			displayServerResponseDevam = text => {
				let html = $(
					`<div class="notification">` +
					`	<div class="header">Sunucu Yanıtı</div>` +
					`	<div class="content">${text || ''}</div>` +
					`<div>`
				);
				html.appendTo('body');

				let notification = html.jqxNotification({
					theme: theme, width: 'auto', opacity: .95,
					animationOpenDelay: 1000, animationCloseDelay: 300,
					autoOpen: true, autoClose: false, closeOnClick: true,
					template: 'error', blink: true, position: 'bottom-right'
				});
				notification.on('close', evt => notification.jqxNotification('destroy'));
			};
		}

		loadLibs(e) {
			const {config} = sky;
			if (!config.appLibsLoadedFlag) {
				if (this.class.dateLibDesteklenirmi) {
					// await $.getScript({ url: '/vio/vioweb/lib_external/etc/date.js', cache: true });
					$(`<script sync src="../../vio/vioweb/lib_external/etc/date.js"></script>`).appendTo('head');
				}
				if (this.class.smartElementsDesteklenirmi)
					$(`<script src="../lib_external/htmlelements/smart.elements.js"></script>`).appendTo('head');
				if (this.class.qrScanDesteklenirmi) {
					$(`<script src="../lib_external/qrcode.js"></script>`).appendTo('head');
					$(`<script src="../lib_external/jsQR.js"></script>`).appendTo('head');
					$(`<script src="../lib_external/webcodecamjs/js/qrcodelib.js"></script>`).appendTo('head');
					$(`<script src="../lib_external/webcodecamjs/js/webcodecamjquery.js"></script>`).appendTo('head');
				}
				if (this.class.jsonEditorDesteklermi)
					$(`<script src="../lib_external/jsoneditor.js"></script>`).appendTo('head');
				if (this.class.aceEditorDesteklermi) {
					$(`<script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.9.5/ace.js" crossorigin="anonymous" referrerpolicy="no-referrer" integrity="sha512-wju2wMXmukx2760GKQBjykvRNeRY8LdMn6XnMPJQKRF7olV229IytqfkW9Z83lrdCVA168r4Ut4paNoRxJWoag=="></script>`)
						.appendTo('head');
					setTimeout(() => {
						if (!window.ace) {
							$(`<script src="../lib_external/ace.js"></script>`)
								.appendTo('head');
						}
					}, 3000);

				}
				config.appLibsLoadedFlag = true;
			}
		}

		async onResize(e) {
			e = e || {};
			await super.onResize(e);
			
			const id2Children = {}
			const {app, activePart, activeInnerPart, background} = this;
			/*if (parts) {
				for (const key in parts) {
					const part = parts[key];
					const id = part ? part.id || part.partName : null;
					if (id)
						id2Children[id] = part;
				}
			}*/
			if (activePart) {
				const id = activePart.id || activePart.partName;
				id2Children[id] = activePart;
			}
			if (activeInnerPart) {
				const id = activeInnerPart.id || activeInnerPart.partName;
				id2Children[id] = activeInnerPart;
			}
			for (const id in id2Children) {
				const part = id2Children[id];
				if (part && part.class && !part.noResizeEvent && $.isFunction(part.onResize)) 
					await part.onResize(e);
			}

			const {parent, header, content} = this;
			let headerHeight = 15;
			if (header && header.length && !header.hasClass('jqx-hidden'))
				headerHeight += header.height();
			
			if (parent && parent.length)
				parent.height($(window).height());
			if (content && content.length)
				content.height($(parent).height() - headerHeight);
			if (background && background.length) {
				background.width($(window).width() - 5);
				background.height($(window).height() - headerHeight);
			}
		}
		async onbellekSilIstendi(e) {
			let cacheKeys = window.caches ? await window.caches.keys() : [];
			const size = cacheKeys.length;
			if (!size) {
				displayMessage(`! Önbellekte silinecek veri bulunamadı !`);
				return
			}
			if (!navigator.onLine) {
				displayMessage(`! <b>Önbellek Sil</b> işlemi için <b>İnternete Bağlı</b> olmalısınız !`);
				return
			}
			try {
				await this.onbellekSil(e);
				displayMessage(`<b>${size} adet</b> önbellek deposu silindi`);
				await new Promise(resolve => {
					setTimeout(async () => resolve(await this.onbellekSil(e)), 500)
				});
			}
			catch (ex) { }
		}
		async onbellekSil(e) {
			const cacheKeys = window.caches ? await window.caches.keys() : [];
			for (const i in cacheKeys)
				await caches.delete(cacheKeys[i])
		}
		async toggleFullScreen(e) {
			try {
				if (document.fullscreen)
					await cancelFullScreen({ force: true })
				else
					await requestFullScreen({ force: true })
				return true
			}
			catch (ex) { return false }
		}
		
		wsGetSessionInfo(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}getSessionInfo`,
				data: this.buildAjaxArgs(e)
			})
		}

		wsBilgi(e) {
			return lastAjaxObj = $.get({
				url: `${this.wsURLBase}wsBilgi`,
				data: this.buildAjaxArgs(e)
			})
		}

		async getDataTable(e) {
			e = e || {};
			let {recs, cols} = e;
			if (!cols) {
				if ($.isEmptyObject(recs))
					return null;

				cols = [];
				const rec = recs[0];
				for (const key in rec) {
					const value = rec[key];
					const type = rec[key];
					const isNumber = type == 'number';
					let colType = 'string';
					if (isNumber)
						colType = 'number';
					else if (Utils.isDate(value))
						colType = 'date';
					
					cols.push({
						dataField: key, text: key,
						columnType: colType,
						cellsAlign: isNumber ? 'right' : 'left',
						cellClassName: key
					});
				}
			}

			let result = `<table cellpadding="3" style="border: 1px solid #888; width: 100%; padding: 8px;"><thead><tr>`;
			for (let i in cols) {
				const col = cols[i];
				result += `<th data-role="column" id="${col.dataField}" class="bold" style="color: #eee; background-color: #222; border: 2px solid #555; border-bottom: 2px solid #ccc;">${col.text}</th>`;
			}
			result += `</tr></thead><tbody>`;

			recs = await recs;
			if (!recs)
				return null;
			
			for (let i in recs) {
				i = asInteger(i);
				const rec = recs[i];
				result += `<tr data-role="row" data-index="${i}">`;
				for (const col of cols) {
					const key = col.dataField;
					let value = rec[key];
					
					const type = col.columnType;
					const isNumber = type == 'number';
					const isDate = Utils.isDate(value);
					
					if (value === undefined)
						value = '<i>undefined</i>';
					else if (value === null)
						value = '<i>null</i>';
					else if (isNumber)
						value = value.toLocaleString();
					else if (isDate)
						value = dateTimeToString(value);

					// value = value || 'nbsp;';
					const backColor = i % 2 == 1 ? '#cecece' : '';
					result += `<td id="${key}" style="border: 1px solid #bbb; background-color: ${backColor};">${value}</td>`;
				}
				result += `</tr>`;
			}
			result += `</tbody></table>`;

			return result
		}
	}
})();
