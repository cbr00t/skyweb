(function() {
	window.CETTahsilatFis = class extends window.CETFis {
		static get table() { return 'data_TahsilatFis' } static get detaySinif() { return CETTahsilatDetay }
		static get dokumcuSinif() { return CETDokumcu_Matbuu } static get fisGirisUISinif() { return CETTahsilatGirisPart } static get numaratorTip() { return `BT` }
		static get aciklama() { return 'Tahsilat' } static get tahsilatmi() { return true }
		static get iptalDesteklenirmi() { return true } static get tarihKontrolYapilirmi() { return true }
		static get seriNoDesteklermi() { return true } static get bedelKullanilirmi() { return true }
		static get bakiyeRiskEtkilenirmi() { return true } static get ozelIsaretKullanilirmi() { return true }
		get sonucBedel() { this.gerekirseDipHesapla(); return bedel(this.toplamBedel) }
		get hesaplanmisBakiyeArtisi() { return -this.sonucBedel }
		get hesaplanmisRiskArtisi() { return -this.sonucBedel }
		get hesaplanmisTakipBorcArtisi() { return this.hesaplanmisRiskArtisi }
		constructor(e) {
			e = e || {}; super(e)
			$.extend(this, {
				uniqueId: e.uniqueId || e.uniqueid || null,
				mustKod: e.mustKod || e.mustkod || ''
			})
		}
		static detaylarQueryStm(e) {
			e = e || {}; const detayTable = e.detayTable || this.detayTable, fisIDSaha = e.fisIDSaha || (e.detaySinif || this.detaySinif).fisIDSaha, id = e.id || this.id;
			let stm = new MQStm({
				sent: new MQSent({
					from: `${detayTable} har`,
					fromIliskiler: [ { alias: 'har', leftJoin: 'mst_TahsilSekli tsek', on: 'har.tahSekliNo = tsek.kodNo' } ],
					sahalar: [ 'har.rowid', 'har.*', 'tsek.aciklama tahSekliAdi' ]
				}),
				orderBy: [fisIDSaha, 'seq']
			});
			stm.sentDo(sent => sent.where.degerAta(id, `har.${fisIDSaha}`)); return stm
		}
		hostVars(e) {
			e = e || {}; let hv = super.hostVars()
			$.extend(hv, {
				uniqueid: this.uniqueId || newGUID(),
				mustkod: this.mustKod,
				toplambedel: bedel(this.toplamBedel) || 0
			})
			return hv
		}
		async setValues(e) {
			e = e || {}; await super.setValues(e); let {rec} = e
			$.extend(this, {
				uniqueId: rec.uniqueid || null,
				mustKod: rec.mustkod || '',
				toplamBedel: bedel(rec.toplambedel) || null
			})
		}
		async onKontrol(e) {
			e = e || {}; if (!this.mustKod) { return this.error_onKontrol(`(Müşteri) belirtilmelidir`, 'bos_mustKod') }
			let result = sky.app.caches.mustKod2EkBilgi[this.mustKod] || (parseInt(await this.dbMgr.tekilDegerExecuteSelect({
				tx: e.tx, query: `SELECT COUNT(*) sayi FROM mst_Cari WHERE kod = ?`, params: [this.mustKod] })));
			if (!result) { return this.error_onKontrol(`(${this.mustKod} kodlu Müşteri) hatalıdır`, 'hatali_mustKod') }
			result = await this.onKontrol_detaylar(e); if (!result || result.isError) { return result }
			return await super.onKontrol(e)
		}
		async onKontrol_detaylar(e) {
			e = e || {}; const detaylar = this.detaylar.filter(det => asInteger(det.tahSekliNo) && asFloat(det.bedel));
			if ($.isEmptyObject(detaylar)) { return { isError: true, rc: `emptyRecords`, errorText: `Belge içeriği girilmelidir` } }
			return true
		}
		async kaydetOncesiKontrol_ara(e) { await super.kaydetOncesiKontrol_ara(e); await this.kaydetOncesiKontrol_nakitUstLimit(e) }
		async degistirOncesiIslemler(e) {
			await super.degistirOncesiIslemler(e); const {app} = sky, {param} = app;
			if (app.tahsilatIptalEdilemezmi && !app.serbestModmu) { e.islem = 'izle' }
			if (app.yazdirilanTahsilatDegistirilmezmi && this.yazdirildimi) { e.islem = 'izle' }
		}
		async silmeOncesiKontrol(e) {
			e = e || {}; await super.silmeOncesiKontrol(e); const {app} = sky, forceFlag = e.force ?? e.forceFlag;
			if (!forceFlag && app.tahsilatIptalEdilemezmi && !app.serbestModmu) { throw { isError: true, rc: 'noPermission', errorText: `<span class="bold">Merkez Parametresi kuralı gereği, <u>TAHSİLAT İPTAL</u> yetkiniz yok</span>` } }
		}
		async kaydetDevam(e) {
			const {detaylar} = this; this.detaylar = detaylar.filter(det => (bedel(det.bedel) || 0) > 0);
			try { return await super.kaydetDevam(e) }
			finally { this.detaylar = detaylar }
		}
		kaydetOncesiKontrol_nakitUstLimit(e) {
			e = e || {}; const {app} = sky, {tahsilSekliKodNo2Rec} = app.caches;
			let toplamNakitBedel = 0; const {detaylar} = this;
			for (const det of detaylar) {
				const _rec = tahsilSekliKodNo2Rec[det.tahSekliNo];
				if (_rec) {
					const {tahsilTipi} = _rec, nakitmi = tahsilTipi == 'NK' || tahsilTipi == 'N' || tahsilTipi == 'K';
					if (nakitmi) { toplamNakitBedel += det.bedel }
				}
			}
			toplamNakitBedel = bedel(toplamNakitBedel);
			const {nakitUstLimit} = app;
			if (nakitUstLimit && toplamNakitBedel > nakitUstLimit) {
				throw {
					isError: true, rc: 'nakitUstLimit',
					errorText: `<p><b><u>${bedelStr(toplamNakitBedel)} TL</u></b> <i>Nakit Tahsilat</i> yapılmak istendi.</p><p><b>${bedelStr(nakitUstLimit)} TL</b> olan Nakit Üst Limit aşıldı.</p>`
				}
			}
		}
		async bakiyeRiskDuzenle(e) { await super.bakiyeRiskDuzenle(e) }
		gerekirseDipHesapla(e) { if (!this.hesaplandimi) { this.dipHesapla(e) } }
		dipHesapla(e) {
			this.toplamBedel = 0;
			const {detaylar} = this;
			for (const i in detaylar) {
				const det = detaylar[i];
				this.toplamBedel += bedel(det.bedel) || 0;
			}
			this.toplamBedel = bedel(this.toplamBedel);
			this.hesaplandimi = true;
		}

		static musteriDurumu_initRowDetails(e) {
			super.musteriDurumu_initRowDetails(e);
			const {rec} = e; if (!rec) { return false }
			const {app} = sky, dbMgr = this.dbMgr || app.dbMgr_mf, {rowid} = rec;
			const stm = this.detaylarQueryStm({ id: rowid }); if (!stm) { return false }
			const {parent, grid, getDataAdapter, buildGrid} = e; if (!grid?.length) { return false }
			$.extend(e, {
				columns: [
					{
						dataField: 'tahSekliAdi', text: 'Tahsil Şekli', width: 190,
						cellsRenderer: (rowIndex, columnIndex, value, rec) => {
							rec = rec.originalRecord || rec; const {tahSekliNo, tahSekliAdi} = rec;
							if (!tahSekliNo) { return tahSekliAdi }
							if (!tahSekliAdi) { return `<b>(${tahSekliNo})</b>` }
							return `<b>(${tahSekliNo})</b>-${tahSekliAdi}`
						}
					},
					{ dataField: 'bedel', text: 'Bedel', width: 110, cellsFormat: 'd2', cellsAlign: 'right' }
				],
				listeArgsDuzenle: e => {
				},
				loadServerData: async _e =>
					await dbMgr.executeSqlReturnRows({ query: stm })
			});
			buildGrid.call(this, e);
		}

		async getMatbuuForm(e) {
			let matbuuForm = await super.getMatbuuForm(e);
			if (matbuuForm)
				return matbuuForm;

			const maxX = 41, tekilPosX = 2, otoYBas = 20, otoYSon = otoYBas + 4;
			matbuuForm = new CETMatbuuForm({
				tip: 'Tahsilat',
				dipPos: { x: 8 },
				formBilgi: {
					dipYazdirilirmi: true,
					sayfaBoyutlari: { x: maxX, y: 0 },
					otoYBasiSonu: { basi: otoYBas, sonu: otoYSon }
				},
				digerSahalar: {
					Dip: { pos: { x: 2 } },
					YalnizYazisi: { pos: { x: 2 }, genislik: 40 }
					/*Bakiye: { pos: { x: 8 } , genislik: 40 }*/
				},
				normalSahalar: {
					Aciklama: [
						// { attr: 'Pls:', pos: { x: 2, y: 4 }, genislik: 4 },
						{ attr: 'Tarih :', pos: { x: 19, y: 4 }, genislik: 8 },
						{ attr: 'Saat  :', pos: { x: 19, y: 5 }, genislik: 8 },
						{ attr: 'Mak.No:', pos: { x: 19, y: 6 }, genislik: 8 },
						{ attr: '-'.repeat(maxX - tekilPosX), pos: { x: tekilPosX, y: 10 }, genislik: maxX - tekilPosX }
						/*{ attr: 'SAYIN [mustUnvan],', pos: { x: 5, y: 4 }, genislik: 45 }*/
					],
					Tekil: [
						{ attr: 'fisTipText', pos: { x: tekilPosX + 2, y: 2 }, genislik: 30 },
						{ attr: 'plasiyerKod', pos: { x: 2, y: 4 }, genislik: 16 },
						{ attr: 'tarih', pos: { x: 28, y: 4 }, genislik: 13, alignment: 'r' },
						{ attr: 'saat', pos: { x: 28, y: 5 }, genislik: 13, alignment: 'r' },
						{ attr: 'fisNox', pos: { x: 28, y: 6 }, genislik: 13, alignment: 'r' },
						{ attr: 'isyeriUnvan', pos: { x: tekilPosX, y: 7 }, genislik: maxX - tekilPosX },
						{ attr: 'isyeriAdres', pos: { x: tekilPosX, y: 8 }, genislik: maxX - tekilPosX },
						{ attr: 'isyeriYoreVeIl', pos: { x: tekilPosX, y: 9 }, genislik: maxX - tekilPosX },
						{ attr: 'mustUnvan', pos: { x: tekilPosX, y: 11 }, genislik: maxX - tekilPosX },
						{ attr: 'mustAdres', pos: { x: tekilPosX, y: 12 }, genislik: maxX - tekilPosX },
						{ attr: 'mustYoreVeIl', pos: { x: tekilPosX, y: 13 }, genislik: maxX - tekilPosX }
					],
					Detay: [
						{ attr: 'tahSekliNo', pos: { x: 1, y: 1 }, genislik: 2, alignment: 'r' },
						{ attr: 'tahSekliAdi', pos: { x: 4, y: 1 }, genislik: 25 },
						{ attr: 'bedel', pos: { x: 29, y: 1 }, genislik: 9, alignment: 'r', tip: 'bedel' }
					]
				}
			});
			return matbuuForm
		}
		async getDokumDetaylar(e) { const detaylar = await super.getDokumDetaylar(e) || []; return detaylar.filter(det => !!det.bedel) }
		async getDokumDegeriDict(e) {
			return $.extend(await super.getDokumDegeriDict(e) || {}, {
				fisTipText: '** TAHSİLAT MAKBUZU **',
				async tahSekliAdi(e) { return this.tahSekliAdi || await this.dokum_getTahSekliAdi(e) },
				Yalniz(e) { return sonucBedel ? `#${Utils.yalnizYazisi(this.sonucBedel)}#` : '' },
				async Dip(e) {
					const {bakiyeRiskGosterilmezmi} = sky.app;
					const etiketSize = 15, veriSize = 13;
					const tekCizgi = ''.padEnd(etiketSize + 2, ' ') + ''.padEnd(veriSize + 3, '-');
					const ciftCizgi = ''.padEnd(etiketSize + 2, ' ') + ''.padEnd(veriSize + 3, '=');
					await this.gerekirseDipHesapla();
					const mustKod = await this.getRiskCariKod(e); if (!mustKod) { return null }
					let bakiye, oncekiBakiye;
					if (!bakiyeRiskGosterilmezmi) {
						let sent = new MQSent({ from: `mst_Cari`, where: [{ degerAta: mustKod, saha: `kod` }], sahalar: [`bakiye`] });
						let stm = new MQStm({ sent }), rec = await this.dbMgr.tekilExecuteSelect({ query: stm });
						if (rec) {
							bakiye = bedel(rec.bakiye);
							const {hesaplanmisBakiyeArtisi} = this; oncekiBakiye = hesaplanmisBakiyeArtisi == null ? null : bedel(bakiye - hesaplanmisBakiyeArtisi)
						}
					}
					const satirlar = [];
					satirlar.push(ciftCizgi);
					if (oncekiBakiye != null) {
						satirlar.push(
							` ONCEKI BAKIYE`.padEnd(etiketSize) + `: ` +
							`${bedelStr(oncekiBakiye)}`.padStart(veriSize) +
							` TL`
						);
					}
					satirlar.push(
						` TOPLAM`.padEnd(etiketSize) + `: ` +
						`${bedelStr(this.toplamBedel)}`.padStart(veriSize) +
						` TL`
					);
					if (bakiye != null) {
						satirlar.push(
							` BAKIYE`.padEnd(etiketSize) + `: ` +
							`${bedelStr(bakiye)}`.padStart(veriSize) +
							` TL`
						);
					}
					
					return satirlar;
				}
			})
		}

		async dokum_getTahSekliRec(e) {
			const {dokumTemps} = sky.app, tahSekli2DokumTemps = dokumTemps.tahSekli2DokumTemps = dokumTemps.tahSekli2DokumTemps || {};
			const {tahSekliNo} = this; if (!tahSekliNo) { return null }
			const tahSekliIcinDokumTemps = tahSekli2DokumTemps[mustKod] = tahSekli2DokumTemps[mustKod] || {}
			let rec = tahSekliIcinDokumTemps.tahSekliRec;
			if (rec == null) {
				let sent = new MQSent({ from: 'mst_TahsilSekli', sahalar: ['aciklama'] }); sent.where.degerAta(tahSekliNo, 'kodNo');
				rec = tahSekliIcinDokumTemps.tahSekliRec = await this.dbMgr.tekilDegerExecuteSelect(sent);
			}
			return rec
		}
		async dokum_getTahSekliAdi(e) { const rec = await this.dokum_getTahSekliRec(e) || {}; return rec.aciklama }
	};
})()
