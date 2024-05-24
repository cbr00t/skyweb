(function() {
	window.SkyConfigSkyBulutYedeklemeUserListPart = class extends window.SkyConfigWindowPart {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				baslikText: e.baslikText,
				rec: e.rec
			});
		}

		static get partName() { return 'skyConfigSkyBulutYedeklemeUserListPart' }
		get defaultTitle() { return 'Sky Bulut Yedekleme - Kullanıcılar' }
		get defaultIsModal() { return true }
		get autoFocus_uiSelector() { return `#liste` }
		
		async tazeleDevam(e) {
			await super.tazeleDevam(e);

			const {app, partName, wndContent} = this;
			const usersPart = this.usersPart = new SkyConfigUsersPart({
				parentPart: this,
				template: app.layout.find(`template#${partName}.part`),
				wsConfigParentSelector: 'skyBulutYedekleme',
				// wsURLBase: app.wsURLBase.replace('/yonetim', '/skyBulutYedekleme'),
				duzenlemeEkraniTitle: `Sky Bulut Yedekleme - Kullanıcı Düzenle`,
				yetkiKisitSet: asSet(['skyBulutYedekleme']),
				ozelTip: 'skyBulutYedekleme'
			});
			await usersPart.tazele();
			await usersPart.initTabContent_users($.extend({}, e, {
				tabPage: wndContent,
				baslikText: e.baslikText,
				rec: e.rec
			}));
		}

		close_araIslemler(e) {
			const {usersPart} = this;
			if (usersPart && !usersPart.isDestroyed)
				usersPart.destroyPart();
			this.usersPart = null;
			
			super.close_araIslemler(e);
		}

		setValues(e) {
			super.setValues(e);

			$.extend(this, {
				baslikText: e.baslikText == null ? this.baslikText : e.baslikText,
				rec: e.rec
			});
		}

		wndArgsDuzenle(e) {
			super.wndArgsDuzenle(e);

			const minWidth = 700;
			const minHeight = 600;
			$.extend(e.args, {
				width: Math.max(Math.min(800, $(window).width() - 50), minWidth),
				height: Math.max(Math.min(700, $(window).height() - 50), minHeight),
				minWidth: minWidth, minHeight: minHeight
			});
		}
	}
})()
