(function() {
	window.CETMatbuuFormBilgi = class extends window.CObject {
		/*
			DarDokummu: ""
			DigerSahalar: {Dip: Array(1), TahsilYazi: Array(1), Miktar: Array(1), Bakiye: Array(1), Yalniz: Array(1), …}
			DipBilgilerGosterilirmi: "*"
			KolonBaslikGosterilirmi: ""
			NakilYapilirmi: "*"
			NormalSahalar: {Tekil: Array(8), Detay: Array(7), TekilOzel: Array(0), Aciklama: Array(0)}
			OtoYBasiSonu: "8@45"
			SayfaBoyutlari: "120@60"
			TekDetaySatirSayisi: "2"
		*/

		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				darDokummu: asBool(e.DarDokummu || e.darDokummu),
				kolonBaslikGosterilirmi: asBool(e.KolonBaslikGosterilirmi || e.kolonBaslikGosterilirmi),
				nakilYapilirmi: asBool(e.NakilYapilirmi || e.nakilYapilirmi),
				dipYazdirilirmi: (e.DipYazdirilirmi || e.dipYazdirilirmi) == null
									? true
									: asBool(e.DipYazdirilirmi || e.dipYazdirilirmi),
				tekDetaySatirSayisi: asInteger(e.TekDetaySatirSayisi || e.tekDetaySatirSayisi) || 1,
				sayfaBoyutlari: CPoint.fromText({
					value: (e.SayfaBoyutlari || e.sayfaBoyutlari),
					converter: e => asInteger(e.value)
				}) || CPoint.zero,
				otoYBasiSonu: CBasiSonu.fromText({
					value: (e.OtoYBasiSonu || e.otoYBasiSonu),
					converter: e => asInteger(e.value)
				}) || CBasiSonu.zero,
				bedelSaha: e.bedelSaha || null,
				bedelEtiketUzunluk: e.bedelEtiketUzunluk || null,
				bedelVeriUzunluk: e.bedelVeriUzunluk || null
			});
		}

		get surekliFormmu() {
			return !(this.sayfaBoyutlari || {}).y;
		}
	}
})()
