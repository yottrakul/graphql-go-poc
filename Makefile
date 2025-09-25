.PHONY: help install generate run-graphql run-go test clean

# Default target
help:
	@echo "Available commands:"
	@echo "  install      - Install Go dependencies"
	@echo "  generate     - Generate genqlient code from GraphQL schema"
	@echo "  run-graphql  - Start GraphQL server in Docker"
	@echo "  run-go       - Run Go backend server"
	@echo "  test         - Test the integration"
	@echo "  clean        - Clean generated files"

# Install dependencies
install:
	@echo "📦 Installing Go dependencies..."
	go mod tidy
	go mod download

# Fetch schema from GraphQL server using npx
fetch-schema:
	@echo "🔍 Fetching schema from GraphQL server..."
	@echo "Make sure GraphQL server is running on http://localhost:4000/graphql"
	npx get-graphql-schema http://localhost:4000/graphql > schema.graphql
	@echo "✅ Schema saved to schema.graphql"

# Alternative: Fetch schema using custom Node.js script
fetch-schema-custom:
	@echo "🔍 Fetching schema from GraphQL server (custom script)..."
	@echo "Make sure GraphQL server is running on http://localhost:4000/graphql"
	node fetch-schema.js http://localhost:4000/graphql

# Generate genqlient code
generate:
	@echo "🔧 Generating genqlient code..."
	@echo "Make sure GraphQL server is running on http://localhost:4000/graphql"
	go run github.com/Khan/genqlient

# Fetch schema and generate code in one command
generate-from-server: fetch-schema generate
	@echo "✅ Schema fetched and code generated successfully!"

# Start GraphQL server in Docker
run-graphql:
	@echo "🐳 Starting GraphQL server in Docker..."
	docker-compose up --build

# Run Go backend server
run-go:
	@echo "🚀 Starting Go backend server..."
	go run main.go

# Test the integration
test:
	@echo "🧪 Testing the integration..."
	@echo "Testing GraphQL server health..."
	curl -f http://localhost:4000/health || echo "❌ GraphQL server not responding"
	@echo ""
	@echo "Testing Go backend health..."
	curl -f http://localhost:8080/health || echo "❌ Go backend not responding"
	@echo ""
	@echo "Testing API endpoints..."
	curl -s http://localhost:8080/api/users | jq . || echo "❌ Users endpoint failed"
	@echo ""
	curl -s http://localhost:8080/api/posts | jq . || echo "❌ Posts endpoint failed"

# Clean generated files
clean:
	@echo "🧹 Cleaning generated files..."
	rm -rf generated/
	go clean

# Full setup and run
setup: install run-graphql
	@echo "⏳ Waiting for GraphQL server to be ready..."
	sleep 10
	@echo "🔧 Generating genqlient code..."
	go run github.com/Khan/genqlient
	@echo "✅ Setup complete! Now run 'make run-go' in another terminal"
