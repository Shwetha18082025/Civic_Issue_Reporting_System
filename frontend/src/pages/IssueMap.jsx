import { useEffect, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap
} from 'react-leaflet'

import { Link } from 'react-router-dom'
import L from 'leaflet'

import { supabase } from '../lib/supabase'

import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',

  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',

  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})


// ======================================================
// CATEGORY COLORS
// ======================================================

const CATEGORY_COLORS = {
  road: {
    name: 'Road / Pothole',
    color: '#ef4444',
    gradient: {
      0.2: '#fee2e2',
      0.4: '#fca5a5',
      0.6: '#f87171',
      0.8: '#ef4444',
      1.0: '#991b1b'
    }
  },

  garbage: {
    name: 'Garbage',
    color: '#22c55e',
    gradient: {
      0.2: '#dcfce7',
      0.4: '#86efac',
      0.6: '#4ade80',
      0.8: '#22c55e',
      1.0: '#166534'
    }
  },

  water: {
    name: 'Water Leakage',
    color: '#3b82f6',
    gradient: {
      0.2: '#dbeafe',
      0.4: '#93c5fd',
      0.6: '#60a5fa',
      0.8: '#3b82f6',
      1.0: '#1e3a8a'
    }
  },

  drainage: {
    name: 'Drainage',
    color: '#a855f7',
    gradient: {
      0.2: '#f3e8ff',
      0.4: '#d8b4fe',
      0.6: '#c084fc',
      0.8: '#a855f7',
      1.0: '#581c87'
    }
  },

  electricity: {
    name: 'Electricity / Streetlight',
    color: '#eab308',
    gradient: {
      0.2: '#fef9c3',
      0.4: '#fde047',
      0.6: '#facc15',
      0.8: '#eab308',
      1.0: '#854d0e'
    }
  },

  other: {
    name: 'Other',
    color: '#f97316',
    gradient: {
      0.2: '#ffedd5',
      0.4: '#fdba74',
      0.6: '#fb923c',
      0.8: '#f97316',
      1.0: '#9a3412'
    }
  }
}


// ======================================================
// FIND CATEGORY
// ======================================================

function getCategoryType(category) {

  const value =
    category?.toLowerCase() || ''

  if (
    value.includes('road') ||
    value.includes('pothole')
  ) {
    return 'road'
  }

  if (
    value.includes('garbage') ||
    value.includes('waste') ||
    value.includes('trash')
  ) {
    return 'garbage'
  }

  if (
    value.includes('water') ||
    value.includes('leak')
  ) {
    return 'water'
  }

  if (
    value.includes('drain') ||
    value.includes('sewage')
  ) {
    return 'drainage'
  }

  if (
    value.includes('electric') ||
    value.includes('streetlight') ||
    value.includes('street light')
  ) {
    return 'electricity'
  }

  return 'other'
}


// ======================================================
// HEATMAP LAYER
// ======================================================

function CategoryHeatmap({
  issues,
  enabled
}) {

  const map = useMap()

  useEffect(() => {

    if (!enabled) {
      return
    }

    const layers = []

    // Group issues by category
    const groupedIssues = {}

    issues.forEach((issue) => {

      const categoryName =
        issue.categories?.name || ''

      const category =
        getCategoryType(categoryName)

      if (!groupedIssues[category]) {
        groupedIssues[category] = []
      }

      groupedIssues[category].push(issue)
    })


    // Create separate heatmap for every category
    Object.entries(groupedIssues).forEach(
      ([category, categoryIssues]) => {

        const config =
          CATEGORY_COLORS[category]

        if (!config) return


        const points = categoryIssues
          .filter((issue) => {

            const lat =
              Number(issue.latitude)

            const lng =
              Number(issue.longitude)

            return (
              Number.isFinite(lat) &&
              Number.isFinite(lng)
            )
          })

          .map((issue) => {

            const lat =
              Number(issue.latitude)

            const lng =
              Number(issue.longitude)

            return [
              lat,
              lng,
              1
            ]
          })


        if (points.length === 0) {
          return
        }


        const heatLayer =
          L.heatLayer(points, {

            radius: 35,

            blur: 25,

            maxZoom: 17,

            max: 1,

            gradient:
              config.gradient

          }).addTo(map)


        layers.push(heatLayer)

      }
    )


    // Cleanup
    return () => {

      layers.forEach((layer) => {

        map.removeLayer(layer)

      })

    }

  }, [map, issues, enabled])


  return null
}


// ======================================================
// MAIN COMPONENT
// ======================================================

export default function IssueMap() {

  const [issues, setIssues] = useState([])

  const [loading, setLoading] =
    useState(true)

  const [showHeatmap, setShowHeatmap] =
    useState(true)


  const defaultPosition =
    [12.9716, 77.5946]


  // ====================================================
  // FETCH ISSUES
  // ====================================================

  useEffect(() => {

    fetchIssues()

  }, [])


  async function fetchIssues() {

    setLoading(true)

    const { data, error } =
      await supabase

        .from('issues')

        .select(`
          id,
          title,
          description,
          status,
          priority,
          latitude,
          longitude,
          address,

          categories (
            name,
            icon
          )
        `)

        .not(
          'latitude',
          'is',
          null
        )

        .not(
          'longitude',
          'is',
          null
        )


    if (error) {

      console.error(
        'Failed to load issues:',
        error
      )

      setLoading(false)

      return
    }


    setIssues(data || [])

    setLoading(false)
  }


  // ====================================================
  // MARKER COLOR
  // ====================================================

  function createMarkerIcon(issue) {

    const category =
      getCategoryType(
        issue.categories?.name
      )

    const color =
      CATEGORY_COLORS[category]?.color ||
      '#ef4444'


    return L.divIcon({

      className:
        'custom-map-marker',

      html: `
        <div style="
          width: 20px;
          height: 20px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow:
            0 2px 8px rgba(0,0,0,0.35);
        "></div>
      `,

      iconSize: [
        20,
        20
      ],

      iconAnchor: [
        10,
        10
      ],

      popupAnchor: [
        0,
        -10
      ]

    })
  }


  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc'
        }}
      >
        Loading civic issues...
      </div>
    )
  }


  // ====================================================
  // UI
  // ====================================================

  return (

    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc'
      }}
    >

      {/* HEADER */}

      <div
        style={{
          background: 'white',
          borderBottom:
            '1px solid #e5e7eb'
        }}
      >

        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding:
              '24px'
          }}
        >

          <h1
            style={{
              fontSize: '30px',
              fontWeight: 700,
              color: '#0f172a',
              margin: 0
            }}
          >
            🗺️ Civic Issue Heatmap
          </h1>

          <p
            style={{
              color: '#64748b',
              marginTop: '6px'
            }}
          >
            Visualize civic issue hotspots
            by category
          </p>

        </div>

      </div>


      {/* MAP AREA */}

      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '24px',
          position: 'relative'
        }}
      >

        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow:
              '0 10px 30px rgba(0,0,0,0.08)',
            height: '650px',
            position: 'relative'
          }}
        >

          <MapContainer
            center={defaultPosition}
            zoom={12}
            scrollWheelZoom={true}
            style={{
              width: '100%',
              height: '100%'
            }}
          >

            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />


            {/* CATEGORY HEATMAP */}

            <CategoryHeatmap
              issues={issues}
              enabled={showHeatmap}
            />


            {/* MARKERS */}

            {!showHeatmap &&
              issues.map((issue) => (

                <Marker
                  key={issue.id}

                  position={[
                    Number(issue.latitude),
                    Number(issue.longitude)
                  ]}

                  icon={createMarkerIcon(issue)}
                >

                  <Popup>

                    <div
                      style={{
                        minWidth: '230px'
                      }}
                    >

                      <h3
                        style={{
                          fontSize: '17px',
                          fontWeight: 700,
                          marginBottom: '8px'
                        }}
                      >
                        {issue.title}
                      </h3>

                      <p>
                        <strong>
                          Category:
                        </strong>{' '}

                        {issue.categories?.name ||
                          'Unknown'}
                      </p>

                      <p>
                        <strong>
                          Priority:
                        </strong>{' '}

                        {issue.priority ||
                          'Not assigned'}
                      </p>

                      <p>
                        <strong>
                          Status:
                        </strong>{' '}

                        {issue.status}
                      </p>

                      {issue.address && (

                        <p>
                          <strong>
                            Location:
                          </strong>{' '}

                          {issue.address}
                        </p>

                      )}

                      <Link
                        to={`/issues/${issue.id}`}
                        style={{
                          display:
                            'inline-block',

                          marginTop: '10px',

                          padding:
                            '7px 12px',

                          background:
                            '#dc2626',

                          color: 'white',

                          borderRadius: '6px',

                          textDecoration:
                            'none'
                        }}
                      >
                        View Issue
                      </Link>

                    </div>

                  </Popup>

                </Marker>

              ))}

          </MapContainer>


          {/* ================================================= */}
          {/* HEATMAP TOGGLE */}
          {/* ================================================= */}

          <button
            onClick={() =>
              setShowHeatmap(
                !showHeatmap
              )
            }

            style={{
              position: 'absolute',

              top: '15px',

              left: '15px',

              zIndex: 500,

              background: 'white',

              border: 'none',

              borderRadius: '10px',

              padding:
                '10px 16px',

              fontWeight: 600,

              cursor: 'pointer',

              boxShadow:
                '0 3px 12px rgba(0,0,0,0.2)'
            }}
          >
            {showHeatmap
              ? '📍 Show Markers'
              : '🔥 Show Heatmap'}
          </button>


          {/* ================================================= */}
          {/* LEGEND */}
          {/* ================================================= */}

          <div
            style={{
              position: 'absolute',

              right: '15px',

              top: '15px',

              zIndex: 500,

              background:
                'rgba(255,255,255,0.96)',

              borderRadius: '12px',

              padding: '15px',

              boxShadow:
                '0 3px 12px rgba(0,0,0,0.2)',

              minWidth: '190px'
            }}
          >

            <div
              style={{
                fontWeight: 700,
                marginBottom: '10px',
                color: '#0f172a'
              }}
            >
              🗺️ Issue Categories
            </div>


            {Object.entries(
              CATEGORY_COLORS
            ).map(
              ([key, value]) => (

                <div
                  key={key}

                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '7px',
                    fontSize: '13px',
                    color: '#334155'
                  }}
                >

                  <span
                    style={{
                      width: '13px',
                      height: '13px',

                      borderRadius:
                        '50%',

                      background:
                        value.color,

                      display:
                        'inline-block'
                    }}
                  />

                  {value.name}

                </div>

              )
            )}

          </div>

        </div>

      </div>

    </div>
  )
}