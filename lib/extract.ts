import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { resolveState } from "./nigeria";
import type { ValyuArticle } from "./valyu";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export function isAIExtractionEnabled(): boolean {
  return !!openai;
}

const ExtractionSchema = z.object({
  isMassWedding: z
    .boolean()
    .describe(
      "True only if the article is about a mass/collective wedding ceremony in Nigeria where many couples are married in one organised event. False for ordinary weddings, celebrity weddings, or articles that merely mention one in passing."
    ),
  held: z
    .boolean()
    .describe(
      "True if the ceremony has already taken place. False if the article only announces, plans, budgets for, or screens couples for a future edition."
    ),
  state: z.string().nullable().describe("The Nigerian state where the ceremony took place, e.g. 'Kano'"),
  city: z
    .string()
    .nullable()
    .describe("The town, city or LGA hosting the ceremony, if named. Null if only the state is known."),
  date: z
    .string()
    .nullable()
    .describe(
      "Date of the ceremony in YYYY-MM-DD form. Use YYYY-MM if only the month is known, YYYY if only the year. Prefer the ceremony date over the publication date."
    ),
  couples: z
    .number()
    .nullable()
    .describe("Number of couples married in this edition. Null if not stated. If the article gives brides and grooms separately, report the number of couples."),
  costNaira: z
    .number()
    .nullable()
    .describe("Total reported public spend on the programme, as a plain naira number. 'N1.5bn' becomes 1500000000. Null if not stated."),
  dowryPerBrideNaira: z
    .number()
    .nullable()
    .describe("Dowry or cash paid to each bride, as a plain naira number. Null if not stated."),
  sponsor: z.string().nullable().describe("Name of the organising or funding body, e.g. 'Kano State Hisbah Board'"),
  sponsorType: z
    .enum([
      "state-government",
      "hisbah",
      "federal",
      "lga",
      "emirate",
      "philanthropist",
      "ngo",
      "religious-body",
      "unknown",
    ])
    .describe("Category of the sponsor. Use 'hisbah' when a Hisbah board runs it, even if the state funds it."),
  beneficiaries: z
    .enum([
      "low-income",
      "widows",
      "divorcees",
      "orphans",
      "displaced",
      "disabled",
      "students",
      "mixed",
      "unknown",
    ])
    .describe("The group the couples were drawn from."),
  edition: z
    .string()
    .nullable()
    .describe("Edition label if stated, e.g. '3rd edition', '12th mass wedding'. Null otherwise."),
  summary: z.string().describe("One or two factual sentences describing this specific ceremony."),
});

export type Extraction = z.infer<typeof ExtractionSchema>;

const SYSTEM_PROMPT = `You extract structured records of mass wedding ceremonies in Nigeria from news articles.

A mass wedding is a single organised ceremony that marries many couples at once, usually funded by a state government, a Hisbah board, an emirate, a philanthropist or an NGO, and usually aimed at people who cannot afford the cost of marriage.

Rules:
- Report only the ceremony the article is actually about. Ignore other editions mentioned as background.
- Distinguish a ceremony that HAS HAPPENED from one that is merely announced, budgeted or being screened for. Set "held" accordingly.
- Numbers must be exact as reported. Never estimate a couple count, a cost, or a dowry. Use null when the article does not state it.
- Report COUPLES, not people. Some outlets give the combined total of brides and grooms — "3,600 brides and grooms" or "3,000 spouses" means 1,800 and 1,500 couples respectively. Halve such totals. If the article says "1,500 couples" and "3,000 people", the answer is 1,500.
- Convert naira amounts to plain numbers: "N854m" is 854000000, "₦1.5 billion" is 1500000000, "N200,000" is 200000.
- The state is the state where the ceremony was held, not where the newspaper is based.
- If the article is not about a Nigerian mass wedding at all, set isMassWedding to false and leave the other fields null.`;

/**
 * Pull a date hint out of the URL or the article text. Many Nigerian outlets
 * date their slugs, and Valyu does not return a publication date for web results.
 */
export function dateHint(article: ValyuArticle): string | null {
  if (article.publishedDate) {
    const parsed = new Date(article.publishedDate);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }

  const fromUrl = article.url.match(/\/(20\d{2})\/(\d{1,2})(?:\/(\d{1,2}))?\//);
  if (fromUrl) {
    const [, year, month, day] = fromUrl;
    return `${year}-${month.padStart(2, "0")}-${(day ?? "01").padStart(2, "0")}`;
  }

  const months =
    "January|February|March|April|May|June|July|August|September|October|November|December";
  const longForm = article.content.match(
    new RegExp(`\\b(${months})\\s+(\\d{1,2}),?\\s+(20\\d{2})\\b`, "i")
  );
  if (longForm) {
    const parsed = new Date(`${longForm[1]} ${longForm[2]}, ${longForm[3]}`);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }

  const dayFirst = article.content.match(new RegExp(`\\b(\\d{1,2})\\s+(${months})\\s+(20\\d{2})\\b`, "i"));
  if (dayFirst) {
    const parsed = new Date(`${dayFirst[2]} ${dayFirst[1]}, ${dayFirst[3]}`);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }

  const yearOnly = article.content.match(/\b(20[12]\d)\b/);
  return yearOnly ? `${yearOnly[1]}-01-01` : null;
}

/** AI extraction for one article. Returns null when the article is off-topic or the call fails. */
export async function extractFromArticle(article: ValyuArticle): Promise<Extraction | null> {
  if (!openai) return heuristicExtraction(article);

  const hint = dateHint(article);

  try {
    const completion = await openai.chat.completions.parse({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            `Headline: ${article.title}`,
            `Outlet: ${article.outlet}`,
            hint ? `Approximate publication date: ${hint}` : "",
            "",
            `Article: ${article.content.slice(0, 6000)}`,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
      response_format: zodResponseFormat(ExtractionSchema, "mass_wedding"),
      temperature: 0,
      max_tokens: 500,
    });

    const parsed = completion.choices[0]?.message?.parsed;
    if (!parsed || !parsed.isMassWedding) return null;

    // Fall back to the hint when the article never dates the ceremony itself.
    if (!parsed.date && hint) parsed.date = hint;
    return parsed;
  } catch (error) {
    console.error(`Extraction failed for ${article.url}:`, error);
    return heuristicExtraction(article);
  }
}

const COUPLE_PATTERNS = [
  /([\d,]{2,7})\s*(?:couples|couple)/i,
  /(?:wed|weds|wedding|married|marries|marry)\s+(?:for\s+)?([\d,]{2,7})\s*(?:couples|widows|brides)/i,
  /mass wedding (?:of|for)\s+([\d,]{2,7})/i,
];

/**
 * Keyword fallback for when no OpenAI key is configured. Much blunter than the
 * AI path — it only recognises the obvious "N couples in <State>" shape.
 */
export function heuristicExtraction(article: ValyuArticle): Extraction | null {
  const text = `${article.title} ${article.content}`;
  if (!/mass\s+wedding|collective\s+wedding|mass\s+marriage/i.test(text)) return null;

  let couples: number | null = null;
  for (const pattern of COUPLE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const value = Number(match[1].replace(/,/g, ""));
      if (Number.isFinite(value) && value >= 10 && value <= 100000) {
        couples = value;
        break;
      }
    }
  }

  // First state named in the headline wins, else the first named anywhere.
  const state =
    findStateName(article.title) ?? findStateName(article.content.slice(0, 1200)) ?? null;
  if (!state) return null;

  const held = !/(to sponsor|to hold|plans|set to|will hold|fixes|approves|begins screening)/i.test(
    article.title
  );

  return {
    isMassWedding: true,
    held,
    state,
    city: null,
    date: dateHint(article),
    couples,
    costNaira: parseNairaAmount(text),
    dowryPerBrideNaira: null,
    sponsor: null,
    sponsorType: /hisbah/i.test(text) ? "hisbah" : "state-government",
    beneficiaries: /widow/i.test(text) ? "widows" : "low-income",
    edition: null,
    summary: article.title,
  };
}

function findStateName(text: string): string | null {
  const words = text.match(/\b[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?\b/g) ?? [];
  for (const word of words) {
    const state = resolveState(word);
    if (state) return state.name;
  }
  return null;
}

/** "N854m", "₦1.5 billion", "N200,000" → a plain naira number. */
export function parseNairaAmount(text: string): number | null {
  const match = text.match(/(?:₦|N)\s?([\d,.]+)\s*(bn|billion|m|million|k|thousand)?/i);
  if (!match) return null;

  const value = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(value)) return null;

  const unit = (match[2] ?? "").toLowerCase();
  if (unit.startsWith("b")) return value * 1_000_000_000;
  if (unit.startsWith("m")) return value * 1_000_000;
  if (unit.startsWith("k") || unit.startsWith("t")) return value * 1_000;
  return value >= 1000 ? value : null;
}
