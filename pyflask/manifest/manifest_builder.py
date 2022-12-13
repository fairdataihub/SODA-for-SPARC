"""
Create manifest files for the skeleton dataset validation workflow. 

# TODO: add the manifest file creation function here
# NOTE: It seems that the import keeps teh manifest key value empty if the user is not creating a new manifest file and that organize datasets 
# adds the generate-dataset value inside of the manifest-files key if the user is creating a new manifest file; in our case we will want to determine two things first:
# 1. Is the user creating a new manifest file or using an old one? If creating a new one then there are existing methods to use for this that work off the soda_json_structure ( or should we update their old ones using the json structure a-la standalone to ensure nothing is missed in the validation if they are starting from Pennsieve? Hmm can be somewhat complicated on this step.)
# 2. If using an old manifest file where are they storing it? On Pennsieve or on their local machine. Both have different import methods. 
# IMP: How to tell what we are dealing with:
#  The generate-dataset key has 4 properties we can use to determine what we should do:
#     1. destination: bf or local 
#     2. generate-option: new or existing 
#     3. if-existing: merge, skip, create-duplicate, replace
#     4. if-existing-files: merge, skip, create-duplicate, replace
#  What their combinations mean:
#     destination: bf; generate-option: existing; Tells us we are updating an existing dataset through the Update Existing flow; use the standalone man generator algo
#     destination: bf; generate-option: new; bf-dataset-selected key is present;  Tells us we are merging a new local dataset into an existing ds; use the standalone man generator algo 
#     destination: bf; generate-option: new; if-existing: create-duplicate; if-existing-files: create-duplicate; and DS does not exist on Pennsieve; Tells us we are creating a new dataset from scratch; use curate manifest algo  
#     destination: local; generate-option: new; if-existing: new; Means a new local dataset is getting created; use curate manifest algo 
#     destination: local; generate-option: new; if-existing: merge; Means a local dataset is getting merged over an existing one; Might need to create a new algo for this case.
# TODO: add the manifest file creation function(s) here
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

    def build(self, ps):
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
        


    def _get_generate_dataset_keys(self):
        """
        Returns the keys in the generate-dataset dictionary in the soda_json_structure.
        """

        destination = self.soda_json_structure["generate-dataset"]["destination"]
        generate_option = self.soda_json_structure["generate-dataset"]["generate-option"]
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

        return destination == "bf" and generate_option == "existing"

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
