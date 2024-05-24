(function() {
	window.SkyMESKlavyePart = class extends window.SubPart {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				tip2Size: {
					numerik: { width: 250, height: 250 },
					text: { width: 700, height: 280 }
				},
				tip: e.tip || 'text',
				textOnly: e.textOnly,
				tamamIslemi: e.tamamIslemi,
				canClose: asBool(e.canClose),
				position: e.position,
				opacity: e.opacity,
				title: e.title,
				size: e.size,
				events: e.events || {}
			});
		}

		static get noResizeEventOnInputs() { return false }
		static get partName() { return 'klavye' }
		static get isComponent() { return true }

		open(e) {
			e = e || {};
			const {detay} = e;
			let {wnd} = this;
			const {app, partName, parentPart} = this;
			const parentPartName = parentPart.partName || '';
			const {appName, rootAppName, templatesOrtak} = app;

			if (wnd && e.title != null && e.title != this.title)
				wnd.find(`.jqx-window-header #title`).html(e.title);

			$.extend(this, {
				geriCallback: e.geriCallback || this.geriCallback,
				tamamIslemi: e.tamamIslemi || this.tamamIslemi,
				tip: e.tip || this.tip,
				textOnly: e.textOnly == null ? this.textOnly : e.textOnly,
				canClose: e.canClose == null ? this.canClose : e.canClose,
				position: e.position || this.position,
				opacity: e.opacity == null ? this.opacity : e.opacity,
				title: e.title == null ? this.title : e.title,
				size : e.size == null ? this.size : e.size
			});
			const {events, tip, tip2Size, opacity, title, position} = this;
			if (e.events)
				$.extend(events, e.events);
			
			if (wnd && !wnd.length)
				delete this.wnd;
			
			if (wnd) {
				this.tazele(e);
				return;
			}
			
			const size = this.size || tip2Size[tip] || tip2Size.text;
			const wndContent = this.wndContent = templatesOrtak.contents(`.klavye.part`).clone(true);
			$.extend(this, {
				tusForm: wndContent.find(`#tusForm`),
				divTuslar: wndContent.find(`#tusForm #tuslar`)
			});
			const wndArgs = {
				isModal: false, showCloseButton: asBool(this.canClose), showCollapseButton: true, autoOpen: false,
				closeButtonAction: 'close', keyboardCloseKey: 'none',
				width: size.width, height: size.height,
				minWidth: 140, minHeight: 37,
			};
			if (position)
				wndArgs.position = position;
			
			wnd = this.wnd = createJQXWindow(
				wndContent,
				title == null ? `Klavye` : title,
				wndArgs);
			
			wnd.addClass(`${partName} ${parentPartName} ${appName} ${rootAppName} part ${tip}`);
			wndContent.addClass(`${partName} ${parentPartName} ${appName} ${rootAppName} content ${tip}`);

			wnd.css('opacity', .1);
			wndContent.css('opacity', .1);
			wnd.on('open', evt => {
				setTimeout(() => {
					const handler = events.open;
					if (handler) {
						const _e = $.extend({}, e, { sender: this, event: evt, wnd: wnd, wndContent: wndContent });
						if ($.isFunction(handler))
							handler.call(this, _e);
						else if (handler.run)
							handler.run(_e);
					}

					wnd.css('opacity', opacity == null ? 1 : opacity);
					wndContent.css('opacity', opacity == null ? 1 : opacity);
				}, 100);
			});
			wnd.on('close', evt => {
				const handler = events.close;
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
			wnd.on('collapse', evt => {
				wnd.addClass(`collapsed`);
				wndContent.addClass(`collapsed`);
			});
			wnd.on('expand', evt => {
				wnd.removeClass(`collapsed`);
				wndContent.removeClass(`collapsed`);
			});
			wnd.on('resize', evt =>
				this.onResize($.extend({}, e, { event: evt })));
			
			const headerExceptCollapseButton = wnd.find(`.jqx-window-header:not(.jqx-window-collapse-button)`);
			headerExceptCollapseButton.on('mousedown', evt => {
				this.wndLastPos = wnd.position();
			});
			headerExceptCollapseButton.on('mouseup', evt => {
				if (evt.button != 0 || evt.target.classList.contains(`jqx-window-collapse-button`))
					return;
				
				const {parentPart, wndLastPos} = this;
				const widget = wnd.jqxWindow('getInstance');
				if (parentPart && parentPart.detayDuzenlePart && parentPart.detayDuzenlePart.wnd) {
					if (!widget.collapsed)
						return;
				}
				
				delete this.wndLastPos;

				const wndCurPos = wnd.position();
				if (wndLastPos && !(wndCurPos.left == wndLastPos.left && wndCurPos.top == wndLastPos.top))
					return;
				
				if (widget.collapsed)
					widget.expand();
				else
					widget.collapse();
			});

			(async () => {
				await this.tazele(e);
				wnd.jqxWindow('open');
			})();
		}

		close(e) {
			e = e || {};
			const {userCloseFlag} = e;
			const {aktifDetay, wndContent, wnd, geriCallback} = this;

			if (wndContent) {
				wndContent.css('opacity', .1);
				if (wndContent.length)
					wndContent.remove();
				delete this.wndContent;
			}
			if (wnd) {
				wnd.css('opacity', .1);
				wnd.jqxWindow('destroy');
				delete this.wnd;
			}

			if (geriCallback) {
				const _e = $.extend({}, e, { sender: this, detay: aktifDetay });
				if ($.isFunction(geriCallback))
					geriCallback.call(this, _e);
				else if (geriCallback.run)
					geriCallback.run(_e);
			}
		}

		async tazele(e) {
			const {app, parentPart, wnd, wndContent, tusForm, divTuslar, tip} = this;
			const _parent = $(document.createDocumentFragment());
			const itemsTemplate = wndContent.find(`#${tip}.items-template`).contents(`div`).clone(true);
			itemsTemplate.appendTo(_parent);
			
			tusForm.addClass(`jqx-hidden`);
			divTuslar.children().remove();
			_parent.appendTo(divTuslar);
			const buttons = tusForm.find(`.item`);
			if (buttons.length)
				buttons.jqxButton({ theme: theme });
			tusForm.removeClass(`jqx-hidden`);

			buttons.on('mousedown', evt => {
				const elm = evt.currentTarget;
				const id = elm.dataset.id;
				this.tusTiklandi($.extend({}, e, {
					event: evt, rec: elm, id: id
				}))
			});

			if (wnd.jqxWindow('isOpen')) {
				this.tazeleSonrasi(e)
			}
			wnd.on('open', evt => {
				setTimeout(
					() => this.tazeleSonrasi(e),
					10);
			});
		}

		tazeleSonrasi(e) {
		}

		async tamamIstendi(e) {
			e = e || {};
			const handler = this.tamamIslemi;
			const _e = $.extend({}, e, { sender: this });
			
			let result = true;
			if (handler) {
				result = false;
				if ($.isFunction(handler))
					result = await handler.call(this, _e);
				else if (handler && handler.run)
					result = await handler.run(e);
			}
			if (result === false)
				return;
			
			this.close(e);
		}

		async tusTiklandi(e) {
			const {parentPart, events} = this;
			const {event, rec, id} = e;

			const handler = events.tusTiklandi;
			if (handler) {
				const _e = $.extend({}, e, { sender: this, event: event, rec: rec, id: id });
				let result = true;
				if ($.isFunction(handler))
					result = await handler.call(this, _e);
				else if (handler && handler.run)
					result = await handler.run(e);
				
				if (result === false)
					return;
			}
		}

		async onResize(e) {
			e = e || {};
			const {wnd, wndContent} = this;
			if (!(wnd && wnd.length))
				return;
			
			wndContent.width(wnd.width() - 3);
			wndContent.height(wnd.height() - wnd.find(`.jqx-window-header`).height() - 8);
			if (!wnd.jqxWindow('title'))
				wnd.height(wnd.height() - 32);
		}
	}
})()
