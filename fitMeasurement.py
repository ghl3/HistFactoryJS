#!/usr/bin/env python

import os
import sys
import json

import tools


def main():
    """ Create a measurement from a string

    Take an input 'measurement' as a JSON string
    via the command line.

    Use HistFactory to process it and get a fitted
    result.

    Create images and save locally.

    Return the fitted result to std::cout
    (which could then be intercepted)

    """

    # Import ROOT:
    try:
        import ROOT
    except ImportError:
        print "Error: Cannot import ROOT Module"
        

    # Set to batch mode
    ROOT.gROOT.SetBatch(True)

    # Get the results using HistFactory
    measurement_dict = json.loads(sys.argv[1])
    fitted_params, fitted_bins, profile_png = tools.FitMeasurement(measurement_dict)

    # Okay, so this part is SUPER hackey
    # We Are going to create a deliminator so we
    # know when the REAL std::cout starts
    delim = "BEGIN_HERE" 
    print delim, json.dumps({"fitted_params" :fitted_params, 
                             "fitted_bins": fitted_bins, 
                             "profile_png": profile_png})
    return

if __name__=="__main__":
    main()
