(function() {
	window.CETCariTanimPart = class extends window.CETSubPart {
		constructor(e) {
			e = e || {};
			super(e);
			
			const {app} = this;
			$.extend(this, {
				param: app.param,
				kaydetIslemi: e.kaydetIslemi,
				inst: e.inst || {}
			});
			if (!(this.layout || this.template))
				this.template = app.templates.cariTanim
		}

		static get partName() { return 'cetCariTanim' }
		get adimText() { return 'Cari Tanım' }


		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);

			const layout = e.layout || this.layout;
			const subContent = layout.find('.subContent');
			Utils.makeScrollable(subContent);
			
			const btnKaydet = this.btnKaydet
				= layout.find(`#kaydet`)
					.jqxButton({ theme: theme, width: 40, height: 45 });
			btnKaydet.on('click', evt =>
				this.kaydetIstendi($.extend({}, e, { event: evt })));

			const ddCariTip = this.ddCariTip = new CETMstComboBoxPart({
				parentPart: this, width: 300, height: '100%',
				content: layout.find('#cariTip'), placeHolder: 'Cari Tip',
				listeSinif: CETKAListePart, table: 'mst_CariTip',
				idSaha: 'kod', adiSaha: 'aciklama'
			});
			ddCariTip.run();
			
			const txtVKN = this.txtVKN = layout.find(`#vknParent #vkn`);
			const txtUnvan = this.txtUnvan = layout.find(`#unvanParent #unvan`);
			const txtYore = this.txtYore = layout.find(`#yoreVeIlParent #yoreParent #yore`);

			const ddUlke = this.ddUlke = layout.find(`#ulkeParent #ulke`);
			ddUlke.jqxDropDownList({
				theme: theme, animationType: animationType,
				valueMember: 'Kod', displayMember: 'Aciklama', searchMode: 'containsignorecase',
				placeHolder: 'Ülke', filterPlaceHolder: 'Bul:', filterable: true, filterHeight: 50, filterDelay: 300,
				dropDownHeight: 350, autoDropDownHeight: false, itemHeight: 30, scrollBarSize: 18,
				width: 285, height: false,
				source: new $.jqx.dataAdapter({
					id: 'Kod', url: `../data/ulke.xml`, datatype: `xml`,
					cache: true, root: 'Ulkeler', record: 'Ulke',
					datafields: [
						{ name: 'Kod', type: 'string' },
						{ name: 'Aciklama', type: 'string' }
					]
				}, { autoBind: true, async: true, cache: true })
			});
			ddUlke.on('bindingComplete', evt => {
				ddUlke.val('');
				this.ulkeDegisti($.extend({}, e, { event: evt }))
			});
			ddUlke.on('change', evt =>
				this.ulkeDegisti($.extend({}, e, { event: evt })));
			
			const ilParent = this.ilParent = layout.find(`#yoreVeIlParent #ilParent`);
			const ddIl = this.ddIl = ilParent.find(`#il`);
			ddIl.jqxDropDownList({
				theme: theme, animationType: animationType,
				valueMember: 'Kod', displayMember: 'Aciklama', searchMode: 'containsignorecase',
				placeHolder: 'İl', filterPlaceHolder: 'Bul:', filterable: true, filterHeight: 50, filterDelay: 300,
				dropDownHeight: 350, autoDropDownHeight: false, itemHeight: 30, scrollBarSize: 18,
				width: 200, height: false,
				source: new $.jqx.dataAdapter({
					id: 'Kod', url: `../data/il.xml`, datatype: `xml`,
					cache: true, root: 'Iller', record: 'Il',
					datafields: [
						{ name: 'Kod', type: 'string' },
						{ name: 'Aciklama', type: 'string' }
					]
				}, { autoBind: true, async: true, cache: true })
			});

			const chkEFatFlagParent = this.chkEFatFlagParent = layout.find(`#efatFlagParent`);
			const chkEFatFlag = this.chkEFatFlag = chkEFatFlagParent.find(`#efatFlag`);
			/*chkEFatFlagParent.find(`label`)
				.off('mouseup, touchend')
				.on('mouseup, touchend', evt =>
					chkEFatFlag.prop('checked', !chkEFatFlag.prop('checked')));*/
			chkEFatFlag.on('change', evt =>
				chkEFatFlagParent[chkEFatFlag.prop('checked') ? 'addClass' : 'removeClass']('checked'));
			
			this.txtVergiDairesi = layout.find(`#vergiDairesiParent #vergiDairesi`);
			this.txtAdres = layout.find(`#adresParent #adres`);

			this.txtTel1 = layout.find(`#iletisimParent #telefonParent #tel1`);
			this.txtTel2 = layout.find(`#iletisimParent #telefonParent #tel2`);
			this.txtTel3 = layout.find(`#iletisimParent #telefonParent #tel3`);
			this.txtEMail = layout.find(`#iletisimParent #eMailParent #eMail`);
			/*this.txtDisTicaretFirma = layout.find(`#disTicaretFirmaParent #disTicaretFirma`);
			this.txtTCOlmayanUyruk = layout.find(`#tcOlmayanUyrukParent #tcOlmayanUyruk`);*/

			const inputs = layout.find('input');
			inputs.on('focus', evt =>
				evt.target.select());
			inputs.on('keyup', evt => {
				const key = ((evt || {}).key || '').toString().toLowerCase();
				if (key == 'enter' || key == 'linefeed')
					this.kaydetIstendi(e)
			});
			
			setTimeout(() => txtVKN.focus(), 500)
		}

		async kaydet(e) {
			e = e || {};
			await this.uiSetValues(e);

			const errText = await this.onKontrolMesaji(e);
			if (errText) {
				displayMessage(`@ ${errText}`, this.adimText);
				return false;
			}

			const {app, layout, inst} = this;
			const {unvan, vkn} = inst;
			const dbMgr = app.dbMgr_mf;
			let {tx} = e;
			const hasTx = !!tx;

			let sent = new MQSent({
				from: `mst_Cari`,
				sahalar: [`max(seq) sonSeq`]
			});
			let stm = new MQStm({ sent: sent });
			const sonSeq = await dbMgr.tekilDegerExecuteSelect({ tx: tx, query: stm });
			const seq = inst.seq = sonSeq + 1; 
			// const kod = inst.kod = `WSAKT${seq.toString().padStart(4, '0')}`;
			
			const kodPrefix = 'WS';
			let kodPostfix = 0;
			let temp = newGUID().replaceAll('-', '');
			let _now = now();
			for (let i = 0; i < temp.length; i += 2)
				kodPostfix += (temp.charCodeAt(i) * 10) + temp.charCodeAt(i + 1)
			kodPostfix = `${_now.toString('ddMMHHmm')}-${kodPostfix}`;
			kodPostfix = kodPostfix.toString();
			const kod = inst.kod = `${kodPrefix}${kodPostfix}`;

			let hv = {
				kod: kod,
				gonderildi: '',
				riskCariKod: kod,
				seq: seq,
				efatmi: bool2Int(inst.efatmi),
				unvan: unvan,
				sahismi: (unvan.length == 11),
				yore: inst.yore || '',
				ulkeKod: inst.ulkeKod || '',
				ulkeAdi: inst.ulkeAdi || '',
				ilKod: inst.ilKod || '',
				ilAdi: inst.ilAdi || '',
				eMail: inst.eMail || '',
				tel1: inst.tel1 || '',
				tel2: inst.tel2 || '',
				tel3: inst.tel3 || '',
				vkn: vkn,
				vergiDaire: inst.vergiDairesi || '',
				/*disTicaretFirma: inst.disTicaretFirma || '',
				tcOlmayanUyruk: inst.tcOlmayanUyruk || '',*/
				tipKod: inst.cariTip || '',
				adres: inst.adres || ''
			};
			let result = await dbMgr.insertOrReplaceTable({
				tx: tx, table: 'mst_Cari',
				mode: 'insert', hv: hv
			});
			return result
		}

		uiSetValues(e) {
			const {layout, inst} = this;
			const ulkeKod = layout.find(`#ulkeParent #ulke`).val() || '';
			$.extend(inst, {
				efatmi: layout.find(`#efatFlagParent #efatFlag`).prop('checked'),
				cariTip: this.ddCariTip.value || '',
				unvan: layout.find(`#unvanParent #unvan`).val(),
				yore: layout.find(`#yoreVeIlParent #yoreParent #yore`).val(),
				ulkeKod: ulkeKod,
				ulkeAdi: (layout.find(`#ulkeParent #ulke`).jqxDropDownList('getSelectedItem') || {}).label || null,
				ilKod: !ulkeKod ? (layout.find(`#yoreVeIlParent #ilParent #il`).val() || '') : '',
				ilAdi: !ulkeKod ? ((layout.find(`#yoreVeIlParent #ilParent #il`).jqxDropDownList('getSelectedItem') || {}).label || null) : '',
				tel1: layout.find(`#iletisimParent #telefonParent #tel1`).val() || '',
				tel2: layout.find(`#iletisimParent #telefonParent #tel2`).val() || '',
				tel3: layout.find(`#iletisimParent #telefonParent #tel3`).val() || '',
				eMail: layout.find(`#iletisimParent #eMailParent #eMail`).val() || '',
				vkn: layout.find(`#vknParent #vkn`).val(),
				vergiDairesi: layout.find(`#vergiDairesiParent #vergiDairesi`).val(),
				/*disTicaretFirma: layout.find(`#disTicaretFirmaParent #disTicaretFirma`).val(),
				tcOlmayanUyruk: layout.find(`#tcOlmayanUyrukParent #tcOlmayanUyruk`).val(),*/
				adres: layout.find(`#adresParent #adres`).val()
			})
		}

		async onKontrolMesaji(e) {
			const {app, layout, inst} = this;
			const {vkn,  unvan, vergiDairesi, ulkeKod, ilKod, cariTip} = inst;
			const dbMgr = app.dbMgr_mf;
			let {tx} = e;

			if (!vkn) {
				layout.find(`#vknParent #vkn`).focus();
				return `<b>Vergi</b> veya <b>TC Kimlik No</b> belirtilmelidir`;
			}
			if (vkn.length < 10 || vkn.length > 11) {
				layout.find(`#vknParent #vkn`).focus();
				return `<b>Vergi</b> veya <b>TC Kimlik No</b> uzunluğu <u>10 ile 11 hane arasında</u> olmalıdır`;
			}
			if (!asInteger(vkn)) {
				layout.find(`#vknParent #vkn`).focus();
				return `<b>Vergi</b> veya <b>TC Kimlik No</b> <u>10 ile 11 hane arasında</u> ve <u>NÜMERİK</u> olmalıdır`;
			}
			if (!unvan) {
				layout.find(`#unvanParent #unvan`).focus();
				return `<b>Ünvan</b> belirtilmelidir`;
			}
			if (unvan.length < 3) {
				layout.find(`#unvanParent #unvan`).focus();
				return `<b>Ünvan</b> bilgisi <u>3 haneden az</u> olamaz`;
			}
			if (!vergiDairesi) {
				layout.find(`#vergiDairesiParent #vergiDairesi`).focus();
				return `<b>Vergi Dairesi</b> belirtilmelidir`;
			}
			if (vergiDairesi.length < 3) {
				layout.find(`#vergiDairesiParent #vergiDairesi`).focus();
				return `<b>Vergi Dairesi</b> bilgisi <u>3 haneden az</u> olamaz`;
			}
			if (!ulkeKod && !ilKod) {
				const ddIl = layout.find(`#yoreVeIlParent #ilParent #il`);
				ddIl.focus();
				ddIl.jqxDropDownList('open');
				return `<b>İl</b> belirtilmelidir`;
			}
			
			let sent = new MQSent({
				from: 'mst_Cari',
				where: [
					new MQOrClause([
						{ degerAta: unvan, saha: 'unvan' },
						!ulkeKod ? { degerAta: vkn, saha: 'vkn' } : `1 = 2`
					])
				],
				sahalar: ['unvan', 'vkn']
			});
			let stm = new MQStm({ sent: sent });
			let rec = await dbMgr.tekilExecuteSelect({ tx: tx, query: stm });
			if (rec) {
				const ayniVKNmi = !ulkeKod ? (rec.vkn == vkn) : false;
				const cakisanText = ayniVKNmi ? `VKN` : `Ünvan`;
				return (
					`Belirtilen <b>${cakisanText}</b> ile aynı olan başka bir Cari tanımı zaten var:<br/>` +
					`<ul style="margin-top: 3px; margin-bottom: 5px;"><li><span style="font-weight: bold;"><u>${ayniVKNmi ? rec.unvan : rec.vkn}</u></span></li></ul>`
				)
			}

			if (cariTip) {
				sent = new MQSent({
					from: 'mst_CariTip',
					where: [{ degerAta: cariTip, saha: 'kod' }],
					sahalar: ['COUNT(*) sayi']
				});
				if (!asInteger(await dbMgr.tekilExecuteSelect({ tx: tx, query: new MQStm({ sent: sent }) })))
					return `<b>${cariTip}</b> kodlu <u>Cari Tip</u> değeri hatalıdır`
			}

			return null
		}

		async kaydetIstendi(e) {
			await showProgress(`Tanım kaydediliyor...`, null, 0);
			try {
				let result = await this.kaydet(e);
				if (result && !(result || {}).isError) {
					if (this.isComponent)
						await this.destroyPart(e);
					else
						await this.geriIstendi(e);

					const {inst} = this;
					let handler = this.kaydetIslemi;
					if (handler)
						result = await handler.call(this, { sender: this, inst: inst });
					
					if (result && !(result || {}).isError) {
						displayMessage(
							(
								`<b>(${inst.kod}) ${inst.unvan}</b> yeni cari tanımı kaydedildi<br/>` +
								`<ul style="margin-top: 3px; margin-bottom: 5px;"><li><span><u>VKN</u>: <b>${inst.vkn}</b></span></li></ul>`
							),
							this.adimText
						)
					}
				}
				
				return result;
			}
			finally {
				const app = this.app;
				if (app.hasKnobProgress)
					app.knobProgressHideWithReset({ delayMS: 1500 });
				else
					setTimeout(() => hideProgress(), 1500);
			}
		}

		ulkeDegisti(e) {
			e = e || {};
			const VKN_YurtDisi = '2222222222';
			const elm = $((e.event || {}).currentTarget);
			const value = ((elm ? elm.val() : null) || '').trim();

			const {txtVKN, ilParent} = this;
			const vkn = (txtVKN.val() || '').trim();
			if (!value) {
				if (vkn == VKN_YurtDisi)
					txtVKN.val('');
				ilParent.removeClass('jqx-hidden basic-hidden')
			}
			else {
				if (vkn != VKN_YurtDisi)
					txtVKN.val(VKN_YurtDisi);
				ilParent.addClass('basic-hidden')
			}
		}
	}
})()
