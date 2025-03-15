'use client'
import { useState } from 'react'

interface DNSResult {
  id: number
  qdcount: number
  ancount: number
  answers: Array<{
    address?: string
    data?: string
  }>
}

export default function Home() {
  const [domain, setDomain] = useState('')
  const [recordType, setRecordType] = useState('A')
  const [resolver, setResolver] = useState('')
  const [results, setResults] = useState<DNSResult | null>(null)
  const [loading, setLoading] = useState(false)

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault()
  //   setLoading(true)

  //   try {
  //     const response = await fetch('/api/dns', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ domain, recordType, resolver }),
  //     })

  //     const data = await response.json()
  //     setResults(data)
  //   } catch (error) {
  //     console.error('DNS query failed:', error)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    console.log('Submitting query for domain:', domain) // Debug log

    try {
      const response = await fetch('/api/dns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain, recordType }),
      })

      const data = await response.json()
      console.log('Received response:', data) // Debug log
      setResults(data)
    } catch (error) {
      console.error('DNS query failed:', error)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white p-6">
        <h1 className="text-3xl font-bold">DNS Explorer</h1>
        <p className="text-slate-400 mt-2">Query DNS records with custom resolver support</p>
      </header>
      
      <main className="container mx-auto p-8">
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Domain Name</label>
                <input 
                  type="text" 
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Record Type</label>
                <select
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="A">A Record</option>
                  <option value="AAAA">AAAA Record</option>
                  <option value="CNAME">CNAME Record</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Custom Resolver (optional)</label>
              <input 
                type="text" 
                value={resolver}
                onChange={(e) => setResolver(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="8.8.8.8:53"
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Querying...' : 'Query DNS'}
            </button>
          </form>
        </div>

        {results && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">DNS Query Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-slate-50 rounded">
                <h3 className="font-semibold mb-2">Query Details</h3>
                <div className="text-sm">
                  <p>Query ID: {results.id}</p>
                  <p>Questions: {results.qdcount}</p>
                  <p>Answers: {results.ancount}</p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded">
                <h3 className="font-semibold mb-2">Response Records</h3>
                <div className="font-mono text-sm">
                  {results.answers?.map((answer: any, index: number) => (
                    <div key={index} className="mb-2">
                      {answer.address || answer.data}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded">
              <h3 className="font-semibold mb-2">Raw Response</h3>
              <pre className="overflow-auto text-sm">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
