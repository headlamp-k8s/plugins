import cookieUtils from "@bundled-es-modules/cookie";
import { cookieStore } from '../cookieStore.mjs';
function getAllDocumentCookies() {
  return cookieUtils.parse(document.cookie);
}
function getDocumentCookies(request) {
  if (typeof document === "undefined" || typeof location === "undefined") {
    return {};
  }
  switch (request.credentials) {
    case "same-origin": {
      const requestUrl = new URL(request.url);
      return location.origin === requestUrl.origin ? getAllDocumentCookies() : {};
    }
    case "include": {
      return getAllDocumentCookies();
    }
    default: {
      return {};
    }
  }
}
function getAllRequestCookies(request) {
  const requestCookieHeader = request.headers.get("cookie");
  const cookiesFromHeaders = requestCookieHeader ? cookieUtils.parse(requestCookieHeader) : {};
  const cookiesFromDocument = getDocumentCookies(request);
  for (const name in cookiesFromDocument) {
    request.headers.append(
      "cookie",
      cookieUtils.serialize(name, cookiesFromDocument[name])
    );
  }
  const cookiesFromStore = cookieStore.getCookiesSync(request.url);
  const storedCookiesObject = Object.fromEntries(
    cookiesFromStore.map((cookie) => [cookie.key, cookie.value])
  );
  for (const cookie of cookiesFromStore) {
    request.headers.append("cookie", cookie.toString());
  }
  return {
    ...cookiesFromDocument,
    ...storedCookiesObject,
    ...cookiesFromHeaders
  };
}
export {
  getAllRequestCookies
};
//# sourceMappingURL=getRequestCookies.mjs.map