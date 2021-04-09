## Background 

When you create a dataset, it is private and accessible only to you (you have 'owner' permissions on the dataset). You can change who can access and modify your dataset by giving permissions to others. The level of access depend on the type of permissions given. Briefly, there are 4 roles available for a dataset: owner, manager, editor, and viewer. Each of them provides different permissions for making changes to a dataset. These permissions are summarized in the table below. You can find out more about permissions on the associated [Blackfynn help page](https://help.blackfynn.com/en/articles/2614125-dataset-permissions).


<p align="center">
<table class="tableizer-table">
<thead><tr class="tableizer-firstrow"><th>Permissions</th><th>Owner</th><th>Manager</th><th>Editor</th><th>Viewer</th></tr></thead>
<tbody>
 <tr><td>View/download files</td><td> &#9989;</td><td> &#9989;</td><td> &#9989;</td><td> &#9989;</td></tr>
 <tr><td>Edit name of a dataset</td><td> &#9989;</td><td> &#9989;</td><td> &#9989;</td><td>&#10060;</td></tr>
 <tr><td>Upload/delete files</td><td> &#9989;</td><td> &#9989;</td><td> &#9989;</td><td>&#10060;</td></tr>
 <tr><td>Add metadata</td><td> &#9989;</td><td> &#9989;</td><td>&#10060;</td><td>&#10060;</td></tr>
 <tr><td>Manage permissions</td><td> &#9989;</td><td> &#9989;</td><td>&#10060;</td><td>&#10060;</td></tr>
 <tr><td>Change dataset status</td><td> &#9989;</td><td> &#9989;</td><td>&#10060;</td><td>&#10060;</td></tr>
 <tr><td>Share dataset with SPARC consortium (embargo)</td><td> &#9989;</td><td> &#9989;</td><td>&#10060;</td><td>&#10060;</td></tr>
 <tr><td>Reserve DOI</td><td> &#9989;</td><td> &#9989;</td><td>&#10060;</td><td>&#10060;</td></tr>
 <tr><td>Submit for pre-publishing review </td><td> &#9989; (+ORCID linked) </td><td>&#10060;</td><td>&#10060;</td><td>&#10060;</td></tr>
 <tr><td>Delete dataset</td><td> &#9989;</td><td>&#10060;</td><td>&#10060;</td><td>&#10060;</td></tr>
 <tr><td>Change owner</td><td> &#9989;</td><td>&#10060;</td><td>&#10060;</td><td>&#10060;</td></tr>
</tbody>
</table>
</p>

## How to 

Start by selecting a dataset from the drop-down list. The following actions can then be performed:

### Make PI owner of dataset 

Select PI name in the drop-down menu and click on ’Make PI owner’ to make them the owner of dataset (you will automatically be assigned 'manager' permissions).

<p align="center">
<img src="https://github.com/bvhpatel/SODA/raw/master/docs/documentation/Manage-datasets/Manage-permissions/manage-permission-1.gif" width="650">
</p>

### Add/edit permissions for members or teams

Give/change permission of any user (including yourself) by selecting the user from the drop-down menu and then selecting one of the roles. Click on ’Add permission for user’ to add the permission. Similarly, permission can be given/changed for a whole team.

<p align="center">
<img src="https://github.com/bvhpatel/SODA/raw/master/docs/documentation/Manage-datasets/Manage-permissions/manage-permission-2.gif" width="650">
</p>

### Share with Curation Team

This must be done only when your dataset is ready to be reviewed. Click on ’Share with Curation Team’ to add your dataset to their review queur. Sharing with the SPARC Curation Team will give them "manager" permissions, which is necessary for them to review your dataset, and set the dataset status to "03. Ready for Curation" (see our [documentation on dataset status](https://github.com/bvhpatel/SODA/wiki/View-and-change-dataset-status) thus adding the dataset to the Curation Team's queue for review. It is then highly recommended to not make any changes to your dataset.

## Note
* You must have "owner" or "manager" permissions on the dataset to manage permissions

* Giving permissions to other members and/or team is only necessary if you need them to contribute to the dataset.