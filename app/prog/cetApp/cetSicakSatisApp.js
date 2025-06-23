(function() {
	window.CETSicakSatisApp = class extends window.CETSicakSogukMagazaOrtakApp {
		static get appName() { return 'cetSicakSatisApp' } get appText() { return 'Sky Sıcak Satış' } static get wsURLBase_postfix() { return '/ticari/sicakSatis' }
		static get defaultLoginOzelTip() { return new CKodVeAdi({ kod: 'plasiyer', aciklama: 'Plasiyer' }) }
		static get appSicakmi() { return true } static get kmTakibiDesteklenirmi() { return true }
		get fisTipleri() {
			return [
				CETFisTipi.fromFisSinif({ fisSinif: CETSatisFaturaFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETSatisIrsaliyeFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETSatisSiparisFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETSatisIadeFaturaFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETSatisIadeIrsaliyeFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETAlimIadeFaturaFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETAlimIadeIrsaliyeFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETUgramaFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETPlasiyerErtesiGunSiparisFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETPlasiyerIadeFis }),
				...(super.fisTipleri || [])
			].filter(x => !!x)
		}
	}
})()
