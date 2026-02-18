import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '../api/client'
import { toast } from 'sonner'

interface ApiKeyStatus {
  masked_value: string | null
  source: 'stored' | 'env' | null
}

interface ApiKeysResponse {
  webflow_api_token: ApiKeyStatus
  webflow_collection_id: ApiKeyStatus
  openai_api_key: ApiKeyStatus
}

const FIELDS = [
  { key: 'webflow_api_token', label: 'Webflow API Token', placeholder: 'Bearer token from Webflow' },
  { key: 'webflow_collection_id', label: 'Webflow Collection ID', placeholder: 'Collection ID from Webflow CMS' },
  { key: 'openai_api_key', label: 'OpenAI API Key', placeholder: 'sk-...' },
] as const

type FieldKey = (typeof FIELDS)[number]['key']

export function SettingsPage({ onBack }: { onBack: () => void }) {
  const [keys, setKeys] = useState<ApiKeysResponse | null>(null)
  const [values, setValues] = useState<Record<FieldKey, string>>({
    webflow_api_token: '',
    webflow_collection_id: '',
    openai_api_key: '',
  })
  const [inviteCode, setInviteCode] = useState('')
  const [inviteEnabled, setInviteEnabled] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadKeys()
    loadInviteCode()
  }, [])

  async function loadKeys() {
    try {
      const data = await api.get<ApiKeysResponse>('/api/v1/admin/settings/api-keys')
      setKeys(data)
    } catch {
      toast.error('Failed to load API key settings')
    } finally {
      setLoading(false)
    }
  }

  async function loadInviteCode() {
    try {
      const data = await api.get<{ code: string; enabled: boolean }>('/api/v1/admin/settings/invite-code')
      setInviteCode(data.code)
      setInviteEnabled(data.enabled)
    } catch {
      // Non-critical — just leave empty
    }
  }

  async function handleSaveInviteCode() {
    setSaving(true)
    try {
      const data = await api.put<{ code: string; enabled: boolean }>('/api/v1/admin/settings/invite-code', { code: inviteCode })
      setInviteEnabled(data.enabled)
      toast.success(data.enabled ? 'Invite code set — new users must enter it to register' : 'Invite code cleared — registration is open')
    } catch {
      toast.error('Failed to save invite code')
    } finally {
      setSaving(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      // Only send fields that have a value entered
      const payload: Record<string, string | null> = {}
      for (const field of FIELDS) {
        const val = values[field.key]
        if (val !== '') {
          payload[field.key] = val
        }
      }

      if (Object.keys(payload).length === 0) {
        toast.info('No changes to save')
        setSaving(false)
        return
      }

      const data = await api.put<ApiKeysResponse>('/api/v1/admin/settings/api-keys', payload)
      setKeys(data)
      setValues({ webflow_api_token: '', webflow_collection_id: '', openai_api_key: '' })
      toast.success('API keys updated')
    } catch {
      toast.error('Failed to save API keys')
    } finally {
      setSaving(false)
    }
  }

  async function handleClear(key: FieldKey) {
    setSaving(true)
    try {
      const data = await api.put<ApiKeysResponse>('/api/v1/admin/settings/api-keys', { [key]: '' })
      setKeys(data)
      toast.success('Key removed')
    } catch {
      toast.error('Failed to remove key')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Settings</h2>
            <p className="text-sm text-muted-foreground">Manage API keys and configuration</p>
          </div>
          <Button variant="outline" size="sm" onClick={onBack}>
            Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">API Keys</CardTitle>
            <CardDescription>
              Configure API keys for Webflow and OpenAI. Stored keys are encrypted at rest.
              Keys set via environment variables are used as fallback.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {FIELDS.map((field) => {
              const status = keys?.[field.key]
              return (
                <div key={field.key} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-foreground">
                      {field.label}
                    </label>
                    {status?.source && (
                      <Badge
                        variant={status.source === 'stored' ? 'default' : 'secondary'}
                        className="text-[10px] uppercase"
                      >
                        {status.source}
                      </Badge>
                    )}
                  </div>
                  {status?.masked_value && (
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded font-mono">
                        {status.masked_value}
                      </code>
                      {status.source === 'stored' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleClear(field.key)}
                          disabled={saving}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  )}
                  <Input
                    type="password"
                    placeholder={field.placeholder}
                    value={values[field.key]}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                  />
                </div>
              )
            })}

            <div className="pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Keys'}
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Invite Code</CardTitle>
              <Badge variant={inviteEnabled ? 'default' : 'secondary'} className="text-[10px] uppercase">
                {inviteEnabled ? 'Active' : 'Off'}
              </Badge>
            </div>
            <CardDescription>
              Set an invite code to control who can register.
              Leave empty to allow open registration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="text"
              placeholder="e.g. my-secret-code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={handleSaveInviteCode} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
              {inviteEnabled && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    setSaving(true)
                    try {
                      const data = await api.put<{ code: string; enabled: boolean }>('/api/v1/admin/settings/invite-code', { code: '' })
                      setInviteCode('')
                      setInviteEnabled(data.enabled)
                      toast.success('Invite code cleared — registration is open')
                    } catch {
                      toast.error('Failed to clear invite code')
                    } finally {
                      setSaving(false)
                    }
                  }}
                  disabled={saving}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
