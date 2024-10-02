(function() {
	window.CETTahsilatGirisPart = class extends window.CETListeOrtakPart {
		static get partName() { return 'cetTahsilatGiris' } get fisGirisEkranimi() { return true }
		get adimText() { return 'Tahsilat Giriş Ekranı' } get yeniKayitmi() { return this.islem == 'yeni' || this.islem == 'kopya' }
		static get noResizeEvent() { return true }
		constructor(e) {
			e = e || {}; super(e); const param = this.app.param.deepCopy();
			$.extend(this, {
				islem: e.islem || 'yeni', param: param, eskiFis: e.eskiFis, fis: e.fis,
				kaydetOncesi: e.kaydetOncesi, kaydetIslemi: e.kaydetIslemi, kaydedince: e.kaydedince,
				hedefToplamBedel: (e.hedefToplamBedel == null ? null : bedel(e.hedefToplamBedel)),
				degistimi: false, idSaha: ''
			});
			if (!(this.layout || this.template)) { this.template = this.app.templates.tahsilat }
		}
		async activatePart(e) {
			await super.activatePart(e);
			setTimeout(() => {
				const {btnToggleFullScreen, chkOtoAktar, btnGonderimIsaretSifirla, btnLogout} = sky.app;
				if (btnToggleFullScreen?.length) { btnToggleFullScreen.addClass('jqx-hidden') }
				if (chkOtoAktar?.length) { chkOtoAktar.addClass('jqx-hidden') }
				if (btnGonderimIsaretSifirla?.length) { btnGonderimIsaretSifirla.addClass('jqx-hidden') }
				if (btnLogout?.length) { btnLogout.addClass('jqx-hidden') }
			}, 150)
		}
		async preInitLayout(e) {
			e = e || {}; await super.preInitLayout(e);
			const layout = e.layout || this.layout; this.dipTable = layout.find('#dipTable');
			this.templates = $.extend(this.templates || {}, { fisBaslik: layout.find('template#templates_fisBaslik') });
			let {fis} = this;
			if (!this.eskiFis) { this.eskiFis = fis; fis = this.fis = fis.deepCopy() }
			let {numaratorTip} = fis; const {ozelIsaret} = fis; if (ozelIsaret) { numaratorTip += `-${ozelIsaret}` }
			const {param} = this, num = fis.numarator;
			if (num && numaratorTip && (fis.gecicimi || this.yeniKayitmi)) {
				const fisTip2SonSeri = param.fisTip2SonSeri || {};
				let _seri = fis.seri; /*|| fisTip2SonSeri[numaratorTip];*/
				if (!_seri) { _seri = num.seri || fisTip2SonSeri[numaratorTip] }
				let seriDegistimi = false;
				if (_seri && num.seri != _seri) { num.seri = _seri; seriDegistimi = true; delete num.promise }
				num.seri = num.seri || ''; fis.seri = num.seri;
				if (seriDegistimi) { await num.yukle() }
				if (_seri == null /*&& fis.seri != fisTip2SonSeri[numaratorTip]*/) { fisTip2SonSeri[numaratorTip] = fis.seri; this.paramDegistimi = true }
			}
		}
		async postInitLayout(e) {
			e = e || {}; await super.postInitLayout(e);
			const layout = e.layout || this.layout, {fis} = this, islemYenimi = this.islem == `yeni`;
			let promiseMusteriDegisti = this.musteriDegisti($.extend({}, e, { initFlag: true }));
			let _e = { content: layout }; this.initBaslikPanel(_e);
			const userSettings = this.param.userSettings || {};
			$.extend(this, { kaydederkenYazdirFlag: userSettings.kaydederkenYazdir, kaydederkenAktarFlag: userSettings.kaydederkenAktar });
			const islemTuslari = this.islemTuslari;
			const chkKaydederkenYazdir = this.chkKaydederkenYazdir = islemTuslari.find('#chkKaydederkenYazdir').jqxToggleButton({ theme, toggled: asBool(this.kaydederkenYazdirFlag) });
			chkKaydederkenYazdir.jqxTooltip({ theme, trigger: `hover`, position: `bottom`, content: `Belge kaydedildikten sonra otomatik olarak <b>Yazıcıya Gönder</b>` });
			chkKaydederkenYazdir.on('click', evt => { this.kaydederkenYazdirFlag = userSettings.kaydederkenYazdir = chkKaydederkenYazdir.jqxToggleButton('toggled'); this.paramDegistimi = true });
			const chkKaydederkenAktar = this.chkKaydederkenAktar = islemTuslari.find('#chkKaydederkenAktar') .jqxToggleButton({ theme, toggled: asBool(this.kaydederkenAktarFlag) });
			chkKaydederkenAktar.jqxTooltip({ theme, trigger: `hover`, position: `bottom`, content: `Belge kaydedildikten sonra otomatik olarak Belgeyi <b>Merkeze Gönder</b>` });
			// chkKaydederkenAktar.off('click');
			chkKaydederkenAktar.on('click', evt => { this.kaydederkenAktarFlag = userSettings.kaydederkenAktar = chkKaydederkenAktar.jqxToggleButton('toggled'); this.paramDegistimi = true });
			this.degistimi = false; this.onResize(e);
			setTimeout(() => { hideProgress(); this.degistimi = false }, 1500);
		}
		async destroyPart(e) {
			e = e || {}; const layout = e.layout || this.layout;
			const {btnKaydet} = this; if (btnKaydet?.length) { btnKaydet.detach().appendTo(layout) }
			const {btnToggleFullScreen, chkOtoAktar, btnGonderimIsaretSifirla, btnLogout} = sky.app;
			setTimeout(() => {
				if (btnToggleFullScreen?.length) { btnToggleFullScreen.removeClass('jqx-hidden') }
				if (chkOtoAktar?.length) { chkOtoAktar.removeClass('jqx-hidden') }
				if (btnGonderimIsaretSifirla?.length) { btnGonderimIsaretSifirla.removeClass('jqx-hidden') }
				if (btnLogout?.length) { btnLogout.removeClass('jqx-hidden') }
			}, 100);
			return await super.destroyPart(e)
		}
		async initMustBilgi(e) {
			e = e || {}; const layout = this.layout; if (!layout?.length) { return }
			const {app} = this, {bakiyeRiskGosterilmezmi, musteriDegistirilirmi, musteriRotaZorunlumu, konumTakibiYapilirmi} = app, dbMgr = app.dbMgrs.rom_data, divMustBilgi = layout.find(`#mustBilgi`);
			const {fis} = this; if (!fis.class.musteriKullanilirmi) { divMustBilgi.addClass('jqx-hidden'); return }
			let {mustKod} = fis; if (mustKod) {
				let stm, rec = fis.getCariEkBilgi ? await fis.getCariEkBilgi(e) : null;
				if (!rec) {
					stm = new MQStm({ sent: new MQSent({ from: `mst_Cari`, where: [{ degerAta: mustKod, saha: 'kod' }], sahalar: ['unvan', 'adres', 'yore', 'ilAdi'] }) });
					rec = await dbMgr.tekilExecuteSelect({ query: stm })
				}
				let unvan; if (rec) {
					unvan = (rec.unvan || '').trim();
					const {konSubeAdi} = rec; if (konSubeAdi) { unvan += ` (<span class="bold green">${konSubeAdi}</span>)` }
					divMustBilgi.find('.adresText').html(`${rec.adres || ''} ${rec.yore || ''}` + (rec.ilAdi ? ` / ${rec.ilAdi}` : ''))
				}
				divMustBilgi.find('.mustText').html(new CKodVeAdi({ kod: mustKod, aciklama: unvan }).parantezliOzet({ styled: true }));
				const riskCariKod = await fis.getRiskCariKod(e);
				stm = new MQStm({
					sent: new MQSent({
						from: `mst_Cari`, where: [{ degerAta: riskCariKod, saha: 'kod' }],
						sahalar: [`bakiye`, `riskLimiti`, `riskli`, 'takipBorcLimiti', 'takipBorc']
					})
				});
				rec = await dbMgr.tekilExecuteSelect({ query: stm });
				const bakiye = !rec || bakiyeRiskGosterilmezmi ? `` : bedel(rec.bakiye), kalanRisk = !rec || bakiyeRiskGosterilmezmi ? `` : rec.riskLimiti ? bedel(rec.riskLimiti - rec.riskli) : `-Limit Yok-`;
				const kalanTakipBorc = !rec || bakiyeRiskGosterilmezmi ? `` : rec.takipBorcLimiti ? bedel(rec.takipBorcLimiti - rec.takipBorc) : ``;
				if (bakiye || kalanRisk || kalanTakipBorc) {
					let elm = divMustBilgi.find('.bakiyeText').html(typeof bakiye == 'number' ? `${bedelStr(bakiye)}` : bakiye || ``);
					if (typeof bakiye != 'number') { elm.addClass(`gray bold`) } else if (bakiye < 0) { elm.addClass(`red`) }
					elm = divMustBilgi.find('.kalanRiskText').html(typeof kalanRisk == 'number' ? `${bedelStr(kalanRisk)}` : kalanRisk || ``);
					if (typeof kalanRisk != 'number') { elm.addClass(`gray bold`) } else if (kalanRisk < 0) { elm.addClass(`red`) }
					elm = divMustBilgi.find('.kalanTakipBorcText').html(typeof kalanTakipBorc == 'number' ? `${bedelStr(kalanTakipBorc)}` : kalanTakipBorc || ``);
					if (typeof kalanTakipBorc != 'number') { elm.addClass(`gray bold`); divMustBilgi.find('.kalanTakipBorcParent').addClass('jqx-hidden') } else if (kalanTakipBorc < 0) { elm.addClass(`red`) }
					divMustBilgi.find('.bakiyeVeRiskBilgi').removeClass('jqx-hidden')
				}
				else { divMustBilgi.find('.bakiyeVeRiskBilgi').addClass('jqx-hidden') }
				const btnDegistir = divMustBilgi.find(`#btnDegistir`);
				if (btnDegistir.length) {
					btnDegistir.jqxButton({ theme }); btnDegistir.off('click');
					if (!musteriDegistirilirmi || musteriRotaZorunlumu || konumTakibiYapilirmi) {
						btnDegistir.addClass('jqx-hidden')
					}
					else {
						btnDegistir.on('click', async evt => {
							const result = await CETCariListePart.run({
								parentPart: this, targetRec: mustKod,
								secince: _e => setTimeout(async e => {
									const {fis} = this; mustKod = e.rec.kod; if (mustKod == fis.mustKod) { return }
									fis.mustKod = mustKod; fis.cacheReset();
									for (const key of ['satisKosulYapilari', 'promosyonYapilari']) { delete this[key] }
									await this.musteriDegisti(e); this.satirlariYenidenHesapla(e)
								}, 10, $.extend({}, e, _e))
							})
						});
						divMustBilgi.removeClass('jqx-hidden')
					}
				}
			}
			else { divMustBilgi.addClass('jqx-hidden') }
		}
		musteriDegisti(e) { this.initMustBilgi(e) }
		async initBaslikPanel(e) {
			const {fis} = this, {ozelIsaret} = fis, num = fis.numarator;
			let numaratorTip = fis.numaratorTip; if (ozelIsaret) { numaratorTip += `-${ozelIsaret}` }
			const {content} = e, subContent = this.baslik_content = content.find('.baslik .header');
			const navBar = this.baslik_navBar = content.find('.baslik .navBar');
			navBar.jqxNavigationBar({ theme, animationType, expandMode: 'toggle', width: false, toggleMode: 'none', expandAnimationDuration: 50, collapseAnimationDuration: 50, expandedIndexes: fis.aciklama ? [0] : [] });
			navBar.find('.jqx-expander-arrow').off('click').on('click', evt => {
				let widget = navBar.jqxNavigationBar('getInstance');
				const index = 0; if ($.inArray(index, widget.expandedIndexes) != -1) { widget.collapseAt(index) } else { widget.expandAt(index) }
			});
			let txtFisSeri = subContent.find('#fisSeri').jqxInput({ theme, width: 60, height: false, maxLength: 3 });
			txtFisSeri = this.txtFisSeri = subContent.find('#fisSeri'); txtFisSeri.val(fis.seri || '');
			txtFisSeri.on('change', evt => {
				let target = evt.args || evt.target; const seri = (target.value || '').toUpperCase(); evt.target.value = seri;
				if (numaratorTip && (fis.gecicimi || this.yeniKayitmi)) {
					const {param} = this, fisTip2SonSeri = param.fisTip2SonSeri = param.fisTip2SonSeri || {};
					if (fisTip2SonSeri[numaratorTip] != seri) { fisTip2SonSeri[numaratorTip] = seri; this.paramDegistimi = true }
				}
				this.fis.seri = seri
			});
			let txtFisNo = subContent.find('#fisNo').attr('maxLength', 9)
				.jqxNumberInput({ theme, width: 165, inputMode: 'simple', min: 0, max: 999999999, decimalDigits: 0, spinButtons: true, spinButtonsWidth: 32, decimal: asInteger(fis.fisNo) || null });
			txtFisNo = this.txtFisNo = subContent.find('#fisNo');
			txtFisNo.on('change', evt => { let target = evt.args || evt.target; this.fis.fisNo = asInteger(target.value) });
			let fisSeriNoDegisti = async evt => {
				if (num && (fis.gecicimi || this.yeniKayitmi)) {
					num.seri = txtFisSeri.val() || ''; delete num.promise; await num.yukle();
					txtFisNo.jqxNumberInput('placeHolder', num.sonNo + 1);
					this.app.setUniqueTimeout({
						key: `fisSeriNoDegisti_fisNoVal_fix`, delayMS: 500, args: { txtFisNo },
						block: e => { let val = txtFisNo.val(); if (!val && val != null) { txtFisNo.val(val = null) } }
					});
				}
			}
			subContent.find(`#fisSeri, #fisNo input`).on('change', evt => fisSeriNoDegisti(evt));
			subContent.find('#fisNo .jqx-action-button').on('click, touchend', evt => fisSeriNoDegisti(evt));
			if (fis.numarator && (fis.gecicimi || this.yeniKayitmi)) { (async () => { await num.promise; txtFisNo.jqxNumberInput('placeHolder', fis.numarator.sonNo + 1) })() }

			const ci = Date.CultureInfo;
			let txtTarih = this.txtTarih = content.find('#tarih');
			txtTarih.datepicker({
				changeMonth: true, changeYear: true, theme, constrainInput: false, showButtonPanel: true, /* showOn: 'button', */
				buttonText: 'Tarih Seç', buttonImage: 'lib/calendar.gif', buttonImageOnly: true, dateFormat: /*ci.shortDate*/ 'dd.mm.yy', firstDay: ci.firstDayOfWeek, weekHeader: 'Hft.', showWeek: true,
				currentText: 'BUGÜN', closeText: 'KAPAT', dayNames: ci.dayNames, dayNamesShort: ci.abbreviatedDayNames, dayNamesMin: ci.shortestDayNames, monthNames: ci.monthNames, monthNamesShort: ci.abbreviatedMonthNames
			});
			txtTarih.val(dateToString(fis.tarih)); txtTarih.datepicker($.datepicker.regional['tr']);
			txtTarih.on('change', evt => {
				const input = $(evt.target); let val = input.val();
				if (val && !isInvalidDate(val)) { input.data('savedVal', val); fis.tarih = asDate(val) }
			});
			txtTarih.on('focusin', evt => { evt.target.select() });
			txtTarih.on('focusout', evt => {
				let input = $(evt.target), ch = input.val();
				let value = tarihDegerDuzenlenmis(ch, () => input.data('savedVal')); if (value) { evt.preventDefault(); input.val(value || ''); fis.tarih = asDate(value) }
			});
			const divOzelIsaretIndicator = content.find(`#ozelIsaretIndicator`);
			if (ozelIsaret) {
				let cssClassName; switch (ozelIsaret) { case '*': cssClassName = `yildiz`; break; case 'X': cssClassName = `X`; break }
				if (cssClassName) { divOzelIsaretIndicator.addClass(cssClassName); for (const elm of [subContent, content]) { elm.addClass(`ozelIsaret-${cssClassName}`) } }
				divOzelIsaretIndicator.html(ozelIsaret); divOzelIsaretIndicator.removeClass('jqx-hidden');
			}
			content.find('#notlar').val(fis.aciklama || '').on('change', evt => { let target = evt.args || evt.target; this.fis.aciklama = (target.value || '') });
			await this.initFisBaslikUI(e);
			content.find('input[type=text], input[type=textbox], input[type=textarea]').on('focus', evt => { evt.target.select() });
		}
		async initFisBaslikUI(e) {
			const {fis} = this, {adimTipi} = fis.class; if (!adimTipi) { return null }
			const templates = this.templates.fisBaslik; let baslikContentLayout = templates.contents(`div.${adimTipi}`); if (!baslikContentLayout.length) { return null }
			const content = e.content, subContent = content.find('.fisBaslik'); if (!subContent.length) { return null }
			baslikContentLayout = e.baslikContentLayout = baslikContentLayout.clone(true); baslikContentLayout.appendTo(subContent);
			await fis.initBaslikUI({ layout: baslikContentLayout }); return baslikContentLayout
		}
		async tazele(e) { let result = await super.tazele(e); this.degistimi = false; return result }
		async kaydet(e) {
			const sender = this, {fis, islem, eskiFis} = this, {gecicimi} = fis, layout = e.layout || this.layout;
			e = { sender, islem, fis, eskiFis, gecicimi, ...e };
			fis.detaylar = this.listeRecs.map(rec => { rec = $.isPlainObject(rec) ? new fis.class.detaySinif(rec) : rec; delete rec._visible; return rec });
			fis.dipHesapla(); let handler = this.kaydetOncesi || this.kaydetOncesiDefault; if (handler) { let result = await handler.call(this, e); if (result === false) { return false } }
			return await this.kaydetDevam(e)
		}
		kaydetOncesiDefault(e) { return true }
		async kaydetDevam(e) {
			e = e || {}; if (this.paramDegistimi) { const {param} = this.app; $.extend(param, this.param); param.kaydet() }
			const fis = e.fis = e.fis ?? this.fis;
			let handler = this.kaydetIslemi ?? this.kaydetDevam2; if (handler) { let result = await handler.call(this, e); if (!result) { return false } }
			this.degistimi = false; handler = this.kaydedince; if (handler) { handler.call(this, e) }
			return true
		}
		async kaydetDevam2(e) {
			e = e || {}; const fis = e.fis || this.fis, {islem, yeniKayitmi} = this, {dbMgr} = fis;
			let savedFisNo = fis.fisNo; const num = fis.numarator;
			if (num /*&& !(e.gecicimi || fis.gecicimi)*/) {
				$.extend(num, { seri: fis.seri, sonNo: num.sonNo + 1 });
				let numaratorIcinUygunmu = !fis.fisNo && (e.gecicimi || fis.gecicimi || yeniKayitmi);
				if (numaratorIcinUygunmu) {
					await num.kesinlestir({ yeniKayitmi: numaratorIcinUygunmu && yeniKayitmi, islem, dbMgr, fisSinif: fis.class, fisID: fis.id });
					fis.fisNo = num.sonNo || 1
				}
				if (savedFisNo) {
					let yeniNo = await num.fisNoDuzelt({ dbMgr: dbMgr, fisSinif: fis.class, fisID: fis.id, seri: fis.seri, fisNo: fis.fisNo || num.sonNo });
					if (fis.fisNo != yeniNo) { fis.fisNo = yeniNo || 1; if (numaratorIcinUygunmu) { num.sonNo = fis.fisNo; await num.kaydet() } }
				}
			}
			try {
				fis.gecicimi = false; let result = await fis.kaydet(e); if (!result || result.isError) { return result }
				await fis.geciciFisleriTemizle(); await dbMgr.transaction();
				if (savedFisNo && fis.fisNo != savedFisNo) { displayMessage(`<i>${savedFisNo}</i> olan Belge Numarası <b>${fis.fisNo}</b> olarak değişti.`, `Bilgilendirme`) }
				return result
			}
			catch (ex) {
				if (ex.rc == 'runtimeInterrupt' || ex.rc == 'userAbort') { return }
				console.error(`fiş kayıt hatası`, ex); displayMessage(`${ex.errorText || ex.message || ex}`, `@ Belge Kayıt İşlemi @`)
			}
			finally { if (fis) { fis.gecicimi = e.gecicimi } }
		}
		async listeArgsDuzenle(e) {
			await super.listeArgsDuzenle(e);
			$.extend(e.listeArgs, {
				editable: true, serverProcessing: false, pageable: true, filterable: true, columnsResize: false, showToolbar: false, toolbarHeight: 42, filterHeight: 28, filterMode: 'default',
				pageSize: this.userSettings_liste.pageSize || 8, /* pageSizeOptions: [4, 5, 6, 7, 8, 9, 10, 12, 15, 20] */ 
			});
		}
		async liste_columnsDuzenle(e) {
			await super.liste_columnsDuzenle(e);
			$.merge(e.listeColumns, [
				{ dataField: 'tahSekliNo', text: 'No', align: 'left', width: 60, editable: false, cellClassName: 'tahSekliNo cell-disabled', cellsFormat: 'n', cellsAlign: 'right' },
				{ dataField: 'tahSekliAdi', text: 'Tahsil Şekli Adı', align: 'left', editable: false, cellClassName: 'tahSekliAdi cell-disabled' },
				{ dataField: 'bedel', text: 'Bedel', align: 'left', cellsFormat: 'c2', width: 170, cellsAlign: 'right', cellClassName: 'bedel' }
			])
		}
		async initIslemTuslari(e) {
			e = e || {}; const layout = e.layout || this.layout, {fis, islem, yeniKayitmi} = this, degisiklikYapilabilirmi = (islem != 'izle') && !(fis.devreDisimi || fis.gonderildimi /*|| fis.gecicimi*/);
			let islemTuslari = this.islemTuslari = layout.find('.asil.islemTuslari'); islemTuslari.children('button').jqxButton({ theme }); islemTuslari.removeClass('jqx-hidden');
			const btnKaydet = this.btnKaydet = islemTuslari.find('#kaydet'); btnKaydet.off('click');
			if (!(degisiklikYapilabilirmi || (fis.gecicimi || yeniKayitmi))) { setButonEnabled(btnKaydet, false); btnKaydet.jqxButton('disabled', true); islemTuslari.children().addClass('jqx-hidden') }
			else { btnKaydet.off('click').on('click', evt => { this.kaydetIstendi({ ...e, event: evt }) }) }
			let islemTuslariPart = this.islemTuslariPart = new CETExpandableIslemTuslariPart({ templateItems: layout.find(`.toolbar-external.islemTuslari`), onItemClicked: e => this.liste_islemTusuTiklandi(e) });
			await islemTuslariPart.run();
			let itemKalaniYaz = islemTuslariPart.parentMenu.find(`#kalaniYaz.item`); if (!this.hedefToplamBedel) { itemKalaniYaz.remove() }
		}
		getDataAdapter_liste(e) {
			e = e || {}; const {app, fis} = this, detaySinif = fis.class.detaySinif;
			let source = {
				datatype: defaultOutput, datafields: [], url: app.wsURLBase, data: {},
				addRow: (rowID, rec, position, commit) => {
					if (this.disableEventsFlag) { return }
					for (const [key, value] of Object.entries(rec)) { rec[key] = value == null ? value : value.valueOf() }
                    fis.detaylar.push(detaySinif.From(rec)); commit(true); this.liste_degisti(); this.degistimi = true
                },
                updateRow: (rowID, rec, commit) => {
					if (this.disableEventsFlag) { return }
					let ind = this.listeRecs.findIndex(rec => rec.uid == rowID);
					const degistimi = rec && rec.bedel != fis.detaylar[ind]?.bedel; if (!degistimi) { return }
                	for (const [key, value] of Object.entries(rec)) { rec[key] = value == null ? value : value.valueOf() }
                	fis.detaylar[ind] = detaySinif.From(rec); commit(true); this.liste_degisti(); this.degistimi = true
                },
                deleteRow: (rowID, commit) => {
                	if (this.disableEventsFlag) { return }
                	let ind = this.listeRecs.findIndex(rec => rec.uid == rowID); fis.detaylar.splice(ind, 1);
                    commit(true); this.liste_degisti(); this.degistimi = true;
                }
			};
			return new $.jqx.dataAdapter(source, {
				loadServerData: async (wsArgs, source, callback) => {
					try { await this.loadServerData({ ...e, wsArgs, source, callback }) }
					catch (ex) { defFailBlock(ex); callback({ totalrecords: 0, records: [] }); throw ex }
				}
			})
		}
		async loadServerData(e) {
			let queryYapi = this.tahsilSekliStm(e), recs = [];
			if (queryYapi) {
				const {app, fis} = this, {detaySinif} = fis.class, dbMgr = app.dbMgrs.rom_data;
				let promise = dbMgr.executeSqlReturnRows(queryYapi), tahSekliNo2Detay = this.tahSekliNo2Detay = {};
				for (const det of fis.detaylar) { tahSekliNo2Detay[det.tahSekliNo] = det }
				let _recs = await promise; for (const _rec of _recs) {
					let kodNo = _rec.kodNo, rec = tahSekliNo2Detay[kodNo] || new detaySinif({ tahSekliNo: kodNo, tahSekliAdi: '??', bedel: 0 });
					rec.tahSekliAdi = _rec.aciklama; recs.push(rec)
				}
			}
			e.callback({ totalrecords: recs.length, records: recs })
		}
		tahsilSekliStm(e) {
			return new MQStm({
				sent: new MQSent({
					from: 'mst_TahsilSekli tsek',
					where: [
						'tsek.kodNo > 0',
						new MQOrClause([
							{ inDizi: ['NK', 'PS'], saha: `tsek.tahsilTipi` },
							new MQSubWhereClause([
								{ degerAta: '', saha: `tsek.tahsilTipi` },
								{ inDizi: ['CK', 'SN', 'C', 'S'], saha: `tsek.tahsilAltTipi` }
							])
						])
					],
					sahalar: ['tsek.kodNo', 'tsek.aciklama', 'tsek.tahsilTipi', 'tsek.tahsilAltTipi DESC']
				})
			})
		}
		focusToDefault() { this.setUniqueTimeout({ key: 'focusToDefault', delayMS: 100, isInterval: false, block: e => { this.divListe.focus() } }) }
		async geriYapilabilirmi(e) {
			if (!await super.geriYapilabilirmi(e)) { return false }
			if (!this.degistimi) { return true }
			return await new Promise(then => {
				displayMessage(
					'Ekranda değişiklik yapılmış, yine de çıkılsın mı?', this.app.appText, true,
					{ EVET: (dlgUI, btnUI) => { dlgUI.jqxWindow('destroy'); then(true) }, HAYIR: (dlgUI, btnUI) => { dlgUI.jqxWindow('destroy'); then(false) } }
				)
			})
		}
		async liste_veriYuklendi(e) {
			await super.liste_veriYuklendi(e); if (!this.listeReadyFlag) { return }
			this.listeWidget.filtercolumnsList.val('tahSekliAdi');
			setTimeout(async () => {
				if (!this.isListeVeriYuklendiEventTriggered) { await this.selectFirstRec(); this.isListeVeriYuklendiEventTriggered = true }
				this.degistimi = false
			}, 10)
		}
		async liste_degisti(e) {
			e = e || {}; const {fis, dipTable} = this, {hedefToplamBedel} = this; await fis.dipHesapla();
			let uiSetValue = e => { let ui = dipTable.find(e.selector); if (e.value) { ui.html(`${bedelStr(e.value)}`); ui.parent().removeClass('jqx-hidden basic-hidden') }  }
			if (hedefToplamBedel) { uiSetValue({ selector: '#fisBedel', value: hedefToplamBedel }) }
			uiSetValue({ selector: '#toplamBedel', value: fis.toplamBedel })
		}
		liste_satirCiftTiklandi(e) { if (!this.isEventFired_satirCifTiklandi) { this.isEventFired_satirCifTiklandi = true; return } }
		liste_satirTiklandi(e) { super.liste_satirTiklandi(e); this.selectedDataField = e.event.args.dataField }
		liste_satirSecildi(e) {
			e = e || {}; const lastSelectedIndex = e.lastSelectedIndex || this.lastSelectedIndex;
			super.liste_satirSecildi(e); if (!this.listeReadyFlag || this.lastSelectedIndex != lastSelectedIndex) { return }
			let dataField = this.selectedDataField || 'bedel', rec = this.selectedRec;
			if (rec) {
				const {listeWidget} = this; if (listeWidget.isBindingCompleted() && !listeWidget.updating()) {
					let {editingCell} = this; if (editingCell) {
						try { if (!listeWidget._validateEditors(editingCell.dataField)) { delete this.editingCell; return } } catch (ex) { }
						try { listeWidget.endCellEdit(editingCell.rowIndex, editingCell.dataField, false) } catch (ex) { }
						editingCell = this.editingCell
					}
					try { listeWidget.beginCellEdit(listeWidget.getrowdisplayindex(rec), dataField) } catch (ex) { }
				}
			}
		}
		async liste_islemTusuTiklandi(e) {
			let elm = e.event.currentTarget;
			switch (elm.id) { case 'kalaniYaz': this.kalaniYazIstendi(e); break; case 'sil': this.silIstendi(e); break; case 'filter': this.liste_toggleFilterBar(e); break }
		}
		async kalaniYazIstendi(e) {
			e = e || {}; const {listeWidget} = this;
			let editingIndex = this.editingRowIndex; if (editingIndex != null) { try { listeWidget.endRowEdit(editingIndex, false) } catch (ex) { } }
			let recs = this.listeRecs, rec = editingIndex ? recs[editingIndex] : this.selectedRec, kalan = bedel(this.hedefToplamBedel) || 0;
			for (const _rec of recs) { if (_rec != rec && _rec.bedel) { kalan -= _rec.bedel } }
			kalan = bedel(kalan); if (kalan > 0) {
				let {uid} = rec; rec = rec.deepCopy ? rec.deepCopy() : $.extend(true, {}, rec); delete rec.uid;
				rec.bedel = kalan; listeWidget.updaterowbykey(uid, rec)
			}
			this.focusToDefault()
		}
		async silIstendi(e) {
			e = e || {}; const {listeWidget} = this;
			let {editingIndex} = this; if (editingIndex != null) { try { listeWidget.endRowEdit(editingIndex, false) } catch (ex) { } }
			let recs = this.listeRecs, rec = editingIndex ? recs[editingIndex] : this.selectedRec;
			rec.bedel = 0; this.degistir({ rec }); this.focusToDefault()
		}
		async kaydetIstendi(e) { let result = await this.kaydet(e); if (result && !result.isError) { this.geriIstendi() } return result }
	}
})()
