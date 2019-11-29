from __future__ import print_function
from pysoda import submit_dataset_progress, curate_dataset_progress, save_file_organization, \
    import_file_organization, curate_dataset, preview_file_organization, delete_preview_file_organization, \
    bf_add_account, bf_account_list, bf_dataset_account, bf_account_details, \
    bf_submit_dataset, bf_new_dataset_folder, bf_add_permission, bf_get_users, bf_get_permission, \
    bf_get_teams, bf_add_permission_team, bf_get_license, bf_add_license, bf_get_subtitle, bf_add_subtitle
        
import sys
import zerorpc

class SodaApi(object):

    ### Curate dataset
    def api_save_file_organization(self, jsonpath, jsondescription, pathsavefileorganization):
        try:
            return save_file_organization(jsonpath, jsondescription, pathsavefileorganization)
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
                submissionstatus, pathsubmission, datasetdescriptionstatus, pathdescription, \
                subjectsstatus, pathsubjects, samplesstatus, pathsamples, manifeststatus, \
                jsonpath, jsondescription):
        try:
            curate_dataset(sourcedataset, destinationdataset, pathdataset, newdatasetname,\
                submissionstatus, pathsubmission, datasetdescriptionstatus, pathdescription, \
                subjectsstatus, pathsubjects, samplesstatus, pathsamples, manifeststatus, \
                jsonpath, jsondescription)
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
