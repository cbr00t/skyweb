
(function() {
	window.AppPartBase = class extends window.LayoutBase {
		constructor(e) {
			super(e);
			
			e = e || {};
			$.extend(this, {
				disableTimersFlag: sky.config.disableTimersFlag,
				app: e.app || sky.app,
				extensions: e.extensions,
				timers: {},
			});
			this.savedDisableTimersFlag = this.disableTimersFlag;

			if (!this.extensions)
				this.initExtensions(e);
		}
		
		get rootAppName() { return this.class.rootAppName }
		get appName() { return this.class.appName }
		get partName() { return this.id || this.class.partName }

		get basePath() { return this.partRoot || this.appRoot }
		get appConfigRoot() { return `${this.basePath}config/`}
		get appDataRoot() { return `${this.basePath}data/`}

		get loginExtensionClass() { return LoginExtension }

		
		async preInit(e) {
			await super.preInit(e);

			await this.forEachExtension($.extend({}, e, {
				block: e => e.extension.preInit(e)
			}));
		}

		async ilkIslemler(e) {
			await super.ilkIslemler(e);

			await this.forEachExtension($.extend({}, e, {
				block: async e => await e.extension.ilkIslemler(e)
			}));
		}

		async init(e) {
			await super.init(e);

			await this.forEachExtension($.extend({}, e, {
				block: async e => await e.extension.init(e)
			}));

			await this.showInitLayout();
			await this.showInitLayoutSon();
			await this.clearLayoutWithDestroy();

			if (sky.config.autoDevConsole) {
				setTimeout(async () => {
					for (let i = 0; i < 10; i++) {
						if (window.ace)
							break;
						await new $.Deferred(p =>
							setTimeout(() => p.resolve(), 500));
					}
					
					try { this.initDevConsole(e) }
					catch (ex) { }
				}, 10);
			}
		}

		async run(e) {
			await super.run(e);

			await this.forEachExtension($.extend({}, e, {
				block: e => e.extension.run(e)
			}));
			
			await this.showDefaultLayout(e);
		}

		basicRun(e) {
			super.run(e);

			this.forEachExtension($.extend({}, e, {
				block: e => e.extension.run(e)
			}));
			this.basicSetDefaultLayout(e);
		}

		async afterRun(e) {
			await super.afterRun(e);

			await this.forEachExtension($.extend({}, e, {
				block: e => e.extension.afterRun(e)
			}));
			this.initFlag = true;
		}

		async exiting(e) {
			await super.exiting(e);

			await this.forEachExtension($.extend({}, e, {
				block: e => e.extension.exiting(e)
			}));
			await this.destroyPart(e);
		}

		destroyLayout(e) {
			this.clearTimers(e);
			return super.destroyLayout(e);
		}


		preInitLayout(e) {
			let result = super.preInitLayout(e);			
			this.showHideDebugElements(e);
			return result;
		}

		postInitLayout(e) {
			let result = super.postInitLayout(e);
			this.setUpTimers();
			this.setTimers();
			
			return result;
		}

		getSubLayoutContainer() { return null }

		getSubLayoutContent() { return null }


		async showInitLayout(e) {
		}

		async showInitLayoutSon(e) {
			await this.showHideDebugElements(e);
			this.initDevConsoleHandler(e);
		}

		async showDefaultLayout(e) {
			e = e || {};

			const defaultRootLayoutName = this.defaultRootLayoutName;
			let rootLayout, layout;
			let _e = {};
			if (defaultRootLayoutName) {
				$.extend(_e, { noSaveLayout: true, noInit: true });
				rootLayout = layout = (await this.setLayout($.extend({}, _e, { name: defaultRootLayoutName }))).layout;
			}
			layout = await this.setDefaultLayout(_e);
			delete e.layout;
			if (rootLayout) {
				this.layout = this.rootLayout = rootLayout;
				let subLayoutContainer = this.getSubLayoutContainer(e);
				if ($.isFunction(subLayoutContainer))
					subLayoutContainer = subLayoutContainer.call(this, e);
				
				if (!(subLayoutContainer && subLayoutContainer.length))
					subLayoutContainer = rootLayout;
				
				if (layout && layout.length) {
					let subLayoutContent = this.getSubLayoutContent(e);
					if ($.isFunction(subLayoutContent))
						subLayoutContent = subLayoutContent.call(this, e);
					
					let subLayout = (subLayoutContent && subLayoutContent.length) ? subLayoutContent : layout;
					subLayout
						.detach()
						.appendTo(subLayoutContainer);
					
					if (subLayout != layout && layout && layout.length)
						layout.remove();
				}

				await this.preInitLayout(e);
				await this.postInitLayout(e);
			}
		}


		setUpTimers(e) {
		}

		async setTimers(e) {
			e = e || {};
			let delay;
			delete this.timersMinDelay;

			const {timers} = this;
			for (const key in timers) {
				const e = timers[key];
				const _delay = e.delay || 0;
				if (this.timersMinDelay == null || _delay < (this.timersMinDelay || 0))
					this.timersMinDelay = _delay;
			}

			if (this.hTimerManager) {
				clearInterval(this.hTimerManager);
				delete this.hTimerManager;
			}

			if (!this.timersMinDelay)
				return;

			let initTimerManager;
			initTimerManager = () => {
				if (this.hTimerManager)
					return this.hTimerManager;
				
				// console.debug(`timer manager activated`, { timers: this.timers });
				e.timerManager = this.hTimerManager = setTimeout(async e => {
					if (this.disableTimersFlag) {
						initTimerManager();
						return;
					}

					// console.debug(`timer manager interval`, { timers: this.timers });
					// delete this.timersMinDelay;
					let promises = [];
					for (let key in this.timers) {
						const e = this.timers[key];
						if (e.enabled != false && e.ready && !e.running) {
							if (this.timersMinDelay == null || e.delay < (this.timersMinDelay || 0))
								this.timersMinDelay = e.delay;
							
							e.ready = false;
							if (!e.interval) {
								delete e.handle;
								delete this.timers[key];
							}
							promises.push(new $.Deferred(async p => {
								e.running = true;
								// console.debug(`timer interval`, $.extend({}, { id: key, timers: this.timers }, e));
								try {
									p.resolve(await e.block.call(this, e))
								}
								catch (ex) {
									console.error(ex);
									p.reject(ex) }
								finally {
									e.running = false
								}
							}));
						}
					}
					
					if (this.hTimerManager) {
						clearInterval(this.hTimerManager);
						delete this.hTimerManager;
					}
					
					let promiseResults, lastError;
					try { promiseResults = await Promise.all(promises) }
					catch (ex) { lastError = ex }
					promises = [];
					
					if (this.timersMinDelay)
						initTimerManager();
				}, this.timersMinDelay, e);
			};

			if (this.hTimerManager) {
				clearInterval(this.hTimerManager);
				delete this.hTimerManager;
			}
			initTimerManager();
			
			for (const key in this.timers) {
				const e = this.timers[key];
				const selector = e.interval ? 'setInterval' : 'setTimeout';
				e.handle = window[selector](e => {
					if (e.enabled != false)
						e.ready = true;
				}, e.delay, e);
			}
		}

		clearTimers(e) {
			if (this.hTimerManager) {
				clearInterval(this.hTimerManager);
				delete this.hTimerManager;
			}

			$.each(this.timers, async (key, e) => {
				if (e.handle) {
					const selector = e.interval ? 'clearInterval' : 'clearimeout';
					window[selector](e.handle);
					delete e.handle;
				}
			});
			this.timers = {};
		}
		
		destroyWindows(e) {
			e = e || {};
			let cssEk = '';
			if (e.titleMatch) {
				this.jqueryFind({
					getter: () => $(`.jqx-window:not(.devConsole) .ui-window-title :contains("${e.titleMatch}")`),
					action: obj => obj.parents('.jqx-window:not(.devConsole)').jqxWindow('destroy')
				});
			}
			
			this.jqueryFind({
				getter: () => $('.jqx-window:not(.devConsole)'),
				action: obj => obj.jqxWindow('destroy')
			});
			this.jqueryFind({
				getter: () => $('.jqx-notification'),
				action: obj => obj.jqxNotification('destroy')
			});
		}

		destroyServerResponseWindows(e) {
			return this.destroyWindows({ titleMatch: 'Sunucu Yanıtı' })
		}

		showHideDebugElements(e) {
			e = e || {};
			const isDebug = this.class.isDebug;
			const content = e.layout || e.content || this.content;
			const showHideElements = elements => {
				if (elements && elements.length) {
					if (isDebug) {
						elements.removeClass('jqx-hidden');
						elements.removeClass('basic-hidden');
					}
					else {
						if (!(elements.hasClass('jqx-hidden') && elements.hasClass('basic-hidden')))
							elements.addClass('jqx-hidden');
					}
				}
			};

			const debugElements = content.find('.debug');
			if (debugElements.length) {
				showHideElements(debugElements);

				const templateElements = debugElements.filter('template');
				const contents = templateElements && templateElements.length ? templateElements.contents() : {};
				if (contents.length)
					showHideElements(contents);
			}
		}

		initExtensions(e) {
			const extensions = this.extensions = {
				login: new this.loginExtensionClass(e)
			};

			return extensions;
		}

		forEachExtension(e) {
			e = $.extend({}, e || {});
			if ($.isEmptyObject(this.extensions))
				return;
			
			const block = e.block;
			delete e.block;
			
			return new $.Deferred(async p => {
				const extensions = this.extensions;
				for (let key in extensions) {
					$.extend(e, { key: key, extension: extensions[key] });
					await block.call(this, e);
				}
				p.resolve(true);
			});
		}

		buildAjaxArgs(e) {
			return this.buildAjaxArgsBasic(e);
		}

		buildAjaxArgsBasic(e) {
			e = e || {};
			return $.extend({}, ajaxWSDefOptsWithIO, e);
		}


		async loginIstendi(e) {
			const extLogin = this.extensions.login;
			await extLogin.login();
		}

		logoutIstendi(e) {
			this.prefetchAbortedFlag = true;
			if (sky.config.logoutClosesWindow)
				return this.loginIstendiDevam(e);
			
			return new $.Deferred(p => {
				displayMessage('Oturum kapatılacak, devam edilsin mi?', this.appText, true, {
					'EVET': async (dlgUI, btnUI) => {
						dlgUI.jqxWindow('destroy');
						await this.loginIstendiDevam(e);
						p.resolve({ dlgResult: true });
					},
					'HAYIR': (dlgUI, btnUI) => {
						dlgUI.jqxWindow('destroy');
						p.resolve({ dlgResult: false });
					}
				});
			});
		}

		async loginIstendiDevam(e) {
			this.prefetchAbortedFlag = true;
			
			const extLogin = this.extensions.login;
			await (window.savedProcs || window).showProgress(null, null, 1);
			try {
				if (sky.config.logoutClosesWindow) {
					await extLogin.closeLoginUI();
					window.close();
					return;
				}
				await extLogin.closeLoginUI();
				await extLogin.logout();

				await this.clearTimers();
				const {uniqueTimers} = this;
				if (uniqueTimers) {
					for (const key in uniqueTimers)
						await this.clearUniqueTimeout({ key: key });
				}

				await this.destroyPart();
				await this.clearContentWithDestroy();
			}
			finally {
				await (window.savedProcs || window).hideProgress();
			}

			delete sky.app;
			await sky.run();
		}

		initDevConsoleHandler(e) {
			setTimeout(() => {
				const handler = evt => {
					const keyCode = (evt.key || '').toLowerCase();
					if (evt.ctrlKey || evt.shiftKey) {
						if (keyCode == 'f12')
							this.initDevConsole(e);
					}
					else {
						if (keyCode == `~`)
							this.initDevConsole(e);
					}
				};
				// $(document).on('keyup', evt => handler(evt));
				$('*').on('keyup', evt => handler(evt));
			}, 3000);

			const {spanAppTitle} = this;
			if (spanAppTitle && spanAppTitle.length) {
				spanAppTitle.on('contextmenu', evt =>
					this.initDevConsole(e));
			}
		}

		initDevConsole(e) {
			e = e || {};
			if (this.isDevConsoleOpen)
				return this.wndDevConsole;
			
			let layout = e.devConsole;
			if ((layout && layout.length)) {
				layout[this.isDevConsoleOpen ? 'addClass' : 'removeClass'](`jqx-hidden basic-hidden`);
				this.isDevConsoleOpen = !this.isDevConsoleOpen;
				return layout;
			}
			else {
				if (this.wndDevConsole && this.wndDevConsole.length) {
					try { this.wndDevConsole.jqxWindow('destroy') }
					catch (ex) { }
					
					if (this.devConsole_editor) {
						this.devConsole_editor.destroy();
						this.devConsole_editor = null;
					}
					
					this.isDevConsoleOpen = false;
					delete this.wndDevConsole;
				}
				else {
					const parentName = `devConsole`;
					const template = $('body').find(`#${parentName}`);
					const wndContent = template.contents(`div`).clone(true);
					const txtCmd = wndContent.find(`#cmd`);
					const divCmdPreview = wndContent.find(`#cmd-preview`);
					if (window.ace || window.hljs) {
						if (!window.ace) {
							divCmdPreview.on('click', evt => {
								divCmdPreview.addClass(`jqx-hidden`);
								txtCmd.removeClass(`jqx-hidden`);
								txtCmd.focus();
							});
							txtCmd.on('blur', evt => {
								txtCmd.addClass(`jqx-hidden`);
								divCmdPreview.removeClass(`jqx-hidden`);
								divCmdPreview.html(`<pre><code>${txtCmd.val()}</code></pre>`);
								hljs.highlightBlock(divCmdPreview[0]);
							});
						}
					}
					else {
						divCmdPreview.addClass(`jqx-hidden`);
						txtCmd.removeClass(`jqx-hidden`);
					}
					txtCmd.on('focus', evt =>
						evt.target.select());
					
					const divResult = wndContent.find(`#result`);
					const wnd = this.wndDevConsole = createJQXWindow(
						wndContent,
						`Dev Console`,
						{
							isModal: false, showCollapseButton: true, showCloseButton: true,
							closeButtonAction: 'close', keyboardCloseKey: '',
							width: $(window).width() - 10, height: $(window).height() - 100
						},
						{
							'ÇALIŞTIR': async (dlgUI, btnUI) => {
								const _e = $.extend({}, e, {
									sender: this, wnd: wnd, content: wndContent,
									txtCmd: txtCmd, cmdPreview: divCmdPreview, result: divResult,
									cmd: txtCmd.val(), editor: this.devConsole_editor
								});
								divResult.html('');
								divResult.removeClass(`error success`);
								try {
									let result = await this.devConsole_execute(_e);
									if (result && typeof result == 'object')
										result = toJSONStr(result);
									const scrollTop = divResult.scrollTop();
									divResult.html(result);
									if (result != null) {
										divResult.addClass(`success`);
										if (window.hljs)
											hljs.highlightBlock(divResult[0]);
										divResult.scrollTop(scrollTop);
									}
								}
								catch (ex) {
									let error = ex;
									error = (error ? error.message || error : null) || (xhr ? xhr.responseJSON || xhr.responseText || xhr : null);
									if (typeof error == 'object')
										error = toJSONStr(error);
									
									divResult.addClass(`error`);
									divResult.html(error);
									console.error(ex);
								}

								//setTimeout(() => {
								//	divResult.scrollTop(10000000);
								//}, 10)
							},
							'KAPAT': (dlgUI, btnUI) => {
								dlgUI.jqxWindow('destroy');
								delete this.wndDevConsole;
								this.isDevConsoleOpen = false;
								if (wndContent && wndContent.length)
									wndContent.remove();
							}
						}
					);
					wnd.addClass(parentName);
					const resizeHandler = evt => {
						wndContent.height(wnd.height() - wnd.find(`.ui-window-title`).height() - wnd.find(`.ui-dialog-button`).height());
						if (this.devConsole_editor)
							this.devConsole_editor.resize();
					}
					wnd.on('resize', evt => {
						this.setUniqueTimeout({
							key: `wndResize`,
							delayMS: 10,
							args: evt,
							block: evt =>
								resizeHandler(evt)
						});
					});
					wnd.on('close', evt => {
						wnd.jqxWindow('destroy');
						delete this.wndDevConsole;
						this.isDevConsoleOpen = false;
						if (this.devConsole_editor) {
							this.devConsole_editor.destroy();
							this.devConsole_editor = null;
						}
						if (wndContent && wndContent.length)
							wndContent.remove();
					});
					wnd.find(`.ui-dialog-button input[type=button][value='ÇALIŞTIR']`).jqxButton('template', 'success');
					
					resizeHandler();
					if (window.ace) {
						const editor = this.devConsole_editor = ace.edit(
							divCmdPreview[0], {
								theme: 'ace/theme/monokai',
								mode: 'ace/mode/javascript',
							    selectionStyle: 'text'
							}
						);
						editor.setOptions({
						    autoScrollEditorIntoView: false,
						    copyWithEmptySelection: true,
							mergeUndoDeltas: 'always'
						});
						editor.session.setValue(txtCmd.val());
						editor.on('change', e =>
							txtCmd.val(editor.getValue()));
					}
					
					if (window.ace || window.hljs)
						divCmdPreview.click();
					else
						txtCmd.focus();
				}
				
				this.isDevConsoleOpen = (this.wndDevConsole && this.wndDevConsole.length);
				return this.wndDevConsole;
			}
		}

		async devConsole_execute(e) {
			const {cmd} = e;
			if (!cmd)
				return null;

			window.devConsole = e;
			return await eval(`(async function() { ${cmd} })()`);
		}
	}
})();
