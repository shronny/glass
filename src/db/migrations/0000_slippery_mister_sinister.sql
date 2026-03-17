CREATE TABLE "fx_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"snapshot_id" integer NOT NULL,
	"usd_to_ils" numeric(18, 4) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "keren_hishtalmut" (
	"id" serial PRIMARY KEY NOT NULL,
	"snapshot_id" integer NOT NULL,
	"account_label" text NOT NULL,
	"balance_ils" numeric(18, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kupat_hisachon" (
	"id" serial PRIMARY KEY NOT NULL,
	"snapshot_id" integer NOT NULL,
	"provider" text NOT NULL,
	"balance_ils" numeric(18, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "liabilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"snapshot_id" integer NOT NULL,
	"label" text NOT NULL,
	"balance_ils" numeric(18, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthly_cashflow" (
	"id" serial PRIMARY KEY NOT NULL,
	"snapshot_id" integer NOT NULL,
	"income_ils" numeric(18, 2) NOT NULL,
	"expenses_ils" numeric(18, 2) NOT NULL,
	"free_cash_ils" numeric(18, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "options" (
	"id" serial PRIMARY KEY NOT NULL,
	"snapshot_id" integer NOT NULL,
	"label" text NOT NULL,
	"quantity" numeric(18, 4) NOT NULL,
	"strike_price_usd" numeric(18, 4) NOT NULL,
	"current_price_usd" numeric(18, 4) NOT NULL,
	"value_ils" numeric(18, 2) NOT NULL,
	"is_vested" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"snapshot_date" date NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "snapshots_date_unique" UNIQUE("snapshot_date")
);
--> statement-breakpoint
CREATE TABLE "stocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"snapshot_id" integer NOT NULL,
	"ticker" text NOT NULL,
	"quantity" numeric(18, 4) NOT NULL,
	"price_usd" numeric(18, 4) NOT NULL,
	"value_ils" numeric(18, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fx_rates" ADD CONSTRAINT "fx_rates_snapshot_id_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keren_hishtalmut" ADD CONSTRAINT "keren_hishtalmut_snapshot_id_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kupat_hisachon" ADD CONSTRAINT "kupat_hisachon_snapshot_id_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liabilities" ADD CONSTRAINT "liabilities_snapshot_id_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_cashflow" ADD CONSTRAINT "monthly_cashflow_snapshot_id_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "options" ADD CONSTRAINT "options_snapshot_id_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_snapshot_id_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fx_rates_snapshot_id_idx" ON "fx_rates" USING btree ("snapshot_id");--> statement-breakpoint
CREATE INDEX "keren_hishtalmut_snapshot_id_idx" ON "keren_hishtalmut" USING btree ("snapshot_id");--> statement-breakpoint
CREATE INDEX "kupat_hisachon_snapshot_id_idx" ON "kupat_hisachon" USING btree ("snapshot_id");--> statement-breakpoint
CREATE INDEX "liabilities_snapshot_id_idx" ON "liabilities" USING btree ("snapshot_id");--> statement-breakpoint
CREATE INDEX "monthly_cashflow_snapshot_id_idx" ON "monthly_cashflow" USING btree ("snapshot_id");--> statement-breakpoint
CREATE INDEX "options_snapshot_id_idx" ON "options" USING btree ("snapshot_id");--> statement-breakpoint
CREATE INDEX "stocks_snapshot_id_idx" ON "stocks" USING btree ("snapshot_id");