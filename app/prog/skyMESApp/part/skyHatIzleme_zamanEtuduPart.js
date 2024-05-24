(function() {
	window.SkyHatIzleme_ZamanEtuduPart = class extends window.SkyMESWindowPart {
		static get partName() { return 'zamanEtudu' }
		get autoHeight_uiSelector() { return null } get autoFocus_uiSelector() { return `.form-parent #sinyalSayisi` }
		get klavyeAcilirmi() { return false } get numKlavyeAcilirmi() { return true }
	
		constructor(e) {
			e = e || {}; super(e);
			$.extend(this, { rec_is: e.rec_is, rec: e.rec, bilgiHTML: e.bilgiHTML });
			const {id2Tezgah, tezgahBilgi} = this.app, tezgahId = this.tezgahId = e.tezgahId, isId = this.isId = e.isId, oemSayac = this.oemSayac = e.oemSayac;
			const tezgahAciklama = id2Tezgah ? (id2Tezgah[tezgahId] || {}).aciklama : (tezgahBilgi ? tezgahBilgi.tezgahAciklama : null);
			this.title = e.title || 'Zaman Etüdü'; this.title += ` - (<span class="gray">${tezgahId}</span>) ${tezgahAciklama || ''}`;
		}
		async open(e) {
			await super.open(e); const {signalHandlers} = this.app, {partName} = this; delete signalHandlers[partName];
			signalHandlers[partName] = async _e => {
				const {gridPart, isId, oemSayac, tezgahId} = this;
				if (!this.isDestroyed) { this.rec = await sky.app.wsGorevZamanEtuduVeriGetir({ isId, oemSayac, tezgahId }); this.veriGoster(_e) }
			}
		}
		async close(e) { const {signalHandlers} = this.app; delete signalHandlers[this.partName]; await super.close(e) }
		async tazeleDevam(e) {
			await super.tazeleDevam(e);
			const {app, wndContent, bilgiHTML, isId, oemSayac, tezgahId} = this, rec = this.rec = await app.wsGorevZamanEtuduVeriGetir({ isId, oemSayac, tezgahId });
			wndContent.find(`button`).jqxButton({ theme });
			const divHeader = this.divHeader = wndContent.find('#header'), islemTuslari = this.islemTuslari = divHeader.find('#islemTuslari');
			const divBilgiText = this.divBilgiText = divHeader.find('#bilgiParent #bilgiText');
			if (bilgiHTML) { divBilgiText.html(bilgiHTML); divBilgiText.parent().removeClass('jqx-hidden') }
			else { divBilgiText.parent().addClass('jqx-hidden') }
			const formParent = this.formParent = wndContent.find('.form-parent'), buttons = formParent.find('button');
			if (buttons.length) {
				buttons.jqxButton({ theme, width: false, height: false })
					.on('click', evt => { const {id} = evt.currentTarget; this.butonTiklandi($.extend({}, e, { event: evt, id })) })
			}
			const formInputs = formParent.find(`input[type=text], input[type=textbox], input[type=number], input[type=date]`);
			const focusHandler = evt => evt.currentTarget.select(); formInputs.on('focus', evt => focusHandler(evt)); formInputs.on('click', evt => focusHandler(evt));
			formParent.find('input[type=number]').on('change', evt => {
				const target = evt.currentTarget, min = typeof target.min == 'number' ? asFloat(target.min) : null, max = typeof target.max == 'number' ? asFloat(target.max) : null;
				if (min != null && target.value < min) { target.value = min }
				if (max != null && target.value > max) { target.value = max }
			});
			this.veriGoster(e)
		}
		veriGoster(e) {
			e = e || {}; const {app} = sky, {formParent, divHeader, rec} = this, degistirmi = this.degistirmi = asBool(rec.bzamanetudu);
			formParent.find('#sinyalSayisi').val(asFloat(rec.urunagacsinyalsayisi) || 0);
			let elm = formParent.find('#cevrimMinSn'); elm.val(degistirmi ? (asFloat(rec.sinirminsn) || 0) : null); elm.attr('placeholder', asFloat(rec.urunagaccevrimenkisasn) || '');
			elm = formParent.find('#cevrimMaxSn'); elm.val(degistirmi ? (asFloat(rec.sinirmaxsn) || 0) : null);
			elm = formParent.find('#sinyalArasiMinSn'); elm.val(degistirmi ? (asFloat(rec.enkisasinyalsn) || 0) : null); elm.attr('placeholder', asFloat(rec.urunagacsinyalenkisasn) || '');
			elm = formParent.find('#sinyalArasiMaxSn'); elm.val(degistirmi ? (asFloat(rec.enuzunsinyalsn) || 0) : null);
			/*formParent.find('#cevrimMinSn').val(asFloat(rec[degistirmi ? 'sinirminsn' : 'urunagaccevrimenkisasn']) || 0);
			formParent.find('#cevrimMaxSn').val(asFloat(rec[degistirmi ? 'sinirmaxsn' : 'urunagaccevrimenkisasn']) || 0);				// urun agac icin en kisa sn alinacak
			formParent.find('#sinyalArasiMinSn').val(asFloat(rec[degistirmi ? 'enkisasinyalsn' : 'urunagacsinyalenkisasn']) || 0);
			formParent.find('#sinyalArasiMaxSn').val(asFloat([degistirmi ? 'enuzunsinyalsn' : 'urunagacsinyalenkisasn']) || 0);			// urun agac icin en kisa sn alinacak*/
			const btnBaslat = formParent.find('button#baslat'); if (btnBaslat.length) btnBaslat.html(degistirmi ? 'Değiştir' : 'BAŞLAT')
			const divDurum = divHeader.find('#durumParent > #durum');
			if (divDurum.length) { divDurum[degistirmi ? 'addClass' : 'removeClass']('calisiyor'); divDurum.html(degistirmi ? 'Çalışıyor' : 'Yok') }
			const divOrneklemeContainer = formParent.find('.ornekleme.container');
			if (divOrneklemeContainer.length) {
				if (degistirmi) { divOrneklemeContainer.removeClass('jqx-hidden basic-hidden') }
				else { divOrneklemeContainer.addClass('jqx-hidden') }
				divOrneklemeContainer.find('#ornekSayisi').val(asFloat(rec.orneksayisi) || 0); divOrneklemeContainer.find('#cevrimEnKisa').val(asFloat(rec.cevrimenkisasn) || 0);
				divOrneklemeContainer.find('#cevrimEnUzun').val(asFloat(rec.cevrimenuzunsn) || 0); divOrneklemeContainer.find('#cevrimOrtalama').val(asFloat(rec.cevrimagirlikortalamasn) || 0)
			}
		}
		wndArgsDuzenle(e) {
			super.wndArgsDuzenle(e); const size = { width: Math.min(750, $(window).width() - 1), height: Math.min(800, $(window).height() - 5) };
			$.extend(e.args, { isModal: false, width: size.width, height: size.height })
		}
		tamamIstendi_argsDuzenle(e) {
			let result = super.tamamIstendi_argsDuzenle(e); if (result === false || (result && result.isError)) return result
			const {args} = e, {formParent} = this; if (!this.degistirmi) { args.durum = 'B' }
			$.extend(args, {
				sinyalSayisi: asFloat(formParent.find('#sinyalSayisi').val()) || 0,
				cevrimMinSn: asFloat(formParent.find('#cevrimMinSn').val()) || 0,
				cevrimMaxSn: asFloat(formParent.find('#cevrimMaxSn').val()) || 0,
				sinyalArasiMinSn: asFloat(formParent.find('#sinyalArasiMinSn').val()) || 0,
				sinyalArasiMaxSn: asFloat(formParent.find('#sinyalArasiMaxSn').val()) || 0
			});
			if (args.sinyalMaxSn < args.sinyalMinSn) return { isError: true, rc: 'invalidValue', errorText: `Sinyal Max Süre, Sinyal Min Süre'den küçük olamaz` }
			if (args.enUzunSinyalSn < args.enKisaSinyalSn) return { isError: true, rc: 'invalidValue', errorText: `Sinyal En Uzun Süre, Sinyal En Kısa Süre'den küçük olamaz` }
			if (args.cevrimEnUzun < args.cevrimEnKisa) return { isError: true, rc: 'invalidValue', errorText: `Çevrim En Uzun Süre, Çevrim En Kısa Süre'den küçük olamaz` }
			return true
		}
		async butonTiklandi(e) {
			const {app} = sky, {id} = e, {isId, oemSayac} = this, tezgahId = this.tezgahId?.toString() || '', baseWSArgs = { isId, oemSayac, tezgahId };
			const getWSArgs = e => {
				e = e || {}; const {sahalar, durum} = e, _e = { args: {} }; this.tamamIstendi_argsDuzenle(_e); const wsArgs = $.extend({}, baseWSArgs);
				if (sahalar) { for (const key of sahalar) { wsArgs[key] = _e.args[key] } }
				else { $.extend(wsArgs, _e.args) }
				if (durum != null) { wsArgs.durum = durum } return wsArgs
			};
			try {
				switch (id) {
					case 'baslat':				// baslat veya degistir
					case 'etudReset':
						await app.wsGorevZamanEtuduDegistir(getWSArgs()); this.rec = await app.wsGorevZamanEtuduVeriGetir(baseWSArgs);
						app.signalChangeExternal(); this.close(); break
					case 'etudKapat':
						await app.wsGorevZamanEtuduDegistir(getWSArgs({ durum: 'D' })); app.signalChangeExternal();
						this.close(); break
					case 'sureGuncelleVeEtudKapat':
						await app.wsGorevZamanEtudSureGuncelleVeKapat(getWSArgs()); app.signalChangeExternal(); this.close(); break
				}
			}
			catch (ex) {
				if (ex) {
					if (ex.errorText) { displayMessage(result.errorText, `@ ${this.title || ''} @`) }
					else { defFailBlock(ex) }
				}
			}
		}
		async wnd_onResize(e) { await super.wnd_onResize(e) }
	}
})()
