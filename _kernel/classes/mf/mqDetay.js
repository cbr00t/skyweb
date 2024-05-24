(function() {
	window.MQDetay = class extends window.CObject {
		constructor(e) {
			e = e || {};
			super(e);
			
			$.extend(this, {
				id: e.id,
				seq: e.seq,
				altDetaylar: e.altDetaylar || {}
			});
		}

		shallowCopy(e) {
			const inst = super.shallowCopy(e);
			if (this.barkodParser)
				inst.barkodParser = this.barkodParser;

			return inst;
		}

		deepCopy(e) {
			const inst = super.deepCopy(e);
			if (this.barkodParser)
				inst.barkodParser = this.barkodParser;

			return inst;
		}

		static get deepCopyAlinmayacaklar() {
			return $.merge(super.deepCopyAlinmayacaklar || [], [
				'barkodParser'
			])
		}
		static get tableAlias() { return 'har' }
		static get fisIDSaha() { return 'fissayac' }
		static get idSaha() { return 'rowid' }
		static get detaymi() { return true }
		static get ticariSahaKeys() {
			return [`fiyat`, `kdvOrani`, `netFiyat`, `bedel`, `netBedel`, `brutBedel`]
		}
		get detaymi() { return this.class.detaymi }
		
		static async fromBarkodBilgi(e) {
			const barkodBilgi = e.barkodBilgi || e;
			if (!barkodBilgi)
				return null;
			
			let det = new this($.extend({}, barkodBilgi, { fis: e.fis }));
			det.barkodParser = barkodBilgi;
			
			return det;
		}

		static async fromSablonBilgi(e) {
			const rec = e.rec || e;
			if (!rec)
				return null;
			
			let det = new this();
			await det.setValuesFromSablon(e);
			
			return det;
		}

		hostVars(e) {
			return { seq: this.seq }
		}

		async setValues(e) {
			e = e || {};
			const {rec, fis} = e;
			let {seq} = rec;
			if (seq)
				this.seq = seq;
		}

		setValuesFromSablon(e) {
			e = e || {};
			const {rec} = e;
			if (rec.seq)
				this.seq = rec.seq;
		}

		async detayEkIslemler_ekle(e) {
			return await this.detayEkIslemler(e);
		}
		
		detayEkIslemler(e) {
		}

		cacheReset(e) {
		}

		siparisKarsilamaYapiReset(e) {
		}

		ekOzelliklerDo(e) {
		}

		static async getDokumBaslikDegeri(e) {
			let dict = this.dokumBaslikDegeriDict;
			if (!dict)
				dict = this.dokumBaslikDegeriDict = await this.getDokumAttr2Baslik(e);
			dict = dict || {};

			const {attr} = e;
			let value = await dict[attr];
			if (value == null)
				value = await this[attr];
			if ($.isFunction(value))
				value = await value.call(this, e);
			
			return value;
		}

		static getDokumAttr2Baslik(e) {
			return {}
		}

		async dokumSahaDegeri(e) {
			let dict = this.dokumDegeriDict;
			if (!dict)
				dict = this.dokumDegeriDict = await this.getDokumDegeriDict(e);
			dict = dict || {};

			const {attr} = e;
			let value = await dict[attr];
			if (value == null)
				value = await this[attr];
			if ($.isFunction(value))
				value = await value.call(this, e);
			if ($.isEmptyObject(value))
				value = null;
			
			return value;
		}

		getDokumDegeriDict(e) {
			// const {app} = sky;
			return {
				fisSayac: this.id,
				fissayac: this.id,
				ayiracDikCizgi: '|',
				ayiracTire: '-',
				ayiracSlash: '/',
				ayiracVirgul: ',',
				ayiracNoktaliVirgul: ';'
				
				/*fiyat: e => toStringWithFra(this.fiyat, app.fiyatFra),
				brutFiyat: e => toStringWithFra(this.brutFiyat, app.fiyatFra),
				netFiyat: e => toStringWithFra(this.netFiyat, app.fiyatFra),
				alimFiyat: e => toStringWithFra(this.alimFiyat, app.fiyatFra),
				alimNetFiyat: e => toStringWithFra(this.alimNetFiyat, app.fiyatFra)
				bedel: e => bedel(this.bedel),
				brutBedel: e => bedelStr(this.brutBedel),
				netBedel: e => bedelStr(this.netBedel)*/
			}
		}
	}
})()
