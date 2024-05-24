
CREATE TABLE IF NOT EXISTS mst_Login (
	rowid						INTEGER NOT NULL AUTOINCREMENT,
	loginTipi					TEXT NOT NULL,
	user						TEXT NOT NULL,
	pass						TEXT NOT NULL DEFAULT '',
	userText					TEXT NOT NULL DEFAULT '',
	ozelTipKod					TEXT NOT NULL DEFAULT '',
	ozelTipAdi					TEXT NOT NULL DEFAULT '',
	dbName						TEXT NOT NULL DEFAULT '',
	firmaKisaUnvan				TEXT NOT NULL DEFAULT '',
	digerSubeleriGorebilirmi	INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY (loginTipi, user)
);
