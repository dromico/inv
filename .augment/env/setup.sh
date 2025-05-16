#!/bin/bash
# Setup script for Next.js project with TypeScript and Tailwind CSS

echo "Setting up development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Installing Node.js..."
    # Install Node.js using nvm (Node Version Manager)
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    
    # Install and use the latest LTS version of Node.js
    nvm install --lts
    nvm use --lts
    
    # Add nvm to .bashrc for future sessions
    echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
    echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc
    echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> ~/.bashrc
else
    echo "Node.js is already installed: $(node -v)"
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. It should have been installed with Node.js."
    exit 1
else
    echo "npm is already installed: $(npm -v)"
fi

# Clean up existing node_modules and package-lock.json to ensure a fresh start
echo "Cleaning up existing node_modules..."
rm -rf node_modules
rm -f package-lock.json

# Install dependencies with --legacy-peer-deps
echo "Installing dependencies with --legacy-peer-deps..."
npm install --legacy-peer-deps

# Create a .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    touch .env
    echo "# Environment variables" > .env
    echo "NEXT_PUBLIC_API_URL=http://localhost:3000/api" >> .env
    # Add Supabase environment variables (with placeholder values)
    echo "NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co" >> .env
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key" >> .env
fi

# Add missing utility functions to utils.ts
echo "Adding missing utility functions to src/lib/utils.ts..."
if ! grep -q "formatDate" src/lib/utils.ts; then
    cat << 'EOF' >> src/lib/utils.ts

// Format date to a readable string
export function formatDate(date: Date | string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Format currency
export function formatCurrency(amount: number): string {
  if (amount === null || amount === undefined) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
EOF
fi

echo "Setup completed successfully!"
echo "You can now run 'npm run dev' to start the development server."