import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx"; // Assuming kv store usage is elsewhere in your project
import { createClient } from "npm:@supabase/supabase-js@2";
import { create, getNumericDate } from "jsr:@zaubrik/djwt@3.0.2";

const app = new Hono();

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Initialize Supabase client with service role key
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Google Cloud configuration
const GOOGLE_PROJECT_ID = "formidable-era-476513-p7";

// Cache for access token to avoid generating on every request
let cachedAccessToken: string | null = null;
let tokenExpiry: number = 0;

// --- UTILITY FUNCTION FOR KEY CONVERSION (Unchanged) ---

/**
 * Converts a Base64 string into a binary ArrayBuffer.
 */
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = globalThis.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// --- OAUTH 2.0 ACCESS TOKEN GENERATION (Unchanged) ---

const getServiceAccountCredentials = () => {
  const credentialsJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (!credentialsJson) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON environment variable not set");
  }
  return JSON.parse(credentialsJson);
};

const getAccessToken = async (): Promise<string> => {
  const now = Date.now() / 1000;
  if (cachedAccessToken && tokenExpiry > now + 300) {
    console.log("Using cached access token");
    return cachedAccessToken;
  }

  console.log("Generating new access token from service account");
    
  const credentials = getServiceAccountCredentials();
  const { client_email, private_key } = credentials;

  if (!client_email || !private_key) {
    throw new Error("Invalid service account JSON: missing client_email or private_key");
  }

  const iat = getNumericDate(0);
  const exp = getNumericDate(3600); // 1 hour expiry

  const payload = {
    iss: client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    iat,
    exp,
  };

  const privateKeyPem = private_key.replace(/\\n/g, "\n");
  const base64Key = privateKeyPem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const binaryDerKey = base64ToArrayBuffer(base64Key);

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryDerKey,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const jwt = await create({ alg: "RS256", typ: "JWT" }, payload, key);

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error(`OAuth token error: ${errorText}`);
    throw new Error(`Failed to get access token: ${tokenResponse.status} - ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
    
  if (!tokenData.access_token) {
    throw new Error("No access token in response");
  }

  cachedAccessToken = tokenData.access_token;
  tokenExpiry = now + tokenData.expires_in;

  console.log("Access token generated successfully");
  return cachedAccessToken;
};

// --- SUPABASE SETUP (Unchanged) ---

const bucketName = "make-d7dc0ecc-tts-audio";
(async () => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 52428800, // 50MB
      });
      if (error) {
        console.log(`Bucket creation info: ${error.message}`);
      } else {
        console.log(`Created bucket: ${bucketName}`);
      }
    }
  } catch (error) {
    console.log(`Bucket initialization info: ${error}`);
  }
})();

// --- HONO MIDDLEWARE ---

app.use('*', logger(console.log));

// Comma-separated list of allowed production origins, e.g. "https://studio-narrator.netlify.app"
const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean)
  .concat(["http://localhost:5173"]);

app.use(
  "/*",
  cors({
    origin: (origin) => (origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0]),
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-d7dc0ecc/health", (c) => {
  return c.json({ status: "ok" });
});

// --- RATE LIMITING ---

const RATE_LIMIT_PER_DAY = 20;

const checkRateLimit = async (ip: string): Promise<boolean> => {
  const today = new Date().toISOString().slice(0, 10);
  const key = `ratelimit:${ip}:${today}`;
  const current = (await kv.get(key)) ?? 0;
  if (current >= RATE_LIMIT_PER_DAY) {
    return false;
  }
  await kv.set(key, current + 1);
  return true;
};

// --- VALIDATION ---

const MAX_CHARS = 20000;
const ALLOWED_ACCENTS = ["US", "UK"];
const ALLOWED_VOICES = ["male", "female"];
const ALLOWED_NARRATION_STYLES = ["one-speaker", "two-speaker"];

// --- CORE TTS ENDPOINT ---

app.post("/make-server-d7dc0ecc/generate-speech", async (c) => {
  try {
    const clientIp = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    const allowed = await checkRateLimit(clientIp);
    if (!allowed) {
      return c.json(
        { error: `Rate limit exceeded. Max ${RATE_LIMIT_PER_DAY} requests per day.` },
        { status: 429 }
      );
    }

    const body = await c.req.json();
    const { text: rawText, accent, voice, narrationStyle = "one-speaker" } = body;

    const text = typeof rawText === "string" ? rawText.trim() : "";

    if (!text || !accent || !voice) {
      return c.json(
        { error: "Missing required fields: text, accent (US/UK), voice (female/male)" },
        { status: 400 }
      );
    }

    if (!ALLOWED_ACCENTS.includes(accent)) {
      return c.json({ error: `accent must be one of: ${ALLOWED_ACCENTS.join(", ")}` }, { status: 400 });
    }

    if (!ALLOWED_VOICES.includes(voice)) {
      return c.json({ error: `voice must be one of: ${ALLOWED_VOICES.join(", ")}` }, { status: 400 });
    }

    if (!ALLOWED_NARRATION_STYLES.includes(narrationStyle)) {
      return c.json(
        { error: `narrationStyle must be one of: ${ALLOWED_NARRATION_STYLES.join(", ")}` },
        { status: 400 }
      );
    }

    if (text.length > MAX_CHARS) {
      return c.json({ error: `Text exceeds ${MAX_CHARS} character limit` }, { status: 400 });
    }

    // Validate word count (2500 words max)
    const wordCount = text.split(/\s+/).filter((w: string) => w.length > 0).length;
    if (wordCount > 2500) {
      return c.json(
        { error: "Text exceeds 2500 word limit" },
        { status: 400 }
      );
    }

    console.log(`Generating speech for ${wordCount} words with accent: ${accent}, voice: ${voice}, narration style: ${narrationStyle}`);

    // Get OAuth 2.0 access token
    const accessToken = await getAccessToken();

    // Determine base language code
    let languageCode: string;
    if (accent === "UK") {
      languageCode = "en-GB";
    } else {
      languageCode = "en-US";
    }

    // Build request based on narration style
    let requestBody: any;

    if (narrationStyle === "two-speaker") {
      // Two-speaker mode: Uses multiSpeakerMarkup with the generic MultiSpeaker voice
      
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      
      // Create turns array with alternating speakers
      const turns = sentences.map((sentence: string, index: number) => ({
        text: sentence.trim(),
        speaker: index % 2 === 0 ? "R" : "S", // R and S are the internal speaker tags
      }));

      // FIX: MultiSpeaker voice mapping based on language code
      let multiSpeakerVoice: string;
      if (accent === "UK") {
        multiSpeakerVoice = "en-GB-Studio-MultiSpeaker";
      } else {
        multiSpeakerVoice = "en-US-Studio-MultiSpeaker";
      }

      requestBody = {
        input: {
          multiSpeakerMarkup: {
            turns: turns,
          },
        },
        voice: {
          languageCode: languageCode,
          name: multiSpeakerVoice, // Generic MultiSpeaker name
        },
        audioConfig: {
          audioEncoding: "MP3",
          effectsProfileId: ["small-bluetooth-speaker-class-device"],
          pitch: 0,
          speakingRate: 1.0,
        },
      };

      console.log(`Calling Google Cloud TTS API with two-speaker mode: ${multiSpeakerVoice}`);

    } else {
      // One-speaker mode: Use simple text input with specific voice name
      // 💡 FIX: Use the stable Chirp 3 HD voice names found in the documentation!
      
      let voiceName: string;

      if (accent === "UK") {
        // Female: Kore, Male: Charon (These are now the stable Chirp 3 HD names for GB)
        voiceName = voice === "female" ? "en-GB-Chirp3-HD-Kore" : "en-GB-Chirp3-HD-Charon";
      } else {
        // Female: Leda, Male: Orus (These are now the stable Chirp 3 HD names for US)
        voiceName = voice === "female" ? "en-US-Chirp3-HD-Leda" : "en-US-Chirp3-HD-Orus";
      }

      requestBody = {
        input: {
          text: text, // Use simple text input
        },
        voice: {
          languageCode: languageCode,
          name: voiceName, // Specific named Chirp 3 HD voice
        },
        audioConfig: {
          audioEncoding: "MP3",
          effectsProfileId: ["small-bluetooth-speaker-class-device"],
          pitch: 0,
          speakingRate: 1.0,
        },
      };

      console.log(`Calling Google Cloud TTS API with specific voice: ${voiceName}`);
    }

    // Call Google Cloud TTS REST API with OAuth 2.0 Bearer token
    const ttsResponse = await fetch(
      "https://texttospeech.googleapis.com/v1/text:synthesize",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error(`Google Cloud TTS API error: ${ttsResponse.status} - ${errorText}`);
      throw new HttpError(502, "Text-to-speech provider is temporarily unavailable. Please try again.");
    }

    const ttsData = await ttsResponse.json();

    if (!ttsData.audioContent) {
      console.error("No audio content received from Google Cloud TTS");
      throw new HttpError(502, "Text-to-speech provider returned no audio. Please try again.");
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `narration-${timestamp}.mp3`;

    console.log(`Uploading audio file to Supabase Storage: ${filename}`);

    // Google Cloud TTS returns base64 encoded audio
    const audioBuffer = base64ToArrayBuffer(ttsData.audioContent);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filename, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error(`Storage upload error: ${uploadError.message}`);
      throw new HttpError(500, "Failed to store generated audio. Please try again.");
    }

    // Generate signed URL valid for 1 hour
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filename, 3600);

    if (signedUrlError || !signedUrlData) {
      console.error(`Signed URL error: ${signedUrlError?.message}`);
      throw new HttpError(500, "Failed to prepare audio for download. Please try again.");
    }

    console.log(`Successfully generated audio, signed URL created`);

    return c.json({
      success: true,
      audioUrl: signedUrlData.signedUrl,
      filename: filename,
      wordCount: wordCount,
    });

  } catch (error) {
    console.error(`Error generating speech: ${error}`);
    if (error instanceof HttpError) {
      return c.json({ error: error.message }, { status: error.status });
    }
    return c.json(
      { error: "Failed to generate speech. Please try again." },
      { status: 500 }
    );
  }
});

// --- STORAGE CLEANUP ---
// Deletes generated audio files older than 24h. Intended to be invoked on a
// schedule (e.g. a Supabase Cron Trigger / pg_cron job), protected by a
// shared secret so it can't be triggered by arbitrary callers.

const CLEANUP_MAX_AGE_MS = 24 * 60 * 60 * 1000;

app.post("/make-server-d7dc0ecc/cleanup", async (c) => {
  const cleanupSecret = Deno.env.get("CLEANUP_SECRET");
  if (!cleanupSecret || c.req.header("x-cleanup-secret") !== cleanupSecret) {
    return c.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: files, error: listError } = await supabase.storage.from(bucketName).list();
    if (listError) {
      console.error(`Cleanup list error: ${listError.message}`);
      return c.json({ error: "Failed to list files" }, { status: 500 });
    }

    const cutoff = Date.now() - CLEANUP_MAX_AGE_MS;
    const staleFiles = (files ?? []).filter((f) => {
      const createdAt = f.created_at ? new Date(f.created_at).getTime() : 0;
      return createdAt > 0 && createdAt < cutoff;
    });

    if (staleFiles.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove(staleFiles.map((f) => f.name));
      if (deleteError) {
        console.error(`Cleanup delete error: ${deleteError.message}`);
        return c.json({ error: "Failed to delete stale files" }, { status: 500 });
      }
    }

    console.log(`Cleanup removed ${staleFiles.length} stale audio file(s)`);
    return c.json({ success: true, deleted: staleFiles.length });
  } catch (error) {
    console.error(`Cleanup error: ${error}`);
    return c.json({ error: "Cleanup failed" }, { status: 500 });
  }
});

Deno.serve(app.fetch);