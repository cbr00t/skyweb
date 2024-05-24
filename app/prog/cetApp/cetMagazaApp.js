(function() {
	window.CETMagazaApp = class extends window.CETSicakSogukMagazaOrtakApp {
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

		static get appName() { return 'cetMagazaApp' }
		get appText() { return 'Sky Mağaza' }
		static get wsURLBase_postfix() { return '/ticari/magaza' }
		static get appMagazami() { return true }
		static get rotaKullanilirmi() { return false }

		get fisTipleri() {
			const {param} = this;
			const ekOzellikKullanim = param.ekOzellikKullanim || {};
			let liste = [];
			liste.push(...[
				CETFisTipi.fromFisSinif({ fisSinif: CETSatisFaturaFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETSatisIrsaliyeFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETSatisIadeFaturaFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETSatisIadeIrsaliyeFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETSatisSiparisFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETAlimFaturaFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETAlimIrsaliyeFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETAlimSiparisFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETAlimIadeFaturaFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETAlimIadeIrsaliyeFis })
			]);
			liste.push(...[
				CETFisTipi.fromFisSinif({ fisSinif: CETSayimFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETDepoTransferFis })
			]);
			if ((ekOzellikKullanim.raf || {}).kullanilirmi) {
				liste.push(
					CETFisTipi.fromFisSinif({ fisSinif: CETForkliftFis })
				);
			}
			liste.push(...[
				CETFisTipi.fromFisSinif({ fisSinif: CETSubeTransferFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETSubelerArasiTransferSiparisFis })
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

		async gerekirseKMGirisYap(e) {
		}

		async ilkIrsaliyeRaporuKontrol(e) {
		}
	}
})()
