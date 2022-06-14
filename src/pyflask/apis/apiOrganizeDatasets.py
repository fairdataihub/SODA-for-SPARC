from organizeDatasets import (
    generate_dataset_locally,
    bf_get_dataset_files_folders,
    create_soda_json_object_backend,
    monitor_local_json_progress,
)

from namespaces import NamespaceEnum, get_namespace
from flask_restx import Resource, fields, reqparse
from errorHandlers import notBadRequestException

api = get_namespace(NamespaceEnum.ORGANIZE_DATASETS)



model_get_dataset_files_folders_response = api.model(
    "GetDatasetFilesFoldersResponse",
    {
        "soda_json_structure": fields.String( required=True, description="SODA JSON structure"),
        "success_message": fields.String( required=True, description="Success message"),
        "manifest_error_message": fields.String( required=True, description="Manifest error message")
    }
)

@api.route('/dataset_files_and_folders')
class BfGetDatasetFilesFolders(Resource):
    parser = api.parser()
    parser.add_argument('sodajsonobject', type=dict, required=True, help='The sodajsonobject filled with the bfaccount and dataset info available.', location="json")

    @api.expect(parser)
    @api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal Server Error"}, description="Import a dataset from Pennsieve and populate the local SODA JSON object.")
    @api.marshal_with(model_get_dataset_files_folders_response)
    def get(self):
        data = self.parser.parse_args()
        sodajsonobject = data.get('sodajsonobject')

        try:
            return bf_get_dataset_files_folders(sodajsonobject)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, e.args[0])
            raise e






generate_dataset_locally
@api.route('/datasets')
class GeberateDatasetLocally(Resource):

    parser_change_dataset_status = reqparse.RequestParser(bundle_errors=True)
    parser_change_dataset_status.add_argument('generation_type', type=str, required=True, help='The final destination to generate the dataset in. Valid option is create new.', location="json")
    parser_change_dataset_status.add_argument('generation_destination_path', type=str, required=True, help='The local path to generate the dataset.', location="json")
    parser_change_dataset_status.add_argument('dataset_name', type=str, required=True, help='The name of the dataset being generated.', location="json")
    parser_change_dataset_status.add_argument('soda_json_directory_structure', type=dict, required=True, help='The sodajsonobject dataset directory structure.', location="json")

    @api.expect(parser_change_dataset_status)
    @api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal Server Error"}, description="Generate a dataset at the given local directory using the sodajsonobject dataset directory structure.")
    def post(self):
        data = self.parser_change_dataset_status.parse_args()

        generation_type = data.get('generation_type')
        generation_destination_path = data.get('generation_destination_path')
        dataset_name = data.get('dataset_name')
        soda_json_directory_structure = data.get('soda_json_directory_structure')
        
        try:
            return generate_dataset_locally(generation_type, generation_destination_path, dataset_name, soda_json_directory_structure)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, e.args[0])
            raise e