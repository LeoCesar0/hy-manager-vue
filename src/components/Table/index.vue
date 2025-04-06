<script setup lang="ts" generic="T">
import { ref, h, defineProps } from "vue";
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  ExpandedState,
  VisibilityState,
} from "@tanstack/vue-table";
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  FlexRender,
} from "@tanstack/vue-table";
import { ArrowUpDown, ChevronDown } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { valueUpdater } from "@/lib/utils";
import type { IPaginationBody } from "@common/schemas/pagination";
import type { IPaginationResult } from "@common/schemas/pagination";

// Define props to accept data and columns
type IProps = {
  columns: ColumnDef<T>[];
  paginationBody: IPaginationBody<T>;
  paginationResult: IPaginationResult<T> | null | undefined;
  isLoading?: boolean;
};

const props = defineProps<IProps>();

const data = computed(() => {
  return props.paginationResult?.list || [];
});

const hasSearch = computed(() => {
  return typeof props.paginationBody.searchQuery === "string";
});

const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);
const columnVisibility = ref<VisibilityState>({});
const rowSelection = ref({});
const expanded = ref<ExpandedState>({});

const table = computed(() => {
  return useVueTable({
    data: data.value,
    columns: props.columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, sorting),
    onColumnFiltersChange: (updaterOrValue) =>
      valueUpdater(updaterOrValue, columnFilters),
    onColumnVisibilityChange: (updaterOrValue) =>
      valueUpdater(updaterOrValue, columnVisibility),
    onRowSelectionChange: (updaterOrValue) =>
      valueUpdater(updaterOrValue, rowSelection),
    onExpandedChange: (updaterOrValue) =>
      valueUpdater(updaterOrValue, expanded),
    state: {
      get sorting() {
        return sorting.value;
      },
      get columnFilters() {
        return columnFilters.value;
      },
      get columnVisibility() {
        return columnVisibility.value;
      },
      get rowSelection() {
        return rowSelection.value;
      },
      get expanded() {
        return expanded.value;
      },
    },
  });
});
</script>

<template>
  <div class="w-full">
    <div class="flex gap-2 flex-col items-center sm:flex-row sm:items-end py-4">
      <div
        class="filters-container grid grid-cols-1 w-full flex-1 sm:flex flex-wrap sm:flex-row sm:flex-nowrap gap-2"
      >
        <!-- FILTERS -->
        <template v-if="hasSearch">
          <div class="flex flex-col">
            <UiLabel class="mb-2"> Search </UiLabel>
            <Input
              class="w-full"
              placeholder="Search..."
              v-model="(paginationBody.searchQuery as string)"
              label="Search"
            />
          </div>
        </template>
        <slot name="filters" />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" class="hidden sm:flex ml-auto">
            Columns <ChevronDown class="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuCheckboxItem
            v-for="column in table
              .getAllColumns()
              .filter((column) => column.getCanHide())"
            :key="column.id"
            class="capitalize"
            :checked="column.getIsVisible()"
            @update:checked="
              (value) => {
                column.toggleVisibility(!!value);
              }
            "
          >
            {{ column.id }}
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
          >
            <TableHead v-for="header in headerGroup.headers" :key="header.id">
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <template v-for="row in table.getRowModel().rows" :key="row.id">
              <TableRow :data-state="row.getIsSelected() && 'selected'">
                <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                  <FlexRender
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                </TableCell>
              </TableRow>
              <TableRow v-if="row.getIsExpanded()">
                <TableCell :colspan="row.getAllCells().length">
                  {{ JSON.stringify(row.original) }}
                </TableCell>
              </TableRow>
            </template>
          </template>
          <TableRow v-else>
            <TableCell :colspan="columns.length" class="h-24 text-center">
              No results.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <div class="flex items-center justify-end space-x-2 py-4">
      <div class="flex-1 text-sm text-muted-foreground">
        <p>{{ paginationResult?.totalItems || 0 }} results</p>
        <slot name="footer-left" />
      </div>
      <div>
        <TablePagination
          v-if="paginationResult && paginationBody"
          v-bind:paginationBody="paginationBody"
          v-bind:paginationResult="paginationResult"
          :isLoading="isLoading"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.filters-container > * {
  flex: 1;
  width: 100%;
  max-width: 100%;
  @apply sm:max-w-[175px];
}
</style>
