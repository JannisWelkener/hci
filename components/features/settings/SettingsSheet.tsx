'use client'

import { useState } from 'react'
import { Eye, EyeOff, Key, Loader2, Trash2, Settings, CheckCircle2, XCircle } from 'lucide-react'
import { useAIKey } from '@/lib/contexts/AIKeyContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'

export function SettingsSheet() {
  const { hasAIKey, isLoading: isLoadingStatus, maskedKey, refreshKeyStatus } = useAIKey()
  const { toast } = useToast()

  const [open, setOpen] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: 'API key is required',
        variant: 'destructive',
      })
      return
    }

    if (!apiKey.startsWith('sk-')) {
      toast({
        title: 'Invalid API key format',
        description: 'OpenAI API keys start with "sk-"',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/user/settings/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'API key saved successfully',
          description: 'AI features are now enabled',
        })
        setApiKey('')
        setShowKey(false)
        await refreshKeyStatus()
      } else {
        toast({
          title: 'Failed to save API key',
          description: data.error || 'Please try again',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error saving API key:', error)
      toast({
        title: 'Failed to save API key',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveKey = async () => {
    setIsRemoving(true)
    try {
      const response = await fetch('/api/user/settings/api-key', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'API key removed',
          description: 'AI features are now disabled',
        })
        await refreshKeyStatus()
      } else {
        toast({
          title: 'Failed to remove API key',
          description: data.error || 'Please try again',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error removing API key:', error)
      toast({
        title: 'Failed to remove API key',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </SheetTitle>
          <SheetDescription>
            Manage your account preferences and integrations
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* AI Integration Section */}
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-1">
              <Key className="h-4 w-4" />
              OpenAI Integration
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Connect your OpenAI API key to enable AI-powered features like persona generation and journey map optimization.
            </p>

            <Separator className="mb-4" />

            {isLoadingStatus ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Status Indicator */}
                <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                  hasAIKey
                    ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900'
                    : 'bg-muted border-border'
                }`}>
                  {hasAIKey ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800 dark:text-green-400">
                          AI Features Enabled
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-500 font-mono">
                          {maskedKey}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">AI Features Disabled</p>
                        <p className="text-xs text-muted-foreground">
                          Add your API key to enable AI features
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {hasAIKey ? (
                  /* Delete Button when key exists */
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full" disabled={isRemoving}>
                        {isRemoving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                        )}
                        Remove API Key
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove API Key?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will disable all AI features until you add a new key.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveKey}>
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  /* API Key Form when no key exists */
                  <>
                    <div className="space-y-3">
                      <Label htmlFor="api-key" className="text-sm">
                        API Key
                      </Label>
                      <div className="relative">
                        <Input
                          id="api-key"
                          type={showKey ? 'text' : 'password'}
                          placeholder="sk-proj-..."
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="pr-10 font-mono text-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowKey(!showKey)}
                        >
                          {showKey ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Get your API key from{' '}
                        <a
                          href="https://platform.openai.com/api-keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline hover:no-underline"
                        >
                          platform.openai.com
                        </a>
                      </p>
                    </div>

                    <Button
                      onClick={handleSaveKey}
                      disabled={!apiKey.trim() || isSaving}
                      className="w-full"
                    >
                      {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Add API Key
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
