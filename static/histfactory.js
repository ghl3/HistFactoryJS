
$(document).ready(function() {
    console.log("Document Ready");
});


function AddNewChannel() {
    // This function is activated by the
    // 'AddNewChannel' button (duh)
    // Create a new 'channel' DOM object
    // and add it to the 'measurement' div

    console.log("Adding New Channel");

    // First, get a handle on the measurement div
    var measurement = document.getElementById('measurement');

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