import { Button, TextInput, Table, useComponentState, Heading, DatePicker, Select, TableState, useTaskQuery } from "@airplane/views";
import airplane from "airplane";
import React, { useState } from 'react'
import './style.css'

const VitalReadingArchive = () => {
  const [showTable, setShowTable] = useState(false)
  const [subID, setSubID] = useState<string>('');
  const [startTime, setStartTime] = useState();
  const [endTime, setEndTime] = useState();
  const [database, setDatabase] = useState<string>('Prod');
  const { id, selectedRows, clearSelection } = useComponentState<TableState>();
  const { output, error, loading, refetch } = useTaskQuery({
    slug: 'fetch_addi_vital_reading_ids_jb',
    enabled: false,
    params: {
      sub_or_xmit: subID, 
      start_time: startTime, 
      end_time: endTime, 
      database:`${database == 'Prod' ? 'postgres_prod_vitals' : 'postgres_dev'}`
    },
    onSuccess: (output) => console.log(output),
    onError: (error) => console.log(error),
  })

  return (
    <>
      <div className="title">
        <Heading color="gray" className="justify-content-center">
          Vital Reading Lookup/Archive Tool
        </Heading>
      </div>
      <section className="form-container">
        <div className="form">
          <TextInput 
            label="Subscriber ID or Xmit:"
            placeholder="Sub ID / Xmit"
            onChange={(e) => setSubID(e.target.value)}
          />
          <DatePicker 
            label="Start date:"
            onChange={(val:any) => setStartTime(val)}
          />
          <DatePicker 
            label="End date:"
            onChange={(val:any) => setEndTime(val)}
          />
          <Select 
            label="Database:"
            data={['Prod', 'Dev']}
            defaultValue={'Prod'}
            onChange={(val:any) => setDatabase(val)}
          />
          <section className="submit-button-container">
            <Button 
              className="button"
              loading={loading} 
              onClick={() => {
                refetch();
                setShowTable(true);
              }}
            >
              Submit
            </Button>
          </section>
        </div>
      </section>
      {showTable && !loading ? (
      <>
      <section className="table-container">
          <Table 
            id={id}
            title="Vital Readings"
            columns={[
              {
                label: "Vital Reading ID",
                accessor: "vital_reading_id"
              },
              {
                label: "Reading",
                accessor: "reading"
              },
              {
                label: "Unit",
                accessor: "unit"
              },
              {
                label: "Time Recorded",
                accessor: "recorded_at"
              },
              {
                label: "Vital Sign ID",
                accessor: "vital_sign_id"
              }
            ]}
            noData="No vital readings were found for that subscriber in that date range."
            rowSelection="checkbox"
            data={loading ? [] : output}
          />
      </section>
      {selectedRows.length > 0 ? (
      <section className="submit-button-container">
        <Button 
          className="button"
          confirm={{
            title: "Confirmation",
            cancelText: "Cancel",
            confirmText: "Archive",
            body: "Are you sure you want to archive the selected vital readings? This will run the following task: vital_reading_archive_restore_jb"
          }}
          task={{
            slug: "vital_reading_archive_restore_jb",
            params: {
              vital_reading_ids: `${selectedRows.map((elem) => elem.vital_reading_id).join()}`,
              archive_or_restore: 'archive',
              database: `${database == 'Prod' ? 'vitals' : 'vitals-dev'}`
            },
            onSuccess:() => {
              clearSelection();
              setShowTable(false);
            },
            onError: (output, error) => console.log(`Output: ${output}, Error: ${error}`)
          }}
        >
          Archive
        </Button>
      </section>
      ) : null}
      </>
      ) : null}
    </>
  );
};

export default airplane.view(
  {
    slug: "vital_reading_archive_tool_jb",
    name: "Vital Reading Lookup/Archive Tool",
  },
  VitalReadingArchive
);
