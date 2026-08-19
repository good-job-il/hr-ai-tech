export function ErrorState({ title, message, action }) {
  return (
    <Card>
      <CardContent className="py-20 text-center">
        <AlertCircle className="w-16 h-16 text-[#EF4444] mx-auto mb-4" />
        <h3 className="text-xl font-black text-[#0F172A] mb-2">{title}</h3>
        <p className="text-[#64748B] max-w-sm mx-auto mb-6">{message}</p>
        {action && <div className="flex justify-center">{action}</div>}
      </CardContent>
    </Card>
  )
}

export default ErrorState
