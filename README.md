# Genqlient POC - Go GraphQL Client

This is a Proof of Concept demonstrating how to use [genqlient](https://github.com/Khan/genqlient) - a truly type-safe Go GraphQL client.

## 🎯 What This POC Demonstrates

This project showcases a complete integration between a Go backend and a GraphQL server using genqlient, providing:

- **Type-safe GraphQL client** with compile-time validation
- **REST API wrapper** around GraphQL operations
- **Docker containerized GraphQL server** for easy setup
- **Real-world examples** of queries, mutations, and error handling

## 🏗️ Architecture

```
┌─────────────────┐    HTTP/REST    ┌─────────────────┐
│   Go Backend    │ ──────────────► │  GraphQL Server │
│   (Port 8080)   │                 │   (Port 4000)   │
│                 │                 │                 │
│ • genqlient     │                 │ • Node.js       │
│ • Gin Router    │                 │ • Apollo Server │
│ • Type-safe     │                 │ • Sample Data   │
│ • REST API      │                 │ • GraphiQL UI   │
└─────────────────┘                 └─────────────────┘
```

- **GraphQL Server**: Node.js/Express with Apollo Server running in Docker (port 4000)
- **Go Backend**: REST API using genqlient to call GraphQL server (port 8080)

## ✨ Features

- ✅ **Type-safe GraphQL queries and mutations** - No more `interface{}` or runtime panics
- ✅ **Compile-time validation** - GraphQL operations validated at build time
- ✅ **Auto-generated Go types** - No manual struct definitions needed
- ✅ **REST API wrapper** - Clean REST endpoints around GraphQL operations
- ✅ **Docker containerized GraphQL server** - Easy setup and deployment
- ✅ **CORS enabled** - Cross-origin requests supported
- ✅ **GraphiQL interface** - Interactive GraphQL playground
- ✅ **Sample data** - Pre-populated with users and posts for testing
- ✅ **Error handling** - Comprehensive error responses
- ✅ **Health checks** - Monitoring endpoints for both services

## 🚀 Quick Start

### Prerequisites

- Go 1.22+ installed
- Docker and Docker Compose installed
- Make (optional, for using Makefile commands)

### 1. Start GraphQL Server

```bash
# Start GraphQL server in Docker
make run-graphql
# OR manually:
docker-compose up -d
```

This will:
- Build and start the GraphQL server in Docker
- Make it available at http://localhost:4000/graphql
- Enable GraphiQL interface for testing at http://localhost:4000/graphql

### 2. Generate Genqlient Code

```bash
# In another terminal, generate the Go client code
make generate
# OR manually:
go run github.com/Khan/genqlient
```

This will:
- Fetch the GraphQL schema from the running server
- Generate type-safe Go code in `generated/generated.go`

### 3. Run Go Backend

```bash
# In another terminal, start the Go backend
make run-go
# OR manually:
go run main.go
```

This will:
- Start the Go REST API server on port 8080
- Use genqlient to call the GraphQL server
- Display startup messages and available endpoints

### 4. Test the Integration

```bash
# Test health endpoints
curl http://localhost:4000/health  # GraphQL server
curl http://localhost:8080/health  # Go backend

# Test API endpoints
curl http://localhost:8080/api/users
curl http://localhost:8080/api/posts
```

## 📡 API Endpoints

### Users
- `GET /api/users` - Get all users with their posts
- `GET /api/users/:id` - Get user by ID with posts
- `GET /api/users/search/:name` - Search users by name
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Posts
- `GET /api/posts` - Get all posts with author information
- `GET /api/posts/:id` - Get post by ID with author

### Health Check
- `GET /health` - Health check endpoint for Go backend
- `GET /health` (GraphQL server) - Health check for GraphQL server

### GraphQL Interface
- `GET http://localhost:4000/graphql` - GraphiQL playground for direct GraphQL queries

## 💡 Example Usage

### Get All Users
```bash
curl http://localhost:8080/api/users
```
**Response:**
```json
{
  "count": 3,
  "data": {
    "users": [
      {
        "id": "1",
        "name": "John Doe",
        "email": "john@example.com",
        "age": 30,
        "posts": [
          {"id": "1", "title": "First Post", "content": "This is the first post"},
          {"id": "3", "title": "Third Post", "content": "This is the third post"}
        ]
      }
    ]
  }
}
```

### Create a User
```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "email": "alice@example.com", "age": 28}'
```
**Response:**
```json
{
  "data": {
    "id": "4",
    "name": "Alice",
    "email": "alice@example.com",
    "age": 28
  },
  "message": "User created successfully"
}
```

### Search Users
```bash
curl http://localhost:8080/api/users/search/John
```
**Response:**
```json
{
  "count": 2,
  "data": {
    "searchUsers": [
      {"id": "1", "name": "John Doe", "email": "john@example.com", "age": 30},
      {"id": "3", "name": "Bob Johnson", "email": "bob@example.com", "age": 35}
    ]
  },
  "search_term": "John"
}
```

### Get All Posts
```bash
curl http://localhost:8080/api/posts
```
**Response:**
```json
{
  "count": 3,
  "data": {
    "posts": [
      {
        "id": "1",
        "title": "First Post",
        "content": "This is the first post",
        "authorId": "1",
        "author": {
          "id": "1",
          "name": "John Doe",
          "email": "john@example.com"
        }
      }
    ]
  }
}
```

### Update a User
```bash
curl -X PUT http://localhost:8080/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "John Updated", "email": "john.updated@example.com", "age": 31}'
```

### Delete a User
```bash
curl -X DELETE http://localhost:8080/api/users/1
```

## GraphQL Schema

The GraphQL server provides the following schema:

```graphql
type User {
  id: ID!
  name: String!
  email: String!
  age: Int!
  posts: [Post!]!
}

type Post {
  id: ID!
  title: String!
  content: String!
  authorId: ID!
  author: User!
}

type Query {
  users: [User!]!
  user(id: ID!): User
  posts: [Post!]!
  post(id: ID!): Post
  searchUsers(name: String): [User!]!
}

type Mutation {
  createUser(name: String!, email: String!, age: Int!): User!
  updateUser(id: ID!, name: String, email: String, age: Int): User
  deleteUser(id: ID!): Boolean!
}
```

## 🧪 Testing

### Automated Testing
Run the test suite to verify everything is working:

```bash
make test
```

### Manual Testing
You can also test individual components:

```bash
# Test GraphQL server health
curl http://localhost:4000/health

# Test Go backend health  
curl http://localhost:8080/health

# Test GraphQL introspection
curl -X POST -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { types { name } } }"}' \
  http://localhost:4000/graphql

# Test direct GraphQL queries via GraphiQL
# Open http://localhost:4000/graphql in your browser
```

### Sample GraphQL Queries (for GraphiQL)

```graphql
# Get all users
query {
  users {
    id
    name
    email
    age
    posts {
      id
      title
      content
    }
  }
}

# Create a new user
mutation {
  createUser(name: "Test User", email: "test@example.com", age: 25) {
    id
    name
    email
    age
  }
}

# Search users
query {
  searchUsers(name: "John") {
    id
    name
    email
    age
  }
}
```

## 📁 Project Structure

```
.
├── graphql-server/          # Node.js GraphQL server
│   ├── server.js           # GraphQL server implementation (Apollo Server)
│   ├── package.json        # Node.js dependencies
│   └── Dockerfile          # Docker configuration
├── graphql/                # GraphQL operations
│   ├── queries.graphql     # Query operations (GetUsers, GetUser, etc.)
│   └── mutations.graphql   # Mutation operations (CreateUser, UpdateUser, etc.)
├── generated/              # Generated Go code (auto-generated)
│   └── generated.go        # Type-safe GraphQL client (688 lines)
├── main.go                 # Go backend server (Gin + genqlient)
├── schema.graphql          # GraphQL schema definition
├── genqlient.yaml          # Genqlient configuration
├── docker-compose.yml      # Docker Compose configuration
├── go.mod                  # Go module dependencies
├── Makefile               # Build and run commands
└── README.md              # This file
```

### Key Files Explained

- **`graphql-server/server.js`**: Apollo Server implementation with sample data
- **`graphql/queries.graphql`**: GraphQL query definitions used by genqlient
- **`graphql/mutations.graphql`**: GraphQL mutation definitions used by genqlient
- **`generated/generated.go`**: Auto-generated type-safe Go client (DO NOT EDIT)
- **`main.go`**: Go backend with Gin router and genqlient integration
- **`genqlient.yaml`**: Configuration for genqlient code generation
- **`schema.graphql`**: Local GraphQL schema for genqlient generation

## 🎯 Key Benefits of Genqlient

1. **Type Safety**: Compile-time validation of GraphQL queries - catch errors before deployment
2. **Auto-generated Types**: No manual struct definitions - schema changes automatically update Go types
3. **Schema Validation**: Queries are validated against the actual schema - no more runtime surprises
4. **IDE Support**: Full autocomplete and type checking - better developer experience
5. **Runtime Safety**: No more `interface{}` or runtime panics - predictable behavior
6. **Performance**: Optimized generated code with minimal overhead
7. **Maintainability**: Schema-first approach keeps client and server in sync

### Comparison with Traditional GraphQL Clients

| Feature | Traditional Client | genqlient |
|---------|-------------------|-----------|
| Type Safety | Runtime only | Compile-time + Runtime |
| Code Generation | Manual structs | Auto-generated |
| Schema Validation | Runtime errors | Compile-time errors |
| IDE Support | Limited | Full autocomplete |
| Maintenance | High (manual updates) | Low (auto-generated) |
| Performance | Reflection overhead | Optimized generated code |

## 🔧 Troubleshooting

### GraphQL Server Not Starting
```bash
# Check if port 4000 is available
lsof -i :4000  # macOS/Linux
netstat -an | findstr :4000  # Windows

# Check Docker logs
docker-compose logs graphql-server

# Restart Docker container
docker-compose down && docker-compose up -d
```

### Genqlient Generation Fails
```bash
# Make sure GraphQL server is running
curl http://localhost:4000/health

# Check schema endpoint
curl -X POST -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { types { name } } }"}' \
  http://localhost:4000/graphql

# Check genqlient configuration
cat genqlient.yaml

# Regenerate with verbose output
go run github.com/Khan/genqlient -v
```

### Go Backend Connection Issues
```bash
# Check if GraphQL server is accessible
curl http://localhost:4000/graphql

# Check Go backend logs
go run main.go

# Test GraphQL connection from Go
curl -X POST -H "Content-Type: application/json" \
  -d '{"query":"{ users { id name } }"}' \
  http://localhost:4000/graphql
```

### Common Issues

1. **Port conflicts**: Make sure ports 4000 and 8080 are available
2. **Docker not running**: Ensure Docker Desktop is running
3. **Go module issues**: Run `go mod tidy` to fix dependencies
4. **Generated code out of sync**: Delete `generated/` folder and regenerate
5. **CORS issues**: Check that CORS is enabled in both servers

## 🚀 Next Steps & Extensions

### Production Readiness
- [ ] Add authentication/authorization (JWT, OAuth)
- [ ] Implement caching layer (Redis, in-memory)
- [ ] Add database persistence (PostgreSQL, MongoDB)
- [ ] Add comprehensive error handling and logging
- [ ] Implement rate limiting and request validation
- [ ] Add monitoring and metrics (Prometheus, Grafana)
- [ ] Add health checks and graceful shutdown

### Advanced Features
- [ ] Implement real-time subscriptions (WebSocket)
- [ ] Add GraphQL federation support
- [ ] Implement data loaders for N+1 query optimization
- [ ] Add GraphQL query complexity analysis
- [ ] Implement GraphQL query caching
- [ ] Add GraphQL query batching

### Development Experience
- [ ] Add unit tests and integration tests
- [ ] Add CI/CD pipeline (GitHub Actions)
- [ ] Add Docker multi-stage builds
- [ ] Add development hot-reload
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Add GraphQL schema documentation

### Performance & Scalability
- [ ] Add connection pooling
- [ ] Implement horizontal scaling
- [ ] Add load balancing
- [ ] Implement circuit breakers
- [ ] Add request tracing and distributed logging

## 📚 Additional Resources

- [genqlient Documentation](https://github.com/Khan/genqlient)
- [GraphQL Specification](https://graphql.org/learn/)
- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)
- [Gin Web Framework](https://gin-gonic.com/)
- [Docker Documentation](https://docs.docker.com/)

## 🤝 Contributing

This is a POC project, but contributions are welcome! Feel free to:
- Report issues or bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📄 License

This project is for educational and demonstration purposes. Feel free to use it as a starting point for your own projects.
