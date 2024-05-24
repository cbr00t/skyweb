(function() {
	window.KnobProgressPart = class extends window.Part {
		constructor(e) {
			super(e);

			e = e || {};
			this.updateData = e.update;
		}

		static get partName() { return 'knobProgress' }
		get partRoot() { return 'appBase/part/' }
		get defaultLayoutName() { return this.layout || this.template ? null : this.partName }


		async preInitLayout(e) {
			e = e || {};
			await super.preInitLayout(e);

			const layout = e.layout || this.layout;
			$.extend(this, {
				label: layout.find('#label'),
				progress: layout.find('#progress'),
				loading: layout.find('#loading')
			});
		}

		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);

			const layout = e.layout || this.layout;
			let divProgress = layout.find('#progress');
			divProgress.jqxKnob({
				theme: theme, value: 0, min: 0, max: 100,
				width: 110, height: 110,
				allowValueChangeOnClick: false, allowValueChangeOnMouseWheel: false,
				rotation: 'clockwise',
				progressBar: {
                    style: { fill: '#00a4e1', stroke: 'grey' },
                    size: '10%',
                    offset: '35%',
                    background: { fill: 'grey', stroke: 'grey' }
                }
			});
			if (!e.update && this.updateData)
				e.update = this.updateData;
			delete this.updateData;

			this.update(e.update);
			this.eventleriBagla();
		}

		update(e) {
			e = e || {};
			const divLabel = this.label;
			if (!divLabel)
				return false;
			
			divLabel.removeClass('success warning error');

			let value = e.label;
			if (value != null)
				divLabel.html(value);
			value = e.labelTemplate;
			if (value != null)
				divLabel.addClass(value);
			
			const divProgress = this.progress;
			value = e.min;
			if (value != null)
				divProgress.jqxKnob('min', value);
			value = e.max;
			if (value != null)
				divProgress.jqxKnob('max', value);
			value = e.progress;
			if (value != null)
				divProgress.val(value);
			value = e.step;
			if (value != null)
				divProgress.val((this.progress.val() || 0) + value);
			
			value = e.showLoading;
			if (value != null)
				this.loading[value ? 'removeClass' : 'addClass']('basic-hidden');
			
			divLabel[divLabel.html() ? 'removeClass' : 'addClass']('jqx-hidden');
		}

		eventleriBagla(e) {
			e = e || {};
			const layout = e.layout || this.layout;
			let elm = layout;
			['click', 'touchend'].forEach(key => {
				elm.off(key);
				elm.on(key, async evt =>
					await this.onClicked($.extend({}, e, { event: evt })));
			});
		}

		async onClicked(e) {
			if (this.isDestroyed)
				return;
			
			const divLabel = this.label;
			if (!divLabel.hasClass(`success`))
				return;
			
			const app = this.app || sky.app;
			if (app)
				await app.knobProgressHideWithReset();
			else
				await this.destroyPart();
		}
	}
})()
