(function() {
	window.CETDokumcu_Stream = class extends window.CETDokumcu {
		async writeToDevice(e) {
			await super.writeToDevice(e);

			let handler = e.dokumIslemi;
			if ($.isFunction(handler)) {
				let result = await handler.call(this, e);
				if (result)
					return result;
			}

			const fis = e.fis;
			if (fis) {
				let result = await fis.dokumcuWriteToDevice(e);
				if (result)
					return result;
			}

			return false;
		}
	}
})()


/*
let ekranami = false, dokumIslemi = e => {
	const srm = e.stream, lines = [
		'<IMAGE>http://cloud.vioyazilim.com.tr:81/files/vio/Kurulus-Ek/gib.bmp<BR>'
	]; for (let line of lines) { srm.write(`${line || ' '}\n`) }
};
await new CETDokumcu_Stream().yazdir({ ekranami, dokumIslemi })

let ekranami = false, dokumIslemi = e => {
	const srm = e.stream, lines = ['ABC', '! U', '! U1 ! 0 200 200 500 1', '! U1 PCX 0 30 !<GIB.PCX', ...new Array(2).fill(' ')];
	for (let line of lines) { srm.write(`${line || ' '}\n`) }
};
await new CETDokumcu_Stream().yazdir({ ekranami, dokumIslemi })

let ekranami = false, dokumIslemi = e => {
	const srm = e.stream, lines = [
		'! U1 setvar "device.languages" "zpl"',
		'^XA',
		'^FO10,10',
		'^XGGIB.PCX,1,1',
		'^XZ',
		'! U1 setvar "device.languages" "line_print"'
	];
	for (let line of lines) { srm.write(`${line || ' '}\n`) }
};
await new CETDokumcu_Stream().yazdir({ ekranami, dokumIslemi })

// ^FO150,%d,^IME:SIGNATURE.PNG^FS
*/
