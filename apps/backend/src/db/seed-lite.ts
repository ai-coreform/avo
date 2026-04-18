import { hashPassword } from "better-auth/crypto";
import { drizzle } from "drizzle-orm/bun-sql";
import { account } from "./schema/auth/account";
import { member } from "./schema/auth/member";
import { user } from "./schema/auth/user";
import { venue } from "./schema/auth/venue";
import { catalogItem } from "./schema/catalog-item";
import { menu } from "./schema/menu";
import { menuCategory } from "./schema/menu-category";
import { menuEntry } from "./schema/menu-entry";
import { menuTab } from "./schema/menu-tab";
import { venueLocale } from "./schema/venue-locale";

// ── Minimal menu data ───────────────────────────────────────
const TABS = [
  {
    label: "Antipasti",
    slug: "antipasti",
    categories: [
      {
        slug: "antipasti-misti",
        title: "Antipasti Misti",
        rows: [
          {
            kind: "entry" as const,
            slug: "bruschette",
            title: "Bruschette della Casa",
            description: "Pane tostato, pomodoro fresco, basilico, olio EVO",
            priceCents: 600,
            allergens: ["gluten"] as string[],
          },
        ],
      },
    ],
  },
  {
    label: "Primi",
    slug: "primi",
    categories: [
      {
        slug: "pasta",
        title: "Pasta",
        rows: [
          {
            kind: "entry" as const,
            slug: "carbonara",
            title: "Carbonara",
            description:
              "Rigatoni, guanciale croccante, pecorino romano DOP, tuorlo d'uovo",
            priceCents: 1300,
            allergens: ["gluten", "egg", "milk"] as string[],
          },
          {
            kind: "entry" as const,
            slug: "cacio-e-pepe",
            title: "Cacio e Pepe",
            description:
              "Tonnarelli freschi, pecorino romano, pepe nero macinato al momento",
            priceCents: 1200,
            allergens: ["gluten", "milk"] as string[],
          },
        ],
      },
    ],
  },
  {
    label: "Bevande",
    slug: "bevande",
    categories: [
      {
        slug: "bibite",
        title: "Bibite",
        rows: [
          {
            kind: "entry" as const,
            slug: "acqua-naturale",
            title: "Acqua Naturale",
            description: "75cl",
            priceCents: 250,
            allergens: [] as string[],
          },
        ],
      },
    ],
  },
];

// ── Seed ────────────────────────────────────────────────────
async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const db = drizzle(connectionString);
  const now = new Date();

  console.info("🌱 Seeding lite database…");

  // ── 1. User ──────────────────────────────────────────────
  const [seedUser] = await db
    .insert(user)
    .values({
      name: "Demo User",
      email: "demo@avo.test",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  await db.insert(account).values({
    userId: seedUser.id,
    accountId: seedUser.id,
    providerId: "credential",
    password: await hashPassword("password123"),
    createdAt: now,
    updatedAt: now,
  });

  // ── 2. Venue ─────────────────────────────────────────────
  const [seedVenue] = await db
    .insert(venue)
    .values({
      name: "Elisir Bar Pizzeria",
      slug: "elisir-bar-pizzeria",
      defaultLocale: "it",
      sourceLocale: "it",
    })
    .returning();

  await db.insert(venueLocale).values({
    venueId: seedVenue.id,
    locale: "it",
    isEnabled: true,
    sortOrder: 0,
  });

  // ── 3. Member ────────────────────────────────────────────
  await db.insert(member).values({
    venueId: seedVenue.id,
    userId: seedUser.id,
    role: "owner",
    createdAt: now,
  });

  // ── 4. Menu ──────────────────────────────────────────────
  const [seedMenu] = await db
    .insert(menu)
    .values({
      venueId: seedVenue.id,
      name: "Menu One",
      slug: "menu-one",
      status: "published",
      publishedAt: now,
    })
    .returning();

  const menuId = seedMenu.id;
  const venueId = seedVenue.id;

  // ── 5. Tabs, Categories, Items ───────────────────────────
  let totalItems = 0;

  for (const [tabIndex, tabDef] of TABS.entries()) {
    const [tab] = await db
      .insert(menuTab)
      .values({
        menuId,
        label: tabDef.label,
        slug: tabDef.slug,
        sortOrder: tabIndex,
      })
      .returning();

    for (const [catIndex, catDef] of tabDef.categories.entries()) {
      const [cat] = await db
        .insert(menuCategory)
        .values({
          menuId,
          tabId: tab.id,
          slug: catDef.slug,
          title: catDef.title,
          sortOrder: catIndex,
        })
        .returning();

      for (const [rowIndex, row] of catDef.rows.entries()) {
        const [item] = await db
          .insert(catalogItem)
          .values({
            venueId,
            slug: row.slug,
            title: row.title,
            description: row.description ?? null,
            priceCents: row.priceCents,
            priceLabel: null,
            allergens:
              (row.allergens as typeof catalogItem.$inferInsert.allergens) ??
              [],
            features: [],
            additives: [],
          })
          .returning();

        await db.insert(menuEntry).values({
          menuId,
          categoryId: cat.id,
          kind: "entry",
          catalogItemId: item.id,
          sortOrder: rowIndex,
        });

        totalItems++;
      }
    }
  }

  console.info("✅ Seed lite complete!");
  console.info(`   Venue:      ${seedVenue.name} (${seedVenue.slug})`);
  console.info(`   Menu:       ${seedMenu.name} (${seedMenu.slug})`);
  console.info(`   Tabs:       ${TABS.length}`);
  console.info(`   Items:      ${totalItems}`);
  console.info(`   User:       ${seedUser.email} / password123`);

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed");
  console.error(err);
  process.exit(1);
});
