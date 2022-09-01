from Bio import Entrez

# use Entrez library to load the scientific name for a species
def load_taxonomy_species(animalList):
    animalDict = {}
    for animal in animalList:
        handle = Entrez.esearch(db="Taxonomy", term=animal)
        record = Entrez.read(handle)
        if len(record["IdList"]) > 0:
            id = record["IdList"][0]
            handle = Entrez.efetch(db="Taxonomy", id=id)
            result = Entrez.read(handle)
            animalDict[animal] = {
                "ScientificName": result[0]["ScientificName"],
                "OtherNames": result[0]["OtherNames"],
            }

    return animalDict