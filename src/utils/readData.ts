import { select, log, cancel, isCancel } from "@clack/prompts"
import { readFileSync, readdirSync } from "fs"
import { join } from "path"

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

    log.step(`File ${selectedFile} read successfully`)
    return { lines, headers, dataRows }
  } catch (err) {
    cancel(`Error reading file ${selectedFile}: ${err}`)
    process.exit(1)
  }
}
