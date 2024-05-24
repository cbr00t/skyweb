(function() {
	window.SkyConfigYetki = class extends window.CObject {
		static get yetkiler() {
			let result = this._yetkiler;
			if (result == null) {
				result = this._yetkiler = {
					restricted: 0,
					skyBulutYedekleme: 1,
					user: 18,
					subServiceManager_restricted: 20,
					subServiceManager: 25,
					vioManager_readOnly: 30,
					vioManager: 35,
					admin_readOnly: 45,
					admin: 50,
					developer: 100
				};
			}
			return result;
		}

		static get num2Yetki() {
			let result = this._num2Yetki;
			if (result == null) {
				const {yetkiler} = this;
				result = {};
				for (const key in yetkiler) {
					const vale = yetkiler[key];
					result[value] = key;
				}
				this._num2Yetki = result;
			}
			return result;
		}

		static get yetki2EkBilgi() {
			let result = this._yetki2EkBilgi;
			if (result == null) {
				result = this._yetki2EkBilgi = {
					restricted: {
						aciklama: `Kısıtlı`,
						renk: 'gray',
						izinler: []
					},
					skyBulutYedekleme: {
						aciklama: `Sky Bulut Yedekleme`,
						renk: 'steelblue',
						izinler: [
							`Verilerin Bulutta Yedeklemenmesi`,
							`Kendi Yedek Dosyalarına Erişim`
						]
					},
					user: {
						aciklama: `Normal Kullanıcı`,
						izinler: [
							`Sadece Servis ve Sistem Durumunu izler`
						]
					},
					subServiceManager_restricted: {
						aciklama: `Sky WebServis Yönetimi (<i>Sadece İzler</i>)`,
						renk: 'gray',
						izinler: [
							`Servislerin Başlatılması/Durdurulması işlemlerini yapabilir`
						]
					},
					subServiceManager: {
						aciklama: `Sky WebServis Yönetimi`,
						izinler: [
							`Servis Ekleme/Değiştirme/Kaldırma işlemi yapabilir`
						]
					},
					vioManager_readOnly: {
						aciklama: `VIO Ayar Yönetimi (<i>Sadece İzler</i>)`,
						renk: 'darkgray',
						izinler: [
							`VIO Ayarlarını izler`
						]
					},
					vioManager: {
						aciklama: `VIO Ayar Yönetimi`,
						renk: 'steelblue',
						izinler: [
							`VIO Ayarlarını değiştirebilir`
						]
					},
					admin_readOnly: {
						aciklama: `Tam Yönetici (<i>Sadece İzler</i>)`,
						renk: 'slategray',
						izinler: [
							`VIO ve SkyWebServis Ayarlarını okur`,
							`VIO Ayarlarında değişiklik yapabilir`
						]
					},
					admin: {
						aciklama: `Tam Yönetici`,
						renk: 'royalblue',
						izinler: [
							`VIO ve SkyWebServis Ayarlarında değişiklik yapabilir`
						]
					}
				};

				const {app} = sky;
				if (app.programcimi && app.gelismisModmu && !app.gelismisModDisabledFlag && this.yetkilimi({ yetki: 'developer' })) {
					result.developer = {
						aciklama: `Yazılım Geliştirici (<i>VIO ve Sistem bazında TAM YETKİLİ</i>)`,
						renk: 'orange',
						izinler: [
							`VIO, Sky WebServis ve Tüm Sistem genelinde her türlü işlemi yapabilir`
						]
					};
				}
			}
			return result;
		}
		
		static yetkilimi(e) {
			e = e || {};
			let key;
			const {yetkiler} = this;
			
			key = typeof e == 'object' ? e.mevcutYetki : e;
			if (!key)
				key = (sky.config.sessionInfo || {}).yetki;
			if (!key)
				return null;
			let mevcutYetkiNum = typeof key == 'number' ? key : null;
			if (mevcutYetkiNum == null && typeof key == 'string')
				mevcutYetkiNum = yetkiler[key];
			
			key = typeof e == 'object' ? e.yetki : e;
			if (!key)
				return null;
			let yetkiNum = typeof key == 'number' ? key : null;
			if (yetkiNum == null && typeof key == 'string')
				yetkiNum = yetkiler[key];

			if (mevcutYetkiNum == null || yetkiNum == null)
				return null;

			return mevcutYetkiNum >= yetkiNum;
		}
	}
})()
