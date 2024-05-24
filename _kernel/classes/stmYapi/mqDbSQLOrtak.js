(function() {
	window.MQSQLOrtak = class extends window.CObject {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				prefix: e.prefix,
				postfix: e.postfix,
				params: e.params || null
			});
		}

		static sqlDegeri(e) {
			if (e == null)
				return null;

			const value = $.isPlainObject(e) ? e.value : e;
			if (typeof value == 'string')
				return `'${value.replaceAll(`'`, `''`)}'`;
			if (typeof value == 'number')
				return value;
			
			return this.sqlParamValue(e);
		}

		static sqlParamValue(e) {
			if (e == null)
				return null;

			const value = $.isPlainObject(e) ? e.value : e;
			if (value == null)
				return value;
			if (typeof value == 'boolean')
				return value ? 1 : 0;
			if ((value.constructor || {}).name == 'Date')
				return this.sqlDegeri(Utils.asReverseDateString(value) || '');
			
			return value;
		}
		
		getQueryYapi(e) {
			e = e || {};
			let query = this.toString(e);
			return {
				query: query,
				params: this.params
			}
		}

		toString(e) {
			e = e || {};
			e.result = e.result || '';
			e.params = this.params || [];

			let value = e.prefix || this.prefix;
			if (value)
				e.result += `${value} `;
			
			this.buildString(e);
			
			value = e.postfix || this.postfix;
			if (value)
				e.result += ` ${value}`;
			
			this.params = e.params;
			return e.result;
		}

		buildString(e) {
			// e.result += ``;
		}
	}


	window.MQAliasliYapi = class extends window.MQSQLOrtak {
		constructor(e) {
			e = e || {};
			super(e);

			this.deger = e.deger || '';
			this.alias = e.alias || '';
			this.aliaslimi = asBool(e.aliaslimi);
		}

		static newForFromText(e) {
			/* örnek:
					- 'piffis'
					- 'piffis fis'
					- 'piffis AS fis'
					- '(SELECT ... ) AS tbl'
			*/

			e = e || {};
			if (typeof e != 'object')
				e = { text: e };

			let text = (e.text || e.fromText || '').toString().trim();
			delete e.text;

			let sonBosInd = text.lastIndexOf(' ');
			if (sonBosInd < 0) {				// bosluk yok
				e.deger = e.alias = text;
				e.aliaslimi = false;
			}
			else {								// bosluk var
					// substring (from, end) => end index dahil değil
				let tabloAdi = text.substring(0, sonBosInd).trim();
				if (tabloAdi[0] != '(' && tabloAdi.slice(-3).toUpperCase() == ' AS')
					tabloAdi = tabloAdi.slice(0, -3);
				e.deger = tabloAdi;
				e.alias = text.substring(sonBosInd + 1).trim();
				e.aliaslimi = true;
			}

			return new this(e);
		}

		static newForSahaText(text) {
			/* örnek:
					- 'stk.kod'
					- 'stk.kod stokKod'
					- 'kod'
					- '(case when ... end) tipText'
			*/

			text = (text || '').toString().trim();
			let sonBosInd = text.lastIndexOf(' ');
			let sonNoktaInd = text.lastIndexOf('.');

			let e = {};
			if (sonBosInd < 0) {				// bosluk yok
				if (sonNoktaInd < 0) {			// nokta yok
					e.deger = e.alias = text;
					e.aliaslimi = false;
				}
				else {							// nokta var
					e.deger = text;
					e.alias = text.substring(sonNoktaInd + 1).trim();
					e.aliaslimi = false;
				}
			}
			else {								// bosluk var
					// substring (from, end) => end index dahil değil
				e.deger = text.substring(0, sonBosInd).trim();
				e.alias = text.substring(sonBosInd + 1).trim();
				e.aliaslimi = true;
			}

			return new this(e);
		}

		static newForIliskiText(text) {
			/* örnek:
					- 'har.fissayac'
					- '(case when fis.silindi='' then ... else .. end)'
			*/

			text = (text || '').toString().trim();
			if (!text)										// text bos
				return new this();
			
			let noktaInd = text.lastIndexOf('.');
			if (noktaInd < 0 || text[0] == '(')				// nokta yok veya parantezle başladı
				return new this({ deger: text });
			
			// nokta var
			return new this({
				deger: text,
				alias: text.substring(0, noktaInd),					// 'to' dahil degil substring() de
				aliaslimi: true
			});
		}

		static getDegerAlias(deger) {
			// fis.rowid   		gibi ==> 'fis'
			//		aksinde			 ==> null

			deger = (deger || '').toString().trim();
			if (!deger)
				return null;
			if (deger[0] >= '0' && deger[0] <= '9')
				return null;
			if (deger[0] == '(')
				return null;
			
			let parts = deger.split('.');
			if (parts.length != 2)
				return null;
			
			return parts[0];
		}

		get degerAlias() {
			return this.class.getDegerAlias(this.deger);
		}

		buildString(e) {
			super.buildString(e);

			e.result += this.deger || '';
			if (this.aliaslimi)
				e.result += ` ${this.alias}`;
		}
	};


	window.MQIliskiYapisi = class extends window.MQSQLOrtak {
		constructor(e) {
			e = e || {};
			super(e);
			
			if (typeof e == 'string')
				return $.extend(this, this.class.newForText(e))
				
			this.sol = e.sol || new MQAliasliYapi();
			this.sag = e.sag || new MQAliasliYapi();
		}

		static newForText(text) {
			text = (text || '').toString().trim();
			
			let parantezSayilari;
			let ind = -1;
			let solText;
			do {
				parantezSayilari = { ac: 0, kapat: 0 };
				ind = text.indexOf('=', ind + 1);
				/*ind = ind > -1 ? ind : ind = text.indexOf('>', ind + 1);
				ind = ind > -1 ? ind : ind = text.indexOf('<', ind + 1);*/
										// substring(from, to) => to dahil degil
				solText = text.substring(0, ind).trim();
				for (let i in solText) {
					let ch = solText[i];
					if (ch == '(')
						parantezSayilari.ac++;
					else if (ch == ')')
						parantezSayilari.kapat++;
				}
			} while (ind > -1 && parantezSayilari.ac != parantezSayilari.kapat);
			if (ind < 0)
				throw { isError: true, rc: 'queryBuilderError', errorText: 'Dengesiz eşitlik' }

			let e = {
				sol: MQAliasliYapi.newForIliskiText(solText),
				sag: MQAliasliYapi.newForIliskiText(text.substring(ind + 1))
			};

			return new this(e);
		}

		get varsaZincir() {
			if (this.sol.aliaslimi && this.sag.aliaslimi)
				return [this.sol.alias, this.sag.alias];
			
			return null;
		}

		buildString(e) {
			super.buildString(e);

			e.result += `${this.sol.deger.toString()} = ${this.sag.deger.toString()}`;
		}
	};
})();
