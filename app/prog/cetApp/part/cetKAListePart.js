(function() {
	/* await new CETKAListePart({
			table: 'mst_TahsilSekli', idSaha: 'kodNo',
			targetRecUid: 99,
			secince: e => console.warn(e.rec)
		} ).run() */

	window.CETKAListePart = class extends window.CETListeOrtakPart {
		constructor(e) {
			e = e || {};
			super(e);

			this.kodsuzmu = asBool(e.kodsuzmu);
			if (!(this.layout || this.template))
				this.template = this.app.templates.cetKAListe;
		}

		static get canDefer() { return false }
		// static get canDestroy() { return false }
		static get partName() { return 'cetKAListe' }
		get adimText() { return 'Listeden Seç' }


		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e)

			const {layout} = this;
			const filtreForm = this.filtreForm = layout.find('.filtreForm');
			const txtFiltre = this.txtFiltre = filtreForm.find('#filtreText');
			txtFiltre.on('focus', evt =>
				evt.target.select());
			txtFiltre.on('keyup', evt => {
				const key = (evt.key || '').toLowerCase();
				if (key == 'enter' || key == 'linefeed')
					this.filtreEnterIstendi({ event: evt });
			});
			setTimeout(() => txtFiltre.focus(), 50)
		}

		async activatePart(e) {
			e = e || {};
			await super.activatePart(e);

			const {btnToggleFullScreen, chkOtoAktar, btnGonderimIsaretSifirla} = sky.app;
			if (btnToggleFullScreen && btnToggleFullScreen.length)
				btnToggleFullScreen.addClass(`jqx-hidden`);
			if (chkOtoAktar && chkOtoAktar.length)
				chkOtoAktar.addClass(`jqx-hidden`);
			if (btnGonderimIsaretSifirla && btnGonderimIsaretSifirla.length)
				btnGonderimIsaretSifirla.addClass(`jqx-hidden`);
			
			this.tazele()
		}

		async deactivatePart(e) {
			e = e || {};
			const {btnToggleFullScreen, chkOtoAktar, btnGonderimIsaretSifirla} = sky.app;
			setTimeout(() => {
				if (btnToggleFullScreen && btnToggleFullScreen.length)
					btnToggleFullScreen.removeClass(`jqx-hidden`);
				if (chkOtoAktar && chkOtoAktar.length)
					chkOtoAktar.removeClass(`jqx-hidden`);
				if (btnGonderimIsaretSifirla && btnGonderimIsaretSifirla.length)
					btnGonderimIsaretSifirla.removeClass(`jqx-hidden`);
			}, 100);
			
			await super.deactivatePart(e);
		}

		async listeArgsDuzenle(e) {
			await super.listeArgsDuzenle(e);
			
			$.extend(e.listeArgs, {
				pageable: true, showToolbar: false, filterable: true,
				serverProcessing: true, filterMode: 'default',
				height: $(window).height() - 100
			});
		}

		async liste_columnsDuzenle(e) {
			await super.liste_columnsDuzenle(e);

			const {kodsuzmu} = this;
			const adiSaha = this.adiSaha || 'aciklama';
			const idSaha = this.idSaha || 'kod';
			const {listeColumns} = e;
			listeColumns.push({
				text: 'Adı', align: 'left', dataField: adiSaha,
				cellsRenderer: (rowIndex, columnIndex, value, rec) => {
					rec = rec.originalRecord || rec;
					
					let divSatir = this.newListeSatirDiv(e);
					divSatir.attr('data-index', rowIndex);
					for (const key in rec) {
						const value = rec[key];
						if (this.kodsuzmu && idSaha != adiSaha && key == idSaha)
							continue;			// continue loop;
						
						let item = divSatir.find(`.${key}`);
						if (!item.length && (key == adiSaha || (!kodsuzmu && key == idSaha))) {
							item = $(`<span class="${key}" style="margin-right: 10px;"/>`);
							if (key == idSaha)
								item.addClass('bold');
							item.appendTo(divSatir)
						}
						if (item.length)
							item.html(value)
					}
					
					return divSatir[0].outerHTML.trim()
				}
			});
			if (idSaha && idSaha != adiSaha)
				listeColumns.push({ text: 'Kod', align: 'left', dataField: idSaha, hidden: true });
		}
		
		/* liste_renderToolbar(e) {
			const layout = e.layout || this.layout;
			let toolbar = e.listeToolbar;
			let divIslemTuslari = toolbar.find('.toolbar.islemTuslari');
			if (!divIslemTuslari.length) {
				divIslemTuslari = this.template_listeParts.contents('.toolbar.islemTuslari').clone(true);
				if (divIslemTuslari.length) {
					divIslemTuslari.appendTo(toolbar);
					let liItems = divIslemTuslari.find('ul > li');
					divIslemTuslari.jqxMenu({
						theme: theme, mode: 'horizontal',
						animationShowDuration: 0, animationHideDuration: 0
					});
					liItems.on('click', evt =>
						this.liste_islemTusuTiklandi($.extend({}, e, { event: evt })));
				}
			}
		}

		async liste_islemTusuTiklandi(e) {
			let rec = this.selectedBoundRec;
			let elm = e.event.currentTarget;
			switch (elm.id) {
				case '...':
					break;
			}
		} */

		async filtreEnterIstendi(e) {
			const {txtFiltre} = this;
			setTimeout(() => {
				if (!this.isDestroyed && txtFiltre.length) {
					txtFiltre.val('');
					txtFiltre.focus()
				}
			}, 1);
			const barkod = (txtFiltre.val() || '').trim();
			if (!barkod)
				return;

			const {app} = sky;
			const {listeWidget, idSaha} = this;
			let rec = listeWidget.getRows().find(rec => ((idSaha ? rec[idSaha] : Object.values(rec)[0]) || '').toString().trim() == barkod);
			if (!rec) {
				if (idSaha) {
					const barkodBilgi = await app.barkodBilgiBelirle({ barkod: barkod });
					if (barkodBilgi)
						rec = barkodBilgi[idSaha]
				}
			}
			
			if (rec) {
				app.playSound_barkodOkundu();
				this.sec({ rec: rec })
			}
			else {
				app.playSound_barkodError();
				displayMessage(`<u class="bold darkred">${barkod}</u> barkodu hatalıdır!`, `Barkod İşlemi`, undefined, undefined, undefined, undefined, 'top-right')
			}
		}
	}
})()
