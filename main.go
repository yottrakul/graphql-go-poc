package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"genqlient-poc/generated"

	"github.com/Khan/genqlient/graphql"
	"github.com/gin-gonic/gin"
)

// GraphQL client
var client graphql.Client

func main() {
	// Initialize GraphQL client
	httpClient := &http.Client{}
	client = graphql.NewClient("http://localhost:4000/graphql", httpClient)

	// Initialize Gin router
	r := gin.Default()

	// Add CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "OK",
			"message": "Go backend with genqlient is running",
		})
	})

	// GraphQL proxy endpoints
	api := r.Group("/api")
	{
		// Get all users
		api.GET("/users", getUsers)

		// Get user by ID
		api.GET("/users/:id", getUserByID)

		// Search users by name
		api.GET("/users/search/:name", searchUsers)

		// Get all posts
		api.GET("/posts", getPosts)

		// Get post by ID
		api.GET("/posts/:id", getPostByID)

		// Create user
		api.POST("/users", createUser)

		// Update user
		api.PUT("/users/:id", updateUser)

		// Delete user
		api.DELETE("/users/:id", deleteUser)
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("🚀 Go backend server starting on port %s\n", port)
	fmt.Println("📡 GraphQL server should be running on http://localhost:4000/graphql")
	fmt.Println("🔗 GraphiQL interface: http://localhost:4000/graphql")

	log.Fatal(r.Run(":" + port))
}

// Handler functions using genqlient

func getUsers(c *gin.Context) {
	ctx := context.Background()

	users, err := generated.GetUsers(ctx, client)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to fetch users: %v", err),
		})
		return
	}

	fmt.Println(users.Users[0].Age)

	c.JSON(http.StatusOK, gin.H{
		"data":  users,
		"count": len(users.GetUsers()),
	})
}

func getUserByID(c *gin.Context) {
	id := c.Param("id")
	ctx := context.Background()

	user, err := generated.GetUser(ctx, client, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to fetch user: %v", err),
		})
		return
	}

	// Check if user exists by checking if the response has data
	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": user.GetUser(),
	})
}

func searchUsers(c *gin.Context) {
	name := c.Param("name")
	ctx := context.Background()

	users, err := generated.SearchUsers(ctx, client, name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to search users: %v", err),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        users,
		"count":       len(users.GetSearchUsers()),
		"search_term": name,
	})
}

func getPosts(c *gin.Context) {
	ctx := context.Background()

	posts, err := generated.GetPosts(ctx, client)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to fetch posts: %v", err),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  posts,
		"count": len(posts.GetPosts()),
	})
}

func getPostByID(c *gin.Context) {
	id := c.Param("id")
	ctx := context.Background()

	post, err := generated.GetPost(ctx, client, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to fetch post: %v", err),
		})
		return
	}

	if post == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Post not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": post.GetPost(),
	})
}

func createUser(c *gin.Context) {
	var req struct {
		Name  string `json:"name" binding:"required"`
		Email string `json:"email" binding:"required"`
		Age   int    `json:"age" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("Invalid request: %v", err),
		})
		return
	}

	ctx := context.Background()

	user, err := generated.CreateUser(ctx, client, req.Name, req.Email, req.Age)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to create user: %v", err),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data":    user.GetCreateUser(),
		"message": "User created successfully",
	})
}

func updateUser(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Name  string `json:"name"`
		Email string `json:"email"`
		Age   int    `json:"age"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("Invalid request: %v", err),
		})
		return
	}

	ctx := context.Background()

	user, err := generated.UpdateUser(ctx, client, id, req.Name, req.Email, req.Age)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to update user: %v", err),
		})
		return
	}

	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    user.GetUpdateUser(),
		"message": "User updated successfully",
	})
}

func deleteUser(c *gin.Context) {
	id := c.Param("id")
	ctx := context.Background()

	result, err := generated.DeleteUser(ctx, client, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to delete user: %v", err),
		})
		return
	}

	if !result.DeleteUser {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User deleted successfully",
		"deleted": result.GetDeleteUser(),
	})
}
