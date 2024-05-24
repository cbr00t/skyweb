(function() {
	window.SkyHatIzleme_SureSayiDuzenlePart = class extends window.SkyMESWindowPart {
		static get partName() { return 'sureSayiDuzenle' } get autoHeight_uiSelector() { return null } get autoFocus_uiSelector() { return `.form-parent #sinyalSayisi` }
		get klavyeAcilirmi() { return false } get numKlavyeAcilirmi() { return true }

		constructor(e) {
			e = e || {}; super(e); $.extend(this, { rec: e.rec, bilgiHTML: e.bilgiHTML });
			const {id2Tezgah, tezgahBilgi} = this.app;
			const tezgahId = this.tezgahId = e.tezgahId, tezgahAciklama = id2Tezgah ? (id2Tezgah[tezgahId] || {}).aciklama : (tezgahBilgi ? tezgahBilgi.tezgahAciklama : null);
			this.title = e.title || 'Süre-Sayı Düzenle'; this.title += ` - (<span class="gray">${tezgahId}</span>) ${tezgahAciklama || ''}`;
		}
		async tazeleDevam(e) {
			await super.tazeleDevam(e); const {app, wndContent, bilgiHTML, rec} = this; wndContent.find(`button`).jqxButton({ theme });
			const divHeader = this.divHeader = wndContent.find(`#header`), islemTuslari = this.islemTuslari = divHeader.find(`#islemTuslari`);
			const divBilgiText = this.divBilgiText = divHeader.find(`#bilgiParent #bilgiText`);
			if (bilgiHTML) { divBilgiText.html(bilgiHTML); divBilgiText.parent().removeClass(`jqx-hidden`) }
			else { divBilgiText.parent().addClass(`jqx-hidden`) }

			const formParent = this.formParent = wndContent.find(`.form-parent`); formParent.find(`#sinyalSayisi`).val(asFloat(rec.sinyalsayisi) || 0);
			formParent.find(`#sinyalTekilSure`).val(asFloat(rec.sinyaltekilsure) || 0); formParent.find(`#sinyalToplamSure`).val(asFloat(rec.sinyaltoplamsure) || 0);
			const formInputs = formParent.find(`input[type=text], input[type=textbox], input[type=number] input[type=date]`);
			const focusHandler = evt => evt.currentTarget.select();
			formInputs.on('focus', evt => focusHandler(evt));
			formInputs.on('click', evt => focusHandler(evt));
			formParent.find('input[type=number]').on('change', evt => {
				const target = evt.currentTarget, min = typeof target.min == 'number' ? asFloat(target.min) : null, max = typeof target.max == 'number' ? asFloat(target.max) : null;
				if (min != null && target.value < min) target.value = min
				if (max != null && target.value > max) target.value = max
			});
		}
		wndArgsDuzenle(e) {
			super.wndArgsDuzenle(e); const size = { width: Math.min(650, $(window).width() - 1), height: Math.min(450, $(window).height() - 5) };
			$.extend(e.args, { isModal: false, width: size.width, height: size.height  });
		}
		tamamIstendi_argsDuzenle(e) {
			let result = super.tamamIstendi_argsDuzenle(e); if (result === false || (result && result.isError)) return result
			const {args} = e, {formParent, rec} = this;
			$.extend(args, {
				rec: this,
				sinyalSayisi: asFloat(formParent.find(`#sinyalSayisi`).val()) || 0,
				sinyalTekilSure: asFloat(formParent.find(`#sinyalTekilSure`).val()) || 0,
				sinyalToplamSure: asFloat(formParent.find(`#sinyalToplamSure`).val()) || 0
			});
		}
	}
})()
