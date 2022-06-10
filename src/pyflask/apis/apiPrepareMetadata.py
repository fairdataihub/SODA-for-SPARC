from prepareMetadata import (
    save_submission_file,
    save_ds_description_file,
    extract_milestone_info,
    import_milestone,
    save_subjects_file,
    convert_subjects_samples_file_to_df,
    save_samples_file,
    load_taxonomy_species,
    load_existing_DD_file,
    load_existing_submission_file,
    import_bf_metadata_file,
    import_bf_RC,
    upload_RC_file,
    delete_manifest_dummy_folders,
    set_template_path
)
from namespaces import NamespaceEnum, get_namespace
from flask_restx import Resource, reqparse, fields
from flask_restx.inputs import boolean
from errorHandlers import notBadRequestException

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
    parser_save_submission_file.add_argument('json_str', type=str, help='JSON string to be uploaded', location="json", required=True)

    @api.expect(parser_save_submission_file)
    @api.response(200, 'OK', model_save_submission_file_response)
    @api.doc(description='Save a submission file locally or in a dataset stored on the Pennsieve account of the current user.', responses={500: "Internal Server Error", 400: "Bad Request"})
    def post(self):
        data = self.parser_save_submission_file.parse_args()

        upload_boolean = data.get('upload_boolean')
        bfaccount = data.get('selected_account')
        bfdataset = data.get('selected_dataset')
        filepath = data.get('filepath')
        json_str = data.get("json_str")


        if upload_boolean and filepath is None:
            api.abort(400, "Error: Please provide a destination in which to save your Submission file.")

        try:
            return save_submission_file(upload_boolean, bfaccount, bfdataset, filepath, json_str)
        except Exception as e:
            api.abort(500, str(e))



    parser_get_submission_file = reqparse.RequestParser(bundle_errors=True)
    parser_get_submission_file.add_argument('filepath', type=str, help="Path to the submission file on the user's machine", location="json", required=True)


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


@api.route('/template_paths')
class SetTemplatePath(Resource):

    parser_set_template_path = reqparse.RequestParser(bundle_errors=True)
    parser_set_template_path.add_argument('basepath', type=str, help='Path to the template directory', location="json")
    parser_set_template_path.add_argument('resourcesPath', type=str, help='Path to the template directory', location="json")

    @api.expect(parser_set_template_path)
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







parser_import_milestone = reqparse.RequestParser(bundle_errors=True)
parser_import_milestone.add_argument('path', type=str, help='Path to the local data deliverables document', location="args")
@api.route('/import_milestone')
class ImportMilestone(Resource):

    @api.expect(parser_import_milestone)
    def get(self):
        args = parser_import_milestone.parse_args()
        path = args['path']
        try:
            return import_milestone(path)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, e.args[0])
            raise e