(function() {
	window.SkyCafeRezervasyonEkraniPart = class extends window.SkyCafeTextInputPart {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				title: e.title == null ? `Rezervasyon İşlemi` : e.title,
				placeHolder: e.placeHolder == null ? `Rezervasyon Yapan Kişi` : e.placeHolder,
				kisiSayisi: asInteger(e.kisiSayisi) || 1,
				zaman: e.zaman || ''
			});
		}

		static get partName() { return 'rezervasyonEkrani' }
		get autoHeight_uiSelector() { return `#zamanParent` }
		
		/*get autoCompleteSelector2ValueGetter() {
			return $.extend(super.autoCompleteSelector2ValueGetter || {}, {
				value: e => this.value
			})
		}*/
		
		async tazeleDevam(e) {
			await super.tazeleDevam(e);

			const {wndContent, kisiSayisi, zaman} = this;
			let parts, handler;
			handler = evt => {
				this.kisiSayisi = asInteger(wndContent.find('#kisiSayisi input').val() || 0);
			};
			wndContent.find(`#kisiSayisi`).jqxNumberInput({
				theme: theme, inputMode: 'simple', width: 150,
				spinButtons: true, spinButtonsWidth: 65,
				min: 0, max: 99, decimalDigits: 0,
				decimal: asInteger(kisiSayisi) || 0
			});
			wndContent.find(`#kisiSayisi`).on('change', handler);
			wndContent.find(`#kisiSayisi input`).on('change', handler);
			wndContent.find(`#kisiSayisiParent`).removeClass(`jqx-hidden`);

			const zamanUpdateInput = () => {
				const names = [`zamanSaat`, `zamanDakika`];
				for (const i in names) {
					const _elm = wndContent.find(`#${names[i]} input`);
					if (_elm && _elm.length)
						_elm.val(asInteger(_elm.val()).toString().padStart(2, '0'));
				}
			};

			parts = (zaman || '').toString().split(':');
			handler = evt => {
				this.zaman = `${wndContent.find('#zamanSaat input').val().toString() || '00'}:${wndContent.find('#zamanDakika input').val().toString() || '00'}`;
				zamanUpdateInput();
			};
			wndContent.find(`#zamanSaat`).jqxNumberInput({
				theme: theme, inputMode: 'simple', width: 150,
				spinButtons: true, spinButtonsWidth: 65,
				min: 0, max: 59, decimalDigits: 0,
				decimal: asInteger(parts[0]) || 0
			});
			wndContent.find(`#zamanSaat`).on('change', handler);
			wndContent.find(`#zamanSaat input`).on('change', handler);
			
			wndContent.find(`#zamanDakika`).jqxNumberInput({
				theme: theme, inputMode: 'simple', width: 150,
				spinButtons: true, spinButtonsWidth: 65,
				min: 0, max: 59, decimalDigits: 0,
				decimal: asInteger(parts[1]) || 0
			});
			wndContent.find(`#zamanDakika`).on('change', handler);
			wndContent.find(`#zamanDakika input`).on('change', handler);
			zamanUpdateInput();
			wndContent.find(`#zamanParent`).removeClass(`jqx-hidden`);
		}

		tazeleSonrasi(e) {
			super.tazeleSonrasi(e);
		}

		setValues(e) {
			super.setValues(e);

			$.extend(this, {
				kisiSayisi: e.kisiSayisi == null ? this.kisiSayisi : e.kisiSayisi,
				zaman: e.zaman == null ? this.zaman : e.zaman
			});
		}

		wndArgsDuzenle(e) {
			super.wndArgsDuzenle(e);

			const {args} = e;
			$.extend(args, {
				minHeight: args.minHeight * 4
			});
		}

		initKlavyePart_argsDuzenle(e) {
			super.initKlavyePart_argsDuzenle(e);

			/*$.extend(e.args, {
			});*/
		}
		
		tamamIstendi_argsDuzenle(e) {
			super.tamamIstendi_argsDuzenle(e);

			$.extend(e.args, {
				kisiSayisi: this.kisiSayisi,
				zaman: this.zaman
			});
		}
	}
})()
