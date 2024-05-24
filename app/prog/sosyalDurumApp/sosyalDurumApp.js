(function() {
	window.SosyalDurumApp = class extends window.Prog {
		constructor(e) {
			super(e);

			/*$.extend(this, {
			});*/

			// this.updateWSUrlBase();

			const extLogin = this.extensions.login;
			$.extend(extLogin.options, {
				isLoginRequired: false,
				/*loginTypes: [
					{ kod: 'kasiyerLogin', aciklama: '<span style="color: darkgreen;">Kasiyer</span>' }
				]*/
			});

			const c = $.jqx.cookie;
			$.extend(this, {
				parts: {},
				kisiSayac: c.cookie('kisiSayac') || null
			});
		}

		static get appName() { return 'sosyalDurumApp' }
		get defaultRootLayoutName() { return this.appName }
		get appText() { return 'Sosyal Durum' }


		buildAjaxArgs(e) {
			e = e || {};
			return $.extend(super.buildAjaxArgs(e) || {}, {
				appUniqueId: this.appUniqueId || ''
			});
		}

		updateWSUrlBase(e) {
			this._wsURLBase = updateWSUrlBaseBasit($.extend({}, sky.config, { path: `ws/sosyalDurum` }, getArgsForRandomPort({ port: sky.config.port }), e));
		}

		async ilkIslemler(e) {
			try { Utils.disableHistoryBack() } catch (ex) { }
			try { requestFullScreen() } catch (ex) { }

			await super.ilkIslemler(e);
		}

		async run(e) {
			try { await super.run(e) }
			finally { setTimeout(() => ((window.savedProcs || {}).hideProgress || hideProgress)(), 1000) }
		}

		async afterRun(e) {
			await super.afterRun(e);
		}

		async preInitLayout(e) {
			e = e || {};
			
			showProgress(null, null, 1);
			let promiseTanimlar = this.promiseTanimlar = this.getWSTanimlar(e);
			await super.preInitLayout(e);
			
			await this.preInitUI(e);

			setTimeout(() => {
				((window.savedProcs || {}).hideProgress || hideProgress)();
				this.knobProgressHideWithReset({ delayMS: 10 });
			}, 500);

			promiseTanimlar.then(result =>
				this.tanimlarYuklendi({ result: result }));
			// const tanimlar = this.tanimlar = await promise;
			// await this.tanimlarYuklendi(tanimlar);

		}

		postInitLayout(e) {
			e = e || {};
			super.postInitLayout(e);

			this.postInitUI(e);
		}

		async destroyLayout(e) {
			e = e || {};
			const layout = e.layout || this.layout;
			const islemTuslari = this.islemTuslari;
			if (islemTuslari && islemTuslari.length) {
				islemTuslari
					.removeClass(`prog ${this.class.rootAppName}`)
					.detach()
					.appendTo(this.layout);
			}
			
			await super.destroyLayout(e);
			// await this.cleanUpWidgets(e);
		}
		
		async activatePart(e) {
			await this.cleanUpWidgets(e);

			await super.activatePart(e);
		}

		preInitUI(e) {
			const layout = e.layout || this.layout;
			// $('body').css('overflow-y', 'auto');
			$(document).on('contextmenu', evt =>
				evt.preventDefault());

			$.extend(this, {
				templates: {
					// grid: layout.find(`#grid.part`)
					// test: layout.find('#test.part')
				},
				btnLogout: layout.find(`#btnLogout`),
				btnToggleResponsivePanel: layout.find(`#btnToggleResponsivePanel`),
				nav: layout.find(`#nav`),
				subHeader: layout.find(`#header`),
				kisiBilgiParent: layout.find(`#header #kisiBilgiParent`),
				innerContent: layout.find(`#innerContent`)
			});

			const {header, nav, subHeader, innerContent} = this;
			// innerContent.height($(window).height() - header.offset().top - header.height() - subHeader.offset().top - subHeader.height() - 45);
			$.extend(this, {
				navMenu: nav.find(`#menu`),
				navIslemTuslari: nav.find(`#islemTuslari-ek`)
			});

			const islemTuslari = this.islemTuslari = layout.find('.islemTuslari');
			islemTuslari
				.addClass(`prog ${this.appName}`)
				.detach()
				.appendTo(this.header);
			
			this.btnLogout
				.jqxButton({ theme: theme })
				.jqxTooltip({ theme: theme, trigger: `hover`, content: `Oturum kapat` })
				.on('click', evt => this.logoutIstendi());
			this.btnToggleResponsivePanel
				.jqxButton({ theme: theme })
				.jqxTooltip({ theme: theme, trigger: `hover`, content: `Küçült/Büyüt` });
			
			let {navMenu} = this;
			navMenu
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
			const navMenuItems = this.navMenuItems = navMenu.find('ul > li');
			navMenuItems.addClass(`box`);
			
			nav.jqxResponsivePanel({
				theme: theme, animationType: animationType,
				toggleButtonSize: 40, collapseBreakpoint: 760,
                toggleButton: layout.find(`#btnToggleResponsivePanel`),
                autoClose: false, animationShowDelay: 'slow', animationHideDelay: 'slow'
			});
			nav.on('open', evt => this.onResponsivePanelChanged($.extend({}, e, { event: evt, open: true })));
			nav.on('close', evt => this.onResponsivePanelChanged($.extend({}, e, { event: evt, open: false })));

			if (navMenuItems.length)
				navMenuItems.eq(0).click();
		}

		postInitUI(e) {
			const layout = e.layout || this.layout;
			this.destroyWindows();
		}

		async getWSTanimlar(e) {
			let tanimlar;
			try {
				lastAjaxObj = $.get({
					cache: true,
					url: `${this.wsURLBase}tanimlar`,
					data: this.buildAjaxArgs({ kisiSayac: this.kisiSayac || '' })
				});
				tanimlar = (await lastAjaxObj) || {}
			}
			catch (ex) {
				((window.savedProcs || {}).hideProgress || hideProgress)();
				hideProgress();
				defFailBlock(ex);
				throw ex;
			}

			return tanimlar;
		}

		tanimlarYuklendi(e) {
			const tanimlar = this.tanimlar = e.result;
			delete this.promiseTanimlar;

			this.kisiBilgiTazele(e);

			setTimeout(() => {
				((window.savedProcs || {}).hideProgress || hideProgress)();
				this.knobProgressHideWithReset({ delayMS: 10 });
			}, 500);
		}

		kisiBilgiTazele(e) {
			const {tanimlar, kisiBilgiParent} = this;
			if (tanimlar) {
				const {kisiRec} = tanimlar;
				if (kisiRec) {
					kisiBilgiParent.find(`#adiSoyadi`).html(kisiRec.adiSoyadi || kisiRec.adisoyadi || kisiRec.isim || '');
					kisiBilgiParent.find(`#tcKimlikNo`).html(kisiRec.tcKimlikNo || kisiRec.tckimlikno || '');
					kisiBilgiParent.removeClass(`jqx-hidden`);
				}
			}
		}
		
		onResponsivePanelChanged(e) {
			e = e || {};
			$(window).trigger('resize');
		}

		navMenuTiklandi(e) {
			this.showContent(e);
		}

		async showContent(e) {
			const evt = e.event;
			const {innerContent, navMenuItems} = this;
			let {id, part, partClass} = e;
			if (!id && partClass)
				id = partClass.partName;
			part = part || this.parts[id];
			if (!id && part)
				id = e.id = part.partName;
			
			const target = evt ? $(evt.args || evt.currentTarget) : (id ? navMenuItems.filter(`li#${id}`) : null);
			navMenuItems.parents(`ul`).find(`li`).removeClass(`selected`);
			if (target && target.length) {
				id = e.id = id || target[0].id;
				target.addClass(`selected`);
			}			
			if (!partClass) {
				const className = target && target.length ? target[0].dataset.partclass : null;
				partClass = e.partClass = e.partClass || (className ? window[className] : null);
			}
			
			this.nav.jqxResponsivePanel('close');

			part = part || this.parts[id];
			if (part && part == this.activePart)
				return;
			
			partClass = e.partClass = partClass || Part;
			part = e.part = e.part || this.parts[id] || (() => {
				return new partClass({
					initFlag: false, isComponent: true, parentPart: this,
					content: innerContent, layout: innerContent.find(`#${id}.part`)
				})
			})();
			if (id && !part.partName)
				part.id = part.id || id;
			id = e.id = part.partName;
			this.parts[id] = part;
			
			let {initFlag} = part;
			let subLayout = e.subLayout = part.layout;
			if ($.isFunction(subLayout))
				subLayout = e.subLayout = part.layout = subLayout.call(this, e);
			
			this.hideContents(e);
			
			const {activePart} = this;
			if (activePart)
				await activePart.deactivatePart();
			if (!initFlag) {
				subLayout.addClass(`basic-hidden`);
			}
			subLayout.removeClass(`jqx-hidden`);
			if (initFlag) {
				await part.activatePart();
			}
			else {
				await part.run();
				// subLayout.removeClass(`basic-hidden`);
			}

			this.activePart = part;
		}

		hideContents() {
			this.innerContent.children(`.part`)
				.addClass(`jqx-hidden`);
		}

		async onResize(e) {
			await super.onResize(e);

			const {innerContent, header, subHeader} = this;
			innerContent.height($(window).height() - innerContent.offset().top - 15);
		}
	}
})()
