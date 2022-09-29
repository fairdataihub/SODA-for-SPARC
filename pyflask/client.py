from pennsieve2.pennsieve import Pennsieve
from os import path

client = Pennsieve()
client.useDataset("N:dataset:1cb4bf59-2b6d-48c9-8dae-88f722c6e328")



local_ds = path.join(path.expanduser("~"), "Desktop", "tessst")
created_manifest = client.manifest.create(local_ds)

print(created_manifest)


