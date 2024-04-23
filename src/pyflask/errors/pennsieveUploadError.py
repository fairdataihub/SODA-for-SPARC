# An Exception class for when the Pennsieve Agent encounters an exception when upload files

class PennsieveUploadException(Exception):
    def __init__(self, message):
        self.message = message
        super().__init__(self.message)


