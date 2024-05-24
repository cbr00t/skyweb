
(function() {
	window.CPoint = class extends window.CObject {
		constructor(e) {
			e = e || {};
			super(e);
			
			$.each(['x', 'X', 'basi', 'Basi'], (_, key) => {
				let value = e[key];
				if (value != null) {
					this.x = asFloat(value);
					return false;		// break loop
				}
			});
			$.each(['y', 'Y', 'sonu', 'Sonu'], (_, key) => {
				let value = e[key];
				if (value != null) {
					this.y = asFloat(value);
					return false;		// break loop
				}
			});
		}

		static get empty() {
			return new this({ x: 0, y: 0 })
		}

		static get zero() {
			return this.empty;
		}

		static get oneOne() {
			return new this({ x: 1, y: 1 });
		}

		static fromText(e) {
			e = e || {};
			if (typeof e == 'object' && !$.isPlainObject(e))		// CPoint gelmistir
				return e;
			
			let value = typeof e == 'object' ? e.value || e : e;
			if (!value)
				return null;
			
			if (typeof value == 'object') {
				let inst = $.isPlainObject(value) ? new this(value) : value;
				['x', 'y'].forEach(key => {
					let value = inst[key];
					if (typeof value != 'number')
						inst[key] = value = asFloat(value);
				});
				return inst;
			}
			
			let ind = value.indexOf('@');
			ind = ind < 0 ? value.indexOf('x') : ind;
			ind = ind < 0 ? value.indexOf('|') : ind;
			if (ind < 0)
				return null;
			
			return new this({
				x: asFloat(value.substring(0, ind).trim()) || 0,
				y: asFloat(value.substring(ind + 1).trim()) || 0
			});
		}

		get bosmu() { return !(this.x || this.y) }
		get legalmi() { return (this.x && this.y) }

		toString(e) {
			return `${this.x} x ${this.y}`
		}
	}
})();
