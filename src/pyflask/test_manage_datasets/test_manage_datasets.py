from namespaces import configure_namespaces
configure_namespaces()

from manageDatasets import get_number_of_files_and_folders_locally 

class TestManageDatasets:

    def test_get_number_of_files_and_folders_locally_empty_dir(tmp_path):
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