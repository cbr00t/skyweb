(function() {
	window.SkyCafeSatisGridPart = class extends window.SkyCafePartBase {
		constructor(e) {
			e = e || {};
			super(e);
		}

		static get noResizeEventOnInputs() { return false }
		static get partName() { return 'satisGrid' }
		static get isComponent() { return true }

		preInitLayout(e) {
			e = e || {};
			super.preInitLayout(e);

			const {app} = this;
			const templatesOrtak = app.templatesOrtak;
			const layout = e.layout || this.layout;
			$.extend(this, {
				templateItem: templatesOrtak.contents(`.satisGrid.item`),
				templateItemOzellik: templatesOrtak.contents(`.item-ozellik`),
				toplamParent: layout.find(`#toplamParent`),
				divToplam: layout.find(`#toplamParent #toplam`),
				hizliBulForm: layout.find(`#hizliBulForm`),
				txtHizliBul: layout.find(`#txtHizliBul`),
				listeParent: layout.find(`#listeParent`),
				divListe: layout.find(`#listeParent #liste`)
			});
			
			this.itemListPart = new SkyCafeItemList({
				content: layout,
				toplamParent: this.toplamParent, divToplam: this.divToplam,
				hizliBulForm: this.hizliBulForm, txtHizliBul: this.txtHizliBul,
				itemFormParent: this.listeParent, itemForm: this.divListe,
				templateItem: this.templateItem,
				idSelector: 'id', aciklamaSelector: 'stokAdi',
				dataSource: e =>
					this.getDataSource(e),
				defaultItemDuzenleyici: e =>
					this.listeRenderItem(e),
				toplamGetter: e =>
					e.rec.netBedel,
				toplamValueDuzenleyici: e =>
					bedel(e.value),
				toplamSelector: 'netBedel',
				toplamRenderer: e =>
					`${bedelStr(e.value)} TL`,
				eventSelector: e =>
					this.liste_onItemClick(e)
			});

			const {txtHizliBul} = this;
			//txtHizliBul
			//	.jqxInput({ theme: theme, height: false, maxLength: 40 });
			// $(txtHizliBul.jqxInput('input'))
			txtHizliBul
				.on('focus', evt => {
					evt.target.select();
					
					this.setUniqueTimeout({
						key: 'hizliBul_onFocus',
						delayMS: 500,
						args: $.extend({}, e, { event: evt }),
						block: async e => {
							const {app} = this;
							const {klavyePart} = app;
							
							if (!(klavyePart && klavyePart.wnd)) {
								const _e = {
									/*width: $(window).width() < 680 ? 650 : $(window).width(),
									height: 250,*/
									position: `bottom`
								};
								await this.app.initKlavyePart(_e);
								setTimeout(() => evt.currentTarget.focus(), 150);
							}
							else {
								setTimeout(() => evt.currentTarget.focus(), 0);
							}

						}
					});
				})
				.on('keyup', evt => {
					const key = (evt.key || '').toLowerCase();
					if (key == 'enter' || key == 'linefeed') {
						this.tazele($.extend({}, e, { event: evt }));
					}
					else {
						this.setUniqueTimeout({
							key: 'hizliBul_onChange',
							delayMS: 500,
							args: $.extend({}, e, { event: evt }),
							block: e =>
								this.tazele(e)
						})
					}
				});
		}

		postInitLayout(e) {
			e = e || {};
			super.postInitLayout(e);
		}

		async destroyPart(e) {
			const {itemListPart} = this;
			if (itemListPart)
				itemListPart.destroyPart(e);

			return await super.destroyPart(e);
		}

		async activatePart(e) {
			e = e || {};
			const {app, layout} = this;
			layout.css(`opacity`, .2);

			await super.activatePart(e);

			this.tazele(e);
		}

		async deactivatePart(e) {
			await super.deactivatePart(e);
		}

		async tazele(e) {
			const {parentPart, listeParent, itemListPart} = this;
			let result = await itemListPart.tazele(e);
			itemListPart.itemFormParent[0].scrollTo(0, 1000000);

			const recs = itemListPart.lastRecs || (await this.getDataSource(e));
			// parentPart.sagForm[$.isEmptyObject(recs) ? 'addClass' : 'removeClass'](`jqx-hidden`);
			const {sagForm} = parentPart;
			sagForm.removeClass(`jqx-hidden`);
			listeParent.removeClass(`jqx-hidden`);
			
			const bosmu = $.isEmptyObject(recs);
			listeParent[bosmu ? 'addClass' : 'removeClass'](`basic-hidden`);
			// sagForm.css('opacity', bosmu ? .8 : 1);

			return result;
		}

		async getDataSource(e) {
			const {aktifFis} = this.app;
			if (!aktifFis)
				return [];
			
			return (aktifFis.detaylar || [])
						.filter(det => !det.silindimi);
		}

		listeRenderItem(e) {
			const {app} = this;
			const {zAcikmi} = app;
			const {divItem} = e;
			const btnSil = divItem.find(`.islemTuslari #btnSil`);
			if (btnSil.length) {
				if (zAcikmi) {
					btnSil.jqxButton({ theme: theme })
						.on('click', evt =>
							this.silIstendi($.extend({}, e, { event: evt })))
				}
				else {
					btnSil.addClass(`jqx-hidden`);
				}
			}
			const btnDegistir = divItem.find(`.islemTuslari #btnDegistir`);
			if (btnDegistir.length) {
				if (zAcikmi) {
					btnDegistir.jqxButton({ theme: theme })
						.on('click', evt =>
							this.degistirIstendi($.extend({}, e, { event: evt })))
				}
				else {
					btnDegistir.addClass(`jqx-hidden`);
				}
			}
		}

		silIstendi(e) {
			const {divItem} = e;
			const _e = (divItem ? divItem.data('args') : null) || {};
			const {rec} = _e;
			if (!rec)
				return false;
			
			const {parentPart} = this;
			if (parentPart && parentPart.cikarIstendi)
				parentPart.cikarIstendi({ items: divItem });
		}

		degistirIstendi(e) {
			const {divItem} = e;
			const _e = (divItem ? divItem.data('args') : null) || {};
			const {rec} = _e;
			if (!rec)
				return false;
			
			const {parentPart} = this;
			if (parentPart && parentPart.listeItem_sagTiklandi)
				parentPart.listeItem_sagTiklandi({ rec: rec });
		}

		liste_onItemClick(e) {
			const evt = e.event || {};
			if (evt.target && evt.target.tagName.toUpperCase() == 'BUTTON')
				return;
			
			const {divItem, rec} = e;
			if (divItem && rec /*&& !divItem.hasClass(`disabled`)*/)
				divItem.toggleClass(`selected`);
		}

		liste_onItemRightClick(e) {
		}

		async onResize(e) {
			await super.onResize(e);

			const {itemListPart} = this;
			if (itemListPart)
				itemListPart.onResize(e);
		}
	}
})()
