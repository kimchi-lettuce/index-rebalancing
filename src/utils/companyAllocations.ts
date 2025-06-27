import { DECIMAL_PRECISION } from "../main"
import { type WeightedCompany } from "./selectCompanies"

export function computeCompanyAllocationAmounts(
  selectedCompanies: WeightedCompany[],
  totalValue: number
) {
  const totalSelectedWeight = selectedCompanies.reduce(
    (acc, company) => acc + company.weight,
    0
  )

  const allocationAmounts = selectedCompanies.map((companyData) => ({
    ...companyData,
    allocationAmount: Number(
      ((companyData.weight / totalSelectedWeight) * totalValue).toFixed(
        DECIMAL_PRECISION
      )
    ),
  }))
}
