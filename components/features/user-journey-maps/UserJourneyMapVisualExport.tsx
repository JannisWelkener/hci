'use client'

import { UserJourneyMap, Persona, UserStory } from '@/lib/types/database'
import { forwardRef, useMemo } from 'react'
import { sortStagesByOrder } from '@/lib/utils/journey-stages'

interface UserJourneyMapVisualExportProps {
  journeyMap: UserJourneyMap
  persona: Persona | null
  userStories: UserStory[]
}

// Fixed size for A4 landscape
const EXPORT_WIDTH = 1500
const EXPORT_HEIGHT = 1060

// Brand color
const PRIMARY_COLOR = '#DC3C05'
const TEXT_PRIMARY = '#1a1a1a'
const TEXT_SECONDARY = '#6b7280'
const BORDER_COLOR = '#e5e7eb'

// Fixed row heights
const ROW_HEIGHT = 130 // Fixed height for content rows (Touchpoints, Actions, Thoughts, Pain Points, Opportunities)
const EMOTION_ROW_HEIGHT = 80 // Smaller fixed height for Emotion row

export const UserJourneyMapVisualExport = forwardRef<HTMLDivElement, UserJourneyMapVisualExportProps>(
  ({ journeyMap, persona, userStories }, ref) => {
    const stages = useMemo(() => sortStagesByOrder(journeyMap.stages), [journeyMap.stages])
    const stageCount = stages.length

    // Calculate dynamic column width (minimum 150px per stage)
    const labelColumnWidth = 140
    const availableWidth = EXPORT_WIDTH - labelColumnWidth - 80 // 40px padding each side
    const stageWidth = Math.max(150, availableWidth / stageCount)

    return (
      <div
        ref={ref}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: `${EXPORT_WIDTH}px`,
          height: `${EXPORT_HEIGHT}px`,
          backgroundColor: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          overflow: 'hidden',
          padding: '30px 40px',
          boxSizing: 'border-box',
          lineHeight: 'normal'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          marginBottom: '24px',
          paddingBottom: '20px',
          borderBottom: `2px solid ${PRIMARY_COLOR}`
        }}>
          {/* Title Section */}
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              margin: '0 0 4px 0',
              color: TEXT_PRIMARY,
              lineHeight: '1.2'
            }}>
              {journeyMap.title}
            </h1>
            {journeyMap.description && (
              <p style={{
                fontSize: '11px',
                color: TEXT_SECONDARY,
                margin: 0,
                lineHeight: '1.4'
              }}>
                {journeyMap.description}
              </p>
            )}
          </div>

          {/* User Stories Section - Always show */}
          <div style={{
            paddingLeft: '24px',
            paddingRight: '24px',
            borderLeft: `1px solid ${BORDER_COLOR}`,
            borderRight: `1px solid ${BORDER_COLOR}`,
            flex: 1.5,
            minWidth: '300px',
            maxWidth: '900px'
          }}>
            <div style={{
              fontSize: '10px',
              fontWeight: '600',
              color: TEXT_SECONDARY,
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              User Stories ({userStories.length})
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              maxHeight: '140px',
              overflow: 'hidden',
              paddingBottom: '2px'
            }}>
              {userStories.map((story, idx) => (
                <div
                  key={`${story.id}-${idx}`}
                  style={{
                    paddingTop: '2px',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    fontSize: '10px',
                    color: TEXT_PRIMARY,
                    display: 'table',
                    maxWidth: '180px',
                    height: '32px'
                  }}
                >
                  <div style={{
                    display: 'table-cell',
                    verticalAlign: 'middle',
                    paddingLeft: '10px',
                    paddingRight: '6px'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: PRIMARY_COLOR,
                      position: 'relative',
                      display: 'inline-block'
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: '50%',
                        top:'22%',
                        transform: 'translate(-50%, -50%)',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: '700',
                        lineHeight: '1',
                      }}>
                        {idx + 1}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    display: 'table-cell',
                    verticalAlign: 'middle',
                    paddingRight: '10px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '140px',
                    position: 'relative',
                    top: '-7px'
                  }}>
                    {story.title}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Persona Section - Right side */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            paddingLeft: '24px',
            minWidth: '200px'
          }}>
            {persona?.photo_url ? (
              <img
                src={persona.photo_url}
                alt={persona.name}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `2px solid ${PRIMARY_COLOR}`
                }}
              />
            ) : (
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: '#e5e7eb',
                border: `2px solid ${PRIMARY_COLOR}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                color: '#6b7280'
              }}>
                👤
              </div>
            )}
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: '700',
                color: TEXT_PRIMARY,
                lineHeight: '1.2'
              }}>
                {persona?.name || 'Loading...'}
              </div>
              <div style={{
                fontSize: '11px',
                color: TEXT_SECONDARY,
                marginTop: '2px'
              }}>
                {persona?.role || 'Persona'}
              </div>
            </div>
          </div>
        </div>

        {/* Journey Map Table */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `${labelColumnWidth}px repeat(${stageCount}, ${stageWidth}px)`,
            border: `1px solid ${BORDER_COLOR}`,
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: '#ffffff'
          }}>
            {/* Stage Names Row */}
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '10px',
              borderBottom: '1px solid #e5e7eb',
              borderRight: '1px solid #e5e7eb',
              fontWeight: '600',
              fontSize: '13px',
              color: '#111827',
              display: 'flex',
              alignItems: 'center'
            }}>
              Journey Stages
            </div>
            {stages.map((stage, index) => (
              <div key={index} style={{
                backgroundColor: PRIMARY_COLOR,
                padding: '10px',
                borderBottom: '1px solid #e5e7eb',
                borderRight: index === stageCount - 1 ? 'none' : '1px solid #e5e7eb'
              }}>
                <h3 style={{
                  fontWeight: '700',
                  fontSize: '14px',
                  margin: '0 0 4px 0',
                  color: '#ffffff',
                  lineHeight: '1.3',
                  wordWrap: 'break-word',
                  whiteSpace: 'normal'
                }}>
                  {stage.name}
                </h3>
                <p style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.95)',
                  margin: 0,
                  lineHeight: '1.4',
                  wordWrap: 'break-word',
                  whiteSpace: 'normal'
                }}>
                  {stage.description}
                </p>
              </div>
            ))}

            {/* Touchpoints Row */}
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '10px',
              borderBottom: '1px solid #e5e7eb',
              borderRight: '1px solid #e5e7eb',
              fontWeight: '500',
              fontSize: '12px',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              height: `${ROW_HEIGHT}px`,
              boxSizing: 'border-box'
            }}>
              <span>📍 Touchpoints</span>
            </div>
            {stages.map((stage, index) => (
              <div key={index} style={{
                padding: '10px',
                borderBottom: '1px solid #e5e7eb',
                borderRight: index === stageCount - 1 ? 'none' : '1px solid #e5e7eb',
                backgroundColor: '#ffffff',
                height: `${ROW_HEIGHT}px`,
                boxSizing: 'border-box',
                overflow: 'auto'
              }}>
                {stage.touchpoints.length > 0 ? (
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {stage.touchpoints.map((touchpoint, i) => (
                      <li key={i} style={{
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'start',
                        gap: '6px',
                        color: '#374151'
                      }}>
                        <span style={{ color: '#DC3C05', fontWeight: '700', flexShrink: 0 }}>•</span>
                        <span style={{
                          lineHeight: '1.5',
                          wordWrap: 'break-word',
                          whiteSpace: 'normal',
                          flex: 1,
                          minWidth: 0
                        }}>
                          {touchpoint}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>No touchpoints</span>
                )}
              </div>
            ))}

            {/* Actions Row */}
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '10px',
              borderBottom: '1px solid #e5e7eb',
              borderRight: '1px solid #e5e7eb',
              fontWeight: '500',
              fontSize: '12px',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              height: `${ROW_HEIGHT}px`,
              boxSizing: 'border-box'
            }}>
              <span>⚡ Actions</span>
            </div>
            {stages.map((stage, index) => (
              <div key={index} style={{
                padding: '10px',
                borderBottom: '1px solid #e5e7eb',
                borderRight: index === stageCount - 1 ? 'none' : '1px solid #e5e7eb',
                backgroundColor: '#ffffff',
                height: `${ROW_HEIGHT}px`,
                boxSizing: 'border-box',
                overflow: 'auto'
              }}>
                {stage.actions.length > 0 ? (
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {stage.actions.map((action, i) => (
                      <li key={i} style={{
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'start',
                        gap: '6px',
                        color: '#374151'
                      }}>
                        <span style={{ color: '#DC3C05', fontWeight: '700', flexShrink: 0 }}>•</span>
                        <span style={{
                          lineHeight: '1.5',
                          wordWrap: 'break-word',
                          whiteSpace: 'normal',
                          flex: 1,
                          minWidth: 0
                        }}>
                          {action}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>No actions</span>
                )}
              </div>
            ))}

            {/* Thoughts Row */}
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '10px',
              borderBottom: '1px solid #e5e7eb',
              borderRight: '1px solid #e5e7eb',
              fontWeight: '500',
              fontSize: '12px',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              height: `${ROW_HEIGHT}px`,
              boxSizing: 'border-box'
            }}>
              <span>💭 Thoughts</span>
            </div>
            {stages.map((stage, index) => (
              <div key={index} style={{
                padding: '10px',
                borderBottom: '1px solid #e5e7eb',
                borderRight: index === stageCount - 1 ? 'none' : '1px solid #e5e7eb',
                backgroundColor: '#ffffff',
                height: `${ROW_HEIGHT}px`,
                boxSizing: 'border-box',
                overflow: 'auto'
              }}>
                {stage.thoughts.length > 0 ? (
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {stage.thoughts.map((thought, i) => (
                      <li key={i} style={{
                        fontSize: '11px',
                        fontStyle: 'italic',
                        color: '#6b7280',
                        lineHeight: '1.5',
                        wordWrap: 'break-word',
                        whiteSpace: 'normal'
                      }}>
                        &ldquo;{thought}&rdquo;
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>No thoughts</span>
                )}
              </div>
            ))}

            {/* Pain Points Row */}
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '10px',
              borderBottom: '1px solid #e5e7eb',
              borderRight: '1px solid #e5e7eb',
              fontWeight: '500',
              fontSize: '12px',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              height: `${ROW_HEIGHT}px`,
              boxSizing: 'border-box'
            }}>
              <span>⚠️ Pain Points</span>
            </div>
            {stages.map((stage, index) => (
              <div key={index} style={{
                padding: '10px',
                borderBottom: '1px solid #e5e7eb',
                borderRight: index === stageCount - 1 ? 'none' : '1px solid #e5e7eb',
                backgroundColor: '#ffffff',
                height: `${ROW_HEIGHT}px`,
                boxSizing: 'border-box',
                overflow: 'auto'
              }}>
                {stage.painPoints.length > 0 ? (
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {stage.painPoints.map((pain, i) => (
                      <li key={i} style={{
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'start',
                        gap: '6px',
                        color: '#374151'
                      }}>
                        <span style={{ color: '#DC3C05', fontWeight: '700', flexShrink: 0 }}>•</span>
                        <span style={{
                          lineHeight: '1.5',
                          wordWrap: 'break-word',
                          whiteSpace: 'normal',
                          flex: 1,
                          minWidth: 0
                        }}>
                          {pain}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>No pain points</span>
                )}
              </div>
            ))}

            {/* Emotion Row */}
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '10px',
              borderBottom: '1px solid #e5e7eb',
              borderRight: '1px solid #e5e7eb',
              fontWeight: '500',
              fontSize: '12px',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              height: `${EMOTION_ROW_HEIGHT}px`,
              boxSizing: 'border-box'
            }}>
              <span>😊 Emotion</span>
            </div>
            {stages.map((stage, index) => {
              let emoji = '😊'
              let color = '#10b981'

              if (stage.emotions >= 4.5) {
                emoji = '😊'
                color = '#10b981'
              } else if (stage.emotions >= 3.5) {
                emoji = '🙂'
                color = '#84cc16'
              } else if (stage.emotions >= 2.5) {
                emoji = '😐'
                color = '#f59e0b'
              } else if (stage.emotions >= 1.5) {
                emoji = '😕'
                color = '#f97316'
              } else {
                emoji = '😢'
                color = '#ef4444'
              }

              return (
                <div key={index} style={{
                  padding: '10px',
                  borderBottom: '1px solid #e5e7eb',
                  borderRight: index === stageCount - 1 ? 'none' : '1px solid #e5e7eb',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: `${EMOTION_ROW_HEIGHT}px`,
                  boxSizing: 'border-box'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '28px', lineHeight: '1' }}>{emoji}</span>
                    <span style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: color
                    }}>
                      {stage.emotions.toFixed(1)}/5
                    </span>
                  </div>
                </div>
              )
            })}

            {/* Opportunities Row */}
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '10px',
              borderRight: '1px solid #e5e7eb',
              fontWeight: '500',
              fontSize: '12px',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              height: `${ROW_HEIGHT}px`,
              boxSizing: 'border-box'
            }}>
              <span>💡 Opportunities</span>
            </div>
            {stages.map((stage, index) => (
              <div key={index} style={{
                padding: '10px',
                borderRight: index === stageCount - 1 ? 'none' : '1px solid #e5e7eb',
                backgroundColor: '#ffffff',
                height: `${ROW_HEIGHT}px`,
                boxSizing: 'border-box',
                overflow: 'auto'
              }}>
                {stage.opportunities && stage.opportunities.length > 0 ? (
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {stage.opportunities.map((opportunity, oppIndex) => (
                      <li key={oppIndex} style={{
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'start',
                        gap: '6px',
                        color: '#374151'
                      }}>
                        <span style={{ color: '#DC3C05', fontWeight: '700', flexShrink: 0 }}>•</span>
                        <span style={{
                          lineHeight: '1.5',
                          wordWrap: 'break-word',
                          whiteSpace: 'normal',
                          flex: 1,
                          minWidth: 0
                        }}>
                          {opportunity}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{
                    color: '#9ca3af',
                    fontStyle: 'italic',
                    margin: 0,
                    fontSize: '11px'
                  }}>
                    No opportunities identified
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
)

UserJourneyMapVisualExport.displayName = 'UserJourneyMapVisualExport'
