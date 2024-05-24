(function() {
	window.CETCariTanimPart = class extends window.CETSubPart {
		constructor(e) {
			e = e || {};
			super(e);
			
			const {app} = this;
			$.extend(this, {
				param: app.param,
				kaydetIslemi: e.kaydetIslemi
			});
			if (!(this.layout || this.template))
				this.template = app.templates.cariTanim;
		}

		static get partName() { return 'cetCariTanim' }
		get adimText() { return 'Cari Tanım' }


		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);

			const layout = e.layout || this.layout;
			const btnKaydet = this.btnKaydet
				= layout.find(`#kaydet`)
					.jqxButton({ theme: theme, width: 40, height: 45 });
			btnKaydet.on('click', evt =>
				this.kaydetIstendi($.extend({}, e, { event: evt })));
			
			const txtVKN = this.txtVKN = layout.find(`#vknParent #vkn`);
			txtVKN.on('change', evt =>
				this.vknDegisti($.extend({}, e, { event: evt })));
			
			const txtUnvan = this.txtUnvan = layout.find(`#unvanParent #unvan`);

			const txtYore = this.txtYore = layout.find(`#yoreVeIlParent #yore`);
			const ddIl = this.ddIl = layout.find(`#yoreVeIlParent #il`);
			ddIl.jqxDropDownList({
				theme: theme, animationType: animationType,
				valueMember: 'Kod', displayMember: 'Aciklama',
				selectedIndex: 0, searchMode: 'containsignorecase',
				placeHolder: 'İl', filterPlaceHolder: 'Bul:', filterable: true, filterHeight: 50, filterDelay: 300,
				dropDownHeight: 350, autoDropDownHeight: false, itemHeight: 35, scrollBarSize: 18,
				width: 184,
				source: new $.jqx.dataAdapter({
					id: 'Kod', url: `../data/il.xml`, datatype: `xml`,
					cache: true, root: 'Iller', record: 'Il',
					datafields: [
						{ name: 'Kod', type: 'string' },
						{ name: 'Aciklama', type: 'string' }
					]
				}, { autoBind: true, async: true, cache: true })
			});
			ddIl.on('change', evt => {
				//if (evt && evt.target)
					//this.dokumDeviceTipDegisti({ kod: ddDokumDevice.val() });
			});

			const chkEFatFlagParent = this.chkEFatFlagParent = layout.find(`#efatFlagParent`);
			const chkEFatFlag = this.chkEFatFlag = chkEFatFlagParent.find(`#efatFlag`);
			/*chkEFatFlagParent.find(`label`)
				.off('mouseup, touchend')
				.on('mouseup, touchend', evt =>
					chkEFatFlag.prop('checked', !chkEFatFlag.prop('checked')));*/
			chkEFatFlag.on('change', evt =>
				chkEFatFlagParent[chkEFatFlag.prop('checked') ? 'addClass' : 'removeClass'](`checked`));
			
			const txtVergiDairesi = this.txtVergiDairesi = layout.find(`#vergiDairesiParent #vergiDairesi`);
			const txtAdres = this.txtAdres = layout.find(`#adresParent #adres`);

			const inputs = layout.find('input');
			inputs.on('focus', evt =>
				evt.target.select());
			inputs.on('keyup', evt => {
				const key = ((evt || {}).key || '').toString().toLowerCase();
				if (key == 'enter' || key == 'linefeed')
					this.kaydetIstendi(e);
			});
			
			setTimeout(() =>
				txtVKN.focus(),
				500);
		}

		async kaydet(e) {
			e = e || {};
			await this.uiSetValues(e);

			const errText = await this.onKontrolMesaji(e);
			if (errText) {
				displayMessage(`@ ${errText}`, this.adimText);
				return false;
			}

			const {app, layout, unvan, vkn} = this;
			const dbMgr = app.dbMgr_mf;
			let {tx} = e;
			const hasTx = !!tx;

			let sent = new MQSent({
				from: `mst_Cari`,
				sahalar: [`max(seq) sonSeq`]
			});
			let stm = new MQStm({ sent: sent });
			const sonSeq = await dbMgr.tekilDegerExecuteSelect({ tx: tx, query: stm });
			const seq = this.seq = sonSeq + 1; 
			const kod = this.kod = `WSAKT${seq.toString().padStart(4, '0')}`;

			let hv = {
				kod: kod,
				gonderildi: '',
				riskCariKod: kod,
				seq: seq,
				vkn: vkn,
				unvan: unvan,
				sahismi: (unvan.length == 11),
				yore: this.yore || '',
				ilKod: this.ilKod || '',
				ilAdi: this.ilAdi || '',
				vergiDaire: this.vergiDairesi || '',
				adres: this.adres || '',
				efatmi: bool2Int(this.efatmi),
			};
			let result = await dbMgr.insertOrReplaceTable({
				tx: tx, table: `mst_Cari`,
				mode: 'insert', hv: hv
			});

			return result;
		}

		uiSetValues(e) {
			const {layout} = this;
			$.extend(this, {
				vkn: layout.find(`#vknParent #vkn`).val(),
				unvan: layout.find(`#unvanParent #unvan`).val(),
				yore: layout.find(`#yoreVeIlParent #yore`).val(),
				ilKod: layout.find(`#yoreVeIlParent #il`).val() || '',
				ilAdi: (layout.find(`#yoreVeIlParent #il`).jqxDropDownList('getSelectedItem') || {}).label || null,
				efatmi: layout.find(`#efatFlagParent #efatFlag`).prop('checked'),
				vergiDairesi: layout.find(`#vergiDairesiParent #vergiDairesi`).val(),
				adres: layout.find(`#adresParent #adres`).val()
			});
		}

		async onKontrolMesaji(e) {
			const {app, layout, unvan, vergiDairesi, ilKod, vkn} = this;
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
			if (!ilKod) {
				const ddIl = layout.find(`#yoreVeIlParent #il`);
				ddIl.focus();
				ddIl.jqxDropDownList('open');
				return `<b>İl</b> belirtilmelidir`;
			}

			
			let sent = new MQSent({
				from: `mst_Cari`,
				where: [
					new MQOrClause([
						{ degerAta: unvan, saha: `unvan` },
						{ degerAta: vkn, saha: `vkn` }
					])
				],
				sahalar: [`unvan`, `vkn`]
			});
			let stm = new MQStm({ sent: sent });
			let rec = await dbMgr.tekilExecuteSelect({ tx: tx, query: stm });
			if (rec) {
				const ayniVKNmi = rec.vkn == vkn;
				const cakisanText = ayniVKNmi ? `VKN` : `Ünvan`;
				return (
					`Belirtilen <b>${cakisanText}</b> ile aynı olan başka bir Cari tanımı zaten var:<br/>` +
					`<ul style="margin-top: 3px; margin-bottom: 5px;"><li><span style="font-weight: bold;"><u>${ayniVKNmi ? rec.unvan : rec.vkn}</u></span></li></ul>`
				);
			}

			return null;
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

					let handler = this.kaydetIslemi;
					if (handler)
						result = await handler.call(this, { sender: this });
					
					if (result && !(result || {}).isError) {
						displayMessage(
							(
								`<b>(${this.kod}) ${this.unvan}</b> yeni cari tanımı kaydedildi<br/>` +
								`<ul style="margin-top: 3px; margin-bottom: 5px;"><li><span><u>VKN</u>: <b>${this.vkn}</b></span></li></ul>`
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

		vknDegisti(e) {
			e = e || {};
			const target = (e.event || {}).currentTarget;
			const value = target ? target.value : this.txtVKN.val();
			let uygunmu = value && value.length >= 10 && value.length <= 11 && !!asInteger(value);
			if (!uygunmu)
				return;
			
			this.clearUniqueTimeout({ key: 'vknDegisti' });
			this.setUniqueTimeout({
				key: 'vknDegisti',
				delayMS: 1000,
				args: e,
				block: async e =>
					await this.vknDegistiDevam(e)
			});
		}

		async vknDegistiDevam(e) {
			e = e || {};
		}
	}
})()
