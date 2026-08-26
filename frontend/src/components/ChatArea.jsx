import Nav from './Nav'
import MessageList from './MessageList'
import { useDispatch, useSelector } from 'react-redux'
import getMessages from '../features/getMessages'
import { setArtifacts, setMessages } from '../redux/messageSlice'
import { useState, useEffect, useRef } from 'react'
import ChatInput from './ChatInput'

function ChatArea() {
  const [loading, setLoading] = useState(false)
  const { selectedConversation } = useSelector(
    state => state.conversation
  )
  const currentConvIdRef = useRef(null)

  const dispatch = useDispatch()

  useEffect(() => {
    const getMessage = async () => {
      try {
        // No conversation selected
        if (!selectedConversation?._id) {
          currentConvIdRef.current = null
          dispatch(setMessages([]))
          dispatch(setArtifacts([]))
          return
        }

        // Avoid re-fetching if we are already on this conversation (prevents wiping in-flight first messages)
        if (currentConvIdRef.current === selectedConversation._id) {
          return
        }

        currentConvIdRef.current = selectedConversation._id

        // New chat has no saved messages yet
        if (selectedConversation.title === 'New Chat' || selectedConversation.title === 'New Project') {
          dispatch(setMessages([]))
          dispatch(setArtifacts([]))
          return
        }

        const data = await getMessages(selectedConversation._id)
        const messages = Array.isArray(data) ? data : []

        dispatch(setMessages(messages))

        // Find latest message that contains artifacts
        const latestArtifactMessage = [...messages]
          .reverse()
          .find(msg => msg?.artifacts?.length > 0)

        dispatch(setArtifacts(latestArtifactMessage?.artifacts || []))
      } catch (error) {
        console.error(error)
      }
    }

    getMessage()
  }, [selectedConversation?._id, dispatch])

  return (
    <div className='flex-1 min-w-0 flex flex-col'>
      <Nav />
      <MessageList loading={loading} />
      <ChatInput loading={loading} setLoading={setLoading} />
    </div>
  )
}

export default ChatArea




// import Nav from './Nav'
// import MessageList from './MessageList'
// import { useDispatch, useSelector } from 'react-redux'
// import getMessages from '../features/getMessages'
// import { setMessages } from '../redux/messageSlice'
// import { useEffect } from 'react'
// import ChatInput from './ChatInput'

// function ChatArea() {
//     const {selectedConversation} = useSelector(state => state.conversation)
//     const dispatch = useDispatch()
//     useEffect(()=>{
//        const getMessage = async () =>{
        
//         if(selectedConversation){
//          if( selectedConversation=="New Chat") return ;
//         const data =   await getMessages(selectedConversation?._id)
//         dispatch(setMessages(data))
//         }
//        }
//        getMessage()
//     },[selectedConversation])
//   return (
//     <div  className='flex-1 flex flex-col min-w-0'>
//    <Nav/>
//    <MessageList/>
//   <ChatInput/>
//     </div>
//   )
// }

// export default ChatArea

// import Nav from './Nav'
// import MessageList from './MessageList'
// import { useDispatch, useSelector } from 'react-redux'
// import getMessages from '../features/getMessages'
// import { setArtifacts, setMessages } from '../redux/messageSlice'
// import { useEffect } from 'react'
// import ChatInput from './ChatInput'

// function ChatArea() {
//   const { selectedConversation } = useSelector(
//     state => state.conversation
//   )

//   const dispatch = useDispatch()

//   useEffect(() => {
//     const getMessage = async () => {
//       try {
//         if (!selectedConversation?._id) {
//           dispatch(setMessages([]))
//           return
//         }

//         // Don't fetch messages for a brand new conversation
//         if (selectedConversation?.title === 'New Chat') {
//           dispatch(setMessages([]))
//           return
//         }

//         const data = await getMessages(selectedConversation._id)

//         dispatch(setMessages(Array.isArray(data) ? data : []))
//         const latestArtifactMessage =  [...data].reverse().find(msg => msg.artifacts && msg.artifacts.length > 0)
//         dispatch(setArtifacts(latestArtifactMessage.artifacts || []))
//       } catch (error) {
//         console.log(error)
//         dispatch(setMessages([]))
//       }
//     }

//     getMessage()
//   }, [selectedConversation, dispatch])

//   return (
//     <div className='flex-1 flex flex-col min-w-0'>
//       <Nav />
//       <MessageList />
//       <ChatInput />
//     </div>
//   )
// }

// export default ChatArea