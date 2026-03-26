from startup import echo, get_api_version
import time
from flask import Response
from flask_restx import Resource, fields
from namespaces import get_namespace, NamespaceEnum
from flask import request
from pennsieve2.pennsieve import Pennsieve
import requests
import boto3
import os
from configparser import ConfigParser



PENNSIEVE_URL = "https://api.pennsieve.io"
userpath = os.path.expanduser("~")
configpath = os.path.join(userpath, ".pennsieve", "config.ini")

api = get_namespace(NamespaceEnum.STARTUP)

parser = api.parser()
parser.add_argument('arg', type=str, required=True, help='Argument that will be echoed back to the caller', location='args')

@api.route("/echo")
class Echo(Resource):
    @api.expect(parser)
    def get(self):
        args = parser.parse_args()
        return args["arg"]


@api.route("/minimum_api_version")
class MinimumApiVersion(Resource):
    def get(self):
        return get_api_version()
    




















