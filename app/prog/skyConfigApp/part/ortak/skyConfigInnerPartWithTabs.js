(function() {
	window.SkyConfigInnerPartWithTabs = class extends window.SkyConfigInnerPart {
		constructor(e) {
			e = e || {};
			super(e);
		}

		
		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);

			const {app, parentPart} = this;
			const layout = e.layout || this.layout;
			const panel = this.panel = layout.find(`.panel`).jqxTabs({
				theme: theme, position: 'top', height: 'auto',
				width: $(window).width() - parentPart.navBar.width() - 15,
				initTabContent: async tabIndex => {
					const panel = this.panel = this.panel || layout.find(`.panel`);
					const tabPage = panel.find(`.jqx-tabs-content > .jqx-tabs-content-element:eq(${tabIndex})`);
					const tabID = tabPage.prop('id');
					const _e = $.extend({}, e || {}, { tabIndex: tabIndex, tabPage: tabPage, tabID: tabID });
					await this.initTabContent(_e);

					tabPage.find(`.gelismis`)[app.gelismisModmu ? 'removeClass' : 'addClass']('jqx-hidden');
					this.tazele(_e);
				}
			});
		}

		async activatePart(e) {
			await super.activatePart(e);
			setTimeout(() => this.app.gelismisModFlagDegistiBasit(), 100);
		}

		activatePart_tazele(e) {
			const {innerPart_activatedFlag} = this;
			if (innerPart_activatedFlag)
				this.tazele(e);
		}

		initTabContent(e) {
		}

		async onResize(e) {
			await super.onResize(e);

			const {panel, parentPart, layout} = this;
			try {
				panel.jqxTabs({
					width: $(window).width() - parentPart.navBar.width() - 10,
					height: $(window).height() - 50
				});
			}
			catch (ex) { }
		}
	}
})()
