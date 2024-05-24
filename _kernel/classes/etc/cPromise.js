
(function() {
	window.CPromise = class extends CObject {
		constructor(e) {
			super (e);
			e = e || {};
			
			this.proc = e.proc;
			this.args = e.args;
		}
		
		then(resolve, fail) {
			if (this.error)
				fail(this.error);
			else
				this.failHandler = fail;

			if (this.result)
				resolve(this.result);
			else
				this.resolveHandler = resolve;
		}

		abort() {
			delete this.result;
			if (this.timer) {
				clearTimeout(this.timer);
				delete this.timer;
			}
			this.setError({ isError: true, rc: 'userAbort' });
		}

		setResult(value) {
			if (this.resolveHandler)
				this.resolveHandler(value)
			else
				this.result = value;
		}

		setError(value) {
			if (this.failHandler)
				this.failHandler(value)
			else
				this.error = value;
		}

		run(e) {
			e = e || {};
			const {proc} = this;
			//if (!proc)
			//	return;
			
			const args = $.merge([], this.args || []);
			if ($.isArray(e.args))
				args.push(...e.args);
			
			const _e = $.extend({}, e, { promise: this, proc: proc, args: args });
			clearTimeout(this.timer);
			this.timer = setTimeout(async () => {
				try {
					const result = await (proc.run ? proc.run(_e) : proc.call(this, _e));
					if (this.result === undefined)
						this.setResult(result);
				}
				catch (ex) {
					this.setError(ex);
				}
				finally {
					this.timer = null;
				}
			});

			return this;
		}
	}
})();
