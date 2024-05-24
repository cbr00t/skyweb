(function() {
	window.CETFisGirisSonStoktanSecimPart = class extends window.CETListeOrtakPart {
		/*
			let part = new CETFisGirisSonStoktanSecimPart();
			await part.run();

			let widget = part.layout.find('#altListe').jqxDataTable('getInstance');
			widget.addRow(null, { seq: 1, kod: 'abc', aciklama: 1 });
			widget.addRow(null, { seq: 2, kod: 'xyz', aciklama: 'aaa', miktar: 5 });
			widget.addRow(null, { seq: 3, kod: '123', aciklama: 'bbb', miktar: 3 });
		*/

		constructor(e) {
			e = e || {};
			super(e);
			
			const {app} = this;
			const {fis, sonStokKontrolEdilirmi, sonStokFilterDisabled} = e;
			$.extend(this, {
				islem: e.islem,
				eskiFis: e.eskiFis,
				fis: fis,
				sonStokKontrolEdilirmi: sonStokKontrolEdilirmi == null ? (fis.class.sonStokKontrolEdilirmi || null) : sonStokKontrolEdilirmi,
				sonStokFilterDisabled: sonStokFilterDisabled == null ? app.sonStokKontrolEdilirmi && fis.class.sonStokKontrolEdilirmi : sonStokFilterDisabled,
				secButonuKontrolEdilirmi: false
			});
			if (!(this.layout || this.template))
				this.template = this.app.templates.fisGirisSonStoktanSecim;
		}

		static get canDestroy() { return false }
		static get noResizeEvent() { return true }
		static get partName() { return 'cetFisGirisSonStoktanSecim' }
		get adimText() { return 'Son Stoktan Seçim' }


		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);

			await new Promise(resolve => {
				setTimeout(async () =>
					resolve(),
					0)
			});
			// this.tazele();
		}

		async activatePart(e) {
			e = e || {};
			await super.activatePart(e);

			if (this.sonStokKontrolEdilirmi == null)
				this.sonStokKontrolEdilirmi = this.savedValue_sonStokKontrolEdilirmi;
			
			if (this.savedValue_sonStokKontrolEdilirmi == null || this.savedValue_sonStokKontrolEdilirmi != this.sonStokKontrolEdilirmi) {
				this.savedValue_sonStokKontrolEdilirmi = this.sonStokKontrolEdilirmi;
				// this.tazele();
			}

			// this.islemTuslariOrtakInit(e);
			await this._initActivatePartOrtak(e);
			setTimeout(() => this.tazele(), 1000);
		}

		async _initActivatePartOrtak(e) {
			e = e || {};
			this.initActivatePartOrtak(e);
			
			const layout = e.layout || this.layout;
			// layout.parent().addClass('basic-hidden');

			const {app, fis} = this;
			const {mustKod} = fis;
			this.fiyatGorurmu = fis && !fis.class.fiiliCikismi ? app.alimFiyatGorurmu : app.satisFiyatGorurmu;
			this.bedelKullanilirmi = fis.class.bedelKullanilirmi;

			const mustKod2KosulProYapilari = app.mustKod2KosulProYapilari = app.mustKod2KosulProYapilari || {};
			const promise_ilkIslemler = this.promise_ilkIslemler = new $.Deferred(p => {
				setTimeout(async () => {
					try {
						const mustKod2KosulProYapilari = app.mustKod2KosulProYapilari = app.mustKod2KosulProYapilari || {};
						let kosulProYapilari = mustKod2KosulProYapilari[mustKod] = mustKod2KosulProYapilari[mustKod] || {
							satisKosulYapilari: await fis.getSatisKosulYapilari({ /* kosulTip: ['FY', 'SB', 'KM', 'MF'] */ }),
							promosyonYapilari: await fis.getPromosyonYapilari()
						};
						$.extend(this, kosulProYapilari);
						p.resolve(kosulProYapilari);
					}
					finally {
						delete this.promise_ilkIslemler;
					}
				}, 500);
			});

			const divDiger = this.divDiger = layout.find('.diger');
			const chkSonStoktaOlanlarmi = this.chkSonStoktaOlanlarmi = divDiger.find('#chkSonStoktaOlanlarmi');
			let handler = evt => {
				this.sonStokKontrolEdilirmi = this.savedValue_sonStokKontrolEdilirmi = chkSonStoktaOlanlarmi.is(':checked');
				this.tazele(e);
			};
			chkSonStoktaOlanlarmi.parent().find('#chkSonStoktaOlanlarmi_label')
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
			this.disableEventsDo(() =>
				chkSonStoktaOlanlarmi.prop('checked', this.sonStokKontrolEdilirmi));
			this.islemTuslariOrtakInit(e);

			const grupListeParent = this.grupListeParent = this.grupListeParent || layout.find(`#grupListeParent`);
			let grupListePart = this.grupListePart;
			if (grupListePart) {
				grupListePart.tazele();
			}
			else {
				grupListePart = this.grupListePart = new CETListeOrtakPart({
					isComponent: true, content: false, layout: grupListeParent,
					// template: this.app.templates.cetListeOrtak,
					listeLayout: `#grupListe`, listePartsLayout: '.listeParts',
					widgetDuzenleyici: e => {
						$.extend(e.listeArgs, {
							showToolbar: false, columnsHeight: 28, pagerHeight: 30,
							pageable: false, filterable: false, /*pageSize: 12,*/
							serverProcessing: false, height: $(window).height() - 90,
							// pageSize: grupListePart.userSettings_liste.pageSize || 40,
						})
					},
					listeColumnsDuzenleFunc: e => this.grupListe_columnsDuzenle(e),
					// listeDataAdapterOlusturFunc: e => this.getDataAdapter_grupListe(e),
					liste_loadServerData_buildQuery: e => this.grupListe_loadServerData_buildQuery(e),
					liste_loadServerData_ekIslemler: e => this.grupListe_loadServerData_ekIslemler(e),
					listeSatirSecildiFunc: e =>
						this.grupListe_satirSecildi(e)
				});
				grupListePart.run();
			}

			let genelIslemTuslari = this.genelIslemTuslari;
			if (!genelIslemTuslari) {
				genelIslemTuslari = this.genelIslemTuslari = layout.find(`.genelIslemTuslari`);
				genelIslemTuslari.jqxMenu({
					theme: theme, mode: 'horizontal',
					animationShowDuration: 0, animationHideDuration: 0
				});
			}
			let liItems = genelIslemTuslari.find('ul > li');
			liItems
				.off('click')
				.on('click', evt =>
					this.islemTusuTiklandi($.extend({}, e, { event: evt })));
			
			const altListeParent = this.altListeParent = this.altListeParent || layout.find(`#altListeParent`);
			let altListePart = this.altListePart;
			if (altListePart) {
				altListePart.tazele();
			}
			else {
				altListePart = this.altListePart = new CETListeOrtakPart({
					isComponent: true, content: false, layout: altListeParent,
					// template: this.app.templates.cetListeOrtak,
					listeLayout: `#altListe`, listePartsLayout: '.listeParts',
					widgetDuzenleyici: e => {
						$.extend(e.listeArgs, {
							showToolbar: false, columnsHeight: 23, pagerHeight: 30,
							pageSize: altListePart.userSettings_liste.pageSize || 10,
							height: $(window).height() - this.divListe.height() - 132
						})
					},
					listeColumnsDuzenleFunc: e => this.altListe_columnsDuzenle(e),
					listeDataAdapterOlusturFunc: e => {
						return new $.jqx.dataAdapter({
							id: 'seq', datatype: 'array',
							localdata: []
							/*	new CKodVeAdi({ kod: 'a01', aciklama: 'satır 1' }),
								new CKodVeAdi({ kod: 'a02', aciklama: 'satır 2' }),
								new CKodVeAdi({ kod: 'a03', aciklama: 'satır 3' })
							*/
						})
					},
					listeSatirTiklandiFunc: e => this.altListe_satirTiklandi(e),
					listeSatirCiftTiklandiFunc: e => this.altListe_satirCiftTiklandi(e),
					listeSatirSecimDegistiFunc: e => this.altListe_satirSecimDegisti(e)
				});
				await altListePart.run();
			}
			altListePart.liste_hideFilterBar();

			setTimeout(() =>
				layout.parent().removeClass('basic-hidden'),
				10);
			setTimeout(() => hideProgress(), 100);
			// await promise_ilkIslemler;
		}

		async deactivatePart(e) {
			e = e || {};			
			await this.grupListePart.deactivatePart(e);
			await this.altListePart.deactivatePart(e);

			await super.deactivatePart(e);
		}

		async destroyPart(e) {
			e = e || {};			
			await this.grupListePart.destroyPart(e);
			await this.altListePart.destroyPart(e);

			await super.destroyPart(e);
		}

		islemTuslariOrtakInit(e) {
			e = e || {};
			const layout = e.layout || this.layout;
			
			const divDiger = this.divDiger;
			const chkSonStoktaOlanlarmi = this.chkSonStoktaOlanlarmi;
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
		
		async listeArgsDuzenle(e) {
			await super.listeArgsDuzenle(e);
			
			$.extend(e.listeArgs, {
				pageable: true, showToolbar: false, filterable: true,
				serverProcessing: true, filterMode: 'default', toolbarHeight: 28,
				pageSize: this.userSettings_liste.pageSize || 8,
				height: ($(window).height() / 2)
			});
		}

		async liste_columnsDuzenle(e) {
			await super.liste_columnsDuzenle(e);
			
			$.merge(e.listeColumns, [
				{
					text: 'Ürün Adı', align: 'left', dataField: 'aciklama',
					cellsRenderer: (rowIndex, dataField, value, rec) => {
						const {fiyatGorurmu, bedelKullanilirmi} = this;
						rec = rec.originalRecord || rec;

						const divSatir = this.newListeSatirDiv($.extend({}, e));
						divSatir.attr('data-index', rowIndex);
						$.each(rec, (key, value) => {
							key = (key || '').trim()
							if (!key)
								return true;

							switch (key) {
								case 'brmFiyat':
									value = (value || 0).toLocaleString();
									break;
							}
							if (!value) {
								switch (key) {
									case 'sonStok':
									case 'sonStok2':
									case 'miktar':
									case 'miktar2':
										value = 0;
										break;
								}
							}
							
							const item = divSatir.find(`.${key}`);
							if (item.length)
								item.html(value);
							
							const fiyatParent = divSatir.find(`.brmFiyatParent`);
							if (!(fiyatGorurmu && bedelKullanilirmi && rec.brmFiyat))
								fiyatParent.addClass(`jqx-hidden`);
						});
						
						/*let div = divSatir.find('.miktar');
						let miktar = rec.miktar;
						if (div.length)
							div.html(miktar || 1);*/

						return divSatir[0].outerHTML.trim();
					}
				},
				/*{
					text: 'Son Stok', align: 'right', dataField: ' ',
					cellsRenderer: (rowIndex, dataField, value, rec) => {
						const divSatir = this.altListePart.newListeSatirDiv($.extend({}, e));
						divSatir.attr('data-index', rowIndex);
						$.each(rec, (key, value) => {
							key = (key || '').trim()
							if (!key)
								return true;
							const item = divSatir.find(`.${key}`);
							if (item.length)
								item.html(value);
						});
					}
				},*/
				{ text: 'Ürün Kodu', align: 'left', dataField: 'kod', hidden: true },
				{ text: 'Grup Kodu', align: 'left', dataField: 'grupKod', hidden: true },
				{ text: 'Grup Adı', align: 'left', dataField: 'grupAdi', hidden: true }
			])
		}
		
		async loadServerData_ekIslemler(e) {
			await super.loadServerData_ekIslemler(e);
			
			/*const recs = e.recs;
			const grupListePart = this.grupListePart;
			if (grupListePart) {
				const grupListeWidget = grupListePart.listeWidget;
				if ($.isEmptyObject(grupListePart.listeRecs)) {
					let grupKey2Rec = {};
					recs.forEach(rec => {
						let key = rec.grupKod;
						if (!grupKey2Rec[key])
							grupKey2Rec[key] = { kod: rec.grupKod, aciklama: rec.grupAdi || '', anaGrupKod: rec.anaGrupKod || '' };
					});
					let grupRecs = Object.values(grupKey2Rec)
						.sort((a, b) => (a.aciklama || '') > (b.aciklama || '') ? 1 : -1);
					this.grupListe = $.merge([
						{ kod: null, aciklama: `<span class="bold">&lt; HEPSİ &gt;</span>`, hepsimi: true }
					], grupRecs);
					await grupListePart.tazele();
				}
			}*/
		}

		loadServerData_buildQuery(e) {
			const wsArgs = $.extend({}, e.wsArgs, { rowCountOnly: e.rowCountOnly });
			wsArgs.alias = e => {
				if (e.saha == 'grupAdi') {
					e.saha = 'aciklama';
					return 'grp'
				}
				return 'stk';
			};
			wsArgs.sortDataField = wsArgs.sortDataField || wsArgs.sortdatafield || `aciklama`;
			const filters = wsArgs.filters = this.getFiltersFromListeWSArgs(wsArgs) || [];

			const {app, fis} = this;
			const fisSinif = (fis || {}).class || {};
			const {fiiliCikismi, stokKdvSaha, stokKdvDegiskenmiSaha} = fisSinif;
			const yerKod = (fis ||{}).yerKod || app.defaultYerKod;

			let sent = new MQSent({
				from: `mst_Stok stk`,
				fromIliskiler: [
					// { alias: 'stk', leftJoin: `mst_StokGrup grp`, on: `stk.grupKod = grp.kod` }
					{ from: `mst_StokGrup grp`, iliski: `stk.grupKod = grp.kod` }
				],
				/*where: [
					`stk.brmFiyat > 0`
				],*/
				sahalar: (e.rowCountOnly
					? `COUNT(*) sayi`
					: [
						`stk.kod`, `stk.aciklama`, `stk.grupKod`, `grp.aciklama grupAdi`, `grp.anaGrupKod anaGrupKod`, `stk.brm`,
						(fiiliCikismi ? `stk.brmFiyat` : `(case when stk.almFiyat == 0 then stk.brmFiyat else stk.almFiyat end) brmFiyat`),
						`stk.${stokKdvSaha || `satKdvOrani`} kdvOrani`,
						`stk.${stokKdvDegiskenmiSaha || `satKdvDegiskenmi`} kdvDegiskenmi`,
						`son.yerKod`, `SUM(son.miktar) sonStok`
					]),
				groupBy: e.rowCountOnly ? [] : [`stk.kod`]
			});
			const {sonStokKontrolEdilirmi, aktifGrupKod} = this;
			let stm = new MQStm({ sent: sent });
			stm.fromGridWSArgs(wsArgs);
			app.stmSentDuzenle_sonStokBagla({
				stm: stm, alias: 'stk', shKodClause: `stk.kod`,
				leftJoin: !sonStokKontrolEdilirmi,
				yerKod: app.class.appMagazaVeyaSDMmi ? null : (fis ||{}).yerKod || app.defaultYerKod
			});
			sent.groupBy.addAll([
				`stk.kod`, `son.yerKod`
			]);
			if (aktifGrupKod)
				sent.where.degerAta(aktifGrupKod, 'stk.grupKod');

			/*let alinanlarKodListe = null;
			const altListePart = this.altListePart;
			if (altListePart && altListePart.listeWidget) {
				const alinanlar = altListePart.listeRecs;
				alinanlarKodListe = alinanlar.map(rec => rec.kod);
			}*/
			//if (!$.isEmptyObject(alinanlarKodListe))
			//	sent.where.notInDizi(alinanlarKodListe, 'stk.kod');
			
			return stm;
		}

		grupListe_columnsDuzenle(e) {
			$.merge(e.listeColumns, [
				{	datafield: 'aciklama', text: 'Gruplar', align: 'left',
					cellsRenderer: (rowIndex, dataField, value, rec) => {
						rec = rec.originalRecord || rec;
						const divSatir = this.grupListePart.newListeSatirDiv($.extend({}, e));
						divSatir.attr('data-index', rowIndex);
						$.each(rec, (key, value) => {
							key = (key || '').trim()
							if (!key)
								return true;
							let item = divSatir.find(`.${key}`);
							if (item.length)
								item.html(value);
						});
						return divSatir[0].outerHTML.trim()
					}
				}
			])
		}

		/*getDataAdapter_grupListe(e) {
			e = e || {};
			return new $.jqx.dataAdapter({
				id: 'kod', datatype: defaultOutput, datafields: [],
				url: this.app.wsURLBase, data: {}
			}, {
				loadServerData: (wsArgs, source, callback) => {
					try {
						const recs = this.grupListe || [];
						callback({ totalrecords: recs.length, records: recs });
					}
					catch (ex) {
						defFailBlock(ex);
						callback({ totalrecords: 0, records: [] });
						throw ex;
					}
				}
			});
		}*/

		grupListe_loadServerData_buildQuery(e) {
			const wsArgs = $.extend({}, e.wsArgs, { rowCountOnly: e.rowCountOnly });
			wsArgs.alias = `grp`;
			wsArgs.sortdatafield = wsArgs.sortDataField || wsArgs.sortdatafield || `aciklama`;
			const filters = wsArgs.filters = this.getFiltersFromListeWSArgs(wsArgs) || [];
			
			const {app, fis} = this;
			const yerKod = (fis ||{}).yerKod || app.defaultYerKod;
			
			let sent = new MQSent({
				from: `mst_StokGrup grp`,
				fromIliskiler: [
					// { alias: 'stk', leftJoin: `mst_StokGrup grp`, on: `stk.grupKod = grp.kod` }
					{ from: `mst_Stok stk`, iliski: `grp.kod = stk.grupKod` }
				],
				/*where: [
					/`stk.brmFiyat > 0`
				],*/
				distinct: true,
				sahalar: (e.rowCountOnly
					? `COUNT(*) sayi`
					: [`grp.kod`, `grp.aciklama`])
			});
			const {sonStokKontrolEdilirmi, aktifGrupKod} = this;
			let stm = new MQStm({ sent: sent });
			stm.fromGridWSArgs(wsArgs);
			app.stmSentDuzenle_sonStokBagla({
				stm: stm, alias: 'stk', shKodClause: `stk.kod`,
				leftJoin: !sonStokKontrolEdilirmi,
				yerKod: app.class.appMagazaVeyaSDMmi ? null : (fis ||{}).yerKod || app.defaultYerKod
			});
			sent.groupBy.addAll([
				`grp.kod`
			]);
			/*if (aktifGrupKod)
				sent.where.degerAta(aktifGrupKod, 'stk.grupKod');*/
			
			e.stm = stm;
			return true;
		}

		grupListe_loadServerData_ekIslemler(e) {
			const recs = e.recs;
			recs.unshift({ kod: '', aciklama: `<span class="bold">&lt; HEPSİ &gt;</span>`, hepsimi: true });
		}

		altListe_columnsDuzenle(e) {
			$.merge(e.listeColumns, [
				{	datafield: ' ', text: 'Seçilenler', align: 'left',
					cellsRenderer: (rowIndex, dataField, value, rec) => {
						const {fiyatGorurmu, bedelKullanilirmi} = this;
						rec = rec.originalRecord || rec;

						const divSatir = this.altListePart.newListeSatirDiv($.extend({}, e));
						divSatir.attr('data-index', rowIndex);
						$.each(rec, (key, value) => {
							key = (key || '').trim()
							if (!key)
								return true;

							switch (key) {
								case 'brmFiyat':
									value = (value || 0).toLocaleString();
									break;
							}
							if (!value) {
								switch (key) {
									case 'sonStok':
									case 'sonStok2':
									case 'miktar':
									case 'miktar2':
										value = 0;
										break;
								}
							}
							
							const item = divSatir.find(`.${key}`);
							if (item.length)
								item.html(value);
							
							const fiyatParent = divSatir.find(`.brmFiyatParent`);
							if (!(fiyatGorurmu && bedelKullanilirmi && rec.brmFiyat))
								fiyatParent.addClass(`jqx-hidden`);
						});
						
						let div = divSatir.find('.miktar');
						let miktar = rec.miktar;
						if (div.length)
							div.html(miktar || 1);

						return divSatir[0].outerHTML.trim();
					}
				}
			])
		}


		islemTusuTiklandi(e) {
			e = e || {};
			const evt = e.event || {};
			const elm = evt.currentTarget || e;
			switch (elm.id) {
				case 'asagi':
					this.asagiAlIstendi();
					break;
				case 'yukari':
					this.yukariAlIstendi();
					break;
			}
		}

		async asagiAlIstendi(e) {
			e = e || {};
			let rec = e.rec = e.rec || this.selectedBoundRec;
			if (!rec)
				return;

			/*const focusElm = document.activeElement;
			if (focusElm && focusElm.classList.contains(`miktar`))
				return;*/

			const {altListePart} = this;
			const widget = altListePart.listeWidget;
			let {uid} = rec;
			// let _rec = altListePart.listeRecs.find(_rec => _rec.uid == uid);
			let _rec = widget.rowsByKey[uid];
			if (_rec) {
				let artis = (_rec == rec ? null : asFloat(rec.miktar)) || 1;
				_rec.miktar = (asFloat(_rec.miktar) || 0) + artis;
				widget.selectrowbykey(uid);
				return;
			}

			e.rec = rec = rec.deepCopy ? rec.deepCopy() : $.extend({}, rec);
			rec.miktar = rec.miktar || 1;
			await altListePart.ekle(e);
			// this.tazele(e);

			uid = rec.uid;
			setTimeout(() => {
				altListePart.selectLastRec();
				this.disableEventsDo(() => {
					widget.selectrowbykey(uid);
					widget.ensurerowvisiblebykey(uid);
				});
				this.liste_satirSecildiBasit({ rec: rec });
			}, 0);
		}
		
		yukariAlIstendi(e) {
			e = e || {};
			let rec = e.rec = e.rec || this.altListePart.selectedBoundRec;
			if (!rec)
				return;

			/*const focusElm = document.activeElement;
			if (focusElm && focusElm.classList.contains(`miktar`))
				return;*/

			const {altListePart} = this;
			let lastSelectedIndex = altListePart.selectedIndex;
			if (!lastSelectedIndex || lastSelectedIndex < 0)
				lastSelectedIndex = null;

			altListePart.sil(e);
			this.tazele(e);

			if (!altListePart.selectedBoundRec) {
				let widget = altListePart.listeWidget;
				const rowCount = altListePart.listeRecs.length;
				let index = lastSelectedIndex == null ? rowCount - 1 : lastSelectedIndex;
				if (index < 0)
					index = 0;
				else if (index >= rowCount)
					index = rowCount - 1;
				
				setTimeout(() => {
					this.disableEventsDo(() => {
						if (lastSelectedIndex == null) {
							if (widget.pageable) {
								while (widget.goToNextPage())
									;
							}
						}
						widget.selectRow(index);
						widget.ensureRowVisible(index);
					});
				}, 100);
			}
		}
		
		liste_satirTiklandi(e) {
			super.liste_satirTiklandi(e);
			
			setButonEnabled(this.genelIslemTuslari, true);
		}
		
		liste_satirCiftTiklandi(e) {
			if (!this.isEventFired_satirCifTiklandi) {
				this.isEventFired_satirCifTiklandi = true;
				return;
			}

			// super.liste_satirCiftTiklandi(e);
			
			this.asagiAlIstendi();
		}

		altListe_satirCiftTiklandi(e) {
			// this.yukariAlIstendi();
		}

		liste_satirSecimDegisti(e) {
			super.liste_satirSecimDegisti(e);

			/*let rec = this.selectedBoundRec;
			let islemTuslari = this.divListe.find('.toolbar.islemTuslari');
			setButonEnabled(
				islemTuslari.find('li:not(#yeni)'),
				!!rec);*/
		}

		liste_renderToolbar(e) {
			const layout = e.layout || this.layout;
			let toolbar = e.listeToolbar;
			let islemTuslari = toolbar.find('.toolbar.islemTuslari');
			if (!islemTuslari.length) {
				islemTuslari = this.newListeSubPart({ selector: '.toolbar.islemTuslari' });
				islemTuslari.appendTo(toolbar);
			}
		}

		async liste_islemTusuTiklandi(e) {
			let rec = this.selectedBoundRec;
			let elm = e.event.currentTarget;
			/*switch (elm.id) {
				case '...':
					break;
			}*/
		}

		liste_satirSecimDegisti(e) {
			e = e || {};
			super.liste_satirSecimDegisti(e);

			const rec = this.selectedBoundRec;
			const index = this.selectedIndex;
			const lastSelectedIndex = e.lastSelectedIndex;
			if (rec && index != null && index == lastSelectedIndex) {
				// this.listeWidget.beginRowEdit(index);
				let elm = this.divListe.find(`.jqx-grid-table .listeSatir[data-index=${index}] .miktar`);
				if (elm.length) {
					if (e.event)
						e.event.stopPropagation();
					
					setTimeout(e => {
						let elm = e.elm;
						let parent = elm.parent();
						if (!parent.length)
							return;
						
						const rec = e.rec.deepCopy ? e.rec.deepCopy() : $.extend(true, {}, e.rec);
						rec.miktar = 0;

						let fra = this.app.brm2Fra[rec.brm || 'AD'] || 0;
						
						parent.removeClass('jqx-hidden');
						elm = e.elm[0];
						let savedHTML = elm.outerHTML;
						elm.outerHTML = (
							`<form action="" autocomplete="false" readonly onfocus="this.removeAttribute('readonly')" onsubmit="javascript:return false">` +
							`	<input class="miktar" maxlength="9" autocomplete="off" value="${roundToFra(rec.miktar, fra) || 0}"></input>` +
							`</form>`
						);
						elm = parent.find('.miktar');
						elm.off('keyup').on('keyup', evt => {
							const key = (evt.key || '').toLowerCase();
							if (key == 'enter' || key == 'linefeed')
								setTimeout(() => elm.blur(), 50);
						});
						elm.off('change').on('change', evt => {
							rec.miktar = roundToFra(evt.target.value.replaceAll(',', '.'), fra) || 1;
							if (rec.miktar > 0)
								this.asagiAlIstendi({ rec: rec });
							// this.listeWidget.refresh();
						});
						elm.off('blur').on('blur', evt => {
							parent.addClass('jqx-hidden');
							this.listeWidget.refresh();
							setTimeout(() => setButonEnabled(this.genelIslemTuslari, true), 1);
						});
						setButonEnabled(this.genelIslemTuslari, false);
						elm.focus();
						elm.select();
					}, 10, { elm: elm, rec: rec, index: index });
				}
			}
		}

		async grupListe_satirSecildi(e) {
			e = e || {};
			let rec = e.rec || this.grupListePart.selectedRec;
			this.aktifGrupKod = (rec || {}).kod || null;
			await this.tazele(e);
		}

		altListe_satirTiklandi(e) {
			e = e || {};
			const part = this.altListePart;
			const eArgs = e.event ? e.event.args : null;
			let index = eArgs ? eArgs.boundIndex : null;
			index = index == null ? part.selectedIndex : index;
			const rec = part.listeRecs[index] || part.selectedBoundRec;
			const lastSelectedIndex = e.lastSelectedIndex == null ? part.lastSelectedIndex : e.lastSelectedIndex;
			
			if (rec && index != null && index == lastSelectedIndex) {
				// part.listeWidget.beginRowEdit(index);
				let elm = part.divListe.find(`.jqx-grid-table .listeSatir[data-index=${index}] .miktar`);
				if (elm.length) {
					if (e.event)
						e.event.stopPropagation();
					
					setTimeout(e => {
						let elm = e.elm;
						let parent = elm.parent();
						if (!parent.length)
							return;
						
						const rec = e.rec;
						let fra = this.app.brm2Fra[rec.brm || 'AD'] || 0;
						
						parent.removeClass('jqx-hidden');
						elm = e.elm[0];
						let savedHTML = elm.outerHTML;
						elm.outerHTML = (
							`<form action="" autocomplete="false" readonly onfocus="this.removeAttribute('readonly')" onsubmit="javascript:return false">` +
							`	<input class="miktar" maxlength="9" autocomplete="off" value="${roundToFra(rec.miktar, fra) || 1}"></input>` +
							`</form>`
						);
						elm = parent.find('.miktar');
						elm.off('keyup').on('keyup', evt => {
							const key = (evt.key || '').toLowerCase();
							if (key == 'enter' || key == 'linefeed')
								setTimeout(() => elm.blur(), 50);
						});
						elm.off('change').on('change', evt => {
							rec.miktar = roundToFra(evt.target.value, fra) || 1;
							// this.altListePart.listeWidget.refresh();
						});
						elm.off('blur').on('blur', evt => {
							parent.addClass('jqx-hidden');
							setTimeout(() => setButonEnabled(this.genelIslemTuslari, true), 1)
							this.altListePart.listeWidget.refresh();
						});
						setButonEnabled(this.genelIslemTuslari, false);
						elm.focus();
						elm.select();
					}, 10, { elm: elm, rec: rec, index: index });
				}
			}
		}

		altListe_satirSecimDegisti(e) {
		}

		async onResize(e) {
			await super.onResize(e);

			const {altListePart} = this;
			if (altListePart && !altListePart.isDestroyed)
				altListePart.divListe.jqxDataTable('height', $(window).height() - this.divListe.height() - 132);
		}
	}
})()
