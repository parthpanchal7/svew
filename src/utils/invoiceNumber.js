export const getFinancialYear = (date) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = d.getMonth() + 1

  let startYear

  if (month >= 4) {
    startYear = year
  } else {
    startYear = year - 1
  }

  const endYear = startYear + 1

  const fy =
    String(startYear).slice(-2) +
    String(endYear).slice(-2)

  return fy
}