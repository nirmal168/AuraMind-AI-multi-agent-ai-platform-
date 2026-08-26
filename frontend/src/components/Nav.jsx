import { Menu, MessageSquare, Code2 } from 'lucide-react'
import React from 'react'
import { useSelector } from 'react-redux'

function Nav () {
  const { selectedConversation } = useSelector(state => state.conversation)
  const { messages, artifacts } = useSelector(state => state.message)

  const toggleSidebar = () => {
    window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))
  }

  const toggleArtifact = () => {
    window.dispatchEvent(new CustomEvent('toggle-mobile-artifact'))
  }

  return (
    <div className='h-14 flex items-center justify-between gap-2.5 px-4 md:px-5 border-b border-white/[0.06] bg-[#0d0f14] shrink-0 z-30'>
      <div className='flex items-center gap-2.5 min-w-0'>
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={toggleSidebar}
          className='flex lg:hidden items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] border border-white/[0.06] bg-transparent cursor-pointer transition-colors duration-150'
          title='Open Sidebar'
        >
          <Menu size={18} />
        </button>

        {selectedConversation ? (
          <>
            <div className='flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 shrink-0'>
              <MessageSquare size={13} className='text-indigo-400' />
            </div>
            <div className='text-[14px] font-semibold text-slate-100 tracking-tight truncate'>
              {selectedConversation?.title || 'New Chat'}
            </div>
            <div className='hidden sm:inline-flex text-[10px] font-medium text-slate-400 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full shrink-0'>
              {messages?.length || 0} Messages
            </div>
          </>
        ) : (
          <div className='flex items-center gap-2'>
            <span className='text-[15px] font-bold text-slate-100 tracking-tight'>
              AuraMind AI
            </span>
          </div>
        )}
      </div>

      {/* Right side: Mobile Artifact toggle if artifacts exist */}
      {artifacts?.length > 0 && (
        <button
          onClick={toggleArtifact}
          className='flex lg:hidden items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 cursor-pointer transition-colors duration-150'
          title='View Artifact'
        >
          <Code2 size={14} />
          <span>Artifact</span>
        </button>
      )}
    </div>
  )
}

export default Nav

