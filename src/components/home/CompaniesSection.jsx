import { companyService } from "@/api/services/companyService"
import { useQuery } from "@tanstack/react-query"

function CompanyCard({ company }) {
  return (
    <Link
      to={`/companies/${company.id}`}
      className="bg-white border border-blue-100 rounded-lg p-5 hover:border-blue-300 hover:shadow-md hover:bg-blue-50 transition-all group flex gap-4 items-center"
    >
      {company.logo_url ? (
        <img
          src={company.logo_url}
          alt={company.name}
          className="w-12 h-12 rounded-lg flex-shrink-0 object-contain shadow-sm"
        />
      ) : (
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm"
          style={{ backgroundColor: company.color || "#6d28d9" }}
        >
          {company.initials || company.name?.slice(0, 2)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-bold text-gray-900 text-base group-hover:text-blue-700 transition-colors truncate">
          {company.name}
        </div>
        <div className="text-sm text-gray-600 mt-1">{company.industry}</div>
        <div className="text-sm text-gray-500 mt-1">{company.job_count} משרות</div>
      </div>
    </Link>
  )
}

export default function CompaniesSection() {
  const { data: companies = [] } = useQuery({
    queryKey: ["companies-home"],
    queryFn: () => companyService.list({ sort: "job_count", order: "DESC", limit: 8 }),
    initialData: [],
  })

  return (
    <div className="bg-blue-50/50 border-t border-blue-100">
      <div className="max-w-[1200px] mx-auto px-4 py-12" dir="rtl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">חברות מובילות מגייסות</h2>
          <Link
            to="/companies"
            className="text-blue-600 text-sm hover:text-blue-700 transition-colors font-medium inline-flex items-center gap-1"
          >
            לכל החברות
            <span>←</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      </div>
    </div>
  )
}
