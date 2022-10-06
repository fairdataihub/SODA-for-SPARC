from pennsieve2.pennsieve import Pennsieve
from os import path

client = Pennsieve()
client.user.switch('soda')
client.user.reauthenticate()
client.useDataset("N:dataset:1cb4bf59-2b6d-48c9-8dae-88f722c6e328")



# local_ds = path.join(path.expanduser("~"), "Desktop", "9k-files-gened")
# manifest = client.manifest.create(local_ds)



client.manifest.upload(5)
sub = client.subscribe(10)

counter = 0 
end_counter = 1000
msgs = []
print(dir(sub))
for msg in sub:
    if msg.upload_status.total == msg.upload_status.current:
        print("Finished")
        counter += 1
        print(counter)
    

print("Done")



client.unsubscribe(10)
print("Client unsubscribed")



