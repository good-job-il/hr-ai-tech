export function ChartCard({ title, description, children }) {
  return (
    <Card hoverable>
      <CardHeader>
        <CardTitle>{title}</CardTitle>

        {description && <p className="text-sm text-[#64748B] mt-2">{description}</p>}
      </CardHeader>

      <CardContent>{children}</CardContent>
    </Card>
  )
}

export default ChartCard
