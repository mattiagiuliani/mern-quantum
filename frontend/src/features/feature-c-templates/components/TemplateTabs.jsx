import { Button, ButtonGroup } from 'react-bootstrap'

export function TemplateTabs({ tabs, activeTab, onChange }) {
  return (
    <ButtonGroup style={{ display: 'flex', gap: 8, flexWrap: 'wrap', background: 'transparent' }}>
      {tabs.map((tab) => {
        const active = activeTab === tab.id

        return (
          <Button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            variant={active ? 'outline-info' : 'outline-secondary'}
            style={{
              background: active ? 'rgba(110,231,208,0.1)' : 'transparent',
              border: `1px solid ${active ? 'rgba(110,231,208,0.42)' : 'rgba(255,255,255,0.15)'}`,
              color: active ? '#6EE7D0' : 'rgba(255,255,255,0.54)',
              borderRadius: 999,
              padding: '8px 12px',
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </Button>
        )
      })}
    </ButtonGroup>
  )
}
