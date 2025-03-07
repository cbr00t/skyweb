(function() {
	window.CETDokumcu = class extends window.CObject {
		constructor(e) { e = e || {}; super(e); this.initDokumDevice(e) }
		initDokumDevice(e) {
			e = e || {}; let {dokumDevice} = e; if (!dokumDevice) { let cls = CETDokumDevice.defaultDeviceClass; if (cls) { dokumDevice = new cls(e.dokumDeviceArgs) } }
			return (this.dokumDevice = dokumDevice)
		}
		async yazdir(e) {
			e = { ...e, dokumcu: this }; await this.yazdirDevam(e);
			e.dokumDevice = e.dokumDevice || this.dokumDevice;
			if (e.ekranami ?? sky.app.param.dokumEkranami /*&& !((e.dokumDevice || {}).class || {}).ekranmi*/) {
				let {dokumDevice: _dokumDevice} = e; if (_dokumDevice.class.ekranmi) { _dokumDevice = await this.initDokumDevice() }
				return new $.Deferred(p => {
					e.dokumDevice = new CETDokumDevice_Ekran({
						display: true,
						yazdirIslemi: async _e => p.resolve(await this.yazdirDevam2({ ...e, ..._e, dokumDevice: _dokumDevice, stream: null }))
					})
					return this.yazdirDevam2(e)
				});
			}
			return await this.yazdirDevam2(e)
		}
		async yazdirDevam(e) { }
		async yazdirDevam2(e) {
			const {dokumDevice} = e, ekranami = e.ekranami == null ? (dokumDevice ? dokumDevice.class.ekranmi : false) : asBool(e.ekranami);
			const {app} = sky, {dokumZPLmi: zplmi, darDokummu, dokumDataPrefix, dokumDataPostfix} = app;
			let dokumNushaSayi = e.nushaSayi || app.dokumNushaSayi || 0;
			let {stream: sw} = e; if (!sw) { const srm = new WritableStream(dokumDevice); sw = e.stream = await srm.getWriter() }
			let result; try {
				const yazdirSayi = dokumNushaSayi + 1;
				for (let i = 0; i < yazdirSayi; i++) {
					if (!ekranami && (dokumDataPrefix || darDokummu)) {
						if (dokumDataPrefix) { await sw.write(eval(`'${dokumDataPrefix}'`)) }
						if (!zplmi && darDokummu) { await sw.write(`\u000f`) }
					}
					let _result = await this.writeToDevice(e);
					if (!ekranami && dokumDataPostfix) { await sw.write(eval(`'${dokumDataPostfix}'`)); await sw.write(`${CrLf} `) }
					if (result === undefined) { result = e.result = _result }
				}
			}
			finally { if (sw != null) { try { await sw.close() } catch (ex) { } sw.releaseLock() } }	
			return e
		}
		async writeToDevice(e) { }
	}
})()
