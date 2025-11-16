import { NextResponse } from "next/server";
import * as jwt from "jsonwebtoken";

export async function GET() {
  const randomPayload = crypto.randomUUID();
  const secret = jwt.sign(randomPayload, process.env.JWT_SECRET!);

  return NextResponse.json(
    { token: secret },
    {
      status: 200,
    }
  );
}
