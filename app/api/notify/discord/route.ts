import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/app/lib/supabase-server'
import {
  sendDiscordNotification,
  createTeacherClockInEmbed,
  createTeacherClockOutEmbed,
} from '@/app/lib/discord'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, data } = await request.json()

    if (!type || !data) {
      return NextResponse.json({ error: 'Missing type or data' }, { status: 400 })
    }

    if (type === 'clock_in') {
      const { teacherName, clockInAt } = data
      if (!teacherName || !clockInAt) {
        return NextResponse.json(
          { error: 'clock_in requires teacherName and clockInAt' },
          { status: 400 }
        )
      }
      const embed = createTeacherClockInEmbed({ teacherName, clockInAt })
      await sendDiscordNotification(embed, process.env.DISCORD_EMPLOYEE_WEBHOOK_URL)
      return NextResponse.json({ success: true })
    }

    if (type === 'clock_out') {
      const { teacherName, clockInAt, clockOutAt } = data
      if (!teacherName || !clockInAt || !clockOutAt) {
        return NextResponse.json(
          { error: 'clock_out requires teacherName, clockInAt, and clockOutAt' },
          { status: 400 }
        )
      }
      const embed = createTeacherClockOutEmbed({ teacherName, clockInAt, clockOutAt })
      await sendDiscordNotification(embed, process.env.DISCORD_EMPLOYEE_WEBHOOK_URL)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 })
  } catch (error) {
    console.error('Error sending Discord notification:', error)
    return NextResponse.json(
      {
        error: 'Failed to send Discord notification',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
