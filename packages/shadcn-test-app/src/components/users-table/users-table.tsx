import { Plus } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { Button } from "@/components/ui/button";
import { useDataTable } from "@/hooks/use-data-table";
import { demoUsers } from "@/data/users";
import { userColumns } from "./users-table-columns";

export function UsersTable() {
  const { table } = useDataTable({
    columns: userColumns,
    data: demoUsers,
    manual: false,
    queryKeys: {
      page: "usersPage",
      perPage: "usersPerPage",
      sort: "usersSort",
      filters: "usersFilters",
      joinOperator: "usersJoinOperator",
    },
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
    },
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table}>
        <Button
          variant="default"
          size="sm"
          onClick={() => console.info("[shadcn-test-app] Create person")}
        >
          <Plus className="size-4" />
          Create person
        </Button>
      </DataTableToolbar>
    </DataTable>
  );
}
