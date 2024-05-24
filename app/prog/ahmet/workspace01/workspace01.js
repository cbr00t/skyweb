(function() {
	window.AhmetWorkspace01 = class extends window.AhmetWorkspace01_Base {
		get appText() { return 'Ahmet Can - Proje 01' }
		
		async run(e) {
			e = e || {};
			await super.run(e);

			const {layout} = this;
			layout.find('.blaBla').html('bla bla bla');
			alert('içerik görünmeden önce');

			await this.extensions.login.loginIslemi(e);
		}

		async afterRun(e) {
			e = e || {};
			await super.afterRun(e);

			alert('içerik göründükten sonra önce');

			await showProgress('AJAX Verisi çekilecek...');
			setTimeout(async () => {
				await showProgress('AJAX Verisi çekiliyor...');
				try {
					const response = await this.ajaxBilgiCek_blaBla({
						args: { a: 1, b: 'abc' }
					});
					this.blaBla_sonucGeldi({ isError: false, result: (response || {}).result });
				}
				catch (ex) {
					this.blaBla_sonucGeldi({ isError: true, result: `${ex.status} ${ex.statusText}` });
				}
				finally {
					await hideProgress();
				}
			}, 1000);
		}

		blaBla_sonucGeldi(e) {
			const {layout} = this;
			const {isError, result} = e;

			const divBlaBla = layout.find('.blaBla');
			divBlaBla.css(
				'background-image',
				`url('images/${isError ? 'reddot' : 'greendot'}.png')`
			);
			
			const html = `<b class="${isError ? 'error' : ''}">${toJSONStr(result)}</b>`;
			divBlaBla.html(
				`<div>BLA BLA'nın PHP sonucu:</div>` +
				html
			);
		}

		async ajaxBilgiCek_blaBla(e) {
			e = e || {}
			let result;
			try {
				lastAjaxObj = $.ajax({
					cache: false, type: 'GET', /*type: 'POST'*/
					url: this.appRoot + 'blaBla.php',
					// url: `${this.wsURLBase}tanimlar`,
					data: e.args || {}
				});
				result = (await lastAjaxObj) || {}
			}
			catch (ex) {
				((window.savedProcs || {}).hideProgress || hideProgress)();
				hideProgress();
				defFailBlock(ex);
				throw ex;
			}

			return result;
		}

		async onResize(e) {
			await super.onResize(e);

			const {layout} = this;
			//layout.find(`#blaBla`).height(...);
		}
	}
})()
