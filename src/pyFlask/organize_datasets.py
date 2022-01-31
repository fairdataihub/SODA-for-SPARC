def ps_retrieve_dataset(soda_json_structure):
    """
    Function for importing Pennsieve data files info into the "dataset-structure" key of the soda json structure,
    including metadata from any existing manifest files in the high-level folders
    (name, id, timestamp, description, additional metadata)
    Args:
        soda_json_structure: soda structure with bf account and dataset info available
    Output:
        same soda structure with Pennsieve data file info included under the "dataset-structure" key
    """

    double_extensions = ['.ome.tiff','.ome.tif','.ome.tf2,','.ome.tf8','.ome.btf','.ome.xml','.brukertiff.gz','.mefd.gz','.moberg.gz','.nii.gz','.mgh.gz','.tar.gz','.bcl.gz']
    
    download_extensions = [".xlsx", ".csv", ".xlsm", ".xlsb", ".xltx", ".xltm", ".xls", ".xlt", ".xls", ".xml", ".xlam", ".xla", ".xlw", ".xlr", ".json", ".txt"]
    #f = open("dataset_contents.soda", "a")

    def verify_file_name(file_name, extension):
        if extension == "":
            return (file_name, extension)
        
        double_ext = False
        for ext in double_extensions:
            if file_name.find(ext) != -1:
                double_ext = True
                break
            
        extension_from_name = ""

        if double_ext == False:
            extension_from_name = os.path.splitext(file_name)[1]
        else:
            extension_from_name = os.path.splitext(os.path.splitext(file_name)[0])[1] + os.path.splitext(file_name)[1]
        
        if extension_from_name == ('.' + extension):
            return (file_name, extension_from_name)
        else:
            return (file_name + ('.' + extension), ('.' + extension))

    # Add a new key containing the path to all the files and folders on the
    # local data structure..
    def recursive_item_path_create(folder, path):
        if "files" in folder.keys():
            for item in list(folder["files"]):
                if "bfpath" not in folder["files"][item]:
                    folder["files"][item]['bfpath'] = path[:]

        if "folders" in folder.keys():
            for item in list(folder["folders"]):
                if "bfpath" not in folder["folders"][item]:
                    folder["folders"][item]['bfpath'] = path[:]
                    folder["folders"][item]['bfpath'].append(item)
                recursive_item_path_create(folder["folders"][item], folder["folders"][item]['bfpath'][:])
        return

    level = 0

    def recursive_dataset_import(my_item, metadata_files, dataset_folder, my_level):
        level = 0
        col_count = 0
        file_count = 0

        for item in my_item:
            if item.type == "Collection":
                if "folders" not in dataset_folder:
                    dataset_folder["folders"] = {}
                if "files" not in dataset_folder:
                    dataset_folder["files"] = {}
                    
                col_count += 1
                folder_name = item.name
                
                if col_count == 1:
                    level = my_level + 1
                dataset_folder["folders"][folder_name] = {
                    "type": "bf", "action": ["existing"], "path": item.id}
                sub_folder = dataset_folder["folders"][folder_name]
                
                if "folders" not in sub_folder:
                    sub_folder["folders"] = {}
                if "files" not in sub_folder:
                    sub_folder["files"] = {}
                    
                recursive_dataset_import(item,metadata_files, sub_folder, level)
            else:
                if "folders" not in dataset_folder:
                    dataset_folder["folders"] = {}
                if "files" not in dataset_folder:
                    dataset_folder["files"] = {}
                    
                package_id = item.id
                gevent.sleep(0)
                package_details = bf._api._get(
                    '/packages/' + str(package_id))
                
                if ("extension" not in package_details):
                    (file_name, ext) = verify_file_name(package_details["content"]["name"], "")
                else:
                    (file_name, ext) = verify_file_name(package_details["content"]["name"], package_details["extension"])

                if my_level == 0:
                    if ext in download_extensions:
                        gevent.sleep(0)
                        file_details = bf._api._get('/packages/' + str(package_id) + '/view')
                        print(file_details)
                        file_id = file_details[0]["content"]["id"]
                        gevent.sleep(0)
                        file_url = bf._api._get(
                            '/packages/' + str(package_id) + '/files/' + str(file_id))
                        timestamp = (package_details["content"]["updatedAt"])
                        metadata_files[file_name] = {
                            "type": "bf", 
                            "action": ["existing"], 
                            "path": item.id, 
                            "timestamp": timestamp, 
                            "extension": ext, 
                            "url": file_url["url"],  
                            "size": file_details[0]["content"]["size"]
                        }
                    else:
                        timestamp = (package_details["content"]["updatedAt"])
                        metadata_files[file_name] = {
                            "type": "bf", "action": ["existing"], "path": item.id, "timestamp": timestamp, "extension": ext, "url": "", "size": 1}
                else:
                    file_count += 1
                    if ext in download_extensions:
                        gevent.sleep(0)
                        file_details = bf._api._get('/packages/' + str(package_id) + '/view')
                        file_id = file_details[0]["content"]["id"]
                        gevent.sleep(0)
                        file_url = bf._api._get(
                            '/packages/' + str(package_id) + '/files/' + str(file_id))
                        timestamp = (package_details["content"]["updatedAt"])
                        dataset_folder["files"][file_name] = {
                            "type": "bf","action": ["existing"], 
                            "path": item.id, 
                            "timestamp": timestamp, 
                            "extension": ext, 
                            "url": file_url["url"], 
                            "size": file_details[0]["content"]["size"]
                        }
                    else:
                        timestamp = (package_details["content"]["updatedAt"])
                        dataset_folder["files"][file_name] = {
                            "type": "bf","action": ["existing"], "path": item.id, "timestamp": timestamp, "extension": ext, "url": "", "size": 1}

    error = []

    # check that the Pennsieve account is valid
    try:
        bf_account_name = soda_json_structure["bf-account-selected"]["account-name"]
    except Exception as e:
        raise e

    try:
        bf = Pennsieve(bf_account_name)
    except Exception as e:
        error.append('Error: Please select a valid Pennsieve account')
        raise Exception(error)

    # check that the Pennsieve dataset is valid
    try:
        bf_dataset_name = soda_json_structure["bf-dataset-selected"]["dataset-name"]
    except Exception as e:
        raise e
    try:
        myds = bf.get_dataset(bf_dataset_name)
    except Exception as e:
        error.append('Error: Please select a valid Pennsieve dataset')
        raise Exception(error)

    # check that the user has permission to edit this dataset
    try:
        role = bf_get_current_user_permission(bf, myds)
        if role not in ['owner', 'manager']:
            curatestatus = 'Done'
            error.append("Error: You don't have permissions for uploading to this Pennsieve dataset")
            raise Exception(error)
    except Exception as e:
        raise e

    try:
        # import files and folders in the soda json structure
        soda_json_structure["dataset-structure"] = {}
        soda_json_structure["metadata-files"] = {}
        dataset_folder = soda_json_structure["dataset-structure"]
        metadata_files = soda_json_structure["metadata-files"]
        recursive_dataset_import(myds, metadata_files, dataset_folder, level)

        #remove metadata files keys if empty
        metadata_files = soda_json_structure["metadata-files"]
        if not metadata_files:
            del soda_json_structure['metadata-files']

        dataset_folder = soda_json_structure["dataset-structure"]

        recursive_item_path_create(soda_json_structure["dataset-structure"], [])
        success_message = "Data files under a valid high-level SPARC folders have been imported"

        create_local_dataset(soda_json_structure)
        return "created"

    except Exception as e:
        raise e