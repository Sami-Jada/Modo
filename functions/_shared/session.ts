/**
 * Encrypted Cookie Session Management for Cloudflare Workers
 * Uses Web Crypto API for AES-GCM encryption
 */

export interface SessionData {
  adminId?: string;
  adminEmail?: string;
  adminRole?: string;
}

const SESSION_COOKIE_NAME = "modo_session";
const SESSION_MAX_AGE = 24 * 60 * 60; // 24 hours in seconds

/**
 * Derive an encryption key from the session secret
 */
async function deriveKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("modo-session-salt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt session data
 */
async function encryptSession(data: SessionData, secret: string): Promise<string> {
  const key = await deriveKey(secret);
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(data));
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext
  );

  // Combine IV + ciphertext and base64 encode
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt session data
 */
async function decryptSession(encrypted: string, secret: string): Promise<SessionData | null> {
  try {
    const key = await deriveKey(secret);
    
    // Decode base64
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    
    // Extract IV and ciphertext
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(plaintext));
  } catch (error) {
    console.error("Failed to decrypt session:", error);
    return null;
  }
}

/**
 * Parse cookies from Cookie header
 */
function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach(cookie => {
    const [name, ...rest] = cookie.trim().split("=");
    if (name && rest.length > 0) {
      cookies[name] = rest.join("=");
    }
  });
  return cookies;
}

/**
 * Get session from request cookies
 */
export async function getSession(request: Request, secret: string): Promise<SessionData> {
  const cookieHeader = request.headers.get("Cookie");
  const cookies = parseCookies(cookieHeader);
  const sessionCookie = cookies[SESSION_COOKIE_NAME];
  
  if (!sessionCookie) {
    return {};
  }

  const session = await decryptSession(sessionCookie, secret);
  return session || {};
}

/**
 * Create Set-Cookie header for session
 */
export async function createSessionCookie(session: SessionData, secret: string): Promise<string> {
  const encrypted = await encryptSession(session, secret);
  
  const parts = [
    `${SESSION_COOKIE_NAME}=${encrypted}`,
    `Max-Age=${SESSION_MAX_AGE}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ];
  
  return parts.join("; ");
}

/**
 * Create Set-Cookie header to clear session
 */
export function clearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

/**
 * Check if session is authenticated
 */
export function isAuthenticated(session: SessionData): boolean {
  return !!session.adminId;
}

/**
 * Check if session has superadmin role
 */
export function isSuperadmin(session: SessionData): boolean {
  return session.adminRole === "superadmin";
}

