import { DECIMAL_PRECISION } from "../main"
import { type DayStanding } from "./readData"

/** Represents the current state of a portfolio including its assets and total
 * value */
export type PortfolioState = {
  /** The date this portfolio state represents */
  date: Date | null
  /** Array of assets held in the portfolio with company name and number of
   * shares */
  assets: { company: string; numShares: number; sharePrice: number }[]
  /** Initial allocation amount, null after first use */
  initialAllocationAmountM: number | null
  /** Total current value of the portfolio */
  totalValueM: number
}

/**
 * Computes the new portfolio state based on current market prices
 *
 * For the initial state (when assets array is empty), sets the total value to
 * the initial allocation amount and marks the initial allocation as used. For
 * subsequent states, calculates the total value by multiplying each asset's
 * shares by current market prices.
 *
 * @param date - The date for the new portfolio state
 * @param portfolioState - Current portfolio state
 * @param entriesForDay - Market data for the current day including prices
 * @returns Updated portfolio state with new total value
 */
export function computeNewPortfolioState(
  date: Date,
  portfolioState: PortfolioState,
  entriesForDay: DayStanding[]
): PortfolioState {
  const { assets, initialAllocationAmountM } = portfolioState

  // For initial state with no assets, use the initial allocation amount as
  // total value
  if (!assets.length && initialAllocationAmountM) {
    return {
      ...portfolioState,
      date,
      initialAllocationAmountM: null,
      totalValueM: initialAllocationAmountM,
    }
  }

  // Calculate new total value by multiplying each asset's shares by current
  // market prices
  const newTotalValueM = entriesForDay.reduce((acc, entry) => {
    const asset = assets.find((asset) => asset.company === entry.company)
    if (!asset) return acc
    return acc + asset.numShares * entry.sharePrice
  }, 0)

  return {
    ...portfolioState,
    date,
    totalValueM: Number(
      (newTotalValueM / 1_000_000).toFixed(DECIMAL_PRECISION)
    ),
  }
}
