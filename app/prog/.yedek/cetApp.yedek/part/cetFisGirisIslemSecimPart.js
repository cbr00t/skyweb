(function() {
	window.CETFisGirisIslemSecimPart = class extends window.CETListeOrtakPart {
		constructor(e) {
			e = e || {};
			super(e);

			this.yildizlimi = false;
			this.ayrimTipi = '';
			
			if (!(this.layout || this.template))
				this.template = this.app.templates.fisGirisIslemSecim;
		}

		static get partName() { return 'cetFisGirisIslemSecim' }
		get adimText() { return 'Fiş Tipi Seçim' }
		static get canDefer() { return false }


		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);

			await this.initToolbar(e);
			this.ozelIsaretDurumAyarla();
			this.ddAyrimTipiAyarla(e);
		}

		initToolbar(e) {
			e = e || {};
			const layout = e.layout || this.layout;
			
			const chkYildizlimiParent = this.chkYildizlimiParent = layout.find(`.toolbar-ust #chkYildizlimiParent`);
			const chkYildizlimi = this.chkYildizlimi = chkYildizlimiParent.find(`#chkYildizlimi`)
				.jqxToggleButton({ theme: theme, toggled: this.yildizlimi, width: 50, height: 28 });
			chkYildizlimi
				.on('click', evt => {
					if (!this.disableEventsFlag) {
						const flag = chkYildizlimi.jqxToggleButton('toggled');
						this.yildizlimi = flag;
						chkYildizlimiParent[flag ? 'addClass' : 'removeClass'](`checked`);
					}
				});

			const ddAyrimTipi_itemHeight = 45;
			const ddAyrimTipiParent = this.ddAyrimTipiParent = layout.find(`.toolbar-ust #ddAyrimTipiParent`);
			const ddAyrimTipi = this.ddAyrimTipi = ddAyrimTipiParent.find(`#ddAyrimTipi`)
				.jqxDropDownList({
					theme: theme, animationType: animationType,
					valueMember: 'kod', displayMember: 'aciklama',
					selectedIndex: 0, searchMode: 'containsignorecase',
					placeHolder: '-Seçiniz-', filterPlaceHolder: 'Bul:', filterable: false,
					dropDownHeight: 150, autoDropDownHeight: true, scrollBarSize: 25,
					width: 180, height: 40, itemHeight: ddAyrimTipi_itemHeight,
					source: [],
					selectionRenderer: span => {
						setTimeout(() => {
							const {ddAyrimTipi, rec} = this;
							const kod = ddAyrimTipi && ddAyrimTipi.length ? ddAyrimTipi.val() : this.ayrimTipi;
							const renk = CETFis.renkFor({ tip: 'ayrimTipi', ayrimTipi: kod });
							if (renk)
								span.css('color', renk);
						}, 10);
						return span;
					},
					renderer: (index, aciklama, kod) => {
						const renk = CETFis.renkFor({ tip: 'ayrimTipi', ayrimTipi: kod });
						return (
							`<div class="ddList-item" style="height: ${ddAyrimTipi_itemHeight}px;` +
								(renk ? `color: ${renk};` : '') +
							`">${aciklama}</div>`
						)
					}
				});
			ddAyrimTipi
				.on('change', evt => {
					if (!this.disableEventsFlag) {
						if (evt && evt.target)
							this.ayrimTipi = ddAyrimTipi.val() || '';
					}
				});
		}

		ozelIsaretDurumAyarla(e) {
			e = e || {};
			const {app, chkYildizlimiParent} = this;
			if (!(chkYildizlimiParent && chkYildizlimiParent.length))
				return;
			
			const rec = e.rec || this.selectedRec;
			const uygunmu = app.ozelIsaretKullanilirmi && rec && rec.fisSinif && rec.fisSinif.ozelIsaretKullanilirmi;
			this.chkYildizlimiParent[uygunmu ? 'removeClass' : 'addClass'](`jqx-hidden`);
			if (!uygunmu)
				this.chkYildizlimi.jqxToggleButton('toggled', false);
		}

		ddAyrimTipiAyarla(e) {
			const {app, ddAyrimTipiParent, ddAyrimTipi} = this;
			if (!(ddAyrimTipi && ddAyrimTipi.length))
				return;

			const rec = e.rec || this.selectedRec;
			const fisSinif = rec == null ? null : rec.fisSinif;
			const uygunAyrimTipleri = fisSinif == null || !fisSinif.ayrimTipiKullanilirmi ? null : fisSinif.uygunAyrimTipleri;
			const uygunmu = !$.isEmptyObject(uygunAyrimTipleri);
			ddAyrimTipi.jqxDropDownList('source', uygunmu ? uygunAyrimTipleri : []);
			if (uygunmu && ddAyrimTipi.jqxDropDownList('selectedIndex') < 0)
				ddAyrimTipi.jqxDropDownList('selectedIndex', 0);
			ddAyrimTipiParent[uygunmu ? 'removeClass' : 'addClass'](`basic-hidden`);
		}

		async listeArgsDuzenle(e) {
			await super.listeArgsDuzenle(e);
			
			$.extend(e.listeArgs, {
				columnsHeight: 28, pageable: false, filterable: false, showToolbar: false,
				height: $(window).height() - 53
			});
		}

		async liste_columnsDuzenle(e) {
			await super.liste_columnsDuzenle(e);
			
			$.merge(e.listeColumns, [
				{
					text: 'Fiş Tipi', align: 'left', dataField: 'aciklama',
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

		async liste_veriYuklendi(e) {
			await super.liste_veriYuklendi(e);

			/* setTimeout(() =>
				this.ozelIsaretDurumAyarla(e),
				100); */
		}

		async liste_satirSecildi(e) {
			e = e || {};
			await super.liste_satirSecildi(e);
			
			this.ozelIsaretDurumAyarla(e);
			this.ddAyrimTipiAyarla(e);
		}
		
		liste_dataAdapterOlustur(e) {
			// super.liste_dataAdapterOlustur(e);

			return new $.jqx.dataAdapter({
				datatype: 'array', id: 'kod',
				localdata: this.app.fisTipleriVeSablon
			});
		}
	}
})()
