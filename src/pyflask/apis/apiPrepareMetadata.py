from prepareMetadata import (
    save_submission_file,
    save_ds_description_file,
    extract_milestone_info,
    import_milestone,
    save_subjects_file,
    convert_subjects_samples_file_to_df,
    save_samples_file,
    load_existing_DD_file,
    load_existing_submission_file,
    import_bf_metadata_file,
    import_bf_RC,
    upload_RC_file,
    delete_manifest_dummy_folders,
    set_template_path, 
    import_bf_manifest_file,
    manifest_creation_progress
)
from flask import request
import json
from namespaces import NamespaceEnum, get_namespace
from flask_restx import Resource, reqparse, fields
from flask_restx.inputs import boolean
from errorHandlers import notBadRequestException
from utils import metadata_string_to_list


api = get_namespace(NamespaceEnum.PREPARE_METADATA)




model_save_submission_file_response = api.model('saveSubmissionFileResponse', {
    'size': fields.Integer(required=True, description='Size of the file in bytes'),
})

model_get_submission_file_response = api.model('getSubmissionFileResponse', {
    "SPARC Award number": fields.String(required=True, description='SPARC Award number'),
    "Milestone achieved": fields.List(fields.String, required=True, description='Milestone achieved'),
    "Milestone completion date": fields.String(required=True, description='Milestone completion date'),
})
@api.route('/submission_file')
class SaveSubmissionFile(Resource):

    parser_save_submission_file = reqparse.RequestParser(bundle_errors=True)
    parser_save_submission_file.add_argument('upload_boolean', type=boolean, help='Boolean to indicate whether to upload the file to the Bionimbus server', location="json", required=True)
    parser_save_submission_file.add_argument('selected_account', type=str, help='Pennsieve account name', location="args", required=True)
    parser_save_submission_file.add_argument('selected_dataset', type=str, help='Pennsieve dataset name', location="args", required=True)
    parser_save_submission_file.add_argument('filepath', type=str, help='Path to the file to be uploaded', location="json")
    parser_save_submission_file.add_argument('submission_file_rows', type=list, help='List of objects that contain award, milestone, and date properties with appropriate values.', location="json", required=True)

    @api.expect(parser_save_submission_file)
    @api.response(200, 'OK', model_save_submission_file_response)
    @api.doc(description='Save a submission file locally or in a dataset stored on the Pennsieve account of the current user.', responses={500: "Internal Server Error", 400: "Bad Request", 403: "Forbidden"})
    def post(self):
        data = self.parser_save_submission_file.parse_args()

        upload_boolean = data.get('upload_boolean')
        bfaccount = data.get('selected_account')
        bfdataset = data.get('selected_dataset')
        filepath = data.get('filepath')
        json_str = data.get("submission_file_rows")


        if not upload_boolean and filepath is None:
            api.abort(400, "Please provide a destination in which to save your Submission file.")

        try:
            return save_submission_file(upload_boolean, bfaccount, bfdataset, filepath, json_str)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e



    parser_get_submission_file = reqparse.RequestParser(bundle_errors=True)
    parser_get_submission_file.add_argument('filepath', type=str, help="Path to the submission file on the user's machine", location="args", required=True)


    @api.expect(parser_get_submission_file)
    @api.marshal_with(model_get_submission_file_response, 200, False)
    @api.doc(description='Get the submission file from the user\'s machine.', responses={500: "Internal Server Error", 400: "Bad Request"})
    def get(self):
        data = self.parser_get_submission_file.parse_args()
        filepath = data.get('filepath')

        try:
            return load_existing_submission_file(filepath)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e







model_upload_RC_file_response = api.model('uploadRCFileResponse', {
    'size': fields.Integer(required=True, description='Size of the file in bytes'),
    'filepath': fields.String(required=True, description='Path to the file on the user\'s machine'),

})

model_get_RC_file_response = api.model('getRCFileResponse', {
    'text': fields.String(required=True, description='Text of the file'),
})

@api.route('/readme_changes_file')
class RCFile(Resource):

    parser_get_RC_file = reqparse.RequestParser(bundle_errors=True)
    parser_get_RC_file.add_argument('file_type', type=str, help="Either README or CHANGES from the user\'s Pennsieve account and dataset.", location="args", required=True)
    parser_get_RC_file.add_argument('selected_account', type=str, help='Pennsieve account name', location="args", required=True)
    parser_get_RC_file.add_argument('selected_dataset', type=str, help='Pennsieve dataset name', location="args", required=True)


    @api.marshal_with(model_get_RC_file_response, 200, False)
    @api.expect(parser_get_RC_file)
    @api.doc(description='Get the readme or changes file from Pennsieve.', responses={500: "Internal Server Error", 400: "Bad Request"})
    def get(self):
        data = self.parser_get_RC_file.parse_args()

        file_type = data.get('file_type')
        bfaccount = data.get('selected_account')
        bfdataset = data.get('selected_dataset')

        try:
            return import_bf_RC(bfaccount, bfdataset, file_type)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e


    parser_create_RC_file = parser_get_RC_file.copy()
    parser_create_RC_file.add_argument('text', type=str, help="Text of the file", location="json", required=True)


    @api.expect(parser_create_RC_file)
    @api.marshal_with(model_upload_RC_file_response, 200, False)
    @api.doc(description='Create a readme or changes file on the given dataset for the given Pennsieve account.', responses={500: "Internal Server Error", 400: "Bad Request", 403: "Forbidden"})
    def post(self):
        data = self.parser_create_RC_file.parse_args()

        file_type = data.get('file_type')
        bfaccount = data.get('selected_account')
        bfdataset = data.get('selected_dataset')
        text = data.get('text')

        try:
            return upload_RC_file(text, file_type, bfaccount, bfdataset)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e
    






model_list_of_string = api.model('basicListOfString', {
    'list_of_string': fields.List(fields.String, required=True, description='List of strings')
})

model_get_ds_description_file_response = api.model('getDSDescriptionFileResponse', {
    "Basic information": fields.List(fields.List(fields.String, required=True), required=True, description="Basic information"),
    "Study information": fields.List(fields.List(fields.String, required=True), required=True, description="Study information"),
    "Contributor information": fields.List(fields.List(fields.String, required=True), required=True, description="Contributor information"),
    "Award information": fields.List(fields.List(fields.String, required=True), required=True, description="Award information"),
    "Related information": fields.List(fields.List(fields.String, required=True), required=True, description="Related information")
})

model_save_ds_description_file_response = api.model('saveDSDescriptionFileResponse', {
    'size': fields.Integer(required=True, description='Path to the file on the user\'s machine'),
})

@api.route('/dataset_description_file')
class DatasetDescriptionFile(Resource):

    parser_get_ds_description_file = reqparse.RequestParser(bundle_errors=True)
    parser_get_ds_description_file.add_argument('filepath', type=str, help="Path to the dataset description file on the user\'s machine or Pennsieve.", location="args", required=True)
    parser_get_ds_description_file.add_argument('import_type', type=str, help='For this endpoint needs to be local.', location="args", required=True)

    @api.expect(parser_get_ds_description_file)
    @api.marshal_with(model_get_ds_description_file_response, 200, False)
    @api.doc(description='Get the dataset description file from the user\'s machine. A separate route exists for grabbing from Pennsieve.', responses={500: "Internal Server Error", 400: "Bad Request"})
    def get(self):
        data = self.parser_get_ds_description_file.parse_args()

        filepath = data.get('filepath')
        import_type = data.get('import_type')

        try:
            return load_existing_DD_file(import_type, filepath)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e

    



    parser_dataset_description_file = reqparse.RequestParser(bundle_errors=True)
    parser_dataset_description_file.add_argument('dataset_str', type=dict, required=True, location="json")
    parser_dataset_description_file.add_argument('filepath', type=str, location="json")
    parser_dataset_description_file.add_argument('upload_boolean', type=boolean, required=True, location="args")
    parser_dataset_description_file.add_argument('selected_account', type=str, location="json")
    parser_dataset_description_file.add_argument('selected_dataset', type=str, location="json")
    parser_dataset_description_file.add_argument('study_str', type=dict, required=True, location="json")
    parser_dataset_description_file.add_argument('contributor_str', type=dict, required=True, location="json")
    parser_dataset_description_file.add_argument('related_info_str', type=list, required=True, location="json")


    @api.expect(parser_dataset_description_file)
    @api.marshal_with(model_save_ds_description_file_response, 200, False)
    @api.doc(description='Save the dataset description file to the user\'s machine. A separate route exists for saving to Pennsieve.', responses={500: "Internal Server Error", 400: "Bad Request", 403: "Forbidden"})
    def post(self):
        data = self.parser_dataset_description_file.parse_args()

        print(data)

        dataset_str = data.get('dataset_str')
        filepath = data.get('filepath')
        upload_boolean = data.get('upload_boolean')
        selected_account = data.get('selected_account')
        selected_dataset = data.get('selected_dataset')
        study_str = data.get('study_str')
        contributor_str = data.get('contributor_str')
        related_info_str = data.get('related_info_str')

        if upload_boolean and not selected_account and not selected_dataset:
            api.abort(400, "Error:  To save a dataset description file on Pennsieve provide a dataset and pennsieve account.")

        if not upload_boolean and not filepath:
            api.abort(400, "Error:  To save a dataset description file on the user\'s machine provide a filepath.")

        try:
            return save_ds_description_file(upload_boolean, selected_account, selected_dataset, filepath, dataset_str, study_str, contributor_str, related_info_str)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e






@api.route('/subjects_file')
class SubjectsFile(Resource):

    parser_save_subjects_file = reqparse.RequestParser(bundle_errors=True)
    parser_save_subjects_file.add_argument('filepath', type=str, help="Path to the subjects file on the user\'s machine.", location="json", required=False)
    parser_save_subjects_file.add_argument('upload_boolean', type=boolean, help='Save subjecst on Pennsieve if True else save locally.', location="args", required=True)
    parser_save_subjects_file.add_argument('selected_account', type=str, help='Pennsieve account to save the subjects file to.', location="json", required=False)
    parser_save_subjects_file.add_argument('selected_dataset', type=str, help='Pennsieve dataset to save the subjects file to.', location="json", required=False)
    parser_save_subjects_file.add_argument('subjects_header_row', type=list, help='List of subjects to save.', location="json", required=True)

    @api.expect(parser_save_subjects_file)
    @api.doc(description='Save the subjects file to the user\'s machine or to Pennsieve.', responses={500: "Internal Server Error", 400: "Bad Request", 403: "Forbidden"})
    def post(self):
        data = self.parser_save_subjects_file.parse_args()

        filepath = data.get('filepath')
        upload_boolean = data.get('upload_boolean')
        selected_account = data.get('selected_account')
        selected_dataset = data.get('selected_dataset')
        subjects_str = data.get('subjects_header_row')

        if upload_boolean and not selected_account and not selected_dataset:
            api.abort(400, "To save a subjects file on Pennsieve provide a dataset and pennsieve account.")

        if not upload_boolean and not filepath:
            api.abort(400, "To save a subjects file on the user\'s machine provide a filepath.")


        try:
            return save_subjects_file(upload_boolean, selected_account, selected_dataset, filepath, subjects_str)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e


    parser_create_data_frames = reqparse.RequestParser(bundle_errors=True)
    parser_create_data_frames.add_argument('type', type=str, help="Subjects or Samples are the valid types.", location="args", required=True)
    parser_create_data_frames.add_argument('filepath', type=str, help="Path to the subjects or samples file on the user's machine.", location="args", required=True)
    parser_create_data_frames.add_argument('ui_fields', type=str, help='The fields to include in the final data frame.', location="args", required=True)

    @api.expect(parser_create_data_frames)
    @api.doc(description='Get a local subjects file data in the form of data frames.', responses={500: "Internal Server Error", 400: "Bad Request"})
    def get(self):
        data = self.parser_create_data_frames.parse_args()

        file_type = data.get('type')
        filepath = data.get('filepath')
        ui_fields = data.get('ui_fields')

        if file_type != 'subjects':
            api.abort(400, "Error: The type parameter must be subjects.")

        ui_fields = metadata_string_to_list(ui_fields)

        try:
            return convert_subjects_samples_file_to_df(file_type, filepath, ui_fields)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e







model_save_samples_result = api.model('SaveSamplesResult', {
    'size': fields.Integer(description='The size of the sample file that was saved through SODA.'),
})

model_field_sub_sam_list = api.model('FieldSubSamList', {
    'field': fields.List(fields.String, description='Subject or samples field values'),
})

model_get_samples_result = api.model('GetSamplesResult', {
    'sample_file_rows': fields.List(fields.List(fields.String, description="A sample file field."), description='A row of sample file fields.'),
})

@api.route('/samples_file')
class SamplesFile(Resource):
    
    parser_save_samples_file = reqparse.RequestParser(bundle_errors=True)
    parser_save_samples_file.add_argument('filepath', type=str, help="Path to the samples file on the user\'s machine.", location="json", required=False)
    parser_save_samples_file.add_argument('upload_boolean', type=boolean, help='Save samples on Pennsieve if True else save locally.', location="args", required=True)
    parser_save_samples_file.add_argument('selected_account', type=str, help='Pennsieve account to save the samples file to.', location="json", required=False)
    parser_save_samples_file.add_argument('selected_dataset', type=str, help='Pennsieve dataset to save the samples file to.', location="json", required=False)
    parser_save_samples_file.add_argument('samples_str', type=list, help='List of samples to save.', location="json", required=True)

    @api.expect(parser_save_samples_file)
    @api.doc(description='Save the samples file to the user\'s machine or to Pennsieve.', responses={500: "Internal Server Error", 400: "Bad Request", 403: "Forbidden"})
    @api.marshal_with(model_save_samples_result, 200, False)
    def post(self):
        data = self.parser_save_samples_file.parse_args()

        filepath = data.get('filepath')
        upload_boolean = data.get('upload_boolean')
        selected_account = data.get('selected_account')
        selected_dataset = data.get('selected_dataset')
        samples_str = data.get('samples_str')

        if upload_boolean and not selected_account and not selected_dataset:
            api.abort(400, "Error:  To save a samples file on Pennsieve provide a dataset and pennsieve account.")
        
        if not upload_boolean and not filepath:
            api.abort(400, "Error:  To save a samples file on the user\'s machine provide a filepath.")

        
        try:
            return save_samples_file(upload_boolean, selected_account, selected_dataset, filepath, samples_str)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e
    
    
    parser_create_data_frames = reqparse.RequestParser(bundle_errors=True)
    parser_create_data_frames.add_argument('type', type=str, help="samples.xlsx is the valid metadata type.", location="args", required=True)
    parser_create_data_frames.add_argument('filepath', type=str, help="Path to the subjects or samples file on the user's machine.", location="args", required=True)
    parser_create_data_frames.add_argument('ui_fields', type=str, help='The fields to include in the final data frame.', location="args", required=False)

    @api.expect(parser_create_data_frames)
    @api.doc(description='Get a local samples file data in the form of data frames.', responses={500: "Internal Server Error", 400: "Bad Request"})
    @api.marshal_with(model_get_samples_result, 200, False)
    def get(self):
        data = self.parser_create_data_frames.parse_args()

        file_type = data.get('type')
        filepath = data.get('filepath')
        ui_fields = data.get('ui_fields')

        print(ui_fields)

        if file_type != 'samples.xlsx':
            api.abort(400, "Error: The type parameter must be samples.")

        if ui_fields:
            # a bug in the reqparser library makes any input with location=args and type=list to be parsed character by character.
            # to fix this it would be necessary to join into a string, remove quotes and [] chars and then split on commas.
            # more than that the type in Swagger docs is not recognized as a list even when explicitly called one.
            # Rather than deal with that I will just set type=str and use the below workaround
            # that converts the string representation of the list to an actual list.
            ui_fields = list(map(str.strip, ui_fields.strip('][').replace("'", '').replace('"', '').split(',')))

        try:
            return convert_subjects_samples_file_to_df(file_type, filepath, ui_fields)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e





def none_type_validation(*args):
    return all(arg is not None for arg in args)

model_ui_fields = api.model('UIFields', {
    'ui_fields': fields.List(fields.String, description='For samples and subjects only. Every header from the respective file in list formatting.', required=False),
})

@api.route('/import_metadata_file')
class ImportBFMetadataFile(Resource):

    parser_import_metadata_file = reqparse.RequestParser(bundle_errors=True)
    parser_import_metadata_file.add_argument('selected_account', type=str, help='Pennsieve account to save the metadata file to.', location="args", required=True)
    parser_import_metadata_file.add_argument('selected_dataset', type=str, help='Pennsieve dataset to save the metadata file to.', location="args", required=True)
    parser_import_metadata_file.add_argument('file_type', type=str, help="The type of metadata file that we can import from Pennsieve. Must be [subjects.xlsx, samples.xlsx, dataset_description.xlsx, and submission.xlsx]", location="args", required=True)
    parser_import_metadata_file.add_argument('ui_fields', type=str, help="Path to the metadata file on the user's machine.", location="args", required=False)
    

    # @api.expect(parser_import_bf_metadata_file)
    @api.doc(description='Import a metadata file from Pennsieve. NOTE: CONTRARY TO THE SWAGGER UI THE PAYLOAD IS ONLY REQUIRED FOR SUBJECTS AND SAMPLES FILES.', 
            responses={500: "Internal Server Error", 400: "Bad Request"}
            )
    @api.expect(parser_import_metadata_file)
    def get(self):
        args = self.parser_import_metadata_file.parse_args()

        file_type = args.get('file_type')
        selected_account = args.get('selected_account')
        selected_dataset = args.get('selected_dataset')
        ui_fields = args.get('ui_fields')


        valid = none_type_validation(file_type, selected_account, selected_dataset)
        if not valid:
            api.abort(400, "Error: To import a metadata file from Pennsieve provide a file_type, selected_account, and selected_dataset.")
        
        if file_type not in ['submission.xlsx', 'samples.xlsx', 'subjects.xlsx', 'dataset_description.xlsx']:
            api.abort(400, "Error: The file_type parameter must be submission.xlsx, samples.xlsx, subjects.xlsx, or dataset_description.xlsx.")
        
        if file_type in ['samples.xlsx', 'subjects.xlsx'] and not ui_fields:
            api.abort(400, "An ui_fields property is required for fetching samples or subjects file types.")

        if ui_fields:
            # a bug in the reqparser library makes any input with location=args and type=list to be parsed character by character.
            # to fix this it would be necessary to join into a string, remove quotes and [] chars and then split on commas.
            # more than that the type in Swagger docs is not recognized as a list even when explicitly called one.
            # Rather than deal with that I will just set type=str and use the below workaround
            # that converts the string representation of the list to an actual list.
            ui_fields = list(map(str.strip, ui_fields.strip('][').replace("'", '').replace('"', '').split(',')))

        try:
            return import_bf_metadata_file(file_type, ui_fields, selected_account, selected_dataset)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e







@api.route('/template_paths')
class SetTemplatePath(Resource):

    parser_set_template_path = reqparse.RequestParser(bundle_errors=True)
    parser_set_template_path.add_argument('basepath', type=str, help='Path to the template directory', location="json", required=True)
    parser_set_template_path.add_argument('resourcesPath', type=str, help='Path to the template directory', location="json", required=True)

    @api.expect(parser_set_template_path)
    @api.doc(responses={500: "Internal Server Error", 400: "Bad Request"}, 
            description="The prepare metadata section of the application requires knowledge of the location of the application once it has been built and executed. This sets that path for the server no matter the OS.")
    def put(self):
        data = self.parser_set_template_path.parse_args()
        basepath = data.get('basepath')
        resourcesPath = data.get('resourcesPath')

        if basepath is None and resourcesPath is None:
            return api.abort(400, "Missing required parameters: basepath, resourcesPath")

        try:
            return set_template_path(basepath, resourcesPath)
        except Exception as e:
            api.abort(500, str(e))







@api.route('/import_milestone')
class ImportMilestone(Resource):
    parser_import_milestone = reqparse.RequestParser(bundle_errors=True)
    parser_import_milestone.add_argument('path', type=str, help='Path to the local data deliverables document', location="args")

    @api.expect(parser_import_milestone)
    @api.doc(description='Import a milestone from the user\'s machine.', responses={500: "Internal Server Error", 400: "Bad Request"})
    def get(self):
        args = self.parser_import_milestone.parse_args()
        path = args['path']
        try:
            data = import_milestone(path)
            return extract_milestone_info(data)
        except Exception as e:
            # check if invalidDataDeliverablesDocument exception
            if type(e).__name__  == 'InvalidDataDeliverablesDocument':
                api.abort(400, str(e))
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e






@api.route('/manifest_dummy_folders')
class DeleteManifestDummyFolders(Resource):

    parser_delete_manifest_dummy_folders = reqparse.RequestParser(bundle_errors=True)
    parser_delete_manifest_dummy_folders.add_argument('paths', type=list, help='Path to the local data deliverables document', location="json", required=True)

    @api.doc(description='Delete the dummy folders created by the manifest tool.', responses={500: "Internal Server Error", 400: "Bad Request", 200: "OK"})
    @api.expect(parser_delete_manifest_dummy_folders)
    def delete(self):
        data = self.parser_delete_manifest_dummy_folders.parse_args()
        
        paths = data.get('paths')

        try:
            return delete_manifest_dummy_folders(paths)
        except Exception as e:
            api.abort(500, str(e))




@api.route('/manifest_files/pennsieve')
class GenerateManifestFilesPennsieve(Resource):

    @api.doc(responses={500: 'There was an internal server error', 400: 'Bad Request'}, 
            description="Generate manifest files locally. Used in the standalone manifest file generation feature. Can take edit-manifest keyword that stores the manifest file in a separate directory. Allows ease of editing manifest information for the client.",
            params={"soda_json_object": "SODA dataset structure", 
                    "selected_account": "The pennsieve account for the user", 
                    "selected_dataset": "The dataset that the user wants to generate manifest files for"})
    # @api.marshal_with(model_generate_manifest_locally_response, False, 200)
    def post(self):
        data = request.get_json()

        selected_account = data.get("selected_account")
        selected_dataset = data.get("selected_dataset")
        soda_json_object = data.get("soda_json_object")

        if not selected_account or not selected_dataset or not soda_json_object:
            api.abort(400, "Error: To generate manifest files for Pennsieve provide a selected_account, selected_dataset, and soda_json_object.")

        try:
            return import_bf_manifest_file(soda_json_object, selected_account, selected_dataset)
        except Exception as e:
            api.abort(500, str(e))



manifest_creation_progress_model = api.model('ManifestCreationProgress', {
    'total_manifest_files': fields.Integer(description='Total amount of manifest files that need to be created for the current dataset.'),
    'manifest_files_uploaded': fields.Integer(description='Total amount of manifest files that have been created for the client.'),
})

@api.route('/manifest_files/pennsieve/progress')
class GetManifestFilesPennsieveProgress(Resource):
    
        @api.doc(responses={500: 'There was an internal server error'}, 
                description="Get the progress of the manifest file generation for Pennsieve. This is used to update the progress bar on the client side.")
        @api.marshal_with(manifest_creation_progress_model, False, 200)
        def get(self):
            try:
                return manifest_creation_progress()
            except Exception as e:
                api.abort(500, str(e))