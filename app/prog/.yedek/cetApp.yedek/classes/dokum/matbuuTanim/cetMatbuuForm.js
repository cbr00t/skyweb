(function() {
	window.CETMatbuuForm = class extends window.CObject {
		/* örnek:
				CETMatbuuForm.fromTip({ tip: 'Fatura' })
		*/
		constructor(e) {
			e = e || {};
			super(e);

			let sahalarDuzenlenmis = e => {
				const {digermi} = e;
				let tip2Sahalar = {};
				for (let tip in e.tip2Sahalar) {
					const sahalarOrTanim = e.tip2Sahalar[tip];
					let sahaSinif = e.sahaSinif || CETMatbuuSaha.sahaSinifFor(tip);
					if (sahaSinif) {
						const _sahalar = digermi
									? $.isArray(sahalarOrTanim) ? sahalarOrTanim : [sahalarOrTanim]
									: sahalarOrTanim;
						let sahalar = [];
						for (const key in _sahalar) {
							let saha = _sahalar[key];
							if (saha && $.isPlainObject(saha)) {
								/*if (sahaSinif.aciklamami && saha.pos.x && !saha.pos.y)
									sahaSinif = CETMatbuuSaha_OtoAciklama;*/
								saha = new sahaSinif(saha);
							}
							sahalar.push(saha);
						}

						if (e.tekilmi) {
							tip2Sahalar[tip] = sahalar[0];
						}
						else {
							let attr2Saha = asDict(sahalar, (saha, ind) => {
								return { key: saha.attr || ind, value: saha }
							});
							tip2Sahalar[tip] = attr2Saha;
						}
					}
				}
				return tip2Sahalar;
			};

			$.extend(this, {
				tip: e.Tip || e.tip,
				dipPos: CPoint.fromText(e.DipPos == null ? e.dipPos : e.dipPos),
				normalSahalar: sahalarDuzenlenmis({ tip2Sahalar: e.NormalSahalar || e.normalSahalar }),
				digerSahalar: sahalarDuzenlenmis({ tip2Sahalar: e.DigerSahalar || e.digerSahalar, sahaSinif: CETMatbuuSaha_Diger, tekilmi: true, digermi: true })
			});

			const formBilgi = e.FormBilgi || e.formBilgi;
			this.formBilgi = !formBilgi || $.isPlainObject(formBilgi)
								? new CETMatbuuFormBilgi(formBilgi || e)
								: formBilgi;
		}

		static async fromTip(e) {
			e = e || {};
			let matbuuForm = typeof e == 'object' ? e.matbuuForm = $.isFunction(e.matbuuForm) ? e.matbuuForm.call(this, e) : (e.matbuuForm || {}).run ? e.matbuuForm.run(this, e) : e.matbuuForm : null;
			const fis = typeof e == 'object' ? e.fis = $.isFunction(e.fis) ? e.fis.call(this, e) : (e.fis || {}).run ? e.fis.run(this, e) : e.fis : null;
			if (!matbuuForm) {
				const matbuuFormYapilari = e.matbuuFormYapilari || (await sky.app.getMatbuuFormYapilari({ fis: fis }));
				if (!$.isEmptyObject(matbuuFormYapilari)) {
					const tip = typeof e == 'object' ? e.tip || e.matbuuFormTip : e;
					matbuuForm = await matbuuFormYapilari.tip2MatbuuForm[tip];
					matbuuForm = await this.matbuuFormDuzenlenmis({ tip: tip, fis: fis, matbuuForm: matbuuForm, matbuuFormYapilari: matbuuFormYapilari });
				}
			}

			return matbuuForm;
		}

		async yazdir(e) {
			e.matbuuForm = this;
			const {dokumcu} = e;
			const fis = e.fis = $.isFunction(e.fis) ? e.fis.call(this, e) : (e.fis || {}).run ? e.fis.run(this, e) : e.fis;

			if (!await this.class.matbuuFormDuzenleRuntime({ tip: this.tip, fis: fis, matbuuForm: this, dokumcu: dokumcu }))
				return false;

			const {formBilgi} = this;
			e.gecerliSahaYapilari = this.getGecerliSahaYapilari(e);
			const bedelSaha = e.bedelSaha = (formBilgi.bedelSaha || this.bedelSahaBul(e));
			$.extend(e, {
				bedelEtiketUzunluk: formBilgi.bedelEtiketUzunluk || 12,
				bedelVeriUzunluk: formBilgi.bedelVeriUzunluk || (bedelSaha || {}).genislik || 13
			});
			await this.yeniSayfaOlustur(e);
			await this.yazdir_otomatikSahalar(e);
		}

		async yeniSayfaOlustur(e) {
			const {dokumcu} = e;
			let sayfa = dokumcu.sayfaEkle({ matbuuForm: this });
			
			const {fis, gecerliSahaYapilari} = e;
			let sahalar = gecerliSahaYapilari.normal;
			for (let attr in sahalar) {
				const saha = sahalar[attr];
				attr = saha.attr || attr;
				let value = await fis.dokumSahaDegeri($.extend({}, e, { attr: attr }));
				value = await saha.getConvertedValue($.extend({}, e, { value: value, fis: fis }));
				value = await this.getConvertedValue({ tip: 'tekil', attr: attr, value: value });
				await sayfa.yazdir({ pos: saha.pos, genislik: saha.genislik, value: value });
			}

			sahalar = gecerliSahaYapilari.aciklama;
			for (const text in sahalar) {
				const saha = sahalar[text];
				
				const srDict = {};
				const expListe = await Utils.getExpressions($.extend({}, e, { text: text }));
				if (!$.isEmptyObject(expListe)) {
					for (let i in expListe) {
						const exp = expListe[i];
						if (exp) {
							let value = await fis.dokumSahaDegeri($.extend({}, e, { attr: exp }));
							value = await saha.getConvertedValue($.extend({}, e, { value: value, fis: fis }));
							value = await this.getConvertedValue({ tip: 'tekil', attr: exp, value: value });
							srDict[exp] = (value || '').toString().trimEnd();
						}
					}
				}

				let value = text;
				if (!$.isEmptyObject(srDict)) {
					for (const key in srDict) {
						value = value.replaceAll(`[${key}]`, srDict[key]);
						value = value.replaceAll(`#${key}#`, srDict[key]);
					}
				}
				value = await fis.dokumSahaDegeri($.extend({}, e, { attr: value })) || value;
				value = await saha.getConvertedValue($.extend({}, e, { value: value, fis: fis }));
				value = await this.getConvertedValue({ tip: 'aciklama', attr: value, value: value });
				await sayfa.yazdir({ pos: saha.pos, genislik: saha.genislik, value: value });
			}

			return e.sayfa = sayfa;
		}

		async yazdir_otomatikSahalar(e) {
			const {fis, gecerliSahaYapilari} = e;
			const {formBilgi} = this;
			const {sayfaBoyutlari, otoYBasiSonu, tekDetaySatirSayisi, nakilYapilirmi, kolonBaslikGosterilirmi} = formBilgi;
			let {sayfa} = e;
			
			let sahalar = gecerliSahaYapilari.detay;
			const detRelY2Sahalar = {};
			$.each(sahalar, (attr, saha) => {
				const y = Math.min((saha.pos.y || 0), tekDetaySatirSayisi) || 1;
				const dict = detRelY2Sahalar[y] = detRelY2Sahalar[y] || {};
				dict[saha.attr] = saha;
			});
			
			const otoSatirSayisi0 = otoYBasiSonu.sonu && otoYBasiSonu.sonu > 0 ? otoYBasiSonu.sonu - otoYBasiSonu.basi : null;
			let otoInd = -1, maxX = 0;
			if (kolonBaslikGosterilirmi) {
				for (let detRelY = 1; detRelY <= tekDetaySatirSayisi; detRelY++) {
					let y = otoYBasiSonu.basi + otoInd + detRelY;							// y = one-based
					const attr2Sahalar = detRelY2Sahalar[detRelY] || {};
					for (let attr in attr2Sahalar) {
						const saha = attr2Sahalar[attr];
						attr = saha.attr || attr;
						maxX = Math.max(saha.pos.x + saha.genislik, maxX) - 1;
						let value = await fis.getDokumBaslikDegeri($.extend({}, e, { attr: attr, saha: saha, fis: fis }));
						value = await saha.getConvertedKolonBaslikValue($.extend({}, e, { attr: attr, value: value, fis: fis }));
						value = await this.getConvertedValue({ tip: 'kolonBaslik', attr: attr, saha: saha, value: value, fis: fis });
							// 'value' dizi gelmez varsayılıyor ...
						await sayfa.yazdir({ pos: { x: saha.pos.x, y: y }, genislik: saha.genislik, value: value });
					}
				}
				otoInd += Math.max(tekDetaySatirSayisi - 1, 1);
				
				// otoInd += tekDetaySatirSayisi;
				if (maxX) {
					const value = `-`.repeat(maxX);
					const genislik = value.length;
					let y = otoYBasiSonu.basi + otoInd + tekDetaySatirSayisi;				// y = one-based
					await sayfa.yazdir({ pos: { x: 1, y: y }, genislik: genislik, value: value });
				}
				otoInd += tekDetaySatirSayisi;
			}

			const detaylar = await fis.getDokumDetaylar(e) || [];
			for (const ind in detaylar) {
				const det = detaylar[ind];
					// bu detay ile bimiyor ve nakil gerekiyorsa 
				if (nakilYapilirmi && otoSatirSayisi0 && ((otoInd + tekDetaySatirSayisi + 1) > otoSatirSayisi0)) {
					otoInd++;
					let nakilText = 'Sonraki Sayfaya Nakil ....';
					let y = otoYBasiSonu.basi + otoInd + 1;									// y = one-based
					await sayfa.yazdir({ pos: { x: 10, y: y }, genislik: 50, value: nakilText });
					this.sayfaBitti({ sayfa: sayfa });
					sayfa = await this.yeniSayfaOlustur(e);
					otoInd = 0;		// ilk nakil satiri icin

					nakilText = 'Önceki Sayfadan Nakil ....';
					y = otoYBasiSonu.basi + otoInd + 1;										// y = one-based
					await sayfa.yazdir({ pos: { x: 10, y: y }, genislik: 50, value: nakilText });
				}

					// detay satırı kendi içinde birlikte olmalı  (KeepTogether)
				if (otoSatirSayisi0 && (otoInd + tekDetaySatirSayisi) > otoSatirSayisi0) {
					if (!nakilYapilirmi)
						break;
					// buraya gelmemli
					this.sayfaBitti({ sayfa: sayfa });
					sayfa = await this.yeniSayfaOlustur(e);
					otoInd = -1;
				}

				for (let detRelY = 1; detRelY <= tekDetaySatirSayisi; detRelY++) {
					let y = otoYBasiSonu.basi + otoInd + detRelY;							// y = one-based
					const attr2Sahalar = detRelY2Sahalar[detRelY] || {};
					for (let attr in attr2Sahalar) {
						const saha = attr2Sahalar[attr];
						attr = saha.attr || attr;
						let value = await det.dokumSahaDegeri($.extend({}, e, { attr: attr, saha: saha, fis: fis, detay: det, index: ind }));
						value = await saha.getConvertedValue($.extend({}, e, { attr: attr, value: value, fis: fis, detay: det, index: ind }));
						value = await this.getConvertedValue({ tip: 'detay', attr: attr, saha: saha, value: value, detay: det, index: ind });
							// value  dizi gelmez varsayılıyor ...
						await sayfa.yazdir({ pos: { x: saha.pos.x, y: y }, genislik: saha.genislik, value: value });
					}
				}
				otoInd += Math.max(tekDetaySatirSayisi, 1);
			}
			// otoInd--;
			if (otoSatirSayisi0 && (otoInd > otoSatirSayisi0 && !nakilYapilirmi))
				return;
			
			// otoInd = Math.max(otoInd, (otoYBasiSonu.sonu || 0));
			otoInd = (otoYBasiSonu.sonu && otoYBasiSonu.sonu > 0)
						? otoYBasiSonu.sonu
						: (otoYBasiSonu.basi || 0) + otoInd;

			sahalar = gecerliSahaYapilari.otomatik;
			for (let attr in sahalar) {
				const saha = sahalar[attr];
				attr = saha.attr || attr;
				let value = await fis.dokumSahaDegeri($.extend({}, e, { attr: attr, saha: saha, digerSahami: true }));
				if (!saha.class.aciklamami && (value == null || value == '' || value == ' '))
					continue;
				
				value = await saha.getConvertedValue($.extend({}, e, { value: value, fis: fis, digerSahami: true }));
				value = await this.getConvertedValue({ tip: 'detay', attr: attr, saha: saha, value: value, digerSahami: true });
				
				let textDizi = $.isArray(value) ? value : [value];
				let olasiOtoInd = otoInd + textDizi.length - 1 - 3;		// -2 ==> sığmama durumunda 2 satıra kadar tolerans göster , nakil yapıp yeni sayfa açma
				if (otoSatirSayisi0 && sayfaBoyutlari.y && olasiOtoInd > sayfaBoyutlari.y) {
					if (nakilYapilirmi) {
						this.sayfaBitti({ sayfa: sayfa });
						sayfa = await this.yeniSayfaOlustur(e);
						otoInd = -1;
					}
				}
				for (const ind in textDizi) {
						// çoklu satır için sayfa dışına çıkma önlemi
					let text = textDizi[ind];
					otoInd++;
					if (otoSatirSayisi0 && sayfaBoyutlari.y && olasiOtoInd > sayfaBoyutlari.y) {
						if (!nakilYapilirmi)
							break;
						// buraya gelmemeli
						this.sayfaBitti({ sayfa: sayfa });
						sayfa = await this.yeniSayfaOlustur(e);
						otoInd = 0;
					}

					let x = saha.pos.x;
					let y = otoInd;
					let {genislik} = saha;
					if (attr == 'Dip') {
						const ozelDipPos = this.dipPos || CPoint.empty;
						const {bedelSaha} = e;
						x = ozelDipPos.x || (bedelSaha ? Math.max(bedelSaha.pos.x - e.bedelEtiketUzunluk - (bedelSaha.genislik || 18) + 5, 1) : 1) || 1;
						y = ozelDipPos.y || y;
						genislik = text.length;
					}
					
					await sayfa.yazdir({ pos: { x: x, y: y }, genislik: genislik, value: text });
				}
			}

			this.sayfaBitti({ sayfa: sayfa });
		}

		sayfaBitti(e) {
			const sayfa = e.sayfa;
			if (!sayfa.sinir) {
				for (let i = 0; i < 5; i++)
					sayfa.satirlar.push(new CETDokumSatir());
			}
			/*if (sayfa.sinir) {
				while (sayfa.satirlar.length < sinir)
					sayfa.satirlar.push(new CETDokumSatir());
			}*/
		}

		getGecerliSahaYapilari(e) {
			const {dipYazdirilirmi} = this.formBilgi;
			// const dipYazdirilirmi = true;
			let result = { normal: {}, aciklama: {}, otomatik: {}, detay: {} };
			const block = e => {
				const {sahalar, sabitKey} = e;
				for (let attr in sahalar) {
					const saha = sahalar[attr];
					attr = saha.attr || attr;
					if ((attr == 'Dip' && dipYazdirilirmi) || saha.yazdirilabilirmi) {
						const key = e.sabitKey || (saha.otomatikmi ? 'otomatik' : 'normal');
						let sahaYapi = (result[key] = result[key] || {});
						sahaYapi[attr] = saha;
					}
				}
			};
			
			const normalSahalar = this.normalSahalar;
			block({ sahalar: normalSahalar.Tekil });
			block({ sahalar: normalSahalar.Detay, sabitKey: 'detay' });
			block({ sahalar: normalSahalar.TekilOzel });
			block({ sahalar: normalSahalar.Aciklama, sabitKey: 'aciklama' });
			block({ sahalar: this.digerSahalar });

			return result;
		}

		bedelSahaBul(e) {
			const bedelSahaAttrSet = asSet(['bedel', 'brutBedel', 'netBedel']);
			const sahaYapilari = e.gecerliSahaYapilari;
			let bedelSaha = null;
			for (const tip in sahaYapilari) {
				const attr2Saha = sahaYapilari[tip];
				for (let attr in attr2Saha) {
					const saha = attr2Saha[attr];
					if (saha)
						attr = saha.attr || attr;
					if (bedelSahaAttrSet[attr]) {
						bedelSaha = attr2Saha[attr];
						break;
					}
				}
				if (bedelSaha)
					break;
			}

			return bedelSaha;
		}

		getConvertedValue(e) {
			const {tip} = e;
			let {value} = e;
			/*if (tip == 'aciklama') {
			}*/

			if ($.isEmptyObject(value))
				value = null;
			
			return value;
		}


		static async matbuuFormDuzenlenmis(e) {
			const {app} = sky;
			const {tip2MatbuuFormDuzenleyiciler} = app;
			const {tip, matbuuFormYapilari} = e;
			const fisSinif = (e.fis || {}).class;
			
			let ozelForm;
			switch (tip) {
				case 'e-Islem-Ozel':
					ozelForm = await (fisSinif || CETFaturaFis).getOzelForm_eIslem(e);
					break;
			}

			let {matbuuForm} = e;
			if (ozelForm)
				matbuuForm = e.matbuuForm = ozelForm;

			if (matbuuForm) {
				matbuuForm = await $.isFunction(matbuuForm) ? matbuuForm.call(this, _e) :
										matbuuForm.run ? matbuuForm.run(_e) :
										matbuuForm;
			}
			
			const matbuuFormDuzenleyiciler = tip2MatbuuFormDuzenleyiciler ? tip2MatbuuFormDuzenleyiciler[tip] : null;
			if (!$.isEmptyObject(tip2MatbuuFormDuzenleyiciler)) {
				const _e = { tip: tip, fis: fis, matbuuForm: matbuuForm, matbuuFormYapilari: matbuuFormYapilari };
				for (const i in matbuuFormDuzenleyiciler) {
					let matbuuFormDuzenleyici = matbuuFormDuzenleyiciler[i];
					if (matbuuFormDuzenleyici && typeof matbuuFormDuzenleyici == 'string')
						matbuuFormDuzenleyici = matbuuFormDuzenleyiciler[i] = eval(matbuuFormDuzenleyici);
					
					const result = await $.isFunction(matbuuFormDuzenleyici) ? matbuuFormDuzenleyici.call(this, _e) :
												matbuuFormDuzenleyici.run ? matbuuFormDuzenleyici.run(_e) :
												matbuuFormDuzenleyici;
					if (result != null)
						matbuuForm = result;
				}
			}

			return matbuuForm;
		}

		static async matbuuFormDuzenleRuntime(e) {
			const {app} = sky;
			const {tip2MatbuuFormDuzenleyiciler_runtime} = app;
			const {tip, dokumcu, fis, matbuuForm, matbuuFormYapilari} = e;
			const fisSinif = (fis || {}).class;

			let result = true;
			const _e = { tip: tip, fis: fis, matbuuForm: matbuuForm, matbuuFormYapilari: matbuuFormYapilari, dokumcu: dokumcu, userData: null };
			switch (tip) {
				case 'e-Islem-Ozel':
					result = await (fisSinif || CETFaturaFis).matbuuFormDuzenleRuntime_eIslem(_e);
					break;
			}
			_e.lastResult = result;

			const matbuuFormDuzenleyiciler_runtime = tip2MatbuuFormDuzenleyiciler_runtime ? tip2MatbuuFormDuzenleyiciler_runtime[tip] : null;
			if (!$.isEmptyObject(tip2MatbuuFormDuzenleyiciler_runtime)) {
				e.tip2MatbuuFormDuzenleyiciler_runtime = tip2MatbuuFormDuzenleyiciler_runtime;
				for (const i in matbuuFormDuzenleyiciler_runtime) {
					let matbuuFormDuzenleyici = matbuuFormDuzenleyiciler_runtime[i];
					if (matbuuFormDuzenleyici && typeof matbuuFormDuzenleyici == 'string')
						matbuuFormDuzenleyici = matbuuFormDuzenleyiciler_runtime[i] = eval(matbuuFormDuzenleyici);
					
					const _result = await $.isFunction(matbuuFormDuzenleyici) ? matbuuFormDuzenleyici.call(this, _e) :
												matbuuFormDuzenleyici.run ? matbuuFormDuzenleyici.run(_e) :
												matbuuFormDuzenleyici;
					if (_result != null)
						result = _result && result;
				}
			}

			return result;
		}
	}
})()
