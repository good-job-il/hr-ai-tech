export function LoadingState({ message = "טוען..." }) {
  return (
    <Card>
      <CardContent className="py-20 text-center">
        <div className="w-12 h-12 border-4 border-[#E4ECFF] border-t-[#7C3AED] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#64748B] font-semibold">{message}</p>
      </CardContent>
    </Card>
  )
}

export default LoadingState
