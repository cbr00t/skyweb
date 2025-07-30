
CREATE TABLE IF NOT EXISTS const_Numarator (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	tip							TEXT NOT NULL,
	ozelIsaret					TEXT NOT NULL DEFAULT '',
	seri						TEXT NOT NULL,
	sonNo						INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY (tip, ozelIsaret, seri)
);

CREATE TABLE IF NOT EXISTS mst_Doviz (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	kod							TEXT NOT NULL PRIMARY KEY,
	aciklama					TEXT NOT NULL DEFAULT '',
	alimKur						REAL NOT NULL DEFAULT 0,
	satisKur					REAL NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_mstSube2Aciklama ON mst_Doviz (aciklama);

CREATE TABLE IF NOT EXISTS mst_Sube (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	kod							TEXT NOT NULL PRIMARY KEY,
	aciklama					TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_mstSube2Aciklama ON mst_Sube (aciklama);

CREATE TABLE IF NOT EXISTS mst_Sube (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	kod							TEXT NOT NULL PRIMARY KEY,
	aciklama					TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_mstSube2Aciklama ON mst_Sube (aciklama);

CREATE TABLE IF NOT EXISTS mst_Plasiyer (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	kod							TEXT NOT NULL PRIMARY KEY,
	aciklama					TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_mstPlasiyer2Aciklama ON mst_Plasiyer (aciklama);

CREATE TABLE IF NOT EXISTS mst_Yer (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	kod							TEXT NOT NULL PRIMARY KEY,
	aciklama					TEXT NOT NULL DEFAULT '',
	subeKod						TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_mstYer2Aciklama ON mst_Yer (aciklama);

CREATE TABLE IF NOT EXISTS mst_YerRaf (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	yerKod						TEXT NOT NULL,
	rafKod						TEXT NOT NULL,
	PRIMARY KEY (yerKod, rafKod)
);
CREATE INDEX IF NOT EXISTS idx_mstYerRaf2Raf ON mst_YerRaf (rafKod, yerKod);

CREATE TABLE IF NOT EXISTS mst_TransferYontemi (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	aciklama					TEXT NOT NULL DEFAULT '',
	cikisYerKod					TEXT NOT NULL DEFAULT '',
	girisYerKod					TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS mst_TransferYontemi2Aciklama ON mst_TransferYontemi (aciklama);

CREATE TABLE IF NOT EXISTS mst_Marka (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	kod							TEXT NOT NULL PRIMARY KEY,
	aciklama					TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_mstMarka2Aciklama ON mst_Marka (aciklama);

CREATE TABLE IF NOT EXISTS mst_Model (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	kod							TEXT NOT NULL PRIMARY KEY,
	aciklama					TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_mstModel2Aciklama ON mst_Model (aciklama);

CREATE TABLE IF NOT EXISTS mst_Desen (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	kod							TEXT NOT NULL PRIMARY KEY,
	aciklama					TEXT NOT NULL DEFAULT '',
	resimDosyaExt				TEXT NOT NULL DEFAULT '',
	resimContentType			TEXT NOT NULL DEFAULT '',
	resimData					TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_mstDesen2Aciklama ON mst_Desen (aciklama);

CREATE TABLE IF NOT EXISTS mst_Renk (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	kod							TEXT NOT NULL PRIMARY KEY,
	aciklama					TEXT NOT NULL DEFAULT '',
	renk						TEXT NOT NULL DEFAULT '',
	renk2						TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_mstRenk2Aciklama ON mst_Renk (aciklama);

CREATE TABLE IF NOT EXISTS mst_Model (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	kod							TEXT NOT NULL PRIMARY KEY,
	aciklama					TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_mstModel2Aciklama ON mst_Model (aciklama);

CREATE TABLE IF NOT EXISTS mst_StokGrup (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	kod							TEXT NOT NULL PRIMARY KEY,
	aciklama					TEXT NOT NULL DEFAULT '',
	anaGrupKod					TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_mst_StokGrup2Aciklama ON mst_StokGrup (aciklama);
CREATE INDEX IF NOT EXISTS idx_mst_StokGrup2AnaGrup ON mst_StokGrup (anaGrupKod);

CREATE TABLE IF NOT EXISTS mst_Stok (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	kod							TEXT NOT NULL PRIMARY KEY,
	aciklama					TEXT NOT NULL DEFAULT '',
	grupKod						TEXT NOT NULL DEFAULT '',
	brm							TEXT NOT NULL DEFAULT '',
	brm2						TEXT NOT NULL DEFAULT '',
	brmOrani					REAL NOT NULL DEFAULT 0,
	satKdvOrani					INTEGER NOT NULL DEFAULT 0,
	almKdvOrani					INTEGER NOT NULL DEFAULT 0,
	satKdvDegiskenmi			INTEGER NOT NULL DEFAULT 0,
	almKdvDegiskenmi			INTEGER NOT NULL DEFAULT 0,
	tartiReferans				TEXT NOT NULL DEFAULT '',
	tartiReferans2				TEXT NOT NULL DEFAULT '',
	tartiReferans3				TEXT NOT NULL DEFAULT '',
	tartiReferans4				TEXT NOT NULL DEFAULT '',
	tartiReferans5				TEXT NOT NULL DEFAULT '',
	stokDurum					TEXT NOT NULL DEFAULT '',
	dayaniksizmi				INTEGER NOT NULL DEFAULT 0,
	fiyatKdvlimi				INTEGER NOT NULL DEFAULT 0,
	brmFiyat					REAL NOT NULL DEFAULT 0,
	dvBrmFiyat					REAL NOT NULL DEFAULT 0,
	fiyatGorFiyati				REAL NOT NULL DEFAULT 0,
	dvFiyatGorFiyati			REAL NOT NULL DEFAULT 0,
	almFiyat					REAL NOT NULL DEFAULT 0,
	almNetFiyat					REAL NOT NULL DEFAULT 0,
	satFiyat1					REAL NOT NULL DEFAULT 0,
	satFiyat2					REAL NOT NULL DEFAULT 0,
	satFiyat3					REAL NOT NULL DEFAULT 0,
	satFiyat4					REAL NOT NULL DEFAULT 0,
	satFiyat5					REAL NOT NULL DEFAULT 0,
	satFiyat6					REAL NOT NULL DEFAULT 0,
	satFiyat7					REAL NOT NULL DEFAULT 0,
	dvFiyat1					REAL NOT NULL DEFAULT 0,
	dvFiyat2					REAL NOT NULL DEFAULT 0,
	dvFiyat3					REAL NOT NULL DEFAULT 0,
	dvFiyat4					REAL NOT NULL DEFAULT 0,
	dvFiyat5					REAL NOT NULL DEFAULT 0,
	dvFiyat6					REAL NOT NULL DEFAULT 0,
	dvFiyat7					REAL NOT NULL DEFAULT 0,
	paketIciAdet				REAL NOT NULL DEFAULT 0,
	paketIciAdet2				REAL NOT NULL DEFAULT 0,
	satirIskOranSinirVarmi		INTEGER NOT NULL DEFAULT 0,
	satirIskOranSinir			REAL NOT NULL DEFAULT 0,
	resimKodu					TEXT NOT NULL DEFAULT '',

	boyutTipi					TEXT NOT NULL DEFAULT '',
	bedenKategoriKod			TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_mstStok2Aciklama ON mst_Stok (aciklama);
CREATE INDEX IF NOT EXISTS idx_mstStok2GrupKod ON mst_Stok (grupKod);
CREATE INDEX IF NOT EXISTS idx_mstStok2TartiReferans ON mst_Stok (tartiReferans);

CREATE TABLE IF NOT EXISTS mst_SonStok (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	stokKod						TEXT NOT NULL,
	yerKod						TEXT NOT NULL DEFAULT '',
	rafKod						TEXT NOT NULL DEFAULT '',
	--modelKod					TEXT NOT NULL DEFAULT '',
	--renkKod					TEXT NOT NULL DEFAULT '',
	--desenKod					TEXT NOT NULL DEFAULT '',
	--lotNo						TEXT NOT NULL DEFAULT '',
	--en						TEXT NOT NULL DEFAULT '',
	--boy						TEXT NOT NULL DEFAULT '',
	--yukseklik					TEXT NOT NULL DEFAULT '',
	orjMiktar					REAL NOT NULL DEFAULT 0,
	miktar						REAL NOT NULL DEFAULT 0,
	olasiFark					REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS mst_StokPaket (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	stokKod						TEXT NOT NULL,
	paketKod					TEXT NOT NULL,
	paketIcAdet					REAL NOT NULL,
	varsayilanmi				TEXT NOT NULL DEFAULT '*',
	PRIMARY KEY (stokKod, paketKod, paketIcAdet)
);

CREATE TABLE IF NOT EXISTS mst_ProGrup2Stok (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	proGrupKod					TEXT NOT NULL,
	stokKod						TEXT NOT NULL,
	PRIMARY KEY (proGrupKod, stokKod)
);

CREATE TABLE IF NOT EXISTS mst_BarkodReferans (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	refKod						TEXT NOT NULL PRIMARY KEY,
	stokKod						TEXT NOT NULL,
	varsayilanmi				INTEGER NOT NULL DEFAULT 0,
	modelKod					TEXT NOT NULL DEFAULT '',
	renkKod						TEXT NOT NULL DEFAULT '',
	desenKod					TEXT NOT NULL DEFAULT '',
	beden						TEXT NOT NULL DEFAULT '',
	rafKod						TEXT NOT NULL DEFAULT '',
	lotNo						TEXT NOT NULL DEFAULT '',
	koliBarkodmu				INTEGER NOT NULL DEFAULT 0,
	paketKod					TEXT NOT NULL DEFAULT '',
	koliIci						REAL NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_Barkod2StokVeVarsayilanmi on mst_BarkodReferans (stokKod, varsayilanmi DESC);

CREATE TABLE IF NOT EXISTS mst_CariTip (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	kod							TEXT NOT NULL PRIMARY KEY,
	aciklama					TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_mst_CariTip2Aciklama ON mst_CariTip (aciklama);

CREATE TABLE IF NOT EXISTS mst_Cari (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	kod							TEXT NOT NULL PRIMARY KEY,
	seq							INTEGER NOT NULL DEFAULT 0,
	tipKod						TEXT NOT NULL DEFAULT '',
	gonderildi					TEXT NOT NULL DEFAULT '*',
	herGunmu					INTEGER NOT NULL DEFAULT 0,
	rotaDisimi					INTEGER NOT NULL DEFAULT 0,
	rotaIciSayi					INTEGER NOT NULL DEFAULT 0,
	rotaDevreDisimi				INTEGER NOT NULL DEFAULT 0,
	efatmi						INTEGER NOT NULL DEFAULT 0,
	matbuuStokRefYazilirmi		INTEGER NOT NULL DEFAULT 0,
	stkFytInd					INTEGER NOT NULL DEFAULT 0,
	unvan						TEXT NOT NULL DEFAULT '',
	eMail						TEXT NOT NULL DEFAULT '',
	tel1						TEXT NOT NULL DEFAULT '',
	tel2						TEXT NOT NULL DEFAULT '',
	tel3						TEXT NOT NULL DEFAULT '',
	yore						TEXT NOT NULL DEFAULT '',
	posta						TEXT NOT NULL DEFAULT '',
	bolgeKod					TEXT NOT NULL DEFAULT '',
	bolgeAdi					TEXT NOT NULL DEFAULT '',
	ulkeKod						TEXT NOT NULL DEFAULT '',
	ulkeAdi						TEXT NOT NULL DEFAULT '',
	ilKod						TEXT NOT NULL DEFAULT '',
	ilAdi						TEXT NOT NULL DEFAULT '',
	adres						TEXT NOT NULL DEFAULT '',
	vergiDaire					TEXT NOT NULL DEFAULT '',
	sahismi						INTEGER NOT NULL DEFAULT 0,
	vkn							TEXT NOT NULL DEFAULT '',
	disTicaretFirma				TEXT NOT NULL DEFAULT '',
	-- tcOlmayanUyruk				TEXT NOT NULL DEFAULT '',
	konTipKod					TEXT NOT NULL DEFAULT '',
	riskCariKod					TEXT NOT NULL DEFAULT '',
	plasiyerKod					TEXT NOT NULL DEFAULT '',
	kosulGrupKod				TEXT NOT NULL DEFAULT '',
	kdvDurumu					TEXT NOT NULL DEFAULT '',
	stokFiyatInd				INTEGER NOT NULL DEFAULT 0,
	stdDipIskOran				REAL NOT NULL DEFAULT 0,
	orjBakiye					REAL NOT NULL DEFAULT 0,
	orjRiskli					REAL NOT NULL DEFAULT 0,
	orjTakipBorc				REAL NOT NULL DEFAULT 0,
	bakiye						REAL NOT NULL DEFAULT 0,
	riskli						REAL NOT NULL DEFAULT 0,
	riskLimiti					REAL NOT NULL DEFAULT 0,
	takipBorc					REAL NOT NULL DEFAULT 0,
	takipBorcLimiti				REAL NOT NULL DEFAULT 0,
	konSubeAdi					TEXT NOT NULL DEFAULT '',
	konumLongitude				REAL NOT NULL DEFAULT 0,
	konumLatitude				REAL NOT NULL DEFAULT 0,
	konumAccuracy				REAL NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_mstCari2Unvan ON mst_Cari (unvan);

CREATE TABLE IF NOT EXISTS mst_SevkAdres (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	kod							TEXT NOT NULL PRIMARY KEY,
	mustKod						TEXT NOT NULL DEFAULT '',
	aciklama					TEXT NOT NULL DEFAULT '',
	yore						TEXT NOT NULL DEFAULT '',
	ilKod						TEXT NOT NULL DEFAULT '',
	ilAdi						TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_mstSevkAdres2MustKod ON mst_SevkAdres (mustKod);
CREATE INDEX IF NOT EXISTS idx_mstSevkAdres2Aciklama ON mst_SevkAdres (aciklama);

CREATE TABLE IF NOT EXISTS mst_NakliyeSekli (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	kod							TEXT NOT NULL PRIMARY KEY,
	aciklama					TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_mstNakliyeSekli2Aciklama ON mst_NakliyeSekli (aciklama);

CREATE TABLE IF NOT EXISTS mst_TahsilSekli (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	kodNo						INTEGER NOT NULL PRIMARY KEY,
	aciklama					TEXT NOT NULL DEFAULT '',
	tahsilTipi					TEXT NOT NULL DEFAULT '',
	tahsilAltTipi				TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS mst_TahsilSekli2Tip on mst_TahsilSekli (tahsilTipi, tahsilAltTipi);

CREATE TABLE IF NOT EXISTS mst_UgramaNeden (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	kod							TEXT NOT NULL PRIMARY KEY,
	aciklama					TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_mstUgramaNeden2Aciklama ON mst_UgramaNeden (aciklama);

CREATE TABLE IF NOT EXISTS mst_BarTarti (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	kod							TEXT NOT NULL PRIMARY KEY,
	aciklama					TEXT NOT NULL DEFAULT '',
	stokBas						INTEGER NOT NULL DEFAULT '',
	stokHane					INTEGER NOT NULL DEFAULT 0,
	miktarBas					INTEGER NOT NULL DEFAULT 0,
	miktarHane					INTEGER NOT NULL DEFAULT 0,
	miktarBolen					REAL NOT NULL DEFAULT 0,
	miktarBrm					TEXT NOT NULL DEFAULT '',
	fiyatBas					INTEGER NOT NULL DEFAULT 0,
	fiyatHane					INTEGER NOT NULL DEFAULT 0,
	fiyatBolen					REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS mst_BarAyrisim (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
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
	paketBas					INTEGER NOT NULL DEFAULT 0,
	paketHane					INTEGER NOT NULL DEFAULT 0,
	modelBas					INTEGER NOT NULL DEFAULT 0,
	modelHane					INTEGER NOT NULL DEFAULT 0,
	renkBas						INTEGER NOT NULL DEFAULT 0,
	renkHane					INTEGER NOT NULL DEFAULT 0,
	desenBas					INTEGER NOT NULL DEFAULT 0,
	desenHane					INTEGER NOT NULL DEFAULT 0,
	kavalaBas					INTEGER NOT NULL DEFAULT 0,
	kavalaHane					INTEGER NOT NULL DEFAULT 0,
	enBas						INTEGER NOT NULL DEFAULT 0,
	enHane						INTEGER NOT NULL DEFAULT 0,
	boyBas						INTEGER NOT NULL DEFAULT 0,
	boyHane						INTEGER NOT NULL DEFAULT 0,
	yukseklikBas				INTEGER NOT NULL DEFAULT 0,
	yukseklikHane				INTEGER NOT NULL DEFAULT 0,
	lotNoBas					INTEGER NOT NULL DEFAULT 0,
	lotNoHane					INTEGER NOT NULL DEFAULT 0,
	seriNoBas					INTEGER NOT NULL DEFAULT 0,
	seriNoHane					INTEGER NOT NULL DEFAULT 0,
	rafBas						INTEGER NOT NULL DEFAULT 0,
	rafHane						INTEGER NOT NULL DEFAULT 0,
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

CREATE TABLE IF NOT EXISTS mst_OzelKampanya (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	kod							TEXT NOT NULL PRIMARY KEY,
	aciklama					TEXT NOT NULL DEFAULT '',
	iskSinir					INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_mstOzelKampanya2Aciklama ON mst_OzelKampanya (aciklama);

CREATE TABLE IF NOT EXISTS mst_BedenKategoriCarpan (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	bedenKategoriKod			TEXT NOT NULL,
	asortiKod					TEXT NOT NULL,
	carpan						REAL NOT NULL DEFAULT 1,
	PRIMARY KEY (bedenKategoriKod, asortiKod)
);

CREATE TABLE IF NOT EXISTS mst_BedenKategoriDetay (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	kategoriKod					TEXT NOT NULL,
	abKod						TEXT NOT NULL,
	abTipi						TEXT NOT NULL,		-- A:Asorti
	seq							INTEGER NOT NULL,
	PRIMARY KEY (kategoriKod, abKod)
);

CREATE TABLE IF NOT EXISTS mst_StokRBK (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	stokKod						TEXT NOT NULL,
	desenKod					TEXT NOT NULL,
	renkKod						TEXT NOT NULL,
	asortiVeyaBeden				TEXT NOT NULL,
	PRIMARY KEY (stokKod, desenKod, renkKod, asortiVeyaBeden)
);

CREATE TABLE IF NOT EXISTS mst_KosulOrtak (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	kosulTip					TEXT NOT NULL,
	kod							TEXT NOT NULL,
	vioID						INTEGER,
	aciklama					TEXT NOT NULL DEFAULT '',
	isaretDurumu				TEXT NOT NULL DEFAULT '',
	ozelMusteriListesiVarmi		INTEGER NOT NULL DEFAULT 0,
	iskontoYapilmazmi			INTEGER NOT NULL DEFAULT 0,
	promosyonYapilmazmi			INTEGER NOT NULL DEFAULT 0,
	tarihBasi					TEXT NOT NULL DEFAULT '',
	tarihSonu					TEXT NOT NULL DEFAULT '',
	cariTipBasi					TEXT NOT NULL DEFAULT '',
	cariTipSonu					TEXT NOT NULL DEFAULT '',
	cariBolgeBasi				TEXT NOT NULL DEFAULT '',
	cariBolgeSonu				TEXT NOT NULL DEFAULT '',
	cariBasi					TEXT NOT NULL DEFAULT '',
	cariSonu					TEXT NOT NULL DEFAULT '',
	cariKosulGrupBasi			TEXT NOT NULL DEFAULT '',
	cariKosulGrupSonu			TEXT NOT NULL DEFAULT '',
	plasiyerTipBasi				TEXT NOT NULL DEFAULT '',
	plasiyerTipSonu				TEXT NOT NULL DEFAULT '',
	plasiyerBolgeBasi			TEXT NOT NULL DEFAULT '',
	plasiyerBolgeSonu			TEXT NOT NULL DEFAULT '',
	plasiyerBasi				TEXT NOT NULL DEFAULT '',
	plasiyerSonu				TEXT NOT NULL DEFAULT '',
	PRIMARY KEY (kosulTip, kod)
);
CREATE INDEX IF NOT EXISTS idx_mstKosulOrtak2TarihVeCari ON mst_KosulOrtak (tarihBasi, tarihSonu, cariBasi, cariSonu);

CREATE TABLE IF NOT EXISTS mst_KosulMusteriler (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	kosulTip					TEXT NOT NULL,
	kosulKod					TEXT NOT NULL,
	kod							TEXT NOT NULL,
	PRIMARY KEY (kosulTip, kosulKod, kod),
	FOREIGN KEY (kosulTip, kosulKod)
		REFERENCES mst_KosulOrtak (kosulTip, kod) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mst_KosulStoklar (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	kosulTip					TEXT NOT NULL,
	kosulKod					TEXT NOT NULL,
	kod							TEXT NOT NULL,
	markaKod					TEXT NOT NULL DEFAULT '',
	fiyatMiktarTipi				TEXT,
	ozelFiyat					REAL NOT NULL DEFAULT 0,
	ozelDvFiyat					REAL NOT NULL DEFAULT 0,
	orjFiyat					REAL NOT NULL DEFAULT 0,
	orjDvFiyat					REAL NOT NULL DEFAULT 0,
	rafFiyati					REAL NOT NULL DEFAULT 0,
	enDusukFiyat				REAL NOT NULL DEFAULT 0,
	kotaMiktar					REAL NOT NULL DEFAULT 0,
	iskSinir					REAL NOT NULL DEFAULT 0,
	iskOran1					REAL NOT NULL DEFAULT 0,
	iskOran2					REAL NOT NULL DEFAULT 0,
	iskOran3					REAL NOT NULL DEFAULT 0,
	iskOran4					REAL NOT NULL DEFAULT 0,
	iskOran5					REAL NOT NULL DEFAULT 0,
	iskOran6					REAL NOT NULL DEFAULT 0,
	kamOran1					REAL NOT NULL DEFAULT 0,
	kamOran2					REAL NOT NULL DEFAULT 0,
	kamOran3					REAL NOT NULL DEFAULT 0,
	kamOran4					REAL NOT NULL DEFAULT 0,
	kamOran5					REAL NOT NULL DEFAULT 0,
	kamOran6					REAL NOT NULL DEFAULT 0,
	mfPay						REAL NOT NULL DEFAULT 0,
	mfBaz						REAL NOT NULL DEFAULT 0,

	kadHMiktar1					REAL NOT NULL DEFAULT 0,
	kadIskOran1					REAL NOT NULL DEFAULT 0,
	kadHMiktar2					REAL NOT NULL DEFAULT 0,
	kadIskOran2					REAL NOT NULL DEFAULT 0,
	kadHMiktar3					REAL NOT NULL DEFAULT 0,
	kadIskOran3					REAL NOT NULL DEFAULT 0,
	kadHMiktar4					REAL NOT NULL DEFAULT 0,
	kadIskOran4					REAL NOT NULL DEFAULT 0,
	kadHMiktar5					REAL NOT NULL DEFAULT 0,
	kadIskOran5					REAL NOT NULL DEFAULT 0,

	PRIMARY KEY (kosulTip, kosulKod, kod, markaKod),
	FOREIGN KEY (kosulTip, kosulKod)
		REFERENCES mst_KosulOrtak (kosulTip, kod) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mst_KosulStokGruplar (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	kosulTip					TEXT NOT NULL,
	kosulKod					TEXT NOT NULL,
	kod							TEXT NOT NULL,
	markaKod					TEXT NOT NULL DEFAULT '',
	ozelFiyat					REAL NOT NULL DEFAULT 0,
	ozelDvFiyat					REAL NOT NULL DEFAULT 0,
	orjFiyat					REAL NOT NULL DEFAULT 0,
	orjDvFiyat					REAL NOT NULL DEFAULT 0,
	rafFiyati					REAL NOT NULL DEFAULT 0,
	enDusukFiyat				REAL NOT NULL DEFAULT 0,
	kotaMiktar					REAL NOT NULL DEFAULT 0,
	iskSinir					REAL NOT NULL DEFAULT 0,
	iskOran1					REAL NOT NULL DEFAULT 0,
	iskOran2					REAL NOT NULL DEFAULT 0,
	iskOran3					REAL NOT NULL DEFAULT 0,
	iskOran4					REAL NOT NULL DEFAULT 0,
	iskOran5					REAL NOT NULL DEFAULT 0,
	iskOran6					REAL NOT NULL DEFAULT 0,
	kamOran1					REAL NOT NULL DEFAULT 0,
	kamOran2					REAL NOT NULL DEFAULT 0,
	kamOran3					REAL NOT NULL DEFAULT 0,
	kamOran4					REAL NOT NULL DEFAULT 0,
	kamOran5					REAL NOT NULL DEFAULT 0,
	kamOran6					REAL NOT NULL DEFAULT 0,
	mfPay						REAL NOT NULL DEFAULT 0,
	mfBaz						REAL NOT NULL DEFAULT 0,
	kadHMiktar1					REAL NOT NULL DEFAULT 0,
	kadIskOran1					REAL NOT NULL DEFAULT 0,
	kadHMiktar2					REAL NOT NULL DEFAULT 0,
	kadIskOran2					REAL NOT NULL DEFAULT 0,
	kadHMiktar3					REAL NOT NULL DEFAULT 0,
	kadIskOran3					REAL NOT NULL DEFAULT 0,
	kadHMiktar4					REAL NOT NULL DEFAULT 0,
	kadIskOran4					REAL NOT NULL DEFAULT 0,
	kadHMiktar5					REAL NOT NULL DEFAULT 0,
	kadIskOran5					REAL NOT NULL DEFAULT 0,
	PRIMARY KEY (kosulTip, kosulKod, kod, markaKod),
	FOREIGN KEY (kosulTip, kosulKod)
		REFERENCES mst_KosulOrtak (kosulTip, kod) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mst_Promosyon (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	proTip						TEXT NOT NULL,
	kod							TEXT NOT NULL,
	vioID						INTEGER,
	aciklama					TEXT NOT NULL DEFAULT '',
	veriTipi					TEXT NOT NULL DEFAULT '',
	oncelik						INTEGER NOT NULL DEFAULT 0,
	vGrupKod					TEXT NOT NULL DEFAULT '',
	vStokKod					TEXT NOT NULL DEFAULT '',
	vMiktar						REAL NOT NULL DEFAULT 0,
	vBrm						TEXT NOT NULL DEFAULT '',
	vCiro						REAL NOT NULL DEFAULT 0,
	vCiroKdvlimi				INTEGER NOT NULL DEFAULT 0,
	hedefTipi					TEXT NOT NULL DEFAULT '',
	hGrupKod					TEXT NOT NULL DEFAULT '',
	hStokKod					TEXT NOT NULL DEFAULT '',
	hMiktar						REAL NOT NULL DEFAULT 0,
	hBrm						TEXT NOT NULL DEFAULT '',
	hDipIsk						REAL NOT NULL DEFAULT 0,
	hMFVarsaSatirIskKapat		INTEGER NOT NULL DEFAULT 0,
	detayliMusterimi			INTEGER NOT NULL DEFAULT 0,
	kademelimi					INTEGER NOT NULL DEFAULT 0,
	tarihBasi					TEXT NOT NULL DEFAULT '',
	tarihSonu					TEXT NOT NULL DEFAULT '',
	cariTipBasi					TEXT NOT NULL DEFAULT '',
	cariTipSonu					TEXT NOT NULL DEFAULT '',
	cariBolgeBasi				TEXT NOT NULL DEFAULT '',
	cariBolgeSonu				TEXT NOT NULL DEFAULT '',
	cariKosulGrupBasi			TEXT NOT NULL DEFAULT '',
	cariKosulGrupSonu			TEXT NOT NULL DEFAULT '',
	cariBasi					TEXT NOT NULL DEFAULT '',
	cariSonu					TEXT NOT NULL DEFAULT '',
	plasiyerBasi				TEXT NOT NULL DEFAULT '',
	plasiyerSonu				TEXT NOT NULL DEFAULT '',
	hIskOran					REAL NOT NULL DEFAULT 0,
	voGrup1Kod					TEXT NOT NULL DEFAULT '',
	voGrup1Miktar				REAL NOT NULL DEFAULT 0,
	voGrup2Varmi				INTEGER NOT NULL DEFAULT 0,	
	voGrup2Kod					TEXT NOT NULL DEFAULT '',
	voGrup2Miktar				REAL NOT NULL DEFAULT 0,
	voGrup3Varmi				INTEGER NOT NULL DEFAULT 0,	
	voGrup3Kod					TEXT NOT NULL DEFAULT '',
	voGrup3Miktar				REAL NOT NULL DEFAULT 0,
	voGrup4Varmi				INTEGER NOT NULL DEFAULT 0,	
	voGrup4Kod					TEXT NOT NULL DEFAULT '',
	voGrup4Miktar				REAL NOT NULL DEFAULT 0,
	voGrup5Varmi				INTEGER NOT NULL DEFAULT 0,	
	voGrup5Kod					TEXT NOT NULL DEFAULT '',
	voGrup5Miktar				REAL NOT NULL DEFAULT 0,
	voGrup6Kod					TEXT NOT NULL DEFAULT '',
	voGrup6Varmi				INTEGER NOT NULL DEFAULT 0,	
	voGrup6Miktar				REAL NOT NULL DEFAULT 0,
	voGrup7Kod					TEXT NOT NULL DEFAULT '',
	voGrup7Miktar				REAL NOT NULL DEFAULT 0,
	voGrup7Varmi				INTEGER NOT NULL DEFAULT 0,	
	voGrup8Kod					TEXT NOT NULL DEFAULT '',
	voGrup8Miktar				REAL NOT NULL DEFAULT 0,
	voGrup8Varmi				INTEGER NOT NULL DEFAULT 0,	
	voGrup9Kod					TEXT NOT NULL DEFAULT '',
	voGrup9Miktar				REAL NOT NULL DEFAULT 0,
	voGrup9Varmi				INTEGER NOT NULL DEFAULT 0,	
	voGrup10Kod					TEXT NOT NULL DEFAULT '',
	voGrup10Miktar				REAL NOT NULL DEFAULT 0,
	voGrup10Varmi				INTEGER NOT NULL DEFAULT 0,	
	PRIMARY KEY (proTip, kod)
);
CREATE INDEX IF NOT EXISTS idx_mstPromosyon2TarihVeCari ON mst_Promosyon (tarihBasi, tarihSonu, cariBasi, cariSonu);

CREATE TABLE IF NOT EXISTS mst_PromosyonMusteri (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	proTip						TEXT NOT NULL,
	proKod						TEXT NOT NULL,
	kod							TEXT NOT NULL,
	PRIMARY KEY (proTip, proKod, kod),
	FOREIGN KEY (proTip, proKod)
		REFERENCES mst_Promosyon (proTip, kod) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mst_PromosyonKademe (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	proTip						TEXT NOT NULL,
	proKod						TEXT NOT NULL,
	seq							INTEGER NOT NULL,
	eKadar						REAL NOT NULL,
	mfAdet						REAL NOT NULL DEFAULT 0,
	PRIMARY KEY (proTip, proKod, seq),
	FOREIGN KEY (proTip, proKod)
		REFERENCES mst_Promosyon (proTip, kod) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mst_SablonFis (
	rowid						INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	etAdimTipi					TEXT NOT NULL,
	aciklama					TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mstSablonFis2Asil ON mst_SablonFis (etAdimTipi, aciklama);

CREATE TABLE IF NOT EXISTS mst_SablonHar (
	rowid						INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	fissayac					INTEGER NOT NULL,
	seq							INTEGER NOT NULL,
	shKod						TEXT NOT NULL DEFAULT '',
	miktar						REAL NOT NULL DEFAULT 0,
	fiyat						REAL NOT NULL DEFAULT 0,
	iskOran1					REAL NOT NULL DEFAULT 0,
	iskOran2					REAL NOT NULL DEFAULT 0,
	iskOran3					REAL NOT NULL DEFAULT 0,
	yerKod						TEXT NOT NULL DEFAULT '',
	--modelKod					TEXT NOT NULL DEFAULT '',
	--renkKod					TEXT NOT NULL DEFAULT '',
	--desenKod					TEXT NOT NULL DEFAULT '',
	--lotNo						TEXT NOT NULL DEFAULT '',
	--en						TEXT NOT NULL DEFAULT '',
	--boy						TEXT NOT NULL DEFAULT '',
	--yukseklik					TEXT NOT NULL DEFAULT '',
	detAciklama					TEXT NOT NULL DEFAULT '',
	FOREIGN KEY (fissayac) REFERENCES mst_SablonFis (rowid) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mstSablonHar2Asil ON mst_SablonHar (fissayac, seq);

CREATE TABLE IF NOT EXISTS mst_SablonFisTipi (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	kod							TEXT NOT NULL PRIMARY KEY,
	aciklama					TEXT NOT NULL DEFAULT '',
	data						TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_mstSablonFisTipi2Aciklama ON mst_SablonFisTipi (aciklama);

CREATE TABLE IF NOT EXISTS data_PIFFis (
	rowid						INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	vioID						INTEGER,

	piftipi						TEXT NOT NULL DEFAULT '',
	almsat						TEXT NOT NULL DEFAULT '',
	iade						TEXT NOT NULL DEFAULT '',
	fistipi						TEXT NOT NULL DEFAULT '',
	ayrimtipi					TEXT NOT NULL DEFAULT '',
	fisekayrim					TEXT NOT NULL DEFAULT '',
	ozelisaret					TEXT NOT NULL DEFAULT '',
	tarih						TEXT NOT NULL DEFAULT ( date('now', 'localtime') ),
	seri						TEXT NOT NULL DEFAULT '',
	noyil						INTEGER NOT NULL DEFAULT 0,
	fisno						INTEGER NOT NULL,
	mustkod						TEXT NOT NULL DEFAULT '',
	ticmustkod					TEXT NOT NULL DEFAULT '',
	--althesapkod					TEXT NOT NULL DEFAULT '',
	--aracikod					TEXT NOT NULL DEFAULT '',
	
	erisimzamani				TEXT NOT NULL DEFAULT '',
	kayitzamani					TEXT NOT NULL DEFAULT ( datetime('now', 'localtime') ),
	gonderildi					TEXT NOT NULL DEFAULT '',
	yazdirildi					TEXT NOT NULL DEFAULT '',
	gecici						TEXT NOT NULL DEFAULT '',
	rapor						TEXT NOT NULL DEFAULT '',
	degismedi					TEXT NOT NULL DEFAULT '',
	tamamlandi					TEXT NOT NULL DEFAULT '*',
	silindi						TEXT NOT NULL DEFAULT '',
	sevktarih					TEXT NOT NULL DEFAULT '',
	yerortakdir					TEXT NOT NULL DEFAULT '*',
	yerkod						TEXT NOT NULL DEFAULT '',
	refyerkod					TEXT NOT NULL DEFAULT '',
	subekod						TEXT NOT NULL DEFAULT '',
	subeortakdir				TEXT NOT NULL DEFAULT '*',
	refsubekod					TEXT NOT NULL DEFAULT '',
	oncelik						INTEGER NOT NULL DEFAULT 0,
	nakseklikod					TEXT NOT NULL DEFAULT '',
	xadreskod					TEXT NOT NULL DEFAULT '',
	tahseklikodno				INTEGER NOT NULL DEFAULT 0,
	xplasiyerkod				TEXT NOT NULL DEFAULT '',
	bozukmu						INTEGER NOT NULL DEFAULT 0,
	transferTipKod				TEXT NOT NULL DEFAULT '',

	seferAdi					TEXT NOT NULL DEFAULT '',
	containerNox				TEXT NOT NULL DEFAULT '',
	soforAdi					TEXT NOT NULL DEFAULT '',
	plaka						TEXT NOT NULL DEFAULT '',
	planNo						INTEGER NOT NULL DEFAULT 0,
	ekBilgi						TEXT NOT NULL DEFAULT '',

	--odemeguntext				TEXT NOT NULL DEFAULT '',
	vade						TEXT NOT NULL DEFAULT '',
	fisaciklama					TEXT NOT NULL DEFAULT '',

	efayrimtipi					TEXT NOT NULL DEFAULT '',
	zorunluguidstr				TEXT NOT NULL DEFAULT '',

	--kdvlimi					TEXT NOT NULL DEFAULT '',
	dvkod						TEXT NOT NULL DEFAULT '',
	dvkur						REAL NOT NULL DEFAULT 0,

	--dvbrut					REAL NOT NULL DEFAULT 0,
	--topdvkdv					REAL NOT NULL DEFAULT 0,
	--dvdigerbedel				REAL NOT NULL DEFAULT 0,
	--dvciro					REAL NOT NULL DEFAULT 0,
	--dvnet						REAL NOT NULL DEFAULT 0,
	brut						REAL NOT NULL DEFAULT 0,
	topkdv						REAL NOT NULL DEFAULT 0,
	matrah0						REAL NOT NULL DEFAULT 0,
	matrah1						REAL NOT NULL DEFAULT 0,
	kdv1						REAL NOT NULL DEFAULT 0,
	matrah10					REAL NOT NULL DEFAULT 0,
	kdv10						REAL NOT NULL DEFAULT 0,
	matrah20					REAL NOT NULL DEFAULT 0,
	kdv20						REAL NOT NULL DEFAULT 0,
	yuvarlamaFarki				REAL NOT NULL DEFAULT 0,
	ciro						REAL NOT NULL DEFAULT 0,
	--bciro						REAL NOT NULL DEFAULT 0,
	net							REAL NOT NULL DEFAULT 0,
	dipiskoran					REAL NOT NULL DEFAULT 0,
	dipiskbedel					REAL NOT NULL DEFAULT 0,
	detaykayitsayisi			INTEGER NOT NULL DEFAULT 0,
	--pkarmami					TEXT NOT NULL DEFAULT ''
	tahsilatRowId				INTEGER,
	tumBarkodlar				TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS data_PIFStok (
	rowid						INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	fissayac					INTEGER NOT NULL,
	seq							INTEGER NOT NULL,
	vioID						INTEGER,
	dettipi						TEXT NOT NULL DEFAULT '',
	okunanbarkod				TEXT NOT NULL DEFAULT '',
	okunanTumBarkodlar			TEXT NOT NULL DEFAULT '',
	shkod						TEXT NOT NULL,
	rafKod						TEXT NOT NULL DEFAULT '',
	refRafKod					TEXT NOT NULL DEFAULT '',
	--modelKod					TEXT NOT NULL DEFAULT '',
	--renkKod					TEXT NOT NULL DEFAULT '',
	--desenKod					TEXT NOT NULL DEFAULT '',
	--lotNo						TEXT NOT NULL DEFAULT '',
	--en						TEXT NOT NULL DEFAULT '',
	--boy						TEXT NOT NULL DEFAULT '',
	--yukseklik					TEXT NOT NULL DEFAULT '',

	yerKod						TEXT NOT NULL DEFAULT '',
	promokod					TEXT NOT NULL DEFAULT '',
	promosyonYapilmazmi			TEXT NOT NULL DEFAULT '',
	iskontoYapilmazmi			TEXT NOT NULL DEFAULT '',

	orjKdvOrani					INTEGER NOT NULL DEFAULT 0,
	kdvorani					INTEGER NOT NULL DEFAULT 0,
	kdvDegiskenmi				INTEGER NOT NULL DEFAULT 0,
	
	iskoran1					REAL NOT NULL DEFAULT 0,
	iskoran2					REAL NOT NULL DEFAULT 0,
	iskoran3					REAL NOT NULL DEFAULT 0,
	iskoran4					REAL NOT NULL DEFAULT 0,
	iskoran5					REAL NOT NULL DEFAULT 0,
	iskoran6					REAL NOT NULL DEFAULT 0,

	kamoran1					REAL NOT NULL DEFAULT 0,
	kamoran2					REAL NOT NULL DEFAULT 0,
	kamoran3					REAL NOT NULL DEFAULT 0,
	kamoran4					REAL NOT NULL DEFAULT 0,
	kamoran5					REAL NOT NULL DEFAULT 0,
	kamoran6					REAL NOT NULL DEFAULT 0,

	kadiskoran					REAL NOT NULL DEFAULT 0,
	kadIskYapi					TEXT NOT NULL DEFAULT '',

	mfbaz						INTEGER NOT NULL DEFAULT 0,
	mfpay						INTEGER NOT NULL DEFAULT 0,
	malfazlasi					INTEGER NOT NULL DEFAULT 0,
	
	ozelKampanyaKod				TEXT NOT NULL DEFAULT '',
	ozelKampanyaIskSinir		REAL NOT NULL DEFAULT 0,
	ozelKampanyaOran1			REAL NOT NULL DEFAULT 0,
	ozelKampanyaOran2			REAL NOT NULL DEFAULT 0,
	ozelKampanyaOran3			REAL NOT NULL DEFAULT 0,
	ozelKampanyaOran4			REAL NOT NULL DEFAULT 0,
	ozelKampanyaOran5			REAL NOT NULL DEFAULT 0,
	ozelKampanyaOran6			REAL NOT NULL DEFAULT 0,

	okutmasayisi				INTEGER NOT NULL DEFAULT 0,
	--xmiktar					REAL NOT NULL DEFAULT 0,
	--xmalfazlasi				REAL NOT NULL DEFAULT 0,
	satirIskOranSinirVarmi		INTEGER NOT NULL DEFAULT 0,
	satirIskOranSinir			REAL NOT NULL DEFAULT 0,
	iskSinir					REAL NOT NULL DEFAULT 0,

	miktar						REAL NOT NULL DEFAULT 0,
	miktar2						REAL NOT NULL DEFAULT 0,
	hMiktar						REAL NOT NULL DEFAULT 0,
	--malfazmkt					REAL NOT NULL DEFAULT 0,
	xbrm						REAL NOT NULL DEFAULT '',
	paketkod					TEXT NOT NULL DEFAULT '',
	paketmiktar					REAL NOT NULL DEFAULT 0,
	paketicadet					REAL NOT NULL DEFAULT 0,
	karmaPaletNo				INTEGER NOT NULL DEFAULT 0,
	urunToplama					TEXT NOT NULL DEFAULT '',
	
	--paketkod					TEXT NOT NULL DEFAULT '',
	--koli						REAL NOT NULL DEFAULT 0,

	--fiyatveritipi				TEXT NOT NULL DEFAULT '',

	--ekranveridvfiyat 			REAL NOT NULL DEFAULT 0,
	--belgedvfiyat				REAL NOT NULL DEFAULT 0,
	--belgedvbrutbedel 			REAL NOT NULL DEFAULT 0,
	--belgedvbedel 				REAL NOT NULL DEFAULT 0,

	--ekranverifiyat 			REAL NOT NULL DEFAULT 0,
	orjfiyat					REAL NOT NULL DEFAULT 0,
	belgefiyat					REAL NOT NULL DEFAULT 0,
	--endusukfiyat			
	belgebrutbedel 				REAL NOT NULL DEFAULT 0,
	belgebedel					REAL NOT NULL DEFAULT 0,

	--belgedipisk				REAL NOT NULL DEFAULT 0,
	--perkdv					REAL NOT NULL DEFAULT 0,
	ekaciklama					TEXT NOT NULL DEFAULT '',

-- Karma Kullanim icin
	--detaracikod				TEXT NOT NULL DEFAULT '',
	--detayislem				TEXT NOT NULL DEFAULT '',

	ozelfiyatmi					TEXT NOT NULL DEFAULT '',
	ozeliskoranmi				TEXT NOT NULL DEFAULT '',

	siparisVioIDVeMiktarYapi	TEXT NOT NULL DEFAULT '',
	rbkTableData				TEXT NOT NULL DEFAULT '',

	boyutTipi					TEXT NOT NULL DEFAULT '',
	bedenKategoriKod			TEXT NOT NULL DEFAULT '',

	paketBilgi					TEXT NOT NULL DEFAULT '',
	sevkSipHarSayac				INTEGER,

	kosulYapi					TEXT NOT NULL DEFAULT '',
	altDetaylar					TEXT NOT NULL DEFAULT '',

	proIskOran					REAL NOT NULL DEFAULT 0,

	FOREIGN KEY (fissayac) REFERENCES data_PIFFis (rowid) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_dataPIFStok2Asil ON data_PIFStok (fissayac, seq);

CREATE TABLE IF NOT EXISTS data_TahsilatFis (
	rowid						INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	vioID						INTEGER,
	fistipi						TEXT NOT NULL DEFAULT 'BT',
	tarih						TEXT NOT NULL DEFAULT ( date('now', 'localtime') ),
	seri						TEXT NOT NULL DEFAULT '',
	fisno						INTEGER NOT NULL,
	mustkod						TEXT NOT NULL DEFAULT '',

	erisimzamani				TEXT NOT NULL DEFAULT '',
	kayitzamani					TEXT NOT NULL DEFAULT ( datetime('now', 'localtime') ),
	gonderildi					TEXT NOT NULL DEFAULT '',
	yazdirildi					TEXT NOT NULL DEFAULT '',
	gecici						TEXT NOT NULL DEFAULT '',
	rapor						TEXT NOT NULL DEFAULT '',
	silindi						TEXT NOT NULL DEFAULT '',
	degismedi					TEXT NOT NULL DEFAULT '',

	ozelisaret					TEXT NOT NULL DEFAULT '',

	toplambedel					REAL NOT NULL DEFAULT 0,
	detaykayitsayisi			INTEGER NOT NULL DEFAULT 0,

	fisaciklama					TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS data_TahsilatDetay (
	rowid						INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	vioID						INTEGER,
	fissayac					INTEGER NOT NULL,
	seq							INTEGER NOT NULL,
	tahSekliNo					INTEGER NOT NULL,
	bedel						REAL NOT NULL DEFAULT 0,
	FOREIGN KEY (fissayac) REFERENCES data_TahsilatFis (rowid) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_dataTahsilatDetay2Asil ON data_TahsilatDetay (fissayac, seq);

CREATE TABLE IF NOT EXISTS data_UgramaFis (
	rowid						INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	vioID						INTEGER,
	fistipi						TEXT NOT NULL DEFAULT 'U',
	tarih						TEXT NOT NULL DEFAULT ( date('now', 'localtime') ),
	mustkod						TEXT NOT NULL DEFAULT '',
	fisno						INTEGER NOT NULL DEFAULT 0,
	erisimzamani				TEXT NOT NULL DEFAULT '',
	kayitzamani					TEXT NOT NULL DEFAULT ( datetime('now', 'localtime') ),
	gonderildi					TEXT NOT NULL DEFAULT '',
	yazdirildi					TEXT NOT NULL DEFAULT '',
	gecici						TEXT NOT NULL DEFAULT '',
	rapor						TEXT NOT NULL DEFAULT '',
	silindi						TEXT NOT NULL DEFAULT '',
	degismedi					TEXT NOT NULL DEFAULT '',

	nedenKod					TEXT NOT NULL DEFAULT '',
	fisaciklama					TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS data_DigerHareket (
	rowid						INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	vioID						INTEGER,
	fistipi						TEXT NOT NULL DEFAULT 'DG',
	seq							INTEGER NOT NULL DEFAULT 0,
	gecici						TEXT NOT NULL DEFAULT '',
	rapor						TEXT NOT NULL DEFAULT '*',
	gonderildi					TEXT NOT NULL DEFAULT '*',
	silindi						TEXT NOT NULL DEFAULT '',
	yazdirildi					TEXT NOT NULL DEFAULT '',
	tarih						TEXT NOT NULL DEFAULT ( date('now', 'localtime') ),
	vade						TEXT NOT NULL DEFAULT '',
	seri						TEXT NOT NULL DEFAULT '',
	fisno						INTEGER NOT NULL,
	ozelisaret					TEXT NOT NULL DEFAULT '',
	mustkod						TEXT NOT NULL DEFAULT '',
	ba							TEXT NOT NULL DEFAULT '',
	islAdi						TEXT NOT NULL DEFAULT '',
	refText						TEXT NOT NULL DEFAULT '',
	bedel						REAL NOT NULL DEFAULT 0,
	detaykayitsayisi			INTEGER NOT NULL DEFAULT 0,
	aciklama					TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS data_BekleyenSiparisler (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	vioID						INTEGER NOT NULL PRIMARY KEY,
	ayrimTipi					TEXT NOT NULL DEFAULT '',
	tarih						TEXT NOT NULL,
	teslimTarih					TEXT NOT NULL DEFAULT '',
	teslimYerKod				TEXT NOT NULL DEFAULT '',
	nakSekliKod					TEXT NOT NULL DEFAULT '',
	odemeGunKod					TEXT NOT NULL DEFAULT '',
	tahSekliKodNo				INTEGER NOT NULL DEFAULT 0,
	fisNox						TEXT NOT NULL,
	almSat						TEXT NOT NULL,
	mustKod						TEXT NOT NULL,
	stokKod						TEXT NOT NULL,
	bekleyenMiktar				REAL NOT NULL DEFAULT 0,
	kalanMiktar					REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS data_KonumBilgi (
	rowid						INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	kayitTS						TEXT NOT NULL,
	userTip						TEXT NOT NULL,
	userKod						TEXT NOT NULL,
	gonderildi					TEXT NOT NULL DEFAULT '',
	latitude					REAL NOT NULL,
	longitude					REAL NOT NULL,
	speed						REAL NOT NULL DEFAULT 0
);


