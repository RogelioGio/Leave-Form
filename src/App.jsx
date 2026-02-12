import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Completed from './Completed'
import Leave_Form from './Leave_Form'

function App() {
  const [submitted, setSubmitted] = useState(false)

  return <>
  {
    submitted ? <Completed /> : <Leave_Form/>
  }
  </>
}

export default App
