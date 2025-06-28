import {
  type PortfolioState,
  computeNewPortfolioState,
} from "./utils/portfolioValue"
import {
  readData,
  getInitialAllocationAmount,
  resetOutputFolder,
} from "./utils/readData"
import { selectCompaniesByMarketCapWeight } from "./utils/selectCompanies"
import { computeCompanyAllocationAmounts } from "./utils/companyAllocations"
import {
  executeOrdersOnPortfolioState,
  getRebalanceOrders,
} from "./utils/orders"
import { generateMarkdownReport } from "./utils/reporting"

/** TODO: Add explanation of why this is 8 */
export const DECIMAL_PRECISION = 8
export const PERCENTILE_OF_COMPANIES_TO_SELECT = 0.85

async function main() {
  await resetOutputFolder()
  const { entriesSortedByDate } = await readData()
  const initialAllocationAmountM = await getInitialAllocationAmount()

  let portfolioState: PortfolioState = {
    date: new Date(),
    assets: [],
    initialAllocationAmountM,
    // Initialise to 0 as the initial allocation is not used yet
    totalValueM: 0,
  }

  // TODO: Rename entriesSortedbyDate
  for (const [date, entries] of entriesSortedByDate) {
    // Note, selecting the companies for the new rebalancing, does not require
    // evaluation of the current value of the portfolio
    const selectedCompanies = selectCompaniesByMarketCapWeight(
      entries,
      PERCENTILE_OF_COMPANIES_TO_SELECT
    )

    // Update the portfolio state with the new total value based on the date's
    // new share prices, and recalculate based on the selected companies weights
    // and the total portfolio value, what the new allocation amounts should be
    portfolioState = computeNewPortfolioState(portfolioState, entries)
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

    // Generate a markdown report
    generateMarkdownReport(
      new Date(date),
      portfolioState,
      selectedCompanies,
      companiesWithAllocations,
      orders
    )

    process.exit(1)
  }
}

main()
