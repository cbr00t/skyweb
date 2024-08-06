(function() {
	window.CBasiSonu = class extends window.CObject {
		constructor(e) {
			e = e || {}; super(e);
			$.extend(this, { basi: e.basi == null ? e.Basi : e.basi, sonu: e.sonu == null ? e.Sonu : e.sonu })
		}
		static get empty() { return new this({ basi: '', sonu: '' }) } static get zero() { return new this({ basi: 0, sonu: 0 }) }
		get bosmu() { return !(this.basi || this.sonu) } get bosDegilmi() { return !this.bosmu }
		static fromText(e) {
			e = e || {};
			if (typeof e == 'object' && !$.isPlainObject(e)) { return e }
			let value = typeof e == 'object' ? e.value || e : e; if (!value) { return null }
			if (typeof value == 'object') {
				let inst = $.isPlainObject(value) ? new this(value) : value; const converter = e.converter;
				if (converter) { for (const key of ['basi', 'sonu']) { let value = inst[key]; inst[key] = value = converter.call(inst, { value }) } }
				return inst
			}
			let ind = value.indexOf('@'); ind = ind < 0 ? value.indexOf('x') : ind; ind = ind < 0 ? value.indexOf('|') : ind; if (ind < 0) { return null }
			const converter = e.converter || (value => value); return new this({
				basi: converter.call(this, { value: value.substring(0, ind).trim() }),
				sonu: converter.call(this, { value: value.substring(ind + 1).trim() })
			})
		}
		toString(e) { return `${this.basi} -> ${this.sonu}` }
	}
})()
