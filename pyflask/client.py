from pennsieve2.pennsieve import Pennsieve
from os import path

client = Pennsieve()
client.user.switch('soda')
client.user.reauthenticate()
client.useDataset("N:dataset:1cb4bf59-2b6d-48c9-8dae-88f722c6e328")



local_ds = path.join(path.expanduser("~"), "Desktop", "DatasetTemplate")
manifest = client.manifest.create(local_ds)



client.manifest.upload(32)
sub = client.subscribe(10)

counter = 0 
end_counter = 1000
msgs = []
for msg in sub:
    # print(dir(msg))
    # print("Upload status: ", msg.upload_status)
    # print("Event info", msg.event_info)
    # print("Event type", msg.type)
    # print('Descriptor: ', dir(msg.DESCRIPTOR))
    # print("Event Response: ", dir(msg.EventResponse))
    # print("Event response details: ", dir(msg.EventResponse.details))

    current_bytes_uploaded = msg.upload_status.current 
    total_bytes_to_upload = msg.upload_status.total

    print(f"Current bytes uploaded: {current_bytes_uploaded}")
    print(f"Total bytes to upload: {total_bytes_to_upload}")
    if msg.upload_status.total == msg.upload_status.current:
        counter += 1
        print(counter)
    

    # if counter == 10:
    #     client.unsubscribe(10)

print("Done")



