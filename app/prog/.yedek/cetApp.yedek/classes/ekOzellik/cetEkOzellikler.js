(function() {
	window.CETEkOzellikler = class extends window.CObject {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				tip2EkOzellik: e.tip2EkOzellik
			});
			if (!this.tip2EkOzellik)
				this.tip2EkOzellik = sky.app.tip2EkOzellik || {};
		}

		static get anahtarDelim() { return '|' }

		static get idSahalar() {
			return this.getEkOzelliklerIdSahalar();
		}

		static get idSahalarSiparis() {
			return this.getEkOzelliklerIdSahalar({ siparis: true });
		}

		get idSahalar() {
			return this.getEkOzelliklerIdSahalar({ tip2EkOzellik: this.tip2EkOzellik });
		}

		static get defaultIgnoreSet() {
			let result = this._defaultIgnoreSet;
			if (!result)
				result = this._defaultIgnoreSet = asSet(['refRaf']);
			return result;
		}

		static getEkOzelliklerIdSahalar(e) {
			e = e || {};
			let _with = e.with;
			if (_with && !$.isArray(_with))
				_with = [_with];

			const ignoreListe = e.ignoreListe || [];
			ignoreListe.push(...Object.keys(this.defaultIgnoreSet));
			if (asBool(e.siparis) || asBool(e.siparismi))
				ignoreListe.push(...['yer', 'raf', 'lotNo']);

			const ignoreSet = asSet(ignoreListe);
			if (e.refRafAlinirmi)
				delete ignoreSet.refRaf;
			
			const tip2EkOzellik = e.tip2EkOzellik || sky.app.tip2EkOzellik;
			const idSahalar = [];
			if (!$.isEmptyObject(_with))
				idSahalar.push(..._with);
			
			for (const tip in tip2EkOzellik) {
				if (!ignoreSet[tip]) {
					const ekOzellik = tip2EkOzellik[tip];
					idSahalar.push(ekOzellik.idSaha);
				}
			}

			return idSahalar;
		}

		static keyHostVarsFrom(e) {
			e = e || {};
			let _with = e.with;
			if (_with && !$.isArray(_with))
				_with = [_with];

			const {anahtarStr} = e;
			const parts = e.anahtarDegeri || (anahtarStr ? anahtarStr.split(this.anahtarDelim) : []);

			const hv = {};
			let index = 0;
			const hvEkleyici = idSahalar => {
				idSahalar = idSahalar || [];
				for (const i in idSahalar) {
					const idSaha = idSahalar[i];
					const value = parts[index++] || '';
					hv[idSaha] = value || hv[idSaha] || '';
				}
			}
			hvEkleyici(_with);
			hvEkleyici(this.getEkOzelliklerIdSahalar({ tip2EkOzellik: this.tip2EkOzellik, refRafAlinirmi: e.refRafAlinirmi }));
			
			return hv;
		}

		get anahtarDegeri() {
			return this.getAnahtarDegeri();
		}

		get anahtarStr() {
			return this.getAnahtarStr();
		}

		getAnahtarDegeri(e) {
			e = e || {};
			let result = e.with;
			if (result && !$.isArray(result))
				result = [result];
			
			const ignoreSet = this.class.defaultIgnoreSet;
			if (e.refRafAlinirmi)
				delete ignoreSet.refRaf;
			
			result = result || [];
			this.ekOzelliklerDo({
				callback: e => {
					const {tip} = e;
					if (!ignoreSet[tip])
						result.push(e.value || '')
				}
			});
			
			return result;
		}
		
		getAnahtarStr(e) {
			e = e || {};
			const anahtarDegeri = e.anahtarDegeri || this.getAnahtarDegeri(e) || [];
			return anahtarDegeri.join(e.anahtarDelim || e.delim || this.class.anahtarDelim);
		}

		hostVars(e) {
			let hv = {};
			this.ekOzelliklerDo({ callback: _e =>
				$.extend(hv, _e.item.hostVars(e))
			});

			return hv;
		}
		
		setValues(e) {
			e = e || {};
			this.ekOzelliklerDo({ callback: _e =>
				_e.item.setValues(e)
			});
		}

		static get deepCopyAlinmayacaklar() {
			return $.merge(super.deepCopyAlinmayacaklar || [], [
				'tip2EkOzellik'
			])
		}

		deepCopy(e) {
			const inst = super.deepCopy(e);
			
			const {tip2EkOzellik} = this;
			if (tip2EkOzellik) {
				if ($.isPlainObject(tip2EkOzellik)) {
					inst.tip2EkOzellik = {};
					for (let tip in tip2EkOzellik) {
						let ekOzellik = tip2EkOzellik[tip];
						ekOzellik = ekOzellik.deepCopy ? ekOzellik.deepCopy() : $.extend(true, {}, ekOzellik);
						inst.tip2EkOzellik[tip] = ekOzellik;
					}
				}
				else if ($.isArray(tip2EkOzellik)) {
					inst.tip2EkOzellik = $.extend(true, [], tip2EkOzellik);
				}
				else {
					inst.tip2EkOzellik = tip2EkOzellik.deepCopy ? tip2EkOzellik.deepCopy() : $.extend(true, {}, tip2EkOzellik);
				}
			}
			
			return inst;
		}

		ekOzelliklerDo(e) {
			e = e || {};
			const callback = $.isFunction(e.callback) ? e.callback : null;
			const {tip2EkOzellik} = this;
			let ind = -1;
			for (const tip in tip2EkOzellik) {
				const item = tip2EkOzellik[tip];
				ind++;
				if (callback)
					callback.call(this, { tip: tip, item: item, index: ind, idSaha: item.idSaha, value: item.value });
			}
			
			return tip2EkOzellik;
		}
	}
})();
