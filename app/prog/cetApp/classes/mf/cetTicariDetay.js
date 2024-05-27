(function() {
	window.CETTicariDetay = class extends window.CETStokTicariDetay {
		constructor(e) {
			e = e || {}; super(e); const {app} = sky, {fiyatFra} = app, {isCopy, fis} = e;
			$.extend(this, {
				orjKdvOrani: e.orjKdvOrani || e.orjkdvorani,
				kdvOrani: asInteger(e.kdvOrani || e.kdvorani || e.satKdvOrani || e.almKdvOrani) || 0,
				kdv: e.kdv == null ? null : bedel(e.kdv) || 0,
				kdvDegiskenmi: asBool(e.kdvDegiskenmi),
				orjFiyat: roundToFra(e.orjFiyat, fiyatFra) || 0,
				fiyat: roundToFra(e.fiyat || e.brmFiyat, fiyatFra) || 0,
				brutBedel: bedel(e.brutBedel || e.bedel) || 0,
				netBedel: bedel(e.netBedel || e.bedel) || 0,
				netFiyat: roundToFra(e.netFiyat || e.netfiyat, fiyatFra) || 0,
				mfBaz: asInteger(e.mfBaz || e.mfbaz) || 0,
				mfPay: asInteger(e.mfPay || e.mfpay) || 0,
				malFazlasi: asFloat(e.malFazlasi || e.malfazlasi) || 0,
				siparisVioID2MiktarYapi: e.siparisVioID2MiktarYapi || {},
				ozelKampanyaKod: e.ozelKampanyaKod,
				ozelKampanyaIskSinir: e.ozelKampanyaIskSinir,
				iskontoYapilmazmi: asBool(e.iskontoYapilmazmi),
				promosyonYapilmazmi: asBool(e.promosyonYapilmazmi),
				iskSinir: (e.iskSinir == null ? e.isksinir : e.iskSinir),
				kadIskYapi: e.kadIskYapi || {},
				kadIskOran: e.kadIskOran || 0,
				kosulYapi: e.kosulYapi || {}
			});
			this.orjFiyat = this.orjFiyat || this.fiyat;
			if (this.orjKdvOrani == null)
				this.orjKdvOrani = this.kdvOrani;

			if (fis && fis.ihracatmi)
				this.kdvOrani = 0;
			
			if (!isCopy)
				this.brmFiyatDuzenle(e)

			this.class.iskOranKeys.forEach(key =>
				this[key] = asFloat(e[key] || e[key.toLowerCase()]) || 0);
			this.class.kamOranKeys.forEach(key =>
				this[key] = asFloat(e[key] || e[key.toLowerCase()]) || 0);

			if (!isCopy) {
				this.ozelKampanyaIskOranSinirBul(e).then(() => {
					if (!(this.brutBedel && this.netBedel))
						this.bedelHesapla();
					else if (this.kdv == null)
						this.kdvHesapla();
				});
				this.malFazlasiHesapla(e);
			}
		}

		static get fisSinif() { return CETTicariFis }

		static get iskOranKeys() {
			const {iskSayi} = sky.app;
			const result = super.iskOranKeys || [];
			for (let i = 1; i <= iskSayi; i++)
				result.push(`iskOran${i}`);
			return result;
		}

		/*static get kamOranKeys() {
			return $.merge(
				super.kamOranKeys || [],
				['kamOran1', 'kamOran2', 'kamOran3']
			)
		}*/

		static get ozelKamOranKeys() {
			const {app} = sky;
			const ozelKamOranSayi = app.ozelKampanyaOranSayisi || 0;
			const result = super.ozelKamOranKeys || [];
			for (let i = 1; i <= ozelKamOranSayi; i++)
				result.push(`ozelKampanyaOran${i}`);
			return result;
		}

		get iskontoUygulanabilirmi() {
			return !(this.malFazlasi || this.iskontoYapilmazmi || this.ozelIskontoVarmi);
		}

		get toplamIskontoBedel() {
			return bedel(Math.abs((this.brutBedel || 0) - (this.netBedel || 0)))
		}

		get satirIskOranSinirUyarlanmis() {
			if (this.class.promosyonmu)
				return 0
			
			const genelSatirIskOranSinir = sky.app.satirIskOranSinir || 0;
			const {iskSinir} = this;
			let result = this.satirIskOranSinirVarmi
							? Math.min((this.satirIskOranSinir || 0), genelSatirIskOranSinir)
							: genelSatirIskOranSinir;
			if (iskSinir)
				result = Math.min(iskSinir, result);
			return result;
		}

		static getStokRBKQueryStm(e) {
			e = e || {};
			const stokKod = e.stokKod || e.shKod;
			const yerKod = e.yerKod;
			
			const sonStokIliskiDizi = ['son.stokKod = rbk.stokKod', 'son.desenKod = rbk.desenKod', 'son.renkKod = rbk.renkKod', 'son.beden = rbk.asortiVeyaBeden'];
			if (yerKod != null)
				sonStokIliskiDizi.push(`son.yerKod = ${MQSQLOrtak.sqlDegeri(yerKod)}`)
			
			const sent = new MQSent({
				from: 'mst_StokRBK rbk',
				fromIliskiler: [ { alias: 'rbk', leftJoin: 'mst_SonStok son', on: sonStokIliskiDizi } ],
				sahalar: [
					'rbk.stokKod', 'rbk.desenKod', 'rbk.renkKod', 'rbk.asortiVeyaBeden',
					'SUM(COALESCE(son.miktar, 0)) sonStok', 'SUM(COALESCE((son.orjMiktar + son.olasiFark), 0)) olasiMiktar'
				],
				groupBy: ['rbk.stokKod', 'rbk.desenKod', 'rbk.renkKod', 'rbk.asortiVeyaBeden']
			});
			if (stokKod)
				sent.where.degerAta(stokKod, 'rbk.stokKod')
			
			const stm = new MQStm({
				sent: sent,
				orderBy: ['rbk.asortiVeyaBeden', 'rbk.stokKod', 'rbk.desenKod', 'rbk.renkKod']
			});
			
			return stm
		}
		hostVars(e) {
			const {app} = sky, {fiyatFra, ozelKampanyaKullanilirmi} = app; let hv = super.hostVars(e);
			$.extend(hv, {
				orjKdvOrani: this.orjKdvOrani || 0,
				kdvorani: this.kdvOrani || 0,
				kdvDegiskenmi: bool2Int(this.kdvDegiskenmi),
				orjfiyat: roundToFra(this.orjFiyat || 0, fiyatFra),
				belgefiyat: roundToFra(this.fiyat || 0, fiyatFra),
				belgebrutbedel: bedel(this.brutBedel) || 0,
				belgebedel: bedel(this.netBedel) || 0,
				ozelKampanyaKod: ozelKampanyaKullanilirmi ? (this.ozelKampanyaKod || '') : '',
				ozelKampanyaIskSinir: ozelKampanyaKullanilirmi ? (this.ozelKampanyaKod ? (this.ozelKampanyaIskSinir || 0) : 0) : 0,
				ozelfiyatmi: bool2FileStr(this.ozelFiyatVarmi || false),
				ozeliskoranmi: bool2FileStr(this.ozelIskontoVarmi || false),
				mfbaz: asInteger(this.mfBaz) || 0,
				mfpay: asInteger(this.mfPay) || 0,
				malfazlasi: asFloat(this.malFazlasi) || 0,
				promokod: '',
				promosyonYapilmazmi: bool2FileStr(this.promosyonYapilmazmi || false),
				iskontoYapilmazmi: bool2FileStr(this.iskontoYapilmazmi || false),
				kadIskYapi: $.isEmptyObject(this.kadIskYapi) ? '' : toJSONStr(this.kadIskYapi),
				kadiskoran: asFloat(this.kadIskOran) || 0,
				kosulYapi: toJSONStr(this.kosulYapi)
			});
			(this.class.iskOranKeys || []).forEach(key => hv[key.toLowerCase()] = asFloat(this[key]) || 0);
			(this.class.kamOranKeys || []).forEach(key => hv[key.toLowerCase()] = asFloat(this[key]) || 0);
			if (app.ozelKampanyaKullanilirmi) { const {ozelKampanyaKod} = this; (this.class.ozelKamOranKeys || []).forEach(key => hv[key] = ozelKampanyaKod ? (asFloat(this[key]) || 0) : 0) }
			var siparisVioIDVeMiktarYapiStrListe = [];
			const {siparisVioID2MiktarYapi} = this; for (let vioID in siparisVioID2MiktarYapi) { const miktar = siparisVioID2MiktarYapi[vioID]; siparisVioIDVeMiktarYapiStrListe.push(`${vioID}=${miktar}`); }
			hv.siparisVioIDVeMiktarYapi = siparisVioIDVeMiktarYapiStrListe.join(`|`);
			return hv
		}
		async setValues(e) {
			e = e || {}; await super.setValues(e);
			const {app} = sky, {fiyatFra, ozelKampanyaKullanilirmi} = app, {rec} = e, kosulYapiStr = rec.kosulYapi;
			$.extend(this, {
				orjKdvOrani: rec.orjKdvOrani == null ? null : (asInteger(rec.orjKdvOrani) || 0),
				kdvOrani: rec.kdvorani == null ? null : (asInteger(rec.kdvorani) || 0),
				kdv: e.kdv == null ? null : bedel(e.kdv) || 0,
				kdvDegiskenmi: asBool(rec.kdvDegiskenmi),
				orjfiyat: roundToFra(rec.orjfiyat || 0, fiyatFra),
				fiyat: roundToFra(rec.belgefiyat, fiyatFra) || 0,
				brutBedel: bedel(rec.belgebrutbedel) || 0,
				netBedel: bedel(rec.belgebedel) || 0,
				siparisVioID: rec.siparisVioID,
				siparisMiktar: rec.siparisMiktar == null ? null : (asFloat(rec.siparisMiktar) || 0),
				mfBaz: asInteger(rec.mfbaz) || 0,
				mfPay: asInteger(rec.mfpay) || 0,
				malFazlasi: asFloat(rec.malfazlasi) || 0,
				ozelKampanyaKod: ozelKampanyaKullanilirmi ? (rec.ozelKampanyaKod || '') : null,
				// ozelKampanyaIskSinir: ozelKampanyaKullanilirmi ? (rec.ozelKampanyaKod ? (rec.ozelKampanyaIskSinir || 0) : null) : null,
				ozelFiyatVarmi: asBool(rec.ozelfiyatmi || ''),
				ozelIskontoVarmi: asBool(rec.ozeliskoranmi || ''),
				promosyonYapilmazmi: asBool(rec.promosyonYapilmazmi || ''),
				iskontoYapilmazmi: asBool(rec.iskontoYapilmazmi || ''),
				kadIskYapi: (rec.kadIskYapi ? JSON.parse(rec.kadIskYapi) : {}),
				kadIskOran: asFloat(rec.kadiskoran) || 0,
				kosulYapi: (kosulYapiStr ? JSON.parse(kosulYapiStr) : null) || {}
			});
			this.orjFiyat = this.orjFiyat || this.fiyat;
			(this.class.iskOranKeys || []).forEach(key => this[key] = asFloat(rec[key.toLowerCase()]) || 0);
			(this.class.kamOranKeys || []).forEach(key => this[key] = asFloat(rec[key.toLowerCase()]) || 0);
			if (ozelKampanyaKullanilirmi && this.ozelKampanyaKod) {
				if (!this.ozelKampanyaIskSinir) { await this.ozelKampanyaIskOranSinirBul(e) }
				(this.class.ozelKamOranKeys || []).forEach(key => { this[key] = asFloat(rec[key]) || 0 })
			}
			this.netFiyatHesapla();
			const siparisVioID2MiktarYapi = this.siparisVioID2MiktarYapi = {};
			if (rec.siparisVioIDVeMiktarYapi) {
				const siparisVioIDVeMiktarYapiStrListe = rec.siparisVioIDVeMiktarYapi.split(`|`);
				for (let i in siparisVioIDVeMiktarYapiStrListe) {
					const text = siparisVioIDVeMiktarYapiStrListe[i];
					if (text) { const parts = text.split(`=`); siparisVioID2MiktarYapi[asInteger(parts[0])] = asFloat(parts[1]) || 0 }
				}
			}
		}
		async setValuesFromSablon(e) {
			e = e || {}; await super.setValuesFromSablon(e);
			const {app} = sky, {fiyatFra, iskSayi} = app, {rec} = e;
			$.extend(this, {
				kdvOrani: rec.kdvOrani == null ? this.kdvOrani : asInteger(rec.kdvOrani),
				kdv: rec.kdv == null ? this.kdv : bedel(rec.kdv),
				fiyat: rec.fiyat == null ? this.fiyat : (roundToFra(rec.fiyat, fiyatFra) || 0)
			});
			this.orjFiyat = this.fiyat; if (rec.fiyat != null) { this.brmFiyatDuzenle(e) }
			for (let i = 1; i <= iskSayi; i++) { let key = `iskOran${i}`, value = rec[key]; if (value != null) { this[key] = value } }
			for (let i = 1; i <= 3; i++) { let key = `kamOran${i}`,value = rec[key]; if (value != null) { this[key] = value } }
			this.netFiyatHesapla()
		}
		async detayEkIslemler_ekle(e) {
			const result = await super.detayEkIslemler_ekle(e), {fis} = e, {fiyat} = this;
			if (fiyat && fis?.dvKod) {
				if (!fis.dvKur) { await fis.dvKurBelirle() }
				/*const {dvKur} = fis;
				for (const key of ['fiyat', 'orjFiyat', 'netFiyat', 'brutBedel', 'netBedel'])
					this[key] += (this[key] * dvKur)*/
			}
			return result
		}
		async detayEkIslemler(e) {
			await super.detayEkIslemler(e); await this.ozelKampanyaIskOranSinirBul(e);
			await this.kademeliIskontoHesapla(e); await this.bedelHesapla(e);
			await this.kdvHesapla(e); await this.malFazlasiHesapla(e)
		}
		async satisKosulYapilariIcinDuzenle(e) {
			e = e || {}; await super.satisKosulYapilariIcinDuzenle(e);
			const {app} = sky, {fiyatFra, dvFiyatFra, iskSayi} = app, {fis} = e;
			const {satisKosulYapilari} = e; if (!satisKosulYapilari) { return }
			let _e = { stokKod: this.shKod, grupKod: this.grupKod }; let rec, kosulTip, kosulSinif, kosulKodListe;
			if (!this.ozelFiyatVarmi) {
				kosulTip = 'FY'; kosulSinif = CETSatisKosul.kosulTip2Sinif(kosulTip); kosulKodListe = (satisKosulYapilari[kosulTip] || []).map(kosul => kosul.id);
				rec = await kosulSinif.kosullarIcinStokGrupBilgi($.extend({ kosulKodListe }, _e));
				if (rec) {
					$.extend(this, { iskontoYapilmazmi: asBool(this.iskontoYapilmazmi) || asBool(rec.iskontoYapilmazmi), promosyonYapilmazmi: asBool(rec.promosyonYapilmazmi) });
					const {dovizlimi} = fis; let value = dovizlimi ? roundToFra(rec.ozelDvFiyat, dvFiyatFra) : roundToFra(rec.ozelFiyat, fiyatFra);
					if (value) {
						$.extend(this, { fiyat: value, ozelFiyatVarmi: true });
						this.orjFiyat = this.fiyat; this._fiyatBelirlendimi = false; this.brmFiyatDuzenle(e);
						this.kosulYapi[kosulTip] = { detTip: rec.detTip, kosulKod: rec.kosulKod, vioID: rec.vioID, detKosulKod: rec.kod }
					}
					value = roundToFra(rec.enDusukFiyat, dovizlimi ? dvFiyatFra : fiyatFra);
					if (value) { this.enDusukFiyat = value }
				}
			}
			if (!this.ozelMFVarmi) {
				kosulTip = 'MF'; kosulSinif = CETSatisKosul.kosulTip2Sinif(kosulTip); kosulKodListe = (satisKosulYapilari[kosulTip] || []).map(kosul => kosul.id);
				rec = await kosulSinif.kosullarIcinStokGrupBilgi($.extend({ kosulKodListe }, _e));
				if (rec) {
					$.extend(this, { mfBaz: asInteger(rec.mfBaz) || 0, mfPay: asInteger(rec.mfPay) || 0 }); this.malFazlasiHesapla(e);
					this.kosulYapi[kosulTip] = { detTip: rec.detTip, kosulKod: rec.kosulKod, vioID: rec.vioID, detKosulKod: rec.kod }
				}
			}
			if (this.iskontoUygulanabilirmi) {
				kosulTip = 'SB'; kosulSinif = CETSatisKosul.kosulTip2Sinif(kosulTip); kosulKodListe = (satisKosulYapilari[kosulTip] || []).map(kosul => kosul.id);
				rec = await kosulSinif.kosullarIcinStokGrupBilgi($.extend({ kosulKodListe }, _e));
				if (rec) {
					let uygunmu = false;
					for (let i = 1; i <= iskSayi; i++) { const key = `iskOran${i}`; let value = asFloat(rec[key]) || 0; if (value) { uygunmu = true; this[key] = value } }
					if (uygunmu) { this.kosulYapi[kosulTip] = { detTip: rec.detTip, kosulKod: rec.kosulKod, vioID: rec.vioID, detKosulKod: rec.kod } }
					let value = roundToFra(rec.enDusukFiyat, fiyatFra);
					if (value) { this.enDusukFiyat = value }
				}
				kosulTip = 'KM'; kosulSinif = CETSatisKosul.kosulTip2Sinif(kosulTip); kosulKodListe = (satisKosulYapilari[kosulTip] || []).map(kosul => kosul.id);
				rec = await kosulSinif.kosullarIcinStokGrupBilgi($.extend({ kosulKodListe }, _e));
				if (rec) {
					for (let i = 1; i <= 3; i++) {
						const key = `kamOran${i}`; let value = asFloat(rec[key]) || 0;
						if (value) { this[key] = value; this.ozelKampanyaVarmi = true }
					}
					let value = roundToFra(rec.enDusukFiyat, fiyatFra);
					if (value) { this.enDusukFiyat = value; this.kosulYapi[kosulTip] = { detTip: rec.detTip, kosulKod: rec.kosulKod, vioID: rec.vioID, detKosulKod: rec.kod } }
				}
				kosulTip = 'SN'; kosulSinif = CETSatisKosul.kosulTip2Sinif(kosulTip); kosulKodListe = (satisKosulYapilari[kosulTip] || []).map(kosul => kosul.id);
				rec = await kosulSinif.kosullarIcinStokGrupBilgi($.extend({ kosulKodListe }, _e));
				if (rec) {
					let value = rec.iskSinir;
					if (value) { this.iskSinir = value; this.kosulYapi[kosulTip] = { detTip: rec.detTip, kosulKod: rec.kosulKod, vioID: rec.vioID, detKosulKod: rec.kod } }
				}
				kosulTip = 'KD'; kosulSinif = CETSatisKosul.kosulTip2Sinif(kosulTip); kosulKodListe = (satisKosulYapilari[kosulTip] || []).map(kosul => kosul.id);
				rec = await kosulSinif.kosullarIcinStokGrupBilgi($.extend({ kosulKodListe: kosulKodListe }, _e));
				if (rec) {
					const kadIskYapi = this.kadIskYapi = {}; let uygunmu = false;
					for (let i = 1; i <= iskSayi; i++) {
						const hMiktar = asFloat(rec[`kadHMiktar${i}`]) || 0;
						if (hMiktar) { uygunmu = true; const iskOran = asFloat(rec[`kadIskOran${i}`]) || 0; kadIskYapi[hMiktar] = iskOran }
					}
					if (uygunmu) { this.kosulYapi[kosulTip] = { detTip: rec.detTip, kosulKod: rec.kosulKod, vioID: rec.vioID, detKosulKod: rec.kod } }
				}
			}
		}
		ekBilgileriBelirleDevam(e) {
			e = e || {}; super.ekBilgileriBelirleDevam(e); const {app} = sky, {fiyatFra} = app, {fis, rec} = e;
			this.orjKdvOrani = asInteger(rec.kdvOrani) || 0;
			if (fis?.ihracatmi) { this.kdvOrani = 0 }
			let oncekiFiyat = this.fiyat; if (!(this._fiyatBelirlendimi || this.ozelFiyatVarmi)) { this.fiyat = (roundToFra(rec.brmFiyat, fiyatFra) || 0) }
			if (!this.orjFiyat) { this.orjFiyat = this.fiyat }
			this.brmFiyatDuzenle(e)
		}
		brmFiyatDuzenle(e) {
			if (this._fiyatBelirlendimi) { return }
			const {app} = sky, {fiyatFra} = app, {fis} = e;
			if (fis) {
				const {yildizlimi} = fis, {stokFiyatKdvlimi} = app;
				if (yildizlimi) {
					if (app.yildizFiyatKdvlimi) { if (!stokFiyatKdvlimi) { this.fiyat = roundToFra(this.fiyat + (this.fiyat * this.kdvOrani / 100), fiyatFra) } }
					else { if (stokFiyatKdvlimi) { this.fiyat = roundToFra(this.fiyat * 100 / (100 + this.kdvOrani), fiyatFra) } }
				}
				else { /* normal fişler KDV Hariç kabul edilir (gerekirse dipte kdv) */
					if (stokFiyatKdvlimi) { this.fiyat = roundToFra(this.fiyat * 100 / (100 + this.kdvOrani), fiyatFra); }
				}
				this._fiyatBelirlendimi = true
			}
		}
		kdvHesapla(e) {
			e = e || {}; const {fis} = e; if (!fis) { return }
			if (fis.yildizlimi) { this.kdvOrani = 0; return }
			const {kdvOrani} = this; this.kdv = kdvOrani ? bedel(this.netBedel * kdvOrani / 100) : 0;
		}
		malFazlasiHesapla(e) {
			const {mfPay, mfBaz, miktar} = this; let malFazlasi = 0;
			if (mfBaz && mfPay && miktar >= mfBaz) { malFazlasi = asInteger(miktar * mfPay / mfBaz) }
			this.malFazlasi = malFazlasi; if (malFazlasi) { this.iskontoKampanyaReset() }
		}
		async ozelKampanyaIskOranSinirBul(e) {
			const {app} = sky, {ozelKampanyaKod} = this; if (!app.ozelKampanyaKullanilirmi || !ozelKampanyaKod) { this.ozelKampanyaIskSinir = null; return }
			const ozelKampanyaKod2Rec = app.caches?.ozelKampanyaKod2Rec || {}; let rec = ozelKampanyaKod2Rec[ozelKampanyaKod] || null;
			if (rec == null) {
				const dbMgr = this.class.fisSinif.dbMgr || sky.app.dbMgr_mf;
				const sent = new MQSent({ from: `mst_OzelKampanya`, where: [{ degerAta: ozelKampanyaKod, saha: `kod` }], sahalar: [`*`] });
				const stm = new MQStm({ sent }); rec = await dbMgr.tekilExecuteSelect({ tx: e.tx, query: stm }); ozelKampanyaKod2Rec[ozelKampanyaKod] = rec;
			}
			const iskSinir = roundToFra(asFloat(rec.iskSinir), 2) || 100; this.ozelKampanyaIskSinir = iskSinir
		}
		kademeliIskontoHesapla(e) {
			e = e || {}; const {miktar} = this; if (!miktar) { this.kadIskOran = 0; return }
			const {kadIskYapi} = this; const keys = Object.keys(kadIskYapi).map(x => asFloat(x)).sort(((a, b) => a < b ? 1 : -1));			// reversed sort
			this.kadIskOran = 0; for (const hMiktar of keys) { if (miktar >= hMiktar) { this.kadIskOran = kadIskYapi[hMiktar]; break } }
		}
		bedelHesapla(e) {
			let _bedel = this.brutBedel = bedel((this.miktar || 0) * (this.fiyat || 0));
			let proc = oranListe => { for (const oran of oranListe) { if (oran) { let xBedel = bedel(_bedel * oran / 100) || 0; _bedel -= xBedel } } };
			proc(this.iskOranListe); proc(this.kamOranListe); proc([this.kadIskOran]);
			if (sky.app.ozelKampanyaKullanilirmi && this.ozelKampanyaKod) { proc(this.ozelKamOranListe) }
			this.netBedel = bedel(_bedel); this.netFiyatHesapla(e);
		}
		netFiyatHesapla(e) { const {fiyatFra} = sky.app; this.netFiyat = roundToFra(this.netBedel / asFloat(this.miktar), fiyatFra) || 0 }
		iskontoKampanyaReset(e) { super.iskontoKampanyaReset(e); const {kosulYapi} = this; for (const key of ['SB', 'KM', 'MF']) { delete kosulYapi[key] } this.bedelHesapla() }
		ozelKampanyaOranReset(e) { super.ozelKampanyaOranReset(e); this.bedelHesapla() }
		siparisKarsilamaYapiReset(e) { super.siparisKarsilamaYapiReset(e); this.siparisVioID2MiktarYapi = {} }
		static getDokumAttr2Baslik(e) {
			return $.extend(super.getDokumAttr2Baslik(e) || {}, {
				promosyonKod: `Pro.`,
				proKod: `Pro.`,
				promosyonText: `Pro.`,
				kdvOrani: `KDV%`,
				kdvOraniText: 'KDV%',
				kdvBedel: `KDV Tutar`
			})
		}

		async dokumSahaDegeri(e) {
			let value = await super.dokumSahaDegeri(e);
			if (value == null)
				return value;
			
			const {saha} = e;
			if (saha && saha.tip == 'bedel')
				return bedelStr(value) + ' TL';
			
			return value;
		}

		async getDokumDegeriDict(e) {
			return $.extend(await super.getDokumDegeriDict(e) || {}, {
				promosyonKod: ``,
				proKod: ``,
				promosyonText: '',
				proText: '',
				miktar: e => {
					const {miktar, malFazlasi} = this;
					let value = miktar.toString();
					if (malFazlasi)
						value += `+${malFazlasi.toString()}`;
					return value;
				},
				kdvOraniText: `%${this.kdvOrani}`,
				kdvBedel: e => {
					if (this.kdv == null)
						this.kdvHesapla(e);
					return this.kdv;
				},
				toplamIskontoBedel(e) {
					return this.toplamIskontoBedel
				},
				iskOranlariText(e) {
					const {iskOranListe, kadIskOran} = this;
					const liste = [];
					for (const iskOran of iskOranListe) {
						if (iskOran)
							liste.push(iskOran)
					}
					if (kadIskOran)
						liste.push(kadIskOran)
					
					return $.isEmptyObject(liste) ? '' : (
						'%' +
						((liste || [])
								.map(val => val.toLocaleString())
							.join(`+`))
					)
				},
				ozelKampanyaOranlariText(e) {
					const {ozelKamOranListe} = this;
					if ($.isEmptyObject(ozelKamOranListe))
						return ``;
					return '%' +
						((ozelKamOranListe || [])
								.map(val => val.toLocaleString())
							.join(`+`))
				}
			})
		}
	}
})()
