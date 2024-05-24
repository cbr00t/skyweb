(function() {
	window.SkyConfigParamPart = class extends window.SubPart {
		constructor(e) {
			e = e || {};
			super(e);

			const {app, partName} = this;
			$.extend(this, {
				tamamIslemi: e.tamamIslemi,
				param: app.param.deepCopy()
			});
			if (!(this.layout || this.template)) {
				const {templatesOrtak} = app;
				if (templatesOrtak && templatesOrtak.length)
					this.template = app.templatesOrtak.find(`#${partName}.part`);
			}
		}

		static get partName() { return 'skyConfigParam' }
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

			elm = subContent.find(`#wsPort`)
						.jqxInput({ theme: theme, width: isMiniDevice ? 90 : 130, height: false });
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
					}
				]
			});
			
			subContent.find('input')
				.off('keyup')
				.on('keyup', evt => {
					let key = (evt.key || '').toLowerCase();
					if (key == 'enter' || key == 'linefeed')
						this.btnTamam.click();
				});

			subContent.find(`#wsHostName`).focus();
			this.onResize(e);
		}

		ui2Inst(e) {
			const {subContent} = this;
			if (!subContent.jqxValidator('validate'))
				return false;
			
			$.extend(this.param, {
				wsHostName: subContent.find('#wsHostName').val().trim(),
				wsPort: subContent.find('#wsPort').val().trim()
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
					return
				barcodeReader = this.barcodeReader = new deviceClass({
					content: barkodContainer,
					debug: this.app.class.isDebug,
					onKamerami: this.app.onKamerami,
					readCallback: _e =>
						this.barkodYukleIstendiDevam_barkodOkundu($.extend({}, e, _e, { barkod: _e.result }))
				});
			}
			if (!barcodeReader.initFlag || barcodeReader.isReady)
				await barcodeReader.start()
			else
				await barcodeReader.destroy()
			
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

			const {layout, subContent} = this;
			layout.height($(window).height() - layout.offset().top - 1);
			subContent.height(layout.height());
		}
	}
})()
