(function() {
	window.SkyConfigConfPart = class extends window.SkyConfigInnerPartWithTabs {
		static get partName() { return 'conf' }
		get vioConfig() { return this._vioConfig = this._vioConfig || {} }
		set vioConfig(value) { this._vioConfig = value }
		get rootConfig() { return this._rootConfig = this._rootConfig || {} }
		set rootConfig(value) { this._rootConfig = value }
		get wsConfig() { return this._wsConfig = this._wsConfig || {} }
		set wsConfig(value) { this._wsConfig = value }
		
		async initTabContent(e) {
			await super.initTabContent(e); await this.initTabContent_devam(e); const {tabPage} = e;
			tabPage.find(`input[type=text]`, `input[type=textbox]`)
				.off('focus')
				.on('focus', evt =>
					evt.target.select())
		}
		async initTabContent_devam(e) {
			const {tabID} = e;
			switch (tabID) {
				case 'vio': return await this.initTabContent_vio(e)
				case 'ws': return await this.initTabContent_ws(e)
				case 'genel': return await this.initTabContent_genel(e)
				case 'cariEFatSorgu': return await this.initTabContent_cariEFatSorgu(e)
				case 'skyMES': return await this.initTabContent_skyMES(e);
				case 'skyCafe': return await this.initTabContent_skyCafe(e)
				case 'pdks': return await this.initTabContent_pdks(e)
				case 'skyBulutYedekleme': return await this.initTabContent_skyBulutYedekleme(e)
				case 'elterm': return await this.initTabContent_elterm(e)
				case 'eMail': return await this.initTabContent_eMail(e)
				case 'eMailQueue': return await this.initTabContent_eMailQueue(e)
				case 'eIslemGonder': return await this.initTabContent_eIslemGonder(e)
				case 'eIslemAkibetSorgula': return await this.initTabContent_eIslemAkibetSorgula(e)
				case 'gelenEIslemSorgula': return await this.initTabContent_gelenEIslemSorgula(e)
				case 'eIslemArsivle': return await this.initTabContent_eIslemArsivle(e)
				case 'eMutabakat': return await this.initTabContent_eMutabakat(e)
				case 'skyERP': return await this.initTabContent_skyERP(e)
				case 'skyTablet': return await this.initTabContent_skyTablet(e)
				case 'sgk': return await this.initTabContent_sgk(e)
			}
		}
		async initTabContent_vio(e) {
			const {vioConfig} = this, {tabPage} = e;
			const focusStates = this.focusStates = this.focusStates || {};
			const tanitimParent = tabPage.find(`#tanitim_parent`);
			const txtTanitim = tanitimParent.find(`#tanitim`);
			txtTanitim.val(vioConfig.tanitim || '');
			tanitimParent[vioConfig.tanitim ? 'removeClass' : 'addClass']('empty');
			const chkTerminal = tabPage.find(`#chkTerminal_parent #chkTerminal`);
			chkTerminal.prop('checked', !!vioConfig.terminalmi);
			chkTerminal.parent()[vioConfig.terminalmi ? 'addClass' : 'removeClass']('checked');
			chkTerminal.on('change', evt => {
				const flag = this.vioConfig.terminalmi = chkTerminal.is(':checked');
				chkTerminal.parent()[flag ? 'addClass' : 'removeClass']('checked');
				this.vioConfigKaydet(e);
			});
			const chkCokluYedekleme = tabPage.find(`#chkCokluYedekleme_parent #chkCokluYedekleme`);
			chkCokluYedekleme.prop('checked', !!vioConfig.cokluYedekleme);
			chkCokluYedekleme.parent()[vioConfig.cokluYedekleme ? 'addClass' : 'removeClass']('checked');
			chkCokluYedekleme.on('change', evt => {
				const flag = this.vioConfig.cokluYedekleme = chkCokluYedekleme.is(':checked');
				chkCokluYedekleme.parent()[flag ? 'addClass' : 'removeClass']('checked');
				this.vioConfigKaydet(e)
			});
			const chkEIslemLog = tabPage.find(`#chkEIslemLog_parent #chkEIslemLog`);
			chkEIslemLog.prop('checked', !!vioConfig.eIslemLog);
			chkEIslemLog.parent()[vioConfig.eIslemLog ? 'addClass' : 'removeClass']('checked');
			chkEIslemLog.on('change', evt => {
				const flag = this.vioConfig.eIslemLog = chkEIslemLog.is(':checked');
				chkEIslemLog.parent()[flag ? 'addClass' : 'removeClass']('checked');
				this.vioConfigKaydet(e);
			});
			const sql = vioConfig.sql = vioConfig.sql || {};
			const txtSqlAnaSistem = tabPage.find(`#sqlAnaSistem_parent #sqlAnaSistem`);
			txtSqlAnaSistem.val(sql.server || '');
			txtSqlAnaSistem.on('focus', evt =>
				focusStates.sqlAnaSistem = true);
			txtSqlAnaSistem.on('change', evt => {
				if (!focusStates.sqlAnaSistem)
					return
				this.vioConfig.sql.server = (evt.target.value || '').trimEnd();
				this.vioConfigKaydet(e)
			});
			setTimeout(() => {
				if (this.isDestroyed || !(tabPage && tabPage.length))
					return
				const {vioConfig} = this, sql = vioConfig.sql = vioConfig.sql || {};
				const txtSqlUser = tabPage.find(`#sqlLogin_parent #sqlUser`);
				txtSqlUser.val(sql.user || '');
				txtSqlUser.on('focus', evt => focusStates.sqlUser = true);
				txtSqlUser.on('change', evt => {
					if (!focusStates.sqlUser)
						return
					this.vioConfig.sql.user = (evt.target.value || '').trimEnd();
					this.vioConfigKaydet(e)
				});
				const txtSqlPass = tabPage.find(`#sqlLogin_parent #sqlPass`);
				txtSqlPass.val(sql.pass || '');
				txtSqlUser.on('focus', evt =>
					focusStates.sqlPass = true);
				txtSqlPass.on('change', evt => {
					if (!focusStates.sqlPass)
						return
					this.vioConfig.sql.pass = (evt.target.value || '').trimEnd();
					this.vioConfigKaydet(e)
				});
			}, 500);
			const txtGuncellemeSunucusu = tabPage.find(`#guncellemeSunucusu_parent #guncellemeSunucusu`);
			txtGuncellemeSunucusu.on('change', evt => { this.vioConfig.remoteServer = (evt.target.value || '').trimEnd(); this.vioConfigKaydet(e) });
			txtGuncellemeSunucusu.val(vioConfig.remoteServer || '')
		}
		async initTabContent_ws(e) {
			const {tabPage} = e, {rootConfig} = this, sql = rootConfig.sql || {};
			const txtServerIP = tabPage.find(`#serverIP_parent #serverIP`);
			txtServerIP.val(rootConfig.serverIP ? rootConfig.serverIP.join('\n') : '' );
			txtServerIP.on('change', evt => {
				const {rootConfig} = this, {value} = evt.target;
				rootConfig.serverIP = value ? value.split('\n').map(x => x.replace('\r', '').trim()).filter(x => !!x) : null;
				this.rootConfigKaydet(e)
			});
			const chkSingleConn = tabPage.find(`#sql_parent #chkSingleConn_parent #ws_chkSingleConn`);
			const singleConnFlag = sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection;
			chkSingleConn.prop('checked', singleConnFlag);
			chkSingleConn.parent()[singleConnFlag ? 'addClass' : 'removeClass']('checked');
			chkSingleConn.on('change', evt => {
				const {rootConfig} = this, sql = rootConfig.sql = rootConfig.sql || {};
				delete sql.singleConn; delete sql.sqlSingleConn; delete sql.sqlSingleConnection;
				const flag = sql.singleConn = chkSingleConn.is(':checked');
				chkSingleConn.parent()[flag ? 'addClass' : 'removeClass']('checked');
				this.rootConfigKaydet(e)
			});
			const btnSql_vtSec = tabPage.find(`#sql_parent #sql_vtSec`);
			btnSql_vtSec.jqxButton({ theme: theme }).on('click', evt =>
				this.ws_sql_vtSecIstendi({ event: evt, id: evt.currentTarget.id }));
			const txtServiceControlCheckDelay = tabPage.find(`#serviceControlCheckDelay_parent #serviceControlCheckDelay`);
			txtServiceControlCheckDelay.val(rootConfig.serviceControlCheckDelay || '');
			txtServiceControlCheckDelay.on('change', evt => {
				const {rootConfig} = this, value = timeToString(asDate(Utils.timeFormatString(evt.target.value)));
				evt.target.value = value; rootConfig.serviceControlCheckDelay = value.trim();
				this.rootConfigKaydet(e)
			});
			const txtRemoteCommandServer = tabPage.find(`#remoteCommandServer_parent #remoteCommandServer`);
			txtRemoteCommandServer.val(rootConfig.remoteCommandServer || '');
			txtRemoteCommandServer.on('change', evt => {
				const {rootConfig} = this, value = evt.target.value || '';
				evt.target.value = value; rootConfig.remoteCommandServer = value.trim();
				this.rootConfigKaydet(e)
			});
			const chkCVMPanicFlag = tabPage.find(`#cvmPanicFlag_parent #cvmPanicFlag`);
			const cvmPanicFlag = rootConfig.cvmPanic == null ? true : rootConfig.cvmPanic;
			chkCVMPanicFlag.prop('checked', cvmPanicFlag);
			chkCVMPanicFlag.parent()[cvmPanicFlag ? 'addClass' : 'removeClass']('checked');
			chkCVMPanicFlag.on('change', evt => {
				const {rootConfig} = this, flag = rootConfig.cvmPanic = chkCVMPanicFlag.is(':checked');
				chkCVMPanicFlag.parent()[flag ? 'addClass' : 'removeClass']('checked'); this.rootConfigKaydet(e)
			});
			const chkCVMPanicVIOFlag = tabPage.find(`#cvmPanicVIOFlag_parent #cvmPanicVIOFlag`);
			const cvmPanic_vioSonlandirFlag = rootConfig.cvmPanic_vioSonlandir;
			chkCVMPanicVIOFlag.prop('checked', cvmPanic_vioSonlandirFlag);
			chkCVMPanicVIOFlag.parent()[cvmPanic_vioSonlandirFlag ? 'addClass' : 'removeClass']('checked');
			chkCVMPanicVIOFlag.on('change', evt => {
				const {rootConfig} = this, flag = rootConfig.cvmPanic_vioSonlandir = chkCVMPanicVIOFlag.is(':checked');
				chkCVMPanicVIOFlag.parent()[flag ? 'addClass' : 'removeClass']('checked'); this.rootConfigKaydet(e)
			})
		}
		async initTabContent_genel(e) {
			const key = 'genel', {tabPage} = e, {wsConfig} = this, subWSConfig = wsConfig[key] || {}, sql = subWSConfig.sql || {}, altConfig = subWSConfig.config || {};
			const chkSingleConn = tabPage.find(`#sql_parent #chkSingleConn_parent #genel_chkSingleConn`);
			const singleConnFlag = sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection;
			chkSingleConn.prop('checked', singleConnFlag);
			chkSingleConn.parent()[singleConnFlag ? 'addClass' : 'removeClass']('checked');
			chkSingleConn.on('change', evt => {
				const {wsConfig} = this, subWSConfig = wsConfig[key] = wsConfig[key] || {}, sql = subWSConfig.sql = subWSConfig.sql || {};
				delete sql.singleConn; delete sql.sqlSingleConn; delete sql.sqlSingleConnection;
				const flag = sql.singleConn = chkSingleConn.is(':checked');
				chkSingleConn.parent()[flag ? 'addClass' : 'removeClass']('checked'); this.rootConfigKaydet(e)
			});
			const btnSql_vtSec = tabPage.find(`#sql_parent #sql_vtSec`);
			btnSql_vtSec.jqxButton({ theme: theme }).on('click', evt =>
				this.genel_sql_vtSecIstendi({ event: evt, id: evt.currentTarget.id }));
			let elm = tabPage.find('#resimAnaBolum');
			elm.val(altConfig.resimAnaBolum || '')
			elm.on('change', evt => {
				const {wsConfig} = this; const subWSConfig = wsConfig[key] = wsConfig[key] || {}, altConfig = subWSConfig.config = subWSConfig.config || {};
				const elm = evt.currentTarget; elm.value = altConfig.resimAnaBolum = (elm.value || '').replaceAll('\\', '/'); this.rootConfigKaydet(e)
			})
		}
		async initTabContent_cariEFatSorgu(e) {
			const {tabPage} = e, {wsConfig} = this, subWSConfig = wsConfig.cariEFatSorgu || {}, sql = subWSConfig.sql || {};
			const chkSingleConn = tabPage.find(`#ekSql_parent #chkSingleConn_parent #cariEFatSorgu_chkSingleConn`);
			const singleConnFlag = sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection;
			chkSingleConn.prop('checked', singleConnFlag);
			chkSingleConn.parent()[singleConnFlag ? 'addClass' : 'removeClass']('checked');
			chkSingleConn.on('change', evt => {
				const {wsConfig} = this, subWSConfig = wsConfig.cariEFatSorgu = wsConfig.cariEFatSorgu || {};
				const sql = subWSConfig.sql = subWSConfig.sql || {};
				delete sql.singleConn; delete sql.sqlSingleConn; delete sql.sqlSingleConnection;
				const flag = sql.singleConn = chkSingleConn.is(':checked');
				chkSingleConn.parent()[flag ? 'addClass' : 'removeClass']('checked'); this.rootConfigKaydet(e)
			});
			const btnEkSql_vtSec = tabPage.find(`#ekSql_parent #ekSql_vtSec`);
			btnEkSql_vtSec.jqxButton({ theme: theme }).on('click', evt =>
				this.cariEFatSorgu_ekSql_vtSecIstendi({ event: evt, id: evt.currentTarget.id }));
		}
		async initTabContent_skyMES(e) {
			const {tabPage} = e, {wsConfig} = this, subWSConfig = wsConfig['skyMES/hatIzleme'] || {}, sql = subWSConfig.sql || {};
			const chkSingleConn = tabPage.find(`#sql_parent #chkSingleConn_parent #skyMES_chkSingleConn`);
			const singleConnFlag = sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection;
			chkSingleConn.prop('checked', singleConnFlag);
			chkSingleConn.parent()[singleConnFlag ? 'addClass' : 'removeClass']('checked');
			chkSingleConn.on('change', evt => {
				const {wsConfig} = this;
				const subWSConfig = wsConfig['skyMES/hatIzleme'] = wsConfig['skyMES/hatIzleme'] || {}, sql = subWSConfig.sql = subWSConfig.sql || {};
				delete sql.singleConn; delete sql.sqlSingleConn; delete sql.sqlSingleConnection;
				const flag = sql.singleConn = chkSingleConn.is(':checked');
				chkSingleConn.parent()[flag ? 'addClass' : 'removeClass']('checked');
				const subWSConfig_skyMakineDurum = wsConfig['skyMES/makineDurum'] = wsConfig['skyMES/makineDurum'] || {};
				subWSConfig_skyMakineDurum.sql = subWSConfig.sql;
				this.rootConfigKaydet(e);
			});
			
			const btnSql_vtSec = tabPage.find(`#sql_parent #sql_vtSec`);
			btnSql_vtSec.jqxButton({ theme: theme }).on('click', evt =>
				this.skyMES_sql_vtSecIstendi({ event: evt, id: evt.currentTarget.id }));
		}
		async initTabContent_skyCafe(e) {
			const {tabPage} = e, {wsConfig} = this, subWSConfig = wsConfig['skyCafe/rest'] || {}, sql = subWSConfig.sql || {};
			const chkSingleConn = tabPage.find(`#sql_parent #chkSingleConn_parent #skyCafe_chkSingleConn`);
			const singleConnFlag = sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection;
			chkSingleConn.prop('checked', singleConnFlag);
			chkSingleConn.parent()[singleConnFlag ? 'addClass' : 'removeClass']('checked');
			chkSingleConn.on('change', evt => {
				const {wsConfig} = this, subWSConfig = wsConfig['skyCafe/rest'] = wsConfig['skyCafe/rest'] || {};
				const sql = subWSConfig.sql = subWSConfig.sql || {};
				delete sql.singleConn; delete sql.sqlSingleConn; delete sql.sqlSingleConnection;
				const flag = sql.singleConn = chkSingleConn.is(':checked');
				chkSingleConn.parent()[flag ? 'addClass' : 'removeClass']('checked');
				
				const subWSConfig_skyCafePratik = wsConfig['skyCafe/pratik'] = wsConfig['skyCafe/pratik'] || {};
				subWSConfig_skyCafePratik.sql = subWSConfig.sql;
				
				this.rootConfigKaydet(e);
			});
			
			const btnSql_vtSec = tabPage.find(`#sql_parent #sql_vtSec`);
			btnSql_vtSec
				.jqxButton({ theme: theme })
				.on('click', evt =>
					this.skyCafe_sql_vtSecIstendi({ event: evt, id: evt.currentTarget.id }));
		}
		async initTabContent_pdks(e) {
			const {tabPage} = e;
			const {wsConfig} = this;
			const key = 'pdks';
			const subWSConfig = wsConfig[key] || {};
			const sql = subWSConfig.sql || {};

			const chkSingleConn = tabPage.find(`#sql_parent #chkSingleConn_parent #${key}_chkSingleConn`);
			chkSingleConn.on('change', evt => {
				const {wsConfig} = this;
				const subWSConfig = wsConfig[key] = wsConfig[key] || {};
				const sql = subWSConfig.sql = subWSConfig.sql || {};
				delete sql.singleConn;
				delete sql.sqlSingleConn;
				delete sql.sqlSingleConnection;
				const flag = sql.singleConn = chkSingleConn.is(':checked');
				chkSingleConn.parent()[flag ? 'addClass' : 'removeClass']('checked');
				this.rootConfigKaydet(e);
			});
			const singleConnFlag = sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection;
			chkSingleConn.prop('checked', singleConnFlag);
			chkSingleConn.parent()[singleConnFlag ? 'addClass' : 'removeClass']('checked');
			
			const btnSql_vtSec = tabPage.find(`#sql_parent #sql_vtSec`);
			btnSql_vtSec
				.jqxButton({ theme: theme })
				.on('click', evt =>
					this.pdks_sql_vtSecIstendi({ event: evt, id: evt.currentTarget.id }));

			const subConfigParent = tabPage.find(`#${key}SubConfig_parent`);
			const txtODBCName = subConfigParent.find('#pdksODBCName');
			txtODBCName.val(subWSConfig.odbcName);
			txtODBCName.on('change', evt => {
				const {value} = evt.target, {wsConfig} = this;
				const subWSConfig = wsConfig[key] = wsConfig[key] || {};
				subWSConfig.odbcName = (value || '').trimEnd();
				this.rootConfigKaydet(e)
			});
			const txtCihazKod = subConfigParent.find(`#pdksCihazKod`);
			txtCihazKod.val(subWSConfig.cihazKod);
			txtCihazKod.on('change', evt => {
				const {value} = evt.target;
				const {wsConfig} = this;
				const subWSConfig = wsConfig[key] = wsConfig[key] || {};
				subWSConfig.cihazKod = (value || '').trimEnd();
				this.rootConfigKaydet(e);
			});
			const txtPdksWSIP = subConfigParent.find(`#pdksWSIP`);
			txtPdksWSIP.val(subWSConfig.wsIP);
			txtPdksWSIP.on('change', evt => {
				const {value} = evt.target;
				const {wsConfig} = this;
				const subWSConfig = wsConfig[key] = wsConfig[key] || {};
				subWSConfig.wsIP = (value || '').trim();
				this.rootConfigKaydet(e);
			});
			const txtPdksUser = subConfigParent.find(`#pdksUser`);
			txtPdksUser.val(subWSConfig.user);
			txtPdksUser.on('change', evt => {
				const {value} = evt.target;
				const {wsConfig} = this;
				const subWSConfig = wsConfig[key] = wsConfig[key] || {};
				subWSConfig.user = (value || '').trim();
				this.rootConfigKaydet(e);
			});
			const txtPdksPass = subConfigParent.find(`#pdksPass`);
			txtPdksPass.val(subWSConfig.pass);
			txtPdksPass.on('change', evt => {
				const {value} = evt.target;
				const {wsConfig} = this;
				const subWSConfig = wsConfig[key] = wsConfig[key] || {};
				subWSConfig.pass = (value || '').trim();
				this.rootConfigKaydet(e);
			});
			const txtPdksMaxWait = subConfigParent.find(`#pdksMaxWait`);
			txtPdksMaxWait.val(subWSConfig.maxWait);
			txtPdksMaxWait.on('change', evt => {
				const {value} = evt.target;
				const {wsConfig} = this;
				const subWSConfig = wsConfig[key] = wsConfig[key] || {};
				evt.target.value = subWSConfig.maxWait = asFloat(value || 0);
				this.rootConfigKaydet(e);
			});
		}
		async initTabContent_eMail(e) {
			const {tabPage} = e;
			const {wsConfig} = this;
			const key = 'eMail';
			const subWSConfig = wsConfig[key] || {};
			const sql = subWSConfig.sql || {};

			const chkSingleConn = tabPage.find(`#sql_parent #chkSingleConn_parent #${key}_chkSingleConn`);
			chkSingleConn.on('change', evt => {
				const {wsConfig} = this;
				const subWSConfig = wsConfig[key] = wsConfig[key] || {};
				const sql = subWSConfig.sql = subWSConfig.sql || {};
				delete sql.singleConn;
				delete sql.sqlSingleConn;
				delete sql.sqlSingleConnection;
				const flag = sql.singleConn = chkSingleConn.is(':checked');
				chkSingleConn.parent()[flag ? 'addClass' : 'removeClass']('checked');
				this.rootConfigKaydet(e);
			});
			const singleConnFlag = sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection;
			chkSingleConn.prop('checked', singleConnFlag);
			chkSingleConn.parent()[singleConnFlag ? 'addClass' : 'removeClass']('checked');
			
			const btnSql_vtSec = tabPage.find(`#sql_parent #sql_vtSec`);
			btnSql_vtSec
				.jqxButton({ theme: theme })
				.on('click', evt =>
					this.eMail_sql_vtSecIstendi({ event: evt, id: evt.currentTarget.id }));

			const subConfigParent = tabPage.find(`#${key}SubConfig_parent`);
			const txtServerURL = subConfigParent.find(`#eMailServerURL`);
			txtServerURL.val(subWSConfig.serverURL);
			txtServerURL.on('change', evt => {
				const {value} = evt.target;
				const {wsConfig} = this;
				const subWSConfig = wsConfig[key] = wsConfig[key] || {};
				subWSConfig.serverURL = (value || '').trimEnd();
				this.rootConfigKaydet(e)
			})
		}
		async initTabContent_eMailQueue(e) {
			const {tabPage} = e;
			const {wsConfig} = this;
			const key = 'eMailQueue';
			const subWSConfig = wsConfig[key] || {};
			const sql = subWSConfig.sql || {};

			const chkSingleConn = tabPage.find(`#sql_parent #chkSingleConn_parent #${key}_chkSingleConn`);
			chkSingleConn.on('change', evt => {
				const {wsConfig} = this;
				const subWSConfig = wsConfig[key] = wsConfig[key] || {};
				const sql = subWSConfig.sql = subWSConfig.sql || {};
				delete sql.singleConn;
				delete sql.sqlSingleConn;
				delete sql.sqlSingleConnection;
				const flag = sql.singleConn = chkSingleConn.is(':checked');
				chkSingleConn.parent()[flag ? 'addClass' : 'removeClass']('checked');
				this.rootConfigKaydet(e);
			});
			const singleConnFlag = sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection;
			chkSingleConn.prop('checked', singleConnFlag);
			chkSingleConn.parent()[singleConnFlag ? 'addClass' : 'removeClass']('checked');
			
			const btnSql_vtSec = tabPage.find(`#sql_parent #sql_vtSec`);
			btnSql_vtSec
				.jqxButton({ theme: theme })
				.on('click', evt =>
					this.eMailQueue_sql_vtSecIstendi({ event: evt, id: evt.currentTarget.id }));

			const subConfigParent = tabPage.find(`#${key}SubConfig_parent`);
			const txtServerURL = subConfigParent.find(`#eMailQueueServerURL`);
			txtServerURL.val(subWSConfig.serverURL);
			txtServerURL.on('change', evt => {
				const {value} = evt.target;
				const {wsConfig} = this;
				const subWSConfig = wsConfig[key] = wsConfig[key] || {};
				subWSConfig.serverURL = (value || '').trimEnd();
				this.rootConfigKaydet(e)
			})
		}
		async initTabContent_elterm(e) {
			const {tabPage} = e;
			const {wsConfig} = this;
			const key = 'elterm';
			const subWSConfig = wsConfig[key] || {};
			const sql = subWSConfig.sql || {};

			const chkSingleConn = tabPage.find(`#sql_parent #chkSingleConn_parent #${key}_chkSingleConn`);
			chkSingleConn.on('change', evt => {
				const {wsConfig} = this;
				const subWSConfig = wsConfig[key] = wsConfig[key] || {};
				const sql = subWSConfig.sql = subWSConfig.sql || {};
				delete sql.singleConn;
				delete sql.sqlSingleConn;
				delete sql.sqlSingleConnection;
				const flag = sql.singleConn = chkSingleConn.is(':checked');
				chkSingleConn.parent()[flag ? 'addClass' : 'removeClass']('checked');
				this.rootConfigKaydet(e);
			});
			const singleConnFlag = sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection;
			chkSingleConn.prop('checked', singleConnFlag);
			chkSingleConn.parent()[singleConnFlag ? 'addClass' : 'removeClass']('checked');
			
			const btnSql_vtSec = tabPage.find(`#sql_parent #sql_vtSec`);
			btnSql_vtSec
				.jqxButton({ theme: theme })
				.on('click', evt =>
					this.elterm_sql_vtSecIstendi({ event: evt, id: evt.currentTarget.id }));

			const subConfigParent = tabPage.find(`#${key}_subConfig_parent`);
		}
		async initTabContent_skyBulutYedekleme(e) {
			const {tabPage} = e;
			const {wsConfig} = this;
			const key = 'skyBulutYedekleme';
			const subWSConfig = wsConfig[key] || {};
			const sql = subWSConfig.sql || {};

			const chkSingleConn = tabPage.find(`#sql_parent #chkSingleConn_parent #${key}_chkSingleConn`);
			chkSingleConn.on('change', evt => {
				const {wsConfig} = this;
				const subWSConfig = wsConfig[key] = wsConfig[key] || {};
				const sql = subWSConfig.sql = subWSConfig.sql || {};
				delete sql.singleConn;
				delete sql.sqlSingleConn;
				delete sql.sqlSingleConnection;
				const flag = sql.singleConn = chkSingleConn.is(':checked');
				chkSingleConn.parent()[flag ? 'addClass' : 'removeClass']('checked');
				this.rootConfigKaydet(e);
			});
			const singleConnFlag = sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection;
			chkSingleConn.prop('checked', singleConnFlag);
			chkSingleConn.parent()[singleConnFlag ? 'addClass' : 'removeClass']('checked');
			
			const btnSql_vtSec = tabPage.find(`#sql_parent #sql_vtSec`);
			btnSql_vtSec
				.jqxButton({ theme: theme })
				.on('click', evt =>
					this.skyBulutYedekleme_sql_vtSecIstendi({ event: evt, id: evt.currentTarget.id }));

			const divNavWidget = tabPage.find('.navWidget');
			divNavWidget.jqxNavigationBar({
				theme: theme, animationType: animationType, expandMode: 'multiple',
				width: false, toggleMode: 'click', showArrow: false,
				expandAnimationDuration: 50, collapseAnimationDuration: 50,
				expandedIndexes: [0]
			});
			/*const navBarArrowClickHandler = evt => {
				const widget = divNavWidget.jqxNavigationBar('getInstance');
				const index = 0;
				if (widget.expandedIndexes.includes(index))
					widget.collapseAt(index);
				else
					widget.expandAt(index);
				
				const timeouts = [50, 100];
				for (const i in timeouts) {
					setTimeout(() =>
						this.onResize(e),
						timeouts[i]);
				}
			};
			divNavWidget.find('.header')
				.off('click, touchend, mouseup')
				.on('click, touchend, mouseup', evt =>
					navBarArrowClickHandler(evt));
			divNavWidget.find(`.jqx-expander-header-content`)
				.off('click, mouseup, touchend')
				.on('click, mouseup, touchend', evt => {
					const {target} = evt;
					const tagName = target.tagName.toUpperCase();
					if (!(tagName == 'INPUT' || tagName == 'TEXTAREA' || tagName == 'BUTTON' || target.classList.contains(`jqx-input-icon`)))
						navBarArrowClickHandler(evt);
				});*/
			
			const subConfigParent = tabPage.find(`#${key}_subConfig_parent`);
			const txtUserID = subConfigParent.find(`#${key}_userID`);
			txtUserID.val(subWSConfig.userID);
			txtUserID.on('change', evt => {
				const {value} = evt.target;
				const {wsConfig} = this;
				const subWSConfig = wsConfig[key] = wsConfig[key] || {};
				subWSConfig.userID = (value || '').trim();
				this.rootConfigKaydet(e);
			});
			const txtUserPass = subConfigParent.find(`#${key}_userPass`);
			txtUserPass.val(subWSConfig.userPass);
			txtUserPass.on('change', evt => {
				const value = (evt.target.value || '').trimEnd();
				const {wsConfig} = this;
				const subWSConfig = wsConfig[key] = wsConfig[key] || {};
				subWSConfig.userPass = value ? (value.length == 32 ? value : md5(value)) : null;
				this.rootConfigKaydet(e);
			});
			const txtBackupServer = subConfigParent.find(`#${key}_backupServer`);
			txtBackupServer.val(subWSConfig.backupServer);
			txtBackupServer.on('change', evt => {
				const {value} = evt.target;
				const {wsConfig} = this;
				const subWSConfig = wsConfig[key] = wsConfig[key] || {};
				subWSConfig.backupServer = (value || '').trim();
				this.rootConfigKaydet(e);
			});
			const txtBackupPass = subConfigParent.find(`#${key}_backupPass`);
			txtBackupPass.val(subWSConfig.backupPass);
			txtBackupPass.on('change', evt => {
				let {value} = evt.target;
				const {wsConfig} = this;
				const subWSConfig = wsConfig[key] = wsConfig[key] || {};
				value = (value || '').trim();
				// if (value && value.length != 32)
				// value = md5(value);
				subWSConfig.backupPass = value;
				this.rootConfigKaydet(e);
			});
			const txtSQLBackupDir = subConfigParent.find(`#${key}_sqlBackupDir`);
			txtSQLBackupDir.val(subWSConfig.sqlBackupDir);
			txtSQLBackupDir.on('change', evt => {
				const {value} = evt.target;
				const {wsConfig} = this;
				const subWSConfig = wsConfig[key] = wsConfig[key] || {};
				subWSConfig.sqlBackupDir = (value || '').trim();
				this.rootConfigKaydet(e);
			});
			const txtServerStorageDir = subConfigParent.find(`#${key}_serverStorageDir`);
			txtServerStorageDir.val(subWSConfig.serverStorageDir);
			txtServerStorageDir.on('change', evt => {
				const {value} = evt.target;
				const {wsConfig} = this;
				const subWSConfig = wsConfig[key] = wsConfig[key] || {};
				subWSConfig.serverStorageDir = (value || '').trim();
				this.rootConfigKaydet(e);
			});
			const txtFilePatterns = subConfigParent.find(`#${key}_filePatterns`);
			txtFilePatterns.val(subWSConfig.filePatterns ? subWSConfig.filePatterns.join(CrLf) : '');
			txtFilePatterns.on('change', evt => {
				const value = evt.target.value || '';
				const {wsConfig} = this;
				const subWSConfig = wsConfig[key] = wsConfig[key] || {};
				value = value ? value.split('\n').map(x => x.trim()).filter(x => !!x) : [];
				this.rootConfigKaydet(e);
			});

			const skyBulutYedekleme_btnUsers = tabPage.find(`#${key}_btnUsers`);
			skyBulutYedekleme_btnUsers.jqxButton({ theme: theme });
			skyBulutYedekleme_btnUsers.on('click', evt => {
				const {wsConfig} = this;
				const subWSConfig = wsConfig[key] = wsConfig[key] || {};
				new SkyConfigSkyBulutYedeklemeUserListPart({
					parentPart: this.parentPart,
					geriCallback: e =>
						this.tazele()
				}).open()
			});
			const skyBulutYedekleme_btnVeriYonetimi = tabPage.find(`#${key}_btnVeriYonetimi`);
			skyBulutYedekleme_btnVeriYonetimi.jqxButton({ theme: theme });
			skyBulutYedekleme_btnVeriYonetimi.on('click', evt => {
				const {wsConfig} = this;
				const subWSConfig = wsConfig[key] = wsConfig[key] || {};
				new SkyConfigSkyBulutYedeklemeVeriYonetimiPart({
					parentPart: this.parentPart,
					geriCallback: e =>
						this.tazele()
				}).open()
			});
		}
		async initTabContent_eIslemGonder(e) {
			const {tabPage} = e;
			const {wsConfig} = this;
			const subWSConfig = wsConfig.eIslemGonder || {};
			const sql = subWSConfig.sql || {};

			const chkSingleConn = tabPage.find(`#sql_parent #chkSingleConn_parent #eIslemGonder_chkSingleConn`);
			chkSingleConn.on('change', evt => {
				const {wsConfig} = this;
				const subWSConfig = wsConfig.eIslemGonder = wsConfig.eIslemGonder || {};
				const sql = subWSConfig.sql = subWSConfig.sql || {};
				delete sql.singleConn;
				delete sql.sqlSingleConn;
				delete sql.sqlSingleConnection;
				const flag = sql.singleConn = chkSingleConn.is(':checked');
				chkSingleConn.parent()[flag ? 'addClass' : 'removeClass']('checked');
				this.rootConfigKaydet(e);
			});
			const singleConnFlag = sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection;
			chkSingleConn.prop('checked', singleConnFlag);
			chkSingleConn.parent()[singleConnFlag ? 'addClass' : 'removeClass']('checked');
			
			const btnSql_vtSec = tabPage.find(`#sql_parent #sql_vtSec`);
			btnSql_vtSec
				.jqxButton({ theme: theme })
				.on('click', evt =>
					this.eIslemGonder_sql_vtSecIstendi({ event: evt, id: evt.currentTarget.id }));
		}
		async initTabContent_eIslemAkibetSorgula(e) {
			const {tabPage} = e;
			const {wsConfig} = this;
			const subWSConfig = wsConfig.eIslemAkibetSorgula || {};
			const sql = subWSConfig.sql || {};

			const chkSingleConn = tabPage.find(`#sql_parent #chkSingleConn_parent #eIslemAkibetSorgula_chkSingleConn`);
			chkSingleConn.on('change', evt => {
				const {wsConfig} = this;
				const subWSConfig = wsConfig.eIslemAkibetSorgula = wsConfig.eIslemAkibetSorgula || {};
				const sql = subWSConfig.sql = subWSConfig.sql || {};
				delete sql.singleConn;
				delete sql.sqlSingleConn;
				delete sql.sqlSingleConnection;
				const flag = sql.singleConn = chkSingleConn.is(':checked');
				chkSingleConn.parent()[flag ? 'addClass' : 'removeClass']('checked');
				this.rootConfigKaydet(e);
			});
			const singleConnFlag = sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection;
			chkSingleConn.prop('checked', singleConnFlag);
			chkSingleConn.parent()[singleConnFlag ? 'addClass' : 'removeClass']('checked');
			
			const btnSql_vtSec = tabPage.find(`#sql_parent #sql_vtSec`);
			btnSql_vtSec
				.jqxButton({ theme: theme })
				.on('click', evt =>
					this.eIslemAkibetSorgula_sql_vtSecIstendi({ event: evt, id: evt.currentTarget.id }));
		}
		async initTabContent_gelenEIslemSorgula(e) {
			const {tabPage} = e;
			const {wsConfig} = this;
			const subWSConfig = wsConfig.gelenEIslemSorgula || {};
			const sql = subWSConfig.sql || {};

			const chkSingleConn = tabPage.find(`#sql_parent #chkSingleConn_parent #gelenEIslemSorgula_chkSingleConn`);
			chkSingleConn.on('change', evt => {
				const {wsConfig} = this;
				const subWSConfig = wsConfig.gelenEIslemSorgula = wsConfig.gelenEIslemSorgula || {};
				const sql = subWSConfig.sql = subWSConfig.sql || {};
				delete sql.singleConn;
				delete sql.sqlSingleConn;
				delete sql.sqlSingleConnection;
				const flag = sql.singleConn = chkSingleConn.is(':checked');
				chkSingleConn.parent()[flag ? 'addClass' : 'removeClass']('checked');
				this.rootConfigKaydet(e);
			});
			const singleConnFlag = sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection;
			chkSingleConn.prop('checked', singleConnFlag);
			chkSingleConn.parent()[singleConnFlag ? 'addClass' : 'removeClass']('checked');
			
			const btnSql_vtSec = tabPage.find(`#sql_parent #sql_vtSec`);
			btnSql_vtSec
				.jqxButton({ theme: theme })
				.on('click', evt =>
					this.gelenEIslemSorgula_sql_vtSecIstendi({ event: evt, id: evt.currentTarget.id }));
		}
		async initTabContent_eIslemArsivle(e) {
			const {tabPage} = e;
			const {wsConfig} = this;
			const subWSConfig = wsConfig.eIslemArsivle || {};
			const sql = subWSConfig.sql || {};

			const chkSingleConn = tabPage.find(`#sql_parent #chkSingleConn_parent #eIslemArsivle_chkSingleConn`);
			const singleConnFlag = sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection;
			chkSingleConn.prop('checked', singleConnFlag);
			chkSingleConn.parent()[singleConnFlag ? 'addClass' : 'removeClass']('checked');
			chkSingleConn.on('change', evt => {
				const {wsConfig} = this;
				const subWSConfig = wsConfig.eIslemArsivle = wsConfig.eIslemArsivle || {};
				const sql = subWSConfig.sql = subWSConfig.sql || {};
				delete sql.singleConn;
				delete sql.sqlSingleConn;
				delete sql.sqlSingleConnection;
				const flag = sql.singleConn = chkSingleConn.is(':checked');
				chkSingleConn.parent()[flag ? 'addClass' : 'removeClass']('checked');
				this.rootConfigKaydet(e);
			});
			
			const btnSql_vtSec = tabPage.find(`#sql_parent #sql_vtSec`);
			btnSql_vtSec
				.jqxButton({ theme: theme })
				.on('click', evt =>
					this.eIslemArsivle_sql_vtSecIstendi({ event: evt, id: evt.currentTarget.id }));

			const srcDestDirParent = tabPage.find(`#srcDestDirParent`);
			const txtSrcDir = srcDestDirParent.find(`#srcDirParent #srcDir`);
			txtSrcDir.val(subWSConfig.src || subWSConfig.srcDir);
			txtSrcDir.on('change', evt => {
				const {value} = evt.target;
				const {wsConfig} = this;
				const subWSConfig = wsConfig.eIslemArsivle = wsConfig.eIslemArsivle || {};
				delete subWSConfig.srcDir;
				subWSConfig.src = (value || '').trim();
				this.rootConfigKaydet(e);
			});
			const txtDestDir = srcDestDirParent.find(`#destDirParent #destDir`);
			txtDestDir.val(subWSConfig.dest || subWSConfig.destDir || subWSConfig.target || subWSConfig.targetDir);
			txtDestDir.on('change', evt => {
				const {value} = evt.target;
				const {wsConfig} = this;
				const subWSConfig = wsConfig.eIslemArsivle = wsConfig.eIslemArsivle || {};
				delete subWSConfig.destDir;
				delete subWSConfig.target;
				delete subWSConfig.targetDir;
				subWSConfig.dest = (value || '').trim();
				this.rootConfigKaydet(e);
			});
		}
		async initTabContent_eMutabakat(e) {
			const {tabPage} = e;
			const {wsConfig} = this;
			const subWSConfig = wsConfig.eMutabakat || {};
			const sql = subWSConfig.sql || {};

			const chkSingleConn = tabPage.find(`#sql_parent #chkSingleConn_parent #eMutabakat_chkSingleConn`);
			const singleConnFlag = sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection;
			chkSingleConn.prop('checked', singleConnFlag);
			chkSingleConn.parent()[singleConnFlag ? 'addClass' : 'removeClass']('checked');
			chkSingleConn.on('change', evt => {
				const {wsConfig} = this;
				const subWSConfig = wsConfig.eMutabakat = wsConfig.eMutabakat || {};
				const sql = subWSConfig.sql = subWSConfig.sql || {};
				delete sql.singleConn;
				delete sql.sqlSingleConn;
				delete sql.sqlSingleConnection;
				const flag = sql.singleConn = chkSingleConn.is(':checked');
				chkSingleConn.parent()[flag ? 'addClass' : 'removeClass']('checked');
				this.rootConfigKaydet(e);
			});
			
			const btnSql_vtSec = tabPage.find(`#sql_parent #sql_vtSec`);
			btnSql_vtSec
				.jqxButton({ theme: theme })
				.on('click', evt =>
					this.eMutabakat_sql_vtSecIstendi({ event: evt, id: evt.currentTarget.id }));

			const txtAnaBolum = tabPage.find(`#anaBolumParent #anaBolum`);
			txtAnaBolum.val(subWSConfig.anaBolum || subWSConfig.rootDir);
			txtAnaBolum.on('change', evt => {
				const {value} = evt.target;
				const {wsConfig} = this;
				const subWSConfig = wsConfig.eMutabakat = wsConfig.eMutabakat || {};
				delete subWSConfig.rootDir;
				subWSConfig.anaBolum = (value || '').trim();
				this.rootConfigKaydet(e);
			});
		}
		async initTabContent_skyERP(e) {
			const {tabPage} = e;
			const {wsConfig} = this;
			const subWSConfig = wsConfig.skyERP || {};
			const sql = subWSConfig.sql || {};

			const chkSingleConn = tabPage.find(`#sql_parent #chkSingleConn_parent #skyERP_chkSingleConn`);
			const singleConnFlag = sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection;
			chkSingleConn.prop('checked', singleConnFlag);
			chkSingleConn.parent()[singleConnFlag ? 'addClass' : 'removeClass']('checked');
			chkSingleConn.on('change', evt => {
				const {wsConfig} = this;
				const subWSConfig = wsConfig.skyERP = wsConfig.skyERP || {};
				const sql = subWSConfig.sql = subWSConfig.sql || {};
				delete sql.singleConn;
				delete sql.sqlSingleConn;
				delete sql.sqlSingleConnection;
				const flag = sql.singleConn = chkSingleConn.is(':checked');
				chkSingleConn.parent()[flag ? 'addClass' : 'removeClass']('checked');
				this.rootConfigKaydet(e);
			});
			
			const btnSql_vtSec = tabPage.find(`#sql_parent #sql_vtSec`);
			btnSql_vtSec
				.jqxButton({ theme: theme })
				.on('click', evt =>
					this.skyERP_sql_vtSecIstendi({ event: evt, id: evt.currentTarget.id }));

			/*const txtAnaBolum = tabPage.find(`#anaBolumParent #anaBolum`);
			txtAnaBolum.val(subWSConfig.anaBolum || subWSConfig.rootDir);
			txtAnaBolum.on('change', evt => {
				const {value} = evt.target;
				const {wsConfig} = this;
				const subWSConfig = wsConfig.skyERP = wsConfig.skyERP || {};
				delete subWSConfig.rootDir;
				subWSConfig.anaBolum = (value || '').trim();
				this.rootConfigKaydet(e);
			});*/
		}
		async initTabContent_skyTablet(e) {
			const {tabPage} = e;
			const {wsConfig} = this;
			const subWSConfig = wsConfig.skyTablet || {};
			const sql = subWSConfig.sql || {};

			const chkSingleConn = tabPage.find(`#sql_parent #chkSingleConn_parent #skyTablet_chkSingleConn`);
			const singleConnFlag = sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection;
			chkSingleConn.prop('checked', singleConnFlag);
			chkSingleConn.parent()[singleConnFlag ? 'addClass' : 'removeClass']('checked');
			chkSingleConn.on('change', evt => {
				const {wsConfig} = this;
				const subWSConfig = wsConfig.skyTablet = wsConfig.skyTablet || {};
				const sql = subWSConfig.sql = subWSConfig.sql || {};
				delete sql.singleConn;
				delete sql.sqlSingleConn;
				delete sql.sqlSingleConnection;
				const flag = sql.singleConn = chkSingleConn.is(':checked');
				chkSingleConn.parent()[flag ? 'addClass' : 'removeClass']('checked');
				this.rootConfigKaydet(e);
			});
			
			const btnSql_vtSec = tabPage.find(`#sql_parent #sql_vtSec`);
			btnSql_vtSec
				.jqxButton({ theme: theme })
				.on('click', evt =>
					this.skyTablet_sql_vtSecIstendi({ event: evt, id: evt.currentTarget.id }));

			/*const txtAnaBolum = tabPage.find(`#anaBolumParent #anaBolum`);
			txtAnaBolum.val(subWSConfig.anaBolum || subWSConfig.rootDir);
			txtAnaBolum.on('change', evt => {
				const {value} = evt.target;
				const {wsConfig} = this;
				const subWSConfig = wsConfig.skyTablet = wsConfig.skyTablet || {};
				delete subWSConfig.rootDir;
				subWSConfig.anaBolum = (value || '').trim();
				this.rootConfigKaydet(e);
			});*/
		}
		async initTabContent_sgk(e) {
			const {tabPage} = e;
			const {wsConfig} = this;
			const subWSConfig = wsConfig.sgk || {};
			const sql = subWSConfig.sql || {};
			const singleConnFlag = sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection;

			const chkSingleConn = tabPage.find(`#sql_parent #chkSingleConn_parent input[type=checkbox]`);
			chkSingleConn.prop('checked', singleConnFlag);
			chkSingleConn.parent()[singleConnFlag ? 'addClass' : 'removeClass']('checked');
			chkSingleConn.on('change', evt => {
				const {wsConfig} = this;
				const subWSConfig = wsConfig.sgk = wsConfig.sgk || {};
				const sql = subWSConfig.sql = subWSConfig.sql || {};
				delete sql.singleConn;
				delete sql.sqlSingleConn;
				delete sql.sqlSingleConnection;
				const flag = sql.singleConn = chkSingleConn.is(':checked');
				chkSingleConn.parent()[flag ? 'addClass' : 'removeClass']('checked');
				this.rootConfigKaydet(e);
			});
			
			const btnEkSql_vtSec = tabPage.find(`#ekSql_parent #ekSql_vtSec`);
			btnEkSql_vtSec
				.jqxButton({ theme: theme })
				.on('click', evt =>
					this.sgk_ekSql_vtSecIstendi({ event: evt, id: evt.currentTarget.id }));
		}

		async tazele(e) {
			const {app} = this, promise_wsReadVioConfig = app.wsReadVioConfig(), promise_wsConfigOku = app.wsConfigOku();
			await super.tazele();
			promise_wsReadVioConfig
				.then(result => this.wsReadVioConfig_onResponse($.extend({}, e, { isError: result.isError || false, result })))
				.catch(result => this.wsReadVioConfig_onResponse($.extend({}, e, { isError: true, result })));
			promise_wsConfigOku
				.then(result => this.wsConfigOku_onResponse($.extend({}, e, { isError: result.isError || false, result })))
				.catch(result => this.wsConfigOku_onResponse($.extend({}, e, { isError: true, result })))
		}
		async vioConfigKaydet(e) {
			const {app, _vioConfig} = this;
			if (_vioConfig) {
				try { return await app.wsWriteVioConfig({ config: _vioConfig }) }
				catch (ex) { defFailBlock(ex) }
			}
			return null
		}
		async rootConfigKaydet(e) {
			const {app, _rootConfig} = this;
			if (_rootConfig) {
				try { return await app.wsConfigYaz({ rootConfig: _rootConfig }) }
				catch (ex) { defFailBlock(ex) }
			}
			return null
		}
		wsReadVioConfig_onResponse(e) {
			const {isError, result} = e;
			if (isError) {
				const error = (result || {}).responseJSON || result;
				if ((error.rc || error.code) != 'accessDenied')
					defFailBlock(result)
				return
			}
			const {panel} = this, vioConfig = this.vioConfig = result, sql = vioConfig.sql || {};
			const tabPage_vio = panel.find(`#vio.jqx-tabs-content-element`);
			const tanitimParent = tabPage_vio.find(`#tanitim_parent`), txtTanitim = tanitimParent.find(`#tanitim`);
			txtTanitim.val(vioConfig.tanitim || ''); tanitimParent[vioConfig.tanitim ? 'removeClass' : 'addClass']('empty');
			tabPage_vio.find(`#chkTerminal_parent #chkTerminal`).prop('checked', !!vioConfig.terminalmi);
			tabPage_vio.find(`#chkCokluYedekleme_parent #chkCokluYedekleme`).prop('checked', !!vioConfig.cokluYedekleme);
			tabPage_vio.find(`#sqlAnaSistem_parent #sqlAnaSistem`).val(sql.server || '');
			tabPage_vio.find(`#sqlLogin_parent #sqlUser`).val(sql.user || '');
			tabPage_vio.find(`#sqlLogin_parent #sqlPass`).val(sql.pass || '');
			tabPage_vio.find(`#guncellemeSunucusu_parent #guncellemeSunucusu`).val(vioConfig.remoteServer || '');
			tabPage_vio.find(`#chkEIslemLog_parent #chkEIslemLog`).prop('checked', !!vioConfig.eIslemLog)
		}
		wsConfigOku_onResponse(e) {
			const {isError, result} = e;
			if (isError) {
				const error = (result || {}).responseJSON || result;
				if ((error.rc || error.code) != 'accessDenied')
					defFailBlock(result)
				return
			}
			const rootConfig = this.rootConfig = result.rootConfig, wsConfig = this.wsConfig = rootConfig.wsConfig = rootConfig.wsConfig || {};
			const {panel} = this; let tabPage = panel.find(`#ws.jqx-tabs-content-element`), sql = rootConfig.sql || {};
			tabPage.find(`#sql_parent #chkSingleConn_parent input[type=checkbox]`).val(sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection);
			tabPage.find(`#serviceControlCheckDelay_parent #serviceControlCheckDelay`).val(rootConfig.serviceControlCheckDelay || '');
			tabPage.find(`#remoteCommandServer_parent #remoteCommandServer`).val(rootConfig.remoteCommandServer || '');
			tabPage.find(`#serverIP_parent #serverIP`).val(rootConfig.serverIP ? rootConfig.serverIP.join('\n') : '');
			const cvmPanicFlag = rootConfig.cvmPanic == null ? true : rootConfig.cvmPanic;
			tabPage.find(`#cvmPanicFlag_parent #cvmPanicFlag`).prop('checked', cvmPanicFlag);
			tabPage.find(`#cvmPanicFlag_parent`)[cvmPanicFlag ? 'addClass' : 'removeClass']('checked');
			const cvmPanic_vioSonlandirFlag = rootConfig.cvmPanic_vioSonlandir;
			tabPage.find(`#cvmPanicVIOFlag_parent #cvmPanicVIOFlag`).prop('checked', cvmPanic_vioSonlandirFlag);
			tabPage.find(`#cvmPanicVIOFlag_parent`)[cvmPanic_vioSonlandirFlag ? 'addClass' : 'removeClass']('checked');
			
			tabPage = panel.find(`#genel.jqx-tabs-content-element`); sql = (wsConfig.genel || {}).sql || {};
			tabPage.find(`#sql_parent #chkSingleConn_parent input[type=checkbox]`).val(sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection);
			tabPage.find(`#resimAnaBolum`).val(wsConfig.genel?.config?.resimAnaBolum || '');
			tabPage = panel.find(`#cariEFatSorgu.jqx-tabs-content-element`); sql = (wsConfig.cariEFatSorgu || {}).sql || {};
			tabPage.find(`#sql_parent #chkSingleConn_parent input[type=checkbox]`).val(sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection);
			tabPage = panel.find(`#skyMES.jqx-tabs-content-element`); sql = (wsConfig['skyMES/hatIzleme'] || {}).sql || {};
			tabPage.find(`#sql_parent #chkSingleConn_parent input[type=checkbox]`).val(sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection);
			tabPage = panel.find(`#pdks.jqx-tabs-content-element`); sql = (wsConfig.pdks || {}).sql || {};
			tabPage.find(`#sql_parent #chkSingleConn_parent input[type=checkbox]`).val(sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection);
			tabPage = panel.find(`#eMail.jqx-tabs-content-element`); sql = (wsConfig.eMail || {}).sql || {};
			tabPage.find(`#sql_parent #chkSingleConn_parent input[type=checkbox]`).val(sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection);
			tabPage = panel.find(`#eMailQueue.jqx-tabs-content-element`); sql = (wsConfig.eMailQueue || {}).sql || {};
			tabPage.find(`#sql_parent #chkSingleConn_parent input[type=checkbox]`).val(sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection);
			tabPage = panel.find(`#eIslemGonder.jqx-tabs-content-element`); sql = (wsConfig.eIslemGonder || {}).sql || {};
			tabPage.find(`#sql_parent #chkSingleConn_parent input[type=checkbox]`).val(sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection);
			tabPage = panel.find(`#eIslemAkibetSorgula.jqx-tabs-content-element`); sql = (wsConfig.eIslemAkibetSorgula || {}).sql || {};
			tabPage.find(`#sql_parent #chkSingleConn_parent input[type=checkbox]`).val(sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection);
			tabPage = panel.find(`#gelenEIslemSorgula.jqx-tabs-content-element`); sql = (wsConfig.gelenEIslemSorgula || {}).sql || {};
			tabPage.find(`#sql_parent #chkSingleConn_parent input[type=checkbox]`).val(sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection);
			tabPage = panel.find(`#eMutabakat.jqx-tabs-content-element`); sql = (wsConfig.eMutabakat || {}).sql || {};
			tabPage.find(`#sql_parent #chkSingleConn_parent input[type=checkbox]`).val(sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection);
			tabPage = panel.find(`#skyERP.jqx-tabs-content-element`); sql = (wsConfig.skyERP || {}).sql || {};
			tabPage.find(`#sql_parent #chkSingleConn_parent input[type=checkbox]`).val(sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection);
			tabPage = panel.find(`#skyTablet.jqx-tabs-content-element`); sql = (wsConfig.skyTablet || {}).sql || {};
			tabPage.find(`#sql_parent #chkSingleConn_parent input[type=checkbox]`).val(sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection);
			tabPage = panel.find(`#eIslemArsivle.jqx-tabs-content-element`); sql = (wsConfig.eIslemArsivle || {}).sql || {};
			tabPage.find(`#sql_parent #chkSingleConn_parent input[type=checkbox]`).val(sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection);
			tabPage = panel.find(`#sgk.jqx-tabs-content-element`); sql = (wsConfig.sgk || {}).sql || {};
			tabPage.find(`#sql_parent #chkSingleConn_parent input[type=checkbox]`).val(sql.singleConn || sql.sqlSingleConn || sql.sqlSingleConnection);
			tabPage = panel.find(`#eIslemArsivle.jqx-tabs-content-element`);
			const subWSConfig_eIslemArsivle = wsConfig.eIslemArsivle || {}, srcDestDirParent = tabPage.find(`#srcDestDirParent`);
			srcDestDirParent.find(`#srcDirParent #srcDir`).val(subWSConfig_eIslemArsivle.src || subWSConfig_eIslemArsivle.srcDir);
			srcDestDirParent.find(`#destDirParent #destDir`).val(subWSConfig_eIslemArsivle.dest || subWSConfig_eIslemArsivle.destDir || subWSConfig_eIslemArsivle.target || subWSConfig_eIslemArsivle.targetDir);
			tabPage = panel.find(`#eMutabakat.jqx-tabs-content-element`); const subWSConfig_eMutabakat = wsConfig.eMutabakat || {};
			tabPage.find(`#anaBolumParent #anaBolum`).val(subWSConfig_eMutabakat.anaBolum || subWSConfig_eMutabakat.rootDir);
			/*tabPage = panel.find(`#skyERP.jqx-tabs-content-element`); const subWSConfig_skyERP = wsConfig.skyERP || {};
			tabPage.find(`#anaBolumParent #anaBolum`).val(subWSConfig_skyERP.anaBolum || subWSConfig_skyERP.rootDir);*/
			tabPage = panel.find(`#pdks.jqx-tabs-content-element`);
			const subWSConfig_pdks = wsConfig.pdks || {}, pdksSubConfigParent = tabPage.find(`#pdksSubConfig_parent`);
			pdksSubConfigParent.find(`#cihazKod`).val(subWSConfig_pdks.cihazKod);
			pdksSubConfigParent.find(`#pdksWSIP`).val(subWSConfig_pdks.wsIP);
			pdksSubConfigParent.find(`#pdksUser`).val(subWSConfig_pdks.user);
			pdksSubConfigParent.find(`#pdksPass`).val(subWSConfig_pdks.pass);
			pdksSubConfigParent.find(`#pdksMaxWait`).val(subWSConfig_pdks.maxWait);
			tabPage = panel.find(`#eMail.jqx-tabs-content-element`);
			const subWSConfig_eMail = wsConfig.eMail || {}, eMailSubConfigParent = tabPage.find(`#eMailSubConfig_parent`);
			eMailSubConfigParent.find(`#eMailServerURL`).val(subWSConfig_eMail.serverURL);
			tabPage = panel.find(`#eMailQueue.jqx-tabs-content-element`);
			const subWSConfig_eMailQueue = wsConfig.eMailQueue || {}, eMailQueueSubConfigParent = tabPage.find(`#eMailQueueSubConfig_parent`);
			eMailQueueSubConfigParent.find(`#eMailQueueServerURL`).val(subWSConfig_eMailQueue.serverURL);
			tabPage = panel.find(`#skyBulutYedekleme.jqx-tabs-content-element`);
			const subWSConfig_skyBulutYedekleme = wsConfig.skyBulutYedekleme || {}, skyBulutYedekleme_subConfigParent = tabPage.find(`#skyBulutYedekleme_subConfig_parent`);
			skyBulutYedekleme_subConfigParent.find(`#skyBulutYedekleme_userID`).val(subWSConfig_skyBulutYedekleme.userID);
			skyBulutYedekleme_subConfigParent.find(`#skyBulutYedekleme_userPass`).val(subWSConfig_skyBulutYedekleme.userPass);
			skyBulutYedekleme_subConfigParent.find(`#skyBulutYedekleme_backupServer`).val(subWSConfig_skyBulutYedekleme.backupServer);
			skyBulutYedekleme_subConfigParent.find(`#skyBulutYedekleme_backupPass`).val(subWSConfig_skyBulutYedekleme.backupPass);
			skyBulutYedekleme_subConfigParent.find(`#skyBulutYedekleme_sqlBackupDir`).val(subWSConfig_skyBulutYedekleme.sqlBackupDir);
			skyBulutYedekleme_subConfigParent.find(`#skyBulutYedekleme_serverStorageDir`).val(subWSConfig_skyBulutYedekleme.serverStorageDir);
			skyBulutYedekleme_subConfigParent.find(`#skyBulutYedekleme_filePatterns`).val(subWSConfig_skyBulutYedekleme.filePatterns ? subWSConfig_skyBulutYedekleme.filePatterns.join(CrLf) : '');

			this.ws_sql_vtDegisti(e);
			this.genel_sql_vtDegisti(e);
			this.cariEFatSorgu_ekSql_vtDegisti(e);
			this.skyMES_sql_vtDegisti(e);
			this.skyCafe_sql_vtDegisti(e);
			this.eIslemGonder_sql_vtDegisti(e);
			this.eIslemAkibetSorgula_sql_vtDegisti(e);
			this.gelenEIslemSorgula_sql_vtDegisti(e);
			this.pdks_sql_vtDegisti(e);
			this.eMail_sql_vtDegisti(e);
			this.eMailQueue_sql_vtDegisti(e);
			this.elterm_sql_vtDegisti(e);
			this.skyBulutYedekleme_sql_vtDegisti(e);
			this.eIslemArsivle_sql_vtDegisti(e);
			this.eMutabakat_sql_vtDegisti(e);
			this.skyERP_sql_vtDegisti(e);
			this.skyTablet_sql_vtDegisti(e);
			this.sgk_ekSql_vtDegisti(e)
		}
		async ws_sql_vtSecIstendi(e) {
			const {currentTarget} = event || {};
			if (currentTarget) currentTarget.blur()
			const {rootConfig} = this; let {sql} = rootConfig;
			await new SkyConfigVTSecPart({
				tekil: true, vt: (sql || {}).db,
				connStr: (sql || {}).connStr || (sql || {}).connectionString, server: (sql || {}).server,
				tamamIslemi: _e => {
					sql = rootConfig.sql = rootConfig.sql || {};
					delete sql.ekSQL; delete sql.ekSql;
					const {server} = _e, vt = _e.db;
					if (vt)
						$.extend(sql, { server: server, db: vt })
					else
						sql = rootConfig.sql = null
					this.ws_sql_vtDegisti($.extend({}, e, _e)); this.rootConfigKaydet(e)
				}
			}).open()
		}
		ws_sql_vtDegisti(e) {
			const {rootConfig, panel} = this, sql = rootConfig.sql || {};
			const txtOutput = panel.find(`#ws.jqx-tabs-content-element #sql`);
			if (!sql.server && $.isEmptyObject(sql.db))
				txtOutput.val('')
			else
				txtOutput.val(`${sql.server || ''} - ${sql.db || ''}`)
		}
		async genel_sql_vtSecIstendi(e) {
			const {currentTarget} = event || {};
			if (currentTarget)
				currentTarget.blur()
			const {wsConfig} = this, subWSConfig = wsConfig.genel = wsConfig.genel || {}; let {sql} = subWSConfig;
			await new SkyConfigVTSecPart({
				tekil: true, vt: (sql || {}).db,
				connStr: (sql || {}).connStr || (sql || {}).connectionString, server: (sql || {}).server,
				tamamIslemi: _e => {
					sql = subWSConfig.sql = subWSConfig.sql || {};
					delete sql.ekSQL; delete sql.ekSql;
					const {server} = _e, vt = _e.db;
					if (vt)
						$.extend(sql, { server: server, db: vt })
					else
						sql = subWSConfig.sql = null
					this.genel_sql_vtDegisti($.extend({}, e, _e));
					this.rootConfigKaydet(e)
				}
			}).open()
		}
		genel_sql_vtDegisti(e) {
			const {wsConfig, panel} = this; const subWSConfig = wsConfig.genel || {}, sql = subWSConfig.sql || {};
			const txtOutput = panel.find(`#genel.jqx-tabs-content-element #sql`);
			if (!sql.server && $.isEmptyObject(sql.db))
				txtOutput.val('')
			else
				txtOutput.val(`${sql.server || ''} - ${sql.db || ''}`)
		}
		async cariEFatSorgu_ekSql_vtSecIstendi(e) {
			const {currentTarget} = event || {};
			if (currentTarget)
				currentTarget.blur()
			const {wsConfig} = this, subWSConfig = wsConfig.cariEFatSorgu = wsConfig.cariEFatSorgu || {}, sql = subWSConfig.sql = subWSConfig.sql || {};
			sql.db = sql.db || 'ORTAK';
			let ekSql = sql.ekSql || sql.ekSQL;
			const server = $.isEmptyObject(ekSql) ? sql.server : ekSql[0].server, vtListe = $.isEmptyObject(ekSql) ? null : ekSql.map(item => item.db);
			await new SkyConfigVTSecPart({
				tekil: false, server: server, vtListe: vtListe,
				tamamIslemi: _e => {
					delete sql.ekSQL;
					const {server} = _e, vtListe = _e.dbListe; sql.server = server || undefined;
					if ($.isEmptyObject(vtListe))
						ekSql = sql.ekSql = null
					else
						ekSql = sql.ekSql = vtListe.map(vt => { return { server: server || undefined, db: vt } })
					this.cariEFatSorgu_ekSql_vtDegisti($.extend({}, e, _e));
					this.rootConfigKaydet(e)
				}
			}).open()
		}
		cariEFatSorgu_ekSql_vtDegisti(e) {
			const {wsConfig, panel} = this, subWSConfig = wsConfig.cariEFatSorgu || {};
			const sql = subWSConfig.sql || {}, ekSql = sql.ekSql || sql.ekSQL || {};
			const txtOutput = panel.find(`#cariEFatSorgu.jqx-tabs-content-element #ekSql`);
			if ($.isEmptyObject(ekSql))
				txtOutput.val(sql.server ? `${sql.server} - ` : '');
			else {
				const server = ekSql[0].server;
				txtOutput.val(`${server || ''} - ${ekSql.map(item => item.db).join(', ')}`);
			}
		}
		async skyMES_sql_vtSecIstendi(e) {
			const {currentTarget} = event || {};
			if (currentTarget)
				currentTarget.blur();

			const {wsConfig} = this;
			const subWSConfig = wsConfig['skyMES/hatIzleme'] = wsConfig['skyMES/hatIzleme'] || {};
			let {sql} = subWSConfig;
			
			await new SkyConfigVTSecPart({
				tekil: true,
				connStr: (sql || {}).connStr || (sql || {}).connectionString,
				server: (sql || {}).server,
				vt: (sql || {}).db,
				tamamIslemi: _e => {
					sql = subWSConfig.sql = subWSConfig.sql || {};
					delete sql.ekSQL;
					delete sql.ekSql;
					
					const {server} = _e;
					const vt = _e.db;
					if (vt) {
						$.extend(sql, {
							server: server,
							db: vt
						});
					}
					else {
						sql = subWSConfig.sql = null;
					}
					
					const subWSConfig_skyMakineDurum = wsConfig['skyMES/makineDurum'] = wsConfig['skyMES/makineDurum'] || {};
					subWSConfig_skyMakineDurum.sql = subWSConfig.sql;
					this.skyMES_sql_vtDegisti($.extend({}, e, _e));
					this.rootConfigKaydet(e);
				}
			}).open()
		}
		skyMES_sql_vtDegisti(e) {
			const {wsConfig, panel} = this;
			const subWSConfig = wsConfig['skyMES/hatIzleme'] = wsConfig['skyMES/hatIzleme'] || {};
			const sql = subWSConfig.sql || {};
			
			const txtOutput = panel.find(`#skyMES.jqx-tabs-content-element #sql`);
			if (!sql.server && $.isEmptyObject(sql.db))
				txtOutput.val('');
			else
				txtOutput.val(`${sql.server || ''} - ${sql.db || ''}`);
		}
		async skyCafe_sql_vtSecIstendi(e) {
			const {currentTarget} = event || {};
			if (currentTarget)
				currentTarget.blur();

			const {wsConfig} = this;
			const subWSConfig = wsConfig['skyCafe/rest'] = wsConfig['skyCafe/rest'] || {};
			let {sql} = subWSConfig;
			
			await new SkyConfigVTSecPart({
				tekil: true,
				connStr: (sql || {}).connStr || (sql || {}).connectionString,
				server: (sql || {}).server,
				vt: (sql || {}).db,
				tamamIslemi: _e => {
					sql = subWSConfig.sql = subWSConfig.sql || {};
					delete sql.ekSQL;
					delete sql.ekSql;
					
					const {server} = _e;
					const vt = _e.db;
					if (vt) {
						$.extend(sql, {
							server: server,
							db: vt
						});
					}
					else {
						sql = subWSConfig.sql = null;
					}
					
					const subWSConfig_skyCafePratik = wsConfig['skyCafe/pratik'] = wsConfig['skyCafe/pratik'] || {};
					subWSConfig_skyCafePratik.sql = subWSConfig.sql;
					this.skyCafe_sql_vtDegisti($.extend({}, e, _e));
					this.rootConfigKaydet(e);
				}
			}).open()
		}
		skyCafe_sql_vtDegisti(e) {
			const {wsConfig, panel} = this;
			const subWSConfig = wsConfig['skyCafe/rest'] = wsConfig['skyCafe/rest'] || {};
			const sql = subWSConfig.sql || {};
			
			const txtOutput = panel.find(`#skyCafe.jqx-tabs-content-element #sql`);
			if (!sql.server && $.isEmptyObject(sql.db))
				txtOutput.val('');
			else
				txtOutput.val(`${sql.server || ''} - ${sql.db || ''}`);
		}
		async pdks_sql_vtSecIstendi(e) {
			const {currentTarget} = event || {};
			if (currentTarget)
				currentTarget.blur();

			const {wsConfig} = this;
			const subWSConfig = wsConfig.pdks = wsConfig.pdks || {};
			let {sql} = subWSConfig;
			
			await new SkyConfigVTSecPart({
				tekil: true,
				connStr: (sql || {}).connStr || (sql || {}).connectionString,
				server: (sql || {}).server,
				vt: (sql || {}).db,
				tamamIslemi: _e => {
					sql = subWSConfig.sql = subWSConfig.sql || {};
					delete sql.ekSQL;
					delete sql.ekSql;
					
					const {server} = _e;
					const vt = _e.db;
					if (vt) {
						$.extend(sql, {
							server: server,
							db: vt
						});
					}
					else {
						sql = subWSConfig.sql = null;
					}
					
					this.pdks_sql_vtDegisti($.extend({}, e, _e));
					this.rootConfigKaydet(e);
				}
			}).open()
		}		
		pdks_sql_vtDegisti(e) {
			const {wsConfig, panel} = this;
			const subWSConfig = wsConfig.pdks || {};
			const sql = subWSConfig.sql || {};
			
			const txtOutput = panel.find(`#pdks.jqx-tabs-content-element #sql`);
			if (!sql.server && $.isEmptyObject(sql.db))
				txtOutput.val('');
			else
				txtOutput.val(`${sql.server || ''} - ${sql.db || ''}`);
		}
		async eMail_sql_vtSecIstendi(e) {
			const {currentTarget} = event || {};
			if (currentTarget)
				currentTarget.blur();

			const {wsConfig} = this;
			const subWSConfig = wsConfig.eMail = wsConfig.eMail || {};
			let {sql} = subWSConfig;
			
			await new SkyConfigVTSecPart({
				tekil: true,
				connStr: (sql || {}).connStr || (sql || {}).connectionString,
				server: (sql || {}).server,
				vt: (sql || {}).db,
				tamamIslemi: _e => {
					sql = subWSConfig.sql = subWSConfig.sql || {};
					delete sql.ekSQL;
					delete sql.ekSql;
					
					const {server} = _e;
					const vt = _e.db;
					if (vt) {
						$.extend(sql, {
							server: server,
							db: vt
						});
					}
					else {
						sql = subWSConfig.sql = null;
					}
					
					this.eMail_sql_vtDegisti($.extend({}, e, _e));
					this.rootConfigKaydet(e);
				}
			}).open()
		}		
		eMail_sql_vtDegisti(e) {
			const {wsConfig, panel} = this;
			const subWSConfig = wsConfig.eMail || {};
			const sql = subWSConfig.sql || {};
			
			const txtOutput = panel.find(`#eMail.jqx-tabs-content-element #sql`);
			if (!sql.server && $.isEmptyObject(sql.db))
				txtOutput.val('');
			else
				txtOutput.val(`${sql.server || ''} - ${sql.db || ''}`);
		}
		async eMailQueue_sql_vtSecIstendi(e) {
			const {currentTarget} = event || {};
			if (currentTarget)
				currentTarget.blur();

			const {wsConfig} = this;
			const subWSConfig = wsConfig.eMailQueue = wsConfig.eMailQueue || {};
			let {sql} = subWSConfig;
			
			await new SkyConfigVTSecPart({
				tekil: true,
				connStr: (sql || {}).connStr || (sql || {}).connectionString,
				server: (sql || {}).server,
				vt: (sql || {}).db,
				tamamIslemi: _e => {
					sql = subWSConfig.sql = subWSConfig.sql || {};
					delete sql.ekSQL;
					delete sql.ekSql;
					
					const {server} = _e;
					const vt = _e.db;
					if (vt) {
						$.extend(sql, {
							server: server,
							db: vt
						});
					}
					else {
						sql = subWSConfig.sql = null;
					}
					
					this.eMailQueue_sql_vtDegisti($.extend({}, e, _e));
					this.rootConfigKaydet(e);
				}
			}).open()
		}		
		eMailQueue_sql_vtDegisti(e) {
			const {wsConfig, panel} = this;
			const subWSConfig = wsConfig.eMailQueue || {};
			const sql = subWSConfig.sql || {};
			
			const txtOutput = panel.find(`#eMailQueue.jqx-tabs-content-element #sql`);
			if (!sql.server && $.isEmptyObject(sql.db))
				txtOutput.val('');
			else
				txtOutput.val(`${sql.server || ''} - ${sql.db || ''}`);
		}
		async elterm_sql_vtSecIstendi(e) {
			const {currentTarget} = event || {};
			if (currentTarget)
				currentTarget.blur();

			const {wsConfig} = this;
			const subWSConfig = wsConfig.elterm = wsConfig.elterm || {};
			let {sql} = subWSConfig;
			
			await new SkyConfigVTSecPart({
				tekil: true,
				connStr: (sql || {}).connStr || (sql || {}).connectionString,
				server: (sql || {}).server,
				vt: (sql || {}).db,
				tamamIslemi: _e => {
					sql = subWSConfig.sql = subWSConfig.sql || {};
					delete sql.ekSQL;
					delete sql.ekSql;
					
					const {server} = _e;
					const vt = _e.db;
					if (vt) {
						$.extend(sql, {
							server: server,
							db: vt
						});
					}
					else {
						sql = subWSConfig.sql = null;
					}
					
					this.elterm_sql_vtDegisti($.extend({}, e, _e));
					this.rootConfigKaydet(e);
				}
			}).open()
		}		
		elterm_sql_vtDegisti(e) {
			const {wsConfig, panel} = this;
			const subWSConfig = wsConfig.elterm || {};
			const sql = subWSConfig.sql || {};
			
			const txtOutput = panel.find(`#elterm.jqx-tabs-content-element #sql`);
			if (!sql.server && $.isEmptyObject(sql.db))
				txtOutput.val('');
			else
				txtOutput.val(`${sql.server || ''} - ${sql.db || ''}`);
		}
		async skyBulutYedekleme_sql_vtSecIstendi(e) {
			const {currentTarget} = event || {};
			if (currentTarget)
				currentTarget.blur();

			const {wsConfig} = this;
			const subWSConfig = wsConfig.skyBulutYedekleme = wsConfig.skyBulutYedekleme || {};
			const sql = subWSConfig.sql = subWSConfig.sql || {};
			let ekSql = sql.ekSql || sql.ekSQL;
			const server = $.isEmptyObject(ekSql) ? null : ekSql[0].server;
			const vtListe = $.isEmptyObject(ekSql) ? null : ekSql.map(item => item.db);
			await new SkyConfigVTSecPart({
				tekil: false,
				server: server,
				vtListe: vtListe,
				tamamIslemi: _e => {
					/*delete sql.server;
					delete sql.db;
					delete sql.vt;
					delete sql.ekSQL;*/
					
					const {server} = _e;
					const vtListe = _e.dbListe;
					if (!server && $.isEmptyObject(vtListe)) {
						ekSql = sql.ekSql = null;
					}
					else {
						ekSql = sql.ekSql =
							($.isEmptyObject(vtListe) ? [null] : vtListe).map(vt => { return { server: server || undefined, db: vt } } );
					}
					this.skyBulutYedekleme_sql_vtDegisti($.extend({}, e, _e));
					this.rootConfigKaydet(e);
				}
			}).open()
		}
		skyBulutYedekleme_sql_vtDegisti(e) {
			const {wsConfig, panel} = this;
			const subWSConfig = wsConfig.skyBulutYedekleme || {};
			const sql = subWSConfig.sql || {};
			const ekSql = sql.ekSql || sql.ekSQL || {};
			
			const txtOutput = panel.find(`#skyBulutYedekleme.jqx-tabs-content-element #sql`);
			if ($.isEmptyObject(ekSql))
				txtOutput.val('');
			else {
				const server = ekSql[0].server;
				txtOutput.val(`${server || ''} - ${ekSql.map(item => item.db).join(', ')}`);
			}
		}
		async eIslemGonder_sql_vtSecIstendi(e) {
			const {currentTarget} = event || {};
			if (currentTarget)
				currentTarget.blur();

			const {wsConfig} = this;
			const subWSConfig = wsConfig.eIslemGonder = wsConfig.eIslemGonder || {};
			let {sql} = subWSConfig;
			
			await new SkyConfigVTSecPart({
				tekil: true,
				connStr: (sql || {}).connStr || (sql || {}).connectionString,
				server: (sql || {}).server,
				vt: (sql || {}).db,
				tamamIslemi: _e => {
					sql = subWSConfig.sql = subWSConfig.sql || {};
					delete sql.ekSQL;
					delete sql.ekSql;
					
					const {server} = _e;
					const vt = _e.db;
					if (vt) {
						$.extend(sql, {
							server: server,
							db: vt
						});
					}
					else {
						sql = subWSConfig.sql = null;
					}
					
					this.eIslemGonder_sql_vtDegisti($.extend({}, e, _e));
					this.rootConfigKaydet(e);
				}
			}).open()
		}
		eIslemGonder_sql_vtDegisti(e) {
			const {wsConfig, panel} = this;
			const subWSConfig = wsConfig.eIslemGonder || {};
			const sql = subWSConfig.sql || {};
			
			const txtOutput = panel.find(`#eIslemGonder.jqx-tabs-content-element #sql`);
			if (!sql.server && $.isEmptyObject(sql.db))
				txtOutput.val('');
			else
				txtOutput.val(`${sql.server || ''} - ${sql.db || ''}`);
		}
		async eIslemAkibetSorgula_sql_vtSecIstendi(e) {
			const {currentTarget} = event || {};
			if (currentTarget)
				currentTarget.blur();

			const {wsConfig} = this;
			const subWSConfig = wsConfig.eIslemAkibetSorgula = wsConfig.eIslemAkibetSorgula || {};
			let {sql} = subWSConfig;
			
			await new SkyConfigVTSecPart({
				tekil: true,
				connStr: (sql || {}).connStr || (sql || {}).connectionString,
				server: (sql || {}).server,
				vt: (sql || {}).db,
				tamamIslemi: _e => {
					sql = subWSConfig.sql = subWSConfig.sql || {};
					delete sql.ekSQL;
					delete sql.ekSql;
					
					const {server} = _e;
					const vt = _e.db;
					if (vt) {
						$.extend(sql, {
							server: server,
							db: vt
						});
					}
					else {
						sql = subWSConfig.sql = null;
					}
					
					this.eIslemAkibetSorgula_sql_vtDegisti($.extend({}, e, _e));
					this.rootConfigKaydet(e);
				}
			}).open()
		}
		eIslemAkibetSorgula_sql_vtDegisti(e) {
			const {wsConfig, panel} = this;
			const subWSConfig = wsConfig.eIslemAkibetSorgula || {};
			const sql = subWSConfig.sql || {};
			
			const txtOutput = panel.find(`#eIslemAkibetSorgula.jqx-tabs-content-element #sql`);
			if (!sql.server && $.isEmptyObject(sql.db))
				txtOutput.val('');
			else
				txtOutput.val(`${sql.server || ''} - ${sql.db || ''}`);
		}
		async gelenEIslemSorgula_sql_vtSecIstendi(e) {
			const {currentTarget} = event || {};
			if (currentTarget)
				currentTarget.blur();

			const {wsConfig} = this;
			const subWSConfig = wsConfig.gelenEIslemSorgula = wsConfig.gelenEIslemSorgula || {};
			let {sql} = subWSConfig;
			
			await new SkyConfigVTSecPart({
				tekil: true,
				connStr: (sql || {}).connStr || (sql || {}).connectionString,
				server: (sql || {}).server,
				vt: (sql || {}).db,
				tamamIslemi: _e => {
					sql = subWSConfig.sql = subWSConfig.sql || {};
					delete sql.ekSQL;
					delete sql.ekSql;
					
					const {server} = _e;
					const vt = _e.db;
					if (vt) {
						$.extend(sql, {
							server: server,
							db: vt
						});
					}
					else {
						sql = subWSConfig.sql = null;
					}
					
					this.gelenEIslemSorgula_sql_vtDegisti($.extend({}, e, _e));
					this.rootConfigKaydet(e);
				}
			}).open()
		}
		gelenEIslemSorgula_sql_vtDegisti(e) {
			const {wsConfig, panel} = this;
			const subWSConfig = wsConfig.gelenEIslemSorgula || {};
			const sql = subWSConfig.sql || {};
			
			const txtOutput = panel.find(`#gelenEIslemSorgula.jqx-tabs-content-element #sql`);
			if (!sql.server && $.isEmptyObject(sql.db))
				txtOutput.val('');
			else
				txtOutput.val(`${sql.server || ''} - ${sql.db || ''}`);
		}
		async eIslemArsivle_sql_vtSecIstendi(e) {
			const {currentTarget} = event || {};
			if (currentTarget)
				currentTarget.blur();

			const {wsConfig} = this;
			const subWSConfig = wsConfig.eIslemArsivle = wsConfig.eIslemArsivle || {};
			let {sql} = subWSConfig;
			
			await new SkyConfigVTSecPart({
				tekil: true,
				connStr: (sql || {}).connStr || (sql || {}).connectionString,
				server: (sql || {}).server,
				vt: (sql || {}).db,
				tamamIslemi: _e => {
					sql = subWSConfig.sql = subWSConfig.sql || {};
					delete sql.ekSQL;
					delete sql.ekSql;
					
					const {server} = _e;
					const vt = _e.db;
					if (vt) {
						$.extend(sql, {
							server: server,
							db: vt
						});
					}
					else {
						sql = subWSConfig.sql = null;
					}
					
					this.eIslemArsivle_sql_vtDegisti($.extend({}, e, _e));
					this.rootConfigKaydet(e);
				}
			}).open()
		}
		eIslemArsivle_sql_vtDegisti(e) {
			const {wsConfig, panel} = this;
			const subWSConfig = wsConfig.eIslemArsivle || {};
			const sql = subWSConfig.sql || {};
			
			const txtOutput = panel.find(`#eIslemArsivle.jqx-tabs-content-element #sql`);
			if (!sql.server && $.isEmptyObject(sql.db))
				txtOutput.val('');
			else
				txtOutput.val(`${sql.server || ''} - ${sql.db || ''}`);
		}
		async eMutabakat_sql_vtSecIstendi(e) {
			const {currentTarget} = event || {};
			if (currentTarget)
				currentTarget.blur();

			const {wsConfig} = this;
			const subWSConfig = wsConfig.eMutabakat = wsConfig.eMutabakat || {};
			let {sql} = subWSConfig;
			
			await new SkyConfigVTSecPart({
				tekil: true,
				connStr: (sql || {}).connStr || (sql || {}).connectionString,
				server: (sql || {}).server,
				vt: (sql || {}).db,
				tamamIslemi: _e => {
					sql = subWSConfig.sql = subWSConfig.sql || {};
					delete sql.ekSQL;
					delete sql.ekSql;
					
					const {server} = _e;
					const vt = _e.db;
					if (vt) {
						$.extend(sql, {
							server: server,
							db: vt
						});
					}
					else {
						sql = subWSConfig.sql = null;
					}
					
					this.eMutabakat_sql_vtDegisti($.extend({}, e, _e));
					this.rootConfigKaydet(e);
				}
			}).open()
		}
		eMutabakat_sql_vtDegisti(e) {
			const {wsConfig, panel} = this;
			const subWSConfig = wsConfig.eMutabakat || {};
			const sql = subWSConfig.sql || {};
			
			const txtOutput = panel.find(`#eMutabakat.jqx-tabs-content-element #sql`);
			if (!sql.server && $.isEmptyObject(sql.db))
				txtOutput.val('');
			else
				txtOutput.val(`${sql.server || ''} - ${sql.db || ''}`);
		}
		async skyERP_sql_vtSecIstendi(e) {
			const {currentTarget} = event || {};
			if (currentTarget)
				currentTarget.blur();

			const {wsConfig} = this;
			const subWSConfig = wsConfig.skyERP = wsConfig.skyERP || {};
			let {sql} = subWSConfig;
			
			await new SkyConfigVTSecPart({
				tekil: true,
				connStr: (sql || {}).connStr || (sql || {}).connectionString,
				server: (sql || {}).server,
				vt: (sql || {}).db,
				tamamIslemi: _e => {
					sql = subWSConfig.sql = subWSConfig.sql || {};
					delete sql.ekSQL;
					delete sql.ekSql;
					
					const {server} = _e;
					const vt = _e.db;
					if (vt) {
						$.extend(sql, {
							server: server,
							db: vt
						});
					}
					else {
						sql = subWSConfig.sql = null;
					}
					
					this.skyERP_sql_vtDegisti($.extend({}, e, _e));
					this.rootConfigKaydet(e);
				}
			}).open()
		}
		skyERP_sql_vtDegisti(e) {
			const {wsConfig, panel} = this;
			const subWSConfig = wsConfig.skyERP || {};
			const sql = subWSConfig.sql || {};
			
			const txtOutput = panel.find(`#skyERP.jqx-tabs-content-element #sql`);
			if (!sql.server && $.isEmptyObject(sql.db))
				txtOutput.val('');
			else
				txtOutput.val(`${sql.server || ''} - ${sql.db || ''}`);
		}
		async skyTablet_sql_vtSecIstendi(e) {
			const {currentTarget} = event || {};
			if (currentTarget)
				currentTarget.blur();

			const {wsConfig} = this;
			const subWSConfig = wsConfig.skyTablet = wsConfig.skyTablet || {};
			let {sql} = subWSConfig;
			
			await new SkyConfigVTSecPart({
				tekil: true,
				connStr: (sql || {}).connStr || (sql || {}).connectionString,
				server: (sql || {}).server,
				vt: (sql || {}).db,
				tamamIslemi: _e => {
					sql = subWSConfig.sql = subWSConfig.sql || {};
					delete sql.ekSQL;
					delete sql.ekSql;
					
					const {server} = _e;
					const vt = _e.db;
					if (vt) {
						$.extend(sql, {
							server: server,
							db: vt
						});
					}
					else {
						sql = subWSConfig.sql = null;
					}
					
					this.skyTablet_sql_vtDegisti($.extend({}, e, _e));
					this.rootConfigKaydet(e);
				}
			}).open()
		}
		skyTablet_sql_vtDegisti(e) {
			const {wsConfig, panel} = this;
			const subWSConfig = wsConfig.skyTablet || {};
			const sql = subWSConfig.sql || {};
			
			const txtOutput = panel.find(`#skyTablet.jqx-tabs-content-element #sql`);
			if (!sql.server && $.isEmptyObject(sql.db))
				txtOutput.val('');
			else
				txtOutput.val(`${sql.server || ''} - ${sql.db || ''}`);
		}
		async sgk_ekSql_vtSecIstendi(e) {
			const {currentTarget} = event || {};
			if (currentTarget)
				currentTarget.blur();

			const {wsConfig} = this;
			const subWSConfig = wsConfig.sgk = wsConfig.sgk || {};
			
			const sql = subWSConfig.sql = subWSConfig.sql || {};
			let ekSql = sql.ekSql || sql.ekSQL;
			const server = $.isEmptyObject(ekSql) ? null : ekSql[0].server;
			const vtListe = $.isEmptyObject(ekSql) ? null : ekSql.map(item => item.db);
			await new SkyConfigVTSecPart({
				tekil: false,
				server: server,
				vtListe: vtListe,
				tamamIslemi: _e => {
					delete sql.ekSQL;
					delete sql.ekSql;
					delete sql.db;
					
					const {server} = _e;
					const vtListe = _e.dbListe;
					if (!server && $.isEmptyObject(vtListe)) {
						ekSql = sql.ekSql = null;
					}
					else {
						ekSql = sql.ekSql =
							($.isEmptyObject(vtListe) ? [null] : vtListe).map(vt => { return { server: server || undefined, db: vt } } );
					}
					this.sgk_ekSql_vtDegisti($.extend({}, e, _e));
					this.rootConfigKaydet(e);
				}
			}).open()
		}
		sgk_ekSql_vtDegisti(e) {
			const {wsConfig, panel} = this;
			const subWSConfig = wsConfig.sgk || {};
			const sql = subWSConfig.sql || {};
			const ekSql = sql.ekSql || sql.ekSQL || {};
			
			const txtOutput = panel.find(`#sgk.jqx-tabs-content-element #ekSql`);
			if ($.isEmptyObject(ekSql))
				txtOutput.val('');
			else {
				const server = ekSql[0].server;
				txtOutput.val(`${server || ''} - ${ekSql.map(item => item.db).join(', ')}`);
			}
		}
		async onResize(e) {
			if ((await super.onResize(e)) === false)
				return false
		}
	}
})()
