(function() {
	window.CETDokumSayfa = class extends window.CObject {
		constructor(e) {
			e = e || {}; super(e);
			$.extend(this, { sinir: e.sinir == null ? null : asInteger(e.sinir), maxX: e.maxX == null ? null : asInteger(e.maxX), satirlar: [] })
		}
		yazdir(e) {
			let {pos, value} = e; if (!value) { return }
			let _value = ($.isArray(value) && !$.isEmptyObject(value) ? value[0] : value).toUpperCase();
			let {dokumZPLmi: zplmi} = sky.app, isPOSCommand = this.class.isPOSCommand(_value);
			let {maxX} = this, {x} = pos, {genislik} = e;
			if (isPOSCommand) { if (!genislik) { genislik = value.length } } else { if (maxX && x + genislik > maxX) { genislik = Math.min(genislik, Math.max(maxX - x, 0)) } }
			let inPOSChar = false; for (let i = 0; i < value.length; i++) {
				const ch = value[i];
				if (ch == '>') { inPOSChar = false; genislik++ } else { if (ch == '<') { inPOSChar = isPOSCommand = true } if (inPOSChar) { genislik++ } }
			} e.genislik = genislik;
			let {y} = pos, yBitis = y; if ($.isArray(value)) { yBitis += value.length - 1 }														/* one-based */
			let {satirlar} = this; while (satirlar.length < y) { satirlar.push(new CETDokumSatir()) }
			let textListe = $.isArray(value) ? value : [value], {sinir} = this;
			for (let i = 0; i < textListe.length; i++) {
				let value = textListe[i], satirNo0 = i + y - 1;																					/* zero-based */
				if (satirNo0 < 0 || (sinir && satirNo0 + 1 > sinir)) { break }
				while (satirlar.length <= satirNo0) { satirlar.push(new CETDokumSatir()) }
				let satir = satirlar[satirNo0]; satir.yazdir({ x, y, genislik, value, maxX, isPOSCommand })
			}
		}
		async writeToDevice(e) {
			let {debug: isDebug, stream: srm} = e, {satirlar, sinir} = this, {dokumZPLmi: zplmi} = sky.app;
			let zpl_sayfaMaxY = zplmi ? Math.max(sinir, satirlar.length) - 1 : null;
			if (zplmi) { srm.write(`^XA${CrLf}^A0N`) }
			if (zplmi && zpl_sayfaMaxY) { srm.write(`^LL${(2 + zpl_sayfaMaxY) * 30}${CrLf}`) }
			for (let i = 0; i < satirlar.length; i++) {
				if (isDebug) { srm.write(`|${(i + 1).toString().padStart(2, '0')}| `) }
				const satir = satirlar[i]; if (satir) { await satir.writeToDevice(e) } else if (!zplmi) { srm.write(` ${CrLf}`) }
			}
			let fark = Math.max((sinir || 0) - satirlar.length, 0);
			if (!zplmi && fark) {
				for (let i = satirlar.length - 1; i < satirlar.length + fark; i++) {
					if (isDebug) { srm.write(`|${(i + 1).toString().padStart(2, '0')}| `) }
					srm.write(` ${CrLf}`)
				}
			}
			if (zplmi) { srm.write(`^XZ${CrLf}`) }
		}
		static isPOSCommand(value) { return value[0] == '^' || value.includes('[!') || value.includes('<IMAGE') || value.includes('<LOGO') }
	}
	window.CETDokumSatir = class extends window.CObject {
		constructor(e) { e = e || {}; super(e); this.chars = new Array() }
		yazdir(e) {
			const {x, y, value, isPOSCommand} = e; this.y = y; if (!value) { return }
			let {chars} = this, genislik = e.genislik || 0, {maxX} = e, size = Math.min(genislik, value.length), end = x + genislik;			/* x, end => one-based */
			if (!isPOSCommand && maxX && end > maxX) { let fark = end - maxX - 1; genislik -= fark; end = x + genislik }						/* x, end => one-based */
			if (chars.length < end) { let fark = end - chars.length - 1; chars.push(...new Array(fark).fill(' ')) }
			for (let i = 0; i < size; i++) { chars[x - 1 + i] = value[i] }
		}
		async writeToDevice(e) {
			let {dokumZPLmi: zplmi, zplSatirYukseklik, zplFontSize} = sky.app, {stream: srm} = e, {y, chars} = this;
			if ($.isEmptyObject(chars)) { if (!zplmi) { srm.write(` ${CrLf}`) } return }
			let {dokumDevice} = e, x = 10, {harfDonusumDict} = dokumDevice || CETDokumDevice;
			if (harfDonusumDict) {
				if ($.isFunction(harfDonusumDict.encodeChars)) { chars = harfDonusumDict.encodeChars({ value: chars }) }
				else {
					let donusumBlock = $.isFunction(harfDonusumDict.encodeSingleChar) ? value => harfDonusumDict.encodeSingleChar({ value }) : ch => harfDonusumDict[ch] || ch;
					for (let i = 0; i < chars.length; i++) { const ch = chars[i]; if (ch && ch != ' ') { chars[i] = donusumBlock(ch) } }
				}
			}
			let text = `${(chars.join('') || ' ').trimEnd()}${CrLf}`, isPOSCommand = CETDokumSayfa.isPOSCommand(text);
			if (zplmi) {
				y = 10 + (y * zplSatirYukseklik); if (!isPOSCommand) { text = `^FO${x},${y}^ABN,${zplFontSize},${zplFontSize}^FD${text.trimEnd()}^FS${CrLf}` }
				/* if (!isPOSCommand) { text = `^FO${x},${y}^A@N,1,1,FONT001^FD${text.trimEnd()}^FS${CrLf}` } */
				/*if (!isPOSCommand) { text = text.replaceAll(' ', '.') } */ /* if (!isPOSCommand) { text = text.replaceAll(' ', '\u2003') } */
			}
			await srm.write(text)
		}
	}
})()
