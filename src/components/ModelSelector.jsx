"use client"

import { useEffect, useState } from "react"
import { ChevronDown, Loader2 } from "lucide-react"
import { fetchModels } from "../services/api"

const ModelSelector = ({ selectedModel, onSelectModel }) => {
  const [models, setModels] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true)
        const response = await fetchModels()
        setModels(response.data)
        
        // Set DeepSeek V3 as default model if no model is currently selected
        if (!selectedModel && response.data.some((model) => model.id === "deepseek-ai/DeepSeek-V3-0324")) {
          onSelectModel("deepseek-ai/DeepSeek-V3-0324")
        }
      } catch (err) {
        setError("Failed to load models")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    loadModels()
  }, [])

  const getDisplayName = (modelId) => {
    // Format model name for better display 
    return modelId.split("/").pop()?.replace(/-/g, " ") || modelId
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
      >
        {isLoading ? (
          <div className="flex items-center">
            <Loader2 size={16} className="mr-2 animate-spin" />
            <span>Loading models...</span>
          </div>
        ) : (
          <>
            <span className="truncate">{selectedModel ? getDisplayName(selectedModel) : "Select a model"}</span>
            <ChevronDown size={16} className="ml-2" />
          </>
        )}
      </button>
      {isOpen && !isLoading && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
          {error ? (
            <div className="px-4 py-2 text-red-500">{error}</div>
          ) : (
            <ul>
              {models.map((model) => (
                <li key={model.id}>
                  <button
                    onClick={() => {
                      onSelectModel(model.id)
                      setIsOpen(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      selectedModel === model.id
                        ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                        : "text-gray-700 dark:text-gray-200"
                    }`}
                  >
                    {getDisplayName(model.id)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default ModelSelector