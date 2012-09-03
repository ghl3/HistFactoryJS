
import json
import copy
import os

from flask import url_for
from flask import render_template
from flask import request
from flask import jsonify

import ROOT

import subprocess


"""
This module implements the functions that
receive http requests. 

It is separated so that another Flask app
can import these functons only and not import
the local app defined in this module

"""


def ProcessMeasurementRequest(request):
    """ Take a POST http request and return fit info to client javascript

    Check that the request is a POST
    Extract the 'measurement' dictionary from the request form
    Pass it to the FitMeasurement method and return the result

    """

    # Apply some sanity checks
    if request.method != 'POST':
        print "FitMeasurement() - ERROR: Expected POST http request"
        return jsonify(flag="error")

    print "Processing MeasurementRequest:"
    print request

    # Get the data to be fit from the JSON
    measurement_string_JSON = request.form['measurement']
    measurement_dict = json.loads( measurement_string_JSON )

    fitted_params, fitted_bins, profile_png = FitMeasurement(measurement_dict)

    print "fitted_params: ", fitted_params
    print "fitted_bins: ", fitted_bins
    print "profile_png: ", profile_png

    return jsonify(flag="success", 
                   fitted_params=fitted_params, fitted_bins=fitted_bins,
                   profile_png=profile_png)


def ProcessMeasurementRequestParallel(request, base_dir='.'):
    """ Open a new system process to process the measurment request

    Take the input request, 
    send it to the 'fitMeasurement.py' script as a json
    string through the command line, 
    get the std::cout return and parse it, 
    and return the response as a json string
    """

    print "Processing RequestMeasurement in Parallel:"
    print request, request.form

    # Apply some sanity checks
    if request.method != 'POST':
        print "FitMeasurement() - ERROR: Expected POST http request"
        return jsonify(flag="error")

    # Get the data to be fit from the JSON
    measurement_string_JSON = request.form['measurement']

    # Call the external script
    print "Opening Subprocess"
    script_location = base_dir + '/' + 'fitMeasurement.py'
    p = subprocess.Popen([script_location, measurement_string_JSON], stdout=subprocess.PIPE)
    out, err = p.communicate()
    print "Subprocess successfully executed"

    # Use the deliminator to determine where
    # the desired dict is in the output
    delim = 'BEGIN_HERE'
    out = out[out.find(delim)+len(delim):]
    json_string = out
    result_json = json.loads(json_string)

    fitted_params = result_json['fitted_params'] 
    fitted_bins = result_json['fitted_bins'] 
    profile_png = result_json['profile_png']

    print "Returning result"
    return jsonify(flag="success", 
                   fitted_params=fitted_params, fitted_bins=fitted_bins,
                   profile_png=profile_png)


def FitMeasurement(measurement_dict):
    """ Build a model and fit based on a measurement_dict
    
    The input measurement_dict has the following form:
    {'channel_list' : [{channel_a_dict}, {channel_b_dict}, {channel_c_dict}],
     'measurement_info' : {} }

    Given a JSON-style measurement string, 
    create a result that contains:

    - A list of fitted values for parameters (for a table)
    - A list of fitted bin heights (for plotting)

    Include a success flag in the return object

    """

    # Get the RooFitResult and the Fitted Value Dict
    (fit_result, fitted_bin_values, profile_png) = CreateHistFactoryFromMeasurement(measurement_dict)    
    fitted_params = MakeFittedValDictFromFitResult(fit_result)

    print "Fitted Bins: ", fitted_bin_values

    # Copy the original measurement, and then we will modify
    # the sample values
    fitted_bins = copy.deepcopy(measurement_dict["channel_list"])

    for channel in fitted_bins:
        channel_name = channel["name"]
        for sample in channel["samples"]:
            sample_name = sample["name"]
            sample["value"] = fitted_bin_values[channel_name][sample_name]
        pass

    # Clean Up
    fit_result.IsA().Destructor( fit_result )

    return (fitted_params, fitted_bins, profile_png)


def CreateHistFactoryFromMeasurement(measurement_dict, options=None):
    """ 
    Create a HistFactory model from a list of channel
    dictionaries, each giving data and a set of samples
    and systematics.

    The input object looks like this:
    {'channel_list' :  [ {name:"MyChannelA", data:"35", samples:[{name:"ttbar", value:12}, {name:"WJets", value:20] }, 
                         {name:"MyChannelB", data:"40", samples:[{name:"ttbar", value:18}, {name:"WJets", value:23] }, 
                         ... ],
    'measurement_info' : {lumi_uncertainty: "0.036", signal_name: "ttbar"} }


    Create the HistFactory object, 
    make a workspace, 
    fit the workspace, 
    get the fitted parameters, 
    get the roofitresult,
    and get the likelihood curve as a png string.
    Return these guys.

    """
    
    channel_list = measurement_dict["channel_list"]
    measurement_info = measurement_dict["measurement_info"]

    # Get the name of the sample
    # that is interpreted as signal
    signal_sample = str(measurement_info["signal_name"])
    SigmaVarName = "Sigma_" + signal_sample + "_OverSM"; 

    meas = ROOT.RooStats.HistFactory.Measurement("meas", "meas")
    meas.SetPOI( SigmaVarName )
    meas.SetLumi( 1.0 )
    meas.SetLumiRelErr( float(measurement_info["lumi_uncertainty"]) )
    meas.SetExportOnly( False )
    
    for chan_dict in channel_list:
        chan = ROOT.RooStats.HistFactory.Channel( str(chan_dict["name"]) )
        chan.SetData( float(chan_dict['data']) )
        # chan.SetStatErrorConfig( 0.05, "Poisson" )
        
        for sample_dict in chan_dict["samples"]:
            sample_name = sample_dict["name"]
            sample = ROOT.RooStats.HistFactory.Sample( str(sample_name) )
            for syst in sample_dict["systematics"]:                
                sample.AddOverallSys( str(syst["name"]),  float(syst["FracDown"]), float(syst["FracUp"]) )
            sample.SetValue( float(sample_dict['value']) )
            if sample_name == signal_sample:
                sample.AddNormFactor( SigmaVarName, 1, 0, 3 )
            chan.AddSample( sample )
        
        meas.AddChannel( chan )
        
    # Now, print and do the fit
    meas.PrintTree();

    # Fit the workspace
    wspace = ROOT.RooStats.HistFactory.HistoToWorkspaceFactoryFast.MakeCombinedModel( meas );
    combined_config = wspace.obj("ModelConfig");
    simData = wspace.data("obsData");
    constrainedParams = combined_config.GetNuisanceParameters();
    POIs = combined_config.GetParametersOfInterest();
    
    # RooCmdArg("Minos",kTRUE,0,0,0,0,0,&minosArgs,0)

    model = combined_config.GetPdf();
    fit_result = model.fitTo(simData, ROOT.RooCmdArg("Minos",True,0,0,0,"","",ROOT.RooArgSet(wspace.var(SigmaVarName)),0), 
                             ROOT.RooCmdArg("PrintLevel",1), 
                             ROOT.RooCmdArg("Save",True));

    # Get the Likelihood curve
    POI = wspace.var(SigmaVarName)
    png_string = CreateProfileLikelihoodPlot(model, simData, POI)

    # Get the Fitted Bins
    fitted_bins = getFittedBinHeights(combined_config, simData)

    # Delete the model
    wspace.IsA().Destructor( wspace )
    meas.IsA().Destructor( meas )

    return (fit_result, fitted_bins, png_string)


def MakeFittedValDictFromFitResult(result):
    """ Given a RooFitResult, find the fitted parameters
    as well as their errors as a list of dictionaries
    
    """
    fit_result_list = []

    pars = result.floatParsFinal()
    num_params = pars.getSize()
    for param_itr in range(num_params):
        param = pars.at(param_itr)

        param_dict = {}
        param_dict["name"] = param.GetName()
        param_dict["val"] = param.getVal()
        param_dict["error"] = param.getError()
        param_dict["errorLo"] = param.getErrorLo()
        param_dict["errorHi"] = param.getErrorHi()

        fit_result_list.append(param_dict)

    return fit_result_list


def getFittedBinHeights(model_config, data):
    """ Get the fitted bin heights 

    Take the pdf in the model_config, 
    when fitted to data, and return a dictionary
    of the bin heights

    """

    modelPdf = model_config.GetPdf();
    
    if modelPdf.ClassName()!="RooSimultaneous":
        raise Exception("Expected RooSimultaneous as pdf")

    simPdf = modelPdf
    channelCat = simPdf.indexCat()

    dataByCategory = data.split(channelCat)

    channelPdfVec=[]
    channelObservVec=[]
    channelNameVec=[]

    # Loop over channels
    chan_itr=channelCat.typeIterator()
    while True:
        tt = chan_itr.Next()
        if tt == None: break

        print "Working on channel: ", tt.GetName()
        pdftmp = simPdf.getPdf(tt.GetName())
        obstmp = simPdf.getObservables(model_config.GetObservables())
        dataForChan=dataByCategory.FindObject(tt.GetName())

        print "Found observables and pdf: ", pdftmp.GetName(), obstmp.GetName(), dataForChan.GetName()

        channelPdfVec.append(pdftmp)
        channelObservVec.append(obstmp)
        channelNameVec.append(tt.GetName())

    channelSumNodeVec=[]

    # Now, loop over the channel pdf's
    for (name, pdf) in zip(channelNameVec, channelPdfVec):
        
        # Loop over the components
        components=pdf.getComponents()
        argItr=components.createIterator()
        while True:
            arg = argItr.Next()
            if arg == None: break

            ClassName=arg.ClassName()
            if ClassName == "RooRealSumPdf":
                channelSumNodeVec.append(arg)
                print "Found RooRealSumPdf: ", arg.GetName()
                break
            pass
        pass

    # Make the dictionary to be returned
    fitted_bin_heights = {}

    # Now we have all the SumPdf's
    # Let's get the values
    for (Channel, pdf, observables, sumPdf) in zip(channelNameVec, channelPdfVec, channelObservVec, channelSumNodeVec):

        fitted_bin_heights[Channel] = {}

        nodes = sumPdf.funcList()
        sampleItr = nodes.createIterator()
        while True:
            sample = sampleItr.Next()
            if sample == None: break

            SampleName = sample.GetName()
            SampleName = SampleName.replace("L_x_", "")
            SampleName = SampleName[ : SampleName.find(Channel)-1]

            fitted_bin_heights[Channel][SampleName] = sample.getVal()

            print "Channel: %s Sample: %s Pdf: %s Val: %s" % (Channel, SampleName, sample.GetName(), sample.getVal())
        pass

    return fitted_bin_heights


def CreateProfileLikelihoodPlot(model, data, poi):
    """ Save a ProfileLikelihood curve given a model and parameter

    """

    nll = model.createNLL(data);
    profile = nll.createProfile(ROOT.RooArgSet(poi));       

    frame = poi.frame();
    ROOT.RooStats.HistFactory.FormatFrameForLikelihood(frame)

    nll.plotOn(frame, ROOT.RooCmdArg("ShiftToZero",True), 
               ROOT.RooCmdArg("LineColor",ROOT.kRed), 
               ROOT.RooCmdArg("LineStyle",ROOT.kDashed) );
    profile.plotOn(frame);
    frame.SetMinimum(0);
    frame.SetMaximum(2.);
    canvas = ROOT.TCanvas( "Profile Likelihood", "", 800,600);
    frame.Draw("goff");
    png_string = CanvasToPngString(canvas)
    return png_string


def CanvasToPngString(canvas):
    """ Return a string representing the png of a TCanvas

    We do this by running a subprocess where we print the canvas
    and then pipe the subprocess' stdout to our return string.
    (Hold on to your butts)

    """

    temp_file_name = "temp_io.png"
    canvas.Print(temp_file_name)    
    image = open(temp_file_name, 'r')

    data_uri = image.read().encode("base64")
    img_html_src = "data:image/png;base64,%s" % data_uri

    image.close()
    os.remove(temp_file_name)

    return img_html_src
