(function() {
	window.CETPartOrtakIslemTuslariPart = class extends window.OrtakIslemTuslariPart {
		constructor(e) {
			super(e);
		}

		static get defaultTemplateName() { return 'cetOrtakIslemTuslari' }
		static get partName() { return 'cetPartOrtakIslemTuslari' }
		get partRoot() { return `../app/prog/cetApp/part/` }
		get defaultLayoutName() { return null }
	}
})()
