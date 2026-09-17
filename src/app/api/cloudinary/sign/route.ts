import { NextResponse } from "next/server";

import { cloudinary } from "@/lib/cloudinary";
import { getCurrentUser } from "@/lib/firebase/get-current-user";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();

    const paramsToSign = body.paramsToSign;

    if (!paramsToSign || typeof paramsToSign !== "object") {
      return NextResponse.json(
        { error: "Missing upload parameters." },
        { status: 400 }
      );
    }

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    );

    return NextResponse.json({
      signature,
    });
  } catch (error) {
    console.error("Cloudinary signature error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate Cloudinary signature.",
      },
      { status: 500 }
    );
  }
}
