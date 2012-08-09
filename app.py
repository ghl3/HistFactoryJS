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
    fit_result = CreateHistFactoryFromMeasurement(measurement_dict)    
    fitted_params = MakeFittedValDictFromFitResult(fit_result)

    # For now, just a dummy for the Fitted Bin Height Dict
    fitted_bins = copy.deepcopy(measurement_dict)
    
    for channel in fitted_bins:
        channel["data"] = float(channel["data"])
        
        for sample in channel["samples"]:
            sample["value"] = random.uniform(.9, 1.1)*float(sample["value"])
        pass

    # Clean Up
    fit_result.Delete()
    del fit_result

    # Success
    return jsonify(flag="success", fitted_params=fitted_params, fitted_bins=fitted_bins)


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

    meas = ROOT.RooStats.HistFactory.Measurement("meas", "meas")
    
    meas.SetPOI( "SigXsecOverSM" )
    meas.SetLumi( 1.0 )
    meas.SetLumiRelErr( 0.10 )
    meas.SetExportOnly( False )
    
    for chan_dict in measurement_dict:
        chan = ROOT.RooStats.HistFactory.Channel( str(chan_dict["name"]) )
        chan.SetData( float(chan_dict['data']) )
        # chan.SetStatErrorConfig( 0.05, "Poisson" )
        
        for sample_dict in chan_dict["samples"]:
            sample_name = sample_dict["name"]
            sample = ROOT.RooStats.HistFactory.Sample( str(sample_name) )
            for syst in sample_dict["systematics"]:                
                sample.AddOverallSys( str(syst["name"]),  float(syst["FracDown"]), float(syst["FracUp"]) )
            sample.SetValue( float(sample_dict['value']) )
            if sample_dict["signal"]:
                sample.AddNormFactor( "SigXsecOverSM", 1, 0, 3 )
            chan.AddSample( sample )
        
        meas.AddChannel( chan )
        
        pass

    # Now, print and do the fit
    meas.PrintTree();

    # Fit the workspace
    wspace = ROOT.RooStats.HistFactory.HistoToWorkspaceFactoryFast.MakeCombinedModel( meas );
    combined_config = wspace.obj("ModelConfig");
    simData = wspace.obj("obsData");
    simData = wspace.data("obsData");
    constrainedParams = combined_config.GetNuisanceParameters();
    POIs = combined_config.GetParametersOfInterest();
    
    model = combined_config.GetPdf();
    fit_result = model.fitTo(simData, ROOT.RooCmdArg("Minos",True), ROOT.RooCmdArg("PrintLevel",1), ROOT.RooCmdArg("Save",True));

    #MakeMeasurementDictFromFitResult(fit_result)

    return fit_result


def MakeFittedValDictFromFitResult(result):
    """ Given a fit result, find the fitted parameters
    
    """
    fit_result_list = []

    pars = result.floatParsFinal()
    print pars
    num_params = pars.getSize()
    for param_itr in range(num_params):
        param = pars.at(param_itr)
        print param.GetName(), param.getVal(), param.getError(), param.getErrorLo(), param.getErrorHi()
        param_dict = {"name" : param.GetName(), "val" : param.getVal(),
                      "error": param.getError(), "errorLo" : param.getErrorLo(), "errorHi" : param.getErrorHi()}
        fit_result_list.append(param_dict)

    return fit_result_list


if __name__ == '__main__':
    # Bind to PORT if defined, otherwise default to 5000.
    port = int(os.environ.get('PORT', 5000))
    app.debug = True
    app.run(host='0.0.0.0', port=port)
    

