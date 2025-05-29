(function() {
	window.MQTekil = class extends window.MFYapi {
		static get storageName() { return `${sky.app.appName}.${this.table}` } static get mqTekilmi() { return true } get storageName() { return this.class.storageName }
		yukle(e) {
			e = e || {};
			let result = e.rec || localStorage.getItem(this.storageName);
			result = result ? JSON.parse(result) : null;
			if (!result)
				return false
			this.setValues({ rec: result });
			return true;
		}
		async kaydet(e) {
			e = e || {};
			await this.onKontrolWithException(e);
			let hv = await this.hostVars();
			if (!hv)
				return false
			localStorage.setItem(this.storageName, toJSONStr(hv));
			if ($.isFunction(e.parcaCallback)) {
				let _e = $.extend({ parca: [hv], parcaSize: 1 }, e || {});
				await e.parcaCallback.call(this, _e)
			}
			return true
		}
	};
})()
