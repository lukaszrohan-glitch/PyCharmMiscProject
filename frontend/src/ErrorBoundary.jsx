import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props){
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error){
    return { error }
  }
  componentDidCatch(error, info){
    // eslint-disable-next-line no-console
    console.error('Frontend runtime error:', error, info)
  }
  render(){
    if(this.state.error){
      return (
        <div style={{padding:20, fontFamily:'monospace'}}>
          <h2 style={{color:'crimson'}}>Frontend Error</h2>
          <p>{String(this.state.error)}</p>
          <pre style={{whiteSpace:'pre-wrap'}}>{this.state.error && this.state.error.stack}</pre>
          <button onClick={()=>{ this.setState({ error:null }); location.reload() }}>Reload</button>
        </div>
      )
    }
    return this.props.children
  }
}

