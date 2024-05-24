(function() {
	window.CETTicariIcmal = class extends window.MQIcmal {
		constructor(e) {
			e = e || {};
			super(e);
			
			$.extend(this, {
				_topMatrah: e.topMatrah,
				topKdv: e.topKdv,
				oran2MatrahVeKdv: e.oran2MatrahVeKdv || {},
				yuvarlamaFarki: e.yuvarlamaFarki
			})
		}

		static get uygunKdvOranSet() {
			if (!this._uygunKdvOranSet)
				this._uygunKdvOranSet = asSet([0, 1, 10, 20])
			return this._uygunKdvOranSet
		}

		/*get topMatrah() {
			if (this._topMatrah == null) {
				let toplam = 0;
				$.each(this.oran2MatrahVeKdv || {}, (oran, matrahVeKdv) =>
					toplam += matrahVeKdv.matrah);
				this._topMatrah = toplam;
			}
			
			return this._topKdv;
		}*/

		get cokluKdvmi() {
			return (this.oran2MatrahVeKdv || {}).length > 1
		}

		hostVars(e) {
			let hv = super.hostVars(e);
			// hv.topmatrah = bedel(this.topMatrah) || 0;
			hv.topkdv = bedel(this.topKdv) || 0;
			hv.yuvarlamaFarki = bedel(this.yuvarlamaFarki) || 0;
			
			const {oran2MatrahVeKdv} = this;
			const kdvOranlari = Object.keys(this.class.uygunKdvOranSet);
			for (const i in kdvOranlari) {
				const kdvOrani = asInteger(kdvOranlari[i]);
				const matrahVeKdv = oran2MatrahVeKdv[kdvOrani] || {};
				hv[`matrah${kdvOrani}`] = matrahVeKdv.matrah || 0;
				if (kdvOrani)
					hv[`kdv${kdvOrani}`] = matrahVeKdv.kdv || 0;
			}

			return hv;
		}

		setValues(e) {
			super.setValues(e);
			
			const {rec} = e;
			$.extend(this, {
				// _topMatrah: rec.topMatrah == null ? null : (bedel(rec.topMatrah) || 0)
				topKdv: rec.topkdv == null ? null : bedel(rec.topkdv) || 0,
				yuvarlamaFarki: rec.yuvarlamaFarki == null ? null : bedel(rec.yuvarlamaFarki) || 0,
			});
			
			const {oran2MatrahVeKdv} = this;
			const {uygunKdvOranSet} = this.class;
			for (let kdvOrani in uygunKdvOranSet) {
				kdvOrani = asInteger(kdvOrani);
				let matrah = asFloat(rec[`matrah${kdvOrani}`]) || 0;
				if (matrah) {
					const matrahVeKdv = oran2MatrahVeKdv[kdvOrani] = oran2MatrahVeKdv[kdvOrani] || { matrah: 0, kdv: 0 };
					matrahVeKdv.matrah = matrah;
					if (kdvOrani)
						matrahVeKdv.kdv = asFloat(rec[`kdv${kdvOrani}`]) || 0;
				}
			}
		}

		hesapla(e) {
			e = e || {};
			super.hesapla(e);

			const {fis} = e;
			if (!fis)
				return false;

			const {app} = sky;
			const {yildizlimi} = fis;
			const {oran2MatrahVeKdv} = this;
			const detaylar = fis.detaylar || [];

			let yuvarlamaFarki = 0;
			if (yildizlimi) {
				if (app.yildizYuvarlamaFarkimi) {
					for (const i in detaylar) {
						const det = detaylar[i];
						const {kdvOrani, orjKdvOrani, netBedel} = det;
						if (kdvOrani || !orjKdvOrani)
							continue;
						const kdv = bedel(netBedel * orjKdvOrani / 100);
						yuvarlamaFarki += kdv;
					}
					yuvarlamaFarki = bedel(yuvarlamaFarki);
				}
			}
			else {
				for (const i in detaylar) {
					const det = detaylar[i];
					const kdvOrani = asInteger(det.kdvOrani) || 0;
					const matrah = bedel(det.netBedel || det.bedel || 0);
					// const kdv = bedel(det.kdv) || 0;
					
					let matrahVeKdv = oran2MatrahVeKdv[kdvOrani] = (oran2MatrahVeKdv[kdvOrani]) || { matrah: 0, kdv: 0 };
					matrahVeKdv.matrah += bedel(matrah);
					// matrahVeKdv.kdv += bedel(kdv);
				}
			}

			const dipBrut = this.brut;
			let sonucBedel = dipBrut;
			let topDipIskonto = 0;
			const {dipIskOran, dipIskBedel} = fis;
			if (dipIskOran)
				topDipIskonto += bedel(sonucBedel * dipIskOran / 100);
			topDipIskonto += bedel(dipIskBedel || 0);
			this.topDipIskonto = topDipIskonto;
			sonucBedel -= bedel(topDipIskonto);
			
			const oran2MatrahVeKdvLength = Object.values(oran2MatrahVeKdv).length;
			if (topDipIskonto) {
				if (oran2MatrahVeKdvLength == 1) {
					const matrahVeKdv = getFirstValue(oran2MatrahVeKdv);
					matrahVeKdv.matrah = bedel(matrahVeKdv.matrah - topDipIskonto);
				}
				else if (oran2MatrahVeKdvLength > 1) {
					let kalan = topDipIskonto;
					let carpan = sonucBedel / this.brut;
					let maxMatrahVeKdv;
					for (const oran in oran2MatrahVeKdv) {
						const matrahVeKdv = oran2MatrahVeKdv[oran];
						let yeniDeger = bedel(matrahVeKdv.matrah * carpan);
						let buDusulecek = matrahVeKdv.matrah - yeniDeger;
						matrahVeKdv.matrah = bedel(yeniDeger);
						kalan -= buDusulecek;
						if (!maxMatrahVeKdv || matrahVeKdv.matrah > maxMatrahVeKdv.matrah)
							maxMatrahVeKdv = matrahVeKdv;
					}
					if (maxMatrahVeKdv)
						maxMatrahVeKdv.matrah = bedel(maxMatrahVeKdv.matrah - kalan);
				}
			}

			let topKdv = 0;
			for (const oran in oran2MatrahVeKdv) {
				const matrahVeKdv = oran2MatrahVeKdv[oran];
				let kdv = bedel(matrahVeKdv.matrah * oran / 100);
				topKdv += kdv;
				matrahVeKdv.kdv = kdv;
			}
			this.topKdv = topKdv;
			sonucBedel += topKdv;

			if (yuvarlamaFarki && dipBrut && topDipIskonto) {
				const oranti = topDipIskonto / dipBrut;
				yuvarlamaFarki = bedel(yuvarlamaFarki * (1 - oranti));
			}
			this.yuvarlamaFarki = yuvarlamaFarki;
			sonucBedel += yuvarlamaFarki;
			
			this.sonuc = bedel(sonucBedel);
		}

		reset(e) {
			super.reset(e);
			
			this.topKdv = this.topDipIskonto = null;
			this.oran2MatrahVeKdv = {};
		}
	}
})()
