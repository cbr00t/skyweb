(function() {
	window.MQStm = class extends window.MQDbCommand {
		constructor(e) {
			e = e || {}; super(e);
			if (e instanceof MQSent) e = { sent: e }
			$.extend(this, {
				sent: ($.isPlainObject(e.sent)
								? new MQSent(e.sent) : e.sent)
							|| new MQSent(),
				orderBy: (($.isArray(e.orderBy) || $.isPlainObject(e.orderBy) || typeof e.orderBy == 'string'
								? new MQOrderByClause(e.orderBy) : e.orderBy))
							|| new MQOrderByClause(),
				limit: e.limit,
				offset: e.offset
			});
		}

		fromGridWSArgs(e) {
			e = e || {};
			this.sentDo(sent =>
				sent.fromGridWSArgs(e));
			this.orderBy.fromGridWSArgs(e);

			let pageNum = e.pagenum || e.pageNum || e.pageIndex || 0;
			let pageSize = e.pagesize || e.pageSize;
			if (pageNum != null && pageSize && !asBool(e.rowCountOnly)) {
				this.limit = pageSize;
				this.offset = pageNum * pageSize;
			}
		}

		getSentListe(e) {
			return this.sent.getSentListe(e)
		}
	
		sentDo(e) {
			return this.sent.sentDo(e)
		}

		unionAllYap() {
			return (this.sent = new MQUnionAll([this.sent]));
		}

		buildString(e) {
			super.buildString(e);

			let value = this.sent.toString();
			if (!value)
				return;
			
			e.result += value;

			value = this.orderBy.toString();
			if (value)
				e.result += `${CrLf}${value}`;
			
			value = this.limit;
			if (value)
				e.result += ` LIMIT ${value}`;
			value = this.offset;
			if (value)
				e.result += ` OFFSET ${value}`;
		}
	};
})()
