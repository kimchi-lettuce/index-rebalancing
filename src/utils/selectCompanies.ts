import { DECIMAL_PRECISION } from "../main"
import { type DayStanding } from "./readData"

export type WeightedCompany = {
  date: Date
  company: string
  sharePrice: number
  marketCapM: number
  weight: number
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

  // Gather market cap and weight for each company. FIXME: Because of rounding,
  // the sum of the weights may not be 1.0
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
