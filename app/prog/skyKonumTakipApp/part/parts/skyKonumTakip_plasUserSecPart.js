(function() {
	window.SkyKonumTakip_PlasUserSecPart = class extends window.SkyKonumTakip_BirKismiListePart {
		get defaultTitle() { return `Plasiyer/Kullanıcı Seçimi` }

		wndArgsDuzenle(e) {
			super.wndArgsDuzenle(e);

			const minWidth = 450;
			const minHeight = 300;
			$.extend(e.args, {
				width: Math.max(600, minWidth),
				height: Math.max($(window).height() - 50, minHeight),
				minWidth: minWidth, minHeight: minHeight
			});
		}

		liste_getColumns(e) {
			const result = super.liste_getColumns(e);
			const col = result.find(_col => _col.dataField == 'aciklama');
			if (col)
				col.text = `İsim`;
			
			return result;
		}

		async liste_loadServerData(e) {
			let {recs} = this;
			if (!$.isEmptyObject(recs))
				return await super.liste_loadServerData(e);
			
			const {app} = this;
			const {wsArgs} = e;
			let promise = this.promise_listeTazele;
			if (promise) {
				try {
					if (promise.abort)
						promise.abort();
					if (promise.reject)
						promise.reject(null);
					if (promise)
						recs = await promise;
					promise = this.promise_listeTazele = null;
				}
				catch (ex) { }
			}
				
			try {
				if (!recs) {
					promise = this.promise_listeTazele = app.wsUserPlasListe(wsArgs);
					recs = await promise;
				}
				if (recs)
					recs = recs.rows || recs;
			}
			catch (ex) {
				recs = [];
				((window.savedProcs || {}).hideProgress || hideProgress)();
				// defFailBlock(ex);
				// throw ex;
			}
			finally {
				promise = this.promise_listeTazele = null;
			}
			
			return recs;
		}
	}
})()
