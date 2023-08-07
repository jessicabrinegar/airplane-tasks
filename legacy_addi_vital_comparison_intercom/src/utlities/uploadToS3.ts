import AWS from 'aws-sdk'
import dayjs from 'dayjs'
import { v4 as uuidv4 } from 'uuid'

type AwsCredentialTypes = {
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
}

const awsConfig = {
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.CANIS_PROD_ACCESS_KEY_ID,
    secretAccessKey: process.env.CANIS_PROD_SECRET_ACCESS_KEY,
  } as AwsCredentialTypes,
}

// Uploads to apm-reports-canis-prod bucket
const uploadFileToS3 = async (
  content: string,
  filetype: 'csv' | 'json',
  organizationName: string
) => {
  const folder = filetype === 'csv' ? 'CSV' : 'JSON'
  const uploadParams = {
    Bucket: 'apm-reports-canis-prod',
    Key: `addi-vitals-sync/LegacyAddiDynamoVitalLogs/subscriber-only-runs/${folder}/VitalReport(${organizationName})-${dayjs().format(
      'MM-DD-YYYY'
    )}-${uuidv4().slice(0, 8)}.${filetype}`,
    Body: content,
  }

  const request = new AWS.S3(awsConfig)

  try {
    const data = await request.putObject(uploadParams).promise()
    return data // for unit tests
  } catch (err) {
    console.log(err)
    return err
  }
}

export default uploadFileToS3
