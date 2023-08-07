import airplane from 'airplane'

export default airplane.task(
  {
    slug: 'fetch_archived_vitals_jb',
    name: 'Fetch Archived Vitals',
    description:
      'Given a SubscriberID or Xmit, list the vitals that have been archived. Github: n/a',
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
    const sub_id = params.sub_or_xmit
    const database = params.database

    const getArchivedVitalReadings = await airplane.sql.query(
      `${database}`,
      `SELECT new_value::json->>'id' AS vital_reading_id, new_value::json->>'vitalSign' AS vital_sign_id, 
      new_value::json->>'reading' AS reading, new_value::json->>'unit' AS unit,
      new_value::json->>'recordedAt' AS recorded_at
      FROM audit."audit-trail" at2 
      WHERE entity_name = 'vital-reading'
      AND new_value::json->>'subscriberId' = ${
        isSubscriberEntered
          ? `'${sub_id}'`
          : `(SELECT subscriber_id::text FROM vital.vital_reading vr WHERE metadata ->> 'account' = '${sub_id}' LIMIT 1)`
      }
      AND new_value::json->>'id' NOT IN (
        SELECT id::text FROM vital.vital_reading vr 
        WHERE ${
          isSubscriberEntered
            ? `subscriber_id = '${sub_id}'`
            : `metadata ->> 'account' = '${sub_id}'`
        }
      )`
    )

    const vitalData = getArchivedVitalReadings.output.Q1

    return vitalData
  }
)
