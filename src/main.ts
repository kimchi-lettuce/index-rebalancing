import {
  type PortfolioState,
  computeNewPortfolioState,
} from "./utils/portfolioValue"
import { readData, getInitialAllocationAmount } from "./utils/readData"
import { selectCompaniesByMarketCapWeight } from "./utils/selectCompanies"

export const DECIMAL_PRECISION = 8

// TODO: Add the creation of the ./data folder

async function main() {
  const { entriesSortedByDate } = await readData()
  const initialAllocationAmount = await getInitialAllocationAmount()

  let portfolioState: PortfolioState = {
    date: new Date(),
    assets: [],
    initialAllocationAmount,
    totalValue: 0
  }

  for (const [idx, [date, entries]] of entriesSortedByDate.entries()) {
    // Note, selecting the companies for the new rebalancing, does not require
    // evaluation of the current value of the portfolio
    const selectedCompanies = selectCompaniesByMarketCapWeight(entries, 0.85)

    // FIXME: 2. Allocation. Pass in the value of the portfolio/the initial allocation
    //    amount, and then determine how much to allocate to each company.
    portfolioState = computeNewPortfolioState(portfolioState, entries)
    computeCompanyAllocationAmounts(selectedCompanies, portfolioState.totalValue)

    // 3. Buy. Calculate the difference and rebalance the portfolio

    //     // TODO: Get the current value of the portfolio

    console.log({ date })
    // For the first date, generate the report that informs how much of each
    // company to buy using the initial allocation amount
    if (idx === 0) {
      const totalSelectedWeight = selectedCompanies.reduce(
        (acc, company) => acc + company.weight,
        0
      )

      // Filter out the no longer needed cumulative weight
      const allocationAmounts = selectedCompanies.map(
        ({ cumulative, ...rest }) => ({
          ...rest,
          allocationAmount: Number(
            (
              (rest.weight / totalSelectedWeight) *
              initialAllocationAmount
            ).toFixed(ALLOCATION_AMOUNT_DECIMAL_PLACES)
          ),
        })
      )
      console.log(allocationAmounts)
    }
  }
}

main()

// TODO:
