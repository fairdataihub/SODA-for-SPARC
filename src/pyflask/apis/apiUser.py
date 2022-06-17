from flask_restx import Resource, reqparse
from namespaces import get_namespace, NamespaceEnum

from users import integrate_orcid_with_pennsieve

api = get_namespace(NamespaceEnum.USER)


@api.route("/orcid")
class Orcid(Resource):
  
      parser = reqparse.RequestParser(bundle_errors=True)
  
      parser.add_argument("access_code", type=str, required=True, help="ORCID", location="json")
      parser.add_argument("pennsieve_account", type=str, required=True, help="Pennsieve account", location="args")
  
      @api.expect(parser)
      @api.doc(response={200: "Success", 400: "Bad Request", 500: "Internal Server Error"}, description="Given an OAuth access code link a user's ORCID ID to their Pennsieve account.This is required in order to publish a dataset for review with the SPARC Consortium.")
      def post(self):
          data = self.parser.parse_args()

          access_code = data.get("access_code")
          pennsieve_account = data.get("pennsieve_account")

  
          try:
              return integrate_orcid_with_pennsieve(access_code, pennsieve_account)
          except Exception as e:
              api.abort(500, str(e))



