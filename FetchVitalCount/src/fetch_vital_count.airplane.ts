import airplane from "airplane";

export default airplane.task(
  {
    slug: "fetch_vital_count_jb",
    name: "Fetch Vital Count",
    description: `
	  The cumulative count of grouped vital signs (not individual readings) recorded during a given timeframe can be obtained by using either the subscriberIds provided in the request or the organization Id.

	  *Please ensure that you only provide either the organization ID or multiple subscriber IDs in your request, and avoid passing both values simultaneously.*
	 
	  When the organizationId is included in the request, it will gather all the child organizations and subscribers associated with that organization, 
	  including those in the child organizations.The vitals count is then derived from this collective data. 
	  
	  Whereas when we use the subscriberIds parameter, it directly retrieves the vital counts for those specific subscribers.
	  `,
    resources: ["postgres_prod_vitals"],
    parameters: {
      organization_id: {
        name: "Organization Id",
        type: "shorttext",
        required: false,
        description: "Organization Id.",
      },
      subscriber_ids: {
        name: "Multiple Subscriber Ids",
        type: "shorttext",
        required: false,
        description: "Multiple Subscriber Ids. For Example: id1,id2,id3...",
      },
      date_from: {
        name: "Date From",
        type: "date",
        required: true,
        description: "The date from which you wish to retrieve the data.",
      },
      date_to: {
        name: "Date To",
        type: "date",
        required: true,
        description: "The date up to which you wish to retrieve the data.",
      },
    },
  },
  async (params: any) => {
    let output: any;

    if (params?.organization_id) {
      output = await FetchByOrganizationId(params.organization_id, params);
    } else {
      output = await FetchBySubscriberIds(params);
    }

    return output;
  }
);

const FetchBySubscriberIds = async (params: any) => {
  let subscriberIds = params.subscriber_ids;

  // Hacky way of passing in array of strings(subscriberIds) into a single shorttext airplane parameter.
  subscriberIds = subscriberIds
    ?.split(",")
    ?.map((item) => `'${item.trim()}'`)
    ?.join(",");
  const dateFrom = params.date_from?.toISOString()?.split("T")?.[0];
  const dateTo = params.date_to?.toISOString()?.split("T")?.[0];

  const result = await RunQuery(subscriberIds, dateFrom, dateTo);
  
  const resultMap = {};

  result.forEach((item) => {
    if (!resultMap[item.subscriber_id]) {
      resultMap[item.subscriber_id] = {
        subscriber_id: item.subscriber_id,
        total_vital_signs: 0,
      };
    }
    resultMap[item.subscriber_id].total_vital_signs++;
  });

  const finalResultArray = Object.values(resultMap)
  .map((item:any) => ({
    subscriber_id: item.subscriber_id,
    total_vital_signs: item.total_vital_signs,
  }));

  return finalResultArray;
};

const RunQuery = async (
  subscriberIds: string,
  dateFrom: string,
  dateTo: string
) => {
  console.log("Executing Fetch Vitals Count for subscriberIds");

  const run = await airplane.sql.query(
    "postgres_prod_vitals",
    `
    SELECT subscriber_id, COUNT(*) AS total_vital_signs
    FROM vital.vital_reading
    WHERE subscriber_id IN  (${subscriberIds})
    AND recorded_at::DATE >= '${dateFrom}' AND recorded_at::DATE <= '${dateTo}'
    GROUP BY subscriber_id, raw_record_id;         
    `
  );

  return run.output.Q1;
};

const FetchByOrganizationId = async (
  organizationId: string,
  params: any
): Promise<any> => {
  console.log(
    `Organization: ${organizationId} | Executing Fetch the child Organizations.`
  );

  const fetchChildOrganizations: any = await airplane.execute(
    "fetch_child_organizations",
    {
      organization_id: organizationId,
    }
  );

  if (!fetchChildOrganizations?.output?.Q1?.length)
    throw new Error(
      `Organization: ${organizationId} | Organization was not found`
    );

  const organizations = fetchChildOrganizations?.output?.Q1;
  const organizationIds = organizations.map((o) => o.id);

  // Generate Groups of Organization with 5 IDS
  const noOfOrgBatches = 5;
  const organizationIdsGroup: any[] = [];
  for (let i = 0; i < organizationIds.length; i += noOfOrgBatches) {
    organizationIdsGroup.push(organizationIds.slice(i, i + noOfOrgBatches));
  }

  const output: any[] = [];

  for (const orgIds of organizationIdsGroup) {
    console.log(
      `Organization: ${organizationId} | Executing Fetch Subscribers for the Organizations: `,
      orgIds?.toString()
    );

    const fetchSubscribers: any = await airplane.execute(
      "fetch_subscribers_for_organization_ids",
      {
        organization_ids: orgIds?.toString(),
      }
    );

    const subscribers = fetchSubscribers?.output;
    let subscriberIds = subscribers?.map((subscriber) => subscriber?.id);

    if (!subscribers?.length) {
      console.log(
        `ERR_SUBSCRIBER_NOT_FOUND | Organization: ${organizationId} | No Subscribers were found for the Organizations: ${orgIds?.toString()}`
      );
      continue;
    }

    // Hacky way of passing in array of strings(subscriberIds) into a single shorttext airplane parameter.
    subscriberIds = subscriberIds
      ?.map((item) => `'${item}'`)
      ?.join(",");
    const dateFrom = params.date_from?.toISOString()?.split("T")?.[0];
    const dateTo = params.date_to?.toISOString()?.split("T")?.[0];

    const result: any = await RunQuery(
      subscriberIds,
      dateFrom,
      dateTo
    );

    const resultMap = {};

  result.forEach((item) => {
    if (!resultMap[item.subscriber_id]) {
      resultMap[item.subscriber_id] = {
        subscriber_id: item.subscriber_id,
        total_vital_signs: 0,
      };
    }
    resultMap[item.subscriber_id].total_vital_signs++;
  });

  const finalResultArray = Object.values(resultMap)
  .map((item:any) => ({
    subscriber_id: item.subscriber_id,
    total_vital_signs: item.total_vital_signs,
  }));

  finalResultArray?.length && output.push(...finalResultArray);
  }

  return output;
};
