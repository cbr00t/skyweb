(function() {
	window.CETParam = class extends window.MQTekil {
		constructor(e) {
			e = e || {};
			super(e);
			
			this.class.sabitAttrListe.forEach(key =>
				this[key] = e[key] === undefined ? this[key] : e[key]);
			$.extend(this, {
				version: this.version || this.class.version,
				fisTip2SonSeri: this.fisTip2SonSeri || {},
				uygunAyrimTipleri: this.uygunAyrimTipleri,
				dokumEkranami: this.dokumEkranami == null ? true : this.dokumEkranami,
				dokumDeviceTip: (this.dokumDeviceTip == null ? 'quickPrint' : this.dokumDeviceTip),
				barkodDeviceTip: (this.barkodDeviceTip == null ? CETBarkodDevice_Camera_HTML5.tip : this.barkodDeviceTip),
				dokumTurkceHarfYontemKod: (this.dokumTurkceHarfYontemKod == null ? '' : this.dokumTurkceHarfYontemKod),
				dokumEncoding: this.dokumEncoding || this.class.defaultDokumEncoding,
				dokumDeviceSP_baudRate: this.dokumDeviceSP_baudRate || 9600,
				varsayilanWSHostName: this.varsayilanWSHostName || 'wsHostName',
				brm2Fra: $.extend({
					'': 0, AD: 0, ADET: 0,
					PK: 0, PAKET: 0, KL: 0, KOLI: 0, PALET: 0,
					KG: 3, KILO: 3, LT: 3, LITRE: 3, MG: 3, GR: 3, GRAM: 3, TON: 3,
					MT: 5, M: 5
				}, this.brm2Fra || {}),
				// tip2Renk: this.tip2Renk || {},
				fiyatFra: this.fiyatFra == null ? 4 : this.fiyatFra,
				ekOzellikKullanim: this.ekOzellikKullanim || {},
				tip2EkOzellikYapi: this.tip2EkOzellikYapi || {},
				isyeri: this.isyeri || {},
				mustKod2Bilgi: this.mustKod2Bilgi || {},
				userSettings: this.userSettings || {},
				nakitUstLimit: this.nakitUstLimit == null ? 7000 : this.nakitUstLimit,
				stokFiyatKdvlimi: this.stokFiyatKdvlimi == null ? false : asBool(this.stokFiyatKdvlimi),
				isaretliBelgeKDVDurumu: this.isaretliBelgeKDVDurumu == null ? '' : this.isaretliBelgeKDVDurumu || '',
				alimFiyatGorurmu: this.alimFiyatGorurmu == null ? true : asBool(this.alimFiyatGorurmu),
				satisFiyatGorurmu: this.satisFiyatGorurmu == null ? true : asBool(this.satisFiyatGorurmu),
				konumToleransMetre: asFloat(this.konumToleransMetre) || 1000,
				ruloParam: this.ruloParam || {},
				ruloEkNotlar: this.ruloEkNotlar || {},
				tip2MatbuuFormDuzenleyiciler: this.tip2MatbuuFormDuzenleyiciler || {},
				tip2MatbuuFormDuzenleyiciler_runtime: this.tip2MatbuuFormDuzenleyiciler_runtime || {}
			})
		}
		static get table() { return 'CETParam' }
		static get sabitAttrListe() {
			return [
				'version', 'wsHostName', 'wsHostName2', 'varsayilanWSHostName', 'wsPort', 'skyWSURL', 'fiyatFra', 'uygunAyrimTipleri', 'subeKod', 'yerKod', 'ilkKM', 'sonKM', 'fisTip2SonSeri',
				'ilkKMGirildimi', 'sonKMGirildimi', 'ilkIrsaliyeRaporuAlindimi',
				'bakiyeRiskGosterilmezmi', 'oncekiFislerGosterilmezmi', 'nakitUstLimit', 'dokumEkranami', 'dokumDeviceTip', 'dokumDeviceSP_baudRate', 'barkodDeviceTip',
				'dokumTurkceHarfYontemKod', 'dokumEncoding', 'dokumDataPrefix', 'dokumDataPostfix', 'darDokummu', 'serbestModmu', 'gridAltMultiSelectFlag', 'brm2Fra', 'tip2Renk',
				'tarihAralik', 'fisTarihDegistirilirmi', 'kmTakibiYapilirmi', 'ilkIrsaliyeDokumuZorunlumu', 'dokumNettenmi', 'stokFiyatKdvlimi', 'yildizKullanilirmi', 'isaretliBelgeKDVDurumu',
				'bakiyeyeEtkilenirmi', 'faturadaTahsilatYapilirmi', 'yazdirilanTahsilatDegistirilmezmi', 'tahsilatIptalEdilemezmi', 'detaylardaFiyatDegistirilirmi', 'iskontoArttirilirmi',
				'menuAdimKisitIDListe', 'fisAdimKisitIDListe', 'dogrudanFisListeyeGirilirmi', 'barkodluFisGirisYapilirmi', 'fisGirisSadeceBarkodZorunlumu', 'geciciFisKullanilmazmi', 'silerekBilgiAlYapilirmi',
				'listeKodDogrudanAramaYapilirmi', 'fisOzetBilgiGosterilirmi', 'stokPaketKodlari', 'sonStokKontrolEdilirmi', 'sonStokKontrolEdilirmi_siparis', 'alimNetFiyatGosterilirmi',
				'iskSayi', 'kadIskSayi', 'satirIskOranSinir', 'musteriDegistirilirmi', 'musteriRotaZorunlumu', 'rotaDevreDisiGosterilirmi',
				'riskKontrolDurum', 'eIslemKullanilirmi', 'eIrsaliyeKullanilirmi', 'eBelgeAltSinir', 'sicakTeslimFisimi',
				'depoSiparisRefKontrolEdilirmi', 'depoMalKabulSiparisKontrolEdilirmi', 'depoMalKabulSiparisMiktariKontrolEdilirmi', 'depoMalKabulSiparisHMRlimi',
				'depoSevkiyatSiparisKontrolEdilirmi', 'depoSevkiyatSiparisMiktariKontrolEdilirmi', 'depoSevkiyatSiparisHMRlimi', 'depoSevkiyatSiparisKarsilamaOdemeGunTekmi',
				'alimFiyatGorurmu', 'satisFiyatGorurmu', 'konumTakibiYapilirmi', 'konumsuzIslemYapilirmi', 'konumToleransMetre', 'dokumRuloDuzmu', 'dokumNushaSayi',
				'ozelKampanyaKullanilirmi', 'ozelKampanyaOranSayisi', 'otoSonStokGuncellenirmi', 'rbkKullanilirmi', 'fisGirisiRbkOtomatikAcilsinmi', 'depoSiparisKarsilamaZorunluHMRListe',
				'nakliyeSekliKullanilmazmi', 'dovizKullanilirmi', 'resimBaseURL',
				'tip2MatbuuFormDuzenleyiciler', 'tip2MatbuuFormDuzenleyiciler_runtime',
				'ekOzellikKullanim', 'tip2EkOzellikYapi', 'isyeri', 'ruloParam', 'ruloEkNotlar', 'mustKod2Bilgi', 'kapandimi', 'userSettings'
			]
		}
		static get version() { return 2 }
		get wsHostNameUyarlanmis() {
			const value = this[this.varsayilanWSHostName || 'wsHostName'];
			return value ? value.trim() : value
		}

		get skyWSURLUyarlanmis() {
			let value = (this.skyWSURL || '').trim();
			if (!value)
				return value;
			if (!value.startsWith('http://') || value.startsWith('https://'))
				value = `http://${value}:8200`;
			if (value && !value.endsWith('/'))
				value += '/';
			return value
		}

		get wsPortsUyarlanmis() {
			const wsPorts = [];
			const wsPortsDizi = (this.wsPort ? this.wsPort.toString().trim().split(`|`) : []);
			for (let i in wsPortsDizi) {
				const subText = wsPortsDizi[i].trim();
				if (subText) {
					const subParts = subText.split(`-`);
					let basi = asInteger(subParts[0]) || 0;
					let sonu = asInteger(subParts[1]) || 0;
					basi = sonu ? Math.min(basi, sonu) : basi;
					sonu = basi ? Math.max(basi, sonu) : sonu;
					if (basi) {
						for (let wsPort = basi; wsPort <= sonu; wsPort++)
							wsPorts.push(wsPort);
					}
				}
				else {
					const wsPort = asInteger(subText) || 0;
					if (wsPort)
						wsPorts.push(wsPort);
				}
			}

			return wsPorts;
		}

		get browserFlags() {
			const {wsHostNameUyarlanmis, wsPortsUyarlanmis} = this;
			if (!wsHostNameUyarlanmis)
				return null;
			
			const ports = ['', 81, 8200, 9200];
			ports.push(...wsPortsUyarlanmis);
			const liste = [];
			liste.push(`https://cdnjs.cloudflare.com`);
			for (let i in ports) {
				const prefixVePort = ports[i] ? `:${ports[i]}` : ``;
				liste.push(`http://${wsHostNameUyarlanmis}${prefixVePort}`);
			}

			return liste.join(`,`);
		}

		static get defaultDokumEncoding() { return 'ISO-8859-1' }

		get dokumEncodingUyarlanmis() {
			return this.dokumEncoding || this.class.defaultDokumEncoding
		}

		get turkceHarfYontem_normalmi() {
			return !this.dokumTurkceHarfYontemKod
		}
		get turkceHarfYontem_turkcesizmi() {
			return this.dokumTurkceHarfYontemKod == 'TRS'
		}
		get turkceHarfYontem_karakterKodlamasiDegistirmi() {
			return this.dokumTurkceHarfYontemKod == 'ENC'
		}


		hostVars() {
			let hv = super.hostVars() || {};
			this.class.sabitAttrListe.forEach(key =>
				hv[key] = this[key] || '');
			hv.subeKod = this.subeKod;
			
			return hv;
		}
		
		setValues(e) {
			e = e || {};
			super.setValues(e);
			
			let rec = e.rec || {};
			if ($.isEmptyObject(rec))
				return;
			
			this.class.sabitAttrListe.forEach(key => {
				let value = rec[key];
				if (value !== undefined)
					this[key] = value;
			});

			[	'version', 'dokumDeviceSP_baudRate', 'iskSayi', 'kadIskSayi', 'fiyatFra', 'ozelKampanyaOranSayisi' ].forEach(key => {
				let value = this[key];
				if (/*value != null &&*/ typeof value != 'number')
					this[key] = asInteger(value) || 0;
			});
			[	'ilkKM', 'sonKM', 'satirIskOranSinir' ].forEach(key => {
				let value = this[key];
				if (/*value != null &&*/ typeof value != 'number')
					this[key] = asFloat(value) || 0;
			});
			[	'serbestModmu', 'gridAltMultiSelectFlag', 'dokumEkranami', 'stokFiyatKdvlimi', 'yildizKullanilirmi', 'darDokummu', 'dokumNettenmi', 'sonStokKontrolEdilirmi', 'sonStokKontrolEdilirmi_siparis',
				'dogrudanFisListeyeGirilirmi', 'barkodluFisGirisYapilirmi', 'fisGirisSadeceBarkodZorunlumu', 'geciciFisKullanilmazmi', 'listeKodDogrudanAramaYapilirmi', 'fisOzetBilgiGosterilirmi' ,'silerekBilgiAlYapilirmi',
				'alimNetFiyatGosterilirmi', 'musteriDegistirilirmi', 'bakiyeRiskGosterilmezmi', 'musteriRotaZorunlumu', 'ilkIrsaliyeDokumuZorunlumu', 'kmTakibiYapilirmi', 'faturadaTahsilatYapilirmi', 'yazdirilanTahsilatDegistirilmezmi', 'tahsilatIptalEdilemezmi',
				'iskontoArttirilirmi', 'detaylardaFiyatDegistirilirmi', 'fisTarihDegistirilirmi', 'sicakTeslimFisimi', 'eIslemKullanilirmi', 'depoSiparisRefKontrolEdilirmi',
				'depoMalKabulSiparisKontrolEdilirmi', 'depoMalKabulSiparisMiktariKontrolEdilirmi', 'depoMalKabulSiparisHMRlimi', 'depoSevkiyatSiparisKontrolEdilirmi', 'depoSevkiyatSiparisMiktariKontrolEdilirmi', 'depoSevkiyatSiparisHMRlimi', 'depoSevkiyatSiparisKarsilamaOdemeGunTekmi',
				'alimFiyatGorurmu', 'satisFiyatGorurmu', 'ozelKampanyaKullanilirmi', 'konumTakibiYapilirmi', 'konumsuzIslemYapilirmi', 'otoSonStokGuncellenirmi', 'rbkKullanilirmi', 'fisGirisiRbkOtomatikAcilsinmi',
				'nakliyeSekliKullanilmazmi', /*'dovizKullanilirmi',*/ 'dokumRuloDuzmu', 'kapandimi'
			].forEach(key => {
				let value = this[key];
				// if (value != null)
				this[key] = asBool(value);
			});
		}

		reduce() {
			const inst = super.reduce();
			[	'userSettings', 'varsayilanWSHostName', 'fisTip2SonSeri', 'ekOzellikKullanim', 'tip2EkOzellikYapi', 'isyeri',
				 'ruloParam', 'ruloEkNotlar', 'tip2MatbuuFormDuzenleyiciler', 'tip2MatbuuFormDuzenleyiciler_runtime'
			].forEach(key =>
				delete inst[key]);
			
			/*const mustKod2Bilgi = inst.mustKod2Bilgi || {};
			for (const mustKod in mustKod2Bilgi) {
				const bilgi = mustKod2Bilgi[mustKod];
				delete bilgi.konumBilgi;
			}*/

			return inst;
		}

		asBasicParam() {
			const inst = {};
			[		'version', 'wsHostName', 'wsHostName2', 'varsayilanWSHostName', 'wsPort',
					'dokumEkranami', 'dokumDeviceTip', 'dokumDeviceSP_baudRate', 'barkodDeviceTip', 'serbestModmu'
			].forEach(key =>
				inst[key] = this[key]);
			
			return inst;
		}
	}
})()
