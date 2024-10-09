(function() {
	window.CETRapor_IlkIrsaliye = class extends window.CETRaporGridli {
		static get kod() { return 'ILK_IRSALIYE' }
		static get aciklama() { return 'İlk İrsaliye' }
		static get defaultUstBilgiSatirlari() {
			return $.merge(super.defaultUstBilgiSatirlari || [], [
				`MUHTELİF MÜŞTERİLERDEN`,
				`SEVK EDİLMEK ÜZERE`
			])
		}
		async run(e) {
			let result = await super.run(e);
			if (!result)
				return false
			sky.app.param.ilkIrsaliyeRaporuAlindimi = true;
			return result
		}
		async liste_columnsDuzenle(e) {
			$.merge(e.listeColumns, [
				{ datafield: 'yerKod', text: `Depo Kod`, hidden: true, filterable: true, filtercondition: 'EQUAL' },
				{ datafield: 'yerAdi', text: `Depo Adı`, hidden: true, filterable: true },
				{	datafield: 'stokKod', text: `Ürün Kod`, width: 120, filtercondition: 'EQUAL',
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{	datafield: 'stokAdi', text: `Ürün`, width: 300,
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{	datafield: 'orjMiktar', text: `Yük. Mik.`, width: 100, cellsFormat: 'd', cellsAlign: 'right',
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{	datafield: 'kalanMiktar', text: `Kalan Mik.`, width: 100, cellsFormat: 'd', cellsAlign: 'right',
					cellClassName: (rowIndex, columnField, value, rec) => {
						let cssClassName = this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }));
						const orj = typeof rec.orjMiktar == 'number' ? rec.orjMiktar : (asFloat(rec.orjMiktar) || 0);
						const kalan = typeof rec.orjMiktar == 'number' ? rec.kalanMiktar : (asFloat(rec.kalanMiktar) || 0);
						if (orj && kalan && kalan != orj) {
							if (cssClassName)
								cssClassName += ' ';
							cssClassName += 'red';
						}
						return cssClassName;
					},
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{	datafield: 'olasiMiktar', text: `Olası Mik.`, width: 100, cellsFormat: 'd', cellsAlign: 'right',
					cellClassName: (rowIndex, columnField, value, rec) => {
						let cssClassName = this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }));
						return cssClassName
					},
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{	datafield: 'brm', text: `Brm`, width: 55,
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				}
			])
		}
		async matbuuFormArgsDuzenle(e) {
			await super.matbuuFormArgsDuzenle(e);
			const {matbuuFormArgs} = e;
			matbuuFormArgs.dipPos = { x: 2 };
			$.extend(matbuuFormArgs.formBilgi, {
				dipYazdirilirmi: true
				// tekDetaySatirSayisi: 1,
				// sayfaBoyutlari: { x: 41 }
				// otoYBasiSonu: { basi: 9 }
			})
			const maxX = matbuuFormArgs.formBilgi.sayfaBoyutlari.x;
			matbuuFormArgs.normalSahalar = matbuuFormArgs.normalSahalar || {};
			$.extend(matbuuFormArgs.normalSahalar, {
				Tekil: [
					{ attr: 'ustBilgiSatirlari', pos: { x: 5, y: 3 }, genislik: maxX - 9 }
				],
				Detay: [
					{ attr: 'stokAdi', pos: { x: 1, y: 1 }, genislik: 26 },
					{ attr: 'orjMiktar', pos: { x: 28, y: 1 }, genislik: 7, alignment: 'r', tip: 'decimal' },
					{ attr: 'brm', pos: { x: 37, y: 1 }, genislik: 4 }
				]
			});
			/*$.extend(matbuuFormArgs.digerSahalar, {
				Miktar: { pos: { x: 1 } }
			})*/
		}
		async dokumVeriArgsDuzenle(e) {
			let result = await super.dokumVeriArgsDuzenle(e);
			if (result === false)
				return false
			const {dokumVeriArgs} = e;
			$.extend(dokumVeriArgs.dokumBaslikDegeriDict, {
				yerKod: `Yer`,
				yerAdi: `Yer Adı`,
				grupKod: `Grup`,
				grupAdi: `Grup Adı`,
				stokKod: `Ürün`,
				stokAdi: `Ürün Adı`,
				orjMiktar: `Yük.Mik.`,
				kalanMiktar: `Kalan`,
				olasiMiktar: 'Olası',
				brm: `Brm`
			});
			let stm = new MQStm({ sent: new MQUnionAll() });
			sky.app.rapor_ilkIrsaliye_stmSentDuzenle({ stm: stm, uni: stm.sent });
			if (!stm)
				return false
			const getDetay = e => {
				let det = CETDokumVeriDetay.From(e.rec);
				/*$.extend(det.dokumDegeriDict, {
					miktarText(e) { return `${this.miktar.toLocaleString()} ${this.brm}` }
				});*/
				return det
			};
			const {app} = sky;
			const {appSicakVeyaSogukmu} = app.class;
			const dbMgr = app.dbMgrs.rom_data;
			const yerKod2Rec = app.caches.yerKod2Rec || {};
			const brm2TopOrjMiktar = {};
			const stokAdiGenislik = dokumVeriArgs.matbuuForm.normalSahalar.Detay.stokAdi.genislik;
			const detaylar = dokumVeriArgs.detaylar = [];
			let aktifYerKod;
			let rs = await dbMgr.executeSql({ query: stm });
			for (let i = 0; i < rs.rows.length; i++) {
				const rec = rs.rows[i];
				const {yerKod} = rec;
				const yerAdi = (yerKod2Rec[yerKod] || {}).aciklama;
				rec.yerAdi = rec.yerAdi || yerAdi || '';

				if (aktifYerKod == null || aktifYerKod != yerKod) {
					if (!appSicakVeyaSogukmu && aktifYerKod != null) {
						let _rec = {
							grupmu: true,
							yerKod: yerKod, yerAdi: yerAdi,
							stokAdi: ' '.repeat(stokAdiGenislik), brm: '',
							orjMiktar: '', kalanMiktar: '', olasiMiktar: ''
						};
						detaylar.push(getDetay({ rec: _rec }));
					}
					aktifYerKod = yerKod;
					if (!appSicakVeyaSogukmu) {
						let recCizgi = {
							yerKod: yerKod, yerAdi: yerAdi,
							stokAdi: `=`.repeat(stokAdiGenislik),
							orjMiktar: ``, kalanMiktar: ``, brm: ``
						};
						// detaylar.push(getDetay({ rec: recCizgi }));
						let _rec = {
							grupmu: true,
							yerKod: yerKod, yerAdi: yerAdi,
							stokAdi: `[${ (yerAdi ? `(${yerKod}) ${yerAdi}` : yerKod) }]`.substr(0, stokAdiGenislik),
							brm: '',
							orjMiktar: '', kalanMiktar: '', olasiMiktar: ''
						};
						detaylar.push(getDetay({ rec: _rec }));
						detaylar.push(getDetay({ rec: recCizgi }));
					}
				}
				
				detaylar.push(getDetay({ rec: rec }));
				const brm = rec.brm || 'AD';
				const orjMiktar = asFloat(rec.orjMiktar) || 0;
				brm2TopOrjMiktar[brm] = (brm2TopOrjMiktar[brm] || 0) + orjMiktar;
			}
			
			let bedelVeriUzunluk;
			$.extend(dokumVeriArgs.dokumDegeriDict, {
				Dip(e) {
					const etiketSize = e.bedelEtiketUzunluk + 1;
					const veriSize = e.bedelVeriUzunluk;
					const tekCizgi = ''.padEnd(etiketSize + 13, ' ') + ''.padEnd(veriSize, '-');
					const ciftCizgi = ''.padEnd(etiketSize + 13, ' ') + ''.padEnd(veriSize, '=');

					let satirlar = [];
					// satirlar.push('');
					satirlar.push(ciftCizgi);
					let miktarText = ``;
					$.each(brm2TopOrjMiktar, (brm, topMiktar) => {
						if (miktarText)
							miktarText += `, `;
						miktarText += `${topMiktar.toLocaleString()} ${brm}`
					});
					if (miktarText) {
						satirlar.push(
							`   Top. ${miktarText} ürün`
						);
					}
					
					return satirlar;
				}
			});
		}
	};
	window.CETRapor_SonStok = class extends window.CETRaporGridli {
		static get kod() { return 'SON_STOK' }
		static get aciklama() { return 'Son Stok' }
		static get detaylimi() { return false }

		async liste_columnsDuzenle(e) {
			const {app} = sky;
			const {detaylimi} = this.class;
			const {listeColumns} = e;
			listeColumns.push(...[
				{	datafield: 'yerKod', text: `Depo Kod`, width: 60, filterable: true, filtercondition: 'EQUAL',
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{	datafield: 'stokKod', text: `Ürün Kod`, width: 120, filtercondition: 'EQUAL',
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{	datafield: 'stokAdi', text: `Ürün`, width: 300,
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				}
			]);
			if (detaylimi) {
				const {tip2EkOzellik} = app;
				if (!$.isEmptyObject(tip2EkOzellik)) {
					for (const tip in tip2EkOzellik) {
						if (tip == 'yer' || tip == 'refRaf')
							continue;
						const ekOzellik = tip2EkOzellik[tip];
						const {idSaha, tipAdi} = ekOzellik;
						listeColumns.push({
							datafield: idSaha, text: tipAdi, width: 100,
							cellClassName: (rowIndex, columnField, value, rec) =>
								this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
							cellsRenderer: (rowIndex, columnField, value, rec) =>
								this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
						});
					}
				}
			}
			listeColumns.push(...[
				{	datafield: 'orjMiktar', text: `Yük. Mik.`, width: 100, cellsFormat: 'd', cellsAlign: 'right',
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{	datafield: 'kalanMiktar', text: `Kalan Mik.`, width: 100, cellsFormat: 'd', cellsAlign: 'right',
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{	datafield: 'olasiMiktar', text: `Olası Mik.`, width: 100, cellsFormat: 'd', cellsAlign: 'right',
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{	datafield: 'brm', text: `Brm`, width: 55,
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{	datafield: 'yerAdi', text: `Depo Adı`, width: 150, filterable: true,
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				}
			]);
		}

		async matbuuFormArgsDuzenle(e) {
			await super.matbuuFormArgsDuzenle(e);
			
			const {matbuuFormArgs} = e;
			matbuuFormArgs.dipPos = { x: 2 };
			$.extend(matbuuFormArgs.formBilgi, {
				dipYazdirilirmi: true,
				// tekDetaySatirSayisi: 1,
				sayfaBoyutlari: { x: 80 }
				// otoYBasiSonu: { basi: 9 }
			});

			const maxX = matbuuFormArgs.formBilgi.sayfaBoyutlari.x;
			matbuuFormArgs.normalSahalar = matbuuFormArgs.normalSahalar || {};
			$.extend(matbuuFormArgs.normalSahalar, {
				/*Tekil: [
					{ attr: 'ustBilgiSatirlari', pos: { x: 5, y: 3 }, genislik: maxX - 9 }
				],*/
				Detay: [
					{ attr: 'stokAdi', pos: { x: 1, y: 1 }, genislik: 22 },
					{ attr: 'orjMiktar', pos: { x: 24, y: 1 }, genislik: 8, alignment: 'r', tip: 'decimal' },
					{ attr: 'kalanMiktar', pos: { x: 34, y: 1 }, genislik: 8, alignment: 'r', tip: 'decimal' },
					/*{ attr: 'olasiMiktar', pos: { x: 40, y: 1 }, genislik: 5, alignment: 'r', tip: 'decimal' },*/
					{ attr: 'brm', pos: { x: 44, y: 1 }, genislik: 4 }
				]
			});
			/*$.extend(matbuuFormArgs.digerSahalar, {
				Miktar: { pos: { x: 1 } }
			});*/
		}

		async dokumVeriArgsDuzenle(e) {
			let result = await super.dokumVeriArgsDuzenle(e);
			if (result === false)
				return false;
			
			const {app} = sky;
			const {appSicakVeyaSogukmu} = app.class;
			const dbMgr = app.dbMgrs.rom_data;
			
			const {detaylimi} = this.class;
			const {dokumVeriArgs} = e;
			const {dokumBaslikDegeriDict} = dokumVeriArgs;
			$.extend(dokumBaslikDegeriDict, {
				yerKod: `Yer`,
				yerAdi: `Yer Adı`,
				grupKod: `Grup`,
				grupAdi: `Grup Adı`,
				stokKod: `Ürün`,
				stokAdi: `Ürün Adı`,
				orjMiktar: `Yük.Mik.`,
				kalanMiktar: `Kalan`,
				olasiMiktar: 'Olası',
				brm: `Brm`
			});

			const {tip2EkOzellik} = app;
			if (detaylimi && !$.isEmptyObject(tip2EkOzellik)) {
				for (const tip in tip2EkOzellik) {
					if (tip == 'yer' || tip == 'refRaf')
						continue;
					const ekOzellik = tip2EkOzellik[tip];
					const {idSaha, tipAdi} = ekOzellik;
					dokumBaslikDegeriDict[idSaha] = tipAdi;
				}
			}
			
			let stm = new MQStm({ sent: new MQUnionAll() });
			sky.app.rapor_sonStok_stmSentDuzenle({ detaylimi: detaylimi, stm: stm, uni: stm.sent });
			if (!stm)
				return false;

			const getDetay = e => {
				let det = CETDokumVeriDetay.From(e.rec);
				/*$.extend(det.dokumDegeriDict, {
					miktarText(e) { return `${this.miktar.toLocaleString()} ${this.brm}` }
				});*/
				
				return det;
			};
			const yerKod2Rec = app.caches.yerKod2Rec || {};
			const brm2TopOrjMiktar = {};
			const stokAdiGenislik = Math.max(dokumVeriArgs.matbuuForm.normalSahalar.Detay.stokAdi.genislik - 9, 0);
			const detaylar = dokumVeriArgs.detaylar = [];
			let aktifYerKod;
			let rs = await dbMgr.executeSql({ query: stm });
			for (let i = 0; i < rs.rows.length; i++) {
				const rec = rs.rows[i];
				const {yerKod} = rec;
				const yerAdi = (yerKod2Rec[yerKod] || {}).aciklama;
				rec.yerAdi = rec.yerAdi || yerAdi || '';

				if (aktifYerKod == null || aktifYerKod != yerKod) {
					if (!appSicakVeyaSogukmu && aktifYerKod != null) {
						let _rec = {
							grupmu: true,
							yerKod: yerKod, yerAdi: yerAdi,
							stokAdi: ' '.repeat(stokAdiGenislik), brm: '',
							orjMiktar: '', kalanMiktar: '', olasiMiktar: ''
						};
						detaylar.push(getDetay({ rec: _rec }))
					}

					aktifYerKod = yerKod;

					if (!appSicakVeyaSogukmu) {
						let recCizgi = {
							yerKod: yerKod, yerAdi: yerAdi,
							stokAdi: '='.repeat(stokAdiGenislik), brm: '',
							orjMiktar: '', kalanMiktar: '', olasiMiktar: ''
						};
						// detaylar.push(getDetay({ rec: recCizgi }));
						let _rec = {
							grupmu: true,
							yerKod: yerKod, yerAdi: yerAdi,
							stokAdi: `[${ (yerAdi ? `(${yerKod}) ${yerAdi}` : yerKod) }]`.substr(0, stokAdiGenislik),
							brm: '',
							orjMiktar: '', kalanMiktar: '', olasiMiktar: ''
						};
						detaylar.push(getDetay({ rec: _rec }));
						detaylar.push(getDetay({ rec: recCizgi }));
					}
				}
				
				detaylar.push(getDetay({ rec: rec }));
				const brm = rec.brm || 'AD';
				const orjMiktar = asFloat(rec.orjMiktar) || 0;
				brm2TopOrjMiktar[brm] = (brm2TopOrjMiktar[brm] || 0) + orjMiktar;
			}
			
			let bedelVeriUzunluk;
			$.extend(dokumVeriArgs.dokumDegeriDict, {
				Dip(e) {
					const etiketSize = e.bedelEtiketUzunluk + 1;
					const veriSize = e.bedelVeriUzunluk;
					const tekCizgi = ''.padEnd(etiketSize + 13, ' ') + ''.padEnd(veriSize, '-');
					const ciftCizgi = ''.padEnd(etiketSize + 13, ' ') + ''.padEnd(veriSize, '=');

					let satirlar = [];
					// satirlar.push('');
					satirlar.push(ciftCizgi);
					let miktarText = ``;
					$.each(brm2TopOrjMiktar, (brm, topMiktar) => {
						if (miktarText)
							miktarText += `, `;
						miktarText += `${topMiktar.toLocaleString()} ${brm}`
					});
					if (miktarText) {
						satirlar.push(
							`   Top. ${miktarText} ürün`
						);
					}
					return satirlar
				}
			})
		}
	};
	window.CETRapor_SonStok_Detayli = class extends window.CETRapor_SonStok {
		static get kod() { return 'SON_STOK_DETAYLI' }
		static get aciklama() { return 'Son Stok (Detaylı)' }
		static get detaylimi() { return true }
	}
	window.CETRapor_SatisVeTahsilatlar = class extends window.CETRaporGridli {
		static get kod() { return 'SATIS_VE_TAHSILATLAR' }
		static get aciklama() { return 'Satış ve Tahsilatlar' }
		static get satislarGosterilirmi() { return true }
		static get tahsilatlarGosterilirmi() { return true }
		async matbuuFormArgsDuzenle(e) {
			await super.matbuuFormArgsDuzenle(e); const {matbuuFormArgs} = e, {formBilgi} = matbuuFormArgs;
			matbuuFormArgs.dipPos = { x: 7 };
			$.extend(formBilgi, { dipYazdirilirmi: true });
			const maxX = formBilgi.sayfaBoyutlari.x;
			const normalSahalar = matbuuFormArgs.normalSahalar = matbuuFormArgs.normalSahalar || {};
			$.extend(normalSahalar, {
				/*Tekil: [
					{ attr: 'ustBilgiSatirlari', pos: { x: 5, y: 3 }, genislik: maxX - 9 }
				],*/
				Detay: [
					{ attr: 'stokAdi', pos: { x: 1, y: 1 }, genislik: 16 },
					{ attr: 'miktar', pos: { x: 17, y: 1 }, genislik: 7, alignment: 'r', tip: 'decimal' },
					{ attr: 'brm', pos: { x: 25, y: 1 }, genislik: 4 },
					{ attr: 'netBedel', pos: { x: 30, y: 1 }, genislik: 11, alignment: 'r', tip: 'bedel' }
				]
			})
		}
		async dokumVeriArgsDuzenle(e) {
			let result = await super.dokumVeriArgsDuzenle(e);
			if (result === false)
				return false
			const {app} = sky, {dokumVeriArgs} = e;
			$.extend(dokumVeriArgs.dokumBaslikDegeriDict, {
				stokKod: 'Ürün', stokAdi: 'Ürün Adı',
				miktar: 'Miktar', brm: 'Brm', netBedel: 'Net Bedel'
			});
			const getDetay = e =>
				CETDokumVeriDetay.From(e.rec);
			const dbMgr = sky.app.dbMgrs.rom_data;
			const brm2TopMiktar = {};
			const detaylar = dokumVeriArgs.detaylar = [];
			const rec_toplam = getDetay({ rec: { toplammi: true, tip: 'toplam', stokAdi: 'TOP: ', netBedel: 0 } });
			detaylar.push(rec_toplam);
			detaylar.push(getDetay({ rec: { ekBilgimi: true, tip: '-', stokAdi: '='.repeat(16), brm: '='.repeat(4), netBedel: '='.repeat(7) } }));
			for (let i = 0; i < 2; i++)
				detaylar.push(getDetay({ rec: { stokAdi: '' } }))
			let stm, recs;
			if (this.class.satislarGosterilirmi) {
				stm = new MQStm({ sent: new MQUnionAll() });
				app.rapor_satislar_stmSentDuzenle({ stm: stm, uni: stm.sent });
				if (stm) {
					recs = await dbMgr.executeSqlReturnRowsBasic({ query: stm });
					if (this.class.satislarGosterilirmi && recs.length) {
						detaylar.push(getDetay({ rec: { grupmu: true, stokAdi: `- SATIŞLAR -` } }))
						for (let i = 0; i < recs.length; i++) {
							const rec = recs[i];
							rec.tip = 'satis';
							const {idSahalar} = CETEkOzellikler;
							const ekOzellikValues = [];
							for (const idSaha of idSahalar) {
								if (idSaha == 'refRafKod')
									continue
								const value = rec[idSaha];
								if (value)
									ekOzellikValues.push(value)
							}
							if (!$.isEmptyObject(ekOzellikValues))
								rec.stokAdi += `  <span class="ekOzelliklerText">[${ekOzellikValues.join(';')}]</span>`
							detaylar.push(getDetay({ rec: rec }));
							const brm = rec.brm || 'AD';
							const miktar = asFloat(rec.miktar) || 0;
							brm2TopMiktar[brm] = (brm2TopMiktar[brm] || 0) + miktar;
							const {netBedel} = rec;
							rec_toplam.netBedel += netBedel
						}

						const topMiktarStrListe = [];
						for (const brm in brm2TopMiktar) {
							const topMiktar = brm2TopMiktar[brm];
							if (topMiktar)
								topMiktarStrListe.push(`${topMiktar.toLocaleString()} ${brm}`)
						}
						rec_toplam.stokAdi += ` ${topMiktarStrListe.join('; ')}`
					}
				}
			}
			if (this.class.tahsilatlarGosterilirmi) {
				stm = new MQStm({ sent: new MQUnionAll() });
				app.rapor_tahsilatlar_stmSentDuzenle({ stm: stm, uni: stm.sent });
				if (stm) {
					recs = await dbMgr.executeSqlReturnRowsBasic({ query: stm });
					if (recs.length) {
						const oncesiBosmu = $.isEmptyObject(detaylar);
						if (!oncesiBosmu) {
							for (let i = 0; i < 2; i++)
								detaylar.push(getDetay({ rec: { stokAdi: '' } }))
							detaylar.push(getDetay({ rec: { grupmu: true, stokAdi: `- TAHSILATLAR -` } }))
						}
						let tahSekliNo2TopBedel = {}, tahSekliNo2Adi = {};
						for (let i = 0; i < recs.length; i++) {
							const rec = recs[i];
							const tahSekliNo = asInteger(rec.tahSekliNo);
							tahSekliNo2TopBedel[tahSekliNo] = bedel((tahSekliNo2TopBedel[tahSekliNo] || 0) + (asFloat(rec.bedel) || 0));
							tahSekliNo2Adi[tahSekliNo] = tahSekliNo2Adi[tahSekliNo] || rec.tahSekliAdi
						}
						for (const tahSekliNo in tahSekliNo2TopBedel) {
							const topBedel = tahSekliNo2TopBedel[tahSekliNo];
							rec_toplam.netBedel += topBedel;
							let rec = { tip: 'tahsilat', stokAdi: tahSekliNo2Adi[tahSekliNo], netBedel: topBedel };
							detaylar.push(getDetay({ rec: rec }))
						}
					}
				}
			}
			let bedelVeriUzunluk;
			$.extend(dokumVeriArgs.dokumDegeriDict, {
				Dip(e) {
					const etiketSize = e.bedelEtiketUzunluk + 2;
					const veriSize = e.bedelVeriUzunluk + 1;
					const tekCizgi = ''.padEnd(etiketSize + 9, ' ') + ''.padEnd(veriSize, '-');
					const ciftCizgi = ''.padEnd(etiketSize + 9, ' ') + ''.padEnd(veriSize, '=');
					/*const tekCizgi = ''.padEnd(etiketSize + veriSize + 2, '-');
					const ciftCizgi = ''.padEnd(etiketSize + veriSize + 2, '=');*/
					let toplamSatisBedel = 0, toplamTahsilatBedel = 0;
					for (const det of this.detaylar) {
						const bedel = asFloat(det.netBedel) || 0;
						switch (det.tip) {
							case 'satis': toplamSatisBedel += bedel; break;
							case 'tahsilat': toplamTahsilatBedel += bedel; break;
						}
					}
					let miktarText = '';
					for (const brm in brm2TopMiktar) {
						const topMiktar = brm2TopMiktar[brm]
						if (miktarText)
							miktarText += ', ';
						miktarText += `${topMiktar.toLocaleString()} ${brm}`
					}
					let satirlar = [];
					let bilgiVarmi = false;
					// satirlar.push('');
					satirlar.push(ciftCizgi);
					const ciftCizgiIndex = satirlar.length - 1;
					if (miktarText) {
						bilgiVarmi = true;
						satirlar.push(`   Top. ${miktarText} ürün`)
					}
					if (toplamSatisBedel) {
						bilgiVarmi = true;
						satirlar.push(
							`TOP.SATIS            `.padEnd(etiketSize) + /*`: ` +*/
							`${bedelStr(toplamSatisBedel)}`.padStart(veriSize)
						);
					}
					if (toplamTahsilatBedel) {
						bilgiVarmi = true;
						satirlar.push(
							`TOP.TAHSILAT         `.padEnd(etiketSize) + /*`: ` +*/
							`${bedelStr(toplamTahsilatBedel)}`.padStart(veriSize)
						);
					}
					if (!bilgiVarmi && ciftCizgiIndex > -1)
						satirlar.splice(ciftCizgiIndex, 1);
					return satirlar
				}
			})
		}
		async liste_columnsDuzenle(e) {
			const {listeColumns} = e;
			listeColumns.push(
				{
					datafield: 'stokAdi', text: ' ', width: 400,
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{
					datafield: 'miktar', text: 'Miktar', width: 100, cellsFormat: 'd', cellsAlign: 'right',
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{
					datafield: 'brm', text: 'Brm', width: 55,
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{
					datafield: 'netBedel', text: 'Bedel', width: 115, cellsFormat: 'd2', cellsAlign: 'right',
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				}
			)
		}
	};
	/*window.CETRapor_Satislar = class extends window.window.CETRapor_SatisVeTahsilatlar {
		static get kod() { return 'SATISLAR' }
		static get aciklama() { return 'Satışlar' }
		static get tahsilatlarGosterilirmi() { return false }
	};
	window.CETRapor_Tahsilatlar = class extends window.window.CETRapor_SatisVeTahsilatlar {
		static get kod() { return 'TAHSILATLAR' }
		static get aciklama() { return 'Tahsilatlar' }
		static get satislarGosterilirmi() { return false }
	};*/
	window.CETRapor_GunSonu = class extends window.CETRaporGridli {
		static get kod() { return 'GUN_SONU' }
		static get aciklama() { return 'Gün Sonu' }
		async matbuuFormArgsDuzenle(e) {
			await super.matbuuFormArgsDuzenle(e);
			const matbuuFormArgs = e.matbuuFormArgs;
			// matbuuFormArgs.dipPos = { x: 5 };
			$.extend(matbuuFormArgs.formBilgi, {
				dipYazdirilirmi: false,
				sayfaBoyutlari: { x: 80 }
			})
			// const maxX = matbuuFormArgs.formBilgi.sayfaBoyutlari.x
		}
	};
	window.CETRapor_GunSonu_MiktarHesaplasma = class extends window.CETRapor_GunSonu {
		static get kod() { return `${super.kod}_MIKTAR_HESAPLASMA` }
		static get aciklama() { return `${super.aciklama}: Miktar Hesaplaşma` }
		async tazeleSonrasi(e) {
			await super.tazeleSonrasi(e);
			const {part} = e;
			part.divListe.jqxDataTable('groups', [`grupAdi`]);
		}
		async liste_columnsDuzenle(e) {
			$.merge(e.listeColumns, [
				{ datafield: 'tarih', text: 'Tarih', width: 80, filtercondition: 'EQUAL',
						cellClassName: (rowIndex, columnField, value, rec) =>
							this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
						cellsRenderer: (rowIndex, columnField, value, rec) =>
							this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{ datafield: 'stokKod', text: 'Ürün', width: 90, filtercondition: 'EQUAL',
						cellClassName: (rowIndex, columnField, value, rec) =>
							this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
						cellsRenderer: (rowIndex, columnField, value, rec) =>
							this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{ datafield: 'stokAdi', text: 'Ürün Adı', width: 300,
						cellClassName: (rowIndex, columnField, value, rec) =>
							this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
						cellsRenderer: (rowIndex, columnField, value, rec) =>
							this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{ datafield: 'brm', text: 'Brm', width: 55,
						cellClassName: (rowIndex, columnField, value, rec) =>
							this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
						cellsRenderer: (rowIndex, columnField, value, rec) =>
							this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{ datafield: 'devir', text: 'Yüklenen', width: 95, cellsFormat: 'd3', cellsAlign: 'right',
						cellClassName: (rowIndex, columnField, value, rec) =>
							this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
						cellsRenderer: (rowIndex, columnField, value, rec) =>
							this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{ datafield: 'satis', text: 'Satış', width: 80, cellsFormat: 'd3', cellsAlign: 'right',
						cellClassName: (rowIndex, columnField, value, rec) =>
							this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
						cellsRenderer: (rowIndex, columnField, value, rec) =>
							this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{ datafield: 'iade', text: 'İADE', width: 80, cellsFormat: 'd3', cellsAlign: 'right',
						cellClassName: (rowIndex, columnField, value, rec) =>
							this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
						cellsRenderer: (rowIndex, columnField, value, rec) =>
							this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{ datafield: 'kalan', text: 'Kalan', width: 95, cellsFormat: 'd3', cellsAlign: 'right',
						cellClassName: (rowIndex, columnField, value, rec) =>
							this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
						cellsRenderer: (rowIndex, columnField, value, rec) =>
							this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{ datafield: 'grupKod', text: 'Grup', width: 45, hidden: true, filtercondition: 'EQUAL' },
				{ datafield: 'grupAdi', text: 'Grup Adı', hidden: true }
			])
		}

		async matbuuFormArgsDuzenle(e) {
			await super.matbuuFormArgsDuzenle(e);
			
			const matbuuFormArgs = e.matbuuFormArgs;
			// matbuuFormArgs.dipPos = { x: 5 };
			$.extend(matbuuFormArgs.formBilgi, {
				dipYazdirilirmi: false
			});
			
			matbuuFormArgs.normalSahalar = matbuuFormArgs.normalSahalar || {};
			$.extend(matbuuFormArgs.normalSahalar, {
				Detay: [
					{ attr: 'tarih', pos: { x: 1, y: 1 }, genislik: 13 },
					{ attr: 'stokAdi', pos: { x: 14, y: 1 }, genislik: 28 },
					{ attr: 'brm', pos: { x: 42, y: 1 }, genislik: 4 },
					{ attr: 'devir', pos: { x: 47, y: 1 }, genislik: 8, alignment: 'r', tip: 'decimal' },
					{ attr: 'satis', pos: { x: 56, y: 1 }, genislik: 8, alignment: 'r', tip: 'decimal' },
					{ attr: 'iade', pos: { x: 65, y: 1 }, genislik: 8, alignment: 'r', tip: 'decimal' },
					{ attr: 'kalan', pos: { x: 74, y: 1 }, genislik: 8, alignment: 'r', tip: 'decimal' }
				]
			});
		}

		async dokumVeriArgsDuzenle(e) {
			let result = await super.dokumVeriArgsDuzenle(e);
			if (result === false)
				return false;
			
			const getDetay = e => {
				let det = CETDokumVeriDetay.From(e.rec);
				return det;
			};
			const dbMgr = sky.app.dbMgrs.rom_data;
			let stm, rs;
			const tarih2SHKod2Det = {}, tip2Brm2TopMiktar = {};

			stm = new MQStm({ sent: new MQUnionAll() });
			sky.app.rapor_gunSonuRaporu_stmSentDuzenle_miktarHesaplasma_devirVeKalan({ stm: stm, uni: stm.sent });
			if (!stm)
				return false;
			rs = await dbMgr.executeSql({ query: stm });
			$.each(rs.rows, (_, rec) => {
				rec.tip = `miktarHesaplasma`;
				const {stokKod, brm} = rec;
				const tarih = dateToString(asDate(rec.tarih)) || '';
				rec.tarih = rec.tarih || null;
				const shKod2Det = tarih2SHKod2Det[tarih] = tarih2SHKod2Det[tarih] || {};
				shKod2Det[stokKod] = shKod2Det[stokKod] || getDetay({ rec: rec });
				
				['devir', 'kalan'].forEach(key => {
					let topDict = tip2Brm2TopMiktar[key] = tip2Brm2TopMiktar[key] || {};
					topDict[brm] = (topDict[brm] || 0) + asFloat(rec[key]);
				});
			});

			stm = new MQStm({ sent: new MQUnionAll() });
			sky.app.rapor_gunSonuRaporu_stmSentDuzenle_miktarHesaplasma_satisHareketler({ stm: stm, uni: stm.sent });
			if (!stm)
				return false;
			rs = await dbMgr.executeSql({ query: stm });
			$.each(rs.rows, (_, rec) => {
				const {stokKod, brm} = rec;
				rec.tip = `miktarHesaplasma`;
				const tarih = dateToString(asDate(rec.tarih)) || '';
				rec.tarih = rec.tarih || null;
				const shKod2Det = tarih2SHKod2Det[tarih] = tarih2SHKod2Det[tarih] || {};
				const det = shKod2Det[stokKod] = shKod2Det[stokKod] || (() => {
					let _det = getDetay({ rec: rec });
					['satis', 'iade'].forEach(key =>
						_det[key] = 0);
					return _det;
				})();
				det.tarih = dateToString(asDate(rec.tarih));
				['satis', 'iade'].forEach(key => {
					det[key] = (det[key] || 0) + asFloat(rec[key]);
					let topDict = tip2Brm2TopMiktar[key] = tip2Brm2TopMiktar[key] || {};
					topDict[brm] = (topDict[brm] || 0) + asFloat(rec[key]);
				});
			});

			const {dokumVeriArgs} = e;
			$.extend(dokumVeriArgs.dokumBaslikDegeriDict, {
				stokKod: `Ürün`,
				stokAdi: `Ürün Adı`,
				miktar: `Miktar`,
				brm: `Brm`,
				devir: `Devir`,
				satis: `Satış`,
				iade: `İADE`,
				kalan: `Kalan`,
				toplam: `TOPLAM`
			});

			const detaylar = dokumVeriArgs.detaylar = [];
			$.each(tarih2SHKod2Det, (tarih, shKod2Det) => {
				$.each(shKod2Det, (shKod, det) =>
					detaylar.push(det));
			});
			
			const recToplamTemplate = { toplammi: true, grupKod: `toplam`, grupAdi: `` };
			let recToplam = $.extend({}, recToplamTemplate, { stokAdi: `  TOPLAM ==>` });
			$.each(tip2Brm2TopMiktar, (tip, brm2TopMiktar) => {
				let miktarTextListe = [], brmTextListe = [];
				$.each(brm2TopMiktar, (brm, topMiktar) => {
					const topMiktarStr = (asFloat(topMiktar) || 0).toLocaleString(culture, { minimumIntegerDigits: 1, maximumFractionDigits: 4, useGrouping: true });
					miktarTextListe.push(topMiktarStr);
					brmTextListe.push(brm);
				});
				recToplam[tip] = miktarTextListe;
				recToplam.brm = recToplam.brm || brmTextListe;
			});
			detaylar.push(getDetay({ rec: $.extend({}, recToplamTemplate, { stokAdi: `` }) }));
			detaylar.push(getDetay({ rec: recToplam }));
		}
	};
	window.CETRapor_GunSonu_BedelHesaplasma = class extends window.CETRapor_GunSonu {
		static get kod() { return `${super.kod}_BEDEL_HESAPLASMA` }
		static get aciklama() { return `${super.aciklama}: Bedel Hesaplaşma` }
		async tazeleSonrasi(e) {
			await super.tazeleSonrasi(e);
			const {part} = e;
			part.divListe.jqxDataTable('groups', [`grupAdi`]);
		}
		async liste_columnsDuzenle(e) {
			$.merge(e.listeColumns, [
				{ datafield: 'tarih', text: 'Tarih', width: 80, filtercondition: 'EQUAL',
						cellClassName: (rowIndex, columnField, value, rec) =>
							this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
						cellsRenderer: (rowIndex, columnField, value, rec) =>
							this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{ datafield: 'stokKod', text: 'Ürün', width: 90, filtercondition: 'EQUAL',
						cellClassName: (rowIndex, columnField, value, rec) =>
							this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
						cellsRenderer: (rowIndex, columnField, value, rec) =>
							this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{ datafield: 'stokAdi', text: 'Ürün Adı', width: 300,
						cellClassName: (rowIndex, columnField, value, rec) =>
							this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
						cellsRenderer: (rowIndex, columnField, value, rec) =>
							this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{ datafield: 'miktar', text: 'Miktar', width: 100, cellsFormat: 'd3', cellsAlign: 'right',
						cellClassName: (rowIndex, columnField, value, rec) =>
							this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
						cellsRenderer: (rowIndex, columnField, value, rec) =>
							this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{ datafield: 'brm', text: 'Brm', width: 55,
						cellClassName: (rowIndex, columnField, value, rec) =>
							this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
						cellsRenderer: (rowIndex, columnField, value, rec) =>
							this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{ datafield: 'brutBedel', text: 'Brüt Bedel', width: 110, cellsFormat: 'd2', cellsAlign: 'right',
						cellClassName: (rowIndex, columnField, value, rec) =>
							this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
						cellsRenderer: (rowIndex, columnField, value, rec) =>
							this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{ datafield: 'iskBedel', text: 'İsk. Bedel', width: 110, cellsFormat: 'd2', cellsAlign: 'right',
						cellClassName: (rowIndex, columnField, value, rec) =>
							this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
						cellsRenderer: (rowIndex, columnField, value, rec) =>
							this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{ datafield: 'netBedel', text: 'Net Bedel', width: 110, cellsFormat: 'd2', cellsAlign: 'right',
						cellClassName: (rowIndex, columnField, value, rec) =>
							this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
						cellsRenderer: (rowIndex, columnField, value, rec) =>
							this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{ datafield: 'grupKod', text: 'Grup', width: 45, hidden: true, filtercondition: 'EQUAL' },
				{ datafield: 'grupAdi', text: 'Grup Adı', hidden: true }
			])
		}

		async matbuuFormArgsDuzenle(e) {
			await super.matbuuFormArgsDuzenle(e);
			
			const matbuuFormArgs = e.matbuuFormArgs;
			// matbuuFormArgs.dipPos = { x: 5 };
			$.extend(matbuuFormArgs.formBilgi, {
				dipYazdirilirmi: false
			});
			
			matbuuFormArgs.normalSahalar = matbuuFormArgs.normalSahalar || {};
			$.extend(matbuuFormArgs.normalSahalar, {
				Detay: [
					{ attr: 'tarih', pos: { x: 1, y: 1 }, genislik: 13 },
					{ attr: 'stokAdi', pos: { x: 14, y: 1 }, genislik: 28 },
					{ attr: 'miktar', pos: { x: 43, y: 1 }, genislik: 8, alignment: 'r', tip: 'decimal' },
					{ attr: 'brm', pos: { x: 52, y: 1 }, genislik: 4 },
					{ attr: 'brutBedel', pos: { x: 57, y: 1 }, genislik: 9, alignment: 'r', tip: 'bedel' },
					{ attr: 'iskBedel', pos: { x: 67, y: 1 }, genislik: 9, alignment: 'r', tip: 'bedel' },
					{ attr: 'netBedel', pos: { x: 77, y: 1 }, genislik: 9, alignment: 'r', tip: 'bedel' }
				]
			});
		}

		async dokumVeriArgsDuzenle(e) {
			let result = await super.dokumVeriArgsDuzenle(e);
			if (result === false)
				return false;
			
			const getDetay = e => {
				let det = CETDokumVeriDetay.From(e.rec);
				return det;
			};
			const dbMgr = sky.app.dbMgrs.rom_data;
			let stm, rs;
			const tarih2SHKod2Det = {}, tip2Brm2TopMiktar = {};

			stm = new MQStm({ sent: new MQUnionAll() });
			sky.app.rapor_gunSonuRaporu_stmSentDuzenle_bedelHesaplasma_satisHareketler({ stm: stm, uni: stm.sent });
			if (!stm)
				return false;
			rs = await dbMgr.executeSql({ query: stm });
			$.each(rs.rows, (_, rec) => {
				const {stokKod, brm} = rec;
				rec.tip = `bedelHesaplasma`;
				const tarih = dateToString(asDate(rec.tarih)) || '';
				rec.tarih = rec.tarih || null;
				const shKod2Det = tarih2SHKod2Det[tarih] = tarih2SHKod2Det[tarih] || {};
				const det = shKod2Det[stokKod] = shKod2Det[stokKod] || (() => {
					let _det = getDetay({ rec: rec });
					_det.tarih = dateToString(asDate(rec.tarih));
					['miktar', 'brutBedel', 'iskBedel', 'netBedel'].forEach(key =>
						_det[key] = 0);
					return _det;
				})();
				['miktar', 'brutBedel', 'iskBedel', 'netBedel'].forEach(key => {
					det[key] = (det[key] || 0) + asFloat(rec[key]);
					let topDict = tip2Brm2TopMiktar[key] = tip2Brm2TopMiktar[key] || {};
					topDict[brm] = (topDict[brm] || 0) + asFloat(rec[key]);
				});
			});

			const {dokumVeriArgs} = e;
			$.extend(dokumVeriArgs.dokumBaslikDegeriDict, {
				stokKod: `Ürün`,
				stokAdi: `Ürün Adı`,
				miktar: `Miktar`,
				brm: `Brm`,
				brutBedel: `BrütBedel`,
				iskBedel: `İsk.Bedel`,
				netBedel: `NetBedel`,
				toplam: `TOPLAM`
			});

			const detaylar = dokumVeriArgs.detaylar = [];
			$.each(tarih2SHKod2Det, (tarih, shKod2Det) => {
				$.each(shKod2Det, (shKod, det) =>
					detaylar.push(det));
			});
			
			const recToplamTemplate = { toplammi: true, grupKod: `toplam`, grupAdi: `` };
			let recToplam = $.extend({}, recToplamTemplate, { stokAdi: `  TOPLAM ==>` });
			$.each(tip2Brm2TopMiktar, (tip, brm2TopMiktar) => {
				let miktarTextListe = [], brmTextListe = [];
				$.each(brm2TopMiktar, (brm, topMiktar) => {
					const topMiktarStr = (asFloat(topMiktar) || 0).toLocaleString(culture, { minimumIntegerDigits: 1, maximumFractionDigits: 4, useGrouping: true });
					miktarTextListe.push(topMiktarStr);
					brmTextListe.push(brm);
				});
				recToplam[tip] = miktarTextListe;
				recToplam.brm = recToplam.brm || brmTextListe;
			});
			detaylar.push(getDetay({ rec: $.extend({}, recToplamTemplate, { stokAdi: `` }) }));
			detaylar.push(getDetay({ rec: recToplam }));
		}
	};
	window.CETRapor_GunSonu_Hesaplasma = class extends window.CETRapor_GunSonu {
		static get kod() { return `${super.kod}_HESAPLASMA` }
		static get aciklama() { return `${super.aciklama}: Hesaplaşma` }
		async liste_columnsDuzenle(e) {
			$.merge(e.listeColumns, [
				{ datafield: 'tarih', text: 'Tarih', width: 80, filtercondition: 'EQUAL',
						cellClassName: (rowIndex, columnField, value, rec) =>
							this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
						cellsRenderer: (rowIndex, columnField, value, rec) =>
							this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{ datafield: 'mustKod', text: 'Müşteri', width: 90, filtercondition: 'EQUAL',
						cellClassName: (rowIndex, columnField, value, rec) =>
							this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
						cellsRenderer: (rowIndex, columnField, value, rec) =>
							this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{ datafield: 'mustUnvan', text: 'Müşteri Ünvan', width: 300,
						cellClassName: (rowIndex, columnField, value, rec) =>
							this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
						cellsRenderer: (rowIndex, columnField, value, rec) =>
							this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{ datafield: 'fisSonuc', text: 'Belge Tutarı', width: 110, cellsFormat: 'd2', cellsAlign: 'right',
						cellClassName: (rowIndex, columnField, value, rec) =>
							this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
						cellsRenderer: (rowIndex, columnField, value, rec) =>
							this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{ datafield: 'nakit', text: 'Nakit', width: 110, cellsFormat: 'd2', cellsAlign: 'right',
						cellClassName: (rowIndex, columnField, value, rec) =>
							this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
						cellsRenderer: (rowIndex, columnField, value, rec) =>
							this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{ datafield: 'pos', text: 'POS', width: 110, cellsFormat: 'd2', cellsAlign: 'right',
						cellClassName: (rowIndex, columnField, value, rec) =>
							this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
						cellsRenderer: (rowIndex, columnField, value, rec) =>
							this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{ datafield: 'cekSenet', text: 'Çek/Senet', width: 110, cellsFormat: 'd2', cellsAlign: 'right',
						cellClassName: (rowIndex, columnField, value, rec) =>
							this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
						cellsRenderer: (rowIndex, columnField, value, rec) =>
							this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{ datafield: 'acikHesap', text: 'Açık Hesap', width: 110, cellsFormat: 'd2', cellsAlign: 'right',
						cellClassName: (rowIndex, columnField, value, rec) =>
							this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
						cellsRenderer: (rowIndex, columnField, value, rec) =>
							this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{ datafield: 'genel', text: 'TOPLAM', width: 110, cellsFormat: 'd2', cellsAlign: 'right',
						cellClassName: (rowIndex, columnField, value, rec) =>
							this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
						cellsRenderer: (rowIndex, columnField, value, rec) =>
							this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				}
			])
		}
		async matbuuFormArgsDuzenle(e) {
			await super.matbuuFormArgsDuzenle(e);
			const {matbuuFormArgs} = e;
			// matbuuFormArgs.dipPos = { x: 5 };
			$.extend(matbuuFormArgs.formBilgi, { sayfaBoyutlari: { x: 110 }, dipYazdirilirmi: false });
			matbuuFormArgs.normalSahalar = matbuuFormArgs.normalSahalar || {};
			$.extend(matbuuFormArgs.normalSahalar, {
				Detay: [
					{ attr: 'tarih', pos: { x: 1, y: 1 }, genislik: 13 },
					{ attr: 'mustUnvan', pos: { x: 15, y: 1 }, genislik: 26 },
					{ attr: 'fisSonuc', pos: { x: 42, y: 1 }, genislik: 11, alignment: 'r', tip: 'bedel' },
					{ attr: 'nakit', pos: { x: 54, y: 1 }, genislik: 11, alignment: 'r', tip: 'bedel' },
					{ attr: 'pos', pos: { x: 66, y: 1 }, genislik: 11, alignment: 'r', tip: 'bedel' },
					{ attr: 'cekSenet', pos: { x: 78, y: 1 }, genislik: 11, alignment: 'r', tip: 'bedel' },
					{ attr: 'acikHesap', pos: { x: 90, y: 1 }, genislik: 11, alignment: 'r', tip: 'bedel' },
					{ attr: 'genel', pos: { x: 102, y: 1 }, genislik: 11, alignment: 'r', tip: 'bedel' }
				]
			})
		}
		async dokumVeriArgsDuzenle(e) {
			let result = await super.dokumVeriArgsDuzenle(e);
			if (result === false)
				return false
			const getDetay = e =>
				CETDokumVeriDetay.From(e.rec);
			const bedelKeys = ['fisSonuc', 'nakit', 'pos', 'cekSenet', 'acikHesap'];
			const dbMgr = sky.app.dbMgrs.rom_data;
			let stm, rows;
			stm = new MQStm({ sent: new MQUnionAll() });
			sky.app.rapor_gunSonuRaporu_stmSentDuzenle_tahsilatlar({ stm: stm, uni: stm.sent });
			if (!stm)
				return false
			const tarih2MustKod2Det = {};
			rows = await dbMgr.executeSqlReturnRowsBasic({ query: stm });
			for (let i = 0; i < rows.length; i++) {
				const rec = rows[i];
				const tarih = dateToString(asDate(rec.tarih)) || '';
				rec.tarih = tarih || null;
				const {mustKod} = rec;
				rec.tip = `gunSonuTahsilat`;
				const mustKod2Det = tarih2MustKod2Det[tarih] = tarih2MustKod2Det[tarih] || {};
				const det = mustKod2Det[mustKod] = mustKod2Det[mustKod] || getDetay({ rec: {
					tarih: rec.tarih,
					mustKod: rec.mustKod,
					mustUnvan: rec.mustUnvan
				} });
				det.genel = det.genel || 0;
				for (let i in bedelKeys) {
					const key = bedelKeys[i];
					const _bedel = bedel(rec[key]) || 0;
					det[key] = bedel((det[key] || 0) + _bedel);
				}
			}
			const tip2TopBedel = {};
			for (const tarih in tarih2MustKod2Det) {
				const mustKod2Det = tarih2MustKod2Det[tarih];
				for (const mustKod in mustKod2Det) {
					const det = mustKod2Det[mustKod];
					for (let i in bedelKeys) {
						const key = bedelKeys[i];
						const _bedel = (det[key] || 0);
						tip2TopBedel[key] = bedel((tip2TopBedel[key] || 0) + _bedel);
						if (key != 'fisSonuc')
							det.genel = bedel((det.genel || 0) + _bedel);
					}
					tip2TopBedel.genel = bedel((tip2TopBedel.genel || 0) + (det.genel || 0));
				}
			}
			const {dokumVeriArgs} = e;
			$.extend(dokumVeriArgs.dokumBaslikDegeriDict, {
				tarih: `Tarih`, mustKod: `Müşteri`, mustUnvan: `Ünvan`, fisSonuc: `Satış Tutarı`,
				nakit: `Nakit`, pos: `POS`, cekSenet: `Çek/Senet`, acikHesap: `Açık Hesap`, genel: `TOPLAM`
			});
			const detaylar = dokumVeriArgs.detaylar = [];
			for (const tarih in tarih2MustKod2Det) {
				const mustKod2Det = tarih2MustKod2Det[tarih];
				for (const mustKod in mustKod2Det) {
					const det = mustKod2Det[mustKod];
					detaylar.push(det);
				}
			}
			const recToplam = { toplammi: true, mustUnvan: `  TOPLAM ==>` };
			for (const tip in tip2TopBedel) {
				const topBedel = tip2TopBedel[tip];
				recToplam[tip] = topBedel
			}
			detaylar.push(getDetay({ rec: { mustUnvan: '' } }));
			detaylar.push(getDetay({ rec: recToplam }))
		}
	};
	window.CETRapor_BekleyenSiparisler = class extends window.CETRaporGridli {
		static get kod() { return 'BEKLEYEN_SIPARISLER' }
		static get aciklama() { return 'Bekleyen Siparişler' }
		get almSat() { return null }

		async liste_columnsDuzenle(e) {
			$.merge(e.listeColumns, [
				{	datafield: 'almSatText', text: 'Tip', width: 300, hidden: true,
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{	datafield: 'tarih', text: 'Sip.Tarih', width: 60,
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{	datafield: 'teslimTarih', text: 'Tes.Tarih', width: 60,
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{	datafield: 'fisNox', text: 'Sip.No', width: 95, cellsAlign: 'right',
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{	datafield: 'mustUnvan', text: 'Müşteri', width: 300,
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{	datafield: 'stokAdi', text: 'Ürün', width: 300,
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{	datafield: 'bekleyenMiktar', text: 'Sipariş', width: 100, cellsFormat: 'd', cellsAlign: 'right',
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{	datafield: 'kalanMiktar', text: 'Kalan', width: 100, cellsFormat: 'd', cellsAlign: 'right',
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{	datafield: 'olasiMiktar', text: 'Olası', width: 100, cellsFormat: 'd', cellsAlign: 'right',
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{	datafield: 'brm', text: 'Brm', width: 55,
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{	datafield: 'teslimYerAdi', text: 'Tes.Yeri', width: 110,
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{	datafield: 'nakSekliAdi', text: 'Nak.Şekli', width: 90,
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{	datafield: 'odemeGunKod', text: 'Ödeme Gün', width: 100,
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{	datafield: 'tahSekliAdi', text: 'Tah.Şekli', width: 110,
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, {
							rowIndex: rowIndex, columnField: columnField, rec: rec,
							value: (rec && rec.tahSekliKodNo ? `${rec.tahSekliKodNo}-${value}` : value)
						}))
				},
				{ datafield: 'fisNoxText', hidden: true, filterable: false }
			])
		}

		async matbuuFormArgsDuzenle(e) {
			await super.matbuuFormArgsDuzenle(e);
			
			const matbuuFormArgs = e.matbuuFormArgs;
			matbuuFormArgs.dipPos = { x: 3 };
			$.extend(matbuuFormArgs.formBilgi, {
				dipYazdirilirmi: true,
				tekDetaySatirSayisi: 2
				// sayfaBoyutlari: { x: 41 }
				// otoYBasiSonu: { basi: 9 }
			});

			const maxX = matbuuFormArgs.formBilgi.sayfaBoyutlari.x;
			matbuuFormArgs.normalSahalar = matbuuFormArgs.normalSahalar || {};
			$.extend(matbuuFormArgs.normalSahalar, {
				/*Tekil: [
					{ attr: 'ustBilgiSatirlari', pos: { x: 5, y: 3 }, genislik: maxX - 9 }
				],*/
				Detay: [
					{ attr: 'tarih', pos: { x: 1, y: 1 }, genislik: 6 },
					{ attr: 'fisNox', pos: { x: 8, y: 1 }, genislik: 10, alignment: 'r', },
					{ attr: 'mustUnvan', pos: { x: 20, y: 1 }, genislik: 10 },
					{
						attr: 'stokAdi', pos: { x: 31, y: 1 }, genislik: 10,
						ekDuzenleyici: e => {
							const {value} = e;
							return value
								? value.replaceAll(`<span class="ekOzelliklerText">`, '')
										.replaceAll(`</span>`, '')
								: value;
						}
					},
					{ attr: 'bekleyenMiktar', pos: { x: 20, y: 2 }, genislik: 7, alignment: 'r', tip: 'miktar' },
					{ attr: 'kalanMiktar', pos: { x: 39, y: 2 }, genislik: 7, alignment: 'r', tip: 'miktar' },
					{ attr: 'olasiMiktar', pos: { x: 47, y: 2 }, genislik: 7, alignment: 'r', tip: 'miktar' }
				]
			});
		}

		async dokumVeriArgsDuzenle(e) {
			let result = await super.dokumVeriArgsDuzenle(e);
			if (result === false)
				return false;
			
			const {dokumVeriArgs} = e;
			$.extend(dokumVeriArgs.dokumBaslikDegeriDict, {
				tarih: `TARIH`,
				teslimTarih: `TESLİM`,
				fisNox: `SIP.NO`,
				mustKod: ``,
				mustUnvan: `MUSTERI`,
				stokKod: ``,
				stokAdi: `URUN`,
				brm: `BRM`,
				bekleyenMiktar: `SIP.MIK.`,
				kalanMiktar: `KALAN`,
				olasiMiktar: 'OLASI'
			});

			const getDetay = e => {
				let det = CETDokumVeriDetay.From(e.rec);
				/*$.extend(det.dokumDegeriDict, {
					miktarText(e) { return `${this.miktar.toLocaleString()} ${this.brm}` }
				});*/
				return det;
			};
			const dbMgr = sky.app.dbMgrs.rom_data;
			const brm2TopMiktarYapi = {};
			const detaylar = dokumVeriArgs.detaylar = [];
			let aktifAlmSat, aktifFisNox;
			let stm, rs;
			stm = new MQStm({ sent: new MQUnionAll() });
			sky.app.rapor_bekleyenSiparisler_stmSentDuzenle({ stm: stm, uni: stm.sent, almSat: this.almSat });
			if (stm) {
				rs = await dbMgr.executeSql({ query: stm });
				for (let i = 0; i < rs.rows.length; i++) {
					const rec = rs.rows[i];
					const {almSat, fisNox} = rec;
					rec.tip = 'bekleyenSiparis';
					rec.almSatText = (
						`<div class="grup">` + (
							almSat == `A` ? `Mal Kabul (Alım)` :
							almSat == `T` ? `Sevkiyat (Satış)` :
							``
						) +
						`</div>`
					);
					rec.fisNoxText = (
						`<div class="alt-grup">` +
							`Sipariş: <b style="padding-left: 5px;">${rec.fisNox}</b>` +
						`</div>`
					);
					if (!aktifAlmSat || aktifAlmSat != almSat) {
						let _rec;
						aktifAlmSat = almSat;
						aktifFisNox = null;
						_rec = {
							noGrid: true, grupmu: true,
							almSat: almSat,
							fisNox: (
								almSat == `A` ? `Mal Kabul` :
								almSat == `T` ? `Sevkiyat` :
								``
							),
							tarih: (
								almSat == `A` ? `ALIM` :
								almSat == `T` ? `SATIS` :
								``
							)
						};
						detaylar.push(getDetay({ rec: _rec }));

						_rec = { noGrid: true, fisNox: `========`, tarih: `======` };
						detaylar.push(getDetay({ rec: _rec }));
					}

					if (!aktifFisNox || aktifFisNox != fisNox) {
						let _rec;
						aktifFisNox = fisNox;
						_rec = {
							noGrid: true, grupmu: true, altGrupmu: true,
							fisNoxText: rec.fisNoxText
						};
						detaylar.push(getDetay({ rec: _rec }));

						_rec = { noGrid: true, fisNox: `--------`, tarih: `------` };
						detaylar.push(getDetay({ rec: _rec }));
					}

					if (rec.tarih)
						rec.tarih = dateKisaString(asDate(rec.tarih));
					if (rec.teslimTarih)
						rec.teslimTarih = dateKisaString(asDate(rec.teslimTarih));

					const {idSahalarSiparis} = CETEkOzellikler;
					const ekOzellikValues = [];
					for (const idSaha of idSahalarSiparis) {
						if (idSaha == 'refRafKod')
							continue
						const value = rec[idSaha];
						if (value)
							ekOzellikValues.push(value)
					}
					if (!$.isEmptyObject(ekOzellikValues))
						rec.stokAdi += `  <span class="ekOzelliklerText">[${ekOzellikValues.join(';')}]</span>`;
					
					detaylar.push(getDetay({ rec: rec }));

					const brm = rec.brm || 'AD';
					const miktar = asFloat(rec.miktar) || 0;
					const miktarYapi = brm2TopMiktarYapi[brm] = brm2TopMiktarYapi[brm] || {};
					const keys = ['bekleyenMiktar', 'kalanMiktar'];
					for (const key of keys)
						miktarYapi[key] = (miktarYapi[key] || 0) + (asFloat(rec[key]) || 0);
				}
			}

			let bedelVeriUzunluk;
			$.extend(dokumVeriArgs.dokumDegeriDict, {
				Dip(e) {
					const cizgiLength = e.matbuuForm.formBilgi.sayfaBoyutlari.x;
					const tekCizgi = ''.padEnd(cizgiLength);
					const ciftCizgi = ''.padEnd(cizgiLength);

					const key2MiktarText = {};
					for (const brm in brm2TopMiktarYapi) {
						const miktarYapi = brm2TopMiktarYapi[brm];
						for (const key in miktarYapi) {
							const miktar = miktarYapi[key];
							if (miktar) {
								const textListe = key2MiktarText[key] = key2MiktarText[key] || [];
								textListe.push(`${miktar.toLocaleString()} ${brm}`);
							}
						}
					}
					
					let satirlar = [];
					let bilgiVarmi = false;
					// satirlar.push('');
					satirlar.push(ciftCizgi);
					const ciftCizgiIndex = satirlar.length - 1;
					if (!$.isEmptyObject(key2MiktarText)) {
						const ekleDizi = [];
						if (key2MiktarText.bekleyenMiktar)
							ekleDizi.push(`- BEK: ${key2MiktarText.bekleyenMiktar}`);
						if (key2MiktarText.kalanMiktar)
							ekleDizi.push(`- KAL: ${key2MiktarText.kalanMiktar}`);
						
						if (!$.isEmptyObject(ekleDizi)) {
							bilgiVarmi = true;
							satirlar.push(CrLf);
							satirlar.push(...ekleDizi);
						}
					}
					if (!bilgiVarmi && ciftCizgiIndex > -1)
						satirlar.splice(ciftCizgiIndex, 1);
					
					return satirlar;
				}
			});
		}

		async tazeleSonrasi(e) {
			await super.tazeleSonrasi(e);

			const {part} = e;
			part.divListe.jqxDataTable('groups', [`almSatText`, `fisNoxText`]);
		}
	};
	window.CETRapor_BekleyenSiparisler_Sevkiyat = class extends window.CETRapor_BekleyenSiparisler {
		static get kod() { return 'BEKLEYEN_SIPARISLER_SEVKIYAT' }
		static get aciklama() { return 'Bekleyen Siparişler: SEVKİYAT (SATIŞ)' }
		get almSat() { return 'T' }
	};
	window.CETRapor_BekleyenSiparisler_MalKabul = class extends window.CETRapor_BekleyenSiparisler {
		static get kod() { return 'BEKLEYEN_SIPARISLER_MALKABUL' }
		static get aciklama() { return 'Bekleyen Siparişler: MAL KABUL (ALIM)' }
		get almSat() { return 'A' }
	};
	window.CETRapor_Ozet = class extends window.CETRaporGridli {
		static get kod() { return 'OZET' }
		static get aciklama() { return 'Özet Rapor' }
		async matbuuFormArgsDuzenle(e) {
			await super.matbuuFormArgsDuzenle(e); const {matbuuFormArgs} = e, {formBilgi} = matbuuFormArgs;
			const maxX = formBilgi.sayfaBoyutlari.x = 65, etiketGenislik = 13;
			const normalSahalar = matbuuFormArgs.normalSahalar = matbuuFormArgs.normalSahalar || {};
			$.extend(normalSahalar, {
				Detay: [
					{ attr: 'etiket', pos: { x: 1, y: 1 }, genislik: etiketGenislik },
					{ attr: 'veri', pos: { x: etiketGenislik + 2, y: 1 }, genislik: (maxX - (etiketGenislik + 2)) }
				]
			})
		}
		async liste_columnsDuzenle(e) {
			const {listeColumns} = e;
			listeColumns.push(
				{
					datafield: 'etiket', text: ' ', width: 100,
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				},
				{
					datafield: 'veri', text: ' ',
					cellClassName: (rowIndex, columnField, value, rec) =>
						this.getCellClassName($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec })),
					cellsRenderer: (rowIndex, columnField, value, rec) =>
						this.getCellsRenderer($.extend({}, e, { rowIndex: rowIndex, columnField: columnField, value: value, rec: rec }))
				}
			)
		}
		async dokumVeriArgsDuzenle(e) {
			let result = await super.dokumVeriArgsDuzenle(e);
			if (result === false)
				return false
			const {app} = sky, {dokumVeriArgs} = e, {dokumBaslikDegeriDict} = dokumVeriArgs;
			$.extend(dokumBaslikDegeriDict, { etiket: ' ', veri: ' ' });
			const getDetay = e =>
				CETDokumVeriDetay.From(e.rec ?? e);
			const dbMgr = sky.app.dbMgrs.rom_data, detaylar = dokumVeriArgs.detaylar = [];

			let stm = new MQStm({ sent: new MQUnionAll() });
			app.rapor_ozet_stmSentDuzenle({ stm, uni: stm.sent });
			let recs = await dbMgr.executeSqlReturnRowsBasic(stm);
			detaylar.push(
				getDetay({ rec: { grupmu: true, veri: '- ÖZET RAPORU -' } }),
				getDetay({ rec: { veri: ' ' } })
			);
			const mustKodSet = {}, tip2BelgeSayi = {}, dvKod2ToplamBedel = {};
			for (let i = 0; i < recs.length; i++) {
				const rec = recs[i], {tip, sayi} = rec, mustKod = rec.mustkod, bedel = asFloat(rec.toplambedel) || 0;
				let dvKod = rec.dvkod || 'TL';
				mustKodSet[mustKod] = true;
				tip2BelgeSayi[tip] = (tip2BelgeSayi[tip] || 0) + sayi;
				dvKod2ToplamBedel[dvKod] = (dvKod2ToplamBedel[dvKod] || 0) + bedel
			}
			const tip2Etiket = { fatura: 'Fatura', irsaliye: 'İrsaliye', siparis: 'Sipariş', tahsilat: 'Tahsilat', ugrama: 'Uğrama' };
			const belgeSayiTextListe = [], ciroTextListe = [];
			for (const [tip, belgeSayi] of Object.entries(tip2BelgeSayi)) {
				if (!belgeSayi)
					continue
				const tipAdi = tip2Etiket[tip] ?? tip;
				belgeSayiTextListe.push(`${belgeSayi.toLocaleString()} ${tipAdi}`)
			}
			for (const [dvKod, bedel] of Object.entries(dvKod2ToplamBedel))
				ciroTextListe.push(`${bedelStr(bedel)} ${dvKod}`)
			const bosDegilseEkle = (etiket, veri) => {
				if ($.isEmptyObject(veri))
					return
				if (typeof veri == 'object' && !$.isArray(veri))
					veri = Object.keys(veri)
				if ($.isArray(veri))
					veri = veri.length
				detaylar.push(getDetay({ etiket: etiket, veri: veri }))
			}
			bosDegilseEkle('Müşteri', mustKodSet);
			bosDegilseEkle('Belge', belgeSayiTextListe.filter(x => !!x).join(', '))
			bosDegilseEkle('Ciro', ciroTextListe.filter(x => !!x).join(' | '))
		}
	};
})()
