(function() {
	window.CETPromosyonKapsam = class extends window.CObject {
		constructor(e) {
			e = e || {};
			super(e);

			this.class.sabitAttrListe.forEach(key =>
				this[key] = { basi: null, sonu: null });
		}

		static get sabitAttrListe() {
			if (!this._sabitAttrListe) {
				this._sabitAttrListe = [
					'tarih', 'cari', 'cariTip', 'cariBolge',
					'plasiyer'
				];
			}
			return this._sabitAttrListe;
		}

		static get sabitAttrSet() {
			if (!this._sabitAttrSet)
				this._sabitAttrSet = asSet(this.sabitAttrListe);
			return this._sabitAttrSet;
		}

		uygunmu(e) {
			e = e || {};
			const {sabitAttrListe} = this.class;
			let attrListe = sabitAttrListe;
			
			let convertValue = value => {
				/*return value && value.getDate
							? asReverseDateString(dateToString(value))
							: value;*/
				return value;
			}
			
			let _uygunmu = true;
			for (const i in attrListe) {
				const key = attrListe[i];
				let value = e[key];
				if (value)
					value = value.deger || value.value || value;
				
				value = convertValue(value);
				if (value == null)
					value = '';
				/*if (!value)
					continue;*/

				const bs = this[key];
				if (key == 'tarih') {
					for (const _key in bs) {
						const _value = bs[_key];
						bs[_key] = asDate(value);
					}
				}

				_uygunmu = _uygunmu && !(
					(bs.basi && value < convertValue(bs.basi)) ||
					(bs.sonu && value > convertValue(bs.sonu)) ||
					(bs.deger && convertValue(bs.deger) != value)
				);
				if (!_uygunmu)
					break;
			}
			
			return _uygunmu;
		}
	}
})()
