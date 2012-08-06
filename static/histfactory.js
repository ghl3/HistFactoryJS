
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
    this.value = 0;
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
    sample_element.innerHTML = "This is a sample <br>";
    
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
    
    // Finally, add the sample to the list of samples
    return sample_element;
}

function CreateDOMFromChannel(channel) {

    console.log("Adding New Channel");

    // First, create our new div (not yet attached)
    var new_channel = document.createElement('div');
    new_channel.setAttribute('class', 'channel');
    new_channel.innerHTML = "This is a channel <br>";

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

    // First, get a handle on the channel_list div
    var channel_list = document.getElementById('Channel_List');

    // Then, create our new div (not yet attached)
    var new_channel = document.createElement('div');
    new_channel.setAttribute('class', 'channel');
    new_channel.innerHTML = "This is a channel <br>";

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

}
// Attach this function to the proper button
$(document).ready(function() {
    $('#NewChannel').live('click', AddNewChannel)
});



function AddSampleToChannel(channel) {

    console.log("Adding Sample To Channel");    

    // First, get the list of samples for this channel
    var sample_list = channel.find(".sample_list");
    
    // Then, add the new sample
    var new_sample = document.createElement('div');
    new_sample.setAttribute('class', 'sample');
    new_sample.innerHTML = "This is a sample <br>";

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
