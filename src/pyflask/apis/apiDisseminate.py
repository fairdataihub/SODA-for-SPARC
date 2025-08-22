from disseminate import (
    bf_get_doi,
    bf_reserve_doi,
    bf_get_publishing_status,
    bf_submit_review_dataset,
    bf_withdraw_review_dataset,
    get_metadata_files,    
)
from flask_restx import Resource, fields, reqparse
from namespaces import NamespaceEnum, get_namespace
from errorHandlers import notBadRequestException, handle_http_error
from flask import request

api = get_namespace(NamespaceEnum.DISSEMINATE_DATASETS)


model_success_message_response = api.model('SuccessMessageResponse', {
    "message": fields.String(required=True, description="Success message")
})

model_get_doi_response = api.model('DOIResponse', {
    "doi": fields.String(required=True, description="DOI")
})


@api.route("/datasets/<string:dataset_name>/doi")
class BfGetDoi(Resource):
    parser = api.parser()

    @api.doc(responses={200: "Success", 400: "Validation Error", 500: "Internal Server Error"})
    @api.expect(parser)
    @api.marshal_with(model_get_doi_response)
    def get(self, dataset_name):

        try:
            return bf_get_doi( dataset_name)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e


    @api.expect(parser)
    @api.marshal_with(model_success_message_response, 200, False)
    @api.doc(responses={400: "Validation Error", 500: "Internal Server Error"}, description="Reserve a DOI for a dataset")
    def post(self, dataset_name):
        # get the arguments
        data = self.parser.parse_args()
        selected_bfaccount = data.get("selected_account")

        try:
            return bf_reserve_doi(selected_bfaccount, dataset_name)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e





model_metadata_files_response = api.model('MetadataFilesResponse', {
    "metadata_files": fields.List(fields.String, required=True, description="Metadata files")
})

@api.route('/datasets/<string:dataset_name>/metadata-files')
class BfMetadataFiles(Resource):
    parser = api.parser()
    parser.add_argument("selected_account", type=str, help="Pennsieve account name", location="args", required=True)

    @api.doc(responses={200: "Success", 400: "Validation Error", 500: "Internal Server Error"})
    @api.expect(parser)
    @api.marshal_with(model_metadata_files_response)
    def get(self, dataset_name):

        try:
            return get_metadata_files(dataset_name)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e







model_publishing_status_response = api.model('PublishingStatusResponse', {
    "publishing_status": fields.String(required=True, description="Publishing status"),
    "review_request_status": fields.String(required=True, description="Review request status")
})


@api.route("/datasets/<string:dataset_name>/publishing_status")
class PublishingStatus(Resource):
    parser = api.parser()
    parser.add_argument("selected_account", type=str, help="Pennsieve account name", location="args", required=True)

    @api.doc(responses={400: "Validation Error", 500: "Internal Server Error"}, description="Get the publishing status of a dataset.")
    @api.expect(parser)
    @api.marshal_with(model_publishing_status_response, 200, False)
    def get(self, dataset_name):
        # get the arguments
        data = self.parser.parse_args()

        selected_bfaccount = data.get("selected_account")

        try:
            return bf_get_publishing_status(selected_bfaccount, dataset_name)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e







@api.route("/datasets/<string:dataset_name>/publication/request")
class PublicationRequest(Resource):

    publication_parser_post = reqparse.RequestParser()
    publication_parser_post.add_argument("selected_account", type=str, help="Pennsieve account name", location="args", required=True)
    publication_parser_post.add_argument("publication_type", type=str, help="Type of publication (string).", location="json", required=True)
    publication_parser_post.add_argument("embargo_release_date", type=str, help="(optional) Date at which embargo lifts from dataset after publication", location="json", required=False)


    @api.expect(publication_parser_post)
    @api.doc(responses={200: "Success", 400: "Validation Error", 500: "Internal Server Error", 403: "Forbidden"}, description="Request publication of a dataset.")
    def post(self, dataset_name):
        # get the arguments
        data = self.publication_parser_post.parse_args()
        selected_account = data.get("selected_account")
        publication_type = data.get("publication_type")
        embargo_release_date = data.get("embargo_release_date")


        try:
            return bf_submit_review_dataset(selected_account, dataset_name, publication_type, embargo_release_date)
        except Exception as e:
            if type(e).__name__ == "HTTPError":
                api.abort(400, "Ensure the publication type is valid and that the embargo release date is no more than a year out.")
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e







@api.route("/datasets/<string:dataset_name>/publication/cancel")
class PublicationCancel(Resource):
    
        @api.doc(responses={200: "Success", 400: "Validation Error", 500: "Internal Server Error"})
        def post(self, dataset_name):
            try:
                return bf_withdraw_review_dataset(dataset_name)
            except Exception as e:
                if notBadRequestException(e):
                    api.abort(500, str(e))
                raise e
