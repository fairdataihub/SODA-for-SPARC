import werkzeug
from validator import val_dataset_local_pipeline
from flask import Flask, jsonify, request, json
import os.path
from os.path import expanduser
# from organize_datasets import ps_retrieve_dataset
from sparcur.simple.validate import main as validate
from pathlib import Path
from sparcur.config import auth
from sparcur.simple.utils import backend_pennsieve
# project_id = auth.get('remote-organization')
userpath = expanduser("~")
from pprint import pprint

# from sparcur.config import auth
# from sparcur.simple.utils import backend_pennsieve
# project_id = auth.get('remote-organization')
# PennsieveRemote = backend_pennsieve("N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0")
# root = PennsieveRemote("N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0")
# datasets = list(root.children)


from json import JSONEncoder
from collections import deque

class DequeEncoder(JSONEncoder):
    def default(self, obj):
       if isinstance(obj, deque):
          return list(obj)
       return JSONEncoder.default(self, obj)

app = Flask(__name__)

@app.route("/")
def hello_world():
    return jsonify("Hello world")


@app.route("/api_validate_pennsieve_dataset")
def api_ps_retrieve_dataset():
    for i in range(0, 100000): 
        pass
    
    return jsonify([{"message": "sahahshas", "validator": "required"}])


@app.route("/api_validate_dataset_pipeline")
@app.errorhandler(werkzeug.exceptions.BadRequest)
def api_validate_dataset_pipeline():
    # get the dataset relative path
    ds_path = request.args.get("dataset-path")
    # convert the path to absolute from user's home directory
    joined_path = os.path.join(userpath, ds_path.strip())
    # convert to Path object for Validator to function properly
    norm_ds_path = Path(joined_path)

    print(norm_ds_path)

    path = Path(userpath +  "\\Documents\\Pennsieve-dataset-114-version-2\\files")

    blob = validate(path)

    errors = blob.get('errors')

    return json.dumps(errors, cls=DequeEncoder)

    # return json.dumps(validate(path), cls=DequeEncoder)

    

    # validate the dataset
    validation_result = None 
    try:
        # validate and get dictionary back
        validation_result = val_dataset_local_pipeline(path)
    except:
        return "Critical validation error!", 400
    
    errors = validation_result.get('errors')

    # for now encode the dequeue object as a list
    return json.dumps(errors, cls=DequeEncoder)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001)
    # app.run(host="127.0.0.1", port=7632, debug=True)