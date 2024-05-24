(function() {
	window.CETDokumVeri = class extends window.MQDetayli {
		/* new CETDokumVeri({
			matbuuForm: sky.app._matbuuFormYapilari.tip2MatbuuForm.Fatura,
			dokumDegeriDict: {
				fisTipText: 'falanca', fisSeri: 'AAA', fisNo: 12345
			}
		}).yazdir() */

		constructor(e) {
			super(e);

			e = e || {};
			$.extend(this, {
				matbuuForm: e.matbuuForm,
				dokumBaslikDegeriDict: $.extend({}, this.getDokumAttr2Baslik(e), e.dokumBaslikDegeriDict || {}),
				dokumDegeriDict: $.extend({}, this.getDokumDegeriDict(e), e.dokumDegeriDict || {})
			});
		}

		static get dokumcuSinif() { return CETDokumcu_Matbuu }
	};


	window.CETDokumVeriDetay = class extends window.MQDetay {
		/* new CETDokumVeriDetay({
			dokumDegeriDict: {
				seq: 'falanca', fisSeri: 'AAA', fisNo: 12345
			}
		}).yazdir() */

		constructor(e) {
			super(e);

			e = e || {};
			$.extend(this, {
				dokumBaslikDegeriDict: $.extend({}, this.class.getDokumAttr2Baslik(e), e.dokumBaslikDegeriDict || {}),
				dokumDegeriDict: $.extend({}, this.getDokumDegeriDict(e), e.dokumDegeriDict || {})
			});
		}
	}
})()
