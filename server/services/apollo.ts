/**
 * Apollo.io REST API v2 client
 * https://apolloio.github.io/apollo-api-docs/
 */

const APOLLO_BASE_URL = "https://api.apollo.io/api/v1";

export interface ApolloSearchFilter {
  industry?: string;
  title?: string;
  companySize?: string;
  location?: string;
  technology?: string;
  q?: string;
  limit?: number;
  page?: number;
}

export interface ApolloContact {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  title: string;
  linkedin_url?: string;
  phone_numbers?: Array<{ sanitized_number: string }>;
  organization?: {
    id: string;
    name: string;
    industry?: string;
    employee_count?: number;
    website_url?: string;
    linkedin_url?: string;
  };
}

export interface ApolloSearchResult {
  contacts: ApolloContact[];
  pagination: {
    page: number;
    per_page: number;
    total_entries: number;
    total_pages: number;
  };
}

export class ApolloApiError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "ApolloApiError";
  }
}

async function apolloFetch(
  apiKey: string,
  endpoint: string,
  options?: { method?: string; headers?: Record<string, string>; body?: Record<string, unknown> }
): Promise<any> {
  const url = new URL(endpoint, APOLLO_BASE_URL);
  const res = await fetch(url.toString(), {
    method: options?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      ...(options?.headers ?? {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApolloApiError(
      data?.error || `Apollo API error: ${res.status} ${res.statusText}`,
      res.status
    );
  }
  return data;
}

/**
 * Search contacts via Apollo.io mixed-people-search
 * https://apolloio.github.io/apollo-api-docs/#mixed-people-search
 */
export async function searchContacts(
  apiKey: string,
  filter: ApolloSearchFilter
): Promise<ApolloSearchResult> {
  const body: Record<string, unknown> = {
    api_key: apiKey,
    page: filter.page ?? 1,
    per_page: Math.min(filter.limit ?? 10, 100), // Apollo max is 100
  };

  if (filter.q) body.q_keywords = filter.q;
  if (filter.title) body.person_titles = [filter.title];
  if (filter.industry) body.organization_industry_tag_ids = [filter.industry];
  if (filter.companySize) body.organization_num_employees_ranges = [filter.companySize];
  if (filter.location) body.person_locations = [filter.location];
  if (filter.technology) body.organization_technology_uids = [filter.technology];

  const data = await apolloFetch(apiKey, "/mixed_people/search", {
    method: "POST",
    body,
  });

  const contacts = (data?.contacts || []).map((c: any) => ({
    id: c.id,
    first_name: c.first_name || "",
    last_name: c.last_name || "",
    name: c.name || `${c.first_name || ""} ${c.last_name || ""}`.trim(),
    email: c.email || "",
    title: c.title || "",
    linkedin_url: c.linkedin_url,
    phone_numbers: c.phone_numbers || [],
    organization: c.organization
      ? {
          id: c.organization.id,
          name: c.organization.name,
          industry: c.organization.industry,
          employee_count: c.organization.employee_count,
          website_url: c.organization.website_url,
          linkedin_url: c.organization.linkedin_url,
        }
      : undefined,
  }));

  return {
    contacts,
    pagination: {
      page: data?.pagination?.page ?? filter.page ?? 1,
      per_page: data?.pagination?.per_page ?? filter.limit ?? 10,
      total_entries: data?.pagination?.total_entries ?? 0,
      total_pages: data?.pagination?.total_pages ?? 1,
    },
  };
}

/**
 * Verify an Apollo API key by calling the current-user endpoint.
 */
export async function testApiKey(apiKey: string): Promise<{ valid: boolean; message: string }> {
  try {
    await apolloFetch(apiKey, "/users/search", {
      method: "POST",
      body: { api_key: apiKey, per_page: 1 },
    });
    return { valid: true, message: "API key verified successfully" };
  } catch (err) {
    return {
      valid: false,
      message: err instanceof ApolloApiError ? err.message : "Invalid API key",
    };
  }
}
