(function() {
	window.SkyKonumTakipTextInputPart = class extends window.SkyKonumTakipWindowPart {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				baslikText: e.baslikText,
				value: e.value
			});
		}

		static get partName() { return 'textInput' }
		get autoHeight_uiSelector() { return `#textInputParent` }
		get autoFocus_uiSelector() { return `#textInput` }
		
		get autoCompleteSelector2ValueGetter() {
			return $.extend(super.autoCompleteSelector2ValueGetter || {}, {
				value: e => this.value
			})
		}
		
		async tazeleDevam(e) {
			await super.tazeleDevam(e);

			const {wndContent, baslikText, value} = this;
			const {placeHolder} = e;
			if (baslikText) {
				wndContent.find(`#baslikText`).html(baslikText);
				wndContent.find(`#baslikTextParent`).removeClass(`jqx-hidden`);
			}
			else {
				wndContent.find(`#baslikTextParent`).addClass(`jqx-hidden`);
			}
			
			const textInput = this.textInput = this.initTextInput({
				htmlSelector: `#textInput`, instSelector: 'value',
				placeHolder: placeHolder, value: value,
				args: { /*minLength: 2,*/ }
			});
			const textInputParent = this.textInputParent = textInput.parent();
			textInput.on('keyup', evt => {
				const key = (evt.key || '').toLowerCase();
				if (key == 'enter' || key == 'linefeed')
					this.tamamIstendi($.extend({}, e, { event: evt }));
			});
		}

		tazeleSonrasi(e) {
			super.tazeleSonrasi(e);
		}

		close_araIslemler(e) {
			super.close_araIslemler(e);
			
			delete this.textInput;
		}

		setValues(e) {
			super.setValues(e);

			$.extend(this, {
				baslikText: e.baslikText == null ? this.baslikText : e.baslikText,
				value: e.value == null ? this.value : e.value
			});
		}

		wndArgsDuzenle(e) {
			super.wndArgsDuzenle(e);

			$.extend(e.args, {
				width: 500, height: 125,
				minWidth: 180, minHeight: 110
			});
		}

		tamamIstendi_argsDuzenle(e) {
			super.tamamIstendi_argsDuzenle(e);

			$.extend(e.args, {
				value: this.value
			});
		}
	}
})()
