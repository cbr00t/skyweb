(function() {
	window.SkyCafeMasalarPart = class extends window.SkyCafePartBase {
		constructor(e) {
			e = e || {};
			super(e);
		}

		static get noResizeEventOnInputs() { return false }
		static get partName() { return 'masalar' }
		get adimText() { return this.app.appText }

		preInitLayout(e) {
			e = e || {};
			super.preInitLayout(e);

			const layout = e.layout || this.layout;
			$.extend(this, {
				templates: layout.find(`#templates`),
				hizliBulForm: layout.find(`#hizliBulForm`),
				txtHizliBul: layout.find(`#hizliBulForm #txtHizliBul`),
				masalarFormParent: layout.find(`#masalarFormParent`),
				masalarForm: layout.find(`#masalarFormParent #masalarForm`)
			});
			this.templateItem = this.templates.contents(`.item`);

			this.initItemListPart(e);

			const {txtHizliBul} = this;
			txtHizliBul.jqxInput({
				theme: theme, height: false, maxLength: 40
			});
			txtHizliBul
				.on('focus', evt => {
					evt.target.select();
					
					this.setUniqueTimeout({
						key: 'hizliBul_onFocus',
						delayMS: 500,
						args: $.extend({}, e, { event: evt }),
						block: async e => {
							const {app} = this;
							const {klavyePart} = app;
							if (!(klavyePart && klavyePart.wnd)) {
								const _e = {
									/*width: $(window).width() < 680 ? 650 : $(window).width(),
									height: 250,*/
									position: `bottom`
								};
								await this.app.initKlavyePart(_e);
								setTimeout(() => evt.currentTarget.focus(), 150);
							}
							else {
								setTimeout(() => evt.currentTarget.focus(), 0);
							}

						}
					});
				})
				.on('keyup', evt => {
					const key = (evt.key || '').toLowerCase();
					if (key == 'enter' || key == 'linefeed') {
						this.tazele($.extend({}, e, { event: evt }));
					}
					else {
						this.setUniqueTimeout({
							key: 'hizliBul_onChange',
							delayMS: 500,
							args: $.extend({}, e, { event: evt }),
							block: e =>
								this.tazele(e)
						})
					}
				});
			
			Utils.makeScrollable(this.masalarForm);
		}

		postInitLayout(e) {
			e = e || {};
			super.postInitLayout(e);

			this.timersDisabledFlag = false;
		}

		async destroyPart(e) {
			// this.timersDisabledFlag = true;

			const {itemListPart} = this;
			if (itemListPart)
				itemListPart.destroyPart(e);
			
			return await super.destroyPart(e);
		}

		async activatePart(e) {
			const {layout} = this;
			layout.css(`opacity`, .1);

			await super.activatePart(e);

			setTimeout(() => {
				layout.css(`opacity`, .3);
			}, 50);

			(async () => {
				try { await this.tazele(e) }
				catch (ex) { }
				
				this.onResize(e);
				this.timersDisabledFlag = false;
				setTimeout(() => {
					layout.css(`opacity`, 1);
				}, 100);
			})();
		}

		async deactivatePart(e) {
			// this.timersDisabledFlag = true;
			
			const {app} = this;
			await app.closeNumKlavyePart();
			await app.closeKlavyePart();

			await super.deactivatePart(e);
		}

		setUpTimers(e) {
			super.setUpTimers(e);

			const {app, timers} = this;
			const {programcimi} = app;
			/*if (!(app.timerYokmu || app.masaTazeleTimerYokmu)) {
				timers.masaTazele = {
					delay: 2000, interval: true,
					block: async e => {
						if (!(app.timerYokmu || app.masaTazeleTimerYokmu || this.timersDisabledFlag))
							await this.tazele(e);
					}
				}
			}*/
		}

		initItemListPart(e) {
			const {layout} = this;
			this.itemListPart = new SkyCafeItemList({
				content: layout,
				hizliBulForm: this.hizliBulForm, txtHizliBul: this.txtHizliBul,
				itemFormParent: this.masalarFormParent, itemForm: this.masalarForm,
				templateItem: this.templateItem,
				idSelector: 'id', aciklamaSelector: 'aciklama',
				defaultFilters: e => {
					const {app, sender, aktifFiltre} = this;
					const {aktifMasaTipKod} = app;
					const filters = [];
					if (aktifFiltre)
						filters.push(aktifFiltre);
					if (aktifMasaTipKod) {
						filters.push(e =>
							e.rec.tipKod == aktifMasaTipKod);
					}
					filters.push(e =>
						e.sender.filterAciklama(e));
					return filters
				},
				dataSource: e =>
					this.getDataSource(e),
				/*defaultItemDuzenleyici: e =>
					this.listeRenderItem(e),*/
				eventSelector: e =>
					this.masaTiklandi(e)
			});
		}

		async syncCompleted(e) {
			const {app} = this;
			/*if (app.promise_masalarTazele) {
				await app.promise_masalarTazele.reject(false);
				delete app.promise_masalarTazele;
				await this.clearUniqueTimeout({ key: 'masalarTazele' });
			}*/
			
			try { await this.tazele() }
			catch (ex) { }
		}

		tazele(e) {
			const {app} = this;
			const promise = app.promise_masalarTazele = new $.Deferred(p => {
				setTimeout(async e => {
					const _promise = new $.Deferred(async p2 => {
						try { p2.resolve(await app.wsWaitAll()) }
						catch (ex) { p2.resolve(ex) }
					});
					setTimeout(() => _promise.resolve({ isError: true, rc: 'userAbort' }), 100);
					try { await _promise }
					catch (ex) { }
					
					try { p.resolve(await this.tazeleDevam(e)) }
					catch (ex) { p.reject(ex) }
					finally { delete app.promise_masalarTazele }
				}, 50, e);
			});
			
			return promise;
		}

		async tazeleDevam(e) {
			const {app, itemListPart} = this;
			await itemListPart.tazele(e);

			this.masalarUIUpdate(e);
			app.navPart.tazele();
			this.aktifMasaTipDegisti(e);
		}

		masalarUIUpdate(e) {
			e = e || {};
			const {masalarForm, app} = this;
			masalarForm[this.app.zAcikmi ? 'removeClass' : 'addClass'](`zKapali`);
			
			let item;
			item = masalarForm.find(`.item`);
			if (item.length)
				item.removeClass(`selected`);
			
			const {aktifMasaID} = app;
			if (aktifMasaID != null) {
				item = masalarForm.find(`.item#${aktifMasaID}`);
				if (item.length)
					item.addClass(`selected`);
			}
		}

		async masaTiklandi(e) {
			const {app, masalarForm} = this;
			const {event} = e;
			const id = e.id || ((event || {}).currentTarget || {}).id;

			(((window.savedProcs || {}).showProgress) || showProgress) (null, null, 300);
			// await app.promiseWait;
			const _promise = new $.Deferred(async p2 => {
				try { p2.resolve(await app.wsWaitAll()) }
				catch (ex) { p2.resolve(ex) }
			});
			setTimeout(() => _promise.resolve({ isError: true, rc: 'userAbort' }), 200);
			try { await _promise } catch (ex) { }
			setTimeout(() => ((window.savedProcs || {}).hideProgress || hideProgress)(), 1);
			
			const masa = await app.getMasa({ id: id });
			if (masa.servisDisimi) {
				const result = await app.servisDisiIstendi({ masa: masa });
				if (!masa.servisDisimi)
					this.tazele();
				return;
			}
			
			if (!app.tekTikmi && id != app.aktifMasaID) {
				await app.setAktifMasa({ id: id });
				this.masalarUIUpdate(e);
				return;
			}
			
			await app.setAktifMasa({ masa: masa });
			this.masalarUIUpdate(e);
			app.showContent({ partClass: SkyCafeSatisEkraniPart });
		}

		async getDataSource(e) {
			e = e || {};
			const stm = new MQStm({
				sent: new MQSent({
					from: `${SkyCafeMasa.table} mas`,
					fromIliskiler: [
						{
							alias: `mas`, leftJoin: `${SkyCafeFis.table} fis`,
							iliski: `fis.${SkyCafeFis.idSaha} = mas.aktifFisID`
						}
					],
					where: [
						{ not: !this.app.class.pratikSatismi, degerAta: SkyCafeMasaTip.PratikSatis, saha: `anaTip` }
					],
					sahalar: [
						`mas.rowid`, `mas.*`,
						`fis.aciklama fisAciklama`, `fis.sonislemzamani`, `fis.kapanmazamani`,
						`fis.yazdirildi`, `fis.fisSonuc`
					]
				}),
				orderBy: [
					`mas.anaTip`, `mas.sira`, `mas.kod`
				]
			});
			const result = [];
			const rs = await SkyCafeMasa.dbMgr.executeSql({ tx: e.tx, query: stm });
			for (let i = 0; i < rs.rows.length; i++) {
				const rec = rs.rows[i];
				const inst = new SkyCafeMasa();
				await inst.setValues({ rec: rec });

				const {aktifFisID} = rec;
				if (aktifFisID) {
					const _rec = {
						id: aktifFisID,
						aciklama: rec.fisAciklama,
						kapanmazamani: rec.kapanmazamani,
						sonislemzamani: rec.sonislemzamani,
						yazdirildi: rec.yazdirildi
					};
					const fis = inst._aktifFis = new SkyCafeFis();
					await fis.setValues({ rec: _rec });
					fis._fisSonuc = rec.fisSonuc;
				}

				result.push(inst);
			}

			return result;
		}

		getNavMenuSource(e) {
			const {app} = this;
			const {zAcikmi} = app;
			const {pratikSatismi} = app.class;
			const {sefmi, garsonmu, raporYokmu} = app;

			const result = [];
			if (pratikSatismi) {
				result.push(...[
					{ id: 'masalar', html: 'TÜM FİŞLER' },
					{ id: 'acikMasalar', html: 'AÇIK FİŞLER' }
				]);
			}
			else {
				result.push(...[
					{ id: 'paket', html: 'PAKET' },
					{ id: 'selfServis', html: 'SELF SERVIS' },
					{ id: 'masalar', html: 'TÜM MASALAR' },
					{ id: 'acikMasalar', html: 'AÇIK MASALAR' },
					{ id: 'tumMasalar', html: 'DEVRE DIŞI MASALAR' }
				]);
			}
			if (sefmi)
				result.push({ id: 'zAcKapat', html: `Z ${app.zAcikmi ? 'KAPAT' : 'AÇ'}` });

			const {kullanilanMasaTipIDSet, id2MasaTip} = app;
			if (id2MasaTip && !$.isEmptyObject(kullanilanMasaTipIDSet)) {
				result.push({ id: 'separator1', html: `<hr/>`, value: 'separator', disabled: true });
				for (const tipKod in kullanilanMasaTipIDSet) {
					if (tipKod) {
						const rec = id2MasaTip[tipKod] || {};
						result.push({ id: tipKod,  html: rec.aciklama || tipKod, value: 'masaTip' });
					}
				}
			}

			if (!garsonmu) {
				result.push({ id: 'separator2', html: `<hr/>`, value: 'separator', disabled: true });
				result.push({ id: 'kasiyerIslemleri', html: `Kasiyer İşlemleri` });
				if (sefmi)
					result.push({ id: 'zHesaplasma', html: `Z Hesaplaşma` });
			}

			if (sefmi && !raporYokmu) {
				result.push({ id: 'separator3', html: `<hr/>`, value: 'separator', disabled: true });
				result.push({ id: 'rapor', html: `RAPOR EKRANI` });
			}

			return result;
		}

		navMenuTiklandi(e) {
			const {sender, navMenuItems} = e;
			const evt = e.event;
			const target = evt ? $(evt.args || evt.currentTarget) : (id ? navMenuItems.filter(`li#${id}`) : null);
			const id = e.id || (target ? target.prop('id') : null);

			switch (id) {
				case 'paket':
					this.paketIstendi(e);
					break;
				case 'selfServis':
					this.selfServisIstendi(e);
					break;
				case 'tumMasalar':
					this.tumMasalarIstendi(e);
					break;
				case 'masalar':
					this.masalarIstendi(e);
					break;
				case 'acikMasalar':
					this.acikMasalarIstendi(e);
					break;
				case 'zAcKapat':
					this.zAcKapatIstendi(e);
					break;
				case 'kasiyerIslemleri':
					this.kasiyerIslemleriIstendi(e);
					break;
				case 'zHesaplasma':
					this.zHesaplasmaIstendi(e);
					break;
				case 'rapor':
					this.raporIstendi(e);
					break;
				default:
					if (target.attr('item-value') == 'masaTip') {
						this.app.aktifMasaTipKod = target.prop('id');
						this.tazele(e);
					}
					break;
			}
		}

		paketIstendi(e) {
			const {app} = this;
			app.aktifMasaKaldir();
			delete app.aktifMasaTipKod;
			this.aktifMasaTipDegisti(e);

			this.aktifFiltre = e => {
				const {rec} = e;
				return !rec.servisDisimi && rec.anaTip == SkyCafeMasaTip.Paket
			};
			this.tazele(e);
		}

		selfServisIstendi(e) {
			const {app} = this;
			app.aktifMasaKaldir();
			delete app.aktifMasaTipKod;
			this.aktifMasaTipDegisti(e);

			this.aktifFiltre = e => {
				const {rec} = e;
				return !rec.servisDisimi && rec.anaTip == SkyCafeMasaTip.SelfServis
			};
			this.tazele(e);
		}

		masalarIstendi(e) {
			const {app} = this;
			app.aktifMasaKaldir();
			delete app.aktifMasaTipKod;
			this.aktifMasaTipDegisti(e);

			this.aktifFiltre = e => {
				const {rec} = e;
				return !rec.servisDisimi
			};
			this.tazele(e);
		}

		acikMasalarIstendi(e) {
			const {app} = this;
			app.aktifMasaKaldir();
			delete app.aktifMasaTipKod;
			this.aktifMasaTipDegisti(e);

			this.aktifFiltre = e => {
				const {rec} = e;
				return !rec.servisDisimi && rec.acikmi
			};
			this.tazele(e);
		}

		tumMasalarIstendi(e) {
			const {app} = this;
			app.aktifMasaKaldir();
			delete app.aktifMasaTipKod;
			this.aktifMasaTipDegisti(e);

			this.aktifFiltre = null;
			this.tazele(e);
		}

		zAcKapatIstendi(e) {
			const {app} = this;
			app.zAcKapatIstendi(e);
		}

		kasiyerIslemleriIstendi(e) {
			const {app} = this;
			app.kasiyerIslemleriIstendi(e);
		}

		zHesaplasmaIstendi(e) {
			const {app} = this;
			app.zHesaplasmaIstendi(e);
		}

		raporIstendi(e) {
			const {app} = this;
			app.raporIstendi(e);
		}

		aktifMasaTipDegisti(e) {
			const {navPart, aktifMasaTipKod} = this.app;
			const navMenuItems = navPart ? navPart.navMenuItems : null;
			if (!(navMenuItems && navMenuItems.length))
				return;
			
			navMenuItems.filter(`li[item-value=masaTip]`).removeClass(`selected`);
			if (aktifMasaTipKod) {
				const li = navMenuItems.filter(`li#${aktifMasaTipKod}`);
				if (li && li.length)
					li.addClass(`selected`);
			}
		}

		klavye_tusTiklandi(e) {
			return false;
		}

		async onResize(e) {
			await super.onResize(e);

			const {itemListPart} = this;
			if (itemListPart)
				itemListPart.onResize(e);

			/*const {masalarForm} = this;
			masalarForm.width($(window).width() - masalarForm.offset().left - 3);
			masalarForm.height($(window).height() - masalarForm.offset().top);*/
		}
	}
})()
