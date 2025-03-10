(function() {
	window.CETDokumOnizlemePart = class extends window.CETSubPart {
		static get partName() { return 'cetDokumOnizleme' }
		get adimText() { return 'Döküm Önizleme' }
		get outputHeight() { return $(window).height() - sky.app.header.outerHeight() - 5 }
		constructor(e) {
			e = e || {}; super(e);
			$.extend(this, { printOutput: e.printOutput || '', yazdirIslemi: e.yazdirIslemi });
			if (!(this.layout || this.template)) { this.template = sky.app.templates.cetDokumOnizleme }
		}
		async postInitLayout(e) {
			e = e || {}; await super.postInitLayout(e); const layout = e.layout || this.layout;
			const btnKopya = this.btnKopya = layout.find('#kopya').jqxButton({ theme, width: 40, height: 38 });
			btnKopya.on('click', event => this.kopyaIstendi({ ...e, event }));
			const btnYazdir = this.btnYazdir = layout.find('#yazdir').jqxButton({ theme, width: 40, height: 38 });
			if (this.yazdirIslemi) { btnYazdir.on('click', event => this.yazdirIstendi({ ...e, event })) } else { setButonEnabled(btnYazdir, false) }
			const txtOutput = this.txtOutput = layout.find('#output'); txtOutput.parent().height(this.outputHeight);
			const txtNusha = this.txtNusha = layout.find('#nushaSayi');
			txtNusha.on('focus', ({ currentTarget: target }) => target.select());
			txtNusha.on('change', ({ currentTarget: target }) => {
				let value = asInteger(target.value), min = asInteger(target.min), max = asInteger(target.max);
				let orjValue = value; value = Math.min(Math.max(value, min), max);
				if (value != orjValue) { target.value = value }
				this.nushaSayi = value
			});
			let elms = [
				layout.find('#eksi').jqxButton({ theme, width: 40, height: 38 }),
				layout.find('#arti').jqxButton({ theme, width: 40, height: 38 })
			];
			for (let elm of elms) {
				elm.on('click', ({ currentTarget: target }) => {
					let {id} = target, nushaSayi = this.nushaSayi ?? 0;
					let txtNusha = this.txtNusha[0], min = asInteger(txtNusha.min), max = asInteger(txtNusha.max);
					switch (id) {
						case 'eksi': if (nushaSayi > (min ?? 0)) { txtNusha.value = --nushaSayi } break
						case 'arti': if (!max || nushaSayi < max) { txtNusha.value = ++nushaSayi } break
					}
					this.nushaSayi = nushaSayi
				})
			}
			this.write({ text: this.printOutput }); this.initEvents(e)
		}
		async destroyPart(e) { this.removeEvents(e); return await super.destroyPart(e) }
		initEvents(e) {
			const {app} = this, _partName = `${this.partName}_outputParent`, events = app.events[_partName] = app.events[_partName] || {};
			let eventName = `resize`; if (!events[eventName]) {
				events[eventName] = evt => {
					this.setUniqueTimeout({
						key: `${eventName}Event`, delayMS: 200,
						args: $.extend({}, e, { partName: _partName, eventName, event: evt }),
						block: e => {
							const events = app.events[e.partName] || {}; if (!(app.activePart == this && events[e.eventName])) { return }
							const {txtOutput, outputHeight} = this; txtOutput.parent().height(outputHeight)
						}
					})
				};
				$(window).on(eventName, events[eventName])
			}
		}
		removeEvents(e) {
			e = e || {}; const {app} = this, _partName = `${this.partName}_outputParent`;
			const events = app.events[_partName] || {}, eventNames = [`resize`];
			for (let eventName of eventNames) { if (events[eventName]) { delete events[eventName] } }
		}
		write(e) {
			e = (typeof e == 'object') ? e : { text: e };
			let {text} = e; if (!text) { return false } text = text.toString();
			const newLineFlag = asBool(e.newLine); if (newLineFlag) { text += CrLf }
			let {txtOutput} = this, printOutput = this.printOutput = (txtOutput.val() + text);
			txtOutput.val(printOutput); return true
		}
		async yazdir(e) {
			e = e ?? {}; let nushaSayi = e.nushaSayi = this.nushaSayi || 0, {btnYazdir, yazdirIslemi} = this;
			setButonEnabled(btnYazdir, false); try { return await yazdirIslemi?.call(this, e) }
			finally { setTimeout(() => setButonEnabled(btnYazdir, true), 1000) }
		}
		async kopyaIstendi(e) {
			const {app} = sky, {txtOutput} = this;
			await navigator.clipboard.writeText(txtOutput.val()); txtOutput.select();
			displayMessage(`Rapor Bilgisi ara belleğe (<i>clipboard</i>) kopyalandı`, app.appText)
		}
		async yazdirIstendi(e) {
			try {
				let result = await this.yazdir(e);
				if (result && !result?.isError) { if (this.isComponent) { await this.destroyPart(e) } else { await this.geriIstendi(e) } }
				return result
			}
			catch (ex) { displayMessage(`@ ${ex.errorText || ex.message || ex} @`, 'Döküm Sorunu'); throw ex }
			finally {
				const {app} = sky;
				if (app.hasKnobProgress) { app.knobProgressHideWithReset({ delayMS: 1500 }) } else { setTimeout(() => hideProgress(), 1500) }
			}
		}
	}
})()
