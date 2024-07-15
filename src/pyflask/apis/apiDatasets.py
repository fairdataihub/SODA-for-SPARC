from flask_restx import Resource, reqparse, fields
from flask import request
from namespaces import get_namespace, NamespaceEnum
from errorHandlers import notBadRequestException, handle_http_error
import platform 
import subprocess
import os
from datasets import ( 
    get_role, 
    get_dataset_by_id, 
    get_current_collection_names, 
    upload_collection_names, 
    remove_collection_names,
    reserve_dataset_doi,
    get_dataset_doi,
    get_package_type_counts,
    get_total_items_in_local_dataset,
    get_local_dataset_comparison,
    delete_packages,
)

api = get_namespace(NamespaceEnum.DATASETS)

model_get_role_response = api.model("GetRoleResponse", {
  "role": fields.String(description="The role of the dataset")
})


@api.route('/<string:dataset_name>/role')
class DatasetRole(Resource):
  parser = reqparse.RequestParser()
  @api.doc(params={"dataset_name": "The name of the dataset"})

  @api.expect(parser)
  @api.doc(responses={200: 'Success', 400: 'Bad Request', 500: "Internal server error"})
  def get(self, dataset_name):

    try:
      return get_role(dataset_name) 
    except Exception as e:
      if notBadRequestException(e):
        # general exception that was unexpected and caused by our code
        api.abort(500, str(e))
      if e.response is not None:
          # requests exeption
          api.logger.info("Error message details: ", e.response.json().get('message'))
          api.abort(e.response.status_code, e.response.json().get('message'))
      else:
          # custom werkzeug.exception that we raised
          api.abort(e.code, e.description)


@api.route('/<string:dataset_name_or_id>')
class Dataset(Resource):
  @api.doc(responses={200: 'Success', 400: 'Bad Request', 500: "Internal server error"})
  def get(self, dataset_name_or_id):

    try:
      return get_dataset_by_id(dataset_name_or_id)
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



@api.route('/open')
class OpenDataset(Resource):
    parser = reqparse.RequestParser()
    parser.add_argument('dataset_path', type=str, required=True, help='Dataset name', location="args")

    @api.expect(parser)
    @api.doc(responses={200: 'Success', 400: 'Bad Request', 500: "Internal server error"})
    def get(self):
        args = self.parser.parse_args()
        dataset_path = args.get('dataset_path')

        try:
          if platform.system() == "Windows":
            # check the children of the dataset path to see if there is a .pennsieve folder
            children = os.listdir(dataset_path)
            # join first child with dataset path
            child_path = os.path.join(dataset_path, children[0])
            api.logger.info(f"Opening dataset: {child_path}")
            subprocess.Popen(f"explorer /select,{str(child_path)}")
          elif platform.system() == "Darwin":
            subprocess.Popen(["open", dataset_path])
          else:
            subprocess.Popen(["xdg-open", dataset_path])

          return "SUCCESS"
        except Exception as e:
          api.abort(500, str(e))




@api.route('/<string:dataset_name>/reserve-doi')
class DatasetDOI(Resource):
  @api.doc(params={"dataset_name": "Name of the dataset to reserve DOI for"})
  @api.doc(responses={200: 'Success', 400: 'Bad Request', 500: "Internal server error"})

  def post(self, dataset_name):
    try:
      return reserve_dataset_doi(dataset_name)
    except Exception as e:
      if notBadRequestException(e):
        api.abort(500, str(e))
      raise e
    
  def get(self, dataset_name):
    try:
      return get_dataset_doi(dataset_name)
    except Exception as e:
      if notBadRequestException(e):
        api.abort(500, str(e))
      raise e
    

@api.route('/<string:dataset_name>/packageTypeCounts')
class PackageTypeCounts(Resource):
    @api.doc(responses={200: 'Success', 400: 'Bad Request', 500: "Internal server error"})
    def get(self, dataset_name):
        try:
            return get_package_type_counts(dataset_name)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e
        




@api.route('/local/item_count')
class PackageTypeCounts(Resource):
    parser = reqparse.RequestParser()
    parser.add_argument('dataset_path', type=str, required=True, help='Dataset name', location="args")
    @api.doc(responses={200: 'Success', 400: 'Bad Request', 500: "Internal server error"})
    def get(self):
        # get the dataset_path from the query string 
        args = self.parser.parse_args()
        dataset_path = args.get('dataset_path')

        try:
            return get_total_items_in_local_dataset(dataset_path)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e
        

@api.route('/<string:dataset_id>/comparison_results')
class ComparisonResults(Resource):
    parser = reqparse.RequestParser()
    parser.add_argument('local_dataset_path', type=str, required=True, help='Path to the local dataset', location="args")
    @api.doc(responses={200: 'Success', 400: 'Bad Request', 500: "Internal server error"})
    @api.doc(params={"local_dataset_path": "Path of the local dataset to compare against the Pennsieve dataset"})

    def get(self, dataset_id):
        api.logger.info("Comparing local dataset to Pennsieve dataset")
        # get the dataset_path from the query string 
        args = self.parser.parse_args()
        local_dataset_path = args.get('local_dataset_path')

        try:
            v =  get_local_dataset_comparison(dataset_id, local_dataset_path)
            # api.logger.info("FUn It Finished")
            return v

        except Exception as e:
            api.logger.info(f"Comparing local dataset to Pennsieve dataset error s{e}")
            
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e
        
@api.route('/<string:dataset_id>/packages')
class Packages(Resource):
    @api.doc(responses={200: 'Success', 400: 'Bad Request', 500: "Internal server error"})
    @api.doc(params={"dataset_id": "The id of the dataset to get package types for"})
    def delete(self, dataset_id):
        try:
            data = request.get_json()
            if "packages" not in data:
                api.abort(400, "The packages key is required in the request body")
                
            files_to_delete = data.get('packages')

            return delete_packages(dataset_id, files_to_delete)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e