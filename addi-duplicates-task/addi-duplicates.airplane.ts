import airplane from "airplane";

export default airplane.task(
    {
      slug: "duplicate_subscriber_task_jb",
      name: "Duplicate Subscribers (by patientId)",
      description:
        "Fetches duplicate patientIds, returning the subscribers' information.",
      resources: ["postgres_prod_orgs"],
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

        const run = await airplane.sql.query(
            params.database,
            `
            SELECT
              duplicates.patientId,
              person.first_name,
              person.last_name,
              ARRAY_AGG(DISTINCT subscriber.organization_id) AS organization_id,
              duplicates.duplicate_count,
              ARRAY_AGG(subscriber.id) AS subscriber_ids
            FROM (
                SELECT
                    subscriber.integration_metadata->>'patientId' AS patientId,
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
            GROUP BY
                duplicates.patientId, person.first_name, person.last_name, duplicates.duplicate_count;
            `
        );
        return run.output.Q1;
})