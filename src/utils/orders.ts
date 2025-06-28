import { DECIMAL_PRECISION } from "../main"
import { type PortfolioState } from "./portfolioValue"
import { type WeightedCompany } from "./selectCompanies"

/** Represents a buy or sell order for a specific company */
export type Order = {
  /** The company name for this order */
  company: string
  /** Number of shares to buy or sell */
  numShares: number
  /** The price of the shares */
  sharePrice: number
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
        sharePrice: holding.sharePrice,
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
      const numShares = Math.floor((allocationAmountM * 1_000_000) / sharePrice)
      orders.push({
        company,
        numShares,
        sharePrice,
        action: "buy",
      })
    }
  }

  return orders
}

/**
 * Executes a list of orders by updating the portfolio state
 *
 * Processes buy and sell orders by modifying the share counts and share prices
 * of assets in the portfolio. For buy orders, increases the number of shares
 * held. For sell orders, decreases the number of shares held. Updates the share
 * price to reflect the current market price at the time of the order.
 *
 * @param orders - Array of buy/sell orders to execute
 * @param portfolioState - Current portfolio state to be updated
 */
export function executeOrdersOnPortfolioState(
  orders: Order[],
  portfolioState: PortfolioState
) {
  // TODO: You can add functionality here to actually execute the orders by
  // calling some API to buy and sell the shares through this script

  for (const order of orders) {
    const asset = portfolioState.assets.find(
      (asset) => asset.company === order.company
    )
    if (!asset) {
      // If the asset is not found in the portfolio, it means that it is a new
      // asset. We need to add it to the portfolio.
      if (order.action === "buy") {
        portfolioState.assets.push({
          company: order.company,
          numShares: order.numShares,
          sharePrice: order.sharePrice,
        })
      } else {
        throw new Error(
          `Asset ${order.company} not found in portfolio. Unable to sell shares.`
        )
      }
    } else {
      // Otherwise, if the asset is found in the portfolio, we need to update
      // the number of shares and the share price.
      if (order.action === "buy") {
        asset.numShares += order.numShares
      } else {
        asset.numShares -= order.numShares
      }
      asset.sharePrice = order.sharePrice
    }
  }

  // Update the total value of the portfolio to reflect the new assets
  portfolioState.totalValueM = Number(
    (
      portfolioState.assets.reduce(
        (acc, asset) => acc + asset.numShares * asset.sharePrice,
        0
      ) / 1_000_000
    ).toFixed(DECIMAL_PRECISION)
  )
}
