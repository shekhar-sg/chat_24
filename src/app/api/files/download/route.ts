import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/firebase/get-current-user";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const fileUrl = searchParams.get("url");
    const fileName = searchParams.get("fileName");

    if (!fileUrl) {
      return NextResponse.json({ error: "Missing file URL." }, { status: 400 });
    }

    const cloudinaryUrl = new URL(fileUrl);

    if (cloudinaryUrl.hostname !== "res.cloudinary.com") {
      return NextResponse.json(
        { error: "Invalid file host." },
        { status: 400 }
      );
    }

    const response = await fetch(cloudinaryUrl.toString());

    if (!response.ok) {
      const errorBody = await response.text();

      console.error("Cloudinary response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        url: cloudinaryUrl.toString(),
      });

      return NextResponse.json(
        {
          error: "Failed to fetch file.",
          cloudinaryStatus: response.status,
          cloudinaryStatusText: response.statusText,
        },
        { status: 502 }
      );
    }

    const headers = new Headers();

    headers.set(
      "Content-Type",
      response.headers.get("content-type") || "application/octet-stream"
    );

    headers.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName || "download")}"`
    );

    const contentLength = response.headers.get("content-length");

    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("File download error:", error);

    return NextResponse.json(
      {
        error: "Failed to download file.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
