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
//function to instantiate the Leaflet map
function createMap() {
	modal.style.display = "block";
	//create the map
	var map = L.map('mapid', {
		center: [37.9510, -94.2333],
		zoom: 3,
		minZoom: 3,
		maxZoom: 8,
		layers: [light]
	});
	var baseLayers = {
		"Light": light,
		"Dark": dark,
		"Streets": streets
	};
	L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoicHNteXRoMiIsImEiOiJjaXNmNGV0bGcwMG56MnludnhyN3Y5OHN4In0.xsZgj8hsNPzjb91F31-rYA', {
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
		id: 'mapbox.streets',
		accessToken: 'pk.eyJ1IjoiYnJ5YW5nYXJuZXIiLCJhIjoiY2pqNGxvOWw1MTlyOTN3cDZoanhnOG9tdyJ9.EEUHDCVqGagl9EnsZ9TJ8g'
	}).addTo(map);
	L.control.layers(baseLayers).addTo(map);
	//call getData function
	getData(map);
};

function processData(data) {
	//empty array to hold attributes
	var attributes = [];
	//properties of the first feature in the dataset
	var properties = data.features[0].properties;
	//push each attribute name into attributes array
	for (var attribute in properties) {
		//only take attributes with population values
		if (attribute.indexOf("Year") > -1) {
			attributes.push(attribute);
		};
	};
	return attributes;
};

function getData(map) {
	//load the data
	$.ajax("data/State_GDP.geojson", {
		dataType: "json",
		success: function(response) {
			//create an attributes array
			var attributes = processData(response);
			createPropSymbols(response, map, attributes);
			createSequenceControls(map, attributes);
			createLegend(map, attributes);
		}
	});
};

function createPopup(properties, attribute, layer, radius) {
	var year = attribute.slice(-4);
	//add state to popup content string
	var popupContent = "<p><b>State:</b> " + properties.State + "</p>";
	//add formatted attribute to popup content string
	popupContent += "<p><b>Year: </b>" + year + "<p><b>Gross Domestic Product: </b>$" + properties[attribute].toLocaleString() + " million</p>";
	//replace the layer popup
	layer.bindPopup(popupContent, {
		offset: new L.Point(0, -radius),
         closeButton: false
	}).on({
		mouseover: function(e) {
			this.openPopup();
			this.setStyle({
				color: '#ff7800'
			});
		},
		mouseout: function(e) {
			this.closePopup();
			this.setStyle({
				color: "#537898"
			});
		}
	});
};
//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
	//scale factor to adjust symbol size evenly
	var scaleFactor = 0.005;
	//area based on attribute value and scale factor
	var area = attValue * scaleFactor;
	//radius calculated based on area
	var radius = Math.sqrt(area / Math.PI);
	return radius;
};
//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes) {
	//Determine which attribute to visualize with proportional symbols
	//create marker options
	var options = {
		fillColor: "#2B5159",
		color: "#537898",
		weight: 1,
		opacity: 1,
		fillOpacity: 0.5
	};
	//For each feature, determine its value for the selected attribute
	var attValue = Number(feature.properties[attributes[0]]);
	//Give each feature's circle marker a radius based on its attribute value
	options.radius = calcPropRadius(attValue);
	//create circle marker layer
	var layer = L.circleMarker(latlng, options);
	//build popup content string starting with city...Example 2.1 line 24
	createPopup(feature.properties, attributes[0], layer, options.radius);
	//return the circle marker to the L.geoJson pointToLayer option
	return layer;
};
//Add circle markers for point features to the map
function createPropSymbols(data, map, attributes) {
	//create a Leaflet GeoJSON layer and add it to the map
	L.geoJson(data, {
		pointToLayer: function(feature, latlng) {
			return pointToLayer(feature, latlng, attributes);
		}
	}).addTo(map);
};

function createSequenceControls(map, attributes) {
	var SequenceControl = L.Control.extend({
		options: {
			position: 'bottomleft'
		},
		onAdd: function(map) {
			// create the control container with a particular class name
			var sliderContainer = L.DomUtil.create('div', 'sequence-control-container');
			//create range input element (slider)
			$(sliderContainer).append('<input class="range-slider" type="range">');
			//add play and skip buttons
			$(sliderContainer).append('<button class="skip" id="reverse" title="Reverse"><i class="fas fa-step-backward"></i></button>');
			$(sliderContainer).append('<button class="skip" id="forward" title="Forward"><i class="fas fa-step-forward"></i></button>');
			$(sliderContainer).append('<button class="auto" id="auto" title="Play"><i class="fas fa-play"></i></button>');
			//kill any mouse event listeners on the map
			$(sliderContainer).on('mouseover dblclick', function() {
				L.DomEvent.disableClickPropagation(sliderContainer);
			});
			return sliderContainer;
		}
	});
	map.addControl(new SequenceControl());
	$('.range-slider').attr({
		max: 20,
		min: 0,
		value: 0,
		step: 1
	});
	$('.range-slider').on('input', function() {
		var index = $(this).val();
		updatePropSymbols(map, attributes[index]);
		updateLegend(map, attributes[index]);
	});
	$('.skip').click(function() {
		//get the old index value
		var index = $('.range-slider').val();
		//increment or decrement depending on button clicked
		if ($(this).attr('id') == 'forward') {
			index++;
			//if past the last attribute, wrap around to first attribute
			index = index > 20 ? 0 : index;
		} else if ($(this).attr('id') == 'reverse') {
			index--;
			//if past the first attribute, wrap around to last attribute
			index = index < 0 ? 20 : index;
		};
		//update slider
		$('.range-slider').val(index);
		updatePropSymbols(map, attributes[index]);
		updateLegend(map, attributes[index]);
	});
	$('#auto').click(function() {
		autoPlay(map, attributes);
		$('#auto').attr('disabled', 'disabled');
		$('#reverse').attr('disabled', 'disabled');
		$('#forward').attr('disabled', 'disabled');
	});
}

function autoPlay(map, attributes) {
	var index = $('.range-slider').val();
	var play = setInterval(function() {
		$('.leaflet-popup').hide()
		$('.leaflet-popup-content-wrapper').hide()
		$('.leaflet-popup-content-button').hide()
		index++;
		index = index > 20 ? 0 : index;
		$('.range-slider').val(index);
		updatePropSymbols(map, attributes[index]);
		updateLegend(map, attributes[index]);
		if (index == 20) {
			clearInterval(play);
			$('#auto').removeAttr('disabled');
			$('#reverse').removeAttr('disabled');
			$('#forward').removeAttr('disabled');
		};
	}, 500);
}

function createLegend(map, attributes) {
	var LegendControl = L.Control.extend({
		options: {
			position: 'bottomleft'
		},
		onAdd: function(map) {
			var legendContainer = L.DomUtil.create("div", "legend-control-container");
			$(legendContainer).append('<div id="temporal-legend">')
			$(legendContainer).append('<div id="temporal-legend-gdptotal">')
			//start attribute legend svg string
			var svg = '<svg id="attribute-legend" width="250px" height="137px">';
			//array of circle names to base loop on
			var circles = {
				max: 90,
				mean: 110,
				min: 130
			};
			//loop to add each circle and text to svg string
			for (var circle in circles) {
				//circle string
				svg += '<circle class="legend-circle" id="' + circle + '" fill="#2B5159" fill-opacity="0.8" stroke="#537898" cx="72"/>';
				//text string
				svg += '<text id="' + circle + '-text" x="148" y="' + circles[circle] + '"></text>';
			};
			//close svg string
			svg += "</svg>";
			//add attribute legend svg to container
			$(legendContainer).append(svg);
			return legendContainer;
		}
	});
	map.addControl(new LegendControl());
	updateLegend(map, attributes[0]);
} // end createLegend()
//Calculate the max, mean, and min values for a given attribute
function getCircleValues(map, attribute) {
	//start with min at highest possible and max at lowest possible number
	var min = Infinity,
		max = -Infinity;
	map.eachLayer(function(layer) {
		//get the attribute value
		if (layer.feature) {
			var attributeValue = Number(layer.feature.properties[attribute]);
			//test for min
			if (attributeValue < min) {
				min = attributeValue;
			};
			//test for max
			if (attributeValue > max) {
				max = attributeValue;
			};
		};
	});
	//set mean
	var mean = (max + min) / 2;
	//return values as an object
	return {
		max: max,
		mean: mean,
		min: min
	};
};

function updateLegend(map, attribute) {
	//create content for legend
	var year = attribute.split("_")[1];
	var content = "Gross Domestic Product in " + year;
	var totalgdp = '<img class="usFlag" src="img/USflag.png" alt="United States Flag">' + getTotal(map, attribute);
	//replace legend content
	$('#temporal-legend').html(content);
	$('#temporal-legend-gdptotal').html(totalgdp);
	//get the max, mean, and min values as an object
	var circleValues = getCircleValues(map, attribute);
	for (var key in circleValues) {
		//get the radius
		var radius = calcPropRadius(circleValues[key]);
		//assign the cy and r attributes
		$('#' + key).attr({
			cy: 136 - radius,
			r: radius
		});
		var text = Math.round(circleValues[key] * 100) / 100;
		$('#' + key + '-text').text("$" + text.toLocaleString() + "m");
	};
};

function updatePropSymbols(map, attribute) {
	map.eachLayer(function(layer) {
		if (layer.feature && layer.feature.properties[attribute]) {
			var props = layer.feature.properties;
			//update each feature's radius based on new attribute values
			var radius = calcPropRadius(props[attribute]);
			layer.setRadius(radius);
			createPopup(props, attribute, layer, radius);
		};
	});
};

function getTotal(map, attribute) {
	var total = 0;
	map.eachLayer(function(layer) {
		//get the attribute value
		if (layer.feature) {
			var attributeValue = Number(layer.feature.properties[attribute]);
			total = total + attributeValue;
		};
	});
	total = (total / 1000000).toFixed(2).toLocaleString() + " trillion USD";
	return total;
}
var modal = document.getElementById('myModal');
// Get the <span> element that closes the modal
// When the user clicks on <span> (x), close the modal
$('.close')[0].onclick = function() {
	modal.style.display = "none";
}
// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
	if (event.target == modal) {
		modal.style.display = "none";
	}
}
$("#btn").on("click", function() {
	modal.style.display = "none";
})
$(document).ready(createMap);