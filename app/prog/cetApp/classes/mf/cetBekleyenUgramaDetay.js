(function() {
	window.CETBekleyenUgramaDetay = class extends window.CETTicariDetay {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				miktar: asFloat(e.miktar) || 0,
				paketBilgi: e.paketBilgi || '',
				sevkSipHarSayac: e.sevkSipHarSayac || null
			});
		}

		hostVars(e) {
			let hv = super.hostVars(e);
			$.extend(hv, {
				paketBilgi: this.paketBilgi || '',
				sevkSipHarSayac: this.sevkSipHarSayac || null
			})
			return hv;
		}

		async setValues(e) {
			e = e || {};
			await super.setValues(e);
			
			const {rec} = e;
			$.extend(this, {
				paketBilgi: rec.paketBilgi || '',
				sevkSipHarSayac: rec.sevkSipHarSayac || null
			});
		}
	};
})()
