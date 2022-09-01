from openpyxl.utils.exceptions import InvalidFileException

def is_invalid_file_exception(e):
    return isinstance(e, InvalidFileException)