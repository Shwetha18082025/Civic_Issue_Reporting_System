import { useEffect, useRef, useState } from 'react'

export default function LivePhotoCapture({
  onCapture,
  onClose,
}) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const [cameraError, setCameraError] = useState('')
  const [capturedImage, setCapturedImage] = useState(null)

  // Start camera when component opens
  useEffect(() => {
    startCamera()

    return () => {
      stopCamera()
    }
  }, [])

  // ---------------------------------------------------------
  // Start laptop webcam
  // ---------------------------------------------------------
  async function startCamera() {
    try {
      setCameraError('')

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setCameraError(
          'Camera access is not supported by this browser.'
        )
        return
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            width: {
              ideal: 1280,
            },
            height: {
              ideal: 720,
            },
          },
          audio: false,
        })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject =
          stream
      }
    } catch (error) {
      console.error(
        'Camera error:',
        error
      )

      setCameraError(
        'Unable to access your camera. Please allow camera permission and try again.'
      )
    }
  }

  // ---------------------------------------------------------
  // Stop camera
  // ---------------------------------------------------------
  function stopCamera() {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach(track => {
          track.stop()
        })

      streamRef.current = null
    }
  }

  // ---------------------------------------------------------
  // Capture current webcam frame
  // ---------------------------------------------------------
  function capturePhoto() {
    const video = videoRef.current

    if (!video) {
      return
    }

    if (
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      setCameraError(
        'Camera is not ready yet. Please wait a moment and try again.'
      )
      return
    }

    const canvas =
      document.createElement('canvas')

    canvas.width =
      video.videoWidth

    canvas.height =
      video.videoHeight

    const context =
      canvas.getContext('2d')

    if (!context) {
      setCameraError(
        'Could not capture the image.'
      )
      return
    }

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    )

    const imageData =
      canvas.toDataURL(
        'image/jpeg',
        0.9
      )

    setCapturedImage(
      imageData
    )
  }

  // ---------------------------------------------------------
  // Retake
  // ---------------------------------------------------------
  function retakePhoto() {
    setCapturedImage(null)
    setCameraError('')
  }

  // ---------------------------------------------------------
  // Convert captured image to File
  // ---------------------------------------------------------
  async function usePhoto() {
    if (!capturedImage) {
      return
    }

    try {
      const response =
        await fetch(
          capturedImage
        )

      const blob =
        await response.blob()

      const file =
        new File(
          [blob],
          `live-photo-${Date.now()}.jpg`,
          {
            type: 'image/jpeg',
          }
        )

      // Send File back to ReportIssue.jsx
      onCapture(file)

      stopCamera()
      onClose()
    } catch (error) {
      console.error(
        'Photo conversion error:',
        error
      )

      setCameraError(
        'Could not prepare the captured photo.'
      )
    }
  }

  // ---------------------------------------------------------
  // Close camera
  // ---------------------------------------------------------
  function handleClose() {
    stopCamera()
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background:
          'rgba(0, 0, 0, 0.78)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '650px',
          background: 'white',
          borderRadius: '20px',
          padding: '20px',
          boxShadow:
            '0 20px 50px rgba(0,0,0,0.3)',
        }}
      >

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              'space-between',
            marginBottom: '15px',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: '#0a0f2e',
                fontSize: '1.25rem',
                fontWeight: 700,
              }}
            >
              📷 Capture Live Photo
            </h2>

            <p
              style={{
                margin:
                  '5px 0 0',
                color: '#64748b',
                fontSize:
                  '0.8rem',
              }}
            >
              Use your laptop webcam
              to capture the civic issue.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            style={{
              width: '35px',
              height: '35px',
              borderRadius: '50%',
              border: 'none',
              background: '#f1f5f9',
              color: '#475569',
              fontSize: '18px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Camera Error */}
        {cameraError && (
          <div
            style={{
              background: '#fef2f2',
              border:
                '1px solid #fecaca',
              color: '#dc2626',
              padding: '12px',
              borderRadius: '10px',
              marginBottom: '15px',
              fontSize: '0.85rem',
            }}
          >
            ⚠️ {cameraError}
          </div>
        )}

        {/* Camera / Preview */}
        {!capturedImage ? (
          <div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                minHeight: '300px',
                maxHeight: '500px',
                objectFit: 'cover',
                background: '#000',
                borderRadius: '14px',
                display: 'block',
              }}
            />

            <button
              type="button"
              onClick={
                capturePhoto
              }
              disabled={
                !!cameraError
              }
              style={{
                width: '100%',
                marginTop: '15px',
                padding: '14px',
                border: 'none',
                borderRadius: '10px',
                background:
                  cameraError
                    ? '#cbd5e1'
                    : '#dc2626',
                color: 'white',
                fontSize:
                  '0.95rem',
                fontWeight: 700,
                cursor:
                  cameraError
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              📸 Capture Photo
            </button>
          </div>
        ) : (
          <div>
            <img
              src={capturedImage}
              alt="Captured civic issue"
              style={{
                width: '100%',
                maxHeight: '500px',
                objectFit: 'contain',
                background: '#000',
                borderRadius: '14px',
                display: 'block',
              }}
            />

            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginTop: '15px',
              }}
            >

              <button
                type="button"
                onClick={
                  retakePhoto
                }
                style={{
                  flex: 1,
                  padding: '13px',
                  borderRadius: '10px',
                  border:
                    '1.5px solid #cbd5e1',
                  background: 'white',
                  color: '#475569',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                🔄 Retake
              </button>

              <button
                type="button"
                onClick={
                  usePhoto
                }
                style={{
                  flex: 1,
                  padding: '13px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#16a34a',
                  color: 'white',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ✅ Use Photo
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}