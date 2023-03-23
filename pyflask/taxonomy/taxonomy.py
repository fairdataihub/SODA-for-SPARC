from Bio import Entrez

# use Entrez library to load the scientific name for a species
def load_taxonomy_species(animalRequest):  # sourcery skip: avoid-builtin-shadow
    animalDict = {}
    handle = Entrez.esearch(db="taxonomy", term=animalRequest)
    record = Entrez.read(handle)
    if len(record["IdList"]) > 0:
        id = record["IdList"][0]
        handle = Entrez.efetch(db="taxonomy", id=id)
        result = Entrez.read(handle)
        animalDict[animalRequest] = {
            "ScientificName": result[0]["ScientificName"],
            "OtherNames": result[0]["OtherNames"],
        }

    return animalDict