(function() {
	window.CETBekleyenSiparislerListePart = class extends window.CETListeOrtakPart {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				hepsimi: asBool(e.hepsimi),
				almSat: e.almSat,
				mustKod: e.mustKod,
				ayrimTipi: e.ayrimTipi,
				sevkAdresKod: e.sevkAdresKod
			});

			if (!(this.layout || this.template))
				this.template = this.app.templates.bekleyenSiparislerListe;
		}

		static get canDefer() { return false }
		static get canDestroy() { return false }
		static get partName() { return 'cetBekleyenSiparislerListe' }
		get adimText() { return 'Bekleyen Siparişler' }


		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);

			const layout = e.layout || this.layout;
			const divHeader = layout.find(`.header`);

			const chkHepsi = divHeader.find(`#chkHepsi_parent #chkHepsi`);
			const hepsimi_degisti = evt => {
				const flag = chkHepsi.is(':checked');
				chkHepsi.parent()[flag ? 'addClass' : 'removeClass']('checked');
			};
			chkHepsi.prop('checked', this.hepsimi);
			hepsimi_degisti();
			chkHepsi
				.off('change')
				.on('change', evt => {
					hepsimi_degisti(evt);
					this.hepsimi = chkHepsi.is(':checked');
					this.tazele();
				});
		}

		async activatePart(e) {
			e = e || {};
			await super.activatePart(e);

			await this.tazele();
		}

		async tazele(e) {
			this.listeWidget.clearSelection();
			this.selectedIndexes = {};
			let result = await super.tazele();
			setTimeout(() => this.listeWidget.clearSelection(), 200);
			return result;
		}

		async listeArgsDuzenle(e) {
			await super.listeArgsDuzenle(e);
			
			$.extend(e.listeArgs, {
				height: $(window).height() - 100, selectionMode: 'custom',
				pageable: true, showToolbar: false, filterable: true,
				serverProcessing: true, filterMode: 'default',
				pageSize: 4, groups: [`fisNoxText`]
			});
		}

		async liste_columnsDuzenle(e) {
			await super.liste_columnsDuzenle(e);
			
			$.merge(e.listeColumns, [
				/*{
					text: 'Ürün Adı', align: 'left', dataField: 'cellText',
					cellsRenderer: (rowIndex, columnIndex, value, rec) => {
						rec = rec.originalRecord || rec;	
						const divSatir = this.newListeSatirDiv(e);
						divSatir.attr('data-index', rowIndex);
						for (const key in rec) {
							const value = rec[key];
							const item = divSatir.find(`.${key}`);
							if (item.length)
								item.html(value);
							
							if (!this.mustKod)
								divSatir.find(`.must.parent`).removeClass(`jqx-hidden`);
							if (rec.teslimTarih)
								divSatir.find(`.tarihVeFisNox.parent .teslimTarihParent.parent`).removeClass(`jqx-hidden`);
						}
						return divSatir[0].outerHTML.trim();
					}
				},*/
				{ text: 'Ürün', dataField: 'cellText', align: 'left'},
				{ text: 'Tarih', dataField: 'tarih', hidden: true },
				{ text: 'Belge Seri-No', dataField: 'fisNox', hidden: true },
				{ text: 'Müşteri Ünvan', dataField: 'mustUnvan', hidden: true },
				{ text: 'Müşteri Kodu', dataField: 'mustKod', hidden: true },
				// { text: 'Ürün Adı', dataField: 'stokAdi', hidden: true },
				{ text: 'Ürün Kodu', dataField: 'stokKod', hidden: true },
				{ text: 'Ödeme Gun Kod', dataField: 'odemeGunKod', hidden: true },
				{ dataField: 'fisNoxText', hidden: true, filterable: false }
			]);
		}
		
		loadServerData_buildQuery(e) {
			const {app, hepsimi, sevkAdresKod, ayrimTipi} = this;
			const {rowCountOnly} = e;
			const wsArgs = $.extend({}, e.wsArgs, { rowCountOnly: e.rowCountOnly });
			wsArgs.filters = this.getFiltersFromListeWSArgs(wsArgs);
			if (wsArgs.sortdatafield == 'cellText')
				wsArgs.sortdatafield = null;
			wsArgs.sortdatafield = wsArgs.sortdatafield || [`tarih`, `fisNox`, `stokKod`, `vioID`];	 		/* || ['tarih', 'seri', 'fisno'] */

			let sent = new MQSent({
				from: `data_BekleyenSiparisler har`,
				fromIliskiler: [
					{ alias: 'har', leftJoin: 'mst_NakliyeSekli nak', on: [`har.nakSekliKod = nak.kod`] },
					{ alias: 'har', leftJoin: 'mst_SevkAdres sadr', on: [`har.teslimYerKod = sadr.kod`, `har.mustKod = sadr.mustKod`] },
					{ alias: 'har', leftJoin: 'mst_TahsilSekli tsek', on: [`har.tahSekliKodNo = tsek.kodNo`] },
					{ from: 'mst_Cari car', iliski: `har.mustKod = car.kod` },
					{ from: 'mst_Stok stk', iliski: `har.stokKod = stk.kod` }
				],
				where: [
					`har.kalanMiktar > 0`,
					ayrimTipi == null
						? `1 = 1`
						: { degerAta: ayrimTipi, saha: `har.ayrimTipi` },
					( hepsimi || sevkAdresKod == null )
						? `1 = 1`
						: { degerAta: sevkAdresKod, saha: `har.teslimYerKod` }
				],
				sahalar: (rowCountOnly
					? [`COUNT(*) sayi`]
					: [	`har.vioID`, `har.tarih`,
					    `har.teslimTarih`, `har.teslimYerKod`, `sadr.aciklama teslimYerAdi`, `har.nakSekliKod`, `nak.aciklama nakSekliAdi`,
					    `sadr.aciklama teslimYerAdi`, `nak.aciklama nakSekliAdi`,
					    `har.odemeGunKod`, `har.tahSekliKodNo`, `tsek.aciklama tahSekliAdi`,
					    `har.fisNox`, `har.almSat`, `har.mustKod`, `car.unvan mustUnvan`, `har.stokKod`, `stk.aciklama stokAdi`,
						`(case when COALESCE(stk.brm, '') = '' then 'AD' else stk.brm end) brm`,
						`SUM(har.bekleyenMiktar) bekleyenMiktar`, `SUM(har.kalanMiktar) kalanMiktar`
					  ]),
				groupBy: rowCountOnly
					? null
					: [
						`har.vioID`, `har.almSat`, `har.tarih`, `har.fisNox`, `har.stokKod`
					  ]
			});
			const {almSat, mustKod} = this;
			if (almSat)
				sent.where.degerAta(almSat, `har.almSat`);
			if (mustKod)
				sent.where.degerAta(mustKod, `har.mustKod`);
			if (!rowCountOnly) {
				let hmrlimi = false;
				if (almSat) {
					switch (almSat) {
						case 'A': hmrlimi = app.depoMalKabulSiparisHMRlimi; break;
						case 'T': hmrlimi = app.depoSevkiyatSiparisHMRlimi; break;
					}
				}
				else {
					hmrlimi = app.depoMalKabulSiparisHMRlimi || app.depoSevkiyatSiparisHMRlimi;
				}

				if (hmrlimi) {
					const {idSahalarSiparis} = CETEkOzellikler;
					for (const i in idSahalarSiparis) {
						const idSaha = idSahalarSiparis[i];
						const clause = `har.${idSaha}`;
						sent.sahalar.add(clause);
						sent.groupBy.add(clause);
					}
				}
			}

			let stm = new MQStm({ sent: sent });
			stm.fromGridWSArgs(wsArgs);

			return stm;
		}

		loadServerData_ekIslemler(e) {
			super.loadServerData_ekIslemler(e);

			const {recs} = e;
			if (!recs)
				return;
			
			for (const i in recs) {
				const rec = recs[i];
				rec.fisNoxText = `<span class="fisNoxParent">Sipariş: <span class="fisNox">${rec.fisNox}</span></span>`;
				rec.cellText = (() => {
					const divSatir = this.newListeSatirDiv(e);
					divSatir.attr('data-index', i);
					for (const key in rec) {
						const value = rec[key];
						const item = divSatir.find(`.${key}`);
						if (item.length)
							item.html(value);
					}
					if (!this.mustKod)
						divSatir.find(`.must.parent`).removeClass(`jqx-hidden`);
					const {teslimTarih, teslimYerKod, teslimYerAdi, nakSekliAdi, odemeGunKod, tahSekliKodNo} = rec;
					const tarihVeFisNoxParent = divSatir.find(`.tarihVeFisNox.parent`);
					const teslimTarihVeYeriParent = tarihVeFisNoxParent.find(`.teslimTarihVeYeriParent.parent`);
					if (teslimTarih || teslimYerKod) {
						teslimTarihVeYeriParent.removeClass(`jqx-hidden`);
						if (teslimTarih)
							teslimTarihVeYeriParent.find(`.teslimTarihParent.parent`).removeClass(`jqx-hidden`);
						if (teslimYerKod)
							teslimTarihVeYeriParent.find(`.teslimYeriParent.parent`).removeClass(`jqx-hidden`);
					}
					if (nakSekliAdi)
						tarihVeFisNoxParent.find(`.nakliyeSekliParent.parent`).removeClass(`jqx-hidden`);
					if (odemeGunKod)
						tarihVeFisNoxParent.find(`.odemeGun.parent`).removeClass(`jqx-hidden`);
					if (tahSekliKodNo)
						tarihVeFisNoxParent.find(`.tahSekli.parent`).removeClass(`jqx-hidden`);

					const idSahalar = CETEkOzellikler.idSahalarSiparis;
					let ekOzellikValues = [];
					for (const i in idSahalar) {
						const key = idSahalar[i];
						const value = rec[key];
						if (value)
							ekOzellikValues.push(value);
					}
					if (!$.isEmptyObject(ekOzellikValues)) {
						const divEkOzelliklerParent = divSatir.find(`.ekOzellikler.parent`);
						if (divEkOzelliklerParent.length) {
							const divEkOzellikler = divEkOzelliklerParent.find(`.ekOzelliklerText`);
							divEkOzellikler.html(ekOzellikValues.map(value => `<span class="ekOzellik">${value}</span>`).join(' ; '));
							divEkOzelliklerParent.removeClass(`jqx-hidden`);
						}
					}
					
					return divSatir[0].outerHTML.trim();
				})()
			}
		}

		async liste_veriYuklendi(e) {
			await super.liste_veriYuklendi(e);

			// const {divListe} = this;
			// setTimeout(() => divListe.jqxDataTable('groups', [`fisNoxText`]), 500);
		}

		liste_selectSavedIndex(e) {
			// super.liste_selectSavedIndex(e);
		}
	}
})()
