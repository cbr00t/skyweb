(function() {
	/*
		parts = await sky.app.tip2EkOzellik.model.appendPartsInto({
			parentPart: sky.app, content: sky.app.layout,
			events: {
				comboBox_itemSelected: e => console.warn(e)
			}
		});

		parts = await sky.app.tip2EkOzellik.serbest1.appendPartsInto({
			parentPart: sky.app, content: sky.app.layout,
			height: 30,
			events: {
				input_change: e => console.warn(e)
			}
		});
	*/

	window.CETEkOzellik = class extends window.CObject {
		constructor(e) {
			e = e || {};
			super(e);

			const tip = this.tip = e.tip;
			$.extend(this, {
				tipAdi: e.tipAdi || '',
				idSaha: e.idSaha || `${tip}Kod`,
				placeHolder: e.placeHolder,
				events: e.events || {},
			});
		}

		static classFor(e) {
			e = e || {};
			const tip = typeof e == 'object' ? e.ozellikTip : e;
			switch (tip) {
				case 'ka': return CETEkOzellik_KA;
				case 'ozellik': return CETEkOzellik_Ozellik;
			}
			return null;
		}

		static get ozellikTip() { return null }
		
		get value() {
			return null
		}
		set value(_value) {
			const oldValue = this.value;
			if (oldValue != _value)
				this.aciklama = null;
			this.setValueDirect(_value);
			_value = this.value;
			if (oldValue != _value)
				this.onValueChanged({ value: _value, oldValue: oldValue });
		}
		setValueDirect(_value) {
		}

		hostVars(e) {
			let hv = {};
			const _value = this.value;
			hv[this.idSaha] = _value == null ? '' : _value;

			return hv;
		}
		setValues(e) {
			e = e || {};
			const {rec} = e;
			const {idSaha} = this;
			const value = rec && idSaha ? rec[idSaha] : null;
			if (rec != null)
				this.setValueDirect(value);
		}

		async appendPartsInto(e) {
			const content = e.content;
			const parts = await this.buildParts(e);
			if (content && content.length && !$.isEmptyObject(parts)) {
				for (const key in parts) {
					const part = parts[key];
					if (part) {
						if (part.run) {
							if (part.content && !part.content.parent().length)
								part.content.appendTo(content);
							await part.run();
						}
						else
							part.appendTo(content);
					}
				}
			}

			return parts;
		}

		async buildParts(e) {
			return { label: null, input: await this.asInputPart(e) }
		}

		asLabelPart(e) {
			e = e || {};
			const tip = this.tip;
			const partID = `${tip}_etiket`;

			const content = e.content;
			let layout = e.layout;
			if (content) {
				if (!(layout && layout.length))
					layout = content.find(`#${partID}`);
				if (!(layout && layout.length))
					layout = content.find(`.${partID}`);
			}
			
			if (!(layout && layout.length))
				layout = $(`<div id="${partID}" class="etiket ekOzellik ${this.class.ozellikTip}">${this.tipAdi}</div>`);

			return new this.partClass($.extend({}, e, { content: content, layout: layout }));
		}

		asInputPart(e) {
			return null
		}

		async onValueChanged(e) {
			const events = this.events;
			let result;
			let handler = events.valueChanged;
			if ($.isFunction(handler))
				result = await handler.call(this, $.extend({ sender: this, value: e.value || this.value }, e || {}));
		}
	};

	window.CETEkOzellik_KA = class extends window.CETEkOzellik {
		constructor(e) {
			e = e || {};
			super(e);

			const tip = this.tip;
			$.extend(this, {
				kod: e.kod || e.value,
				aciklama: e.aciklama,
				adiSaha: e.adiSaha || `${tip}Adi`,
				mbTable: e.mbTable,
				mbKodSaha: e.mbKodSaha || `kod`,
				mbAdiSaha: e.mbAdiSaha || `aciklama`,
				kodsuzmu: asBool(e.kodsuzmu),
				sadeceKodmu: asBool(e.sadeceKodmu),
				widgetArgs: e.widgetArgs || {},
				widgetEvents: e.widgetEvents || {}
			});
		}

		static get ozellikTip() { return 'ka' }
		
		get value() {
			return this.kod;
		}
		set value(_value) {
			super.value = _value;
		}
		setValueDirect(_value) {
			super.setValueDirect(_value);
			this.kod = _value;
		}

		setValues(e) {
			e = e || {};
			super.setValues(e);

			const {rec} = e;
			const {adiSaha} = this;
			const value = rec && rec && adiSaha ? rec[adiSaha] : null;
			if (rec != null)
				this.aciklama = rec[adiSaha];
		}

		cizgiliOzet(e) {
			e = e || {};
			return `(${e.styled ? '<b>' : ''}${this.kod}${e.styled ? '</b>' : ''}) ${this.aciklama}`;
		}
		parantezliOzet(e) {
			e = e || {};
			return `${e.styled ? '<b>' : ''}${this.kod}${e.styled ? '</b>' : ''}-${this.aciklama}`;
		}

		asInputPart(e) {
			e = e || {};
			const {tip} = this;
			const partID = `${tip}`;

			const {content} = e;
			let {layout} = e;
			if (content) {
				if (!(layout && layout.length))
					layout = content.find(`#${partID}`);
				if (!(layout && layout.length))
					layout = content.find(`.${partID}`);
			}
			
			if (!(layout && layout.length))
				layout = $(`<div id="${partID}" class="veri ekOzellik ${this.class.ozellikTip}" />`);

			const _events = e.events || {};
			$.extend(this.events, _events);
			
			let widgetArgs = {
				parentPart: e.parentPart, content: layout, ekOzellik: this, disabled: e.disabled || this.disabled,
				placeHolder: e.placeHolder || this.placeHolder || `${this.tipAdi || ''} Kod veya Adı`,
				table: this.mbTable, idSaha: this.mbKodSaha, adiSaha: this.mbAdiSaha,
				kodsuzmu: this.kodsuzmu, sadeceKodmu: this.sadeceKodmu,
				selectedId: this.value,
				events: {
					comboBox_itemSelected: async e => {
						let result;
						let handler = _events.comboBox_itemSelected;
						if ($.isFunction(handler))
							result = await handler.call(this, $.extend({ sender: this }, e));
						if (result)
							return;
						
						let _value = e.id;
						if (typeof _value == 'string')
							_value = _value.trimEnd();
						this.value = _value || '';
						this.aciklama = e.aciklama;
					}
				}
			};

			$.each(this.widgetArgs || {}, (key, value) =>
				widgetArgs[key] = value);
			$.each(e.widgetArgs || {}, (key, value) =>
				widgetArgs[key] = value);
			$.each(this.widgetEvents || {}, (key, value) =>
				widgetArgs.events[key] = value);
			$.each(e.widgetEvents || {}, (key, value) =>
				widgetArgs.events[key] = value);
			
			/* listeColumnsDuzenleFunc: this.events.listeColumnsDuzenleFunc,
			comboBox_loadServerData: this.events.comboBox_loadServerData,
			liste_loadServerData: this.events.liste_loadServerData,
			liste_loadServerData_buildQuery: this.events.liste_loadServerData_buildQuery,
			liste_stmDuzenleyici: this.events.liste_stmDuzenleyici,
			liste_loadServerData_ekIslemler: this.events.liste_loadServerData_ekIslemler,
			listeDataAdapterOlusturFunc: this.events.listeDataAdapterOlusturFunc */

			return new CETMstComboBoxPart(widgetArgs);
		}
	};

	window.CETEkOzellik_Ozellik = class extends window.CETEkOzellik {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				idSaha: e.idSaha || this.tip,
				deger: e.deger || e.value,
				maxLength: e.maxLength
			});

			this.partClass = class extends CObject {
				constructor(e) {
					super(e);
					$.extend(this, {
						content: e.content,
						layout: e.layout,
						ozellik: e.ozellik
					})
				}

				async run() {
					const content = this.content;
					const layout = this.layout;
					if (content && content.length)
						layout.appendTo(content);
					return layout;
				}
			};
		}

		static get ozellikTip() { return 'ozellik' }

		get value() {
			return this.deger
		}
		set value(_value) {
			super.value = _value;
		}
		setValueDirect(_value) {
			super.setValueDirect(_value);
		
			this.deger = _value;
		}

		/*async buildParts(e) {
			const parts = await super.buildParts(e);
			if (!parts.label)
				parts.label = await this.asLabelPart(e);
			
			return parts;
		}*/

		asInputPart(e) {
			e = e || {};
			const tip = this.tip;
			const partID = `${tip}`;

			const content = e.content;
			let layout = e.layout;
			if (content) {
				if (!(layout && layout.length))
					layout = content.find(`#${partID}`);
				if (!(layout && layout.length))
					layout = content.find(`.${partID}`);
			}

			if (!(layout && layout.length))
				layout = $(`<input id="${partID}" type="text" class="veri ekOzellik ${this.class.ozellikTip}" />`);

			const _events = e.events || {};
			$.extend(this.events, _events);
			
			const maxLength = this.maxLength;
			layout = layout.jqxInput({
				theme: theme, disabled: e.disabled || this.disabled,
				width: e.width || (maxLength ? maxLength * 15 : '100%'),
				height: e.height == null ? false : e.height,
				maxLength: maxLength || undefined,
				placeHolder: e.placeHolder || this.placeHolder || this.tipAdi
			});
			layout.val(this.value);
			layout.on('focus', evt =>
				evt.target.select());
			layout.on('change', async evt => {
				let result;
				let handler = _events.input_change;
				if ($.isFunction(handler))
					result = await handler.call(this, $.extend({ sender: this, event: evt }, e));
				if (result)
					return;
				this.value = (evt.target.value || '').trimEnd();
			});

			return new this.partClass($.extend({}, e, { content: content, layout: layout, ozellik: this }));
		}
	};
})();
