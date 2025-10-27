'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { updateThemeSettings } from './actions'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface ThemeSettings {
  themeName: string
  isCustom: boolean
  activeFrom: string
  activeTo: string
  hoverFrom: string
  hoverTo: string
  borderColor: string
  buttonFrom: string
  buttonTo: string
}

const PREDEFINED_THEMES = [
  {
    id: 'pink-orange',
    name: 'Pink Orange',
    description: 'Vibrant and energetic (Default)',
    preview: 'linear-gradient(to right, #ec4899, #f97316)',
    colors: {
      activeFrom: '#ec4899',
      activeTo: '#f97316',
      hoverFrom: '#fdf2f8',
      hoverTo: '#fff7ed',
      borderColor: '#fbcfe8',
      buttonFrom: '#ec4899',
      buttonTo: '#f97316',
    }
  },
  {
    id: 'blue-ocean',
    name: 'Blue Ocean',
    description: 'Cool and professional',
    preview: 'linear-gradient(to right, #3b82f6, #06b6d4)',
    colors: {
      activeFrom: '#3b82f6',
      activeTo: '#06b6d4',
      hoverFrom: '#eff6ff',
      hoverTo: '#ecfeff',
      borderColor: '#93c5fd',
      buttonFrom: '#3b82f6',
      buttonTo: '#06b6d4',
    }
  },
  {
    id: 'green-forest',
    name: 'Green Forest',
    description: 'Fresh and natural',
    preview: 'linear-gradient(to right, #10b981, #84cc16)',
    colors: {
      activeFrom: '#10b981',
      activeTo: '#84cc16',
      hoverFrom: '#ecfdf5',
      hoverTo: '#f7fee7',
      borderColor: '#6ee7b7',
      buttonFrom: '#10b981',
      buttonTo: '#84cc16',
    }
  },
  {
    id: 'purple-dream',
    name: 'Purple Dream',
    description: 'Creative and elegant',
    preview: 'linear-gradient(to right, #8b5cf6, #d946ef)',
    colors: {
      activeFrom: '#8b5cf6',
      activeTo: '#d946ef',
      hoverFrom: '#f5f3ff',
      hoverTo: '#fdf4ff',
      borderColor: '#c4b5fd',
      buttonFrom: '#8b5cf6',
      buttonTo: '#d946ef',
    }
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    description: 'Warm and inviting',
    preview: 'linear-gradient(to right, #f59e0b, #ef4444)',
    colors: {
      activeFrom: '#f59e0b',
      activeTo: '#ef4444',
      hoverFrom: '#fffbeb',
      hoverTo: '#fef2f2',
      borderColor: '#fcd34d',
      buttonFrom: '#f59e0b',
      buttonTo: '#ef4444',
    }
  },
]

export function ThemeSettingsClient({ 
  currentTheme 
}: { 
  currentTheme: ThemeSettings | null 
}) {
  const [selectedTheme, setSelectedTheme] = useState(currentTheme?.themeName || 'pink-orange')
  const [isCustom, setIsCustom] = useState(currentTheme?.isCustom || false)
  const [customColors, setCustomColors] = useState({
    activeFrom: currentTheme?.activeFrom || '#ec4899',
    activeTo: currentTheme?.activeTo || '#f97316',
    hoverFrom: currentTheme?.hoverFrom || '#fdf2f8',
    hoverTo: currentTheme?.hoverTo || '#fff7ed',
    borderColor: currentTheme?.borderColor || '#fbcfe8',
    buttonFrom: currentTheme?.buttonFrom || '#ec4899',
    buttonTo: currentTheme?.buttonTo || '#f97316',
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleApplyPredefinedTheme = async (themeId: string) => {
    const theme = PREDEFINED_THEMES.find(t => t.id === themeId)
    if (!theme) return

    setIsSaving(true)
    const result = await updateThemeSettings({
      themeName: themeId,
      isCustom: false,
      ...theme.colors,
    })

    if (result.success) {
      toast.success('Theme applied successfully!')
      setSelectedTheme(themeId)
      setIsCustom(false)
      // Reload page to apply theme
      window.location.reload()
    } else {
      toast.error(result.error || 'Failed to apply theme')
    }
    setIsSaving(false)
  }

  const handleApplyCustomTheme = async () => {
    setIsSaving(true)
    const result = await updateThemeSettings({
      themeName: 'custom',
      isCustom: true,
      ...customColors,
    })

    if (result.success) {
      toast.success('Custom theme applied successfully!')
      setSelectedTheme('custom')
      setIsCustom(true)
      // Reload page to apply theme
      window.location.reload()
    } else {
      toast.error(result.error || 'Failed to apply custom theme')
    }
    setIsSaving(false)
  }

  return (
    <div className="space-y-8">
      {/* Predefined Themes */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Predefined Themes</h2>
        <p className="text-sm text-neutral-600 mb-6">
          Choose from our carefully crafted color schemes
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PREDEFINED_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleApplyPredefinedTheme(theme.id)}
              disabled={isSaving}
              className={cn(
                'relative p-4 rounded-lg border-2 transition-all text-left',
                selectedTheme === theme.id && !isCustom
                  ? 'border-violet-500 ring-2 ring-violet-200 bg-violet-50'
                  : 'border-neutral-200 hover:border-violet-300 hover:shadow-md',
                isSaving && 'opacity-50 cursor-not-allowed'
              )}
            >
              {selectedTheme === theme.id && !isCustom && (
                <div className="absolute top-2 right-2 bg-violet-500 text-white rounded-full p-1">
                  <Check className="h-4 w-4" />
                </div>
              )}
              
              <div
                className="h-16 rounded-md mb-3 shadow-sm"
                style={{ background: theme.preview }}
              />
              
              <h3 className="font-semibold text-neutral-900 mb-1">{theme.name}</h3>
              <p className="text-xs text-neutral-600">{theme.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Theme */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Custom Theme</h2>
        <p className="text-sm text-neutral-600 mb-6">
          Create your own unique color scheme
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Gradient */}
          <div className="space-y-4">
            <h3 className="font-medium text-neutral-900">Active State Gradient</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Start Color
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={customColors.activeFrom}
                    onChange={(e) => setCustomColors({ ...customColors, activeFrom: e.target.value })}
                    className="w-16 h-10 rounded-lg cursor-pointer border border-neutral-300"
                  />
                  <input
                    type="text"
                    value={customColors.activeFrom}
                    onChange={(e) => setCustomColors({ ...customColors, activeFrom: e.target.value })}
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm font-mono"
                    placeholder="#ec4899"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  End Color
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={customColors.activeTo}
                    onChange={(e) => setCustomColors({ ...customColors, activeTo: e.target.value })}
                    className="w-16 h-10 rounded-lg cursor-pointer border border-neutral-300"
                  />
                  <input
                    type="text"
                    value={customColors.activeTo}
                    onChange={(e) => setCustomColors({ ...customColors, activeTo: e.target.value })}
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm font-mono"
                    placeholder="#f97316"
                  />
                </div>
              </div>
              
              {/* Preview */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Preview</label>
                <div
                  className="h-12 rounded-lg shadow-sm"
                  style={{ background: `linear-gradient(to right, ${customColors.activeFrom}, ${customColors.activeTo})` }}
                />
              </div>
            </div>
          </div>

          {/* Hover Gradient */}
          <div className="space-y-4">
            <h3 className="font-medium text-neutral-900">Hover State Gradient</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Start Color
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={customColors.hoverFrom}
                    onChange={(e) => setCustomColors({ ...customColors, hoverFrom: e.target.value })}
                    className="w-16 h-10 rounded-lg cursor-pointer border border-neutral-300"
                  />
                  <input
                    type="text"
                    value={customColors.hoverFrom}
                    onChange={(e) => setCustomColors({ ...customColors, hoverFrom: e.target.value })}
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm font-mono"
                    placeholder="#fdf2f8"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  End Color
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={customColors.hoverTo}
                    onChange={(e) => setCustomColors({ ...customColors, hoverTo: e.target.value })}
                    className="w-16 h-10 rounded-lg cursor-pointer border border-neutral-300"
                  />
                  <input
                    type="text"
                    value={customColors.hoverTo}
                    onChange={(e) => setCustomColors({ ...customColors, hoverTo: e.target.value })}
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm font-mono"
                    placeholder="#fff7ed"
                  />
                </div>
              </div>
              
              {/* Preview */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Preview</label>
                <div
                  className="h-12 rounded-lg shadow-sm"
                  style={{ background: `linear-gradient(to right, ${customColors.hoverFrom}, ${customColors.hoverTo})` }}
                />
              </div>
            </div>
          </div>

          {/* Border Color */}
          <div className="space-y-3">
            <h3 className="font-medium text-neutral-900">Border Color</h3>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={customColors.borderColor}
                onChange={(e) => setCustomColors({ ...customColors, borderColor: e.target.value })}
                className="w-16 h-10 rounded-lg cursor-pointer border border-neutral-300"
              />
              <input
                type="text"
                value={customColors.borderColor}
                onChange={(e) => setCustomColors({ ...customColors, borderColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm font-mono"
                placeholder="#fbcfe8"
              />
            </div>
          </div>
        </div>

        {/* Apply Custom Theme Button */}
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <button
            onClick={handleApplyCustomTheme}
            disabled={isSaving}
            className={cn(
              'w-full md:w-auto px-6 py-3 rounded-lg font-medium transition-all',
              'bg-gradient-to-r from-violet-600 to-purple-600 text-white',
              'hover:from-violet-700 hover:to-purple-700 shadow-md hover:shadow-lg',
              isSaving && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isSaving ? 'Applying...' : 'Apply Custom Theme'}
          </button>
        </div>
      </div>
    </div>
  )
}

