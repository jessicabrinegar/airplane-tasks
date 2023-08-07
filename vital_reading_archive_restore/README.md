# Vital Reading Archive/Restore

## Purpose:

- [Airplane Task Report](https://app.airplane.dev/tasks/tsk20230420ztobcsp4ppy?__env=prod) that is responsible for either archiving or restoring, based on the user's input, all of the PostgreSQL Vital Readings that the user specified.

### Task Input

- List of comma-separated vital reading IDs in UUID format
- Choice of what to do with the vital readings -- either Archive or Restore
- Database choice (Prod or Dev)

### Task Output

- Contains a table with the vital reading ID, a boolean value indicating if the API call was successful (the vital reading was successfully archived or restored), and the return message from the vitals API.
