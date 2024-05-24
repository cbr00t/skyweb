(function() {
	window.SkyHatIzlemeApp = class extends window.SkyMESApp {
		static get appName() { return 'skyHatIzlemeApp' }
		get appText() { return `VIO Hat İzleme` }
		static get wsURLBasePostfix() { return `/hatIzleme` }
		static get hatIzlememi() { return true }
		constructor(e) {
			e = e || {}; super(e);
			$.extend(this, {
				id2Hat: {}, id2Tezgah: {},
				totalRecords: 0, hat2Tezgahlar: {}, tezgah2Hat: {},
				isToggled: false, tezgahId2LEDDurumBelirlePromise: {}
			})
		}
		async ilkIslemler(e) {
			const head = $(`head`);
			const meta_viewPort = head.find(`meta[name=viewport]`); if (meta_viewPort?.length) meta_viewPort.remove()
			$(`<meta name="viewport" content="width=device-width, initial-scale=.62, minimum-scale=.2, maximum-scale=1.5, user-scalable=yes" />`).appendTo(head);
			await super.ilkIslemler(e)
		}
		async preInitLayout(e) {
			e = e || {}; await super.preInitLayout(e);
			const layout = e.layout || this.layout;
			/*layout.on('touchend', evt => this.onResize({ partName: this.partName, event: evt }));*/
			const {templatesOrtak, disForm} = this, ekParts = this.ekParts = layout.find(`#ekParts`);
			let topluIslemMenu = ekParts.find(`#topluIslemMenu`); const topluIslemMenuItems = this.topluIslemMenuItems = topluIslemMenu.find('ul > li');
			topluIslemMenu = this.topluIslemMenu = topluIslemMenu.jqxMenu({ theme, width: 350, mode: 'popup', autoOpenPopup: false, enableHover: true, animationShowDuration: 500, animationHideDuration: 500 });
			topluIslemMenuItems.on('click', evt => { const elm = $(evt.currentTarget); this.topluIslemMenuItemTiklandi({ event: evt, sender: elm, id: elm.prop('id') }) });
			/*const btnBekleyenIsEmirleri = this.btnBekleyenIsEmirleri = ekParts.find(`#btnBekleyenIsEmirleri`).jqxButton({ theme });
			btnBekleyenIsEmirleri.on('click', evt => { const elm = $(evt.currentTarget); this.bekleyenIsEmirleriIstendi({ event: evt, sender: elm }) });*/
			const btnTopluIslem = this.btnTopluIslem = ekParts.find(`#btnTopluIslem`).jqxButton({ theme });
			btnTopluIslem.on('click', evt => { const elm = $(evt.currentTarget); this.topluIslemMenuIstendi({ event: evt, sender: elm }) });
			const btnFiltre = this.btnFiltre = ekParts.find(`#btnFiltre`).jqxButton({ theme });
			btnFiltre.on('click', evt => this.filtreIstendi({ event: evt }));
			const btnGeri = this.btnGeri = ekParts.find(`#btnGeri`).jqxButton({ theme });
			btnGeri.on('click', evt => this.geriIstendi({ event: evt }));
			const filtreForm = this.filtreForm = ekParts.find(`#filtreForm`), txtFiltre = this.txtFiltre = filtreForm.find(`#txtFiltre`);
			txtFiltre.on('keyup', evt =>  this.filtreTusBasildi($.extend(e, {}, { event: evt })));
			const filtreWidget = this.filtreWidget = filtreForm.jqxPopover({
				theme, arrowOffsetValue: -100, position: 'bottom', title: `Hızlı Bul`, showCloseButton: true, showArrow: false,
				selector: btnFiltre, offset: { left: btnFiltre.offset().x + btnFiltre.width(), top: -10 }
			});
			let popupMenu = ekParts.find(`#menu`); const popupMenuItems = this.popupMenuItems = popupMenu.find('ul > li');
			popupMenu = this.popupMenu = popupMenu.jqxMenu({ theme, width: 350, mode: 'popup', autoOpenPopup: false, enableHover: true, animationShowDuration: 500, animationHideDuration: 500 });
			popupMenuItems.on('click', evt => {
				const elm = $(evt.currentTarget), elmTezgah = this.aktifTezgahElm;
				this.tezgahMenuItemTiklandi({ event: evt, sender: elm, elmTezgah, tezgahId: elmTezgah.data('id'), id: elm.prop('id') })
			});
			const divTezgahSecUyari = this.divTezgahSecUyari = ekParts.find(`#tezgahSecUyari`);
			const tezgahSecUyari_btnVazgec = divTezgahSecUyari.find(`#btnVazgec`).jqxButton({ theme });
			tezgahSecUyari_btnVazgec.on('click', evt => this.tezgahSec_vazgecIstendi($.extend(e, {}, { event: evt })));
			this.hatListeParent = disForm.find(`#hatListeParent`)
		}
		async tazele(e) { e = e || {}; if (!e.sync || !e.noReset) this.tezgahResetSelection(); return await super.tazele(e) }
		async tazeleDevam(e) {
			e = e || {}; await super.tazeleDevam(e);
			let {promise_layoutUpdate, filtreHatId, filtreTezgahId} = this;
			if (promise_layoutUpdate) { try { await promise_layoutUpdate } catch (ex) { } }
			const lastTotalRecords = this.totalRecords; let recs;
			try { recs = await this.wsTezgahBilgileri({ sync: e.sync, hatIdListe: filtreHatId || '', tezgahIdListe: filtreTezgahId || '' }) }
			catch (ex) { defFailBlockBasit(ex) }
			const {isToggled} = this;
			if (recs) {
				recs = recs.rows || recs || [];
				const result = this.getFilteredRecs({ recs }); recs = result.recs;
				this.btnGeri[result.hasFilter || isToggled ? 'removeClass' : 'addClass'](`jqx-hidden`)
			}
			if (recs) {
				$.extend(this, { totalRecords: 0, id2Hat: {}, id2Tezgah: {}, hat2Tezgahlar: {}, tezgah2Hat: {} });
				const {id2Hat, id2Tezgah, hat2Tezgahlar, tezgah2Hat} = this; let tezgahBilgi;
				for (const rec of recs) {
					const {hatID, id, isID} = rec;
					rec.isSaymaInd = rec.isSaymaInd || 0; rec.isSaymaSayisi = rec.isSaymaSayisi || (isID ? 1 : 0);
					tezgahBilgi = id2Tezgah[id];
					if (tezgahBilgi) { if (isID) tezgahBilgi.isListe.push(rec) }					/* aynı tezgah için sonraki iş kaydı */
					else {							// tezgah için orjBilgi
						tezgahBilgi = id2Hat[hatID] = id2Tezgah[id] = rec;
						const isListe = rec.isListe = []; if (isID) isListe.push(rec)
						const tezgahlar = hat2Tezgahlar[hatID] = hat2Tezgahlar[hatID] || {}; tezgahlar[id] = rec;
						tezgah2Hat[id] = hatID; this.totalRecords++;
					}
					tezgahBilgi.saymaInd = (tezgahBilgi?.saymaInd || 0) + rec.isSaymaInd;
					tezgahBilgi.saymaSayisi = (tezgahBilgi?.saymaSayisi || 0) + rec.isSaymaSayisi
				}
			}
			const {hatListeParent} = this, degistimi = (this.totalRecords != null && this.totalRecords != lastTotalRecords) || (this.totalRecords && !hatListeParent.children().length);
			promise_layoutUpdate = this.promise_layoutUpdate = new $.Deferred(async p => {
				if (degistimi) {
					try { await this.clearSubLayout(); await this.createSubLayout() }
					catch (ex) { p.reject(ex); delete this.promise_layoutUpdate }
				}
				setTimeout(async () => {
					try { await this.updateSubLayout(e) } catch (ex) { p.reject(ex) } finally { p.resolve(); delete this.promise_layoutUpdate }
					/*const {activeWndPart} = this; if (activeWndPart && activeWndPart.tazele) activeWndPart.tazele();*/
				}, 50)
			});
			if (!e.sync) this.topluTezgahLEDDurumBelirleIstendi() /* abortLastOperation(); */
			this.disableTimers = true; try { await promise_layoutUpdate } finally { this.disableTimers = false }
		}
		clearSubLayout(e) {
			const {hatListeParent} = this;
			/*const divGrafikListe = hatListeParent.find(`.hat.item .tezgah.item #grafikParent .grafik`);
			if (divGrafikListe.length) { divGrafikListe.jqxKnob('destroy'); divGrafikListe.remove(); }*/
			hatListeParent.find('.item').remove()
		}
		createSubLayout(e) {
			const {templatesOrtak, id2Hat, hat2Tezgahlar, hatListeParent, totalRecords} = this; let i = 0;
			for (const hatID in hat2Tezgahlar) {
				if (i >= totalRecords) break
				const hat = id2Hat[hatID], hatParent = $(document.createDocumentFragment());
				const divHat = templatesOrtak.contents(`.hat.item`).clone(true); divHat.attr(`data-id`, hatID);
				if (totalRecords == 1) divHat.addClass(`fill`)
				const btnZamanEtuduBaslat = divHat.find(`#header #btnZamanEtuduBaslat`).jqxButton({ theme });
				btnZamanEtuduBaslat.on('click', evt => {
					const elm = $(evt.currentTarget), elmHat = elm.parents('.hat.item');
					this.hat_zamanEtuduBaslatIstendi({ event: evt, sender: elm, elmHat, id: elmHat.data('id') })
				});
				const btnZamanEtuduKapat = divHat.find(`#header #btnZamanEtuduKapat`).jqxButton({ theme });
				btnZamanEtuduKapat.on('click', evt => {
					const elm = $(evt.currentTarget), elmHat = elm.parents('.hat.item');
					this.hat_topluZamanEtuduKapatIstendi({ event: evt, sender: elm, elmHat, id: elmHat.data('id') })
				});
				const btnIsBitir = divHat.find(`#header #btnIsBitir`).jqxButton({ theme });
				btnIsBitir.on('click', evt => {
					const elm = $(evt.currentTarget), elmHat = elm.parents('.hat.item');
					this.hat_isBitirIstendi({ event: evt, sender: elm, elmHat, id: elmHat.data('id') })
				});
				const btnBekleyenIsEmirleri = divHat.find(`#header #btnBekleyenIsEmirleri`).jqxButton({ theme });
				btnBekleyenIsEmirleri.on('click', evt => {
					const elm = $(evt.currentTarget), elmHat = elm.parents('.hat.item');
					this.bekleyenIsEmirleriIstendi({ event: evt, sender: elm, elmHat,  id: elmHat.data('id') })
				});
				const btnBekleyenIsler = divHat.find(`#header #btnBekleyenIsler`).jqxButton({ theme });
				btnBekleyenIsler.on('click', evt => {
					const elm = $(evt.currentTarget), elmHat = elm.parents('.hat.item');
					this.bekleyenIslerIstendi({ event: evt, sender: elm, elmHat, id: elmHat.data('id') })
				});
				const tezgahlar = hat2Tezgahlar[hatID], tezgahParent = divHat.find(`#tezgahListeParent`);
				for (let j in tezgahlar) {
					if (i >= totalRecords) break
					const tezgah = tezgahlar[j]; /* const tezgahParent = $(document.createDocumentFragment()); */
					const divTezgah = templatesOrtak.contents(`.tezgah.item`).clone(true); divTezgah.attr(`data-id`, tezgah.id);
					if (totalRecords == 1) divTezgah.addClass(`fill`)
					divTezgah.appendTo(tezgahParent);
					divTezgah.on('click', evt => {
						if (evt.target.tagName.toUpperCase() == 'BUTTON') return
						const elm = $(evt.currentTarget), elmTezgah = elm;
						this.tezgahTiklandi({ event: evt, sender: elm, elmTezgah, id: elm.data('id') })
					});
					divTezgah.on('contextmenu', evt => {
						const elm = $(evt.currentTarget), elmTezgah = elm;
						this.tezgahSagTiklandi({ event: evt, sender: elm, elmTezgah, id: elm.data('id') })
					});
					const islemTuslari = divTezgah.find(`#durumParent #islemTuslari`); islemTuslari.find('button').jqxButton({ theme });
					islemTuslari.find(`#btnMenu`).on('click', evt => {
						const elm = $(evt.currentTarget), elmTezgah = elm.parents(`.tezgah.item`);
						this.tezgahMenuIstendi({ event: evt, sender: elm, elmTezgah, id: elmTezgah.data('id') })
					});
					islemTuslari.find(`#btnIzle`).on('click', evt => {
						const elm = $(evt.currentTarget), elmTezgah = elm.parents(`.tezgah.item`);
						this.tezgahIzleIstendi({ event: evt, sender: elm, elmTezgah, id: elmTezgah.data('id') })
					});
					islemTuslari.find(`#btnToggle`).on('click', evt => {
						const elm = $(evt.currentTarget), elmTezgah = elm.parents(`.tezgah.item`);
						this.tezgahToggleIstendi({ event: evt, sender: elm, elmTezgah, id: elmTezgah.data('id') })
					});
					const btnPersonelAta = divTezgah.find(`#btnPersonelAta`);
					if (btnPersonelAta.length) {
						btnPersonelAta.jqxButton({ theme }); btnPersonelAta.off('click');
						btnPersonelAta.on('click', evt => {
							const elm = $(evt.currentTarget), elmTezgah = elm.parents(`.tezgah.item`);
							this.tezgahPersonelAtaIstendi({ event: evt, sender: elm, elmTezgah, tezgahId: elmTezgah.data('id') })
						})
					}
					const ekBilgiParent = divTezgah.find('#ekBilgiParent'); ekBilgiParent.off('click');
					ekBilgiParent.on('click', evt => {
						const elm = $(evt.currentTarget), elmTezgah = elm.parents(`.tezgah.item`);
						this.tezgahEkBilgiParentTiklandi({ event: evt, sender: elm, elmTezgah, tezgahId: elmTezgah.data('id') })
					});
					i++
				}
				if (divHat.children().length) divHat.appendTo(hatParent);
				if (hatParent.children().length) hatParent.appendTo(hatListeParent)
			}
			const {statuHaricSet, id2Tezgah} = this, divTezgahListe = hatListeParent.find(`.hat.item .tezgah.item`); let counter = 0;
			for (let i = 0; i < divTezgahListe.length; i++) {
				const divTezgah = divTezgahListe.eq(i), id = divTezgah.data('id');
				const tezgah = id2Tezgah[id]; if (!tezgah) continue
				const durumKod = tezgah.durumKod || ''; if (statuHaricSet[durumKod] /*|| durumKod == 'AT'*/) continue
				counter++; if (counter > 5) break
			}
		}
		updateSubLayout(e) {
			const {templatesOrtak, hat2Tezgahlar, id2Hat, hatListeParent, statuHaricSet} = this; let i = 0;
			for (const hatID in hat2Tezgahlar) {
				const hat = id2Hat[hatID], hatParent = hatListeParent.find(`.hat.item:eq(${i})`);
				let hatText = `<b>${hatID}</b>`; if (hat.hatAciklama) hatText += `-${hat.hatAciklama}`;
				hatParent.find(`#header #text`).html(hatText);
				const tezgahListeParent = hatParent.find(`#tezgahListeParent`), tezgahlar = hat2Tezgahlar[hatID]; let j = 0;
				for (const id in tezgahlar) {
					const rec = tezgahlar[id], divTezgah = tezgahListeParent.find(`.tezgah.item:eq(${j})`), subContent = divTezgah.find(`#subContent`);
					const {
						aciklama, ip, perKod, perIsim, emirMiktar, isIskMiktar, isNetMiktar,
						onceUretMiktar, aktifUretMiktar, onceCevrimSayisi, aktifCevrimSayisi,
						saymaInd, saymaSayisi, siradakiIsSayi, isListe, sonDurTS, sonDurSureSn,
						isToplamOlasiSureSn, isToplamBrutSureSn, isToplamDuraksamaSureSn
					} = rec;
					const kaGoster = e => {
						const kod = (e.kod || '').toString().trim(), aciklama = (e.aciklama || '').toString().trim();
						const {selector} = e, parent = e.parent ?? subContent, elm = parent.find(selector);
						let text = aciklama || ''; if (kod) text = `<span class="kod">${kod.toString()}-</span><span class="aciklama">${text}</span>`;
						if (text) { elm.html(text); elm.parent().removeClass('basic-hidden') }
						else { elm.parent().addClass('basic-hidden') }
						return text
					};
					const miktarGoster = e => {
						const {parent, fra, selector, autoHide} = e, elm = parent.find(selector);
						let {value} = e; const orjValue = value;
						if (typeof value == 'number') value = toStringWithFra(value, fra == null ? 0 : fra)
						if (autoHide && !orjValue) { elm.parent().addClass('basic-hidden') }
						else { elm.html(value); elm.parent().removeClass('basic-hidden') }
						return value
					};
					const basitIntGoster = e => {
						const {parent, selector} = e, elm = parent.find(selector);
						let {value} = e; if (typeof value == 'number') value = asInteger(value).toLocaleString()
						if (value) { elm.html(value) } return value
					};
					const durumKod = rec.durumKod || ''; divTezgah.attr(`data-durum`, durumKod || '');
					let text = aciklama || ''; if (id) text = `<span class="kod">${id.toString()}-</span><span class="aciklama">${text}</span>`;
					text = `<span class="asil">${text}</span>`;
					if (ip) text += `<span id="ipParent" class="ekBilgi parent">(<span class="_etiket">ip: </span><span id="ipText">${ip}</span>)</span>`;
					subContent.find(`#tezgahText`).html(text);
					kaGoster({ kod: perKod, aciklama: perIsim, selector: `#perText` });
					const divIsListe = templatesOrtak.contents(`.isListe`).clone(true);
					for (let i = 0; i < isListe.length; i++) {
						i = asInteger(i); const is = isListe[i];
						const {
							emirTarih, emirNox, urunKod, urunAciklama, operNo, operAciklama,
							isSaymaTekilEnDusukSure, isSaymaToplamEnDusukSure
						} = is;
						const isSaymaSayisi = is.isSaymaSayisi || 1, oemParent = templatesOrtak.contents(`.oemParent`).clone(true);
						kaGoster({ aciklama: `${i + 1}: `, selector: `#seq`, parent: oemParent });
						kaGoster({
							aciklama: (
								(emirTarih ? dateKisaString(asDate(emirTarih)) + ' ' : '') +
								'-' +
								(emirNox ? ' ' + emirNox : '')
							),
							selector: `#emirText`, parent: oemParent
						});
						kaGoster({ kod: urunKod, aciklama: urunAciklama, selector: `#urunText`, parent: oemParent });
						kaGoster({ kod: operNo, aciklama: operAciklama, selector: `#operText`, parent: oemParent });
						const sureParent = oemParent.find(`#sureParent`);
						if (isSaymaSayisi > 1 || isSaymaTekilEnDusukSure > 0 || isSaymaToplamEnDusukSure > 0) {
							basitIntGoster({ parent: sureParent, value: isSaymaSayisi, selector: `#saymaSayisi` });
							basitIntGoster({ parent: sureParent, value: isSaymaTekilEnDusukSure, selector: `#saymaArasiSure` });
							basitIntGoster({ parent: sureParent, value: isSaymaToplamEnDusukSure, selector: `#saymaSonSure` });
							/* basitIntGoster({ parent: sureParent, value: (isToplamBrutSureSn - isToplamDuraksamaSureSn), selector: `#saymaNetSure` }); */
							sureParent.removeClass(`basic-hidden`)
						}
						else { sureParent.addClass(`basic-hidden`) }
						oemParent.appendTo(divIsListe)
					}
					const divIsListeParent = subContent.find(`#isListeParent`); divIsListeParent.children().remove(); divIsListe.appendTo(divIsListeParent);
					divIsListe.attr('scrollamount', divIsListe.children().length > 2 ? 50 : 0);
					const miktarParent = subContent.find(`#miktarParent`);
					miktarGoster({ parent: miktarParent, value: emirMiktar, selector: `#emirMiktarText` });
					miktarGoster({ parent: miktarParent, value: onceUretMiktar, selector: `#onceUretMiktarText` });
					miktarGoster({ parent: miktarParent.find(`.aktifUretMiktarParent`), value: aktifUretMiktar, selector: `#aktifUretMiktarText`, autoHide: true });
					miktarGoster({ parent: miktarParent, value: isIskMiktar, selector: `#iskMiktarText` });
					miktarGoster({ parent: miktarParent, value: isNetMiktar, selector: `#netMiktarText` });
					const cevrimParent = subContent.find(`#cevrimParent`);
					miktarGoster({ parent: cevrimParent, value: onceCevrimSayisi, selector: `#onceCevrimSayisi` });
					miktarGoster({ parent: cevrimParent, value: aktifCevrimSayisi, selector: `#aktifCevrimSayisi` });
					if (onceCevrimSayisi || aktifCevrimSayisi) { cevrimParent.removeClass(`basic-hidden`) }
					else { cevrimParent.addClass(`basic-hidden`) }
					const saymaParent = subContent.find(`#saymaParent`);
					if (saymaSayisi && saymaSayisi > 1) {
						basitIntGoster({ parent: saymaParent, value: saymaInd, selector: `#saymaInd` });
						basitIntGoster({ parent: saymaParent, value: saymaSayisi, selector: `#saymaSayisi` });
						saymaParent.removeClass(`basic-hidden`)
					}
					else { saymaParent.addClass(`basic-hidden`) }
					const isBilgiParent = subContent.find(`#isBilgiParent`);
					miktarGoster({ parent: isBilgiParent, value: siradakiIsSayi, selector: `#siradakiIsSayiText`, autoHide: true });
					const ekBilgiParent = subContent.find(`#ekBilgiParent`), sonDurParent = ekBilgiParent.find(`#sonDurParent`);
					/*text = asDate(sonDurTS); if (text) sonDurParent.find(`#sonDurText`).html(dateTimeAsKisaString(text));*/
					if (durumKod == 'DR' && sonDurSureSn) {
						const sonDurSureDk = sonDurSureSn / 60;
						const localeOptions = { maximumFractionDigits: 2 };
						text = sonDurSureDk > 60
									? `${Math.round(sonDurSureDk / 60).toLocaleString(culture, localeOptions)} sa ${sonDurSureDk.toLocaleString(culture, localeOptions)} dk`
									: `${sonDurSureDk.toLocaleString(culture, localeOptions)} dk`;
						sonDurParent.find(`#sonDurText`).html(text);
						sonDurParent.removeClass('jqx-hidden basic-hidden');
						ekBilgiParent[sonDurSureDk > 1 ? 'addClass' : 'removeClass']('longer-1');
						ekBilgiParent[sonDurSureDk > 5 ? 'addClass' : 'removeClass']('longer-5');
						ekBilgiParent[sonDurSureDk > 10 ? 'addClass' : 'removeClass']('longer-10');
						ekBilgiParent[sonDurSureDk > 30 ? 'addClass' : 'removeClass']('longer-30');
						ekBilgiParent[sonDurSureDk > 60 ? 'addClass' : 'removeClass']('longer-60');
					}
					else { sonDurParent.addClass('basic-hidden') }
					let ekBilgiText = rec.ekBilgi || rec.ekBilgi || rec.ekBilgiText || '';
					const divEkBilgiText = ekBilgiParent.find('#ekBilgiText'); divEkBilgiText.html(ekBilgiText);
					divEkBilgiText[ekBilgiText ? 'removeClass' : 'addClass']('empty');
					ekBilgiParent.removeClass('jqx-hidden basic-hidden')
					const durNedenText = durumKod == 'DR' ? rec.durNedenAdi : null, durumParent = divTezgah.find(`#durumParent`);
					durumParent.find(`#durumText`).html(durNedenText || this.durumKod2Aciklama[durumKod] || '');
					const grafikParent = subContent.find(`#grafikParent`), divGrafikDegerHatali = subContent.find(`#grafikDegerHatali`), divGrafik = grafikParent.find(`.grafik`);
					setTimeout(e => {
						const {divTezgah, index, rec} = e; if (!divGrafik.length) return;
						if (statuHaricSet[durumKod] /*|| durumKod == 'AT'*/) { grafikParent.addClass(`basic-hidden`) }
						else {
							const getFillColor = e => {
								const {value} = e;
								if (value != null) {
									if (value >= 0 && value <= 100) {
										if (value <= 30) return '#D85000';
										else if (value <= 40) return '#D18B00'
										else if (value <= 50) return '#A58600'
										else if (value <= 60) return '#B2A503'
										else if (value <= 70) return '#718B00'
										else if (value <= 80) return '#749800'
										else if (value <= 90) return '#86AF03'
										else return '#79C400'
									}
									return '#f0b502'
								}
								return null
							}
							const grafikGoster = e => {
								const {selector, value} = e, elm = grafikParent.find(selector);
								if (elm.length) {
									if (value != null) {
										setTimeout(_e => {
											const {elm, value} = _e; elm.removeClass('jqx-hidden basic-hidden');
											const color = getFillColor(e),  degree = Math.max(Math.min(Math.round(value * 180 / 100) - 30, 180), 0);
											elm.css('--rotation', `${degree}deg`); elm.css('--color', color || '');
											const elmVal = elm.find(`.value`); elmVal.html(`${value}%`); elmVal.css('color', color || '');
											elmVal[value < 0 ? 'addClass' : 'removeClass']('lower');
											elmVal[value > 120 ? 'addClass' : 'removeClass']('higher');
											/*divGrafik.jqxKnob({
												theme, width: 40, height: 40, value, allowValueChangeOnClick: false, allowValueChangeOnDrag: false, allowValueChangeOnMouseWheel: false,
												min: 0, max: 100, startAngle: 150, endAngle: 390, snapToStep: false, rotation: 'clockwise',
												dial: { style: { fill: "#eee" }, innerRadius: '70%', outerRadius: '95%', startAngle: 0, endAngle: 360 },
												marks: {
													colorRemaining: '#888', colorProgress: '#583', type: 'line', offset: '90%', drawAboveProgressBar: true,
													thickness: 1, size: '5%', minorInterval: 25, majorSize: '10%', majorInterval: 50
												},
												progressBar: { size: '33%', offset: '55%', background: { fill: '#ccc' }, style: { fill: 'black', opacity: 1 } },
												pointer: { type: 'arrow', size: '55%', offset: '0%', thickness: 8, style: { fill: '#555', stroke: '#444' } }
											});*/
										}, 1, { elm, value });
									}
									else { /* elm.addClass('jqx-hidden basic-hidden') */ }
								}
							};
							/*if (true) rec.oee = (index % 15) * 30;*/
							let oee = rec.oee = isToplamOlasiSureSn ? Math.round((isToplamBrutSureSn - isToplamDuraksamaSureSn) * 100 / isToplamOlasiSureSn) : 0;
							if (oee == null) { grafikParent.addClass('basic-hidden') }
							else {
								grafikParent.removeClass('jqx-hidden basic-hidden');
								if (oee >= 0 && oee <= 110) { divGrafikDegerHatali.addClass('jqx-hidden'); grafikGoster({ selector: `#oee`, value: oee }) }
								else  { divGrafik.addClass('basic-hidden'); divGrafikDegerHatali.removeClass(`jqx-hidden`); grafikParent.addClass('basic-hidden') }
							}
							/*if (!oee || oee > 200) grafikParent.addClass('basic-hidden');
							else { grafikGoster({ selector: `#oee`, value: rec.oee }); grafikParent.removeClass('jqx-hidden basic-hidden') }*/
							const kalanIsGrafikParent = subContent.find('#kalanIsGrafikParent');
							const isGrafikOlustur = e => { const {index, is} = e  /* ?? */ }

							if ($.isEmptyObject(isListe)) { kalanIsGrafikParent.addClass('basic-hidden') }
							else {
								let isBitmekUzeremi = false; const oranSinir = 80, docFrg_kalanIsGrafikParent = $(document.createDocumentFragment());
								for (let i = 0; i < isListe.length; i++) {
									const is = isListe[i], {oemistenen, oemgerceklesen} = is; /*is.oemistenen = 10; is.oemgerceklesen = 5;*/
									if (oemistenen) {
										const oran = roundToFra(oemgerceklesen * 100 / oemistenen, 0); if (oran >= oranSinir) isBitmekUzeremi = true
										const divKalanIsGrafik = $(`<progress data-index="${i}" value="${oran}" min="0" max="100" high="${oranSinir}"><div class="label">%${oran}</div></progress>`);
										divKalanIsGrafik.appendTo(docFrg_kalanIsGrafikParent)
									}
								}
								divTezgah[isBitmekUzeremi ? 'addClass' : 'removeClass']('isBitmekUzere');
								kalanIsGrafikParent.children().remove();
								if (docFrg_kalanIsGrafikParent.children().length) { docFrg_kalanIsGrafikParent.appendTo(kalanIsGrafikParent); kalanIsGrafikParent.removeClass('jqx-hidden basic-hidden') }
								else { kalanIsGrafikParent.addClass('basic-hidden') }
							}
						}
					}, j * 10, { divTezgah, index: j, rec });
					j++
				}
				i++
			}
			/* this.tezgahResetSelection(e) */
		}
		getFilteredRecs(e) {
			const recs = typeof e == 'object' ? e.recs : e; if ($.isEmptyObject(recs)) return { hasFilter: false, orjRecs: recs, recs }
			const {filtreParts, filtreTezgahId, filtreHatId} = this, filtrePartsDolumu = !$.isEmptyObject(filtreParts);
			if (!(filtreTezgahId || filtreHatId || filtrePartsDolumu)) return { hasFilter: false, orjRecs: recs, recs }
			const newRecs = [];
			for (const rec of recs) {
				if (filtreTezgahId && rec.id != filtreTezgahId)  continue
				if (filtreHatId && rec.hatID != filtreHatId) continue
				if (filtrePartsDolumu) {
					let uygunmu = true;
					for (const part of filtreParts) {
						const id = (rec.id || '').toString(), kontrolDegerleriLower = [
							(rec.aciklama || '').toLocaleLowerCase(culture),
							(rec.perIsim || '').toLocaleLowerCase(culture),
							(rec.urunAciklama || '').toLocaleLowerCase(culture),
							(rec.operAciklama || '').toLocaleLowerCase(culture),
							(rec.hatID || ''),
							(rec.hatAciklama || '').toLocaleLowerCase(culture),
						]
						let _uygunmu = id == part;
						if (!_uygunmu) { for (const kontDeger of kontrolDegerleriLower) { if (kontDeger && kontDeger.includes(part)) { _uygunmu = true; break } } }
						if (!_uygunmu) { uygunmu = false; break }
					}
					if (!uygunmu) continue
				}
				newRecs.push(rec)
			}
			return { hasFilter: true, orjRecs: recs, recs: newRecs }
		}
		async wsTezgahBilgileri(e) {
			e = e || {}; e.sync = !!e.sync;
			lastAjaxObj = $.ajax({
				cache: false, timeout: e.sync ? this.ajaxInfiniteMS : undefined, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}tezgahBilgileri/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {}; return result
		}
		async wsTopluDuraksamaYap(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}topluDuraksamaYap/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {}; return result
		}
		async wsTopluZamanEtuduBaslat(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}topluZamanEtuduBaslat/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {}; return result
		}
		async wsTopluZamanEtuduKapat(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}topluZamanEtuduKapat/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {}; return result
		}
		async wsTopluIsBittiYap(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}topluIsBittiYap/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {}; return result
		}
		async wsTopluGerceklemeYap(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}topluGerceklemeYap/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {}; return result
		}
		async wsSiradakiIsler(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}siradakiIsler/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {}; return result
		}
		async wsSiraDuzenle(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}siraDuzenle/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {}; return result
		}
		async wsBekleyenIsler(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}bekleyenIsler/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {}; return result
		}
		async wsBekleyenIsEmirleri(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}bekleyenIsEmirleri/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {}; return result
		}
		async wsBekleyenOperasyonlar(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}bekleyenOperasyonlar/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {}; return result
			return result;
		}
		async wsIsAta(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}isAta/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {}; return result
		}
		async wsSirayaAl(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}sirayaAl/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {}; return result
		}
		async wsSiradanKaldir(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}siradanKaldir/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {}; return result
		}

		async wsBaskaTezgahaTasi(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}baskaTezgahaTasi/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {}; return result
		}
		async wsIsParcala(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}isParcala/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {}; return result
		}
		async wsCokluIsParcala(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}cokluIsParcala/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {}; return result
		}
		async wsBekleyenIs_devredisiYapKaldir(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}bekleyenIs_devredisiYapKaldir/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {}; return result
		}
		async wsYeniOperListeEkle(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}yeniOperListeEkle/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {}; return result
		}
		async wsSureDuzenle(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}sureDuzenle/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {}; return result
		}
		async wsGorevZamanEtuduDegistir(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}gorevZamanEtuduDegistir/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {}; return result
		}
		async wsGorevZamanEtudSureGuncelleVeKapat(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}gorevZamanEtudSureGuncelleVeKapat/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {}; return result
		}
		async wsGorevZamanEtuduVeriGetir(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}gorevZamanEtuduVeriGetir/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {}; return result
		}
		async wsBekleyenIs_yeniOperasyonlar(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}bekleyenIs_yeniOperasyonlar/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {}; return result
		}
		async wsGetLEDDurumAll(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}getLEDDurumAll/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {}; return result
		}
		async wsGetLEDDurum(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}getLEDDurum/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {}; return result
		}
		async wsSetLEDDurum(e) {
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}setLEDDurum/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {}; return result
		}
		topluIslemMenuIstendi(e) {
			const {sender, id} = e, popupMenu = this.topluIslemMenu;
			if (popupMenu?.length) {
				const senderLeft = sender.offset().left, senderTop = sender.offset().top;
				const senderWidth = sender.width(), senderHeight = sender.height();
				const popupMenuWidth = popupMenu.width(), popupMenuHeight = popupMenu.height()
				const pos = {
					left: ($(window).width() - senderLeft) < popupMenuWidth ? senderLeft - popupMenuWidth + senderWidth + 5 : senderLeft,
					top: senderTop + senderHeight
				};
				if (pos.top + popupMenuHeight + 3 >= $(window).height()) pos.top = senderTop - popupMenuHeight - 13
				popupMenu.jqxMenu('open', pos.left, pos.top)
			}
		}
		async topluIslemMenuItemTiklandi(e) {
			const {id} = e; switch (id) {
				/*case 'zamanEtuduBaslat': await this.wsTopluZamanEtuduBaslat(e); break*/
				case 'mola': case 'vardiyaDegisimi': await this.topluIslemMenu_duraksamaYap(e); break
				case 'isBitti': await this.topluIslemMenu_isBittiYap(e); break
				case 'gercekleme': await this.topluIslemMenu_gerceklemeYap(e); break
			}
		}
		async topluIslemMenu_duraksamaYap(e) {
			const {silent, id} = e;
			if (!silent) {
				await new $.Deferred(p => {
					const wnd = createJQXWindow(
						(
							`<p class="darkred"><b class="red">UYARI:</b> Tüm Makineler için <u class="bold">${id}</u> işlemi yapılacak</p>` +
							`<p>Devam edilsin mi?</p>`
						), `Toplu ${id} İşlemi yapılacak...`, { isModal: true, width: 450, height: 280, showCloseButton: true, showCollapseButton: false },
						{
							EVET: (dlgUI, btnUI) => { p.resolve(true); dlgUI.jqxWindow('destroy') },
							HAYIR: (dlgUI, btnUI) => { p.reject(false); dlgUI.jqxWindow('destroy') }
						}, 1
					);
					wnd.find(`.ui-dialog-button input[type=button][value=EVET]`)
							.css('background-color', 'red').css('color', 'whitesmoke').addClass(`bold`)
				})
			}
			let result = null;
			try { result = await this.wsTopluDuraksamaYap({ tip: id || '' }); if (!result || result.isError) throw result || { isError: true, rc: 'emptyResult' } }
			catch (ex) { (window.savedProcs?.hideProgress || hideProgress)(); defFailBlock(ex); throw ex }
			try { await this.gerekirseTazele() } catch (ex) { }
			return result
		}
		async topluIslemMenu_isBittiYap(e) {
			e = e || {}; const {silent} = e;
			if (!silent) {
				const IslemAdi = `İş Bitti`;
				await new $.Deferred(p => {
					const wnd = createJQXWindow(
						(
							`<p class="darkred"><b class="red">UYARI:</b> Tüm Makineler için <u class="bold">${IslemAdi}</u> işlemi yapılacak</p>` +
							`<p>Devam edilsin mi?</p>`
						), `Toplu ${IslemAdi} İşlemi yapılacak...`,
						{ isModal: true, width: 450, height: 280, showCloseButton: true, showCollapseButton: false },
						{
							EVET: (dlgUI, btnUI) => { p.resolve(true); dlgUI.jqxWindow('destroy') },
							HAYIR: (dlgUI, btnUI) => { p.reject(false); dlgUI.jqxWindow('destroy') }
						}, 1
					);
					wnd.find(`.ui-dialog-button input[type=button][value=EVET]`)
							.css('background-color', 'red').css('color', 'whitesmoke').addClass(`bold`)
				})
			}
			let result = null;
			try { result = await this.wsTopluIsBittiYap(); if (!result || result.isError) throw result || { isError: true, rc: 'emptyResult' } }
			catch (ex) { (window.savedProcs?.hideProgress || hideProgress)(); defFailBlock(ex); throw ex }
			try { await this.gerekirseTazele() } catch (ex) { }
			return result
		}
		async topluIslemMenu_gerceklemeYap(e) {
			const {silent, id} = e;
			if (!silent) {
				await new $.Deferred(p => {
					const wnd = createJQXWindow(
						(
							`<p class="darkred"><b class="red">UYARI:</b> Tüm Makineler için <u class="bold">${id}</u> işlemi yapılacak</p>` +
							`<p>Devam edilsin mi?</p>`
						), `Toplu ${id} İşlemi yapılacak...`,
						{ isModal: true, width: 450, height: 280, showCloseButton: true, showCollapseButton: false },
						{
							EVET: (dlgUI, btnUI) => { p.resolve(true); dlgUI.jqxWindow('destroy') },
							HAYIR: (dlgUI, btnUI) => { p.reject(false); dlgUI.jqxWindow('destroy') }
						},
						1
					);
					wnd.find(`.ui-dialog-button input[type=button][value=EVET]`)
						.css('background-color', 'red')
						.css('color', 'whitesmoke')
						.addClass(`bold`);
				})
			}
			let result = null;
			try { result = await this.wsTopluGerceklemeYap({ tip: id || '' }); if (!result || result.isError) throw result || { isError: true, rc: 'emptyResult' }; }
			catch (ex) { (window.savedProcs?.hideProgress || hideProgress)(); defFailBlock(ex); throw ex }
			try { await this.gerekirseTazele() } catch (ex) { }
			return result
		}
		
		geriIstendi(e) {
			this.txtFiltre.val('');
			if (!$.isEmptyObject(this.filtreParts) || this.filtreTezgahId) { this.filtreParts = this.filtreTezgahId = null; this.tazele() }
			if (this.isToggled) this.tezgahToggleIstendi({ id: this.toggledTezgahID })
		}
		filtreIstendi(e) { setTimeout(() => { const {txtFiltre} = this; if (txtFiltre && txtFiltre.length) txtFiltre.focus() }, 50) }
		filtreTusBasildi(e) {
			const evt = e.event, {key} = evt, keyLower = key?.toLowerCase() ?? key;
			if (keyLower == 'enter' || keyLower == 'linefeed') { this.tazele(); return }
			const {txtFiltre} = this, text = txtFiltre.val();
			if (!text)
				this.filtreParts = null
			else {
				const filtreParts = [], parts = text.split(' ');
				for (const part of parts) { if (part) filtreParts.push(part.toLocaleLowerCase(culture)); }
				this.filtreParts = filtreParts
			}
			this.setUniqueTimeout({ key: 'tazele', delayMS: 500, block: async () => { await this.tazele(); $(window).scrollTop(0) } });
		}
		tezgahMenuIstendi(e) {
			const {sender, elmTezgah, id} = e, {popupMenu} = this; this.aktifTezgahId = id; this.aktifTezgahElm = elmTezgah;
			if (popupMenu?.length) {
				const senderLeft = sender.offset().left, senderTop = sender.offset().top;
				const senderWidth = sender.width(), senderHeight = sender.height();
				const popupMenuWidth = popupMenu.width(), popupMenuHeight = popupMenu.height()
				const pos = {
					left: ($(window).width() - senderLeft) < popupMenuWidth ? senderLeft - popupMenuWidth + senderWidth + 5 : senderLeft,
					top: senderTop + senderHeight
				};
				if (pos.top + popupMenuHeight + 3 >= $(window).height()) pos.top = senderTop - popupMenuHeight - 13
				popupMenu.jqxMenu('open', pos.left, pos.top)
			}
			this.tezgahLEDDurumBelirleIstendi({ tezgahId: id, elmTezgah })
		}
		tezgahIzleIstendi(e) {
			const {id, elmTezgah} = e; this.tezgahResetSelection(e);
			const rec = this.id2Tezgah[id], {ip} = rec;
			if (!ip) { displayMessage(`<span style="color: blue; font-weight: bold;">${rec.id}-${rec.aciklama}</span> için <b>IP Adresi</b> belirlenemedi`); return null }
			/* noHeader = noMenuFrame */ const {sessionInfo} = sky.config;
			let url = `${location.origin}${location.pathname}?app=SkyMakineDurumApp`;
			if (sessionInfo.sessionID) url += `&sessionID=${sessionInfo.sessionID}`
			if (sessionInfo.loginTipi) url += `&sessionMatch=${sessionInfo.loginTipi}`
			if (sessionInfo.user) url += `&user=${sessionInfo.user}`
			if (sessionInfo.pass) url += `&pass=${sessionInfo.pass}`
			let keys = ['disableTimers', 'disableCmdTimers'];
			for (const key of keys) { if (asBool(this[key])) url += `&${key}` }
			keys = ['fn', 'dev', 'programci', 'test', 'ssl', 'hostname', 'port', 'kontrolSureSn', 'buttonWSHostName', 'buttonWSPort'];
			for (const key of keys) {
				const value = qs[key];
				if (value) { url += `&${key}`; if (value !== undefined && value != 'undefined') url += `=${value}` }
			}
			url += `&tamEkranYok&logoutClosesWindow&ip=${ip}&`;
			const zoomLevel = getZoomLevel();
			const size = { width: 720 * zoomLevel, height: (720 - 360 + (asBool(qs.fn) ? 360 : 0)) * zoomLevel };
			/*const size = { width: 750 * zoomLevel, height: (360 + (asBool(qs.fn) ? 360 : 0)) * zoomLevel };*/
			if ($(window).width() < size.width + 100) size.width = ($(window).width() - 20) * zoomLevel
			if ($(window).height() < size.height + 100) size.height = ($(window).height() - 20) * zoomLevel
			const wnd = window.open(
				url, ip || '_blank',
				(	`titlebar=1,menubar=0,toolbar=0,status=0,location=0,resizeable=1,directories=0,top=0,left=1,` +
					`width=${size.width},height=${size.height}`
				)
			);
			setTimeout(() => { if (wnd.focus) wnd.focus() }, 1000)
		}
		async tezgahTiklandi(e) {
			delete this.aktifTezgahId; delete this.aktifTezgahElm; this.tezgahResetSelection(e);
			const {elmTezgah} = e; let {id} = e;
			if (!id && (elmTezgah?.length)) id = e.id = elmTezgah.data('id')
			this.aktifTezgahId = id; this.aktifTezgahElm = elmTezgah;
			if (elmTezgah) elmTezgah.addClass(`selected`)
			let {promise_tezgahSecince} = this; if (promise_tezgahSecince) { promise_tezgahSecince.resolve(e); delete this.promise_tezgahSecince }
			this.tezgahSecSonrasi($.extend({}, e, { tazele: !!promise_tezgahSecince }));
			this.tezgahLEDDurumBelirleIstendi({ tezgahId: id, elmTezgah });
		}
		tezgahSagTiklandi(e) { this.tezgahToggleIstendi(e) }
		async tezgahToggleIstendi(e) {
			const {id} = e, hatID = e.hatID || this.tezgah2Hat[id], {isToggled, hatListeParent} = this, toggleFlag = !isToggled;
			this.isToggled = toggleFlag; this.toggledTezgahID = toggleFlag ? id : null;
			this.btnGeri[toggleFlag ? 'removeClass' : 'addClass'](`jqx-hidden`);
			const hatItems = hatListeParent.find(`.hat.item`), tezgahItems = hatItems.find(`.tezgah.item`), divTezgah = tezgahItems.filter(`[data-id=${id}]`);
			if (toggleFlag) {
				divTezgah.addClass(`fill`); divTezgah.removeClass(`jqx-hidden`);
				tezgahItems.filter(`[data-id!=${id}]`).addClass(`jqx-hidden`); hatItems.filter(`[data-id!=${hatID}]`).addClass(`jqx-hidden`)
			}
			else { tezgahItems.removeClass(`fill jqx-hidden`); hatItems.removeClass(`jqx-hidden`) }
			this.tezgahLEDDurumBelirleIstendi({ tezgahId: id })
		}
		async tezgahSecIstendi(e) {
			e = e || {}; await this.tezgahResetSelection(e);
			const {id2Tezgah, aktifTezgahId, hatListeParent} = this, tezgah = aktifTezgahId ? id2Tezgah[aktifTezgahId] : null;
			const hatKisitlaFlag = asBool(e.hatKisitla ?? e.hatKisitlaFlag), kisitHatId = e.hatId || e.kisitHatId || (hatKisitlaFlag ? tezgah?.hatID : null);
			$.extend(this, { savedAktifTezgahId: this.aktifTezgahId, savedFiltreParts: this.filtreParts, savedFiltreHatId: this.filtreHatId, savedFiltreTezgahId: this.filtreTezgahId });
			$.extend(this, { aktifTezgahId: null, filtreParts: null, filtreHatId: kisitHatId, filtreTezgahId: null });
			await this.tazele({ sync: false });
			const elmTezgah = aktifTezgahId ? hatListeParent.find(`.hat.item .tezgah.item[data-id='${aktifTezgahId}']`) : null;
			if (elmTezgah?.length) elmTezgah.addClass(`disabled`)
			return this.promise_tezgahSecince = new $.Deferred(p => { const {divTezgahSecUyari} = this; if (divTezgahSecUyari?.length) divTezgahSecUyari.removeClass(`jqx-hidden`) })
		}
		async tezgahSec_vazgecIstendi(e) {
			await this.tezgahSecSonrasi($.extend({}, e, { tazele: true }));
			const {promise_tezgahSecince} = this; if (promise_tezgahSecince) { promise_tezgahSecince.reject({ isError: true, rc: 'userAbort' }); delete this.promise_tezgahSecince }
		}
		tezgahMenuItemTiklandi(e) {
			const {id} = e;
			switch (id) {
				case 'siradakiIsler': this.tezgahSiradakiIslerIstendi(e); break
				case 'bekleyenIsler': this.tezgahBekleyenIslerIstendi(e); break
				case 'ekBilgi': this.tezgahEkBilgiIstendi(e); break
			}
		}
		async tezgahBekleyenIslerIstendi(e) {
			const hatId = e.hatId || e.id, {tezgahId, noSwitch} = e;
			const promise = new $.Deferred(p => {
				const part = new SkyHatIzleme_BekleyenIslerPart({
					hatId, tezgahId, noSwitch,
					tamamIslemi: e => p.resolve(e), geriCallback: e => p.reject(e)
				});
				part.open()
			});
			const target = e.event?.currentTarget, $target = target ? $(target) : null; /*if ($target && $target.length) setButonEnabled($target, false);*/
			/*if ($target && $target.length) setButonEnabled($target, false);*/
			try {
				const elmTezgah = this.hatListeParent.find(`.hat.item .tezgah.item[data-id='${tezgahId}']`); this.tezgahTiklandi({ id: tezgahId, elmTezgah });
				let result = await promise; this.tazele(); if (!result || result.isError) throw result || { isError: true, rc: 'emptyResult' }
			}
			catch (ex) { if (!(ex.userCloseFlag || ex.rc == 'userAbort')) { (window.savedProcs?.hideProgress || hideProgress)(); defFailBlock(ex); throw ex } }
			finally { this.tezgahResetSelection(); / *if ($target && $target.length) setButonEnabled($target, true) */ }
		}
		async tezgahSiradakiIslerIstendi(e) {
			const hatId = e.hatId || e.id, {tezgahId, noSwitch} = e;
			const promise = new $.Deferred(p => {
				const part = new SkyHatIzleme_SiradakiIslerPart({
					hatId, tezgahId, noSwitch,
					tamamIslemi: e => p.resolve(e), geriCallback: e => p.reject(e)
				});
				part.open()
			});
			const target = e.event?.currentTarget, $target = target ? $(target) : null; /*if ($target && $target.length) setButonEnabled($target, false);*/
			try {
				const elmTezgah = this.hatListeParent.find(`.hat.item .tezgah.item[data-id='${tezgahId}']`); this.tezgahTiklandi({ id: tezgahId, elmTezgah });
				let result = await promise; this.tazele(); if (!result || result.isError) throw result || { isError: true, rc: 'emptyResult' }
			}
			catch (ex) { if (!(ex.userCloseFlag || ex.rc == 'userAbort')) { (window.savedProcs?.hideProgress || hideProgress)(); defFailBlock(ex); throw ex } }
			finally { this.tezgahResetSelection(); / *if ($target && $target.length) setButonEnabled($target, true) */ }
		}
		bekleyenIslerIstendi(e) {
			const hatId = e.hatId || e.id, {noSwitch} = e;
			const part = new SkyHatIzleme_BekleyenIslerPart({ hatId, noSwitch, position: 'top, right' }); part.open()
		}
		async hat_zamanEtuduBaslatIstendi(e) {
			const target = e.event?.currentTarget, $target = target ? $(target) : null;
			/*if ($target && $target.length) setButonEnabled($target, false);*/
			const hatId = e.hatId || e.id, {hatAciklama} = (this.id2Hat[hatId] || {}), IslemAdi = `Zaman Edütü Başlat`;
			const promise = new $.Deferred(p => {
					const wnd = createJQXWindow(
						(
							`<p class="darkred"><b class="red">UYARI:</b> <span><b>(${hatId})</b> ${hatAciklama}</span> Hattındaki Makineler için ` +
							`<u class="bold">${IslemAdi}</u> işlemi yapılacak</p>` +
							`<p>Devam edilsin mi?</p>`
						), `Toplu ${IslemAdi} İşlemi yapılacak...`,
						{ isModal: true, width: 450, height: 280, showCloseButton: true, showCollapseButton: false },
						{
							EVET: (dlgUI, btnUI) => { p.resolve(true); dlgUI.jqxWindow('destroy') },
							HAYIR: (dlgUI, btnUI) => { p.reject(false); dlgUI.jqxWindow('destroy') }
						}, 1
					);
					wnd.find(`.ui-dialog-button input[type=button][value=EVET]`).css('background-color', 'red').css('color', 'whitesmoke').addClass('bold')
			});
			await promise;
			try {
				const result = await this.wsTopluZamanEtuduBaslat({ hatId }); this.tazele();
				if (!result || result.isError) throw result || { isError: true, rc: 'emptyResult' }
			}
			catch (ex) { if (!(ex.userCloseFlag || ex.rc == 'userAbort')) { (window.savedProcs?.hideProgress || hideProgress)(); defFailBlock(ex); } throw ex }
		}
		async hat_topluZamanEtuduKapatIstendi(e) {
			const target = e.event?.currentTarget, $target = target ? $(target) : null;
			/*if ($target && $target.length) setButonEnabled($target, false);*/
			const hatId = e.hatId || e.id, {hatAciklama} = (this.id2Hat[hatId] || {}), IslemAdi = `Zaman Edütü Kapat`;
			const promise = new $.Deferred(p => {
					const wnd = createJQXWindow(
						(
							`<p class="darkred"><b class="red">UYARI:</b> <span><b>(${hatId})</b> ${hatAciklama}</span> Hattındaki Makineler için ` +
							`<u class="bold">${IslemAdi}</u> işlemi yapılacak</p>` +
							`<p>Devam edilsin mi?</p>`
						), `Toplu ${IslemAdi} İşlemi yapılacak...`,
						{ isModal: true, width: 450, height: 280, showCloseButton: true, showCollapseButton: false },
						{
							EVET: (dlgUI, btnUI) => { p.resolve(true); dlgUI.jqxWindow('destroy') },
							HAYIR: (dlgUI, btnUI) => { p.reject(false); dlgUI.jqxWindow('destroy') }
						}, 1
					);
					wnd.find(`.ui-dialog-button input[type=button][value=EVET]`).css('background-color', 'red').css('color', 'whitesmoke').addClass('bold')
			});
			await promise;
			try {
				const result = await this.wsTopluZamanEtuduKapat({ hatId }); this.tazele();
				if (!result || result.isError) throw result || { isError: true, rc: 'emptyResult' }
			}
			catch (ex) { if (!(ex.userCloseFlag || ex.rc == 'userAbort')) { (window.savedProcs?.hideProgress || hideProgress)(); defFailBlock(ex); } throw ex }
		}
		async hat_isBitirIstendi(e) {
			const target = e.event?.currentTarget, $target = target ? $(target) : null;
			/*if ($target && $target.length) setButonEnabled($target, false);*/
			const hatId = e.hatId || e.id, {hatAciklama} = (this.id2Hat[hatId] || {}), IslemAdi = `İş Bitti`;
			const promise = new $.Deferred(p => {
					const wnd = createJQXWindow(
						(
							`<p class="darkred"><b class="red">UYARI:</b> <span><b>(${hatId})</b> ${hatAciklama}</span> Hattındaki Makineler için ` +
							`<u class="bold">${IslemAdi}</u> işlemi yapılacak</p>` +
							`<p>Devam edilsin mi?</p>`
						), `Toplu ${IslemAdi} İşlemi yapılacak...`,
						{ isModal: true, width: 450, height: 280, showCloseButton: true, showCollapseButton: false },
						{
							EVET: (dlgUI, btnUI) => { p.resolve(true); dlgUI.jqxWindow('destroy') },
							HAYIR: (dlgUI, btnUI) => { p.reject(false); dlgUI.jqxWindow('destroy') }
						}, 1
					);
					wnd.find(`.ui-dialog-button input[type=button][value=EVET]`).css('background-color', 'red').css('color', 'whitesmoke').addClass('bold')
			});
			await promise;
			try {
				const result = await this.wsTopluIsBittiYap({ hatId }); this.tazele();
				if (!result || result.isError) throw result || { isError: true, rc: 'emptyResult' }
			}
			catch (ex) { if (!(ex.userCloseFlag || ex.rc == 'userAbort')) { (window.savedProcs?.hideProgress || hideProgress)(); defFailBlock(ex); } throw ex }
		}
		async bekleyenIsEmirleriIstendi(e) {
			const hatId = e.hatId || e.id;
			const promise = new $.Deferred(p => {
				const part = new SkyHatIzleme_BekleyenIsEmirleriPart({ hatId, tamamIslemi: e => p.resolve(e), geriCallback: e => p.reject(e), });
				part.open()
			});
			const target = e.event?.currentTarget, $target = target ? $(target) : null;
			/*if ($target && $target.length) setButonEnabled($target, false);*/
			try {
				let result = await promise; this.tazele();
				if (!result || result.isError) throw result || { isError: true, rc: 'emptyResult' }
			}
			catch (ex) { if (!(ex.userCloseFlag || ex.rc == 'userAbort')) { (window.savedProcs?.hideProgress || hideProgress)(); defFailBlock(ex); throw ex } }
		}
		async topluTezgahLEDDurumBelirleIstendi(e) {
			const Key_All = '*', {id2Tezgah, hatListeParent} = this, tezgahIdListe = Object.keys(id2Tezgah), {tezgahId2LEDDurumBelirlePromise} = this;
			let promise = tezgahId2LEDDurumBelirlePromise[Key_All]; if (promise != null) return await promise
			promise = tezgahId2LEDDurumBelirlePromise[Key_All] = new $.Deferred(async p => {
				this.clearUniqueTimeout({ key: 'topluTezgahLEDDurumBelirlePromise_reset' }); let result = null;
				try {
					result = await this.wsGetLEDDurumAll(/*{ tezgahIdListe: tezgahIdListe.join('|') }*/);
					if (!result) { p.reject({ rc: 'emptyResult', errorText: 'Toplu LED Durum Sorgulama başarısız' }); return }
					hatListeParent.find(`.hat.item .tezgah.item #ledDurumParent #ledDurum`).attr('data-durum', null);
					hatListeParent.find(`.hat.item .tezgah.item #ledDurumParent`).addClass('jqx-hidden');
					for (const tezgahId in result) {
						const elmTezgah = hatListeParent.find(`.hat.item .tezgah.item[data-id='${tezgahId}']`);
						if (elmTezgah.length) {
							const ledDurumParent = elmTezgah.find(`#ledDurumParent`), elmLEDDurum = ledDurumParent.find(`#ledDurum`);
							let ledDurum = null; const subResult = result[tezgahId];
							if (asBool(subResult.result) && !asBool(subResult.isError)) { ledDurum = subResult.ledDurum; elmLEDDurum.attr(`data-durum`, ledDurum) }
							else { ledDurum = 'error'; elmLEDDurum.attr(`data-durum`, ledDurum) }
							ledDurumParent.removeClass(`jqx-hidden`)
						}
					}
					setTimeout(() => p.resolve(result), 3000)
				}
				catch (ex) { defFailBlock(ex); p.reject(ex) }
				finally {
					this.setUniqueTimeout({
						key: 'topluTezgahLEDDurumBelirlePromise_reset', delayMS: 2000,
						block: () => { promise = null; delete tezgahId2LEDDurumBelirlePromise[Key_All] }
					})
				}
			});
			return await promise
		}
		async tezgahLEDDurumBelirleIstendi(e) {
			let {tezgahId, elmTezgah} = e;
			if (tezgahId && !(elmTezgah && elmTezgah.length)) { elmTezgah = this.hatListeParent.find(`.hat.item .tezgah.item[data-id='${tezgahId}']`) }
			else if (!tezgahId && (elmTezgah && elmTezgah.length)) { tezgahId = elmTezgah.data('id') }
			if (!tezgahId || !elmTezgah || !elmTezgah.length) return null
			const {tezgahId2LEDDurumBelirlePromise} = this; let promise = tezgahId2LEDDurumBelirlePromise[tezgahId]; if (promise != null) return await promise
			promise = tezgahId2LEDDurumBelirlePromise[tezgahId] = new $.Deferred(async p => {
				this.clearUniqueTimeout({ key: 'tezgahId2LEDDurumBelirlePromise_reset' });
				const ledDurumParent = elmTezgah.find(`#ledDurumParent`),elmLEDDurum = ledDurumParent.find(`#ledDurum`);
				let ledDurum = null, result = null;
				try {
					result = await this.wsGetLEDDurum({ tezgahId });
					if (!result || !result.result) { throw { isError: true, rc: 'signal' } }
					else {
						ledDurum = result.ledDurum; elmLEDDurum.attr(`data-durum`, ledDurum);
						ledDurumParent.removeClass(`jqx-hidden`); p.resolve(result)
					}
				}
				catch (ex) {
					ex = ex.responseJSON || ex;
					const errCode = (ex.code || ex.rc || '').toLowerCase();
					switch (errCode) {
						case 'signal': case 'timeout': case 'abort': case 'aborted': case 'socketexception': case 'webexception':
						case 'ioexception': case 'indexoutofrangeexception': case 'argumentoutofrangeexception':
							ledDurum = 'error'; elmLEDDurum.attr(`data-durum`, ledDurum); ledDurumParent.removeClass(`jqx-hidden`);
							defFailBlockBasit(ex); p.resolve(result); break
						default: defFailBlock(ex); p.reject(ex); break
					}
				}
				finally {
					this.setUniqueTimeout({
						key: 'tezgahId2LEDDurumBelirlePromise_reset', delayMS: 2000, args: tezgahId,
						block: tezgahId => { promise = null; delete tezgahId2LEDDurumBelirlePromise[tezgahId] }
					})
				}
			});
			return await promise
		}
		async tezgahEkBilgiIstendi(e) {
			const {tezgahId} = e, promise = this.tezgahEkBilgiIstendiDevam(e);
			const target = (e.event || {}).currentTarget, $target = target ? $(target) : null;
			/*if ($target && $target.length) setButonEnabled($target, false);*/
			try {
				const elmTezgah = this.hatListeParent.find(`.hat.item .tezgah.item[data-id='${tezgahId}']`);
				this.tezgahTiklandi({ id: tezgahId, elmTezgah });
				let result = await promise; this.tazele();
				if (!result || result.isError) throw result || { isError: true, rc: 'emptyResult' };
			}
			catch (ex) { if (!(ex.userCloseFlag || ex.rc == 'userAbort')) { (window.savedProcs?.hideProgress || hideProgress)(); defFailBlock(ex); throw ex } }
			finally { this.tezgahResetSelection() }
		}
		tezgahEkBilgiIstendiDevam(e) {
			const {tezgahId} = e, rec = this.id2Tezgah[tezgahId];
			let bilgiHTML = $(
				`<table class="ekBilgiTable">` +
					`<tr>` +
						`<th class="key">Saha</th>` +
						`<th class="value">Değer</th>` +
					`</tr>` +
				`</table>`
			);
			for (const key in rec) {
				let value = rec[key];
				if (value != null) {
					try {
						if (key == 'isListe') {
							const orjIsListe = value, isListe = [];
							for (const i in orjIsListe) {
								let is = orjIsListe[i]; if (!is) continue
								is = $.extend({}, is); delete is.isListe; isListe.push(is)
							}
							value = isListe
						}
						if ($.isArray(value)) {
							const arr = value; value = arr.map(x => `<li>` + (typeof x == 'object' ? toJSONStr(x) : x) + `</li>`);
							value = `<ul>${value.join(CrLf)}</ul>`;
						}
						if (typeof value == 'object') value = toJSONStr(value)
					}
					catch (ex) { }
					$(`<tr><td class="key">${key}</td><td class="value">${value}</td></tr>`).appendTo(bilgiHTML)
				}
			}
			return new $.Deferred(p => {
				const dlgUI = createJQXWindow(
					bilgiHTML, `Tezgah Ek Bilgi`,
					{ isModal: false, width: Math.min(700, $(window).width() - 100), height: $(window).height() - 20, closeButtonAction: 'close', showCloseButton: true, showCollapseButton: false },
					{ TAMAM: (_dlgUI, _btnUI) => { _dlgUI.jqxWindow('close') } }, 0
				);
				dlgUI.on('close', evt => { dlgUI.jqxWindow('destroy'); p.resolve(true) })
			})
		}
		tezgahResetSelection(e) { e = e || {}; const elm = this.hatListeParent.find(`.hat.item .tezgah.item.selected`); if (elm?.length) elm.removeClass(`selected`) }
		async tezgahSecSonrasi(e) {
			const {divTezgahSecUyari} = this; if (divTezgahSecUyari?.length) divTezgahSecUyari.addClass(`jqx-hidden`)
			const tazeleFlag = asBool(e.tazele || e.tazeleFlag);
			if (tazeleFlag) {
				const elmTezgahlar = this.hatListeParent.find(`.hat.item .tezgah.item.disabled`);
				if (elmTezgahlar.length) elmTezgahlar.removeClass(`disabled`)
				$.extend(this, {
					aktifTezgahId: this.savedAktifTezgahId || null, filtreParts: this.savedFiltreParts || null,
					filtreHatId: this.savedFiltreHatId || null, filtreTezgahId: this.savedFiltreTezgahId || null
				});
				const keys = ['savedAktifTezgahId', 'savedFiltreParts', 'savedFiltreHatId', 'savedFiltreTezgahId'];
				for (const key of keys) delete this[key]
				await this.tazele({ sync: false, noReset: true })
			}
		}
		async tezgahPersonelAtaIstendi(e) {
			const tezgahId = e.tezgahId?.toString() || '', {noSwitch} = e, promise = new $.Deferred(p => {
				const part = new SkyMES_PersonelSecPart({ tezgahId, noSwitch, geriCallback: e => { p.reject(e) }, tamamIslemi: e => { p.resolve(e) } });
				part.open()
			});			
			const target = (e.event || {}).currentTarget, $target = target ? $(target) : null;
			if ($target?.length) setButonEnabled($target, false)
			try {
				let result = await promise, kod = result.value;
				if (!kod && result.rec) { const {rec} = result; kod = rec.kod || rec.id }
				await this.wsPersonelAta({ tezgahId, perKod: kod || '' }); this.signalChangeExternal();
			}
			catch (ex) { if (!(ex.userCloseFlag || ex.rc == 'userAbort')) { (window.savedProcs?.hideProgress || hideProgress)(); defFailBlock(ex); throw ex } }
			finally {
				this.tezgahResetSelection(); if (target) setButonEnabled($(target), true);
				setTimeout(() => hideProgress(), 1000); hideProgress()
			}
		}
		async tezgahOperSecIstendi(e) {
			const tezgahId = e.tezgahId?.toString() || '', {oemSayac, noSwitch} = e;
			const promise = new $.Deferred(p => {
				const part = new SkyHatIzleme_OperSecPart({ tezgahId, oemSayac, noSwitch, geriCallback: e => { p.reject(e) }, tamamIslemi: e => { p.resolve(e) } });
				part.open()
			});
			const result = await promise; return result
		}
		async sinyalSureDuzenleIstendi(e) {
			e = e || {}; const {rec} = e; if (!rec?.sinyalsayisi) return false
			const {tr} = e, tezgahId = (e.tezgahId || rec?.tezgahkod)?.toString() || '';
			const bilgiHTML = e.bilgiHTML == null ? (tr && tr.length ? tr.find(`td.jqx-grid-cell.fisNox`).html() : null) : bilgiHTML;
			const result = await new $.Deferred(p => {
				const part = new SkyHatIzleme_SureSayiDuzenlePart({ tezgahId, rec, bilgiHTML, tamamIslemi: e => p.resolve(e) });
				part.open()
			});
			const {sinyalSayisi, sinyalTekilSure, sinyalToplamSure} = result;
			return await this.wsSureDuzenle({
				tezgahId, oemSayac: rec.oemsayac, isId: (rec.issayac || rec.isid),
				sinyalSayisi: sinyalSayisi, sinyalTekilSure: sinyalTekilSure, sinyalToplamSure: sinyalToplamSure
			})
		}
		async zamanEtuduIstendi(e) {
			e = e || {}; let rec_is = e.rec; if (!rec_is) return false
			const {tr} = e, isId = e.isId || rec_is?.issayac, tezgahId = (e.tezgahId || rec_is?.tezgahkod)?.toString() || '', oemSayac = rec_is?.oemsayac;
			const bilgiHTML = e.bilgiHTML == null ? (tr && tr.length ? tr.find(`td.jqx-grid-cell.fisNox`).html() : null) : bilgiHTML;
			return await new $.Deferred(p => {
				const part = new SkyHatIzleme_ZamanEtuduPart({ tezgahId, isId, oemSayac, rec_is, bilgiHTML, tamamIslemi: e => p.resolve(e) });
				part.open()
			})
		}
		async tezgahEkBilgiParentTiklandi(e) {
			const tezgahId = e.tezgahId?.toString() || '', target = e.event?.currentTarget, $target = target ? $(target) : null, rec = this.id2Tezgah[tezgahId] || {};
			const ekBilgiText = rec.ekBilgi || rec.ekbilgi || rec.ekBilgiText; if (!ekBilgiText) return
			if ($target?.length) setButonEnabled($target, false);
			try { await this.wsEkBilgiAta({ tezgahId, ekBilgi: '' }); this.signalChangeExternal(); }
			catch (ex) { if (!(ex.userCloseFlag || ex.rc == 'userAbort')) { (window.savedProcs?.hideProgress || hideProgress)(); defFailBlock(ex); throw ex } }
			finally { if (target) setButonEnabled($(target), true); setTimeout(() => hideProgress(), 1000); hideProgress() }
		}
		async onResize(e) {
			await super.onResize(e); const {header, hatListeParent} = this;
			hatListeParent.width($(window).width() + 5); hatListeParent.height($(window).height() - (header.height() + hatListeParent.position().top) - 20);
			hatListeParent.find(`#tezgahListeParent`).width($(window).width())
		}
	}
})()
