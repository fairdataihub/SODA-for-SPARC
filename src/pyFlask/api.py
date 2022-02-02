#from validator import validate_dataset_pipeline
from flask import Flask, jsonify, request, json
from os.path import expanduser
#from organize_datasets import ps_retrieve_dataset

from sparcur.config import auth
from sparcur.simple.utils import backend_pennsieve
# project_id = auth.get('remote-organization')
PennsieveRemote = backend_pennsieve("N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0")
root = PennsieveRemote("N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0")
datasets = list(root.children)

print(datasets)

from sparcur.simple.validate import main as validate
from pathlib import Path
userpath = expanduser("~")

path = Path(userpath +  "\\Desktop\\Pennsieve-dataset-46-version-1\\files")
print(path)

blob = validate(path)


app = Flask(__name__)

@app.route("/")
def hello_world():
    return jsonify("Hello world")

@app.route("/api_ps_retrieve_dataset")
def api_ps_retrieve_dataset():
    # ps_retrieve_dataset()
    obj = request.args.get("obj")

    parsedObj = json.loads(obj)

    account = parsedObj["bf-account-selected"]
    
    
    return jsonify("Retrieved dataset")


@app.route("/api_validate_dataset_pipeline")
def api_validate_dataset_pipeline():
    # validate_dataset_pipeline()
    return jsonify("Dataset pipeline completed")

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)
    # app.run(host="127.0.0.1", port=7632, debug=True)