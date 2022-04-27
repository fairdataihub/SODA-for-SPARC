from __future__ import print_function
import config
import json
import logging
import logging.handlers

from flask import Flask, request
from flask_cors import CORS
from flask_restx import Api, Resource, reqparse


API_VERSION = "5.4.0"

app = Flask(__name__)

