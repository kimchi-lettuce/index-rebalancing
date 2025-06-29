# Index Rebalance Technical Assessment

This project is a solution to a technical assessment that involves creating a script to construct and rebalance a market cap-weighted index fund. The script reads financial data from a CSV file, selects companies based on a market cap percentile, and generates daily rebalancing reports.

The original problem description can be found in `notes/Questions.md`.

## ✨ Features

*   **Interactive CLI**: Uses `@clack/prompts` for a user-friendly experience when selecting files and confirming actions.
*   **Detailed Reporting**: Generates a detailed Markdown report for each rebalancing date in the `./output` folder.
*   **Modular Codebase**: The source code in `src/utils` is organized by feature (data reading, company selection, order generation, etc.) for clarity and maintainability.
*   **Unit Tested**: Core logic is verified with unit tests using `vitest`.

## 📂 Folder Structure

```
.
├── data/              # Place input CSV files here
├── notes/             # Contains the original assessment questions
├── output/            # Generated Markdown reports are saved here
├── src/               # Main source code
│   ├── utils/         # Core logic modules
│   └── main.ts        # Main script entry point
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/en/) (v18 or newer recommended)
*   npm (comes with Node.js)

### Setup

1.  Clone the repository.
2.  Install the dependencies using npm:
    ```sh
    npm install
    ```

### Running the Script

1.  Place your market capitalisation data file (e.g., `market_capitalisation.csv`) inside the `./data` folder. The script will automatically detect and let you choose from any CSV files present in this directory.
2.  Run the script using the following npm command:
    ```sh
    npm start
    ```
3.  Follow the interactive prompts to:
    *   Confirm the deletion of the `./output` folder to ensure a fresh start.
    *   Select the CSV data file to process.
    *   Enter the initial allocation amount for the fund (in millions).

The script will then process the data for each date and generate rebalancing reports in the `./output` folder.

### Running Tests

To run the unit tests, use the following command:

```sh
npm test
```

## 🧠 Implementation Details & Design Choices

### Core Logic

The script processes the data chronologically, performing the following steps for each date:
1.  **Selects Companies**: Filters the top companies that make up 85% of the total market capitalisation.
2.  **Calculates Portfolio Value**: Updates the total value of the current holdings based on the new day's share prices.
3.  **Determines Allocations**: Calculates the target dollar allocation for each selected company based on its weight.
4.  **Generates Orders**: Compares the current holdings against the new targets to create a list of buy and sell orders.
5.  **Executes Orders**: Updates the portfolio state by applying the generated orders.
6.  **Generates a Report**: Creates a comprehensive Markdown report detailing all the steps above.

### Rounding Strategy for the Fund

To ensure the fund never needs to inject additional cash during rebalancing, a conservative rounding strategy is used for all trades:

*   **Buy Orders**: The number of shares to buy is always rounded **down** (`Math.floor`). This ensures the cost of a purchase never exceeds its target allocation.
*   **Sell Orders**: The number of shares to sell is always rounded **up** (`Math.ceil`). This ensures the cash generated from a sale is always enough to cover the value being divested.

This strategy guarantees that the fund is self-sufficient. A small amount of cash is often left over after rebalancing, which is tracked in the reports.

### Rebalancing Net Cash Flow

In each report's summary, you will find a "Rebalancing Net Cash Flow" line. This value represents the liquid cash that remains after all buy and sell orders have been executed. It is a direct result of the rounding strategy and confirms that the rebalancing did not require external funding. This residual cash (typically a small amount, e.g., ~$30 on a $100M+ portfolio) for now is listed to exit the fund. **But an interesting thought would be to keep it as cash under the portfolio, and use it in the next rebalance, so that way money never truly leaves the fund**

### Numerical Precision

To maintain accuracy in financial calculations, all floating-point arithmetic uses a consistent precision of 8 decimal places. This is because we are dealing with values in the millions, and to ensure a nearest cent rounding, we need a precision of 8 decimal places when handling values in the millions.

## 📝 Data Considerations & Assumptions

### The Importance of the 'Price' Column

The original task description (`notes/Questions.md`) lists the columns as `Date`, `Company`, and `Market Cap`. However, to accurately rebalance a portfolio and calculate the value of existing holdings, the **share price** is essential. This implementation assumes the provided CSV data includes a `price` column.

Without share price, it's impossible to:
*   Calculate the number of shares to buy or sell for a given dollar allocation.
*   Determine the current value of the shares already held in the portfolio.

Market cap alone is insufficient because a change in market cap can be caused by a change in share price, a change in the number of shares outstanding (due to issuance or buybacks), or both. To value a holding of *N* shares, one must know the current price per share.

## 💡 Future Improvements

### Enhanced Data Validation

While the script currently uses `zod` for basic type validation of the input CSV data, this could be significantly improved. The current schema is quite permissive because it validates the data *after* some fields have already been parsed with `parseFloat`.

```typescript
// Current rudimentary schema in src/utils/readData.ts
const rowSchema = z.object({
  date: z.string(),
  company: z.string(),
  marketCapM: z.number(),
  price: z.number(),
})
```

A more robust approach would be to validate the raw string values from the CSV directly before any parsing. This would catch a wider range of formatting errors at the source.

Here is an example of an improved schema using regular expressions and `zod` transformations:

```typescript
const robustRowSchema = z.object({
  // Validate raw string 'date' is in DD/MM/YYYY format
  date: z.string().regex(/^\d{1,2}\/\d{1,2}\/\d{4}$/, {
    message: "Date must be in DD/MM/YYYY format",
  }),
  // Validate raw string 'price' and transform
  price: z.string()
    .regex(/^\d+(\.\d+)?$/, {
      message: "Price must be a valid positive number string",
    })
    .transform(val => parseFloat(val))
    .pipe(z.number().positive()),
    ...
});
```
This enhanced schema, combined with unit tests for various valid and invalid data formats, would make the data ingestion process much more resilient and prevent bad data from propagating into the financial calculations.
