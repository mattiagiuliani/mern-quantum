import { useMemo, useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Form } from 'react-bootstrap'
import { useAuth } from '../hooks/useAuth'
import {
  TEMPLATE_COPY,
  TEMPLATE_TABS,
  useFeatureCTemplates,
} from '../features/feature-c-templates/feature-c-templates'
import { SaveTemplateModal } from '../features/feature-c-templates/components/SaveTemplateModal'
import { TemplateCard } from '../features/feature-c-templates/components/TemplateCard'
import { TemplatePreviewPanel } from '../features/feature-c-templates/components/TemplatePreviewPanel'
import { TemplateTabs } from '../features/feature-c-templates/components/TemplateTabs'
import {
  TEMPLATE_EMPTY_STATE_BOX_STYLE,
  TEMPLATE_FILTER_INPUT_STYLE,
  TEMPLATE_LOCKED_STATE_BOX_STYLE,
  TEMPLATE_PAGE_BUTTON_STYLES,
} from '../features/feature-c-templates/template.styles'
import { cloneCircuit, isCircuitEmpty } from '../features/feature-c-templates/template.utils'

export default function TemplatesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()

  const [activeTab, setActiveTab] = useState('public')
  const tabInitialized = useRef(false)

  useEffect(() => {
    if (!authLoading && !tabInitialized.current) {
      tabInitialized.current = true
      if (user) setActiveTab('mine')
    }
  }, [authLoading, user])
  const [tagFilter, setTagFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editSeed, setEditSeed] = useState(null)

  const {
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
  } = useFeatureCTemplates(Boolean(user))

  const incomingCircuit = location.state?.circuitDraft
  const defaultCircuit = incomingCircuit ?? selectedTemplate?.circuit ?? null
  const resolvedActiveTab = !user && activeTab === 'mine' ? 'public' : activeTab

  const visibleTemplates = useMemo(() => {
    const source = templatesByTab[resolvedActiveTab] ?? []
    const normalized = tagFilter.trim().toLowerCase()

    if (!normalized) return source

    return source.filter((template) =>
      (template.tags ?? []).some((tag) => tag.toLowerCase().includes(normalized)),
    )
  }, [resolvedActiveTab, tagFilter, templatesByTab])

  const isMineLocked = resolvedActiveTab === 'mine' && !user

  const handleUseTemplate = (template) => {
    navigate('/circuit-builder', {
      state: { templateToApply: template },
    })
  }

  const openSaveModal = (seedTemplate, forceCreate = false) => {
    if (!user) {
      navigate('/login')
      return
    }

    if (seedTemplate && forceCreate) {
      const normalizedSeed = { ...seedTemplate }
      delete normalizedSeed._id
      delete normalizedSeed.id
      setEditSeed(normalizedSeed)
    } else {
      setEditSeed(seedTemplate ?? null)
    }
    setModalOpen(true)
  }

  const handleTabChange = (nextTab) => {
    if (!user && nextTab === 'mine') {
      navigate('/login')
      return
    }
    setActiveTab(nextTab)
  }

  const handleDeleteTemplate = async (template) => {
    const templateId = template?._id ?? template?.id
    if (!templateId) return

    const confirmed = window.confirm('Delete this template permanently?')
    if (!confirmed) return

    await deleteTemplate(templateId)
  }

  const selectedTemplateId = selectedTemplate?._id ?? selectedTemplate?.id ?? null
  const isSelectedTemplateVisible = selectedTemplateId
    ? visibleTemplates.some((template) => (template._id ?? template.id) === selectedTemplateId)
    : false
  const templateForPreview = isSelectedTemplateVisible ? selectedTemplate : null

  const selectedAuthorId = templateForPreview?.author?._id ?? templateForPreview?.author ?? null
  const isSelectedOwnedByUser = Boolean(user)
    && Boolean(selectedAuthorId)
    && String(selectedAuthorId) === String(user.id)
  const canDeleteSelected = isSelectedOwnedByUser && Boolean(templateForPreview?._id ?? templateForPreview?.id)
  const canEditSelected = isSelectedOwnedByUser && Boolean(templateForPreview?._id ?? templateForPreview?.id)

  const canOpenSave = Boolean(defaultCircuit) && !isCircuitEmpty(defaultCircuit)

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');`}</style>
      <style>{`
        .templates-page-shell {
          min-height: 100vh;
          background: radial-gradient(circle at top right, rgba(110,231,208,0.07), transparent 35%), #080C14;
          color: #F1EDE4;
          font-family: 'Space Mono', monospace;
          padding: 80px clamp(14px, 3.2vw, 24px) clamp(16px, 3vw, 30px);
        }

        .templates-page-inner {
          max-width: 1220px;
          margin: 0 auto;
          width: 100%;
        }

        .templates-layout {
          display: grid;
          grid-template-columns: 1.8fr 1fr;
          gap: clamp(12px, 1.8vw, 20px);
        }

        .templates-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          flex-wrap: wrap;
        }

        .templates-header-copy {
          min-width: min(100%, 320px);
          flex: 1 1 280px;
        }

        .templates-header-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
          flex: 1 1 260px;
        }

        .templates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 12px;
          align-items: stretch;
        }

        @media (max-width: 980px) {
          .templates-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .templates-header-actions {
            width: 100%;
            justify-content: stretch;
          }

          .templates-header-actions > button {
            flex: 1 1 170px;
          }
        }
      `}</style>
      <div className="templates-page-shell">
        <div className="templates-page-inner templates-layout">
          <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <header className="templates-header">
              <div className="templates-header-copy">
                <div style={{ fontSize: 10, letterSpacing: '0.16em', color: '#6EE7D0', textTransform: 'uppercase', marginBottom: 6 }}>
                  mern-quantum · templates
                </div>
                <h1 style={{ margin: 0, fontSize: 22 }}>{TEMPLATE_COPY.pageTitle}</h1>
              </div>

              <div className="templates-header-actions">
                <Button
                  onClick={() => navigate('/circuit-builder')}
                  variant="outline-secondary"
                  style={TEMPLATE_PAGE_BUTTON_STYLES.secondary}
                >
                  {TEMPLATE_COPY.backToBuilder}
                </Button>
                <Button
                  onClick={() => openSaveModal(null)}
                  disabled={!canOpenSave}
                  variant="outline-info"
                  style={{
                    ...TEMPLATE_PAGE_BUTTON_STYLES.info,
                    color: canOpenSave ? '#6EE7D0' : 'rgba(255,255,255,0.3)',
                    cursor: canOpenSave ? 'pointer' : 'default',
                  }}
                >
                  {TEMPLATE_COPY.saveCurrentCircuit}
                </Button>
              </div>
            </header>

            <TemplateTabs tabs={TEMPLATE_TABS} activeTab={resolvedActiveTab} onChange={handleTabChange} />

            <div>
              <Form.Control
                value={tagFilter}
                onChange={(event) => setTagFilter(event.target.value)}
                placeholder={TEMPLATE_COPY.filterByTagPlaceholder}
                style={TEMPLATE_FILTER_INPUT_STYLE}
              />
            </div>

            {loading ? (
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>{TEMPLATE_COPY.loadingTemplates}</div>
            ) : (
              <div className="templates-grid">
                {visibleTemplates.map((template) => (
                  <TemplateCard
                    key={template._id ?? template.id}
                    template={template}
                    selected={selectedTemplate?._id === template._id || selectedTemplate?.id === template.id}
                    onSelect={(next) => setSelectedTemplate(next)}
                    onUse={handleUseTemplate}
                  />
                ))}
                {isMineLocked && (
                  <div style={TEMPLATE_LOCKED_STATE_BOX_STYLE}>
                    {TEMPLATE_COPY.signInTemplateHint}
                    <Button
                      onClick={() => navigate('/login')}
                      variant="outline-info"
                      style={TEMPLATE_PAGE_BUTTON_STYLES.loginCta}
                    >
                      {TEMPLATE_COPY.goToLogin}
                    </Button>
                  </div>
                )}
                {visibleTemplates.length === 0 && (
                  <div style={TEMPLATE_EMPTY_STATE_BOX_STYLE}>
                    {isMineLocked ? TEMPLATE_COPY.noTemplatesSignedOut : TEMPLATE_COPY.noTemplatesFound}
                  </div>
                )}
              </div>
            )}
          </section>

          <TemplatePreviewPanel
            template={templateForPreview}
            previewStatus={previewStatus}
            previewResults={previewResults}
            onRunPreview={runPreview}
            onUse={handleUseTemplate}
            onSave={openSaveModal}
            onDelete={handleDeleteTemplate}
            canDelete={canDeleteSelected}
            canEdit={canEditSelected}
          />
        </div>
      </div>

      <SaveTemplateModal
        key={`${modalOpen}-${editSeed?._id ?? editSeed?.id ?? 'new'}`}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={saveTemplate}
        saving={saving}
        defaultCircuit={defaultCircuit ? cloneCircuit(defaultCircuit) : null}
        initialValues={editSeed}
      />
    </>
  )
}
