(function() {
	window.CETBarkodKurali = class extends window.CObject {
		get parserAdi() { return (this.parserSinif || {}).aciklama }
		
		constructor(e) { e = e || {}; super(e); $.extend(this, e); }
		async parseSonucu(e) {
			const {parserSinif} = this;
			if (parserSinif) {
				let parser = new parserSinif($.extend({ kural: this }, e));
				if (await parser.parse(e)) return parser
			}
			return null
		}
	}
})();
