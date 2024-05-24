(function() {
	window.CETForkliftFis = class extends window.CETDepoTransferFis {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				tamamlandimi: e.tamamlandimi == null ? true : asBool(e.tamamlandimi),
				transferTipKod: (e.transferTipKod || '').trimEnd()
			})
		}

		static get aciklama() { return `Forklift Taşıma` }
		static get adimTipi() { return `FORKLIFT` }
		static get fisGirisUISinif() { return CETForkliftFisGirisPart }
		static get degistirFisGirisUISinif() { return super.fisGirisUISinif }
		static get forkliftmi() { return true }

		hostVars(e) {
			e = e || {};
			let hv = super.hostVars();
			$.extend(hv, {
				tamamlandi: bool2FileStr(this.tamamlandimi),
				transferTipKod: this.transferTipKod || ''
			});

			return hv;
		}

		async setValues(e) {
			e = e || {};
			await super.setValues(e);

			const {rec} = e;
			$.extend(this, {
				tamamlandimi: asBool(rec.tamamlandi),
				transferTipKod: rec.transferTipKod || ''
			});
		}

		async onKontrol(e) {
			e = e || {};
			/*if (!this.transferTipKod)
				return this.error_onKontrol(`(Transfer Tipi) belirtilmelidir`, 'emptyValue');
			
			let result = parseInt(await this.dbMgr.tekilDegerExecuteSelect({
				tx: e.tx,
				query: `SELECT COUNT(*) sayi FROM mst_TransferYontemi WHERE rowid = ?`,
				params: [this.transferTipKod]
			}));
			if (!result)
				return this.error_onKontrol(`(${this.transferTipKod} kodlu Transfer Tipi) hatalıdır`, 'invalidValue');*/
			
			return await super.onKontrol(e);
		}

		async initBaslikUI_ara(e) {
			await super.initBaslikUI_ara(e);

			const parentPart = e.parentPart;
			const param = parentPart.param;
			const userSettings = param.userSettings = param.userSettings || {};
			const sonDegerler = userSettings.sonDegerler = userSettings.sonDegerler || {};

			const layout = e.layout;
			let savedParentWidth;
			/*if (true) {
				[`yerKod`, `refYerKod`].forEach(name => {
					const divSaha = layout.find(`#${name}`);
					if (divSaha) {
						divSaha.off('change');
						const sahaContainer = divSaha.length ? divSaha.parents(`.parent`) : null;
						if (sahaContainer && sahaContainer.length)
							sahaContainer.remove();
					}
				})
			}*/

			/*if (true) {
				let kod = this.transferTipKod;
				let sonDeger = sonDegerler.transferTipKod;

				const divSaha = layout.find(`#transferTipKod`);
				const sahaContainer = divSaha.parents(`.parent`);
				const divEtiket = sahaContainer.find(`.etiket`);
				let part = new CETMstComboBoxPart({
					parentPart: parentPart,
					content: divSaha,
					placeHolder: `Yöntem`,
					listeSinif: CETKAListePart, table: 'mst_ForkliftYontem',
					idSaha: 'kod', adiSaha: 'aciklama',
					selectedId: kod || sonDeger,
					widgetDuzenleyici: e => {
						savedParentWidth = e.widgetArgs.width = savedParentWidth || (
							e.widgetArgs.width - (divEtiket.width() ||  0) );
						e.widgetArgs.dropDownWidth = e.widgetArgs.width;
					},
					events: {
						comboBox_itemSelected: e => {
							kod = this.transferTipKod = (e.rec || {}).kod || e.value || sky.app.defaultForklifttransferTipKod || '';
							if (sonDeger != kod) {
								sonDeger = sonDegerler.transferTipKod = kod;
								parentPart.paramDegistimi = true;

								for (let i in this.detaylar) {
									const det = this.detaylar[i];
									det.ekOzelliklerDo({
										callback: _e => {
											const ekOzellik = _e.item;
											if (ekOzellik.tip == 'raf' || ekOzellik.tip == 'refRaf')
												ekOzellik.value = '';
										}
									})
								}
							}
						}
					}
				});
				sahaContainer.removeClass(`jqx-hidden`);
				part.basicRun();
			}*/
		}
	};
})()
