import airplane from 'airplane'
import dayjs from 'dayjs'

export default airplane.task(
  {
    slug: 'fetch_addi_vital_reading_ids_jb',
    name: 'Fetch Addi Vital Reading IDs (By Sub ID or Xmit)',
    description:
      'Given an Addi Subscriber ID / Xmit and timeframe, list the vital reading IDs. Github: n/a',
    runtime: 'standard',
    resources: ['postgres_dev', 'postgres_prod_vitals'],
    timeout: 43200,
    parameters: {
      sub_or_xmit: {
        name: 'SubID / Xmit',
        type: 'shorttext',
        required: true,
        description: "The subscriber's UUID or Xmit.",
      },
      start_time: {
        name: 'Start Time',
        type: 'datetime',
        required: true,
      },
      end_time: {
        name: 'End Time',
        type: 'datetime',
        required: true,
      },
      database: {
        name: 'Database',
        type: 'shorttext',
        options: [
          { label: 'Prod', value: 'postgres_prod_vitals' },
          { label: 'Dev', value: 'postgres_dev' },
        ],
        default: 'postgres_prod_vitals',
        required: true,
      },
    },
  },
  async (params) => {
    const isSubscriberEntered = params.sub_or_xmit.includes('-')
    const startDate = dayjs(params.start_time).format('YYYY-MM-DD 00:00:00.000')
    const endDate = dayjs(params.end_time).format('YYYY-MM-DD 23:59:59.999')
    const sub_id = params.sub_or_xmit
    const database = params.database

    const getVitalReadings = await airplane.sql.query(
      `${database}`,
      `SELECT id AS vital_reading_id, reading, metadata ->> 'unit' AS unit,
      recorded_at, vital_sign_id FROM vital.vital_reading 
      WHERE ${
        isSubscriberEntered
          ? `subscriber_id  = '${sub_id}'`
          : `metadata ->> 'account' = '${sub_id}'`
      } AND recorded_at BETWEEN '${startDate}' 
      AND '${endDate}'`
    )
    const vitalData = getVitalReadings.output.Q1

    return vitalData
  }
)
