-- CreateTable
CREATE TABLE "Visitor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "country" TEXT NOT NULL,
    "visitors" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FxRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "currencyPair" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "fxRate" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Visitor_year_month_idx" ON "Visitor"("year", "month");

-- CreateIndex
CREATE INDEX "Visitor_country_idx" ON "Visitor"("country");

-- CreateIndex
CREATE UNIQUE INDEX "Visitor_year_month_country_key" ON "Visitor"("year", "month", "country");

-- CreateIndex
CREATE INDEX "FxRate_currencyPair_year_month_idx" ON "FxRate"("currencyPair", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "FxRate_currencyPair_year_month_key" ON "FxRate"("currencyPair", "year", "month");
