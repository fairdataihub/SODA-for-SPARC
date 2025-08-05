from flask_restx import Resource, reqparse, fields
from namespaces import get_namespace, NamespaceEnum
from collectionsDataset import (
    get_all_collections,
    upload_new_names
)

from errorHandlers import notBadRequestException

api = get_namespace(NamespaceEnum.COLLECTIONS)


organizationCollections = api.model('collectionDataset', {
    'id': fields.String(required=True, descripion="The id of collection"),
    'name': fields.String(required=True, description="Collection name")
})

@api.route("/")
class organizationCollections(Resource):
   
    #the response object
    @api.marshal_with(organizationCollections, False, 200)
    #response types/codes
    @api.doc(responses={500: 'There was an internal error', 400: 'Bad request'})
    #the request parameters
    #get the self, account from the request object
    def get(self):

        try: 
            return get_all_collections()
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e

    parser_new_names = reqparse.RequestParser(bundle_errors=True)
    parser_new_names.add_argument('selected_dataset', type=str, required=True, help="The target dataset to work with.", location="args")
    parser_new_names.add_argument('collection', type=list, required=True, help='List of the collection tag ids', location="json")

    # @api.marshal_with(model_new_collection_names, False, 200)
    @api.doc(description="Method for creating new collection names on Pennsieve", responses={200: 'Success', 403: 'User is not owner or manager to dataset', 500: 'There was an internal server error', 400: 'Bad request'})
    @api.expect(parser_new_names)

    def post(self):
        data = self.parser_new_names.parse_args()
        dataset_name = data.get('selected_dataset')
        collection_names = data.get('collection')

        try:
            return upload_new_names(dataset_name, collection_names)
        except Exception as e:
                if notBadRequestException(e):
                    api.abort(500, str(e))
                raise e
