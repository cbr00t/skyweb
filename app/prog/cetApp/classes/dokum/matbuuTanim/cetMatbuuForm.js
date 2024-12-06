(function() {
	window.CETMatbuuForm = class extends window.CObject {			/* örnek: CETMatbuuForm.fromTip({ tip: 'Fatura' }) */
		constructor(e) {
			e = e || {}; super(e);
			let sahalarDuzenlenmis = e => {
				const {digermi} = e, tip2Sahalar = {};
				for (let [tip, sahalarOrTanim] of Object.entries(e.tip2Sahalar)) {
					let sahaSinif = e.sahaSinif || CETMatbuuSaha.sahaSinifFor(tip);
					if (sahaSinif) {
						const _sahalar = digermi ? $.isArray(sahalarOrTanim) ? sahalarOrTanim : [sahalarOrTanim] : sahalarOrTanim;
						let sahalar = []; for (let saha of Object.values(_sahalar)) { if (saha && $.isPlainObject(saha)) { saha = new sahaSinif(saha) } sahalar.push(saha) }
						if (e.tekilmi) { tip2Sahalar[tip] = sahalar[0] } else { let attr2Saha = asDict(sahalar, (saha, ind) => ({ key: saha.attr || ind, value: saha })); tip2Sahalar[tip] = attr2Saha }
					}
				}
				return tip2Sahalar
			};
			$.extend(this, {
				tip: e.Tip || e.tip, dipPos: CPoint.fromText(e.DipPos == null ? e.dipPos : e.dipPos),
				normalSahalar: sahalarDuzenlenmis({ tip2Sahalar: e.NormalSahalar || e.normalSahalar }),
				digerSahalar: sahalarDuzenlenmis({ tip2Sahalar: e.DigerSahalar || e.digerSahalar, sahaSinif: CETMatbuuSaha_Diger, tekilmi: true, digermi: true })
			});
			const formBilgi = e.FormBilgi || e.formBilgi;
			this.formBilgi = !formBilgi || $.isPlainObject(formBilgi) ? new CETMatbuuFormBilgi(formBilgi || e) : formBilgi
		}
		static async fromTip(e) {
			e = e || {}; let matbuuForm = typeof e == 'object' ? e.matbuuForm = $.isFunction(e.matbuuForm) ? e.matbuuForm.call(this, e) : (e.matbuuForm || {}).run ? e.matbuuForm.run(this, e) : e.matbuuForm : null;
			const fis = typeof e == 'object' ? e.fis = $.isFunction(e.fis) ? e.fis.call(this, e) : (e.fis || {}).run ? e.fis.run(this, e) : e.fis : null;
			if (!matbuuForm) {
				const matbuuFormYapilari = e.matbuuFormYapilari || (await sky.app.getMatbuuFormYapilari({ fis })); const tip = typeof e == 'object' ? e.tip || e.matbuuFormTip : e;
				matbuuForm = (await matbuuFormYapilari?.tip2MatbuuForm || [])[tip]; matbuuForm = await this.matbuuFormDuzenlenmis({ tip, fis, matbuuForm, matbuuFormYapilari })
			}
			return matbuuForm
		}
		async yazdir(e) {
			e.matbuuForm = this; const {dokumcu} = e, {tip} = this, fis = e.fis = $.isFunction(e.fis) ? e.fis.call(this, e) : e.fis?.run ? e.fis.run(this, e) : e.fis;
			if (!await this.class.matbuuFormDuzenleRuntime({ tip, fis, matbuuForm: this, dokumcu })) { return false }
			const {formBilgi} = this; e.gecerliSahaYapilari = this.getGecerliSahaYapilari(e); const bedelSaha = e.bedelSaha = (formBilgi.bedelSaha || this.bedelSahaBul(e));
			$.extend(e, { bedelEtiketUzunluk: formBilgi.bedelEtiketUzunluk || 21, bedelVeriUzunluk: formBilgi.bedelVeriUzunluk || bedelSaha?.genislik || 13});
			await this.yeniSayfaOlustur(e); await this.yazdir_otomatikSahalar(e)
		}
		async yeniSayfaOlustur(e) {
			const {dokumcu} = e; let sayfa = dokumcu.sayfaEkle({ matbuuForm: this }); const {fis, gecerliSahaYapilari} = e; let sahalar = gecerliSahaYapilari.normal;
			for (let attr in sahalar) {
				const saha = sahalar[attr]; attr = saha.attr || attr;
				let value = await fis.dokumSahaDegeri($.extend({}, e, { attr }));
				value = await saha.getConvertedValue($.extend({}, e, { value, fis })); value = await this.getConvertedValue({ tip: 'tekil', attr, value });
				await sayfa.yazdir({ pos: saha.pos, genislik: saha.genislik, value })
			}
			sahalar = gecerliSahaYapilari.aciklama;
			for (const [text, saha] of Object.entries(sahalar)) {
				const {kosul, isaret} = saha; if (fis) {
					const fisSinif = fis.class;
					if (kosul && !(kosul == 'N' ? !fisSinif.iademi : kosul == 'I' ? fisSinif.iademi : false)) { continue }
					if (isaret && !(isaret == 'N' ? !fis.yildizlimi : isaret == 'I' ? fis.yildizlimi : false)) { continue }
				}
				const srDict = {}, expListe = await Utils.getExpressions($.extend({}, e, { text }));
				if (!$.isEmptyObject(expListe)) {
					for (const exp of expListe) {
						if (exp) {
							let value = await fis.dokumSahaDegeri($.extend({}, e, { attr: exp }));
							value = await saha.getConvertedValue($.extend({}, e, { value, fis })); value = await this.getConvertedValue({ tip: 'tekil', attr: exp, value });
							srDict[exp] = (value || '').toString().trimEnd()
						}
					}
				}
				let value = text; if (!$.isEmptyObject(srDict)) {
					for (const key in srDict) { value = value.replaceAll(`[${key}]`, srDict[key]).replaceAll(`#${key}#`, srDict[key]) } }
				value = await fis.dokumSahaDegeri($.extend({}, e, { attr: value })) || value;
				value = await saha.getConvertedValue($.extend({}, e, { value, fis })); value = await this.getConvertedValue({ tip: 'aciklama', attr: value, value });
				await sayfa.yazdir({ pos: saha.pos, genislik: saha.genislik, value });
			}
			return e.sayfa = sayfa
		}
		async yazdir_otomatikSahalar(e) {
			const {fis, gecerliSahaYapilari} = e, {formBilgi} = this; let {sayfa} = e, {dokumZPLmi: zplmi} = sky.app;
			const {sayfaBoyutlari, otoYBasiSonu, tekDetaySatirSayisi, nakilYapilirmi, kolonBaslikGosterilirmi} = formBilgi;
			let sahalar = gecerliSahaYapilari.detay; const detRelY2Sahalar = {};
			for (const [attr, saha] of Object.entries(sahalar)) {
				const y = Math.min((saha.pos.y || 0), tekDetaySatirSayisi) || 1;
				const dict = detRelY2Sahalar[y] = detRelY2Sahalar[y] || {}; dict[saha.attr] = saha
			}
			const otoSatirSayisi0 = otoYBasiSonu.sonu && otoYBasiSonu.sonu > 0 ? otoYBasiSonu.sonu - otoYBasiSonu.basi : null; let otoInd = -1, maxX = 0;
			if (kolonBaslikGosterilirmi) {
				for (let detRelY = 1; detRelY <= tekDetaySatirSayisi; detRelY++) {
					let y = otoYBasiSonu.basi + otoInd + detRelY;														/* y = one-based */
					const attr2Sahalar = detRelY2Sahalar[detRelY] || {};
					for (let attr in attr2Sahalar) {
						const saha = attr2Sahalar[attr]; attr = saha.attr || attr;
						maxX = Math.max(saha.pos.x + saha.genislik, maxX) - 1; let value = await fis.getDokumBaslikDegeri($.extend({}, e, { attr, saha, fis }));
						value = await saha.getConvertedKolonBaslikValue($.extend({}, e, { attr, value, fis })); value = await this.getConvertedValue({ tip: 'kolonBaslik', attr, saha, value, fis });
						await sayfa.yazdir({ pos: { x: saha.pos.x, y: y }, genislik: saha.genislik, value });			/* 'value' dizi gelmez varsayılıyor ... */
					}
				}
				otoInd += Math.max(tekDetaySatirSayisi - 1, 1);
				// otoInd += tekDetaySatirSayisi;
				if (maxX) {
					const value = `-`.repeat(maxX), genislik = value.length;
					let y = otoYBasiSonu.basi + otoInd + tekDetaySatirSayisi;											/* y = one-based */
					await sayfa.yazdir({ pos: { x: 1, y: y }, genislik, value });
				}
				otoInd += tekDetaySatirSayisi;
			}
			const detaylar = await fis.getDokumDetaylar(e) || []; for (const ind in detaylar) {
				const det = detaylar[ind];
				if (nakilYapilirmi && otoSatirSayisi0 && ((otoInd + tekDetaySatirSayisi + 1) > otoSatirSayisi0)) {		/* bu detay ile bimiyor ve nakil gerekiyorsa  */
					otoInd++; let nakilText = 'Sonraki Sayfaya Nakil ....';
					let y = otoYBasiSonu.basi + otoInd + 1;																/* y = one-based */
					await sayfa.yazdir({ pos: { x: 10, y: y }, genislik: 50, value: nakilText });
					this.sayfaBitti({ sayfa }); sayfa = await this.yeniSayfaOlustur(e); otoInd = 0;						/* ilk nakil satiri icin */
					nakilText = 'Önceki Sayfadan Nakil ....'; y = otoYBasiSonu.basi + otoInd + 1;						/* y = one-based */
					await sayfa.yazdir({ pos: { x: 10, y: y }, genislik: 50, value: nakilText });
				}
				if (otoSatirSayisi0 && (otoInd + tekDetaySatirSayisi) > otoSatirSayisi0) {								/* detay satırı kendi içinde birlikte olmalı  (KeepTogether) */
					if (!nakilYapilirmi) { break }
					/* buraya gelmemli */ this.sayfaBitti({ sayfa }); sayfa = await this.yeniSayfaOlustur(e); otoInd = -1;
				}
				for (let detRelY = 1; detRelY <= tekDetaySatirSayisi; detRelY++) {
					let y = otoYBasiSonu.basi + otoInd + detRelY;														/* y = one-based */
					const attr2Sahalar = detRelY2Sahalar[detRelY] || {};
					for (let [attr, saha] of Object.entries(attr2Sahalar)) {
						attr = saha.attr || attr; let value = await det.dokumSahaDegeri($.extend({}, e, { attr, saha, fis, detay: det, index: ind }));
						value = await saha.getConvertedValue($.extend({}, e, { attr, value, fis, detay: det, index: ind }));
						value = await this.getConvertedValue({ tip: 'detay', attr, saha, value, detay: det, index: ind });
						await sayfa.yazdir({ pos: { x: saha.pos.x, y: y }, genislik: saha.genislik, value });			/* value  dizi gelmez varsayılıyor ... */
					}
				}
				otoInd += Math.max(tekDetaySatirSayisi, 1);
			}
			if (otoSatirSayisi0 && (otoInd > otoSatirSayisi0 && !nakilYapilirmi)) { return }
			otoInd = (otoYBasiSonu.sonu && otoYBasiSonu.sonu > 0) ? otoYBasiSonu.sonu : (otoYBasiSonu.basi || 0) + otoInd;
			sahalar = gecerliSahaYapilari.otomatik; for (let [attr, saha] of Object.entries(sahalar)) {
				attr = saha.attr || attr; let value = await fis.dokumSahaDegeri($.extend({}, e, { attr, saha, digerSahami: true }));
				if (!saha.class.aciklamami && (value == null || value == '' || value == ' ')) { continue }
				value = await saha.getConvertedValue($.extend({}, e, { value, fis, digerSahami: true }));
				value = await this.getConvertedValue({ tip: 'detay', attr, saha, value, digerSahami: true });
				let textDizi = $.isArray(value) ? value : [value];
				let olasiOtoInd = otoInd + textDizi.length - 1 - 3;														/* -2 ==> sığmama durumunda 2 satıra kadar tolerans göster, nakil yapıp yeni sayfa açma */
				if (otoSatirSayisi0 && sayfaBoyutlari.y && olasiOtoInd > sayfaBoyutlari.y) {
					if (nakilYapilirmi) { this.sayfaBitti({ sayfa }); sayfa = await this.yeniSayfaOlustur(e); otoInd = -1 } }
				for (const ind in textDizi) {
					let text = textDizi[ind]; otoInd++;																	/* çoklu satır için sayfa dışına çıkma önlemi */
					if (otoSatirSayisi0 && sayfaBoyutlari.y && olasiOtoInd > sayfaBoyutlari.y) {
						if (!nakilYapilirmi) { break }
						/* buraya gelmemeli */ this.sayfaBitti({ sayfa }); sayfa = await this.yeniSayfaOlustur(e); otoInd = 0
					}
					let x = saha.pos.x, y = otoInd, {genislik} = saha; if (attr == 'Dip') {
						const ozelDipPos = this.dipPos || CPoint.empty, {bedelSaha} = e;
						x = ozelDipPos.x || (bedelSaha ? Math.max(bedelSaha.pos.x - e.bedelEtiketUzunluk - (bedelSaha.genislik || 15) + 8, 1) : 1) || 1;
						/*if (zplmi) { x += 12 }*/
						y = ozelDipPos.y || y; genislik = text.length
					}
					await sayfa.yazdir({ pos: { x, y }, genislik, value: text })
				}
			}
			this.sayfaBitti({ sayfa })
		}
		sayfaBitti(e) {
			const sayfa = e.sayfa; if (!sayfa.sinir) { for (let i = 0; i < 5; i++) { sayfa.satirlar.push(new CETDokumSatir()) } }
			/*if (sayfa.sinir) { while (sayfa.satirlar.length < sinir) sayfa.satirlar.push(new CETDokumSatir()) }*/
		}
		getGecerliSahaYapilari(e) {
			const {dipYazdirilirmi} = this.formBilgi; let result = { normal: {}, aciklama: {}, otomatik: {}, detay: {} };
			const block = e => {
				const {sahalar, sabitKey} = e; if ($.isEmptyObject(sahalar)) { return }
				for (let [attr, saha] of Object.entries(sahalar)) {
					attr = saha.attr || attr; if ((attr == 'Dip' && dipYazdirilirmi) || saha.yazdirilabilirmi) {
						const key = e.sabitKey || (saha.otomatikmi ? 'otomatik' : 'normal');
						let sahaYapi = (result[key] = result[key] || {}); sahaYapi[attr] = saha
					}
				}
			};
			const {normalSahalar} = this; block({ sahalar: normalSahalar.Tekil }); block({ sahalar: normalSahalar.Detay, sabitKey: 'detay' });
			block({ sahalar: normalSahalar.TekilOzel }); block({ sahalar: normalSahalar.Aciklama, sabitKey: 'aciklama' }); block({ sahalar: this.digerSahalar });
			return result
		}
		bedelSahaBul(e) {
			const bedelSahaAttrSet = asSet(['bedel', 'brutBedel', 'netBedel']), sahaYapilari = e.gecerliSahaYapilari; let bedelSaha = null;
			for (const [tip, attr2Saha] of Object.entries(sahaYapilari)) {
				for (let attr in attr2Saha) {
					const saha = attr2Saha[attr]; if (saha) { attr = saha.attr || attr }
					if (bedelSahaAttrSet[attr]) { bedelSaha = attr2Saha[attr]; break }
				}
				if (bedelSaha) { break }
			}
			return bedelSaha
		}
		getConvertedValue(e) { const {tip} = e; let {value} = e; return $.isEmptyObject(value) ? null : value }
		static async matbuuFormDuzenlenmis(e) {
			const {app} = sky, {tip2MatbuuFormDuzenleyiciler} = app, {tip, matbuuFormYapilari, fis} = e, fisSinif = fis?.class; let ozelForm;
			if (tip == 'e-Islem-Ozel') { ozelForm = await (fisSinif ?? CETFaturaFis).getOzelForm_eIslem(e) }
			let {matbuuForm} = e; if (ozelForm) { matbuuForm = e.matbuuForm = ozelForm }
			if (matbuuForm) matbuuForm = await $.isFunction(matbuuForm) ? matbuuForm.call(this, _e) : matbuuForm.run ? matbuuForm.run(_e) : matbuuForm
			const matbuuFormDuzenleyiciler = tip2MatbuuFormDuzenleyiciler ? tip2MatbuuFormDuzenleyiciler[tip] : null; if (!$.isEmptyObject(matbuuFormDuzenleyiciler)) {
				$.extend(e, { tip2MatbuuFormDuzenleyiciler }); const _e = { tip, fis, matbuuForm, matbuuFormYapilari };
				for (const i in matbuuFormDuzenleyiciler) {
					let matbuuFormDuzenleyici = matbuuFormDuzenleyiciler[i];
					if (matbuuFormDuzenleyici && typeof matbuuFormDuzenleyici == 'string') { matbuuFormDuzenleyici = matbuuFormDuzenleyiciler[i] = eval(matbuuFormDuzenleyici) }
					const result = await $.isFunction(matbuuFormDuzenleyici) ? matbuuFormDuzenleyici.call(this, _e) : matbuuFormDuzenleyici.run ? matbuuFormDuzenleyici.run(_e) : matbuuFormDuzenleyici;
					if (result != null) { matbuuForm = result }
				}
			}
			return matbuuForm
		}
		static async matbuuFormDuzenleRuntime(e) {
			const {app} = sky, {tip2MatbuuFormDuzenleyiciler_runtime} = app;
			const {tip, dokumcu, fis, matbuuForm, matbuuFormYapilari} = e, fisSinif = fis?.class;
			let result = true; const _e = { tip, fis, matbuuForm, matbuuFormYapilari, dokumcu, userData: null };
			if (tip == 'e-Islem-Ozel') { result = await (fisSinif || CETFaturaFis).matbuuFormDuzenleRuntime_eIslem(_e) } _e.lastResult = result;
			const matbuuFormDuzenleyiciler_runtime = tip2MatbuuFormDuzenleyiciler_runtime ? tip2MatbuuFormDuzenleyiciler_runtime[tip] : null;
			if (!$.isEmptyObject(matbuuFormDuzenleyiciler_runtime)) {
				$.extend(_e, { tip2MatbuuFormDuzenleyiciler_runtime }); for (const i in matbuuFormDuzenleyiciler_runtime) {
					let matbuuFormDuzenleyici = matbuuFormDuzenleyiciler_runtime[i];
					if (matbuuFormDuzenleyici && typeof matbuuFormDuzenleyici == 'string') { matbuuFormDuzenleyici = matbuuFormDuzenleyiciler_runtime[i] = eval(matbuuFormDuzenleyici) }
					const _result = await $.isFunction(matbuuFormDuzenleyici) ? matbuuFormDuzenleyici.call(this, _e) : matbuuFormDuzenleyici.run ? matbuuFormDuzenleyici.run(_e) : matbuuFormDuzenleyici;
					if (_result != null) { result = _result && result }
				}
			}
			return result
		}
	}
})()
