import airplane from "airplane";

export default airplane.task(
    {
      slug: "duplicate_subscriber_task_jb",
      name: "Duplicate Subscribers (by patientId)",
      description:
        "Fetches duplicate patientIds, returning the subscriber information.",
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
            "postgres_prod_orgs",
            `
            SELECT DISTINCT
            duplicates.patientId,
            person.first_name,
            person.last_name,
            CASE
                WHEN COUNT(DISTINCT subscriber.organization_id) = 1 THEN
                    subscriber.organization_id
                ELSE
                '00000000-0000-0000-0000-000000000000'
            END AS organization_id,
            duplicates.duplicate_count
            FROM (
                SELECT
                    subscriber.integration_metadata->>'patientId' AS patientId,
                    COUNT(*) AS duplicate_count
                FROM
                    acm.subscriber
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
                duplicates.patientId, person.first_name, person.last_name, duplicates.duplicate_count, subscriber.organization_id;
            `
        )
})