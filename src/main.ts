import {
  type PortfolioState,
  computeNewPortfolioState,
} from "./utils/portfolioValue"
import { readData, getInitialAllocationAmount } from "./utils/readData"
import { selectCompaniesByMarketCapWeight } from "./utils/selectCompanies"
import { computeCompanyAllocationAmounts } from "./utils/companyAllocations"
import { getRebalanceOrders } from "./utils/rebalanceOrders"

/** TODO: Add explanation of why this is 8 */
export const DECIMAL_PRECISION = 8
const PERCENTILE_OF_COMPANIES_TO_SELECT = 0.85

// TODO: Add the creation of the ./data folder

async function main() {
  const { entriesSortedByDate } = await readData()
  const initialAllocationAmount = await getInitialAllocationAmount()

  let portfolioState: PortfolioState = {
    date: new Date(),
    assets: [],
    initialAllocationAmount,
    // Initialise to 0 as the initial allocation is not used yet
    totalValue: 0,
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
      portfolioState.totalValue
    )

    const rebalanceOrders = getRebalanceOrders(
      portfolioState.assets,
      companiesWithAllocations
    )

    console.log(rebalanceOrders)

    process.exit(1)
  }
}

main()
