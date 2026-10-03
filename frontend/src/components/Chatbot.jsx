import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const STORAGE_KEY = 'civic_chat_history'

const welcomeMessage = {
  id: 'welcome',
  sender: 'bot',
  text: '👋 Hello! I am your Civic Assistant. I can help you report issues, track complaints, understand AI classification, and use the Civic Issue Reporting System.',
  time: new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function Chatbot() {

  const navigate = useNavigate()

  const [open, setOpen] = useState(false)

  const [message, setMessage] = useState('')

  const [loading, setLoading] = useState(false)

  const [showClearConfirm, setShowClearConfirm] =
    useState(false)

  const [messages, setMessages] = useState(() => {

    try {

      const saved =
        localStorage.getItem(STORAGE_KEY)

      if (saved) {

        const parsed = JSON.parse(saved)

        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }

      }

    } catch (error) {

      console.error(
        'Could not load chat history:',
        error
      )

    }

    return [welcomeMessage]
  })


  const messagesEndRef = useRef(null)


  // =====================================================
  // QUICK QUESTIONS
  // =====================================================

  const suggestions = [
    {
      icon: '📝',
      text: 'How can I report an issue?'
    },
    {
      icon: '📋',
      text: 'How can I check my issue status?'
    },
    {
      icon: '🏙️',
      text: 'What issues can I report?'
    },
    {
      icon: '🤖',
      text: 'How does AI classification work?'
    }
  ]


  // =====================================================
  // SAVE CHAT HISTORY
  // =====================================================

  useEffect(() => {

    try {

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(messages)
      )

    } catch (error) {

      console.error(
        'Could not save chat history:',
        error
      )

    }

  }, [messages])


  // =====================================================
  // AUTO SCROLL
  // =====================================================

  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    })

  }, [messages, loading, open])


  // =====================================================
  // BOT RESPONSE
  // =====================================================

  function getBotReply(text) {

    const lower = text.toLowerCase().trim()


    // Greeting

    if (
      lower === 'hi' ||
      lower === 'hello' ||
      lower === 'hey' ||
      lower.includes('good morning') ||
      lower.includes('good afternoon')
    ) {

      return (
        'Hello! 👋 I am your Civic Assistant. ' +
        'I can help you report civic issues, ' +
        'check issue status, understand AI classification, ' +
        'and navigate the system.'
      )

    }


    // Report issue

    if (
      lower.includes('report') ||
      lower.includes('complaint') ||
      lower.includes('register') ||
      lower.includes('file an issue')
    ) {

      return (
        '📝 To report a civic issue, open the "Report Issue" page. ' +
        'You can provide a title, description, category, photo, ' +
        'and GPS location. Our AI can then analyze the submitted information.'
      )

    }


    // Issue status

    if (
      lower.includes('status') ||
      lower.includes('track') ||
      lower.includes('where is my complaint') ||
      lower.includes('progress')
    ) {

      return (
        '📋 You can track your complaints from the "My Issues" section. ' +
        'Open an issue to see its current status, priority, location, ' +
        'AI analysis, comments, and other details.'
      )

    }


    // Types of issues

    if (
      lower.includes('what issues') ||
      lower.includes('types of issue') ||
      lower.includes('which issues') ||
      lower.includes('what can i report')
    ) {

      return (
        '🏙️ You can report civic problems such as road damage, potholes, ' +
        'garbage, water leakage, drainage problems, electricity issues, ' +
        'and streetlight problems.'
      )

    }


    // AI

    if (
      lower.includes('ai') ||
      lower.includes('classification') ||
      lower.includes('machine learning') ||
      lower.includes('prediction')
    ) {

      return (
        '🤖 The system uses AI to analyze the submitted issue. ' +
        'It can use the image and description to predict the civic issue category ' +
        'and provide a confidence score.'
      )

    }


    // GPS

    if (
      lower.includes('location') ||
      lower.includes('gps') ||
      lower.includes('address')
    ) {

      return (
        '📍 When you report an issue, you can use GPS to detect your location. ' +
        'The system can store the coordinates and address along with your issue.'
      )

    }


    // Priority

    if (
      lower.includes('priority') ||
      lower.includes('urgent') ||
      lower.includes('critical')
    ) {

      return (
        '🚨 Issue priority helps authorities understand which complaints ' +
        'may need faster attention. Your system supports Low, Medium, High, ' +
        'and Critical priority levels.'
      )

    }


    // Photos

    if (
      lower.includes('photo') ||
      lower.includes('image') ||
      lower.includes('picture')
    ) {

      return (
        '📷 You can attach photos when reporting an issue. ' +
        'The submitted image can also be analyzed by the AI model ' +
        'to help identify the issue category.'
      )

    }


    // PDF

    if (
      lower.includes('pdf') ||
      lower.includes('download report') ||
      lower.includes('download')
    ) {

      return (
        '📄 Open an individual issue to view its complete details. ' +
        'You can use the Download PDF button to generate an issue report ' +
        'containing details, location, AI analysis, comments, status information, ' +
        'and attached photos.'
      )

    }


    // Comments

    if (
      lower.includes('comment') ||
      lower.includes('reply')
    ) {

      return (
        '💬 You can open an issue and add a comment. ' +
        'Authority comments can also be displayed as official responses.'
      )

    }


    // Upvote

    if (
      lower.includes('upvote') ||
      lower.includes('vote')
    ) {

      return (
        '👍 You can upvote an issue to show that the problem is also important ' +
        'to you. The issue page displays the current upvote count.'
      )

    }


    // Thank you

    if (
      lower.includes('thank') ||
      lower.includes('thanks')
    ) {

      return (
        'You are welcome! 😊 I am happy to help.'
      )

    }


    // Help

    if (
      lower === 'help' ||
      lower.includes('what can you do')
    ) {

      return (
        '🤖 I can help you with:\n\n' +
        '📝 Reporting issues\n' +
        '📋 Tracking complaints\n' +
        '🤖 Understanding AI classification\n' +
        '📍 GPS and location\n' +
        '📷 Issue photos\n' +
        '🚨 Priority information\n' +
        '📄 PDF reports\n' +
        '💬 Comments and upvotes'
      )

    }


    // Default

    return (
      'I can help you with civic issue reporting, issue tracking, ' +
      'AI classification, GPS location, photos, priorities, comments, ' +
      'upvotes and PDF reports. Try asking me one of these questions.'
    )
  }


  // =====================================================
  // SEND MESSAGE
  // =====================================================

  function sendMessage(text = message) {

    const userMessage =
      text.trim()

    if (
      !userMessage ||
      loading
    ) {
      return
    }


    const now =
      new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })


    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: userMessage,
      time: now
    }


    const botMsg = {
      id: Date.now() + 1,
      sender: 'bot',
      text: getBotReply(userMessage),
      time: now
    }


    setMessages(prev => [
      ...prev,
      userMsg
    ])


    setMessage('')

    setLoading(true)


    // Small delay to make it feel like an AI response

    setTimeout(() => {

      setMessages(prev => [
        ...prev,
        botMsg
      ])

      setLoading(false)

    }, 500)

  }


  // =====================================================
  // CLEAR CHAT
  // =====================================================

  function clearChat() {

    setMessages([
      {
        ...welcomeMessage,
        id: Date.now(),
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    ])

    localStorage.removeItem(
      STORAGE_KEY
    )

    setShowClearConfirm(false)
  }


  // =====================================================
  // NAVIGATION
  // =====================================================

  function goToReport() {

    setOpen(false)

    navigate('/report')

  }


  function goToMyIssues() {

    setOpen(false)

    navigate('/my-issues')

  }


  // =====================================================
  // UI
  // =====================================================

  return (
    <>

      {/* =================================================
          FLOATING BUTTON
      ================================================= */}

      <button
        onClick={() =>
          setOpen(!open)
        }
        aria-label="Open Civic Assistant"
        style={{
          position: 'fixed',
          right: '25px',
          bottom: '25px',
          width: '62px',
          height: '62px',
          borderRadius: '50%',
          border: '3px solid white',
          background:
            'linear-gradient(135deg, #0a0f2e, #111a45)',
          color: 'white',
          fontSize: '26px',
          cursor: 'pointer',
          boxShadow:
            '0 8px 30px rgba(0,0,0,0.28)',
          zIndex: 9999,
          transition: 'transform 0.2s'
        }}
      >
        {open ? '✕' : '🤖'}
      </button>


      {/* =================================================
          CHAT WINDOW
      ================================================= */}

      {open && (

        <div
          style={{
            position: 'fixed',
            right: '25px',
            bottom: '100px',

            width: '380px',
            maxWidth:
              'calc(100vw - 30px)',

            height: '560px',
            maxHeight:
              'calc(100vh - 130px)',

            background: '#ffffff',

            borderRadius: '20px',

            boxShadow:
              '0 20px 60px rgba(0,0,0,0.25)',

            overflow: 'hidden',

            display: 'flex',
            flexDirection: 'column',

            zIndex: 9998,

            border:
              '1px solid #e2e8f0'
          }}
        >


          {/* =================================================
              HEADER
          ================================================= */}

          <div
            style={{
              background:
                'linear-gradient(135deg, #0a0f2e, #111a45)',

              padding: '16px',

              color: 'white',

              display: 'flex',

              alignItems: 'center',

              gap: '12px'
            }}
          >

            {/* Bot icon */}

            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: '#f59e0b',

                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',

                fontSize: '23px',

                flexShrink: 0
              }}
            >
              🤖
            </div>


            {/* Title */}

            <div
              style={{
                flex: 1
              }}
            >

              <div
                style={{
                  fontWeight: 700,
                  fontSize: '16px'
                }}
              >
                Civic Assistant
              </div>

              <div
                style={{
                  fontSize: '11px',
                  color: '#cbd5e1',
                  marginTop: '2px'
                }}
              >
                ● Online · Civic AI Support
              </div>

            </div>


            {/* Clear button */}

            <button
              onClick={() =>
                setShowClearConfirm(true)
              }
              title="Clear chat history"
              style={{
                border: 'none',
                background:
                  'rgba(255,255,255,0.1)',
                color: 'white',
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              🗑️
            </button>

          </div>


          {/* =================================================
              CLEAR CONFIRMATION
          ================================================= */}

          {showClearConfirm && (

            <div
              style={{
                position: 'absolute',
                top: '72px',
                left: '15px',
                right: '15px',
                background: 'white',
                borderRadius: '12px',
                padding: '15px',
                boxShadow:
                  '0 8px 30px rgba(0,0,0,0.18)',
                zIndex: 10,
                border:
                  '1px solid #e2e8f0'
              }}
            >

              <div
                style={{
                  fontWeight: 700,
                  color: '#0a0f2e',
                  marginBottom: '5px'
                }}
              >
                Clear chat history?
              </div>

              <div
                style={{
                  fontSize: '12px',
                  color: '#64748b',
                  marginBottom: '12px'
                }}
              >
                All previous chatbot messages will
                be removed from this browser.
              </div>


              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px'
                }}
              >

                <button
                  onClick={() =>
                    setShowClearConfirm(false)
                  }
                  style={{
                    border:
                      '1px solid #e2e8f0',
                    background: 'white',
                    padding:
                      '7px 12px',
                    borderRadius: '7px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>


                <button
                  onClick={clearChat}
                  style={{
                    border: 'none',
                    background: '#dc2626',
                    color: 'white',
                    padding:
                      '7px 12px',
                    borderRadius: '7px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Clear
                </button>

              </div>

            </div>

          )}


          {/* =================================================
              MESSAGES
          ================================================= */}

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '15px',
              background: '#f8f9fc'
            }}
          >

            {messages.map(msg => (

              <div
                key={msg.id}
                style={{
                  display: 'flex',

                  justifyContent:
                    msg.sender === 'user'
                      ? 'flex-end'
                      : 'flex-start',

                  marginBottom: '13px'
                }}
              >

                <div
                  style={{
                    maxWidth: '82%',

                    padding:
                      '10px 13px',

                    borderRadius:
                      msg.sender === 'user'
                        ? '15px 15px 4px 15px'
                        : '15px 15px 15px 4px',

                    background:
                      msg.sender === 'user'
                        ? '#0a0f2e'
                        : '#ffffff',

                    color:
                      msg.sender === 'user'
                        ? '#ffffff'
                        : '#334155',

                    fontSize: '13px',

                    lineHeight: 1.55,

                    whiteSpace:
                      'pre-line',

                    boxShadow:
                      msg.sender === 'bot'
                        ? '0 2px 7px rgba(0,0,0,0.07)'
                        : 'none'
                  }}
                >

                  {msg.text}

                  <div
                    style={{
                      fontSize: '9px',
                      marginTop: '5px',
                      color:
                        msg.sender === 'user'
                          ? 'rgba(255,255,255,0.55)'
                          : '#94a3b8',
                      textAlign:
                        'right'
                    }}
                  >
                    {msg.time}
                  </div>

                </div>

              </div>

            ))}


            {/* =================================================
                TYPING INDICATOR
            ================================================= */}

            {loading && (

              <div
                style={{
                  display: 'flex',
                  marginBottom: '13px'
                }}
              >

                <div
                  style={{
                    background: 'white',
                    padding:
                      '11px 15px',
                    borderRadius:
                      '15px 15px 15px 4px',
                    color: '#64748b',
                    fontSize: '13px',
                    boxShadow:
                      '0 2px 7px rgba(0,0,0,0.07)'
                  }}
                >
                  <span>●</span>
                  <span
                    style={{
                      marginLeft: '4px'
                    }}
                  >
                    ●
                  </span>
                  <span
                    style={{
                      marginLeft: '4px'
                    }}
                  >
                    ●
                  </span>
                </div>

              </div>

            )}


            {/* =================================================
                QUICK ACTIONS
            ================================================= */}

            {messages.length === 1 && !loading && (

              <div
                style={{
                  marginTop: '15px'
                }}
              >

                <p
                  style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    marginBottom: '9px',
                    fontWeight: 600
                  }}
                >
                  QUICK ACTIONS
                </p>


                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '1fr 1fr',
                    gap: '7px',
                    marginBottom: '12px'
                  }}
                >

                  <button
                    onClick={goToReport}
                    style={{
                      padding: '10px 8px',
                      border:
                        '1px solid #e2e8f0',
                      background: 'white',
                      borderRadius: '9px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      color: '#334155',
                      fontWeight: 600
                    }}
                  >
                    📝 Report Issue
                  </button>


                  <button
                    onClick={goToMyIssues}
                    style={{
                      padding: '10px 8px',
                      border:
                        '1px solid #e2e8f0',
                      background: 'white',
                      borderRadius: '9px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      color: '#334155',
                      fontWeight: 600
                    }}
                  >
                    📋 My Issues
                  </button>

                </div>


                <p
                  style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    marginBottom: '8px',
                    fontWeight: 600
                  }}
                >
                  SUGGESTED QUESTIONS
                </p>


                {suggestions.map(
                  suggestion => (

                    <button
                      key={suggestion.text}
                      onClick={() =>
                        sendMessage(
                          suggestion.text
                        )
                      }
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding:
                          '9px 11px',
                        marginBottom: '7px',
                        background: 'white',
                        border:
                          '1px solid #e2e8f0',
                        borderRadius: '9px',
                        cursor: 'pointer',
                        color: '#334155',
                        fontSize: '12px'
                      }}
                    >
                      {suggestion.icon}{' '}
                      {suggestion.text}
                    </button>

                  )
                )}

              </div>

            )}

            <div
              ref={messagesEndRef}
            />

          </div>


          {/* =================================================
              INPUT
          ================================================= */}

          <div
            style={{
              padding: '11px',
              borderTop:
                '1px solid #e2e8f0',
              background: 'white',
              display: 'flex',
              gap: '8px'
            }}
          >

            <input
              value={message}

              onChange={e =>
                setMessage(
                  e.target.value
                )
              }

              onKeyDown={e => {

                if (
                  e.key === 'Enter' &&
                  !e.shiftKey
                ) {

                  e.preventDefault()

                  sendMessage()

                }

              }}

              placeholder="Ask about civic issues..."

              disabled={loading}

              style={{
                flex: 1,
                border:
                  '1px solid #e2e8f0',
                borderRadius: '10px',
                padding:
                  '10px 12px',
                outline: 'none',
                fontSize: '13px',
                background:
                  loading
                    ? '#f8fafc'
                    : 'white'
              }}
            />


            <button
              onClick={() =>
                sendMessage()
              }

              disabled={
                !message.trim() ||
                loading
              }

              style={{
                width: '44px',
                border: 'none',
                borderRadius: '10px',

                background:
                  message.trim() &&
                  !loading
                    ? '#f59e0b'
                    : '#e2e8f0',

                color: '#0a0f2e',

                fontWeight: 700,

                cursor:
                  message.trim() &&
                  !loading
                    ? 'pointer'
                    : 'not-allowed',

                fontSize: '16px'
              }}
            >
              ➤
            </button>

          </div>


          {/* Footer */}

          <div
            style={{
              textAlign: 'center',
              fontSize: '9px',
              color: '#94a3b8',
              padding:
                '5px 10px 7px',
              background: 'white'
            }}
          >
            Civic Issue Reporting System
          </div>

        </div>

      )}

    </>
  )
}