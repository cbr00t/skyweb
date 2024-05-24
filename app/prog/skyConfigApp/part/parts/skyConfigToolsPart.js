(function() {
	window.SkyConfigToolsPart = class extends window.SkyConfigInnerPartWithTabs {
		constructor(e) {
			e = e || {};
			super(e);

			this.args = e.args || this.args || {};
		}

		static get partName() { return 'tools' }

		get rootConfig() {
			return this._rootConfig = this._rootConfig || {};
		}
		set rootConfig(value) {
			this._rootConfig = value;
		}

		
		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);
		}

		async initTabContent(e) {
			await super.initTabContent(e);

			const {tabID} = e;
			switch (tabID) {
				case 'vioGuncelle':
					return await this.initTabContent_vioGuncelle(e);
				case 'eIslemGonder':
					return await this.initTabContent_eIslem($.extend({}, e, {
						tip: 'eIslemGonder', islemAdi: `Toplu e-İşlem Gönderimi`
					}));
				case 'eIslemAkibetSorgula':
					return await this.initTabContent_eIslem($.extend({}, e, {
						tip: 'eIslemAkibetSorgula', islemAdi: `Toplu e-İşlem Akıbet Sorgusu`
					}));
				case 'gelenEIslemSorgula':
					return await this.initTabContent_eIslem($.extend({}, e, {
						tip: 'gelenEIslemSorgula', islemAdi: `Gelen e-İşlem Sorgusu`
					}));
			}
		}

		async activatePart(e) {
			const {panel} = this;
			const elms = [
				panel.find(`button#calistir`),
				panel.find(`button#kaydet`)
			];
			for (const i in elms) {
				const elm = elms[i];
				if (elm && elm.length)
					elm.removeClass('jqx-hidden');
			}
			
			await super.activatePart(e);
		}

		async deactivatePart(e) {
			const {panel} = this;
			const elms = [
				panel.find(`button#calistir`),
				panel.find(`button#kaydet`)
			];
			for (const i in elms) {
				const elm = elms[i];
				if (elm && elm.length)
					elm.addClass('jqx-hidden');
			}
			
			await super.deactivatePart(e);
		}

		async initTabContent_vioGuncelle(e) {
			const {app} = this;
			const args = this.args.vioGuncelle = this.args.vioGuncelle || {};
			const {tabPage} = e;
			args.tabPage = tabPage;
			
			const subArgs = args.subArgs = args.subArgs || {};
			subArgs.paketler = subArgs.paketler || [];

			const chkWebOtomasyonlari = tabPage.find(`#chkWebOtomasyonlari_parent #chkWebOtomasyonlari`);
			chkWebOtomasyonlari.prop('checked', asBool(subArgs.web || subArgs.webOtomasyonlari));
			chkWebOtomasyonlari.parent()[chkWebOtomasyonlari.is(':checked') ? 'addClass' : 'removeClass']('checked');
			chkWebOtomasyonlari.on('change', evt => {
				const elm = $(evt.currentTarget);
				const flag = elm.is(':checked');
				elm.parent()[flag ? 'addClass' : 'removeClass']('checked');
				delete subArgs.webOtomasyonlari;
				subArgs.web = flag;
			});

			const chkDownloadOnly = tabPage.find(`#chkDownloadOnly_parent #chkDownloadOnly`);
			const chkDownloadOnly_onChange = evt => {
				const elm = (evt && evt.currentTarget ? $(evt.currentTarget) : chkDownloadOnly);
				const flag = elm.is(':checked');
				elm.parent()[flag ? 'addClass' : 'removeClass']('checked');
				delete subArgs.noInstall;
				subArgs.downloadOnly = flag;
				chkWebOtomasyonlari.removeClass('jqx-hidden');
				chkWebOtomasyonlari.parent()[flag ? 'addClass' : 'removeClass']('basic-hidden');
			};
			const downloadOnlyFlag = asBool(subArgs.downloadOnly || subArgs.noInstall);
			chkDownloadOnly.prop('checked', downloadOnlyFlag);
			if (downloadOnlyFlag)
				chkDownloadOnly_onChange();
			chkDownloadOnly.on('change', evt =>
				chkDownloadOnly_onChange(evt));

			const chkUzakDestek = tabPage.find(`#chkUzakDestek_parent #chkUzakDestek`);
			chkUzakDestek.prop('checked', !!(subArgs.uzakDestek || subArgs.uzakDestekProg || subArgs.uzakDestekProgName));
			chkUzakDestek.parent()[chkUzakDestek.is(':checked') ? 'addClass' : 'removeClass']('checked');
			chkUzakDestek.on('change', evt => {
				const elm = $(evt.currentTarget);
				const flag = elm.is(':checked');
				elm.parent()[flag ? 'addClass' : 'removeClass']('checked');
				delete subArgs.uzakDestekProg;
				delete subArgs.uzakDestekProgName;
				subArgs.uzakDestek = flag ? app.vioUzakDestekPaketAdi : null;
			});

			const paketler_parent = args.paketler_parent = tabPage.find(`#paketler_parent`);
			const divPaketler = paketler_parent.find(`#paketler`);
			const paketlerPart = args.paketlerPart = new DataTablePart({
				layout: divPaketler,
				widgetBeforeInit: _e => {
					$.extend(_e.widgetArgs, {
						// pageable: true, pageSize: 30,
						pageable: false, selectionMode: 'custom',
						filterable: true, filterMode: 'default', filterHeight: 25,
						serverProcessing: false
					});
				},
				/*widgetAfterInit: _e => {
					const {widgetPart} = _e;
					widgetPart.on('rowDoubleClick', evt =>
						this.baslatIstendi(e));
				},*/
				columns: [
					{ dataField: 'paketAdi', text: 'Paket Adı', cellClassName: 'paketAdi', width: 150 },
					{ dataField: 'aciklama', text: 'Açıklama', cellClassName: 'aciklama' }
				],
				loadServerData: e =>
					app.vioPaketler,
				bindingComplete: e => {
					const paketler = subArgs.paketler || subArgs.paket || subArgs.paketListe;
					if (!$.isEmptyObject(paketler)) {
						const {widget} = args.paketlerPart;
						if (widget) {
							const paketlerSet = asSet(paketler);
							const recs = widget.getRows();
							widget.beginUpdate();
							for (const i in recs) {
								const rec = recs[i];
								const {paketAdi, uid} = rec;
								if (paketlerSet[paketAdi])
									widget.selectrowbykey(uid);
							}
							widget.endUpdate();
						}
					}
				},
				itemClick: e => {
					const uid = e.event.args.key;
					const {widget} = args.paketlerPart;
					if (uid != null) {
						const rowInfo = widget.rowinfo[uid];
						if (rowInfo.selected)
							widget.unselectrowbykey(uid);
						else
							widget.selectrowbykey(uid);

						delete subArgs.paketListe;
						delete subArgs.paket;
						subArgs.paketler = widget.getSelection().map(rec => rec.paketAdi);
					}
				}
			});
			const parent = paketlerPart.layout.parent()
			paketlerPart.basicRun();
			paketlerPart.layout
				.detach()
				.appendTo(parent);

			const btnCalistir = tabPage.find(`.islemTuslari-ek #calistir`);
			btnCalistir
				.jqxButton({ theme: theme })
				.on('click', evt =>
					this.vioGuncelle_calistirIstendi($.extend({}, e, { event: evt })));
		}

		async vioGuncelle_calistirIstendi(e) {
			const {app} = this;
			const args = this.args.vioGuncelle;
			const {tabPage, subArgs} = args;

			await new $.Deferred(p => {
				createJQXWindow(
					`<div class="bold green" style="margin-top: 3px;">VİO Güncelleme İşlemi başlatılsın mı?</div>`,
					`VIO Güncelleme İşlemi`,
					{
						width: 350, height: 200, isModal: true
					},
					{
						EVET: async (dlgUI, btnUI) => {
							dlgUI.jqxWindow('destroy');
							p.resolve(true)
						},
						HAYIR: (dlgUI, btnUI) => {
							dlgUI.jqxWindow('destroy');
							p.reject({ isError: false, rc: 'userAbort' })
						}
					},
					0
				)
			});

			await app.knobProgressShow({ update: { label: `VIO Güncelleme İşlemi yapılıyor...` } });
			try {
				const result = await app.wsVioGuncelle({ args: subArgs });
				args.result = result;
				if (result.output) {
					const subOutput = tabPage.find(`#output_parent #output`);
					subOutput.html(result.output.replaceAll('\r\n', '<br/>\r\n'));
					subOutput.removeClass('error success');
					subOutput.addClass(result.isError ? 'error' : 'success');
					hljs.highlightBlock(subOutput[0]);
				}
				
				await app.knobProgressHideWithReset({ delayMS: 5000, update: { label: `VIO Güncelleme İşlemi tamamlandı` } });
				setTimeout(() => app.knobProgressSuccess({ update: { showLoading: false } }), 1000);
				
				return result;
			}
			catch (ex) {
				args.result = ex;
				await app.knobProgressHide();
				defFailBlock(ex);
				
				throw ex;
			}
		}

		async initTabContent_eIslem(e) {
			const {app} = this;
			const {tabPage, tip, islemAdi} = e;

			const args = this.args[tip] = this.args[tip] || {};
			$.extend(args, {
				tabPage: tabPage,
				tip: tip,
				islemAdi: islemAdi
			});
			const subArgs = args.subArgs = args.subArgs || {};

			const txtUser = tabPage.find(`#user`);
			txtUser.on('change', evt => {
				const {value} = evt.target;
				subArgs.user = (value || '').trim();
			});
			
			const sql_parent = tabPage.find(`#sql_parent`);
			const btnVTSec = sql_parent.find('button');
			btnVTSec
				.jqxButton({ theme: theme })
				.on('click', evt => {
					new SkyConfigVTSecPart({
						tekil: true,
						server: subArgs.server || '',
						vt: subArgs.db || subArgs.vt,
						tamamIslemi: _e => {
							const {server} = _e;
							const vt = _e.db || _e.vt;
							delete subArgs.vt;
							
							subArgs.server = server || undefined;
							subArgs.db = vt || undefined;
							
							const input = sql_parent.find('textarea');
							if (!server && $.isEmptyObject(vt))
								input.val('');
							else
								input.val(`${server || ''} - ${vt || ''}`);
						}
					}).open()
				});

			const eIslemTipi_parent = tabPage.find(`#eIslemTipi_parent`);
			if (eIslemTipi_parent.length) {
				const txtEIslemTipi = eIslemTipi_parent.find(`#eIslemTipi`);
				(() => {
					const subArgs_eIslemTipi = subArgs.eIslemTipi || {};
					txtEIslemTipi.val(SkyConfigBirKismiListePart.getSelectionText({
						tekilmi: false,
						hepsimi: subArgs_eIslemTipi.hepsimi == null ? true : asBool(subArgs_eIslemTipi.hepsimi),
						kodListe: (subArgs_eIslemTipi.deger ? subArgs_eIslemTipi.deger.split(delimWS) : [])
					}));
				})();
				const btnEIslemTipi_sec = eIslemTipi_parent.find(`#eIslemTipi_sec`);
				btnEIslemTipi_sec.jqxButton({ theme: theme });
				btnEIslemTipi_sec.on('click', evt => {
					const subArgs_eIslemTipi = subArgs.eIslemTipi = subArgs.eIslemTipi || {};
					new SkyConfigBirKismiListePart({
						title: 'e-İşlem Tipi',
						tekilmi: false,
						recs: app.eIslemTipKAListe,
						hepsimi: subArgs_eIslemTipi.hepsimi == null ? true : asBool(subArgs_eIslemTipi.hepsimi),
						kodSet: asSet(
							subArgs_eIslemTipi.deger == null
								? []
								: (typeof subArgs_eIslemTipi.deger == 'object' ? subArgs_eIslemTipi.deger : subArgs_eIslemTipi.deger.split(delimWS))
						),
						tamamIslemi: e => {
							const {hepsimi, kodSet} = e;
							subArgs_eIslemTipi.hepsimi = hepsimi;
							subArgs_eIslemTipi.deger = (
								hepsimi
									? null
									: Object.keys(kodSet || {}).join(delimWS)
							);
							txtEIslemTipi.val(e.selectionText);
						}
					}).open();
				});
			}
			
			const tarihBS_parent = tabPage.find(`#tarihBS_parent`);
			if (tarihBS_parent.length) {
				const txtTarih_basi = tarihBS_parent.find(`#tarih_basi`);
				txtTarih_basi.val(dateToString((subArgs.tarih || {}).basi));
				txtTarih_basi.on('change', evt => {
					let {value} = evt.target;
					const bs = subArgs.tarih = subArgs.tarih || {};
					value = evt.target.value = bs.basi = (tarihDegerDuzenlenmis(value || '') || '').trim();
				});
				const txtTarih_sonu = tarihBS_parent.find(`#tarih_sonu`);
				txtTarih_sonu.val(dateToString((subArgs.tarih || {}).sonu));
				txtTarih_sonu.on('change', evt => {
					let {value} = evt.target;
					const bs = subArgs.tarih = subArgs.tarih || {};
					value = evt.target.value = bs.sonu = (tarihDegerDuzenlenmis(value || '') || '').trim();
				});
			}
			
			const seriNoBS_parent = tabPage.find(`#seriNoBS_parent`);
			if (seriNoBS_parent.length) {
				const txtSeri_basi = seriNoBS_parent.find(`#seri_basi`);
				txtSeri_basi.val((subArgs.seri || {}).basi);
				txtSeri_basi.on('change', evt => {
					let {value} = evt.target;
					const bs = subArgs.seri = subArgs.seri || {};
					value = evt.target.value = bs.basi = (value || '').trim().toUpperCase();
				});
				const txtSeri_sonu = seriNoBS_parent.find(`#seri_sonu`);
				txtSeri_sonu.val((subArgs.seri || {}).sonu);
				txtSeri_sonu.on('change', evt => {
					let {value} = evt.target;
					const bs = subArgs.seri = subArgs.seri || {};
					value = evt.target.value = bs.sonu = (value || '').trim().toUpperCase();
				});
				const txtNo_basi = seriNoBS_parent.find(`#no_basi`);
				txtNo_basi.val((subArgs.no || {}).basi);
				txtNo_basi.on('change', evt => {
					let {value} = evt.target;
					const bs = subArgs.no = subArgs.no || {};
					value = evt.target.value = bs.basi = asInteger((value || '').trim());
				});
				const txtNo_sonu = seriNoBS_parent.find(`#no_sonu`);
				txtNo_sonu.val((subArgs.no || {}).sonu);
				txtNo_sonu.on('change', evt => {
					let {value} = evt.target;
					const bs = subArgs.no = subArgs.no || {};
					value = evt.target.value = bs.sonu = asInteger((value || '').trim());
				});
			}

			const elms = [
				tabPage.find(`input[type=text]`),
				tabPage.find(`input[type=textbox]`)
			];
			for (let i = 0; i < elms.length; i++) {
				elms[i].on('click', evt =>
					evt.target.select());
			}
			
			const btnAyirac = tabPage.find(`.basiSonu-parent .bs-ayirac`);
			if (btnAyirac.length) {
				btnAyirac.jqxButton({ theme: theme });
				btnAyirac.on('click', evt => {
					const target = $(evt.currentTarget);
					const next = target.next();
					next.val(target.prev().val());
					next.trigger('change');
				})
			}

			const btnCalistir = tabPage.find(`.islemTuslari-ek #calistir`);
			btnCalistir
				.jqxButton({ theme: theme })
				.on('click', evt =>
					this.eIslem_calistirIstendi($.extend({}, e, { event: evt, args: args })));
		}

		async eIslem_calistirIstendi(e) {
			const {app} = this;
			const {args} = e;
			const {tabPage, subArgs, tip, islemAdi} = args;
			
			await new $.Deferred(p => {
				createJQXWindow(
					`<div class="bold green" style="margin-top: 3px;">Belirtilen seçim aralığına ait ${islemAdi} başlasın mı?</div>`,
					`e-İşlem Gönderimi`,
					{
						width: 450, height: 250, isModal: true
					},
					{
						EVET: async (dlgUI, btnUI) => {
							dlgUI.jqxWindow('destroy');
							p.resolve(true)
						},
						HAYIR: (dlgUI, btnUI) => {
							dlgUI.jqxWindow('destroy');
							p.reject({ isError: false, rc: 'userAbort' })
						}
					},
					0
				)
			});

			await app.knobProgressShow({ update: { label: `${islemAdi} yapılıyor...` } });
			try {
				const _e = $.extend({
					id: newGUID(), tip: tip,
					temp: true
				}, subArgs);
				const result = await app.wsRunSubServices({ subService: toJSONStr(_e) });
				const subResult = $.isEmptyObject(result) ? null : Object.values(result)[0];
				args.result = subResult;
				if (subResult && subResult.result) {
					const subOutput = tabPage.find(`#output_parent #output`);
					subOutput.html(subResult.result.replaceAll('\r\n', '<br/>\r\n'));
					subOutput.removeClass('error success');
					subOutput.addClass(subResult.isError ? 'error' : 'success');
					hljs.highlightBlock(subOutput[0]);
				}
				
				await app.knobProgressHideWithReset({ delayMS: 5000, update: { label: `${islemAdi} tamamlandı` } });
				setTimeout(() => app.knobProgressSuccess({ update: { showLoading: false } }), 1000);
				
				return result;
			}
			catch (ex) {
				args.result = ex;
				await app.knobProgressHide();
				defFailBlock(ex);
				
				throw ex;
			}
		}

		async islemTusuTiklandi(e) {
			const {event, id} = e;
			let target = (event || {}).currentTarget;
			if (target)
				target = $(target);
			
			if (target)
				setButonEnabled(target, false);
			try {
				switch (id) {
					case 'kaydet':
						return await this.kaydetIstendi(e);
				}
			}
			finally {
				setTimeout(() => {
					if (target)
						setButonEnabled(target, true);
				}, 500);
			}
		}

		async tazele(e) {
			const {app} = this;
			const promise_wsConfigOku = app.wsConfigOku();
			
			await super.tazele();

			promise_wsConfigOku
				.then(result => this.wsConfigOku_onResponse($.extend({}, e, { isError: result.isError || false, result: result })))
				.catch(result => this.wsConfigOku_onResponse($.extend({}, e, { isError: true, result: result })));
		}

		async rootConfigKaydet(e) {
			const {app, _rootConfig} = this;
			if (_rootConfig) {
				try { return await app.wsConfigYaz({ rootConfig: _rootConfig }) }
				catch (ex) { defFailBlock(ex) }
			}
			return null;
		}

		async wsConfigOku_onResponse(e) {
			const {isError, result} = e;
			if (isError) {
				const error = (result || {}).responseJSON || result;
				if ((error.rc || error.code) != 'accessDenied' && (result || {}).statusText != 'abort')
					defFailBlock(result);
				return;
			}

			const rootConfig = this.rootConfig = result.rootConfig;
			setTimeout(async () => {
				await this.onResize();
			}, 500);

			const {paketlerPart} = (this.args || {}).vioGuncelle || {};
			if (paketlerPart && paketlerPart.widget /*&& this.panel.find(`ul > li.jqx-fill-state-pressed`).prop('id') == 'vioGuncelle'*/)
				paketlerPart.tazele();
		}

		configDegisti(e) {
			const {errors} = e;
			if (errors) {
				displayServerResponse(toJSONStr(errors));
				return;
			}

			const newConfig = e.value;
			if (!newConfig)
				return;

			this.rootConfig = newConfig;
			setTimeout(() => this.onResize(), 100);
		}

		async kaydetIstendi(e) {
			return await this.rootConfigKaydet(e);
			
			/*await showProgress(`Ayarlar kaydediliyor...`);
			try { this.rootConfigKaydet(e); }
			finally { setTimeout(() => hideProgress(), 300) }*/
		}
		
		async onResize(e) {
			if ((await super.onResize(e)) === false)
				return false;

			const {panel} = this;
			const argsParent = this.args;
			if (argsParent) {
				let args = argsParent.vioGuncelle || {};
				if (args) {
					let tabPage = args.tabPage;
					const {paketlerPart} = args;
					if (paketlerPart && paketlerPart.widget)
						paketlerPart.widget.resize();
					let output_parent = tabPage.find(`.output-parent`);
					let divOutput = output_parent.find(`.output`);
					const upperElm = tabPage.find(`#chkUzakDestek_parent`);
					divOutput.width(tabPage.width() - (tabPage.offset().left + paketlerPart.widgetPart.width()) + 80);
					divOutput.height(tabPage.height() - (upperElm.offset().top + 30));
				}
			}

			/*panel.find(`.jqx-tabs-content #sqlExec.jqx-tabs-content-element .sqlExec_result_parent #sqlExec_result`).widgetPart
				.jqxDataTable('height', (panel.height() - 600));*/
		}
	}
})()
