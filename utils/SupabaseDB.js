const { createClient } = require('@supabase/supabase-js');
const DatasourceInterface = require('./DatasourceInterface');

class SupabaseDB extends DatasourceInterface {
    constructor() {
        super();
        this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    }
    
    async signIn(email, password) {
        return this.supabase.auth.signInWithPassword({ email, password });
    }
    
    async signOut() {
        return this.supabase.auth.signOut();
    }
    
    async fetchAllProjects(userId) {
        return this.supabase.from('projects').select('*').eq('created_by', userId);
    }
    
    async fetchProjectById(userId, projectId) {
        return this.supabase.from('projects').select('*').eq('created_by', userId).eq('id', projectId).single();
    }
    
    async fetchCriteria(userId, projectId) {
        return this.supabase.from('criteria').select('*').eq('project_id', projectId).eq('created_by', userId);
    }
    
    async createCriteria(userId, projectId, criteria) {
        return this.supabase.from('criteria').insert(criteria.map(c => ({ ...c, project_id: projectId, created_by: userId }))).select();
    }
    
    async fetchChoices(userId, projectId) {
        return this.supabase.from('choices').select('*').eq('project_id', projectId).eq('created_by', userId);
    }
    
    async createChoices(userId, projectId, choices) {
        return this.supabase.from('choices').insert(choices.map(c => ({ ...c, project_id: projectId, created_by: userId }))).select();
    }
    
    async updateScore(userId, criteriaId, choiceId, score) {
        return this.supabase.from('scores').upsert({ criteria_id: criteriaId, choice_id: choiceId, score, created_by: userId }, { onConflict: 'criteria_id,choice_id' }).select();
    }
}

module.exports = SupabaseDB;
