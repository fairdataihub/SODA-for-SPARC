from startup import echo 
from flask_restx import Resource
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