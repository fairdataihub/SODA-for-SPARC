"""
Create manifest files for the skeleton dataset validation workflow. 

"""
from .manifest_writer import ManifestWriterStandaloneAlgorithm , ManifestWriterNewPennsieve, ManifestWriterStandaloneLocal, ManifestWriterNewLocal

class ManifestBuilderBase:
    """
    Builds manifest files for the skeleton dataset validation workflow.
    Places them at the root of the sekected directory.
    """
    def __init__(self, soda_json_structure, path):
        self.soda_json_structure = soda_json_structure
        self.skeleton_directory_path = path

    def build(self, ps=None):
        """"
        Builds manifest files for the given soda_json_structure and place them in the skeleton directory.
        """

        builder = self._create_manifest_builder()

        builder.write(self.soda_json_structure, ps)

    def _create_manifest_builder(self):
        """
        Creates the appropriate builder based on the soda_json_structure. Abstract.
        """
        raise NotImplementedError("Please Implement this method")
        


    def _get_generate_dataset_keys(self, soda_json_structure):
        """
        Returns the keys in the generate-dataset dictionary in the soda_json_structure.
        """

        destination = self.soda_json_structure["generate-dataset"]["destination"]
        generate_option = self.soda_json_structure["generate-dataset"]["generate-option"]

        if generate_option == "existing-bf":
            return destination, generate_option, None, None

        if_existing = self.soda_json_structure["generate-dataset"]["if-existing"]

        if "if-existing-files" not in self.soda_json_structure["generate-dataset"]:
            return destination, generate_option, if_existing, None

        if_existing_files = self.soda_json_structure["generate-dataset"]["if-existing-files"]

        return destination, generate_option, if_existing, if_existing_files

    def _updating_existing_dataset(self, soda_json_structure):
        """
        Returns True if the user is validating a dataset moving through the "update existing" dataset workflow. 
        False otherwise.
        """
        destination, generate_option, _, _ = self._get_generate_dataset_keys(soda_json_structure)

        return destination == "bf" and generate_option == "existing-bf"

    def _merging_into_existing_dataset(self, soda_json_structure):
        """
        Returns True if the user is validating a dataset moving through the "merge into existing" dataset workflow. 
        False otherwise.
        """
        destination, generate_option, _, _ = self._get_generate_dataset_keys(soda_json_structure)

        return destination == "bf" and generate_option == "new" and "bf-dataset-selected" in soda_json_structure

    def _creating_new_pennsieve_dataset(self, soda_json_structure):
        """
        Returns True if the user is validating a dataset moving through the "create new Pennsieve dataset" workflow. 
        False otherwise.
        """
        destination, generate_option, _, _ = self._get_generate_dataset_keys(soda_json_structure)

        return destination == "bf" and generate_option == "new" and "bf-dataset-selected" not in soda_json_structure


    def _creating_new_local_dataset(self, soda_json_structure):
        """
        Returns True if the user is validating a dataset moving through the "create new local dataset" workflow. 
        False otherwise.
        """
        destination, _, if_existing, _ = self._get_generate_dataset_keys(soda_json_structure)

        return destination == "local" and if_existing == "new"

    def _updating_existing_local_dataset(self, soda_json_structure):
        """
        Returns True if the user is validating a dataset moving through the "update existing local dataset" workflow. 
        False otherwise.
        """
        destination, _, if_existing, _ = self._get_generate_dataset_keys(soda_json_structure)

        return destination == "local" and if_existing == "merge"



class ManifestBuilder(ManifestBuilderBase):
    """
    Builds manifest files for the skeleton dataset validation workflow.
    """
    def _create_manifest_builder(self):
        if self._updating_existing_dataset(self.soda_json_structure) or self._merging_into_existing_dataset(self.soda_json_structure):
            return ManifestWriterStandaloneAlgorithm(self.soda_json_structure, self.skeleton_directory_path)
        elif self._creating_new_pennsieve_dataset(self.soda_json_structure):
            return ManifestWriterNewPennsieve(self.soda_json_structure, self.skeleton_directory_path)
        elif self._creating_new_local_dataset(self.soda_json_structure):
            return ManifestWriterNewLocal(self.soda_json_structure, self.skeleton_directory_path)
        elif self._updating_existing_local_dataset(self.soda_json_structure):
            # generating on top of an existing dataset
            return ManifestWriterStandaloneLocal(self.soda_json_structure, self.skeleton_directory_path)
        else:
            raise Exception("Invalid soda_json_structure")
