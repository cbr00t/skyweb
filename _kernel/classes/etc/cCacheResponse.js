
(function() {
	window.CCacheResponse = class extends window.CObject {
		constructor(e) {
			e = e || {};
			super(e);

			const {response, resolvedResponse} = e;
			this.response = response;
			this.resolvedResponse = resolvedResponse;

			if (response != null && resolvedResponse == null)
				setTimeout(() => this.getResolvedResponse(), 10);
		}

		async reduce() {
			let {response, resolvedResponse} = this;
			if (response && !resolvedResponse)
				await this.getResolvedResponse();
			if (resolvedResponse) {
				const responseText = resolvedResponse && resolvedResponse.responseText != null
							? resolvedResponse.responseText
							: resolvedResponse;
				return { resolvedResponse: responseText };
			}
			return null;
		}
		async expand() {
			let inst = new this.class();
			let {responseText, response, resolvedResponse} = this;
			if (!resolvedResponse && responseText != null)
				resolvedResponse = inst.resolvedResponse = responseText;
			if (resolvedResponse) {
				if (resolvedResponse.responseText != null)
					resolvedResponse = resolvedResponse.responseText;
				inst.resolvedResponse = resolvedResponse;
			}
			if (response || resolvedResponse)
				inst.response = response == null ? new Promise(async resolve => resolve(await this.resolvedResponse)) : response;
			delete inst.responseText;

			return inst
		}

		// async promise() { return this.response }
		then() {
			const {response} = this;
			if (response && response.then)
				response.then(...arguments)
			return this
		}
		catch() {
			const {response} = this;
			if (response && response.catch)
				response.catch(...arguments);
			return this
		}
		finally() {
			const {response} = this;
			if (response && (response.finally || response.always))
				(response.finally || response.always)(...arguments);
			return this
		}
		
		done() { this.then.apply(this, arguments); return this }
		fail() { return this.catch.apply(this, arguments) }
		always() { this.response.finally.apply(this, arguments); return this }

		async text() {
			const response = await this.getResolvedResponse();
			if (response && response.responseText)
				return response.responseText
			return response;
		}
		async json() {
			return JSON.parse(await this.text())
		}
		async getResolvedResponse() {
			let result = this.resolvedResponse;
			if (result == null)
				result = this.resolvedResponse = await this.response;
			return result
		}
	}
})();
