#!/usr/bin/env python

import os
import sys
import json

import tools

import ROOT
ROOT.gROOT.SetBatch(True)

'''
class RedirectStdStreams(object):
    def __init__(self, stdout=None, stderr=None):
        self._stdout = stdout or sys.stdout
        self._stderr = stderr or sys.stderr

    def __enter__(self):
        self.old_stdout, self.old_stderr = sys.stdout, sys.stderr
        self.old_stdout.flush(); self.old_stderr.flush()
        sys.stdout, sys.stderr = self._stdout, self._stderr

    def __exit__(self, exc_type, exc_value, traceback):
        self._stdout.flush(); self._stderr.flush()
        sys.stdout = self.old_stdout
        sys.stderr = self.old_stderr
'''

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

    #print "Entering fitMeasurement"
    #print sys.argv[1]

    devnull = open(os.devnull, 'w')

    # Hide the output of this part (devnull ftw)
    print "Now You See Me"
    # with RedirectStdStreams(stdout=devnull, stderr=devnull):
    #     print "Now You Don't"
    #     measurement_dict = json.loads(sys.argv[1])
    #     fitted_params, fitted_bins, profile_png = tools.FitMeasurement(measurement_dict)

    measurement_dict = json.loads(sys.argv[1])
    fitted_params, fitted_bins, profile_png = tools.FitMeasurement(measurement_dict)

    # Okay, so this part is SUPER hackey
    # We Are going to create a deliminator so we
    # know when the REAL std::cout starts
    print "BEGIN_HERE", json.dumps({"fitted_params" :fitted_params, 
                                    "fitted_bins": fitted_bins, 
                                    "profile_png": profile_png})
    return

if __name__=="__main__":
    main()
