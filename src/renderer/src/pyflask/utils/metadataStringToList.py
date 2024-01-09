
def metadata_string_to_list(metadata_string):
    """
    Converts a metadata string to a list of metadata.
    A bug in the reqparser library makes any input with location=args and type=list to be parsed character by character.
    to fix this it would be necessary to join into a string, remove quotes and [] chars and then split on commas.
    More than that the type in Swagger docs is not recognized as a list even when explicitly called one.
    Rather than deal with that I will just set type=str and use the below workaround
    that converts the string representation of the list to an actual list.
    """
    if metadata_string is None:
        return []
    else:
        return list(map(str.strip, metadata_string.strip('][').replace("'", '').replace('"', '').split(',')))