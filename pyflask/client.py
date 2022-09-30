from pennsieve2.pennsieve import Pennsieve
from os import path

client = Pennsieve()
client.user.switch('soda')
client.user.reauthenticate()
client.useDataset("N:dataset:1cb4bf59-2b6d-48c9-8dae-88f722c6e328")



local_ds = path.join(path.expanduser("~"), "Desktop", "9k-files-gened")
manifest = client.manifest.create(local_ds)

print(manifest)
print(type(manifest))

for s in manifest:
    print(s)



#sub = client.subscribe(2)
# client.manifest.upload(2)
