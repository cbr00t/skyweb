(function() {
	window.CETFisGirisSonStoktanSecimPart = class extends window.CETListeOrtakPart {
		static get canDestroy() { return false } static get canDefer_slow() { return true } static get noResizeEvent() { return true }
		static get partName() { return 'cetFisGirisSonStoktanSecim' } get fisGirisEkranimi() { return true } get adimText() { return 'Hızlı Fiş Giriş' }
		constructor(e) {
			e = e || {}; super(e); const {app} = this, {fis, sonStokKontrolEdilirmi, sonStokFilterDisabled} = e;
			$.extend(this, {
				islem: e.islem, eskiFis: e.eskiFis, fis,
				sonStokKontrolEdilirmi: sonStokKontrolEdilirmi == null ? (fis.class.sonStokKontrolEdilirmi ?? null) : sonStokKontrolEdilirmi,
				sonStokFilterDisabled: sonStokFilterDisabled == null ? (app.sonStokKontrolEdilirmi && fis.class.sonStokKontrolEdilirmi) : sonStokFilterDisabled,
				secButonuKontrolEdilirmi: false, altListe_rowHeight: 40
			});
			if (!(this.layout ?? this.template)) { this.template = this.app.templates.fisGirisSonStoktanSecim }
		}
		async postInitLayout(e) { e = e || {}; await super.postInitLayout(e) }
		async activatePart(e) {
			e = e || {}; await super.activatePart(e);
			if (this.sonStokKontrolEdilirmi == null) { this.sonStokKontrolEdilirmi = this.savedValue_sonStokKontrolEdilirmi }
			if (this.savedValue_sonStokKontrolEdilirmi == null || this.savedValue_sonStokKontrolEdilirmi != this.sonStokKontrolEdilirmi) { this.savedValue_sonStokKontrolEdilirmi = this.sonStokKontrolEdilirmi }
			await this._initActivatePartOrtak(e); setTimeout(() => this.tazele(), 1000)
		}
		async _initActivatePartOrtak(e) {
			e = e || {}; this.initActivatePartOrtak(e); const layout = e.layout || this.layout;
			const {app, fis} = this, {btnToggleFullScreen, chkOtoAktar, btnGonderimIsaretSifirla} = app;
			if (btnToggleFullScreen?.length) { btnToggleFullScreen.addClass('jqx-hidden') }
			if (chkOtoAktar?.length) { chkOtoAktar.addClass(`jqx-hidden`) }
			if (btnGonderimIsaretSifirla?.length) { btnGonderimIsaretSifirla.addClass('jqx-hidden') }
			const {mustKod} = fis; this.fiyatGorurmu = fis && !fis.class.fiiliCikismi ? app.alimFiyatGorurmu : app.satisFiyatGorurmu; this.bedelKullanilirmi = fis.class.bedelKullanilirmi;
			const mustKod2KosulProYapilari = app.mustKod2KosulProYapilari = app.mustKod2KosulProYapilari || {};
			const promise_ilkIslemler = this.promise_ilkIslemler = new $.Deferred(p => {
				setTimeout(async () => {
					try {
						const mustKod2KosulProYapilari = app.mustKod2KosulProYapilari = app.mustKod2KosulProYapilari || {};
						let kosulProYapilari = mustKod2KosulProYapilari[mustKod] = mustKod2KosulProYapilari[mustKod] || {
							satisKosulYapilari: await fis.getSatisKosulYapilari({ /* kosulTip: ['FY', 'SB', 'KM', 'MF'] */ }),
							promosyonYapilari: await fis.getPromosyonYapilari()
						};
						$.extend(this, kosulProYapilari); p.resolve(kosulProYapilari)
					}
					finally { delete this.promise_ilkIslemler }
				}, 500)
			});
			const divSonucBedel = this.divSonucBedel = layout.find('#sonucBedel-parent > #sonucBedel')
			const divDiger = this.divDiger = layout.find('.diger'), chkSonStoktaOlanlarmi = this.chkSonStoktaOlanlarmi = divDiger.find('#chkSonStoktaOlanlarmi');
			let handler = evt => { this.sonStokKontrolEdilirmi = this.savedValue_sonStokKontrolEdilirmi = chkSonStoktaOlanlarmi.is(':checked'); this.tazele(e) };
			chkSonStoktaOlanlarmi.parent().find('#chkSonStoktaOlanlarmi_label').off('mouseup, touchend')
				.on('mouseup, touchend', evt => { if (!(this.disableEventsFlag || this.sonStokFilterDisabled)) { chkSonStoktaOlanlarmi.prop('checked', !chkSonStoktaOlanlarmi.prop('checked')); handler(evt) } });
			chkSonStoktaOlanlarmi.off('change').on('change', evt => { if (!(this.disableEventsFlag || this.sonStokFilterDisabled)) { handler(evt) }});
			this.disableEventsDo(() => { chkSonStoktaOlanlarmi.prop('checked', this.sonStokKontrolEdilirmi) });
			this.islemTuslariOrtakInit(e);
			const grupListeParent = this.grupListeParent = this.grupListeParent || layout.find(`#grupListeParent`); let {grupListePart} = this;
			if (grupListePart) { grupListePart.tazele() }
			else {
				grupListePart = this.grupListePart = new CETListeOrtakPart({
					isComponent: true, content: false, layout: grupListeParent,
					listeLayout: `#grupListe`, listePartsLayout: '.listeParts',
					widgetDuzenleyici: e => { $.extend(e.listeArgs, { showToolbar: false, columnsHeight: 28, pagerHeight: 30, pageable: false, filterable: false, serverProcessing: false, height: $(window).height() - 90 }) },
					listeColumnsDuzenleFunc: e => this.grupListe_columnsDuzenle(e),
					liste_loadServerData_buildQuery: e => this.grupListe_loadServerData_buildQuery(e), liste_loadServerData_ekIslemler: e => this.grupListe_loadServerData_ekIslemler(e),
					listeSatirSecildiFunc: e => { this.grupListe_satirSecildi(e) }
				});
				grupListePart.run()
			}
			let {genelIslemTuslari} = this; if (!genelIslemTuslari) {
				genelIslemTuslari = this.genelIslemTuslari = layout.find(`.genelIslemTuslari`);
				genelIslemTuslari.jqxMenu({ theme, mode: 'horizontal', animationShowDuration: 0, animationHideDuration: 0 });
			}
			let liItems = genelIslemTuslari.find('ul > li');
			liItems.off('click')
				.on('click', evt => this.islemTusuTiklandi($.extend({}, e, { event: evt })));
			const altListeParent = this.altListeParent = this.altListeParent || layout.find(`#altListeParent`); let {altListePart} = this;
			if (altListePart) { altListePart.tazele() }
			else {
				altListePart = this.altListePart = new CETListeOrtakPart({
					isComponent: true, content: false, layout: altListeParent,
					listeLayout: `#altListe`, listePartsLayout: '.listeParts',
					widgetDuzenleyici: e => {
						const {layout, genelIslemTuslari, altListe_rowHeight} = this;
						$.extend(e.listeArgs, {
							showToolbar: false, columnsHeight: 23, pagerHeight: 30, pageSize: altListePart.userSettings_liste.pageSize || 10, autoRowHeight: true,
							height: $(window).height() - (genelIslemTuslari.position().top + genelIslemTuslari.height()) - (15 + altListe_rowHeight)
						})
					},
					listeColumnsDuzenleFunc: e => this.altListe_columnsDuzenle(e),
					listeDataAdapterOlusturFunc: e => new $.jqx.dataAdapter({ id: 'seq', datatype: 'array', localdata: [] }),
					listeSatirTiklandiFunc: e => this.altListe_satirTiklandi(e), listeSatirCiftTiklandiFunc: e => this.altListe_satirCiftTiklandi(e),
					listeSatirSecimDegistiFunc: e => this.altListe_satirSecimDegisti(e)
				});
				await altListePart.run()
			}
			altListePart.liste_hideFilterBar(); setTimeout(() => layout.parent().removeClass('basic-hidden'), 10); setTimeout(() => hideProgress(), 100)
		}
		async deactivatePart(e) {
			e = e || {}; const {btnToggleFullScreen, chkOtoAktar, btnGonderimIsaretSifirla} = sky.app;
			setTimeout(() => {
				if (btnToggleFullScreen?.length) { btnToggleFullScreen.removeClass('jqx-hidden') }
				if (chkOtoAktar?.length) { chkOtoAktar.removeClass('jqx-hidden') }
				if (btnGonderimIsaretSifirla?.length) { btnGonderimIsaretSifirla.removeClass('jqx-hidden') }
			}, 100);
			await this.grupListePart.deactivatePart(e); await this.altListePart.deactivatePart(e); await super.deactivatePart(e)
		}
		async destroyPart(e) { e = e || {}; await this.grupListePart.destroyPart(e); await this.altListePart.destroyPart(e); await super.destroyPart(e) }
		islemTuslariOrtakInit(e) {
			e = e || {}; const layout = e.layout || this.layout;
			const divDiger = this.divDiger, chkSonStoktaOlanlarmi = this.chkSonStoktaOlanlarmi;
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
			await super.listeArgsDuzenle(e); $.extend(e.listeArgs, {
				pageable: true, showToolbar: false, filterable: true, serverProcessing: true, filterMode: 'default', toolbarHeight: 28,
				pageSize: this.userSettings_liste.pageSize || 8, height: ($(window).height() < 550 ? 200 : $(window).height() / 2.5)
			})
		}
		async liste_columnsDuzenle(e) {
			await super.liste_columnsDuzenle(e); $.merge(e.listeColumns, [
				{
					text: 'Ürün Adı', align: 'left', dataField: 'aciklama',
					cellsRenderer: (rowIndex, dataField, value, rec) => {
						const {fiyatGorurmu, bedelKullanilirmi} = this, {stokFiyatKdvlimi, kdvDahilFiyatGosterim, fiyatFra} = sky.app;
						rec = rec.originalRecord || rec; const divSatir = this.newListeSatirDiv($.extend({}, e)); divSatir.attr('data-index', rowIndex);
						for (let key in rec) {
							key = key?.trim(); if (!key) { return true } value = rec[key];
							switch (key) {
								case 'brmFiyat':
									value = asFloat(value) || 0;
									if (!stokFiyatKdvlimi && kdvDahilFiyatGosterim) { value = roundToFra(rec.brmFiyat + (rec.brmFiyat * bedel(rec.kdvOrani / 100)), fiyatFra) }
									value = `<span class="orangered">KD:</span>${value.toLocaleString()}`; break
							}
							if (!value) { switch (key) { case 'sonStok': case 'sonStok2': case 'miktar': case 'miktar2': value = 0; break } }
							const item = divSatir.find(`.${key}`); if (item.length) { item.html(value) }
							const fiyatParent = divSatir.find(`.brmFiyatParent`); if (!(fiyatGorurmu && bedelKullanilirmi && rec.brmFiyat)) { fiyatParent.addClass(`jqx-hidden`) }
							if (rec.ozelFiyatVarmi) { fiyatParent.addClass('ozelFiyat'); fiyatParent.find('.etiket').html('Koş:') }
						}
						return divSatir[0].outerHTML.trim()
					}
				},
				{ text: 'Ürün Kodu', align: 'left', dataField: 'kod', hidden: true },
				{ text: 'Grup Kodu', align: 'left', dataField: 'grupKod', hidden: true },
				{ text: 'Grup Adı', align: 'left', dataField: 'grupAdi', hidden: true }
			])
		}
		loadServerData_buildQuery(e) {
			const wsArgs = $.extend({}, e.wsArgs, { rowCountOnly: e.rowCountOnly }); wsArgs.alias = e => {
				if (e.saha == 'grupAdi') {
					e.saha = 'aciklama';
					return 'grp'
				}
				return 'stk'
			};
			wsArgs.sortDataField = wsArgs.sortDataField || wsArgs.sortdatafield || `aciklama`;
			const filters = wsArgs.filters = this.getFiltersFromListeWSArgs(wsArgs) || [];
			const {app, fis} = this, fisSinif = (fis || {}).class || {};
			const {fiiliCikismi, stokKdvSaha, stokKdvDegiskenmiSaha} = fisSinif, yerKod = (fis ||{}).yerKod || app.defaultYerKod;
			let sent = new MQSent({
				from: `mst_Stok stk`, fromIliskiler: [ { from: `mst_StokGrup grp`, iliski: `stk.grupKod = grp.kod` } ],
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
			let stm = new MQStm({ sent }); stm.fromGridWSArgs(wsArgs);
			app.stmSentDuzenle_sonStokBagla({
				stm, alias: 'stk', shKodClause: `stk.kod`, leftJoin: !sonStokKontrolEdilirmi,
				yerKod: app.class.appMagazaVeyaSDMmi ? null : (fis ||{}).yerKod || app.defaultYerKod
			});
			sent.groupBy.add(`stk.kod`, `son.yerKod`);
			if (aktifGrupKod) { sent.where.degerAta(aktifGrupKod, 'stk.grupKod') }
			return stm
		}
		async loadServerData_ekIslemler(e) {
			await super.loadServerData_ekIslemler(e); const {fis} = this, {recs} = e;
			let {satisKosulYapilari} = this; if (!satisKosulYapilari) { satisKosulYapilari = this.satisKosulYapilari = await fis.getSatisKosulYapilari() }
			if (recs) {
				const promises = [], {detaySinif} = fis.class, _e = { fis, satisKosulYapilari };
				for (const rec of recs) {
					promises.push(new $.Deferred(async p => {
						const det = new detaySinif($.extend({}, rec, { shKod: rec.kod, shAdi: rec.aciklama }));
						await det.detayEkIslemler_ekle(_e);
						for (const key of ['orjFiyat', 'netFiyat', 'ozelFiyatVarmi', 'brutBedel', 'netBedel']) { const value = det[key]; if (value != null) { rec[key] = value } }
						if (det.fiyat != null) { rec.brmFiyat = det.fiyat }
						p.resolve({ detay: det, rec })
					}))
				}
				await Promise.all(promises)
			}
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
		grupListe_loadServerData_buildQuery(e) {
			const wsArgs = $.extend({}, e.wsArgs, { rowCountOnly: e.rowCountOnly }); wsArgs.alias = `grp`;
			wsArgs.sortdatafield = wsArgs.sortDataField || wsArgs.sortdatafield || 'aciklama';
			const filters = wsArgs.filters = this.getFiltersFromListeWSArgs(wsArgs) || [];
			const {app, fis} = this, yerKod = (fis ||{}).yerKod || app.defaultYerKod;
			let sent = new MQSent({
				from: `mst_StokGrup grp`,
				fromIliskiler: [ { from: `mst_Stok stk`, iliski: `grp.kod = stk.grupKod` } ],
				distinct: true, sahalar: (e.rowCountOnly ? `COUNT(*) sayi` : [`grp.kod`, `grp.aciklama`])
			});
			const {sonStokKontrolEdilirmi, aktifGrupKod} = this;
			let stm = new MQStm({ sent }); stm.fromGridWSArgs(wsArgs);
			app.stmSentDuzenle_sonStokBagla({
				stm, alias: 'stk', shKodClause: `stk.kod`, leftJoin: !sonStokKontrolEdilirmi,
				yerKod: app.class.appMagazaVeyaSDMmi ? null : fis?.yerKod || app.defaultYerKod
			});
			sent.groupBy.add('grp.kod'); e.stm = stm;
			return true
		}
		grupListe_loadServerData_ekIslemler({ recs }) { recs.unshift({ kod: '', aciklama: `<span class="bold">&lt; HEPSİ &gt;</span>`, hepsimi: true }) }
		altListe_columnsDuzenle(e) {
			$.merge(e.listeColumns, [
				{	datafield: ' ', text: 'Seçilenler', align: 'left',
					cellsRenderer: (rowIndex, dataField, value, rec) => {
						const {altListe_rowHeight, fiyatGorurmu, bedelKullanilirmi} = this, {stokFiyatKdvlimi, kdvDahilFiyatGosterim, fiyatFra} = sky.app;
						rec = rec.originalRecord || rec;
						const divSatir = this.altListePart.newListeSatirDiv($.extend({}, e)); divSatir.attr('data-index', rowIndex); divSatir.height(altListe_rowHeight);
						$.each(rec, (key, value) => {
							key = key?.trim(); if (!key) { return true }
							switch (key) {
								case 'brmFiyat':
									value = asFloat(value) || 0;
									if (!stokFiyatKdvlimi && kdvDahilFiyatGosterim) { value = roundToFra(rec.brmFiyat + (rec.brmFiyat * bedel(rec.kdvOrani / 100)), fiyatFra) }
									value = `<span class="orangered">KD:</span>${value.toLocaleString()}`; break
							}
							if (!value) { switch (key) { case 'sonStok': case 'sonStok2': case 'miktar': case 'miktar2': value = 0; break } }
							const item = divSatir.find(`.${key}`); if (item.length) { item.html(value) }
							const fiyatParent = divSatir.find(`.brmFiyatParent`); if (!(fiyatGorurmu && bedelKullanilirmi && rec.brmFiyat)) { fiyatParent.addClass(`jqx-hidden`) }
							if (rec.ozelFiyatVarmi) { fiyatParent.addClass('ozelFiyat'); fiyatParent.find('.etiket').html('Koş:') }
						});
						let div = divSatir.find('.miktar'), {miktar} = rec; if (div.length) { div.html(miktar || 1) }
						return divSatir[0].outerHTML.trim()
					}
				}
			])
		}
		toplamTazele(e) {
			const {divSonucBedel, fis} = this; if (!divSonucBedel?.length) { return }
			let brut = 0, kdv = 0; for (const {miktar, netFiyat, kdvOrani} of this.altListePart.listeRecs) {
				let netBedel = miktar * netFiyat;
				brut += netBedel; kdv += (netBedel * kdvOrani / 100)
			}
			brut = bedel(brut); kdv = bedel(kdv); let net = bedel(brut + kdv);
			divSonucBedel.html(`<span class="etiket item">T:</span> <span class="veri toplam item">${bedelStr(brut)}</span> <span class="etiket item">K.D:</span> <span class="veri kdvDahilToplam item">${bedelStr(net)}</span>`)
		}
		islemTusuTiklandi(e) {
			e = e || {}; const evt = e.event || {}, elm = evt.currentTarget || e;
			switch (elm.id) {
				case 'asagi': this.asagiAlIstendi(); break
				case 'yukari': this.yukariAlIstendi(); break
			}
		}
		async asagiAlIstendi(e) {
			e = e || {}; let rec = e.rec = e.rec || this.selectedBoundRec; if (!rec) { return }
			const {altListePart} = this, widget = altListePart.listeWidget;
			let {uid} = rec, _rec = widget.rowsByKey[uid];
			if (_rec) {
				let artis = (_rec == rec ? null : asFloat(rec.miktar)) || 1; _rec.miktar = (asFloat(_rec.miktar) || 0) + artis;
				widget.selectrowbykey(uid); return
			}
			e.rec = rec = rec.deepCopy ? rec.deepCopy() : $.extend({}, rec); rec.miktar = rec.miktar || 1; await altListePart.ekle(e);
			uid = rec.uid; setTimeout(() => {
				altListePart.selectLastRec(); this.disableEventsDo(() => { widget.selectrowbykey(uid); widget.ensurerowvisiblebykey(uid) });
				this.liste_satirSecildiBasit({ rec }); this.toplamTazele(e)
			}, 0);
		}
		yukariAlIstendi(e) {
			e = e || {}; let rec = e.rec = e.rec || this.altListePart.selectedBoundRec; if (!rec) { return }
			const {altListePart} = this;
			let lastSelectedIndex = altListePart.selectedIndex; if (!lastSelectedIndex || lastSelectedIndex < 0) { lastSelectedIndex = null }
			altListePart.sil(e); this.tazele(e);
			if (!altListePart.selectedBoundRec) {
				let widget = altListePart.listeWidget; const rowCount = altListePart.listeRecs.length;
				let index = lastSelectedIndex == null ? rowCount - 1 : lastSelectedIndex; if (index < 0) { index = 0 } else if (index >= rowCount) { index = rowCount - 1 }
				setTimeout(() => {
					this.disableEventsDo(() => {
						if (lastSelectedIndex == null) { if (widget.pageable) { while (widget.goToNextPage()) { } } }
						widget.selectRow(index); widget.ensureRowVisible(index); this.toplamTazele(e)
					});
				}, 100)
			}
		}
		liste_satirTiklandi(e) { super.liste_satirTiklandi(e); setButonEnabled(this.genelIslemTuslari, true) }
		liste_satirCiftTiklandi(e) {
			if (!this.isEventFired_satirCifTiklandi) { this.isEventFired_satirCifTiklandi = true; return }
			this.asagiAlIstendi()
		}
		altListe_satirCiftTiklandi(e) { }
		liste_satirSecimDegisti(e) { super.liste_satirSecimDegisti(e) }
		liste_renderToolbar(e) {
			const layout = e.layout || this.layout; let toolbar = e.listeToolbar; let islemTuslari = toolbar.find('.toolbar.islemTuslari');
			if (!islemTuslari.length) { islemTuslari = this.newListeSubPart({ selector: '.toolbar.islemTuslari' }); islemTuslari.appendTo(toolbar) }
		}
		async liste_islemTusuTiklandi(e) { }
		liste_satirSecimDegisti(e) {
			e = e || {}; super.liste_satirSecimDegisti(e);
			const rec = this.selectedBoundRec, index = this.selectedIndex, lastSelectedIndex = e.lastSelectedIndex;
			if (rec && index != null && index == lastSelectedIndex) {
				let elm = this.divListe.find(`.jqx-grid-table .listeSatir[data-index=${index}] .miktar`);
				if (elm.length) {
					if (e.event) { e.event.stopPropagation() }
					setTimeout(e => {
						let {elm} = e, parent = elm.parent(); if (!parent.length) { return }
						const rec = e.rec.deepCopy ? e.rec.deepCopy() : $.extend(true, {}, e.rec); rec.miktar = 0;
						let fra = this.app.brm2Fra[rec.brm || 'AD'] || 0;
						parent.removeClass('jqx-hidden'); elm = e.elm[0];
						let savedHTML = elm.outerHTML; elm.outerHTML = (
							`<form action="" autocomplete="false" readonly onfocus="this.removeAttribute('readonly')" onsubmit="javascript:return false">` +
							`	<input class="miktar" type="number" maxlength="9" autocomplete="off" value="${roundToFra(asFloat(rec.miktar), fra) || 0}"></input>` +
							`</form>`
						);
						elm = parent.find('.miktar'); elm.off('keyup').on('keyup', evt => {
							const key = (evt.key || '').toLowerCase();
							if (key == 'enter' || key == 'linefeed') { setTimeout(() => elm.blur(), 50) }
						});
						elm.off('change').on('change', evt => {
							rec.miktar = roundToFra(asFloat(evt.currentTarget.value.replaceAll(',', '.')), fra) || 1;
							if (rec.miktar > 0) { this.asagiAlIstendi({ rec }) } this.toplamTazele(e)
						});
						elm.off('blur').on('blur', evt => {
							parent.addClass('jqx-hidden'); this.listeWidget.refresh(); this.toplamTazele(e);
							setTimeout(() => setButonEnabled(this.genelIslemTuslari, true), 1);
						});
						setButonEnabled(this.genelIslemTuslari, false);
						elm.focus(); elm.select();
					}, 10, { elm, rec, index })
				}
			}
		}
		async grupListe_satirSecildi(e) {
			e = e || {}; let rec = e.rec || this.grupListePart.selectedRec;
			this.aktifGrupKod = (rec || {}).kod || null;
			await this.tazele(e);
		}
		altListe_satirTiklandi(e) {
			e = e || {}; const part = this.altListePart;
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
							`	<input class="miktar" type="number" maxlength="9" autocomplete="off" value="${roundToFra(asFloat(rec.miktar), fra) || 1}"></input>` +
							`</form>`
						);
						elm = parent.find('.miktar');
						elm.off('keyup').on('keyup', evt => {
							const key = (evt.key || '').toLowerCase();
							if (key == 'enter' || key == 'linefeed') { setTimeout(() => elm.blur(), 50) }
						});
						elm.off('change').on('change', evt => {
							rec.miktar = roundToFra(asFloat(evt.currentTarget.value), fra) || 1;
							// this.altListePart.listeWidget.refresh();
						});
						elm.off('blur').on('blur', evt => {
							parent.addClass('jqx-hidden');
							setTimeout(() => setButonEnabled(this.genelIslemTuslari, true), 1)
							this.altListePart.listeWidget.refresh(); this.toplamTazele(e)
						});
						setButonEnabled(this.genelIslemTuslari, false);
						elm.focus(); elm.select();
					}, 10, { elm, rec, index });
				}
			}
		}

		altListe_satirSecimDegisti(e) {
		}

		async onResize(e) {
			await super.onResize(e);

			const {altListePart} = this;
			if (altListePart && !altListePart.isDestroyed) {
				const {genelIslemTuslari} = this;
				altListePart.divListe.jqxDataTable(
					'height',
					$(window).height() - (
						genelIslemTuslari.offset().top +
						genelIslemTuslari.height()
					) - 25
				);
			}
		}
	}
})()
