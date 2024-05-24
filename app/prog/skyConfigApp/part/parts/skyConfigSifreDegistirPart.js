(function() {
	window.SkyConfigSifreDegistirPart = class extends window.SkyConfigWindowPart {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				baslikText: e.baslikText || `Şifre Değiştir`,
				pass: e.pass == null ? (e.rec || {}).pass : e.pass
			});
		}

		static get partName() { return 'sifreDegistir' }
		get defaultTitle() { return 'Şifre Değiştir' }
		get defaultIsModal() { return true }
		get autoFocus_uiSelector() { return `#pass` }
		
		
		async tazeleDevam(e) {
			await super.tazeleDevam(e);

			const {wndContent, baslikText} = this;
			if (baslikText) {
				wndContent.find(`#baslikText`).html(baslikText);
				wndContent.find(`#baslikTextParent`).removeClass(`jqx-hidden`);
			}
			else {
				wndContent.find(`#baslikTextParent`).addClass(`jqx-hidden`);
			}
			
			const txtPass = this.txtPass = wndContent.find(`#pass`);
			txtPass.val(this.pass || '');
			txtPass.on('change', evt =>
				this.pass = (evt.currentTarget.value || '').trimEnd());
		}

		tazeleSonrasi(e) {
			super.tazeleSonrasi(e);
		}

		close_araIslemler(e) {
			super.close_araIslemler(e);
		}

		setValues(e) {
			super.setValues(e);

			const argPass = e.pass == null ? (e.rec || {}).pass : e.pass;
			$.extend(this, {
				baslikText: e.baslikText == null ? this.baslikText : e.baslikText,
				pass: argPass == null ? this.pass : argPass
			});
		}

		wndArgsDuzenle(e) {
			super.wndArgsDuzenle(e);

			const minHeight = 200;
			$.extend(e.args, {
				width: 430, height: Math.max(Math.min(200, $(window).height() - 50), minHeight),
				minWidth: 380, minHeight: minHeight
			});
		}

		tamamIstendi_argsDuzenle(e) {
			super.tamamIstendi_argsDuzenle(e);

			let {pass} = this;
			if (!pass)
				return { isError: true, rc: 'emptyArgument', errorText: `<b>Şifre</b> boş olamaz` };
			if (pass && pass.length != 32)
				pass = md5(pass);
			
			e.args.pass = pass;
		}
		
		async wnd_onResize(e) {
			await super.wnd_onResize(e);
		}
	}
})()
