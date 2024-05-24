(function() {
	window.SosyalDurumEDevlettenYuklePart = class extends window.SosyalDurumXYuklePart {
		constructor(e) {
			e = e || {};
			super(e);
		}

		static get partName() { return 'eDevlettenYukle' }
		get adimText() { return 'e-Devletten Yükleme' }


		preInitLayout(e) {
			e = e || {};
			super.preInitLayout(e);

			// const layout = e.layout || this.layout;
		}

		initActivatePartOrtak(e) {
			e = e || {};
			// delete this.callbackData;

			super.initActivatePartOrtak(e);
		}

		destroyDeactivatePartOrtak(e) {
			e = e || {};
			if (this.onBlurHandler) {
				$(window).off('blur', this.onBlurHandler);
				delete this.onBlurHandler;
			}
			if (this.eDevletClientTimer) {
				clearTimeout(this.eDevletClientTimer);
				delete this.eDevletClientTimer;
			}
			if (this.lastScriptElm) {
				this.lastScriptElm.remove();
				delete this.lastScriptElm;
			}
			delete this.callbackData;
			if (this.wndDownloadMessage) {
				if (this.wndDownloadMessage.jqxWindow)
					this.wndDownloadMessage.jqxWindow('destroy');
					delete this.wndDownloadMessage;
			}
			let callback = this.eDevletClientCallbackFunc;
			if (callback) {
				if ($.isFunction(callback))
					callback(null);
				delete this.eDevletClientCallbackFunc;
				callback = null;
			}

			super.destroyDeactivatePartOrtak(e);
		}

		async baslatIstendi(e) {
			super.baslatIstendi(e);

			this.uiRecoverTimer = setTimeout(() => {
				setButonEnabled(this.btnBaslat, true)
			}, 5000);

			let result;
			setButonEnabled(this.btnBaslat, false);
			try {
				try {
					result = await this.eDevletClientIslemi(e)
				}
				catch (ex) {
					defFailBlock(ex);
					throw ex;
				}
				
				if (!(result && result.done))
					return result;
				if (!result.result)
					return false;
				
				this.callbackData = result.result;
				
				// showProgress(`e-Devlet Sorgulama Sonucu merkeze gönderiliyor...`, ` `, 500);
				((window.savedProcs || {}).showProgress || showProgress)(
					`e-Devlet Sorgulama Sonucu merkeze gönderiliyor...`, this.adimText, 100, false);
				let ajaxResult;
				try {
					ajaxResult = await this.wsEDevletSonucKaydet(e);
					if (ajaxResult)
						result.ajaxResult = ajaxResult;

					await this.veriYuklendi($.extend({}, e, { result: ajaxResult }));
					displayMessage(`e-Devlet Sorgusu tamamlandı ve Merkeze işlendi`, this.adimText);
				}
				catch (ex) {
					// defFailBlock(ex);
					throw ex;
				}
			}
			finally {
				if (this.uiRecoverTimer) {
					clearTimeout(this.uiRecoverTimer);
					delete this.uiRecoverTimer;
				}
				setTimeout(() => {
					((window.savedProcs || {}).hideProgress || hideProgress)();
					hideProgress();
				}, 1000);
				setButonEnabled(this.btnBaslat, true);
			}

			return result;
		}

		eDevletClientIslemi(e) {
			return new Promise(resolve => {
				let {onBlurHandler} = this;
				if (onBlurHandler)
					$(window).off('blur', onBlurHandler);
				onBlurHandler = this.onBlurHandler = async evt => {
					const result = await this.onBlur($.extend({}, e, { event: evt }));
					resolve(result);
				};
				$(window).on('blur', onBlurHandler);

				const linkElm = $(`<link/>`);
				linkElm.on('click', async evt => {
					const result = this.onLinkClicked($.extend({}, e, { event: evt }));
					// resolve(result);
				});
				linkElm.appendTo(`body`);
				linkElm.click();
			})
		}

		onLinkClicked(e) {
			return new Promise(resolve => {
				const evt = e.event;
				evt.preventDefault();
				evt.target.remove();
				if (this.eDevletClientTimer) {
					clearTimeout(this.eDevletClientTimer);
					delete this.eDevletClientTimer;
				}
				this.eDevletClientTimer = setTimeout(async () => {
					const result = await this.eDevletClientInstallProgram(e);
					resolve(result);
				}, 4000);
				
				delete this.callbackData;
				window.location = `skyEDevletClient://`;
			})
		}

		onLink2Clicked(e) {
			return new Promise(async resolve => {
				const evt = e.event;
				evt.preventDefault();
				evt.target.remove();

				window.location = `https://cloud.vioyazilim.com.tr:90/files/vio/Kurulus-Ek/_EDevletGiris.exe`;
				this.wndDownloadMessage = ((window.savedProcs || {}).displayMessage || displayMessage)
					(`Lütfen indirilen yazılımı çalıştırıp sonra e-Devlet Sisteminde oturum açınız`, this.adimText);
				
				// resolve({ isError: false, action: 'installProgram' });

				const result = await this.eDevletClientWaitCallback(e);
				resolve({ done: true, result: result });
			})
		}

		onBlur(e) {
			if (this.onBlurHandler) {
				$(window).off('blur', this.onBlurHandler);
				delete this.onBlurHandler;
			}
			if (this.eDevletClientTimer) {
				clearTimeout(this.eDevletClientTimer);
				delete this.eDevletClientTimer;
			}
			if (this.wndDownloadMessage) {
				if (this.wndDownloadMessage.jqxWindow)
					this.wndDownloadMessage.jqxWindow('destroy');
					delete this.wndDownloadMessage;
			}

			return new Promise(async resolve => {
				((window.savedProcs || {}).showProgress || showProgress)
					(`e-Devlet Sorgulama işlemi yapılıyor...`, this.adimText, 3000, false);
				
				const result = await this.eDevletClientWaitCallback(e);
				resolve({ done: true, result: result });
			})
		}

		eDevletClientInstallProgram(e) {
			delete this.callbackData;
			if (this.lastScriptElm) {
				this.lastScriptElm.remove();
				delete this.lastScriptElm;
			}

			return new Promise(resolve => {
				const linkElm = $(`<link/>`);
				linkElm.on('click', async evt => {
					const result = await this.onLink2Clicked($.extend({}, e, { event: evt }));
					resolve({ done: false, result: result });
				});
				linkElm.appendTo(`body`);
				linkElm.click();
			})
		}

		eDevletClientWaitCallback(e) {
			if (this.lastScriptElm) {
				this.lastScriptElm.remove();
				delete this.lastScriptElm;
			}
			const data = null;
			const scriptElm = this.lastScriptElm = $(
				`<script defer sync src="http://localhost:8111/ws/callback/?callback=sky.app.activePart.eDevletClientCallback&data=${data ? btoa(JSON.stringify(data)) : ''}&"></script>`
			);
			scriptElm.on('error', evt => {
				if (this.lastScriptElm) {
					this.lastScriptElm.remove();
					delete this.lastScriptElm;
				}
				delete this.callbackData;
				setTimeout(() => this.eDevletClientWaitCallback(e), 1000);
			});
			scriptElm.appendTo(`head`);

			return new Promise(resolve =>
				this.eDevletClientCallbackFunc = resolve)
		}

		eDevletClientCallback(e) {
			e = e || {};
			if (this.lastScriptElm) {
				this.lastScriptElm.remove();
				delete this.lastScriptElm;
			}

			const result = e.result == undefined ? e : e.result;
			const callback = this.eDevletClientCallbackFunc;
			if (callback)
				callback(result);
		}

		async wsEDevletSonucKaydet(e) {
			const {callbackData} = this;
			if (!callbackData)
				throw { isError: true, rc: 'noCallbackData', errorText: 'e-Devlet Sorgulama Verisi yok' };
			
			const qsArgs = this.buildAjaxArgs({
				/*hizmetDosyaAdi: fileInfo.name,
				hizmetDosyaExt: fileInfo.extension,
				hizmetDosyaContentType: fileInfo.contentType*/
			});

			lastAjaxObj = $.post({
				cache: false,
				contentType: `text/html`,
				url: `${this.wsURLBase}eDevletSonucKaydet/?${$.param(qsArgs)}`,
				data: btoa(callbackData),
				processData: false
			});
			let result = (await lastAjaxObj) || {};

			return result;
		}
	}
})()
