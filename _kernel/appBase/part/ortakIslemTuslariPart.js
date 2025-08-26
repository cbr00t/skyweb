(function() {
	window.OrtakIslemTuslariPart = class extends window.Part {
		constructor(e) {
			super(e);

			e = e || {}
			$.extend(this, {
				currentPart: e.currentPart,
				parentPart: e.parentPart,
				geriCallback: e.geriCallback
			});
			
			if (!(this.layout || this.template))
				this.template = (this.app.templates || {})[this.class.defaultTemplateName];
		}

		static get defaultTemplateName() { return 'ortakIslemTuslari' }
		static get partName() { return 'ortakIslemTuslari' }
		get partRoot() { return 'appBase/part/' }
		get defaultLayoutName() { return this.partName }
		/*get defaultLayoutName() { return this.partName }*/


		postInitLayout(e) {
			e = e || {};
			super.postInitLayout(e);
			
			const layout = e.layout || this.layout;
			let islemTuslari = layout.find('.asil.islemTuslari');
			if (!islemTuslari.length)
				islemTuslari = layout;
			this.islemTuslari = islemTuslari;

			layout
				.addClass(`part ${this.partName}`)
				.detach()
				.prependTo(this.app.header);
			islemTuslari.find('button')
				.jqxButton({ theme: theme });
			islemTuslari.find('#btnGeri')
				// .jqxTooltip({ theme: theme, trigger: `hover`, content: `Önceki ekrana dön` })
				.off('click')
				.on('click', evt => this.geriIstendi({ ...e, event: evt }));
			
			const parentOrtakIslemTuslariLayout = ((this.parentPart || {}).ortakIslemTuslariPart || {}).layout;
			if (parentOrtakIslemTuslariLayout && parentOrtakIslemTuslariLayout.length)
				parentOrtakIslemTuslariLayout.addClass('jqx-hidden');
		}

		geriYapilabilirmi(e) {
			return this.currentPart.geriYapilabilirmi(e);
		}


		async geriIstendi(e) {
			e = e ?? {}; let {currentTarget: target} = e.event ?? {};
			if (target) { setButonEnabled($(target), false) }
			try {
				for (let key of ['content', 'layout', 'id', 'template', 'ilkmi']) { delete e[key] }
				let result = await this.geriYapilabilirmi(e); if (!result) { return false }
				const {currentPart} = this, {canDestroy} = currentPart.class;
				await currentPart.deactivatePart({ parentPart: this.parentPart, destroy: canDestroy });
	
				let layout = e.layout || this.layout;
				if (layout && layout.length) {
					layout
						.removeClass(`part ${this.partName}`)
						.detach().appendTo(layout);
				}
	
				let parentOrtakIslemTuslariLayout = this.parentPart?.ortakIslemTuslariPart?.layout;
				if (parentOrtakIslemTuslariLayout?.length) { parentOrtakIslemTuslariLayout.removeClass('jqx-hidden') }
				
				await this.destroyPart(e);
				let {geriCallback: callback} = this;
				if (callback && !e.noGeriCallback) { await callback.call(this, e) }
			}
			finally {
				if (target) {
					try { setButonEnabled($(target), true) }
					catch (ex) { }
				}
			}
		}
		geriIstendiNoCallback(e) { return this.geriIstendi({ ...e, noGeriCallback: true }) }
	}
})()
