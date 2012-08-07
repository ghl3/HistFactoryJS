
$(document).ready(function() {
    console.log("Document Ready");
    
    if(localStorage.getItem("measurement") != null) {
	console.log(localStorage.getItem("measurement"));
	var cached_measurement = JSON.parse(localStorage.getItem("measurement")); //$.Storage.get("channel_list");
	console.log("Using cached measurement:");
	console.log(cached_measurement);
	CreateChannelListDOMFromMeasurement(cached_measurement);
	MakePlot();
    }
    
    //$('#Channel_List').html(channel_list_from_storage);

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


function CreateDOMFromSample(sample) {

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
    return;
}
$(document).ready(function() {
    $('.DeleteSampleButton').live('click', DeleteSample)
});



function CreateDOMFromChannel(channel) {

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
    //AppendDOMSamplesToList( sample_list, channel.samples);
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
    return;
}
$(document).ready(function() {
    $('.DeleteChannelButton').live('click', DeleteChannel)
});




function CreateChannelListDOMFromMeasurement(measurement) {

    // First, get a handle on the channel_list div
    var channel_list = document.getElementById('Channel_List');

    for( var channel_itr=0; channel_itr<measurement.length; channel_itr++) {
	var channel_element = CreateDOMFromChannel( measurement[channel_itr] );
	channel_list.appendChild(channel_element);
    }

    console.log("Successfully created channel DOM from measurement");

}


///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////


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

    /*
    // Then, create our new div (not yet attached)
    var new_channel = document.createElement('div');
    new_channel.setAttribute('class', 'channel');
    new_channel.innerHTML = "Channel <br>";

    // Add the 'name' input field
    var channel_name = document.createElement('input');
    channel_name.setAttribute('type',"text");
    channel_name.setAttribute('class',"channel_name");
    new_channel.innerHTML += "Name:";
    new_channel.appendChild( channel_name );

    // Add a Line Break
    new_channel.appendChild( document.createElement('br') );

    // Add the 'data' input field
    var channel_data = document.createElement('input');
    channel_data.setAttribute('type',"text");
    channel_data.setAttribute('class',"channel_data");
    new_channel.innerHTML += "Data:";
    new_channel.appendChild( channel_data );

    // Add the list of samples div
    var sample_list = document.createElement('div');
    sample_list.setAttribute('class', 'sample_list');
    new_channel.appendChild( sample_list );
    
    // Add a 'new sample' button to the channel
    var new_sample_button = document.createElement('input');
    new_sample_button.setAttribute('type','button');
    new_sample_button.setAttribute('class','NewSample');
    new_sample_button.setAttribute('value','Add New Sample');
    new_channel.appendChild( new_sample_button );

    // Finally, append the channel to the channel_list
    channel_list.appendChild(new_channel);

    console.log("Successfully Added a New Channel");
*/

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

    /*
    // Then, add the new sample
    var new_sample = document.createElement('div');
    new_sample.setAttribute('class', 'sample');
    new_sample.innerHTML = "Sample <br>";

    // Add the 'name' input field
    var sample_name = document.createElement('input');
    sample_name.setAttribute('type',"text");
    sample_name.setAttribute('class',"sample_name");
    new_sample.innerHTML += "Name:";
    new_sample.appendChild( sample_name );

    // Add the 'value' input field
    var sample_value = document.createElement('input');
    sample_value.setAttribute('type',"text");
    sample_value.setAttribute('class',"sample_value");
    new_sample.innerHTML += "Value:";
    new_sample.appendChild( sample_value );

    // Finally, add the sample to the list of samples
    sample_list.append(new_sample);
    
    console.log("Successfully added sample to channel");    
*/
}
$(document).ready(function() {
    $('.NewSample').live('click', function(){
	AddSampleToChannel( $(this).parent() );
    })
});

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
// Attach this function to the proper button
$(document).ready(function() {
    $('#fit_button').live('click', GetHistogramData)
});

$(document).ready(function() {
    $('#update_button').live('click', MakePlot)
});


// Update text inputs using enter
$(document).ready(function() {
    console.log("Setting Enter key");
    $('input[type="text"]').keyup(function(event){
	console.log("Found Key: " + event.keyCode);
	var code = (event.keyCode ? event.keyCode : event.which);
	if(code == 13) { 
	    console.log("Found Enter");
	    MakePlot();
	}
    });
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
		if(channel_sample_val == 0) {
		    // continue;
		}
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

    console.log("Drawing the following data: ");
    console.log(data);

    // Explicitely put data at the end

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

