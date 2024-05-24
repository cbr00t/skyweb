(function() {
	window.SkyHatIzleme_SiradakiIslerPart = class extends window.SkyMESWindowPart {
		static get partName() { return 'siradakiIsler' }
		get autoHeight_uiSelector() { return null }
		get klavyeAcilirmi() { return false }
		get numKlavyeAcilirmi() { return false }
	
		constructor(e) {
			e = e || {}; super(e);
			this.noSwitchFlag = e.noSwitch;
			const {id2Hat, id2Tezgah, tezgahBilgi} = this.app, hatId = this.hatId = e.hatId, tezgahId = this.tezgahId = e.tezgahId;
			const hatAciklama = id2Hat ? (id2Hat[hatId] || {}).aciklama : '';
			const tezgahAciklama = id2Tezgah ? (id2Tezgah[tezgahId] || {}).aciklama : (tezgahBilgi ? tezgahBilgi.tezgahAciklama : '');
			this.title = e.title || 'Sıradaki İşler'; this.title += ` - (<span class="gray">${tezgahId || hatId}</span>) ${tezgahId ? tezgahAciklama : (hatAciklama || '')}`
		}
		async open(e) {
			await super.open(e); const {signalHandlers} = this.app, {partName} = this; delete signalHandlers[partName];
			signalHandlers[partName] = _e => { const {gridPart} = this; if (!this.isDestroyed && gridPart && gridPart.widgetPart && gridPart.widgetPart.length) { gridPart.tazele() } }
		}
		async close(e) { const {signalHandlers} = this.app; delete signalHandlers[this.partName]; await super.close(e) }
		async tazeleDevam(e) {
			await super.tazeleDevam(e);
			const {app, noSwitchFlag, tezgahId, wndContent} = this; wndContent.find(`button`).jqxButton({ theme });
			const {btnTazele} = this; if (btnTazele?.length) { btnTazele.off('click').on('click', evt =>this.gridPart.tazele()); }
			const divHeader = this.divHeader = wndContent.find(`#header`), islemTuslari = this.islemTuslari = divHeader.find(`#islemTuslari`);
			const divFooter = this.divFooter = wndContent.find(`#footer`), islemTuslari_bottom = this.islemTuslari_bottom = divFooter.find(`#islemTuslari-bottom`);
			const btnBekleyenIsler = this.btnBekleyenIsler = islemTuslari.find(`#btnBekleyenIsler`);
			if (noSwitchFlag) { btnBekleyenIsler.addClass('jqx-hidden') }
			else {
				btnBekleyenIsler.off('click').on('click', async evt => { try { await app.tezgahBekleyenIslerIstendi({ event: evt, noSwitch: true, tezgahId }) } finally { this.gridPart.tazele() } });
				btnBekleyenIsler.removeClass('jqx-hidden');
			}
			const btnSureDuzenle = this.btnSureDuzenle = islemTuslari.find(`#btnSureDuzenle`);
			btnSureDuzenle.off('click').on('click', evt => this.sinyalSureDuzenleIstendi({ event: evt })); btnSureDuzenle.removeClass('jqx-hidden');
			const btnZamanEtudu = this.btnZamanEtudu = islemTuslari.find(`#btnZamanEtudu`);
			btnZamanEtudu.off('click').on('click', evt => this.zamanEtuduIstendi({ event: evt })); btnZamanEtudu.removeClass('jqx-hidden');
			const btnSiradanKaldir = this.btnSiradanKaldir = islemTuslari.find(`#btnSiradanKaldir`);
			btnSiradanKaldir.off('click').on('click', evt => this.siradanKaldirIstendi({ event: evt }));
			const btnIsAta = this.btnIsAta = islemTuslari.find(`#btnIsAta`);
			btnIsAta.off('click').on('click', evt => this.isAtaIstendi({ event: evt }));
			const btnBaskaTezgahaTasi = this.btnBaskaTezgahaTasi = islemTuslari_bottom.find(`#btnBaskaTezgahaTasi`);
			btnBaskaTezgahaTasi.off('click').on('click', evt => this.baskaTezgahaTasiIstendi({ event: evt }));
			const btnIsParcala = this.btnBaskaTezgahaTasi = islemTuslari_bottom.find(`#btnIsParcala`);
			btnIsParcala.off('click').on('click', evt => this.isParcalaIstendi({ event: evt }));
			const btnAsagi = this.btnAsagi = islemTuslari.find(`#btnAsagi`);
			btnAsagi.off('click').on('click', evt => this.asagiIstendi({ event: evt }));
			const btnYukari = this.btnYukari = islemTuslari.find(`#btnYukari`);
			btnYukari.off('click').on('click', evt => this.yukariIstendi({ event: evt }));
			let {gridPart} = this;
			if (!gridPart || gridPart.isDestroyed) {
				const gridParent = wndContent.find(`.gridParent`);
				let grid = gridParent.find(`#grid`);
				gridPart = this.gridPart = new DataTablePart({
					layout: grid,
					widgetBeforeInit: _e => { $.extend(_e.widgetArgs, { pageable: true, pageSize: 9, selectionMode: 'custom', filterable: true, filterMode: 'default', filterHeight: 35, serverProcessing: false }); },
					/*widgetAfterInit: _e => { const {widgetPart} = _e; widgetPart.on('rowDoubleClick', evt => this.baslatIstendi(e)); },*/
					columns: [
						{
							dataField: 'fisnox', text: 'İş (No)',
							cellClassName: (rowIndex, columnField, value, rec) => {
								/*const {app, tezgahId} = this; let {statu} = rec;
								if (statu == null) { const tezgah = app.id2Tezgah[tezgahId]; statu = (tezgah || {}).durumKod; }*/
								let result = `fisNox`;
								/*if (statu) { if (result) result += ' '; result += `durum-${statu}`; }*/
								return result
							},
							cellsRenderer: (rowIndex, columnIndex, value, rec) => {
								rec = rec.originalRecord || rec; const statu = rec.statu || '';
								/*const {statuHaricSet} = this.app; const aktifIsCSS = statuHaricSet[statu] ? ' jqx-hidden' : '';*/
								const aktifIsCSS = asBool(rec.batandimi) ? '' : ' jqx-hidden', zamanEtuduCSS = asBool(rec.bzamanetudu) ? '' : ' jqx-hidden';
								const {sinyalsayisi, sinyaltekilsure, sinyaltoplamsure} = rec,  sinyalSayisiGosterilirmi = sinyalsayisi > 1 || sinyaltekilsure > 0 || sinyaltoplamsure > 0;
								return (
									`<div class="full-width flex-row">` +
										`<div class="full-height">` +
											`<span class="emir etiket">Emir:</span>` +
											`<span class="emir veri">${rec.fisnox}</span>` +
											`<span class="etiket"> Mkt:</span>` +
											`<span class="emir veri">${rec.emirmiktar}</span>` +
										`</div>` +
										`<div class="full-height">` +
											`<span class="statuText${aktifIsCSS} full-width">(aktif iş)</span>` +
										`</div>` +
									`</div>` +
									`<div class="full-width flex-row">` +
										`<div class="float-left full-height">` +
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
										`<div class="full-height">` +
											`<span class="zamanEtuduText${zamanEtuduCSS} full-width">(zaman etüdü)</span>` +
										`</div>` +
									`</div>` +
									`<div class="full-width flex-row">` +
										`<div class="full-height">` +
											`<span class="etiket">Ürün:</span>` +
											`<span class="urun veri">${rec.urunkod}</span>` +
											`<span>-</span>` +
											`<span class="urun veri">${rec.urunadi}</span>` +
										`</div>` +
									`</div>`
								)
							}
						},
						{ dataField: 'urunadi', text: 'Ürün Adı', hidden: true },
						{ dataField: 'urunkod', text: 'Ürün Kod', hidden: true },
						{ dataField: 'opadi', text: 'Op. Adı', hidden: true },
						{ dataField: 'opno', text: 'Op. No', hidden: true },
						{
							dataField: 'emirtarih', text: 'Tarih', width: 70,
							/*cellsFormat: 'n', cellsAlign: 'right', cellClassName: 'bold'*/
							cellClassName: 'emirTarih bold',
							cellsRenderer: (rowIndex, columnIndex, value, rec) => {
								return dateKisaString(asDate(value))
							}
						},
						{ dataField: 'emirmiktar', text: 'Emir Miktar', hidden: true },
						{ dataField: 'hatkod', text: 'Hat Kod', hidden: true },
						{ dataField: 'hatadi', text: 'Hat Adı', hidden: true },
						{ dataField: 'oemsayac', text: 'OEM Sayac', hidden: true }
					],
					loadServerData: async e => {
						const {app} = this;
						const {wsArgs} = e;
						wsArgs.tezgahId = this.tezgahId;
						
						let recs;
						try {
							recs = await app.wsSiradakiIsler(wsArgs);
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
			let result = await super.tamamIstendi_argsDuzenle(e); if (result === false || (result?.isError)) { return result }
			const {app, tezgahId} = this;
			if (this.siraDegistimi) {
				const {gridPart} = this, {widget} = gridPart, recs = widget.getRows() || [];
				if (recs.length) {
					/* showProgress(`Sıra güncelleniyor...`, null, 1); */
					try {
						const isIdListe = recs.map(rec => rec.issayac);
						await app.wsSiraDuzenle({ tezgahId, isIdListe: isIdListe.join('|') }); app.signalChangeExternal();
					}
					catch (ex) { ((window.savedProcs || {}).hideProgress || hideProgress)(); defFailBlock(ex); throw ex }
					finally { setTimeout(() => hideProgress(), 1000); hideProgress() }
				}
				this.siraDegistiReset();
			}
			return false
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
			const {app, gridPart} = this, {widget} = gridPart, recs = widget.getRows() || [], rowCount = recs.length;
			const selRecs = widget.getSelection() || [], selRowCount = selRecs.length;
			app.hideNotifications();
			if (!rowCount || !selRowCount) { return }
			widget.beginUpdate();
			for (let i = selRowCount - 1; i >= 0; i--) {
				const rec = selRecs[i];
				if (rec) {
					const {uid} = rec, ind = widget.getrowindex(rec); if (i >= selRowCount - 1 && (ind + 1) >= rowCount) { break }
					widget.deleterowbykey(rec.uid); widget.addRow(uid, rec, ind + 1);
				}
			}
			widget.clearSelection();
			for (const rec of selRecs) { const {uid} = rec; widget.selectrowbykey(uid) }
			widget.endUpdate(); this.siraDegisti()
		}
		yukariIstendi(e) {
			const {app, gridPart} = this, {widget} = gridPart, recs = widget.getRows() || [], rowCount = recs.length;
			const selRecs = widget.getSelection() || [], selRowCount = selRecs.length;
			app.hideNotifications(); if (!rowCount || !selRowCount) { return }
			widget.beginUpdate();
			for (let i = 0; i < selRowCount; i++) {
				const rec = selRecs[i];
				if (rec) {
					const {uid} = rec, ind = widget.getrowindex(rec); if (!i && (ind - 1) < 0) { break }
					widget.deleterowbykey(rec.uid); widget.addRow(uid, rec, ind - 1);
				}
			}
			widget.clearSelection(); for (const rec of selRecs) { const {uid} = rec; widget.selectrowbykey(uid) }
			widget.endUpdate(); this.siraDegisti();
		}
		siraDegisti(e) { const {btnTamam} = this; if (btnTamam?.length) { btnTamam.removeClass('jqx-hidden') } this.siraDegistimi = true }
		siraDegistiReset(e) { const {btnTamam} = this; if (btnTamam?.length) { btnTamam.addClass('jqx-hidden') } this.siraDegistimi = false }
		liste_onItemClick(e) {
			const uid = e.event.args.key, {widget} = this.gridPart;
			if (uid != null) { const rowInfo = widget.rowinfo[uid]; if (rowInfo.selected) { widget.unselectrowbykey(uid) } else { widget.selectrowbykey(uid) } }
			const selRecs = widget.getSelection();
			const {app, btnIsAta} = this, {statuHaricSet} = app, aktifIsSecilimi = !!selRecs.find(rec => asBool(rec.batandimi)); /* const aktifIsSecilimi = selRecs.find(rec => rec && !statuHaricSet[rec.statu]) */
			if (aktifIsSecilimi) { btnIsAta.addClass(`kaldir`); btnIsAta.html(`AKTİF İŞ KALDIR`) }
			else { btnIsAta.removeClass(`kaldir`); btnIsAta.html(`İŞ ATA`) }
		}
		liste_onItemContextMenu(e) { this.sinyalSureDuzenleIstendi(e) }
		async sinyalSureDuzenleIstendi(e) {
			e = e || {}; const {widget} = this.gridPart, event = e.event || {}, evtArgs = event.args || {};
			let {target} = event; target = target ? $(target) : null;
			let tr = target ? target.parents(`tr[role=row]`) : null; if (!(tr?.length) && widget.clickedTD) tr = $(widget.clickedTD).parents(`tr[role=row]`);
			const uid = evtArgs.key == null ? (tr?.length ? tr.attr('data-key') : null) : evtArgs.key; if (uid == null) return
			const {app, tezgahId} = this, rec = widget.rowsByKey[uid];
			try { const result = await app.sinyalSureDuzenleIstendi($.extend({}, e, { rec, tezgahId, tr })); if (result) { app.signalChangeExternal() } return result }
			catch (ex) { defFailBlock(ex); throw ex }
		}
		async zamanEtuduIstendi(e) {
			e = e || {}; const {widget} = this.gridPart, event = e.event || {}, evtArgs = event.args || {};
			let {target} = event; target = target ? $(target) : null;
			let tr = target ? target.parents(`tr[role=row]`) : null; if (!(tr?.length) && widget.clickedTD) { tr = $(widget.clickedTD).parents(`tr[role=row]`) }
			const uid = evtArgs.key == null ? (tr?.length ? tr.attr('data-key') : null) : evtArgs.key; if (uid == null) return
			const {app, tezgahId} = this, rec = widget.rowsByKey[uid];
			try { const result = await app.zamanEtuduIstendi($.extend({}, e, { rec, tezgahId, tr })); if (result) { app.signalChangeExternal() } return result }
			catch (ex) { defFailBlock(ex); throw ex }
		}
		liste_veriYuklendi(e) { /*const {widgetPart} = this.gridPart; widgetPart.selectRow(0)*/ }
		async wnd_onResize(e) {
			await super.wnd_onResize(e); const {gridPart} = this;
			if (gridPart && !gridPart.isDestroyed && gridPart.widgetPart) {
				const {wnd, divFooter} = this, grid = gridPart.widgetPart;
				let height = wnd.height() - (grid.position().top + divFooter.height() + 13); grid.jqxDataTable('height', height)
			}
		}
	}
})()
