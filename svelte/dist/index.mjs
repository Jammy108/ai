var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x2) => x2.done ? resolve(x2.value) : Promise.resolve(x2.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// ../../node_modules/.pnpm/swrev@3.0.0/node_modules/swrev/dist/swrev.es.js
var __defProp2 = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols2 = Object.getOwnPropertySymbols;
var __hasOwnProp2 = Object.prototype.hasOwnProperty;
var __propIsEnum2 = Object.prototype.propertyIsEnumerable;
var __defNormalProp2 = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues2 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp2.call(b, prop))
      __defNormalProp2(a, prop, b[prop]);
  if (__getOwnPropSymbols2)
    for (var prop of __getOwnPropSymbols2(b)) {
      if (__propIsEnum2.call(b, prop))
        __defNormalProp2(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __publicField = (obj, key, value) => {
  __defNormalProp2(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var DefaultSWREventManager = class {
  constructor() {
    __publicField(this, "listeners", /* @__PURE__ */ new Map());
  }
  subscribe(key, listener) {
    if (!this.listeners.has(key))
      this.listeners.set(key, []);
    if (this.listeners.get(key).includes(listener))
      return;
    this.listeners.get(key).push(listener);
  }
  unsubscribe(key, listener) {
    if (!this.listeners.has(key))
      return;
    if (!this.listeners.get(key).includes(listener))
      return;
    this.listeners.get(key).splice(this.listeners.get(key).indexOf(listener), 1);
    if (this.listeners.get(key).length === 0)
      this.listeners.delete(key);
  }
  emit(key, payload) {
    if (!this.listeners.has(key))
      return;
    this.listeners.get(key).forEach((listener) => listener(payload));
  }
};
var defaultCacheRemoveOptions = {
  broadcast: false
};
var defaultCacheClearOptions = {
  broadcast: false
};
var CacheItem = class {
  constructor({ data, expiresAt = null }) {
    __publicField(this, "data");
    __publicField(this, "expiresAt");
    this.data = data;
    this.expiresAt = expiresAt;
  }
  isResolving() {
    return this.data instanceof Promise;
  }
  hasExpired() {
    return this.expiresAt === null || this.expiresAt < /* @__PURE__ */ new Date();
  }
  expiresIn(milliseconds) {
    this.expiresAt = /* @__PURE__ */ new Date();
    this.expiresAt.setMilliseconds(this.expiresAt.getMilliseconds() + milliseconds);
    return this;
  }
};
var DefaultCache = class {
  constructor() {
    __publicField(this, "elements", /* @__PURE__ */ new Map());
    __publicField(this, "event", new DefaultSWREventManager());
  }
  resolve(key, value) {
    Promise.resolve(value.data).then((detail) => {
      if (detail === void 0 || detail === null) {
        return this.remove(key);
      }
      value.data = detail;
      this.broadcast(key, detail);
    });
  }
  get(key) {
    return this.elements.get(key);
  }
  set(key, value) {
    this.elements.set(key, value);
    this.resolve(key, value);
  }
  remove(key, options) {
    const { broadcast } = __spreadValues2(__spreadValues2({}, defaultCacheRemoveOptions), options);
    if (broadcast)
      this.broadcast(key, void 0);
    this.elements.delete(key);
  }
  clear(options) {
    const { broadcast } = __spreadValues2(__spreadValues2({}, defaultCacheClearOptions), options);
    if (broadcast)
      for (const key of this.elements.keys())
        this.broadcast(key, void 0);
    this.elements.clear();
  }
  has(key) {
    return this.elements.has(key);
  }
  subscribe(key, listener) {
    this.event.subscribe(key, listener);
  }
  unsubscribe(key, listener) {
    this.event.unsubscribe(key, listener);
  }
  broadcast(key, data) {
    this.event.emit(key, data);
  }
};
var defaultOptions = {
  cache: new DefaultCache(),
  errors: new DefaultSWREventManager(),
  fetcher: (url) => __async(void 0, null, function* () {
    const response = yield fetch(url);
    if (!response.ok)
      throw Error("Not a 2XX response.");
    return response.json();
  }),
  initialData: void 0,
  loadInitialCache: true,
  revalidateOnStart: true,
  dedupingInterval: 2e3,
  revalidateOnFocus: true,
  focusThrottleInterval: 5e3,
  revalidateOnReconnect: true,
  reconnectWhen: (notify, { enabled }) => {
    if (enabled && typeof window !== "undefined") {
      window.addEventListener("online", notify);
      return () => window.removeEventListener("online", notify);
    }
    return () => {
    };
  },
  focusWhen: (notify, { enabled, throttleInterval }) => {
    if (enabled && typeof window !== "undefined") {
      let lastFocus = null;
      const rawHandler = () => {
        const now = Date.now();
        if (lastFocus === null || now - lastFocus > throttleInterval) {
          lastFocus = now;
          notify();
        }
      };
      window.addEventListener("focus", rawHandler);
      return () => window.removeEventListener("focus", rawHandler);
    }
    return () => {
    };
  }
};
var defaultRevalidateOptions = __spreadProps(__spreadValues2({}, defaultOptions), {
  force: false
});
var defaultMutateOptions = {
  revalidate: true,
  revalidateOptions: __spreadValues2({}, defaultRevalidateOptions)
};
var defaultClearOptions = {
  broadcast: false
};
var SWR = class {
  constructor(options) {
    __publicField(this, "options");
    this.options = __spreadValues2(__spreadValues2({}, defaultOptions), options);
  }
  get cache() {
    return this.options.cache;
  }
  get errors() {
    return this.options.errors;
  }
  requestData(key, fetcher) {
    return Promise.resolve(fetcher(key)).catch((data) => {
      this.errors.emit(key, data);
      return void 0;
    });
  }
  resolveKey(key) {
    if (typeof key === "function") {
      try {
        return key();
      } catch (e) {
        return void 0;
      }
    }
    return key;
  }
  clear(keys, options) {
    const ops = __spreadValues2(__spreadValues2({}, defaultClearOptions), options);
    if (keys === void 0 || keys === null)
      return this.cache.clear(ops);
    if (!Array.isArray(keys))
      return this.cache.remove(keys, ops);
    for (const key of keys)
      this.cache.remove(key, ops);
  }
  revalidate(key, options) {
    if (!key)
      return;
    const { fetcher: defaultFetcher, dedupingInterval: defaultDedupingInterval } = this.options;
    const { force, fetcher, dedupingInterval } = __spreadValues2(__spreadValues2(__spreadValues2({}, defaultRevalidateOptions), { fetcher: defaultFetcher, dedupingInterval: defaultDedupingInterval }), options);
    let data = void 0;
    if (force || !this.cache.has(key) || this.cache.has(key) && this.cache.get(key).hasExpired()) {
      data = this.requestData(key, fetcher);
    }
    if (data !== void 0) {
      this.mutate(key, new CacheItem({ data }).expiresIn(dedupingInterval), {
        revalidate: false
      });
    }
  }
  mutate(key, value, options) {
    if (!key)
      return;
    const { revalidate: revalidateAfterMutation, revalidateOptions } = __spreadValues2(__spreadValues2({}, defaultMutateOptions), options);
    let data;
    if (typeof value === "function") {
      let state = null;
      if (this.cache.has(key)) {
        const item = this.cache.get(key);
        if (!item.isResolving())
          state = item.data;
      }
      data = value(state);
    } else {
      data = value;
    }
    this.cache.set(key, data instanceof CacheItem ? data : new CacheItem({ data }));
    if (revalidateAfterMutation)
      this.revalidate(key, revalidateOptions);
  }
  subscribeData(key, onData) {
    if (key) {
      const handler = (payload) => onData(payload);
      this.cache.subscribe(key, handler);
      return () => this.cache.unsubscribe(key, handler);
    }
    return () => {
    };
  }
  subscribeErrors(key, onError) {
    if (key) {
      const handler = (payload) => onError(payload);
      this.errors.subscribe(key, handler);
      return () => this.errors.unsubscribe(key, handler);
    }
    return () => {
    };
  }
  get(key) {
    if (key && this.cache.has(key)) {
      const item = this.cache.get(key);
      if (!item.isResolving())
        return item.data;
    }
    return void 0;
  }
  getWait(key) {
    return new Promise((resolve, reject) => {
      const unsubscribe = this.subscribeData(key, (data) => {
        unsubscribe();
        return resolve(data);
      });
      const unsubscribeErrors = this.subscribeErrors(key, (error) => {
        unsubscribeErrors();
        return reject(error);
      });
      const current = this.get(key);
      if (current)
        return resolve(current);
    });
  }
  subscribe(key, onData, onError, options) {
    const {
      fetcher,
      initialData,
      loadInitialCache,
      revalidateOnStart,
      dedupingInterval,
      revalidateOnFocus,
      focusThrottleInterval,
      revalidateOnReconnect,
      reconnectWhen,
      focusWhen
    } = __spreadValues2(__spreadValues2({}, this.options), options);
    const mutateCurrent = (value, options2) => {
      return this.mutate(this.resolveKey(key), value, options2);
    };
    const revalidateCurrent = (options2) => {
      return this.revalidate(this.resolveKey(key), options2);
    };
    const revalidateCurrentWithOptions = () => {
      return revalidateCurrent({ fetcher, dedupingInterval });
    };
    if (revalidateOnStart)
      revalidateCurrentWithOptions();
    const unsubscribeData = this.subscribeData(this.resolveKey(key), onData);
    const unsubscribeErrors = this.subscribeErrors(this.resolveKey(key), onError);
    const unsubscribeVisibility = focusWhen(revalidateCurrentWithOptions, {
      throttleInterval: focusThrottleInterval,
      enabled: revalidateOnFocus
    });
    const unsubscribeNetwork = reconnectWhen(revalidateCurrentWithOptions, {
      enabled: revalidateOnReconnect
    });
    const unsubscribe = () => {
      unsubscribeData();
      unsubscribeErrors();
      unsubscribeVisibility == null ? void 0 : unsubscribeVisibility();
      unsubscribeNetwork == null ? void 0 : unsubscribeNetwork();
    };
    if (initialData) {
      mutateCurrent(initialData, { revalidate: false });
    }
    if (loadInitialCache) {
      const cachedData = this.get(this.resolveKey(key));
      if (cachedData)
        onData(cachedData);
    }
    return { unsubscribe };
  }
};

// ../../node_modules/.pnpm/sswr@1.10.0_svelte@3.54.0/node_modules/sswr/dist/sswr.mjs
import { beforeUpdate as _, onDestroy as D } from "svelte";
function h() {
}
function E(t) {
  return t();
}
function q(t) {
  t.forEach(E);
}
function w(t) {
  return typeof t == "function";
}
function K(t, e) {
  return t != t ? e == e : t !== e || t && typeof t == "object" || typeof t == "function";
}
function x(t, ...e) {
  if (t == null)
    return h;
  const n = t.subscribe(...e);
  return n.unsubscribe ? () => n.unsubscribe() : n;
}
Promise.resolve();
var v = [];
function z(t, e) {
  return {
    subscribe: m(t, e).subscribe
  };
}
function m(t, e = h) {
  let n;
  const r = /* @__PURE__ */ new Set();
  function c(i) {
    if (K(t, i) && (t = i, n)) {
      const f = !v.length;
      for (const s of r)
        s[1](), v.push(s, t);
      if (f) {
        for (let s = 0; s < v.length; s += 2)
          v[s][0](v[s + 1]);
        v.length = 0;
      }
    }
  }
  function l(i) {
    c(i(t));
  }
  function d(i, f = h) {
    const s = [i, f];
    return r.add(s), r.size === 1 && (n = e(c) || h), i(t), () => {
      r.delete(s), r.size === 0 && (n(), n = null);
    };
  }
  return { set: c, update: l, subscribe: d };
}
function S(t, e, n) {
  const r = !Array.isArray(t), c = r ? [t] : t, l = e.length < 2;
  return z(n, (d) => {
    let i = false;
    const f = [];
    let s = 0, p = h;
    const o = () => {
      if (s)
        return;
      p();
      const a = e(r ? f[0] : f, d);
      l ? d(a) : p = w(a) ? a : h;
    }, b = c.map((a, g) => x(a, (y) => {
      f[g] = y, s &= ~(1 << g), i && o();
    }, () => {
      s |= 1 << g;
    }));
    return i = true, o(), function() {
      q(b), p();
    };
  });
}
var A = class extends SWR {
  /**
   * Svelte specific use of SWR.
   */
  useSWR(e, n) {
    let r;
    const c = m(void 0, () => () => r == null ? void 0 : r()), l = m(void 0, () => () => r == null ? void 0 : r());
    _(() => {
      const o = (a) => {
        l.set(void 0), c.set(a);
      }, b = (a) => l.set(a);
      r || (r = this.subscribe(e, o, b, __spreadValues({
        loadInitialCache: true
      }, n)).unsubscribe);
    }), D(() => r == null ? void 0 : r());
    const d = (o, b) => this.mutate(this.resolveKey(e), o, __spreadValues({
      revalidateOptions: n
    }, b)), i = (o) => this.revalidate(this.resolveKey(e), __spreadValues(__spreadValues({}, n), o)), f = (o) => this.clear(this.resolveKey(e), o), s = S([c, l], ([o, b]) => o === void 0 && b === void 0), p = S([c, l], ([o, b]) => o !== void 0 && b === void 0);
    return { data: c, error: l, mutate: d, revalidate: i, clear: f, isLoading: s, isValid: p };
  }
};
var W = (t) => new A(t);
var u = W();
var $ = (t, e) => u.useSWR(t, e);

// svelte/use-chat.ts
import { get, writable } from "svelte/store";

// shared/utils.ts
import { customAlphabet } from "nanoid";
var nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  7
);
function createChunkDecoder() {
  const decoder = new TextDecoder();
  return function(chunk) {
    if (!chunk)
      return "";
    return decoder.decode(chunk, { stream: true });
  };
}

// svelte/use-chat.ts
var uniqueId = 0;
var store = {};
function useChat({
  api = "/api/chat",
  id,
  initialMessages = [],
  initialInput = "",
  sendExtraMessageFields,
  onResponse,
  onFinish,
  onError,
  headers,
  body
} = {}) {
  const chatId = id || `chat-${uniqueId++}`;
  const key = `${api}|${chatId}`;
  const { data, mutate: originalMutate } = $(key, {
    fetcher: () => store[key] || initialMessages,
    initialData: initialMessages
  });
  data.set(initialMessages);
  const mutate = (data2) => {
    store[key] = data2;
    return originalMutate(data2);
  };
  const messages = data;
  const error = writable(void 0);
  const isLoading = writable(false);
  let abortController = null;
  function triggerRequest(messagesSnapshot, options) {
    return __async(this, null, function* () {
      try {
        isLoading.set(true);
        abortController = new AbortController();
        const previousMessages = get(messages);
        mutate(messagesSnapshot);
        const res = yield fetch(api, {
          method: "POST",
          body: JSON.stringify(__spreadValues(__spreadValues({
            messages: sendExtraMessageFields ? messagesSnapshot : messagesSnapshot.map(({ role, content }) => ({
              role,
              content
            }))
          }, body), options == null ? void 0 : options.body)),
          headers: __spreadValues(__spreadValues({}, headers), options == null ? void 0 : options.headers),
          signal: abortController.signal
        }).catch((err) => {
          mutate(previousMessages);
          throw err;
        });
        if (onResponse) {
          try {
            yield onResponse(res);
          } catch (err) {
            throw err;
          }
        }
        if (!res.ok) {
          mutate(previousMessages);
          throw new Error(
            (yield res.text()) || "Failed to fetch the chat response."
          );
        }
        if (!res.body) {
          throw new Error("The response body is empty.");
        }
        let result = "";
        const createdAt = /* @__PURE__ */ new Date();
        const replyId = nanoid();
        const reader = res.body.getReader();
        const decoder = createChunkDecoder();
        while (true) {
          const { done, value } = yield reader.read();
          if (done) {
            break;
          }
          result += decoder(value);
          mutate([
            ...messagesSnapshot,
            {
              id: replyId,
              createdAt,
              content: result,
              role: "assistant"
            }
          ]);
          if (abortController === null) {
            reader.cancel();
            break;
          }
        }
        if (onFinish) {
          onFinish({
            id: replyId,
            createdAt,
            content: result,
            role: "assistant"
          });
        }
        abortController = null;
        return result;
      } catch (err) {
        if (err.name === "AbortError") {
          abortController = null;
          return null;
        }
        if (onError && err instanceof Error) {
          onError(err);
        }
        error.set(err);
      } finally {
        isLoading.set(false);
      }
    });
  }
  const append = (message, options) => __async(this, null, function* () {
    if (!message.id) {
      message.id = nanoid();
    }
    return triggerRequest(get(messages).concat(message), options);
  });
  const reload = (options) => __async(this, null, function* () {
    const messagesSnapshot = get(messages);
    if (messagesSnapshot.length === 0)
      return null;
    const lastMessage = messagesSnapshot[messagesSnapshot.length - 1];
    if (lastMessage.role === "assistant") {
      return triggerRequest(messagesSnapshot.slice(0, -1), options);
    }
    return triggerRequest(messagesSnapshot, options);
  });
  const stop = () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  };
  const setMessages = (messages2) => {
    mutate(messages2);
    messages.set(messages2);
  };
  const input = writable(initialInput);
  const handleSubmit = (e) => {
    e.preventDefault();
    const inputValue = get(input);
    if (!inputValue)
      return;
    append({
      content: inputValue,
      role: "user",
      createdAt: /* @__PURE__ */ new Date()
    });
    input.set("");
  };
  return {
    messages,
    append,
    error,
    reload,
    stop,
    setMessages,
    input,
    handleSubmit,
    isLoading
  };
}

// svelte/use-completion.ts
import { get as get2, writable as writable2 } from "svelte/store";
var uniqueId2 = 0;
var store2 = {};
function useCompletion({
  api = "/api/completion",
  id,
  initialCompletion = "",
  initialInput = "",
  headers,
  body,
  onResponse,
  onFinish,
  onError
} = {}) {
  const completionId = id || `completion-${uniqueId2++}`;
  const key = `${api}|${completionId}`;
  const { data, mutate: originalMutate } = $(key, {
    fetcher: () => store2[key] || initialCompletion,
    initialData: initialCompletion
  });
  data.set(initialCompletion);
  const mutate = (data2) => {
    store2[key] = data2;
    return originalMutate(data2);
  };
  const completion = data;
  const error = writable2(void 0);
  const isLoading = writable2(false);
  let abortController = null;
  function triggerRequest(prompt, options) {
    return __async(this, null, function* () {
      try {
        isLoading.set(true);
        abortController = new AbortController();
        mutate("");
        const res = yield fetch(api, {
          method: "POST",
          body: JSON.stringify(__spreadValues(__spreadValues({
            prompt
          }, body), options == null ? void 0 : options.body)),
          headers: __spreadValues(__spreadValues({}, headers), options == null ? void 0 : options.headers),
          signal: abortController.signal
        }).catch((err) => {
          throw err;
        });
        if (onResponse) {
          try {
            yield onResponse(res);
          } catch (err) {
            throw err;
          }
        }
        if (!res.ok) {
          throw new Error(
            (yield res.text()) || "Failed to fetch the chat response."
          );
        }
        if (!res.body) {
          throw new Error("The response body is empty.");
        }
        let result = "";
        const reader = res.body.getReader();
        const decoder = createChunkDecoder();
        while (true) {
          const { done, value } = yield reader.read();
          if (done) {
            break;
          }
          result += decoder(value);
          mutate(result);
          if (abortController === null) {
            reader.cancel();
            break;
          }
        }
        if (onFinish) {
          onFinish(prompt, result);
        }
        abortController = null;
        return result;
      } catch (err) {
        if (err.name === "AbortError") {
          abortController = null;
          return null;
        }
        if (onError && error instanceof Error) {
          onError(error);
        }
        error.set(err);
      } finally {
        isLoading.set(false);
      }
    });
  }
  const complete = (prompt, options) => __async(this, null, function* () {
    return triggerRequest(prompt, options);
  });
  const stop = () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  };
  const setCompletion = (completion2) => {
    mutate(completion2);
  };
  const input = writable2(initialInput);
  const handleSubmit = (e) => {
    e.preventDefault();
    const inputValue = get2(input);
    if (!inputValue)
      return;
    return complete(inputValue);
  };
  return {
    completion,
    complete,
    error,
    stop,
    setCompletion,
    input,
    handleSubmit,
    isLoading
  };
}
export {
  useChat,
  useCompletion
};
