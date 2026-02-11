import { pgTable, index, varchar, boolean, jsonb, timestamp, serial, integer, doublePrecision, numeric, text, uniqueIndex, unique, uuid, foreignKey, date } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	telegramId: varchar("telegram_id", { length: 255 }).primaryKey().notNull(),
	username: varchar({ length: 255 }),
	introSeen: boolean("intro_seen").default(false),
	equippedItems: jsonb("equipped_items").default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	lastLogin: timestamp("last_login", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_users_intro_seen").using("btree", table.introSeen.asc().nullsLast().op("bool_ops")),
	index("idx_users_telegram_id").using("btree", table.telegramId.asc().nullsLast().op("text_ops")),
]);

export const playerScores = pgTable("player_scores", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	username: varchar({ length: 255 }).notNull(),
	score: integer().notNull(),
	timestamp: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_score").using("btree", table.score.desc().nullsFirst().op("int4_ops")),
	index("idx_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const duels = pgTable("duels", {
	matchId: varchar("match_id", { length: 255 }).primaryKey().notNull(),
	player1Id: varchar("player1_id", { length: 255 }).notNull(),
	player2Id: varchar("player2_id", { length: 255 }),
	player1Username: varchar("player1_username", { length: 255 }).notNull(),
	player2Username: varchar("player2_username", { length: 255 }),
	score1: integer(),
	score2: integer(),
	player1X: doublePrecision("player1_x"),
	player1Y: doublePrecision("player1_y"),
	player2X: doublePrecision("player2_x"),
	player2Y: doublePrecision("player2_y"),
	player1Alive: boolean("player1_alive").default(true),
	player2Alive: boolean("player2_alive").default(true),
	player1LastUpdate: timestamp("player1_last_update", { mode: 'string' }),
	player2LastUpdate: timestamp("player2_last_update", { mode: 'string' }),
	winner: varchar({ length: 255 }),
	status: varchar({ length: 50 }).default('pending'),
	seed: integer().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	player1FinishedAt: timestamp("player1_finished_at", { mode: 'string' }),
	player2FinishedAt: timestamp("player2_finished_at", { mode: 'string' }),
}, (table) => [
	index("idx_duels_created").using("btree", table.createdAt.desc().nullsFirst().op("timestamp_ops")),
	index("idx_duels_player1").using("btree", table.player1Id.asc().nullsLast().op("text_ops")),
	index("idx_duels_player2").using("btree", table.player2Id.asc().nullsLast().op("text_ops")),
	index("idx_duels_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

export const wallets = pgTable("wallets", {
	userId: varchar("user_id", { length: 255 }).primaryKey().notNull(),
	monkeyCoinBalance: integer("monkey_coin_balance").default(0),
	starsBalance: numeric("stars_balance", { precision: 20, scale:  8 }).default('0'),
	tonBalance: numeric("ton_balance", { precision: 20, scale:  8 }).default('0'),
	starsAddress: text("stars_address"),
	tonAddress: text("ton_address"),
	walletAddress: varchar("wallet_address", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_wallet_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const transactions = pgTable("transactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	amount: numeric({ precision: 20, scale:  8 }).notNull(),
	currency: varchar({ length: 10 }).notNull(),
	status: varchar({ length: 20 }).default('pending'),
	nonce: varchar({ length: 255 }).notNull(),
	signature: text(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	completedAt: timestamp("completed_at", { mode: 'string' }),
}, (table) => [
	index("idx_trans_created").using("btree", table.createdAt.desc().nullsFirst().op("timestamp_ops")),
	uniqueIndex("idx_trans_nonce").using("btree", table.nonce.asc().nullsLast().op("text_ops")),
	index("idx_trans_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_trans_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	unique("transactions_nonce_key").on(table.nonce),
]);

export const purchases = pgTable("purchases", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	itemId: varchar("item_id", { length: 50 }).notNull(),
	itemName: varchar("item_name", { length: 255 }).notNull(),
	price: numeric({ precision: 20, scale:  8 }).notNull(),
	currency: varchar({ length: 10 }).default('monkey'),
	status: varchar({ length: 20 }).default('active'),
	purchasedAt: timestamp("purchased_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	chargeId: text("charge_id"),
}, (table) => [
	index("idx_purchases_item").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.itemId.asc().nullsLast().op("text_ops")),
	index("idx_purchases_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const auditLog = pgTable("audit_log", {
	id: serial().primaryKey().notNull(),
	eventType: varchar("event_type", { length: 50 }).notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	itemId: varchar("item_id", { length: 50 }),
	amount: numeric({ precision: 20, scale:  8 }),
	currency: varchar({ length: 10 }),
	paymentMethod: varchar("payment_method", { length: 20 }),
	status: varchar({ length: 20 }),
	metadata: jsonb(),
	ipAddress: varchar("ip_address", { length: 45 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_audit_created").using("btree", table.createdAt.desc().nullsFirst().op("timestamp_ops")),
	index("idx_audit_event").using("btree", table.eventType.asc().nullsLast().op("text_ops")),
	index("idx_audit_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const tournaments = pgTable("tournaments", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	entryFeeTon: numeric("entry_fee_ton", { precision: 20, scale:  8 }).default('0').notNull(),
	prizePoolTon: numeric("prize_pool_ton", { precision: 20, scale:  8 }).default('0').notNull(),
	platformFeePercent: integer("platform_fee_percent").default(10).notNull(),
	status: varchar({ length: 50 }).default('upcoming').notNull(),
	startTime: timestamp("start_time", { mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { mode: 'string' }).notNull(),
	maxParticipants: integer("max_participants").default(100),
	currentParticipants: integer("current_participants").default(0),
	prizeDistribution: jsonb("prize_distribution").default({"1":50,"2":30,"3":20}).notNull(),
	autoRenewEnabled: boolean("auto_renew_enabled").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_tournaments_end_time").using("btree", table.endTime.asc().nullsLast().op("timestamp_ops")),
	index("idx_tournaments_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

export const tournamentParticipants = pgTable("tournament_participants", {
	id: serial().primaryKey().notNull(),
	tournamentId: integer("tournament_id").notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	username: varchar({ length: 255 }).notNull(),
	bestScore: integer("best_score").default(0),
	attempts: integer().default(0),
	paidEntry: boolean("paid_entry").default(false),
	autoRenew: boolean("auto_renew").default(false),
	joinedAt: timestamp("joined_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	lastAttemptAt: timestamp("last_attempt_at", { mode: 'string' }),
}, (table) => [
	index("idx_tournament_participants_score").using("btree", table.tournamentId.asc().nullsLast().op("int4_ops"), table.bestScore.desc().nullsFirst().op("int4_ops")),
	index("idx_tournament_participants_tournament").using("btree", table.tournamentId.asc().nullsLast().op("int4_ops")),
	index("idx_tournament_participants_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tournamentId],
			foreignColumns: [tournaments.id],
			name: "tournament_participants_tournament_id_fkey"
		}).onDelete("cascade"),
	unique("tournament_participants_tournament_id_user_id_key").on(table.tournamentId, table.userId),
]);

export const tournamentPrizes = pgTable("tournament_prizes", {
	id: serial().primaryKey().notNull(),
	tournamentId: integer("tournament_id").notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	username: varchar({ length: 255 }).notNull(),
	place: integer().notNull(),
	prizeTon: numeric("prize_ton", { precision: 20, scale:  8 }).notNull(),
	paid: boolean().default(false),
	paidAt: timestamp("paid_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_tournament_prizes_tournament").using("btree", table.tournamentId.asc().nullsLast().op("int4_ops")),
	index("idx_tournament_prizes_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tournamentId],
			foreignColumns: [tournaments.id],
			name: "tournament_prizes_tournament_id_fkey"
		}),
]);

export const referrals = pgTable("referrals", {
	id: serial().primaryKey().notNull(),
	referrerId: varchar("referrer_id", { length: 255 }).notNull(),
	referredId: varchar("referred_id", { length: 255 }).notNull(),
	referredUsername: varchar("referred_username", { length: 255 }),
	bonusPaid: boolean("bonus_paid").default(false),
	bonusAmount: integer("bonus_amount").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_referrals_referred").using("btree", table.referredId.asc().nullsLast().op("text_ops")),
	index("idx_referrals_referrer").using("btree", table.referrerId.asc().nullsLast().op("text_ops")),
	unique("referrals_referred_id_key").on(table.referredId),
]);

export const dailyRewards = pgTable("daily_rewards", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	dayStreak: integer("day_streak").default(1),
	lastClaimDate: date("last_claim_date").notNull(),
	totalClaimed: integer("total_claimed").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_daily_rewards_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	unique("daily_rewards_user_id_key").on(table.userId),
]);

export const userAchievements = pgTable("user_achievements", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	achievementId: varchar("achievement_id", { length: 50 }).notNull(),
	unlockedAt: timestamp("unlocked_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	claimed: boolean().default(false),
}, (table) => [
	index("idx_achievements_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	unique("user_achievements_user_id_achievement_id_key").on(table.userId, table.achievementId),
]);

export const refundedStars = pgTable("refunded_stars", {
	id: serial().primaryKey().notNull(),
	transactionId: text("transaction_id").notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	refundedAt: timestamp("refunded_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("refunded_stars_transaction_id_key").on(table.transactionId),
]);
