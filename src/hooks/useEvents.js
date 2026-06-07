import { useCallback, useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export function useEvents(refreshMs) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadEvents = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    const { data, error: queryError } = await supabase
      .from('events')
      .select('*')
      .order('start_date')
      .order('start_time', { nullsFirst: true })
    setError(queryError?.message || '')
    if (!queryError) setEvents(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadEvents()
    if (!refreshMs) return undefined
    const interval = window.setInterval(loadEvents, refreshMs)
    return () => window.clearInterval(interval)
  }, [loadEvents, refreshMs])

  const saveEvent = async (event) => {
    const payload = { ...event, updated_at: new Date().toISOString() }
    const query = payload.id
      ? supabase.from('events').update(payload).eq('id', payload.id)
      : supabase.from('events').insert(payload)
    const { error: saveError } = await query
    if (saveError) throw saveError
    await loadEvents()
  }

  const deleteEvent = async (id) => {
    const { error: deleteError } = await supabase.from('events').delete().eq('id', id)
    if (deleteError) throw deleteError
    await loadEvents()
  }

  return { events, loading, error, loadEvents, saveEvent, deleteEvent }
}
