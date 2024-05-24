(function() {
	window.SkyCafeBarkodParser = class extends window.CObject {
		constructor(e) {
			e = e || {};
			super(e);

			this.dbMgr = e.dbMgr || sky.app.dbMgr_mf;
			this.setGlobals(e);
		}

		static get aciklama() { return '' }
		static getKuralSinif(e) { return SkyCafeBarkodKurali }

		async parse(e) {
			let result = await this.parseDevam(e);
			if (!result)
				return result;
			
			return await this.parseSonrasi(e);
		}

		async parseDevam(e) {
			this.setGlobals(e);
			return false;
		}

		async parseSonrasi(e) {
			let {carpan} = this;
			if (carpan && carpan != 1)
				this.miktar = (this.miktar || 1) * carpan;
			
			return true;
		}

		setGlobals(e) {
			e = e || {};
			let barkod = e.barkod || this.barkod || this.okunanBarkod;
			if (barkod) {
				const carpan = e.carpan || 1;
				$.extend(this, {
					okunanBarkod: barkod,
					barkod: barkod,
					carpan: carpan
					// stokKod: barkod,
					// miktar: 1
				});
			}
		}

		async stokEkBilgileriBelirle(e) {
			e = e || {};
			let stokKod = e.stokKod || this.stokKod;
			if (!stokKod)
				return false;
			
			const dbMgr = e.dbMgr || this.dbMgr;
			const tip = e.tip || this.tip;
			const fiyatAttr = (tip ? SkyCafeUrun.tip2FiyatAttr[tip] : null);
			let stm = new MQStm({
				sent: new MQSent({
					from: 'mst_Stok stk',
					where: [
						{ degerAta: stokKod, saha: `stk.kod` }
					],
					sahalar: [
						'stk.kod stokKod', 'stk.aciklama stokAdi', 'stk.brm', `stk.kdvOrani`, `stk.degiskenFiyatmi`,
						`${fiyatAttr ? `stk.${fiyatAttr}` : `NULL`} fiyat`
					]
				})
			});
			
			let rec = e.stokRec = await dbMgr.tekilExecuteSelect({ query: stm });
			if (!rec)
				return false;
			
			for (const key in rec) {
				const value = rec[key];
				if (value != null)
					this[key] = value;
			}
			this.degiskenFiyatmi = asBool(this.degiskenFiyatmi);

			return true;
		}
	}
})();
