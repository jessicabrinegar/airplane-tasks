import airplane from "airplane";

export default airplane.task(
  {
    slug: "fetch_duplicate_mrns_jb",
    name: "Fetch Duplicate MRNs",
    description: "Fetches duplicate MRNs in ADDI.",
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
			select 
			case 
				when jsonb_exists(subscriber.integration_metadata, 'mrn')
				then subscriber.integration_metadata->>'mrn'
				else 'Unknown'
			end as mrn,
			COUNT(*)
			from acm.subscriber
			group by mrn
			having COUNT(*) > 1;        
      		`
    );

    return run.output.Q1;
  }
);
