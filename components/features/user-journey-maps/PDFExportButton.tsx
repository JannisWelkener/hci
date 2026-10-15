'use client'

import { useCallback, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'
import { UserJourneyMap, Persona, UserStory } from '@/lib/types/database'
import { UserJourneyMapVisualExport } from './UserJourneyMapVisualExport'
import { useToast } from '@/hooks/use-toast'

interface PDFExportButtonProps {
  journeyMap: UserJourneyMap
  persona?: Persona | null
  userStories?: UserStory[]
  variant?: 'outline' | 'default' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function PDFExportButton({ journeyMap, persona, userStories = [], variant = 'outline', size = 'sm' }: PDFExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [showExportContainer, setShowExportContainer] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Export is only available when persona is loaded (not null or undefined)
  const isDataLoaded = persona !== null && persona !== undefined

  const handleExportClick = () => {
    if (!isDataLoaded) return
    handleExport()
  }

  const handleExport = useCallback(async () => {
    if (isExporting) return

    setIsExporting(true)
    setShowExportContainer(true)

    try {
      // Wait for the export container to render
      await new Promise(resolve => setTimeout(resolve, 100))

      if (!exportRef.current) {
        throw new Error('Export container not found')
      }

      // Dynamically import libraries
      const [html2canvasModule, jsPDFModule] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ])

      const html2canvas = html2canvasModule.default
      const { jsPDF } = jsPDFModule

      // Capture the export container as canvas
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: false,
      })

      // A4 dimensions in mm (landscape for visual)
      const pdfWidth = 297
      const pdfHeight = 210

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      })

      // Calculate image dimensions to fit width
      const imgWidth = pdfWidth
      const imgHeight = (canvas.height * pdfWidth) / canvas.width

      const imgData = canvas.toDataURL('image/jpeg', 0.95)

      // If content fits in one page, center it
      if (imgHeight <= pdfHeight) {
        const yOffset = (pdfHeight - imgHeight) / 2
        pdf.addImage(imgData, 'JPEG', 0, yOffset, imgWidth, imgHeight)
      } else {
        // Visual view: fit to single page by scaling down
        const scaledWidth = (canvas.width * pdfHeight) / canvas.height
        const scaledHeight = pdfHeight
        const xOffset = (pdfWidth - scaledWidth) / 2
        pdf.addImage(imgData, 'JPEG', xOffset, 0, scaledWidth, scaledHeight)
      }

      // Add metadata
      pdf.setProperties({
        title: `User Journey Map - ${journeyMap.title}`,
        subject: journeyMap.description || 'User Journey Map',
        author: 'HCI Hub',
        creator: 'HCI Hub',
      })

      // Open PDF in new tab for preview instead of auto-downloading
      const pdfBlob = pdf.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)

      // Open in new tab
      const newWindow = window.open(pdfUrl, '_blank')

      if (newWindow) {
        // Clean up the URL after a delay to free memory
        setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000) // 1 minute

        toast({
          title: 'Success',
          description: 'PDF preview opened in new tab',
        })
      } else {
        // If popup blocked, offer download as fallback
        const fileName = `${journeyMap.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_journey_map.pdf`
        pdf.save(fileName)

        toast({
          title: 'Success',
          description: 'PDF downloaded (popup blocked)',
        })
      }
    } catch (error) {
      console.error('PDF export error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to export PDF',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
      setShowExportContainer(false)
    }
  }, [isExporting, journeyMap, toast])

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleExportClick}
        disabled={isExporting || !isDataLoaded}
        title={!isDataLoaded ? 'Loading data...' : undefined}
      >
        <FileDown className="h-4 w-4 mr-2" />
        {isExporting ? 'Exporting...' : !isDataLoaded ? 'Loading...' : 'Export PDF'}
      </Button>

      {/* Hidden export container */}
      {showExportContainer && (
        <UserJourneyMapVisualExport
          ref={exportRef}
          journeyMap={journeyMap}
          persona={persona}
          userStories={userStories}
        />
      )}
    </>
  )
}
