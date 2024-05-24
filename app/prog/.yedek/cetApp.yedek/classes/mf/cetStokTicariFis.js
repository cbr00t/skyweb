(function() {
	window.CETStokTicariFis = class extends window.CETFis {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				ayrimTipi: e.ayrimTipi || e.ayrimtipi || '',
				mustKod: (e.mustKod || e.mustkod || '').trimEnd(),
				mustUnvan: e.mustUnvan || e.mustunvan,
				plasiyerKod: (e.plasiyerKod || sky.app.defaultPlasiyerKod || '').trimEnd(),
				subeKod: e.subeKod == null ? e.subeKod : e.subeKod.trimEnd() /* || sky.app.defaultSubeKod */,
				yerKod: (e.yerKod || sky.app.defaultYerKod || '').trimEnd(),
				noYil: e.noYil || today().getFullYear(),
				sevkTarih: e.sevkTarih || null,
				sevkAdresKod: (e.sevkAdresKod || e.sevkadreskod || e.xadreskod || '').trimEnd()
			});
		}

		static get deepCopyAlinmayacaklar() {
			return $.merge(super.deepCopyAlinmayacaklar || [], ['_sevkAdresKodPart'])
		}

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
		static get sonStoktanSecimYapilirmi() { return false }
		static get sonStokKontrolEdilirmi() { return false }
		static get sonStokEtkilenirmi() { return false }
		get ihracatmi() { return this.ayrimTipi == 'IH' }
		get ihracKayitlimi() { return this.ayrimTipi == 'IK' }
		get numaratorTip() {
			let numaratorTip = super.numaratorTip;
			let {eIslemNumaratorTip} = this;
			if (eIslemNumaratorTip && numaratorTip && numaratorTip.endsWith(`-${eIslemNumaratorTip}`))
				eIslemNumaratorTip = '';
			return numaratorTip ? `${numaratorTip}${eIslemNumaratorTip && !this.yildizlimi ? '-' + eIslemNumaratorTip : ''}` : ``
		}
		get ayrimTipAdi() {
			return this.class.ayrimTipAdiFor({ ayrimTipi: this.ayrimTipi })
		}
		
		static ayrimTipAdiFor(e) {
			e = e || {};
			let {ayrimTipi, almSat} = e;
			almSat = almSat || this.almSat;
			let result = '';
			if (ayrimTipi && this.ayrimTipiKullanilirmi) {
				const {uygunAyrimTipleri} = this;
				if (!$.isEmptyObject(uygunAyrimTipleri)) {
					result = ayrimTipi == 'IH' && almSat == 'A'
								? 'İthalat'
								: (uygunAyrimTipleri.find(ka => ka.kod == ayrimTipi) || {}).aciklama;
					if (result)
						result = `<span style="color: ${this.renkFor({ tip: 'ayrimTipi', ayrimTipi: ayrimTipi })};">${result}</span>`;
				}
			}
			return result;
		}

		static async getYerIcinSubeKod(e) {
			e = e || {};
			const {yerKod} = e;
			let result = null;
			if (yerKod != null) {
				result = '';
				if (yerKod) {
					let sent = new MQSent({
						from: 'mst_Yer',
						sahalar: [`subeKod`]
					});
					sent.where.degerAta(yerKod, `kod`);
					
					let rec = await this.dbMgr.tekilExecuteSelect({ tx: e.tx, query: sent });
					result = (rec || {}).subeKod;
				}
			}
			
			return result;
		}
		async getYerIcinSubeKod(e) {
			let result = this.subeKod;
			if (result == null) {
				result = await this.class.getYerIcinSubeKod({ yerKod: this.yerKod });
				this.subeKod = result;
			}
			
			return result;
		}

		get hesaplanmisSonStokBilgileri() {
			const result = super.hesaplanmisSonStokBilgileri;
			const katSayi = this.class.fiiliCikismi ? -1 : 1;
			const {detaylar} = this;
			for (const det of detaylar) {
				if (det.class.promosyonmu)
					continue;
				
				const anahStr = det.getAnahtarStr({ fis: this });
				result[anahStr] = (result[anahStr] || 0) + (((det.miktar || 0) + (det.malFazlasi || 0)) * katSayi);
			}
			return result;
		}

		get hesaplanmisStokMiktarBilgileri() {
			let result = super.hesaplanmisStokMiktarBilgileri;
			const katSayi = this.class.fiiliCikismi ? -1 : 1;
			const {detaylar} = this;
			for (const det of detaylar) {
				if (det.class.promosyonmu)
					continue;
				
				const anahStr = det.shKod;
				result[anahStr] = (result[anahStr] || 0) + (((det.miktar || 0) + (det.malFazlasi || 0)) * katSayi);
			}
			return result;
		}
		

		static detaylarQueryStm(e) {
			e = e || {};
			const detayTable = e.detayTable || this.detayTable;
			const fisIDSaha = e.fisIDSaha || (e.detaySinif || this.detaySinif).fisIDSaha;
			const {id, harID} = e;
			const {fiiliCikismi, stokKdvSaha, stokKdvDegiskenmiSaha} = this;
			
			let stm = new MQStm({
				sent: new MQSent({
					from: `${detayTable} har`,
					fromIliskiler: [
						{ alias: 'har', leftJoin: 'mst_Stok stk', on: 'har.shkod = stk.kod' }
					],
					sahalar: [
						`har.rowid`, `har.promokod`, `COALESCE(stk.grupkod, '') grupkod`, `har.yerKod`,
						`har.shkod`, `stk.aciklama shadi`,
						`(case when har.xbrm == '' then stk.brm else har.xbrm end) brm`,
						`har.orjfiyat`, `har.belgefiyat`,
						(fiiliCikismi ? `stk.brmFiyat` : `(case when stk.almFiyat == 0 then stk.brmFiyat else stk.almFiyat end) brmFiyat`),
						`har.orjKdvOrani`, `har.kdvorani kdvOrani`, `har.kdvDegiskenmi`,
						`har.belgebrutbedel`, `har.belgebedel`
						/*((stokKdvSaha ? `stk.${stokKdvSaha}` : `NULL`) + ` kdvOrani`),
						((stokKdvDegiskenmiSaha ? `stk.${stokKdvDegiskenmiSaha}` : `NULL`) + ` kdvDegiskenmi`),*/
					]
				}),
				orderBy: [fisIDSaha, 'seq']
			});
			stm.sentDo(sent => {
				if (fisIDSaha)
					sent.where.degerAta(id, `har.${fisIDSaha}`);
				if (harID)
					sent.where.degerAta(harID, `har.fissayac`);
				if (!e.basitmi)
					sent.sahalar.add('har.*');
			});
			
			return stm;
		}

		hostVars(e) {
			e = e || {};
			let hv = super.hostVars();
			$.extend(hv, {
				ayrimtipi: this.ayrimTipi || '',
				noYil: this.noYil || 0,
				mustkod: this.mustKod,
				ticmustkod: this.riskCariKod || '',
				subekod: this.subeKod || sky.app.defaultSubeKod || '',
				yerkod: this.yerKod || '',
				xplasiyerkod: this.plasiyerKod || '',
				sevktarih: Utils.asReverseDateString(this.sevkTarih) || '',
				xadreskod: this.sevkAdresKod || ''
				/*efayrimtipi: this.efAyrimTipi || '',
				zorunluguidstr: this.efUUID || ''*/
			});

			return hv;
		}

		async setValues(e) {
			e = e || {};
			await super.setValues(e);

			const {rec} = e;
			$.extend(this, {
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
			});
		}

		async initBaslikUI_ara(e) {
			await super.initBaslikUI_ara(e);

			const {app} = sky;
			const {parentPart, layout} = e;
			const {param} = parentPart;
			const userSettings = param.userSettings = param.userSettings || {};
			const sonDegerler = userSettings.sonDegerler = userSettings.sonDegerler || {};
			
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
			if (!rec)
				return false;

			const {app} = sky;
			const {bakiyeRiskGosterilmezmi} = app;
			const dbMgr = this.dbMgr || app.dbMgr_mf;
			const {rowid} = rec;

			const stm = this.detaylarQueryStm({ id: rowid });
			if (!stm)
				return false;

			const {parent, grid, getDataAdapter, buildGrid} = e;
			if (!(grid && grid.length))
				return false;

			const columns = [
				{
					dataField: 'shadi', text: 'Ürün', width: 170,
					cellsRenderer: (rowIndex, columnIndex, value, rec) => {
						rec = rec.originalRecord || rec;
						const shKod = rec.shkod;
						const shAdi = rec.shadi;
						if (!shKod)
							return shAdi;
						if (!shAdi)
							return `<b>(${shKod})</b>`;
						return `<b>${shKod}</b>-${shAdi}`;
					}
				},
				{
					dataField: 'miktar', text: 'Miktar', width: 55, cellsAlign: 'right',
					cellsRenderer: (rowIndex, columnIndex, value, rec) => {
						rec = rec.originalRecord || rec;
						const {miktar} = rec;
						const brm = rec.brm || 'AD';
						const stokFra = sky.app.brm2Fra[brm] || 0;
						return `${roundToFra(miktar, stokFra)} ${brm}`;
					}
				}
			];
			if (!bakiyeRiskGosterilmezmi) {
				columns.push(...[
					{ dataField: 'belgefiyat', text: 'Fiyat', width: 80, cellsFormat: 'd4', cellsAlign: 'right' },
					{ dataField: 'belgebedel', text: 'Bedel', width: 80, cellsFormat: 'd2', cellsAlign: 'right' }
				]);
			}
			
			$.extend(e, {
				columns: columns,
				listeArgsDuzenle: e => {
				},
				loadServerData: async _e =>
					await dbMgr.executeSqlReturnRows({ query: stm })
			});
			buildGrid.call(this, e);
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
			e = e || {};
			let result = await this.onKontrol_detaylar(e);
			if (!result || result.isError)
				return result;
			
			if (this.class.musteriKullanilirmi) {
				if (!this.mustKod)
					return this.error_onKontrol(`<b>Müşteri</b> belirtilmelidir`, 'emptyValue');
				result = await MQCogul.getCariEkBilgi({ mustKod: this.mustKod })
				if (!result)
					return this.error_onKontrol(`<b>(${this.mustKod})</b> kodlu <u>Müşteri</u> hatalıdır.<p/><p class="gray">** Ekranda <u>Müşteri</u> kutusu <b>boş gözüküyor ise</b>, üzerine tıklayıp ENTER tuşuna basarak değeri silebilirsiniz</p>`, 'invalidValue');
			}

			let kod = this.plasiyerKod;
			if (kod) {
				result = sky.app.caches.plasiyerKod2Rec[kod];
				if (result == null) {
					result = parseInt(await this.dbMgr.tekilDegerExecuteSelect({
						tx: e.tx,
						query: `SELECT COUNT(*) sayi FROM mst_Plasiyer WHERE kod = ?`,
						params: [kod]
					}))
				}
				if (!result)
					return this.error_onKontrol(`<b>(${kod})</b> kodlu <u>Plasiyer</u> hatalıdır.<p/><p class="gray">** Ekranda <u>Plasiyer</u> kutusu <b>boş gözüküyor ise</b>, üzerine tıklayıp ENTER tuşuna basarak değeri silebilirsiniz</p>`, 'invalidValue');
			}

			kod = this.yerKod;
			if (kod) {
				result = sky.app.caches.yerKod2Rec[kod];
				if (result == null) {
					result = parseInt(await this.dbMgr.tekilDegerExecuteSelect({
						tx: e.tx,
						query: `SELECT COUNT(*) sayi FROM mst_Yer WHERE kod = ?`,
						params: [kod]
					}))
				}
				if (!result)
					return this.error_onKontrol(`<b>(${kod})</b> kodlu <u>Depo</u> hatalıdır.<p/><p class="gray">** Ekranda <u>Yer kodu</u> kutusu <b>boş gözüküyor ise</b>, üzerine tıklayıp ENTER tuşuna basarak değeri silebilirsiniz</p>`, 'invalidValue');
			}
			
			return await super.onKontrol(e);
		}

		async onKontrol_detaylar(e) {
			e = e || {};
			const {dbMgr, detaylar} = this;
			if ($.isEmptyObject(detaylar))
				return { isError: true, rc: `emptyRecords`, errorText: `Belge içeriği girilmelidir` };
			
			const tip2KontrolYapi = {
				stok: {
					aciklama: 'Stok', table: 'mst_Stok', idSaha: 'kod',
					receiver: e => e.detay,
					getter: e => e.receiver.shKod
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
			
			let uni = new MQUnionAll();
			let stm = new MQStm({ sent: uni });
			const tip2Values = {};
			for (const i in detaylar) {
				const det = detaylar[i];
				$.each(tip2KontrolYapi, (tip, kontrolYapi) => {
					let _e = { tip: tip, kontrolYapi: kontrolYapi, detay: det, tip2EkOzellik: det.ekOzelliklerYapi.tip2EkOzellik };
					let receiver = kontrolYapi.receiver || det;
					if ($.isFunction(receiver))
						receiver = _e.receiver = receiver.call(this, _e);
					
					let value = kontrolYapi.getter
									? kontrolYapi.getter.call(this, _e)
									: (kontrolYapi.detAttr ? receiver[kontrolYapi.detAttr] : null);
					if ($.isFunction(value))
						value = value.call(this, _e);
					if (value) {
						const values = tip2Values[tip] = (tip2Values[tip] || {});		// set olarak dursun
						values[value] = true;
						// values.push(value);
					}
				})
			}

			for (const tip in tip2KontrolYapi) {
				const kontrolYapi = tip2KontrolYapi[tip];
				const {idSaha} = kontrolYapi;
				const values = tip2Values[tip];
				if (!$.isEmptyObject(values)) {
					let sent = new MQSent({
						from: kontrolYapi.table,
						where: [{ inDizi: values, saha: idSaha }],
						sahalar: [`'${tip}' tip`, `${idSaha} value`],
						distinct: true
					});
					uni.add(sent);
				}
			}
			
			if (!$.isEmptyObject(uni.liste)) {
				let rs = await dbMgr.executeSql({ tx: e.tx, query: stm });
				for (let i = 0; i < rs.rows.length; i++) {
					const rec = rs.rows[i];
					const {tip, value} = rec;
					const mevcutDegerler = tip2Values[tip] || {};
					delete mevcutDegerler[value];
				}

				let errorList = [];
				for (const tip in tip2Values) {
					const eksikDegerlerSet = tip2Values[tip];
					if (!$.isEmptyObject(eksikDegerlerSet)) {
						const kontrolYapi = tip2KontrolYapi[tip];
						const birlesikKodStr = Object.keys(eksikDegerlerSet).join(' | ');
						errorList.push(`- Bazı <b>${kontrolYapi.aciklama}</b> kodları hatalıdır: [<b>${birlesikKodStr}</b>]`);
					}
				}

				if (!$.isEmptyObject(errorList))
					return { isError: true, rc: 'invalidId', errorText: errorList.join(`<br/>${CrLf}`) };
			}
			
			return { isError: false };
		}

		async kaydetOncesiKontrol_ara(e) {
			await super.kaydetOncesiKontrol_ara(e);

			let promise = this.getYerIcinSubeKod(e);
			await this.miktarKontrol(e);

			await promise;
			if (this.class.sonStokKontrolEdilirmi)
				await this.sonStokKontrol(e);
		}

		async sonStokKontrol(e) {
			e = e || {};
			const {detaylar, dbMgr} = this;
			if ($.isEmptyObject(detaylar))
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
			
			let sent = new MQSent({
				from: `mst_SonStok son`,
				fromIliskiler: [
					{ from: `mst_Stok stk`, iliski: `son.stokKod = stk.kod` }
				],
				where: { degerAta: this.yerKod || '', saha: `son.yerKod` }
			});
			let stm = new MQStm({ sent: sent });

			const ilkDetay = detaylar[0];
			const detaySinif = ilkDetay.class;
			const ekOzelliklerTumIDSahalar = this.class.detaySinif.ekOzelliklerTumIDSahalar
												.filter(idSaha => idSaha != 'refRafKod');
			for (const i in ekOzelliklerTumIDSahalar) {
				const idSaha = ekOzelliklerTumIDSahalar[i];
				sent.sahalar.add(`son.${idSaha}`);
			}
			sent.sahalar
				.addAll([`stk.aciklama stokAdi`, `stk.brm`, `son.miktar`]);

			const {ekOzelliklerIDSahalar} = detaySinif;
			const anahtarStrSet = {};
			const anahtarStr2EkBilgi = {};
			const or = new MQOrClause();
			for (const i in detaylar) {
				const det = detaylar[i];
				const anahtarStr = det.getAnahtarStr({ fis: this });
				if (!anahtarStrSet[anahtarStr]) {
					anahtarStrSet[anahtarStr] = true;
					anahtarStr2EkBilgi[anahtarStr] = { stokAdi: det.shAdi, brm: det.brm };
					
					const keyHV = det.getEkOzelliklerKeyHostVars({ fis: this });
					or.add(new MQSubWhereClause({ alias: 'son', birlestirDict: keyHV }));
				}
			}
			sent.where.add(or);

			const {anahtarDelim} = CETEkOzellikler;
			const yetersizAnahtarStrVeMiktarStrListe = [];
			let rs = await dbMgr.executeSql({ tx: e.tx, query: stm })
			for (let i = 0; i < rs.rows.length; i++) {
				const rec = rs.rows[i];
				const anahtarStr = ekOzelliklerTumIDSahalar.map(idSaha => rec[idSaha] || '').join(anahtarDelim);
				if (!anahtarStrSet[anahtarStr])								// detaylarda olmayan bir anahtarStr gelirse (... yanlış sent where için önlem ...)
					return true;											// 		continue loop
				
				let miktar = asFloat(rec.miktar);
				// let artis = (islem == 'degistir') ? 0 : miktar;
				let artis = miktar;
				if (islem == 'sil')
					artis = -artis;
				anahtarStr2SonStok[anahtarStr] = (anahtarStr2SonStok[anahtarStr] || 0) + artis;
				anahtarStr2EkBilgi[anahtarStr] = { stokAdi: rec.stokAdi, brm: rec.brm };
			}

			for (const anahtarStr in anahtarStr2SonStok) {
				const sonStok = anahtarStr2SonStok[anahtarStr];
				if (sonStok < 0) {
					let basitAnahtarListe = [];
					anahtarStr.split(anahtarDelim).forEach(value => {
						if (value)
							basitAnahtarListe.push(value);
					});
					const ekBilgi = anahtarStr2EkBilgi[anahtarStr] || {};
					if (!$.isEmptyObject(basitAnahtarListe)) {
						basitAnahtarListe[0] = `<span class="bold">${basitAnahtarListe[0]}</span>`;
						const basitAnahtarText = basitAnahtarListe.join(' | ');
						yetersizAnahtarStrVeMiktarStrListe.push(
							`<li class="darkgray" style="margin-top: 4px; margin-bottom: 8px;">` +
								`<div class="flex-row">` +
									`<div style="min-width: 150px;">${basitAnahtarText}</div>`+
									`: <span class="bold darkred">${sonStok.toLocaleString(8)} ${ekBilgi.brm || 'AD'}</span>` +
								`</div>` +
								(ekBilgi.stokAdi ? `<div class="italic gray" style="font-size: 85%; padding-left: 13px;">${ekBilgi.stokAdi}</div>` : ``) +
							`</li>`
						);
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

			const {detaySinif} = this.class;
			const {anahtarDelim} = CETEkOzellikler;
			const ekOzelliklerTumIDSahalar = detaySinif.ekOzelliklerTumIDSahalar
													.filter(idSaha => idSaha != 'refRafKod');
			const tumKeyHVListe = [];
			const anahtarStr2HV = {};
			for (const anah in sonStokBilgileri) {
				const topMiktar = sonStokBilgileri[anah];
				if (topMiktar) {
					const keyHV = CETEkOzellikler.keyHostVarsFrom({
						with: ekOzelliklerTumIDSahalar,
						anahtarStr: anah
					});
					tumKeyHVListe.push(keyHV);

					const tumAnahtarStr = Object.values(keyHV).join(anahtarDelim);
					anahtarStr2HV[tumAnahtarStr] = $.extend({}, keyHV, {
						orjMiktar: 0,
						miktar: topMiktar
					});
				}
			}

			if (!$.isEmptyObject(tumKeyHVListe)) {
				const {dbMgr} = this;
				const hasInitialTransaction = !!e.tx;
				let tx = hasInitialTransaction ? e.tx : await dbMgr.transaction();
				
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

						let rs = await dbMgr.executeSql({ tx: tx, query: stm });
						for (let i = 0; i < rs.rows.length; i++) {
							const rec = rs.rows[i];
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
								table: table, mode: `replace`,
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
			const {detaylar} = this;
			for (let i in detaylar) {
				i = asInteger(i);
				const det = detaylar[i];
				const miktar = det.miktar || 0;
				if (miktar < 0) {
					const seq = i + 1;
					throw {
						isError: true,
						rc: 'detayMiktarNegatif',
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
			for (const i in detaylar) {
				const det = detaylar[i];
				det.detYerKodReset();
			}
		}

		async getDokumDetaylar(e) {
			const detaylar = await super.getDokumDetaylar(e) || [];
			return detaylar.filter(det => !!det.miktar);
		}

		async getDokumDegeriDict(e) {
			const bilgiFisiYazi = e =>
				'BİLGİ FİŞİDİR';
			const eBelgeBilgiFisiYazi = e =>
				this.eBelgemi ? `e-Belge BİLGİ FİŞİDİR` : '';
			
			return $.extend(await super.getDokumDegeriDict(e) || {}, {
				async efaturaKullanirmi(e) {
					return sky.app.eIslemKullanilirmi && this.class.eIslemKullanilirmi && await this.getCariEFatmi(e)
				},
				efAyrimTipi: this.eIslemTipi,
				efBelgeTipi(e) {
					return sky.app.eIslemTip2UzunAdi(this.eIslemTip)
				},
				efFaturaTipi(e) {
					return this.class.satismi == this.class.iademi ? 'IADE' : 'SATIS'
				},
				efUUID: this.uuid,
				guidStr: this.uuid,
				efatNoStr(e) {
					return `${this.seri}${this.noYil}${(this.fisNo || 0).toString().padStart(9, '0')}`
				},
				bilgiFisiYazi: e =>
					bilgiFisiYazi(e),
				bilgiFisiYaziKucuk: e => {
					let result = bilgiFisiYazi();
					if (result)
						result = `<SMALL>${result}<NORMAL>`;
					return result;
				},
				bilgiFisiYaziKoyu: e => {
					let result = bilgiFisiYazi();
					if (result)
						result = `<BOLD>${result}<NORMAL>`;
					return result;
				},
				bilgiFisiYaziBuyuk: e => {
					let result = bilgiFisiYazi();
					if (result)
						result = `<BIG>${result}<NORMAL>`;
					return result;
				},
				eBelgeBilgiFisiYazi: e =>
					eBelgeBilgiFisiYazi(e),
				eBelgeBilgiFisiYaziKucuk: e => {
					let result = eBelgeBilgiFisiYazi();
					if (result)
						result = `<SMALL>${result}<NORMAL>`;
					return result;
				},
				eBelgeBilgiFisiYaziKoyu: e => {
					let result = eBelgeBilgiFisiYazi();
					if (result)
						result = `<BOLD>${result}<NORMAL>`;
					return result;
				},
				eBelgeBilgiFisiYaziBuyuk: e => {
					let result = eBelgeBilgiFisiYazi();
					if (result)
						result = `<BIG>${result}<NORMAL>`;
					return result;
				},
				async efSenaryoTipi(e) {
					const cariEFatmi = await this.getCariEFatmi(e);
					return cariEFatmi ? 'TICARIFATURA' : 'EARSIVFATURA'
				},
				Yalniz(e) {
					const {sonucBedel} = this;
					return sonucBedel ? `#${Utils.yalnizYazisi(this.sonucBedel)}#` : ''
				}
			})
		}
	}
})()
