(function() {
	window.MQIliskiliYapiOrtak = class extends window.MQSentVeIliskiliYapiOrtak {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				from: ($.isArray(e.from) || $.isPlainObject(e.from) || typeof e.from == 'string'
								? new MQFromClause(e.from) : e.from)
							|| new MQFromClause(),
				where: ($.isArray(e.where) || $.isPlainObject(e.where) || typeof e.where == 'string'
								? new MQWhereClause(e.where) : e.where)
							|| new MQWhereClause(),
				zincirler: ($.isArray(e.zincirler) || $.isPlainObject(e.zincirler)
								? new MQZincirler(e.zincirler) : e.zincirler)
							|| new MQZincirler()
			});
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
			
			if (_iliskiDizi)
				e.iliskiDizi = _iliskiDizi;

			let fromText = e.from;
			let iliskiDizi = e.iliskiDizi || e.iliskiText || e.iliski;
			if (iliskiDizi && !$.isArray(iliskiDizi))
				iliskiDizi = [iliskiDizi];
			
				// MQFromClause >> #add:
			let lastTable = this.from.add(fromText);
			iliskiDizi.forEach(iliskiText => {
				//	tablo atılırsa iliskinin de kalkması için table yapısında bırakıldı
				// this.where.add(iliskiText);
				const iliski = MQIliskiYapisi.newForText(iliskiText);
				lastTable.addIliski(iliski);

				const zincir = iliski.varsaZincir;
				if (zincir)
					this.zincirler.add(zincir);
			} );
		}

		leftJoin(e) {
			e = e || {};
			let alias = e.alias;
			let fromText = e.from || e.leftJoin || e.fromText || e.table;
			let iliskiDizi = e.on || e.iliskiDizi || e.iliskiText || e.iliski;
			if (iliskiDizi && !$.isArray(iliskiDizi))
				iliskiDizi = [iliskiDizi];
			
			let xJoin = MQXJoinTable.newForFromText({ text: fromText, on: iliskiDizi });
			let tableYapi = this.from.aliasIcinTable(alias);
			tableYapi.addLeft(xJoin);
			
			iliskiDizi.forEach(iliskiText => {
				let iliski = MQIliskiYapisi.newForText(iliskiText);
				let zincir = iliski.varsaZincir;
				if (zincir)
					this.zincirler.add(zincir);
			});
		}

		buildString(e) {
			super.buildString(e);

			const from = this.from;
			const birlesikWhere = new MQWhereClause();
			this.from.iliskiler2Where({ where: birlesikWhere });
			birlesikWhere.birlestir(this.where);

			e.result += this.class.onEk + ' ';
			from.buildString_baslangicsiz(e);
			this.buildString_ara(e);
			if (!$.isEmptyObject(birlesikWhere.liste)) {
				e.result += CrLf;
				birlesikWhere.buildString(e);
			}
		}

		buildString_ara(e) {
		}
	};
	

	window.MQIliskiliUpdate = class extends window.MQIliskiliYapiOrtak {
		get isDBWriteClause() { return true }
		
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				set: ($.isArray(e.set) || $.isPlainObject(e.set) || typeof e.set == 'string'
								? new MQSetClause(e.set) : e.set)
							|| new MQSetClause()
			});
		}

		static get onEk() { return `UPDATE	` }

		degerAta(e, _saha) {
			return this.set.degerAta(e, _saha);
		}

		add(e) {
			return this.set.add(e)
		}

		addAll(e) {
			return this.set.addAll(e)
		}

		buildString_ara(e) {
			super.buildString_ara(e);

			// e.result += CrLf;
			this.set.buildString(e);
		}
	};

	window.MQIliskiliDelete = class extends window.MQIliskiliYapiOrtak {
		get isDBWriteClause() { return true }
		constructor(e) {
			e = e || {};
			super(e);
		}

		static get onEk() { return `DELETE	FROM ` }
	};
})()
