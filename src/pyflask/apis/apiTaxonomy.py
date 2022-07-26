from flask_restx import Resource, reqparse
from namespaces import get_namespace, NamespaceEnum
from taxonomy import load_taxonomy_species
from flask import request

api = get_namespace(NamespaceEnum.TAXONOMY)


@api.route("/species")
class Species(Resource):

    @api.doc(response={200: "Success", 400: "Bad Request", 500: "Internal Server Error"}, description="Get the scientific name for a species", params={"animals_list": "List of animal names"})
    def get(self):
        data = request.args.to_dict()

        animals_list = data.get("animals_list")

        if animals_list is None:
            api.abort(400, "Missing animal_list parameter")

        try:
            return load_taxonomy_species(animals_list)
        except Exception as e:
            api.abort(500, str(e))