// Thin OpenAI-shaped wrapper around Anthropic's Messages API. Callers build
// requests/read responses in the old OpenAI chat-completions shape (kept
// so server/routers/*.ts didn't need to change); this file translates to
// and from Anthropic's actual request/response format.

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-sonnet-5";
const DEFAULT_MAX_TOKENS = 8192;

const assertApiKey = () => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
};

// ---------------------------------------------------------------------------
// Request translation: our OpenAI-shaped Message[] -> Anthropic's shape
// ---------------------------------------------------------------------------

type AnthropicContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "url"; url: string } | { type: "base64"; media_type: string; data: string } }
  | { type: "document"; source: { type: "url"; url: string } }
  | { type: "tool_result"; tool_use_id: string; content: string };

type AnthropicMessage = {
  role: "user" | "assistant";
  content: AnthropicContentBlock[];
};

const toAnthropicContentBlock = (part: MessageContent): AnthropicContentBlock => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return { type: "text", text: part.text };
  }

  if (part.type === "image_url") {
    return { type: "image", source: { type: "url", url: part.image_url.url } };
  }

  if (part.type === "file_url") {
    if (part.file_url.mime_type === "application/pdf") {
      return { type: "document", source: { type: "url", url: part.file_url.url } };
    }
    throw new Error(`Unsupported file_url mime_type for Anthropic: ${part.file_url.mime_type}`);
  }

  throw new Error("Unsupported message content part");
};

const ensureArray = (value: MessageContent | MessageContent[]): MessageContent[] =>
  Array.isArray(value) ? value : [value];

/** Extracts system prompt text and converts the rest into Anthropic's message list. */
const toAnthropicMessages = (
  messages: Message[]
): { system: string | undefined; messages: AnthropicMessage[] } => {
  const systemParts: string[] = [];
  const converted: AnthropicMessage[] = [];

  for (const message of messages) {
    if (message.role === "system") {
      const text = ensureArray(message.content)
        .map(part => (typeof part === "string" ? part : "text" in part ? part.text : ""))
        .join("\n");
      if (text) systemParts.push(text);
      continue;
    }

    if (message.role === "tool" || message.role === "function") {
      const text = ensureArray(message.content)
        .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
        .join("\n");
      converted.push({
        role: "user",
        content: [
          { type: "tool_result", tool_use_id: message.tool_call_id ?? "unknown", content: text },
        ],
      });
      continue;
    }

    converted.push({
      role: message.role === "assistant" ? "assistant" : "user",
      content: ensureArray(message.content).map(toAnthropicContentBlock),
    });
  }

  return { system: systemParts.length > 0 ? systemParts.join("\n\n") : undefined, messages: converted };
};

const resolveResponseFormat = (params: InvokeParams) => {
  const explicit = params.responseFormat || params.response_format;
  if (explicit) {
    if (explicit.type === "json_schema" && !explicit.json_schema?.schema) {
      throw new Error("responseFormat json_schema requires a defined schema object");
    }
    return explicit;
  }

  const schema = params.outputSchema || params.output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return { type: "json_schema" as const, json_schema: schema };
};

/**
 * Anthropic has no first-class "response_format" like OpenAI — the reliable
 * way to get JSON back is a firm instruction (+ schema) in the system prompt.
 */
const buildJsonInstruction = (format: ReturnType<typeof resolveResponseFormat>) => {
  if (!format || format.type === "text") return undefined;

  if (format.type === "json_schema") {
    return `You must respond with ONLY valid JSON — no markdown, no code fences, no explanation. The JSON must conform to this schema (name: ${format.json_schema.name}):\n${JSON.stringify(format.json_schema.schema)}`;
  }

  return "You must respond with ONLY valid JSON — no markdown, no code fences, no explanation.";
};

// ---------------------------------------------------------------------------
// Response translation: Anthropic's shape -> our OpenAI-shaped InvokeResult
// ---------------------------------------------------------------------------

type AnthropicResponse = {
  id: string;
  model: string;
  role: "assistant";
  content: Array<{ type: "text"; text: string } | { type: "tool_use"; id: string; name: string; input: unknown }>;
  stop_reason: string | null;
  usage?: { input_tokens: number; output_tokens: number };
};

const toInvokeResult = (response: AnthropicResponse): InvokeResult => {
  const textParts = response.content
    .filter((block): block is { type: "text"; text: string } => block.type === "text")
    .map(block => block.text);

  const toolCalls: ToolCall[] = response.content
    .filter((block): block is { type: "tool_use"; id: string; name: string; input: unknown } => block.type === "tool_use")
    .map(block => ({
      id: block.id,
      type: "function" as const,
      function: { name: block.name, arguments: JSON.stringify(block.input) },
    }));

  return {
    id: response.id,
    created: Math.floor(Date.now() / 1000),
    model: response.model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: textParts.join("\n"),
          ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
        },
        finish_reason: response.stop_reason,
      },
    ],
    usage: response.usage
      ? {
          prompt_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          total_tokens: response.usage.input_tokens + response.usage.output_tokens,
        }
      : undefined,
  };
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();

  const { system, messages } = toAnthropicMessages(params.messages);
  const responseFormat = resolveResponseFormat(params);
  const jsonInstruction = buildJsonInstruction(responseFormat);
  const fullSystem = [system, jsonInstruction].filter(Boolean).join("\n\n") || undefined;

  const payload: Record<string, unknown> = {
    model: DEFAULT_MODEL,
    max_tokens: params.maxTokens ?? params.max_tokens ?? DEFAULT_MAX_TOKENS,
    messages,
    ...(fullSystem ? { system: fullSystem } : {}),
  };

  const tools = params.tools;
  if (tools && tools.length > 0) {
    payload.tools = tools.map(tool => ({
      name: tool.function.name,
      description: tool.function.description,
      input_schema: tool.function.parameters ?? { type: "object", properties: {} },
    }));

    const toolChoice = params.toolChoice ?? params.tool_choice;
    if (toolChoice === "required") {
      payload.tool_choice = { type: "any" };
    } else if (toolChoice === "auto" || toolChoice === undefined) {
      // Anthropic defaults to auto when tools are present.
    } else if (toolChoice === "none") {
      delete payload.tools;
    } else if ("name" in toolChoice) {
      payload.tool_choice = { type: "tool", name: toolChoice.name };
    } else if (toolChoice.type === "function") {
      payload.tool_choice = { type: "tool", name: toolChoice.function.name };
    }
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  const data = (await response.json()) as AnthropicResponse;
  return toInvokeResult(data);
}
