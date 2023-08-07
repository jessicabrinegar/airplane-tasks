type DynamoLog = {
  xmit: string
  eventCode: string
  event: string
  observationId: string
  aneltoObservationId: string
  vital: {
    _id: string
    deviceNumber: string
    pulseox?: Record<string, number>
    heartrate?: Record<string, number>
    bloodpressure?: Record<string, number>
    glucose?: Record<string, number>
    blueid: string
  }
  userId: string
  timestamp: string
}

type AddiLog = {
  id: string
  source: string
  raw_payload: {
    event: string
    vital: {
      _id: string
      blueid: string
      heartrate?: Record<string, number>
      deviceNumber: string
      bloodpressure?: Record<string, number>
    }
    account: string
    eventcode: string
    timestamp: string
    eventOrigin: string
    subscriberId: string
    organizationId: string
    eventIdentifier: string
  }
  created_at: string | null
  processed_at: null | string
}

type TaskOutput = {
  subscriber: string | null
  xmit: string | null
  organization?: string | null
  dynamoLogs: DynamoLog[]
  addiLogs: AddiLog[] | null | string[]
  dynamoCount: number
  addiCount: number
  countDiff: number
  identicalLogs: boolean
  missingObservationIds: DynamoLog[]
}

type AxiosResponse = {
  didReprocess: boolean
  log: any
  organization?: string
  reason: string | null
}

export { DynamoLog, AddiLog, TaskOutput, AxiosResponse }
