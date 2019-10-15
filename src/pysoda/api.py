from __future__ import print_function
from pysoda import copyfile, bfaddaccount, bfaccountlist, bfdatasetaccount, \
    bfsubmitdataset, submitdatasetprogress, curatedatasetprogress, bfnewdatasetfolder, \
    savefileorganization, uploadfileorganization, curatedataset, previewfileorganization, deletePreviewFileOrganization, \
    bf_add_permission, bf_get_users, bf_get_permission
import sys
import zerorpc
from os.path import isdir, isfile


class SodaApi(object):

    ### Curate dataset
    def apiSaveFileOrganization(self, jsonpath, jsondescription, pathsavefileorganization):
        try:
            return savefileorganization(jsonpath, jsondescription, pathsavefileorganization)
        except Exception as e:
            raise e

    def apiUploadFileOrganization(self, pathsavefileorganization, foldernames):
        try:
            return uploadfileorganization(pathsavefileorganization, foldernames)
        except Exception as e:
            raise e

    def apiPreviewFileOrganization(self, jsonpath):
        try:
            return previewfileorganization(jsonpath)
        except Exception as e:
            raise e

    def apiDeletePreviewFileOrganization(self):
        try:
            return deletePreviewFileOrganization()
        except Exception as e:
            raise e

    def apiCurateDataset(self, pathdataset, createnewstatus, pathnewdataset,
        manifeststatus, submissionstatus, pathsubmission, datasetdescriptionstatus, pathdescription,
        subjectsstatus, pathsubjects, samplesstatus, pathsamples, jsonpath, jsondescription, modifyexistingstatus,
        bfdirectlystatus, alreadyorganizedstatus, organizedatasetstatus, newdatasetname):
        try:
            curatedataset(pathdataset, createnewstatus, pathnewdataset,
                manifeststatus, submissionstatus, pathsubmission, datasetdescriptionstatus, pathdescription,
                subjectsstatus, pathsubjects, samplesstatus, pathsamples, jsonpath, jsondescription, modifyexistingstatus,
                bfdirectlystatus, alreadyorganizedstatus, organizedatasetstatus, newdatasetname)
        except Exception as e:
            raise e

    def apiCurateDatasetProgress(self):
        try:
            return curatedatasetprogress()
        except Exception as e:
            raise e


    ### Bf
    def apiBfAddAccount(self, keyname, key, secret):
        try:
            return bfaddaccount(keyname, key, secret)
        except Exception as e:
            raise e

    def apiBfAccountList(self):
        try:
            return bfaccountlist()
        except Exception as e:
            raise e

    def apiBfDatasetAccount(self, accountname):
        try:
            return bfdatasetaccount(accountname)
        except Exception as e:
            raise e

    def apiBfNewDatasetFolder(self, datasetname, accountname):
        try:
            return bfnewdatasetfolder(datasetname, accountname)
        except Exception as e:
            raise e

    def apiBfSubmitDataset(self, accountname, bfdataset, pathdataset):
        try:
            return bfsubmitdataset(accountname, bfdataset, pathdataset)
        except Exception as e:
            raise e

    def apiSubmitDatasetProgress(self):
        try:
            return submitdatasetprogress()
        except Exception as e:
            raise e

    def api_bf_get_users(self, selected_bfaccount):
        try:
            return bf_get_users(selected_bfaccount)
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
