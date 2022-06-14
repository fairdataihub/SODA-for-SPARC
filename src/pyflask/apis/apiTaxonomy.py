from flask_restx import Resource, reqparse
from namespaces import get_namespace, NamespaceEnum
from taxonomy import load_taxonomy_species

api = get_namespace(NamespaceEnum.TAXONOMY)


@api.route("/species")
class Species(Resource):

    parser = reqparse.RequestParser(bundle_errors=True)

    parser.add_argument("animal_list", type=list, required=True, help="Animal names", location="json")

    @api.expect(parser)
    @api.doc(response={200: "Success", 400: "Bad Request", 500: "Internal Server Error"}, description="Get the scientific name for a species")
    def get(self):
        animals_list = self.parser.parse_args().get("animal_list")

        try:
            return load_taxonomy_species(animals_list)
        except Exception as e:
            api.abort(500, str(e))