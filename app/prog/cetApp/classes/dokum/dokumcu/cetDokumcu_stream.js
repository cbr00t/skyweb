(function() {
	window.CETDokumcu_Stream = class extends window.CETDokumcu {
		async writeToDevice(e) {
			await super.writeToDevice(e);

			let handler = e.dokumIslemi;
			if ($.isFunction(handler)) {
				let result = await handler.call(this, e);
				if (result)
					return result;
			}

			const fis = e.fis;
			if (fis) {
				result = await fis.dokumcuWriteToDevice(e);
				if (result)
					return result;
			}

			return false;
		}
	}
})()
