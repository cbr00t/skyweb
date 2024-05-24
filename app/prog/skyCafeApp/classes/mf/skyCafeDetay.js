(function() {
	window.SkyCafeDetay = class extends window.MQDetay {
		constructor(e) {
			e = e || {};
			super(e);

			const _now = now();
			const {app} = sky;
			const anaTip = e.tip == null ? app.aktifMasaAnaTip : (e.tip || SkyCafeMasaTip.Adisyon);
			
			const {urun} = e;
			$.extend(this, {
				_urun: urun,
				isParseResult: asBool(e.isParseResult),
				barkodParser: e.barkodParser || e.parser || null,
				id: e.id || null,
				orjID: e.orjID || null,
				vioID: e.vioID || e.uzakID || null,
				kayitZamani: Utils.asReverseDateTimeString(e.kayitZamani || e.kayitzamani || _now),
				erisimZamani: Utils.asReverseDateTimeString(e.erisimZamani || e.erisimzamani || _now),
				gonderildimi: asBool(e.gonderildimi || e.gonderildi),
				silindimi: asBool(e.silindimi || e.silindi),
				yazdirildimi: asBool(e.yazdirildimi || e.yazdirildi),
				ikrammi: asBool(e.ikrammi || e.ikram),
				barkod: (e.barkod == null ? (urun ? urun.barkod : null) : (e.barkod || null)) || '',
				stokKod: e.stokKod == null ? (urun ? urun.kod || urun.id : null) : (e.stokKod || null),
				stokAdi: e.stokAdi == null ? (urun ? urun.aciklama : null) : (e.stokAdi || null),
				miktar: asFloat(e.miktar) || 0,
				brm: e.brm == null ? (urun ? urun.brm : null) : e.brm,
				fiyat: asBool(e.degiskenFiyatmi) ? 0 : ((e.fiyat || e.kdvliFiyat) == null ? (urun ? urun.fiyatFor({ tip: anaTip }) : null) : (asFloat(e.fiyat || e.kdvliFiyat) || 0)),
				brutBedel: (e.brutBedel || e.kdvliBedel) == null ? null : (asFloat(e.brutBedel || e.kdvliBedel) || 0),
				kdvOrani: e.kdvOrani == null ? (urun ? urun.kdvOrani : null) : (asInteger(e.kdvOrani) || 0),
				iskOrani: asFloat(e.iskOrani) || 0,
				netBedel: e.netBedel == null ? null : (asFloat(e.netBedel) || 0),
				ozellikIDSet: e.ozellikIDSet || {},
				ekNot: e.ekNot || '',
				iptalAciklama: e.iptalAciklama || ''
			});
			if (!this.id && e.detGuid) {
				let id = e.detGuid || '';
				id = id.guidStr || id;
				if (id)
					this.id = id.toLowerCase();
			}
			if (!this.id)
				this.id = newGUID();
			
			if (this.stokKod || this._urun)
				this.detayEkIslemler(e);
		}
		
		static get table() { return 'data_RestoranDetay' }
		static get idSaha() { return 'rowid' }
		static get fisIDSaha() { return 'fisID' }
		static get idStringmi() { return true }

		hostVars() {
			const _now = now();
			const {ozellikIDSet} = this;
			const hv = super.hostVars() || {};
			$.extend(hv, {
				id: this.id,
				vioID: this.vioID || null,
				kayitzamani: Utils.asReverseDateTimeString(this.kayitZamani || _now),
				erisimzamani: Utils.asReverseDateTimeString(_now),
				gonderildi: bool2FileStr(this.gonderildimi),
				silindi: bool2FileStr(this.silindimi),
				yazdirildi: bool2FileStr(this.yazdirildimi),
				ikrammi: bool2FileStr(this.ikrammi),
				barkod: this.barkod || '',
				stokKod: this.stokKod,
				miktar: asFloat(this.miktar) || 0,
				brm: this.brm || '',
				fiyat: asFloat(this.fiyat) || 0,
				brutBedel: asFloat(this.brutBedel) || 0,
				kdvOrani: asInteger(this.kdvOrani) || 0,
				iskOrani: asFloat(this.iskOrani) || 0,
				netBedel: asFloat(this.netBedel) || 0,
				ozellikIDListe: $.isEmptyObject(ozellikIDSet) ? '' : Object.keys(ozellikIDSet).join('|'),
				ekNot: this.ekNot || '',
				iptalAciklama: this.iptalAciklama || ''
			});
			
			return hv;
		}
		
		async setValues(e) {
			e = e || {};
			await super.setValues(e);
			
			const {rec} = e;
			const ozellikIDListeStr = (rec.ozellikIDListe || '');
			const ozellikIDSet = ozellikIDListeStr ? asSet(ozellikIDListeStr.split('|').filter(x => !!x)) : {};
			$.extend(this, {
				id: rec.id,
				vioID: rec.vioID || null,
				gonderildimi: asBool(rec.gonderildi),
				silindimi: asBool(rec.silindi),
				yazdirildimi: asBool(rec.yazdirildi),
				ikrammi: asBool(rec.ikrammi),
				barkod: rec.barkod || '',
				stokKod: rec.stokKod,
				stokAdi: rec.stokAdi,
				miktar: asFloat(rec.miktar) || 0,
				brm: rec.brm,
				fiyat: asFloat(rec.fiyat) || 0,
				brutBedel: asFloat(rec.brutBedel) || 0,
				kdvOrani: asInteger(rec.kdvOrani) || 0,
				iskOrani: asFloat(rec.iskOrani) || 0,
				netBedel: asFloat(rec.netBedel) || 0,
				ozellikIDSet: ozellikIDSet,
				ekNot: rec.ekNot || '',
				iptalAciklama: rec.iptalAciklama || ''
			});
		}

		async detayEkIslemler(e) {
			if (this.promise_detayEkIslemler) {
				try { return await this.promise_detayEkIslemler }
				finally { delete this.promise_detayEkIslemler }
			}

			const promise = this.promise_detayEkIslemler = new $.Deferred(async d => {
				if (this.stokAdi == null || this.brm == null || this.kdvOrani == null || this.fiyat == null)
					await this.ekBilgileriBelirle(e);
				await this.brutBedelHesapla(e);
				await this.netBedelHesapla(e);

				d.resolve(this);
				delete this.promise_detayEkIslemler;
			});
			
			return await promise;
		}

		async ekBilgileriBelirle(e) {
			e = e || {};
			const {app} = sky;
			const dbMgr = app.dbMgr_mf;
			const {id2Urun} = app;
			const {stokKod} = this;
			const {tip} = e;

			let urun = this._urun;
			if (urun === undefined) {
				urun = id2Urun[stokKod];
				if (urun === undefined) {
					const stm = new MQStm({
						sent: new MQSent({
							from: `mst_Stok mst`,
							where: [ { degerAta: this.stokKod, saha: `mst.kod` } ],
							sahalar: [ `mst.rowid`, `mst.*` ]
						})
					});
					const rec = await dbMgr.tekilExecuteSelect({ query: stm });
					urun = id2Urun[stokKod] = rec ? new SkyCafeUrun() : null;
					if (urun)
						await urun.setValues({ rec: rec });
				}
				this._urun = urun;
			}

			if (!urun)
				return null;
			
			if (this.stokAdi == null)
				this.stokAdi = urun.aciklama;
			if (this.brm == null)
				this.brm = urun.brm;
			if (this.fiyat == null)
				this.fiyat = urun.fiyatFor(tip);
			if (this.kdvOrani == null)
				this.kdvOrani = urun.kdvOrani;
			
			return urun;
		}

		async brutBedelHesapla(e) {
			if (this.fiyat == null)
				await this.ekBilgileriBelirle(e);
			
			let {fiyat} = this;
			const {ozellikler, iskOrani} = this;
			for (const i in ozellikler) {
				const {ekFiyat} = ozellikler[i];
				if (ekFiyat)
					fiyat += ekFiyat;
			}

			const {ikrammi} = this;
			if (ikrammi)
				this.iskOrani = 100;
			let brutBedel = this.brutBedel = bedel(this.miktar * fiyat);
			return brutBedel;
		}

		async netBedelHesapla(e) {
			let {brutBedel} = this;
			if (brutBedel == null)
				brutBedel = await this.brutBedelHesapla(e);
			
			let netBedel = brutBedel;
			const {iskOrani} = this;
			if (netBedel && iskOrani)
				netBedel = bedel(netBedel - (netBedel * (iskOrani || 0) / 100));

			return this.netBedel = netBedel;

			// let netBedel = brutBedel + bedel(brutBedel * this.kdvOrani / 100);
			// return this.netBedel = netBedel;
		}

		get ozellikler() {
			const {id2UrunOzellik} = sky.app;
			const idListe = Object.keys(this.ozellikIDSet || {});
			return idListe.map(id => id2UrunOzellik[id]).filter(id => !!id);
		}

		asGridRecs(e) {
			return [
				this
			]
		}

		/*get gridCellHTML() {
			return (
				`<div class="stokAdi">${this.stokAdi}</div>` +
				`<div class="miktar float-left">${this.miktar.toLocaleString()}</div>` +
				`<div class="_etiket float-left" style="padding: 0 5px;"> x </div>` +
				`<div class="fiyat float-left">${roundToFra(this.fiyat, sky.app.fiyatFra).toLocaleString()}</div>` +
				`<div class="_etiket float-left" style="padding-left: 4px;">TL</div>` +
				`<div class="_etiket float-right" style="padding-left: 4px;">TL</div>` +
				`<div class="netBedel bedel float-right">${bedelStr(bedel(this.netBedel))}</div>`
			)
		}*/

		itemDuzenle(e) {
			const {app} = sky;
			const {activePart} = app;
			const {rec, divItem} = e;
			const {yazdirildimi, gonderildimi, ikrammi} = rec;
			const brm = rec.brm || 'AD';
			const fra = app.brm2Fra[brm] || 0;
			divItem.find(`.stokAdi`).html(rec.stokAdi || '');
			// divItem.find(`.miktar`).html(numberToString(rec.miktar || 0));
			const txtMiktar = divItem.find(`.miktar`);
			txtMiktar.val(numberToString(rec.miktar || 0));
			const divIkramTextParent = divItem.find(`.ikramTextParent`);
			divIkramTextParent[ikrammi ? 'removeClass' : 'addClass'](`jqx-hidden`);
			rec.miktarIcinItemDuzenle(e);
			
			let duzenlenebilirmi = (!app.class.pratikSatismi && yazdirildimi /*&& gonderildimi*/ ? app.sefmi : true) && app.zAcikmi;
			if (duzenlenebilirmi) {
				const {aktifFis} = activePart;
				if (aktifFis && aktifFis.yazdirildimi && app.garsonmu)
					duzenlenebilirmi = false;
			}
			if (duzenlenebilirmi) {
				divItem.on('click', evt => {
					setTimeout(() => {
						if (document.activeElement == txtMiktar[0]/* || divItem.hasClass(`selected`)*/) {
							app.miktarDuzenleniyorFlag = true;
							app.clearUniqueTimeout({ key: 'miktarDuzenleniyorFlag_reset' });
							let handler = evt => {
								let value = Math.min(roundToFra(asFloat(txtMiktar.val()).toString().replace(',', '.') || '0', fra) || 0, 999);
								const lastValue = rec.miktar;
								if (!value || value < 0) {
									value = 1;
									txtMiktar.val(value);
								}
								rec.miktar = value;
								txtMiktar.val(value || '');
								if (value == lastValue)
									return;
								(async () => {
									await rec.brutBedelHesapla(e);
									await rec.netBedelHesapla(e);
									rec.miktarIcinItemDuzenle(e);

									const {activePart} = app;
									if (activePart) {
										if (activePart.fisDegisti)
											activePart.fisDegisti();
										if (activePart.detayDegisti)
											activePart.detayDegisti({ detay: rec });
									}
								})();
							};
							setTimeout(() => {
								if (!txtMiktar.hasClass(`jqx-input`)) {
									// txtMiktar.jqxInput({ theme: theme, maxLength: 8 });
									txtMiktar.on('change', evt =>
										handler(evt));
									txtMiktar.on('blur', evt => {
										app.setUniqueTimeout({
											key: 'miktarDuzenleniyorFlag_reset',
											delayMS: 2000,
											block: () =>
												app.miktarDuzenleniyorFlag = false
										});
										handler(evt);
									});
									txtMiktar.on('focus', evt =>
										evt.target.select());
									txtMiktar.focus();
								}
							}, 1);
						}
					}, 10);
				});
			}
			else {
				divItem.addClass(`disabled`);
				txtMiktar.prop('disabled', true);

				const btnSil = divItem.find(`button#btnSil`);
				if (btnSil.length) {
					// btnSil.css('opacity', .3);
					btnSil.addClass(`basic-hidden`);
					setButonEnabled(btnSil, false);
				}
			}
			
			const {ozellikler, ekNot} = rec;
			if (!$.isEmptyObject(ozellikler)) {
				const templateItemOzellik = sky.app.templatesOrtak.contents(`.item-ozellik`);
				const parent = divItem.find(`.ozellikler`);
				for (const i in ozellikler) {
					const _rec = ozellikler[i];
					const {ekFiyat} = _rec;
					const divSubItem = templateItemOzellik.clone(true);
					divSubItem.find(`.aciklama`).html(_rec.aciklama);
					if (ekFiyat) {
						divSubItem.find(`.ekFiyatParent .ekFiyat`).html(numberToString(ekFiyat || 0));
						divSubItem.find(`.ekFiyatParent`).removeClass(`jqx-hidden`);
					}
					divSubItem.appendTo(parent);
				}
				parent.removeClass(`jqx-hidden`);
			}
			if (ekNot) {
				const elm = divItem.find(`.ekNot`);
				elm.html(ekNot);
				elm.removeClass(`jqx-hidden`);
			}
			
			if (yazdirildimi /*&& gonderildimi*/)
				divItem.addClass(`yazdirildi`);
			
			if (ikrammi)
				divItem.addClass(`ikram`);
		}

		miktarIcinItemDuzenle(e) {
			const {rec, divItem} = e;
			const {iskOrani, ikrammi} = rec;
			const divFiyatParent = divItem.find(`.fiyatParent`);
			if (ikrammi || !rec.fiyat || rec.fiyat == rec.netBedel) {
				divFiyatParent.addClass(`jqx-hidden`);
			}
			else {
				divFiyatParent.find(`.fiyat`).html(numberToString(rec.fiyat || 0));
				divFiyatParent.removeClass(`jqx-hidden`);
			}
			const divIskOranParent = divItem.find(`.iskOranParent`);
			if (ikrammi || !iskOrani) {
				divIskOranParent.addClass(`jqx-hidden`);
			}
			else {
				divIskOranParent.find(`.iskOran`).html(numberToString(rec.iskOrani || 0));
				divIskOranParent.removeClass(`jqx-hidden`);
			}
			divItem.find(`.netBedel`).html(bedelStr(rec.netBedel || 0));
		}

		aynimi(e) {
			const diger = typeof e == 'object' ? e.diger : e;
			let aynimi = false;
			if (diger) {
				aynimi = (
					(this.silindimi == diger.silindimi) &&
					(asBool(this.ikrammi) == asBool(diger.ikrammi)) &&
					((this.barkod || '') == (diger.barkod || '')) &&
					(this.stokKod == diger.stokKod) &&
					((this.fiyat || 0) == (diger.fiyat || 0)) && 
					((this.iskOrani || 0) == (diger.iskOrani || 0)) && 
					((this.brm || '') == (diger.brm || '')) && 
					((this.ekNot || '') == (diger.ekNot || ''))
				);
				if (aynimi) {
					const ozellikIDSetYapi = {
						bu: this.ozellikIDSet || {},
						diger: diger.ozellikIDSet || {}
					};
					aynimi = Object.keys(ozellikIDSetYapi.bu).length == Object.keys(ozellikIDSetYapi.diger).length;
					if (aynimi) {
						for (const id in ozellikIDSetYapi.bu) {
							if (!ozellikIDSetYapi.diger[id]) {
								aynimi = false;
								break;
							}
						}
					}
				}
			}
			return aynimi;
		}

		reduce(e) {
			return {
				isParseResult: asBool(this.isParseResult),
				id: this.id,
				orjID: this.orjID || null,
				vioID: this.vioID || null,
				ikrammi: this.ikrammi,
				barkod: this.barkod,
				stokKod: this.stokKod,
				miktar: this.miktar,
				brm: this.brm,
				fiyat: this.fiyat,
				brutBedel: this.brutBedel,
				kdvOrani: this.kdvOrani,
				iskOrani: this.iskOrani,
				netBedel: this.netBedel,
				ozellikIDListe: Object.keys(this.ozellikIDSet || {}),
				ozellikler: (this.ozellikler || []).map(rec => { return { id: rec.id, ekFiyat: rec.ekFiyat } }),
				ekNot: this.ekNot || '',
				iptalAciklama: this.iptalAciklama || ''
			}
		}
	}
})()
