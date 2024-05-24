(function() {
	window.CETForkliftFisGirisPart = class extends window.CETListeOrtakPart {
		constructor(e) {
			e = e || {};
			super(e);
			
			const app = this.app;
			const param = app.param.deepCopy();
			const {fis} = e;
			$.extend(this, {
				islem: e.islem || 'yeni',
				param: param,
				eskiFis: e.eskiFis,
				fis: fis,
				kaydetOncesi: e.kaydetOncesi,
				kaydetIslemi: e.kaydetIslemi,
				kaydedince: e.kaydedince,
				degistimi: false,
				secinceGeriYapilmazFlag: true,
				islemTuslariLayout: false,
				idSaha: '',
				ayrisimAyiracli_barkod2Detay: {}
			});
			this.sonStokKontrolEdilirmi = app.sonStokKontrolEdilirmi && fis.class.sonStokKontrolEdilirmi;
			if (!(this.layout || this.template))
				this.template = app.templates.forkliftFisGiris;
		}

		static get partName() { return 'cetForkliftFisGiris' }
		get fisGirisEkranimi() { return true }
		get adimText() { return `${((this.fis || {}).class || {}).aciklama || 'Forklift'}` }

		get yeniKayitmi() {
			const {islem} = this;
			return islem == 'yeni' || islem == 'kopya'
		}


		async preInitLayout(e) {
			e = e || {};
			await super.preInitLayout(e);

			const layout = e.layout || this.layout;
			
			const {app, param} = this;
			let {fis} = this;
			if (!this.eskiFis) {
				this.eskiFis = fis;
				fis = this.fis = fis.deepCopy();
			}

			/*const num = fis.numarator;
			if (!this.yeniKayitmi && num && !fis.fisNo)
				$.extend(fis, { seri: num.seri, fisNo: num.sonNo + 1 });*/
			
			let {numaratorTip} = fis;
			if (numaratorTip == 'FORKLIFT')
				numaratorTip = CETDepoTransferFis.numaratorTip;
			
			const {ozelIsaret} = fis;
			if (ozelIsaret)
				numaratorTip += `-${ozelIsaret}`;

			const num = fis.numarator;
			if (num && numaratorTip && (fis.gecicimi || this.yeniKayitmi)) {
				const numEFatmi = num.eFatmi;
				const fisTip2SonSeri = param.fisTip2SonSeri || {};
				const _seri = numEFatmi ? num.seri : fis.seri /*|| fisTip2SonSeri[numaratorTip]*/;
				let seriDegistimi = false;
				if (_seri && num.seri != _seri) {
					num.seri = _seri;
					seriDegistimi = true;
					delete num.promise;
				}
				num.seri = num.seri || '';
				fis.seri = num.seri;
				if (seriDegistimi)
					await num.yukle();
				
				if (!numEFatmi && _seri == null /*&& fis.seri != fisTip2SonSeri[numaratorTip]*/) {
					fisTip2SonSeri[numaratorTip] = fis.seri;
					this.paramDegistimi = true;
				}
			}
		}

		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);
			
			const layout = e.layout || this.layout;
			const {fis} = this;
			const islemYenimi = this.islem == `yeni`;
			if (islemYenimi)
				fis.tamamlandimi = false;
			
			const userSettings = this.param.userSettings || {};
			$.extend(this, {
				kaydederkenAktarFlag: userSettings.kaydederkenAktar,
				/*kaydederkenYazdirFlag: userSettings.kaydederkenYazdir,
				otoBirlestirFlag: userSettings.otoBirlestirFlag*/
			});
			const islemTuslari = this.islemTuslari = layout.find(`.asil.islemTuslari`);
			const chkKaydederkenAktar = this.chkKaydederkenAktar = islemTuslari.find('#chkKaydederkenAktar')
				.jqxToggleButton({ theme: theme, toggled: asBool(this.kaydederkenAktarFlag) });
			chkKaydederkenAktar.jqxTooltip({ theme: theme, trigger: `hover`, position: `bottom`, content: `Belge kaydedildikten sonra otomatik olarak Belgeyi <b>Merkeze Gönder</b>` });
			chkKaydederkenAktar
				// .off('click')
				.on('click', evt => {
					this.kaydederkenAktarFlag = userSettings.kaydederkenAktar = chkKaydederkenAktar.jqxToggleButton('toggled');
					this.paramDegistimi = true;
				});
			const btnKaydet = this.btnKaydet = islemTuslari.find('#kaydet')
				.jqxButton({ theme: theme });
			// btnKaydet.jqxTooltip({ theme: theme, trigger: `hover`, position: `bottom`, content: `Belgeyi tamamla ve kaydet` });
			btnKaydet
				.off('click')
				.on('click', evt =>
					this.kaydetIstendi($.extend({}, e, { event: evt })));
			
			const btnEkle = this.btnEkle = layout.find('#ekle')
				.jqxButton({ theme: theme });
			// btnEkle.jqxTooltip({ theme: theme, trigger: `hover`, position: `bottom`, content: `Aktif taşıma işlemini onayla` });
			btnEkle
				.off('click')
				.on('click', evt =>
					this.ekleIstendi($.extend({}, e, { event: evt })));
			
			const btnSil = this.btnSil = layout.find('#sil')
				.jqxButton({ theme: theme });
			// btnSil.jqxTooltip({ theme: theme, trigger: `hover`, position: `bottom`, content: `Aktif taşımayı iptal et` });
			btnSil
				.off('click')
				.on('click', evt =>
					this.silIstendi($.extend({}, e, { event: evt })));
			
			this.initNavBar($.extend({}, e, { content: layout }));
			// this.initIslemTuslari(e);
			
			// setTimeout(() => layout.find('#fisNo input').focus(), 200);

			this.degistimi = false;
			setTimeout(() => hideProgress(), 100);
		}

		async activatePart(e) {
			await super.activatePart(e);
			
			const {btnToggleFullScreen, chkOtoAktar, btnGonderimIsaretSifirla, btnLogout} = sky.app;
			if (btnToggleFullScreen && btnToggleFullScreen.length)
				btnToggleFullScreen.addClass('jqx-hidden')
			if (chkOtoAktar && chkOtoAktar.length)
				chkOtoAktar.addClass('jqx-hidden')
			if (btnGonderimIsaretSifirla && btnGonderimIsaretSifirla.length)
				btnGonderimIsaretSifirla.addClass('jqx-hidden')
			if (btnLogout && btnLogout.length)
				btnLogout.addClass('jqx-hidden')
		}

		async destroyPart(e) {
			e = e || {};
			const layout = e.layout || this.layout;
			let btnKaydet = this.btnKaydet;
			if (btnKaydet) {
				btnKaydet.detach()
					.appendTo(layout)
			}

			const {btnToggleFullScreen, chkOtoAktar, btnGonderimIsaretSifirla, btnLogout} = sky.app;
			setTimeout(() => {
				if (btnToggleFullScreen && btnToggleFullScreen.length)
					btnToggleFullScreen.removeClass('jqx-hidden')
				if (chkOtoAktar && chkOtoAktar.length)
					chkOtoAktar.removeClass('jqx-hidden')
				if (btnGonderimIsaretSifirla && btnGonderimIsaretSifirla.length)
					btnGonderimIsaretSifirla.removeClass('jqx-hidden')
				if (btnLogout && btnLogout.length)
					btnLogout.removeClass('jqx-hidden')
			}, 100);

			if (this.barcodeReader) {
				this.barcodeReader.destroy();
				delete this.barcodeReader
			}

			return await super.destroyPart(e)
		}

		async initNavBar(e) {
			const {fis, sonStokKontrolEdilirmi} = this;
			const {numaratorTip} = fis;
			const num = fis.numarator;

			const content = e.content || this.layout;
			const navBar = this.navBar = content.find(`#navBar`);
			// const navBarWidth = navBar.width() || content.width();								
			navBar.jqxNavigationBar({
				theme: theme, animationType: animationType, expandMode: 'toggle',
				width: false, toggleMode: 'none', showArrow: false,
				expandAnimationDuration: 50, collapseAnimationDuration: 50,
				expandedIndexes: [],
				initContent: async index => {
					const {btnBarkod} = this;
					const aktifDetay = this.aktifDetay || {};
					let part;
					// btnBarkod.addClass(`jqx-hidden`);
					switch (index) {
						case 0:
							if (true) {
								part = this.transferYontemiPart;
								if (!part) {
									part = this.transferYontemiPart = new CETMstComboBoxPart({
										parentPart: this, content: content.find('#transferYontemi'),
										placeHolder: `Transfer Tipi`,
										table: 'mst_TransferYontemi',
										kodsuzmu: true, idSaha: 'rowid',
										events: {
											comboBox_stmDuzenleyici: e => {
												const alias = e.alias || 'mst';
												e.stm.sentDo(sent => {
													sent.fromIliski(`mst_Yer cYer`, `${alias}.cikisYerKod = cYer.kod`);
													sent.fromIliski(`mst_Yer gYer`, `${alias}.girisYerKod = gYer.kod`);
													sent.sahalar.addAll([
														`${alias}.cikisYerKod`, `${alias}.girisYerKod`
													]);
												})
											},
											comboBox_itemSelected: e =>
												this.transferYontemi_itemSelected(e)
										}
									});
									await part.run();
								}
								this.activePart = part;
							}
							break;
						case 1:
							if (true) {
								part = this.paletPart;
								if (!part) {
									part = this.paletPart = new CETMstComboBoxPart({
										parentPart: this, content: content.find('#palet'), placeHolder: `Palet`,
										listeSinif: CETStokListePart, table: 'mst_Stok',
										events: {
											comboBox_stmDuzenleyici: e =>
												true,
											liste_stmDuzenleyici: e => {
												e.sender.fis = this.fis;
												return true;
											},
											comboBox_itemSelected: e =>
												this.palet_itemSelected(e)
										},
										listedenSec_ekArgs: {
											fis: this.fis,
											sonStokKontrolEdilirmi: sonStokKontrolEdilirmi ? true : undefined,
											sonStokFilterDisabled: sonStokKontrolEdilirmi
										}
									});
									await part.run();
								}
								this.activePart = part;

								const {shKod} = aktifDetay;
								if (shKod) {
									part.comboBox_enterIstendi({ value: shKod });
									part.comboBoxWidget.source.dataBind();
								}
								// btnBarkod.removeClass(`jqx-hidden`);
							}
							break;
						case 2:
							if (true) {
								part = this.refRafPart;
								if (!part) {
									part = this.refRafPart = new CETMstComboBoxPart({
										parentPart: this, content: content.find('#refRaf'),
										placeHolder: 'Giriş Raf', kodsuzmu: true, listedenSecilmezFlag: false,
										table: 'mst_YerRaf', idSaha: `rafKod`, adiSaha: `rafKod`,
										events: {
											comboBox_stmDuzenleyici: e => {
												const alias = e.alias || 'mst';
												const {refYerKod} = this.fis;
												if (!refYerKod)
													return false;
												e.stm.sentDo(sent =>
													sent.where.degerAta(refYerKod, `${alias}.yerKod`));
											},
											comboBox_itemSelected: e =>
												this.refRaf_itemSelected(e)
										}
									});
									await part.run()
								}
								this.activePart = part;
								
								const {refRafKod} = aktifDetay;
								if (refRafKod) {
									part.comboBox_enterIstendi({ value: refRafKod });
									part.comboBoxWidget.source.dataBind()
								}
							}
							break
						case 3:
							if (true) {
								part = this.rafPart;
								if (!part) {
									part = this.rafPart = new CETMstComboBoxPart({
										parentPart: this, content: content.find('#raf'),
										placeHolder: 'Çıkış Raf', kodsuzmu: true, listedenSecilmezFlag: false,
										table: 'mst_YerRaf', idSaha: `rafKod`, adiSaha: `rafKod`,
										events: {
											comboBox_stmDuzenleyici: e => {
												const alias = e.alias || 'mst';
												const {yerKod} = this.fis;
												if (!yerKod)
													return false;
												e.stm.sentDo(sent =>
													sent.where.degerAta(yerKod, `${alias}.yerKod`));
											},
											comboBox_itemSelected: e =>
												this.raf_itemSelected(e)
										}
									});
									await part.run()
								}
								this.activePart = part;
								
								const {rafKod} = aktifDetay;
								if (rafKod) {
									part.comboBox_enterIstendi({ value: rafKod });
									part.comboBoxWidget.source.dataBind()
								}
							}
							break
					}
				},
				expandedIndexes: [0]
			});
			const navBarAfterExpandOrCollapseHandler = this.navBarAfterExpandOrCollapseHandler = e => {
				const widget = navBar.jqxNavigationBar('getInstance');
				const index = e.index == null ? asInteger($(e.event.target).parent().index() / 2) : e.index;
				const item = widget.items[index];
				if (item.disabled)
					return;
				
				const {collapseFlag} = e;
				navBar.find(`.expanded.jqx-hidden, .collapsed.jqx-hidden`)
					.removeClass(`jqx-hidden`);
				[item._headerText, item._content].forEach(divItemContentParent => {
					divItemContentParent = divItemContentParent ? $(divItemContentParent) : null;
					if (divItemContentParent) {
						(divItemContentParent.find(`.expanded`)
							[collapseFlag ? 'addClass' : 'removeClass'])(`jqx-hidden`);
						(divItemContentParent.find(`.collapsed`)
							[collapseFlag ? 'removeClass' : 'addClass'])(`jqx-hidden`)
					}
				});
				
				let _index = 0;
				while (_index <= index) {
					_index++;
					const _item = widget.items[_index];
					let divItemContentParent = _item == null ? null : _item._headerText;
					divItemContentParent = divItemContentParent ? $(divItemContentParent) : null;
					if (divItemContentParent)
						divItemContentParent.removeClass(`jqx-hidden`)
				}

				_index = index;
				while (true) {
					_index++;
					const _item = widget.items[_index];
					let divItemContentParent = _item == null ? null : _item._headerText;
					divItemContentParent = divItemContentParent ? $(divItemContentParent) : null;
					if (!divItemContentParent)
						break;
					divItemContentParent.addClass(`jqx-hidden`)
				}

				if (!collapseFlag) {
					setTimeout(() =>
						$(item._content).find(`input:eq(0)`).focus(),
						300)
				}
			};
			
			const navBarArrowClickHandler = this.navBarArrowClickHandler = async e => {
				const widget = navBar.jqxNavigationBar('getInstance');
				let index = e.index == null ? asInteger($(e.event.target).parent().index() / 2) : e.index;
				// const index = e.index == null ? asInteger($(e.event.target).parents(`.jqx-widget-header`).attr('tabindex')) : e.index;
				const item = widget.items[index];
				if (!item || (index == 0 && item.disabled))
					return;
				
				const collapseFlag = e.collapseFlag = item.expanded;
				if (collapseFlag) {
					if (!widget.expandedIndexes.includes(index))
						widget.collapseAt(index)
				}
				else {
					// this.btnEkle.addClass('jqx-hidden');
					switch (index) {
						case 0:
							fis.transferTipKod = '';
							fis.yerKod = fis.refYerKod = '';
							if (this.transferYontemiPart) {
								await this.transferYontemiPart.comboBox_enterIstendi({ value: fis.transferTipKod || '' });
								this.transferYontemiPart.comboBoxWidget.source.dataBind();
							}
							
							delete this.aktifDetay;
							if (this.paletPart) {
								await this.paletPart.comboBox_enterIstendi({ value: (this.aktifDetay || {}).shKod || '' });
								this.paletPart.comboBoxWidget.source.dataBind();
							}

							this.divListeParent.removeClass(`jqx-hidden`);
							break;
						case 1:
							if (!fis.refYerKod) {
								displayMessage(`<b>Transfer Yöntemi</b> seçilmelidir!`);
								return;
							}

							/*delete this.aktifDetay;*/
							if (this.paletPart) {
								await this.paletPart.comboBox_enterIstendi({ value: (this.aktifDetay || {}).shKod || '' });
								this.paletPart.comboBoxWidget.source.dataBind()
							}

							this.divListeParent.removeClass(`jqx-hidden`);
							this.hideNotifications();
							break
						case 2:
							if (!this.aktifDetay) {
								displayMessage(`<b>Palet</b> seçilmelidir!`);
								return
							}
							const refRafKod = (this.aktifDetay || {}).refRafKod || '';
							if (this.refRafPart) {
								await this.refRafPart.comboBox_enterIstendi({ value: refRafKod });
								this.refRafPart.comboBoxWidget.source.dataBind()
							}
							this.divListeParent.addClass(`jqx-hidden`);
							this.hideNotifications();
							break
						case 3:
							if (!this.aktifDetay) {
								displayMessage(`<b>Palet</b> seçilmelidir!`);
								return;
							}
							
							const _refRafKod = (this.aktifDetay || {}).refRafKod || '';
							if (!_refRafKod) {
								displayMessage(`<b>Giriş Raf</b> seçilmelidir!`);
								return;
							}
							
							const rafKod = (this.aktifDetay || {}).rafKod || '';
							if (rafKod) {
								index = e.index = 1;
								await this.ekleIstendi(e);
								setTimeout(() => {
									const w = this.paletPart.comboBoxWidget;
									w.close();
									w.focus()
								}, 500)
							}
							else {
								if (this.rafPart) {
									await this.rafPart.comboBox_enterIstendi({ value: rafKod });
									this.rafPart.comboBoxWidget.source.dataBind()
								}
								// this.navBar.jqxNavigationBar('disableAt', 1);
								this.divListeParent.addClass(`jqx-hidden`)
							}
							this.hideNotifications();
							break
					}

					if (index == 1 || index == 2) {
						navBar.find(`#topSayiText`).html(
							`${fis.detaylar.length.toLocaleString()} kalem`
						)
					}

					widget.expandAt(index);
					if (index == 3)
						widget.expandAt(index - 1)
				}
				
				navBarAfterExpandOrCollapseHandler(e);
			};
			/*navBar.find(`.jqx-expander-arrow`)
				.off('click, touchend, mouseup')
				.on('click, touchend, mouseup', evt =>
					navBarArrowClickHandler({ event: evt }));
			content.find(`.jqx-expander-header-content`)
				.off('click, mouseup, touchend')
				.on('click, mouseup, touchend', evt => {
					const {target} = evt;
					const tagName = target.tagName.toUpperCase();
					if (!(tagName == 'INPUT' || tagName == 'TEXTAREA' || tagName == 'BUTTON' || target.classList.contains(`jqx-input-icon`)))
						navBarArrowClickHandler({ event: evt });
				});*/
			
			if (!$.isEmptyObject(fis.detaylar)) {
				const det = fis.detaylar.slice(-1)[0];
				if (det.refRafKod)
					this.aktifDetay = det;
			}

			this.initFlag = false;
			setTimeout(async () => {
				const layout = e.layout || this.layout;
				layout.css(`opacity`, 0);
				
				const {transferTipKod, refYerKod, yerKod} = fis;
				if (!transferTipKod && (refYerKod && yerKod)) {
					// layout.find(`#transferYontemiText`).html(`${yerKod} -> ${refYerKod}`);
					layout.find(`#transferYontemiParent`)[transferTipKod ? 'removeClass' : 'addClass'](`jqx-hidden`);
					layout.find(`#transferYontemiText`).html(transferTipKod);
					layout.find(`#yerParent`)[yerKod || refYerKod ? 'removeClass' : 'addClass'](`jqx-hidden`);
					layout.find(`#yerKodText`).html(yerKod);
					layout.find(`#refYerKodText`).html(refYerKod)
				}
				
				const {aktifDetay} = this;
				const expandIndex =
						transferTipKod || (refYerKod && yerKod)
							? aktifDetay ? 2 : 1
							: 0;
				if (expandIndex)
					await navBarArrowClickHandler({ index: expandIndex, collapseFlag: false })
				else
					navBarAfterExpandOrCollapseHandler({ index: expandIndex, collapseFlag: false })
				
				setTimeout(async () => {
					if (transferTipKod)
						 await this.transferYontemiPart.comboBox_enterIstendi({ value: transferTipKod || '' });
					
					setTimeout(async () => {
						if (aktifDetay) {
							if (this.paletPart) {
								await this.paletPart.comboBox_enterIstendi({ value: aktifDetay.shKod || '' });
								setTimeout(() => this.afterInit(e), 100)
							}
							else {
								setTimeout(async () => {
									if (this.refRafPart) {
										await this.refRafPart.comboBox_enterIstendi({ value: aktifDetay.rafKod || '' });
										setTimeout(() => this.afterInit(e), 100)
									}
									else {
										await navBarArrowClickHandler({ index: 3, collapseFlag: true });
										setTimeout(() => this.afterInit(e), 100)
									}
								}, 100);
								await navBarArrowClickHandler({ index: 1, collapseFlag: true })
							}
						}
						else {
							setTimeout(() => this.afterInit(e), 100);
						}
					}, 10)
				}, 10)
			}, 10);
		}

		afterInit(e) {
			e = e || {}
			const layout = e.layout || this.layout;

			this.initFlag = true;
			layout.css(`opacity`, .3),
			setTimeout(() =>
				layout.css(`opacity`, 1),
				50);
		}

		async kaydet(e) {
			const fis = this.fis;
			e = $.extend({
				sender: this, islem: this.islem, eskiFis: this.eskiFis, gecicimi: fis.gecicimi
			}, e);
			
			const layout = e.layout || this.layout;
			$.extend(fis, {
				tamamlandimi: true,
				/*seri: layout.find('#fisSeri').val(),
				fisNo: layout.find('#fisNo').val(),
				aciklama: layout.find('#notlar').val()*/
			});
			await fis.dipHesapla();

			let handler = this.kaydetOncesi || this.kaydetOncesiDefault;
			if (handler) {
				let result = await handler.call(this, e);
				if (result === false)
					return false;
			}

			return await this.kaydetDevam(e);
		}

		kaydetOncesiDefault(e) {
			/*return new Promise(then => {
				let wnd = displayMessage(
					`Belge kaydedilsin mi?`,
					this.app.appText,
					true,
					{
						EVET: async (dlgUI, btnUI) => {
							dlgUI.jqxWindow('destroy');
							then(true)
						},
						HAYIR: (dlgUI, btnUI) => {
							dlgUI.jqxWindow('destroy');
							then(false)
						}
					});
				wnd.on('close', evt => {
					// dlgUI.jqxWindow('destroy');
				});
				wnd.jqxWindow('position', { x: 5, y: 50 });
			})*/

			return true;
		}

		async kaydetDevam(e) {
			e = e || {};
			const param = this.app.param;
			if (this.paramDegistimi)
				await param.kaydet();
			$.extend(param, this.param);

			const fis = e.fis || this.fis;
			if (!asBool(e.geciciKayitmi))
				fis.tamamlandimi = true;
			
			let handler = this.kaydetIslemi || this.kaydetDevam2;
			if (handler) {
				let result = await handler.call(this, e);
				if (!result)
					return false;
			}

			this.degistimi = false;
			handler = this.kaydedince;
			if (handler)
				handler.call(this, e);

			return true;
		}

		async kaydetDevam2(e) {
			const fis = e.fis || this.fis;
			const dbMgr = fis.dbMgr;
			
			e = $.extend({
				sender: e.sender || this,
				islem: e.islem || this.islem,
				eskiFis: e.eskiFis || this.eskiFis,
				gecicimi: e.gecicimi == null ? fis.gecicimi : e.gecicimi
			}, e);
			
			let savedFisNo = fis.fisNo;
			const num = fis.numarator;
			if (num /*&& !(e.gecicimi || fis.gecicimi)*/) {
				$.extend(num, { seri: fis.seri, sonNo: num.sonNo + 1 });
				let numaratorIcinUygunmu = !fis.fisNo && (e.gecicimi || fis.gecicimi || this.yeniKayitmi);
				if (numaratorIcinUygunmu) {
					await num.kesinlestir({ dbMgr: dbMgr, fisSinif: fis.class, fisID: fis.id });
					fis.fisNo = num.sonNo || 1;
				}

				if (savedFisNo) {
					let yeniNo = await num.fisNoDuzelt({ dbMgr: dbMgr, fisSinif: fis.class, fisID: fis.id, seri: fis.seri, fisNo: fis.fisNo || num.sonNo });
					if (fis.fisNo != yeniNo) {
						fis.fisNo = yeniNo || 1;
						if (numaratorIcinUygunmu) {
							num.sonNo = fis.fisNo;
							await num.kaydet();
						}
					}
				}
			}

			//let tx = await dbMgr.transaction();
			try {
				fis.gecicimi = false;
				// let result = await fis.kaydet($.extend({ tx: tx }, e));
				let result = await fis.kaydet(e);
				//if (!result)
				//	dbMgr.abortTransaction();
				if (!result || result.isError)
					return result;
				
				await fis.geciciFisleriTemizle();
				await dbMgr.transaction();
				
				if (savedFisNo && fis.fisNo != savedFisNo && !asBool(e.geciciKayitmi)) {
					displayMessage(
						`<i>${savedFisNo}</i> olan Belge Numarası <b>${fis.fisNo}</b> olarak değişti.`,
						`Bilgilendirme`
					)
				}

				return result;
			}
			catch (ex) {
				if (ex.rc == 'runtimeInterrupt' || ex.rc == 'userAbort')
					return;
				
				if (!asBool(e.geciciKayitmi))
					displayMessage(`${ex.errorText || ex.message || ex}`, `@ Belge Kayıt İşlemi @`);
				console.error(`fiş kayıt hatası`, ex);
			}
			finally {
				if (fis)
					fis.gecicimi = e.gecicimi;
			}
		}

		async initIslemTuslari(e) {
			e = e || {};
			const layout = e.layout || this.layout;
			const {fis} = this;
			const degisiklikYapilabilirmi = (this.islem != 'izle') && !(fis.devreDisimi || fis.gonderildimi /*|| fis.gecicimi*/);
			
			let islemTuslari = this.islemTuslari = layout.find('.asil.islemTuslari');
			islemTuslari.children('button').jqxButton({ theme: theme });
			islemTuslari.removeClass('jqx-hidden');
			
			const btnKaydet = this.btnKaydet = islemTuslari.find('#kaydet');
			btnKaydet.off('click');
			if (!(degisiklikYapilabilirmi || (fis.gecicimi || this.yeniKayitmi))) {
				setButonEnabled(btnKaydet, false);
				btnKaydet.jqxButton('disabled', true);
				// btnKaydet.addClass('jqx-hidden');
				islemTuslari.children().addClass('jqx-hidden');
			}
			else {
				btnKaydet.on('click', evt =>
					this.kaydetIstendi($.extend({}, e, { event: evt })));
			}

			if (this.ozelIslemTuslariPart)
				this.ozelIslemTuslariPart.destroyPart();
			let ozelIslemTuslariPart = this.ozelIslemTuslariPart = new CETExpandableIslemTuslariPart({
				// position: false,
				position: 'right bottom',
				mode: 'menu',
				templateItems: layout.find(`.toolbar-external.islemTuslari-ozel`),
				onItemClicked: e => this.islemTusuTiklandi(e)
			});
			ozelIslemTuslariPart.basicRun();
			/*ozelIslemTuslariPart.layout
				.detach()
				.prependTo(this.divListe);*/
			
			let parentMenu = ozelIslemTuslariPart.parentMenu;
			this.btnBarkod = parentMenu.find(`#barkod`)
				// .detach()
				// .appendTo(this.navBar.find(`#palet`).parent())
				.jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Kamera ile Barkod okut` });
			
			let islemTuslariPart = this.islemTuslariPart = new CETExpandableIslemTuslariPart({
				/* position: ``, */
				templateItems: layout.find(`.toolbar-external.islemTuslari`),
				onItemClicked: e => this.islemTusuTiklandi(e)
			});
			await islemTuslariPart.run();

			/*parentMenu = islemTuslariPart.parentMenu;
			parentMenu.find(`#degistir`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Seçili Detay Satırı üzerine Miktar/Fiyat/İskonto/Ek Özellik ... vb. degişikliklerin yapılabileceği ekranı açar` });
			parentMenu.find(`#temizle`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Belgedeki bütün kalemleri <span class="bold red">siler</span>` });
			parentMenu.find(`#fiyatGor`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Seçili Detaya ait Stok için, Belgedeki Müşteri'ye göre Fiyat bilgileri ve Son Stok durumunu gösterir` });
			parentMenu.find(`#birlestir`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Belgedeki detaylardan <u>AYNI ÖZELLİKTE OLAN</u> kalemleri birleştirir` });
			parentMenu.find(`#sablon`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Vio tarafında ilgili Satış Fatura/Sipariş Fiş Giriş ekranında <b>Şablon Sakla</b> özelliği ile tanımlanmış Belge Giriş Şablon'u seçimini sağlar` });
			*/
		}

		async listeArgsDuzenle(e) {
			await super.listeArgsDuzenle(e);
			
			$.extend(e.listeArgs, {
				/* editable: true, */ serverProcessing: false, pageable: true, columnsResize: false,
				filterable: false, filterMode: 'default',
				showToolbar: false, toolbarHeight: 0, filterHeight: 0, columnsHeight: 22, pagerHeight: 32,
				pageSize: this.userSettings_liste.pageSize || ($(window).width() < 450 ? 5 : 8),
				pageSizeOptions: [3, 4, 5, 6, 7, 8, 9, 10],
				height: $(window).width() < 450 ? 145 : 245
			});
		}

		async liste_columnsDuzenle(e) {
			await super.liste_columnsDuzenle(e);
			
			$.merge(e.listeColumns, [
				{
					text: 'Ürün Adı', align: 'left', dataField: 'shAdi',
					cellClassName: (rowIndex, columnField, value, rec) => {
						if (this.listeWidget.getrowindex(rec) + 1 == this.fis.detaylar.length)
							return `aktifDetay`;
					},
					cellsRenderer: (rowIndex, columnIndex, value, rec) => {
						rec = rec.originalRecord || rec;
						let divSatir = this.newListeSatirDiv(e);
						divSatir.attr('data-index', rowIndex);

						$.each(rec, (key, value) => {
							let item = divSatir.find(`.${key}`);
							if (item.length)
								item.html(value);
						});
						
						const {miktar} = rec;
						const divMiktar = divSatir.find(`.miktar`);
						if (divMiktar.length) {
							let miktarText = rec.paketKod ? `${rec.paketMiktar || 1} ${rec.paketKod} = ` : ``;
							miktarText += `${(miktar || 1).toLocaleString()}`;
							divMiktar.html(miktarText);
						}
						
						const rafKodParent = divSatir.find(`.rafKodParent`);
						let ekOzellik = this.fis.class.rafKullanilirmi ? rec.ekOzellik_raf : null;
						if (ekOzellik) {
							const {value} = ekOzellik;
							if (value) {
								rafKodParent.removeClass(`jqx-hidden`);
								rafKodParent.find(`.rafKod`).html(value);
							}
							else {
								rafKodParent.addClass(`jqx-hidden`);
							}
						}
						else {
							rafKodParent.addClass(`jqx-hidden`);
						}

						const refRafKodParent = divSatir.find(`.refRafKodParent`);
						ekOzellik = this.fis.class.refRafKullanilirmi ? rec.ekOzellik_refRaf : null;
						if (ekOzellik) {
							const {value} = ekOzellik;
							if (value) {
								refRafKodParent.removeClass(`jqx-hidden`);
								refRafKodParent.find(`.refRafKod`).html(value);
							}
							else {
								refRafKodParent.addClass(`jqx-hidden`);
							}
						}
						else {
							refRafKodParent.addClass(`jqx-hidden`);
						}
						
						/*divSatir.find(`.kdvOraniText`)
							.html(`%${rec.kdvOrani}`);
						
						let netBedel = rec.netBedel;
						if (netBedel)
							divSatir.find(`.netBedel`).html(bedelStr(netBedel));*/
						
						return divSatir[0].outerHTML.trim();
					}
				},
				{ text: 'Ürün Kod', align: 'left', dataField: 'shKod', hidden: true }
				/*{ text: 'Bedel', align: 'right', dataField: 'netBedel', cellsFormat: 'd2', hidden: true }*/
			]);
		}

		async loadServerData(e) {
			const recs = this.fis.detaylar;
			e.callback({ totalrecords: recs.length, records: recs });
		}

		async liste_veriYuklendi(e) {
			await super.liste_veriYuklendi(e);
			if (!this.listeReadyFlag)
			 	return;
			
			setTimeout(async () => {
				if (!this.isListeVeriYuklendiEventTriggered) {
					await this.selectLastRec();
					this.isListeVeriYuklendiEventTriggered = true;
				}
				// this.degistimi = false;
				this.listeReadyFlag = (this.listeReadyFlag || 0) + 1;
			}, 10);
		}

		liste_satirSecildi(e) {
			e = e || {};
			super.liste_satirSecildi(e);

			const {fis} = this;
			let rec = this.selectedBoundRec;
			if (rec)
				rec = $.isPlainObject(rec) ? fis.class.detaySinif.From(rec) : rec.deepCopy();
			
			const index = this.selectedIndex;
			const {lastSelectedIndex} = e;
			if (rec && index != null && !rec.class.promosyonmu && index == lastSelectedIndex) {
				// this.listeWidget.beginRowEdit(index);
				let elm = this.divListe.find(`.jqx-grid-table .listeSatir[data-index=${index}] .miktar`);
				if (elm.length) {
					if (e.event)
						e.event.stopPropagation();
					
					setTimeout(e => {
						let {elm} = e;
						let parent = elm.parent();
						if (!parent.length)
							return;
						
						const {fis} = this;
						const {rec} = e;
						const fra = this.app.brm2Fra[rec.brm || 'AD'] || 0;
						
						elm = e.elm[0];
						let savedHTML = elm.outerHTML;
						elm.outerHTML = (
							`<form action="" autocomplete="false" readonly onfocus="this.removeAttribute('readonly')" onsubmit="javascript:return false">` +
							`	<input class="miktar" type="number" maxlength="9" autocomplete="off" value="${roundToFra(asFloat(rec.miktar), fra) || 1}"></input>` +
							`</form>`
						);
						elm = parent.find(`.miktar`);
						parent.parent().find(`.brm`).addClass(`jqx-hidden`);
						elm.off('keyup').on('keyup', evt => {
							const key = (evt.key || '').toLowerCase();
							if (key == 'enter' || key == 'linefeed')
								elm.blur();
						});
						elm.off('change').on('change', async evt => {
							rec.miktar = roundToFra(asFloat(evt.currentTarget.value.replaceAll(',', '.')), fra) || 1;
							await rec.detayEkIslemler({ fis, satisKosulYapilari: this.satisKosulYapilari });
							try { this.degistir({ rec: rec }) }
							catch (ex) { }
						});
						elm.off('blur').on('blur', evt =>
							this.listeWidget.refresh());
						elm.focus();
						elm.select();
					}, 10, { elm: elm, rec: rec, index: index });
				}
			}
		}

		liste_satirCiftTiklandi(e) {
			// do nothing
			
			/*if (!this.isEventFired_satirCifTiklandi) {
				this.isEventFired_satirCifTiklandi = true;
				return;
			}*/
		}

		transferYontemi_itemSelected(e) {
			let rec = (e.rec || {}).originalItem || e.rec;
			if (!rec)
				return;
			
			const {layout, fis} = this;
			$.extend(fis, {
				transferTipKod: rec.kod || '',
				yerKod: rec.cikisYerKod || '',
				refYerKod: rec.girisYerKod || ''
			});
			layout.find(`#transferYontemiParent`)[rec.kod ? 'removeClass' : 'addClass'](`jqx-hidden`);
			layout.find(`#transferYontemiText`).html(rec.aciklama);
			layout.find(`#yerParent`)[rec.cikisYerKod || rec.girisYerKod ? 'removeClass' : 'addClass'](`jqx-hidden`);
			layout.find(`#yerKodText`).html(new CKodVeAdi({ kod: rec.cikisYerKod, aciklama: rec.cikisYerAdi }).parantezliOzet());
			layout.find(`#refYerKodText`).html(new CKodVeAdi({ kod: rec.girisYerKod, aciklama: rec.girisYerAdi }).parantezliOzet());

			this.navBarArrowClickHandler({ index: 1, collapseFlag: false });
		}

		async palet_itemSelected(e) {
			const {layout, fis, ayrisimAyiracli_barkod2Detay} = this;
			const fisSinif = fis.class;
			let barkod = e.value;
			let rec = e.rec || this.paletPart.selectedRec;
			rec = (rec || {}).originalItem || rec;

			let det, refRafKod;
			if (barkod) {
				barkod = barkod.trim();
				let ind = -1;
				$.each(['x', 'X', '*'], (_, matchStr) => {
					ind = barkod.indexOf(matchStr);
					if (ind > -1)
						return false;			// break loop
				});
				
				let carpan;
				if (ind > -1) {
					let miktarStr = barkod.substring(0, ind);		// substring from->to .. (to dahil degil)
					e.barkod = barkod = barkod.substring(ind + 1);
					e.carpan = carpan = asFloat(miktarStr) || null;
				}

				// barkod veya stok kod için ürün bul ve detay oluştur
				const barkodBilgi = await this.app.barkodBilgiBelirle({ barkod: barkod, carpan: carpan, fis: fis });
				let ayrisimAyiraclimiVeZVarmi = false;
				if (barkodBilgi) {
					const _barkod = barkodBilgi.barkod;
					ayrisimAyiraclimiVeZVarmi = barkodBilgi.ayrisimAyiraclimi && barkodBilgi.zVarmi;
					if (ayrisimAyiraclimiVeZVarmi) {
						const _det = ayrisimAyiracli_barkod2Detay[_barkod];
						if (_det) {
							const {uid} = _det;
							const {listeWidget} = this;
							listeWidget.selectrowbykey(uid);
							let displayIndex = listeWidget.getrowdisplayindex(_det);
							let araMesaj = displayIndex < 0 ? `` : `<b>${displayIndex + 1}. satırda</b> `;
							this.app.playSound_barkodError();
							displayMessage(`<b>${_barkod}</b> barkoduna ait ${araMesaj}tekrar eden kalem var !`, this.app.appText);
							return false;
						}
					}
					
					refRafKod = barkodBilgi.rafKod;
					if (refRafKod) {
						const {refYerKod} = fis;
						let stm = new MQStm({
							sent: new MQSent({
								from: 'mst_YerRaf',
								where: [
									{ degerAta: refYerKod, saha: 'yerKod' },
									{ degerAta: refRafKod, saha: 'rafKod' }
								],
								sahalar: `COUNT(*) sayi`
							})
						});
						let sayi = asInteger(await this.app.dbMgr_mf.tekilDegerExecuteSelect({ query: stm })) || 0;
						if (!sayi) {
							this.app.playSound_barkodError();
							displayMessage(`<u>${barkod}</u> barkodunun içindeki <u class="bold darkred">${refRafKod}</u> kodlu Giriş Raf Hatalı veya <b>${refYerKod}</b> kodlu Depo için geçersizdir!`, this.app.appText);
							return false;
						}
					}

					const detaySinif = fisSinif.uygunDetaySinif({ rec: barkodBilgi }) || fisSinif.detaySinif;
					det = await detaySinif.fromBarkodBilgi({ fis: fis, barkodBilgi: barkodBilgi });
					if (ayrisimAyiraclimiVeZVarmi)
						ayrisimAyiracli_barkod2Detay[barkod] = det;
					this.app.playSound_barkodOkundu();
				}
				else {
					if (!rec) {
						this.app.playSound_barkodError();
						displayMessage(`<u class="bold darkred">${barkod}</u> barkodu hatalıdır!`, this.app.appText);
						return false
					}
				}
				// det = new fis.class.detaySinif({ barkod: barkod, shKod: shKod, shAdi: `${barkod} barkodundan oluştu` });
			}

			if (!det && rec) {
				refRafKod = rec.rafKod || rec.rafkod;
				const detaySinif = fisSinif.uygunDetaySinif({ rec: rec }) || fisSinif.detaySinif;
				rec.refRafKod = refRafKod;
				delete rec.rafKod;
				
				det = $.isPlainObject(rec)
							? new detaySinif(rec)
							: rec.deepCopy();
			}

			if (det) {
				this.aktifDetay = det;
				layout.find(`#urunText`).html(det.shAdi);

				let miktarText = det.paketKod ? `${det.paketMiktar || 1} ${det.paketKod} = ` : ``;
				miktarText += `${(det.miktar || 1).toLocaleString()} ${det.brm || 'AD'}`;
				layout.find(`#miktarText`).html(miktarText);

				if (this.initFlag) {
					fis.tamamlandimi = false;

					det.fiyat = det.kdvOrani = 0;
					det.ozelFiyatVarmi = det.ozelIskontoVarmi = det.promosyonYapilmazmi = true;
					await det.detayEkIslemler_ekle({ fis: fis, satisKosulYapilari: this.satisKosulYapilari });
					['uid', '_visible'].forEach(key =>
						delete det[key]);

					/*if (refRafKod)
						fis.detaylar.push(det);*/
					this.tazele();
					// this.navBar.jqxNavigationBar('disableAt', 0);
					setTimeout(() =>
						this.kaydetDevam2({ islem: fis.id ? 'degistir' : this.islem, geciciKayitmi: true }),
						500);
				}

				setTimeout(() => {
					this.navBarArrowClickHandler({ index: 2, collapseFlag: false })
					// this.navBarArrowClickHandler({ index: refRafKod ? 1 : 2, collapseFlag: false })
				}, refRafKod ? 100 : 0)
			}
		}

		async refRaf_itemSelected(e) {
			const det = this.aktifDetay;
			if (!det)
				return false
			
			const {fis} = this;
			const {refYerKod} = fis;			
			let rec = (e.rec || {}).originalItem || e.rec;
			let refRafKod = (rec || {}).value || e.value || (rec || {}).kod || e.id;
			if (!rec) {
				if (this.initFlag && refRafKod) {
					displayMessage(`<u class="bold darkred">${refRafKod}</u> kodlu Giriş Raf Hatalı veya <b>${refYerKod}</b> kodlu Depo için geçersizdir!`, this.app.appText);
					return false
				}
				return false
			}

			if (this.initFlag) {
				// let degistimi = false;
				let ekOzellik = fis.class.refRafKullanilirmi ? det.ekOzellik_refRaf : null;
				if (ekOzellik.value != refRafKod)
					ekOzellik.value = refRafKod
				fis.tamamlandimi = false
			}

			const {btnEkle} = this;
			btnEkle.addClass('jqx-hidden');
			
			setTimeout(() => {
				this.navBarArrowClickHandler({ index: 3, collapseFlag: false })
				// this.navBarArrowClickHandler({ index: refRafKod ? 1 : 2, collapseFlag: false })
			}, refRafKod ? 100 : 0)
		}

		async raf_itemSelected(e) {
			const det = this.aktifDetay;
			if (!det)
				return false
			
			const {fis} = this;
			const {yerKod} = fis;			
			let rec = (e.rec || {}).originalItem || e.rec;
			let rafKod = (rec || {}).value || e.value || (rec || {}).kod || e.id;
			if (!rec) {
				if (this.initFlag && rafKod) {
					displayMessage(`<u class="bold darkred">${rafKod}</u> kodlu Raf Hatalı veya <b>${yerKod}</b> kodlu Depo için geçersizdir!`, this.app.appText);
					return false;
				}
				return false
			}

			if (this.initFlag) {
				// let degistimi = false;
				let degerVarmi = false;
				let ekOzellik = fis.class.rafKullanilirmi ? det.ekOzellik_raf : null;
				if (ekOzellik) {
					if (ekOzellik.value != rafKod)
						ekOzellik.value = rafKod
					degerVarmi = !!ekOzellik.value;
					fis.tamamlandimi = false
				}

				/*fis.detaylar.push(det);
				if (degistimi)
					this.kaydetDevam2({ islem: fis.id ? 'degistir' : this.islem, geciciKayitmi: true });*/
				
				if (degerVarmi) {
					const {btnEkle} = this;
					btnEkle.removeClass('jqx-hidden');
					setTimeout(() => btnEkle.jqxButton('focus'), 200)
				}
			}
			
			/*// this.navBar.jqxNavigationBar('enableAt', 1)
			this.navBarArrowClickHandler({ index: 1, collapseFlag: false })*/
		}

		async islemTusuTiklandi(e) {
			const elm = e.event.currentTarget;
			const id = e.id || (elm || {}).id;
			switch (elm.id) {
				case 'ekle':
					this.ekleIstendi(e);
					break;
				case 'sil':
					this.silIstendi(e);
					break;
				case 'barkod':
					this.barkodIstendi(e);
					break;
			}
		}

		async ekleIstendi(e) {
			const {app, fis} = this;
			app.hideNotifications();
			fis.tamamlandimi = false;

			const det = this.aktifDetay;
			if (!det)
				return;
			
			if (this.initFlag && !fis.detaylar.includes(det)) {
				let degerVarmi = !!det.refRafKod;
				if (!degerVarmi) {
					let result = await new Promise(resolve => {
						displayMessage(
							'<b class="red">Raf Kodu</b> <u>BELİRTİLMEDİ</u>, yine de devam edilsin mi?', app.appText, true,
							{
								EVET: (dlgUI, btnUI) => {
									dlgUI.jqxWindow('destroy');
									resolve(true)
								},
								HAYIR: (dlgUI, btnUI) => {
									dlgUI.jqxWindow('destroy');
									resolve(false)
								}
							}
						)
					});
					if (!result)
						return;
				}
				
				fis.detaylar.push(det);
				delete this.aktifDetay;
				
				this.tazele();
				this.selectLastRec({ noSelect: true });

				setTimeout(() =>
					this.kaydetDevam2({ islem: fis.id ? 'degistir' : this.islem, geciciKayitmi: true }),
					0);
			}
			
			// this.navBar.jqxNavigationBar('enableAt', 1);
			this.navBarArrowClickHandler({ index: 1, collapseFlag: false });
		}

		async silIstendi(e) {
			this.app.hideNotifications();

			const {fis} = this;
			fis.tamamlandimi = false;

			const det = this.selectedBoundRec || this.aktifDetay;
			if (!det)
				return;
			
			let result = true;
			let hasRec = false;
			if (this.initFlag) {
				let index = this.indexOfRec({ rec: det });;
				if (index < 0)
					index = fis.detaylar.indexOf(det);
				
				hasRec = index >= 0;
				if (hasRec) {
					result = await new Promise(resolve => {
						let wnd = displayMessage(
							'<p class="red bold">Seçilen satır İPTAL EDİLECEK.</p><p>Devam Edilsin mi?</p>',
							this.app.appText,
							true,
							{
								EVET: (dlgUI, btnUI) => {
									dlgUI.jqxWindow('destroy');
									// this.focusToDefault();
									resolve(true)
								},
								HAYIR: (dlgUI, btnUI) => {
									dlgUI.jqxWindow('destroy');
									resolve(false)
								}
							});
					});
				}
				if (result) {
					if (hasRec)
						fis.detaylar.splice(index, 1);
					delete this.aktifDetay;
					if (hasRec) {
						this.tazele();
						setTimeout(() =>
							this.kaydetDevam2({ islem: fis.id ? 'degistir' : this.islem, geciciKayitmi: true }),
							500);
					}
				}
			}
			
			// this.navBar.jqxNavigationBar('enableAt', 1);
			this.navBarArrowClickHandler({ index: 1, collapseFlag: false });
			if (result && !hasRec) {
				setTimeout(
					() => displayMessage(`Son taşıma işlemi <b>İPTAL EDİLDİ</b>!`),
					100);
			}
		}

		/*async silIstendi(e) {
			// this.focusToDefault();

			const {selectedIndex} = this;
			await this.sil();
			if (selectedIndex && selectedIndex > 0)
				this.listeWidget.selectRow(selectedIndex - 1);
		}*/

		temizleIstendi(e) {
			let wnd = displayMessage(
				'<p class="red">Tüm Detaylar SİLİNECEK!</p><p>Devam Edilsin mi?</p>',
				this.app.appText,
				true,
				{
					EVET: (dlgUI, btnUI) => {
						dlgUI.jqxWindow('destroy');
						this.temizle();
						// this.focusToDefault();
					},
					HAYIR: (dlgUI, btnUI) =>
						dlgUI.jqxWindow('destroy')
				});
			/*wnd.off('close').on('close', evt => {
				// dlgUI.jqxWindow('destroy');
				// this.focusToDefault();
			})*/
		}
	
		async barkodIstendi(e) {
			e = e || {};
			const layout = this.layout;
			const barkodContainer = layout.find('#barkodContainer');

			let barcodeReader = this.barcodeReader;
			if (!barcodeReader) {
				const deviceClass = CETBarkodDevice.defaultDeviceClass;
				if (!deviceClass)
					return;
				
				barcodeReader = this.barcodeReader = new deviceClass({
					content: barkodContainer,
					debug: this.app.class.isDebug,
					onKamerami: this.app.onKamerami,
					readCallback: e => {
						const barkod = e.result;
						const {activePart} = this;
						if (activePart) {
							activePart.text = barkod;
							activePart.comboBox_enterIstendi({ value: barkod });
						}
					}
				});
			}
			if (!barcodeReader.initFlag || barcodeReader.isReady)
				await barcodeReader.start()
			else
				await barcodeReader.destroy()
			
			let elm = (e.event || {}).currentTarget;
			if (elm) {
				elm = $(elm);
				elm.removeClass(`ready paused running`);
				elm.addClass(barcodeReader.state);
			}
		}

		async kaydetIstendi(e) {
			let result = await this.kaydet(e);
			if (result && !result.isError)
				this.geriIstendi();
			
			return result;
		}

		async geriYapilabilirmi(e) {
			if (!await super.geriYapilabilirmi(e))
				return false;
			
			if (!this.degistimi)
				return true;
			
			return await new Promise(then => {
				displayMessage(
					'Ekranda değişiklik yapılmış, yine de çıkılsın mı?', this.app.appText, true,
					{
						EVET: (dlgUI, btnUI) => {
							dlgUI.jqxWindow('destroy');
							then(true)
						},
						HAYIR: (dlgUI, btnUI) => {
							dlgUI.jqxWindow('destroy');
							then(false)
						}
					}
				)
			})
		}
	}
})()
