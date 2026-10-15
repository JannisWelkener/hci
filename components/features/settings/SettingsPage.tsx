'use client'

import { useState } from 'react'
import { Eye, EyeOff, Key, Loader2, Trash2 } from 'lucide-react'
import { useAIKey } from '@/lib/contexts/AIKeyContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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

export function SettingsPage() {
  const { hasAIKey, isLoading: isLoadingStatus, maskedKey, refreshKeyStatus } = useAIKey()
  const { toast } = useToast()

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

  if (isLoadingStatus) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <CardTitle>OpenAI API Key</CardTitle>
          </div>
          <CardDescription>
            Add your personal OpenAI API key to enable AI-powered features like
            persona generation, journey map optimization, and description enhancement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasAIKey ? (
            // Key exists - show masked key and delete option only
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                <Key className="h-4 w-4 text-green-600" />
                <span className="font-mono text-sm">{maskedKey}</span>
                <span className="text-xs text-green-600 ml-auto">Active</span>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={isRemoving}>
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
                      You can add a new key at any time.
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
            </div>
          ) : (
            // No key - show input to add
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  No API key configured
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  AI features disabled
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="relative">
                  <Input
                    id="api-key"
                    type={showKey ? 'text' : 'password'}
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="pr-10"
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
                    className="text-primary underline"
                  >
                    platform.openai.com/api-keys
                  </a>
                </p>
              </div>

              <Button
                onClick={handleSaveKey}
                disabled={!apiKey.trim() || isSaving}
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add API Key
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
