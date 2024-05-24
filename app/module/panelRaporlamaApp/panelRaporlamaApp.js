(function() {
	window.PanelRaporlamaApp = class extends window.Module {
		constructor(e) {
			super(e);

			$.extend(this, {
				tip: qs.tip || qs.raporTip || '',
				initFlags: {}
			});

			// this.updateWSUrlBase();

			const extLogin = this.extensions.login;
			$.extend(extLogin.options, {
				isLoginRequired: true,
				loginTypes: $.merge(
					extLogin.defaultLoginTypes || [], [
						{ kod: 'kasiyerLogin', aciklama: '<span style="color: darkgreen;">Kasiyer</span>' }
					])
			});
		}

		static get appName() { return 'panelRaporlamaApp' }
		get defaultRootLayoutName() { return this.appName }
		get appText() { return 'Sky Panel Raporlama' }

		/*updateWSUrlBase(e) {
			this._wsURLBase = updateWSUrlBaseBasit($.extend({}, sky.config, { path: `ws/ticari${this.class.wsURLBase_postfix}` }, getArgsForRandomPort({ port: sky.config.port }), e));
		}*/

		async ilkIslemler(e) {
			try { Utils.disableHistoryBack() }
			catch (ex) { }
			
			try { requestFullScreen() }
			catch (ex) { }

			await super.ilkIslemler(e);
		}

		async run(e) {
			try { await super.run(e) }
			finally { ((window.savedProcs || {}).hideProgress || hideProgress)() }
		}

		async preInitLayout(e) {
			e = e || {};
			
			showProgress(null, null, 1);
			let promise = this.tanimlarPromise = this.getWSTanimlar(e);
			await super.preInitLayout(e);
			
			await this.preInitUI(e);

			setTimeout(() => {
				hideProgress();
				this.knobProgressHideWithReset({ delayMS: 10 });
			}, 2500);

			const tanimlar = this.tanimlar = await promise;
			await this.tanimlarYuklendi(tanimlar);
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
					grid: layout.find(`#grid.part`)
					// test: layout.find('#test.part')
				},
				btnLogout: layout.find(`#btnLogout`),
				btnToggleResponsivePanel: layout.find(`#btnToggleResponsivePanel`),
				nav: layout.find(`#nav`),
				innerContent: layout.find(`#innerContent`),
				divRaporlarEtiket: layout.find(`#nav .raporlarEtiket`),
				raporMenu: layout.find(`#nav #raporMenu`),
				raporIslemTuslari: layout.find(`#nav #raporIslemTuslari`),
				btnBaslat: layout.find(`#nav #raporIslemTuslari #btnBaslat`),
				filtreParent: layout.find(`#nav #filtreParent`),
				donemFiltreParent: layout.find(`#nav #donemFiltreParent`),
				tarihBilgiParent: layout.find(`#nav #tarihBilgiParent`),
				labelTarih: layout.find(`#nav #tarihBilgiParent #tarih`),
				degiskenTarihParent: layout.find(`#nav #degiskenTarihParent`),
				subeListeParent: layout.find(`#nav #subeListeParent`),
				zListeParent: layout.find(`#nav #zListeParent`),
				divRaporAdi2: layout.find(`#innerContent #raporAdi2`),
				raporIcerikParent: layout.find(`#innerContent #raporIcerikParent`)
			});
			// this.aktarimProgressCompleted({ defer: true, delaySecs: 5, text: `İlk İşlemler tamamlandı` });
			
			this.innerContent.height($(window).height() - 100);

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
			/*layout.find(`#btnTest`)
				.jqxButton({ theme: theme })
				.on('click', evt => this.testIstendi(e));*/
			this.btnBaslat
				.jqxButton({ theme: theme })
				.on('click', evt => this.baslatIstendi($.extend({}, e, { event: evt })));
			
			this.divRaporlarEtiket
				.on('click', evt => this.raporAdiTiklandi($.extend({}, e, { event: evt })));
			this.divRaporAdi2
				.on('click', evt => this.raporAdiTiklandi($.extend({}, e, { event: evt })));
			
			const nav = this.nav.jqxResponsivePanel({
				theme: theme, animationType: animationType,
				toggleButtonSize: 40, collapseBreakpoint: 900,
                toggleButton: layout.find(`#btnToggleResponsivePanel`),
                autoClose: false, animationShowDelay: 'slow', animationHideDelay: 'slow'
			});
			nav.on('open', evt => this.onResponsivePanelChanged($.extend({}, e, { event: evt, open: true })));
			nav.on('close', evt => this.onResponsivePanelChanged($.extend({}, e, { event: evt, open: false })));

			this.subeListeParent.removeClass('jqx-hidden');
			this.subeListeInit(e);
			this.subeListePart.tazele();
		}

		postInitUI(e) {
			const layout = e.layout || this.layout;
			this.destroyWindows();
		}

		async afterRun(e) {
			await super.afterRun(e);
		}

		async getWSTanimlar(e) {
			let tanimlar;
			if (this.class.isTest) {
				tanimlar = {
					raporlar: [
						{
							kod: 'hasilatRaporu', aciklama: 'Hasılat Raporu',
							filtreler: [
								{ kod: 'aktifSatis', aciklama: 'Aktif Satış' },
								{ kod: 'donemsel', label: 'Dönemsel' },
								{ kod: 'zBazinda', aciklama: 'Z Bazında' }
							],
							icerik: {
								tipIcinHasilat: {
									tip: 'grid',
									baslik: 'Tip için Hasılat',
									kolonlar: [
										{ dataField: 'aciklama', text: 'Açıklama' },
										{ dataField: 'bedel', text: 'Bedel', cellsFormat: 'c2', cellsAlign: 'right' },
										{ dataField: 'yuzde', text: '%', cellsFormat: 'n', cellAlign: 'r' }
									]
								},
								tahsilat: {
									tip: 'grid',
									baslik: 'Tahsilat',
									kolonlar: [
										{ dataField: 'aciklama', text: 'Açıklama' },
										{ dataField: 'bedel', text: 'Bedel', cellsFormat: 'c2', cellsAlign: 'right' },
										{ dataField: 'yuzde', text: '%', cellsFormat: 'n', cellAlign: 'r' }
									]
								}
							}
						},
						{
							kod: 'urunAnalizi', aciklama: 'Ürün Analizi',
							filtreler: [
								{ kod: 'aktifSatis', aciklama: 'Aktif Satış' },
								{ kod: 'donemsel', aciklama: 'Dönemsel' }
							],
							icerik: {
								urunAnalizi: {
									tip: 'grid',
									baslik: 'Ürün Analizi',
									kolonlar: [
										{ dataField: 'aciklama', text: 'Açıklama' },
										{ dataField: 'bedel', text: 'Bedel', cellsFormat: 'c2', cellsAlign: 'right' },
										{ dataField: 'yuzde', text: '%', cellsFormat: 'n', cellAlign: 'r' }
									]
								}
							}
						}
					],
					tarihBilgiText: `<div><b>02.01.2021</b> , 09:38</div><div>&nbsp;&nbsp;-> ...</div>`
				}
			}
			else {
				try {
					lastAjaxObj = $.get({
						cache: true,
						url: `${this.wsURLBase}skyPanelRaporlama_tanimlar`,
						data: this.buildAjaxArgs({
							tip: this.tip || '',
							appUniqueId: this.appUniqueId || ''
						})
					});
					tanimlar = (await lastAjaxObj) || {}
				}
				catch (ex) {
					((window.savedProcs || {}).hideProgress || hideProgress)();
					defFailBlock(ex);
					throw ex;
				}
			}

			return tanimlar;
		}

		tanimlarYuklendi(e) {
			const {tanimlar, raporMenu} = this;
			const {raporlar} = tanimlar;
			for (let i in raporlar) {
				const rapor = raporlar[i];
				if (!rapor.id) {
					rapor.id = rapor.kod || rapor.key;
					delete rapor.kod;
					delete rapor.key;
				}
				if (!(rapor.html || rapor.label)) {
					rapor.html = rapor.aciklama;
					delete rapor.aciklama;
				}
				
			}
			this.id2Rapor = asDict(raporlar, rec => ({ key: rec.id || rec.key, value: rec }));
			raporMenu
				.jqxMenu({ theme: theme, source: raporlar })
				.off('itemclick')
				.on('itemclick', evt =>
					this.raporDegisti($.extend({}, e, { id: evt.args.id, event: evt })))
				.off('keyup')
				.on('keyup', evt => {
					const key = (evt.key || '').toLowerCase();
					if (key == 'enter' || key == 'linefeed')
						this.baslatIstendi(e);
				});
			const raporMenuItems = this.raporMenuItems = raporMenu.find('ul > li');
			raporMenuItems.addClass(`box`);
			
			if (!this.aktifRaporId && raporMenuItems.length)
				raporMenuItems.eq(0).click();

			setTimeout(() => {
				if (qs.otoBaslat)
					this.baslatIstendi();
				
				((window.savedProcs || {}).hideProgress || hideProgress)();
				this.knobProgressHideWithReset({ delayMS: 10 });
			}, 500);
		}

		donemFiltreInit() {
			const {initFlags} = this;
			if (initFlags.donemFiltre) {
				this.donemFiltreParent.children(`:eq(0)`)
					.jqxRadioButton('check');
			}
			else {
				const filtreler = [
					{ kod: 'bugun', aciklama: 'Bugün' },
					{ kod: 'dun', aciklama: 'Dün' },
					{ kod: 'buHafta', aciklama: 'Bu Hafta' },
					{ kod: 'buAy', aciklama: 'Bu Ay' },
					{ kod: 'degiskenTarih', aciklama: 'Değişken Tarih' }
				];
				this.filtreUIOlustur({
					filtreler: filtreler,
					parent: this.donemFiltreParent,
					degisince: e => this.donemFiltreDegisti(e)
				});
				initFlags.donemFiltre = true;
			}
		}

		degiskenTarihInit(e) {
			const {initFlags} = this;
			if (!initFlags.degiskenTarih) {
				const {degiskenTarihParent} = this;
				$.each(degiskenTarihParent.find(`.tarih`), (_, tarihUI) => {
					const id = tarihUI.id;
					const part = this[`${id}Part`] = new TarihPart({ layout: $(tarihUI) });
					part.layout.on('keyup', evt => {
						const key = (evt.key || '').toLowerCase();
						if (key == 'enter' || key == 'linefeed')
							this.baslatIstendi(e);
					});
					part.basicRun();
				});
				initFlags.degiskenTarih = true;
			}
		}

		zListeInit(e) {
			const {initFlags} = this;
			if (initFlags.zListe) {
				const part = this.zListePart;
				part.tazele();
			}
			else {
				const part = this.zListePart = new DataTablePart({
					layout: this.zListeParent.find(`#zListe`),
					widgetBeforeInit: _e => {
						$.extend(_e.widgetArgs, {
							pageable: true, pageSize: 5,
							filterable: false, filterMode: 'simple',
							serverProcessing: false
						})
					},
					widgetAfterInit: _e => {
						const {widgetPart} = _e;
						widgetPart.on('rowDoubleClick', evt =>
							this.baslatIstendi(e));
					},
					columns: [
						{ dataField: 'zSayac', hidden: true },
						{ dataField: 'zNo', text: ' ', width: 35, cellsFormat: 'n', cellsAlign: 'right', cellClassName: 'bold' },
						{ dataField: 'aciklama', text: 'Z Listesi' }
					],
					loadServerData: async e => {
						let subeKod;
						(() => {
							const recs = this.subeListePart.widget.getSelection();
							if (!$.isEmptyObject(recs))
								subeKod = recs[0].kod;
						})();
						
						let recs;
						if (this.class.isTest) {
							recs = [
								{ zSayac: 1, zNo: 1, aciklama: 'a-1' },
								{ zSayac: 2, zNo: 2, aciklama: 'a-2' }
							]
						}
						else {
							try {
								lastAjaxObj = $.get({
									cache: true,
									url: `${this.wsURLBase}restoran_zListe`,
									data: this.buildAjaxArgs({
										tip: this.tip || '',
										appUniqueId: this.appUniqueId || '',
										subeKod: subeKod == null ? '*' : (subeKod || '')
									})
								});
								recs = (await lastAjaxObj) || [];
								recs = recs.rows || recs;
							}
							catch (ex) {
								((window.savedProcs || {}).hideProgress || hideProgress)();
								defFailBlock(ex);
								throw ex;
							}
						}
						return recs
					}
				});
				part.basicRun();
				this.initFlags.zListe = true;
			}
		}

		subeListeInit(e) {
			const {initFlags} = this;
			if (initFlags.subeListe) {
				const part = this.subeListePart;
				part.tazele();
			}
			else {
				const part = this.subeListePart = new DataTablePart({
					layout: this.subeListeParent.find(`#subeListe`),
					widgetBeforeInit: _e => {
						$.extend(_e.widgetArgs, {
							pageable: true, pageSize: 5, pagerHeight: 26,
							filterable: false, filterMode: 'simple',
							serverProcessing: false
						})
					},
					widgetAfterInit: _e => {
						const {widgetPart} = _e;
						widgetPart.on('rowSelect', evt =>
							this.subeDegisti($.extend({}, e, { event: evt })));
						widgetPart.on('rowDoubleClick', evt =>
							this.baslatIstendi($.extend({}, e, { event: evt })));
					},
					columns: [
						{ dataField: 'kod', text: ' ', width: 50, cellClassName: 'bold' },
						{ dataField: 'aciklama', text: 'Şube Listesi' }
					],
					loadServerData: async e => {
						let recs;
						if (this.class.isTest) {
							recs = [
								{ kod: '', aciklama: '-Merkez-' },
								{ kod: '01', aciklama: 'Okyanus' },
								{ kod: '02', aciklama: 'Dolphin' },
								{ kod: '04', aciklama: 'Törekent' }
							]
						}
						else {
							try {
								lastAjaxObj = $.get({
									cache: true,
									url: `${this.wsURLBase}subeListe`,
									data: this.buildAjaxArgs({
										tip: this.tip || '',
										appUniqueId: this.appUniqueId || ''
									})
								});
								recs = (await lastAjaxObj) || [];
								recs = recs.rows || recs;
								recs.unshift({ kod: '', aciklama: '-Merkez-' });
							}
							catch (ex) {
								((window.savedProcs || {}).hideProgress || hideProgress)();
								defFailBlock(ex);
								throw ex;
							}
						}
						return recs
					}
				});
				part.basicRun();
				this.initFlags.subeListe = true;
			}
		}
		
		raporIcerik_initGrid(e) {
			const content = this.templates.grid.contents(`div`).clone(true);
			content.find(`.baslik`)
				.html(e.baslik || '');

			const gridLayout = content.find(`.grid`);
			content.appendTo(this.raporIcerikParent);

			const columns = e.kolonlar || e.columns || [];
			const groups = e.gruplar || e.groups || [];
			for (let i in columns) {
				const col = columns[i];
				if (col.aggregates && !col.aggregatesRenderer) {
					col.aggregatesRenderer = aggregates => {
						let result = '';
						$.each(aggregates, (key, value) => {
							let name = key;
							switch (key) {
								case 'sum': name = 'Toplam'; break;
								case 'avg': name = 'Ort'; break;
								case 'min': name = 'Min'; break;
								case 'max': name = 'Max'; break;
							}
							if (result)
								result += '<br/>';
							result += `${name}: <span class="bold">${value}</span>`;
						});
						return result;
					};
				}
			}

			let part = new DataTablePart({
				layout: gridLayout,
				widgetBeforeInit: _e => {
					$.extend(_e.widgetArgs, {
						pageable: asBool(e.pageable), pageSize: 10,
						showAggregates: true, serverProcessing: false,
						pagerHeight: 26, statusBarHeight: 28, aggregatesHeight: 28,
						filterable: true, /*filterMode: 'simple',*/ filterHeight: 35
						/*groupsRenderer: (value, rec, level) =>
							"Supplier Name: " + value*/
					})
				},
				groups: groups,
				columns: columns,
				loadServerData: _e => {
					const gridDataSource = this.gridDataSource || {};
					return gridDataSource[e.belirtec] || []
				},
				widgetAfterInit: _e => {
					const {widgetPart, widget} = _e;
					const hasGroups = !$.isEmptyObject(groups);
					if (hasGroups || widget.pageable) {
						if (hasGroups) {
							let flag = widget.showAggregates;
							try { widgetPart.jqxDataTable('groups', groups) }
							catch (ex) {}
						}

						const {aggregates} = widget;
						if (aggregates && aggregates.length)
							aggregates.addClass('hasGroups');
					}
				}
			});
			part.basicRun();

			const {parts} = this;
			const grids = parts.grids = parts.grids || [];
			grids.push(part);
		}

		async gridDataSourceOlustur(e) {
			e = e || {};
			const {layout} = this;
			let {gridDataSource} = this;
			if (!gridDataSource) {
				const {aktifFiltreID, aktifDonemFiltreID} = this;
				let donemFiltreID, tarihBS, subeKod, zSayac, zNo;
				let recs = this.subeListePart.widget.getSelection();
				if (!$.isEmptyObject(recs))
					subeKod = recs[0].kod;
				if (aktifFiltreID == 'zBazinda') {
					recs = this.zListePart.widget.getSelection();
					if (!$.isEmptyObject(recs)) {
						const rec = recs[0];
						zSayac = asInteger(rec.zSayac) || 0;
						zNo = asInteger(rec.zNo) || 0;
					}
				}
				if (aktifFiltreID == 'donemsel') {
					donemFiltreID = aktifDonemFiltreID;
					if (aktifDonemFiltreID == 'degiskenTarih') {
						tarihBS = {
							basi: dateToString(this.tarihBasiPart.tarih) || null,
							sonu: dateToString(this.tarihSonuPart.tarih) || null
						};
					}
				}

				const rapor = this.id2Rapor[this.aktifRaporId];
				const raporAdi = rapor.label || rapor.html || rapor.aciklama;
				layout.find(`.raporAdi`).html(raporAdi);
				
				const gridIDListe = [];
				$.each(rapor.icerik, (id, tanim) => {
					if (id && tanim.tip == 'grid')
						gridIDListe.push(id)
				});

				const wsArgs = $.extend({
					tip: this.tip || '',
					appUniqueId: this.appUniqueId || '',
					raporID: this.aktifRaporId || '',
					gridIDListe: gridIDListe.join('|'),
					filtreID: this.aktifFiltreID || '',
					donemFiltreID: donemFiltreID || '',
					subeKod: subeKod == null ? '*' : (subeKod || ''),
					zSayac: zSayac || '',
					zNo: zNo || '',
					tarihBasi: (tarihBS || {}).basi || '',
					tarihSonu: (tarihBS || {}).sonu || ''
				}, e.ekArgs || {});

				gridDataSource = {};
				if (this.class.isTest) {
					gridDataSource = { icerik: {} };
					gridIDListe.forEach(gridID => {
						gridDataSource.icerik[gridID] = [
							{ id: 1, aciklama: 'a-1', bedel: 123.45, yuzde: 3 },
							{ id: 2, aciklama: 'a-2', bedel: 200.00, yuzde: 8 },
							{ id: 2, aciklama: 'a-3', bedel: 350.00, yuzde: 10 }
						]
					});
				}
				else {
					try {
						lastAjaxObj = $.get({
							cache: true,
							url: `${this.wsURLBase}skyPanelRaporlama_gridIcerik`,
							data: this.buildAjaxArgs(wsArgs)
						});
						gridDataSource = (await lastAjaxObj) || {};
					}
					catch (ex) {
						((window.savedProcs || {}).hideProgress || hideProgress)();
						defFailBlock(ex);
						throw ex;
					}
				}

				if (!gridDataSource.icerik)
					gridDataSource = { icerik: gridDataSource };
				
				const divRaporAdi2 = layout.find(`#raporAdi2`);
				let raporEkAdi = gridDataSource.ekLabel || gridDataSource.ekHTML || gridDataSource.ekAciklama ||
									rapor.ekLabel || rapor.ekHTML || rapor.ekAciklama ||
									'';
				if (!raporEkAdi) {
					const {subeText, donemText} = gridDataSource;
					if (subeText || donemText)
						raporEkAdi += `<div class="ekBilgi" style="font-size: 70%;">`;
					if (subeText)
						raporEkAdi += `<span class="_veri">${subeText || ''}</span>`
					if (donemText)
						raporEkAdi += `<span class="_veri">${donemText || ''}</span>`
					if (subeText || donemText)
						raporEkAdi += `</div>`;
				}
				if (raporEkAdi)
					divRaporAdi2.html(`${divRaporAdi2.html()} ${raporEkAdi}`);
				
				this.gridDataSource = gridDataSource.icerik;
			}

			return gridDataSource;
		}

		/*testIstendi(e) {
			let part = new GridliRaporTestPart();
			part.basicRun();
		}*/

		raporAdiTiklandi(e) {
			const panelWidget = this.nav.jqxResponsivePanel('getInstance');
			setTimeout(() => {
				if (this.raporAlindimi && panelWidget.isOpened())
					panelWidget.close()
				else
					panelWidget.open();
			}, 10);
		}

		async baslatIstendi(e) {
			e = e || {};
			const {aktifRaporId, raporAlindimi, parts} = this;
			((window.savedProcs || {}).showProgress || showProgress)(null, null, 1, false);
			const {raporIcerikParent, innerContent} = this;
			if (this.innerContentHideTimer) {
				clearTimeout(this.innerContentHideTimer);
				delete this.innerContentHideTimer;
			}
			
			if (!aktifRaporId) {
				((window.savedProcs || {}).hideProgress || hideProgress)();
				this.innerContentHideTimer = setTimeout(() => {
					innerContent.css('opacity', 1);
					innerContent.removeClass(`basic-hidden jqx-hidden`);
				}, 0);
				return;
			}
			
			const rapor = this.id2Rapor[aktifRaporId];
			const {icerik} = rapor;
			
			this.nav.jqxResponsivePanel('close');

			const grids = parts.grids = parts.grids || [];
			delete this.gridDataSource;
			for (let i in grids) {
				if (!this.gridDataSource)
					await this.gridDataSourceOlustur(e);
				
				const gridPart = grids[i];
				if (raporAlindimi)
					gridPart.tazele();
				else
					gridPart.destroyPart();
			}
			if (!raporAlindimi) {
				raporIcerikParent.children().remove();
				innerContent.css(`opacity`, .01);
				for (const belirtec in icerik) {
					const tanim = icerik[belirtec];
					switch (tanim.tip) {
						case 'grid':
							if (!this.gridDataSource)
								await this.gridDataSourceOlustur(e);
							this.raporIcerik_initGrid($.extend({}, e, tanim, { belirtec: belirtec }, tanim))
							break;
					}
				}
			}
			((window.savedProcs || {}).hideProgress || hideProgress)();
			this.innerContentHideTimer = setTimeout(() => {
				innerContent.css('opacity', 1);
				innerContent.removeClass(`basic-hidden jqx-hidden`);
			}, 0);
			
			this.raporAlindimi = true;
		}

		subeDegisti(e) {
			e = e || {};
			let subeKod;
			const recs = this.subeListePart.widget.getSelection();
			if (!$.isEmptyObject(recs))
				subeKod = recs[0].kod;
			
			if (subeKod != null && this.aktifFiltreID == 'zBazinda') {
				const {zListePart} = this;
				if (zListePart)
					zListePart.tazele();
			}
		}

		raporDegisti(e) {
			const target = $(e.event.target);
			target.parent().children().removeClass(`selected`);
			target.addClass(`selected`);

			const raporID = e.id;
			if (!raporID || raporID == this.aktifRaporId)
				return;
			
			const {layout, innerContent} = this;

			this.aktifRaporId = raporID;
			const rapor = this.id2Rapor[raporID];
			const raporAdi = rapor.label || rapor.html || rapor.aciklama;
			layout.find(`.raporAdi`).html(raporAdi);

			const filtreler = rapor.filtreler || [];
			this.id2Filtre = asDict(filtreler, rec => ({ key: rec.id || rec.kod, value: rec }));
			this.filtreUIOlustur({
				filtreler: filtreler,
				parent: this.filtreParent,
				degisince: e => this.filtreDegisti(e)
			});

			const {parts} = this;
			const grids = parts.grids = parts.grids || [];
			for (let i in grids) {
				const gridPart = grids[i];
				gridPart.destroyPart();
			}
			grids.splice(0);
			innerContent.addClass(`basic-hidden`);
			this.raporAlindimi = false;
			this.nav.jqxResponsivePanel('open');
		}

		filtreDegisti(e) {
			const {tanimlar, donemFiltreParent, zListeParent, tarihBilgiParent, labelTarih} = this;
			const filtreID = e.id;
			if (!filtreID || filtreID == this.aktifFiltreID)
				return;
			
			this.aktifFiltreID = filtreID;
			
			this.hideAll();
			donemFiltreParent.addClass(`jqx-hidden`);
			tarihBilgiParent.addClass(`jqx-hidden`);
			
			const {tarihBilgiText} = tanimlar;
			switch (filtreID) {
				case 'aktifSatis':
					if (tarihBilgiText)
						tarihBilgiParent.removeClass('jqx-hidden');
					labelTarih.html(tanimlar.tarihBilgiText || '');
					break;
				case 'donemsel':
					// tarihBilgiParent.removeClass('jqx-hidden');
					donemFiltreParent.removeClass('jqx-hidden');
					this.donemFiltreInit(e);
					/*if (tanimlar.tarihBilgiText)
						tarihBilgiParent.removeClass('jqx-hidden');
					labelTarih.html(tarihBilgiText || '');*/
					break;
				case 'zBazinda':
					zListeParent.removeClass('jqx-hidden');
					this.zListeInit(e);
					this.zListePart.tazele();
					break;
			}
		}

		donemFiltreDegisti(e) {
			const {tanimlar} = this;
			const filtreID = this.aktifDonemFiltreID = e.id;
			if (!filtreID)
				return;
			
			this.hideAll();
			switch (filtreID) {
				case 'degiskenTarih':
					this.tarihBilgiParent.addClass(`jqx-hidden`);
					this.degiskenTarihParent.removeClass('jqx-hidden');
					this.degiskenTarihInit(e);
					break;
			}
		}

		filtreUIOlustur(e) {
			const {parent, filtreler} = e;
			parent.children().remove();
			const handler = e.degisince;
			for (let i in (filtreler || [])) {
				const filtre = filtreler[i];
				const filtreUI = $(`<button id="${filtre.id || filtre.kod}" class="filtre box">${filtre.html || filtre.label || filtre.aciklama}</button>`)
				filtreUI.appendTo(parent);
				filtreUI.jqxRadioButton({
					theme: theme,
					groupName: parent.prop('id') })
				.off('change')
				.on('change', evt => {
					if (evt.args.checked && $.isFunction(handler)) {
						const {target} = evt;
						handler.call(this, $.extend({}, e, {
							tip: target.parentElement.id,
							id: target.id,
							event: evt
						}));
					}
				})
				.off('keyup')
				.on('keyup', evt => {
					const key = (evt.key || '').toLowerCase();
					if (key == 'enter' || key == 'linefeed')
						this.baslatIstendi(e);
				});
			}

			if (!$.isEmptyObject(filtreler)) {
				parent.children(`:eq(0)`)
					.jqxRadioButton('check');
			}
		}

		hideAll() {
			[this.degiskenTarihParent, this.zListeParent].forEach(parent =>
				parent.addClass(`jqx-hidden`));
		}

		onResponsivePanelChanged(e) {
			e = e || {};
			$(window).trigger('resize');
			
			/*const grids = (this.parts || {}).grids || [];
			for (let i in grids) {
				const gridPart = grids[i];
				const {widgetPart, widget} = gridPart;
				if (widgetPart && widgetPart.length)
					widget.refresh();
			}*/
		}
	}
})()
