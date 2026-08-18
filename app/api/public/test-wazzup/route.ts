import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const apiKey = process.env.WAZZUP_API_KEY?.trim()
    const channelId = process.env.WAZZUP_CHANNEL_ID?.trim()

    if (!apiKey || !channelId) {
      return NextResponse.json({
        configured: false,
        error: 'WAZZUP_API_KEY or WAZZUP_CHANNEL_ID is not configured in .env'
      })
    }

    // 1. Fetch channel list
    const channelsRes = await fetch('https://api.wazzup24.com/v3/channels', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    const channelsData = await channelsRes.json().catch(() => null)

    return NextResponse.json({
      configured: true,
      channelsStatus: channelsRes.status,
      channelsData
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()
    const apiKey = process.env.WAZZUP_API_KEY?.trim()
    const channelId = process.env.WAZZUP_CHANNEL_ID?.trim()

    if (!apiKey || !channelId) {
      return NextResponse.json({ error: 'Wazzup credentials missing in .env' }, { status: 400 })
    }

    const cleanPhone = (phone || '').replace(/[^0-9]/g, '')
    const crmMessageId = crypto.randomUUID()

    // 1. Send message via Wazzup API
    const sendRes = await fetch('https://api.wazzup24.com/v3/message', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channelId,
        chatType: 'whatsapp',
        chatId: cleanPhone,
        crmMessageId,
        text: `Invest Georgia UAE Test OTP: ${Math.floor(1000 + Math.random() * 9000)}`
      })
    })

    const sendData = await sendRes.json().catch(() => null)

    // 2. Fetch recent messages for this chat to check status
    let messageStatusData = null
    if (sendRes.ok && sendData?.messageId) {
      await new Promise(r => setTimeout(r, 1500))
      
      const statusRes = await fetch(`https://api.wazzup24.com/v3/messages?chatId=${cleanPhone}&channelId=${channelId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      messageStatusData = await statusRes.json().catch(() => null)
    }

    return NextResponse.json({
      sendHttpStatus: sendRes.status,
      sendOk: sendRes.ok,
      sendData,
      crmMessageId,
      sentToPhone: cleanPhone,
      messageStatusData
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
