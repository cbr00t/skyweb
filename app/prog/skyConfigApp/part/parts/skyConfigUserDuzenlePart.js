(function() {
	window.SkyConfigUserDuzenlePart = class extends window.SkyConfigWindowPart {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				baslikText: e.baslikText,
				rec: e.rec,
				ozelTip: e.ozelTip,
				yetkiKisitSet: e.yetkiKisitSet
			});
		}

		static get partName() { return 'userDuzenle' }
		get defaultTitle() { return 'Kullanıcı Tanımı' }
		get defaultIsModal() { return true }
		get autoFocus_uiSelector() { return `#user_parent #user` }

		get skyBulutYedeklememi() { return this.ozelTip == 'skyBulutYedekleme' }
		
		
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

			this.yetkiBilgiContent = wndContent.find(`#yetkiBilgi`);

			const txtUser = this.txtUser = wndContent.find(`#user`);
			txtUser.val(rec.user || '');
			txtUser.on('change', evt =>
				this.rec.user = (evt.currentTarget.value || '').trimEnd());

			const txtUserDesc = this.txtUserDesc = wndContent.find(`#userDesc`);
			txtUserDesc.val(rec.userDesc || '');
			txtUserDesc.on('change', evt =>
				this.rec.userDesc = (evt.currentTarget.value || '').trimEnd());
			
			const txtPass = this.txtPass = wndContent.find(`#pass`);
			txtPass.val(rec.pass || '');
			txtPass.on('change', evt =>
				this.rec.pass = (evt.currentTarget.value || '').trimEnd());

			const kotaParent = this.kotaParent = wndContent.find(`#kota_parent`);
			const txtKota = this.txtKota = kotaParent.find(`#kota`);
			if (this.skyBulutYedeklememi) {
				txtKota.val(rec.kotaMB || rec.kota || '');
				txtKota.on('change', evt => {
					const {rec} = this;
					const value = asFloat((evt.currentTarget.value || '').trimEnd()) || null;
					evt.target.value = value || '';
					rec.kotaMB = value;
					delete rec.kota;
				});
				kotaParent.removeClass(`jqx-hidden basic-hidden`);
			}
			else
				kotaParent.addClass(`jqx-hidden`);

			const {yetki2EkBilgi} = SkyConfigYetki;
			const itemHeight = 35;
			let yetkiSource = Object.entries(yetki2EkBilgi).map(arr => {
				return { kod: arr[0], aciklama: arr[1].aciklama || arr[0] }
			});
			const {yetkiKisitSet} = this;
			let yetkiKisitVarmi = false;
			if (!$.isEmptyObject(yetkiKisitSet)) {
				yetkiSource = yetkiSource.filter(ka => !!yetkiKisitSet[ka.kod]);
				yetkiKisitVarmi = true;
			}
			const ddYetki = this.ddYetki = wndContent.find(`#yetki`).jqxDropDownList({
				theme: theme, valueMember: 'kod', displayMember: 'aciklama',
				width: '99%', height: 45,
				filterable: true, filterHeight: 35, filterPlaceHolder: `Bul:`, searchMode: 'containsignorecase',
				autoDropDownHeight: false, dropDownHeight: 335, itemHeight: itemHeight,
				source: new $.jqx.dataAdapter({
					id: `kod`, datatype: 'array',
					localdata: yetkiSource
				}, {
					autoBind: false, async: true, cache: true
				}),
				selectionRenderer: span => {
					setTimeout(() => {
						const {ddYetki, rec} = this;
						const kod = ddYetki && ddYetki.length ? ddYetki.val() : rec.yetki;
						const ekBilgi = kod ? yetki2EkBilgi[kod] : null;
						if (ekBilgi && ekBilgi.renk)
							span.css('color', ekBilgi.renk);
					}, 10);
					return span;
				},
				renderer: (index, aciklama, kod) => {
					const ekBilgi = kod ? yetki2EkBilgi[kod] : null;
					const {renk} = (ekBilgi || {});
					return (
						`<div class="ddList-item" style="height: ${itemHeight}px;` +
							(renk ? `color: ${renk};` : '') +
						`">${aciklama}</div>`
					)
				}
			});
			ddYetki.on('change', evt => {
				this.rec.yetki = evt.args.item.value;
				this.yetkiDegisti($.extend({}, e, { event: evt }));
			})
			rec.yetki = rec.yetki || (yetkiKisitVarmi ? Object.keys(yetkiKisitSet)[0] : 'restricted');
			if (rec.yetki)
				ddYetki.val(rec.yetki);

			const txtEMails = this.txtEMails = wndContent.find(`#eMails`);
			txtEMails.val(
				rec.eMails
					? (rec.eMails || []).map(x => x.replace('\r', '').trim()).join('\n')
					: ''
			);
			txtEMails.on('change', evt => {
				const {value} = evt.currentTarget;
				this.rec.eMails = value
					? value.split('\n').map(x => (x || '').replace('\r', '').trim())
						.filter(x => x)
					: null;
			});

			const txtAPIAccess = this.txtAPIAccess = wndContent.find(`#apiAccess`);
			txtAPIAccess.val(
				rec.apiAccess
					? (rec.apiAccess || []).map(x => x.replace('\r', '').trim()).join('\n')
					: ''
			);
			if (app.gelismisModmu && !app.gelismisModDisabledFlag) {
				txtAPIAccess.on('change', evt => {
					const {value} = evt.currentTarget;
					this.rec.apiAccess = value
						? value.split('\n').map(x => (x || '').replace('\r', '').trim())
							.filter(x => x)
						: null;
				});
				txtAPIAccess.parent().parent().removeClass('jqx-hidden basic-hidden');
			}
			else {
				txtAPIAccess.parent().parent().addClass('jqx-hidden');
			}

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

			const minWidth = 600;
			const minHeight = 600;
			$.extend(e.args, {
				width: Math.max(Math.min(850, $(window).width() - 50), minWidth),
				height: Math.max(Math.min(750, $(window).height() - 50), minHeight),
				minWidth: minWidth, minHeight: minHeight
			});
		}

		tamamIstendi_argsDuzenle(e) {
			super.tamamIstendi_argsDuzenle(e);

			const rec = this.rec || {};
			let {user, pass} = rec;
			if (!user)
				return { isError: true, rc: 'emptyArgument', errorText: `<b>Kullanıcı</b> boş olamaz` };
			/*if (!pass)
				return { isError: true, rc: 'emptyArgument', errorText: `<b>Şifre</b> boş olamaz` };*/

			if (pass && pass.length != 32)
				pass = rec.pass = md5(pass);
			
			e.args.rec = rec;
		}

		yetkiDegisti(e) {
			const {yetkiBilgiContent} = this;
			if (!(yetkiBilgiContent && yetkiBilgiContent.length))
				return;
			
			const {yetki} = this.rec || {};
			const ekBilgi = yetki ? SkyConfigYetki.yetki2EkBilgi[yetki] : null;
			
			let docFrg;
			if (ekBilgi) {
				const {aciklama, izinler} = ekBilgi;
				docFrg = $(document.createDocumentFragment());
				docFrg.append($(`<div class="title">${aciklama}</div>`));
				
				const ul = $(`<ul></ul>`);
				for (const i in izinler) {
					const izinText = izinler[i];
					ul.append(`<li class="item">${izinText}</li>`);
				}
				ul.appendTo(docFrg);
			}
			yetkiBilgiContent.children().remove();
			if (docFrg)
				docFrg.appendTo(yetkiBilgiContent);
		}
		
		async wnd_onResize(e) {
			await super.wnd_onResize(e);
		}
	}
})()
