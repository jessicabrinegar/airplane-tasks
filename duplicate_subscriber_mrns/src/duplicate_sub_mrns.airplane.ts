import airplane from "airplane";

export default airplane.task(
  {
    slug: "duplicate_subscriber_mrns_jb",
    name: "Duplicate Subscribers (by mrn)",
    description:
      "Fetches duplicate MRNs, returning the subscriber information.",
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
    // Hacky way of passing in array of strings(organizationIds) into a single shorttext airplane parameter.
    const database = params.database;

    const run = await airplane.sql.query(
      database,
      `
      SELECT subscriber.id, subscriber.organization_id,
      person.first_name, person.last_name,
      subscriber.integration_metadata->>'ANL_ACCT_NUM' AS Xmit,
      subscriber.integration_metadata->>'mrn' AS mrn,
      subscriber.integration_metadata 
      FROM acm.subscriber as subscriber, acm.person as person
      WHERE subscriber.integration_metadata->>'mrn'
      IN (
        SELECT 
        CASE 
          when jsonb_exists(subscriber.integration_metadata, 'mrn')
          then subscriber.integration_metadata->>'mrn'
          else 'Unknown'
        END AS mrn
        FROM acm.subscriber
        GROUP BY mrn
        HAVING COUNT(*) > 1
      )
      AND person.id = subscriber.id
      ORDER BY mrn;       
      		`
    );

    return run.output.Q1;
  }
);
