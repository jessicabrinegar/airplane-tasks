const awsConfig = {
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.SDSAPPS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.SDSAPPS_SECRET_ACCESS_KEY as string,
  },
}

export default awsConfig
