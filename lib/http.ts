import { NextRequest, NextResponse } from "next/server";

export const REQUEST_ID_HEADER = "x-request-id";

export function getRequestId(request: NextRequest): string {
  const requestId = request.headers.get(REQUEST_ID_HEADER)?.trim();
  if (requestId) return requestId;
  return crypto.randomUUID();
}

export function jsonWithRequestId<T>(
  body: T,
  requestId: string,
  init?: ResponseInit,
): NextResponse {
  const response = NextResponse.json(body, init);
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

export function internalServerError(requestId: string): NextResponse {
  return jsonWithRequestId(
    { error: "Internal server error" },
    requestId,
    { status: 500 },
  );
}
