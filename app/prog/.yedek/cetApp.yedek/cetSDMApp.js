(function() {
	window.CETSDMApp = class extends window.CETApp {
		constructor(e) {
			super(e);

			const extLogin = this.extensions.login;
			$.extend(extLogin.options, {
				// isLoginRequired: true,
				loginTypes: [
					{ kod: 'login', aciklama: 'VIO Kullanıcısı' },
					{ kod: 'plasiyerLogin', aciklama: '<span style="color: steelblue;">Plasiyer</span>' }
				]
			});
		}

		static get appName() { return 'cetSDMApp' }
		get appText() { return 'Sky SDM' }
		static get wsURLBase_postfix() { return '/depo' }
		// get defaultYerKod() { return null }
		static get appSDMmi() { return true }
		static get rotaKullanilirmi() { return false }

		get fisTipleri() {
			const {param} = this;
			const ekOzellikKullanim = param.ekOzellikKullanim || {};
			let liste = [
				CETFisTipi.fromFisSinif({ fisSinif: CETSayimFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETDepoTransferFis })
			];
			if ((ekOzellikKullanim.raf || {}).kullanilirmi) {
				liste.push(
					CETFisTipi.fromFisSinif({ fisSinif: CETForkliftFis })
				);
			}
			liste.push(...[
				CETFisTipi.fromFisSinif({ fisSinif: CETSubeTransferFis }),
				CETFisTipi.fromFisSinif({ aciklamaPrefix: `Mal Kabul: `, fisSinif: CETAlimFaturaFis }),
				CETFisTipi.fromFisSinif({ aciklamaPrefix: `Mal Kabul: `, fisSinif: CETAlimIrsaliyeFis }),
				CETFisTipi.fromFisSinif({ aciklamaPrefix: `Mal Kabul: `, fisSinif: CETAlimSiparisFis }),
				CETFisTipi.fromFisSinif({ aciklamaPrefix: `Mal Kabul: `, fisSinif: CETAlimIadeFaturaFis }),
				CETFisTipi.fromFisSinif({ aciklamaPrefix: `Mal Kabul: `, fisSinif: CETAlimIadeIrsaliyeFis }),
				CETFisTipi.fromFisSinif({ aciklamaPrefix: `Sevkiyat: `, fisSinif: CETSatisFaturaFis }),
				CETFisTipi.fromFisSinif({ aciklamaPrefix: `Sevkiyat: `, fisSinif: CETSatisIrsaliyeFis }),
				CETFisTipi.fromFisSinif({ aciklamaPrefix: `Sevkiyat: `, fisSinif: CETSatisSiparisFis }),
				CETFisTipi.fromFisSinif({ aciklamaPrefix: `Sevkiyat: `, fisSinif: CETSatisIadeFaturaFis }),
				CETFisTipi.fromFisSinif({ aciklamaPrefix: `Sevkiyat: `, fisSinif: CETSatisIadeIrsaliyeFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETSubelerArasiTransferSiparisFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETTahsilatFis })
			]);
			liste.push(...(super.fisTipleri || []));

			return liste;
		}

		get raporlar() {
			const raporlar = super.raporlar;
			if (this.siparisKontrolEdilirmi) {
				raporlar.push(...[
					CETRapor.getListeItem({ raporSinif: CETRapor_BekleyenSiparisler }),
					CETRapor.getListeItem({ raporSinif: CETRapor_BekleyenSiparisler_Sevkiyat }),
					CETRapor.getListeItem({ raporSinif: CETRapor_BekleyenSiparisler_MalKabul })
				]);
			}

			return raporlar;
		}

		async merkezdenBilgiYukleSonrasiDevam(e) {
			e = e || {};
			const {param} = this;
			if (param.kmTakibiYapilirmi || param.ilkIrsaliyeRaporuKontrol) {
				param.kmTakibiYapilirmi = param.ilkIrsaliyeDokumuZorunlumu = false;
				param.kaydet();
			}
		}

		async gerekirseKMGirisYap(e) {
		}

		async ilkIrsaliyeRaporuKontrol(e) {
		}
	}
})()
