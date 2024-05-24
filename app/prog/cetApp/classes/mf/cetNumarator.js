(function() {
	window.CETNumarator = class extends window.MQCogul {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, {
				tip: e.tip,
				ozelIsaret: e.ozelIsaret || '',
				seri: e.seri,
				sonNo: parseInt(e.sonNo) || 0
			});
		}
		

		static get table() { return 'const_Numarator' }
		static get tableAlias() { return 'num' }
		static get idSaha() { return 'tip' }
		/*static get dbMgr() { return sky.app.dbMgrs.rom_data }*/
		
		get eIslemmi() { return this.eFatmi || this.eArsivmi }
		get eFatmi() { return (this.tip || '').endsWith('-E') || (this.tip || '').endsWith('-IR') }
		get eArsivmi() { return (this.tip || '').endsWith('-A') }

		static queryStm(e) {
			let sent = new MQSent({
				from: this.table,
				where: [
					{ degerAta: e.tip, saha: this.idSaha },
					{ degerAta: e.ozelIsaret, saha: `ozelIsaret` }
				],
				sahalar: [`tip`, `ozelIsaret`, `seri`, `sonNo`]
			});
			if (!sky.app.ozelIsaretKullanilirmi)
				sent.where.add(`ozelIsaret = ''`);
			const seri = e.seri;
			if (seri != null)
				sent.where.degerAta(seri, `seri`);
			let stm = new MQStm({
				sent: sent,
				orderBy: [`tip`, `seri DESC`]
			});
			
			return stm;
		}

		get fisTable() {
			let sinif = this.fisSinif;
			return sinif ? sinif.table : null;
		}

		get fisSinif() {
			if (this.class._tip2FisSinif == null) {
				this.class._tip2FisSinif = {
					BT: CETTahsilatFis
				}
			}

			return this.class._tip2FisSinif[this.tip] || CETTicariFis;
		}

		static wsBelirtec2TipVeOzelIsaret(e) {
			e = e || {};
			if (typeof e != 'object')
				e = { belirtec: e };
			
			if (this._wsBelirtec2TipVeOzelIsaret == null) {
				this._wsBelirtec2TipVeOzelIsaret = {
					Fatura: { tip: CETSatisFaturaFis.numaratorTip, ozelIsaret: '' },
					FaturaX: { tip: CETSatisFaturaFis.numaratorTip, ozelIsaret: '*' },
					Irsaliye: { tip: CETSatisIrsaliyeFis.numaratorTip, ozelIsaret: '' },
					IrsaliyeX: { tip: CETSatisIrsaliyeFis.numaratorTip, ozelIsaret: '*' },
					Siparis: { tip: CETSatisSiparisFis.numaratorTip, ozelIsaret: '' },
					SiparisX: { tip: CETSatisSiparisFis.numaratorTip, ozelIsaret: '*' },
					BT: { tip: CETTahsilatFis.numaratorTip, ozelIsaret: '' },
					BagimsizTahsilat: { tip: CETTahsilatFis.numaratorTip, ozelIsaret: '' },
					NakitTahsilat: { tip: CETTahsilatFis.numaratorTip, ozelIsaret: '' },
					POSTahsilat: { tip: CETTahsilatFis.numaratorTip, ozelIsaret: '' },
					Sayim: { tip: CETSayimFis.numaratorTip, ozelIsaret: '' },
					DepoTransfer: { tip: CETDepoTransferFis.numaratorTip, ozelIsaret: '' },
					SubeTransfer: { tip: CETSubeTransferFis.numaratorTip, ozelIsaret: '' },
					SubelerArasiTransfer: { tip: CETSubelerArasiTransferSiparisFis.numaratorTip, ozelIsaret: '' },
				}
			}

			const {belirtec} = e;
			let rec = this._wsBelirtec2TipVeOzelIsaret[belirtec];
			if (!rec)
				rec = { tip: belirtec, ozelIsaret: belirtec.endsWith('*') ? '*' : '' };
			if (rec.tip.endsWith('*'))
				rec.tip = rec.tip.slice(0, -1);
			if (rec.tip.endsWith('-'))
				rec.tip = rec.tip.slice(0, -1);

			const tipVeOzelIsaret = $.extend({}, rec);
			const {efAyrimTipi} = e;
			if (efAyrimTipi && !tipVeOzelIsaret.tip.endsWith(`-${efAyrimTipi}`))
				tipVeOzelIsaret.tip += `-${efAyrimTipi}`;
			
			return tipVeOzelIsaret;
		}

		/*static async fromTip(e) {
			if (typeof e != 'object')
				e = { tip: e };
			
			if (!e.tip)
				return null;
			
			let inst = new this({ tip: e.tip });
			await inst.yukle();

			return inst;
		}*/

		async yukle(e) {
			this.reset();
			return await super.yukle({ tip: this.tip, seri: this.seri, ozelIsaret: this.ozelIsaret }, e);
		}

		async kesinlestir(e) {
			e = e || {};
			await this.yukle();

			let dbMgr = e.dbMgr || CETFis.dbMgr;
			let tx = e.tx || await dbMgr.transaction();
			this.sonNo = await this.fisNoDuzelt($.extend({}, e, { yeniKayitmi: e.yeniKayitmi, islem: e.islem, dbMgr: dbMgr, tx: tx }));
			
			dbMgr = this.dbMgr;
			let result = await this.kaydet();
			await dbMgr.transaction();

			return result;
		}

		async fisNoDuzelt(e) {
			e = e || {};
			let dbMgr = e.dbMgr || CETFis.dbMgr;
			let tx = e.tx || await dbMgr.readTransaction();
			
			$.extend(e, {
				dbMgr: dbMgr, tx: tx,
				fisNo: e.fisNo || e.sonNo || this.sonNo || 0
			});
			delete e.sonNo;

			const yeniKayitmi = e.yeniKayitmi == null ? (e.islem == 'yeni' || e.islem == 'kopya') : e.yeniKayitmi;
			if (yeniKayitmi || !e.fisNo)
				e.fisNo++;
			while (await this.fisVarmi(e))
				e.fisNo++;

			return e.fisNo;
		}

		async fisVarmi(e) {
			e = e || {};
			let dbMgr = e.dbMgr || CETFis.dbMgr;
			let query = this.kesinlestirStm(e);
			return !!parseInt(await dbMgr.tekilDegerExecuteSelect({
				tx: e.tx, query: query,
				params: [
					e.ozelIsaret == null ? this.ozelIsaret : e.ozelIsaret,
					e.seri == null ? this.seri : e.seri,
					e.sonNo || e.fisNo || this.sonNo,
					e.fisID || 0
				]
			}));
		}

		kesinlestirStm(e) {
			e = e || {};
			const fisSinif = e.fisSinif || this.fisSinif;
			const fisTable = e.fisTable || fisSinif.table;
			const idSaha = fisSinif.idSaha || 'rowid';
			return (
				`SELECT		COUNT(*) sayi` +
				`	FROM	${fisTable}` +
				`	WHERE	gecici='' AND ozelisaret = ? AND seri = ? AND fisno = ?` +
				`	AND ${idSaha} <> ?`
			)
		}

		reset() {
			this.sonNo = 0;
		}

		hostVars() {
			let hv = super.hostVars() || {};
			$.extend(hv, {
				tip: this.tip,
				ozelIsaret: this.ozelIsaret,
				seri: this.seri || '',
				sonNo: parseInt(this.sonNo) || 0
			});
			
			return hv;
		}
		
		async setValues(e) {
			e = e || {};
			await super.setValues(e);

			const rec = e.rec || {};
			if ($.isEmptyObject(rec))
				return;
			
			$.extend(this, {
				tip: rec.tip,
				ozelIsaret: rec.ozelIsaret || '',
				seri: rec.seri || '',
				sonNo: parseInt(rec.sonNo) || 0
			});
		}
	}
})()
