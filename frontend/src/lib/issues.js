// src/lib/issues.js
import { supabase } from './supabase'

export const reportIssue = async (issueData) => {
  const { data, error } = await supabase.from('issues').insert(issueData).select()
  // After insert, call ML edge function
  await supabase.functions.invoke('call-ml-classifier', {
    body: { issue_id: data[0].id, description: issueData.description }
  })
  return { data, error }
}

export const upvoteIssue = async (issueId, userId) => {
  return await supabase.from('votes').upsert({ issue_id: issueId, citizen_id: userId })
}

// Real-time status tracking
export const subscribeToIssue = (issueId, callback) => {
  return supabase.channel(`issue-${issueId}`)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'issues',
      filter: `id=eq.${issueId}`
    }, callback)
    .subscribe()
}