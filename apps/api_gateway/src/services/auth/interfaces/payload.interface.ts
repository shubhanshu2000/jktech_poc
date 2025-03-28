/**
 * Interface for the verified JWT payload
 */
export interface JWTVerifiedPayload {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}
