(function() {
	window.SkyCafeLog = class extends window.MQCogul {
		constructor(e) {
			e = e || {};
			super(e);

			const _now = now();
			$.extend(this, {
				id: e.rowid || null,
				kayitZamani: Utils.asReverseDateTimeString(e.kayitZamani || e.kayitzamani || _now),
				gonderildimi: asBool(e.gonderildimi),
				refTable: e.refTable || null,
				refID: e.refID || null,
				refID2: e.refID2 || null,
				islem: e.islem || null,
				altIslem: e.altIslem || null,
				data: e.data
			});
		}
		
		static get table() { return 'data_Log' }
		static get idSaha() { return 'rowid' }
		
		
		async kaydetDevam(e) {
			const result = await super.kaydetDevam(e);
			return result;
		}

		hostVars() {
			const _now = now();
			const dataStr = typeof this.data == 'string' ? this.data : toJSONStr(this.data || null);
			const hv = super.hostVars() || {};
			$.extend(hv, {
				kayitzamani: Utils.asReverseDateTimeString(this.kayitZamani || _now),
				gonderildi: bool2FileStr(this.gonderildimi),
				refTable: this.refTable || '',
				refID: this.refID || '',
				refID2: this.refID2 || '',
				islem: this.islem || '',
				altIslem: this.altIslem || '',
				data: dataStr
			});
			
			return hv;
		}
		
		async setValues(e) {
			e = e || {};
			await super.setValues(e);
			
			const {rec} = e;
			const data = rec.data && typeof rec.data == 'string' ? JSON.parse(rec.data) : (rec.data || null);
			$.extend(this, {
				id: rec.rowid || null,
				kayitZamani: asDate(rec.kayitzamani) || null,
				gonderildimi: asBool(rec.gonderildi),
				refTable: rec.refTable || null,
				refID: rec.refID || null,
				refID2: rec.refID2 || null,
				islem: rec.islem || null,
				altIslem: rec.altIslem || null,
				data: data
			});
		}

		reduce(e) {
			const data = this.data && typeof this.data == 'string' ? JSON.parse(this.data) : (this.data || null);
			return {
				rowid: this.id || null,
				kayitZamani: Utils.asReverseDateTimeString(this.kayitZamani),
				refTable: this.refTable || null,
				refID: this.refID || null,
				refID2: this.refID2 || null,
				islem: this.islem || null,
				altIslem: this.altIslem || null,
				data: this.data
			}
		}
	}
})()
