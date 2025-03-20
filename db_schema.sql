-- Projects table
CREATE TABLE projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL DEFAULT,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criteria table
CREATE TABLE criteria (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    definition TEXT,
    weight INT2
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
);


-- Alternatives table
CREATE TABLE choices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    description TEXT,
    disqualified BOOLEAN DEFAULT FALSE,
    total_score DECIMAL(10, 2) DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Choice/Criteria scores table
CREATE TABLE scores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    criteria_id UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
    choice_id UUID NOT NULL REFERENCES choices(id) ON DELETE CASCADE,
    score INT2 NOT NULL CHECK (score BETWEEN 0 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (criteria_id, choice_id) -- Prevent duplicate scores for the same pair
);

