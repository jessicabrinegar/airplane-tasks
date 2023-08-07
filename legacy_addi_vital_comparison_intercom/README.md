# Legacy Addi Vital Comparison (Intercom)

## Purpose:

- [Airplane Task Report]() that is responsible for finding all the vital logs inside sdsApps' Dynamo K4-Events table, and compare them with Addi's PostgreSQL Vital Logs. Reveals missing vitals that are inside legacy (dynamo) but not the modern system (addi) and then _prompts_ the user to reprocess them. This task was created to meet the needs of Intercom workflows by allowing just a date, rather than a specific date and time, for the start and end date parameters. Intended use for an individual subscriber or xmit. To run a whole organization, see [this other version](https://app.airplane.dev/tasks/tsk20230413z1cjzkoek6c?organization_id=980bab05-e0c2-4806-8303-69b766b2a09d&start_time=2023-04-01T05%3A00%3A00Z&end_time=2023-04-13T05%3A00%3A00Z&is_including_children=true&__env=prod).

### Task Input

- Subscriber ID or Xmit
- Start and End Date to fetch logs in the range of

### Task Output

- Contains a single row table with the subscriber or xmit.

  - The last missingObservationIds column, contains all the dynamo vitals that are not inside addi.
  - Columns with a null `addiLogs` value, means that xmit doesn't have logs inside dynamo or addi.

- Second table will only populate if user prompted to reprocess the logs when asked, and will contain the API call status when reprocessing the missing logs.
