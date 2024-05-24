(function() {
	window.SkyConfigVioGlobalIniDuzenlePart = class extends window.SkyConfigWindowPart {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				baslikText: e.baslikText,
				rec: e.rec
			});
		}

		static get partName() { return 'vioGlobalIniDuzenle' }
		get defaultTitle() { return 'VioGlo.ini' }
		get defaultIsModal() { return true }
		get autoFocus_uiSelector() {
			const rec = this.rec || {};
			const {key} = rec;
			return key ? `#value_parent #value` : `#key_parent #key`
		}
		
		async tazeleDevam(e) {
			await super.tazeleDevam(e);

			const rec = this.rec = this.rec || {};
			const {app, wndContent, baslikText} = this;
			if (baslikText) {
				wndContent.find(`#baslikText`).html(baslikText);
				wndContent.find(`#baslikTextParent`).removeClass(`jqx-hidden`);
			}
			else {
				wndContent.find(`#baslikTextParent`).addClass(`jqx-hidden`);
			}

			const txtKey = this.txtKey = wndContent.find(`#key`);
			txtKey.val(rec.key || '');
			txtKey.on('change', evt =>
				this.rec.key = (evt.currentTarget.value || '').trim());

			const txtValue = this.txtValue = wndContent.find(`#value`);
			txtValue.val(rec.value || '');
			txtValue.on('change', evt =>
				this.rec.value = (evt.currentTarget.value || '').trimEnd());

			wndContent.find(`input[type=text]`, `input[type=textbox]`)
				.on('click', evt =>
					evt.target.select());
		}

		tazeleSonrasi(e) {
			super.tazeleSonrasi(e);
		}

		close_araIslemler(e) {
			super.close_araIslemler(e);
		}

		setValues(e) {
			super.setValues(e);

			$.extend(this, {
				baslikText: e.baslikText == null ? this.baslikText : e.baslikText,
				rec: e.rec
			});
		}

		wndArgsDuzenle(e) {
			super.wndArgsDuzenle(e);

			const minWidth = 550;
			const minHeight = 200;
			$.extend(e.args, {
				width: Math.max(Math.min(700, $(window).width() - 50), minWidth),
				height: Math.max(Math.min(200, $(window).height() - 50), minHeight),
				minWidth: minWidth, minHeight: minHeight
			});
		}

		tamamIstendi_argsDuzenle(e) {
			super.tamamIstendi_argsDuzenle(e);

			const rec = this.rec || {};
			let {key} = rec;
			if (!key)
				return { isError: true, rc: 'emptyArgument', errorText: `<b>Belirteç</b> boş olamaz` };
			
			e.args.rec = rec;
		}
		
		async wnd_onResize(e) {
			await super.wnd_onResize(e);
		}
	}
})()
