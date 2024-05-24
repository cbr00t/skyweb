(function() {
	window.CETMatbuuSaha = class extends window.CObject {
		/*
			 {Attr: "promosyonKod", Pos: "1@1", Alignment: "", Genislik: "4"}
		*/

		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				attr: e.Attr == null ? e.attr : e.Attr,
				pos: CPoint.fromText(e.Pos == null ? e.pos : e.Pos),
				genislik: asInteger(e.Genislik == null ? e.genislik : e.Genislik) || 0,
				alignment: e.Alignment == null ? e.alignment : e.Alignment,
				tip: e.Tip == null ? e.tip : e.Tip,
				ozelDonusumKolonBaslik: e.OzelDonusumKolonBaslik == null ? e.ozelDonusumKolonBaslik : e.ozelDonusumKolonBaslik,
				ozelDonusum: e.OzelDonusum == null ? e.ozelDonusum : e.OzelDonusum,
				ekDuzenleyici: e.EkDuzenleyici == null ? e.ekDuzenleyici : e.EkDuzenleyici
			});

			let {ozelDonusum, ozelDonusumKolonBaslik, ekDuzenleyici} = this;
			if (ozelDonusum && !(ozelDonusum.run || $.isFunction(ozelDonusum)))
				ozelDonusum = eval(ozelDonusum);
			else
				this.donusumTipBelirle(e);
			
			if (ozelDonusumKolonBaslik && !(ozelDonusumKolonBaslik.run || $.isFunction(ozelDonusumKolonBaslik)))
				ozelDonusumKolonBaslik = eval(ozelDonusumKolonBaslik);
			if (ekDuzenleyici && !(ekDuzenleyici.run || $.isFunction(ekDuzenleyici)))
				ekDuzenleyici = eval(ekDuzenleyici);
		}

		static get tip2SahaSinif() {
			let result = this._tip2SahaSinif;
			if (!result) {
				result = this._tip2SahaSinif = {
					Tekil: CETMatbuuSaha_Tekil,
					Detay: CETMatbuuSaha_Detay,
					Aciklama: CETMatbuuSaha_Aciklama,
					TekilOzel: CETMatbuuSaha_TekilOzel,
					Diger: CETMatbuuSaha_Diger,
					OtoAciklama: CETMatbuuSaha_OtoAciklama
				}
			}

			return result;
		}

		get yazdirilabilirmi() { return this.pos.legalmi; }
		get otomatikmi() { return false }
		get sagaDayalimi() { return this.alignment == 'r' || this.alignment == 'R' }

		static sahaSinifFor(e) {
			const tip = typeof e == 'object' ? e.tip : e;
			return this.tip2SahaSinif[tip];
		}

		donusumTipBelirle(e) {
			e = e || {};
			const attr = e.attr || this.attr;
			switch (attr) {
				case 'miktar':
				case 'kdvOrani':
				case 'okutmaSayisi':
					this.tip = 'miktar';
					break;
				case 'bedel':
				case 'brutBedel':
				case 'iskBedel':
				case 'netBedel':
				case 'alimNetBedel':
				case 'toplamBedel':
				case 'sonucBedel':
				case 'brut':
				case 'ciro':
				case 'net':
				case 'sonuc':
					this.tip = 'bedel';
					break;
			}
		}

		getConvertedKolonBaslikValue(e) {
			let {value} = e;
			const {ozelDonusumKolonBaslik} = this;
			if (ozelDonusumKolonBaslik) {
				value = $.isFunction(ozelDonusumKolonBaslik)
							? ozelDonusumKolonBaslik.call(this, e)
							: ozelDonusumKolonBaslik.run ? ozelDonusumKolonBaslik.run(e) : value;
			}
			
			const internalConverter = text => {
				text = (text || '').toString().trimEnd();
				if (this.sagaDayalimi)
					text = text.padStart(this.genislik, ' ');
				return text;
			}
			value = e.value =
				$.isArray(value)
					? value.map(text => internalConverter(text))
					: internalConverter(value);

			return value;
		}

		getConvertedValue(e) {
			const {app} = sky;
			const {fiyatFra} = 4;
			let {value} = e;
			switch (this.tip) {
				case 'fiyat':
					value = toStringWithFra(value, fiyatFra);
					break;
				case 'bedel':
					value = bedelStr(value);
					break;
				case 'miktar':
				case 'decimal':
					value = (typeof value == 'number'
						? value.toLocaleString(culture, { minimumIntegerDigits: 1, maximumFractionDigits: fiyatFra, useGrouping: true })
						: value);
					break;
				case 'tarih':
					value = dateToString(asDate(value));
					break;
			}
			
			const {ozelDonusum, ekDuzenleyici} = this;
			if (ozelDonusum) {
				value = $.isFunction(ozelDonusum)
							? ozelDonusum.call(this, e)
							: ozelDonusum.run ? ozelDonusum.run(e) : value;
			}
			
			const internalConverter = text => {
				text = (text || '').toString().trimEnd();
				if (this.sagaDayalimi)
					text = text.padStart(this.genislik, ' ');
				return text;
			}
			value = e.value =
				$.isArray(value)
					? value.map(text => internalConverter(text))
					: internalConverter(value);

			if (ekDuzenleyici) {
				value = $.isFunction(ekDuzenleyici)
							? ekDuzenleyici.call(this, e)
							: ekDuzenleyici.run ? ekDuzenleyici.run(e) : value;
			}

			return value;
		}
	};

	window.CETMatbuuSaha_Tekil = class extends window.CETMatbuuSaha {
		static get tekilmi() { return true }
	};

	window.CETMatbuuSaha_TekilOzel = class extends window.CETMatbuuSaha_Tekil {
	};

	window.CETMatbuuSaha_Detay = class extends window.CETMatbuuSaha {
		static get detaymi() { return true }
		get otomatikmi() { return true }
	};

	window.CETMatbuuSaha_Aciklama = class extends window.CETMatbuuSaha {
		static get aciklamami() { return true }
		get yazdirilabilirmi() { return !!this.pos.x; }
	};

	window.CETMatbuuSaha_Diger = class extends window.CETMatbuuSaha {
		static get digermi() { return true }
		get yazdirilabilirmi() { return !!this.pos.x; }
		get otomatikmi() { return !this.y }
	};

	window.CETMatbuuSaha_OtoAciklama = class extends window.CETMatbuuSaha_Diger {
		static get aciklamami() { return true }

		getConvertedValue(e) {
			return this.attr;
		}
	};
})()
