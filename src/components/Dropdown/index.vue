<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { defineProps } from "vue";
import type { IDropdownItem } from "~/@schemas/dropdown";
import { DotsHorizontalIcon, DropdownMenuIcon } from "@radix-icons/vue";
import { cx } from "class-variance-authority";
import type { ButtonVariants } from "../ui/button";
import DropdownMenuItems from "./Items.vue"; // Importing the new component

type Props = {
  items: IDropdownItem[];
  trigger?: "dots" | "dropdown";
  triggerClass?: string;
  buttonClass?: string;
  buttonVariant?: ButtonVariants["variant"];
  buttonSize?: ButtonVariants["size"];
};

// Default props
const props = withDefaults(defineProps<Props>(), {
  buttonVariant: "ghost",
  buttonSize: "icon",
});
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child :class="cx(props.triggerClass)">
      <UiButton
        type="button"
        :size="buttonSize"
        :variant="buttonVariant"
        :class="cx(props.buttonClass)"
      >
        <component
          v-if="trigger === 'dots'"
          :is="DotsHorizontalIcon"
          class="h-5 w-5"
        />
        <component
          v-if="trigger === 'dropdown'"
          :is="DropdownMenuIcon"
          class="h-5 w-5"
        />
        <slot />
      </UiButton>
    </DropdownMenuTrigger>

    <DropdownMenuContent side="bottom">
      <DropdownMenuItems :items="props.items" />
    </DropdownMenuContent>
  </DropdownMenu>
</template>
