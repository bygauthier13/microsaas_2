import { COUNTRY_OPTIONS } from "@/lib/countries";
import { Select } from "@/components/ui";
import type { ComponentProps } from "react";

export function CountrySelect({ placeholder = "—", ...props }: ComponentProps<typeof Select> & { placeholder?: string }) {
  return (
    <Select {...props}>
      <option value="">{placeholder}</option>
      {COUNTRY_OPTIONS.map((c) => (
        <option key={c.code} value={c.code}>
          {c.name}
        </option>
      ))}
    </Select>
  );
}
