DROP
EXTENSION IF EXISTS "uuid-ossp";
CREATE
EXTENSION "uuid-ossp";

-- CreateTable
CREATE TABLE "users"
(
    "id"          uuid                     NOT NULL DEFAULT uuid_generate_v4(),
    "email"       VARCHAR                  NOT NULL,
    "auth_id"     VARCHAR                  NOT NULL,
    "avatar"      VARCHAR,
    "first_name"  VARCHAR,
    "last_name"   VARCHAR,
    "is_active"   BOOLEAN                  NOT NULL DEFAULT true,
    "is_delete"   BOOLEAN                  NOT NULL DEFAULT false,
    "super_admin" BOOLEAN                  NOT NULL DEFAULT false,
    "admin"       BOOLEAN                  NOT NULL DEFAULT false,
    "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at"  timestamp with time zone NOT NULL DEFAULT now(),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_email" ON "users" ("email");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_id" ON "users" ("auth_id");

INSERT INTO "users" ("auth_id", "email", "admin", "super_admin")
VALUES ('8ff287f8-f26f-49e7-b0ba-c13df26fef5f', 'super@admin.com', true, true);