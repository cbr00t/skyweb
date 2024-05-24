<?php
	header('Content-Type: application/json');
	require_once('config.php');
?>
{
  "manifest_version": 2,
  "short_name": "Sky Web",
  "name": "Sky Web",
  "version": "<?=$siteVersion?>",
  "offline_enabled": true,
  "start_url": "./_kernel/",
  "scope": "/skyweb",
  "background_color": "#3367D6",
  "display": "standalone",
  "theme_color": "#3367D6",
  "bluetooth": {
    "socket": true,
    "uuids": ["00001101-0000-1000-8000-00805f9b34fb"]
  },
  "icons": [
	  {
		"src": "images/firmalogo.png",
		"type": "image/png",
		"sizes": "144x144"
	  },
	  {
		"src": "images/firmalogo.png",
		"type": "image/png",
		"sizes": "192x192"
	  },
	  {
		"src": "images/firmalogo.png",
		"type": "image/png",
		"sizes": "512x512"
	  }
  ]
}
