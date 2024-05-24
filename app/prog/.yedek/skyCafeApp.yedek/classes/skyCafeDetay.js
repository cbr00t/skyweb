(function() {
	window.SkyCafeDetay = class extends window.MQDetay {
		constructor(e) {
			e = e || {};
			super(e);

			const _now = now();
			const {app} = sky;
			const anaTip = e.tip == null
				? app.pratikSatismi ? SkyCafeMasaTip.PratikSatis : (app.id2Masa[app.aktifMasaID] || {}).anaTip
				: (e.tip || SkyCafeMasaTip.Adisyon);
			
			const {urun} = e;
			$.extend(this, {
				_urun: urun,
				id: e.id || e.vioID || newGUID(),
				kayitZamani: Utils.asReverseDateTimeString(e.kayitZamani || e.kayitzamani || _now),
				erisimZamani: Utils.asReverseDateTimeString(e.erisimZamani || e.erisimzamani || _now),
				gonderildimi: asBool(e.gonderildimi || e.gonderildi),
				silindimi: asBool(e.silindimi || e.silindi),
				yazdirildimi: asBool(e.yazdirildimi || e.yazdirildi),
				barkod: (e.barkod == null ? (urun ? urun.barkod : null) : e.barkod) || '',
				stokKod: e.stokKod == null ? (urun ? urun.kod || urun.id : null) : e.stokKod,
				stokAdi: e.stokAdi == null ? (urun ? urun.aciklama : null) : e.stokAdi,
				miktar: asFloat(e.miktar) || 0,
				brm: e.brm == null ? (urun ? urun.brm : null) : null,
				fiyat: e.fiyat == null ? (urun ? urun.fiyatFor({ tip: anaTip }) : null) : (asFloat(e.fiyat) || 0),
				brutBedel: e.brutBedel == null ? null : (asFloat(e.brutBedel) || 0),
				kdvOrani: e.kdvOrani == null ? (urun ? urun.kdvOrani : null) : (asInteger(e.kdvOrani) || 0),
				iskOrani: asFloat(e.iskOrani) || 0,
				netBedel: e.netBedel == null ? null : (asFloat(e.netBedel) || 0),
				ozellikIDSet: e.ozellikIDSet || {},
				ekNot: e.ekNot || ''
			});
			this.detayEkIslemler(e);
		}
		
		static get table() { return 'data_RestoranDetay' }
		static get idSaha() { return 'rowid' }
		get detaymi() { return true }

		hostVars() {
			const _now = now();
			const {ozellikIDSet} = this;
			const hv = super.hostVars() || {};
			$.extend(hv, {
				id: this.id,
				kayitzamani: Utils.asReverseDateTimeString(this.kayitZamani || _now),
				erisimzamani: Utils.asReverseDateTimeString(_now),
				gonderildi: bool2FileStr(this.gonderildimi),
				silindi: bool2FileStr(this.silindimi),
				yazdirildi: bool2FileStr(this.yazdirildimi),
				barkod: this.barkod || '',
				stokKod: this.stokKod,
				miktar: asFloat(this.miktar) || 0,
				brm: this.brm,
				fiyat: asFloat(this.fiyat) || 0,
				brutBedel: asFloat(this.brutBedel) || 0,
				kdvOrani: asInteger(this.kdvOrani) || 0,
				iskOrani: asFloat(this.iskOrani) || 0,
				netBedel: asFloat(this.netBedel) || 0,
				ozellikIDListe: $.isEmptyObject(ozellikIDSet) ? '' : Object.keys(ozellikIDSet).join('|'),
				ekNot: this.ekNot || ''
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
				gonderildimi: asBool(rec.gonderildi),
				silindimi: asBool(rec.silindi),
				yazdirildimi: asBool(rec.yazdirildi),
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
				ekNot: rec.ekNot || ''
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
					const rec = dbMgr.tekilExecuteSelect({ query: stm });
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

			let brutBedel = this.brutBedel = bedel(this.miktar * fiyat);
			return brutBedel;
		}

		async netBedelHesapla(e) {
			let {brutBedel} = this;
			if (brutBedel == null)
				brutBedel = await this.brutBedelHesapla(e);
			
			let netBedel = brutBedel;
			const {iskOrani} = this;
			if (iskOrani)
				netBedel = bedel(netBedel - (netBedel * (iskOrani || 0) / 100));

			return this.netBedel = netBedel;

			// let netBedel = brutBedel + bedel(brutBedel * this.kdvOrani / 100);
			// return this.netBedel = netBedel;
		}

		get ozellikler() {
			const {id2UrunOzellik} = sky.app;
			const idListe = Object.keys(this.ozellikIDSet || {});
			return idListe.map(id => id2UrunOzellik[id]);
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
				`<div class="fiyat float-left">${roundToFra(this.fiyat, 4).toLocaleString()}</div>` +
				`<div class="_etiket float-left" style="padding-left: 4px;">TL</div>` +
				`<div class="_etiket float-right" style="padding-left: 4px;">TL</div>` +
				`<div class="netBedel bedel float-right">${bedelStr(bedel(this.netBedel))}</div>`
			)
		}*/

		itemDuzenle(e) {
			const {rec, divItem} = e;
			divItem.find(`.stokAdi`).html(rec.stokAdi || '');
			// divItem.find(`.miktar`).html(numberToString(rec.miktar || 0));
			const txtMiktar = divItem.find(`.miktar`);
			txtMiktar.val(numberToString(rec.miktar || 0));
			rec.miktarIcinItemDuzenle(e);
			
			divItem.on('click', evt => {
				setTimeout(() => {
					if (document.activeElement == txtMiktar[0]/* || divItem.hasClass(`selected`)*/) {
						let handler = evt => {
							let value = roundToFra(asFloat(txtMiktar.val()).toString() || '0', 3) || 0;
							const lastValue = rec.miktar;
							rec.miktar = value && value > 0 ? value : 1;
							txtMiktar.val(value || '');
							if (value == lastValue)
								return;
							(async () => {
								await rec.brutBedelHesapla(e);
								await rec.netBedelHesapla(e);
								rec.miktarIcinItemDuzenle(e);
							})();
						};
						setTimeout(() => {
							if (!txtMiktar.hasClass(`jqx-input`)) {
								// txtMiktar.jqxInput({ theme: theme, maxLength: 8 });
								txtMiktar.on('change', handler);
								txtMiktar.on('blur', handler);
								txtMiktar.on('focus', evt => evt.target.select());
								txtMiktar.focus();
							}
						}, 1);
					}
				}, 10);
			});
			
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
		}

		miktarIcinItemDuzenle(e) {
			const {rec, divItem} = e;
			const divFiyatParent = divItem.find(`.fiyatParent`);
			if (!rec.fiyat || rec.fiyat == rec.netBedel) {
				divFiyatParent.addClass(`jqx-hidden`);
			}
			else {
				divFiyatParent.find(`.fiyat`).html(numberToString(rec.fiyat || 0));
				divFiyatParent.removeClass(`jqx-hidden`);
			}
			divItem.find(`.netBedel`).html(bedelStr(rec.netBedel || 0));
		}

		aynimi(e) {
			const diger = typeof e == 'object' ? e.diger : e;
			let aynimi = false;
			if (diger) {
				aynimi = (
					(this.silindimi == diger.silindimi) &&
					(this.barkod == diger.barkod) &&
					(this.stokKod == diger.stokKod) &&
					(this.fiyat == diger.fiyat) && 
					(this.iskOrani == diger.iskOrani) && 
					(this.brm == diger.brm) && 
					(this.ekNot == diger.ekNot)
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
				id: this.id,
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
				ekNot: this.ekNot || ''
			}
		}
	}
})()
