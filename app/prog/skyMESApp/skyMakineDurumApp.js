(function() {
	window.SkyMakineDurumApp = class extends window.SkyMESApp {
		constructor(e) {
			e = e || {}; super(e);
			$.extend(this, { fnFlag: asBool(qs.fn), ip: qs.ip, tezgahKod: qs.tezgahKod, tezgah: null });
		}
		static get appName() { return 'skyMakineDurumApp' }
		get appText() { return `VIO Makine Durum` }
		static get wsURLBasePostfix() { return `/makineDurum` }
		static get hatIzlememi() { return true }
		get tekIsmi() {
			const {tezgahBilgi} = this;
			return tezgahBilgi && (tezgahBilgi.isListe || []).length == 1
		}

		setUpTimers(e) {
			super.setUpTimers(e);

			if (!this.timerYokmu) {
				const {timers} = this;
				timers.tarihSaat = {
					delay: 1000, interval: true,
					block: () => {
						if (!this.timersDisabledFlag)
							this.tarihSaatGuncelle();
					}
				}
			}
		}
		
		async preInitLayout(e) {
			e = e || {}; await super.preInitLayout(e);
			const layout = e.layout || this.layout, {disForm} = this, toolbar = this.toolbar = disForm.find(`#toolbar`);
			this.subContent = disForm.find(`#subContent`);
			// setButonEnabled(toolbar.find(`button`), false);
			this.btnBaslat = toolbar.find(`#baslat`).on('click', evt => this.baslatIstendi($.extend({}, e, { event: evt })));
			this.btnPersonel = toolbar.find(`#personel`).on('click', evt => this.personelIstendi($.extend({}, e, { event: evt })));
			this.btnMiktar = toolbar.find(`#miktar`).on('click', evt => this.miktarIstendi($.extend({}, e, { event: evt })));
			this.btnGorev = toolbar.find(`#gorev`).on('click', evt => this.gorevIstendi($.extend({}, e, { event: evt })));
			this.btnIsBitti = toolbar.find(`#isBitti`).on('click', evt => this.isBittiIstendi($.extend({}, e, { event: evt })));
			const simulatorToggleParent = layout.find(`#simulatorToggleParent`);
			const divSimulator = this.divSimulator = layout.find(`#simulator`);
			if (this.fnFlag) {
				const btnSimulatorToggle = simulatorToggleParent.find(`#btnSimulatorToggle`);
				btnSimulatorToggle.jqxToggleButton({ theme: theme, toggled: !divSimulator.hasClass(`jqx-hidden`) });
				btnSimulatorToggle.on('click', evt => { const flag = btnSimulatorToggle.jqxToggleButton('toggled'); divSimulator[flag ? 'removeClass' : 'addClass'](`jqx-hidden`); evt.currentTarget.blur() });
				divSimulator.find(`.buttons.primary #btnGercekleme`).on('click', evt => this.fn0Istendi({ event: evt, id: evt.currentTarget.id }));
				divSimulator.find(`.buttons.primary #btnKesme`).on('click', evt => this.kesmeIstendi({ event: evt, id: evt.currentTarget.id }));
				const btnTersKesme = divSimulator.find(`.buttons.primary #btnTersKesme`);
				btnTersKesme.on('mousedown touchstart', evt => this.tersKesme_tusaBasildi({ event: evt, id: evt.currentTarget.id }));
				btnTersKesme.on('click', evt => this.tersKesme_tusBirakildi({ event: evt, id: evt.currentTarget.id }));
				divSimulator.find(`.buttons.primary #txtKartNo`).on('keyup', evt => {
					const key = (evt.key || '').toLowerCase();
					if (key == 'enter' || key == 'linefeed') this.kartOkutuldu({ event: evt, kartNo: (evt.currentTarget.value || '').toString().trimEnd() });
				});
				const btnFnList = divSimulator.find(`.buttons.fn button`);
				btnFnList.on('mousedown touchstart', evt =>
					this.fn_tusaBasildi({ event: evt, id: evt.currentTarget.id }));
				btnFnList.on('click', evt =>
					this.fnIstendi({ event: evt, id: evt.currentTarget.id }));

				/*const buttonsFn = divSimulator.find(`.buttons.fn`);
				setButonEnabled(buttonsFn.find(`#esc`), false);*/
			}
			else {
				simulatorToggleParent.addClass(`jqx-hidden`);
				divSimulator.addClass(`jqx-hidden`);
			}
		}
		async destroyPart(e) { e = e || {}; await super.destroyPart(e) }
		async tazeleDevam(e) {
			await super.tazeleDevam(e); let recs = await this.wsTekilTezgahBilgi({ sync: e.sync }) || []; recs = recs.rows || recs; if (recs && !$.isArray(recs)) { recs = [recs] }
			let tezgahBilgi;
			for (const rec of  recs) {
				const {id, isID} = rec;
				rec.isSaymaInd = rec.isSaymaInd || 0; rec.isSaymaSayisi = rec.isSaymaSayisi || (isID ? 1 : 0);
				if (!tezgahBilgi) { rec.isListe = []; tezgahBilgi = this.tezgahBilgi = rec }			/* tezgah için diğer iş kaydı */
				if (isID) tezgahBilgi.isListe.push(rec)
				tezgahBilgi.saymaInd = (tezgahBilgi.saymaInd || 0) + rec.isSaymaInd;
				tezgahBilgi.saymaSayisi = (tezgahBilgi.saymaSayisi || 0) + rec.isSaymaSayisi;
			}
			setButonEnabled(this.btnMiktar, this.tekIsmi);
			await this.updateSubLayout()
		}
		updateSubLayout(e) {
			e = e || {}; const {templatesOrtak, subContent} = this, rec = e.rec || this.tezgahBilgi; if (!rec) return
			const _now = now(), _today = today(), {
				id, aciklama, ip, perKod, perIsim, isID, emirMiktar, onceUretMiktar, aktifUretMiktar,
				isIskMiktar, isNetMiktar, onceCevrimSayisi, aktifCevrimSayisi, saymaInd, saymaSayisi, isListe
			} = rec;
			const durumKod = rec.durumKod || ''; subContent.attr(`data-id`, id || ''); subContent.attr(`data-durum`, durumKod || '');
			const {btnBaslat, btnPersonel, btnMiktar, btnGorev, btnIsBitti, divSimulator, tekIsmi} = this;
			const basitStrGoster = e => {
				const {parent, selector} = e; let {value} = e;
				if (typeof value == 'number') value = asFloat(value).toLocaleString()
				if (Utils.isDate(value)) value = dateKisaString(value)
				const elm = parent.find(selector); if (value) elm.html(value)
				return value
			};
			const basitIntGoster = e => {
				const {parent, selector} = e; let {value} = e;
				if (typeof value == 'number') value = asInteger(value).toLocaleString()
				const elm = parent.find(selector); if (value) elm.html(value)
				return value
			};
			const kaGoster = e => {
				const kod = (e.kod || '').toString().trimEnd(), aciklama = (e.aciklama || '').toString().trimEnd(), {selector} = e, parent = e.parent || subContent;
				let text = aciklama || ''; if (kod) { text = `${kod.toString()}-<b>${text}</b>` }
				const elm = parent.find(selector); if (text) { elm.html(text); elm.parent().removeClass('basic-hidden') } else { elm.parent().addClass('basic-hidden') }
				return text
			};
			const miktarGoster = e => {
				const {parent, fra, selector, autoHide} = e; let {value} = e; const orjValue = value;
				if (typeof value == 'number') value = toStringWithFra(value, fra == null ? 0 : fra)
				const elm = parent.find(selector); if (autoHide && !orjValue) { elm.parent().addClass('basic-hidden') } else { elm.html(value); elm.parent().removeClass('basic-hidden') }
				return value
			};
			switch (durumKod) {
				case '': case 'BK':
					btnBaslat.html(`BAŞLAT`); setButonEnabled(btnBaslat, false); setButonEnabled(btnPersonel, false); setButonEnabled(btnMiktar, false); setButonEnabled(btnGorev, true);
					setButonEnabled(btnIsBitti, false); setButonEnabled(divSimulator.find(`button`), true); setButonEnabled(divSimulator.find(`#txtKartNo`), false); break
				case 'AT':
					btnBaslat.html(`BAŞLAT`); setButonEnabled(btnBaslat, true); setButonEnabled(btnPersonel, true); setButonEnabled(btnMiktar, false); setButonEnabled(btnGorev, true);
					setButonEnabled(btnIsBitti, false); setButonEnabled(divSimulator.find(`button`), false); setButonEnabled(divSimulator.find(`#txtKartNo`), true); break
				case 'DV':
					btnBaslat.html(`DURDUR`); setButonEnabled(btnBaslat, true); setButonEnabled(btnPersonel, false); setButonEnabled(btnMiktar, tekIsmi); setButonEnabled(btnGorev, true);
					setButonEnabled(btnIsBitti, true); setButonEnabled(divSimulator.find(`button`), true); setButonEnabled(divSimulator.find(`#txtKartNo`), false); break
				case 'DR':
					btnBaslat.html(`Y.BAŞLAT`); setButonEnabled(btnBaslat, true); setButonEnabled(btnPersonel, true); setButonEnabled(btnMiktar, false); setButonEnabled(btnGorev, true);
					setButonEnabled(btnIsBitti, true); setButonEnabled(divSimulator.find(`button`), true); setButonEnabled(divSimulator.find(`#txtKartNo`), true); break
				case 'KP': case 'BT':
					btnBaslat.html(`BAŞLAT`); setButonEnabled(btnBaslat, false); setButonEnabled(btnPersonel, false); setButonEnabled(btnMiktar, false); setButonEnabled(btnGorev, true);
					setButonEnabled(btnIsBitti, false); setButonEnabled(divSimulator.find(`button`), false); setButonEnabled(divSimulator.find(`#txtKartNo`), false); break
				default:
					setButonEnabled(btnBaslat, false); setButonEnabled(btnPersonel, false); setButonEnabled(btnMiktar, false); setButonEnabled(btnGorev, false);
					setButonEnabled(btnIsBitti, false); setButonEnabled(divSimulator.find(`button`), true); setButonEnabled(divSimulator.find(`#txtKartNo`), false); break
			}
			let text = aciklama || ''; if (id) { text = `${id.toString()}-<b>${text}</b>` } text = `<span class="asil">${text}</span>`;
			if (ip) { text += `<span id="ipParent" class="ekBilgi parent">(ip: <span id="ipText">${ip}</span>)</span>` }
			subContent.find(`#tezgahText`).html(text);
			kaGoster({ kod: perKod, aciklama: perIsim, selector: `#perText` });
			const divIsListe = templatesOrtak.contents(`.isListe`).clone(true);
			for (let i = 0; i < isListe.length; i++) {
				const is = isListe[i], {emirTarih, emirNox, urunKod, urunAciklama, operNo, operAciklama, isSaymaTekilEnDusukSure, isSaymaToplamEnDusukSure} = is;
				const isSaymaSayisi = is.isSaymaSayisi || 1, basZamanTS = is.basZamanTS ? asDate(is.basZamanTS) : null;
				// const isToplamBrutSureSn = is.isToplamBrutSureSn || 0;
				const isToplamBrutSureSn = basZamanTS ? asInteger((_now.getTime() - basZamanTS.getTime()) / 1000) : null, isToplamDuraksamaSureSn = is.isToplamDuraksamaSureSn || 0, isToplamNetSureSn = (isToplamBrutSureSn || 0) - (isToplamDuraksamaSureSn || 0);
				const isToplamBrutSureTS = isToplamBrutSureSn ? new Date(isToplamBrutSureSn * 1000).addHours(-new Date(0).getHours()) : null;
				const isToplamNetSureTS = isToplamNetSureSn ? new Date(isToplamNetSureSn * 1000).addHours(-new Date(0).getHours()) : null;
				const oemParent = templatesOrtak.contents(`.oemParent`).clone(true);
				kaGoster({ aciklama: `${i + 1}: `, selector: `#seq`, parent: oemParent });
				kaGoster({
					aciklama: ((emirTarih ? dateKisaString(asDate(emirTarih)) + ' ' : '') + '-' + (emirNox ? ' ' + emirNox : '')),
					selector: `#emirText`, parent: oemParent
				});
				kaGoster({ kod: urunKod, aciklama: urunAciklama, selector: `#urunText`, parent: oemParent });
				kaGoster({ kod: operNo, aciklama: operAciklama, selector: `#operText`, parent: oemParent });
				const sureParent = oemParent.find(`#sureParent`);
				if (isSaymaSayisi > 1 || isSaymaTekilEnDusukSure > 0 || isSaymaToplamEnDusukSure > 0) {
					basitIntGoster({ parent: sureParent, value: isSaymaSayisi, selector: `#saymaSayisi` });
					basitIntGoster({ parent: sureParent, value: isSaymaTekilEnDusukSure, selector: `#saymaArasiSure` });
					basitIntGoster({ parent: sureParent, value: isSaymaToplamEnDusukSure, selector: `#saymaSonSure` });
					sureParent.removeClass(`jqx-hidden`)
				}
				else { sureParent.addClass(`jqx-hidden`) }
				const sure2Parent = oemParent.find(`#sure2Parent`);
				if (basZamanTS) {
					basitStrGoster({ parent: sure2Parent, value: basZamanTS, selector: `#basTS` });
					basitStrGoster({ parent: sure2Parent, value: `Br ${isToplamBrutSureTS.toString('HH:mm:ss')}`, selector: `#gecenSure` });
					basitStrGoster({ parent: sure2Parent, value: `Nt ${isToplamNetSureTS.toString('HH:mm:ss')}`, selector: `#gecenNetSure` });
					// basitStrGoster({ parent: sure2Parent, value: Utils.asSaniyeKisaString(isToplamNetSureSn), selector: `#gecenSure` });
					sure2Parent.removeClass(`jqx-hidden`)
				}
				else { sure2Parent.addClass(`jqx-hidden`) }
				divIsListe.attr('scrollamount', divIsListe.children().length >= 2 ? 60 : 0); oemParent.appendTo(divIsListe)
			}
			const divIsListeParent = subContent.find(`#isListeParent`);
			divIsListeParent.children().remove();
			divIsListe.appendTo(divIsListeParent);
			// const miktarVeSaymaParent = subContent.find(`.miktarVeSaymaParent`);
			const miktarParent = subContent.find(`#miktarParent`);
			miktarGoster({ parent: miktarParent, value: emirMiktar, selector: `#emirMiktarText` }); miktarGoster({ parent: miktarParent, value: onceUretMiktar, selector: `#onceUretMiktarText` });
			miktarGoster({ parent: miktarParent.find(`.aktifUretMiktarParent`), value: aktifUretMiktar, selector: `#aktifUretMiktarText` });
			miktarGoster({ parent: miktarParent, value: rec.isIskMiktar, selector: `#iskMiktarText` }); miktarGoster({ parent: miktarParent, value: rec.isNetMiktar, selector: `#netMiktarText` });
			const cevrimParent = subContent.find(`#cevrimParent`);
			miktarGoster({ parent: cevrimParent, value: onceCevrimSayisi, selector: `#onceCevrimSayisi` }); miktarGoster({ parent: cevrimParent, value: aktifCevrimSayisi, selector: `#aktifCevrimSayisi` });
			cevrimParent.removeClass(`basic-hidden`);
			const saymaParent = subContent.find(`#saymaParent`);
			if (saymaSayisi > 1) {
				basitIntGoster({ parent: saymaParent, value: saymaInd, selector: `#saymaInd` }); basitIntGoster({ parent: saymaParent, value: saymaSayisi, selector: `#saymaSayisi` });
				saymaParent.removeClass(`basic-hidden`)
			}
			else { saymaParent.addClass(`basic-hidden`) }
			const ekBilgiParent = subContent.find(`#ekBilgiParent`), sonDurParent = ekBilgiParent.find(`#sonDurParent`);
			text = asDate(rec.sonDurTS); if (text) { sonDurParent.find(`#sonDurText`).html(dateTimeAsKisaString(text)) }
			sonDurParent[text ? 'removeClass' : 'addClass'](`jqx-hidden`);
			
			const durumParent = subContent.find(`#durumParent`), durumTextParent = durumParent.find(`#durumTextParent`), divDurumKod = durumTextParent.find(`#durumKod`);
			divDurumKod.html(durumKod || ''); if (!durumKod) { divDurumKod.next().addClass(`jqx-hidden`) }
			const durNedenText = durumKod == 'DR' ? rec.durNedenAdi : null;
			durumTextParent.find(`#durumText`).html(durNedenText || this.durumKod2Aciklama[durumKod] || '')
		}
		tarihSaatGuncelle(e) {
			const {subContent} = this; if (!subContent?.length) { return }
			const divTarihSaatText = subContent.find(`#tarihSaatText`); if (!divTarihSaatText.length) { return }
			const _now = now(); divTarihSaatText.html(dateTimeAsKisaString(_now))
		}
		async baslatIstendi(e) {
			const {tezgahBilgi} = this; if (!tezgahBilgi) return
			const target = e.event?.currentTarget, $target = target ? $(target) : null;
			if ($target?.length) setButonEnabled($target, false)
			try {
				let result; const _e = {};
				if (tezgahBilgi.durumKod == 'DV') {
					const promise = new $.Deferred(p => {
						const part = new SkyMakineDurum_DuraksamaNedeniSecPart({ geriCallback: e => p.reject({ isError: true, rc: 'userAbort' }), tamamIslemi: e => p.resolve(e) });
						part.open();
					});
					result = await promise; if (!result || result.isError) throw result || { isError: true, rc: 'emptyResult' }
					const {rec} = result; _e.durNedenKod = rec.kod || rec.id || ''
				}
				result = await this.wsBaslatDurdur(_e);
				if (!result || result.isError) throw result || { isError: true, rc: 'emptyResult' };
			}
			catch (ex) { ((window.savedProcs || {}).hideProgress || hideProgress)(); defFailBlock(ex); throw ex }
			finally { if ($target?.length) setButonEnabled($target, true) }
			try { await this.gerekirseTazele() }
			catch (ex) { }
		}
		async personelIstendi(e) {
			const target = (e.event || {}).currentTarget;
			const $target = target ? $(target) : null;
			if ($target && $target.length)
				setButonEnabled($target, false);
			try {
				const promise = new $.Deferred(p => {
					const part = new SkyMakineDurum_PersonelPart({
						geriCallback: e =>
							p.reject({ isError: true, rc: 'userAbort' }),
						tamamIslemi: e =>
							p.resolve(e)
					});
					part.open();
				});
				let result = await promise;
				if (!result || result.isError)
					throw result || { isError: true, rc: 'emptyResult' };
				
				result = await this.wsPersonelAta({ perKod: result.value });
				if (!result || result.isError)
					throw result || { isError: true, rc: 'emptyResult' };
			}
			catch (ex) {
				((window.savedProcs || {}).hideProgress || hideProgress)();
				defFailBlock(ex);
				throw ex;
			}
			finally {
				if ($target && $target.length)
					setButonEnabled($target, true);
			}
			
			try { await this.gerekirseTazele() }
			catch (ex) { }
		}

		async miktarIstendi(e) {
			const target = (e.event || {}).currentTarget;
			const $target = target ? $(target) : null;
			if ($target && $target.length)
				setButonEnabled($target, false);
			try {
				const promise = new $.Deferred(p => {
					const part = new SkyMakineDurum_MiktarGirisPart({
						geriCallback: e =>
							p.reject({ isError: true, rc: 'userAbort' }),
						tamamIslemi: e =>
							p.resolve(e)
					});
					part.open();
				});
				let result = await promise;
				if (!result || result.isError)
					throw result || { isError: true, rc: 'emptyResult' };

				result = await this.wsManuelGerceklemeYap({
					miktar: asFloat(result.value),
					iskartalar: $.isEmptyObject(result.iskartalar) ? '' : result.iskartalar.join('|')
				});
				if (!result || result.isError)
					throw result || { isError: true, rc: 'emptyResult' };
			}
			catch (ex) {
				((window.savedProcs || {}).hideProgress || hideProgress)();
				defFailBlock(ex);
				throw ex;
			}
			finally {
				if ($target && $target.length)
					setButonEnabled($target, true);
			}

			try { await this.gerekirseTazele() }
			catch (ex) { }
		}

		async gorevIstendi(e) {
			const target = (e.event || {}).currentTarget;
			const $target = target ? $(target) : null;
			if ($target && $target.length)
				setButonEnabled($target, false);
			try {
				const promise = new $.Deferred(p => {
					const part = new SkyMakineDurum_GorevSecPart({
						geriCallback: e =>
							p.reject({ isError: true, rc: 'userAbort' }),
						tamamIslemi: e =>
							p.resolve(e)
					});
					part.open();
				});
				let result = await promise;
				if (!result || result.isError)
					throw result || { isError: true, rc: 'emptyResult' };

				const {recs} = result;
				for (const i in recs) {
					const rec = recs[i]
					result = await this.wsGorevAta({ isId: rec.issayac });
					if (!result || result.isError)
						throw result || { isError: true, rc: 'emptyResult' };
				}
			}
			catch (ex) {
				((window.savedProcs || {}).hideProgress || hideProgress)();
				defFailBlock(ex);
				throw ex;
			}
			finally {
				if ($target && $target.length)
					setButonEnabled($target, true);
			}

			try { await this.gerekirseTazele() }
			catch (ex) { }
		}

		async isBittiIstendi(e) {
			const target = (e.event || {}).currentTarget;
			const $target = target ? $(target) : null;
			if ($target && $target.length)
				setButonEnabled($target, false);
			try {
				const promise = new $.Deferred(p => {
					const content = this.templatesOrtak.contents(`#isBitti.part`);
					displayMessage(
						content,
						`İş Bitti İstendi`,
						false,
						{
							EVET: (dlgUI, btnUI) => {
								const wndContent = dlgUI.find(`.jqx-window-content`);
								const _e = {};
								/*	operKapatFlag: wndContent.find(`#operKapatParent #chkOperKapat`).is(':checked')
								};*/
								dlgUI.jqxWindow('close');
								p.resolve(_e);
							},
							HAYIR: (dlgUI, btnUI) => {
								dlgUI.jqxWindow('close');
								p.reject({ isError: true, rc: 'userAbort' });
							}
						}
					)
				});
				let result = await promise;
				if (!result || result.isError)
					throw result || { isError: true, rc: 'emptyResult' };
				
				result = await this.wsIsBitti({ /*operKapatFlag: asBool(result.operKapatFlag)*/ });
				if (!result || result.isError)
					throw result || { isError: true, rc: 'emptyResult' };
			}
			catch (ex) {
				((window.savedProcs || {}).hideProgress || hideProgress)();
				defFailBlock(ex);
				throw ex;
			}
			finally {
				if ($target && $target.length)
					setButonEnabled($target, true);
			}

			try { await this.gerekirseTazele() }
			catch (ex) { }
		}

		async fn0Istendi(e) { return await this.fnIstendi($.extend({}, e, { id: 'primary' })) }
		async kesmeIstendi(e) { return await this.fnIstendi($.extend({}, e, { id: 'secondary' })) }
		tersKesme_tusaBasildi(e) { this.tersKesmeBasmaTS = now() }
		async tersKesme_tusBirakildi(e) {
			const delayMS = now() - (this.tersKesmeBasmaTS || now());
			return await this.fnIstendi($.extend({}, e, { id: 'f9', delayMS: delayMS }));
		}
		async kartOkutuldu(e) {
			const {kartNo} = e;
			const target = (e.event || {}).currentTarget;
			if (target)
				target.select()
			const result = await this.fnIstendi($.extend({}, e, { id: 'kart', kartNo: kartNo }));
			if (target)
				target.value = ''
			return result
		}
		fn_tusaBasildi(e) { this.fnBasmaTS = now() }
		async fnIstendi(e) {
			const {id, kartNo} = e; let {delayMS} = e;
			if (delayMS == null && id == 'f9')
				delayMS = now() - (this.fnBasmaTS || now())
			const target = (e.event || {}).currentTarget;
			const $target = target ? $(target) : null;
			if ($target?.length) setButonEnabled($target, false)
			try {
				const result = await this.wsFnIslemi({ id: id || '', kartNo: kartNo || '', delayMS: delayMS == null ? '' : delayMS });
				if (!result || result.isError)
					throw result || { isError: true, rc: 'emptyResult' };
			}
			catch (ex) {
				((window.savedProcs || {}).hideProgress || hideProgress)();
				defFailBlock(ex); throw ex
			}
			finally { if ($target?.length) { setButonEnabled($target, true); $target.focus() } }
			try { await this.gerekirseTazele() } catch (ex) { }
		}

		async wsTekilTezgahBilgi(e) {
			e = e || {};
			e.sync = !!e.sync;
			lastAjaxObj = $.ajax({
				cache: false, timeout: e.sync ? this.ajaxInfiniteMS : undefined,
				type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}tekilTezgahBilgi/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {};
			return result;
		}

		async wsSiradakiIsler(e) {
			if (this.class.isTest) {
				return [
					{ kod: 'a', aciklama: 'b'},
					{ kod: 'c', aciklama: 'd'}
				];
			}
			
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}siradakiIsler/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {};
			return result;
		}

		async wsDuraksamaNedenleri(e) {
			if (this.class.isTest) {
				return [
					{ kod: '01', aciklama: 'MOLA' },
					{ kod: '02', aciklama: 'VARDİYA DEĞİŞİMİ' },
					{ kod: '03', aciklama: 'MAKİNE ARIZASI' },
					{ kod: '04', aciklama: 'İŞ BEKLEME' }
				]
			}
			
			lastAjaxObj = $.ajax({
				cache: true, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}duraksamaNedenleri/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {};
			return result;
		}
		
		async wsIskartaNedenleri(e) {
			if (this.class.isTest) {
				return [
					{ kod: '01', aciklama: 'KESİM SORUNU' },
					{ kod: '02', aciklama: 'MAKINE BOZULDU' }
				]
			}
			
			lastAjaxObj = $.ajax({
				cache: true, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}iskartaNedenleri/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {};
			return result;
		}

		async wsBaslatDurdur(e) {
			if (this.class.isTest) {
				return { isError: false, result: true };
			}

			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}baslatDurdur/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {};
			return result;
		}

		async wsManuelGerceklemeYap(e) {
			if (this.class.isTest) {
				return { isError: false, result: true };
			}
			
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}manuelGerceklemeYap/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {};
			return result;
		}
		
		async wsGorevAta(e) {
			if (this.class.isTest) {
				return { isError: false, result: true };
			}
			
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}gorevAta/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {};
			return result;
		}

		async wsIsBitti(e) {
			if (this.class.isTest) {
				return { isError: false, result: true };
			}
			
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}isBitti/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {};
			return result;
		}

		async wsFnIslemi(e) {
			if (this.class.isTest) {
				return { isError: false, result: true };
			}
			
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput,
				url: `${this.wsURLBase}fnIslemi/?${$.param(this.buildAjaxArgs(e))}`
			});
			const result = (await lastAjaxObj) || {};
			return result;
		}
		
		buildAjaxArgs(e) {
			e = e || {};
			return $.extend(super.buildAjaxArgs(e) || {}, {
				ip: this.ip || '',
				tezgahKod: (this.tezgahBilgi || {}).id || ''
			});
		}
	}
})()
