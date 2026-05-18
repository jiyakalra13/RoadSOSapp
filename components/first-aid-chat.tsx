"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, 
  Mic, 
  MicOff,
  Send, 
  Bot,
  User
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { searchOfflineFirstAid, formatGuideResponse, offlineFirstAidGuides } from "@/lib/offline-first-aid"

interface FirstAidChatProps {
  onBack: () => void
  isOnline: boolean
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const quickActions = [
  { label: "Bleeding", query: "How do I stop severe bleeding?" },
  { label: "Burns", query: "What should I do for a burn?" },
  { label: "CPR", query: "How do I perform CPR?" },
  { label: "Choking", query: "What to do if someone is choking?" },
  { label: "Heart Attack", query: "Signs of heart attack" },
  { label: "Stroke", query: "How to recognize a stroke?" },
]

function getAIResponse(query: string): string {
  // Search offline database first
  const guide = searchOfflineFirstAid(query)
  if (guide) {
    return formatGuideResponse(guide)
  }
  
  // Default response with available topics
  const topics = offlineFirstAidGuides.map(g => g.title).slice(0, 6).join(", ")
  return `I can help with first aid guidance. Available topics include: ${topics}, and more.\n\nSelect a quick action above or describe your emergency situation.`
}

export function FirstAidChat({ onBack, isOnline }: FirstAidChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI First Aid assistant. Describe your emergency or select a quick action below. You can also tap the microphone to speak.",
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pendingVoiceMessage = useRef<string | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const processMessage = useCallback(async (text: string) => {
    if (!text.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    await new Promise(r => setTimeout(r, 1000))

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: getAIResponse(text),
      timestamp: new Date(),
    }

    setIsTyping(false)
    setMessages(prev => [...prev, aiMessage])
  }, [])

  // Voice recognition for hands-free input
  const handleVoiceResult = useCallback((transcript: string, isFinal: boolean) => {
    if (isFinal && transcript.trim()) {
      // Store the message and process it
      pendingVoiceMessage.current = transcript.trim()
      processMessage(transcript.trim())
    } else {
      // Show interim results in input
      setInput(transcript)
    }
  }, [processMessage])

  const {
    isListening,
    interimTranscript,
    isSupported: voiceSupported,
    error: voiceError,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition({
    continuous: false,
    interimResults: true,
    onResult: handleVoiceResult
  })

  const handleSend = useCallback((query?: string) => {
    const text = query || input
    if (text.trim()) {
      resetTranscript()
      processMessage(text)
    }
  }, [input, processMessage, resetTranscript])

  const toggleVoice = () => {
    if (isListening) {
      stopListening()
    } else {
      resetTranscript()
      setInput("")
      startListening()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] bg-background overflow-hidden">
      {/* Header */}
      <div className="bg-background border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-foreground">AI First Aid</h1>
            <p className="text-xs text-muted-foreground">
              {isOnline ? "Online - AI powered" : "Offline - Cached guides active"}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions - always visible at top */}
      <div className="px-4 py-2 border-b border-border bg-muted/30 shrink-0">
        <div className="flex gap-2 overflow-x-auto">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              onClick={() => handleSend(action.query)}
              className="text-xs h-7 rounded-full whitespace-nowrap shrink-0"
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-2",
                message.role === "user" && "flex-row-reverse"
              )}
            >
              <div className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center shrink-0",
                message.role === "assistant" 
                  ? "bg-emerald-500" 
                  : "bg-primary"
              )}>
                {message.role === "assistant" ? (
                  <Bot className="h-3.5 w-3.5 text-white" />
                ) : (
                  <User className="h-3.5 w-3.5 text-primary-foreground" />
                )}
              </div>
              <div className={cn(
                "max-w-[75%] rounded-2xl px-3 py-2",
                message.role === "assistant"
                  ? "bg-card border border-border"
                  : "bg-primary text-primary-foreground"
              )}>
                <p className={cn(
                  "text-xs whitespace-pre-wrap leading-relaxed",
                  message.role === "assistant" && "text-foreground"
                )}>
                  {message.content}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2"
          >
            <div className="h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center">
              <Bot className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="bg-card border border-border rounded-2xl px-3 py-2">
              <div className="flex gap-1">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  className="h-1.5 w-1.5 bg-muted-foreground rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  className="h-1.5 w-1.5 bg-muted-foreground rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  className="h-1.5 w-1.5 bg-muted-foreground rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 pb-24 border-t border-border bg-background shrink-0">
        {/* Voice listening indicator */}
        {isListening && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 flex items-center justify-center gap-2 text-emerald-500"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="h-2 w-2 rounded-full bg-emerald-500"
            />
            <span className="text-xs font-medium">Listening... Speak now</span>
          </motion.div>
        )}
        
        {/* Voice error message */}
        {voiceError && (
          <p className="text-xs text-destructive text-center mb-2">{voiceError}</p>
        )}
        
        <div className="flex items-center gap-2">
          <Button
            variant={isListening ? "default" : "ghost"}
            size="icon"
            onClick={toggleVoice}
            disabled={!voiceSupported}
            className={cn(
              "h-9 w-9 rounded-full shrink-0 transition-colors",
              isListening 
                ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                : "text-muted-foreground"
            )}
          >
            {isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
          <Input
            value={isListening ? interimTranscript || input : input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isListening && handleSend()}
            placeholder={isListening ? "Listening..." : "Describe injury or tap mic..."}
            disabled={isListening}
            className="h-9 rounded-full bg-muted border-0 text-sm"
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isListening}
            size="icon"
            className="h-9 w-9 rounded-full bg-emerald-500 hover:bg-emerald-600 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {!voiceSupported && (
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Voice input not supported in this browser
          </p>
        )}
      </div>
    </div>
  )
}
