export function isAuthorized(authorizationHeader: string | undefined): boolean {
  const expectedToken = process.env.CONNORHUB_AGENT_TOKEN;

  if (!expectedToken) {
    return false;
  }

  if (!authorizationHeader) {
    return false;
  }

  if (!authorizationHeader.startsWith("Bearer ")) {
    return false;
  }

  const suppliedToken = authorizationHeader.slice("Bearer ".length);

  return suppliedToken === expectedToken;
}
