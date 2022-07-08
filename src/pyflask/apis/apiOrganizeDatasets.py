from organizeDatasets import (
    generate_dataset_locally,
    bf_get_dataset_files_folders,
    create_soda_json_object_backend,
    monitor_local_json_progress,
    monitor_pennsieve_json_progress
)

from namespaces import NamespaceEnum, get_namespace
from flask_restx import Resource, fields, reqparse
from errorHandlers import notBadRequestException
import json

api = get_namespace(NamespaceEnum.ORGANIZE_DATASETS)






# TODO: Return SODA JSON object in model without setting type as string. This causes the client to parse the object as a string.
# model_get_dataset_files_folders_response = api.model(
#     "GetDatasetFilesFoldersResponse",
#     {
#         "soda_object": fields.Dict( required=True, description="SODA JSON structure"),
#         "success_message": fields.String( required=True, description="Success message"),
#         "manifest_error_message": fields.List(fields.String,  required=True, description="Manifest error message")
#     }
# )

@api.route('/dataset_files_and_folders')
class BfGetDatasetFilesFolders(Resource):
    parser_file_folders = reqparse.RequestParser(bundle_errors=True)
    parser_file_folders.add_argument('sodajsonobject', type=str, required=True, help='The sodajsonobject filled with the bfaccount and dataset info available.', location="args")

    @api.expect(parser_file_folders)
    @api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal Server Error"}, description="Import a dataset from Pennsieve and populate the local SODA JSON object.")
    #@api.marshal_with(model_get_dataset_files_folders_response)
    def get(self):
        args = self.parser_file_folders.parse_args()

        sodajsonobject = args.get("sodajsonobject")

        if sodajsonobject is None:
            api.abort(400, "Missing parameter: sodajsonobject")

        # convert sodajsonobject to object
        sodajsonobject = json.loads(sodajsonobject)

        try:
            return bf_get_dataset_files_folders(sodajsonobject)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e







@api.route('/datasets')
class GenerateDatasetLocally(Resource):

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
                api.abort(500, str(e))
            raise e







@api.route('/datasets/import')
class ImportDataset(Resource):
    
    parser_import_dataset = reqparse.RequestParser(bundle_errors=True)
    parser_import_dataset.add_argument('sodajsonobject', type=dict, required=True, help='The sodajsonobject filled with the bfaccount and dataset info available.', location="json")
    parser_import_dataset.add_argument('root_folder_path', type=str, required=True, help='The local path to import the dataset.', location="json")
    parser_import_dataset.add_argument('irregular_folders', type=list, required=True, help='The name of the dataset being imported.', location="json")    
    parser_import_dataset.add_argument('replaced', type=list, required=True, help='The name of the dataset being imported.', location="json")
    
    @api.expect(parser_import_dataset)
    @api.doc(responses={200: "Success", 500: "Internal Server Error"}, description="Import files from local machine into the soda json object.")
    def post(self):
        
        data = self.parser_import_dataset.parse_args()

        sodajsonobject = data.get('sodajsonobject')
        root_folder_path = data.get('root_folder_path')
        irregular_folders = data.get('irregular_folders')
        replaced = data.get('replaced')

        try:
            return create_soda_json_object_backend(sodajsonobject, root_folder_path, irregular_folders, replaced)
        except Exception as e:
            api.abort(500, str(e))







model_import_dataset_organize_datasets_progress_response = api.model("ImportDatasetOrganizeDatasetsProgressResponse", {
    "create_soda_json_progress": fields.Integer( required=True, description="The progress of the create soda json object operation."),
    "create_soda_json_total_items": fields.Integer( required=True, description="The total number of items to be processed in the create soda json object operation."),
    "progress_percentage": fields.Integer( required=True, description="The percentage of the create soda json object operation completed."),
    "create_soda_json_completed": fields.Integer( required=True, description="Whether the create soda json object operation has completed.")
})

@api.route('/datasets/import/progress')
class ImportDatasetOrganizeDatasetsProgress(Resource):
    @api.marshal_with(model_import_dataset_organize_datasets_progress_response)
    @api.doc(responses={200: "Success", 500: "Internal Server Error"}, description="Get the progress of the Organize Datasets import dataset operation.")
    def get(self):
        try: 
            return monitor_local_json_progress()
        except Exception as e:
            api.abort(500, str(e))


@api.route('dataset_files_and_folders/progress')
class ImportDatasetPennsieveProgress(Resource):
    @api.marshal_with(model_import_dataset_organize_datasets_progress_response)
    @api.doc(responses={200: "Success", 500: "Internal Server Error"}, description="Returns the progress of the current Pennsieve dataset import operation. Used in Organize Datasets.")
    def get(self):
        try: 
            return monitor_pennsieve_json_progress()
        except Exception as e:
            api.abort(500, str(e))