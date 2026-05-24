import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

import en from "../locales/en.json";
import zh from "../locales/zh.json";
import { QUESTION_TYPE_I18N_KEYS } from "@/constants/quiz";
import { ScriptTemplate } from "@/utils/scriptParser";

type TranslationTree = Record<string, unknown>;

const sourceRoot = path.resolve(process.cwd(), "src");
const localeEntries = {
  en,
  zh,
} as const satisfies Record<string, TranslationTree>;

function flattenKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value as TranslationTree).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

function getSourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return entry.name === "__tests__" ? [] : getSourceFiles(fullPath);
    }

    return /\.(ts|tsx)$/.test(entry.name) ? [fullPath] : [];
  });
}

function isTranslationCall(node: ts.CallExpression): boolean {
  const expression = node.expression;

  if (ts.isIdentifier(expression)) {
    return expression.text === "t";
  }

  return ts.isPropertyAccessExpression(expression) && expression.name.text === "t";
}

function getStaticTranslationKey(node: ts.Expression): string | undefined {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }

  return undefined;
}

function findStaticTranslationKeys() {
  return getSourceFiles(sourceRoot).flatMap((filePath) => {
    const source = ts.createSourceFile(
      filePath,
      fs.readFileSync(filePath, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    const keys: Array<{ key: string; location: string }> = [];

    function visit(node: ts.Node): void {
      if (ts.isCallExpression(node) && isTranslationCall(node) && node.arguments.length > 0) {
        const key = getStaticTranslationKey(node.arguments[0]);

        if (key) {
          const { line, character } = source.getLineAndCharacterOfPosition(node.getStart(source));
          keys.push({
            key,
            location: `${path.relative(process.cwd(), filePath)}:${line + 1}:${character + 1}`,
          });
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(source);
    return keys;
  });
}

function formatList(items: string[]): string {
  return items.length > 0 ? items.join("\n") : "(none)";
}

describe("i18n translations", () => {
  const localeKeySets = Object.fromEntries(
    Object.entries(localeEntries).map(([locale, tree]) => [locale, new Set(flattenKeys(tree))]),
  ) as Record<keyof typeof localeEntries, Set<string>>;

  it("keeps every locale key implemented in every supported language", () => {
    const [baseLocale, ...otherLocales] = Object.keys(localeEntries) as Array<
      keyof typeof localeEntries
    >;
    const baseKeys = localeKeySets[baseLocale];

    for (const locale of otherLocales) {
      const localeKeys = localeKeySets[locale];
      const missingFromLocale = [...baseKeys].filter((key) => !localeKeys.has(key)).sort();
      const extraInLocale = [...localeKeys].filter((key) => !baseKeys.has(key)).sort();

      expect(
        missingFromLocale,
        `${locale} is missing keys from ${baseLocale}:\n${formatList(missingFromLocale)}`,
      ).toEqual([]);
      expect(
        extraInLocale,
        `${locale} has keys not present in ${baseLocale}:\n${formatList(extraInLocale)}`,
      ).toEqual([]);
    }
  });

  it("implements every statically referenced translation key", () => {
    const referencedKeys = findStaticTranslationKeys();
    const missing = referencedKeys
      .filter(({ key }) => !localeKeySets.en.has(key))
      .map(({ key, location }) => `${location} -> ${key}`)
      .sort();

    expect(missing, `Missing i18n keys:\n${formatList(missing)}`).toEqual([]);
  });

  it("implements known dynamic translation key families", () => {
    const dynamicKeys = [
      ...Object.values(QUESTION_TYPE_I18N_KEYS),
      ...Object.values(ScriptTemplate).map((template) => `convert.examples.${template}`),
    ];
    const missing = dynamicKeys.filter((key) => !localeKeySets.en.has(key)).sort();

    expect(missing, `Missing dynamic i18n keys:\n${formatList(missing)}`).toEqual([]);
  });
});
