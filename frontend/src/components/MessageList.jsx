import { useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import MessageBubble from './MessageBubble'
import { Sparkles, Code, Cpu, Layout } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

const LOADING_STATUSES = ['Generating...', 'Reasoning...', 'Searching...']

function LoadingStatusIndicator ({ isVision }) {
  const [statusIndex, setStatusIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % LOADING_STATUSES.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [])

  if (isVision) {
    return (
      <div className='flex items-center justify-start my-3'>
        <div className='w-full max-w-[440px] h-[320px] rounded-3xl bg-[#1e2025] border border-white/[0.08] p-5 flex flex-col justify-between relative overflow-hidden shadow-2xl animate-pulse'>
          <div className='flex items-center gap-2.5 text-slate-200 font-medium text-sm z-10'>
            <Sparkles size={16} className='text-indigo-400 animate-spin' />
            <span>Creating image</span>
          </div>
          {/* Subtle dot-matrix grid matching ChatGPT */}
          <div className='absolute inset-0 top-12 flex items-center justify-center opacity-15 pointer-events-none'>
            <div className='grid grid-cols-12 gap-5 w-full h-full p-6'>
              {Array.from({ length: 96 }).map((_, i) => (
                <div key={i} className='w-1 h-1 rounded-full bg-white' />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='flex items-center justify-start my-2'>
      <div className='inline-flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#13151c] border border-blue-500/20 text-slate-200 text-xs font-medium shadow-md shadow-blue-500/5 select-none'>
        {/* Softly pulsing blue dot */}
        <span className='relative flex h-2.5 w-2.5 items-center justify-center shrink-0'>
          <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75' />
          <span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.9)]' />
        </span>

        {/* Text transition animation */}
        <div className='h-4 relative min-w-[90px] flex items-center overflow-hidden'>
          <AnimatePresence mode='wait'>
            <motion.span
              key={LOADING_STATUSES[statusIndex]}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className='absolute left-0 top-0 bottom-0 flex items-center font-semibold text-blue-400 tracking-wide'
            >
              {LOADING_STATUSES[statusIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function MessageList ({ loading }) {
  const { selectedConversation } = useSelector(state => state.conversation)
  const { messages } = useSelector(state => state.message)
  const messagesEndRef = useRef(null)

  const isVisionRequest = Boolean(
    messages.length > 0 &&
    messages[messages.length - 1]?.role === 'user' &&
    messages[messages.length - 1]?.content?.match(/(image|photo|picture|draw|portrait|banana|render|wallpaper)/i)
  )

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Auto scroll when messages update or loading state changes
  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  return (
    <div className='flex-1 overflow-y-auto px-3 md:px-6 py-4 md:py-6 space-y-5 custom-scrollbar select-text'>
      {messages.length === 0 || !selectedConversation ? (
        <div className='h-full flex flex-col items-center justify-center gap-5 text-center px-4 py-8 max-w-xl mx-auto'>
          <div className='flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-lg shadow-indigo-500/10'>
            <Sparkles className='text-indigo-400' size={24} />
          </div>

          <div className='flex flex-col gap-1.5'>
            <h1 className='text-[22px] font-bold text-slate-100 tracking-tight'>
              Welcome to AuraMind AI
            </h1>
            <p className='text-[15px] font-semibold text-indigo-400/90 tracking-tight'>
              How can I help you today?
            </p>
            <p className='text-[13px] text-slate-400 max-w-[320px] leading-relaxed mx-auto'>
              Ask me anything — code generation, system architecture, explanations, or creative ideas.
            </p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full mt-2'>
            {[
              { text: 'Write a Netflix clone', icon: Code },
              { text: 'Explain Redis', icon: Cpu },
              { text: 'Build a dashboard', icon: Layout }
            ].map((s, idx) => {
              const Icon = s.icon
              return (
                <button
                  key={idx}
                  className='flex flex-col sm:flex-row items-center justify-center gap-2 text-[12px] font-medium text-slate-300 bg-white/[0.03] border border-white/[0.07] px-3.5 py-3 rounded-xl hover:bg-white/[0.07] hover:text-white hover:border-indigo-500/30 transition-all duration-150 cursor-pointer text-center'
                >
                  <Icon size={14} className='text-indigo-400 shrink-0' />
                  <span>{s.text}</span>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className='space-y-5  w-full'>
          {Array.isArray(messages) &&
            messages.map((msg, i) => (
              <MessageBubble
                key={i}
                role={msg.role}
                content={msg.content}
                images={msg.images || []}
                artifacts={msg.artifacts || []}
              />
            ))}

          {/* AI Generating Loading Animation */}
          {loading && <LoadingStatusIndicator isVision={isVisionRequest} />}

          <div ref={messagesEndRef} className='h-px' />
        </div>
      )}
    </div>
  )
}

export default MessageList


