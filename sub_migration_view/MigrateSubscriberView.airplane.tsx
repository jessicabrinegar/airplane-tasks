import { Callout, Stack, Text, Link, Button, TextInput, Table, useComponentState, Heading, Select, TableState, useTaskQuery } from "@airplane/views";
import airplane from "airplane";
import React, { useState } from 'react';


const MigrateSubscriberView = () => {
  const [showTable, setShowTable] = useState(false)
  const [xmit, setXmit] = useState<string>('');
  const [params, setParams] = useState({});
  const { id, selectedRows, clearSelection } = useComponentState<TableState>();

  const { output, error, loading, refetch } = useTaskQuery({
    slug: 'legacy_subscriber_migration',
    enabled: false,
    params: {
      source_id: null,
      organization_id: null,
      contract_id: null,
      source_anelto_username: null,
      source_anelto_password: null,
      dest_anelto_username: null,
      dest_anelto_password: null,
    },
    onSuccess: (output) => console.log(output),
    onError: (error) => console.log(error),
  })

  return (
    <>
    <div className="title">
      <Heading color="gray" className="justify-content-center">
        Migration Information Station
      </Heading>
    </div>
    <section className="form-container">
      <div className="form">
        <TextInput 
          label="Xmit:"
          placeholder="Xmit"
          onChange={(e) => setXmit(e.target.value)}
        />
      </div>
    </section>
    <section className="submit-button-container">
      <Button 
        className="button"
        loading={loading} 
        task={{
          slug: "sub_migration_params_jb",
          params: {
            xmit: xmit,
          },
          onSuccess:() => {
            setShowTable(true);
          },
          onError: (output, error) => console.log(`Output: ${output}, Error: ${error}`)
        }}
      >
        Submit
      </Button>
    </section>
    {showTable ? (
      <section className="table-container">
          <Table 
            id={id}
            title="Migration Params"
            columns={[
              {
                label: "Source ID",
                accessor: "source_id"
              },
              {
                label: "Org ID",
                accessor: "organization_id"
              },
              {
                label: "Contract ID",
                accessor: "contract_id"
              },
              {
                label: "Source Username",
                accessor: "source_anelto_username"
              },
              {
                label: "Source Password",
                accessor: "source_anelto_password"
              },
              {
                label: "Dest. Username",
                accessor: "dest_anelto_username"
              },
              {
                label: "Dest. Password",
                accessor: "dest_anelto_password"
              }
            ]}
            noData="No vital readings were found for that subscriber in that date range."
            rowSelection="checkbox"
            data={loading ? [] : output}
          />
      </section>
    ) : null}
    </>
  );
};

export default airplane.view(
  {
    slug: "migrate_subscriber_view",
    name: "migrate-subscriber-view",
    description: "This view provides data that can be passed to the Legacy Subscriber Migration runbook by simply providing an XMIT.",
  },
  MigrateSubscriberView
);
