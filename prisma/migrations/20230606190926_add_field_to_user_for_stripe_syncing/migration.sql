-- AlterTable
ALTER TABLE "users" ADD COLUMN     "subscriptionCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
