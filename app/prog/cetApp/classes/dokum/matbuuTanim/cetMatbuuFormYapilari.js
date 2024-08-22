(function() {
	window.CETMatbuuFormYapilari = class extends window.MQTekil {
		static get table() { return `CETMatbuuForm` } static get sabitAttrListe() { return [ 'version' ] } static get version() { return 1 }
		constructor(e) {
			e = e || {}; super(e); const {sabitAttrListe, version} = this.class;
			for (const key of sabitAttrListe) { this[key] = e[key] === undefined ? this[key] : e[key] }
			$.extend(this, { version: e.version || version });
			let tip2MatbuuForm = this.tip2MatbuuForm = {};
			for (let [tip, obj] of Object.entries(e.tip2MatbuuForm || {})) { if (obj && $.isPlainObject(obj)) { obj.tip = tip; obj = new CETMatbuuForm(obj) } tip2MatbuuForm[tip] = obj }
		}
		hostVars() {
			let hv = super.hostVars() || {}; const {sabitAttrListe} = this.class;
			for (const key of sabitAttrListe) { hv[key] = this[key] || '' }
			hv.tip2MatbuuForm = this.tip2MatbuuForm; return hv
		}
		setValues(e) {
			e = e || {}; super.setValues(e); let rec = e.rec || {}; if ($.isEmptyObject(rec)) { return }
			const {sabitAttrListe} = this.class; for (const key of sabitAttrListe) { let value = rec[key]; if (value !== undefined) { this[key] = value } }
			for (const key of ['version']) { let value = this[key]; if (value != null) { this[key] = asInteger(value) } }
			let tip2MatbuuForm = this.tip2MatbuuForm = {}; for (const [tip, obj] of Object.entries(rec.tip2MatbuuForm || {})) { tip2MatbuuForm[tip] = new CETMatbuuForm(obj) }
		}
	}
})()
