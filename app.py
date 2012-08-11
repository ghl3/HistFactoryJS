#!/usr/bin/env python

import os

import json
#import simplejson

from flask import Flask
from flask import url_for
from flask import render_template
from flask import request
from flask import jsonify

import ROOT

import random
import copy

app = Flask(__name__)

ROOT.SetMemoryPolicy( ROOT.kMemoryStrict )
ROOT.gROOT.SetBatch(True)

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/FitMeasurement', methods=['GET', 'POST'])
def FitMeasurement():
    """ Take a POST http request and return fit info to client javascript

    Given a JSON measurement string, create a result that contains:

    - A list of fitted values for parameters (for a table)
    - A list of fitted bin heights (for plotting)

    Include a success flag in the return object

    """

    # Apply some sanity checks
    if request.method != 'POST':
        print "FitMeasurement() - ERROR: Expected POST http request"
        return jsonify(flag="error")

    # Get the data to be fit from the JSON
    measurement_string_JSON = request.form['measurement']
    measurement_dict = json.loads( measurement_string_JSON )

    # Get the RooFitResult and the Fitted Value Dict
    (fit_result, fitted_bins, profile_png) = CreateHistFactoryFromMeasurement(measurement_dict)    
    fitted_params = MakeFittedValDictFromFitResult(fit_result)

    print "Fitted Bins: ", fitted_bins

    # Copy the original measurement, and then we will modify
    # the sample values
    fitted_measurement = copy.deepcopy(measurement_dict["channel_list"])

    for channel in fitted_measurement:
        channel_name = channel["name"]
        for sample in channel["samples"]:
            sample_name = sample["name"]
            sample["value"] = fitted_bins[channel_name][sample_name]
            #random.uniform(.9, 1.1)*float(sample["value"])
        pass

    # Clean Up
    fit_result.IsA().Destructor( fit_result )
    #fit_result.Delete()
    #del fit_result

    # Success
    return jsonify(flag="success", 
                   fitted_params=fitted_params, fitted_bins=fitted_measurement, 
                   profile_png=profile_png)


def CreateHistFactoryFromMeasurement(measurement_dict, options=None):
    """ 
    Create a HistFactory model from a list of channel
    dictionaries, each giving data and a set of samples
    and systematics.

    The input object looks like this:
    
    [ {name:"MyChannelA", data:"35", samples:[{name:"ttbar", value:12}, {name:"WJets", value:20] }, 
      {name:"MyChannelB", data:"40", samples:[{name:"ttbar", value:18}, {name:"WJets", value:23] }, 
    ...
    ]

    Create the HistFactory object, make a workspace, fit
    the workspace, and return the RooFitResult

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
    #canvas.SaveAs( plot_name );
    png_string = CanvasToPngString(canvas)
    return png_string
    

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
    """
    This is just a place-holder module
    to get the fitted bin heights from a 
    histfactory model

    It will be incorproated into app.py
    when (if) it works...
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
        '''
        continue

        dataHistName = str("hData_" + tt.GetName())
        obs = obstmp.first()
        dataHist = dataForChan.RooAbsData.createHistogram("myDataHist", obs)
        #dataHist = dataForChan.createHistogram("myDataHist"dataHistName, obs)
        channelDataVec.append(dataHist)
        '''

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



if __name__ == '__main__':
    # Bind to PORT if defined, otherwise default to 5000.
    port = int(os.environ.get('PORT', 5000))
    app.debug = True
    app.run(host='0.0.0.0', port=port)
    

