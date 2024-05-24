(function() {
	window.SkyKonumTakipApp = class extends window.Prog {
		static get dateLibDesteklenirmi() { return false }
		static get appName() { return 'skyKonumTakipApp' }
		get appText() { return `Sky Konum Takip` }
		get defaultLayoutName() { return this.appName }
		get gAPIKey() { return 'AIzaSyDCSizy9iLKCOaz77D_ja66gdjb3UeRAMs' }


		constructor(e) {
			super(e);
			e = e || {};

			const extLogin = this.extensions.login;
			extLogin.options.isLoginRequired = false;

			this.plasUserSecim = {};
		}

		loadLibs(e) {
			super.loadLibs(e);

			let callback = 'sky.app.googleInitCallback';
			$(`<script async defer src="https://maps.googleapis.com/maps/api/js?key=${this.gAPIKey}&callback=${callback}&libraries=drawing,places" type="text/javascript"></script>`)
				.appendTo('body');

		}

		updateWSUrlBase(e) {
			const port = $.isEmptyObject(window.wsPorts) ? SkyConfigParam.DefaultWSPort : undefined;
			return super.updateWSUrlBase({ port: port, path: `ws/elterm/` });
		}

		async ilkIslemler(e) {
			this.destroyWindows();
			if (!this.noFullScreenFlag) {
				try { requestFullScreen() }
				catch (ex) { }
			}

			const sessionInfo = sky.config.sessionInfo || {};
			if (sessionInfo.user)
				await this.extensions.login.loginIslemi(e);
			
			await super.ilkIslemler(e);
		}

		async run(e) {
			e = e || {};
			
			await super.run(e);
		}

		async afterRun(e) {
			e = e || {};
			await super.afterRun(e);

			let {activePart} = this;
			if (!activePart || activePart == this)
				await this.destroyWindows();
			
			if (!this.noFullScreenFlag) {
				try { requestFullScreen() }
				catch (ex) { }
			}

			const sessionInfo = sky.config.sessionInfo || {};
			const {user, userDesc} = sessionInfo;
			const {btnUserInfo} = this;
			if (sessionInfo.user) {
				btnUserInfo.html(`<b>${user}</b>` + (userDesc ? `<span>-</span><span>${userDesc}</span>` : ''));
				btnUserInfo.removeClass('jqx-hidden basic-hidden');
			}
			/*else
				btnUserInfo.addClass('jqx-hidden');*/

			hideProgress();
			((window.savedProcs || {}).hideProgress || hideProgress)();
			const timeouts = [500, 1000, 2000];
			for (const i in timeouts) {
				setTimeout(() => {
					hideProgress();
					((window.savedProcs || {}).hideProgress || hideProgress)();
				}, timeouts[i])
			}

			this.tazele(e);
		}

		async postInitLayout(e) {
			e = e || {};
			await super.postInitLayout(e);

			const layout = e.layout || this.layout;
			this.templatesOrtak = layout;
			
			const btnTazele = layout.find(`#btnTazele`).jqxButton({ theme: theme });
			btnTazele.on('click', evt =>
				this.tazele({ event: evt }));
			const btnToggleFullScreen = layout.find(`#btnToggleFullScreen`).jqxButton({ theme: theme });
			btnToggleFullScreen.on('click', evt =>
				this.toggleFullScreen({ event: evt }));

			const userInfo_popup = this.userInfo_popup = layout.find(`#userInfo_popup`).jqxMenu({
				theme: theme, width: 300,
				mode: 'popup', autoOpenPopup: false
			});
			userInfo_popup.on('itemclick', evt => {
				const {id} = evt.target;
				switch (id) {
					case 'logout':
						return this.logoutIstendi({ event: evt });
				}
			});
			const btnUserInfo = this.btnUserInfo = layout.find(`#userInfo`).jqxButton({ theme: theme });
			btnUserInfo.on('click', evt => {
				const pos = {
					x: btnUserInfo.position().left + btnUserInfo.width() - userInfo_popup.jqxMenu('width') + 7,
					y: btnUserInfo.position().top + btnUserInfo.height() + 10
				};
				userInfo_popup.jqxMenu('open', pos.x, pos.y);
			});
			/*const btnLogout = layout.find(`#btnLogout`).jqxButton({ theme: theme });
			btnLogout.on('click', evt =>
				this.logoutIstendi({ event: evt }));*/

			const divHeader = this.divHeader = layout.find(`#header`);
			const zoomRange = this.zoomRange = divHeader.find(`#zoomRange`);
			zoomRange.on('input', evt =>
				this.mapZoomDegisti({ event: evt, value: evt.target.value }));
			
			const plasUser_parent = this.plasUser_parent = divHeader.find(`#plasUser_parent`);
			const btnPlasUserSec = this.btnPlasUserSec = plasUser_parent.find(`button`);
			btnPlasUserSec.jqxButton({ theme: theme });
			btnPlasUserSec.on('click', evt =>
				this.plasUserSecIstendi(e));
			this.txtPlasUserText = plasUser_parent.find(`input`);

			const divMap = this.divMap = layout.find(`#map`);
			await this.googleInitCallback();
			await this.initTimer();
		}

		async googleInitCallback() {
			if (this.googleInitFlag || !(window.google && google.maps && google.maps.Map))
				return false;
			
			const {divMap, zoomRange} = this;
			if (!(divMap && divMap.length))
				return false;

			if (!window.MapLabel) {
				$(`<script type="text/javascript" src="../lib_external/maplabel.js"></script>`)
					.appendTo('body');
			}
			
			const gMap = this.gMap = new google.maps.Map(
				divMap[0], {
					mapTypeId: 'hybrid', disableDefaultUI: false,
					zoom: (zoomRange ? asInteger(zoomRange.val()) : null) || 20,
					// center: { lat: 39.925533, lng: 32.866287 },
					styles: [
					  {
					    "featureType": "administrative",
					    "elementType": "geometry",
					    "stylers": [
					      {
					        "visibility": "off"
					      }
					    ]
					  },
					  {
					    "featureType": "administrative.land_parcel",
					    "elementType": "labels",
					    "stylers": [
					      {
					        "visibility": "off"
					      }
					    ]
					  },
					  {
					    "featureType": "poi",
					    "stylers": [
					      {
					        "visibility": "off"
					      }
					    ]
					  },
					  {
					    "featureType": "poi",
					    "elementType": "labels.text",
					    "stylers": [
					      {
					        "visibility": "off"
					      }
					    ]
					  },
					  {
					    "featureType": "road",
					    "elementType": "labels.icon",
					    "stylers": [
					      {
					        "visibility": "off"
					      }
					    ]
					  },
					  {
					    "featureType": "road.local",
					    "elementType": "labels",
					    "stylers": [
					      {
					        "visibility": "off"
					      }
					    ]
					  },
					  {
					    "featureType": "transit",
					    "stylers": [
					      {
					        "visibility": "off"
					      }
					    ]
					  }
					]
				}
			);

			this.googleInitFlag = true;
			await this.tazele();
			
			return true;
		}

		async tazele(e) {
			e = e || {};
			/*this.googleInitFlag = false;
			this.googleInitCallback();*/
			
			const {gMap} = this;
			if (gMap) {
				const waitFlag = e.wait;
				const _now = now();
				const nowStr = _now.toLocaleString();
				const todayStr = _now.toLocaleDateString();
				const _e = {
					sync_timestamp: nowStr,
					timestamp_basi: `${todayStr} 00:00:00`,
					timestamp_sonu: `${todayStr} 23:59:59`
				};
				if (this.gCenteredFlag && waitFlag)
					await this.wsKonumBilgileri(_e);
				
				delete _e.sync_timestamp;
				const konumBilgileri = await this.wsKonumBilgileri(_e);
				if (konumBilgileri && konumBilgileri.rows)
					konumBilgileri = konumBilgileri.rows;
				
				const keys = ['gPolylines', 'gMarkers', 'gMapLabels'];
				for (const i in keys) {
					const key = keys[i];
					const arr = this[key];
					if (arr) {
						for (const j in arr) {
							const obj = arr[j];
							if (obj)
								obj.setMap(null);
						}
					}
					this[key] = null;
				}

				// gMap.setCenter({ lat: 39.925533, lng: 32.866287 });
				// gMap.panTo({ lat: 39.925533, lng: 32.866287 });

				let gCenteredToCurrentFlag = false;
				if (!this.gCenteredFlag) {
					const {geolocation} = navigator;
					if (geolocation) {
						geolocation.getCurrentPosition(_e => {
							const {timestamp, coords} = _e;
							gMap.panTo({ lat: coords.latitude, lng: coords.longitude });
							gCenteredToCurrentFlag = true;
						});
					}
				}
				setTimeout(() => {
					if (!gCenteredToCurrentFlag && !this.gCenteredFlag) {
						// gMap.panTo({ lat: 39.925533, lng: 32.866287 });
						gCenteredToCurrentFlag = true;
					}
				}, 5000);
				
				const icon = `images/greendot.png`;
				const gMarkers = this.gMarkers = [];
				// const gPolylines = this.gPolylines = [];
				const gMapLabels = this.gMapLabels = [];
				
				for (const i in konumBilgileri) {
					const rec = konumBilgileri[i];
					const gMarker = new google.maps.Marker({
						map: gMap,
						position: { lat: rec.latitude, lng: rec.longitude },
						title: rec.userKod,
						timestamp: rec.timestamp
					});
					gMarkers.push(gMarker);
				}
				
				
				/*const gMarkers = this.gMarkers = [
					new google.maps.Marker({ map: gMap, position: { lat: 39.926533, lng: 32.868177 }, title: '1' }),
					new google.maps.Marker({ map: gMap, position: { lat: 39.926893, lng: 32.869290 }, title: '2' }),
					new google.maps.Marker({ map: gMap, position: { lat: 39.925785, lng: 32.865480 }, title: '3' }),
					new google.maps.Marker({ map: gMap, position: { lat: 39.925590, lng: 32.866392 }, title: '4' })
				];*/
				const gPolylines = this.gPolylines = [
					new google.maps.Polyline({
						map: gMap,
						strokeColor: '#0000FF',
						strokeOpacity: .8,
						strokeWeight: 2,
						path: gMarkers.map(x => new google.maps.LatLng(x.position))
					})
				];
		
				// const placesService = new google.maps.places.PlacesService(gMap);		
				google.maps.event.addListener(gMap, 'click', evt => {
					if (this.gInfoWnd) {
						this.gInfoWnd.close();
						this.gInfoWnd = null;
					}
				});

				let lastGMarker;
				for (const i in gMarkers) {
					const gMarker = lastGMarker = gMarkers[i];
					// gMarker.setDraggable(true);
					
					const gMapLabel = new MapLabel({
						map: gMap,
						text: gMarker.getTitle(),
						position: gMarker.getPosition(),
						fontSize: '250%',
						align: 'left'
					});
					gMarker.bindTo('map', gMapLabel);
			        gMarker.bindTo('position', gMapLabel);
			        gMapLabels.push(gMapLabel);
					
					google.maps.event.addListener(gMarker, 'click', evt => {
						console.info(evt);
						let {gInfoWnd} = this;
						if (gInfoWnd)
							gInfoWnd.close();
						
						gInfoWnd = this.gInfoWnd = new google.maps.InfoWindow({
							content: (
								`<p><b>${gMarker.title}</b></p>` +
								`<div>Timestamp: <b>${dateTimeToString(asDate(evt.timestamp))}</b></div>` +
								`<div>Lat,Lng: <b>${evt.latLng.toString()}</b></div>` +
								`<div>Place: <b>${(gMarker.getPlace() || '<i>??</i>').toString()}</b></div>`
							)
						});
						google.maps.event.addListener(gInfoWnd, 'closeclick', evt =>
							this.gInfoWnd = null);
						gInfoWnd.open(gMap, gMarker);
					});
				}

				if (/*!this.gCenteredFlag &&*/ lastGMarker) {
					let {sonKonumPos} = this;
					const gPos = lastGMarker.getPosition();
					const konumPos = gPos ? { latitude: gPos.lat(), longitude: gPos.lng() } : null;
					if (konumPos && !(sonKonumPos && (konumPos.latitude == sonKonumPos.latitude && konumPos.longitude == sonKonumPos.longitude))) {
						gMap.panTo({ lat: konumPos.latitude, lng: konumPos.longitude });
						this.gCenteredFlag = true;
					}
					sonKonumPos = this.sonKonumPos = konumPos;
				}
			}
		}

		initTimer(e) {
			/*this.clearUniqueTimeout({
				key: 'timerGPS'
			});
			this.setUniqueTimeout({
				key: 'timerGPS',
				delayMS: 2000,
				isInterval: true,
				block: () =>
					this.timerProc_GPS(e)
			});*/

			this.startTimer_tazele(e);
		}

		timerProc_GPS(e) {
			const {gMap} = this;
			if (!gMap)
				return;
			
			const {geolocation} = navigator;
			if (!geolocation)
				return;

			geolocation.getCurrentPosition(_e => {
				const {timestamp, coords} = _e;
				let {lastCoords} = this;
				if (!(lastCoords && (coords.latitude == lastCoords.latitude && coords.longitude == lastCoords.longitude))) {
					lastCoords = this.lastCoords = $.extend({}, coords);
					gMap.panTo({ lat: coords.latitude, lng: coords.longitude });
				}
			});
		}

		async startTimer_tazele(e) {
			let {promise_timerWait_tazele} = this;
			if (promise_timerWait_tazele) {
				promise_timerWait_tazele.reject();
				promise_timerWait_tazele = this.promise_timerWait_tazele = null;
			}
			while (!(this.timersDisabledFlag || this.timerDisabled_tazele)) {
				try {
					promise_timerWait_tazele = this.promise_timerWait_tazele = new $.Deferred(p =>
						setTimeout(() => p.resolve(), 5000));
					try { await promise_timerWait_tazele } catch (ex) { }
					try { await this.tazele($.extend({}, e, { wait: true })) } catch (ex) { console.error(ex) }
				}
				finally {
					promise_timerWait_tazele = this.promise_timerWait_tazele = null;
				}
			}
		}

		wsKonumBilgileri(e) {
			if (this.class.isTest)
				return { isError: false, result: [] };
			
			if (this.programcimi) {
				return [
					{ latitude: 39.916533, longitude: 32.868177, userKod: 'S', timestamp: 0 },
					{ latitude: 39.936893, longitude: 32.842290, userKod: 'E', timestamp: 0 },
					{ latitude: 39.925690, longitude: 32.865992, userKod: 'K', timestamp: 0 },
					{ latitude: 39.925590, longitude: 32.865392, userKod: 'Ö', timestamp: 0 }
				]
			}
			
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput, timeout: 8000,
				url: `${this.wsURLBase}konumBilgileri/?${$.param(this.buildAjaxArgs(e))}`
			});
			return lastAjaxObj;
		}

		wsUserPlasListe(e) {
			if (this.class.isTest)
				return { isError: false, result: [] };
			
			lastAjaxObj = $.ajax({
				cache: false, type: 'POST', dataType: defaultOutput, timeout: 8000,
				url: `${this.wsURLBase}userPlasListe/?${$.param(this.buildAjaxArgs(e))}`
			});
			return lastAjaxObj;
		}

		mapZoomDegisti(e) {
			e = e || {};
			const {gMap, zoomRange} = this;
			if (!gMap)
				return;
			
			const value = e.value || ((e.event || {}).target || {}).value || (zoomRange ? zoomRange.val() : null);
			if (!value)
				return;
			
			gMap.setZoom(asInteger(value));
		}

		plasUserSecIstendi(e) {
			const {plasUserSecim} = this;
			const part = new SkyKonumTakip_PlasUserSecPart({
				hepsimi: plasUserSecim.hepsimi,
				kodSet: plasUserSecim.kodSet,
				recs: [
					{ kod: 'p1', aciklama: 'özer' },
					{ kod: 'p2', aciklama: 'ece' }
				],
				tamamIslemi: e =>
					this.plasUserSecildi(e)
			});
			part.open();
		}

		plasUserSecildi(e) {
			e = e || {};
			const {plasUserSecim, txtPlasUserText} = this;
			$.extend(plasUserSecim, {
				hepsimi: e.hepsimi,
				kodSet: e.hepsimi ? null : e.kodSet
			});
			let text = e.selectionText;
			if (text == null) {
				text = SkyKonumTakip_PlasUserSecPart.getSelectionText({
					tekilmi: e.tekilmi,
					hepsimi: plasUserSecim.hepsimi,
					kodListe: Object.keys(plasUserSecim.kodSet)
				});
			}
			txtPlasUserText.val(text);
			
			this.tazele();
		}

		async onResize(e) {
			await super.onResize(e);

			const {divMap, gMap} = this;
			if (divMap && divMap.length)
				divMap.css('height', window.innerHeight - 105);
		}
	}
})();
