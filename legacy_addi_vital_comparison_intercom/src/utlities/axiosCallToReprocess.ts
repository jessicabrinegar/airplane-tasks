import axios from 'axios'
import axiosRetry from 'axios-retry'
import { AxiosResponse } from '../typings'

type AxiosInput = {
  account: string
  eventcode: string
  event: string
  timestamp: string
  vital: {
    _id: string
    deviceNumber: string
    pulseox?: Record<string, number>
    heartrate?: Record<string, number>
    bloodpressure?: Record<string, number>
    glucose?: Record<string, number>
    blueid: string
  }
}

const axiosCallToReprocess = async (log: AxiosInput, orgID?: string) => {
  const output: AxiosResponse[] = []
  const URL = `https://vitals.ecg-api.com/anelto/vital-observations`
  const CONFIG = {
    headers: {
      'x-ecgapi-key': '1234',
      'Content-Type': 'application/json',
      'Accept-Charset': 'UTF-8',
    },
    data: log,
  }

  // Retry support
  axiosRetry(axios, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
  })

  try {
    const request = await axios.post(URL, CONFIG.data, CONFIG)

    if (request.status === 200 || request.status === 201) {
      output.push({
        didReprocess: true,
        organization: orgID || '',
        log: log,
        reason: `API Call: ${request.status}, Text: ${request.statusText}`,
      })
    } else {
      console.log('Error Call: ', request.statusText)
      output.push({
        didReprocess: false,
        log: log,
        organization: orgID || '',
        reason: `Axios call went through but did not 200. Code: '${request.status}', Error: '${request.statusText}'.`,
      })
    }
  } catch (err) {
    output.push({
      didReprocess: false,
      log: log,
      organization: orgID || '',
      reason: `${await err}. 1) Either the vital measurements such as bloodpressure, glucose etc are invalid (Verify values in object shown to the left) or 2) Subscriber device not found in the system on the ECG reprocess call.`,
    })
  }

  return output
}

export default axiosCallToReprocess
