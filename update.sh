#!/bin/bash

set -e  # Exit on error

BASE_DIR="."
UTILS_DIR="$BASE_DIR/utils"

mkdir -p "$UTILS_DIR"

# Database Interface
cat <<EOL > "$UTILS_DIR/DatasourceInterface.js"
class DatasourceInterface {
    async signIn(email, password) { throw new Error('Method signIn() not implemented'); }
    async signOut() { throw new Error('Method signOut() not implemented'); }
    async fetchAllProjects(userId) { throw new Error('Method fetchAllProjects() not implemented'); }
    async fetchProjectById(userId, projectId) { throw new Error('Method fetchProjectById() not implemented'); }
    async fetchProjectsByIds(userId, projectIds) { throw new Error('Method fetchProjectsByIds() not implemented'); }
    async createProject(userId, projectData) { throw new Error('Method createProject() not implemented'); }
    async updateProject(userId, projectId, updates) { throw new Error('Method updateProject() not implemented'); }
    async deleteProject(userId, projectId) { throw new Error('Method deleteProject() not implemented'); }
    async fetchCriteria(userId, projectId) { throw new Error('Method fetchCriteria() not implemented'); }
    async createCriteria(userId, projectId, criteria) { throw new Error('Method createCriteria() not implemented'); }
    async fetchChoices(userId, projectId) { throw new Error('Method fetchChoices() not implemented'); }
    async createChoices(userId, projectId, choices) { throw new Error('Method createChoices() not implemented'); }
    async updateChoice(userId, choiceId, updates) { throw new Error('Method updateChoice() not implemented'); }
    async deleteChoice(userId, choiceId) { throw new Error('Method deleteChoice() not implemented'); }
    async updateScore(userId, criteriaId, choiceId, score) { throw new Error('Method updateScore() not implemented'); }
}

module.exports = DatasourceInterface;
EOL

# Supabase Implementation
cat <<EOL > "$UTILS_DIR/SupabaseDB.js"
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
EOL

# Factory
cat <<EOL > "$UTILS_DIR/dbFactory.js"
const SupabaseDB = require('./SupabaseDB');
const DatasourceInterface = require('./DatasourceInterface');

function getDatabaseInstance() {
    switch (process.env.DB_TYPE) {
        case 'supabase':
            return new SupabaseDB();
        default:
            throw new Error('Unsupported DB_TYPE');
    }
}

module.exports = { getDatabaseInstance };
EOL

# Update Tests
find "$BASE_DIR/test" -type f -name "*.test.js" -exec sed -i 's|@supabase/supabase-js|..\/utils\/DatasourceInterface|' {} +
find "$BASE_DIR/test" -type f -name "*.test.js" -exec sed -i 's|createClient|getDatabaseInstance|' {} +

echo "Refactor complete!"
