(async e => {
	const {app} = sky;
	app.prefetchAbortedFlag = true;

	const sonIslemler = [];
	// app.merkezdenBilgiYukleIstendi = e => alert('iptal');
	/*app.tabloEksikIslemYapi_ek = [
		{
			kosul: async e => {
				const {dbMgr, tx} = e;
				const query = `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'data_TahsilatFis'`;
				const def = await dbMgr.tekilDegerExecuteSelect({ tx: tx, query: query });
				return def && !def.includes(`xyz2`);
			},
			queries: [
				`ALTER TABLE data_TahsilatFis ADD xyz2 TEXT NOT NULL DEFAULT ''`
			],
			action: e => {
				sonIslemler.push(e =>
					displayMessage(`<b>data_TahsilatFis</b> tablosuna <b>xyz2 TEXT NOT NULL DEFAULT ''</b> kolon tanımı eklentisi yapıldı`, `Tablo Eksik Kontrol Yapı`));
			}
		}
	];*/
	
	app.sonIslemlerSonrasi_ek = e => {
		displayMessage(`<b>sqlTest-01</b> aktif`, `debug scripts - ilk`);
		if (!$.isEmptyObject(sonIslemler)) {
			for (const block of sonIslemler) {
				if (!block)
					continue;
				if ($.isFunction(block))
					block.call(this, e);
				else if (block.run)
					block.run(e);
			}
		}
	}
})()
