(function() {
	window.CETCariListePart = class extends window.CETListeOrtakPart {
		constructor(e) {
			e = e || {};
			super(e);

			this.idSaha = null;

			if (!(this.layout || this.template))
				this.template = this.app.templates.cariListe;
		}

		static get canDefer() { return false }
		static get canDestroy() { return false }
		static get partName() { return 'cetCariListe' }
		get adimText() { return 'Müşteri Listesi' }


		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);

			const layout = e.layout || this.layout;
			const divIslemTuslari = this.islemTuslari;
			const btnYeni = divIslemTuslari.find(`#yeni`);
			btnYeni.jqxButton({ theme: theme, width: 40, height: 40 });
			btnYeni.jqxTooltip({ theme: theme, trigger: `hover`, content: `Yeni Cari tanımla` });
			btnYeni.on('click', evt =>
				this.yeniIstendi($.extend({}, e, { event: evt})));
		}

		async activatePart(e) {
			e = e || {};
			await super.activatePart(e);

			const {btnToggleFullScreen, chkOtoAktar, btnGonderimIsaretSifirla} = sky.app;
			if (btnToggleFullScreen && btnToggleFullScreen.length)
				btnToggleFullScreen.addClass(`jqx-hidden`);
			if (chkOtoAktar && chkOtoAktar.length)
				chkOtoAktar.addClass(`jqx-hidden`);
			if (btnGonderimIsaretSifirla && btnGonderimIsaretSifirla.length)
				btnGonderimIsaretSifirla.addClass(`jqx-hidden`);
			
			this.tazele()
		}

		async deactivatePart(e) {
			e = e || {};
			const {btnToggleFullScreen, chkOtoAktar, btnGonderimIsaretSifirla} = sky.app;
			setTimeout(() => {
				if (btnToggleFullScreen && btnToggleFullScreen.length)
					btnToggleFullScreen.removeClass(`jqx-hidden`);
				if (chkOtoAktar && chkOtoAktar.length)
					chkOtoAktar.removeClass(`jqx-hidden`);
				if (btnGonderimIsaretSifirla && btnGonderimIsaretSifirla.length)
					btnGonderimIsaretSifirla.removeClass(`jqx-hidden`);
			}, 100);
			
			await super.deactivatePart(e);
		}

		async listeArgsDuzenle(e) {
			await super.listeArgsDuzenle(e);
			
			$.extend(e.listeArgs, {
				autoRowHeight: true, pageable: true, showToolbar: false, filterable: true,
				serverProcessing: true, filterMode: 'default',
				height: $(window).height() - 100
			});
		}

		async liste_columnsDuzenle(e) {
			await super.liste_columnsDuzenle(e);
			
			const {app} = this;
			const {listeColumns} = e;
			listeColumns.push(...[
				{
					text: 'Müşteri Ünvan', align: 'left', dataField: 'unvan',
					cellsRenderer: (rowIndex, columnIndex, value, rec) => {
						rec = rec.originalRecord || rec;

						const divSatir = this.newListeSatirDiv({ cssSubClass: 'asil' });
						divSatir.attr('data-index', rowIndex);
						$.each(rec, (key, value) => {
							const item = divSatir.find(`.${key}`);
							if (item.length)
								item.html(value);

							if (rec.ilAdi)
								divSatir.find(`.ilAdiParent`).removeClass(`jqx-hidden`);
							
							if (app.eIslemKullanilirmi) {
								if (asBool(rec.efatmi))
									divSatir.find('.eIslemParent').removeClass('jqx-hidden');
								if (rec.zorunluguidstr)
									divSatir.find('.uuidParent').removeClass('jqx-hidden');
							}

							const {konTipKod, konSubeAdi} = rec;
							if (konTipKod) {
								divSatir.find(`.konTipText`).html(app.konsolideTip2Aciklama(konTipKod) || '');
								const parent = divSatir.find(`.konTipTextParent`);
								parent.addClass(`konTip-${konTipKod}`);
								parent.removeClass(`jqx-hidden`)
							}
							if (konSubeAdi) {
								divSatir.find(`.konSubeAdi`).html(konSubeAdi);
								divSatir.find(`.konSubeAdiParent`).removeClass(`jqx-hidden`)
							}
						});
						return divSatir[0].outerHTML.trim();
					}
				},
				{ text: 'Müşteri Kodu', align: 'left', dataField: 'kod', hidden: true },
				{ text: 'VKN/TCKN', align: 'left', dataField: 'vkn', hidden: true },
				{ text: 'Yöre', align: 'left', dataField: 'yore', hidden: true },
				{ text: 'İl Kod', align: 'left', dataField: 'ilKod', hidden: true },
				{ text: 'İl Adı', align: 'left', dataField: 'ilAdi', hidden: true },
				{ text: 'Konsolide Tip', align: 'left', dataField: 'konTipKod', hidden: true },
				{ text: 'Konsolide Şube Adı', align: 'left', dataField: 'konSubeAdi', hidden: true }
			]);
		
			if (!app.bakiyeRiskGosterilmezmi) {
				listeColumns.push({
					text: 'İşlem', align: 'left', dataField: null, width: $(window).width() < 350 ? 90 : 120,
					cellsRenderer: (rowIndex, columnIndex, value, rec) => {
						let divSatir = this.newListeSatirDiv({ cssSubClass: 'islemler' });
						divSatir.attr('data-index', rowIndex);
						$.each(rec, (key, value) => {
							let item = divSatir.find(`.${key}`);
							if (item.length)
								item.html(value);
						});

						const ekleyici = e => {
							if (!e.value)
								return null;

							const {selector, valueGetter} = e;
							let elm = divSatir.find(selector);
							if (elm.length) {
								// elm.addClass(`.${selector.slice(1)}Parent`);
								let value = $.isFunction(valueGetter)
													? valueGetter.call(this, e.value)
													: (valueGetter || e.value);
								if (value) {
									elm.html(value);
									elm.removeClass('jqx-hidden');
								}
								else {
									elm.addClass('jqx-hidden');
								}

								return elm;
							}
							return null;
						}
						ekleyici({
							selector: `.kayitSayisiVefisSonucText`, value: rec,
							valueGetter: val => (
								(rec.kayitSayisi ? `<span class="kayitSayisiText veri">${rec.kayitSayisi.toLocaleString()}</span> <span class="etiket">belge</span>` : ``) +
								(rec.fisSonuc ? `<br/><span class="fisSonucText veri">${bedelStr(rec.fisSonuc)} TL</span>` : ``)
							)
						});
						const bakiye = asFloat(rec.bakiye) || 0;
						const kalanRisk = rec.riskLimiti ? bedel(rec.riskLimiti - rec.riskli) : null;
						const kalanTakipBorc = rec.takipBorcLimiti ? bedel(rec.takipBorcLimiti - rec.takipBorc) : null;
						const divBakiyeVeRiskText = ekleyici({
							selector: `.bakiyeVeRiskText`, value: rec,
							valueGetter: rec => {
								return (
									(rec.bakiye ? `<span class="bakiyeText etiket">B:</span><span class="veri bakiye">${bedelStr(bakiye)}</span>` : ``) +
									(kalanRisk ? ` <span class="kalanRiskText etiket">KR:</span><span class="veri kalanRisk">${bedelStr(kalanRisk)}</span>` : ``) +
									(kalanTakipBorc ? ` <span class="kalanTakipBorcText etiket">KTB:</span><span class="veri kalanTakipBorc">${bedelStr(kalanTakipBorc)}</span>` : ``)
								)
							}
						});
						if (divBakiyeVeRiskText && divBakiyeVeRiskText.length) {
							divBakiyeVeRiskText.find('.bakiye').addClass(bakiye < 0 ? 'red' : 'blue');
							divBakiyeVeRiskText.find('.kalanRisk').addClass(kalanRisk < 0 ? 'red' : '');
							divBakiyeVeRiskText.find('.kalanTakipBorc').addClass(kalanTakipBorc < 0 ? 'red' : '');
						}

						if (asInteger(rec.kayitSayisi))
							divSatir.addClass(`kayitVar`);

						return divSatir[0].outerHTML.trim();
					}
				});
			}
		}
		
		loadServerData_buildQuery(e) {
			const wsArgs = $.extend({}, e.wsArgs, { rowCountOnly: e.rowCountOnly });
			wsArgs.filters = this.getFiltersFromListeWSArgs(wsArgs); wsArgs.sortdatafield = wsArgs.sortdatafield || ['kod'];	 		/* || ['tarih', 'seri', 'fisno'] */
			let stm = new MQStm({ sent: new MQSent({ from: `mst_Cari car`, sahalar: (e.rowCountOnly ? `COUNT(*) sayi` : [	'car.rowid', 'car.*' ]) }) });
			stm.fromGridWSArgs(wsArgs);
			return stm
		}

		liste_selectSavedIndex(e) { /* super.liste_selectSavedIndex(e); */ }

		async yeniIstendi(e) {
			const {app} = this;
			const result = await app.cariTanimIstendi();
			if (!result || result.isError)
				return;
			
			const {inst} = result;
			setTimeout(() => {
				const {listeWidget} = this;
				listeWidget.beginUpdate();
				listeWidget.clearFilters();
				let filterGroup = new $.jqx.filter();
				let filter = filterGroup.createfilter('stringfilter', inst.kod, 'EQUALS');
				filterGroup.addfilter(0, filter);
				listeWidget.addFilter('kod', filterGroup);
				listeWidget.applyFilters();
				listeWidget.endUpdate();

				setTimeout(() => {
					listeWidget.clearSelection();
					listeWidget.selectRow(0);
				}, 200)
			}, 200)
			// setTimeout(() => this.tazele(), 500);
		}
		
		/* liste_renderToolbar(e) {
			const layout = e.layout || this.layout;
			let toolbar = e.listeToolbar;
			let divIslemTuslari = toolbar.find('.toolbar.islemTuslari');
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
			}
		}

		async liste_islemTusuTiklandi(e) {
			let rec = this.selectedBoundRec;
			let elm = e.event.currentTarget;
			switch (elm.id) {
				case '...':
					break;
			}
		} */
	}
})()
