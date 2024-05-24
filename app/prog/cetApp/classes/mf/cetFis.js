(function() {
	window.CETFis = class extends window.MQDetayli {
		constructor(e) {
			e = e || {};
			super(e);
			
			const _now = now();
			$.extend(this, {
				id: e.id || e.rowid,
				kayitZamani: Utils.asReverseDateTimeString(e.kayitZamani || e.kayitzamani || _now),
				erisimZamani: Utils.asReverseDateTimeString(e.erisimZamani || e.erisimzamani || _now),
				tarih: e.tarih || today(),
				seri: (e.seri == 'undefined' || e.seri == 'UNDEFINED') ? '' : (e.seri || '').trimEnd(),
				fisNo: parseInt(e.fisNo || e.no) || 0,
				aciklama: e.aciklama == null ? null : e.aciklama.trimEnd()
			});
			if (this.class.ozelIsaretKullanilirmi)
				this.ozelIsaret = e.ozelIsaret == null ? (asBool(e.yildizlimi) ? '*' : '') : e.ozelIsaret || '';

			// this.numaratorOlustur(e);
		}

		static get tableAlias() { return 'fis' }
		
		/*static get idSaha() { return 'rowid' }*/
		static get numaratorTip() { return null }
		get numaratorTip() { return this.class.numaratorTip }
		static get adimTipi() { return this.numaratorTip }
		static get fiiliCikismi() { return false }
		static get tarihKontrolYapilirmi() { return true }
		static get fisNoKontrolYapilirmi() { return true }
		static get dipIskBedelKullanilirmi() { return false }
		static get iptalDesteklenirmi() { return true }
		static get raporDesteklenirmi() { return true }
		static get silindiGonderildiDesteklermi() { return true }
		static get degismediDesteklenirmi() { return true }
		static get altDetayKullanilirmi() { return false }
		static get altDetayGosterilirmi() { return false }
		static get riskKontrolEdilirmi() { return false }
		static get bakiyeRiskEtkilenirmi() { return false }
		static get promosyonKullanilirmi() { return false }

		get sonucBedel() { return 0 }
		get hesaplanmisStokMiktarBilgileri() { return {} }
		get hesaplanmisSonStokBilgileri() { return {} }
		get hesaplanmisBakiyeArtisi() { return 0 }
		get hesaplanmisRiskArtisi() { return 0 }
		get hesaplanmisTakipBorcArtisi() { return 0 }
		get ihracatmi() { return false }
		get ihracKayitlimi() { return false }

		static renkFor(e) {
			e = e || {};
			const {tip} = e;
			let renk = null;
			if (tip) {
				const renkYapi = sky.app.tip2Renk[tip];
				if (renkYapi) {
					switch (tip) {
						case 'fisTipi': renk = renkYapi[this.fisTipi || '']; break;
						case 'pifTipi': renk = renkYapi[this.pifTipi || '']; break;
						case 'almSat': renk = renkYapi[this.almSat || '']; break;
						case 'iade': renk = renkYapi[this.iade || '']; break;
						case 'ayrimTipi': renk = renkYapi[e.ayrimTipi]; break;
					}
				}
				if (typeof renk == 'object')
					renk = null;
			}
			return renk;
		}

		renkFor(e) {
			e = e || {};
			return this.class.renkFor({ tip: e.tip, ayrimTipi: this.ayrimTipi });
		}
		
		static fisSinifFor(e) {
			e = e || {};
			const rec = e.rec || e;
			if (rec) {
				const fisTipi = rec.fistipi || rec.fisTipi || rec.adimtipi || rec.adimTipi,
					  pifTipi = rec.piftipi || rec.pifTipi,
					  alimmi = (rec.almsat || rec.almSat) == 'A',
					  iademi = rec.iade == 'I';
				
				/*switch (fisTipi) {
					case 'U':
						return CETUgramaFis;
				}*/

				let fisSinif = fisTipi ? sky.app.adimTipi2FisSinif[fisTipi] : null;
				if (fisSinif) {
					if (fisSinif.fisSinifDuzenlenmis)
						fisSinif = fisSinif.fisSinifDuzenlenmis(e);
					return fisSinif;
				}

				switch (pifTipi) {
					case 'F':
						return alimmi
									? (iademi ? CETAlimIadeFaturaFis : CETAlimFaturaFis)
									: (iademi ? CETSatisIadeFaturaFis : CETSatisFaturaFis);
					case 'I':
						return alimmi
									? (iademi ? CETAlimIadeIrsaliyeFis : CETAlimIrsaliyeFis)
									: (iademi ? CETSatisIadeIrsaliyeFis : CETSatisIrsaliyeFis);
					case 'S':
						return alimmi
									? (iademi ? null : CETAlimSiparisFis)
									: (iademi ? null : CETSatisSiparisFis);
				}
			}
		}

		static fisSinifDuzenlenmis(e) {
			return this
		}

		static async fromRec(e) {
			e = e || {};
			const rec = e.rec || e;
			let fisSinif = e.fisSinif || this.fisSinifFor(e);
			if (!fisSinif)
				return null;
			
			const idSaha = e.idSaha || this.idSaha;
			const _rec = e.rec || {};
			const id = e.id || _rec.id || (idSaha ? _rec[idSaha] : null) || _rec.kaysayac || _rec.sayac;
			
			let _e = $.extend({}, e, { id: id });
			delete _e.rec;
			let fis = new fisSinif(_e);
			if (!await fis.yukle({ islem: _e.islem }))
				return null;

			return fis;
		}

		getTumAltDetaylar(e) {
			return this.detaylar
		}

		async numaratorOlustur(e) {
			/*if (this.gecicimi)
				return null;*/
			const {numaratorTip} = this;
			if (!numaratorTip)
				return null;
			
			let num = this.numarator = new CETNumarator({
				tip: numaratorTip,
				seri: this.seri || null,
				ozelIsaret: this.ozelIsaret == null ? null : (this.ozelIsaret || '')
			});
			await num.yukle();

			return num;
		}
		
		gerekirseDipHesapla(e) {
		}
		
		dipHesapla(e) {
		}

		dipOlustur(e) {
		}

		async kaydetOncesiKontrol(e) {
			const detaylar = this.getTumAltDetaylar(e);
			if ($.isEmptyObject(detaylar)) {
				throw {
					isError: true,
					rc: 'bosFis',
					errorText: `Belge içeriği <b>boş</b> olarak kaydedilemez`
				}
			}
			
			await this.gerekirseDipHesapla();
			await super.kaydetOncesiKontrol(e);

			await this.sonucBedelKontrol(e);
		}

		async kaydetSonrasiIslemler(e) {
			e = e || {};
			await super.kaydetSonrasiIslemler(e);

			if (this.class.bakiyeRiskEtkilenirmi)
				await this.bakiyeRiskDuzenle(e)
		}

		async silmeSonrasiIslemler(e) {
			await super.silmeSonrasiIslemler(e);
			
			if (this.class.bakiyeRiskEtkilenirmi)
				await this.bakiyeRiskDuzenle(e)
		}

		keyHostVars(e) {
			e = e || {};
			this.seri = (this.seri == 'undefined' || this.seri == 'UNDEFINED') ? '' : (this.seri || '');
			let hv = super.keyHostVars();
			$.extend(hv, {
				fistipi: this.class.adimTipi,
				seri: this.seri || '',
				fisno: parseInt(this.fisNo) || 0
			});

			return hv;
		}
		
		hostVars(e) {
			e = e || {};

			const _now = now();
			this.erisimZamani = _now;
			
			const hv = super.hostVars();
			$.extend(hv, {
				/*piftipi: this.class.pifTipi,
				almsat: this.class.almSat,
				iade: this.class.iade,*/
				kayitzamani: Utils.asReverseDateTimeString(this.kayitZamani || _now),
				erisimzamani: Utils.asReverseDateTimeString(this.erisimZamani || _now),
				ozelIsaret: this.class.ozelIsaretKullanilirmi ? (this.ozelIsaret || '') : '',
				tarih: Utils.asReverseDateString(this.tarih) || '',
				fisaciklama: this.aciklama,
				detaykayitsayisi: this.detaylar.length
			});

			return hv;
		}

		async setValues(e) {
			e = e || {};
			await super.setValues(e);

			const {rec} = e;
			if (rec.tarih)
				this.tarih = asDate(rec.tarih);
			$.extend(this, {
				kayitZamani: asDate(rec.kayitzamani) || null,
				erisimZamani: asDate(rec.erisimzamani) || null,
				seri: (rec.seri == 'undefined' || rec.seri == 'UNDEFINED') ? '' : (rec.seri || ''),
				fisNo: asInteger(rec.fisno) || 0,
				aciklama: rec.fisaciklama || ''
				// detaykayitsayisi burada olmaz
			});
			if (this.class.ozelIsaretKullanilirmi)
				this.ozelIsaret = rec.ozelisaret == null ? (asBool(rec.yildizlimi) ? '*' : '') : (rec.ozelisaret || '');
		}

		async yeniTanimOncesiIslemler(e) {
			e = e || {};
			await super.yeniTanimOncesiIslemler(e);

			if (this.class.riskKontrolEdilirmi)
				await this.riskKontrolIslemi($.extend({}, e, { sifirDahil: true }));
		}

		async onKontrol(e) {
			if (this.class.tarihKontrolYapilirmi && !this.tarih)
				return this.error_onKontrol(`(Tarih) belirtilmelidir`, 'bos_tarih');
			// if (!(this.numarator || this.fisNo))
			if (this.class.fisNoKontrolYapilirmi && !this.fisNo)
				return this.error_onKontrol(`(Fiş No) belirtilmelidir`, 'bos_fisNo');
			
			return await super.onKontrol(e);
		}

		async kaydetOncesiKontrol(e) {
			await super.kaydetOncesiKontrol(e);
			
			await this.kaydetOncesiKontrol_ara(e);			
			
			this._promise_getRiskCariKod = this.getRiskCariKod(e);			// cache to instance
			
			if (this.class.riskKontrolEdilirmi)
				await this.riskKontrolIslemi(e);
		}

		async kaydetOncesiKontrol_ara(e) {
		}

		async riskKontrolIslemi(e) {
			/* riskKontrolDurum:
					#('' 'Devam Et' #islemYapmami);
					#('*' 'Uyar ve Devam Et' #sadeceUyarmi);
					#('G' 'Devam için Onay iste' #onayIstemi);
					#('S' 'Sevkiyatı Durdur ' #sevkiyatDurdurmu);
			*/
			const riskKontrolDurum = sky.app.riskKontrolDurum;
			if (!riskKontrolDurum)
				return;
			
			if (riskKontrolDurum == 'S') {
				await this.riskKontrol(e);
			}
			else {
				try {
					await this.riskKontrol(e);
				}
				catch (ex) {
					if (ex.rc == 'riskAsildi')
						await this.riskAsildiMesajiGoster({ result: ex })
					else
						throw ex;
				}
			}
		}

		async riskAsildiMesajiGoster(e) {
			const riskKontrolDurum = sky.app.riskKontrolDurum;
			if (riskKontrolDurum == 'S')
				return false;

			const ex = e.result;
			if (riskKontrolDurum == '*') {
				displayMessage(ex.errorText, `Risk Aşıldı!`);
				return true;
			}

			if (riskKontrolDurum == 'G') {
				return await new $.Deferred(p => {
					displayMessage(
						`${ex.errorText}<p style="color: #555;">Devam edilsin mi?</p>`,
						`Risk Aşıldı!`, true,
						{
							EVET: (dlgUI, btnUI) => {
								dlgUI.jqxWindow('destroy');
								p.resolve(true)
							},
							HAYIR: (dlgUI, btnUI) => {
								dlgUI.jqxWindow('destroy')
								p.resolve(false)
							}
						})
				})
			}

			return true;
		}

		async riskKontrol(e) {
			e = e || {};
			const {dbMgr} = this;
			const islem = e.islem || (e.sender || {}).islem;
			const eskiFis = (islem == 'degistir') ? e.eskiFis : (islem == 'sil') ? this : null;
			const yeniFis = (islem == 'sil') ? null : this;

			const riskCariKod = await (this._promise_getRiskCariKod || this.getRiskCariKod(e));
			let stm = new MQStm({
				sent: new MQSent({
					from: 'mst_Cari car',
					where: { degerAta: riskCariKod, saha: `car.kod` },
					sahalar: [`car.riskLimiti`, `car.riskli`, `car.takipBorcLimiti`, `car.takipBorc`]
				})
			});
			let rec = await dbMgr.tekilExecuteSelect({ query: stm });
			if (rec) {
				const riskLimiti = asFloat(rec.riskLimiti) || 0;
				if (riskLimiti) {
					const riskli = asFloat(rec.riskli) || 0;
					let artis = 0;
					if (eskiFis)
						artis -= eskiFis.hesaplanmisRiskArtisi;
					if (yeniFis)
						artis += yeniFis.hesaplanmisRiskArtisi;
					
					const kalacakRisk = bedel(riskLimiti - (riskli + artis));
					if (asBool(e.sifirDahil) ? kalacakRisk <= 0 : kalacakRisk < 0) {
						throw {
							isError: true, rc: 'riskAsildi',
							errorText: `<span class="bold darkred">${bedelStr(kalacakRisk)} TL</span> Risk aşıldı!`
						}
					}
				}

				const takipBorcLimiti = asFloat(rec.takipBorcLimiti) || 0;
				if (takipBorcLimiti) {
					const takipBorc = asFloat(rec.takipBorc) || 0;
					let artis = 0;
					if (eskiFis)
						artis -= eskiFis.hesaplanmisTakipBorcArtisi;
					if (yeniFis)
						artis += yeniFis.hesaplanmisTakipBorcArtisi;
					
					const kalacakTakipBorc = bedel(takipBorcLimiti - (takipBorc + artis));
					if (asBool(e.sifirDahil) ? kalacakTakipBorc <= 0 : kalacakTakipBorc < 0) {
						throw {
							isError: true, rc: 'takipBorcAsildi',
							errorText: `<span class="bold darkred">${bedelStr(kalacakTakipBorc)} TL</span> Takip Borç aşıldı!`
						}
					}
				}
			}
		}

		async bakiyeRiskDuzenle(e) {
			e = e || {};
			const {dbMgr} = this;
			const islem = e.islem || (e.sender || {}).islem;
			const eskiFis = (islem == 'degistir') ? e.eskiFis : (islem == 'sil') ? this : null;
			const yeniFis = (islem == 'sil') ? null : this;
			
			let bakiye = 0, risk = 0, takipBorc = 0;
			if (eskiFis) {
				bakiye -= eskiFis.hesaplanmisBakiyeArtisi;
				risk -= eskiFis.hesaplanmisRiskArtisi;
				takipBorc -= eskiFis.hesaplanmisTakipBorcArtisi;
			}
			if (yeniFis) {
				bakiye += yeniFis.hesaplanmisBakiyeArtisi;
				risk += yeniFis.hesaplanmisRiskArtisi;
				takipBorc += yeniFis.hesaplanmisTakipBorcArtisi;
			}

			const riskCariKod = await (this._promise_getRiskCariKod || this.getRiskCariKod(e));
			delete this._promise_getRiskCariKod;

			if (bakiye || risk || takipBorc) {
				let upd = new MQIliskiliUpdate({
					from: 'mst_Cari',
					where: {
						degerAta: riskCariKod, saha: 'kod'
					},
					set: {
						liste: [
							`bakiye = ROUND(bakiye + ?, 2)`,
							`riskli = ROUND(riskli + ?, 2)`,
							`takipBorc = ROUND(takipBorc + ?, 2)`
						],
						params: [bakiye, risk, takipBorc]
					},
				});
				await dbMgr.executeSql({ tx: e.tx, query: upd });
			}
		}

		sonucBedelKontrol(e) {
			const sonucBedel = this.sonucBedel;
			if (sonucBedel == null)
				return;
			
			sonucBedel = bedel(sonucBedel);
			if (sonucBedel < 0) {
				throw {
					isError: true,
					rc: 'belgeBedelNegatif',
					errorText: `Belge Bedeli <u>Negatif(-)</u> olamaz: (<b>${bedelStr(sonucBedel)} TL</b>)`
				}
			}
		}

		async getDokumDegeriDict(e) {
			return $.extend(await super.getDokumDegeriDict(e) || {}, {
				yildizlimi: !!this.ozelIsaret,
				yildizlimiText: this.ozelIsaret ? 'Düz' : '',
				fisSeri: this.seri,
				no: this.fisNo,
				fisNox: (
					`${this.seri}${this.noYil || ''}${(this.fisNo || 0).toString().padStart(9, '0')}`
				)
			})
		}
	}
})();
