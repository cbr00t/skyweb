(function() {
	window.SkyCafePratikApp = class extends window.SkyCafeApp {
		constructor(e) {
			super(e);
		}

		static get appName() { return 'skyCafePratikApp' }
		static get wsURLBasePostfix() { return `/pratik` }
		static get pratikSatismi() { return true }
		get appText() { return `${super.appText} - Pratik Satış` }

		async sonIslemler(e) {
			await super.sonIslemler(e);

			let {activePart} = this;
			if (!activePart) {
				await this.showContent({ partClass: SkyCafeMasalarPart });
				activePart = this.activePart;
			}
			if (!activePart)
				return;
			
			if (activePart.partName != 'masalar')
				return;

			setTimeout(async () => {
				let promise = this.promise_masalarTazele;
				await promise;
				promise = this.promise_tanimlariOku;
				await promise;
				
				if ($.isEmptyObject(this.id2Masa)) {
					promise = this.promise_tanimlariYukle;
					try {
						if (promise)
							await promise;
					}
					catch (ex) { }
				}
				
				let elm = activePart.masalarForm.find(`.item:eq(0)`);
				if (elm.length) {
					const masaID = elm.prop('id');
					activePart.masaTiklandi({ id: masaID });
				}
			}, 10);

			// await this.showContent({ partClass: SkyCafeSatisEkraniPart });
		}
	}
})()
