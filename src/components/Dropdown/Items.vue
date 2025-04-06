<script setup lang="ts">
import {
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { IDropdownItem } from "~/@schemas/dropdown";
import { cn } from "~/lib/utils";

type Props = {
  items: IDropdownItem[]; // List of menu items
};

const props = defineProps<Props>();
</script>

<template>
  <template v-for="(item, index) in props.items" :key="item.label">
    <!-- Skip hidden items -->
    <template v-if="!item.hidden">
      <!-- Separator -->
      <DropdownMenuSeparator v-if="item.label === 'separator'" />
      
      <!-- Single Item -->
      <DropdownMenuItem
        v-else-if="!item.items"
        :disabled="item.disabled"
        @click="item.action"
        :class="cn({ 'cursor-not-allowed': item.disabled, 'danger-color': item.variant === 'danger' })"
      >
        <component :is="item.icon" class="mr-2 h-4 w-4" v-if="item.icon" />
        <span>{{ item.label }}</span>
        <DropdownMenuShortcut v-if="item.shortcut">{{ item.shortcut }}</DropdownMenuShortcut>
      </DropdownMenuItem>

      <!-- Submenu -->
      <DropdownMenuSub v-else>
        <DropdownMenuSubTrigger>
          <component :is="item.icon" class="mr-2 h-4 w-4" v-if="item.icon" />
          <span>{{ item.label }}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            <DropdownItems :items="item.items" />
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    </template>
  </template>
</template>
