import axios from "axios";
import * as fs from 'fs'

interface Trade {
  transaction_id: number;
  status: string;
  a: {
    order_id: number;
    token_type: string;
    token_id: string;
    token_address: string;
    sold: string;
    };
  b: {
    order_id: number;
    token_type: string;
    token_id: string;
    token_address: string;
    sold: string;
    };
  timestamp: string;
}

interface Response {
  result: Trade[];
  cursor: string;
  remaining: number;
}

let cursor = "";
const pageSize = 80; // Just change this page size to observe Console output

async function run() {
  await fetchTrades();
  cursor = ''; // reset cursor
  print();
}

async function fetchTrades() {
  try {
    let trades: Trade[] = [];
    let counter: number = 0;
    while (true) {
      let url = `https://api.x.immutable.com/v3/trades?max_timestamp=2023-08-20T17:00:00Z&min_timestamp=2022-08-20T05:00:00Z&direction=asc&order_by=updated_at&page_size=${pageSize}${cursor ? "&cursor=" + cursor : ""}`;
      const response = await axios.get<Response>(url);
      trades.push(...response.data.result);
      cursor = response.data.cursor;
      counter++;
      if (!response.data.remaining || response.data.remaining == 0) {
        break;
      }
    }

    fs.writeFileSync("output/trades.json", JSON.stringify(trades));
    console.log(`Page size ${pageSize}. Fetched ${counter} times. All Trades saved to file trades.json`);
  } catch (error) {
    console.error(error);
  }
}

function print() {
  // Read the contents of the two JSON files
  const file1 = fs.readFileSync('./output/trades.json', 'utf-8');

  const data1 = JSON.parse(file1);

  const ids1 = new Set(data1.map((d: any) => d.transaction_id));
  console.log(`Count in all trades = ${ids1.size}`);
}

run()