#!/bin/bash

# Define directories and files
FUNCTIONS_DIR="netlify/functions"
HELLO_FUNCTION="$FUNCTIONS_DIR/hello.js"
NETLIFY_CONFIG="netlify.toml"

# Ensure the functions directory exists
mkdir -p "$FUNCTIONS_DIR"

# Write the serverless function
cat <<EOF > "$HELLO_FUNCTION"
exports.handler = async () => {
  return {
    statusCode: 200,
    body: "Hello"
  };
};
EOF

# Write the Netlify configuration file
cat <<EOF > "$NETLIFY_CONFIG"
[build]
  functions = "netlify/functions"
EOF

# Output instructions
echo "✅ Netlify function 'hello' created!"
echo "Run locally: netlify dev"
echo "Deploy: netlify deploy --prod"

