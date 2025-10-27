import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { MeterProvider } from "@opentelemetry/sdk-metrics";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { config } from "../config";
import { logger } from "../utils/logger";

let sdk: NodeSDK | undefined;

export async function initObservability(): Promise<void> {
  if (sdk) {
    return;
  }

  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: config.observabilityServiceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: "1.0.0",
  });

  sdk = new NodeSDK({
    resource,
    metricReader: new PrometheusExporter({ port: config.metricsPort }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  await sdk.start();
  logger.info({ port: config.metricsPort }, "Observability initialized");
}

export async function shutdownObservability(): Promise<void> {
  if (!sdk) {
    return;
  }

  await sdk.shutdown();
  logger.info("Observability shutdown complete");
}

