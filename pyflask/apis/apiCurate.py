from flask_restx import Resource, fields, reqparse
from namespaces import NamespaceEnum, get_namespace
from flask import request
import json
from os.path import (
    expanduser,
    join,
)

from curate import (
    create_folder_level_manifest,
    check_empty_files_folders,
    main_curate_function,
    main_curate_function_progress,
    generate_manifest_file_locally,
    guided_generate_manifest_file_data,
    check_JSON_size,
    clean_json_structure,
    check_server_access_to_files,
)

from manifest import create_high_level_manifest_files_existing_local_starting_point
from errorHandlers.notBadRequestException import notBadRequestException
userpath = expanduser("~")

api = get_namespace(NamespaceEnum.CURATE_DATASETS)

model_check_empty_files_folders_response = api.model( "CheckEmptyFilesFoldersResponse", {
    "empty_files": fields.List(fields.String),
    "empty_folders": fields.List(fields.String),
    "soda_json_structure": fields.String(description="JSON structure of the SODA dataset"),
})

@api.route("/empty_files_and_folders")
class CheckEmptyFilesFolders(Resource):
    # response types/codes
    @api.doc(responses={500: 'There was an internal server error', 400: 'Bad Request'}, description="Given a sodajsonobject return a list of empty files and folders should they exist, as well as the sodajsonobject.", params={'soda_json_structure': 'JSON structure of the SODA dataset'})
    def post(self):
        data = request.get_json()

        if "soda_json_structure" not in data:
            api.abort(400, "Missing parameter: soda_json_structure")

        # parse soda json as dictionary
        soda_json_structure = data["soda_json_structure"]

        try:
            return check_empty_files_folders(soda_json_structure)
        except Exception as e:
            api.abort(500, str(e))



@api.route('/check_server_access_to_files')
class Curation(Resource):
    parser_check_file_server_access = reqparse.RequestParser(bundle_errors=True)
    parser_check_file_server_access.add_argument('file_list_to_check', type=list, required=True, help='A list of files to check if the server can access', location="json")
    
    @api.expect(parser_check_file_server_access)
    @api.doc(responses={200: "Success", 500: "Internal Server Errors"}, description="Checks if the server can open the files passed in as a list.")
    def post(self):
        data = self.parser_check_file_server_access.parse_args()
        file_list_to_check = data.get('file_list_to_check')
        try:
            return check_server_access_to_files(file_list_to_check)
        except Exception as e:
            api.abort(500, str(e))


@api.route("/clean-dataset")
class Curation(Resource):
    @api.doc(responses={500: "There was an internal server error", 400: "Bad request", 403: "Forbidden"}, description="Given a sodajson object, clean up the dataset structure for imported datasets that have been modified")
    def post(self):
        data = request.get_json()

        if "soda_json_structure" not in data:
            api.abort(400, "Missing parameter: soda_json_structure")

        soda_json_structure = data["soda_json_structure"]
        api.logger.info("/clean-dataset POST request")

        try:
            return clean_json_structure(soda_json_structure)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e



model_main_curation_function_response = api.model( "MainCurationFunctionResponse", {
    "main_curate_progress_message": fields.String(description="Progress message from the main curation function"),
    "main_total_generate_dataset_size": fields.String(description="Total size of the dataset"),
    "main_curation_uploaded_files": fields.Integer(description="Number of files that are being generated. "), 
})

@api.route("/curation")
class Curation(Resource):

    @api.doc(responses={500: 'There was an internal server error', 400: 'Bad Request', 403: 'Forbidden'}, 
    description="Given a sodajsonobject generate a dataset. Used in the final step of Organize Datasets.")   
    @api.marshal_with(model_main_curation_function_response)
    def post(self):
        data = request.get_json()

        if "soda_json_structure" not in data:
            api.abort(400, "Missing parameter: soda_json_structure")

        soda_json_structure = data["soda_json_structure"]

        api.logger.info('/curation POST request')

        try:
            return main_curate_function(soda_json_structure)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e






model_curation_progress_response = api.model( "CurationProgressResponse", {
    "main_curate_status": fields.String(description="Status of the main curation function"),
    "start_generate": fields.Integer(description="True if the main curation function is running"),
    "main_curate_progress_message": fields.String(description="Progress message from the main curation function"),
    "main_total_generate_dataset_size": fields.Integer(description="Total size of the dataset"),
    "main_generated_dataset_size": fields.Integer(description="Size of the dataset that has been generated thus far"),
    "elapsed_time_formatted": fields.String(description="Elapsed time of the main curation function"),
    "total_files_uploaded": fields.Integer(description="Number of files that have been uploaded"),
    "generated_dataset_id": fields.String(description="Generated dataset ID"),
})

@api.route("/curation/progress")
class CurationProgress(Resource):

    @api.marshal_with(model_curation_progress_response, False, 200)
    @api.doc(responses={500: 'There was an internal server error'}, description="Return important details to the client about the state of the currently running curation function.")
    def get(self):
        try:
            return main_curate_function_progress()
        except Exception as e:
            api.abort(500, str(e))








model_curation_file_details_response = api.model( "CurationFileDetailsResponse", {
    "main_curation_uploaded_files": fields.Integer(description="Number of files that have been uploaded thus far. "),
    "current_size_of_uploaded_files": fields.Integer(description="Size of the files that have been uploaded thus far. "),
    "uploaded_folder_counter": fields.Integer(description="Number of folders that have been uploaded thus far. "),
    "generated_dataset_id": fields.String(description="ID of the dataset that has been generated. ")
})








@api.route("/manifest_files/local")
class GenerateManifestFiles(Resource):
    parser = reqparse.RequestParser()
    parser.add_argument("filepath", type=str, required=True, help="Path to either a local dataset or a SODA directory for storing temporary manifest files. The latter is used for editing manifest files for local datasets. The former for editing manifest files of manifest information pulled from Pennsieve.", location="json")
    

    @api.doc(responses={500: 'There was an internal server error', 400: 'Bad Request'}, description="Generate manifest files in a local temporary directory or in the user's dataset directory. Allows users to edit their manifest files in the standalone manifest file generator feature.")
    @api.expect(parser)
    def post(self):   # sourcery skip: use-named-expression

        # get the filepath from the request object
        data = self.parser.parse_args()

        filepath = data.get("filepath")

        try:
            return create_high_level_manifest_files_existing_local_starting_point(filepath, join(userpath, "SODA", "manifest_files"))
        except Exception as e:
            api.abort(500, str(e))







model_generate_manifest_locally_response = api.model( "GenerateManifestLocallyResponse", {
    "success_message_or_manifest_destinationa": fields.String(description="Success message or path to the manifest file"),
})

@api.route('/manifest_files')
class GenerateManifestLocally(Resource):
    parser = reqparse.RequestParser()
    parser.add_argument('generate_purpose', type=str, required=True, help='Can be edit-manifest or otherwise. Use edit-manifest when a user wants to edit their manifest files in the standalone manifest file generation feature.', location='json')
    parser.add_argument('soda_json_object', type=dict, required=True, help='SODA dataset structure', location='json')

    @api.doc(responses={500: 'There was an internal server error', 400: 'Bad Request'}, description="Generate manifest files locally. Used in the standalone manifest file generation feature. Can take edit-manifest keyword that stores the manifest file in a separate directory. Allows ease of editing manifest information for the client.")
    @api.marshal_with(model_generate_manifest_locally_response, False, 200)
    @api.expect(parser)
    def post(self):
        # get the generate_purpose from the request object
        data = self.parser.parse_args()

        generate_purpose = data.get("generate_purpose")
        soda_json_object = data.get("soda_json_object")

        try:
            return generate_manifest_file_locally(generate_purpose, soda_json_object)
        except Exception as e:
            api.abort(500, str(e))








@api.route('/guided_generate_high_level_folder_manifest_data')
class GenerateManifestData(Resource):
    parser = reqparse.RequestParser()
    parser.add_argument('dataset_structure_obj', type=dict, required=True, help='dataset structure used to generate manifest files for each high level folder', location='json')
    @api.doc(responses={500: 'There was an internal server error', 400: 'Bad Request'}, description="Generate Manifest Data for each of the high level folders. Returns an array of arrays to be inserted into jspreadsheet.")
    @api.expect(parser)
    def post(self):

        data = self.parser.parse_args()
        dataset_structure_obj = data.get("dataset_structure_obj")
        try:
            return guided_generate_manifest_file_data(dataset_structure_obj)
        except Exception as e:
            api.abort(500, str(e))


            
model_dataset_size_response = api.model( "DatasetSizeResponse", {
    "dataset_size": fields.Integer(description="Size of the dataset"),
})

@api.route('/dataset_size')
class DatasetSize(Resource):

    @api.doc(responses={500: 'There was an internal server error', 400: 'Bad Request'}, 
    description="Estimate the size of a dataset that will be generated on a user's device.", 
    params={'soda_json_structure': "SODA dataset structure"})
    @api.marshal_with(model_dataset_size_response, False, 200)
    def post(self):

        # get the soda_json_structure from the request object
        data = request.get_json()

        if "soda_json_structure" not in data:
            api.abort(400, "No SODA dataset structure provided.")

        soda_json_structure = data["soda_json_structure"]

        try:
            return check_JSON_size(soda_json_structure)
        except Exception as e:
            api.abort(500, str(e))
