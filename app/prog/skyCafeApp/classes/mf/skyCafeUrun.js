(function() {
	window.SkyCafeUrun = class extends window.MQCogul {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				id: e.id || e.kod,
				aciklama: e.aciklama,
				// vioID: e.vioID || e.uzakID || null,
				brm: e.brm || 'AD',
				kdvOrani: asInteger(e.kdvOrani) || 0,
				tartilabilirmi: asBool(e.tartilabilirmi),
				ilkTartiKod: e.ilkTartiKod || '',
				degiskenFiyatmi: asBool(e.degiskenFiyatmi),
				ozelFiyat: e.ozelFiyat == null ? e.fiyat : e.ozelFiyat,
			});
			if (this.ozelFiyat != null)
				this.ozelFiyat = asFloat(this.ozelFiyat) || 0;
			if (e.fiyatYapi == null) {
				const fiyatYapi = this.fiyatYapi = {};
				const {tip2FiyatAttr} = this.class;
				for (const tip in tip2FiyatAttr)
					fiyatYapi[tip] = asFloat(e[tip2FiyatAttr[tip]]) || 0;
			}
			else {
				this.fiyatYapi = e.fiyatYapi;
			}
		}
		
		static get table() { return 'mst_Stok' }
		static get idSaha() { return 'kod' }
		static get grupmu() { return false }

		static get tip2FiyatAttr() {
			let result = this._tip2FiyatAttr;
			if (result == null) {
				result = this._tip2FiyatAttr = {};
				result[SkyCafeMasaTip.Adisyon] = 'adisyonFiyat';
				result[SkyCafeMasaTip.SelfServis] = 'selfServisFiyat';
				result[SkyCafeMasaTip.Paket] = 'paketFiyat';
				result[SkyCafeMasaTip.PratikSatis] = 'praFiyat';
			}
			return result;
		}

		fiyatFor(e) {
			const tip = typeof e == 'object' ? e.tip : e;
			let result = this.ozelFiyat;
			if (!result) {
				if (this.degiskenFiyatmi)
					result = 0;
				else {
					const fiyatYapi = this.fiyatYapi || {};
					result = fiyatYapi[tip];
				}
			}

			return result;
		}

		get ozellikler() {
			const {id} = this;
			let result = this._ozellikler;
			if (result === undefined) {
				const {urunID2OzellikIDListe, id2UrunOzellik} = sky.app;
				const ozellikIDListe = urunID2OzellikIDListe[id] || [];
				result = this._ozellikler = ozellikIDListe.map(_id => id2UrunOzellik[_id]);
			}

			return result;
		}

		get urunmu() { return true }

		hostVars() {
			let hv = super.hostVars() || {};
			const fiyatYapi = this.fiyatYapi || {};
			$.extend(hv, {
				kod: this.id.toString(),
				aciklama: this.aciklama || '',
				// vioID: this.vioID || null,
				brm: this.brm || 'AD',
				kdvOrani: asInteger(this.kdvOrani) || 0,
				tartilabilirmi: bool2Int(this.tartilabilirmi),
				ilkTartiKod: this.ilkTartiKod || '',
				degiskenFiyatmi: bool2Int(e.degiskenFiyatmi),
				ozelFiyat: asFloat(this.ozelFiyat) || 0,
				adisyonFiyat: asFloat(fiyatYapi[SkyCafeMasaTip.Adisyon]) || 0,
				selfServisFiyat: asFloat(fiyatYapi[SkyCafeMasaTip.SelfServis]) || 0,
				paketFiyat: asFloat(fiyatYapi[SkyCafeMasaTip.Paket]) || 0,
				praFiyat: asFloat(fiyatYapi[SkyCafeMasaTip.PratikSatis]) || 0
			});
			
			return hv;
		}
		
		async setValues(e) {
			e = e || {};
			await super.setValues(e);
			
			const {rec} = e;
			const fiyatYapi = this.fiyatYapi = {};
			fiyatYapi[SkyCafeMasaTip.Adisyon] = asFloat(rec.adisyonFiyat) || 0;
			fiyatYapi[SkyCafeMasaTip.SelfServis] = asFloat(rec.selfServisFiyat) || 0;
			fiyatYapi[SkyCafeMasaTip.Paket] = asFloat(rec.paketFiyat) || 0;
			fiyatYapi[SkyCafeMasaTip.PratikSatis] = asFloat(rec.praFiyat) || 0;
			
			$.extend(this, {
				id: rec.kod || rec.id,
				aciklama: rec.aciklama,
				// vioID: rec.vioID || null,
				brm: rec.brm || 'AD',
				kdvOrani: asInteger(rec.kdvOrani) || 0,
				tartilabilirmi: asBool(rec.tartilabilirmi),
				ilkTartiKod: rec.ilkTartiKod || '',
				degiskenFiyatmi: asBool(rec.degiskenFiyatmi),
				ozelFiyat: asFloat(rec.ozelFiyat) || 0,
				fiyatYapi: fiyatYapi
			});
		}

		reduce(e) {
			return {
				id: this.id,
				aciklama: this.aciklama,
				brm: this.brm,
				kdvOrani: this.kdvOrani,
				degiskenFiyatmi: this.degiskenFiyatmi,
				fiyat: this.fiyat
			}
		}

		get asKodAdi() {
			let result = this._asKodAdi;
			if (result === undefined) {
				const {id} = this;
				result = this._asKodAdi = id ? new CKodVeAdi({ kod: id, aciklama: this.aciklama }) : null;
			}

			return result;
		}

		parantezliOzet(e) {
			const ka = this.asKodAdi;
			return ka ? ka.parantezliOzet(e) : null;
		}

		cizgiliOzet(e) {
			const ka = this.asKodAdi;
			return ka ? ka.parantezliOzet(e) : null;
		}
	}
})()
