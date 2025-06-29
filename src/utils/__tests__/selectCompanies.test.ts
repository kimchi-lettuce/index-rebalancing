import { describe, it, expect } from "vitest"
import { selectCompaniesByMarketCapWeight } from "../selectCompanies"
import { type DayStanding } from "../readData"

// Mock data: 5 companies with descending market caps
const mockEntries: DayStanding[] = [
  {
    date: new Date("2025-04-08"),
    company: "A",
    marketCapM: 1000,
    sharePrice: 10,
  },
  {
    date: new Date("2025-04-08"),
    company: "B",
    marketCapM: 800,
    sharePrice: 20,
  },
  {
    date: new Date("2025-04-08"),
    company: "C",
    marketCapM: 600,
    sharePrice: 30,
  },
  {
    date: new Date("2025-04-08"),
    company: "D",
    marketCapM: 400,
    sharePrice: 40,
  },
  {
    date: new Date("2025-04-08"),
    company: "E",
    marketCapM: 200,
    sharePrice: 50,
  },
]

describe("selectCompaniesByMarketCapWeight", () => {
  it("selects companies up to the given percentile and calculates weights/cumulative weights", () => {
    // 85th percentile should include A, B, C, D (cumulative: 0.8 -> 0.933...)
    const percentile = 0.85
    const selected = selectCompaniesByMarketCapWeight(mockEntries, percentile)

    // Calculate expected weights
    const totalMarketCap = 1000 + 800 + 600 + 400 + 200 // 3000
    const expected = [
      {
        company: "A",
        marketCapM: 1000,
        sharePrice: 10,
        weight: 1000 / totalMarketCap, // 0.3333...
      },
      {
        company: "B",
        marketCapM: 800,
        sharePrice: 20,
        weight: 800 / totalMarketCap, // 0.2666...
      },
      {
        company: "C",
        marketCapM: 600,
        sharePrice: 30,
        weight: 600 / totalMarketCap, // 0.2
      },
      {
        company: "D",
        marketCapM: 400,
        sharePrice: 40,
        weight: 400 / totalMarketCap, // 0.1333...
      },
    ]

    // Check that the selected companies are as expected (A, B, C, D)
    expect(selected.length).toBe(4)
    expect(selected[0].company).toBe("A")
    expect(selected[1].company).toBe("B")
    expect(selected[2].company).toBe("C")
    expect(selected[3].company).toBe("D")

    // Check weights and cumulative
    let cumulative = 0
    for (let i = 0; i < selected.length; i++) {
      const sel = selected[i]
      const exp = expected[i]
      expect(sel.company).toBe(exp.company)
      expect(sel.marketCapM).toBe(exp.marketCapM)
      expect(sel.sharePrice).toBe(exp.sharePrice)
      expect(sel.weight).toBeCloseTo(exp.weight, 8)
      cumulative += sel.weight
      expect(sel.cumulative).toBeCloseTo(cumulative, 8)
    }
  })
})
