const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const cors = require('cors');

// Sample data
const users = [
  { id: '1', name: 'John Doe', email: 'john@example.com', age: 30 },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', age: 25 },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', age: 35 }
];

const posts = [
  { id: '1', title: 'First Post', content: 'This is the first post', authorId: '1' },
  { id: '2', title: 'Second Post', content: 'This is the second post', authorId: '2' },
  { id: '3', title: 'Third Post', content: 'This is the third post', authorId: '1' }
];

// GraphQL Schema
const typeDefs = gql`
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
`;

// Resolvers
const resolvers = {
  Query: {
    users: () => users,
    user: (_, { id }) => users.find(user => user.id === id),
    posts: () => posts,
    post: (_, { id }) => posts.find(post => post.id === id),
    searchUsers: (_, { name }) => {
      if (!name) return users;
      return users.filter(user => 
        user.name.toLowerCase().includes(name.toLowerCase())
      );
    }
  },
  Mutation: {
    createUser: (_, { name, email, age }) => {
      const newUser = {
        id: String(users.length + 1),
        name,
        email,
        age
      };
      users.push(newUser);
      return newUser;
    },
    updateUser: (_, { id, name, email, age }) => {
      const userIndex = users.findIndex(user => user.id === id);
      if (userIndex === -1) return null;
      
      if (name !== undefined) users[userIndex].name = name;
      if (email !== undefined) users[userIndex].email = email;
      if (age !== undefined) users[userIndex].age = age;
      
      return users[userIndex];
    },
    deleteUser: (_, { id }) => {
      const userIndex = users.findIndex(user => user.id === id);
      if (userIndex === -1) return false;
      
      users.splice(userIndex, 1);
      return true;
    }
  },
  User: {
    posts: (user) => posts.filter(post => post.authorId === user.id)
  },
  Post: {
    author: (post) => users.find(user => user.id === post.authorId)
  }
};

async function startServer() {
  const app = express();
  
  // Enable CORS
  app.use(cors());

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'GraphQL server is running' });
  });

  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    playground: true
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  const PORT = process.env.PORT || 4000;
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GraphQL server running on http://localhost:${PORT}/graphql`);
    console.log(`GraphQL Playground available at http://localhost:${PORT}/graphql`);
  });
}

startServer().catch(error => {
  console.error('Error starting server:', error);
  process.exit(1);
});