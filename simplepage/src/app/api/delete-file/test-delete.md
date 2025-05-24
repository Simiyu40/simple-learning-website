# Delete File API Test

## Endpoint
`DELETE /api/delete-file`

## Parameters
- `filePath` (required): The path of the file to delete
- `bucket` (required): Either "papers" or "solutions"
- `recordId` (optional): Database record ID for more precise deletion

## Example Usage

### Delete a paper file
```bash
curl -X DELETE "http://localhost:3000/api/delete-file?filePath=1234567890-example-paper.pdf&bucket=papers"
```

### Delete a solution file with record ID
```bash
curl -X DELETE "http://localhost:3000/api/delete-file?filePath=1234567890-solution.pdf&bucket=solutions&recordId=uuid-here"
```

## Expected Response

### Success
```json
{
  "success": true,
  "message": "File deleted successfully",
  "details": {
    "filePath": "1234567890-example-paper.pdf",
    "bucket": "papers",
    "storageDeleted": true,
    "databaseResult": {
      "success": true,
      "deletedRecords": [...]
    }
  }
}
```

### Error
```json
{
  "success": false,
  "error": "Failed to delete file from storage: File not found"
}
```

## Features
- Deletes file from Supabase storage
- Removes corresponding database records
- For papers: also deletes associated solutions
- Handles both storage and database cleanup
- Graceful error handling
- Non-fatal database errors (continues if storage deletion succeeds)
