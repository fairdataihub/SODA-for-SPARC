from disseminate import (
    bf_get_doi,
    bf_reserve_doi,
    bf_get_publishing_status,
    bf_publish_dataset,
    bf_submit_review_dataset,
    bf_withdraw_review_dataset,
    get_files_excluded_from_publishing,
    get_metadata_files
)
from flask_restx import Resource, fields
from namespaces import NamespaceEnum, get_namespace
from errorHandlers import notBadRequestException

api = get_namespace(NamespaceEnum.DISSEMINATE_DATASETS)


model_success_message_response = api.model('SuccessMessageResponse', {
    "message": fields.String(required=True, description="Success message")
})

model_get_doi_response = api.model('DOIResponse', {
    "doi": fields.String(required=True, description="DOI")
})


@api.route("/datasets/<string:dataset_name_or_id>/doi")
class BfGetDoi(Resource):
    parser = api.parser()
    parser.add_argument("selected_account", type=str, help="Pennsieve account name", location="args", required=True)

    @api.doc(responses={200: "Success", 400: "Validation Error", 500: "Internal Server Error"})
    @api.expect(parser)
    @api.marshal_with(model_get_doi_response)
    def get(self, dataset_name_or_id):
        # get the arguments
        data = self.parser.parse_args()
        selected_bfaccount = data.get("selected_account")

        try:
            return bf_get_doi(selected_bfaccount, dataset_name_or_id)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e


    @api.expect(parser)
    @api.marshal_with(model_success_message_response, 200, False)
    @api.doc(responses={400: "Validation Error", 500: "Internal Server Error"}, description="Reserve a DOI for a dataset")
    def post(self, dataset_name_or_id):
        # get the arguments
        data = self.parser.parse_args()
        selected_bfaccount = data.get("selected_account")

        try:
            return bf_reserve_doi(selected_bfaccount, dataset_name_or_id)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e





model_ignore_files_object = api.model('IgnoreFilesObject', {
    "datasetId": fields.String(required=True, description="Dataset ID"),
    "fileName": fields.String(required=True, description="File name"),
    "id": fields.String(required=True, description="File ID")
})


model_ignore_files_response = api.model('IgnoreFilesResponse', {
    "ignore_files": fields.List(fields.Nested(model_ignore_files_object), required=True, description="Files excluded from publishing")
})


@api.route('/datasets/<string:dataset_name_or_id>/ignore-files')
class BfIgnoreFiles(Resource):
    parser = api.parser()
    parser.add_argument("selected_account", type=str, help="Pennsieve account name", location="args", required=True)

    @api.doc(responses={200: "Success", 400: "Validation Error", 500: "Internal Server Error"})
    @api.expect(parser)
    @api.marshal_with(model_ignore_files_response)
    def get(self, dataset_name_or_id):
        # get the arguments
        data = self.parser.parse_args()
        selected_bfaccount = data.get("selected_account")

        try:
            return get_files_excluded_from_publishing(dataset_name_or_id,  selected_bfaccount)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e







model_metadata_files_response = api.model('MetadataFilesResponse', {
    "metadata_files": fields.List(fields.String, required=True, description="Metadata files")
})

@api.route('/datasets/<string:dataset_name_or_id>/metadata-files')
class BfMetadataFiles(Resource):
    parser = api.parser()
    parser.add_argument("selected_account", type=str, help="Pennsieve account name", location="args", required=True)

    @api.doc(responses={200: "Success", 400: "Validation Error", 500: "Internal Server Error"})
    @api.expect(parser)
    @api.marshal_with(model_metadata_files_response)
    def get(self, dataset_name_or_id):
        # get the arguments
        data = self.parser.parse_args()
        selected_bfaccount = data.get("selected_account")

        try:
            return get_metadata_files(dataset_name_or_id,  selected_bfaccount)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e







model_publishing_status_response = api.model('PublishingStatusResponse', {
    "publishing_status": fields.String(required=True, description="Publishing status"),
    "review_request_status": fields.String(required=True, description="Review request status")
})


@api.route("/datasets/<string:dataset_name_or_id>/publishing_status")
class PublishingStatus(Resource):
    parser = api.parser()
    parser.add_argument("selected_account", type=str, help="Pennsieve account name", location="args", required=True)

    @api.doc(responses={400: "Validation Error", 500: "Internal Server Error"}, description="Get the publishing status of a dataset.")
    @api.expect(parser)
    @api.marshal_with(model_publishing_status_response, 200, False)
    def get(self, dataset_name_or_id):
        # get the arguments
        data = self.parser.parse_args()

        selected_bfaccount = data.get("selected_account")

        try:
            return bf_get_publishing_status(selected_bfaccount, dataset_name_or_id)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e