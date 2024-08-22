(function() {
	window.CETMatbuuFormBilgi = class extends window.CObject {
		get surekliFormmu() { return !this.sayfaBoyutlari?.y }
		constructor(e) {
			e = e || {}; super(e); $.extend(this, {
				darDokummu: asBool(e.DarDokummu || e.darDokummu),
				kolonBaslikGosterilirmi: asBool(e.KolonBaslikGosterilirmi || e.kolonBaslikGosterilirmi),
				nakilYapilirmi: asBool(e.NakilYapilirmi || e.nakilYapilirmi),
				dipYazdirilirmi: (e.DipYazdirilirmi || e.dipYazdirilirmi) == null ? true : asBool(e.DipYazdirilirmi || e.dipYazdirilirmi),
				tekDetaySatirSayisi: asInteger(e.TekDetaySatirSayisi || e.tekDetaySatirSayisi) || 1,
				sayfaBoyutlari: CPoint.fromText({ value: (e.SayfaBoyutlari || e.sayfaBoyutlari), converter: e => asInteger(e.value) }) || CPoint.zero,
				otoYBasiSonu: CBasiSonu.fromText({ value: (e.OtoYBasiSonu || e.otoYBasiSonu), converter: e => asInteger(e.value) }) || CBasiSonu.zero,
				bedelSaha: e.bedelSaha || null, bedelEtiketUzunluk: e.bedelEtiketUzunluk || null, bedelVeriUzunluk: e.bedelVeriUzunluk || null
			})
		}
	}
})()
