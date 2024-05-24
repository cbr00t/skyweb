(function() {
	window.CETTicariDetay = class extends window.CETStokTicariDetay {
		constructor(e) {
			super(e);

			e = e || {};
			const {app} = sky;
			const {fiyatFra} = app;
			const {isCopy, fis} = e;
			$.extend(this, {
				orjKdvOrani: e.orjKdvOrani || e.orjkdvorani,
				kdvOrani: asInteger(e.kdvOrani || e.kdvorani || e.satKdvOrani || e.almKdvOrani) || 0,
				kdv: e.kdv == null ? null : bedel(e.kdv) || 0,
				kdvDegiskenmi: asBool(e.kdvDegiskenmi),
				orjFiyat: roundToFra(e.orjFiyat, fiyatFra) || 0,
				fiyat: roundToFra(e.fiyat || e.brmFiyat, fiyatFra) || 0,
				brutBedel: bedel(e.brutBedel || e.bedel) || 0,
				netBedel: bedel(e.netBedel || e.bedel) || 0,
				netFiyat: roundToFra(e.netFiyat || e.netfiyat, fiyatFra) || 0,
				mfBaz: asInteger(e.mfBaz || e.mfbaz) || 0,
				mfPay: asInteger(e.mfPay || e.mfpay) || 0,
				malFazlasi: asFloat(e.malFazlasi || e.malfazlasi) || 0,
				siparisVioID2MiktarYapi: e.siparisVioID2MiktarYapi || {},
				ozelKampanyaKod: e.ozelKampanyaKod,
				ozelKampanyaIskSinir: e.ozelKampanyaIskSinir,
				iskontoYapilmazmi: asBool(e.iskontoYapilmazmi),
				promosyonYapilmazmi: asBool(e.promosyonYapilmazmi)
			});
			this.orjFiyat = this.orjFiyat || this.fiyat;
			if (this.orjKdvOrani == null)
				this.orjKdvOrani = this.kdvOrani;

			if (fis && fis.ihracatmi)
				this.kdvOrani = 0;
			
			if (!isCopy)
				this.brmFiyatDuzenle(e);

			this.class.iskOranKeys.forEach(key =>
				this[key] = asFloat(e[key] || e[key.toLowerCase()]) || 0);
			this.class.kamOranKeys.forEach(key =>
				this[key] = asFloat(e[key] || e[key.toLowerCase()]) || 0);

			if (!isCopy) {
				this.ozelKampanyaIskOranSinirBul(e).then(() => {
					if (!(this.brutBedel && this.netBedel))
						this.bedelHesapla();
					else if (this.kdv == null)
						this.kdvHesapla();
				});
				this.malFazlasiHesapla(e);
			}
		}

		static get fisSinif() { return CETTicariFis }

		static get iskOranKeys() {
			const {iskSayi} = sky.app;
			const result = super.iskOranKeys || [];
			for (let i = 1; i <= iskSayi; i++)
				result.push(`iskOran${i}`);
			return result;
		}

		/*static get kamOranKeys() {
			return $.merge(
				super.kamOranKeys || [],
				['kamOran1', 'kamOran2', 'kamOran3']
			)
		}*/

		static get ozelKamOranKeys() {
			const {app} = sky;
			const ozelKamOranSayi = app.ozelKampanyaOranSayisi || 0;
			const result = super.ozelKamOranKeys || [];
			for (let i = 1; i <= ozelKamOranSayi; i++)
				result.push(`ozelKampanyaOran${i}`);
			return result;
		}

		get iskontoUygulanabilirmi() {
			return !(this.malFazlasi || this.iskontoYapilmazmi || this.ozelIskontoVarmi);
		}

		get toplamIskontoBedel() {
			return bedel(Math.abs((this.brutBedel || 0) - (this.netBedel || 0)))
		}

		hostVars(e) {
			const {app} = sky;
			const {fiyatFra, ozelKampanyaKullanilirmi} = app;
			
			let hv = super.hostVars(e);
			$.extend(hv, {
				orjKdvOrani: this.orjKdvOrani || 0,
				kdvorani: this.kdvOrani || 0,
				kdvDegiskenmi: bool2Int(this.kdvDegiskenmi),
				orjfiyat: roundToFra(this.orjFiyat || 0, fiyatFra),
				belgefiyat: roundToFra(this.fiyat || 0, fiyatFra),
				belgebrutbedel: bedel(this.brutBedel) || 0,
				belgebedel: bedel(this.netBedel) || 0,
				ozelKampanyaKod: ozelKampanyaKullanilirmi ? (this.ozelKampanyaKod || '') : '',
				ozelKampanyaIskSinir: ozelKampanyaKullanilirmi ? (this.ozelKampanyaKod ? (this.ozelKampanyaIskSinir || 0) : 0) : 0,
				ozelfiyatmi: bool2FileStr(this.ozelFiyatVarmi || false),
				ozeliskoranmi: bool2FileStr(this.ozelIskontoVarmi || false),
				mfbaz: asInteger(this.mfBaz) || 0,
				mfpay: asInteger(this.mfPay) || 0,
				malfazlasi: asFloat(this.malFazlasi) || 0,
				promokod: '',
				promosyonYapilmazmi: bool2FileStr(this.promosyonYapilmazmi || false),
				iskontoYapilmazmi: bool2FileStr(this.iskontoYapilmazmi || false)
			});
			
			(this.class.iskOranKeys || []).forEach(key =>
				hv[key.toLowerCase()] = asFloat(this[key]) || 0);
			(this.class.kamOranKeys || []).forEach(key =>
				hv[key.toLowerCase()] = asFloat(this[key]) || 0);
			if (app.ozelKampanyaKullanilirmi) {
				const {ozelKampanyaKod} = this;
				(this.class.ozelKamOranKeys || []).forEach(key =>
					hv[key] = ozelKampanyaKod ? (asFloat(this[key]) || 0) : 0);
			}
			
			var siparisVioIDVeMiktarYapiStrListe = [];
			const {siparisVioID2MiktarYapi} = this;
			for (let vioID in siparisVioID2MiktarYapi) {
				const miktar = siparisVioID2MiktarYapi[vioID];
				siparisVioIDVeMiktarYapiStrListe.push(`${vioID}=${miktar}`);
			}
			hv.siparisVioIDVeMiktarYapi = siparisVioIDVeMiktarYapiStrListe.join(`|`);
			
			return hv;
		}

		async setValues(e) {
			e = e || {};
			await super.setValues(e);

			const {app} = sky;
			const {fiyatFra, ozelKampanyaKullanilirmi} = app;
			const {rec} = e;
			$.extend(this, {
				orjKdvOrani: rec.orjKdvOrani == null ? null : (asInteger(rec.orjKdvOrani) || 0),
				kdvOrani: rec.kdvorani == null ? null : (asInteger(rec.kdvorani) || 0),
				kdv: e.kdv == null ? null : bedel(e.kdv) || 0,
				kdvDegiskenmi: asBool(rec.kdvDegiskenmi),
				orjfiyat: roundToFra(rec.orjfiyat || 0, fiyatFra),
				fiyat: roundToFra(rec.belgefiyat, fiyatFra) || 0,
				brutBedel: bedel(rec.belgebrutbedel) || 0,
				netBedel: bedel(rec.belgebedel) || 0,
				siparisVioID: rec.siparisVioID,
				siparisMiktar: rec.siparisMiktar == null ? null : (asFloat(rec.siparisMiktar) || 0),
				mfBaz: asInteger(rec.mfbaz) || 0,
				mfPay: asInteger(rec.mfpay) || 0,
				malFazlasi: asFloat(rec.malfazlasi) || 0,
				ozelKampanyaKod: ozelKampanyaKullanilirmi ? (rec.ozelKampanyaKod || '') : null,
				// ozelKampanyaIskSinir: ozelKampanyaKullanilirmi ? (rec.ozelKampanyaKod ? (rec.ozelKampanyaIskSinir || 0) : null) : null,
				ozelFiyatVarmi: asBool(rec.ozelfiyatmi || ''),
				ozelIskontoVarmi: asBool(rec.ozeliskoranmi || ''),
				promosyonYapilmazmi: asBool(rec.promosyonYapilmazmi || ''),
				iskontoYapilmazmi: asBool(rec.iskontoYapilmazmi || '')
			});
			this.orjFiyat = this.orjFiyat || this.fiyat;
			
			(this.class.iskOranKeys || []).forEach(key =>
				this[key] = asFloat(rec[key.toLowerCase()]) || 0);
			(this.class.kamOranKeys || []).forEach(key =>
				this[key] = asFloat(rec[key.toLowerCase()]) || 0);
			if (ozelKampanyaKullanilirmi && this.ozelKampanyaKod) {
				if (!this.ozelKampanyaIskSinir)
					await this.ozelKampanyaIskOranSinirBul(e);
				(this.class.ozelKamOranKeys || []).forEach(key =>
					this[key] = asFloat(rec[key]) || 0);
			}

			this.netFiyatHesapla();
			
			const siparisVioID2MiktarYapi = this.siparisVioID2MiktarYapi = {};
			if (rec.siparisVioIDVeMiktarYapi) {
				const siparisVioIDVeMiktarYapiStrListe = rec.siparisVioIDVeMiktarYapi.split(`|`);
				for (let i in siparisVioIDVeMiktarYapiStrListe) {
					const text = siparisVioIDVeMiktarYapiStrListe[i];
					if (text) {
						const parts = text.split(`=`);
						siparisVioID2MiktarYapi[asInteger(parts[0])] = asFloat(parts[1]) || 0;
					}
				}
			}
		}

		async setValuesFromSablon(e) {
			e = e || {};
			await super.setValuesFromSablon(e);

			const {app} = sky;
			const {fiyatFra, iskSayi} = app;
			const {rec} = e;
			$.extend(this, {
				kdvOrani: rec.kdvOrani == null ? this.kdvOrani : asInteger(rec.kdvOrani),
				kdv: rec.kdv == null ? this.kdv : bedel(rec.kdv),
				fiyat: rec.fiyat == null ? this.fiyat : (roundToFra(rec.fiyat, fiyatFra) || 0)
			});
			this.orjFiyat = this.fiyat;
			if (rec.fiyat != null)
				this.brmFiyatDuzenle(e);
			
			for (let i = 1; i <= iskSayi; i++) {
				let key = `iskOran${i}`;
				let value = rec[key];
				if (value != null)
					this[key] = value;
			}
			for (let i = 1; i <= 3; i++) {
				key = `kamOran${i}`;
				value = rec[key];
				if (value != null)
					this[key] = value;
			}
			this.netFiyatHesapla();
		}

		/*async detayEkIslemler_ekle(e) {
			const {app} = sky;
			const {fis} = e;
			const satirIskOranSinir = asFloat(this.satirIskOranSinirUyarlanmis) || 0;;
			const iskKullanilirmi = satirIskOranSinir > 0 && (app.iskontoArttirilirmi && (fis ? fis.class : CETTicariFis).dipIskBedelKullanilirmi);			
			if (!iskKullanilirmi)
				this.iskontoYapilmazmi = true;

			return await super.detayEkIslemler_ekle(e);
		}*/

		async detayEkIslemler(e) {
			await super.detayEkIslemler(e);

			await this.ozelKampanyaIskOranSinirBul(e);
			await this.bedelHesapla(e);
			await this.kdvHesapla(e);
			await this.malFazlasiHesapla(e);
		}

		async satisKosulYapilariIcinDuzenle(e) {
			e = e || {};
			await super.satisKosulYapilariIcinDuzenle(e);

			const {app} = sky;
			const {fiyatFra, iskSayi} = app;
			const {fis} = e;
			/*if (!this.iskontoYapilmazmi) {
				const satirIskOranSinir = asFloat(this.satirIskOranSinirUyarlanmis) || 0;;
				// const iskKullanilirmi = satirIskOranSinir > 0 && (app.iskontoArttirilirmi && (fis ? fis.class : CETTicariFis).dipIskBedelKullanilirmi);
				// if (!iskKullanilirmi)
				// 	this.iskontoYapilmazmi = true;
			}*/

			const {satisKosulYapilari} = e;
			if (!satisKosulYapilari)
				return;
			
			let _e = { stokKod: this.shKod, grupKod: this.grupKod };
			let rec, kosulTip, kosulSinif, kosulKodListe;

			if (!this.ozelFiyatVarmi) {
				kosulTip = 'FY';
				kosulSinif = CETSatisKosul.kosulTip2Sinif(kosulTip);
				kosulKodListe = (satisKosulYapilari[kosulTip] || []).map(kosul => kosul.id);
				rec = await kosulSinif.kosullarIcinStokGrupBilgi($.extend({ kosulKodListe: kosulKodListe }, _e));
				if (rec) {
					$.extend(this, {
						iskontoYapilmazmi: asBool(this.iskontoYapilmazmi) || asBool(rec.iskontoYapilmazmi),
						promosyonYapilmazmi: asBool(rec.promosyonYapilmazmi)
					});

					let value = roundToFra(rec.ozelFiyat, fiyatFra);
					if (value) {
						$.extend(this, {
							fiyat: value,
							ozelFiyatVarmi: true
						});
						this.orjFiyat = this.fiyat;
						this.brmFiyatDuzenle(e);
						// await this.bedelHesapla(e);
					}

					value = roundToFra(rec.enDusukFiyat, fiyatFra);
					if (value)
						this.enDusukFiyat = value;
				}
			}

			if (!this.ozelMFVarmi) {
				kosulTip = 'MF';
				kosulSinif = CETSatisKosul.kosulTip2Sinif(kosulTip);
				kosulKodListe = (satisKosulYapilari[kosulTip] || []).map(kosul => kosul.id);
				rec = await kosulSinif.kosullarIcinStokGrupBilgi($.extend({ kosulKodListe: kosulKodListe }, _e));
				if (rec) {
					this.mfBaz = asInteger(rec.mfBaz) || 0;
					this.mfPay = asInteger(rec.mfPay) || 0;
					this.malFazlasiHesapla(e);
				}
			}
			
			if (this.iskontoUygulanabilirmi) {
				kosulTip = 'SB';
				kosulSinif = CETSatisKosul.kosulTip2Sinif(kosulTip);
				kosulKodListe = (satisKosulYapilari[kosulTip] || []).map(kosul => kosul.id);
				rec = await kosulSinif.kosullarIcinStokGrupBilgi($.extend({ kosulKodListe: kosulKodListe }, _e));
				if (rec) {
					for (let i = 1; i <= iskSayi; i++) {
						const key = `iskOran${i}`;
						let value = asFloat(rec[key]) || 0;
						if (value) {
							this[key] = value;
							this.ozelIskontoVarmi = true;
						}
					}

					let value = roundToFra(rec.enDusukFiyat, fiyatFra);
					if (value)
						this.enDusukFiyat = value;
				}

				kosulTip = 'KM';
				kosulSinif = CETSatisKosul.kosulTip2Sinif(kosulTip);
				kosulKodListe = (satisKosulYapilari[kosulTip] || []).map(kosul => kosul.id);
				rec = await kosulSinif.kosullarIcinStokGrupBilgi($.extend({ kosulKodListe: kosulKodListe }, _e));
				if (rec) {
					for (let i = 1; i <= 3; i++) {
						const key = `kamOran${i}`;
						let value = asFloat(rec[key]) || 0;
						if (value) {
							this[key] = value;
							this.ozelKampanyaVarmi = true;
						}
					}

					let value = roundToFra(rec.enDusukFiyat, fiyatFra);
					if (value)
						this.enDusukFiyat = value;
				}
			}
		}

		ekBilgileriBelirleDevam(e) {
			e = e || {};
			super.ekBilgileriBelirleDevam(e);

			const {app} = sky;
			const {fiyatFra} = app;
			const {fis, rec} = e;
			this.orjKdvOrani = asInteger(rec.kdvOrani) || 0;
			if (fis && fis.ihracatmi)
				this.kdvOrani = 0;
			
			let fiyat = this.fiyat = this.ozelFiyatVarmi ? this.fiyat : (roundToFra(rec.brmFiyat, fiyatFra) || 0);
			this.orjFiyat = this.orjFiyat || this.fiyat;
			this.brmFiyatDuzenle(e);
		}

		brmFiyatDuzenle(e) {
			const {app} = sky;
			const {fiyatFra} = app;
			const {fis} = e;
			if (fis) {
				const {yildizlimi} = fis;
				const {stokFiyatKdvlimi} = app;
				if (yildizlimi) {
					if (app.yildizFiyatKdvlimi) {
						if (!stokFiyatKdvlimi)
							this.fiyat = roundToFra(this.fiyat + (this.fiyat * this.kdvOrani / 100), fiyatFra);
					}
					else {
						if (stokFiyatKdvlimi)
							this.fiyat = roundToFra(this.fiyat * 100 / (100 + this.kdvOrani), fiyatFra);
					}
				}
				else {
					// normal fişler KDV Hariç kabul edilir (gerekirse dipte kdv)
					if (stokFiyatKdvlimi)
						this.fiyat = roundToFra(this.fiyat * 100 / (100 + this.kdvOrani), fiyatFra);
				}
			}
		}

		kdvHesapla(e) {
			const {fis} = e;
			if (fis && fis.yildizlimi) {
				this.kdvOrani = 0;
				return;
			}
			
			const {kdvOrani} = this;
			this.kdv = kdvOrani ? bedel(this.netBedel * kdvOrani / 100) : 0;
		}

		malFazlasiHesapla(e) {
			const {mfPay, mfBaz, miktar} = this;
			let malFazlasi = 0;
			if (mfBaz && mfPay && miktar >= mfBaz)
				malFazlasi = asInteger(miktar * mfPay / mfBaz);
			this.malFazlasi = malFazlasi;
			// this.ozelMFVarmi = !!malFazlasi;

			if (malFazlasi)
				this.iskontoKampanyaReset();
		}

		async ozelKampanyaIskOranSinirBul(e) {
			const {app} = sky;
			const {ozelKampanyaKod} = this;
			if (!app.ozelKampanyaKullanilirmi || !ozelKampanyaKod) {
				this.ozelKampanyaIskSinir = null;
				return;
			}
			
			const ozelKampanyaKod2Rec = (app.caches || {}).ozelKampanyaKod2Rec || {};
			let rec = ozelKampanyaKod2Rec[ozelKampanyaKod] || null;
			if (rec == null) {
				const dbMgr = this.class.fisSinif.dbMgr || sky.app.dbMgr_mf;
				const sent = new MQSent({
					from: `mst_OzelKampanya`,
					where: [{ degerAta: ozelKampanyaKod, saha: `kod` }],
					sahalar: [`*`]
				});
				const stm = new MQStm({ sent: sent });
				rec = await dbMgr.tekilExecuteSelect({ tx: e.tx, query: stm });
				ozelKampanyaKod2Rec[ozelKampanyaKod] = rec;
			}
			
			const iskSinir = roundToFra(asFloat(rec.iskSinir), 2) || 100;
			this.ozelKampanyaIskSinir = iskSinir;
		}

		bedelHesapla(e) {
			let _bedel = bedel(this.miktar * this.fiyat);
			// _bedel = bedel(_bedel + ((this.kdvOrani || 0) / 100));
			this.brutBedel = _bedel;
			
			let proc = oranListe => {
				oranListe.forEach(oran => {
					if (oran) {
						let xBedel = bedel(_bedel * oran / 100) || 0;
						_bedel -= xBedel;
					}
				})
			};
			proc(this.iskOranListe);
			proc(this.kamOranListe);
			if (sky.app.ozelKampanyaKullanilirmi && this.ozelKampanyaKod)
				proc(this.ozelKamOranListe);
			
			this.netBedel = bedel(_bedel);
			this.netFiyatHesapla(e);
		}

		netFiyatHesapla(e) {
			const {fiyatFra} = sky.app;
			this.netFiyat = roundToFra(this.netBedel / asFloat(this.miktar), fiyatFra) || 0;
		}

		iskontoKampanyaReset() {
			super.iskontoKampanyaReset();
			
			this.bedelHesapla();
		}

		siparisKarsilamaYapiReset(e) {
			super.siparisKarsilamaYapiReset(e);
			this.siparisVioID2MiktarYapi = {};
		}

		static getDokumAttr2Baslik(e) {
			return $.extend(super.getDokumAttr2Baslik(e) || {}, {
				promosyonKod: `Pro.`,
				proKod: `Pro.`,
				promosyonText: `Pro.`,
				kdvOrani: `KDV%`,
				kdvOraniText: 'KDV%',
				kdvBedel: `KDV Tutar`
			})
		}

		async dokumSahaDegeri(e) {
			let value = await super.dokumSahaDegeri(e);
			if (value == null)
				return value;
			
			const {saha} = e;
			if (saha && saha.tip == 'bedel')
				return bedelStr(value) + ' TL';
			
			return value;
		}

		async getDokumDegeriDict(e) {
			return $.extend(await super.getDokumDegeriDict(e) || {}, {
				promosyonKod: ``,
				proKod: ``,
				promosyonText: '',
				proText: '',
				miktar: e => {
					const {miktar, malFazlasi} = this;
					let value = miktar.toString();
					if (malFazlasi)
						value += `+${malFazlasi.toString()}`;
					return value;
				},
				kdvOraniText: `%${this.kdvOrani}`,
				kdvBedel: e => {
					if (this.kdv == null)
						this.kdvHesapla(e);
					return this.kdv;
				},
				toplamIskontoBedel(e) {
					return this.toplamIskontoBedel
				},
				iskOranlariText(e) {
					const {iskOranListe} = this;
					if ($.isEmptyObject(iskOranListe))
						return ``;
					return '%' +
						((iskOranListe || [])
								.map(val => val.toLocaleString())
							.join(`+`))
				},
				ozelKampanyaOranlariText(e) {
					const {ozelKamOranListe} = this;
					if ($.isEmptyObject(ozelKamOranListe))
						return ``;
					return '%' +
						((ozelKamOranListe || [])
								.map(val => val.toLocaleString())
							.join(`+`))
				}
			})
		}
	}
})()
