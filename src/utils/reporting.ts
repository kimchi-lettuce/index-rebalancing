import { mkdirSync, writeFileSync } from "fs"
import { PERCENTILE_OF_COMPANIES_TO_SELECT } from "../main"
import { Order } from "./orders"
import { PortfolioState } from "./portfolioValue"
import { WeightedCompany } from "./selectCompanies"
import { join } from "path"
import { log } from "@clack/prompts"

/**
 * Generates a markdown report for the portfolio rebalancing
 * @param date - The date of the rebalancing
 * @param prevPortfolioState - Previous portfolio state before rebalancing
 * @param portfolioState - Current portfolio state after rebalancing
 * @param selectedCompanies - Companies selected for the portfolio
 * @param companiesWithAllocations - Companies with their allocation amounts
 * @param rebalanceOrders - Orders to execute for rebalancing
 */
export function generateMarkdownReport(
  date: Date,
  prevPortfolioState: PortfolioState,
  portfolioState: PortfolioState,
  selectedCompanies: WeightedCompany[],
  companiesWithAllocations: (WeightedCompany & { allocationAmountM: number })[],
  rebalanceOrders: Order[]
) {
  const dateStr = date.toISOString().split("T")[0]

  // Sort arrays by company name for consistent table ordering
  const sortedSelectedCompanies = [...selectedCompanies].sort((a, b) =>
    a.company.localeCompare(b.company)
  )
  const sortedCompaniesWithAllocations = [...companiesWithAllocations].sort(
    (a, b) => a.company.localeCompare(b.company)
  )
  const sortedPrevAssets = [...prevPortfolioState.assets].sort((a, b) =>
    a.company.localeCompare(b.company)
  )
  const sortedRebalanceOrders = [...rebalanceOrders].sort((a, b) =>
    a.company.localeCompare(b.company)
  )
  const sortedPortfolioAssets = [...portfolioState.assets].sort((a, b) =>
    a.company.localeCompare(b.company)
  )

  const report = `# Portfolio Rebalancing Report - ${dateStr}

## Portfolio Summary
- **Date**: ${dateStr}
- **Previous Portfolio Value**: $${prevPortfolioState.totalValueM.toFixed(2)}M
- **Portfolio Value After Rebalancing**: $${portfolioState.totalValueM.toFixed(
    2
  )}M
- **Number of Selected Companies**: ${selectedCompanies.length}

## Index Universe Selection
Companies selected for inclusion in the index fund based on market capitalization ranking up to the ${
    PERCENTILE_OF_COMPANIES_TO_SELECT * 100
  }% percentile threshold.

| Company | Share Price | Market Cap (M) | Weight | Cumulative Weight |
|---------|-------------|----------------|--------|-------------------|
${sortedSelectedCompanies
  .map(
    (company) =>
      `| ${company.company} | $${company.sharePrice.toFixed(
        2
      )} | $${company.marketCapM.toFixed(0)}M | ${(
        company.weight * 100
      ).toFixed(2)}% | ${(company.cumulative * 100).toFixed(2)}% |`
  )
  .join("\n")}

## Portfolio Allocation Targets
Target dollar amounts and percentage allocations for each company in the index fund based on their market cap weights.

| Company | Target Allocation (M) | Target Allocation (%) |
|---------|----------------------|----------------------|
${sortedCompaniesWithAllocations
  .map((company) => {
    const percentage =
      (company.allocationAmountM / portfolioState.totalValueM) * 100

    return `| ${company.company} | $${company.allocationAmountM.toFixed(
      2
    )}M | ${percentage.toFixed(2)}% |`
  })
  .join("\n")}

## Holdings Before Rebalancing
Portfolio state before executing rebalancing orders.

| Company | Shares | Current Value (M) |
|---------|--------|-------------------|
${sortedPrevAssets
  .map((asset) => {
    const currentValue = (asset.numShares * asset.sharePrice) / 1_000_000
    return `| ${
      asset.company
    } | ${asset.numShares.toLocaleString()} | $${currentValue.toFixed(2)}M |`
  })
  .join("\n")}

## Rebalancing Orders
| Company | Action | Shares | Share Price | Order Value (M) |
|---------|--------|--------|-------------|-----------------|
${sortedRebalanceOrders
  .map((order) => {
    const orderValue = (order.numShares * (order.sharePrice || 0)) / 1_000_000
    return `| ${
      order.company
    } | ${order.action.toUpperCase()} | ${order.numShares.toLocaleString()} | $${(
      order.sharePrice || 0
    ).toFixed(2)} | $${orderValue.toFixed(2)}M |`
  })
  .join("\n")}

## Holdings After Rebalancing
Portfolio state after executing rebalancing orders.

| Company | Shares | Current Value (M) |
|---------|--------|-------------------|
${sortedPortfolioAssets
  .map((asset) => {
    const currentValue = (asset.numShares * asset.sharePrice) / 1_000_000
    return `| ${
      asset.company
    } | ${asset.numShares.toLocaleString()} | $${currentValue.toFixed(2)}M |`
  })
  .join("\n")}

## Summary
- **Total Buy Orders**: ${
    rebalanceOrders.filter((o) => o.action === "buy").length
  }
- **Total Sell Orders**: ${
    rebalanceOrders.filter((o) => o.action === "sell").length
  }
- **Total Buy Value**: $${(
    rebalanceOrders
      .filter((o) => o.action === "buy")
      .reduce((sum, o) => sum + o.numShares * (o.sharePrice || 0), 0) /
    1_000_000
  ).toFixed(2)}M
- **Total Sell Value**: $${(
    rebalanceOrders
      .filter((o) => o.action === "sell")
      .reduce((sum, o) => sum + o.numShares * (o.sharePrice || 0), 0) /
    1_000_000
  ).toFixed(2)}M
`

  // Ensure output directory exists
  mkdirSync("./output", { recursive: true })

  // Write report to file
  const reportPath = join("./output", `rebalancing-report-${dateStr}.md`)
  writeFileSync(reportPath, report)

  log.success(`Report generated: ${reportPath}`)
}
