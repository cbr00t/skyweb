
const queries = [
    `ALTER TABLE data_PIFFis ADD vioID INT`,
    `ALTER TABLE data_PIFFis ADD degismedi TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE data_TahsilatFis ADD degismedi TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE data_UgramaFis ADD degismedi TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE data_PIFFis ADD soforAdi TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE data_PIFFis ADD plaka TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE data_PIFFis ADD ekBilgi TEXT NOT NULL DEFAULT ''`
];

const results = [];
for (const i in queries) {
    const seq = asInteger(i) + 1;
    const query = queries[i];
    try {
        await sky.app.dbMgr_mf.executeSql(query);
        results.push(`${seq} - ok`)
    }
    catch (ex) {
        results.push(`<span class="darkred">${seq} - ${ex.message || ex.errorText || 'error'}</span>`)
    }
}
return results.join('<br/>')

