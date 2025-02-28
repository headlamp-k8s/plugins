import { cookieStore } from '../cookieStore.mjs';
import { kSetCookie } from '../HttpResponse/decorators.mjs';
function storeResponseCookies(request, response) {
  const responseCookies = Reflect.get(response, kSetCookie);
  if (responseCookies) {
    cookieStore.setCookie(responseCookies, request.url);
  }
}
export {
  storeResponseCookies
};
//# sourceMappingURL=storeResponseCookies.mjs.map