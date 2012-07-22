
$(document).ready(function() {
    console.log("Document Ready");
});


function AddNewChannel() {
    // This function is activated by the
    // 'AddNewChannel' button (duh)
    // Create a new 'channel' DOM object
    // and add it to the 'Channel_List' div,
    // which is a child of the "measurement" div

    console.log("Adding New Channel");

    // First, get a handle on the measurement div
    var measurement = document.getElementById('Channel_List');

    // Then, create our new div (not yet attached)
    var new_channel = document.createElement('div');
    new_channel.setAttribute('class', 'channel');
    new_channel.innerHTML = "This is a channel <br>";

    // Add the 'data' input field
    var data_input = document.createElement('input');
    data_input.setAttribute('type',"text");
    data_input.setAttribute('class',"data_input");
    new_channel.innerHTML += "Data:";
    new_channel.appendChild( data_input );

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

    // Finally, append the channel to the measurement
    measurement.appendChild(new_channel);

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

    // Add the 'data' input field
    var value_input = document.createElement('input');
    value_input.setAttribute('type',"text");
    value_input.setAttribute('class',"value_input");
    new_sample.innerHTML += "Value:";
    new_sample.appendChild( value_input );


    // Finally, add the sample to the list of samples
    sample_list.append(new_sample);


    
    console.log("Successfully added sample to channel");    

}
$(document).ready(function() {
    $('.NewSample').live('click', function(){
	AddSampleToChannel( $(this).parent() );
    })
});

