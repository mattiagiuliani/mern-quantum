import { useCallback, useEffect, useMemo, useState } from 'react'
import { getApiErrorMessage } from '../../api/apiError'
import {
  createTemplate as apiCreateTemplate,
  deleteTemplate as apiDeleteTemplate,
  getMyTemplates as apiGetMyTemplates,
  getPublicTemplates as apiGetPublicTemplates,
  runCircuit as apiRunCircuit,
  updateTemplate as apiUpdateTemplate,
} from '../../api/apiClient'
import { PREVIEW_SHOTS } from './template.constants'
import { EXAMPLE_TEMPLATES } from './templateExamples'
import { cloneCircuit } from './template.utils'

export function useFeatureCTemplates(isAuthenticated) {
  const [myTemplates, setMyTemplates] = useState([])
  const [publicTemplates, setPublicTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplateState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewResults, setPreviewResults] = useState(null)
  const [previewStatus, setPreviewStatus] = useState('idle')

  const clearPreview = useCallback(() => {
    setPreviewResults(null)
    setPreviewStatus('idle')
  }, [])

  const setSelectedTemplate = useCallback((nextTemplate) => {
    setSelectedTemplateState(nextTemplate)
    clearPreview()
  }, [clearPreview])

  const loadTemplates = useCallback(async () => {
    setLoading(true)

    const tasks = [apiGetPublicTemplates()]
    if (isAuthenticated) {
      tasks.push(apiGetMyTemplates())
    }

    const results = await Promise.allSettled(tasks)

    const publicResult = results[0]
    if (publicResult.status === 'fulfilled') {
      setPublicTemplates(publicResult.value.templates ?? [])
    } else {
      setPublicTemplates([])
    }

    if (isAuthenticated) {
      const myResult = results[1]
      if (myResult?.status === 'fulfilled') {
        setMyTemplates(myResult.value.templates ?? [])
      } else {
        setMyTemplates([])
      }
    } else {
      setMyTemplates([])
    }

    setLoading(false)
  }, [isAuthenticated])

  useEffect(() => {
    let cancelled = false

    queueMicrotask(() => {
      if (cancelled) return

      loadTemplates().catch(() => {
        if (cancelled) return
        setLoading(false)
        setPublicTemplates([])
        setMyTemplates([])
      })
    })

    return () => {
      cancelled = true
    }
  }, [loadTemplates])

  useEffect(() => {
    if (!selectedTemplate) return

    const selectedId = selectedTemplate._id ?? selectedTemplate.id
    const existsInMine = myTemplates.some((entry) => (entry._id ?? entry.id) === selectedId)
    const existsInPublic = publicTemplates.some((entry) => (entry._id ?? entry.id) === selectedId)
    const existsInExamples = EXAMPLE_TEMPLATES.some((entry) => (entry._id ?? entry.id) === selectedId)

    if (!existsInMine && !existsInPublic && !existsInExamples) {
      queueMicrotask(() => {
        setSelectedTemplate(null)
      })
    }
  }, [myTemplates, publicTemplates, selectedTemplate, setSelectedTemplate])

  const runPreview = useCallback(async (circuit) => {
    setPreviewStatus('running')
    setPreviewResults(null)

    try {
      const { counts } = await apiRunCircuit(circuit, PREVIEW_SHOTS)
      setPreviewResults(counts ?? null)
      setPreviewStatus('done')
    } catch {
      setPreviewResults(null)
      setPreviewStatus('error')
    }
  }, [])

  const replaceTemplateById = useCallback((list, updatedTemplate) => {
    return list.map((entry) => {
      const entryId = entry._id ?? entry.id
      const updatedId = updatedTemplate._id ?? updatedTemplate.id
      return entryId === updatedId ? { ...entry, ...updatedTemplate } : entry
    })
  }, [])

  const removeTemplateById = useCallback((list, templateId) => {
    return list.filter((entry) => (entry._id ?? entry.id) !== templateId)
  }, [])

  const saveTemplate = useCallback(async ({ name, description, tags, isPublic, circuit, templateId }) => {
    setSaving(true)

    try {
      const payload = {
        name,
        description,
        tags,
        isPublic,
        circuit: cloneCircuit(circuit),
      }

      if (templateId) {
        const { template } = await apiUpdateTemplate(templateId, payload)

        setMyTemplates((prev) => replaceTemplateById(prev, template))
        if (template.isPublic) {
          setPublicTemplates((prev) => {
            const exists = prev.some((entry) => (entry._id ?? entry.id) === (template._id ?? template.id))
            return exists ? replaceTemplateById(prev, template) : [template, ...prev]
          })
        } else {
          setPublicTemplates((prev) => removeTemplateById(prev, templateId))
        }

        return { ok: true, template }
      }

      const { template } = await apiCreateTemplate(payload)

      setMyTemplates((prev) => [template, ...prev])
      if (template.isPublic) {
        setPublicTemplates((prev) => [template, ...prev])
      }

      return { ok: true, template }
    } catch (error) {
      return {
        ok: false,
        message: getApiErrorMessage(error, 'Unable to save template.'),
      }
    } finally {
      setSaving(false)
    }
  }, [removeTemplateById, replaceTemplateById])

  const deleteTemplate = useCallback(async (templateId) => {
    try {
      await apiDeleteTemplate(templateId)
      setMyTemplates((prev) => removeTemplateById(prev, templateId))
      setPublicTemplates((prev) => removeTemplateById(prev, templateId))
      setSelectedTemplateState((prev) => {
        if (!prev) return prev
        const shouldClearSelection = (prev._id ?? prev.id) === templateId
        if (shouldClearSelection) {
          clearPreview()
          return null
        }
        return prev
      })
      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        message: getApiErrorMessage(error, 'Unable to delete template.'),
      }
    }
  }, [clearPreview, removeTemplateById])

  const templatesByTab = useMemo(() => ({
    mine: myTemplates,
    public: publicTemplates,
    examples: EXAMPLE_TEMPLATES,
  }), [myTemplates, publicTemplates])

  return {
    templatesByTab,
    selectedTemplate,
    setSelectedTemplate,
    loading,
    saving,
    previewStatus,
    previewResults,
    runPreview,
    saveTemplate,
    deleteTemplate,
    reloadTemplates: loadTemplates,
  }
}
