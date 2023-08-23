import airplane from "airplane";
import { UUID } from "crypto";
import axios from 'axios';
import { error } from "console";

export const env = {
  ordersAPI: process.env.ORDERS_ENDPOINT,
  ecgApiKey: process.env.ECG_API_KEY
}

const headersRequest = () => {
  return {
    'x-ecgapi-key': env?.ecgApiKey
  }
}

export default airplane.task(
  {
    slug: "remove_addi_duplicates_jb",
    name: "Remove Addi Duplicates",
    resources: ["postgres_prod_orgs", "postgres_dev_organizations"],
    parameters: {
      database: {
        name: "Database",
        type: "shorttext",
        options: [
          { label: "Prod", value: "postgres_prod_orgs" },
          { label: "Dev", value: "postgres_dev_organizations" },
        ],
        default: "postgres_dev_organizations",
        required: true,
      },
      // organization_id: {
      //   name: "Organization ID",
      //   type: "shorttext",
      //   required: true
      // }
    },
    envVars: {
      ORDERS_ENDPOINT: {
        config: 'ORDERS_ENDPOINT'
      },
      ECG_API_KEY: {
        config: 'ECG_API_KEY'
      }
    }
  },
  // This is your task's entrypoint. When your task is executed, this
  // function will be called.
  async (params: any) => {
    const database = params.database;
    // const org_id = params.organization_id;
    
    const duplicateData: any = await airplane.execute(
      "duplicate_subscriber_task_jb",
      {
        database: database,
      }
    );
    
    const duplicateOutput = duplicateData.output[0];
    const ids = duplicateOutput.subscriber_ids;


    const fetchOrders = async (ids:any) => {
      try {
        const resp = await axios.get("https://orders.ecg-api.com/orders", 
        {
          params: {
            subscriberIds: ids.join(',')
          },
          headers: headersRequest(),       
        })
        return resp.data.items;
      }
      catch (e: any){
        const errorMessage = `ERR_GET_ORDER | Error Message: ${e?.response?.data?.message}`;
        throw new Error(errorMessage)
      }
    };

    return fetchOrders(ids);
    
  }
);
