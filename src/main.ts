import { readData } from "./utils/readData"
import { text } from "@clack/prompts"

async function main() {
  const { lines, headers, dataRows } = await readData()

  // Choose initial allocation amount
  const initialAllocationAmount = await text({
    message: "Enter the initial allocation amount (in millions):",
    placeholder: "100",
    initialValue: "100",
  })
  console.log({ lines, headers, dataRows })
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
