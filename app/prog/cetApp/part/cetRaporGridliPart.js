(function() {
	window.CETRaporGridliPart = class extends window.CETListeOrtakPart {
		static get partName() { return 'cetRaporGridli' } get adimText() { const {rapor} = this; return rapor == null ? super.adimText : `${rapor.class.aciklama} Raporu` }
		constructor(e) {
			e = e || {}; super(e);
			$.extend(this, {
				rapor: e.rapor, idSaha: '', secinceKontrolEdilmezFlag: true, secinceGeriYapilmazFlag: true,
				yazdirIslemi: e => this.rapor.yazdir(e)
			});
			if (!(this.layout || this.template)) { this.template = this.app.templates.cetRaporGridli }
		}
		async postInitLayout(e) {
			e = e || {}; await super.postInitLayout(e); const layout = e.layout || this.layout;
			const btnYazdir = this.btnYazdir = layout.find('#yazdir').jqxButton({ theme: theme, width: 40, height: 35 });
			if (this.yazdirIslemi) {
				btnYazdir.off('click').on('click', evt => this.yazdirIstendi({ ...e, event: evt }));
				btnYazdir.jqxTooltip({ theme, trigger: `hover`, content: `Raporu yazdir` });
			} else { setButonEnabled(btnYazdir, false) }
			const {rapor} = this, toolbar = this.toolbar = layout.find(`#toolbar`);
			const txtUstBilgi = this.txtUstBilgi = layout.find('#ustBilgi'), txtAltBilgi = this.txtAltBilgi = layout.find('#altBilgi');
			const xSatirlari = (value => $.isArray(value) ? value : (value ? [value] : []));
			let arr = xSatirlari(rapor.ustBilgiSatirlari); if ($.isEmptyObject(arr)) { txtUstBilgi.parent().addClass('jqx-hidden') } else { txtUstBilgi.val(arr.join(CrLf)) }
			arr = xSatirlari(rapor.altBilgiSatirlari);
			if ($.isEmptyObject(arr)) { txtAltBilgi.parent().addClass('jqx-hidden') } else { txtAltBilgi.val(arr.join(CrLf)) }
			this.initToolbar({ toolbar });
		}
		initToolbar(e) { }
		async listeArgsDuzenle(e) {
			await super.listeArgsDuzenle(e); $.extend(e.listeArgs, {
				showToolbar: false, columnsHeight: 24, pagerHeight: 30, filterHeight: 28, columnsResize: true, serverProcessing: false, filterMode: 'default',
				pageSize: this.userSettings_liste.pageSize || 20, pageSizeOptions: [10, 13, 15, 20, 25, 30, 35, 40, 50], height: $(window).height() - 97
			});
			let result = await this.rapor.listeArgsDuzenle(e); if (typeof result == 'object') { $.extend(e.listeArgs, result) }
		}
		async liste_columnsDuzenle(e) {
			await super.liste_columnsDuzenle(e); let result = await this.rapor.liste_columnsDuzenle(e);
			if ($.isArray(result)) { e.listeColumns.push(...result) }
			const getCellClassName = (rowIndex, columnField, value) => `listeSatir ${columnField}`;
			for (const col of e.listeColumns) { if (!(col.cellsRenderer || col.cellClassName)) { col.cellClassName = getCellClassName } }
		}
		async loadServerData(e) {
			const {dokumVeri} = await this.rapor;
			let recs = await dokumVeri.detaylar; if (recs) { recs = recs.filter(rec => !rec.noGrid) }
			const {wsArgs, callback} = e; callback({ records: recs, totalrecords: recs.length })
		}
		liste_onFilter(e) {
			e = e || {}; if (!super.liste_onFilter(e)) { return false }
			const {args} = e.event || {}; if (!args) { return false }
			const app = this.app || sky.app, {listeKodDogrudanAramaYapilirmi} = app; if (!listeKodDogrudanAramaYapilirmi) { return false }
			const gridFiltreKodSahalari = listeKodDogrudanAramaYapilirmi ? app.gridFiltreKodSahalari : null;
			const gridFiltreAdiSahalari = listeKodDogrudanAramaYapilirmi ? app.gridFiltreAdiSahalari : null;
			const {listeWidget} = this, {dataview} = listeWidget, {filters} = args;
			listeWidget.beginUpdate();
			for (const i in filters) {
				const filterInfo = filters[i], {datafield, filter} = filterInfo; if (gridFiltreKodSahalari[datafield]) { continue }
				if (!gridFiltreAdiSahalari[datafield]) {
					dataview.removeFilter(datafield); const subFilters = filter.getfilters();
					for (let j in subFilters) { j = asInteger(j); const subFilter = filter.getfilterat(j); subFilter.comparisonoperator = 'EQUAL' }
					dataview.addFilter(datafield, filter)
				}
			}
			listeWidget.endUpdate();
			this.disableFilterEvents = true; listeWidget.applyFilters(); return true
		}
		async tazele(e) { await super.tazele(e); setTimeout(() => this.rapor.tazeleSonrasi(e), 500) }
		async yazdir(e) {
			const {btnYazdir} = this; setButonEnabled(btnYazdir, false); setTimeout(() => setButonEnabled(btnYazdir, true), 2000);
			let {yazdirIslemi: handler} = this; if ($.isFunction(handler)) { return await handler.call(this, e) }
		}
		async yazdirIstendi(e) {
			try { let result = await this.yazdir(e); return result }
			finally { const {app} = this; if (app.hasKnobProgress) { app.knobProgressHideWithReset({ delayMS: 100 }) } else { setTimeout(() => hideProgress(), 100) } }
		}
	}
})()
