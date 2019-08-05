var flKeys = L.layerGroup();
var FKNMSboundary = L.layerGroup();
var marineZones = L.layerGroup();
var reefGroup = L.layerGroup();
var FKNMSmarineZones, reefData, sanctuaryBoundary;
var panorama = new PANOLENS.ImagePanorama('data/images/360/');
var viewer = new PANOLENS.Viewer({
	container: pano,
	autoRotate: true,
	autoRotateSpeed: 1,
	controlButtons: ['fullscreen']
});
var basemaps = [
	L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
		id: 'mapbox.streets',
		attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors &copy; <a href="http://mapbox.com">Mapbox</a>',
		label: 'Map',
		iconURL: './lib/leaflet-basemaps/basemap_thumb/map_background.jpg'
	}),
	L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
		maxZoom: 20,
		subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
		attribution: 'contributors &copy; <a href="https://www.google.com/">Google</a>',
		label: 'Satellite',
		iconURL: './lib/leaflet-basemaps/basemap_thumb/satellite_img.jpg'
	})
];
//create map
var map = L.map('mapid', {
	center: [25, -81.6],
	zoom: 9,
	minZoom: 7,
	maxZoom: 18
});
map.addControl(L.control.basemaps({
	basemaps: basemaps,
	tileX: 0, // tile X coordinate
	tileY: 0, // tile Y coordinate
	tileZ: 1 // tile zoom level
}));
//create scale
var scale = L.control.scale().addTo(map);
$.getJSON("data/FLKeyNames_Point.json", function(data) {
	var flKeysPt = L.geoJson(data, {
		pointToLayer: function(feature, latlng) {
			return L.circleMarker(latlng, {
				color: 'black',
				opacity: 0,
				fillOpacity: 0
			});
		},
		onEachFeature: function(feature, layer) {
			layer.bindTooltip(feature.properties.NAME, {
				permanent: true,
				direction: "center",
				className: "keys-labels"
			})
		}
	}).addTo(flKeys);
});
$.getJSON("data/FLKeyNames_Poly.json", function(data) {
	flKeys = L.geoJson(data, {
		style: function(feature) {
			return {
				color: keysColor(feature),
				weight: 3,
				fillOpacity: 0.8,
				opacity: 1
			};
		}
	}).addTo(flKeys);
	flKeys.bringToBack();
});
flKeys.addTo(map);
$.getJSON("data/FKNMS_Boundary_Poly.json", function(data) {
	sanctuaryBoundary = L.geoJson(data, {
		style: function(feature) {
			return {
				color: 'black',
				weight: 0.7,
				fillOpacity: 0
			};
		}
	}).addTo(FKNMSboundary).addTo(map);
});
$.getJSON("data/FKNMS_Marine_Zones_Poly.json", function(data) {
	FKNMSmarineZones = L.geoJson(data, {
		style: function(feature) {
			return {
				color: 'black',
				fillColor: marineZoneColor(feature),
				weight: 1,
				fillOpacity: 0.4
			};
		},
		onEachFeature: function(feature, layer) {
			layer.bindTooltip(feature.properties.Name, {
				permanent: true,
				direction: "center",
				className: "layer-labels"
			})
			layer.on('click', function(e) {
				reefData.setStyle({
					radius: 6,
					fillColor: "red",
					color: "white",
					weight: 1,
					opacity: 1,
					fillOpacity: 0.6
				});
				FKNMSmarineZones.setStyle({
					color: 'black',
					weight: 1,
					fillOpacity: 0.4
				});
				layer.setStyle(highlight);
				$(".sidepanel").stop().animate({
					scrollTop: 0
				}, 0);
				viewer.remove(panorama);
				$(".title").html(feature.properties.Name);
				if (feature.properties.InfoSrc != "" && feature.properties.PhotoSrc != "") {
					$(".info").html(feature.properties.Info + "<br><a class='links' href=" + feature.properties.InfoSrc + " target='_blank'>Information Source</a><br><a class='links' href=" + feature.properties.PhotoSrc + " target='_blank'>Photo Source</a>");
				} else if (feature.properties.InfoSrc != "") {
					$(".info").html(feature.properties.Info + "<br><a class='links' href=" + feature.properties.InfoSrc + " target='_blank'>Information Source</a>");
				} else {
					$(".info").html(feature.properties.Info);
				}
				if (feature.properties.Photo == "pano_floridakeys_nophoto.jpg") {
					$("#pano > a").show();
				} else {
					$("#pano > a").hide();
				}
				panorama = new PANOLENS.ImagePanorama('data/images/360/' + feature.properties.Photo);
				viewer.add(panorama);
				viewer.setPanorama(panorama);
				viewer.OrbitControls.noZoom = true;
				$("#mapid").animate({
					width: "75%"
				}, 600);
				$(".sidepanel").removeClass('hide');
				map.flyTo([feature.geometry.coordinates[0][0][1], feature.geometry.coordinates[0][0][0]], 14, {
					animate: true,
					duration: 1
				});
			});
		}
	}).addTo(marineZones);
});
$.getJSON("data/FLKeys_Reefs_Point.json", function(data) {
	reefData = L.geoJson(data, {
		pointToLayer: function(feature, latlng) {
			return L.circleMarker(latlng, {
				radius: 6,
				fillColor: "red",
				color: "white",
				weight: 1,
				opacity: 1,
				fillOpacity: 0.8
			});
		},
		onEachFeature: function(feature, layer) {
			layer.bindTooltip(feature.properties.Name, {
				permanent: true,
				direction: "right",
				className: "layer-labels"
			})
			layer.on('click', function(e) {
				FKNMSmarineZones.setStyle({
					color: 'black',
					weight: 1,
					fillOpacity: 0.4
				});
				reefData.setStyle({
					radius: 6,
					fillColor: "red",
					color: "white",
					weight: 1,
					opacity: 1,
					fillOpacity: 0.8
				});
				layer.setStyle(highlight);
				$(".sidepanel").stop().animate({
					scrollTop: 0
				}, 0);
				viewer.remove(panorama);
				$(".title").html(feature.properties.Name);
				if (feature.properties.InfoSrc != "" && feature.properties.PhotoSrc != "") {
					$(".info").html(feature.properties.Info + "<br><a class='links' href=" + feature.properties.InfoSrc + " target='_blank'>Information Source</a><br><a class='links' href=" + feature.properties.PhotoSrc + " target='_blank'>Photo Source</a>");
				} else if (feature.properties.InfoSrc != "") {
					$(".info").html(feature.properties.Info + "<br><a class='links' href=" + feature.properties.InfoSrc + " target='_blank'>Information Source</a>");
				} else {
					$(".info").html(feature.properties.Info);
				}
				if (feature.properties.Info == "") {
					$(".info").html('Information for this area could not be found. If you have information similar to the descriptions found for other areas and would like to contribute, please click the button below.<div class="center"><a href="https://www.dropbox.com/request/qXjRT65lTsaeT0pYzUNo?oref=e" target="_blank" class="reefbtn">Submit Reef Description</a></div>');
				}
				if (feature.properties.Photo == "pano_floridakeys_nophoto.jpg") {
					$("#pano > a").show();
				} else {
					$("#pano > a").hide();
				}
				panorama = new PANOLENS.ImagePanorama('data/images/360/' + feature.properties.Photo);
				viewer.add(panorama);
				viewer.setPanorama(panorama);
				viewer.OrbitControls.noZoom = true;
				$("#mapid").animate({
					width: "75%"
				}, 600);
				$(".sidepanel").removeClass('hide');
				map.flyTo([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], 14, {
					animate: true,
					duration: 1
				});
			});
		}
	}).addTo(reefGroup);
});
var highlight = {
	'color': 'yellow',
	'weight': 2,
	'opacity': 1
};

function keysColor(featureIn) {
	return featureIn.properties.Name == "Key West" ? '#81D75C' : featureIn.properties.Name == "Big Pine Key and the Lower Keys" ? '#6072BD' : featureIn.properties.Name == "Marathon" ? '#EEA86A' : featureIn.properties.Name == "Islamorada" ? '#E33977' : featureIn.properties.Name == "Key Largo" ? '#f9ed04' : 'black';
}

function marineZoneColor(featureIn) {
	return featureIn.properties.Name.includes("Ecological Reserve") ? 'rgb(239, 250, 30)' : featureIn.properties.Name.includes("Sanctuary Preservation Area") ? 'rgb(84, 151, 16)' : featureIn.properties.Name.includes("Research Only") ? 'rgb(250, 41, 30)' : 'black';
}

function legendControl() {
	$("#mapid > div.leaflet-control-container > div.leaflet-bottom.leaflet-left > div.legend.leaflet-control").remove();
	var legend = L.control({
		position: 'bottomleft'
	});
	legend.onAdd = function() {
		var div = L.DomUtil.create('div', 'legend');
		div.innerHTML = '<h3><b>Divespots</b></h3>';
		div.innerHTML += '<span class="circle" style="background: red; border-color: black;' + '"></span> ' + '<label>Reef</label>';
		div.innerHTML += "<h3><b>Marine Zones</b></h3>";
		div.innerHTML += '<span class="square" style="background: rgb(239, 250, 30, 0.4);' + '"></span> ' + '<label>Ecological Reserve</label>';
		div.innerHTML += '<span class="square" style="background: rgb(84, 151, 16, 0.4);' + '"></span> ' + '<label>Sanctuary Preservation Area</label>';
		div.innerHTML += '<span class="square" style="background: rgb(250, 41, 30, 0.4);' + '"></span> ' + '<label>Research Only</label>';
		div.innerHTML += "<h3><b>Boundary</b></h3>";
		div.innerHTML += '<span class="square" style="background: rgb(255, 255, 255, 1);' + '"></span> ' + '<label>Florida Keys National Marine Sanctuary</label>';
		return div;
	};
	legend.addTo(map);
}
legendControl();
//Create search bar function
function searchControl() {
	var searchControl = new L.Control.Search({
		layer: L.featureGroup([reefGroup, marineZones]),
		marker: false,
		propertyName: 'Name',
		collapsed: true,
		textPlaceholder: 'Search Area Name',
		position: 'topleft',
		hideMarkerOnCollapse: false,
		autoCollapse: true
	});
	searchControl.on('search:locationfound', function(e) {
		FKNMSmarineZones.setStyle({
			color: 'black',
			weight: 1,
			fillOpacity: 0.4
		});
		reefData.setStyle({
			radius: 6,
			fillColor: "red",
			color: "white",
			weight: 1,
			opacity: 1,
			fillOpacity: 0.8
		});
		e.layer.setStyle(highlight);
		$(".sidepanel").stop().animate({
			scrollTop: 0
		}, 0);
		viewer.remove(panorama);
		$(".title").html(e.layer.feature.properties.Name);
		if (e.layer.feature.properties.InfoSrc != "" && e.layer.feature.properties.PhotoSrc != "") {
			$(".info").html(e.layer.feature.properties.Info + "<br><a class='links' href=" + e.layer.feature.properties.InfoSrc + " target='_blank'>Information Source</a><br><a class='links' href=" + e.layer.feature.properties.PhotoSrc + " target='_blank'>Photo Source</a>");
		} else if (e.layer.feature.properties.InfoSrc != "") {
			$(".info").html(e.layer.feature.properties.Info + "<br><a class='links' href=" + e.layer.feature.properties.InfoSrc + " target='_blank'>Information Source</a>");
		} else {
			$(".info").html(e.layer.feature.properties.Info);
		}
		if (e.layer.feature.properties.Info == "") {
			$(".info").html('Information for this area could not be found. If you have information similar to the descriptions found for other areas and would like to contribute, please click the button below.<div class="center"><a href="https://www.dropbox.com/request/qXjRT65lTsaeT0pYzUNo?oref=e" target="_blank" class="reefbtn">Submit Reef Description</a></div>');
		}
		if (e.layer.feature.properties.Photo == "pano_floridakeys_nophoto.jpg") {
			$("#pano > a").show();
		} else {
			$("#pano > a").hide();
		}
		panorama = new PANOLENS.ImagePanorama('data/images/360/' + e.layer.feature.properties.Photo);
		viewer.add(panorama);
		viewer.setPanorama(panorama);
		viewer.OrbitControls.noZoom = true;
		$("#mapid").animate({
			width: "75%"
		}, 600);
		$(".sidepanel").removeClass('hide');
		if (e.layer.feature.geometry.type == "Polygon") {
			map.flyTo([e.layer.feature.geometry.coordinates[0][0][1], e.layer.feature.geometry.coordinates[0][0][0]], 14, {
				animate: true,
				duration: 1
			});
		} else {
			map.flyTo([e.layer.feature.geometry.coordinates[1], e.layer.feature.geometry.coordinates[0]], 14, {
				animate: true,
				duration: 1
			});
		}
	});
	map.addControl(searchControl);
}
searchControl();
map.on('zoomend', function() {
	var zoomLevel = map.getZoom();
	var tooltip = $('.leaflet-tooltip.layer-labels');
	switch (zoomLevel) {
		case 18:
			tooltip.css('font-size', 12);
			break;
		case 17:
			tooltip.css('font-size', 12);
			break;
		case 16:
			tooltip.css('font-size', 12);
			break;
		case 15:
			tooltip.css('font-size', 12);
			break;
		case 14:
			tooltip.css('font-size', 12);
			break;
		case 13:
			tooltip.css('font-size', 12);
			break;
		case 12:
			tooltip.css('font-size', 12);
			break;
		case 11:
			tooltip.css('font-size', 9);
			break;
		case 10:
			tooltip.css('font-size', 8);
			break;
		default:
			tooltip.css('font-size', 0);
	}
});
map.fire('modal', {
	content: '<h1 class="center">Florida Keys Reef Guide Map</h1><p>This map is designed for interactivity. Click a Reef or Marine zone feature to view a 360-degree underwater photo and information pertaining to that specific area. The subsections below provide some hints for using the map.</p><table><tr><th>Control</th><th>Description</th></tr><tr><td class="controlIcon"><i class="fas fa-plus"></i></td><td>Use this function to zoom in (alternatively, you can use your mouse scroll wheel)</td></tr><tr><td class="controlIcon"><i class="fas fa-minus"></i></td><td>Use this function to zoom out (alternatively, you can use your mouse scroll wheel)</td></tr><tr><td class="controlIcon"><i class="fas fa-search"></i></td><td>Use this tool to search Reef and Marine Zone Areas by name.</td></tr><tr></tr><tr></tr></table>',
	closeTitle: 'close',
	zIndex: 10000
});