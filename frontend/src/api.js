export class ApiError extends Error {
  constructor(status, payload) {
    super(payload?.error?.message ?? "The synthetic backend request failed.");
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new ApiError(response.status, payload);
  }
  return payload;
}

export function createTrace(submission) {
  return request("/api/temporary/decision-traces", {
    method: "POST",
    body: JSON.stringify(submission),
  });
}

export function readTrace(traceId) {
  return request(`/api/temporary/decision-traces/${traceId}`);
}

export function sendControl(traceId, command) {
  return request(`/api/temporary/decision-traces/${traceId}/controls`, {
    method: "POST",
    body: JSON.stringify(command),
  });
}
