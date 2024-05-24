(function() {
	window.SosyalDurumXYuklePart = class extends window.SosyalDurumPartBase {
		constructor(e) {
			e = e || {};
			super(e);
		}


		preInitLayout(e) {
			e = e || {};
			super.preInitLayout(e);

			const layout = e.layout || this.layout;
			layout.find(`#islemTuslari-ek button`)
				.jqxButton({ theme: theme })
				.off('click').on('click', evt => {
					const {id} = evt.target;
					switch (id) {
						case 'baslat':
							this.baslatIstendi(e);
							break;
						case 'geri':
							this.geriIstendi(e);
							break;
					}
				});
			
			const islemTuslariEk = this.islemTuslariEk = layout.find(`#islemTuslari-ek`);
			$.extend(this, {
				btnGeri: islemTuslariEk.find(`#geri`),
				btnBaslat: islemTuslariEk.find(`#baslat`)
			})
		}

		postInitLayout(e) {
			e = e || {};
			super.postInitLayout(e);
		}

		baslatIstendi(e) {
		}

		veriYuklendi(e) {
			const {app} = this;
			const tanimlar = app.tanimlar = app.tanimlar || {};
			
			const {result} = e;
			if (!result)
				throw { isError: true, rc: `noWSResult`, errorText: `Merkezde Veri İşleme sorunu` };
			
			const kisiSayac = asInteger(result.kisiSayac);
			if (!kisiSayac)
				throw { isError: true, rc: `noID`, errorText: `Merkezden gelen cevapta <b>Kişi</b> bilgisi belirlenemedi` };
			
			const {kisiRec} = result;
			if (kisiRec)
				tanimlar.kisiRec = kisiRec;

			app.kisiSayac = kisiSayac;
			Utils.cookie('kisiSayac', kisiSayac);
			app.showContent({ partClass: SosyalDurumDegerlendirmePart });
		}
	}
})()
