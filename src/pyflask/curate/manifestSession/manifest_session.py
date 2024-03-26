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
    
    