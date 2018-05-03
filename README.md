# ServiceNow Test Data Snapshot Utility
The ServiceNow Test Data Snapshot Utility is used to take a snapshot of the data in a subset of tables in a ServiceNow instance and store this for later use for inserting this data back into the instance, primarily intended for use in demoing as a way to create demo baseline setups that can be quickly inserted into an environment.

## Prerequisites

The ServiceNow Test Data Snapshot Utility requires Node.js version >7.10. To install Node.js, go to https://nodejs.org/download/release/v7.10.1/ and find the correct distribution for your operating system. Once Node.js is installed, your system will be ready to run the snapshot utility.

## Usage
### Taking a Snapshot

Before taking a snapshot, it is important to configure the tool to retrieve data from the correct tables. To do this, open the file `config/tables.json` and add/remove table names as necessary. The table names must be the database name for the table (as opposed to the more user-friendly label that is presented). Table names can be found in the URL used to access a form, which will be formatted as `https://<instance-name>.service-now.com/nav_to.do?uri=%2F`**`<table_name>`**`.do%3F`. Each table's name should be written on its own line. _NOTE: Any table in a ServiceNow instance can be targeted by the utility, but because the insertion process will first delete all entries in the table, it should never be used on core tables, such as sys_user, sys_user_group, or any other configuration-storing table._

To take a snapshot, run `node take-snapshot`. You will be prompted for the following information:
* Snapshot Name: The name to assign to the snapshot. This can contain spaces, but they will be removed from the destination filename, so it is important to ensure you do not use a name that is already taken as the contents of the file are overwritten for every snapshot.
* Instance: The ServiceNow instance to retrieve the snapshot from. The instance name can be found in the URL you use to access ServiceNow, which will be formatted as `https://`**`<instance-name>`**`.service-now.com/`.
* Username: The username to use to access the instance.
* Password: The password for the user entered in the previous input.

Once these inputs are entered, the utility will proceed to retrieve a snapshot of all entries in the tables listed in `config/tables.json` and write them to the file `data/<Snapshot Name>.json`. When complete, you will be notified that the entries have been written to the file.

### Inserting a Snapshot

To insert a snapshot, run `node insert-snapshot`. You will be prompted for the same information listed above. _NOTE: It is possible to insert a snapshot from one instance into another, but as the tables or referenced entries present in the snapshot may not be available in another instance, this is inadvisable unless you first validate that all required tables and data are present in the new instance._

Once the inputs are entered, the utility will insert all entries from the referenced snapshot and notify how many insertions were attempted, as well as any errors that were generated inserting the entries. If any errors were generated, they will additionally be written to a timestamped error file for later reference.
