# TODO:  Include pipeline variable that accounts for certain pattern matching errors that should be ignored in a local pipeline; or not
#       as Tom mentioned wanting to fix that soon. 
# TODO: Include handling for -1 in the 

# read the path error report from the validator and only return the errors that do not have errors in their subpath 
def get_validation_errors(path_error_report):
    # create path options as Enum or whatever I want (object with #/route) as outer keys would be best)
    paths = {
        "meta": [
            "#/meta/techniques",
            "#/meta/timestamp_created",
            "#/meta/uri_api",
            "#/meta/uri_human",
            "#/meta",
        ],
        "inputs": {

        },
        "specimen_dirs": [
            "#/specimen_dirs"
        ],
        "id": [
            "#/id"
        ],
        "contributors": {
            "#/contributors"
        }, 
    }

	# create the message storage array [message(s), where the error occurred (aka, last element of path )]
    errors = []

	# Go through each path item, starting from shortest path, up (while ignoring #/ and #/inputs for now)
    for path in paths:
        # ignore inputs errors for now [there will be many input errors for 1.2.3 items that we don't care about]
        if path == "inputs": 
            continue
        for sub_path in path: 
		    # check if enum is a key
            if path_error_report.has_key(sub_path):
			    # store the last element of the path or last element -1 if last element is -1 
                error_location = sub_path.rsplit("/", -1)[-1]
			    # get the message(s) out of the error report path
                error = path_error_report.get(sub_path)
                messages = error.get("messages")

                # store the individual error messages in a separate errors entry with their error location
                for message in messages:
                    errors.push({error_location: error_location, message: message})

			    #  if so short circuit the current sub-nested loop cycle 
                break 

	# return the stored errors 
    return errors