import { useState, useMemo, useEffect } from "react";
import type { Question } from "@/types/quiz";
import { searchQuestionIds } from "@/model";

export enum QuestionSortType {
  ContentAsc = "contentAsc",
  ContentDesc = "contentDesc",
  TypeAsc = "typeAsc",
  TypeDesc = "typeDesc",
  DateAsc = "dateAsc",
  DateDesc = "dateDesc",
}

interface UseQuestionListSectionProps {
  questions: Question[];
}

export function useQuestionListSection({ questions }: UseQuestionListSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortType, setSortType] = useState<QuestionSortType>(QuestionSortType.ContentAsc);
  const [backendSearchMatches, setBackendSearchMatches] = useState<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const runSearch = async () => {
      const matches = await searchQuestionIds(searchQuery);
      if (!cancelled) {
        setBackendSearchMatches(matches);
      }
    };

    if (!searchQuery.trim()) {
      setBackendSearchMatches(null);
      return;
    }

    void runSearch();

    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

  const filteredQuestions = useMemo(() => {
    let filtered = questions;
    if (searchQuery.trim()) {
      filtered = filtered.filter((q) =>
        q.content.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      if (backendSearchMatches) {
        filtered = filtered.filter((q) => backendSearchMatches.has(q.id));
      }
    }

    return [...filtered].sort((a, b) => {
      switch (sortType) {
        case QuestionSortType.ContentAsc:
          return a.content.localeCompare(b.content);
        case QuestionSortType.ContentDesc:
          return b.content.localeCompare(a.content);
        case QuestionSortType.TypeAsc:
          return a.type.localeCompare(b.type);
        case QuestionSortType.TypeDesc:
          return b.type.localeCompare(a.type);
        case QuestionSortType.DateAsc:
          return (a.createdAt || 0) - (b.createdAt || 0);
        case QuestionSortType.DateDesc:
          return (b.createdAt || 0) - (a.createdAt || 0);
        default:
          return a.content.localeCompare(b.content);
      }
    });
  }, [questions, searchQuery, sortType, backendSearchMatches]);

  return {
    searchQuery,
    setSearchQuery,
    sortType,
    setSortType,
    filteredQuestions,
  };
}
