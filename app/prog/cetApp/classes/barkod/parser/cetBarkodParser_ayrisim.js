(function() {
	window.CETBarkodParser_Ayrisim = class extends window.CETBarkodParser_Kuralli {
		constructor(e) { e = e || {}; super(e) }
		static get aciklama() { return 'Ayrışım' } static get ayrisimmi() { return true }
		get ayrisimAyiraclimi() { return this.formatAyiraclimi }
		get zVarmi() { return (this.kural || {}).zVarmi /* && !!this.zSeq */ }

		static getKuralSinif(e) {
			e = e || {};
			const {formatTipi} = e;
			if (formatTipi == 'A')
				return CETBarkodKurali_AyrisimAyiracli;
			
			return CETBarkodKurali_Ayrisim;
		}
		
		async parseDevam(e) {
			let result = await super.parseDevam(e); if (result) { return result }
			if (this.formatAyiraclimi) { return await this.parseDevam_ayiracli(e) }
			let {kural, okunanBarkod} = this, barkodFix = value => {
				if (value) {
					if (this.formatBaslangicmi && value.length > 2) { this.barkod = value = value.slice(2) }
					if (this.shKod == okunanBarkod) { this.shKod = this.barkod }
				}
				return value
			}
			barkodFix(okunanBarkod); result = this.parcaAl({ belirtec: 'S', bas: kural.stokBas, hane: kural.stokHane, callback: value => this.shKod = value });
			if (result) { if (this.shKod) { if (!await this.shEkBilgileriBelirle(e)) { return false } } }
			else {
				result = this.parcaAl({ belirtec: 'V', bas: kural.barkodBas, hane: kural.barkodHane, callback: value => this.barkod = value });
				if (result) {
					let parser = new CETBarkodParser_Referans(); result = await parser.parse({ barkod: this.barkod });
					if (result) { this.barkod = parser.barkod; this.shKod = parser.shKod }
					else {
						let {barkod: _barkod} = this; if (_barkod == okunanBarkod) { this.barkod = barkod.slice(2) }
						parser = await sky.app.barkodBilgiBelirle({ barkod: this.barkod }); this.barkod = _barkod;
						if (parser) {
							result = true; for (let key of ['shKod', 'shAdi', 'grupKod', 'miktar', 'fiyat', 'fiyatGorFiyati', 'kdvOrani', 'kdvDegiskenmi', 'boyutTipi', 'bedenKategoriKod']) { delete this[key] }
							for (let [key, value] of Object.entries(parser)) { if (value != null && !this[key]) { this[key] = value } }
						}
					}
				}
				if (!result) { return false } barkodFix(okunanBarkod)
			}
			this.parcaAl({ belirtec: 'K', bas: kural.miktarBas, hane: kural.miktarHane, callback: value => this.miktar = asFloat(value) || null });
			['paket', 'model', 'renk', 'desen', 'beden', 'lotNo', 'seriNo', 'raf'].forEach(key => {
				let postfix = key == 'lotNo' || key == 'seriNo' ? '' : 'Kod';
				this.parcaAl({ bas: kural[`${key}Bas`], hane: kural[`${key}Hane`], callback: value => this[`${key}${postfix}`] = value }) });
			['en', 'boy', 'yukseklik'].forEach(key => {
				this.parcaAl({ bas: kural[`${key}Bas`], hane: kural[`${key}Hane`], callback: value => this[`${key}`] = asFloat(value) || null }) });
			for (let i = 1; i <= 9; i++) {
				const key = `ekOz${i}`, detKey = `ekOz_${i}Kod`;
				this.parcaAl({ bas: kural[`${key}Bas`], hane: kural[`${key}Hane`], callback: value => this[detKey] = asFloat(value) || null })
			}
			return true
		}
		async parseDevam_ayiracli(e) {
			let {kural} = this, {barkod} = this, {belirtecler} = kural, barkodParcalar = this.barkodParcalar = barkod.split(kural.ayiracStr);
			let result = false, miktarAtandimi = false; for (let i in barkodParcalar) {
				const belirtec = belirtecler[i], deger = (barkodParcalar[i] || '').trimEnd();
				if (belirtec && deger) {
					switch (belirtec) {
						case "S":
							this.shKod = deger;
							result = true;
							if (deger) {
								if (!await this.shEkBilgileriBelirle(e))
									return false;
							}
							break;
						case "V":
							barkod = deger;
							// this.barkod = barkod = deger;
							
							let parser = new CETBarkodParser_Referans();
							let _parseResult = await parser.parse({ barkod: barkod });
							if (_parseResult) {
								// this.barkod = barkod = parser.barkod;
								barkod = parser.barkod;
								['shKod', 'brm', 'carpan', 'paketKod'].forEach(key => {
									if (parser[key])
										this[key] = parser[key];
								});
								['fiyat'].forEach(key => {
									if (parser[key])
										this[key] = asFloat(parser[key]) || null;
								});
								if (!miktarAtandimi && parser.miktar) {
									this.miktar = asFloat(parser.miktar) || null;
									if (parser.paketIcAdet)
										this.paketIcAdet = parser.paketIcAdet;
								}
								this.shKod = parser.shKod;
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

		async parseSonrasi(e) {
			const {kural, paketKod} = this;
			if (kural && paketKod) {
				let {miktar} = this;
				let {paketIcAdet} = kural;
				const {shKod} = this;
				if (!paketIcAdet && shKod) {
					const sent = new MQSent({
						from: 'mst_StokPaket',
						where: [
							{ degerAta: shKod, saha: 'stokKod' },
							{ degerAta: paketKod, saha: 'paketKod' }
						],
						sahalar: ['paketIcAdet']
					});
					const stm = new MQStm({
						sent: sent,
						orderBy: ['varsayilanmi DESC']
					});
					paketIcAdet = await sky.app.dbMgr_mf.tekilDegerExecuteSelect({ query: stm });
					if (paketIcAdet != null)
						paketIcAdet = asFloat(paketIcAdet);
				}
				if (paketIcAdet) {
					this.paketIcAdet = paketIcAdet;
					// miktar = this.miktar = miktar * paketIcAdet;
				}
			}
			return await super.parseSonrasi(e);
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
