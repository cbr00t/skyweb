<?php
	header('Content-Type: text/javascript');
	require_once('config.php');
?>
const APP_NAME = 'SkyWeb';
const VERSION = '<?=$siteVersion?>';
const CACHE_NAME = `cache-${APP_NAME}-${VERSION}`;
const StreamHeaders = { 'text/event-stream': true, 'application/x-ndjson': true };

const staticAssets = [
	'./',
	'../',
	'../_kernel/',
	'../_kernel/index.html',
	'../_kernel/index.css',
	'../_kernel/empty.json',
	'../_kernel/_kernel/',
	'../_kernel/media/',
	
	'../_kernel/media/Barcode-scanner-beep-sound.mp3',
	'../_kernel/media/Beep-tone-sound-effect.mp3',
	
	'../_kernel/images/',
	'../_kernel/fonts/',
	'../_kernel/classes/',
	'../_kernel/lib/',
	'../_kernel/appBase/',
	'../_kernel/appBase/ortak/',
	'../_kernel/appBase/extensions/',
	'../_kernel/appBase/part/',
	
	'../app/',
	'../app/part/',
	'../app/module/',
	'../data/',
	'../_notes/',

	'../app/module/smartGantt/',

	'../app/prog/b2x/',
	'../app/prog/b2x/fonts/',
	'../app/prog/b2x/part/',
	'../app/prog/b2x/classes/',
	'../app/prog/b2x/data/',

	'../app/prog/b2c/',
	'../app/prog/b2c/part/',
	'../app/prog/b2c/css/',
	'../app/prog/b2c/images/',
	'../app/prog/b2c/images/icon/',
	'../app/prog/b2c/images/slider/',
	'../app/prog/b2c/images/social/',

	'../app/prog/cetApp/',
	'../app/prog/cetApp/classes/',
	'../app/prog/cetApp/classes/mf/',
	'../app/prog/cetApp/classes/ekOzellik/',
	'../app/prog/cetApp/classes/rapor/',
	'../app/prog/cetApp/classes/dokum/',
	'../app/prog/cetApp/classes/dokum/matbuuTanim/',
	'../app/prog/cetApp/classes/dokum/dokumcu/',
	'../app/prog/cetApp/classes/dokum/dokumDevice/',
	'../app/prog/cetApp/classes/satisKosul/',
	'../app/prog/cetApp/classes/barkod/',
	'../app/prog/cetApp/classes/barkod/kural/',
	'../app/prog/cetApp/classes/barkod/parser/',
	'../app/prog/cetApp/classes/barkod/device/',
	'../app/prog/cetApp/classes/etc/',
	'../app/prog/cetApp/extension/',
	'../app/prog/cetApp/part/',
	'../app/prog/cetApp/data/',

	'../app/prog/sosyalDurumApp/',
	'../app/prog/sosyalDurumApp/part/',

	'../app/prog/skyCafeApp/',
	'../app/prog/skyCafeApp/part/',
	'../app/prog/skyCafeApp/classes/',

	/*'../b2b/',
	'../b2c/',*/
	'../etSicakSatis/',
	'../etSogukSiparis/',
	'../etMagaza/',
	'../etSDM/',
	'../sosyalDurum/',
	'../skyCafeRest/',
	'../skyCafePratik/',
	'../skyHatIzleme/',
	'../skyMakineDurum/',

	'../lib_external/instascan/',
	'../lib_external/hightlight',
	'../lib_external/qrcode.js',
	'../lib_external/jsQR.js',
	'../lib_external/stomp.js',
	'../lib_external/print.min.js',

	'../../vio/vioweb/',
	'../../vio/vioweb/images/',
	'../../vio/vioweb/lib/',
	'../../vio/vioweb/lib/classes/',
	'../../vio/vioweb/fonts/',
	'../../vio/vioweb/data/',
	'../../vio/vioweb/lib_external/',
	'../../vio/vioweb/lib_external/etc/',
	'../../vio/vioweb/lib_external/jqx/',
	'../../vio/vioweb/lib_external/jqx/globalization/',
	'../../vio/vioweb/lib_external/jqx/styles/',
	'../../vio/vioweb/lib_external/jqx/css/',
	'../../vio/vioweb/lib_external/jqx/css/images/',
	'../../vio/vioweb/lib_external/bootstrap/',
	'../../vio/vioweb/lib_external/bootstrap/css/',
	'../../vio/vioweb/lib_external/bootstrap/js/'
];

self.addEventListener('install', async e => {
	const cache = await caches.open(CACHE_NAME); 
	for (const url of staticAssets) { try { await cache.add(url) } catch (ex) { } }
	self.skipWaiting()
});

self.addEventListener('activate', async e => {
	self.clients.claim();
	/*e.waitUntil(self.clients.claim());*/
});

self.addEventListener('fetch', e => {
	const req = e.request;
	//if (!req.referrer || req.url.startsWith(new URL(e.referrer).origin))
	e.respondWith(networkFirst(req));
	
	/*if (/.*(json)$/.test(req.url) || !req.url.startsWith(location.origin) ||
		/(layout)$/.test(req.url)) {
		e.respondWith(networkFirst(req));
	} else {
		e.respondWith(cacheFirst(req));
	}*/
});

self.addEventListener('push', e => {
	console.warn('sw push notification: ' + e.data.text());
});


async function networkFirst(req) {
	const cache = await caches.open(CACHE_NAME);
	try { 
		const fresh = await fetch(req);
		if (req.method == 'GET' && !StreamHeaders[req.headers?.get('Content-Type')]) {
			{ try { await cache.put(req, await resp.clone()) } catch (ex) { } }
			try { await cache.put(req, await fresh.clone()) }
			catch (ex) { }
		}

		return fresh;
	} catch (ex) { 
		const cachedResponse = await cache.match(req);
		if (!cachedResponse)
			throw ex;
		return cachedResponse;
	}
}

async function cacheFirst(req) {
	const cache = await caches.open(CACHE_NAME);
	const cachedResponse = await cache.match(req);
	
	return cachedResponse || await networkFirst(req);
}
