(function() {
	window.SkyCafeDetayDuzenlePart = class extends window.SkyCafeWindowPart {
		constructor(e) {
			e = e || {};
			super(e);

			/*$.extend(this, {
			});*/
		}

		static get partName() { return 'detayDuzenle' }
		get defaultTitle() { return `Düzenleme Ekranı` }
		get templatesParent() { return this.parentPart.templates }
		get autoHeight_uiSelector() { return `#sonucParent` }
		get autoFocus_uiSelector() { return `#miktarTam input` }
		
		get autoCompleteSelector2ValueGetter() {
			return $.extend(super.autoCompleteSelector2ValueGetter || {}, {
				ekNot: e => (this.aktifDetay || {}).ekNot
			})
		}

		close_araIslemler(e) {
			super.close_araIslemler(e);
			
			delete this.aktifDetay;
		}
		
		async tazeleDevam(e) {
			await super.tazeleDevam(e);

			const {app, parentPart} = this;
			const {wndContent} = this;
			const det = this.aktifDetay;
			if (det.promise_detayEkIslemler)
				await det.promise_detayEkIslemler;
			
			let urun = det._urun;
			if (!urun) {
				await det.ekBilgileriBelirle();
				urun = det._urun;
			}
			if (!urun)
				return false;

			const btnIkram = wndContent.find(`#btnIkram`);
			btnIkram
				.jqxButton({ theme: theme })
				.off('click')
				.on('click', evt =>
					this.tamamIstendi($.extend({}, e, { event: evt, ikram: true })));
			btnIkram[det.ikrammi ? 'addClass' : 'removeClass'](`jqx-hidden`);
			
			const miktar = det.miktar || 1;
			const {fiyat, iskOrani, ozellikIDSet} = det;
			const brm = det.brm || 'AD';
			const fra = app.brm2Fra[brm] || 0;
			const fiyatDegisiklikYapilirmi = (urun.degiskenFiyatmi || fiyat <= 0.01);
			
			wndContent.find(`#urunText`)
				.html(urun.parantezliOzet({ styled: true }));
			wndContent.find(`#urunTextParent`)
				.removeClass(`jqx-hidden`);
			
			await parentPart.initSubLayout({
				tip: 'ozellik',
				parent: wndContent.find(`#ozellikler`),
				autoBackgroundColor: true,
				eventSelector: e => this.urunOzellikTiklandi(e),
				templateItemSelector: `.ozellik`,
				dataSource: e => {
					return urun.ozellikler
				},
				itemDuzenleyici: e => {
					const det = this.aktifDetay;
					const {rec, divItem} = e;
					const brm = rec.brm || 'AD';
					const fra = app.brm2Fra[brm] || 0;

					const {id} = rec;
					if (det.ozellikIDSet[id])
						divItem.addClass(`selected`);

					const divFiyat = divItem.find(`#ekFiyat`);
					if (divFiyat.length) {
						const fiyat = asFloat(rec.ekFiyat) || 0;
						if (fiyat) {
							divFiyat.html(fiyat);
							divFiyat.parent().removeClass(`jqx-hidden`);
						}
						else {
							divFiyat.parent().addClass(`jqx-hidden`);
						}
					}
				}
			});
			
			this.initTextInput({
				htmlSelector: `#ekNot`, instSelector: 'ekNot',
				placeHolder: `Ek Notlar`,
				args: { minLength: 2, maxLength: 150 },
				value: det.ekNot,
				setValue: e =>
					this.aktifDetay.ekNot = e.value
			});

			let parts, handler;
			parts = (miktar || 1).toString().split('.');
			handler = evt => {
				const det = this.aktifDetay;
				const brm = det.brm || 'AD';
				const fra = app.brm2Fra[brm] || 0;
				let miktar = roundToFra(`${wndContent.find(`#miktarTam input`).val().toString() || '0'}.${wndContent.find(`#miktarFra input`).val().toString() || '0'}`, fra);
				if (!miktar || miktar < 0)
					miktar = 1;
				det.miktar = miktar;
				(async () => {
					await det.brutBedelHesapla(e);
					await det.netBedelHesapla(e);
					wndContent.find(`#sonuc`).html(`${bedelStr(det.netBedel)}`);
				})();
			};
			wndContent.find(`#miktarTam`).jqxNumberInput({
				theme: theme, inputMode: 'simple', width: 190,
				spinButtons: true, spinButtonsWidth: 65,
				min: (fra ? 0 : 1), max: 999, decimalDigits: 0,
				value: parts[0] || 0
			});
			wndContent.find(`#miktarTam`).on('change', handler);
			wndContent.find(`#miktarTam input`).on('change', handler);
			
			let fraIcinMax = '9'.repeat(fra);
			wndContent.find(`#miktarFra`).jqxNumberInput({
				theme: theme, inputMode: 'simple', width: 230,
				spinButtons: true, spinButtonsWidth: 65,
				min: 0, max: fraIcinMax, decimalDigits: 0,
				value: parts[1] || 0
			});
			wndContent.find(`#miktarFra`).on('change', handler);
			wndContent.find(`#miktarFra input`).on('change', handler);
			wndContent.find(`#miktarFraParent`)[fraIcinMax ? 'removeClass' : 'addClass'](`jqx-hidden`);
			wndContent.find(`#miktarParent`).removeClass(`jqx-hidden`);

			if (!fiyatDegisiklikYapilirmi)
				wndContent.find(`#fiyatEtiket`).addClass(`disabled`);
			parts = (fiyat || 0).toString().split('.');
			handler = evt => {
				const det = this.aktifDetay;
				det.fiyat = roundToFra(`${wndContent.find(`#fiyatTam input`).val().toString() || '0'}.${wndContent.find(`#fiyatFra input`).val().toString() || '0'}`, 2);
				(async () => {
					await det.brutBedelHesapla(e);
					await det.netBedelHesapla(e);
					wndContent.find(`#sonuc`).html(`${bedelStr(det.netBedel)}`);
				})();
			};
			wndContent.find(`#fiyatTam`).jqxNumberInput({
				theme: theme, inputMode: 'simple', width: 190,
				spinButtons: true, spinButtonsWidth: 65,
				min: 0, max: 9999, decimalDigits: 0,
				value: parts[0] || 0,
				disabled: !fiyatDegisiklikYapilirmi
			});
			wndContent.find(`#fiyatTam`).on('change', handler);
			wndContent.find(`#fiyatTam input`).on('change', handler);

			wndContent.find(`#fiyatFra`).jqxNumberInput({
				theme: theme, inputMode: 'simple', width: 230,
				spinButtons: true, spinButtonsWidth: 65,
				min: 0, max: 99999, decimalDigits: 0,
				value: parts[1] || 0,
				disabled: !fiyatDegisiklikYapilirmi
			});
			if (fiyatDegisiklikYapilirmi) {
				wndContent.find(`#fiyatFra`).on('change', handler);
				wndContent.find(`#fiyatFra input`).on('change', handler);
			}
			wndContent.find(`#fiyatFraParent`).removeClass(`jqx-hidden`);
			wndContent.find(`#fiyatParent`).removeClass(`jqx-hidden`);

			if (app.iskontoYapabilirmi) {
				parts = (iskOrani || 0).toString().split('.');
				handler = evt => {
					const det = this.aktifDetay;
					det.iskOrani = roundToFra(`${wndContent.find(`#iskOranTam input`).val().toString() || '0'}.${wndContent.find(`#iskOranFra input`).val().toString() || '0'}`, 2);
					(async () => {
						await det.brutBedelHesapla(e);
						await det.netBedelHesapla(e);
						wndContent.find(`#sonuc`).html(`${bedelStr(det.netBedel)}`);
					})();
				};
				wndContent.find(`#iskOranTam`).jqxNumberInput({
					theme: theme, inputMode: 'simple', width: 190,
					spinButtons: true, spinButtonsWidth: 65,
					min: 0, max: 9999, decimalDigits: 0,
					decimal: asInteger(parts[0]) || 0
				});
				wndContent.find(`#iskOranTam`).on('change', handler);
				wndContent.find(`#iskOranTam input`).on('change', handler);

				wndContent.find(`#iskOranFra`).jqxNumberInput({
					theme: theme, inputMode: 'simple', width: 230,
					spinButtons: true, spinButtonsWidth: 65,
					min: 0, max: 99999, decimalDigits: 0,
					decimal: asInteger(parts[1]) || 0
				});
				wndContent.find(`#iskOranFra`).on('change', handler);
				wndContent.find(`#iskOranFra input`).on('change', handler);
				wndContent.find(`#iskOranFraParent`).removeClass(`jqx-hidden`);
				wndContent.find(`#iskOranParent`).removeClass(`jqx-hidden`);
			}

			wndContent.find(`#sonuc`).html(`${bedelStr(det.netBedel)}`);
			const sonucParent = wndContent.find(`#sonucParent`);
			sonucParent.removeClass(`jqx-hidden`);
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
				aktifDetay: e.detay || this.aktifDetay || null
			});
		}

		wndArgsDuzenle(e) {
			super.wndArgsDuzenle(e);

			const {args} = e;
			const {position} = this;
			$.extend(args, {
				width: 650, height: 120,
				minWidth: 180, minHeight: 122
			});
			if (!position) {
				args.position = {
					// x: $(window).width() < 950 ? 'right, top' : $(window).width() - 655,
					x: 2,
					y: 48
				};
			}
		}

		initKlavyePart_argsDuzenle(e) {
			super.initKlavyePart_argsDuzenle(e);

			/*$.extend(e.args, {
			});*/
		}
		
		tamamIstendi_argsDuzenle(e) {
			e = e || {};
			super.tamamIstendi_argsDuzenle(e);

			const det = this.aktifDetay;
			if (e.ikram || e.ikrammi)
				det.ikrammi = true;
			
			det.miktar = Math.max(det.miktar || 0, 1);
			if (!det.fiyat || det.fiyat <= 0.01)
				return { isError: true, errorText: `<b>Ürün Fiyatı<b> belirtilmelidir` };

			e.args.detay = det;
		}

		async urunOzellikTiklandi(e) {
			const {rec, divItem} = e;
			const {id} = rec;
			const {parentPart, aktifDetay, wndContent} = this;
			const {ozellikIDSet} = aktifDetay;
			if (ozellikIDSet[id]) {
				delete ozellikIDSet[id];
				divItem.removeClass(`selected`);
			}
			else {
				ozellikIDSet[id] = true;
				divItem.addClass(`selected`);
			}

			parentPart.itemTiklandiOrtak(e);
			if (aktifDetay) {
				await aktifDetay.brutBedelHesapla();
				await aktifDetay.netBedelHesapla();
				wndContent.find(`#sonuc`).html(`${bedelStr(aktifDetay.netBedel)}`);
			}
		}
	}
})()
