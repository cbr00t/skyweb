(function() {
	window.SkyCafeWindowPart = class extends window.SubPart {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				tamamIslemi: e.tamamIslemi,
				canClose: e.canClose,
				canCollapseByTitle: e.canCollapseByTitle,
				modal: e.modal,
				position: e.position,
				opacity: e.opacity,
				title: e.title,
				events: e.events || {}
			});
			
			const {partName} = this;
			const {param} = this.app;
			const {autoCompleteData} = param;
			this.autoCompleteData = autoCompleteData[partName] = autoCompleteData[partName] || {};

			if (!param.wndId2Info)
				param.wndId2Info = {};
			this.wndInfo = param.wndId2Info[partName] = param.wndId2Info[partName] || {};
		}

		static get noResizeEventOnInputs() { return false }
		static get isComponent() { return true }

		get defaultTitle() { return ' ' }
		get klavyeAcilirmi() { return true }
		get numKlavyeAcilirmi() { return false }
		get defaultCanClose() { return true }
		get defaultCanCollapseByTitle() { return false }
		get defaultIsModal() { return false }
		get autoCompleteSelector2ValueGetter() { return {} }
		get templatesParent() { return this.app.templatesOrtak }
		get autoHeight_uiSelector() { return null }
		get autoFocus_uiSelector() { return null }

		open(e) {
			e = e || {};
			const {detay} = e;
			let {wnd} = this;
			const {app, partName, parentPart, wndInfo} = this;
			const parentPartName = parentPart.partName || '';
			const {appName, rootAppName} = app;

			if (wnd && e.title != null && e.title != this.title)
				wnd.find(`.jqx-window-header #title`).html(e.title);

			this.setValues(e);

			const {klavyeAcilirmi, numKlavyeAcilirmi, events, opacity, title} = this;
			let {position} = this;
			/*if (!position) {
				position = {
					x: 'center',
					y: 'center'
				};
			}*/
			if (e.events)
				$.extend(events, e.events);
			
			if (wnd && !wnd.length)
				delete this.wnd;
			
			if (wnd) {
				this.tazele(e);
				if (klavyeAcilirmi)
					this.initKlavyePart(e);
				if (numKlavyeAcilirmi)
					this.initNumKlavyePart(e);
				return;
			}

			const scrWidth = $(window).width();
			const wndContent = this.wndContent = this.getLayout(e);
			const wndArgs = {
				showCollapseButton: true, autoOpen: false,
				showCloseButton: e.canClose == null ? (this.canClose == null ? this.defaultCanClose : this.canClose) : asBool(e.canClose),
				closeButtonAction: 'close', minWidth: 180, minHeight: 110,
				isModal: e.modal == null ? (this.modal == null ? this.defaultIsModal : this.modal) : asBool(e.modal)
			};
			if (position)
				wndArgs.position = position;
			/*else {
				if (wndInfo && wndInfo.position)
					wndArgs.position = wndInfo;
			}*/
			this.wndArgsDuzenle($.extend({}, e, { args: wndArgs }))
			wnd = this.wnd = createJQXWindow(
				wndContent,
				title == null ? this.defaultTitle : title,
				wndArgs);
			
			wnd.addClass(`${partName} ${parentPartName} ${appName} ${rootAppName} part`);
			wndContent.addClass(`${partName} ${parentPartName} ${appName} ${rootAppName} content`);

			wnd.css('opacity', .1);
			wndContent.css('opacity', .1);
			wnd.off('open');
			wnd.on('open', async evt => {
				await this.tazele(e);

				setTimeout(() => {
					const handler = this.events.open;
					if (handler) {
						const _e = $.extend({}, e, { sender: this, event: evt, wnd: wnd, wndContent: wndContent });
						if ($.isFunction(handler))
							handler.call(this, _e);
						else if (handler.run)
							handler.run(_e);
					}

					/*wnd.find(`*`).attr('keyboard', 'disable');
					wnd.find(`.jqx-window-header`).attr('readonly', '');
					wnd.find(`button`).attr('readonly', '');*/

					wndContent.css('opacity', opacity == null ? 1 : opacity);
					wnd.css('opacity', opacity == null ? 1 : opacity);
				}, 0);
			});
			wnd.off('close');
			wnd.on('close', evt => {
				const handler = this.events.close;
				if (handler) {
					const _e = $.extend({}, e, { sender: this, event: evt, wnd: wnd, wndContent: wndContent });
					let result;
					if ($.isFunction(handler))
						result = handler.call(this, _e);
					else if (handler.run)
						result = handler.run(_e);
					if (result === false) {
						evt.preventDefault();
						wnd.jqxWindow('open');
						return;
					}
				}
				this.close($.extend({}, e, { event: evt, userCloseFlag: true }))
			});
			wnd.off('collapse');
			wnd.on('collapse', evt => {
				wnd.addClass(`collapsed`);
				wndContent.addClass(`collapsed`);
			});
			wnd.off('expand');
			wnd.on('expand', evt => {
				wnd.removeClass(`collapsed`);
				wndContent.removeClass(`collapsed`);
			});
			wnd.off('resize');
			wnd.on('resize', evt => {
				setTimeout(async () => {
					const _e = $.extend({}, e, { event: evt });
					await this.onResize(_e);
					await this.wnd_onResize(_e);
				}, 10);
			});
			wnd.off('moving');
			wnd.on('moving', evt => {
				setTimeout(async () => {
					const _e = $.extend({}, e, { event: evt });
					await this.onResize(_e);
					await this.wnd_onResize(_e);
				}, 20);
			});
			
			const headerExceptCollapseButton = wnd.find(`.jqx-window-header:not(.jqx-window-collapse-button)`);
			// headerExceptCollapseButton.off('mousedown');
			headerExceptCollapseButton.on('mousedown', evt =>
				this.wndLastPos = wnd.position());
			const canCollapseByTitle = e.canCollapseByTitle == null ? (this.canCollapseByTitle == null ? this.defaultCanCollapseByTitle : this.canCollapseByTitle) : e.canCollapseByTitle;
			if (canCollapseByTitle) {
				// headerExceptCollapseButton.off('mouseup');
				headerExceptCollapseButton.on('mouseup', evt => {
					if (evt.button != 0 || evt.target.classList.contains(`jqx-window-collapse-button`))
						return;

					const {wndLastPos} = this;
					const widget = wnd.jqxWindow('getInstance');
					delete this.wndLastPos;

					const wndCurPos = wnd.position();
					if (wndLastPos && !(wndCurPos.left == wndLastPos.left && wndCurPos.top == wndLastPos.top))
						return;

					if (widget.collapsed)
						widget.expand();
					else
						widget.collapse();
					
					// throw { isError: false, rc: 'disableInputFakeError' };
				});
			}

			wnd.jqxWindow('open');
			if (klavyeAcilirmi)
				this.initKlavyePart(e);
			if (numKlavyeAcilirmi)
				this.initNumKlavyePart(e);
		}

		close(e) {
			e = e || {};
			const {userCloseFlag} = e;
			const {wnd, wndContent, app, geriCallback} = this;

			if (!wnd)
				return;

			const isModal = wnd.jqxWindow('isModal');
			const divModalBackground = $(`.jqx-window-modal`);
			if (isModal) {
				wnd.jqxWindow('isModal', false);
				if (divModalBackground.length)
					divModalBackground.remove();
			}
			
			app.closeNumKlavyePart();
			app.closeKlavyePart();

			this.close_araIslemler(e);

			setTimeout(() => {
				this.jqueryFind({
					getter: e =>
						$(`ul.jqx-input-popup`),
					action: obj =>
						obj.remove()
				});
			}, 100);

			if (wndContent) {
				if (wndContent.length)
					wndContent.remove();
				delete this.wndContent;
			}
			if (wnd) {
				wnd.jqxWindow('destroy');
				delete this.wnd;
			}
			delete app.activeWndPart;
			delete app.activeWnd;

			if (geriCallback) {
				const _e = $.extend({}, e || {}, { sender: this });
				if ($.isFunction(geriCallback))
					geriCallback.call(this, _e);
				else if (geriCallback.run)
					geriCallback.run(_e);
			}
		}

		close_araIslemler(e) {
		}

		async tazele(e) {
			const {wndContent} = this;
			const btnTamam = this.btnTamam = wndContent.find(`#btnTamam`);
			if (btnTamam && btnTamam.length) {
				btnTamam.jqxButton({ theme: theme });
				btnTamam
					.off('click')
					.on('click', evt =>
						this.tamamIstendi($.extend({}, e, { event: evt })));
			}
			const btnTazele = this.btnTazele = wndContent.find(`#btnTazele`);
			if (btnTazele && btnTazele.length) {
				btnTazele.jqxButton({ theme: theme });
				btnTazele
					.off('click')
					.on('click', evt =>
						this.tazeleDevam($.extend({}, e, { event: evt })));
			}
			
			const result = await this.tazeleDevam(e);
			if (result === false)
				return result;
			
			const {app, wnd} = this;
			if (wnd.jqxWindow('isOpen'))
				this.tazeleSonrasi(e);
			
			wnd.off('open');
			wnd.on('open', evt => {
				setTimeout(
					() => this.tazeleSonrasi(e),
					50);
			});
			wnd.find(`*`).off('focus');
			wnd.find(`*`).on('focus', evt => {
				app.activeWndPart = this;
				app.activeWnd = wnd;
			});
			/*wndContent.find(`input`).off('focus');
			wndContent.find(`input`).on('focus', evt =>
				evt.target.select());*/
			
			app.activeWndPart = this;
			app.activeWnd = wnd;
		}

		async tazeleDevam(e) {
		}

		tazeleSonrasi(e) {
			const {autoHeight_uiSelector, autoFocus_uiSelector, wndContent, wnd} = this;
			let elm = autoHeight_uiSelector ? wndContent.find(autoHeight_uiSelector) : null;
			if (elm && elm.length)
				wnd.jqxWindow('height', elm.position().top + elm.height() + 33);
			
			setTimeout(async () => {
				await this.onResize($.extend({}, e));
				await this.wnd_onResize($.extend({}, e));
			}, 50);
			
			elm = autoFocus_uiSelector ? wndContent.find(autoFocus_uiSelector) : null;
			if (elm && elm.length) {
				elm = autoFocus_uiSelector ? wndContent.find(autoFocus_uiSelector) : null;
				if (elm && elm.length) {
					setTimeout(() => elm.focus(), 300);
				}
			}
		}

		async tamamIstendi(e) {
			e = e || {};
			const evt = e.event;
			if (evt && evt.currentTarget) {
				const btn = $(evt.currentTarget);
				setButonEnabled(btn, false);
				setTimeout(() => {
					if (this.wnd && !this.isDestroyed)
						setButonEnabled(btn, true);
				}, 1500);
			}

			
			const {app, autoCompleteData, tamamIslemi} = this;
			const _e = $.extend({}, e, { sender: this });

			app.hideNotifications();

			let result = await this.tamamIstendi_argsDuzenle($.extend({}, e || {}, { args: _e }));
			if (result === false)
				return result;
			if (result && result.isError) {
				if (result.errorText)
					displayMessage(result.errorText, `@ ${this.title || ''} @`);
				return result;
			}
			
			result = true;
			if (tamamIslemi) {
				result = false;
				if ($.isFunction(tamamIslemi))
					result = await tamamIslemi.call(this, _e);
				else if (tamamIslemi && tamamIslemi.run)
					result = await tamamIslemi.run(e);
			}
			if (result === false)
				return result;
			
			await this.tamamIstendi_sonIslemler(e);
			this.close(e);

			return result;
		}

		tamamIstendi_sonIslemler(e) {
			const {app, autoCompleteData, autoCompleteSelector2ValueGetter} = this;
			let paramDegistimi = false;
			if (!$.isEmptyObject(autoCompleteSelector2ValueGetter)) {
				for (const selector in autoCompleteSelector2ValueGetter) {
					const getter = autoCompleteSelector2ValueGetter[selector];
					let value;
					if ($.isFunction(getter))
						value = getter.call(this, e);
					else if (getter.run)
						value = getter.run(e);
					else
						value = getter;
					
					if (value && value.length > 2) {
						const items = autoCompleteData[selector] = autoCompleteData[selector] || {};
						if (!items[value]) {
							items[value] = true;
							paramDegistimi = true;
						}
					}
				}
			}
			if (paramDegistimi)
				app.param.kaydet();
		}

		initKlavyePart(e) {
			const _e = {
				height: 250,
				position: `bottom`
			};
			this.initKlavyePart_argsDuzenle($.extend({}, e, { args: _e }));
			this.app.initKlavyePart(_e);
			/*this.setUniqueTimeout({
				delayMS: 10,
				args: _e,
				block: _e =>
					this.app.initKlavyePart(_e)
			});*/
		}

		initNumKlavyePart(e) {
			const {app, wndContent} = this;
			const _e = {
				height: 250,
				position: {
					x: $(window).width() - 310,
					y: $(window).height() - 305
				}
			};
			this.initKlavyePart_argsDuzenle($.extend({}, e, { args: _e }));
			app.initNumKlavyePart(_e);
			/*this.setUniqueTimeout({
				delayMS: 10,
				args: _e,
				block: _e =>
					this.app.initNumKlavyePart(_e)
			});*/
		}

		initTextInput(e) {
			const {htmlSelector, instSelector, args, placeHolder} = e;
			const _e = $.extend({}, {
				theme: theme,
				placeHolder: (placeHolder == null ? this.placeHolder : placeHolder) || ''
				/*searchMode: 'containsignorecase',
				minLength: 1,
				source: new $.jqx.dataAdapter({
					datatype: 'array',
					localdata: Object.keys(this.autoCompleteData[instSelector] || {})
				}, {
					cache: true, async: true,
					autoBind: false
				})*/
			}, args || {});
			const value = e.value == null ? this[instSelector] : e.value;
			const elmTextInput = this.wndContent.find(htmlSelector).jqxInput(_e);
			elmTextInput.val(value || '');
			/*elmTextInput.off('change');
			elmTextInput.on('change', evt => {
				const widget = elmTextInput.jqxInput('getInstance');
				const value = elmTextInput.val();
				widget.value = widget.query = value;
				if (value.length >= elmTextInput.jqxInput('minLength'))
					 widget.suggest();
			});*/
			elmTextInput.off('keyup');
			elmTextInput.on('keyup', evt => {
				this.setUniqueTimeout({
					delayMS: 50,
					args: $.extend({}, e, { event: evt }),
					block: e => {
						const evt = e.event;
						const {value} = evt.target;
						const {setValue} = e;
						if (setValue)
							Utils.getFuncValue(setValue, { sender: this, value: value });
						else
							this[instSelector] = evt.target.value;
					}
				});
			});
			elmTextInput.off('blur');
			elmTextInput.on('blur', evt => {
				const {setValue} = e;
				const {value} = evt.target;
				if (setValue)
					Utils.getFuncValue(setValue, { sender: this, value: value });
				else
					this[instSelector] = evt.target.value;
			});
			return elmTextInput;
		}

		getLayout(e) {
			const {templatesParent, partName} = this;
			let template = templatesParent.contents(`#${partName}.part`);
			if (!template.length)
				template = templatesParent.contents(`.${partName}.part`);
			return template.length ? template.clone(true) : null;
		}

		setValues(e) {
			$.extend(this, {
				geriCallback: e.geriCallback || this.geriCallback,
				tamamIslemi: e.tamamIslemi || this.tamamIslemi,
				position: e.position || this.position,
				opacity: e.opacity == null ? this.opacity : e.opacity,
				// modal: e.modal == null ? this.modal : e.modal,
				title: e.title == null ? this.title : e.title,
				canCollapseByTitle: e.canCollapseByTitle == null ? this.canCollapseByTitle : e.canCollapseByTitle
			});
		}

		wndArgsDuzenle(e) {
			/*$.extend(e.args, {
				width: 650,
				height: 110,
				minWidth: 180,
				minHeight: 109
			});*/
		}

		initKlavyePart_argsDuzenle(e) {
			/*$.extend(e.args, {
			});*/
		}

		tamamIstendi_argsDuzenle(e) {
			/*$.extend(e.args, {
			});*/
		}

		async wnd_onResize(e) {
			const {wnd} = this;
			const wndWidget = wnd ? wnd.jqxWindow('getInstance') : null;
			if (wnd) {
				if (wnd.offset().left + wnd.width() > $(window).width())
					wnd.jqxWindow('width', $(window).width() - wnd.offset().left - 5);
			}
		}
	}
})()
