(function() {
	window.SosyalDurumDegerlendirmePart = class extends window.SosyalDurumPartBase {
		constructor(e) {
			e = e || {};
			super(e);
		}

		static get partName() { return 'degerlendirme' }
		get adimText() { return 'Değerlendirme Ekranı' }


		preInitLayout(e) {
			e = e || {};
			super.preInitLayout(e);

			const layout = e.layout || this.layout;
			const islemTuslariEk = this.islemTuslariEk = layout.find(`#islemTuslari-ek`);
			$.extend(this, {
				btnGeri: islemTuslariEk.find(`#geri`),
				btnBaslat: islemTuslariEk.find(`#baslat`)
			});
			
			islemTuslariEk.find(`button`)
				.jqxButton({ theme: theme })
				.off('click').on('click', evt => {
					const {id} = evt.target;
					switch (id) {
						case 'baslat':
							this.tazeleIstendi(e);
							break;
						case 'geri':
							this.geriIstendi(e);
							break;
					}
				});

			// this.tazeleIstendi(e);
		}

		postInitLayout(e) {
			e = e || {};
			super.postInitLayout(e);

			this.initGrid(e);
		}

		destroyPart(e) {
			if (this.gridPart) {
				this.gridPart.destroyPart();
				delete this.gridPart;
			}

			super.destroyPart(e);
		}

		activatePart(e) {
			this.tazeleIstendi(e);
		}

		async tazeleIstendi(e) {
			setButonEnabled(this.btnBaslat, false);
			showProgress(`Değerlendirme Bilgisi merkezden alınıyor...`, ` `, 10);
			try {
				let result = await this.wsDegerlendirmeBilgi(e)
				await this.veriYuklendi($.extend({}, e, { result: result }));
			}
			catch (ex) {
				defFailBlock(ex)
			}
			finally {
				setTimeout(() => {
					((window.savedProcs || {}).hideProgress || hideProgress)();
					hideProgress();
					setButonEnabled(this.btnBaslat, true);
				}, 150);
			}
		}

		initGrid(e) {
			/*const groups = e.gruplar || e.groups || [];
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
			}*/

			const {layout} = this;
			let groups = [],
				columns = [];
			let part = this.gridPart = new DataTablePart({
				layout: layout.find(`#gridParent #grid`),
				widgetBeforeInit: _e => {
					$.extend(_e.widgetArgs, {
						serverProcessing: false,
						pageable: true, pageSize: 15,
						pagerHeight: 26, statusBarHeight: 28,
						showAggregates: true, aggregatesHeight: 28,
						filterable: true, filterHeight: 35 /*, filterMode: 'simple',*/
						/*groupsRenderer: (value, rec, level) =>
							"Supplier Name: " + value*/
					})
				},
				groups: groups,
				columns: [
					{ dataField: 'seq', filterable: false, hidden: true },
					{ dataField: 'attr', filterable: false, hidden: true },
					{ dataField: 'hesap', text: 'Hesap', align: 'left', filterable: false, hidden: true },
					{ dataField: 'aciklama', text: 'Açıklama', align: 'left', filterable: true },
					{ dataField: 'ekBilgi1', text: ' ', align: 'left', filterable: true, width: '25%' },
					{ dataField: 'ekBilgi2', text: ' ', align: 'left', filterable: true, width: '25%' }
				],
				loadServerData: _e => {
					return this.gridData || []
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
			this.gridPart = part;
		}

		veriYuklendi(e) {
			const {app} = this;
			const {result} = e;
			const {kisiRec, gridData} = result;
			const tanimlar = app.tanimlar = app.tanimlar || {};
			if (kisiRec)
				tanimlar.kisiRec = kisiRec;
			$.extend(this, {
				wsData: result,
				gridData: gridData
			});

			if (gridData)
				this.gridPart.tazele();
		}

		async wsDegerlendirmeBilgi(e) {
			const {app} = this;
			const {kisiSayac} = app;
			let result;
			try {
				lastAjaxObj = $.get({
					cache: true,
					url: `${this.wsURLBase}degerlendirmeBilgi`,
					data: this.buildAjaxArgs({ kisiSayac: kisiSayac })
				});
				result = (await lastAjaxObj) || {}
			}
			catch (ex) {
				((window.savedProcs || {}).hideProgress || hideProgress)();
				hideProgress();
				// defFailBlock(ex);
				throw ex;
			}

			return result;
		}

		async onResize(e) {
			await super.onResize(e);

			const {gridPart} = this;
			const listeParent = gridPart.widgetPart.parent();
			listeParent.height($(window).height() - listeParent.offset().top - 13);
		}
	}
})()
