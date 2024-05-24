(function() {
	window.CETVeriYonetimiPart = class extends window.CETSubPart {
		constructor(e) {
			e = e || {};
			super(e);
			
			const {app} = this;
			$.extend(this, {
				param: this.param,
				bitince: e.bitince
				// kaydetIslemi: e.kaydetIslemi
			});
			if (!(this.layout || this.template))
				this.template = this.app.templates.cetVeriYonetimi;
		}

		static get partName() { return 'cetVeriYonetimi' }
		get adimText() { return 'Veri Yönetimi' }

		get options() {
			return {
				target: this.target,
				alinacaklar: this.alinacaklar
			}
		}

		get target() {
			return this.ui.inExpType.val();
		}

		get alinacaklar() {
			const {alinacaklar} = this.ui;
			const result = {};
			if (alinacaklar.param.prop('checked'))
				result.param = true;
			if (alinacaklar.belgeler.prop('checked'))
				result.belgeler = true;
			if (alinacaklar.sabitTanimlar.prop('checked'))
				result.sabitTanimlar = true;
			return result;
		}

		get alinacakVarmi() {
			return !$.isEmptyObject(this.alinacaklar);
		}


		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);

			const layout = e.layout || this.layout;
			/*const btnKaydet = this.btnKaydet
				= layout.find(`#kaydet`)
					.jqxButton({ theme: theme, width: 40, height: 45 });
			btnKaydet.on('click', evt =>
				this.kaydetIstendi($.extend({}, e, { event: evt })));*/
			
			const subContent = layout.find(`.subContent`);
			const ui = this.ui = {};
			const ddInExpType = ui.inExpType = subContent.find(`#ddInExpTypeParent #ddInExpType`);
			ddInExpType.jqxDropDownList({
				theme: theme, animationType: animationType,
				valueMember: 'kod', displayMember: 'aciklama',
				selectedIndex: 0, searchMode: 'containsignorecase',
				placeHolder: 'Veri Aktarım Yöntemi', filterPlaceHolder: 'Bul:', filterable: false, filterHeight: 50, filterDelay: 300,
				dropDownHeight: 350, autoDropDownHeight: true, itemHeight: 40, scrollBarSize: 18,
				width: 300, height: 40,
				source: new $.jqx.dataAdapter({
					id: 'kod', url: `empty.json`, datatype: `array`, cache: true,
					datafields: [
						{ name: 'kod', type: 'string' },
						{ name: 'aciklama', type: 'string' }
					],
					localdata: [
						new CKodVeAdi({ kod: 'W', aciklama: 'Web Sunucusu' })
						// new CKodVeAdi({ kod: 'D', aciklama: 'Yerel Dosya' })
					]
				}, { autoBind: true, async: true, cache: true })
			});
			/*ddInExpType.on('change', evt => {
				if (evt && evt.target)
					//this.dokumDeviceTipDegisti({ kod: ddDokumDevice.val() });
			});*/

			const alinacaklarParent = subContent.find(`#alinacaklarParent`);
			const uiAlinacaklar = ui.alinacaklar = {};
			const chkParam = uiAlinacaklar.param = alinacaklarParent.find(`#chkParamParent #chkParam`);
			chkParam.parent().find(`label`)
				.off('mouseup, touchend')
				.on('mouseup, touchend', evt =>
					chkParam.prop('checked', !chkParam.prop('checked')));
			chkParam.on('change', evt => {
				const flag = evt.currentTarget.checked;
				$(evt.currentTarget).parent()[flag ? 'addClass' : 'removeClass'](`checked`);
			});
			const chkBelgeler = uiAlinacaklar.belgeler = alinacaklarParent.find(`#chkBelgelerParent #chkBelgeler`);
			chkBelgeler.parent().find(`label`)
				.off('mouseup, touchend')
				.on('mouseup, touchend', evt =>
					chkBelgeler.prop('checked', !chkBelgeler.prop('checked')));
			chkBelgeler.on('change', evt => {
				const flag = evt.currentTarget.checked;
				$(evt.currentTarget).parent()[flag ? 'addClass' : 'removeClass'](`checked`);
			});
			const chkSabitTanimlar = uiAlinacaklar.sabitTanimlar = alinacaklarParent.find(`#chkSabitTanimlarParent #chkSabitTanimlar`);
			chkSabitTanimlar.parent().find(`label`)
				.off('mouseup, touchend')
				.on('mouseup, touchend', evt =>
					chkSabitTanimlar.prop('checked', !chkBelgeler.prop('checked')));
			chkSabitTanimlar.on('change', evt => {
				const divUyari = chkSabitTanimlar.parent().find(`.uyari`);
				const flag = evt.currentTarget.checked;
				divUyari[flag ? 'removeClass' : 'addClass'](`jqx-hidden`);
				$(evt.currentTarget).parent()[flag ? 'addClass' : 'removeClass'](`checked`);
			});

			const txtRemoteHostName = this.txtRemoteHostName = subContent.find(`#remoteHostNameParent #remoteHostName`);
			txtRemoteHostName.on('change', evt => {
				const value = txtRemoteHostName.val();
				const divUyari = txtRemoteHostName.parent().find(`.uyari`);
				divUyari[value ? 'addClass' : 'removeClass'](`jqx-hidden`);
			});
			txtRemoteHostName.trigger('change');
			
			const islemTuslariEk = layout.find(`#islemTuslari-ek`);
			const btnImport = islemTuslariEk.find(`#btnImport`)
				.jqxButton({ theme: theme, width: 230, height: 60 });
			btnImport.on('click', evt =>
				this.importIstendi({ event: evt }));
			const btnExport = islemTuslariEk.find(`#btnExport`)
				.jqxButton({ theme: theme, width: 230, height: 60 });
			btnExport.on('click', evt =>
				this.exportIstendi({ event: evt }));
			
			layout.find('input').on('focus', evt =>
				evt.currentTarget.select());

			setTimeout(() =>
				btnExport.focus(),
				100);
		}

		onKontrolMesaji(e) {
			if (!this.alinacakVarmi)
				return `Alınacak Bilgilerden en az bir tanesi seçilmelidir`;
			
			return null;
		}

		getCloudURLBase(e) {
			let result = this.txtRemoteHostName.val() || 'https://cloud.vioyazilim.com.tr:90/';
			if (!result || !result.startsWith('http'))
				result = 'http://' + (result || '');
			if (!result || !result.endsWith('/'))
				result = (result || '') + '/';
			return result;
		}

		importIstendi(e) {
			e = $.extend({}, e || {}, { islem: 'import' });
			return this.islemYapIstendi(e);
		}

		exportIstendi(e) {
			e = $.extend({}, e || {}, { islem: 'export' });
			return this.islemYapIstendi(e);
		}

		async islemYapIstendi(e) {
			const {app, adimText, target} = this;
			delete e.event;
			
			const {islem} = e;
			if (!(islem == 'import' || islem == 'export'))
				return false;
			
			let errText = await this.onKontrolMesaji(e);
			if (errText) {
				displayMessage(`${errText}`, `@ ${adimText} @`);
				return false;
			}

			const islemAdi = e.islemAdi = 
				islem == 'import' ? `İçeri Veri Yükleme` :
				islem == 'export' ? `Dışarı Veri Aktarım` :
				'';
			
			if (target == 'D') {
				displayMessage(`<u>Dosya</b> ile <b>${islemAdi}</b> işlemi desteklenmiyor`, `@ ${adimText} @`);
				return false;
			}
			else if (target == 'W') {
				/*if (islem == 'import') {
					displayMessage(`<u>Bulut</b> üzerinden <b>İçeri Veri Alma</b> işlemi yapılamaz`, `@ ${adimText} @`);
					return false;
				}*/
			}

			if (islem == 'import') {
				await new $.Deferred(p => {
					displayMessage(
						`<p><span class="bold red">UYARI:</b> <span class="bold darkred">Seçilen bilgiler yerelden silinip, dosyadan yüklenecek.</span></p><p>Devam edilsin mi?</p>`,
						this.adimText,
						true,
						{
							EVET: (dlgUI, btnUI) => {
								p.resolve(true);
								dlgUI.jqxWindow('close');
							},
							HAYIR: (dlgUI, btnUI) => {
								p.reject(false);
								dlgUI.jqxWindow('close');
							}
						}
					)
				});
			}

			/*if (this.isComponent)
				await this.destroyPart(e);
			else
				await this.geriIstendi(e);*/

			await showProgress(`${islemAdi} yapılıyor...`, null, 1);
			const cloudURLBase = e.cloudURLBase = this.getCloudURLBase();
			const savedWSURLBase = wsURLBase;
			try {
				let result;
				e.sender = this;
				switch (target) {
					case 'W':
						switch (islem) {
							case 'import':
								wsURLBase = e.cloudURL = `${cloudURLBase}debug/cetImport.json`
								result = await app.veriYonetimi_cloud_import(e);
								break;
							case 'export':
								wsURLBase = e.cloudURL = `${cloudURLBase}cetExport.php`
								result = await app.veriYonetimi_cloud_export(e);
								break;
						}
						break;
				}
				
				if (result && !(result || {}).isError) {
					if (this.isComponent)
						await this.destroyPart(e);
					else
						await this.geriIstendi(e);

					let handler = this.bitince;
					if (handler)
						handler.call(this, e, { sender: this });
				}

				if (result && result.isError)
					throw result;
				
				setTimeout(() =>
					displayMessage(
						(
							`<p class="bold">${islemAdi} işlemi tamamlandı.</p>` +
							(result && result.result ? `<p>${result.result.toString()}</p>` : '')
						), `${adimText}`),
					100);
				
				return result;
			}
			catch (ex) {
				if (ex.errorText)
					displayMessage(ex.errorText, `@ ${adimText} @`)
				else
					defFailBlock(ex);
			}
			finally {
				const {app} = this;
				wsURLBase = savedWSURLBase;
				if (app.hasKnobProgress)
					await app.knobProgressHideWithReset({ delayMS: 1500 });
				else
					setTimeout(() => hideProgress(), 1500);
			}
		}
	}
})()
