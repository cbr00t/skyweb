(function() {
	window.CETBarkodParser_Referans = class extends window.CETBarkodParser {
		static get aciklama() { return 'Barkod Referans' }
		static get desteklenenEkOzellikTipSet() {
			let result = this._desteklenenEkOzellikTipSet;
			if (!result) { result = this._desteklenenEkOzellikTipSet = asSet(['model', 'renk', 'desen', 'beden', 'raf', 'lotNo']) }
			return result
		}
		static get uygunEkOzellikTipSet() {
			const {tip2EkOzellik} = sky.app, {desteklenenEkOzellikTipSet} = this, result = {};
			for (const tip of Object.keys(desteklenenEkOzellikTipSet)) { if (tip2EkOzellik[tip]) { result[tip] = true } }
			return result
		}
		async parseDevam(e) {
			e = e || {}; let result = await super.parseDevam(e); if (result) { return result }
		// barkod referans
			const {tip2EkOzellik} = sky.app, {uygunEkOzellikTipSet} = this.class, {dbMgr, barkod} = this;
			const sent = new MQSent({
				from: 'mst_BarkodReferans ref',
				where: [ { degerAta: barkod, saha: 'ref.refKod' } ],
				sahalar: [
					'ref.varsayilanmi', 'ref.refKod barkod', 'ref.stokKod shKod', `ref.paketKod`,
					// 'ref.modelKod', 'ref.renkKod', 'ref.desenKod', 'ref.rafKod', 'ref.lotNo',
					`(case when ref.koliBarkodmu or ref.paketKod <> '' then ref.koliIci else NULL end) paketIcAdet`,
					`(case when ref.koliBarkodmu or ref.paketKod <> '' then ref.koliIci else NULL end) miktar`
					// `((case when ref.koliBarkodmu or ref.paketKod <> '' then ref.koliIci else NULL end) * ${MQSQLOrtak.sqlDegeri(this.carpan)}) miktar`
				]
			});
			for (const tip of Object.keys(uygunEkOzellikTipSet)) { const ekOzellik = tip2EkOzellik[tip] || {}, {idSaha} = ekOzellik; if (idSaha) sent.sahalar.add(`ref.${idSaha} ${idSaha}`) }
			const stm = new MQStm({ sent, orderBy: ['varsayilanmi DESC'] }); let rec = await dbMgr.tekilExecuteSelect(stm);
			if (rec) { $.extend(this, rec); if (await this.shEkBilgileriBelirle(e)) { e.shRec = rec; return true } }
		// stok kodu
			let _e = $.extend({}, e, { shKod: barkod });
			if (await this.shEkBilgileriBelirle(_e)) { e.shRec = _e.shRec; return true }
			return false
		}
	}
})()
