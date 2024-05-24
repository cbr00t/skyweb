(function() {
	window.SkyConfigParam = class extends window.MQTekil {
		static get DefaultWSPort() { return 8200 }
		
		constructor(e) {
			e = e || {};
			super(e);

			this.class.sabitAttrListe.forEach(key =>
				this[key] = e[key] === undefined ? this[key] : e[key]);
			$.extend(this, {
				version: this.version || this.class.version,
				wsPort: this.wsPort || this.class.DefaultWSPort,
				userSettings: this.userSettings || {}
			});
		}
		

		static get table() { return 'SkyConfigParam' }

		static get sabitAttrListe() {
			return [
				'version', 'wsHostName', 'wsPort', 'userSettings'
			]
		}

		static get version() { return 1 }

		get wsHostNameUyarlanmis() {
			const value = this.wsHostName;
			return value ? value.trim() : value;
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
			
			const ports = ['', 81, 8200];
			ports.push(...wsPortsUyarlanmis);
			const liste = [];
			liste.push(`https://cdnjs.cloudflare.com`);
			for (let i in ports) {
				const prefixVePort = ports[i] ? `:${ports[i]}` : ``;
				liste.push(`http://${wsHostNameUyarlanmis}${prefixVePort}`);
			}

			return liste.join(`,`);
		}

		hostVars() {
			let hv = super.hostVars() || {};
			this.class.sabitAttrListe.forEach(key =>
				hv[key] = this[key] || '');
			
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
			this.wsPort = this.wsPort || this.class.DefaultWSPort;

			[ 'version' ].forEach(key => {
				let value = this[key];
				if (typeof value != 'number')
					this[key] = asInteger(value) || 0;
			});
			/*[	].forEach(key => {
				let value = this[key];
				if ( typeof value != 'number')
					this[key] = asFloat(value) || 0;
			});
			[	].forEach(key => {
				let value = this[key];
				// if (value != null)
				this[key] = asBool(value);
			});*/
		}

		reduce() {
			const inst = super.reduce();
			[ 'userSettings', 'varsayilanWSHostName' ].forEach(key =>
				delete inst[key]);

			return inst;
		}

		asBasicParam() {
			const inst = {};
			[ 'version', 'varsayilanWSHostName', 'wsHostName', 'wsPort' ].forEach(key =>
				inst[key] = this[key]);
			
			return inst;
		}
	}
})()
