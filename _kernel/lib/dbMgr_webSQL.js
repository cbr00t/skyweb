
/*

	let mgr = new DBMgr({ dbName: 'a01' });
	let rs = await mgr.transactionDo({ callback: async (tx, e) => {
		await mgr.executeSql({ tx: e.tx, query: `CREATE TABLE IF NOT EXISTS tbl2(id INT AUTO_INCREMENT PRIMARY KEY, name TEXT NOT NULL DEFAULT '')` })
		await mgr.executeSql({ tx: e.tx, query: 'INSERT INTO tbl2 (name) VALUES (?), (?)', params: ['a', 'b'] });
		return await mgr.executeSql({ tx: e.tx, query: 'SELECT * FROM tbl2' })
	}});
	console.info(rs.rows);


	let mgr = new DBMgr({ dbName: 'a01' });
	rs = await mgr.transactionDo(async tx => {
		// let tx = e.tx;
		await mgr.executeSql({ tx: tx, query: 'DROP TABLE IF EXISTS tbl2' });
		await mgr.executeSql({ tx: tx, query: `CREATE TABLE IF NOT EXISTS tbl2(id INT AUTO_INCREMENT PRIMARY KEY, name TEXT NOT NULL DEFAULT '')` });
		await mgr.executeSql({ tx: tx, query: 'INSERT INTO tbl2 (name) VALUES (?), (?)', params: ['a', 'b'] });
		return await mgr.executeSql({ tx: tx, query: 'SELECT * FROM tbl2' });
	});
	$.each(rs.rows, (_, row) =>
		console.warn(row));

*/

(function() {
	window.DBMgr_WebSQL = class extends window.CObject {
		static DBSaveTimerKey = '_timer_dbSave'; static DBSave_MinIdleTimeMS = 3000; static DBSaveTimer_MinIdleTimeMS = this.DBSave_MinIdleTimeMS + 500;
		static RDBBackup_TimerKey = '_timer_remoteDBBackup'; static RDBBackup_IntervalMS = 3 * 60_000; static RDBBackup_TimeoutMS = 10 * 60_000;
		static DBWriteClauses = ['INTO ', 'INSERT ', 'UPDATE', 'DELETE', 'CREATE ', 'DROP ', 'ALTER ', 'EXEC ', 'IMPORT '];
		get webSQLmi() { return true } get app() { return this._app ?? sky.app } get isOpen() { return !!this.db }

		constructor(e) {
			e = e || {}; super(e);
			$.extend(this, {
				_app: e.app, dbName: e.dbName, noAutoSaveFlag: e.noAutoSaveFlag ?? e.noAutoSave,
				dbOpCallback: (e, _e) => this.defaultDbOpCallback(e, _e)
			});
			this.dbStoragePath = `sky/${this.app?.appName || 'skyWeb'}/db/${this.dbName || 'default'}`
		}
		open(e) {
			if (!this.isOpen) {
				this.db = openDatabase(this.dbName, 1,	'',	50 * 1024 * 1024);
				console.debug('sqlite db open', this.dbName, this.db)
			}
			return this.db
		}
		close(e) {
			if (!this.isOpen)
				return null
			let {db} = this;
			delete this.db;
			console.debug('sqlite db close', this.dbName, db)
			return db
		}
		async hasTables(e) {
			if (!this.isOpen)
				return null
			let names = e?.names ?? e;
			if (typeof names == 'string')
				names = [names]
			if (names && !$.isArray(names))
				names = Object.keys(names)
			let result = await this.tables(names);
			return names ? result?.length == names.length : !$.isEmptyObject(result)
		}
		async hasColumns(table, names) {
			if (!this.isOpen)
				return null
			if (typeof names == 'string')
				names = [names]
			if (names && !$.isArray(names))
				names = Object.keys(names)
			let result = await this.columns(table, names);
			return names ? result?.length == names.length : !$.isEmptyObject(result)
		}
		async tables(e) {
			if (!this.isOpen)
				return null
			let names = e?.names ?? e;
			if (typeof names == 'string')
				names = [names]
			if (names && !$.isArray(names))
				names = Object.keys(names)
			let query = `SELECT name FROM sqlite_master WHERE type = 'table'`;
			if (!$.isEmptyObject(names))
				query += ` AND name IN (${names.map(name => `'${name}'`).join(', ')})`
			const result = [];
			const recs = await this.executeSqlReturnRowsBasic({ query: query });
			for (let i = 0; i < recs.length; i++)
				result.push(recs[i].name.trimEnd())
			return result
		}
		async columns(table, names) {
			if (!this.isOpen)
				return null
			if (typeof names == 'string')
				names = [names]
			if ($.isArray(names))
				names = asSet(names)
			// let query = `SELECT * FROM sqlite_master WHERE name = ${table}`;
			let query = `SELECT * FROM ${table}`;
			try {
				const rec = await this.tekilExecuteSelect({ query: query });
				if (!rec)
					return null
				const result = [];
				for (const name in rec) {
					if (!names || names[name])
						result.push(name)
				}
				return result
			}
			catch (ex) { return null }
		}
		async getTx(e) {
			e = e || {}; if (e.tx) { return e.tx }
			if (!this.isOpen) { this.open() }
			return await new Promise((resolve, reject) => {
				let txSelector = this.getTxSelector(e);
				this.db[txSelector](
					tx => {
						if (this.isOpen) { this.dbSaveProc(e) }
						e.tx = tx; resolve(tx)
					},
					err => {
						if (err.code !== 0) {
							if (err.code == 1) { location.reload(false) }    /* disk i/o error */
							reject(err)
						}
					}
				)
			});
		}
		transaction() { return this.getTx({ readOnly: false }) }
		readTransaction() { return this.getTx({ readOnly: true }) }
		async transactionDo(e) {
			e = e || {}; let callback;
			if ($.isFunction(e)) { callback = e; e = {} }
			else { callback = e.callback }
			let {dbOpCallback} = this;
			if (!$.isFunction(dbOpCallback)) { dbOpCallback = null }
			if (dbOpCallback) { await dbOpCallback.call(this, { operation: 'transactionDo', state: true }, e) }
			try {
				let hasTx = !!e.tx, tx = await this.getTx(e);
				if ($.isFunction(callback)) {
					e.result = await callback.call(this, tx, e);
					if (e.result === false) { this.abortTransaction() }
					if (!hasTx) { tx = e.tx = await this.getTx() }
				}
				if (dbOpCallback) { await dbOpCallback.call(this, { operation: 'transactionDo', state: false }, e) }
				return e.result
			}
			catch (ex) {
				if (dbOpCallback) { await dbOpCallback.call(this, { operation: 'transactionDo', state: null, error: ex }, e) }
				throw ex
			}
		}
		readTransactionDo(e) {
			if ($.isFunction(e)) { e = { callback: e } }
			return this.transactionDo($.extend({}, e, { readOnly: true }))
		}
		abortTransaction() { throw { isError: false, rc: 'runtimeInterrupt', errorText: 'Transaction abort signal' } }
		async executeSql(e, _params, isRetry) {
			e = e || {}; if (!e.query) { e = { query: e } }
			if (_params !== undefined) { e.params = _params }
			let {params: savedParams, query: _query} = e, isDBWrite = this.isDBWrite(_query);
			if (_query && _query.getQueryYapi) { $.extend(e, _query.getQueryYapi()) }
			else if (_query.query) { $.extend(e, _query) }
			else { e.query = _query?.toString() ?? '' }
			if (!e.query) { return null }
			if (!$.isEmptyObject(savedParams)) {
				let {params} = e;
				if ($.isEmptyObject(params)) { params = e.params = savedParams }
				else if (params != savedParams) {
					if ($.isArray(params)) { params.push(...savedParams) }
					else { $.extend(params, savedParams) }
				}
			}
			if (typeof e.query == 'string') {
				if (e.query.toUpperCase().includes('NOT NULL AUTO')) {
					e.query = e.query.replaceAll('rowid\t', '--rowid\t')
									 .replaceAll('rowid ', '--rowid ')
				}
			}
			let {dbOpCallback} = this; if (!$.isFunction(dbOpCallback)) { dbOpCallback = null }
			if (dbOpCallback) { await dbOpCallback.call(this, { operation: 'executeSql', state: true }, e) }
			try {
				let tx = await this.getTx(e);
				let rs = e.rs = await new Promise(async (resolve, reject) => {
					try {
						this.dbLastExec = e; console.debug('db exec', e);
						await tx.executeSql(
							e.query, e.params || [],
							(_tx, _rs) => { resolve(_rs) },
							(_tx, _err) => { e; /*debugger;*/ reject(_err) }
						)
					}
					catch (ex) { reject(ex) }
				});
				let result = rs;
				if (e.return == 'rows') { result = rs.rows ? $.makeArray(rs.rows) : null }
				else if (e.return == 'rowsBasic') { result = rs.rows }
				if (result != null && ( isDBWrite || (typeof _result == 'number' && result) )) { this.hasChanges = true }
				if (!this.noAutoSaveFlag) { this.dbSaveProc(e) }
				if (dbOpCallback) { setTimeout(() => dbOpCallback.call(this, { operation: 'executeSql', state: false }, e), 20) }
				return result
			}
			catch (ex) {
				if (dbOpCallback) { setTimeout(() => dbOpCallback.call(this, { operation: 'executeSql', state: null, error: ex }, e), 20) }
				if (!isRetry) {
					let message = ex.message || '';
					if (message.includes('no such column') || message.includes('olumn does not exist')) {
						let {app} = sky;
						if (app?.tabloEksikleriTamamla) {
							if (e.tx) { e.tx = await this.getTx() }
							await sky.app.tabloEksikleriTamamla($.extend({}, e, { noCacheReset: true }));
							return await this.executeSql(e, _params, true)
						}
					}
				}
				throw ex
			}
		}
		executeSqlReturnRowsBasic(e, _params) {
			e = e || {}; if (!e.query) { e = { query: e } }
			return this.executeSelect({ ...e, return: 'rowsBasic', ..._params })
		}
		executeSqlReturnRows(e, _params) {
			e = e || {}; if (!e.query) { e = { query: e } }
			return this.executeSelect({ ...e, return: 'rows', ..._params })
		}
		executeSelect(e, _params) {
			e = e || {}; if (!e.query) e = { query: e }
			if (!e.tx && e.readOnly == null) { e.readOnly = true }
			return this.executeSql({ ...e, ..._params })
		}
		async tekilExecuteSelect(e, _params) {
			e = e || {}; if (!e.query) e = { query: e };
			let {query} = e; if (typeof query == 'string') {
				let queryUpper = query.toUpperCase();
				if (!queryUpper.includes('LIMIT 1')) {
					let Postfix = 'LIMIT 1', ind = query.indexOf(' OFFSET');
					query = e.query = ind < 0 ? `${query} LIMIT 1` : `${query.substring(0, ind)} LIMIT 1${query.substring(ind)}`
				}
			}
			else { query.limit = 1 }
			let rs = await this.executeSql(e, _params);
			return rs.rows?.[0]
		}
		async tekilDegerExecuteSelect(e, _params) {
			e = e || {}; if (!e.query) { e = { query: e } }
			let rec = await this.tekilExecuteSelect(e, _params);
			return rec ? Object.values(rec)[0] : null
		}
		async insertOrReplaceTable(e) {
			e = e || {}; let hvList = e.hvListe || e.hvList || (e.hv ? [e.hv] : null);
			if ($.isEmptyObject(hvList)) { return false }
			let {table} = e, mode = e.mode || 'insertIgnore';
			let parcaSize = e.parcaSize || 30, parcaCallback = $.isFunction(e.parcaCallback) ? e.parcaCallback : null;
			let valuesTemplate, query; $.extend(e, { queries: [], index: 0, count: hvList.length, parcaSize: parcaSize });
			let chunkIndex = -1, islemBlock = async (tx, _hvList) => {
				let params = []; query = ''; chunkIndex++;
				if (!chunkIndex) {
					let {preExecQueries} = e; if (preExecQueries) {
						for (let queryYapi of preExecQueries) {
							query += `${queryYapi.query} GO `;
							if (!$.isEmptyObject(queryYapi.params)) { params.push(...queryYapi.params) }
						}
					}
				}
				query += e.queryPrefix || '';
				switch (mode) {
					case 'insert': query += 'INSERT'; break
					case 'replace': query += 'REPLACE'; break
					case 'insertIgnore': query += 'INSERT OR IGNORE'; break
					default: throw { rc: 'invalidArgument', errorText: `(${mode || ''}) parametresi geçersizdir` }; break
				}
				let hv = _hvList[0];
				if (!valuesTemplate) {
					valuesTemplate = new Array(Object.keys(hv).length);
					e.valuesTemplate = valuesTemplate = valuesTemplate.fill('?').join(',')
				}
				let atBegin = true; query += ` INTO ${table} (`;
				for (let [key, value] of Object.entries(hv)) {
					if (!atBegin) { query += `, ` }
					atBegin = false; query += key
				}
				query += `) VALUES `; atBegin = true;
				for (let hv of _hvList) {
					for (let [key, value] of Object.entries(hv)) {
						let value = hv[key];
						if (value != null && value.valueOf) { value = value.valueOf() }
						params.push(value)
					}
					if (!atBegin) { query += `, ` }
					atBegin = false; query += `(${valuesTemplate})`
				}
				query += e.queryPostfix || '';
				e.queries.push(query);
				
				let _e = { tx, query, params }, _result = await this.executeSql(_e);
				if (_result !== false) {
					$.extend(e, { rs: _e.rs, result: _e.result }); e.index += _hvList.length;
					_e = $.extend({}, _e, e, { parca: _hvList, parcaSize: _hvList.length });
					if ((_e.rs ?? _e).insertId == null) { _e.insertId = asInteger(await this.tekilDegerExecuteSelect(`SELECT MAX(rowid) FROM ${table}`)) }
					if (parcaCallback) {
						let __result = await parcaCallback.call(this, _e) || {};
						if (__result === false) { return false }
						$.extend(_result, __result, { rs: e.rs });
						this.hasChanges = true
					}
				}
				return _result
			};
			let asilBlock = async tx => {
				return await Utils.arrayParcalaAndDo({
					source: hvList, parcaSize: parcaSize,
					callback: e => islemBlock(tx, e.part)
				})
			};
			let {tx} = e; if (tx) { return await asilBlock(tx) }
			let result = await this.transactionDo(async tx => await asilBlock(tx));
			this.dbSaveProc(e);
			return result
		}
		dbSaveProc(e) {
			if (!this.dbSave) { return }
			e = e || {}; const {DBSaveTimerKey, DBSave_MinIdleTimeMS, DBSaveTimer_MinIdleTimeMS} = this.class;
			clearTimeout(this[DBSaveTimerKey]); let dbData;
			this[DBSaveTimerKey] = setTimeout(async () => {
				try {
					let {_lastSave_timestamp, dbName, db, hasChanges} = this;
					let farkMS = (now() - _lastSave_timestamp);
					if (!_lastSave_timestamp || farkMS > DBSave_MinIdleTimeMS) {
						this._lastSave_timestamp = now(); dbData = await this.dbSave(e); this._lastSave_timestamp = now();
						if (console.group) { console.group('dbSaveProc', 'timer trigger') }
						let _e = { dbName, db, lastSave_timestamp: this._lastSave_timestamp, farkMS, hasChanges };
						if (hasChanges) { console.warn(_e) } else { console.debug(_e) }
						if (console.groupEnd) { console.groupEnd() }
					}
				}
				finally { delete this[DBSaveTimerKey] }
			}, DBSaveTimer_MinIdleTimeMS)
		}
		rdbBackup_initTimer(e) {
			if (this.noAutoSaveFlag) { return null }
			let {RDBBackup_TimerKey, RDBBackup_IntervalMS} = this.class;
			if (RDBBackup_IntervalMS <= 0) { return null }
			clearTimeout(this[RDBBackup_TimerKey]); this._remoteBackupFlag = false;
			return this[RDBBackup_TimerKey] = setTimeout(async () => {
				try { await this.rdbBackupProc(e) }
				finally {
					if (this._remoteBackupFlag) { delete this[RDBBackup_TimerKey] }
					else { this.rdbBackup_initTimer(e) }
				}
				
			}, RDBBackup_IntervalMS)
		}
		async rdbBackupProc() {
			let {db} = this; if (!(navigator.onLine && db?.export)) { return null }
			let {config, app} = sky, {wsHostNameUyarlanmis: wsHostName} = app.param ?? {}; if (!wsHostName) { return null }
			let {class: dbMgrClass} = this, {RDBBackup_TimeoutMS: timeout} = dbMgrClass;
			let {app: _app, dbName} = this; dbName = dbName || 'sqlite';
			let {user} = config.sessionInfo ?? {}; user = user || '_';
			let dateStr = now().toString('ddMMyyyy_HHmm'), rootDir = `skyTablet/${user}`;
			let results = [];
			{
				let dbMgr = new dbMgrClass({ app: _app, dbName: `temp-${dbName}` }).noAutoSave();
				await dbMgr.dbClear(); /* await dbMgr.open() */
				let queries = [], tables = [], exec = queries => dbMgr.executeSql(queries.join(`;${CrLf}${CrLf}`));
				{
					let recs = await this.executeSqlReturnRows(`SELECT name, sql FROM sqlite_master WHERE type = 'table' AND (name LIKE 'const_%' OR name LIKE 'data_%' OR name = 'data_DigerHareket')`);
					if (!recs?.length) {    /* nothing to do */
						this.rdbBackup_ajax = null; this._remoteBackupFlag = true;
						return true
					}
					for (let {name, sql} of recs) { queries.push(sql); tables.push(name) }
					await exec(queries); queries = []
				}
				let Postfix_Fis = 'Fis', Postfixes_Detay = ['Detay', 'Stok', 'Har'];
				let mode = 'insert', fisTable2RowIDSet = {};
				for (let table of tables) {
					let hvListe = await this.executeSqlReturnRows(`SELECT * FROM ${table}`);
					if (hvListe?.length) {  /* her tabloda 'rapor' kolonu olmayabilir. 'rapor' kolonu var ve (true/1/* ...) ise merkez kaydıdır ve alınmaz */
						hvListe = hvListe.filter(({ rapor }) => !rapor) }
					if (hvListe?.length) {
						if (table.endsWith(Postfix_Fis)) {
							let rowIDSet = fisTable2RowIDSet[table] = fisTable2RowIDSet[table] ?? {};
							for (let { rowid } of hvListe) { if (rowid) { rowIDSet[rowid] = true } }
						}
						let postfix = Postfixes_Detay.find(p => table.endsWith(p));
						if (postfix && table.endsWith(postfix)) {
							let rowIDSet = fisTable2RowIDSet[table.replace(postfix, Postfix_Fis)];
							if (rowIDSet != null) { hvListe = hvListe.filter(({ fissayac }) => !!rowIDSet[fissayac]) }
						}
					}
					if (hvListe?.length) { await dbMgr.insertOrReplaceTable({ mode, table, hvListe }) }
				}
				let data = await dbMgr.db.export();
				let args = { fileName: `${rootDir}/${dateStr}/${dbName}.dataOnly.db` };
				let url = `https://${wsHostName}:9200/ws/genel/tempUpload/?${$.param(args).replaceAll('%2F', '/')}`;
				let options = {
					cache: false, processData: false, dataType: 'json',
					contentType: 'application/octet-stream; charset=utf-8',
					url, data, timeout, xhrFields: { withCredentials: false }
				}
				try {
					this.rdbBackup_ajax?.abort?.(); this.rdbBackup_ajax = $.post(options);
					results.push({ result: await this.rdbBackup_ajax, url, data })
				}
				catch (ex) {
					// HTTPS fail ⇒ HTTP fallback
					url = url.replace('https:', 'http:').replace(':9200', ':8200')
					try {
						options.url = url; this.rdbBackup_ajax = $.post(options);
						results.push({ result: await this.rdbBackup_ajax, url, data })
					}
					catch (ex2) { console.error(ex2.responseJSON ?? ex2.responseText ?? ex2.errorText ?? ex2.message ?? ex2) }
				}
				finally { this.rdbBackup_ajax = null }
			}
			{
				let totalRecords = 0, {param: appParam} = app, param = {};
				if (app.kmTakibiYapilirmi) { param.kapandimi = true }
				if (appParam.ilkKM) { param.ilkKM = appParam.ilkKM }
				if (appParam.sonKM) { param.sonKM = appParam.sonKM }
				if (appParam.mustKod2Bilgi) {
					for (let [mustKod, bilgi] of Object.entries(appParam.mustKod2Bilgi)) {
						if ($.isEmptyObject(bilgi)) { continue }
						let mustKod2Bilgi = param.mustKod2Bilgi = param.mustKod2Bilgi || {}; mustKod2Bilgi[mustKod] = bilgi
					}
				}
				let paramGonderilsinmi = false; if (param) {
					if (!paramGonderilsinmi && (param.ilkKM || param.sonKM || param.kapandimi)) { paramGonderilsinmi = true }
					if (!paramGonderilsinmi && param.mustKod2Bilgi) {
						for (let [mustKod, bilgi] of Object.entries(param.mustKod2Bilgi)) {
							if (!$.isEmptyObject(bilgi)) { paramGonderilsinmi = true; break }
						}
					}
				}
				if (paramGonderilsinmi) { totalRecords++ } else { param = null }
				let table2Recs = {}, fetchBlock = async e => {
					let {query} = e, recs = await this.executeSqlReturnRowsBasic({ query });
					for (let i = 0; i < recs.length; i++) {
						let table = e.table || rec._table, rec = recs[i];
						let _recs = table2Recs[table] = table2Recs[table] || [];
						_recs.push(rec); totalRecords++
					}
				};
				let {bilgiGonderTableYapilari} = app; bilgiGonderTableYapilari = bilgiGonderTableYapilari ?? [];
				for (let {fisIDListe, baslik: baslikTable, diger: digerTablolar, tanim: tanimTablolar} of bilgiGonderTableYapilari) {
					if (!$.isEmptyObject(tanimTablolar)) {
						for (let table of tanimTablolar) {
							let sent = new MQSent({
								from: table, where: [`gonderildi = ''`],
								sahalar: [`'${table}' _table`, `'tanim' _tip`, `rowid`, `*`]
							});
							await fetchBlock({ table, query: new MQStm({ sent }) })
						}
					}
					if (baslikTable) {
						let sent = new MQSent({
							from: baslikTable, where: [`gonderildi = ''`, `gecici = ''`, `rapor = ''`, `degismedi = ''`],
							sahalar: [`'${baslikTable}' _table`, `'fis' _tip`, `rowid`, `*`]
						}), {where: wh} = sent;
						if (fisIDListe) { wh.inDizi(fisIDListe, `rowid`) }
						await fetchBlock({ table: baslikTable, query: new MQStm({ sent }) })
					}
					if (!$.isEmptyObject(digerTablolar)) {
						for (let table of digerTablolar) {
							let sent = new MQSent({
								from: `${table} har`,
								fromIliskiler: [ { from: `${baslikTable} fis`, iliski: `har.fissayac = fis.rowid` } ],
								where: [`fis.gonderildi = ''`, `fis.gecici = ''`, `fis.rapor = ''`, `fis.degismedi = ''`],
								sahalar: [`'${baslikTable}' _parentTable`, `'${table}' _table`, `'diger' _tip`, `har.rowid`, `har.*`]
							}), {where: wh} = sent;
							if (fisIDListe) { wh.inDizi(fisIDListe, `har.fissayac`) }
							await fetchBlock({ table, query: new MQStm({ sent }) })
						}
					}
				}
				if (!$.isEmptyObject(table2Recs)) {
					let args = { fileName: `${rootDir}/${dateStr}/${dbName}.json` };
					let data = { param, table2Recs };
					let url = `https://${wsHostName}:9200/ws/genel/tempUpload/?${$.param(args).replaceAll('%2F', '/')}`;
					let options = {
						cache: false, processData: false, dataType: 'json',
						contentType: 'application/json; charset=utf-8',
						url, data: toJSONStr(data),
						timeout, xhrFields: { withCredentials: false }
					}
					try {
						this.rdbBackup_ajax2?.abort?.(); this.rdbBackup_ajax2 = $.post(options);
						results.push({ result: await this.rdbBackup_ajax2, url, data })
					}
					catch (ex) {
						// HTTPS fail ⇒ HTTP fallback
						url = url.replace('https:', 'http:').replace(':9200', ':8200')
						try {
							options.url = url; this.rdbBackup_ajax2 = $.post(options);
							results.push({ result: await this.rdbBackup_ajax, url, data })
						}
						catch (ex2) { console.error(ex2.responseJSON ?? ex2.responseText ?? ex2.errorText ?? ex2.message ?? ex2) }
					}
					finally { this.rdbBackup_ajax2 = null }
				}
			}
			if (results?.length) { console.info('remote db backup', results) }
			this._remoteBackupFlag = true;
			return ({ db: results[0], erpData: results[1] })
		}
		/*async rdbBackupProc({ data }) {
			if (!(data && navigator.onLine)) { return false }
			data = data?.buffer ?? data;
			let {config, app} = sky, {wsHostName} = app.param ?? {}; if (!wsHostName) { return false }
			let {user} = config.sessionInfo ?? {};
			let dateStr = now().toString('ddMMyyyy_HHmm'), {dbName} = this;
			user = user || '_'; dbName = dbName || 'sqlite';
			let args = { fileName: `skyTablet/${user}/${dateStr}/${dbName}.db` };
			let url = `https://${wsHostName}:8200/ws/genel/tempUpload/?${$.param(args)}`;
			let {RDBBackup_TimeoutMS: timeout} = this.class;
			let cache = false, processData = false, dataType = 'json', contentType = 'application/octet-stream; charset=utf-8', xhrFields = { withCredentials: false };
			try {
				this.rdbBackup_ajax?.abort?.();
				let ajaxObj = this.rdbBackup_ajax = $.post({ cache, processData, dataType, contentType, xhrFields, url, data, timeout });
				await ajaxObj
			}
			catch (ex) {
				url = url.replace('https:', 'http:');
				try {
					this.rdbBackup_ajax?.abort?.();
					let ajaxObj = this.rdbBackup_ajax = $.post({ cache, processData, dataType, contentType, xhrFields, url, data, timeout });
					await ajaxObj
				}
				catch (ex2) { console.error(ex2.responseJSON ?? ex2.responseText ?? ex2.errorText ?? ex2.message ?? ex2) }
			}
			finally { this.rdbBackup_ajax = null }
			this._remoteBackupFlag = true;
			return true
		}*/
		static onBeforeUnload(evt) {
			console.warn('dbMgr before unload', 'begin');
			for (const dbMgr of Object.values(sky?.app?.dbMgrs)) {
				if (dbMgr.dbSave)
					dbMgr.dbSave(null, true)
			}
			console.debug('dbMgr before unload', 'end')
		}
		getTxSelector(e) { return e.txSelector = e.readOnly ? 'readTransaction' : 'transaction'; }
		get dbClosedError() { return { isError: true, rc: 'notOpen', errorText: 'Veritabanı kapalı' } }
		defaultDbOpCallback(e, _e) {
			e = e || {};
			if (e.operation != 'executeSql')
				return
			const app = this.app || sky.app;
			const indicatorPart = (app || {}).indicatorPart;
			if (indicatorPart && indicatorPart.dbCallback)
				return indicatorPart.dbCallback(e)
		}
		handleError(reject, ex) {
			if (reject)
				reject(ex)
			else
				throw ex
		}
		isDBWrite(e) {
			const query = e?.query ?? e; if (query) {
				const query = e.query ?? e; if (query.isDBWriteClause) { return true }
				if (typeof query == 'string') {
					const queryUpper = query.toUpperCase(), {DBWriteClauses} = this.class;
					return DBWriteClauses.some(clause => queryUpper.includes(clause))
				}
			}
			return false
		}
		autoSave() { this.noAutoSaveFlag = false; return this }
		noAutoSave() { this.noAutoSaveFlag = true; return this }
	}
})();
