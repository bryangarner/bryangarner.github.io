$(document).ready(function() {
	//define baselayer tilesets
	var light = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoicHNteXRoMiIsImEiOiJjaXNmNGV0bGcwMG56MnludnhyN3Y5OHN4In0.xsZgj8hsNPzjb91F31-rYA', {
			id: 'mapbox.streets',
			attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>'
		}),
		dark = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoicHNteXRoMiIsImEiOiJjaXNmNGV0bGcwMG56MnludnhyN3Y5OHN4In0.xsZgj8hsNPzjb91F31-rYA', {
			id: 'mapbox.dark',
			attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>'
		}),
		streets = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoicHNteXRoMiIsImEiOiJjaXNmNGV0bGcwMG56MnludnhyN3Y5OHN4In0.xsZgj8hsNPzjb91F31-rYA', {
			id: 'mapbox.streets',
			attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>'
		});
	var categories = ['Fishes', 'Amphibians-Frogs', 'Mammals'];
	//create the map
	var map = L.map('mapid', {
		center: [27.9510, -82.3444],
		zoom: 7,
		minZoom: 3,
		maxZoom: 18,
		layers: [light]
	});
	//create basylayers
	var baseLayers = {
		"Light": light,
		"Dark": dark,
		"Streets": streets
	};
	//add the base layers control to the map
	L.control.layers(baseLayers).addTo(map);
	//add geoJSON data
	var geoJsonLayer = L.geoJson(data, {
		pointToLayer: pointToLayer,
		onEachFeature: onEachFeature
	}).addTo(map);
	createLegend()
	createSearch(geoJsonLayer);
	createFilter()

	function pointToLayer(feature, latlng) {
		var geojsonMarkerOptions = {
			radius: 4,
			fillColor: "",
			color: "#000",
			weight: 1,
			opacity: 1,
			fillOpacity: 0.8,
			tags: ['']
		};
		var attribute = "Group_";
		var attValue = feature.properties[attribute];
		if (attValue == categories[0]) {
			geojsonMarkerOptions.fillColor = getColor(attValue);
			geojsonMarkerOptions.tags = [categories[0]];
		}
		if (attValue == categories[1]) {
			geojsonMarkerOptions.fillColor = getColor(attValue);
			geojsonMarkerOptions.tags = [categories[1]];
		}
		if (attValue == categories[2]) {
			geojsonMarkerOptions.fillColor = getColor(attValue);
			geojsonMarkerOptions.tags = [categories[2]];
		}
		//only pull the data we need because the dataset is huge and will crash otherwise a.ka. (plants)
		if (attValue == categories[0] || attValue == categories[1] || attValue == categories[2]) {
			return L.circleMarker(latlng, geojsonMarkerOptions);
		}
	};

	function onEachFeature(feature, layer) {
		var popupContent = "<p><b>Common Name:</b> " + feature.properties.Common_Name + "</p>";
		popupContent += "<p><b>Group:</b> " + feature.properties.Group_ + "</p>";
		popupContent += "<p><b>Status:</b> " + feature.properties.Status + "</p>"
		popupContent += "<p><b>Specimen Number:</b> " + feature.properties.Specimen_Number + "</p>"
		if (feature.properties) {
			layer.bindPopup(popupContent, {
				closeButton: false,
				className: 'speciesPopup'
			});
		}
		layer.on({
			mouseover: function() {
				this.openPopup()
			},
			mouseout: function() {
				this.closePopup();
			}
		});
	}
	// create legend function
	function createLegend() {
		$("div.info.legend.leaflet-control").remove();
		// container
		var div = L.DomUtil.create('div', 'info legend');
		// make control
		var LegendControl = L.Control.extend({
			options: {
				position: 'bottomright'
			},
			onAdd: function() {
				var labels = ['<strong>Species by Group</strong>']
				for (var i = 0; i < categories.length; i++) {
					div.innerHTML += labels.push('<i class="circle" style="background:' + getColor(categories[i]) + '"></i> ' + (categories[i] ? categories[i] : '+'));
				}
				div.innerHTML = labels.join('<br>');
				return div;
			}
		});
		map.addControl(new LegendControl());
	}
	// create legend function
	function updateLegend(tags) {
		if (tags.length > 0) {
			$("div.info.legend.leaflet-control").remove();
			// container
			var div = L.DomUtil.create('div', 'info legend');
			// make control
			var LegendControl = L.Control.extend({
				options: {
					position: 'bottomright'
				},
				onAdd: function() {
					var labels = ['<strong>Species by Group</strong>'];
					for (var i = 0; i < tags.length; i++) {
						div.innerHTML += labels.push('<i class="circle" style="background:' + getColor(tags[i]) + '"></i> ' + (tags[i] ? tags[i] : '+'));
					}
					div.innerHTML = labels.join('<br>');
					return div;
				}
			});
			map.addControl(new LegendControl());
		} else {
			createLegend();
		}
	}

	function createSearch(featuresLayer) {
		var searchControl = new L.Control.Search({
			layer: featuresLayer,
			marker: {
				circle: {
					radius: 20,
					color: '#FF0000',
					opacity: .85,
					weight: 6,
					fillOpacity: 0
				},
				icon: false,
			},
			propertyName: 'Specimen_Number',
			zoom: 18,
			collapsed: true,
			textPlaceholder: 'Search Specimen Number',
			position: 'topleft',
			hideMarkerOnCollapse: true,
		});
		// open result marker popup
		searchControl.on('search:locationfound', function(e) {
			if (e.layer._popup) {
				let popup = e.layer.getPopup();
				e.layer.bindPopup(popup, {
					offset: [0, -11]
				});
				e.layer.openPopup();
			}
			// restore original style on popup close
		}).on('search:collapsed', function(e) {
			featuresLayer.eachLayer(function(layer) {
				featuresLayer.resetStyle(layer);
			});
		});
		map.addControl(searchControl);
	}

	function createFilter() {
		L.control.tagFilterButton({
			data: categories,
			icon: '<img src="lib/leaflet/images/filter.png">',
			filterOnEveryClick: true,
			onSelectionComplete: function(tags) {
				updateLegend(tags);
			}
		}).addTo(map);
	}

	function getColor(d) {
		switch (d) {
			case categories[0]:
				return '#ff7800';
			case categories[1]:
				return '#7CFC00';
			case categories[2]:
				return '#FF00D1';
			default:
				return 'transparent';
		}
	};
});