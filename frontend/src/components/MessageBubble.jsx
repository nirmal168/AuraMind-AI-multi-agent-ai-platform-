import React, { useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import {
  Check,
  Copy,
  ExternalLink,
  FolderCode,
  Play,
  X,
  Edit3,
  Download,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal
} from 'lucide-react'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useDispatch } from 'react-redux'
import { setArtifacts } from '../redux/messageSlice'

function MessageBubble ({ role, content, images, artifacts }) {
  const dispatch = useDispatch()
  const isUser = role === 'user'
  const [lightBox, setLightBox] = useState(null)
  const [copiedCode, setCopiedCode] = useState('')
  const [liked, setLiked] = useState(null)

  const copyCode = async code => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => {
      setCopiedCode('')
    }, 2000)
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`w-fit max-w-[92vw] md:max-w-[72%]
px-4 py-2.5 rounded-2xl
break-words overflow-hidden
leading-relaxed
    ${
      isUser
        ? 'bg-gradient-to-br from-indigo-500 to-violet-700 text-white rounded-tr-sm'
        : 'text-slate-200 rounded-tl-sm'
    }`}
      >
        {artifacts && artifacts.length > 0 && (
          <div className='mb-3 flex flex-col gap-2'>
            {artifacts.map((art, idx) => (
              <div
                key={idx}
                className='flex items-center justify-between gap-3 p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/30 hover:border-indigo-500/50 transition-all shadow-lg shadow-indigo-500/10'
              >
                <div className='flex items-center gap-2.5 min-w-0'>
                  <div className='w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0'>
                    <FolderCode size={18} className='text-indigo-400' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='text-xs font-semibold text-slate-100 truncate'>
                      {art.title || 'Generated Project'}
                    </p>
                    <p className='text-[10px] text-indigo-300/80 truncate'>
                      {art.files?.length || 0} files ({art.files?.map(f => f.name).join(', ')})
                    </p>
                  </div>
                </div>
                <button
                  type='button'
                  onClick={() => {
                    dispatch(setArtifacts([art]))
                    window.dispatchEvent(new CustomEvent('toggle-mobile-artifact'))
                  }}
                  className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 cursor-pointer transition shadow-md shadow-indigo-600/30 shrink-0 border-none'
                >
                  <Play size={11} className='fill-white' />
                  <span>Open Project</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ChatGPT / DALL-E Style Image Card */}
        {images && images.length > 0 && (
          <div className='flex flex-col gap-2.5 my-2'>
            {images.map((img, i) => (
              <div key={i} className='flex flex-col gap-2'>
                <div className='relative group overflow-hidden rounded-3xl border border-white/10 shadow-2xl bg-[#1a1c23] max-w-[460px]'>
                  <img
                    onClick={() => setLightBox(img)}
                    src={img}
                    alt='AI Generated Masterpiece'
                    loading='lazy'
                    onError={e => e.currentTarget.remove()}
                    className='w-full h-auto max-h-[460px] object-cover cursor-zoom-in hover:opacity-95 transition block'
                  />
                  {/* Bottom Overlay: Edit & Download Buttons */}
                  <div className='absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none'>
                    <button
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation()
                        setLightBox(img)
                      }}
                      className='pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-xs font-semibold text-white transition border border-white/15 cursor-pointer shadow-lg active:scale-95'
                    >
                      <Edit3 size={12} />
                      <span>Edit</span>
                    </button>

                    <a
                      href={img}
                      target='_blank'
                      rel='noreferrer'
                      download='generated-image.png'
                      onClick={(e) => e.stopPropagation()}
                      className='pointer-events-auto p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white transition border border-white/15 cursor-pointer shadow-lg flex items-center justify-center active:scale-95'
                      title='Download High-Res Image'
                    >
                      <Download size={14} />
                    </a>
                  </div>
                </div>

                {/* ChatGPT Style Actions underneath image */}
                <div className='flex items-center gap-2 pt-1 text-slate-400 pl-1'>
                  <button
                    type='button'
                    onClick={() => navigator.clipboard.writeText(img)}
                    title='Copy image link'
                    className='hover:text-white transition p-1 hover:bg-white/10 rounded-md border-none bg-transparent cursor-pointer'
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    type='button'
                    onClick={() => setLiked(liked === 'up' ? null : 'up')}
                    title='Good response'
                    className={`transition p-1 hover:bg-white/10 rounded-md border-none bg-transparent cursor-pointer ${
                      liked === 'up' ? 'text-indigo-400' : 'hover:text-white'
                    }`}
                  >
                    <ThumbsUp size={14} />
                  </button>
                  <button
                    type='button'
                    onClick={() => setLiked(liked === 'down' ? null : 'down')}
                    title='Bad response'
                    className={`transition p-1 hover:bg-white/10 rounded-md border-none bg-transparent cursor-pointer ${
                      liked === 'down' ? 'text-red-400' : 'hover:text-white'
                    }`}
                  >
                    <ThumbsDown size={14} />
                  </button>
                  <button
                    type='button'
                    title='More options'
                    className='hover:text-white transition p-1 hover:bg-white/10 rounded-md border-none bg-transparent cursor-pointer'
                  >
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className='text-2xl font-bold mt-5 mb-3'>{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className='text-xl font-semibold mt-4 mb-2'>{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className='text-lg font-semibold mt-3 mb-2'>{children}</h3>
            ),
            p: ({ children }) => (
              <p className='mb-3 whitespace-pre-wrap break-words'>{children}</p>
            ),
            ul: ({ children }) => (
              <ul className='list-disc pl-5 space-y-1 my-2'>{children}</ul>
            ),
            ol: ({ children }) => (
              <ul className='list-decimal pl-5 space-y-1 my-2'>{children}</ul>
            ),
            table: ({ children }) => (
              <div className='overflow-x-auto my-4'>
                <table className='min-w-full border border-white/10'>
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className='border border-white/10 bg-white/5 px-3 py-2 text-left'>
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className='border border-white/10 bg-white/5 px-3 py-2 text-left'>
                {children}
              </td>
            ),
            a: ({ href, children }) => {
              const textContent = String(children || '')
              const isDownload =
                href?.startsWith('data:') ||
                href?.includes('.pptx') ||
                href?.includes('.pdf') ||
                textContent.toLowerCase().includes('download')

              const isPpt =
                href?.includes('presentationml') ||
                href?.includes('.pptx') ||
                textContent.toLowerCase().includes('powerpoint') ||
                textContent.toLowerCase().includes('ppt')

              const isPdf =
                href?.includes('application/pdf') ||
                href?.includes('.pdf') ||
                textContent.toLowerCase().includes('pdf')

              if (isDownload) {
                const downloadFileName = isPpt ? 'Presentation.pptx' : isPdf ? 'Document.pdf' : 'File.bin'
                
                const handleDirectDownload = (e) => {
                  if (href?.startsWith('data:')) {
                    e.preventDefault()
                    try {
                      const arr = href.split(',')
                      const mime = arr[0].match(/:(.*?);/)?.[1] || (isPpt ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation' : 'application/pdf')
                      const bstr = atob(arr[1])
                      let n = bstr.length
                      const u8arr = new Uint8Array(n)
                      while (n--) {
                        u8arr[n] = bstr.charCodeAt(n)
                      }
                      const blob = new Blob([u8arr], { type: mime })
                      const blobUrl = URL.createObjectURL(blob)
                      const link = document.createElement('a')
                      link.href = blobUrl
                      link.download = downloadFileName
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
                    } catch (err) {
                      console.warn('Blob download fallback:', err)
                    }
                  }
                }

                return (
                  <a
                    href={href}
                    download={downloadFileName}
                    onClick={handleDirectDownload}
                    className={`my-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide text-white transition-all shadow-lg cursor-pointer no-underline active:scale-95 ${
                      isPpt
                        ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-orange-500/20'
                        : isPdf
                        ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-500/20'
                        : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-500/20'
                    }`}
                  >
                    <Download size={15} />
                    <span>{children}</span>
                  </a>
                )
              }

              return (
                <a
                  href={href}
                  target='_blank'
                  rel='noreferrer'
                  className='text-indigo-400 underline inline-flex items-center gap-1'
                >
                  {children}
                  <ExternalLink size={14} />
                </a>
              )
            },
            code: ({ className, children }) => {
              const value = String(children).trim()

              if (!className) {
                return (
                  <code className='px-1.5 py-0.5 rounded bg-white/10 text-indigo-300'>
                    {value}
                  </code>
                )
              }

              const language = className?.replace('language-', '')

              return (
                <div className='my-4 overflow-hidden rounded-xl border border-white/10 bg-[#111318]'>
                  <div className='flex items-center justify-between bg-[#1b1d24] border-b border-white/10 px-4 py-2'>
                    <span className='uppercase text-xs text-slate-400'>
                      {language}
                    </span>
                    <button
                      className='flex items-center gap-1 text-xs'
                      onClick={() => copyCode(value)}
                    >
                      {copiedCode == value ? (
                        <>
                          <Check size={14} />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>

                  <SyntaxHighlighter
                    language={language}
                    style={oneDark}
                    wrapLongLines
                    showLineNumbers
                    customStyle={{
                      margin: 0,
                      padding: '16px',
                      background: '#0d1117',
                      fontSize: '13px'
                    }}
                  >
                    {value}
                  </SyntaxHighlighter>
                </div>
              )
            },
            img: ({ src, alt }) => {
              if (!src) return null
              return (
                <div className='my-3 max-w-[500px] overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-black/40'>
                  <img
                    onClick={() => setLightBox(src)}
                    src={src}
                    alt={alt || 'AI Generated Image'}
                    loading='lazy'
                    onError={e => e.currentTarget.remove()}
                    className='w-full h-auto max-h-[460px] object-cover cursor-zoom-in hover:scale-[1.01] transition-all duration-200 block'
                  />
                </div>
              )
            }


          }}
        >
          {content}
        </Markdown>
      </div>

      {lightBox && (
        <div className='fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6'>
          <button
            className='absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 rounded-full p-2'
            onClick={() => setLightBox(null)}
          >
            <X />
          </button>
          <img
            src={lightBox}
            className='max-w-[90vw] max-h-[85vh] rounded-2xl border border-white/10 shadow-2xl object-contain'
          />
        </div>
      )}
    </div>
  )
}

export default MessageBubble
