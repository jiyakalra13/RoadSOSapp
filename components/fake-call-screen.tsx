"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Phone, PhoneOff, User, MicOff, Volume2, Mic, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FakeCallScreenProps {
  callerName: string
  delaySeconds: number
  onEndCall: () => void
}

type CallState = "waiting" | "ringing" | "answered"

export function FakeCallScreen({ callerName, delaySeconds, onEndCall }: FakeCallScreenProps) {
  const [callState, setCallState] = useState<CallState>("waiting")
  const [callDuration, setCallDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeaker, setIsSpeaker] = useState(false)

  const ringIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const waitTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const audioCtxRef = useRef<any>(null)

  // Initialize audio and handle waiting countdown
  useEffect(() => {
    // We create a simple oscillator-based ringtone since we might not have an mp3 file
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    audioCtxRef.current = audioCtx

    const playRingTone = () => {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume()
      }
      
      const osc1 = audioCtx.createOscillator()
      const osc2 = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      
      osc1.type = 'sine'
      osc2.type = 'sine'
      osc1.frequency.setValueAtTime(440, audioCtx.currentTime) // A4
      osc2.frequency.setValueAtTime(480, audioCtx.currentTime) 
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.1)
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2)
      
      osc1.connect(gainNode)
      osc2.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      
      osc1.start()
      osc2.start()
      osc1.stop(audioCtx.currentTime + 2)
      osc2.stop(audioCtx.currentTime + 2)
      
      if ("vibrate" in navigator) {
        navigator.vibrate([1000, 1000])
      }
    }

    waitTimeoutRef.current = setTimeout(() => {
      setCallState("ringing")
      playRingTone() // Initial ring
      ringIntervalRef.current = setInterval(playRingTone, 3000) // Ring every 3 seconds
    }, delaySeconds * 1000)

    return () => {
      if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current)
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current)
      if (audioCtxRef.current?.state !== 'closed') {
        audioCtxRef.current?.close().catch(() => {})
      }
      if ("vibrate" in navigator) {
        navigator.vibrate(0)
      }
    }
  }, [delaySeconds])

  // Handle call duration timer when answered
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (callState === "answered") {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [callState])

  const handleAccept = () => {
    setCallState("answered")
    if (ringIntervalRef.current) clearInterval(ringIntervalRef.current)
    if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current)
    if (audioCtxRef.current?.state !== 'closed') {
      audioCtxRef.current?.close().catch(() => {})
    }
    if ("vibrate" in navigator) {
      navigator.vibrate(0) // Stop vibrating
    }
  }

  const handleDecline = () => {
    onEndCall()
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col">
      {/* Waiting screen - Blank or simple lock screen simulation */}
      <AnimatePresence>
        {callState === "waiting" && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black flex items-center justify-center flex-col"
          >
            <p className="text-white/50 text-sm">Waiting {delaySeconds}s for fake call...</p>
            <Button variant="ghost" onClick={onEndCall} className="mt-4 text-white/50">Cancel</Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ringing / Answered Screen */}
      {(callState === "ringing" || callState === "answered") && (
        <motion.div 
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex flex-col items-center pt-24 pb-16 px-6 bg-gradient-to-b from-slate-800 to-slate-950"
        >
          {/* Blurred Background effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/40 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 flex flex-col items-center flex-1 w-full">
            <h2 className="text-xl font-medium text-white/80 mb-2">
              {callState === "ringing" ? "Incoming call" : formatTime(callDuration)}
            </h2>
            
            <h1 className="text-4xl font-light text-white mb-12 tracking-wide">
              {callerName}
            </h1>

            <div className="w-32 h-32 rounded-full bg-slate-700/50 flex items-center justify-center mb-12 border border-white/10 relative">
              {callState === "ringing" && (
                <>
                  <motion.div 
                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute inset-0 rounded-full bg-white/20"
                  />
                  <motion.div 
                    animate={{ scale: [1, 1.2], opacity: [0.8, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
                    className="absolute inset-0 rounded-full bg-white/20"
                  />
                </>
              )}
              <User className="w-16 h-16 text-white/50" />
            </div>

            <div className="mt-auto w-full flex justify-between px-8">
              {callState === "ringing" ? (
                <>
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={handleDecline}
                    className="w-20 h-20 rounded-full bg-red-500 flex flex-col items-center justify-center text-white shadow-lg shadow-red-500/20"
                  >
                    <PhoneOff className="w-8 h-8 mb-1" />
                  </motion.button>

                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    onClick={handleAccept}
                    className="w-20 h-20 rounded-full bg-green-500 flex flex-col items-center justify-center text-white shadow-lg shadow-green-500/20"
                  >
                    <Phone className="w-8 h-8 mb-1" />
                  </motion.button>
                </>
              ) : (
                <div className="w-full flex justify-between px-4">
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsMuted(!isMuted)}
                    className={`w-16 h-16 rounded-full flex flex-col items-center justify-center transition-colors ${isMuted ? 'bg-white text-slate-900' : 'bg-slate-700 text-white'}`}
                  >
                    {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                  </motion.button>

                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={handleDecline}
                    className="w-20 h-20 rounded-full bg-red-500 flex flex-col items-center justify-center text-white shadow-lg shadow-red-500/20 -translate-y-2"
                  >
                    <PhoneOff className="w-8 h-8 mb-1" />
                  </motion.button>

                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsSpeaker(!isSpeaker)}
                    className={`w-16 h-16 rounded-full flex flex-col items-center justify-center transition-colors ${isSpeaker ? 'bg-white text-slate-900' : 'bg-slate-700 text-white'}`}
                  >
                    {isSpeaker ? <Volume2 className="w-7 h-7" /> : <VolumeX className="w-7 h-7" />}
                  </motion.button>
                </div>
              )}
            </div>
            
            {callState === "ringing" && (
              <div className="w-full flex justify-between px-8 mt-4 text-white/80 text-sm">
                <span className="w-20 text-center">Decline</span>
                <span className="w-20 text-center">Accept</span>
              </div>
            )}
            {callState === "answered" && (
              <div className="w-full flex justify-between px-4 mt-4 text-white/80 text-sm">
                <span className="w-16 text-center">{isMuted ? 'Muted' : 'Mute'}</span>
                <span className="w-20 text-center">End Call</span>
                <span className="w-16 text-center">{isSpeaker ? 'Speaker' : 'Speaker'}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
