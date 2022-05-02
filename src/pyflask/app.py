from __future__ import print_function
# import config
import json
import logging
import logging.handlers
from os import getenv 

from flask import Flask, request
# from flask_cors import CORS
from apis import api 


app = Flask(__name__)

api.init_app(app)

app.run(debug=True, host=getenv('HOST'), port=getenv('PORT'))

