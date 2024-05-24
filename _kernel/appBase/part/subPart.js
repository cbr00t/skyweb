(function() {
	window.SubPart = class extends window.Part {
		static get current() {
			let parts = sky.app.parts = sky.app.parts || {};
			return parts[this.partName]
		}
		static set current(value) {
			let parts = sky.app.parts = sky.app.parts || {};
			parts[this.partName] = value
		}
		static get canDestroy() { return true }
		static get canDefer() { return false }
		static get canDefer_slow() { return false }
		static get deferDisplay() { return this.canDefer }
		static get adimTextGosterilirmi() { return false }
		static get ortakIslemTuslariPartClass() { return OrtakIslemTuslariPart }
		get adimText() { return null }
		get partRoot() { return 'appBase/part/' }
		/* get defaultLayoutName() { return this.partName } */
		
		get geriCallback() {
			const part = this.ortakIslemTuslariPart;
			if (part && !part.isDestroyed)
				return part.geriCallback
			return this._geriCallback
		}
		set geriCallback(value) {
			const part = this.ortakIslemTuslariPart;
			if (part && !part.isDestroyed)
				part.geriCallback = value
			else
				this._geriCallback = value
		}

		constructor(e) {
			e = e || {};
			super(e);
			$.extend(this, {
				// parentPart: e.parentPart || this.parentPart || this.app.activePart,
				isComponent: asBool(e.isComponent),
				_geriCallback: e.geriCallback,
				isPrefetch: e.prefetch || e.isPrefetch
				// expandableIslemTuslariParts: []
			});
		}
		static async run(e) {
			e = e || {};
			let hasCurrent = this.current;
			let part = await this.getInstance(e);
			if (part && hasCurrent && !(part.layout && part.layout.length)) {
				try { await part.destroyPart(e) }
				catch (ex) {}
				await this.resetInstance();
				
				hasCurrent = false;
				part = await this.getInstance(e);
			}
				
			let result = await (hasCurrent ? part.activatePart() : part.run());
			return { part, result }
		}
		static getInstance(e) {
			const parts = sky.app.parts = sky.app.parts || {};
			const partName = this.partName;
			let part = this.current || parts[partName];
			if (!part)
				part = parts[partName] = new this(e)
			let temp = new part.class(e);
			for (const key in temp) {
				const value = temp[key];
				if (value !== undefined)
					part[key] = value
			}
			return part
		}
		static resetInstance() {
			delete this.current;
			const parts = sky.app.parts = sky.app.parts || {};
			const partName = this.partName;
			let part = parts[partName];
			if (!part)
				return null
			delete parts[partName];
			return part
		}
		async run(e) {
			await super.run(e);
			await this.activatePart($.extend({ parentPart: this.parentPart }, e));
			await this.destroyWindows()
		}
		preInitLayout(e) {
			e = e || {};
			super.preInitLayout(e);
			/*const layout = e.layout = e.layout || this.layout
			if (!this.isComponent && !this.prefetch && !this.isPrefetch && this.class.canDefer)
				layout.addClass('animate-slow')
				// layout.css('opacity', .01) */
		}
		async postInitLayout(e) {
			e = e || {};
			if (!this.isComponent && !this.prefetch && !this.isPrefetch) {
				const {layout} = this;
				if (layout?.length) {
					layout.removeClass('animate-veryslow animate-slow animate animate-fast');
					layout.addClass(this.class.canDefer_slow ? 'animate-veryslow' : this.class.canDefer ? 'animate-slow' : 'animate')
				}
			}
			await super.activatePart(e);
			await this.initActivatePartOrtak(e);
			super.postInitLayout(e)
		}
		async destroyPart(e) {
			const barcodeReader = this.barcodeReader;
			if (barcodeReader)
				barcodeReader.destroy();
			
			const expandableIslemTuslariParts = this.expandableIslemTuslariParts || [];
			for (const part of expandableIslemTuslariParts) {
				if (part && !part.isDestroyed)
					part.destroyPart(e)
			}
			delete this.expandableIslemTuslariParts;
			if (!this.isComponent && !this.prefetch && !this.isPrefetch /*&& this.class.canDefer*/) {
				const {layout} = this;
				if (layout?.length) {
					layout.removeClass('animate-veryslow animate-slow animate animate-fast');
					layout.addClass('animate-fast')
				}
			}
			await this.destroyDeactivatePartOrtak(e);
			return await super.destroyPart(e)
		}
		async activatePart(e) {
			await super.activatePart(e);
			await this.initActivatePartOrtak(e);
			const expandableIslemTuslariParts = this.expandableIslemTuslariParts || [];
			for (const part of expandableIslemTuslariParts) {
				if (part && !part.isDestroyed) {
					if (part.layout && part.layout.length)
						part.layout.removeClass(`jqx-hidden`);
					part.postInitLayout(e)
				}
			}
			if (!this.isComponent && !this.prefetch && !this.isPrefetch) {
				const {layout} = this;
				if (layout?.length) {
					layout.removeClass('animate-veryslow animate-slow animate animate-fast');
					if (this._activatedFlag)
						layout.addClass(this.class.canDefer_slow ? 'animate' : 'animate-fast')
					else
						layout.addClass(this.class.canDefer_slow ? 'animate-slow' : this.class.canDefer ? 'animate-slow' : 'animate')
					this._activatedFlag = true
				}
			}
		}
		async deactivatePart(e) {
			const expandableIslemTuslariParts = this.expandableIslemTuslariParts || [];
			for (const part of expandableIslemTuslariParts) {
				if (part && !part.isDestroyed && part.layout && part.layout.length)
					part.layout.addClass(`jqx-hidden`)
			}
			await this.destroyDeactivatePartOrtak(e);
			if (!this.isComponent && !this.prefetch && !this.isPrefetch /*&& this.class.canDefer*/) {
				const {layout} = this;
				if (layout?.length) {
					layout.removeClass('animate-veryslow animate-slow animate animate-fast');
					layout.addClass('animate-fast')
				}
			}
			return await super.deactivatePart(e)
		}
		async initActivatePartOrtak(e) {
			const {layout, isComponent} = this;
			if (!isComponent) {
				if (this == sky.app)
					sky.config.allowUnload()
				else
					sky.config.preventUnload()
				
				let part = this.ortakIslemTuslariPart;
				if (!part) {
					part = this.ortakIslemTuslariPart = new this.class.ortakIslemTuslariPartClass({
						content: layout, parentPart: this.parentPart, currentPart: this,
						geriCallback: this._geriCallback
					});
					await part.run()
				}
			}
			if ((!isComponent && !this.prefetch && !this.isPrefetch) || this.class.adimTextGosterilirmi) {
				const {adimText} = this;
				if (adimText && this.appTitleText != adimText) {
					/*if (this.class.canDestroy)
						this.savedAdimText = this.appTitleText;*/
					this.appTitleText = adimText;
				}
			}
			if (!isComponent)
				this.destroyWindows()
		}
		async destroyDeactivatePartOrtak(e) {
			const {isComponent} = this;
			if (!isComponent) {
				if (this.parentPart == sky.app)
					sky.config.allowUnload();
				else
					sky.config.preventUnload();
				
				let part = this.ortakIslemTuslariPart;
				if (part) {
					await part.destroyPart();
					delete this.ortakIslemTuslariPart;
				}

				/*const partNames = ['ortakIslemTuslariPart'];
				for (let i in partNames) {
					const partName = partNames[i];
					const part = this[partName];
					if (part && !part.isDestroyed)
						await part.destroyPart(e);
					delete this[partName];
				}*/
			}

			if ((!isComponent && !this.prefetch && !this.isPrefetch) || this.class.adimTextGosterilirmi) {
				const {adimText} = (this.parentPart || {});
				if (adimText && this.appTitleText != adimText)
					this.appTitleText = adimText;
				/*const {savedAdimText} = this;
				if (savedAdimText && savedAdimText != this.appTitleText)
					this.appTitleText = savedAdimText;
				delete this.savedAdimText;*/
			}
		}

		geriYapilabilirmi(e) { return !this.isComponent }
		async geriIstendi(e) {
			if (this.isComponent)
				return false
			const {ortakIslemTuslariPart} = this;
			if (ortakIslemTuslariPart)
				return await ortakIslemTuslariPart.geriIstendi(e)
			return false
		}
		geriIstendiNoCallback(e) {
			return this.geriIstendi($.extend({}, e, { noGeriCallback: true }))
		}
	}
})()
