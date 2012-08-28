#!/usr/bin/env python

import os

from flask import Flask
from flask import url_for
from flask import render_template
from flask import request
from flask import jsonify

import ROOT

import tools
from multi import FitMeasurementMultiprocess


app = Flask(__name__)

ROOT.SetMemoryPolicy( ROOT.kMemoryStrict )
ROOT.gROOT.SetBatch(True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/FitMeasurement', methods=['GET', 'POST'])
def FitMeasurement():
    return tools.ProcessMeasurementRequestParallel(request)

#FitMeasurementMultiprocess

#FitMeasurement = app.route('/FitMeasurement', methods=['GET', 'POST'])(tools.FitMeasurement)
#print FitMeasurement

if __name__ == '__main__':
    # Bind to PORT if defined, otherwise default to 5000.
    port = int(os.environ.get('PORT', 5000))
    app.debug = True
    app.run(host='0.0.0.0', port=port)
    

