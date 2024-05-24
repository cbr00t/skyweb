(function() {
	window.SkyCafeNavPart = class extends window.SkyCafePartBase {
		constructor(e) {
			e = e || {};
			super(e);

			this.isComponent = true;
		}

		static get partName() { return 'navPart' }


		async preInitLayout(e) {
			e = e || {};
			await super.preInitLayout(e);

			const layout = e.layout || this.layout;
			const widgetPart = this.widgetPart = layout;
			widgetPart
				.jqxMenu({ theme: theme })
				.off('itemclick')
				.on('itemclick', evt =>
					this.navMenuTiklandi($.extend({}, e, { id: evt.args.id, event: evt })));
				/*.off('keyup')
				.on('keyup', evt => {
					const key = (evt.key || '').toLowerCase();
					if (key == 'enter' || key == 'linefeed')
						this.baslatIstendi(e);
				});*/
			this.widget = widgetPart.jqxMenu('getInstance');
			await this.tazele(e);
			Utils.makeScrollable(widgetPart);
		}

		postInitLayout(e) {
			e = e || {};
			super.postInitLayout(e);
		}

		async destroyPart(e) {
			const {widgetPart} = this;
			if (widgetPart)
				widgetPart.jqxMenu('destroy');
			delete this.widget;
			delete this.widgetPart;

			return await super.destroyPart(e);
		}

		async tazele(e) {
			const {widgetPart, layout} = this;
			const source = await this.getNavMenuSource(e);
			widgetPart.jqxMenu('source', source);

			const navMenuItems = this.navMenuItems = widgetPart.find('ul > li');
			if (navMenuItems.length) {
				layout.parent().removeClass(`jqx-hidden`);
				navMenuItems.addClass(`box`);
			}
			else {
				layout.parent().addClass(`jqx-hidden`);
			}
		}

		selectItem(e) {
			const {navMenuItems} = this;
			if (!navMenuItems)
				return null;
			
			const {id, index, item} = e;
			let li;
			if (item) {
				(li = item).click();
			}
			else if (id) {
				li = navMenuItems.filter(`#${id}`);
				if (li && !li.length)
					li = null;
				if (li)
					li.click();
			}
			else if (index != null) {
				li = navMenuItems.eq(index);
				if (li && !li.length)
					li = null;
				if (li)
					li.click();
			}

			return li;
		}

		async getNavMenuSource(e) {
			const {activePart} = this.app;
			if (!activePart || activePart == this)
				return await super.getNavMenuSource(e);
			
			return await activePart.getNavMenuSource(e);
		}

		navMenuTiklandi(e) {
			const {app, navMenuItems} = this;
			e = $.extend({}, e, { sender: this, navMenuItems: navMenuItems });

			const evt = e.event;
			const target = evt ? $(evt.args || evt.currentTarget) : (id ? navMenuItems.filter(`li#${id}`) : null);
			const id = e.id = e.id || (target ? target.prop('id') : null);
			if (target) {
				const {dataset} = target[0];
				const keys = ['partClass', 'part'];
				for (const i in keys) {
					const key = keys[i];
					const value = dataset[key.toLowerCase()];
					if (value != null)
						e[key] = value;
				}
				setButonEnabled(target, false);
			}
			
			(app.activePart || app).navMenuTiklandi(e);
			if (target)
				setTimeout(() => setButonEnabled(target, true), 2500);
		}

		async onResize(e) {
			await super.onResize(e);

			const {widgetPart} = this;
			widgetPart.height($(window).height() - widgetPart.offset().top - 10);
		}
	}
})()
