(function() {
	window.CETSicakSatisApp = class extends window.CETSicakSogukMagazaOrtakApp {
		constructor(e) {
			super(e);
		}

		static get appName() { return 'cetSicakSatisApp' }
		get appText() { return 'Sky Sıcak Satış' }
		static get wsURLBase_postfix() { return '/ticari/sicakSatis' }

		static get defaultLoginOzelTip() {
			return new CKodVeAdi({ kod: 'plasiyer', aciklama: 'Plasiyer' })
		}

		// get defaultPlasiyerKod() { return (sky.config.sessionInfo || {}).user }
		static get appSicakmi() { return true }

		get fisTipleri() {
			let liste = $.merge([
				CETFisTipi.fromFisSinif({ fisSinif: CETSatisFaturaFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETSatisIrsaliyeFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETSatisSiparisFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETSatisIadeFaturaFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETSatisIadeIrsaliyeFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETAlimIadeFaturaFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETAlimIadeIrsaliyeFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETUgramaFis })
			], super.fisTipleri || []);
			
			/*if (this.isDevMode) {*/
			liste.push(...[
				CETFisTipi.fromFisSinif({ fisSinif: CETPlasiyerErtesiGunSiparisFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETPlasiyerIadeFis })
			]);
			/*}*/

			return liste;
		}
	}
})()
