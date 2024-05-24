(function() {
	window.CETBarkodParser = class extends window.CObject {
		constructor(e) {
			e = e || {};
			super(e);

			this.dbMgr = e.dbMgr || sky.app.dbMgr_mf;
			this.setGlobals(e);
		}

		static get aciklama() { return '' }
		static getKuralSinif(e) { return CETBarkodKurali }

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

			const {app} = sky;
			const dbMgr = e.dbMgr || this.dbMgr;
			const {tip2EkOzellik} = app;
			if (tip2EkOzellik) {
				const uni = new MQUnionAll();
				const stm = new MQStm({ sent: uni });
				for (const tip in tip2EkOzellik) {
					const ekOzellik = tip2EkOzellik[tip];
					const {tipAdi, idSaha, kodsuzmu, mbTable, mbKodSaha, mbAdiSaha} = ekOzellik;
					if (ekOzellik.class.ozellikTip == 'ka' && mbTable && (kodsuzmu ? mbAdiSaha : mbKodSaha)) {
						const value = this[idSaha];
						if (value) {
							const sent = new MQSent({
								from: mbTable,
								where: [{ degerAta: value, saha: kodsuzmu ? mbAdiSaha : mbKodSaha }],
								sahalar: [`'${tip}' tip`, `'${tipAdi}' tipAdi`, `${MQSQLOrtak.sqlDegeri(value)} value`, `COUNT(*) sayi`]
							});
							uni.add(sent);
						}
					}
				}

				if (!$.isEmptyObject(uni.liste)) {
					let rs = await dbMgr.executeSql({ query: stm });
					const hataListe = [];
					for (let i = 0; i < rs.rows.length; i++) {
						const _rec = rs.rows[i];
						if (!_rec.sayi)
							hataListe.push(`<li><b>${_rec.tipAdi}</b> için <u class="bold">${_rec.value}</u> değeri geçersizdir</li>`);
					}

					if (!$.isEmptyObject(hataListe)) {
						throw { isError: true, rc: 'barkodParseError', errorText: `<ul>${hataListe.join(CrLf)}</ul>` }
					}
				}
			}
			
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
					carpan: carpan,
					// shKod: barkod,
					// miktar: 1
				});
			}
		}

		async shEkBilgileriBelirle(e) {
			e = e || {};
			let shKod = e.shKod || this.shKod;
			if (!shKod)
				return false;

			const {app} = sky;
			const dbMgr = e.dbMgr || this.dbMgr;
			
			const {fis} = e;
			let stkFytInd = (e.cariRow || {}).stkFytInd || (fis || {}).cariStkFytInd;
			if (!stkFytInd) {
				const mustKod = e.mustKod || (e.cariRow || {}).kod || (fis || {}).mustKod;
				if (mustKod)
					stkFytInd = await MQCogul.getCariStkFytInd({ mustKod: mustKod });
			}
			const brmFiyatSaha = stkFytInd ? `satFiyat${stkFytInd}` : `brmFiyat`;
			
			const stokKdvSaha = e.stokKdvSaha || (fis ? fis.class.stokKdvSaha : null);
			const stokKdvDegiskenmiSaha = e.stokKdvDegiskenmiSaha || (fis ? fis.class.stokKdvDegiskenmiSaha : null);
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
					'stk.kod shKod', 'stk.grupKod', 'stk.aciklama shAdi', 'stk.brm', 'stk.fiyatGorFiyati',
					`stk.${brmFiyatSaha} fiyat`,
					`${stokKdvSaha ? stokKdvSaha : 'satkdvorani'} kdvOrani`,
					`${stokKdvDegiskenmiSaha ? stokKdvDegiskenmiSaha : 'satkdvdegiskenmi'} kdvDegiskenmi`,
				]
			});
			let stm = new MQStm({ sent: sent });
			let rec = e.shRec = await dbMgr.tekilExecuteSelect({ query: stm });
			if (!rec)
				return false;
			
			for (const key in rec) {
				const value = rec[key];
				if (value != null)
					this[key] = value;
			}

			return true;
		}
	}
})();
