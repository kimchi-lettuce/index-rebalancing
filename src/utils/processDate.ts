export function test() {
  // Gather market cap and weight for each company
  const totalMarketCapM = entries.reduce(
    (acc, entry) => acc + entry.marketCapM,
    0
  )

  // FIXME: Because of rounding, the sum of the weights may not be 1.0
  const sortedMarketCapAndWeight = entries
    .map((entry) => ({
      marketCapM: entry.marketCapM,
      weight: Number(
        (entry.marketCapM / totalMarketCapM).toFixed(DECIMAL_PLACES_OF_WEIGHT)
      ),
    }))
    .sort((a, b) => b.weight - a.weight)

  let cumulative = 0
  const selectedCompanies: {
    marketCapM: number
    weight: number
    cumulative: number
  }[] = []

  for (const entry of sortedMarketCapAndWeight) {
    cumulative += entry.weight
    selectedCompanies.push({
      ...entry,
      cumulative,
    })
    if (cumulative >= 0.85) break
  }
}
