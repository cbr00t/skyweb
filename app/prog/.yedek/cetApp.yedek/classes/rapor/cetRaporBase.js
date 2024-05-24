(function() {
	window.CETRapor = class extends window.CObject {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				ustBilgiSatirlari: e.ustBilgiSatirlari || this.class.defaultUstBilgiSatirlari || [],
				altBilgiSatirlari: e.altBilgiSatirlari || this.class.defaultAltBilgiSatirlari || []
			})
		}

		get raporUISinif() { return null }
		static get defaultUstBilgiSatirlari() { return [] }
		static get defaultAltBilgiSatirlari() { return [] }

		static getListeItem(e) {
			e = e || {};
			let raporSinif = e.raporSinif;
			let kod = e.kod || raporSinif.kod;
			let aciklama = e.aciklama || raporSinif.aciklama;
			
			return { kod: kod, aciklama: aciklama, raporSinif: raporSinif }
		}

		async run(e) {
			e = e || {};
			let result = await this.veriOlustur(e);
			if (!result || (result || {}).isError)
				return false;
			
			this.dokumVeri = e.dokumVeri;
			
			return { result: result }
		}

		async yazdir(e) {
			const {dokumVeri} = this;
			const result = await dokumVeri.yazdir();

			return result;
		}

		async veriOlustur(e) {
			const dokumVeriArgs = e.dokumVeriArgs = { matbuuForm: await this.getMatbuuForm(e) };
			let result = await this.dokumVeriArgsDuzenle(e);
			if (result === false)
				return null;
			
			result = await this.dokumVeriArgsDuzenleSon(e);
			if (result === false)
				return null;
			
			return (e.dokumVeri = new CETDokumVeri(e.dokumVeriArgs))
		}

		async dokumVeriArgsDuzenle(e) {
			const {dokumVeriArgs} = e;
			dokumVeriArgs.dokumBaslikDegeriDict = dokumVeriArgs.dokumBaslikDegeriDict || {};
			const dokumDegeriDict = dokumVeriArgs.dokumDegeriDict = dokumVeriArgs.dokumDegeriDict || {};
			$.extend(dokumDegeriDict, {
				ustBilgiSatirlari: e => this.ustBilgiSatirlari || [],
				altBilgiSatirlari: e => this.altBilgiSatirlari || [],
				Miktar(e) {
					const brm2Toplam = {};
					this.detaylar.forEach(det => {
						const brm = det.brm || 'AD';
						brm2Toplam[brm] = (brm2Toplam[brm] || 0) + asFloat(det.miktar) || 0;
					});
					const result = [];
					$.each(brm2Toplam, (brm, toplam) => {
						if (toplam)
							result.push(`${toplam} ${brm}`);
					});
					return result.join(' ; ');
				}
			});
		}


		async dokumVeriArgsDuzenleSon(e) {
			/*const dokumVeriArgs = e.dokumVeriArgs;
			const dokumDegeriDict = dokumVeriArgs.dokumDegeriDict;*/
		}

		async getMatbuuForm(e) {
			let _e = {};
			await this.matbuuFormArgsDuzenle($.extend({}, e, { matbuuFormArgs: _e }));
			return new CETMatbuuForm(_e);
		}

		matbuuFormArgsDuzenle(e) {
			$.extend(e.matbuuFormArgs, {
				formBilgi: {
					kolonBaslikGosterilirmi: true,
					dipYazdirilirmi: false,
					tekDetaySatirSayisi: 1,
					sayfaBoyutlari: { x: 41 },
					otoYBasiSonu: { basi: 9 }
				},
				normalSahalar: {},
				digerSahalar: {
					Dip: { pos: { x: 1 } }
				}
			});
		}
	};


	window.CETRaporGridli = class extends window.CETRapor {
		get raporUISinif() { return CETRaporGridliPart }

		async run(e) {
			let result = await super.run(e);
			if (!result)
				return false;
			
			const uiSinif = this.raporUISinif;
			if (!uiSinif)
				return false;
			
			const part = new uiSinif({ rapor: this });
			await part.run();

			return { result: result, part: part }
		}

		listeArgsDuzenle(e) {
		}

		async liste_columnsDuzenle(e) {
		}

		tazeleSonrasi(e) {
		}

		getCellClassName(e) {
			const {part, columnField, rec} = e;
			let cssNamePrefix = columnField;
			if (rec) {
				if (rec.toplammi)
					cssNamePrefix = `toplam`;
				else if (rec.grupmu)
					cssNamePrefix = `grup`;
				else if (rec.altGrupmu)
					cssNamePrefix = `grup`;
			}
			/*if (columnField == 'satis' || columnField == 'iade' || columnField == 'genel' || columnField == 'netBedel')
				return `${cssNamePrefix} bold`;*/
			
			return cssNamePrefix;
		}

		getCellsRenderer(e) {
			let {value} = e;
			if (value && $.isArray(value))
				value = value.join(`<br/>${CrLf}`);
			
			return `<span class="${this.getCellClassName(e) || ''}">${value}</span>`
		}
	};


	window.CETRaporText = class extends window.CETRapor {
		async run(e) {
			let result = await super.run(e);
			if (!result)
				return false;
			
			const {dokumVeri} = this;
			const dokumDevice = new CETDokumDevice_Ekran({ display: true });
			result = await dokumVeri.yazdir({ dokumDevice: dokumDevice });

			return { result: result, dokumVeri: dokumVeri, dokumDevice: dokumDevice }
		}
	};
})()
