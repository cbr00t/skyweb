
(function() {
	window.Config = class extends window.CObject {
		constructor(e) {
			super(e);
		}

		async load(e) {
			e = e || {};

			try { e.config = await $.get('../data/config.json') }
			catch (ex) { }

			await this.setDefaults(e);
			await this.parseQS(e);
			await this.setDefaults(e);
			await this.updateVWGlobals(e);
			await this.updateAjaxWSDefs(e);

			$.extend(this, e);
			$.extend(this, e.config);
			delete this.config;

			console.info('config loaded', e);

			return e.config;
		}

		setDefaults(e) {
			let config = e.config = e.config || {};
			$.extend(config, {
				ssl: config.ssl ?? null,
				protocol: config.protocol || null,
				hostName: config.hostName || 'localhost',
				port: config.port || wsDefaultPort,
				rawWSHostName: null,
				wsPath: config.wsPath || wsPath,
				wsURLBase: null,
				theme: config.theme ||'metro',
				defaultLoginArgs: config.defaultLoginArgs || {
					user: 'WEB',
					pass: md5('www321')
				}
			});
		}

		parseQS(e) {
			let config = e.config;
			$.extend(config, {
				test: qs.test === undefined ? config.test : asBool(qs.test),
				debug: qs.debug === undefined ? config.debug : asBool(qs.debug),
				noHeader: qs.noHeader === undefined ? config.noHeader : asBool(qs.noHeader),
				noErrorHandler: qs.noErrorHandler === undefined ? config.noErrorHandler : asBool(qs.noErrorHandler),
				appClass: qs.app ? window[qs.app] : null,
				disableTimersFlag: qs.disableTimers == undefined ? config.disableTimersFlag : asBool(qs.disableTimers),
				isDevMode: qs.devMode == undefined && qs.dev == undefined ? config.isDevMode : asBool(qs.devMode || qs.dev || qs.programci),
				autoDevConsole: qs.devConsole == undefined ? config.autoDevConsole : asBool(qs.devConsole),
				noFullScreenFlag: qs.noFullScreen == undefined && qs.tamEkranYok == undefined ? config.noFullScreenFlag : asBool(qs.noFullScreen || qs.tamEkranYok),
				logoutClosesWindow: qs.logoutClosesWindow == undefined ? config.logoutClosesWindow : asBool(qs.logoutClosesWindow),
				theme: qs.theme || config.theme,
				kiosk: asBool(qs.kiosk)
			});
			let ssl = asBool(qs.ssl || config.ssl);
			let protocol = config.protocol = qs.protocol || config.protocol;
			if (!protocol && ssl)
				protocol = config.protocol = 'https:';
			ssl = config.ssl = (config.protocol == 'https:');
			// wsDefaultPort = ssl ? 9200 : 8200;

			this.sessionInfo = new SessionInfo(qs);
		}

		updateVWGlobals(e) {
			let config = e.config;
			updateConfigFromQS();				// vioweb api
			updateWSUrlBaseBasit(config);		// vioweb api
			
			const trimmed = value =>
				value && typeof value == 'string' ? value.trim() : value;
			
			$.extend(config, {
				protocol: config.protocol,
				hostName: trimmed(window.wsHostName || config.hostName),
				port: trimmed(qs._port || window.wsPort || config.port),
				rawWSHostName: trimmed(window.rawWSHostName || config.rawWSHostName),
				wsPath: trimmed(window.wsPath || config.wsPath)
			});

			const {ssl} = this;
			wsDefaultPort = ssl ? 9200 : 8200;
			if (ssl) {
				if (config.port == 8200)
					config.port = 9200;
			}
			updateWSUrlBaseBasit(config);
			if (ssl) {
				if (wsPort == 8200)
					wsPort = 9200;
			}
			
			$.extend(window, {
				wsURLBase: config.wsURLBase,
				theme: config.theme
			});

			const {sessionInfo} = this;
			if (sessionInfo) {
				[ajaxWSDefOpts, ajaxWSDefOptsWithIO].forEach(obj => {
					if (sessionInfo.hasUser) {
						obj.sessionMatch = sessionInfo.loginTipi;
						['user', 'pass', 'passMD5'].forEach(key => {
							const value = sessionInfo[key];
							if (value)
								obj[key] = value;
						});
					}
					else if (sessionInfo.sessionID) {
						obj.sessionID = sessionInfo.sessionID;
					}
				})
			}

			config.defaultLoginArgs = new LoginArgs(config.defaultLoginArgs);
		}

		updateAjaxWSDefs(e) {
			const {sessionInfo} = this;
			if (apiAuthKey)
				ajaxWSDefOptsBasic.apiAuthKey = apiAuthKey;
			else
				delete ajaxWSDefOptsBasic.apiAuthKey;
			
			ajaxWSDefOpts = $.extend({}, ajaxWSDefOptsBasic);
			if (!$.isEmptyObject(sessionInfo)) {
				SessionInfo.SabitAttrListeWithSessionID.forEach(key => {
					const value = sessionInfo[key];
					if (value)
						ajaxWSDefOpts[key] = value;
				});
			}

			if (ajaxWSDefOpts) {
				if (sessionInfo.isSSO) {
					for (const key of ['loginTipi', 'sessionMatch', 'user', 'pass', 'passMD5', 'sessionID'])
						delete ajaxWSDefOpts[key];
					if (sessionInfo.sessionID)
						ajaxWSDefOpts.sessionID = sessionInfo.sessionID;
				}
				else {
					if ((ajaxWSDefOpts.loginTipi || ajaxWSDefOpts.sessionMatch) && ajaxWSDefOpts.user)
						delete ajaxWSDefOpts.sessionID;
					if (ajaxWSDefOpts.loginTipi && !ajaxWSDefOpts.sessionMatch)
						ajaxWSDefOpts.sessionMatch = ajaxWSDefOpts.loginTipi;
					delete ajaxWSDefOpts.loginTipi;
					if (!sessionInfo.hasSessionOrUser)
						delete ajaxWSDefOpts.sessionMatch;
				}
			}
			
			ajaxWSDefOptsWithIO = $.extend({}, ajaxWSDefOpts, ajaxWSDefIO);
		}

		preventUnload() {
			if (this.isUnloadHandlerRegistered)
				return;
			
			['onbeforeunload', 'onunload'].forEach(key =>
				window[key] = () => false);
			this.isUnloadHandlerRegistered = true;
		}

		allowUnload() {
			if (!this.isUnloadHandlerRegistered)
				return;
			
			['onbeforeunload', 'onunload'].forEach(key =>
				delete window[key]);
			this.isUnloadHandlerRegistered = false;
		}
	};
})();
