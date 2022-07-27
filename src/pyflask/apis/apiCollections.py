from flask_restx import Resource, reqparse, fields
from namespaces import get_namespace, NamespaceEnum
from collections import (
    get_all_collections,
    get_current_collection_tags,
    upload_collection_tags,
    remove_collection_tags,
    upload_new_tags
)

api = get_namespace(NamespaceEnum.COLLECTIONS)


organizationCollections = api.model("organizationCollections", {
    'collections': fields.List(fields.String, required=True, description="Collections that belong to an organization")
})

@api.route("/all_collections")
class organizationCollections(Resource):
    collections_parser = reqparse.RequestParser(bundle_errors=True)
    collections_parser.add_argument('account', type=str, required=True, help="Get all collections that belong to the Organization", location="args")

    #the response object
    @api.marshal_with(organizationCollections, False, 201)
    #response types/codes
    @api.doc(responses={500: 'There was an internal error', 400: 'Account information is wrong'})
    #the request parameters
    @api.expect(collections_parser)
    #get the self, account from the request object
    def get(self):
        data = self.collections_parser.parse_args()
        account = data.get('account')

        try: 
            return get_all_collections(account)
        except Exception as e:
            api.abort(500, e.args[0])

        
