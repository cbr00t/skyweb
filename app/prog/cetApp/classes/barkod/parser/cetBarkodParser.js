(function() {
	window.CETBarkodParser = class extends window.CObject {
		static get aciklama() { return '' }
		static getKuralSinif(e) { return CETBarkodKurali }
		
		constructor(e) {
			e = e || {}; super(e);
			this.dbMgr = e.dbMgr || sky.app.dbMgr_mf;
			this.setGlobals(e)
		}
		async parse(e) {
			let result = await this.parseDevam(e);
			if (!result) return result
			return await this.parseSonrasi(e)
		}
		async parseDevam(e) { this.setGlobals(e); return false }
		async parseSonrasi(e) {
			let {carpan} = this;
			if (carpan && carpan != 1) this.miktar = (this.miktar || 1) * carpan
			const {app} = sky, dbMgr = e.dbMgr || this.dbMgr, {tip2EkOzellik} = app;
			if (tip2EkOzellik) {
				const uni = new MQUnionAll(), stm = new MQStm({ sent: uni });
				for (const tip in tip2EkOzellik) {
					const ekOzellik = tip2EkOzellik[tip], {tipAdi, idSaha, kodsuzmu, mbTable, mbKodSaha, mbAdiSaha} = ekOzellik;
					if (ekOzellik.class.ozellikTip == 'ka' && mbTable && (kodsuzmu ? mbAdiSaha : mbKodSaha)) {
						const value = this[idSaha];
						if (value) {
							const sent = new MQSent({
								from: mbTable, where: [{ degerAta: value, saha: kodsuzmu ? mbAdiSaha : mbKodSaha }],
								sahalar: [`'${tip}' tip`, `'${tipAdi}' tipAdi`, `${MQSQLOrtak.sqlDegeri(value)} value`, `COUNT(*) sayi`]
							}); uni.add(sent)
						}
					}
				}
				if (!$.isEmptyObject(uni.liste)) {
					let rs = await dbMgr.executeSql(stm), hataListe = [];
					for (let i = 0; i < rs.rows.length; i++) {
						const _rec = rs.rows[i];
						if (!_rec.sayi) hataListe.push(`<li><b>${_rec.tipAdi}</b> için <u class="bold">${_rec.value}</u> değeri geçersizdir</li>`)
					}
					if (!$.isEmptyObject(hataListe))
						throw { isError: true, rc: 'barkodParseError', errorText: `<ul>${hataListe.join(CrLf)}</ul>` }
				}
			}
			return true
		}
		setGlobals(e) {
			e = e || {}; let barkod = e.barkod || this.barkod || this.okunanBarkod;
			if (barkod) {
				const carpan = e.carpan || 1;
				$.extend(this, { okunanBarkod: barkod, barkod, carpan });
			}
		}
		async shEkBilgileriBelirle(e) {
			e = e || {}; let shKod = e.shKod || this.shKod;
			if (!shKod) return false
			const {app} = sky, dbMgr = e.dbMgr || this.dbMgr, {fis} = e, dovizlimi = fis?.dovizlimi;
			let stkFytInd = e.cariRow?.stkFytInd || fis?.cariStkFytInd;
			if (!stkFytInd) {
				const mustKod = e.mustKod || e.cariRow?.kod || fis?.mustKod;
				if (mustKod) stkFytInd = await MQCogul.getCariStkFytInd({ mustKod });
			}
			const brmFiyatSaha = ( dovizlimi
				? (stkFytInd ? `dvFiyat${stkFytInd}` : 'dvBrmFiyat')
				: (stkFytInd ? `satFiyat${stkFytInd}` : 'brmFiyat')
			);
			const stokKdvSaha = e.stokKdvSaha || fis?.class?.stokKdvSaha;
			const stokKdvDegiskenmiSaha = e.stokKdvDegiskenmiSaha || fis?.class?.stokKdvDegiskenmiSaha;
			let sent = new MQSent({
				from: 'mst_Stok stk',
				where: [
					new MQOrClause([
						{ degerAta: shKod, saha: `stk.tartiReferans` },
						{ degerAta: shKod, saha: `stk.kod` },
						{ degerAta: '0'   + shKod, saha: `stk.kod`},
						{ degerAta: '00'   + shKod, saha: `stk.kod` },
						{ degerAta: '000'  + shKod, saha: `stk.kod` },
						{ degerAta: '0000' + shKod, saha: `stk.kod` },
					])
				],
				sahalar: [
					'stk.kod shKod', 'stk.grupKod', 'stk.aciklama shAdi', 'stk.brm',
					(dovizlimi ? 'stk.dvFiyatGorFiyati' : 'stk.fiyatGorFiyati'),
					`stk.${brmFiyatSaha} fiyat`, `${stokKdvSaha ? stokKdvSaha : 'satkdvorani'} kdvOrani`,
					`${stokKdvDegiskenmiSaha ? stokKdvDegiskenmiSaha : 'satkdvdegiskenmi'} kdvDegiskenmi`,
					`stk.boyutTipi`, `stk.bedenKategoriKod`
				]
			});
			let stm = new MQStm(sent), rec = e.shRec = await dbMgr.tekilExecuteSelect(stm);
			if (!rec) return false
			for (const key in rec) {
				const value = rec[key];
				if (value != null) this[key] = value
			}
			return true
		}
	}
})();
