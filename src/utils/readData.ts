import { select, log, cancel, isCancel, text } from "@clack/prompts"
import { readFileSync, readdirSync } from "fs"
import { join } from "path"
import { z } from "zod"

export type DayStanding = {
  date: Date
  company: string
  /** TODO: Add docs about how M stands for in millions */
  marketCapM: number
  sharePrice: number
}

/**
 * Reads and parses a CSV file containing market capitalisation data
 *
 * Prompts the user to select a CSV file from the `./data` directory, reads the
 * file, and returns the parsed content including headers and data rows.
 *
 * @returns Object containing the parsed CSV data with lines, headers, and
 * dataRows
 */
export async function readData() {
  // Read all files in the data directory
  const files = readdirSync("./data")
  const csvFiles = files.filter((file) => file.toLowerCase().endsWith(".csv"))

  if (csvFiles.length === 0) {
    cancel(
      "No CSV files found in the ./data directory. To use the index rebalance tool, please place the market capitalisation CSV files in the ./data directory."
    )
    process.exit(1)
  }

  const selectedFile = await select({
    message: "Select a market capitalisation data file to process:",
    options: csvFiles.map((file) => ({
      value: file,
      label: file,
    })),
  })

  if (isCancel(selectedFile)) {
    cancel("No file selected. Exiting.")
    process.exit(0)
  }

  try {
    const filePath = join("./data", selectedFile)
    const fileContent = readFileSync(filePath, "utf-8")

    // Parse CSV content and collect all unique dates
    const lines = fileContent.split("\n").filter((line) => line.trim())
    const headers = lines[0].split(",")
    const dataRows = lines.slice(1)

    // Validate that the data is in the correct format. First by checking that the
    // headers of the csv file are correct.
    const expectedHeaders = ["date", "company", "market_cap_m", "price"]
    const headerMatching = headers.map(
      (header, idx) =>
        header.trim().toLowerCase() ===
        expectedHeaders[idx].trim().toLowerCase()
    )

    if (headerMatching.some((match) => !match)) {
      cancel(
        `Invalid headers. Expected: ${expectedHeaders.join(
          ", "
        )}. Got: ${headers.join(", ")}`
      )
      process.exit(1)
    }

    // TODO: This should be improved by being more strict on the checks for the
    // date, marketCapM and price fields. It could be good to use the index of
    // the for loop to log out exactly which line of the csv file is invalid.

    // TODO: Would also be good to lowercase all the company names, and to trim,
    // to ensure that they are unique identifiers

    // Zod schema for a row
    const rowSchema = z.object({
      date: z.string(),
      company: z.string(),
      marketCapM: z.number(),
      price: z.number(),
    })

    // Group the data by date, and parse them into objects
    const groupedByDate = new Map<string, DayStanding[]>()

    for (const row of dataRows) {
      const values = row.split(",")
      const date = values[0]
      const company = values[1]
      const marketCapM = parseFloat(values[2])
      const price = parseFloat(values[3])

      const parsed = rowSchema.safeParse({ date, company, marketCapM, price })
      if (!parsed.success) {
        cancel(
          `Invalid row: ${JSON.stringify({
            date,
            company,
            marketCapM,
            price,
          })}\n${parsed.error}`
        )
        process.exit(1)
      }

      // Create entry for date if it doesn't exist
      if (!groupedByDate.has(date)) groupedByDate.set(date, [])

      const { date: dateStr, price: sharePrice, ...rest } = parsed.data
      groupedByDate.get(date)!.push({
        ...rest,
        date: new Date(dateStr),
        sharePrice,
      })
    }

    // Sort the entries by date
    const entriesSortedByDate = Array.from(groupedByDate.entries()).sort(
      ([dateStrA], [dateStrB]) => {
        const dateA = new Date(dateStrA)
        const dateB = new Date(dateStrB)
        return dateA.getTime() - dateB.getTime()
      }
    )

    log.step(`File ${selectedFile} read successfully`)
    return { entriesSortedByDate }
  } catch (err) {
    cancel(`Error reading file ${selectedFile}: ${err}`)
    process.exit(1)
  }
}

// The user should enter a positive, finite number in millions for the
// allocation amount
const allocationAmountSchema = z
  .string()
  .regex(/^\d+(\.\d+)?$/, "Must be a valid positive number")
  .transform((val) => parseFloat(val))
  .pipe(z.number().positive().finite())

/** TODO: Add documentation */
export async function getInitialAllocationAmount() {
  // Choose initial allocation amount
  const allocationAmountInput = await text({
    message: "Enter the initial allocation amount (in millions):",
    placeholder: "100",
    initialValue: "100",
  })

  if (isCancel(allocationAmountInput)) {
    cancel("No allocation amount entered. Exiting.")
    process.exit(0)
  }

  // Validate and parse the allocation amount
  const validationResult = allocationAmountSchema.safeParse(
    allocationAmountInput
  )

  if (!validationResult.success) {
    cancel(
      `Invalid allocation amount: ${validationResult.error.errors[0].message}`
    )
    process.exit(1)
  }

  return validationResult.data
}
