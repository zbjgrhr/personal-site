import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { NextRequest } from "next/server";
import { getAdminSessionCookieOptions, getCookieName } from "./auth";
import { POST as logout } from "../app/api/auth/logout/route";

async function withNodeEnv<T>(value: string, fn: () => T | Promise<T>): Promise<T> {
  const previous = process.env.NODE_ENV;
  Object.defineProperty(process.env, "NODE_ENV", {
    value,
    configurable: true,
    writable: true,
    enumerable: true,
  });
  try {
    return await fn();
  } finally {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: previous,
      configurable: true,
      writable: true,
      enumerable: true,
    });
  }
}

describe("admin session cookie options", () => {
  test("set and clear share identity attributes so logout can overwrite login", () => {
    const set = getAdminSessionCookieOptions("set");
    const clear = getAdminSessionCookieOptions("clear");

    assert.equal(set.httpOnly, true);
    assert.equal(set.sameSite, "lax");
    assert.equal(set.path, "/");
    assert.equal(set.secure, process.env.NODE_ENV === "production");
    assert.equal(set.maxAge, 60 * 60 * 24 * 7);

    assert.equal(clear.httpOnly, set.httpOnly);
    assert.equal(clear.secure, set.secure);
    assert.equal(clear.sameSite, set.sameSite);
    assert.equal(clear.path, set.path);
    assert.equal(clear.maxAge, 0);
  });

  test("production clear options include Secure for Chromium scheme-bound cookies", async () => {
    const clear = await withNodeEnv("production", () =>
      getAdminSessionCookieOptions("clear")
    );
    assert.equal(clear.secure, true);
    assert.equal(clear.httpOnly, true);
    assert.equal(clear.sameSite, "lax");
    assert.equal(clear.path, "/");
    assert.equal(clear.maxAge, 0);
  });
});

describe("POST /api/auth/logout", () => {
  test("redirects with 303 and clears the session cookie using login attributes", async () => {
    const request = new NextRequest("https://example.com/api/auth/logout", {
      method: "POST",
    });
    const res = await logout(request);
    assert.equal(res.status, 303);
    assert.equal(
      new URL(res.headers.get("location") ?? "").pathname,
      "/admin/login"
    );

    const setCookie = res.headers.get("set-cookie") ?? "";
    assert.match(setCookie, new RegExp(`${getCookieName()}=`));
    assert.match(setCookie, /Max-Age=0/i);
    assert.match(setCookie, /Path=\//i);
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Lax/i);
  });

  test("production logout Set-Cookie includes Secure", async () => {
    const res = await withNodeEnv("production", () =>
      logout(
        new NextRequest("https://example.com/api/auth/logout", {
          method: "POST",
        })
      )
    );
    const setCookie = res.headers.get("set-cookie") ?? "";
    assert.match(setCookie, /Secure/i);
  });
});
