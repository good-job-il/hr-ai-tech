import { httpClient } from "@/api/client/httpClient"

export const agencyTeamsService = {
  overview: () => httpClient.get("/agency-teams", { cache: false }),
  createTeam: (payload) => httpClient.post("/agency-teams/teams", payload),
  updateTeam: (id, payload) => httpClient.patch(`/agency-teams/teams/${id}`, payload),
  invite: (payload) => httpClient.post("/agency-teams/invitations", payload),
  resend: (id) => httpClient.post(`/agency-teams/invitations/${id}/resend`),
  cancel: (id) => httpClient.post(`/agency-teams/invitations/${id}/cancel`),
  updateMember: (id, payload) => httpClient.patch(`/agency-teams/members/${id}`, payload),
  acceptInvitation: (token, password) =>
    httpClient.post("/agency-teams/invitations/accept", { token, password }),
}
