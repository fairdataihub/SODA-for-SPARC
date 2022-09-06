from flask_restx import Resource, reqparse, fields
from namespaces import get_namespace, NamespaceEnum
from errorHandlers import notBadRequestException, handle_http_error
from datasets import get_role, get_dataset_by_id, get_current_collection_names, upload_collection_names, remove_collection_names


api = get_namespace(NamespaceEnum.DATASETS)




model_get_role_response = api.model("GetRoleResponse", {
  "role": fields.String(description="The role of the dataset")
})


@api.route("/<string:dataset_name_or_id>/role")
@api.doc(params={"dataset_name_or_id": "The name or id of the dataset"})

@api.route('/<string:dataset_name_or_id>/role')
class DatasetRole(Resource):
  parser = reqparse.RequestParser()
  parser.add_argument('pennsieve_account', type=str, required=True, help='Pennsieve account', location="args")

  @api.expect(parser)
  @api.doc(responses={200: 'Success', 400: 'Bad Request', 500: "Internal server error"})
  def get(self, dataset_name_or_id):
    args = self.parser.parse_args()
    pennsieve_account = args.get('pennsieve_account')

    try:
      return get_role(pennsieve_account, dataset_name_or_id) 
    except Exception as e:
      if notBadRequestException(e):
        api.abort(500, str(e))
      raise e


@api.route('/<string:dataset_id>')
class Dataset(Resource):
  @api.doc(responses={200: 'Success', 400: 'Bad Request', 500: "Internal server error"})
  def get(self, dataset_id):

    try:
      return get_dataset_by_id(dataset_id) 
    except Exception as e:
      # if exception is an HTTPError then check if 400 or 500 
      if type(e).__name__ == "HTTPError":
          handle_http_error(e)
      if notBadRequestException(e):
        api.abort(500, str(e))
      raise e




get_current_collections_model = api.model("currCollections", {
    'id': fields.String(required=True, description="The id of collection name"),
    'name': fields.String(required=True, description="Collection name")
})   
@api.route('/<string:dataset_name>/collections')
class datasetCollection(Resource):
    curr_collections_parse = reqparse.RequestParser(bundle_errors=True)
    curr_collections_parse.add_argument('selected_account', type=str, required=True, help="The target account to work with.", location="args")

    @api.marshal_with(get_current_collections_model, False, 200)
    @api.doc(responses={500: 'There was an internal error', 400: 'Bad request'})
    @api.expect(curr_collections_parse)

    def get(self, dataset_name):
        data = self.curr_collections_parse.parse_args()
        selected_account = data.get('selected_account')

        try:
            return get_current_collection_names(selected_account, dataset_name)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e

        #remove selected dataset from add argument
    #change the urls to have dataset ids when being used
    upload_collection_parse = reqparse.RequestParser(bundle_errors=True)
    upload_collection_parse.add_argument('selected_account', type=str, required=True, help="The target account to work with.", location="args")
    upload_collection_parse.add_argument('collection', type=list, required=True, help='List of the collection tag ids', location="json")

    # @api.marshal_with(model_upload_collection_names, False, 200)
    @api.expect(upload_collection_parse)
    @api.doc(responses={200: 'Success', 403: 'User is not owner or manager to dataset', 500: 'There was an internal server error', 400: 'Bad request'}, description="Returns the updated list of updated collection names and ids.")
    def put(self, dataset_name):
        data = self.upload_collection_parse.parse_args()

        selected_account = data.get('selected_account')
        collection_tags = data.get('collection')

        try:
            return upload_collection_names(selected_account, dataset_name, collection_tags)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e

    parser_remove_collections = reqparse.RequestParser(bundle_errors=True)
    parser_remove_collections.add_argument('selected_account', type=str, required=True, help="The target account to work with.", location="args")
    parser_remove_collections.add_argument('collection', type=list, required=True, help='List of the collection tag ids', location="json")
    
    @api.doc(responses={500: 'There was an server error', 400: 'Bad request', 403: 'User is not owner or manager to dataset', 200: 'Success'})
    @api.expect(parser_remove_collections)
    def delete(self, dataset_name):
        data = self.parser_remove_collections.parse_args()
        selected_account = data.get('selected_account')
        collection_ids = data.get('collection')

        try:
            return remove_collection_names(selected_account, dataset_name, collection_ids)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e
