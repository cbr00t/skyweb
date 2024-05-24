(function() {
	window.SkyCafeBarkodParser_Ayrisim = class extends window.SkyCafeBarkodParser_Kuralli {
		constructor(e) {
			e = e || {};
			super(e);
		}

		static get aciklama() { return 'Ayrışım' }
		static get ayrisimmi() { return true }
		get ayrisimAyiraclimi() { return this.formatAyiraclimi }
		get zVarmi() { return (this.kural || {}).zVarmi /* && !!this.zSeq */ }

		static getKuralSinif(e) {
			e = e || {};
			const {formatTipi} = e;
			if (formatTipi == 'A')
				return SkyCafeBarkodKurali_AyrisimAyiracli;
			
			return super.getKuralSinif(e);
		}
		
		async parseDevam(e) {
			let result = await super.parseDevam(e);
			if (result)
				return result;
			
			if (this.formatAyiraclimi)
				return await this.parseDevam_ayiracli(e);
			
			const {kural, okunanBarkod} = this;
			if (okunanBarkod) {
				if (this.formatBaslangicmi && okunanBarkod.length > 2) {
					this.barkod = okunanBarkod.slice(2);
					if (this.stokKod == okunanBarkod)
						this.stokKod = this.barkod;
				}
			}

			result = this.parcaAl({ belirtec: 'S', bas: kural.stokBas, hane: kural.stokHane,
				callback: value => this.stokKod = value });
			if (result) {
				if (this.stokKod) {
					if (!await this.shEkBilgileriBelirle(e))
						return false;
				}
			}
			else {
				result = this.parcaAl({ belirtec: 'V', bas: kural.barkodBas, hane: kural.barkodHane,
							callback: value => this.barkod = value });
				if (result) {
					let parser = new SkyCafeBarkodParser_Referans();
					result = await parser.parse({ barkod: this.barkod });
					if (result) {
						this.barkod = parser.barkod;
						this.stokKod = parser.stokKod;
					}
				}
				if (!result)
					return false;
			}
			
			this.parcaAl({ belirtec: 'K', bas: kural.miktarBas, hane: kural.miktarHane,
				callback: value => this.miktar = asFloat(value) || null });
			
			/* ['model', 'renk', 'desen', 'beden', 'lotNo', 'seriNo', 'raf'].forEach(key => {
				this.parcaAl({ bas: kural[`${key}Bas`], hane: kural[`${key}Hane`],
					callback: value => this[`${key}Kod`] = value });
			});
			['en', 'boy', 'yukseklik'].forEach(key => {
				this.parcaAl({ bas: kural[`${key}Bas`], hane: kural[`${key}Hane`],
					callback: value => this[`${key}`] = asFloat(value) || null });
			});
			for (let i = 1; i <= 9; i++) {
				const key = `ekOz${i}`;
				const detKey = `ekOz_${i}Kod`;
				this.parcaAl({ bas: kural[`${key}Bas`], hane: kural[`${key}Hane`],
					callback: value =>
						this[detKey] = asFloat(value) || null });
			} */

			return true;
		}

		async parseDevam_ayiracli(e) {
			const {kural} = this;
			let {barkod} = this;
			const {belirtecler} = kural;
			const barkodParcalar = this.barkodParcalar = barkod.split(kural.ayiracStr);
			let result = false, miktarAtandimi = false;
			for (let i in barkodParcalar) {
				const belirtec = belirtecler[i];
				const deger = (barkodParcalar[i] || '').trimEnd();
				if (belirtec && deger) {
					switch (belirtec) {
						case "S":
							this.stokKod = deger;
							result = true;
							if (deger) {
								if (!await this.shEkBilgileriBelirle(e))
									return false;
							}
							break;
						case "V":
							barkod = deger;
							// this.barkod = barkod = deger;
							
							let parser = new SkyCafeBarkodParser_Referans();
							let _parseResult = await parser.parse({ barkod: barkod });
							if (_parseResult) {
								// this.barkod = barkod = parser.barkod;
								barkod = parser.barkod;
								['stokKod', 'brm', 'carpan', 'paketKod'].forEach(key => {
									if (parser[key])
										this[key] = parser[key];
								});
								['fiyat'].forEach(key => {
									if (parser[key])
										this[key] = asFloat(parser[key]) || null;
								});
								if (!miktarAtandimi && parser.miktar)
									this.miktar = asFloat(parser.miktar) || null;
								this.stokKod = parser.stokKod;
								result = true;
							}
							break;
						case "K":
							this.miktar = asFloat(deger) || null;
							miktarAtandimi = true;
							break;
						case "Z":
							this.zSeq = asInteger(deger) || null;
							break;
						default:
							const hmrBelirtec2Bilgi = kural.class.hmrBelirtec2Bilgi || {};
							const bilgi = hmrBelirtec2Bilgi[belirtec];
							if (bilgi) {
								if (bilgi.isNumber)
									deger = asFloat(deger) || 0;
								this[bilgi.key] = deger;
							}
							break;
					}
				}
			}

			return result;
		}

		parcaAl(e) {
			const {formatTipi} = this.kural;
			if (formatTipi == 'M')						// Maskeleme
				return false;
			
			if (formatTipi == 'A')						// Ayıraçlı
				return null;

			return super.parcaAl(e);					// Başlangıçlı (sabit karakter sayılı - üst seviyedeki işlemi yap)
		}
	}
})();
