'use client'

import { UserJourneyMap } from '@/lib/types/database'
import { forwardRef, useMemo } from 'react'
import { sortStagesByOrder } from '@/lib/utils/journey-stages'

interface UserJourneyMapDetailedExportProps {
  journeyMap: UserJourneyMap
}

// Fixed width for portrait A4, dynamic height
// A4 portrait: 210mm x 297mm = 794px x 1122px at 96 DPI
const EXPORT_WIDTH = 210 * 3.78 // 210mm in pixels at 96dpi (~794px)
const EXPORT_HEIGHT_PER_STAGE = 160 // Height per stage in portrait mode (optimized for fit)

export const UserJourneyMapDetailedExport = forwardRef<HTMLDivElement, UserJourneyMapDetailedExportProps>(
  ({ journeyMap }, ref) => {
    const sortedStages = useMemo(() => sortStagesByOrder(journeyMap.stages), [journeyMap.stages])

    // Calculate height: header + all stages stacked vertically
    const calculatedHeight = 150 + (sortedStages.length * EXPORT_HEIGHT_PER_STAGE) + 40
    const exportHeight = calculatedHeight

    return (
      <div
        ref={ref}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: `${EXPORT_WIDTH}px`,
          height: `${exportHeight}px`,
          backgroundColor: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          overflow: 'visible',
          padding: '20px',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#111827' }}>
            {journeyMap.title}
          </h2>
          {journeyMap.description && (
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
              {journeyMap.description}
            </p>
          )}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <span style={{ padding: '4px 12px', backgroundColor: '#f3f4f6', borderRadius: '6px', fontSize: '12px', color: '#374151' }}>
              {sortedStages.length} stages
            </span>
            <span style={{ padding: '4px 12px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', color: '#6b7280' }}>
              Created {new Date(journeyMap.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div style={{ width: '100%', height: '2px', backgroundColor: '#e5e7eb', margin: '20px 0' }} />

        {/* Journey Stages */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>Journey Stages</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sortedStages.map((stage, index) => (
              <div key={index} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', backgroundColor: '#ffffff', overflow: 'hidden' }}>
                {/* Card Header */}
                <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ padding: '4px 6px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '3px', fontSize: '10px', color: '#6b7280', display: 'inline-flex', alignItems: 'center', lineHeight: '1.2' }}>
                          Stage {index + 1}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '13px', fontWeight: '600', margin: '0 0 3px 0', color: '#111827', wordWrap: 'break-word' }}>{stage.name}</h4>
                      <p style={{ fontSize: '10px', color: '#6b7280', margin: 0, lineHeight: '1.5', wordWrap: 'break-word', whiteSpace: 'normal' }}>{stage.description}</p>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Actions */}
                  {stage.actions.length > 0 && (
                    <div>
                      <h5 style={{ fontSize: '10px', fontWeight: '600', marginBottom: '4px', color: '#111827' }}>Actions</h5>
                      <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {stage.actions.map((action, i) => (
                          <li key={i} style={{ fontSize: '9px', color: '#6b7280', lineHeight: '1.5', wordWrap: 'break-word', overflowWrap: 'break-word', wordBreak: 'break-word', whiteSpace: 'normal' }}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Thoughts */}
                  {stage.thoughts.length > 0 && (
                    <div>
                      <h5 style={{ fontSize: '10px', fontWeight: '600', marginBottom: '4px', color: '#111827' }}>Thoughts</h5>
                      <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {stage.thoughts.map((thought, i) => (
                          <li key={i} style={{ fontSize: '9px', color: '#6b7280', fontStyle: 'italic', lineHeight: '1.5', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>&ldquo;{thought}&rdquo;</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Pain Points */}
                  {stage.painPoints.length > 0 && (
                    <div>
                      <h5 style={{ fontSize: '10px', fontWeight: '600', marginBottom: '4px', color: '#111827' }}>Pain Points</h5>
                      <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {stage.painPoints.map((pain, i) => (
                          <li key={i} style={{ fontSize: '9px', color: '#dc2626', lineHeight: '1.5', wordWrap: 'break-word', overflowWrap: 'break-word', wordBreak: 'break-word', whiteSpace: 'normal' }}>{pain}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Touchpoints */}
                  {stage.touchpoints.length > 0 && (
                    <div>
                      <h5 style={{ fontSize: '10px', fontWeight: '600', marginBottom: '4px', color: '#111827' }}>Touchpoints</h5>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {stage.touchpoints.map((touchpoint, i) => (
                          <span key={i} style={{ padding: '4px 6px', backgroundColor: '#f3f4f6', borderRadius: '3px', fontSize: '9px', color: '#374151', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal', display: 'inline-block', lineHeight: '1.4' }}>
                            {touchpoint}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Emotion Rating */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '6px', borderTop: '1px solid #e5e7eb' }}>
                    <span style={{ fontSize: '10px', fontWeight: '500', color: '#111827' }}>Emotion:</span>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {[1, 2, 3, 4, 5].map((val) => (
                        <div
                          key={val}
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: val <= stage.emotions ? '#3b82f6' : '#e5e7eb',
                          }}
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: '9px', color: '#6b7280' }}>
                      ({stage.emotions}/5)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
)

UserJourneyMapDetailedExport.displayName = 'UserJourneyMapDetailedExport'
