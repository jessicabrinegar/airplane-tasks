import airplane from "airplane";
import { FetchSubscriberInsightsType, SubscriberSummaryReportType } from './constants/types';
import { SubscriberSummaryReportMapper } from './mappers/subscriber-summary-report.mapper';
import Papa from "papaparse";
import { MailgunClientService } from "./services/mailgun-client.service";
// import zipcode_to_timezone from 'zipcode-to-timezone';
// import { utcToZonedTime } from 'date-fns-tz'

export default airplane.task(
	{
		slug: "subscriber_summary_report_10h_jb",
		name: "Subscriber Summary Report 10H",
		timeout: 36000,
		parameters: {
			organization_id: {
				name: "Top Level Organization Id",
				type: "shorttext",
				required: true,
				description: "Top Level Organization Id.",
			},
			date_from: {
				name: "Date From",
				type: "date",
				required: true,
				description: 'The date from which you wish to retrieve the data.'
			},
			date_to: {
				name: "Date To",
				type: "date",
				required: true,
				description: 'The date up to which you wish to retrieve the data.'
			},
			recipients_email: {
			  name: "Multiple Recipients Email Addresses",
			  type: "shorttext",
			  required: true,
			  description: "One or More Recipients Email Addresses. For Example: email1,email2,email3,...",
			},
		},
		envVars: {
		  MAILGUN_API_ENDPOINT: {
			config: 'MAILGUN_API_ENDPOINT'
		  },
		  MAILGUN_API_KEY: {
			config: 'MAILGUN_API_KEY'
		  },
		  MAILGUN_API_DOMAIN: {
			config: 'MAILGUN_API_DOMAIN'
		  },
		  EMAIL_FROM: {
			config: 'EMAIL_FROM'
		  },
		},
	},
	async (params: any) => {
		const organizationId = params.organization_id;

		// Generate report data
		const reportData: SubscriberSummaryReportType[] = await GetSubscriberSummaryReport(
			organizationId,
			params.date_from,
			params.date_to
		);

		// Report Json Data
		const jsonOutput = SubscriberSummaryReportMapper.toListJson(reportData);
		const csv = Papa.unparse(jsonOutput);

		// Send Email through service
		const emailSentTo = params.recipients_email.split(",");
		await MailgunClientService.sendEmail(organizationId, emailSentTo, csv);

		// split data into two tables if quantity is greater than output limit
		if(jsonOutput.length >= 7500) {

			// mark the index for midpoint through data
			const midpoint_index = Math.floor(jsonOutput.length / 2);
			console.log(midpoint_index);

			// save data from start to midpoint into new array
			const output_half1 = jsonOutput.slice(0, midpoint_index);

			// save data from midpoint to end into new array
			const output_half2 = jsonOutput.slice(midpoint_index);

			// notify user that the data will be split across two tables
			await airplane.display.text("Output exceeds max length for one table - please be sure to scroll down for second table.");

			// display both halfs into separate displays to get around 4M bit limit
			airplane.display.table(output_half1);
			airplane.display.table(output_half2);

		} else {
			// display data normally if within output limit
			airplane.appendOutput(jsonOutput);
		}

		return;
	}
)

const GetSubscriberSummaryReport = async (organizationId: string, dateFrom: any, dateTo: any): Promise<SubscriberSummaryReportType[]> => {
	const fetchChildOrganizations: any = await airplane.execute(
		"fetch_child_organizations_jb",
		{
			organization_id: organizationId,
		}
	);

	if (!fetchChildOrganizations?.output?.Q1?.length) {
		console.log(`Organization: ${organizationId} | Organization was not found`);
	// 	throw new Error(
	// 		`Organization: ${organizationId} | Organization was not found`
	// 	);
	}

	const fetchTopLevelOrganization: any = await airplane.execute(
		"fetch_top_level_organization",
		{
			organization_id: organizationId,
		}
	);

	const organizations = fetchChildOrganizations?.output?.Q1;
	const organizationIds = organizations.map((o:any) => {return {id: o.id, timezone: o.timezone_id}});

	// Generate Groups of Organization with 5 IDS
	const noOfOrgBatches = 5
	const organizationIdsGroup: any[] = [];
	for (let i = 0; i < organizationIds.length; i += noOfOrgBatches) {
		organizationIdsGroup.push(organizationIds.slice(i, i + noOfOrgBatches));
	}

	let report: SubscriberSummaryReportType[] = [];

	for (let orgIds of organizationIdsGroup) {
		const outcome: FetchSubscriberInsightsType | undefined = await FetchSubscribersInsights(dateFrom, dateTo, orgIds);

		if (!outcome?.subscribers?.length) continue;

		console.log("Successfully Fetched Subscriber Insights for the Organizations:", orgIds?.toString())

		const subscriberSummaryReport: SubscriberSummaryReportType[] = SubscriberSummaryReportMapper.toListDto(
			outcome.subscribers,
			fetchTopLevelOrganization?.output?.Q1?.[0],
			organizations.map((o:any) => o.id),
			organizations.map((o:any) => o.timezone_id),
			outcome.firstAndLastVitalDates,
			outcome.orderDetails,
			outcome.subscriberXmitIds,
			outcome.vitalsCount,
			outcome.vitalTakenDates,
			outcome.deviceLog,
			outcome.subscriberProfiles,
			outcome.shippingInfo
		);

		report.push(...subscriberSummaryReport)
	}

	// if (!report?.length)
	// 	throw new Error(
	// 		`Top Level Organization: ${organizationId} | Subscribers were not found.`
	// 	);

	if (!report?.length) {
		console.log(`Top Level Organization: ${organizationId} | Subscribers were not found.`);
	}

	return report;
};

const FetchSubscribersInsights = async (
	dateFrom: any, 
	dateTo: any, 
	organizationIds: any[]
	): Promise<FetchSubscriberInsightsType | undefined> => {
	if (!organizationIds?.length) return;

	console.log("Executing Fetch Subscriber Insights for the Organizations:", organizationIds?.toString())

	const fetchSubscribers: any = await airplane.execute(
		"fetch_subscribers_for_organization_ids",
		{
			organization_ids: organizationIds.map((o)=>o.id)?.toString(),
		}
	);

	if (!fetchSubscribers?.output?.length) {
		console.log("ERR_SUBSCRIBER_NOT_FOUND | No Subscribers were found for the Organizations:", organizationIds?.toString())
		return;
	};

	const subscribers = fetchSubscribers.output;
	const subscriberIds = subscribers.map((subscriber) => subscriber.id)

	const fetchOrderDetails: any = await airplane.execute(
		"fetch_order_details_no_undefined",
		{
			subscriber_ids: subscriberIds?.toString(),
			date_from: dateFrom,
			date_to: dateTo
		}
	);

	console.log("Successfully Fetches Order Details information for the Subscribers.");

	const fetchFirstAndLastVitalDate: any = await airplane.execute(
		"fetch_first_and_last_vital_date",
		{
			subscriber_ids: subscriberIds?.toString(),
		}
	);

	console.log("Successfully Fetches First and Last Vital Dates information for the Subscribers.");

	const fetchVitalCount: any = await airplane.execute(
		"fetch_vital_count_jb",
		{
			subscriber_ids: subscriberIds?.toString(),
			date_from: dateFrom,
			date_to: dateTo
		}
	);

	console.log("Successfully Fetches Vital Count information for the Subscribers.");

	const fetchVitalTakenDates: any = await airplane.execute(
		"fetch_vital_taken_dates",
		{
		  subscriber_ids: subscriberIds?.toString(),
		  date_from: dateFrom,
		  date_to: dateTo,
		}
	  );
	
	  console.log(
		"Successfully Fetches Vital Taken Dates for the Subscribers."
	  );


	const fetchSubscriberXmitInfo: any = await airplane.execute(
		"fetch_subscriber_xmit",
		{
			subscriber_ids: subscriberIds?.toString(),
		}
	);

	console.log("Successfully Fetches Subscriber XMIT information for the Subscribers.");

	const fetchDeviceLogStatus: any = await airplane.execute(
		"fetch_device_log_status",
		{
			subscriber_ids: subscriberIds?.toString(),
		}
	);

	console.log("Successfully Fetches Device Log information for the Subscribers.");

	const fetchSubscriberProfileInfo: any = await airplane.execute(
		"fetch_subscriber_profile_info",
		{
			subscriber_ids: subscriberIds?.toString(),
		}
	);

	console.log("Successfully Fetches Subscriber Profile information for the Subscribers.");

	let fetchShippingInfo: any = [];
	if (fetchOrderDetails?.output?.length) {
		for (const order of fetchOrderDetails?.output) {
			if (order?.subscriberId && order?.shipmentDetails?.shipmentId) {
				const info: any = await airplane.execute(
					"fetch_shipping_info",
					{
						shipment_id: order.shipmentDetails.shipmentId,
						subscriber_id: order.subscriberId,
					}
				);
				info?.output?.subscriberId && fetchShippingInfo.push(info?.output)
			}
		}
	}

	console.log("Successfully Fetches Shipping information for the Subscribers.");

	return {
		subscribers: subscribers,
		firstAndLastVitalDates: fetchFirstAndLastVitalDate?.output,
		orderDetails: fetchOrderDetails?.output,
		subscriberXmitIds: fetchSubscriberXmitInfo?.output,
		vitalsCount: fetchVitalCount?.output,
		vitalTakenDates: fetchVitalTakenDates?.output,
		deviceLog: fetchDeviceLogStatus?.output,
		subscriberProfiles: fetchSubscriberProfileInfo?.output,
		shippingInfo: fetchShippingInfo
	};
};
