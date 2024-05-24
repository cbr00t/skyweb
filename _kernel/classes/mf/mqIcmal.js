(function() {
	window.MQIcmal = class extends window.MQCogul {
		constructor(e) {
			e = e || {};
			super(e);
			
			this.hesaplandimi = false;
			['brut', 'sonuc'].forEach(key =>
				this[key] = asFloat(e[key]) || 0);
		}

		static fromFis(e) {
			e = e || {};
			if (!e.fis)
				return null;
			
			let inst = new this();
			inst.hesapla(e);

			return inst;
		}

		/* get topMatrah() { return 0 } */

		hostVars(e) {
			return $.extend(super.hostVars(e) || {}, {
				brut: bedel(this.brut) || 0,
				net: bedel(this.sonuc) || 0
			});
		}

		setValues(e) {
			let rec = e.rec;
			$.extend(this, {
				brut: bedel(rec.brut) || 0,
				sonuc: bedel(rec.net || rec.sonuc) || 0,
				hesaplandimi: true
			});
		}

		hesapla(e) {
			e = e || {};
			const {fis} = e;
			if (!fis)
				return false;
			
			this.reset();
			
			(fis.detaylar || []).forEach(det => {
				const netBedel = bedel(det.netBedel || det.bedel) || 0;
				this.brut += bedel(netBedel) || 0;
				this.sonuc += bedel(netBedel) || 0;
			});
			['brut', 'sonuc'].forEach(key =>
				this[key] = bedel(this[key]) || 0);
		}

		reset(e) {
			this.brut = this.sonuc = 0;
		}
	}
})()
