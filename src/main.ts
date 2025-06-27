import { readData } from "./utils/readData"
import { getAllocationAmount } from "./utils/getAllocationAmount"

async function main() {
  const { lines, headers, dataRows } = await readData()
  const initialAllocationAmount = await getAllocationAmount()

  console.log({ lines, headers, dataRows, initialAllocationAmount })
}

main()

// // Group entries by date
// const groupedByDate = new Map<string, any[]>()

// for (const row of dataRows) {
// 	const values = row.split(',')
// 	const date = values[0]

// 	if (!groupedByDate.has(date)) {
// 		groupedByDate.set(date, [])
// 	}

// 	const entry = {
// 		date: values[0],
// 		company: values[1],
// 		marketCapM: parseFloat(values[2]),
// 		price: parseFloat(values[3])
// 	}

// 	groupedByDate.get(date)!.push(entry)
// }

// Use a for loop to iterate through the files
