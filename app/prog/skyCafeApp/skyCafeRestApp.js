(function() {
	window.SkyCafeRestApp = class extends window.SkyCafeApp {
		constructor(e) {
			super(e);
		}

		static get appName() { return 'skyCafeRestApp' }
		static get wsURLBasePostfix() { return `/rest` }
		get appText() { return `${super.appText} - Restoran` }


		async sonIslemler(e) {
			await super.sonIslemler(e);

			await this.showContent({ partClass: SkyCafeMasalarPart });
			
			let masaIndex = qs.masa == null ? qs.index : qs.masa;
			if (masaIndex != null) {
				masaIndex = asInteger(masaIndex) - 1;
				if (masaIndex > -1) {
					let {activePart} = this;
					if (!activePart) {
						await this.showContent({ partClass: SkyCafeMasalarPart });
						activePart = this.activePart;
					}
					if (!activePart)
						return;
					
					setTimeout(async () => {
						let promise = this.promise_masalarTazele;
						await promise;
						promise = this.promise_tanimlariOku;
						await promise;
						
						if ($.isEmptyObject(this.id2Masa)) {
							promise = this.promise_tanimlariYukle;
							if (promise)
								await promise;
						}
						let elm = activePart.masalarForm.find(`.item:eq(${masaIndex})`);
						if (elm.length) {
							const masaID = elm.prop('id');
							activePart.masaTiklandi({ id: masaID });
						}
					}, 10);
				}
			}
		}
	}
})()
