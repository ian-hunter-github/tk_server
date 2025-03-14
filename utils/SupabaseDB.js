const { createClient } = require('@supabase/supabase-js');
const DatasourceInterface = require('./DatasourceInterface');

class SupabaseDB extends DatasourceInterface {
    constructor(isTestEnvironment = false) {
        super();
        const supabaseKey = isTestEnvironment ? process.env.SUPABASE_SERVICE_ROLE_KEY : process.env.SUPABASE_ANON_KEY;
        this.supabase = createClient(process.env.SUPABASE_URL, supabaseKey);
    }

    async signIn(email, password) {
        return this.supabase.auth.signInWithPassword({ email, password });
    }
    
    async signOut() {
        return this.supabase.auth.signOut();
    }
    
    async getUser(accessToken) {
        return this.supabase.auth.getUser(accessToken);
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

    async createProject(userId, projectData) {
        console.log("[SupabaseDB] createProject called with userId:", userId, "projectData:", projectData);
        return this.supabase.from('projects').insert({ created_by: userId, title: projectData.title, description: projectData.description }).select();
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
