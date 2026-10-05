import { releaseVersion } from "../../release-version";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ version: releaseVersion }, {
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
