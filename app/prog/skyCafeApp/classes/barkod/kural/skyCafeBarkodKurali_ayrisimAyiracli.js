(function() {
	window.SkyCafeBarkodKurali_AyrisimAyiracli = class extends window.SkyCafeBarkodKurali {
		constructor(e) {
			e = e || {};
			super(e);

			this.belirtecleriBelirle(e);
		}

		static get hmrBelirtec2Bilgi() {
			let result = this._hmrBelirtec2Bilgi;
			if (!result) {
				result = this._hmrBelirtec2Bilgi = {
					M: { key: 'modelKod' },
					R: { key: 'renkKod' },
					D: { key: 'desenKod' },
					B: { key: 'bedenKod' },
					E: { key: 'en', isNumber: true },
					O: { key: 'boy', isNumber: true },
					U: { key: 'yukseklik', isNumber: true },
					L: { key: 'lotNo' },
					N: { key: 'seriNo' },
					F: { key: 'rafKod' }
				}
				/*for (let i = 1; i <= 9; i++)
					result[i.toString()] = { key: `ekOz_${i}Kod` };*/
			}
			return result;
		}

		belirtecleriBelirle(e) {
			const bas2Belirtec = {};
			const ekle = (belirtec, bas) => {
				if (bas)
					bas2Belirtec[bas] = belirtec;
			};
			ekle('V', this.barkodBas);
			ekle('S', this.stokBas);
			ekle('K', this.miktarBas);
			/*ekle('M', this.modelBas);
			ekle('R', this.renkBas);
			ekle('D', this.desenBas);
			ekle('B', this.bedenBas);
			ekle('E', this.enBas);
			ekle('O', this.boyBas);
			ekle('U', this.yukseklikBas);
			ekle('L', this.lotBas);
			ekle('N', this.seriNoBas);
			ekle('F', this.rafBas);
			for (let i = 1; i <= 9; i++)
				ekle(i.toString(), this[`ekOz${i}Bas`]);*/

			this.belirtecler = Object.values(bas2Belirtec);
			
			/*const belirtecler = this.belirtecler = [];
			const sortedKeys = Object.keys(bas2Belirtec).map(x => asInteger(x)).sort();
			for (let i in sortedKeys) {
				const bas = sortedKeys[i];
				belirtecler.push(bas2Belirtec[bas]);
			}*/
			
			const {bosFormat} = this;
			const zVarmi = this.zVarmi = bosFormat && bosFormat.includes('Z');
		}
	}
})();
