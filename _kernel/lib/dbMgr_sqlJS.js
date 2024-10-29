(function() {
	window.DBMgr_SqlJS = class extends window.DBMgr_WebSQL {
		static DBSaveTimerKey = '_timer_dbSave';
		static DBSave_MinIdleTimeMS = 4000;
		get webSQLmi() { return false }
		get sqlJSmi() { return true }
		constructor(e) {
			e = e || {};
			super(e);
			this.dbFileName = 'sqlite.db';
			this.hasChanges = e.hasChanges ?? false
		}
		async open(e) {
			let {db} = this;
			if (!this.isOpen) {
				const {dbName} = this;
				await initSqlJsPromise;
				const sql = await initSqlJs({ locateFile: fileName => `../lib_external/webSQL/${fileName}` });
				console.debug('initSqlJs');
				let {fs} = this;
				if (!fs) {
					fs = (await Utils.getFS()).fs;
					console.debug('init fs', fs)
				}
				let data = await this.dbLoad();
				db = this.db = new sql.Database(data?.length ? data : undefined);
				console.debug('memory db create', dbName, db);
				if (data) {
					try { console.debug(data.length, String.fromCharCode.apply(null, Array.from(data.slice(0, 100)) )) }
					catch (ex) { }
				}
				try { await this.executeSql(`select count(*) from sqlite_master`) }
				catch (ex) {
					console.error(ex);
					let promise = new $.Deferred();
					let wnd = createJQXWindow(
						`<p><b class="red">!! SQLite Veritabanı okunamadı !!</b> (<i>hasarlı olabilir</i>)<br/>Yeniden oluşturulsun mu?</p><p><b class="red">** UYARI:</b> <span class="darkred">Bu işlem tabletteki bütün veriyi siler</span></p>`,
						'SQLite Veritabanı Erişim Sorunu',
						{ isModal: true, width: 400, height: 250 },
						{
							EVET: (dlgUI, btnUI) => { dlgUI.jqxWindow('close'); promise.resolve(true) },
							HAYIR: (dlgUI, btnUI) => { dlgUI.jqxWindow('close'); promise.resolve(false) }
						}
					);
					wnd.find(`.jqx-window-content > .ui-dialog-button [value = 'EVET']`).jqxButton('template', 'danger');
					let rdlg = await promise;
					if (rdlg) {
						db = this.db = new sql.Database();
						console.warn('empty memory db re-create', dbName, db);
						return
					}
				}
				try { await this.executeSql(`PRAGMA page_size=${16 * 1024}; VACUUM`) }
				catch (ex) { console.debug(ex) }
				let {onBeforeUnload} = this.class;
				if (!onBeforeUnload)
					onBeforeUnload = evt => this.class.onBeforeUnload(evt)
				window.removeEventListener('beforeunload', onBeforeUnload);
				window.removeEventListener('unload', onBeforeUnload);
				window.addEventListener('beforeunload', onBeforeUnload);
				window.addEventListener('unload', onBeforeUnload)
			}
			return db
		}
		async close(e) {
			if (!this.isOpen)
				return null
			await this.dbSave(e);
			let {dbName, db} = this;
			db.close();
			delete this.db;
			console.debug('db close', dbName, db);
			return db
		}
		async dbLoadFromFile(e) {
			e = e || {}; const {app} = sky, dbMgr = app.dbMgr_mf;
			let {file, fh, data} = e;
			if (!data) {
				if (!fh) {
					let {file} = e;
					if (!file) {
						const files = await showOpenFilePicker({ multiple: false, excludeAcceptAllOption: true, types: [{ accept: { 'application/x-db': ['.db'] }, description: 'SQLite DB Dosyaları' }] });
						file = (files || [])[0]
					}
					fh = await file.getFile()
				}
				data = new Uint8Array(await fh.arrayBuffer())
			}
			if (data) { await dbMgr.dbSave({ data }, true); await dbMgr.dbLoad() }
			const {dbStoragePath, dbFileName} = this; return {dbStoragePath, dbFileName, file, fh, data}
		}
		async dbLoad(e) {
			const {app} = this;
			if (!app)
				return null
			e = e || {};
			const {indicatorPart} = app;
			const {dbName, db, dbStoragePath, dbFileName, fs} = this;
			let rootDir, fh, file, data;
			try {
				if (indicatorPart?.dbCallback)
					await indicatorPart.dbCallback({ state: true })
				try {
					rootDir = await Utils.getFSDirHandle(dbStoragePath, false, { fs });
					fh = await rootDir.getFileHandle(dbFileName, { create: false });
					file = await fh.getFile()
				}
				catch (ex) { if (!ex?.code || ex?.code != ex.NOT_FOUND_ERR); return null }
				data = await file.arrayBuffer();
				data = data ? new Uint8Array(data) : null;
				this.hasChanges = false;
				console.debug('db load', dbName, db, dbStoragePath, dbFileName, rootDir, fs, fh);
				if (data) {
					try { console.debug( data.length, String.fromCharCode.apply(null, Array.from(data.slice(0, 100)) )) }
					catch (ex) { }
				}
				if (indicatorPart?.dbCallback)
					await indicatorPart.dbCallback({ state: false })
			}
			catch (ex) {
				console.error('db load', ex, dbName, db, dbStoragePath, dbFileName, rootDir, fs, fh);
				if (indicatorPart?.dbCallback)
					await indicatorPart.dbCallback({ state: null })
			}
			return data
		}
		async dbSave(e, _force) {
			if (!this.isOpen)
				return null
			const {app} = this;
			if (!app)
				return null
			e = e || {};
			let forceFlag = asBool(e.force ?? _force ?? false);
			if (!(forceFlag || this.hasChanges))
				return null
			const {indicatorPart} = app;
			const {dbName, db, dbStoragePath, dbFileName, fs} = this;
			let rootDir, fh, data;
			try {
				if (indicatorPart?.dbCallback)
					await indicatorPart.dbCallback({ state: true })
				data = e.data ?? db.export();
				try { console.debug('db save', 'data export', dbName, db, data) }
				catch (ex) { }
				if (data == null)
					return null
				rootDir = await Utils.getFSDirHandle(dbStoragePath, true, { fs });
				fh = await rootDir.getFileHandle(dbFileName, { create: true });
				const sw = await fh.createWritable();
				try { await sw.write(data) }
				finally { await sw.close() }
				this.hasChanges = false;
				console.debug('db save', 'file write', dbName, db, dbStoragePath, dbFileName, rootDir, fs, fh);
				if (data) {
					try { console.debug(data.length, String.fromCharCode.apply(null, Array.from(data.slice(0, 100)))) }
					catch (ex) { }
				}
				if (indicatorPart?.dbCallback)
					await indicatorPart.dbCallback({ state: false })
			}
			catch (ex) {
				console.error('db save', ex, dbName, db, dbStoragePath, dbFileName, rootDir, fs, fh);
				if (indicatorPart?.dbCallback)
					await indicatorPart.dbCallback({ state: null })
			}
			return data
		}
		async dbClear(e) {
			const {dbName, dbStoragePath, fs} = this;
			let {db} = this;
			await this.close();
			this.db = null;
			console.log('  ', '  ', 'memory db clear', 'db-obj', dbName, db)
			try {
				const rootDir = await Utils.getFSDirHandle(dbStoragePath, false, { fs });
				await rootDir.remove({ recursive: true });
				console.log('  ', '  ', 'memory db clear', 'fs', dbName, fs, rootDir)
			}
			catch (ex) {
				if (!ex?.code || ex?.code != ex.NOT_FOUND_ERR)
					console.error(ex)
			}
			await this.open();
			db = this.db;
			console.warn('db clear', dbName, fs, db);
			return true
		}
		async getTx(e) {
			e = e || {};
			if (e.tx)
				return e.tx
			if (!this.isOpen)
				await this.open()
			// (!e.readOnly && this.isOpen)
			//	this.dbSaveProc(e)
			if (this.isOpen)
				this.dbSaveProc(e)
			return {}
		}
		async executeSql(e, _params, isRetry) {
			e = e || {}; if (!this.isOpen) { await this.open(e) }
			if (!e.query) { e = { query: e } } if (_params !== undefined) { e.params = _params }
			let savedParams = e.params, _query = e.query, isDBWrite = this.isDBWrite(_query);
			if (_query?.getQueryYapi) { $.extend(e, _query.getQueryYapi()) } else if (_query?.query) { $.extend(e, _query) } else { e.query = _query?.toString() ?? '' }
			if (!e.query) { return null }
			if (!$.isEmptyObject(savedParams)) {
				let {params} = e; if ($.isEmptyObject(params)) { params = e.params = savedParams }
				else if (params != savedParams) { if ($.isArray(params)) { params.push(...savedParams) } else { $.extend(params, savedParams) } }
			}
			if (typeof e.query == 'string') { if (e.query.toUpperCase().includes('NOT NULL AUTO')) { e.query = e.query.replaceAll('rowid\t', '--rowid\t').replaceAll('rowid ', '--rowid ') } }
			let {dbOpCallback} = this; if (!$.isFunction(dbOpCallback)) { dbOpCallback = null }
			if (dbOpCallback) { await dbOpCallback.call(this, { operation: 'executeSql', state: true }, e) }
			let _result; this.dbLastExec = e; try { console.debug('db exec', e) } catch (ex) { }
			try { _result = await this.db.exec(e.query, e.params) }
			catch (ex) {
				if (!isRetry) {
					const message = ex.message || ''; if (message.includes('no such column')) {
						const {app} = this;
						if (app?.tabloEksikleriTamamla) { await app.tabloEksikleriTamamla({ ...e, noCacheReset: true }); return await this.executeSql(e, _params, true) }
					}
				}
				if (dbOpCallback) { await dbOpCallback.call(this, { operation: 'executeSql', state: null, error: ex }, e) }
				throw ex
			}
			if (!_result) { return _result }
			_result = $.isArray(_result) ? _result[0] : null;
			if ($.isEmptyObject(_result) && ( isDBWrite || (typeof _result == 'number' && result) )) { this.hasChanges = true }
			this.dbSaveProc(e);
			let result = { rows: [] }, {columns, values} = _result || {};
			if (values) { for (const _rec of values) { const rec = {}; for (let i = 0; i < columns.length; i++) { rec[columns[i]] = _rec[i] } result.rows.push(rec) } }
			const returnType = e.return;
			switch (returnType) { case 'rows': case 'rowsBasic': result = result.rows; break }
			if (dbOpCallback) { setTimeout(() => dbOpCallback.call(this, { operation: 'executeSql', state: false }, e), 20) }
			return result
		}
	}
})()
