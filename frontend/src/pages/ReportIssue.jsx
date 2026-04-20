import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { v4 as uuidv4 } from 'uuid'

const inputStyle = {
  width: '100%',
  border: '1.5px solid #e2e8f0',
  borderRadius: '10px',
  padding: '0.75rem 1rem',
  fontSize: '0.95rem',
  fontFamily: 'DM Sans, sans-serif',
  outline: 'none',
  transition: 'border-color 0.2s',
  background: 'white',
  color: '#0a0f2e',
}

const labelStyle = {
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#0a0f2e',
  marginBottom: '0.5rem',
}

export default function ReportIssue() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    address: '',
    ward: '',
    city: '',
    latitude: null,
    longitude: null,
  })
  const [images, setImages] = useState([])       // File objects
  const [previews, setPreviews] = useState([])   // Preview URLs
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locationLoading, setLocationLoading] = useState(false)
  const [step, setStep] = useState(1)            // 1 = details, 2 = location, 3 = photos
  const fileInputRef = useRef()

  // Load categories from Supabase
  useEffect(() => {
    supabase.from('categories').select('*').order('name')
      .then(({ data }) => { if (data) setCategories(data) })
  }, [])

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Image selection
  function handleImageChange(e) {
    const files = Array.from(e.target.files)
    if (images.length + files.length > 3) {
      setError('Maximum 3 images allowed.')
      return
    }
    const validFiles = files.filter(f => f.size < 5 * 1024 * 1024) // 5MB limit
    if (validFiles.length !== files.length) {
      setError('Some files were skipped — max size is 5MB per image.')
    }
    setImages(prev => [...prev, ...validFiles])
    const newPreviews = validFiles.map(f => URL.createObjectURL(f))
    setPreviews(prev => [...prev, ...newPreviews])
  }

  function removeImage(index) {
    setImages(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  // GPS location detection
  function detectLocation() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setFormData(prev => ({ ...prev, latitude, longitude }))

        // Reverse geocode using OpenStreetMap Nominatim (free, no API key)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )
          const data = await res.json()
          const addr = data.address
          setFormData(prev => ({
            ...prev,
            address: data.display_name?.split(',').slice(0, 3).join(',') || '',
            city: addr.city || addr.town || addr.village || '',
            ward: addr.suburb || addr.neighbourhood || addr.county || '',
          }))
        } catch {
          // If geocoding fails, coordinates are still saved
        }
        setLocationLoading(false)
      },
      (err) => {
        setError('Could not detect location. Please enter it manually.')
        setLocationLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Upload images to Supabase Storage
  async function uploadImages(issueId) {
    const uploadedUrls = []
    for (const file of images) {
      const ext = file.name.split('.').pop()
      const fileName = `${issueId}/${uuidv4()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('issue-images')
        .upload(fileName, file, { contentType: file.type })

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('issue-images')
          .getPublicUrl(fileName)
        uploadedUrls.push(publicUrl)
      }
    }
    return uploadedUrls
  }

  // Final submit
  async function handleSubmit() {
    setError('')

    if (!formData.title.trim()) return setError('Please enter a title.')
    if (!formData.description.trim()) return setError('Please enter a description.')
    if (!formData.category_id) return setError('Please select a category.')
    if (!formData.latitude || !formData.longitude) return setError('Please detect or enter your location.')

    setLoading(true)
    try {
      // 1. Insert the issue
      const { data: issue, error: issueError } = await supabase
        .from('issues')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim(),
          category_id: formData.category_id,
          address: formData.address,
          ward: formData.ward,
          city: formData.city,
          latitude: formData.latitude,
          longitude: formData.longitude,
          reported_by: user.id,
          status: 'pending',
          priority: 'medium',
        })
        .select()
        .single()

      if (issueError) throw issueError

      // 2. Upload images if any
      if (images.length > 0) {
        const imageUrls = await uploadImages(issue.id)
        // Save image URLs to issue_images table
        const imageRows = imageUrls.map(url => ({
          issue_id: issue.id,
          image_url: url,
        }))
        await supabase.from('issue_images').insert(imageRows)
      }

      // 3. Redirect to my issues
      navigate('/my-issues', {
        state: { success: 'Issue reported successfully! Authorities have been notified.' }
      })

    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const stepTitles = ['Issue Details', 'Location', 'Photos & Submit']
  const canProceedStep1 = formData.title && formData.description && formData.category_id
  const canProceedStep2 = formData.latitude && formData.longitude

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', background: '#f8f9fc' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0a0f2e, #111a45)', padding: '3rem 1.5rem 2rem' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '2rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>
            Report a Civic Issue
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem' }}>
            Help us fix your city — fill in the details below.
          </p>

          {/* Step indicators */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.75rem' }}>
            {stepTitles.map((title, i) => (
              <div key={title} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: step > i + 1 ? '#f59e0b' : step === i + 1 ? '#f59e0b' : 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700,
                  color: step >= i + 1 ? '#0a0f2e' : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.3s',
                }}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span style={{
                  fontSize: '0.8rem', fontWeight: 500,
                  color: step === i + 1 ? '#fcd34d' : 'rgba(255,255,255,0.4)',
                }}>
                  {title}
                </span>
                {i < stepTitles.length - 1 && (
                  <div style={{ width: '2rem', height: '1px', background: 'rgba(255,255,255,0.15)', margin: '0 0.25rem' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div style={{ maxWidth: '680px', margin: '2rem auto', padding: '0 1.5rem 4rem' }}>
        <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(10,15,46,0.06)' }}>

          {/* Error */}
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '10px', padding: '0.75rem 1rem',
              color: '#dc2626', fontSize: '0.875rem', marginBottom: '1.5rem',
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* ── Step 1: Issue Details ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={labelStyle}>Issue Title *</label>
                <input
                  style={inputStyle}
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Large pothole near bus stop"
                  onFocus={e => e.target.style.borderColor = '#f59e0b'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div>
                <label style={labelStyle}>Category *</label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  onFocus={e => e.target.style.borderColor = '#f59e0b'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                >
                  <option value="">Select a category...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Description *</label>
                <textarea
                  style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the issue in detail — how bad is it, how long has it been there, any safety risk?"
                  onFocus={e => e.target.style.borderColor = '#f59e0b'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <button
                onClick={() => { setError(''); setStep(2) }}
                disabled={!canProceedStep1}
                style={{
                  width: '100%', padding: '0.85rem',
                  background: canProceedStep1 ? '#f59e0b' : '#e2e8f0',
                  color: canProceedStep1 ? '#0a0f2e' : '#94a3b8',
                  border: 'none', borderRadius: '10px',
                  fontSize: '0.95rem', fontWeight: 600,
                  cursor: canProceedStep1 ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                }}
              >
                Continue to Location →
              </button>
            </div>
          )}

          {/* ── Step 2: Location ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* GPS detect button */}
              <div style={{
                background: '#f8f9fc', border: '1.5px dashed #cbd5e1',
                borderRadius: '12px', padding: '1.5rem', textAlign: 'center',
              }}>
                {formData.latitude ? (
                  <div>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📍</div>
                    <p style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.9rem' }}>Location detected!</p>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
                    </p>
                    {formData.address && (
                      <p style={{ color: '#475569', fontSize: '0.82rem', marginTop: '0.5rem' }}>{formData.address}</p>
                    )}
                    <button
                      onClick={detectLocation}
                      style={{ marginTop: '0.75rem', background: 'none', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.4rem 0.9rem', fontSize: '0.8rem', color: '#64748b', cursor: 'pointer' }}
                    >
                      Re-detect
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🗺️</div>
                    <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1rem' }}>
                      Allow location access to auto-detect your position
                    </p>
                    <button
                      onClick={detectLocation}
                      disabled={locationLoading}
                      style={{
                        background: '#0a0f2e', color: 'white',
                        border: 'none', borderRadius: '9999px',
                        padding: '0.6rem 1.5rem', fontSize: '0.9rem',
                        fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      {locationLoading ? '⏳ Detecting...' : '📍 Detect My Location'}
                    </button>
                  </div>
                )}
              </div>

              {/* Manual fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>City</label>
                  <input style={inputStyle} name="city" value={formData.city} onChange={handleChange} placeholder="e.g. Bengaluru"
                    onFocus={e => e.target.style.borderColor = '#f59e0b'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>
                <div>
                  <label style={labelStyle}>Ward / Area</label>
                  <input style={inputStyle} name="ward" value={formData.ward} onChange={handleChange} placeholder="e.g. Koramangala"
                    onFocus={e => e.target.style.borderColor = '#f59e0b'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Full Address</label>
                <input style={inputStyle} name="address" value={formData.address} onChange={handleChange} placeholder="Street address or landmark"
                  onFocus={e => e.target.style.borderColor = '#f59e0b'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    flex: 1, padding: '0.85rem',
                    background: 'white', color: '#475569',
                    border: '1.5px solid #e2e8f0', borderRadius: '10px',
                    fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={() => { setError(''); setStep(3) }}
                  disabled={!canProceedStep2}
                  style={{
                    flex: 2, padding: '0.85rem',
                    background: canProceedStep2 ? '#f59e0b' : '#e2e8f0',
                    color: canProceedStep2 ? '#0a0f2e' : '#94a3b8',
                    border: 'none', borderRadius: '10px',
                    fontSize: '0.95rem', fontWeight: 600,
                    cursor: canProceedStep2 ? 'pointer' : 'not-allowed',
                  }}
                >
                  Continue to Photos →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Photos & Submit ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Upload area */}
              <div>
                <label style={labelStyle}>Upload Photos <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional, max 3)</span></label>
                <div
                  onClick={() => fileInputRef.current.click()}
                  style={{
                    border: '2px dashed #cbd5e1', borderRadius: '12px',
                    padding: '2rem', textAlign: 'center', cursor: 'pointer',
                    transition: 'all 0.2s', background: '#f8f9fc',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.background = '#fffbeb' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8f9fc' }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📸</div>
                  <p style={{ color: '#475569', fontSize: '0.9rem', fontWeight: 500 }}>Click to upload photos</p>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.25rem' }}>JPG, PNG up to 5MB each</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Image previews */}
              {previews.length > 0 && (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {previews.map((src, i) => (
                    <div key={i} style={{ position: 'relative', width: '100px', height: '100px' }}>
                      <img
                        src={src} alt={`preview-${i}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px', border: '2px solid #e2e8f0' }}
                      />
                      <button
                        onClick={() => removeImage(i)}
                        style={{
                          position: 'absolute', top: '-8px', right: '-8px',
                          width: '22px', height: '22px', borderRadius: '50%',
                          background: '#ef4444', color: 'white', border: 'none',
                          fontSize: '0.7rem', cursor: 'pointer', fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary before submit */}
              <div style={{ background: '#f8f9fc', borderRadius: '12px', padding: '1rem 1.25rem', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Summary</p>
                <p style={{ fontSize: '0.9rem', color: '#0a0f2e', fontWeight: 500 }}>{formData.title}</p>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.2rem' }}>
                  {categories.find(c => c.id === formData.category_id)?.name} · {formData.city || 'Location set'} · {images.length} photo{images.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setStep(2)}
                  style={{
                    flex: 1, padding: '0.85rem',
                    background: 'white', color: '#475569',
                    border: '1.5px solid #e2e8f0', borderRadius: '10px',
                    fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    flex: 2, padding: '0.85rem',
                    background: loading ? '#e2e8f0' : '#f59e0b',
                    color: loading ? '#94a3b8' : '#0a0f2e',
                    border: 'none', borderRadius: '10px',
                    fontSize: '0.95rem', fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {loading ? '⏳ Submitting...' : '🚀 Submit Issue'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}