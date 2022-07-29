def is_file_not_found_exception(e):
    """
    Checks if the exception is a FileNotFoundException.
    """
    return isinstance(e, FileNotFoundError) 