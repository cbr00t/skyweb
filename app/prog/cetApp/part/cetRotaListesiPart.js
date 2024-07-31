(function() {
	window.CETRotaListesiPart = class extends window.CETListeOrtakPart {
		static get partName() { return 'cetRotaListesi' }
		/* get partRoot() { return `../app/prog/cetApp/part/` } */
		get adimText() { return 'Rota Listesi' }
		constructor(e) {
			e = e || {};
			super(e);
			this.idSaha = null;
			this.bugunRotalarimi = e.bugunRotalarimi ?? false;
			if (!(this.layout || this.template))
				this.template = this.app.templates.rotaListesi
		}
		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);
			await this.initIslemTuslari(e);
			await this.initToolbar(e)
		}
		async listeArgsDuzenle(e) {
			await super.listeArgsDuzenle(e);
			$.extend(e.listeArgs, {
				pageable: true, showToolbar: false, filterable: true,
				serverProcessing: true, filterMode: 'default',
				height: $(window).height() - 100
			})
		}
		async liste_columnsDuzenle(e) {
			await super.liste_columnsDuzenle(e);
			const {app} = sky, {rotaDevreDisiGosterilirmi} = app, {listeColumns} = e;
			listeColumns.push({
				text: 'Müşteri', align: 'left', dataField: 'unvan',
				cellsRenderer: (rowIndex, columnIndex, value, rec) => {
					const divSatir = this.newListeSatirDiv({ cssSubClass: 'asil' });
					divSatir.attr('data-index', rowIndex);
					$.each(rec, (key, value) => {
						const item = divSatir.find(`.${key}`);
						if (item.length)
							item.html(value);
					});
					if (rec.yore)
						divSatir.find(`.yore`).removeClass(`jqx-hidden`);
					if (rec.ilAdi)
						divSatir.find(`.ilAdiParent`).removeClass(`jqx-hidden`);
					
					const {konTipKod, konSubeAdi} = rec;
					if (konTipKod) {
						divSatir.find(`.konTipText`).html(app.konsolideTip2Aciklama(konTipKod) || '');
						const parent = divSatir.find(`.konTipTextParent`);
						parent.addClass(`konTip-${konTipKod}`);
						parent.removeClass(`jqx-hidden`)
					}
					if (konSubeAdi) {
						divSatir.find(`.konSubeAdi`).html(konSubeAdi);
						divSatir.find(`.konSubeAdiParent`).removeClass(`jqx-hidden`)
					}

					if (asBool(rec.rotaDevreDisimi))
						divSatir.addClass(`rotaDevreDisi`);
					if (asInteger(rec.kayitSayisi))
						divSatir.addClass(`kayitVar`);

					return divSatir[0].outerHTML.trim();
				}
			});
			if (!app.bakiyeRiskGosterilmezmi) {
				listeColumns.push({
					text: 'İşlem', align: 'left', dataField: null, width: $(window).width() < 550 ? 85 : 150,
					cellsRenderer: (rowIndex, columnIndex, value, rec) => {
						let divSatir = this.newListeSatirDiv({ cssSubClass: 'islemler' });
						divSatir.attr('data-index', rowIndex);
						$.each(rec, (key, value) => {
							let item = divSatir.find(`.${key}`);
							if (item.length)
								item.html(value);
						});

						const ekleyici = e => {
							if (!e.value)
								return null;

							const {selector, valueGetter} = e;
							let elm = divSatir.find(selector);
							if (elm.length) {
								// elm.addClass(`.${selector.slice(1)}Parent`);
								let value = $.isFunction(valueGetter)
													? valueGetter.call(this, e.value)
													: (valueGetter || e.value);
								if (value) {
									elm.html(value);
									elm.removeClass('jqx-hidden');
								}
								else {
									elm.addClass('jqx-hidden');
								}

								return elm;
							}
							return null;
						}
						ekleyici({
							selector: `.kayitSayisiVefisSonucText`, value: rec,
							valueGetter: val => (
								(rec.kayitSayisi ? `<span class="kayitSayisiText veri">${rec.kayitSayisi.toLocaleString()}</span> <span class="etiket">belge</span>` : ``) +
								(rec.fisSonuc ? `<br/><span class="fisSonucText veri">${bedelStr(rec.fisSonuc)} TL</span>` : ``)
							)
						});
						
						const bakiye = asFloat(rec.bakiye) || 0;
						const kalanRisk = rec.riskLimiti ? bedel(rec.riskLimiti - rec.riskli) : null;
						const kalanTakipBorc = rec.takipBorcLimiti ? bedel(rec.takipBorcLimiti - rec.takipBorc) : null;
						let divBakiyeVeRiskText = ekleyici({
							selector: `.bakiyeVeRiskText`, value: rec,
							valueGetter: rec => {
								return (
									(rec.bakiye ? `<span class="bakiyeText etiket">B:</span><span class="veri bakiye">${bedelStr(bakiye)}</span>` : ``) +
									(kalanRisk ? ` <span class="kalanRiskText etiket">KR:</span><span class="veri kalanRisk">${bedelStr(kalanRisk)}</span>` : ``) +
									(kalanTakipBorc ? ` <span class="kalanTakipBorcText etiket">KTP:</span><span class="veri kalanTakipBorc">${bedelStr(kalanTakipBorc)}</span>` : ``)
								)
							}
						});
						if (divBakiyeVeRiskText && divBakiyeVeRiskText.length) {
							divBakiyeVeRiskText.find('.bakiye').addClass(bakiye < 0 ? 'red' : 'blue');
							divBakiyeVeRiskText.find('.kalanRisk').addClass(kalanRisk < 0 ? 'red' : '');
							divBakiyeVeRiskText.find('.kalanTakipBorc').addClass(kalanTakipBorc < 0 ? 'red' : '');
						}

						if (asInteger(rec.kayitSayisi))
							divSatir.addClass(`kayitVar`);

						return divSatir[0].outerHTML.trim();
					}
				});
			}
			listeColumns.push(
				{
					text: ' ', align: 'right', dataField: 'rotaDisimi', width: $(window).width() < 550 ? 30 : 38, filterable: false,
					cellsRenderer: (rowIndex, columnIndex, value, rec) => {
						let divSatir = this.newListeSatirDiv({ cssSubClass: 'indicators' });
						divSatir.attr('data-index', rowIndex);
						let setItem = e => {
							let item = divSatir.find(e.selector);
							if (item.length) {
								if (e.visible)
									item.removeClass(`basic-hidden jqx-hidden`);
								if (e.value != null)
									item.html(e.value);
								if (e.cssClassName != null) {
									item.addClass(e.cssClassName);
									divSatir.addClass(e.cssClassName);
								}
							}
						};
						if (this.app.eIslemKullanilirmi) {
							setItem({
								selector: `.eIslem`,
								visible: true,
								value: asBool(rec.efatmi) ? `E` : `A`,
								cssClassName: () => {
									let result = '';
									result += 'eIslem ';
									result += asBool(rec.efatmi) ? 'eFatura' : 'eArsiv';
									return result;
								}
							});
						}
						if (asBool(rec.herGunmu)) {
							setItem({
								selector: `.herGun`,
								visible: true,
								cssClassName: `herGun`
							});
						}
						if (asBool(rec.rotaDevreDisimi)) {
							setItem({
								selector: `.rotaDevreDisi`,
								visible: true,
								cssClassName: `rotaDevreDisi`
							});
							divSatir.addClass(`rotaDevreDisi`);
						}
						/*if (this.app.eIslemKullanilirmi)
							setVisible(asBool(rec.efatmi) ? '.eFatura' : '.eArsiv');
						if (asBool(rec.herGunmu))
							setVisible('.herGun');*/
						/*if (asBool(rec.rotaDisimi))
							setVisible('.rotaDisi');*/

						if (asInteger(rec.kayitSayisi))
							divSatir.addClass(`kayitVar`);

						return divSatir[0].outerHTML.trim();
					}
				},
				{ text: 'Müşteri Kodu', align: 'left', dataField: 'kod', hidden: true },
				{ text: 'VKN', align: 'left', dataField: 'vkn', hidden: true },
				{ text: 'Yöre', align: 'left', dataField: 'yore', hidden: true },
				{ text: 'İl', align: 'left', dataField: 'ilKod', hidden: true },
				{ text: 'İl Adı', align: 'left', dataField: 'ilAdi', hidden: true },
				{ text: 'Konsolide Tip', align: 'left', dataField: 'konTipKod', hidden: true },
				{ text: 'Konsolide Şube Adı', align: 'left', dataField: 'konSubeAdi', hidden: true }
			);
		}
		
		loadServerData_buildQuery(e) {
			const wsArgs = e.duzWSArgs = $.extend({}, e.wsArgs, { rowCountOnly: e.rowCountOnly });
			wsArgs.filters = this.getFiltersFromListeWSArgs(wsArgs);
			if (wsArgs.sortdatafield == 'unvan1' || wsArgs.sortdatafield == 'unvan2')
				wsArgs.sortdatafield == 'unvan'
			const {app, islemGorenlermi, bugunRotalarimi} = this;
			if (islemGorenlermi === true) {
				for (const key of ['pagenum', 'pagesize'])
					delete wsArgs[key]
			}
			let sent = new MQSent({
				from: `mst_Cari car`,
				sahalar: (e.rowCountOnly
					? `COUNT(*) sayi`
					: [
						`car.rowid`, `car.kod`, `car.unvan`, `car.adres`, `car.yore`, `car.ilKod`, `car.ilAdi`, `car.vkn`,
						`car.konTipKod`, `car.konSubeAdi`, `car.efatmi`, `car.herGunmu`, `car.rotaDisimi`, `car.rotaDevreDisimi`,
						`car.bakiye`, `car.riskLimiti`, `car.riskli`, 'car.takipBorcLimiti', 'car.takipBorc'
					  ])
						/*[	'car.rowid', 'car.*' ])*/
			});
			const {rotaDevreDisiGosterilirmi} = app;
			if (!rotaDevreDisiGosterilirmi)
				sent.where.add(`car.rotaDevreDisimi = 0`)
			if (bugunRotalarimi) {
				sent.where.add(`car.rotaDisimi = 0`, `car.herGunmu = 0`);
				const {defaultPlasiyerKod} = app;
				if (defaultPlasiyerKod)
					sent.where.degerAta(defaultPlasiyerKod, 'car.plasiyerKod')
			}
			let stm = new MQStm({
				sent: sent,
				orderBy: wsArgs.sortdatafield
							? null
							: ['rotaDisimi', 'herGunmu', 'seq']
			});
			stm.fromGridWSArgs(wsArgs);
			return stm
		}
		async loadServerData_ekIslemler(e) {
			e = e || {};
			let result = await super.loadServerData_ekIslemler(e);
			if (result)
				return result
			let {recs} = e;
			const kod2Rec = {};
			for (const i in recs) {
				const rec = recs[i];
				kod2Rec[rec.kod] = rec
			}
			const dbMgr = sky.app.dbMgrs.rom_data;
			let stm = this.buildQuery_fisIslemleri({ recs: recs, duzWSArgs: e.duzWSArgs || e.wsArgs });
			let _recs = await dbMgr.executeSqlReturnRows({ tx: e.tx, query: stm });
			_recs.forEach(_rec => {
				const kod = _rec.mustKod;
				const rec = kod2Rec[kod];
				if (rec) {
					for (const key of ['topKdv', 'fisSonuc', 'kayitSayisi'])
						rec[key] = (rec[key] || 0) + (_rec[key] || 0)
				}
			})
			const {islemGorenlermi, bugunRotalarimi} = this;
			if (islemGorenlermi != null) {
				recs = e.recs = recs.filter(rec =>
					islemGorenlermi ? !!rec.kayitSayisi : !rec.kayitSayisi);
				e.totalRecs = recs.length
			}
			return false
		}
		buildQuery_fisIslemleri(e) {
			const recs = e.recs;
			const idListe = recs.map(rec => rec.kod);
			let uni = new MQUnionAll();
			let stm = new MQStm({ sent: uni });
			
			let _e = $.extend({ stm: stm, uni: uni, recs: recs, mustKodListe: idListe }, e.duzWSArgs);
			this.app.rotaListe_fisIslemleri_stmSentDuzenle(_e);

			return stm;
		}

		
		liste_satirCiftTiklandi(e) {
			if ((this.listeWidget.getSelection() || []).length) {
				let {islemTuslariPart} = this;
				islemTuslariPart.itemClicked(`#fisListesi`);
			}
			// super.liste_satirCiftTiklandi(e);			
		}

		/*liste_renderToolbar(e) {
			const layout = e.layout || this.layout;
			let toolbar = e.listeToolbar;
			let divIslemTuslari = toolbar.find('.toolbar.islemTuslari');
			if (!divIslemTuslari.length) {
				divIslemTuslari = this.template_listeParts.contents('.toolbar.islemTuslari').clone(true);
				divIslemTuslari.appendTo(toolbar);

				let liItems = divIslemTuslari.find('ul > li');
				divIslemTuslari.jqxMenu({
					theme: theme, mode: 'horizontal',
					animationShowDuration: 0, animationHideDuration: 0
				});
				liItems.on('click', evt =>
					this.liste_islemTusuTiklandi($.extend({}, e, { event: evt })));
			}
		}*/

		initIslemTuslari(e) {
			e = e || {};
			const {app} = this;
			const layout = e.layout || this.layout;
			let {islemTuslariPart} = this;
			if (!islemTuslariPart) {
				islemTuslariPart = this.islemTuslariPart = new CETExpandableIslemTuslariPart({
					/* position: ``, */
					templateItems: layout.find(`.toolbar-external.islemTuslari`),
					onItemClicked: async e => await this.liste_islemTusuTiklandi(e)
				});
				islemTuslariPart.basicRun();
			}

			let {ozelIslemTuslariPart} = this;
			if (!ozelIslemTuslariPart) {
				ozelIslemTuslariPart = this.ozelIslemTuslariPart = new CETExpandableIslemTuslariPart({
					position: `bottom right`,
					mode: 'menu',
					templateItems: layout.find(`.toolbar-external.islemTuslari-ozel`),
					onItemClicked: async e => await this.liste_islemTusuTiklandi(e)
				});
				ozelIslemTuslariPart.basicRun();
				
				/*parentMenu = ozelIslemTuslariPart.parentMenu;
				parentMenu.find(`#yeni`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Yeni Belge` });
				parentMenu.find(`#yeniSablonlu`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Ticari programda <b>Yeni Fiş Yöntemi</b> adımından tanımlanmış yöntemlerden biri seçilerek, başlık bilgileri atanmış durumda, doğrudan yeni fiş girişine başlanır` });
				parentMenu.find(`#degistir`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Belge Değiştir/İzle` });
				parentMenu.find(`#iptal`).jqxTooltip({ theme: theme, trigger: `hover`, position: `top`, content: `Belge <span class="bold">SİL</span>` });*/
			}

			if (!app.musteriDurumuKullanilirmi) {
					setTimeout(() => {
						const menuItems = islemTuslariPart.parentMenu.find(`.item`);
						const item = menuItems.filter(`#musteriDurumu.item`);
						if (item.length)
							item.remove();
					}, 100);
				}
		}

		initToolbar(e) {
			e = e || {};
			const layout = e.layout || this.layout;
			const chkIslemGorenlermi = this.chkIslemGorenlermi = layout.find(`.toolbar-ust #chkIslemGorenlermi`)
				.jqxCheckBox({ theme: theme, hasThreeStates: true, checked: this.islemGorenlermi });
			chkIslemGorenlermi.on(`change`, evt => {
				const eArgs = (evt || {}). args;
				if (!this.disableEventsFlag && eArgs) {
					this.islemGorenlermi = eArgs.checked;
					this.tazele()
				}
			});
			const chkBugunRotalarimi = this.chkBugunRotalarimi = layout.find('.toolbar-ust #chkBugunRotalarimi')
			chkBugunRotalarimi.jqxCheckBox({ theme: theme, checked: this.bugunRotalarimi });
			chkBugunRotalarimi.on(`change`, evt => {
				const eArgs = (evt || {}). args;
				if (!this.disableEventsFlag && eArgs) {
					this.bugunRotalarimi = eArgs.checked;
					this.tazele()
				}
			});
		}

		async liste_islemTusuTiklandi(e) {
			let id = e.id;
			//let rec = this.selectedRec;
			// displayMessage(`<ul style="padding: 8px;"><li>clicked: [${elm.innerHTML}]</li><li>activeRec: [(${(rec || {}).kod}) - ${(rec || {}).unvan}]</li>`);

			switch (id) {
				case 'fisListesi':
					await this.fisListesiIstendi(e);
					break;
				case 'musteriDurumu':
					await this.musteriDurumuIstendi(e);
					break;
			}
		}

		async fisListesiIstendi(e) {
			e = e || {};
			let rec = (this.listeWidget.getSelection() || [])[0];
			if (!rec)
				return false

			if (asBool(rec.devreDisimi || rec.rotaDevreDisimi)) {
				displayMessage(`Bu müşteri için işlem yapılamaz`, `@ UYARI @`);
				return false
			}
			
			// let elm = e.event.currentTarget;
			// displayMessage(`<ul style="padding: 8px;"><li>clicked: [<b>${elm.id}</b> - ${elm.innerHTML}]</li><li>activeRec: [(${(rec || {}).kod}) - ${(rec || {}).unvan}]</li>`);
			
			(savedProcs || window).showProgress(null, null, 1, true);
			setTimeout(() =>
				(savedProcs || window).hideProgress(null, null, 1, true), 500);
			await new CETFisListePart({
				parentPart: this,
				// mustRec: rec,
				mustKod: rec.kod,
				geriCallback: e => this.tazele(e)
			}).run();
		}

		async musteriDurumuIstendi(e) {
			let rec = (this.listeWidget.getSelection() || [])[0];
			if (!rec)
				return false

			if (asBool(rec.devreDisimi || rec.rotaDevreDisimi)) {
				displayMessage(`Bu müşteri için işlem yapılamaz`, `@ UYARI @`);
				return false
			}
			
			return await new CETMusteriDurumuPart({
				parentPart: this,
				mustKod: rec.kod,
				geriCallback: _e =>
					this.tazele(e)
			}).run();
		}
	}
})()
