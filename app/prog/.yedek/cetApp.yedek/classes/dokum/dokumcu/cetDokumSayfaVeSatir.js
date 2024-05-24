(function() {
	window.CETDokumSayfa = class extends window.CObject {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				sinir: e.sinir == null ? null : asInteger(e.sinir),
				maxX: e.maxX == null ? null : asInteger(e.maxX),
				satirlar: []
			});
		}

		yazdir(e) {
			const {pos, value} = e;
			if (!value)
				return;

			const _value = ($.isArray(value) && !$.isEmptyObject(value) ? value[0] : value).toUpperCase();
			let isPOSCommand = _value.includes('<IMAGE') || _value.includes('<LOGO');
			let {maxX} = this;
			let {x} = pos;
			let {genislik} = e;
			if (isPOSCommand) {
				// maxX = Math.max(maxX, x + genislik);
				if (!genislik)
					genislik = value.length;
			}
			else {
				if (maxX && x + genislik > maxX)
					genislik = Math.min(genislik, Math.max(maxX - x, 0));							// ??
			}

			let inPOSChar = false;
			for (let i = 0; i < value.length; i++) {
				const ch = value[i];
				if (ch == '>') {
					inPOSChar = false;
					genislik++;
				}
				else {
					if (ch == '<')
						inPOSChar = isPOSCommand = true;
					if (inPOSChar)
						genislik++;
				}
			}
			e.genislik = genislik;
			
			const {y} = pos;																	// one-based
			let yBitis = y;
			if ($.isArray(value))
				yBitis += value.length - 1;
			
			const {satirlar} = this;
			while (satirlar.length < y)
				satirlar.push(new CETDokumSatir());
			
			let textListe = $.isArray(value) ? value : [value];
			const sinir = this.sinir;
			for (let ind in textListe) {
				ind = asInteger(ind);
				const text = textListe[ind];
				const satirNo0 = ind + y - 1;													// zero-based
				if (satirNo0 < 0 || (sinir && satirNo0 + 1 > sinir))
					break;
				
				while (satirlar.length <= satirNo0)
					satirlar.push(new CETDokumSatir());
				
				let satir = satirlar[satirNo0];
				satir.yazdir({ x: x, genislik: genislik, value: text, maxX: maxX, isPOSCommand: isPOSCommand });
			}
		}

		async writeToDevice(e) {
			const isDebug = e.debug;
			const srm = e.stream;
			const {satirlar} = this;
			for (let i in satirlar) {
				i = parseInt(i);
				if (isDebug)
					srm.write(`|${(i + 1).toString().padStart(2, '0')}| `);
				const satir = satirlar[i];
				if (satir)
					await satir.writeToDevice(e);
				else
					srm.write(` ${CrLf}`);
			}

			const {sinir} = this;
			const fark = Math.max((sinir || 0) - satirlar.length, 0);
			if (fark) {
				for (let i = satirlar.length - 1; i < satirlar.length + fark; i++) {
					if (isDebug)
						srm.write(`|${(i + 1).toString().padStart(2, '0')}| `);
					srm.write(` ${CrLf}`);
				}
			}
		}
	};

	window.CETDokumSatir = class extends window.CObject {
		constructor(e) {
			e = e || {};
			super(e);

			this.chars = new Array();
		}

		yazdir(e) {
			const {x, value, isPOSCommand} = e;
			if (!value)
				return;
			
			const {chars} = this;
			let genislik = e.genislik || 0;
			let {maxX} = e;
			let size = Math.min(genislik, value.length);
			
			let end = x + genislik;			// x, end => one-based
			if (!isPOSCommand && maxX && end > maxX) {
				let fark = end - maxX - 1;
				genislik -= fark;
				end = x + genislik;			// x, end => one-based
			}
			
			if (chars.length < end) {
				let fark = end - chars.length - 1;
				chars.push(...new Array(fark).fill(' '));
			}
			
			for (let i = 0; i < size; i++)
				chars[x - 1 + i] = value[i];
		}

		async writeToDevice(e) {
			const srm = e.stream;
			let {chars} = this;
			if ($.isEmptyObject(chars)) {
				srm.write(` ${CrLf}`);
				return;
			}

			const {dokumDevice} = e;
			const {harfDonusumDict} = dokumDevice || CETDokumDevice;
			if (harfDonusumDict) {
				if ($.isFunction(harfDonusumDict.encodeChars)) {
					chars = harfDonusumDict.encodeChars({ value: chars })
				}
				else {
					let donusumBlock = $.isFunction(harfDonusumDict.encodeSingleChar)
							? ch => harfDonusumDict.encodeSingleChar({ value: ch })
							: ch => harfDonusumDict[ch] || ch;
					for (let i in chars) {
						const ch = chars[i];
						if (ch && ch != ' ')
							chars[i] = donusumBlock(ch);
					}
				}
			}
			
			const text = `${chars.join('') || ' '}`.trimEnd() + CrLf;
			await srm.write(text);
		}
	};
})()
