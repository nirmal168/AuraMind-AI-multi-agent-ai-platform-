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
        <div className='h-full flex flex-col items-center justify-center px-4 py-8 max-w-2xl mx-auto select-none'>
          {/* Brand Icon & Welcome */}
          <div className='flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/10 border border-indigo-500/25 shadow-xl shadow-indigo-500/10 mb-4'>
            <Sparkles className='text-indigo-400' size={28} />
          </div>

          <h1 className='text-2xl md:text-3xl font-bold text-slate-100 tracking-tight text-center'>
            Welcome to AuraMind AI
          </h1>
          <p className='text-sm md:text-base font-medium text-indigo-400/90 mt-1.5 text-center'>
            Multi-Agent Intelligence at your fingertips
          </p>
          <p className='text-xs md:text-sm text-slate-400 text-center max-w-md mt-2 leading-relaxed'>
            Ask questions, generate presentations, write & debug code, analyze documents, or create images with specialized AI agents.
          </p>

          {/* Quick-Start Cards */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-8'>
            {[
              {
                title: 'Full-Stack Code',
                desc: 'Build a responsive React & Tailwind dashboard with analytics',
                agent: 'coding',
                prompt: 'Write a modern, responsive React & Tailwind analytics dashboard with charts and dark mode.',
                icon: Code,
                color: 'text-blue-400'
              },
              {
                title: 'Generate Pitch Deck',
                desc: 'Create an engaging 5-slide presentation on Autonomous AI Agents',
                agent: 'ppt',
                prompt: 'Create a professional 5-slide presentation deck on Autonomous AI Agents and their business applications.',
                icon: Layout,
                color: 'text-violet-400'
              },
              {
                title: 'Image Generation',
                desc: 'Futuristic cyberpunk cityscape with glowing neon reflections',
                agent: 'vision',
                prompt: 'Futuristic cyberpunk aesthetic with glowing neon lights, holographic reflections, detailed sci-fi cityscape',
                icon: Sparkles,
                color: 'text-pink-400'
              },
              {
                title: 'Web & Deep Research',
                desc: 'Find the latest breakthroughs in multi-agent orchestration',
                agent: 'search',
                prompt: 'What are the latest breakthroughs and architectural patterns in multi-agent AI orchestration in 2026?',
                icon: Cpu,
                color: 'text-emerald-400'
              }
            ].map((card, idx) => {
              const Icon = card.icon
              return (
                <button
                  key={idx}
                  type='button'
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent('auramind-prompt', {
                        detail: { prompt: card.prompt, agent: card.agent }
                      })
                    )
                  }}
                  className='flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-indigo-500/40 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200 text-left cursor-pointer group'
                >
                  <div className='p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] group-hover:scale-105 transition-transform shrink-0'>
                    <Icon size={18} className={card.color} />
                  </div>
                  <div className='flex flex-col min-w-0'>
                    <span className='text-[13px] font-semibold text-slate-200 group-hover:text-white transition-colors'>
                      {card.title}
                    </span>
                    <span className='text-[11.5px] text-slate-400 leading-snug line-clamp-2 mt-0.5'>
                      {card.desc}
                    </span>
                  </div>
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


