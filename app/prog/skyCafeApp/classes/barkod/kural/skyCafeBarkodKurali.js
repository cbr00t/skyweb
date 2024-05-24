(function() {
	window.SkyCafeBarkodKurali = class extends window.CObject {
		constructor(e) {
			e = e || {};
			super(e);

			$.extend(this, e);
		}

		get parserAdi() { return (this.parserSinif || {}).aciklama }


		async parseSonucu(e) {
			const {parserSinif} = this;
			if (parserSinif) {
				let parser = new parserSinif($.extend({ kural: this }, e));
				if (await parser.parse(e))
					return parser;
			}

			return null;
		}
	}
})();
