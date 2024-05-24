(function() {
	window.SkyConfigVTSecPart = class extends window.SkyConfigWindowPart {
		constructor(e) {
			e = e || {};
			super(e);

			const _vt = e.db || e.vt;
			const vtListe = _vt ? [_vt] : (e.dbListe || e.vtListe);
			const connStr = e.connStr || e.connectionString;
			$.extend(this, {
				baslikText: e.baslikText,
				tekilmi: asBool(e.tekil) || asBool(e.tekilmi),
				useConnStrFlag: !!connStr,
				connStr: connStr,
				server: e.server,
				vtListe: vtListe
			});
		}

		static get partName() { return 'vtSec' }
		get defaultTitle() { return 'Sunucu ve Veritabanı Seçimi' }
		get defaultIsModal() { return true }
		get autoFocus_uiSelector() { return `.vtListeParent #vtListe` }
		
		async tazeleDevam(e) {
			await super.tazeleDevam(e);

			const {wndContent, baslikText, tekilmi} = this;
			if (baslikText) {
				wndContent.find(`#baslikText`).html(baslikText);
				wndContent.find(`#baslikTextParent`).removeClass(`jqx-hidden`);
			}
			else {
				wndContent.find(`#baslikTextParent`).addClass(`jqx-hidden`);
			}

			this.lastValue_connstr = this.connStr;
			const txtConnStr = this.txtConnStr = wndContent.find(`#connStr`);
			txtConnStr.val(this.connStr || '');
			txtConnStr.on('change', evt => {
				this.connStr = txtConnStr.val();
			});
			txtConnStr.on('keyup', evt => {
				const key = (evt.key || '').toLowerCase();
				if (key == 'enter' || key == 'linefeed')
					this.listeTazele($.extend({}, e, { event: evt }));
			});
			txtConnStr.on('blur', evt => {
				if (this.lastValue_connStr != this.connStr)
					this.listeTazele($.extend({}, e, { event: evt }));
				this.lastValue_connStr = this.connStr;
			});

			this.lastValue_server = this.server;
			const txtServer = this.txtServer = this.initTextInput({
				htmlSelector: `#server`, instSelector: 'server',
				placeHolder: `SQL Ana Sistem`,
				value: this.server, args: { /*minLength: 2,*/ }
			});
			txtServer.on('change', evt => {
				this.server = txtServer.val();
			});
			txtServer.on('keyup', evt => {
				const key = (evt.key || '').toLowerCase();
				if (key == 'enter' || key == 'linefeed')
					this.listeTazele($.extend({}, e, { event: evt }));
			});
			txtServer.on('blur', evt => {
				if (this.lastValue_server != this.server)
					this.listeTazele($.extend({}, e, { event: evt }));
				this.lastValue_server = this.server;
			});

			const chkConnStrParent = wndContent.find(`#chkConnStrParent`);
			const chkConnStr = chkConnStrParent.find(`#chkConnStr`);
			chkConnStr.prop('checked', asBool(this.useConnStrFlag));
			chkConnStr.parent()[chkConnStr.is(':checked') ? 'addClass' : 'removeClass']('checked');
			chkConnStr.on('change', evt => {
				const elm = $(evt.currentTarget);
				const flag = elm.is(':checked');
				elm.parent()[flag ? 'addClass' : 'removeClass']('checked');
				this.useConnStrFlag = flag;

				txtConnStr[flag ? 'removeClass' : 'addClass']('jqx-hidden');
				txtServer[flag ? 'addClass' : 'removeClass']('jqx-hidden');
				this.wnd_onResize();
			});

			const {useConnStrFlag} = this;
			txtConnStr[useConnStrFlag ? 'removeClass' : 'addClass']('jqx-hidden');
			txtServer[useConnStrFlag ? 'addClass' : 'removeClass']('jqx-hidden');
			
			const txtServerParent = this.txtServerParent = txtServer.parent();

			let {vtListePart} = this;
			if (!vtListePart || vtListePart.isDestroyed) {
				const vtListeParent = wndContent.find(`.vtListeParent`);
				const divVTListe = vtListeParent.find(`#vtListe`);
				vtListePart = this.vtListePart = new DataTablePart({
					layout: divVTListe,
					widgetBeforeInit: _e => {
						$.extend(_e.widgetArgs, {
							pageable: true, pageSize: 20,
							selectionMode: tekilmi ? 'singleRow' : 'custom',
							filterable: true, filterMode: 'default', filterHeight: 35,
							serverProcessing: false
						});
					},
					/*widgetAfterInit: _e => {
						const {widgetPart} = _e;
						widgetPart.on('rowDoubleClick', evt =>
							this.baslatIstendi(e));
					},*/
					columns: [
						{ dataField: 'aciklama', text: 'VT Adı', cellClassName: 'vtAdi' }
					],
					loadServerData: e =>
						this.liste_loadServerData(e),
					itemClick: e =>
						this.liste_onItemClick(e),
					bindingComplete: e =>
						this.liste_veriYuklendi(e)
				});
				vtListePart.basicRun();
				vtListePart.layout
					.detach()
					.appendTo(vtListeParent);
			}
		}

		tazeleSonrasi(e) {
			super.tazeleSonrasi(e);
		}

		close_araIslemler(e) {
			super.close_araIslemler(e);

			const {vtListePart} = this;
			if (vtListePart && !vtListePart.isDestroyed && vtListePart.widgetPart)
				vtListePart.destroyPart();
			
			delete this.server;
			delete this.vtListePart;
		}

		setValues(e) {
			super.setValues(e);

			const tekilmi = (e.tekil || e.tekilmi);
			const vt = e.db || e.vt || this.vt;
			const vtListe = vt ? [vt] : (e.dbListe || e.vtListe || this.vtListe);
			$.extend(this, {
				baslikText: e.baslikText == null ? this.baslikText : e.baslikText,
				tekilmi: asBool(tekilmi == null ? this.tekilmi : tekilmi),
				server: e.server == null ? this.server : e.server,
				vtListe: vtListe
			});
		}

		wndArgsDuzenle(e) {
			super.wndArgsDuzenle(e);

			const minHeight = 500;
			$.extend(e.args, {
				width: 450, height: Math.max($(window).height() - 50, minHeight),
				minWidth: 350, minHeight: minHeight
			});
		}

		tamamIstendi_argsDuzenle(e) {
			super.tamamIstendi_argsDuzenle(e);

			const {tekilmi} = this;
			const {widget} = this.vtListePart;
			const recs = widget.getSelection().filter(rec => !!rec);
			const vtListe = this.vtListe = $.isEmptyObject(recs) ? null : recs.map(rec => rec.aciklama);
			if (tekilmi && vtListe && vtListe.length > 1)
				return { isError: true, rc: 'noMultiSelect', errorText: `Sadece bir tane Veritabanı seçilmelidir` };

			const {useConnStrFlag} = this;
			$.extend(e.args, {
				tekilmi: tekilmi,
				connTuru: useConnStrFlag ? 'OLEDB' : undefined,
				connStr: useConnStrFlag ? this.connStr : undefined,
				server: useConnStrFlag ? undefined : this.server
			});
			e.args[tekilmi ? 'db' : 'dbListe'] = tekilmi ? (vtListe || [])[0] : vtListe;
		}

		listeTazele(e) {
			const {vtListePart} = this;
			if (vtListePart && !vtListePart.isDestroyed && vtListePart.widgetPart)
				vtListePart.tazele();
		}

		async liste_loadServerData(e) {
			const {app, useConnStrFlag, server, connStr} = this;
			const {wsArgs} = e;
			if (useConnStrFlag) {
				if (connStr) {
					wsArgs.sql = toJSONStr({
						connTuru: 'OLEDB',
						connStr: connStr
					});
				}
			}
			else {
				if (server)
					wsArgs.sql = toJSONStr({ server: server, db: 'ORTAK' });
			}

			if ($.isEmptyObject(wsArgs.orderBy)) {
				wsArgs.orderBy = [
					`SUBSTRING(name, 3, 2) DESC`,
					`SUBSTRING(name, 1, 2) DESC`
				].join(delimWS);
			}

			let promise = this.promise_listeTazele;
			let recs;
			if (promise) {
				try {
					if (promise.abort)
						promise.abort();
					if (promise.reject)
						promise.reject(null);
					if (promise)
						recs = await promise;
					promise = this.promise_listeTazele = null;
				}
				catch (ex) { }
			}
				
			try {
				if (!recs) {
					promise = this.promise_listeTazele = app.wsDBListe(wsArgs);
					recs = await promise;
				}
				if (recs)
					recs = recs.rows || recs;
				recs = (recs || []).map(name => { return { aciklama: name } });
				/*if (!$.isEmptyObject(recs))
					recs = recs.map(name => { return { aciklama: name } }).reverse();*/
			}
			catch (ex) {
				recs = [];
				((window.savedProcs || {}).hideProgress || hideProgress)();
				// defFailBlock(ex);
				// throw ex;
			}
			finally {
				promise = this.promise_listeTazele = null;
			}
			
			return recs
		}

		liste_veriYuklendi(e) {
			const {vtListe} = this;
			if (!$.isEmptyObject(vtListe)) {
				const {widget} = this.vtListePart;
				if (!widget)
					return;
				
				const vtListeSet = asSet(vtListe);
				const recs = widget.getRows();
				widget.beginUpdate();
				for (const i in recs) {
					const rec = recs[i];
					const {uid, aciklama} = rec;
					if (vtListeSet[aciklama])
						widget.selectrowbykey(uid);
				}
				widget.endUpdate();
			}
		}

		liste_onItemClick(e) {
			const {tekilmi} = this;
			if (!tekilmi) {
				const uid = e.event.args.key;
				const {widget} = this.vtListePart;
				if (uid != null) {
					const rowInfo = widget.rowinfo[uid];
					if (rowInfo.selected)
						widget.unselectrowbykey(uid);
					else
						widget.selectrowbykey(uid);
				}
			}
		}

		async wnd_onResize(e) {
			await super.wnd_onResize(e);

			const {vtListePart} = this;
			if (vtListePart && !vtListePart.isDestroyed && vtListePart.widgetPart) {
				const {wnd, txtServerParent} = this;
				const divVTListe = vtListePart.widgetPart;
				let height = wnd.height() - (divVTListe.position().top + txtServerParent.height() - 75);
				divVTListe.jqxDataTable('height', height);
			}
		}
	}
})()
