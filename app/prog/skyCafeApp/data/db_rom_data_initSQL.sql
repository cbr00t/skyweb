
-- Sky Cafe tablolari

CREATE TABLE IF NOT EXISTS mst_Kasiyer (
	kod					TEXT NOT NULL PRIMARY KEY,
	aciklama			TEXT NOT NULL DEFAULT '',
	yetki				TEXT NOT NULL DEFAULT 'garson',
	passMD5				TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS mst_TahsilatSekli (
	kodNo				INTEGER NOT NULL PRIMARY KEY,
	aciklama			TEXT NOT NULL DEFAULT '',
		-- NK:Nakit, PS:Pos, YM:yemekcek, Bos:acik hesap
	tahsilTipi			TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_TahsilatSekli2TahsilTipi ON mst_TahsilatSekli (tahsilTipi);

CREATE TABLE IF NOT EXISTS mst_ResUstKategori (
	vioID				INTEGER NOT NULL PRIMARY KEY,
	aciklama			TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS mst_ResKategori (
	vioID				INTEGER NOT NULL PRIMARY KEY,
	tipKod				TEXT NOT NULL DEFAULT '',
	uygunlukPratikSatis	INTEGER NOT NULL DEFAULT 0,
	uygunlukAdisyon		INTEGER NOT NULL DEFAULT 0,
	uygunlukPaket		INTEGER NOT NULL DEFAULT 0,
	uygunlukSelfServis	INTEGER NOT NULL DEFAULT 0,
	ustKategoriID		INTEGER,
	aciklama			TEXT NOT NULL DEFAULT '',
	FOREIGN KEY (ustKategoriID) REFERENCES mst_ResUstKategori (vioID)
		ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mst_ResKategoriDetay (
	fissayac			INTEGER NOT NULL,
	seq					INTEGER NOT NULL,
	grupmu				INTEGER NOT NULL DEFAULT 0,
	refID				TEXT NOT NULL DEFAULT '',
	PRIMARY KEY (fissayac, seq),
	FOREIGN KEY (fissayac) REFERENCES mst_ResKategori (vioID)
		ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mst_StokGrup (
	kod					TEXT NOT NULL PRIMARY KEY,
	aciklama			TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS mst_Stok (
	kod					TEXT NOT NULL PRIMARY KEY,
	aciklama			TEXT NOT NULL DEFAULT '',
	brm					TEXT NOT NULL DEFAULT '',
	kdvOrani			INTEGER NOT NULL DEFAULT 0,
	tartilabilirmi		INTEGER NOT NULL DEFAULT 0,
	ilkTartiKod			TEXT NOT NULL DEFAULT '',
	degiskenFiyatmi		INTEGER NOT NULL DEFAULT 0,
	ozelFiyat			REAL NOT NULL DEFAULT 0,
	adisyonFiyat		REAL NOT NULL DEFAULT 0,
	selfServisFiyat		REAL NOT NULL DEFAULT 0,
	paketFiyat			REAL NOT NULL DEFAULT 0,
	praFiyat			REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS mst_StokOzellik (
	vioID				INTEGER NOT NULL PRIMARY KEY,
	stokKod				TEXT NOT NULL,
	ozellik				TEXT NOT NULL DEFAULT '',
	ekFiyat				REAL NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_StokOzellik2Asil on mst_StokOzellik (stokKod, ozellik);

CREATE TABLE IF NOT EXISTS mst_BarkodReferans (
	refKod				TEXT NOT NULL PRIMARY KEY,
	stokKod				TEXT NOT NULL,
	varsayilanmi		INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_BarkodReferans2StokRefKod ON mst_BarkodReferans (stokKod, refKod);

CREATE TABLE IF NOT EXISTS mst_TartiReferans (
	refKod				TEXT NOT NULL PRIMARY KEY,
	stokKod				TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_TartiReferans2StokRefKod ON mst_TartiReferans (stokKod, refKod);

CREATE TABLE IF NOT EXISTS mst_BarTarti (
	kod							TEXT NOT NULL PRIMARY KEY,
	aciklama					TEXT NOT NULL DEFAULT '',
	stokBas						INTEGER NOT NULL DEFAULT '',
	stokHane					INTEGER NOT NULL DEFAULT 0,
	miktarBas					INTEGER NOT NULL DEFAULT 0,
	miktarHane					INTEGER NOT NULL DEFAULT 0,
	miktarBolen					REAL NOT NULL DEFAULT 0,
	fiyatBas					INTEGER NOT NULL DEFAULT 0,
	fiyatHane					INTEGER NOT NULL DEFAULT 0,
	fiyatBolen					REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS mst_BarAyrisim (
	kod							TEXT NOT NULL PRIMARY KEY,
	aciklama					TEXT NOT NULL DEFAULT '',
	formatTipi					TEXT NOT NULL DEFAULT '',
	bosFormat					TEXT NOT NULL DEFAULT '',
	ayiracSayi					INTEGER NOT NULL DEFAULT 0,
	ayiracStr					TEXT NOT NULL DEFAULT '',
	barkodBas					INTEGER NOT NULL DEFAULT 0,
	barkodHane					INTEGER NOT NULL DEFAULT 0,
	stokBas						INTEGER NOT NULL DEFAULT 0,
	stokHane					INTEGER NOT NULL DEFAULT 0,
	stokBaslangicdanmi			INTEGER NOT NULL DEFAULT 0,
	miktarBas					INTEGER NOT NULL DEFAULT 0,
	miktarHane					INTEGER NOT NULL DEFAULT 0,
	ekOz1Bas					INTEGER NOT NULL DEFAULT 0,
	ekOz1Hane					INTEGER NOT NULL DEFAULT 0,
	ekOz2Bas					INTEGER NOT NULL DEFAULT 0,
	ekOz2Hane					INTEGER NOT NULL DEFAULT 0,
	ekOz3Bas					INTEGER NOT NULL DEFAULT 0,
	ekOz3Hane					INTEGER NOT NULL DEFAULT 0,
	ekOz4Bas					INTEGER NOT NULL DEFAULT 0,
	ekOz4Hane					INTEGER NOT NULL DEFAULT 0,
	ekOz5Bas					INTEGER NOT NULL DEFAULT 0,
	ekOz5Hane					INTEGER NOT NULL DEFAULT 0,
	ekOz6Bas					INTEGER NOT NULL DEFAULT 0,
	ekOz6Hane					INTEGER NOT NULL DEFAULT 0,
	ekOz7Bas					INTEGER NOT NULL DEFAULT 0,
	ekOz7Hane					INTEGER NOT NULL DEFAULT 0,
	ekOz8Bas					INTEGER NOT NULL DEFAULT 0,
	ekOz8Hane					INTEGER NOT NULL DEFAULT 0,
	ekOz9Bas					INTEGER NOT NULL DEFAULT 0,
	ekOz9Hane					INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_mstBarAyrisim2FormatTipi ON mst_BarAyrisim (formatTipi);

CREATE TABLE IF NOT EXISTS mst_BarOzelKural (
	kod							TEXT NOT NULL PRIMARY KEY,
	aciklama					TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS mst_ResMasaTip (
	kod							TEXT NOT NULL PRIMARY KEY,
	aciklama					TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS mst_ResMasa (
	kod					TEXT NOT NULL PRIMARY KEY,
	aciklama			TEXT NOT NULL DEFAULT '',
	vioID				INTEGER,
		-- bos:Adisyon , P:Paket , S:Self , R:Pra
	-- gonderildi			TEXT NOT NULL DEFAULT '',
	anaTip				TEXT NOT NULL DEFAULT '',
	sira				INTEGER NOT NULL DEFAULT 0,
	tipKod				TEXT NOT NULL DEFAULT '',
	aktifFisID			TEXT,
	servisDisimi		INTEGER NOT NULL DEFAULT 0,
	rezervemi			INTEGER NOT NULL DEFAULT 0,
	rezerveTahminiGelis	TEXT NOT NULL DEFAULT '',
	rezerveSayi			INTEGER NOT NULL default 0,
	rezerveAciklama		TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_ResMasa2AnaTip ON mst_ResMasa (anaTip, tipKod);
CREATE INDEX IF NOT EXISTS idx_ResMasa2TipKod ON mst_ResMasa (tipKod, anaTip);
CREATE INDEX IF NOT EXISTS idx_ResMasa2Aciklama ON mst_ResMasa (aciklama);
CREATE INDEX IF NOT EXISTS idx_ResMasa2Rezervemi ON mst_ResMasa (rezervemi);
CREATE INDEX IF NOT EXISTS idx_ResMasa2ServisDisimi ON mst_ResMasa (servisDisimi);


CREATE TABLE IF NOT EXISTS data_RestoranFis (
	id							TEXT NOT NULL PRIMARY KEY,
	vioID						TEXT,
	aktifMasaID					TEXT,
	kayitzamani					TEXT NOT NULL DEFAULT ( datetime('now', 'localtime') ),
	erisimzamani				TEXT NOT NULL DEFAULT '',
	sonislemzamani				TEXT NOT NULL DEFAULT '',
	gonderimKuyruktami			TEXT NOT NULL DEFAULT '',
	gonderildi					TEXT NOT NULL DEFAULT '',
	yazdirildi					TEXT NOT NULL DEFAULT '',
	gecici						TEXT NOT NULL DEFAULT '',
	silindi						TEXT NOT NULL DEFAULT '',
	kapanmazamani				TEXT NOT NULL DEFAULT '',
	tipKod						TEXT NOT NULL,
	tarih						TEXT NOT NULL DEFAULT '',
	fisSonuc					REAL NOT NULL DEFAULT 0,
	tahsilatNakit				REAL NOT NULL DEFAULT 0,
	tahsilatPOS					REAL NOT NULL DEFAULT 0,
	tahsilatYemekCeki			REAL NOT NULL DEFAULT 0,
	tahsilatParaUstu			REAL NOT NULL DEFAULT 0,
	aciklama					TEXT NOT NULL DEFAULT '',
	iptalAciklama				TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_RestoranFis2TipKod ON data_RestoranFis (tipKod);

CREATE TABLE IF NOT EXISTS data_RestoranDetay (
	id							TEXT NOT NULL PRIMARY KEY,
	fisID						TEXT NOT NULL,
	seq							INTEGER NOT NULL,
	vioID						TEXT,
	erisimzamani				TEXT NOT NULL DEFAULT '',
	kayitzamani					TEXT NOT NULL DEFAULT ( datetime('now', 'localtime') ),
	yazdirildi					TEXT NOT NULL DEFAULT '',
	gonderimKuyruktami			TEXT NOT NULL DEFAULT '',
	gonderildi					TEXT NOT NULL DEFAULT '',
	silindi						TEXT NOT NULL DEFAULT '',
	ikrammi						TEXT NOT NULL DEFAULT '',
	stokKod						TEXT NOT NULL,
	barkod						TEXT NOT NULL DEFAULT '',
	miktar						REAL NOT NULL DEFAULT 0,
	brm							TEXT NOT NULL DEFAULT '',
	fiyat						REAL NOT NULL DEFAULT 0,
	brutBedel					REAL NOT NULL DEFAULT 0,
	kdvOrani					INTEGER NOT NULL DEFAULT 0,
	iskOrani					REAL NOT NULL DEFAULT 0,
	netBedel					REAL NOT NULL DEFAULT 0,
	ozellikIDListe				TEXT NOT NULL DEFAULT '',
	ekNot						TEXT NOT NULL DEFAULT '',
	iptalAciklama				TEXT NOT NULL DEFAULT '',
	FOREIGN KEY (fisID) REFERENCES data_RestoranFis (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS data_Log (
	kayitzamani					TEXT NOT NULL DEFAULT '',
	gonderimKuyruktami			TEXT NOT NULL DEFAULT '',
	gonderildi					TEXT NOT NULL DEFAULT '',
	refTable					TEXT NOT NULL DEFAULT '',
	refID						TEXT NOT NULL DEFAULT '',
	refID2						TEXT NOT NULL DEFAULT '',
	islem						TEXT NOT NULL DEFAULT '',
	altIslem					TEXT NOT NULL DEFAULT '',
	data						TEXT NOT NULL DEFAULT '',
	wsResult					TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS data_KasiyerIslem (
	kasiyerKod					TEXT NOT NULL,
	seq							INTEGER NOT NULL,
	vioID						INTEGER,
	kayitzamani					TEXT NOT NULL DEFAULT ( datetime('now', 'localtime') ),
	gonderimKuyruktami			TEXT NOT NULL DEFAULT '',
	gonderildi					TEXT NOT NULL DEFAULT '',
	silindi						TEXT NOT NULL DEFAULT '',
	aciklama					TEXT NOT NULL DEFAULT '',
	tip							TEXT NOT NULL DEFAULT '',
	--acilis					REAL NOT NULL DEFAULT 0,
	--teslim					REAL NOT NULL DEFAULT 0,
	giren						REAL NOT NULL DEFAULT 0,
	cikan						REAL NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_KasiyerIslem2Asil on data_KasiyerIslem (kasiyerKod, seq);

CREATE TABLE IF NOT EXISTS data_ZHesaplasma (
	zNo							INTEGER NOT NULL,
	zSayac						INTEGER,
	seq							INTEGER NOT NULL,
	kayitzamani					TEXT NOT NULL DEFAULT ( datetime('now', 'localtime') ),
	gonderimKuyruktami			TEXT NOT NULL DEFAULT '',
	gonderildi					TEXT NOT NULL DEFAULT '',
	silindi						TEXT NOT NULL DEFAULT '',
	belirtec					TEXT NOT NULL,
	aciklama					TEXT NOT NULL DEFAULT '',
	bedel						REAL,
	olasiBedel					REAL,
	PRIMARY KEY (zNo, seq)
);
CREATE INDEX IF NOT EXISTS idx_ZHesaplasma2ZNo on data_ZHesaplasma (zNo);
