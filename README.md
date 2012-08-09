HistFactoryJS
=============

An app to build and fit statistical models using a simple GUI.

HistFactoryJS creates a front end interface, written in javascript, to graphically build statistical models.
Those models are sent to a back end application, written in Flask and python, that builds them, fits them, and returns the fit result.
The back end fits are run using ROOT (c++) and the models are generated using the HistFactory library within ROOT.


