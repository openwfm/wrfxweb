# External Server
This document details how to use the external server to make an API request using `curl` to the server. After an request is made, the server will enqueue an action for a separate worker to process in the order that actions are received. 

The current supported actions are `archive`, `zip`, `delete`, `kml`, and `upload`

## Header
Each `curl` request requires an API key in the header for authentication

`--header "API-Key: {external_server_api_key}"`

## Ready
This endpoint responds with 200 if the server is up and available for requests.
### POST URL
`https://wrfx.online/external/server-ready` 

### Sample POST request
```
curl \
  -X GET \
  --header "API-Key: 000000000000" \
  https://wrfx.online/external/server-ready
```

## Archive
This endpoint deletes timestamps from a simulation that are older than the provided number of days. 
### POST URL
`https://wrfx.online/external/entries/<entry_id>/archive`

or 

`https://wrfx.online/external/jobs/<job_id>/archive`

### required fields
`--form "number_of_days={age_of_oldest_data_to_keep}"` : age of the oldest data you would like to keep. For example, if provided "14", than any data older than 2 weeks would be deleted.

### Sample POST request
The following POST would archive the simulation corresponding to Entry 1, preserving the last 14 days of data
```
curl \
  -X POST \
  --form "number_of_days=14" \
  --header "API-Key: 000000000000" \
  https://wrfx.online/external/entries/1/archive
```

## Delete
This endpoint will stage a simulation for deletion.
### POST URL
`https://wrfx.online/external/entries/<entry_id>/delete`

or

`https://wrfx.online/external/jobs/<job_id>/delete`

### Sample POST request
```
curl \
  -X POST \
  --header "API-Key: 000000000000" \
  https://wrfx.online/external/entries/1/delete

```

## KML
This endpoint writes kml files for the provided simulation
### POST URL
`https://wrfx.online/external/entries/{entry_id}/kml`

or 

`https://wrfx.online/external/jobs/{job_id}/kml`

### optional fields
`--form "steps={steps}"` : '1,1,1,3' takes every 3rd frame in domain 4, etc. Default: all 1

`--form "mode={mode}"` : inc to include image files (default), ref to use links only

`--form "only_vars={only_vars}"` : variables to include; if absent all will be included


### Sample POST request
basic POST using default params
```
curl \
  -X POST \
  --header "API-Key: 000000000000" \
  https://wrfx.online/external/entries/1/kml
```
more complicated POST
```
curl \
  -X POST \
  --form "steps=1,1,1,3" \
  --form "mode=ref" \
  --form "only_vars=T2" \
  --header "API-Key: 000000000000" \
  https://wrfx.online/external/entries/1/kml
```

## Upload
This endpoint uploads a simulation to the server. Can provide catalog_ids that are desired for the simulation to be added to.
### POST URL
`https://wrfx.online/external/entries/upload`
### required fields
`--form zipFile="{path_to_zipFile}"` : full path to zip file to upload

`--form "column={columnName}"` : options are 'fire', 'fm', and 'lidar'

### optional fields
`--form "catalog_ids={catalog_ids_separated_by_space}"`

### Sample POST request
```
curl \
  -X POST \
  --form zipFile="/sample/full_path/to/zip" \
  --form "column=fire" \
  --form "catalog_ids=1 2 3"
  --header "API-Key: 000000000000" \
  https://wrfx.online/external/entries/upload
```

## Zip
This endpoint zips the specified simulation for downloading.
### POST URL
`https://wrfx.online/external/entries/{entry_id}/zip`

or

`https://wrfx.online/external/jobs/{job_id}/zip`

### Sample POST request
```
curl \
  -X POST \
  --header "API-Key: 000000000000" \
  https://wrfx.online/external/entries/1/zip
```

