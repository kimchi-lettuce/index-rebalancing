import { DECIMAL_PRECISION } from "../main"
import { type DayStanding } from "./readData"

/** Represents a company with its market data and calculated weights for
 * portfolio allocation */
export type WeightedCompany = {
  /** The date of the market data entry */
  date: Date
  /** The company name */
  company: string
  /** The share price in dollars */
  sharePrice: number
  /** Market capitalization in millions (M) of dollars */
  marketCapM: number
  /** The weight of this company within the selected universe (0-1) */
  weight: number
  /** The cumulative weight up to this company in the sorted list */
  cumulative: number
}

/**
 * Selects companies up to the 85th percentile by market cap weight
 * @param entriesForDay - Array of company entries for a specific date
 * @returns Array of selected companies with their market cap, weight, and
 * cumulative weight
 */
export function selectCompaniesByMarketCapWeight(
  entriesForDay: DayStanding[],
  percentile: number
) {
  const totalMarketCapOfUniverse = entriesForDay.reduce(
    (acc, entry) => acc + entry.marketCapM,
    0
  )

  // Gather market cap and weight for each company. Note, because of rounding,
  // the sum of the weights will not be exactly 1.0. TODO: Investigate rounding
  // considerations further
  const sortedMarketCapAndWeight = entriesForDay
    .map((entry) => ({
      ...entry,
      weight: Number(
        (entry.marketCapM / totalMarketCapOfUniverse).toFixed(DECIMAL_PRECISION)
      ),
    }))
    .sort((a, b) => b.weight - a.weight)

  let cumulative = 0
  const selectedCompanies: WeightedCompany[] = []

  // Only return the companies that are above the 85th percentile
  for (const entry of sortedMarketCapAndWeight) {
    cumulative += entry.weight
    selectedCompanies.push({
      ...entry,
      cumulative: Number(cumulative.toFixed(DECIMAL_PRECISION)),
    })
    if (cumulative >= percentile) break
  }

  return selectedCompanies
}
