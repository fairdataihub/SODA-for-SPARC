import copy

# return the errors from the error_path_report that should be shown to the user.
# as per Tom (developer of the Validator) for any paths (the keys in the Path_Error_Report object)
# return the ones that do not have any errors in their subpaths. 
# e.g., If given #/meta and #/meta/technique keys only return #/meta/technique (as this group doesn't have any subpaths)
def parse(error_path_report):

  user_errors = copy.deepcopy(error_path_report)

  keys = error_path_report.keys()

  # go through all paths and store the paths with the longest subpaths for each base 
  # also store matching subpath lengths together
  for k in keys:
    prefix = get_path_prefix(k)

    # check if the current path has inputs as a substring
    if prefix.find("inputs") != -1:
      # as per Tom ignore inputs paths' so
      # remove the given prefix with 'inputs' in its path
      del user_errors[k]
      continue 

    if prefix.find("id") != -1:
      del user_errors[k]
      continue

    # check for a suffix indicator in the prefix (aka a forward slash at the end of the prefix)
    if prefix[-1] == "/":
      # if so remove the suffix and check if the resulting prefix is an existing path key
      # indicating it can be removed from the errors_for_users dictionary as the current path
      # will be an error in its subpath -- as stated in the function comment we avoid these errors 
      prefix_no_suffix_indicator = prefix[0: len(prefix) - 1]

      if prefix_no_suffix_indicator in user_errors:
        del user_errors[prefix_no_suffix_indicator]


  
  return user_errors
  

def get_path_prefix(path):
  # check if path has one "/"
  if path.count('/') == 1:
    # get the entire path as the "prefix" and return it
    return path 
  else : 
    # get the path up to the final "/" and return it as the prefix
    final_slash_idx = path.rfind("/")
    return path[0: final_slash_idx + 1]