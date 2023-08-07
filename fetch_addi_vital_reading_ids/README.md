# Fetch ADDI Vital Reading IDs

## Purpose:

- [Airplane Task Report](https://app.airplane.dev/tasks/tsk20230619zogg0mzvg7m?__env=prod) that is responsible for finding all the vital reading logs inside the Postgres vitals database that are within the specific timeframe. Reveals the vital_reading id, the reading, and the timestamp it was recorded.

### Task Input

- Start and End Date to fetch logs in the range of
- ADDI Subscriber ID or Xmit
- Database choice

### Task Output

- Contains a a table with the vital reading ID, the reading, and the date it was recorded.
