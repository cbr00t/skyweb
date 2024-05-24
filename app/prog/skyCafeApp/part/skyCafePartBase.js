(function() {
	window.SkyCafePartBase = class extends window.SubPart {
		constructor(e) {
			e = e || {};
			super(e);

			this.isComponent = true;

			if (!((this.layout && this.layout.length) || this.template))
				this.layout = () => this.app.layout.find(`#${this.partName}.part`);
		}

		static get deferDisplay() { return false }
		static get adimTextGosterilirmi() { return true }


		buildAjaxArgs(e) {
			return this.app.buildAjaxArgs(e)
		}

		async activatePart(e) {
			e = e || {};
			const {app} = this;
			const {navPart} = app;
			const navPartLayout = navPart && navPart.layout && navPart.layout.length ? navPart.layout : null;
			navPartLayout.css('opacity', .03);
			
			await super.activatePart(e);

			if (!this.isComponent)
				app.activePart = this;
			
			const {layout} = this;
			if (layout && layout.length)
				layout.removeClass(`jqx-hidden basic-hidden`);
			
			if (navPartLayout) {
				this.setUniqueTimeout({
					key: 'navPartSetVisible1',
					delayMS: 80,
					// args: e,
					block: () =>
						navPartLayout.css('opacity', .08)
				});
				this.setUniqueTimeout({
					key: 'navPartSetVisible2',
					delayMS: 150,
					// args: e,
					block: () =>
						navPartLayout.css('opacity', 1)
				});
				/*if (!app.uniqueTimers.wsAktifBilgileriYukleIslemi) {
					this.setUniqueTimeout({
						key: 'wsAktifBilgileriYukleIslemi',
						delayMS: 1000,
						block: () =>
							app.wsAktifBilgileriYukleIslemi()
					})
				}*/
			}

			if (navPart && this != navPart)
				setTimeout(() => navPart.tazele(), 10);
		}

		async deactivatePart(e) {
			e = e || {};
			await super.deactivatePart(e);

			const {app, parentPart} = this;
			if (!this.isComponent) {
				app.hideNotifications();
				app.activePart = parentPart == app ? null : parentPart;
			}
			
			/*const {navPart} = app;
			if (this != navPart)
				navPart.tazele();*/
			
			const {layout} = this;
			if (layout && layout.length)
				layout.addClass(`jqx-hidden`);
		}

		/*geriIstendi(e) {
			this.app.navMenuTiklandi($.extend({}, e, { id: 'giris' }))
		}*/

		async getNavMenuSource(e) {
			return await this.app.getNavMenuSource(e);
		}
		
		navMenuTiklandi(e) {
			/*const {sender, navMenuItems} = e;
			const evt = e.event;
			const target = evt ? $(evt.args || evt.currentTarget) : (id ? navMenuItems.filter(`li#${id}`) : null);
			const id = e.id || (target ? target.prop('id') : null);*/
			
			this.app.navMenuTiklandi(e);
		}

		async onResize(e) {
			await super.onResize(e);
		}
	}
})()
