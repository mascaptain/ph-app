import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Un plantage de rendu vidait l'ecran sans un mot : rien a lire, rien a faire, aucune
// indication de ce qui s'est passe. Cette barriere affiche au moins la cause et propose
// un rechargement, ce qui evite d'avoir a deviner.
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('Erreur de rendu :', error, info) }
  render() {
    if (!this.state.error) return this.props.children
    const F = "'Urbanist',system-ui,sans-serif"
    return (
      <div style={{position:'fixed',inset:0,background:'#FFF',color:'#000',fontFamily:F,
                   display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                   gap:16,padding:'24px',textAlign:'center'}}>
        <div style={{fontSize:26,fontWeight:700,letterSpacing:'-.02em'}}>Quelque chose a lâché</div>
        <div style={{fontSize:15,color:'rgba(0,0,0,.56)',maxWidth:420,lineHeight:1.6}}>
          Tes séances sont enregistrées sur ton compte, rien n'est perdu. Recharge pour reprendre.
        </div>
        <pre style={{fontSize:11,color:'rgba(0,0,0,.40)',maxWidth:520,overflowX:'auto',
                     background:'#F2F2F3',padding:'12px 14px',borderRadius:12,textAlign:'left'}}>
          {String(this.state.error && (this.state.error.message || this.state.error))}
        </pre>
        <button type="button" onClick={() => window.location.reload()}
          style={{appearance:'none',border:0,background:'#75FB90',color:'#000',fontFamily:F,
                  fontSize:16,fontWeight:700,padding:'15px 28px',borderRadius:14,cursor:'pointer'}}>
          Recharger
        </button>
      </div>
    )
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
