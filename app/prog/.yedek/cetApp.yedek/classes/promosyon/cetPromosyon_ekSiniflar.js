(function() {
	window.CETPromosyon_Ciro = class extends window.CETPromosyon {
	};

	window.CETPromosyon_MalFazlasi = class extends window.CETPromosyon {
		getHedefMiktar(e) {
			const {kaynakMiktar} = e;
			let hedefMiktar = 0;
			if (this.kademelimi) {
				const {kademeler} = this;
				let kalanMiktar = kaynakMiktar;
				let kademeDusMiktar = 0;
				for (let i in kademeler) {
					if (kalanMiktar <= 0)
						break;
					
					const kademe = kademeler[i];
					const eKadar = asFloat(kademe.eKadar) || 0;
					if (!eKadar)
						continue;
					// if (kalanMiktar < eKadar)
					// 	break;
					
					let uygulanacakMiktar = Math.trunc(eKadar - kademeDusMiktar);
					if (uygulanacakMiktar <= 0)
						continue;
					
					let buDusMiktar = Math.min(uygulanacakMiktar, kalanMiktar);
					let brutVerilecek = asFloat(kademe.mfAdet) || 0;
					let buHedefMiktar = Math.trunc(brutVerilecek * buDusMiktar / uygulanacakMiktar);
					hedefMiktar += buHedefMiktar;
					
					kademeDusMiktar = eKadar;
					kalanMiktar -= buDusMiktar;
				}
			}
			else {
				const {vMiktar} = this;
				const hMiktar = this.hMiktar || 1;
				if (kaynakMiktar < vMiktar)
					return 0;
				
				hedefMiktar = Math.trunc(Math.trunc(kaynakMiktar / vMiktar) * hMiktar);
			}

			return hedefMiktar;
		}
	};

	window.CETPromosyon_MalFazlasi_Stok = class extends window.CETPromosyon_MalFazlasi {
		async _promosyonSonucu(e) {
			// shKod2Bilgi, grupKod2StokSet, tavsiyeStokKod
			const shKod2Bilgi = e.shKod2Bilgi;
			let vStokKod = this.vStokKod;
			let hesapBilgi = shKod2Bilgi[vStokKod];
			if (!hesapBilgi)		// bu promosyonun uygulanacagi stok yoksa
				return null;
			
			let kaynakMiktar = e.kaynakMiktar = hesapBilgi.topMiktar;
			if (!kaynakMiktar)
				return null;

			// her vMiktar icin hMiktar kadar vStokKod veya hStokKod prom. olarak verilir
			let hedefMiktar = e.hedefMiktar = this.getHedefMiktar(e);
			if (!hedefMiktar)
				return null;

			let hedefStokKod = this.hedefStokKod;
			if (!hedefStokKod)
				return null;
			
			let proDet = new CETPromosyonDetay({ shKod: hedefStokKod, miktar: hedefMiktar });
			return { proDet: proDet, uygulananStoklar: [vStokKod] };
		}

		get hedefStokKod() {
			return null
		}
	};

	window.CETPromosyon_MalFazlasi_Grup = class extends window.CETPromosyon_MalFazlasi {
		async _promosyonSonucu(e) {		// belirli stok var ekran islemi olmaz
			// shKod2Bilgi, grupKod2StokSet, tavsiyeStokKod
			const {shKod2Bilgi, grupKod2StokSet} = e;
			let uygunStokKodlari = grupKod2StokSet[this.vGrupKod];
			if ($.isEmptyObject(uygunStokKodlari))
				return null;

			let kaynakMiktar = 0;
			for (let shKod in uygunStokKodlari) {
				let hesapBilgi = shKod2Bilgi[shKod];
				if (hesapBilgi)
					kaynakMiktar += hesapBilgi.topMiktar;
			}
			e.kaynakMiktar = kaynakMiktar;
			if (!kaynakMiktar)
				return null;
			
			let hedefMiktar = e.hedefMiktar = this.getHedefMiktar(e);
			if (!hedefMiktar)
				return null;
			
			let hedefStokKod = e.tavsiyeStokKod || await this.secilenStok(e);
			if (!hedefStokKod)
				return null;
			
			// her vMiktar icin hMiktar kadarb elirlenen hedefStokKod prom. olarak verilir

			let proDet = new CETPromosyonDetay({ shKod: hedefStokKod, miktar: hedefMiktar });
			return { proDet: proDet, uygulananStoklar: uygunStokKodlari };
		}
	};

	/* ekrandan stok secilmesi gereken */
	window.CETPromosyon_MalFazlasi_Grup_StokSecimli = class extends window.CETPromosyon_MalFazlasi_Grup {
		static get stokSecimlimi() { return true }
		
		async secilenStok(e) {
			const grupKod = this.secimeEsasHedefGrupKod;
			let grupAdiPromise = sky.app.grupKod2Adi(grupKod);
			let geriYapildimi = false;
			let recs = await new Promise(async (resolve, fail) => {
				let part = new CETPromoUrunSecimPart({
					// sonStokKontrolEdilirmi: true,
					// asilDetay: new CETTicariDetay({ shKod: '001', shAdi: 'abc', brm: 'AD', miktar: 2 }),
					// proDetaylar: [{ proKod: `p01`, proAdi: `pro 1`, proSHGrupKod: `g1`, proSHGrupAdi: `1. grup`, miktar: 10 }, { proKod: `p03`, proAdi: `pro 3`, proSHGrupKod: `g2`, proSHGrupAdi: `2. grup` }]
					fis: e.fis,
					proDetaylar: [{
						promosyon: this,
						proKod: this.id,
						proAdi: this.aciklama || '',
						iskontoKaldirilirmi: this.hMFVarsaSatirIskKapatmi,
						proSHGrupKod: grupKod,
						proSHGrupAdi: (await grupAdiPromise) || '',
						kaynakMiktar: e.kaynakMiktar,
						hedefMiktar: e.hedefMiktar
					}],
					stokStmDuzenleyici: e => {
						const grupKodClause = e.grupKodClause || `${e.alias}.grupKod`;
						e.stm.sentDo(sent => {
							sent.where
								.degerAta(grupKod, grupKodClause);
						});
					},
					kaydedince: e => {
						const recs = e.recs.filter(rec => !!rec.shKod);
						if ($.isEmptyObject(recs))
							resolve(null);
						else
							resolve(recs);
					},
					geriCallback: e => {
						fail(this.error_ekranVazgecYapildi_silent());
					}
				});
				await part.run();
			}) || [];
			
			let hedefStokKod = (recs[0] || {}).shKod;
			return hedefStokKod;
		}
	}


	/** CIRO1:  Ciro için Dip İskontosu */
	window.CETPromosyon_CIRO1 = class extends window.CETPromosyon_Ciro {
		static get proTip() { return 'CIRO1' }
	};

	/*window.CETPromosyon_CIRO2 = class extends window.CETPromosyon_Ciro {
		static get proTip() { return 'CIRO2' }
	};*/


	/** STOK1:  Stok için Mal Fazlası */
	window.CETPromosyon_STOK1 = class extends window.CETPromosyon_MalFazlasi_Stok {
		static get proTip() { return 'STOK1' }

		get hedefStokKod() {
			return this.vStokKod;	// yanlis degil veri stok
		}
	};

	/** STOK1:  Stok için Başka Stoktan Mal Fazlası */
	window.CETPromosyon_STOK2 = class extends window.CETPromosyon_MalFazlasi_Stok {
		static get proTip() { return 'STOK2' }

		get hedefStokKod() {
			return this.hStokKod;
		}
	};

	/*window.CETPromosyon_STOK3 = class extends window.CETPromosyon_MalFazlasi_Stok {
		static get proTip() { return 'STOK3' }
	};*/


	/** GRUP3:  Grup için Belirli Stok Promosyonu */
	window.CETPromosyon_GRUP3 = class extends window.CETPromosyon_MalFazlasi_Grup {
		static get proTip() { return 'GRUP3' }

		async secilenStok(e) {	// bu prom için stok belirlidir
			return this.hStokKod
		}

	};

	/** GRUP1:  Grup için Aynı Grupta Mal Fazlası */
	window.CETPromosyon_GRUP1 = class extends window.CETPromosyon_MalFazlasi_Grup_StokSecimli {
		static get proTip() { return 'GRUP1' }

		get secimeEsasHedefGrupKod() {
			return this.vGrupKod;		// kaynak grup esas alinir
		}
	};

	/** GRUP3:  Grup için Başka Gruptan Mal Fazlası */
	window.CETPromosyon_GRUP2 = class extends window.CETPromosyon_MalFazlasi_Grup_StokSecimli {
		static get proTip() { return 'GRUP2' }

		get secimeEsasHedefGrupKod() {
			return this.hGrupKod;		// hedef grup esas alinir
		}
	};
})()
