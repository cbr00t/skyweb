(function() {
	window.CETPromosyonDetay = class extends window.CETTicariDetay {
		static get promosyonmu() { return true }
		constructor(e) {
			e = e || {}; super(e);
			$.extend(this, { promoKod: e.promoKod || e.promokod, iskOran1: 100, ozelIskontoVarmi: true, netBedel: 0 });
		}
		hostVars(e) { let hv = super.hostVars(e); hv.promokod = this.promoKod || ''; return hv }
		async setValues(e) { e = e || {}; await super.setValues(e); const {rec} = e; this.promoKod = rec.promokod }
		async detayEkIslemler(e) {
			$.extend(this, { iskOran1: 100, ozelIskontoVarmi: true, netBedel: 0 });
			await super.detayEkIslemler(e);
		}
		satisKosulYapilariIcinDuzenle(e) { }
		async getDokumDegeriDict(e) { return $.extend(await super.getDokumDegeriDict(e) || {}, { promosyonKod: this.promoKod, proKod: this.promoKod, promosyonText: 'Pro', proText: 'Pro' }) }
	}
})()
