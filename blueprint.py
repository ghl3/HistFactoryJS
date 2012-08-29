

from flask import Blueprint, render_template, abort
from jinja2 import TemplateNotFound


# A module which exposes the
# features of HistFactoryJS 
# to other Flask modules
# (neat, eh?)


HistFactory = Blueprint('HistFactory', __name__,
                        template_folder='templates', 
                        static_folder="static")

@simple_page.route('/', defaults={'index'})
def index():
    try:
        return render_template('index.html')
    except TemplateNotFound:
        abort(404)


@simple_page.route('/FitMeasurement')
def index():
    return tools.ProcessMeasurementRequestParallel(request)
