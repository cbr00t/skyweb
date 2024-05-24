
-- Sky Cafe tablolari

create table mst_Stok
	( kod				BLOB not null primary key
	, aciklama			BLOB not null default ''
	, kdvOrani			INTEGER not null default 0
	, degiskenFiyatmi	BLOB not null default ''
	, adisyonFiyat		REAL not null default 0
	, selfServisFiyat	REAL not null default 0
	, paketFiyat		REAL not null default 0
	, webFiyat			REAL not null default 0
	, praFiyat			REAL not null default 0
	);

create table mst_TahsilatSekli
	( tahsilKodNo		INTEGER not null primary key
	, aciklama			BLOB not null
	, anatip			BLOB not null default ''	-- NK:Nakit, PS:Pos, YM:yemekcek, Bos:acik hesap
	);


create table mst_StokOzellik
	( uzakID			INTEGER not null primary key		-- veriyi cekerken
	, stokKod			BLOB not null
	, ozellik			BLOB not null default ''
	, ekFiyat			REAL not null default 0
	, primary key (stokKod, ozellik)
	);
create INDEX idx_StokOzellik2Asil on mst_StokOzellik (stokKod, ozellik);

create table mst_ResMasa
	( kod				BLOB not null primary key
	, aciklama			BLOB not null default ''
	, uzakID			INTEGER not null
	, anaTip			BLOB not null default ''	-- bos:adis. P:Paket, S:Self, I:int/web, R:Pra
	, servisDisimi		BLOB not null default ''
-- aktif kullanim
	, aktifFisID		INTEGER
	, rezervemi			BLOB not null default ''
	, rezerveTahminiGelis	REAL
	, rezerveSayi		INTEGER not null default 0
	, rezerveAciklama	BLOB not null default ''
	);

create table fis_Restoran
	( kayitID			INTEGER not null primary key autoincrement
	, acilisTS			REAL
	, kapanisTS			REAL
	, sonIslemTS		REAL not null
	, uzakAktarimTS		REAL
	, uzakID			INTEGER				-- net.senk fis olusunca
	, kasiyerKod		BLOB not null default ''
	, kasaNo			INTEGER not null default 1
	, masaKod			BLOB not null default ''

	, kdvliBrut			REAL not null default 0
	, dipIskOran		REAL not null default 0
	, kdvliIsk			REAL not null default 0
	, fisSonuc			REAL not null default 0

	, fisAciklama		BLOB not null default ''
	, iptalmi			BLOB not null default ''
	, iptalAciklama		BLOB not null default ''
	, yazdirildimi		BLOB not null default ''
	, gelenMasaKod		BLOB not null default ''
	, gidenMasaKod		BLOB not null default ''
	);

-- har_RestoranKdv gereksiz fis kapanis aninda net.senk ile olusur

-- kapanis aninda yapilir
create table har_RestoranTahsil
	( kayitID			INTEGER not null primary key autoincrement
	, fisID				INTEGER not null
	, tahsilSekliNo		INTEGER not null
	, bedel				REAL not null default 0
	, FOREIGN KEY (fisID) REFERENCES fis_Restoran (kayitID)
	);

create table har_RestoranDetay
	( kayitID			INTEGER not null primary key autoincrement
	, fisID				INTEGER not null
	, seq				INTEGER not null
	, stokKod			BLOB not null default ''
	, detGuid			BLOB not null default ''

	, miktar			REAL not null default 0
	, kdvliFiyat		REAL not null default 0
	, kdvliBedel		REAL not null default 0
	, kdvOrani			INTEGER not null default 0

	, ikrammi			BLOB not null default ''
	, iptalmi			BLOB not null default ''
	, iptalAciklama		BLOB not null default ''
	, ikrammi			BLOB not null default ''
	, sipZamani			REAL
	, sipDurum			BLOB not null default ''
	, mutfakTeslimZamani	REAL
	, teslimZamani		REAL
	, ekNotIptalmi		BLOB not null default ''

	, FOREIGN KEY (fisID) REFERENCES fis_Restoran (kayitID)
	);
create INDEX idxhar_RestoranDetay2Guid on har_RestoranDetay (fisID, seq;

create table har_RestoranDetOzellik
	( kayitID			INTEGER not null primary key autoincrement
	, hareketID			INTEGER not null
	, ozellikID			INTEGER not null
	, ozGuid			BLOB not null
	, iptalmi			BLOB not null default ''
	, ozMiktar			REAL not null default 0
	, kdvliFiyat		REAL not null default 0
	, kdvliBedel		REAL not null default 0
	, FOREIGN KEY (hareketID) REFERENCES har_RestoranDetay (kayitID)
	, FOREIGN KEY (ozellikID) REFERENCES mst_StokOzellik (uzakID)
	);

