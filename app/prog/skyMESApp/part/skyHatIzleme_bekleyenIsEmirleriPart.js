(function() {
	window.SkyHatIzleme_BekleyenIsEmirleriPart = class extends window.SkyMESWindowPart {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				hatId: e.hatId || null,
				title: e.title || 'Bekleyen İş Emirleri'
			});

			const {hatId} = this;
			if (hatId)
				this.title += ` - <span class="bold cyan">${hatId}</span>`;
		}

		static get partName() { return 'bekleyenIsEmirleri' }
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

			const {app, wndContent} = this;
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
			
			let {gridPart} = this;
			if (!gridPart || gridPart.isDestroyed) {
				const gridParent = wndContent.find(`.gridParent`);
				let grid = gridParent.find(`#grid`);
				gridPart = this.gridPart = new DataTablePart({
					layout: grid,
					widgetBeforeInit: _e => {
						$.extend(_e.widgetArgs, {
							pageable: true, pageSize: 9, selectionMode: 'singleRow',
							filterable: true, filterMode: 'default', filterHeight: 35,
							serverProcessing: false,
							rowDetails: true,
			                initRowDetails: (uid, rec, parent, rowInfo) =>
								this.liste_initRowDetails({ uid: uid, rec: rec, parent: parent, rowInfo: rowInfo }),
						});
					},
					widgetAfterInit: _e => {
						const {widgetPart} = _e;
						widgetPart.on('rowExpand', evt => {
							const uid = evt.args.rowKey;
							const {widget} = gridPart;
							const expandedUids = gridPart.expandedUids = gridPart.expandedUids || {};
							if (uid != null) {
								if (!$.isEmptyObject(expandedUids)) {
									widget.beginUpdate();
									for (const uid in expandedUids)
										widget.hidedetailsbykey(uid);
									widget.endUpdate();
								}
								expandedUids[uid] = true;
							}
						});
						widgetPart.on('rowCollapse', evt => {
							const expandedUids = gridPart.expandedUids = gridPart.expandedUids || {};
							const uid = evt.args.rowKey;
							if (uid != null)
								delete expandedUids[uid];
						});
					},
					columns: [
						{
							dataField: 'emirnox', text: 'Emir No',
							cellClassName: 'emirnox',
							cellsRenderer: (rowIndex, columnIndex, value, rec) => {
								rec = rec.originalRecord || rec;
								return (
									`<div>` +
										`<span class="emir etiket">Emir:</span>` +
										`<span class="emir veri">${rec.emirnox}</span>` +
										`<span class="miktar orj etiket"> Miktar:</span>` +
										`<span class="miktar orj veri">${rec.orjmiktar}</span>` +
										`<span class="miktar kalan etiket"> Kalan:</span>` +
										`<span class="miktar kalan veri">${rec.kalanmiktar}</span>` +
									`</div>` +
									`<div>` +
										`<span class="etiket">Ürün:</span>` +
										`<span class="urun veri">${rec.urunkod}</span>` +
										`<span>-</span>` +
										`<span class="urun veri">${rec.urunadi}</span>` +
									`</div>`
								)
							}
						},
						{ dataField: 'urunadi', text: 'Ürün Adı', hidden: true },
						{ dataField: 'urunkod', text: 'Ürün Kod', hidden: true },
						{
							dataField: 'emirtarih', text: 'Tarih', width: 70,
							/*cellsFormat: 'n', cellsAlign: 'right', cellClassName: 'bold'*/
							cellClassName: 'emirtarih bold',
							cellsRenderer: (rowIndex, columnIndex, value, rec) => {
								return dateKisaString(asDate(value))
							}
						},
						{ dataField: 'emirurunsayac', text: 'Emir/Ürün Sayac', hidden: true }
					],
					loadServerData: async e => {
						const {app, hatId} = this;
						const {wsArgs} = e;
						if (hatId)
							wsArgs.hatId = hatId;
						
						let recs;
						try {
							recs = await app.wsBekleyenIsEmirleri(wsArgs);
							recs = recs.rows || recs;
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
					itemDblClick: e =>
						this.liste_onItemDblClick(e),
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

		async tamamIstendi_argsDuzenle(e) {
			let result = await super.tamamIstendi_argsDuzenle(e);
			if (result === false || (result && result.isError))
				return result;

			const {app} = this;
			if (this.siraDegistimi) {
				const {gridPart} = this;
				const {widget} = gridPart;
				const recs = widget.getRows() || [];
				if (recs.length) {
					// showProgress(`Sıra güncelleniyor...`, null, 1);
					try {
						const isIdListe = recs.map(rec => rec.issayac);
						await app.wsSiraDuzenle({ tezgahId: this.tezgahId, isIdListe: isIdListe.join('|') });
						// await gridPart.tazele();
						app.signalChangeExternal();
					}
					catch (ex) {
						((window.savedProcs || {}).hideProgress || hideProgress)();
						defFailBlock(ex);
						throw ex;
					}
					finally {
						setTimeout(() => hideProgress(), 1000);
						hideProgress();
					}
				}
				this.siraDegistiReset();
			}
			
			return false;
		}

		async siradanKaldirIstendi(e) {
			e = e || {};
			const {app, gridPart} = this;
			const {widget} = gridPart;
			const recs = widget.getSelection();
			const rowCount = recs.length;

			app.hideNotifications();
			if (!rowCount) {
				displayMessage(`<b>Sıradan Kaldırılacak İş(ler)</b> seçilmelidir!`);
				return;
			}

			const target = (e.event || {}).currentTarget;
			if (target)
				setButonEnabled($(target), false);
			// showProgress(`İş${rowCount > 1 ? '(ler)' : ''} siliniyor...`, null, 1);
			try {
				const isIdListe = recs.map(rec => rec.issayac);
				await app.wsSiradanKaldir({ tezgahId: this.tezgahId, isIdListe: isIdListe.join('|') });
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

		async isAtaIstendi(e) {
			e = e || {};
			const {app, gridPart} = this;
			const {widget} = gridPart;
			const recs = widget.getSelection();
			const rowCount = recs.length;

			app.hideNotifications();
			if (!rowCount) {
				displayMessage(`<b>Atanacak İş(ler)</b> seçilmelidir!`);
				return;
			}
			/*if (rowCount > 1) {
				displayMessage(`Sadece <b>1 tane İş</b> seçilmelidir!`);
				return;
			}*/

			const target = (e.event || {}).currentTarget;
			if (target)
				setButonEnabled($(target), false);
			// showProgress(`İş atanıyor...`, null, 1);
			try {
				for (const i in recs) {
					const rec = recs[i];
					await app.wsIsAta({ tezgahId: this.tezgahId, isId: rec.issayac /*, perKod: ''*/ });
				}
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
		
		async baskaTezgahaTasiIstendi(e) {
			e = e || {};
			const {app, gridPart, wnd} = this;
			const {widget} = gridPart;
			const recs = widget.getSelection();
			const rowCount = recs.length;

			app.hideNotifications();
			if (!rowCount) {
				displayMessage(`<b>Taşınacak İş(ler)</b> seçilmelidir!`);
				return;
			}

			let promise = app.tezgahSecIstendi({ hatKisitla: true });
			let hedefTezgahId;
			const isModal = wnd.jqxWindow('isModal');
			const divModalBackground = $(`.jqx-window-modal`);
			try {
				if (isModal) {
					wnd.jqxWindow('isModal', false);
					if (divModalBackground.length)
						divModalBackground.addClass(`jqx-hidden`);
				}
				wnd.addClass(`jqx-hidden`);
				
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
						divModalBackground.removeClass(`jqx-hidden`);
					wnd.jqxWindow('isModal', true);
				}
				wnd.removeClass(`jqx-hidden`);
			}

			const hedefTezgah = app.id2Tezgah[hedefTezgahId];
			if (!hedefTezgah)
				return;
			
			const target = (e.event || {}).currentTarget;
			if (target)
				setButonEnabled($(target), false);
			// showProgress(`<b>${recs.length} adet</b> iş <b>${hedefTezgahId}-${hedefTezgah.aciklama || ''}</b> tezgahına taşınıyor...`, null, 1);
			try {
				const isIdListe = recs.map(rec => rec.issayac);
				await app.wsBaskaTezgahaTasi({ tezgahId: this.tezgahId, hedefTezgahId: hedefTezgahId, isIdListe: isIdListe.join('|') });
				// await gridPart.tazele();
				app.signalChangeExternal();
				setTimeout(async () => {
					try { await this.close($.extend({}, e, { userCloseFlag: true })) }
					catch (ex) { }
					setTimeout(async () =>
						app.tezgahSiradakiIslerIstendi({ tezgahId: hedefTezgahId }),
						20);
				}, 100);
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
		
		async isParcalaIstendi(e) {
			e = e || {};
			const {app, gridPart, wnd, tezgahId} = this;
			const {widget} = gridPart;
			const recs = widget.getSelection();
			const rowCount = recs.length;

			app.hideNotifications();
			if (!rowCount) {
				displayMessage(`<b>Parçalanacak İş(ler)</b> seçilmelidir!`);
				return;
			}

			const cokluIsmi = rowCount > 1;
			/*if (rowCount > 1) {
				displayMessage(`Sadece <b>1 tane İş</b> seçilmelidir!`);
				return;
			}*/

			let promise = app.tezgahSecIstendi({ hatKisitla: true });
			let hedefTezgahId;
			const isModal = wnd.jqxWindow('isModal');
			const divModalBackground = $(`.jqx-window-modal`);
			try {
				if (isModal) {
					wnd.jqxWindow('isModal', false);
					if (divModalBackground.length)
						divModalBackground.addClass(`jqx-hidden`);
				}
				wnd.addClass(`jqx-hidden`);
				
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
						divModalBackground.removeClass(`jqx-hidden`);
					wnd.jqxWindow('isModal', true);
				}
				wnd.removeClass(`jqx-hidden`);
			}

			const hedefTezgah = app.id2Tezgah[hedefTezgahId];
			if (!hedefTezgah)
				return;
			
			const target = (e.event || {}).currentTarget;
			if (target)
				setButonEnabled($(target), false);
			// showProgress(`<b>${recs.length} adet</b> iş <b>${hedefTezgahId}-${hedefTezgah.aciklama || ''}</b> tezgahına taşınıyor...`, null, 1);
			try {
				if (cokluIsmi) {
					const isIdListe = recs.map(rec => rec.issayac);
					await app.wsCokluIsParcala({ tezgahId: tezgahId, hedefTezgahId: hedefTezgahId, isIdListe: isIdListe.join(delimWS) });
				}
				else {
					const isId = recs[0].issayac;
					await app.wsIsParcala({ tezgahId: tezgahId, hedefTezgahId: hedefTezgahId, isId: isId, yeniMiktar: '' });
				}
				// await gridPart.tazele();
				app.signalChangeExternal();
				setTimeout(async () => {
					try { await this.close($.extend({}, e, { userCloseFlag: true })) }
					catch (ex) { }
					setTimeout(async () =>
						app.tezgahSiradakiIslerIstendi({ tezgahId: hedefTezgahId }),
						20);
				}, 100);
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

		asagiIstendi(e) {
			const {app, gridPart} = this;
			const {widget} = gridPart;
			const recs = widget.getRows() || [];
			const rowCount = recs.length;
			const selRecs = widget.getSelection() || [];
			const selRowCount = selRecs.length;
			
			app.hideNotifications();
			if (!rowCount || !selRowCount)
				return;

			widget.beginUpdate();
			for (let i = selRowCount - 1; i >= 0; i--) {
				const rec = selRecs[i];
				if (rec) {
					const {uid} = rec;
					const ind = widget.getrowindex(rec);
					if (i >= selRowCount - 1 && (ind + 1) >= rowCount)
						break;
					widget.deleterowbykey(rec.uid);
					widget.addRow(uid, rec, ind + 1);
				}
			}
			
			widget.clearSelection();
			for (const i in selRecs) {
				const {uid} = selRecs[i];
				widget.selectrowbykey(uid);
			}
			widget.endUpdate();
			this.siraDegisti();
		}

		yukariIstendi(e) {
			const {app, gridPart} = this;
			const {widget} = gridPart;
			const recs = widget.getRows() || [];
			const rowCount = recs.length;
			const selRecs = widget.getSelection() || [];
			const selRowCount = selRecs.length;
			
			app.hideNotifications();
			if (!rowCount || !selRowCount)
				return;
			
			widget.beginUpdate();
			for (let i = 0; i < selRowCount; i++) {
				const rec = selRecs[i];
				if (rec) {
					const {uid} = rec;
					const ind = widget.getrowindex(rec);
					if (!i && (ind - 1) < 0)
						break;
					widget.deleterowbykey(rec.uid);
					widget.addRow(uid, rec, ind - 1);
				}
			}
			
			widget.clearSelection();
			for (const i in selRecs) {
				const {uid} = selRecs[i];
				widget.selectrowbykey(uid);
			}
			widget.endUpdate();
			this.siraDegisti();
		}

		siraDegisti(e) {
			const {btnTamam} = this;
			this.siraDegistimi = true;
			if (btnTamam && btnTamam.length)
				btnTamam.removeClass(`jqx-hidden`);
		}

		siraDegistiReset(e) {
			const {btnTamam} = this;
			this.siraDegistimi = false;
			if (btnTamam && btnTamam.length)
				btnTamam.addClass(`jqx-hidden`);
		}

		liste_initRowDetails(e) {
			const {rec, parent} = e;
			const emirUrunSayac = (rec || {}).emirurunsayac;
			if (!emirUrunSayac)
				return;

			// { uid: uid, rec: rec, parent: parent, rowInfo: rowInfo }
			const grid = e.grid = $(`<div style="margin: 3px 3px 3px 15px;"></div>`);
			grid.appendTo(parent);
			
			let gridPart = new DataTablePart({
				layout: grid,
				widgetBeforeInit: _e => {
					$.extend(_e.widgetArgs, {
						pageable: false, pageSize: 5, selectionMode: 'singleRow',
						filterable: true, filterMode: 'default',
						columnsHeight: 25, serverProcessing: false
					});
				},
				columns: [
					{ dataField: 'opadi', text: 'Op. Adı', hidden: true },
					{
						dataField: 'opno', text: 'Op. No',
						cellClassName: 'opno',
						cellsRenderer: (rowIndex, columnIndex, value, rec) => {
							rec = rec.originalRecord || rec;
							const {opno, opadi} = rec;
							const tezgahSayi = rec.tezgahsayi;
							const birimSureSn = rec.birimsuresn;

							const emirMiktar = rec.emirmiktar;
							const uretMiktar = rec.uretbrutmiktar + rec.digeruretmiktar;
							const kalanMiktar = rec.kalanmiktar;
							
							const aktifTezgahCSS = tezgahSayi && tezgahSayi > 0 ? '' : ' jqx-hidden';
							const kalanSureDk = rec.kalansuredk;
							
							return (
								`<div>` +
									`<span class="oper etiket">Oper:</span>` +
									`<span class="oper veri">${opno}</span>` +
									`<pan>-</span>` +
									`<span class="oper veri">${opadi}</span>` +
								`</div>` +
								`<div>` +
									`<span class="miktar orj etiket">Orj:</span>` +
									`<span class="miktar orj veri">${(emirMiktar == null ? 'NULL' : emirMiktar).toLocaleString()}</span>` +
									`<span class="miktar uret etiket"> Üret:</span>` +
									`<span class="miktar uret veri">${(uretMiktar == null ? 'NULL' : uretMiktar).toLocaleString()}</span>` +
									`<span class="miktar kalan etiket"> Kalan:</span>` +
									`<span class="miktar kalan veri">${(kalanMiktar == null ? 'NULL' : kalanMiktar).toLocaleString()}</span>` +
									`<span class="sure etiket"> Süre:</span>` +
									`<span class="veri sure">${(kalanSureDk == null ? 'NULL' : kalanSureDk).toLocaleString()}</span>` +
									`<span class="sure etiket"> dk</span>` +
									/*`<span class="oper sure veri">` +
										(sureGosterim_saat ? sureGosterim_saat.toLocaleString() + ' saat ' : '') +
										(sureGosterim_dk ? sureGosterim_dk.toLocaleString() + ' dk' : '') +
									`</span>` +*/
									`<span class="aktifTezgahText${aktifTezgahCSS}">(<span class="aktifIsSayiText">${tezgahSayi.toLocaleString()} iş</span>)</span>` +
								`</div>`
							)
						}
					}
				],
				loadServerData: async e => {
					const {app} = this;
					const {wsArgs} = e;
					wsArgs.emirUrunSayac = emirUrunSayac;
					
					let recs;
					try {
						recs = await app.wsBekleyenOperasyonlar(wsArgs);
						recs = recs.rows || recs;
					}
					catch (ex) {
						((window.savedProcs || {}).hideProgress || hideProgress)();
						// defFailBlock(ex);
						throw ex;
					}
					return recs
				}
			});
			gridPart.basicRun();
			gridPart.layout
				.detach()
				.appendTo(parent);


			setTimeout(() => {
				const {widget} = gridPart;
				widget.beginUpdate();
				widget.height = parent.parents(`tr[data-role=row-details]`).height() - 25;
				widget.endUpdate();
			}, 0);
		}

		liste_onItemClick(e) {
			/*const uid = e.event.args.key;
			const {widget} = this.gridPart;
			if (uid != null) {
				const rowInfo = widget.rowinfo[uid];
				if (rowInfo.selected)
					widget.unselectrowbykey(uid);
				else
					widget.selectrowbykey(uid);
			}*/
		}

		liste_onItemDblClick(e) {
			const {gridPart} = this;
			const {widget} = gridPart;
			const rec = (widget.getSelection() || [])[0];
			const {uid} = (rec || {});
			if (uid != null) {
				const expandedUids = gridPart.expandedUids = gridPart.expandedUids || {};
				if (gridPart.expandedUids[uid])
					widget.hidedetailsbykey(uid);
				else
					widget.showdetailsbykey(uid);
			}
		}

		liste_veriYuklendi(e) {
			/*const {widgetPart} = this.gridPart;
			 widgetPart.selectRow(0)*/
		}

		async wnd_onResize(e) {
			await super.wnd_onResize(e);

			const {gridPart} = this;
			if (gridPart && !gridPart.isDestroyed && gridPart.widgetPart) {
				const {wnd, divFooter} = this;
				const grid = gridPart.widgetPart;
				let height = wnd.height() - (grid.position().top + divFooter.height() + 13);
				grid.jqxDataTable('height', height);
			}
		}
	}
})()
