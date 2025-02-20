var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
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
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// streams/ai-stream.ts
import {
  createParser
} from "eventsource-parser";
function createEventStreamTransformer(customParser) {
  const textDecoder = new TextDecoder();
  let eventSourceParser;
  return new TransformStream({
    start(controller) {
      return __async(this, null, function* () {
        eventSourceParser = createParser(
          (event) => {
            if ("data" in event && event.type === "event" && event.data === "[DONE]") {
              controller.terminate();
              return;
            }
            if ("data" in event) {
              const parsedMessage = customParser(event.data);
              if (parsedMessage)
                controller.enqueue(parsedMessage);
            }
          }
        );
      });
    },
    transform(chunk) {
      eventSourceParser.feed(textDecoder.decode(chunk));
    }
  });
}
function createCallbacksTransformer(callbacks) {
  const textEncoder = new TextEncoder();
  let aggregatedResponse = "";
  const { onStart, onToken, onCompletion } = callbacks || {};
  return new TransformStream({
    start() {
      return __async(this, null, function* () {
        if (onStart)
          yield onStart();
      });
    },
    transform(message, controller) {
      return __async(this, null, function* () {
        controller.enqueue(textEncoder.encode(message));
        if (onToken)
          yield onToken(message);
        if (onCompletion)
          aggregatedResponse += message;
      });
    },
    flush() {
      return __async(this, null, function* () {
        if (onCompletion)
          yield onCompletion(aggregatedResponse);
      });
    }
  });
}
function trimStartOfStreamHelper() {
  let isStreamStart = true;
  return (text) => {
    if (isStreamStart) {
      text = text.trimStart();
      if (text)
        isStreamStart = false;
    }
    return text;
  };
}
function AIStream(response, customParser, callbacks) {
  if (!response.ok) {
    throw new Error(
      `Failed to convert the response to stream. Received status code: ${response.status}.`
    );
  }
  const responseBodyStream = response.body || createEmptyReadableStream();
  return responseBodyStream.pipeThrough(createEventStreamTransformer(customParser)).pipeThrough(createCallbacksTransformer(callbacks));
}
function createEmptyReadableStream() {
  return new ReadableStream({
    start(controller) {
      controller.close();
    }
  });
}

// streams/openai-stream.ts
function parseOpenAIStream() {
  const trimStartOfStream = trimStartOfStreamHelper();
  return (data) => {
    var _a, _b, _c, _d, _e;
    const json = JSON.parse(data);
    const text = trimStartOfStream(
      (_e = (_d = (_b = (_a = json.choices[0]) == null ? void 0 : _a.delta) == null ? void 0 : _b.content) != null ? _d : (_c = json.choices[0]) == null ? void 0 : _c.text) != null ? _e : ""
    );
    return text;
  };
}
function OpenAIStream(res, cb) {
  return AIStream(res, parseOpenAIStream(), cb);
}

// streams/streaming-text-response.ts
var StreamingTextResponse = class extends Response {
  constructor(res, init) {
    super(res, __spreadProps(__spreadValues({}, init), {
      status: 200,
      headers: __spreadValues({
        "Content-Type": "text/plain; charset=utf-8"
      }, init == null ? void 0 : init.headers)
    }));
  }
};
function streamToResponse(res, response, init) {
  response.writeHead((init == null ? void 0 : init.status) || 200, __spreadValues({
    "Content-Type": "text/plain; charset=utf-8"
  }, init == null ? void 0 : init.headers));
  const reader = res.getReader();
  function read() {
    reader.read().then(({ done, value }) => {
      if (done) {
        response.end();
        return;
      }
      response.write(value);
      read();
    });
  }
  read();
}

// streams/huggingface-stream.ts
function createParser2(res) {
  const trimStartOfStream = trimStartOfStreamHelper();
  return new ReadableStream({
    pull(controller) {
      return __async(this, null, function* () {
        var _a2, _b;
        const { value, done } = yield res.next();
        if (done) {
          controller.close();
          return;
        }
        const text = trimStartOfStream((_b = (_a2 = value.token) == null ? void 0 : _a2.text) != null ? _b : "");
        if (!text)
          return;
        if (value.generated_text != null && value.generated_text.length > 0) {
          controller.close();
          return;
        }
        if (text === "</s>" || text === "<|endoftext|>") {
          controller.close();
        } else {
          controller.enqueue(text);
        }
      });
    }
  });
}
function HuggingFaceStream(res, callbacks) {
  return createParser2(res).pipeThrough(createCallbacksTransformer(callbacks));
}

// streams/cohere-stream.ts
function createParser3(res) {
  return new ReadableStream({
    pull(controller) {
      return __async(this, null, function* () {
        const { value, done } = yield res.next();
        if (done) {
          controller.close();
          return;
        }
        const { text, is_finished } = JSON.parse(value);
        if (is_finished === true) {
          controller.close();
        } else {
          controller.enqueue(text);
        }
      });
    }
  });
}
function CohereStream(res, callbacks) {
  return createParser3(res).pipeThrough(createCallbacksTransformer(callbacks));
}

// streams/anthropic-stream.ts
function parseAnthropicStream() {
  let previous = "";
  return (data) => {
    const json = JSON.parse(data);
    const text = json.completion;
    const delta = text.slice(previous.length);
    previous = text;
    return delta;
  };
}
function AnthropicStream(res, cb) {
  return AIStream(res, parseAnthropicStream(), cb);
}

// streams/langchain-stream.ts
function LangChainStream(callbacks) {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  return {
    stream: stream.readable.pipeThrough(createCallbacksTransformer(callbacks)),
    handlers: {
      handleLLMNewToken: (token) => __async(this, null, function* () {
        yield writer.ready;
        yield writer.write(token);
      }),
      handleChainEnd: () => __async(this, null, function* () {
        yield writer.ready;
        yield writer.close();
      }),
      handleLLMError: (e) => __async(this, null, function* () {
        yield writer.ready;
        yield writer.abort(e);
      })
    }
  };
}
export {
  AIStream,
  AnthropicStream,
  CohereStream,
  HuggingFaceStream,
  LangChainStream,
  OpenAIStream,
  StreamingTextResponse,
  createCallbacksTransformer,
  createEventStreamTransformer,
  streamToResponse,
  trimStartOfStreamHelper
};
