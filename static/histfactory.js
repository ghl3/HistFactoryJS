
$(document).ready(function() {
    console.log("Document Ready");

    $("#fit_results").hide();
    LoadCacheInfo();

});

// Define the "systematic' class
function Systematic(name, FracUp, FracDown) {
    this.name = name;
    this.FracUp = FracUp;
    this.FracDown = FracDown;
}

// Define the 'sample' class
function Sample(name) {
    this.name = name;
    this.value = 0.0;
    //this.signal = false;
    this.systematics = new Array();
}
Sample.prototype.AddSystematic = function(Name, FracUp, FracDown){
    this.systematics.push( new Systematic(Name, FracUp, FracDown) );
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


function CacheInfo() {
    // Cache all info currently
    // entered into the site

    // Save the measurement info
    var measurement = GetMeasurementObject();
    console.log("Caching measurement object in local storage:");
    console.log(measurement);
    localStorage.setItem("measurement", JSON.stringify(measurement));

}


function LoadCacheInfo() {

    if(localStorage.getItem("measurement") == null) {
	return;
    }

    var cached_measurement = JSON.parse(localStorage.getItem("measurement")); //$.Storage.get("channel_list");
    console.log(cached_measurement);

    if(cached_measurement.hasOwnProperty("channel_list")) {
	CreateChannelListDOMFromMeasurement(cached_measurement["channel_list"]);
	MakePlotFromMeasurement(cached_measurement["channel_list"]);
    }

    if(cached_measurement.hasOwnProperty("measurement_info")) {
	var measurement_info = cached_measurement["measurement_info"];

	if(measurement_info.hasOwnProperty("signal_name")) {
	    var signal_name = measurement_info["signal_name"];
	    $("#signal_name").val(signal_name);
	    console.log("Loading Cache: " + signal_name);
	}

	if(measurement_info.hasOwnProperty("lumi_uncertainty")) {
	    var lumi_uncertainty = measurement_info["lumi_uncertainty"];
	    $("#lumi_uncertainty").val(lumi_uncertainty);
	    console.log("Loading Cache: " + lumi_uncertainty);
	}

    }


    return;

}

//
// CREATE JAVASCRIPT OBJECTS FROM DOM TREE ELEMENTS:
//

function CreateSystematicListFromDOM(systematic_list_dom) {
    // Take a "sample_list" DOM element and create
    // a Javascript Array of sample objects
    
    systematic_element_list = systematic_list_dom.getElementsByClassName('systematic');

    systematic_list = new Array();

    for( var systematic_idx = 0; systematic_idx < systematic_element_list.length; systematic_idx++) {
	var systematic_element = systematic_element_list[systematic_idx];

	var name  = systematic_element.getElementsByClassName('systematic_name')[0].value;
	var FracUp   = systematic_element.getElementsByClassName('systematic_FracUp')[0].value;
	var FracDown = systematic_element.getElementsByClassName('systematic_FracDown')[0].value;

	console.log("Creating Systematic: Name=" + name + " FracUp=" + FracUp + " FracDown=" + FracDown );

	var systematic = new Systematic(name, FracUp, FracDown);
	systematic_list.push(systematic);
    }

    return systematic_list;
}



function CreateSampleListFromDOM(sample_list_dom) {
    // Take a "sample_list" DOM element and create
    // a Javascript Array of sample objects
    
    sample_element_list = sample_list_dom.getElementsByClassName('sample');

    sample_list = new Array();

    for( var sample_idx = 0; sample_idx < sample_element_list.length; sample_idx++) {
	var sample_element = sample_element_list[sample_idx];

	var name  = sample_element.getElementsByClassName('sample_name')[0].value;
	var value = sample_element.getElementsByClassName('sample_value')[0].value;

	console.log("Creating Sample: Name=" + name + " value=" + value );

	var sample = new Sample(name);
	sample.value = value;

	// Get the systematics and add them
	// to this sample
	var systematic_list = CreateSystematicListFromDOM( sample_element.getElementsByClassName('systematic_list')[0] );
	sample.systematics = systematic_list;

	sample_list.push(sample);
    }

    return sample_list;
}

function CreateChannelFromDOM(chan_obj) {
    // Take a Channel DOM element and
    // create a javascript channel object

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

    var measurement_info = {};
    measurement_info["signal_name"] = $("#signal_name").val();
    measurement_info["lumi_uncertainty"] = $("#lumi_uncertainty").val();

    var channel_list_object = new Array();

    // Get the list of channels
    var channel_list_element = $('.channel');
    for(var channel_idx = 0; channel_idx < channel_list_element.length; ++channel_idx){
	channel = channel_list_element[channel_idx];
	channel_list_object.push(CreateChannelFromDOM(channel));
    }
    
    var measurement = {};
    measurement["measurement_info"] = measurement_info;
    measurement["channel_list"] = channel_list_object;

    console.log("Final Measurement:");
    console.log(measurement);

    return measurement;

} 


//
// CREATE DOM TREE ELEMENTS FROM JAVASCRIPT OBJECTS:
//

function CreateDOMFromSystematic(systematic) {
    // Create a DOM Systematic element
    // from a Javascript Systematic object
    var systematic_element = document.createElement('div');    
    systematic_element.setAttribute('class', 'systematic');

    // Add the 'name' input field
    var systematic_name = document.createElement('input');
    systematic_name.setAttribute('type',"text");
    systematic_name.setAttribute('class',"systematic_name");
    systematic_name.setAttribute('value', systematic.name );
    systematic_element.innerHTML += "Syst:";
    systematic_element.appendChild( systematic_name );

    // Add the 'FracUp' input field
    var systematic_FracUp = document.createElement('input');
    systematic_FracUp.setAttribute('type',"text");
    systematic_FracUp.setAttribute('class',"systematic_FracUp");
    systematic_FracUp.setAttribute('value', systematic.FracUp );
    systematic_element.innerHTML += "Up:";
    systematic_element.appendChild( systematic_FracUp );

    // Add the 'FracDown' input field
    var systematic_FracDown = document.createElement('input');
    systematic_FracDown.setAttribute('type',"text");
    systematic_FracDown.setAttribute('class',"systematic_FracDown");
    systematic_FracDown.setAttribute('value', systematic.FracDown );
    systematic_element.innerHTML += "Down:";
    systematic_element.appendChild( systematic_FracDown );

    // Add a button to delete this div
    var deletebutton = document.createElement('img');
    deletebutton.name      = "DeleteSystematicButton";
    deletebutton.className = "DeleteSystematicButton";
    deletebutton.src =  'static/images/RedX.jpg';
    deletebutton.style.width  =  '13px';
    deletebutton.style.marginLeft  = '2px';
    deletebutton.style.marginRight = '2px';
    systematic_element.appendChild( deletebutton );


    return systematic_element;

}

function DeleteSystematic() {
    console.log("Deleting Systematic");
    $(this).parent().remove();   
    // Update the Plot
    MakePlot();
    CacheInfo();
    return;
}
$(document).ready(function() {
    $('.DeleteSystematicButton').live('click', DeleteSystematic);
});



function CreateDOMFromSample(sample) {
    // Create a DOM Sample element
    // from a Javascript Sample object

    // First, create the new sample
    var sample_element = document.createElement('div');
    sample_element.setAttribute('class', 'sample');
    //sample_element.innerHTML = "Sample <br>";
    
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

    // Add a checkbox for signal
    /*
    var checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.name = "is_signal";
    checkbox.name = "is_signal";
    //var label = document.createElement('label')
    //label.appendChild(document.createTextNode('sig'))
    //sample_element.appendChild(label);
    sample_element.appendChild(checkbox);
*/

    
    // Add a button to delete this div
    var deletebutton = document.createElement('img');
    deletebutton.name      = "DeleteSampleButton";
    deletebutton.className = "DeleteSampleButton";
    deletebutton.src =  'static/images/RedX.jpg';
    deletebutton.style.width  =  '13px';
    deletebutton.style.marginLeft  = '2px';
    deletebutton.style.marginRight = '2px';
    sample_element.appendChild( deletebutton );

    // Add the list of systematics
    var systematic_list = document.createElement('div');
    systematic_list.setAttribute('class', 'systematic_list');
    for(var syst_itr=0; syst_itr<sample.systematics.length; ++syst_itr) {
	systematic_list.appendChild( CreateDOMFromSystematic(sample.systematics[syst_itr]) );
    }
    sample_element.appendChild( systematic_list );


    // New Systematic
    var add_systematic = document.createElement('button');
    add_systematic.name      = "NewSystematic";
    add_systematic.className = "NewSystematic";
    add_systematic.innerHTML = "Add Systematic";
    
    //add_systematic.style.width  =  '20px';
    add_systematic.style.marginLeft  = '2px';
    add_systematic.style.marginRight = '2px';
    sample_element.appendChild( add_systematic );
    sample_element.innerHTML += "<br>";

    // Finally, add the sample to the list of samples
    return sample_element;
}

function DeleteSample() {
    console.log("Deleting Sample");
    $(this).parent().remove();   
    // Update the Plot
    MakePlot();
    CacheInfo();
    return;
}
$(document).ready(function() {
    $('.DeleteSampleButton').live('click', DeleteSample);
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
    //new_channel.appendChild( document.createElement('br') );

    // Add the 'data' input field
    var channel_data = document.createElement('input');
    channel_data.setAttribute('type',"text");
    channel_data.setAttribute('class',"channel_data");
    channel_data.setAttribute('value', channel.data );
    new_channel.innerHTML += "Data:";
    new_channel.appendChild( channel_data );

    // Add the list of samples div
    var sample_list = document.createElement('div');
    sample_list.innerHTML += "Samples: <br>";
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
    CacheInfo();
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


function CreateFittedValueDOMTable(fitted_param_list){
    // Expects a list of dictionaries
    // of the following form:
    // [ {"name" : name, "val" : val,
    //    "error": error, "errorLo" : errorLo, "errorHi" : errorHi}, ... ]
    
    // Create the Table
    var table = document.createElement('table');
    table.setAttribute('id', 'fitted_table');

    // Add the Title
    var row = table.insertRow(0);

    var cell = row.insertCell(0);
    cell.innerHTML = "Param";
    var cell = row.insertCell(1);
    cell.innerHTML = "Fitted Val";
    var cell = row.insertCell(2);
    cell.innerHTML = "Error";

    for(var param_itr=0; param_itr<fitted_param_list.length; ++param_itr) {
	var dict = fitted_param_list[param_itr];

	var row = table.insertRow(param_itr+1);
	var cell = row.insertCell(0);
	cell.innerHTML = dict['name'];
	cell.width='60px';
	var cell = row.insertCell(1);
	cell.innerHTML = dict['val'].toPrecision(4);
	cell.width='100px';
	var cell = row.insertCell(2);
	cell.innerHTML = dict['error'].toPrecision(4);
	cell.width='100px';
    }
    
    return table;

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

    // Add the new channel to the Channel_List DOM Element
    var channel_list = document.getElementById('Channel_List');
    var channel_element = CreateDOMFromChannel(new_channel);
    channel_list.appendChild(channel_element);

    console.log("Successfully Added a New Channel");

    return;
}
// Attach this function to the proper button
$(document).ready(function() {
    $('#NewChannel').live('click', AddNewChannel);
});



function AddSampleToChannel(channel) {

    console.log("Adding Sample To Channel");    

    var new_sample = new Sample("");

    // Add the sample to the 'sample_list' DOM Element
    var sample_list = channel.find(".sample_list");
    var sample_element = CreateDOMFromSample(new_sample);
    sample_list.append(sample_element);
    
    console.log("Successfully added sample to channel");    

    return;
}
$(document).ready(function() {
    $('.NewSample').live('click', function(){
	AddSampleToChannel( $(this).parent() );
    })
});

function AddSystematicToSample(sample) {

    console.log("Adding Systematic To Sample");

    var new_systematic = new Systematic("", 1.0, 1.0);

    // Add the systematic to the systematic_list DOM element
    var systematic_list = sample.find(".systematic_list");
    var systematic_element = CreateDOMFromSystematic(new_systematic);
    systematic_list.append(systematic_element);
    
    console.log("Successfully added systematic to channel");    

    return;
}
$(document).ready(function() {
    $('.NewSystematic').live('click', function(){
	AddSystematicToSample($(this).parent());
	MakePlot();
	CacheInfo();
    })
});


//
// METHODS USED TO DRAW AND EDIT THE PLOT
//


function AddErrorsToData(sample_dict) {
    // See : http://code.google.com/p/flot/issues/attachmentText?id=215&aid=5246971771003358806&name=errorbars-example.html&token=YI9opDwFPKnW3XKeWqBtc3y0t_s%3A1344311014277

    var MaxVal = 0.0;

    var data = sample_dict['data'];
    for(var chan_itr=0; chan_itr<data.length; ++chan_itr) {
	var y_val = data[chan_itr][1];
	var error = Math.sqrt(y_val);
	data[chan_itr].push(.5); // x
	data[chan_itr].push(.5); // x
	data[chan_itr].push(error); // y
	data[chan_itr].push(error); // y

	// Be sure to add floats and not strings
	// lol wat?  Thanks javascript :( 
	MaxVal = Math.max(MaxVal, parseFloat(y_val)+parseFloat(error));
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

    return MaxVal;

}

function MakePlotFromMeasurement(measurement) {
    // This method actually draws the plot using
    // the data in a Javascript measurement object

    console.log("MakePlotFromMeasurement() using measurement:");
    console.log(measurement);

    // First, get ALL the samples
    // across all channels and
    // create the x-axis labels
    var AllSamples = []
    var axis_labels = Array();
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

    // Create an object to store all bin heights
    var all_sample_data = new Array()

    // Add the measured data bin heights
    // as well as error bars
    var data_dict = {label: "data"};
    data_dict["stack"] = 0;
    data_dict["color"] = $.color.make(355,355,355,1); //"white";
    var data_values = new Array()
    for(var channel_idx=0; channel_idx<measurement.length; ++channel_idx) {
	var channel = measurement[channel_idx];
	data_values.push([channel_idx,channel.data]);
    }
    data_dict["data"] = data_values;

    // Add errors and get max height
    var MaxVal = AddErrorsToData(data_dict); // root(n)
    console.log("Max value from data: " + MaxVal);
    all_sample_data.push(data_dict);


    // Then, add the bin heights for 
    // all additional samples
    for( var sample_idx=0; sample_idx<AllSamples.length; ++sample_idx){
	var sample_name = AllSamples[sample_idx];
	var sample_dict = {label: sample_name};

	// Set the samples to be stacked
	sample_dict["stack"] = 1;

	// Get the bin heightsfor this sample
	// across all channels
	console.log("Getting data for sample: " + sample_name);
	//var channel_idx = -1;
	var sample_data = new Array();
	for(var channel_idx=0; channel_idx<measurement.length; ++channel_idx) {
	    var channel = measurement[channel_idx];

	    // Check if this channel 
	    // contains the current sample
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
		var channel_sample_val = sample["value"];
		MaxVal = Math.max(MaxVal, channel_sample_val);
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

	// Finally, add this dictionary to the total list
	console.log("Found Sample for Plot: " + sample_name);
	console.log(sample_dict);
	all_sample_data.push(sample_dict);
    }

    console.log("Drawing the following data: ");
    console.log(all_sample_data);

    // Create the overall options for the plot
    var options = {
	series: {stack: 1,
		 lines: {show: false, steps: false },
		 bars: {show: true, barWidth: 1.0, align: 'center', lineWidth: 0.0}
		},
	xaxis: {ticks: axis_labels},
	yaxis: {max: MaxVal*1.2},
	zoom: {interactive: true}, pan: {interactive: true}
    };

    // Make the plot itself
    $.plot($("#plot"), all_sample_data, options);
    console.log("Successfully made plot");

}

function MakePlot() {
    // Make the plot based on the
    // current values in the DOM
    var measurement = GetMeasurementObject();
    MakePlotFromMeasurement(measurement["channel_list"]);
    CacheInfo();
}

// Attach this function to the proper button
$(document).ready(function() {
    $('#update_button').live('click', function() {
	MakePlot();
        CacheInfo();
	$("#fit_results").hide();
    });
});


// Update text inputs using enter
function UpdateOnEnter(event) {
    var code = (event.keyCode ? event.keyCode : event.which);
    if(code == 13) { 
	console.log("Found Enter");
	// Update the Plot
	MakePlot();
	CacheInfo();
    }
}
$(document).ready(function() {
    $('[type=text]').live('keyup', UpdateOnEnter);
});


//
// METHODS FOR FITTING VIA THE HISTFACTORY BACK END
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

	    // Make the fitted plot
	    var fitted_bins = data["fitted_bins"];
	    MakePlotFromMeasurement(fitted_bins)
	    console.log(fitted_bins);

	    // Print the fitted values
	    console.log("Fitted Values:");
	    console.log(data['fitted_params']);
	    var table_element = CreateFittedValueDOMTable(data['fitted_params']);
	    $('#fitted_table').replaceWith(table_element);

	    // Show the Profile Likelihood
	    var profile_png = data["profile_png"];
	    console.log("Found Profile Likelihood png:");
	    console.log(profile_png);
	    $("#profile_likelihood").attr("src", profile_png);

	    // Show the info
	    $('#fit_results').show();

	    /*
	    var profile_img = new Image();
	    profile_img.src = profile_png;
	    profile_img.width = "500px";
	    $("profile_likelihood").append(profile_img);
            */
	    //$("#profile_likelihood").html('<img alt="profile_likelihood" src="' + profile_png + '">');

	}
    }

    // Finally, we send it via AJAX to our
    // python (Flask) back end for processing
    console.log("Sending FitMeasurement http request (post via AJAX)");
    $.post( "/FitMeasurement", {measurement: meas_JSON_string}, successCallback );
    console.log("Successfully Sent FitMeasurement http request, waiting for callback");

}
$(document).ready(function() {
    $('#fit_button').live('click', function() {
	CacheInfo();
	FitMeasurement();
    });
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

