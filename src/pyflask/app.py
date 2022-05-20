from __future__ import print_function
# import config
import json
from flask import Flask, request
# from flask_cors import CORS
from namespaces import configure_namespaces


configure_namespaces()


from utils import (configureLogger, configureRouteHandlers, configureAPI)

# import getenv
from os import getenv

app = Flask(__name__)

configureLogger(app)

api = configureAPI()



configureRouteHandlers(api)

api.init_app(app)

app.run(debug=True, host=getenv('HOST'), port=getenv('PORT'))

