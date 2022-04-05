

error_path_report = {
  "#/": {
    "error_count": 1,
    "messages": ["'path_metadata' is a required property"]
  },
  "#/contributors": {
    "error_count": 1,
    "messages": [
      "[{'contributor_name': 'Marroquin, Christopher', 'contributor_orcid': 'https://orcid.org/0000-0002-3399-1731', 'contributor_affiliation': 'https://ror.org/0168r3w48', 'contributor_role': ['PrincipalInvestigator'], 'first_name': 'Christopher', 'last_name': 'Marroquin', 'id': 'https://orcid.org/0000-0002-3399-1731'}] is not valid under any of the given schemas"
    ]
  },
  "#/id": {
    "error_count": 1,
    "messages": [
      "'cgeNh_H8zjDDsGcJn2wlicHHZcjoavLjuiZxzsRAw2ix6Tp4Bwutpuj2ykK8i1JamSX9nurlL6MSLF7LlUicLA:C:/Users/CMarroquin/temp-datasets/DatasetTemplate' does not match '^N:dataset:'"
    ]
  },
  "#/inputs/dataset_description_file": {
    "error_count": 8,
    "messages": [
      "'description' is a required property",
      "'funding' is a required property",
      "'name' is a required property",
      "'protocol_url_or_doi' is a required property"
    ]
  },
  "#/inputs/dataset_description_file/contributors": {
    "error_count": 1,
    "messages": [
      "[{'contributor_name': 'Marroquin, Christopher', 'contributor_orcid': 'https://orcid.org/0000-0002-3399-1731', 'contributor_affiliation': 'https://ror.org/0168r3w48', 'contributor_role': ['PrincipalInvestigator']}] is not valid under any of the given schemas"
    ]
  },
  "#/inputs/manifest_file/-1/contents/manifest_records/-1": {
    "error_count": 1,
    "messages": [
      "{'description': 'j'} is not valid under any of the given schemas"
    ]
  },
  "#/inputs/manifest_file/-1/uri_api": {
    "error_count": 1,
    "messages": [
      "'file://C:/Users/CMarroquin/temp-datasets/DatasetTemplate/manifest.xlsx' does not match '^(https?):\\\\/\\\\/([^\\\\s\\\\/]+)\\\\/([^\\\\s]*)'"
    ]
  },
  "#/inputs/manifest_file/-1/uri_human": {
    "error_count": 1,
    "messages": [
      "'file://C:/Users/CMarroquin/temp-datasets/DatasetTemplate/manifest.xlsx' does not match '^(https?):\\\\/\\\\/([^\\\\s\\\\/]+)\\\\/([^\\\\s]*)'"
    ]
  },
  "#/meta": {
    "error_count": 6,
    "messages": [
      "'award_number' is a required property",
      "'description' is a required property",
      "'funding' is a required property",
      "'modality' is a required property",
      "'organ' is a required property",
      "'title' is a required property"
    ]
  },
  "#/meta/techniques": {
    "error_count": 1,
    "messages": ["[] is too short"]
  },
  "#/meta/timestamp_created": {
    "error_count": 1,
    "messages": ["None is not of type 'string'"]
  },
  "#/meta/uri_api": {
    "error_count": 1,
    "messages": [
      "'file://C:/Users/CMarroquin/temp-datasets/DatasetTemplate' does not match '^https://api\\\\.pennsieve\\\\.io/(datasets|packages)/'"
    ]
  },
  "#/meta/uri_human": {
    "error_count": 1,
    "messages": [
      "'file://C:/Users/CMarroquin/temp-datasets/DatasetTemplate' does not match '^https://app\\\\.pennsieve\\\\.io/N:organization:'"
    ]
  },
  "#/specimen_dirs": {
    "error_count": 3,
    "messages": [
      "'records' is a required property",
      "No folder for sample sam-1",
      "There are specimens that have no corresponding directory!\n{'sub-1_sam-1', 'sub-1'}"
    ]
  }
}




# return the errors from the error_path_report that should be shown to the user.
# as per Tom (developer of the Validator) for any paths (the keys in the Path_Error_Report object)
# with common prefixes, only return the one that doesn't have any errors in its subpaths. 
# e.g., If given #/meta and #/meta/technique keys only return #/meta/technique (as this group doesn't have any subpaths)
def get_target_errors(error_path_report):
  keys = error_path_report.keys()

  errors_for_users = {}

  # go through all paths and store the paths with the longest subpaths for each base 
  # also store matching subpath lengths together
  for k in keys:
    base = get_path_base(k)
    key_length = len(k)

    if base not in errors_for_users:
      errors_for_users[base] = {
       "k": k,
       "l": key_length,
       "error_object": error_path_report[k]
      }
    else:
      if key_length > errors_for_users[base]["l"]:
        errors_for_users[base] = {
          "k": k,
          "l": key_length,
          "error_object": error_path_report[k]
        }

  
  return errors_for_users
  

def get_path_base(path):
  # base is after first forward slash and between the second or the end of the string 
  base_idx = path.find("/")
  end_base_idx = None
  for char_idx in range(base_idx + 1, len(path)):
    # find the first forward slash
    if path[char_idx] == "/":
      # store the end of the base index as the first forward slash's position
      end_base_idx = char_idx
      break 
  
    # if no end index was found the end is the last index of the key
    if end_base_idx == None:
      end_base_idx = len(path)
      # print("Length of the key is: ", len(path))
      # print("End is defined?: ", end_base_idx)

  # return the base of the given path error report path key 
  base = path[base_idx: end_base_idx]

  return base 
    

    

print(get_target_errors(error_path_report))   


{
    '/': {
        'k': '#/',
        'l': 2,
        'error_object': {
            'error_count': 1,
            'messages': ["'path_metadata' is a required property"]
        }
    },
    '/contributors': {
        'k': '#/contributors',
        'l': 14,
        'error_object': {
            'error_count': 1,
            'messages': ["[{'contributor_name': 'Marroquin, Christopher', 'contributor_orcid': 'https://orcid.org/0000-0002-3399-1731', 'contributor_affiliation': 'https://ror.org/0168r3w48', 'contributor_role': ['PrincipalInvestigator'], 'first_name': 'Christopher', 'last_name': 'Marroquin', 'id': 'https://orcid.org/0000-0002-3399-1731'}] is not valid under any of the given schemas"]
        }
    },
    '/id': {
        'k': '#/id',
        'l': 4,
        'error_object': {
            'error_count': 1,
            'messages': ["'cgeNh_H8zjDDsGcJn2wlicHHZcjoavLjuiZxzsRAw2ix6Tp4Bwutpuj2ykK8i1JamSX9nurlL6MSLF7LlUicLA:C:/Users/CMarroquin/temp-datasets/DatasetTemplate' does not match '^N:dataset:'"]
        }
    },
    '/inputs': {
        'k': '#/inputs/manifest_file/-1/contents/manifest_records/-1',
        'l': 54,
        'error_object': {
            'error_count': 1,
            'messages': ["{'description': 'j'} is not valid under any of the given schemas"]
        }
    },
    '/meta': {
        'k': '#/meta/timestamp_created',
        'l': 24,
        'error_object': {
            'error_count': 1,
            'messages': ["None is not of type 'string'"]
        }
    },
    '/specimen_dirs': {
        'k': '#/specimen_dirs',
        'l': 15,
        'error_object': {
            'error_count': 3,
            'messages': ["'records' is a required property", 'No folder for sample sam-1', "There are specimens that have no corresponding directory!\n{'sub-1_sam-1', 'sub-1'}"]
        }
    }
}
