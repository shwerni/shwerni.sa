"use client";
// React & Next
import React from "react";

// packages
import { useQueryState } from "nuqs";

// components
import { Label } from "@/components/ui/label";
import SearchInput from "@/components/clients/shared/search-input";
// utils

// prisma types

// hooks
import { useDebounced } from "@/hooks/debounced";

// icons
const Search = () => {
  // search
  const [search, setSearch] = useQueryState("search", {
    defaultValue: "",
    clearOnDefault: true,
    shallow: false,
  });
  
  // local input state
  const [searchInput, setSearchInput] = React.useState(search);

  // debounce
  const debounced = useDebounced(searchInput, 500);

  // update local search
  React.useEffect(() => {
    setSearchInput(search);
  }, [search]);

  React.useEffect(() => {
    // debounced search
    updateSearch(debounced || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, setSearch]);

  // update search
  function updateSearch(value: string | null) {
    setSearch(value?.trim() || null);
  }
  return (
    <div className="w-11/12 space-y-3">
      <Label>البحث</Label>
      <SearchInput
        defaultValue={searchInput}
        placeholder="...ابحث"
        onChange={(e) => setSearchInput(e.target.value)}
      />
    </div>
  );
};

export default Search;
