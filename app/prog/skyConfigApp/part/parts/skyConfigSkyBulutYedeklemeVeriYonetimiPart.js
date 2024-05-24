(function() {
	window.SkyConfigSkyBulutYedeklemeVeriYonetimiPart = class extends window.SkyConfigWindowPart {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				baslikText: e.baslikText
			});
		}

		static get partName() { return 'skyConfigSkyBulutYedeklemeVeriYonetimiPart' }
		get defaultTitle() { return 'Sky Bulut Yedekleme - Veri Yönetimi' }
		get defaultIsModal() { return true }
		get autoFocus_uiSelector() { return `#liste` }
		
		get wsLoginTipi() { return 'skyBulutYedekLogin' }
		get wsConfigParentSelector() { return 'skyBulutYedekleme' }
		
		get rootConfig() {
			return this._rootConfig = this._rootConfig || {};
		}
		set rootConfig(value) {
			this._rootConfig = value;
		}

		get backupServerURLBase() {
			let result = this.wsConfig_parent.backupServer || this.rootConfig.vioCloudServer;
			if (result == '.')
				result = 'localhost';
			if (!result)
				result = 'cloud.vioyazilim.com.tr';
			if (!result.startsWith('http')) {
				const protocol = result.includes(':8200') ? 'http' : 'https';
				if (!result.includes(':'))
					result += `:${protocol == 'https' ? 9200 : 8200}`;
				result = `${protocol}://${result}`;
				result += `/ws/${this.wsConfigParentSelector}/`;
			}
			
			return result;
		}
		
		getBackupServerURL(e) {
			const {wsConfig_parent, backupServerURLBase} = this;
			const {api} = e;
			
			let result = backupServerURLBase;
			if (api)
				result += `${api}/`;

			let passMD5 = wsConfig_parent.userPass || '';
			if (passMD5 && passMD5.length != 32)
				passMD5 = md5(wsConfig_parent.userPass) || '';
			const args = $.extend({}, ajaxWSDefOptsWithIO, {
				loginTipi: this.wsLoginTipi,
				/*user: wsConfig_parent.userID || '', 
				pass: passMD5*/
			}, e.args || {});
			delete args.sessionMatch;
			result += `?${$.param(args)}`;

			return result;
		}
		
		
		async tazeleDevam(e) {
			await super.tazeleDevam(e);

			const {app, wndContent} = this;

			try {
				const result = await app.wsConfigOku({ wsURLBase: wsURLBase });
				this.wsConfigOku_onResponse($.extend({}, e, { isError: result.isError || false, result: result }));
			}
			catch (ex) {
				this.wsConfigOku_onResponse($.extend({}, e, { isError: true, result: ex }));
			}
			
			const islemTuslari = this.islemTuslari = wndContent.find('.islemTuslari');
			const btnDownloadToLocal = islemTuslari.find('#downloadToLocal');
			btnDownloadToLocal.jqxButton({ theme: theme });
			btnDownloadToLocal.on('click', evt =>
				this.downloadToLocalIstendi($.extend({}, e, { event: evt })));
			
			const btnDownloadToServer = islemTuslari.find('#downloadToServer');
			btnDownloadToServer.jqxButton({ theme: theme });
			btnDownloadToServer.on('click', evt =>
				this.downloadToServerIstendi($.extend({}, e, { event: evt })));

			const btnTazele = islemTuslari.find('#tazele');
			btnTazele.jqxButton({ theme: theme, template: 'success' });
			btnTazele.on('click', evt =>
				this.gridTazele($.extend({}, e, { event: evt })));

			setTimeout(() => this.initGrid(e), 10);
		}

		wsConfigOku_onResponse(e) {
			const {isError, result} = e;
			if (isError) {
				const error = (result || {}).responseJSON || result;
				// if ((error.rc || error.code) != 'accessDenied' && (result || {}).statusText != 'abort')
				// 	defFailBlock(result);
				defFailBlock(result);
				throw result;
			}

			const rootConfig = this.rootConfig = result.rootConfig;
			const wsConfig = this.wsConfig = rootConfig.wsConfig = rootConfig.wsConfig || {};
			const {wsConfigParentSelector} = this;
			const wsConfig_parent = this.wsConfig_parent = wsConfig[wsConfigParentSelector] = wsConfig[wsConfigParentSelector] || {};
		}

		initGrid(e) {
			const {wndContent} = this;
			const gridParent = this.gridParent = wndContent.find('#liste_parent');
			const grid = this.grid = gridParent.find('#liste');
			const args = {
				theme: theme, localization: localizationObj, width: '100%', height: '100%',
				autoHeight: false, autoRowHeight: false, rowsHeight: 36, altRows: true, enableTooltips: true,
				editable: false, columnsResize: true, columnsReorder: true, columnsMenu: false,
				sortable: true, sortMode: 'many',
				groupable: true, showGroupsHeader: true, filterable: true, filterMode: 'default',
				showFilterRow: true, filterRowHeight: 40,
				groupIndentWidth: 35, groupsHeaderHeight: 25, groupsExpandedByDefault: true,
				selectionMode: 'checkbox', pageable: false, pagermode: 'advanced',
				adaptive: false, virtualMode: false, updatedelay: 50, scrollbarsize: 20,
				renderGridRows: e =>
					e.data.slice(e.startindex, e.startindex + e.endindex),
				groupsRenderer: (text, group, expanded, rowInfo) => {
					if ((rowInfo.groupcolumn || {}).datafield == 'backupDate') {
						if (group && $.type(group) == 'date') {
							if (!group.getTime())
								group = null;
						}
						group = group
									? `<span class="royalblue _veri">${dateToString(group)}</span>`
									: `<span class="lightgray _veri">-Belirsiz-</span>`;
						group = `<span class="_etiket">Yedekleme Tarihi:</span> ${group}`;
					}
					return `<div class="grid-cell-group">${group}</div>`
				},
				columns: [
					{
						dataField: '_rowNumber', text: '#', width: 40,
						cellClassName: '_rowNumber grid-readOnly gray',
						cellsAlign: 'right', columnType: 'numberinput',
						groupable: false, draggable: false, filterable: false,
						cellsRenderer: (rowIndex, columnField, value, html, jqxCol, rec) =>
							changeTagContent(html, (asInteger(rowIndex) + 1).toLocaleString())
					},
					{
						dataField: 'name', text: 'Dosya', cellClassName: 'name bold', minWidth: 200,
						/*cellsRenderer: (rowIndex, columnField, value, html, jqxCol, rec) => {
							return html
						}*/
					},
					{
						dataField: 'mimeType', text: 'Tür', width: 100,
						cellClassName: 'mimeType', filterType: 'checkedlist',
						cellsRenderer: (rowIndex, columnField, value, html, jqxCol, rec) => {
							if (value == 'application/viobackup-compressed' || value == 'application/viobackup' || value == 'application/sqlserver')
								html = changeTagContent(html, 'Vio Yedek');
							return html
						}
					},
					{
						dataField: 'size', text: 'Boyut', width: 80,
						cellClassName: 'size', columnType: 'number',
						cellsRenderer: (rowIndex, columnField, value, html, jqxCol, rec) => {
							const fra = 2;
							value = rec.size;
							if (typeof value != 'number')
								value = asFloat(value);
							value = roundToFra(value / (1024 * 1024), fra);
							return changeTagContent(html, `${toStringWithFra(value, fra)} MB`)
						}
					},
					{
						dataField: 'lastWriteTime', text: 'Son Değiştirme', width: 130,
						cellClassName: 'lastWriteTime', columnType: 'date', filterType: 'range',
						cellsRenderer: (rowIndex, columnField, value, html, jqxCol, rec) => {
							if (value && typeof value == 'object') {
								value = dateTimeToString(value);
								html = changeTagContent(html, value);
							}
							return html
						}
					},
					{
						dataField: 'backupDate', text: 'Yedekleme Tarihi', width: 100,
						cellClassName: 'backupDate', columnType: 'date', filterType: 'range',
						cellsRenderer: (rowIndex, columnField, value, html, jqxCol, rec) => {
							if (value && typeof value == 'object') {
								value = dateToString(value);
								html = changeTagContent(html, value);
							}
							return html
						}
					},
					{
						dataField: 'directory', text: 'Klasör',
						cellClassName: 'directory', filterType: 'checkedlist'
					}
				],
				source: new $.jqx.dataAdapter(
					{
						cache: false, async: true,
						dataType: defaultOutput,
						url: `empty.php`
					}, {
						cache: false, async: true,
						loadServerData: async (wsArgs, source, callback) => {
							try {
								let result = await this.loadServerData({ wsArgs: wsArgs, source: source, callback: callback });
								if (result) {
									if ($.isArray(result))
										result = { totalrecords: result.length, records: result };
									
									if (typeof result == 'object') {
										if (result.records && !result.totalrecords)
											result.totalrecords = result.records.length;
										for (const rec of result.records) {
											rec.size = rec.length;
											delete rec.length;
											if (rec.lastWriteTime)
												rec.lastWriteTime = asDate(rec.lastWriteTime);
											if (rec.backupDate)
												rec.backupDate = asDate(rec.backupDate);
										}
										callback(result);
									}
								}
							}
							catch (ex) {
								defFailBlock(ex);
								throw ex;
							}
						}
					})
			};
			if (args.scrollMode == 'deferred' && $.isEmptyObject(args.deferredDataFields))
				args.deferredDataFields = [firstCol.dataField];
			
			const initGridHeight = this.initGridHeight = args.height;
			if (!initGridHeight)
				args.height = 1;
			
			grid.jqxGrid(args);
			
			const gridWidget = this.gridWidget = grid.jqxGrid('getInstance');
			this.orjSelectionMode = gridWidget.selectionmode;
			setTimeout(() => {
				this.onResize();
				this.wnd_onResize();
			}, 10);
			this.gridInitFlag = true;
			
			grid.on('bindingcomplete', evt => {
				setTimeout(() =>
					this.gridVeriYuklendi($.extend({}, e, { sender: this, event: evt, grid: grid, gridWidget: gridWidget, source: gridWidget.source })),
					10);
			});
		}

		async loadServerData(e) {
			let rec = await sky.app.wsReadVioConfigBasit({ tanitim: true }) || {};
			const {tanitim} = rec;
			if (!tanitim)
				throw { isError: true, rc: 'tanitimBelirlenemedi', errorText: 'Tanıtım belirlenemedi' }
			
			const url = this.getBackupServerURL({ api: 'uzakDosyaListesi', args: { user: tanitim, pass: '' } });
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST',
				dataType: defaultOutput, url: url
			})
			
			let recs = await lastAjaxObj;
			const minDate = new Date(0);
			if ($.isArray(recs)) {
				for (const rec of recs) {
					rec.backupDate = asDate(rec.backupDate) || minDate;
					rec.lastWriteTime = asDate(rec.lastWriteTime) || minDate;
				}
			}
			
			return recs;
			
			
			/* return [
				{ file: 'A.BW', directory: 'c/db/backup', type: 'Vio Yedek', lastWriteTime: '29.12.2022 20:28:30' },
				{ file: 'B.BW', directory: 'c/db/backup', type: 'Vio Yedek', lastWriteTime: '29.12.2022 20:28:40' },
				{ file: 'D.BW', directory: 'c/db/backup', type: 'Vio Yedek', lastWriteTime: '29.12.2022 20:28:40' },
				{ file: 'E.BW', directory: 'c/db/backup', type: 'Vio Yedek', lastWriteTime: '29.12.2022 20:29:00' },
				{ file: '123.XML', directory: 'c/VioData/EFatura/IMZALI', type: 'Diğer', lastWriteTime: '28.12.2022 11:30:25' },
				{ file: '456.XML', directory: 'c/VioData/EFatura/IMZALI', type: 'Diğer', lastWriteTime: '28.12.2022 11:30:28' }
			];*/
		}

		gridVeriYuklendi(e) {
			const {grid} = this;
			if (grid && grid.length) {
				grid.jqxGrid({ groups: ['backupDate'] });
				setTimeout(() => {
					try { grid.jqxGrid('sortBy', 'backupDate', 'desc') } catch (ex) { console.error(ex) }
					try { grid.jqxGrid('sortBy', 'lastWriteTime', 'desc') } catch (ex) { console.error(ex) }
				}, 1);
			}
		}

		close_araIslemler(e) {
			/*const {grid} = this;
			try {
				if (grid && grid.length)
					grid.jqxGrid('destroy');
			}
			catch (ex) { }
			this.grid = this.gridWidget = null;*/
			
			super.close_araIslemler(e);
		}

		setValues(e) {
			super.setValues(e);

			$.extend(this, {
				baslikText: e.baslikText == null ? this.baslikText : e.baslikText
			});
		}

		wndArgsDuzenle(e) {
			super.wndArgsDuzenle(e);

			const minWidth = 800;
			const minHeight = 650;
			$.extend(e.args, {
				width: Math.max(Math.min(1200, $(window).width() - 50), minWidth),
				height: Math.max(Math.min(900, $(window).height() - 50), minHeight),
				minWidth: minWidth, minHeight: minHeight
			});
		}

		async downloadToLocalIstendi(e) {
			const {gridWidget} = this;
			const recs = gridWidget.getselectedrowindexes().map(ind => gridWidget.getrowdata(ind))
							.filter(rec => !!rec);
			if ($.isEmptyObject(recs)) {
				displayMessage('İndirilecek Dosyalar seçilmelidir!');
				return;
			}

			let _rec = await sky.app.wsReadVioConfigBasit({ tanitim: true }) || {};
			const {tanitim} = _rec;
			if (!tanitim)
				throw { isError: true, rc: 'tanitimBelirlenemedi', errorText: 'Tanıtım belirlenemedi' }

			const {wsConfig_parent, wsLoginTipi} = this;
			for (let i = 0; i < recs.length; i++) {
				const rec = recs[i];
				if (!rec)
					continue;
				
				const {fullName, name, mimeType} = rec;
				const url = this.getBackupServerURL({
					api: 'uzakDosyaIndir',
					args: { files: fullName, user: tanitim, pass: '' }
				});
				setTimeout((url, name, mimeType) =>
					downloadFile(url, name, mimeType),
					(i * 500),
					url, name, mimeType
				)
			}
		}

		async downloadToServerIstendi(e) {
			const {gridWidget, app} = this;
			const recs = gridWidget.getselectedrowindexes().map(ind => gridWidget.getrowdata(ind))
							.filter(rec => !!rec);
			if ($.isEmptyObject(recs)) {
				displayMessage('İndirilecek Dosyalar seçilmelidir!');
				return;
			}

			const {wsConfig_parent, wsLoginTipi} = this;
			for (let i = 0; i < recs.length; i++) {
				const rec = recs[i];
				if (!rec)
					continue;
				
				const {fullName, name, mimeType} = rec;
				let passMD5 = wsConfig_parent.userPass || '';
				if (passMD5 && passMD5.length != 32)
					passMD5 = md5(wsConfig_parent.userPass) || '';
				const args = {
					/*loginTipi: wsLoginTipi,
					user: wsConfig_parent.userID || '',
					pass: passMD5,*/
					file: fullName
				};

				await showProgress(`Yerel sunucuya indiriliyor: [${name}]...`);
				try {
					await app.wsUzakDosyaIndirToLocalServer(args);
					setTimeout(() => app.knobProgressHideWithReset({ delayMS: 10000, update: { labelTemplate: 'success', label: `Dosya indirildi: [${name}]` } }), 100)
				}
				catch (ex) {
					defFailBlock(ex);
					throw ex
				}
			}
		}

		gridTazele(e) {
			const {gridWidget} = this;
			if (gridWidget)
				gridWidget.updatebounddata();
		}

		async wnd_onResize(e) {
			await super.wnd_onResize(e);

			if (this.isDestroyed)
				return;
			
			const {wnd, grid} = this;
			if (wnd && wnd.length && grid && grid.length) {
				grid.jqxGrid({
					width: (wnd.width() - 20),
					height: (wnd.height() - 135)
				});
			}
		}
	}
})()
