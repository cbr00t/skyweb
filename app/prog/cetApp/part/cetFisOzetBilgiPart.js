(function() {
	window.CETFisOzetBilgiPart = class extends window.CETListeOrtakPart {
		constructor(e) {
			e = e || {};
			super(e);

			const {app, parentPart} = this;
			if (!(this.layout || this.template))
				this.template = app.templates.fisOzetBilgi;
		}

		static get canDefer() { return true }
		static get canDestroy() { return true }
		static get partName() { return 'cetFisOzetBilgi' }
		get adimText() { return 'Fiş Özet Bilgi' }

		
		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);

			const layout = e.layout || this.layout;
			const {parentPart} = this;
			const {param, fis, islem, yeniKayitmi, fiyatGorurmu} = parentPart;

			const degisiklikYapilabilirmi = (islem != 'izle') && !(fis.devreDisimi || fis.gonderildimi /*|| fis.gecicimi*/);
			const islemTuslari = this.islemTuslari = layout.find('.asil.islemTuslari');
			islemTuslari.children('button').jqxButton({ theme: theme });
			islemTuslari.removeClass('jqx-hidden');
			
			const btnKaydet = this.btnKaydet = islemTuslari.find('#kaydet');
			btnKaydet.off('click');
			if (!(degisiklikYapilabilirmi || (fis.gecicimi || yeniKayitmi))) {
				if (!(this.prefetch || this.isPrefetch)) {
					setButonEnabled(btnKaydet, false);
					btnKaydet.jqxButton('disabled', true);
					// btnKaydet.addClass('jqx-hidden');
					islemTuslari.children().addClass('jqx-hidden');
				}
			}
			else {
				btnKaydet.on('click', evt =>
					this.kaydetIstendi($.extend({}, e, { event: evt })));
				// btnKaydet.jqxTooltip({ theme: theme, trigger: `hover`, content: `Belgeyi kaydet` });
			}

			const userSettings = param.userSettings || {};
			const chkKaydederkenYazdir = this.chkKaydederkenYazdir = islemTuslari.find('#chkKaydederkenYazdir')
				.jqxToggleButton({ theme: theme, toggled: asBool(parentPart.kaydederkenYazdirFlag) });
			chkKaydederkenYazdir.jqxTooltip({ theme: theme, trigger: `hover`, position: `bottom`, content: `Belge kaydedildikten sonra otomatik olarak <b>Yazıcıya Gönder</b>` });
			//chkKaydederkenYazdir.off('click');
			chkKaydederkenYazdir.on('click', evt => {
				parentPart.kaydederkenYazdirFlag = userSettings.kaydederkenYazdir = chkKaydederkenYazdir.jqxToggleButton('toggled');
				parentPart.paramDegistimi = true;
			});
			const chkKaydederkenAktar = this.chkKaydederkenAktar = islemTuslari.find('#chkKaydederkenAktar')
				.jqxToggleButton({ theme: theme, toggled: asBool(parentPart.kaydederkenAktarFlag) });
			chkKaydederkenAktar.jqxTooltip({ theme: theme, trigger: `hover`, position: `bottom`, content: `Belge kaydedildikten sonra otomatik olarak Belgeyi <b>Merkeze Gönder</b>` });
			//chkKaydederkenAktar.off('click');
			chkKaydederkenAktar.on('click', evt => {
				parentPart.kaydederkenAktarFlag = userSettings.kaydederkenAktar = chkKaydederkenAktar.jqxToggleButton('toggled');
				parentPart.paramDegistimi = true;
			});

			const header = this.header = layout.find(`#header`);
			const toplamParent = this.toplamParent = header.find(`#toplamParent`);
			const txtToplamMiktarText = this.txtToplamMiktarText = toplamParent.find(`#toplamMiktarText`);
			const txtToplamBrutBedelText = this.txtToplamBrutBedelText = toplamParent.find(`#toplamBrutBedelText`);
			const txtToplamKDVText = this.txtToplamKDVText = toplamParent.find(`#toplamKDVText`);
			const txtToplamNetBedelText = this.txtToplamNetBedelText = toplamParent.find(`#toplamNetBedelText`);

			if (!fiyatGorurmu) {
				const elmList = [txtToplamBrutBedelText, txtToplamKDVText, txtToplamNetBedelText];
				for (const i in elmList)
					elmList[i].parent().addClass(`jqx-hidden`);
			}
		}

		async activatePart(e) {
			e = e || {};
			await super.activatePart(e);

			const layout = e.layout || this.layout;
			const {parentPart} = this;
			const {param, fis, islem, yeniKayitmi} = parentPart;

			const islemTuslari = this.islemTuslari = layout.find('.asil.islemTuslari');
			islemTuslari.children('button').jqxButton({ theme: theme });
			islemTuslari.removeClass('jqx-hidden');
			
			this.tazele(e);
		}

		setParams(e) {
			super.setParams(e);

			this.secButonuKontrolEdilirmi = false;
			this.secinceGeriYapilmazFlag = true;
			this.selectFilterKey = 'shKod';
		}

		async listeArgsDuzenle(e) {
			await super.listeArgsDuzenle(e);
			
			$.extend(e.listeArgs, {
				pageable: true, showToolbar: false, filterable: true,
				serverProcessing: false, filterMode: 'default',
				height: $(window).height() - 100
			});
		}

		async liste_columnsDuzenle(e) {
			await super.liste_columnsDuzenle(e);

			const {fiyatGorurmu} = this.parentPart;
			const {listeColumns} = e;
			$.merge(listeColumns, [
				{ text: 'Barkod', align: 'left', dataField: 'barkod', cellClassName: 'barkod', width: 120 },
				{ text: 'Kod', align: 'left', dataField: 'shKod', cellClassName: 'shKod', width: 100 },
				{ text: 'Ürün adı', align: 'left', dataField: 'shAdi', cellClassName: 'shAdi' },
				{ text: 'Ek Özellikler', align: 'left', dataField: 'sadeceOzellikAnahtarStr', cellClassName: 'ekOzellikler', width: 90 },
				{ text: 'Miktar', align: 'right', cellsAlign: 'right', dataField: 'miktar', cellClassName: 'miktar', cellsFormat: 'd', width: 90 }
			]);
			if (fiyatGorurmu)
				listeColumns.push({ text: 'Bedel', align: 'right', cellsAlign: 'right', dataField: 'netBedel', cellClassName: 'netBedel', cellsFormat: 'd2', width: 120 });
			
		}
		
		async loadServerData(e) {
			const {parentPart} = this;
			const recs = parentPart.fis.detaylar;
			e.callback({ totalrecords: recs.length, records: recs });
		}

		async tazele(e) {
			const {parentPart, toplamParent, txtToplamMiktarText, txtToplamBrutBedelText, txtToplamKDVText, txtToplamNetBedelText} = this;
			const {fis, fiyatGorurmu} = parentPart;
			
			const toplamBrm2Miktar = this.toplamBrm2Miktar = {};
			let toplamBrutBedel = this.toplamBrutBedel = 0;
			const {detaylar} = fis;
			for (const i in detaylar) {
				const det = detaylar[i];
				if (!det)
					continue;

				const brm = det.brm || 'AD';
				const {miktar, netBedel} = det;
				if (miktar != null)
					toplamBrm2Miktar[brm] = (toplamBrm2Miktar[brm] || 0) + miktar;
				if (netBedel)
					toplamBrutBedel += netBedel;
			}
			this.toplamBrutBedel = toplamBrutBedel;

			const icmal = await fis.gerekirseDipHesapla();
			const toplamNetBedel = this.toplamNetBedel = fis.sonucBedel;
			const toplamKDVBedel = this.toplamKDVBedel = (icmal || {}).topKdv;

			let toplamMiktarText = '';
			for (const brm in toplamBrm2Miktar) {
				if (toplamMiktarText)
					toplamMiktarText += ', ';
				const miktarStr = numberToString(toplamBrm2Miktar[brm]);
				toplamMiktarText += `${miktarStr} ${brm}`;
			}
			if (toplamMiktarText) {
				txtToplamMiktarText.html(toplamMiktarText);
				txtToplamMiktarText.parent().removeClass(`jqx-hidden`);
			}
			else {
				txtToplamMiktarText.parent().addClass(`jqx-hidden`);
			}

			if (toplamBrutBedel || toplamNetBedel) {
				let text;
				if (fiyatGorurmu) {
					text = bedelStr(toplamBrutBedel);
					txtToplamBrutBedelText.html(text);
				}
				txtToplamBrutBedelText.parent()[fiyatGorurmu && toplamBrutBedel ? 'removeClass' : 'addClass'](`jqx-hidden`);
				
				if (fiyatGorurmu) {
					text = bedelStr(toplamKDVBedel);
					txtToplamKDVText.html(text);
				}
				txtToplamKDVText.parent()[fiyatGorurmu && toplamKDVBedel ? 'removeClass' : 'addClass'](`jqx-hidden`);

				if (fiyatGorurmu) {
					text = bedelStr(toplamNetBedel);
					txtToplamNetBedelText.html(text);
				}
				txtToplamNetBedelText.parent()[fiyatGorurmu && toplamNetBedel ? 'removeClass' : 'addClass'](`jqx-hidden`);

				toplamParent.removeClass(`jqx-hidden`);
			}
			else {
				toplamParent.addClass(`jqx-hidden`);
			}
			toplamParent[toplamMiktarText || toplamNetBedel ? 'removeClass' : 'addClass'](`jqx-hidden`);
			
			await super.tazele(e);
		}

		async kaydetIstendi(e) {
			e = e || {};
			const {parentPart} = this;
			const result = await parentPart.kaydet(e);
			if (result && !result.isError) {
				await this.geriIstendiNoCallback();
				await parentPart.geriIstendi();
			}
			
			return result;
		}
	}
})()
