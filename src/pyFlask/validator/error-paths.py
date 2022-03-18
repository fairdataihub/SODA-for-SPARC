# TODO:  Include pipeline variable that accounts for certain pattern matching errors that should be ignored in a local pipeline; or not
#       as Tom mentioned wanting to fix that soon. 

# read the path error report from the validator and only return the errors that do not have errors in their subpath 
def get_validation_errors(path_error_report):
    # create path options as Enum or whatever I want (object with #/route) as outer keys would be best)
    paths = {
        "meta": {
            
        },
        "inputs": {

        },
        "specimen_dirs": {

        },
        "id": {

        },
        "contributors": {
            
        }
    }

	# create the message storage array [message(s), where the error occurred (aka, last element of path )]

	# Go through each path item, starting from shortest path, up (while ignoring #/ and #/inputs for now)
		#	check if enum is a key
			# store the last element of the path or last element -1 if last elemetn is -1 
			#  store the message 
			#  if so short circuit the current sub-nested loop cycle 

	# return the stored errors 