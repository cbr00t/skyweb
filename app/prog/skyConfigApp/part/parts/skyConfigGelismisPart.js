(function() {
	window.SkyConfigGelismisPart = class extends window.SkyConfigInnerPartWithTabs {
		constructor(e) {
			e = e || {};
			super(e);

			this.args = e.args || this.args || {};
		}

		static get partName() { return 'gelismis' }

		get vioConfig() {
			return this._vioConfig = this._vioConfig || {};
		}
		set vioConfig(value) {
			this._vioConfig = value;
		}

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
			await this.initTabContent_devam(e);
			
			const {tabPage} = e;
				tabPage.find(`input[type=text]`, `input[type=textbox]`)
					.off('focus')
					.on('focus', evt =>
						evt.target.select());
		}
		
		async initTabContent_devam(e) {
			const {tabID} = e;
			switch (tabID) {
				case 'log':
					return await this.initTabContent_log(e);
				case 'vioGlobalIni':
					return await this.initTabContent_vioGlobalIni(e);
				case 'teknikAyarlar_json':
					return await this.initTabContent_teknikAyarlar_json(e);
				case 'teknikAyarlar_editor':
					return await this.initTabContent_teknikAyarlar_editor(e);
				case 'sqlExec':
					return await this.initTabContent_sqlExec(e);
				case 'shell':
					return await this.initTabContent_shell(e);
				case 'cvmCall':
					return await this.initTabContent_cvmCall(e);
				case 'webRequest':
					return await this.initTabContent_webRequest(e);
				case 'download':
					return await this.initTabContent_download(e);
				case 'upload':
					return await this.initTabContent_upload(e);
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

		async initTabContent_log(e) {
			const {app} = this;
			const args = this.args.log = this.args.log || {};
			const {tabPage} = e;
			$.extend(args, {
				tabPage: tabPage
			});

			const subArgs = args.subArgs = args.subArgs || {
				// tarih_basi: dateToString(today().prev().day()),
				tarih_basi: dateToString(today()),
				tarih_sonu: dateToString(today())
			};

			const islemTuslari = tabPage.find(`.islemTuslari-ek`);
			const btnTemizle = islemTuslari.find(`#temizle`);
			btnTemizle
				.jqxButton({ theme: theme })
				.on('click', evt =>
					this.log_temizleIstendi($.extend({}, e, { event: evt })));

			const filtre_parent = tabPage.find(`#filtre_parent`);
			const tarihBS_parent = filtre_parent.find(`#tarihBS_parent`);
			if (tarihBS_parent.length) {
				const tarihDegisti = e =>
					this.tazele();
				
				const txtTarih_basi = tarihBS_parent.find(`#tarih_basi`);
				txtTarih_basi.val(dateToString(subArgs.tarih_basi));
				txtTarih_basi.on('change', evt => {
					let {value} = evt.target;
					value = evt.target.value = subArgs.tarih_basi = (tarihDegerDuzenlenmis(value || '') || '').trim();
					tarihDegisti({ event: evt });
				});
				const txtTarih_sonu = tarihBS_parent.find(`#tarih_sonu`);
				txtTarih_sonu.val(dateToString(subArgs.tarih_sonu));
				txtTarih_sonu.on('change', evt => {
					let {value} = evt.target;
					value = evt.target.value = subArgs.tarih_sonu = (tarihDegerDuzenlenmis(value || '') || '').trim();
					tarihDegisti({ event: evt });
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

			const getCellsClassName = e => {
				const {rowIndex, columnField, value, ekCSS} = e;
				let rec = (e.rec || {}).originalRecord || (e.rec || {});
				const {level, isError, indent} = rec;
				
				let result = ekCSS || '';
				if (level) {
					if (result)
						result += ' ';
					result += `level-${level}`;
				}
				if (indent) {
					if (indent)
						result += ' ';
					result += `indent-${indent}`;
				}
				if (isError) {
					if (isError)
						result += ' ';
					result += `error`;
				}
				
				return result;
			};
			
			const liste_parent = tabPage.find(`#liste_parent`);
			const divListe = liste_parent.find(`#liste`);
			const listePart = args.listePart = new DataTablePart({
				layout: divListe,
				widgetBeforeInit: _e => {
					$.extend(_e.widgetArgs, {
						selectionMode: 'singleRow',
						pageable: true, pageSize: 6, columnsHeight: 50,
						pageSizeOptions: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 20, 25, 30, 40, 50, 80, 100],
						filterable: true, filterMode: 'default', filterHeight: 40,
						serverProcessing: false
					});
				},
				/*widgetAfterInit: _e => {
					const {widgetPart} = _e;
					widgetPart.on('rowDoubleClick', evt =>
						this.baslatIstendi(e));
				},*/
				columns: [
					/*
						level, timestamp, indent, thread, isError, event, args[]
 					*/
					{
						dataField: 'level', text: 'Seviye', width: 95, align: 'center',
						cellClassName: (rowIndex, columnField, value, rec) =>
							getCellsClassName({ rowIndex: rowIndex, columnField: columnField, value: value, rec: rec, ekCSS: 'level' })
					},
					{
						dataField: 'timestamp', text: 'İşlem Zamanı', width: 130, align: 'center',
						cellClassName: (rowIndex, columnField, value, rec) =>
							getCellsClassName({ rowIndex: rowIndex, columnField: columnField, value: value, rec: rec, ekCSS: 'timestamp' })
					},
					{
						dataField: 'indent', text: 'Ind.', width: 55, columnType: 'number', align: 'center', cellsAlign: 'right',
						cellClassName: (rowIndex, columnField, value, rec) =>
							getCellsClassName({ rowIndex: rowIndex, columnField: columnField, value: value, rec: rec, ekCSS: 'indent' })
					},
					{
						dataField: 'isError', text: 'Hata', width: 55, align: 'center', cellsAlign: 'center',
						cellClassName: (rowIndex, columnField, value, rec) =>
							getCellsClassName({ rowIndex: rowIndex, columnField: columnField, value: value, rec: rec, ekCSS: 'isError' }),
						cellsRenderer: (rowIndex, columnIndex, value, rec) => {
							rec = rec.originalRecord || rec;
							// return rec.isError ? `<b class="red">HATA</b>` : '';
							return `<div align="center"><input type="checkbox"" disabled ${rec.isError ? ' checked' : ''}></input></div>`;
						}
					},
					{
						dataField: 'event', text: 'İşlem', width: 280, align: 'center',
						cellClassName: (rowIndex, columnField, value, rec) =>
							getCellsClassName({ rowIndex: rowIndex, columnField: columnField, value: value, rec: rec, ekCSS: 'event' })
					},
					{
						dataField: 'args', text: 'Ek Bilgi', align: 'center',
						cellClassName: (rowIndex, columnField, value, rec) =>
							getCellsClassName({ rowIndex: rowIndex, columnField: columnField, value: value, rec: rec, ekCSS: 'args' }),
						cellsRenderer: (rowIndex, columnIndex, value, rec) => {
							rec = rec.originalRecord || rec;
							const {args} = rec;
							if ($.isEmptyObject(args))
								return '';
							args[0] = `<b class="royalblue">${args[0]}</b>`;
							return (
								`<ul class="log-args">` +
									args.map(item => `<li class="log-arg">${item}</li>`).join('\r\n') +
								`</ul>`
							);
						}
					},
				],
				loadServerData: async e => {
					let recs = await app.wsLog(subArgs);
					recs = (recs || {}).rows || recs;
					if (!$.isEmptyObject(recs))
						recs = recs.reverse();
					return recs;
				},
				itemClick: e => {
					/*const uid = e.event.args.key;
					const {widget} = args.listePart;
					if (uid != null) {
						const rowInfo = widget.rowinfo[uid];
						if (rowInfo.selected)
							widget.unselectrowbykey(uid);
						else
							widget.selectrowbykey(uid);
						// subArgs.paketler = widget.getSelection().map(rec => rec.paketAdi);
					}*/
				},
				itemDblClick: e => {
				},
				bindingComplete: e => {
				}
			});
			listePart.basicRun();
			listePart.layout
				.detach()
				.appendTo(liste_parent);
		}

		async log_temizleIstendi(e) {
		}

		async initTabContent_vioGlobalIni(e) {
			const {app} = this;
			const args = this.args.vioGlobalIni = this.args.vioGlobalIni || {};
			const {tabPage} = e;
			$.extend(args, {
				tabPage: tabPage
			});

			const subArgs = args.subArgs = args.subArgs || {};
			const islemTuslari = tabPage.find(`.islemTuslari`);
			islemTuslari.find(`button`)
				.jqxButton({ theme: theme })
				.on('click', evt =>
					this.vioGlobalIni_islemTusuTiklandi($.extend({}, e, { event: evt, id: evt.currentTarget.id })));

			const elms = [
				tabPage.find(`input[type=text]`),
				tabPage.find(`input[type=textbox]`)
			];
			for (let i = 0; i < elms.length; i++) {
				elms[i].on('click', evt =>
					evt.target.select());
			}

			const liste_parent = tabPage.find(`#liste_parent`);
			const divListe = liste_parent.find(`#liste`);
			const listePart = args.listePart = new DataTablePart({
				layout: divListe,
				widgetBeforeInit: _e => {
					$.extend(_e.widgetArgs, {
						selectionMode: 'singleRow',
						pageable: true, pageSize: 10, columnsHeight: 50,
						pageSizeOptions: [5, 8, 10, 13, 15, 20, 25, 30, 40, 50, 80, 100],
						filterable: true, filterMode: 'default', filterHeight: 40,
						serverProcessing: false
					});
				},
				widgetAfterInit: _e => {
					const {widgetPart} = _e;
					widgetPart.on('rowDoubleClick', evt => {
						const btnDegistir = islemTuslari.find(`#degistir`);
						if (btnDegistir.length)
							btnDegistir.click();
					});
				},
				columns: [
					{ dataField: 'key', text: 'Belirteç', width: 280, cellClassName: 'key' },
					{ dataField: 'value', text: 'Değer', cellClassName: 'value' }
				],
				loadServerData: e => {
					let recs = this.vioConfig;
					return recs;
				},
				itemClick: e => {
					/*const uid = e.event.args.key;
					const {widget} = args.listePart;
					if (uid != null) {
						const rowInfo = widget.rowinfo[uid];
						if (rowInfo.selected)
							widget.unselectrowbykey(uid);
						else
							widget.selectrowbykey(uid);
						// subArgs.paketler = widget.getSelection().map(rec => rec.paketAdi);
					}*/
				},
				itemDblClick: e => {
				},
				bindingComplete: e => {
				}
			});
			listePart.basicRun();
			listePart.layout
				.detach()
				.appendTo(liste_parent);
		}

		async vioGlobalIni_islemTusuTiklandi(e) {
			const {event, id} = e;
			let target = (event || {}).currentTarget;
			if (target)
				target = $(target);
			
			if (target)
				setButonEnabled(target, false);
			try {
				switch (id) {
					case 'ekle':
						return await this.vioGlobalIni_ekleIstendi(e);
					case 'degistir':
						return await this.vioGlobalIni_degistirIstendi(e);
					case 'sil':
						return await this.vioGlobalIni_silIstendi(e);
				}
			}
			finally {
				setTimeout(() => {
					if (target)
						setButonEnabled(target, true);
				}, 500);
			}
		}

		vioGlobalIni_ekleIstendi(e) {
			const part = new SkyConfigVioGlobalIniDuzenlePart({
				rec: {
					key: '', value: ''
				},
				tamamIslemi: _e => {
					const {rec} = _e;
					const {key} = rec;
					const {vioConfig} = this;
					if (vioConfig.find(_rec => _rec.key == key))
						throw { isError: true, rc: 'duplicateRecord', errorText: `<b>${key}</b> belirteci için tanım zaten var` };
					delete rec.uid;
					delete rec._visible;
					vioConfig.push(rec);
					this.vioConfigKaydet().then(() =>
						this.tazele())
				}
			});
			part.open();

			return part;
		}

		vioGlobalIni_degistirIstendi(e) {
			const args = (this.args || {}).vioGlobalIni;
			const {listePart} = args;
			const {widget} = listePart;
			const rec = (widget.getSelection() || [])[0];
			if (!rec)
				return null;
			
			const part = new SkyConfigVioGlobalIniDuzenlePart({
				rec: rec,
				tamamIslemi: _e => {
					const newRec = _e.rec;
					delete newRec.uid;
					delete newRec._visible;
					const {key} = newRec;
					const {vioConfig} = this;
					const index = vioConfig.findIndex(_rec => _rec.key == key);
					if (index == null || index < 0)
						throw { isError: true, rc: 'noRecordMatch', errorText: `<b>${key}</b> belirteci için tanım belirlenemedi` };
					vioConfig[index] = newRec;
					this.vioConfigKaydet().then(() =>
						this.tazele())
				}
			});
			part.open();
			
			return part;
		}

		vioGlobalIni_silIstendi(e) {
			const args = (this.args || {}).vioGlobalIni;
			const {listePart} = args;
			const {widget} = listePart;
			const rec = (widget.getSelection() || [])[0];
			if (!rec)
				return null;

			const {key} = rec;
			const {vioConfig} = this;
			const index = vioConfig.findIndex(_rec => _rec.key == key);
			if (index == null || index < 0) {
				try {
					throw { isError: true, rc: 'noRecordMatch', errorText: `<b>${key}</b> belirteci için tanım belirlenemedi` }
				}
				catch (ex) {
					const {isError, errorText} = ex;
					if (isError && errorText)
						displayMessage(errorText, `@ Kullanıcı Silme İşlemi @`);
				}
			}
			vioConfig.splice(index, 1);
			this.vioConfigKaydet().then(() =>
				this.tazele());
		}

		async initTabContent_teknikAyarlar_json(e) {
			const {tabPage} = e;
			const islemTuslari = this.islemTuslari = tabPage.find(`.islemTuslari`);
			islemTuslari.find('button')
				.jqxButton({ theme: theme })
				.on('click', evt =>
					this.islemTusuTiklandi($.extend({}, e, { event: evt, id: evt.currentTarget.id })));

			setTimeout(() => {
				try {
					this.teknikAyarlar_json_initEditor(e);
					this.onResize()
				}
				catch (ex) { }
			}, 10);
			setTimeout(() =>
				this.teknikAyarlar_json_initEditor(e),
				100);
		}

		async initTabContent_teknikAyarlar_editor(e) {
			const {tabPage} = e;
			const islemTuslari = this.islemTuslari = tabPage.find(`.islemTuslari`);
			islemTuslari.find('button')
				.jqxButton({ theme: theme })
				.on('click', evt =>
					this.islemTusuTiklandi($.extend({}, e, { event: evt, id: evt.currentTarget.id })));

			const config_parent = this.config_parent = tabPage.find(`#teknikAyarlar_editor_config_parent`);
			const divConfig = this.divConfig = config_parent.find(`#teknikAyarlar_editor_config`);
			
			const {app} = this;
			const options = {
				theme: 'bootstrap4',
				iconlib: 'jqueryui',
			    show_errors: 'interaction',
			    object_layout: 'grid',
				compact: true,
				show_opt_in: true,
			    array_controls_top: true,
				ajax: true,
				schema: await app.wsConfigSchema()
			}

			let {jsonEditorPart} = this;
			if (jsonEditorPart) {
				jsonEditorPart.destroy();
				jsonEditorPart = this.jsonEditorPart = null;
			}

			const {defaults} = JSONEditor;
			defaults.language = 'en';
			/*defaults.editors.object.options = defaults.editors.object.options || {};
			defaults.editors.object.options.collapsed = true;*/
			
			jsonEditorPart = this.jsonEditorPart = new JSONEditor(divConfig[0], options);
			await jsonEditorPart.promise;
			setTimeout(
				() => $(jsonEditorPart.root_container).find(`*:not([data-schematype=array]).json-editor-btn-collapse:not(:eq(0))`).click(),
				100
			);
		}

		async initTabContent_sqlExec(e) {
			const args = this.args.sqlExec = this.args.sqlExec || {};
			const {tabPage} = e;
			$.extend(args, {
				tabPage: tabPage,
				subOutput: tabPage.find(`#sqlExec_execResult`)
			});

			const btnServerVeTekilVTSec = tabPage.find(`#sqlExec_serverVeTekilVTSec`);
			if (btnServerVeTekilVTSec && btnServerVeTekilVTSec.length) {
				btnServerVeTekilVTSec
					.jqxButton({ theme: theme })
					.on('click', evt => {
						const sql = args.sql || {};
						new SkyConfigVTSecPart({
							tekil: true,
							server: sql.server || '',
							vt: sql.db || sql.vt,
							connTuru: sql.connTuru || sql.connType || sql.tip || sql.type,
							connStr: sql.connStr || sql.connectionString,
							tamamIslemi: _e => {
								const {server, connStr, connTuru} = _e;
								const vt = _e.db || _e.vt;
								
								delete sql.vt;
								sql.connTuru = connTuru || undefined;
								sql.connStr = connStr || undefined;
								sql.server = server || undefined;
								sql.db = vt || undefined;
								if (!(sql.server || sql.connStr || sql.db))
									delete args.sql;
								else
									args.sql = sql;
								
								for (const key in sql) {
									if (sql[key] == null)
										delete sql[key]
								}
								
								const txtServerVeTekilVT = tabPage.find(`#sqlExec_serverVeTekilVT`);
								if (!(server || connStr) && $.isEmptyObject(vt))
									txtServerVeTekilVT.val('');
								else {
									txtServerVeTekilVT.val(
										(connTuru ? `[${connTuru}]  ` : '') +
										`${connStr || server || ''}` +
										(vt ? ` - ${vt}` : '')
									);
								}
							}
						}).open()
					});
			}
			
			const txtQuery = tabPage.find(`#sqlExec_query`);
			if (window.ace) {
				const editor = ace.edit(
					txtQuery[0], {
						theme: 'ace/theme/monokai',
						mode: 'ace/mode/sql',
						selectionStyle: 'text'
					}
				);
				editor.setOptions({
					autoScrollEditorIntoView: true,
					copyWithEmptySelection: true,
					mergeUndoDeltas: 'always'
				});
				editor.session.setValue(args.query || '');
				editor.on('change', e =>
					args.query = (editor.getValue() || '').trim());
			}
			else {
				txtQuery.val(args.query || '');
				txtQuery.on('change', evt =>
					args.query = (evt.target.value || '').trim());
			}

			const outputParent = tabPage.find(`.sqlExec_result_parent`);
			const outputPart = args.output = new DataTablePart({
				layout: outputParent.find('div'),
				widgetBeforeInit: _e => {
					$.extend(_e.widgetArgs, {
						pageable: true, pageSize: 10, width: '99%',
						serverProcessing: false, selectionMode: 'singleRow',
						filterable: true, filterMode: 'default', filterHeight: 35
					});
				},
				/*widgetAfterInit: _e => {
					const {widgetPart} = _e;
					widgetPart.on('rowDoubleClick', evt =>
						this.baslatIstendi(e));
				},*/
				columns: [],
				loadServerData: _e => []
			});
			outputPart.basicRun();
			outputPart.layout
				.detach()
				.appendTo(outputParent);
			
			const btnCalistir = tabPage.find(`.islemTuslari-ek #calistir`);
			btnCalistir
				.jqxButton({ theme: theme })
				.on('click', evt =>
					this.sqlExec_calistirIstendi($.extend({}, e, { event: evt })));
		}

		async sqlExec_calistirIstendi(e) {
			const {app} = this;
			const args = this.args.sqlExec;
			const {tabPage, output, subOutput, sql} = args;
			let queries = args.query ? args.query.split('\nGO').map(x => x.replace('\r', '').trimEnd()) : [];
			queries = queries.map(query => { return { query: query } })
							.filter(x => !!x.query);
			
			const firstQuery = $.isEmptyObject(queries) ? null : queries[0].query;
			const lastQuery = $.isEmptyObject(queries) ? null : queries[queries.length - 1].query;
			let execTip = 'none';
			if (lastQuery) {
				const firstQueryUpper = firstQuery.toUpperCase();
				const lastQueryUpper = lastQuery.toUpperCase();
				if (!(
							(firstQueryUpper.includes('--NONE') || firstQueryUpper.includes('-- NONE') || firstQueryUpper.includes('--DIRECT') || firstQueryUpper.includes('-- DIRECT'))
								||
							(lastQueryUpper.includes('--NONE') || lastQueryUpper.includes('-- NONE') || lastQueryUpper.includes('--DIRECT') || lastQueryUpper.includes('-- DIRECT'))
				   )) {
					if (lastQueryUpper.includes('--SP') || lastQueryUpper.includes('-- SP'))
						execTip = 'sp';
					else if (lastQueryUpper.includes('SELECT ') || lastQueryUpper.includes('--DT') || lastQueryUpper.includes('-- DT'))
						execTip = 'dt';
				}
			}

			try {
				const recs = await app.wsSqlExec({ args: {
					sql: sql,
					execTip: execTip,
					queries: queries
				}});
				args.result = recs;

				subOutput.html(`${recs.length.toLocaleString()} kayıt geldi`);
				subOutput.removeClass('error')
				subOutput.addClass('success');
				hljs.highlightBlock(subOutput[0]);

				let columns = [];
				if (!$.isEmptyObject(recs) && $.isArray(recs)) {
					columns = Object.keys(recs[0]).map(dataField => {
						return { dataField: dataField, text: dataField, cellClassName: dataField }
					});
				}

				if (recs && !$.isEmptyObject(columns) && columns[0].dataField == 'rowsAffected') {
					const col_rowsAffected = columns.splice(0, 1)[0];
					$.extend(col_rowsAffected, {
						width: 100,
						columnType: 'number',
						cellsAlign: 'right'
					});
					columns.push(col_rowsAffected);
					for (const i in recs) {
						const rec = recs[i];
						let value = rec.query;
						if (typeof value == 'object')
							rec.query = value = value.query;
							
					}
				}
				
				$.extend(output, {
					columns: columns,
					loadServerData: _e =>
						recs
				});
				output.widgetPart.jqxDataTable('columns', columns);
				output.tazele();
			}
			catch (ex) {
				args.result = ex;
				let result = ex.responseJSON || ex.responseText || ex;
				if (result.errorText)
					result = result.errorText;
				
				subOutput.html(result);
				subOutput.removeClass('success')
				subOutput.addClass('error');
				hljs.highlightBlock(subOutput[0]);

				const columns = [];
				$.extend(output, {
					columns: columns,
					loadServerData: _e => []
				});
				output.widgetPart.jqxDataTable('columns', columns);
				output.tazele();
			}
		}

		async initTabContent_shell(e) {
			const args = this.args.shell = this.args.shell || {};
			const {tabPage} = e;
			args.tabPage = tabPage;

			const txtCmd = tabPage.find(`#shell_cmd`);
			if (window.ace) {
				const editor = ace.edit(
					txtCmd[0], {
						theme: 'ace/theme/monokai',
						mode: 'ace/mode/text',
						selectionStyle: 'text'
					}
				);
				editor.setOptions({
					autoScrollEditorIntoView: true,
					copyWithEmptySelection: true,
					mergeUndoDeltas: 'always'
				});
				editor.session.setValue(args.cmd || '');
				editor.on('change', e =>
					args.cmd = (editor.getValue() || '').trim());
			}
			else {
				txtCmd.val(args.cmd || '');
				txtCmd.on('change', evt =>
					args.cmd = (evt.target.value || '').trim());
			}
			
			const output = args.output = tabPage.find(`#shell_result`);
			output.html(args.output || '');
			hljs.highlightBlock(output[0]);
			
			const btnCalistir = tabPage.find(`.islemTuslari-ek #calistir`);
			btnCalistir
				.jqxButton({ theme: theme })
				.on('click', evt =>
					this.shell_calistirIstendi($.extend({}, e, { event: evt })));
		}

		async shell_calistirIstendi(e) {
			const {app} = this;
			const args = this.args.shell;
			const {tabPage, cmd, output, editor} = args;
			try {
				let result = await app.wsShell({ args: {
					cmd: cmd.split('\n').map(x => x.replaceAll('\r', '')).join(' ')
				}});
				if (result.isError && !$.isArray(result.result))
					throw { isError: true, rc: 'shellError', errorText: result.result };
				result = result.result;
				args.result = result;
				/*if ($.isArray(result))
					result = result.join('\r\n<br/>');*/
				if ($.isArray(result))
					result = result.map(x => `<div>${x.replaceAll('\r', '')}</div>`).join('\n');
				output.html(typeof result == 'object' ? result : (result || '').toLocaleString());
				output.removeClass('error');
				output.addClass('success');
				hljs.highlightBlock(output[0]);
			}
			catch (ex) {
				args.result = ex;
				let result = ex.responseJSON || ex.responseText || ex;
				if (result.errorText)
					result = result.errorText;
				output.html(result);
				output.removeClass('success');
				output.addClass('error');
				hljs.highlightBlock(output[0]);
			}
		}

		async initTabContent_cvmCall(e) {
			const args = this.args.cvmCall = this.args.cvmCall || {};
			const {tabPage} = e;
			args.tabPage = tabPage;

			const txtCmd = tabPage.find(`#cvmCall_cmd`);
			txtCmd.val(args.cmd || '');
			txtCmd.on('change', evt =>
				args.cmd = (evt.target.value || '').trim());

			const txtArgs = tabPage.find(`#cvmCall_args`);
			if (window.ace) {
				const editor = ace.edit(
					txtArgs[0], {
						theme: 'ace/theme/monokai',
						mode: 'ace/mode/text',
						selectionStyle: 'text'
					}
				);
				editor.setOptions({
					autoScrollEditorIntoView: true,
					copyWithEmptySelection: true,
					mergeUndoDeltas: 'always'
				});
				editor.session.setValue(args.args || '');
				editor.on('change', e =>
					args.args = (editor.getValue() || '').trim());
			}
			else {
				txtArgs.val(args.args || '');
				txtArgs.on('change', evt =>
					args.args = (evt.target.value || '').trim());
			}
			
			const output = args.output = tabPage.find(`#cvmCall_result`);
			output.html(args.output || '');
			hljs.highlightBlock(output[0]);
			
			const btnCalistir = tabPage.find(`.islemTuslari-ek #calistir`);
			btnCalistir
				.jqxButton({ theme: theme })
				.on('click', evt =>
					this.cvmCall_calistirIstendi($.extend({}, e, { event: evt })));
		}

		async cvmCall_calistirIstendi(e) {
			const {app} = this;
			const args = this.args.cvmCall;
			const {tabPage, cmd, output, editor} = args;
			const cmdArgs = args.args ? args.args.split('\n').map(x => x.replace('\r', '').trimEnd()) : [];
			
			try {
				let result = await app.wsCVMCall({ args: {
					cvmOutput: 'text',
					cmd: cmd,
					args: cmdArgs
				}});
				args.result = result;
				result = result.result;
				if (typeof result == 'string')
					result = result.replaceAll('\r', '').split('\n').map(x => `<div>${x}</div>`).join('\n');
				output.html(
					(typeof result == 'object' ? result : (result || '').toLocaleString()) +
					`<div style="margin-top: 100px;">{ "binaryResult": "${args.result.binaryResult}"</div>`
				);
				output.removeClass('error');
				output.addClass('success');
				hljs.highlightBlock(output[0]);
			}
			catch (ex) {
				args.result = ex;
				let result = ex.responseJSON || ex.responseText || ex;
				if (result.errorText)
					result = result.errorText;
				output.html(result);
				output.removeClass('success');
				output.addClass('error');
				hljs.highlightBlock(output[0]);
			}
		}

		async initTabContent_webRequest(e) {
			const args = this.args.webRequest = this.args.webRequest || {};
			const {tabPage} = e;
			args.tabPage = tabPage;

			const txtUrl = tabPage.find(`#webRequest_url`);
			txtUrl.val(args.url || '');
			txtUrl.on('change', evt =>
				args.url = (evt.target.value || '').trim());

			const output = args.output = tabPage.find(`#webRequest_result`);
			output.html(args.output || '');
			hljs.highlightBlock(output[0]);
			
			const btnCalistir = tabPage.find(`.islemTuslari-ek #calistir`);
			btnCalistir
				.jqxButton({ theme: theme })
				.on('click', evt =>
					this.webRequest_calistirIstendi($.extend({}, e, { event: evt })));
		}

		async webRequest_calistirIstendi(e) {
			const {app} = this;
			const args = this.args.webRequest;
			const {tabPage, url, output} = args;
			
			try {
				let result = await app.wsWebRequest({ args: {
					method: 'GET',
					url: url
				}});
				args.result = result;
				result = ((result || {}).data || {}).string;
				if (result.includes('<?xml'))
					result = `<textarea style="width: 100%; height: ${tabPage.height() - 410}px">${result}</textarea>`;
				/*if (typeof result == 'string')
					result = result.replaceAll('\r', '').split('\n').map(x => `<div>${x}</div>`).join('\n');*/
				output.children().remove();
				try {
					let resultHTML = result;
					if (resultHTML && typeof resultHTML == 'string') {
						resultHTML = resultHTML.trim();
						if (!(resultHTML[0] == '[' || resultHTML[0] == '{'))
							resultHTML = `<pre>${resultHTML}</pre>`;
					}
						
					output.html(`<div id="webRequest_subContent">${resultHTML}</div>`);
					try { hljs.highlightBlock(output.find('#webRequest_subContent')[0]) }
					catch (ex) { }
				}
				catch (ex) {
					const subContent = $(`<pre id="webRequest_subContent"></pre>`);
					subContent.width(tabPage.width());
					subContent.height(tabPage.height() - output.offset().y);
					subContent.text(result);
					subContent.appendTo(output);
					hljs.highlightBlock(output[0]);
				}
				/*const iframe = $(`<iframe src="empty.html"></iframe>`);
				iframe.width(tabPage.width());
				iframe.height(tabPage.width());
				setTimeout(() => {
					iframe.html(result);
					output.children().remove();
					output.html('');
					iframe.appendTo(output);
					output.removeClass('error');
					output.addClass('success');
					hljs.highlightBlock(output[0]);
				}, 200);*/
			}
			catch (ex) {
				args.result = ex;
				let result = ex.responseJSON || ex.responseText || ex;
				if (result.errorText)
					result = result.errorText;
				output.children().remove();
				output.html(result);
				output.removeClass('success');
				output.addClass('error');
				// hljs.highlightBlock(output[0]);
			}
		}

		async initTabContent_download(e) {
			const {app} = this;
			const args = this.args.download = this.args.download || {};
			const {tabPage} = e;
			args.tabPage = tabPage;
			
			const subArgs = args.subArgs = args.subArgs || {};
			const subArgs_remote = subArgs.remote = subArgs.remote || {};

			const localRemoteFileParent = tabPage.find(`#localRemoteFileParent`);
			const txtRemoteFile = localRemoteFileParent.find(`#remoteFileParent #remoteFile`);
			txtRemoteFile.val(subArgs.remoteFile);
			txtRemoteFile.on('change', evt => {
				const {value} = evt.target;
				subArgs_remote.file = (value || '').trim();
			});
			
			const btnCalistir = tabPage.find(`.islemTuslari-ek #calistir`);
			btnCalistir
				.jqxButton({ theme: theme })
				.on('click', evt =>
					this.downloadIstendi($.extend({}, e, { event: evt })));

			const output = args.output = tabPage.find(`#output_parent #output`);
			output.html(args.output || '');
			// hljs.highlightBlock(output[0]);
		}

		async downloadIstendi(e) {
			const {app} = this;
			const args = this.args.download;
			
			const {tabPage, subArgs} = args;
			// await app.knobProgressShow({ update: { label: `Dosya indiriliyor...` } });
			const url = app.wsDownloadURL({
				stream: true,
				localFile: (subArgs.remote || {}).file || '',
				remoteFile: (subArgs.remote || {}).file || ''
				// args: (subArgs.local || {}).data
			});
			openNewWindow(url);
			
			/*try {
				const result = await app.wsDownload({
					stream: false,
					localFile: (subArgs.remote || {}).file || '',
					remoteFile: (subArgs.remote || {}).file || ''
					// args: (subArgs.local || {}).data
				});
				args.result = result;
				if (result) {
					const subOutput = args.output;
					if (subOutput && subOutput.length) {
						subOutput.html(result);
						subOutput.removeClass('error success');
						subOutput.addClass(result.isError ? 'error' : 'success');
						// hljs.highlightBlock(subOutput[0]);
					}
				}
				
				await app.knobProgressHideWithReset({ delayMS: 5000, update: { label: `Dosya İndirme İşlemi tamamlandı` } });
				setTimeout(() => app.knobProgressSuccess({ update: { showLoading: false } }), 1000);
				return result;
			}
			catch (ex) {
				args.result = ex;
				await app.knobProgressHide();
				defFailBlock(ex);
				throw ex;
			}*/
		}

		async initTabContent_upload(e) {
			const {app} = this;
			const args = this.args.upload = this.args.upload || {};
			const {tabPage} = e;
			args.tabPage = tabPage;
			
			const subArgs = args.subArgs = args.subArgs || {};
			const subArgs_local = subArgs.local = subArgs.local || {};
			const subArgs_remote = subArgs.remote = subArgs.remote || {};
			
			const localRemoteFileParent = tabPage.find(`#localRemoteFileParent`);
			const txtLocalFile = localRemoteFileParent.find(`#localFileParent #localFile`);
			txtLocalFile.val(subArgs_local.file);
			txtLocalFile.on('change', evt => {
				const {value} = evt.target;
				subArgs_local.file = (value || '').trim();
				delete subArgs_local.data;
				delete subArgs_local.contentType;

				/*const files = txtLocalFile.prop('files');
				subArgs_local.data = files[0];*/
				
				const fr = new FileReader();
				fr.onload = evt => {
					subArgs_local.data = evt.target.result;
				};
				fr.onerror = evt => {
					displayServerResponse(evt);
				};
				const files = txtLocalFile.prop('files');
				fr.readAsArrayBuffer(files[0]);
			});
			const txtRemoteFile = localRemoteFileParent.find(`#remoteFileParent #remoteFile`);
			txtRemoteFile.val(subArgs.remoteFile);
			txtRemoteFile.on('change', evt => {
				const {value} = evt.target;
				subArgs_remote.file = (value || '').trim();
			});
			
			const btnCalistir = tabPage.find(`.islemTuslari-ek #calistir`);
			btnCalistir
				.jqxButton({ theme: theme })
				.on('click', evt =>
					this.uploadIstendi($.extend({}, e, { event: evt })));
		}

		async uploadIstendi(e) {
			const {app} = this;
			const args = this.args.upload;
			
			const {tabPage, subArgs} = args;
			await app.knobProgressShow({ update: { label: `Dosya Sunucuya Gönderiliyor...` } });
			try {
				const result = await app.wsUpload({
					localFile: (subArgs.local || {}).file || '',
					remoteFile: (subArgs.remote || {}).file || '',
					args: (subArgs.local || {}).data
				});
				args.result = result;
				if (result.output) {
					const subOutput = tabPage.find(`#output_parent #output`);
					subOutput.html(result.output.replaceAll('\r\n', '<br/>\r\n'));
					subOutput.removeClass('error success');
					subOutput.addClass(result.isError ? 'error' : 'success');
					hljs.highlightBlock(subOutput[0]);
				}
				
				await app.knobProgressHideWithReset({ delayMS: 5000, update: { label: `Dosya Gönderme İşlemi tamamlandı` } });
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
		
		async tazele(e) {
			const {app} = this;
			const promise_wsConfigOku = app.wsConfigOku();
			const promise_wsReadVioConfig = app.wsReadVioConfigRecs();
			
			await super.tazele();

			promise_wsReadVioConfig
				.then(result => this.wsReadVioConfig_onResponse($.extend({}, e, { isError: result.isError || false, result: result })))
				.catch(result => this.wsReadVioConfig_onResponse($.extend({}, e, { isError: true, result: result })));
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

		async vioConfigKaydet(e) {
			const {app, _vioConfig} = this;
			if (_vioConfig) {
				try { return await app.wsWriteVioConfigRecs({ config: _vioConfig }) }
				catch (ex) { defFailBlock(ex) }
			}
			return null;
		}

		async wsReadVioConfig_onResponse(e) {
			const {isError, result} = e;
			if (isError) {
				const error = (result || {}).responseJSON || result;
				if ((error.rc || error.code) != 'accessDenied' && (result || {}).statusText != 'abort')
					defFailBlock(result);
				return;
			}

			const vioConfig = this.vioConfig = result;
			let {listePart} = (this.args || {}).vioGlobalIni || {};
			if (listePart && listePart.widget && this.panel.find(`ul > li.jqx-fill-state-pressed`).prop('id') == 'vioGlobalIni')
				listePart.tazele();
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
				this.teknikAyarlar_editor_initEditor(e);
				this.teknikAyarlar_json_initEditor(e);
				await this.onResize();
			}, 500);

			let {listePart} = (this.args || {}).log || {};
			if (listePart && listePart.widget && this.panel.find(`ul > li.jqx-fill-state-pressed`).prop('id') == 'log')
				listePart.tazele();
		}

		teknikAyarlar_json_initEditor(e) {
			const tabPage = this.panel.find(`.jqx-tabs-content > #teknikAyarlar_json.jqx-tabs-content-element`);
			const config_parent = tabPage.find(`#teknikAyarlar_json_config_parent`);
			const divConfig = config_parent.find(`#teknikAyarlar_json_config`);
			
			let {jsonAceEditor, rootConfig} = this;
			if (jsonAceEditor) {
				jsonAceEditor.destroy();
				jsonAceEditor = this.jsonAceEditor = null;
			}
			if (window.ace) {
				jsonAceEditor = this.jsonAceEditor = ace.edit(
					divConfig[0], {
						theme: 'ace/theme/monokai',
						mode: 'ace/mode/json',
						selectionStyle: 'text'
					}
				);
				jsonAceEditor.setOptions({
					autoScrollEditorIntoView: true,
					copyWithEmptySelection: true,
					mergeUndoDeltas: 'always'
				});
				jsonAceEditor.session.setValue(JSON.stringify(rootConfig || {}, null, '\t'));
				jsonAceEditor.on('blur', e => {
					try {
						let value = (jsonAceEditor.getValue() || '').trim();
						value = value ? JSON.parse(value) : null;
						if (value) {
							rootConfig = this.rootConfig = value;
							try {
								this.teknikAyarlar_editor_initEditor(e); 
								setTimeout(() => this.onResize(), 100);
							}
							catch (ex) { }
						}
					}
					catch (ex) {
						console.error(ex);
					}
				});
			}
		}

		teknikAyarlar_editor_initEditor(e) {
			const {isError, result} = e;
			const {rootConfig, jsonEditorPart} = this;
			if (isError || !rootConfig || !jsonEditorPart)
				return;

			jsonEditorPart.off('change');
			jsonEditorPart.setValue(rootConfig);
			jsonEditorPart.on('change', evt => {
				const _e = $.extend({}, e, { event: evt, errors: null, value: jsonEditorPart.getValue() });
				const errors = jsonEditorPart.validate();
				if (!$.isEmptyObject(errors))
					_e.errors = errors;
				this.configDegisti(_e);
			});
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
			this.teknikAyarlar_json_initEditor(e);
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

			const {panel, args} = this;
			const tabPages_teknikAyarlar = panel.find(
				`.jqx-tabs-content > .teknikAyarlar.jqx-tabs-content-element`
			);
			const configEditors = tabPages_teknikAyarlar && tabPages_teknikAyarlar.length ? tabPages_teknikAyarlar.find(`.config`) : null;
			if (configEditors && configEditors.length) {
				let height = tabPages_teknikAyarlar.eq(0).height() - (configEditors.eq(0).position().top + 80);
				configEditors.height(height);
				try { configEditors.resize() }
				catch (ex) { }
			}

			//panel.find(`.jqx-tabs-content .jqx-tabs-content-element:not(#sqlExec) .editor`).height(300);
			//panel.find(`.jqx-tabs-content #sqlExec.jqx-tabs-content-element .editor`).height(300);

			if (args) {
				for (const key in args) {
					const subArgs = args[key];
					const {editor} = subArgs;
					if (editor)
						editor.resize();
				}
			}

			let subArgs = (args || {}).log || {};
			if (subArgs != null) {
				let {listePart} = subArgs;
				if (listePart && listePart.widget /*&& this.panel.find(`ul > li.jqx-fill-state-pressed`).prop('id') == 'log'*/) {
					const tabPage = subArgs.tabPage;
					const divListe = listePart.widgetPart;
					let height = tabPage.height() - (divListe.position().top - 23);
					divListe.jqxDataTable('height', height);
				}
			}

			subArgs = (args || {}).vioGlobalIni;
			if (subArgs != null) {
				let {listePart} = subArgs;
				if (listePart && listePart.widget /*&& this.panel.find(`ul > li.jqx-fill-state-pressed`).prop('id') == 'log'*/) {
					const tabPage = subArgs.tabPage;
					const divListe = listePart.widgetPart;
					let height = tabPage.height() - (divListe.position().top - 23);
					divListe.jqxDataTable('height', height);
				}
			}

			/*panel.find(`.jqx-tabs-content #sqlExec.jqx-tabs-content-element .sqlExec_result_parent #sqlExec_result`).widgetPart
				.jqxDataTable('height', (panel.height() - 600));*/
		}
	}
})()
