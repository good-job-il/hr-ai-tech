export function PageHeader({ title, description, children, action }) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between gap-6 mb-4">
        <div>
          <h1 className="text-4xl font-black text-[#0F172A] mb-2">{title}</h1>

          {description && <p className="text-[#64748B] text-lg">{description}</p>}
        </div>

        {action && <div>{action}</div>}
      </div>

      {children}
    </div>
  )
}

export default PageHeader
