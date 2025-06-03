"use client"

import React, { useState } from "react"
import { PlusCircle, MessageSquare, Trash2, Pencil } from "lucide-react"

const Sidebar = ({
  chatHistory,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  isDarkMode,
  toggleDarkMode,
  isMobileOpen,
  onMobileToggle,
}) => {
  const [editingChatId, setEditingChatId] = useState(null)
  const [editTitle, setEditTitle] = useState("")

  const handleStartEdit = (chatId, currentTitle) => {
    setEditingChatId(chatId)
    setEditTitle(currentTitle)
  }

  const handleSaveEdit = (chatId) => {
    if (editTitle.trim()) {
      onRenameChat(chatId, editTitle.trim())
    }
    setEditingChatId(null)
  }

  const handleKeyDown = (e, chatId) => {
    if (e.key === "Enter") {
      handleSaveEdit(chatId)
    } else if (e.key === "Escape") {
      setEditingChatId(null)
    }
  }

  const handleChatSelect = (chatId) => {
    onSelectChat(chatId)
    // Close mobile sidebar when selecting a chat
    if (window.innerWidth < 768) {
      onMobileToggle()
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={onMobileToggle} />}

      {/* Sidebar */}
      <aside
        className={`
        fixed md:relative top-0 left-0 z-50 md:z-auto
        w-64 h-full bg-gray-50 dark:bg-gray-900 
        border-r border-gray-200 dark:border-gray-800 
        flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            <PlusCircle size={16} />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {chatHistory.length > 0 ? (
            <ul className="space-y-1">
              {chatHistory.map((chat) => (
                <li key={chat.id}>
                  <div
                    className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer ${
                      currentChatId === chat.id
                        ? "bg-primary-50 dark:bg-primary-900/30"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {editingChatId === chat.id ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleSaveEdit(chat.id)}
                        onKeyDown={(e) => handleKeyDown(e, chat.id)}
                        className="flex-1 bg-transparent border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-primary-500"
                        autoFocus
                      />
                    ) : (
                      <>
                        <button
                          className="flex-1 flex items-center gap-2 text-left truncate"
                          onClick={() => handleChatSelect(chat.id)}
                        >
                          <MessageSquare size={16} className="shrink-0 text-gray-500 dark:text-gray-400" />
                          <span className="truncate">{chat.title}</span>
                        </button>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartEdit(chat.id, chat.title)
                            }}
                            className="text-gray-400 hover:text-primary-500 dark:hover:text-primary-400"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteChat(chat.id)
                            }}
                            className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400 text-sm">
              <p>No chat history yet</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleDarkMode} />
        </div>
      </aside>
    </>
  )
}

const ThemeToggle = ({ isDarkMode, onToggle }) => {
  return (
    <label className="relative inline-block w-16 h-8 cursor-pointer">
      <input type="checkbox" checked={isDarkMode} onChange={onToggle} className="sr-only" />
      <div
        className={`
        absolute inset-0 rounded-full transition-all duration-300 ease-in-out
        ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}
        shadow-inner
      `}
      >
        <div
          className={`
          absolute top-0.5 left-0.5 w-7 h-7 bg-white rounded-full
          transition-all duration-300 ease-in-out
          flex items-center justify-center
          shadow-md
          ${isDarkMode ? "translate-x-8 bg-gray-800" : "translate-x-0"}
        `}
        >
          {isDarkMode ? (
            <svg
              className="w-3.5 h-3.5 text-gray-300"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 384 512"
              fill="currentColor"
            >
              <path d="M223.5 32C100 32 0 132.3 0 256S100 480 223.5 480c60.6 0 115.5-24.2 155.8-63.4c5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6c-96.9 0-175.5-78.8-175.5-176c0-65.8 36-123.1 89.3-153.3c6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z" />
            </svg>
          ) : (
            <svg
              className="w-3.5 h-3.5 text-yellow-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              fill="currentColor"
            >
              <path d="M361.5 1.2c5 2.1 8.6 6.6 9.6 11.9L391 121l107.9 19.8c5.3 1 9.8 4.6 11.9 9.6s1.5 10.7-1.6 15.2L446.9 256l62.3 90.3c3.1 4.5 3.7 10.2 1.6 15.2s-6.6 8.6-11.9 9.6L391 391 371.1 498.9c-1 5.3-4.6 9.8-9.6 11.9s-10.7 1.5-15.2-1.6L256 446.9l-90.3 62.3c-4.5 3.1-10.2 3.7-15.2 1.6s-8.6-6.6-9.6-11.9L121 391 13.1 371.1c-5.3-1-9.8-4.6-11.9-9.6s-1.5-10.7 1.6-15.2L65.1 256 2.8 165.7c-3.1-4.5-3.7-10.2-1.6-15.2s6.6-8.6 11.9-9.6L121 121 140.9 13.1c1-5.3 4.6-9.8 9.6-11.9s10.7-1.5 15.2 1.6L256 65.1 346.3 2.8c4.5-3.1 10.2-3.7 15.2-1.6zM160 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zm224 0a128 128 0 1 0 -256 0 128 128 0 1 0 256 0z" />
            </svg>
          )}
        </div>
      </div>
    </label>
  )
}

export default Sidebar