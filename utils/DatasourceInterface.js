class DatasourceInterface {
    async signIn(email, password) { throw new Error('Method signIn() not implemented'); }
    async signOut() { throw new Error('Method signOut() not implemented'); }
    async getUser(accessToken) { throw new Error('Method getUser() not implemented'); }
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
