import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";
import { adminDb } from "@/lib/firebase/firebase-admin";
import { getCurrentUser } from "@/lib/firebase/get-current-user";
import { isSameOrigin, isDocumentId } from "@/lib/server/request";
import { MAX_FILE_SIZE, ALLOWED_CONTENT_TYPES } from "@/lib/chat";
import type { UploadApiResponse } from "cloudinary";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const maxBody = MAX_FILE_SIZE + 256 * 1024;
  if (
    !request.headers.get("content-type")?.startsWith("multipart/form-data;") ||
    Number(request.headers.get("content-length") || 0) > maxBody
  )
    return NextResponse.json(
      { error: "Choose a file up to 10 MB." },
      { status: 413 }
    );
  try {
    // Limit actual streamed bytes too; Content-Length is untrusted and optional.
    const reader = request.body?.getReader();
    if (!reader)
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBody) {
        await reader.cancel();
        return NextResponse.json({ error: "File too large" }, { status: 413 });
      }
      chunks.push(value);
    }
    const form = await new Response(Buffer.concat(chunks), {
      headers: { "Content-Type": request.headers.get("content-type")! },
    }).formData();
    const file = form.get("file");
    const id = form.get("conversationId");
    if (
      !(file instanceof File) ||
      !isDocumentId(id) ||
      file.size <= 0 ||
      file.size > MAX_FILE_SIZE ||
      file.name.length > 255 ||
      !ALLOWED_CONTENT_TYPES.includes(file.type)
    )
      return NextResponse.json(
        { error: "Choose a JPG, PNG, WebP, or PDF up to 10 MB." },
        { status: 400 }
      );
    const conversation = await adminDb
      .collection("conversations")
      .doc(id)
      .get();
    if (
      !conversation.exists ||
      !conversation.data()?.participantIds.includes(user.uid)
    )
      return NextResponse.json(
        { error: "Conversation unavailable" },
        { status: 403 }
      );
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: "chat-files",
          allowed_formats: ["jpg", "jpeg", "png", "webp", "pdf"],
          timeout: 60000,
          context: { conversationId: id, uploaderId: user.uid },
        },
        (error, result) =>
          error || !result
            ? reject(error || new Error("Upload failed"))
            : resolve(result)
      );
      stream.end(buffer);
    });
    const contentType =
      uploaded.format === "pdf"
        ? "application/pdf"
        : uploaded.format === "jpg" || uploaded.format === "jpeg"
          ? "image/jpeg"
          : `image/${uploaded.format}`;
    return NextResponse.json(
      {
        fileName: file.name,
        fileUrl: uploaded.secure_url,
        fileSize: uploaded.bytes,
        contentType,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 502 }
    );
  }
}
