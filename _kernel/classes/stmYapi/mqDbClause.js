(function() {
	window.MQClause = class extends window.MQSQLOrtak {
		static get baglacsizmi() { return false }
		static get baglac() { return ', ' }
		static get onEk() { return '' }
		constructor(e) {
			e = e || {};
			super(e);
			if ($.isArray(e))
				e = { liste: e }
			else if (typeof e != 'object')
				e = { liste: [e] }
			this.parantezlimi = asBool(e.parantezlimi || e.parantezli);
			this.liste = [];
			if (!$.isEmptyObject(e.liste))
				this.addAll(e.liste)
			let value = e.birlestir;
			if (value)
				this.birlestir(value)
		}
		add(e) {
			if (!e && typeof e != 'number')
				return
			e = this.donusmusDeger(e);
			if (e != null)
				this.liste.push(e)
			return e
		}
		addAll(coll) {
			if (coll && coll.liste)
				coll = coll.liste
			if ($.isPlainObject(coll) && !$.isArray(coll))
				coll = Object.keys(coll)
			for (const item of coll)
				this.add(item)
		}
		birlestir(anMQClause) {
			this.addAll(anMQClause.liste);
			const _params = anMQClause.params;
			if (!$.isEmptyObject(_params)) {
				const params = this.params = this.params || [];
				params.push(..._params)
			}
		}		
		donusmusDeger(item) { return item }
		buildString(e) {
			super.buildString(e);
			const clause = this.toString_baslangicsiz(e);
			if (clause) {
				const onEk = this.class.onEk;
				e.result += `${onEk ? onEk + ' ' : ''}${clause}`;
			}
		}
		getQueryYapi_baslangicsiz(e) {
			e = e || {};
			const query = this.toString_baslangicsiz(e);
			return {
				query: query,
				params: this.params
			}
		}
		toString_baslangicsiz(e) {
			e = $.extend({}, e, { result: '' });
			this.buildString_baslangicsiz(e);
			return e.result;
		}
		buildString_baslangicsiz(e) {
			const doluListe = this.liste.filter(item =>
									typeof item != 'string' || item.trim());
			const Baglac = this.class.baglac;
			const {parantezlimi} = this;
			if (!$.isEmptyObject(doluListe)) {
				//let _doluListe = [];
				if (doluListe.length && parantezlimi)
					e.result += '('
				for (let ind in doluListe) {
					ind = asInteger(ind);
					const item = doluListe[ind];
					let text = item.toString();
					// _doluListe.push(text);
					if (ind && item && !(item.class || {}).baglacsizmi)
						e.result += Baglac;
					e.result += text;
					let _params = item && item.params ? item.params : null;
					if (_params)
						(e.params || []).push(..._params)
				}
				if (doluListe.length && parantezlimi)
					e.result += ')'
				// e.result += _doluListe.join(this.class.baglac);
			}
			let _params = this.params;
			if (_params)
				(e.params || []).push(..._params)
		}
		parantezli() { this.parantezlimi = true; return this }
		parantezsiz() { this.parantezlimi = false; return this }
	};
	window.MQSahalar = class extends window.MQClause {
		donusmusDeger(item) {
			if (typeof item != 'object')
				return MQAliasliYapi.newForSahaText(item)
			return item
		}
	};
	window.MQZincirler = class extends window.MQClause {
		optimize(e) {
			/* liste: [
					["fis", "har"]
					["har", "stk"]
					["fis", "car"]
					["car", "bol"]
				]
			*/
			const {liste} = this;
			for (let i = liste.length - 1; i > 0; i--) {			// (i > 0) ==> ilk elemana bakılmaz
				const altDizi = liste[i];
				const ilk = altDizi[0];
				for (let j = i - 1; j >= 0; j--) {
					const ustDizi = liste[j];
					if (ustDizi[ustDizi.length - 1] == ilk) {
						ustDizi.push(...(altDizi.slice(1)));
						liste.splice(i, 1);
						break
					}
				}
			}
		}
	};
	window.MQGroupByClause = class extends window.MQClause {
		static get onEk() { return `	GROUP BY	` }
		buildString_baslangicsiz(e) {
			//if (!sky.app?.dbMgr_mf?.alaSQLmi)
			super.buildString_baslangicsiz(e)
		}
	};
	window.MQFromClause = class extends window.MQClause {
		static get onEk() { return `	FROM	` }
		donusmusDeger(item) {
			if (typeof item != 'object')
				return MQTable.newForFromText(item)
			return item
		}
		aliasIcinTable(alias) {
			return this.liste.find(anMQTable => anMQTable.aliasVarmi(alias))
		}
		iliskiler2Where(e) {
			const birlesikWhere = e.where;
			for (const anMQTable of this.liste) {
				for (const anMQIliskiYapisi of anMQTable.iliskiler)
					birlesikWhere.add(anMQIliskiYapisi.toString())
			}
		}
		// kullanılmayan tablolar içerdiği ilişkiler ile silinecek.
		//		table içindeki (left, inner) için de aynı kural geçerli
		disindakiTablolariSil(e) {
			const {disindaSet} = e;
			const {liste} = this;
			for (let i = liste.length - 1; i >= 0; i--) {
				let anMQTable = liste[i];
				if (disindaSet[anMQTable.alias])
					anMQTable.disindakiXTablolariSil(e)
				else
					liste.splice(i, 1)
			}
		}
	};
	window.MQSubWhereClause = class extends window.MQClause {
		static get baglac() { return `${CrLf}	  AND	 ` }
		constructor(e) {
			e = e || {};
			const initBlock = e => {
				if (!$.isPlainObject(e)) {
					this.add(e);
					return true;
				}
				let value = e.inDizi;
				if (value !== undefined) {
					this.inDizi({ liste: value, saha: e.saha, not: e.not });
					return true;
				}
				value = e.notInDizi;
				if (value !== undefined) {
					this.notInDizi({ liste: value, saha: e.saha });
					return true;
				}
				value = e.degerAta;
				if (value !== undefined) {
					this.degerAta({ deger: value, saha: e.saha, not: e.not });
					return true;
				}
				value = e.notDegerAta;
				if (value !== undefined) {
					this.notDegerAta({ deger: value, saha: e.saha });
					return true;
				}
				value = e.like;
				if (value !== undefined) {
					this.like({ deger: value, saha: e.saha, not: e.not, aynenAlinsin: e.aynenAlinsin });
					return true;
				}
				value = e.notLike;
				if (value !== undefined) {
					this.notLike({ deger: value, saha: e.saha, aynenAlinsin: e.aynenAlinsin });
					return true;
				}
				value = e.birlestirDict;
				if (value !== undefined) {
					this.birlestirDict({ alias: e.alias, dict: value, not: e.not });
					return true;
				}
				value = e.birlestir;
				if (value !== undefined) {
					this.birlestir(value);
					return true;
				}
				return false;
			};

			super({ liste: e.liste, params: e.params, parantezlimi: e.parantezlimi, parantezli: e.parantezli });
			if ($.isArray(e)) {
				if (!$.isEmptyObject(e)) {
					e.forEach(_e =>
						initBlock(_e));
				}
			}
			else {
				initBlock(e);
			}

			/*let value = e.birlestirDict;
			if (value)
				this.birlestirDict({ alias: e.alias, dict: value, not: e.not });*/
		}
		birlestirDict(e) {
			e = e || {};
			const dict = e.dict || e.birlestirDict || e.liste || e;
			const aliasVeNokta = e.alias ? `${e.alias}.` : ``;
			if (!$.isEmptyObject(dict)) {
				$.each(dict, (key, value) =>
					this.degerAta({ not: e.not, deger: value, saha: `${aliasVeNokta}${key}` }))
			}
		}
		notBirlestirDict(e) {
			e = e || {};
			const dict = e.dict || e.birlestirDict || e.liste;
			if (!dict)
				e = { dict: e }
			e.not = true;
			return this.birlestirDict(e)
		}
		degerAta(e, _saha) {
			e = (e || {}).saha ? e : { deger: e, saha: _saha };
			let isNot = typeof e == 'object' && asBool(e.not);
			// this.params.push(e.deger);
			const {saha, deger} = e;
			return this.add(
				deger == null
					? `${saha} IS${isNot ? ' NOT' : ''} NULL`
					: `${saha} ${isNot ? '<>' : '='} ${this.class.sqlDegeri(deger)}`
			)
		}
		notDegerAta(e, _saha) {
			e = e.saha ? $.extend({}, e) : { deger: e, saha: _saha };
			e.not = true;
			return this.degerAta(e)
		}
		inDizi(e, _saha) {
			e = e.saha ? e : { liste: e, saha: _saha };
			let liste = e.liste = e.liste || [];
			let inClause = liste.liste ? liste : new MQInClause({ liste: liste, saha: e.saha });
			inClause.isNot = typeof e == 'object' && asBool(e.not);
			return this.add(inClause)
		}
		notInDizi(e, _saha) {
			e = e.saha ? $.extend({}, e) : { liste: e, saha: _saha };
			e.not = true;
			return this.inDizi(e)
		}
		like(e, _saha) {
			e = e.saha ? e : { deger: e, saha: _saha };
			let isNot = typeof e == 'object' && asBool(e.not);
			// this.params.push(e.deger);
			let aynenAlinsinmi = asBool(e.aynenAlinsin);
			let likeDeger = (e.deger || '').toString();
			if (!(aynenAlinsinmi || (likeDeger && (likeDeger.slice(-1) == '%' || likeDeger.slice(-1) == '*'))))
				likeDeger += '%'
			return this.add(`${e.saha} ${isNot ? 'NOT ' : ''}LIKE '${likeDeger}'`)
		}
		notLike(e, _saha) {
			e = e.saha ? $.extend({}, e) : { deger: e, saha: _saha };
			e.not = true;
			return this.like(e)
		}
		fromGridWSArgs(e) {
			e = e || {};
			const filters = e.filters || e || [];
			for (const filter of filters)
				this.fromGridFilter({ filter: filter, alias: e.alias })
		}
		fromGridFilter(e) {
			e = e || {};
			let filter = e.filter || e;
			if ($.isEmptyObject(filter))
				return
			let saha = filter.field;
			if (!saha)
				return false
			const _e = { saha: saha, filter: filter };
			const alias = $.isFunction(e.alias) ? e.alias.call(this, _e) : e.alias;
			if (_e.saha)
				saha = _e.saha
			if (alias)
				saha = `${alias}.${saha}`
			const filterType = (filter.type || '').toLowerCase();
			// const operator = filter.operator.toUpperCase();
			const condition = (filter.comparisonoperator || filter.condition || '').toUpperCase();
			const isBooleanFilter = condition == 'booleanfilter';
			const isStringFilter = condition == 'stringfilter';
			const addValueClause = e => {
				let {value} = e;
				switch (condition) {
					case 'EMPTY':
					case 'NOTEMPTY':
					case 'NOT_EMPTY':
						value = 0;
						break;
					case 'IN':
					case 'NOTIN':
					case 'NOT_IN':
						const InSeparator = '|';
						value = $.isArray(value) ? value.join(InSeparator) : value;
						value = value.split(InSeparator).filter(x => !!x);
						if (isStringFilter)
							value = value.map(x => MQSQLOrtak.sqlDegeri(x));
						break;
					case 'EQUAL':
					case 'EQUALS':
					case 'NOTEQUAL':
					case 'NOT_EQUAL':
					case 'NOTEQUALS':
					case 'NOT_EQUALS':
						value = MQSQLOrtak.sqlDegeri(value);
						break;
				}
				
				switch (condition) {
					case 'CONTAIN': case 'CONTAINS':
						this.like(`%${value}%`, saha);
						break;
					case 'NOTCONTAIN': case 'NOT_CONTAIN':
					case 'NOT_CONTAINS': case 'DOES_NOT_CONTAIN':
						this.notLike(`%${value}%`, saha);
						break;
					case 'EQUAL': case 'EQUALS': case 'EMPTY':
						this.add(`${saha} ${isBooleanFilter ? '<>' : '='} ${value}`, saha);
						break;
					case 'NOT_EQUAL':
					case 'NOT_EQUALS':
					case 'NOTEMPTY':
					case 'NOT_EMPTY':
						 this.add(`${saha} ${isBooleanFilter ? '=' : '<>'} ${value}`, saha);
						 break;
					case 'IN':
						this.inDizi(deger, saha);
						break;
					case 'NOTIN':
					case 'NOT_IN':
						this.notInDizi(deger, saha);
						break;
				}
			};
			const {value} = filter;
			if ($.isArray(value)) {
				for (const subValue of value)
					addValueClause({ value: subValue })
			}
			else
				addValueClause({ value })
		}
	};
	window.MQWhereClause = class extends window.MQSubWhereClause {
		static get onEk() { return `	WHERE	` }
	};
	window.MQOnClause = class extends window.MQSubWhereClause {
		static get onEk() { return ` ON` }
	};
	window.MQXJoinTable = class extends window.MQAliasliYapi {
		constructor(e) {
			e = e || {};
			super(e);
			this.on = ((!e.on || $.isPlainObject(e.on) || typeof e.on == 'string' || $.isArray(e.on))
							? new MQOnClause(e.on) : e.on) || new MQOnClause()
		}
		aliasVarmi(alias) { return this.alias == alias }
		buildString(e) {
			super.buildString(e);
			this.on.buildString(e)
		}
	}
	window.MQTable = class extends window.MQAliasliYapi {
		constructor(e) {
			e = e || {};
			super(e);
			this.left = (e.left && !$.isArray(e.left) ? [e.left] : e.left) || [];
			this.inner = (e.inner && !$.isArray(e.inner) ? [e.inner] : e.inner) || [];
			this.outer = (e.outer && !$.isArray(e.outer) ? [e.outer] : e.outer) || [];
			this.iliskiler = (e.iliskiler && !$.isArray(e.iliskiler) ? [e.iliskiler] : e.iliskiler) || []
		}
		addLeft(e) { this.left.push(e); return this }
		addInner(e) { this.inner.push(e); return this }
		addOuter(e) { this.outer.push(e); return this }
		addIliski(e) { this.iliskiler.push(e); return this }
		aliasVarmi(alias) {
			if (this.alias == alias)
				return true
			let iterBlock = liste =>
				liste.find(item => item.aliasVarmi(alias));
			return iterBlock(this.outer) || iterBlock(this.inner) || iterBlock(this.left)
		}
		disindakiXTablolariSil(e) {
			const {disindaSet} = e;
			let iterBlock = liste => {
				for (let i = liste.length - 1; i >= 0; i--) {
					let anMQXJoinTable = liste[i];
					if (!disindaSet[anMQXJoinTable.alias])
						liste.splice(i, 1)
				}
			};
			iterBlock(this.outer);
			iterBlock(this.inner);
			iterBlock(this.left);
			return this
		}
		buildString(e) {
			super.buildString(e);
			let iterBlock = _e => {
				for (const item of (_e.liste || [])) {
					e.result += CrLf;
					e.result += _e.onEk;
					e.result += item.toString()
				}
			};
			iterBlock({ onEk: ' OUTER JOIN ', liste: this.outer });
			iterBlock({ onEk: ' INNER JOIN ', liste: this.inner });
			iterBlock({ onEk: ' LEFT JOIN ', liste: this.left })
		}
	}

	/*window.MQLeftJoinClause = class extends window.MQClause {
		constructor(e) {
			e = e || {};
			super(e);

			this.from = ((!e.from || typeof e.from == 'object' || typeof e.from == 'string')
								? new MQFromClause(e.from)
								: null
							) || new MQFromClause();

			let iliskiDizi = (typeof e.iliski == 'string') ? [e.iliski] : e.iliski;
			this.on = ((!e.on || typeof e.on == 'object' || typeof e.on == 'string' || $.isArray(e.on))
								? new MQOnClause(e.on || iliskiDizi)
								: on
							) || new MQOnClause();
		}

		static get onEk() { return `	LEFT JOIN	` }
		static get baglac() { return ' ' }
		static get baglacsizmi() { return true }

		buildString_baslangicsiz(e) {
			super.buildString_baslangicsiz(e);

			this.from.buildString_baslangicsiz(e);
			if (this.on)
				this.on.buildString(e);
		}

		donusmusDeger(item) {
			if (typeof item != 'object')
				return MQAliasliYapi.newForFromText(item);
			
			return item;
		}
	};*/

	window.MQHavingClause = class extends window.MQSubWhereClause {
		constructor(e) {
			e = e || {};
			super(e);
		}

		static get onEk() { return `	HAVING	` }
		static get baglac() { return ' AND ' }
	};

	window.MQAndClause = class extends window.MQClause {
		constructor(e) {
			e = e || {};
			super(e);
		}

		static get baglac() { return ' AND ' }
	};

	window.MQOrClause = class extends window.MQSubWhereClause {
		constructor(e) {
			e = e || {};
			super(e);
		}

		static get baglac() { return ' OR ' }

		buildString_baslangicsiz(e) {
			if (this.liste.length <= 1)
				super.buildString_baslangicsiz(e);
			else {
				e.result += '(';
				super.buildString_baslangicsiz(e);
				e.result += ')';
			}
		}
	};

	window.MQInClause = class extends window.MQClause {
		constructor(e) {
			e = e || {};
			super(e);

			this.isNot = asBool(e.not);
			this.saha = e.saha || '';
		}

		buildString(e) {
			let liste = this.liste;
			let isNot = this.isNot;
			if ($.isEmptyObject(liste)) {
				e.result += `1 ${isNot ? '<>' : '='} 2`;
			}
			else if (liste.length == 1) {
				e.result += `${this.saha} ${isNot ? '<>' : '='} ${this.class.sqlDegeri(this.liste[0])}`;
				// (e.params || this.params).push(this.class.sqlParamValue(this.liste[0]));
			}
			else {
				e.result += `${this.saha} ${isNot ? 'NOT ' : ''}IN (${this.liste.map(item => this.class.sqlDegeri(item)).join(this.class.baglac)})`;
				// (e.params || this.params).push(...(this.liste.map(item => this.class.sqlParamValue(item))));
			}
			// super.buildString(e);
		}
	};

	window.MQSetClause = class extends window.MQSubWhereClause {
		constructor(e) {
			e = e || {};
			super(e);
		}

		static get onEk() { return `	SET		` }
		static get baglac() { return ', ' }
	};

	window.MQValuesClause = class extends window.MQClause {
		constructor(e) {
			e = e || {};
			super(e);
		}

		static get onEk() { return `VALUES ` }
	};

	window.MQOrderByClause = class extends window.MQClause {
		constructor(e) {
			e = e || {};
			super(e);
		}

		fromGridWSArgs(e) {
			e = e || {};
			const alias = e.alias;
			const sahaConverter = alias
				? (e => {
					let _alias = alias;
					if ($.isFunction(alias))
						_alias = alias.call(this, e);
					return _alias ? `${_alias}.${e.saha}` : _alias;
				})
				: null;
			let sortDataField = e.sortdatafield || e.sortDataField;
			if (sortDataField && !asBool(e.rowCountOnly)) {
				if (sortDataField && !$.isArray(sortDataField))
					sortDataField = [sortDataField];
				if (sahaConverter)
					sortDataField = sortDataField.map(saha => sahaConverter({ saha: saha }));
				
				let sortOrder = (e.sortorder || e.sortOrder || '').toUpperCase().trim();
				if (sortOrder == 'ASC')
					sortOrder = '';
				sortOrder = sortOrder ? ' ' + sortOrder : '';

				let orderByListe = sortDataField.map(attr => `${attr.trim()}${sortOrder}`);
				this.addAll(orderByListe);
			}
		}

		static get onEk() { return ` ORDER BY	` }
	};
})()
