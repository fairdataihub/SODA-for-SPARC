from pennsieve2.pennsieve import Pennsieve
from os import path
import requests

client = Pennsieve()
client.user.switch('soda')
client.user.reauthenticate()
client.useDataset("N:dataset:1cb4bf59-2b6d-48c9-8dae-88f722c6e328")



#local_ds = path.join(path.expanduser("~"), "Desktop", "DatasetTemplate")
#manifest = client.manifest.create(local_ds)

PENNSIEVE_URL = "https://api.pennsieve.io"

r = requests.post(f"{PENNSIEVE_URL}/packages", headers={"Content-Type": "application/json", "Authorization": f"Bearer {client.getUser()['session_token']}",}, json={"parent": "N:collection:f981f4df-b0cd-4a91-bcf0-8789b128b379", "name": "funsies", "dataset": "974-filesss", "packageType": "collection", "properties": {"key": "funsies", "value": "Ahhh"} })
r.raise_for_status()



# client.manifest.upload(49)
# sub = client.subscribe(10)

# counter = 0
# end_counter = 1000
# msgs = []
# for msg in sub:
#     print(msg)
#     # print(dir(msg))
#     # print("Upload status: ", msg.upload_status)
#     # print("Event info", msg.event_info)
#     # print("Event type", msg.type)
#     # print('Descriptor: ', dir(msg.DESCRIPTOR))
#     # print("Event Response: ", dir(msg.EventResponse))
#     # print("Event response details: ", dir(msg.EventResponse.details))

#     current_bytes_uploaded = msg.upload_status.current 
#     total_bytes_to_upload = msg.upload_status.total

#     if total_bytes_to_upload != 0:
#         if msg.upload_status.total == msg.upload_status.current:
#             counter += 1
#             print(counter)
        

#         if counter == 4:
#             print("Unsubscribing")
#             client.unsubscribe(10)

# print("Done")



