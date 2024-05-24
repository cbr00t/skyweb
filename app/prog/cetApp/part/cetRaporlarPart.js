(function() {
	window.CETRaporlarPart = class extends window.CETListeOrtakPart {
		constructor(e) {
			e = e || {};
			super(e);

			if (!(this.layout || this.template))
				this.template = this.app.templates.cetRaporlar;
			
			$.extend(this, {
				secinceGeriYapilmazFlag: true,
				secince: e.secince || (e => this.raporGoster(e))
			});
		}

		static get partName() { return 'cetRaporlar' }
		get adimText() { return 'Raporlar' }


		async listeArgsDuzenle(e) {
			await super.listeArgsDuzenle(e);

			$.extend(e.listeArgs, {
				columnsHeight: 55, pageable: true, filterable: true, showToolbar: false,
				filterMode: 'default'
			});
		}

		async liste_columnsDuzenle(e) {
			await super.liste_columnsDuzenle(e);
			
			$.merge(e.listeColumns, [
				{
					text: 'Rapor', align: 'left', dataField: 'aciklama',
					cellsRenderer: (rowIndex, columnIndex, value, rec) => {
						let divSatir = this.newListeSatirDiv(e);
						divSatir.attr('data-index', rowIndex);
						$.each(rec, (key, value) => {
							let item = divSatir.find(`.${key}`);
							if (item.length)
								item.html(value);
						});
						return divSatir[0].outerHTML.trim();
					}
				}
			]);
		}
		
		liste_dataAdapterOlustur(e) {
			// super.liste_dataAdapterOlustur(e);

			return new $.jqx.dataAdapter({
				datatype: 'array', id: 'kod',
				localdata: this.app.raporlar
			});
		}

		async raporGoster(e) {
			const rec = e.rec;
			const raporSinif = (rec || {}).raporSinif;
			if (!raporSinif)
				return;
			
			let rapor = new raporSinif();
			return await rapor.run();
		}
	}
})()
