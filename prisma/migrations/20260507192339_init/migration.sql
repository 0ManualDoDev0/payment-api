-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('PIX', 'CREDIT_CARD', 'BOLETO', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'APPROVED', 'REJECTED', 'CANCELLED', 'REFUNDED', 'FAILED', 'CHARGED_BACK');

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "external_id" TEXT,
    "type" "PaymentType" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "customer_id" TEXT,
    "customer_email" TEXT,
    "customer_name" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "pix_qr_code" TEXT,
    "pix_qr_code_base64" TEXT,
    "pix_expires_at" TIMESTAMP(3),
    "boleto_url" TEXT,
    "boleto_barcode" TEXT,
    "boleto_expires_at" TIMESTAMP(3),
    "subscription_id" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "action" TEXT,
    "resource_id" TEXT,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_external_id_key" ON "payments"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_event_id_key" ON "webhook_events"("event_id");
