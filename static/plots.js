
$(document).ready( function(){
    console.log("Loading plots.js");
});


function MakeHistogramFromData(data, css_id, labels) {

    console.log("Making Histogram From Data in id: " + css_id);

    var options = {
	series: {stack: 1,
		 lines: {show: false, steps: false },
		 bars: {show: true, barWidth: 1.0, align: 'center',},
		},
	//xaxis: {ticks: [[1,'One'], [2,'Two'], [3,'Three'], [4,'Four'], [5,'Five']]},
	xaxis: {ticks: labels},
    };
    
    $.plot($(css_id), data, options);
    
    console.log("Successfully made plot in id: " + css_id);

}


function MakePlot() {

    // To make the plot, we need the following:
    // HistData["channelA"] = {"data" : data, "SampleA" : sampleA, ... }

    var measurement = GetHistogramData();

    // First, get ALL the samples
    // across all channels
    var AllSamples = []
    var axis_labels = Array();
    var channel_idx = -1;
    for(var channel_name in measurement) {
	channel_idx += 1;
	var channel = measurement[channel_name];
	axis_labels.push([channel_idx, channel_name]);
	// Get the samples for this channel
	var keys = [];
	for(var k in channel){
	    if(AllSamples.indexOf(k) === -1) AllSamples.push(k)
	}
    }
    console.log("Found Samples: ");
    console.log(AllSamples);

    // Now, for each sample, make the dictionary of values
    // Sample[1] = ValInChannel1; 
    // Sample[2] = ValInChannel2;
    // etc
    // Loop over Samples
    var data = new Array()

    for( var sample_idx in AllSamples ){
	var sample_name = AllSamples[sample_idx];
	console.log("Getting data for sample: " + sample_name);
	// Get the 'data' for this sample, meaning
	// this histogram heights across channels
	var channel_idx = -1;
	var sample_data = new Array();
	for(var channel_name in measurement) {
	    var channel = measurement[channel_name];
	    channel_idx += 1; 
	    if(sample_name in channel) {
		var channel_sample_val = channel[sample_name];
		sample_data.push([channel_idx, channel_sample_val]);
	    }
	    else {
		sample_data.push([channel_idx, 0.0]);
	    }
	}
	
	// Make the 'dictionary' for this sample, which
	// is passed to the plotmaking function
	var sample_dict = {label : sample_name, data : sample_data}
	if(sample_name=='data') {
	    sample_dict["stack"] = 0;
	    sample_dict["color"] = $.color.make(355,355,355,1); //"white";
	}
	else {
	    sample_dict["stack"] = 1;
	}
	console.log("Found data for sample: " + sample_name);
	console.log(sample_dict);
	data.push(sample_dict);
    }

    // Make the labels
    //var axis_labels = Array()
    //for( var sample_idx in AllSamples ){
	//var sample_name = AllSamples[sample_idx];
	//axis_labels.push([sample_idx, sample_name]);
    //}

    // Finally, turn this data into a histogram plot
    MakeHistogramFromData( data, "#plot", axis_labels );

    // And save this info into the html5 storage
    var measurement = GetMeasurementObject(); //channel_list = $('#Channel_List').html(); //innerHTML;
    console.log("Caching measurement object in local storage:");
    console.log(measurement);
    localStorage.setItem("measurement", JSON.stringify(measurement));

}


/*
    var SampleList = new Array();
    var Data = new Array();

    for (var channel_name in measurement) {
	if( !dictionary.hasOwnProperty(channel_name) ){
	    console.log("Error: dict doesn't have channel: " + channel_name);
	    throw "key error";
	}
	var channel = measurement[channel_name];
    }
}
*/


$(function () {
    var css_id = '#plot';
    var data = [
	{label: 'foo', data: [[1,300], [2,300], [3,300], [4,300], [5,300]], stack: false},
	{label: 'bar', data: [[1,800], [2,600], [3,400], [4,200], [5,0]],   stack: true},
	{label: 'baz', data: [[1,100], [2,200], [3,300], [4,400], [5,500]], stack: true},
    ];
    var options = {
	series: {stack: 1,
		 lines: {show: false, steps: false },
		 bars: {show: true, barWidth: 1.0, align: 'center',},
		},
	xaxis: {ticks: [[1,'One'], [2,'Two'], [3,'Three'], [4,'Four'], [5,'Five']]},
    };
    
    $.plot($(css_id), data, options);
});


/*


function histogramChart() {
    // This function acts on data
    // and create a histogram out of it

    var margin = {top: 0, right: 0, bottom: 20, left: 0},
    width = 600,
    height = 400;

    var histogram = d3.layout.histogram(),
    x = d3.scale.ordinal(),
    y = d3.scale.linear(),
    xAxis = d3.svg.axis().scale(x).orient("bottom").tickSize(6, 0);

    function chart(selection) {
	selection.each(function(data) {

	          // Compute the histogram.
	    data = histogram(data);

	          // Update the x-scale.
	    x   .domain(data.map(function(d) { return d.x; }))
	        .rangeRoundBands([0, width - margin.left - margin.right], .1);

	          // Update the y-scale.
	    y   .domain([0, d3.max(data, function(d) { return d.y; })])
	        .range([height - margin.top - margin.bottom, 0]);

	    // Select the svg element, if it exists.
	    var svg = d3.select(this).selectAll("svg").data([data]);

	    // Otherwise, create the skeletal chart.
	    var gEnter = svg.enter().append("svg").append("g");
	    gEnter.append("g").attr("class", "bars");
	    gEnter.append("g").attr("class", "x axis");

	          // Update the outer dimensions.
	    svg .attr("width", width)
	        .attr("height", height);

	          // Update the inner dimensions.
	    var g = svg.select("g")
	        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	          // Update the bars.
	    var bar = svg.select(".bars").selectAll(".bar").data(data);
	    bar.enter().append("rect");
	    bar.exit().remove();
	    bar .attr("width", x.rangeBand())
	        .attr("x", function(d) { return x(d.x); })
	        .attr("y", function(d) { return y(d.y); })
	        .attr("height", function(d) { return y.range()[0] - y(d.y); })
	        .order();

	          // Update the x-axis.
	    g.select(".x.axis")
	        .attr("transform", "translate(0," + y.range()[0] + ")")
	        .call(xAxis);
	});
    }

    chart.margin = function(_) {
	if (!arguments.length) return margin;
	margin = _;
	return chart;
    };

    chart.width = function(_) {
	if (!arguments.length) return width;
	width = _;
	return chart;
    };

    chart.height = function(_) {
	if (!arguments.length) return height;
	height = _;
	return chart;
    };

    // Expose the histogram's value, range and bins method.
    d3.rebind(chart, histogram, "value", "range", "bins");

      // Expose the x-axis' tickFormat method.
    d3.rebind(chart, xAxis, "tickFormat");

    return chart;
}



function UpdatePlot() {
    
    console.log("Updating Plot");

    d3.select("#plot")
	.datum(irwinHallDistribution(10000, 10))
	.call(histogramChart()
	      .bins(d3.scale.linear().ticks(20))
	      .tickFormat(d3.format(".02f")));
    
    function irwinHallDistribution(n, m) {
	var distribution = [];
	for (var i = 0; i < n; i++) {
	    for (var s = 0, j = 0; j < m; j++) {
		s += Math.random();
	    }
	    distribution.push(s / m);
	}
	return distribution;
    }
    console.log("Successfully Updated Plot");
}
$(document).ready( UpdatePlot );
*/