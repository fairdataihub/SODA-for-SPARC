from __future__ import print_function
from gevent import monkey; monkey.patch_all()
import gevent
from pysoda import submit_dataset_progress, curate_dataset_progress, save_file_organization, \
    import_file_organization, curate_dataset, preview_file_organization, delete_preview_file_organization, \
    bf_add_account, bf_account_list, bf_dataset_account, bf_account_details, \
    bf_submit_dataset, bf_new_dataset_folder, bf_add_permission, bf_get_users, bf_get_permission, \
    bf_get_teams, bf_add_permission_team, bf_add_subtitle, bf_get_subtitle, bf_get_description, \
    bf_add_description, bf_get_banner_image, bf_add_banner_image, bf_get_license, bf_add_license, \
    bf_get_dataset_status, bf_change_dataset_status, bf_default_account_load, save_submission_file, \
    save_ds_description_file

import sys
import zerorpc

class SodaApi(object):

    ### Save Submission file
    def api_save_submission_file(self, filepath, val_arr):
        return save_submission_file(filepath, val_arr)

    ### Save Description file
    def api_save_ds_description_file(self, filepath, val_arr1, val_arr2, val_arr3):
        return save_ds_description_file(filepath, val_arr1, val_arr2, val_arr3)

    ### Curate dataset
    def api_save_file_organization(self, jsonpath, jsondescription, jsonpathmetadata, pathsavefileorganization):
        try:
            return save_file_organization(jsonpath, jsondescription, jsonpathmetadata, pathsavefileorganization)
        except Exception as e:
            raise e

    def api_import_file_organization(self, pathsavefileorganization, foldernames):
        try:
            return import_file_organization(pathsavefileorganization, foldernames)
        except Exception as e:
            raise e

    def api_preview_file_organization(self, jsonpath):
        try:
            return preview_file_organization(jsonpath)
        except Exception as e:
            raise e

    def api_delete_preview_file_organization(self):
        try:
            return delete_preview_file_organization()
        except Exception as e:
            raise e

    def api_curate_dataset(self, sourcedataset, destinationdataset, pathdataset, newdatasetname,\
                manifeststatus, jsonpath, jsondescription):
        try:
            curate_dataset(sourcedataset, destinationdataset, pathdataset, newdatasetname,\
                manifeststatus, jsonpath, jsondescription)
        except Exception as e:
            raise e

    def api_curate_dataset_progress(self):
        try:
            return curate_dataset_progress()
        except Exception as e:
            raise e


    ### Bf
    def api_bf_add_account(self, keyname, key, secret):
        try:
            return bf_add_account(keyname, key, secret)
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

    def api_bf_new_dataset_folder(self, datasetname, accountname):
        try:
            return bf_new_dataset_folder(datasetname, accountname)
        except Exception as e:
            raise e

    def api_bf_submit_dataset(self, accountname, bfdataset, pathdataset):
        try:
            return bf_submit_dataset(accountname, bfdataset, pathdataset)
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

    def api_bf_add_permission(self, selected_bfaccount, selected_bfdataset, selected_user, selected_role):
        try:
            return bf_add_permission(selected_bfaccount, selected_bfdataset, selected_user, selected_role)
        except Exception as e:
            raise e

    def api_bf_add_permission_team(self, selected_bfaccount, selected_bfdataset, selected_team, selected_role):
        try:
            return bf_add_permission_team(selected_bfaccount, selected_bfdataset, selected_team, selected_role)
        except Exception as e:
            raise e

    def api_bf_get_subtitle(self, selected_bfaccount, selected_bfdataset):
        try:
            return bf_get_subtitle(selected_bfaccount, selected_bfdataset)
        except Exception as e:
            raise e

    def api_bf_add_subtitle(self, selected_bfaccount, selected_bfdataset, input_subtitle):
        try:
            return bf_add_subtitle(selected_bfaccount, selected_bfdataset, input_subtitle)
        except Exception as e:
            raise e

    def api_bf_get_description(self, selected_bfaccount, selected_bfdataset):
        try:
            return bf_get_description(selected_bfaccount, selected_bfdataset)
        except Exception as e:
            raise e

    def api_bf_add_description(self, selected_bfaccount, selected_bfdataset, markdown_input):
        try:
            return bf_add_description(selected_bfaccount, selected_bfdataset, markdown_input)
        except Exception as e:
            raise e

    def api_bf_get_banner_image(self, selected_bfaccount, selected_bfdataset):
        try:
            return bf_get_banner_image(selected_bfaccount, selected_bfdataset)
        except Exception as e:
            raise e

    def api_bf_add_banner_image(self, selected_bfaccount, selected_bfdataset, selected_banner_image):
        try:
            return bf_add_banner_image(selected_bfaccount, selected_bfdataset, selected_banner_image)
        except Exception as e:
            raise e

    def api_bf_get_license(self, selected_bfaccount, selected_bfdataset):
        try:
            return bf_get_license(selected_bfaccount, selected_bfdataset)
        except Exception as e:
            raise e

    def api_bf_add_license(self, selected_bfaccount, selected_bfdataset, selected_license):
        try:
            return bf_add_license(selected_bfaccount, selected_bfdataset, selected_license)
        except Exception as e:
            raise e

    def api_bf_get_dataset_status(self, selected_bfaccount, selected_bfdataset):
        try:
            return bf_get_dataset_status(selected_bfaccount, selected_bfdataset)
        except Exception as e:
            raise e
    def api_bf_change_dataset_status(self, selected_bfaccount, selected_bfdataset, selected_status):
        try:
            return bf_change_dataset_status(selected_bfaccount, selected_bfdataset, selected_status)
        except Exception as e:
            raise e

    ### Check Login to Python Server
    def echo(self, text):
        """echo any text"""
        return text


### Connect to Electron-Python
def parse_port():
    port = 4242
    try:
        port = int(sys.argv[1])
    except Exception as e:
        pass
    return '{}'.format(port)


def main():
    addr = 'tcp://127.0.0.1:' + parse_port()
    s = zerorpc.Server(SodaApi())
    s.bind(addr)
    print('start running on {}'.format(addr))
    s.run()


if __name__ == '__main__':
    main()
