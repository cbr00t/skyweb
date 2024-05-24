(function() {
	window.SosyalDurumHizmetDokumundenYuklePart = class extends window.SosyalDurumXYuklePart {
		constructor(e) {
			e = e || {};
			super(e);
		}

		static get partName() { return 'hizmetDokumundenYukle' }
		get adimText() { return 'Hizmet Dökümünden Yükleme' }


		preInitLayout(e) {
			e = e || {};
			super.preInitLayout(e);

			const layout = e.layout || this.layout;
			const inputDosya = this.inputDosya = layout.find(`#dosya`);
			inputDosya.on('click', evt =>
				this.dosyaSecIstendi($.extend({}, e, { event: evt })));
			inputDosya.on('change', evt =>
				this.dosyaSecildi($.extend({}, e, { event: evt })));
		}

		initActivatePartOrtak(e) {
			e = e || {};
			const {inputDosya} = this;
			if (inputDosya && inputDosya.length)
				inputDosya[0].value = '';
			
			// delete this.fileInfo;
			this.btnBaslat.addClass(`jqx-hidden`);

			super.initActivatePartOrtak(e);
		}

		async baslatIstendi(e) {
			await super.baslatIstendi(e);

			setButonEnabled(this.btnBaslat, false);
			// showProgress(`Hizmet Dökümü Dosyası merkeze gönderiliyor...`, ` `, 500);
			((window.savedProcs || {}).showProgress || showProgress)(
				`Hizmet Dökümü Dosyası merkeze gönderiliyor...`, ` `, 500);
			try {
				let result = await this.wsHizmetDokumuKaydet(e);
				await this.veriYuklendi($.extend({}, e, { fileInfo: this.fileInfo, result: result }));
			}
			catch (ex) {
				defFailBlock(ex);
				throw ex;
			}
			finally {
				((window.savedProcs || {}).hideProgress || hideProgress)();
				hideProgress();
				setButonEnabled(this.btnBaslat, true);
			}
		}

		dosyaSecIstendi(e) {
			delete this.fileInfo;
			this.btnBaslat.addClass(`jqx-hidden`);
		}

		dosyaSecildi(e) {
			if (this.disableEventsFlag || this.inFileSelectEventFlag)
				return;
			
			const evt = e.event;
			const {target} = evt;
			if (!target)
				return;
			
			const file = target.files[0];
			if (!file)
				return;

			const fileReader = new FileReader();
			this.inFileSelectEventFlag = true;
			fileReader.onload = evt => {
				const {target} = evt;
				this.inFileSelectEventFlag = false;
				this.fileInfo = {
					name: file.name,
					extension: file.name.split('.').slice(-1)[0],
					contentType: file.type || `application/octet-stream`,
					data: btoa(target.result)
				};
				this.btnBaslat.removeClass(`jqx-hidden`);
			};
			fileReader.onerror = evt => {
				this.inFileSelectEventFlag = false;
				defFailBlock(evt);
			};
			fileReader.readAsBinaryString(file);
		}

		async wsHizmetDokumuKaydet(e) {
			const {fileInfo} = this;
			if (!fileInfo)
				throw { isError: true, rc: 'noFileSelected', errorText: 'Dosya seçilmelidir' };
			
			const qsArgs = this.buildAjaxArgs({
				dosyaAdi: fileInfo.name,
				dosyaExt: fileInfo.extension,
				dosyaContentType: fileInfo.contentType
			});

			let result;
			try {
				lastAjaxObj = $.post({
					cache: false,
					contentType: fileInfo.contentType,
					url: `${this.wsURLBase}hizmetDokumuKaydet/?${$.param(qsArgs)}`,
					data: fileInfo.data,
					processData: false
				});
				result = (await lastAjaxObj) || {}
			}
			catch (ex) {
				((window.savedProcs || {}).hideProgress || hideProgress)();
				hideProgress();
				// defFailBlock(ex);
				throw ex;
			}

			return result;
		}
	}
})()
