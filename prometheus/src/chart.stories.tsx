import { Meta, Story } from '@storybook/react/types-6-0';
import { BrowserRouter } from 'react-router-dom';
import { Chart, ChartProps } from './chart';

const mockData = {
  status: 'success',
  data: {
    resultType: 'matrix',
    result: [
      {
        metric: {
          namespace: 'calico-system',
          pod: 'calico-node-sn6kn',
        },
        values: [
          [1698321684.024, '0.011576898572881638'],
          [1698321686.024, '0.011576898572881638'],
          [1698321688.024, '0.011576898572881638'],
          [1698321690.024, '0.011576898572881638'],
          [1698321692.024, '0.011576898572881638'],
          [1698321694.024, '0.011576898572881638'],
          [1698321696.024, '0.011576898572881638'],
          [1698321698.024, '0.011576898572881638'],
          [1698321700.024, '0.011576898572881638'],
          [1698321702.024, '0.011576898572881638'],
          [1698321712.024, '0.011413903337672735'],
          [1698321714.024, '0.011413903337672735'],
          [1698321716.024, '0.011413903337672735'],
          [1698321718.024, '0.011413903337672735'],
          [1698321720.024, '0.011413903337672735'],
          [1698321722.024, '0.011413903337672735'],
          [1698321724.024, '0.011413903337672735'],
          [1698321726.024, '0.011413903337672735'],
          [1698321728.024, '0.011413903337672735'],
          [1698321730.024, '0.011413903337672735'],
          [1698321732.024, '0.011413903337672735'],
          [1698321736.024, '0.005747017029044068'],
          [1698321738.024, '0.006055106127967559'],
          [1698321740.024, '0.00636319522689105'],
          [1698321742.024, '0.00667128432581454'],
          [1698321744.024, '0.006979373424738031'],
          [1698321746.024, '0.009242672967704728'],
          [1698321748.024, '0.009242672967704728'],
          [1698321750.024, '0.009242672967704728'],
          [1698321752.024, '0.009242672967704728'],
          [1698321754.024, '0.009242672967704728'],
          [1698321756.024, '0.009242672967704728'],
          [1698321758.024, '0.009242672967704728'],
          [1698321760.024, '0.009242672967704728'],
          [1698321762.024, '0.006922530985986648'],
          [1698321764.024, '0.010499934087871941'],
          [1698321766.024, '0.010499934087871941'],
          [1698321768.024, '0.010499934087871941'],
          [1698321770.024, '0.010499934087871941'],
          [1698321772.024, '0.01154655255711736'],
          [1698321774.024, '0.01154655255711736'],
          [1698321776.024, '0.01154655255711736'],
          [1698321778.024, '0.01154655255711736'],
          [1698321780.024, '0.01154655255711736'],
          [1698321782.024, '0.01154655255711736'],
          [1698321784.024, '0.01154655255711736'],
          [1698321786.024, '0.01154655255711736'],
          [1698321788.024, '0.01154655255711736'],
          [1698321790.024, '0.01154655255711736'],
          [1698321792.024, '0.01154655255711736'],
          [1698321794.024, '0.01154655255711736'],
          [1698321804.024, '0.011061080210015131'],
          [1698321806.024, '0.011061080210015131'],
          [1698321808.024, '0.011061080210015131'],
          [1698321810.024, '0.011061080210015131'],
          [1698321812.024, '0.011061080210015131'],
          [1698321814.024, '0.011061080210015131'],
          [1698321816.024, '0.011061080210015131'],
          [1698321818.024, '0.011061080210015131'],
          [1698321820.024, '0.011061080210015131'],
          [1698321822.024, '0.011262823930891668'],
          [1698321824.024, '0.00595975688197191'],
          [1698321826.024, '0.006349729522702937'],
          [1698321828.024, '0.006739702163433963'],
          [1698321830.024, '0.007129674804164988'],
          [1698321832.024, '0.007519647444896014'],
          [1698321834.024, '0.007909620085627041'],
          [1698321836.024, '0.008299592726358067'],
          [1698321838.024, '0.008689565367089095'],
          [1698321840.024, '0.006936833333323496'],
          [1698321842.024, '0.006936833333323496'],
          [1698321844.024, '0.008776529265972112'],
          [1698321846.024, '0.008386556625241086'],
          [1698321848.024, '0.00799658398451006'],
          [1698321850.024, '0.007606611343779034'],
          [1698321852.024, '0.007216638703048008'],
          [1698321854.024, '0.006826666062316982'],
          [1698321856.024, '0.010735466966118752'],
          [1698321858.024, '0.010735466966118752'],
          [1698321860.024, '0.010735466966118752'],
          [1698321862.024, '0.010735466966118752'],
          [1698321864.024, '0.01025450311430391'],
          [1698321866.024, '0.01025450311430391'],
          [1698321868.024, '0.01025450311430391'],
          [1698321870.024, '0.01025450311430391'],
          [1698321872.024, '0.01025450311430391'],
          [1698321874.024, '0.01025450311430391'],
          [1698321876.024, '0.01025450311430391'],
          [1698321878.024, '0.01025450311430391'],
          [1698321880.024, '0.01025450311430391'],
          [1698321896.024, '0.01049293869801951'],
          [1698321898.024, '0.01049293869801951'],
          [1698321900.024, '0.01049293869801951'],
          [1698321902.024, '0.01049293869801951'],
          [1698321904.024, '0.01049293869801951'],
          [1698321906.024, '0.01049293869801951'],
          [1698321908.024, '0.01049293869801951'],
          [1698321910.024, '0.01049293869801951'],
          [1698321912.024, '0.01049293869801951'],
          [1698321914.024, '0.010893207586421675'],
          [1698321916.024, '0.006121198150309746'],
          [1698321918.024, '0.006510977869195381'],
          [1698321920.024, '0.006900757588081017'],
          [1698321922.024, '0.0072905373069666515'],
          [1698321924.024, '0.007680317025852287'],
          [1698321926.024, '0.008070096744737923'],
          [1698321928.024, '0.008459876463623561'],
          [1698321930.024, '0.008849656182509198'],
          [1698321932.024, '0.009239435901394833'],
          [1698321934.024, '0.011693391566569074'],
          [1698321936.024, '0.009171029560730404'],
          [1698321938.024, '0.008781249841844769'],
          [1698321940.024, '0.008391470122959132'],
          [1698321942.024, '0.008001690404073496'],
          [1698321944.024, '0.007611910685187862'],
          [1698321946.024, '0.007222130966302224'],
          [1698321948.024, '0.006832351247416589'],
          [1698321950.024, '0.006442571528530953'],
          [1698321952.024, '0.006052791809645318'],
          [1698321954.024, '0.00566301209075968'],
          [1698321956.024, '0.011234572409265455'],
          [1698321958.024, '0.011234572409265457'],
          [1698321960.024, '0.011234572409265457'],
          [1698321962.024, '0.011234572409265457'],
          [1698321964.024, '0.011234572409265457'],
          [1698321966.024, '0.011234572409265457'],
          [1698321968.024, '0.011234572409265457'],
          [1698321970.024, '0.011234572409265457'],
          [1698321972.024, '0.01128801794482673'],
          [1698321974.024, '0.0051907149752231626'],
          [1698321976.024, '0.0055716918720633375'],
          [1698321978.024, '0.005952668768903511'],
          [1698321980.024, '0.006333645665743686'],
          [1698321982.024, '0.00671462256258386'],
          [1698321984.024, '0.007095599459424034'],
          [1698321986.024, '0.007476576356264208'],
          [1698321988.024, '0.0059199999999994665'],
          [1698321990.024, '0.0059199999999994665'],
          [1698321992.024, '0.0059199999999994665'],
          [1698321994.024, '0.0059199999999994665'],
          [1698321996.024, '0.0059199999999994665'],
          [1698321998.024, '0.007586869167899438'],
          [1698322000.024, '0.007205892271059264'],
          [1698322002.024, '0.00682491537421909'],
          [1698322004.024, '0.006443938477378916'],
          [1698322006.024, '0.010222252926200173'],
          [1698322008.024, '0.010222252926200173'],
          [1698322010.024, '0.010222252926200173'],
          [1698322012.024, '0.010222252926200175'],
          [1698322014.024, '0.010222252926200175'],
          [1698322016.024, '0.009688247352240503'],
          [1698322018.024, '0.009688247352240503'],
          [1698322020.024, '0.009688247352240503'],
          [1698322022.024, '0.009688247352240503'],
          [1698322024.024, '0.009688247352240503'],
          [1698322026.024, '0.009688247352240503'],
          [1698322028.024, '0.009688247352240503'],
          [1698322030.024, '0.009688247352240503'],
          [1698322038.024, '0.013043209494948716'],
          [1698322040.024, '0.013043209494948716'],
          [1698322042.024, '0.013043209494948716'],
          [1698322044.024, '0.013043209494948716'],
          [1698322046.024, '0.013043209494948716'],
          [1698322048.024, '0.013043209494948716'],
          [1698322050.024, '0.013043209494948716'],
          [1698322052.024, '0.013043209494948716'],
          [1698322054.024, '0.013043209494948716'],
          [1698322056.024, '0.013043209494948716'],
          [1698322058.024, '0.013043209494948716'],
          [1698322060.024, '0.013043209494948716'],
          [1698322062.024, '0.013043209494948716'],
          [1698322064.024, '0.013043209494948716'],
          [1698322074.024, '0.009525773195888237'],
          [1698322076.024, '0.00952577319588824'],
          [1698322078.024, '0.00952577319588824'],
          [1698322080.024, '0.00952577319588824'],
          [1698322082.024, '0.00952577319588824'],
          [1698322084.024, '0.00952577319588824'],
          [1698322086.024, '0.00952577319588824'],
          [1698322088.024, '0.00952577319588824'],
          [1698322090.024, '0.00952577319588824'],
          [1698322092.024, '0.00952577319588824'],
          [1698322094.024, '0.00952577319588824'],
          [1698322096.024, '0.00952577319588824'],
          [1698322098.024, '0.006370573387029442'],
          [1698322100.024, '0.006712594641282416'],
          [1698322102.024, '0.007054615895535389'],
          [1698322104.024, '0.0073966371497883624'],
          [1698322106.024, '0.007738658404041335'],
          [1698322108.024, '0.010260637627589197'],
          [1698322110.024, '0.010260637627589197'],
          [1698322112.024, '0.010260637627589197'],
          [1698322114.024, '0.010260637627589197'],
          [1698322116.024, '0.010260637627589197'],
          [1698322118.024, '0.010260637627589197'],
          [1698322120.024, '0.010260637627589197'],
          [1698322122.024, '0.010260637627589197'],
          [1698322124.024, '0.007586287935271636'],
          [1698322126.024, '0.007244266681018663'],
          [1698322128.024, '0.00690224542676569'],
          [1698322130.024, '0.006560224172512716'],
          [1698322132.024, '0.011698564109475174'],
          [1698322134.024, '0.012662078865146857'],
          [1698322136.024, '0.012662078865146857'],
          [1698322138.024, '0.012662078865146857'],
          [1698322140.024, '0.012662078865146857'],
          [1698322142.024, '0.012662078865146857'],
          [1698322144.024, '0.012662078865146857'],
          [1698322146.024, '0.012662078865146857'],
          [1698322148.024, '0.012662078865146857'],
          [1698322150.024, '0.012662078865146857'],
          [1698322152.024, '0.012662078865146857'],
          [1698322154.024, '0.012662078865146857'],
          [1698322156.024, '0.011346829679591386'],
          [1698322158.024, '0.005925437091413016'],
          [1698322160.024, '0.006238137440577918'],
          [1698322162.024, '0.006550837789742819'],
          [1698322164.024, '0.006863538138907721'],
          [1698322166.024, '0.009381010474947056'],
          [1698322168.024, '0.009381010474947056'],
          [1698322170.024, '0.009381010474947056'],
          [1698322172.024, '0.009381010474947056'],
          [1698322174.024, '0.009381010474947056'],
          [1698322176.024, '0.009381010474947056'],
          [1698322178.024, '0.009381010474947056'],
          [1698322180.024, '0.009381010474947056'],
          [1698322182.024, '0.007136369193554098'],
          [1698322184.024, '0.006823668844389196'],
          [1698322186.024, '0.006510968495224295'],
          [1698322188.024, '0.006198268146059394'],
          [1698322190.024, '0.010999791865404012'],
          [1698322192.024, '0.012135432652576491'],
          [1698322194.024, '0.012135432652576491'],
          [1698322196.024, '0.012135432652576491'],
          [1698322198.024, '0.012135432652576494'],
          [1698322200.024, '0.012135432652576494'],
          [1698322202.024, '0.012135432652576494'],
          [1698322204.024, '0.012135432652576494'],
          [1698322206.024, '0.012135432652576494'],
          [1698322208.024, '0.012135432652576494'],
          [1698322210.024, '0.012135432652576494'],
          [1698322212.024, '0.012135432652576494'],
          [1698322214.024, '0.012135432652576494'],
          [1698322224.024, '0.012269806297630569'],
          [1698322226.024, '0.012269806297630569'],
          [1698322228.024, '0.012269806297630569'],
          [1698322230.024, '0.012269806297630569'],
          [1698322232.024, '0.012269806297630569'],
          [1698322234.024, '0.012269806297630569'],
          [1698322236.024, '0.012269806297630569'],
          [1698322238.024, '0.012269806297630569'],
          [1698322240.024, '0.012269806297630569'],
          [1698322242.024, '0.012269806297630569'],
          [1698322244.024, '0.012269806297630569'],
          [1698322246.024, '0.012269806297630569'],
          [1698322248.024, '0.012269806297630569'],
          [1698322254.024, '0.010410530344099453'],
          [1698322256.024, '0.010410530344099453'],
          [1698322258.024, '0.010410530344099453'],
          [1698322260.024, '0.010410530344099453'],
          [1698322262.024, '0.010410530344099453'],
          [1698322264.024, '0.010410530344099453'],
          [1698322266.024, '0.010410530344099453'],
          [1698322268.024, '0.010410530344099453'],
          [1698322270.024, '0.010410530344099453'],
          [1698322272.024, '0.010410530344099453'],
          [1698322274.024, '0.010410530344099453'],
          [1698322276.024, '0.010410530344099453'],
          [1698322278.024, '0.010410530344099453'],
          [1698322280.024, '0.010410530344099453'],
          [1698322282.024, '0.010410530344099453'],
        ],
      },
    ],
  },
};

const XTickProps = {
  dataKey: 'timestamp',
};

const YTickProps = {
  domain: ['dataMin', 'auto'],
};

function dataProcessor(response: any): { timestamp: number; y: number }[] {
  const data: { timestamp: number; y: number }[] = [];
  // convert the response to a JSON object
  response['data']['result'][0]['values'].forEach(element => {
    // convert value to a number

    data.push({ timestamp: element[0], y: Number(element[1]) });
  });
  return data;
}

export default {
  title: 'Chart',
  component: Chart,
  decorators: [
    Story => {
      return (
        <BrowserRouter>
          <Story />
        </BrowserRouter>
      );
    },
  ],
} as Meta;

const Template: Story<ChartProps> = () => {
  return (
    <Chart
      plots={[
        {
          query: 'test',
          name: 'cpu (cores)',
          strokeColor: '#7160BB',
          fillColor: '#C2B0FF',
          dataProcessor: dataProcessor,
        },
      ]}
      autoRefresh={false}
      xAxisProps={XTickProps}
      yAxisProps={YTickProps}
      prometheusPrefix="/api/v1/namespaces/test/proxy"
      fetchMetrics={({}) => {
        return Promise.resolve(mockData);
      }}
    />
  );
};

export const Default = Template.bind({});