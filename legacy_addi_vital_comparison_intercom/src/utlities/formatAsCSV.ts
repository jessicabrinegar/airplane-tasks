import { TaskOutput } from '../typings'

// Formats an array into a comma seperated value string for downloading/exporting
const formatAsCSV = (inputArray: TaskOutput[]) => {
  const CSV = [
    [
      'Subscriber',
      'Xmit',
      'Dynamo Logs',
      'Addi Logs',
      'Dynamo Count',
      'Addi Count',
      'Count Difference',
      'Identical Logs?',
      'Missing ObservationIds',
    ],

    ...inputArray.map((record) => {
      // prettier-ignore
      const { subscriber, xmit, dynamoLogs, addiLogs, dynamoCount, addiCount, countDiff, identicalLogs, missingObservationIds } = record

      return [
        subscriber,
        xmit,
        `"${JSON.stringify(dynamoLogs).replace(/"/g, '""')}"`,
        addiLogs ? `"${JSON.stringify(addiLogs).replace(/"/g, '""')}"` : 'NULL',
        dynamoCount,
        addiCount,
        countDiff,
        identicalLogs,
        `"${JSON.stringify(missingObservationIds).replace(/"/g, '""')}"`,
      ]
    }),
  ]
    .map((e) => e.join(','))
    .join('\n')

  return CSV
}

export default formatAsCSV
