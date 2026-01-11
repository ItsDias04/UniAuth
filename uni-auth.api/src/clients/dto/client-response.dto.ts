export class ClientResponseDto {
  id: string;
  clientId: string;
  clientSecret?: string; // shown only at creation
  name?: string;
  redirectUris: string[];
  scopes: string[];
  grantTypes: string[];
}
