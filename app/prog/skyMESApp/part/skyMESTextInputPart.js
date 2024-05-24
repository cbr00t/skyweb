(function() {
	window.SkyMESTextInputPart = class extends window.SkyMESWindowPart {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				noResizeEventsFlag: true,
				baslikText: e.baslikText,
				value: e.value
			});
		}

		static get partName() { return 'textInput' }
		get autoHeight_uiSelector() { return `#textInputParent` }
		get autoFocus_uiSelector() { return `#textInput` }
		get isNumKlavyeTextOnly() { return false }
		
		/*get autoCompleteSelector2ValueGetter() {
			return $.extend(super.autoCompleteSelector2ValueGetter || {}, {
				value: e => this.value
			})
		}*/

		async open(e) {
			await super.open(e);

			const {app} = this;
			setTimeout(() => this.noResizeEventsFlag = false, 300);
		}
		
		async tazeleDevam(e) {
			await super.tazeleDevam(e);

			const {wndContent, baslikText} = this;
			if (baslikText) {
				wndContent.find(`#baslikText`).html(baslikText);
				wndContent.find(`#baslikTextParent`).removeClass(`jqx-hidden`);
			}
			else {
				wndContent.find(`#baslikTextParent`).addClass(`jqx-hidden`);
			}
			
			const textInput = this.textInput = this.initTextInput({
				htmlSelector: `#textInput`, instSelector: 'value',
				placeHolder: e.placeHolder, value: this.value,
				args: { /*minLength: 2,*/ }
			});
			const textInputParent = this.textInputParent = textInput.parent();
			textInput.on('keyup', evt => {
				const key = (evt.key || '').toLowerCase();
				if (key == 'enter' || key == 'linefeed')
					this.tamamIstendi($.extend({}, e, { event: evt }));
			});
		}

		tazeleSonrasi(e) {
			super.tazeleSonrasi(e);
		}

		close_araIslemler(e) {
			super.close_araIslemler(e);
			
			delete this.textInput;
		}

		setValues(e) {
			super.setValues(e);

			$.extend(this, {
				baslikText: e.baslikText == null ? this.baslikText : e.baslikText,
				value: e.value == null ? this.value : e.value
			});
		}

		wndArgsDuzenle(e) {
			super.wndArgsDuzenle(e);

			$.extend(e.args, {
				width: 450, height: 120,
				minWidth: 180, minHeight: 110
			});
		}

		initKlavyePart_argsDuzenle(e) {
			super.initKlavyePart_argsDuzenle(e);

			const {klavyeAcilirmi, numKlavyeAcilirmi, wnd} = this;
			if (klavyeAcilirmi || numKlavyeAcilirmi) {
				const pos = wnd.offset();
				const width = wnd.width();
				const height = wnd.height();
				$.extend(e.args, {
					title: '',
					textOnly: this.isNumKlavyeTextOnly,
					position: {
						left: pos.left,
						top: pos.top + wnd.height()
					}
				});
				if (numKlavyeAcilirmi) {
					e.args.size = {
						width: Math.min(width, $(window).width() - 20),
						height: Math.min(230, $(window).height() - (height * 1.1) - 10)
					};
				}
			}
		}
		
		tamamIstendi_argsDuzenle(e) {
			super.tamamIstendi_argsDuzenle(e);

			$.extend(e.args, {
				value: this.value
			});
		}

		async wnd_onResize(e) {
			await super.wnd_onResize(e);

			if (this.noResizeEventsFlag)
				return;

			this.noResizeEventsFlag = true;
			await this.setUniqueTimeout({
				key: 'noResizeEventsFlagReset',
				delayMS: 500,
				block: e =>
					this.noResizeEventsFlag = false
			});
			
			const {app, wnd, wndContent, autoFocus_uiSelector} = this;
			const {klavyePart, numKlavyePart} = app;
			if (wnd.jqxWindow('collapsed')) {
				if ((klavyePart || numKlavyePart) && (klavyePart || numKlavyePart).wnd) {
					if (!(klavyePart || numKlavyePart).wnd.hasClass(`jqx-hidden`))
						(klavyePart || numKlavyePart).wnd.addClass(`jqx-hidden`);
				}
			}
			else {
				if ((klavyePart || numKlavyePart).wnd.hasClass(`jqx-hidden`)) {
					(klavyePart || numKlavyePart).wnd.removeClass(`jqx-hidden`);
				}
				else {
					await app.setUniqueTimeout({
						key: 'initKlavyePart',
						delayMS: 100,
						block: async () => {
							const {klavyePart, numKlavyePart} = app;
							if ((klavyePart || numKlavyePart) && (klavyePart || numKlavyePart).wnd) {
								if (numKlavyePart && numKlavyePart.wnd) {
									await app.closeNumKlavyePart();
									await this.initNumKlavyePart();
								}
								else {
									await app.closeKlavyePart();
									await this.initKlavyePart();
								}
		
								await app.setUniqueTimeout({
									key: 'wnd_onResize_autoFocus',
									delayMS: 100,
									block: () => {
										let elm = autoFocus_uiSelector ? wndContent.find(autoFocus_uiSelector) : null;
										if (elm && elm.length) {
											elm = autoFocus_uiSelector ? wndContent.find(autoFocus_uiSelector) : null;
											if (elm && elm.length)
												elm.focus();
										}
									}
								});
							}
						}
					});
				}
			}
		}
	}
})()
