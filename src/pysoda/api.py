from __future__ import print_function
from logging import root
from gevent import monkey

monkey.patch_all()
import gevent
from pysoda import (
    submit_dataset_progress,
    bf_add_account_api_key,
    bf_add_account_username,
    bf_account_list,
    bf_dataset_account,
    bf_account_details,
    bf_submit_dataset,
    bf_new_dataset_folder,
    bf_rename_dataset,
    bf_add_permission,
    bf_get_users,
    bf_get_permission,
    bf_get_teams,
    bf_add_permission_team,
    bf_add_subtitle,
    bf_get_subtitle,
    bf_get_description,
    bf_add_description,
    bf_get_banner_image,
    bf_add_banner_image,
    bf_get_license,
    bf_add_license,
    bf_get_dataset_status,
    bf_change_dataset_status,
    bf_default_account_load,
    get_username,
    get_number_of_files_and_folders_locally,
    check_agent_install,
    get_pennsieve_api_key_secret,
    SODA_SPARC_API_KEY,
    bf_submit_dataset_upload_details,
)

from disseminate import (
    bf_get_doi,
    bf_reserve_doi,
    bf_get_publishing_status,
    bf_publish_dataset,
    bf_submit_review_dataset,
    bf_withdraw_review_dataset,
)

from curate import (
    validate_dataset,
    create_folder_level_manifest,
    check_empty_files_folders,
    main_curate_function,
    main_curate_function_progress,
    generate_manifest_file_locally,
    check_JSON_size,
    main_curate_function_upload_details,
    create_high_level_manifest_files_existing_local_starting_point,
)

from prepare_metadata import (
    save_submission_file,
    save_ds_description_file,
    extract_milestone_info,
    import_milestone,
    save_subjects_file,
    convert_subjects_samples_file_to_df,
    save_samples_file,
    load_taxonomy_species,
    load_existing_DD_file,
    load_existing_submission_file,
    import_bf_metadata_file,
    import_bf_RC,
    upload_RC_file,
    delete_manifest_dummy_folders,
)

from organize_datasets import (
    generate_dataset_locally,
    bf_get_dataset_files_folders,
    create_json_object_backend,
    monitor_local_json_progress,
)

import sys
import zerorpc


MIN_SODA_VERSION = "5.3.3"


class SodaApi(object):

    ### import milestone document
    def api_extract_milestone_info(self, filepath):
        datalist = import_milestone(filepath)
        return extract_milestone_info(datalist)

    ### Save Submission file
    def api_save_submission_file(
        self, upload_boolean, bfaccount, bfdataset, filepath, val_arr
    ):
        return save_submission_file(
            upload_boolean, bfaccount, bfdataset, filepath, val_arr
        )

    ### Save Description file
    def api_save_ds_description_file(
        self,
        upload_boolean,
        bfaccount,
        bfdataset,
        filepath,
        val_arr1,
        val_arr_study,
        val_arr2,
        val_arr3,
    ):
        return save_ds_description_file(
            upload_boolean,
            bfaccount,
            bfdataset,
            filepath,
            val_arr1,
            val_arr_study,
            val_arr2,
            val_arr3,
        )

    ### Save subjects file
    def api_save_subjects_file(
        self, upload_boolean, bfaccount, bfdataset, filepath, datastructure
    ):
        return save_subjects_file(
            upload_boolean, bfaccount, bfdataset, filepath, datastructure
        )

    def api_convert_subjects_samples_file_to_df(self, type, filepath, fields):
        return convert_subjects_samples_file_to_df(type, filepath, fields)

    def api_load_existing_DD_file(self, import_type, filepath):
        return load_existing_DD_file(import_type, filepath)

    def api_load_existing_submission_file(self, filepath):
        return load_existing_submission_file(filepath)

    def api_import_bf_metadata_file(
        self, filetype, ui_field, selected_bfaccount, selected_bfdataset
    ):
        return import_bf_metadata_file(
            filetype, ui_field, selected_bfaccount, selected_bfdataset
        )

    def api_import_bf_RC(self, selected_bfaccount, selected_bfdataset, file_type):
        return import_bf_RC(selected_bfaccount, selected_bfdataset, file_type)

    ### Save samples file
    def api_save_samples_file(
        self, upload_boolean, bfaccount, bfdataset, filepath, datastructure
    ):
        return save_samples_file(
            upload_boolean, bfaccount, bfdataset, filepath, datastructure
        )

    def api_upload_RC_file(self, text_string, file_type, bfaccount, bfdataset):
        return upload_RC_file(text_string, file_type, bfaccount, bfdataset)

    ### Load Taxonomy species info
    def api_load_taxonomy_species(self, animalArr):
        return load_taxonomy_species(animalArr)

    ##check file size of everything in sodaJSONObj
    def api_check_JSON_size(self, jsonObj):
        try:
            return check_JSON_size(jsonObj)
        except Exception as e:
            raise e

    ### Generate dataset locally
    def api_generate_dataset_locally(
        self, destinationdataset, pathdataset, newdatasetname, jsonpath
    ):

        try:
            return generate_dataset_locally(
                destinationdataset, pathdataset, newdatasetname, jsonpath
            )
        except Exception as e:
            raise e

    ### Curate dataset
    # def api_save_file_organization(self, jsonpath, jsondescription, jsonpathmetadata, pathsavefileorganization):
    #     try:
    #         return save_file_organization(jsonpath, jsondescription, jsonpathmetadata, pathsavefileorganization)
    #     except Exception as e:
    #         raise e

    # def api_import_file_organization(self, pathsavefileorganization, foldernames):
    #     try:
    #         return import_file_organization(pathsavefileorganization, foldernames)
    #     except Exception as e:
    #         raise e

    # def api_preview_file_organization(self, jsonpath):
    #     try:
    #         return preview_file_organization(jsonpath)
    #     except Exception as e:
    #         raise e

    # def api_delete_preview_file_organization(self):
    #     try:
    #         return delete_preview_file_organization()
    #     except Exception as e:
    #         raise e

    # def api_curate_dataset(self, sourcedataset, destinationdataset, pathdataset, newdatasetname,\
    #             manifeststatus, jsonpath, jsondescription):
    #     try:
    #         curate_dataset(sourcedataset, destinationdataset, pathdataset, newdatasetname,\
    #             manifeststatus, jsonpath, jsondescription)
    #     except Exception as e:
    #         raise e

    # def api_curate_dataset_progress(self):
    #     try:
    #         return curate_dataset_progress()
    #     except Exception as e:
    #         raise e

    ### Validate dataset
    def api_create_folder_level_manifest(self, jsonpath, jsondescription):
        try:
            return create_folder_level_manifest(jsonpath, jsondescription)
        except Exception as e:
            raise e

    def api_validate_dataset(self, validator_input):
        try:
            return validate_dataset(validator_input)
        except Exception as e:
            raise e

    def api_create_high_level_manifest_files_existing_local_starting_point(
        self, dataset_path
    ):
        try:
            return create_high_level_manifest_files_existing_local_starting_point(
                dataset_path
            )
        except Exception as e:
            raise e

    def api_delete_manifest_dummy_folders(self, userpath):
        try:
            return delete_manifest_dummy_folders(userpath)
        except Exception as e:
            raise e

    ### Bf
    def api_bf_add_account_api_key(self, keyname, key, secret):
        try:
            return bf_add_account_api_key(keyname, key, secret)
        except Exception as e:
            raise e

    def api_bf_add_account_username(self, keyname, key, secret):
        try:
            return bf_add_account_username(keyname, key, secret)
        except Exception as e:
            raise e

    def api_bf_account_list(self):
        try:
            return bf_account_list()
        except Exception as e:
            raise e

    def api_bf_default_account_load(self):
        try:
            return bf_default_account_load()
        except Exception as e:
            raise e

    def api_bf_dataset_account(self, accountname):
        try:
            return bf_dataset_account(accountname)
        except Exception as e:
            raise e

    def api_bf_account_details(self, accountname):
        try:
            return bf_account_details(accountname)
        except Exception as e:
            raise e

    def api_get_username(self, accountname):
        return get_username(accountname)

    def api_bf_new_dataset_folder(self, datasetname, accountname):
        try:
            return bf_new_dataset_folder(datasetname, accountname)
        except Exception as e:
            raise e

    def api_bf_rename_dataset(
        self, accountname, current_dataset_name, renamed_dataset_name
    ):
        try:
            return bf_rename_dataset(
                accountname, current_dataset_name, renamed_dataset_name
            )
        except Exception as e:
            raise e

    def api_bf_submit_dataset(self, accountname, bfdataset, pathdataset):
        try:
            return bf_submit_dataset(accountname, bfdataset, pathdataset)
        except Exception as e:
            raise e

    # get upload information for logging while bf_submit_dataset runs
    def api_bf_submit_dataset_upload_details(self):
        try:
            return bf_submit_dataset_upload_details()
        except Exception as e:
            raise e

    def api_submit_dataset_progress(self):
        try:
            return submit_dataset_progress()
        except Exception as e:
            raise e

    def api_bf_get_users(self, selected_bfaccount):
        try:
            return bf_get_users(selected_bfaccount)
        except Exception as e:
            raise e

    def api_bf_get_teams(self, selected_bfaccount):
        try:
            return bf_get_teams(selected_bfaccount)
        except Exception as e:
            raise e

    def api_bf_get_permission(self, selected_bfaccount, selected_bfdataset):
        try:
            return bf_get_permission(selected_bfaccount, selected_bfdataset)
        except Exception as e:
            raise e

    def api_bf_add_permission(
        self, selected_bfaccount, selected_bfdataset, selected_user, selected_role
    ):
        try:
            return bf_add_permission(
                selected_bfaccount, selected_bfdataset, selected_user, selected_role
            )
        except Exception as e:
            raise e

    def api_bf_add_permission_team(
        self, selected_bfaccount, selected_bfdataset, selected_team, selected_role
    ):
        try:
            return bf_add_permission_team(
                selected_bfaccount, selected_bfdataset, selected_team, selected_role
            )
        except Exception as e:
            raise e

    def api_bf_get_subtitle(self, selected_bfaccount, selected_bfdataset):
        try:
            return bf_get_subtitle(selected_bfaccount, selected_bfdataset)
        except Exception as e:
            raise e

    def api_bf_add_subtitle(
        self, selected_bfaccount, selected_bfdataset, input_subtitle
    ):
        try:
            return bf_add_subtitle(
                selected_bfaccount, selected_bfdataset, input_subtitle
            )
        except Exception as e:
            raise e

    def api_bf_get_description(self, selected_bfaccount, selected_bfdataset):
        try:
            return bf_get_description(selected_bfaccount, selected_bfdataset)
        except Exception as e:
            raise e

    def api_bf_add_description(
        self, selected_bfaccount, selected_bfdataset, markdown_input
    ):
        try:
            return bf_add_description(
                selected_bfaccount, selected_bfdataset, markdown_input
            )
        except Exception as e:
            raise e

    def api_bf_get_banner_image(self, selected_bfaccount, selected_bfdataset):
        try:
            return bf_get_banner_image(selected_bfaccount, selected_bfdataset)
        except Exception as e:
            raise e

    def api_bf_add_banner_image(
        self, selected_bfaccount, selected_bfdataset, selected_banner_image
    ):
        try:
            return bf_add_banner_image(
                selected_bfaccount, selected_bfdataset, selected_banner_image
            )
        except Exception as e:
            raise e

    def api_bf_get_license(self, selected_bfaccount, selected_bfdataset):
        try:
            return bf_get_license(selected_bfaccount, selected_bfdataset)
        except Exception as e:
            raise e

    def api_bf_add_license(
        self, selected_bfaccount, selected_bfdataset, selected_license
    ):
        try:
            return bf_add_license(
                selected_bfaccount, selected_bfdataset, selected_license
            )
        except Exception as e:
            raise e

    def api_bf_get_dataset_status(self, selected_bfaccount, selected_bfdataset):
        try:
            return bf_get_dataset_status(selected_bfaccount, selected_bfdataset)
        except Exception as e:
            raise e

    def api_bf_change_dataset_status(
        self, selected_bfaccount, selected_bfdataset, selected_status
    ):
        try:
            return bf_change_dataset_status(
                selected_bfaccount, selected_bfdataset, selected_status
            )
        except Exception as e:
            raise e

    def api_bf_get_doi(self, selected_bfaccount, selected_bfdataset):
        try:
            return bf_get_doi(selected_bfaccount, selected_bfdataset)
        except Exception as e:
            raise e

    def api_bf_reserve_doi(self, selected_bfaccount, selected_bfdataset):
        try:
            return bf_reserve_doi(selected_bfaccount, selected_bfdataset)
        except Exception as e:
            raise e

    def api_bf_get_publishing_status(self, selected_bfaccount, selected_bfdataset):
        try:
            return bf_get_publishing_status(selected_bfaccount, selected_bfdataset)
        except Exception as e:
            raise e

    def api_bf_submit_review_dataset(self, selected_bfaccount, selected_bfdataset):
        try:
            return bf_submit_review_dataset(selected_bfaccount, selected_bfdataset)
        except Exception as e:
            raise e

    def api_bf_withdraw_review_dataset(self, selected_bfaccount, selected_bfdataset):
        try:
            return bf_withdraw_review_dataset(selected_bfaccount, selected_bfdataset)
        except Exception as e:
            raise e

    def api_bf_publish_dataset(self, selected_bfaccount, selected_bfdataset):
        try:
            return bf_publish_dataset(selected_bfaccount, selected_bfdataset)
        except Exception as e:
            raise e

    # NEW FUNCTION

    def api_check_empty_files_folders(self, soda_json_structure):
        try:
            return check_empty_files_folders(soda_json_structure)
        except Exception as e:
            raise e

    def api_main_curate_function(self, soda_json_structure):

        try:
            return main_curate_function(soda_json_structure)
        except Exception as e:
            raise e

    def api_main_curate_function_progress(self):
        try:
            return main_curate_function_progress()
        except Exception as e:
            raise e

    def api_main_curate_function_upload_details(self):
        try:
            return main_curate_function_upload_details()
        except Exception as e:
            raise e

    # def api_preview_dataset(self, soda_json_structure):
    #     try:
    #         return preview_dataset(soda_json_structure)
    #     except Exception as e:
    #         raise e

    def api_bf_get_dataset_files_folders(
        self, soda_json_structure, requested_sparc_only=True
    ):
        try:
            return bf_get_dataset_files_folders(
                soda_json_structure, requested_sparc_only
            )
        except Exception as e:
            raise e

    def api_generate_manifest_file_locally(self, generate_purpose, soda_json_structure):
        try:
            return generate_manifest_file_locally(generate_purpose, soda_json_structure)
        except Exception as e:
            raise e

    def api_get_number_of_files_and_folders_locally(self, filepath):
        try:
            return get_number_of_files_and_folders_locally(filepath)
        except Exception as e:
            raise e

    def api_check_agent_install(self):
        try:
            return check_agent_install()
        except Exception as e:
            raise e

    def api_get_pennsieve_api_key_secret(
        self, email, password, keyname=SODA_SPARC_API_KEY
    ):
        try:
            return get_pennsieve_api_key_secret(email, password, keyname)
        except Exception as e:
            raise e

    # def api_get_auth_key(self):
    #     try:
    #         return get_auth_key()
    #     except Exception as e:
    #         raise e

    ### Check Login to Python Server
    def api_version_check(self):
        return MIN_SODA_VERSION

    ### Check Login to Python Server
    def echo(self, text):
        """echo any text"""
        return text

    ### Creates json structure for local datasets
    def api_create_json_object_backend(
        self, soda_json_structure, root_folder_path, irregularFolders, replaced
    ):
        try:
            return create_json_object_backend(
                soda_json_structure, root_folder_path, irregularFolders, replaced
            )
        except Exception as e:
            raise e

    def api_monitor_local_json_progress(self):
        try:
            return monitor_local_json_progress()
        except Exception as e:
            raise e


### Connect to Electron-Python
def parse_port():
    port = 4242
    try:
        port = int(sys.argv[1])
    except:
        pass
    return "{}".format(port)


def main():
    addr = "tcp://127.0.0.1:" + parse_port()
    s = zerorpc.Server(SodaApi())
    s.bind(addr)
    print("start running on {}".format(addr))
    s.run()


if __name__ == "__main__":
    main()
