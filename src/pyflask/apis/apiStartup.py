from startup import echo, get_api_version
import time
from flask import Response
from flask_restx import Resource, fields
from namespaces import get_namespace, NamespaceEnum
from flask import request

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
    
model_main_curation_function_response = api.model( "MainCurationFunctionResponse", {
    "statusResponse": fields.String(description="Progress message from the main curation function"),
   
})


# Endpoint that never closes the HTTP connection
@api.route("/never_die")
class NeverDie(Resource):
    @api.marshal_with(model_main_curation_function_response)
    def post(self):
        data = request.get_json()
        print(data)
        while True:
            num = 0
            for i in range(1, 1000001):
                num += 1
            time.sleep(5)
        
        return {"statusResponse": "wowza"}


