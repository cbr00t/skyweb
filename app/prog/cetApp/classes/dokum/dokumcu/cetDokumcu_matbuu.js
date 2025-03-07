(function() {
	window.CETDokumcu_Matbuu = class extends window.CETDokumcu {
		/*	örnek:
				dokumcu = new CETDokumcu_Matbuu({
					dokumDevice: new CETDokumDevice_Ekran({
						display: true
						// callback: e => e.device.text...
					}),
				});
				await dokumcu.yazdir({
					debug: true,
					matbuuFormTip: 'Fatura',
					fis: CETSatisFaturaFis.From({
						fisTipText: 'ABC',
						fisSeri: 'VBD', fisNo: '12345'
					})
				})
		*/
		constructor(e) { e = e || {}; super(e); }
		async yazdirDevam(e) {
			await super.yazdirDevam(e); const matbuuForm = e.matbuuForm || await CETMatbuuForm.fromTip(e);
			if (!matbuuForm) { throw { isError: true, rc: 'matbuuForm', errorText: `${e.tip ? e.tip + ' için' : ''} Matbuu Form belirlenemedi` } }
			this.sayfalar = []; return await matbuuForm.yazdir({ ...e, dokumcu: this })
		}
		sayfaEkle(e) {
			const {matbuuForm} = e, {formBilgi: matbuuFormBilgi} = matbuuForm, {sayfaBoyutlari} = matbuuFormBilgi;
			let sayfa = new CETDokumSayfa({ maxX: sayfaBoyutlari.x, sinir: matbuuFormBilgi.surekliFormmu ? null : sayfaBoyutlari.y });
			this.sayfalar.push(sayfa); return sayfa
		}
		async writeToDevice(e) {
			await super.writeToDevice(e); let {stream: srm} = e, {sayfalar} = this;
			for (const sayfa of sayfalar) { await sayfa.writeToDevice(e) }
		}
	}
})()
