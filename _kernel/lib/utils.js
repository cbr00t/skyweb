
(function() {
	'use strict'

	// alert('site ortak yapı değişiklik 3');
	
	window.Utils = class extends window.CObject {
		static get redirectWaitTimeSecs() { return this.isInstallMode ? 40 : 1 }
		static get MimeType_SQLite3() { return 'application/vnd.sqlite3' }

		static get isInstallMode() {
			let queryString = location.search;
			if (queryString && queryString[0] == '?')
				queryString = queryString.slice(1);
			
			let qs = queryString.split('&').filter(x => !!x);
			return qs.includes('install');
		}

		static get isVirtualKeyboardSupported() {
			let result = this._isVirtualKeyboardSupported;
			if (result == null)
				result = this._isVirtualKeyboardSupported = !!navigator.virtualKeyboard;
			return result;
		}


		static async registerSW(rootPath) { 
			if ('serviceWorker' in navigator) { 
				try {
					navigator.serviceWorker.register(`${rootPath || './'}sw.php`,
					/*{
						scope: '/'
					}*/);
				}
				catch (e) {
					console.error('ServiceWorker registration failed')
				}
			}
		}

		static bootRedirect(e) {
			e = e || {};
			e.appName = e.appName || (() =>
				location.pathname.split('/').slice(2).filter(x => !!x).join('/')
			)();

			const prefix = e.prefix || '../';
			let postfix = location.search ? `&${location.search.slice(1)}` : '';
			let ekPostfix = e.postfix || '';
			location.href = `${prefix}_kernel/?app=${e.appName}${postfix}&${ekPostfix}`;
			// <meta http-equiv="refresh" content=`3;URL=/../_kernel/?app=${e.appName}${postfix}` />
		}

		static disableHistoryBack() {
			history.pushState({ page: 1 }, '', '#nbb');
			window.onhashchange = evt =>
				location.hash = "nbb";
		}

		static consoleRedirect(e) {
			e = e || {};
			const {block} = e;

			if (block) {
				const selectors = ['info', 'warn', 'error', 'debug']
				for (const selector of selectors) {
					const handler = console[selector];
					console[selector] = (...args) => {
						const {wndDevConsole} = sky.app || {};
						let divResult, divLine, value;
						if (wndDevConsole && wndDevConsole.length) {
							divResult = wndDevConsole.find(`.devConsole.part #result`);
							if (divResult && divResult.length) {
								let color;
								switch (selector) {
									case 'info': color = '#8ce'; break;
									case 'warn': color = 'orangered'; break;
									case 'error': color = '#e33'; break;
									case 'debug': color = '#caf'; break;
								}
								value = '';
								for (let arg of args) {
									let subValue = arg;
									if (subValue === undefined)
										subValue = '<i>undefined</i>';
									else if (subValue === null)
										subValue = '<i>null</i>';
									else if (subValue === false)
										subValue = '<i>false</i>';
									else if (subValue === true)
										subValue = '<i>true</i>';
									else if (typeof subValue == 'object') {
										const MaxLength = 200;
										try {
											subValue = toJSONStr(subValue);
											if (subValue && subValue.length > MaxLength)
												subValue = subValue.substr(0, MaxLength) + ' ...';
										}
										catch (ex) { }
									}
									
									if (typeof subValue != 'string')
										subValue = subValue.toString();
									
									subValue = `<span class="devconsole-sub-item" style="margin-left: 8px;">${subValue}</span>`;
									value += subValue;
								}
								divLine = $(
									`<div class="devconsole-line" style="font-size: 70%; margin-top: 10px; line-height: 18px; padding: 5px 8px; color: #111; background-color: ${color || ''}; opacity: .8;">` +
									`<span class="bold darkgray" style="font-size: 120%; margin-top: -8px; margin-left: 8px;">&gt;&gt;</span>` +
									value +
									`</div>`
								);
							}
						}

						if (block)
							block($.extend({}, e, { selector: selector, wndDevConsole: wndDevConsole, divResult: divResult, value: value, divLine: divLine }));
						
						if (handler)
							return handler(...args);
					};
				}
			}
		}
		

		static arrayRecursiveDo(e) {
			e = e || {};
			const source = $.isFunction(e.source) ? e.source.call(this, e) : e.source;
			if ($.isEmptyObject(source))
				return true;
			
			const action = e.action;
			$.each(source, (ind, item) => {
				const _e = $.extend({}, e, { index: ind, item: item });
				if (action.call(this, _e) === false)
					return false;
				
				const items = $.isFunction(_e.items) ? _e.items.call(this, _e) : _e.items;
				if (!$.isEmptyObject(items))
					this.arrayRecursiveDo($.extend({}, _e, { source: items }));
			});
		}

		static async arrayParcalaAndDo(e) {
			e = e || {};
			let source = e.source;
			let target = $.isArray(e.target) ? e.target : null;
			let parcaSize = e.parcaSize;
			let callback = $.isFunction(e.callback) ? e.callback : null;
			
			let _e = $.extend({}, e);
			if (!parcaSize || $.isEmptyObject(source)) {
				if (target)
					target.push(source);					// add item as array-in-array
				_e.part = target;
				if (callback)
					await callback.call(_e);
				return source;
			}

			let _source = $.makeArray(source);
			while (true) {
				let part = _source.splice(0, parcaSize);
				if (!part.length)
					break;
				
				if (target)
					target.push(source);					// add item as array-in-array
				
				_e.part = part;
				if (callback) {
					let _result = await callback.call(this, _e);
					if (_result === false)
						return _result;
				}
			} 

			return _e;
		}

		static getMenuID2ItemDict(e) {
			e = e || {};
			const source = $.isFunction(e.source) ? e.source.call(this, e) : e.source;
			if ($.isEmptyObject(source))
				return {};
			
			const id2Item = {};
			this.arrayRecursiveDo({
				source: source,
				items: e => (e.item || {}).items,
				action: e => {
					const item = $.isFunction(e.item) ? e.item.call(this, e) : e.item;
					if (item)
						id2Item[item.id] = item;
				}
			});

			return id2Item;
		}

		static ajaxDoWithCache(e) {
			const globalCache = e.globalCache || sky.globalCache;
			const url = e.url;
			if (globalCache) {
				try { globalCache.add(url) }
				finally { lastAjaxObj = globalCache.match(url) }
			}
			else {
				let ajaxIslemi = e.ajaxIslemi;
				lastAjaxObj = ajaxIslemi
									? ($.isFunction(ajaxIslemi) ? ajaxIslemi(e) : ajaxIslemi)
									: $.get({ url: url, dataType: e.dataType || '' });
			}

			return lastAjaxObj;
		}

		static isDate(value) {
			const type = typeof value;
			return type == 'date' || (value && value.__proto__.constructor.name.toLowerCase() == 'date');
		}

		static asSaniyeKisaString(value) {
			if (!value)
				return value;
			value = asFloat(value);
		
			let kalan = value;
			const sa = asInteger(kalan / 3600);
			kalan -= (sa * 3600);
			
			const dk = asInteger(kalan / 60);
			const sn = kalan - (dk * 60);
			
			let result = '';
			if (sa > 0)
				result += `${sa.toLocaleString()}sa`;
			if (dk > 0) {
				if (result)
					result += ' ';
				result += `${dk.toLocaleString()}dk`;
			}
			if (sn > 0) {
				if (result)
					result += ' ';
				result += `${sn.toLocaleString()}sn`;
			}
			
			return result;
		}

		static asReverseDateTimeString(value) {
			if (!value || typeof value == 'string')
				return value;
			
			if (typeof value == 'number')
				value = new Date(value);
			
			if (!value.toJSONString)
				return value.toJSON().slice(0, 19) || null;
			
			return value.toString(`yyyy-MM-ddTHH:mm:ss`);

			/*let converter = value.toJSONString ? 'toJSONString' : value.toJSON ? 'toJSON' : null;
			return converter ? value[converter]().slice(0, 19) : null*/
		}

		static asReverseDateString(value) {
			if (!value || typeof value == 'string')
				return value;
			
			if (typeof value == 'number')
				value = new Date(value);
			
			if (!value.toJSONString)
				return value.toJSON().slice(0, 10) || null;
			
			return value.toString(`yyyy-MM-dd`);
		}

		static asReverseTimeString(value) {
			if (!value || typeof value == 'string')
				return value;
			
			if (typeof value == 'number')
				value = new Date(value);
			
			if (!value.toJSONString)
				return value.toJSON().slice(11, 19) || null;
			
			return value.toString(`HH:mm:ss`);
		}

		static asLocaleDateString(value) {
			if (!value || typeof value != 'string')
				return value
			return value.split('-').reverse().map(x => x.padStart(2, '0')).join('.')
		}

		static timeFormatString(value, noSecsFlag) {
			if (!value)
				return value;
			
			value = ((
				value
					.replaceAll('.', ':')
					.replaceAll('-', ':')
					.split(' ').pop()
			) || '').trim();
			const hasSeparator = value.includes(':');
			if (hasSeparator) {
				const parts = value.split(':');
				if (parts.length == 1)
					value = noSecsFlag ? `${parts[0].padStart(2, '0')}:00` : `${parts[0].padStart(2, '0')}:00:00`;
				else if (parts.length == 2)
					value = noSecsFlag ? `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}` : `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
				else if (parts.length == 3)
					value = noSecsFlag ? `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}` : `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
			}
			else {
				let _value = value.toLowerCase();
				if (_value == 'b' || _value == 's')
					_value = value = timeToString(now());
				
				if (value.length == 1)
					value = noSecsFlag ? `0${value}:00` : `0${value}:00:00`;
				else if (value.length == 2)
					value = noSecsFlag ? `${value}:00` : `${value}:00:00`;
				else if (value.length == 4)
					value = noSecsFlag ? `${value.substr(0, 2)}:${value.substr(2, 2)}` : `${value.substr(0, 2)}:${value.substr(2, 2)}:00`;
				else if (value.length == 5)
					value = noSecsFlag ? `${value.substr(0, 2)}:${value.substr(2, 2)}` : `${value.substr(0, 2)}:${value.substr(2, 2)}:0${value.substr(4, 1)}`;
				else if (value.length == 6)
					value = noSecsFlag ? `${value.substr(0, 2)}:${value.substr(2, 2)}` : `${value.substr(0, 2)}:${value.substr(2, 2)}:${value.substr(4, 2)}`;
			}
		
			return value;
		}

		static dictToKAListe(e) {
			e = e || {};
			let dict = e.dict;
			if (!dict)
				return null;
			if ($.isEmptyObject(dict))
				return [];
			if ($.isArray(dict))
				return dict;
			
			let kodGetter = e.kodGetter || (value => value);
			let adiGetter = e.adiGetter || (value => value);

			return Object.entries(dict).map(entry => {
				return new CKodVeAdi({ kod: kodGetter(entry[0]), aciklama: adiGetter(entry[1]) })
			})
		}

		static getExpressions(e) {
			e = e || {};
			let text = (typeof e == 'object' ? e.text : e) || '';
			let expListe = text;
			if (!$.isArray(expListe)) {
				text = text.toString().trim();
				expListe = [];
				
				let matchRegExp = /(?<=\[)[^\]\[\r\n]*(?=\])/g;
				let parts = text.match(matchRegExp);
				if (!$.isEmptyObject(parts)) {
					for (let i in parts) {
						let value = (parts[i] || '').toString().trim();
						if (value)
							expListe.push(value);
					}
				}

				matchRegExp = /(?<=\#)[^\#\#\r\n]*(?=\#)/g;
				parts = text.match(matchRegExp);
				if (!$.isEmptyObject(parts)) {
					for (let i in parts) {
						let value = (parts[i] || '').toString().trim();
						if (value)
							expListe.push(value);
					}
				}
			}

			return expListe;
		}

		static yalnizYazisi(e) {
			const value = e == null || e.value == null ? e : e.value;
			if (typeof value != 'number')
				return value || ``;
			
			const result = this.numberAsLiraVeKurusText(value);
			if (!result)
				return result || ``;
			
			return `YALNIZ ${result}`;
		}

		static numberAsLiraVeKurusText(e) {
			const value = e == null || e.value == null ? e : e.value;
			if (typeof value != 'number')
				return value || ``;
			
			const tl = asInteger(value);
			const kr = asInteger(bedel((value - tl) * 100));

			return (
				`${this.numberAsText(tl)}TL ` +
				(kr ? `${this.numberAsText(kr)}KR` : ``)
			)
		}

		static numberAsText(e) {
			const value = e == null || e.value == null ? e : e.value;
			if (typeof value != 'number')
				return value || ''
			const listeler = {
				birler: ['', 'Bir', 'İki', 'Üç', 'Dört', 'Beş', 'Altı', 'Yedi', 'Sekiz', 'Dokuz'],
				onlar:  ['', 'On', 'Yirmi', 'Otuz', 'Kırk', 'Elli', 'Altmış', 'Yetmiş', 'Seksen', 'Doksan'],
				carpan: ['', 'Bin', 'Milyon', 'Milyar', 'Trilyon', 'Katrilyon', 'Kentrilyon']
			};
			let ucerlemeColl = [];
			let sayi = Math.abs(asInteger(value));
			while (sayi > 0) {
				ucerlemeColl.push(sayi % 1000);
				sayi = parseInt(sayi / 1000)
			}
			let result = [];
			let index = -1;
			for (let i in ucerlemeColl) {
				index++;
				const ucluk = ucerlemeColl[i];
				if (ucluk == 0)
					continue
				let currentText;
				if (ucluk == 1 && index == 1) {
					// '1Bin' olmaz sadece 'Bin' yazılır
					currentText = listeler.carpan[index]
				}
				else {
					let uclukText = ``;
					let kalan = ucluk;
					let yuzler = parseInt(kalan / 100);
					if (yuzler > 0) {
						if (yuzler > 1) {
							// '1Yüz' olmaz sadece 'Yüz' yazılır
							uclukText += listeler.birler[yuzler];
						}
						uclukText += `Yüz`
					}
					let kalanOnlar = kalan = parseInt(kalan % 100);
					uclukText += listeler.onlar[parseInt(kalanOnlar / 10)];
					let kalanBirler = kalan = parseInt(kalan % 10);
					uclukText += listeler.birler[kalanBirler];
					uclukText += listeler.carpan[index];
					uclukText += ` `;
					currentText = uclukText
				}

				if (currentText) {
					result.unshift(currentText);
					currentText = null
				}
			}
			return $.isEmptyObject(result) ? `Sıfır` : result.join(``)
		}

		static makeScrollable(target) {
			if (!target)
				return
			if (target.length)
				target = target[0]
			target.style.cursor = 'grab';
			const e = {
				target: target,
				pos: { top: 0, left: 0, x: 0, y: 0 },
				isScrolled: false
			};
			const mouseDownHandler = event => {
				const {target, pos} = e;
				const {button} = event;
				if (!(button == 0 || button == 2))
					return;
				target.style.cursor = 'grabbing';
				target.style.userSelect = 'none';
				$.extend(pos, {
					left: target.scrollLeft,
					top: target.scrollTop,
					// Get the current mouse position
					x: event.clientX,
					y: event.clientY
				});
				window.addEventListener('mousemove', mouseMoveHandler);
				window.addEventListener('mouseup', mouseUpHandler);
				e.isScrolled = false
			};
			const mouseMoveHandler = event => {
				const {target, pos} = e;
				// How far the mouse has been moved
				const dx = event.clientX - pos.x;
				const dy = event.clientY - pos.y;
				// Scroll the element
				target.scrollTop = pos.top - dy;
				target.scrollLeft = pos.left - dx;
				if (Math.abs(dx) > 30 || Math.abs(dy) > 15)
					e.isScrolled = true
			};
			const mouseUpHandler = event => {
				target.style.cursor = 'grab';
				target.style.removeProperty('user-select');
				window.removeEventListener('mousemove', mouseMoveHandler);
				window.removeEventListener('mouseup', mouseUpHandler);
				if (e.isScrolled) {
					target.classList.add(`scrolled`);
					setTimeout(() => target.classList.remove(`scrolled`), 200)
				}
			};
			// Attach the handler
			target.addEventListener('mousedown', mouseDownHandler)
		}
		static getFuncValue(handlerOrValue, ...args) {
			if (handlerOrValue) {
				if ($.isFunction(handlerOrValue))
					return handlerOrValue.call(this, ...args)
				if (handlerOrValue.run)	
					return handlerOrValue.run(...args)
			}
			return handlerOrValue
		}
		static showKeyboard() {
			if (this.isVirtualKeyboardSupported)
				navigator.virtualKeyboard.show()
		}
		static hideKeyboard() {
			if (this.isVirtualKeyboardSupported)
				navigator.virtualKeyboard.hide()
		}

		static getContrastedColor(bgColor, whiteColor, blackColor) {
		  const whiteContrast = this.getContrast(bgColor, '#ffffff');
		  const blackContrast = this.getContrast(bgColor, '#000000');
		  return whiteContrast > blackContrast
			  ? (whiteColor == undefined ? '#ffffff' : whiteColor)
			  : (blackColor == undefined ? '#000000' : blackColor)
		}
		static getContrast(c1, c2) {
		  const L1 = this.getLuminance(c1);
		  const L2 = this.getLuminance(c2);
		  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
		}
		static getLuminance(hexColor) {
			return (
				0.2126 * this.getsRGB(hexColor.substr(1, 2)) +
				0.7152 * this.getsRGB(hexColor.substr(3, 2)) +
				0.0722 * this.getsRGB(hexColor.substr(-2))
			)
		}
		static getsRGB(c) {
			return this.getRGB(c) / 255 <= 0.03928
				? this.getRGB(c) / 255 / 12.92
				: Math.pow((this.getRGB(c) / 255 + 0.055) / 1.055, 2.4)
		}
		static getRGB(c) {
			return parseInt(c, 16) || c
		}
		static get cookieStorageName() {
			return `${(sky.app || {}).appName || 'SkyWeb'}._cookies`
		}
		static cookie(key, value) {
			const storageName = this.cookieStorageName;
			const {cookies} = this;
			if (key == null)
				return undefined;

			let obj;
			try {
				const str = localStorage[storageName];
				obj = str ? JSON.parse(str) : null;
			}
			catch (ex) {
				delete localStorage[storageName];
				console.warn('localstorage cookie', 'invalid_json_data', ex);
			}
			
			if (value === undefined)
				return obj ? obj[key] : undefined;
			
			obj = obj || {};
			// alert(`cookie yazılacak: [${value}]`);
			try {
				obj[key] = value;
				// alert(`cookie yazıldı: [${value}]`);
			}
			catch (ex) {
				console.error('localstorage cookie', 'write', ex);
				// alert(`cookie yazma hatası: [${ex.toString()}]`);
			}
			localStorage[storageName] = toJSONStr(obj);
			return this
		}
		static resetCookies() {
			const key = this.cookieStorageName;
			return delete localStorage[key]
		}

		static async getFS(temp, e) {
			e = e || {};
			if (temp == null)
				temp = e.temp
			const {storage} = navigator;
			if (!temp)
				temp = !(await storage.persist())
			const fs = await storage.getDirectory({ type: temp ? 'temporary' : 'persistent' });
			return { temp, storage, fs }
		}
		static getTempFS(e) { return this.getFS(true, e) }
		static async getFSDirHandle(path, create, e) {
			e = e || {};
			if (path == null)
				path = e.name ?? e.path
			if (!path)
				return null
			if (create == null)
				create = e.create
			let fs = e.fs ?? (await this.getFS(null, e)).fs;
			if (!fs)
				return fs
			let parts = path.split('/');
			let dir = fs;
			for (let name of parts) {
				name = name?.trimEnd();
				if (!name)
					continue
				dir = await dir.getDirectoryHandle(name, { create: create })
			}
			return dir
		}
		static async getFSFileHandle(name, path, create, e) {
			e = e || {};
			if (name == null)
				name = e.name
			if (path == null)
				path = e.path
			if (create == null)
				create = e.create
			if (!name)
				return null
			let fs = e.fs ?? (await this.getFS(null, e)).fs;
			if (!fs)
				return fs
			let dir = await this.getFSDirHandle(path, create, e);
			return dir ? await dir.getFileHandle(name, { create: create }) : dir
		}
		static async getFSFile(name, path, create, e) {
			e = e || {};
			const fh = await this.getFSFileHandle(name, path, create, e);
			return fh ? await fh.getFile() : fh
		}
		static konumFarki(konum1, konum2) {
			if (!(konum1.latitude && konum1.longitude && konum2.latitude && konum2.longitude)) { return null }
		    const PI = Math.PI, R = 6371000;                                                /* R: Dünya yarıçapı (metre cinsinden) */
		    const deltaLat = (konum2.latitude - konum1.latitude) * PI / 180, deltaLon = (konum2.longitude - konum1.longitude) * PI / 180;
		    const lat1 = konum1.latitude * PI / 180, lat2 = konum2.latitude * PI / 180;
		    const a = (Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)) + (Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2));
		    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)), uzaklikMT = R * c;                    /* İki nokta arasındaki mesafe */
		    /* Doğruluk (accuracy) değerini de hesaba kat */
		    const combinedAccuracy = Math.sqrt(Math.pow(konum1.accuracy || 0, 2) + Math.pow(konum2.accuracy || 0, 2));
		    const uyarlanmisUzaklikMT = Math.max(0, uzaklikMT - combinedAccuracy); return uyarlanmisUzaklikMT
		}

		static delay(waitMS, returnValue) { return new $.Deferred(p => setTimeout(() => p.resolve(returnValue), waitMS)) }
	}
})();
