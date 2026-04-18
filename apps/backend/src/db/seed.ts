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

// ── Row types ────────────────────────────────────────────────
interface EntryRow {
  kind: "entry";
  slug: string;
  title: string;
  description?: string;
  priceCents: number;
  priceLabel?: string;
  allergens?: string[];
  features?: string[];
  additives?: string[];
}

interface GroupRow {
  kind: "group";
  title: string;
}

type Row = EntryRow | GroupRow;

interface CategoryDef {
  slug: string;
  title: string;
  rows: Row[];
}

interface TabDef {
  label: string;
  slug: string;
  categories: CategoryDef[];
}

// ── Helper ───────────────────────────────────────────────────
function e(
  slug: string,
  title: string,
  priceCents: number,
  opts?: Partial<Omit<EntryRow, "kind" | "slug" | "title" | "priceCents">>
): EntryRow {
  return { kind: "entry", slug, title, priceCents, ...opts };
}

function g(title: string): GroupRow {
  return { kind: "group", title };
}

// ── Menu data ────────────────────────────────────────────────
const TABS: TabDef[] = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ANTIPASTI
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    label: "Antipasti",
    slug: "antipasti",
    categories: [
      {
        slug: "antipasti-caldi",
        title: "Caldi",
        rows: [
          e("arancini-ragu", "Arancini al Ragù (3 pz)", 700, {
            description:
              "Riso, ragù di carne, piselli, mozzarella, panatura croccante",
            allergens: ["gluten", "milk", "egg"],
          }),
          e("crocchette-patate", "Crocchette di Patate (4 pz)", 550, {
            description: "Patate, provola affumicata, prezzemolo",
            allergens: ["gluten", "milk", "egg"],
          }),
          e("mozzarella-carrozza", "Mozzarella in Carrozza", 650, {
            description:
              "Mozzarella fior di latte in pastella dorata, salsa di acciughe",
            allergens: ["gluten", "milk", "egg", "fish"],
          }),
          e("frittura-paranza", "Fritturina di Paranza", 1000, {
            description:
              "Alici, gamberi e calamari fritti con maionese al limone",
            allergens: ["fish", "crustaceans", "gluten", "egg"],
          }),
          e("polpette-sugo", "Polpette al Sugo della Nonna", 800, {
            description:
              "Manzo e maiale, sugo di pomodoro San Marzano, basilico",
            allergens: ["gluten", "egg", "milk"],
            features: ["recommended"],
          }),
        ],
      },
      {
        slug: "antipasti-freddi",
        title: "Freddi",
        rows: [
          e("bruschette-miste", "Bruschette Miste (4 pz)", 800, {
            description:
              "Pomodoro e basilico, ricotta e noci, nduja, lardo e miele",
            allergens: ["gluten", "milk", "nuts"],
          }),
          e("carpaccio-manzo", "Carpaccio di Manzo", 1200, {
            description:
              "Fesa di manzo, rucola, scaglie di grana padano, olio al tartufo",
            allergens: ["milk"],
            features: ["gluten_free"],
          }),
          e("vitello-tonnato", "Vitello Tonnato", 1100, {
            description:
              "Girello di vitello cotto a bassa temperatura, salsa tonnata, capperi",
            allergens: ["fish", "egg"],
            features: ["gluten_free"],
          }),
          e("burrata-pomodorini", "Burrata e Pomodorini Datterini", 1000, {
            description:
              "Burrata pugliese su letto di pomodorini confit, pesto di basilico",
            allergens: ["milk"],
            features: ["vegetarian", "gluten_free"],
          }),
          e("tagliere-salumi", "Tagliere di Salumi", 1400, {
            description:
              "Prosciutto di Parma 24 mesi, coppa, salame, bresaola, grissini",
            allergens: ["gluten"],
          }),
          e("tagliere-formaggi", "Tagliere di Formaggi", 1400, {
            description:
              "Parmigiano 36 mesi, pecorino toscano, gorgonzola, caciocavallo, miele e confetture",
            allergens: ["milk"],
            features: ["vegetarian", "gluten_free"],
          }),
          e("tagliere-misto", "Tagliere Misto", 1800, {
            description:
              "Selezione di salumi e formaggi con miele, confetture e grissini",
            allergens: ["gluten", "milk"],
            features: ["recommended"],
          }),
        ],
      },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  PIZZE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    label: "Pizze",
    slug: "pizze",
    categories: [
      {
        slug: "classiche",
        title: "Classiche",
        rows: [
          e("margherita", "Margherita", 750, {
            description:
              "Pomodoro San Marzano, mozzarella fior di latte, basilico fresco",
            allergens: ["gluten", "milk"],
          }),
          e("marinara", "Marinara", 600, {
            description: "Pomodoro, aglio, origano, olio extravergine",
            allergens: ["gluten"],
            features: ["vegan"],
          }),
          e("napoli", "Napoli", 800, {
            description: "Pomodoro, mozzarella, acciughe, capperi, origano",
            allergens: ["gluten", "milk", "fish"],
          }),
          e("diavola", "Diavola", 900, {
            description: "Pomodoro, mozzarella, salame piccante calabrese",
            allergens: ["gluten", "milk"],
            features: ["spicy"],
          }),
          e("quattro-stagioni", "Quattro Stagioni", 1000, {
            description:
              "Pomodoro, mozzarella, prosciutto cotto, funghi, carciofi, olive",
            allergens: ["gluten", "milk"],
          }),
          e("capricciosa", "Capricciosa", 1050, {
            description:
              "Pomodoro, mozzarella, prosciutto cotto, funghi, carciofi, olive, uovo",
            allergens: ["gluten", "milk", "egg"],
          }),
          e("quattro-formaggi", "Quattro Formaggi", 1000, {
            description:
              "Mozzarella, gorgonzola DOP, fontina, parmigiano reggiano 24 mesi",
            allergens: ["gluten", "milk"],
            features: ["vegetarian"],
          }),
          e("prosciutto-funghi", "Prosciutto e Funghi", 950, {
            description:
              "Pomodoro, mozzarella, prosciutto cotto, funghi champignon trifolati",
            allergens: ["gluten", "milk"],
          }),
          e("tonno-cipolla", "Tonno e Cipolla", 900, {
            description: "Pomodoro, mozzarella, tonno, cipolla rossa di Tropea",
            allergens: ["gluten", "milk", "fish"],
          }),
          e("bufalina", "Bufalina", 1000, {
            description:
              "Pomodoro San Marzano, mozzarella di bufala campana DOP, basilico",
            allergens: ["gluten", "milk"],
            features: ["vegetarian"],
          }),
        ],
      },
      {
        slug: "speciali",
        title: "Speciali della Casa",
        rows: [
          e("tartufata", "Tartufata", 1400, {
            description:
              "Crema di tartufo nero, mozzarella di bufala, speck croccante, rucola",
            allergens: ["gluten", "milk"],
            features: ["new"],
          }),
          e("burrata-e-crudo", "Burrata e Crudo", 1350, {
            description:
              "Pomodorini datterini, burrata pugliese, prosciutto crudo di Parma 18 mesi, riduzione di balsamico",
            allergens: ["gluten", "milk"],
            features: ["recommended"],
          }),
          e("salsiccia-friarielli", "Salsiccia e Friarielli", 1100, {
            description:
              "Fior di latte, salsiccia di suino campano, friarielli saltati in padella",
            allergens: ["gluten", "milk"],
          }),
          e("pistacchio", "Pistacchio", 1300, {
            description:
              "Crema di pistacchio di Bronte, mozzarella, mortadella IGP, granella di pistacchio",
            allergens: ["gluten", "milk", "nuts"],
            features: ["new"],
          }),
          e("parmigiana-pizza", "Parmigiana", 1200, {
            description:
              "Pomodoro, mozzarella, melanzane fritte, parmigiano, basilico",
            allergens: ["gluten", "milk", "egg"],
            features: ["vegetarian"],
          }),
          e("ortolana", "Ortolana", 1050, {
            description:
              "Pomodoro, mozzarella, zucchine, melanzane, peperoni grigliati, olive",
            allergens: ["gluten", "milk"],
            features: ["vegetarian"],
          }),
        ],
      },
      {
        slug: "pizze-bianche",
        title: "Bianche",
        rows: [
          e("focaccia-rosmarino", "Focaccia al Rosmarino", 600, {
            description: "Olio EVO, sale di Maldon, rosmarino fresco",
            allergens: ["gluten"],
            features: ["vegan"],
          }),
          e("pizza-bianca-mortadella", "Bianca con Mortadella", 1000, {
            description:
              "Mozzarella, mortadella Bologna IGP, stracciatella, granella di pistacchio",
            allergens: ["gluten", "milk", "nuts"],
          }),
          e("pizza-bianca-speck", "Bianca con Speck", 1100, {
            description:
              "Mozzarella, speck Alto Adige IGP, rucola, scaglie di grana",
            allergens: ["gluten", "milk"],
          }),
        ],
      },
      {
        slug: "calzoni",
        title: "Calzoni & Fritti",
        rows: [
          e("calzone-classico", "Calzone Classico", 900, {
            description:
              "Ripieno di ricotta, mozzarella, prosciutto cotto, sugo di pomodoro",
            allergens: ["gluten", "milk", "egg"],
          }),
          e("calzone-napoletano", "Calzone Napoletano", 1000, {
            description: "Ripieno di ricotta, provola, salame, cicoli, pepe",
            allergens: ["gluten", "milk", "egg"],
          }),
          e("pizza-fritta", "Pizza Fritta Napoletana", 850, {
            description: "Impasto fritto ripieno di ricotta, provola, cicoli",
            allergens: ["gluten", "milk", "egg"],
          }),
          e("montanara", "Montanara (2 pz)", 700, {
            description:
              "Dischetti di impasto fritti, pomodoro, mozzarella, basilico",
            allergens: ["gluten", "milk"],
          }),
        ],
      },
      {
        slug: "celiache",
        title: "Senza Glutine",
        rows: [
          g(
            "Impasto con farina di riso, mais e grano saraceno — Supplemento +2,50€"
          ),
          e("margherita-gf", "Margherita Senza Glutine", 1000, {
            description: "Pomodoro, mozzarella, basilico",
            allergens: ["milk"],
            features: ["gluten_free"],
          }),
          e("ortolana-gf", "Ortolana Senza Glutine", 1150, {
            description: "Verdure grigliate di stagione, mozzarella",
            allergens: ["milk"],
            features: ["gluten_free", "vegetarian"],
          }),
          e("diavola-gf", "Diavola Senza Glutine", 1150, {
            description: "Pomodoro, mozzarella, salame piccante",
            allergens: ["milk"],
            features: ["gluten_free", "spicy"],
          }),
        ],
      },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  PRIMI PIATTI
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    label: "Primi Piatti",
    slug: "primi-piatti",
    categories: [
      {
        slug: "pasta",
        title: "Pasta",
        rows: [
          g("Tradizione Romana"),
          e("carbonara", "Carbonara", 1300, {
            description:
              "Rigatoni, guanciale croccante, pecorino romano DOP, tuorlo d'uovo",
            allergens: ["gluten", "egg", "milk"],
            features: ["recommended"],
          }),
          e("cacio-e-pepe", "Cacio e Pepe", 1200, {
            description:
              "Tonnarelli freschi, pecorino romano, pepe nero macinato al momento",
            allergens: ["gluten", "milk"],
          }),
          e("amatriciana", "Amatriciana", 1250, {
            description:
              "Bucatini, pomodoro San Marzano, guanciale, pecorino romano",
            allergens: ["gluten", "milk"],
          }),
          e("gricia", "Gricia", 1250, {
            description: "Rigatoni, guanciale, pecorino romano, pepe nero",
            allergens: ["gluten", "milk"],
          }),
          g("Pasta Fresca"),
          e("pappardelle-cinghiale", "Pappardelle al Ragù di Cinghiale", 1400, {
            description:
              "Pappardelle all'uovo, ragù di cinghiale con vino rosso e ginepro",
            allergens: ["gluten", "egg"],
          }),
          e("tagliatelle-bolognese", "Tagliatelle alla Bolognese", 1300, {
            description:
              "Tagliatelle all'uovo, ragù classico bolognese cotto 6 ore",
            allergens: ["gluten", "egg", "milk", "celery"],
          }),
          e("ravioli-ricotta-spinaci", "Ravioli Ricotta e Spinaci", 1200, {
            description:
              "Ravioli fatti in casa, burro fuso, salvia, parmigiano",
            allergens: ["gluten", "egg", "milk"],
            features: ["vegetarian"],
          }),
          e("gnocchi-sorrentina", "Gnocchi alla Sorrentina", 1100, {
            description:
              "Gnocchi di patate, sugo di pomodoro, mozzarella filante, basilico",
            allergens: ["gluten", "milk", "egg"],
            features: ["vegetarian"],
          }),
          g("Pasta di Mare"),
          e("spaghetti-vongole", "Spaghetti alle Vongole", 1500, {
            description:
              "Spaghetti, vongole veraci, aglio, prezzemolo, vino bianco",
            allergens: ["gluten", "shellfish"],
            features: ["recommended"],
          }),
          e("linguine-scoglio", "Linguine allo Scoglio", 1600, {
            description:
              "Linguine, cozze, vongole, gamberi, calamari, pomodorino",
            allergens: ["gluten", "crustaceans", "shellfish"],
          }),
          e(
            "paccheri-gamberi-pistacchio",
            "Paccheri Gamberi e Pistacchio",
            1500,
            {
              description:
                "Paccheri, gamberi rossi, crema di pistacchio, zeste di limone",
              allergens: ["gluten", "crustaceans", "nuts"],
              features: ["new"],
            }
          ),
        ],
      },
      {
        slug: "risotti",
        title: "Risotti",
        rows: [
          e("risotto-funghi-porcini", "Risotto ai Funghi Porcini", 1400, {
            description:
              "Carnaroli, porcini freschi, prezzemolo, parmigiano 36 mesi",
            allergens: ["milk"],
            features: ["vegetarian", "gluten_free"],
          }),
          e("risotto-zafferano", "Risotto alla Milanese", 1300, {
            description:
              "Carnaroli mantecato allo zafferano, midollo, burro e parmigiano",
            allergens: ["milk"],
            features: ["gluten_free"],
          }),
          e("risotto-frutti-di-mare", "Risotto ai Frutti di Mare", 1600, {
            description:
              "Gamberi, cozze, vongole, calamari, pomodorini e prezzemolo",
            allergens: ["crustaceans", "shellfish", "milk"],
            features: ["gluten_free"],
          }),
          e(
            "risotto-radicchio-gorgonzola",
            "Risotto Radicchio e Gorgonzola",
            1300,
            {
              description:
                "Radicchio rosso di Treviso, gorgonzola dolce DOP, noci tostate",
              allergens: ["milk", "nuts"],
              features: ["vegetarian", "gluten_free"],
            }
          ),
          e("risotto-limone-gamberi", "Risotto al Limone con Gamberi", 1500, {
            description:
              "Risotto mantecato al limone di Amalfi, gamberi rossi crudi",
            allergens: ["crustaceans", "milk"],
            features: ["gluten_free", "new"],
          }),
        ],
      },
      {
        slug: "zuppe",
        title: "Zuppe",
        rows: [
          e("ribollita", "Ribollita Toscana", 900, {
            description:
              "Cavolo nero, fagioli cannellini, pane raffermo, olio nuovo",
            allergens: ["gluten"],
            features: ["vegan"],
          }),
          e("minestrone", "Minestrone di Verdure", 800, {
            description: "Verdure di stagione, fagioli borlotti, pasta mista",
            allergens: ["gluten"],
            features: ["vegan"],
          }),
          e("zuppa-farro", "Zuppa di Farro e Legumi", 900, {
            description: "Farro perlato, lenticchie, ceci, rosmarino",
            allergens: ["gluten"],
            features: ["vegan"],
          }),
        ],
      },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  SECONDI & CONTORNI
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    label: "Secondi & Contorni",
    slug: "secondi-contorni",
    categories: [
      {
        slug: "carne",
        title: "Carne",
        rows: [
          g("Alla Griglia"),
          e("tagliata-manzo", "Tagliata di Manzo", 1800, {
            description:
              "Controfiletto alla brace, rucola, scaglie di grana, pomodorini",
            allergens: ["milk"],
            features: ["gluten_free"],
          }),
          e("bistecca-fiorentina", "Bistecca alla Fiorentina", 4500, {
            description:
              "Razza chianina, frollata 30 giorni, al kg — servita al sangue",
            priceLabel: "al kg",
            features: ["gluten_free", "recommended"],
          }),
          e("costolette-agnello", "Costolette d'Agnello", 1900, {
            description:
              "Scottadito alla brace, erbe aromatiche, olio al rosmarino",
            features: ["gluten_free"],
          }),
          e("pollo-alla-griglia", "Pollo alla Griglia", 1300, {
            description: "Petto di pollo marinato alle erbe, limone e olio EVO",
            features: ["gluten_free"],
          }),
          g("In Padella"),
          e("saltimbocca-alla-romana", "Saltimbocca alla Romana", 1600, {
            description:
              "Scaloppine di vitello, prosciutto crudo, salvia, vino bianco",
            allergens: ["milk"],
          }),
          e("scaloppine-limone", "Scaloppine al Limone", 1400, {
            description: "Fettine di vitello, limone, capperi, burro",
            allergens: ["gluten", "milk"],
          }),
          e("ossobuco-milanese", "Ossobuco alla Milanese", 1800, {
            description:
              "Stinco di vitello brasato, gremolata di prezzemolo e scorza di limone",
            allergens: ["celery"],
            features: ["gluten_free"],
          }),
          e("polpettone-forno", "Polpettone al Forno", 1300, {
            description: "Manzo e suino, cuore di provola, sugo di pomodoro",
            allergens: ["gluten", "milk", "egg"],
          }),
        ],
      },
      {
        slug: "pesce",
        title: "Pesce",
        rows: [
          e("branzino-al-forno", "Branzino al Forno", 1800, {
            description:
              "Branzino intero con patate, olive taggiasche, capperi e pomodorini",
            allergens: ["fish"],
            features: ["gluten_free"],
          }),
          e("orata-acqua-pazza", "Orata all'Acqua Pazza", 1700, {
            description: "Orata, pomodorini, olive, capperi, aglio, prezzemolo",
            allergens: ["fish"],
            features: ["gluten_free"],
          }),
          e("salmone-crosta-erbe", "Salmone in Crosta di Erbe", 1600, {
            description:
              "Filetto di salmone, panatura alle erbe, crema di zucchine",
            allergens: ["fish", "gluten"],
          }),
          e("frittura-mista", "Frittura Mista di Pesce", 1600, {
            description:
              "Calamari, gamberi, alici in pastella leggera, maionese al limone",
            allergens: ["fish", "crustaceans", "gluten", "egg"],
          }),
          e("polpo-alla-griglia", "Polpo alla Griglia", 1700, {
            description:
              "Tentacoli di polpo grigliati su crema di patate e paprika affumicata",
            allergens: ["shellfish"],
            features: ["gluten_free", "recommended"],
          }),
          e("gamberi-alla-busara", "Gamberi alla Busara", 1800, {
            description:
              "Gamberi in guazzetto di pomodoro piccante, aglio, prezzemolo, crostini",
            allergens: ["crustaceans", "gluten"],
            features: ["spicy"],
          }),
        ],
      },
      {
        slug: "contorni",
        title: "Contorni",
        rows: [
          e("patatine-fritte", "Patatine Fritte", 450, {
            description: "Patate tagliate a mano, fritte e salate",
            features: ["vegan", "gluten_free"],
          }),
          e("patate-forno", "Patate al Forno", 500, {
            description: "Patate novelle, rosmarino, aglio, olio EVO",
            features: ["vegan", "gluten_free"],
          }),
          e("insalata-mista", "Insalata Mista", 500, {
            description: "Lattuga, pomodori, carote, mais",
            features: ["vegan", "gluten_free"],
          }),
          e("insalata-rucola-grana", "Rucola, Grana e Pomodorini", 600, {
            description:
              "Rucola selvatica, scaglie di grana, pomodorini, balsamico",
            allergens: ["milk"],
            features: ["vegetarian", "gluten_free"],
          }),
          e("verdure-grigliate", "Verdure Grigliate", 550, {
            description: "Zucchine, melanzane, peperoni, olio EVO",
            features: ["vegan", "gluten_free"],
          }),
          e("spinaci-saltati", "Spinaci Saltati", 500, {
            description: "Spinaci freschi, aglio, olio, peperoncino",
            features: ["vegan", "gluten_free"],
          }),
          e("friarielli", "Friarielli Saltati", 550, {
            description: "Cime di rapa napoletane, aglio, olio, peperoncino",
            features: ["vegan", "gluten_free", "spicy"],
          }),
        ],
      },
      {
        slug: "insalatone",
        title: "Insalatone",
        rows: [
          g("Servite con pane casereccio"),
          e("insalata-caesar", "Caesar Salad", 1100, {
            description:
              "Lattuga romana, pollo grigliato, crostini, parmigiano, salsa Caesar",
            allergens: ["gluten", "milk", "egg", "fish"],
          }),
          e("insalata-mediterranea", "Mediterranea", 1000, {
            description:
              "Mista, tonno, olive taggiasche, pomodorini, cipolla, uovo sodo",
            allergens: ["fish", "egg"],
            features: ["gluten_free"],
          }),
          e("insalata-caprese", "Caprese", 900, {
            description:
              "Mozzarella di bufala, pomodoro cuore di bue, basilico, olio EVO",
            allergens: ["milk"],
            features: ["vegetarian", "gluten_free"],
          }),
          e("insalata-vegana", "Bowl Vegana", 1000, {
            description:
              "Quinoa, avocado, ceci, edamame, carote, hummus, semi misti",
            allergens: ["sesame", "soy"],
            features: ["vegan", "gluten_free"],
          }),
        ],
      },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  DOLCI
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    label: "Dolci",
    slug: "dolci",
    categories: [
      {
        slug: "dolci-casa",
        title: "Della Casa",
        rows: [
          e("tiramisu", "Tiramisù Classico", 700, {
            description: "Savoiardi, mascarpone, caffè espresso, cacao amaro",
            allergens: ["gluten", "egg", "milk"],
            features: ["recommended"],
          }),
          e("panna-cotta", "Panna Cotta", 600, {
            description:
              "Panna cotta alla vaniglia con coulis di frutti di bosco",
            allergens: ["milk"],
            features: ["gluten_free"],
          }),
          e("cheesecake", "Cheesecake del Giorno", 700, {
            description:
              "Base di biscotto, crema di formaggio, topping stagionale",
            allergens: ["gluten", "milk", "egg"],
          }),
          e("torta-cioccolato", "Torta al Cioccolato Fondente", 700, {
            description: "Cioccolato 70%, cuore morbido, gelato alla vaniglia",
            allergens: ["gluten", "milk", "egg", "soy"],
          }),
          e("cannolo-siciliano", "Cannolo Siciliano", 550, {
            description:
              "Cialda croccante, ricotta di pecora, gocce di cioccolato, pistacchio",
            allergens: ["gluten", "milk", "nuts"],
          }),
          e("delizia-limone", "Delizia al Limone", 700, {
            description:
              "Pan di spagna, crema al limone di Sorrento, meringa italiana",
            allergens: ["gluten", "egg", "milk"],
          }),
        ],
      },
      {
        slug: "gelato",
        title: "Gelato Artigianale",
        rows: [
          g("Prodotto fresco ogni giorno nel nostro laboratorio"),
          e("gelato-2-gusti", "Coppa 2 Gusti", 400, {
            description:
              "Vaniglia, cioccolato, pistacchio, stracciatella, nocciola, limone, fragola",
            allergens: ["milk", "nuts"],
          }),
          e("gelato-3-gusti", "Coppa 3 Gusti", 500, {
            description:
              "Vaniglia, cioccolato, pistacchio, stracciatella, nocciola, limone, fragola",
            allergens: ["milk", "nuts"],
          }),
          e("affogato", "Affogato al Caffè", 500, {
            description:
              "Gelato alla crema con espresso caldo versato al tavolo",
            allergens: ["milk"],
          }),
          e("sorbetto-misto", "Sorbetto Misto (3 gusti)", 500, {
            description: "Limone, mango, fragola — senza latte",
            features: ["vegan", "gluten_free"],
          }),
        ],
      },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  VINI
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    label: "Vini",
    slug: "vini",
    categories: [
      {
        slug: "rossi",
        title: "Rossi",
        rows: [
          g("Toscana"),
          e("chianti-classico", "Chianti Classico DOCG", 2200, {
            description: "Sangiovese — corpo medio, note di ciliegia e spezie",
            priceLabel: "bottiglia",
            allergens: ["sulfites"],
          }),
          e("brunello-montalcino", "Brunello di Montalcino DOCG", 5500, {
            description:
              "Sangiovese grosso — strutturato, tannini eleganti, lungo finale",
            priceLabel: "bottiglia",
            allergens: ["sulfites"],
          }),
          e("rosso-montalcino", "Rosso di Montalcino DOC", 2800, {
            description:
              "Sangiovese — fratello minore del Brunello, fruttato e immediato",
            priceLabel: "bottiglia",
            allergens: ["sulfites"],
          }),
          g("Sud Italia"),
          e("montepulciano-abruzzo", "Montepulciano d'Abruzzo DOC", 1800, {
            description:
              "Abruzzo — Fruttato, tannini morbidi, ideale con carni rosse",
            priceLabel: "bottiglia",
            allergens: ["sulfites"],
          }),
          e("nero-davola", "Nero d'Avola IGT", 2000, {
            description:
              "Sicilia — Intenso, note di prugna e cioccolato fondente",
            priceLabel: "bottiglia",
            allergens: ["sulfites"],
          }),
          e("primitivo-manduria", "Primitivo di Manduria DOC", 2200, {
            description:
              "Puglia — Caldo, avvolgente, note di frutta matura e spezie",
            priceLabel: "bottiglia",
            allergens: ["sulfites"],
          }),
          e("aglianico-vulture", "Aglianico del Vulture DOC", 2400, {
            description:
              "Basilicata — Potente, tannini decisi, grande longevità",
            priceLabel: "bottiglia",
            allergens: ["sulfites"],
          }),
          g("Piemonte"),
          e("barolo-docg", "Barolo DOCG", 4800, {
            description:
              "Nebbiolo — Re dei vini, tannini nobili, bouquet complesso",
            priceLabel: "bottiglia",
            allergens: ["sulfites"],
          }),
          e("barbera-asti", "Barbera d'Asti DOCG", 2000, {
            description:
              "Piemonte — Fruttato, acidità vivace, ottima bevibilità",
            priceLabel: "bottiglia",
            allergens: ["sulfites"],
          }),
          g("Al Calice"),
          e("rosso-calice", "Vino Rosso della Casa", 500, {
            description: "Montepulciano d'Abruzzo — calice 15 cl",
            priceLabel: "calice",
            allergens: ["sulfites"],
          }),
        ],
      },
      {
        slug: "bianchi",
        title: "Bianchi",
        rows: [
          e("vermentino-sardegna", "Vermentino di Sardegna DOC", 1900, {
            description: "Sardegna — Fresco, agrumato, perfetto con pesce",
            priceLabel: "bottiglia",
            allergens: ["sulfites"],
          }),
          e("pinot-grigio", "Pinot Grigio delle Venezie DOC", 1700, {
            description: "Veneto — Secco, delicato, note floreali",
            priceLabel: "bottiglia",
            allergens: ["sulfites"],
          }),
          e("pecorino-abruzzo", "Pecorino d'Abruzzo DOC", 2000, {
            description:
              "Abruzzo — Minerale, strutturato, ottimo con pesce e crostacei",
            priceLabel: "bottiglia",
            allergens: ["sulfites"],
          }),
          e("falanghina-campania", "Falanghina del Sannio DOC", 1800, {
            description: "Campania — Floreale, fresco, note di frutta bianca",
            priceLabel: "bottiglia",
            allergens: ["sulfites"],
          }),
          e("lugana-doc", "Lugana DOC", 2200, {
            description:
              "Lombardia/Veneto — Turbiana, elegante, note di mandorla",
            priceLabel: "bottiglia",
            allergens: ["sulfites"],
          }),
          g("Al Calice"),
          e("bianco-calice", "Vino Bianco della Casa", 500, {
            description: "Vermentino — calice 15 cl",
            priceLabel: "calice",
            allergens: ["sulfites"],
          }),
        ],
      },
      {
        slug: "rosati",
        title: "Rosati",
        rows: [
          e("cerasuolo-abruzzo", "Cerasuolo d'Abruzzo DOC", 1800, {
            description:
              "Abruzzo — Montepulciano vinificato in rosa, ciliegia e freschezza",
            priceLabel: "bottiglia",
            allergens: ["sulfites"],
          }),
          e("chiaretto-bardolino", "Chiaretto di Bardolino DOC", 1900, {
            description: "Veneto — Delicato, floreale, ideale come aperitivo",
            priceLabel: "bottiglia",
            allergens: ["sulfites"],
          }),
        ],
      },
      {
        slug: "bollicine",
        title: "Bollicine",
        rows: [
          e("prosecco-valdobbiadene", "Prosecco Valdobbiadene DOCG", 2200, {
            description: "Veneto — Perlage fine, fresco e fruttato",
            priceLabel: "bottiglia",
            allergens: ["sulfites"],
          }),
          e("franciacorta-brut", "Franciacorta Brut DOCG", 3200, {
            description:
              "Lombardia — Metodo classico, elegante, note di lievito e agrumi",
            priceLabel: "bottiglia",
            allergens: ["sulfites"],
          }),
          e("trento-doc-brut", "Trento DOC Brut", 2800, {
            description:
              "Trentino — Metodo classico, fresco, perlage persistente",
            priceLabel: "bottiglia",
            allergens: ["sulfites"],
          }),
          g("Al Calice"),
          e("prosecco-calice", "Prosecco", 600, {
            description: "Valdobbiadene — calice 15 cl",
            priceLabel: "calice",
            allergens: ["sulfites"],
          }),
        ],
      },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  COCKTAIL & APERITIVI
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    label: "Cocktail & Aperitivi",
    slug: "cocktail-aperitivi",
    categories: [
      {
        slug: "spritz-aperitivi",
        title: "Spritz & Aperitivi",
        rows: [
          e("aperol-spritz", "Aperol Spritz", 700, {
            description: "Aperol, prosecco, soda, fetta d'arancia",
            allergens: ["sulfites"],
          }),
          e("campari-spritz", "Campari Spritz", 700, {
            description: "Campari, prosecco, soda",
            allergens: ["sulfites"],
          }),
          e("hugo", "Hugo", 750, {
            description:
              "Sciroppo di fiori di sambuco, prosecco, soda, menta fresca",
            allergens: ["sulfites"],
          }),
          e("spritz-select", "Spritz Select", 750, {
            description:
              "Select, prosecco, soda — lo spritz veneziano originale",
            allergens: ["sulfites"],
          }),
          e("americano", "Americano", 700, {
            description: "Campari, vermut rosso, soda, scorza d'arancia",
          }),
          e("negroni-sbagliato", "Negroni Sbagliato", 800, {
            description: "Campari, vermut rosso, prosecco",
            allergens: ["sulfites"],
          }),
        ],
      },
      {
        slug: "classici",
        title: "Classici",
        rows: [
          e("negroni", "Negroni", 900, {
            description: "Gin, Campari, vermut rosso, scorza d'arancia",
          }),
          e("gin-tonic", "Gin Tonic", 850, {
            description:
              "Gin premium, acqua tonica Fever-Tree, cetriolo o ginepro",
          }),
          e("moscow-mule", "Moscow Mule", 900, {
            description:
              "Vodka, ginger beer, lime fresco, servito in copper mug",
          }),
          e("mojito", "Mojito", 900, {
            description:
              "Rum bianco, lime, menta fresca, zucchero di canna, soda",
          }),
          e("margarita", "Margarita", 900, {
            description: "Tequila, Cointreau, succo di lime, bordo di sale",
          }),
          e("old-fashioned", "Old Fashioned", 1000, {
            description:
              "Bourbon, angostura bitters, zucchero, scorza d'arancia",
            features: ["recommended"],
          }),
          e("whiskey-sour", "Whiskey Sour", 900, {
            description: "Bourbon, succo di limone, sciroppo, albume d'uovo",
            allergens: ["egg"],
          }),
          e("daiquiri", "Daiquiri", 900, {
            description: "Rum bianco, lime, sciroppo di zucchero",
          }),
          e("aperol-sour", "Aperol Sour", 850, {
            description: "Aperol, limone, sciroppo, albume d'uovo",
            allergens: ["egg"],
          }),
        ],
      },
      {
        slug: "signature",
        title: "Signature Elisir",
        rows: [
          g("Creazioni del nostro bartender"),
          e("elisir-del-tramonto", "Elisir del Tramonto", 1100, {
            description:
              "Mezcal, Aperol, passion fruit, lime, peperoncino — il nostro best seller",
            features: ["spicy", "recommended"],
          }),
          e("giardino-segreto", "Giardino Segreto", 1000, {
            description: "Gin, cetriolo, basilico, elderflower, tonica premium",
          }),
          e("vulcano-rosso", "Vulcano Rosso", 1100, {
            description:
              "Tequila, succo di melograno, jalapeño, lime, sale affumicato",
            features: ["spicy", "new"],
          }),
          e("dolce-vita", "Dolce Vita", 1000, {
            description:
              "Vodka, liquore di limoncello, prosecco, menta, lamponi freschi",
            allergens: ["sulfites"],
          }),
        ],
      },
      {
        slug: "analcolici-cocktail",
        title: "Mocktail",
        rows: [
          e("virgin-mojito", "Virgin Mojito", 600, {
            description: "Lime, menta fresca, zucchero di canna, soda",
          }),
          e("nojito", "Nojito alla Fragola", 600, {
            description: "Fragole fresche, lime, menta, sciroppo, soda",
          }),
          e("shirley-temple", "Shirley Temple", 550, {
            description: "Ginger ale, granatina, ciliegia, lime",
          }),
          e("sunset-spritz-0", "Sunset Spritz 0.0%", 600, {
            description: "Crodino, soda, arancia, rosmarino",
          }),
        ],
      },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  BIBITE & CAFFÈ
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    label: "Bibite & Caffè",
    slug: "bibite-caffe",
    categories: [
      {
        slug: "analcolici",
        title: "Analcolici",
        rows: [
          g("Bevande Classiche"),
          e("coca-cola", "Coca-Cola", 350),
          e("coca-cola-zero", "Coca-Cola Zero", 350),
          e("fanta", "Fanta", 350),
          e("sprite", "Sprite", 350),
          e("chinotto", "Chinotto Lurisia", 400, {
            description: "Chinotto artigianale piemontese",
          }),
          e("aranciata-sanpellegrino", "Aranciata Sanpellegrino", 350),
          g("Acqua"),
          e("acqua-naturale", "Acqua Naturale", 250, { description: "75 cl" }),
          e("acqua-frizzante", "Acqua Frizzante", 250, {
            description: "75 cl",
          }),
          e("acqua-litro", "Acqua (1 L)", 350, {
            description: "Naturale o frizzante",
          }),
          g("Succhi & Centrifughe"),
          e("succo-di-frutta", "Succo di Frutta", 300, {
            description: "Pesca, albicocca, pera o ACE",
          }),
          e("spremuta-arancia", "Spremuta d'Arancia Fresca", 450, {
            description: "Arance siciliane spremute al momento",
          }),
          e("centrifuga-verde", "Centrifuga Verde", 550, {
            description: "Mela verde, sedano, zenzero, limone",
          }),
          e("centrifuga-rossa", "Centrifuga Rossa", 550, {
            description: "Carota, arancia, barbabietola, zenzero",
          }),
        ],
      },
      {
        slug: "birre",
        title: "Birre",
        rows: [
          g("Alla Spina — 40 cl"),
          e("birra-moretti", "Birra Moretti", 500, {
            description: "Lager italiana classica",
            priceLabel: "40 cl",
            allergens: ["gluten"],
          }),
          e("birra-peroni", "Peroni Nastro Azzurro", 500, {
            description: "Lager premium italiana",
            priceLabel: "40 cl",
            allergens: ["gluten"],
          }),
          g("In Bottiglia"),
          e("birra-ipa", "IPA Artigianale", 600, {
            description: "Birrificio locale — luppolata, agrumata, 33 cl",
            priceLabel: "33 cl",
            allergens: ["gluten"],
          }),
          e("birra-weiss", "Weiss Bavarese", 600, {
            description:
              "Birra di frumento, banana e chiodi di garofano, 50 cl",
            priceLabel: "50 cl",
            allergens: ["gluten"],
          }),
          e("birra-senza-glutine", "Birra Senza Glutine", 550, {
            description: "Peroni Senza Glutine, 33 cl",
            priceLabel: "33 cl",
            features: ["gluten_free"],
          }),
          e("birra-analcolica", "Birra Analcolica", 450, {
            description: "Tourtel, 33 cl",
            priceLabel: "33 cl",
            allergens: ["gluten"],
          }),
        ],
      },
      {
        slug: "caffetteria",
        title: "Caffetteria",
        rows: [
          g("Caffè"),
          e("caffe-espresso", "Caffè Espresso", 150),
          e("caffe-doppio", "Caffè Doppio", 250),
          e("caffe-lungo", "Caffè Lungo", 150),
          e("caffe-decaffeinato", "Caffè Decaffeinato", 150),
          e("caffe-macchiato", "Caffè Macchiato", 180, {
            description: "Caldo o freddo",
            allergens: ["milk"],
          }),
          e("caffe-corretto", "Caffè Corretto", 250, {
            description: "Con grappa, sambuca o amaro a scelta",
          }),
          e("caffe-shakerato", "Caffè Shakerato", 350, {
            description: "Espresso, ghiaccio, zucchero — shakerato al momento",
          }),
          g("Latte & Cioccolata"),
          e("cappuccino", "Cappuccino", 200, {
            description: "Espresso, latte montato a crema",
            allergens: ["milk"],
          }),
          e("latte-macchiato", "Latte Macchiato", 250, {
            description: "Latte caldo con macchia di caffè",
            allergens: ["milk"],
          }),
          e("cioccolata-calda", "Cioccolata Calda", 350, {
            description: "Cioccolato fondente, panna montata",
            allergens: ["milk"],
          }),
          g("Tè & Tisane"),
          e("te-infuso", "Tè / Infuso", 300, {
            description: "Earl Grey, verde, camomilla, menta, frutti di bosco",
          }),
          e("te-freddo", "Tè Freddo", 300, {
            description: "Pesca o limone — fatto in casa",
          }),
          g("Amari & Digestivi"),
          e("amaro-del-capo", "Amaro del Capo", 400),
          e("limoncello", "Limoncello", 400, {
            description: "Fatto in casa con limoni di Sorrento",
          }),
          e("grappa-barricata", "Grappa Barricata", 500, {
            description: "Invecchiata in botti di rovere",
          }),
          e("sambuca", "Sambuca", 400),
          e("fernet-branca", "Fernet Branca", 400),
          e("mirto", "Mirto di Sardegna", 400, {
            description: "Rosso o bianco",
          }),
        ],
      },
    ],
  },
];

// ── Seed function ────────────────────────────────────────────
async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  const db = drizzle(process.env.DATABASE_URL);
  const now = new Date();

  console.info("🌱 Seeding database...");

  // ── 1. User ──────────────────────────────────────────────
  const [seedUser] = await db
    .insert(user)
    .values({
      name: "Elisir Owner",
      email: "owner@elisir.test",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  await db.insert(account).values({
    accountId: seedUser.id,
    providerId: "credential",
    userId: seedUser.id,
    password: await hashPassword("password123"),
    createdAt: now,
    updatedAt: now,
  });

  // ── 1b. Super Admin User ─────────────────────────────────
  const [adminUser] = await db
    .insert(user)
    .values({
      name: "Avo Admin",
      email: "admin@avo.test",
      emailVerified: true,
      role: "superadmin",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  await db.insert(account).values({
    accountId: adminUser.id,
    providerId: "credential",
    userId: adminUser.id,
    password: await hashPassword("admin123"),
    createdAt: now,
    updatedAt: now,
  });

  console.info("  ✓ Super admin created: admin@avo.test / admin123");

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

  // ── 2b. Default locale ────────────────────────────────────
  await db.insert(venueLocale).values({
    venueId: seedVenue.id,
    locale: "it",
    isEnabled: true,
    sortOrder: 0,
  });

  console.info("  ✓ Default locale (it) created");

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
      name: "Menu Principale",
      slug: "menu-principale",
      status: "published",
      publishedAt: now,
    })
    .returning();

  const menuId = seedMenu.id;
  const venueId = seedVenue.id;

  // ── 5. Tabs, Categories, Items, Entries ──────────────────
  let totalItems = 0;
  let totalGroups = 0;
  let totalCategories = 0;

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

      totalCategories++;

      for (const [rowIndex, row] of catDef.rows.entries()) {
        if (row.kind === "group") {
          await db.insert(menuEntry).values({
            menuId,
            categoryId: cat.id,
            kind: "group",
            title: row.title,
            sortOrder: rowIndex,
          });
          totalGroups++;
          continue;
        }

        const [item] = await db
          .insert(catalogItem)
          .values({
            venueId,
            slug: row.slug,
            title: row.title,
            description: row.description ?? null,
            priceCents: row.priceCents,
            priceLabel: row.priceLabel ?? null,
            allergens:
              (row.allergens as typeof catalogItem.$inferInsert.allergens) ??
              [],
            features:
              (row.features as typeof catalogItem.$inferInsert.features) ?? [],
            additives:
              (row.additives as typeof catalogItem.$inferInsert.additives) ??
              [],
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

  console.info("✅ Seed complete!");
  console.info(`   Venue:      ${seedVenue.name} (${seedVenue.slug})`);
  console.info(`   Menu:       ${seedMenu.name} (${seedMenu.slug})`);
  console.info(`   Tabs:       ${TABS.length}`);
  console.info(`   Categories: ${totalCategories}`);
  console.info(`   Items:      ${totalItems}`);
  console.info(`   Groups:     ${totalGroups}`);
  console.info(`   User:       ${seedUser.email}`);

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed");
  console.error(err);
  process.exit(1);
});
