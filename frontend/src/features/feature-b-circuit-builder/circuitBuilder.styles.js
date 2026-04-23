export const BUILDER_PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Lora&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body, #root { background: #080C14; min-height: 100vh; }

  @keyframes gateInsert {
    0%   { opacity: 0; transform: scale(0.45) translateY(-10px); }
    70%  { opacity: 1; transform: scale(1.08) translateY(2px); }
    100% { opacity: 1; transform: scale(1)    translateY(0); }
  }

  @keyframes superPulse {
    0%, 100% { opacity: 0.65; }
    50%       { opacity: 1; }
  }

  @keyframes measureFlash {
    0%   { transform: scale(1.4); opacity: 0.5; }
    60%  { transform: scale(1.1); opacity: 1; }
    100% { transform: scale(1);   opacity: 1; }
  }

  @keyframes fadeIn  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin    { to   { transform:rotate(360deg); } }
  @keyframes barGrow { from { width:0; } to { width:var(--w); } }
  @keyframes pulse   { 0%,100%{opacity:.6;} 50%{opacity:1;} }

  .run-btn { transition: all 0.22s ease; }
  .run-btn:not(:disabled):hover  { transform:translateY(-1px); box-shadow:0 0 20px rgba(110,231,208,0.3); }
  .run-btn:not(:disabled):active { transform:translateY(0); }

  .builder-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 20px;
    align-items: start;
  }

  @media (max-width: 900px) {
    .builder-layout {
      grid-template-columns: 1fr;
    }
  }

  .builder-collapsible-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    user-select: none;
  }

  .builder-collapsible-header:hover .builder-chevron {
    color: rgba(255,255,255,0.6);
  }

  .builder-chevron {
    color: rgba(255,255,255,0.3);
    font-size: 12px;
    transition: transform 0.2s ease, color 0.2s;
    line-height: 1;
  }

  .builder-kbd-hint {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: wrap;
  }

  .builder-kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.06em;
    color: rgba(255,255,255,0.35);
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.12);
    border-bottom-width: 2px;
    border-radius: 4px;
    padding: 2px 6px;
  }

  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
`
