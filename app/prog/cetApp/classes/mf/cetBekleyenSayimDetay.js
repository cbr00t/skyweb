(function() {
	window.CETBekleyenSayimDetay = class extends window.CETStokDetay {
		constructor(e) {
			e = e || {}; super(e);

			$.extend(this, {
				miktar: asFloat(e.miktar) || 0
			});
		}
	};
})()
