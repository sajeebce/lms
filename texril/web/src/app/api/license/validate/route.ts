import { NextRequest, NextResponse } from "next/server";

type LicenseRequestBody = {
  apiKey?: string;
  tenantId?: string;
  domain?: string;
};

export async function POST(req: NextRequest) {
  let body: LicenseRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { allowed: false, message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const apiKey = body.apiKey?.trim();
  const domain = body.domain?.trim();
  const tenantId = body.tenantId?.trim() || "demo-tenant";

  if (!apiKey || !domain) {
    return NextResponse.json(
      { allowed: false, message: "apiKey and domain are required" },
      { status: 400 }
    );
  }

  // TODO: Replace with real lookup in your database / billing system.
  const isBlocked = false;
  const isExpired = false;

  if (isBlocked || isExpired) {
    return NextResponse.json(
      { allowed: false, message: "License is not active" },
      { status: 403 }
    );
  }

  const payload = {
    tenantId,
    domain,
    issuedAt: Date.now(),
  };

  const token = Buffer.from(JSON.stringify(payload)).toString("base64url");

  const baseUrl =
    process.env.NEXT_PUBLIC_EMBED_BASE_URL ?? "http://localhost:3001";

  const embedUrl = `${baseUrl}/embed?token=${encodeURIComponent(
    token
  )}&context=lesson`;

  return NextResponse.json(
    {
      allowed: true,
      message: "License valid (MVP stub)",
      token,
      embedUrl,
    },
    {
      status: 200,
    }
  );
}
