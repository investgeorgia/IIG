import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { name, email, phone, preferredContactMode, country, language, role } = await request.json()

    // Server-side validation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!email || !email.trim() || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Phone / WhatsApp number is required' }, { status: 400 })
    }
    if (!role || (role !== 'investor' && role !== 'broker')) {
      return NextResponse.json({ error: 'Role must be either investor or broker' }, { status: 400 })
    }

    const webhookUrl = process.env.BITRIX24_WEBHOOK_URL

    if (!webhookUrl) {
      console.warn('BITRIX24_WEBHOOK_URL is not configured. Simulating successful submission.')
      // Dev mode fallback so the user can test the UI without configuring Bitrix24 first
      return NextResponse.json({ 
        success: true, 
        message: 'Form submitted successfully (Simulated - Bitrix24 URL missing)',
        data: { name, email, phone, preferredContactMode: preferredContactMode || country, language, role }
      })
    }

    // Intelligently normalize Bitrix24 webhook URL regardless of how it was copied
    let bitrixEndpoint = webhookUrl.trim()
    if (bitrixEndpoint.includes('crm.lead.add')) {
      bitrixEndpoint = bitrixEndpoint.replace(/\/+$/, '')
      if (!bitrixEndpoint.endsWith('.json')) {
        bitrixEndpoint = `${bitrixEndpoint}.json`
      }
    } else {
      bitrixEndpoint = bitrixEndpoint.replace(/\/profile\/?$/, '')
      bitrixEndpoint = bitrixEndpoint.replace(/\/+$/, '')
      bitrixEndpoint = `${bitrixEndpoint}/crm.lead.add.json`
    }

    // Construct the lead comments
    const roleLabel = role === 'investor' ? 'Investor' : 'Real Estate Broker / Agent'
    const contactMode = preferredContactMode || country
    const commentsArray = [
      `Submitted via custom IPS Registration Form.`,
      `Role Selected: ${roleLabel}`,
      phone ? `Phone Number: ${phone.trim()}` : null,
      contactMode ? `Preferred Mode of Contact: ${contactMode.trim()}` : null,
      language ? `Preferred Language: ${language.trim()}` : null,
    ].filter(Boolean)

    // Construct the lead fields for Bitrix24
    const payload = {
      fields: {
        TITLE: `IPS Registration: ${name} (${role.toUpperCase()})`,
        NAME: name.trim(),
        SOURCE_ID: 'TRADE_SHOW',
        SOURCE_DESCRIPTION: 'IPS 2026',
        EMAIL: [
          {
            VALUE: email.trim(),
            VALUE_TYPE: 'WORK',
          },
        ],
        PHONE: [
          {
            VALUE: phone.trim(),
            VALUE_TYPE: 'WORK',
          },
        ],
        COMMENTS: commentsArray.join('\n'),
        STATUS_ID: 'NEW',
        OPENED: 'Y',
      },
      params: {
        REGISTER_SONET_EVENT: 'Y',
      },
    }

    const response = await fetch(bitrixEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Bitrix24 API Error response:', errorText)
      throw new Error(`Bitrix24 returned status ${response.status}: ${errorText}`)
    }

    const result = await response.json()

    if (result.error) {
      throw new Error(`Bitrix24 Error: ${result.error_description || result.error}`)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Registration successfully sent to Bitrix24 CRM',
      leadId: result.result 
    })

  } catch (error: any) {
    console.error('Registration processing failed:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}
