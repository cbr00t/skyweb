<?php
	header('Access-Control-Allow-Methods: GET, POST');
	header('Access-Control-Allow-Headers: Accept, Authorization, Content-Type, content-type, If-Match, If-Modified-Since, If-None-Match, If-Unmodified-Since, Accept-Encoding');
	header('Access-Control-Allow-Origin: *');
	header('cache-control: private, max-age=0');
	header('expires: -1');
	header('Content-Type: application/json; charset=utf-8');
	
	$a = $_GET['a'];
	if ($a != 1) {
		header("HTTP/1.1 401 invalidArgument");
		exit('{ "isError": true, "rc": "invalidArgument", "errorText": "<u><b>a</b></u> parametresinin değeri <b>1</b> gelmeli idi" }');
	}
	
	header("HTTP/1.1 200 OK");
	echo('{ "isError": false, "result": "webservis sonucu" }');
?>
