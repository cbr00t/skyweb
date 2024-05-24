(function() {
	window.CETBarkodDevice = class extends window.CObject {
		static State = {
			READY: '',
			RUNNING: 'running',
			PAUSED: 'paused'
		};

		constructor(e) {
			e = e || {};
			super(e);

			const app = sky.app;
			$.extend(this, {
				debug: e.debug == null ? app.class.isDebug : asBool(e.debug),
				content: e.content || (app.activePart || app).content,
				layout: e.layout, readCallback: e.readCallback,
				width: e.width || 180, height: e.height || 120,
				singleRead: e.singleRead == null ? false : asBool(e.singleRead),
				initFlag: false, state: this.class.State.READY,
				lastBarcodeData: null, lastBarcodeValue: null
			});
		}

		static get tip() { return null }
		static get aciklama() { return null }
		static get tip2Device() {
			let result = this._tip2Device;
			if (!result) {
				result = this._tip2Device = {};
				[
					CETBarkodDevice_Camera_QRCode
				].forEach(cls => {
					const tip = cls.tip;
					if (tip)
						result[tip] = cls;
				})
			}

			return result;
		}
		static get tip2DeviceKAListe() {
			let result = this._tip2DeviceKAListe;
			if (!result) {
				result = this._tip2DeviceKAListe = [];
				const hiddenKodSet = {};
				$.each(this.tip2Device, (tip, cls) => {
					if (!hiddenKodSet[tip])
						result.push(new CKodVeAdi({ kod: tip, aciklama: cls.aciklama || tip }));
				})
			}

			return result;
		}

		static get defaultDeviceClass() {
			return this.deviceFor({ tip: sky.app.param.barkodDeviceTip })
		}

		static deviceFor(e) {
			const tip = (typeof e == 'object' ? e.tip : e);
			return this.tip2Device[tip] || ''
		}

		get isReady() { return this.state == this.class.State.READY }
		get isRunning() { return this.state == this.class.State.RUNNING }
		get isPaused() { return this.state == this.class.State.PAUSED }

		async init(e) {
			if (!this.initFlag) {
				await this._init(e);
				this.initFlag = true;
			}
		}

		async destroy(e) {
			if (!this.initFlag)
				return;
			
			await this.stop(e);
			await new Promise(resolve =>
				setTimeout(() => resolve(), 200));
			
			this.initFlag = false;
			await this._destroy(e);
			['layout'].forEach(key => {
				let elm = this[key];
				if (elm && (elm.prop ? elm.length : elm.remove)) {
					elm.remove();
					delete this[key];
				}	
			});
		}

		async start(e) {
			if (!this.initFlag) {
				await this.init(e);
				this.initFlag = true;
			}

			if (this.state != this.class.State.RUNNING) {
				this.singleRead = false;
				let result = await this._start(e);
				return result;
			}
		}

		async stop(e) {
			if (this.state == this.class.State.RUNNING) {
				let result = await this._stop(e);
				return result;
			}
		}

		async pause(e) {
			if (this.state == this.class.State.RUNNING) {
				let result = await this._pause(e);
				return result;
			}
		}

		async read(e) {
			e = e || {};
			if (!this.initFlag) {
				await this.init(e);
				this.initFlag = true;
			}

			if (this.state != this.class.State.RUNNING) {
				let result;
				result = await this._read(e);
				
				await this.onRead({ sureklimi: false, userData: e }, result);
				return result;
			}
		}

		async onRead(e) {
			const {barcodeInfo, result} = e;
			e.sender = this;
			if (result && !result.isError) {
				this.lastBarcodeData = barcodeInfo;
				this.lastBarcodeValue = result;
				
				console.info(this, `... barkod okundu:`, result);
				if (this.debug)
					displayMessage(`barkod okundu: <b>${result.toString()}</b>`);
				
				let promise = this._onRead(e);
				let handler = this.readCallback;
				if ($.isFunction(handler))
					e.handlerResult = await handler.call(this, e);
				
				return await promise;
			}
		}

		async _init(e) {
		}

		async _destroy(e) {
		}

		async _start(e) {
		}

		async _stop(e) {
		}

		async _pause(e) {
		}

		async _read(e) {
		}

		async _onRead(e) {
		}
	};


	window.CETBarkodDevice_Camera_QRCode = class extends window.CETBarkodDevice {
		constructor(e) {
			e = e || {};
			super(e);

			const app = sky.app;
			$.extend(this, {
				onKamerami: (e.onKamerami == null ? false : asBool(e.onKamerami)),
				deviceId: e.deviceId,
				deviceIndex: e.deviceIndex,
				
			});
		}

		static get tip() { return 'camera_qrCode' }
		static get aciklama() { return 'Kamera (QR Code)' }

		async _init(e) {
			e = e || {};
			await super._init(e);

			const layout = this._getLayout(e);
			const video = layout.find(`#video`)[0];
			const canvasElement = layout.find(`#canvas`)[0];
			const canvas = canvasElement.getContext('2d');
			$.extend(this, {
				video: video, canvasElement: canvasElement, canvas: canvas
			});
			
			const videoArgs = $.extend({
				width: { min: 640, max: 1200 },
				frameRate: { max: 2 },
				facingMode: { ideal: (this.onKamerami ? 'user' : 'environment') },
				/*resizeMode: { ideal: 'crop-and-scale' }*/
				torch: true
				/*locator: {
					patchSize: "medium",
					halfSample: true
				},
				numOfWorkers: (navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4)*/
			}, this.videoArgs || {})
			if (this.deviceId) {
				const obj = videoArgs.exact = videoArgs.exact || {};
				e.deviceId = obj.deviceId = this.deviceId;
			}
			if (this.deviceIndex) {
				const devices = await navigator.mediaDevices.enumerateDevices() || [];
				const _device = devices[this.deviceIndex] || devices[0];
				const obj = videoArgs.exact = videoArgs.exact || {};
				e.deviceId = obj.deviceId = _device.deviceId;
			}
			
			navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
			const device = e.device = this.device = await navigator.mediaDevices.getUserMedia({ video: videoArgs });
			const tracks = e.tracks = this.tracks = await device.getVideoTracks();
			if (tracks && tracks.length) {
				const track = e.videoTrack = this.videoTrack = tracks[0];
				const capabilities = track.getCapabilities ? await track.getCapabilities() : null;
				if (capabilities) {
					try {
						if (capabilities.focusMode)
							await track.applyConstraints({ advanced: [{ focusMode: 'auto' }] });
					} catch (ex) { }
					/*try {
						if (capabilities.torch)
							await track.applyConstraints({ advanced: [{ torch: true }] });
					} catch (ex) { }*/
				}
			}

			video.srcObject = device;
			// video.playsInline = video.hidden = true;
		}

		async _destroy(e) {
			await super._destroy(e);
			
			const tracks = this.tracks;
			if (!$.isEmptyObject(tracks)) {
				tracks.forEach(track =>
					track.stop());
			}
			['videoTrack', 'tracks'].forEach(key =>
				delete this[key]);
			
			['video', 'canvasElement', 'canvas'].forEach(key => {
				let elm = this[key];
				if (elm && (elm.prop ? elm.length : elm.remove)) {
					elm.remove();
					delete this[key];
				}	
			});
		}

		async _start(e) {
			await super._start(e);

			const lastState = this.state;
			const state = this.state = this.class.State.RUNNING;
			if (lastState != this.class.State.PAUSED) {
				this.hFrame = requestAnimationFrame(() =>
					this._frameCallback(e));
			}

			return { state: state };
		}

		async _stop(e) {
			await super._stop(e);
			
			cancelAnimationFrame(this.hFrame);
			
			const state = this.state = this.class.State.READY;
			return { state: state };
		}

		async _pause(e) {
			await super._pause(e);
			
			const state = this.state = this.class.State.PAUSED;
			return { state: state };
		}

		async _read(e) {
			let result = await super._read(e);
			if (result)
				return result;
			
			this.singleRead = true;
			return new Promise(async resolve => {
				this.singleReadCallback = e => {
					delete this.singleReadCallback;
					resolve(e)
				};
				await this._start(e)
			})
		}

		async _onRead(e) {
			const targetState = this.class.State.READY;
			if (this.singleRead && this.state != targetState) {
				this.state = targetState;
				this.singleRead = false;
			}

			await super._onRead(e);
		}

		async _frameCallback(e) {
			if (!this.initFlag)
				return;
			
			const enumState = this.class.State;
			const {video, canvasElement, canvas} = this;

			let state = this.state;
			let value;
			switch (state) {
				case enumState.RUNNING:
					if (video && canvas) {
						//if (canvasElement.hidden)
						//	canvasElement.hidden = false;
						if (video.hidden)
							video.hidden = false;
						if (video.paused)
							video.play();

						if (video.readyState === video.HAVE_ENOUGH_DATA) {
							video.width = this.width;
							video.height = this.height;
							canvasElement.width = video.videoWidth;
							canvasElement.height = video.videoHeight;
							//canvasElement.width = this.width || video.videoWidth;
							//canvasElement.height = this.height || this.videoHeight;
							try { canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height) }
							catch (ex) { }
							
							/*canvasElement.height = 720;
							canvasElement.width = 1280;
							try {
								canvas.drawImage(
									video,
									canvasElement.width/8, canvasElement.height/8,
									canvasElement.width/2, canvasElement.height/2,
									0, 0,
									canvasElement.width/4, canvasElement.height/4
								)
							}
							catch (ex) { }*/

							const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
							const barcodeInfo = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
							if (barcodeInfo && barcodeInfo.data) {
								const pos = barcodeInfo.location;
								const color = '#FF3B58';
								this._drawLine({ begin: pos.topLeftCorner, end: pos.topRightCorner, color: color });
								this._drawLine({ begin: pos.topRightCorner, end: pos.bottomRightCorner, color: color });
								this._drawLine({ begin: pos.bottomRightCorner, end: pos.bottomLeftCorner, color: color });
								this._drawLine({ begin: pos.bottomLeftCorner, end: pos.topLeftCorner, color: color });

								value = (barcodeInfo.data || '').toString().trim();
								if (value)
									await this.onRead({ sureklimi: true, userData: e, barcodeInfo: barcodeInfo, result: value });
							}
						}
					}
					break;
				case enumState.PAUSED:
					if (video && !video.paused)
						video.pause();
					break;
				default:
					if (video) {
						if (!video.paused)
							video.pause();
						if (!video.hidden)
							video.hidden = true;
						//if (!canvasElement.hidden)
						//	canvasElement.hidden = true;
					}
					break;
			}

			if (video && canvas && (state == enumState.RUNNING || state == enumState.PAUSED)) {
				const proc = e => requestAnimationFrame(() =>
					this._frameCallback(e));
				const _e = { video: video };
				if (value)
					setTimeout(e => proc(e), 1000, _e)
				else
					proc(_e);
			}
		}

		_drawLine(e) {
			const canvas = e.canvas || this.canvas;
			const {begin, end, color} = e;
			canvas.beginPath();
			canvas.moveTo(begin.x, begin.y);
			canvas.lineTo(end.x, end.y);
			canvas.lineWidth = 4;
			canvas.strokeStyle = color;
			canvas.stroke();
		}

		_getLayout(e) {
			let layout = this.layout;
			if (layout && layout.length)
				return layout;
			
			const content = this.content;
			layout = this.layout = $(
				`<div class="barcodeReader ${this.class.tip}">` +
				`	<video id="video" playsInline hidden style="z-index: -2;"></video>` +
				`	<canvas id="canvas" hidden></canvas>` +
				`</div>`
			);
			if (content)
				layout.appendTo(content);
			
			return layout;
		}


		/*
			const content = sky.app.content;
			const elmId = `barcodePreview`;
			let container = content.find(`#${elmId}`);
			if (!container.length) {
				(container = $(`<div id="${elmId}" style="width: 100%" />`)).appendTo(content);
				$(`<video id="video"></video>`).appendTo(container);
				$(`<canvas id="canvas" hidden></canvas>`).appendTo(container);
			}
			const video = container.find(`#video`)[0];
			const canvasElement = container.find(`#canvas`)[0];
			const canvas = canvasElement.getContext('2d');

			const srm = await navigator.mediaDevices.getUserMedia({
				video: {
					// exact: { id: (await navigator.mediaDevices.enumerateDevices())[2].id },
					// facingMode: 'user'
					facingMode: 'environment'
				}
			});
			video.srcObject = srm;
			video.setAttribute('playsinline', true);

			const drawLine = (begin, end, color) => {
			  canvas.beginPath();
			  canvas.moveTo(begin.x, begin.y);
			  canvas.lineTo(end.x, end.y);
			  canvas.lineWidth = 4;
			  canvas.strokeStyle = color;
			  canvas.stroke();
			};
			const animate = video => {
				let barcode;
				if (this.barcodeCallbackState == 'pause') {
					if (!video.paused)
						video.pause();
				}
				else {
					if (video.paused)
						video.play();

					if (video.readyState === video.HAVE_ENOUGH_DATA) {
						canvasElement.height = video.videoHeight;
						canvasElement.width = video.videoWidth;
						canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

						const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
						barcode = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
						if (barcode && barcode.data) {
							drawLine(barcode.location.topLeftCorner, barcode.location.topRightCorner, "#FF3B58");
							drawLine(barcode.location.topRightCorner, barcode.location.bottomRightCorner, "#FF3B58");
							drawLine(barcode.location.bottomRightCorner, barcode.location.bottomLeftCorner, "#FF3B58");
							drawLine(barcode.location.bottomLeftCorner, barcode.location.topLeftCorner, "#FF3B58");	

							console.info(`barcode read:`, barcode);
							displayMessage(`barkod okundu: <b>${(barcode.data || '').toString()}</b>`);
						}
					}
				}
				if (this.barcodeCallbackState == 'abort') {
					delete this.hBarcodeCallback;
					video.pause();

				}
				else {
					setTimeout(
						e => requestAnimationFrame(() => animate(e.video)),
						barcode ? 1000 : 0,
						{ video: video });
				}
			};
			this.hBarcodeCallback = requestAnimationFrame(() =>
				animate(video));
			this.barcodeCallbackState = null;
		*/
	};
})();
