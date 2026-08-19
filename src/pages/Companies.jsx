import React from "react"
import { Link } from "react-router-dom"
import { companyService } from "@/api/services/companyService"
import { useQuery } from "@tanstack/react-query"
import { ArrowRight } from "lucide-react"
import PublicLayout from "@/components/layouts/PublicLayout"

export default function Companies() {
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies-all"],
    queryFn: () => companyService.list({ sort: "job_count", order: "DESC", limit: 50 }),
    initialData: [],
  })

  return (
    <PublicLayout>
      <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <div className="mb-8">
            <Link
              to="/"
              className="text-hhblue hover:text-hhblue/80 text-sm font-medium flex items-center gap-1 mb-2"
            >
              <ArrowRight className="w-4 h-4" /> חזרה לעמוד הבית
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">חברות מובילות</h1>
            {companies.length > 0 && (
              <p className="text-gray-500 text-sm mt-2">{companies.length} חברות המעניקות משרות</p>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-hhblue rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {companies.map((company) => (
                <Link
                  key={company.id}
                  to={`/companies/${company.id}`}
                  className="group bg-white rounded-2xl p-6 border border-gray-200 hover:border-hhblue/50 hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center"
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-lg font-bold mb-4 shadow-md"
                    style={{ backgroundColor: company.color || "#3da8c8" }}
                  >
                    {company.initials || company.name?.slice(0, 2)}
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-hhblue transition-colors">
                    {company.name}
                  </h3>
                  {company.industry && (
                    <p className="text-sm text-gray-600 mt-1">{company.industry}</p>
                  )}
                  <div className="mt-4 pt-4 border-t border-gray-100 w-full">
                    <p
                      className={`text-lg font-bold ${(company.job_count || 0) > 0 ? "text-hhblue" : "text-gray-400"}`}
                    >
                      {(company.job_count || 0) > 0 ? company.job_count : "—"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(company.job_count || 0) > 0 ? "משרות פתוחות" : "אין משרות פתוחות כרגע"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  )
}
