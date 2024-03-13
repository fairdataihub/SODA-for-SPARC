# Run the test with the following command from src/pyflask: pytest -v

# namespaces are not configured in the manageDatasets module so configure them now before the test
from namespaces import configure_namespaces
configure_namespaces()

# import the function(s) to test
from manageDatasets import get_number_of_files_and_folders_locally 

class TestManageDatasets:
    # utilize the tmp_path fixture to create a temporary directory that is reset each test
    def test_get_number_of_files_and_folders_locally_empty_dir(tmp_path):
        # use pytests assert library
        assert get_number_of_files_and_folders_locally(str(tmp_path)) == {
            "totalFiles": 0, 
            "totalDir": 0
        }

    def test_get_datasets(self):
        x = "this"
        assert "h" in x

    def test_post_datasets(self):
        pass

    def test_delete_datasets(self):
        pass

    def test_get_dataset(self):
        pass

    def test_put_dataset(self):
        pass

    def test_delete_dataset(self):
        pass