(function() {
	window.CETSogukSiparisApp = class extends window.CETSicakSogukMagazaOrtakApp {
		constructor(e) {
			super(e);
		}

		static get appName() { return 'cetSogukSiparisApp' }
		get appText() { return 'Sky Soğuk Sipariş' }
		static get wsURLBase_postfix() { return '/ticari/sogukSiparis' }

		static get defaultLoginOzelTip() {
			return new CKodVeAdi({ kod: 'plasiyer', aciklama: 'Plasiyer' })
		}

		static get appSogukmu() { return true }
		// get defaultPlasiyerKod() { return (sky.config.sessionInfo || {}).user }

		get fisTipleri() {
			return $.merge([
				CETFisTipi.fromFisSinif({ fisSinif: CETSatisSiparisFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETUgramaFis })
			], super.fisTipleri || [])
		}
	}
})()
