CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('backlog', 'planned', 'in_progress', 'waiting', 'done');--> statement-breakpoint
CREATE TYPE "public"."task_type" AS ENUM('feature', 'maintenance', 'bug', 'research');--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"url" text NOT NULL,
	"storage_path" text DEFAULT '' NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"author_name" text NOT NULL,
	"body" text NOT NULL,
	"is_owner" boolean DEFAULT false NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"ip_hash" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthly_scopes" (
	"id" serial PRIMARY KEY NOT NULL,
	"month" date NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"task_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "status_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"from_status" "task_status",
	"to_status" "task_status" NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"scope_id" integer,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"type" "task_type" DEFAULT 'feature' NOT NULL,
	"status" "task_status" DEFAULT 'backlog' NOT NULL,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"start_date" date,
	"due_date" date,
	"completed_at" timestamp with time zone,
	"waiting_on" text DEFAULT '' NOT NULL,
	"waiting_reason" text DEFAULT '' NOT NULL,
	"research_question" text DEFAULT '' NOT NULL,
	"research_finding" text DEFAULT '' NOT NULL,
	"impact_note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"date" date NOT NULL,
	"hours" numeric(5, 2) NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_scope_id_monthly_scopes_id_fk" FOREIGN KEY ("scope_id") REFERENCES "public"."monthly_scopes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_logs" ADD CONSTRAINT "time_logs_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comments_task_idx" ON "comments" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "comments_ip_idx" ON "comments" USING btree ("ip_hash","created_at");--> statement-breakpoint
CREATE INDEX "monthly_scopes_month_idx" ON "monthly_scopes" USING btree ("month");--> statement-breakpoint
CREATE INDEX "notes_date_idx" ON "notes" USING btree ("date");--> statement-breakpoint
CREATE INDEX "status_history_task_idx" ON "status_history" USING btree ("task_id","changed_at");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_scope_idx" ON "tasks" USING btree ("scope_id");--> statement-breakpoint
CREATE INDEX "tasks_dates_idx" ON "tasks" USING btree ("start_date","due_date");--> statement-breakpoint
CREATE INDEX "time_logs_task_idx" ON "time_logs" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "time_logs_date_idx" ON "time_logs" USING btree ("date");