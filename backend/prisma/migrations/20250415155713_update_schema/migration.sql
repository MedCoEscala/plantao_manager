/*
  Warnings:

  - You are about to drop the column `gross_value` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `net_value` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `shift_id` on the `payments` table. All the data in the column will be lost.
  - The `payment_date` column on the `payments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `birth_date` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `shifts` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `plantao_id` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_shift_id_fkey";

-- DropForeignKey
ALTER TABLE "shifts" DROP CONSTRAINT "shifts_contractor_id_fkey";

-- DropForeignKey
ALTER TABLE "shifts" DROP CONSTRAINT "shifts_location_id_fkey";

-- DropForeignKey
ALTER TABLE "shifts" DROP CONSTRAINT "shifts_user_id_fkey";

-- AlterTable
ALTER TABLE "locations" ALTER COLUMN "address" DROP NOT NULL;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "gross_value",
DROP COLUMN "net_value",
DROP COLUMN "shift_id",
ADD COLUMN     "plantao_id" TEXT NOT NULL,
DROP COLUMN "payment_date",
ADD COLUMN     "payment_date" DATE;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "birth_date",
ADD COLUMN     "birth_date" DATE;

-- DropTable
DROP TABLE "shifts";

-- CreateTable
CREATE TABLE "plantoes" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "is_fixed" BOOLEAN NOT NULL DEFAULT false,
    "paymentType" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "location_id" TEXT,
    "contractor_id" TEXT,

    CONSTRAINT "plantoes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "contractors" ADD CONSTRAINT "contractors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantoes" ADD CONSTRAINT "plantoes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantoes" ADD CONSTRAINT "plantoes_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantoes" ADD CONSTRAINT "plantoes_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "contractors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_plantao_id_fkey" FOREIGN KEY ("plantao_id") REFERENCES "plantoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
