from flask_restx import Resource, reqparse
from namespaces import get_namespace, NamespaceEnum

from users import integrate_orcid_with_pennsieve, get_user, set_preferred_organization, get_user_organizations, create_profile_name, set_default_profile
from errorHandlers.notBadRequestException import notBadRequestException


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
            api.logger.exception(e)
            if notBadRequestException(e):
                # general exception that was unexpected and caused by our code
                api.abort(500, str(e))
            if e.response is not None:
                # requests exeption
                api.logger.info("Error message details: ", e.response.json().get('message'))
                api.abort(e.response.status_code, e.response.json().get('message'))
            else:
                # custom werkzeug.exception that we raised
                api.abort(e.code, e.description)


@api.route("/profile_name")
class ProfileName(Resource):

    @api.doc(response={200: "Success", 400: "Bad Request", 500: "Internal Server Error"}, description="Create a unqiuely idenfitifable profile name for a user. This is used in the config.ini file to associate Pennsieve API Keys with a user and their selected workspace.")
    def post(self):
        try:
            return create_profile_name()
        except Exception as e:
            api.logger.exception(e)
            if notBadRequestException(e):
                # general exception that was unexpected and caused by our code
                api.abort(500, str(e))
            if e.response is not None:
                # requests exeption
                api.logger.info("Error message details: ", e.response.json().get('message'))
                api.abort(e.response.status_code, e.response.json().get('message'))
            else:
                # custom werkzeug.exception that we raised
                api.abort(e.code, e.description)


@api.route('/')
class User(Resource):

    @api.doc(response={200: "Success", 400: "Bad Request", 500: "Internal Server Error"}, description="Get a user's information.")
    def get(self):

        try:
            return get_user()
        except Exception as e:
            api.logger.exception(e)
            if notBadRequestException(e):
                # general exception that was unexpected and caused by our code
                api.abort(500, str(e))
            if e.response is not None:
                # requests exeption
                api.logger.info("Error message details: ", e.response.json().get('message'))
                api.abort(e.response.status_code, e.response.json().get('message'))
            else:
                # custom werkzeug.exception that we raised
                api.abort(e.code, e.description)


    def put(self):
        data = self.parser.parse_args()






@api.route('/default_profile')
class DefaultProfile(Resource):
    parser = reqparse.RequestParser(bundle_errors=True)
    parser.add_argument("target_profile", type=str, required=True, help="The name of the profile to set as default", location="json")


    def put(self):
        data = self.parser.parse_args()
        profile_name = data.get("target_profile")

        try:
            return set_default_profile(profile_name)
        except Exception as e:
            api.logger.exception(e)
            if notBadRequestException(e):
                # general exception that was unexpected and caused by our code
                api.abort(500, str(e))
            if e.response is not None:
                # requests exeption
                api.logger.info("Error message details: ", e.response.json().get('message'))
                api.abort(e.response.status_code, e.response.json().get('message'))
            else:
                # custom werkzeug.exception that we raised
                api.abort(e.code, e.description)



    post_parser = reqparse.RequestParser(bundle_errors=True)
    post_parser.add_argument("email", type=str, required=True, help="The name of the profile to set as default", location="json")
    post_parser.add_argument("password", type=str, required=True, help="The name of the profile to set as default", location="json")
    post_parser.add_argument("machineUsernameSpecifier", type=str, required=True, help="The specifier for the machine and username combination")
    def post(self):
        data = self.post_parser.parse_args()
        email = data.get("email")
        password = data.get("password")
        machineUsernameSpecifier = data.get("machineUsernameSpecifier")

        try:
            return create_profile_name(machineUsernameSpecifier, email, password)
        except Exception as e:
            api.abort(500, str(e))






@api.route('/organizations/preferred')
class PreferredOrganization(Resource):
    parser = reqparse.RequestParser(bundle_errors=True)
    parser.add_argument("organization_id", type=str, required=True, help="The id for the users perferred organization", location="json")
    parser.add_argument("email", type=str, required=True, help="The users Pennsieve email", location="json")
    parser.add_argument("password", type=str, required=True, help="The users Pennsieve password", location="json")
    parser.add_argument("machine_username_specifier", type=str, required=True, help="The users Pennsieve machine username specifier", location="json")
    

    def put(self):
        data = self.parser.parse_args()
        organization = data.get("organization_id")
        email = data.get("email")
        password = data.get("password")
        machine_username_specifier = data.get("machine_username_specifier")


        try:
            return set_preferred_organization(organization, email, password, machine_username_specifier)
        except Exception as e:
            api.logger.exception(e)
            if notBadRequestException(e):
                # general exception that was unexpected and caused by our code
                api.abort(500, str(e))
            if e.response is not None:
                # requests exeption
                api.logger.info("Error message details: ", e.response.json().get('message'))
                api.abort(e.response.status_code, e.response.json().get('message'))
            else:
                # custom werkzeug.exception that we raised
                api.abort(e.code, e.description)






@api.route('/organizations')
class Organizations(Resource):
    def get(self):
        try:
            return get_user_organizations()
        except Exception as e:
            api.logger.exception(e)
            if notBadRequestException(e):
                # general exception that was unexpected and caused by our code
                api.abort(500, str(e))
            if e.response is not None:
                # requests exeption
                api.logger.info("Error message details: ", e.response.json().get('message'))
                api.abort(e.response.status_code, e.response.json().get('message'))
            else:
                # custom werkzeug.exception that we raised
                api.abort(e.code, e.description)
