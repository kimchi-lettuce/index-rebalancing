import { computeCompanyAllocationAmounts } from "./utils/companyAllocations"
import { parseDateDDMMYYYY } from "./utils/helpers"
import {
  executeOrdersOnPortfolioState,
  getRebalanceOrders,
} from "./utils/orders"
import {
  type PortfolioState,
  computeNewPortfolioState,
} from "./utils/portfolioValue"
import {
  getInitialAllocationAmount,
  readData,
  resetOutputFolder,
} from "./utils/readData"
import { generateMarkdownReport } from "./utils/reporting"
import { selectCompaniesByMarketCapWeight } from "./utils/selectCompanies"

/** Because we are dealing in the millions, we want to round to the nearest
 * cent. We then use this precision for all floating point calculations */
export const DECIMAL_PRECISION = 8
/** Controls the percentile of companies to select from the universe of
 * companies to make up the market cap weighted portfolio */
export const PERCENTILE_OF_COMPANIES_TO_SELECT = 0.85

async function main() {
  await resetOutputFolder()
  const { entriesSortedByDate } = await readData()
  const initialAllocationAmountM = await getInitialAllocationAmount()

  let portfolioState: PortfolioState = {
    date: null,
    assets: [],
    initialAllocationAmountM,
    // Initialise to 0 as the initial allocation is not used yet
    totalValueM: 0,
  }

  // FIXME: Add one unit test
  // FIXME: Add explanation in README.md

  // TODO: Rename entriesSortedbyDate to a better variable name

  // Loop through each date, calculating the new allocations, and generating the
  // orders to rebalance the portfolio
  for (const [dateStr, entries] of entriesSortedByDate) {
    const date = parseDateDDMMYYYY(dateStr)
    /** Create a copy of the portfolio state, so we can use it to track the
     * previous portfolio state */
    const prevPortfolioState = JSON.parse(JSON.stringify(portfolioState))

    // Note, selecting the companies for the new rebalancing, can be done with
    // only the entries for the date, and has no need to know the current
    // portfolio state
    const selectedCompanies = selectCompaniesByMarketCapWeight(
      entries,
      PERCENTILE_OF_COMPANIES_TO_SELECT
    )

    // Update the portfolio state with the new total value based on the date's
    // new share prices, and recalculate based on the selected companies weights
    // and the total portfolio value, what the new allocation amounts should be
    portfolioState = computeNewPortfolioState(date, portfolioState, entries)
    const companiesWithAllocations = computeCompanyAllocationAmounts(
      selectedCompanies,
      portfolioState.totalValueM
    )

    // Based on the current holdings, and the calculations for the new
    // allocations of holdings, generate the list of orders to rebalance the
    // portfolio
    const orders = getRebalanceOrders(
      portfolioState.assets,
      companiesWithAllocations
    )

    // Execute the orders
    executeOrdersOnPortfolioState(orders, portfolioState)

    // Generate a markdown report for each date
    generateMarkdownReport(
      date,
      prevPortfolioState,
      portfolioState,
      selectedCompanies,
      companiesWithAllocations,
      orders
    )
  }
}

main()
