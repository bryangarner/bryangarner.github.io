//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){
    var attrArray = ["percent_commute_over_30mins", "average_travel_time_mins", "median_property_value_dollars", "percent_homeowners", "percent_severe_housing_problems"];
    var expressed = attrArray[0]; //initial attribute
    var attrName = {
        percent_commute_over_30mins: "Commute over 30 Minutes", 
        average_travel_time_mins: "Average Travel Time", 
        median_property_value_dollars: "Median Property Value", 
        percent_homeowners: "Homeowners", 
        percent_severe_housing_problems: "Severe Housing Problems"
}
    var attrDetails = {
        percent_commute_over_30mins: "The percentage of commuters, among those who commute to work by car, truck, or van alone, who drive longer than 30 minutes to work each day.", 
        percent_severe_housing_problems: "The percentage of households with at least 1 or more of the following housing problems: housing unit lacks complete kitchen facilities, housing unit lacks complete plumbing facilities, household is severely overcrowded, and/or household is severely cost burdened."
}
var attrSource = {
        percent_commute_over_30mins: "Source: <a href='http://www.countyhealthrankings.org/' target='_blank'>University of Wisconsin 2016</a>", 
        average_travel_time_mins: "Source: <a href='https://www.census.gov/programs-surveys/acs/' target='_blank'>Census Bureau 2016</a>", 
        median_property_value_dollars: "Source: <a href='https://www.census.gov/programs-surveys/acs/' target='_blank'>Census Bureau 2016</a>", 
        percent_homeowners: "Source: <a href='https://www.census.gov/programs-surveys/acs/' target='_blank'>Census Bureau 2016</a>", 
        percent_severe_housing_problems: "Source: <a href='http://www.countyhealthrankings.org/' target='_blank'>University of Wisconsin 2016</a>"
}
    //collect variables to size map based on window size
    var getWidth = parseInt(d3.select('#map').style('width')), 
        width = getWidth - 10 - 10, 
        mapRatio = .3, 
        height = width * mapRatio;
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.97,
        chartHeight = 180,
        leftPadding = 46,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
    //create a scale to size bars proportionally to frame and for axis
    var yScale = d3.scale.linear()
    .range([chartHeight-10, 0])
    .domain([0, 70]);
//begin script when window loads
window.onload = setMap();
//set up choropleth map
function setMap() {
	//create new svg container for the map
	var map = d3.select("body")
    .append("svg")
    .attr("class", "map")
    .attr("width", width)
    .attr("height", height);
	//create Albers equal area conic projection centered on Florida
	var projection = d3.geo.albers()
    .center([-3, 28])
    .rotate([80, 0.00, 0])
    .parallels([29.5, 45.5])
    .scale(width*2.5)
    .translate([width / 2, height / 2]);
	var path = d3.geo.path()
    .projection(projection);
	//use d3.queue to parallelize asynchronous data loading
	d3_queue.queue()
        .defer(d3.csv, "data/fl_housing_data_2016.csv") //load attributes from csv
		.defer(d3.json, "data/FLCounty.topojson") //load chloropleth spatial data
		.await(callback);
	function callback(error, csvData, florida) {
		//translate florida TopoJSON
		var floridaCounties = topojson.feature(florida, florida.objects.FLCounty).features;
		//join csv data to GeoJSON enumeration units
        floridaCounties = joinData(floridaCounties, csvData);
        //create the color scale
        var colorScale = makeColorScale(csvData, "natural");
        //add enumeration units to the map
        setEnumerationUnits(floridaCounties, map, path, colorScale);
        //add coordinated visualization to the map
        setChart(csvData, colorScale);
        createDropdown(csvData);
	};
};
  

function setEnumerationUnits(floridaCounties, map, path, colorScale){
    //add counties to map
        var counties = map.selectAll(".counties")
        .data(floridaCounties)
        .enter()
        .append("path")
        .attr("class", function(d) {
				return "counties " + d.properties.GEOID;
			}).attr("d", path)
         .style("fill", function(d){
            return choropleth(d.properties, colorScale);
        }).on("mouseover", function(d){
            highlight(d.properties);
        })
        .on("mouseout", function(d){
            dehighlight(d.properties);
        })
        .on("mousemove", moveLabel);
    var desc = counties.append("desc")
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');
};

function joinData(floridaCounties, csvData){
    //loop through csv to assign each set of csv attribute values to geojson county
		for (var i = 0; i < csvData.length; i++) {
			var csvCounty = csvData[i]; //the current county
			var csvKey = csvCounty.GEOID; //the CSV primary key
			//loop through geojson regions to find correct county
			for (var a = 0; a < floridaCounties.length; a++) {
				var geojsonProps = floridaCounties[a].properties; //the current county geojson properties
				var geojsonKey = geojsonProps.GEOID; //the geojson primary key
				//where primary keys match, transfer csv data to geojson properties object
				if (geojsonKey == csvKey) {
					//assign all attributes and values
					attrArray.forEach(function(attr) {
						var val = parseFloat(csvCounty[attr]); //get csv attribute value
						geojsonProps[attr] = val; //assign attribute and value to geojson properties
					});
				};
			};
		};
    return floridaCounties;
};
//function to create color scale generator
function makeColorScale(data, type){
    var colorClasses = [
        "#F1EFF4",
        "#BDC9E1",
        "#6EA8D0",
        "#2B8CBF",
        "#005D8B"
    ];
    //create color scale generator
    var colorScale = d3.scale.quantile()
        .range(colorClasses);
    if (type == "quantile"){
    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };
    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);
    return colorScale;
    }else if (type == "equal"){
        //build two-value array of minimum and maximum expressed attribute values
    var minmax = [
        d3.min(data, function(d) { return parseFloat(d[expressed]); }),
        d3.max(data, function(d) { return parseFloat(d[expressed]); })
    ];
    //assign two-value array as scale domain
    colorScale.domain(minmax);
    return colorScale;
    }else if (type == "natural"){
         //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };
    //cluster data using ckmeans clustering algorithm to create natural breaks
    var clusters = ss.ckmeans(domainArray, 5);
    //reset domain array to cluster minimums
    domainArray = clusters.map(function(d){
        return d3.min(d);
    });
    //remove first value from domain array to create class breakpoints
    domainArray.shift();
    //assign array of last 4 cluster minimums as domain
    colorScale.domain(domainArray);
    return colorScale;
    }
};
    
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#000";
    };
};

//function to create coordinated bar chart
function setChart(csvData, colorScale){
    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");
    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("transform", translate);
    //set bars for each county
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.GEOID;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        .attr("height", function(d, i){
            return (chartHeight-10) - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .style("fill", function(d){
            return choropleth(d, colorScale);
        })
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel);
    var desc = bars.append("desc")
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');
    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 80)
        .attr("y", 15)
        .attr("class", "chartTitle");
    //create vertical axis generator
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left");
    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);
    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
    updateChart(bars, csvData.length, colorScale);
};

function createDropdown(csvData){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });
    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return attrName[d] });
};

//dropdown change listener handler
function changeAttribute(attribute, csvData){
    //change the expressed attribute
    expressed = attribute;
     //get the max value for the selected attribute
    var max = d3.max(csvData, function(d){
        return + parseFloat(d[expressed])
    });
    //reset yScale
    yScale = d3.scale.linear()
        .range([chartHeight-10, 0])
        .domain([0, max+10]);
    //recreate the color scale
    var colorScale = makeColorScale(csvData, "natural");
    //recolor enumeration units
    var counties = d3.selectAll(".counties")
        .transition()
        .duration(1000)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale)
        });
    //re-sort, resize, and recolor bars
    var bars = d3.selectAll(".bar")
        //re-sort bars
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })
        .transition() //add animation
        .delay(function(d, i){
            return i * 20
        })
        .duration(500)
        //recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
     var datadetails = d3.select("#datadetails")
        .text(attrDetails[expressed]);
    
    var datasource = d3.select("#datasource")
        .html(attrSource[expressed]);
    
    updateChart(bars, csvData.length, colorScale);
};

//function to position, size, and color bars in chart
function updateChart(bars, n, colorScale){
    //position bars
    bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        //size/resize bars
        .attr("height", function(d, i){
            return (chartHeight-10) - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
    var chartTitle = d3.select(".chartTitle")
        .text(attrName[expressed] + " by County in Florida");
    // re-generate the chart's vertical axis after changing attribute in dropdown menu
	var yAxis = d3.svg.axis()
		.scale(yScale)
		.orient("left")
	    d3.selectAll("g.axis")
		.call(yAxis);
};

//function to highlight enumeration units and bars
function highlight(props){
    //change stroke
    var selected = d3.selectAll("." + props.GEOID)
        .style("stroke", "#ff8800")
        .style("stroke-width", "3");
    setLabel(props);
};

//function to reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("." + props.GEOID)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });
    d3.select(".infolabel")
        .remove();
    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();
        var styleObject = JSON.parse(styleText);
        return styleObject[styleName];
    };
};

//function to create dynamic label
function setLabel(props){
    //label content
    var percent = expressed.includes("percent");
    var value = expressed.includes("value");
    var minutes = expressed.includes("mins");
    var labelAttribute;
    if (percent == true){ 
              labelAttribute = "<h1>" + props[expressed].toLocaleString() + "%" + "</h1><b>" + attrName[expressed] + "</b>";
        }else if (value == true){ 
              labelAttribute = "<h1>" + "$" + props[expressed].toLocaleString() + "</h1><b>" + attrName[expressed] + "</b>";
        }else if (minutes == true){ 
              labelAttribute = "<h1>" + props[expressed].toLocaleString() + "min" + "</h1><b>" + attrName[expressed] + "</b>";
        }else{
             labelAttribute = "<h1>" + props[expressed].toLocaleString() + "</h1><b>" + attrName[expressed] + "</b>";
        }
//create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.GEOID + "_label")
        .html(labelAttribute);

    var countyName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.NAME + " County");
};

//function to move info label with mouse
function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;
    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;
    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1; 
    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};

})(); //last line of main.js