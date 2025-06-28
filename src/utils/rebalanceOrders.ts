import { type PortfolioState } from "./portfolioValue"
import { type WeightedCompany } from "./selectCompanies"

/** Represents a buy or sell order for a specific company */
type Order = {
  /** The company name for this order */
  company: string
  /** Number of shares to buy or sell */
  numShares: number
  /** The price of the shares */
  sharePrice: number | undefined
  /** Whether this is a buy or sell order */
  action: "buy" | "sell"
}

/**
 * Rebalances a portfolio by determining which assets to keep, sell, and buy
 * based on new allocation targets
 *
 * Analyzes the difference between current holdings and target allocations to
 * generate orders that will rebalance the portfolio. For companies that are no
 * longer in the target allocation, sells all current shares. For companies that
 * remain in the target allocation, calculates the difference between current
 * value and target value to determine buy/sell orders. For new companies in the
 * target allocation, creates buy orders for the full allocation amount.
 *
 * @param currentHoldings - Current portfolio assets with company names and share counts
 * @param newAllocations - Target allocations with company names and allocation amounts
 * @returns Array of orders to execute for rebalancing
 */
export function getRebalanceOrders(
  currentHoldings: PortfolioState["assets"],
  newAllocations: (WeightedCompany & { allocationAmountM: number })[]
): Order[] {
  const orders: Order[] = []

  for (const holding of currentHoldings) {
    const isInNewAllocations = newAllocations.some(
      (allocation) => allocation.company === holding.company
    )

    if (!isInNewAllocations) {
      // Find companies that are in currentHoldings but not in newAllocations. These
      // need to be sold completely
      orders.push({
        company: holding.company,
        numShares: holding.numShares,
        sharePrice: undefined,
        action: "sell",
      })
    } else {
      // Otherwise, if the company is in newAllocations, we need to calculate how
      // many shares to buy or sell to get to the new allocation
      const { allocationAmountM, sharePrice } = newAllocations.find(
        (allocation) => allocation.company === holding.company
      )!

      /** This is the value of how much we current hold in that company */
      const currentHoldingValue = holding.numShares * sharePrice
      /** This is the value of how much we want to hold in that company */
      const newAllocationValue = allocationAmountM * 1_000_000
      /** This is the difference between the current holding value and the new
       * allocation value */
      const difference = newAllocationValue - currentHoldingValue

      // Apply orders to balance out the current holdings to the new allocation
      // value
      orders.push({
        company: holding.company,
        // Round down to the nearest whole number of shares. TODO: Need to think
        // more about this. Is rounding down always the correct thing to do?
        numShares: Math.floor(Math.abs(difference) / sharePrice),
        sharePrice,
        action: difference > 0 ? "buy" : "sell",
      })
    }
  }

  // Finally find the rest that are in newAllocations but not in currentHoldings
  // These need to be bought
  for (const { company, allocationAmountM, sharePrice } of newAllocations) {
    const isInCurrentHoldings = currentHoldings.some(
      (holding) => holding.company === company
    )

    if (!isInCurrentHoldings) {
      orders.push({
        company,
        numShares: Math.floor((allocationAmountM * 1_000_000) / sharePrice),
        sharePrice,
        action: "buy",
      })
    }
  }

  return orders
}
