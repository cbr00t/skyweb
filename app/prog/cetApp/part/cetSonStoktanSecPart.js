(function() {
	window.CETSonStoktanSecPart = class extends window.CETListeOrtakPart {
		constructor(e) {
			e = e || {};
			super(e);
			
			$.extend(this, {
				fis: e.fis,
				detay: e.detay,
				miktarAlinsinFlag: e.miktarAlinsin || e.miktarAlinsinFlag,
				detayEkleFlag: e.detayEkle || e.detayEkleFlag,
				idSaha: ''
			});
			if (!(this.layout || this.template))
				this.template = this.app.templates.cetSonStoktanSec;
		}

		static get canDefer() { return false }
		static get canDestroy() { return false }
		static get partName() { return 'cetSonStoktanSec' }
		get adimText() { return 'Son Stoktan Seçim' }


		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);

			// const layout = e.layout || this.layout;
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

			this.renderToolbarOrtak(e);
			
			const {app, fis} = this;
			this.fiyatGorurmu = fis && !fis.class.fiiliCikismi ? app.alimFiyatGorurmu : app.satisFiyatGorurmu;
			
			this.tazele();
		}

		async deactivatePart(e) {
			e = e || {};
			super.deactivatePart(e);

			const {btnToggleFullScreen, chkOtoAktar, btnGonderimIsaretSifirla} = sky.app;
			setTimeout(() => {
				if (btnToggleFullScreen && btnToggleFullScreen.length)
					btnToggleFullScreen.removeClass(`jqx-hidden`);
				if (chkOtoAktar && chkOtoAktar.length)
					chkOtoAktar.removeClass(`jqx-hidden`);
				if (btnGonderimIsaretSifirla && btnGonderimIsaretSifirla.length)
					btnGonderimIsaretSifirla.removeClass(`jqx-hidden`);
			}, 100);
		}

		
		async listeArgsDuzenle(e) {
			await super.listeArgsDuzenle(e);
			
			$.extend(e.listeArgs, {
				pageable: true, showToolbar: true, filterable: true,
				autoRowHeight: true, toolbarHeight: 60, serverProcessing: true, filterMode: 'default',
				height: $(window).height() - 90
			});
		}

		async liste_columnsDuzenle(e) {
			await super.liste_columnsDuzenle(e);
			
			$.merge(e.listeColumns, [
				{
					text: 'Ürün Adı', align: 'left', dataField: 'aciklama',
					cellsRenderer: (rowIndex, columnIndex, value, rec) => {
						const {fiyatGorurmu} = this, {stokFiyatKdvlimi, kdvDahilFiyatGosterim, fiyatFra} = sky.app;
						rec = rec.originalRecord || rec; const divSatir = this.newListeSatirDiv($.extend({}, e, { cssSubClass: 'asil' }));
						divSatir.attr('data-index', rowIndex);
						$.each(rec, (key, value) => {
							let item = divSatir.find(`.${key}`);
							if (item.length)
								item.html(value);
						});
						['kdvOrani', 'brmFiyat', 'yerKod', 'sonStok', 'olasiMiktar', 'brm'].forEach(key => {
							const spanParent = divSatir.find(`.${key}Parent`);
							if (!rec[key] && spanParent.length) { spanParent.addClass(`jqx-hidden`) }
							else {
								switch (key) {
									case 'brmFiyat':
										if (!stokFiyatKdvlimi && kdvDahilFiyatGosterim) {
											divSatir.find(`.${key}`).html(`<span class="orangered">KD:</span>${roundToFra(rec.brmFiyat + (rec.brmFiyat * bedel(rec.kdvOrani / 100)), fiyatFra)}`)
										}
										break
								}
							}
						});
						if (!fiyatGorurmu) {
							const spanParent = divSatir.find(`.brmFiyatParent`);
							if (spanParent.length)
								spanParent.addClass(`jqx-hidden`)
						}
						if (rec.ozelFiyatVarmi) {
							const spanParent = divSatir.find(`.brmFiyatParent`);
							if (spanParent.length) {
								spanParent.addClass('ozelFiyat');
								spanParent.find('.etiket').html('Koş:');
							}
						}
						if (!(rec.sonStok || rec.olasiMiktar)) {
							const spanParent = divSatir.find(`.brmParent`);
							if (spanParent.length)
								spanParent.addClass(`jqx-hidden`);
						}

						const ekOzelliklerParent = divSatir.find(`.ekOzelliklerParent`);
						const ekOzelliklerText = ekOzelliklerParent && ekOzelliklerParent.length ? ekOzelliklerParent.find(`.ekOzelliklerText`) : null;
						if (ekOzelliklerText) {
							const {idSahalar} = CETEkOzellikler;
							let text = '';
							for (const idSaha of idSahalar) {
								const value = rec[idSaha];
								if (value) {
									if (text)
										text += CETEkOzellikler.anahtarDelim;
									text += value.toLocaleString();
								}
							}
							if (text) {
								ekOzelliklerText.html(text);
								ekOzelliklerParent.removeClass(`jqx-hidden basic-hidden`);
							}
							else {
								ekOzelliklerParent.addClass(`jqx-hidden`);
							}
						}
						
						return divSatir[0].outerHTML.trim();
					}
				},
				{ text: 'Ürün Kodu', align: 'left', dataField: 'kod', hidden: true },
				{
					text: 'Grup Adı', align: 'left', dataField: 'grupAdi', width: 160,
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
			(wsArgs.filterGroups || []).forEach(filterGroup => {
				(filterGroup.filters || []).forEach(filter => {
					if (filter.field == `grupAdi`)
						filter.field = `grp.aciklama`;
					if (filter.field == `yerKod`)
						filter.field = `son.yerKod`;
					if (filter.field == `yerAdi`)
						filter.field = `''`;
				})
			});
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
					return 'stk'
				}
			});
			
			const {app, fis, detay} = this;
			const {rowCountOnly} = e;
			let stm = e.stm = await CETStokTicariDetay.getStokEkBilgiStm({
				rowCountOnly: rowCountOnly,
				sonStokKontrolEdilirmi: true,
				detaylimi: true,
				shKod: detay.shKod,
				wsArgs: wsArgs,
				fis: fis || this.fisSinif || (this.parentPart || {}).fis || (this.parentPart || {}).fisSinif,
				yerKod: app.class.appSDMmi ? null : (fis ||{}).yerKod || app.defaultYerKod
			});
			if (!rowCountOnly) {
				const {idSahalar} = CETEkOzellikler;
				stm.sentDo(sent => {
					if (!$.isEmptyObject(idSahalar)) {
						for (const idSaha of idSahalar) {
							const aliasVeSaha = `son.${idSaha}`;
							sent.add(aliasVeSaha);
							// sent.groupBy.add(aliasVeSaha);
						}
					}
				});
			}
			await this.loadServerData_buildQuery_callHandlers(e);
			stm = e.stm;
			return stm
		}
		async loadServerData_ekIslemler(e) {
			await super.loadServerData_ekIslemler(e);
			const {fis} = this;
			let {satisKosulYapilari} = this;
			if (!satisKosulYapilari)
				satisKosulYapilari = this.satisKosulYapilari = await fis.getSatisKosulYapilari();
			const {recs} = e;
			if (recs) {
				const promises = [];
				const {detaySinif} = fis.class;
				const _e = { fis: fis, satisKosulYapilari: satisKosulYapilari };
				for (const rec of recs) {
					promises.push(new $.Deferred(async p => {
						const det = new detaySinif($.extend({}, rec, { shKod: rec.kod, shAdi: rec.aciklama }));
						await det.detayEkIslemler_ekle(_e);
						for (const key of ['orjFiyat', 'netFiyat', 'ozelFiyatVarmi', 'brutBedel', 'netBedel']) {
							const value = det[key];
							if (value != null)
								rec[key] = value;
						}
						if (det.fiyat != null)
							rec.brmFiyat = det.fiyat;
						p.resolve({ detay: det, rec: rec })
					}))
				}
				await Promise.all(promises)
			}
			
			
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
			let islemTuslari = toolbar.find(`.toolbar.islemTuslari`);
			if (!islemTuslari.length) {
				islemTuslari = this.newListeSubPart({ selector: `.toolbar.islemTuslari` });
				islemTuslari.appendTo(toolbar);
				
				const header = islemTuslari.find(`.header`);
				this.renderToolbarOrtak($.extend({}, e, { islemTuslari: islemTuslari, header: header }));
			}
		}

		renderToolbarOrtak(e) {
			e = e || {};
			const toolbar = e.listeToolbar || this.listeToolbar;
			const islemTuslari = (e.islemTuslari && e.islemTuslari.length ? e.islemTuslari : null)
										|| (toolbar && toolbar.length ? toolbar.find(`.toolbar.islemTuslari`) : null);
			const header = (e.header && e.header.length ? e.header : null)
										|| (islemTuslari && islemTuslari.length ? islemTuslari.find(`.header`) : null);
			if (!(header && header.length))		// ilk giris ise #liste_renderToolbar kısmında burası tekrar çağırılır
				return;

			const urunBilgiParent = header.find(`#urunBilgiParent`);
			const urunBilgiText = urunBilgiParent && urunBilgiParent.length ? urunBilgiParent.find(`#urunBilgiText`) : null;
			if (urunBilgiText && urunBilgiText.length) {
				const {fis, detay} = this;
				const {shKod, shAdi, brm, grupKod} = detay || {};
				if (shKod) {
					const {yerKod} = fis || {};
					urunBilgiText.html(
						`<span class="ka">(<span class="bold">${shKod}</span>) <span>${shAdi || ''}</span></span>` +
						`<span class="grupVeYer ekBilgi"><span>${grupKod || ''}</span> <span>-</span> <span>${yerKod || ''}</span></span>`
					);
				}
			}

			const chkMiktarAlinsinFlag = header.find(`#miktarAlinsinFlag`);
			chkMiktarAlinsinFlag.prop('checked', this.miktarAlinsinFlag);
			chkMiktarAlinsinFlag.parent().find(`label`)
				.off('mouseup, touchend')
				.on('mouseup, touchend', evt => {
					chkMiktarAlinsinFlag.prop('checked', !chkMiktarAlinsinFlag.prop('checked'));
					chkMiktarAlinsinFlag.trigger('change');
				});
			chkMiktarAlinsinFlag
				.off('change')
				.on('change', evt => {
					if (!this.disableEventsFlag)
						this.miktarAlinsinFlag = chkMiktarAlinsinFlag.prop('checked');
				});
			
			const chkDetayEkleFlag = header.find(`#detayEkleFlag`);
			chkDetayEkleFlag.prop('checked', this.detayEkleFlag);
			chkDetayEkleFlag.parent().find(`label`)
				.off('mouseup, touchend')
				.on('mouseup, touchend', evt => {
					chkDetayEkleFlag.prop('checked', !chkDetayEkleFlag.prop('checked'));
					chkDetayEkleFlag.trigger('change');
				});
			chkDetayEkleFlag
				.off('change')
				.on('change', evt => {
					if (!this.disableEventsFlag)
						this.detayEkleFlag = chkDetayEkleFlag.prop('checked');
				});
		}
	}
})()
