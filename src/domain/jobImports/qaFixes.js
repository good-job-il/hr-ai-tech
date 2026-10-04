export function parseReviewSelection(value) {
  return new Set(
    String(value || "")
      .split(",")
      .map((token) => token.trim())
      .filter((token) => /^[1-9]\d*$/.test(token))
      .map(Number)
      .filter(Number.isSafeInteger),
  )
}

export function agencyClientLabel(client, fallback = "—") {
  return client?.name?.trim() || client?.company?.name?.trim() || fallback
}
