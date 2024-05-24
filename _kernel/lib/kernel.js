
(function() {
	window.Kernel = class extends window.CObject {
		constructor(e) {
			super(e);
			
			fixJSBugs();
			this.config = new Config(e);
		}

		async startup(e) {
			try {
				if (asBool(qs.noErrorHandler)) {
					this.startupDevam(e)
				}
				else {
					try {
						this.startupDevam(e)
					}
					catch (ex) {
						ex = ex.responseJSON || ex;
							if (!(ex.rc && (ex.rc == 'runtimeInterrupt' || ex.rc == 'userAbort'))) {
								defFailBlock(ex);
								throw ex
							}
						}
				}
			}
			finally {
				Utils.registerSW();
			}
		}

		async startupDevam(e) {
			e = e || {};
			/*try {
				let cache = this.globalCache = await caches.open('skyweb');
				if (cache) {
					cache.add('./');
					cache.add('../');
				}
			}
			catch (ex) { console.warn('cache open error') }*/
			
			this.globalCache = new CCache();
			await this.config.load(e);
			return await this.run(e);
		}

		async run(e) {
			let appClass = (this.config.appClass || App);
			if (!appClass)
				throw { isError: true, rc: 'appClassNotFound', errorText: 'App class not found' };
			
			e = e || {};
			e.firstRunFlag = true;
			
			let app = sky.app = e.app || new appClass(e);
			await app.preInit(e);

			e.ilkIslemlerSonrasi = _e => this.runDevam($.extend(e, _e));
			await app.ilkIslemler(e);
			
			if (e.firstRunFlag)
				await this.runDevam(e);
		}

		async runDevam(e) {
			e = e || {};
			e.firstRunFlag = false;
			delete e.ilkIslemlerSonrasi;
			
			let app = sky.app;
			await app.init(e);
			await app.run(e);
			await app.afterRun(e);
			// await app.exiting(e);
		}
	};
})();
