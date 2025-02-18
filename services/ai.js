const fetch = require('node-fetch');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const models = {
  anthropic: 'anthropic/claude-2',
  gpt4: 'openai/gpt-4'
};

async function generateCriteria(concept) {
  const prompt = `Given a decision about "${concept}", generate a comprehensive list of decision criteria categorized as "Must-Have" and "Want" criteria. For Want criteria, also assign importance weights from 1-10.

Format the response as a JSON object with this structure:
{
  "mustHave": [
    { "name": "string", "description": "string" }
  ],
  "want": [
    { "name": "string", "description": "string", "weight": number }
  ]
}

Make the criteria specific to ${concept} and provide clear descriptions.`;

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3002'
      },
      body: JSON.stringify({
        model: models.anthropic,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('AI service error');
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('AI Criteria Generation Error:', error);
    throw error;
  }
}

async function evaluateAlternative(alternative, criteria) {
  const prompt = `Evaluate this alternative against the given criteria:

Alternative Details:
${JSON.stringify(alternative, null, 2)}

Criteria:
${JSON.stringify(criteria, null, 2)}

For each Must-Have criterion, determine if the alternative meets it (true/false).
For each Want criterion, assign a score from 0-10 based on how well it meets the criterion.

Format the response as a JSON object with this structure:
{
  "mustHaveResults": {
    "criterionName": boolean
  },
  "wantScores": {
    "criterionName": number
  }
}`;

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3002'
      },
      body: JSON.stringify({
        model: models.anthropic,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('AI service error');
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('AI Alternative Evaluation Error:', error);
    throw error;
  }
}

async function predictScores(alternative, newCriteria, existingCriteria) {
  const prompt = `Given an alternative and its existing evaluation scores, predict scores for new criteria:

Alternative Details:
${JSON.stringify(alternative, null, 2)}

Existing Criteria and Scores:
${JSON.stringify(existingCriteria, null, 2)}

New Criteria to Evaluate:
${JSON.stringify(newCriteria, null, 2)}

For each new Must-Have criterion, predict if the alternative meets it (true/false).
For each new Want criterion, predict a score from 0-10.

Format the response as a JSON object with this structure:
{
  "mustHaveResults": {
    "criterionName": boolean
  },
  "wantScores": {
    "criterionName": number
  }
}`;

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3002'
      },
      body: JSON.stringify({
        model: models.anthropic,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('AI service error');
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('AI Score Prediction Error:', error);
    throw error;
  }
}

module.exports = {
  generateCriteria,
  evaluateAlternative,
  predictScores
};
