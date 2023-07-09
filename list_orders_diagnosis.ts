import axios from "axios";
import * as fs from 'fs'

interface Order {
  order_id: number;
  status: string;
  timestamp: string;
  updated_timestamp: string;
  maker_taker_type: string;
}

interface Response {
  result: Order[];
  cursor: string;
  remaining: number;
}

let cursor = "";
const pageSize = 80; // Just change this page size to observe Console output

async function run() {
  await fetchOrders();
  cursor = ''; // reset cursor
  print();
}

async function fetchOrders() {
  try {
    let orders: Order[] = [];
    let counter: number = 0;
    while (true) {
      let url = `https://api.x.immutable.com/v3/orders?status=active&sell_token_type=ERC721&order_by=updated_at&page_size=75&min_timestamp=2023-05-04T01:33:58.193924Z&page_size=${pageSize}${cursor ? "&cursor=" + cursor : ""}`;
      const response = await axios.get<Response>(url);
      orders.push(...response.data.result);
      cursor = response.data.cursor;
      counter++;
      if (!response.data.remaining || response.data.remaining == 0) {
        break;
      }
    }

    fs.writeFileSync("output/orders.json", JSON.stringify(orders));
    console.log(`Page size ${pageSize}. Fetched ${counter} times. All Orders saved to file orders.json`);
  } catch (error) {
    console.error(error);
  }
}

function print() {
  // Read the contents of the two JSON files
  const file1 = fs.readFileSync('./output/orders.json', 'utf-8');

  const data1 = JSON.parse(file1);

  const ids1 = new Set(data1.map((d: any) => d.order_id));
  console.log(`Count in all orders = ${ids1.size}`);
}

run()