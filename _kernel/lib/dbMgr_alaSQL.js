(function() {
	window.DBMgr_AlaSQL = class extends window.DBMgr_WebSQL {
		get webSQLmi() { return false }
		get alaSQLmi() { return true }
		static UseIndexedDB = false;
		static DBTableKeys = null /* ['columns', 'uniqs', 'data'] */;
		static DBDelimHash = '`';
		static Postfix_FN = '.fn';
		constructor(e) {
			e = e || {};
			super(e);
			this.isIndexedDB = e.indexedDB ?? qs.indexedDB ?? qs.indexeddb ?? this.class.UseIndexedDB;
			this.forbiddenQueries = e.forbiddenQueries ?? [ `AS (` ];
			this.replaceQueries = e.replaceQueries ?? ({
				'AUTO INCREMENT': 'AUTOINCREMENT',
				' ON DELETE CASCADE': '',
				' INDEX IF NOT EXISTS': ' INDEX',
				' INDEX IF EXISTS': ' INDEX'
				// 'NOT NULL DEFAULT': 'DEFAULT',
				// 'NULL DEFAULT': 'DEFAULT'
			});
			this.hasChanges = e.hasChanges ?? false;
			this.changedTables = e.changedTables ?? {};
		}
		async open(e) {
			let {db} = this;
			if (!this.isOpen) {
				const {dbName, app, isIndexedDB} = this;
				$.extend(alasql.options, {
					autocommit: false, cache: true, casesensitive: true, modifier: '',
					sqlite: true, tsql: true, postgres: false, mysql: false, orientdb: false, oracle: false
				});
				let {fs} = this;
				if (!fs) {
					fs = (await Utils.getFS()).fs;
					console.debug('init fs', fs)
				}
				try {
					if (isIndexedDB) {
						await alasql.promise(`CREATE IndexedDB DATABASE IF NOT EXISTS ${dbName}`);
						console.debug('indexed db create', dbName, db);
						await alasql.promise(`ATTACH IndexedDB DATABASE ${dbName}`)
						console.debug('indexed db attach', dbName, db)
					}
					else {
						await alasql.promise(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
						console.debug('memory db create', dbName, db)
					}
					this.db = db = alasql.databases[dbName];
					if (app?.tablolariOlusturIslemi)
						await app.tablolariOlusturIslemi()
				}
				catch (ex) {
					console.error({ ex, dbMgr: this, dbLastExec: this.dbLastExec });
					throw ex
				}
				await this.dbLoad();
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
			const {dbName, db} = this;
			delete this.db;
			console.debug('db close', dbName, db);
			return db
		}
		async dbLoad(e, _dataOnly) {
			if (!this.isOpen)
				return false
			if (this.isIndexedDB)
				return true
			e = e || {};
			const {DBTableKeys, Postfix_FN} = this.class;
			const tables = $.isArray(e) ? e : e.tables;
			const tableSet = tables ? asSet(tables) : null;
			const dataOnly = e.dataOnly ?? _dataOnly;
			const {app, dbName, db, dbStoragePath, fs} = this;
			const {indicatorPart} = app;
			const promises = [];
			try {
				if (indicatorPart?.dbCallback)
					await indicatorPart.dbCallback({ state: true })
				let rootDir;
				try { rootDir = await Utils.getFSDirHandle(dbStoragePath, false, { fs }) }
				catch (ex) { if (!ex?.code || ex?.code != ex.NOT_FOUND_ERR); return false }
				for await (const [table, dh] of rootDir) {
					if (tableSet && !tableSet[table])
						continue
					promises.push(new $.Deferred(async p => {
						const tableObj = db.tables[table] || new alasql.Table();
						const _tableObj = {};
						try {
							for (let key of (DBTableKeys || Object.keys(tableObj))) {
								let fh;
								try { fh = await dh.getFileHandle(key, { create: false }) }
								catch (ex) { if (!ex?.code || ex?.code != ex.NOT_FOUND_ERR) throw ex }
								if (!fh)
									continue
								let isFunction = key.endsWith(Postfix_FN);
								if (isFunction)
									key = key.slice(0, -Postfix_FN.length)
								if (dataOnly && key != 'data')
									continue
								const data = await (await fh.getFile()).text();
								let value = data ? JSON.parse(data) : undefined;
								if (value === undefined)
									continue
								if (isFunction) {
									if (value) {
										if (value[0] != '(')
											value = '(' + value
										if (value[value.length - 1] != ')')
											value += ')'
										value = eval(value)
									}
									else
										value = null
								}
								if (key == 'columns') {
									let {columns} = tableObj;
									tableObj.indexColumns();
									let {xcolumns} = tableObj;
									if (!xcolumns)
										xcolumns = tableObj.xcolumns = {}
									const _columns = value;
									if (_columns) {
										for (const colObj of _columns) {
											const name = colObj.columnid;
											if (!xcolumns[name]) {
												xcolumns[name] = colObj;
												columns.push(colObj)
											}
										}
									}
									// tableObj.indexColumns()
								}
								else
									_tableObj[key] = value
							}
							if (db.tables[table])
								$.extend(tableObj, _tableObj)
							else
								db.tables[table] = tableObj
							console.log('  ', '  ', 'db read', 'table', table, _tableObj)
							p.resolve({ table, tableObj })
						}
						catch (ex) { p.reject({ table, tableObj, ex }) }
					}))
				}
				await Promise.all(promises);
				console.debug('db load', dbName, fs, rootDir, db.tables);
				if (indicatorPart?.dbCallback)
					await indicatorPart.dbCallback({ state: false })
				return true
			}
			catch (ex) {
				if (!ex?.code || ex?.code != ex.NOT_FOUND_ERR)
					console.error(ex)
				if (indicatorPart?.dbCallback)
					await indicatorPart.dbCallback({ state: null })
				return false
			}
		}
		async dbSave(e, _dataOnly, _force) {
			if (!this.isOpen)
				return false
			if (this.isIndexedDB)
				return true
			e = e || {};
			let forceFlag = asBool(e.force ?? _force ?? false);
			if (!(forceFlag || this.hasChanges))
				return null
			const {DBTableKeys, Postfix_FN} = this.class;
			let tables = $.isArray(e) ? e : e.tables;
			if (!tables) {
				const {changedTables} = this;
				if (!$.isEmptyObject(changedTables))
					tables = e.tables = Object.keys(changedTables)
			}
			const tableSet = tables ? asSet(tables) : null;
			const dataOnly = e.dataOnly ?? _dataOnly;
			const {app,dbName, db, dbStoragePath, fs} = this;
			const {indicatorPart} = app;
			const promises = [];
			try {
				if (indicatorPart?.dbCallback)
					await indicatorPart.dbCallback({ state: true })
				const rootDir = await Utils.getFSDirHandle(dbStoragePath, true, { fs });
				for (const table in db.tables) {
					if (tableSet && !tableSet[table])
						continue
					const dh = await rootDir.getDirectoryHandle(table, { create: true });
					const tableObj = db.tables[table];
					promises.push(new $.Deferred(async p => {
						try {
							for (let key of (DBTableKeys || Object.keys(tableObj))) {
								if (dataOnly && key != 'data')
									continue
								const value = tableObj[key];
								try { await dh.removeEntry(key) } catch (ex) { }
								if ($.isEmptyObject(value))
									continue
								if ($.isFunction('function'))
									key += Postfix_FN
								const data = toJSONStr(value);
								const fh = await dh.getFileHandle(key, { create: true });
								const sw = await fh.createWritable();
								try { await sw.write(data) }
								finally { await sw.close() }
							}
							console.log('  ', '  ', 'db save', 'table', table, tableObj);
							p.resolve({ table, tableObj })
						}
						catch (ex) { p.reject({ table, tableObj, ex }) }
					}))
				}
				await Promise.all(promises);
				this.changedTables = {};
				this.hasChanges = false;
				console.debug('db save', dbName, fs, rootDir, db.tables);
				if (indicatorPart?.dbCallback)
					await indicatorPart.dbCallback({ state: false })
				return true
			}
			catch (ex) {
				if (!ex?.code || ex?.code != ex.NOT_FOUND_ERR)
					console.error(ex)
				if (indicatorPart?.dbCallback)
					await indicatorPart.dbCallback({ state: null })
				return false
			}
		}
		async dbClear() {
			const {isIndexedDB, dbName, dbStoragePath, fs} = this;
			let {db} = this;
			await this.close();
			if (isIndexedDB) {
				// await alasql.promise(`DETACH DATABASE ${dbName}`);
				await alasql.promise(`DROP IndexedDB DATABASE ${dbName}`);
				console.log('  ', '  ', 'indexed db clear', 'db-obj', dbName, db?.tables)
			}
			else {
				await alasql(`DROP DATABASE IF EXISTS ${dbName}`);
				console.log('  ', '  ', 'memory db clear', 'db-obj', dbName, db?.tables)
				try {
					const rootDir = await Utils.getFSDirHandle(dbStoragePath, false, { fs });
					await rootDir.remove({ recursive: true });
					console.log('  ', '  ', 'memory db clear', 'fs', dbName, fs, rootDir)
				}
				catch (ex) {
					if (!ex?.code || ex?.code != ex.NOT_FOUND_ERR)
						console.error(ex)
				}
			}
			
			// const db = this.db = new alasql.Database(dbName);
			await this.open();
			db = this.db;
			console.warn('db clear', dbName, fs, db);
			return true
		}
		tables(names) {
			if (!this.isOpen)
				return null
			if (typeof names == 'string')
				names = [names]
			if (names && $.isArray(names))
				names = asSet(names)
			let result = [];
			for (const name in this.db.tables) {
				if (!names || names[name])
					result.push(name)
			}
			return result
		}
		columns(table, names) {
			if (!this.isOpen)
				return null
			if (typeof names == 'string')
				names = [names]
			if (names && $.isArray(names))
				names = asSet(names)
			const tableObj = this.db.tables[table];
			if (!tableObj)
				return null
			let result = [];
			if (!$.isEmptyObject(tableObj.xcolumns)) {
				if (names) {
					for (const name in names) {
						if (tableObj.xcolumns[name])
							result.push(name)
					}
				}
				else {
					result.push(...
						( $.isEmptyObject(tableObj.columns) ? Object.keys(tableObj.xcolumns) : tableObj.columns )
					)
				}
			}
			else if (tableObj.columns) {
				for (const {columnid} in tableObj.columns) {
					if (!names || names[columnid])
						result.push(columnid)
				}
			}
			return result
		}
		async getTx(e) {
			e = e || {};
			if (e.tx)
				return e.tx
			if (!this.isOpen)
				await this.open()
			if (this.isOpen)
				this.dbSaveProc(e)
			return {}
		}
		async executeSql(e, _params, isRetry) {
			e = e || {};
			if (!e.query)
				e = { query: e }
			if (_params !== undefined)
				e.params = _params
			const savedParams = e.params;
			let _query = e.query;
			const isDBWrite = this.isDBWrite(_query);
			if (_query && _query.getQueryYapi)
				$.extend(e, _query.getQueryYapi())
			else if (_query.query)
				$.extend(e, _query)
			else
				e.query = (_query || '').toString()
			if (!e.query)
				return null
			if (!$.isEmptyObject(savedParams)) {
				let {params} = e;
				if ($.isEmptyObject(params))
					params = e.params = savedParams
				else if (params != savedParams) {
					if ($.isArray(params))
						params.push(...savedParams)
					else
						$.extend(params, savedParams)
				}
			}

			/*if (typeof e.query == 'string' && e.query.includes('CREATE TABLE IF NOT EXISTS mst_SonStok'))
				debugger*/

			let query = e.query?.toUpperCase()?.trim();
			if (query) {
				if (query.includes('ALTER TABLE ') && query.includes('ADD ') && !query.includes('ADD COLUMN ')) {
					e.query = e.query.replaceAll('ADD ', 'ADD COLUMN ');
					query = e.query.toUpperCase().trim()
				}
				if (query.includes('ALTER TABLE ') && query.includes('ADD COLUMN ') && (query.includes(' DEFAULT') || query.includes('NULL')) ) {
					e.query = e.query
						.replaceAll('NOT NULL ', '')
						.replaceAll('NOT NULL', '')
						.replaceAll('NULL ', '')
						.replaceAll('NULL', '')
						.replaceAll(` DEFAULT ''`, '')
						.replaceAll(` DEFAULT 0`, '')
						.replaceAll(` DEFAULT 1`, '');
					query = e.query.toUpperCase().trim()
				}
					
				const {forbiddenQueries, replaceQueries} = this;
				for (let subQuery of query.split('\n')) {
					subQuery = subQuery?.trim();
					if (!subQuery || subQuery.startsWith('--'))
						continue
					if (!$.isEmptyObject(forbiddenQueries)) {
						for (const matchQuery of forbiddenQueries) {
							if (!subQuery.startsWith('--') && subQuery.includes(matchQuery)) {
								// console.log({ isError: true, rc: 'queryDenied', query: subQuery, errorText: `Bu query AlaSQL üzerinde çalıştırılamaz`, query: query });
								return null
							}
						}
					}
					if (!$.isEmptyObject(replaceQueries)) {
						for (const [matchQuery, replace] of Object.entries(replaceQueries)) {
							if (subQuery.includes(matchQuery))
								e.query = e.query.replaceAll(matchQuery, replace || '')
						}
						subQuery = e.query.toUpperCase().trim()
					}
					/*if (subQuery.includes('REPLACE INTO '))
						e.query = e.query.replaceAll('REPLACE INTO ', 'INSERT OR REPLACE INTO ')*/
				}
			}
			let {dbOpCallback} = this;
			if (!$.isFunction(dbOpCallback))
				dbOpCallback = null
			if (dbOpCallback)
				await dbOpCallback.call(this, { operation: 'executeSql', state: true }, e)

			const {isIndexedDB} = this;
			let _result;
			this.dbLastExec = e;
			console.group('db exec'); console.log(e); console.ungroup();
			alasql.useid = this.db.databaseid;
			try {
				_result = await alasql.promise(e.query, e.params)
				/*_result = await new $.Deferred(p => {
					try { db.exec(e.query, e.params, res => p.resolve(res)) }
					catch (ex) { p.reject(ex, { dbMgr: this, queryYapi: e }) }
				})-/
				/*if (isIndexedDB) {
					_result = await new $.Deferred(p => {
						try { db.exec(e.query, e.params, res => p.resolve(res)) }
						catch (ex) { p.reject(ex, { dbMgr: this, queryYapi: e }) }
					})
				}
				else
					_result = db.exec(e.query, e.params)*/
			}
			catch (ex) {
				if (!isRetry) {
					const message = ex.message || '';
					if (message.includes('no such column') || message.includes('olumn does not exist')) {
						const {app} = this;
						if (app?.tabloEksikleriTamamla) {
							await app.tabloEksikleriTamamla($.extend({}, e, { noCacheReset: true }));
							return await this.executeSql(e, _params, true)
						}
					}
				}
				if (dbOpCallback)
					await dbOpCallback.call(this, { operation: 'executeSql', state: null, error: ex }, e)
				throw ex
			}
			if (_result == null)
				return _result
			if (isDBWrite || (typeof _result == 'number' && result)) {
				this.hasChanges = true;
				this.dbSaveProc(e)
			}
			let result = { rows: _result };
			const returnType = e.return;
			switch (returnType) {
				case 'rows':
				case 'rowsBasic':
					result = result.rows;
					break
			}
			if (dbOpCallback)
				setTimeout(() => dbOpCallback.call(this, { operation: 'executeSql', state: false }, e), 20)
			return result
		}
		async insertOrReplaceTable(e) {
			e = e || {};
			const DelimHash = this.class.DBDelimHash;
			let hvListe = e.hvListe || e.hvList || (e.hv ? [e.hv] : null);
			if ($.isEmptyObject(hvListe))
				return false
			let mode = e.mode || 'insertIgnore';
			if (mode == 'insertIgnore' || mode == 'replace') {
				const {tables} = this.db;
				const {table} = e;
				const /*hash2HV = {},*/ hash2KeyHV = {}, keyHVListe = [];
				const columns = tables[table]?.pk?.columns;
				const getHash = (keys, hv) => keys.map(key => hv[key]).join(DelimHash);
				if (columns) {
					for (const hv of hvListe) {
						const keyHV = {}
						for (const key of columns) {
							const value = hv[key]
							if (value !== undefined)
								keyHV[key] = value
						}
						if ($.isEmptyObject(keyHV))
							continue
						const hash = getHash(Object.keys(keyHV), keyHV);
						if (hash2KeyHV[hash])
							continue
						// hash2HV[getHash(Object.keys(hv), hv)] = hv;
						hash2KeyHV[hash] = keyHV;
						keyHVListe.push(keyHV)
					}
				}
				if (!$.isEmptyObject(keyHVListe)) {
					const keyHV_ilk = keyHVListe[0];
					const keyHVKeys = Object.keys(keyHV_ilk);
					const duplicateSent = new MQSent({
						from: `${table} asil`,
						fromIliskiler: [ { from: ':tmp tmp', iliski: keyHVKeys.map(key => `asil.${key} = tmp.${key}`) } ],
						sahalar: `CONCAT(${keyHVKeys.map(key => `asil.${key}`).join(`, '${DelimHash}', `)}) hash`
					}).distinctYap();
					const duplicateHashRecs = await this.executeSqlReturnRows({ query: duplicateSent, params: { tmp: keyHVListe } });
					const duplicateHashes = asSet(duplicateHashRecs.map(rec => rec.hash.trimEnd()));
					const duplicateHVListe = [], insertHVListe = [];
					for (const hv of hvListe) {
						const hash = getHash(keyHVKeys, hv);
						const isDuplicate = !!duplicateHashes[hash];
						if (isDuplicate) {
							for (const key of keyHVKeys)
								delete hv[key]
							duplicateHVListe.push(hv)
						}
						else
							insertHVListe.push(hv)
					}
					for (const key of ['hvList', 'hv'])
						delete e[key]
					if (mode == 'replace') {
						for (const hv of duplicateHVListe) {
							const hash = getHash(keyHVKeys, hv);
							const keyHV = hash2KeyHV[hash];
							const preExecQueries = e.preExecQueries = e.preExecQueries || [];
							preExecQueries.push({
								query: new MQIliskiliUpdate({
									from: table,
									where: { birlestirDict: keyHV },
									set: { birlestirDict: hv }
								})
							})
						}
					}
					hvListe = e.hvListe = insertHVListe;
					mode = e.mode = 'insert'
				}
			}
			if ($.isEmptyObject(hvListe))
				return false
			
			const parcaCallback = $.isFunction(e.parcaCallback) ? e.parcaCallback : null;
			const parcaSize = e.parcaSize ?? 500;
			$.extend(e, { index: 0, hvKeys: Object.keys(hvListe[0]) });
			if (parcaSize && hvListe.length > parcaSize) {
				const kalanHVListe = [...hvListe];
				while (kalanHVListe.length) {
					const subHVListe = kalanHVListe.splice(0, parcaSize);
					if (!subHVListe.length)
						break
					$.extend(e, { parca: subHVListe, parcaSize: subHVListe.length, parcaCallback: parcaCallback });
					await this.insertOrReplaceTableInternal(e);
					e.index += e.parcaSize
				}
			}
			else {
				$.extend(e, { parcaCallback: parcaCallback, parca: hvListe, parcaSize: hvListe.length });
				await this.insertOrReplaceTableInternal(e);
				e.index += e.parcaSize
			}
			return true
		}
		async insertOrReplaceTableInternal(e) {
			let hvListe = e.parca;
			const parcaCallback = $.isFunction(e.parcaCallback) ? e.parcaCallback : null;
			delete e.parcaCallback;
			const {table, hvKeys} = e;
			const query = `SELECT ${hvKeys.join(', ')} INTO ${table} FROM :data`;
			const params = { data: hvListe };
			const result = await this.executeSql(query, params);
			this.hasChanges = this.changedTables[table] = true;
			if (parcaCallback) {
				let _result = await parcaCallback.call(this, e) || {};
				if (_result === false)
					return false
				if (typeof _result == 'object' && !$.isEmptyObject(_result))
					$.extend(result, _result)
			}
			return result
		}
	}
})()
