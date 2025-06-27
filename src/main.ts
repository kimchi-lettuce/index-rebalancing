import { readData } from "./utils/readData"
import { getAllocationAmount } from "./utils/getAllocationAmount"
import { cancel } from "@clack/prompts"
import assert from "assert"

const DECIMAL_PLACES_OF_WEIGHT = 2

async function main() {
  const { lines, headers, dataRows, entriesSortedByDate } = await readData()
  const initialAllocationAmount = await getAllocationAmount()

  for (const [date, entries] of entriesSortedByDate) {
    console.log(date)

    // Gather market cap and weight for each company
    const totalMarketCapM = entries.reduce(
      (acc, entry) => acc + entry.marketCapM,
      0
    )

    // FIXME: Because of rounding, the sum of the weights may not be 1.0
    const sortedMarketCapAndWeight = entries
      .map((entry) => ({
        marketCapM: entry.marketCapM,
        weight: Number(
          (entry.marketCapM / totalMarketCapM).toFixed(DECIMAL_PLACES_OF_WEIGHT)
        ),
      }))
      .sort((a, b) => b.weight - a.weight)

    let cumulative = 0
    const selectedCompanies: {
      marketCapM: number
      weight: number
      cumulative: number
    }[] = []

    for (const entry of sortedMarketCapAndWeight) {
      cumulative += entry.weight
      selectedCompanies.push({
        ...entry,
        cumulative,
      })
      if (cumulative >= 0.85) break
    }

    console.log({ selectedCompanies })
  }
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
