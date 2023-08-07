import dynamodb from "aws-sdk"

export async function awsQuery(xmit: string) {
    const region = process.env.AWS_REGION ? process.env.AWS_REGION : 'NoRegionProvided';

    // aws sdshipaa access keys
    const accessKeyId_apps = process.env.SDSAPPS_ACCESS_KEY_ID ? process.env.SDSAPPS_ACCESS_KEY_ID: 'NoAppsAccessKeyProvided';
    const secretAccessKey_apps = process.env.SDSAPPS_SECRET_ACCESS_KEY ? process.env.SDSAPPS_SECRET_ACCESS_KEY : 'NoAppsSecretAccessKeyProvided';

    var dynamo_apps = new dynamodb.DynamoDB({
      region,
      credentials: {
      accessKeyId: accessKeyId_apps,
      secretAccessKey: secretAccessKey_apps
      },
    });

		var requestUserID = dynamo_apps.query(
      {
        TableName: "userID",
        IndexName: "Account-Office-index",
        KeyConditionExpression: "Account = :xmit",
        ExpressionAttributeValues: {
          ":xmit": {
            S: xmit,
          },
        },
      },
    );

	var promiseUserID = requestUserID.promise();

			// handle promise's fulfilled/rejected states
    const officeData = await promiseUserID.then(
      async function(data) {
        if(data.Count && data.Count > 0) {
          const unmarshalledData = data.Items?.map((i) => dynamodb.DynamoDB.Converter.unmarshall(i));
          // await airplane.display.json(unmarshalledData);
          return unmarshalledData;
        } else {
        //   await airplane.display.text(`No data found.`);
            return 'No data found.'
        }
      },
      function(error) {
        console.log(error);
      }
    );

    return officeData;
}