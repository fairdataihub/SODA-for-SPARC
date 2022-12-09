"""
Classes for creating manifest files for a dataset stored locally/on Pennsieve. 
"""


class ManifestWriter(object):
    """
    Writes manifest files for a dataset stored locally or on Pennsieve.
    """

    def __init__(self, soda_json_structure, path):
        """
        Constructor.
        """
        self.soda_json_structure = soda_json_structure
        # where the manifest file(s) will be written to
        self.manifest_path = path


    def write(self, soda_json_structure, ps):
        """
        Writes the manifest file for the dataset. Abstract.
        """
        raise NotImplementedError("Please Implement this method")


class ManifestWriterStandaloneAlgorithm(ManifestWriter):
    """
    Writes manifest files for a dataset that is stored on Pennsieve and has local changes.
    """

    def __init__(self, soda_json_structure, path):
        """
        Constructor.
        """
        super(ManifestWriterStandaloneAlgorithm, self).__init__(soda_json_structure, path)


    def write(self, soda_json_structure, ps):
        """
        Writes the manifest file for the dataset.
        """
        # create the manifest file
        

        # write the manifest file to the skeleton directory's root folder
