import awsConfig from './awsConfig'
import { DynamoLog } from '../typings'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const queryAWSDynamo = async (input: string, startDate: string, endDate: string) => {
  const returnOutput: DynamoLog[] = []
  const dynamoClient = new DynamoDB(awsConfig)
  const dynamoStartDate = startDate
  const dynamoEndDate = endDate
  const dynamoParams =
    dynamoStartDate === dynamoEndDate
      ? {
          TableName: 'AneltoEvents-k4rov7gtyvf7tf55amtn4y7brm-prod',
          IndexName: 'AccountwithTimestamp',
          ExpressionAttributeNames: { '#t': 'TimeStamp' }, // for reserved keyword
          KeyConditionExpression: 'Account = :Account and begins_with (#t, :StartTimeStamp)',
          ExpressionAttributeValues: {
            ':Account': { S: input },
            ':StartTimeStamp': { S: dynamoStartDate },
          },
          ScanIndexForward: false, // for descending order
        }
      : {
          TableName: 'AneltoEvents-k4rov7gtyvf7tf55amtn4y7brm-prod',
          IndexName: 'AccountwithTimestamp',
          ExpressionAttributeNames: { '#t': 'TimeStamp' }, // for reserved keyword
          KeyConditionExpression:
            'Account = :Account and #t between :StartTimeStamp and :EndTimeStamp',
          ExpressionAttributeValues: {
            ':Account': { S: input },
            ':StartTimeStamp': { S: dynamoStartDate },
            ':EndTimeStamp': { S: dynamoEndDate },
          },
          ScanIndexForward: false, // for descending order
        }

  // Dynamo Call
  const dynamoResult = await dynamoClient
    .query(dynamoParams)
    .then((data) => data)
    .catch((err) => err)

  const result: any = await dynamoResult.Items

  // If we don't have result, try making second call with -Test flag
  if (!result.length) {
    dynamoParams.ExpressionAttributeValues[':Account'] = { S: `${input}-Test` }

    const secondDynamoCall = await dynamoClient
      .query(dynamoParams)
      .then((data) => data)
      .catch((err) => err)

    const secondResult = await secondDynamoCall.Items
    if (!secondResult) throw new Error('No logs for normal xmit or xmit-Test')

    await secondResult.map((log: any) => {
      const {
        id: observationId,
        Account,
        aneltoEventsUserId,
        Event,
        EventCode,
        Id: aneltoObservationId,
        RawData,
        TimeStamp,
      } = unmarshall(log)

      returnOutput.push({
        xmit: Account,
        eventCode: EventCode,
        event: Event,
        timestamp: TimeStamp,
        vital: JSON.parse(RawData).vital,
        observationId: observationId,
        aneltoObservationId: aneltoObservationId,
        userId: aneltoEventsUserId,
      })
    })

    return returnOutput
  }

  // Only runs if first result without -Test flag returned logs for that xmit
  await result.map((log: any) => {
    const {
      id: observationId,
      Account,
      aneltoEventsUserId,
      Event,
      EventCode,
      Id: aneltoObservationId,
      RawData,
      TimeStamp,
    } = unmarshall(log)

    returnOutput.push({
      xmit: Account,
      eventCode: EventCode,
      event: Event,
      timestamp: TimeStamp,
      vital: JSON.parse(RawData).vital,
      observationId: observationId,
      aneltoObservationId: aneltoObservationId,
      userId: aneltoEventsUserId,
    })
  })

  return returnOutput
}

export default queryAWSDynamo
