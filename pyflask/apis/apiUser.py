from flask_restx import Resource, reqparse
from namespaces import get_namespace, NamespaceEnum

from users import integrate_orcid_with_pennsieve, get_user, set_preferred_organization, get_user_organizations

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





@api.route('/')
class User(Resource):

    @api.doc(response={200: "Success", 400: "Bad Request", 500: "Internal Server Error"}, description="Get a user's information.")
    def get(self):

        try:
            return get_user()
        except Exception as e:
            api.abort(500, str(e))


    def put(self):
        data = self.parser.parse_args()


@api.route('/organizations/preferred')
class PreferredOrganization(Resource):
    parser = reqparse.RequestParser(bundle_errors=True)
    parser.add_argument("organization_id", type=str, required=True, help="The id for the users perferred organization", location="json")
    parser.add_argument("email", type=str, required=True, help="The users Pennsieve email", location="json")
    parser.add_argument("password", type=str, required=True, help="The users Pennsieve password", location="json")
    parser.add_argument("account", type=str, required=True, help="The users account name", location="json")

    

    def put(self):
        data = self.parser.parse_args()
        organization = data.get("organization_id")
        email = data.get("email")
        password = data.get("password")
        account = data.get("account")


        try:
            return set_preferred_organization(organization, email, password, account)
        except Exception as e:
            api.abort(500, str(e))


@api.route('/organizations')
class Organizations(Resource):
    def get(self):
        try:
            return get_user_organizations()
        except Exception as e:
            api.abort(500, str(e))
