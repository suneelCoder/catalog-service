import config from "config";
import { Kafka, KafkaConfig, Producer } from "kafkajs";
import { MessageProducerBroker } from "../common/types/broker";
import fs from "node:fs";

export class KafkaProducerBroker implements MessageProducerBroker {
    private producer: Producer;

    constructor(clientId: string, brokers: string[]) {
        let kafkaConfig: KafkaConfig = {
            clientId,
            brokers,
        };

        if (process.env.NODE_ENV === "production") {
            kafkaConfig = {
                ...kafkaConfig,
                // ssl: config.get("kafka.ssl"),
                connectionTimeout: 45000,
                ssl: {
                    ca: [fs.readFileSync("../../kafka-certs/ca.pem", "utf-8")],
                    key: fs.readFileSync(
                        "../../kafka-certs/client.key",
                        "utf-8",
                    ),
                    cert: fs.readFileSync(
                        "../../kafka-certs/client.crt",
                        "utf-8",
                    ),
                },
                sasl: {
                    mechanism: "plain",
                    username: config.get("kafka.sasl.username"),
                    password: config.get("kafka.sasl.password"),
                },
            };
        }

        const kafka = new Kafka(kafkaConfig);
        this.producer = kafka.producer();
    }

    /**
     * Connect the producer
     */
    async connect() {
        await this.producer.connect();
    }

    /**
     * Disconnect the producer
     */
    async disconnect() {
        if (this.producer) {
            await this.producer.disconnect();
        }
    }

    /**
     *
     * @param topic - the topic to send the message to
     * @param message - The message to send
     * @throws {Error} - When the producer is not connected
     */
    async sendMessage(topic: string, message: string) {
        await this.producer.send({
            topic,
            messages: [{ value: message }],
        });
    }
}
