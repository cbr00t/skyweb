(function() {
	window.MQSent = class extends window.MQDbCommand {
		get isDBWriteClause() { return this.toString()?.toUpperCase()?.includes('INTO ') }
		
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				distinct: asBool(e.distinct),
				sahalar: (($.isArray(e.sahalar) || $.isPlainObject(e.sahalar) || typeof e.sahalar == 'string'
									? new MQSahalar(e.sahalar) : e.sahalar))
							|| new MQSahalar(),
				from: ($.isArray(e.from) || $.isPlainObject(e.from) || typeof e.from == 'string'
								? new MQFromClause(e.from) : e.from)
							|| new MQFromClause(),
				where: ($.isArray(e.where) || $.isPlainObject(e.where) || typeof e.where == 'string'
								? new MQWhereClause(e.where) : e.where)
							|| new MQWhereClause(),
				groupBy: ($.isArray(e.groupBy) || $.isPlainObject(e.groupBy) || typeof e.groupBy == 'string'
								? new MQGroupByClause(e.groupBy) : e.groupBy)
							|| new MQGroupByClause(),
				having: ($.isArray(e.having) || $.isPlainObject(e.having) || typeof e.having == 'string'
								? new MQHavingClause(e.having) : e.having)
							|| new MQHavingClause(),
				zincirler: ($.isArray(e.zincirler) || $.isPlainObject(e.zincirler)
								? new MQZincirler(e.zincirler) : e.zincirler)
							|| new MQZincirler(),
				limit: e.limit,
				offset: e.offset
			});

			let {fromIliskiler} = e;
			if (!$.isEmptyObject(fromIliskiler)) {
				for (const fromIliskiOrLeftJoin of fromIliskiler) {
					if (fromIliskiOrLeftJoin.leftJoin || fromIliskiOrLeftJoin.on)
						this.leftJoin(fromIliskiOrLeftJoin)
					else if (fromIliskiOrLeftJoin.innerJoin)
						this.innerJoin(fromIliskiOrLeftJoin)
					else
						this.fromIliski(fromIliskiOrLeftJoin)
				}
			}
		}

		fromGridWSArgs(e) {
			e = e || {};
			this.where.fromGridWSArgs(e);
		}

		*getSentListe(e) { yield this }
		[Symbol.iterator](e) { return this.getSentListe(e) }
		sentDo(e) {
			e = e || {};
			if (typeof e != 'object')
				e = { callback: e }
			e.callback.call(this, this, { item: this, index: 1, liste: [this] })
		}
		fromAdd(e) {
			e = e || {};
			if (typeof e != 'object')
				e = { from: e };
			else
				e.from = e.from || e.fromText || e.table;
			let fromText = e.from;
			this.from.add(fromText);
		}
		fromIliski(e, _iliskiDizi) {
			e = e || {};
			if (typeof e != 'object')
				e = { from: e };
			else
				e.from = e.from || e.fromText || e.table;
			let fromText = e.from;
			if (_iliskiDizi)
				e.iliskiDizi = _iliskiDizi
			let iliskiDizi = e.iliskiDizi || e.iliskiText || e.iliski;
			if (iliskiDizi && !$.isArray(iliskiDizi))
				iliskiDizi = [iliskiDizi]
			
				// MQFromClause >> #add:
			const {from} = this;
			let isOuter = false;
			let lastTable = from.liste[from.liste.length - 1];
			if (lastTable && sky.app?.dbMgr_mf?.alaSQLmi) {
				isOuter = true;
				lastTable.addOuter(MQXJoinTable.newForFromText({ text: fromText, on: iliskiDizi }))
			}
			else {	
				from.add(fromText);
				lastTable = from.liste[from.liste.length - 1]
			}
			for (const iliskiText of iliskiDizi) {
				//	tablo atılırsa iliskinin de kalkması için table yapısında bırakıldı
				// this.where.add(iliskiText);
				const iliski = MQIliskiYapisi.newForText(iliskiText);
				if (!isOuter)
					lastTable.addIliski(iliski)
				const zincir = iliski.varsaZincir;
				if (zincir)
					this.zincirler.add(zincir)
			}
		}
		innerJoin(e) {
			e = e || {};
			let alias = e.alias;
			let fromText = e.from || e.leftJoin || e.fromText || e.table;
			let iliskiDizi = e.on || e.iliskiDizi || e.iliskiText || e.iliski;
			if (iliskiDizi && !$.isArray(iliskiDizi))
				iliskiDizi = [iliskiDizi]
			let xJoin = MQXJoinTable.newForFromText({ text: fromText, on: iliskiDizi });
			let tableYapi = this.from.aliasIcinTable(alias);
			if (!tableYapi?.addInner)
				debugger
			tableYapi.addInner(xJoin);
			for (const iliskiText of iliskiDizi) {
				let iliski = MQIliskiYapisi.newForText(iliskiText);
				let zincir = iliski.varsaZincir;
				if (zincir)
					this.zincirler.add(zincir)
			}
		}
		leftJoin(e) {
			e = e || {};
			let alias = e.alias;
			let fromText = e.from || e.leftJoin || e.fromText || e.table;
			let iliskiDizi = e.on || e.iliskiDizi || e.iliskiText || e.iliski;
			if (iliskiDizi && !$.isArray(iliskiDizi))
				iliskiDizi = [iliskiDizi]
			let xJoin = MQXJoinTable.newForFromText({ text: fromText, on: iliskiDizi });
			let tableYapi = this.from.aliasIcinTable(alias);
			if (!tableYapi?.addLeft)
				debugger
			tableYapi.addLeft(xJoin);
			for (const iliskiText of iliskiDizi) {
				let iliski = MQIliskiYapisi.newForText(iliskiText);
				let zincir = iliski.varsaZincir;
				if (zincir)
					this.zincirler.add(zincir)
			}
		}
		add(e) { return this.sahalar.add(e) }
		addAll(e) { return this.sahalar.addAll(e) }
		gereksizTablolariSil(e) {
			e = e || {};
			let disindaSet = asSet(e.disinda || {});
			let iterBlock = item => {
				for (const anMQAliasliYapi of (item.liste || item)) {
					const degerAlias = anMQAliasliYapi.degerAlias;
					if (degerAlias)
						disindaSet[degerAlias] = true
				}
			};
			iterBlock(this.sahalar);
			iterBlock(this.groupBy);
			iterBlock(this.having);
			for (const text of this.where.liste) {
				try {
					let iliskiYapisi = MQIliskiYapisi.newForText(text);
					if (iliskiYapisi.isError)
						throw iliskiYapisi
					for (const aliasYapi of [iliskiYapisi.sol, iliskiYapisi.sag]) {
						let degerAlias = aliasYapi.degerAlias;
						if (degerAlias)
							disindaSet[degerAlias] = true
					}
				}
				catch (ex) {
					if (!(ex && ex.rc == 'queryBuilderError'))
						throw ex
				}
			}
			this.from.disindakiTablolariSil({ disindaSet: disindaSet })
		}
		buildString(e) {
			super.buildString(e);
			let value = this.sahalar.toString();
			e.result += `SELECT		`;
			if (this.distinct)
				e.result += `DISTINCT `
			e.result += value;
			
			const birlesikWhere = new MQWhereClause();
			this.from.iliskiler2Where({ where: birlesikWhere });
			birlesikWhere.birlestir(this.where);
			
			const ekle = clause => {
				clause = clause.toString();
				if (clause)
					e.result += `${CrLf}${clause}`
			};
			ekle(this.from);
			ekle(birlesikWhere);
			ekle(this.groupBy);
			ekle(this.having);

			value = this.limit;
			if (value)
				e.result += ` LIMIT ${value}`
			value = this.offset;
			if (value)
				e.result += ` OFFSET ${value}`
		}

		distinctYap() { this.distinct = true; return this }
	};


	window.MQCTESent = class extends window.MQDbCommand {
		constructor(e) {
			e = e || {};
			super(e);

			if ($.isArray(e))
				e = { liste: e };
			else if (typeof e != 'object')
				e = { liste: [e] };
			
			this.liste = [];
			if (!$.isEmptyObject(e.liste))
				this.addAll(e.liste);
		}

		static get baglac() { return '' }

		*getSentListe(e) {
			for (const item of this.liste)
				yield item
		}

		sentDo(e) {
			e = e || {};
			if (typeof e != 'object')
				e = { callback: e };

			const {liste} = this;
			for (let i = 0; i < liste.length; i++) {
				const item = liste[i];
				if (e.callback.call(this, item, { item: item, index: i, liste: liste }) === false)
					return false;					// break loop
			}
		}

		distinctYap() {
			this.sentDo(sent =>
				sent.distinctYap());
		}

		add(e) {
			if (!e && typeof e != 'number')
				return;
			
			this.liste.push(e);
		}

		addAll(coll) {
			this.liste.push(...coll);
		}

		buildString(e) {
			super.buildString(e);

			e.result += (this.liste.map(item => item.toString())
							.join(`${CrLf}${this.class.baglac}${CrLf}`));
		}
	}


	window.MQUnion = class extends window.MQCTESent {
		constructor(e) {
			e = e || {};
			super(e);
		}

		static get baglac() { return '  UNION' }
	}

	window.MQUnionAll = class extends window.MQCTESent {
		constructor(e) {
			e = e || {};
			super(e);
		}

		static get baglac() { return '  UNION ALL' }
	}

	window.MQExcept = class extends window.MQCTESent {
		constructor(e) {
			e = e || {};
			super(e);
		}

		static get baglac() { return '  EXCEPT' }
	}

	window.MQExceptAll = class extends window.MQCTESent {
		constructor(e) {
			e = e || {};
			super(e);
		}

		static get baglac() { return '  EXCEPT ALL' }
	}
})()
