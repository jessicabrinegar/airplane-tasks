import airplane from "airplane";

export default airplane.task(
    {
      slug: "duplicate_subscriber_task_jb",
      name: "Duplicate Subscribers (by patientId)",
      description:
        "Fetches duplicate patientIds, returning the subscribers' information.",
      resources: ["postgres_prod_orgs", "postgres_dev_organizations"],
      parameters: {
        database: {
          name: "Database",
          type: "shorttext",
          options: [
            { label: "Prod", value: "postgres_prod_orgs" },
            { label: "Dev", value: "postgres_dev_organizations" },
          ],
          default: "postgres_prod_orgs",
          required: true,
        },
      },
    },

    async (params: any) => {
      const database = params.database;

        const run = await airplane.sql.query(
            database,
            `
            SELECT
            duplicates.patientId,
            duplicates.duplicate_count,
            CONCAT(person.first_name, ' ', person.last_name) AS name,
            subscriber.organization_id AS organization_id,
            json_agg(subscriber.id) AS subscriber_ids
            FROM (
              SELECT
              integration_metadata->>'patientId' AS patientId,
              COUNT(*) AS duplicate_count
              FROM
              acm.subscriber
              WHERE
              archived = false AND active = true
              GROUP BY
              patientId
              HAVING
              COUNT(*) > 1
            ) AS duplicates
            JOIN
                acm.subscriber AS subscriber ON duplicates.patientId = subscriber.integration_metadata->>'patientId'
            JOIN
                acm.person AS person ON subscriber.id = person.id
            WHERE
                subscriber.archived = false AND subscriber.active = true
            GROUP BY
                duplicates.patientId, duplicates.duplicate_count, name, organization_id
            ORDER BY duplicates.duplicate_count DESC;
            `
        );
        return run.output.Q1;
})