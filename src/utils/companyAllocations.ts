import { DECIMAL_PRECISION } from "../main"
import { type WeightedCompany } from "./selectCompanies"

/**
 * Computes the allocation amounts for each selected company based on their
 * market cap weights and the total portfolio value
 *
 * Calculates how much money should be allocated to each company by
 * proportionally distributing the total portfolio value according to each
 * company's weight within the selected universe. The weights are normalized
 * against the total weight of all selected companies to ensure proper
 * proportional allocation.
 *
 * @param selectedCompanies - Array of companies with their market cap weights
 * @param totalValueM - Total portfolio value to be allocated across companies
 * @returns Array of companies with their computed allocation amounts
 */
export function computeCompanyAllocationAmounts(
  selectedCompanies: WeightedCompany[],
  totalValueM: number
): (WeightedCompany & { allocationAmountM: number })[] {
  /** The total weight of all selected companies. This is used to normalize the
   * weights of the companies to ensure that the total weight is 1.0 */
  const totalSelectedWeight = selectedCompanies.reduce(
    (acc, company) => acc + company.weight,
    0
  )

  // Based on each companies market cap weight, compute the allocation amount
  // for that company based on the total value of the portfolio
  const allocationAmounts = selectedCompanies.map((companyData) => ({
    ...companyData,
    allocationAmountM: Number(
      ((companyData.weight / totalSelectedWeight) * totalValueM).toFixed(
        DECIMAL_PRECISION
      )
    )
  }))

  return allocationAmounts
}
