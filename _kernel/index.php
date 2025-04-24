<?php require_once('config.php') ?>
<!DOCTYPE html>
<html lang="tr">

<head>
	<meta charset="utf-8">
	<title>Sky Web</title>
	<meta name="description" content="Sky Web"/>
	<meta name="viewport" content="width=device-width, initial-scale=.97, minimum-scale=.97, maximum-scale=.97, user-scalable=no"/>
	<link rel="manifest" href="manifest.php?<?=$siteVersion?>"/>

	<script async="false" src="../../vio/vioweb/lib/ieKontrol.js?<?=$siteVersion?>"></script>
	
	<link rel="stylesheet" href="../../vio/vioweb/lib_external/bootstrap/css/bootstrap.css"/>
	<link rel="stylesheet" href="../../vio/vioweb/lib_external/bootstrap/css/bootstrap-theme.min.css"/>

	<link rel="stylesheet" href="../../vio/vioweb/lib_external/jqx/css/jquery-ui.css"/>
	<!--<link rel="stylesheet" href="../../vio/vioweb/lib_external/jqx/css/jqx.bootstrap.css"/>-->
	<link rel="stylesheet" href="../../vio/vioweb/lib_external/jqx/css/jqx.base.css"/>
	<link rel="stylesheet" href="../../vio/vioweb/lib_external/jqx/css/jqx.metro.css"/>
	<script type="module" src="../../vio/vioweb/lib_external/etc/require.js"></script>
	<script src="../../vio/vioweb/lib/core_extensions.js?<?=$siteVersion?>"></script>
    <script src="../../vio/vioweb/lib_external/jqx/jquery-3.3.1.min.js"></script>
	<script src="../../vio/vioweb/lib_external/jqx/jquery-ui.js"></script>
	<!--<script src="../../vio/vioweb/lib_external/jqx/jquery.ajax-cross-origin.min.js"></script>-->
	<script src="../../vio/vioweb/lib_external/jqx/jqx-all.js"></script>
	<script src="../lib_external/base64.js"></script>
	<script src="../lib_external/webSQL/sql-wasm.js"></script>
	<!--<script src="../lib_external/webSQL/sql-asm-memory-growth.js"></script>-->
	<!--<script src="../lib_external/webSQL/sql-asm-debug.js"></script>-->
	<!--<script src="../lib_external/webSQL/alasql.js"></script>-->

	<script src="../lib_external/html5-qrcode.min.js"></script>
	<link rel="stylesheet" href="../lib_external/hightlight/xcode.min.css"/>
	<script src="../lib_external/hightlight/hightlight.min.js"></script>
	
	<!--<link rel="stylesheet" href="../lib_external/htmlelements/styles/smart.default.css"/>-->
	<!--<script src="../lib_external/htmlelements/smart.elements.js"></script>-->
	<!--<script src="../lib_external/htmlelements/smart.ganttchart.js"></script>
	<script src="../lib_external/htmlelements/smart.checkbox.js"></script>-->

	<!--<script src="../lib_external/sql.min.js"></script>-->
	<!--<link rel="stylesheet" href="../lib_external/apexcharts/apexcharts.css"/>
	<script src="../lib_external/apexcharts/apexcharts.min.js"></script>
	<script src="../lib_external/apexcharts/locales/tr.json"></script>-->
	
	<!--<script src="../lib_external/qrcode.js"></script>
	<script src="../lib_external/jsQR.js"></script>
	<script src="../lib_external/webcodecamjs/js/qrcodelib.js"></script>
	<script src="../lib_external/webcodecamjs/js/webcodecamjquery.js"></script>-->
	
	<script src="../../vio/vioweb/lib_external/etc/string.js"></script>
	<!--<script src="../../vio/vioweb/lib_external/etc/date.js"></script>-->
	<script src="../../vio/vioweb/lib_external/etc/md5.min.js"></script>
	<script src="../../vio/vioweb/lib/localization.js?<?=$siteVersion?>"></script>
	<script src="../../vio/vioweb/lib/globalize.culture.tr-TR.js?<?=$siteVersion?>"></script>
	<script src="../../vio/vioweb/lib/utils_newtag.js?<?=$siteVersion?>"></script>
	<script src="../../vio/vioweb/lib/utils.js?<?=$siteVersion?>"></script>
	<script src="../../vio/vioweb/lib/api.js?<?=$siteVersion?>"></script>

	<script src="../../vio/vioweb/lib/classes/CObject.js?<?=$siteVersion?>"></script>
	<script src="../../vio/vioweb/lib/classes/CId.js?<?=$siteVersion?>"></script>
	<script src="../../vio/vioweb/lib/classes/CIdVeAciklama.js?<?=$siteVersion?>"></script>

	<script src="lib/libPatch.js?<?=$siteVersion?>"></script>
	<script src="lib/utils.js?<?=$siteVersion?>"></script>
	<script src="classes/etc/cKodYapi.js?<?=$siteVersion?>"></script>
	<script src="classes/etc/cKodVeAdi.js?<?=$siteVersion?>"></script>
	<script src="classes/etc/cIdYapi.js?<?=$siteVersion?>"></script>
	<script src="classes/etc/cIdVeAdi.js?<?=$siteVersion?>"></script>
	<script src="classes/etc/cBasiSonu.js?<?=$siteVersion?>"></script>
	<script src="classes/etc/cPoint.js?<?=$siteVersion?>"></script>
	<script src="classes/etc/loginArgs.js?<?=$siteVersion?>"></script>
	<script src="classes/etc/sessionInfo.js?<?=$siteVersion?>"></script>
	<script src="classes/etc/cCache.js?<?=$siteVersion?>"></script>
	<script src="classes/etc/cCacheResponse.js?<?=$siteVersion?>"></script>
	<script src="classes/etc/cPromise.js?<?=$siteVersion?>"></script>
	<script src="classes/etc/qrGenerator.js?<?=$siteVersion?>"></script>
	<script src="lib/config.js?<?=$siteVersion?>"></script>
	<script src="lib/dbMgr_webSQL.js?<?=$siteVersion?>"></script>
	<script src="lib/dbMgr_sqlJS.js?<?=$siteVersion?>"></script>
	<script src="lib/dbMgr_alaSQL.js?<?=$siteVersion?>"></script>
	<script src="lib/kernel.js?<?=$siteVersion?>"></script>

	<link rel="stylesheet" href="index.css?<?=$siteVersion?>"/>
	<script src="appBase/extensions/extension.js?<?=$siteVersion?>"></script>
	<script src="appBase/extensions/partExtension.js?<?=$siteVersion?>"></script>
	<script src="appBase/extensions/appExtension.js?<?=$siteVersion?>"></script>
	<script src="appBase/ortak/layoutBase.js?<?=$siteVersion?>"></script>
	<script src="appBase/ortak/appPartBase.js?<?=$siteVersion?>"></script>
	<link rel="stylesheet" href="appBase/ortak/app.css?<?=$siteVersion?>"/>
	<script src="appBase/ortak/app.js?<?=$siteVersion?>"></script>
	<script src="appBase/ortak/prog.js?<?=$siteVersion?>"></script>
	<script src="appBase/ortak/module.js?<?=$siteVersion?>"></script>
	<script src="appBase/ortak/part.js?<?=$siteVersion?>"></script>

	<script src="classes/stmYapi/mqDbSQLOrtak.js?<?=$siteVersion?>"></script>
	<script src="classes/stmYapi/mqDbClause.js?<?=$siteVersion?>"></script>
	<script src="classes/stmYapi/mqDbCommand.js?<?=$siteVersion?>"></script>
	<script src="classes/stmYapi/mqDbIliskiliYapiOrtak.js?<?=$siteVersion?>"></script>
	<script src="classes/stmYapi/mqDbSent.js?<?=$siteVersion?>"></script>
	<script src="classes/stmYapi/mqDbStm.js?<?=$siteVersion?>"></script>
	<script src="classes/mf/mfYapi.js?<?=$siteVersion?>"></script>
	<script src="classes/mf/mqTekil.js?<?=$siteVersion?>"></script>
	<script src="classes/mf/mqCogul.js?<?=$siteVersion?>"></script>
	<script src="classes/mf/mqDetay.js?<?=$siteVersion?>"></script>
	<script src="classes/mf/mqDetayli.js?<?=$siteVersion?>"></script>
	<script src="classes/mf/mqIcmal.js?<?=$siteVersion?>"></script>

	<link rel="stylesheet" href="appBase/part/knobProgressPart.css?<?=$siteVersion?>"/>
	<script src="appBase/part/knobProgressPart.js?<?=$siteVersion?>"></script>
	<link rel="stylesheet" href="appBase/part/appIndicatorPart.css?<?=$siteVersion?>"/>
	<script src="appBase/part/appIndicatorPart.js?<?=$siteVersion?>"></script>
	<script src="appBase/part/ortakIslemTuslariPart.js?<?=$siteVersion?>"></script>
	<script src="appBase/part/subPart.js?<?=$siteVersion?>"></script>
	<script src="appBase/part/innerPart.js?<?=$siteVersion?>"></script>

	<script src="appBase/part/tarihPart.js?<?=$siteVersion?>"></script>
	<script src="appBase/part/dataTablePart.js?<?=$siteVersion?>"></script>
	
	<link rel="stylesheet" href="../app/part/login/loginUI.css?<?=$siteVersion?>"/>
	<script src="../app/part/login/loginExtension.js?<?=$siteVersion?>"></script>
	<script src="../app/part/login/loginUIBase.js?<?=$siteVersion?>"></script>
	<script src="../app/part/login/loginUI.js?<?=$siteVersion?>"></script>
	
	<link rel="stylesheet" href="../app/module/smartGantt/smartGantt_helper.css?<?=$siteVersion?>"/>
	<link rel="stylesheet" href="../app/module/smartGantt/smartGanttApp.css?<?=$siteVersion?>"/>
	<script src="../app/module/smartGantt/smartGanttApp.js?<?=$siteVersion?>"></script>

	<!--<script src="../app/prog/b2x/classes/b2x_kodYapi.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/b2x/classes/b2x_kodVeAdi.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/b2x/classes/b2x_grup.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/b2x/classes/b2x_urunKategoriOrtak.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/b2x/classes/b2x_kategori.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/b2x/classes/b2x_urun.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/b2x/classes/b2x_item.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/b2x/classes/b2x_urunBilgileri.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/b2x/classes/b2x_sepetIslemleri.js?<?=$siteVersion?>"></script>
	<link rel="stylesheet" href="../app/prog/b2x/b2xApp.css?<?=$siteVersion?>"/>
	<script src="../app/prog/b2x/b2xApp.js?<?=$siteVersion?>"></script>
	<link rel="stylesheet" href="../app/prog/b2x/part/b2x_test.css?<?=$siteVersion?>"/>
	<script src="../app/prog/b2x/part/b2x_testPart.js?<?=$siteVersion?>"></script>

	<link rel="stylesheet" href="../app/prog/b2c/css/b2cApp.css?<?=$siteVersion?>"/>
	<link rel="stylesheet" href="../app/prog/b2c/css/b2cApp-max-600px.css?<?=$siteVersion?>"/>
	<link rel="stylesheet" href="../app/prog/b2c/css/b2cApp-max-900px.css?<?=$siteVersion?>"/>
	<link rel="stylesheet" href="../app/prog/b2c/css/b2cApp-max-1024px.css?<?=$siteVersion?>"/>
	<link rel="stylesheet" href="../app/prog/b2c/css/b2cApp-max-1300px.css?<?=$siteVersion?>"/>
	<script src="../app/prog/b2c/b2cApp.js?<?=$siteVersion?>"></script>
	<link rel="stylesheet" href="../app/prog/b2c/part/b2c_loginUI.css?<?=$siteVersion?>"/>
	<script src="../app/prog/b2c/part/b2c_loginUI.js?<?=$siteVersion?>"></script>
	<link rel="stylesheet" href="../app/prog/b2c/part/b2c_newUserUI.css?<?=$siteVersion?>"/>
	<script src="../app/prog/b2c/part/b2c_newUserUI.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/b2c/part/b2c_urunPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/b2c/part/b2c_sepetIcerikPart.js?<?=$siteVersion?>"></script>-->
	
	<script src="../app/prog/cetApp/classes/etc/cetFisTipi.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/ekOzellik/cetEkOzellik.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/ekOzellik/cetEkOzellikler.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/barkod/device/cetBarkodDevice.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/barkod/kural/cetBarkodKurali.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/barkod/kural/cetBarkodKurali_ayrisim.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/barkod/kural/cetBarkodKurali_ayrisimAyiracli.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/barkod/parser/cetBarkodParser.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/barkod/parser/cetBarkodParser_referans.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/barkod/parser/cetBarkodParser_kuralli.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/barkod/parser/cetBarkodParser_tarti.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/barkod/parser/cetBarkodParser_ayrisim.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/barkod/parser/cetBarkodParser_karmaPalet.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/satisKosul/cetSatisKosul.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/satisKosul/cetSatisKosulKapsam.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/satisKosul/cetSatisKosul_ekSiniflar.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/promosyon/cetPromosyon.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/promosyon/cetPromosyonKapsam.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/promosyon/cetPromosyon_ekSiniflar.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/dokum/matbuuTanim/cetMatbuuFormYapilari.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/dokum/matbuuTanim/cetMatbuuFormBilgi.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/dokum/matbuuTanim/cetMatbuuForm.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/dokum/matbuuTanim/cetMatbuuSaha.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/dokum/dokumDevice/cetDokumDevice.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/dokum/dokumcu/cetDokumSayfaVeSatir.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/dokum/dokumcu/cetDokumcu.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/dokum/dokumcu/cetDokumcu_stream.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/dokum/dokumcu/cetDokumcu_matbuu.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/dokum/dokumcu/cetDokumVeri.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/rapor/cetRaporBase.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/rapor/cetRapor.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/mf/cetFis.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/mf/cetStokTicariDetay.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/mf/cetTicariIcmal.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/mf/cetStokTicariFis.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/mf/cetStokDetay.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/mf/cetTicariDetay.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/mf/cetStokFis.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/mf/cetForkliftFis.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/mf/cetBekleyenSayimDetay.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/mf/cetBekleyenSayimFis.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/mf/cetTicariFis.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/mf/cetTahsilatDetay.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/mf/cetTahsilatFis.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/mf/cetUgramaFis.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/mf/cetBekleyenUgramaDetay.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/mf/cetBekleyenUgramaFis.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/mf/cetPromosyonDetay.js?<?=$siteVersion?>"></script>

	<link rel="stylesheet" href="../app/prog/cetApp/cetApp.css?<?=$siteVersion?>"/>
	<script src="../app/prog/cetApp/cetApp.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/cetSubPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetExpandableIslemTuslariPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetMstComboBoxPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetPartOrtakIslemTuslariPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/extension/cetLoginExtension.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetListeOrtakPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/mf/cetParam.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/classes/mf/cetNumarator.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetDokumOnizlemePart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetParamPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetNumaratorListePart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetKAListePart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetSonStoktanSecPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetStokListePart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetCariListePart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetBekleyenSiparislerListePart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetFisGirisIslemSecimPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetVeriYonetimiPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetKMGirisPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetCariTanimPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetFiyatGorPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetTahsilatGirisPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetUgramaGirisPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetFisListePart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetRotaListesiPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetFisOzetBilgiPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetRBKGirisPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetFisGirisPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetForkliftFisGirisPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetBekleyenXFisGirisPart.js?<?=$siteVersion?>"></script>	
	<script src="../app/prog/cetApp/part/cetBekleyenSayimFisGirisPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetBekleyenUgramaFisGirisPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetFisGirisSonStoktanSecimPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetPromoUrunSecimPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetRaporlarPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetRaporGridliPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/part/cetMusteriDurumuPart.js?<?=$siteVersion?>"></script>
	
	<link rel="stylesheet" href="../app/prog/cetApp/cetSicakSogukMagazaOrtakApp.css?<?=$siteVersion?>"/>
	<script src="../app/prog/cetApp/cetSicakSogukMagazaOrtakApp.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/cetSDMApp.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/cetSicakSatisApp.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/cetSogukSiparisApp.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/cetApp/cetMagazaApp.js?<?=$siteVersion?>"></script>

	<link rel="stylesheet" href="../app/module/panelRaporlamaApp/panelRaporlamaApp.css?<?=$siteVersion?>"/>
	<script src="../app/module/panelRaporlamaApp/panelRaporlamaApp.js?<?=$siteVersion?>"></script>
	<script src="../app/module/panelRaporlamaApp/part/panelRaporlamaTestPart.js?<?=$siteVersion?>"></script>

	<link rel="stylesheet" href="../app/prog/sosyalDurumApp/sosyalDurumApp.css?<?=$siteVersion?>"/>
	<script src="../app/prog/sosyalDurumApp/sosyalDurumApp.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/sosyalDurumApp/part/sosyalDurumPartBase.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/sosyalDurumApp/part/sosyalDurumGirisPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/sosyalDurumApp/part/sosyalDurumXYuklePart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/sosyalDurumApp/part/sosyalDurumHizmetDokumundenYuklePart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/sosyalDurumApp/part/sosyalDurumEDevlettenYuklePart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/sosyalDurumApp/part/sosyalDurumDegerlendirmePart.js?<?=$siteVersion?>"></script>

	<link rel="stylesheet" href="../app/prog/skyCafeApp/skyCafeApp.css?<?=$siteVersion?>"/>
	<script src="../app/prog/skyCafeApp/extension/skyCafeLoginExtension.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/skyCafeApp.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/skyCafeRestApp.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/skyCafePratikApp.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/classes/diger/skyCafeParam.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/classes/diger/skyCafeMasaTip.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/classes/mf/skyCafeLog.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/classes/mf/skyCafeMasa.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/classes/mf/skyCafeKategoriDetay.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/classes/mf/skyCafeKategori.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/classes/mf/skyCafeUstKategori.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/classes/mf/skyCafeUrunGrup.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/classes/mf/skyCafeUrun.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/classes/mf/skyCafeUrunOzellik.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/classes/mf/skyCafeTahsilSekli.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/classes/mf/skyCafeFis.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/classes/mf/skyCafeDetay.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/classes/barkod/kural/skyCafeBarkodKurali.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/classes/barkod/kural/skyCafeBarkodKurali_ayrisimAyiracli.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/classes/barkod/parser/skyCafeBarkodParser.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/classes/barkod/parser/skyCafeBarkodParser_kuralli.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/classes/barkod/parser/skyCafeBarkodParser_referans.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/classes/barkod/parser/skyCafeBarkodParser_tarti.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/classes/barkod/parser/skyCafeBarkodParser_ayrisim.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/part/skyCafePartBase.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/part/skyCafeNavPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/part/skyCafeWindowPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/part/skyCafeKlavyePart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/part/skyCafeTextInputPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/part/skyCafeItemListPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/part/skyCafeSatisGridPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/part/skyCafeMasalarPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/part/skyCafeSatisEkraniPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/part/skyCafeDetayDuzenlePart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/part/skyCafeRezervasyonEkraniPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/part/skyCafeTahsilatEkraniPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/part/skyCafeMasaTransferPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/part/skyCafeKasiyerIslemleriPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyCafeApp/part/skyCafeZHesaplasmaPart.js?<?=$siteVersion?>"></script>
	
	<script src="../app/prog/skyMESApp/skyMESApp.js?<?=$siteVersion?>"></script>
	<link rel="stylesheet" href="../app/prog/skyMESApp/skyMESApp-base.css?<?=$siteVersion?>"/>
	<link rel="stylesheet" href="../app/prog/skyMESApp/skyMESApp.css?<?=$siteVersion?>"/>
	<link rel="stylesheet" href="../app/prog/skyMESApp/skyMakineDurumApp.css?<?=$siteVersion?>"/>
	<script src="../app/prog/skyMESApp/skyMakineDurumApp.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyMESApp/part/skyMESKlavyePart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyMESApp/part/skyMESWindowPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyMESApp/part/skyMESTextInputPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyMESApp/part/skyMakineDurum_duraksamaNedeniSecPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyMESApp/part/skyMakineDurum_personelPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyMESApp/part/skyMakineDurum_miktarGirisPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyMESApp/part/skyMakineDurum_gorevSecPart.js?<?=$siteVersion?>"></script>
	
	<link rel="stylesheet" href="../app/prog/skyMESApp/skyHatIzlemeApp.css?<?=$siteVersion?>"/>
	<script src="../app/prog/skyMESApp/skyHatIzlemeApp.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyMESApp/part/skyHatIzleme_siradakiIslerPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyMESApp/part/skyHatIzleme_bekleyenIslerPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyMESApp/part/skyHatIzleme_operSecPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyMESApp/part/skyHatIzleme_bekleyenIsEmirleriPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyMESApp/part/skyHatIzleme_sureSayiDuzenlePart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyMESApp/part/skyHatIzleme_zamanEtuduPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyMESApp/part/skyMES_personelSecPart.js?<?=$siteVersion?>"></script>
	
	<link rel="stylesheet" href="../app/prog/skyConfigApp/skyConfigApp.css?<?=$siteVersion?>"/>
	<script src="../app/prog/skyConfigApp/skyConfigApp.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyConfigApp/classes/skyConfigYetki.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyConfigApp/classes/skyConfigParam.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyConfigApp/part/ortak/skyConfigWindowPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyConfigApp/part/ortak/skyConfigTextInputPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyConfigApp/part/ortak/skyConfigInnerPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyConfigApp/part/ortak/skyConfigInnerPartWithTabs.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyConfigApp/part/parts/skyConfigParamPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyConfigApp/extension/skyConfigLoginExtension.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyConfigApp/part/parts/skyConfigSifreDegistirPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyConfigApp/part/parts/skyConfigBirKismiListePart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyConfigApp/part/parts/skyConfigVTSecPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyConfigApp/part/parts/skyConfigServisDuzenlePart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyConfigApp/part/parts/skyConfigUserDuzenlePart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyConfigApp/part/parts/skyConfigVioGlobalIniDuzenlePart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyConfigApp/part/parts/skyConfigSkyBulutYedeklemeUserListPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyConfigApp/part/parts/skyConfigSkyBulutYedeklemeVeriYonetimiPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyConfigApp/part/parts/skyConfigDurumPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyConfigApp/part/parts/skyConfigConfPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyConfigApp/part/parts/skyConfigUsersPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyConfigApp/part/parts/skyConfigToolsPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyConfigApp/part/parts/skyConfigGelismisPart.js?<?=$siteVersion?>"></script>
	
	<link rel="stylesheet" href="../app/prog/skyKonumTakipApp/skyKonumTakipApp.css?<?=$siteVersion?>"/>
	<script src="../app/prog/skyKonumTakipApp/skyKonumTakipApp.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyKonumTakipApp/part/ortak/skyKonumTakipWindowPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyKonumTakipApp/part/ortak/skyKonumTakipTextInputPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyKonumTakipApp/part/ortak/skyKonumTakipInnerPart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyKonumTakipApp/part/parts/skyKonumTakip_birKismiListePart.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/skyKonumTakipApp/part/parts/skyKonumTakip_plasUserSecPart.js?<?=$siteVersion?>"></script>

	<link rel="stylesheet" href="../app/prog/skyTicMenuApp/skyTicMenuApp.css?<?=$siteVersion?>"/>
	<script src="../app/prog/skyTicMenuApp/skyTicMenuApp.js?<?=$siteVersion?>"></script>
	
	<link rel="stylesheet" href="../app/prog/ahmet/workspace01/workspace01.css?<?=$siteVersion?>"/>
	<script src="../app/prog/ahmet/workspace01/workspace01_base.js?<?=$siteVersion?>"></script>
	<script src="../app/prog/ahmet/workspace01/workspace01.js?<?=$siteVersion?>"></script>
	

	<!--<link rel="stylesheet" href="etc/ahmet.css?<?=$siteVersion?>"/>
	<script src="etc/ahmet.js?<?=$siteVersion?>"></script>-->

	
	<script>
		var siteVersion, sky, wsHostName, wsPort, theme;
		siteVersion = "<?=$siteVersion?>";
		$(() => {
			sky = new Kernel();
			sky.startup();
		});
	</script>
</head>

<body>
	<main id="contentParent">
		<div id="header" valign="middle" class="flex-row">
			<div id="appTitle">
				<span class="veri flex-row"/>
			</div>
			
			<div id="siteVersion">
				<!--<span class="etiket">v</span>-->
				<span class="veri"></span>
			</div>
		</div>

		<div id="info" class="debug jqx-hidden">
			<h2>boot layout loaded</h2>

			<div id="appName">Active app: <b><span id="_appName"></span></b></div>
		</div>

		<div id="content"></div>
	</main>

	<template id="devConsole" class="part">
		<div class="devConsole part">
			<textarea id="cmd" class="jqx-hidden"></textarea>
			<div id="cmd-preview"></div>
			<div id="result"></div>
		</div>
	</template>
</body>

</html>
