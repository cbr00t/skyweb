(function() {
	window.SkyCafeMasa = class extends window.MQCogul {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				id: e.id || e.kod,
				aciklama: e.aciklama,
				vioID: e.vioID || e.uzakID || null,
				anaTip: e.anaTip || e.anaTipKod || '',
				tipKod: e.tipKod || '',
				tipAdi: e.tipAdi == null ? null : e.tipAdi,
				aktifFisID: e.aktifFisID,
				servisDisimi: asBool(e.servisDisimi || e.devreDisimi),
				rezervemi: asBool(e.rezervemi),
				rezerveSayi: asInteger(e.rezerveSayi) || 0,
				rezerveTahminiGelis: e.rezerveTahminiGelis || '',
				rezerveAciklama: e.rezerveAciklama || ''
			});
		}
		
		static get table() { return 'mst_ResMasa' }
		static get idSaha() { return 'kod' }
		
		get aktifFis() {
			const {aktifFisID} = this;
			return aktifFisID ? (sky.app.id2Fis || {})[aktifFisID] : null
		}
		get aktifFisDetaylar() {
			const {aktifFis} = this;
			return aktifFis ? aktifFis.detaylar || [] : null;
		}

		get asKodVeAdi() {
			const {aktifFis} = this;
			let {id} = this;
			if (typeof id != 'string')
				id = null;
			const aciklama = (aktifFis || {}).aciklama || (id ? '' : this.aciklama);
			return new CKodVeAdi({ kod: id, aciklama: aciklama })
		}

		get acikmi() { return !!this.aktifFisID }
		
		get fisSonuc() {
			const {aktifFis} = this;
			return aktifFis ? aktifFis.fisSonuc : null
		}
		get acikSureDk() {
			const {aktifFis} = this;
			return aktifFis ? aktifFis.acikSureDk : null
		}

		hostVars() {
			let hv = super.hostVars() || {};
			$.extend(hv, {
				kod: this.id.toString(),
				aciklama: this.aciklama || '',
				vioID: this.vioID || null,
				anaTip: this.anaTip,
				tipKod: this.tipKod || '',
				aktifFisID: this.aktifFisID || null,
				servisDisimi: asInteger(this.servisDisimi),
				rezervemi: asInteger(this.rezervemi),
				rezerveTahminiGelis: this.rezerveTahminiGelis || '',
				rezerveSayi: asInteger(this.rezerveSayi) || 0,
				rezerveAciklama: this.rezerveAciklama || ''
			});
			
			return hv;
		}
		
		async setValues(e) {
			e = e || {};
			await super.setValues(e);
			
			const {rec} = e;
			$.extend(this, {
				id: rec.kod || rec.id,
				aciklama: rec.aciklama,
				vioID: rec.vioID || null,
				anaTip: rec.anaTip,
				tipKod: rec.tipKod || '',
				tipAdi: rec.tipAdi || '',
				aktifFisID: rec.aktifFisID || null,
				servisDisimi: asBool(rec.servisDisimi),
				rezervemi: asBool(rec.rezervemi),
				rezerveTahminiGelis: rec.rezerveTahminiGelis || '',
				rezerveSayi: asInteger(rec.rezerveSayi) || 0,
				rezerveAciklama: rec.rezerveAciklama || ''
			});
		}

		itemDuzenle(e) {
			const {rec, divItem} = e;
			const {aktifFis, fisSonuc, acikSureDk} = rec;
			const aciklama = (aktifFis ? aktifFis.aciklama : null) || this.aciklama;
			const divHeader = divItem.find(`.header`);
			divHeader.find(`#aciklama`).html(aciklama || '');
			divHeader.find(`#fisSonucText`).html(fisSonuc ? `${bedelStr(fisSonuc || '')} TL` : '');
			divHeader.find(`#sureText`).html(acikSureDk ? `${acikSureDk || ''} dk` : '');

			const {rezervemi, rezerveAciklama, rezerveSayi, rezerveTahminiGelis} = this;
			if (rezervemi) {
				divHeader.find(`#rezerveText`).html(
					`<span class="rezerveAciklama">${rezerveAciklama}</span><br/>(<i><b>${rezerveSayi} kişi, <b>${rezerveTahminiGelis}</b></i>)`
				);
			}

			const {app} = sky;
			if (!app.class.pratikSatismi) {
				const {masaBostaSureDk} = app.param;
				if (masaBostaSureDk && masaBostaSureDk > 0 && acikSureDk > masaBostaSureDk)
					divItem.addClass(`bosta`);
			}
		}

		cssDuzenle(e) {
			const {rec, divItem} = e;
			const {dataset} = divItem[0];
			dataset.anatip = rec.anaTip || (sky.app.class.pratikSatismi ? SkyCafeMasaTip.PratikSatis : SkyCafeMasaTip.Adisyon);
			if (rec.servisDisimi)
				dataset.servisdisi = '';
			if (rec.rezervemi)
				dataset.rezerve = '';
			if (rec.acikmi)
				dataset.acik = '';
		}

		cizgiliOzet(e) {
			return this.asKodVeAdi.cizgiliOzet(e)
		}
		
		parantezliOzet(e) {
			return this.asKodVeAdi.parantezliOzet(e)
		}

		reduce(e) {
			return $.extend({}, super.reduce(e));
		}
	}
})()
