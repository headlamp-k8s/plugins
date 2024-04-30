import {
  registerAppBarAction,
  registerResourceTableColumnsProcessor,
  ApiProxy,
} from '@kinvolk/headlamp-plugin/lib';

const request = ApiProxy.request;
// Below are some imports you may want to use.
//   See README.md for links to plugin development documentation.
// import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
// import { K8s } from '@kinvolk/headlamp-plugin/lib/K8s';
// import { Typography } from '@mui/material';

registerAppBarAction(<span>Opencost</span>);

// "/api/v1/namespaces/default/services/my-opencost:http-ui/proxy/model/allocation/compute?window=14d&aggregate=pod&step=1d&accumulate=true
function fetchOpencostData(window: string, resource: string, accumulate: boolean) {
  const url = `/api/v1/namespaces/default/services/my-opencost:http-ui/proxy/model/allocation/compute?window=${window}&aggregate=${resource}&step=1d&accumulate=${accumulate}`;

  return request(url).then(data => {
    console.log('got a call', data);
    return data;
  });
}

registerResourceTableColumnsProcessor(async function processor({ id, columns }) {
  if (id === 'headlamp-pods') {
    console.log('open-cost plugin processor called', id, columns);
    const data = await fetchOpencostData('14d', 'pod', true);
    console.log('data', data);
    columns.push({
      id: 'opencost',
      label: 'Opencost',
      getter: () => {
        // console.log('pod', pod, data.data[0]);
        return 'test';
      },
      show: true,
    });
  }
  return columns;
});
