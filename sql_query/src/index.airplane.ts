import airplane from 'airplane'

export default airplane.task(
  {
    slug: 'sql_database_query_jb',
    name: 'SQL Database Query',
    description:
      'Return output of an SQL query. Query must meet the standards of the DB you are querying (MySQL vs Postgres). Github: n/a',
    runtime: 'standard',
    resources: ['crm_black','crm_black_sandbox', 'orb_prod', 'postgres_dev_webhooks', 'postgres_prod_orgs', 'postgres_prod_vitals', 'postgres_dev', 'postgres_dev_organizations'],
    timeout: 43200,
    parameters: {
      sql_query: {
        name: 'SQL Query',
        type: 'longtext',
        required: true,
        description: "An SQL query on the database of choice.",
      },
      database: {
        name: 'Database',
        type: 'shorttext',
        options: [
          {label:'Postgres Vitals Prod',value:'postgres_prod_vitals'}, 
          {label:'Postgres Orgs Prod',value:'postgres_prod_orgs'},
          {label:'MySQL Orb Prod',value:'postgres_prod_orgs'},
          {label:'Postgres Webhooks Dev',value:'postgres_dev_webhooks'},
          {label:'MySQL CRM Black Sandbox',value:'crm_black_sandbox'},
          {label:'MySQL CRM Black',value:'crm_black'},
          {label:'Postgres Vitals Dev',value:'postgres_dev'},
          {label:'Postgres Orgs Dev',value:'postgres_dev_organizations'},
        ],
        required: true
      }
    },
  },
  async (params) => {
    const sql_query = params.sql_query
    const database = params.database

    const getSqlOutput = await airplane.sql.query(
      `${database}`,
      `${sql_query}`
    )
    const data = getSqlOutput.output.Q1

    return data
  }
)

