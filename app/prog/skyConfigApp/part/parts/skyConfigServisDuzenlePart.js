(function() {
	window.SkyConfigServisDuzenlePart = class extends window.SkyConfigWindowPart {
		static get partName() { return 'servisDuzenle' } get defaultTitle() { return `Servis Düzenle` }
		get defaultIsModal() { return true } get autoFocus_uiSelector() { return `#tip` }
	
		constructor(e) {
			e = e || {}; super(e);
			$.extend(this, { baslikText: e.baslikText, servisID: e.servisID, args: e.args || {} })
		}
		async tazeleDevam(e) {
			await super.tazeleDevam(e); const {app, wnd, wndContent, baslikText, args} = this;
			if (baslikText) { wndContent.find(`#baslikText`).html(baslikText); wndContent.find(`#baslikTextParent`).removeClass(`jqx-hidden`) }
			else { wndContent.find(`#baslikTextParent`).addClass(`jqx-hidden`) }
			const panel = this.panel = wndContent.find(`.panel`).jqxTabs({
				theme, position: 'top', height: 'auto', width: wnd.jqxWindow('width') - 35,
				initTabContent: async tabIndex => {
					const panel = this.panel = this.panel || wndContent.find(`.panel`), tabPage = panel.find(`.jqx-tabs-content > .jqx-tabs-content-element:eq(${tabIndex})`);
					const tabID = tabPage.prop('id'), _e = $.extend({}, e || {}, { tabIndex, tabPage, tabID });
					await this.initTabContent(_e)
				}
			});
			wndContent.jqxValidator({
				position: 'centerbottom',
				rules: [
					{	action: 'change', input: `#port`, message: `(<b>WebServis Port</b>) değeri geçersizdir. (8081-8199) arası bir tamsayı değer olmalıdır`,
						rule: ui => { ui = $(ui); const val = asInteger(ui.val()); return val >= 8081 && val <= 8199; }
					},
					{ action: 'change', rule: 'minLength=1', input: `#user`, message: `(<b>Vio Kullanıcı</b>) belirtilmelidir` }
				]
			});
		}

		async initTabContent(e) {
			const {tabID} = e; switch (tabID) {
				case 'servis': return await this.initTabContent_servis(e);
				case 'gorev': return await this.initTabContent_gorev(e);
			}
		}
		async initTabContent_servis(e) {
			const {app, wndContent, args} = this, {tabPage} = e;
			const ddTip = this.ddTip = wndContent.find(`#tip`).jqxDropDownList({
				theme: theme, valueMember: 'kod', displayMember: 'aciklama',
				width: 380, height: false,
				filterable: true, filterHeight: 35, filterPlaceHolder: `Bul:`, searchMode: 'containsignorecase',
				autoDropDownHeight: false, dropDownHeight: 525,
				source: new $.jqx.dataAdapter({
					id: `kod`, datatype: 'array',
					localdata: Object.entries(app.servisTip2Aciklama).map(arr => { return { kod: arr[0], aciklama: arr[1] } })
				}, { autoBind: false, async: true, cache: true })
			});
			ddTip.on('change', evt => { args.tip = evt.args.item.value; this.tipDegisti($.extend({}, e, { event: evt })); })
			if (args.tip) { ddTip.val(args.tip) }

			const chkTemp = wndContent.find(`#chkTemp_parent #chkTemp`);
			chkTemp.prop('checked', asBool(args.temp));
			chkTemp.parent()[chkTemp.is(':checked') ? 'addClass' : 'removeClass']('checked');
			chkTemp.on('change', evt => {
				const elm = $(evt.currentTarget);
				const flag = elm.is(':checked');
				elm.parent()[flag ? 'addClass' : 'removeClass']('checked');
				args.temp = flag
			})

			const chkFork = wndContent.find(`#chkFork_parent #chkFork`);
			chkFork.prop('checked', asBool(args.fork));
			chkFork.parent()[chkFork.is(':checked') ? 'addClass' : 'removeClass']('checked');
			chkFork.on('change', evt => {
				const elm = $(evt.currentTarget);
				const flag = elm.is(':checked');
				elm.parent()[flag ? 'addClass' : 'removeClass']('checked');
				args.fork = flag
			});

			const chkRemote = wndContent.find(`#chkRemote_parent #chkRemote`);
			chkRemote.prop('checked', asBool(args.remote));
			chkRemote.parent()[chkRemote.is(':checked') ? 'addClass' : 'removeClass']('checked');
			chkRemote.on('change', evt => {
				const elm = $(evt.currentTarget);
				const flag = elm.is(':checked');
				elm.parent()[flag ? 'addClass' : 'removeClass']('checked');
				args.remote = flag;

				args.temp = flag;
				chkTemp.prop('checked', flag);
				chkTemp.parent()[args.temp ? 'addClass' : 'removeClass']('checked')
			});

			const ddIslem = this.ddIslem = tabPage.find(`#islem`).jqxDropDownList({
				theme: theme, valueMember: 'kod', displayMember: 'aciklama',
				width: 120, height: false,
				autoDropDownHeight: false, dropDownHeight: 120,
				source: new $.jqx.dataAdapter({
					id: `kod`, datatype: 'array',
					localdata: [
						{ kod: 'yedekle', aciklama: `Yedekle` },
						{ kod: 'shrink', aciklama: `Shink` }
					]
				}, {
					autoBind: false, async: true, cache: true
				})
			});
			ddIslem.on('change', evt =>
				args.islem = evt.args.item.value);
			if (args.islem)
				ddIslem.val(args.islem);

			const btnServerVeTekilVTSec = tabPage.find(`#serverVeTekilVTSec`);
			if (btnServerVeTekilVTSec && btnServerVeTekilVTSec.length) {
				btnServerVeTekilVTSec
					.jqxButton({ theme: theme })
					.on('click', evt => 
						this.serverVeTekilVTSecIstendi($.extend({}, e, { event: evt })));
			}
			const btnServerVeVTSec = tabPage.find(`#serverVeVTSec`);
			if (btnServerVeVTSec && btnServerVeVTSec.length) {
				btnServerVeVTSec
					.jqxButton({ theme: theme })
					.on('click', evt => 
						this.serverVeVTSecIstendi($.extend({}, e, { event: evt })));
			}
			if (args.server || args.db || args.vt)
				this.serverVeTekilVTDegisti();
			if (args.server || args.dbListe || args.vtListe)
				this.serverVeVTDegisti();

			const txtPort = tabPage.find(`#port`);
			txtPort.val(args.port);
			txtPort.on('focus', evt =>
				evt.target.select())
			txtPort.on('change', evt => {
				const value = asInteger(evt.target.value) || '';
				evt.target.value = value;
				args.port = value;
			});
			
			const txtUser = tabPage.find(`#user`);
			txtUser.val(args.user);
			txtUser.on('focus', evt =>
				evt.target.select())
			txtUser.on('change', evt =>
				args.user = evt.target.value);

			const txtShellCmd = tabPage.find(`#shellCmd`);
			txtShellCmd.val(args.cmd);
			txtShellCmd.on('focus', evt => evt.target.select())
			txtShellCmd.on('change', evt => args.cmd = evt.target.value);

			const txtCmd = tabPage.find(`#cmd`);
			txtCmd.val(args.cmd);
			txtCmd.on('focus', evt => evt.target.select())
			txtCmd.on('change', evt => args.cmd = evt.target.value);

			let txtConfigFile = tabPage.find('#configFile'); txtConfigFile.val(args.configFile);
			txtConfigFile.on('focus', ({ currentTarget: target }) => target.select())
			txtConfigFile.on('change', ({ currentTarget: target }) => args.configFile = target.value?.trim());

			const txtQuery = tabPage.find(`#query`);
			let _queries = null;
			if (!$.isEmptyObject(args.query)) {
				_queries = [];
				for (const i in args.query) {
					const queryInfo = args.query[i];
					const _query = queryInfo.query;
					if (_query != null)
						_queries.push(_query);
				}
			}
			txtQuery.val(_queries ? _queries.join('\nGO\n') : '');
			txtQuery.on('focus', evt =>
				evt.target.select())
			txtQuery.on('change', evt => {
				const {value} = evt.target;
				args.execTip = args.execTip || 'none';
				args.query =
					value
						? value.split('\nGO\n').map(x => { return { query: x } })
						: [];
			});

			const txtDosya = tabPage.find(`#dosya`);
			txtDosya.val(args.dosya);
			txtDosya.on('focus', evt =>
				evt.target.select())
			txtDosya.on('change', evt => {
				delete args.appFile;
				delete args.file;
				args.dosya = (evt.target.value || '').trim();
			});

			const txtArgs = tabPage.find(`#args`);
			txtArgs.val($.isEmptyObject(args.args) ? '' : (args.args?.join?.('\n')) ?? args.args);
			txtArgs.on('focus', evt =>
				evt.target.select())
			txtArgs.on('change', evt => {
				const {value} = evt.target;
				const arr = value ? value.split('\n').map(x => x.trimEnd(' ', '\t', '\r')) : null;
				args.args = arr;
			});
			const txtUrl = tabPage.find(`#url`); txtUrl.val(args.url);
			txtUrl.on('focus', evt => evt.target.select())
			txtUrl.on('change', evt => { args.url = evt.target.value; args.httpMethod = args.httpMethod || 'GET' });
			const txtPOSTData = tabPage.find(`#postData`); txtPOSTData.val(args.args);
			txtPOSTData.on('focus', evt => evt.target.select())
			txtPOSTData.on('change', evt => { const {value} = evt.target; args.postData = args; args.httpMethod = args.postData ? 'POST' : 'GET'; });
			const srcDestDirParent = tabPage.find(`#srcDestDirParent`);
			const txtSrcDir = srcDestDirParent.find(`#srcDirParent #srcDir`);
			txtSrcDir.val(args.src || args.srcDir);
			txtSrcDir.on('change', evt => {
				const {value} = evt.target;
				delete args.srcDir;
				args.src = (value || '').trim();
			});
			const txtDestDir = srcDestDirParent.find(`#destDirParent #destDir`);
			txtSrcDir.val(args.dest || args.destDir || args.target || args.targetDir);
			txtSrcDir.on('change', evt => {
				const {value} = evt.target;
				delete args.destDir;
				delete args.target;
				delete args.targetDir;
				args.dest = (value || '').trim();
			});

			const pdksSubConfigParent = tabPage.find(`#pdksSubConfig_parent`);
			const txtODBCName = pdksSubConfigParent.find(`#pdksODBCName`);
			txtODBCName.val(args.odbcName);
			txtODBCName.on('change', evt => {
				const {value} = evt.target;
				args.odbcName = (value || '').trimEnd()
			});
			const txtPDKSCihazKod = pdksSubConfigParent.find(`#pdksCihazKod`);
			txtPDKSCihazKod.val(args.cihazKod);
			txtPDKSCihazKod.on('change', evt => {
				const {value} = evt.target;
				args.cihazKod = (value || '').trimEnd()
			});
			const txtPdksWSIP = pdksSubConfigParent.find(`#pdksWSIP`); txtPdksWSIP.val(args.wsIP);
			txtPdksWSIP.on('change', evt => { const {value} = evt.target; args.wsIP = (value || '').trim() });
			const txtPdksWSPort = pdksSubConfigParent.find(`#pdksWSPort`); txtPdksWSPort.val(args.wsPort || null);
			txtPdksWSPort.on('change', evt => { const {value} = evt.target; args.wsPort = asInteger((value || '').trim()) ?? null });
			const txtPdksUser = pdksSubConfigParent.find(`#pdksUser`);
			txtPdksUser.val(args.user);
			txtPdksUser.on('change', evt => {
				const {value} = evt.target;
				args.user = (value || '').trim();
			});
			const txtPdksPass = pdksSubConfigParent.find(`#pdksPass`);
			txtPdksPass.val(args.pass);
			txtPdksPass.on('change', evt => {
				const {value} = evt.target;
				args.pass = (value || '').trim();
			});
			const txtPdksMaxWait = pdksSubConfigParent.find(`#pdksMaxWait`);
			txtPdksMaxWait.val(args.maxWait);
			txtPdksMaxWait.on('change', evt => {
				const {value} = evt.target;
				evt.target.value = args.maxWait = asFloat(value || 0);
			});

			const getTSStr = value => {
				if (value && typeof value == 'string')
					value = asDate(value);
				return value ? value.toString('yyyy-MM-ddTHH:mm') : null
			}
			const pdks_tarihBS_parent = pdksSubConfigParent.find('#pdks_tarihBS_parent');
			const txtPdksBasTS = pdks_tarihBS_parent.find('#pdksBasTS');
			txtPdksBasTS.val(getTSStr(args.basTS) || '');
			txtPdksBasTS.on('change', evt => {
				const {value} = evt.target;
				args.basTS = asDateTimeAndToString(value) || '';
			});
			pdks_tarihBS_parent.find('.bs-ayirac')
				.jqxButton({ theme: theme })
				.on('click', evt => {
					const target = $(evt.currentTarget);
					const next = target.next();
					next.val(target.prev().val());
					next.trigger('change')
				});
			const txtPdksSonTS = pdks_tarihBS_parent.find('#pdksSonTS');
			txtPdksSonTS.val(getTSStr(args.sonTS) || '');
			txtPdksSonTS.on('change', evt => {
				const {value} = evt.target;
				args.sonTS = asDateTimeAndToString(value) || '';
			});
			pdks_tarihBS_parent.find('input[type="datetime-local"]')
				.on('focus', evt =>
					evt.target.select());

			const eMailSubConfigParent = tabPage.find(`#eMailSubConfig_parent`);
			const txtEMailServerURL = eMailSubConfigParent.find(`#eMailServerURL`);
			txtEMailServerURL.val(args.serverURL);
			txtEMailServerURL.on('change', evt => {
				const {value} = evt.target;
				args.serverURL = (value || '').trimEnd();
			});

			const eMailQueueSubConfigParent = tabPage.find(`#eMailQueueSubConfig_parent`);
			const txteMailQueueServerURL = eMailQueueSubConfigParent.find(`#eMailQueueServerURL`);
			txteMailQueueServerURL.val(args.serverURL);
			txteMailQueueServerURL.on('change', evt => {
				const {value} = evt.target;
				args.serverURL = (value || '').trimEnd();
			});

			const skyBulutYedekleme_subConfigParent = tabPage.find(`#skyBulutYedekleme_subConfig_parent`);
			const txtUserID = skyBulutYedekleme_subConfigParent.find(`#skyBulutYedekleme_userID`);
			txtUserID.val(args.userID);
			txtUserID.on('change', evt => {
				const {value} = evt.target;
				args.userID = (value || '').trim();
			});
			const txtUserPass = skyBulutYedekleme_subConfigParent.find(`#skyBulutYedekleme_userPass`);
			txtUserPass.val(args.userPass);
			txtUserPass.on('change', evt => {
				const {value} = (evt.target || '').trimEnd();
				args.userPass = value ? (value.length == 32 ? value : md5(value)) : null;
			});
			const txtBackupServer = skyBulutYedekleme_subConfigParent.find(`#skyBulutYedekleme_backupServer`);
			txtBackupServer.val(args.backupServer);
			txtBackupServer.on('change', evt => {
				const {value} = evt.target;
				args.backupServer = (value || '').trim();
			});
			const txtBackupPass = skyBulutYedekleme_subConfigParent.find(`#skyBulutYedekleme_backupPass`);
			txtBackupPass.val(args.backupPass);
			txtBackupPass.on('change', evt => {
				let {value} = evt.target;
				value = (value || '').trim();
				// if (value && value.length != 32)
				// value = md5(value);
				args.backupPass = value;
			});
			const txtSQLBackupDir = skyBulutYedekleme_subConfigParent.find(`#skyBulutYedekleme_sqlBackupDir`);
			txtSQLBackupDir.val(args.sqlBackupDir);
			txtSQLBackupDir.on('change', evt => {
				const {value} = evt.target;
				args.sqlBackupDir = (value || '').trim();
			});
			const txtFilePatterns = skyBulutYedekleme_subConfigParent.find(`#skyBulutYedekleme_filePatterns`);
			txtFilePatterns.val(args.filePatterns ? args.filePatterns.join(CrLf) : '');
			txtFilePatterns.on('change', evt => {
				const value = evt.target.value || '';
				args.filePatterns = value ? value.split('\n').map(x => x.trim()).filter(x => !!x) : null;
			});

			const eIslemTipi_parent = tabPage.find(`#eIslemTipi_parent`);
			const txtEIslemTipi = eIslemTipi_parent.find(`#eIslemTipi`);
			(() => {
				const subArgs = args.eIslemTipi || {};
				txtEIslemTipi.val(SkyConfigBirKismiListePart.getSelectionText({
					tekilmi: false,
					hepsimi: subArgs.hepsimi == null ? true : asBool(subArgs.hepsimi),
					kodListe: (subArgs.deger ? subArgs.deger.split(delimWS) : [])
				}));
			})();
			const btnEIslemTipi_sec = eIslemTipi_parent.find(`#eIslemTipi_sec`);
			btnEIslemTipi_sec.jqxButton({ theme: theme });
			btnEIslemTipi_sec.on('click', evt => {
				const subArgs = args.eIslemTipi = args.eIslemTipi || {};
				new SkyConfigBirKismiListePart({
					title: 'e-İşlem Tipi',
					tekilmi: false,
					recs: app.eIslemTipKAListe,
					hepsimi: subArgs.hepsimi == null ? true : asBool(subArgs.hepsimi),
					kodSet: asSet(
						subArgs.deger == null
							? []
							: (typeof subArgs.deger == 'object' ? subArgs.deger : subArgs.deger.split(delimWS))
					),
					tamamIslemi: e => {
						const {hepsimi, kodSet} = e;
						subArgs.hepsimi = hepsimi;
						subArgs.deger = (
							hepsimi
								? null
								: Object.keys(kodSet || {}).join(delimWS)
						);
						txtEIslemTipi.val(e.selectionText);
					}
				}).open();
			});
			const tarihBS_parent = tabPage.find(`#tarihBS_parent`);
			const txtTarih_basi = tarihBS_parent.find(`#tarih_basi`);
			txtTarih_basi.val(dateToString((args.tarih || {}).basi));
			txtTarih_basi.on('change', evt => {
				let {value} = evt.target;
				const bs = args.tarih = args.tarih || {};
				value = evt.target.value = bs.basi = (tarihDegerDuzenlenmis(value || '') || '').trim();
			});
			const txtTarih_sonu = tarihBS_parent.find(`#tarih_sonu`);
			txtTarih_sonu.val(dateToString((args.tarih || {}).sonu));
			txtTarih_sonu.on('change', evt => {
				let {value} = evt.target;
				const bs = args.tarih = args.tarih || {};
				value = evt.target.value = bs.sonu = (tarihDegerDuzenlenmis(value || '') || '').trim();
			});
			const seriNoBS_parent = tabPage.find(`#seriNoBS_parent`);
			const txtSeri_basi = seriNoBS_parent.find(`#seri_basi`);
			txtSeri_basi.val((args.seri || {}).basi);
			txtSeri_basi.on('change', evt => {
				let {value} = evt.target;
				const bs = args.seri = args.seri || {};
				value = evt.target.value = bs.basi = (value || '').trim().toUpperCase();
			});
			const txtSeri_sonu = seriNoBS_parent.find(`#seri_sonu`);
			txtSeri_sonu.val((args.seri || {}).sonu);
			txtSeri_sonu.on('change', evt => {
				let {value} = evt.target;
				const bs = args.seri = args.seri || {};
				value = evt.target.value = bs.sonu = (value || '').trim().toUpperCase();
			});
			const txtNo_basi = seriNoBS_parent.find(`#no_basi`);
			txtNo_basi.val((args.no || {}).basi);
			txtNo_basi.on('change', evt => {
				let {value} = evt.target;
				const bs = args.no = args.no || {};
				value = evt.target.value = bs.basi = asInteger((value || '').trim());
			});
			const txtNo_sonu = seriNoBS_parent.find(`#no_sonu`);
			txtNo_sonu.val((args.no || {}).sonu);
			txtNo_sonu.on('change', evt => {
				let {value} = evt.target;
				const bs = args.no = args.no || {};
				value = evt.target.value = bs.sonu = asInteger((value || '').trim());
			});
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

			const chkWebOtomasyonlari = tabPage.find(`#chkWebOtomasyonlari_parent #chkWebOtomasyonlari`);
			chkWebOtomasyonlari.prop('checked', asBool(args.web || args.webOtomasyonlari));
			chkWebOtomasyonlari.parent()[chkWebOtomasyonlari.is(':checked') ? 'addClass' : 'removeClass']('checked');
			chkWebOtomasyonlari.on('change', evt => {
				const elm = $(evt.currentTarget);
				const flag = elm.is(':checked');
				elm.parent()[flag ? 'addClass' : 'removeClass']('checked');
				delete args.webOtomasyonlari;
				args.web = flag;
			});

			const chkDownloadOnly = tabPage.find(`#chkDownloadOnly_parent #chkDownloadOnly`);
			const chkDownloadOnly_onChange = evt => {
				const elm = (evt && evt.currentTarget ? $(evt.currentTarget) : chkDownloadOnly);
				const flag = elm.is(':checked');
				elm.parent()[flag ? 'addClass' : 'removeClass']('checked');
				delete args.noInstall;
				args.downloadOnly = flag;
				chkWebOtomasyonlari.removeClass('jqx-hidden');
				chkWebOtomasyonlari.parent()[flag ? 'addClass' : 'removeClass']('basic-hidden');
			};
			const downloadOnlyFlag = asBool(args.downloadOnly || args.noInstall);
			chkDownloadOnly.prop('checked', downloadOnlyFlag);
			if (downloadOnlyFlag)
				chkDownloadOnly_onChange();
			chkDownloadOnly.on('change', evt =>
				chkDownloadOnly_onChange(evt));

			const chkUzakDestek = tabPage.find(`#chkUzakDestek_parent #chkUzakDestek`);
			chkUzakDestek.prop('checked', !!(args.uzakDestek || args.uzakDestekProg || args.uzakDestekProgName));
			chkUzakDestek.parent()[chkUzakDestek.is(':checked') ? 'addClass' : 'removeClass']('checked');
			chkUzakDestek.on('change', evt => {
				const elm = $(evt.currentTarget);
				const flag = elm.is(':checked');
				elm.parent()[flag ? 'addClass' : 'removeClass']('checked');
				delete args.uzakDestekProg;
				delete args.uzakDestekProgName;
				args.uzakDestek = flag ? app.vioUzakDestekPaketAdi : null;
			});

			const elms = [
				tabPage.find(`input[type=text]`),
				tabPage.find(`input[type=textbox]`)
			];
			for (let i = 0; i < elms.length; i++) {
				elms[i].on('click', evt =>
					evt.target.select());
			}

			const paketler_parent = this.paketler_parent = tabPage.find(`#paketler_parent`);
			const divPaketler = paketler_parent.find(`#paketler`);
			const paketlerPart = this.paketlerPart = new DataTablePart({
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
					const paketler = args.paketler || args.paket || args.paketListe;
					if (!$.isEmptyObject(paketler)) {
						const {widget} = this.paketlerPart;
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
					const {widget} = this.paketlerPart;
					if (uid != null) {
						const rowInfo = widget.rowinfo[uid];
						if (rowInfo.selected)
							widget.unselectrowbykey(uid);
						else
							widget.selectrowbykey(uid);

						delete args.paketListe;
						delete args.paket;
						args.paketler = widget.getSelection().map(rec => rec.paketAdi);
					}
				}
			});
		}

		async initTabContent_gorev(e) {
			const {tabPage} = e;
			const {args} = this;
			let {gorev} = args;
			const ddZamanlama = this.ddZamanlama = tabPage.find(`#zamanlama`).jqxDropDownList({
				theme: theme, valueMember: 'kod', displayMember: 'aciklama',
				width: 120, height: false,
				autoDropDownHeight: false, dropDownHeight: 105,
				source: new $.jqx.dataAdapter({
					id: `kod`, datatype: 'array',
					localdata: [
						{ kod: '', aciklama: ` ` },
						{ kod: 'gunluk', aciklama: `Günlük` },
						{ kod: 'dakikalik', aciklama: `Dakikalık` }
					]
				}, {
					autoBind: false, async: true, cache: true
				})
			});
			ddZamanlama.on('change', evt => {
				const {value} = evt.args.item;
				this.zamanlamaDegisti($.extend({}, e, { event: evt, value: value }));
				gorev = args.gorev;
			})
			if (gorev)
				ddZamanlama.val(gorev.zamanlama);

			const txtBasTS = tabPage.find(`#basTS`);
			if (gorev && (gorev.basSaat || gorev.basTS))
				txtBasTS.val(timeToString(asDate(gorev.basSaat || gorev.basTS)));
			txtBasTS.on('change', evt => {
				const value = timeToString(asDate(Utils.timeFormatString(evt.target.value)));
				evt.target.value = value;
				if (gorev)
					gorev.basSaat = value;
			});

			const txtTekrar = tabPage.find(`#tekrar`);
			if (gorev && gorev.tekrar)
				txtTekrar.val(timeToString(asDate(gorev.tekrar)));
			txtTekrar.on('change', evt => {
				const value = timeToString(asDate(Utils.timeFormatString(evt.target.value)));
				evt.target.value = value;
				if (gorev)
					gorev.tekrar = value;
			});
		}

		close_araIslemler(e) {
			super.close_araIslemler(e);

			const {app, wndContent} = this;
			app.jqueryFind({
				getter: () => wndContent.find(`.jqx-validator`),
				action: obj => {
					obj.jqxValidator('destroy');
					obj.remove();
				}
			});
		}

		setValues(e) {
			super.setValues(e);

			$.extend(this, {
				baslikText: e.baslikText == null ? this.baslikText : e.baslikText,
				servisID: e.servisID == null ? this.servisID : e.servisID,
				args: (e.args == null ? this.args : e.args) || {}
			});
		}

		wndArgsDuzenle(e) {
			super.wndArgsDuzenle(e);

			const minWidth = Math.min($(window).width(), 900);
			const minHeight = Math.min($(window).height(), 650);
			$.extend(e.args, {
				width: Math.max(1000, minWidth),
				height: Math.max(800, minHeight),
				minWidth: minWidth, minHeight: minHeight
			})
		}

		tamamIstendi_argsDuzenle(e) {
			super.tamamIstendi_argsDuzenle(e);

			$.extend(e.args, {
				id: this.servisID,
				args: this.args
			})
		}
		

		tipDegisti(e) {
			const {wndContent, args} = this, {tip} = args;
			wndContent.find(`.panel #servis.jqx-tabs-content-element .ek-ayar`).addClass(`jqx-hidden`);
			if (tip) { wndContent.find(`.panel #servis.jqx-tabs-content-element .ek-ayar.${tip}`).removeClass(`jqx-hidden`) }

			switch (tip) {
				case 'vioGuncelle': {
					const {paketlerPart} = this; if (!this.isDestroyed && paketlerPart && !paketlerPart.widget) {
						const parent = paketlerPart.layout.parent()
						paketlerPart.basicRun();
						paketlerPart.layout
							.detach()
							.appendTo(parent);
					}
					break
				}
				case 'frp': case 'frps': {
					let txtConfigFile = wndContent.find('#configFile'), defaultConfigFile = `c:\\vio\\cmd\\frp${tip == 'frps' ? 's' : 'c'}.ini`;
					txtConfigFile.attr('placeholder', defaultConfigFile);
					txtConfigFile.val(args.configFile = args.configFile ?? (args.args || tip != 'frp' ? '' : defaultConfigFile));
					break
				}
			}
		}

		serverVeTekilVTDegisti(e) {
			const {wndContent, args} = this;
			const {server} = args;
			const vt = args.db || args.vt;
			const txtServerVeTekilVT = wndContent.find(`.panel #servis.jqx-tabs-content-element #serverVeTekilVT`);
			if (!server && $.isEmptyObject(vt))
				txtServerVeTekilVT.val('');
			else
				txtServerVeTekilVT.val(`${server || ''} - ${vt || ''}`);
		}

		serverVeVTDegisti(e) {
			const {wndContent, args} = this;
			const {server} = args;
			const vtListe = args.dbListe || args.vtListe;
			const txtServerVeVT = wndContent.find(`.panel #servis.jqx-tabs-content-element #serverVeVT`);
			if (!server && $.isEmptyObject(vtListe))
				txtServerVeVT.val('');
			else
				txtServerVeVT.val(`${server || ''} - ${(vtListe || []).join(', ')}`);
		}

		zamanlamaDegisti(e) {
			const {wndContent, args} = this;
			const divGorevDetaylar = wndContent.find(`.panel div#gorev .gorev-detaylar`);
			const zamanlama = e.value == null ? (args.gorev ? args.gorev.zamanlama : null) : e.value;
			const divZamanlamaDetaylar = divGorevDetaylar.find(`.zamanlama-detaylar`);
			divZamanlamaDetaylar.children().addClass(`jqx-hidden`);
			if (zamanlama) {
				const gorev = args.gorev = args.gorev || {};
				if (!gorev.id)
					gorev.id = args.id || args.parentID || this.servisID || newGUID();
				gorev.zamanlama = zamanlama;
				
				switch (zamanlama) {
					case 'gunluk':
						divZamanlamaDetaylar.find(`.basTS.zamanlama-detay`).removeClass(`jqx-hidden`);
						break;
					case 'dakikalik':
						divZamanlamaDetaylar.find(`.basTS.zamanlama-detay`).removeClass(`jqx-hidden`);
						divZamanlamaDetaylar.find(`.tekrar.zamanlama-detay`).removeClass(`jqx-hidden`);
						break;
				}
				divGorevDetaylar.removeClass(`jqx-hidden`);
			}
			else {
				args.gorev = null;
				divGorevDetaylar.addClass(`jqx-hidden`);
			}
		}
		

		serverVeTekilVTSecIstendi(e) {
			const {wndContent, args} = this;
			new SkyConfigVTSecPart({
				tekil: true,
				server: args.server || '',
				vt: args.db || args.vt,
				tamamIslemi: _e => {
					delete args.vt;
					
					const {server} = _e;
					const vt = _e.db || _e.vt;
					let degistimi = false;
					if (server != null) {
						args.server = server;
						degistimi = true;
					}
					delete args.db;
					if (vt != null) {
						args.db = vt;
						degistimi = true;
					}

					if (degistimi)
						this.serverVeTekilVTDegisti($.extend({}, e, _e));
				}
			}).open()
		}

		serverVeVTSecIstendi(e) {
			const {wndContent, args} = this;
			new SkyConfigVTSecPart({
				server: args.server || '',
				vtListe: args.dbListe || args.vtListe || [],
				tamamIslemi: _e => {
					const {server} = _e;
					const vtListe = _e.dbListe || _e.vtListe;
					let degistimi = false;
					delete args.vt;
					if (server != null) {
						args.server = server;
						degistimi = true;
					}
					if (vtListe != null) {
						args.dbListe = vtListe;
						degistimi = true;
					}

					if (degistimi)
						this.serverVeVTDegisti($.extend({}, e, _e));
				}
			}).open()
		}
		
		async wnd_onResize(e) {
			await super.wnd_onResize(e);

			const {paketlerPart} = this;
			if (paketlerPart && !paketlerPart.isDestroyed && paketlerPart.widget && paketlerPart.widgetPart) {
				const {wnd, paketler_parent} = this;
				const divPaketler = paketlerPart.widgetPart;
				let height = wnd.height() - (divPaketler.position().top + 35);
				divPaketler.jqxDataTable('height', height);
			}
		}
	}
})()
