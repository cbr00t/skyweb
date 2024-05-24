(function() {
	window.CETExpandableIslemTuslariPart = class extends window.Part {
		constructor(e) {
			e = e || {};
			super(e);

			if (!(this.layout || this.template))
				this.template = this.app.templates.cetExpandableIslemTuslari;
			
			$.extend(this, {
				content: e.content || (this.parentPart ? this.parentPart.layout : this.content),
				position: e.position,
				defaultPosition: { x: `left`, y: `bottom` },
				items: e.items,
				templateItems: e.templateItems,
				onItemClicked: e.onItemClicked,
				mode: e.mode || '',
				hasPopup: false,
				isPopupOpen: false
			});
		}

		static get partName() { return 'cetExpandableIslemTuslari' }


		preInitLayout(e) {
			e = e || {};
			super.preInitLayout(e);

			const layout = e.layout || this.layout;
			$.extend(this, {
				menu: layout.find(`#menu`),
				popupButton: layout.find(`#popupButton`),
				popupMenu: layout.find(`#popupMenu`)
			});
		}

		postInitLayout(e) {
			super.postInitLayout(e);

			this.initMenu(e);
		}

		postInitLayoutIlk(e) {
			super.postInitLayoutIlk(e);

			const parentPart = this.parentPart;
			if (parentPart) {
				const liste = parentPart.expandableIslemTuslariParts = parentPart.expandableIslemTuslariParts || [];
				liste.push(this);
			}
		}

		initMenu(e) {
			e = e || {};
			const layout = e.layout || this.layout;
			const {menu, popupButton, popupMenu} = this;
			const _e = $.extend({}, e, { sender: this, menu: menu, popupButton: popupButton, popupMenu: popupMenu });

			let {items} = this;
			if ($.isFunction(items))
				items = items.call(this, _e);
			
			if (!(items && items.length)) {
				let {templateItems} = this;
				if ($.isFunction(templateItems))
					templateItems = templateItems.call(this, _e);
				
				if (templateItems && templateItems.length)
					items = templateItems.contents(`*`).clone(true);
			}
			
			const cssClassNameItem = `item`
			if (items && items.length) {
				const cssClassNames = [cssClassNameItem];
				cssClassNames.forEach(name => {
					if (!items.hasClass(name))
						items.addClass(name)
				});

				const cssClassNameIcon = `icon`;
				$.each(items, (_, item) => {
					item = $(item);
					let divIcon = item.find(`.${cssClassNameIcon}`);
					if (!(divIcon && divIcon.length))
						$(`<div class="${cssClassNameIcon}"/>`).prependTo(item);
				});

				[menu, popupMenu].forEach(_menu =>
					_menu.children().remove());
				
				const {mode} = this;
				const hasPopup = mode == 'popup'
									? true
									: mode == 'menu'
										? false
										: items.length > 1;
				this.hasPopup = hasPopup;
				
				const parent = this.parentMenu = hasPopup ? popupMenu : menu;
				const _parent = items.parent();
				if (_parent && _parent.length)
					items.detach();
				items.appendTo(parent);

				items.off(`click`);
				items.on(`click`, evt => {
					let target = $(evt.target);
					if (target && !target.hasClass(cssClassNameItem))
						target = target.parents(`.${cssClassNameItem}`).eq(0);
					
					if (!target)
						return;
					
					const id = target.prop('id');
					const index = target.index();
					this.itemClicked($.extend({}, _e, { event: evt, menu: this.parentMenu, target: target, id: id, index: index, html: target.html() }));
				});
				this._items = items;

				if (this.position !== false) {
					const positionSelectors = this.position ? asSet(this.position.split(` `).map(x => x.trim().toLowerCase())) : {};
					const validPositions = { x: false, y: false };
					[layout].forEach(elm => {
						[`top`, `bottom`, `left`, `right`].forEach(selector => {
							const flag = !!positionSelectors[selector];
							if (flag && (selector == `left` || selector == `right`))
								validPositions.x = true;
							if (flag && (selector == `top` || selector == `bottom`))
								validPositions.y = true;
							elm[flag ? 'addClass' : 'removeClass'](selector);
						});
						const {defaultPosition} = this;
						['x', 'y'].forEach(key => {
							if (!validPositions[key])
								elm.addClass(defaultPosition[key]);
						});
					});
					popupButton.detach();
					popupButton[positionSelectors.top ? 'insertBefore' : 'insertAfter'](popupMenu);
				}

				popupButton.off(`click`);
				if (hasPopup) {
					popupButton.removeClass(`jqx-hidden`);
					menu.addClass(`jqx-hidden`);

					popupButton.jqxButton({ theme: theme })
						.on(`click`, evt =>
							this.popupButtonClicked($.extend({}, _e, { event: evt })));
				}
				else {
					popupButton.addClass(`jqx-hidden`);
					menu.removeClass(`jqx-hidden`);
				}
			}
		}

		itemClicked(e) {
			e = e || {};
			if (e && typeof e != 'object') {
				const parent = this.parentMenu;
				let target = parent.find(e);
				if (!(target && target.length) && !(e[0] == '#' || e[0] == '.')) {
					if (!(target && target.length))
						target = parent.find(`#${e}`);
					if (!(target && target.length))
						target = parent.find(`.${e}`);
				}
				
				e = { menu: parent, target: target, id: target.prop('id'), index: target.index(), html: target.html() };
			}

			if (!(e.target && e.target.length))
				return;

			const handler = this.onItemClicked;
			if ($.isFunction(handler))
				handler.call(this, e);
			
			const isPopupOpen = this.isPopupOpen = !this.popupMenu.hasClass(`jqx-hidden`);
			if (isPopupOpen)
				this.popupButtonClicked(e);
			
			return e;
		}

		popupButtonClicked(e) {
			const {popupMenu, popupButton} = this;
			popupMenu.toggleClass(`jqx-hidden`);
			const isPopupOpen = this.isPopupOpen = !popupMenu.hasClass(`jqx-hidden`);
			popupButton[isPopupOpen ? 'addClass' : 'removeClass'](`popup-open`);
			if (isPopupOpen)
				popupMenu.focus();
			else
				popupButton.focus();
		}
	}
})();
