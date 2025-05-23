(function() {
	window.MQCogul = class extends window.MFYapi {
		constructor(e) {
			e = e || {}; super(e);
			$.extend(this, { dbMgr: e.dbMgr || this.class.dbMgr, id: e.id, eIslemTip: e.eIslemTip, uuid: e.uuid });
			if (this.class.raporDesteklenirmi) this.rapormu = asBool(e.rapormu || e.rapor);
			if (this.class.silindiGonderildiDesteklermi) {
				$.extend(this, {
					devreDisimi: asBool(e.devreDisimi || e.silindi),
					gonderildimi: asBool(e.gonderildimi || e.gonderildi),
					yazdirildimi: asBool(e.yazdirildimi || e.yazdirildi),
					gecicimi: asBool(e.gecicimi || e.gecici)
				});
			}
			if (this.class.degismediDesteklenirmi) this.degismedimi = asBool(e.degismedimi || e.degismedi);
		}
		static get deepCopyAlinmayacaklar() { return $.merge(super.deepCopyAlinmayacaklar || [], ['dbMgr']) }
		reduce() {
			let inst = super.reduce();
			['geciciFis', 'dbMgr', 'geciciFisTimer'].forEach(key => delete inst[key]);
			Object.keys(inst).forEach(key => { if (key && key[0] == '_') delete inst[key] });
			return inst
		}

		static get dbMgr() { return sky.app.dbMgr_mf }
		static get idSaha() { return 'rowid' }
		static get idStringmi() { return false }
		
		static get adimTipi() { return null }
		get matbuuFormTip() { return null }
		static get fisGirisUISinif() { return null }
		static get degistirFisGirisUISinif() { return this.fisGirisUISinif }
		static get icmalSinif() { return null }
		static get dokumcuSinif() { return CETDokumcu_Stream }
		get dokumcuSinif() { return this.class.dokumcuSinif }
		
		static get raporDesteklenirmi() { return false }
		static get silindiGonderildiDesteklermi() { return false }
		static get degismediDesteklenirmi() { return false }
		static get iptalDesteklenirmi() { return false }
		static get seriNoDesteklermi() { return false }
		static get ozelIsaretKullanilirmi() { return false }
		static get ayrimTipiKullanilirmi() { return false }
		static get uygunAyrimTipleri() { return [] }
		static get uygunAyrimTipleriSet() { return asSet(this.uygunAyrimTipleri) || {} }
		static get eIslemKullanilirmi() { return false }
		static get musteriKullanilirmi() { return true }
		static get bedelKullanilirmi() { return false }
		static get rafKullanilirmi() { return false }
		static get refRafKullanilirmi() { return false }
		static get detYerKullanilirmi() { return false }
		static get siparisKontrolEdilirmi() { return false }
		static get siparisMiktarKontrolEdilirmi() { return false }
		static get siparisRefKontrolEdilirmi() { return false }
		static get tarihKontrolYapilirmi() { return false }
		static get tarihKontrolGunSayisi_once() { return 15 }
		static get tarihKontrolGunSayisi_sonra() { return 2 }
		static get aciklama() { return '' }
		get eIslemNumaratorTip() { return this.eIslemTip }
		get yildizlimi() { return this.ozelIsaret == '*' }
		get eBelgemi() { return this.eIslemTip == 'BL' }

		static get baseURL() {
			let result = this._baseURL;
			if (result == null) {
				result = location.origin + location.pathname;
				if (result[result.length - 1] != '/')
					result += '/';
				this._baseURL = result;
			}
			return result;
		}
		static get dirImages() {
			return `${this.baseURL}images/`
		}
		get baseURL() {
			return this.class.baseURL;
		}
		get dirImages() {
			return this.class.dirImages;
		}

		static async getCariEkBilgi(e) {
			e = e || {}; let {mustKod, tx} = e, {caches} = sky.app, rec = null;
			if (mustKod) {
				let cacheDict = caches.mustKod2EkBilgi = caches.mustKod2EkBilgi || {};
				rec = cacheDict[mustKod]; if (!rec) {
					let sent = new MQSent({
						from: 'mst_Cari',
						sahalar: [
							`kod`, `unvan`, `efatmi`, `stdDipIskOran`, `tipKod`, `bolgeKod`, `kosulGrupKod`, `stkFytInd`,
							`(case when length(coalesce(riskCariKod, '')) = 0 then kod else riskCariKod end) riskCariKod`,
							`konTipKod`, `konSubeAdi`, `konumLongitude`, `konumLatitude`, `konumAccuracy`, `rotaDevreDisimi`,
							'adres', 'yore', 'ilAdi', 'sahismi', 'vkn'
						]
					}), {where: wh} = sent; wh.degerAta(mustKod, 'kod');
					rec = await this.dbMgr.tekilExecuteSelect({ tx, query: sent });
					cacheDict[mustKod] = rec
				}
			}
			return rec
		}

		static async getCariEFatmi(e) {
			let rec = e.cariEkBilgi || await this.getCariEkBilgi(e);
			return rec ? asBool(rec.efatmi) : null;
		}

		static async getRiskCariKod(e) {
			e = e || {};
			const {mustKod} = e;
			let result = null;
			if (mustKod != null) {
				result = '';
				if (mustKod) {
					let rec = e.cariEkBilgi || await this.getCariEkBilgi(e) || {};
					result = rec.riskCariKod;
				}
			}

			return result;
		}

		static async getCariStkFytInd(e) {
			let rec = e.cariEkBilgi || await this.getCariEkBilgi(e);
			return rec ? asInteger(rec.stkFytInd) : null;
		}

		async getCariEkBilgi(e) {
			let result = this.cariEkBilgi;
			if (result == null) {
				result = this.cariEkBilgi = await this.class.getCariEkBilgi({ mustKod: this.mustKod });
				if (result) {
					if (result.stkFytInd)
						this.cariStkFytInd = result.stkFytInd;
				}
			}
			return result;
		}

		async getRiskCariKod(e) {
			let result = this.riskCariKod;
			if (result == null) {
				e = e || {}; const mustKod = e.mustKod || this.mustKod, cariEkBilgi = await this.getCariEkBilgi(e);
				result = await this.class.getRiskCariKod({ mustKod, cariEkBilgi });
				this.riskCariKod = result
			}
			return result
		}

		async getRiskCariEkBilgi(e) {
			let result = this.riskCariEkBilgi;
			if (result == null) {
				e = e || {}; const mustKod = e.mustKod || this.mustKod, riskCariKod = await this.getRiskCariKod(e);
				result = (!riskCariKod || riskCariKod == mustKod)
							? await this.getCariEkBilgi({ mustKod })
							: await this.class.getCariEkBilgi({ mustKod: riskCariKod });
				this.riskCariEkBilgi = result
			}
			return result
		}

		async getCariEFatmi(e) {
			let result = this.cariEFatmi;
			if (result == null) {
				e = e || {}; const cariEkBilgi = await this.getRiskCariEkBilgi(e);
				result = await this.class.getCariEFatmi({ cariEkBilgi });
				this.cariEFatmi = result
			}
			return result
		}

		async getCariStkFytInd(e) {
			let result = this.cariStkFytInd;
			if (result == null) {
				const cariEkBilgi = await this.getCariEkBilgi(e);
				result = this.cariStkFytInd;
			}
			return result;
		}

		
		static async kayitlar(e) {
			e = e || {};
			const stm = this.queryStm(e);
			if (!stm)
				return null;
			
			const {dictFlag} = e;
			const {idSaha} = this;
			const rs = await this.dbMgr.executeSql({ tx: e.tx, query: stm });
			const result = dictFlag ? {} : [];
			for (let i = 0; i < rs.rows.length; i++) {
				const rec = rs.rows[i];
				if (dictFlag)
					result[rec[idSaha]] = rec
				else
					result.push(inst)
			}
			return result
		}
		static async oku(e) {
			e = e || {};
			const {id} = e;
			if (id) {
				const inst = new this({ id: id });
				if (!await inst.yukle(e))
					return null
				return inst
			}
			const stm = this.queryStm(e);
			if (!stm)
				return null	
			const {idSaha} = this;
			const rs = await this.dbMgr.executeSql({ tx: e.tx, query: stm });
			const result = [];
			let promises = [];
			for (let i = 0; i < rs.rows.length; i++) {
				const rec = rs.rows[i];
				const inst = new this({ id: rec[idSaha] });
				promises.push(inst.setValues({ rec: rec }));
				result.push(inst)
			}
			await Promise.all(promises);	
			return result
		}
		static queryStm(e) { return this.queryStmOrtak(e) }
		static queryStmOrtak(e) {
			e = e || {};
			const sahalarClause = ($.isArray(e.sahalar) ? e.sahalar.join(', ') : e.sahalar) || `*`;
			const table = e.table || this.table;
			const tableAlias = e.tableAlias || this.tableAlias;
			const idSaha = e.idSaha || this.idSaha;
			const {id, limit, offset} = e;
			const whereClause = e.where || ( idSaha ? (id != null ? `${tableAlias ? tableAlias + '.' : ''}${idSaha} = ?` : `${idSaha} <> ''` ) : `` );
			const orderByClause = e.orderBy || (idSaha == 'rowid' ? '' : idSaha) || '';
			// const limit = e.limit || id ? 1 : null;

			let {params} = e;
			if (!params) {
				params = [];
				if (idSaha && id)
					params.push(id);
			}
			
			return {
				query: (
					`SELECT ${tableAlias ? tableAlias + '.' : ''}rowid, ` +
					`${tableAlias ? tableAlias + '.' : ''}${(sahalarClause || '*')}` +
						(e.sahalarEkClause ? `, ${e.sahalarEkClause}` : ``) +
					` FROM ${table}` + (tableAlias ? ` ${tableAlias}` : ``) +
						(e.fromEkClause ? `, ${e.fromEkClause}` : ``) +
					(e.fromWhereArasiEkClause ? ` ` + e.fromWhereArasiEkClause : ``) +
					(whereClause ? ` WHERE ${whereClause}` : '') +
						(e.whereEkClause ? `${whereClause ? ` AND ` : ``}${e.whereEkClause}` : ``) +
					(orderByClause ? ` ORDER BY ${orderByClause}` : '') +
					(e.limit ? ` LIMIT ${limit}` : '') +
					(e.offset ? ` OFFSET ${offset}` : '')
				),
				params: params
			}
		}
		
		static fisListe_stmSentDuzenle(e) { }
		static rotaListe_fisIslemleri_stmSentDuzenle(e) { }
		static rapor_ilkIrsaliye_stmSentDuzenle(e) { }
		static rapor_sonStok_stmSentDuzenle(e) { }
		static rapor_satislar_stmSentDuzenle(e) { }
		static rapor_tahsilatlar_stmSentDuzenle(e) { }
		static rapor_gunSonuRaporu_stmSentDuzenle_miktarHesaplasma_devirVeKalan(e) { }
		static rapor_gunSonuRaporu_stmSentDuzenle_miktarHesaplasma_satisHareketler(e) { }
		static rapor_gunSonuRaporu_stmSentDuzenle_bedelHesaplasma_satisHareketler(e) { }
		static rapor_gunSonuRaporu_stmSentDuzenle_tahsilatlar(e) { }
		static rapor_bekleyenSiparisler_stmSentDuzenle(e) { }
		static rapor_ozet_stmSentDuzenle(e) { }
		
		async yukle(e) {
			e = e || {};
			let {rec} = e;
			if (!rec) {
				const {dbMgr} = this;
				if (!dbMgr)
					return false;
				
				let queryYapi = this.class.queryStm($.extend({ id: this.id }, e));
				if (!queryYapi)
					return false;
				
				rec = e.rec = await dbMgr.tekilExecuteSelect($.extend(queryYapi, e || {}));
			}
			if (!rec)
				return false;
			
			await this.setValues(e);
			return true;
		}

		async kaydet(e) {
			e = e || {};
			let result = true;
			if (!this.gecicimi) {
				await this.onKontrolWithException(e);
				result = await this.kaydetOncesiKontrol(e);
				if (result === false)
					return false;
			}

			result = await this.kaydetDevam(e);
			if (!result)
				return false;
			
			if (!this.gecicimi)
				await this.kaydetSonrasiIslemler(e);
			
			return result;
		}

		async kaydetDevam(e) {
			e = e || {};
			const {dbMgr} = this;
			if (!dbMgr)
				return false;
			
			let hv = await this.hostVarsDuzenlenmis(e);
			if (!hv)
				return false;
			
			let _e = $.extend({
				tx: e.tx, table: this.class.table,
				hv: hv, mode: 'replace'
			}, e || {});
			await dbMgr.insertOrReplaceTable(_e);
			
			const rs = e.rs = _e.rs;
			const newID = (rs || {}).insertId;
			if (newID && typeof this.id == 'number')
				this.id = newID;
			
			return true;
		}
		silForce(e) { e = e || {}; const force = true; return this.sil({ ...e, force }) }
		async sil(e) {
			e = e || {}; e.islem = 'sil'; let result = true;
			if (!this.gecicimi) { await this.onKontrolWithException_sil(e); result = await this.silmeOncesiKontrol(e); if (result === false) { return false } }
			result = await this.silDevam(e); if (!result) { return false }
			await this.geciciFisleriTemizle(e); if (!this.gecicimi) { await this.silmeSonrasiIslemler(e) }
			return result;
		}
		async silDevam(e) {
			e = e || {};
			const {table} = this.class;
			const idSaha = e.idSaha || this.class.idSaha;
			
			const {serbestModmu} = sky.app;
			const _iptalmi = e.iptal == null ? e.iptalmi : e.iptal;
			let iptalmi = this.gecicimi ? false : (_iptalmi == null ? null : _iptalmi);
			iptalmi = (iptalmi == null ? (this.class.iptalDesteklenirmi ? !(serbestModmu || this.gecicimi) : false) : asBool(iptalmi));

			let query =
				iptalmi
					? `UPDATE ${table} SET silindi='*' WHERE ${idSaha} = ?`
					: `DELETE FROM ${table} WHERE ${idSaha} = ?`;
			let params = [this.id];
			
			let _e = $.extend({ tx: e.tx, query: query, params: params }, e || {});
			let result = await this.dbMgr.executeSql(_e);
			if (result) {
				e.rs = result.rs;
				if (iptalmi)
					this.devreDisimi = true;
			}

			return result;
		}

		async yeniTanimOncesiIslemler(e) {
			if (this.class.ugramami)
				await this.musteriIcinUgramaFisKontrolIslemi(e)
			
			await this.eIslemSetValues(e);
			await this.yeniTanimVeDegistirOncesiIslemlerOrtak(e);
		}

		async degistirOncesiIslemler(e) {
			/*const param = sky.app.param;
			if (!sky.app.serbestModmu) {
				throw {
					isError: true, rc: 'noPermission',
					errorText: `<span class="bold">Cihaz Parametresi kuralı gereği, <u>BELGE DEĞİŞTİRME</u> yetkiniz yok.</span><br/><span>Lütfen belgeyi <b>İPTAL</b> edip sonra <b>KOPYA</b> işlemi yapınız...</span>`
				}
			}*/

			if (e && this.rapormu)
				e.islem = 'izle';
			
			await this.yeniTanimVeDegistirOncesiIslemlerOrtak(e);
			await this.degistirVeSilmeOncesiIslemlerOrtak(e);
		}

		async yeniTanimVeDegistirOncesiIslemlerOrtak(e) {
			let rec = await this.getCariEkBilgi();
			if (rec && asBool(rec.devreDisimi || rec.rotaDevreDisimi)) {
				throw {
					isError: true,
					rc: 'accessDenied',
					errorText: `Bu müşteri için işlem yapılamaz`
				}
			}
		}

		async onKontrol(e) {
			const {tarih} = this;
			if (tarih && this.class.tarihKontrolYapilirmi) {
				const {tarihAralik} = sky.app;
				if (tarihAralik) {
					const {basi, sonu} = tarihAralik;
					if (basi && tarih < asDate(basi)) {
						return {
							isError: true, rc: 'invalidArgument',
							errorText: `Belge Tarihi <b>${dateToString(basi)} tarihinden daha <u>geri</u></b> olamaz`
						}
					}
					if (sonu && tarih > asDate(sonu)) {
						return {
							isError: true, rc: 'invalidArgument',
							errorText: `Belge Tarihi <b>${dateToString(sonu)} tarihinden daha <u>ileri</u></b> olamaz`
						}
					}
				}
				
				const _today = today();
				const farkGun = (tarih - _today) / Date_OneDayNum;
				const {tarihKontrolGunSayisi_sonra, tarihKontrolGunSayisi_once} = this.class;
				if (farkGun > tarihKontrolGunSayisi_sonra) {
					return {
						isError: true, rc: 'invalidArgument',
						errorText: `Belge Tarihi <b>${tarihKontrolGunSayisi_sonra} günden <u>ileri</u></b> olamaz`
					}
				}
				else if (farkGun < 0 - tarihKontrolGunSayisi_once) {
					return {
						isError: true,
						rc: 'invalidArgument',
						errorText: `Belge Tarihi <b>${tarihKontrolGunSayisi_once} günden <u>geri</u></b> olamaz`
					}
				}
			}

			return await super.onKontrol(e);
		}

		async kaydetOncesiKontrol(e) {
			e = e || {};
			const {islem} = e;
			if (islem == 'izle' && !(e.gecicimi || this.gecicimi)) {
				throw {
					isError: true,
					rc: `accessDenied`,
					errorText: `Bu belge <b>İZLE işlemi</b> ile girildiği için kaydedilemez`
				}
			}
			
			await this.belgeGonderimKontrol(e)
		}

		async kaydetSonrasiIslemler(e) {
			if (!this.class.ugramami)
				await this.musteriIcinUgramaFisleriniTemizle(e);

			if (this.degismedimi && this.class.silindiGonderildiDesteklermi) {
				this.degismedimi = false;
				await this.dbMgr.executeSql({
					query: new MQIliskiliUpdate({
						from: this.class.table,
						where: { degerAta: this.id, saha: this.class.idSaha },
						set: `degismedi = ''`
					})
				})
			}
		}

		async onKontrolWithException_sil(e) {
			let result = await this.onKontrol_sil(e) || {};
			if (result.isError)
				throw result;
			
			return true;
		}

		async onKontrol_sil(e) {
			return { isError: false };
		}

		async silmeOncesiKontrol(e) {
			await this.degistirVeSilmeOncesiIslemlerOrtak(e);
		}

		async degistirVeSilmeOncesiIslemlerOrtak(e) {
		}

		async silmeSonrasiIslemler(e) {
		}

		static async belgeGonderimKontrol(e) {
			if (!this.silindiGonderildiDesteklermi)
				return

			const {idSaha} = this;
			const {inst} = e;
			const id = e.id || (inst || {}).id;
			if (!(idSaha && id))
				return

			const dbMgr = e.dbMgr || this.dbMgr;
			const {tx} = e;
			const sent = new MQSent({
				from: this.table,
				where: [
					{ degerAta: id, saha: idSaha },
					`gonderildi <> ''`
				],
				sahalar: ['COUNT(*) sayi']
			});
			if (asInteger(await dbMgr.tekilDegerExecuteSelect({ tx: tx, query: new MQStm({ sent: sent })}))) {
				if (inst)
					inst.gonderildimi = '*'
				// displayMessage(`Bu belge, ekranda düzenleme yapıldığı sırada Arkaplanda Merkeze gönderilmiş ve değişiklik yapılamaz!`, ' ');
				throw { isError: true, rc: 'belgeGonderilmis', errorText: `Bu belge, ekranda düzenleme yapıldığı sırada Arkaplanda Merkeze gönderilmiş ve değişiklik yapılamaz!` }
			}
		}

		async belgeGonderimKontrol(e) {
			e = e || {};
			const dbMgr = e.dbMgr || this.dbMgr;
			return this.class.belgeGonderimKontrol($.extend({}, e, { dbMgr: dbMgr, inst: this }))
		}

		static varsayilanKeyHostVars(e) {
			return {}
		}

		keyHostVars(e) {
			e = e || {};
			const idSaha = e.idSaha || this.class.idSaha;
			const id = this.id;

			let hv = {};
			if (idSaha && id)
				hv[idSaha] = id;
			$.extend(hv, this.class.varsayilanKeyHostVars(e))

			return hv;
		}
		
		hostVars(e) {
			let hv = $.extend(super.hostVars(e) || {}, this.keyHostVars(e) || {});
			if (this.class.raporDesteklenirmi)
				hv.rapor = bool2FileStr(this.rapormu);
			if (this.class.degismediDesteklenirmi)
				hv.degismedi = bool2FileStr(this.degismedimi);
			if (this.class.silindiGonderildiDesteklermi) {
				$.extend(hv, {
					/*silindi: bool2FileStr(this.devreDisimi),
					gonderildi: bool2FileStr(this.gonderildimi),
					yazdirildi: bool2FileStr(this.yazdirildimi)*/
					gecici: bool2FileStr(this.gecicimi)
				}, this.eIslemHostVars(e));
			}

			return hv;
		}

		hostVarsDuzenlenmis(e) {
			e = e || {};
			let hv = e.hv = e.hv || this.hostVars(e);
			return hv;
		}

		keySetValues(e) {
			e = e || {};
			const {rec} = e;
			const idSaha = e.idSaha || this.class.idSaha;
			if (idSaha)
				this.id = rec[idSaha];
		}

		async setValues(e) {
			e = e || {};
			await super.setValues(e);

			const {rec} = e;
			await this.keySetValues(e);

			if (this.class.raporDesteklenirmi)
				this.rapormu = asBool(rec.rapor);
			if (this.class.degismediDesteklenirmi)
				this.degismedimi = asBool(rec.degismedi || rec.degismedimi);
			if (this.class.silindiGonderildiDesteklermi) {
				$.extend(this, {
					devreDisimi: asBool(rec.silindi || rec.devreDisimi),
					gonderildimi: asBool(rec.gonderildi || rec.gonderildimi),
					yazdirildimi: asBool(rec.yazdirildi || rec.yazdirildimi),
					gecicimi: asBool(rec.gecici || rec.gecicimi)
				});
			}
			await this.eIslemSetValues(e);
		}

		eIslemHostVars(e) {
			const {app} = sky;
			const eIslemKullanilirmi = app.eIslemDesteklenirmi && this.class.eIslemKullanilirmi;
			let hv = {};
			if (eIslemKullanilirmi) {
				$.extend(hv, {
					efayrimtipi: this.eIslemTip || '',
					zorunluguidstr: this.uuid || ''
				})
			}
			return hv;
		}

		async eIslemSetValues(e) {
			e = e || {};
			const {app} = sky;
			const eIslemKullanilirmi = app.eIslemDesteklenirmi && this.class.eIslemKullanilirmi;
			if (!eIslemKullanilirmi || this.yildizlimi) {
				this.eIslemTip = '';
				return;
			}

			const {islem} = e;
			const rec = e.rec || e;
			let eIslemTip = rec.eislemtip || rec.eIslemTip || e.eIslemTip || rec.efayrimtipi || rec.efAyrimTipi || e.efAyrimTipi;
			if (!eIslemTip)
				eIslemTip = await this.eIslemTipDegeriFor(e);
			
			if (eIslemTip != null)
				this.eIslemTip = eIslemTip;
			
			let uuid = '';
			if (eIslemTip && !uuid) {
				uuid = (islem ? (islem == 'yeni' || islem == 'kopya') : !rec)
							? newGUID()
							: rec.uuid || e.uuid || rec.zorunluguidstr || e.zorunluguidstr || newGUID();
			}
			this.uuid = uuid;
		}

		async eIslemTipDegeriFor(e) {
			const {app} = sky;
			if (!app.eIslemKullanilirmi || this.yildizlimi)
				return '';
			
			const efatmi = await this.getCariEFatmi(e);
			return efatmi ? 'E' : 'A';
		}

		getSatisKosulYapilari() {
			return null;
		}

		getPromosyonYapilari() {
			return null;
		}

		async initBaslikUI(e) {
			/*const layout = e.layout;
			let input = layout.find('#abc');
			input.on('blur', evt => {
				const target = evt.args || evt.target;
				this[target.id] = target.value;
			});*/
			await this.initBaslikUI_ilk(e);
			await this.initBaslikUI_ara(e);
			await this.initBaslikUI_son(e);
		}

		async initBaslikUI_ilk(e) {
		}
		async initBaslikUI_ara(e) {
		}
		async initBaslikUI_son(e) {
		}

		static musteriDurumu_initRowDetails(e) {
		}

		static async geciciFisleriTemizle(e) {
			e = e || {};
			const {dbMgr} = this;
			let del = new MQIliskiliDelete({
				from: e.table || this.table,
				where: [`gecici <> ''`]
			});
			return await dbMgr.executeSql({ tx: e.tx, query: del })
		}

		async geciciFisleriTemizle(e) {
			if (this._geciciFis) {
				await this._geciciFis.sil(e);
				delete this._geciciFis;
			}

			this.geciciFis_destroyTimer(e);
			// return await this.class.geciciFisleriTemizle(e);
		}

		geciciFis_initTimer(e) {
			let timer = this.class._geciciFisTimer;
			if (timer)
				return timer;
			
			timer = this._geciciFisTimer = setInterval(async e => {
				await this.geciciFis_timerProc(e)
			}, 10000, e);
			
			return timer;
		}

		static geciciFis_destroyTimer() {
			const timer = this._geciciFisTimer;
			if (timer) {
				clearInterval(timer);
				delete this._geciciFisTimer;
			}
			
			return timer;
		}

		geciciFis_destroyTimer() {
			return this.class.geciciFis_destroyTimer();
		}

		async geciciFis_timerProc(e) {
			e = e || {};
			const geciciFis = this._geciciFis;
			if (!geciciFis)
				return;
			
			$.extend(geciciFis, this, {
				gecicimi: true,
				id: geciciFis.id
			});
			await geciciFis.kaydet({ tx: e.tx });
		}

		async musteriIcinUgramaFisKontrolIslemi(e) {
			if (this.gecicimi || this.devreDisimi || this.gonderildimi)
				return;

			let ugramaFis = await this.musteriIcinUgramaFis(e);
			if (ugramaFis) {
				throw {
					isError: true,
					rc: 'musteriIcinUgramaFisVar',
					errorText: `<b>${this.mustKod}</b> kodlu Müşteri için <u>Uğrama Fişi</u> zaten var`
				}
			}
		}

		async musteriIcinUgramaFis(e) {
			const mustKod = this.mustKod;
			if (!mustKod)
				return false;
			
			let sent = new MQSent({
				from: CETUgramaFis.table,
				where: [
					`gecici = ''`, `silindi = ''`,
					{ degerAta: mustKod, saha: 'mustkod' }
				],
				sahalar: `rowid`
			});
			let stm = new MQStm({ sent: sent });

			return await this.dbMgr.tekilExecuteSelect({ tx: e.tx, query: stm });
		}

		async musteriIcinUgramaFisleriniTemizle(e) {
			if (this.gecicimi || this.devreDisimi || this.gonderildimi)
				return;
			
			const mustKod = this.mustKod;
			if (!mustKod)
				return false;
			
			let del = new MQIliskiliDelete({
				from: CETUgramaFis.table,
				where: [
					`gecici = ''`,
					{ degerAta: mustKod, saha: 'mustkod' }
				]
			});
			return await this.dbMgr.executeSql({ tx: e.tx, query: del })
		}

		async yazdir(e) {
			const dokumcu = await this.getDokumcu(e);
			if (!dokumcu)
				return false;
			
			const {app} = sky;
			const {dokumDevice} = dokumcu;
			if (dokumDevice)
				dokumDevice.display = app.param.dokumEkranami;
			
			let dokumcuArgs = {
				debug: asBool(sky.app.debug || sky.app.isDokumDebug)
				/*fis: CETSatisFaturaFis.From({
					fisTipText: 'ABC 342342356  qwffgwegewr gherhrtj tyjktyk tyuyu klyuıkty rt hrt greyher ywe gwr gerg ergerg erg etgerg erge r  15fwe15fg1ewg15we165g w1e56g15we1 h6e5r1h156er1h5e6rh56er16h1er1h5er165h1er56h165er561he56r1h5e6r1he',
					fisSeri: 'VBD', fisNo: '12345'
				})*/
			};
			await this.dokumcuYazdirArgsDuzenle(dokumcuArgs);
			
			let result;
			const savedHasKnobProgress = app.hasKnobProgress;
			if (!savedHasKnobProgress)
				await showProgress('Belge için döküm yapılıyor...', null, 0);
			try {
				result = await dokumcu.yazdir(dokumcuArgs);
				return result;
			}
			catch (ex) {
				ex = ex || {};
				if (ex.rc == 'runtimeInterrupt' || ex.rc == 'userAbort')
					return null;
				
				console.error(ex);
				displayMessage(ex.errorText || ex.message || ex, `@ Döküm Sorunu @`);
				if (sky.config.noErrorHandler)
					throw ex;
			}
			finally {
				if (!savedHasKnobProgress) {
					if (app.hasKnobProgress)
						app.knobProgressHideWithReset({ delayMS: 500 });
					else
						hideProgress();
				}
			}
		}
		numaratorOlustur(e) { return null }
		cacheReset(e) {
			['riskCariKod', 'cariEFatmi', 'stdDipIskOran', 'cariEkBilgi'].forEach(key =>
				delete this[key])
		}
		sevkAdresReset(e) { }
		async dokumcuYazdirArgsDuzenle(e) {
			$.extend(e, { fis: this, matbuuForm: await this.getMatbuuForm() });
		}
		getDokumcu(e) { const cls = this.dokumcuSinif; return cls ? new cls(e) : null; }
		async getMatbuuForm(e) {
			let {matbuuForm} = this;
			if (matbuuForm == null) {
				const matbuuFormYapilari = await sky.app.getMatbuuFormYapilari({ fis: this });		// !! matbuuFormYapilari, matbuuFormTip okunmadan once cekilmelidir !!
				const {matbuuFormTip} = this;
				if (matbuuFormTip)
					matbuuForm = await CETMatbuuForm.fromTip({ matbuuFormTip: matbuuFormTip, fis: this, matbuuFormYapilari: matbuuFormYapilari });
			}
			return matbuuForm
		}

		async dokumcuWriteToDevice(e) {
			/*if (e.debug)
				await e.stream.write('|01| ');
			await e.stream.write('ABC' + CrLf);
			if (e.debug)
				await e.stream.write('|02| ');
			await e.stream.write('  XYZ');
			await e.stream.write('     ABC' + CrLf);*/
		}

		getDokumDetaylar(e) {
			return [];
		}

		async getDokumBaslikDegeri(e) {
			let dict = this.dokumBaslikDegeriDict;
			if (!dict)
				dict = this.dokumBaslikDegeriDict = await this.getDokumAttr2Baslik(e);
			dict = dict || {};

			const {attr} = e;
			let value = await dict[attr];
			if (value == null)
				value = await this[attr];
			if (value == null) {
				const {detaylar} = this;
				const detaySinif = detaylar && detaylar.length ? detaylar[0].class : this.class.detaySinif;
				if (detaySinif)
					value = await detaySinif.getDokumBaslikDegeri(e);
			}
			if ($.isFunction(value))
				value = await value.call(this, e);
			
			return value;
		}

		getDokumAttr2Baslik(e) {
			return {}
		}

		async dokumSahaDegeri(e) {
			let dict = this.dokumDegeriDict;
			if (!dict)
				dict = this.dokumDegeriDict = await this.getDokumDegeriDict(e);
			dict = dict || {};

			const {attr} = e;
			let value = await dict[attr];
			if (value == null)
				value = await this[attr];
			if ($.isFunction(value))
				value = await value.call(this, e);
			if ($.isEmptyObject(value))
				value = null;
			
			return value;
		}

		async getDokumDegeriDict(e) {
			const {app} = sky, {isyeri} = app.param || {}, result = {};
			if (isyeri) {
				for (const _key in isyeri) {
					const key = `isyeri_${_key}`;
					const value = isyeri[_key]
					if (value != null)
						result[key] = value;
				}
			}
			result['!GIBLogo'] = e => `<IMAGE>file:///storage/emulated/0/Download/gib.bmp`;
			result['!GIBLogo_ZPL'] = e => `^GFA,5000,5000,25,gI01FF8,gG03LF8,Y07PFE,X03FFEL07FFC,W01FFCN07FF8,V01FFCP03FF,V07F8R03FC,U01FCT03F8,U0FCL0387M03F,T03FM03C7N0FC,T0FCM03C7I0C4I03F,S03FN036D0B0C4J0FC,S0FCK01E036D1B8CK03F,R03FK063F032D019CCK0FC,R07CK066303791F18D8J03E,Q01FK0E63E03393F189CK0F8,Q07CK0I60033931399CCJ03E,Q0FL0366303393B391C8K0F,P03EI0140361FJ01D390D8FJ078,P078I03601CO010F398I01E,P0F8I06300CO010E3880201F,O03EI046E008Q0C3B80700FC,O07C001E7D8S0C33807803E,O0F8001F318R0783800CE01F,N03E018E31FU01F0182007C,N03CI0638CX01C3003C,N078I071CY0336001E,N0EI0630CY061CI0F,M03E002318g060CI07C,M07C006318g078C6003E,M0FI0E188g03DC7I0F,L01E001E0CgH0F87800F8,L01C0032gK038C0038,L03CI026gJ06DC603C,L078I036gJ0638601E,L0E003C3CgJ03B1C00F,K01E006638gJ01F380078,K03C006F3gL0676003C,K0781049CgL04FF801E,K0701C1B8gL01FFI0E,K0F00E1BP01RFL08I0F,J01E0030EP03QFEK01J078,J03C003CQ0RFCK0106003C,J03818EEP01QFEL0I1003C,J0781CCEP07QFCM078801E,J0F00F86P0RFN06F800E,J0E007Q01QFEN0678007,I01E0018P03QF8N03FI07,I018I0EP07PFEO01E38018,I038I07P0QFCP0C7801C,I07T01QF8Q0FC00C,I07T03PFEQ038600E,I0ET07PFCQ0306006,I0CT0QF8S0C007,001CS01QFS01C1038,001CI04O03PFCS0707038,00181C06O07PF8S061E03C,003818Q07PFU038018,00303R0PFEU0E001C,0070603O01PFCT03CI0E,00E0603O03PF8J0FF8M030E00E,00E0203O03PF8I03FFEN03F007,00E0303O07PFJ07FFEN0F8007,01C01C7O07OFEJ0JFN0FI03,01C00FCO0PF8I01JFO03903800180038O0PFJ03JF8N0FD018003S01OFEJ03JF8M018001C003S03OFCJ07JFCM0DJ0C0070201O03OFCJ03JFCM0D0600E0070601O07OF8J07JFCM0D9E00E00606Q0PFK07JFCM0CFC00600E07CP0OFEK07JFCM0FFI0600E0FF8N01OFEK07JFCM078I0700C0C3EN03OFCK0KF8O0700301E0C06N03OF8K0KF8N03E00701CR03OF8K0KF8N03I0381CR03OFL0KFS0383CR07NFEL07JFS0383CR07NFEL07IFES03C38R0OFCL07IFES03C38R0OFCL03IFCS01C38R0OF8L03IF8S01C38Q01OF8L03IFT01C3R01OFM01FFCT01C3R01OFN07FCU0C3R03NFEN01EV0C3R07NFEgL0C3R07NFCgL0C7R07NFC03OFU0C6R07NF807OFU0C6R0OF007NFEL03DCE7EI066R0OF00OFEL0195ADBI066R0NFE00OFEL0315A91I066R0NFE00OFCL03DCE91I066Q01NFE01OFCU066Q01NFC01OFCU066Q01NFC01OFCU066Q01NFC03OFCU066Q03NFC03OFCU066Q03NFC03OFCU066Q03NF8K01KFCU066Q03NF8K01KFCU066Q03NF8K03KF8U066Q03NFL03KF8U066Q03NFL03KF8U066Q03NFL07KF8U066Q03NFL07KFV066Q03MFEL07KFV066Q03MFEL07KFV066Q03MFEL07KFV066Q03MFEL0LFV0C3Q03MFEL0LFV0C3Q03MFEL0KFEV0C3Q03MFEL0KFEV0C3Q03MFEK01KFEV0C3Q03MFEK01KFEU01C38P03MFEK01KFCU01C38P03MFCK01KFCU01C38P03MFCK03KFCU01C38P03MFEK03KFCU01C38P03MFEK03KFCU03C3CP03MFEK03KF8U03C1CP03MFEK03KF8U0381CP03MFEK03KF8U0381CP03MFEK03KF8U0780EP03MFEK03KFV0700CP03MFEK07KFV0300EP03MFEK07KFV0700EP03NFK07KFV06006P01NFK07KFV0E007P01NFK0LFV0E007P01NFK0KFEV0C003P01NFK0KFEV0C0038P0NF8J0KFEU01C0018P0NF8J0KFCU018001CP0NF8I01KFCU038000CP07MFCI01KFCU07,00EP07MFCI01KFCU07,00EP07MFCI01KFCU07,00EP03MFEI03KFCU0E,007P03MFCI03KFCU0E,003P01MFEI03KFCT01C,0018O01NFI03KFCT018,003CO01NFI07KFCT03C,001CJ0CK0NF8007KF8P0CI038,001CI03FK0NF8007KF8P0EI03,I0EI07F8J07MFC007KF8N034F8007,I06I0F9CJ07MFE00LFO0343C006,I07001E1CJ03MFE00LFO0360C00E,I07001CBCJ03NF00LFO0EFJ0C,I03801CD8J03NF00LFO01BI01C,I01801ECK01NF80LFO01930038,J0E00FEL0NFC1KFEO03F7807,J0E003CL0NFC1KFEO01ED80F,J0F0030FgP08FD80E,J078001F8gN01C3B01C,J03C003C8gM039E0E03C,J03C003786gL03C70C03C,J01E00338EgL01E380078,K0F003D1CgM0F3C00F,K07001C38EgL078001E,K078I078EgK063C001E,K03CI0F14gK0F1C003C,K01EI0C3gK01F0C0078,L0FI087gK0738I0F,L078I0F3gJ039C001E,L03C001E78gI018C003C,L01C003C7C06g070CI078,L01F0018ECgG01F8EI0F8,M0FI01C00CY01BC6001E,M07C001C01CW0219BCI03E,M03E001803CW03196EI078,N0FK0180CU03306EI0F,N078J030DCU01B878001E,N03CJ071FCU01BC7I03C,N03EJ0E338T030FEJ078,O0F8I0E738T0F8EFI01F,O07CI04631EO0FI0C466I03E,O03FJ0671FL0607F878FC7J0FC,P0F8I07E119EJ0607FCFCFE3I01F,P078I01E7F1E38002031C9C06J01E,P01EK07F187C7C403383C3CJ078,Q0FK06718EJ603FC661CI01E,Q07CJ03E30F6606039C6E0CI03C,R0FK0230C67C6030C7804I0F,R07CK030C83E601FC3K03E,R01F8L0FCC6601F8K01F8,S07CL07CFE601EL07E,S03FN03C6N01FC,T07CX03E,T01FX0F8,U07EV07E,V0FCT03F,V03FCR03FC,W0FFEP07FF,W01IFN0IF8,X01IFK01IF8,Y03PFC,gH0LF,,`;
			$.extend(result, {
				ayiracDikCizgi: '|'.repeat(1000),
				ayiracTekCizgi: '-'.repeat(1000),
				ayiracCiftCizgi: '='.repeat(1000),
				ayiracSlash: '/'.repeat(1000),
				ayiracBackslash: '\\'.repeat(1000),
				ayiracYildiz: '*'.repeat(1000),
				ayiracNokta: '.'.repeat(1000),
				fisSayac: this.id, fissayac: this.id,
				devreDisimiText: this.devreDisimi ? 'DevreDışı' : '',
				gonderildimiText: this.gonderildimi ? 'Gönderildi' : '',
				aktarildimiText: this.gonderildimi ? 'Gönderildi' : '',
				yazdirildimiText: this.yazdirildimi ? 'Yazdırıldı' : '',
				gecicimiText: this.gecicimi ? 'Geçici' : '',
				degismedimiText: this.degismedimi ? '' : 'Değişmedi',
				fisTipText: e => {
					let {aciklama} = this.class;
					if (aciklama) {
						const {ayrimTipAdi} = this;
						if (ayrimTipAdi)
							aciklama = `${ayrimTipAdi} ${aciklama}`;
						let ind = aciklama.indexOf('<');
						if (ind > -1)
							aciklama = $(aciklama).text();
					}
					return aciklama;
				},
				tarih: e => {
					const value = this.tarih || this.kayitZamani;
					return value ? dateToString(value) : ``
				},
				saat: e => {
					const value = this.erisimZamani || this.kayitZamani;
					return value ? timeToString(value) : null
				},
				islemTarih: e => {
					const value = this.tarih || this.kayitZamani;
					return value ? dateToString(value) : ``
				},
				tarihKisa: e => {
					const value = this.tarih || this.kayitZamani;
					return value ? dateKisaString(value) : ``
				},
				islemTarihKisa: e => {
					const value = this.tarih || this.kayitZamani;
					return value ? dateKisaString(value) : ``
				},
				islemSaat: e => {
					const value = this.erisimZamani || this.kayitZamani;
					return value ? timeToString(value) : null
				},
				islemZaman: e => {
					const value = this.erisimZamani || this.kayitZamani;
					return value ? timeToString(value) : null
				},
				sevkTarih: e => {
					const value = this.sevkTarih || this.erisimZamani || this.kayitZamani || this.tarih;
					return value ? dateToString(value) : ``
				},
				sevkTarihKisa: e => {
					const value = this.sevkTarih || this.erisimZamani || this.kayitZamani || this.tarih;
					return value ? dateKisaString(value) : ``
				},
				sevkSaat: e => {
					const value = this.sevkSaat || this.saat || this.erisimZamani || this.kayitZamani;
					return value ? timeToString(value) : ``
				},
				kayitZamani: dateTimeToString(this.kayitZamani),
				erisimZamani: dateTimeToString(this.erisimZamani),
				sevkAdresAdi: e => this.getSevkAdresAdi(e),
				plasiyerAdi: e => this.getPlasiyerAdi(e),
				plasiyerText: e => this.getPlasiyerText(e),
				isyeriUnvan: e => this.dokum_getIsyeriUnvan(e),
				isyeriAdres: e => this.dokum_getIsyeriAdres(e),
				isyeriYoreVeIl: e => this.dokum_getIsyeriYoreVeIl(e),
				isyeriYoreIlVeAdres: e => this.dokum_getIsyeriYoreIlVeAdres(e),
				isyeriUnvanYoreIlVeAdres: e => this.dokum_getIsyeriUnvanYoreIlVeAdres(e),
				isyeriVKN: e => this.dokum_getIsyeriVKN(e),
				isyeriVergiDaireVeVKN: e => this.dokum_getIsyeriVergiDaireVeVKN(e),
				musteriKod: this.mustKod,
				musteriUnvan: e => this.dokum_getMustUnvan(e),
				musteriUnvan1: e => this.dokum_getMustUnvan(e),
				musteriUnvan2: ``,
				musteriText: e => this.dokum_getMustText(e),
				musteriEMail: e => this.dokum_getMusteriEMail(e),
				musteriTel1: e => this.dokum_getMusteriTel1(e),
				musteriTel2: e => this.dokum_getMusteriTel2(e),
				musteriTel3: e => this.dokum_getMusteriTel3(e),
				musteriTel: e => this.dokum_getMusteriTel(e),
				musteriYore: e => this.dokum_getMustYore(e),
				musteriIl: e => this.dokum_getMustIl(e),
				musteriYoreVeIl: e => this.dokum_getMustYoreVeIl(e),
				musteriVergiDaireVeVKN: e => this.dokum_getMustVergiDaireVeVKN(e),
				musteriVergiDaire: e => this.dokum_getMustVergiDaire(e),
				musteriYoreIlVeAdres: e => this.dokum_getMustYoreIlVeAdres(e),
				musteriUnvanYoreIlVeAdres: e => this.dokum_getMustUnvanYoreIlVeAdres(e),
				musteriVKN: e => this.dokum_getMustVKN(e),
				musteriVDNo: e => this.dokum_getMustVKN(e),
				musteriVDAdi: e => this.dokum_getMustVergiDaire(e),
				musteriAdres: e => this.dokum_getMustAdres(e),
				musteriAdres1: e => this.dokum_getMustAdres(e),
				musteriAdres2: ``,
				musteriKod: this.mustKod,
				mustUnvan: e => this.dokum_getMustUnvan(e),
				mustUnvan1: e => this.dokum_getMustUnvan(e),
				mustUnvan2: ``,
				mustText: e => this.dokum_getMustText(e),
				mustEMail: e => this.dokum_getMusteriEMail(e),
				mustIl: e => this.dokum_getMustIl(e),
				mustVergiDaireVeVKN: e => this.dokum_getMustVergiDaireVeVKN(e),
				mustVergiDaire: e => this.dokum_getMustVergiDaire(e),
				mustVKN: e => this.dokum_getMustVKN(e),
				mustVDNo: e => this.dokum_getMustVKN(e),
				mustVDAdi: e => this.dokum_getMustVergiDaire(e),
				mustAdres: e => this.dokum_getMustAdres(e),
				mustAdres1: e => this.dokum_getMustAdres(e),
				mustAdres2: ``,
				mustYoreVeIl: e => this.dokum_getMustYoreVeIl(e),
				mustYore: e => this.dokum_getMustYore(e),
				mustYoreIlVeAdres: e => this.dokum_getMustYoreIlVeAdres(e),
				mustUnvanYoreIlVeAdres: e => this.dokum_getMustUnvanYoreIlVeAdres(e),
				fisAciklama: this.aciklama,
				Notlar: this.aciklama,

				async Bakiye(e) {
					if (sky.app.bakiyeRiskGosterilmezmi)
						return null;
					
					const mustKod = await this.getRiskCariKod(e);
					if (!mustKod)
						return null;
					
					let sent = new MQSent({
						from: `mst_Cari`,
						where: [{ degerAta: mustKod, saha: `kod` }],
						sahalar: [`bakiye`]
					});
					let stm = new MQStm({ sent: sent });
					let rec = await this.dbMgr.tekilExecuteSelect({ query: stm });
					if (!rec)
						return null;
					
					const bakiye = bedel(rec.bakiye);
					const {hesaplanmisBakiyeArtisi} = this;
					const oncekiBakiye = hesaplanmisBakiyeArtisi == null ? null : bedel(bakiye - hesaplanmisBakiyeArtisi);
					
					const BedelSize = 13;
					const satirlar = [];
					if (oncekiBakiye != null)
						satirlar.push(`ONCEKI BAKIYE : ${bedelStr(oncekiBakiye).padStart(BedelSize, ' ')} TL`);
					if (bakiye != null)
						satirlar.push(`BAKIYE        : ${bedelStr(bakiye).padStart(BedelSize, ' ')} TL`);
					return satirlar;
				}
			});
			return result
		}
		async getSevkAdresAdi(e) {
			e = e || {}; let {sevkAdresKod} = this; if (!sevkAdresKod) { return null }
			let {sevkAdresAdi: result} = this; if (result == null) {
				let {caches} = sky.app, cache = caches.sevkAdresKod2Rec = caches.sevkAdresKod2Rec || {}, rec = cache[sevkAdresKod];
				result = rec?.aciklama; if (result == null) {
					const stm = new MQStm({ sent: new MQSent({ from: `mst_SevkAdres`, where: { degerAta: sevkAdresKod, saha: 'kod' }, sahalar: ['RTRIM(aciklama) aciklama'] }) });
					result = await this.dbMgr.tekilDegerExecuteSelect({ tx: e.tx, query: stm })
				}
			}
			return result
		}
		async getPlasiyerAdi(e) {
			e = e || {}; const {plasiyerKod} = this; if (!plasiyerKod) return null;
			let result = this.plasiyerAdi;
			if (result == null) {
				const {caches} = sky.app, cache = caches.plasiyerKod2Rec = caches.plasiyerKod2Rec || {}, rec = cache[plasiyerKod];
				result = rec?.aciklama;
				if (result == null) {
					const stm = new MQStm({ sent: new MQSent({ from: `mst_Plasiyer`, where: { degerAta: plasiyerKod, saha: 'kod' }, sahalar: ['RTRIM(aciklama) aciklama'] }) });
					result = await this.dbMgr.tekilDegerExecuteSelect({ tx: e.tx, query: stm });
					//if (result != null)
					//	cache[plasiyerKod] = { kod: plasiyerKod, aciklama: result };
				}
			}
			return result
		}
		async getPlasiyerText(e) {
			const {plasiyerKod} = this; if (!plasiyerKod) return null;
			let {plasiyerText} = this; if (plasiyerText == null) { const plasiyerAdi = await this.getPlasiyerAdi(e); plasiyerText = plasiyerAdi ? `(${plasiyerKod}) ${plasiyerAdi}` : plasiyerKod; }
			return plasiyerText
		}
		async dokum_getMustRec(e) {
			let {dokumTemps} = sky.app, mustKod2DokumTemps = dokumTemps.mustKod2DokumTemps = dokumTemps.mustKod2DokumTemps || {};
			let {mustKod} = this; if (!mustKod) { return null }
			let mustIcinDokumTemps = mustKod2DokumTemps[mustKod] = mustKod2DokumTemps[mustKod] || {}; let rec = mustIcinDokumTemps.mustRec;
			if (rec === undefined) {
				let sent = new MQSent({
					from: 'mst_Cari',
					sahalar: ['unvan', 'yore', 'ilKod', 'ilAdi', 'sahismi', 'vkn', 'vergiDaire', 'adres', 'eMail']
				}), {where: wh} = sent; wh.degerAta(mustKod, 'kod');
				rec = mustIcinDokumTemps.mustRec = await this.dbMgr.tekilExecuteSelect(sent)
			}
			return rec
		}
		dokum_getIsyeriRec(e) { e = e || {}; const {app} = sky, isyeri = e.rec ?? app.param?.isyeri; return isyeri }
		dokum_getIsyeriSahismi(e) { const rec = this.dokum_getIsyeriRec(e) || {}; return asBool(rec.sahisfirmasi); }
		dokum_getIsyeriUnvan(e) { const rec = this.dokum_getIsyeriRec(e) || {}; return rec.aciklama || '' }
		dokum_getIsyeriAdres(e) {
			const rec = this.dokum_getIsyeriRec(e) || {}, MaxSize = 40, textListe = [];
			let text = [rec.adres1, rec.adres2].filter(x => !!x).join(' ');
			for (let i = 0; i < 2; i++) { if (text) { textListe.push(text.substr(0, MaxSize)); text = text.substr(MaxSize) } }
			if (text) textListe.push(text)
			return textListe
		}
		dokum_getIsyeriYoreVeIl(e) { const rec = this.dokum_getIsyeriRec(e) || {}; return `${rec.yore || ''}${rec.iladi ? '/' : ''}${rec.iladi || ''}` }
		dokum_getIsyeriYoreIlVeAdres(e) { const rec = this.dokum_getIsyeriRec(e) || {}; return [this.dokum_getIsyeriYoreVeIl(e), ...(this.dokum_getIsyeriAdres(e))] }
		dokum_getIsyeriUnvanYoreIlVeAdres(e) { const rec = this.dokum_getIsyeriRec(e) || {}; return [this.dokum_getIsyeriUnvan(e), ...(this.dokum_getIsyeriYoreIlVeAdres(e))] }
		dokum_getIsyeriVKN(e) { const rec = this.dokum_getIsyeriRec(e) || {}, sahismi = this.dokum_getIsyeriSahismi($.extend({}, e, { rec })); return (sahismi ? rec.tckimlikno : rec.vergino) || '' }
		dokum_getIsyeriVergiDaireVeVKN(e) { const rec = this.dokum_getIsyeriRec(e) || {}, vkn = this.dokum_getIsyeriVKN($.extend({}, e, { rec })); return `${rec.vergidaire || ''}${vkn ? ' - ' : ''}${vkn || ''}` }
		async dokum_getMustUnvan(e) { const rec = await this.dokum_getMustRec(e) || {}; return rec.unvan }
		async dokum_getMustText(e) { const unvan = await this.dokum_getMustUnvan(e) || ``; return new CKodVeAdi({ kod: this.mustKod, aciklama: unvan || '' }) .parantezliOzet() }
		async dokum_getMusteriEMail(e) { const rec = await this.dokum_getMustRec(e) || {}; return `${rec.eMail || rec.email || ''}` }
		async dokum_getMusteriTel1(e) { const rec = await this.dokum_getMustRec(e) || {}; return `${rec.tel1 || ''}` }
		async dokum_getMusteriTel2(e) { const rec = await this.dokum_getMustRec(e) || {}; return `${rec.tel2 || ''}` }
		async dokum_getMusteriTel3(e) { const rec = await this.dokum_getMustRec(e) || {}; return `${rec.tel3 || ''}` }
		async dokum_getMusteriTel(e) { const rec = await this.dokum_getMustRec(e) || {}; return rec.tel3 || rec.tel1 || rec.tel2 || '' }
		async dokum_getMustYore(e) { const rec = await this.dokum_getMustRec(e) || {}; return `${rec.yore || ''}` }
		async dokum_getMustIl(e) { const rec = await this.dokum_getMustRec(e) || {}; return `${rec.ilAdi || ''}` }
		async dokum_getMustYoreVeIl(e) { const rec = await this.dokum_getMustRec(e) || {}; return `${rec.yore || ''}${rec.ilAdi ? '/' : ''}${rec.ilAdi || ''}` }
		async dokum_getMustVergiDaireVeVKN(e) { const rec = await this.dokum_getMustRec(e) || {}; return `${rec.vergiDaire || ''}${rec.vkn ? ' - ' : ''}${rec.vkn || ''}` }
		async dokum_getMustVergiDaire(e) { const rec = await this.dokum_getMustRec(e) || {}; return `${rec.vergiDaire || ''}` }
		async dokum_getMustVKN(e) { const rec = await this.dokum_getMustRec(e) || {}; return `${rec.vkn || ''}` }
		async dokum_getMustAdres(e) {
			const rec = await this.dokum_getMustRec(e) || {}, MaxSize = 40, textListe = []; let text = rec.adres;
			for (let i = 0; i < 2; i++) { if (text) { textListe.push(text.substr(0, MaxSize)); text = text.substr(MaxSize) } }
			if (text) textListe.push(text)
			return textListe
		}
		async dokum_getMustYoreIlVeAdres(e) {
			const rec = await this.dokum_getMustRec(e) || {};
			return [...(await this.dokum_getMustAdres(e)), await this.dokum_getMustYoreVeIl(e)]
		}
		async dokum_getMustUnvanYoreIlVeAdres(e) {
			const rec = await this.dokum_getMustRec(e) || {};
			return [await this.dokum_getMustText(e), ...(await this.dokum_getMustYoreIlVeAdres(e))]
		}
	};
})()
