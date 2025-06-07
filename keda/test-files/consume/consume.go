package main

import (
	"context"
	"flag"
	"log"
	"os"
	"sync"
	"sync/atomic"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/redis/go-redis/v9"
)

func main() {
	batchMode := flag.Bool("batch", false, "Run in batch mode (for ScaledJob)")
	messagesToConsume := flag.Int("messages", 10, "Number of messages to consume in batch mode")
	timeoutSeconds := flag.Int("timeout", 60, "Timeout in seconds for batch mode")
	redisListName := flag.String("redis-list", "tasks", "Redis list name")
	rabbitmqQueueName := flag.String("rabbitmq-queue", "hello", "RabbitMQ queue name")
	flag.Parse()

	args := flag.Args()
	if len(args) < 2 {
		log.Fatalf("Usage: %s [options] <rabbitmq-url> <redis-url>", os.Args[0])
	}

	rabbitmqURL := args[0]
	redisURL := args[1]

	// Consume based on mode
	if *batchMode {
		consumeBatch(rabbitmqURL, redisURL, *rabbitmqQueueName, *redisListName, *messagesToConsume, time.Duration(*timeoutSeconds)*time.Second)
	} else {
		consumeContinuously(rabbitmqURL, redisURL, *rabbitmqQueueName, *redisListName)
	}
}

func consumeBatch(rabbitmqURL, redisURL, rabbitmqQueueName, redisListName string, messagesToConsume int, timeout time.Duration) {
	log.Printf(" [*] Starting batch consuming: target %d messages, timeout %v", messagesToConsume, timeout)

	// Context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	// Shared counter for all consumed messages
	var totalConsumed int64
	target := int64(messagesToConsume)

	// Use a buffered channel to collect consumed messages
	resultChan := make(chan ConsumeResult, messagesToConsume*2)

	var wg sync.WaitGroup

	// Start RabbitMQ consumer
	wg.Add(1)
	go func() {
		defer wg.Done()
		consumeRabbitMQBatch(ctx, rabbitmqURL, rabbitmqQueueName, resultChan, &totalConsumed, target)
	}()

	// Start Redis consumer
	wg.Add(1)
	go func() {
		defer wg.Done()
		consumeRedisBatch(ctx, redisURL, redisListName, resultChan, &totalConsumed, target)
	}()

	// Result collector goroutine
	wg.Add(1)
	go func() {
		defer wg.Done()
		collectResults(ctx, resultChan, &totalConsumed, target, cancel)
	}()

	// Wait for completion
	wg.Wait()
	close(resultChan)

	finalCount := atomic.LoadInt64(&totalConsumed)
	log.Printf("Batch consuming completed: %d messages consumed", finalCount)
}

type ConsumeResult struct {
	Source  string
	Success bool
	Message string
}

func collectResults(ctx context.Context, resultChan <-chan ConsumeResult, totalConsumed *int64, target int64, cancel context.CancelFunc) {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case result, ok := <-resultChan:
			if !ok {
				return
			}
			if result.Success {
				current := atomic.AddInt64(totalConsumed, 1)
				log.Printf("Consumed message from %s: %s [%d/%d]", result.Source, result.Message, current, target)

				if current >= target {
					log.Printf("Target reached (%d/%d), initiating shutdown", current, target)
					cancel()
					return
				}
			}
		case <-ticker.C:
			current := atomic.LoadInt64(totalConsumed)
			log.Printf("Progress update: %d/%d messages consumed", current, target)
		}
	}
}

func consumeRabbitMQBatch(ctx context.Context, url, queueName string, resultChan chan<- ConsumeResult, totalConsumed *int64, target int64) {
	conn, err := amqp.Dial(url)
	if err != nil {
		log.Printf("Failed to connect to RabbitMQ: %s", err)
		return
	}
	defer func() {
		if conn != nil && !conn.IsClosed() {
			conn.Close()
		}
	}()

	ch, err := conn.Channel()
	if err != nil {
		log.Printf("Failed to open RabbitMQ channel: %s", err)
		return
	}
	defer func() {
		if ch != nil {
			ch.Close()
		}
	}()

	q, err := ch.QueueDeclare(queueName, false, false, false, false, nil)
	if err != nil {
		log.Printf("Failed to declare RabbitMQ queue: %s", err)
		return
	}

	err = ch.Qos(1, 0, false)
	if err != nil {
		log.Printf("Failed to set RabbitMQ QoS: %s", err)
		return
	}

	log.Printf("RabbitMQ consumer started for queue: %s", queueName)

	// Consume messages in a loop with context checking
	for {
		select {
		case <-ctx.Done():
			log.Printf("RabbitMQ consumer shutting down")
			return
		default:
			// Check if we've reached the target
			if atomic.LoadInt64(totalConsumed) >= target {
				log.Printf("RabbitMQ consumer: target reached, stopping")
				return
			}

			// Try to get a message with immediate return (non-blocking)
			delivery, ok, err := ch.Get(q.Name, false)
			if err != nil {
				log.Printf("Error getting message from RabbitMQ: %s", err)
				time.Sleep(1 * time.Second)
				continue
			}

			if !ok {
				// No messages available, wait a bit and check again
				time.Sleep(500 * time.Millisecond)
				continue
			}

			// Double-check target before consuming
			if atomic.LoadInt64(totalConsumed) >= target {
				log.Printf("RabbitMQ: Target reached, requeueing message")
				delivery.Nack(false, true) // Requeue the message
				return
			}

			// Consume the message
			messageBody := string(delivery.Body)
			log.Printf("Consuming RabbitMQ message: %s", messageBody)

			// Simulate consuming time
			time.Sleep(1 * time.Second)

			// Acknowledge the message
			if err := delivery.Ack(false); err != nil {
				log.Printf("Failed to ack RabbitMQ message: %s", err)
				continue
			}

			// Send result
			select {
			case resultChan <- ConsumeResult{Source: "RabbitMQ", Success: true, Message: messageBody}:
			case <-ctx.Done():
				return
			}
		}
	}
}

func consumeRedisBatch(ctx context.Context, url, listName string, resultChan chan<- ConsumeResult, totalConsumed *int64, target int64) {
	opts, err := redis.ParseURL(url)
	if err != nil {
		log.Printf("Failed to parse Redis URL: %s", err)
		return
	}

	client := redis.NewClient(opts)
	defer client.Close()

	if err := client.Ping(ctx).Err(); err != nil {
		log.Printf("Failed to connect to Redis: %s", err)
		return
	}

	log.Printf("Redis consumer started for list: %s", listName)

	for {
		select {
		case <-ctx.Done():
			log.Printf("Redis consumer shutting down")
			return
		default:
			// Check if we've reached the target
			if atomic.LoadInt64(totalConsumed) >= target {
				log.Printf("Redis consumer: target reached, stopping")
				return
			}

			// Try to get a message with a short timeout
			result, err := client.BLPop(ctx, 1*time.Second, listName).Result()
			if err == redis.Nil {
				// No messages available, continue
				continue
			} else if err != nil {
				if ctx.Err() != nil {
					return
				}
				log.Printf("Error getting message from Redis: %s", err)
				time.Sleep(1 * time.Second)
				continue
			}

			// Double-check target before consuming
			if atomic.LoadInt64(totalConsumed) >= target {
				log.Printf("Redis: Target reached, pushing message back")
				// Push the message back to the front of the list
				client.LPush(ctx, listName, result[1])
				return
			}

			// Consume the message
			message := result[1]
			log.Printf("Consuming Redis message: %s", message)

			// Simulate consuming time
			time.Sleep(1 * time.Second)

			// Send result
			select {
			case resultChan <- ConsumeResult{Source: "Redis", Success: true, Message: message}:
			case <-ctx.Done():
				return
			}
		}
	}
}

func consumeContinuously(rabbitmqURL, redisURL, rabbitmqQueueName, redisListName string) {
	log.Printf(" [*] Starting continuous consuming mode")
	var wg sync.WaitGroup

	// Start RabbitMQ consumer
	wg.Add(1)
	go func() {
		defer wg.Done()
		consumeRabbitMQContinuously(rabbitmqURL, rabbitmqQueueName)
	}()

	// Start Redis consumer
	wg.Add(1)
	go func() {
		defer wg.Done()
		consumeRedisContinuously(redisURL, redisListName)
	}()

	log.Printf(" [*] Waiting for messages. To exit press CTRL+C")
	wg.Wait()
}

func consumeRabbitMQContinuously(url, queueName string) {
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

	q, err := ch.QueueDeclare(queueName, false, false, false, false, nil)
	if err != nil {
		log.Printf("Failed to declare a queue: %s", err)
		return
	}

	err = ch.Qos(1, 0, false)
	if err != nil {
		log.Printf("Failed to set QoS: %s", err)
		return
	}

	msgs, err := ch.Consume(q.Name, "", false, false, false, false, nil)
	if err != nil {
		log.Printf("Failed to register a consumer: %s", err)
		return
	}

	forever := make(chan bool)

	go func() {
		for d := range msgs {
			log.Printf("Received from RabbitMQ: %s", d.Body)
			time.Sleep(1 * time.Second)
			d.Ack(false)
		}
	}()

	<-forever
}

func consumeRedisContinuously(url, listName string) {
	ctx := context.Background()

	opts, err := redis.ParseURL(url)
	if err != nil {
		log.Printf("Failed to parse Redis URL: %s", err)
		return
	}

	client := redis.NewClient(opts)
	defer client.Close()

	if err := client.Ping(ctx).Err(); err != nil {
		log.Printf("Failed to connect to Redis: %s", err)
		return
	}

	log.Printf("Successfully connected to Redis, waiting for messages on list: %s", listName)

	for {
		results, err := client.BLPop(ctx, 0, listName).Result()
		if err != nil {
			log.Printf("Error in Redis BLPOP: %s", err)
			time.Sleep(1 * time.Second)
			continue
		}

		if len(results) >= 2 {
			message := results[1]
			log.Printf("Received from Redis: %s", message)
			time.Sleep(1 * time.Second)
		}
	}
}
