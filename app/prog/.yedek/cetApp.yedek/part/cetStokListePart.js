(function() {
	window.CETStokListePart = class extends window.CETListeOrtakPart {
		constructor(e) {
			e = e || {};
			super(e);
			
			$.extend(this, {
				sonStokKontrolEdilirmi: e.sonStokKontrolEdilirmi,
				sonStokFilterDisabled: e.sonStokFilterDisabled,
				idSaha: ''
			});
			if (!(this.layout || this.template))
				this.template = this.app.templates.stokListe;
		}

		static get canDefer() { return false }
		static get canDestroy() { return false }
		static get partName() { return 'cetStokListe' }
		get adimText() { return 'Ürün Listesi' }


		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);

			// const layout = e.layout || this.layout;
		}

		async activatePart(e) {
			e = e || {};
			await super.activatePart(e);

			this.islemTuslariOrtakInit(e);
			
			if (this.sonStokKontrolEdilirmi == null)
				this.sonStokKontrolEdilirmi = this.savedValue_sonStokKontrolEdilirmi;
			if (this.savedValue_sonStokKontrolEdilirmi == null || this.savedValue_sonStokKontrolEdilirmi != this.sonStokKontrolEdilirmi)
				this.savedValue_sonStokKontrolEdilirmi = this.sonStokKontrolEdilirmi;
			
			const {app, fis} = this;
			this.fiyatGorurmu = fis && !fis.class.fiiliCikismi ? app.alimFiyatGorurmu : app.satisFiyatGorurmu;
			
			this.tazele();
		}

		
		async listeArgsDuzenle(e) {
			await super.listeArgsDuzenle(e);
			
			$.extend(e.listeArgs, {
				pageable: true, showToolbar: true, filterable: true,
				autoRowHeight: true, toolbarHeight: 28, serverProcessing: true, filterMode: 'default',
				height: $(window).height() - 100
			});
		}

		async liste_columnsDuzenle(e) {
			await super.liste_columnsDuzenle(e);

			
			$.merge(e.listeColumns, [
				{
					text: 'Ürün Adı', align: 'left', dataField: 'aciklama',
					cellsRenderer: (rowIndex, columnIndex, value, rec) => {
						const {fiyatGorurmu} = this;
						rec = rec.originalRecord || rec;
						
						const divSatir = this.newListeSatirDiv($.extend({}, e, { cssSubClass: 'asil' }));
						divSatir.attr('data-index', rowIndex);
						$.each(rec, (key, value) => {
							let item = divSatir.find(`.${key}`);
							if (item.length)
								item.html(value);
						});
						[`kdvOrani`, `brmFiyat`, `yerKod`, `sonStok`, `brm`].forEach(key => {
							const spanParent = divSatir.find(`.${key}Parent`);
							if (!rec[key] && spanParent.length)
								spanParent.addClass(`jqx-hidden`);
						});
						if (!fiyatGorurmu) {
							const spanParent = divSatir.find(`.brmFiyatParent`);
							if (spanParent.length)
								spanParent.addClass(`jqx-hidden`);
						}
						if (!rec.sonStok) {
							const spanParent = divSatir.find(`.brmParent`);
							if (spanParent.length)
								spanParent.addClass(`jqx-hidden`);
						}
						
						return divSatir[0].outerHTML.trim();
					}
				},
				{ text: 'Ürün Kodu', align: 'left', dataField: 'kod', hidden: true },
				{
					text: 'Grup Adı', align: 'left', dataField: 'grupAdi', width: 125,
					cellsRenderer: (rowIndex, columnIndex, value, rec) => {
						let divSatir = this.newListeSatirDiv($.extend({}, e, { cssSubClass: 'grup' }));
						divSatir.attr('data-index', rowIndex);
						$.each(rec, (key, value) => {
							let item = divSatir.find(`.${key}`);
							if (item.length)
								item.html(value);
						});
						return divSatir[0].outerHTML.trim();
					}
				},
				{ text: 'Grup Kodu', align: 'left', dataField: 'grupKod', hidden: true },
				{
					text: 'Yer Kodu', align: 'left', dataField: 'yerKod', width: 80,
					cellsRenderer: (rowIndex, columnIndex, value, rec) => {
						let divSatir = this.newListeSatirDiv($.extend({}, e, { cssSubClass: 'yer' }));
						divSatir.attr('data-index', rowIndex);
						$.each(rec, (key, value) => {
							let item = divSatir.find(`.${key}`);
							if (item.length)
								item.html(value);
						});
						return divSatir[0].outerHTML.trim();
					}
				}
				// { text: 'Grup Adı', align: 'left', dataField: 'grupAdi', hidden: true }
			]);
		}
		
		async loadServerData_buildQuery(e) {
			const wsArgs = $.extend({}, e.wsArgs, { rowCountOnly: e.rowCountOnly });
			const filterGroups = wsArgs.filterGroups || [];
			for (const i in filterGroups) {
				const filterGroup = filterGroups[i];
				const filters = filterGroup.filters || [];
				for (const j in filters) {
					const filter = filters[j];
					if (filter.field == `grupAdi`)
						filter.field = `grp.aciklama`;
					if (filter.field == `yerKod`)
						filter.field = `son.yerKod`;
					if (filter.field == `yerAdi`)
						filter.field = `''`;
				}
			}
			$.extend(wsArgs, {
				filters: this.getFiltersFromListeWSArgs(wsArgs),
				alias: e => {
					const {saha} = e;
					if (saha.includes(`.`))
						return null;
					if (saha == `grupAdi`) {
						e.saha = `aciklama`;
						return 'grp';
					}
					if (saha == `yerKod`)
						return 'son';
					if (saha == `yerAdi`) {
						e.saha = `''`;
						return '';
					}
					return 'stk';
				}
			});
			
			const {app, fis, sonStokKontrolEdilirmi} = this;
			let stm = e.stm = await CETStokTicariDetay.getStokEkBilgiStm({
				rowCountOnly: e.rowCountOnly,
				sonStokKontrolEdilirmi: sonStokKontrolEdilirmi,
				wsArgs: wsArgs,
				fis: fis || this.fisSinif || (this.parentPart || {}).fis || (this.parentPart || {}).fisSinif,
				yerKod: app.class.appSDMmi ? null : (fis ||{}).yerKod || app.defaultYerKod
			});
			await this.loadServerData_buildQuery_callHandlers(e);
			stm = e.stm;

			return stm;
		}

		loadServerData_ekIslemler(e) {
			/*const _recs = e.recs;
			const recs = e.recs = [];
			let rowidSet = {};
			let {totalRecs} = e;
			for (const i in _recs) {
				const rec = _recs[i];
				const {rowid} = rec;
				const hasRowID = rowid != null;
				if (!hasRowID || !rowidSet[rowid]) {
					if (hasRowID)
						rowidSet[rowid] = true;
					recs.push(rec);
				}
				else {
					totalRecs--;
				}
			}
			e.totalRecs = totalRecs;*/
		}
		
		liste_renderToolbar(e) {
			super.liste_renderToolbar(e);

			const layout = e.layout || this.layout;
			let toolbar = e.listeToolbar;
			let islemTuslari = toolbar.find('.toolbar.islemTuslari');
			if (!islemTuslari.length) {
				islemTuslari = this.newListeSubPart({ selector: '.toolbar.islemTuslari' });
				islemTuslari.appendTo(toolbar);
				
				const divDiger = islemTuslari.find('.diger');
				const chkSonStoktaOlanlarmi = divDiger.find(`#chkSonStoktaOlanlarmi`);
				let handler = evt => {
					this.sonStokKontrolEdilirmi = this.savedValue_sonStokKontrolEdilirmi = chkSonStoktaOlanlarmi.is(':checked');
					this.tazele(e);
				};
				chkSonStoktaOlanlarmi.parent().find(`#chkSonStoktaOlanlarmi_label`)
					.off('mouseup, touchend')
					.on('mouseup, touchend', evt => {
						if (!(this.disableEventsFlag || this.sonStokFilterDisabled)) {
							chkSonStoktaOlanlarmi.prop('checked', !chkSonStoktaOlanlarmi.prop('checked'));
							handler(evt);
						}
					});
				chkSonStoktaOlanlarmi
					.off('change')
					.on('change', evt => {
						if (!(this.disableEventsFlag || this.sonStokFilterDisabled))
							handler(evt);
				});

				this.islemTuslariOrtakInit($.extend({}, e, { islemTuslari: islemTuslari, divDiger: divDiger }));
			}
			
			/*let divIslemTuslari = toolbar.find('.toolbar.islemTuslari');
			if (!divIslemTuslari.length) {
				divIslemTuslari = this.template_listeParts.contents('.toolbar.islemTuslari').clone(true);
				if (divIslemTuslari.length) {
					divIslemTuslari.appendTo(toolbar);
					let liItems = divIslemTuslari.find('ul > li');
					divIslemTuslari.jqxMenu({
						theme: theme, mode: 'horizontal',
						animationShowDuration: 0, animationHideDuration: 0
					});
					liItems.on('click', evt =>
						this.liste_islemTusuTiklandi($.extend({}, e, { event: evt })));
				}
			}*/
		}

		islemTuslariOrtakInit(e) {
			e = e || {};
			const toolbar = e.listeToolbar || this.listeToolbar;
			const islemTuslari = (e.islemTuslari && e.islemTuslari.length ? e.islemTuslari : null)
										|| (toolbar && toolbar.length ? toolbar.find('.toolbar.islemTuslari') : null);
			const divDiger = (e.divDiger && e.divDiger.length ? e.divDiger : null)
										|| (islemTuslari && islemTuslari.length ? islemTuslari.find('.diger') : null);
			if (!(divDiger && divDiger.length))		// ilk giris ise #liste_renderToolbar kısmında burası tekrar çağırılır
				return;
			
			const chkSonStoktaOlanlarmi = divDiger.find('#chkSonStoktaOlanlarmi');
			this.disableEventsDo(() =>
				chkSonStoktaOlanlarmi.prop('checked', this.sonStokKontrolEdilirmi));
			
			let children = chkSonStoktaOlanlarmi.parent().children();
			const disabledAttr = 'disabled';
			if (this.sonStokFilterDisabled) {
				children.attr(disabledAttr, '');
				children.addClass(disabledAttr);
			}
			else {
				children.removeAttr(disabledAttr);
				children.removeClass(disabledAttr);	
			}
		}

		/*async liste_islemTusuTiklandi(e) {
			let rec = this.selectedBoundRec;
			let elm = e.event.currentTarget;
			switch (elm.id) {
				case '...':
					break;
			}
		} */
	}
})()
