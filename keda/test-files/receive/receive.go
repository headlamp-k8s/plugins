package main

import (
	"flag"
	"log"
	"os"
	"time"
	amqp "github.com/rabbitmq/amqp091-go"
)

func failOnError(err error, msg string) {
	if err != nil {
		log.Fatalf("%s: %s", msg, err)
	}
}

func main() {
	batchMode := flag.Bool("batch", false, "Run in batch mode (for ScaledJob)")
	messagesToProcess := flag.Int("messages", 10, "Number of messages to process in batch mode")
	timeoutSeconds := flag.Int("timeout", 30, "Timeout in seconds for batch mode")
	flag.Parse()

	args := flag.Args()
	if len(args) < 1 {
		log.Fatalf("Usage: %s [options] <rabbitmq-url>", os.Args[0])
	}
	url := args[0]

	conn, err := amqp.Dial(url)
	failOnError(err, "Failed to connect to RabbitMQ")
	defer conn.Close()

	ch, err := conn.Channel()
	failOnError(err, "Failed to open a channel")
	defer ch.Close()

	failOnError(err, "Failed to set QoS")

	q, err := ch.QueueDeclare(
		"hello", // name
		false,   // durable
		false,   // delete when unused
		false,   // exclusive
		false,   // no-wait
		nil,     // arguments
	)
	failOnError(err, "Failed to declare a queue")

	err = ch.Qos(
		1,     // prefetch count
		0,     // prefetch size
		false, // global
	)
	failOnError(err, "Failed to set QoS")

	msgs, err := ch.Consume(
		q.Name, // queue
		"",     // consumer
		false,  // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	failOnError(err, "Failed to register a consumer")

	if *batchMode {
		processBatch(msgs, *messagesToProcess, time.Duration(*timeoutSeconds)*time.Second)
	} else {
		processContinuously(msgs)
	}
}

func processBatch(msgs <-chan amqp.Delivery, messagesToProcess int, timeout time.Duration) {
	log.Printf(" [*] Starting to process up to %d messages", messagesToProcess)
	
	timeoutChannel := time.After(timeout)
	processed := 0
	
	for processed < messagesToProcess {
		select {
		case d, ok := <-msgs:
			if !ok {
				log.Printf("Channel closed, exiting")
				return
			}
			
			log.Printf("Received a message: %s", d.Body)
			time.Sleep(1 * time.Second)
			d.Ack(false)
			processed++
			log.Printf("Processed %d/%d messages", processed, messagesToProcess)
			
		case <-timeoutChannel:
			log.Printf("Timeout reached after processing %d messages, exiting", processed)
			return
		}
	}
	
	log.Printf("Finished processing %d messages, exiting", processed)
}

func processContinuously(msgs <- chan amqp.Delivery) {
	forever := make(chan bool)

	go func() {
		for d := range msgs {
			log.Printf("Received a message: %s", d.Body)
			time.Sleep(1 * time.Second)
			d.Ack(false)
		}
	}()

	log.Printf(" [*] Waiting for messages. To exit press CTRL+C")
	<-forever
}
