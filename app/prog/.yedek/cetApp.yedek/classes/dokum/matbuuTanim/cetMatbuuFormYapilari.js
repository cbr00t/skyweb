(function() {
	window.CETMatbuuFormYapilari = class extends window.MQTekil {
		static get table() { return `CETMatbuuForm` }

		constructor(e) {
			e = e || {};
			super(e);
			
			this.class.sabitAttrListe.forEach(key =>
				this[key] = e[key] === undefined ? this[key] : e[key]);
			$.extend(this, {
				version: e.version || this.class.version
			});

			let tip2MatbuuForm = {};
			$.each(e.tip2MatbuuForm || {}, (tip, obj) => {
				if (obj && $.isPlainObject(obj)) {
					obj.tip = tip;
					obj = new CETMatbuuForm(obj);
				}
				tip2MatbuuForm[tip] = obj;
			});
			this.tip2MatbuuForm = tip2MatbuuForm;
		}

		static get sabitAttrListe() {
			return [ 'version' ]
		}

		static get version() { return 1 }

		hostVars() {
			let hv = super.hostVars() || {};
			this.class.sabitAttrListe.forEach(key =>
				hv[key] = this[key] || '');
			
			hv.tip2MatbuuForm = this.tip2MatbuuForm;
			
			return hv;
		}
		
		setValues(e) {
			e = e || {};
			super.setValues(e);
			
			let rec = e.rec || {};
			if ($.isEmptyObject(rec))
				return;
			
			this.class.sabitAttrListe.forEach(key => {
				let value = rec[key];
				if (value !== undefined)
					this[key] = value;
			});

			['version'].forEach(key => {
				let value = this[key];
				if (value != null)
					this[key] = asInteger(value);
			});

			let tip2MatbuuForm = this.tip2MatbuuForm = {};
			$.each(rec.tip2MatbuuForm || {}, (tip, obj) =>
				tip2MatbuuForm[tip] = new CETMatbuuForm(obj));
		}
	}
})()
