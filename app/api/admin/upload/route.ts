import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Support Vercel Blob if installed and configured
async function tryUploadToVercelBlob(file: File, fileName: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const { put } = await import("@vercel/blob");
    const blob = await put(`uploads/${fileName}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return blob.url;
  } catch (err) {
    console.error("[Upload] Vercel Blob error:", err);
    return null;
  }
}

// Support Cloudinary if configured
async function tryUploadToCloudinary(buffer: Buffer, mime: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName) return null;

  try {
    const base64Data = `data:${mime};base64,${buffer.toString("base64")}`;
    const formData = new FormData();
    formData.append("file", base64Data);

    if (uploadPreset) {
      formData.append("upload_preset", uploadPreset);
    } else if (apiKey && apiSecret) {
      // Basic signature-free preset or authenticated upload
      formData.append("api_key", apiKey);
    } else {
      return null;
    }

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      return data.secure_url || data.url || null;
    }
  } catch (err) {
    console.error("[Upload] Cloudinary error:", err);
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "មិនមានឯកសាររូបភាពត្រូវបានជ្រើសរើស (No file uploaded)" },
        { status: 400 }
      );
    }

    // Validate mime type
    const validMimes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "image/avif",
    ];
    if (!validMimes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|gif|svg|avif)$/i)) {
      return NextResponse.json(
        { success: false, error: "សូមបញ្ចូលរូបភាពជាទម្រង់ PNG, JPG, WEBP ឬ GIF" },
        { status: 400 }
      );
    }

    // Limit size (4MB limit to stay safely below Vercel serverless request body limits)
    if (file.size > 4.5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "ទំហំរូបភាពធំពេក (កុំឱ្យលើស 4.5MB សម្រាប់ដំណើរការលើ Vercel)" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate safe unique filename
    const originalExt = path.extname(file.name) || ".png";
    const safeBaseName = path
      .basename(file.name, originalExt)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .substring(0, 30);
    const fileName = `${Date.now()}_${safeBaseName}${originalExt.toLowerCase()}`;

    // 1. Check Vercel Blob (Recommended for Vercel production deployments)
    const vercelBlobUrl = await tryUploadToVercelBlob(file, fileName);
    if (vercelBlobUrl) {
      return NextResponse.json({
        success: true,
        url: vercelBlobUrl,
        fileName,
        provider: "vercel-blob",
      });
    }

    // 2. Check Cloudinary
    const cloudinaryUrl = await tryUploadToCloudinary(buffer, file.type || "image/png");
    if (cloudinaryUrl) {
      return NextResponse.json({
        success: true,
        url: cloudinaryUrl,
        fileName,
        provider: "cloudinary",
      });
    }

    // 3. If running in local development (not Vercel read-only serverless environment), write to public/uploads
    if (!process.env.VERCEL) {
      try {
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        await mkdir(uploadsDir, { recursive: true });
        const filePath = path.join(uploadsDir, fileName);
        await writeFile(filePath, buffer);

        return NextResponse.json({
          success: true,
          url: `/uploads/${fileName}`,
          fileName,
          provider: "local",
        });
      } catch (fsErr) {
        console.warn("[Upload] Local disk write failed, falling back to base64 data URI:", fsErr);
      }
    }

    // 4. Universal Fallback for Vercel Serverless environment
    // When deployed on Vercel and no cloud storage token is configured,
    // convert the uploaded image to an optimized Base64 data URI.
    // This guarantees image upload NEVER fails with read-only filesystem errors (EROFS).
    const mime = file.type || "image/png";
    const base64Url = `data:${mime};base64,${buffer.toString("base64")}`;

    return NextResponse.json({
      success: true,
      url: base64Url,
      fileName,
      provider: "base64",
      note: "រូបភាពត្រូវបានរក្សាទុកដោយជោគជ័យ (Base64 Mode on Vercel). អ្នកក៏អាចភ្ជាប់ Vercel Blob ឬ Cloudinary សម្រាប់ High-speed CDN ផងដែរ។",
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Upload API Error]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Upload បរាជ័យ សូមព្យាយាមម្ដងទៀត" },
      { status: 500 }
    );
  }
}
