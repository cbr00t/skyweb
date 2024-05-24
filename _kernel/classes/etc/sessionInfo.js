
(function() {
	window.SessionInfo = class extends window.CObject {
		static get SabitAttrListe() {
			return ['loginTipi', 'user', 'pass']
		}
		static get SabitAttrListeWithSessionID() {
			const result = this.SabitAttrListe;
			result.push('sessionID');
			return result;
		}
		static get EkAttrListe() {
			return ['userDesc', 'sessionID', 'isAdmin', 'yetki', 'dbName', 'subeKod']
		}
		
		constructor(e) {
			e = e || {};
			super(e);

			e.loginTipi = e.loginTipi || e.sessionMatch || 'login';
			this.class.SabitAttrListe.forEach(key =>
				this[key] = e[key] || '');
			this.class.EkAttrListe.forEach(key => {
				if (e[key] != null)
					this[key] = e[key];
			});
			this.ozelTip = { kod: '', aciklama: '' };

			for (const key of ['hasSSO', 'isSSO'])
				this[key] = e[key];
		}

		get hasUser() {
			return !!this.user
		}

		get hasSession() {
			return !!this.sessionID
		}

		get hasSessionOrUser() {
			return this.hasSession || this.hasUser
		}

		get passMD5() {
			let pass = this.pass;
			return !pass || pass.length == 32 ? pass : md5(pass)
		}

		get userBilgiAsKodAdi() {
			const {user} = this;
			if (!user)
				return null;
			
			return new CKodVeAdi({ kod: user, aciklama: this.userDesc });
		}

		userBilgiParantezliOzet(e) {
			const ka = this.userBilgiAsKodAdi;
			return ka ? ka.parantezliOzet(e) : null;
		}

		userBilgiCizgiliOzet(e) {
			const ka = this.userBilgiAsKodAdi;
			return ka ? ka.parantezliOzet(e) : null;
		}
	}
})();
