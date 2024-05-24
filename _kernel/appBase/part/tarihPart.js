(function() {
	window.TarihPart = class extends window.Part {
		constructor(e) {
			super(e);

			e = e || {}
			$.extend(this, {
				tarih: e.tarih || '',
				widgetBeforeInit: e.widgetBeforeInit,
				widgetAfterInit: e.widgetAfterInit
			});
			
			if (!(this.layout || this.template))
				this.template = (this.app.templates || {})[this.class.defaultTemplateName];
		}

		static get partName() { return 'tarih' }
		get partRoot() { return 'appBase/part/' }
		get defaultLayoutName() { return this.partName }


		preInitLayout(e) {
			e = e || {};
			super.preInitLayout(e);
			
			const layout = e.layout || this.layout;
			const ci = Date.CultureInfo;
			let widgetArgs = {
				changeMonth: true, changeYear: true, theme: theme,
				constrainInput: false, showButtonPanel: true,
				buttonText: 'Tarih Seç',
				buttonImage: 'lib/calendar.gif', buttonImageOnly: true,
				dateFormat: 'dd.mm.yy', firstDay: ci.firstDayOfWeek,
				weekHeader: 'Hft.', showWeek: true,
				currentText: 'BUGÜN', closeText: 'KAPAT',
				dayNames: ci.dayNames, dayNamesShort: ci.abbreviatedDayNames, dayNamesMin: ci.shortestDayNames,
				monthNames: ci.monthNames, monthNamesShort: ci.abbreviatedMonthNames
			}
			let handler = this.widgetBeforeInit;
			if ($.isFunction(handler))
				handler.call(this, $.extend({}, e, { sender: this, widgetArgs: widgetArgs }));
			layout.attr('autocomplete', 'off');
			layout.datepicker(widgetArgs);
			layout.val(dateToString(this.tarih));
			this.widget = layout.datepicker($.datepicker.regional['tr']);
			layout.on('change', evt => {
				const input = $(evt.target);
				const val = input.val();
				if (val && !isInvalidDate(val)) {
					input.data('savedVal', val);
					this.tarih = asDate(val);
				}
			});
			layout.on('focusin', evt =>
				evt.target.select());
			layout.on('focusout', evt => {
				const input = $(evt.target);
				const ch = input.val();
				const value = tarihDegerDuzenlenmis(ch, () => input.data('savedVal'));
				if (value) {
					evt.preventDefault();
					input.val(value || '');
					this.tarih = asDate(value);
				}
			});
			handler = this.widgetAfterInit;
			if ($.isFunction(handler))
				handler.call(this, $.extend({}, e, { sender: this, widget: widget, widgetArgs: widgetArgs }));
		}
	}
})()
