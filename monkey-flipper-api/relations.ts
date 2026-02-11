import { relations } from "drizzle-orm/relations";
import { tournaments, tournamentParticipants, tournamentPrizes } from "./schema";

export const tournamentParticipantsRelations = relations(tournamentParticipants, ({one}) => ({
	tournament: one(tournaments, {
		fields: [tournamentParticipants.tournamentId],
		references: [tournaments.id]
	}),
}));

export const tournamentsRelations = relations(tournaments, ({many}) => ({
	tournamentParticipants: many(tournamentParticipants),
	tournamentPrizes: many(tournamentPrizes),
}));

export const tournamentPrizesRelations = relations(tournamentPrizes, ({one}) => ({
	tournament: one(tournaments, {
		fields: [tournamentPrizes.tournamentId],
		references: [tournaments.id]
	}),
}));