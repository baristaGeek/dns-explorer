import type { NextApiRequest, NextApiResponse } from 'next'
import * as dgram from 'dgram'
import { DNSMessageHeader } from '../../lib/dnsMessageHeader'

const DNS_TYPES = {
  'A': 1,
  'AAAA': 28,
  'CNAME': 5
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { domain, recordType, resolver } = req.body
  const udpSocket = dgram.createSocket("udp4")
  const forwardSocket = dgram.createSocket("udp4")
  const typeValue = DNS_TYPES[recordType] || 1

  try {
    const queryId = Math.floor(Math.random() * 65535)
    const header = new DNSMessageHeader()
    header.setId(queryId)
    header.setQR(1)
    header.setQDCount(1)
    header.setANCount(1)
    header.setRD(1)

    const domainParts = domain.split('.')
    const questions = []
    const answers = []

    const question = Buffer.concat([
      ...domainParts.map(part => Buffer.concat([
        Buffer.from([part.length]),
        Buffer.from(part)
      ])),
      Buffer.from([0]),
      Buffer.from([0, typeValue, 0, 1])
    ])

    questions.push(question)

    if (resolver) {
      const [resolverIp, resolverPort] = resolver.split(':')
      const response = await new Promise((resolve) => {
        forwardSocket.send(Buffer.concat([header.toBuffer(), ...questions]), 
          Number(resolverPort), 
          resolverIp
        )
        forwardSocket.once("message", resolve)
      })

      res.status(200).json({
        id: queryId,
        domain,
        type: recordType,
        qdcount: 1,
        ancount: 1,
        rawResponse: response.toString('hex')
      })
    } else {
      const answer = Buffer.concat([
        question.slice(0, -4),
        Buffer.from([
          0x00, typeValue,
          0x00, 0x01,
          0x00, 0x00, 0x00, 0x3c,
          0x00, 0x04
        ])
      ])
      
      answers.push(answer)
      const response = Buffer.concat([header.toBuffer(), ...questions, ...answers])

      res.status(200).json({
        id: queryId,
        domain,
        type: recordType,
        qdcount: 1,
        ancount: 1,
        rawResponse: response.toString('hex')
      })
    }
  } catch (error) {
    console.error('DNS query failed:', error)
    res.status(500).json({ error: 'DNS query failed' })
  } finally {
    udpSocket.close()
    forwardSocket.close()
  }
}
