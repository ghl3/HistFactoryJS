#!/usr/bin/env python

import os

import json
#import simplejson

from flask import Flask
from flask import url_for
from flask import render_template
from flask import request
from flask import jsonify

#import ROOT

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

    fit_result = FitMeasurementUsingHistFactory(measurement)

    # Success
    # For now, just return the input
    return jsonify(flag="success", result=fit_result)


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

    fit_result = copy.deepcopy(measurement_dict)
    
    for channel in fit_result:
        channel["data"] = random.uniform(.9, 1.1)*float(channel["data"])
        
        for sample in channel["samples"]:
            sample["value"] = random.uniform(.9, 1.1)*float(sample["value"])
        pass

    print fit_result
    return fit_result



if __name__ == '__main__':
    # Bind to PORT if defined, otherwise default to 5000.
    port = int(os.environ.get('PORT', 5000))
    app.debug = True
    app.run(host='0.0.0.0', port=port)
    

