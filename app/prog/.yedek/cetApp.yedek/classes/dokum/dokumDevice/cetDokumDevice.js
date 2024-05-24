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
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				queue: [],
				bufferSize: e.bufferSize || this.class.bufferSize,
				chunkDelayMS: this.class.chunkDelayMS,
				callback: e.callback,
				progressStepModIndex: e.progressStepModIndex || this.class.progressStepModIndex
			})
		}

		static get tip2Device() {
			let result = this._tip2Device;
			if (!result) {
				result = this._tip2Device = {};
				[
					CETDokumDevice_QuickPrint, CETDokumDevice_SerialPort,
					CETDokumDevice_Ekran, CETDokumDevice_Console
				].forEach(cls => {
					const tip = cls.tip;
					if (tip)
						result[tip] = cls;
				})
			}
			return result
		}
		static get tip2DeviceKAListe() {
			let result = this._tip2DeviceKAListe;
			if (!result) {
				result = this._tip2DeviceKAListe = [];
				// const hiddenKodSet = asSet([CETDokumDevice_Console].map(cls => cls.tip));
				const hiddenKodSet = {};
				$.each(this.tip2Device, (tip, cls) => {
					if (!hiddenKodSet[tip])
						result.push(new CKodVeAdi({ kod: tip, aciklama: cls.aciklama || tip }));
				})
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
				result = this._turkceHarfYontemKAListe = [];
				// const hiddenKodSet = asSet([CETDokumDevice_Console].map(cls => cls.tip));
				const hiddenKodSet = {};
				$.each(this.kod2TurkceHarfYontem, (kod, aciklama) => {
					if (!hiddenKodSet[kod])
						result.push(new CKodVeAdi({ kod: kod, aciklama: aciklama }));
				})
			}
			return result
		}

		static get harfDonusumDict() {
			const {param} = sky.app;
			if (param.turkceHarfYontem_turkcesizmi)
				return this.turkceHarfDonusumu;
			if (param.turkceHarfYontem_karakterKodlamasiDegistirmi)
				return this.harfEncodingDonusumu;
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
			if (this.ekranmi)
				return null;

			let result = this._harfEncodingDonusumu;
			if (!result) {
				result = this._harfEncodingDonusumu = new class extends CObject {
					encodeText(e) {
						const value = e ? (e.value == null ? e : e.value) : e;
						if (!value)
							return value;
						return new TextDecoder(sky.app.param.dokumEncodingUyarlanmis).decode(new TextEncoder('utf-8').encode(value))
					}
					encodeChars(e) {
						const value = e ? (e.value == null ? e : e.value) : e;
						let result = value;
						if ($.isEmptyObject(result))
							return result;
						result = this.encodeText({ value: result.join('') });
						if (result == null || result.isError)
							return result;
						result = result.split('');
						return result
					}
					encodeSingleChar(e) {
						return this.encodeText(e)
					}
				}
			}
			return result
		}
		get harfDonusumDict() {
			return this.class.harfDonusumDict
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

		static get tip() { return null }
		static get aciklama() { return null }
		static get bufferSize() { return 0 }
		static get progressStepModIndex() { return 4 }
		static get chunkDelayMS() { return 0 }
		static get ekranmi() { return false }

		static get encodingConvertTable() {
			let result = this._encodingConvertTable;
			if (!result) {
				result = this._encodingConvertTable = {
					'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ü': 'u', 'ş': 's',
					'Ç': 'C', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ü': 'U', 'Ş': 'S'
				};
			}

			return result;
		}

		static get defaultDeviceClass() {
			return this.deviceFor({ tip: sky.app.param.dokumDeviceTip })
		}

		static deviceFor(e) {
			const tip = (typeof e == 'object' ? e.tip : e) || '';
			return this.tip2Device[tip]
		}

		async start(controller) {
			this.processedChunkCount = 0;

			const {chunkDelayMS} = this;
			if (chunkDelayMS) {
				this.timerQueue = setInterval(() =>
					this.processQueueDirect(),
					chunkDelayMS);
			}
			
			console.debug('stream opened');
		}

		async write(chunk, controller) {
			const bufferSize = this.bufferSize || 0;
			if (bufferSize > 0 && typeof chunk == 'string') {
				if (chunk.length > bufferSize) {
					while (chunk.length) {
						this.queue.push(chunk.slice(0, bufferSize));
						chunk = chunk.slice(bufferSize);
					}
					if (!this.timerQueue)
						await this.processQueue();
					return;
				}
			}

			this.queue.push(chunk);
			if (!this.timerQueue)
				await this.processQueue();
		}

		async close() {
			if (this.timerQueue) {
				let promise = this.promiseQueue = new Promise(resolve => {
					this.timerQueueWait = setInterval(() => {
						if (!this.queue.length) {
							['timerQueue', 'timerQueueWait'].forEach(key => {
								clearInterval(this[key]);
								delete this[key];
							});
							resolve();
						}
					}, 50);
				});
				await promise;
			}

			if (this.queue)
				await this.processQueue();

			console.debug('stream closed');

			let callback = this.callback;
			if ($.isFunction(callback))
				callback.call(this, { device: this });
		}

		async abort(e) {
			if (this.timerQueue) {
				clearInterval(this.timerQueue);
				delete this.timerQueue;
			}

			await this.close();
			console.debug('stream aborted', e);
		}


		async processQueue(e) {
			const queue = this.queue;
			while (queue.length)
				await this.processQueueDirect(e);
		}

		async processQueueDirect(e) {
			const queue = this.queue;
			let value = queue.shift();
			if (value == null)
				return value;
			
			return await this.onChunkReceived($.extend({}, e, { value: value }));
		}

		async onChunkReceived(e) {
			let totalChunkCount = ++this.processedChunkCount;
			const progressStepModIndex = this.progressStepModIndex;

			console.debug('stream chunk received', e);
			
			if (progressStepModIndex && totalChunkCount != null && totalChunkCount % progressStepModIndex == progressStepModIndex - 1) {
				const app = sky.app;
				if (app.hasKnobProgress)
					await app.knobProgressStep();
			}
		}

		convertString(e) {
			e = e || {};
			let value = typeof e == 'object' ? e.value : e;
			if (!(value && typeof value == 'string'))
				return value;
			
			const convertDict = this.class.encodingConvertTable;
			let newValue = '';
			for (let i in value) {
				let ch = value[i];
				ch = convertDict[ch] || ch;
				newValue += ch;
			}

			return newValue;
		}
	};


	window.CETDokumDevice_Ekran = class extends window.CETDokumDevice {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				display: asBool(e.display),
				yazdirIslemi: e.yazdirIslemi
			});
		}

		static get tip() { return 'ekran' }
		static get aciklama() { return 'Ekran' }
		static get bufferSize() { return 50 }
		static get chunkDelayMS() { return 0 }
		static get ekranmi() { return true }


		async start(controller) {
			this.text = '';
			await super.start(controller);

			if (this.display)
				await this.show();
		}

		async close() {
			await super.close();

			/*if (this.display) {
				let proc = (window.savedProcs || {}).displayMessage || window.displayMessage;
				proc(`<code style="color: #558; font-size: 110%; overflow-y: auto;">${this.text.replaceAll(CrLf, `<br/>${CrLf}`)}</code>`, 'Döküm Önizleme');
			}*/

			hideProgress();
			
			if (this.display)
				await this.show();
		}

		async show() {
			let part = this.onizlemePart;
			if (part && part.isDestroyed)
				part = this.onizlemePart = null;
			
			if (!part) {
				part = this.onizlemePart = new CETDokumOnizlemePart({
					printOutput: this.text,
					yazdirIslemi: this.yazdirIslemi,
					geriCallback: (e =>
						part = this.onizlemePart = null)
				});
				await part.run();
			}
		}

		async onChunkReceived(e) {
			await super.onChunkReceived(e);

			const value = (e.value || '').toString();
			this.text += value;
			console.debug(value);

			let part = this.onizlemePart;
			if (part && part.isDestroyed)
				part = this.onizlemePart = null;
			
			if (part)
				part.write({ text: value });
		}
	};


	window.CETDokumDevice_Console = class extends window.CETDokumDevice {
		constructor(e) {
			e = e || {};
			super(e);
		}

		static get tip() { return 'console' }
		static get aciklama() { return 'Browser Console' }
		static get bufferSize() { return 50 }
		static get chunkDelayMS() { return 10 }		

		async start(controller) {
			this.buffer = '';
			await super.start(controller);
			console.warn('-- doküm başladı --');
		}

		async close() {
			await this.beforeClose({ buffer: this.buffer });
			if (this.buffer)
				this.flushBuffer();
			
			await super.close();
			console.warn('-- doküm bitti --');
		}

		async beforeClose(e) {
		}

		async onChunkReceived(e) {
			await super.onChunkReceived(e);
			
			const value = (e.value || '').toString();
			for (let i in value) {
				let ch = value[i];
				if (ch != '\r') {
					if (ch == '\n')
						this.flushBuffer();
					else
						this.buffer += ch;
				}
			}
		}

		flushBuffer() {
			let buffer = this.buffer || ' ';
			if (this.flushBufferInternal({ buffer: buffer }) === false)
				return;
			this.buffer = '';
		}

		flushBufferInternal(e) {
			console.info(e.buffer);
		}
	};

	
	window.CETDokumDevice_SerialPort = class extends window.CETDokumDevice {
		/*  serialPorts = await navigator.serial.getPorts();
			serial = serialPorts.length ? serialPorts[serialPorts.length - 1] : await navigator.serial.requestPort();
			if (!serial.readable)
				await serial.open({ baudRate: 9600 });

			for (let i = 0; i < 10; i++) {
				setTimeout(async () => {
					srm = new TextEncoderStream();
					srm.readable.pipeTo(serial.writable);
					sw = await srm.writable.getWriter();
					await sw.write(`ABC`+ CrLf);
					await sw.write(`ABC`+ CrLf);
					await sw.write(`ABC`+ CrLf);
					await sw.close();
					await sw.releaseLock();
				}, 500 * i)
			}
		*/

		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				baudRate: this.class.defaultBaudRate,
				serialController: navigator.serial
			});
		}

		static get baudRates() {
			let result = this._baudRates;
			if (!result) {
				result = this._baudRates = [];
				[9600, 115200, 4800, 2400].forEach(value => {
					result.push(new CKodVeAdi({ kod: value, aciklama: value.toString() }))
				});
			}

			return result;
		}

		static get tip() { return 'serialPort' }
		static get aciklama() { return 'Seri Port' }
		static get bufferSize() { return 80 }
		static get chunkDelayMS() { return 10 }
		static get defaultBaudRate() { return sky.app.param.dokumDeviceSP_baudRate }

		async start(controller) {
			await super.start(controller);
			
			const serialController = this.serialController;
			const serialPorts = await serialController.getPorts();
			let serialPort = serialPorts.length
								? serialPorts[serialPorts.length - 1]
								: await serialController.requestPort();
			if (!serialPort.readable)
				await serialPort.open({ baudRate: this.baudRate });

			this.serialPort = serialPort;
			// this.sw = await serialPort.writable.getWriter();

			const srmSerial = this.srmSerial = serialPort.writable;
			const srm = new TextEncoderStream();
			srm.readable.pipeTo(srmSerial);
			this.sw = await srm.writable.getWriter();
		}

		async close() {
			await super.close();
			
			const {sw, srmSerial} = this;
			if (sw) {
				try { await sw.close() } catch (ex) { /*console.error(ex)*/ }
				try { await sw.releaseLock() } catch (ex) { /*console.error(ex)*/ }
				this.sw = null;
			}
			if (srmSerial) {
				try { await srmSerial.close() } catch (ex) { /*console.error(ex)*/ }
				try { await srmSerial.releaseLock() } catch (ex) { /*console.error(ex)*/ }
				this.srmSerial = null;
			}

			/*const serialPort = this.serialPort;
			if (serialPort && serialPort.writable) {
				this.abortPromise = new Promise(resolve => {
					setTimeout(async () => {
						try { await serialPort.close() }
						catch (ex) { console.error(ex) }
						this.serialPort = null;
					}, 2000)
				});
			}*/
		}

		async onChunkReceived(e) {
			await super.onChunkReceived(e);
			
			const sw = this.sw;
			if (!sw)
				return;
			
			let value = (e.value || '').toString();
			value = this.convertString({ value: value });
			await sw.write(value);
		}
	}

	window.CETDokumDevice_HrefBased = class extends window.CETDokumDevice {
		constructor(e) {
			e = e || {};
			super(e);
		}

		static get bufferSize() { return 1000 }
		static get chunkDelayMS() { return 0 }

		async start(controller) {
			this.buffer = '';
			await super.start(controller);
		}

		async close() {
			let buffer = this.buffer;
			if (buffer) {
				const encodedBuffer = encodeURI(buffer);
				let result = await this.beforeClose({ buffer: buffer, encodedBuffer: encodedBuffer });
				if (result)
					buffer = this.buffer = ``;
				else if (result === false)
					return;
			}

			await super.close();
		}

		async beforeClose(e) {
			// const encodedBuffer = e.encodedBuffer;
			return true;
		}

		async onChunkReceived(e) {
			await super.onChunkReceived(e);
			
			const value = (e.value || '').toString();
			for (let i in value) {
				let ch = value[i];
				if (ch != '\r')
					this.buffer += ch;
			}
		}
	};

	window.CETDokumDevice_QuickPrint = class extends window.CETDokumDevice_HrefBased {
		constructor(e) {
			e = e || {};
			super(e);
		}

		static get tip() { return 'quickPrint' }
		static get aciklama() { return 'Quick Print' }

		async beforeClose(e) {
			let result = await super.beforeClose(e);
			if (!result)
				return result;

			const encodedBuffer = e.encodedBuffer;
			location.href = `intent://${encodedBuffer}#Intent;scheme=quickprinter;package=pe.diegoveloper.printerserverapp;end;`;
			// location.href = `intent://${encodedBuffer}#Intent;scheme=quickprinter;package=mate.bluetoothprint;end;`;

			return true;
		}
	};
})()
