(function() {
	window.CETSDMApp = class extends window.CETApp {
		constructor(e) {
			super(e);

			const extLogin = this.extensions.login;
			$.extend(extLogin.options, {
				// isLoginRequired: true,
				loginTypes: [
					{ kod: 'login', aciklama: 'VIO Kullanıcısı' },
					{ kod: 'plasiyerLogin', aciklama: '<span style="color: steelblue;">Plasiyer</span>' }
				]
			});
		}

		static get appName() { return 'cetSDMApp' }
		get appText() { return 'Sky SDM' }
		static get wsURLBase_postfix() { return '/depo' }
		static get appSDMmi() { return true }
		static get rotaKullanilirmi() { return false }

		get fisTipleri() {
			const ekOzellikKullanim = this.ekOzellikKullanim || {};
			let liste = [];
			liste.push(CETFisTipi.fromFisSinif({ fisSinif: CETBekleyenSayimFis }).hidden());
			liste.push(CETFisTipi.fromFisSinif({ fisSinif: CETBekleyenUgramaFis }).hidden());
			liste.push(...[
				CETFisTipi.fromFisSinif({ fisSinif: CETSayimFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETDepoTransferFis })
			]);
			if ((ekOzellikKullanim.raf || {}).kullanilirmi)
				liste.push(CETFisTipi.fromFisSinif({ fisSinif: CETForkliftFis }));
			liste.push(...[
				CETFisTipi.fromFisSinif({ fisSinif: CETSubeTransferFis }),
				CETFisTipi.fromFisSinif({ aciklamaPrefix: `Mal Kabul: `, fisSinif: CETAlimFaturaFis }),
				CETFisTipi.fromFisSinif({ aciklamaPrefix: `Mal Kabul: `, fisSinif: CETAlimIrsaliyeFis }),
				CETFisTipi.fromFisSinif({ aciklamaPrefix: `Mal Kabul: `, fisSinif: CETAlimSiparisFis }),
				CETFisTipi.fromFisSinif({ aciklamaPrefix: `Mal Kabul: `, fisSinif: CETAlimIadeFaturaFis }),
				CETFisTipi.fromFisSinif({ aciklamaPrefix: `Mal Kabul: `, fisSinif: CETAlimIadeIrsaliyeFis }),
				CETFisTipi.fromFisSinif({ aciklamaPrefix: `Sevkiyat: `, fisSinif: CETSatisFaturaFis }),
				CETFisTipi.fromFisSinif({ aciklamaPrefix: `Sevkiyat: `, fisSinif: CETSatisIrsaliyeFis }),
				CETFisTipi.fromFisSinif({ aciklamaPrefix: `Sevkiyat: `, fisSinif: CETSatisSiparisFis }),
				CETFisTipi.fromFisSinif({ aciklamaPrefix: `Sevkiyat: `, fisSinif: CETSatisIadeFaturaFis }),
				CETFisTipi.fromFisSinif({ aciklamaPrefix: `Sevkiyat: `, fisSinif: CETSatisIadeIrsaliyeFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETSubelerArasiTransferSiparisFis }),
				CETFisTipi.fromFisSinif({ fisSinif: CETTahsilatFis })
			]);
			liste.push(...(super.fisTipleri || []));

			return liste;
		}

		get raporlar() {
			const raporlar = super.raporlar;
			if (this.siparisKontrolEdilirmi) {
				raporlar.push(...[
					CETRapor.getListeItem({ raporSinif: CETRapor_BekleyenSiparisler }),
					CETRapor.getListeItem({ raporSinif: CETRapor_BekleyenSiparisler_Sevkiyat }),
					CETRapor.getListeItem({ raporSinif: CETRapor_BekleyenSiparisler_MalKabul })
				])
			}
			return raporlar
		}

		async merkezdenBilgiYukleDevam_bekleyenSayimFisler(e) {
			e = e || {};
			this.prefetchAbortedFlag = true;
			const hataGosterFlag = e.hataGoster || e.hataGosterFlag;
			const dbMgr = e.dbMgr = e.dbMgr || this.dbMgr_mf;
			const wsFetches = e.wsFetches = e.wsFetches || {};
			if (!wsFetches.bekleyenSayimFisler)
				wsFetches.bekleyenSayimFisler = this.wsBekleyenSayimFisler()
			const islemAdi = 'Bekleyen Sayım Fişleri';
			let result;
			try {
				result = await this.fetchWSRecs({ source: wsFetches.bekleyenSayimFisler, islemAdi: islemAdi, step: 3 })
			}
			catch (ex) {
				console.warn({ isError: true, rc: `wsIletisim`, locus: `bekleyenSayimFisler`, errorText: ex.responseJSON || ex });
				if (hataGosterFlag)
					defFailBlock(ex)
			}
			const basliklar = (result || {}).baslik;
			if (!basliklar)
				return false
			const subCount = asInteger(basliklar.length / 8);

			const mustKodSet = {}, stokKodSet = {};
			for (const rec of basliklar) {
				const vioID = asInteger(rec.vioID || rec.vioid || rec.fissayac || rec.fisSayac || rec.kaySayac || rec.kaysayac) || 0;
				if (!vioID)
					continue
				const mustKod = rec.mustKod || rec.mustkod || rec.must;
				const ticMustKod = rec.ticMustKod || rec.ticmustkod || mustKod;
				for (const kod of [mustKod, ticMustKod]) {
					if (kod)
						mustKodSet[kod.trimEnd()] = true
				}
			}
			const detaylar = result.detay || [];
			for (const rec of detaylar) {
				const kod = rec.shKod || rec.shkod || rec.stokKod || rec.stokkod;
				if (kod)
					stokKodSet[kod.trimEnd()] = true
			}
			
			if (!$.isEmptyObject(mustKodSet)) {
				let sent = new MQSent({
					distinct: true,
					from: 'mst_Cari',
					where: [{ inDizi: Object.keys(mustKodSet), saha: 'kod' }],
					sahalar: ['kod']
				});
				let recs = await dbMgr.executeSqlReturnRowsBasic(sent);
				for (let i = 0; i < recs.length; i++) {
					const kod = recs[i].kod.trimEnd();
					delete mustKodSet[kod]
				}
			}
			if (!$.isEmptyObject(stokKodSet)) {
				let sent = new MQSent({
					distinct: true,
					from: 'mst_Stok',
					where: [{ inDizi: Object.keys(stokKodSet), saha: 'kod' }],
					sahalar: ['kod']
				});
				let recs = await dbMgr.executeSqlReturnRowsBasic(sent);
				for (let i = 0; i < recs.length; i++) {
					const kod = recs[i].kod.trimEnd();
					delete stokKodSet[kod]
				}
			}
			if (!$.isEmptyObject(mustKodSet)) {
				// eksik cariler
				displayMessage(`Merkezden gelen veride geçen <span class="bold red">${Object.keys(mustKodSet).length} adet Cari</span> tablette eksik durumdadır.<br/>Merkezde yeni cari açılmış olabilir<p/><b>Merkezden Veri Al</b> işlemi yapılmalıdır.`, '! UYARI !');
				throw { isError: true, rc: 'aborted', errorText: 'Yükleme işlemi iptal edildi' }
			}
			if (!$.isEmptyObject(stokKodSet)) {
				// eksik stoklar
				displayMessage(`Merkezden gelen veride geçen <span class="bold red">${Object.keys(stokKodSet).length} adet Stok</span> tablette eksik durumdadır.<br/>Merkezde yeni stok açılmış olabilir<p/><b>Merkezden Veri Al</b> işlemi yapılmalıdır.`, '! UYARI !');
				throw { isError: true, rc: 'aborted', errorText: 'Yükleme işlemi iptal edildi' }
			}
			
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			const _today = today();
			const _todayStr = asReverseDateString(_today);
			// const noYil = _today.getFullYear();
			const {defaultSubeKod, defaultYerKod, defaultPlasiyerKod} = this;
			const fisSinif = CETBekleyenSayimFis;
			const keyHV = fisSinif.varsayilanKeyHostVars();
			const fisTipi = fisSinif.adimTipi;
			const pifTipi = keyHV.piftipi || '';
			const almSat = keyHV.almsat || '';
			const iade = keyHV.iade || '';
			const mevcutFisVioID2RowID = {};
			const resetVioID2RowID = {};
			await (async () => {
				delete keyHV.piftipi;
				const rows = await dbMgr.executeSqlReturnRowsBasic(
					new MQSent({
						distinct: true,
						from: 'data_PIFFis',
						where: [
							`silindi = ''`, `gecici = ''`, `rapor = ''`, `vioID <> 0`,
							/* `degismedi = '*'` */
							{ birlestirDict: keyHV }
						],
						sahalar: ['vioID', 'rowid', 'degismedi']
					})
				)
				for (let i = 0; i < rows.length; i++) {
					const rec = rows[i];
					const vioID = asInteger(rec.vioID);
					const rowID = asInteger(rec.rowid);
					if (!mevcutFisVioID2RowID[vioID]) {
						mevcutFisVioID2RowID[vioID] = rowID;
						if (rowID && asBool(rec.degismedi))
							resetVioID2RowID[vioID] = rowID;
					}
				}
			})();

			const resetRowIDListe = {};
			for (const rec of basliklar) {
				const vioID = asInteger(rec.vioID || rec.vioid || rec.fissayac || rec.fisSayac || rec.kaySayac || rec.kaysayac) || 0;
				if (!vioID)
					continue;
				const rowID = mevcutFisVioID2RowID[vioID];
				if (rowID)
					resetRowIDListe[rowID] = rowID;
			}
			if (!$.isEmptyObject(resetVioID2RowID)) {
				await dbMgr.executeSql(new MQIliskiliDelete({
					from: 'data_PIFStok',
					where: { inDizi: Object.values(resetRowIDListe), saha: 'fissayac' }
				}));
				await dbMgr.executeSql(new MQIliskiliDelete({
					from: 'data_PIFFis',
					where: { inDizi: Object.values(resetRowIDListe), saha: 'rowid' }
				}))
			}
			let updateSayi = 0;
			const vioID2RowID = {};
			for (const rec of basliklar) {
				const vioID = asInteger(rec.vioID || rec.vioid || rec.fissayac || rec.fisSayac || rec.kaySayac || rec.kaysayac) || 0;
				if (!vioID)
					continue
				const {degismedi} = rec;
				const mustKod = rec.mustKod || rec.mustkod || rec.must;
				const subeKod = rec.subeKod || rec.subekod || rec.bizSubeKod || rec.bizsubekod;
				const hv = {
					vioID: vioID || null,
					degismedi: degismedi == null ? '*' : degismedi,
					fisTipi: rec.fisTipi || rec.fistipi || fisTipi,
					// ayrimtipi: rec.ayrimTipi || rec.ayrimtipi || '',
					ayrimtipi: '',
					fisekayrim: rec.fisekayrim || '',
					pifTipi: rec.pifTipi || rec.piftipi || pifTipi,
					almSat: rec.almSat || rec.almsat || almSat,
					iade: rec.iade == null ? iade : rec.iade,
					tarih: rec.tarih || _todayStr,
					sevktarih: rec.sevkTarih || rec.sevkTarihi || rec.sevktarih || rec.sevktarihi || '',
					seri: rec.seri || '',
					// noyil: rec.noYil || rec.noyil || noYil,
					fisno: asInteger(rec.fisNo || rec.fisno) || 0,
					dvkod: rec.dvKod || rec.dvkod || '',
					dvkur: rec.dvKur || rec.dvkur || 0,
					mustkod: mustKod || '',
					ticmustkod: rec.ticMustKod || rec.ticmustkod || mustKod || '',
					subeKod: subeKod == null ? defaultSubeKod : subeKod || '',
					yerKod: rec.yerKod || rec.yerkod || defaultYerKod || '',
					xplasiyerkod: rec.plasiyerKod || rec.plasiyerkod || defaultPlasiyerKod || '',
					xadreskod: rec.xadreskod || rec.sevkadreskod || rec.sevkAdresKod || '',
					seferAdi: rec.seferAdi || rec.seferadi || '',
					containerNox: rec.containerNox || rec.containernox || '',
					soforAdi: rec.soforAdi || rec.soforadi || '',
					plaka: rec.plaka || '',
					planNo: rec.planNo || rec.planno || 0,
					ekBilgi: rec.ekBilgi || rec.ekbilgi || ''
				};
				await dbMgr.insertOrReplaceTable({
					table: 'data_PIFFis', mode: 'insert',
					hv: hv,
					parcaCallback: e => {
						updateSayi++;
						const insertId = e.rs?.insertId ?? e.insertId;
						if (insertId)
							vioID2RowID[vioID] = asInteger(insertId)
						if (e.index % subCount == 0)
							this.knobProgressStep()
					}
				})
			}
			const rowID2SonSeq = {};
			const ekOzelliklerIDSahalar = CETEkOzellikler.idSahalar;
			let hvListe = [];
			for (const rec of detaylar) {
				const _fisSayac = asInteger(rec.fissayac || rec.fisSayac) || 0;
				const fisSayac = _fisSayac ? vioID2RowID[_fisSayac] : null;
				if (!fisSayac /*|| mevcutFisVioID2RowID[_fisSayac]*/)
					continue
				const harSayac = asInteger(rec.harSayac || rec.harsayac || rec.kaySayac || rec.kaysayac) || null;
				const seq = rowID2SonSeq[fisSayac] = (rowID2SonSeq[fisSayac] || 0) + 1;
				const vMiktar = rec.vMiktar;
				const hMiktar = rec.miktar;
				const hv = {
					fissayac: fisSayac, seq: seq,
					vioID: harSayac || null,
					okunanbarkod: rec.barkod || rec.okunanBarkod || rec.okunanbarkod || '',
					shkod: rec.shKod || rec.shkod || rec.stokKod || rec.stokkod || null,
					miktar: vMiktar == null ? 0 : (asFloat(vMiktar) || 0),
					xbrm: rec.brm || rec.xbrm || '',
					hMiktar: hMiktar == null ? 0 : (asFloat(hMiktar) || 0),
					paketkod: rec.paketKod || rec.paketkod || '',
					paketmiktar: asFloat(rec.paketMiktar || rec.paketmiktar) || 0,
					paketicadet: asFloat(rec.paketIcAdet || rec.paketicadet || rec.paketIci || rec.paketIci) || 0,
					karmaPaletNo: asInteger(rec.karmaPaletNo) || 0
				};
				if (!$.isEmptyObject(ekOzelliklerIDSahalar)) {
					const Prefix_EkOz = 'ekoz_';
					for (const j in ekOzelliklerIDSahalar) {
						const idSaha = ekOzelliklerIDSahalar[j].toLowerCase();
						const recAttr = idSaha.startsWith(Prefix_EkOz) ? idSaha.replace(Prefix_EkOz, 'ekoz').replace('_', '') : idSaha;
						let value = rec[recAttr.toLowerCase()];			// !! idSaha lowercase olacak !!
						hv[idSaha] = value || '';
					}
				}
				hvListe.push(hv)
			}
			await dbMgr.insertOrReplaceTable({
				table: 'data_PIFStok', mode: 'insert',
				hvListe: hvListe,
				parcaCallback: e => {
					if (e.index % subCount == 0)
						this.knobProgressStep()
				}
			})
			return { updateSayi: updateSayi }
		}
		async merkezdenBilgiYukleDevam_bekleyenUgramaFisler(e) {
			e = e || {};
			this.prefetchAbortedFlag = true;
			const hataGosterFlag = e.hataGoster || e.hataGosterFlag;
			const dbMgr = e.dbMgr = e.dbMgr || this.dbMgr_mf;
			const wsFetches = e.wsFetches = e.wsFetches || {};
			if (!wsFetches.bekleyenUgramaFisler)
				wsFetches.bekleyenUgramaFisler = this.wsBekleyenUgramaFisler()
			const islemAdi = 'Bekleyen Yükleme Fişleri';
			let result;
			try { result = await this.fetchWSRecs({ source: wsFetches.bekleyenUgramaFisler, islemAdi: islemAdi, step: 3 }) }
			catch (ex) {
				console.warn({ isError: true, rc: `wsIletisim`, locus: `bekleyenUgramaFisler`, errorText: ex.responseJSON || ex });
				if (hataGosterFlag)
					defFailBlock(ex)
			}
			const basliklar = (result || {}).baslik;
			if (!basliklar)
				return false
			const subCount = asInteger(basliklar.length / 8);

			const mustKodSet = {}, stokKodSet = {};
			for (const rec of basliklar) {
				const vioID = asInteger(rec.vioID || rec.vioid || rec.fissayac || rec.fisSayac || rec.kaySayac || rec.kaysayac) || 0;
				if (!vioID)
					continue
				const mustKod = rec.mustKod || rec.mustkod || rec.must;
				const ticMustKod = rec.ticMustKod || rec.ticmustkod || mustKod;
				for (const kod of [mustKod, ticMustKod]) {
					if (kod)
						mustKodSet[kod.trimEnd()] = true
				}
			}
			const detaylar = result.detay || [];
			for (const rec of detaylar) {
				const kod = rec.shKod || rec.shkod || rec.stokKod || rec.stokkod;
				if (kod)
					stokKodSet[kod.trimEnd()] = true
			}
			
			if (!$.isEmptyObject(mustKodSet)) {
				let sent = new MQSent({
					distinct: true,
					from: 'mst_Cari',
					where: [{ inDizi: Object.keys(mustKodSet), saha: 'kod' }],
					sahalar: ['kod']
				});
				let recs = await dbMgr.executeSqlReturnRowsBasic(sent);
				for (let i = 0; i < recs.length; i++) {
					const kod = recs[i].kod.trimEnd();
					delete mustKodSet[kod]
				}
			}
			if (!$.isEmptyObject(stokKodSet)) {
				let sent = new MQSent({
					distinct: true,
					from: 'mst_Stok',
					where: [{ inDizi: Object.keys(stokKodSet), saha: 'kod' }],
					sahalar: ['kod']
				});
				let recs = await dbMgr.executeSqlReturnRowsBasic(sent);
				for (let i = 0; i < recs.length; i++) {
					const kod = recs[i].kod.trimEnd();
					delete stokKodSet[kod]
				}
			}

			if (!$.isEmptyObject(mustKodSet)) {
				// eksik cariler
				displayMessage(`Merkezden gelen veride geçen <span class="bold red">${Object.keys(mustKodSet).length} adet Cari</span> tablette eksik durumdadır.<br/>Merkezde yeni cari açılmış olabilir<p/><b>Merkezden Veri Al</b> işlemi yapılmalıdır.`, '! UYARI !');
				throw { isError: true, rc: 'aborted', errorText: 'Yükleme işlemi iptal edildi' }
			}
			if (!$.isEmptyObject(stokKodSet)) {
				// eksik stoklar
				displayMessage(`Merkezden gelen veride geçen <span class="bold red">${Object.keys(stokKodSet).length} adet Stok</span> tablette eksik durumdadır.<br/>Merkezde yeni cari açılmış olabilir<p/><b>Merkezden Veri Al</b> işlemi yapılmalıdır.`, '! UYARI !');
				throw { isError: true, rc: 'aborted', errorText: 'Yükleme işlemi iptal edildi' }
			}
			
			await this.knobProgressSetLabel(`${islemAdi} kaydediliyor...`);
			const _today = today();
			const _todayStr = asReverseDateString(_today);
			// const noYil = _today.getFullYear();
			const {defaultSubeKod, defaultYerKod, defaultPlasiyerKod} = this;
			const fisSinif_base = CETBekleyenUgramaFis;
			const keyHV = fisSinif_base.varsayilanKeyHostVars();
			const fisTipi = fisSinif_base.adimTipi;
			const almSat = keyHV.almsat || '';
			const iade = keyHV.iade || '';
			const mevcutFisVioID2RowID = {};
			const resetVioID2RowID = {};
			const mevcutDetayVioID2RowID = {};
			const rowID2SonSeq = {};
			await (async () => {
				delete keyHV.piftipi;
				let rows = await dbMgr.executeSqlReturnRowsBasic(
					new MQSent({
						distinct: true,
						from: 'data_PIFFis',
						where: [
							`silindi = ''`, `gecici = ''`, `rapor = ''`, `vioID <> 0`,
							/* `degismedi = '*'` */
							{ birlestirDict: keyHV }
						],
						sahalar: ['vioID', 'rowid', 'degismedi']
					})
				)
				for (let i = 0; i < rows.length; i++) {
					const rec = rows[i];
					const vioID = asInteger(rec.vioID);
					const rowID = asInteger(rec.rowid);
					if (!mevcutFisVioID2RowID[vioID]) {
						mevcutFisVioID2RowID[vioID] = rowID;
						if (rowID && asBool(rec.degismedi))
							resetVioID2RowID[vioID] = rowID
					}
				}
				rows = await dbMgr.executeSqlReturnRowsBasic(
					new MQSent({
						distinct: true,
						from: 'data_PIFStok',
						where: [
							`vioID <> 0`,
							{ inDizi: Object.values(mevcutFisVioID2RowID), saha: 'fissayac' }
						],
						sahalar: ['fissayac', 'rowid harsayac', 'vioID', 'seq']
					})
				)
				for (let i = 0; i < rows.length; i++) {
					const rec = rows[i];
					const vioID = asInteger(rec.vioID);
					if (mevcutDetayVioID2RowID[vioID])
						continue
					const harSayac = asInteger(rec.harsayac);
					mevcutDetayVioID2RowID[vioID] = harSayac;
					const fisSayac = rec.fissayac;
					rowID2SonSeq[fisSayac] = Math.max(rowID2SonSeq[fisSayac] || 0, rec.seq || 0);
				}
			})();
			/*const resetVioID2RowID = {};
			for (const rec of basliklar) {
				const vioID = asInteger(rec.vioID || rec.vioid || rec.fissayac || rec.fisSayac || rec.kaySayac || rec.kaysayac) || 0;
				if (!vioID)
					continue;
				const resetRowID = _resetVioID2RowID[vioID];
				if (resetRowID)
					resetVioID2RowID[vioID] = resetRowID;
			}*/
			if (!$.isEmptyObject(resetVioID2RowID)) {
				await dbMgr.executeSql(new MQIliskiliDelete({
					from: 'data_PIFStok',
					where: { inDizi: Object.values(resetVioID2RowID), saha: 'fissayac' }
				}));
				await dbMgr.executeSql(new MQIliskiliDelete({
					from: 'data_PIFFis',
					where: { inDizi: Object.values(resetVioID2RowID), saha: 'rowid' }
				}))
			}
			let updateSayi = 0;
			const vioID2RowID = {};
			for (const rec of basliklar) {
				const vioID = asInteger(rec.vioID || rec.vioid || rec.fissayac || rec.fisSayac || rec.kaySayac || rec.kaysayac) || 0;
				if (!vioID)
					continue
				if (mevcutFisVioID2RowID[vioID] && !resetVioID2RowID[vioID])
					continue
				const {degismedi} = rec;
				const mustKod = rec.mustKod || rec.mustkod || rec.must;
				const subeKod = rec.subeKod || rec.subekod || rec.bizSubeKod || rec.bizsubekod;
				const hv = {
					vioID: vioID || null,
					degismedi: degismedi == null ? '*' : degismedi,
					fisTipi: rec.fisTipi || rec.fistipi || fisTipi,
					ayrimtipi: rec.ayrimTipi || rec.ayrimtipi || '',
					// ayrimtipi: '',
					fisekayrim: rec.fisekayrim || '',
					pifTipi: rec.pifTipi || rec.piftipi || keyHV.piftipi || '',
					almSat: rec.almSat || rec.almsat || almSat || '',
					iade: rec.iade == null ? iade : rec.iade,
					tarih: rec.tarih || _todayStr,
					sevktarih: rec.sevkTarih || rec.sevkTarihi || rec.sevktarih || rec.sevktarihi || '',
					seri: rec.seri || '',
					// noyil: rec.noYil || rec.noyil || noYil,
					fisno: asInteger(rec.fisNo || rec.fisno) || 0,
					dvkod: rec.dvKod || rec.dvkod || '',
					dvkur: rec.dvKur || rec.dvkur || 0,
					mustkod: mustKod || '',
					ticmustkod: rec.ticMustKod || rec.ticmustkod || mustKod || '',
					subeKod: subeKod == null ? defaultSubeKod : subeKod || '',
					yerKod: rec.yerKod || rec.yerkod || defaultYerKod || '',
					xplasiyerkod: rec.plasiyerKod || rec.plasiyerkod || defaultPlasiyerKod || '',
					xadreskod: rec.xadreskod || rec.sevkadreskod || rec.sevkAdresKod || '',
					seferAdi: rec.seferAdi || rec.seferadi || '',
					soforAdi: rec.soforAdi || rec.soforadi || '',
					plaka: rec.plaka || '',
					containerNox: rec.containerNox || rec.containernox || '',
					planNo: rec.planNo || rec.planno || 0,
					ekBilgi: rec.ekBilgi || rec.ekbilgi || ''
				};
				for (const kod of [hv.mustkod, hv.ticmustkod].filter(x => !!x)) { mustKodSet[kod] = true }
				await dbMgr.insertOrReplaceTable({
					table: 'data_PIFFis', mode: 'insert', hv: hv,
					parcaCallback: e => {
						updateSayi++;
						const insertId = e.rs?.insertId ?? e.insertId;
						if (insertId)
							vioID2RowID[vioID] = asInteger(insertId)
						if (e.index % subCount == 0)
							this.knobProgressStep()
					}
				})
			}
			const ekOzelliklerIDSahalar = CETEkOzellikler.idSahalar;
			let hvListe = [], updListe = [];
			for (const rec of detaylar) {
				const _fisSayac = asInteger(rec.fissayac || rec.fisSayac) || 0;
				const fisSayac = _fisSayac ? (vioID2RowID[_fisSayac] || mevcutFisVioID2RowID[_fisSayac]) : null;
				if (!fisSayac /*|| mevcutFisVioID2RowID[_fisSayac]*/)
					continue
				const harSayac = asInteger(rec.harSayac || rec.harsayac || rec.kaySayac || rec.kaysayac) || null;
				const hMiktar = rec.miktar;
				const updHV = {
					hMiktar: hMiktar == null ? 0 : (asFloat(hMiktar) || 0),
					paketBilgi: rec.paketBilgi || rec.paketbilgi || ''
				};
				if (mevcutFisVioID2RowID[_fisSayac] && !resetVioID2RowID[_fisSayac] && mevcutDetayVioID2RowID[harSayac]) {
					const upd = new MQIliskiliUpdate({
						from: 'data_PIFStok',
						where: [
							{ degerAta: fisSayac, saha: 'fissayac' },
							{ degerAta: harSayac, saha: 'vioID' }
						],
						set: [
							{ birlestirDict: updHV }
						]
					})
					updListe.push(upd)
				}
				else {
					const seq = rowID2SonSeq[fisSayac] = (rowID2SonSeq[fisSayac] || 0) + 1;
					const vMiktar = rec.vMiktar;
					const hv = $.extend({
						fissayac: fisSayac, seq: seq,
						vioID: harSayac || null,
						okunanbarkod: rec.barkod || rec.okunanBarkod || rec.okunanbarkod || '',
						shkod: rec.shKod || rec.shkod || rec.stokKod || rec.stokkod || null,
						miktar: vMiktar == null ? 0 : (asFloat(vMiktar) || 0),
						xbrm: rec.brm || rec.xbrm || '',
						paketkod: rec.paketKod || rec.paketkod || '',
						paketmiktar: asFloat(rec.paketMiktar || rec.paketmiktar) || 0,
						paketicadet: asFloat(rec.paketIcAdet || rec.paketicadet || rec.paketIci || rec.paketIci) || 0,
						karmaPaletNo: asInteger(rec.karmaPaletNo),
						sevkSipHarSayac: rec.sevkSipHarSayac || rec.sevksipharsayac || null
					}, updHV);
					if (!$.isEmptyObject(ekOzelliklerIDSahalar)) {
						const Prefix_EkOz = 'ekoz_';
						for (const j in ekOzelliklerIDSahalar) {
							const idSaha = ekOzelliklerIDSahalar[j].toLowerCase();
							const recAttr = idSaha.startsWith(Prefix_EkOz) ? idSaha.replace(Prefix_EkOz, 'ekoz').replace('_', '') : idSaha;
							let value = rec[recAttr.toLowerCase()];			// !! idSaha lowercase olacak !!
							hv[idSaha] = value || '';
						}
					}
					hvListe.push(hv)
				}
			}
			if (hvListe.length) {
				await dbMgr.insertOrReplaceTable({
					table: 'data_PIFStok', mode: 'insert',
					hvListe: hvListe,
					parcaCallback: e => {
						if (e.index % subCount == 0)
							this.knobProgressStep()
					}
				})
			}
			if (updListe.length) {
				let tx = await dbMgr.getTx();
				for (const upd of updListe)
					await dbMgr.executeSql({ tx: tx, query: upd });
				tx = await dbMgr.getTx()
			}
			return { updateSayi: updateSayi }
		}

		async bekleyenXFislerGuncelleIstendi(e) {
			this.prefetchAbortedFlag = true;
			createJQXWindow(
				`<p class="bold">Bekleyen Fişler merkezden indirilip, yeni gelenler tablette güncellenecek</p><div>Devam edilsin mi?</div>`,
				this.appText,
				{
					isModal: true, showCollapseButton: false, closeButtonAction: 'destroy',
					width: 'auto', height: 250
				},
				{
					EVET: async (dlgUI, btnUI) => {
						e = $.extend({}, e, { hataGoster: true });
						dlgUI.jqxWindow('destroy');
						await this.knobProgressShow();
						await this.knobProgressSetLabel(`Bekleyen Fişler merkezden güncelleniyor...`);
						try {
							const tip2UpdateSayi = { sayim: 0, ugrama: 0 };
							let result = await this.merkezdenBilgiYukleDevam_bekleyenSayimFisler(e);
							let updateSayi = typeof result == 'object' ? result.updateSayi : null;
							tip2UpdateSayi.sayim = updateSayi;
							
							result = await this.merkezdenBilgiYukleDevam_bekleyenUgramaFisler(e);
							updateSayi = typeof result == 'object' ? result.updateSayi : null;
							tip2UpdateSayi.ugrama = updateSayi;
							
							await this.knobProgressHideWithReset({
								update: {
									labelTemplate: 'success',
									label: (
										(tip2UpdateSayi.sayim || tip2UpdateSayi.ugrama)
											? (
												`<ul>` +
													( tip2UpdateSayi.sayim ? `<li><u class="bold royalblue">${updateSayi.toLocaleString()} adet</u> Bekleyen Sayım Fişi Merkezden güncellendi</li>` : '' ) +
													( tip2UpdateSayi.ugrama ? `<li><u class="bold darkgreen">${updateSayi.toLocaleString()} adet</u> Bekleyen Yükleme Fişi Merkezden güncellendi</li>` : '' ) +
												`</ul>`
											)
											: `Bekleyen Fiş Güncellemesi Bitti`
									)
								}, delayMS: 5000
						   });
						}
						catch (ex) {
							let errorText = (
								ex.statusText == 'error'
									? `Merkez ile iletişim kurulamadı<br/>${this.wsURLBase}`
									: ex.message || ex.errorText || ex.message || (ex.responseJSON || {}).errorText
							);
							await this.knobProgressHideWithReset({
								update: {
									labelTemplate: 'error',
									label: `<b>${errorText}</b>`
								}, delayMS: 5000
						   });
						}
					},
					HAYIR: (dlgUI, btnUI) => {
						dlgUI.jqxWindow('destroy')
					}
				}
			)
		}
	}
})()
