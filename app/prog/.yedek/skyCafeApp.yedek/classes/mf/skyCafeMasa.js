(function() {
	window.SkyCafeMasa = class extends window.MQCogul {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				id: e.id || e.kod,
				// gonderildimi: e.gonderildimi == null ? true : e.gonderildimi,
				aciklama: e.aciklama,
				vioID: e.vioID || e.uzakID || null,
				anaTip: e.anaTip || e.anaTipKod || '',
				sira: e.sira || e.seq || 0,
				tipKod: e.tipKod || '',
				tipAdi: e.tipAdi == null ? null : e.tipAdi,
				aktifFisID: e.aktifFisID == null ? null : e.aktifFisID,
				servisDisimi: asBool(e.servisDisimi || e.devreDisimi),
				rezervemi: asBool(e.rezervemi),
				rezerveSayi: asInteger(e.rezerveSayi) || 0,
				rezerveTahminiGelis: e.rezerveTahminiGelis || '',
				rezerveAciklama: e.rezerveAciklama || ''
			});
		}
		
		static get table() { return 'mst_ResMasa' }
		static get idSaha() { return 'kod' }

		static async getFis(e) {
			e = e || {};
			const id = e.id || e.masaID;
			if (!id)
				return null;
			
			const {tx} = e;
			const stm = new MQStm({
				sent: new MQSent({
					from: `${SkyCafeFis.table} fis`,
					fromIliskiler: [
						{ from: `${SkyCafeMasa.table} mas`, iliski: `mas.aktifFisID = fis.id` }
					],
					where: [
						{ degerAta: id, saha: `mas.${SkyCafeMasa.idSaha}` }
					],
					sahalar: [
						`fis.rowid`, `fis.*`
					]
				})
			});
			const rec = await SkyCafeFis.dbMgr.tekilExecuteSelect({ tx: tx, query: stm });
			if (!rec)
				return null;
			
			const fis = new SkyCafeFis();
			if (!await fis.yukle({ tx: tx, rec: rec, headerOnly: e.headerOnly }))
				return null;
			
			return fis;
		}

		static async getFisHeaderOnly(e) {
			return await this.getFis($.extend({}, e, { headerOnly: true }));
		}
		
		async getAktifFis(e) {
			e = e || {};
			return this._aktifFis = await this.class.getFis({ id: this.id, headerOnly: e.headerOnly });
		}

		async getAktifFisHeaderOnly(e) {
			return await this.getAktifFis($.extend({}, e, { headerOnly: true }));
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
		get fisAciklama() {
			const {_aktifFis} = this;
			return _aktifFis ? _aktifFis.aciklama : null
		}
		get fisSonuc() {
			const {_aktifFis} = this;
			return _aktifFis ? _aktifFis.fisSonuc : null
		}
		get acikSureDk() {
			const {_aktifFis} = this;
			return _aktifFis ? _aktifFis.acikSureDk : null
		}
		get yazdirildimi() {
			const {_aktifFis} = this;
			return _aktifFis ? _aktifFis.yazdirildimi : null
		}

		hostVars() {
			let hv = super.hostVars() || {};
			$.extend(hv, {
				kod: this.id.toString(),
				// gonderildimi: asBool(this.gonderildi || this.gonderildimi),
				aciklama: this.aciklama || '',
				vioID: this.vioID || null,
				anaTip: this.anaTip,
				sira: this.sira || 0,
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
				// gonderildimi: asBool(rec.gonderildi || rec.gonderildimi),
				aciklama: rec.aciklama,
				vioID: rec.vioID || null,
				anaTip: rec.anaTip,
				sira: rec.sira || 0,
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
			const {app} = sky;
			const {rec, divItem} = e;
			const {fisAciklama, fisSonuc, acikSureDk, rezervemi,
				   rezerveAciklama, rezerveSayi, rezerveTahminiGelis} = rec;
			const divHeader = divItem.find(`.header`);
			divHeader.find(`#aciklama`).html(fisAciklama || this.aciklama || '');
			divHeader.find(`#fisSonucText`).html(fisSonuc ? `${bedelStr(fisSonuc || '')} TL` : '');
			divHeader.find(`#sureText`).html(acikSureDk && acikSureDk > 1 ? `<span class="gray"><u>Siparişsiz</u>:</span> <span class="bold darkred">${acikSureDk || ''} dk</span>` : '');
			if (rezervemi) {
				divHeader.find(`#rezerveText`).html(
					`<span class="rezerveAciklama">${rezerveAciklama}</span><br/>(<i><b>${rezerveSayi} kişi, <b>${rezerveTahminiGelis}</b></i>)`
				);
			}
		}

		cssDuzenle(e) {
			const {app} = sky;
			const {param} = app;
			const {masaBostaSureDk} = param;
			const {rec, divItem} = e;
			const {acikSureDk} = rec;
			const {dataset} = divItem[0];
			dataset.anatip = rec.anaTip || (sky.app.class.pratikSatismi ? SkyCafeMasaTip.PratikSatis : SkyCafeMasaTip.Adisyon);
			if (rec.servisDisimi)
				dataset.servisdisi = '';
			if (rec.rezervemi)
				dataset.rezerve = '';
			if (rec.acikmi)
				dataset.acik = '';

			if (!app.class.pratikSatismi) {
				if (masaBostaSureDk && masaBostaSureDk > 0 && acikSureDk > masaBostaSureDk)
					dataset.bosta = '';
			}
			if (rec.yazdirildimi)
				dataset.yazdirildi = '';
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
