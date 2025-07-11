(function() {
	window.CETStokTicariFis = class extends window.CETFis {
		static get deepCopyAlinmayacaklar() { return $.merge(super.deepCopyAlinmayacaklar || [], ['_sevkAdresKodPart']) }
		static get table() { return 'data_PIFFis' }
		static get dokumcuSinif() { return CETDokumcu_Matbuu }
		static get fisGirisUISinif() { return CETFisGirisPart }
		static get ticarimi() { return true }
		static get alimmi() { return false }
		static get satismi() { return !this.alimmi }
		static get iademi() { return false }
		static get iade() { return this.iademi ? 'I' : '' }
		static get stokKdvSaha() { return this.fiiliCikismi ? 'satKdvOrani' : 'almKdvOrani' }
		static get stokKdvDegiskenmiSaha() { return this.fiiliCikismi ? 'satKdvDegiskenmi' : 'almKdvDegiskenmi' }
		static get seriNoDesteklermi() { return true }
		static get noYilDesteklermi() { return false }
		static get sonStoktanSecimYapilirmi() { return false }
		static get sonStokKontrolEdilirmi() { return false }
		static get sonStokEtkilenirmi() { return false }
		get ihracatmi() { return this.ayrimTipi == 'IH' }
		get ihracKayitlimi() { return this.ayrimTipi == 'IK' }
		get numaratorTip() {
			let result = super.numaratorTip;
			if (!result)
				return ''
			let {eIslemNumaratorTip} = this;
			if (eIslemNumaratorTip && result.endsWith(`-${eIslemNumaratorTip}`))
				eIslemNumaratorTip = ''
			if (eIslemNumaratorTip && !this.yildizlimi)
				result += `-${eIslemNumaratorTip}`
			return result;
		}
		get eIslemNumaratorTip() {
			let result = super.eIslemNumaratorTip;
			if (this.class.ayrimTipiKullanilirmi && this.ihracatmi) {
				const {ayrimTipi} = this;
				if (ayrimTipi)
					result += `-${ayrimTipi}`
			}
			return result
		}
		get ayrimTipAdi() { return this.class.ayrimTipAdiFor({ ayrimTipi: this.ayrimTipi }) }
		static ayrimTipAdiFor(e) {
			e = e || {}; let {ayrimTipi, almSat} = e; almSat = almSat || this.almSat; let result = '';
			if (ayrimTipi && this.ayrimTipiKullanilirmi) {
				const {uygunAyrimTipleri} = this;
				if (!$.isEmptyObject(uygunAyrimTipleri)) {
					result = ayrimTipi == 'IH'
								? (almSat == 'A' ? 'İth.' : 'İhr.')
								: (uygunAyrimTipleri.find(ka => ka.kod == ayrimTipi) || {}).aciklama;
					if (result)
						result = `<span style="color: ${this.renkFor({ tip: 'ayrimTipi', ayrimTipi: ayrimTipi })};">${result}</span>`
				}
			}
			return result
		}
		static async getYerIcinSubeKod(e) {
			e = e || {}; const {yerKod} = e; let result = null;
			if (yerKod != null) {
				result = '';
				if (yerKod) {
					let sent = new MQSent({ from: 'mst_Yer', sahalar: [`subeKod`] });
					sent.where.degerAta(yerKod, `kod`);
					let rec = await this.dbMgr.tekilExecuteSelect({ tx: e.tx, query: sent });
					result = rec?.subeKod
				}
			}
			return result
		}
		async getYerIcinSubeKod(e) {
			let result = this.subeKod;
			if (result == null) { result = await this.class.getYerIcinSubeKod({ yerKod: this.yerKod }); this.subeKod = result }
			return result
		}
		static get sonStokKatSayi() { return this.fiiliCikismi ? -1 : 1 }
		getTumAltDetaylar(e) {
			e = e || {};
			const detArgs = $.extend({}, e, { fis: this });
			const result = [];
			const {detaylar} = this;
			for (const det of detaylar) {
				/*if (det.class.promosyonmu)
					continue*/
				let subResult = det.getAltDetaylar(detArgs);
				if (subResult && subResult.length)
					result.push(...subResult)
			}
			return result
		}
		get hesaplanmisSonStokBilgileri() {
			const result = super.hesaplanmisSonStokBilgileri, katSayi = this.class.sonStokKatSayi, detArgs = { fis: this };
			// if (this.class.bekleyenXFismi)
			detArgs.hmrSet = sky.app.depoSiparisKarsilamaZorunluHMRSet;
			const {detaylar} = this;
			for (const det of detaylar) {
				if (det.class.promosyonmu)
					continue
				const altDetaylar = det.getSonStokIcinAltDetaylar(detArgs);
				for (const altDet of altDetaylar) {
					const anahStr = altDet.getAnahtarStr(detArgs);
					result[anahStr] = (result[anahStr] || 0) + (((altDet.miktar || 0) + (altDet.malFazlasi || 0)) * katSayi)
				}
			}
			return result
		}

		get hesaplanmisStokMiktarBilgileri() {
			const result = super.hesaplanmisStokMiktarBilgileri, katSayi = this.class.sonStokKatSayi, {detaylar} = this;
			for (const det of detaylar) {
				if (det.class.promosyonmu)
					continue
				const anahStr = det.shKod;
				result[anahStr] = (result[anahStr] || 0) + (((det.miktar || 0) + (det.malFazlasi || 0)) * katSayi)
			}
			return result
		}
		get sonStokIcinAltDetaylarKontrolsuz() {
			const result = [], detArgs = { fis: this }, {detaylar} = this;
			for (const det of detaylar) {
				if (det.class.promosyonmu)
					continue
				let subResult = det.getSonStokIcinAltDetaylar(detArgs);
				if (subResult && subResult.length)
					result.push(...subResult)
			}
			return result
		}
		get sonStokIcinAltDetaylar() {
			let result = this.sonStokIcinAltDetaylarKontrolsuz;
			if (result)
				result = result.filter(det => !!det.miktar)
			return result
		}

		constructor(e) {
			e = e || {}; super(e);
			$.extend(this, {
				vioID: e.vioID || e.vioid || null,
				ayrimTipi: e.ayrimTipi || e.ayrimtipi || '',
				mustKod: (e.mustKod || e.mustkod || '').trimEnd(),
				mustUnvan: e.mustUnvan || e.mustunvan,
				plasiyerKod: (e.plasiyerKod || sky.app.defaultPlasiyerKod || '').trimEnd(),
				subeKod: e.subeKod == null ? e.subeKod : e.subeKod.trimEnd() /* || sky.app.defaultSubeKod */,
				yerKod: (e.yerKod || sky.app.defaultYerKod || '').trimEnd(),
				noYil: e.noYil || (this.class.noYilDesteklermi ? today().getFullYear() : 0),
				sevkTarih: e.sevkTarih || null,
				sevkAdresKod: (e.sevkAdresKod || e.sevkadreskod || e.xadreskod || '').trimEnd()
			})
		}
		static detaylarQueryStm(e) {
			e = e || {}; const detayTable = e.detayTable || this.detayTable, fisIDSaha = e.fisIDSaha || (e.detaySinif || this.detaySinif).fisIDSaha;
			const {id, harID} = e, {fiiliCikismi, stokKdvSaha, stokKdvDegiskenmiSaha} = this;
			let stm = new MQStm({
				sent: new MQSent({
					from: `${detayTable} har`,
					fromIliskiler: [{ alias: 'har', leftJoin: 'mst_Stok stk', on: 'har.shkod = stk.kod' }],
					sahalar: [
						`har.rowid`, `har.promokod`, `COALESCE(stk.grupkod, '') grupkod`, `har.yerKod`,
						`har.shkod`, `stk.aciklama shadi`,
						`(case when har.xbrm == '' then stk.brm else har.xbrm end) brm`,
						`har.orjfiyat`, `har.belgefiyat`,
						(fiiliCikismi ? `stk.brmFiyat` : `(case when stk.almFiyat == 0 then stk.brmFiyat else stk.almFiyat end) brmFiyat`),
						`har.orjKdvOrani`, `har.kdvorani kdvOrani`, `har.kdvDegiskenmi`,
						`har.belgebrutbedel`, `har.belgebedel`, `har.paketBilgi`, `har.sevkSipHarSayac`, `har.altDetaylar`, `har.kosulYapi`
						/*((stokKdvSaha ? `stk.${stokKdvSaha}` : `NULL`) + ` kdvOrani`),
						((stokKdvDegiskenmiSaha ? `stk.${stokKdvDegiskenmiSaha}` : `NULL`) + ` kdvDegiskenmi`)*/
					]
				}),
				orderBy: [fisIDSaha, 'seq']
			});
			for (const sent of stm.getSentListe()) {
				if (fisIDSaha) sent.where.degerAta(id, `har.${fisIDSaha}`)
				if (harID) sent.where.degerAta(harID, `har.fissayac`)
				if (!e.basitmi) sent.sahalar.add('har.*')
			}
			return stm
		}
		hostVars(e) {
			e = e || {}; let hv = super.hostVars();
			$.extend(hv, {
				vioID: this.vioID || null,
				ayrimtipi: this.ayrimTipi || '',
				noYil: this.noYil || 0,
				mustkod: this.mustKod,
				ticmustkod: this.riskCariKod || '',
				subekod: this.subeKod || sky.app.defaultSubeKod || '',
				yerkod: this.yerKod || '',
				xplasiyerkod: sky.app.defaultPlasiyerKod || this.plasiyerKod || '', /* this.plasiyerKod || '', */
				sevktarih: Utils.asReverseDateString(this.sevkTarih) || '',
				xadreskod: this.sevkAdresKod || ''
				/*efayrimtipi: this.efAyrimTipi || '',
				zorunluguidstr: this.efUUID || ''*/
			});
			//if (sky.config.isDevMode)
			//	hv.abc2 = 'ABC';
			return hv
		}
		async setValues(e) {
			e = e || {}; await super.setValues(e); const {rec} = e;
			$.extend(this, {
				vioID: rec.vioID || null,
				ayrimTipi: rec.ayrimtipi || '',
				mustKod: rec.mustkod || '',
				riskCariKod: rec.ticmustkod || null,
				plasiyerKod: rec.xplasiyerkod || rec.plasiyerkod || sky.app.defaultPlasiyerKod,
				subeKod: rec.subekod || '',
				yerKod: rec.yerkod || sky.app.defaultYerKod,
				noYil: rec.noyil || today().getFullYear(),
				mustUnvan: rec.mustunvan,
				sevkTarih: asDate(rec.sevktarih) || null,
				sevkAdresKod: rec.xadreskod || ''
			})
			//if (sky.config.isDevMode)
			//	this.abc = rec.abc3 || '';
		}
		async initBaslikUI_ara(e) {
			await super.initBaslikUI_ara(e);
			const {app} = sky, {parentPart, layout} = e, {param} = parentPart;
			const userSettings = param.userSettings = param.userSettings || {}, sonDegerler = userSettings.sonDegerler = userSettings.sonDegerler || {};
			let savedParentWidth;
			/*if (this.class.sevkYeriKullanilirmi) {
				let kod = this.sevkAdresKod;
				let sonDeger = sonDegerler.sevkAdresKod;
				
				const divSaha = layout.find(`#sevkAdresKod`);
				const sahaContainer = divSaha.parents(`.parent`);
				const divEtiket = sahaContainer.find(`.etiket`);
				let part = this._sevkAdresKodPart = new CETMstComboBoxPart({
					parentPart: parentPart,
					content: divSaha,
					// layout: layout.find('.hizliStok'),
					placeHolder: 'Sevk Adresi',
					listeSinif: CETKAListePart, table: 'mst_SevkAdres',
					idSaha: 'kod', adiSaha: 'aciklama',
					selectedId: kod || sonDeger,
					widgetDuzenleyici: e => {
						savedParentWidth = e.widgetArgs.width = savedParentWidth || (
							e.widgetArgs.width - (divEtiket.width() ||  0) );
						e.widgetArgs.dropDownWidth = e.widgetArgs.width;
					},
					events: {
						comboBox_stmDuzenleyici: e => {
							const {mustKod} = this;
							if (mustKod) {
								e.stm.sentDo(sent =>
									sent.where.degerAta(mustKod, `mst.mustKod`));
							}
						},
						liste_stmDuzenleyici: e => {
							const {mustKod} = this;
							if (mustKod) {
								e.stm.sentDo(sent =>
									sent.where.degerAta(mustKod, `mst.mustKod`));
							}
						},
						comboBox_itemSelected: e => {
							kod = this.sevkAdresKod = (e.rec || {}).kod || e.value || ''
							if (sonDeger != kod) {
								sonDeger = sonDegerler.sevkAdresKod = kod;
								parentPart.paramDegistimi = true;
							}
						}
					}
				});
				sahaContainer.removeClass(`jqx-hidden`);
				await part.run();
			}*/
		}

		static musteriDurumu_initRowDetails(e) {
			super.musteriDurumu_initRowDetails(e);
			const {rec} = e;
			if (!rec) return false
			const {app} = sky, {bakiyeRiskGosterilmezmi} = app, dbMgr = this.dbMgr || app.dbMgr_mf, {rowid} = rec;
			const stm = this.detaylarQueryStm({ id: rowid });
			if (!stm) return false
			const {parent, grid, getDataAdapter, buildGrid} = e;
			if (!grid?.length) return false
			const columns = [
				{
					dataField: 'shadi', text: 'Ürün', width: 170,
					cellsRenderer: (rowIndex, columnIndex, value, rec) => {
						rec = rec.originalRecord || rec;
						const shKod = rec.shkod, shAdi = rec.shadi;
						if (!shKod) return shAdi
						if (!shAdi) return `<b>(${shKod})</b>`
						return `<b>${shKod}</b>-${shAdi}`
					}
				},
				{
					dataField: 'miktar', text: 'Miktar', width: 55, cellsAlign: 'right',
					cellsRenderer: (rowIndex, columnIndex, value, rec) => {
						rec = rec.originalRecord || rec;
						const {miktar} = rec, brm = rec.brm || 'AD', stokFra = sky.app.brm2Fra[brm] || 0;
						return `${roundToFra(miktar, stokFra)} ${brm}`
					}
				}
			];
			if (!bakiyeRiskGosterilmezmi)
				columns.push({ dataField: 'belgefiyat', text: 'Fiyat', width: 80, cellsFormat: 'd4', cellsAlign: 'right' })
			columns.push({
				dataField: `iskorantext`, text: 'İskonto', width: 100, cellsFormat: 'd2',
				cellsRenderer: (rowIndex, columnIndex, value, rec) => {
					rec = rec.originalRecord || rec;
					const liste = [];
					const {iskSayi} = sky.app;
					for (let i = 1; i <= iskSayi; i++) {
						const value = asFloat(rec[`iskoran${i}`]);
						if (value)
							liste.push(value.toLocaleString())
					}
					const kadIskOran = rec.kadiskoran;
					if (kadIskOran)
						liste.push(`<span class="kadIskOranText">${kadIskOran}</span>`)
					return $.isEmptyObject(liste) ? '' : `%${liste.join('+')}`
				}
			});
			if (!bakiyeRiskGosterilmezmi)
				columns.push({ dataField: 'belgebedel', text: 'Bedel', width: 80, cellsFormat: 'd2', cellsAlign: 'right' })
			$.extend(e, {
				columns: columns,
				// listeArgsDuzenle: e => {},
				loadServerData: async _e =>
					await dbMgr.executeSqlReturnRows({ query: stm })
			});
			buildGrid.call(this, e);
		}

		async yukleSonrasi(e) {
			await super.yukleSonrasi(e);
			await this.rbkAsortiDonusumInit(e)
		}

		async rbkAsortiDonusumInit(e) {
			e = e || {};
			const {app} = sky;
			if (!app.rbkKullanilirmi)
				return
			
			let bedenKategoriKod2AsortiKod2Carpan = this._bedenKategoriKod2AsortiKod2Carpan;
			if (!bedenKategoriKod2AsortiKod2Carpan) {
				let bedenKategoriKodSet = this._bedenKategoriKodSet;
				if (!bedenKategoriKodSet) {
					bedenKategoriKodSet = this._bedenKategoriKodSet = {};
					const {detaylar} = this;
					for (const det of detaylar) {
						if (!det.rbkIcinUygunmu)
							continue
						const {bedenKategoriKod} = det;
						if (bedenKategoriKod)
							bedenKategoriKodSet[bedenKategoriKod] = true
					}
				}

				bedenKategoriKod2AsortiKod2Carpan = this._bedenKategoriKod2AsortiKod2Carpan = {};
				if (!$.isEmptyObject(bedenKategoriKodSet)) {
					const dbMgr = e.dbMgr || this.dbMgr;
					let sent = new MQSent({
						from: 'mst_BedenKategoriCarpan',
						where: { inDizi: Object.keys(bedenKategoriKodSet), saha: 'bedenKategoriKod' },
						sahalar: ['bedenKategoriKod', 'asortiKod', 'carpan']
					});
					let recs = await dbMgr.executeSqlReturnRowsBasic({ query: sent });
					for (let i = 0; i < recs.length; i++) {
						const rec = recs[i];
						const {bedenKategoriKod} = rec;
						const asortiKod2Carpan = bedenKategoriKod2AsortiKod2Carpan[bedenKategoriKod] = bedenKategoriKod2AsortiKod2Carpan[bedenKategoriKod] || {};
						asortiKod2Carpan[rec.asortiKod] = asFloat(rec.carpan) || 1
					}
				}
			}
		}

		async kaydetSonrasiIslemler(e) {
			await super.kaydetSonrasiIslemler(e);

			if (this.class.sonStokEtkilenirmi)
				await this.sonStokDuzenle(e);
		}

		async silmeSonrasiIslemler(e) {
			await super.silmeSonrasiIslemler(e);

			if (this.class.sonStokEtkilenirmi)
				await this.sonStokDuzenle(e);
		}

		async onKontrol(e) {
			e = e || {}; let result = await this.onKontrol_detaylar(e);
			if (!result || result.isError) { return result }
			let {musteriKullanilirmi} = this.class, {dbMgr} = this, {tx} = e;
			let kontrolIslemi = e.kontrolIslemi = async (kod, cacheSource, table, kodSaha, etiket) => {
				if (!kod) { return }
				kodSaha = kodSaha || 'kod';
				let query = `SELECT COUNT(*) sayi FROM ${table} WHERE ${kodSaha} = ?`, params = [kod];
				let varmi = cacheSource?.[kod] || asInteger(await dbMgr.tekilDegerExecuteSelect({ tx, query, params }));
				if (!varmi) {
					throw this.error_onKontrol((
						`<p/>[ <b class=red>${kod}</b> ] kodlu <u class=bold>${etiket} Kodu</u> hatalıdır.<p/><p/>` +
					    `<p class="gray">** Ekranda <u>${etiket} Kodu</u> kutusu <b>boş gözüküyor ise</b><br/>` + 
						` <b class=royalblue>Kutunun üzerine tıklayıp, ENTER tuşuna basarak</b> değeri silebilirsiniz</p>`
					), 'invalidValue')
				}
			};
			let {mustKod, sevkAdresKod, plasiyerKod, yerKod, nakSekliKod, tahSekliKodNo} = this;
			if (musteriKullanilirmi) {
				if (!mustKod) { return this.error_onKontrol(`<b>Müşteri</b> belirtilmelidir`, 'emptyValue') }
				await kontrolIslemi(mustKod, caches.mustKod2EkBilgi, 'mst_Cari', 'kod', 'Müşteri')
			}
			await kontrolIslemi(plasiyerKod, caches.plasiyerKod2Rec, 'mst_Plasiyer', 'kod', 'Plasiyer');
			await kontrolIslemi(yerKod, caches.yerKod2Rec, 'mst_Yer', 'kod', 'Yer');
			await kontrolIslemi(sevkAdresKod, caches.sevkAdresKod2Rec, 'mst_SevkAdres', 'kod', 'Sevk Adres');
			await kontrolIslemi(nakSekliKod, caches.nakliyeSekliKod2Rec, 'mst_NakliyeSekli', 'kod', 'Nakliye Şekli');
			await kontrolIslemi(tahSekliKodNo, caches.tahsilSekliKodNo2Rec, 'mst_TahsilSekli', 'kodNo', 'Tahsil Şekli');
			return await super.onKontrol(e)
		}
		async onKontrol_detaylar(e) {
			e = e || {};
			const detaylar = this.sonStokIcinAltDetaylar;
			if ($.isEmptyObject(detaylar))
				throw { isError: true, rc: 'bosFis', errorText: 'Belge içeriği girilmelidir' }
			
			const tip2KontrolYapi = {
				stok: {
					aciklama: 'Stok', table: 'mst_Stok', idSaha: 'kod',
					receiver: e => e.detay, getter: e => e.receiver.shKod
				}
			};
			await detaylar[0].ekOzelliklerDo({
				callback: _e => {
					const ekOzellik = _e.item;
					const table = ekOzellik.mbTable;
					if (table) {
						const tip = ekOzellik.tip || _e.tip;
						tip2KontrolYapi[tip] = tip2KontrolYapi[tip] || {
							aciklama: ekOzellik.tipAdi,detAttr: ekOzellik.idSaha,
							table: table, idSaha: ekOzellik.mbKodSaha,
							receiver: e => e.tip2EkOzellik[e.tip],
							getter: e => e.receiver.value
						};
					}
				}
			});
			
			const {dbMgr} = this;
			let uni = new MQUnionAll();
			let stm = new MQStm({ sent: uni });
			const tip2Values = {};
			for (const det of detaylar) {
				for (const tip in tip2KontrolYapi) {
					const kontrolYapi = tip2KontrolYapi[tip];
					let _e = { tip: tip, kontrolYapi: kontrolYapi, detay: det, tip2EkOzellik: det.ekOzelliklerYapi.tip2EkOzellik };
					let receiver = kontrolYapi.receiver || det;
					if ($.isFunction(receiver))
						receiver = _e.receiver = receiver.call(this, _e)
					let value = kontrolYapi.getter ? kontrolYapi.getter.call(this, _e) : (kontrolYapi.detAttr ? receiver[kontrolYapi.detAttr] : null)
					if ($.isFunction(value))
						value = value.call(this, _e)
					
					if (value) {
						const values = tip2Values[tip] = (tip2Values[tip] || {});				// set olarak dursun
						values[value] = true
					}
				}
			}

			for (const tip in tip2KontrolYapi) {
				const kontrolYapi = tip2KontrolYapi[tip];
				const {idSaha} = kontrolYapi;
				const values = tip2Values[tip];
				if (!$.isEmptyObject(values)) {
					const sent = new MQSent({
						from: kontrolYapi.table,
						where: [{ inDizi: values, saha: idSaha }],
						sahalar: [`'${tip}' tip`, `${idSaha} value`]
					});
					uni.add(sent)
				}
			}
			
			if (!$.isEmptyObject(uni.liste)) {
				let recs = await dbMgr.executeSqlReturnRowsBasic({ tx: e.tx, query: stm });
				for (let i = 0; i < recs.length; i++) {
					const rec = recs[i];
					const {tip, value} = rec;
					const mevcutDegerler = tip2Values[tip] || {};
					delete mevcutDegerler[value]
				}

				let errorList = [];
				for (const tip in tip2Values) {
					const eksikDegerlerSet = tip2Values[tip];
					if (!$.isEmptyObject(eksikDegerlerSet)) {
						const kontrolYapi = tip2KontrolYapi[tip];
						const birlesikKodStr = Object.keys(eksikDegerlerSet).join(' | ');
						errorList.push(`- Bazı <b>${kontrolYapi.aciklama}</b> kodları hatalıdır: [<b>${birlesikKodStr}</b>]`)
					}
				}

				if (!$.isEmptyObject(errorList))
					return { isError: true, rc: 'invalidId', errorText: errorList.join(`<br/>${CrLf}`) }
			}
			
			return { isError: false };
		}

		async kaydetOncesiKontrol_ara(e) {
			await super.kaydetOncesiKontrol_ara(e);

			let promise = this.getYerIcinSubeKod(e);
			await this.miktarKontrol(e);

			await promise;
			if (this.class.sonStokKontrolEdilirmi)
				await this.sonStokKontrol(e)
		}

		async sonStokKontrol(e) {
			e = e || {};
			const {dbMgr} = this;
			const altDetaylar = this.sonStokIcinAltDetaylar;
			if ($.isEmptyObject(altDetaylar))
				return;
			
			const islem = e.islem || (e.sender || {}).islem;
			const eskiFis = !asBool(e.gecicimi) && (islem == 'degistir') ? e.eskiFis : (islem == 'sil') ? this : null;
			const yeniFis = (islem == 'sil') ? null : this;
			const anahtarStr2SonStok = yeniFis ? yeniFis.hesaplanmisSonStokBilgileri : {};
			if (eskiFis) {
				const eskiFis_anahtarStr2SonStok = eskiFis.hesaplanmisSonStokBilgileri;
				for (const anahtarStr in eskiFis_anahtarStr2SonStok) {
					const miktar = eskiFis_anahtarStr2SonStok[anahtarStr];
					anahtarStr2SonStok[anahtarStr] = (anahtarStr2SonStok[anahtarStr] || 0) - miktar;
				}
			}
			
			const ilkDetay = altDetaylar[0];
			const detaySinif = ilkDetay.class;
			const detArgs = { fis: this };
			// if (this.class.bekleyenXFismi)
			detArgs.hmrSet = sky.app.depoSiparisKarsilamaZorunluHMRSet;
			
			const ekOzelliklerTumIDSahalar = detaySinif.ekOzelliklerIDSahalar || [];
			const ekOzelliklerTumIDSahalarSet = asSet(ekOzelliklerTumIDSahalar);
			const ekOzellikTip2IdSaha = {};
			if (ilkDetay) {
				const {tip2EkOzellik} = ilkDetay.ekOzelliklerYapi;
				for (const tip in tip2EkOzellik) {
					if (ekOzelliklerTumIDSahalarSet[tip] || tip == 'refRaf')
						continue
					
					const {idSaha} = tip2EkOzellik[tip];
					ekOzellikTip2IdSaha[tip] = idSaha;

					if (!detArgs.hmrSet || detArgs.hmrSet[tip]) {
						ekOzelliklerTumIDSahalarSet[idSaha] = true;
						ekOzelliklerTumIDSahalar.push(idSaha)
					}
				}
			}
			const ekOzelliklerTumIDSahalar_hariclerDahil = Object.keys(altDetaylar[0].getEkOzelliklerKeyHostVars({ hmrSet: {} }));
			let hmrIdSahaSet;
			if (detArgs.hmrSet) {
				hmrIdSahaSet = {};
				for (const idSaha of ekOzelliklerTumIDSahalar_hariclerDahil)
					hmrIdSahaSet[idSaha] = true
				for (const tip in detArgs.hmrSet)
					hmrIdSahaSet[ekOzellikTip2IdSaha[tip]] = true
			}
			for (const idSaha of Object.values(ekOzellikTip2IdSaha))
				ekOzelliklerTumIDSahalar_hariclerDahil.push(idSaha)
			
			let sent = new MQSent({
				from: `mst_SonStok son`,
				fromIliskiler: [
					{ from: `mst_Stok stk`, iliski: `son.stokKod = stk.kod` }
				],
				where: { degerAta: this.yerKod || '', saha: `son.yerKod` },
				distinct: true
			});
			let stm = new MQStm({ sent: sent });
			for (const idSaha of ekOzelliklerTumIDSahalar) {
				sent.sahalar.add(`son.${idSaha}`);
				sent.groupBy.add(`son.${idSaha}`)
			}
			sent.sahalar
				.addAll([`stk.aciklama stokAdi`, `stk.brm`, `SUM(son.miktar) miktar`]);

			// const {ekOzelliklerIDSahalar} = detaySinif;
			const anahtarStrSet = {};
			const anahtarStr2EkBilgi = {};
			const or = new MQOrClause();
			for (const altDet of altDetaylar) {
				const anahtarStr = altDet.getAnahtarStr(detArgs);
				if (!anahtarStrSet[anahtarStr]) {
					anahtarStrSet[anahtarStr] = true;
					anahtarStr2EkBilgi[anahtarStr] = { stokAdi: altDet.shAdi, brm: altDet.brm };
					
					const keyHV = altDet.getEkOzelliklerKeyHostVars(detArgs);
					or.add(new MQSubWhereClause({ alias: 'son', birlestirDict: keyHV }));
				}
			}
			sent.where.add(or);
			
			const {anahtarDelim} = CETEkOzellikler;
			const yetersizAnahtarStrVeMiktarStrListe = [];
			let rs = await dbMgr.executeSql({ tx: e.tx, query: stm });
			for (let i = 0; i < rs.rows.length; i++) {
				const rec = rs.rows[i];
				const anahtarStr = ekOzelliklerTumIDSahalar_hariclerDahil.map(idSaha => !hmrIdSahaSet || hmrIdSahaSet[idSaha] ? (rec[idSaha] || '') : '').join(anahtarDelim);
				// const anahtarStr = ekOzelliklerTumIDSahalar.map(idSaha => rec[idSaha] || '').join(anahtarDelim);
				if (!anahtarStrSet[anahtarStr])								// detaylarda olmayan bir anahtarStr gelirse (... yanlış sent where için önlem ...)
					continue												// 		continue loop
				
				let miktar = asFloat(rec.miktar);
				// let artis = (islem == 'degistir') ? 0 : miktar;
				let artis = miktar;
				if (islem == 'sil')
					artis = -artis
				anahtarStr2SonStok[anahtarStr] = (anahtarStr2SonStok[anahtarStr] || 0) + artis;
				anahtarStr2EkBilgi[anahtarStr] = { stokAdi: rec.stokAdi, brm: rec.brm }
			}

			for (const anahtarStr in anahtarStr2SonStok) {
				const sonStok = anahtarStr2SonStok[anahtarStr];
				if (sonStok < 0) {
					let basitAnahtarListe = [];
					for (const value of anahtarStr.split(anahtarDelim)) {
						if (value)
							basitAnahtarListe.push(value)
					}
					const ekBilgi = anahtarStr2EkBilgi[anahtarStr] || {};
					if (!$.isEmptyObject(basitAnahtarListe)) {
						basitAnahtarListe[0] = `<span class="bold">${basitAnahtarListe[0]}</span>`;
						const basitAnahtarText = basitAnahtarListe.join(' | ');
						yetersizAnahtarStrVeMiktarStrListe.push(
							`<li class="darkgray" style="margin-top: 4px; margin-bottom: 8px;">` +
								`<div class="flex-row">` +
									`<div style="min-width: 150px;">${basitAnahtarText}</div>`+
									`: <span class="bold darkred">${sonStok.toLocaleString()} ${ekBilgi.brm || 'AD'}</span>` +
								`</div>` +
								(ekBilgi.stokAdi ? `<div class="italic gray" style="font-size: 85%; padding-left: 13px;">${ekBilgi.stokAdi}</div>` : ``) +
							`</li>`
						)
					}
				}
			}

			if (!$.isEmptyObject(yetersizAnahtarStrVeMiktarStrListe)) {
				throw {
					isError: true, rc: 'sonStokYetersiz',
					errorText: (
						`<p class="bold red" style="padding-left: 2px; margin-bottom: 13px;">Bazı satırlar için Son Stok yetersizdir:</p>${CrLf}` +
						`<ul style="margin-left: -8px; line-height: 20px;">` +
							yetersizAnahtarStrVeMiktarStrListe.join(`${CrLf}`) +
						`</ul>`
					)
				}
			}
		}

		async sonStokDuzenle(e) {
			e = e || {};
			const altDetaylar = this.sonStokIcinAltDetaylarKontrolsuz;
			if ($.isEmptyObject(altDetaylar))
				return;
			
			const islem = e.islem || (e.sender || {}).islem;
			const eskiFis = !asBool(e.gecicimi) && (islem == 'degistir') ? e.eskiFis : (islem == 'sil') ? this : null;
			const yeniFis = (islem == 'sil') ? null : (e.fis || this);
			const dogrudanMiktarAlinirmi = asBool(e.dogrudanMiktarAlinir || e.dogrudanMiktarAlinirmi);

			const sonStokBilgileri = {};
			if (yeniFis) {
				const {hesaplanmisSonStokBilgileri} = yeniFis;
				for (const anah in hesaplanmisSonStokBilgileri) {
					const miktar = hesaplanmisSonStokBilgileri[anah];
					sonStokBilgileri[anah] = (sonStokBilgileri[anah] || 0) + miktar;
				}
			}
			if (eskiFis) {
				const {hesaplanmisSonStokBilgileri} = eskiFis;
				for (const anah in hesaplanmisSonStokBilgileri) {
					const miktar = hesaplanmisSonStokBilgileri[anah];
					sonStokBilgileri[anah] = (sonStokBilgileri[anah] || 0) - miktar;
				}
			}

			const {anahtarDelim} = CETEkOzellikler;
			const ilkDetay = altDetaylar[0];
			const detaySinif = ilkDetay.class;
			const detArgs = { fis: this };
			// if (this.class.bekleyenXFismi)
			detArgs.hmrSet = sky.app.depoSiparisKarsilamaZorunluHMRSet;

			const ekOzelliklerTumIDSahalar_kontrolsuz = detaySinif.ekOzelliklerTumIDSahalar;
			const ekOzelliklerTumIDSahalar = detaySinif.ekOzelliklerIDSahalar || [];
			const ekOzelliklerIDSahalarSet = asSet(ekOzelliklerTumIDSahalar);
			const ekOzelliklerTumIDSahalarSet = $.extend({}, ekOzelliklerIDSahalarSet);
			const ekOzellik_idSaha2Tip = {};
			if (ilkDetay) {
				const {tip2EkOzellik} = ilkDetay.ekOzelliklerYapi;
				for (const tip in tip2EkOzellik) {
					if (!tip || ( tip == 'refRaf' || tip == 'yer' ))
						continue;
					const {idSaha} = tip2EkOzellik[tip];
					ekOzellik_idSaha2Tip[idSaha] = tip;
					if (!ekOzelliklerTumIDSahalarSet[tip] && (detArgs.hmrSet && detArgs.hmrSet[tip])) {
						ekOzelliklerTumIDSahalarSet[idSaha] = true;
						ekOzelliklerTumIDSahalar.push(idSaha)
					}
				}
			}
			delete ekOzelliklerIDSahalarSet.refRafKod;
			
			const tumKeyHVListe = [];
			const anahtarStr2HV = {};
			for (const anah in sonStokBilgileri) {
				const topMiktar = sonStokBilgileri[anah];
				if (topMiktar) {
					const keyHV = CETEkOzellikler.keyHostVarsFrom({ with: Object.keys(ekOzelliklerIDSahalarSet), anahtarStr: anah });
					for (const idSaha in keyHV) {
						const tip = ekOzellik_idSaha2Tip[idSaha];
						if (!tip || ( tip == 'refRaf' || tip == 'yer' ))
							continue
						if ((detArgs.hmrSet && !detArgs.hmrSet[tip]) && keyHV[idSaha] != null)
							keyHV[idSaha] = ''
					}
					tumKeyHVListe.push(keyHV);
					const tumAnahtarStr = Object.values(keyHV).join(anahtarDelim);
					anahtarStr2HV[tumAnahtarStr] = $.extend({}, keyHV, { orjMiktar: 0, miktar: topMiktar })
				}
			}

			if (!$.isEmptyObject(tumKeyHVListe)) {
				const {dbMgr} = this;
				const hasInitialTransaction = !!e.tx;
				let tx = hasInitialTransaction ? e.tx : null;
				
				const table = 'mst_SonStok';
				/*let del = new MQIliskiliDelete({ from: table, where: [`miktar = 0`] });
				await dbMgr.executeSql({ tx: tx, query: del });*/
				
				const anahtarKeys = Object.keys(tumKeyHVListe[0]);
				const sahalar = $.merge($.merge([], anahtarKeys), [
					`SUM(orjMiktar) orjMiktar`, `SUM(miktar) miktar`
				]);
				const parcaSize = 50;
				await Utils.arrayParcalaAndDo({
					source: tumKeyHVListe, parcaSize: parcaSize,
					callback: async e => {
						const keyHVListe = e.part;
						let or = new MQOrClause();
						keyHVListe.forEach(keyHV => {
							let wh = new MQWhereClause();
							wh.birlestirDict(keyHV);
							or.add(`(${wh.toString_baslangicsiz()})`);
						});
						let sent = new MQSent({
							from: table, where: [or],
							sahalar: sahalar,
							groupBy: anahtarKeys
						});
						let stm = new MQStm({ sent: sent });

						let recs = await dbMgr.executeSqlReturnRowsBasic({ tx: tx, query: stm });
						for (let i = 0; i < recs.length; i++) {
							const rec = recs[i];
							const {miktar} = rec;
							const anahtarStr = anahtarKeys.map(key => rec[key]).join(anahtarDelim);
							const hv = anahtarStr2HV[anahtarStr];
							if (hv) {
								hv.orjMiktar = rec.orjMiktar;
								if (miktar && !dogrudanMiktarAlinirmi)
									hv.miktar = roundToFra(hv.miktar + miktar, 6);
							}
						}

						if (!$.isEmptyObject(anahtarStr2HV)) {
							await dbMgr.insertOrReplaceTable({
								table: table, mode: 'replace',
								hvListe: Object.values(anahtarStr2HV)
							});
						}
					}
				});

				//if (!hasInitialTransaction)
				//	await dbMgr.transaction();			// commit
			}
		}

		miktarKontrol(e) {
			const altDetaylar = this.sonStokIcinAltDetaylar;
			let seq = 0;
			for (const det of altDetaylar) {
				seq++;
				const miktar = det.miktar || 0;
				if (miktar < 0) {
					const seq = i + 1;
					throw {
						isError: true, rc: 'detayMiktarNegatif',
						errorText: `<b>${seq.toLocaleString()}. satırdaki</b> Miktar <u>Negatif(-)</u> olduğu için belge kaydına izin verilmiyor: (<b>${miktar} ${det.brm || 'AD'}</b>)`
					}
				}
			}
		}

		sevkAdresReset(e) {
			super.sevkAdresReset(e);
			const value = this.sevkAdresKod = '';

			const sevkAdresKodPart = this._sevkAdresKodPart;
			if (sevkAdresKodPart && !sevkAdresKodPart.isDestroyed && sevkAdresKodPart.comboBoxWidget)
				sevkAdresKodPart.comboBox_enterIstendi({ value: value });
		}

		detYerKodReset(e) {
			const {detaylar} = this;
			for (const det of detaylar) {
				const det = detaylar[i];
				det.detYerKodReset()
			}
		}

		getDokumDetaylar(e) {
			e = e || {};
			return this.getTumAltDetaylar($.extend({}, e, { carpanli: true }))
			
			/*const detaylar = await super.getDokumDetaylar(e) || [];
			return detaylar.filter(det => !!det.miktar);*/
		}
		async getDokumDegeriDict(e) {
			const bilgiFisiYazi = e => 'BİLGİ FİŞİDİR', eBelgeBilgiFisiYazi = e => this.eBelgemi ? `e-Belge BİLGİ FİŞİDİR` : '';
			let result = {
				...await super.getDokumDegeriDict(e),
				async efaturaKullanirmi(e) { return sky.app.eIslemKullanilirmi && this.class.eIslemKullanilirmi && await this.getCariEFatmi(e) },
				efAyrimTipi: this.eIslemTipi,
				efBelgeTipi(e) { return sky.app.eIslemTip2UzunAdi(this.eIslemTip) },
				efFaturaTipi(e) { return this.class.satismi == this.class.iademi ? 'IADE' : 'SATIS' },
				efUUID: this.uuid, guidStr: this.uuid,
				efatNoStr(e) { return `${this.seri}${this.noYil}${(this.fisNo || 0).toString().padStart(9, '0')}` },
				bilgiFisiYazi: e => bilgiFisiYazi(e),
				bilgiFisiYaziKucuk: e => { let result = bilgiFisiYazi(); if (result) { result = `<SMALL>${result}<NORMAL>` } return result },
				bilgiFisiYaziKoyu: e => { let result = bilgiFisiYazi(); if (result) { result = `<BOLD>${result}<NORMAL>` } return result },
				bilgiFisiYaziBuyuk: e => { let result = bilgiFisiYazi(); if (result) { result = `<BIG>${result}<NORMAL>` } return result },
				eBelgeBilgiFisiYazi: e => eBelgeBilgiFisiYazi(e),
				eBelgeBilgiFisiYaziKucuk: e => { let result = eBelgeBilgiFisiYazi(); if (result) { result = `<SMALL>${result}<NORMAL>` } return result },
				eBelgeBilgiFisiYaziKoyu: e => { let result = eBelgeBilgiFisiYazi(); if (result) { result = `<BOLD>${result}<NORMAL>` } return result },
				eBelgeBilgiFisiYaziBuyuk: e => { let result = eBelgeBilgiFisiYazi(); if (result) { result = `<BIG>${result}<NORMAL>` } return result },
				efSenaryoTipi: async e => { const cariEFatmi = await this.getCariEFatmi(e); return cariEFatmi ? 'TICARIFATURA' : 'EARSIVFATURA' },
				Yalniz: e => { const {sonucBedel} = this; return sonucBedel ? `#${Utils.yalnizYazisi(this.sonucBedel)}#` : '' },
				'QR-EISLEM': async e => {
					let _bedelStr = value => toFileStringWithFra(value, 2);
					let {app} = sky, {mustKod, class: fisSinif} = this, {isyeri} = app.param;
					let {sahisfirmasi: sahismi, tckimlikno: tckn, vergino: vkn} = isyeri;
					let cariRec = await this.dokum_getMustRec(e) ?? {}, cariEFatmi = await this.getCariEFatmi(e);
					let vkntckn = sahismi ? tckn : vkn, {vkn: avkntckn} = cariRec;
					let senaryo = cariEFatmi ? 'TICARIFATURA' : 'EARSIVFATURA', tip = fisSinif.satismi == fisSinif.iademi ? 'IADE' : 'SATIS';
					let {seri, noYil, uuid: ettn, dvKod} = this, fisNo = this.fisNo ?? 0;
					let parabirimi = !dvKod || dvKod == 'TL' ? 'TRY' : dvKod;
					let tarih = asReverseDateString(this.tarih), no = `${seri}${noYil}${fisNo.toString().padStart(9, '0')}`;
					let icmal = this.icmal ?? {}, oran2MatrahVeKdv = icmal.oran2MatrahVeKdv ?? {};
					let brut = icmal.brut ?? 0, topDipIskonto = icmal.topDipIskonto ?? 0, topKdv = icmal.topKdv ?? 0, sonuc = icmal.sonuc ?? 0;
					let malhizmettoplam = _bedelStr(brut), vergidahil = _bedelStr(brut - topDipIskonto + topKdv), odenecek = _bedelStr(sonuc);
					let qrData = {
						vkntckn, avkntckn, senaryo, tip, tarih, no, ettn, parabirimi,
						malhizmettoplam, vergidahil, odenecek
					};
					for (let [oran, {matrah, kdv}] of Object.entries(oran2MatrahVeKdv)) {
						if (!oran) { continue }
						qrData[`kdvmatrah(${oran})`] = _bedelStr(matrah ?? 0);
						qrData[`hesaplanankdv(${oran})`] = _bedelStr(kdv ?? 0);
					}
					return toJSONStr(qrData)
				}
			};
			result['QR=EISLEM'] = result['QR=EİSLEM'] = result['QR-EİSLEM'] = result['QR=EİŞLEM'] = result['QR-EİŞLEM'] = result['QR-EISLEM'];
			return result
		}
	}
})()
