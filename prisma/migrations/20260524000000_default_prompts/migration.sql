-- CreateTable
CREATE TABLE "default_prompts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "default_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "default_prompts_name_key" ON "default_prompts"("name");

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "defaultPromptId" TEXT;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_defaultPromptId_fkey" FOREIGN KEY ("defaultPromptId") REFERENCES "default_prompts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
