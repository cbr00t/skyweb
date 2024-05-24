(function() {
	window.SkyCafeTahsilatEkraniPart = class extends window.SkyCafeWindowPart {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				kismimi: e.kismimi
			});
		}

		static get partName() { return 'tahsilat' }
		get defaultTitle() { return `Tahsilat Ekranı` }
		get templatesParent() { return this.parentPart.templates }
		get autoFocus_uiSelector() { return `#nakitTamParent #nakitTam input` }
		get autoHeight_uiSelector() { return this.kismimi ? null : `#islemTuslari-ek` }
		get defaultIsModal() { return true }
		get defaultCanCollapseByTitle() { return false }
		get klavyeAcilirmi() { return false }
		
		/*get autoCompleteSelector2ValueGetter() {
			return $.extend(super.autoCompleteSelector2ValueGetter || {}, {
				ekNot: e => (this.aktifDetay || {}).ekNot
			})
		}*/

		close_araIslemler(e) {
			super.close_araIslemler(e);
			
			const {listePart} = this;
			if (listePart) {
				listePart.destroyPart();
				const keys = ['listePart', 'divListe', 'listeWidget'];
				for (const i in keys)
					delete this[keys[i]];
			}
			
			// delete this.aktifDetay;
		}
		
		async tazeleDevam(e) {
			await super.tazeleDevam(e);
			
			const {app, parentPart, wndContent} = this;
			const anaTip = app.aktifMasaAnaTip;
			const tahsilatBilgi = this.tahsilatBilgi = {
				nakit: 0, pos: 0,
				yemekCeki: 0, paraUstu: 0
			};

			let {initFlag} = this;
			let parts, handler;
			parts = (tahsilatBilgi.nakit || 0).toString().split('.');
			if (initFlag) {
				wndContent.find(`#nakitTam`).val(asInteger(parts[0]) || 0);
				wndContent.find(`#nakitFra`).val(asInteger(parts[1]) || 0);
			}
			else {
				handler = evt => {
					tahsilatBilgi.nakit = bedel(`${wndContent.find(`#nakitTam input`).val().toString() || '0'}.${wndContent.find(`#nakitFra input`).val().toString() || '0'}`);
					this.sonucTazele(e);
				};
				wndContent.find(`#nakitTam`).jqxNumberInput({
					theme: theme, inputMode: 'simple', width: 210,
					spinButtons: true, spinButtonsWidth: 75,
					min: 0, max: 9999, decimalDigits: 0,
					decimal: asInteger(parts[0]) || 0
				});
				wndContent.find(`#nakitTam`).on('change', handler);
				wndContent.find(`#nakitTam input`).on('change', handler);

				wndContent.find(`#nakitFra`).jqxNumberInput({
					theme: theme, inputMode: 'simple', width: 150,
					spinButtons: true, spinButtonsWidth: 65,
					min: 0, max: 99, decimalDigits: 0,
					decimal: asInteger(parts[1]) || 0
				});
				wndContent.find(`#nakitFra`).on('change', handler);
				wndContent.find(`#nakitFra input`).on('change', handler);
				wndContent.find(`#nakitParent`).removeClass(`jqx-hidden`);
			}

			parts = (tahsilatBilgi.pos || 0).toString().split('.');
			if (initFlag) {
				wndContent.find(`#posTam`).val(asInteger(parts[0]) || 0);
				wndContent.find(`#posFra`).val(asInteger(parts[1]) || 0);
			}
			else {
				handler = evt => {
					tahsilatBilgi.pos = bedel(`${wndContent.find(`#posTam input`).val().toString() || '0'}.${wndContent.find(`#posFra input`).val().toString() || '0'}`);
					this.sonucTazele(e);
				};
				wndContent.find(`#posTam`).jqxNumberInput({
					theme: theme, inputMode: 'simple', width: 210,
					spinButtons: true, spinButtonsWidth: 75,
					min: 0, max: 9999, decimalDigits: 0,
					decimal: asInteger(parts[0]) || 0
				});
				wndContent.find(`#posTam`).on('change', handler);
				wndContent.find(`#posTam input`).on('change', handler);

				wndContent.find(`#posFra`).jqxNumberInput({
					theme: theme, inputMode: 'simple', width: 150,
					spinButtons: true, spinButtonsWidth: 65,
					min: 0, max: 99, decimalDigits: 0,
					decimal: asInteger(parts[1]) || 0
				});
				wndContent.find(`#posFra`).on('change', handler);
				wndContent.find(`#posFra input`).on('change', handler);
				wndContent.find(`#posParent`).removeClass(`jqx-hidden`);
			}

			parts = (tahsilatBilgi.yemekCeki || 0).toString().split('.');
			if (initFlag) {
				wndContent.find(`#yemekCeki`).val(asInteger(parts[0]) || 0);
				wndContent.find(`#yemekCekiFra`).val(asInteger(parts[1]) || 0);
			}
			else {
				handler = evt => {
					tahsilatBilgi.yemekCeki = bedel(`${wndContent.find(`#yemekCekiTam input`).val().toString() || '0'}.${wndContent.find(`#yemekCekiFra input`).val().toString() || '0'}`);
					this.sonucTazele(e);
				};
				wndContent.find(`#yemekCekiTam`).jqxNumberInput({
					theme: theme, inputMode: 'simple', width: 210,
					spinButtons: true, spinButtonsWidth: 75,
					min: 0, max: 9999, decimalDigits: 0,
					decimal: asInteger(parts[0]) || 0
				});
				wndContent.find(`#yemekCekiTam`).on('change', handler);
				wndContent.find(`#yemekCekiTam input`).on('change', handler);

				wndContent.find(`#yemekCekiFra`).jqxNumberInput({
					theme: theme, inputMode: 'simple', width: 150,
					spinButtons: true, spinButtonsWidth: 65,
					min: 0, max: 99, decimalDigits: 0,
					decimal: asInteger(parts[1]) || 0
				});
				wndContent.find(`#yemekCekiFra`).on('change', handler);
				wndContent.find(`#yemekCekiFra input`).on('change', handler);
				wndContent.find(`#yemekCekiParent`).removeClass(`jqx-hidden`);
			}

			if (!initFlag) {
				const btnKalaniYaz = this.btnKalaniYaz = wndContent.find(`#btnKalaniYaz`);
				btnKalaniYaz.jqxButton({ theme: theme });
				btnKalaniYaz.on('click', evt =>
					this.kalaniYazIstendi($.extend({}, e, { event: evt })));
			}
			
			const {kismimi} = this;
			if (kismimi) {
				/*wndContent.find(`#hizliBulForm`).removeClass(`jqx-hidden`);
				wndContent.find(`#hizliBulForm #txtHizliBul`)
					.on('focus', evt =>
						evt.target.select())
					.on('keyup', evt => {
						const key = (evt.key || '').toLowerCase();
						if (key == 'enter' || key == 'linefeed') {
							this.listeTazele($.extend({}, e, { event: evt }));
						}
						else {
							this.setUniqueTimeout({
								key: 'hizliBul_onChange',
								delayMS: 500,
								args: $.extend({}, e, { event: evt }),
								block: e =>
									this.listeTazele($.extend({}, e, { event: evt }))
							})
						}
					});*/
				wndContent.find(`#listeParent`).removeClass(`jqx-hidden`);
				setTimeout(() => this.initListe(e), 10);
			}
			else {
				this.toplamTazele(e);
			}
			this.sonucTazele(e);
			// this.initFlag = true;

			const tahsilSekliTip2Id = app.param.tahsilSekliTip2Id || {};
			if (!(tahsilSekliTip2Id.nakit || tahsilSekliTip2Id.NK))
				wndContent.find(`#nakitParent`).addClass('jqx-hidden');
			if (!(tahsilSekliTip2Id.pos || tahsilSekliTip2Id.PS))
				wndContent.find(`#posParent`).addClass('jqx-hidden');
			if (!(tahsilSekliTip2Id.yemekCeki || tahsilSekliTip2Id.YM))
				wndContent.find(`#yemekCekiParent`).addClass('jqx-hidden');

			if (!this.focusEventSetFlag) {
				wndContent.find(`input[type=text], input[type=textbox], input.jqx-input-content`)
					.on('focus, click', evt =>
						evt.target.select());
				this.focusEventSetFlag = true;
			}
		}

		tazeleSonrasi(e) {
			super.tazeleSonrasi(e);

			/*const {wnd, wndContent} = this;
			const sonucParent = wndContent.find(`#sonucParent`);
			wnd.jqxWindow('height', sonucParent.position().top + sonucParent.height() + 23);
			setTimeout(
				() => wndContent.find(`#miktarTam input`).focus(),
				300);*/
		}

		setValues(e) {
			super.setValues(e);

			$.extend(this, {
				kismimi: e.kismimi == null ? this.kismimi : e.kismimi
			});
		}

		tamamIstendi_argsDuzenle(e) {
			super.tamamIstendi_argsDuzenle(e);
			
			const {listeWidget} = this;
			let recs = null;
			if (listeWidget) {
				recs = [];
				const _recs = listeWidget.getRows() || [];
				for (const i in _recs) {
					let rec = _recs[i];
					rec = rec ? rec.originalRecord || rec : null;
					if (rec && (rec.alinacakMiktar || 0) > 0) {
						rec.alinacakMiktar = rec.alinacakMiktar = Math.max(Math.min(rec.miktar, rec.alinacakMiktar), 0);
						recs.push(rec);
					}
				}
			}
			if (this.kismimi && $.isEmptyObject(recs))
				return { isError: true, errorText: `<b>Tahsilatı yapılacak ürün(ler)</b> seçilmelidir` };
			
			const {toplam} = this;
			let {sonuc} = this;
			if (!sonuc) {
				this.kalaniYazIstendi();
				sonuc = this.sonuc;
			}
			
			if (!sonuc)
				return { isError: true, errorText: `<b>Tahsilat Bedeli</b> belirtilmelidir` };
			if (sonuc < toplam)
				return { isError: true, errorText: `<b>${bedelStr(sonuc - toplam)} TL</b> <u>AÇIK KISIM</u> kaldı` };

			const {tahsilatBilgi} = this;
			const paraUstu = tahsilatBilgi.paraUstu || 0;
			if (tahsilatBilgi && paraUstu) {
				const nakit = tahsilatBilgi.nakit || 0;
				if (nakit <= toplam)
					return { isError: true, errorText: `<b>Nakit</b> haricinde <u class="bold">Para Üstü</u> kullanılamaz` };
			}
			
			$.extend(e.args, {
				tahsilatBilgi: tahsilatBilgi,
				toplam: toplam,
				sonuc: sonuc,
				recs: recs
			});
		}
	
		wndArgsDuzenle(e) {
			super.wndArgsDuzenle(e);

			const {args} = e;
			const {position} = this;
			$.extend(args, {
				width:  $(window).width() > 900 ? 850 : $(window).width(),
				height: $(window).height() - 60
				/*width:  $(window).width(),
				height: $(window).height() - 60*/
			});
			if (!position) {
				args.position = {
					/*x: '',
					y: 48*/
					x: ($(window).width() / 2) - (args.width / 2),
					y: 48
				};
			}
		}

		initKlavyePart_argsDuzenle(e) {
			super.initKlavyePart_argsDuzenle(e);

			/*$.extend(e.args, {
			});*/
		}
		
		sonucTazele(e) {
			const {wndContent, tahsilatBilgi} = this;
			const toplam = this.toplam = this.toplam || 0;
			const divSonucParent = wndContent.find(`#sonucParent`);
			const divSonucEtiket = divSonucParent.find(`#sonucEtiket`);
			const divSonuc = divSonucParent.find(`#sonuc`);
			const sonuc = this.sonuc = bedel(
				bedel(tahsilatBilgi.nakit || 0) +
				bedel(tahsilatBilgi.pos || 0) +
				bedel(tahsilatBilgi.yemekCeki || 0) 
			);
			if (sonuc > toplam) {
				const paraUstu = tahsilatBilgi.paraUstu = bedel(sonuc - toplam);
				divSonucParent.removeClass(`dolu`);
				divSonucParent.addClass(`para-ustu`);
				divSonucEtiket.html(`PARA ÜSTÜ:`);
				divSonuc.html(`${bedelStr(paraUstu)}`);
			}
			else {
				const kalan = bedel(toplam - sonuc);
				tahsilatBilgi.paraUstu = 0;
				divSonucParent.removeClass(`para-ustu`);
				divSonucParent[kalan ? 'addClass' : 'removeClass'](`dolu`);
				divSonucEtiket.html(`KALAN:`);
				divSonuc.html(`${bedelStr(kalan)}`);
			}
		}

		toplamTazele(e) {
			const {app, wndContent} = this;
			let toplam = 0;
			if (this.kismimi) {
				const {listeWidget} = this;
				if (listeWidget == null)
					return;
				
				const recs = listeWidget.getRows();
				for (const i in recs) {
					let rec = recs[i];
					rec = rec.originalRecord || rec;
					const {alinacakMiktar, miktar} = rec;
					if (alinacakMiktar) {
						const kismiBedel = bedel((alinacakMiktar / miktar) * (rec.netBedel || 0));
						toplam += kismiBedel;
					}
				}
			}
			else {
				const {detaylar} = app.aktifFis;
				for (const i in detaylar) {
					const det = detaylar[i];
					if (!det.silindimi)
						toplam += bedel(det.netBedel);
				}
			}
			this.toplam = bedel(toplam);
			wndContent.find(`#toplam`)
				.html(`${bedelStr(toplam)}`);
			
		}

		kalaniYazIstendi(e) {
			const {toplam} = this;
			if (!toplam)
				return;
			
			let {sonuc} = this;
			if (sonuc >= toplam)
				return;

			const {app, tahsilatBilgi} = this;
			const bedelKeys = [];
			const tahsilSekliTip2Id = app.param.tahsilSekliTip2Id || {};
			if ((tahsilSekliTip2Id.nakit || tahsilSekliTip2Id.NK))
				bedelKeys.push('nakit');
			if ((tahsilSekliTip2Id.pos || tahsilSekliTip2Id.PS))
				bedelKeys.push('pos');
			if ((tahsilSekliTip2Id.yemekCeki || tahsilSekliTip2Id.YM))
				bedelKeys.push('yemekCeki');
			
			let kalan = toplam;
			let targetKey;
			for (const i in bedelKeys) {
				const key = bedelKeys[i];
				const value = tahsilatBilgi[key];
				if (value) {
					kalan -= bedel(value);
					continue;
				}
				else {
					targetKey = key;
				}
			}
			kalan = bedel(kalan);
			if (kalan) {
				if (!tahsilatBilgi.nakit)
					targetKey = `nakit`;
				else if (!tahsilatBilgi.pos)
					targetKey = `pos`;
				else if (!tahsilatBilgi.yemekCeki)
					targetKey = `yemekCeki`;
			}
						
			if (targetKey) {
				const {wndContent} = this;
				/*if (kalan)
					kalan -= Math.max(asInteger(tahsilatBilgi[targetKey]) || 0, 0);*/
				const value = (tahsilatBilgi[targetKey] || 0) + (kalan || 0);
				const parts = value.toString().split('.');
				tahsilatBilgi[targetKey] = value;
				wndContent.find(`#${targetKey}Tam`).val(asInteger(parts[0]) || 0);
				wndContent.find(`#${targetKey}Fra`).val(asInteger(parts[1]) || 0);
				this.sonucTazele(e);

				let nextElm = wndContent.find(`#${targetKey}Parent`).next();
				nextElm = nextElm.length ? nextElm.find(`input:eq(0)`) : nextElm;
				if (nextElm.length)
					nextElm.focus();
			}
		}

		initListe(e) {
			e = e || {};
			const {app, wndContent} = this;
			const listePart = this.listePart = new DataTablePart({
				content: wndContent.find(`#listeParent`),
				layout: wndContent.find(`#listeParent #liste`),
				widgetBeforeInit: _e => {
					$.extend(_e.widgetArgs, {
						width: false, height: '95%', serverProcessing: false, columnsHeight: 33,
						sortable: false, pageable: false, pageSize: 15, pagerHeight: 25,
						filterable: true, filterHeight: 38 , filterMode: 'default',
						/*selectionMode: 'singleRow',*/ selectionMode: 'none',
						/*rendered: () => {
							const {divListe, listeWidget} = this;
							const trRows = listeWidget.table.find(`table > tbody > tr`);
							const btnSil = trRows.find(`td > #sil`);
							if (btnSil.length) {
								btnSil.jqxButton({ theme: theme })
									.on('click', evt => {
										let index = evt.currentTarget.dataset.rowindex;
										if (index != null) {
											index = asInteger(index);
											this.sil({ index: index });
										}
									});
								btnSil.parent().on('mouseup', evt => {
									const btnSil = evt.currentTarget.querySelector(`#sil`);
									if (btnSil)
										btnSil.click();
								});
							}
						}*/
					})
				},
				widgetAfterInit: _e => {
					const {widgetPart, widget} = _e;
					widgetPart.on('rowClick', evt =>
						this.liste_onItemClick($.extend({}, e, { event: evt })));
					widgetPart.on('rowDoubleClick', evt =>
						this.liste_onItemDblClick($.extend({}, e, { event: evt })));
				},
				columns: [
					{
						dataField: 'stokAdi', text: 'Ürün Adı', width: '45%',
						cellClassName: `detay stokAdi`
					},
					{
						dataField: 'miktar', text: 'Satış', width: 90, align: 'left', cellsAlign: 'right', cellsFormat: 'd',
						cellClassName: `detay miktar`
					},
					{
						dataField: 'alinacakMiktar', text: 'Alınacak', width: 90, align: 'left', cellsAlign: 'right', cellsFormat: 'd',
						cellClassName: (rowIndex, columnField, value, rec) => {
							const postfix =
								!rec.alinacakMiktar
									? ` bos`
									: rec.alinacakMiktar < rec.miktar
										? ''
										: ` hepsi`;
							return `detay alinacakMiktar${postfix}`
						}
					}
				],
				loadServerData: e =>
					this.getDataSource(e)
			});
			listePart.basicRun();
			this.listeWidget = listePart.widget;
			this.listeTazele(e);
			setTimeout(() => {
				this.toplamTazele(e);
				this.sonucTazele(e);
			}, 300);
		}

		listeTazele(e) {
			delete this.listeRecs;
			const {listePart} = this;
			if (listePart)
				return listePart.tazele(e);
		}

		getDataSource(e) {
			let {app, listeRecs} = this;
			if (listeRecs == null) {
				listeRecs = this.listeRecs = [];
				const detaylar = (app.aktifFis || {}).detaylar;
				for (const i in detaylar) {
					const det = detaylar[i];
					if (!det.silindimi) {
						const _det = det.deepCopy();
						_det.alinacakMiktar = null;
						listeRecs.push(_det);
					}
				}
			}
			return listeRecs;
		}

		liste_onItemClick(e) {
			const evt = e.event;
			const {args} = evt;
			const originalEvent = args.originalEvent || {};
			let rec = args.row;
			if (rec)
				rec = rec.originalRecord || rec;
			
			const {miktar, brm} = rec;
			const fra = this.app.brm2Fra[rec.brm || 'AD'] || 0;
			if (originalEvent.button == 2) {
				if (rec.alinacakMiktar > 0)
					rec.alinacakMiktar--;
				else
					rec.alinacakMiktar = miktar;
			}
			else {
				if (rec.alinacakMiktar < miktar)
					rec.alinacakMiktar++;
				else
					rec.alinacakMiktar = null;
			}
			
			rec.alinacakMiktar = rec.alinacakMiktar || null;
			if (rec.alinacakMiktar != null)
				rec.alinacakMiktar = roundToFra(Math.max(Math.min(miktar, rec.alinacakMiktar), 0), fra);
			
			const {listeWidget} = this;
			listeWidget.beginUpdate();
			listeWidget.endUpdate();
			setTimeout(() => listeWidget.ensurerowvisiblebykey(rec.uid), 5);
			
			this.toplamTazele(e);
			this.sonucTazele(e);
		}

		liste_onItemDblClick(e) {
		}

		async onResize(e) {
			e = e || {};
			await super.onResize(e);
			const {wnd, wndContent} = this;
			const listeParent = wndContent.find(`#listeParent`);
			listeParent.height(wnd.jqxWindow('height') - listeParent.position().top - 8);
		}
	}
})()
