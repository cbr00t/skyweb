(function() {
	window.SkyCafeKategoriDetay = class extends window.MQDetay {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				grupmu: asBool(e.grupmu),
				refID: e.refID
			});
		}
		
		static get table() { return 'mst_ResKategoriDetay' }
		get refTip() { return this.grupmu ? 'grup' : 'urun' }
		
		async getRefInst(e) {
			const {grupmu} = this;
			const selector = grupmu ? `id2Grup` : `id2Urun`;
			const {refID} = this;
			const id2Inst = sky.app[selector];
			let result = id2Inst[refID];
			if (result === undefined) {
				const dbMgr = sky.app.dbMgr_mf;
				const table = grupmu ? `mst_StokGrup` : `mst_Stok`;
				const mstSinif = grupmu ? SkyCafeUrunGrup : SkyCafeUrun;
				const stm = new MQStm({
					sent: new MQSent({
						from: `${table} mst`,
						where: [
							{ degerAta: refID, saha: `mst.kod` }
						],
						sahalar: [
							`mst.rowid`, `mst.*`
						]
					})
				});
				const rec = await dbMgr.tekilExecuteSelect(stm);
				if (rec) {
					result = new mstSinif();
					await result.setValues({ rec: rec });
					id2Inst[refID] = result;
				}
			}

			return result;
		}

		hostVars() {
			let hv = super.hostVars() || {};
			$.extend(hv, {
				grupmu: bool2Int(this.grupmu),
				refID: this.refID
			});
			
			return hv;
		}
		
		async setValues(e) {
			e = e || {};
			await super.setValues(e);
			
			const {rec} = e;
			$.extend(this, {
				grupmu: asBool(rec.grupmu),
				refID: rec.refID
			});
		}

		reduce(e) {
			return $.extend({}, super.reduce(e));
		}
	}
})()
