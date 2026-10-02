-- Transfer admin-fee bearer: source (default, original behaviour) or
-- destination. Existing rows keep "source" so all balances stay valid.
ALTER TABLE "transaction" ADD COLUMN "adminFeeBearer" TEXT NOT NULL DEFAULT 'source';
