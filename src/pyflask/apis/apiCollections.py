from flask_restx import Resource, reqparse, fields
from numpy import require
from pandas import array
from namespaces import get_namespace, NamespaceEnum
from collectionsDataset import (
    get_all_collections,
    get_current_collection_names,
    upload_collection_names,
    remove_collection_names,
    upload_new_names
)

api = get_namespace(NamespaceEnum.COLLECTIONS)


organizationCollections = api.model('collectionDataset', {
    'id': fields.String(required=True, descripion="The id of collection"),
    'name': fields.String(required=True, description="Collection name")
})


@api.route("/all_collections")
class organizationCollections(Resource):
    collections_parser = reqparse.RequestParser(bundle_errors=True)
    collections_parser.add_argument('selected_account', type=str, required=True, help="The target account to work with.", location="args")

    #the response object
    @api.marshal_with(organizationCollections, False, 200)
    #response types/codes
    @api.doc(responses={500: 'There was an internal error', 400: 'Bad request'})
    #the request parameters
    @api.expect(collections_parser)
    #get the self, account from the request object
    def get(self):
        account = self.collections_parser.parse_args().get('selected_account')

        try: 
            return get_all_collections(account)
        except Exception as e:
            api.abort(500, e.args[0])


get_current_collections_model = api.model("currCollections", {
    'id': fields.String(required=True, description="The id of collection name"),
    'name': fields.String(required=True, description="Collection name")
})    
@api.route("/current_collections")
class currentCollections(Resource):
    curr_collections_parse = reqparse.RequestParser(bundle_errors=True)
    curr_collections_parse.add_argument('selected_account', type=str, required=True, help="The target account to work with.", location="args")
    curr_collections_parse.add_argument('selected_dataset', type=str, required=True, help="The target dataset to retrieve collection names", location="args")

    @api.marshal_with(get_current_collections_model, False, 200)
    @api.doc(responses={500: 'There was an internal error', 400: 'Bad request'})
    @api.expect(curr_collections_parse)

    def get(self):
        data = self.curr_collections_parse.parse_args()
        selected_account = data.get('selected_account')
        selected_dataset = data.get('selected_dataset')

        try:
            return get_current_collection_names(selected_account, selected_dataset)
        except Exception as e:
            api.abort(500, e.args[0])


model_id_names = api.model("collectionIdNames", {
    'id': fields.Integer(required=True, description="Collection ID"),
    'name': fields.String(required=True, description="Collection Name")
})

model_upload_collection_names = api.model('uploadCollection', {
    'collection': fields.List(fields.Nested(model_id_names), required=True, description="ID of collection name"),
})

@api.route("/upload_collection_names")
class uploadCollectionNames(Resource):
    upload_collection_parse = reqparse.RequestParser(bundle_errors=True)
    upload_collection_parse.add_argument('selected_account', type=str, required=True, help="The target account to work with.", location="args")
    upload_collection_parse.add_argument('selected_dataset', type=str, required=True, help="The dataset to update collections", location="args")
    upload_collection_parse.add_argument('collection', type=list, required=True, help='List of the collection tag ids', location="json")

    # @api.marshal_with(model_upload_collection_names, False, 200)
    @api.expect(upload_collection_parse)
    @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request'}, description="Returns the updated list of updated collection names and ids.")
    def put(self):
        data = self.upload_collection_parse.parse_args()

        selected_account = data.get('selected_account')
        selected_dataset = data.get('selected_dataset')
        collection_tags = data.get('collection')

        try:
            return upload_collection_names(selected_account, selected_dataset, collection_tags)
        except Exception as e:
            api.abort(500, e.args[0])

model_remove_collection_names = api.model('uploadCollection', {
    'collection': fields.List(fields.String, required=True, description="ID of collection name")
})

@api.route("/remove_collection_names")
class removeCollectionNames(Resource):
    parser_remove_collections = reqparse.RequestParser(bundle_errors=True)
    parser_remove_collections.add_argument('selected_account', type=str, required=True, help="The target account to work with.", location="args")
    parser_remove_collections.add_argument('selected_dataset', type=str, required=True, help="The dataset to update collections", location="args")
    parser_remove_collections.add_argument('collection', type=list, required=True, help='List of the collection tag ids', location="json")

    # @api.marshal_with(model_remove_collection_names, False, 200)
    @api.doc(responses={500: 'There was an internal server error', 400: 'Bad request'})
    @api.expect(parser_remove_collections)

    def delete(self):
        data = self.parser_remove_collections.parse_args()
        selected_account = data.get('selected_account')
        selected_dataset = data.get('selected_dataset')
        collection_ids = data.get('collection')

        print(collection_ids)
        try:
            return remove_collection_names(selected_account, selected_dataset, collection_ids)
        except Exception as e:
            api.abort(500, e.args[0])


model_new_collection_names = api.model('uploadCollection', {
    'collection': fields.List(fields.String, required=True, description="ID of collection name")
})
@api.route("/upload_new_names")
class newCollectionNames(Resource):
    parser_new_names = reqparse.RequestParser(bundle_errors=True)
    parser_new_names.add_argument('selected_account', type=str, required=True, help="The target account to work with.", location="args")
    parser_new_names.add_argument('selected_dataset', type=str, required=True, help="The dataset to update collections", location="args")
    parser_new_names.add_argument('collection', type=list, required=True, help='List of the collection tag ids', location="json")

    # @api.marshal_with(model_new_collection_names, False, 200)
    @api.doc(description="Method for creating new collection names on Pennsieve", responses={500: 'There was an internal server error', 400: 'Bad request'})
    @api.expect(parser_new_names)

    def post(self):
        data = self.parser_new_names.parse_args()
        account = data.get('selected_account')
        dataset = data.get('selected-dataset')
        collection_names = data.get('collection')

        try:
            return upload_new_names(account, dataset, collection_names)
        except Exception as e:
                api.abort(500, e.args[0])