(function() {
	window.CETDokumcu = class extends window.CObject {
		constructor(e) {
			e = e || {};
			super(e);

			this.initDokumDevice(e);
		}

		initDokumDevice(e) {
			e = e || {};
			let {dokumDevice} = e;
			if (!dokumDevice) {
				let cls = CETDokumDevice.defaultDeviceClass;
				if (cls)
					dokumDevice = new cls(e.dokumDeviceArgs);
			}
			
			//if (!dokumDevice)
			//	throw { isError: true, rc: 'dokumDeviceInit', errorText: 'Döküm Aygıtı belirlenemedi' };
			return (this.dokumDevice = dokumDevice);
		}

		async yazdir(e) {
			e = $.extend({}, e, { dokumcu: this });
			await this.yazdirDevam(e);
			
			e.dokumDevice = e.dokumDevice || this.dokumDevice;
			if (sky.app.param.dokumEkranami /*&& !((e.dokumDevice || {}).class || {}).ekranmi*/) {
				let _dokumDevice = e.dokumDevice;
				if (_dokumDevice.class.ekranmi)
					_dokumDevice = await this.initDokumDevice();
				
				return new $.Deferred(p => {
					e.dokumDevice = new CETDokumDevice_Ekran({
						display: true,
						yazdirIslemi: async _e =>
							p.resolve(await this.yazdirDevam2($.extend({}, e, _e, { dokumDevice: _dokumDevice, stream: null })))
					});
					return this.yazdirDevam2(e);
				});
			}
			
			return await this.yazdirDevam2(e);
		}

		async yazdirDevam(e) {
		}

		async yazdirDevam2(e) {
			const {dokumDevice} = e;
			const ekranami = e.ekranami == null ? (dokumDevice ? dokumDevice.class.ekranmi : false) : asBool(e.ekranami);
			const {param} = sky.app;
			const {darDokummu, dokumDataPrefix, dokumDataPostfix} = param;
			
			let sw = e.stream;
			if (!sw) {
				const srm = new WritableStream(dokumDevice);
				sw = e.stream = await srm.getWriter();
			}
			
			let result;
			try {
				if (!ekranami) {
					if (dokumDataPrefix || darDokummu) {
						if (dokumDataPrefix)
							await sw.write(eval(`'${dokumDataPrefix}'`));
						if (darDokummu)
							await sw.write(`\u000f`);
						// sw.write(CrLf);
					}
				}
				result = e.result = await this.writeToDevice(e);
				if (!ekranami) {
					if (dokumDataPostfix)
						await sw.write(eval(`'${dokumDataPostfix}'`));
						await sw.write(`${CrLf} `);
				}
			}
			finally {
				if (sw != null) {
					try { await sw.close() }
					catch (ex) {}
					
					sw.releaseLock();
				}
			}
			
			return e;
		}

		async writeToDevice(e) {
		}
	}
})()
