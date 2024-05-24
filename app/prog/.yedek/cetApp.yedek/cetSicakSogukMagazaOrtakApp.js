(function() {
	window.CETSicakSogukMagazaOrtakApp = class extends window.CETApp {
		constructor(e) {
			super(e);

			const extLogin = this.extensions.login;
			$.extend(extLogin.options, {
				// isLoginRequired: true,
				loginTypes: [
					{ kod: 'plasiyerLogin', aciklama: '<span style="color: steelblue;">Plasiyer</span>' }
				]
			});
		}

		static get appName() { return 'cetSicakSogukMagazaOrtakApp' }

		get defaultYerKod() {
			let yerKod = this.param.yerKod;
			if (!yerKod) {
				const sessionInfo = sky.config.sessionInfo;
				if (sessionInfo.hasSessionOrUser)
					yerKod = sessionInfo.user;
			}
			
			return yerKod || super.defaultYerKod;
		}

		static get rotaKullanilirmi() { return true }
		static get sonStoktanSecimYapilirmi() { return true }
		/*get sonStokKontrolEdilirmi() { return this.param.sonStokKontrolEdilirmi }
		get riskKontrolDurum() { return this.param.riskKontrolDurum }*/

		/*get defaultLayoutName() {
			return `../cetSicakSogukMagazaOrtakApp/cetSicakSogukMagazaOrtakApp`
		}*/

		get fisTipleri() {
			return $.merge([
				CETFisTipi.fromFisSinif({ fisSinif: CETTahsilatFis })
			], super.fisTipleri || [])
		}

		get bilgiGonderTableYapilari() {
			return $.merge(super.bilgiGonderTableYapilari || [], [
				{ baslik: 'data_UgramaFis' }
			])
		}

		get raporlar() {
			const raporlar = super.raporlar;
			if (!this.appMagazami) {
				raporlar.push(...[
					CETRapor.getListeItem({ raporSinif: CETRapor_GunSonu_MiktarHesaplasma }),
					CETRapor.getListeItem({ raporSinif: CETRapor_GunSonu_BedelHesaplasma }),
					CETRapor.getListeItem({ raporSinif: CETRapor_GunSonu_Hesaplasma })
				]);
			}

			return raporlar;
		}


		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);

			let layout = e.layout || this.layout;
			const rootLayout = this.rootLayout;
			$.extend(this.templates, {
				rotaListesi: rootLayout.find('#cetRotaListesi.part')
			});
		}

		async gerekirseKMGirisYap(e) {
			if (!this.param.kmTakibiYapilirmi || asBool(this[`${e.sonmu ? 'son' : 'ilk'}KMGirildimi`]))
				return;
			
			await this.kmGirisIstendi(e);
		}

		async ilkIrsaliyeRaporuKontrol(e) {
			if (this.param.ilkIrsaliyeDokumuZorunlumu && !this.ilkIrsaliyeRaporuAlindimi) {
				/*const message = `Bu adıma girmeden önce <b>İlk İrsaliye Raporu</b> alınmalıdır!`;
				displayMessage(message, this.appText);
				throw { isError: true, rc: 'invalidState', errorText: message };*/

				/*await new CETRapor_IlkIrsaliye().run();
				throw { isError: true, rc: 'runtimeInterrupt', errorText: message };*/

				const result = await new CETRapor_IlkIrsaliye().run();
				if (!result || result.isError || !result.part)
					return;
				
				return new Promise(resolve => {
					result.part.geriCallback = e =>
						resolve(e);
					const message = `Bu adıma girmeden önce <b>İlk İrsaliye Raporu</b> alınmalıdır!`;
					displayMessage(message, this.appText);
				});
			}
		}

		fisListe_stmSentDuzenleDevam(e) {
			super.fisListe_stmSentDuzenleDevam(e);

			/*const musteriDurumumu = e.musteriDurumu || e.musteriDurumumu;
			const {ozelIsaretKullanilirmi} = this;*/
		}

		rotaListe_fisIslemleri_stmSentDuzenleDevam(e) {
			super.rotaListe_fisIslemleri_stmSentDuzenleDevam(e);
			
			/*const {ozelIsaretKullanilirmi} = this;*/
		}
	}
})()
