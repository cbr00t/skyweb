(function() {
	window.CETBekleyenUgramaFis = class extends window.CETSevkiyatFis {
		static get aciklama() {
			const {pifTipi, almSat, iademi} = this;
			return (
				`<span>Bek.Yük.</span>` +
				` <span style="color: ${this.renkFor({ tip: 'pifTipi' })};">${pifTipi == 'F' ? 'Fatura' : pifTipi == 'I' ? 'İrsaliye': pifTipi == 'S' ? 'Sipariş' : ''}</span>`
			)
		}
		static get adimTipi() { return `UG` }
		static get numaratorTip() { return null }
		get matbuuFormTip() {
			const {app} = sky;
			if (app.eIslemKullanilirmi && this.eIslemTip)
				return app.eIslemOzelDokummu ? 'e-Islem-Ozel' : 'e-Islem';
			return null;
		}
		async eIslemTipDegeriFor(e) { return await super.eIslemTipDegeriFor(e) }
		static get almSat() { return 'T' }
		static get detaySinif() { return CETBekleyenUgramaDetay }
		static get fisGirisUISinif() { return CETBekleyenUgramaFisGirisPart }
		static get degistirFisGirisUISinif() { return this.fisGirisUISinif }
		static get altDetayKullanilirmi() { return true }
		static get altDetayGosterilirmi() { return true }
		static get bekleyenXFismi() { return true }
		static get bekleyenUgramaFismi() { return true }
		static get barkodZorunlumu() { return true }
		static get geciciFisKullanilmazmi() { return true }
		static get degisiklikYapilmazmi() { return true }
		static get miktarGirilmezmi() { return true }
		static get hedefMiktarGosterilirmi() { return true }
		static get tarihKontrolYapilirmi() { return false }
		static get fisNoKontrolYapilirmi() { return false }
		static get bedelKullanilirmi() { return false }
		// static get dipIskBedelKullanilirmi() { return false }
		static get rafKullanilirmi() { return true }
		static get promosyonKullanilirmi() { return false }
		static get siparisKontrolEdilirmi() { return false }
		static get siparisMiktarKontrolEdilirmi() { return false }
		static get siparisRefKontrolEdilirmi() { return false }

		static fisSinifDuzenlenmis(e) {
			e = e || {};
			let result = super.fisSinifDuzenlenmis(e);
			if (result != CETBekleyenUgramaFis)
				return result;
			
			const rec = e.rec || e;
			if (rec) {
				const pifTipi = rec.piftipi || rec.pifTipi;
				if (pifTipi) {
					const subClasses = [CETBekleyenUgramaFaturaFis, CETBekleyenUgramaIrsaliyeFis];
					for (const cls of subClasses) {
						if (cls.pifTipi == pifTipi) {
							result = cls;
							break;
						}
					}
				}
			}

			return result;
		}
		
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

			return hv
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
			const mesajlar = [];
			const {detaylar} = this;
			for (let i = 0; i < detaylar.length; i++) {
				const seq = i + 1;
				const det = detaylar[i];
				const {shKod, shAdi, miktar, hMiktar} = det;
				if (miktar && hMiktar && miktar > hMiktar)
					mesajlar.push(`<li><u>${seq}. satırdaki</u> <b>${shKod}-${shAdi} ürüne ait <b>Miktar(${miktar})</b>, <u>Hedef Miktar(${hMiktar})</u>'dan fazladır</li>`);
			}
			if (!$.isEmptyObject(mesajlar)) {
				const mesaj = `<ul>${mesajlar.join('')}</ul><p/>Devam edilsin mi?`;
				const promise = new $.Deferred();
				createJQXWindow(
					mesaj,
					'! Hedef Miktar(lar) Aşıldı !',
					{
						isModal: true, showCollapseButton: false, closeButtonAction: 'destroy',
						width: 'auto', height: 280
					},
					{
						EVET: (dlgUI, btnUI) => {
							dlgUI.jqxWindow('destroy');
							promise.resolve(true);
						},
						HAYIR: (dlgUI, btnUI) => {
							dlgUI.jqxWindow('destroy')
							promise.reject({ isError: true, rc: 'userAbort' });
						}
					}
				);
				await promise;
			}

			return await super.onKontrol(e);
		}

		async yeniTanimOncesiIslemler(e) {
			const {islem} = e;
			throw {
				isError: true, rc: 'accessDenied',
				errorText: (
					`<u>${this.class.aciklama}</u> için <b>${islem.toLocaleUpperCase(culture)}</b> işlemi yapılamaz<p/>` +
					`Sadece <b>Değişiklik</b> yapılabilir`
				)
			}
			
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

	window.CETBekleyenUgramaFaturaFis = class extends window.CETBekleyenUgramaFis {
		static get pifTipi() { return 'F' }
		static get numaratorTip() { return CETSatisFaturaFis.numaratorTip }
		get matbuuFormTip() { return super.matbuuFormTip || 'Fatura' }
	};

	window.CETBekleyenUgramaIrsaliyeFis = class extends window.CETBekleyenUgramaFis {
		static get pifTipi() { return 'I' }
		static get numaratorTip() { return CETSatisIrsaliyeFis.numaratorTip }
		async eIslemTipDegeriFor(e) {
			const {app} = sky;
			return app.eIslemKullanilirmi && app.eIrsaliyeKullanilirmi ? 'IR' : ''
		}
		get matbuuFormTip() {
			const {app} = sky;
			if (app.eIslemKullanilirmi && this.eIslemTip) {
				if (app.eIrsaliyeKullanilirmi) {
					const key = 'e-Irsaliye';
					const tip2MatbuuForm = ((app._matbuuFormYapilari || {}).tip2MatbuuForm || {});
					if (!tip2MatbuuForm || tip2MatbuuForm[key])
						return key
				}
				return (app.eIslemOzelDokummu ? 'e-Islem-Ozel' : 'e-Islem')
			}
			return 'Irsaliye'
		}
	};
})()
