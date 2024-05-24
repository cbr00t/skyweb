(function() {
	window.SkyCafeParam = class extends window.MQTekil {
		constructor(e) {
			e = e || {};
			super(e);

			const {config} = sky;
			const {app} = sky;
			
			this.class.sabitAttrListe.forEach(key =>
				this[key] = e[key] === undefined ? this[key] : e[key]);
			$.extend(this, {
				version: this.version || this.class.version,
				userSettings: this.userSettings || {},
				autoCompleteData: this.autoCompleteData || {},
				programcimi: this.programcimi == null ? false : this.programcimi,
				tekTikmi: this.tekTikmi == null ? true : this.tekTikmi,
				masaBostaSureDk: this.masaBostaSureDk == null ? 40 : this.masaBostaSureDk,
				syncServerPort: this.syncServerPort || null,
				zBilgi: this.zBilgi || null,
				tahsilSekliTip2Id: this.tahsilSekliTip2Id || {
					nakit: null,
					pos: null,
					yemekCeki: null
				},
				// webDataSourceWSRoot: this.webDataSourceWSRoot || null,
				webDataSource: this.webDataSource || {
					tanimlar: false,
					aktifBilgiler: false
				},
				brm2Fra: $.extend({
					'': 0, AD: 0, ADET: 0,
					PK: 0, PAKET: 0, KL: 0, KOLI: 0, PALET: 0,
					KG: 3, KILO: 3, LT: 3, LITRE: 3, MG: 3, GR: 3, GRAM: 3, TON: 3,
					MT: 5, M: 5
				}, (this.brm2Fra || {})),
				wndId2Info: {}
			});

			this.paramFix();
		}
		

		static get table() { return 'SkyCafeParam' }

		static get sabitAttrListe() {
			return [
				'version', 'userSettings', 'autoCompleteData', 'webDataSourceWSRoot', 'programcimi', 'noFastLogin', /*'yetki',*/ 'raporYokmu',
				'syncServerPort', 'zBilgi', 'tekTikmi', 'iskontoYapabilirmi', 'masaBostaSureDk', 'brm2Fra', 'tahsilSekliTip2Id',
				'sonSyncTS', 'wndId2Bilgi'
			]
		}

		static get version() { return 3 }

		hostVars() {
			this.paramFix();
			
			let hv = super.hostVars() || {};
			this.class.sabitAttrListe.forEach(key =>
				hv[key] = this[key] || '');
			[ 'version', 'fisSayisi '].forEach(key => {
				const value = asInteger(this[key]) || 0;
				hv[key] = value;
			});
			[ 'webDataSource', 'zBilgi' ].forEach(key => {
				const value = this[key] || null;
				hv[key] = value;
			});
			[ 'sonSyncTS' ].forEach(key => {
				const value = this[key];
				hv[key] = value ? dateTimeToString(asDate(value)) : null;
			});
			
			delete hv.yetki;
			/*if (this.yetki !== undefined)
				hv.yetki = this.yetki;*/
			/*[ 'sefmi' ].forEach(key => {
				const value = asBool(this[key]);
				hv[key] = value;
			})*/;
			
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
			[ 'webDataSource', 'webDataSourceWSRoot', 'zBilgi' ].forEach(key => {
				const value = rec[key];
				if (value != undefined)
					this[key] = value ? value : null;
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
			
			delete this.yetki;
			//if (rec.yetki !== undefined)
			//	this.yetki = rec.yetki == null ? null : rec.yetki;
			this.paramFix();
		}

		paramFix() {
			if (typeof this.zBilgi == 'string') {
				try { this.zBilgi = JSON.parse(this.zBilgi) || null }
				catch (ex) { this.zBilgi = null };
			}
			const {zBilgi} = this;
			if (zBilgi) {
				const keys = ['basTS', 'bitTS'];
				for (const i in keys) {
					const key = keys[i];
					let value = zBilgi[key];
					if (value && typeof value == 'string')
						value = zBilgi[key] = asDate(value) || null;
				}
			}

			if (this.yetki == 'sef')
				this.yetki = 'admin';
		}

		reduce() {
			const inst = super.reduce();
			['userSettings', 'autoCompleteData'].forEach(key =>
				delete inst[key]);
			
			/*const mustKod2Bilgi = inst.mustKod2Bilgi || {};
			for (const mustKod in mustKod2Bilgi) {
				const bilgi = mustKod2Bilgi[mustKod];
				delete bilgi.konumBilgi;
			}*/

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
