from __future__ import print_function
# import config
import json
from flask import Flask, request
# from flask_cors import CORS
from utils import (configureLogger, configureRouteHandlers, configureAPI)


app = Flask(__name__)

configureLogger(app)

api = configureAPI(app)

configureRouteHandlers(api)

api.init_app(app)

app.run(debug=True, host=getenv('HOST'), port=getenv('PORT'))

