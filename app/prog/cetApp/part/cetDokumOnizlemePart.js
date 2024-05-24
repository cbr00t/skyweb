(function() {
	window.CETDokumOnizlemePart = class extends window.CETSubPart {
		static get partName() { return 'cetDokumOnizleme' }
		get adimText() { return 'Döküm Önizleme' }
		get outputHeight() { return $(window).height() - sky.app.header.outerHeight() - 5 }
		constructor(e) {
			e = e || {};
			super(e);
			$.extend(this, {
				printOutput: e.printOutput || '',
				yazdirIslemi: e.yazdirIslemi
			});
			if (!(this.layout || this.template))
				this.template = this.app.templates.cetDokumOnizleme
		}
		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);
			const layout = e.layout || this.layout;
			const btnKopya = this.btnKopya = layout.find('#kopya').jqxButton({ theme: theme, width: 40, height: 38 });
			btnKopya.on('click', evt =>
				this.kopyaIstendi($.extend({}, e, { event: evt })));
			const btnYazdir = this.btnYazdir = layout.find('#yazdir').jqxButton({ theme: theme, width: 40, height: 38 });
			if (this.yazdirIslemi) {
				btnYazdir.on('click', evt =>
					this.yazdirIstendi($.extend({}, e, { event: evt })));
			}
			else {
				setButonEnabled(btnYazdir, false);
			}
			
			/*let content = this.content;
			if (!(content && content.length))
				content = sky.app.content;*/
			
			const txtOutput = this.txtOutput = layout.find('#output');
			txtOutput.parent().height(this.outputHeight);
			this.write({ text: this.printOutput });
			this.initEvents(e);
		}

		async destroyPart(e) {
			this.removeEvents(e);
			return await super.destroyPart(e);
		}

		initEvents(e) {
			const {app} = this;
			const _partName = `${this.partName}_outputParent`;
			const events = app.events[_partName] = app.events[_partName] || {};
			
			let eventName = `resize`;
			if (!events[eventName]) {
				events[eventName] = evt => {
					this.setUniqueTimeout({
						key: `${eventName}Event`,
						delayMS: 200,
						args: $.extend({}, e, {
							partName: _partName, eventName: eventName,
							event: evt
						}),
						block: e => {
							const events = app.events[e.partName] || {};
							if (!(app.activePart == this && events[e.eventName]))
								return;
							
							const {txtOutput} = this;
							txtOutput.parent().height(this.outputHeight);
						}
					})
				};
				$(window).on(eventName, events[eventName]);
			}
		}
		removeEvents(e) {
			e = e || {};
			const {app} = this;
			const _partName = `${this.partName}_outputParent`;
			const events = app.events[_partName] || {};
			const eventNames = [`resize`];
			for (let i in eventNames) {
				const eventName = eventNames[i];
				if (events[eventName]) {
					// $(window).off(eventName);
					delete events[eventName];
				}
			}
		}
		write(e) {
			e = (typeof e == 'object') ? e : { text: e };
			let text = e.text;
			if (!text)
				return false
			text = text.toString();
			const newLineFlag = asBool(e.newLine);
			if (newLineFlag)
				text += CrLf
			const {txtOutput} = this;
			let printOutput = this.printOutput = (txtOutput.val() + text);
			txtOutput.val(printOutput);
			return true;
		}

		async yazdir(e) {
			const btnYazdir = this.btnYazdir;
			setButonEnabled(btnYazdir, false);
			try {
				let handler = this.yazdirIslemi;
				if ($.isFunction(handler))
					return await handler.call(this, e);
			}
			finally {
				setTimeout(() =>
					setButonEnabled(btnYazdir, true)
					, 1000);
			}
		}
		async kopyaIstendi(e) {
			const app = this.app ?? sky.app, {txtOutput} = this;
			await navigator.clipboard.writeText(txtOutput.val());
			txtOutput.select();
			displayMessage(`Rapor Bilgisi ara belleğe (<i>clipboard</i>) kopyalandı`, app.appText)
		}
		async yazdirIstendi(e) {
			// await showProgress('Döküm yapılıyor...', null, 0);
			try {
				let result = await this.yazdir(e);
				if (result && !(result || {}).isError) {
					if (this.isComponent)
						await this.destroyPart(e)
					else
						await this.geriIstendi(e)
				}
				return result
			}
			catch (ex) {
				displayMessage(`@ ${ex.errorText || ex.message || ex} @`, 'Döküm Sorunu');
				throw ex
			}
			finally {
				const app = this.app;
				if (app.hasKnobProgress)
					app.knobProgressHideWithReset({ delayMS: 1500 })
				else
					setTimeout(() => hideProgress(), 1500)
			}
		}
	}
})()
