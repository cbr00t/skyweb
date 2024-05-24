(function() {
	window.SkyCafeBarkodParser_Referans = class extends window.SkyCafeBarkodParser {
		constructor(e) {
			e = e || {};
			super(e);
		}

		static get aciklama() { return 'Barkod Referans' }

		async parseDevam(e) {
			let result = await super.parseDevam(e);
			if (result)
				return result;
	
		// barkod referans
			const {dbMgr, barkod} = this;
			let stm = new MQStm({
				sent: new MQSent({
					from: 'mst_BarkodReferans ref',
					where: [
						{ degerAta: barkod, saha: `ref.refKod` }
					],
					sahalar: [
						'ref.varsayilanmi', 'ref.refKod barkod', 'ref.stokKod', /*, `ref.paketKod`,
						`(case when ref.koliBarkodmu or ref.paketKod <> '' then ref.koliIci else NULL end) paketIcAdet`,
						`(case when ref.koliBarkodmu or ref.paketKod <> '' then ref.koliIci else NULL end) miktar`
						// `((case when ref.koliBarkodmu or ref.paketKod <> '' then ref.koliIci else NULL end) * ${this.carpan}) miktar`*/
					]
				}),
				orderBy: [`ref.stokKod`, `ref.varsayilanmi DESC`]
			});
			let rec = await dbMgr.tekilExecuteSelect({ query: stm });
			if (rec) {
				$.extend(this, rec);
				if (await this.stokEkBilgileriBelirle(e)) {
					//e.stokRec = _e.stokRec;
					return true;
				}
			}

		// stok kodu
			let _e = $.extend({}, e, { stokKod: barkod });
			if (await this.stokEkBilgileriBelirle(_e)) {
				e.stokRec = _e.stokRec;
				return true;
			}

			stm = new MQStm({
				sent: new MQSent({
					from: 'mst_TartiReferans ref',
					where: [
						{ degerAta: barkod, saha: `ref.refKod` }
					],
					sahalar: [
						'ref.refKod barkod', 'ref.stokKod', /*, `ref.paketKod`,
						`(case when ref.koliBarkodmu or ref.paketKod <> '' then ref.koliIci else NULL end) paketIcAdet`,
						`(case when ref.koliBarkodmu or ref.paketKod <> '' then ref.koliIci else NULL end) miktar`
						// `((case when ref.koliBarkodmu or ref.paketKod <> '' then ref.koliIci else NULL end) * ${this.carpan}) miktar`*/
					]
				}),
				orderBy: [`ref.stokKod`]
			});
			rec = await dbMgr.tekilExecuteSelect({ query: stm });
			if (rec) {
				$.extend(this, rec);
				if (await this.stokEkBilgileriBelirle(e)) {
					// e.stokRec = _e.stokRec;
					return true;
				}
			}
			
			return false;
		}
	}
})();
