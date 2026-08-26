import React, { useEffect, useRef, useState } from 'react'
import JSZip from 'jszip'
import {
  Coins,
  LogOut,
  MessageSquare,
  PanelLeftIcon,
  PanelRight,
  PenSquare,
  Plus,
  User,
  X,
  FolderCode,
  FolderUp,
  Code2,
  Sparkles,
  Trash2,
  Check,
  FolderArchive,
  Folder
} from 'lucide-react'
import { getConversations } from '../features/getConversations'
import { useDispatch, useSelector } from 'react-redux'
import {
  addConversation,
  setConversations,
  setSelectedConversation,
  removeConversation
} from '../redux/conversationSlice'
import { importProject, setMessages, setArtifacts } from '../redux/messageSlice'
import { createConversation } from '../features/createConversation'
import { deleteConversation as deleteConversationApi } from '../features/deleteConversation'
import logOut from '../features/logOut'
import { setUserData } from '../redux/userSlice'
import BillingDrawer from './BillingDrawer'

function SideBar () {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showBilling, setShowBilling] = useState(false)
  const [activeTab, setActiveTab] = useState('chats') // 'chats' | 'projects'
  const [deletingId, setDeletingId] = useState(null)
  const sidebarFolderInputRef = useRef(null)
  const sidebarZipInputRef = useRef(null)

  const dispatch = useDispatch()
  const { conversations, selectedConversation } = useSelector(
    state => state.conversation
  )
  const { userData } = useSelector(state => state.user)

  const rawConversations = Array.isArray(conversations) ? conversations.filter(c => c && typeof c === 'object' && c._id) : []
  const chatConversations = rawConversations.filter(c => c.type !== 'project')
  const projectConversations = rawConversations.filter(c => c.type === 'project')

  // Handle ZIP Archive Import
  const handleZipImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const zip = new JSZip()
      const zipContent = await zip.loadAsync(file)
      const parsedFiles = []

      for (const [filename, fileObj] of Object.entries(zipContent.files)) {
        if (fileObj.dir) continue
        if (filename.includes('__MACOSX') || filename.includes('.DS_Store') || filename.includes('node_modules')) continue

        if (filename.match(/\.(html|css|js|jsx|ts|tsx|json|py|java|cpp|c|md|txt|svg|vue|svelte|xml|yml|yaml)$/i)) {
          const content = await fileObj.async('string')
          parsedFiles.push({
            name: filename.split('/').pop() || filename,
            content
          })
        }
      }

      if (parsedFiles.length > 0) {
        const projectName = file.name.replace(/\.zip$/i, '') || 'Imported Project'
        const conv = await createConversation({
          title: projectName,
          type: 'project',
          projectFiles: parsedFiles
        })

        if (conv) {
          dispatch(addConversation(conv))
          dispatch(setSelectedConversation(conv))
        }

        dispatch(
          importProject({
            title: projectName,
            files: parsedFiles
          })
        )
        window.dispatchEvent(new CustomEvent('toggle-mobile-artifact'))
        setMobileOpen(false)
      }
    } catch (err) {
      console.error('Failed to parse ZIP archive:', err)
      alert('Failed to read ZIP archive. Please ensure it contains readable project files.')
    } finally {
      if (sidebarZipInputRef.current) sidebarZipInputRef.current.value = ''
    }
  }

  // Handle Main Project Folder Import
  const handleFolderImport = async (e) => {
    const uploadedFiles = Array.from(e.target.files || [])
    if (uploadedFiles.length === 0) return

    let folderName = 'Project'
    if (uploadedFiles[0]?.webkitRelativePath) {
      folderName = uploadedFiles[0].webkitRelativePath.split('/')[0] || 'Project'
    }

    const readableFiles = uploadedFiles.filter(f => !f.name.match(/\.(png|jpg|jpeg|gif|ico|pdf|zip|tar|gz|exe|dll|bin|mp4|mp3|lock|map)$/i)).slice(0, 50)

    const readPromises = readableFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = event => {
          resolve({
            name: file.webkitRelativePath ? file.webkitRelativePath.split('/').slice(1).join('/') || file.name : file.name,
            content: typeof event.target?.result === 'string' ? event.target.result : ''
          })
        }
        reader.readAsText(file)
      })
    })

    const parsedFiles = await Promise.all(readPromises)
    const conv = await createConversation({
      title: folderName,
      type: 'project',
      projectFiles: parsedFiles
    })

    if (conv) {
      dispatch(addConversation(conv))
      dispatch(setSelectedConversation(conv))
    }

    dispatch(
      importProject({
        title: folderName,
        files: parsedFiles
      })
    )
    window.dispatchEvent(new CustomEvent('toggle-mobile-artifact'))
    setMobileOpen(false)

    if (sidebarFolderInputRef.current) {
      sidebarFolderInputRef.current.value = ''
    }
  }

  const handleConfirmDelete = async (convId, e) => {
    e?.stopPropagation()
    try {
      await deleteConversationApi(convId)
      dispatch(removeConversation(convId))
      setDeletingId(null)
      if (conversations.length <= 1) {
        dispatch(setMessages([]))
        dispatch(setArtifacts([]))
      }
    } catch (err) {
      console.error('Failed to delete chat:', err)
    }
  }

  useEffect(() => {
    const getConv = async () => {
      const data = await getConversations()
      dispatch(setConversations(data))
    }
    getConv()
  }, [userData?._id, userData?.userId, dispatch])

  useEffect(() => {
    const handleToggleMobile = () => setMobileOpen(prev => !prev)
    window.addEventListener('toggle-mobile-sidebar', handleToggleMobile)
    return () => window.removeEventListener('toggle-mobile-sidebar', handleToggleMobile)
  }, [])

  const handleCreateChat = async () => {
    const data = await createConversation({ title: 'New Chat', type: 'chat' })
    if (data) {
      dispatch(addConversation(data))
      dispatch(setSelectedConversation(data))
      dispatch(setMessages([]))
      dispatch(setArtifacts([]))
      setActiveTab('chats')
    }
  }

  const handleCreateProject = async () => {
    const data = await createConversation({ title: 'New Project', type: 'project' })
    if (data) {
      dispatch(addConversation(data))
      dispatch(setSelectedConversation(data))
      dispatch(setMessages([]))
      dispatch(
        importProject({
          title: 'New Project',
          files: [
            {
              name: 'index.html',
              content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>New Project</title>\n</head>\n<body>\n  <h1>Welcome to AuraMind AI Code Studio</h1>\n</body>\n</html>'
            }
          ]
        })
      )
      setActiveTab('projects')
    }
  }

  if (collapsed) {
    return (
      <div className='hidden lg:flex flex-col items-center w-[56px] h-screen bg-[#0d0f14] border-r border-white/[0.06] py-4 gap-1 shrink-0 z-40 select-none'>
        <button
          className='flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-all duration-150 bg-transparent border-none cursor-pointer mb-1'
          onClick={() => setCollapsed(false)}
          title='Expand Sidebar'
        >
          <PanelRight size={18} />
        </button>

        <button
          className='flex items-center justify-center w-9 h-9 rounded-xl text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all duration-150 bg-transparent border-none cursor-pointer'
          onClick={handleCreateChat}
          title='New Chat'
        >
          <Plus size={17} />
        </button>

        <div className='flex-1 w-full overflow-y-auto px-2 pb-2 custom-scrollbar pt-3 flex flex-col items-center gap-1.5'>
          {conversations.map((conv, i) => {
            const isActive = selectedConversation?._id === conv?._id

            return (
              <button
                key={conv._id || i}
                onClick={() => dispatch(setSelectedConversation(conv))}
                title={conv?.title || 'New Chat'}
                className={`flex items-center justify-center w-9 h-9 rounded-[10px] border transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                    : 'bg-transparent border-transparent text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
                }`}
              >
                <MessageSquare size={14} />
              </button>
            )
          })}
        </div>

        <div className='relative shrink-0 pt-2 border-t border-white/[0.06]'>
          {userData?.avatar && !imageError ? (
            <img
              className='w-9 h-9 rounded-[10px] object-cover border-2 border-indigo-500/25'
              src={userData?.avatar}
              alt={userData?.name || 'User Avatar'}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className='w-9 h-9 rounded-[10px] bg-white/[0.06] flex items-center justify-center'>
              <User size={15} className='text-slate-400' />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          mobileOpen
            ? 'opacity-100 visible'
            : 'opacity-0 invisible pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[270px] h-screen shrink-0 bg-[#0d0f14] border-r border-white/[0.06] transition-transform duration-300 ease-in-out select-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className='flex flex-col h-full'>
          <div className='flex items-center gap-2.5 px-4 py-4 border-b border-white/[0.06]'>
            <button
              onClick={() => setCollapsed(true)}
              className='hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors duration-150 bg-transparent border-none cursor-pointer'
              title='Collapse Sidebar'
            >
              <PanelLeftIcon size={18} />
            </button>

            <button
              onClick={() => setMobileOpen(false)}
              className='flex lg:hidden items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors duration-150 bg-transparent border-none cursor-pointer'
              title='Close Drawer'
            >
              <X size={18} />
            </button>

            <span className='text-[16px] font-bold text-slate-100 tracking-tight flex-1'>
              AuraMind AI
            </span>

            <span className='text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full tracking-wide uppercase'>
              {userData?.plan || 'Free'}
            </span>

            <button
              onClick={activeTab === 'chats' ? handleCreateChat : handleCreateProject}
              className='flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors duration-150 bg-transparent border-none cursor-pointer'
              title={activeTab === 'chats' ? 'New Chat' : 'New Project'}
            >
              <PenSquare size={14} />
            </button>
          </div>

          {/* Primary Action Button */}
          <div className='px-4 pt-4 pb-2'>
            {activeTab === 'chats' ? (
              <button
                onClick={handleCreateChat}
                className='w-full flex items-center justify-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 rounded-xl py-[10px] border-none cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all duration-150 shadow-lg shadow-indigo-500/20'
              >
                <Plus size={16} />
                New Chat
              </button>
            ) : (
              <button
                onClick={handleCreateProject}
                className='w-full flex items-center justify-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-xl py-[10px] border-none cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all duration-150 shadow-lg shadow-purple-500/20'
              >
                <Plus size={16} />
                New Project
              </button>
            )}
          </div>

          {/* Switcher Tab: Chats vs Projects */}
          <div className='flex items-center gap-1.5 px-4 py-1.5'>
            <button
              type='button'
              onClick={() => setActiveTab('chats')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                activeTab === 'chats'
                  ? 'bg-white/[0.08] text-white border-white/[0.12] shadow-sm'
                  : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/[0.03]'
              }`}
            >
              <MessageSquare size={13} />
              <span>Chats ({chatConversations.length})</span>
            </button>

            <button
              type='button'
              onClick={() => setActiveTab('projects')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                activeTab === 'projects'
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 shadow-sm'
                  : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/[0.03]'
              }`}
            >
              <FolderCode size={13} />
              <span>Projects ({projectConversations.length})</span>
            </button>
          </div>

          <div className='px-5 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500'>
            {activeTab === 'chats'
              ? (chatConversations.length === 0 ? 'No Recent Chats' : 'Recent Chats')
              : 'Saved Projects'}
          </div>

          {activeTab === 'chats' ? (
            <div className='flex-1 overflow-y-auto px-2.5 pb-2 custom-scrollbar space-y-1'>
              {chatConversations.length === 0 ? (
                <div className='py-8 px-4 text-center flex flex-col items-center gap-2'>
                  <div className='w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-400'>
                    <MessageSquare size={17} />
                  </div>
                  <p className='text-xs font-semibold text-slate-300'>No Chats Yet</p>
                  <p className='text-[11px] text-slate-500'>
                    Start a conversation with AuraMind AI.
                  </p>
                </div>
              ) : (
                chatConversations.map((conv, i) => {
                  const isActive = selectedConversation?._id === conv?._id
                  const isDeleting = deletingId === conv?._id

                  if (isDeleting) {
                    return (
                      <div
                        key={conv._id || i}
                        className='flex items-center justify-between gap-2 px-3 py-2 rounded-[10px] bg-red-500/10 border border-red-500/30 text-red-300'
                      >
                        <span className='text-xs font-medium truncate'>Delete chat?</span>
                        <div className='flex items-center gap-1 shrink-0'>
                          <button
                            type='button'
                            onClick={(e) => handleConfirmDelete(conv._id, e)}
                            title='Confirm delete'
                            className='p-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-200 border-none bg-transparent cursor-pointer'
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type='button'
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeletingId(null)
                            }}
                            title='Cancel'
                            className='p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white border-none bg-transparent cursor-pointer'
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={conv._id || i}
                      onClick={() => {
                        dispatch(setSelectedConversation(conv))
                        setMobileOpen(false)
                      }}
                      className={`flex items-center justify-between gap-2 cursor-pointer px-3 py-2.5 rounded-[10px] border transition-all duration-150 group ${
                        isActive
                          ? 'bg-indigo-500/15 border-indigo-500/25 text-white shadow-[0_1px_8px_rgba(99,102,241,0.15)]'
                          : 'bg-transparent border-transparent text-slate-300 hover:bg-white/[0.05] hover:text-white'
                      }`}
                    >
                      <div className='flex items-center gap-2.5 min-w-0 flex-1'>
                        <div
                          className={`flex items-center justify-center shrink-0 w-[28px] h-[28px] rounded-lg transition-colors duration-150 ${
                            isActive
                              ? 'bg-indigo-500/20 text-indigo-400'
                              : 'bg-white/[0.05] text-slate-400 group-hover:text-slate-200'
                          }`}
                        >
                          <MessageSquare size={13} />
                        </div>

                        <span className='text-[13.5px] font-medium truncate flex-1'>
                          {conv?.title || 'New Chat'}
                        </span>
                      </div>

                      <button
                        type='button'
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingId(conv._id)
                        }}
                        title='Delete chat'
                        className='opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all border-none bg-transparent cursor-pointer shrink-0'
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          ) : (
            <div className='flex-1 overflow-y-auto px-2.5 pb-2 custom-scrollbar space-y-2'>
              {/* Project Import Controls */}
              <div className='grid grid-cols-2 gap-1.5 mb-2'>
                {/* ZIP Import */}
                <input
                  type='file'
                  ref={sidebarZipInputRef}
                  accept='.zip'
                  className='hidden'
                  onChange={handleZipImport}
                />
                <button
                  type='button'
                  onClick={() => sidebarZipInputRef.current?.click()}
                  className='flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/25 hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all cursor-pointer shadow-sm truncate'
                  title='Upload ZIP Archive (.zip)'
                >
                  <FolderArchive size={13} className='shrink-0' />
                  <span className='truncate'>Upload ZIP</span>
                </button>

                {/* Main Folder Import */}
                <input
                  type='file'
                  ref={sidebarFolderInputRef}
                  webkitdirectory='true'
                  directory='true'
                  multiple
                  className='hidden'
                  onChange={handleFolderImport}
                />
                <button
                  type='button'
                  onClick={() => sidebarFolderInputRef.current?.click()}
                  className='flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/25 hover:bg-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer shadow-sm truncate'
                  title='Upload Main Project Folder'
                >
                  <Folder size={13} className='shrink-0' />
                  <span className='truncate'>Main Folder</span>
                </button>
              </div>

              {projectConversations.length === 0 ? (
                <div className='py-8 px-4 text-center flex flex-col items-center gap-2'>
                  <div className='w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400'>
                    <FolderCode size={20} />
                  </div>
                  <p className='text-xs font-semibold text-slate-300'>No Projects Yet</p>
                  <p className='text-[11px] text-slate-500 max-w-[190px]'>
                    Add a project by uploading a <b>ZIP Archive (.zip)</b> or <b>Main Project Folder</b>.
                  </p>
                </div>
              ) : (
                projectConversations.map((conv, i) => {
                  const isDeleting = deletingId === conv?._id
                  const isSelected = selectedConversation?._id === conv?._id

                  if (isDeleting) {
                    return (
                      <div
                        key={conv._id || i}
                        className='flex items-center justify-between gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300'
                      >
                        <span className='text-xs font-medium truncate'>Delete project?</span>
                        <div className='flex items-center gap-1 shrink-0'>
                          <button
                            type='button'
                            onClick={(e) => handleConfirmDelete(conv._id, e)}
                            title='Confirm delete'
                            className='p-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-200 border-none bg-transparent cursor-pointer'
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type='button'
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeletingId(null)
                            }}
                            title='Cancel'
                            className='p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white border-none bg-transparent cursor-pointer'
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={conv._id || i}
                      onClick={() => {
                        dispatch(setSelectedConversation(conv))
                        if (conv.projectFiles && conv.projectFiles.length > 0) {
                          dispatch(
                            importProject({
                              title: conv.title,
                              files: conv.projectFiles
                            })
                          )
                        }
                        setMobileOpen(false)
                      }}
                      className={`flex items-center justify-between gap-2 cursor-pointer p-2.5 rounded-xl border transition-all duration-150 group ${
                        isSelected
                          ? 'border-indigo-500/40 bg-indigo-950/40 shadow-sm shadow-indigo-500/10'
                          : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'
                      }`}
                    >
                      <div className='flex items-center gap-2.5 min-w-0 flex-1'>
                        <div className='w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20'>
                          <Code2 size={15} />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <p className='text-[12.5px] font-semibold text-slate-200 truncate group-hover:text-white'>
                            {conv.title || 'Untitled Project'}
                          </p>
                          <span className='text-[10px] text-indigo-300/80 flex items-center gap-1 font-medium'>
                            <Sparkles size={10} className='text-indigo-400' />
                            {conv.projectFiles?.length ? `${conv.projectFiles.length} files` : 'Project Studio'}
                          </span>
                        </div>
                      </div>

                      <button
                        type='button'
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingId(conv._id)
                        }}
                        title='Delete project'
                        className='opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all border-none bg-transparent cursor-pointer shrink-0'
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          )}

          <div className='mx-2.5 h-px bg-white/[0.06]' />

          <div className='px-3.5 py-3.5'>
            {userData ? (
              <div className='flex items-center gap-2.5 rounded-xl px-3 py-2.5 bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] transition-all duration-150'>
                <div className='relative shrink-0'>
                  {userData?.avatar && !imageError ? (
                    <img
                      className='w-9 h-9 rounded-[10px] object-cover border-2 border-indigo-500/25'
                      src={userData?.avatar}
                      alt={userData?.name || 'User Avatar'}
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className='w-9 h-9 rounded-[10px] bg-white/[0.06] flex items-center justify-center'>
                      <User size={15} className='text-slate-400' />
                    </div>
                  )}
                </div>

                <div className='flex-1 min-w-0'>
                  <p className='text-[13.5px] font-semibold text-slate-100 truncate'>
                    {userData?.name || 'User'}
                  </p>

                  <p className='text-[11px] text-slate-400 mt-px'>{userData.plan}</p>
                </div>

                <div className='flex gap-1'>
                  <button
                    onClick={() => setShowBilling(true)}
                    className='flex items-center justify-center w-7 h-7 rounded-[7px] border-none bg-transparent text-yellow-500 cursor-pointer hover:bg-white/[0.08] hover:text-yellow-400 transition-all duration-150'
                    title='Coins / Upgrade'
                  >
                    <Coins size={16} />
                  </button>

                  <button
                    onClick={() => {
                      logOut()
                      dispatch(setUserData(null))
                    }}
                    className='flex items-center justify-center w-7 h-7 rounded-[7px] border-none bg-transparent text-slate-400 cursor-pointer hover:bg-white/[0.08] hover:text-slate-200 transition-all duration-150'
                    title='Log Out'
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <button className='w-full flex items-center justify-center gap-2 text-sm font-medium text-slate-200 bg-white/[0.05] border border-white/[0.08] rounded-xl py-[11px] cursor-pointer hover:bg-white/[0.08] transition-colors duration-150'>
                Login
              </button>
            )}
          </div>
        </div>
      </aside>

      <BillingDrawer open={showBilling} onClose={() => setShowBilling(false)} />
    </>
  )
}

export default SideBar
