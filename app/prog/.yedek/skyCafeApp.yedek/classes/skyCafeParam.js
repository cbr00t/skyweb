(function() {
	window.SkyCafeParam = class extends window.MQTekil {
		constructor(e) {
			e = e || {};
			super(e);
			
			this.class.sabitAttrListe.forEach(key =>
				this[key] = e[key] === undefined ? this[key] : e[key]);
			$.extend(this, {
				version: this.version || this.class.version,
				userSettings: this.userSettings || {},
				autoCompleteData: this.autoCompleteData || {},
				programcimi: this.programcimi == null ? false : this.programcimi,
				// sefmi: this.sefmi == null ? null : this.sefmi,
				tekTikmi: this.tekTikmi == null ? true : this.tekTikmi,
				masaBostaSureDk: this.masaBostaSureDk == null ? 40 : this.masaBostaSureDk,
				tahsilSekliTip2Id: this.tahsilSekliTip2Id || {
					nakit: null,
					pos: null,
					yemekCeki: null
				}
			});
		}
		

		static get table() { return 'SkyCafeParam' }

		static get sabitAttrListe() {
			return [
				'version', 'userSettings', 'autoCompleteData', 'programcimi', 'sefmi',
				'zBilgi', 'tekTikmi', 'iskontoYapabilirmi', 'masaBostaSureDk', 'tahsilSekliTip2Id', 'sonSyncTS'
			]
		}

		static get version() { return 3 }

		hostVars() {
			let hv = super.hostVars() || {};
			this.class.sabitAttrListe.forEach(key =>
				hv[key] = this[key] || '');
			[ 'version', 'fisSayisi '].forEach(key => {
				const value = asInteger(this[key]) || 0;
				hv[key] = value;
			});
			/*[ 'sefmi' ].forEach(key => {
				const value = asBool(this[key]);
				hv[key] = value;
			})*/;
			[ 'sonSyncTS' ].forEach(key => {
				const value = this[key];
				hv[key] = value ? dateTimeToString(asDate(value)) : null;
			});
			
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

			[ 'version', 'fisSayisi' ].forEach(key => {
				const value = rec[key];
				if (value !== undefined && typeof value != 'number')
					this[key] = asInteger(value) || 0;
			});
			[ 'iskontoYapabilirmi' ].forEach(key => {
				const value = rec[key];
				if (value != undefined)
					this[key] = asBool(value);
			});
			[ 'sonSyncTS' ].forEach(key => {
				const value = rec[key];
				if (value !== undefined)
					this[key] = value ? asDate(value) : null;
			});
		}

		reduce() {
			const inst = super.reduce();
			['userSettings', 'autoCompleteData'].forEach(key =>
				delete inst[key]);
			
			const mustKod2Bilgi = inst.mustKod2Bilgi || {};
			$.each(mustKod2Bilgi, (cariKod, bilgi) =>
				delete bilgi.konumBilgiler);

			return inst;
		}

		asBasicParam() {
			const inst = {};
			[ 'version' ].forEach(key =>
				inst[key] = this[key]);
			
			return inst;
		}
	}
})()
