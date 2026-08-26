import React, { useEffect, useRef, useState } from 'react'
import {
  Eye,
  PanelRightClose,
  Code2,
  PanelRightOpen,
  Copy,
  Check,
  X,
  FolderUp,
  Plus,
  Download,
  FileCode,
  Sparkles,
  Trash2
} from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'motion/react'
import Editor from '@monaco-editor/react'
import { setArtifacts, addFileToArtifact } from '../redux/messageSlice'

function Artifact() {
  const dispatch = useDispatch()
  const { artifacts } = useSelector(state => state.message)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [tab, setTab] = useState('code')
  const [activeFile, setActiveFile] = useState(0)
  const [copied, setCopied] = useState(false)
  const [isCreatingFile, setIsCreatingFile] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const fileInputRef = useRef(null)

  // Listen for mobile artifact drawer trigger event
  useEffect(() => {
    const handleToggleMobileArtifact = () => setMobileOpen(prev => !prev)
    window.addEventListener('toggle-mobile-artifact', handleToggleMobileArtifact)
    return () => window.removeEventListener('toggle-mobile-artifact', handleToggleMobileArtifact)
  }, [])

  if (!artifacts || artifacts.length === 0) return null

  const currentArtifact = artifacts[0]
  const files = currentArtifact?.files || []
  const file = files[activeFile] || files[0]

  const htmlFile = files.find(f => f.name?.toLowerCase() === 'index.html' || f.name?.toLowerCase().endsWith('.html'))
  const cssFile = files.find(f => f.name?.toLowerCase() === 'style.css' || f.name?.toLowerCase().endsWith('.css'))
  const scriptFile = files.find(f => f.name?.toLowerCase() === 'script.js' || (f.name?.toLowerCase().endsWith('.js') && !f.name?.toLowerCase().includes('react')))

  const handleCopy = async () => {
    if (!file?.content) return
    await navigator.clipboard.writeText(file.content)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  const handleCodeChange = (newCode) => {
    if (!files || files.length === 0) return
    const updatedFiles = files.map((f, idx) => {
      if (idx === activeFile) {
        return { ...f, content: newCode || '' }
      }
      return f
    })
    dispatch(
      setArtifacts([
        {
          ...currentArtifact,
          files: updatedFiles
        }
      ])
    )
  }

  const handleImportFiles = (e) => {
    const uploadedFiles = Array.from(e.target.files || [])
    if (uploadedFiles.length === 0) return

    uploadedFiles.forEach(uploadedFile => {
      const reader = new FileReader()
      reader.onload = event => {
        const content = event.target?.result || ''
        dispatch(
          addFileToArtifact({
            name: uploadedFile.name,
            content: typeof content === 'string' ? content : ''
          })
        )
      }
      reader.readAsText(uploadedFile)
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCreateNewFile = () => {
    const trimmed = newFileName.trim()
    if (!trimmed) {
      setIsCreatingFile(false)
      return
    }
    dispatch(
      addFileToArtifact({
        name: trimmed,
        content: `// ${trimmed}\n`
      })
    )
    setNewFileName('')
    setIsCreatingFile(false)
    setActiveFile(files.length)
  }

  const handleDeleteCurrentFile = (indexToDelete, e) => {
    e?.stopPropagation()
    if (files.length <= 1) {
      alert('Cannot delete the only file in the project.')
      return
    }
    const updatedFiles = files.filter((_, idx) => idx !== indexToDelete)
    dispatch(
      setArtifacts([
        {
          ...currentArtifact,
          files: updatedFiles
        }
      ])
    )
    setActiveFile(prev => (prev >= updatedFiles.length ? updatedFiles.length - 1 : prev))
  }

  const handleDownloadFile = () => {
    if (!file) return
    const blob = new Blob([file.content || ''], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name || 'code.txt'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const canPreview = Boolean(htmlFile)

  const previewDoc = `
  <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    <style>
        ${cssFile?.content || ''}
    </style>
</head>
<body>
    ${htmlFile?.content || ''}
    <script>
      ${scriptFile?.content || ''}
    </script>
</body>
</html>
`

  const detectLanguage = (fileName = '') => {
    const name = fileName.toLowerCase()
    if (name.endsWith('.html')) return 'html'
    if (name.endsWith('.css')) return 'css'
    if (name.endsWith('.js') || name.endsWith('.jsx')) return 'javascript'
    if (name.endsWith('.ts') || name.endsWith('.tsx')) return 'typescript'
    if (name.endsWith('.json')) return 'json'
    if (name.endsWith('.py')) return 'python'
    if (name.endsWith('.java')) return 'java'
    if (name.endsWith('.cpp')) return 'cpp'
    if (name.endsWith('.c')) return 'c'
    if (name.endsWith('.md')) return 'markdown'
    return 'plaintext'
  }

  const artifactContentJSX = (
    <div className='flex flex-col h-full bg-[#0d0f14] min-w-0 select-none'>
      <input
        type='file'
        ref={fileInputRef}
        multiple
        accept='.html,.css,.js,.jsx,.ts,.tsx,.json,.py,.java,.cpp,.c,.md,.txt,.svg'
        className='hidden'
        onChange={handleImportFiles}
      />

      <div className='h-14 px-3.5 border-b border-white/[0.06] flex items-center justify-between gap-2 shrink-0 bg-[#0d0f14]'>
        <div className='flex items-center gap-2 min-w-0 flex-1'>
          <button
            onClick={() => setCollapsed(true)}
            className='hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors duration-150 bg-transparent border-none cursor-pointer shrink-0'
            title='Collapse Panel'
          >
            <PanelRightClose size={16} />
          </button>
          <div className='flex items-center justify-center w-6 h-6 rounded-md bg-indigo-500/10 border border-indigo-500/20 shrink-0'>
            <Code2 className='text-indigo-400' size={13} />
          </div>
          <div className='text-[13px] font-semibold text-slate-100 truncate'>
            {currentArtifact?.title || 'Studio Project'}
          </div>
        </div>

        <div className='flex items-center gap-1.5 shrink-0'>
          <button
            type='button'
            onClick={() => fileInputRef.current?.click()}
            title='Import Files into Project'
            className='flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 rounded-lg transition-all cursor-pointer shadow-sm shadow-indigo-500/10'
          >
            <FolderUp size={13} />
            <span className='hidden sm:inline'>Import</span>
          </button>

          <button
            onClick={handleDownloadFile}
            title='Download Active File'
            className='flex items-center justify-center w-7 h-7 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors bg-transparent border-none cursor-pointer'
          >
            <Download size={14} />
          </button>

          <button
            onClick={handleCopy}
            title='Copy Code'
            className='flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors duration-150 bg-transparent border-none cursor-pointer'
          >
            {copied ? (
              <>
                <Check size={13} className='text-emerald-400' />
                <span className='text-emerald-400'>Copied</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy</span>
              </>
            )}
          </button>

          {canPreview && (
            <div className='flex items-center gap-0.5 bg-white/[0.04] border border-white/[0.06] p-0.5 rounded-lg'>
              <button
                onClick={() => setTab('code')}
                className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md transition-all duration-150 cursor-pointer ${
                  tab === 'code'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 size={11} /> Code
              </button>
              <button
                onClick={() => setTab('preview')}
                className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md transition-all duration-150 cursor-pointer ${
                  tab === 'preview'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye size={11} /> Preview
              </button>
            </div>
          )}

          <button
            onClick={() => setMobileOpen(false)}
            className='flex lg:hidden items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] bg-transparent border-none cursor-pointer'
            title='Close Artifact'
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {tab === 'code' && (
        <div className='flex items-center h-auto border-b border-white/[0.06] overflow-x-auto custom-scrollbar shrink-0 min-w-0 bg-[#0a0c10] px-1.5'>
          {files.map((f, index) => (
            <div
              key={f?.name || index}
              onClick={() => setActiveFile(index)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-[11.5px] font-medium whitespace-nowrap transition-colors duration-150 border-r border-white/[0.05] relative cursor-pointer group ${
                activeFile === index
                  ? 'text-indigo-400 bg-white/[0.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.01]'
              }`}
            >
              <FileCode size={12} className={activeFile === index ? 'text-indigo-400' : 'text-slate-500'} />
              <span>{f?.name}</span>

              {files.length > 1 && (
                <button
                  type='button'
                  onClick={(e) => handleDeleteCurrentFile(index, e)}
                  title='Delete file'
                  className='opacity-0 group-hover:opacity-100 hover:text-red-400 p-0.5 text-slate-500 bg-transparent border-none cursor-pointer transition-opacity'
                >
                  <X size={11} />
                </button>
              )}

              {activeFile === index && (
                <div className='absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500 rounded-t-full shadow-[0_-1px_6px_rgba(99,102,241,0.5)]' />
              )}
            </div>
          ))}

          {isCreatingFile ? (
            <div className='flex items-center gap-1 px-2 py-1 bg-white/[0.04] rounded-md my-1 border border-indigo-500/30'>
              <input
                type='text'
                autoFocus
                placeholder='filename.js'
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreateNewFile()
                  if (e.key === 'Escape') setIsCreatingFile(false)
                }}
                className='bg-transparent text-xs text-white outline-none w-24 px-1'
              />
              <button
                onClick={handleCreateNewFile}
                className='text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded cursor-pointer border-none'
              >
                Add
              </button>
              <button
                onClick={() => setIsCreatingFile(false)}
                className='text-[10px] text-slate-400 hover:text-white cursor-pointer bg-transparent border-none'
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type='button'
              onClick={() => setIsCreatingFile(true)}
              title='Add New File'
              className='flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-slate-400 hover:text-indigo-300 hover:bg-white/[0.04] rounded-md transition-colors bg-transparent border-none cursor-pointer ml-1'
            >
              <Plus size={12} />
              <span>File</span>
            </button>
          )}
        </div>
      )}

      <div className='flex-1 min-w-0 overflow-hidden relative bg-[#090b0e]'>
        {tab === 'preview' && canPreview ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className='w-full h-full'
          >
            <iframe
              title='preview'
              srcDoc={previewDoc}
              sandbox='allow-scripts allow-modals allow-same-origin'
              className='block w-full h-full border-0 bg-white'
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className='w-full h-full'
          >
            <Editor
              theme='vs-dark'
              language={detectLanguage(file?.name)}
              value={file?.content || ''}
              onChange={handleCodeChange}
              options={{
                readOnly: false,
                minimap: { enabled: false },
                fontSize: 13,
                wordWrap: 'on',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                lineNumbers: 'on',
                renderLineHighlight: 'line',
                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8
                }
              }}
            />
          </motion.div>
        )}
      </div>
    </div>
  )

  return (
    <>
      <motion.div
        initial={{ width: 460 }}
        animate={{ width: collapsed ? 48 : 460 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className='hidden lg:flex h-full border-l border-white/[0.06] flex-col overflow-hidden shrink-0'
      >
        {!collapsed ? (
          artifactContentJSX
        ) : (
          <div className='hidden lg:flex h-full border-l border-white/[0.06] bg-[#0d0f14] flex-col items-center py-4 gap-3 shrink-0 select-none'>
            <button
              className='flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors duration-150 bg-transparent border-none cursor-pointer shrink-0'
              onClick={() => setCollapsed(false)}
              title='Expand Artifact'
            >
              <PanelRightOpen size={16} />
            </button>
            <div className='flex items-center gap-2 flex-1 min-w-0'>
              <div
                className='text-[10px] font-semibold text-slate-500 tracking-widest uppercase whitespace-nowrap'
                style={{
                  writingMode: 'vertical-lr',
                  transform: 'rotate(180deg)'
                }}
              >
                {currentArtifact?.title || 'Studio Project'}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* ================= MOBILE OVERLAY DRAWER (< lg) ================= */}
      <AnimatePresence>
        {mobileOpen && (
          <div className='lg:hidden fixed inset-0 z-50 flex flex-col justify-end'>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className='fixed inset-0 bg-black/70 backdrop-blur-sm'
            />

            {/* Slide-Up Drawer Content */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className='relative z-10 w-full h-[85vh] bg-[#0d0f14] border-t border-white/10 rounded-t-2xl overflow-hidden flex flex-col shadow-2xl'
            >
              {artifactContentJSX}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Artifact