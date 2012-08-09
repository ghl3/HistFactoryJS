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

    # Apply some sanity checks
    if request.method != 'POST':
        print "FitMeasurement() - ERROR: Expected POST http request"
        return jsonify(flag="error")

    # Get the data to be fit
    measurement_string_JSON = request.form['measurement']
    measurement = json.loads( measurement_string_JSON )

    (fit_result, fitted_bins) = FitMeasurementUsingHistFactory(measurement)

    # Success
    # For now, just return the input
    return jsonify(flag="success", fit_result=fit_result, fitted_bins=fitted_bins)


def FitMeasurementUsingHistFactory(measurement_dict):
    """ Create a HistFactory measurement object from a python dict

    This is the mapping between the simple Javascript/Python measurement
    dictionary (the one that directly is made via the site's gui) and the
    HistFactory Measurement object (written in c++).

    This is just a temporary, dummy version

    The output format should be identical to the input format:
    
    [ {name:"MyChannelA", data:"35", samples:[{name:"ttbar", value:12}, {name:"WJets", value:20] }, 
      {name:"MyChannelB", data:"40", samples:[{name:"ttbar", value:18}, {name:"WJets", value:23] }, 
    ...
    ]

    """

    # For now, simply randomly perturb
    # in the input to "fit"

    # Make the HistFactory Model
    fit_result = CreateHistFactoryFromMeasurement(measurement_dict)    
    fit_dict = MakeMeasurementDictFromFitResult(fit_result)

    # For now, just a dummy for the fitted bin heights
    fitted_bins = copy.deepcopy(measurement_dict)
    
    for channel in fitted_bins:
        channel["data"] = float(channel["data"])
        
        for sample in channel["samples"]:
            sample["value"] = random.uniform(.9, 1.1)*float(sample["value"])
        pass

    return (fit_dict, fitted_bins)


def CreateHistFactoryFromMeasurement(measurement_dict, options=None):
    """ 
    This is temporarily a separate module until I fix
    the ROOT/python version mismatch.
    Then, it will be incorporated into the main app :)

    The input object looks like this:
    
    [ {name:"MyChannelA", data:"35", samples:[{name:"ttbar", value:12}, {name:"WJets", value:20] }, 
      {name:"MyChannelB", data:"40", samples:[{name:"ttbar", value:18}, {name:"WJets", value:23] }, 
    ...
    ]

    Simply convert to a HistFactory Measurement and return

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
            #sample.AddOverallSys( "syst1",  0.95, 1.05 )
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


def MakeMeasurementDictFromFitResult(result):
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
    

