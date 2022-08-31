from flask_restx import Resource, reqparse, fields
from namespaces import get_namespace, NamespaceEnum
from errorHandlers import notBadRequestException, handle_http_error
from datasets import get_role, get_dataset_by_id


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
