(function() {
	window.SkyTicMenuApp = class extends window.Prog {
		static get dateLibDesteklenirmi() { return false }
		static get appName() { return 'skyTicMenuApp' }
		get appText() { return `Sky Ticari Menü` }
		get defaultLayoutName() { return this.appName }


		constructor(e) {
			super(e);
			e = e || {};

			const extLogin = this.extensions.login;
			extLogin.options.isLoginRequired = false;
		}

		updateWSUrlBase(e) {
			const port = $.isEmptyObject(window.wsPorts) ? SkyConfigParam.DefaultWSPort : undefined;
			return super.updateWSUrlBase({ port: port, path: `ws/genel/` });
		}

		async ilkIslemler(e) {
			this.destroyWindows();
			if (!this.noFullScreenFlag) {
				try { requestFullScreen() }
				catch (ex) { }
			}

			await this.extensions.login.loginIslemi(e);
			await super.ilkIslemler(e);
		}

		async run(e) {
			e = e || {};
			
			await super.run(e);
		}

		async afterRun(e) {
			e = e || {};
			await super.afterRun(e);

			let {activePart} = this;
			if (!activePart || activePart == this)
				await this.destroyWindows();
			
			if (!this.noFullScreenFlag) {
				try { requestFullScreen() }
				catch (ex) { }
			}

			const sessionInfo = sky.config.sessionInfo || {};
			const {user, userDesc} = sessionInfo;
			const {btnUserInfo} = this;
			if (sessionInfo.user) {
				btnUserInfo.html(`<b>${user}</b>` + (userDesc ? `<span>-</span><span>${userDesc}</span>` : ''));
				btnUserInfo.removeClass('jqx-hidden basic-hidden');
			}
			/*else
				btnUserInfo.addClass('jqx-hidden');*/

			hideProgress();
			((window.savedProcs || {}).hideProgress || hideProgress)();
			const timeouts = [500, 1000, 2000];
			for (const i in timeouts) {
				setTimeout(() => {
					hideProgress();
					((window.savedProcs || {}).hideProgress || hideProgress)();
				}, timeouts[i])
			}

			this.tazele(e);
		}

		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);

			const layout = e.layout || this.layout;
			this.templatesOrtak = layout;
			
			const btnTazele = layout.find(`#btnTazele`).jqxButton({ theme: theme });
			btnTazele.on('click', evt =>
				this.tazele({ event: evt }));
			const btnToggleFullScreen = layout.find(`#btnToggleFullScreen`).jqxButton({ theme: theme });
			btnToggleFullScreen.on('click', evt =>
				this.toggleFullScreen({ event: evt }));

			const userInfo_popup = this.userInfo_popup = layout.find(`#userInfo_popup`).jqxMenu({
				theme: theme, width: 300,
				mode: 'popup', autoOpenPopup: false
			});
			userInfo_popup.on('itemclick', evt => {
				const {id} = evt.target;
				switch (id) {
					case 'logout':
						return this.logoutIstendi({ event: evt });
				}
			});
			const btnUserInfo = this.btnUserInfo = layout.find(`#userInfo`).jqxButton({ theme: theme });
			btnUserInfo.on('click', evt => {
				const pos = {
					x: btnUserInfo.position().left + btnUserInfo.width() - userInfo_popup.jqxMenu('width') + 7,
					y: btnUserInfo.position().top + btnUserInfo.height() + 10
				};
				userInfo_popup.jqxMenu('open', pos.x, pos.y);
			});
			/*const btnLogout = layout.find(`#btnLogout`).jqxButton({ theme: theme });
			btnLogout.on('click', evt =>
				this.logoutIstendi({ event: evt }));*/

			this.divHeader = layout.find(`#header`);
			const menuContent = this.menuContent = layout.find(`#menu_content`);
			Utils.makeScrollable(menuContent);
		}

		async tazele(e) {
			e = e || {};

			const {menuContent} = this;
			const buttons = menuContent.find(`.items .item button`);
			buttons.jqxButton({ theme: theme });
			buttons.on('click', async evt => {
				const item = $(evt.currentTarget);
				const itemID = item.prop('id');
				const group = item.parents(`.group`);
				const groupID = group && group.length ? group.prop('id') : jqxMenu;
				setButonEnabled(item, false);
				try { await this.butonTiklandi({ event: evt, item: item, itemID: id, group: group, groupID: groupID }) }
				finally { setTimeout(item => setButonEnabled(item, true), 1000, item) }
			})
		}

		wsTicMenu(e) {
			return ajaxPost({ timeout: 8000, url: this.getWSUrl({ api: 'ticMenu' }) })
		}

		async butonTiklandi(e) {
			const {itemID} = e;
		}

		async onResize(e) {
			await super.onResize(e);

			const {menuContent, divHeader} = this;
			if (menuContent && menuContent.length)
				menuContent.height(this.content.height() - menuContent.offset().top - 80);
		}
	}
})();
