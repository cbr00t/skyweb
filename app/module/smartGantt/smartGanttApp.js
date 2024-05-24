(function() {
	window.SmartGanttApp = class extends window.Module {
		constructor(e) {
			super(e);

			$.extend(this, {
				_wsURLBase: updateWSUrlBaseBasit($.extend({}, sky.config, { path: 'ws/kapasitePlani' })),
				uniqueID: newGUID(),
				ganttInfo: {},
				ganttDegistimi: false,
				loadStateFlag: asBool(qs.loadState),
				gosterim: qs.gosterim,
				optionsSource: qs.optionsSource
			});

			$.extend(this.extensions.login.options, {
				isLoginRequired: true
			});
		}

		static get appName() { return 'smartGantt' }
		static get dateLibDesteklenirmi() { return false }
		static get smartElementsDesteklenirmi() { return true }
		get defaultLayoutName() { return this.appName }
		get appText() { return 'Sky Smart Gantt' }


		setUpTimers(e) {
			super.setUpTimers(e);

			const timers = this.timers;
			/*timers.ganttRefresh = {
				enabled: !this.loadStateFlag, interval: true, delay: 10000,
				block: e => this.ganttRefresh($.extend({}, e)),
				refreshIfModified: true
			};
			timers.ganttLoadState = {
				interval: true, delay: 8000,
				block: e => this.gantt_onLoadStateRequested(),
				refreshIfModified: true
			};
			timers.ganttSaveState = {
				enabled: false, interval: true, delay: 3000,
				block: e => this.gantt_onSaveStateRequested($.extend({}, e)),
				refreshIfModified: true
			};*/
		}


		async preInit(e) {
			await super.preInit(e);
		}

		async run(e) {
			showProgress(null, null, 1);
			await super.run(e);
		}

		async preInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);
			
			const layout = e.layout || this.layout;
			const smartGantt = e.smartGantt = this.smartGantt = layout.find('smart-gantt-chart');
			smartGantt.height(window.innerHeight - 30);
		}

		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);
			
			const layout = e.layout || this.layout;
			const smartGantt = e.smartGantt || this.smartGantt;
			const _smartGantt = smartGantt[0];

			this.initUI(e);
			
			new Promise(async then => {
				_smartGantt.beginUpdate();
				try {
					if (this.loadStateFlag) {
						this.fetchGanttData(e);
						await this.initGanttOptions(e);

						let options = e.options = (await e.options) || {};
						options = e.options = options.result || options;

						let dataSource = options.dataSource;
						delete options.dataSource;
						await this.setUpGanttData(e);

						await this.gantt_onLoadStateRequested();
						if ($.isEmptyObject(_smartGantt.dataSource)) {
							options.dataSource = dataSource;
							await this.setUpGanttData(e);
						}
					}
					else {
						await this.ganttRefresh();
					}
				}
				finally {
					_smartGantt.endUpdate();
				}

				await this.initGanttEvents(e);
				hideProgress();
				then();
			});
		}

		initUI(e) {
			e = e || {};

			const layout = e.layout || this.layout;
			layout.find('#islemTuslari button').jqxButton({ theme: theme });
			layout.find('#islemTuslari #btnTamam').jqxButton({ template: 'primary' });

			layout.find('#btnRefresh').on('click', evt =>
				this.ganttRefreshIstendi(e));
			layout.find('#btnTamam').on('click', evt =>
				this.ganttTamamIstendi(e));
			
			const _smartGantt = (e.smartGantt || this.smartGantt)[0];
			const gorunumler = this.gorunumler = [
				{ kod: 'day', aciklama: 'Gün' },
				{ kod: 'week', aciklama: 'Hafta' },
				{ kod: 'month', aciklama: 'Ay' },
				{ kod: 'year', aciklama: 'Yıl' },
			];
			const gorunumValueList = this.gorunumValueList = gorunumler.map(x => x.kod);

			let elm = layout.find('#gorunum');
			const size = { width: '100%', height: 28 };
			this.gorunumDDList = elm.jqxDropDownList({
				valueMember: 'kod', displayMember: 'aciklama',
				source: gorunumler, selectedIndex: arrayIndexOf(gorunumValueList, _smartGantt.view),
				searchMode: 'containsignorecase', placeHolder: 'Seçiniz:', filterPlaceHolder: 'Bul:',
				checkboxes: false, filterable: false, theme: theme, animationType: animationType,
				dropDownHeight: 200, scrollBarSize: 25, autoDropDownHeight: false,
				width: size.width, height: size.height, itemHeight: size.height - 2
			});
			elm.on('select', e => {
				const item = e && e.args ? e.args.item : null;
				if (item)
					_smartGantt.view = item.value;
			});
		}

		async ganttTamam(e) {
			e = e || {};

			this.disableTimersFlag = true;
			try {
				await this.gantt_onSaveStateRequested($.extend({}, e));
				this.ganttDegistimi = false;
				setTimeout(() => displayMessage('Düzenlemeler merkeze işlendi', null), 3000);
				showProgress(null, null, 1000);
				try { await this.ganttRefresh($.extend({}, e)) }
				finally { hideProgress() }
			}
			catch (ex) {
				throw ex;
			}
			finally {
				this.disableTimersFlag = this.savedDisableTimersFlag;
			}
		}

		async ganttRefresh(e) {
			e = e || {};

			this.disableTimersFlag = true;
			try {
				if (!e.options)
					this.fetchGanttData(e);
				if (!await this.ganttCanRefresh(e))
					return;

				const _smartGantt = (e.smartGantt || this.smartGantt)[0];
				_smartGantt.beginUpdate();
				await this.initGanttOptions(e);
				await this.setUpGanttData(e);
				_smartGantt.endUpdate();

				// await this.gantt_onSaveStateRequested(e);
			}
			finally {
				this.disableTimersFlag = this.savedDisableTimersFlag;
			}
		}

		fetchGanttData(e) {
			e = e || {};
			e.options = this.wsCall_getGanttOptions(e);
		}

		async ganttCanRefresh(e) {
			e = e || {};
			if (!e.options)
				return false;
			
			if (!e.refreshIfModified)
				return true;
			
			const options = await e.options;
			const ganttLastOptions = this.ganttLastOptions;
			if (!ganttLastOptions || toJSONStr(ganttLastOptions) != toJSONStr(options))
				return true;

			return false;
		}
		
		async initGanttOptions(e) {
			e = e || {};
			
			const smartGantt = e.smartGantt || this.smartGantt;
			const _smartGantt = smartGantt[0];
			$.extend(_smartGantt, {
				timelineHeaderFormatFunction: (date, type, isHeaderDetailsContainer) => {
					if (type == 'year') {
						return date.getFullYear().toString();
					}

					if (type == 'month') {
						return date.toLocaleDateString(_smartGantt.locale, { month: _smartGantt.monthFormat });
					}

					if (type == 'week') {
						const startDayOfWeek = new Date(date);
						const endDateOfWeek = new Date(date);
						endDateOfWeek.setDate(date.getDate() + 6);

						return startDayOfWeek.toLocaleDateString(_smartGantt.locale, { day: 'numeric', month: _smartGantt.monthFormat }) +
								' - ' +
								endDateOfWeek.toLocaleDateString(_smartGantt.locale, { day: 'numeric', month: _smartGantt.monthFormat });
					}

					if (type == 'day') {
						return date.toLocaleDateString(_smartGantt.locale, { day: 'numeric', month: _smartGantt.monthFormat });
					}

					if (type == 'hour') {
						return date.toLocaleTimeString(_smartGantt.locale, { hour: '2-digit' });
					}
				},
				resourceTimelineFormatFunction: (taskIndexes, resourceIndex, cellDate) => {
					const taskNames = taskIndexes.map(ind => {
						const task = _smartGantt.tasks[ind];
						if (!task)
							return '';
						
						return (task.shortLabel || task.label.slice(0, 4)).toUpperCase()
					});

					const resource = _smartGantt.resources[resourceIndex];
					let text = `<span>${taskNames.join(', ')}</span>`;
					if (resource.maxCapacity && taskIndexes.length > resource.maxCapacity)
						text = `<div valign="middle" class="capacity-overflow">${text}</div>`;
					
					return text;
				}
			});

			lastAjaxObj = $.get({ url: `${this.appConfigRoot}ganttMessages.json`,
								  cache: true, async: true });
			lastAjaxObj.then(_result =>
				_smartGantt.messages = _result);

			lastAjaxObj = $.get({ url: `${this.appConfigRoot}ganttOptions.json`,
								  cache: true, async: false });
			const result = await lastAjaxObj;
			$.extend(_smartGantt, result);
		}

		initGanttEvents(e) {
			e = e || {};

			const smartGantt = e.smartGantt || this.smartGantt;
			smartGantt.on('click', evt => this.gantt_onClick(evt));
			smartGantt.on('opening', evt => this.gantt_onPopupWindowOpening(evt));
			smartGantt.on('open', evt => this.gantt_onPopupWindowOpened(evt));
			smartGantt.on('change', evt => this.gantt_onTaskSelect($.extend({}, e, { event: evt })));
			smartGantt.on('itemInsert', evt => this.gantt_onItemInsert(evt));
			smartGantt.on('itemUpdate', evt => this.gantt_onItemUpdate(evt));
			smartGantt.on('itemRemove', evt => this.gantt_onItemRemove(evt));

			smartGantt.on('dragStart', evt => this.gantt_onXStart(evt));
			smartGantt.on('resizeStart', evt => this.gantt_onXStart(evt));
			smartGantt.on('progressChangeStart', evt => this.gantt_onProgressChangeStart(evt));
			smartGantt.on('connectionStart', evt => this.gantt_onXStart(evt));

			smartGantt.on('dragEnd', evt => this.gantt_onDragEnd(evt));
			smartGantt.on('resizeEnd', evt => this.gantt_onResizeEnd(evt));
			smartGantt.on('progressChangeEnd', evt => this.gantt_onProgressChangeEnd(evt));
			smartGantt.on('connectionEnd', evt => this.gantt_onConnectionEnd(evt));
		}

		async setUpGanttData(e) {
			e = e || {};
			let options = e.options = (await e.options) || {};
			options = e.options = options.result || options;

			await this.modifyFinalGanttData(e);
			options = e.options;
			this.ganttLastOptions = $.extend(true, {}, options);
			
			const resources = e.resources = options.resources;
			delete options.resources;

			const _smartGantt = (e.smartGantt || this.smartGantt)[0];
			this.disableEventsFlag = true;
			try {
				$.extend(_smartGantt, options);
				await this.afterGanttInit(e);
			}
			finally {
				delete this.disableEventsFlag;
			}
			
			// _smartGantt.dataSource = dataSource;
			this.ganttDegistimi = false;
		}

		modifyFinalGanttData(e) {
			e = e || {};
			const smartGantt = (e.smartGantt || this.smartGantt);
			const _smartGantt = smartGantt[0];
			const options = e.options;
			(options.taskColumns || []).forEach(col => {
				switch (col.value) {
					case 'addTask':
						col.formatFunction = () =>
							'<span class="add-task-button">+</span>';
						break;
					case 'resources':
						col.formatFunction = (resIDList, taskIndex) => {
							const resources = _smartGantt.resources;
							const tasks = _smartGantt.tasks;
							const task = tasks[taskIndex];
							if (!task || task.disableResources)
								return '';
							
							let result = [];
							$.each(resIDList, (ind, resID) => {
								const resource = resources.find(res => res.id.toString() === resID.toString())
								if (resource)
									result.push(`<span class="gantt-chart-task-assignee ${resource.label.toLowerCase()}">${resource.label}</span>`);
							});
							if (!$.isEmptyObject(result))
								return result.join(',&nbsp;');
							
							return result.length ? result : '<span class="gantt-chart-task-assignee unassigned">Atanmadı</span>';
						};
						break;
					default:
						col.formatFunction = (value, taskIndex) => {
							if (value && value.constructor.name == 'Date') {
								return (
									`${(value.getDate() || 1).toString().padStart(2, '0')}/${(value.getMonth() || 1).toString().padStart(2, '0')}` +
									` ${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}`
								);
							}
							return (value || '').toLocaleString('tr');
						};
						break;
				}
			});
			(options.resourceColumns || []).forEach(col => {
				switch (col.value) {
					case 'progress':
						col.formatFunction = (value, taskIndex, type, resIndex) =>
							`%${value}`;
						break;
				}
			});

			const dataSource = options.dataSource;
			// const vioID2Task = e.vioID2Task = {};
			const vioID2Connection = e.vioID2Connection = {};
			Utils.arrayRecursiveDo({
				source: dataSource,
				items: e => e.item.tasks,
				action: e => {
					const task = e.item;
					const vioID = task.vioID;
					/*if (vioID)
						vioID2Task[vioID] = task;*/
					
					if (!$.isEmptyObject(task.connections)) {
						const newConnections = [];
						(task.connections || []).forEach(conn => {
							if (!conn.target && conn.targetVioID)
								vioID2Connection[vioID] = conn;
							else
								newConnections.push(conn);
						});
						task.connections = newConnections;
					}
				}
			})
		}

		afterGanttInit(e) {
			e = e || {};
			const _smartGantt = (e.smartGantt || this.smartGantt)[0];
			const resources = e.resources;
			if (!$.isEmptyObject(resources)) {
				$.each(resources, (ind, rec) => {
					_smartGantt.insertResource(-1, rec)
				});
			}

			// const vioID2Task = e.vioID2Task || {};
			const _tasks = _smartGantt.tasks;
			const vioID2TaskIndex = e.vioID2TaskIndex = this.vioID2TaskIndex = {};
			const taskIndex2VioID = e.taskIndex2VioID = this.taskIndex2VioID = {};
			_tasks.forEach((task, index) => {
				const vioID = task.vioID;
				if (vioID) {
					vioID2TaskIndex[vioID] = index;
					taskIndex2VioID[index] = vioID;
				}
			});

			const vioID2Connection = e.vioID2Connection || {};
			$.each(vioID2Connection, (vioID, conn) => {
				const sourceIndex = vioID2TaskIndex[vioID];
				const targetIndex = vioID2TaskIndex[conn.targetVioID];
				if (sourceIndex != null && targetIndex != null) {
					const _task = _tasks[sourceIndex];
					const connections = _task.connections = _task.connections || [];
					delete conn.targetVioID;
					conn.target = targetIndex;
					connections.push(conn);
					_smartGantt.updateTask(sourceIndex, _task);
					// _smartGantt.createConnection(sourceIndex, targetIndex, conn.type);
				}
			});

			const gosterim = this.gosterim;
			if (gosterim) {
				switch (this.gosterim.toLowerCase()) {
					case 'gun':
					case 'gunluk':
					case 'day':
					case 'days':
						_smartGantt.view = 'day';
						break;
					case 'hafta':
					case 'haftalik':
					case 'week':
					case 'weeks':
						_smartGantt.view = 'week';
						break;
					case 'ay':
					case 'aylik':
					case 'month':
					case 'months':
						_smartGantt.view = 'month';
						break;
					case 'yil':
					case 'yilik':
					case 'year':
					case 'years':
						_smartGantt.view = 'year';
						break;
				}
			}

			let elm = this.gorunumDDList;
			if (elm && elm.length)
				elm.jqxDropDownList('selectedIndex', arrayIndexOf(this.gorunumValueList, _smartGantt.view));
		}


		async ganttRefreshIstendi(e) {
			e = e || {};
			delete e.options;

			this.fetchGanttData(e);
			if (!this.ganttDegistimi) {
				showProgress();
				try { return await this.ganttRefresh(e) }
				finally { hideProgress() }
			}


			let wnd = createJQXWindow(
				'Son durum merkezden yüklensin mi?<p/><b>UYARI:</b> Bu işlem yaptığınız düzenlemeleri sıfırlar',
				'UYARI',
				{
					isModal: true, showCollapseButton: false,
					width: 600, height: 200
				},
				{
					EVET: async (dlgUI, btnUI) => {
						dlgUI.jqxWindow('close');
						
						showProgress();
						try { return await this.ganttRefresh(e) }
						finally { hideProgress() }
					},
					HAYIR: (dlgUI, btnUI) => {
						dlgUI.jqxWindow('close')
					}
				}
			);
			wnd.find('input[type=button]')
				.jqxButton({ theme: theme });
			let btnEvet = wnd.find('input[type=button][value="EVET"]')
								.jqxButton('template', 'primary');
			wnd.on('opened', evt => {
				wnd.jqxWindow('focus');
				btnEvet.jqxButton('focus');
			});


			/*let wnd = $(`<smart-dialog-window open modal label="UYARI" class="material" confirm-label="EVET" cancel-label="HAYIR">
				<div class="smart-dialog-content">Continue ?</div>
			</smart-dialog-window>
			`).appendTo('body');
			wnd.on('close', evt => { debugger });
			wnd.find('.smart-footer .smart-button').on('click', evt => wnd[0].close());
			*/
		}

		async ganttTamamIstendi(e) {
			e = e || {};
			let wnd = createJQXWindow(
				'Son durum merkeze gönderilsin mi?',
				null,
				{
					isModal: true, showCollapseButton: false,
					width: 400, height: 120
				},
				{
					EVET: async (dlgUI, btnUI) => {
						dlgUI.jqxWindow('close');
						
						showProgress();
						try { return await this.ganttTamam(e) }
						finally { hideProgress() }
					},
					HAYIR: (dlgUI, btnUI) => {
						dlgUI.jqxWindow('close')
					}
				}
			);
			wnd.find('input[type=button]')
				.jqxButton({ theme: theme });
			let btnEvet = wnd.find('input[type=button][value="EVET"]')
								.jqxButton('template', 'primary');
			wnd.on('opened', evt => {
				wnd.jqxWindow('focus');
				btnEvet.jqxButton('focus');
			});


			/*let wnd = $(`<smart-dialog-window open modal label="UYARI" class="material" confirm-label="EVET" cancel-label="HAYIR">
				<div class="smart-dialog-content">Continue ?</div>
			</smart-dialog-window>
			`).appendTo('body');
			wnd.on('close', evt => { debugger });
			wnd.find('.smart-footer .smart-button').on('click', evt => wnd[0].close());
			*/
		}

		gantt_onXStart(evt) {
			if (this.disableEventsFlag)
				return;
			
			this.disableTimersFlag = true;
			const _smartGantt = (evt || {}).target || this.smartGantt[0];
			$.extend(this.ganttInfo, {
				lastEvent: evt,
				selectedIndexes: _smartGantt.selectedIndexes,
				selectedIndex: (_smartGantt.selectedIndexes || [])[0]
			});
			//evt.preventDefault();
			console.info(evt);
		}

		gantt_onProgressChangeStart(evt) {
			if (this.disableEventsFlag)
				return;
			
			/*const e = (evt || {}).detail;
			if (e) {
				let oldValue = e.progress;
				const newValue = e.progress = asFloat(evt.detail.progress.toFixed(1));
				if (oldValue != newValue) {
					evt.target.updateTask(e.index, { progress: newValue })
				}
			}*/
			
			this.gantt_onXStart(evt);
		}

		async gantt_onXEnd(evt) {
			evt = evt || {};
			let e = evt.detail || {};

			// const ganttInfo = this.ganttInfo;
			// delete ganttInfo.lastEvent;
			// const _smartGantt = evt.target || (e.smartGantt || this.smartGantt)[0];
			// 

			try {
				// await this.gantt_onSaveStateRequested($.extend({}, e, { event: evt }));
				this.ganttDegistimi = true;
			}
			catch (ex) {
				throw ex;
			}
			finally {
				this.disableTimersFlag = this.savedDisableTimersFlag;
			}
		}

		
		gantt_onPopupWindowOpening(evt) {
			if (this.disableEventsFlag)
				return;
			
			/*const _smartGantt = evt ? evt.target : this.smartGantt;
			if (_smartGantt.disableTaskRemove && evt.type == 'confirm')
				evt.preventDefault();*/
		}

		gantt_onPopupWindowOpened(evt) {
			if (this.disableEventsFlag)
				return;
			
			const _smartGantt = evt ? evt.target : this.smartGantt;
			let wnd = (_smartGantt.$taskPopupWindow || {}).element;
			wnd = wnd ? $(wnd) : null;
			if (wnd) {
				wnd.find('smart-date-time-picker').prop('messages', _smartGantt.messages);
				if (_smartGantt.disableTaskRemove)
					wnd.find('.smart-popup-window-button.delete').remove();
			}
		}

		async gantt_onClick(evt) {
			if (this.disableEventsFlag)
				return;

			const ganttInfo = this.ganttInfo;
			const lastEventInfo = (ganttInfo.lastEvent || {}).detail;
			delete ganttInfo.lastEvent;

			const target = $(evt.target);
			const smartGantt = this.smartGantt;
			const _smartGantt = smartGantt[0];
			
			try {
				if (target.hasClass('add-task-button')) {
					const newTaskIndex = smartGantt.find('.add-task-button').index(target) + 1;
					_smartGantt.insertTask(newTaskIndex, { label: 'Yeni Operasyon', dateStart: _smartGantt.dateStart });
					this.gantt_onXEnd(evt);
					_smartGantt.refresh(true);
					_smartGantt.openWindow(newTaskIndex);
				}
			}
			catch (ex) {
				
				
				evt.preventDefault();
				//evt.target.updateTask(e.index, { dateStart: lastEventInfo.dateStart, dateEnd: lastEventInfo.dateEnd });
				throw ex;
			}
		}

		async gantt_onDragEnd(evt) {
			if (this.disableEventsFlag)
				return;
			
			let e = evt.detail;
			const ganttInfo = this.ganttInfo;
			const lastEventInfo = (ganttInfo.lastEvent || {}).detail;
			delete ganttInfo.lastEvent;

			const _smartGantt = evt.target;
			
			try {
				await this.wsCall_gantt_onDragEnd($.extend({}, e, { prev: $.extend({}, lastEventInfo) }));
				// evt.target.refresh(false);
				await this.gantt_onXEnd(evt);
			}
			catch (ex) {
				
				
				evt.preventDefault();
				//evt.target.updateTask(e.index, { dateStart: lastEventInfo.dateStart, dateEnd: lastEventInfo.dateEnd });
				throw ex;
			}
		}

		async gantt_onResizeEnd(evt) {
			if (this.disableEventsFlag)
				return;
			
			let e = evt.detail;
			const ganttInfo = this.ganttInfo;
			const lastEventInfo = (ganttInfo.lastEvent || {}).detail;
			delete ganttInfo.lastEvent;

			const _smartGantt = evt.target;
			
			try {
				await this.wsCall_gantt_onResizeEnd($.extend({}, e, { prev: $.extend({}, lastEventInfo) }));
				// evt.target.refresh(false);
				await this.gantt_onXEnd(evt);
			}
			catch (ex) {
				
				
				evt.preventDefault();
				//evt.target.updateTask(e.index, { dateStart: lastEventInfo.dateStart, dateEnd: lastEventInfo.dateEnd });
				throw ex;
			}
		}

		async gantt_onProgressChangeEnd(evt) {
			if (this.disableEventsFlag)
				return;
			
			let e = evt.detail;
			if (e) {
				let oldValue = e.progress;
				const newValue = e.progress = asFloat(evt.detail.progress.toFixed(1));
				if (oldValue != newValue) {
					const _smartGantt = evt.target;
					_smartGantt.beginUpdate();
					_smartGantt.updateTask(e.index, { progress: newValue });
					_smartGantt.endUpdate();
				}
			}

			const ganttInfo = this.ganttInfo;
			const lastEventInfo = (ganttInfo.lastEvent || {}).detail;
			delete ganttInfo.lastEvent;

			const _smartGantt = evt.target;
			
			try {
				await this.wsCall_gantt_onProgressChangeEnd($.extend({}, e, { prev: $.extend({}, lastEventInfo) }));
				evt.target.refresh(true);
				await this.gantt_onXEnd(evt);
			}
			catch (ex) {
				
				
				evt.preventDefault();
				//evt.target.updateTask(e.index, { dateStart: lastEventInfo.dateStart, dateEnd: lastEventInfo.dateEnd });
				throw ex;
			}
		}

		async gantt_onConnectionEnd(evt) {
			if (this.disableEventsFlag)
				return;
			
			let e = evt.detail;
			const ganttInfo = this.ganttInfo;
			const lastEventInfo = (ganttInfo.lastEvent || {}).detail;
			delete ganttInfo.lastEvent;

			const _smartGantt = evt.target;
			
			try {
				await this.wsCall_gantt_onConnectionEnd($.extend({}, e, { prev: $.extend({}, lastEventInfo) }));
				//evt.target.refresh(false);
				await this.gantt_onXEnd(evt);
			}
			catch (ex) {
				_smartGantt.dataSource = $.extend(true, [], ganttInfo.lastDataSource);
				evt.preventDefault();
				throw ex;
			}
		}

		async gantt_onTaskSelect(_e) {
			if (this.disableEventsFlag)
				return;
			
			if (this.isNextEventDisabled) {
				delete this.isNextEventDisabled;
				return;
			}

			const _smartGantt = (_e.smartGantt || this.smartGantt)[0];
			const evt = _e.event;
			
			/*const e = evt.detail;
			e.tasks = e.value.map(ind => tasks[ind]);

			const lastEventInfo = (ganttInfo.lastEvent || {}).detail;
			if (lastEventInfo) {
				const tasks = _smartGantt.tasks;
				lastEventInfo.tasks = lastEventInfo.value.map(ind => tasks[ind]);
			}*/

			const ganttInfo = this.ganttInfo;
			$.extend(this.ganttInfo, {
				lastEvent: evt,
				selectedIndexes: _smartGantt.selectedIndexes,
				selectedIndex: (_smartGantt.selectedIndexes || [])[0]
			});
			
			try {
				// await this.wsCall_gantt_onTaskSelect($.extend({}, e, { prev: $.extend({}, lastEventInfo), smartGantt: smartGantt }));
				console.info(evt);

				// await this.gantt_onXEnd(evt);
			}
			catch (ex) {
				/* this.isNextEventDisabled = true;
				evt.target.clearSelection();*/

				throw ex;
			}
			finally {
				this.disableTimersFlag = this.savedDisableTimersFlag;
			}
		}

		async gantt_onItemInsert(evt) {
			if (this.disableEventsFlag)
				return;
			
			let e = evt.detail;
			const ganttInfo = this.ganttInfo;
			// const lastEventInfo = (ganttInfo.lastEvent || {}).detail);
			delete ganttInfo.lastEvent;

			const _smartGantt = evt.target;
			
			try {
				await this.wsCall_gantt_onItemInsert($.extend({}, e));
				await this.gantt_onXEnd(evt);
			}
			catch (ex) {
				evt.preventDefault();
				throw ex;
				
				/*const item = e.item;
				switch (e.type || item.type) {
					case 'project':
					case 'task':
						this.isNextEventDisabled = true;
						_smartGantt.removeTask(item);
						break;
					case 'resource':
						this.isNextEventDisabled = true;
						_smartGantt.removeResource(item);
						break;
				}*/
				throw ex;
			}
		}

		async gantt_onItemUpdate(evt) {
			if (this.disableEventsFlag)
				return;
			
			let e = evt.detail;
			const ganttInfo = this.ganttInfo;
			const lastEventInfo = (ganttInfo.lastEvent || {}).detail;
			delete ganttInfo.lastEvent;

			const _smartGantt = evt.target;
			
			try {
				await this.wsCall_gantt_onItemUpdate($.extend({}, e, { prev: $.extend({}, lastEventInfo) }));
				await this.gantt_onXEnd(evt);
			}
			catch (ex) {
				evt.preventDefault();
				//evt.target.updateTask(e.index, { dateStart: lastEventInfo.dateStart, dateEnd: lastEventInfo.dateEnd });
				throw ex;
			}
		}

		async gantt_onItemRemove(evt) {
			if (this.disableEventsFlag)
				return;
			
			let e = evt.detail;
			const ganttInfo = this.ganttInfo;
			// const lastEventInfo = (ganttInfo.lastEvent || {}).detail;
			delete ganttInfo.lastEvent;

			const _smartGantt = evt.target;
			if (_smartGantt.disableTaskRemove)
				evt.preventDefault();
			
			try {
				await this.wsCall_gantt_onItemRemove($.extend({}, e));
				await this.gantt_onXEnd(evt);
			}
			catch (ex) {
				evt.preventDefault();
				if (e.type == 'task') {
					_smartGantt.beginUpdate();
					_smartGantt.insertTask(ganttInfo.selectedIndex || -1, e.item);
					_smartGantt.endUpdate();
					_smartGantt.refresh(true);
				}
				//throw ex;
			}
		}

		async gantt_onLoadStateRequested(e) {
			if (this.disableEventsFlag)
				return;
			
			e = e || {};
			const _smartGantt = e.event ? e.event.target : (e.smartGantt || this.smartGantt)[0];
			const ganttInfo = this.ganttInfo;
			
			try {
				const ganttState = await this.wsCall_gantt_onLoadStateRequested($.extend({}, e));
				_smartGantt.loadState(ganttState);
				this.ganttDegistimi = true;
			}
			catch (ex) {
				
				if (e.event)
					e.event.preventDefault();
			}
		}

		async gantt_onSaveStateRequested(e) {
			if (this.disableEventsFlag)
				return;
			
			e = e || {};
			const _smartGantt = (e.smartGantt || this.smartGantt)[0];
			// const ganttInfo = this.ganttInfo;
			// 
			try {
				e.ganttState = _smartGantt.getState();
				await this.wsCall_gantt_onSaveStateRequested($.extend({}, e));
				// 
			}
			catch (ex) {
				if (e.event)
					e.event.preventDefault();
				throw ex;
			}
		}


		wsCall_getGanttOptions(e) {
			let _smartGantt = (e.smartGantt || this.smartGantt)[0];
			
			if (this.class.isTest) {
				return lastAjaxObj = $.get({
					url: `${this.appDataRoot}smartGantt_getOptions.json`,
					data: this.buildAjaxArgs()
				}).fail(defFailBlock)
			}

			const optionsSource = this.optionsSource;
			if (optionsSource) {
				return lastAjaxObj = $.get({
					url: optionsSource.startsWith('http:') || optionsSource.startsWith('https:') || optionsSource.startsWith('/')
							? optionsSource
							: `${this.appDataRoot}${optionsSource}`,
					data: this.buildAjaxArgs()
				}).fail(defFailBlock)
			}

			return lastAjaxObj = $.post({
				url: `${this.wsURLBase}smartGantt_getOptions`,
				data: this.buildAjaxArgs()
			}).fail(defFailBlock)
		}

		wsCall_gantt_onDragEnd(e) {
			/*const
				detail = e.detail,
				index = e.index,
				dateStart = e.dateStart,
				dateEnd = e.dateEnd;*/
			
			if (!e.dateStart)
				return;

			const wsArgs = $.extend(this.buildAjaxArgs(e), {
				taskIndex: e.index,
				dateStart: e.dateStart.toLocaleString(culture),
				dateEnd: e.dateEnd.toLocaleString(culture)
			});
			const prev = e.prev || {};
			if (!$.isEmptyObject(prev)) {
				$.extend(wsArgs, {
					prev_taskIndex: prev.index,
					prev_dateStart: prev.dateStart.toLocaleString(culture),
					prev_dateEnd: prev.dateEnd.toLocaleString(culture)
				});
			}

			if (this.class.isTest) {
				return lastAjaxObj = $.get({
					url: `${this.appDataRoot}smartGantt_onDragEnd.json`,
					data: wsArgs
				})
			}

			return lastAjaxObj = $.post({
				url: `${this.wsURLBase}smartGantt_onDragEnd`,
				data: wsArgs
			})
		}

		wsCall_gantt_onResizeEnd(e) {
			if (!e.dateStart)
				return;
			
			const wsArgs = $.extend(this.buildAjaxArgs(e), {
				taskIndex: e.index,
				dateStart: e.dateStart.toLocaleString(culture),
				dateEnd: e.dateEnd.toLocaleString(culture)
			});
			const prev = e.prev || {};
			if (!$.isEmptyObject(prev)) {
				$.extend(wsArgs, {
					// prev_taskIndex: prev.index,
					prev_dateStart: prev.dateStart.toLocaleString(culture),
					prev_dateEnd: prev.dateEnd.toLocaleString(culture)
				});
			}

			if (this.class.isTest) {
				return lastAjaxObj = $.get({
					url: `${this.appDataRoot}smartGantt_onResizeEnd.json`,
					data: wsArgs
				})
			}

			return lastAjaxObj = $.post({
				url: `${this.wsURLBase}smartGantt_onResizeEnd`,
				data: wsArgs
			})
		}

		wsCall_gantt_onProgressChangeEnd(e) {
			const prev = e.prev || {};
			if (!prev.progress)
				return;
			
			const wsArgs = $.extend(this.buildAjaxArgs(e), {
				taskIndex: e.index,
				progress: e.progress
			});
			if (!$.isEmptyObject(prev)) {
				$.extend(wsArgs, {
					prev_progress: prev.progress
				});
			}

			if (this.class.isTest) {
				return lastAjaxObj = $.get({
					url: `${this.appDataRoot}smartGantt_onProgressChangeEnd.json`,
					data: wsArgs
				})
			}

			return lastAjaxObj = $.post({
				url: `${this.wsURLBase}smartGantt_onProgressChangeEnd`,
				data: wsArgs
			})
		}

		wsCall_gantt_onConnectionEnd(e) {
			const wsArgs = $.extend(this.buildAjaxArgs(e), {
				type: e.type,
				taskStartIndex: e.startIndex,
				taskEndIndex: e.endIndex
			});
			const prev = e.prev || {};
			if (!$.isEmptyObject(prev)) {
				$.extend(wsArgs, {
					prev_type: prev.type,
					prev_taskStartIndex: prev.startIndex,
					prev_taskEndIndex: prev.endIndex
				});
			}

			if (this.class.isTest) {
				return lastAjaxObj = $.get({
					url: `${this.appDataRoot}smartGantt_onConnectionEnd.json`,
					data: wsArgs
				})
			}

			return lastAjaxObj = $.post({
				url: `${this.wsURLBase}smartGantt_onConnectionEnd`,
				data: wsArgs
			})
		}

		wsCall_gantt_onTaskSelect(e) {
			const _smartGantt = (e.smartGantt || this.smartGantt)[0];

			/*$.extend(e, {
				tasks: $.extend(true, [], e.tasks || []),
				prevTasks: $.extend(true, [], e.prevTasks || [])
			});
			[e.tasks, e.prevTasks].forEach(tasks => {
				tasks.forEach(task => {
					['label', 'name'].forEach(key =>
						delete task[key])
				})
			});*/

			const wsArgs = $.extend(this.buildAjaxArgs(e), {
				type: e.type,
				taskIndexes: toJSONStr(e.value),
				tasks: toJSONStr(e.tasks)
			});
			const prev = e.prev || {};
			if (!$.isEmptyObject(prev)) {
				$.extend(wsArgs, {
					prev_taskIndexes: toJSONStr(prev.value),
					prev_tasks: toJSONStr(e.prevTasks)
				});
			}			

			if (this.class.isTest) {
				return lastAjaxObj = $.get({
					url: `${this.appDataRoot}smartGantt_onTaskSelect.json`,
					data: wsArgs
				})
			}

			return lastAjaxObj = $.post({
				url: `${this.wsURLBase}smartGantt_onTaskSelect`,
				data: wsArgs
			})
		}

		wsCall_gantt_onItemInsert(e) {
			/*$.extend(e, {
				item: e.item ? $.extend(true, {}, e.item) : null,
				prevItem: e.prevItem ? $.extend(true, {}, e.prevItem) : null
			});
			[e.item, e.prevItem].forEach(item => {
				if (item) {
					['label', 'name'].forEach(key =>
						delete item[key])
				}
			});*/
			const wsArgs = $.extend(this.buildAjaxArgs(e), {
				type: e.type,
				item: e.item ? toJSONStr(e.item) : ''
			});

			if (this.class.isTest) {
				return lastAjaxObj = $.get({
					url: `${this.appDataRoot}smartGantt_onItemInsert.json`,
					data: wsArgs
				})
			}

			return lastAjaxObj = $.post({
				url: `${this.wsURLBase}smartGantt_onItemInsert`,
				data: wsArgs
			})
		}

		wsCall_gantt_onItemUpdate(e) {
			/*$.extend(e, {
				item: e.item ? $.extend(true, {}, e.item) : null,
				prevItem: e.prevItem ? $.extend(true, {}, e.prevItem) : null
			});
			[e.item, e.prevItem].forEach(item => {
				if (item) {
					['label', 'name'].forEach(key =>
						delete item[key])
				}
			});*/
			const wsArgs = $.extend(this.buildAjaxArgs(e), {
				type: e.type,
				item: e.item ? toJSONStr(e.item) : ''
			});
			const prev = e.prev || {};
			if (!$.isEmptyObject(prev)) {
				$.extend(wsArgs, {
					prev_item: toJSONStr(prev.item)
				});
			}

			if (this.class.isTest) {
				return lastAjaxObj = $.get({
					url: `${this.appDataRoot}smartGantt_onItemUpdate.json`,
					data: wsArgs
				})
			}

			return lastAjaxObj = $.post({
				url: `${this.wsURLBase}smartGantt_onItemUpdate`,
				data: wsArgs
			})
		}

		wsCall_gantt_onItemRemove(e) {
			/*$.extend(e, {
				item: e.item ? $.extend(true, {}, e.item) : null,
				prevItem: e.prevItem ? $.extend(true, {}, e.prevItem) : null
			});
			[e.item, e.prevItem].forEach(item => {
				if (item) {
					['label', 'name'].forEach(key =>
						delete item[key])
				}
			});*/
			
			const wsArgs = $.extend(this.buildAjaxArgs(e), {
				type: e.type,
				item: e.item ? toJSONStr(e.item) : ''
			});
			
			if (this.class.isTest) {
				return lastAjaxObj = $.get({
					url: `${this.appDataRoot}smartGantt_onItemRemove.json`,
					data: wsArgs
				})
			}

			return lastAjaxObj = $.post({
				url: `${this.wsURLBase}smartGantt_onItemRemove`,
				data: wsArgs
			})
		}

		wsCall_gantt_onLoadStateRequested(e) {
			const wsArgs = this.buildAjaxArgs(e);

			if (this.class.isTest) {
				return lastAjaxObj = $.get({
					url: `${this.appDataRoot}smartGantt_onLoadStateRequested.json`,
					data: wsArgs
				})
			}

			return lastAjaxObj = $.post({
				url: `${this.wsURLBase}smartGantt_onLoadStateRequested`,
				data: wsArgs
			})
		}

		wsCall_gantt_onSaveStateRequested(e) {
			const wsArgs = $.extend(this.buildAjaxArgs(e), {
				ganttState: toJSONStr(e.ganttState),
				taskIndex2VioID: this.taskIndex2VioID ? toJSONStr(this.taskIndex2VioID) : '',
				vioID2TaskIndex: this.vioID2TaskIndex ? toJSONStr(this.vioID2TaskIndex) : '',
				vioID2Connection: this.vioID2Connection ? toJSONStr(this.vioID2Connection) : ''
			});
			
			if (this.class.isTest) {
				return lastAjaxObj = $.post({
					url: `${this.appDataRoot}smartGantt_onSaveStateRequested.json`,
					data: wsArgs
				}).fail(defFailBlock)
			}

			return lastAjaxObj = $.post({
				url: `${this.wsURLBase}smartGantt_onSaveStateRequested`,
				data: wsArgs
			}).fail(defFailBlock)
		}


		buildAjaxArgs(e) {
			e = e || {};
			const _smartGantt = (e.smartGantt || this.smartGantt)[0];
			
			e = { uniqueID: this.uniqueID, partID: _smartGantt.id };
			return super.buildAjaxArgs(e)
		}
	}
})()
