
(function() {
	window.LoginArgs = class extends window.CObject {
		static get SabitAttrListe() {
			return ['sessionMatch', 'user', 'pass']
		}
		
		constructor(e) {
			e = e || {};

			super(e);

			e.sessionMatch = e.loginTipi || e.sessionMatch || 'login';
			this.class.SabitAttrListe.forEach(key =>
				this[key] = e[key] || '');
			this.sessionMatch = this.sessionMatch || this.loginTipi;
		}

		get hasUser() {
			return !!this.user
		}
	}
})();
