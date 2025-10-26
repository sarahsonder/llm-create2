import { useEffect, useState, useRef, useMemo } from "react";
import { FiSend } from "react-icons/fi";
import { Button, Textarea } from "@chakra-ui/react";
import { nanoid } from "nanoid";
import type { Message, Stage } from "../../types";
import { Role } from "../../types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatTabProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  stage: Stage;
  selectedWordIndexes?: number[];
}

const systemMessageDefault =
  "You are a helpful blackout poetry assistant. Blackout poetry is a form poetry where given a passage, you select words from that passage to create a poem. Words must be selected in order as they appear in the passage. Additional words or punctuation that is not included in the original passage may not be included in the poem.";

const passage =
  "Twilight settled over Zuckerman’s barn, and a feeling of peace. Fern knew it was almost suppertime but she couldn’t bear to leave. Swallows passed on silent wings, in and out of the doorways, bringing food to their young ones. From across the road a bird sang “Whippoorwill, whippoorwill!” Lurvy sat down under an apple tree and lit his pipe; the animals sniffed the familiar smell of strong tobacco. Wilbur heard the trill of the tree toad and the occasional slamming of the kitchen door. All these sounds made him feel comfortable and happy, for he loved life and loved to be a part of the world on a summer evening. But as he lay there he remembered what the old sheep had told him. The thought of death came to him and he began to tremble with fear.";

export default function ChatTab({
  messages,
  setMessages,
  selectedWordIndexes,
  stage,
}: ChatTabProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const systemMessageStage =
    systemMessageDefault +
    (stage == "SPARK"
      ? `The user is in the SPARK stage.`
      : `The user is in the WRITE stage.`);

  const [isLLMLoading, setIsLLMLoading] = useState(false);
  const [input, setInput] = useState("");
  // const [lastResponseId] = useState<string | null>(null);
  const [markdownOutput, setMarkdownOutput] = useState("");
  const [hasUsedFirstPrompt, setHasUsedFirstPrompt] = useState(false);

  const systemMessage = useMemo(() => {
    const words = passage.split(/\s+/);
    const selectedWords =
      selectedWordIndexes
        ?.sort()
        .map((i) => words[i])
        .join(" ") || "";

    return {
      role: "system",
      content:
        systemMessageStage +
        `The passage is: ${passage}, and the currently selected words are: ${
          selectedWords || "none yet"
        }`,
    };
  }, [selectedWordIndexes]);

  const promptSuggestions = [
    "How to write a blackout poem",
    "What emotions are conveyed in this text",
    "What themes appear in this text",
  ];

  const openingMessage = {
    role: Role.LLM,
    content:
      "Hello! I'm your assistant for today. I am just ChatGPT, so feel free to use me just as you would in your day-to-day activities. I'm here to help you brainstorm, refine, or analyze blackout poetry as you create your own piece.",
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isLLMLoading]);

  const handlePromptSelection = (prompt: string) => {
    setInput(prompt);
    setHasUsedFirstPrompt(true);
    sendMessage(prompt);
  };

  const sendMessage = async (messageContent?: string) => {
    const content = messageContent || input;
    if (!content.trim()) return;

    const artistMessage: Message = {
      id: nanoid(),
      role: Role.ARTIST,
      content: content,
      timestamp: new Date(),
    };

    const strippedMessages = messages.map(({ id, timestamp, ...rest }) => rest);

    setMarkdownOutput("");
    setMessages((prev) => [...prev, artistMessage]);
    setInput("");
    setIsLLMLoading(true); // start typing animation
    const newMessages = [
      systemMessage,
      openingMessage,
      ...strippedMessages,
      { role: Role.ARTIST, content: content },
    ];

    try {
      const response = await fetch("/api/llm/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
        }),
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder("utf-8");

      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        const lines = chunk
          .split("\n")
          .filter((line) => line.trim().startsWith("data:"));

        for (const line of lines) {
          const json = line.replace("data: ", "").trim();

          if (json === "[DONE]") {
            const llmMessage: Message = {
              id: nanoid(),
              role: Role.LLM,
              content: fullText,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, llmMessage]);
            return;
          }

          try {
            const parsed = JSON.parse(json);
            const delta = parsed.content; // ✅ matches what server sends
            if (delta) {
              if (delta.includes("\n\n")) {
                // Add an extra newline at the end
                fullText += delta + "\n";
              } else {
                fullText += delta;
              }
              setMarkdownOutput(fullText);
            }
          } catch (err) {
            console.error("Error parsing JSON chunk:", err, "Raw:", json);
          }
        }
      }
    } catch (error) {
      console.error("LLM response failed", error);
    } finally {
      setIsLLMLoading(false);
    }
  };

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full w-full mx-auto overflow-hidden">
      {/* Chat messages */}
      <div
        className="flex-1 overflow-y-auto w-full p-4 space-y-3"
        ref={chatContainerRef}
      >
        <div className="py-2 rounded-lg transition-all w-full max-w-3/4 duration-300 ease-out opacity-0 translate-y-2 animate-fade-in self-start text-left">
          <ReactMarkdown
            children={openingMessage.content}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[]}
          />

          {/* Show prompt suggestions only if no messages have been sent yet */}
          {messages.length === 0 && !hasUsedFirstPrompt && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-600 mb-3">Try asking me:</p>
              <div className="flex flex-wrap gap-2">
                {promptSuggestions.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handlePromptSelection(prompt)}
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 transition-colors duration-200 text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`py-2 rounded-lg transition-all w-max max-w-full duration-300 ease-out opacity-0 translate-y-2 animate-fade-in 
            ${
              msg.role === Role.ARTIST
                ? "px-4 bg-dark-grey bg-opacity-90 text-white justify-self-end self-end text-right "
                : "self-start text-left"
            }`}
          >
            <ReactMarkdown
              children={msg.content}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[]}
            />
          </div>
        ))}

        {isLLMLoading && (
          <div>
            {!markdownOutput ? (
              <div className="flex items-center space-x-2 mt-2">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                </div>
              </div>
            ) : (
              <div
                className={`py-2 rounded-lg transition-all w-full max-w-3/4 duration-300 ease-out opacity-0 translate-y-2 animate-fade-in self-start text-left `}
              >
                <ReactMarkdown
                  children={markdownOutput}
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[]}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="text-main bg-white flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-grey"
          />
          <Button className="btn-small" onClick={() => sendMessage()}>
            <FiSend />
          </Button>
        </form>
      </div>
    </div>
  );
}
