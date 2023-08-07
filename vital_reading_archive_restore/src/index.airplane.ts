import airplane from "airplane";
import axios from "axios";

export default airplane.task(
  {
    slug: "vital_reading_archive_restore_jb",
    name: "Vital Reading Archive/Restore",
    description:
      "Given a vital reading ID, archive or restore that vital reading in Addi Postgres logs. Github: n/a",
    runtime: "standard",
    parameters: {
      vital_reading_ids: {
        name: "Vital Reading IDs",
        type: "shorttext",
        required: true,
        description:
          "A comma-separated list of vital reading IDs that should be archived or restored.",
      },
      archive_or_restore: {
        name: "Archive or Restore?",
        type: "shorttext",
        required: true,
        options: ["archive", "restore"],
      },
      database: {
        name: "Database",
        type: "shorttext",
        options: [
          { label: "Prod", value: "vitals" },
          { label: "Dev", value: "vitals-dev" },
        ],
        default: "vitals",
        required: true,
      },
    },
  },
  async (params: any) => {
    const mod_choice = params.archive_or_restore;
    const id_array = params.vital_reading_ids.split(",").map((elem: string) => {
      return elem.trim();
    });
    const database = params.database;

    // Axios Call to vitals API
    const axiosCall = async (vitalID: string, mod_choice: string) => {
      const resp = [];
      const output = { vital_id: vitalID, success: false, message: "" };
      try {
        const response = await axios({
          method: "post",
          url: `https://${database}.ecg-api.com/vital-readings/${vitalID}/${mod_choice}`,
          headers: { "x-ecgapi-key": "1234" },
        });

        output.success = true;
        output.message = response.data.message;
      } catch (error: any) {
        // Some response messages are arrays with the message as the first element. Some are just strings
        if (error.response) {
          typeof error.response.data.error.message === "object"
            ? (output.message = error.response.data.error.message[0])
            : (output.message = error.response.data.error.message);
        } else {
          output.message = error.message;
        }
      }
      resp.push(output);
      return resp;
    };

    const responseData = [];

    for (const id of id_array) {
      const result = await axiosCall(id, mod_choice);
      responseData.push(...result);
    }

    return responseData;
  }
);
