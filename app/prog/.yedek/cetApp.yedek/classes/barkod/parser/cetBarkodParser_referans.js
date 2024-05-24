(function() {
	window.CETBarkodParser_Referans = class extends window.CETBarkodParser {
		constructor(e) {
			e = e || {};
			super(e);
		}

		static get aciklama() { return 'Barkod Referans' }

		async parseDevam(e) {
			e = e || {};
			let result = await super.parseDevam(e);
			if (result)
				return result;
	
		// barkod referans
			const {dbMgr, barkod} = this;
			let stm = new MQStm({
				sent: new MQSent({
					from: 'mst_BarkodReferans ref',
					where: [
						{ degerAta: barkod, saha: 'ref.refKod' }
					],
					sahalar: [
						'ref.varsayilanmi', 'ref.refKod barkod', 'ref.stokKod shKod',
						'ref.modelKod', 'ref.renkKod', 'ref.desenKod', 'ref.rafKod', 'ref.lotNo', `ref.paketKod`,
						`(case when ref.koliBarkodmu or ref.paketKod <> '' then ref.koliIci else NULL end) paketIcAdet`,
						`(case when ref.koliBarkodmu or ref.paketKod <> '' then ref.koliIci else NULL end) miktar`
						// `((case when ref.koliBarkodmu or ref.paketKod <> '' then ref.koliIci else NULL end) * ${MQSQLOrtak.sqlDegeri(this.carpan)}) miktar`
					]
				}),
				orderBy: ['varsayilanmi DESC']
			});
			
			let rec = await dbMgr.tekilExecuteSelect({ query: stm });
			if (rec) {
				$.extend(this, rec);
				if (await this.shEkBilgileriBelirle(e)) {
					e.shRec = rec;
					return true;
				}
			}/*
			else {
				this.barkod = null;
			}*/

		// stok kodu
			let _e = $.extend({}, e, { shKod: barkod });
			if (await this.shEkBilgileriBelirle(_e)) {
				e.shRec = _e.shRec;
				return true;
			}
			
			return false;
		}
	}
})();
