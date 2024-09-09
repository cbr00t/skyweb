(function() {
	/*
		a = new WritableStream(new CETDokumDevice_Console());
		b=a.getWriter();
		b.write('1234567890');
		b.write('abc');
		b.write('ABCDEFG');
		// b.abort();
		await b.close();
		b.releaseLock();
	*/
	window.CETDokumDevice = class extends window.CObject {
		static get tip() { return null } static get aciklama() { return null } static get bufferSize() { return 0 }
		static get progressStepModIndex() { return 4 } static get chunkDelayMS() { return 0 } static get ekranmi() { return false }
		static get defaultDeviceClass() { return this.deviceFor({ tip: sky.app.param.dokumDeviceTip }) } get harfDonusumDict() { return this.class.harfDonusumDict }
		static get tip2Device() {
			let result = this._tip2Device;
			if (!result) {
				result = this._tip2Device = {};
				for (const cls of [CETDokumDevice_QuickPrint, CETDokumDevice_SerialPort, CETDokumDevice_Ekran, CETDokumDevice_Console]) {
					const tip = cls.tip; if (tip) { result[tip] = cls }
				}
			}
			return result
		}
		static get tip2DeviceKAListe() {
			let result = this._tip2DeviceKAListe;
			if (!result) {
				result = this._tip2DeviceKAListe = [];
				// const hiddenKodSet = asSet([CETDokumDevice_Console].map(cls => cls.tip));
				const hiddenKodSet = {};
				for (const [tip, cls] of Object.entries(this.tip2Device)) { if (!hiddenKodSet[tip]) { result.push(new CKodVeAdi({ kod: tip, aciklama: cls.aciklama || tip })) } }
			}
			return result
		}
		static get kod2TurkceHarfYontem() {
			let result = this._kod2TurkceHarfYontem;
			if (!result) {
				result = this._kod2TurkceHarfYontem = {
					''   : 'Türkçe Harfler Gönderilir',
					'TRS': 'TÜRKÇE HARFSİZ olarak Gönderilir',
					'ENC': 'Karakter Kodlaması Değiştirilir'
				};
			}
			return result
		}
		static get turkceHarfYontemKAListe() {
			let result = this._turkceHarfYontemKAListe;
			if (!result) {
				result = this._turkceHarfYontemKAListe = []; const hiddenKodSet = {};
				for (const [kod, aciklama] of Object.entries(this.kod2TurkceHarfYontem)) { if (!hiddenKodSet[kod]) { result.push(new CKodVeAdi({ kod, aciklama })) } }
			}
			return result
		}
		static get harfDonusumDict() {
			const {param} = sky.app; if (param.turkceHarfYontem_turkcesizmi) { return this.turkceHarfDonusumu }
			if (param.turkceHarfYontem_karakterKodlamasiDegistirmi) { return this.harfEncodingDonusumu }
			return null
		}
		static get turkceHarfDonusumu() {
			let result = this._turkceHarfDonusumu;
			if (!result) {
				result = this._turkceHarfDonusumu = {
					'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
					'Ç': 'C', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U'
				};
			}
			return result
		}
		static get harfEncodingDonusumu() {
			if (this.ekranmi) { return null }
			let result = this._harfEncodingDonusumu;
			if (!result) {
				result = this._harfEncodingDonusumu = new class extends CObject {
					encodeText(e) {
						const value = e?.value ?? e; if (!value) { return value }
						return new TextDecoder(sky.app.param.dokumEncodingUyarlanmis).decode(new TextEncoder('utf-8').encode(value))
					}
					encodeChars(e) {
						const value = e?.value ?? e;;
						let result = value; if ($.isEmptyObject(result)) { return result } result = this.encodeText({ value: result.join('') });
						if (result == null || result.isError) { return result }
						result = result.split(''); return result
					}
					encodeSingleChar(e) { return this.encodeText(e) }
				}
			}
			return result
		}
		static get dokumEpsonChars() {
			let result = this._dokumEpsonChars;
			if (!result) {
				result = this._dokumEpsonChars = [
					new CKodVeAdi({ kod: `\u000f`, aciklama: 'Dar Döküm' }),
					new CKodVeAdi({ kod: `\u0012`, aciklama: 'Geniş Döküm' }),
					new CKodVeAdi({ kod: `\u001bG`, aciklama: 'Koyu Punto' }),
					new CKodVeAdi({ kod: `\u001bH`, aciklama: 'Normal Punto' })
				]
			}
			return result
		}
		static get encodingConvertTable() {
			let result = this._encodingConvertTable;
			if (!result) {
				result = this._encodingConvertTable = {
					'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ü': 'u', 'ş': 's',
					'Ç': 'C', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ü': 'U', 'Ş': 'S'
				}
			}
			return result
		}
		constructor(e) {
			e = e || {}; super(e);
			$.extend(this, {
				queue: [], bufferSize: e.bufferSize || this.class.bufferSize, chunkDelayMS: this.class.chunkDelayMS,
				callback: e.callback, progressStepModIndex: e.progressStepModIndex || this.class.progressStepModIndex
			})
		}
		static deviceFor(e) { const tip = (typeof e == 'object' ? e.tip : e) || ''; return this.tip2Device[tip] }
		async start(controller) {
			this.processedChunkCount = 0;
			const {chunkDelayMS} = this; if (chunkDelayMS) { this.timerQueue = setInterval(() => this.processQueueDirect(), chunkDelayMS) }
			console.debug('stream opened')
		}
		async write(chunk, controller) {
			const bufferSize = this.bufferSize || 0;
			if (bufferSize > 0 && typeof chunk == 'string') {
				if (chunk.length > bufferSize) {
					while (chunk.length) { this.queue.push(chunk.slice(0, bufferSize)); chunk = chunk.slice(bufferSize) }
					if (!this.timerQueue) { await this.processQueue() } return
				}
			}
			this.queue.push(chunk); if (!this.timerQueue) { await this.processQueue() }
		}
		async close() {
			if (this.timerQueue) {
				let promise = this.promiseQueue = new Promise(resolve => {
					this.timerQueueWait = setInterval(() => {
						if (!this.queue.length) { for (const key of ['timerQueue', 'timerQueueWait']) { clearInterval(this[key]); delete this[key] } resolve() }
					}, 50);
				});
				await promise
			}
			if (this.queue) { await this.processQueue() }
			console.debug('stream closed');
			let callback = this.callback; if ($.isFunction(callback)) { callback.call(this, { device: this }) }
		}
		async abort(e) {
			if (this.timerQueue) { clearInterval(this.timerQueue); delete this.timerQueue }
			await this.close(); console.debug('stream aborted', e)
		}
		async processQueue(e) { const queue = this.queue; while (queue.length) { await this.processQueueDirect(e) } }
		async processQueueDirect(e) {
			const queue = this.queue; let value = queue.shift(); if (value == null) { return value }
			return await this.onChunkReceived($.extend({}, e, { value }));
		}
		async onChunkReceived(e) {
			let totalChunkCount = ++this.processedChunkCount; const progressStepModIndex = this.progressStepModIndex;
			console.debug('stream chunk received', e);
			if (progressStepModIndex && totalChunkCount != null && totalChunkCount % progressStepModIndex == progressStepModIndex - 1) {
				const {app} = sky; if (app.hasKnobProgress) { await app.knobProgressStep() }
			}
		}
		convertString(e) {
			e = e || {}; let value = typeof e == 'object' ? e.value : e;
			if (!(value && typeof value == 'string')) { return value }
			const convertDict = this.class.encodingConvertTable; let newValue = '';
			for (let ch of value) { ch = convertDict[ch] || ch; newValue += ch }
			return newValue
		}
	}
	window.CETDokumDevice_Ekran = class extends window.CETDokumDevice {
		static get tip() { return 'ekran' } static get aciklama() { return 'Ekran' }
		static get bufferSize() { return 50 } static get chunkDelayMS() { return 0 } static get ekranmi() { return true }
		constructor(e) {
			e = e || {}; super(e);
			$.extend(this, { display: asBool(e.display), yazdirIslemi: e.yazdirIslemi })
		}
		async start(controller) {
			this.text = ''; await super.start(controller);
			if (this.display) { await this.show() }
		}
		async close() {
			await super.close(); hideProgress();
			if (this.display) { await this.show() }
		}
		async show() {
			let part = this.onizlemePart; if (part?.isDestroyed) { part = this.onizlemePart = null }
			if (!part) {
				part = this.onizlemePart = new CETDokumOnizlemePart({ printOutput: this.text, yazdirIslemi: this.yazdirIslemi, geriCallback: (e => part = this.onizlemePart = null) });
				await part.run();
			}
		}
		async onChunkReceived(e) {
			await super.onChunkReceived(e); const value = e?.value?.toString() ?? ''; this.text += value; console.debug(value);
			let part = this.onizlemePart; if (part && part.isDestroyed) { part = this.onizlemePart = null }
			if (part) { part.write({ text: value }) }
		}
	}
	window.CETDokumDevice_Console = class extends window.CETDokumDevice {
		static get tip() { return 'console' } static get aciklama() { return 'Browser Console' }
		static get bufferSize() { return 50 } static get chunkDelayMS() { return 10 }		
		constructor(e) { e = e || {}; super(e) }
		async start(controller) { this.buffer = ''; await super.start(controller); console.warn('-- doküm başladı --') }
		async close() {
			let {buffer} = this; await this.beforeClose({ buffer }); buffer = this.buffer;
			if (buffer) { this.flushBuffer() }
			await super.close(); console.warn('-- doküm bitti --')
		}
		async beforeClose(e) { }
		async onChunkReceived(e) {
			await super.onChunkReceived(e); const value = e?.value?.toString() ?? '';
			for (let ch of value) {
				if (ch == '\r') { continue }
				if (ch == '\n') { this.flushBuffer() } else { this.buffer += ch }
			}
		}
		flushBuffer() {
			let buffer = this.buffer || ' ';
			if (this.flushBufferInternal({ buffer: buffer }) === false) { return }
			this.buffer = '';
		}
		flushBufferInternal(e) { console.info(e.buffer) }
	}
	window.CETDokumDevice_SerialPort = class extends window.CETDokumDevice {
		static get tip() { return 'serialPort' } static get aciklama() { return 'Seri Port' }
		static get bufferSize() { return 80 } static get chunkDelayMS() { return 10 } static get defaultBaudRate() { return sky.app.param.dokumDeviceSP_baudRate }
		static get baudRates() {
			let result = this._baudRates; if (!result) {
				result = this._baudRates = [];
				for (const kod of [9600, 115200, 4800, 2400]) { result.push(new CKodVeAdi({ kod, aciklama: kod.toString() })) }
			}
			return result
		}
		constructor(e) { e = e || {}; super(e); $.extend(this, { baudRate: this.class.defaultBaudRate, serialController: navigator.serial }); }
		async start(controller) {
			await super.start(controller);
			const serialController = this.serialController, serialPorts = await serialController.getPorts();
			let serialPort = serialPorts.length ? serialPorts[serialPorts.length - 1] : await serialController.requestPort();
			if (!serialPort.readable) { const {baudRate} = this; await serialPort.open({ baudRate }) }
			this.serialPort = serialPort; const srmSerial = this.srmSerial = serialPort.writable, srm = new TextEncoderStream();
			srm.readable.pipeTo(srmSerial); this.sw = await srm.writable.getWriter()
		}
		async close() {
			await super.close(); const {sw, srmSerial} = this;
			if (sw) {
				try { await sw.close() } catch (ex) { /*console.error(ex)*/ } try { await sw.releaseLock() } catch (ex) { /*console.error(ex)*/ }
				this.sw = null
			}
			if (srmSerial) {
				try { await srmSerial.close() } catch (ex) { /*console.error(ex)*/ } try { await srmSerial.releaseLock() } catch (ex) { /*console.error(ex)*/ }
				this.srmSerial = null
			}
		}
		async onChunkReceived(e) {
			await super.onChunkReceived(e); const sw = this.sw; if (!sw) { return }
			let value = e?.value?.toString() ?? ''; value = this.convertString({ value }); await sw.write(value)
		}
	}
	window.CETDokumDevice_HrefBased = class extends window.CETDokumDevice {
		static get bufferSize() { return 1000 } static get chunkDelayMS() { return 0 }
		constructor(e) { e = e || {}; super(e); }
		async start(controller) { this.buffer = ''; await super.start(controller); }
		async close() {
			let {buffer} = this; if (buffer) {
				const encodedBuffer = encodeURI(buffer);	/*.replaceAll('%C2%A0', ' ');
					.replaceAll('%3C', '<').replaceAll('%3E', '>').replaceAll('%20', ' ').replaceAll('%0A', '\n');
					.replaceAll('%0A', '\\n').replaceAll('%3C', '<').replaceAll('%3E', '>');*/
				let result = await this.beforeClose({ buffer, encodedBuffer });
				if (result) { buffer = this.buffer = '' } else if (result === false) { return }
			}
			await super.close()
		}
		async beforeClose(e) { return true }
		async onChunkReceived(e) {
			await super.onChunkReceived(e); const value = e?.value?.toString() ?? '';
			this.buffer += value.replaceAll('\r', '')
		}
	}
	window.CETDokumDevice_QuickPrint = class extends window.CETDokumDevice_HrefBased {
		static get tip() { return 'quickPrint' } static get aciklama() { return 'Quick Print' }
		constructor(e) { e = e || {}; super(e); }
		async beforeClose(e) {
			let result = await super.beforeClose(e); if (!result) { return result }
			const {encodedBuffer} = e, url = `intent://${encodedBuffer}#Intent;scheme=quickprinter;package=pe.diegoveloper.printerserverapp;end;`;
			/*url = `quickprinter://${encodedBuffer}`; */
			/*url = `intent://${encodedBuffer}#Intent;scheme=quickprinter;package=pe.diegoveloper.printerserverapp;end;`;*/
			/*location.href = url;*/ window.open(url);
			/* location.href = `intent://${encodedBuffer}#Intent;scheme=quickprinter;package=mate.bluetoothprint;end;`;*/
			return true
		}
	}
})()
