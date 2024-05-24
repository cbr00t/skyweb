(function() {
	window.SkyConfigUsersPart = class extends window.SkyConfigInnerPartWithTabs {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				wsConfigParentSelector: e.wsConfigParentSelector || 'yonetim',
				duzenlemeEkraniTitle: e.duzenlemeEkraniTitle,
				ozelTip: e.ozelTip,
				yetkiKisitSet: e.yetkiKisitSet
			});
		}

		static get partName() { return 'users' }
		get autoFocus_uiSelector() { return `#liste` }

		get rootConfig() {
			return this._rootConfig = this._rootConfig || {};
		}
		set rootConfig(value) {
			this._rootConfig = value;
		}

		get config_users() {
			return this._config_users = this._config_users || [];
		}
		set config_users(value) {
			this._config_users = value;
		}

		
		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);
		}

		async initTabContent(e) {
			await super.initTabContent(e);

			const {tabID} = e;
			switch (tabID) {
				case 'users':
					return await this.initTabContent_users(e);
			}
		}

		async initTabContent_users(e) {
			const {wsConfig} = this;
			const {tabPage} = e;

			const islemTuslari = this.islemTuslari = tabPage.find(`.islemTuslari`);
			islemTuslari.find('button')
				.jqxButton({ theme: theme })
				.on('click', evt =>
					this.islemTusuTiklandi($.extend({}, e, { event: evt, id: evt.currentTarget.id })));

			const liste_parent = tabPage.find(`#liste_parent`);
			const divListe = liste_parent.find(`#liste`);
			const listePart = this.listePart = new DataTablePart({
				layout: divListe,
				widgetBeforeInit: _e => {
					$.extend(_e.widgetArgs, {
						pageable: true, pageSize: 10,
						selectionMode: 'singleRow',
						filterable: true, filterMode: 'default', filterHeight: 35,
						serverProcessing: false
					});
				},
				/*widgetAfterInit: _e => {
					const {widgetPart} = _e;
					widgetPart.on('rowDoubleClick', evt =>
						this.baslatIstendi(e));
				},*/
				columns: [
					{ dataField: 'user', text: 'Kullanıcı', width: 200, cellClassName: 'user' },
					{ dataField: 'userDesc', text: 'İsim', cellClassName: 'userDesc' },
					{ dataField: 'yetki', text: 'Yetki', width: 230, cellClassName: 'yetki', align: 'right', cellsAlign: 'right' }
				],
				loadServerData: e =>
					this.liste_loadServerData(e),
				itemClick: e =>
					this.liste_onItemClick(e),
				itemDblClick: e =>
					this.liste_onItemDblClick(e),
				bindingComplete: e =>
					this.liste_veriYuklendi(e)
			});
			listePart.basicRun();
			listePart.layout
				.detach()
				.appendTo(liste_parent);
		}
		
		async tazele(e) {
			const {app, wsURLBase} = this;
			const promise_wsConfigOku = app.wsConfigOku({ wsURLBase: wsURLBase });
			
			await super.tazele();

			promise_wsConfigOku
				.then(result => this.wsConfigOku_onResponse($.extend({}, e, { isError: result.isError || false, result: result })))
				.catch(result => this.wsConfigOku_onResponse($.extend({}, e, { isError: true, result: result })));
		}

		async rootConfigKaydet(e) {
			const {app, _rootConfig} = this;
			if (_rootConfig) {
				try { return await app.wsConfigYaz({ wsURLBase: wsURLBase, rootConfig: _rootConfig }) }
				catch (ex) { defFailBlock(ex) }
			}
			return null;
		}

		wsConfigOku_onResponse(e) {
			const {isError, result} = e;
			if (isError) {
				const error = (result || {}).responseJSON || result;
				if ((error.rc || error.code) != 'accessDenied' && (result || {}).statusText != 'abort')
					defFailBlock(result);
				return;
			}

			const rootConfig = this.rootConfig = result.rootConfig;
			const wsConfig = this.wsConfig = rootConfig.wsConfig = rootConfig.wsConfig || {};
			const {wsConfigParentSelector} = this;
			const wsConfig_parent = this.wsConfig_parent = wsConfig[wsConfigParentSelector] = wsConfig[wsConfigParentSelector] || {};
			this.config_users = wsConfig_parent.users = wsConfig_parent.users || [];
			this.listeTazele(e);

			setTimeout(async () => {
				await this.onResize();
			}, 500);
		}

		listeTazele(e) {
			const {listePart} = this;
			if (listePart && !listePart.isDestroyed && listePart.widgetPart)
				listePart.tazele();
		}

		async liste_loadServerData(e) {
			const {config_users} = this;
			return config_users.filter(rec => !!rec.user);
		}

		liste_veriYuklendi(e) {
			const {config_users} = this;
			if (!$.isEmptyObject(config_users)) {
				const kodSet = asSet(config_users.map(rec => rec.user));
				const {widget} = this.listePart;
				if (!widget)
					return;
				
				const recs = widget.getRows();
				widget.beginUpdate();
				for (const i in recs) {
					const {user} = recs[i];
					if (kodSet[user])
						widget.selectrowbykey(user);
				}
				widget.endUpdate();
			}
		}

		liste_onItemClick(e) {
			/*const uid = e.event.args.key;
			const {widget} = this.listePart;
			if (uid != null) {
				const rowInfo = widget.rowinfo[uid];
				if (rowInfo.selected)
					widget.unselectrowbykey(uid);
				else
					widget.selectrowbykey(uid);
			}*/
		}

		liste_onItemDblClick(e) {
			const {islemTuslari} = this;
			const btn = islemTuslari.find(`#degistir`);
			if (btn && btn.length)
				btn.click();
		}

		async islemTusuTiklandi(e) {
			const {event, id} = e;
			let target = (event || {}).currentTarget;
			if (target)
				target = $(target);
			
			if (target)
				setButonEnabled(target, false);
			try {
				switch (id) {
					case 'ekle':
						return await this.ekleIstendi(e);
					case 'degistir':
						return await this.degistirIstendi(e);
					case 'sil':
						return await this.silIstendi(e);
				}
			}
			finally {
				setTimeout(() => {
					if (target)
						setButonEnabled(target, true);
				}, 500);
			}
		}

		ekleIstendi(e) {
			const part = new SkyConfigUserDuzenlePart({
				title: this.duzenlemeEkraniTitle,
				ozelTip: this.ozelTip,
				yetkiKisitSet: this.yetkiKisitSet,
				tamamIslemi: _e => {
					const {rec} = _e;
					const {wsConfig_parent} = this;
					const users = wsConfig_parent.users = wsConfig_parent.users || [];
					if (users.find(_rec => _rec.user == user))
						throw { isError: true, rc: 'duplicateRecord', errorText: `<b>${user}</b> kodlu Kullanıcı zaten var` };
					delete rec.uid;
					delete rec._visible;
					users.push(rec);
					this.rootConfigKaydet().then(() =>
						this.tazele())
				}
			});
			part.open();

			return part;
		}

		degistirIstendi(e) {
			const {listePart} = this;
			const {widget} = listePart;
			const rec = (widget.getSelection() || [])[0];
			if (!rec)
				return null;
			
			const part = new SkyConfigUserDuzenlePart({
				title: this.duzenlemeEkraniTitle,
				ozelTip: this.ozelTip,
				yetkiKisitSet: this.yetkiKisitSet,
				rec: rec,
				tamamIslemi: _e => {
					const newRec = _e.rec;
					delete newRec.uid;
					delete newRec._visible;
					const {user} = newRec;
					const {wsConfig_parent} = this;
					const users = wsConfig_parent.users = wsConfig_parent.users || [];
					const index = users.findIndex(_rec => _rec.user == user);
					if (index == null || index < 0)
						throw { isError: true, rc: 'noRecordMatch', errorText: `<b>${user}</b> kodlu Kullanıcı için tanım belirlenemedi` };
					users[index] = newRec;
					this.rootConfigKaydet().then(() =>
						this.tazele())
				}
			});
			part.open();
			
			return part;
		}

		silIstendi(e) {
			const {listePart} = this;
			const {widget} = listePart;
			const rec = (widget.getSelection() || [])[0];
			if (!rec)
				return null;

			const {user} = rec;
			return new $.Deferred(p => {
				createJQXWindow(
					(
						`<div class="bold red">Seçilen Kullanıcı silinsin mi?</div>` +
						`<p/>` +
						`<div style="margin-left: 20px; font-size: 80%; color: #aaa;" class="ekBilgi"><b>${rec.user || ''}</b> ${rec.userDesc || ''}</div>`
					),
					`Kullanıcı Silinecek`,
					{
						width: 400, height: 250, isModal: true
					},
					{
						EVET: async (dlgUI, btnUI) => {
							dlgUI.jqxWindow('destroy');
							(async () => {
								try {
									const {wsConfig_parent} = this;
									const users = wsConfig_parent.users = wsConfig_parent.users || [];
									const index = users.findIndex(_rec => _rec.user == user);
									if (index == null || index < 0) {
										try {
											throw { isError: true, rc: 'noRecordMatch', errorText: `<b>${user}</b> kodlu Kullanıcı için tanım belirlenemedi` }
										}
										catch (ex) {
											const {isError, errorText} = ex;
											if (isError && errorText)
												displayMessage(errorText, `@ Kullanıcı Silme İşlemi @`);
										}
									}
									users.splice(index, 1);
									this.rootConfigKaydet().then(() =>
										this.tazele())
									p.resolve(true);
								}
								catch (ex) { p.reject(ex) }
							})();
						},
						HAYIR: (dlgUI, btnUI) => {
							dlgUI.jqxWindow('destroy');
							p.reject({ isError: false, rc: 'userAbort' })
						},
					}
				)
			})
		}
		
		async onResize(e) {
			if ((await super.onResize(e)) === false)
				return false;

			const {listePart, panel} = this;
			if (listePart && !listePart.isDestroyed && listePart.widgetPart) {
				const layout = panel && panel.length ? panel.find(`.jqx-tabs-content > #users.jqx-tabs-content-element`) : this.layout;
				if (layout && layout.length) {
					const divListe = listePart.widgetPart;
					let height = layout.height() - (divListe.position().top - 23);
					divListe.jqxDataTable('height', height);
				}
			}
		}
	}
})()
