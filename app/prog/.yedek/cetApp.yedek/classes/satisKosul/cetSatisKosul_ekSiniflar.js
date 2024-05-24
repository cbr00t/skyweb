(function() {
	window.CETFiyatKosul = class extends window.CETSatisKosul {
		static get kosulTip() { return 'FY' }

		static get kosulDetayEkSahalar() {
			return $.merge(
				super.kosulDetayEkSahalar || [],
				[ 'ozelFiyat', 'orjFiyat' ]
			)
		}
	}

	window.CETIskontoKosul = class extends window.CETSatisKosul {
		static get kosulTip() { return 'SB' }

		static get kosulDetayEkSahalar() {
			const result = super.kosulDetayEkSahalar;
			for (let i = 1; i <= sky.app.iskSayi; i++)
				result.push(`iskOran${i}`);
			return result;
		}
	}

	window.CETKampanyaKosul = class extends window.CETSatisKosul {
		static get kosulTip() { return 'KM' }

		static get kosulDetayEkSahalar() {
			const result = super.kosulDetayEkSahalar;
			for (let i = 1; i <= sky.app.iskSayi; i++)
				result.push(`kamOran${i}`);
			return result;
		}
	}

	window.CETMalFazlasiKosul = class extends window.CETSatisKosul {
		static get kosulTip() { return 'MF' }

		static get kosulDetayEkSahalar() {
			return $.merge(
				super.kosulDetayEkSahalar || [],
				[ 'mfPay', 'mfBaz' ]
			)
		}
	}
})()
