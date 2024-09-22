(function() {
	window.CETPromosyon_Ciro = class extends window.CETPromosyon { };
	window.CETPromosyon_MalFazlasi = class extends window.CETPromosyon {
		getHedefMiktar(e) {
			const {kaynakMiktar} = e; let hedefMiktar = 0;
			if (this.kademelimi) {
				const {kademeler} = this;
				for (const kademe of kademeler) {
					if (kaynakMiktar <= 0) break
					const eKadar = asFloat(kademe.eKadar) || 0; if (!eKadar) continue
					/* ters sıralı olduğu için devam edilmez */
					if (kaynakMiktar < eKadar) continue
					const {mfAdet} = kademe; hedefMiktar = asInteger(Math.trunc(kaynakMiktar / eKadar) * mfAdet); break
				}
			}
			else {
				const {vMiktar} = this, hMiktar = this.hMiktar || 1;
				hedefMiktar = kaynakMiktar < vMiktar ? 0 : Math.trunc(Math.trunc(kaynakMiktar / vMiktar) * hMiktar)
			}
			return hedefMiktar
		}
	};
	window.CETPromosyon_MalFazlasi_Stok = class extends window.CETPromosyon_MalFazlasi {
		get hedefStokKod() { return null }
		async _promosyonSonucu(e) {
			// shKod2Bilgi, grupKod2StokSet, tavsiyeStokKod
			const {shKod2Bilgi} = e; let {vStokKod} = this;
			let hesapBilgi = shKod2Bilgi[vStokKod]; if (!hesapBilgi) { return null }					/* bu promosyonun uygulanacagi stok yoksa */
			let kaynakMiktar = e.kaynakMiktar = hesapBilgi.topMiktar; if (!kaynakMiktar) { return null }
			// her vMiktar icin hMiktar kadar vStokKod veya hStokKod prom. olarak verilir
			let hedefMiktar = e.hedefMiktar = this.getHedefMiktar(e); if (!hedefMiktar) { return null }
			let {hedefStokKod} = this; if (!hedefStokKod) { return null } let proDet = new CETPromosyonDetay({ shKod: hedefStokKod, miktar: hedefMiktar });
			return { proDet, uygulananStoklar: [vStokKod] }
		}
	};
	window.CETPromosyon_MalFazlasi_Grup = class extends window.CETPromosyon_MalFazlasi {
		async _promosyonSonucu(e) {																		/* belirli stok var ekran islemi olmaz */
			const {shKod2Bilgi, grupKod2StokSet} = e;													/* shKod2Bilgi, grupKod2StokSet, tavsiyeStokKod */
			let uygunStokKodlari = grupKod2StokSet[this.vGrupKod]; if ($.isEmptyObject(uygunStokKodlari)) { return null }
			let kaynakMiktar = 0; for (let shKod in uygunStokKodlari) { let hesapBilgi = shKod2Bilgi[shKod]; if (hesapBilgi) { kaynakMiktar += hesapBilgi.topMiktar } }
			e.kaynakMiktar = kaynakMiktar; if (!kaynakMiktar) { return null }
			let hedefMiktar = e.hedefMiktar = this.getHedefMiktar(e); if (!hedefMiktar) { return null }
			let hedefStokKod = e.tavsiyeStokKod || await this.secilenStok(e); if (!hedefStokKod) { return null }
			let proDet = new CETPromosyonDetay({ shKod: hedefStokKod, miktar: hedefMiktar });			/* her vMiktar icin hMiktar kadarb elirlenen hedefStokKod prom. olarak verilir */
			return { proDet, uygulananStoklar: uygunStokKodlari }
		}
	};
	/* ekrandan stok secilmesi gereken */
	window.CETPromosyon_MalFazlasi_Grup_StokSecimli = class extends window.CETPromosyon_MalFazlasi_Grup {
		static get stokSecimlimi() { return true }	
		async secilenStok(e) {
			const {fis} = e, {app} = sky, grupKod = this.secimeEsasHedefGrupKod;
			let grupAdiPromise = app.grupKod2Adi(grupKod), geriYapildimi = false;
			let recs = await new Promise(async (resolve, fail) => {
				let part = new CETPromoUrunSecimPart({
					fis,
					proDetaylar: [{
						promosyon: this, proKod: this.id, proAdi: this.aciklama || '', iskontoKaldirilirmi: this.hMFVarsaSatirIskKapatmi,
						proSHGrupKod: grupKod, proSHGrupAdi: (await grupAdiPromise) || '', kaynakMiktar: e.kaynakMiktar, hedefMiktar: e.hedefMiktar
					}],
					stokStmDuzenleyici: e => {
						const {alias, stm} = e; const grupKodClause = e.grupKodClause || `${alias}.grupKod`;
						for (const sent of stm.getSentListe()) sent.where.degerAta(grupKod, grupKodClause)
					},
					kaydedince: e => { const recs = e.recs.filter(rec => !!rec.shKod); resolve($.isEmptyObject(recs) ? null : recs) },
					geriCallback: e => fail(this.error_ekranVazgecYapildi_silent())
				});
				await part.run()
			}) || [];
			let hedefStokKod = (recs[0] || {}).shKod; return hedefStokKod
		}
	}
	/** CIRO1:  Ciro için Dip İskontosu */
	window.CETPromosyon_CIRO1 = class extends window.CETPromosyon_Ciro {
		static get proTip() { return 'CIRO1' }
	};
	/** STOK1:  Stok için Mal Fazlası */
	window.CETPromosyon_STOK1 = class extends window.CETPromosyon_MalFazlasi_Stok {
		static get proTip() { return 'STOK1' }
		get hedefStokKod() { return this.vStokKod }				/* yanlis degil veri stok */
	};
	/** STOK1:  Stok için Başka Stoktan Mal Fazlası */
	window.CETPromosyon_STOK2 = class extends window.CETPromosyon_MalFazlasi_Stok {
		static get proTip() { return 'STOK2' }
		get hedefStokKod() { return this.hStokKod }
	};
	/** GRUP3:  Grup için Belirli Stok Promosyonu */
	window.CETPromosyon_GRUP3 = class extends window.CETPromosyon_MalFazlasi_Grup {
		static get proTip() { return 'GRUP3' }
		async secilenStok(e) { return this.hStokKod }			/* bu prom için stok belirlidir */
	};
	/** GRUP1:  Grup için Aynı Grupta Mal Fazlası */
	window.CETPromosyon_GRUP1 = class extends window.CETPromosyon_MalFazlasi_Grup_StokSecimli {
		static get proTip() { return 'GRUP1' }
		get secimeEsasHedefGrupKod() { return this.vGrupKod }	/* kaynak grup esas alinir */
	};
	/** GRUP3:  Grup için Başka Gruptan Mal Fazlası */
	window.CETPromosyon_GRUP2 = class extends window.CETPromosyon_MalFazlasi_Grup_StokSecimli {
		static get proTip() { return 'GRUP2' }
		get secimeEsasHedefGrupKod() { return this.hGrupKod }	/* hedef grup esas alinir */
	};
})()
