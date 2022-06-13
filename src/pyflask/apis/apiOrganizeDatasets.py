from organizeDatasets import (
    generate_dataset_locally,
    bf_get_dataset_files_folders,
    create_soda_json_object_backend,
    monitor_local_json_progress,
)

from namespaces import NamespaceEnum, get_namespace
from flask_restx import Resource, fields
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