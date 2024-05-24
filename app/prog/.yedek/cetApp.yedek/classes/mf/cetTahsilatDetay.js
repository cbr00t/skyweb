(function() {
	window.CETTahsilatDetay = class extends window.MQDetay {
		constructor(e) {
			e = e || {};
			super(e);
			
			$.extend(this, {
				tahSekliNo: e.tahSekliNo,
				tahSekliAdi: e.tahSekliAdi,
				bedel: e.bedel == null ? 0 : bedel(e.bedel)
			});
		}

		static get table() { return 'data_TahsilatDetay' }

		hostVars(e) {
			let hv = super.hostVars(e);
			$.extend(hv, {
				tahSekliNo: this.tahSekliNo,
				bedel: this.bedel
			});

			return hv;
		}

		setValues(e) {
			e = e || {};
			super.setValues(e);
			
			const rec = e.rec;
			$.extend(this, {
				tahSekliNo: rec.tahSekliNo,
				tahSekliAdi: rec.tahSekliAdi,
				bedel: rec.bedel == null ? 0 : (bedel(rec.bedel) || 0)
			});
		}

		setValuesFromSablon(e) {
			e = e || {};
			super.setValuesFromSablon(e);
			
			const rec = e.rec;
			$.extend(this, {
				tahSekliNo: rec.tahSekliNo == null ? this.tahSekliNo : asInteger(rec.tahSekliNo),
				tahSekliAdi: rec.tahSekliAdi == null ? this.tahSekliAdi : tahSekliAdi,
				bedel: rec.bedel == null ? this.bedel : (bedel(rec.bedel) || 0)
			});
			this.orjFiyat = this.fiyat;

			this.ekOzelliklerYapi.setValues(e);
		}

		detayEkIslemler(e) {
		}

		async getDokumDegeriDict(e) {
			return $.extend(await super.getDokumDegeriDict(e) || {}, {
				// bedel(e) { return this.bedel }
			})
		}
	}
})()
