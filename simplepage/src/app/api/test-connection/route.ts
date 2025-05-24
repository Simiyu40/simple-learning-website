import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { error } = await supabase.from('papers').select('id', { count: 'exact', head: true })
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Connected successfully' })
  } catch (err) {
    console.error('Error connecting to Supabase:', err)
    return NextResponse.json(
      { error: 'Failed to connect to Supabase' },
      { status: 500 }
    )
  }
}