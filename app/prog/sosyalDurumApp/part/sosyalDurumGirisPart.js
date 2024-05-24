(function() {
	window.SosyalDurumGirisPart = class extends window.SosyalDurumPartBase {
		constructor(e) {
			e = e || {};
			super(e);
		}

		static get partName() { return 'giris' }


		preInitLayout(e) {
			e = e || {};
			super.preInitLayout(e);

			const layout = e.layout || this.layout;
			layout.find(`#islemTuslari-ek button`)
				.jqxButton({ theme: theme })
				.off('click').on('click', evt => {
					const {id} = evt.target;
					switch (id) {
						case 'hizmetDokumundenYukle':
							this.app.showContent({ partClass: SosyalDurumHizmetDokumundenYuklePart });
							break;
						case 'eDevlettenYukle':
							this.app.showContent({ partClass: SosyalDurumEDevlettenYuklePart });
							break;
					}
				});
		}
	}
})()
