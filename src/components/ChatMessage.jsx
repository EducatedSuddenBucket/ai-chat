"use client"

import React, { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { nightOwl } from "react-syntax-highlighter/dist/esm/styles/prism"
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism"
import remarkGfm from "remark-gfm"
import { ClipboardCopy, Check } from "lucide-react"

// Create a separate component for the code block to isolate state
const CodeBlock = ({ language, code }) => {
  const [isCopied, setIsCopied] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Track dark mode changes
  useEffect(() => {
    const updateTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"))
    }

    // Initial check
    updateTheme()

    // Create observer to watch for class changes on html element
    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setIsCopied(true)

      setTimeout(() => {
        setIsCopied(false)
      }, 3000)
    } catch (error) {
      console.error("Failed to copy code:", error)
    }
  }

  return (
    <div className={`relative overflow-hidden rounded-lg border ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}>
      <div
        className={`flex items-center justify-between px-4 py-2 text-sm ${
          isDarkMode ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-800"
        }`}
      >
        <span className="font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="hover:text-primary-500 transition-colors p-1 rounded"
          aria-label={isCopied ? "Copied!" : "Copy code"}
          title={isCopied ? "Copied!" : "Copy code"}
        >
          {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <ClipboardCopy className="w-4 h-4" />}
        </button>
      </div>
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          style={isDarkMode ? nightOwl : oneLight}
          language={language}
          PreTag="div"
          className="!rounded-t-none !mt-0"
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

const ChatMessage = ({ message }) => {
  const isUser = message.role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 animate-fadeIn`}>
      <div
        className={`px-4 py-3 rounded-2xl max-w-[85%] break-words overflow-wrap-anywhere ${
          isUser
            ? "bg-primary-500 text-white rounded-tr-none"
            : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none"
        }`}
      >
        <div className="prose dark:prose-invert max-w-none overflow-x-auto break-words">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "")
                const language = match ? match[1] : "text"
                const codeString = String(children).replace(/\n$/, "")

                return !inline ? (
                  <CodeBlock language={language} code={codeString} />
                ) : (
                  <code className={`${className} break-all`} {...props}>
                    {children}
                  </code>
                )
              },
              p: ({ children }) => <p className="break-words overflow-wrap-anywhere">{children}</p>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}

export default ChatMessage
