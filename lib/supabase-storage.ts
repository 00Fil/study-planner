import { WeeklyPlan, Exam, Subject, PomodoroSession, StudyStats, Topic, Homework } from './types'
import { createClient } from './supabase/client'

// Helper to get the right client - always use client for now
// Server-side operations should be handled in API routes or server components
function getSupabaseClient() {
  return createClient()
}

// Helper to get current user
async function getCurrentUser() {
  const supabase = getSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Weekly Plans
export const getWeeklyPlans = async (): Promise<WeeklyPlan[]> => {
  const supabase = getSupabaseClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('weekly_plans')
    .select('*')
    .eq('user_id', user.id)
    .order('week_start_date', { ascending: false })

  if (error) {
    console.error('Error fetching weekly plans:', error)
    return []
  }

  return data || []
}

export const saveWeeklyPlan = async (plan: WeeklyPlan): Promise<void> => {
  const supabase = getSupabaseClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase
    .from('weekly_plans')
    .upsert({
      ...plan,
      user_id: user.id,
    })

  if (error) {
    console.error('Error saving weekly plan:', error)
    throw error
  }
}

export const getCurrentWeekPlan = async (): Promise<WeeklyPlan | null> => {
  const supabase = getSupabaseClient()
  const user = await getCurrentUser()
  if (!user) return null

  const currentWeekStart = new Date()
  currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay() + 1)
  currentWeekStart.setHours(0, 0, 0, 0)
  
  const { data, error } = await supabase
    .from('weekly_plans')
    .select('*')
    .eq('user_id', user.id)
    .eq('week_start_date', currentWeekStart.toISOString().split('T')[0])
    .single()

  if (error) {
    console.error('Error fetching current week plan:', error)
    return null
  }

  return data
}

// Exams
export const getExams = async (): Promise<Exam[]> => {
  const supabase = getSupabaseClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching exams:', error)
    return []
  }

  return data || []
}

export const saveExam = async (exam: Exam): Promise<void> => {
  const supabase = getSupabaseClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase
    .from('exams')
    .upsert({
      ...exam,
      user_id: user.id,
    })

  if (error) {
    console.error('Error saving exam:', error)
    throw error
  }
}

export const deleteExam = async (examId: string): Promise<void> => {
  const supabase = getSupabaseClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase
    .from('exams')
    .delete()
    .eq('id', examId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting exam:', error)
    throw error
  }
}

// Subjects
export const getSubjects = async (): Promise<Subject[]> => {
  const supabase = getSupabaseClient()
  const user = await getCurrentUser()
  if (!user) return getDefaultSubjects()

  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching subjects:', error)
    return getDefaultSubjects()
  }

  // If no subjects exist, initialize with defaults
  if (!data || data.length === 0) {
    const defaults = getDefaultSubjects()
    for (const subject of defaults) {
      await saveSubject(subject)
    }
    return defaults
  }

  return data
}

export const saveSubject = async (subject: Subject): Promise<void> => {
  const supabase = getSupabaseClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase
    .from('subjects')
    .upsert({
      ...subject,
      user_id: user.id,
    })

  if (error) {
    console.error('Error saving subject:', error)
    throw error
  }
}

export const deleteSubject = async (subjectName: string): Promise<void> => {
  const supabase = getSupabaseClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  // First get the subject ID
  const { data: subject } = await supabase
    .from('subjects')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', subjectName)
    .single()

  if (!subject) throw new Error('Subject not found')

  // Delete the subject (topics will be cascade deleted)
  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', subject.id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting subject:', error)
    throw error
  }
}

// Topics
// Helper function to convert database topic to TypeScript Topic
const dbTopicToTopic = (dbTopic: any): Topic => ({
  id: dbTopic.id,
  subjectName: dbTopic.subject_name,
  name: dbTopic.name,
  description: dbTopic.description,
  status: dbTopic.status,
  priority: dbTopic.priority,
  difficulty: dbTopic.difficulty,
  estimatedHours: dbTopic.estimated_hours,
  actualHours: dbTopic.actual_hours,  // Convert actual_hours to actualHours
  markedForExam: dbTopic.marked_for_exam,  // Convert marked_for_exam to markedForExam
  examIds: dbTopic.exam_ids || [],
  notes: dbTopic.notes,
  resources: dbTopic.resources || [],
  completedDate: dbTopic.completed_date,
})

export const getTopics = async (): Promise<Topic[]> => {
  const supabase = getSupabaseClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching topics:', error)
    return []
  }

  return (data || []).map(dbTopicToTopic)
}

export const getTopicsBySubject = async (subjectName: string): Promise<Topic[]> => {
  const supabase = getSupabaseClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('user_id', user.id)
    .eq('subject_name', subjectName)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching topics by subject:', error)
    return []
  }

  return (data || []).map(dbTopicToTopic)
}

export const saveTopic = async (topic: Topic): Promise<void> => {
  const supabase = getSupabaseClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  // Get the subject ID
  const { data: subject } = await supabase
    .from('subjects')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', topic.subjectName)
    .single()

  if (!subject) throw new Error('Subject not found')

  // Convert camelCase to snake_case for database fields
  const dbTopic = {
    id: topic.id,
    subject_name: topic.subjectName,
    name: topic.name,
    description: topic.description,
    status: topic.status,
    priority: topic.priority,
    difficulty: topic.difficulty,
    estimated_hours: topic.estimatedHours,
    actual_hours: topic.actualHours,  // Convert actualHours to actual_hours
    marked_for_exam: topic.markedForExam,  // Convert markedForExam to marked_for_exam
    exam_ids: topic.examIds || [],
    notes: topic.notes,
    resources: topic.resources || [],
    completed_date: topic.completedDate,
    user_id: user.id,
    subject_id: subject.id,
  }

  const { error } = await supabase
    .from('topics')
    .upsert(dbTopic)

  if (error) {
    console.error('Error saving topic:', error)
    throw error
  }
}

export const deleteTopic = async (topicId: string): Promise<void> => {
  const supabase = getSupabaseClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase
    .from('topics')
    .delete()
    .eq('id', topicId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting topic:', error)
    throw error
  }
}

export const markTopicsForExam = async (topicIds: string[], examId: string): Promise<void> => {
  const supabase = getSupabaseClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  // Fetch topics to update
  const { data: topics } = await supabase
    .from('topics')
    .select('*')
    .eq('user_id', user.id)
    .in('id', topicIds)

  if (!topics) return

  // Update each topic
  for (const topic of topics) {
    const examIds = topic.exam_ids || []
    if (!examIds.includes(examId)) {
      examIds.push(examId)
    }
    
    await supabase
      .from('topics')
      .update({
        marked_for_exam: true,
        exam_ids: examIds,
      })
      .eq('id', topic.id)
      .eq('user_id', user.id)
  }
}

export const unmarkTopicsForExam = async (topicIds: string[], examId: string): Promise<void> => {
  const supabase = getSupabaseClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  // Fetch topics to update
  const { data: topics } = await supabase
    .from('topics')
    .select('*')
    .eq('user_id', user.id)
    .in('id', topicIds)

  if (!topics) return

  // Update each topic
  for (const topic of topics) {
    const examIds = (topic.exam_ids || []).filter((id: string) => id !== examId)
    
    await supabase
      .from('topics')
      .update({
        marked_for_exam: examIds.length > 0,
        exam_ids: examIds,
      })
      .eq('id', topic.id)
      .eq('user_id', user.id)
  }
}

// Homework
// Helper function to convert database homework to TypeScript Homework
const dbHomeworkToHomework = (dbHomework: any): Homework => ({
  id: dbHomework.id,
  subject: dbHomework.subject,
  title: dbHomework.title,
  description: dbHomework.description,
  dueDate: dbHomework.due_date,  // Convert due_date to dueDate
  priority: dbHomework.priority,
  status: dbHomework.status,
  estimatedHours: dbHomework.estimated_hours,  // Convert estimated_hours to estimatedHours
  actualHours: dbHomework.actual_hours,  // Convert actual_hours to actualHours
  attachments: dbHomework.attachments || [],
  notes: dbHomework.notes,
  completedDate: dbHomework.completed_date,  // Convert completed_date to completedDate
})

export const getHomework = async (): Promise<Homework[]> => {
  const supabase = getSupabaseClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('homework')
    .select('*')
    .eq('user_id', user.id)
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Error fetching homework:', error)
    return []
  }

  return (data || []).map(dbHomeworkToHomework)
}

export const saveHomework = async (homework: Homework): Promise<void> => {
  const supabase = getSupabaseClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  // Get subject ID if subject name is provided
  let subjectId = null
  if (homework.subject) {
    const { data: subject } = await supabase
      .from('subjects')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', homework.subject)
      .single()
    
    subjectId = subject?.id
  }

  // Convert camelCase to snake_case for database fields
  const dbHomework = {
    id: homework.id,
    subject: homework.subject,
    title: homework.title,
    description: homework.description,
    due_date: homework.dueDate,  // Convert dueDate to due_date
    priority: homework.priority,
    status: homework.status,
    estimated_hours: homework.estimatedHours,  // Convert estimatedHours to estimated_hours
    actual_hours: homework.actualHours,  // Convert actualHours to actual_hours
    attachments: homework.attachments || [],
    notes: homework.notes,
    completed_date: homework.completedDate,  // Convert completedDate to completed_date
    user_id: user.id,
    subject_id: subjectId,
  }

  const { error } = await supabase
    .from('homework')
    .upsert(dbHomework)

  if (error) {
    console.error('Error saving homework:', error)
    throw error
  }
}

export const deleteHomework = async (homeworkId: string): Promise<void> => {
  const supabase = getSupabaseClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase
    .from('homework')
    .delete()
    .eq('id', homeworkId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting homework:', error)
    throw error
  }
}

// Pomodoro Sessions
export const getPomodoroSessions = async (): Promise<PomodoroSession[]> => {
  const supabase = getSupabaseClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('start_time', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching pomodoro sessions:', error)
    return []
  }

  return data || []
}

export const savePomodoroSession = async (session: PomodoroSession): Promise<void> => {
  const supabase = getSupabaseClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase
    .from('pomodoro_sessions')
    .insert({
      ...session,
      user_id: user.id,
    })

  if (error) {
    console.error('Error saving pomodoro session:', error)
    throw error
  }
}

// Study Stats
export const getStudyStats = async (): Promise<StudyStats[]> => {
  const supabase = getSupabaseClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('study_stats')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30)

  if (error) {
    console.error('Error fetching study stats:', error)
    return []
  }

  return data || []
}

export const saveStudyStats = async (stats: StudyStats): Promise<void> => {
  const supabase = getSupabaseClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase
    .from('study_stats')
    .upsert({
      ...stats,
      user_id: user.id,
    })

  if (error) {
    console.error('Error saving study stats:', error)
    throw error
  }
}

// Preferences
export const getPreferences = async () => {
  const supabase = getSupabaseClient()
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Error fetching preferences:', error)
    return null
  }

  return data
}

export const savePreferences = async (preferences: any): Promise<void> => {
  const supabase = getSupabaseClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase
    .from('preferences')
    .upsert({
      ...preferences,
      user_id: user.id,
    })

  if (error) {
    console.error('Error saving preferences:', error)
    throw error
  }
}

// Default subjects (same as original)
export const getDefaultSubjects = (): Subject[] => [
  { name: 'Matematica', displayName: 'Matematica', professor: '', color: '#10B981', currentTopic: '', lastStudied: '', totalHours: 0, averageGrade: 0, topics: [], examGrades: [] },
  { name: 'Italiano', displayName: 'Italiano', professor: '', color: '#F59E0B', currentTopic: '', lastStudied: '', totalHours: 0, averageGrade: 0, topics: [], examGrades: [] },
  { name: 'Storia', displayName: 'Storia', professor: '', color: '#D97706', currentTopic: '', lastStudied: '', totalHours: 0, averageGrade: 0, topics: [], examGrades: [] },
  { name: 'Sistemi e Reti', displayName: 'Sistemi e Reti', professor: '', color: '#8B5CF6', currentTopic: '', lastStudied: '', totalHours: 0, averageGrade: 0, topics: [], examGrades: [] },
  { name: 'Lingua Inglese', displayName: 'Lingua Inglese', professor: '', color: '#3B82F6', currentTopic: '', lastStudied: '', totalHours: 0, averageGrade: 0, topics: [], examGrades: [] },
  { name: 'Informatica', displayName: 'Informatica', professor: '', color: '#F97316', currentTopic: '', lastStudied: '', totalHours: 0, averageGrade: 0, topics: [], examGrades: [] },
  { name: 'TPSIT', displayName: 'TPSIT', professor: '', color: '#EC4899', currentTopic: '', lastStudied: '', totalHours: 0, averageGrade: 0, topics: [], examGrades: [] },
  { name: 'Gestione Progetto', displayName: 'Gestione Progetto', professor: '', color: '#EF4444', currentTopic: '', lastStudied: '', totalHours: 0, averageGrade: 0, topics: [], examGrades: [] },
  { name: 'Scienze Motorie', displayName: 'Scienze Motorie', professor: '', color: '#06B6D4', currentTopic: '', lastStudied: '', totalHours: 0, averageGrade: 0, topics: [], examGrades: [] },
  { name: 'Religione', displayName: 'Religione', professor: '', color: '#6B7280', currentTopic: '', lastStudied: '', totalHours: 0, averageGrade: 0, topics: [], examGrades: [] },
]
