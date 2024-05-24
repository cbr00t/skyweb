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

			$.extend(this, {
				kodsuzmu: asBool(e.kodsuzmu)
			});

			if (!(this.layout || this.template))
				this.template = this.app.templates.cetKAListe;
		}

		static get canDefer() { return false }
		// static get canDestroy() { return false }
		static get partName() { return 'cetKAListe' }
		get adimText() { return 'Listeden Seç' }


		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);
		}

		async activatePart(e) {
			e = e || {};
			await super.activatePart(e);

			this.tazele();
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
			
			$.merge(e.listeColumns, [
				{
					text: 'Adı', align: 'left', dataField: 'aciklama',
					cellsRenderer: (rowIndex, columnIndex, value, rec) => {
						rec = rec.originalRecord || rec;
						
						let divSatir = this.newListeSatirDiv(e);
						divSatir.attr('data-index', rowIndex);
						$.each(rec, (key, value) => {
							if (this.kodsuzmu && key == 'kod')
								return true;			// continue loop;
							
							let item = divSatir.find(`.${key}`);
							if (item.length)
								item.html(value);
						});
						return divSatir[0].outerHTML.trim();
					}
				},
				{ text: 'Kod', align: 'left', dataField: 'kod', hidden: true }
			]);
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
	}
})()
