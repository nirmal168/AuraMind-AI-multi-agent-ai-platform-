import {
  Code2,
  FileText,
  Globe,
  ImageIcon,
  MessageSquare,
  Mic,
  MicOff,
  Paperclip,
  Presentation,
  Send,
  X,
  Zap,
  FolderUp,
  Folder,
  FileCode
} from 'lucide-react'
import { useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import sendMessage from '../features/sendMessage'
import { createConversation } from '../features/createConversation'
import { updateConversation } from '../features/updateConversation'

import { addMessage, setArtifacts } from '../redux/messageSlice'
import {
  addConversation,
  setConversationTitle,
  setSelectedConversation
} from '../redux/conversationSlice'
import { useEffect } from 'react'

function ChatInput ({
  loading: externalLoading,
  setLoading: setExternalLoading
}) {
  const dispatch = useDispatch()

  const { selectedConversation } = useSelector(state => state.conversation)

  const [value, setValue] = useState('')
  const [internalLoading, setInternalLoading] = useState(false)

  const loading =
    externalLoading !== undefined ? externalLoading : internalLoading
  const setLoading = setExternalLoading || setInternalLoading
  const [selectedAgent, setSelectedAgent] = useState('auto')
  const [selectedFile, setSelectedFile] = useState(null)
  const [folderData, setFolderData] = useState(null) // { name, fileCount, size, text }
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)
  const baseTextRef = useRef('')
  const fileRef = useRef(null)
  const folderRef = useRef(null)

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {}
      recognitionRef.current = null
    }
    setListening(false)
  }

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert(
        'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.'
      )
      return
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch (e) {}
    }

    baseTextRef.current = value || ''

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'en-US'
      recognition.interimResults = true
      recognition.continuous = true

      recognition.onstart = () => {
        setListening(true)
      }

      recognition.onresult = event => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        const spoken = (finalTranscript + interimTranscript).trim()
        const prefix = baseTextRef.current
          ? baseTextRef.current.trim() + ' '
          : ''
        if (spoken) {
          setValue(prefix + spoken)
        }
      }

      recognition.onerror = event => {
        console.warn('Speech recognition error:', event.error)
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          alert(
            'Microphone access is blocked. Please allow microphone permission in your browser URL bar.'
          )
        }
        stopListening()
      }

      recognition.onend = () => {
        setListening(false)
        recognitionRef.current = null
      }

      recognition.start()
      recognitionRef.current = recognition
    } catch (err) {
      console.error('Failed to start speech recognition:', err)
      setListening(false)
    }
  }

  const toggleMic = () => {
    if (listening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const handleFolderUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    let folderName = 'Project Folder'
    if (files[0]?.webkitRelativePath) {
      folderName = files[0].webkitRelativePath.split('/')[0] || 'Project Folder'
    }

    let totalSize = 0
    let combinedContent = `\n📁 [PROJECT: ${folderName} (${files.length} total files)]\n`

    // Filter key readable code & config files, skip heavy binary/lock files
    const readableFiles = files.filter(f => !f.name.match(/\.(png|jpg|jpeg|gif|ico|pdf|zip|tar|gz|exe|dll|bin|mp4|mp3|lock|map)$/i)).slice(0, 15)

    for (const f of readableFiles) {
      totalSize += f.size
      if (combinedContent.length > 7500) break // Safe token budget
      try {
        const text = await f.text()
        const relPath = f.webkitRelativePath || f.name
        combinedContent += `\n--- File: ${relPath} ---\n${text.substring(0, 1200)}\n`
      } catch (err) {
        console.warn('Could not read file:', f.name)
      }
    }

    setFolderData({
      name: folderName,
      fileCount: files.length,
      size: totalSize,
      text: combinedContent
    })

    if (folderRef.current) folderRef.current.value = ''
  }

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch (e) {}
      }
    }
  }, [])

  const agents = [
    {
      id: 'auto',
      icon: Zap,
      label: 'Auto'
    },
    {
      id: 'chat',
      icon: MessageSquare,
      label: 'Chat'
    },
    {
      id: 'coding',
      icon: Code2,
      label: 'Coding'
    },
    {
      id: 'pdf',
      icon: FileText,
      label: 'PDF'
    },
    {
      id: 'ppt',
      icon: Presentation,
      label: 'PPT'
    },
    {
      id: 'vision',
      icon: ImageIcon,
      label: 'Vision'
    },
    {
      id: 'search',
      icon: Globe,
      label: 'Search'
    }
  ]

  const handleSendMessage = async () => {
    const userPrompt = value.trim()

    if ((!userPrompt && !selectedFile && !folderData) || loading) return

    setLoading(true)
    setValue('')

    const effectivePrompt = userPrompt || (selectedFile ? `Please explain the attached ${selectedFile.name} in detail.` : 'Please explain this project.')

    try {
      let conversation = selectedConversation
      const initialTitle = effectivePrompt.substring(0, 30)

      if (!conversation || !conversation._id) {
        const conv = await createConversation({ title: initialTitle, type: 'chat' })
        if (!conv || !conv._id) {
          throw new Error('Please login or refresh to start a new chat.')
        }
        dispatch(setSelectedConversation(conv))
        dispatch(addConversation(conv))
        conversation = conv
      } else if (conversation?.title === 'New Chat' || conversation?.title === 'New Project') {
        try {
          await updateConversation({
            id: conversation._id,
            title: initialTitle
          })
        } catch (e) {}

        dispatch(
          setConversationTitle({
            conversationsId: conversation._id,
            title: initialTitle
          })
        )
      }

      dispatch(
        addMessage({
          role: 'user',
          content: folderData ? `📁 **[Folder: ${folderData.name} (${folderData.fileCount} files)]**\n${effectivePrompt}` : (selectedFile ? `📄 **[Attached: ${selectedFile.name}]**\n${effectivePrompt}` : effectivePrompt)
        })
      )

      let finalPayloadPrompt = effectivePrompt
      if (folderData?.text) {
        finalPayloadPrompt = `${effectivePrompt}\n\nAttached Project Code/Files Content:\n${folderData.text}`
      }

      let data = null
      if (selectedFile) {
        const formData = new FormData()
        formData.append('prompt', finalPayloadPrompt)
        formData.append('conversationId', conversation._id)
        formData.append('agent', selectedFile?.type === 'application/pdf' ? 'pdfRag' : selectedAgent)
        formData.append('file', selectedFile)
        data = await sendMessage(formData)
      } else {
        data = await sendMessage({
          prompt: finalPayloadPrompt,
          conversationId: conversation._id,
          agent: selectedAgent
        })
      }

      setSelectedFile(null)
      setFolderData(null)

      if (!data) {
        throw new Error('Failed to get response from agent')
      }
      dispatch(setArtifacts(data.artifacts || []))

      dispatch(
        addMessage({
          role: 'assistant',
          content: data.answer,
          images: data.images || []
        })
      )
    } catch (error) {
      console.error(error)
      dispatch(
        addMessage({
          role: 'assistant',
          content: 'Something went wrong. Please try again.'
        })
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='w-full shrink-0 px-3 md:px-5 py-3 md:py-4 border-t border-white/[0.06] bg-[#0d0f14] select-none'>
      <div className='flex flex-col gap-2.5 bg-[#13151c]/80 border border-white/[0.08] focus-within:border-indigo-500/40 focus-within:ring-1 focus-within:ring-indigo-500/20 rounded-2xl px-3.5 md:px-4 pt-3 pb-3 transition-all duration-200 shadow-lg shadow-black/20'>
        {/* Agent Selectors Bar */}
        <div className='flex w-full gap-2 pr-1 overflow-x-auto custom-scrollbar py-0.5'>
          {agents.map(agent => {
            const isActive = selectedAgent === agent.id
            const Icon = agent.icon

            return (
              <button
                type='button'
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`
                  flex-shrink-0
                  cursor-pointer
                  inline-flex
                  items-center
                  gap-1.5
                  px-3
                  py-1.5
                  rounded-full
                  text-xs
                  font-medium
                  border
                  transition-all
                  duration-150
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-transparent shadow-[0_2px_10px_rgba(99,102,241,0.35)]'
                      : 'bg-white/[0.03] text-slate-400 border-white/[0.06] hover:bg-white/[0.07] hover:text-slate-200'
                  }
                `}
              >
                <Icon
                  size={13}
                  className={isActive ? 'text-white' : 'text-slate-400'}
                />
                {agent.label}
              </button>
            )
          })}
        </div>

        {/* AI Image & Nano Banana Generation Styles Bar (Active on Vision Agent) */}
        {selectedAgent === 'vision' && (
          <div className='flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1 pt-0.5 text-xs animate-fadeIn'>
            <span className='text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-0.5'>
              Styles:
            </span>
            {[
              {
                label: '🍌 Nano Banana 3D',
                prompt: 'Cute 3D Nano Banana character in a vibrant whimsical world, Pixar style, glossy textures, expressive cute face, soft studio lighting, 8k render'
              },
              {
                label: '🎨 Photoreal 8K',
                prompt: 'Cinematic photorealistic 8K masterpiece, ultra-detailed textures, volumetric dramatic lighting, DSLR depth of field'
              },
              {
                label: '👾 Anime / Manga',
                prompt: 'Studio Ghibli style anime illustration, scenic background, vibrant colors, expressive lighting'
              },
              {
                label: '🚀 Cyberpunk',
                prompt: 'Futuristic cyberpunk aesthetic with glowing neon lights, holographic reflections, detailed sci-fi cityscape'
              },
              {
                label: '🪄 Fantasy Concept',
                prompt: 'Mythical fantasy concept art, magical glowing atmosphere, ethereal lighting, epic scale digital painting'
              },
              {
                label: '🧸 3D Claymation',
                prompt: 'Cute claymation style 3D miniature character, plasticine clay textures, tilt-shift photo'
              }
            ].map((preset, idx) => (
              <button
                type='button'
                key={idx}
                onClick={() => {
                  setValue(prev => (prev ? `${prev}, ${preset.prompt}` : preset.prompt))
                }}
                className='shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/25 hover:border-indigo-500/40 transition-all cursor-pointer shadow-sm'
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}

        {/* Selected File / PDF Attachment Badge */}
        {selectedFile && (
          <div className='my-1'>
            <div className='inline-flex items-center gap-2.5 rounded-xl border border-indigo-500/25 bg-indigo-950/30 p-2 pr-3 text-left'>
              {selectedFile?.type === 'application/pdf' ? (
                <div className='w-9 h-9 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0'>
                  <FileText size={18} className='text-red-400' />
                </div>
              ) : selectedFile.type?.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt='attachment preview'
                  className='w-9 h-9 rounded-lg object-cover border border-white/10 shrink-0'
                />
              ) : (
                <div className='w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0'>
                  <FileCode size={18} className='text-indigo-400' />
                </div>
              )}

              <div className='min-w-0 flex-1'>
                <p className='text-xs font-semibold text-slate-200 truncate max-w-[180px] md:max-w-[240px]'>
                  {selectedFile?.name}
                </p>
                <p className='text-[10px] text-indigo-300/80'>
                  {selectedFile?.type === 'application/pdf' ? 'PDF Document' : 'Project File'} • {Math.ceil(selectedFile.size / 1024)} KB
                </p>
              </div>

              <button
                type='button'
                className='w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors border-none bg-transparent cursor-pointer'
                onClick={() => {
                  setSelectedFile(null)
                  if (fileRef.current) fileRef.current.value = ''
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Selected Folder Attachment Badge */}
        {folderData && (
          <div className='my-1'>
            <div className='inline-flex items-center gap-2.5 rounded-xl border border-indigo-500/25 bg-indigo-950/30 p-2 pr-3 text-left'>
              <div className='w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0'>
                <Folder size={18} className='text-indigo-400' />
              </div>

              <div className='min-w-0 flex-1'>
                <p className='text-xs font-semibold text-slate-200 truncate max-w-[180px] md:max-w-[240px]'>
                  {folderData.name}
                </p>
                <p className='text-[10px] text-indigo-300/80'>
                  Project Folder • {folderData.fileCount} files ({Math.ceil(folderData.size / 1024)} KB)
                </p>
              </div>

              <button
                type='button'
                className='w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors border-none bg-transparent cursor-pointer'
                onClick={() => setFolderData(null)}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Textarea Input */}
        <textarea
          value={value}
          rows={3}
          disabled={loading}
          placeholder={selectedFile ? `Ask anything about ${selectedFile.name}...` : (folderData ? `Ask anything about ${folderData.name}...` : 'Ask anything, upload a PDF, or upload a project folder to analyze...')}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSendMessage()
            }
          }}
          className='w-full bg-transparent outline-none resize-none text-[14px] text-slate-100 placeholder:text-slate-500 leading-relaxed custom-scrollbar disabled:opacity-50 min-h-[60px]'
        />

        {/* Action Controls Footer */}
        <div className='flex items-center justify-between pt-1 border-t border-white/[0.04]'>
          <div className='flex items-center gap-1'>
            {/* File & PDF Input */}
            <input
              type='file'
              ref={fileRef}
              accept='.pdf,.doc,.docx,.txt,.md,.js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.html,.css,.json,image/*'
              className='hidden'
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) {
                  setSelectedFile(file)
                  setFolderData(null)
                }
              }}
            />
            <button
              type='button'
              onClick={() => fileRef.current?.click()}
              title='Attach File or PDF'
              className='flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-all duration-150 bg-transparent border-none cursor-pointer'
            >
              <Paperclip size={16} />
            </button>

            {/* Folder Upload Input */}
            <input
              type='file'
              ref={folderRef}
              webkitdirectory='true'
              directory='true'
              multiple
              className='hidden'
              onChange={handleFolderUpload}
            />
            <button
              type='button'
              onClick={() => folderRef.current?.click()}
              title='Upload Entire Project Folder'
              className='flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all duration-150 bg-transparent border-none cursor-pointer'
            >
              <FolderUp size={16} />
            </button>

            <button
              onClick={toggleMic}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150 cursor-pointer ${
                listening
                  ? 'bg-red-500 text-white'
                  : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
              }`}
              title={listening ? 'Stop listening' : 'Start voice input'}
            >
              {listening ? <Mic size={16} /> : <MicOff size={16} />}
            </button>
          </div>

          <button
            type='button'
            disabled={(!value.trim() && !selectedFile && !folderData) || loading}
            onClick={handleSendMessage}
            title='Send Message'
            className={`flex items-center justify-center w-9 h-9 rounded-xl border-none transition-all duration-200 ${
              (value.trim() || selectedFile || folderData) && !loading
                ? 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:opacity-90 active:scale-95 text-white cursor-pointer shadow-md shadow-indigo-500/25'
                : 'bg-white/[0.05] text-slate-600 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
            ) : (
              <Send size={15} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatInput
