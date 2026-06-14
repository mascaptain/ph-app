import React, { useState, useEffect } from 'react'
import { supabase } from './supabase.js'

export default function App() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 64, letterSpacing: 4, color: '#C8FF00' }}>PH</h1>
      <p style={{ color: '#888', fontSize: 14 }}>Programme Hybride — Loading...</p>
    </div>
  )
}
