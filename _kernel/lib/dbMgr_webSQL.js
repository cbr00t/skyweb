
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
		static DBSaveTimerKey = '_timer_dbSave';
		static DBSave_MinIdleTimeMS = 3000;
		static DBSaveTimer_MinIdleTimeMS = this.DBSave_MinIdleTimeMS + 500;
		static DBWriteClauses = ['INTO ', 'INSERT ', 'UPDATE', 'DELETE', 'CREATE ', 'DROP ', 'ALTER ', 'EXEC ', 'IMPORT '];
		get webSQLmi() { return true }
		get app() { return this._app ?? sky.app }
		get isOpen() { return !!this.db }

		constructor(e) {
			e = e || {};
			super(e);
			$.extend(this, {
				_app: e.app, dbName: e.dbName,
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
			e = e || {};
			if (e.tx)
				return e.tx
			if (!this.isOpen)
				this.open()
			return await new Promise((resolve, reject) => {
				const txSelector = this.getTxSelector(e);
				this.db[txSelector](
					tx => {
						// if (!e.readOnly)
						// 	this.dbSaveProc(e)
						if (this.isOpen)
							this.dbSaveProc(e)
						e.tx = tx;
						resolve(tx)
					},
					err => {
						if (err.code !== 0) {
							if (err.code == 1)		// disk i/o error
								location.reload(false);
							reject(err)
							// throw err
						}
					}
				)
			});
		}
		transaction() { return this.getTx({ readOnly: false }) }
		readTransaction() { return this.getTx({ readOnly: true }) }
		async transactionDo(e) {
			e = e || {};
			let callback;
			if ($.isFunction(e)) {
				callback = e;
				e = {};
			}
			else {
				callback = e.callback;
			}

			let {dbOpCallback} = this;
			if (!$.isFunction(dbOpCallback))
				dbOpCallback = null;
			
			if (dbOpCallback)
				await dbOpCallback.call(this, { operation: 'transactionDo', state: true }, e);
			
			try {
				const hasTx = !!e.tx;
				let tx = await this.getTx(e);
				if ($.isFunction(callback)) {
					e.result = await callback.call(this, tx, e);
					if (e.result === false)
						this.abortTransaction();
					if (!hasTx)
						tx = e.tx = await this.getTx();
				}
				if (dbOpCallback)
					await dbOpCallback.call(this, { operation: 'transactionDo', state: false }, e);
				
				return e.result;
			}
			catch (ex) {
				if (dbOpCallback)
					await dbOpCallback.call(this, { operation: 'transactionDo', state: null, error: ex }, e);
				throw ex;
			}
		}

		readTransactionDo(e) {
			if ($.isFunction(e))
				e = { callback: e };
			
			return this.transactionDo($.extend({}, e, { readOnly: true }));
		}

		abortTransaction() { throw { isError: false, rc: 'runtimeInterrupt', errorText: 'Transaction abort signal' } }

		async executeSql(e, _params, isRetry) {
			e = e || {};
			if (!e.query)
				e = { query: e }
			if (_params !== undefined)
				e.params = _params
			const savedParams = e.params;
			let _query = e.query;
			const isDBWrite = this.isDBWrite(_query);
			if (_query && _query.getQueryYapi) $.extend(e, _query.getQueryYapi())
			else if (_query.query) $.extend(e, _query)
			else e.query = (_query || '').toString()
			if (!e.query) return null
			if (!$.isEmptyObject(savedParams)) {
				let {params} = e; if ($.isEmptyObject(params)) params = e.params = savedParams
				else if (params != savedParams) {
					if ($.isArray(params)) params.push(...savedParams)
					else $.extend(params, savedParams)
				}
			}
			if (typeof e.query == 'string') {
				if (e.query.toUpperCase().includes('NOT NULL AUTO')) {
					e.query = e.query.replaceAll('rowid\t', '--rowid\t')
									.replaceAll('rowid ', '--rowid ')
				}
			}
			
			let {dbOpCallback} = this;
			if (!$.isFunction(dbOpCallback))
				dbOpCallback = null
			if (dbOpCallback)
				await dbOpCallback.call(this, { operation: 'executeSql', state: true }, e)
			try {
				let tx = await this.getTx(e);
				let rs = e.rs = await new Promise(async (resolve, reject) => {
					try {
						this.dbLastExec = e;
						console.debug('db exec', e);
						await tx.executeSql(
							e.query, e.params || [],
							(_tx, _rs) => { resolve(_rs) },
							(_tx, _err) => { e; /*debugger;*/ reject(_err) },
						)
					}
					catch (ex) { reject(ex) }
				});
				let result = rs;
				if (e.return == 'rows')
					result = rs.rows ? $.makeArray(rs.rows) : null
				else if (e.return == 'rowsBasic')
					result = rs.rows
				if (result != null && ( isDBWrite || (typeof _result == 'number' && result) ))
					this.hasChanges = true
				this.dbSaveProc(e);
				if (dbOpCallback)
					setTimeout(() => dbOpCallback.call(this, { operation: 'executeSql', state: false }, e), 20)
				return result
			}
			catch (ex) {
				if (dbOpCallback)
					setTimeout(() => dbOpCallback.call(this, { operation: 'executeSql', state: null, error: ex }, e), 20)
				if (!isRetry) {
					const message = ex.message || '';
					if (message.includes('no such column') || message.includes('olumn does not exist')) {
						if ((sky.app || {}).tabloEksikleriTamamla) {
							if (e.tx)
								e.tx = await this.getTx();
							await sky.app.tabloEksikleriTamamla($.extend({}, e, { noCacheReset: true }));
							return await this.executeSql(e, _params, true)
						}
					}
				}
				throw ex
			}
		}
		executeSqlReturnRowsBasic(e, _params) {
			e = e || {};
			if (!e.query)
				e = { query: e }
			return this.executeSelect($.extend({}, e, { return: 'rowsBasic' }), _params);
		}
		executeSqlReturnRows(e, _params) {
			e = e || {};
			if (!e.query)
				e = { query: e }
			return this.executeSelect($.extend({}, e, { return: 'rows' }), _params);
		}
		executeSelect(e, _params) {
			e = e || {};
			if (!e.query) e = { query: e }
			if (!e.tx && e.readOnly == null) e.readOnly = true
			return this.executeSql($.extend({}, e), _params);
		}
		async tekilExecuteSelect(e, _params) {
			e = e || {}; if (!e.query) e = { query: e }; let {query} = e;
			/*if (typeof query != 'string') {
				const queryYapi = e.query.getQueryYapi();
				query = e.query = queryYapi.query;
				if (!$.isEmptyObject(queryYapi.params))
					_params = e.params = [queryYapi.params, ...(_params || [])]
			}*/
			if (typeof query == 'string') {
				let queryUpper = query.toUpperCase();
				if (!queryUpper.includes('LIMIT 1')) {
					const Postfix = 'LIMIT 1';
					let ind = query.indexOf(' OFFSET');
					query = e.query = ind < 0 ? `${query} LIMIT 1` : `${query.substring(0, ind)} LIMIT 1${query.substring(ind)}`
				}
			}
			else
				query.limit = 1
			let rs = await this.executeSql(e, _params);
			return rs.rows.length ? rs.rows[0] : null
		}
		async tekilDegerExecuteSelect(e, _params) {
			e = e || {}; if (!e.query) e = { query: e }; let {query} = e;
			/*if (typeof query != 'string') {
				const queryYapi = e.query.getQueryYapi();
				query = e.query = queryYapi.query;
				if (!$.isEmptyObject(queryYapi.params))
					_params = e.params = [queryYapi.params, ...(_params || [])]
			}*/
			let rec = await this.tekilExecuteSelect(e, _params);
			return rec ? Object.values(rec)[0] : null;
		}
		async insertOrReplaceTable(e) {
			e = e || {}; let hvList = e.hvListe || e.hvList || (e.hv ? [e.hv] : null);
			if ($.isEmptyObject(hvList)) return false
			let mode = e.mode || 'insertIgnore'; const {table} = e;
			let parcaSize = e.parcaSize || 30, parcaCallback = $.isFunction(e.parcaCallback) ? e.parcaCallback : null;
			let valuesTemplate, query; $.extend(e, { queries: [], index: 0, count: hvList.length, parcaSize: parcaSize });
			let chunkIndex = -1, islemBlock = async (tx, _hvList) => {
				query = '';
				let params = [];
				chunkIndex++;
				if (!chunkIndex) {
					const {preExecQueries} = e;
					if (preExecQueries) {
						for (const queryYapi of preExecQueries) {
							query += `${queryYapi.query} GO `;
							if (!$.isEmptyObject(queryYapi.params))
								params.push(...queryYapi.params)
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
				let atBegin = true;
				query += ` INTO ${table} (`;
				for (const key in hv) {
					const value = hv[key];
					if (!atBegin)
						query += `, `;
					atBegin = false;
					query += key
				}
				query += `) VALUES `;
				atBegin = true;
				for (const hv of _hvList) {
					for (const key in hv) {
						let value = hv[key];
						if (value != null && value.valueOf)
							value = value.valueOf()
						params.push(value)
					}
					if (!atBegin)
						query += `, `
					atBegin = false;
					query += `(${valuesTemplate})`
				}
				query += e.queryPostfix || '';
				e.queries.push(query);
				
				let _e = { tx: tx, query: query, params: params };
				let _result = await this.executeSql(_e);
				if (_result !== false) {
					$.extend(e, { rs: _e.rs, result: _e.result });
					e.index += _hvList.length;
					_e = $.extend({}, _e, e, { parca: _hvList, parcaSize: _hvList.length });
					if ((_e.rs ?? _e).insertId == null)
						_e.insertId = asInteger(await this.tekilDegerExecuteSelect(`SELECT MAX(rowid) FROM ${table}`))
					if (parcaCallback) {
						let __result = await parcaCallback.call(this, _e) || {};
						if (__result === false)
							return false
						this.hasChanges = true;
						$.extend(_result, __result, { rs: e.rs })
					}
				}
				return _result
			};
			const asilBlock = async tx => {
				return await Utils.arrayParcalaAndDo({
					source: hvList, parcaSize: parcaSize,
					callback: e => islemBlock(tx, e.part)
				})
			}
			let {tx} = e;
			if (tx)
				return await asilBlock(tx)
			const result = await this.transactionDo(async tx =>
				await asilBlock(tx));
			this.dbSaveProc(e);
			return result;
		}
		dbSaveProc(e) {
			if (!this.dbSave)
				return
			e = e || {};
			const {DBSaveTimerKey, DBSave_MinIdleTimeMS, DBSaveTimer_MinIdleTimeMS} = this.class;
			clearTimeout(this[DBSaveTimerKey]);
			this[DBSaveTimerKey] = setTimeout(async () => {
				try {
					let {_lastSave_timestamp, dbName, db, hasChanges} = this;
					const farkMS = (now() - _lastSave_timestamp);
					if (!_lastSave_timestamp || farkMS > DBSave_MinIdleTimeMS) {
						this._lastSave_timestamp = now();
						await this.dbSave(e);
						this._lastSave_timestamp = now();
						if (console.group)
							console.group('dbSaveProc', 'timer trigger')
						const _e = { dbName, db, lastSave_timestamp: this._lastSave_timestamp, farkMS, hasChanges };
						if (hasChanges)
							console.warn(_e)
						else
							console.debug(_e)
						if (console.groupEnd)
							console.groupEnd()
					}
				}
				finally { delete this[DBSaveTimerKey] }
			}, DBSaveTimer_MinIdleTimeMS)
		}
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
	}
})();
