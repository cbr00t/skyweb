(function() {
	window.CETBekleyenSayimFis = class extends window.CETStokFis {
		static get aciklama() { return 'Bek.Sayım' }
		static get adimTipi() { return `BS` }
		static get numaratorTip() { return null }
		static get detaySinif() { return CETBekleyenSayimDetay }
		static get fisGirisUISinif() { return CETBekleyenSayimFisGirisPart }
		static get degistirFisGirisUISinif() { return this.fisGirisUISinif }
		static get fiiliCikismi() { return false }
		static get alimmi() { return true }
		static get altDetayKullanilirmi() { return true }
		static get altDetayGosterilirmi() { return true }
		static get bekleyenXFismi() { return true }
		static get bekleyenSayimFismi() { return true }
		static get barkodZorunlumu() { return true }
		static get geciciFisKullanilmazmi() { return true }
		static get degisiklikYapilmazmi() { return true }
		static get tarihKontrolYapilirmi() { return false }
		static get fisNoKontrolYapilirmi() { return false }
		static get sonStokKontrolEdilirmi() { return false }
		static get sonStokEtkilenirmi() { return false }
		static get rafKullanilirmi() { return true }
		static get siparisKontrolEdilirmi() { return false }
		static get siparisMiktarKontrolEdilirmi() { return false }
		static get siparisRefKontrolEdilirmi() { return false }
		
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				soforAdi: e.soforAdi || '',
				plaka: e.plaka || '',
				ekBilgi: e.ekBilgi || ''
			})
		}

		static varsayilanKeyHostVars(e) {
			e = e || {};
			let hv = super.varsayilanKeyHostVars();
			$.extend(hv, { piftipi: this.pifTipi || '', almsat: this.almSat || '', iade: this.iade || '' });
			
			return hv
		}

		hostVars(e) {
			e = e || {};
			let hv = super.hostVars();
			$.extend(hv, {
				seferAdi: this.seferAdi || '',
				soforAdi: this.soforAdi || '',
				plaka: this.plaka || '',
				ekBilgi: this.ekBilgi || '',
				containerNox: this.containerNox || ''
			});

			return hv;
		}

		async setValues(e) {
			e = e || {};
			await super.setValues(e);

			const {rec} = e;
			$.extend(this, {
				seferAdi: rec.seferAdi || '',
				soforAdi: rec.soforAdi || '',
				plaka: rec.plaka || '',
				ekBilgi: rec.ekBilgi || '',
				containerNox: rec.containerNox || ''
			});
		}

		async onKontrol(e) {
			e = e || {};
			return await super.onKontrol(e);
		}

		async yeniTanimOncesiIslemler(e) {
			const {islem} = e;
			/*throw {
				isError: true, rc: 'accessDenied',
				errorText: (
					`<u>${this.class.aciklama}</u> için <b>${islem.toLocaleUpperCase(culture)}</b> işlemi yapılamaz<p/>` +
					`Sadece <b>Değişiklik</b> yapılabilir`
				)
			}*/
			
			return await super.yeniTanimOncesiIslemler(e);
		}

		async silmeOncesiKontrol(e) {
			const {islem} = e;
			throw {
				isError: true, rc: 'accessDenied',
				errorText: (
					`<u>${this.class.aciklama}</u> için <b>${islem.toLocaleUpperCase(culture)}</b> işlemi yapılamaz<p/>` +
					`Sadece <b>Değişiklik</b> veya <b>İptal</b> yapılabilir`
				)
			}
			
			return await super.silmeOncesiKontrol(e);
		}

		geciciFis_initTimer(e) {
			return super.geciciFis_initTimer(e);
		}

		async initBaslikUI_ara(e) {
			await super.initBaslikUI_ara(e);

			const {parentPart} = e;
			const param = parentPart.param;
			const userSettings = param.userSettings = param.userSettings || {};
			const sonDegerler = userSettings.sonDegerler = userSettings.sonDegerler || {};

			/*const layout = e.layout;
			let savedParentWidth;*/
		}
	};
})()
