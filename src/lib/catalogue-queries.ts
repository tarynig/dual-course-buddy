import { queryOptions } from "@tanstack/react-query";
import { getCatalogue } from "./catalogue.functions";

export const catalogueQueryOptions = queryOptions({
  queryKey: ["catalogue"],
  queryFn: () => getCatalogue(),
});
