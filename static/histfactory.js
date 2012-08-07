
$(document).ready(function() {
    console.log("Document Ready");
    
    if(localStorage.getItem("measurement") != null) {
	console.log(localStorage.getItem("measurement"));
	var cached_measurement = JSON.parse(localStorage.getItem("measurement")); //$.Storage.get("channel_list");
	console.log("Using cached measurement:");
	console.log(cached_measurement);
	CreateChannelListDOMFromMeasurement(cached_measurement);
	MakePlotFromMeasurement(cached_measurement);
    }

});

// Define the 'sample' class
function Sample(name) {
    this.name = name;
    this.value = 0.0;
}

// Define the 'channel' class
function Channel(name) {
    this.name = name;
    this.data = 0;
    this.samples = new Array();
}
Channel.prototype.AddSample = function(sample){
    this.samples.push(sample);
}

//
// CREATE JAVASCRIPT OBJECTS FROM DOM TREE ELEMENTS:
//

function CreateSampleListFromDOM(sample_list_dom) {
    
    sample_element_list = sample_list_dom.getElementsByClassName('sample');

    sample_list = new Array();

    for( var sample_idx = 0; sample_idx < sample_element_list.length; sample_idx++) {
	var sample_element = sample_element_list[sample_idx];

	var name  = sample_element.getElementsByClassName('sample_name')[0].value;
	var value = sample_element.getElementsByClassName('sample_value')[0].value;

	console.log("Creating Sample: Name=" + name + " value=" + value );

	var sample = new Sample(name);
	sample.value = value;
	sample_list.push(sample);
    }

    return sample_list;
}

function CreateChannelFromDOM(chan_obj) {

    console.debug(chan_obj);
    
    var name = chan_obj.getElementsByClassName('channel_name')[0].value; // chan.find('.channel_name')[0].value; /
    var data = chan_obj.getElementsByClassName('channel_data')[0].value;

    console.log("Creating Channel: Name=" + name + " data=" + data );

    var chan = new Channel(name);
    chan.data = data;

    // Get the list of samples 
    // and convert to a list of 
    // sample classes
    var sample_list = CreateSampleListFromDOM( chan_obj.getElementsByClassName('sample_list')[0] );
    chan.samples = sample_list;

    return chan;

}

function GetMeasurementObject() {
    // Get the current measurement
    // as described by the DOM tree

    var measurement = new Array();

    // Get the list of channels
    var channel_list = $('.channel');
    for(var channel_idx = 0; channel_idx < channel_list.length; ++channel_idx){
	channel = channel_list[channel_idx];
	measurement.push(CreateChannelFromDOM(channel));
    }
    
    console.log("Final Measurement:");
    console.log(measurement);

    return measurement;

} 


//
// CREATE DOM TREE ELEMENTS FROM JAVASCRIPT OBJECTS:
//


function CreateDOMFromSample(sample) {
    // Create a DOM Sample element
    // from a Javascript Sample object

    // First, create the new sample
    var sample_element = document.createElement('div');
    sample_element.setAttribute('class', 'sample');
    sample_element.innerHTML = "Sample <br>";
    
    // Add the 'name' input field
    var sample_name = document.createElement('input');
    sample_name.setAttribute('type',"text");
    sample_name.setAttribute('class',"sample_name");
    sample_name.setAttribute('value', sample.name );
    sample_element.innerHTML += "Name:";
    sample_element.appendChild( sample_name );
    
    // Add the 'value' input field
    var sample_value = document.createElement('input');
    sample_value.setAttribute('type',"text");
    sample_value.setAttribute('class',"sample_value");
    sample_value.setAttribute('value', sample.value );
    sample_element.innerHTML += "Value:";
    sample_element.appendChild( sample_value );
    
    // Add a button to delete this div
    var deletebutton = document.createElement('img');
    deletebutton.name      = "DeleteSampleButton";
    deletebutton.className = "DeleteSampleButton";
    deletebutton.src =  'static/images/RedX.jpg';
    deletebutton.style.width  =  '13px';
    deletebutton.style.marginLeft  = '2px';
    deletebutton.style.marginRight = '2px';
    sample_element.appendChild( deletebutton );

    // Finally, add the sample to the list of samples
    return sample_element;
}

function DeleteSample() {
    console.log("Deleting Sample");
    $(this).parent().remove();   
    // Update the Plot
    MakePlot();
    return;
}
$(document).ready(function() {
    $('.DeleteSampleButton').live('click', DeleteSample)
});



function CreateDOMFromChannel(channel) {
    // Create a DOM Channel element
    // from a Javascript Channel object

    console.log("Adding New Channel");

    // First, create our new div (not yet attached)
    var new_channel = document.createElement('div');
    new_channel.setAttribute('class', 'channel');
    new_channel.innerHTML = "Channel ";

    // Add a button to delete this div
    var deletebutton = document.createElement('img');
    deletebutton.name      = "DeleteChannelButton";
    deletebutton.className = "DeleteChannelButton";
    deletebutton.src =  'static/images/RedX.jpg';
    deletebutton.style.width  =  '13px';
    deletebutton.style.marginLeft  = '2px';
    deletebutton.style.marginRight = '2px';
    new_channel.appendChild( deletebutton );
    new_channel.innerHTML += " <br>";

    // Add the 'name' input field
    var channel_name = document.createElement('input');
    channel_name.setAttribute('type',"text");
    channel_name.setAttribute('class',"channel_name");
    channel_name.setAttribute('value', channel.name);
    new_channel.innerHTML += "Name:";
    new_channel.appendChild( channel_name );

    // Add a Line Break
    new_channel.appendChild( document.createElement('br') );

    // Add the 'data' input field
    var channel_data = document.createElement('input');
    channel_data.setAttribute('type',"text");
    channel_data.setAttribute('class',"channel_data");
    channel_data.setAttribute('value', channel.data );
    new_channel.innerHTML += "Data:";
    new_channel.appendChild( channel_data );

    // Add the list of samples div
    var sample_list = document.createElement('div');
    sample_list.setAttribute('class', 'sample_list');
    for(var sample_itr=0; sample_itr<channel.samples.length; ++sample_itr) {
	sample_list.appendChild( CreateDOMFromSample(channel.samples[sample_itr]) );
    }
    new_channel.appendChild( sample_list );
    

    // Add a 'new sample' button to the channel
    var new_sample_button = document.createElement('input');
    new_sample_button.setAttribute('type','button');
    new_sample_button.setAttribute('class','NewSample');
    new_sample_button.setAttribute('value','Add New Sample');
    new_channel.appendChild( new_sample_button );

    // Finally, append the channel to the channel_list
    return new_channel;

}

function DeleteChannel() {
    console.log("Deleting Channel");
    $(this).parent().remove();
    // Update the Plot
    MakePlot();
    return;
}
$(document).ready(function() {
    $('.DeleteChannelButton').live('click', DeleteChannel);
});


function CreateChannelListDOMFromMeasurement(measurement) {
    // Create the full ChannelList (measurement) DOM Element
    // from a Javascript measurement object

    // First, get a handle on the channel_list div
    var channel_list = document.getElementById('Channel_List');

    for( var channel_itr=0; channel_itr<measurement.length; channel_itr++) {
	var channel_element = CreateDOMFromChannel( measurement[channel_itr] );
	channel_list.appendChild(channel_element);
    }

    console.log("Successfully created channel DOM from measurement");
}


//
// APPEND NEW DOM TREE OBJECTS
//

function AddNewChannel() {
    // This function is activated by the
    // 'AddNewChannel' button (duh)
    // Create a new 'channel' DOM object
    // and add it to the 'Channel_List' div,
    // which is a child of the "measurement" div

    console.log("Adding New Channel");

    var new_channel = new Channel("");

    // First, get a handle on the channel_list div
    var channel_list = document.getElementById('Channel_List');

    var channel_element = CreateDOMFromChanne(new_channel);

    // Finally, append the channel to the channel_list
    channel_list.appendChild(new_channel);

    console.log("Successfully Added a New Channel");

    return;
}
// Attach this function to the proper button
$(document).ready(function() {
    $('#NewChannel').live('click', AddNewChannel)
});



function AddSampleToChannel(channel) {

    console.log("Adding Sample To Channel");    

    var new_sample = new Sample("");

    // First, get the list of samples for this channel
    var sample_list = channel.find(".sample_list");
    
    var sample_element = CreateDOMFromSample(new_sample);

    // Finally, add the sample to the list of samples
    //sample_list.append(new_sample);
    sample_list.append(sample_element);
    
    console.log("Successfully added sample to channel");    

    return;
}
$(document).ready(function() {
    $('.NewSample').live('click', function(){
	AddSampleToChannel( $(this).parent() );
    })
});



///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////


/*
function GetHistogramData() {

    // Loop over the histogram DOM tree
    // and get the value of data and backgrounds
    // from each channel.
    // Return as a dictionary:
    // HistData["channelA"] = {"data" : data, "SampleA" : sampleA, ... }

    console.log("Getting Histogram Data");

    // First, get a handle on the channel_list div
    var channel_list = $("#Channel_List");
    
    var HistData = new Array();

    // Loop over the channels
    channel_list.children('.channel').each(function(chan_idx, chan) {
	
	channel_dict = new Array();

	// Get the Name
	var channel_name = $(chan).find(".channel_name").val();
	console.log("Channel Name: " + channel_name);

	// Get the Data
	var channel_data = $(chan).find(".channel_data").val();
	channel_dict["data"] = channel_data;
	console.log("Data: " + channel_data);

	// Get the values of the samples
	sample_values = new Array();
	$(chan).find('.sample_list').children('.sample').each(function(samp_idx, sample) {
	    var sample_name  = $(sample).find('.sample_name').val();
	    var sample_value = $(sample).find('.sample_value').val();
	    channel_dict[sample_name] = sample_value;
	    console.log("Sample: " + sample_name + " Value: " + sample_value);
	});	

	console.debug( channel_dict );
	HistData[channel_name] = channel_dict;

    });
    
    console.log("Got Histogram Data");
    console.debug(HistData);

    return HistData;

}
*/


//
// METHODS USED TO DRAW AND EDIT THE PLOT
//


function AddErrorsToData(sample_dict) {
    // See : http://code.google.com/p/flot/issues/attachmentText?id=215&aid=5246971771003358806&name=errorbars-example.html&token=YI9opDwFPKnW3XKeWqBtc3y0t_s%3A1344311014277

    var data = sample_dict['data'];
    for(var chan_itr=0; chan_itr<data.length; ++chan_itr) {
	var y_val = data[chan_itr][1];
	var error = Math.sqrt(y_val);
	data[chan_itr].push(.5); // x
	data[chan_itr].push(.5); // x
	data[chan_itr].push(error); // y
	data[chan_itr].push(error); // y
    }
    
    // Configure the appearence of points and error-bars
    data_points = {
	fillColor: "black",
	errorbars: "xy",
	radius: 1,
	xerr: {show: true, color: "black", upperCap: "-", lowerCap: "-", asymmetric: true},
	yerr: {show: true, color: "black", upperCap: "-", lowerCap: "-", asymmetric: true}
    };
    sample_dict['points'] = data_points;

}

function MakePlotFromMeasurement(measurement) {

    console.log("MakePlotFromMeasurement() using measurement:");
    console.log(measurement);

    // To make the plot, we need the following:
    // HistData["channelA"] = {"data" : data, "SampleA" : sampleA, ... }

    //var measurement = GetHistogramData();

    // First, get ALL the samples
    // across all channels
    var AllSamples = []
    var axis_labels = Array();
    //var channel_idx = -1;
    //for(var channel_name in measurement) {
	//channel_idx += 1;
    for(var channel_idx=0; channel_idx<measurement.length; ++channel_idx) {
	var channel = measurement[channel_idx];
	var channel_name = channel["name"];
	console.log("Checking Channel:" + channel_name);
	console.log(channel);
	axis_labels.push([channel_idx, channel_name]);
	// Get the samples for this channel
	var keys = [];
	for(var sample_idx=0; sample_idx<channel.samples.length; ++sample_idx) {
	    var sample = channel.samples[sample_idx];
	    if(AllSamples.indexOf(sample.name) === -1) AllSamples.push(sample.name);
	}
    }
    console.log("Found Samples: ");
    console.log(AllSamples);

    // Now, for each sample, make the dictionary of values
    // Sample[1] = ValInChannel1; 
    // Sample[2] = ValInChannel2;
    // etc
    // Loop over Samples
    var all_sample_data = new Array()

    // First, add the measured data
    var data_dict = {label: "data"};
    data_dict["stack"] = 0;
    data_dict["color"] = $.color.make(355,355,355,1); //"white";

    var data_values = new Array()
    for(var channel_idx=0; channel_idx<measurement.length; ++channel_idx) {
	var channel = measurement[channel_idx];
	data_values.push([channel_idx,channel.data]);
    }
    data_dict["data"] = data_values;
    AddErrorsToData(data_dict); // root(n)
    all_sample_data.push(data_dict);


    // Then, add additional samples
    for( var sample_idx=0; sample_idx<AllSamples.length; ++sample_idx){
	var sample_name = AllSamples[sample_idx];
	var sample_dict = {label: sample_name};

	// Get the 'data' for this sample, meaning
	// this histogram heights across channels
	console.log("Getting data for sample: " + sample_name);
	//var channel_idx = -1;
	var sample_data = new Array();
	for(var channel_idx=0; channel_idx<measurement.length; ++channel_idx) {
	    var channel = measurement[channel_idx];
	    //channel_idx += 1; 
	    
	    var channel_has_sample=false;
	    var samples_in_chan_itr=0;
	    for(; samples_in_chan_itr<channel.samples.length; ++samples_in_chan_itr) {
		if( channel.samples[samples_in_chan_itr].name == sample_name){
		    channel_has_sample=true;
		    break;
		}
	    }

	    if(channel_has_sample) {
		var sample = channel.samples[samples_in_chan_itr];
		var channel_sample_val = sample["value"]; //channel[sample_name];
		console.log("Found data for channel: " + channel["name"] 
			    + " and sample: " + sample_name + ": " 
			    + channel_sample_val); 
		sample_data.push([channel_idx, channel_sample_val]);
	    }
	    else {
		sample_data.push([channel_idx, 0.0]);
	    }
	}
	sample_dict['data'] = sample_data;

	// Add additional options to the dictionary
	if(false){
	}
	else {
	    sample_dict["stack"] = 1;
	}
	console.log("Found Sample for Plot: " + sample_name);
	console.log(sample_dict);
	
	// Finally, add this dictionary to the total list
	all_sample_data.push(sample_dict);
    }

    console.log("Drawing the following data: ");
    console.log(all_sample_data);

    // Finally, turn this data into a histogram plot
    var options = {
	series: {stack: 1,
		 lines: {show: false, steps: false },
		 bars: {show: true, barWidth: 1.0, align: 'center', lineWidth: 0.0}
		},
	xaxis: {ticks: axis_labels},
	zoom: {interactive: true}, pan: {interactive: true}
    };

    // Make the plot
    $.plot($("#plot"), all_sample_data, options);
    console.log("Successfully made plot");

    // And save this info into the html5 storage
    var measurement = GetMeasurementObject();
    console.log("Caching measurement object in local storage:");
    console.log(measurement);
    localStorage.setItem("measurement", JSON.stringify(measurement));

}

function MakePlot() {
    var measurement = GetMeasurementObject();
    MakePlotFromMeasurement(measurement);
}

// Attach this function to the proper button
$(document).ready(function() {
    $('#update_button').live('click', MakePlot)
});


// Update text inputs using enter
function UpdateOnEnter(event) {
    var code = (event.keyCode ? event.keyCode : event.which);
    if(code == 13) { 
	console.log("Found Enter");
	// Update the Plot
	MakePlot();
    }
}
$(document).ready(function() {
    $('[type=text]').live('keyup', UpdateOnEnter);
});


//
// METHODS FOR FITTING VIA THE HISTFACTORY BACK ENDy
//

function FitMeasurement() {

    // We get current measurement object
    var measurement = GetMeasurementObject();

    // Then, we package it into a JSON string
    var meas_JSON_string = JSON.stringify(measurement);

    console.log("Sending measurement as JSON String:");
    console.log(meas_JSON_string);

    // Create the call-back function
    // Hey, I just ping'd you, and this is crazy,
    // but here's my http request, so call-back maybe
    function successCallback(data) {
	if( data["flag"]=="error" ) {
	    console.log("ERROR: Failed to add Activity");
	}
	else {
	    console.log("Successfully fit measurement");
	    var fit_result = data["result"];
	    console.log(fit_result);
	    MakePlotFromMeasurement(fit_result);
	}
    }

    // Finally, we send it via AJAX to our
    // python (Flask) back end for processing
    console.log("Sending FitMeasurement http request (post via AJAX)");
    $.post( "/FitMeasurement", {measurement: meas_JSON_string}, successCallback );
    console.log("Successfully Sent FitMeasurement http request, waiting for callback");

}
$(document).ready(function() {
    $('#fit_button').live('click', FitMeasurement)
});



/* Example Plot
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
*/

/* Another Example

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
*/

