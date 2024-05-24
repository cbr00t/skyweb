(function() {
	window.CETKMGirisPart = class extends window.CETSubPart {
		constructor(e) {
			e = e || {};
			super(e);
			
			$.extend(this, {
				param: this.app.param,
				sonmu: asBool(e.sonmu),
				kaydetIslemi: e.kaydetIslemi
			});
			if (!(this.layout || this.template))
				this.template = this.app.templates.cetKMGiris;
		}

		static get partName() { return 'cetKMGiris' }
		get adimText() { return 'KM Giriş' }


		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);

			const layout = e.layout || this.layout;
			const btnKaydet = this.btnKaydet
				= layout.find(`#kaydet`)
					.jqxButton({ theme: theme, width: 40, height: 45 });
			btnKaydet.on('click', evt =>
				this.kaydetIstendi($.extend({}, e, { event: evt })));
			
			const {param, sonmu} = this;
			['ilkKM', 'sonKM'].forEach(key =>
				param[key] = asFloat(param[key]) || 0);
			let txtIlkKM = this.txtIlkKM = layout.find('#ilkKM').jqxNumberInput({
				theme: theme, width: 200, height: false, inputMode: 'simple',
				min: 0, max: 500000, decimalDigits: 1, spinButtons: true, spinButtonsWidth: 32,
				decimal: asFloat(param.ilkKM) || 0, disabled: sonmu
			});
			txtIlkKM.parent().find('input').on('keyup', evt => {
				const key = ((evt || {}).key || '').toString().toLowerCase();
				if (key == 'enter' || key == 'linefeed')
					this.kaydetIstendi(e);
			});
			
			let txtSonKM = this.txtSonKM = layout.find('#sonKM');
			txtSonKM.jqxNumberInput({
				theme: theme, width: 200, height: false, inputMode: 'simple',
				min: 0 || 0, max: (param.ilkKM || 0) + 500000,
				decimalDigits: 1, spinButtons: true, spinButtonsWidth: 32,
				decimal: asFloat(param.sonKM) || 0, disabled: !sonmu
			});
			txtSonKM.parent().find('input').on('keyup', evt => {
				const key = ((evt || {}).key || '').toString().toLowerCase();
				if (key == 'enter' || key == 'linefeed')
					this.kaydetIstendi(e);
			});
			layout.find('input').on('focus', evt =>
				evt.target.select());

			setTimeout(() =>
				(sonmu ? txtSonKM : txtIlkKM)
					.parent().find('input').focus(),
				500);
		}

		async kaydet(e) {
			let errText = await this.onKontrolMesaji(e);
			if (errText) {
				displayMessage(`@ ${errText}`, this.adimText);
				return false;
			}

			const param = this.param;
			const sonmu = this.sonmu;
			let km = asFloat((sonmu ? this.txtSonKM : this.txtIlkKM).jqxNumberInput('decimal')) || 0;
			param[`${sonmu ? 'son' : 'ilk'}KM`] = km;
			
			return await param.kaydet();
		}

		onKontrolMesaji(e) {
			const param = this.param;
			const sonmu = this.sonmu;
			const ilkKM = asFloat(param.ilkKM) || 0;
			const sonKM = asFloat(param.sonKM) || 0;
			
			const oncekiKM = asFloat(param[`${sonmu ? 'son' : 'ilk'}KM`]) || 0;
			const km = asFloat((sonmu ? this.txtSonKM : this.txtIlkKM).jqxNumberInput('decimal')) || 0;
			if (!km)
				return `(<b>${sonmu ? 'Son' : 'İlk'} KM</b>) belirtilmelidir`;
			if (sonmu && km <= ilkKM)
				return `(<b>Son KM</b>) değeri (<b><i>İlk KM</i></b>) değerinden büyük olmalıdır`;
			if (!sonmu && km <= sonKM)
				return `(<b>İlk KM</b>) değeri (<b><i>Önceki Son KM</i></b>) değerinden büyük olmalıdır`;
			if (km <= oncekiKM)
				return `(<b>${sonmu ? 'Son' : 'İlk'} KM</b>)</b>) değeri Önceki değerden daha büyük olmalıdır`;
			
			return null;
		}


		async kaydetIstendi(e) {
			await showProgress(`KM Bilgisi kaydediliyor...`, null, 1);
			try {
				const {param, sonmu} = this;
				const {ilkKM, sonKM} = param;
				
				let result = await this.kaydet(e);
				if (result && !(result || {}).isError) {
					if (this.isComponent)
						await this.destroyPart(e);
					else
						await this.geriIstendi(e);

					let handler = this.kaydetIslemi;
					if (handler)
						handler.call(this, { sender: this, ilkKM: ilkKM, sonKM: sonKM });
				
					this.app[`${sonmu ? 'son' : 'ilk'}KMGirildimi`] = true;
				}
				
				return result;
			}
			finally {
				const app = this.app;
				if (app.hasKnobProgress)
					await app.knobProgressHideWithReset({ delayMS: 1500 });
				else
					setTimeout(() => hideProgress(), 1500);
			}
		}
	}
})()
