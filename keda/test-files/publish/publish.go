package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"
	"sync"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/redis/go-redis/v9"
)

func main() {
	if len(os.Args) < 3 {
		log.Fatalf("Usage: %s <rabbitmq-url> <redis-url> [rabbitmq-message-count] [redis-message-count] [rabbitmq-queue] [redis-list]", os.Args[0])
	}

	rabbitmqURL := os.Args[1]
	redisURL := os.Args[2]

	// Default to 100 messages if not specified
	rabbitMQMessageCount := 100
	redisMessageCount := 100

	// Parse RabbitMQ message count
	if len(os.Args) > 3 {
		count, err := strconv.Atoi(os.Args[3])
		if err == nil {
			rabbitMQMessageCount = count
		} else {
			log.Printf("Warning: Invalid RabbitMQ message count '%s', using default %d", os.Args[3], rabbitMQMessageCount)
		}
	}

	// Parse Redis message count
	if len(os.Args) > 4 {
		count, err := strconv.Atoi(os.Args[4])
		if err == nil {
			redisMessageCount = count
		} else {
			log.Printf("Warning: Invalid Redis message count '%s', using default %d", os.Args[4], redisMessageCount)
		}
	}

	// Default queue and list names
	rabbitmqQueueName := "hello"
	if len(os.Args) > 5 {
		rabbitmqQueueName = os.Args[5]
	}

	redisListName := "tasks"
	if len(os.Args) > 6 {
		redisListName = os.Args[6]
	}

	log.Printf("Starting publishers - RabbitMQ: %d messages to queue '%s', Redis: %d messages to list '%s'",
		rabbitMQMessageCount, rabbitmqQueueName, redisMessageCount, redisListName)

	var wg sync.WaitGroup

	// Start RabbitMQ publisher
	wg.Add(1)
	go func() {
		defer wg.Done()
		publishToRabbitMQ(rabbitmqURL, rabbitmqQueueName, rabbitMQMessageCount)
	}()

	// Start Redis publisher
	wg.Add(1)
	go func() {
		defer wg.Done()
		publishToRedis(redisURL, redisListName, redisMessageCount)
	}()

	// Wait for both publishers to complete
	wg.Wait()
	log.Printf(
		"Successfully published total %d messages to both RabbitMQ with %d messages and Redis with %d messages",
		rabbitMQMessageCount+redisMessageCount,
		rabbitMQMessageCount,
		redisMessageCount,
	)
}

func publishToRabbitMQ(url, queueName string, messageCount int) {
	conn, err := amqp.Dial(url)
	if err != nil {
		log.Printf("Failed to connect to RabbitMQ: %s", err)
		return
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		log.Printf("Failed to open a channel: %s", err)
		return
	}
	defer ch.Close()

	q, err := ch.QueueDeclare(
		queueName, // name
		false,     // durable
		false,     // delete when unused
		false,     // exclusive
		false,     // no-wait
		nil,       // arguments
	)
	if err != nil {
		log.Printf("Failed to declare a queue: %s", err)
		return
	}

	for i := 0; i < messageCount; i++ {
		body := fmt.Sprintf("RabbitMQ Message %d at %s", i, time.Now().Format(time.RFC3339))
		err = ch.Publish(
			"",     // exchange
			q.Name, // routing key
			false,  // mandatory
			false,  // immediate
			amqp.Publishing{
				ContentType: "text/plain",
				Body:        []byte(body),
			})

		if err != nil {
			log.Printf("Failed to publish message to RabbitMQ: %s", err)
			continue
		}

		log.Printf("Published to RabbitMQ: %s", body)
	}

	log.Printf("Completed publishing %d messages to RabbitMQ queue '%s'", messageCount, queueName)
}

func publishToRedis(url, listName string, messageCount int) {
	ctx := context.Background()

	// Parse Redis URL and create client
	opts, err := redis.ParseURL(url)
	if err != nil {
		log.Printf("Failed to parse Redis URL: %s", err)
		return
	}

	client := redis.NewClient(opts)
	defer client.Close()

	// Verify connection
	_, err = client.Ping(ctx).Result()
	if err != nil {
		log.Printf("Failed to connect to Redis: %s", err)
		return
	}

	// Publish messages
	for i := 0; i < messageCount; i++ {
		message := fmt.Sprintf("Redis Task %d at %s", i, time.Now().Format(time.RFC3339))

		err = client.RPush(ctx, listName, message).Err()
		if err != nil {
			log.Printf("Failed to push message to Redis list: %s", err)
			continue
		}

		log.Printf("Published to Redis: %s", message)
	}

	log.Printf("Completed publishing %d messages to Redis list '%s'", messageCount, listName)
}
