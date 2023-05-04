import axios from "axios";
import * as fs from 'fs'

interface Transfer {
  transaction_id: number;
  status: string;
  user: string;
  receiver: string;
  token: {
    type: string;
    data: {
      token_id: string;
      id: string;
      token_address: string;
      decimals: number;
      quantity: string;
      quantity_with_fees: string;
    };
  };
  timestamp: string;
}

interface Response {
  result: Transfer[];
  cursor: string;
  remaining: number;
}

let cursor = "";

const pageSize = 300; // page size vary results different amount of missing records
const receiver = "0x7156097c501247ee273bd3283dec088d8c982725"; // sql
const user = "0x450844ab03c3c9aef4e81aa785f6730decc2fa64"; // 150 transfers. 86 difference
const user1 = "0xe2bdfe5008fddd52509edfa11c2e5fec35e41177"; // 2 transfers -- no problem
const user2 = "0x56f735a4d4d027cc4ba856f8a0d89f2244941667"; // 33 transfers -- no problem
const user3 = "0xe03fff2fca9110da676ffa33ee0601bd7093eca7"; //148 transfers. 54 difference
const user4 = "0xf407f3f3900cd9c1f7b5967591c9e415d513a9c0"; //120 transfers. -- no problem
const user5 = "0xd7a7ff2cfab5b22a731447ed08d36b13d433d436"; //123 transfers. -- no problem
const user6 = "0x353d1af0fa732f6230ff4ab0eb2a6a3dcf4c54f2"; //150 transfers. 12 difference
const user7 = "0xcd29d4c97aff99d69cbb2e8d5fa189a103e5ade4"; //130 transfers. -- no problem

async function run() {
  await fetchTransfers(''); // fetch all transfers for receiver 0x7156097c501247ee273bd3283dec088d8c982725
  cursor = ''; // reset cursor
  await fetchTransfers(user3) // filter transfers for the specific user we're testing (returns the true 150 results)
  diff() // run the diff, shows the filtered 150 dont show in the parent set
}

async function fetchTransfers(user: string) {
  try {
    let transfers: Transfer[] = [];

    while (true) {
      let url = `https://api.x.immutable.com/v1/transfers?receiver=${receiver}&page_size=${pageSize}${
        cursor ? "&cursor=" + cursor : ""
      }${user ? "&user=" + user : ""}`;
      const response = await axios.get<Response>(url);
      transfers.push(...response.data.result);
      cursor = response.data.cursor;

      if (!response.data.remaining || response.data.remaining == 0) {
        break;
      }
    }

    if (user == "") {
      fs.writeFileSync("output/transfers.json", JSON.stringify(transfers));
    } else {
      fs.writeFileSync("output/transfers-filtered.json", JSON.stringify(transfers));
    }
    console.log("Transfers saved to file transfers.json");
  } catch (error) {
    console.error(error);
  }
}

function diff() {
  // Read the contents of the two JSON files
  const file1 = fs.readFileSync('./output/transfers.json', 'utf-8');
  const file2 = fs.readFileSync('./output/transfers-filtered.json', 'utf-8');

  // Parse the JSON contents into arrays of objects
  const data1 = JSON.parse(file1);
  const data2 = JSON.parse(file2);

  // Create a set of the transaction IDs in each file
  const ids1 = new Set(data1.map((d: any) => d.transaction_id));
  const ids2 = new Set(data2.map((d: any) => d.transaction_id));

  // Find the differences between the sets of IDs
  const diff1 = new Set([...ids1].filter((x) => !ids2.has(x)));
  const diff2 = new Set([...ids2].filter((x) => !ids1.has(x)));

  console.log(`Count in all transfers = ${ids1.size}`);
  console.log(`Count in filtered transfers = ${ids2.size}`);
  // Output the differences
//   console.log(`IDs in transfers.json but not in transfers-filtered.json (${diff1.size}): ${Array.from(diff1)}`);
  console.log(`IDs in transfers-filtered.json but not in transfers.json (${diff2.size}): ${Array.from(diff2)}`);
}

run()