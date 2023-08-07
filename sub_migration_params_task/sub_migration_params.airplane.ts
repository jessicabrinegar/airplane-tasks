import airplane from "airplane";
import {org_data} from "./org_data.js"
import { awsQuery } from "./aws-query.js";

export default airplane.task(
  {
    slug: "sub_migration_params_jb",
    name: "Subscriber Migration Params",
    description:
      'Given an xmit, return the information needed to use the subscriber migration tool.',
    resources: {
      db: "crm_black"
    },
    envVars: {
			AWS_REGION:
				{config: "AWS_REGION"},
			SDSAPPS_ACCESS_KEY_ID:
				{config: "SDSAPPS_ACCESS_KEY_ID"},
			SDSAPPS_SECRET_ACCESS_KEY:
				{config: "SDSAPPS_SECRET_ACCESS_KEY"},
		},
    parameters: {
      xmit: {
        name: 'Xmit',
        type: 'shorttext',
        required: true,
        description: "The account number / xmit of the subscriber.",
      },
    }
  },
  // This is your task's entrypoint. When your task is executed, this
  // function will be called.
  async (params: any) => {
    const xmit = params.xmit;

    const sourceIdQuery = await airplane.sql.query<{ xmit: string }>(
			"db",
			`SELECT source_id FROM orders WHERE external_key_map = '${xmit}';`
		);
    const source_id = sourceIdQuery.output.Q1[0]

    const officeIdQuery = await airplane.sql.query(
      "db",
      `SELECT office_location FROM rrms_customers rc WHERE xmit_id = '${xmit}';`
    )
    const officeID = officeIdQuery.output.Q1[0]


    const officeData = await awsQuery(xmit);
    const office_name = officeData[0].Office;
    
    function getOfficeInfo() {
      for (const org of org_data) {
        if (org.office_name === office_name) {
          return org;
        }
        else if (org.office_id === officeID.office_location) {
          return org;
        }
      }
      return undefined;
    };

    const officeInfo = getOfficeInfo();

    return {
      ...source_id,
      organization_id: officeInfo?.organization_id,
      contract_id: officeInfo?.contract_id,
      source_anelto_username: officeInfo?.source_anelto_username,
      source_anelto_password: officeInfo?.source_anelto_password,
      dest_anelto_username: officeInfo?.dest_anelto_username,
      dest_anelto_password: officeInfo?.dest_anelto_password
    };

  }

);
