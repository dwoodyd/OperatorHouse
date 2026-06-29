/**
 * Apollo.io REST API v1 client
 * https://apolloio.github.io/apollo-api-docs/
 *
 * Auth: api_key sent in the POST body (not as a Bearer header — Apollo v1 uses body auth)
 * Headers: Content-Type: application/json, Cache-Control: no-cache
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

/**
 * Low-level fetch wrapper.
 * Apollo v1 uses body auth — api_key must be in the JSON body, not in headers.
 */
async function apolloFetch(
  endpoint: string,
  body: Record<string, unknown>
): Promise<any> {
  // Build full URL by simple string concatenation — avoids URL constructor path-replacement issues
  const url = `${APOLLO_BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
    body: JSON.stringify(body),
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
 * POST https://api.apollo.io/api/v1/mixed_people/search
 */
export async function searchContacts(
  apiKey: string,
  filter: ApolloSearchFilter
): Promise<ApolloSearchResult> {
  const body: Record<string, unknown> = {
    api_key: apiKey,
    page: filter.page ?? 1,
    per_page: Math.min(filter.limit ?? 10, 100),
  };

  if (filter.q) body.q_keywords = filter.q;
  if (filter.title) body.person_titles = [filter.title];
  if (filter.industry) body.organization_industry_tag_ids = [filter.industry];
  if (filter.companySize) body.organization_num_employees_ranges = [filter.companySize];
  if (filter.location) body.person_locations = [filter.location];
  if (filter.technology) body.organization_technology_uids = [filter.technology];

  const data = await apolloFetch("/mixed_people/search", body);

  const contacts = (data?.contacts || data?.people || []).map((c: any) => ({
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
 * Verify an Apollo API key by calling the mixed_people/search endpoint
 * with a minimal payload — the only reliable way to test a sending-only key.
 * POST https://api.apollo.io/api/v1/mixed_people/search
 */
export async function testApiKey(apiKey: string): Promise<{ valid: boolean; message: string }> {
  try {
    await apolloFetch("/mixed_people/search", {
      api_key: apiKey,
      per_page: 1,
      page: 1,
    });
    return { valid: true, message: "Apollo API key verified successfully" };
  } catch (err) {
    if (err instanceof ApolloApiError) {
      // 401 = bad key, 422 = key valid but bad params (still means key works)
      if (err.statusCode === 422 || err.statusCode === 200) {
        return { valid: true, message: "Apollo API key verified successfully" };
      }
      return { valid: false, message: err.message };
    }
    return { valid: false, message: "Could not connect to Apollo API" };
  }
}
