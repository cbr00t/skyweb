(function() {
	window.CETParamPart = class extends window.CETSubPart {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				tamamIslemi: e.tamamIslemi,
				param: this.app.param.deepCopy()
			});
			if (!(this.layout || this.template))
				this.template = this.app.templates.param;
		}

		static get partName() { return 'cetParam' }
		get adimText() { return 'Ayarlar' }
		static get noResizeEventOnInputs() { return false }


		async preInitLayout(e) {
			e = e || {};
			await super.preInitLayout(e);

			const layout = e.layout || this.layout;
			this.templates = $.extend(this.templates || {}, {
				windows: layout.find(`#windows`)
			});
			this.islemTuslari = layout.find('.islemTuslari.asil');
		}

		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);
			
			const {app} = sky;
			const {param, isAdmin} = app;
			const isMiniDevice = $(window).width() < 400;
			
			const layout = e.layout || this.layout;
			const {islemTuslari} = this;
			this.btnTamam = islemTuslari.find(`#tamam`).jqxButton({ theme: theme })
				.off('click')
				.on('click', evt => this.tamamIstendi($.extend({}, e, { event: evt })));
			
			this.btnBarkodYukle = islemTuslari.find(`#barkodYukle`).jqxButton({ theme: theme })
				.off('click')
				.on('click', evt => this.barkodYukleIstendi($.extend({}, e, { event: evt })));
			this.btnBarkodSakla = islemTuslari.find(`#barkodSakla`).jqxButton({ theme: theme })
				.off('click')
				.on('click', evt => this.barkodSaklaIstendi($.extend({}, e, { event: evt })));
			
			const subContent = this.subContent = layout.find(`.subContent`);
			let elm = subContent.find(`#wsHostName`)
						.jqxInput({ theme: theme, width: isMiniDevice ? 190 : 240, height: false });
			elm.off('focus').on('focus', evt =>
				evt.target.select());
			elm.val(param.wsHostName);

			elm = subContent.find(`#wsHostName2`)
						.jqxInput({ theme: theme, width: isMiniDevice ? 190 : 240, height: false });
			elm.off('focus').on('focus', evt =>
				evt.target.select());
			elm.val(param.wsHostName2);
			// elm.on('blur', evt => param.wsHostName = evt.target.value);
			
			let varsayilanWSHostName = param.varsayilanWSHostName;
			subContent.find(`input[name="varsayilanWSHostName"][value="${varsayilanWSHostName}"]`)
				.prop('checked', true);
			
			/*elm = subContent.find('#wsPort').jqxNumberInput({
				theme: theme, width: 130, height: false, inputMode: 'simple',
				min: 0, max: 65535, decimalDigits: 0,
				spinButtons: true, spinButtonsWidth: 32,
				decimal: param.wsPort || 8081
			});*/
			elm = subContent.find(`#wsPort`)
						.jqxInput({ theme: theme, width: isMiniDevice ? 90 : 120, height: false });
			elm.off('focus').on('focus', evt =>
				evt.target.select());
			elm.val(param.wsPort);
			subContent.jqxValidator({
				position: 'centerbottom',
				rules: [
					{	input: `#wsHostName`,
						message: '(<b>WebServis IP</b>) geçersizdir',
						action: 'change',
						rule: 'minLength=2'
					}/*,
					{	input: `#wsPort`,
						message: `(<b>WebServis Port</b>) değeri geçersizdir`,
						action: 'change',
						rule: ui => {
							ui = $(ui);
							const val = ui.val();
							return val >= 1 && val <= 65535;
						}
					}*/
				]
			});

			const chkSerbestModmu = subContent.find(`#chkSerbestModmu`);
			if (isAdmin) {
				chkSerbestModmu.prop('checked', app.serbestModmu);
				subContent.find(`#chkSerbestModmu_label`)
					.off('mouseup, touchend')
					.on('mouseup, touchend', evt =>
						chkSerbestModmu.prop('checked', !chkSerbestModmu.prop('checked')));
			}
			else {
				chkSerbestModmu.parent().addClass('jqx-hidden');
			}

			const chkGridAltMultiSelect = subContent.find(`#chkGridAltMultiSelect`);
			chkGridAltMultiSelect.prop('checked', app.gridAltMultiSelectFlag);
			subContent.find(`#chkGridAltMultiSelect_label`)
				.off('mouseup, touchend')
				.on('mouseup, touchend', evt =>
					chkGridAltMultiSelect.prop('checked', !chkGridAltMultiSelect.prop('checked')));
			
			const chkDogrudanFisListe = subContent.find(`#chkDogrudanFisListe`);
			chkDogrudanFisListe.prop('checked', app.dogrudanFisListeyeGirilirmi);
			subContent.find(`#chkDogrudanFisListe_label`)
				.off('mouseup, touchend')
				.on('mouseup, touchend', evt =>
					chkDogrudanFisListe.prop('checked', !chkDogrudanFisListe.prop('checked')));
			
			let chkBarkodluFisGiris = subContent.find(`#chkBarkodluFisGiris`);
			chkBarkodluFisGiris.prop('checked', app.barkodluFisGirisYapilirmi);
			subContent.find(`#chkBarkodluFisGiris_label`)
				.off('mouseup, touchend')
				.on('mouseup, touchend', evt =>
					chkBarkodluFisGiris.prop('checked', !chkBarkodluFisGiris.prop('checked')));

			let chkFisGirisSadeceBarkodZorunlumu = subContent.find(`#chkFisGirisSadeceBarkodZorunlumu`);
			chkFisGirisSadeceBarkodZorunlumu.prop('checked', app.fisGirisSadeceBarkodZorunlumu);
			subContent.find(`#chkFisGirisSadeceBarkodZorunlumu_label`)
				.off('mouseup, touchend')
				.on('mouseup, touchend', evt =>
					chkFisGirisSadeceBarkodZorunlumu.prop('checked', !chkFisGirisSadeceBarkodZorunlumu.prop('checked')));
			
			let chkGeciciFisKullanilmaz = subContent.find(`#chkGeciciFisKullanilmaz`);
			chkGeciciFisKullanilmaz.prop('checked', app.geciciFisKullanilmazmi);
			subContent.find(`#chkGeciciFisKullanilmaz_label`)
				.off('mouseup, touchend')
				.on('mouseup, touchend', evt =>
					chkGeciciFisKullanilmaz.prop('checked', !chkGeciciFisKullanilmaz.prop('checked')));

			const chkListeKodDogrudanAramaYapilir = subContent.find(`#chkListeKodDogrudanAramaYapilir`);
			chkListeKodDogrudanAramaYapilir.prop('checked', app.listeKodDogrudanAramaYapilirmi);
			subContent.find(`#chkListeKodDogrudanAramaYapilir_label`)
				.off('mouseup, touchend')
				.on('mouseup, touchend', evt =>
					chkListeKodDogrudanAramaYapilir.prop('checked', !chkListeKodDogrudanAramaYapilir.prop('checked')));

			const chkFisOzetBilgiGosterilir = subContent.find(`#chkFisOzetBilgiGosterilir`);
			chkFisOzetBilgiGosterilir.prop('checked', app.fisOzetBilgiGosterilirmi);
			subContent.find(`#chkFisOzetBilgiGosterilir_label`)
				.off('mouseup, touchend')
				.on('mouseup, touchend', evt =>
					chkFisOzetBilgiGosterilir.prop('checked', !chkFisOzetBilgiGosterilir.prop('checked')));

			const chkOtoSonStokGuncellenir = subContent.find(`#chkOtoSonStokGuncellenir`);
			chkOtoSonStokGuncellenir.prop('checked', app.otoSonStokGuncellenirmi);
			subContent.find(`#chkOtoSonStokGuncellenir_label`)
				.off('mouseup, touchend')
				.on('mouseup, touchend', evt =>
					chkOtoSonStokGuncellenir.prop('checked', !chkOtoSonStokGuncellenir.prop('checked')));
			
			let ddDokumDevice = subContent.find(`#ddDokumDevice`);
			ddDokumDevice.jqxDropDownList({
				theme: theme, animationType: animationType,
				valueMember: 'kod', displayMember: 'aciklama',
				selectedIndex: 0, searchMode: 'containsignorecase',
				placeHolder: 'Seçiniz:', filterPlaceHolder: 'Bul:', filterable: false,
				dropDownHeight: 150, autoDropDownHeight: true, scrollBarSize: 25,
				width: isMiniDevice ? 300 : 380, height: 35, itemHeight: 35,
				source: CETDokumDevice.tip2DeviceKAListe
			});
			ddDokumDevice
				.off('change')
				.on('change', evt => {
					if (evt && evt.target)
						this.dokumDeviceTipDegisti({ kod: ddDokumDevice.val() });
				});
			const {dokumDeviceTip} = param;
			if (dokumDeviceTip)
				ddDokumDevice.val(dokumDeviceTip);
			this.dokumDeviceTipDegisti({ kod: dokumDeviceTip });

			let ddDokumDeviceSP_baudRate = subContent.find(`#dokumDeviceSP_baudRate`);
			ddDokumDeviceSP_baudRate.jqxDropDownList({
				theme: theme, animationType: animationType,
				valueMember: 'kod', displayMember: 'aciklama',
				selectedIndex: 0, searchMode: 'containsignorecase',
				placeHolder: 'Seçiniz:', filterPlaceHolder: 'Bul:', filterable: false,
				dropDownHeight: 150, autoDropDownHeight: true, scrollBarSize: 25,
				width: isMiniDevice ? 210 : 280, height: 35, itemHeight: 35,
				source: CETDokumDevice_SerialPort.baudRates
			});
			const dokumDeviceSP_baudRate = param.dokumDeviceSP_baudRate;
			if (dokumDeviceSP_baudRate)
				ddDokumDeviceSP_baudRate.val(dokumDeviceSP_baudRate);
			
			let ddDokumTurkceHarfYontemi = subContent.find(`#ddDokumTurkceHarfYontemi`);
			ddDokumTurkceHarfYontemi.jqxDropDownList({
				theme: theme, animationType: animationType,
				valueMember: 'kod', displayMember: 'aciklama',
				selectedIndex: 0, searchMode: 'containsignorecase',
				placeHolder: 'Seçiniz:', filterPlaceHolder: 'Bul:', filterable: false,
				dropDownHeight: 150, autoDropDownHeight: true, scrollBarSize: 25,
				width: isMiniDevice ? 300 : 380, height: 35, itemHeight: 35,
				source: CETDokumDevice.turkceHarfYontemKAListe
			});
			ddDokumTurkceHarfYontemi
				.off('change')
				.on('change', evt => {
					if (evt && evt.target)
						this.dokumTurkceHarfYontemiDegisti({ kod: ddDokumTurkceHarfYontemi.val() });
				})
			const {dokumTurkceHarfYontemKod} = param;
			ddDokumTurkceHarfYontemi.val(dokumTurkceHarfYontemKod);
			this.dokumTurkceHarfYontemiDegisti({ kod: dokumTurkceHarfYontemKod });

			let txtDokumEncoding = subContent.find(`#txtDokumEncoding`)
					.jqxInput({ theme: theme, width: isMiniDevice ? 240 : 320, height: false });
			txtDokumEncoding.val(param.dokumEncoding);
			txtDokumEncoding.off('focus').on('focus', evt =>
				evt.target.select());
			
			let ddDokumDataPrefix = subContent.find(`#ddDokumDataPrefix`).jqxComboBox({
				theme: theme, width: isMiniDevice ? 300 : 380, height: false,
				valueMember: 'kod', displayMember: 'aciklama', multiSelect: false,
				searchMode: 'containsignorecase', minLength: 1, autoComplete: true,
				source: CETDokumDevice.dokumEpsonChars
			});
			ddDokumDataPrefix.jqxComboBox('renderer', (index, aciklama, kod) => {
				const rec = ddDokumDataPrefix.jqxComboBox('source')[index];
				return `<div class="bold float-left" style="width: 130px;">${`${rec.kod}`}</div><div class="float-left" style="width: 50px;">${rec.aciklama}</div>`
			});
			ddDokumDataPrefix.jqxComboBox('renderSelectedItem', (index, item) => {
				const rec = ddDokumDataPrefix.jqxComboBox('source')[index];
				return rec.kod
			});
			ddDokumDataPrefix.val(param.dokumDataPrefix);
			/*ddDokumDataPrefix.off('change').on('change', evt => {
				evt.preventDefault();
				const {item} = (evt.args || {}) || {};
				const {value} = item;
				if (value)
					evt.target.value += value;
			});*/
			ddDokumDataPrefix.find(`input`).off(`focus`).on(`focus`, evt =>
				evt.target.select());
			let ddDokumDataPostfix = subContent.find(`#ddDokumDataPostfix`).jqxComboBox({
				theme: theme,
				width: isMiniDevice ? 300 : 380, height: false, 
				valueMember: 'kod', displayMember: 'aciklama', multiSelect: false,
				searchMode: 'containsignorecase', minLength: 1, autoComplete: true,
				source: CETDokumDevice.dokumEpsonChars
			});
			ddDokumDataPostfix.jqxComboBox('renderer', (index, aciklama, kod) => {
				const rec = ddDokumDataPrefix.jqxComboBox('source')[index];
				return `<div class="bold float-left" style="width: 130px;">${`${rec.kod}`}</div><div class="float-left" style="width: 50px;">${rec.aciklama}</div>`
			});
			ddDokumDataPostfix.jqxComboBox('renderSelectedItem', (index, item) => {
				const rec = ddDokumDataPostfix.jqxComboBox('source')[index];
				return rec.kod
			});
			ddDokumDataPostfix.val(param.dokumDataPostfix);
			ddDokumDataPostfix.find(`input`).off(`focus`).on(`focus`, evt =>
				evt.target.select());

			let chkDarDokummu = subContent.find(`#chkDarDokummu`);
			chkDarDokummu.prop('checked', param.darDokummu);
			subContent.find(`#chkDarDokummu_label`)
				.off('mouseup, touchend')
				.on('mouseup, touchend', evt =>
					chkDarDokummu.prop('checked', !chkDarDokummu.prop('checked')));
			
			let chkDokumEkranami = subContent.find(`#chkDokumEkranami`);
			chkDokumEkranami.prop('checked', param.dokumEkranami);
			subContent.find(`#chkDokumEkranami_label`)
				.off('mouseup, touchend')
				.on('mouseup, touchend', evt =>
					chkDokumEkranami.prop('checked', !chkDokumEkranami.prop('checked')));
			
			let ddBarkodDevice = subContent.find(`#ddBarkodDevice`);
			ddBarkodDevice.jqxDropDownList({
				theme: theme, animationType: animationType,
				valueMember: 'kod', displayMember: 'aciklama',
				selectedIndex: 0, searchMode: 'containsignorecase',
				placeHolder: 'Seçiniz:', filterPlaceHolder: 'Bul:', filterable: false,
				dropDownHeight: 120, autoDropDownHeight: true, scrollBarSize: 25,
				width: isMiniDevice ? 300 : 380, height: 35, itemHeight: 35,
				source: $.merge(
					[ { kod: '', aciklama: '' } ],
					CETBarkodDevice.tip2DeviceKAListe || []
				)
			});
			ddBarkodDevice
				.off('change')
				.on('change', evt => {
					if (evt && evt.target)
						this.barkodDeviceTipDegisti({ kod: ddDokumDevice.val() });
				})
			const barkodDeviceTip = param.barkodDeviceTip;
			if (barkodDeviceTip)
				ddBarkodDevice.val(barkodDeviceTip);
			this.barkodDeviceTipDegisti({ kod: barkodDeviceTip });
			
			subContent.find('input')
				.off('keyup')
				.on('keyup', evt => {
					let key = (evt.key || '').toLowerCase();
					if (key == 'enter' || key == 'linefeed')
						this.btnTamam.click();
				});

			/*const height = $(window).height() - 10;
			let subContentWidget = this.subContentWidget = layout.find('.subContent-widget');
			subContentWidget.jqxPanel({ theme: theme, height: height });
			subContentWidget.jqxPanel('hScrollBar').hide();*/

			subContent.find(`#wsHostName`).focus();

			this.onResize(e);
		}

		ui2Inst(e) {
			const {subContent} = this;
			if (!subContent.jqxValidator('validate'))
				return false;
			
			$.extend(this.param, {
				wsHostName: subContent.find('#wsHostName').val().trim(),
				wsHostName2: subContent.find('#wsHostName2').val().trim(),
				varsayilanWSHostName: subContent.find('input[name="varsayilanWSHostName"]:checked').val(),
				wsPort: subContent.find('#wsPort').val().trim(),
				serbestModmu: subContent.find('#chkSerbestModmu').is(':checked'),
				gridAltMultiSelectFlag: subContent.find('#chkGridAltMultiSelect').is(':checked'),
				dogrudanFisListeyeGirilirmi: subContent.find('#chkDogrudanFisListe').is(':checked'),
				barkodluFisGirisYapilirmi: subContent.find('#chkBarkodluFisGiris').is(':checked'),
				fisGirisSadeceBarkodZorunlumu: subContent.find('#chkFisGirisSadeceBarkodZorunlumu').is(':checked'),
				geciciFisKullanilmazmi: subContent.find('#chkGeciciFisKullanilmaz').is(':checked'),
				listeKodDogrudanAramaYapilirmi: subContent.find('#chkListeKodDogrudanAramaYapilir').is(':checked'),
				fisOzetBilgiGosterilirmi: subContent.find('#chkFisOzetBilgiGosterilir').is(':checked'),
				otoSonStokGuncellenirmi: subContent.find('#chkOtoSonStokGuncellenir').is(':checked'),
				dokumDeviceTip: subContent.find('#ddDokumDevice').val(),
				dokumDeviceSP_baudRate: subContent.find('#dokumDeviceSP_baudRate').val(),
				dokumTurkceHarfYontemKod: subContent.find('#ddDokumTurkceHarfYontemi').val(),
				dokumEncoding: subContent.find(`#txtDokumEncoding`).val(),
				dokumDataPrefix: subContent.find(`#ddDokumDataPrefix`).jqxComboBox('input').val(),
				dokumDataPostfix: subContent.find(`#ddDokumDataPostfix`).jqxComboBox('input').val(),
				darDokummu: subContent.find('#chkDarDokummu').is(':checked'),
				dokumEkranami: subContent.find('#chkDokumEkranami').is(':checked')
			});

			return true;
		}


		async tamamIstendi(e) {
			if (!this.ui2Inst(e))
				return;
			
			e = $.extend({}, e, { sender: this, param: this.param });
			await this.app.paramKaydet(e);
			this.geriIstendi(e);

			let callback = this.tamamIslemi;
			if (callback)
				callback.call(this, e);
		}

		barkodYukleIstendi(e) {
			e = e || {};
			const wndName = e.wndName = `barkodYukle`;
			const {windows} = this;
			const templateWindows = this.templates.windows;
			let wnd = windows[wndName];
			if (wnd)
				wnd.jqxWindow('close');
			
			const wndContent = templateWindows.contents(`.${wndName}.ekran`).clone(true);
			wnd = windows[wndName] = createJQXWindow(
				wndContent,
				`Barkoddan Parametre Yükle Ekranı`,
				{	isModal: true, showCollapseButton: true, closeButtonAction: 'close',
					width: 'auto', height: $(window).height() - ($(window).width() < 450 ? 10 : 100)
				}
			);
			wnd.addClass(`part ${this.partName} ${wndName}`);
			wnd.on('close', evt =>
				this.barkodYukleIstendiDevam_ekranKapandi($.extend({}, e, { wnd: wnd, wndContent: wndContent })));
			this.barkodYukleIstendiDevam_ekranAcildi($.extend({}, e, { wnd: wnd, wndContent: wndContent }));
		}

		async barkodYukleIstendi_kameraAcKapat(e) {
			const {wndContent} = e;
			const barkodContainer = wndContent.find(`#barkodContainer`);
			let barcodeReader = this.barcodeReader;
			if (!barcodeReader) {
				const deviceClass = CETBarkodDevice.defaultDeviceClass;
				if (!deviceClass)
					return;
				
				barcodeReader = this.barcodeReader = new deviceClass({
					content: barkodContainer,
					debug: this.app.class.isDebug,
					onKamerami: this.app.onKamerami,
					readCallback: _e =>
						this.barkodYukleIstendiDevam_barkodOkundu($.extend({}, e, _e, { barkod: _e.result }))
				});
			}
			if (barcodeReader.isReady)
				await barcodeReader.start();
			else
				await barcodeReader.destroy();
			
			const btnBarkod = wndContent.find(`#btnBarkod`);
			btnBarkod.removeClass(`ready paused running`);
			btnBarkod.addClass(barcodeReader.state);
		}

		barkodYukleIstendiDevam_ekranAcildi(e) {
			this.barkodYukleIstendi_kameraAcKapat(e);

			const {wndContent} = e;
			wndContent.find(`#btnBarkod`).jqxButton({ theme: theme })
				.on('click', evt =>
					this.barkodYukleIstendi_kameraAcKapat($.extend({}, e, { event: evt })));
			
			const txtBarkod = e.txtBarkod = wndContent.find(`#txtBarkod`);
			txtBarkod.on('focus', evt => {
				const elm = evt.target;
				if (elm && elm.select)
					elm.select();
			});
			txtBarkod.on('keyup', evt => {
				const key = (evt.key || '').toLowerCase();
				if (key == 'enter' || key == 'linefeed')
					this.barkodYukleIstendiDevam_barkodOkundu($.extend({}, e, { event: evt, barkod: evt.target.value }));
			});
			txtBarkod.focus();
		}

		barkodYukleIstendiDevam_ekranKapandi(e) {
			e = e || {};
			if (this.barcodeReader) {
				this.barcodeReader.destroy();
				delete this.barcodeReader;
			}

			const {wndName, windows} = this;
			const wnd = e.wnd || windows[wndName];
			if (wnd && wnd.length)
				wnd.jqxWindow('destroy');
			delete windows[wndName];
		}

		barkodYukleIstendiDevam_barkodOkundu(e) {
			const {txtBarkod} = e;
			let {barkod} = e;
			if (txtBarkod)
				txtBarkod.focus();
			
			barkod = (barkod || '').trim();
			if (!barkod)
				return;
			
			const {param, windows} = this;
			let _param = CETParam.Deserialize(barkod);
			let degistimi = false;
			if (_param) {
				$.each(_param, (key, value) => {
					if (value) {
						degistimi = true;
						param[key] = value;
					}
				})
			}

			if (!degistimi) {
				displayMessage(`Yüklenecek Paremetre bilgisi bulunamadı!`, this.app.appText);
				return;
			}
			
			const wnd = e.wnd || windows.barkodYukle;
			if (wnd)
				wnd.jqxWindow('close');
			
			(async () => {
				this.postInitLayout();
				setTimeout(() => displayMessage(`Barkod ile okunan Paremetre bilgisi yüklendi`, this.app.appText), 100);
			})();
		}

		async barkodSaklaIstendi(e) {
			e = e || {};
			if (!this.ui2Inst(e))
				return;
			
			const {param} = this;
			const data = CObject.Serialize(param.asBasicParam());
			$.extend(e, {
				data: data,
				browserFlags: param.browserFlags
			})
			
			const wndName = e.wndName = `barkodSakla`;
			const {windows} = this;
			const templateWindows = this.templates.windows;
			let wnd = windows[wndName];
			if (wnd)
				wnd.jqxWindow('close');

			const wndContent = templateWindows.contents(`.${wndName}.ekran`).clone(true);
			wnd = windows[wndName] = createJQXWindow(
				wndContent,
				`Barkoddan Paremetre Saklama Ekranı`,
				{	isModal: true, showCollapseButton: true, closeButtonAction: 'close',
					width: 'auto', height: $(window).height() - ($(window).width() < 450 ? 10 : 100)
				}
			);
			wnd.addClass(`part ${this.partName} ${wndName}`);
			wnd.on('close', evt =>
				this.barkodSaklaIstendiDevam_ekranKapandi($.extend({}, e, { wnd: wnd, wndContent: wndContent })));
			this.barkodSaklaIstendiDevam_ekranAcildi($.extend({}, e, { wnd: wnd, wndContent: wndContent }));
		}

		async barkodSaklaIstendiDevam_kopyalaIstendi(e) {
			const {wndContent} = e;
			const txtBarkod = e.txtBarkod || wndContent.find(`#txtBarkod`);
			await navigator.clipboard.writeText(txtBarkod.val());
			txtBarkod.select();
			displayMessage(`Paremetre Bilgisi ara belleğe (<i>clipboard</i>) kopyalandı`, this.app.appText);
		}

		async barkodSaklaIstendiDevam_kopyalaFlagsIstendi(e) {
			const {wndContent} = e;
			const txtBrowserFlags = e.txtBrowserFlags || wndContent.find(`#txtBrowserFlags`);
			await navigator.clipboard.writeText(txtBrowserFlags.val());
			txtBrowserFlags.select();
			displayMessage(`(chrome://flags) bilgisi ara belleğe (<i>clipboard</i>) kopyalandı`, this.app.appText);
		}

		barkodSaklaIstendiDevam_ekranAcildi(e) {
			const {wndContent, data, browserFlags} = e;
			wndContent.find(`#btnKopyala`).jqxButton({ theme: theme })
				.on('click', evt =>
					this.barkodSaklaIstendiDevam_kopyalaIstendi($.extend({}, e, { event: evt })));
			wndContent.find(`#btnKopyalaFlags`).jqxButton({ theme: theme })
				.on('click', evt =>
					this.barkodSaklaIstendiDevam_kopyalaFlagsIstendi($.extend({}, e, { event: evt })));
			
			const txtBarkod = e.txtBarkod = wndContent.find(`#txtBarkod`);
			txtBarkod.val(data);
			txtBarkod.on('focus', evt => {
				const elm = evt.target;
				if (elm && elm.select)
					elm.select();
			});

			const imgBarkod = e.imgBarkod = wndContent.find(`#imgBarkod`);
			const qrCode = new QRCode(imgBarkod[0], {
				width: 130, height: 130,
				colorDark: "#000000",
				colorLight: "#ffffff",
				correctLevel: QRCode.CorrectLevel.H
			});
			qrCode.clear();
			qrCode.makeCode(data);

			const txtBrowserFlags = e.txtBrowserFlags = wndContent.find(`#txtBrowserFlags`);
			txtBrowserFlags.val(browserFlags);

			txtBarkod.focus();
		}

		barkodSaklaIstendiDevam_ekranKapandi(e) {
			e = e || {};
			const {wndName, windows} = this;
			const wnd = e.wnd || windows[wndName];
			if (wnd && wnd.length)
				wnd.jqxWindow('destroy');
			delete windows[wndName];
		}

		dokumDeviceTipDegisti(e) {
			e = e || {};
			const {subContent} = this;
			const kod = e.kod || subContent.find(`#ddDokumDevice`).val()

			if (kod == CETDokumDevice_SerialPort.tip)
				subContent.find('#dokumConfig_serialPort').removeClass('jqx-hidden');
			else
				subContent.find('#dokumConfig_serialPort').addClass('jqx-hidden');
		}

		dokumTurkceHarfYontemiDegisti(e) {
			e = e || {};
			const {subContent} = this;
			const kod = e.kod || subContent.find('#ddDokumTurkceHarfYontemi').val();

			if (kod == 'ENC')
				subContent.find('#dokumConfig_turkceHarfYontemi').removeClass('jqx-hidden');
			else
				subContent.find('#dokumConfig_turkceHarfYontemi').addClass('jqx-hidden');
		}

		barkodDeviceTipDegisti(e) {
		}

		async onResize(e) {
			await super.onResize(e);

			const {layout} = this;
			layout.height($(window).height() - layout.offset().top - 1);
		}
	}
})()
