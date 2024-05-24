(function() {
	window.MFYapi = class extends window.CObject {
		constructor(e) {
			e = e || {};
			super(e);

			/*let value = e.mustKod;
			if (value != null)
				this.mustKod = value;*/
			
			let value = e.riskCariKod;
			if (value != null)
				this.riskCariKod = value;
		}


		static get table() { return null }
		static get tableAlias() { return null }

		hostVars() {
			return {}
		}

		setValues(e) {
		}

		async onKontrolWithException(e) {
			let result = await this.onKontrol(e) || {};
			if (result.isError)
				throw result;
			
			return true;
		}

		async onKontrol(e) {
			return { isError: false };
		}

		error_onKontrol(e, _rc) {
			e = e || {};
			if (typeof e != 'object')
				e = { rc: _rc, errorText: e };
			
			return { isError: true, rc: e.rc || '', errorText: e.errorText || e.message }
		}
	};
})()
