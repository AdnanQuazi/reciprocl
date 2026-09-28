import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useParams } from 'react-router-dom'

function Builder() {
  const [formTitle, setFormTitle] = useState('')
  const [fields, setFields] = useState([])
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishedId, setPublishedId] = useState('')

  const addField = (type) => {
    setFields([...fields, { 
      id: Date.now(), 
      label: `New ${type} Field`, 
      type: type, 
      required: false 
    }])
  }

  const updateField = (id, key, value) => {
    setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f))
  }

  const removeField = (id) => {
    setFields(fields.filter(f => f.id !== id))
  }

  const handlePublish = async () => {
    if (!formTitle) return alert("Please enter a Form Title")
    if (fields.length === 0) return alert("Please add at least one field")
    
    setIsPublishing(true)
    try {
      const response = await fetch('/api/method/reciprocl.api.publish_form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ form_title: formTitle, fields: fields })
      })
      const data = await response.json()
      if (data.message && data.message.message === "success") {
        setPublishedId(data.message.form_id)
      } else if (data.exc) {
        alert("Error: " + JSON.parse(data.exc)[0])
      }
    } catch (e) {
      alert("Error publishing form. Check console.")
      console.error(e)
    } finally {
      setIsPublishing(false)
    }
  }

  if (publishedId) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 max-w-lg w-full">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Form Published!</h2>
          <p className="text-slate-500 mb-8">Your form has been successfully compiled into a native Frappe DocType and is ready to receive submissions.</p>
          
          <div className="space-y-4">
            <Link to={`/f/${publishedId}`} target="_blank" className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-sm transition-all">
              Open Public Form
            </Link>
            <button onClick={() => { setPublishedId(''); setFields([]); setFormTitle(''); }} className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl shadow-sm transition-all">
              Create Another Form
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      <div className="max-w-4xl mx-auto py-12 px-6">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-indigo-600 mb-2">Reciprocl</h1>
          <p className="text-slate-500 text-lg">Build native Frappe forms, beautifully.</p>
        </header>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-8 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <input 
                type="text" 
                placeholder="Untitled Form" 
                className="w-full text-3xl font-bold text-slate-800 placeholder:text-slate-300 border-none outline-none bg-transparent mb-8"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />

              <div className="space-y-4">
                {fields.length === 0 && (
                  <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                    Add a field from the right panel to start building.
                  </div>
                )}
                
                {fields.map((field) => (
                  <div key={field.id} className="group flex gap-4 items-start p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-indigo-200 transition-colors">
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-500">{field.type}</span>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" checked={field.required} onChange={(e) => updateField(field.id, 'required', e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                            Required
                          </label>
                        </div>
                      </div>
                      
                      <input 
                        type="text" 
                        value={field.label}
                        onChange={(e) => updateField(field.id, 'label', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        placeholder="Question label..."
                      />
                    </div>
                    <button onClick={() => removeField(field.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
              <h3 className="font-semibold text-slate-800 mb-4">Add Fields</h3>
              <div className="space-y-2 mb-8">
                <button onClick={() => addField('Data')} className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-xl border border-slate-100 hover:border-indigo-100 transition-all text-sm font-medium">+ Short Text</button>
                <button onClick={() => addField('Text')} className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-xl border border-slate-100 hover:border-indigo-100 transition-all text-sm font-medium">+ Long Text</button>
                <button onClick={() => addField('Date')} className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-xl border border-slate-100 hover:border-indigo-100 transition-all text-sm font-medium">+ Date</button>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button 
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl shadow-sm transition-all"
                >
                  {isPublishing ? 'Publishing...' : 'Publish Form'}
                </button>
                <p className="text-xs text-center text-slate-400 mt-3">This will generate a native Frappe DocType.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PublicForm() {
  const { formId } = useParams()
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(null)
  const [formData, setFormData] = useState({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetch(`/api/method/reciprocl.api.get_form?form_id=${formId}`)
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          setForm(data.message)
        } else {
          alert("Failed to load form.")
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [formId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/method/reciprocl.api.submit_form`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form_id: formId, data: formData })
      })
      const data = await res.json()
      if (data.message && data.message.message === "success") {
        setSubmitted(true)
      } else if (data.exc) {
        alert("Error: " + JSON.parse(data.exc)[0])
      }
    } catch (error) {
      alert("Error submitting form")
      console.error(error)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p>Loading form...</p></div>
  if (!form) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p>Form not found.</p></div>
  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 text-center max-w-lg">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Thank you!</h2>
        <p className="text-slate-500">Your response has been recorded successfully.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-indigo-600 px-8 py-10 text-white">
          <h1 className="text-3xl font-bold">{form.form_title}</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {form.schema_json.map((field) => (
            <div key={field.id} className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              
              {field.type === 'Data' && (
                <input 
                  type="text" 
                  required={field.required}
                  onChange={(e) => setFormData({...formData, [field.label]: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              )}
              {field.type === 'Text' && (
                <textarea 
                  required={field.required}
                  rows="4"
                  onChange={(e) => setFormData({...formData, [field.label]: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              )}
              {field.type === 'Date' && (
                <input 
                  type="date" 
                  required={field.required}
                  onChange={(e) => setFormData({...formData, [field.label]: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              )}
            </div>
          ))}

          <div className="pt-6">
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-xl shadow-sm transition-all w-full md:w-auto">
              Submit Response
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function App() {
  const getBasename = () => {
    return window.location.pathname.startsWith('/reciprocl') ? '/reciprocl' : '/';
  };

  return (
    <BrowserRouter basename={getBasename()}>
      <Routes>
        <Route path="/" element={<Builder />} />
        <Route path="/f/:formId" element={<PublicForm />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
