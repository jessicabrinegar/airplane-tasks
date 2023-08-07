import airplane from "airplane";

type Body = {
  account: string;
  format: boolean;
}

export default airplane.task(
  {
    slug: "anelto_addi_vital_comparison_jb",
    name: "Anelto Addi Vital Comparison",
    description: 'Fetches vital data from Anelto API and compares it to vital data in vitals Postgres database',
    resources: ['postgres_prod_vitals'],
    parameters: {
      xmit: {
        name: 'Subscriber Xmit',
        type: 'shorttext',
        required: true,
      },
      anelto_username: {
        name: 'Anelto Username',
        type: 'shorttext',
        required: true,
      },
      anelto_password: {
        name: 'Anelto Password',
        type: 'shorttext',
        required: true,
      },
    }
  },
  // This is your task's entrypoint. When your task is executed, this
  // function will be called.
  async (params: any) => {

    const URL = 'https://inhome.anelto.com:12332/telehealth/get';

    const config = {
      method: "POST",
      headers: {
        "Authorization": 'Basic' + btoa(params.anelto_username + ':' + params.anelto_password),
      },
      body: JSON.stringify({
        "account": params.xmit,
        "format": true,
      }),
    }

    const response = await fetch(URL, config);
    const data = await response.json();

    return JSON.parse(data);
  }
);
