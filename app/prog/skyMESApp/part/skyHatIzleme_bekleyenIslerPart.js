(function() {
	window.SkyHatIzleme_BekleyenIslerPart = class extends window.SkyMESWindowPart {
		constructor(e) {
			e = e || {};
			super(e);

			this.noSwitchFlag = e.noSwitch;
			
			let {sadeceUygunAsamami} = e;
			if (sadeceUygunAsamami == null)
				sadeceUygunAsamami = asBoolQ(Utils.cookie('skyMES.bekleyenIslerPart.sadeceUygunAsamami'))
			if (sadeceUygunAsamami == null)
				sadeceUygunAsamami = true
			this.sadeceUygunAsamami = sadeceUygunAsamami;

			const {id2Hat, id2Tezgah, tezgahBilgi} = this.app;
			const hatId = this.hatId = e.hatId;
			const tezgahId = this.tezgahId = e.tezgahId;
			const hatAciklama = id2Hat ? (id2Hat[hatId] || {}).aciklama : '';
			const tezgahAciklama = id2Tezgah ? (id2Tezgah[tezgahId] || {}).aciklama : (tezgahBilgi ? tezgahBilgi.tezgahAciklama : '');
			this.title = e.title || 'Bekleyen İşler';
			this.title += ` - (<span class="gray">${tezgahId || hatId}</span>) ${tezgahId ? tezgahAciklama : (hatAciklama || '')}`;
		}

		static get partName() { return 'bekleyenIsler' }
		get autoHeight_uiSelector() { return null }
		get klavyeAcilirmi() { return false }
		get numKlavyeAcilirmi() { return false }

		async open(e) {
			await super.open(e);

			const {signalHandlers} = this.app;
			const {partName} = this;
			delete signalHandlers[partName];
			signalHandlers[partName] = _e => {
				const {gridPart} = this;
				if (!this.isDestroyed && gridPart && gridPart.widgetPart && gridPart.widgetPart.length)
					gridPart.tazele()
			};
		}

		async close(e) {
			const {signalHandlers} = this.app;
			delete signalHandlers[this.partName];
			
			await super.close(e);
		}
		
		async tazeleDevam(e) {
			await super.tazeleDevam(e);

			const {app, noSwitchFlag, tezgahId, wndContent} = this;
			wndContent.find(`button`).jqxButton({ theme: theme });

			const {btnTazele} = this;
			if (btnTazele && btnTazele.length) {
				btnTazele
					.off('click')
					.on('click', evt =>
						this.gridPart.tazele());
			}
			
			const divHeader = this.divHeader = wndContent.find(`#header`);
			const islemTuslari = this.islemTuslari = divHeader.find(`#islemTuslari`);
			const divFooter = this.divFooter = wndContent.find(`#footer`);
			const islemTuslari_bottom = this.islemTuslari_bottom = divFooter.find(`#islemTuslari-bottom`);

			const siralamaParent = this.siralamaParent = divHeader.find(`#siralamaParent`);
			const ddSiralama = this.ddSiralama = siralamaParent.find(`#ddSiralama`).jqxDropDownList({
				theme: theme, animationType: animationType,
				valueMember: 'kod', displayMember: 'aciklama',
				selectedIndex: 0, searchMode: 'containsignorecase',
				placeHolder: 'Sıralama', filterPlaceHolder: 'Bul:', filterable: false,
				filterHeight: 50, filterDelay: 300, width: 140, height: 40,
				dropDownHeight: 150, autoDropDownHeight: true, itemHeight: 50, scrollBarSize: 18,
				source: new $.jqx.dataAdapter({
					cache: true, id: 'kod', datatype: 'array',
					localdata: [
						{ kod: '', aciklama: `Hat + Oper` },
						{ kod: 'U', aciklama: `Ürün + Oper` }
					]
				}, { autoBind: true, async: true, cache: true })
			});
			ddSiralama.on('change', evt => {
				if (evt && evt.args) {
					const {item} = evt.args;
					const value = (item || {}).value;
					this.siralamaDegisti($.extend({}, e, { event: evt, item: item, value: value }));
				}
			});

			const chkUygunAsama = this.chkUygunAsama = divHeader.find(`#chkUygunAsama`);
			const chkUygunAsama_parent = chkUygunAsama.parent();
			chkUygunAsama_parent[this.sadeceUygunAsamami ? 'addClass' : 'removeClass']('checked');
			chkUygunAsama.off('change');
			chkUygunAsama.prop('checked', this.sadeceUygunAsamami);
			chkUygunAsama.on('change', evt => {
				const flag = this.sadeceUygunAsamami = $(evt.currentTarget).is(':checked');
				Utils.cookie('skyMES.bekleyenIslerPart.sadeceUygunAsamami', flag);
				chkUygunAsama_parent[flag ? 'addClass' : 'removeClass']('checked');
				this.gridPart.tazele()
			});
			
			const btnSiradakiIsler = this.btnSiradakiIsler = islemTuslari.find(`#btnSiradakiIsler`);
			if (noSwitchFlag)
				btnSiradakiIsler.addClass('jqx-hidden');
			else {
				btnSiradakiIsler.off('click');
				btnSiradakiIsler.on('click', async evt => {
					try { await app.tezgahSiradakiIslerIstendi({ event: evt, noSwitch: true, hatId: this.hatId, tezgahId: tezgahId }) }
					finally { this.gridPart.tazele() }
				});
				btnSiradakiIsler.removeClass('jqx-hidden');
			}

			const btnSureDuzenle = this.btnSureDuzenle = islemTuslari.find(`#btnSureDuzenle`);
			btnSureDuzenle.off('click');
			btnSureDuzenle.on('click', evt =>
				this.sinyalSureDuzenleIstendi({ event: evt }));
			btnSureDuzenle.removeClass('jqx-hidden');

			const btnToggleDevreDisi = this.btnToggleDevreDisi = islemTuslari.find(`#btnToggleDevreDisi`);
			btnToggleDevreDisi.off('click');
			btnToggleDevreDisi.on('click', evt => this.toggleDevreDisiIstendi({ event: evt }));

			const btnIsEkleFromOper = this.btnIsEkleFromOper = islemTuslari.find(`#btnIsEkleFromOper`);
			btnIsEkleFromOper.off('click');
			btnIsEkleFromOper.on('click', evt => this.isEkleFromOperIstendi({ event: evt }));

			/*if (!app.programcimi) {
				const list = [btnToggleDevreDisi, btnIsEkleFromOper];
				for (const i in list) {
					const elm = list[i];
					if (elm && elm.length)
						setButonEnabled(elm, false);
				}
			}*/
			
			const btnSirayaAl = this.btnSirayaAl = islemTuslari.find(`#btnSirayaAl`);
			btnSirayaAl.off('click');
			btnSirayaAl.on('click', evt => this.sirayaAlIstendi({ event: evt }));
			
			let {gridPart} = this;
			if (!gridPart || gridPart.isDestroyed) {
				const gridParent = wndContent.find(`.gridParent`);
				let grid = gridParent.find(`#grid`);
				gridPart = this.gridPart = new DataTablePart({
					layout: grid,
					widgetBeforeInit: _e => {
						$.extend(_e.widgetArgs, {
							pageable: true, pageSize: 9, selectionMode: 'custom',
							filterable: true, filterMode: 'default', filterHeight: 35,
							serverProcessing: false
						});
					},
					/*widgetAfterInit: _e => {
						const {widgetPart} = _e;
						widgetPart.on('rowDoubleClick', evt =>
							this.baslatIstendi(e));
					},*/
					columns: [
						{
							dataField: 'fisnox', text: 'İş (No)',
							cellClassName: (rowIndex, columnField, value, rec) => {
								/*const {app, tezgahId} = this;
								let {statu} = rec;
								if (statu == null) {
									const tezgah = app.id2Tezgah[tezgahId];
									statu = (tezgah || {}).durumKod;
								}*/
								const {rotadegisdurum} = rec;
								let result = `fisNox`;
								/*if (statu) {
									if (result)
										result += ' ';
									result += `durum-${statu}`;
								}*/
								if (rotadegisdurum == 'D') {
									if (result)
										result += ' ';
									result += `rotaDurum-devreDisi`;
								}
								if (rotadegisdurum == 'E') {
									if (result)
										result += ' ';
									result += `rotaDurum-sonradanEklendi`;
								}
								return result;
							},
							cellsRenderer: (rowIndex, columnIndex, value, rec) => {
								rec = rec.originalRecord || rec;
								const statu = rec.statu || '';
								const {rotadegisdurum} = rec;
								
								const statuHaricSet = asSet(['', 'BK', 'BT']);
								const aktifIsCSS = statuHaricSet[statu] ? ` jqx-hidden` : '';

								let rotaDurumCSS = ` jqx-hidden`;
								let rotaDurumText = '';
								switch (rotadegisdurum) {
									case 'D':
										rotaDurumCSS = '';
										rotaDurumText += 'devre dışı';
										break;
									case 'E':
										rotaDurumCSS = '';
										rotaDurumText += 'sonradan eklendi';
										break;
								}

								const {sinyalsayisi, sinyaltekilsure, sinyaltoplamsure} = rec;
								const sinyalSayisiGosterilirmi = sinyalsayisi > 1 || sinyaltekilsure > 0 || sinyaltoplamsure > 0;
								
								return (
									`<div>` +
										`<span class="emir etiket">Emir:</span>` +
										`<span class="emir veri">${rec.fisnox}</span>` +
										`<span class="etiket"> Bek:</span>` +
										`<span class="emir veri">${rec.kalanmiktar}</span>` +
										`<span class="statuText${aktifIsCSS}">(aktif iş)</span>` +
										`<span class="rotaDurumText ${rotaDurumCSS}">(${rotaDurumText})</span>` +
									`</div>` +
									`<div>` +
										`<span class="oper etiket">Oper:</span>` +
										`<span class="oper veri">${rec.opno}</span>` +
										`<span>-</span>` +
										`<span class="oper veri">${rec.opadi}</span>` +
										`<span id="sureParent" class="parent${sinyalSayisiGosterilirmi ? '' : ' jqx-hidden'}">` +
											`<span class="etiket-basit">(</span>` +
											`<span id="saymaSayisi" class="veri">${sinyalsayisi}</span>` +
											`<span class="etiket">:</span>` +
											`<span id="saymaArasiSure" class="veri">${sinyaltekilsure}</span>` +
											`<span class="etiket">,</span>` +
											`<span id="saymaSonSure" class="veri">${sinyaltoplamsure}</span>` +
											`<span class="etiket-basit">)</span>` +
										`</span>` +
									`</div>` +
									`<div>` +
										`<span class="etiket">Ürün:</span>` +
										`<span class="urun veri">${rec.urunkod}</span>` +
										`<span>-</span>` +
										`<span class="urun veri">${rec.urunadi}</span>` +
									`</div>`
								)
							},
						},
						{ dataField: 'urunadi', text: 'Ürün Adı', hidden: true },
						{ dataField: 'urunkod', text: 'Ürün Kod', hidden: true },
						{ dataField: 'opadi', text: 'Op. Adı', hidden: true },
						{ dataField: 'opno', text: 'Op. No', hidden: true },
						{
							dataField: 'emirtarih', text: 'Tarih', width: 70,
							/*cellsFormat: 'n', cellsAlign: 'right', cellClassName: 'bold'*/
							cellClassName: (rowIndex, columnField, value, rec) => {
								const {statu} = rec;
								let result = `emirTarih bold`;
								result += statu ? ` statu-${statu}` : ''
								return result;
							},
							cellsRenderer: (rowIndex, columnIndex, value, rec) => {
								return dateKisaString(asDate(value))
							}
						},
						{ dataField: 'kalanmiktar', text: 'Kalan Miktar', hidden: true },
						{ dataField: 'hatkod', text: 'Hat Kod', hidden: true },
						{ dataField: 'hatadi', text: 'Hat Adı', hidden: true },
						{ dataField: 'oemsayac', text: 'OEM Sayac', hidden: true }
					],
					loadServerData: async e => {
						const {app, hatId, siraTipi, sadeceUygunAsamami} = this;
						const {wsArgs} = e;

						let {tezgahId} = this;
						if (!tezgahId && hatId) {
							const {hat2Tezgahlar} = app;
							tezgahId = Object.keys(hat2Tezgahlar[hatId] || [])[0];
						}

						$.extend(wsArgs, {
							hatId: hatId, tezgahId: tezgahId,
							siraTipi: siraTipi == null ? '' : siraTipi,
							sadeceUygunAsamami: sadeceUygunAsamami
						});
						
						let recs;
						try {
							recs = await app.wsBekleyenIsler(wsArgs);
							recs = recs.rows || recs;

							const {id2Hat} = app;
							for (const i in recs) {
								const rec = recs[i];
								const hatKod = rec.hatkod;
								const hat = id2Hat[hatKod];
								const hatAdi = (hat || {}).hatAciklama;
								rec.hatadi = hatAdi;
							}
							
							/*if (!$.isEmptyObject(recs)) {
								recs[0].rotadegisdurum = 'D';
								if (recs.length > 1)
									recs[1].rotadegisdurum = 'E';
							}*/
						}
						catch (ex) {
							((window.savedProcs || {}).hideProgress || hideProgress)();
							// defFailBlock(ex);
							throw ex;
						}
						return recs
					},
					itemClick: e =>
						this.liste_onItemClick(e),
					itemOnContextMenu: e =>
						this.liste_onItemContextMenu(e),
					bindingComplete: e =>
						this.liste_veriYuklendi(e)
				});
				gridPart.basicRun();
				gridPart.layout
					.detach()
					.appendTo(gridParent);
			}
		}

		close_araIslemler(e) {
			super.close_araIslemler(e);
			
			const {gridPart} = this;
			if (gridPart && gridPart.layout && !gridPart.isDestroyed)
				gridPart.destroyPart();
		}

		wndArgsDuzenle(e) {
			super.wndArgsDuzenle(e);

			const size = {
				width: Math.min(900, $(window).width() - 1),
				height: $(window).height() - this.header.height() - 23
			};
			$.extend(e.args, {
				isModal: false, width: size.width, height: size.height
				// minWidth: size.width - 20, minHeight: size.height
			});
		}

		tamamIstendi_argsDuzenle(e) {
			let result = super.tamamIstendi_argsDuzenle(e);
			if (result === false || (result && result.isError))
				return result;
			
			/*const {gridPart} = this;
			let recs = gridPart.widget.getSelection();
			let rec = $.isEmptyObject(recs) ? null : recs[0];
			if (!rec)
				return { isError: true, errorText: 'Bir İş seçilmelidir' };
			
			const {args} = e;
			args.rec = rec;*/
		}

		siralamaDegisti(e) {
			const {gridPart} = this;
			const {value} = e;
			this.siraTipi = value;
			if (!this.isDestroyed && gridPart && gridPart.widgetPart && gridPart.widgetPart.length)
				gridPart.tazele();
		}
		
		async toggleDevreDisiIstendi(e) {
			e = e || {};
			const {app, gridPart} = this;
			const {widget} = gridPart;
			const recs = widget.getSelection();
			const rowCount = recs.length;

			app.hideNotifications();
			if (!rowCount) {
				displayMessage(`<b>Aktif/Devre Dışı yapılacak İş(ler)</b> seçilmelidir!`);
				return;
			}

			const target = (e.event || {}).currentTarget;
			if (target)
				setButonEnabled($(target), false);
			// showProgress(`İş${rowCount > 1 ? '(ler)' : ''} Aktif/Devre Dışı durumu ayarlanıyor...`, null, 1);
			try {
				const oemSayacListe = recs.map(rec => rec.oemsayac);
				await app.wsBekleyenIs_devredisiYapKaldir({ hatId: this.hatId, tezgahId: this.tezgahId, oemSayacListe: oemSayacListe.join('|') });
				// await gridPart.tazele();
				app.signalChangeExternal();
			}
			catch (ex) {
				((window.savedProcs || {}).hideProgress || hideProgress)();
				defFailBlock(ex);
				throw ex;
			}
			finally {
				if (target)
					setButonEnabled($(target), true);
				setTimeout(() => hideProgress(), 1000);
				hideProgress();
			}
		}

		async isEkleFromOperIstendi(e) {
			e = e || {};
			const {app, gridPart} = this;
			const {widget} = gridPart;

			const recs = gridPart.widget.getSelection();
			const rec = $.isEmptyObject(recs) ? null : recs[0];

			app.hideNotifications();
			if (!rec)
				displayMessage(`Bir İş seçilmelidir`);
			
			const oemSayac = (rec || {}).oemsayac;
			const result = await app.tezgahOperSecIstendi({ hatId: this.hatId, tezgahId: this.tezgahId, oemSayac: oemSayac }) || {};
			const {urunAgacinaEkleFlag} = result;
			const opRecs = result.recs;
			const rowCount = opRecs.length;

			const target = (e.event || {}).currentTarget;
			if (target)
				setButonEnabled($(target), false);
			// showProgress(`İş${rowCount > 1 ? '(ler)' : ''} ekleniyor...`, null, 1);
			try {
				const opNoListe = opRecs.map(rec => rec.opNo);
				await app.wsYeniOperListeEkle({
					hatId: this.hatId,
					tezgahId: this.tezgahId,
					oemSayac: oemSayac,
					urunAgacinaEkleFlag: urunAgacinaEkleFlag,
					opNoListe: opNoListe.join('|')
				});
				// await gridPart.tazele();
				app.signalChangeExternal();
			}
			catch (ex) {
				((window.savedProcs || {}).hideProgress || hideProgress)();
				defFailBlock(ex);
				throw ex;
			}
			finally {
				if (target)
					setButonEnabled($(target), true);
				setTimeout(() => hideProgress(), 1000);
				hideProgress();
			}
		}

		async sirayaAlIstendi(e) {
			e = e || {};
			const {app, gridPart} = this;
			const {widget} = gridPart;
			const recs = widget.getSelection();
			const rowCount = recs.length;

			app.hideNotifications();
			if (!rowCount) {
				displayMessage(`<b>Sıraya Alınacak İş(ler)</b> seçilmelidir!`);
				return;
			}

			let hedefTezgahId = this.tezgahId;
			if (hedefTezgahId == null) {
				const {wnd} = this;
				await app.tezgahResetSelection();
				app.aktifTezgahId = null;
				
				const promise = app.tezgahSecIstendi({ hatId: this.hatId });
				const isModal = wnd.jqxWindow('isModal');
				const divModalBackground = $(`.jqx-window-modal`);
				try {
					if (isModal) {
						wnd.jqxWindow('isModal', false);
						if (divModalBackground.length)
							divModalBackground.addClass('jqx-hidden');
					}
					wnd.addClass('jqx-hidden');
					
					const result = await promise || {};
					if (result.isError)
						throw result;
					
					hedefTezgahId = result.id;
				}
				catch (ex) {
					if (ex && ex.rc == 'userAbort')
						return;
					defFailBlock(ex);
					throw ex;
				}
				finally {
					if (isModal) {
						if (divModalBackground.length)
							divModalBackground.removeClass('jqx-hidden');
						wnd.jqxWindow('isModal', true);
					}
					wnd.removeClass('jqx-hidden');
				}
	
				const hedefTezgah = app.id2Tezgah[hedefTezgahId];
				if (!hedefTezgah)
					return;
			}

			const target = (e.event || {}).currentTarget;
			if (target)
				setButonEnabled($(target), false);
			// showProgress(`İş${rowCount > 1 ? '(ler)' : ''} sıraya ekleniyor...`, null, 1);
			try {
				const oemSayacListe = recs.map(rec => rec.oemsayac);
				await app.wsSirayaAl({ hatId: this.hatId, tezgahId: hedefTezgahId, oemSayacListe: oemSayacListe.join('|') });
				// await gridPart.tazele();
				app.signalChangeExternal();
			}
			catch (ex) {
				((window.savedProcs || {}).hideProgress || hideProgress)();
				defFailBlock(ex);
				throw ex;
			}
			finally {
				if (target)
					setButonEnabled($(target), true);
				setTimeout(() => hideProgress(), 1000);
				hideProgress();
			}
		}

		liste_onItemClick(e) {
			const uid = e.event.args.key;
			const {widget} = this.gridPart;
			if (uid != null) {
				const rowInfo = widget.rowinfo[uid];
				if (rowInfo.selected)
					widget.unselectrowbykey(uid);
				else
					widget.selectrowbykey(uid);
			}

			const selRecs = widget.getSelection();
			const {app, btnToggleDevreDisi} = this;
			const reverseFlag = !!selRecs.find(rec => rec.rotadegisdurum == 'D');
			if (reverseFlag) {
				btnToggleDevreDisi.addClass(`reverse`);
				btnToggleDevreDisi.html(`AKTİF`);
			}
			else {
				btnToggleDevreDisi.removeClass(`reverse`);
				btnToggleDevreDisi.html(`DVR DIŞI`);
			}
		}

		liste_onItemContextMenu(e) {
			this.sinyalSureDuzenleIstendi(e);
		}

		async sinyalSureDuzenleIstendi(e) {
			e = e || {};
			const {widget} = this.gridPart;
			const event = e.event || {};
			const evtArgs = event.args || {};
			
			let {target} = event;
			target = target ? $(target) : null;
			let tr = target ? target.parents(`tr[role=row]`) : null;
			if (!(tr && tr.length) && widget.clickedTD)
				 tr = $(widget.clickedTD).parents(`tr[role=row]`);
			
			const uid = evtArgs.key == null
							? (tr && tr.length ? tr.attr('data-key') : null)
							: evtArgs.key;
			if (uid == null)
				return;

			const {app, tezgahId} = this;
			const rec = widget.rowsByKey[uid];
			try {
				const result = await app.sinyalSureDuzenleIstendi($.extend({}, e, { rec: rec, hatId: this.hatId, tezgahId: tezgahId, tr: tr }));
				if (result)
					app.signalChangeExternal();
				return result;
			}
			catch (ex) {
				defFailBlock(ex);
				throw ex;
			}
		}

		liste_veriYuklendi(e) {
			const {gridPart, siraTipi} = this;
			const {widgetPart} = gridPart;
			// gridPart.widget.selectRow(0);
			switch (siraTipi || '') {
				case 'U':
					widgetPart.jqxDataTable('groups', ['urunadi']);
					break;
				default:
					widgetPart.jqxDataTable('groups', ['hatadi']);
					break;
			}
		}

		async wnd_onResize(e) {
			await super.wnd_onResize(e);

			const {gridPart, wnd, siralamaParent} = this;
			if (gridPart && !gridPart.isDestroyed && gridPart.widgetPart) {
				const {wnd, divFooter} = this;
				const grid = gridPart.widgetPart;
				let height = wnd.height() - (grid.position().top + divFooter.height()) - 13;
				grid.jqxDataTable('height', height);
			}

			const wideScreenFlag = wnd.jqxWindow('width') > 700;
			siralamaParent[wideScreenFlag ? 'addClass' : 'removeClass'](`wide`);
		}
	}
})()
