import { createClient } from '@/lib/supabase/client';

async function checkDatabase() {
  const supabase = createClient();
  
  console.log('🔍 Checking Supabase connection and tables...\n');
  
  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('❌ Auth Error:', authError.message);
      return;
    }
    
    console.log('✅ Authenticated as:', user?.email);
    console.log('   User ID:', user?.id);
    console.log('\n📊 Checking tables:\n');
    
    // Check each table
    const tables = [
      'subjects',
      'topics', 
      'exams',
      'homework',
      'weekly_plans',
      'pomodoro_sessions',
      'study_stats',
      'preferences',
      'profiles'
    ];
    
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          console.error(`❌ ${table}: Error - ${error.message}`);
          if (error.message.includes('relation') && error.message.includes('does not exist')) {
            console.log(`   → Table doesn't exist. Run the schema.sql script in Supabase.`);
          }
        } else {
          console.log(`✅ ${table}: OK (${count || 0} records)`);
        }
      } catch (err) {
        console.error(`❌ ${table}: ${err}`);
      }
    }
    
    console.log('\n📝 Database Check Complete!\n');
    
    // Try to insert default subjects if none exist
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('*');
      
    if (!subjectsError && subjects && subjects.length === 0) {
      console.log('📚 No subjects found. Creating defaults...');
      
      const defaultSubjects = [
        { name: 'Matematica', display_name: 'Matematica', color: '#10B981' },
        { name: 'Italiano', display_name: 'Italiano', color: '#F59E0B' },
        { name: 'Storia', display_name: 'Storia', color: '#D97706' },
        { name: 'Sistemi e Reti', display_name: 'Sistemi e Reti', color: '#8B5CF6' },
        { name: 'Lingua Inglese', display_name: 'Lingua Inglese', color: '#3B82F6' },
        { name: 'Informatica', display_name: 'Informatica', color: '#F97316' },
        { name: 'TPSIT', display_name: 'TPSIT', color: '#EC4899' },
        { name: 'Gestione Progetto', display_name: 'Gestione Progetto', color: '#EF4444' },
        { name: 'Scienze Motorie', display_name: 'Scienze Motorie', color: '#06B6D4' },
        { name: 'Religione', display_name: 'Religione', color: '#6B7280' }
      ];
      
      for (const subject of defaultSubjects) {
        const { error } = await supabase
          .from('subjects')
          .insert({
            ...subject,
            user_id: user?.id,
            professor: '',
            current_topic: '',
            total_hours: 0,
            average_grade: 0,
            exam_grades: []
          });
          
        if (error) {
          console.error(`   ❌ Failed to create ${subject.name}:`, error.message);
        } else {
          console.log(`   ✅ Created ${subject.name}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run if this is the main module
if (require.main === module) {
  checkDatabase().then(() => process.exit(0));
}