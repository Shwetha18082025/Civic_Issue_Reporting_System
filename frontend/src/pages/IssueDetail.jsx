import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import jsPDF from 'jspdf'

const STATUS_STYLE = {
  pending: {
    bg: '#fef3c7',
    color: '#92400e',
    label: 'Pending'
  },
  assigned: {
    bg: '#dbeafe',
    color: '#1e40af',
    label: 'Assigned'
  },
  in_progress: {
    bg: '#e0e7ff',
    color: '#3730a3',
    label: 'In Progress'
  },
  resolved: {
    bg: '#dcfce7',
    color: '#166534',
    label: 'Resolved'
  },
  rejected: {
    bg: '#fee2e2',
    color: '#991b1b',
    label: 'Rejected'
  },
}

const PRIORITY_STYLE = {
  low: {
    color: '#16a34a',
    bg: '#dcfce7'
  },
  medium: {
    color: '#d97706',
    bg: '#fef3c7'
  },
  high: {
    color: '#dc2626',
    bg: '#fee2e2'
  },
  critical: {
    color: '#7c3aed',
    bg: '#ede9fe'
  },
}

const STATUSES = [
  'pending',
  'assigned',
  'in_progress',
  'resolved'
]

export default function IssueDetail() {

  const { id } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [issue, setIssue] = useState(null)
  const [images, setImages] = useState([])
  const [comments, setComments] = useState([])

  const [hasUpvoted, setHasUpvoted] = useState(false)
  const [upvoteCount, setUpvoteCount] = useState(0)
  const [upvoteLoading, setUpvoteLoading] = useState(false)

  const [newComment, setNewComment] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)

  const [loading, setLoading] = useState(true)
  const [pdfLoading, setPdfLoading] = useState(false)

  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    fetchIssue()
    fetchComments()

    if (user) {
      checkUpvote()
    }
  }, [id, user])


  // =========================================================
  // FETCH ISSUE
  // =========================================================

  async function fetchIssue() {

    setLoading(true)

    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        categories(name, icon),
        issue_images(image_url)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Issue fetch error:', error)
      setLoading(false)
      return
    }

    if (data) {

      setIssue(data)

      setImages(data.issue_images || [])

      setUpvoteCount(data.upvotes || 0)

      // Fetch reporter separately
      if (data.reported_by) {

        const { data: reporterData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.reported_by)
          .single()

        if (reporterData) {

          setIssue(prev => ({
            ...prev,
            reporter: reporterData
          }))

        }
      }
    }

    setLoading(false)
  }


  // =========================================================
  // FETCH COMMENTS
  // =========================================================

  async function fetchComments() {

    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(full_name, role)')
      .eq('issue_id', id)
      .order('created_at', {
        ascending: true
      })

    if (error) {
      console.error('Comments error:', error)
      return
    }

    setComments(data || [])
  }


  // =========================================================
  // CHECK UPVOTE
  // =========================================================

  async function checkUpvote() {

    if (!user) return

    const { data } = await supabase
      .from('upvotes')
      .select('id')
      .eq('issue_id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    setHasUpvoted(!!data)
  }


  // =========================================================
  // UPVOTE
  // =========================================================

  async function handleUpvote() {

    if (!user) {
      navigate('/login')
      return
    }

    setUpvoteLoading(true)

    try {

      if (hasUpvoted) {

        await supabase
          .from('upvotes')
          .delete()
          .eq('issue_id', id)
          .eq('user_id', user.id)

        const newCount = Math.max(0, upvoteCount - 1)

        await supabase
          .from('issues')
          .update({
            upvotes: newCount
          })
          .eq('id', id)

        setUpvoteCount(newCount)
        setHasUpvoted(false)

      } else {

        await supabase
          .from('upvotes')
          .insert({
            issue_id: id,
            user_id: user.id
          })

        const newCount = upvoteCount + 1

        await supabase
          .from('issues')
          .update({
            upvotes: newCount
          })
          .eq('id', id)

        setUpvoteCount(newCount)
        setHasUpvoted(true)
      }

    } catch (error) {

      console.error('Upvote error:', error)

    } finally {

      setUpvoteLoading(false)

    }
  }


  // =========================================================
  // ADD COMMENT
  // =========================================================

  async function handleComment() {

    if (!newComment.trim() || !user) return

    setCommentLoading(true)

    try {

      const { error } = await supabase
        .from('comments')
        .insert({
          issue_id: id,
          user_id: user.id,
          content: newComment.trim(),
          is_official: profile?.role !== 'citizen',
        })

      if (error) {
        console.error('Comment error:', error)
        return
      }

      setNewComment('')

      await fetchComments()

    } finally {

      setCommentLoading(false)

    }
  }


  // =========================================================
  // IMAGE URL -> DATA URL
  // IMPORTANT FOR PDF
  // =========================================================

  async function imageUrlToDataUrl(url) {

    try {

      if (!url) {
        return null
      }

      console.log('Downloading image for PDF:', url)

      const response = await fetch(url, {
        mode: 'cors',
        cache: 'no-cache'
      })

      if (!response.ok) {

        throw new Error(
          `Image fetch failed: ${response.status}`
        )

      }

      const blob = await response.blob()

      return await new Promise((resolve, reject) => {

        const reader = new FileReader()

        reader.onloadend = () => {

          resolve(reader.result)

        }

        reader.onerror = () => {

          reject(
            new Error('Could not convert image to Base64')
          )

        }

        reader.readAsDataURL(blob)

      })

    } catch (error) {

      console.error(
        'PDF image conversion failed:',
        error
      )

      return null
    }
  }


  // =========================================================
  // GET IMAGE FORMAT
  // =========================================================

  function getImageFormat(dataUrl) {

    if (!dataUrl) {
      return 'JPEG'
    }

    if (
      dataUrl.startsWith('data:image/png')
    ) {
      return 'PNG'
    }

    if (
      dataUrl.startsWith('data:image/webp')
    ) {
      return 'WEBP'
    }

    return 'JPEG'
  }


  // =========================================================
  // ADD PAGE NUMBER
  // =========================================================

  function addPageNumber(doc) {

    const pageCount = doc.getNumberOfPages()

    for (let i = 1; i <= pageCount; i++) {

      doc.setPage(i)

      doc.setFontSize(8)

      doc.setTextColor(120, 120, 120)

      doc.text(
        `Civic Issue Reporting System  |  Page ${i} of ${pageCount}`,
        105,
        290,
        {
          align: 'center'
        }
      )
    }
  }


  // =========================================================
  // CHECK SPACE
  // =========================================================

  function checkPageSpace(doc, y, requiredHeight = 20) {

    if (y + requiredHeight > 270) {

      doc.addPage()

      return 20

    }

    return y
  }


  // =========================================================
  // GENERATE PROFESSIONAL PDF
  // =========================================================

  async function generatePDF() {

    if (!issue) return

    setPdfLoading(true)

    try {

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })


      // -----------------------------------------------------
      // COLORS
      // -----------------------------------------------------

      const NAVY = [10, 15, 46]
      const GOLD = [245, 158, 11]
      const TEXT = [30, 41, 59]
      const MUTED = [100, 116, 139]
      const LIGHT = [248, 250, 252]
      const BORDER = [226, 232, 240]
      const GREEN = [22, 163, 74]
      const RED = [220, 38, 38]
      const PURPLE = [124, 58, 237]


      // -----------------------------------------------------
      // HEADER
      // -----------------------------------------------------

      doc.setFillColor(...NAVY)

      doc.rect(
        0,
        0,
        210,
        34,
        'F'
      )

      doc.setFillColor(...GOLD)

      doc.rect(
        0,
        31,
        210,
        3,
        'F'
      )


      // Logo / Icon
      doc.setFillColor(...GOLD)

      doc.circle(
        20,
        16,
        7,
        'F'
      )

      doc.setTextColor(...NAVY)

      doc.setFontSize(11)

      doc.setFont('helvetica', 'bold')

      doc.text(
        'C',
        20,
        20,
        {
          align: 'center'
        }
      )


      // Header title
      doc.setTextColor(255, 255, 255)

      doc.setFontSize(15)

      doc.setFont('helvetica', 'bold')

      doc.text(
        'CIVIC ISSUE REPORT',
        32,
        14
      )

      doc.setFontSize(8)

      doc.setFont('helvetica', 'normal')

      doc.setTextColor(203, 213, 225)

      doc.text(
        'Official Issue Documentation',
        32,
        21
      )


      // -----------------------------------------------------
      // REPORT ID
      // -----------------------------------------------------

      const reportId = issue.id
        ? issue.id.substring(0, 8).toUpperCase()
        : 'N/A'

      const generatedDate =
        new Date().toLocaleString(
          'en-IN',
          {
            dateStyle: 'medium',
            timeStyle: 'short'
          }
        )

      doc.setTextColor(255, 255, 255)

      doc.setFontSize(8)

      doc.text(
        `REPORT ID: ${reportId}`,
        190,
        13,
        {
          align: 'right'
        }
      )

      doc.text(
        `Generated: ${generatedDate}`,
        190,
        20,
        {
          align: 'right'
        }
      )


      // -----------------------------------------------------
      // START CONTENT
      // -----------------------------------------------------

      let y = 46


      // -----------------------------------------------------
      // TITLE
      // -----------------------------------------------------

      doc.setTextColor(...NAVY)

      doc.setFontSize(18)

      doc.setFont('helvetica', 'bold')

      doc.text(
        issue.title || 'Civic Issue',
        15,
        y
      )

      y += 9


      // -----------------------------------------------------
      // STATUS + PRIORITY
      // -----------------------------------------------------

      const statusLabel =
        STATUS_STYLE[issue.status]?.label ||
        'Pending'

      const priorityLabel =
        issue.priority
          ? issue.priority.toUpperCase()
          : 'MEDIUM'


      doc.setFontSize(9)

      doc.setFont('helvetica', 'bold')

      doc.setFillColor(
        ...(STATUS_STYLE[issue.status]?.bg
          ? hexToRgb(STATUS_STYLE[issue.status].bg)
          : [254, 243, 199])
      )

      doc.roundedRect(
        15,
        y - 5,
        32,
        7,
        2,
        2,
        'F'
      )

      doc.setTextColor(...TEXT)

      doc.text(
        statusLabel,
        31,
        y,
        {
          align: 'center'
        }
      )


      doc.setFillColor(
        ...(priority.bg
          ? hexToRgb(priority.bg)
          : [254, 243, 199])
      )

      doc.roundedRect(
        51,
        y - 5,
        38,
        7,
        2,
        2,
        'F'
      )

      doc.text(
        `${priorityLabel} PRIORITY`,
        70,
        y,
        {
          align: 'center'
        }
      )

      y += 12


      // -----------------------------------------------------
      // SECTION HELPER
      // -----------------------------------------------------

      function sectionTitle(title) {

        y = checkPageSpace(
          doc,
          y,
          20
        )

        doc.setFillColor(...NAVY)

        doc.rect(
          15,
          y - 5,
          180,
          8,
          'F'
        )

        doc.setTextColor(255, 255, 255)

        doc.setFontSize(9)

        doc.setFont('helvetica', 'bold')

        doc.text(
          title.toUpperCase(),
          19,
          y
        )

        y += 10
      }


      // -----------------------------------------------------
      // ISSUE INFORMATION
      // -----------------------------------------------------

      sectionTitle('Issue Information')

      const category =
        issue.categories?.name ||
        issue.ml_category ||
        'Not specified'

      const reporter =
        issue.reporter?.full_name ||
        'Anonymous'

      const createdDate =
        issue.created_at
          ? new Date(issue.created_at).toLocaleString(
              'en-IN'
            )
          : 'N/A'


      const issueInfo = [
        ['Category', category],
        ['Reported By', reporter],
        ['Reported On', createdDate],
        ['Issue ID', issue.id || 'N/A'],
      ]


      doc.setFontSize(9)

      issueInfo.forEach(([label, value]) => {

        y = checkPageSpace(
          doc,
          y,
          8
        )

        doc.setTextColor(...MUTED)

        doc.setFont('helvetica', 'bold')

        doc.text(
          `${label}:`,
          18,
          y
        )

        doc.setTextColor(...TEXT)

        doc.setFont('helvetica', 'normal')

        const lines = doc.splitTextToSize(
          String(value),
          125
        )

        doc.text(
          lines,
          55,
          y
        )

        y += Math.max(
          7,
          lines.length * 5
        )
      })


      // -----------------------------------------------------
      // DESCRIPTION
      // -----------------------------------------------------

      sectionTitle('Description')

      doc.setTextColor(...TEXT)

      doc.setFontSize(9)

      doc.setFont('helvetica', 'normal')

      const descriptionLines =
        doc.splitTextToSize(
          issue.description || 'No description provided.',
          170
        )

      descriptionLines.forEach(line => {

        y = checkPageSpace(
          doc,
          y,
          6
        )

        doc.text(
          line,
          18,
          y
        )

        y += 5

      })

      y += 5


      // -----------------------------------------------------
      // LOCATION
      // -----------------------------------------------------

      sectionTitle('Location / GPS Information')

      const locationInfo = [
        ['Address', issue.address || 'Not available'],
        ['Ward / Area', issue.ward || 'Not available'],
        ['City', issue.city || 'Not available'],
        [
          'Latitude',
          issue.latitude != null
            ? String(issue.latitude)
            : 'Not available'
        ],
        [
          'Longitude',
          issue.longitude != null
            ? String(issue.longitude)
            : 'Not available'
        ],
      ]


      doc.setFontSize(9)

      locationInfo.forEach(([label, value]) => {

        y = checkPageSpace(
          doc,
          y,
          7
        )

        doc.setTextColor(...MUTED)

        doc.setFont('helvetica', 'bold')

        doc.text(
          `${label}:`,
          18,
          y
        )

        doc.setTextColor(...TEXT)

        doc.setFont('helvetica', 'normal')

        const lines =
          doc.splitTextToSize(
            String(value),
            125
          )

        doc.text(
          lines,
          55,
          y
        )

        y += Math.max(
          6,
          lines.length * 5
        )
      })


      // Google Maps
      if (
        issue.latitude != null &&
        issue.longitude != null
      ) {

        y += 2

        doc.setTextColor(
          30,
          64,
          175
        )

        doc.setFontSize(8)

        doc.text(
          `Google Maps: https://maps.google.com/?q=${issue.latitude},${issue.longitude}`,
          18,
          y
        )

        y += 8
      }


      // -----------------------------------------------------
      // AI ANALYSIS
      // -----------------------------------------------------

      if (issue.ml_category) {

        sectionTitle('AI Analysis')

        doc.setFillColor(
          250,
          245,
          255
        )

        doc.roundedRect(
          15,
          y - 5,
          180,
          25,
          3,
          3,
          'F'
        )

        doc.setTextColor(...PURPLE)

        doc.setFontSize(9)

        doc.setFont('helvetica', 'bold')

        doc.text(
          'AI Detected Category',
          20,
          y + 3
        )

        doc.setTextColor(...TEXT)

        doc.setFont('helvetica', 'normal')

        doc.text(
          String(
            issue.ml_category
          ).replace(/_/g, ' '),
          75,
          y + 3
        )

        doc.setTextColor(...PURPLE)

        doc.setFont('helvetica', 'bold')

        doc.text(
          'Confidence',
          20,
          y + 12
        )

        doc.setTextColor(...TEXT)

        doc.text(
          issue.ml_confidence != null
            ? `${(
                issue.ml_confidence * 100
              ).toFixed(1)}%`
            : 'N/A',
          75,
          y + 12
        )

        y += 32
      }


      // -----------------------------------------------------
      // PHOTOS
      // -----------------------------------------------------

      if (images.length > 0) {

        sectionTitle(
          `Issue Photos (${images.length})`
        )

        doc.setFontSize(8)

        doc.setTextColor(...MUTED)

        doc.text(
          'Photos attached to the submitted civic issue.',
          18,
          y
        )

        y += 8


        // IMPORTANT:
        // Convert every Supabase URL to Base64 first.
        // This is what allows jsPDF to embed the image.

        for (let i = 0; i < images.length; i++) {

          const imageUrl =
            images[i]?.image_url

          if (!imageUrl) {
            continue
          }


          console.log(
            `Preparing PDF image ${i + 1}:`,
            imageUrl
          )


          const imageData =
            await imageUrlToDataUrl(
              imageUrl
            )


          if (!imageData) {

            doc.setFillColor(
              254,
              242,
              242
            )

            doc.roundedRect(
              18,
              y,
              174,
              12,
              2,
              2,
              'F'
            )

            doc.setTextColor(...RED)

            doc.setFontSize(8)

            doc.text(
              `Photo ${i + 1}: Unable to load image`,
              23,
              y + 7
            )

            y += 18

            continue
          }


          // Make sure there is enough space.
          // A photo will use approximately 85mm height.

          if (y + 90 > 270) {
            doc.addPage()
            y = 20

            doc.setTextColor(...NAVY)
            doc.setFontSize(11)
            doc.setFont('helvetica', 'bold')

            doc.text(
              'Issue Photos - Continued',
              15,
              y
            )

            y += 10
          }


          const format =
            getImageFormat(imageData)


          try {

            // Keep image inside A4 page.
            const imageWidth = 170
            const imageHeight = 85

            doc.addImage(
              imageData,
              format,
              20,
              y,
              imageWidth,
              imageHeight,
              undefined,
              'MEDIUM'
            )

            // Photo number
            doc.setTextColor(...MUTED)

            doc.setFontSize(8)

            doc.text(
              `Photo ${i + 1}`,
              105,
              y + imageHeight + 5,
              {
                align: 'center'
              }
            )

            y += imageHeight + 13

          } catch (imageError) {

            console.error(
              'Could not add image to PDF:',
              imageError
            )

            doc.setTextColor(...RED)

            doc.setFontSize(8)

            doc.text(
              `Photo ${i + 1} could not be embedded.`,
              20,
              y + 5
            )

            y += 12
          }
        }
      }


      // -----------------------------------------------------
      // COMMENTS
      // -----------------------------------------------------

      if (comments.length > 0) {

        sectionTitle(
          `Comments (${comments.length})`
        )

        comments.forEach((comment, index) => {

          const name =
            comment.profiles?.full_name ||
            'User'

          const date =
            comment.created_at
              ? new Date(
                  comment.created_at
                ).toLocaleString('en-IN')
              : ''

          const prefix =
            comment.is_official
              ? 'OFFICIAL'
              : 'CITIZEN'


          const commentText =
            `${prefix} - ${name} (${date}): ${comment.content}`

          const lines =
            doc.splitTextToSize(
              commentText,
              170
            )


          if (
            y + lines.length * 5 + 8 >
            270
          ) {

            doc.addPage()

            y = 20

          }


          doc.setFillColor(
            comment.is_official
              ? 239
              : 248,
            comment.is_official
              ? 246
              : 250,
            comment.is_official
              ? 255
              : 252
          )

          doc.roundedRect(
            17,
            y - 4,
            176,
            lines.length * 5 + 7,
            2,
            2,
            'F'
          )

          doc.setTextColor(...TEXT)

          doc.setFontSize(8)

          doc.setFont('helvetica', 'normal')

          doc.text(
            lines,
            21,
            y + 1
          )

          y += lines.length * 5 + 11

        })
      }


      // -----------------------------------------------------
      // STATUS TIMELINE
      // -----------------------------------------------------

      sectionTitle(
        'Status Timeline'
      )

      const currentIndex =
        STATUSES.indexOf(
          issue.status
        )


      STATUSES.forEach((s, index) => {

        y = checkPageSpace(
          doc,
          y,
          12
        )

        const done =
          index <= currentIndex

        const current =
          s === issue.status

        const label =
          s === 'in_progress'
            ? 'In Progress'
            : s.charAt(0).toUpperCase() +
              s.slice(1)


        doc.setFillColor(
          ...(done
            ? GOLD
            : [226, 232, 240])
        )

        doc.circle(
          25,
          y - 1,
          3,
          'F'
        )


        if (
          index <
          STATUSES.length - 1
        ) {

          doc.setDrawColor(
            ...(done && index < currentIndex
              ? GOLD
              : [226, 232, 240])
          )

          doc.setLineWidth(0.8)

          doc.line(
            25,
            y + 2,
            25,
            y + 12
          )
        }


        doc.setTextColor(
          ...(current
            ? NAVY
            : MUTED)
        )

        doc.setFontSize(9)

        doc.setFont(
          'helvetica',
          current
            ? 'bold'
            : 'normal'
        )

        doc.text(
          label,
          35,
          y + 2
        )

        y += 14

      })


      // -----------------------------------------------------
      // FOOTER INFORMATION
      // -----------------------------------------------------

      y = checkPageSpace(
        doc,
        y,
        25
      )

      y += 5

      doc.setDrawColor(...BORDER)

      doc.line(
        15,
        y,
        195,
        y
      )

      y += 8

      doc.setTextColor(...MUTED)

      doc.setFontSize(8)

      doc.setFont('helvetica', 'normal')

      doc.text(
        'This report was generated electronically by the Civic Issue Reporting System.',
        105,
        y,
        {
          align: 'center'
        }
      )

      y += 5

      doc.text(
        'The information contained in this report is based on the submitted issue data.',
        105,
        y,
        {
          align: 'center'
        }
      )


      // -----------------------------------------------------
      // ADD PAGE NUMBERS
      // -----------------------------------------------------

      addPageNumber(doc)


      // -----------------------------------------------------
      // DOWNLOAD
      // -----------------------------------------------------

      const safeTitle =
        (issue.title || 'civic-issue')
          .replace(
            /[^a-z0-9]/gi,
            '-'
          )
          .substring(
            0,
            50
          )


      doc.save(
        `Civic-Issue-${safeTitle}-${reportId}.pdf`
      )

    } catch (error) {

      console.error(
        'PDF generation error:',
        error
      )

      alert(
        'Could not generate PDF. Please check the browser console.'
      )

    } finally {

      setPdfLoading(false)

    }
  }


  // =========================================================
  // HEX -> RGB
  // =========================================================

  function hexToRgb(hex) {

    if (!hex) {
      return [0, 0, 0]
    }

    const clean =
      hex.replace('#', '')

    return [
      parseInt(
        clean.substring(0, 2),
        16
      ),
      parseInt(
        clean.substring(2, 4),
        16
      ),
      parseInt(
        clean.substring(4, 6),
        16
      )
    ]
  }


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (
      <div
        style={{
          paddingTop: '68px',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <p style={{ color: '#64748b' }}>
          Loading issue...
        </p>
      </div>
    )
  }


  // =========================================================
  // NOT FOUND
  // =========================================================

  if (!issue) {

    return (
      <div
        style={{
          paddingTop: '68px',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >

        <div
          style={{
            textAlign: 'center'
          }}
        >

          <div
            style={{
              fontSize: '3rem'
            }}
          >
            😕
          </div>

          <p
            style={{
              color: '#64748b',
              marginTop: '1rem'
            }}
          >
            Issue not found.
          </p>

          <Link
            to="/"
            style={{
              color: '#f59e0b',
              fontWeight: 600
            }}
          >
            Go Home
          </Link>

        </div>

      </div>
    )
  }


  const status =
    STATUS_STYLE[issue.status] ||
    STATUS_STYLE.pending

  const priority =
    PRIORITY_STYLE[issue.priority] ||
    PRIORITY_STYLE.medium


  // =========================================================
  // UI
  // =========================================================

  return (

    <div
      style={{
        paddingTop: '68px',
        minHeight: '100vh',
        background: '#f8f9fc'
      }}
    >

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div
        style={{
          background:
            'linear-gradient(135deg, #0a0f2e, #111a45)',
          padding: '2.5rem 1.5rem 2rem'
        }}
      >

        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto'
          }}
        >

          <Link
            to="/my-issues"
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.85rem',
              textDecoration: 'none',
              display: 'inline-block',
              marginBottom: '1rem'
            }}
          >
            ← Back to My Issues
          </Link>


          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap'
            }}
          >

            <div
              style={{
                flex: 1
              }}
            >

              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                  flexWrap: 'wrap'
                }}
              >

                <span
                  style={{
                    background: status.bg,
                    color: status.color,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px'
                  }}
                >
                  {status.label}
                </span>


                <span
                  style={{
                    background: priority.bg,
                    color: priority.color,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px'
                  }}
                >
                  {issue.priority
                    ? issue.priority.toUpperCase()
                    : 'MEDIUM'} PRIORITY
                </span>


                {issue.ml_category && (

                  <span
                    style={{
                      background:
                        'rgba(124,58,237,0.15)',
                      color: '#c4b5fd',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px'
                    }}
                  >
                    🤖 AI:{' '}
                    {issue.ml_category.replace(
                      /_/g,
                      ' '
                    )}
                  </span>

                )}

              </div>


              <h1
                style={{
                  fontFamily:
                    'Fraunces, serif',
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: 'white',
                  marginBottom: '0.5rem'
                }}
              >
                {issue.title}
              </h1>


              <p
                style={{
                  color:
                    'rgba(255,255,255,0.5)',
                  fontSize: '0.875rem'
                }}
              >
                {issue.categories
                  ? issue.categories.icon
                  : ''}{' '}

                {issue.categories
                  ? issue.categories.name
                  : ''}

                {' · '}

                Reported by{' '}

                {issue.reporter
                  ? issue.reporter.full_name
                  : 'Anonymous'}

                {' · '}

                {new Date(
                  issue.created_at
                ).toLocaleDateString(
                  'en-IN',
                  {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }
                )}

              </p>

            </div>


            {/* UPVOTE */}

            <button
              onClick={handleUpvote}
              disabled={upvoteLoading}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.75rem 1.25rem',
                background: hasUpvoted
                  ? '#f59e0b'
                  : 'rgba(255,255,255,0.08)',
                border: hasUpvoted
                  ? '2px solid #f59e0b'
                  : '2px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
                cursor: 'pointer',
                minWidth: '70px',
                flexShrink: 0
              }}
            >

              <span
                style={{
                  fontSize: '1.5rem'
                }}
              >
                {hasUpvoted
                  ? '👍'
                  : '👆'}
              </span>

              <span
                style={{
                  color: hasUpvoted
                    ? '#0a0f2e'
                    : 'white',
                  fontWeight: 700,
                  fontSize: '1.1rem'
                }}
              >
                {upvoteCount}
              </span>

              <span
                style={{
                  color: hasUpvoted
                    ? '#0a0f2e'
                    : 'rgba(255,255,255,0.6)',
                  fontSize: '0.7rem',
                  fontWeight: 500
                }}
              >
                {hasUpvoted
                  ? 'Upvoted'
                  : 'Upvote'}
              </span>

            </button>

          </div>

        </div>

      </div>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <div
        style={{
          maxWidth: '900px',
          margin: '2rem auto',
          padding: '0 1.5rem 4rem',
          display: 'grid',
          gridTemplateColumns:
            '1fr 300px',
          gap: '1.5rem'
        }}
      >

        {/* =================================================
            LEFT
        ================================================= */}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            minWidth: 0
          }}
        >


          {/* DOWNLOAD PDF */}

          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '1rem',
              border: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end'
            }}
          >

            <button
              onClick={generatePDF}
              disabled={pdfLoading}
              style={{
                background:
                  pdfLoading
                    ? '#94a3b8'
                    : '#0a0f2e',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding:
                  '0.75rem 1.25rem',
                fontWeight: 700,
                cursor: pdfLoading
                  ? 'wait'
                  : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {pdfLoading
                ? '⏳ Generating PDF...'
                : '📄 Download PDF'}
            </button>

          </div>


          {/* PHOTOS */}

          {images.length > 0 && (

            <div
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '1.25rem',
                border:
                  '1px solid #e2e8f0'
              }}
            >

              <h2
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#475569',
                  textTransform:
                    'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '1rem'
                }}
              >
                Photos
              </h2>


              <img
                src={
                  images[activeImage]?.image_url
                }
                alt="Issue"
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  maxHeight: '320px',
                  objectFit: 'cover'
                }}
              />


              {images.length > 1 && (

                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginTop: '0.75rem',
                    flexWrap: 'wrap'
                  }}
                >

                  {images.map(
                    (img, i) => (

                      <img
                        key={i}
                        src={img.image_url}
                        alt=""
                        onClick={() =>
                          setActiveImage(i)
                        }
                        style={{
                          width: '60px',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border:
                            activeImage === i
                              ? '2px solid #f59e0b'
                              : '2px solid transparent',
                          opacity:
                            activeImage === i
                              ? 1
                              : 0.6
                        }}
                      />

                    )
                  )}

                </div>

              )}

            </div>

          )}


          {/* DESCRIPTION */}

          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '1.5rem',
              border:
                '1px solid #e2e8f0'
            }}
          >

            <h2
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#475569',
                textTransform:
                  'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '1rem'
              }}
            >
              Description
            </h2>

            <p
              style={{
                color: '#334155',
                lineHeight: 1.7,
                fontSize: '0.95rem',
                margin: 0
              }}
            >
              {issue.description}
            </p>

          </div>


          {/* COMMENTS */}

          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '1.5rem',
              border:
                '1px solid #e2e8f0'
            }}
          >

            <h2
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#475569',
                textTransform:
                  'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '1.25rem'
              }}
            >
              Comments ({comments.length})
            </h2>


            {comments.length === 0 ? (

              <p
                style={{
                  color: '#94a3b8',
                  fontSize: '0.875rem',
                  textAlign: 'center',
                  padding: '1rem 0'
                }}
              >
                No comments yet.
              </p>

            ) : (

              <div
                style={{
                  display: 'flex',
                  flexDirection:
                    'column',
                  gap: '1rem',
                  marginBottom:
                    '1.5rem'
                }}
              >

                {comments.map(
                  comment => (

                    <div
                      key={comment.id}
                      style={{
                        background:
                          comment.is_official
                            ? '#eff6ff'
                            : '#f8f9fc',
                        border:
                          comment.is_official
                            ? '1px solid #bfdbfe'
                            : '1px solid #e2e8f0',
                        borderRadius:
                          '12px',
                        padding: '1rem'
                      }}
                    >

                      <div
                        style={{
                          display: 'flex',
                          alignItems:
                            'center',
                          gap: '0.5rem',
                          marginBottom:
                            '0.5rem',
                          flexWrap: 'wrap'
                        }}
                      >

                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius:
                              '50%',
                            background:
                              comment.is_official
                                ? '#1e40af'
                                : '#0a0f2e',
                            display:
                              'flex',
                            alignItems:
                              'center',
                            justifyContent:
                              'center',
                            color: 'white',
                            fontSize:
                              '0.75rem',
                            fontWeight: 700
                          }}
                        >
                          {comment.profiles?.full_name
                            ? comment.profiles.full_name[0].toUpperCase()
                            : 'U'}
                        </div>


                        <span
                          style={{
                            fontWeight: 600,
                            fontSize:
                              '0.85rem',
                            color:
                              '#0a0f2e'
                          }}
                        >
                          {comment.profiles
                            ? comment.profiles.full_name
                            : 'User'}
                        </span>


                        {comment.is_official && (

                          <span
                            style={{
                              background:
                                '#1e40af',
                              color: 'white',
                              fontSize:
                                '0.65rem',
                              fontWeight: 700,
                              padding:
                                '0.15rem 0.5rem',
                              borderRadius:
                                '9999px'
                            }}
                          >
                            OFFICIAL
                          </span>

                        )}


                        <span
                          style={{
                            color:
                              '#94a3b8',
                            fontSize:
                              '0.75rem',
                            marginLeft:
                              'auto'
                          }}
                        >
                          {new Date(
                            comment.created_at
                          ).toLocaleDateString(
                            'en-IN',
                            {
                              day: 'numeric',
                              month: 'short'
                            }
                          )}
                        </span>

                      </div>


                      <p
                        style={{
                          color:
                            '#334155',
                          fontSize:
                            '0.875rem',
                          lineHeight:
                            1.6,
                          margin: 0
                        }}
                      >
                        {comment.content}
                      </p>

                    </div>

                  )
                )}

              </div>

            )}


            {user ? (

              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem'
                }}
              >

                <textarea
                  value={newComment}
                  onChange={e =>
                    setNewComment(
                      e.target.value
                    )
                  }
                  placeholder="Add a comment..."
                  style={{
                    flex: 1,
                    border:
                      '1.5px solid #e2e8f0',
                    borderRadius: '10px',
                    padding:
                      '0.75rem 1rem',
                    fontSize:
                      '0.875rem',
                    resize: 'none',
                    minHeight: '60px',
                    outline: 'none',
                    boxSizing:
                      'border-box'
                  }}
                />

                <button
                  onClick={handleComment}
                  disabled={
                    !newComment.trim() ||
                    commentLoading
                  }
                  style={{
                    background:
                      newComment.trim()
                        ? '#f59e0b'
                        : '#e2e8f0',
                    color:
                      newComment.trim()
                        ? '#0a0f2e'
                        : '#94a3b8',
                    border: 'none',
                    borderRadius: '10px',
                    padding:
                      '0 1.25rem',
                    fontWeight: 700,
                    cursor:
                      newComment.trim()
                        ? 'pointer'
                        : 'not-allowed',
                    fontSize:
                      '0.875rem',
                    alignSelf:
                      'flex-end',
                    height: '42px'
                  }}
                >
                  {commentLoading
                    ? '...'
                    : 'Post'}
                </button>

              </div>

            ) : (

              <p
                style={{
                  color: '#94a3b8',
                  fontSize:
                    '0.875rem',
                  textAlign:
                    'center'
                }}
              >

                <Link
                  to="/login"
                  style={{
                    color: '#f59e0b',
                    fontWeight: 600
                  }}
                >
                  Sign in
                </Link>{' '}
                to comment

              </p>

            )}

          </div>

        </div>


        {/* =================================================
            RIGHT SIDEBAR
        ================================================= */}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >


          {/* DETAILS */}

          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '1.25rem',
              border:
                '1px solid #e2e8f0'
            }}
          >

            <h2
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#475569',
                textTransform:
                  'uppercase',
                letterSpacing:
                  '0.05em',
                marginBottom: '1rem'
              }}
            >
              Details
            </h2>


            {[
              [
                'Reported by',
                issue.reporter
                  ? issue.reporter.full_name
                  : 'Anonymous'
              ],
              [
                'City',
                issue.city || '—'
              ],
              [
                'Ward / Area',
                issue.ward || '—'
              ],
              [
                'Coordinates',
                issue.latitude != null
                  ? `${Number(issue.latitude).toFixed(4)}, ${Number(issue.longitude).toFixed(4)}`
                  : '—'
              ],
              [
                'Issue ID',
                issue.id
                  ? issue.id.substring(0, 8) + '...'
                  : '—'
              ]
            ].map(
              ([label, value]) => (

                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    gap: '1rem',
                    padding:
                      '0.5rem 0',
                    borderBottom:
                      '1px solid #f1f5f9'
                  }}
                >

                  <span
                    style={{
                      fontSize:
                        '0.8rem',
                      color:
                        '#94a3b8',
                      fontWeight: 500
                    }}
                  >
                    {label}
                  </span>

                  <span
                    style={{
                      fontSize:
                        '0.8rem',
                      color:
                        '#0a0f2e',
                      fontWeight: 600,
                      textAlign:
                        'right'
                    }}
                  >
                    {value}
                  </span>

                </div>

              )
            )}


            {issue.latitude != null && (

              <a
                href={`https://maps.google.com/?q=${issue.latitude},${issue.longitude}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'block',
                  marginTop: '1rem',
                  textAlign: 'center',
                  background:
                    '#f8f9fc',
                  border:
                    '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '0.6rem',
                  color: '#0a0f2e',
                  textDecoration:
                    'none',
                  fontSize:
                    '0.82rem',
                  fontWeight: 600
                }}
              >
                🗺️ View on Google Maps
              </a>

            )}

          </div>


          {/* AI */}

          {issue.ml_category && (

            <div
              style={{
                background:
                  'linear-gradient(135deg, #faf5ff, #ede9fe)',
                borderRadius: '16px',
                padding: '1.25rem',
                border:
                  '1px solid #ddd6fe'
              }}
            >

              <h2
                style={{
                  fontSize:
                    '0.85rem',
                  fontWeight: 700,
                  color:
                    '#7c3aed',
                  textTransform:
                    'uppercase',
                  letterSpacing:
                    '0.05em',
                  marginBottom:
                    '1rem'
                }}
              >
                🤖 AI Analysis
              </h2>


              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  padding:
                    '0.5rem 0',
                  borderBottom:
                    '1px solid #e9d5ff'
                }}
              >

                <span
                  style={{
                    fontSize:
                      '0.8rem',
                    color:
                      '#7c3aed'
                  }}
                >
                  Detected Category
                </span>

                <span
                  style={{
                    fontSize:
                      '0.8rem',
                    color:
                      '#4c1d95',
                    fontWeight: 700
                  }}
                >
                  {issue.ml_category.replace(
                    /_/g,
                    ' '
                  )}
                </span>

              </div>


              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  padding:
                    '0.5rem 0'
                }}
              >

                <span
                  style={{
                    fontSize:
                      '0.8rem',
                    color:
                      '#7c3aed'
                  }}
                >
                  Confidence
                </span>

                <span
                  style={{
                    fontSize:
                      '0.8rem',
                    color:
                      '#4c1d95',
                    fontWeight: 700
                  }}
                >
                  {issue.ml_confidence != null
                    ? `${(
                        issue.ml_confidence * 100
                      ).toFixed(1)}%`
                    : '—'}
                </span>

              </div>

            </div>

          )}


          {/* STATUS */}

          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '1.25rem',
              border:
                '1px solid #e2e8f0'
            }}
          >

            <h2
              style={{
                fontSize:
                  '0.85rem',
                fontWeight: 700,
                color:
                  '#475569',
                textTransform:
                  'uppercase',
                letterSpacing:
                  '0.05em',
                marginBottom:
                  '1rem'
              }}
            >
              Status Timeline
            </h2>


            {STATUSES.map(
              (s, i) => {

                const currentIdx =
                  STATUSES.indexOf(
                    issue.status
                  )

                const isDone =
                  i <= currentIdx

                const isCurrent =
                  s === issue.status

                const label =
                  s === 'in_progress'
                    ? 'In Progress'
                    : s
                        .charAt(0)
                        .toUpperCase() +
                      s.slice(1)


                return (

                  <div
                    key={s}
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems:
                        'flex-start',
                      marginBottom:
                        i <
                        STATUSES.length - 1
                          ? '0.5rem'
                          : 0
                    }}
                  >

                    <div
                      style={{
                        display:
                          'flex',
                        flexDirection:
                          'column',
                        alignItems:
                          'center',
                        flexShrink: 0
                      }}
                    >

                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius:
                            '50%',
                          background:
                            isDone
                              ? '#f59e0b'
                              : '#e2e8f0',
                          display:
                            'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'center',
                          fontSize:
                            '0.6rem',
                          color:
                            isDone
                              ? '#0a0f2e'
                              : '#94a3b8',
                          fontWeight: 700
                        }}
                      >
                        {isDone
                          ? '✓'
                          : ''}
                      </div>


                      {i <
                        STATUSES.length -
                          1 && (

                        <div
                          style={{
                            width: '2px',
                            height: '20px',
                            background:
                              isDone &&
                              i <
                                currentIdx
                                ? '#f59e0b'
                                : '#e2e8f0'
                          }}
                        />

                      )}

                    </div>


                    <p
                      style={{
                        fontSize:
                          '0.8rem',
                        fontWeight:
                          isCurrent
                            ? 700
                            : 400,
                        color:
                          isCurrent
                            ? '#0a0f2e'
                            : '#94a3b8',
                        margin:
                          '2px 0 0 0'
                      }}
                    >
                      {label}
                    </p>

                  </div>

                )
              }
            )}

          </div>

        </div>

      </div>

    </div>
  )
}