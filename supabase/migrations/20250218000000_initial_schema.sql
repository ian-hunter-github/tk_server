-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criteria table
CREATE TABLE criteria (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    must_have JSONB NOT NULL, -- Array of must-have criteria
    want JSONB, -- Array of want criteria with weights
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Form schemas table
CREATE TABLE form_schemas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    schema JSONB NOT NULL, -- JSON schema for form structure
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id) -- One schema per project
);

-- Alternatives table
CREATE TABLE alternatives (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    data JSONB NOT NULL, -- Alternative data following form schema
    disqualified BOOLEAN DEFAULT FALSE,
    score DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_criteria_updated_at
    BEFORE UPDATE ON criteria
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_schemas_updated_at
    BEFORE UPDATE ON form_schemas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alternatives_updated_at
    BEFORE UPDATE ON alternatives
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE alternatives ENABLE ROW LEVEL SECURITY;

-- Create policies (assuming auth.uid() is available from Supabase Auth)
CREATE POLICY "Users can view their own projects"
    ON projects FOR SELECT
    USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own projects"
    ON projects FOR DELETE
    USING (auth.uid() = created_by);

-- Policies for criteria table
CREATE POLICY "Users can view their project's criteria"
    ON criteria FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = criteria.project_id
        AND projects.created_by = auth.uid()
    ));

CREATE POLICY "Users can insert their project's criteria"
    ON criteria FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = criteria.project_id
        AND projects.created_by = auth.uid()
    ));

CREATE POLICY "Users can update their project's criteria"
    ON criteria FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = criteria.project_id
        AND projects.created_by = auth.uid()
    ));

CREATE POLICY "Users can delete their project's criteria"
    ON criteria FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = criteria.project_id
        AND projects.created_by = auth.uid()
    ));

-- Policies for form_schemas table
CREATE POLICY "Users can view their project's form schemas"
    ON form_schemas FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = form_schemas.project_id
        AND projects.created_by = auth.uid()
    ));

CREATE POLICY "Users can insert their project's form schemas"
    ON form_schemas FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = form_schemas.project_id
        AND projects.created_by = auth.uid()
    ));

CREATE POLICY "Users can update their project's form schemas"
    ON form_schemas FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = form_schemas.project_id
        AND projects.created_by = auth.uid()
    ));

CREATE POLICY "Users can delete their project's form schemas"
    ON form_schemas FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = form_schemas.project_id
        AND projects.created_by = auth.uid()
    ));

-- Policies for alternatives table
CREATE POLICY "Users can view their project's alternatives"
    ON alternatives FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = alternatives.project_id
        AND projects.created_by = auth.uid()
    ));

CREATE POLICY "Users can insert their project's alternatives"
    ON alternatives FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = alternatives.project_id
        AND projects.created_by = auth.uid()
    ));

CREATE POLICY "Users can update their project's alternatives"
    ON alternatives FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = alternatives.project_id
        AND projects.created_by = auth.uid()
    ));

CREATE POLICY "Users can delete their project's alternatives"
    ON alternatives FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = alternatives.project_id
        AND projects.created_by = auth.uid()
    ));
