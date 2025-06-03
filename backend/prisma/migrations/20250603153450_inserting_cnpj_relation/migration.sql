-- CreateTable
CREATE TABLE "cnpj_data" (
    "id" TEXT NOT NULL,
    "company_name" TEXT,
    "cnpj_number" TEXT,
    "accounting_firm_name" TEXT,
    "monthly_fee" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "cnpj_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cnpj_data_user_id_key" ON "cnpj_data"("user_id");

-- AddForeignKey
ALTER TABLE "cnpj_data" ADD CONSTRAINT "cnpj_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
