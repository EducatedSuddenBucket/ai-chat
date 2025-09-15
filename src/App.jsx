"use client"

import { useState, useEffect } from "react"
import Sidebar from "./components/Sidebar"
import ChatContainer from "./components/ChatContainer"
import ChatInput from "./components/ChatInput"
import ModelSelector from "./components/ModelSelector"
import { createChatCompletion } from "./services/api"
import { createNewChat, loadHistory, saveHistory } from "./utils/storage"

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode")
    return savedMode ? JSON.parse(savedMode) : window.matchMedia("(prefers-color-scheme: dark)").matches
  })

  const [chatHistory, setChatHistory] = useState([])
  const [currentChatId, setCurrentChatId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentMessages, setCurrentMessages] = useState([])
  const [selectedModel, setSelectedModel] = useState("meta-ai/Llama-4-Maverick-17B-128E-Instruct")
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    const history = loadHistory()
    setChatHistory(history)

    if (history.length > 0) {
      const mostRecent = history.sort((a, b) => b.createdAt - a.createdAt)[0]
      setCurrentChatId(mostRecent.id)
      setCurrentMessages(mostRecent.messages)
      setSelectedModel(mostRecent.model)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode))
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  useEffect(() => {
    if (currentChatId) {
      const currentChat = chatHistory.find((chat) => chat.id === currentChatId)
      if (currentChat) {
        setCurrentMessages(currentChat.messages)
        setSelectedModel(currentChat.model)
      }
    }
  }, [currentChatId, chatHistory])

  const handleNewChat = () => {
    if (!selectedModel) return

    const newChat = createNewChat(selectedModel)
    const updatedHistory = [newChat, ...chatHistory]

    setChatHistory(updatedHistory)
    setCurrentChatId(newChat.id)
    setCurrentMessages([])
    saveHistory(updatedHistory)
  }

  const handleSelectChat = (chatId) => {
    setCurrentChatId(chatId)
  }

  const handleDeleteChat = (chatId) => {
    const updatedHistory = chatHistory.filter((chat) => chat.id !== chatId)
    setChatHistory(updatedHistory)
    saveHistory(updatedHistory)

    if (currentChatId === chatId) {
      if (updatedHistory.length > 0) {
        setCurrentChatId(updatedHistory[0].id)
      } else {
        setCurrentChatId(null)
        setCurrentMessages([])
      }
    }
  }

  const handleRenameChat = (chatId, newTitle) => {
    const updatedHistory = chatHistory.map((chat) => {
      if (chat.id === chatId) {
        return { ...chat, title: newTitle }
      }
      return chat
    })
    setChatHistory(updatedHistory)
    saveHistory(updatedHistory)
  }

  const handleMobileToggle = () => {
    setIsMobileOpen(!isMobileOpen)
  }

  const handleSendMessage = async (content) => {
    if (!selectedModel) return

    let chatId = currentChatId
    let updatedHistory = [...chatHistory]

    if (!chatId) {
      const newChat = createNewChat(selectedModel)
      chatId = newChat.id
      updatedHistory = [newChat, ...chatHistory]
      setChatHistory(updatedHistory)
      setCurrentChatId(chatId)
    }

    const userMessage = { role: "user", content }
    const updatedMessages = [...currentMessages, userMessage]
    setCurrentMessages(updatedMessages)

    // Update the chat history with the new message
    updatedHistory = updatedHistory.map((chat) => {
      if (chat.id === chatId) {
        return { ...chat, messages: updatedMessages }
      }
      return chat
    })

    // Update title for new chats
    if (currentMessages.length === 0) {
      const title = content.split(" ").slice(0, 4).join(" ") + "..."
      updatedHistory = updatedHistory.map((chat) => {
        if (chat.id === chatId) {
          return { ...chat, title }
        }
        return chat
      })
    }

    setChatHistory(updatedHistory)
    saveHistory(updatedHistory)

    setIsLoading(true)

    try {
      const response = await createChatCompletion({
        model: selectedModel,
        messages: updatedMessages,
        stream: true,
      })

      if (response.body) {
        let assistantMessage = { role: "assistant", content: "" }
        const updatedWithAssistant = [...updatedMessages, assistantMessage]
        setCurrentMessages(updatedWithAssistant)

        const reader = response.body.getReader()
        const decoder = new TextDecoder("utf-8")
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          buffer += chunk

          const lines = buffer.split("\n")
          buffer = lines.pop() || "" // Keep the last incomplete line in the buffer

          for (const line of lines) {
            const trimmedLine = line.trim()
            if (!trimmedLine || trimmedLine === "data: [DONE]") continue

            try {
              const dataString = trimmedLine.replace(/^data: /, "")
              if (dataString === "[DONE]") continue

              let data
              try {
                data = JSON.parse(dataString)
              } catch (parseError) {
                console.error("Failed to parse SSE data:", {
                  raw: dataString,
                  error: parseError,
                })
                continue
              }

              const content = data.choices[0]?.delta?.content || ""

              assistantMessage = {
                ...assistantMessage,
                content: assistantMessage.content + content,
              }

              setCurrentMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = assistantMessage
                return updated
              })
            } catch (e) {
              console.error("Error processing SSE line:", {
                line: trimmedLine,
                error: e,
              })
            }
          }
        }

        // Update chat history with the final assistant message
        const finalMessages = [...updatedMessages, assistantMessage]
        const finalHistory = updatedHistory.map((chat) => {
          if (chat.id === chatId) {
            return { ...chat, messages: finalMessages }
          }
          return chat
        })

        setChatHistory(finalHistory)
        saveHistory(finalHistory)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again.",
      }
      setCurrentMessages([...updatedMessages, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectModel = (modelId) => {
    setSelectedModel(modelId)

    if (currentChatId) {
      const updatedHistory = chatHistory.map((chat) => {
        if (chat.id === currentChatId) {
          return { ...chat, model: modelId }
        }
        return chat
      })

      setChatHistory(updatedHistory)
      saveHistory(updatedHistory)
    }
  }

  return (
    <div className={`flex h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100`}>
      <Sidebar
        chatHistory={chatHistory}
        currentChatId={currentChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        isDarkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
        isMobileOpen={isMobileOpen}
        onMobileToggle={handleMobileToggle}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-14 border-b border-gray-200 dark:border-gray-800 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleMobileToggle}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold">
              {currentChatId ? chatHistory.find((chat) => chat.id === currentChatId)?.title || "Chat" : "New Chat"}
            </h1>
          </div>
          <div className="w-64">
            <ModelSelector selectedModel={selectedModel} onSelectModel={handleSelectModel} />
          </div>
        </header>

        <main className="flex-1 flex flex-col overflow-hidden">
          <ChatContainer messages={currentMessages} isLoading={isLoading} />

          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
