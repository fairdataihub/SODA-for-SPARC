from pennsieve import Pennsieve
from flask import abort

def get_dataset(ps, selected_dataset):
    """
    Function to get the dataset
    """

    try:
        myds = ps.get_dataset(selected_dataset)
    except Exception as e:
        # TODO: Account for 500 errors
        abort(400, "Please select a valid Pennsieve dataset")

    
    return myds

    