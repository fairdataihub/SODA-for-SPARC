from pennsieve2 import Pennsieve

ps = Pennsieve()

# fs = ps.list_manifests()
# print(fs)

class UploadManifestSession:

    # properties 
    df_mid = None
    mdf_mid = None
    mff_mid = None

    def __init__(self):
        self.df_mid = None
        self.mdf_mid = None
        self.mff_mid = None

    def set_df_mid(self, id):
        self.df_mid = id

    def set_mdf_mid(self, id):
        self.mdf_mid = id
    
    def set_mff_mid(self, id):
        self.mff_mid = id
    
    def get_df_mid(self):
        return self.df_mid
    
    def get_mdf_mid(self):
        return self.mdf_mid
    
    def get_mff_mid(self):
        return self.mff_mid
    
    def has_stored_mids(self):
        return self.df_mid is not None or self.mdf_mid is not None or self.mff_mid is not None
    

    def df_mid_has_progress(self):
        mfs = ps.list_manifests()
        for mf in mfs:
            if mf.id == self.df_mid:
                if mf.status == "Initiated":
                    return True      
        return False
            
    
# ums = UploadManifestSession()
# print(ums.df_mid_has_progress())
