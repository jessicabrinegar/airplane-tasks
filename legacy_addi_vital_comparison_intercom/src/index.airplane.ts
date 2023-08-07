import airplane from 'airplane'
import dayjs from 'dayjs'
import uploadFileToS3 from './utlities/uploadToS3'
import queryAWSDynamo from './utlities/dynamoK4Query'
import axiosCallToReprocess from './utlities/axiosCallToReprocess'
import getFileSize from './utlities/getFileSize'
import formatAsCSV from './utlities/formatAsCSV'
import { v4 as uuidv4 } from 'uuid'
import { AddiLog, TaskOutput, DynamoLog, AxiosResponse } from './typings'

export default airplane.task(
  {
    slug: 'legacy_addi_vital_comparison_intercom_jb',
    name: 'Legacy Addi Vital Comparison (Intercom)',
    description:
      'Given an Addi SubscriberID, compares Addi Postgres logs with Legacy Dynamo Vital logs and reveals missing observationIDs.',

    runtime: 'standard',
    resources: ['postgres_prod_vitals', 'postgres_prod_orgs'],
    timeout: 43200,

    envVars: {
      CANIS_PROD_ACCESS_KEY_ID: { config: 'CANIS_PROD_ACCESS_KEY_ID' },
      CANIS_PROD_SECRET_ACCESS_KEY: { config: 'CANIS_PROD_SECRET_ACCESS_KEY' },
      SDSAPPS_ACCESS_KEY_ID: { config: 'SDSAPPS_ACCESS_KEY_ID' },
      SDSAPPS_SECRET_ACCESS_KEY: { config: 'SDSAPPS_SECRET_ACCESS_KEY' },
    },

    parameters: {
      sub_or_xmit: {
        name: 'SubscriberID or Xmit',
        type: 'shorttext',
        required: true,
        description: "A subscriber's UUID inside Addi, or simply an xmit.",
      },
      start_time: {
        name: 'Start Date',
        type: 'date',
        required: true,
      },
      end_time: {
        name: 'End Date',
        type: 'date',
        required: true,
      },
    },
  },
  async (params) => {
    const startDate = new Date(params.start_time).toISOString().substring(0, 10)
    const end_date = new Date(params.end_time).toISOString().substring(0, 10)
    const sameDates = startDate === end_date
    // One day needs to be added to end_time b/c SQL 'between' query will not include vitals taken after 00:00:00 that day
    const date = new Date(params.end_time)
    const day = 60 * 60 * 24 * 1000
    const endDate = new Date(date.getTime() + day).toISOString().substring(0, 10)

    const isSubscriberEntered = params.sub_or_xmit.includes('-')
    const subscriberInfo: TaskOutput = {
      subscriber: isSubscriberEntered ? params.sub_or_xmit : null,
      xmit: isSubscriberEntered ? null : params.sub_or_xmit,
      dynamoLogs: [],
      addiLogs: [],
      dynamoCount: 0,
      addiCount: 0,
      countDiff: 0,
      identicalLogs: true,
      missingObservationIds: [],
    }

    const getUserData = await airplane.sql.query(
      'postgres_prod_orgs',
      `
       SELECT id as subscriber_id, organization_id, integration_metadata ->> 'legacy_anelto_prohealth' as xmit
       FROM acm.subscriber
       ${
         isSubscriberEntered
           ? `WHERE id = '${params.sub_or_xmit}'`
           : `WHERE integration_metadata ->> 'legacy_anelto_prohealth' = '${params.sub_or_xmit}'`
       }
       LIMIT 1
       `
    )
    const userData = getUserData.output.Q1

    // Second data fetch
    if (!userData.length) {
      const secondUserDataCheck = await airplane.sql.query(
        'postgres_prod_orgs',
        `
         SELECT id as subscriber_id, organization_id, integration_metadata ->> 'ANL_ACCT_NUM' as xmit
         FROM acm.subscriber
         ${
           isSubscriberEntered
             ? `WHERE id = '${params.sub_or_xmit}'`
             : `WHERE integration_metadata ->> 'ANL_ACCT_NUM' = '${params.sub_or_xmit}'`
         }
         LIMIT 1
         `
      )
      const userDataConfirmation = secondUserDataCheck.output.Q1

      // use data from second xmit check since first was not populated with anything
      if (userDataConfirmation[0]) {
        const { subscriber_id, xmit } = userDataConfirmation[0]

        subscriberInfo.xmit = xmit
        subscriberInfo.subscriber = subscriber_id
      } else throw new Error('Cannot find user inside dynamo. Verify Xmit exists.')
    } else {
      // Use data from first run since it was populated
      const { subscriber_id, xmit } = userData[0]
      subscriberInfo.xmit = xmit
      subscriberInfo.subscriber = subscriber_id
    }

    // Gather Postgres Vital Raw Logs
    const vitalLogRun = await airplane.sql.query<AddiLog>(
      'postgres_prod_vitals',
      `
      SELECT vrl.id, vrl."source", vrl.raw_payload, vrl.created_at, vrl.processed_at
      FROM vital.raw_log vrl, vital.vital_reading vr
      WHERE raw_payload ->> 'subscriberId' = '${subscriberInfo.subscriber}'
      AND raw_payload ->> 'timestamp' ${
        sameDates ? `LIKE '${startDate}%'` : `BETWEEN '${startDate}' AND '${endDate}'`
      }
      AND raw_payload ->> 'eventcode' = '0060'
      AND vrl.id = vr.raw_record_id GROUP BY vrl.id
      `
    )
    const postgresVitalLogs: AddiLog[] = vitalLogRun.output.Q1
    subscriberInfo.addiLogs = postgresVitalLogs

    // Gather Dynamo Logs based off postgres response
    const fetchDynamoLogs: DynamoLog[] = await queryAWSDynamo(
      subscriberInfo.xmit!,
      startDate,
      endDate
    )
    subscriberInfo.dynamoLogs = fetchDynamoLogs

    // Comparison Logic Below
    const isSubWithNoLogs = !subscriberInfo.dynamoLogs.length && !subscriberInfo.addiLogs?.length
    const dynamoLogs = subscriberInfo.dynamoLogs.sort()
    const addiLogs = subscriberInfo.addiLogs.sort() || []

    // Subscriber has no logs - do second check against dynamo but prevent comparison from happening
    if (isSubWithNoLogs) {
      const dynamoLogs: DynamoLog[] = await queryAWSDynamo(
        subscriberInfo.subscriber!,
        startDate,
        endDate
      )
      if (!dynamoLogs.length) subscriberInfo.addiLogs = null

      return subscriberInfo
    }

    // Counts
    subscriberInfo.dynamoCount = dynamoLogs.length
    subscriberInfo.addiCount = addiLogs.length
    subscriberInfo.countDiff = dynamoLogs.length - addiLogs.length

    // For xmits with unequal dynamo / addi lengths, find missing logs that are on dynamo but not addi
    if (dynamoLogs.length !== addiLogs.length) {
      subscriberInfo.identicalLogs = false

      // Loop to find logs in dynamo that are not in addi and push to missingObservations
      dynamoLogs.map((log, index) => {
        const dynamoObservationId = log.aneltoObservationId
        let isAnAddiMatch = false

        addiLogs.map((addiLog) => {
          const addiObservationId = addiLog.raw_payload.vital._id
          if (dynamoObservationId === addiObservationId) isAnAddiMatch = true
        })

        if (!isAnAddiMatch) subscriberInfo.missingObservationIds.push(dynamoLogs[index])
      })
    }

    // Output to S3 canis-prod apm-reports bucket
    const CSV = formatAsCSV([subscriberInfo])
    await uploadFileToS3(CSV, 'csv', params.sub_or_xmit)

    // Minify output
    const minifiedOutput = {
      subscriber: subscriberInfo.subscriber,
      xmit: subscriberInfo.xmit,
      identicalLogs: subscriberInfo.identicalLogs,
      missingLogs: subscriberInfo.missingObservationIds.map((log) => {
        const { xmit, eventCode, event, timestamp, vital } = log

        return {
          account: xmit.includes('-Test') ? xmit.slice(0, -5) : xmit,
          eventcode: eventCode,
          event: event,
          timestamp: timestamp,
          vital: vital,
        }
      }),
      addiLogs: subscriberInfo.addiLogs?.length
        ? addiLogs.map((log) => log.raw_payload.vital._id)
        : null,
      dynamoLogs: subscriberInfo.dynamoLogs.map((log) => log.aneltoObservationId),
      // dynamoCount: subscriberInfo.dynamoCount,
      // addiCount: subscriberInfo.addiCount,
      countDiff: subscriberInfo.countDiff,
    }

    if (!subscriberInfo.missingObservationIds.length) {
      return minifiedOutput
    }

    await airplane.display.text(
      'Please review the prompt below. Comparison sent to canis-prods S3 apm-reports-bucket/LegacyAddiDynamoVitalLogs/subscriber-only-runs bucket.'
    )

    // Display information to user
    await airplane.display.table([minifiedOutput])

    // Prompt user to reprocess missing logs
    const { is_reprocessing } = await airplane.prompt({
      is_reprocessing: {
        name: `Reprocess ${subscriberInfo.missingObservationIds.length} Missing Logs?`,
        type: 'boolean',
        required: false,
        description: 'If true, all logs inside the missingLogs column will be reprocessed.',
      },
    })

    if (!is_reprocessing) {
      // Display output in exportable CSV table
      const processedCSVFile = await airplane.file.upload(
        CSV,
        `VitalComparison(${params.sub_or_xmit})-${dayjs().format('MM-DD-YYYY')}-${uuidv4().slice(
          0,
          8
        )}.csv`
      )
      await airplane.display.file(processedCSVFile)
      return
    }

    // Axios Call to Reprocess Logs
    const reprocessOutput: AxiosResponse[] = []
    for (const log of [minifiedOutput]) {
      const { missingLogs } = log

      if (!missingLogs.length) continue

      // reprocess each vital inside subscriber
      for (const observation of missingLogs) {
        const result = await axiosCallToReprocess(observation, params.sub_or_xmit)
        reprocessOutput.push(...result)
      }
    }

    // Display an additional table of reprocessed vital logs
    // await airplane.display.table(reprocessOutput)
    // TODO make downloadable file by importing seperate CSV
    return reprocessOutput
  }
)
