
(function() {
	window.CCache = class extends window.CObject {
		constructor(e) {
			e = e || {};
			super(e);
			this.url2Response = e.url2Response || {};
		}

		static get dbMgr_key() { return `skyGlobalCache` }

		async yukle(e) {
			const {dbMgr_key} = this.class;
			let data = sessionStorage.getItem(dbMgr_key);
			if (data) {
				try {
					data = this.class.Deserialize(data)
				}
				catch (ex) {
					data = null;
					console.error(ex);
				}
			}
			if (!data)
				return false;
			
			$.extend(this, data);
			// await this.expand();

			return true;
		}
		async kaydet(e) {
			let data = toJSONStr(await this.reduce());
			if (!data)
				return null;
			
			const {dbMgr_key} = this.class;
			sessionStorage.setItem(dbMgr_key, data);

			return data;
		}

		/*async reduce() {
			let inst = new this.class();
			const {url2Response} = this;
			if (url2Response) {
				inst.url2Response = {};
				for (let url in url2Response) {
					const response = url2Response[url];
					try {
						const reducedResponse = await (response.reduce ? response.reduce() : response);
						inst.url2Response[url] = reducedResponse;
					}
					catch (ex) { console.error(ex) }
				}
			}
			return inst
		}
		expand() {
			const {url2Response} = this;
			if (url2Response) {
				this.url2Response = {};
				for (let url in url2Response) {
					let response = url2Response[url];
					this.url2Response[url] = new Promise(resolve => resolve(response));
					//if (!response.expand)
					//	response = CCacheResponse.From(response);
					//this.url2Response[url] = await response.expand();
				}
			}
			return this
		}*/
		
		match(request) {
			const path = typeof request == 'string' ? request : (request || {}).url;
			const response = this.url2Response[path];
			if (response === undefined)
				throw { isError: true, rc: 'noMatch', errorText: `No cache record matches` };
			return response
		}

		add(request) {
			try {
				return this.match(request)
			}
			catch (ex) {
				const path = typeof request == 'string' ? request : (request || {}).url;
				lastAjaxObj = $.get({ cache: true, async: true, url: path });
				const response = new CCacheResponse({ response: lastAjaxObj });
				this.url2Response[path] = response;
				return response
			}
		} 

		addAll(requests) {
			let responses = [];
			for (let i in requests)
				responses.push(this.add(requests[i]));
		}

		put(request, response) {
			const path = typeof request == 'string' ? request : (request || {}).url;
			this.url2Response[path] = response;
			return response
		}

		delete(request) {
			const path = typeof request == 'string' ? request : (request || {}).url;
			const response = this.url2Response[path];
			delete this.url2Response[path];
			return response
		}

		keys() {
			return Object.keys(this.url2Response)
		}
	}
})();
