import _ from 'lodash';
import Alpaca from '@alpacahq/alpaca-trade-api';
import Backtest from '@kendelchopp/alpaca-js-backtesting';
import TechnicalIndicators from 'technicalindicators';
const { SMA } = TechnicalIndicators;

const alpaca = new Alpaca({
  keyId: process.env.API_KEY,
  secretKey: process.env.SECRET_API_KEY,
  paper: true,
  usePolygon: false
});

const backtest = new Backtest({
  alpaca,
  startDate: new Date(2020, 6, 1),
  endDate: new Date(2020, 10, 1)
});

let sma20, sma50;
let lastOrder = 'SELL';

async function initializeAverages() {
  const initialData = await alpaca.getBars(
    '1Min',
    'SPY',
    {
      limit: 50,
      until: new Date()
    }
  );

  const closeValues = _.map(initialData.SPY, (bar) => bar.closePrice);

  sma20 = new SMA({ period: 20, values: closeValues });
  sma50 = new SMA({ period: 50, values: closeValues });

  console.log(`sma20: ${sma20.getResult()}`);
  console.log(`sma50: ${sma50.getResult()}`);
}

//initializeAverages();

sma20 = new SMA({ period: 20, values: [] });
sma50 = new SMA({ period: 50, values: [] });

//const client = alpaca.data_ws;
const client = backtest.data_ws;

client.onConnect(() => {
  client.subscribe(['AM.SPY']);
  //setTimeout(() => client.disconnect(), 6000*1000);
});

client.onStockAggMin((subject, data) => {
  const nextValue = JSON.parse(data)[0].closePrice;

  const next20 = sma20.nextValue(nextValue);
  const next50 = sma50.nextValue(nextValue);
  //
  // console.log(`next20: ${next20}`);
  // console.log(`next50: ${next50}`);

  if (next20 > next50 && lastOrder !== 'BUY') {
    backtest.createOrder({
      symbol: 'SPY',
      qty: 30,
      side: 'buy',
      type: 'market',
      time_in_force: 'day'
    });

    lastOrder = 'BUY';
  } else if (next20 < next50 && lastOrder !== 'SELL') {
    backtest.createOrder({
      symbol: 'SPY',
      qty: 30,
      side: 'sell',
      type: 'market',
      time_in_force: 'day'
    });

    lastOrder = 'SELL';
  }
});

client.onDisconnect(() => {
  console.log(backtest.getStats());
});

client.connect();
