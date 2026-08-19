export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <Card>
      <CardContent className="py-20 text-center">
        {Icon && <Icon className="w-16 h-16 text-[#C4B5FD] mx-auto mb-4" />}
        <h3 className="text-xl font-black text-[#0F172A] mb-2">{title}</h3>
        <p className="text-[#64748B] max-w-sm mx-auto mb-6">{description}</p>
        {action && <div className="flex justify-center">{action}</div>}
      </CardContent>
    </Card>
  )
}

export default EmptyState
