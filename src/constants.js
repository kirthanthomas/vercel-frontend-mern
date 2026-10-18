const baseApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const API_URL = `${baseApiUrl}/api/ideas`;
export const AUTH_URL = `${baseApiUrl}/api/auth`;
export const domains = ["All ideas", "Campus life", "Sustainability", "Learning", "Wellbeing", "Technology"];
export const statuses = ["All statuses", "Submitted", "Under review", "Approved", "Prototype", "Implemented"];
export const emptyForm = { title: "", problemStatement: "", domain: "Campus life", technologies: "", expectedImpact: "" };

export function authHeaders(token, includeJson = false) {
	return { ...(includeJson ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
